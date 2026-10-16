# Study development workflow

## Current stage

The owner authorized the [master list](MASTER-LIST.md) for development on 2026-10-13 by asking to begin the first study. All **40** first content drafts are complete. The owner subsequently requested “Next on,” beginning the separate design pass.

Design drafts **01–05** are ready for review. The latest is [Faith in daily life](christian-life/faith-in-daily-life/design.md), connecting instruction, original setting and present application while preserving the six readings. The next item is **06 Learning to discern** in the design pass. Implementation and publication remain separate; earlier outlines and content drafts remain available.

## Pass one Content

After the owner accepts the list, start with item **01 A new creation**. Work in its category folder and give the study its own working content page. Reuse the existing page when one already exists.

For each numbered study, develop:

1. Purpose, central question and reader scope.
2. Proposed content sections or subcards and their boundaries.
3. Anchor passages, paragraph context and supporting passages.
4. Explanations, carefully attributed interpretations and the limits of claims.
5. Reader questions and possible applications where appropriate.
6. Content connections to other studies and any unresolved editorial decisions.

Keep planning notes separate from draft reader-facing text. Verify quotations and references. Begin with the text before making an application; distinguish paraphrases from quotations. Reuse existing research and study content instead of creating competing copies.

Do not design layouts, artwork, menus, animations or website components during this pass. A “card” or “subcard” means a unit of content here. No route changes, builds or publication are needed.

## What Next one means

- Before list acceptance, keep the acceptance stage explicit; do not silently start expanding studies.
- During the content pass, “Next one” advances to the next numbered study. It does not switch to design and does not independently certify every factual or interpretive claim as approved.
- A request to revise the current study keeps the current position. Record the revision, then continue that study.
- After completing the final content item, report that the content pass is finished. Do not begin design in the same turn merely because the queue ended.
- When the owner then says “Next one,” begin the design pass at **01 A new creation**.
- During the design pass, “Next one” advances through the same numbered list again.

## Pass two Design

Use the completed content as the starting point. Work through the same numbers in the same accepted order, beginning again at 01. Develop the presentation and interaction of each study at this stage, keeping changes to the underlying content visible.

Store design notes separately from the content, such as a `design.md` beside the study's working page. Design work does not by itself authorize deployment or silently replace the existing site.

## Progress record

Keep [progress.json](progress.json) current after each substantive step:

- `phase`: awaiting-list-acceptance, content, content-complete, design, or design-complete.
- `listAccepted`: true only after the owner accepts the master list.
- `currentNumber`: the study being worked on, or null before work begins.
- `nextContentNumber` and `nextDesignNumber`: the next study in each pass, or null when that pass is finished.
- For each item, record content and design status independently. Use not-started, in-progress, draft-ready, or needs-revision. Draft-ready is not the same as explicit approval.

Retain stable numbers after acceptance. Append additions or record retired items; do not silently renumber completed work. Update this workflow if the owner changes the sequence or scope.
