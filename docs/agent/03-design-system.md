# Phase 3: Design System Components

## Goal
Build reusable React components that faithfully implement the Olive & Ink design system from STYLE.md.

## Components to Build (all in src/components/ui/)

### SongCard
- Props: index, title, meta, status, tags, duration, hasPreview, isLiked, onLike, onPlay
- Layout: card-top (number + title + status), card-tags, card-divider, card-bottom (play + duration + fav)
- Exact styles from STYLE.md .song-card

### Tag
- Props: label, variant ('keyword' | 'mood')
- keyword: sand bg, text-body color
- mood: amber-light bg, amber color
- pill shape, 11px font

### StatusBadge
- Props: status ('finished' | 'draft' | 'wip' | 'shelved')
- Maps to .status-finished, .status-draft, .status-wip, .status-shelved

### SearchBar
- Props: value, onChange, placeholder
- Linen bg, stone border, forest border on focus
- Search icon (Lucide) inside

### FilterPill
- Props: label, active, onClick
- Linen bg default, forest bg when active
- Stone border, pill radius

### StatCard
- Props: value (number/string), label
- Linen bg, Georgia display font for number, sans-serif for label

### AnnotationBlock
- Props: lineText, note
- Amber-light bg, amber left border, italic lyric line

### SectionLabel
- Props: children (text)
- 11px uppercase, letter-spacing 0.08em, text-muted color

### NavItem
- Props: icon, label, count, active, href
- Inside sidebar navigation, forest left-border when active

### Button
- Props: variant ('primary' | 'secondary' | 'ghost'), size, children, etc.
- primary: forest bg, parchment text
- secondary: linen bg, stone border
- ghost: transparent, text-body, sand on hover

### Input
- Props: standard input props
- Linen bg, stone border, forest border on focus

### AudioPlayer
- Props: src, duration
- Minimal player: play/pause button (forest circle), progress indicator, duration text

## Style Rules (from STYLE.md)
- ALL colors via CSS custom properties
- Georgia for display/lyric content ONLY
- System sans-serif for all UI elements
- 0.5px borders (stone), 2px only for active/selected (forest)
- No shadows, no gradients
- Font-weight 400 or 500 only
- Spacing: xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32

## Files
- src/components/ui/song-card.tsx
- src/components/ui/tag.tsx
- src/components/ui/status-badge.tsx
- src/components/ui/search-bar.tsx
- src/components/ui/filter-pill.tsx
- src/components/ui/stat-card.tsx
- src/components/ui/annotation-block.tsx
- src/components/ui/section-label.tsx
- src/components/ui/nav-item.tsx
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/audio-player.tsx
