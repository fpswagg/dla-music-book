# Phase 1: Project Setup

## Goal
Initialize the Next.js project with all dependencies and base configuration.

## Steps
1. Initialize Next.js 15 with App Router + TypeScript via `create-next-app`
2. Install dependencies:
   - @prisma/client, prisma
   - @supabase/supabase-js, @supabase/ssr
   - next-intl
   - zod
   - lucide-react
   - react-hook-form, @hookform/resolvers
   - tailwindcss, postcss, autoprefixer (if not included by create-next-app)
3. Configure tailwind.config.ts extending the Olive & Ink design tokens
4. Create src/styles/globals.css with CSS custom properties from STYLE.md
5. Create .env.example with all required env vars documented
6. Set up the base folder structure (src/app, src/components, src/lib, etc.)
7. Configure next.config.ts for next-intl

## Files to Create/Modify
- package.json (dependencies)
- tailwind.config.ts (Olive & Ink tokens)
- src/styles/globals.css (CSS custom properties + Tailwind directives)
- .env.example
- next.config.ts
- tsconfig.json (paths aliases)
- src/app/layout.tsx (root layout with fonts + globals.css)

## .env.example Contents
```
# Database (Prisma)
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Tailwind Config Notes
- Extend colors with all Olive & Ink tokens using CSS var() references
- Extend fontFamily: display (Georgia serif), ui (system sans-serif)
- Extend borderRadius using design system values
- Extend spacing if needed
