# RB03: later intake requirements

This is an acquisition batch. It has not been imported or embedded. Follow the owner’s fourteen-mission gate in [ACQUISITION-FOLLOWUP.md](../../../../../knowledge/ACQUISITION-FOLLOWUP.md); keep the present worker and watchdog unchanged.

The current `knowledge/library.py` planner can select manifest-backed private text derivatives for JSON and XML. Gill’s derivatives include the book introduction only with chapter 1, avoiding repeated introduction text across every chapter. Henry’s derivatives render `ThML.body` rather than raw XML markup. EPUB intake uses its existing package extraction and source member locators.

Before treating search results as passage evidence:

- Join the source-hashed [chapter inventory](chapter-coverage.json) to library records. A generic paragraph search hit does not establish a normalized verse relationship. Gill’s original verse field is `number`; his English text has an incorrect source `rtl` metadata flag.
- Keep [sparse chapter exceptions](sparse-chapter-exceptions.json) out of filled-exposition counts. Their bodies remain in the private HTTP cache, not the acquired source tree. The retained pointer-only chapter is explicitly `evidenceOnly: true`, which the current importer already recognizes as metadata/source evidence rather than a separate embedded body.
- Apply [Keach’s reviewed starting-passage map](keach-reading-map.json) and [citation exceptions](passage-exceptions.json). The EPUB headings contain wrong references. Do not regenerate relationships from those headings without the correction evidence.
- Separate author commentary, biblical quotations, introductions, publisher/editor additions, indexes and cited opponents. Henry’s non-Baptist covenant/ordinance interpretations and each Baptist author’s specific positions remain attributed.
- Reconcile [intake scopes](intake-scope.json). These files describe the required roles; this mission does not claim that the current generic importer enforces every role or contributor boundary.
- Preserve private-only publication restrictions. Monergism permits study and indexing but prohibits redistribution of its files on external websites, apps, repositories and AI datasets. CCEL’s private/educational permission is not blanket republication permission. Link to primary sources in the public app.

The future passage table should distinguish structural chapter availability, source verse-entry labels, sustained exposition, cross-reference pointers and incidental citations. Henry’s complete Old Testament chapter inventory does not imply a complete whole-Bible edition. Gill’s selected corpus does not imply all 66 books or commentary on every verse.
