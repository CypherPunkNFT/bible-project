# Israel from the exodus to Solomon: the page

**Address:** `/study/israel-from-the-exodus-to-solomon` (local preview: http://127.0.0.1:8931/study/israel-from-the-exodus-to-solomon) ·
**Research record:** [38-israel-from-the-exodus-to-solomon.json](../../../../content/academic-research/38-israel-from-the-exodus-to-solomon.json) ·
**Design note:** [design.md](../../../../content/academic-research/38-israel-from-the-exodus-to-solomon/design.md) ·
**Data build:** [build-exodus-to-solomon-study.py](../../../../scripts/build-exodus-to-solomon-study.py) ·
**Brief:** [ACADEMIC_PAGE_RUN.md](../../../../../Pages/Topics/StudyPlan/ACADEMIC_PAGE_RUN.md) (row 38) · Built 2026-11-07, not committed, not deployed.

## Its direction in one sentence

Cords and nails: Scripture's three spans (1 Kings 6:1, Exodus 12:40, Judges 11:26) hang as cords from Solomon's fourth year
above one line of years, the ground's dated ranges lie as bars in an earth band beneath it, and the two outside records
(Merneptah, Shoshenq) are driven through both as nails, so the reader sees how each exodus date is made and the page
chooses none. This is the design note's recommended direction of its three; the owner can still overturn it on sight.

## What is built

| Section | Headline | What it does |
|---|---|---|
| Opening | Israel from the exodus *to Solomon* | Trail, gold concept line "Span · Site · Nail · Range", title with its turn, a new drawing (a six-chambered gate in plan, a measuring cord across it, a potsherd at its threshold; "Illustrative forms · not a site plan") in the faint circle and dotted orbit, motto "Numbers in the text. / Ranges in the ground.", figures bar, outcomes, question, chapters, the site's stance said once. |
| 01 Cords and nails | Three numbers. *Two ways each.* | The track, 1900 to 850 BC. Reading buttons for the 480 years (count / twelve generations) and the 430 (Egypt alone / Egypt and Canaan). **Nothing is chosen on arrival**: every strand is drawn alike, so both exodus dates show at once. A chosen reading is solid, the other dashed and faint. The 430 hangs from each exodus date. Jephthah's 300 is drawn as a loose cord at the track's scale, not pinned to a year. Under it: a key, a "where each date falls" table (before / within / after, arithmetic only), a year ladder for phones, and the exodus-date and stay-in-Egypt debates with both views at equal weight, the Jewish reading first. |
| 02 Six stations | One passage. *One patch of ground.* | Six cards of one anatomy (02 / 06, miniature, serif title, headline, parts, action); the chosen station shows its lead, passages and records; each record opens in the sheet with evidence, inference and limit kept apart. |
| 03 Ai | Two hills. *One name.* | Et-Tell and Khirbet el-Maqatir side by side with who places Ai at each, a schematic two-pin sketch, and the Ai record's three parts. |
| 04 The gates | One plan. Three cities. *Which century?* | One illustrative six-chamber plan drawn alike for Hazor, Megiddo and Gezer, each with the conventional (970–930) and low (900–850) datings as two bars; the three views of the tenth century; links to the low, conventional and copper records. |
| 05 Invented? | Others' view. *And the answer.* | The invention view in its holders' terms, the evangelical answer, opponents outside that circle, the site's voice, what the ground can do. |
| 06 Claims | Four things often said. *One test each.* | Four claims, each with a self-test. |
| 07 Where it stops | A selection. *The text stays.* | Words to keep apart, reach, what is left to other studies, neighbours, reading trail, sources with what was read, the pictures note, the closing question and the way back to Academic studies. |

The view lives in the address: `span480` (count | measure), `span430` (egypt | canaan), `station`, `open` (`rec:<station>.<record>` or
`ref:<reference>`). An unknown value falls back to no choice (readings), the first station, or no sheet. One sheet at a time:
opening a check note closes the record sheet and the other way round. Escape closes either; focus returns to what opened it.

## How

- [model.ts](model.ts) imports the research record and [exodus-to-solomon-data.json](exodus-to-solomon-data.json); [geometry.ts](geometry.ts)
  is pure arithmetic for the track (positions, lanes, before/within/after, the phone ladder).
- Parts: [Landing.tsx](Landing.tsx), [Track.tsx](Track.tsx), [Stations.tsx](Stations.tsx), [Sites.tsx](Sites.tsx) (Ai, gates),
  [Discern.tsx](Discern.tsx) (invented, claims), [Closing.tsx](Closing.tsx), [Sheet.tsx](Sheet.tsx), [parts.tsx](parts.tsx), [open.ts](open.ts);
  page shell [ExodusSolomonPage.tsx](ExodusSolomonPage.tsx); styles [exodus-to-solomon.css](exodus-to-solomon.css) under the `xs-` prefix
  (unused by any other study when this was built); route [route.ts](route.ts), picked up by study-page-routes.ts.
- Check notes: the page is wrapped in the shared `CheckNotesProvider`; every research string goes through `Checked`/`Prose`;
  `plainText` for titles and labels; the build's `plain()` strips markers before any comparison. No marker or note was edited.
- The data holds verse ids (book, chapter, verse) and the Berean's footnotes, never a verse's words: the build reads and checks
  the words in memory, and the sheet shows them in the reader's current Bible (`VerseAt`, captioned with `BibleName`;
  src/lib/verses.ts). It keeps the Berean's **own footnotes**, labelled as the Berean's, so Exodus 12:40 shows "MT; SP in
  Canaan and Egypt; LXX in Egypt and Canaan" and 1 Kings 6:1 shows "Hebrew; LXX four hundred and fortieth".

