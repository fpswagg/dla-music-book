# Phase 12: Print & Share

## Goal
Enable clean printing of song lyrics and rich link sharing.

## Print
- Print button on song detail page
- Print CSS in globals.css (@media print)
- Hides: header, footer, sidebar, nav, buttons, audio player, filter pills
- Shows: song title (large Georgia), index number, author, lyrics (Georgia, generous line-height)
- Clean margins, no backgrounds (printer-friendly)
- One song per page

## Share
- Each song at /songs/[id] has OG meta tags:
  - og:title = "{index}. {title}"
  - og:description = first 2 lines of lyrics + "by {author}"
  - og:type = "music.song"
  - og:url = full URL
- Copy link button with toast "Link copied!"
- Uses navigator.clipboard.writeText()

## Toast Component
- Simple toast notification for "Link copied!" feedback
- Parchment bg, forest border, auto-dismiss after 2s
- Positioned bottom-right

## Files
- src/styles/globals.css (add @media print rules)
- src/components/songs/share-button.tsx
- src/components/songs/print-button.tsx
- src/components/ui/toast.tsx
- src/app/(public)/songs/[id]/page.tsx (add OG metadata)
