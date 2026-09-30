export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (['/startup', '/error'].includes(to.path)) return
  try {
    const startup = await $fetch<{ phase: string }>('/startup/status')
    if (startup.phase === 'error') return navigateTo('/error')
    const health = await $fetch<{ status: string }>('/health')
    if (health.status !== 'ok' || startup.phase !== 'ready') return navigateTo('/startup')
  } catch { return navigateTo('/startup') }
  const { ensureSession } = useAuth()
  const session = await ensureSession()
  if (!session) {
    let setupRequired = false
    try { setupRequired = (await $fetch<{ setupRequired: boolean }>('/api/v1/setup/status')).setupRequired } catch { /* The login page will show the backend error. */ }
    if (setupRequired && to.path !== '/setup') return navigateTo('/setup')
    if (!setupRequired && to.path === '/setup') return navigateTo('/login')
    if (!['/login', '/setup'].includes(to.path)) return navigateTo(setupRequired ? '/setup' : '/login')
  }
  if (session && (to.path === '/login' || to.path === '/')) return navigateTo('/assets')
})
