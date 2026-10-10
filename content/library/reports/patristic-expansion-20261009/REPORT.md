# Patristic expansion — 2026-10-09

Four sources. 4,443 acquired original/support files; 1.497 GB preserved source payload. 1,776 newly held body-text files (0.664 GB); 9 bodies reused by source ID or exact SHA-256.

| Source | New body files | Reused body files | Work identifiers / offered volumes |
|---|---:|---:|---:|
| first1k | 1,204 | 0 | 1,103 |
| pta | 536 | 0 | 208 |
| catenae | 8 | 0 | 8 |
| ccel | 28 | 9 | 37 |

Failures/deferred items: 0; see failed-downloads.json. No network retries. Empty upstream text stubs: 0. Repository analyzed duplicates, catalogue XML and support files remain outside body intake.

All newly staged originals have provenance, SHA-256, title, author, licence, format, audience and language metadata, and existing-text extraction caches. Upstream contributor and translator/editor notices are retained. No OCR or GPU preprocessing was run.

Live embedded passages before/after acquisition: 3,773,093 / 3,779,429; total corpus 8,458,873; state running. This increase belongs to the existing corpus, not to these new downloads.

`finish-intake.ps1` was invoked after acquisition and exited 0: the existing completion controller (PID 127936) owns the single-pipeline lock. The embedding worker (PID 79352) continued advancing; 3,781,029 saved vectors at handoff.

New-source passage count is pending the existing completion pipeline’s late-acquisition refresh. Fewer than 100,000 newly incorporated passages during this acquisition is expected because the active embedding pass is preserved; source texts have been prepared without starting a second writer.

Outputs: acquisition-manifest.json and its append journal; failed-downloads.json; per-source local catalogues under sources/patristic-bulk/catalogues; raw repositories under sources/patristic-bulk; ready originals under sources/library/source-patristic-*; extraction caches under KnowledgeBase/extracted-library.
