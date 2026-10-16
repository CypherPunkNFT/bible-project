# Evidence Studio: content and integration rules

All gallery content is synthetic. Open `gallery/index.html` directly; it needs no server, network or shared site build. The gallery uses local copies of Archivo and Literata and the site's parchment/dark tokens. Font licence notices are preserved alongside the fonts.

## Editorial layers

Bible context, literal quotation, attributed interpretation and site editorial response are separate blocks. The gallery omits actual Bible text and acquired excerpts. Resolve evidence and claims by shared IDs; do not keep independently editable copies in each product. A comparison retains named source roles, edition dates and objections without inferring agreement. A dossier distinguishes observation, scholarly interpretation and biblical inference; unknown dates stay unknown. Applications remain draft until reviewed.

## Review and invalidation

Candidate means unreviewed; it cannot populate a settled answer. Reviewed labels include reviewer kind and exact scope: location review is neither doctrinal approval nor public eligibility. Conflict issues quarantine affected bindings and interpretations without silently correcting sources. A changed dependency makes affected products stale; current response text is withheld until revalidation. Preserve earlier evidence and correction history. The gallery's global switch deliberately tests each template's state behavior; a production adapter must calculate status per affected evidence/claim, not mark unrelated evidence stale.

The existing v1 evidence schema remains authoritative. `template-contracts.json` proposes presentation mappings. Conflict records, verified reader availability, reference relationships and output-use decisions require existing or separately reviewed sidecars; do not add invented enum values to the v1 schema. Publication requires permitted metadata/quote/translation/editorial scope and separate claim review. Never serialize citation.private, filesystem paths or private body text into a public component.

## Citation, reading and provenance

Use one citation component for author, speaker role, translator, editor, edition/date, exact available locator, quoted text, neighbouring context, limits and review scope. Unknown locator means unavailable, never a guessed page. Preserve encoded gaps. Source URLs live only in the citation footer; they are provenance links, not reading buttons. Catalogue-only and unavailable texts remain labelled. Further reading must have an identified edition, useful relation, permitted on-site text and supported local route. Do not rank solely by similarity or use a second edition as independent evidence. The fixture has no verified reading destination and therefore renders no reading CTA.

## Layout and accessibility

Do not ellipsize quotations, attribution, source locators, uncertainties or claims. Wrap long identifiers and names. Optional context and revision history may use native details on screen; they expand for print. Required content missing from real input must show incomplete-data state rather than a plausible replacement. Optional missing fields show Not recorded or disappear only when their absence cannot mislead. Keep warning text adjacent to the affected content, not only in tooltips or colour. All controls are native, labelled and keyboard accessible; focus outlines remain visible. Two-column comparisons and sequences become stacked on phones.

Print uses light colours, expands details, removes controls and starts each specimen on a new page. Source URLs are rendered as text. Delivered print specimens are print-media PNGs, not a paginated PDF; physical printer pagination may vary and needs checking during final publication.

## Coordinator integration proposal

1. Reconcile these editorial blocks with P1 page composition without changing Teachers dimensions or acquired-shelf placement.
2. Implement a single production citation view and claim/evidence resolver against the existing schema, with explicit sidecar inputs; no production files are changed here.
3. Connect P2 questions and P3/P5 identity/location sidecars only after their handoffs are reviewed. Resolve canonical IDs rather than copying fixture keys.
4. Revalidate real corpus-dependent inputs after final intake/vector parity and gated graph completion. Do not treat this design acceptance as corpus completeness.
5. Before release, check permissions, attribution, on-site routes, mobile cost and actual final-content pagination. Fixture success is not editorial approval.

## Verification

Run `D:\Python\python.exe verify-gallery.py` from this directory (or supply its path from the project root). It uses installed Edge and Playwright, opens a file URL with networking disabled, and writes only to this track's private folder. Checks cover the 32-state matrix, shared-registry consistency, unresolved metadata, external-link placement, keyboard controls, print disclosure and source-input fingerprints. Screenshots and verification.json are in the matching KnowledgeBase track folder.
