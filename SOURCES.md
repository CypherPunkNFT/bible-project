# Sources

## Reference directory and corpus dashboard (2026-10-06, local preview)

`/sources` and `/versions` contain the reference preamble, a corpus dashboard in the Bible website's visual style, eight expandable collections plus unassigned acquisitions, author/work/source browsing, the complete searchable bibliography, study/atlas credits, 18 collection and acquisition reports, source institutions, and the existing 37-Scripture edition table.

The [sources dashboard handbook](content/library/SOURCES-DASHBOARD.md) documents all categories, inventory definitions, acquisition evidence, export boundaries, known gaps and exact refresh commands. The shared wiki bibliography reconciles catalogues, manifests, inventories and on-disk provenance; the website adds its published study citations. Snapshot: **16,498 reference records**, **15,479 acquired files verified**, **30,904 library files / 5.30 GB** including metadata. Records are not unique books. **701 acquired identities remain incomplete**; unresolved collection placement is visible rather than omitted.

`scripts/sync-corpus-dashboard.py` imports the metadata-only wiki export. `scripts/source-directory.ts` builds `public/content/sources/directory.json`. Source bodies, private permission files, absolute paths and worker internals stay local; only dated aggregate search/embedding measurements are exposed. Later acquisitions need an explicit snapshot refresh. No collectors or embedding jobs are changed.

Validation covers TypeScript, targeted lint/build, acquisition-evidence regression tests, metadata projection, collection/author search, source links and responsive browser checks. This revision is built locally; website publication is a separate release step.

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
| [engwebster](sources/ebible/engwebster/) | Noah Webster Bible (1833) | English | 39/27/0 | 2024-08-01 | 505370152413cdf7 |
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

## Reference library — downloaded 2026-10-07 (owner: "let's get everything")

Highly respected reference works, added so that person, place and topic pages can show researched, credited
information. **None is used on the site yet.** Each "Planned use" is a to-do, and the full plan is in the project's
`REFERENCE_LIBRARY.md`. Everything is fetched by `scripts/fetch-sources.py`; two of these sources update in place
(Theographic, OpenBible Topics), so a fresh download can differ from these checksums.

