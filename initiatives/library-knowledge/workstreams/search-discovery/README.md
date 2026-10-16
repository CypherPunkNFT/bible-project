# W4 — Search and discovery

**Current implementation direction, 13 October 2026:** [System design](../../DESIGN.md) · [Active KR backlog](../../TODO.md) · [Handoff protocol](../../HANDOFF.md). KR-110/120/160: measured semantic retrieval, section neighbors and compact PC-independent discovery. The detailed checklist below retains the earlier product scope; current task state lives in the central backlog. New connected-research processors remain proposed.

[Initiative](../../README.md) · [Architecture](../../ARCHITECTURE.md) · [Tasks LK-303 and LK-408](../../TODO.md)

Make prepared knowledge easy to find without depending on a local vector service.

Reuse the 85.4 MB Granite browser pack and existing engine. Its current scope is 25 studies and 31,098 WEB verses, not the full acquired library. Qwen local vectors and Granite browser vectors are incompatible; encode selected public collection descriptions with Granite.

Deliver candidate expansions to compact meaning search, prepared passage/author recommendations, public exact-reference/title lookup and optional subject packs if measured worthwhile. Reading paths and saved collections can work on the visitor's device without mandatory accounts.

Execution checklist: choose representative public descriptions; measure retrieval against the current pack and keyword baseline; measure bytes/startup/memory/latency; test query wording variation and failure states; version pack assets; preserve rollback. Quantization and sharding require measured quality rather than assumed gains.

Acceptance: useful results lead into on-site evidence and reading, queries never require the owner's PC, and mobile costs are recorded. Unknown questions should yield relevant prepared material or a clear no-match, not a fabricated fresh answer.

Boundary: no attempt to download the entire corpus into every browser, replace the live pack without comparison, or change the ongoing local embedding model.
