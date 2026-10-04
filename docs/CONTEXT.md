# Myenge ma Bonakristo — Project Context

> Read this document + docs/STYLE.md before every implementation step.

## Overview

- **Myenge ma Bonakristo** (Duala: "Christian songs") — the Duala hymnal of the churches of Douala, online.
- The #1 use: someone in church says "cantique 245" → open it in two taps, read it, project it.
- Design system: "Olive & Ink" — warm, notebook-like, literary (see STYLE.md), with an "Ink" dark theme.

## Tech stack

- **Framework:** Next.js 16 (App Router, Turbopack, `src/proxy.ts` instead of middleware) + TypeScript 6
- **Database:** PostgreSQL via Prisma 7 (`prisma-client` generator → `src/generated/prisma`, `@prisma/adapter-pg`,
  `prisma.config.ts`). Schema changes go through migrations (`prisma/migrations`), never `db push`.
- **Auth:** Better Auth on our own tables (User, Session, Account, Verification) — `src/lib/auth.ts`
- **Email:** Resend (optional) — `src/lib/mailer.ts`
- **Storage:** SA Storage (optional) for audio previews and backups — `src/lib/sastorage.ts`
- **Validation:** zod 4 (`src/lib/validation.ts`)
- **i18n:** next-intl (fr default, en, duala); locale in the `locale` cookie
- **Styling:** Tailwind CSS 4 + CSS tokens from STYLE.md; font Gentium Book Plus (self-hosted, Duala coverage)
- **Deployment:** Vercel (prod) — migrations are applied separately with `pnpm db:deploy`

## Runtime configuration (src/lib/config.ts)

One module answers "is X configured?": `isDatabaseConfigured()`, `isAuthConfigured()`, `isEmailConfigured()`,
`isGoogleConfigured()`, `isStorageConfigured()`. Every feature must keep working when an optional one is
missing (hide the button, fall back, explain to the admin). `getPublicConfig()` sends the flags (no secrets)
to the browser through `AppConfigProvider`; `getIntegrationsStatus()` feeds the admin overview.

App modes: **db** (DATABASE_URL set) or **mock** (demo on `src/lib/mock/data.json`, you are the demo admin).

## The book (src/lib/lyrics.ts, duala.ts, references.ts, book-import.ts)

- `Song.index` is the hymn number and the public address (`/songs/42`; old uuid links redirect).
- `SongVersion.content` (JSON) holds structured lyrics: `blocks[]` of `stanza` (number), `refrain`, `text`, and
  `refrainAfterEachStanza`. `SongVersion.lyrics` keeps the same text in the editing format
  ("1. …", "R. …", blank lines) for search and older clients. `getLyricsContent()` reads either.
- `displayBlocks()` expands the refrain after each stanza (marked `repeat`) and can limit to chosen stanzas.
- `Song.searchText` = normalised title + lyrics + references + authors (`normalizeForSearch`: no diacritics,
  e̱/ɛ→e, o̱/ɔ→o, ŋ/ń→n, no apostrophes). Keep it fresh with `refreshSearchText()` after every write.
- `Hymnal` + `SongReference`: the "M. B. 11. – S. S. et S. 621" line under the number. Legend at `/hymnals`.
- `Song.page` (printed book page), `Song.tune` (melody name).

## Conventions

- All colours via tokens (never hardcode hex) from STYLE.md; Tailwind utilities `bg-parchment`, `text-deep`… exist.
- `font-display` (Gentium) for hymn numbers, titles and lyrics — and any text that may contain Duala letters.
  `font-ui` (system) for interface text.
- Font-weight 400 or 500 only. Borders 0.5px stone; 2px forest for active only. No shadows, no gradients.
- Mobile-first; ~44px touch targets for primary controls. Print chrome uses `no-print`.
- Server components by default; `"use client"` only when needed. Server-only modules import `"server-only"`.
- API routes in `src/app/api/`, validated with zod; admin routes call `requireAdmin()`.
- Files kebab-case, components PascalCase. Components: `ui/`, `songs/`, `setlists/`, `present/`, `offline/`,
  `admin/`, `auth/`, `layout/`, `providers/`.
- Translation keys must exist in fr, en and duala: `node scripts/check-i18n.mjs`.

## Roles

- **USER:** read, like, collections (request publication), service programmes.
- **ADMIN:** + hymns, import, sources, tags, authors, annotations, users (role, ban, reset link), analytics, backups.
- Bootstrap: `ADMIN_EMAILS` promotes those addresses on sign-up / sign-in.

## Data model (prisma/schema.prisma)

User (+ Session, Account, Verification) · Song · SongVersion · Hymnal · SongReference · Author/SongAuthor ·
Tag/SongTag · Language/SongLanguage · Preview · Collection/CollectionSong · Setlist/SetlistItem ·
Annotation · SongNote · Like · AnalyticsEvent.

## Offline (public/sw.js)

Static assets cache-first; pages network-first (visited pages kept); `/api/offline/bundle` saved by the
"save all hymns" button and read by `/offline`. Offline navigation to an unsaved hymn redirects to
`/offline?n=<number>`. Bump `VERSION` in `sw.js` when its logic changes.
