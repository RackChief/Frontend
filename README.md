# RackChief Frontend

React, TypeScript, React Router, and Vite admin UI for the RackChief V1 REST API. Supabase Auth handles sign-in and session refresh. All RackChief application data comes from the backend, not the Supabase Data API.

## Configuration

Copy `.env.example` to `.env.local` for standalone development. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Supabase project used by the backend. Never use a Supabase secret key in the frontend.

The API client uses relative `/api/v1` paths by default. Vite proxies `/api` and `/mcp` to `http://localhost:3000` for standalone development. Set `VITE_PROXY_TARGET` to another backend address if needed. `VITE_API_URL` is an optional **browser-visible** origin override; leave it unset for same-origin access. Docker Compose sets the proxy target to the internal backend service automatically, so only the frontend host port is required.

## Run

```sh
npm install
npm run dev
npm run build
```

Start the RackChief backend and sign in with an existing Supabase email/password user. There is no signup or password reset page in V1. The backend requires a Supabase bearer token on `/api/v1/*`; the shared API client attaches the current session token and signs out after a 401 response. The backend owns all validation and data access.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Supabase sign-in |
| `/assets`, `/assets/:id` | Assets and inventory detail, including hardware, rack placement, network, relationships, and projects |
| `/components` | Installed and spare components |
| `/locations` | Location hierarchy and assigned infrastructure |
| `/racks`, `/racks/:id` | Racks and front/rear U layout |
| `/projects`, `/projects/:id` | Project planning, work, purchases, updates, and associated assets |
| `/settings/mcp` | MCP enablement and token lifecycle |

The router needs the deployment server to serve `index.html` for client routes. Asset types and component types come from the backend. Component types are read-only in this UI.

Runtime branding assets live in `public/` and are derived from the top-level `assets/` branding directory. The frontend currently uses handwritten API types in `src/types/api.ts` based on the backend Zod/OpenAPI schemas. The V1 contract should be checked before changing these types; OpenAPI generation can replace them after the contract stabilizes.

## Nuxt 4 V1 staging

The V1 migration lives in `nuxt/` while React remains the primary development frontend. It uses Nuxt 4, Vue 3, TypeScript, Nuxt UI, Nuxt Icon, Nuxt Image, and Supabase JS. Supabase is used for authentication. RackChief application data is accessed through the RackChief backend.

For standalone development, copy `nuxt/.env.example` to `nuxt/.env` and set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Set `NUXT_PROXY_TARGET` and `NUXT_BACKEND_URL` if the backend is not at `http://localhost:3000`. The former configures the `/api/v1` proxy and Nuxt Image's backend image source; the latter configures the streamed `/mcp` proxy. Keep the Supabase secret key out of Nuxt configuration. The browser normally uses same-origin `/api/v1` paths and the shared API client attaches its bearer token.

```sh
cd nuxt
npm ci
npm run dev
npm run typecheck
npm run build
```

From the repository root, `docker compose -f docker-compose.nuxt.dev.yml up --build` runs Nuxt on port 5175 with the private backend. The backend's image cache is bind-mounted at `.data/device-images/` in the root repository and survives container recreation. Default front/rear elevations are fetched lazily from the NetBox Community Device Type Library; users can upload per-asset PNG, JPEG, or WebP overrides. Signed image URLs are rendered through Nuxt Image, and missing images use a labeled generic faceplate.

Nuxt routes are `/login`, `/assets`, `/assets/:id`, `/components`, `/locations`, `/racks`, `/racks/:id`, `/projects`, `/projects/:id`, `/settings/mcp`, and `/settings/about`. Branding assets are in `nuxt/public/`. API types remain hand-maintained in `nuxt/types/api.ts` against the backend Zod/OpenAPI contract during V1 development. Do not query RackChief application tables directly through Supabase.
