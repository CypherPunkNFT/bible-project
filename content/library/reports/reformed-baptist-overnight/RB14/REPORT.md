# RB14 ? Authorized translations

Date: 2026-10-07. Downloads finished; intake pending.

| Measure | Result |
|---|---:|
| New admitted translation files | 453 |
| New originals, decimal GB | 0.064918477 |
| Held translations linked and credited | 19 |
| Total translation manifest entries | 472 |
| Distinct held original work IDs | 455 |
| New books | 0 |
| Sources acquired/linked; sources screened | 3; 4 |
| Languages admitted | Spanish 471; Portuguese 1 |
| Deferred items in TODO (includes screening blockers) | 157 |
| Download/catalogue/access failures within TODO | 8 |
| Passage total before | 1,934,778 |
| Passage total after | 1,934,778 |
| Passage increase recorded | 0 |

**Sources:** Spurgeon Gems: 453 new PDFs; Chapel: 18 held translations linked; IA: 1 held translation linked; DG: 2,242 catalogue URLs, 4 original matches, 0 admitted.

**Blockers:** Translator/original links unresolved: Chapel 93, Spurgeon 44, IA 9, DG 11 (includes 4 confession/catechism editions). DG: 2,238 unmatched originals. Seven Scripture-supported target languages; Korean deferred.

**Processing:** Required finish-intake.ps1 invoked after downloads. Its existing completion pipeline owns the lock (PID 102336); state running, source database reader PID not listed. No second embedding worker started.

Fewer than 100,000 new passages were recorded because the existing intake pipeline is waiting for a TCP acquisition process to release the source database.

**Metadata:** Original-work links, named translators, language, hashes and credit retained; quality unreviewed; zero new-book credit; no evidenceOnly holds. Screening copies catalogued, then removed.

**Collector incident:** Two overlapping collectors stopped; attempted URLs consolidated before continuation. Failed URLs skipped thereafter; credit recovery used cached files.

**Files:** acquisition-manifest.json; failed-downloads-todo.json; download-cache-manifest.json.
