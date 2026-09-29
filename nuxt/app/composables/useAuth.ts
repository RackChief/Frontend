import type { Session } from '@supabase/supabase-js'

export function useAuth() {
  const { $supabase } = useNuxtApp()
  const session = useState<Session | null>('auth-session', () => null)
  const ready = useState('auth-ready', () => false)
  async function ensureSession() {
    if (!$supabase) { ready.value = true; return null }
    if (!ready.value) {
      const { data } = await $supabase.auth.getSession()
      session.value = data.session
      ready.value = true
    }
    return session.value
  }
  async function accessToken() {
    if (!$supabase) return null
    const { data } = await $supabase.auth.getSession()
    session.value = data.session
    return data.session?.access_token || null
  }
  async function signIn(email: string, password: string) {
    if (!$supabase) throw new Error('Supabase authentication is not configured.')
    const { data, error } = await $supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
  }
  async function signOut() {
    await $supabase?.auth.signOut()
    session.value = null
    await navigateTo('/login')
  }
  return { client: $supabase, session, ready, ensureSession, accessToken, signIn, signOut }
}
