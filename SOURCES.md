# Sources

**Class:** LIVING · **Downloaded:** 2026-10-03

Every text the Bible Project uses, exactly as downloaded. Get them all with `python scripts/fetch-sources.py`
(into `sources/`, never edited); the site's data is generated from them by `scripts/build-data.py` and
`scripts/build-study.py`. Each eBible folder keeps its original
zip (`<id>_usfm.zip`), the unpacked USFM book files, and the publisher's own copyright page (`copr.htm`).

eBible.org updates files in place, so a fresh download can differ. The checksum below (first 16 hex
characters of the zip's SHA-256) identifies the exact copy this project was built from.

## Bible texts — all from eBible.org, all marked "Public Domain" in their own copr.htm except the Hindi IRV (CC BY-SA 4.0)

Books column = Old Testament / New Testament / Apocrypha-Deuterocanon, from eBible's
[catalogue](sources/ebible/translations.csv).

| Folder | Text | Language | Books | eBible date | Checksum |
|---|---|---|---|---|---|
| [eng-kjv](sources/ebible/eng-kjv/) | King James Version (1769 text) with Apocrypha, with Strong's numbers | English | 39/27/14 | 2026-09-26 | 0e0359e9e488582a |
| [eng-kjv2006](sources/ebible/eng-kjv2006/) | King James Version, no Apocrypha, with Strong's numbers | English | 39/27/0 | 2026-09-26 | 2e698d1c6e865341 |
| [enggnv](sources/ebible/enggnv/) | Geneva Bible (1599) | English | 39/27/0 | 2024-03-16 | bbbd83ac1b3f019e |
| [engtnt](sources/ebible/engtnt/) | Tyndale New Testament (1534) | English | 0/27/0 | 2020-12-20 | f9ccffa0956bcad8 |
| [engWycliffe](sources/ebible/engWycliffe/) | Wycliffe Bible — five books of Moses and the Gospels only | Middle English | 5/4/0 | 2016-11-08 | eb71616d28ddf05b |
| [engDRA](sources/ebible/engDRA/) | Douay-Rheims (1899 American edition), Catholic, from the Latin Vulgate | English | 39/27/7 | 2022-11-03 | 2a4bbd180de4a7ca |
| [engwebster](sources/ebible/engwebster/) | Noah Webster Bible (1833) | English | 39/27/0 | 2024-08-01 | 505370352413cdf7 |
| [engylt](sources/ebible/engylt/) | Young's Literal Translation (1898) | English | 39/27/0 | 2019-10-20 | e50e55320bd5352e |
| [engDBY](sources/ebible/engDBY/) | Darby Translation (1890) | English | 39/27/0 | 2019-11-15 | 93fc531ac7f06d9a |
| [eng-rv](sources/ebible/eng-rv/) | Revised Version (1895) with Apocrypha | English | 39/27/14 | 2026-10-02 | ed587388c6a1935a |
| [eng-asv](sources/ebible/eng-asv/) | American Standard Version (1901) | English | 39/27/0 | 2026-10-02 | a9420074e1d96f87 |
| [engjps](sources/ebible/engjps/) | JPS Tanakh (1917), the Jewish Publication Society's Hebrew Bible | English | 39/0/0 | 2023-09-19 | 0161ec45dbb8eea4 |
| [eng-Brenton](sources/ebible/eng-Brenton/) | Brenton's English Septuagint (1844), the Greek Old Testament in English | English | 37/0/16 | 2024-09-17 | 03e4fc1f728326e8 |
| [engBBE](sources/ebible/engBBE/) | Bible in Basic English (1949/1964) | English | 39/27/0 | 2020-04-17 | b745b95462920b41 |
| [engwebp](sources/ebible/engwebp/) | World English Bible (modern English) | English | 39/27/0 | 2026-10-02 | 99ea438ef8a6a20a |
| [eng-web](sources/ebible/eng-web/) | World English Bible Classic, with Deuterocanon | English | 39/27/15 | 2026-10-02 | b09f8b9f197d05d5 |
| [engbsb](sources/ebible/engbsb/) | Berean Standard Bible (modern English; public domain since 2023) | English | 39/27/0 | 2026-10-02 | b77cc2d5161b0361 |
| [engmsb](sources/ebible/engmsb/) | Majority Standard Bible (the BSB following the Majority Greek text) | English | 39/27/0 | 2026-10-02 | fdaab9c32190ba0b |
| [hboWLC](sources/ebible/hboWLC/) | Westminster Leningrad Codex — the Hebrew Old Testament. ⚠ The *words* are public domain; the Strong's and grammar tags in the files are **CC BY-SA** (Open Scriptures Hebrew Bible) and are dropped by the build | Hebrew | 39/0/0 | 2017-12-27 | 8d59e50b9b576be8 |
| [grcbrent](sources/ebible/grcbrent/) | The Greek Septuagint (Brenton's edition) | Greek | | 2026-04-08 | cc6591b067fa69e0 |
| [grctr](sources/ebible/grctr/) | Textus Receptus — the Greek New Testament behind the KJV | Greek | 0/27/0 | 2026-10-02 | 723bd84183018497 |
| [grcmt](sources/ebible/grcmt/) | Byzantine / Majority Text Greek New Testament (Robinson-Pierpont 2018) | Greek | 0/27/0 | 2024-01-09 | c8b97cd0ace2d35e |
| [grcbyz](sources/ebible/grcbyz/) | 1904 Patriarchal Greek New Testament (Greek Orthodox) | Greek | 0/27/0 | 2026-08-08 | a39e54cf1cd228c4 |
| [grc-tisch](sources/ebible/grc-tisch/) | Tischendorf's 8th edition Greek New Testament | Greek | 0/27/0 | 2014-01-11 | 4bb15ed25a23d73e |
| [latVUC](sources/ebible/latVUC/) | Clementine Latin Vulgate (1598) | Latin | 39/27/7 | 2014-08-23 | f31ec8c0e1c38e07 |
| [spaRV1909](sources/ebible/spaRV1909/) | Reina-Valera 1909 — the classic Spanish Protestant Bible | Spanish | 39/27/0 | 2013-12-13 | 932c23472b2a919c |
| [fraLSG](sources/ebible/fraLSG/) | Louis Segond 1910 — the classic French Protestant Bible (numbers Psalm titles as verse 1) | French | 39/27/0 | 2026-10-03 | 3fc18c37af692d95 |
| [deu1912](sources/ebible/deu1912/) | Lutherbibel 1912 — Luther's German Bible, 1912 revision | German | 39/27/0 | 2025-12-29 | 8f6675ea399c3202 |
| [arb-vd](sources/ebible/arb-vd/) | Van Dyck (Smith–Van Dyck, 1865) — the standard Arabic Protestant Bible, right to left | Arabic | 39/27/0 | 2020-08-03 | 952c7e9725aeafdc |
| [cmn-cu89s](sources/ebible/cmn-cu89s/) | Chinese Union Version 和合本, simplified script, with the 1989 new punctuation. ⚠ eBible marks it Public Domain; the punctuation edition may carry a Hong Kong Bible Society copyright — settle before publishing | Chinese | 39/27/0 | 2021-10-15 | 9ddb4d15a4b85d3f |
| [cmnswcb](sources/ebible/cmnswcb/) | World Chinese Bible 世界中文圣经, simplified script — a new modern translation that follows the World English Bible closely; public domain beyond doubt. eBible calls it a draft (译本草稿) and has not yet certified it | Chinese | 39/27/0 | 2026-09-07 | dbdd2aa8b2896980 |
| [hin2017](sources/ebible/hin2017/) | Indian Revised Version (IRV) Hindi, 2019 — a revision of the long-standing Hindi Bible. ⚠ **Not public domain: CC BY-SA 4.0, © 2017, 2018, 2019 Bridge Connectivity Solutions** (the one openly licensed text; see NOTICE.md) | Hindi | 39/27/0 | 2023-04-11 | b32eac3abdda77d3 |
| [porbrbsl](sources/ebible/porbrbsl/) | Bíblia Portuguesa Mundial — Brazilian Portuguese, a translation of the World English Bible with the Deuterocanon; eBible calls it a draft still under review | Portuguese | 39/27/15 | 2026-08-19 | 9ba723320cc6eee3 |
| [russyn](sources/ebible/russyn/) | Russian Synodal Bible (1876) — the standard Russian Bible; Psalms numbered the Greek way, Psalm titles as verse 1 | Russian | 39/27/0 | 2022-11-25 | 9a61f073951b236b |
| [jpnm](sources/ebible/jpnm/) | Japanese Freedom Bible (フリーダム・バイブル) — a new modern translation; eBible calls it a draft | Japanese | 39/27/0 | 2026-08-19 | 4d48d03495728163 |
| [vie1934](sources/ebible/vie1934/) | Vietnamese Bible 1923 (Kinh Thánh) — the standard Vietnamese Protestant Bible | Vietnamese | 39/27/0 | 2022-06-09 | adf7ec3a944a822c |
| [pesOPV](sources/ebible/pesOPV/) | Old Persian Version (ترجمه قدیم, 1895) — the classic Persian Bible, right to left | Persian | 39/27/0 | 2015-04-21 | fe33d897e1eaaf48 |
| [ita1927](sources/ebible/ita1927/) | Riveduta 1927 — Giovanni Luzzi's revision of the Italian Diodati Bible | Italian | 39/27/0 | 2019-12-17 | e95a11617ef36d0c |

Not used: the Korean Bible 1910 (`kor`) — eBible's copy is missing verses throughout (1 Peter 5, most of Psalm 118,
half of Colossians 4, and about 40 chapters short), so it is left out until a complete public-domain Korean text is found.

Download URL pattern: `https://ebible.org/Scriptures/<folder>_usfm.zip`.

## Cross-references — OpenBible.info, licence CC-BY

| Folder | What | Rows | Checksum |
|---|---|---|---|
| [openbible](sources/openbible/) | Crowd-voted verse-to-verse cross-references, seeded from the public-domain Treasury of Scripture Knowledge | 344,799 | 224f28aae59812b7 |
| [openbible-geo](sources/openbible-geo/) | Bible places: 1,341 ancient places with their likely modern locations and the verses that mention them (licence **CC-BY 4.0**) | 1,341 | 2dfa8440f2da1f54 |

From `https://a.openbible.info/data/cross-references.zip` (file dated 2026-09-28). **CC-BY means the site
must show the credit "Cross references from OpenBible.info"** — done on the site's Sources page.

## Atlas satellite imagery — NASA, public domain

| Folder | What | Checksum |
|---|---|---|
| [nasa-bluemarble](sources/nasa-bluemarble/) | NASA Blue Marble Next Generation (cloud-free true colour, ~500 m per pixel) in web-Mercator, cut by NASA's GIBS service. In use since the motion rework: `bluemarble-region.jpg` (whole Atlas area lon −18…74, lat 10…49, 5,000 px, 1.4 MB), `bluemarble-region-preview.jpg` (1,500 px, 0.2 MB) and 12 close-up tiles `bluemarble-tile-<row>-<col>.jpg` (core lon 8…58, lat 13…46 in a 4×3 grid, 2,500 px each, 0.3–0.8 MB; loaded only when zoomed in). Earlier files in the folder (`bluemarble.jpg`, `bluemarble-core.jpg`, the 8,000 px region) are superseded, kept, unused. The fetch script prints every file's checksum; the exact requests are in `REQUEST.txt` | region 8a90efd89edfe33a, preview 6c18cbe82cfa2111 |

Fetched 2026-10-03 by `scripts/fetch-imagery.mjs` (the exact request is in `nasa-bluemarble/REQUEST.txt`).
The site serves copies from `public/atlas/` and never calls NASA at run time. **Google Earth imagery was
considered and refused**: its terms forbid downloading or storing it, and the only permitted route (Google's Map
Tiles API) is billed per use and needs Google online every time the map loads.

## Study resources — downloaded 2026-10-03 for the Study pages (TODO section G)

Only facts (event names, topic names, verse references, names and family links) are taken from these. STEP
Bible's own study tables (its Harmony, Miracles, etc.) have no published licence and are **not** used.
`scripts/build-study.py` checks these checksums before it reads anything.

| File | What | Licence | Checksum |
|---|---|---|---|
| [robertson-harmony](sources/gutenberg/robertson-harmony-36264-h.htm) | A. T. Robertson, *A Harmony of the Gospels for Students of the Life of Christ* (1922), Project Gutenberg #36264 — its contents list gives every part and numbered event with its Gospel references | Public domain in the US (published 1922); Project Gutenberg licence for the file | 105aac29a024f977 |
| [tipnr](sources/stepbible/TIPNR.txt) | STEP Bible's *Translators Individualised Proper Names with all References* — every person, place and other proper name, with description, family, tribe, era and every verse | **CC BY 4.0** — the page must credit "STEP Bible" with a link to www.STEPBible.org | 63a129dac8c34177 |
| [torrey-xml](sources/ccel/ttt.xml) | R. A. Torrey, *The New Topical Text Book* (1897), CCEL's marked-up edition with parsed references | Book public domain; CCEL claims its electronic markup, so only the book's facts (topics, references) are used | e49a064b857b186c |
| [torrey-txt](sources/ccel/ttt.txt) | Same, plain text | as above | 0999ab464a05a1d1 |
| [nave-xml](sources/ccel/bible.xml) | Orville J. Nave, *Nave's Topical Bible* (1896/1903), CCEL edition | as above | dc58dd4e37d5af63 |
| [nave-txt](sources/ccel/bible.txt) | Same, plain text | as above | d78906aead3f71b8 |
| [easton-xml](sources/ccel/ebd2.xml) | M. G. Easton, *Illustrated Bible Dictionary* (3rd ed., 1897), CCEL edition | as above | 10e3f432e38ee819 |
| [easton-txt](sources/ccel/ebd2.txt) | Same, plain text | as above | 291260d29a0ddef7 |
| [faith-names](sources/cypherpunk-faith/faith-names.json) | The owner's Names of God list from his CypherPunk NFT Faith page (322 names with KJV verses, compiled by the owner from Torrey's Topical Textbook and other references) — snapshot taken 2026-10-03 of the file last changed in CypherpunkNFT commit `cf44968` (2026-10-01) | Torrey public domain; the owner's own selection | 6f4a81addb2fb18c |
| [faith-names-approved](sources/cypherpunk-faith/faith-names-approved.json) | The owner's approved grouping (Father / Son / Holy Spirit, 302 names), display names and removals, from the same page | the owner's own | eefc8b30bb085be4 |