| File | What · Planned use | Licence | Checksum |
|---|---|---|---|
| [isbe](sources/crosswire/ISBE.zip) | James Orr (ed.), *International Standard Bible Encyclopedia* (1915), about 9,000 articles; CrossWire SWORD module, version 2.2 · **the in-depth article on person, place and topic pages** | Public domain (CrossWire: "DistributionLicense=Public Domain") | 4de747545d9c349a |
| [smith-xml](sources/ccel/smith-bibledict.xml) | William Smith, *Smith's Bible Dictionary* (1863/1884), CCEL edition · a second classic-dictionary voice on person, place and topic pages | Book public domain; CCEL claims its electronic markup, so the text is used, not CCEL's markup | f0aa85b544f70384 |
| [hitchcock-xml](sources/ccel/hitchcock-bible-names.xml) | Roswell D. Hitchcock, *Bible Names Dictionary* (1869), CCEL edition · **the meaning of each name** on person and place pages | as above | 43390f72248bb368 |
| [fausset-ocr](sources/archive-org/fausset-bible-encyclopedia-1900.txt) | A. R. Fausset, *Bible Encyclopaedia and Dictionary, Critical and Expository* (1900 printing), Internet Archive item `bibleencyclopedi0000arfa_c4x1`, machine-read (OCR) text · a third dictionary voice, **after cleaning** | Public domain (1900; author died 1910) | 1dd222ab3f21cb1f |
| [theographic](sources/theographic/theographic-bible-metadata.zip) | Robert Rouse, *Theographic Bible Metadata*: people, places, events, periods and dates linked to verses (GitHub `robertrouse/theographic-bible-metadata`, master) · dates for the people periods, events on person pages, a timeline, a cross-check of family links | **CC BY-SA 4.0**: credit Theographic; anything built from it is shared under the same licence | 16b4def7d1bf491a |
| [openbible-topics](sources/openbible-topics/topic-scores.zip) | OpenBible.info *Topical Bible*: modern topics with verse references ranked by reader votes (generated 2026-10-05; updated weekly) · today's topics beside Torrey's and Nave's, verses ranked by votes; **references only** (its quotations are ESV, which is under copyright) | **CC BY**: credit OpenBible.info | ba9c95ecc5377ca0 |
| [strongs](sources/openscriptures/strongs.zip) | James Strong's Hebrew and Greek dictionaries, Open Scriptures edition (GitHub `openscriptures/strongs`, master) · **word study pages**, keyed by the Strong's numbers already in our KJV | Public domain (files: "rights: Public Domain") | b462cb85fd7e825f |
| [hebrew-lexicon](sources/openscriptures/HebrewLexicon.zip) | Brown, Driver & Briggs, *Hebrew and English Lexicon* (1906) with Strong's Hebrew, Open Scriptures' Hebrew Lexicon (GitHub `openscriptures/HebrewLexicon`, master) · word study pages (Hebrew) | Text public domain; this edition **CC BY 4.0**: credit Open Scriptures | 907bcdcd507b40b9 |
| [thayer-ocr](sources/archive-org/thayer-lexicon-1889.txt) | Joseph Henry Thayer, *Greek-English Lexicon of the New Testament* (1889 printing), Internet Archive item `thayer-lexicon`, OCR text · word study pages (Greek), **after cleaning** | Public domain (Internet Archive marks it CC0) | 345d42ff7be84bdf |
| [josephus-antiquities](sources/gutenberg/josephus-antiquities-2848.txt) | Flavius Josephus, *Antiquities of the Jews*, tr. William Whiston, Project Gutenberg #2848 · "outside the Bible" history notes on person and place pages | Public domain in the US (Project Gutenberg edition) | bb2e32da8ba3adc1 |
| [josephus-wars](sources/gutenberg/josephus-wars-2850.txt) | Josephus, *The Wars of the Jews*, tr. Whiston, Project Gutenberg #2850 · as above | as above | 9a72663aefa6b22b |
| [josephus-life](sources/gutenberg/josephus-life-2846.txt) | Josephus, *The Life of Flavius Josephus*, tr. Whiston, Project Gutenberg #2846 · as above | as above | 7c4408526f781f67 |
| [josephus-apion](sources/gutenberg/josephus-apion-2849.txt) | Josephus, *Against Apion*, tr. Whiston, Project Gutenberg #2849 · as above | as above | b6791c018b1033ea |

Nave's *Topical Bible* (above, `nave-xml`) was downloaded on 2026-10-03 but is not used yet. Its planned use is the
Topics expansion (about 14 super-categories), merged with Torrey's.

**Not used, on purpose:** the Thompson Chain-Reference Bible and modern study Bibles (ESV, NIV) are under copyright,
and Vine's *Expository Dictionary* has an unclear copyright status.

URLs: CrossWire `https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/ISBE.zip`; CCEL
`https://ccel.org/ccel/{s/smith_w/bibledict,h/hitchcock/bible_names}.xml`; Internet Archive
`https://archive.org/download/<item>/<file>_djvu.txt`; GitHub archives of the three repositories above; OpenBible
`https://a.openbible.info/data/topic-scores.zip`; Project Gutenberg `https://www.gutenberg.org/cache/epub/<n>/pg<n>.txt`.

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

## Commentary and biblical-theology collection (L06, 2026-10-05)

The [L06 report](content/library/reports/scripture-studies/REPORT.md) documents 47 linked holdings and 155 indexed sections, retaining passage boundaries, edition locators, all eight requested themes and author-specific interpretations. Two historical Internet Archive editions—Vos (1903) and Berkhof's New Testament Introduction (1915)—were acquired in PDF and host OCR: four original files, 25,927,121 bytes, with hashes in the [manifest](content/library/reports/scripture-studies/acquisition-manifest.json). CCEL, Gill's Bible Study Tools presentation and Baker's hermeneutics edition remain source links; private contents evidence and a licensed preview do not imply republication rights. Existing Vos/Berkhof identities are reused. No new full-text search or public publication is created.

## Doctrinal collection (L07, 2026-10-05)