## What the build script refuses

`python scripts/build-exodus-to-solomon-study.py` writes the data; `--check` rebuilds in memory and fails if the file is stale.
It refuses (exits non-zero, writes nothing) when a verse does not exist in `data/text/bsb`, a label does not match its
reference, a prose reference does not exist, a "(… · BSB)" quotation is not word for word, a verse the page uses is missing
from the record's list, a cord's number is not the number its own verse gives in the Berean, the shorter stay is not half of
430, a cord's end is not the year the record states in both its note and its debate view, a bar or nail runs backwards, leaves
the chart (1900 to 900 BC, run on at most 100 years) or disagrees with the record's own words for it ("about 1550 BC" must
fall inside the bar; "13th century" must hold it), a bar has neither words nor a stated exemption, a debate is not shown
unchosen with two views, the record holds an outside link, or a page link is not an address the site routes.

**Proved by wrong inputs, in memory** (scratch script `refusals_813a62c6.py` in the job folder): 19 of 19 refused, the control passed.
A verse that does not exist (Exodus 12:99); a label naming the wrong verse; a prose reference that does not exist (Judges 22:1);
a misquotation of Exodus 12:40 ("in Canaan"); a station verse missing from the list; 440 years for 1 Kings 6:1; about 220 for
the shorter stay; the count's end stated as 1450; the late date stated two ways (1250 and 1260); Jericho by Kenyon drawn
1500–1450 against "about 1550 BC"; Hazor drawn 1350–1250 against "13th century"; a backwards bar; a bar from 2000 BC; the
Merneptah nail at 1230–1220; a new bar with no words; a debate marked chosen; an outside link; an unrouted page link; a link
leaving the site.

## What the checks prove, and what they do not

They prove the references exist, the quotations and cord numbers match the site's Berean, the cords' arithmetic (966 + 480 = 1446; 215 × 2 = 430)
and that each bar sits where the record's own words put it. They do **not** prove any reading of the numbers, any scholar's
date, or any identification right: every source in the record is "located, not read", and the page says so.

## Checks run (2026-11-07)

