# Source permissions register — 27 November 2026

**What this is.** Every source Bible Guide credits, cites or uses, with what we hold from it, what its licence or terms
already let us do, and whether anyone needs to be written to. Built from what the project already records (sources.json,
SOURCES.md, NOTICE.md, the Scholars source audit and sweep, the reference directory, the reading sources, the question
bank, the acquisition reports and the sermons campaign's TERMS files). Where a source had no recorded terms, its live
robots.txt and terms page were read on 27 November 2026, and what was read is stated in its row.

**Nothing was sent. Nobody was contacted. Nothing was signed up for.** The only outside requests this job made were
reading public robots.txt and terms pages (one request each, 1.5 seconds apart, identified as a Bible Guide terms
check) and Bible Guide's own live question bank.

## The four counts

| Bucket | Entries | Meaning |
|---|---:|---|
| 1. Nothing to ask | **61** | Public domain, an open licence, published terms that already allow what we do, or link-only use that needs no licence. The only work is on our side. |
| 2. Fix our attribution | **8** | We use it within its terms but credit or link to it badly. A site change, no email. |
| 3. Worth writing to | **3** | Restricted, and permission would let us do a named thing we cannot do today. |
| 4. Do not write | **8** | A settled no, the wrong person to ask, or an ask that could only produce a written refusal where silence costs us nothing. |

80 register entries. Small sources with exactly the same standing (for example 22 little ministry sites held
privately, or the 143 web domains cited in research trails) share one entry whose name lists every member; the
machine-readable copy is [register.json](register.json).

**Emails genuinely worth sending: 3.** Two are already drafted and approved in the owner's action list
(Grace to You, item A1; the Martyn Lloyd-Jones Trust, item A2, in [OWNER-ACTIONS.md](../../../../../../../ThinkTank/Plans/Decide/OWNER-ACTIONS.md)) and were not redrafted. One is new:
[Ligonier Ministries](drafts/ligonier.md).

**Sending rule.** The owner's Gmail sends roughly 500 messages a day, and bulk near-identical mail risks the account.
Any eventual sending goes out in small batches over days, never at once.

## How the buckets were decided

- **The site links; it almost never hosts.** The reference directory's 16,973 entries and the Preachers pages link out
  to the source. Recording a sermon's title, date and passage and linking to it needs no licence, so a source only
  reaches bucket 3 when its robots.txt or terms stop us *collecting* those facts, which is the real blocker for Grace to
  You, the Lloyd-Jones Trust and Ligonier.
- **What the site does host** (about 19,800 reading texts on /teachers/works) passes a gate that admits only public
  domain, CC0 and CC BY/BY-SA texts: Text Creation Partnership, Oracc, First1KGreek, the Patristic Text Archive,
  Open Greek and Latin. None needs an ask; one (Oracc) needs better credit.
- **Private copies** (Desiring God, Truth For Life, Criswell, BGEA and others) are kept for private study under each
  host's personal-use terms and are not the question here.
- **Bucket 2 versus the problems listed under bucket 1.** Bucket 2 holds sources whose own terms set a credit or link
  condition the site does not yet meet. Courtesy-level slips (a website named where an author should be, links to
  temporary server addresses) are listed under bucket 1, as the brief asked.

## 3 · Worth writing to — 3

| Source | What we cannot do today, and permission would allow | What its terms say | Recorded in |
|---|---|---|---|
| [Grace to You (John MacArthur)](https://www.gty.org/) | Specific gap: we cannot gather MacArthur's sermon titles, dates and passages, because robots.txt shuts out our crawler. Permission (or a feed) would let us list them with links. Draft already exists: OWNER-ACTIONS.md item A1, not redrafted here. | Copyright policy lets anyone use Library content free, unaltered and credited ("Copyright [year], Grace to You. All rights reserved. Used by permission." plus gty.org) and allows linking. robots.txt disallows every crawler except Googlebot, Bingbot and two social bots, so the sermon listings cannot be collected at all. | [content/library/reports/sermons-campaign/macarthur/progress/TERMS.md](../../../../content/library/reports/sermons-campaign/macarthur/progress/TERMS.md) (2026-10-08); robots.txt re-read 2026-11-27: still `User-agent: * / Disallow: /`; policy tabs still load only with JavaScript. |
| [Martyn Lloyd-Jones Trust](https://www.mljtrust.org/) | Specific gap: a passage index of Lloyd-Jones's sermons is exactly the 'collection or database' the terms forbid without a licence, and the terms invite licensing enquiries. Draft already exists: OWNER-ACTIONS.md item A2, not redrafted here. | Terms of Use: "Systematic retrieval of data or other content from this Site to prepare any collection, compilation, database, or directory is prohibited." robots.txt itself blocks only /accounts and /search. | [content/library/sources.json](../../../../content/library/sources.json) (2026-10-05); [content/library/reports/modern-preaching/REPORT.md](../../../../content/library/reports/modern-preaching/REPORT.md); terms and robots re-read 2026-11-27, wording unchanged. |
| [Ligonier Ministries (R. C. Sproul and other teachers)](https://learn.ligonier.org/) | Specific gap: the Terms forbid any automated access without written permission, so Sproul's sermon library can only be listed by hand (12 so far). Permission for a slow crawler, or an export, would let the site list every Sproul sermon by passage with links. Ligonier already encourages linking and publishes a permission form, so the ask has a real chance. | Copyright policy: share audio and video only by hyperlink to the page holding the media, with the credit "[Material] by [Teacher]. © Ligonier Ministries [year]. Used by permission of Ligonier Ministries. All rights reserved." Terms of Use, read today: users may not "use any robot, scraper, crawler, or other automated means to access the Ligonier Services for any purpose without our express written permission." robots.txt on learn.ligonier.org allows everything except /api and /auth. | [content/library/sources.json](../../../../content/library/sources.json) (2026-10-05); [content/library/reports/modern-preaching/ministry-inventory.json](../../../../content/library/reports/modern-preaching/ministry-inventory.json) (permission queue, not requested); terms, copyright policy and both robots.txt read 2026-11-27. |

Only these three. Ligonier is new: on 27 November 2026 its Terms of Use were read and forbid "any robot, scraper,
crawler, or other automated means to access the Ligonier Services for any purpose without our express written
permission". Its robots.txt allows everything, which is why the earlier review filed it as merely "manual only"; the
terms, not robots.txt, are the blocker. The new draft is [drafts/ligonier.md](drafts/ligonier.md) (about 180 words,
via Ligonier's Copyright Permissions Request Form; no permissions email address is published, so none is guessed).

**Considered for bucket 3 and turned down:**
- *Sinclair Ferguson (First Presbyterian Columbia / SermonAudio)* and *John Murray (Westminster Media)*, both in the
  earlier unsent permission queue: robots.txt on all three hosts, read today, allows a polite crawler, and no terms page
  forbids one. Listing their sermons needs nothing, so they are bucket 1.
- *Desiring God*, in the same queue: we already list 1,618 Piper sermons by passage within its published permissions.
  The only thing an ask could add is hosting full text, which the site does not plan.
- *Truth For Life, Wesley Center, CCEL*: their published terms already allow more than we do.

## 2 · Fix our attribution — 8

| Source | How we use it | What its terms ask | What is wrong and the fix |
|---|---|---|---|
| [Billy Graham Evangelistic Association](https://billygraham.org/) | 1,526 Graham sermon works catalogued link-only (job 90e68650); sermon links on the Preachers pages. | Legal Permissions: personal use only; reposting text, audio or video needs written permission; linking welcome "provided the link clearly indicates that it leads to a BGEA website, opens in a new window" and implies no endorsement. | The sermon links (src/pages/teachers/preachers/through/BookPanel.tsx, bible/Panels.tsx) open a new tab but say only "Read the sermon" and the title; nothing tells the reader the link goes to billygraham.org. Fix: name the host on the link (e.g. "on billygraham.org (BGEA)"), at least for BGEA; doing it for every host is simpler and helps readers. |
| [Ministry-To-Children.com (Tony Kummer)](https://ministry-to-children.com/) | 1,587 questions in the live question bank (two collections) and the Family Worship Handbook on the learning shelf. | CC BY-SA 4.0 site-wide: reuse is allowed with credit, a licence notice and share-alike on adaptations. | The live Questions page prints each collection's internal note word for word (src/pages/QuestionsPage.tsx line 109): "Required by CC BY-SA 4.0: credit Ministry-To-Children.com (Tony Kummer) and license any adaptation…". That is an instruction to us, not a credit, and there is no link to the licence. Fix: store a separate public credit, e.g. "Questions from Ministry-To-Children.com (Tony Kummer), CC BY-SA 4.0" with the licence linked. |
| [OpenTriviaQA (uberspot)](https://github.com/uberspot/OpenTriviaQA) | 200 questions in the live bank. | CC BY-SA 4.0. | Same Questions-page fault: shows "Required by CC BY-SA 4.0: credit uberspot/OpenTriviaQA and license any adaptation…" with no licence link. |
| [Open Trivia Database (opentdb.com)](https://opentdb.com/) | 3 questions in the live bank. | CC BY-SA 4.0. | Same Questions-page fault (instruction text instead of credit, no licence link). |
| [unfoldingWord Open Bible Stories translation questions](https://git.door43.org/unfoldingWord/en_tq) | 261 questions in the live bank (the stories themselves are on the learning shelf with their makers' credit). | CC BY-SA 4.0. | Questions page shows "Required by CC BY-SA 4.0: credit unfoldingWord (Open Bible Stories translation questions)." Instruction wording, no licence name as a credit, no licence link. |
| [Bible Quiz question bank (BRIANCHANDA/Bible-Quiz, © 2025 Eric Sakala)](https://github.com/BRIANCHANDA/Bible-Quiz) | 97 questions in the live bank. | MIT licence: free use on condition that the copyright notice and the permission notice are included. | The page shows "MIT requires the copyright notice and permission notice to be included: Copyright (c) 2025 Eric Sakala." It describes the condition instead of meeting it. Fix: publish the MIT notice itself (one short licences page linked from the collection is enough). |
| [Bible Trivia Game question bank (DanielKorsah03, © 2026 Daniel Korsah)](https://github.com/DanielKorsah03/Bible-Trivia-Game) | 77 questions in the live bank. | MIT licence, same condition. | Same as the Sakala entry: the condition is described, the notice is not included. |
| [Oracc (Open Richly Annotated Cuneiform Corpus) and its project editors](https://oracc.museum.upenn.edu/) | 7,709 ancient texts read on the site as /teachers/works pages (RINAP, SAAo, RIAo, Amarna and others); museum-page records; one Study reading source (Sennacherib 022, RINAP 3). | The per-record licence in the data reads "This data is released under the CC0 license"; [SOURCES.md](../../../../SOURCES.md) records Oracc as CC BY-SA 3.0 with credit to Oracc and the project editors. | On all 7,709 hosted pages the 'credit' is the licence sentence itself; neither Oracc nor the project nor its editors (e.g. Grayson and Novotny for RINAP 3) is named. Fix: settle the licence per project (CC0 where the data says so) and credit "Oracc, <project>, ed. <editors>" on each page; correct [SOURCES.md](../../../../SOURCES.md) to match. |

**One fix covers six of these.** The live Questions page ([QuestionsPage.tsx:109](../../../../src/pages/QuestionsPage.tsx#L109)) prints each
collection's `credit` field word for word, and that field holds notes written for us, not credits for readers:
"Required by CC BY-SA 4.0: credit …", "MIT requires the copyright notice … to be included", and for unlicensed sets
"No licence states terms. Credit … if permission is ever obtained." Confirmed on bibleguide.io on 27 November 2026.
Fix: give each collection a short public credit (who, licence name, licence link), publish the two MIT notices on a
licences page, and keep the internal notes out of the released bank.

**BGEA.** All 1,526 Graham sermon records already mark the BGEA linking condition as not met. The links open a new tab
but never say they lead to billygraham.org; naming the host on every outbound sermon link fixes BGEA and helps readers
everywhere.

**Oracc.** 7,709 hosted ancient texts credit nobody: the page's credit is the licence sentence itself. SOURCES.md also
records Oracc as CC BY-SA 3.0 while the data says CC0. Settle it per project and name Oracc, the project and its editors
on each page.

## 4 · Do not write — 8

| Source | Why not write | What its terms say | Credit problem |
|---|---|---|---|
| [Scripture Buzzer question set (AyandaNgubane/Bible-Quiz)](https://github.com/AyandaNgubane/Bible-Quiz) | A private individual's repository: there is no organisational contact, and the brief allows organisational contacts only. A request that is refused would turn an unlicensed-but-tolerated use into a known, written refusal. The honest alternative to asking is removing the 787 questions; that is the owner's risk call, already made on 2026-10-17, and it is flagged here, not reopened. | No licence at all, so by default all rights stay with the author. Published under the owner's rule of 2026-10-17 that unlicensed public content may be used, credited, on this non-commercial site. | Its live credit reads "No licence states terms. Credit AyandaNgubane/Bible-Quiz if permission is ever obtained." That tells readers we have no permission. Whatever the owner decides, replace it with a plain credit ("Questions from AyandaNgubane/Bible-Quiz on GitHub") or remove the collection. |
| [Bible trivia dataset (liaaron1 on Hugging Face)](https://huggingface.co/datasets/liaaron1/bibile_trivia_alpaca) | The uploader cannot grant rights they may not hold, so nothing they wrote back would settle anything. Individual account, no organisational contact. | Tagged Apache-2.0, but 244 records copy Ministry-To-Children's CC BY-SA questions, which the uploader cannot relicense; the rest have no known origin. | Live credit reads "Unsettled. If used at all, credit Ministry-To-Children.com…; the provenance of the rest is unknown." Replace with a plain credit naming the dataset and Ministry-To-Children for the overlapping questions. |
| [Open-trivia-database (el-cms)](https://github.com/el-cms/Open-trivia-database) | Its one stated wish is already met; an individual's repository; asking can only produce a restriction. | No licence; the README only asks to be cited and linked, which the site does. | Live credit is our internal note ("That is its own stated wish, not a licence condition…"). Replace with "Questions from el-cms/Open-trivia-database on GitHub" and the link. |
| [Westminster catechisms with proof texts (Sundar1205/westminster-catechism)](https://github.com/Sundar1205/westminster-catechism) | One public-domain question; nothing to gain, individual account. | The 1647 text is public domain; only the compilation is unlicensed. | Live credit is a long internal note about the repository's sources. A plain "Westminster Shorter Catechism (1647)" credit is enough. |
| [Quran.com and The Clear Quran (Dr Mustafa Khattab)](https://quran.com/) | Short attributed quotation for comparison and criticism is the classic fair-use case and needs no permission. Asking Quran.com would ask the wrong rights-holder, and a refusal for Christian apologetics use would bind us where silence does not. If the owner wants zero risk, switch the quotations to a public-domain translation (Rodwell 1861, Palmer 1880, or Pickthall 1930, US public domain since 1 January 2026) instead of asking. | Quran.com Terms, read today: no copying, reproducing or publicly displaying content without prior written consent except personal non-commercial use; no data mining, scraping or crawling. The translation's own copyright is the translator's, not Quran.com's. | — |
| [W. A. Criswell Sermon Library (W. A. Criswell Foundation)](https://wacriswell.com/) | Linking and listing need nothing, and nothing published restricts us. The only further step would be hosting transcripts, which is not planned; asking can only add a written restriction that does not exist today. | No terms, copyright notice or licence anywhere on the site; robots.txt allows everything but /wp-admin/ with a 10-second crawl delay. Transcripts are treated as all rights reserved. | — |
| [Israel Antiquities Authority (Leon Levy Dead Sea Scrolls Library) and the Israel Museum](https://www.deadseascrolls.org.il/) | Image use there is a paid, contracted licence, not a goodwill permission, so an email starts a fee negotiation that would need the cost gate. The study already shows a public-domain photograph of the Great Isaiah Scroll and links to the IAA viewer, so there is no gap to fill. | The IAA reserves all rights and answers a Cloudflare challenge; the Israel Museum has no open API. Their photographs are licensed commercially. | — |
| [Europeana items with non-open rights statements (8 records)](https://www.europeana.eu/) | The statements are set by many separate data providers and are settled; the museum pages are complete without them. | Six CC BY-NC-ND, one CC BY-NC-SA 4.0, one 'No Copyright – Other Known Legal Restrictions'. | — |

**A flag on the four unlicensed question sets.** Up to about 1,600 live questions (Scripture Buzzer 787; the liaaron1
dataset's 802, less those copied from Ministry-To-Children, which carry that site's licence; el-cms 10; one Westminster question) are published under the owner's
rule of 17 October 2026 that unlicensed public content may be used, credited, on this non-commercial site. Writing to
private individuals is outside this brief, and a refusal would be worse than silence. The honest alternative to asking
is removing them; that is the owner's call and is not reopened here. Whatever is decided, their live credit lines must
stop announcing that we have no permission.

## 1 · Nothing to ask — 61

| Source | How the site uses it | What we hold | What its licence or terms already permit | Recorded in |
|---|---|---|---|---|
| [Berean Standard Bible and Majority Standard Bible](https://berean.bible/) | The site's Bible text everywhere, verse cards, the app. | USFM and plain text via eBible.org. | Dedicated to the public domain (2023). | [SOURCES.md](../../../../SOURCES.md); [NOTICE.md](../../../../NOTICE.md) |
| [eBible.org Bible texts (KJV, WEB, ASV, YLT and the other public-domain versions)](https://ebible.org/) | Reader versions and the app's six texts. | Version folders under sources/ebible. | Each version's copr.htm marks it public domain (KJV under Crown patent in the UK only). | [SOURCES.md](../../../../SOURCES.md); [NOTICE.md](../../../../NOTICE.md) |
| [Indian Revised Version (Hindi), Bridge Connectivity Solutions](https://ebible.org/) | One reader version. | Via eBible.org. | CC BY-SA 4.0. | [NOTICE.md](../../../../NOTICE.md) |
| [OpenBible.info cross-references and geocoding](https://www.openbible.info/) | Reader cross-references, Connections page, atlas places. | Dataset files. | CC BY (cross-references), CC BY 4.0 (geocoding). | [NOTICE.md](../../../../NOTICE.md); site-source-sweep.json |
| [STEP Bible data (Tyndale House, Cambridge)](https://www.stepbible.org/) | People data, tagged Hebrew and Greek, lexicons, baby names. | STEPBible-Data files. | CC BY 4.0. | [NOTICE.md](../../../../NOTICE.md); [SOURCES.md](../../../../SOURCES.md) |
| [Open Scriptures Strong's Hebrew dictionary](https://github.com/openscriptures/strongs) | Name meanings, Hebrew spellings. | HebrewStrong.xml. | Text public domain; this edition CC BY 4.0. | [SOURCES.md](../../../../SOURCES.md) |
| [Strong's Greek dictionary (Ulrik Petersen's XML)](https://github.com/morphgnt/strongs-dictionary-xml) | Greek name forms. | strongsgreek.xml. | Public domain. | [SOURCES.md](../../../../SOURCES.md) |
| [BibleData (Brady Stephenson)](https://github.com/BradyStephenson/bible-data) | 237 people-and-places questions. | Dataset. | CC BY 4.0. | [data/questions/bank.json](../../../../data/questions/bank.json) credit |
| [BibleQA (helen-jiahe-zhao)](https://github.com/helen-jiahe-zhao/BibleQA) | Facts behind 37 reworded questions. | Dataset. | Facts only, reworded; facts are not copyrightable. | [data/questions/bank.json](../../../../data/questions/bank.json) credit |
| [HelloAO Free Use Bible API](https://bible.helloao.org/) | Private reference copies of commentaries. | 753 JSON files. | Free Use API: unrestricted use including commercial, with renamed changed translations. | [SOURCES.md](../../../../SOURCES.md) |
| [CrossWire SWORD modules](https://www.crosswire.org/) | Private reference copies. | 102 module packages. | Each module's own DistributionLicense; the held ones are public domain. | [SOURCES.md](../../../../SOURCES.md) |
| [Creeds.json (NonlinearFruit)](https://github.com/NonlinearFruit/Creeds.json) | 35 creeds and catechisms on the Catechisms & Creeds pages; catechism questions in the bank. | Pinned JSON files. | The Unlicense for every retained file; the repository's listed exceptions (e.g. Savoy) were left out. | [SOURCES.md](../../../../SOURCES.md); [content/library/sources.json](../../../../content/library/sources.json) |
| [Second London Baptist Confession (lwalen/lbcf)](https://github.com/lwalen/lbcf) | Confession text. | 4 files at a pinned commit. | CC0. | [content/library/sources.json](../../../../content/library/sources.json) |
| [SVRBC Baptist Catechism / Symbolics](https://baptistcatechism.org/) | 1 hosted reading text. | 4 files. | Recorded as CC0 with third-party parts noted; robots.txt (read today) disallows nothing relevant. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| [Text Creation Partnership (EEBO, ECCO, Evans)](https://textcreationpartnership.org/) | About 10,200 early English books read on the site. | 20,353 files. | CC0 for the keyboarded texts (not the scan images). | [SOURCES.md](../../../../SOURCES.md); [content/library/sources.json](../../../../content/library/sources.json) |
| [First1KGreek (Open Greek and Latin)](https://github.com/OpenGreekAndLatin/First1KGreek) | 1,203 Greek texts read on the site. | Pinned XML. | CC BY-SA 4.0. | hosted records |
| [Patristic Text Archive (incl. 27 SBL Greek New Testament books)](https://github.com/PatristicTextArchive/pta_data) | 440 texts read on the site. | Pinned XML. | CC BY-SA 4.0 or CC BY 4.0 per text; SBLGNT CC BY 4.0. | hosted records |
| [Open Greek and Latin CSEL and the catenae texts](https://github.com/OpenGreekAndLatin/csel-dev) | 288 Latin and Greek texts read on the site. | Pinned XML. | CC BY-SA 4.0. | hosted records |
| [Cuneiform Digital Library Initiative](https://cdli.earth/) | Museum-page records. | Bulk catalogue dump (155 MB). | CC BY-SA 4.0; their pages were not crawled (60-second crawl delay). | [SOURCES.md](../../../../SOURCES.md) |
| [Theographic Bible Metadata](https://github.com/robertrouse/theographic-bible-metadata) | Not imported; held back by the owner's knowledge-graph gate. | Dataset. | CC BY-SA 4.0. | Plans/KNOWLEDGE-GRAPH.md; [SOURCES.md](../../../../SOURCES.md) |
| [Hymnary.org (Calvin Institute of Christian Worship and The Hymn Society)](https://hymnary.org/) | "Where hymnals place it" on 24 hymn pages, linking back. | 216 API responses, metadata only. | Factual metadata from the public API, no lyrics; robots.txt (read today) sets a 5-second delay and disallows /bible/ and full-text paths, none of which were used. Their copyright page refused our checker (HTTP 403). | [SOURCES.md](../../../../SOURCES.md) Hymns (2026-10-17); robots.txt read 2026-11-27 |
| [Unicode emoji data and the ENABLE word list](https://unicode.org/) | Emoji stories and Bible Wordle. | emoji-test.txt; enable1.txt. | Unicode License v3; ENABLE public domain. | [SOURCES.md](../../../../SOURCES.md) |
| [New Advent (Church Fathers, Summa)](https://www.newadvent.org/) | 57 directory links; short quotations of public-domain translations (Aquinas 1920, Fathers 1880s–90s). | Nothing hosted. | The translations quoted are public domain; robots.txt (read today) disallows only /cgi-bin/ and /tmp/. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| [Christian Classics Ethereal Library](https://www.ccel.org/) | 634 directory links; Easton's dictionary and patristic translations quoted from public-domain texts. | 526+ files (two storage namespaces), private reading only. | "These books may be used for personal, educational, or non-profit purposes. Contact us for permission to republish CCEL works." CCEL editions are never hosted: the hosting gate admits only public-domain/CC0/CC BY texts and excludes 'electronic edition' terms. | [content/library/reports/sermons-campaign/maclaren/TERMS.md](../../../../content/library/reports/sermons-campaign/maclaren/TERMS.md) (2026-10-08); [SOURCES.md](../../../../SOURCES.md) |
| [Project Gutenberg](https://www.gutenberg.org/) | 403 directory links; hymns, catechisms, question books and workbooks from its public-domain ebooks. | 73 files. | US public domain; no crawling of the main site (offline catalogue and mirrors only); link to landing pages; the trademark may not be used once the boilerplate is stripped. | [content/library/reports/sermons-campaign/moody/TERMS.md](../../../../content/library/reports/sermons-campaign/moody/TERMS.md) (2026-10-08) |
| [Internet Archive (incl. David Rumsey and library scans)](https://archive.org/) | 711 directory links; old-map counts; the LibriVox ASV recording streamed from archive.org. | 10,775 files, private reading only. | Noncommercial, non-infringing scholarly use; public-domain items assessed edition by edition. | [content/library/reports/sermons-campaign/morgan/TERMS.md](../../../../content/library/reports/sermons-campaign/morgan/TERMS.md) (2026-10-08) |
| [LibriVox ASV recording (Ron Altman)](https://librivox.org/) | Listen page and the app; streamed from archive.org. | Verse timings only. | Public domain. | [SOURCES.md](../../../../SOURCES.md) |
| [Wikisource, Wikidata and Wikimedia Commons](https://commons.wikimedia.org/) | Museum photographs with per-file credit; the Great Isaiah Scroll photograph; 4 directory links. | Per-file records. | Per-file licences (CC0, PD, CC BY, CC BY-SA, GFDL); Wikidata CC0. | [SOURCES.md](../../../../SOURCES.md) |
| [Museum open-access collections (Met, Cleveland, Art Institute of Chicago, Smithsonian, open Europeana items)](https://www.metmuseum.org/) | Museum archaeology pages. | Records and 79 resized images. | CC0 metadata and images where flagged public domain. | [SOURCES.md](../../../../SOURCES.md) |
| [British Museum](https://www.britishmuseum.org/) | 11 citation links. | Nothing requested from the site. | Object photography CC BY-NC-SA; robots.txt reserves AI collection. | [SOURCES.md](../../../../SOURCES.md) |
| [Map data: NASA GIBS, OpenStreetMap via Protomaps, Natural Earth, US Census TIGER, Library of Congress maps](https://www.openstreetmap.org/copyright) | Atlas imagery, street map, coastlines, city outlines, one old-map preview. | Tiles and extracts. | Public domain, except OpenStreetMap (ODbL, attribution required). | [NOTICE.md](../../../../NOTICE.md); [SOURCES.md](../../../../SOURCES.md) |
| Software, AI models and fonts (Qwen, Granite, LanceDB, ONNX Runtime, Transformers.js, Literata, Archivo, Noto, npm libraries) | Search, audio timings, the app, type. | Packages. | Apache 2.0, MIT, ISC, BSD, SIL OFL. | [NOTICE.md](../../../../NOTICE.md); [SOURCES.md](../../../../SOURCES.md) app section |
| [Streetlights videos (YouTube)](https://www.youtube.com/) | Embedded in YouTube's privacy-enhanced player; ids only stored. | Video ids. | YouTube's embed terms; the videos remain Streetlights'. | [SOURCES.md](../../../../SOURCES.md) |
| [unfoldingWord Open Bible Stories and Sweet Publishing illustrations](https://www.openbiblestories.org/) | Learning shelf. | 2 files (492 MB). | CC BY-SA 4.0 text; CC BY-SA 3.0 art. | [SOURCES.md](../../../../SOURCES.md) |
| [Bible for Children (Edward Hughes and illustrators)](https://bibleforchildren.org/) | Story booklets and colouring books on the learning shelf. | 126 files. | "You have the right to copy or print this story, as long as you do not sell it." Keep the credits page. | [SOURCES.md](../../../../SOURCES.md) |
| [Chapel Library](https://www.chapellibrary.org/) | Courses and booklets on the learning shelf; catalogue links. | 1,683 files. | Notice in each PDF: "Permission is expressly granted to reproduce this material by any means" if not charged for beyond duplication cost and the notice is kept. | [SOURCES.md](../../../../SOURCES.md); [content/library/sources.json](../../../../content/library/sources.json) |
| [Dr Bob Utley, You Can Understand the Bible](https://www.freebiblecommentary.org/) | 13 commentary volumes on the learning shelf. | 13 files. | Each volume: copies must be free of charge and credit Dr Bob Utley with a reference to www.freebiblecommentary.org. | [SOURCES.md](../../../../SOURCES.md) |
| [The Navigators Bible reading plans](https://www.navigators.org/) | 3 reading-plan PDFs on the learning shelf. | 3 files. | "Permission is granted to reprint unlimited copies … for non-commercial use. All copyright information must be retained." | [SOURCES.md](../../../../SOURCES.md) |
| [Bible Mapper, Jr. (David P. Barrett)](https://biblemapper.com/jr/) | Children's maps on the learning shelf. | 11 files. | Any non-commercial use, citing biblemapper.com with a hyperlink back. | [SOURCES.md](../../../../SOURCES.md) |
| [Know the Truth: 60 Questions on Christian Beliefs (Baptist Studies Online)](https://baptiststudiesonline.com/) | 59 questions in the bank. | 1 PDF. | "You may make copies and distribute freely" with a set credit line. | [SOURCES.md](../../../../SOURCES.md) |
| Public-domain catechisms and question books (ASSU 1907, Boston 1880, Manly 1864, Hurlbut 1903, Boyce 1885, Mezger 1923, Stump 1910, Sverdrup 1900, Mason 1692, and others) | About 4,000 questions in the bank. | Transcriptions. | Public domain. | [content/questions/sources/MANIFEST.md](../../../../content/questions/sources/MANIFEST.md) |
| [Desiring God (John Piper)](https://www.desiringgod.org/) | 7,315 directory links; 1,618 Piper sermons on passages. | 14,785 files, private reading only. | Permissions page: qualified original embeds and limited quotation allowed; full text and media redistribution need permission. robots.txt (read today) disallows only search, audio/video stream paths and RSS; no terms-of-use page exists at /terms or /terms-of-use. | [content/library/sources.json](../../../../content/library/sources.json) (2026-10-05); robots.txt and permissions page read 2026-11-27 |
| [Truth For Life (Alistair Begg)](https://www.truthforlife.org/) | 1,482 directory links; 1,417 Begg sermons on passages. | 3,066 files, private reading only. | Anyone may duplicate and distribute Begg's sermons unaltered, free and credited ("Copyright [year] by Truth For Life. Used with Permission."); robots.txt allows the sermon pages. | [content/library/reports/sermons-campaign/begg/TERMS.md](../../../../content/library/reports/sermons-campaign/begg/TERMS.md) (2026-11-26) |
| [Spurgeon Gems (Chapel Library) and The Spurgeon Library (Midwestern Seminary)](https://www.spurgeongems.org/) | 3,654 directory links; 3,544 Spurgeon sermons on passages. | 7,757 files, private reading only. | Free, unchanged, attributed use; Spurgeon's own text is public domain. | [content/library/reports/spurgeon/source-access.json](../../../../content/library/reports/spurgeon/source-access.json); [content/library/sources.json](../../../../content/library/sources.json) |
| [Wesley Center Online (Northwest Nazarene University)](https://wesley.nnu.edu/) | 139 Wesley sermons linked. | 139 pages, private reading only. | "Text may be freely used for personal or scholarly purposes or mirrored on other web sites, provided this notice is left intact"; no commercial use. | [content/library/reports/sermons-campaign/wesley/TERMS.md](../../../../content/library/reports/sermons-campaign/wesley/TERMS.md) (2026-10-08) |
| [Monergism](https://www.monergism.com/) | 1,579 directory links. | 3,188 files, private reading only. | Free reading editions; index and link allowed; no external republication of its curated files. robots.txt (read today): Content-Signal search=yes, ai-train=no, use=reference. | [content/library/sources.json](../../../../content/library/sources.json); robots.txt read 2026-11-27 |
| [Love Worth Finding (Adrian Rogers)](https://www.lwf.org/) | 614 directory links. | 1,220 files, private reading only. | Offered private reading copies; robots.txt (read today) allows all but CMS paths. | [content/library/reports/modern-texts/rogers-access.json](../../../../content/library/reports/modern-texts/rogers-access.json); robots.txt read 2026-11-27 |
| [The Gospel Coalition and Themelios](https://www.thegospelcoalition.org/) | 376 directory links; 2 study citations. | 755 files, private reading only. | No site-wide reuse licence; permissions page exists; robots.txt (read today) sets a 600-second crawl delay. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| [Bible Hub, International Standard Bible Encyclopedia site, Jewish Encyclopedia, Bible Study Tools, Biblia](https://biblehub.com/) | About 580 directory links to public-domain reference works. | 2 Gill entries; nothing else. | The works linked (ISBE 1915, Jewish Encyclopedia 1906, Gill) are public domain; robots.txt read today on Bible Hub, the ISBE site and Jewish Encyclopedia restricts nothing. | robots.txt read 2026-11-27; [content/library/sources.json](../../../../content/library/sources.json) |
| [Reasonable Faith (William Lane Craig)](https://www.reasonablefaith.org/) | 5 debate-transcript links in apologetics. | RF01 writings PDFs, private reading only. | No terms page found at the usual addresses; robots.txt (read today) disallows only shop and admin paths. | [SOURCES.md](../../../../SOURCES.md) RF01; robots.txt read 2026-11-27 |
| [Alpha and Omega Ministries (James White)](https://www.aomin.org/) | 7 debate and article links. | 4,097 files, private reading only. | No terms page found; robots.txt (read today): Allow /, Content-Signal search=yes, ai-train=no, use=reference. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| [Michael J. Kruger / Canon Fodder](https://michaeljkruger.com/) | Canon study links. | 675 files, private reading only. | No terms page; robots.txt (read today) disallows nothing. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| [First Presbyterian Church, Columbia and SermonAudio (Sinclair Ferguson)](https://www.firstprescolumbia.org/teaching) | Discovery links only; Ferguson is a separate campaign. | Nothing. | robots.txt read today: the church site allows general crawlers with a 2-second delay; SermonAudio allows general crawlers with a 5-second delay and blocks named AI crawlers. No terms page could be found on either (SermonAudio's pages are built by script). | [content/library/sources.json](../../../../content/library/sources.json) (2026-10-05); robots.txt read 2026-11-27 |
| [Westminster Theological Seminary Media (John Murray)](https://wm.wts.edu/) | Discovery link only. | Nothing. | robots.txt read today is empty (nothing disallowed); no terms page found. | [content/library/sources.json](../../../../content/library/sources.json) (2026-10-05); robots.txt read 2026-11-27 |
| Modern publishers and journals cited by bibliographic record (Crossway, Baker, IVP, Banner of Truth, Eerdmans, HarperCollins, Fortress, Bloomsbury, OUP, CUP, De Gruyter, Mohr Siebeck, SAGE, JSTOR, ETS, Tyndale Bulletin, Master's Seminary Journal, Bavinck Institute, OPC, 9Marks, Founders) | Cited and linked; in-copyright works (e.g. C. S. Lewis) are described in our own words, never quoted. | A few saved public pages and offered PDFs, private reading only. | Normal copyright; limited quotation only. | [SOURCES.md](../../../../SOURCES.md); [content/library/sources.json](../../../../content/library/sources.json); [content/library/reports/campaign-reconciliation/](../../../../content/library/reports/campaign-reconciliation/) |
| Small ministry and church sites held privately (Capitol Hill Baptist, William Carey Center, Covenant Baptist Theological Seminary, Bethlehem College and Seminary, Baptist History Homepage, Baptist Dogmatics, Free Christian Ebooks, James M. Hamilton Jr., London 1644, Frame–Poythress, C. S. Lewis Institute, The Calvinist, Phil Johnson's Bookmarks, The Reformed Reader, Reformed on the Web, SermonIndex, On the Wing, Hanover College, Early Christian Writings, LacusCurtius, PRDL, Reformed Books Online) | A handful of catalogue links; nothing hosted. | 1 to 180 files each, private reading only. | Mostly no published policy (checked 2026-10 by the campaign reconciliation; robots.txt re-read today for the ones never checked: none forbids access). Reformed on the Web is CC BY 3.0; SermonIndex and On the Wing allow free non-commercial use. | [content/library/reports/campaign-reconciliation/sources/official-consultations.json](../../../../content/library/reports/campaign-reconciliation/sources/official-consultations.json); robots.txt read 2026-11-27 |
| [Zwemer Center for Muslim Studies](https://www.zwemercenter.com/) | 24 directory links. | 3 historic PDFs. | Offered for reading/download; two editions assessed US public domain; one has a recorded download permission. | [SOURCES.md](../../../../SOURCES.md) |
| [Other-faith and worldview texts (dhammatalks.org, holy-bhagavad-gita.org, Humanists International)](https://www.dhammatalks.org/) | Linked primary texts in worldview studies, with short attributed quotation. | Nothing. | dhammatalks.org translations are CC BY-NC 4.0; holy-bhagavad-gita.org and Humanists International are normal copyright; robots.txt read today allows access on all three. | [SOURCES.md](../../../../SOURCES.md); robots.txt read 2026-11-27 |
| Church and confessional bodies' published texts (SBC Baptist Faith and Message 2000, Church of England, OPC Westminster Confession, the1689confession.com, Vatican, OCA, World Council of Churches, Lutheran World Federation, Mennonite World Conference, papalencyclicals.net) | Linked and briefly quoted as the bodies' own statements. | Nothing. | Published for reading and citation. | [public/content/reading-sources.json](../../../../public/content/reading-sources.json) |
| [Third-party transcript hosts (The Singju Post, justinholcomb.com, bethinking.org)](https://singjupost.com/) | 4 debate-transcript links in apologetics. | Nothing. | The Singju Post's terms and robots.txt (read today) permit ordinary access; the transcripts' rights belong to the debaters or event organisers, not the hosts. | [public/content/reading-sources.json](../../../../public/content/reading-sources.json); terms read 2026-11-27 |
| Scholarly works and institutions cited in the Study and Scholars pages (285 rows, 143 web domains: universities, museums, journals, manuscript projects) | Cited and linked in research trails and the Sources-in-use grid; short excerpts limited by the studies' own rules (e.g. 13 words). | Nothing beyond notes. | Normal copyright; citation and brief quotation. | [content/teachers/site-source-sweep.json](../../../../content/teachers/site-source-sweep.json); site-source-audit.json |

### Credited wrongly, inconsistently or not at all (bucket 1)

1. **34 credits in the Scholars "Sources in use" grid name a bare web address where an author or institution should
   be**; in most of them the work's own title names the author (Cline, Kuhrt, Garfinkel, Langlois, Biran and Naveh…).
   Full list:

   | Feature | Credited as | Work |
   |---|---|---|
   | manuscript-passages | uni-muenster.de | ECM Mark · unresolved readings (PDF) |
   | dead-sea-scrolls | commons.wikimedia.org | Great Isaiah Scroll · image and rights record |
   | canon | bible.usccb.org | Jude 14–15 and textual note |
   | canon | newadvent.org | Justin, First Apology 66–67 |
   | canon | bible-researcher.com | Muratorian fragment, lines 1–85 |
   | canon | newadvent.org | Eusebius, Church History 3.3; 3.25 |
   | canon | newadvent.org | Athanasius, Festal Letter 39.4–7 (367) |
   | canon | newadvent.org | Augustine, On Christian Doctrine 2.8.12–13 |
   | canon | newadvent.org | African Code, canon 24 (Carthage, 419) |
   | canon | sefaria.org | Babylonian Talmud, Bava Batra 14b |
   | canon | Torah.org | Torah.org · The 24 Books of the Hebrew Bible |
   | canon | tertullian.org | Jerome, Prologue to the books of Solomon |
   | canon | newadvent.org | Irenaeus, Against Heresies 3.11.7–9 |
   | printed-bible | mail.bible-researcher.com | The Translators to the Reader · 1611 preface, modernized transcription |
   | printed-bible | eliotcensus.org | The Wôpanâak Bible · A Census |
   | discoveries | ucl.ac.uk | Digital Egypt: Israel stela |
   | discoveries | ucl.ac.uk | Digital Egypt: mortuary temple of Merenptah |
   | discoveries | ucl.ac.uk | W. M. Flinders Petrie, Six Temples at Thebes (1897), with Spiegelberg’s inscription edition, pp. 26–28 |
   | discoveries | michaellanglois.org | Michael Langlois, The Kings, the City and the House of David on the Mesha Stele in Light of New Imaging Techniques, Semitica 61 (2019), 23–47 |
   | discoveries | thejewishmuseum.org | The Jewish Museum: Tel Dan Stele, exhibition 2024–2025 |
   | discoveries | berlinarchaeology.wordpress.com | Avraham Biran and Joseph Naveh, An Aramaic Stele Fragment from Tel Dan, Israel Exploration Journal 43 (1993), 81–98 |
   | discoveries | cris.huji.ac.il | Yosef Garfinkel, Jon W. Carroll, Michael Pytlik and Madeleine Mumcuoglu, Constructing the Assyrian Siege Ramp at Lachish: Texts, Iconography, Archaeology and Photogrammetry, Oxford Journal of Archaeology 40 (2021), 417–439 |
   | discoveries | faculty.uml.edu | Eric H. Cline, Sea Peoples and Israelites (2009) |
   | discoveries | oracc.museum.upenn.edu | A. Kirk Grayson & Jamie Novotny, RINAP 3/1 (2012), Sennacherib 22, Q003496 |
   | discoveries | whitelevy.fas.harvard.edu | David Ussishkin (ed.), The Renewed Archaeological Excavations at Lachish (1973–1994), five volumes (2004) |
   | discoveries | library.biblicalarchaeology.org | Lachish and Its Siege Ramps, accompanying David Ussishkin’s report of the 1983 season, BAR 10 (1984) |
   | discoveries | biblicalarchaeology.org | André Lemaire & Jean-Philippe Delorme, Defending the “House of David” (26 May 2023) |
   | discoveries | library.biblicalarchaeology.org | Deconstructing “David’s House”, sidebar to Matthieu Richelle & Andrew Burlingame, Set in Stone? Another Look at the Mesha Stele, BAR 49/1 (2023), p. 57 |
   | discoveries | isac-assets.s3.amazonaws.com | R. J. van der Spek, Cyrus the Great, Exiles, and Foreign Gods, in Extraction & Control, SAOC 68 (2014), 233–264 |
   | discoveries | journals.sagepub.com | Amélie Kuhrt, The Cyrus Cylinder and Achaemenid Imperial Policy, JSOT 25 (1983), 83–97 |
   | atlas-history | oca.org | An Orthodox account of church history |
   | atlas-history | lutheranworld.org | Lutheran–Catholic commemoration of the Reformation |
   | atlas-history | oikoumene.org | The Nature and Mission of the Church · Ecumenical study |
   | bible-texts | eBible.org | Scripture text distributions used by the reader |

2. **56 links on 28 reference-directory entries point at Internet Archive storage servers** (for example
   `dn760007.eu.archive.org/0/items/…`). Those hostnames are temporary and break; use
   `https://archive.org/details/<identifier>`.
3. **6 Project Gutenberg links** point at generated `cache/epub/…-images.html` files instead of the `/ebooks/<n>` landing
   page that Gutenberg's terms ask sites to link.
4. **Gutenberg named against its own wish.** Three question-book collections are credited "supplied by Project
   Gutenberg" in a line that also says Gutenberg asks not to be credited once its boilerplate is stripped. Drop the
   Gutenberg name there.
5. **Third-party transcript links.** Two Lennox debates link to The Singju Post and the Bahnsen–Stein debate to a PDF on
   justinholcomb.com. The credits honestly say "hosted by …"; where the organisers publish an official recording or
   transcript, link that instead.
6. **The Isaiah Scroll photograph** is credited in the Sources grid to "commons.wikimedia.org"; the Commons record names
   the photograph's maker (Ardon Bar Hama / Israel Museum).

No bucket-1 source was found used without any credit at all where its licence requires one: Hindi IRV, OpenBible.info,
STEP Bible, Open Scriptures, BibleData, First1KGreek, the Patristic Text Archive, CDLI, OpenStreetMap and the museum
photographs all carry their credits.

## Limits of this register

- Credits were checked from the code and data that render them, plus the live question bank; not every page was opened
  in a browser.
- Grace to You's policy tabs still load only with JavaScript, so their wording rests on the copy saved on
  8 October 2026. SermonAudio's and Westminster's terms pages could not be found at all; their rows rest on robots.txt.
- Hymnary.org's copyright page refused the checker (HTTP 403); its row rests on the October record and robots.txt.
- Copies of every robots.txt and terms page read today are kept in the job's scratch folder, not in the repository.
