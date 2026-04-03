# Supabase Integration Guide

## Overview
This project uses Supabase for authentication and file storage. The PostgreSQL database is also hosted on Supabase but accessed through Prisma ORM.

## Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API

### 2. Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. Auth Providers
Enable the following in Supabase Dashboard > Authentication > Providers:

#### Email
- Enabled by default
- Configure email templates if desired

#### Phone (OTP)
- Enable Phone provider
- Configure Twilio or other SMS provider in Supabase dashboard
- Users receive OTP codes via SMS

#### Google
1. Create OAuth credentials in Google Cloud Console
2. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Paste Client ID and Secret in Supabase dashboard

#### Facebook
1. Create a Facebook App at developers.facebook.com
2. Add Facebook Login product
3. Set Valid OAuth Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
4. Paste App ID and Secret in Supabase dashboard

#### Instagram
- Instagram auth uses Facebook OAuth under the hood
- Enable Facebook provider (Instagram uses same flow)
- Alternatively, use Instagram Basic Display API

### 4. Storage Buckets
Create two buckets in Supabase Dashboard > Storage:

#### song-previews
- Public bucket (enable public access)
- RLS policies:
  - SELECT: allow all (public read)
  - INSERT/UPDATE/DELETE: allow only authenticated users with admin role

#### backups
- Private bucket
- RLS policies:
  - All operations: allow only authenticated users with admin role

### 5. Database Extensions
Enable in SQL Editor:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```
This enables trigram similarity search for fuzzy lyric matching.

## Client Setup

### Browser Client (src/lib/supabase/client.ts)
Used in Client Components for auth state and storage uploads.
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Server Client (src/lib/supabase/server.ts)
Used in Server Components and Route Handlers.
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

## Troubleshooting
- **Auth not working:** Check that redirect URLs match your app URL
- **Storage upload fails:** Verify bucket policies and user role
- **Missing env vars:** App falls back to mock mode automatically
