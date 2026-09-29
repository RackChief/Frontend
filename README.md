# RackChief Frontend

React, TypeScript, and Vite admin UI for the RackChief V1 API.

## Run locally

1. Copy `.env.example` to `.env.local` and set the API URL and the **publishable** Supabase URL/key used by the backend. Never put the Supabase secret key in this app.
2. Run `npm install` and `npm run dev` in `Frontend/`.
3. Start the backend and sign in with an existing Supabase email/password user. This UI intentionally has no signup or password reset flow.

`npm run build` checks TypeScript and produces `dist/`. The default API URL is `http://localhost:3000`. The app uses `/api/v1` and needs the server to serve `index.html` for client routes such as `/assets/:id` and `/projects/:id`.

API models in `src/types/api.ts` mirror the Zod schemas in `Backend/src/modules/`. Asset types are read only in V1. Archive and restore use dedicated endpoints; permanent deletion is offered only after archiving.
