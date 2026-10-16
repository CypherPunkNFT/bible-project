# P5 · Locate a bounded next set of source passages

**Outcome:** useful exact text locations from already selected sources, prepared without vectors or library-wide relevance claims. Extend the available evidence locally without relabelling existing provisional packages as complete.

Read EPHESIANS-CONNECTIONS.md, BOOK-SELECTION.md, EVIDENCE-CONTRACT.md and the evidence-tool README. Read the immutable Ephesians spec/manifest under `KnowledgeBase/library-knowledge/ephesians-connections-20261012/`. Reuse existing capture/verification tools through track-local scripts only; do not modify their implementation or previous captures.

## Bounded selection

Inspect at most **12 source sections**: the six held Hodge Ephesians chapter divisions and one Calvin sermon from each chapter, selected deterministically as the first sermon assigned to that chapter in the existing structural manifest. Produce at most two uniquely located intact prose samples per section, for a maximum of 24 samples. Choose meaningful opening exposition after headings and Scripture quotation tables; do not manufacture a second sample to meet a quota. This is a location study, not comparative interpretation or comprehensive coverage.

For every selected section, preserve the exact selector, heading, original hash, document ID, text offsets, neighbouring context and explicit reference wording. Compare to existing selected-document corpus chunks only. Ambiguous or missing matches remain unresolved. If the text has no explicit verse-level reference, retain chapter-only scope. Never infer verse ranges from thematic resemblance or force section headings into a Bible verse map.

Keep translator credits, encoded gaps and uncertain speaker attribution. Exclude text spanning a gap rather than concatenating around it. Existing Fergusson numbering conflict remains untouched. For Calvin sermons, check existing reader blocks and the supported whole-work route; for catalogue-only Hodge, record the actual state without using an external text as a reader destination.

## Deliverables and acceptance

Private outputs: `selection.json`, a new source-location collection or compatible sidecar using the existing contract, `verification.json`, and a concise unresolved selection list. Distinguish attempted sections, located samples, ambiguity failures, chapter-only references, explicit verse references and verified on-site samples. State how many independent works/authors are actually represented.

Verify exact text and offsets, original hashes, immediate context and locator integrity against the bounded inputs; use a read-only SQLite connection and short transactions if needed. Read selected inputs again before completion. If the corpus build changes, retain source-anchored work but flag corpus locators for final-snapshot reconciliation. No vectors, model/encoder calls, reference-index writes, graph updates, editorial answer generation, new rights decisions or full-document reprocessing. No retries on hard source failures: record them and continue with the other selected sections.

Own only this track's directories. P3's identity work is independent; use existing IDs and null unresolved canonical IDs. Finish with RESULT.md and handoff.json under the shared contract.
