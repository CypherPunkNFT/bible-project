# Spurgeon sermon inventory and acquisition

This collection covers the 63 published pulpit volumes from 1855 through 1917: *The New Park Street Pulpit*, volumes 1–6, and *The Metropolitan Tabernacle Pulpit*, volumes 7–63. The [Spurgeon Gems volume index](https://www.spurgeongems.org/spurgeon-sermons/) supplies the entry inventory; the downloaded volume PDFs, title index, Scripture indexes, and individual PDF headings provide cross-checks. Acquisition and metadata reconciliation are recorded separately.

Acquisition is complete for this bounded inventory: **63 volumes and 3,568 numbered entries**, with **no missing numbered positions** after reconciliation. All linked individual PDFs were downloaded; 3,567 supply their expected work, and the remaining work, *Comfort Proclaimed*, is available in its acquired whole-volume edition. One incorrect individual link remains documented.

The [summary](summary.json) records 3,631 works (entries plus volumes), 3,632 editions, 3,631 catalogued assets, and 64 ordered series. There are **3,652 immutable source files, 641,375,006 bytes**, including 15 supplementary PDFs, three reference indexes, and three policy/inventory snapshots. Every recorded file passed its SHA-256 and byte-count check. Catalog validation passes. These totals include historical and guest contributions, not 3,568 sermons preached by Spurgeon.

## What is preserved

The [sermon catalog](sermons.json) preserves titles and variants, original index labels, reconciled numbers, volume membership, main Scripture texts, preaching dates when documented, publication years, explicit publication dates, and dates scheduled for public reading. Each fact has source evidence or a locator. Unknown dates remain unknown; a volume year is not presented as an exact issue date. Scheduled reading is not automatically publication or preaching.

The [volume inventory](volumes.json) records all 63 volumes, their published number ranges and years, local acquisition coverage, and PDF page counts. Work, edition, asset, and ordered series records live in `content/library/catalog/`. Metadata remains catalogued, not editorially reviewed or published.

The [acquisition manifest](acquisition-manifest.json) records original and final URLs, retrieval timestamps, byte counts, MIME types, and complete SHA-256 checksums. Original files are immutable under the resolved source root, currently `BibleProject/sources/library/source-spurgeon-gems/`. The current individual PDFs and older booklet-format volume PDFs are distinct digital editions. The source's ongoing reproofing does not establish that every acquired edition reproduces original wording.

## Numbering and duplicate reconciliation

The [reconciliation file](reconciliation.json) is the detailed gap and exception register. Combined issues occupy multiple numbered positions but remain one indexed work. Abbreviated ranges such as 154–55 expand to 154–155. Letter-suffixed publications remain distinct, including the A/B replacements in volume 25.

Two index errors would otherwise create false missing-sermon reports. “Eternal Life Within Present Grasp” is labeled 1956 online and in the title index, but the linked PDF and volume heading identify **1946**. “The Seed by the Wayside” is labeled 1843 in those indexes but belongs to **2843**. The original labels remain in the catalog alongside the corrections.

The current individual index reverses **369/369A** relative to the older volume and title index. The first sermon and the opening-service report remain separate works, with a number crosswalk. Stable catalog identities follow the current individual index convention; source labels are never silently discarded.

The link labeled **221-A, Comfort Proclaimed** downloads an older version of **A Pastoral Letter**. The correct *Comfort Proclaimed* is preserved in the volume 4 PDF, **pages 673–683**, under historical number **221**, with **Isaiah 40:1** and a documented preaching date of **1856-09-21**. Both pastoral-letter copies are attached to the same work as separate editions. The incorrect link is retained as an exception, not counted as the desired sermon. The Scripture index's Jeremiah reference for this entry conflicts with the actual sermon heading and is not adopted.

Matching titles alone never establish duplicate identity. SHA-256 identifies identical files; differing editions of the same work remain separate. Whole-volume copies overlap individual sermons by containment, not by adding thousands of new works.

## Attribution and source differences

Twelve contextual contributor records identify guest speakers, the opening committee, and two anonymous historical articles. They are stored in `registry-extensions/spurgeon-context-authors.json`, which the catalog validator reads alongside the main registry. These additions do not admit the contributors to the core teacher roster. Proceedings that contain Spurgeon's contributions are marked as historical material, and his creator relationship does not claim sole authorship of every speech.

The [reference index transcription](reference-indexes.json) preserves title and Scripture index rows with PDF page locators. Appended Bible expositions are distinguished from main sermon texts. The 85 heading-comparison flags include equivalent notation and extraction differences as well as substantive differences; they are not 85 verified textual errors. A confirmed example is Luke 13:6 versus Luke 13:8 for “This Year Also.” The individual heading is the working catalog reading where available, with conflicting evidence retained. A valid Bible endpoint confirms reference structure, not the correctness of the source's attribution.

There are 1,748 records with title variants. The duplicate check found **no byte-identical files** in this snapshot. The two pastoral-letter PDFs are different digital editions of one work; their shared identity was established from their contents, not their checksums.

## Metadata coverage and remaining questions

The catalog records main texts for **3,549 entries**, documented delivery dates at their supported precision for **2,821**, explicit publication dates for **717**, and scheduled reading dates for **738**. Every entry retains its volume publication year. The 19 entries without an established main text are letters, historical reports, or contextual addresses; a verse has not been invented for them. Multi-text sermons and Scripture readings preceding a sermon receive explicit inspected corrections in [verified-overrides.json](verified-overrides.json).

The [metadata review queue](metadata-review.json) lists 747 entries without an established delivery date, 120 entries with at least one unmapped Scripture span, and 52 source-date flags. Those flags comprise 51 printed weekday/date disagreements and one delivery date printed after Spurgeon's lifetime. For example, sermon 3443 prints a delivery date of 1896-09-09; this remains visible as a source problem, not silently “corrected” to a guessed year. Some entries have no preaching occasion because they are written or documentary material.

The [verification record](verification.json) distinguishes schema, identity, checksum, passage-endpoint, and sampled visual checks. This is a complete acquisition of the specified inventory with a review queue, not a claim that every transcription or printed date is correct.

## Rights and access

The [Spurgeon Gems permission statement](https://www.spurgeongems.org/about-us/) permits free, unchanged use with credit to the author and archive. Acquired digital assets are therefore recorded as **restricted-license**, with explicit no-charge, no-change, and attribution conditions. They are not labeled unrestricted open-source editions or automatically public domain. Full-text indexing and modified editions remain outside the established permission decision.

The permission page, [robots directives](https://www.spurgeongems.org/robots.txt), and online inventory were saved with provenance before acquisition. Robots does not exclude the public PDF routes. Downloads use a named user agent, limited concurrency, launch spacing, retries, and immutable-file checks. The raw manifest includes source-policy and index evidence as well as PDFs. No public app integration or deployment is part of this acquisition.

## Reproduction and remaining review

From `Website/`, using Python with BeautifulSoup and PyMuPDF:

```powershell
python scripts/collect-spurgeon.py discover
python scripts/collect-spurgeon.py fetch
python scripts/collect-spurgeon.py support
python scripts/catalog-spurgeon.py indexes
python scripts/catalog-spurgeon.py extract
python scripts/catalog-spurgeon.py build
python scripts/catalog-spurgeon.py audit
node scripts/validate-library.mjs
```

Acquisition verifies cached checksums and refuses to overwrite existing raw bytes. This run's source snapshots are dated 2026-10-05; a future acquisition date requires new snapshot and asset identities. Do not reuse these immutable identities for changed remote files.

The bounded inventory does not claim to include every anthology, translation, later rediscovery, or unpublished Spurgeon sermon. Full transcription review, disputed dates, difficult Scripture spans, and source conflicts remain visible for later review. No sermon text has been generated to fill a gap.
