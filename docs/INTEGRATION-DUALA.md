# Adding Duala Language Translations

## Overview
The Douala Hymn Book supports three UI languages: French, English, and Duala. The Duala translation file (`src/i18n/messages/duala.json`) currently contains English placeholder values that need to be replaced with proper Duala translations.

## What Needs Translation
The `duala.json` file contains all UI strings used throughout the application. These are NOT song lyrics — they are interface labels, buttons, headings, and messages.

## How to Add Duala Translations

### 1. Open the Translation File
```
src/i18n/messages/duala.json
```

### 2. Structure
The file is organized by feature area:
```json
{
  "nav": {
    "home": "Home",        // Replace with Duala
    "songs": "Songs",      // Replace with Duala
    "collections": "Collections"  // Replace with Duala
  },
  "home": {
    "title": "Douala Hymn Book",
    "subtitle": "...",
    ...
  },
  ...
}
```

### 3. Replace Values
Replace each English value with the correct Duala translation. Keep the JSON keys exactly the same.

Example:
```json
{
  "nav": {
    "home": "Ndap",
    "songs": "Bejango",
    "collections": "Bikotedi"
  }
}
```

### 4. Testing
1. Run the app: `npm run dev`
2. Navigate to any page with `/duala/` prefix (e.g., `http://localhost:3000/duala/songs`)
3. Verify all strings display correctly
4. Check for text overflow issues (Duala words may be longer/shorter than English)

### 5. Things to Watch For
- **Character encoding:** Ensure the file is saved as UTF-8
- **Special characters:** Duala may use special characters (e.g., ɛ, ɔ, ŋ) — ensure they display correctly
- **Pluralization:** If any translations need plural forms, check next-intl docs for ICU message syntax
- **Text length:** Some Duala words may be longer — test responsive layouts

### 6. Key Sections to Translate
| Section | Count | Description |
|---------|-------|-------------|
| nav | ~6 keys | Navigation labels |
| home | ~8 keys | Home page text |
| songs | ~10 keys | Song catalog labels |
| song | ~12 keys | Song detail labels |
| auth | ~15 keys | Login/register text |
| dashboard | ~8 keys | User dashboard |
| admin | ~20 keys | Admin dashboard |
| common | ~15 keys | Shared buttons/labels |
| status | ~4 keys | Song status labels |

### 7. Getting Help
If you need a Duala language expert:
- Consult community members who speak Duala
- Reference existing Douala hymn books for common terminology
- The Duala language (also spelled Douala or Duálá) is a Bantu language spoken in Cameroon

## File Locations
- English reference: `src/i18n/messages/en.json`
- French reference: `src/i18n/messages/fr.json`
- Duala (to translate): `src/i18n/messages/duala.json`
