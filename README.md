# RackChief Frontend

The Nuxt frontend uses Better Auth session cookies through the RackChief backend. It does not require Supabase or any frontend auth SDK. In same-origin Compose development, Nuxt proxies `/api/v1`, `/api/auth`, and `/mcp` to the backend.

Set `NUXT_PROXY_TARGET` and `NUXT_BACKEND_URL` only when the backend is not at its default address. Browser API requests use `credentials: include`; session state is managed server-side by Better Auth.
# RackChief Frontend

Asset creation supports two paths: an optional offline Device Catalog browser that prefills editable hardware metadata, and Custom Asset creation for hardware absent from the catalog. Catalog selection records provenance only; created assets remain ordinary editable RackChief inventory and are not synchronized automatically when the catalog changes.
