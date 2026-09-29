import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const target = env.VITE_PROXY_TARGET || 'http://localhost:3000'
  return {
    plugins: [react()],
    server: {
      allowedHosts: ['frontend'],
      proxy: {
        '/api': { target, changeOrigin: true },
        '/mcp': { target, changeOrigin: true },
      },
    },
  }
})
