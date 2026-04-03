# Phase 6: Public Pages

## Goal
Build all public-facing pages: home, song catalog, song detail, and public collections.

## Pages

### Home (src/app/(public)/page.tsx)
- Hero section with app title "Douala Hymn Book" in Georgia, subtitle, and search bar
- Featured songs section (latest finished songs, shown as SongCards)
- Quick language filter pills (Duala, French, English)
- "Browse All Songs" link
- Stats summary (total songs, total collections)

### Song Catalog (src/app/(public)/songs/page.tsx)
- SearchBar at top with fuzzy lyric search capability
- FilterPills for: languages, mood tags, status, authors
- SongCard grid (responsive: 1 col mobile, 2 cols tablet, 3 cols desktop)
- Pagination or infinite scroll
- URL query params for filters (?q=, &lang=, &mood=, &author=)
- Empty state for no results

### Song Detail (src/app/(public)/songs/[id]/page.tsx)
- Song title (Georgia, large) + index number
- Author(s) with primary highlighted
- Status badge + language tags + mood tags
- Version selector (tabs or dropdown) if multiple versions
- Lyrics display: each line numbered, annotated lines highlighted in amber
- Click annotated line to expand annotation below it
- Audio player if preview exists
- Song notes section ("What sparked this song")
- Share button (copy link) + Print button
- Like button (if authenticated)
- Related songs (same author or tags)
- OG meta tags for sharing

### Public Collections (src/app/(public)/collections/page.tsx)
- Grid of public collections
- Each card: name, description snippet, song count
- Click to view collection detail

### Collection Detail (src/app/(public)/collections/[id]/page.tsx)
- Collection name + description
- List of songs in collection order (SongCards)
- Creator info

## Layout (src/app/(public)/layout.tsx)
- Header: logo/title, nav links (Home, Songs, Collections), language switcher, auth button
- Footer: minimal — copyright, links
- Responsive sidebar nav on mobile (hamburger menu)

## Search Implementation
- Standard: search by title, author name, index number
- Fuzzy lyrics: use PostgreSQL pg_trgm extension for trigram similarity on SongVersion.lyrics
- In mock mode: simple string includes() on mock data
- Debounced input (300ms)

## API Routes
- GET /api/songs?q=&lang=&mood=&author=&status=&page=&limit=
- GET /api/songs/[id]
- GET /api/collections?public=true
- GET /api/collections/[id]

## Files
- src/app/(public)/layout.tsx
- src/app/(public)/page.tsx
- src/app/(public)/songs/page.tsx
- src/app/(public)/songs/[id]/page.tsx
- src/app/(public)/collections/page.tsx
- src/app/(public)/collections/[id]/page.tsx
- src/components/layout/header.tsx
- src/components/layout/footer.tsx
- src/components/layout/mobile-nav.tsx
- src/components/songs/lyrics-display.tsx
- src/components/songs/version-selector.tsx
- src/components/songs/song-meta.tsx
- src/app/api/songs/route.ts
- src/app/api/songs/[id]/route.ts
- src/app/api/collections/route.ts
- src/app/api/collections/[id]/route.ts
