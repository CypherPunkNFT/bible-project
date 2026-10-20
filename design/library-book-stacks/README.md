# Library book stacks — revised option 01

Preview: http://127.0.0.1:8931/mockups/library-book-stacks/

Approved and applied locally to http://127.0.0.1:8931/bible on 2026-10-17. See `APPROVAL.md`. No deployment requested.

Only option 01 remains. “Floating” means no visible shelf: the books are stationary, flat, and share an invisible baseline. The added side books have individual widths (88–100% of their pile), thicknesses (27–34px on desktop), and small horizontal offsets. Both edges vary instead of aligning against one flush side. Joshua is now 98% wide and 33px thick; Ezekiel is 100% wide and 34px thick. Soft beveled edges add depth without changing the category colors. The original five center category books and upright Revelation retain their original styling and responsive dimensions. The artwork remains one compact group with 6px joins; phone rows and piles have 8px joins.

The shared selections and proportions in `src/components/bible/collection-stacks.json` drive both the applied card and mock generator. These are decorative artwork dimensions, not page counts or estimates of biblical book length. `selection.json` records the generated selection and canonical names.

Historical is now a separate far-left pile, with four added books:

- Genesis, Exodus, Leviticus, Numbers, Deuteronomy, Joshua, Judges.

The next pile sits lower, with Poetical above Prophetical:

- Poetical: Job, Psalms, Proverbs.
- Prophetical: Isaiah, Jeremiah, Ezekiel, Daniel.

Right stack, top to bottom:

- Epistles: Romans, Ephesians, Philippians, James.
- Gospels: Matthew, Mark, Luke, John.

There are 22 representative books across the three side piles. Ruth and Ecclesiastes remain removed. Names and category membership come from `data/catalog.json` and are recorded in `selection.json`. At 768px and wider, all four columns share exactly the same bottom edge. Below 768px, show only the original center artwork: hide all side piles and collapse their row. Upright Revelation keeps the same top and bottom edges as the original category stack: 247px high above 767px viewport width, 215px at 641–767px, and 190px below that. The light/dark switch uses the site's saved theme.

Regenerate from the Website directory with `node design/library-book-stacks/build.mjs`. This writes this mock folder and its single approved design-gallery entry, removing the former 02–04 gallery cards. It does not build or change the application or run data jobs. Older option links display revised 01. Rebuilding the main application is a separate local operation.

Mock-only verification before approval covered 320, 390, 767, 768, 1024, 1440 and 1636px in both themes: varied side-book dimensions, staggered edges in every category, thicker and broader Ezekiel/Joshua, exact names/order/counts, readable labels, close joins, touching side books, common baselines, no motion or visible shelf, original center/Revelation dimensions, theme switching and Library links. Application source/build and unrelated gallery entries were preserved at that stage. Evidence: `.local/library-book-stack-realism/verification.json`. Exact preservation of the original center CSS rules is recorded in `.local/library-book-stack-realism/center-preservation.json`. The previous mock is preserved in `.local/library-book-stacks-before-realism/`.

Application verification after approval also covers 640 and 641px: `.local/collection-approval/verification.json` (18 cases). The pre-application artwork is saved in `.local/collection-approval-before/`.

Latest mobile correction and verification: `.local/collection-center-only/verification.json`. Narrow screens display only the six original center books, with no row or space reserved for side piles.
