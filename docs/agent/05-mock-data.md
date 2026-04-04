# Phase 5: Mock Data System

## Goal
Build a fallback system that lets the app run without any database or Supabase configuration by serving data from a JSON file.

## Environment Detection — Server vs Client

The app uses two separate env modules because Next.js only exposes `NEXT_PUBLIC_*` variables to client bundles. `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are server-only.

### Server: src/lib/env.ts (guarded by `import "server-only"`)
```typescript
type AppMode = 'full' | 'db-only' | 'mock';

function getAppMode(): AppMode {
  if (DATABASE_URL && SUPABASE_URL && SUPABASE_ANON_KEY) return 'full';
  if (DATABASE_URL) return 'db-only';
  return 'mock';
}
```
Used by: data-provider, auth-helpers, prisma, supabase/server, API routes, admin pages, analytics, backups.

### Client: src/lib/env.client.ts
```typescript
function isAuthAvailable(): boolean {
  return !!NEXT_PUBLIC_SUPABASE_URL && !!NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function isClientMockMode(): boolean {
  return !isAuthAvailable();
}
```
Used by: login-form, register page, supabase/client (browser client).

**Rule:** Never import `env.ts` from a `"use client"` component or from a module used in the browser. The `server-only` guard will cause a build error if this is violated.

## Mock Data JSON (src/lib/mock/data.json)
Contains the same structure as seed data:
- languages: [{id, code, name}]
- authors: [{id, name, bio}]
- tags: [{id, name, category}]
- songs: [{id, index, title, status, createdAt, updatedAt, versions: [...], authors: [...], tags: [...], languages: [...], notes: [...]}]
- collections: [{id, name, description, isPublic, status, songs: [...]}]
- users: [{id, displayName, role}]

## Mock Data Provider (src/lib/mock/provider.ts)
Exports functions matching the Prisma query patterns:
- getSongs(filters?) -> Song[]
- getSongById(id) -> Song
- searchSongs(query) -> Song[]
- getCollections(filters?) -> Collection[]
- getTags() -> Tag[]
- getAuthors() -> Author[]
- etc.

## Mock Auth (src/lib/mock/auth.ts)
Centralized mock auth used by client auth components (login-form, register page):
- signInWithEmail(email, password) -> console.log + return mock user
- signUp(email, password, displayName) -> console.log + return mock user
- signInWithOAuth(provider) -> console.log + return mock user
- signInWithPhone(phone) -> console.log + return { error: null }
- verifyOtp(phone, token) -> console.log + return mock user
- signOut() -> console.log
- getUser() -> return mock admin user (for development convenience)

## Data Provider Pattern (src/lib/data-provider.ts)
A unified data access layer that switches between Prisma and mock:
```typescript
import { isMockMode } from './env'; // server-only

export async function getSongs(filters?) {
  if (isMockMode()) {
    return mockProvider.getSongs(filters);
  }
  return prisma.song.findMany({...});
}
```

## Mock Mode Banner
When in mock mode, show a subtle banner at top of page: "Running in demo mode — connect a database for full functionality"

## Files
- src/lib/env.ts — server-only mode detection (guarded by `server-only` package)
- src/lib/env.client.ts — client-safe mode detection (NEXT_PUBLIC_* only)
- src/lib/mock/data.json
- src/lib/mock/provider.ts
- src/lib/mock/auth.ts — centralized mock auth for client components
- src/lib/data-provider.ts
- src/components/ui/mock-banner.tsx
