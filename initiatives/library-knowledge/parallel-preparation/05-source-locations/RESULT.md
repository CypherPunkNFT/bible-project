# P5 result: bounded source locations

**Completed 12 October 2026 for the bounded preparation task.** Located and captured 12 intact prose samples across all 12 selected sections: six Hodge chapters and the first Calvin sermon stored for each chapter in the existing structural manifest. One useful sample per section was sufficient; the 24-sample ceiling was not treated as a quota. This is provisional location evidence, not comprehensive mining or doctrinal approval.

| Measure | Verified count |
| --- | ---: |
| Sections attempted / successfully located | 12 / 12 |
| Private captured samples | 12 |
| Selected works / named authors | 2 / 2 |
| Samples matched to existing on-site reader blocks | 6 (Calvin) |
| Samples without on-site text | 6 (Hodge) |
| Chapter-only bindings / assigned verse IDs | 12 / 0 |
| Sections with legible numeric verse-reference wording | 11 |
| Unresolved selected locations / ambiguity failures / hard source failures | 0 / 0 / 0 |
| Encoded gaps retained across selected sections | 408 |
| Scripture-reference containers with encoded gaps | 2 |

Literal reference wording is retained separately from exposition. Calvin chapter 1's epigraph has damaged numeric labels; no labels were reconstructed. The first stored sermons for chapters 4 and 5 are titled the second sermon on those chapters; selection follows the specified manifest order without silently correcting or expanding it. All 12 locations still need claim-specific voice/interpretation review and final-snapshot reconciliation. Public-use and identity decisions remain separate. The 408 gaps are existing source defects elsewhere in the selected sections, not gaps bridged by these samples.

## Outputs

Private outputs are under `KnowledgeBase/library-knowledge/parallel-preparation/05-source-locations/`:

- `selection.json`: source hashes, selected section/paragraph selectors, literal reference evidence, Unicode offsets, reader matches and gap counts.
- `capture-spec.json` and `collection.json`: reusable selection specification and 12 captures using the existing evidence contract, including immediate neighbouring corpus context and translator attribution.
- `verification.json`: successful shared capture verification and before/after input consistency.
- `source-verification.json`: independent XML-selector, source/corpus-offset, attribution and reader-block checks.
- `unresolved.json`: no failed selected locations; remaining editorial, identity, availability and completion gates.

The authoritative files are at that directory's root. `development-01/` retains a superseded first pass with incorrect paragraph selector syntax; do not consume it. The final selectors were corrected and independently verified before this handoff.

This proposal folder also contains `locate_samples.py` and `handoff.json`. Run the helper from Website using `..\KnowledgeBase\.venv\Scripts\python.exe -B initiatives/library-knowledge/parallel-preparation/05-source-locations/locate_samples.py`. It refuses to overwrite existing outputs; reuse requires an explicitly separate output generation, not an unreviewed refresh of these files.

## Verification and limits

Input corpus build: `2026-10-07T23:00:34.844772+00:00`, unchanged at final verification. Selection is bound to the existing Ephesians spec and six `release-final` chapter packages. All 13 recorded input file hashes remained unchanged, including the two selected originals, upstream packages and reader-bundle input. All 12 section and paragraph selectors resolve uniquely; all source and corpus offsets verify; all six Calvin samples match existing reader blocks. This verifies local packaged reader data, not production deployment or passage deep-link support. Arthur Golding's translator attribution is retained from the source-title assertion.

Fifteen earlier paragraph prefixes did not match corpus chunks exactly; the bounded selector moved to subsequent eligible paragraphs, preserving these attempts. These are paragraph-alignment misses, not failed source downloads, retries or missing sections. No full-source repair was attempted. Shared capture verification passed with no stale reasons. No additional test suite was needed for this bounded data preparation.

Only the two P5-owned directories were written. No source, catalogue, existing evidence capture, graph, vector, pipeline-status, shared code, wiki or production-site changes were made. No vector searches, encoding, intake, deployment or downloads ran.

## Proposed integration, not applied

1. Join these location sidecars to the existing Ephesians connections by source document and connection IDs; retain original candidate history instead of rewriting the immutable LK-202 packages.
2. Reconcile P3 identity outcomes without inventing absent canonical IDs. Review the 12 sampled local voices and literal reference wording before any claim or verse-range promotion.
3. Preserve six Calvin whole-work reader routes with separate page/locator metadata. Hodge remains catalogue-only until an independently authorized on-site reader exists.
4. After final intake/vector parity and gated graph completion, revalidate source/corpus dependencies before comprehensive mining or release. Source-location verification alone grants no publication eligibility.
