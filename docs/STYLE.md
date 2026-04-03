# Olive & Ink — Design System
> Songbook UI for a personal music library. Warm, handwritten, literary feel.

---

## Core Philosophy

- **Feels like a notebook**, not an app. Organic, personal, warm.
- **Serif for expression, sans-serif for function.** Titles and lyrics use Georgia. UI text uses system sans-serif.
- **Dark green is the anchor.** It signals action, selection, and identity.
- **Amber is the accent.** Used for mood, emotion, and annotations — never for UI actions.
- **No harsh blacks.** Use `--color-deep` (`#1e3a1e`) for the darkest text.

---

## Color Tokens

Always use these names — never hardcode hex values directly in components.

| Token | Hex | Usage |
|---|---|---|
| `--color-parchment` | `#f5f0e8` | Main background |
| `--color-linen` | `#ede8dc` | Sidebar, nav, secondary surfaces |
| `--color-sand` | `#e8e2d4` | Cards, tags background, hover states |
| `--color-stone` | `#c0b89a` | Borders, dividers, muted icons |
| `--color-forest` | `#2d5a2d` | Primary action, active states, play button |
| `--color-deep` | `#1e3a1e` | Headings, primary text, darkest green |
| `--color-amber` | `#c8941a` | Mood tags, annotations, highlights |
| `--color-amber-light` | `#fdf0d5` | Amber tag background, annotation bg |
| `--color-green-light` | `#d8edcc` | Finished status background |
| `--color-green-muted` | `#4a6340` | Secondary text on parchment, metadata |
| `--color-text-muted` | `#7a6a50` | Timestamps, hints, placeholder text |
| `--color-text-body` | `#3d4f3a` | Body text, tag labels |

### CSS Custom Properties (paste in `:root`)

```css
:root {
  --color-parchment:    #f5f0e8;
  --color-linen:        #ede8dc;
  --color-sand:         #e8e2d4;
  --color-stone:        #c0b89a;
  --color-forest:       #2d5a2d;
  --color-deep:         #1e3a1e;
  --color-amber:        #c8941a;
  --color-amber-light:  #fdf0d5;
  --color-green-light:  #d8edcc;
  --color-green-muted:  #4a6340;
  --color-text-muted:   #7a6a50;
  --color-text-body:    #3d4f3a;

  --font-display: 'Georgia', 'Times New Roman', serif;
  --font-ui:      system-ui, sans-serif;

  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   12px;
  --radius-pill: 20px;

  --border-default: 0.5px solid var(--color-stone);
  --border-active:  2px solid var(--color-forest);
}
```

---

## Typography

| Role | Font | Size | Weight | Color |
|---|---|---|---|---|
| Display / Page title | Georgia serif | 28–32px | 400 | `--color-deep` |
| Section heading | Georgia serif | 18–22px | 400 | `--color-deep` |
| Song title (card) | Georgia serif | 16px | 400 | `--color-deep` |
| Lyric line | Georgia serif | 15–18px | 400 | `--color-deep` |
| Body / Description | Sans-serif | 14px | 400 | `--color-text-body` |
| Metadata / Subtitle | Sans-serif | 12px | 400 | `--color-green-muted` |
| Label / Section tag | Sans-serif | 10–11px | 500 | `--color-text-muted` |
| Badge text | Sans-serif | 11px | 500 | context-dependent |

### Rules
- Never use font-weight 600 or 700 — too heavy against warm backgrounds.
- Section labels (like "Finished songs", "Tags") use `font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase; color: var(--color-text-muted)`.
- Italic is reserved for lyric lines and annotations, never for UI metadata.

---

## Borders & Shadows

- **Default border:** `0.5px solid var(--color-stone)` — always 0.5px, never 1px.
- **Active/selected border:** `2px solid var(--color-forest)` — the only exception to 0.5px.
- **No box-shadows.** Depth comes from background color contrast, not shadows.
- **No gradients.** All fills are flat.

---

## Spacing

Use these values consistently:

| Name | Value | Use |
|---|---|---|
| xs | 4px | Inner tag padding, tight gaps |
| sm | 8px | Icon-to-text gap, small padding |
| md | 12px | Card internal spacing |
| lg | 16px | Card padding, section gaps |
| xl | 24px | Between major sections |
| 2xl | 32px | Page-level vertical rhythm |

---

## Components

### Song Card

```html
<div class="song-card">
  <div class="card-top">
    <div class="card-num">01</div>
    <div class="card-body">
      <div class="card-title">Song Title Here</div>
      <div class="card-meta">Genre · City · Year</div>
    </div>
    <span class="status status-finished">Finished</span>
  </div>
  <div class="card-tags">
    <span class="tag">keyword</span>
    <span class="tag tag-mood">mood</span>
  </div>
  <div class="card-divider"></div>
  <div class="card-bottom">
    <button class="play-btn">▶</button>
    <span class="duration">2:34</span>
    <span class="fav-btn">♡</span>
  </div>
</div>
```

