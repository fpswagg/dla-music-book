# Phase 10: Backup System

## Goal
Admin-triggered database backup to Supabase storage, with list/download/restore capabilities.

## Backup Process
1. Admin clicks "Create Backup" in dashboard
2. Server exports all Prisma tables as JSON
3. Bundle into a single JSON file with metadata (date, version, table counts)
4. Upload to Supabase `backups` bucket with filename: `backup-{ISO-date}.json`
5. Return success with backup info

## Restore Process
1. Admin selects a backup from the list
2. Confirmation dialog (destructive action warning)
3. Download backup JSON from Supabase
4. Clear existing data (in correct FK order)
5. Re-seed from backup JSON
6. Return success

## Backup Manager (src/lib/backup/manager.ts)
- createBackup() — export + upload
- listBackups() — list files in backups bucket
- downloadBackup(filename) — get backup file
- restoreBackup(filename) — download + restore
- getBackupMetadata(filename) — parse metadata without full download

## Backup JSON Structure
```json
{
  "metadata": {
    "createdAt": "ISO date",
    "version": "1.0",
    "tables": {
      "songs": 42,
      "authors": 8,
      ...
    }
  },
  "data": {
    "languages": [...],
    "authors": [...],
    "tags": [...],
    "songs": [...],
    "songVersions": [...],
    "songAuthors": [...],
    "songTags": [...],
    "songLanguages": [...],
    "previews": [...],
    "collections": [...],
    "collectionSongs": [...],
    "annotations": [...],
    "songNotes": [...],
    "userProfiles": [...],
    "likes": [...],
    "analyticsEvents": [...]
  }
}
```

## API Routes
- POST /api/admin/backups — create backup
- GET /api/admin/backups — list backups
- GET /api/admin/backups/[filename] — download
- POST /api/admin/backups/[filename]/restore — restore

## Admin Page (src/app/admin/backups/page.tsx)
- "Create Backup" button with loading state
- Table of past backups: date, size, table counts, actions (download, restore, delete)
- Restore confirmation modal
- In mock mode: show message "Backups require database + Supabase storage"

## Files
- src/lib/backup/manager.ts
- src/app/api/admin/backups/route.ts
- src/app/api/admin/backups/[filename]/route.ts
- src/app/api/admin/backups/[filename]/restore/route.ts
- src/app/admin/backups/page.tsx
- src/components/admin/backup-list.tsx
- src/components/admin/restore-modal.tsx
