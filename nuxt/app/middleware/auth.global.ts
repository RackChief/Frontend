export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const { ensureSession } = useAuth()
  const session = await ensureSession()
  if (!session && !['/login', '/setup'].includes(to.path)) return navigateTo('/login')
  if (session && (to.path === '/login' || to.path === '/')) return navigateTo('/assets')
})
