# L13 — History, lives, letters and missionary testimony

Completed bounded acquisition and cataloguing batch: 2026-10-05. Seven identified volumes/electronic editions, **12 immutable content files (89,995,054 bytes)**, **421 indexed components**, **17 selected source-checked assertions**, and **21 sourced relationships**. This is a substantial initial documentary collection, not an exhaustive historical library or a claim that every assertion in every book has been verified.

## Acquired collection

| Holding | Edition and scope | Indexed material | Editorial boundary |
|---|---|---|---|
| [Brainerd memoirs, diary and Journal](https://archive.org/details/memoirsrevdavid00dwiggoog) | S. Converse, New Haven, 1822; Edwards narrative and Brainerd writings arranged by Sereno Edwards Dwight | 13 chapters and one selected dated journal entry | Composite of earlier publications; editorial narrative, diary, public journal and theological reflections distinguished. Three contents page numerals remain unresolved in OCR. |
| [Bonar, Memoir and Remains of M’Cheyne](https://archive.org/details/robertmurraymcch00bonauoft) | Philadelphia Presbyterian Board reprint; archive assigns 1844; title leaf undated | Six memoir chapters and six substantial remains sections | Publisher explicitly omitted sermons and some minor writings. Miller’s introductory letter is a separate contribution. |
| [Rutherford, Letters](https://www.gutenberg.org/ebooks/42557) | Bonar’s third edition, Religious Tract Society; exact impression year unresolved; Gutenberg electronic witness | All **365 numbered letters**, I–CCCLXV | Source closing labels, headings, subject summaries and anchors retained; headings and biographical notices are editorial apparatus. Notices condensed and notes relocated relative to 1863. |
| [Knox, History of the Reformation of Religion in Scotland](https://www.gutenberg.org/ebooks/48250) | Cuthbert Lennox edition, 1905 | Four history books and the Confession/Book of Discipline appendices | Explicit abridgment and modernization; source claims the two appendices were retained in full, but they have not been independently collated. Earlier events are not Knox’s eyewitness experiences. |
| [Paton, first part](https://archive.org/details/johngpatonmissio188901pato) | Revell new illustrated edition; undated title, prefaces January/February 1889; archive assigns 1889 | Ten chapters | James Paton discloses rewriting, pruning, expansion and recasting. Retrospective autobiography with editorial intervention. |
| [Paton, second part](https://archive.org/details/johngpatonmissio188902pato) | Revell illustrated edition; undated title, preface October 1889; archive assigns 1889 | Ten chapters, including the letter section | Two planned chapters omitted. Chapter IX contains **Mrs. John G. Paton’s** family letters in fragments, not John’s letters. |
| [Paton, third volume](https://archive.org/details/johngpatonmissio03pato) | **1898** copyright and February 1898 editorial preface | Two chapters and two historical/mission essays | Archive metadata incorrectly assigns 1889. Retrospective mission testimony and earlier historical narrative retain separate classifications. |

The seven holdings represent five principal collections; the three Paton parts are connected as one ordered sequence. The canonical catalog contains 428 works (seven volume/collection records plus 421 components), seven editions, 12 assets and two series. These counts describe documentary records, not 428 independent books. No whole work has been promoted to reviewed or published status.

## What has been preserved

- [Bibliography](bibliography.json) was established before acquisition. The later Paton date correction preserves the archive’s conflicting date and its resolution.
- [Inventory](inventory.json) preserves parent works, editions, original numbering, printed page starts or HTML anchors, testimony layers, and exact source spans where available. Print chapter records are contents-level indexing; they do not claim every embedded diary entry or letter has been separately indexed.
- Rutherford’s 365/365 numbered inventory is complete for this electronic witness. Closing labels are preserved without turning letter-writing dates into preaching/publication dates. Two letters have no matching `close` paragraph; three headings (55, 166 and 257) lack source anchors. Their exact source spans remain available. Undated, editorially bracketed and otherwise uncertain dates are not invented.
- [Historical claims](historical-claims.json) preserve 17 selected assertions with exact source-file offsets and hashes. “Source checked” means the cited passage was inspected; independent historical corroboration remains a separate task. This register is not an exhaustive extraction of every claim in the books.
- [Connections](connections.json) joins people, works, churches, movements and events through 21 claim-backed relationships. It includes Bonar and the Free Church of Scotland, M’Cheyne and St. Peter’s Dundee, Knox and the Scottish Reformation, and the Paton correspondence and New Hebrides missions. Entity labels do not independently establish facts.
- [Editorial issues](editorial-issues.json) records ten material issues, including explicit omissions, modernized expression, mixed authorship and the Paton date conflict. [Reconciliation](reconciliation.json) keeps PDF/OCR manifestations together and flags the existing Edwards funeral-sermon record for future text collation, without double-counting a sermon.

Brainerd’s concluding June 19 journal entry combines reported actions with his interpretation of divine grace. Mrs. Paton’s 1867 letter distinguishes attendance and hopeful progress from actual conversion; the catalog preserves that qualification. Paton’s later claims about peoples, conversion totals and colonial policy remain attributed historical testimony. They are not adopted as the collection’s own descriptions or independently verified conclusions.

## Eligibility, rights and storage

The selected materials document Reformed/Calvinist history, ministry and missions. Edwards and Knox retain their existing author identities. Eleven additional contributors receive scoped **historical-context** records in [the registry extension](../../registry-extensions/historical-lives-authors.json); documentary admission does not approve every contributor’s entire teaching corpus. Editors and letter writers are credited separately. Mrs. Paton’s full personal-name authority reconciliation is still open; the acquired source’s identification is retained.

Raw originals are in `BibleProject/sources/library/<source-id>/<asset-id>/`, resolved through `scripts/bible/paths.py`. The [acquisition manifest](acquisition-manifest.json) records URLs, final destinations, retrieval timestamps, SHA-256 hashes and byte counts. Five print volumes have paired PDF/OCR files; two Gutenberg holdings have original HTML. Discovery and archive metadata snapshots remain provenance evidence, not additional acquired books.

Only specifically identified, unrestricted historical files were downloaded. Gutenberg files came from named static mirror paths, following its [robot-access policy](https://www.gutenberg.org/policy/robot_access.html) and [mirror guidance](https://www.gutenberg.org/help/mirroring.html). Complete electronic notices remain in the original files. Historical-text public-domain treatment is scoped to the United States; digital packaging and public reuse have separate action fields. Public hosting, redistribution and full-text indexing are not cleared by this acquisition batch. No changes were made to website publication selection.

## Reproduction and checks

From `Website/`:

```powershell
python -X utf8 scripts/catalog-historical-lives.py
python -X utf8 -m unittest discover -s scripts -p test_historical_lives.py
node scripts/validate-library.mjs
python -X utf8 scripts/read-historical-source.py claim-l13-paton-v2-omissions
python -X utf8 scripts/read-historical-source.py unit-l13-rutherford-pg42557-letter-001
```

The builder is offline and refuses content whose hashes or sizes differ from the acquisition manifest. The reader verifies the original file and the selected span before displaying it. Tests check numbered-letter completeness, raw-file integrity, component/claim span integrity, attribution boundaries, date correction, and graph provenance. The scan advertisement confirming M’Cheyne’s omissions and Paton’s 1898 copyright leaf were visually inspected; OCR was not treated as a proofread edition.

**Validation result:** eight integrity tests pass. The standard library validator passes against the current tracked catalog plus this L13 batch: 75 authors, 28 sources and 12,990 catalog records. [Validation evidence](validation.json) records the base commit and snapshot scope. At this check, the shared working tree also contained unfinished L12 ministry records with missing author/report references; those unrelated untracked records were excluded from the isolated check without changing them. This result does not certify that concurrent batch.

## Exact continuation point

See [checkpoint](checkpoint.json). No background acquisition job is running.

1. Collate and segment Brainerd’s diary/public Journal more fully, resolve three OCR page numerals, and compare identified original Journal editions. Dwight’s comments on Styles and Wesley are retained as his testimony; those editions have not been acquired for comparison.
2. Acquire an identified fuller M’Cheyne edition to restore omitted sermons and minor writings. Do not graft them into this reprint without separate edition records.
3. Establish Rutherford’s exact print impression and collate the letter text and editorial notices. Preserve the current complete numbered inventory as its own witness.
4. Acquire the relevant Laing Knox history volumes for comparison with Lennox’s abridgment; preserve documentary appendix variants separately.
5. Acquire a separately identified fuller Paton letter collection and investigate the omitted labour-traffic and annexation chapters. The later [Story of John G. Paton](https://www.gutenberg.org/ebooks/28025) is a comparison lead, not an equivalent acquired autobiography.
6. Expand beyond the present Scottish/Anglo-American concentration: continental Reformed church histories, Calvinistic Baptist records, additional missionary journals and contextual Indigenous Christian testimony. Establish bibliographies and contributor eligibility before acquisition.

Full text collation, exhaustive claim indexing, independent corroboration and website integration remain separate, explicitly uncompleted work.
