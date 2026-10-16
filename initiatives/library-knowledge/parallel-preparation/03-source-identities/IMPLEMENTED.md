# P3 corrections implemented

**12 October 2026.** The owner authorized implementation after the read-only reconciliation. The prior ownership restriction is superseded for these specific catalogue and reader corrections; the original P3 report and evidence remain a historical snapshot.

**Visible locally:** [Calvin sermons](http://127.0.0.1:8931/teachers/works/held-ec5430010801378dda5e6e5fa89e87b1), [Calvin commentary](http://127.0.0.1:8931/teachers/works/held-fac8c754eb4291391a28e94f9e285c40), [Fergusson](http://127.0.0.1:8931/teachers/works/held-140823cc0ca835eda48a3dc99d4025ef), [Hodge](http://127.0.0.1:8931/teachers/works/held-a25226498c8646bb3b062d0b3e58ccbe).

- All **4 sources now have canonical work/edition/asset chains**. Added the missing Fergusson work/edition and three assets. Existing original paths, source hashes, resource IDs and reader URLs were preserved. Two source-storage namespaces were registered without moving files.
- Registered source-bound Fergusson and Golding contributor records; existing acquired-shelf IDs remain stable. Golding is credited as translator of the selected sermons, not their author. Pringle's translator name is displayed and recorded in the edition notes; the uncertain existing contributor match remains unmerged.
- Applied English language metadata, supported print/electronic dates and separate publisher labels. Reader records now carry the canonical work/edition IDs. Calvin's legacy acquisition work ID remains an explicit external assertion on the existing canonical work.
- Added source-hash-bound overrides and integrated them into the acquired-library generator, so later builds retain these corrections. The targeted refresh updated selected packed/unpacked record and shelf metadata without re-extracting any text. Reader pages now show translator credit and expandable edition details.

## Changed implementation paths

`content/library/catalog/` contains five new records, three updated existing editions and the Calvin sermon legacy-ID note. `content/library/registry-extensions/ephesians-contributors.json` contains two scoped contributor records; `content/library/sources.json` preserves the existing campaign storage namespaces. `content/teachers/edition-identities.json` is the durable four-source correction input.

`scripts/teacher_identity_overrides.py` loads and validates these corrections and offers a bounded package refresh. `scripts/build-acquired-teachers.py` applies them during full generation. `src/pages/teachers/shared/acquired.ts` and `src/pages/teachers/LibraryWorkPage.tsx` expose translator and edition details. Generated metadata under `public/content/teacher-library`, the unpacked cache and the current `dist/` preview were refreshed. Unrelated source changes were preserved.

## Verified

- Full catalogue validation: **84 authors, 37 sources, 48,312 catalogue records**, no errors.
- Application TypeScript check passed. Vite production build succeeded; existing bundle-size and mixed-import warnings remain.
- Four browser routes passed; author/translator labels, edition details, Calvin sermon pagination (page 1 to 2), catalogue-only CCEL behavior and 390-pixel mobile width checked. No browser page errors.
- All four original hashes and all **78 existing reader pages** were preserved. All four canonical chains were checked against the selected original paths and hashes. Targeted refresh is idempotent and an unrelated record remains unchanged.

Evidence and screenshots: `KnowledgeBase/library-knowledge/parallel-preparation/03-source-identities/implementation-validation.json`, `implementation-changes.json`, `*-implemented.png`, `implemented-mobile.png`. Before-images of changed canonical inputs are in that folder's `implementation-before/`.

## Remaining

**1 translator contributor binding**, **2 catalogue-only exact editions**, **1 unestablished print date/publisher**, and output-specific public-use/editorial reviews remain. Unknown composition/delivery dates, editor identities and the Fergusson reference conflict are preserved. This implementation does not approve new public full-text use.

No corpus/registry SQLite writes, intake commands, encoder/vector/model changes, graph processing or original-file moves occurred. The existing coordinator must incorporate the updated catalogue through its normal completion pipeline; final-snapshot revalidation remains required. Historical P3 and chapter-package dependency fingerprints are not silently refreshed after these intentional metadata changes. Local implementation is verified; no public deployment or commit was performed.
