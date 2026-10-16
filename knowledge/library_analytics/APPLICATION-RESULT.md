# LA-04 metadata application: measured result

**13 October 2026. Source application completed and verified. Live corpus metadata incorporation and the remaining LA-04 reconciliation/consumer delivery are pending.**

| Measure | Result |
| --- | ---: |
| Accepted upstream field proposals rechecked against current records and canonical evidence | 12,089 |
| Distinct original hashes with durable identity fills | 12,086 |
| Reader records receiving a missing canonical edition ID | 3,751 |
| Corpus fields registered for the existing intake owner | 8,338 |
| Live corpus fields changed in this operation | 0 |
| Source-verified contributor entries restored in both catalogues | 6 |
| Existing contributor memberships represented, unchanged | 159 |
| Files changed in the successful application | 528 |
| Files changed on a repeated full application | 0 |
| Rejected/stale proposals in this application | 0 |
| Existing editorial overrides and their credits preserved | 4 |
| Tests passed: analytics/metadata, baseline, existing library regression | 46 + 3 + 14 = 63 |
| Indexed chunks before / after | 8,458,873 / 8,458,873 |
| Intake / embedding runs started | 0 / 0 |

The 3,751 reader corrections were applied to both `public/content/teacher-library/` and `.local/teacher-library-unpacked/`. These are two projections of the same records, not 7,502 additional works. Existing records retained every field except the accepted missing identity values: rights, credits, titles, availability, page bundles, routes and contributor memberships are unchanged.

The six contributor entries are James R. White (5 memberships), the Particular Baptist assembly (148), Mrs. John G. Paton (1), Shabir Ally (3), Yusuf Bux (1) and Zakir Hussain (1). The assembly remains an institution. The four source-designated context-only contributors retain that classification; no biography or teaching endorsement was created.

Durable source files are `content/library/identity-corrections.json` and `content/teachers/contributor-identities.json`. The existing reader builder and intake metadata planner consume them. The 8,338 corpus fields comprise 8,335 work IDs and three edition IDs; **none are reported as applied to the live corpus**. They require an authorized refresh through its existing owner. Unchanged title/body/locator inputs retain chunk IDs in the intake integration fixture; real title changes can invalidate corresponding embeddings and must be measured during that refresh.

Application receipt: `KnowledgeBase/library-analytics/pipeline/applications/la04-20261013T150106211920+0000/summary.json`. Its `verification-*.json` receipt checks all 528 post-images and saved originals, confirms only identity fields changed in reader records, verifies the six authorities and 159 memberships, and loads the existing override owner successfully. The zero-change repeat receipt is under `applications/la04-20261013T150151196907+0000/`. `latest-metadata-application.json` selects that successful repeat.

An earlier attempt encountered a Windows lock replacing its JSON journal. All 528 target pre-images were verified restored before the successful rerun. Recovery now uses an immutable prepared journal and append-only, flushed checkpoints; checkpoint failure cannot prevent restoration. The failed attempt and rollback receipts remain under `applications/la04-20261013T145317342432+0000/`.

Remaining: incorporate the 8,338 corpus fields through the intake owner, reconcile 9,652 held-original gaps plus ten CSEL cases, and deliver permitted analytical outputs through the existing UI. Two unresolved Flavel proposals remain excluded from the accepted batch. Earlier analytical releases stay immutable, dated snapshots and require a metadata refresh before being presented as current. No public build or deployment was performed.
