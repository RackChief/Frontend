# RackChief Frontend

The Nuxt frontend uses Better Auth session cookies through the RackChief backend. It does not require Supabase or any frontend auth SDK. In same-origin Compose development, Nuxt proxies `/api/v1`, `/api/auth`, and `/mcp` to the backend.

Set `NUXT_PROXY_TARGET` and `NUXT_BACKEND_URL` only when the backend is not at its default address. Browser API requests use `credentials: include`; session state is managed server-side by Better Auth.
