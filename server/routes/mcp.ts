import { getHeader, proxyRequest } from 'h3'

export default defineEventHandler((event) => {
  const target = useRuntimeConfig(event).backendUrl
  const accept = getHeader(event, 'accept')
  return proxyRequest(event, `${target.replace(/\/$/, '')}/mcp`, {
    headers: accept ? { accept } : undefined,
  })
})
