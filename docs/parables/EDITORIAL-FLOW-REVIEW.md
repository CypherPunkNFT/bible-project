# Overall flow and wording: implementation step 9

Implemented 11 October 2026 after authorization for the next step. This pass connects the existing content into a clearer reading sequence; it does not reopen the theological readings or expand the inventory.

## Changes

The introduction now gives a short route through the page: choose a theme or search, open Scripture, then use the study. An in-page link makes Learning to listen available before a reader starts.

Each study now offers its selected Bible passage immediately after the title and guiding question, before the setting and commentary. This link stays synchronized with the Gospel account selected below and with reference-search results. The existing reader link beside the account note remains useful for returning to the passage after studying it.

Narrative parables retain Before the story begins, Follow the turn and The turning point. Brief comparisons use The setting of the teaching, Look closely at the image and The point of comparison; the two related figurative teachings use The central emphasis. The three observations remain an editorial reading aid, not a claim that every image narrates three events. Choose another study is now the return label for all forms.

Learning to listen follows the study, before the optional collection-count explanation. Its four cards remain visible in the approved grid. The Gospel guidance refers to linked passages and setting notes rather than assuming a particular tab interface. The footer distinguishes the KJV text, the seven expanded commentary discussions, their attributed alternatives, and the editorial aids.

Shared page guidance lives in `src/data/parables-page-copy.ts`, used by the interface and the review exporter. CONTENT.md now includes the actual four practice paragraphs, early Scripture links and form-appropriate emphasis labels, rather than only describing the practice-card layout. Exported Markdown links were read back and corrected before delivery.

## Verification

The browser suite verifies early reader links across all 57 studies and every account selection, appropriate movement headings, the order of Scripture/setting and guidance/scope, reader navigation and existing interactions at three widths in both themes. The source wording and study inventory are unchanged at 57 studies / 96 ranges / 610 verse references. Final execution results are recorded in the handoff. Local preview only; step 10 still awaits authorization. No publication.
