# Muslim-world country panel — four mock-ups

Preview: `http://127.0.0.1:8931/mockups/muslim-world-panels/`.

Owner request, 2026-10-09: remove the region dropdown; say “Search all 53 countries”; put a smaller country summary adjacent to search; use icons and engagement colours; reduce empty space and frame the statistics. Four alternatives, for review:

- A, Compact ledger: a framed table-like overview, counts and populations on one row.
- B, Colour rows: each engagement category has a quiet tinted row and coloured edge.
- C, Status cards: three compact colour-coded status cards; group-table rows become small cards.
- D, Ring & ledger: group-count proportions in a ring with a compact ledger; group-table engagement uses coloured chips.

The direction buttons open each in the globe context. Compare all four shows the panels together. Search selects any of the 53 actual profiles; visible globe outlines also select countries. Both tabs work in every direction. The People Groups table lists every active group for that country, with search, status filters and sticky headers. Keyboard arrow/Home/End moves between tabs; country-search results support arrow keys, Enter and Escape. Light/dark themes and narrow screens are supported. URL parameters preserve direction, country, active tab and comparison mode.

Facts are the site's existing Pew 2020 / IMB 2026-10-09 snapshot. Egypt defaults to **109.3M, 95.2% Muslim, 4.8% Christian**, not transcribed or guessed from speech. People-group population totals are a separate IMB estimate. Counts cover all recorded groups, including non-Muslim groups. Existing local flag and group assets load from `/assets/muslim-world/`; source notes and licenses remain in `content/missions/` and `public/assets/muslim-world/README.md`.

`node design/muslim-world-panels/generate.mjs` regenerates the compact country summaries, static orthographic globe context from the current Natural Earth atlas, and symbols from the installed MIT-licensed `lucide-react` library. Existing local Archivo/Literata fonts are reused. No new imagery, remote fonts, external APIs, texture memory or globe animation is introduced. The globe is a fixed illustration with selectable visible outlines; the production globe's zoom/rotation is outside this panel mock-up.

Implementation uses DOM/SVG creation without `innerHTML`. Mock-ups are served directly from `design/` by the local preview; they are not built into or deployed with the site. No direction is marked owner-approved. The production country panel remains a separate implementation pending a design choice.

Validated all four directions in both themes, including complete Egypt tables, and comparison layouts at 768, 390 and 320 px. Four Iran tables share one request and show all 47 groups; search, status filtering and keyboard tab switching work. No page/table overflow or browser errors occurred. Eight gallery thumbnails are included. The generated `design/review/` folder triggers an existing full-gallery registration check; the four new catalog entries were checked directly.
