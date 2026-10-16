# W1 — Foundation and evidence

**Current implementation direction, 13 October 2026:** [System design](../../DESIGN.md) · [Active KR backlog](../../TODO.md) · [Handoff protocol](../../HANDOFF.md). KR-100/101's supported section/span population is complete; KR-102 chunk/reader alignment is next, with KR-090 source-owner completion independent. The detailed checklist below retains earlier product scope; current task state lives in the central backlog. [Verified section results](../../../../knowledge/library_analytics/SECTIONS-RESULT.md).

[Initiative](../../README.md) · [Contract](../../EVIDENCE-CONTRACT.md) · [Tasks LK-101–107](../../TODO.md)

Build reliable reusable evidence collections from existing source bodies, metadata, FTS5, vectors and permitted graph assertions.

Own schema, identity crosswalk, duplicate handling, retrieval and source-location validation. Reuse canonical author/work/edition/asset IDs. Work-level deduplication must not discard edition-specific quotations. Keep unresolved identities explicit.

Deliver a validated schema, genuine example collections, versioned mining configuration, source/body/reader crosswalk and dependency manifest. Use FTS5 and references for precise candidates and vectors for broader discovery; measure shortlist quality before adding model cost.

Execution checklist: inspect snapshot and graph gates; resolve pilot identities; verify actual locators; implement eligibility fields; retrieve and rank bounded candidates; save reusable collections; prove invalidation on a changed source.

Acceptance: a reviewer can trace each item to the original context, distinguish evidence classes and reproduce the collection from recorded inputs. Schema success alone does not validate interpretation.

Boundary: no competing ingestion, model replacement, vector writes or public deployment. Existing graph repair remains coordinated through its owner.
