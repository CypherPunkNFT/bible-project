# RB13 - catechisms, new believers, family and children

**1,491 new complete resources; 0.613 GB; 6 acquisition sources; approximately 1,337 distinct works by normalized author/title.** Held originals, duplicates, samples and catalogue files are excluded. Complete tracts/booklets count as resources; Founders chapters are grouped as whole books.

| Source | New resources | GB |
|---|---:|---:|
| TCP | 75 | 0.039 |
| CCEL | 2 | 0.000 |
| IA | 718 | 0.338 |
| CHAPEL | 672 | 0.191 |
| FOUNDERS | 11 | 0.005 |
| DESIRINGGOD | 13 | 0.038 |

| Audience | Resources |
|---|---:|
| children | 548 |
| youth | 1,010 |
| new believers | 1,181 |
| parents | 1,491 |
| teachers | 1,491 |
Audience counts come from manifest `audiences` fields; multi-audience resources appear in multiple rows. Assignments use provider catalogue/edition metadata and titles, not certified age levels.

Failed requests: **77**. Complete editions unavailable/wrappers: **22**. Source blockers: **0**. Prior failed IDs excluded by filters: **41**. Catalogue endpoint failures: **4**, superseded by public inventories. TODO: `failed-downloads.json` / `FAILED-DOWNLOADS-TODO.md`. No retries or new evidenceOnly holds.
Ministry editions with editor/change fields: **696**; named editors: **3**; source-stated adaptation/edition notes: **131**. Unstated editor/changes remain null, with status and evidence basis; originals are not locally rewritten.

Passage total before: **1,934,778**. After-command snapshot: **1,934,778**. Change: **+0**. Embedded: **1,934,778 to 1,934,778**. Snapshot 2026-10-07T16:52:55.679411+00:00 (complete).
Fewer than 100,000 new passages: the shared intake is waiting for a pre-existing source-database reader before incorporating this batch.

`finish-intake.ps1` invoked after downloads (active in background); shared pipeline **waiting_for_source_database_reader**, exclusive lock protects against a second embedding worker. New-file import/embedding remains pending; passage changes may include other concurrent acquisitions.
Processing blocker: existing bulk TCP acquisition holds a database reader (PID 96980); the intake pipeline waits rather than interrupting that job.

Historical selection screens Reformed/Baptist/orthodox Protestant authors and 1800s evangelical Sunday-school/tract publishers. Chapel uses its complete public sitemap plus 2026 PDF catalogue, Founders its complete public book taxonomy and whole-book chapter API, and Desiring God its complete offered book catalogue. No worksheets, previews, advertisements, new OCR or public publication.
