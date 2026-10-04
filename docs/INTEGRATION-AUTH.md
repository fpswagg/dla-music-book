# Auth, email and Google

Sign-in uses [Better Auth](https://better-auth.com) with our own tables (`User`, `Session`, `Account`,
`Verification`). Config: `src/lib/auth.ts`; browser client: `src/lib/auth-client.ts`; route: `/api/auth/*`.
Better Auth's `name` field is mapped to `User.displayName`; `role` (USER/ADMIN) and `banned` are extra fields.

## What works with which variables

| Set | Behaviour |
|---|---|
| `DATABASE_URL` + `BETTER_AUTH_SECRET` | email + password accounts. Production refuses to start auth without the secret. |
| + `RESEND_API_KEY`, `RESEND_FROM` | sign-up sends a verification email and sign-in requires a verified address; "forgot password" and "email me a sign-in link" appear. |
| no Resend | no verification required, no "forgot password". Admins create a one-hour reset link in `/admin/users` and pass it on. In development the email text (with links) is printed to the server console. |
| + `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | "Continue with Google". A Google account with the same verified email is linked to the existing user. |

The admin overview (`/admin`) shows which integrations are on.

### Google

Google Cloud console → OAuth client "Web application":
- Authorised JavaScript origin: `https://<site>`
- Authorised redirect URI: `https://<site>/api/auth/callback/google`

### Resend

Verify the sending domain in Resend, then set `RESEND_FROM="Myenge ma Bonakristo <noreply@your-domain>"`.

## Admins

`ADMIN_EMAILS=a@x.org,b@y.org` promotes those addresses to ADMIN when they sign up or sign in. Admins can then
promote others from `/admin/users`. Banning signs the user out everywhere and refuses new sessions.

## Cut-over from Supabase

Production data (hymns, users…) still lives in the old Supabase project. Once this version is deployed on the
new database:

1. Back up the target database (SPT) and reset it if it only holds sample data — the import refuses to
   overwrite hymn numbers used by other songs.
2. `pnpm db:deploy` on the target.
3. Dry run, then import (the source is opened read-only):
   ```bash
   SOURCE_DATABASE_URL='postgresql://…supabase…' pnpm import:supabase
   SOURCE_DATABASE_URL='postgresql://…supabase…' pnpm import:supabase --apply --copy-previews
   ```
   Ids are kept. Users are created from their Supabase email (no password): they sign in with "forgot
   password", a magic link, Google, or a reset link from an admin. `--copy-previews` re-uploads audio files from
   Supabase Storage to SA Storage (needs `SASTORAGE_*`).
4. Point Vercel's `DATABASE_URL` to the new database, set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `ADMIN_EMAILS`
   (and Resend / Google when available), remove the `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_*` variables, deploy.