```css
.song-card {
  background: var(--color-parchment);
  border: var(--border-default);
  border-radius: var(--radius-lg);
  overflow: hidden;
}
.card-top {
  padding: 14px 16px 10px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.card-num {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--color-stone);
  min-width: 28px;
  line-height: 1;
}
.card-title {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--color-deep);
  margin-bottom: 3px;
}
.card-meta {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-green-muted);
}
.card-divider {
  height: 0.5px;
  background: var(--color-stone);
  margin: 0 16px;
  opacity: 0.6;
}
.card-bottom {
  padding: 8px 16px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.play-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-forest);
  color: var(--color-parchment);
  border: none;
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.duration {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-text-muted);
}
.fav-btn {
  margin-left: auto;
  font-size: 16px;
  cursor: pointer;
  color: var(--color-text-muted);
}
.fav-btn:hover { color: var(--color-amber); }
```

---

### Tags & Badges

Two types: **keyword tags** (topic/theme) and **mood tags** (feel/emotion).

```css
/* Base tag */
.tag {
  font-family: var(--font-ui);
  font-size: 11px;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  background: var(--color-sand);
  color: var(--color-text-body);
}

/* Mood tag — amber tint */
.tag-mood {
  background: var(--color-amber-light);
  color: var(--color-amber);
}
```

**Status badges** — for song completion state:

```css
.status {
  font-family: var(--font-ui);
  font-size: 10px;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  font-weight: 500;
  white-space: nowrap;
}
.status-finished { background: var(--color-green-light); color: var(--color-forest); }
.status-draft    { background: var(--color-sand);        color: var(--color-text-muted); }
.status-wip      { background: var(--color-amber-light); color: var(--color-amber); }
.status-shelved  { background: var(--color-sand);        color: var(--color-stone); }
```

---

### Navigation (Sidebar)

```css
.nav {
  background: var(--color-linen);
  border: var(--border-default);
  border-radius: var(--radius-lg);
  padding: 12px 0;
}
.nav-item {
  padding: 9px 18px;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--color-text-body);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.nav-item:hover {
  background: var(--color-sand);
}
.nav-item.active {
  background: var(--color-parchment);
  color: var(--color-deep);
  font-weight: 500;
  border-left: 2px solid var(--color-forest);
}
.nav-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-sand);
  padding: 1px 7px;
  border-radius: 10px;
}
```

---

### Search Bar

```css
.search-bar {
  background: var(--color-linen);
  border: var(--border-default);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-ui);
}
.search-bar:focus-within {
  border-color: var(--color-forest);
  background: var(--color-parchment);
}
.search-bar input {
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  color: var(--color-deep);
  flex: 1;
}
.search-bar input::placeholder {
  color: var(--color-text-muted);
}
```

---

### Filter Pills

```css
.pill {
  font-family: var(--font-ui);
  font-size: 12px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  border: var(--border-default);
  background: var(--color-linen);
  color: var(--color-text-body);
  cursor: pointer;
  transition: background 0.15s;
}
.pill:hover {
  background: var(--color-sand);
}
.pill.active {
  background: var(--color-forest);
  color: var(--color-green-light);
  border-color: var(--color-forest);
}
```

---

### Stat Cards

Used for dashboard summary numbers (total songs, finished, drafts).

```css
.stat-card {
  background: var(--color-linen);
  border-radius: var(--radius-md);
  padding: 12px 14px;
}
.stat-num {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--color-deep);
  line-height: 1;
}
.stat-label {
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}
```

---

### Lyric Annotation

Used to attach a note to a specific lyric line.

```html
<div class="annotation">
  <div class="annotation-line">"La phrase du parole ici…"</div>
  <div class="annotation-note">Votre note ici — contexte, histoire, variante.</div>
</div>
```

```css
.annotation {
  background: var(--color-amber-light);
  border-left: 2px solid var(--color-amber);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  padding: 10px 14px;
}
.annotation-line {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--color-deep);
  font-style: italic;
  margin-bottom: 4px;
}
.annotation-note {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--color-text-muted);
}
```

---

### Section Label

Used above every UI section as a small all-caps label.

```css
.section-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: 10px;
}
```

---

## Do / Don't

| Do | Don't |
|---|---|
| Use Georgia for all song titles and lyrics | Use Georgia for buttons or nav items |
| Use 0.5px borders everywhere | Use 1px or 2px borders (except active states) |
| Use `--color-amber` only for mood/emotion | Use amber for primary actions or navigation |
| Keep backgrounds flat (parchment, linen, sand) | Add gradients or shadows |
| Use font-weight 400 or 500 only | Use 600, 700, or bold |
| Use `--color-forest` for all interactive actions | Use multiple greens for different actions |
| Keep tags small, lowercase, short (1–2 words) | Write long tag labels |
| Use muted stone borders on cards | Use dark or colored card borders |

---

## Page Background Rules

| Surface | Color token | Used for |
|---|---|---|
| Page background | `--color-parchment` | Main content area |
| Sidebar / Nav | `--color-linen` | Left panel, nav drawer |
| Cards | `--color-parchment` | Song cards, detail panels |
| Input / Search | `--color-linen` | Form fields, search bar |
| Hover state | `--color-sand` | Any interactive hover |
| Tag / Badge bg | `--color-sand` | Default tag background |

---

*Olive & Ink Design System — built for a personal Douala songbook.*