- Build: wrote 51 verses under 42 references, 28 records in 6 stations, exodus cords at about 1446 and 1260 BC; `--check`: up to date.
- `npx vitest run src/pages/study/exodus-to-solomon`: 14 of 14 passed (data hash, Berean words, labels, cord arithmetic, bars and
  lanes, before/within/after, hostile address values, in-site links; render: every section, a reference's sheet with its
  footnote and Escape, a check note closing the record sheet and Escape, readings and station from the address, a station's record).
- `npx eslint --max-warnings 0 src/pages/study/exodus-to-solomon`: clean. `tsc -p tsconfig.app.json --noEmit`: no error in this folder.
- Preview rebuilt with `node scripts/build-portable.mjs --preserve-output` (three times); the page renders from `dist/`.
- Browser (headless Chromium against http://127.0.0.1:8931, no other server started) at 1440, 390 and 320 wide, light and dark:
  no console errors, no section failed, nothing inside the page past the right edge. A verse reference opens its sheet and
  Escape closes it; a highlighted passage opens its check note and Escape closes it; a reading button pressed by keyboard
  becomes pressed with no outline; under reduced motion the orbit's animation is `none`. At 320 wide the document is 349 px:
  the shared site header's menu button, identical on Egypt beside Israel, so it was left alone.
- Screenshots looked at: two label collisions (the ground band's title over Avaris; the two nails' labels) and an ink-coloured
  link style were fixed and checked again. Phones (under 640 px) show the year ladder instead of the drawing.

**Not tested:** a screen reader, Safari, Firefox, a real phone, 768 wide.

## Which page it could be confused with, and why it is not

- **Israel among the empires (07)**, checked on the preview before building: its graphic is a row of era tabs over a small
  proportional tick-line with two maps. Here there are no tabs and no map: cords hang from one peg over an earth band, and nails cross both.
- **New Testament history (43)**: lanes of reign bars crossed by a vertical anchor line. Here nothing is in lanes of rulers;
  the cords sag, carry knots and move as a reading is chosen.
- **Egypt beside Israel (32)**: threads between paired texts. **Cities through their layers (08)** owns the cut-through mound;
  this page draws no strata column.

## For the owner

1. **One open check can be closed from the Berean itself.** Check note c1 asks whether the Berean prints a footnote at Exodus
   12:40. It does: "MT; SP in Canaan and Egypt; LXX in Egypt and Canaan". The page shows it in the verse sheet. The note was not edited.
2. **The Berean's footnote at 1 Kings 6:1 says the Greek reads 440, not 480.** The research record does not mention it. The page
   shows the footnote in the sheet but draws no 440 cord.
3. **Neighbour names.** The research names three neighbours by older titles. "Archaeology and the Bible (06)" is the site's
   From discovery to history; "The Bible and the ancient Near East (32)" is Egypt beside Israel; "The peoples around Israel (35)"
   is Mesha and the world of Moab. The page links the site's pages and notes the research's names. Dating the biblical world (10),
   The patriarchs in their world (39) and a Scripture theology article have no page yet, so they are listed without links.
4. **Choices the page makes that the record does not:** the track runs on to 850 BC (the record says 900) so the gates' low dating
   is drawn whole. Jephthah's 300 years are drawn loose, at scale, not pinned, because the record gives no year for Jephthah. The
   12 knots are evenly spaced as a drawing convention. The figures bar counts 28 records, not "sites": the record has no site list.
   The lead line ("Scripture gives numbers. The ground gives ranges. A date for the exodus is a way of joining the two.") and the
   closing question are the page's wording, taken from the design note.
5. **Still open in the research:** 10 of 61 check notes are open and show as open. Every source is "located, not read", so the
   design note's condition (each scholar's view checked to the page before building) is not met; the page says so in 07. No picture
   is shown: none has a settled licence.

## The study standard, briefly

Shared rules 1–23 and A1–A9 are met as far as this build can reach, except: A4 (real objects with photographs) is ✗, since no
picture has a licence; rule 7 / A8 is ◐, since every source is located, not read, and the page says so; rule 11 is ◐ for the same
reason; rule 23's 768-wide check was not run.
