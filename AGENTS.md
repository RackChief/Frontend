# RackChief Frontend Development Guidance

This file applies specifically to the RackChief frontend repository.

The parent workspace may contain broader guidance. For frontend work, follow this file when it is more specific.

## Frontend role

The frontend is a client of the RackChief backend.

The backend API and OpenAPI contract are the source of truth for:

- routes
- request payloads
- response shapes
- enum values
- authentication requirements
- error behavior

Do not invent backend behavior in the frontend.

If the frontend needs data or behavior that the backend does not currently provide, identify the backend gap clearly instead of creating a fake client-side workaround.

---

# Backend contract awareness

Before implementing any API-backed feature:

1. Inspect the relevant backend module in `../Backend/src/modules/`.
2. Inspect the corresponding Zod schema.
3. Inspect the matching `*.openapi.ts`.
4. Prefer `/openapi.json` or generated API types when available.
5. Use the actual V1 API contract.

The current REST API is versioned under:

```text
/api/v1
```

Do not call unversioned legacy endpoints unless the task explicitly requires it.

---

# API client architecture

Centralize backend communication.

Do not scatter raw `fetch()` calls throughout pages and components.

Prefer a structure such as:

```text
src/
  api/
  services/
  composables/
  types/
```

or the closest equivalent already used by the project.

Use:

- one shared API client
- consistent bearer-token handling
- consistent JSON parsing
- consistent error handling
- shared request/response types

If OpenAPI-generated types or a generated client are already available, use them.

Do not manually duplicate backend schemas unless necessary.

---

# Authentication

Normal user authentication is handled through Supabase Auth.

Expected flow:

```text
User
  ↓
Supabase login/session
  ↓
Supabase access token
  ↓
Authorization: Bearer <token>
  ↓
RackChief /api/v1/*
```

The frontend should:

- persist the Supabase session using the framework's normal mechanism
- attach the current access token to RackChief API requests
- handle token refresh through Supabase
- redirect unauthenticated users to login when required
- handle 401 responses cleanly

Do not:

- hard-code tokens
- store raw credentials in source
- commit test-user credentials
- bypass backend auth
- call RackChief tables directly through Supabase Data API/PostgREST

Supabase is used for authentication, not direct application-data access.

---

# Application data access

All RackChief application data should come from the RackChief backend.

Do not query these tables directly from the browser through Supabase:

- assets
- asset_types
- projects
- project_assets
- project_items
- project_updates
- MCP settings/tokens
- other RackChief domain tables

Use the RackChief REST API instead.

The frontend must not become coupled directly to the database schema.

---

# Development priority

RackChief frontend is currently pre-production.

Optimize for:

1. correct behavior
2. matching the backend contract
3. clear UX
4. simple architecture
5. fast iteration
6. maintainability

Do not add large abstractions or framework complexity unless needed.

Do not build a design system before the application needs one.

Do not add unnecessary dashboard widgets, animations, charts, or state-management libraries.

Prefer a straightforward usable interface.

---

# V1 scope

The V1 frontend should focus on the current V1 backend capabilities.

Typical V1 areas include:

- login/authentication
- assets
- asset types
- projects
- project items
- project updates
- archive/restore/delete flows
- MCP settings/token management if exposed by the backend
- basic navigation
- loading/error/empty states

Avoid adding features that do not exist in the backend contract.

---

# UI behavior

Prefer:

- simple tables
- forms
- cards
- status badges
- clear confirmation dialogs
- readable empty states
- explicit loading states
- useful error messages

Keep the interface desktop-friendly first, but avoid layouts that completely break on smaller screens.

Do not over-focus on visual polish before the feature works end-to-end.

---

# Forms

Match backend validation rules as closely as practical.

Use the same enum values as the backend.

Respect:

- required fields
- optional fields
- nullable fields
- UUIDs
- date/datetime formats
- status values
- priority values
- project item types

Do not expose internal fields for editing when the backend does not allow them, including:

- `createdAt`
- `updatedAt`
- `archivedAt`
- token hashes
- internal database IDs that the user does not need to manually edit

