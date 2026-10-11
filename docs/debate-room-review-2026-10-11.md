# Debate room expansion - 2026-10-11

Local route: http://127.0.0.1:8931/apologetics/debates

Replaced the simple list with an illustrated editorial landing, reasons to study debates, three featured exchanges, five overlapping topic routes, three Christian speaker profiles, eight conversation partners, a filtered collection, source guidance, listening habits and study/practice links. Published debate documents supply the nine guides and eleven speaker names. Existing transcript and recording links remain on individual guides.

The collection combines topic, speaker and text filters in the URL. Topic/speaker waypoints scroll to results; a guide's return link restores the filter selection. Empty and unknown filters offer a clear reset.

## Verification

- Application TypeScript check passed.
- Production Vite build passed; existing large-chunk and mixed-import warnings remain.
- All nine individual guides checked at desktop, tablet and phone sizes (three passing browser cases).
- New filter/waypoint/return/reload/empty-state scenario passed at all three sizes. Initial failure identified ambiguous select labels; explicit accessible labels fixed it.
- Twenty design-check views: zero findings. Saved separately to `.local/debate-checks.json` to preserve other ongoing review work.
- Twelve review screenshots refreshed; desktop light and phone dark crops and full desktop layout visually inspected. `content/design-review/shots.json` updated. Owner design acceptance remains unset.
- Page prose regenerated with `bun scripts/export-pages.ts`; source and handoff documentation updated.

No public deployment or Git push was performed. The collection remains nine guides; this change organizes and explains them rather than adding new transcript records.

## Hover refinement

Removed the persistent gold background and border from the first featured card. All three now rest neutrally. Pointer hover or keyboard focus strengthens the illustration stroke from 1 to 1.45, adds a subtle drawing glow and lights the card border over 280ms. Topic illustrations receive the same line treatment. Touch devices avoid sticky hover states, and the existing reduced-motion setting disables transitions.

Production build passed. Browser inspection verified equal resting cards, hover/reset on all three cards, focus, reduced motion and navigation in light and dark themes. Four landing screenshots were refreshed; the dark hover treatment was visually inspected.

## Topic navigation correction

The shared anchor effect watched pathname and hash, so choosing another topic while the URL already ended in `#collection` updated the filter without returning the collection to view. The debate room now handles collection navigation by React Router location key, including repeat visits to the same URL, and moves keyboard focus to the collection heading after rendering the results.

Application TypeScript and production build passed. Nine browser cases passed across desktop, tablet and phone: all five topics, repeated selection of the same topic, speaker navigation, browser back, reload, existing filters and all nine individual guides. Regression assertions check that the collection heading is in the viewport and focused, rather than checking only the URL and record count.

## Approved collection cards: local only

Implemented the approved A+B merger using `DebateCard.tsx`, `DebateArtwork.tsx` and `debate-card.css`: nine distinct line drawings, slim illustration rail, description directly beneath the title, taller speaker/VS panel, no divider beneath the panel and no arrow. The whole card opens its guide. Hover and focus strengthen the artwork and illuminate the border.

Application TypeScript and Vite build passed. Nine debate browser tests passed against the existing preview at 8931. All nine cards passed layout, description order, speaker separation, unique artwork, no-arrow, no-divider and navigation checks at 1440, 768 and 390 pixels in both themes. Desktop hover and the restored five-tab header were checked. Desktop dark and phone light screenshots were visually inspected; four design-review screenshots were refreshed.

The user's latest instruction explicitly limits this implementation to local preview. No deployment or Git push was performed.
