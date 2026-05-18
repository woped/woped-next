---
name: add-api-endpoint
description: >-
  Add a REST API endpoint for WoPeD Next backend. Use when implementing routes in
  packages/server, shared types in packages/shared, and frontend integration. Covers
  Express routes, middleware, shared TypeScript types, and tests.
---

# Add API Endpoint

## When to use

- User asks for a new backend route, auth API, or admin endpoint
- Feature spec references `packages/server`, `packages/shared`, or `woped-next-service`

## Repository layout

**Target (monorepo — planned, see `docs/features/01-discord-auth.md`):**

```
woped-next/
  packages/
    shared/     @woped/shared  — shared TypeScript types
    server/     @woped/server  — Express API
    frontend/   @woped/frontend — Vue app
```

**Current state:** If the repo is still a single frontend package (`src/` at root, no `packages/`), **do not invent a backend in the frontend tree**. Either:

1. Complete the monorepo migration first (Issue / feature doc), then apply this skill, or
2. Implement only the frontend `fetch` client + types in `src/types/` and document that the server PR is separate.

## Before you start

1. Read the feature doc in `docs/features/` for the endpoint contract
2. Read `.cursor/rules/project.mdc` and `.cursor/rules/services.mdc`
3. Check existing routes under `packages/server/src/routes/` (once monorepo exists)

## Checklist

### 1. Shared types first (`packages/shared`)

Define request/response and domain types **once** in shared:

- [ ] Add interfaces in `packages/shared/src/types/<name>.ts`
- [ ] Export from `packages/shared/src/index.ts`
- [ ] Use plain TypeScript interfaces (no runtime dependency on Vue)

Example:

```typescript
// packages/shared/src/types/user.ts
export interface User {
  id: string
  username: string
  displayName: string
  avatar: string
  firstLoginAt: string
  lastLoginAt: string
  discordServerJoined: boolean
}
```

- [ ] Frontend imports: `import type { User } from '@woped/shared'`
- [ ] Server imports: same package name

### 2. Database / persistence (if needed)

- [ ] Schema in `packages/server/src/db/schema.ts` (SQLite per feature docs)
- [ ] CRUD helpers in `packages/server/src/db/<entity>.ts`
- [ ] Use parameterized queries; no string-concatenated SQL

### 3. Service layer (`packages/server/src/services/`)

- [ ] Business logic in a service module (e.g. `discord.ts`, `session.ts`)
- [ ] Routes stay thin: validate input → call service → return JSON
- [ ] Never log secrets (`CLIENT_SECRET`, `SESSION_SECRET`, tokens)

### 4. Route (`packages/server/src/routes/`)

- [ ] Register router in `packages/server/src/index.ts`
- [ ] RESTful paths under `/api/...`
- [ ] Use correct HTTP methods (GET read, POST create/action, DELETE remove)
- [ ] Return consistent JSON shape and appropriate status codes (400, 401, 403, 404, 500)

Example structure:

```typescript
// packages/server/src/routes/auth.ts
import { Router } from 'express'
import type { User } from '@woped/shared'

const router = Router()

router.get('/me', async (req, res) => {
  // session middleware attaches user
  res.json({ user: req.user as User })
})

export default router
```

### 5. Middleware

- [ ] `packages/server/src/middleware/auth.ts` — session validation
- [ ] `packages/server/src/middleware/admin.ts` — admin-only routes
- [ ] Apply middleware on routes that need protection
- [ ] Sessions: httpOnly cookies (see `docs/features/01-discord-auth.md`)

### 6. Configuration

- [ ] Env vars in `packages/server/src/config.ts` (read from `process.env`)
- [ ] Document new vars in feature doc and `env-definitions/.env.*` (deployment)
- [ ] No secrets committed to git

### 7. Frontend integration (`packages/frontend`)

- [ ] Pinia store or `src/services/` module for API calls
- [ ] Use `fetch` with credentials if cookies are used: `credentials: 'include'`
- [ ] Base URL from env or relative path (e.g. `/woped-next-service/api/...` behind Apache)
- [ ] Handle loading and error states in the UI
- [ ] i18n for user-facing error messages (`en.ts` + `de.ts`)

### 8. Tests

**Server:**

- [ ] Unit tests for services and DB helpers
- [ ] Integration tests for route + middleware (mock external APIs like Discord)

**Frontend:**

- [ ] Mock `fetch` in Vitest for store/service tests
- [ ] Component tests for login/error UI if applicable

### 9. Deployment (when feature requires it)

- [ ] `packages/server/Dockerfile`
- [ ] Service entry in `docker-compose.yml` (infrastructure repo if separate)
- [ ] Apache `ProxyPass` for `/woped-next-service/` (see feature docs)

### 10. Verify

From monorepo root (when workspaces exist):

```bash
npm install
npm run test:run
npm run build
```

## API design conventions

| Topic | Convention |
|-------|------------|
| Paths | `/api/<resource>`, nested for sub-resources |
| Auth | Session cookie; `/api/auth/me` for current user |
| Admin | `ADMIN_USER_IDS` env; protect with admin middleware |
| IDs | `nanoid()` for session IDs where applicable |
| Errors | `{ error: string }` or `{ message: string }` — stay consistent within the feature |

## Do not

- Duplicate `User` / DTO types in frontend and server separately
- Put Express code under `src/` in the frontend-only layout
- Expose admin routes without middleware
- Commit `.env` files with real secrets

## References

- Feature: `docs/features/01-discord-auth.md` (OAuth, routes, deployment)
- Overview: `docs/features/02-ai-development-enablement.md`
- Rules: `.cursor/rules/services.mdc`, `.cursor/rules/pinia-stores.mdc`
