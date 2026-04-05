# Phase 12: Print & Share

## Goal
Enable clean printing of song lyrics and rich link sharing.

## Print
- Print button on song detail page
- Print CSS in [`src/app/globals.css`](../../src/app/globals.css) (`@media print`)
- Hides: header, footer, sidebar, nav, buttons, audio/video elements, filter pills
- **Back navigation:** [`BackLink`](../../src/components/ui/back-link.tsx) uses the `no-print` class so “return” links do not appear on paper (anchors are not covered by `button { display: none }`).
- **Song detail:** Language/tag pills, share/print/like row, audio previews, and multi-version chips are wrapped with `no-print` so print shows index, title, author, lyrics, and notes only.
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
- [`src/app/globals.css`](../../src/app/globals.css) (`@media print` rules)
- [`src/components/ui/back-link.tsx`](../../src/components/ui/back-link.tsx) (`no-print` on back links)
- [`src/app/(public)/songs/[id]/page.tsx`](../../src/app/(public)/songs/[id]/page.tsx) (OG metadata; `no-print` wrappers for chrome)
- `src/components/songs/share-button.tsx`
- `src/components/songs/print-button.tsx`
- `src/components/ui/toast.tsx`
