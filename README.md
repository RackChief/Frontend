# RackChief Frontend

The RackChief V1 frontend lives in [`nuxt/`](nuxt/). It uses Nuxt 4, Vue 3, TypeScript, Nuxt UI, Nuxt Icon, Nuxt Image, and Supabase JS. Supabase is used for authentication. RackChief application data is accessed through the RackChief backend, never through Supabase application tables.

## Run with RackChief Compose

From the parent RackChief repository, copy `.env.example` to `.env`, configure the backend and Supabase values, then run:

```sh
docker compose -f docker-compose.dev.yml up --build
```

The Nuxt app opens at `http://localhost:5173` by default. `FRONTEND_PORT` changes that host and container port. The backend stays private to the Compose network. Nuxt proxies same-origin `/api/v1/*` and `/mcp` requests to it. The browser does not need a Docker hostname or backend CORS configuration.

## Standalone development

Copy `nuxt/.env.example` to `nuxt/.env` and set `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the same Supabase project used by the backend. Keep the Supabase secret key out of the frontend. Set `NUXT_PROXY_TARGET` and `NUXT_BACKEND_URL` when the backend is not at `http://localhost:3000`. The first controls the `/api/v1` proxy and Nuxt Image source; the second controls streamed `/mcp` requests. `NUXT_PUBLIC_API_BASE` is an optional browser-visible API origin override; leave it empty for same-origin access.

```sh
cd nuxt
npm ci
npm run dev
npm run typecheck
npm run build
```

The shared API client attaches the current Supabase bearer token and displays readable API errors. Nuxt route middleware protects application pages. Supabase handles session persistence and refresh. The app uses client rendering for protected inventory data.

## Routes

| Route | Purpose |
| --- | --- |
| `/login` | Supabase sign-in |
| `/assets`, `/assets/:id` | Assets and inventory detail, including hardware, rack placement, images, network, relationships, and projects |
| `/components` | Installed and spare components |
| `/locations` | Location hierarchy and assigned infrastructure |
| `/racks`, `/racks/:id` | Racks and front/rear U layout |
| `/projects`, `/projects/:id` | Project planning, work, purchases, updates, and associated assets |
| `/settings/mcp` | MCP enablement and token lifecycle |
| `/settings/about` | Version, links, and third-party attribution |

Asset and component types come from the backend. Component types are read-only in this UI. API types are maintained in `nuxt/types/api.ts` against the backend Zod/OpenAPI contract during V1 development.

## Device images and branding

Runtime branding assets are in `nuxt/public/`. The backend lazily fetches matching front/rear elevations from the NetBox Community Device Type Library and caches them in the parent repository's `.data/device-images/netbox/` directory. Users can upload per-asset PNG, JPEG, or WebP overrides stored in `.data/device-images/custom/`. The bind mount preserves both across container recreation. Nuxt Image renders signed RackChief-served image URLs; missing images use a labeled generic faceplate.
