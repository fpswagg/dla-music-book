# Douala Hymn Book

A warm, notebook-styled hymn book web application for the Douala community. Browse, search, and share traditional hymns with a beautiful "Olive & Ink" design aesthetic.

## Features

- Song catalog with lyrics, versions, annotations, and audio previews
- Full-text + fuzzy lyric search (find songs by half-remembered lyrics)
- User authentication (email, phone, Google, Facebook, Instagram)
- Personal collections and song likes
- Admin dashboard with song management, analytics, and backups
- Multi-language UI (French, English, Duala)
- Clean printable lyrics format
- Easy link sharing with rich previews

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Prisma ORM + PostgreSQL (via Supabase)
- Supabase Auth & Storage
- Tailwind CSS + Olive & Ink design system
- next-intl for internationalization

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Supabase project for auth/storage

### Installation

```bash
git clone <repo-url>
cd douala-music-book
npm install
cp .env.example .env
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values. The app runs in three modes:

- **Full mode**: All env vars set — Prisma + Supabase auth + storage
- **DB-only mode**: DATABASE_URL set but no Supabase keys — database works, auth/storage mocked
- **Mock mode**: No env vars — runs entirely on mock JSON data (great for development)

### Development

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### Database Seeding

```bash
npx prisma db seed
```

## Project Structure

- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (ui/, songs/, admin/, layout/)
- `src/lib/` — Utilities (Prisma, Supabase, mock data, analytics, backup)
- `src/i18n/` — Internationalization config and message files
- `prisma/` — Database schema and seed data
- `docs/` — Documentation (STYLE.md, CONTEXT.md, integration guides)

## Documentation

- [Design System](docs/STYLE.md) — Olive & Ink color tokens, typography, components
- [Project Context](docs/CONTEXT.md) — Architecture, conventions, data models
- [Supabase Integration](docs/INTEGRATION-SUPABASE.md)
- [Prisma Integration](docs/INTEGRATION-PRISMA.md)
- [i18n Integration](docs/INTEGRATION-I18N.md)
- [Duala Language Guide](docs/INTEGRATION-DUALA.md)

## License

MIT
