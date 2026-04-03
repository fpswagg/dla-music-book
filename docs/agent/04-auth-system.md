# Phase 4: Auth System

## Goal
Implement Supabase authentication with multiple providers, user profile sync, role-based access, and login/register pages.

## Auth Providers
- Email/password
- Phone (OTP)
- Google OAuth
- Facebook OAuth
- Instagram OAuth (via Facebook)

## Architecture
1. **Supabase client (browser):** src/lib/supabase/client.ts — createBrowserClient
2. **Supabase server:** src/lib/supabase/server.ts — createServerClient for Server Components/Route Handlers
3. **Middleware:** src/middleware.ts — refresh session on every request, protect /dashboard and /admin routes
4. **UserProfile sync:** On first login (auth callback), create UserProfile in Prisma DB if not exists
5. **Role guard:** Server-side check for admin routes; redirect non-admins

## Pages
### /auth/login
- Email + password form
- Phone number OTP form (with code verification step)
- OAuth buttons (Google, Facebook, Instagram)
- Link to register
- Styled per Olive & Ink (linen backgrounds, forest primary buttons, Georgia titles)

### /auth/register
- Display name, email, password form
- Phone registration option
- OAuth buttons
- Link to login

### /auth/callback/route.ts
- Handles OAuth redirect
- Exchanges code for session
- Creates UserProfile if new user
- Redirects to home or dashboard

## Middleware Flow
1. Check for Supabase session
2. If accessing /admin/* and user role != ADMIN, redirect to /
3. If accessing /dashboard/* and no session, redirect to /auth/login
4. Refresh session tokens

## Mock Auth (when no Supabase env vars)
- Login/register forms show but log actions to console
- Returns a mock user object
- "You are in mock mode" banner displayed

## Files
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- src/middleware.ts
- src/app/auth/login/page.tsx
- src/app/auth/register/page.tsx
- src/app/auth/callback/route.ts
- src/lib/auth-helpers.ts (getCurrentUser, requireAuth, requireAdmin)
