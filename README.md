# Myenge ma Bonakristo

The Duala hymnal *Myenge ma Bonakristo* on the web: every hymn by its number, laid out like the
printed book, usable during the service (projection, programmes) and in churches without network
(offline PWA). Olive & Ink design.

## Features

- **Go to hymn N** — number pad in the header, or just type digits anywhere. Hymns live at `/songs/<number>`.
- **Book layout** — numbered stanzas, refrain written once then abbreviated ("Ba longo…"), cross-references
  to other hymnals (M.B., S. S. et S., Evang. S.…) with a legend at `/hymnals`, book page, tune.
- **Duala orthography** — Gentium Book Plus font (e̱ o̱ ɛ ɔ ŋ ń ḿ), accent-insensitive search, Duala character picker.
- **Projection mode** — one stanza per screen, big type, arrow keys / clicker / swipe, keeps the screen awake.
- **Service programmes** — order of service with chosen stanzas and moments; share by link or QR code, print, project.
- **Offline** — installable PWA; the whole book is cached in the background, no button needed (`/offline` reader).
- **Reading settings** — text size, dark theme, full or abbreviated repeated refrains.
- **Print** — one hymn or a range (`/print?from=1&to=40`) in the book's two-column layout.
- Accounts (email + password, optional Google, optional email via Resend), likes, collections.
- Admin: hymn editor with live preview, bulk import of digitised pages, sources, users, analytics, backups.
- UI in French, English and Duala.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 · Prisma 7 (PostgreSQL, `@prisma/adapter-pg`) ·
Better Auth · Resend · zod 4 · next-intl 4 · Tailwind CSS 4 · pnpm 10.

## Getting started

```bash
pnpm install
cp .env.example .env          # fill in what you have; everything is documented there
pnpm db:deploy                # apply migrations (needs DATABASE_URL)
pnpm db:seed                  # sample data (development only)
pnpm dev
```

Without `DATABASE_URL` the app runs in **demo mode** on `src/lib/mock/data.json` (you are the demo admin).

| Integration | Variables | When missing |
|---|---|---|
| Database | `DATABASE_URL` | demo mode |
| Auth | `BETTER_AUTH_SECRET` (+ `BETTER_AUTH_URL`) | sign-in disabled in production |
| Email | `RESEND_API_KEY`, `RESEND_FROM` | no verification / forgot password; admins hand out reset links |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | button hidden |
| Storage | `SASTORAGE_URL`, `SASTORAGE_TOKEN` | no audio upload, no backups |

Make yourself admin with `ADMIN_EMAILS=you@example.org` (applied when that address signs up or signs in).

## Scripts

| Command | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | ESLint, TypeScript, unit tests (lyrics, search, references, import) |
| `pnpm db:migrate` | create a migration after editing `prisma/schema.prisma` (development) |
| `pnpm db:deploy` | apply migrations (production, CI) |
| `pnpm db:backfill [--apply]` | structured lyrics + search text for existing hymns |
| `pnpm import:supabase [--apply] [--copy-previews]` | one-off copy of the old Supabase data |
| `node scripts/check-i18n.mjs` | translation keys missing in a locale |

## Documentation

- [docs/CONTEXT.md](docs/CONTEXT.md) — architecture, conventions, data model
- [docs/STYLE.md](docs/STYLE.md) — Olive & Ink design system
- [docs/INTEGRATION-AUTH.md](docs/INTEGRATION-AUTH.md) — auth, email, Google, cut-over from Supabase
- [docs/INTEGRATION-PRISMA.md](docs/INTEGRATION-PRISMA.md) — database and migrations
- [docs/INTEGRATION-I18N.md](docs/INTEGRATION-I18N.md), [docs/INTEGRATION-DUALA.md](docs/INTEGRATION-DUALA.md)

## License

MIT. Font: Gentium Book Plus, © SIL International, [SIL Open Font License](src/app/fonts/OFL.txt).
