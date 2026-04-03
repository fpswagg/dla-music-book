# Phase 2: Database Schema

## Goal
Define the complete Prisma schema and create seed data with sample Douala hymns.

## Models
### UserProfile
- id: UUID @default(uuid())
- supabaseUserId: String @unique
- displayName: String
- role: Role (enum USER/ADMIN) @default(USER)
- createdAt: DateTime

Relations: likes, collections, annotations, songNotes

### Song
- id: UUID
- index: Int @unique (hymn number)
- title: String
- status: SongStatus (enum DRAFT/FINISHED) @default(DRAFT)
- originalSongId: UUID? (self-reference for covers/rewrites)
- createdAt, updatedAt

Relations: versions, songAuthors, songTags, songLanguages, notes, likes, collectionSongs

### SongVersion
- id: UUID
- songId: UUID (FK)
- versionType: VersionType (enum ORIGINAL/DEMO/REWRITE)
- lyrics: String (full lyrics text)
- versionNumber: Int
- createdAt

Relations: song, previews, annotations

### Author
- id: UUID
- name: String
- bio: String?

Relations: songAuthors

### SongAuthor (junction)
- songId + authorId: composite key
- displayOrder: Int (1 = primary)

### Tag
- id: UUID
- name: String @unique
- category: TagCategory (enum MOOD/THEME/STYLE/ERA)

### SongTag (junction)
- songId + tagId: composite key

### Language
- id: UUID
- code: String @unique (fr/en/duala)
- name: String

### SongLanguage (junction)
- songId + languageId: composite key

### Preview
- id: UUID
- songVersionId: UUID (FK)
- fileUrl: String
- durationSeconds: Int
- uploadedAt: DateTime

### Collection
- id: UUID
- name: String
- description: String?
- isPublic: Boolean @default(false)
- status: CollectionStatus (enum PRIVATE/PUBLIC/PENDING_REVIEW)
- userId: UUID (FK to UserProfile)
- createdAt

### CollectionSong (junction)
- collectionId + songId: composite key
- displayOrder: Int

### Annotation
- id: UUID
- songVersionId: UUID (FK)
- lineNumber: Int
- lineText: String
- note: String
- createdById: UUID (FK to UserProfile)
- createdAt

### SongNote
- id: UUID
- songId: UUID (FK)
- content: String
- createdById: UUID (FK to UserProfile)
- createdAt

### Like
- id: UUID
- userId + songId: unique constraint
- createdAt

### AnalyticsEvent
- id: UUID
- eventType: String
- metadata: Json
- userId: UUID? (FK)
- createdAt

## Seed Data
Create prisma/seed.ts with:
- 3 languages (French, English, Duala)
- 5-8 sample tags (spiritual, banger, storytelling, love, praise, etc.)
- 3-4 authors
- 8-10 sample Douala hymns with lyrics (some DRAFT, some FINISHED)
- Sample song versions, notes, annotations
- 1 admin user profile, 2 regular user profiles

## Files
- prisma/schema.prisma
- prisma/seed.ts
- Add seed script to package.json
