# Phase 8: Admin Dashboard

## Goal
Build a comprehensive admin dashboard with song CRUD, user management, tags, authors, collections, and annotations.

## Layout (src/app/admin/layout.tsx)
- Sidebar navigation (linen bg per STYLE.md):
  - Overview (stats)
  - Songs
  - Authors
  - Tags
  - Collections
  - Users
  - Annotations
  - Analytics
  - Backups
- Main content area (parchment bg)
- Admin-only access (middleware guard)

## Pages

### Overview (src/app/admin/page.tsx)
- StatCards: total songs, finished, drafts, total users, total likes
- Recent activity feed (latest songs added/edited, new users, new likes)
- Quick actions: Add Song, View Analytics

### Songs (src/app/admin/songs/)
- List view with search + filters (status, language, author)
- Each row: index, title, status badge, author, last edited, actions (edit/delete)
- /admin/songs/new — create song form
- /admin/songs/[id]/edit — edit song form

### Song Form
- Title, Index (hymn number)
- Authors selector (multi-select, drag to reorder, first = primary)
- Status toggle (DRAFT/FINISHED)
- Language checkboxes (Duala default checked)
- Tags multi-select grouped by category
- Lyrics editor (textarea with line numbers)
- Version management (add new version, set type)
- Song notes (add/remove short notes)
- Audio upload per version
- Original song reference (optional, for rewrites)

### Authors (src/app/admin/authors/)
- List + CRUD
- Name, bio

### Tags (src/app/admin/tags/)
- List grouped by category
- CRUD with category selector (MOOD/THEME/STYLE/ERA)

### Collections (src/app/admin/collections/)
- List all collections (all users)
- Pending review section at top
- Approve/reject pending collections
- Edit/delete any collection

### Users (src/app/admin/users/)
- List all users with role, join date, like count, collection count
- User detail: activity, change role (USER/ADMIN)
- Cannot demote self

### Annotations (integrated into song edit)
- On song edit page, lyrics display shows line numbers
- Click a line to add/edit annotation
- Annotation form: note text
- List existing annotations per song version

## API Routes (all under /api/admin/)
- CRUD for songs, authors, tags, collections, users
- POST /api/admin/songs/[id]/versions — add version
- POST /api/admin/songs/[id]/annotations — add annotation
- PUT /api/admin/collections/[id]/review — approve/reject

## Files
- src/app/admin/layout.tsx (sidebar + content)
- src/app/admin/page.tsx (overview)
- src/app/admin/songs/page.tsx, new/page.tsx, [id]/edit/page.tsx
- src/app/admin/authors/page.tsx
- src/app/admin/tags/page.tsx
- src/app/admin/collections/page.tsx
- src/app/admin/users/page.tsx, [id]/page.tsx
- src/components/admin/sidebar.tsx
- src/components/admin/song-form.tsx
- src/components/admin/lyrics-editor.tsx
- src/components/admin/annotation-editor.tsx
- Various /api/admin/ route files