The [L07 report](content/library/reports/doctrinal-studies/REPORT.md) records complete selected chapter inventories for Charles Hodge's three-volume Systematic Theology, A. A. Hodge's 1877 Outlines, Owen's Justification, and Warfield's five lectures. Two historical books were acquired as four unchanged PDF/OCR files, 35,047,686 bytes; [the manifest](content/library/reports/doctrinal-studies/acquisition-manifest.json) retains hashes and provenance. CCEL full texts remain source links. Shared doctrine terms organize 129 sections; Scripture attribution, editorial companions and sermon-match evidence stay separate. No new public downloads or full-text search ingestion.

## Historical standards (L08, 2026-10-05)

The [L08 report](content/library/reports/confessional-standards/REPORT.md) identifies nine acquired files: six named Creeds.json witnesses, two lwalen Second London witnesses and a 1767 Flavel scan from Oxford/Google via Internet Archive. [Pinned URLs and hashes](content/library/reports/confessional-standards/acquisition-manifest.json) preserve original bytes. Creeds.json's Unlicense excludes listed texts, including its Savoy file; only selected eligible files were fetched. The lwalen files carry CC0. Flavel's modernized text needs further provenance review before republication; the 1767 scan is separately identified. Continental/Anglican/Savoy CCEL witnesses remain links. Original proofs are citations, not exposition coverage, and no public publication or full-text ingestion changed.

## Christianity and Islam collection (L10, 2026-10-05)

The [L10 report](content/library/reports/islam-studies/REPORT.md) records 13 primary holdings, 21 indexed chapters/lectures and nine source-based question comparisons. Three Zwemer PDFs from the Zwemer Center are retained unchanged: 22,060,863 bytes with [hashes and provenance](content/library/reports/islam-studies/acquisition-manifest.json). The 1905 and 1916 historic texts have scoped U.S. public-domain assessments; the undated ATS *Moslem Christ* impression has only the host's reading/download permission, with public reuse unresolved. AOMin and Baker works, Piper's article and the attributed Ally response remain source links. Quran.com supplies contextual references; five short English excerpts are collated against named translations at the Quranic Arabic Corpus. Modern text/media and translations are not republished or ingested into full-text search. No public publication changed.

## Historical lives and missionary testimony (L13, 2026-10-05)

The [L13 report](content/library/reports/historical-lives/REPORT.md) documents seven identified editions in 12 acquired files: five paired Internet Archive PDF/OCR holdings (Brainerd, M’Cheyne and three Paton parts) and two Gutenberg HTML witnesses (Rutherford and Knox). The [manifest](content/library/reports/historical-lives/acquisition-manifest.json) preserves original URLs, final destinations, hashes and 89,995,054 content bytes. Named static Gutenberg mirror files retain all electronic notices. Historic-text public-domain treatment is scoped to the United States; public hosting and full-text indexing remain uncleared. Firsthand and later accounts, explicit abridgments, contributor identities and Paton’s 1898/1889 metadata conflict are retained in the catalog and source-linked issue register. No publication selection changed.

## Church, preaching and missions (L12, 2026-10-05)

The [L12 report](content/library/reports/ministry-resources/REPORT.md) identifies ten new holdings and 50 components, reusing 18 existing work references. One historic Spurgeon first-series volume was acquired from Internet Archive in PDF and host OCR: 17,600,369 bytes with immutable [provenance and hashes](content/library/reports/ministry-resources/acquisition-manifest.json). Nine holdings remain authorized source links at Banner of Truth, CCEL, Gutenberg, IVP, Desiring God and Monergism. Modernization, source permissions and historical edition gaps are preserved. Thirty scoped assessments distinguish doctrine, dated practice and ministry advice across eight areas and five audiences. No public publication or full-text index changed.

## Modern sermon text acquisition (2026-10-05)

The [modern text report](content/library/reports/modern-texts/REPORT.md) tracks original downloaded reading files, SHA-256 hashes and extracted text separately from policy/index evidence. At the owner's direction, the active acquisition now processes only Piper's existing full HTML sermon texts. Further PDFs, books, broad discovery and new transcription are deferred. The [PDF list](content/library/reports/modern-texts/PDF-INVENTORY.md) preserves acquired files and the [source queue](content/library/reports/modern-texts/SOURCE-QUEUE.md) documents deferred sources. Copies are private and remain outside public publication and app full-text indexing. Live counts are regenerated by the local worker.

## Annotated study paths (L14, 2026-10-05)

