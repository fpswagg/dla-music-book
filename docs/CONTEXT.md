# Myenge ma bonakristo — Project Context

> Read this document + docs/STYLE.md before every implementation step.

## Overview

- **Myenge ma bonakristo** (Douala: Christian hymn book) — a hymn book site for church and village use, accessible anywhere/anytime
- Features: song catalog with lyrics, user auth, admin dashboard, collections, analytics, backups
- Design system: "Olive & Ink" — warm, notebook-like, literary feel (see STYLE.md)

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **ORM:** Prisma (PostgreSQL via Supabase)
- **Auth/Storage:** Supabase (Auth with email/phone/Google/Facebook/Instagram, Storage buckets)
- **Styling:** Tailwind CSS + CSS custom properties from STYLE.md
- **i18n:** next-intl (French, English, Duala placeholder)
- **Validation:** Zod
- **Icons:** Lucide React
- **Forms:** React Hook Form
- **Deployment:** Vercel

## Conventions

- All CSS colors via tokens (never hardcode hex) from STYLE.md
- Georgia serif for song titles/lyrics, system sans-serif for UI text
- Font-weight: only 400 or 500, never 600/700
- Borders: 0.5px solid stone default, 2px solid forest for active only
- No box-shadows, no gradients — flat backgrounds only
- Spacing: xs=4px, sm=8px, md=12px, lg=16px, xl=24px, 2xl=32px
- **Responsive:** mobile-first Tailwind breakpoints; primary controls aim for ~44px min touch height on small screens where practical; print-only chrome uses the `no-print` class with rules in `src/app/globals.css` (`@media print`).
- File naming: kebab-case for files, PascalCase for components
- API routes in src/app/api/
- Components organized: ui/ (design system), songs/, admin/, layout/
- Server components by default, "use client" only when needed
- Environment modes: Full (Prisma+Supabase), DB-only (Prisma+mock auth), Mock (JSON data)
- Two Supabase storage buckets: song-previews (public read, admin write), backups (admin-only)

## Roles

- **USER:** browse songs, like songs, create/manage private collections, request collection publication
- **ADMIN:** all USER capabilities + manage songs/tags/authors/annotations/users/analytics/backups, approve collection publications

## Key Data Models

- **Song** (index, title, status, originalSongId)
- **SongVersion** (lyrics, versionType, versionNumber)
- **Author** (name, bio) — linked via SongAuthor with displayOrder
- **Tag** (name, category: MOOD/THEME/STYLE/ERA)
- **Language** (code: fr/en/duala)
- **Collection** (name, isPublic, status: PRIVATE/PUBLIC/PENDING_REVIEW)
- **Annotation** (lineNumber, lineText, note — on SongVersion)
- **SongNote** (short notes on songs — what sparked it)
- **Like** (user + song)
- **Preview** (audio file reference on SongVersion)
- **UserProfile** (extends Supabase Auth — displayName, role)
- **AnalyticsEvent** (eventType, metadata JSON)

## Languages

- App UI: translatable in French, English, Duala (placeholder)
- Song content: songs have their own language field (most default to Duala)
- French, English, Duala are the possible song languages

## Documentation Structure

- `docs/STYLE.md` — design system (existing)
- `docs/CONTEXT.md` — this file
- `docs/agent/` — per-phase planning docs (read before implementing each phase)
- `docs/INTEGRATION-*.md` — integration guides for developers
