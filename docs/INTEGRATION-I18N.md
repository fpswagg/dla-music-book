# i18n Integration Guide (next-intl)

## Overview
The app uses next-intl for UI string internationalization. Three locales are supported:
- `fr` — French (default)
- `en` — English
- `duala` — Duala (placeholder, see INTEGRATION-DUALA.md)

Note: Song content (lyrics, titles) is NOT translated via i18n. Songs have their own `language` field.

## Setup

### 1. Install
```bash
npm install next-intl
```

### 2. Configuration (src/i18n/config.ts)
```typescript
export const locales = ['fr', 'en', 'duala'] as const;
export const defaultLocale = 'fr';
export type Locale = (typeof locales)[number];
```

### 3. Message Files
Located in `src/i18n/messages/`:
- `en.json` — English translations
- `fr.json` — French translations
- `duala.json` — Duala placeholder (English values, needs translation)

### 4. Next.js Config
Update `next.config.ts` to include next-intl plugin.

### 5. Middleware
The middleware handles locale detection and URL rewriting:
- `/songs` -> redirects to `/fr/songs` (default locale)
- `/en/songs` -> serves English version

### 6. Usage in Components
```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('nav');
  return <nav>{t('home')}</nav>;
}
```

### 7. Server Components
```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('songs');
  return <h1>{t('title')}</h1>;
}
```

## Adding New Strings
1. Add the key to ALL message files (en.json, fr.json, duala.json)
2. Use the key in your component via `useTranslations` or `getTranslations`

## Message File Structure
Keys are organized by page/feature:
- `nav.*` — navigation items
- `home.*` — home page
- `songs.*` — song catalog
- `song.*` — song detail
- `auth.*` — authentication
- `dashboard.*` — user dashboard
- `admin.*` — admin dashboard
- `common.*` — shared strings (buttons, labels)
- `status.*` — song statuses
- `mock.*` — mock mode messages
