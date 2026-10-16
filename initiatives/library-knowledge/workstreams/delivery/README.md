# W7 — Delivery and measurement

**Current implementation direction, 13 October 2026:** [System design](../../DESIGN.md) · [Active KR backlog](../../TODO.md) · [Handoff protocol](../../HANDOFF.md). KR-100/150/160/170: evaluation, reproducible compiler releases, current-source delivery and selective refresh. The detailed checklist below retains the earlier product scope; current task state lives in the central backlog. New connected-research processors remain proposed.

[Initiative](../../README.md) · [Tasks LK-304–306 and LK-501–504](../../TODO.md)

Integrate workstream outputs into a reliable public release and maintain them as the library changes.

Own export assembly, route integration, build manifests, public eligibility enforcement, verification, rollback and outcome reporting. Preserve the existing source directory and one-entry-per-source convention; do not turn SOURCES.md into a paragraph per generated page.

Deliver a versioned release manifest, concise results report and reproducible checks. Record inputs, artifacts, bytes, distinct works, reviewed products, stale/failed/unresolved counts and evaluation outcomes.

Execution checklist: validate evidence/schema/reader targets; exclude ineligible public bodies; run appropriate existing page checks; measure search devices and held-out queries; verify no browser request to local/private services; prepare rollback; publish under applicable authorization; verify deployed routes and assets.

Implement refresh by dependency hashes, not repeated full regeneration. Retain provenance history and redirect or remove invalidated reading targets. Maintain a single central backlog rather than parallel competing completion lists.

Acceptance: production works when the owner's PC is off, published outputs have traceable inputs, failed refresh preserves the last good release, and reporting distinguishes generated drafts from released content.

Boundary: no duplicate intake/embedding workers, no collection-wide re-audit, no model swap, and no staging of other chats' unrelated modifications. Targeted meaningful checks replace per-file test suites.
