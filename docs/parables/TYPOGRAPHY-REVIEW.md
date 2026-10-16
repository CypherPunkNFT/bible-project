# Typography and readability: implementation step 8

Implemented 11 October 2026 after authorization for the next step. The page retains its serif headings, themed colors, compact icon categories and desktop four-by-two selector. Study wording, classification and navigation are unchanged.

## Reading changes

Main study prose and the supporting teaching sections now use a 1rem reading size (16px at the normal root size), with 1.8 line spacing. Long paragraphs are limited to 68ch. Prose uses the stronger ink color; subdued text remains appropriate for supporting labels. The guiding question, audiences, passage notes and section headings have a clearer size hierarchy, with more separation between substantive reading notes.

Source links are 14px at the normal root size. References, category labels, counts and search guidance have been enlarged. The search input is 16px. Passage selectors, the Clear search and Search all categories controls, and the return-to-picker control have at least 44px height. The existing mobile two-column category grid remains intact; titles and references wrap rather than clipping. Learning-to-listen cards and the scope/source paragraphs receive the same prose scale as the studies.

A site-wide important outline reset previously suppressed the page's intended keyboard outlines. A scoped rule now restores outlines for buttons, links, summaries, the search input and the focused study heading inside this page only.

## Verification and limits

`scripts/check-parables-typography.ts` measures rendered font sizes and line spacing, checks sample body/source-link contrast, keyboard focus, horizontal overflow, and reflow with 200% root text sizing. It covers 320, 390, 768 and 1440px in both themes; the larger-text check runs at 768px. The full interaction suite separately covers all 57 studies at desktop, tablet and phone widths. Screenshots of long reading notes and category cards support visual review. These are targeted checks, not certification of site-wide accessibility or every browser's zoom behavior. Final execution results are recorded in the page handoff.

Original local preview only; steps 9 and 10 await separate authorization. No publication and no changes to the Scripture corpus or study-content export.
