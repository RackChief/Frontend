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
