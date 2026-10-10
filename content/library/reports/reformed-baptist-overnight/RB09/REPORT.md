# RB09 re-run: interpreting genres and difficult passages

**530 new originals; 1.000 GB; approximately 298 distinct works; 4 sources.** Counts exclude held files, first-run acquisitions and 41 unrelated author matches retained outside intake. Work count uses normalized author/title; edition variants may remain.

| Source | Files | GB |
|---|---:|---:|
| TCP | 10 | 0.043 |
| SWORD | 35 | 0.029 |
| CCEL | 6 | 0.017 |
| IA | 479 | 0.911 |

**35 SWORD text exports, 0.061 GB**, additional to originals and not counted as books. **38 distinct failed/deferred items; 0 export failures; 0 collector blockers.** URLs/errors: `failed-downloads.json`; checklist: `FAILED-DOWNLOADS-TODO.md`. Failed requests were not retried. Originals, contributors and credit metadata retained; no new evidenceOnly flags.

**Passages before: 1,934,778. After: 1,934,778. Change: +0. Embedded: 1,934,778 → 1,934,778.** Latest progress snapshot: 2026-10-07T16:52:55.679411+00:00.

`finish-intake.ps1` ran after downloads. **Processing pending:** completion state `waiting_for_source_database_reader`; intake PID 79768 waits for pre-existing TCP reader PID 96980 to release the database. No second embedding worker was started.
Fewer than 100,000 new passages: this batch awaits intake behind the pre-existing database reader, so its downloaded texts have not yet changed the passage total.

Scope: Fairbairn Typology; Terry Hermeneutics; Angus Bible Handbook; historical Edersheim and Lightfoot catalogues; unheld Josephus editions; screened SWORD Bible dictionaries, topical handbooks and biblical language references. Catholic teaching and liberal theological sources excluded. Existing source text only; no new OCR. Source documentation: `Website/SOURCES.md`; all originals listed in `acquisition-manifest.json`.
