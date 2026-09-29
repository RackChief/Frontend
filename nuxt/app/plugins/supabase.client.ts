import { createClient, type Session } from '@supabase/supabase-js'
import { configureApiClient } from '../../services/api/client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl
  const key = config.public.supabasePublishableKey
  const client = url && key ? createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  }) : null
  const router = useRouter()
  configureApiClient(client, config.public.apiBase, () => { void router.replace('/login') })
  const session = useState<Session | null>('auth-session', () => null)
  const ready = useState('auth-ready', () => false)
  if (client) {
    client.auth.onAuthStateChange((_event, next) => { session.value = next; ready.value = true })
    void client.auth.getSession().then(({ data }) => { session.value = data.session; ready.value = true }).catch(() => { ready.value = true })
  } else {
    ready.value = true
  }
  return { provide: { supabase: client } }
})
