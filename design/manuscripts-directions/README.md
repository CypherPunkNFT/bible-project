# Manuscripts: three directions for /study/manuscripts

Mock-ups for the new Manuscripts collection page. It sits in Study under "The Bible: formation & transmission", as the
main card of that branch. One page, three directions; the small switch at the bottom moves between them.

- A · The cabinet: http://127.0.0.1:8931/mockups/manuscripts-directions/?d=a
- B · Through time: http://127.0.0.1:8931/mockups/manuscripts-directions/?d=b
- C · By the book: http://127.0.0.1:8931/mockups/manuscripts-directions/?d=c

Built 2026-10-17. Static HTML, CSS and JS. The frame (header with Study active, footer, theme switch) is the Authors
mock-ups' [frame.js](../authors-directions/shared/frame.js) and [frame.css](../authors-directions/shared/frame.css). The
landing is the Hymns collection's intro: breadcrumb, big title with one italic accent, four quiet figures. Light and dark
both work. No control shows a focus ring.

## The three directions

Every direction ends with the same closing section. It links to the three manuscript studies, the apologetics question
"Has the Bible been changed beyond recognition?" and the scholars. Those links are words on a line, not boxes. Beside
them sit a plain note on coverage and the source credits, with the six records that were left out and why.

| | Idea | Sections | Approved sections it uses |
|---|---|---|---|
| **A · The cabinet** | The great witnesses as objects, then everything else by kind | 01 The cabinet: 31 great witnesses on three shelves (Hebrew, Greek, early translations), oldest first. 02 Every manuscript, by kind: crystals for each kind filter a searchable catalogue of 4,354 records. | Cabinet intro, the cabinet (object array), crystals by kind |
| **B · Through time** | Where the copies fall in time, and how close they come to the writing | A strip of dated copies per century under the intro. 01 One lane per tradition from 250 BC to AD 1500, one dot per dated copy; hovering names it on a line below, arrow keys step through the dots, and choosing a dot opens its record. 02 How close to the writing: for each New Testament book, when it was written and its oldest copy in the open data. | Through time (lanes, interactive, with the line below) |
| **C · By the book** | Which copies hold each book, and who keeps them now | 01 66 book tiles, darker where more records hold the book. Choosing one lists its copies, oldest first, under a chapter grid; choosing a chapter keeps only the copies that name it. 02 Where are they now: an SVG map of Europe and the Near East, an "Across the Atlantic" list, a panel for the chosen city, and two rows of holder cards. | Where is he named? (chapter grid), place cards + SVG atlas map, crystals-style filter chips |

