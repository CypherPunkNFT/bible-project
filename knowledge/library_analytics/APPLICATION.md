# Controlled source metadata application

`apply.py` implements the LA-04 source-application portion. It rechecks the selected LA-01 release, validates target/counterpart fingerprints and canonical evidence, and registers original-hash-bound identity fills through existing metadata owners. See [actual results](APPLICATION-RESULT.md).

Run from `Website/` using the native Python launcher:

```text
D:\Python\python.exe -B -m knowledge.library_analytics.apply --inspect
D:\Python\python.exe -B -m knowledge.library_analytics.apply --prepare
D:\Python\python.exe -B -m knowledge.library_analytics.apply --apply
D:\Python\python.exe -B -m knowledge.library_analytics.apply --verify <application-folder>
D:\Python\python.exe -B -m knowledge.library_analytics.apply --rollback <application-folder>
```

`--prepare` writes a private plan without source changes. `--apply` uses the existing analytical coordinator lease, checks dependency hashes and expected file pre-images, stages reversible before/after images, and writes only the two source correction files plus reader record/shelf/catalogue metadata. It verifies package idempotence and watches the read-only corpus version and embedding progress fingerprint. The live corpus and vector store are never opened for writing; intake, extraction, embedding, graph enrichment and deployment are not invoked.

Runtime receipts live under `KnowledgeBase/library-analytics/pipeline/applications/<run-id>/`. A successful run has `application-plan.json`, `summary.json`, an immutable `file-journal.json`, append-only `file-events.jsonl`, and staged `before/` and `after/` images. Full verification adds an immutable `verification-<id>.json`. Rollback restores only files that still match the application's after-image, preserves subsequent external edits and emits a separate `rollback-<id>.json`; it also recovers a replace completed before its checkpoint. The prepared journal is never repeatedly replaced on Windows. Zero-change runs have empty journals and still recheck current source evidence.

`content/library/identity-corrections.json` accepts only missing `workId`/`editionId` values, bound to a recorded original SHA256 and registered canonical objects. An edition must belong to the recorded work. Conflicting populated identities stop application. `content/teachers/contributor-identities.json` references exact existing author authority objects and preserves their person/institution and eligibility distinctions. It does not infer identity from fuzzy labels or write biographies.

The existing `scripts/teacher_identity_overrides.py` merges these fills with its four editorial overrides, preserving their authorship and translator credits. General fills can be work-only and can describe originals absent from the reader; the reader package owner scans current records once and skips absent originals. `scripts/build-acquired-teachers.py` consumes the same fills and source authorities, including canonical stub memberships that previously had no contributor shelf. No full reader rebuild was needed for this application.

`knowledge/library.py` consumes the identity source through `plan_library()` on the next authorized corpus refresh, adds it to input provenance, and still checks actual original bytes during import. An unregistered legacy asset edition cannot mask a validated edition fill; its original assertion remains preserved in asset metadata. A resume that merely continues embedding an old corpus is not a metadata refresh. This operation has not installed an automatic refresh trigger or repaired the separately documented completion watchdog.

Corpus import remains a staged, owner-controlled rebuild. Chunk identity includes document, title, body and locator; a metadata correction that changes the chosen title can change chunk IDs. Existing vectors remain reusable for unchanged IDs, but no zero-reembedding promise is made for a future refresh. Earlier analytical release manifests remain historical evidence; generate a new metadata snapshot before delivering current consumers.

Focused verification includes original-hash/canonical binding, conflict guards, work-only fills, context-only/institution preservation, unchanged memberships/rights/credits, legacy owner compatibility, a real isolated intake fixture, zero-change repeated application, failure during publication, recovery before checkpoint, a locked checkpoint and later external edits. The intake fixture uses only temporary project test databases. Dependencies available in the owner's normal user Python environment must also be visible when running this fixture; a restricted sandbox profile may not see user-installed packages.
