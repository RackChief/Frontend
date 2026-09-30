import { configureApiClient } from '../../services/api/client'
export default defineNuxtPlugin(() => { const config = useRuntimeConfig(); const router = useRouter(); configureApiClient(config.public.apiBase, () => { void router.replace('/login') }); return { provide: { auth: true } } })
