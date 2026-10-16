# P3 source identities — completed bounded reconciliation

**12 October 2026.** Four selected Ephesians sources now have a verified private identity crosswalk, source-header evidence and unapplied registration proposals. This completes P3's investigation and handoff, not catalogue registration, public clearance or final corpus readiness.

| Source | Canonical work / edition / asset | Reader | Source-asserted print / electronic dates |
| --- | --- | --- | --- |
| Calvin commentary | Verified / verified / verified | Catalogue-only | Unknown / 1999-11-23 |
| Hodge commentary | Existing draft / existing draft / absent | Catalogue-only | [1860] / 2006-03-02 |
| Fergusson exposition | Absent / absent / absent | 36 verified pages | 1659 / 2004-11 |
| Calvin sermons, Golding translation | Existing draft / existing draft / absent | 42 verified pages | 1577 / 2005-10 |

**Verified:** 4 original-byte bindings, 4 resource UUID bindings, 3 canonical works, 3 editions, 1 canonical asset, 62 source-header assertions and 78 reader pages. Twelve preview requests succeeded: four whole-work routes, four selected record checks and four content-hashed bundles. Route HTTP responses alone were not counted as readable text. Selected files, database rows and export records were unchanged at final verification. The selection spec, manifest and all six immutable chapter objects remained unchanged.

**Unresolved:** 1 work + 1 edition + 3 assets (5 canonical records; 3 incomplete chains); 2 exact-edition on-site texts; 1 translator-to-contributor binding; 1 legacy work-ID discrepancy; 1 print date and 1 print publisher. Composition dates, delivery dates and editor identities remain unestablished for all four sources. All four need output-specific public-use review before new exports. The previously documented Fergusson numbering conflict remains unchanged. These counts describe overlapping dimensions and must not be added into a total of missing sources.

## Concrete corrections proposed

- **Reuse existing draft identities:** Hodge and Calvin sermons have canonical work/edition records referenced by their exact-byte resource records. Preserve these IDs instead of allocating replacements. Their asset records still need registration. Fergusson still needs work/edition/asset reconciliation.
- **Preserve Calvin's legacy assertion:** the sermon acquisition metadata names an older work ID whose canonical file is absent; the resource registry references an existing reconciled work and matching edition. Both assertions are recorded, with the existing canonical chain selected and a later reference-reconciliation proposal. No merge or source edit was performed.
- **Correct contributor roles:** Golding is identified as translator by the held title although the reader currently lists him as an author. Pringle is explicitly named as translator in Calvin's commentary header but absent from its reader credits. A similarly named existing exported contributor is retained only as a candidate, not bound by name similarity. Transcription/markup credits remain separate from editor attribution.
- **Fill supported metadata:** preserve the three print dates, four electronic dates and separate publisher roles; populate supported English language fields and existing reader work/edition links. Keep Calvin commentary and sermon editions separate. Galatians/Ephesians containers receive no invented component IDs.
- **Keep use assertions separate:** restrictive acquisition flags, existing TCP readable availability and source-header rights wording remain visible. No new permission or `evidenceOnly` hold was introduced; lawful private analysis remains authorized.

## Outputs and verification

All detailed evidence lives under `KnowledgeBase/library-knowledge/parallel-preparation/03-source-identities/`:

- `identity-crosswalk.json` — selected document/resource/canonical/contributor bindings, dates, reader proofs, existing use assertions and input fingerprints.
- `source-header-evidence.json` — 62 exact XML selectors, match indices, texts and attributes tied to the original hashes.
- `registration-proposals.json` — unapplied field/relationship proposals, including original paths/hashes for missing assets; no new canonical IDs allocated.
- `validation.json` — passing source, canonical chain, reader, HTTP and before/after input checks; unresolved counts retained.

This folder contains the reusable [reconcile.py](reconcile.py), this report and [handoff.json](handoff.json). The adapter calls existing shared crosswalk functions with a four-document selection; it does not modify those functions. Run from BibleProject with `KnowledgeBase\.venv\Scripts\python.exe -B Website/initiatives/library-knowledge/parallel-preparation/03-source-identities/reconcile.py`. A rerun refreshes only P3 outputs. Selected sources are hashed; the full databases and library are not scanned or hashed.

Corpus build remained `2026-10-07T23:00:34.844772+00:00`. **Final-snapshot recheck is required** after intake completes. Canonical registration, role corrections, reader integration and public-use decisions belong to later coordinator tasks. No pipeline, vector, shared catalogue, original, prior capture, production or wiki files were changed. No public deployment or new preview server was started.
