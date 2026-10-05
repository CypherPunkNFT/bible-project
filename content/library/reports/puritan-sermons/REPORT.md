# L02 — acquisition checkpoint

2026-10-05. **In progress, not a completed nine-author sermon collection.** The owner selected L03 while this work was underway. No background acquisition job remains running.

Original files, metadata responses, OCR and page maps are retained under the resolved `sources/library/source-internet-archive/asset-l02-*` directories. [Acquisition checkpoint](acquisition-checkpoint.json) lists exact files, SHA-256 hashes, retrieval provenance and the resumption point. Working PDF text and rendered inspection samples are in `.local/library/run-l02-puritan-sermons-2026-10-05`.

The acquisition reached Calvin, Perkins, Owen, Sibbes, Watson and Flavel volumes 1–3. A missing Archive item stopped the sequential queue at Flavel volume 4. Goodwin, Bunyan and Boston remain planned, not acquired. The component catalog builder is preparatory: its required `components.json` and `edition-decisions.json` have not yet been established; do not run `build` or claim catalog completion.

Verified findings to preserve on resumption:

- Calvin's `selectionofmostc00calv` has **1831** on the scanned title page (PDF page 7), although the host says 1834. Fourteen numbered sermons begin on PDF pages 27, 40, 52, 65, 78, 90, 102, 117, 130, 143, 156, 168, 178 and 191. The preceding biography is excerpted from John Mackenzie and must not be attributed to Calvin. The advertisement describes revision of the English wording.
- Perkins volumes 1–3 are mixed 1626/1631 impressions with two printed pages on many scan pages. Volume 3's PDF is image-only; its acquired OCR XML has the same page count and provides page-aligned extraction. Its Jude exposition explicitly contains 66 sermons; the Sermon on the Mount and Hebrews expositions derive from preaching but must not be split into invented delivery events. Editorial analyses are distinct. The advertisement explains suppression of some early lectures: those are historical gaps, not download failures.
- Owen's Russell volumes 8–9 (`worksofjohnowe08owen`, `worksofjohnowe09owen`) contain *Vindiciae Evangelicae*, **not** Goold's sermon volumes. Retain these accidentally acquired scans as excluded contextual acquisitions. Correct Goold volumes 8–9 (`worksofjohnowe185008owen`, `worksofjohnowe185009owen`) and supplemental volume 17 (`worksofjohnowend0017owen`) were acquired separately. The Carter title pages for volumes 8–9 say 1851, not the host's generic 1850. Goold's prefaces distinguish lifetime/posthumous printings and mention sermons he could not recover.
- Sibbes's seven volumes mix sermons, sermon-derived treatises, a commentary, memoir, prefatory notes and indexes. Host date 1862 is generic; volume 4's title page says 1863. Preserve Grosart's editorial material separately.
- Watson's two-volume 1806 *Body of Practical Divinity* advertises more than 176 sermons but prints many as catechetical topic units. Do not infer a one-to-one relationship between topics and delivered sermons.
- Bunyan's provisional eligibility can be investigated from the positive election statements in *A Confession of My Faith*; do not rely on disputed attribution of *Reprobation Asserted*.

Resume by resolving Flavel volume 4, then continue author by author. Finish the explicit contents reconciliation, evidence-backed edition decisions, per-author exclusions, canonical records and validation before marking L02 complete.