Every manuscript opens the same record sheet, which slides in from the right. It shows the date and how that date was
reached, material, contents (with the catalogue's own words), where the manuscript is now with its shelfmark, the
picture with its credit, and the source record with its licence.

## Data: what is real and what is editorial

**Real, computed from the open data by [build-data.py](build-data.py):** every count, date, content, holder, image and
credit on the page.

- [wikidata.json](../../../Research/Manuscripts/normalized/manuscripts/wikidata.json) gives 3,400 records: Wikidata
  under CC0, with Wikipedia attributes under CC BY-SA.
- [etcbc-dss.json](../../../Research/Manuscripts/normalized/manuscripts/etcbc-dss.json) gives 954 Judaean Desert
  manuscripts under CC BY-NC.
- **csntm.json is never opened.** It is all rights reserved.

| | |
|---|---:|
| Records shown | 4,354 |
| Greek NT: papyri / majuscules / minuscules / lectionaries | 134 / 291 / 1,015 / 369 (1,809 in all) |
| Greek Old Testament (Rahlfs) records / with a date | 1,571 / 75 |
| Judaean Desert manuscripts / with a book of the Bible | 954 / 262 |
| Hebrew Bible, Latin, Syriac, Coptic, Gothic, Armenian, Ge'ez witnesses | 6, 5, 4, 2, 1, 1, 1 (Georgian: none) |
| Records with a date | 1,878 |
| Records whose books could be read | 1,690 (318 also name chapters) |
| Records naming a holder / placed on the map | 1,874 / 1,706 (60 holders in 53 cities) |
| Openly licensed pictures | 29 |

**Coverage is computed from the open data alone.** The page says 95% of papyri, 90% of majuscules and 31% of the Greek
New Testament overall. The corpus MANIFEST's figures (about 96% of papyri, 49% overall) count the CSNTM catalogue as
well, which may not be shown. So this page does not use those figures. The totals it compares against (about 141
papyri, 323 majuscules, 2,900 minuscules, 2,500 lectionaries, 5,800 in all) are the approximate Kurzgefasste Liste
totals given in the corpus MANIFEST.

**Editorial, and labelled as such on the page:**
- When each New Testament book was written: wide approximate ranges in [ms_tables.py](ms_tables.py) (`WRITTEN`). The
  page says they are approximate and that scholars differ.
- The city of each holder, with its coordinates (`HOLDERS` in [ms_tables.py](ms_tables.py)). These are standard facts
  matched to the catalogue's free-text holder names.
- The Dead Sea Scrolls band in B, 3rd century BC to 2nd century AD. The data gives no date per scroll, and the page
  says so.
- Two corrections, each marked where it appears. Codex Ephraemi is dated 5th century; the record's 13th-century date
  belongs to the later text written over it. Codex Vaticanus lacks 1–2 Timothy, Titus, Philemon and Revelation; the
  record says "whole New Testament".

## Data problems found, and how they are handled

1. **Wikidata stores a century as a round year**, for example 1000 for the 10th century and 1201 for the 13th. There
   are 353 such dates. They are read as the century they stand for.
2. **The 26 named non-Greek witnesses have empty traditions** in the normalised records. Examples are Aleppo,
   Leningrad, Argenteus and Rabbula. Their traditions come back from the corpus's own
   [wikidata-pinned.json](../../../Research/Manuscripts/tools/wikidata-pinned.json); 20 were restored.
3. **Papyri 138, 139 and 140 were filed as minuscules 138–140.** Their keys collide with the real minuscules. They are
   re-filed as papyri.
4. **227 dates were left unparsed** by the corpus ("6th-century", "4th / 5th-century"). 223 are read here. Four stay
   undated: three Wikidata "unknown value" placeholders and one "? century".
5. **The stated range for Codex Vaticanus was shifted** to 275–325. Its source says c. 300–350. Ranges are re-read from
   the source text wherever the text states one.
6. **Five witnesses have no date in their record.** Leningrad, Argenteus, Damascus Pentateuch, Sassoon and Nash get
   their dates from the pinned-identity notes in the corpus. Each is marked "from the note".
7. **Contents exist only as free text** (`contents.books` is empty for every Wikidata record). Books and chapters are
   read from the catalogue's own words by [ms_text.py](ms_text.py). 1,413 of 1,440 non-lectionary Greek NT records can
   be read. Five strings stay unread, including "Diatessaron" and "†". Lectionaries hold readings rather than books, so
   they are left off the book grid.
8. **Collections and non-biblical items pose as manuscripts.** Six are left out, each with its reason on the page:
   Chester Beatty Papyri, Bodmer Papyri, Nag Hammadi library, Codex Tchacos, the lost Severus Scroll, and an
   unconfirmed "Codex Ambrosianus". The Chester Beatty I and Bodmer VIII pictures are shown on the papyri they actually
   are, P45 and P72.
9. **The Dead Sea Scrolls file has more than manuscripts.** 42 photographic plates and CD (Cairo Geniza, not the
   Judaean Desert) are left out.
10. **Holder names are messy.** "British Library additional manuscripts", "Escurial" and "Escorial", and city names
    given in place of libraries. 168 records name a holder that cannot be placed; the record sheet still shows its
    text.
11. **Four of the Commons "author" fields are not names.** They hold a file title, a description, or "Unknown author
    Unknown author". These are shown as "Unknown author", and every picture links its Commons page.
12. Two pairs of sigla now share a display (278a/278b, 0121a/0121b). The suffix is kept, so they stay distinct.

## Pictures and licences

[assets/](assets/) holds 29 JPEGs at 560 px on the long side, quality 72. They are resized from
[Research/Manuscripts/images/](../../../Research/Manuscripts/images/). The credit for each (author, licence and Commons
page) comes from `raw/commons/_harvest.json` and appears under the picture in the record sheet. One picture is CC BY 4.0
(Codex Argenteus, Magnus Hjalmarsson). The rest are public domain.

The local preview's `/mockups/` route serves no `.jpg` (see `MOCKUP_TYPES` in `vite.config.ts`). So the same JPEGs are
also written into [assets/images.js](assets/images.js) as data URIs, and the page prefers those. Adding `".jpg"` to
`MOCKUP_TYPES` would let the page load the JPEGs directly and drop `images.js`, about 1.9 MB.

Credits on the page:
- Wikidata (CC0).
- English Wikipedia (CC BY-SA 4.0), linked per record.
- ETCBC Dead Sea Scrolls (CC BY-NC 4.0). Transcriptions by Martin G. Abegg, Jr., James E. Bowley and Edward M. Cook;
  Text-Fabric conversion by Jarod Jacobs, Martijn Naaijer and Dirk Roorda.
- Wikimedia Commons, per picture.
- Natural Earth land, via the `world-atlas` package already in `node_modules`, public domain.

## Rebuild

```
python -B build-data.py
```

The build reads the corpus in place, writes [data.js](data.js), [assets/](assets/) and [assets/images.js](assets/images.js),
and prints the data problems it met. It needs Pillow.

## Files

[index.html](index.html), [js/page.js](js/page.js) (directions and order) and one file per section: landing, cabinet,
kinds, lanes, closeness, books, places, onward. Shared pieces are [js/core.js](js/core.js), [js/sheet.js](js/sheet.js)
(the record sheet) and [js/art.js](js/art.js) (line drawings of the form). [js/outside-scroll.js](js/outside-scroll.js)
is copied from the Hymns mock-up. Styles are in [css/ms.css](css/ms.css) and [css/sections.css](css/sections.css).
[shot-a.png](shot-a.png), [shot-b.png](shot-b.png) and [shot-c.png](shot-c.png) are 1440 px light previews.

## 2026-10-18: scroll dates, Syriac records, three more lanes

The corpus gained five owner-approved open sources (registered in [SOURCES.md](../../SOURCES.md)), and `data.js` now has
5,269 records. 439 of the 954 Judaean Desert scrolls carry a date: the corpus keeps every dating claim (radiocarbon,
palaeography, an AI estimate, a Wikipedia script period) and picks one by a stated rule; the record sheet names its
source. The "no date per scroll" band on the Dead Sea Scrolls lane is gone, since the lane now has dots and its count
says how many are still undated. Three lanes and kinds were added, Samaritan, Arabic and Church Slavonic; 194 Syriac
records come from Syriaca.org.
