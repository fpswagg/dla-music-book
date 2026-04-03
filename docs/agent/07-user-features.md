# Phase 7: User Features

## Goal
Implement authenticated user features: likes, private collections, request-to-publish, and user dashboard.

## Like System
- Toggle like on song cards and detail pages
- API: POST /api/likes (body: {songId}) — toggle
- Like count shown on song cards
- Liked state persisted in DB (Like model)
- Optimistic UI update

## Private Collections
- User dashboard shows "My Collections"
- Create collection: name + description
- Add/remove songs from collection
- Reorder songs within collection (drag or manual order)
- Delete collection

## Request to Publish
- Collection detail (owner view) has "Request Public" button
- Changes collection status to PENDING_REVIEW
- Admin sees pending requests in admin dashboard
- Admin approves -> status = PUBLIC, isPublic = true
- Admin rejects -> status = PRIVATE

## User Dashboard (src/app/dashboard/)
- My liked songs list (SongCards)
- My collections list with status badges
- Create new collection button
- Collection detail/edit view

## API Routes
- POST /api/likes — toggle like
- GET /api/collections/mine — user's collections
- POST /api/collections — create collection
- PUT /api/collections/[id] — update collection
- DELETE /api/collections/[id] — delete collection
- POST /api/collections/[id]/songs — add song to collection
- DELETE /api/collections/[id]/songs/[songId] — remove song
- POST /api/collections/[id]/request-public — request publication

## Files
- src/app/dashboard/page.tsx
- src/app/dashboard/layout.tsx
- src/app/dashboard/collections/page.tsx
- src/app/dashboard/collections/[id]/page.tsx
- src/app/dashboard/collections/new/page.tsx
- src/components/songs/like-button.tsx
- src/hooks/use-like.ts
- src/app/api/likes/route.ts
- src/app/api/collections/mine/route.ts
- src/app/api/collections/[id]/songs/route.ts
- src/app/api/collections/[id]/request-public/route.ts
