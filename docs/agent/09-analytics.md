# Phase 9: Analytics System

## Goal
Build a lightweight analytics system tracking user engagement, with an admin dashboard for visualization.

## Events Tracked
- page_view: {path, referrer}
- song_view: {songId, songTitle}
- search: {query, resultCount}
- like: {songId, action: 'like'|'unlike'}
- collection_action: {collectionId, action: 'create'|'delete'|'add_song'|'request_public'}
- audio_play: {songId, versionId}

## Client-Side Tracker (src/lib/analytics/tracker.ts)
- trackEvent(eventType, metadata) — POSTs to /api/analytics
- Batches events (sends every 5s or on page unload)
- Includes userId if authenticated (from session)
- Uses navigator.sendBeacon for page unload

## Server-Side (src/lib/analytics/aggregator.ts)
- getViewsOverTime(days) — daily view counts
- getTopSongs(limit) — most viewed songs
- getTopSearches(limit) — most searched queries
- getUserGrowth(days) — new users per day
- getTotalStats() — totals for dashboard

## API Routes
- POST /api/analytics — log event (public, rate-limited)
- GET /api/admin/analytics/overview — aggregated stats
- GET /api/admin/analytics/top-songs — top songs by views
- GET /api/admin/analytics/searches — top search queries
- GET /api/admin/analytics/growth — user growth data

## Admin Analytics Page (src/app/admin/analytics/page.tsx)
- Date range selector
- Line chart: views over time (use a lightweight chart lib or CSS-based)
- Bar chart: top 10 songs by views
- List: top search queries
- StatCards: total views, unique visitors (approx), avg views/day

## Implementation Note
Use simple CSS-based charts or a very lightweight library to avoid bundle bloat. Could use recharts or just custom SVG bars.

## Files
- src/lib/analytics/tracker.ts
- src/lib/analytics/aggregator.ts
- src/app/api/analytics/route.ts
- src/app/api/admin/analytics/overview/route.ts
- src/app/api/admin/analytics/top-songs/route.ts
- src/app/api/admin/analytics/searches/route.ts
- src/app/api/admin/analytics/growth/route.ts
- src/app/admin/analytics/page.tsx
- src/components/admin/analytics-chart.tsx
- src/hooks/use-analytics.ts (client-side tracking hook)