The [five study paths](content/library/reports/study-paths/PATHS.md) reuse 24 existing catalog works in 15 ordered stages. The [selection register](content/library/reports/study-paths/resources.json) retains source links and exact assigned locations; the [access record](content/library/reports/study-paths/source-access.json) distinguishes PRDL discovery, Monergism linking, Desiring God permissions and MLJ systematic-retrieval restrictions. No new source files were acquired, no full texts republished and no catalog editorial status promoted. See the [report](content/library/reports/study-paths/REPORT.md) for scoped verification and remaining gaps.

## Ordinary-print OCR and font repair (2026-10-05)

The [whole acquired-PDF audit](content/library/reports/ocr-completion/REPORT.md) checked 4,737 files and 121,755 pages without read errors. Three parallel Windows English OCR workers recovered 21 visually approved pages in ten existing documents; two font-specific repairs restored extraction on 247 pages. [Page dispositions](content/library/reports/ocr-completion/page-dispositions.json) distinguish completed OCR, non-prose pages, existing historical text and explicitly deferred difficult/specialized material. Derived reading files retain page locators and hashes; no original PDFs, old derivatives, source rights or public publication changed. No new downloads. OCR remains machine text with scoped visual boundary checks and recorded corrections, not a complete scholarly proofread.

## Historical collection-level ready text (2026-10-05)

The [ready-text batch report](content/library/reports/historical-text-corpora/REPORT.md) records 91 source-offered Monergism EPUB editions across 23 eligible historical authors, discovered from one author-organized index. The primary batch comprises 79 editions with 24,036,037 extracted words; 12 editions disclosing publisher AI transcription/translation are excluded from that batch and retained for review. Text counts include overlapping collections. [Open local EPUB/TXT files](content/library/reports/historical-text-corpora/FILES.md); [hashes, source URLs, edition metadata and quality checks](content/library/reports/historical-text-corpora/acquisition-results.json). All offered volumes of the Edwards, Whitefield and Owen Hebrews sets were acquired; previously downloaded CCEL Calvin commentaries were reused. No scan downloads or new OCR. [Monergism's permissions](https://www.monergism.com/monergism-copyright-permissions) support private study copies and source linking, not republication of curated files. Nothing was added to public publication or app full-text search.

## Considered and left out

- **KJV in the UK:** public domain everywhere except Britain (perpetual Crown patent). Only relevant if the
  site is ever published to UK readers.
- **Modern copyrighted translations** (NIV, ESV, NKJV, NASB, NLT…): not free; never included.
- **Wycliffe** is in, but covers only nine books.
# L11 pastoral care — text-first acquisition (2026-10-05)

**Library-wide follow-up:** [Verified text-source audit](content/library/reports/text-backlog/REPORT.md) replaces the format-only transcription queue. Seventy-six of 77 PDF candidates have substantial existing text in sampled pages; the other has an existing alternate-edition transcription. Sixty-three complete, source-offered CCEL ThML files were acquired with original hashes and restricted-license asset records, including all 45 Calvin commentary volumes. [Manifest](content/library/reports/text-backlog/ready-text-acquisition-manifest.json) and [source decisions](content/library/reports/text-backlog/text-resolutions.json) retain direct text URLs, edition cautions, partial-source findings and unresolved authorized free-text access. No new OCR or public republication occurred.

Seven complete CCEL ThML transcriptions acquired: Owen's *Mortification* and *Temptation*, Ryle's *Holiness*, Watson's *Lord's Prayer*, Boston's *Crook in the Lot*, Flavel's *Keeping the Heart*, and Gill's *Practical Divinity*. See [bibliography and reading index](content/library/reports/pastoral-care/REPORT.md) and [immutable acquisition manifest](content/library/reports/pastoral-care/acquisition-manifest.json). CCEL's [permissions](https://www.ccel.org/about/copyright.html) govern electronic packaging; personal/educational acquisition is not public redistribution clearance. Six prior work/edition identities are reused. The previously acquired 1813 Flavel *Token for Mourners* PDF/OCR is [deferred](content/library/reports/pastoral-care/deferred-pdfs.json), not counted as a reliable transcription. Prioritize existing readable text; avoid further OCR/scan processing unless requested.
