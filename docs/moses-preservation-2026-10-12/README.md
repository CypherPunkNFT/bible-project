# Moses: preserve the current individual page

Prepared 12 October 2026. The owner's clarification was that “here” means the **current Moses individual page**, before its replacement with the selected merged mockup. This is the preservation stage; it does not implement or publish the redesign.

Integration follow-through, 12 October 2026: the approved design is now implemented in `src/components/moses-page/` and connected to the real individual-page route. The current preview at `http://127.0.0.1:8931/people/moses` was rebuilt. Desktop/mobile browser checks pass for all three acts, scene controls, maps, family navigation, all 786 references, 31 book counts, themes, the old record-ID route and the existing leader/prophet pages. Normal-motion transitions and keyboard navigation were also checked. This original backup remains intact.

Target: `/people/moses` (record `moses-exo-2-10`). Selected design: `/mockups/moses-directions/#merged`, including the Cinema direction's full-screen acts and giant Roman numerals.

## Preserved material

`current-page.json` consolidates the complete current person record, family catalogue rows, authored story, exact Scripture references, per-book counts, source paths, and comparison results. `original/` preserves the original data and relevant rendering/navigation source with SHA-256 hashes in the bundle's manifest. These are historical backups; the existing content and data remain the runtime authority.

The current individual page contains:

| Material | Destination in the merged individual page |
| --- | --- |
| Name, description, era, tribe, first reference and any catalogue aliases | Identity/intro; retain all underlying metadata even if the new introduction is shorter. |
| Site-authored summary and six biography paragraphs, each with supporting passages | “The man.” The mockup already carries the same six paragraphs and references. Retain their full text, not only scene summaries. |
| Seven relatives: Amram, Jochebed, Aaron, Miriam, Zipporah, Gershom, Eliezer | Family tree and people constellation. The mockup has the same IDs. Keep each person's actual page reachable as well as the local detail panel. |
| All 786 verse references | “The long memory,” accessible from the individual page. Preserve a readable, keyboard-accessible full reference list alongside the visualization. |
| Counts across 31 books, totaling 786 | Mentions-by-book view within “The long memory.” Keep numerical counts accessible without relying on pointer hover. |
| Links to Moses as leader and prophet | Keep `/people/moses/rule` and `/people/moses/word` reachable during migration. The new page may integrate their material without breaking existing inbound links. |
| Site-authored-story credit and links to its sources | Sources section, adjacent to the retained biography where practical. |
| STEP Bible/TIPNR credit, CC BY 4.0 attribution, and explanation of STEP's AI-adapted descriptions | Sources section. Distinguish the site's sourced biography from STEP's older short/article fields. |
| Older STEP short biography and article | Preserved verbatim in the bundle. These are superseded in the current UI by the site-authored story, so do not promote them as extra verified narrative or merge duplicate prose into the new story. |
| Back navigation and incoming catalogue/family/search context | Preserve the existing `BackLink`, carried navigation state and person-slug resolution when integrating the design. |

## What exists in the design, and what still needs integration

The merged mockup already incorporates the biography and family data. Its “Long memory” is a separate mockup direction (`#memory`), backed by `design/moses-directions/data/memory.json`; retaining only the merged screen would lose access to that experience. The bundle records exact comparisons of verse IDs and book counts, not merely matching totals.

The mockup family tree opens details through `data-fam` buttons. That is useful additional interaction, but the current individual page's family chips also navigate to relatives' individual pages. Preserve that navigation explicitly.

The mockup's Scripture links use hard-coded KJV reader URLs. The current page uses shared `RefLink` and the site's reader behavior. Integrate through the existing reader helpers so passage spans and established reading behavior survive.

The biography currently says that the wilderness years are told “on his page as a leader.” When those years are integrated into this page, update that cross-reference to the relevant act or keep a working leader-page link. Do not silently remove the associated narrative or verse citations.

Keep the approved design's three acts, scene navigation, maps, sourced detail, question sections, and source-layer distinctions. Do not replace the rich current reference material with only the short narrative visible above the fold.

## Implementation acceptance checklist

- The selected merged design becomes Moses' individual page, not a replacement for the generic profile of every person.
- Full-screen acts I, II and III and giant Roman numerals follow the approved mockup.
- The biography summary, six paragraphs and their passage spans remain available.
- All seven relatives remain reachable by their person IDs and actual person routes.
- Every one of the 786 original verse IDs remains accessible; book counts match the 31-book source distribution.
- Reader links, old person URLs, leader/prophet URLs, source credits and contextual back navigation continue to work.
- Mobile layout, keyboard navigation, focus handling and reduced motion are checked during implementation.
- Preserve unrelated unpublished source changes and refresh the established preview at port 8931 when implementation is complete.

## Verification scope

This consolidation is based on the current workspace's page renderer, person data, authored story and mockup source. The JSON bundle records exact content comparisons and checksummed source snapshots. It is not a claim that the redesign has been implemented, visually tested or deployed.

Published and verified: https://bible-project-4af.pages.dev/people/moses (deployment `a1315b97`). The full desktop/mobile regression passed on production as well as the original local preview.