URLs: `https://www.gutenberg.org/files/36264/36264-h/36264-h.htm`; STEP:
`https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Proper%20Nouns/` (the TIPNR file);
CCEL: `https://ccel.org/ccel/{t/torrey/ttt,n/nave/bible,e/easton/ebd2}.xml` and `…/cache/<name>.txt`.

The **Names of God** page reads the snapshot above (refresh: copy the two files again from the owner's CypherPunk NFT site, update `bundled-sources/`,
diff, then update the checksums) — never the live files,
and never edits that site.

## Four Gospel portraits (2026-10-04)

The narrative map uses the existing Robertson harmony references and KJV chapter/verse counts above.
Eight original reading guides in `src/data/gospel-portraits.ts` were checked against their cited local KJV
passages. They describe observations in those passages, rather than importing commentary text.
The map follows each Gospel's written order; Robertson supplies the event groupings. Its 185 entries
include one without a Gospel passage (the appearance to James), so the portrait browser has 184 entries.
Passage lengths count distinct KJV verses within each selection, including disjoint or overlapping ranges.

## Christian library collection desk (2026-10-05)

The [collection charter and catalog](content/library/README.md) establish the broader Calvinist
evangelical library requested by the owner. [sources.json](content/library/sources.json) records
discovery sources, current policy evidence and unresolved access questions. These are research records,
not a list of downloaded books or cleared reuse permissions. No library content was acquired in L00.
Future category missions store immutable downloads under the resolved `sources/library/` directory,
edition/asset/checksum records under `content/library/catalog/`, and a concise acquisition pointer here.
The owner will request each category separately; see [the backlog](content/library/BACKLOG.md).

