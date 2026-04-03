# Phase 5: Mock Data System

## Goal
Build a fallback system that lets the app run without any database or Supabase configuration by serving data from a JSON file.

## Environment Detection (src/lib/env.ts)
```typescript
type AppMode = 'full' | 'db-only' | 'mock';

function getAppMode(): AppMode {
  if (DATABASE_URL && SUPABASE_URL && SUPABASE_ANON_KEY) return 'full';
  if (DATABASE_URL) return 'db-only';
  return 'mock';
}
```

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
- signIn(email, password) -> console.log + return mock user
- signUp(data) -> console.log + return mock user
- signOut() -> console.log
- getUser() -> return mock admin user (for development convenience)

## Data Provider Pattern (src/lib/data-provider.ts)
A unified data access layer that switches between Prisma and mock:
```typescript
import { getAppMode } from './env';

export async function getSongs(filters?) {
  if (getAppMode() === 'mock') {
    return mockProvider.getSongs(filters);
  }
  return prisma.song.findMany({...});
}
```

## Mock Mode Banner
When in mock mode, show a subtle banner at top of page: "Running in demo mode — connect a database for full functionality"

## Files
- src/lib/env.ts
- src/lib/mock/data.json
- src/lib/mock/provider.ts
- src/lib/mock/auth.ts
- src/lib/data-provider.ts
- src/components/ui/mock-banner.tsx
