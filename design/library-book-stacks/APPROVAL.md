# Approved collection artwork

The owner approved the latest collection mock on 2026-10-17. Apply revised option 01 with its realistic side-book proportions and staggered edges.

Applied locally at http://127.0.0.1:8931/bible:

- 22 representative side books: seven Historical, three Poetical, four Prophetical, four Epistles and all four Gospels.
- Historical at the far left, Poetical above Prophetical beside it, and Epistles above Gospels on the right.
- Varied widths, thicknesses and offsets on both edges; Joshua and Ezekiel remain broad and thick.
- Desktop piles touch an invisible common baseline. No shelf, drift or rotation.
- Latest mobile correction: below 768px, show only the five center category books and upright Revelation. Hide the side piles and collapse their row; all 22 side books remain visible at 768px and wider. This applies to the page and mock.
- The original five center category books and upright Revelation retain the approved mock's artwork and responsive dimensions.
- Desktop Read/Listen remain side by side with Library below. Mobile keeps Read, Listen, Library and equal card heights.
- The latest dark Listen card and localized purple glow are preserved.

Application artwork: `src/components/bible/BibleCardArt.tsx` and `bible-card-art.css`. Shared representative selections and dimensions: `src/components/bible/collection-stacks.json`; the mock generator reads this same file. Names and categories are validated against `data/catalog.json`.

The local application build passed. Visual/layout checks passed at 320, 390, 640, 641, 767, 768, 1024, 1440 and 1636px in both themes (18 cases), including exact selections/order, readable labels, dimensions, colors, staggered edges, common baselines and original center sizing. Evidence: `.local/collection-approval/verification.json`; screenshots are beside it. Existing Read/Listen source and unrelated gallery entries are preserved.

The mobile display correction supersedes the original all-books-visible phone layout. Its focused verification is recorded separately in `.local/collection-center-only/verification.json`.

Approval applies locally. No deployment or background data jobs were requested or started.
