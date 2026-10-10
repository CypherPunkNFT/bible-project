# Source documentation completion

Completed 7 October 2026. **61 canonical source profiles: 47 acquisition providers and 14 scripture/data/imagery/software sources.** **55 historical section headings preserved.**

Scope: **70,412 library files** in the existing stocktake; support/metadata files are included in those totals and are not counted as books. Four unassigned local-support files are excluded from acquisition-provider counts.

Unresolved source-policy/edition-scope documentation: **25 sources**; actionable details in `unresolved-evidence.json`. These are documentation gaps, not new evidenceOnly or import holds.

Changed: `Website/SOURCES.md` now has one canonical profile per provider, explicit official channels, held formats, policy/edition evidence, credit obligations and private-local scope. Alias/CDN/mirror descriptions are consolidated. Historical claims and per-file tables remain in `HISTORICAL-SOURCES.md`; the 63 build checksum rows are also retained directly in `SOURCES.md` for the data builders. Exact original bytes are saved in `SOURCES-before-reconciliation.md`.

Outputs: `source-documentation.json`, `source-inventory.json`, `official-consultations.json`, `unresolved-evidence.json`, `HISTORICAL-SOURCES.md`, `SOURCES-before-reconciliation.md`, and official-page snapshots under `evidence/`.

Ownership respected: no catalog records, acquisition manifests, source originals, intake code, databases, download queues, schedulers or embedding workers changed. No intake/embedding started. No public text publication or new permissions inferred.

Build compatibility verified: the normal study-source checksum gate and complete study-data build passed, with isolated generated output in `Website/.local/study-source-check/` and results in `Website/.local/study-source-build-report.json`. The reconciliation generator preserves the registry on future runs.
