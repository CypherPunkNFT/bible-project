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
