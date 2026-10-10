# Catalogue and provenance reconciliation

**33,640 file records improved from 44,460 held body candidates.** This is metadata preparation, not new downloading or completed intake.

| Output | Count |
|---|---:|
| New work records | 13,070 |
| New edition records | 13,465 |
| New asset records | 7,783 |
| New records validated / validation errors | 34,318 / 0 |
| Author fields added or normalized | 11,792 |
| Licence descriptions added or normalized | 16,207 |
| Contributor fields added or normalized | 21,168 |
| Credit fields added or normalized | 30,358 |
| Existing selected derivative links retained | 12,466 |
| Recorded duplicate-original groups | 211 |
| Recorded-hash conflicts / unreadable input ledgers | 0 / 0 |

Classifications: 25,826 book/treatise candidates; 10,867 sermons/messages; 7,189 articles; 379 commentary sections; 199 context-only records. Duplicates retain separate paths, source credits and edition identities; repeated representations and sections are not additional books. These are file classifications, not distinct-book counts.

**Unresolved:** 146 files lack required metadata: author missing on 101 and licence metadata missing on 103 (overlap). The registry queue contains 5,840 unmatched author-label variants and 37 source labels/aliases, not necessarily that many distinct people or providers. Available names and provenance remain in the importer manifest; these are not indexing holds.

**Coordinator handoff:** the read-only importer plan shows differing legacy fields on 632 files: 597 titles, 29 authors, 6 work IDs and 2 edition IDs. Some differences are canonical-title variants; others are older section headings replacing resource titles. Apply metadata precedence deliberately before intake; details and instructions are in `COORDINATOR-HANDOFF.md` and `importer-plan.json`.

Outputs: `acquisition-manifest.json`, `private-catalog.jsonl`, `derivative-links.json`, `duplicate-representations.json`, `unresolved.json`, `summary.json`, `validation.json`; new schema records under `content/library/catalog/{works,editions,assets}/`. Recorded hashes and source metadata were reused; originals were not rehashed in bulk.

Originals, other missions' manifests, SOURCES.md, central registries, intake code, live databases, embedding processes and schedulers were not modified. No evidenceOnly holds or public publication were created. **No intake, refresh or embedding was started.**
