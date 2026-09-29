export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const { ensureSession } = useAuth()
  const session = await ensureSession()
  if (!session && to.path !== '/login') return navigateTo('/login')
  if (session && (to.path === '/login' || to.path === '/')) return navigateTo('/assets')
})