Frontend validation should improve UX, but backend validation remains authoritative.

---

# Error handling

Handle common backend errors consistently:

- `400` — invalid request
- `401` — unauthenticated/expired session
- `404` — resource not found
- `409` — domain conflict
- `500` — unexpected server error

Do not expose raw server stack traces or dump full response objects into the UI.

Prefer readable user-facing messages while retaining useful console diagnostics during development.

---

# State management

Keep state simple.

Do not introduce Redux, Pinia, Zustand, or another global state library unless:

1. the project already uses it, or
2. the feature clearly requires it.

Prefer:

- framework-native state
- route data
- composables/hooks
- small local stores where appropriate

Do not create global state for data that can remain page-local.

---

# Repository exploration efficiency

Keep exploration targeted.

When implementing a frontend feature:

1. inspect the current page/component
2. inspect the relevant API/service layer
3. inspect the corresponding backend route/schema
4. inspect nearby frontend patterns

Do not recursively inspect the entire Backend repository unless necessary.

Do not repeatedly reread unchanged backend files.

Use the backend only to understand the contract required for the frontend task.

---

# Backend modification policy

Do not modify `../Backend` casually while working on frontend tasks.

If a frontend feature reveals a backend gap:

1. identify the missing endpoint/field/behavior
2. explain why the frontend needs it
3. keep frontend code aligned with the current contract
4. modify the backend only if the task explicitly calls for a cross-repo change

Do not invent temporary client-only behavior that will later conflict with the real API.

---

# OpenAPI and generated types

If the frontend uses OpenAPI-generated types or clients:

- regenerate them when the backend contract changes
- do not hand-edit generated files
- keep generated code isolated from handwritten UI code

Prefer generated API types over manually copied interfaces when practical.

If generation is not configured yet, do not create an elaborate generator setup unless the task benefits from it.

---

# Development servers

Avoid unnecessary duplicate development processes.

Do not automatically launch:

- multiple frontend dev servers
- extra backend instances
- Docker Compose stacks
- mock APIs
- fake backend servers

If the existing backend is running, use it.

If the frontend dev server must be started for verification, use the project's normal command and avoid duplicate instances.

---

# Testing philosophy

Prefer focused verification.

Use the existing frontend commands such as:

```bash
npm run build
```

and, where available:

- lint
- type-check
- existing tests

For API-backed features, verify against the actual RackChief development backend rather than creating a mock backend unless explicitly requested.

Do not create elaborate E2E infrastructure for a small UI change unless the repository already uses it.

Manual verification is acceptable during early development.

---

# Environment configuration

Use environment variables for backend/Supabase configuration.

Do not hard-code:

- API base URLs
- Supabase project URLs
- Supabase keys
- tokens
- credentials

Prefer an `.env.example` for required variable names.

Never commit `.env` files containing secrets.

---

# Secrets

Never commit or intentionally expose:

- Supabase passwords
- access tokens
- refresh tokens
- MCP tokens
- API credentials
- `.env` contents

It is fine to inspect environment variable names and configuration structure.

Do not dump the full runtime environment for debugging.

---

# Git discipline

Do not commit unrelated changes.

Do not rewrite history unless explicitly asked.

Before finishing a task:

1. inspect the diff
2. ensure generated files are intentional
3. ensure no secrets were added
4. ensure the frontend build passes when practical

Do not create release tags unless explicitly requested.

---

# Visual direction

RackChief uses a restrained infrastructure-oriented visual identity.

Prefer:

- dark/navy tones
- cyan/teal accents
- clean spacing
- practical admin-style layouts
- readable typography

Avoid:

- excessive gradients
- neon-heavy styling
- distracting animation
- overly decorative dashboards

Functionality comes before polish.

---

# Hard rule for API-backed features

If you are unsure what data shape, route, enum, or behavior to use:

**Inspect the backend V1 implementation/OpenAPI contract. Do not guess.**

If the backend does not provide what is needed, report the gap instead of inventing a frontend-only API contract.
