# RackChief Frontend Guidance

The Nuxt frontend authenticates through RackChief Backend's Better Auth endpoints and HttpOnly session cookies. Do not add Supabase, browser-stored bearer tokens, or direct database/PostgREST access.

Use the shared API client for `/api/v1` requests with `credentials: include`. Keep backend response shapes and enums aligned with the backend OpenAPI contract. Public setup state is available from `/api/v1/setup/status`; first-admin creation belongs in the setup flow, not normal registration.

MCP remains a backend-owned endpoint with separate RackChief bearer tokens. Keep token management behind authenticated backend APIs and never persist raw MCP tokens or auth session values in frontend storage.
