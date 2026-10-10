# RB00 — setup and collector pilots

Original book/text/module files: **102**; **0.156 GB**. Distinct source works/editions: **102** (cross-source editions overlap). Sources: **5**.

| Source | Catalogue items | Unheld items | Est. GB | Screened unheld | Screened est. GB | Pilot originals |
|---|---:|---:|---:|---:|---:|---:|
| tcp | 61,315 | 60,500 | 14.34 | 740 | 0.18 | 22 |
| sword | 427 | 406 | 0.76 | 0 | 0.00 | 20 |
| ccel | 1,300 | 1,059 | 2.58 | 48 | 0.12 | 20 |
| ia | 62,754 | 62,701 | 41.50 | 1,194 | 0.79 | 20 |
| gutenberg | 78,282 | 78,251 | 38.12 | 84 | 0.04 | 20 |

Unheld counts are catalogue IDs with no confirmed local original; duplicate editions remain separate. Catalogue-wide figures include excluded authors and are discovery totals, not acquisition approval. Screened counts use the saved historical Protestant author/module-ID filters. GB are decimal, rough pilot-size extrapolations; SWORD uses installed-byte metadata, not compressed package size. IA is the unrestricted historical `Princeton` collection through 1930, not all Internet Archive holdings.

Catalogue/API/utility originals: 124 files, 0.090 GB, excluded from book counts. One retained CCEL index wrapper is excluded from book counts and intake. TCP includes 20 EEBO plus one ECCO and one Evans adapter test; the other four pilots target 20 originals each.

Passages before: **1,934,778** (1,890,090 indexed; state reconciling). Current after-command snapshot: **1,934,778** (1,901,034 indexed; state running). Total change so far: **+0**. Snapshot: 2026-10-07T16:18:10.741123+00:00.
Fewer than 100,000 new passages: the shared intake has not yet refreshed these pilot originals because an earlier embedding pass and a separate active bulk harvest precede it.

Failures: **25** unsuccessful pilot item attempts, **1** exporter compatibility failure, and **1** discarded author-filter mismatch; all replaced or fixed, with **0** unresolved pilot download/export failures. Three catalogue loader issues were corrected. Existing index-wrapper/non-XML endpoints are skipped, not counted as books.

Processing blocker: `finish-intake.ps1` was run after downloads and exited successfully because another completion pipeline owns its lock. That pipeline is waiting on the earlier embedding worker; a separate 12-hour TCP harvest and acquisition queue remain active. These are pre-existing jobs outside RB00. No second embedding worker was started. **Pilot embedding completion and a final after-embedding total remain pending.** The changing catalogue holdings are a timestamped snapshot.

Five reusable source adapters and local catalogues are ready; SWORD text derivatives are ready for intake. No new evidenceOnly holds; contributor/credit metadata retained; no public publication.