### Spurgeon published sermons acquired 2026-10-05

The [Spurgeon acquisition report](content/library/reports/spurgeon/REPORT.md) inventories the 63 pulpit
volumes (1855–1917) and 3,568 numbered index entries, including explicitly identified guest and historical
material. The original individual and whole-volume PDFs remain under the resolved
`sources/library/source-spurgeon-gems/` root. [The manifest](content/library/reports/spurgeon/acquisition-manifest.json)
records every URL, timestamp, full SHA-256 and byte count; [the reconciliation](content/library/reports/spurgeon/reconciliation.json)
documents index errors, swapped numbering and the incorrect individual link for *Comfort Proclaimed*,
whose correct text is in volume 4, PDF pages 673–683.

These digital files use the archive's [free, unchanged, attributed-use permission](https://www.spurgeongems.org/about-us/),
recorded as **restricted-license**, not an unrestricted open license. [Run-specific access evidence](content/library/reports/spurgeon/source-access.json)
supplements the initial source-registry defaults. This acquisition does not publish the files or create a
full-text search index. Exact current totals and remaining metadata checks are in the report and its summary.

## Modern preaching source inventory (L04, 2026-10-05)

The [modern preaching report](content/library/reports/modern-preaching/REPORT.md) records five ministry access decisions and two complete bounded biblical sermon inventories: Piper’s Ruth (1984), four sermons, and Sproul’s 2 Peter (2008), twelve. Six eligible authors are mapped to official sources; 16 sermons have passages, sequence, archive dates, durations and destinations. All 20 format records are link-only. No sermon files or transcripts were downloaded, indexed or published. The ministry inventory documents permission-dependent retrieval, unresolved source methods and provisional-author holds.

## Sermon coverage research (L05, 2026-10-05)

The [all-66-book coverage report](content/library/reports/sermon-coverage/REPORT.md) separates source-assigned main texts from body-assessed exposition and incidental citations. It audits 3,795 core units, identifies exact unmapped chapters/verses, preacher concentration and unfinished corpus boundaries, and checks all 83 recorded series memberships. [Gap discoveries](content/library/reports/sermon-coverage/gap-resources.json) link to three official Piper messages and Princeton's 1583 Calvin Deuteronomy edition record. They remain outside the catalog numerator; no new sermon bytes or public content were acquired by this audit.

## Considered and left out

- **KJV in the UK:** public domain everywhere except Britain (perpetual Crown patent). Only relevant if the
  site is ever published to UK readers.
- **Modern copyrighted translations** (NIV, ESV, NKJV, NASB, NLT…): not free; never included.
- **Wycliffe** is in, but covers only nine books.
