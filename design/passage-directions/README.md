# A passage through the manuscripts — three directions

Static mock-ups for the overhaul of the study page *A passage through the manuscripts*. Open
`/mockups/passage-directions/?d=a`, `?d=b`, `?d=c` or `?d=d` on the local preview (port 8931). The floating pill at the
bottom switches between them. Every fact, Greek extract, citation and caveat from the live page is kept. The page's
content comes from the live page's sourced content ([evidence.ts](../../src/pages/study/passages/evidence.ts)),
copied into [js/content.js](js/content.js).

| Direction | Idea |
|---|---|
| **A · The desk** | An object-like page. It opens on a codex leaf of Romans 5:1 under a lens, where the first hand's ω slowly gives way to the corrector's ο and back. Then come the layers of evidence as stacked planes, the comparison desk with threads from each witness to its reading, the broken edge beside the real P46 leaf, counting, the editions, and a cabinet of the six witnesses. |
| **B · Cinema** | A full-screen opening where three witnesses send threads into one variation unit. Then there is one chapter per passage, each with a giant numeral, a histogram of the open copies of that book, scenes that slide sideways, and a line-art landscape at its foot. Side dots with a pill keep your place. |
| **C · Through the witnesses** | Led by the open data. It opens on the torn edge of P46 at θελ[ημα], where the supplied letters come and go. You choose a passage, then see every open-catalogue copy of that book on a time lane, with the study's own witnesses ringed and their readings named. Then you read the comparison, test four kinds of evidence, and follow the editions on a lane of their own. |
| **D · Merger** | The owner's combination of the other three. It uses A's opening and B's prologue. Then come B's three chapters (numerals, histograms, sideways scenes, side dots), each ending in "How an editor reasons". Next is one section, *Not every gap is the same gap*, that merges A's broken edge with C's four kinds of evidence. It uses C's torn-edge drawing of P46 with the "Show supplied letters" switch above it, and A's real P46 leaf beside it. After that come A's editions (*An edition is an argument that can be revised*), A's cabinet of six witnesses, and *Follow the evidence further*. GA 304, the P45 question and the copying model appear once, as three of the four kinds of evidence, not as chapter scenes. |

## Files

- [index.html](index.html) — one page. The site frame and record-sheet styles are linked read-only from
  [../authors-directions/](../authors-directions/) and [../manuscripts-directions/](../manuscripts-directions/).
- [js/](js/) — [core.js](js/core.js), [sheet.js](js/sheet.js) and [art.js](js/art.js) are copied from the Manuscripts
  mock-up. The shared parts are [content.js](js/content.js), [parts-base.js](js/parts-base.js), [desk.js](js/desk.js),
  [close-readings.js](js/close-readings.js), [evidence-widgets.js](js/evidence-widgets.js) and [lane.js](js/lane.js).
  The directions are [dir-a.js](js/dir-a.js), [dir-b.js](js/dir-b.js), [dir-c.js](js/dir-c.js) and
  [dir-d.js](js/dir-d.js); D reuses the parts that A, B and C expose. [page.js](js/page.js) starts the page.
- [css/](css/) — [pm.css](css/pm.css) and [widgets.css](css/widgets.css) are shared; [a.css](css/a.css),
  [b.css](css/b.css) and [c.css](css/c.css) and [d.css](css/d.css) are one per direction.
- [build-data.py](build-data.py) → [data.js](data.js) (1,138 open records holding Galatians, Romans or Mark:
  298 Galatians, 306 Romans, 961 Mark; 1,110 of them dated) and [images.js](images.js) (16 open pictures embedded as
  data URIs, because the local /mockups/ route does not serve .jpg). Run it with `python -B build-data.py`.
- [shot-a.png](shot-a.png), [shot-b.png](shot-b.png), [shot-c.png](shot-c.png), [shot-d.png](shot-d.png) — catalog thumbnails.

## Data and credits

The records are filtered from the approved Manuscripts mock-up's open corpus: Wikidata (CC0) with Wikipedia
(CC BY-SA), ETCBC (CC BY-NC) and Syriaca.org (CC BY 3.0). The pictures are Wikimedia Commons files, credited in each
record sheet. The CSNTM data is never opened. The Greek extracts are selected, normalized typeset text, not
facsimiles. The P46 drawing is a typographic drawing after Michigan's diagnostic transcription, not a tracing.

## Data problems found

- Minuscule 481 is dated "2nd–10th century" and Uncial 0322 "5th–9th century" in the source. The oldest-copy figures
  ignore any date span over 200 years.
- The Papyrus 45 record names the Austrian National Library as its holder, but its shelfmark, BP I, is the Chester
  Beatty one.
- The only open P46 picture is folio 142r (2 Corinthians 11:33–12:9), not a Galatians leaf. Its caption says so.

## Mock-up versus the real thing

- These are static mock-ups (HTML, CSS and JavaScript), not React. The chosen direction gets rebuilt inside
  [src/pages/study/passages/](../../src/pages/study/passages/).
- The live page's licence line said it shows no pictures. It was reworded here, because the mock-ups now show open
  Commons pictures.
- Checked with Playwright in Edge at 1440 and 400 px, light and dark: no console errors, and nothing scrolls sideways
  at 400 px. Each direction's buttons, the record sheet, the lane, the side dots (B and D) and D's switch and four kinds were clicked through.
