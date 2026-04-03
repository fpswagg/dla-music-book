# Prisma Integration Guide

## Overview
Prisma ORM handles all database operations. The database is PostgreSQL hosted on Supabase.

## Setup

### 1. Install
```bash
npm install prisma @prisma/client
npx prisma init
```

### 2. Configure DATABASE_URL
In `.env`:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. Schema
The schema is defined in `prisma/schema.prisma`. Key models:
- UserProfile, Song, SongVersion, Author, Tag, Language
- Junction tables: SongAuthor, SongTag, SongLanguage, CollectionSong
- Supporting: Collection, Annotation, SongNote, Like, Preview, AnalyticsEvent

### 4. Migrations
```bash
# Push schema to database (development)
npx prisma db push

# Generate client
npx prisma generate

# Create migration (production)
npx prisma migrate dev --name init

# Apply migrations (production)
npx prisma migrate deploy
```

### 5. Seeding
```bash
npx prisma db seed
```
Seed data includes sample Douala hymns, authors, tags, and languages.

### 6. Prisma Studio
```bash
npx prisma studio
```
Opens a visual editor at http://localhost:5555 to browse/edit data.

## Client Singleton (src/lib/prisma.ts)
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Full-Text Search Setup
For fuzzy lyric search, enable the pg_trgm extension:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX song_version_lyrics_trgm_idx ON "SongVersion" USING gin (lyrics gin_trgm_ops);
```

Then query with:
```sql
SELECT * FROM "SongVersion" WHERE similarity(lyrics, 'search term') > 0.1 ORDER BY similarity(lyrics, 'search term') DESC;
```

Or use Prisma raw query:
```typescript
const results = await prisma.$queryRaw`
  SELECT s.*, sv.lyrics, similarity(sv.lyrics, ${query}) as score
  FROM "Song" s
  JOIN "SongVersion" sv ON sv."songId" = s.id
  WHERE similarity(sv.lyrics, ${query}) > 0.1
  ORDER BY score DESC
  LIMIT 20
`
```

## Troubleshooting
- **Connection refused:** Check DATABASE_URL and Supabase project status
- **Missing tables:** Run `npx prisma db push`
- **Type errors:** Run `npx prisma generate` after schema changes
