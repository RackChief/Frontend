import packageJson from './package.json'

const backend = process.env.NUXT_PROXY_TARGET || 'http://localhost:3000'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-29',
  ssr: false,
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/image'],
  image: {
    domains: [new URL(backend).hostname],
    alias: { '/device-image-source/': `${backend}/api/v1/device-images/` },
  },
  ui: { fonts: false },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    backendUrl: 'http://localhost:3000',
    public: {
      apiBase: '',
      appVersion: packageJson.version,
    },
  },
  routeRules: {
    '/api/v1/**': { proxy: `${backend}/api/v1/**` },
    '/startup/**': { proxy: `${backend}/startup/**` },
    '/health': { proxy: `${backend}/health` },
    '/docs': { proxy: `${backend}/docs` },
    '/docs/**': { proxy: `${backend}/docs/**` },
    '/openapi.json': { proxy: `${backend}/openapi.json` },
    '/api/auth/**': { proxy: `${backend}/api/auth/**` },
    '/mcp': { proxy: `${backend}/mcp` },
  },
})
