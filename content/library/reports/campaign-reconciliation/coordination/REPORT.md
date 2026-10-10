# Single intake and embedding coordination

**Pending. The final reconciled corpus has not reached verified passage/vector parity.**

The live numbers and completion result are maintained outside the corpus at `KnowledgeBase/campaign-coordination/REPORT.md` and `summary.json`. This report is a fixed handoff so its updates cannot repeatedly invalidate the corpus.

Preparation incorporated into the checked intake plan: **33,640 original metadata overlays**, **18,450 work records**, **17,365 edition records**, **11,817 asset records**; **61 source profiles**; **3 recovered original-to-text links** for **1 Perkins work**, with **535 page locators**. The plan has **0 metadata/derivative conflicts**. **299 canonical-work/resource-title variants** retain their separate metadata. These are catalogue records and representations, not distinct book counts.

Catalogue preparation classified **44,460 body representations**: **44,249 original representations**, **211 duplicate originals**. Snapshot held-file, support-file and published text counts are in the live report. Before coordination: **8,458,873 passages**, **2,053,285 saved vectors**, **6,405,588 remaining**; these are worker progress numbers, not a final parity verification.

**3 excluded-author archive moves proved** against old published inventory, RB05 disposition and exact archived SHA-256; **0 unexplained missing inputs** at that check. Rebuilds recheck these proofs and refuse unknown losses. No excluded body is restored or live SQLite record edited.

Unresolved preparation: **146 required-metadata files**, **5,840 author-label variants**, **37 source labels/aliases**, **25 source-documentation gaps**, **2 explicit image-only text deferrals**. **9,685 legacy source work IDs across 10,216 representations** are retained as provenance rather than dangling catalogue references; authority registration remains pending. None creates a new evidenceOnly hold.

The current embedding writer and loaded completion owner finish naturally. A hidden successor/report monitor then invokes `knowledge/finish-intake.ps1 -Resume` under its existing exclusive lock. The updated pipeline waits for broad acquisition phases, checks archive disposition, refreshes once inputs settle, reuses valid vectors and verifies both parity and actual publication of preparation outputs. Existing watchdog recovery remains enabled; it now preserves active verification and fresh acquisition waits. No acquisition job is stopped. Failed downloads remain in existing TODO ledgers; no download retries, OCR, enrichment or publication is launched.

Runtime evidence: `intake-plan.json`, `archive-moves.json`, `legacy-catalogue-identities.json`, `guard-validation.json`, `download-failure-ledgers.json`, `monitor-state.json`; `published-handoffs.json` is produced after final intake. Validation: **22 focused intake/watchdog tests passed**, plus **4 isolated archive-loss guard checks**. Existing model/revision and **2,560 dimensions** match the saved vector identity.
