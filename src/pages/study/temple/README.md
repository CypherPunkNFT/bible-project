# The temple and Israel's worship — /study/the-temple-and-israels-worship

Academic study 44, built 2026-11-07 by the Academic page run ([ACADEMIC_PAGE_RUN.md](../../../../../Pages/Topics/StudyPlan/ACADEMIC_PAGE_RUN.md), row 44).
Words: the research record [44-the-temple-and-israels-worship.json](../../../../content/academic-research/44-the-temple-and-israels-worship.json).
Shape: its design note [design.md](../../../../content/academic-research/44-the-temple-and-israels-worship/design.md), direction 1 (four plans at one scale, laid over one another).

## Findings as they came (written during the build)

- The record holds 57 check notes: 37 confirmed, 14 corrected, 6 still open. The page shows every one as a highlighted passage.
- The record gives no verse phrases (its own `versesNote` says so); every verse the page shows is taken from the site's Berean by the build script.
- The record's sources carry outside addresses (Project Gutenberg, Sefaria, New Advent). The page names each source and what was read of it, but makes no outside link: the run's rule is that no link leaves the site.
- **For the owner (open check note c3):** the site's Berean prints 2 Chronicles 3:4 as "twenty cubits long and twenty cubits high", so the Berean follows the 20-cubit reading of the porch's height. The note is left as written (notes are never edited by hand).
- The record gives no measurements for ʿAin Dara, Tayinat, Arad or Moza. The design note asks for them "to the same scale"; the page draws each as its plan type (long house of three rooms in a line, or broad room) and says "type, not to scale" instead of guessing sizes.
- Neighbouring studies with a page today are linked (The farming year, The world of the New Testament, New Testament history, How the Old Testament books were written, Academic studies). The others (The return from exile, Between the Testaments, Israel from the exodus to Solomon, The text of the Bible, Archaeology and the Bible, and the theology studies) are named without a link until their pages exist.
- Build script first run: 204 Berean verses under 140 references written; the record has no "(… · BSB)" quotations, so 0 were checked; 8 plan shapes, 24 divisions. `--selftest` refused 16 of 16 wrong inputs and wrote nothing (the list is under "What the checks prove").
- Bare references such as "(26:22–23)" are read against the last Bible book named earlier in the same text, so they are checked and open their verses too. A reference to a book the site's Berean does not hold (1 Maccabees 4:52–59) stays plain words.
- The Day of Atonement's seven steps: Leviticus 16 as the record gives it names a place for four of them (inner room twice, the wilderness, Israel itself). The other three (washing, the bull, the lots) are drawn as "place not stated", not put in an invented court.
- The year strip places only what each feast's own `when` states (the 14th of the first month; the 1st, 10th and 15th of the seventh; the 25th of Kislev). Kislev is placed as the ninth month from the Berean at Zechariah 7:1 ("the ninth month, the month of Chislev"). The Omer and Shavuot are drawn as hatched ranges, because the record says the day was argued.
- Psalm 92:1 in the site's Berean carries no Sabbath title (the site's text for Psalm 92 begins "It is good to praise the LORD"), though the record says Psalm 92 "is headed for the Sabbath day". The Sabbath psalm still opens Psalm 92:1 in the sheet; the title itself cannot be shown from the site's Berean.
- First rebuild of the preview (`node scripts/build-portable.mjs --preserve-output`) failed in another study's folder (early-church: a stylesheet it imports was not written yet). Per the run's rule I did not touch it; I waited and retried.

## What is built

- [route.ts](route.ts): `/study/the-temple-and-israels-worship`, routed automatically by [study-page-routes.ts](../study-page-routes.ts).
- [TemplePage.tsx](TemplePage.tsx): the shell. It wraps the page in the shared check-notes provider, keeps the view in the address (`house`, `scale`, `find`, `feast`, `open`), and opens one sheet at a time: opening a record or a verse closes an open check note, and opening a check note closes the record sheet.
- [Landing.tsx](Landing.tsx): the study trail (Ancient cultures & daily life), the gold concept line "Tent · House · Courts · Feasts", the title with its turn "one holy room, four houses", a new drawing (four nested outlines round one small square room, a faint lampstand, the circle and dotted orbit, two sparkles) with the motto "Measured in cubits. / Kept in feasts.", the figures bar, the six outcomes, the question, the witness key and the chapter list.
- [Houses.tsx](Houses.tsx), 01 Four houses: the four plans laid over one another at one scale in cubits, centred on the inner room; the chosen house lit; a second scale that sets the Mishnah's 500-cubit square beside the tabernacle court and Solomon's house; a measurements table (cubits, metres as an estimate at about 45 cm, and who gives each number); the house's record in three parts; the site's stance; and the houses on a straight line of time, with the tabernacle "Not placed".
- [World.tsx](World.tsx), 02 Its world: the four parallel sites, each with its plan type in miniature (not to scale), witnesses, inference and its full record in the sheet; the tent-shrines; Wellhausen's view labelled as others' view, the answer, and the link to How the Old Testament books were written.
- [Platform.tsx](Platform.tsx), 03 Herod's platform: a schematic outline with the finds whose record names a side (western wall; Robinson's Arch and the trumpeting stone at the south-western corner; the eastern seam), the three without a place listed as such, the sanctuary written in as "somewhere up here, its place not known"; Josephus's two start years side by side.
- [Priests.tsx](Priests.tsx), 04 Priests: the 24 divisions in the Berean's order, Abijah's lit with Luke 1:5; four records from Chronicles to Luke, each tagged by its witnesses; the psalm of the day (only the Sabbath's tagged Scripture); the high priest.
- [DayYear.tsx](DayYear.tsx), 05 The day and the year: the day as a straight strip; private offerings and the day the offering ceased; the year as a straight strip of twelve equal months with the seven feasts, the chosen one in full (when, what Scripture commands, how the temple kept it, how it is kept today, the New Testament scene); Yom Kippur's seven steps, inward and out.
- [Fall.tsx](Fall.tsx), 06 AD 70: Josephus and Sulpicius Severus side by side, not chosen; the fire, the spoils in Rome, the city below; what Jesus foretold; the word of care (Baptist Faith and Message 2000, article III).
- [Closing.tsx](Closing.tsx), 07 Claims (four, each with a self-test) and 08 Where it stops (words to keep apart, reach, what belongs elsewhere, neighbours, the reading trail with what was read, pictures not shown, the closing question "Which witness told me this, and how near was it to the temple?", and the way back to Academic studies).
- [parts.tsx](parts.tsx), [Sheet.tsx](Sheet.tsx), [model.ts](model.ts), [open.ts](open.ts): shared pieces, the sliding sheet, the data and address rules.
- [temple.css](temple.css): every class under `tw-`; tone History orange; light and dark from the site's variables; no focus ring (the chosen control carries one border); reduced motion stops the orbit and sparkles.
- [temple-data.json](temple-data.json): written only by [build-temple-study.py](../../../../scripts/build-temple-study.py).

## How the page differs from its neighbours

- Home and household is a cutaway of one house; this page has no cutaway, and walks no house room by room.
- The farming year is a wheel; this page has no ring anywhere: the year is a straight strip, and so is the day.
- Egypt beside Israel uses rulers and staves; New Testament history a lattice of reigns. This page's central picture is plans to one scale.
- The page most likely to be confused with it is The world of the New Testament (pilgrims, the synagogue, Jerusalem in Jesus' day). This page does not walk the pilgrims' roads or the synagogue; it keeps to the buildings, the priests and the calendar, and links there.

## What the checks prove (run 2026-11-07, after the last change)

| Check | Command (from the Website folder) | Result |
|---|---|---|
| Build script | `python scripts/build-temple-study.py` | exit 0; 204 Berean verses under 140 references, 8 plan shapes, 24 divisions written |
| Data is current | `python scripts/build-temple-study.py --check` | exit 0, "up to date" |
| Wrong inputs refused | `python scripts/build-temple-study.py --selftest` | exit 0; the real record builds, 16 of 16 wrong inputs refused, nothing written |
| Tests | `npx vitest run src/pages/study/temple` | 17 of 17 pass |
| Lint | `npx eslint --max-warnings 0 src/pages/study/temple` | exit 0, no warnings |
| Types | `npx tsc -p tsconfig.app.json --noEmit` | no error in this folder |
| Preview | `node scripts/build-portable.mjs --preserve-output` | exit 0; http://127.0.0.1:8931/study/the-temple-and-israels-worship answers 200 from dist |

What the self-test refuses (all 16, as the script prints them): a quotation one word off the Berean; a verse that does not exist; a chapter that does not exist; a listed verse with the wrong book code; a bare reference past the end of its chapter; Solomon's house drawn 70 cubits long; the inner room said to be 25 cubits in the Berean; the court's numbers not in the record's words; two priestly divisions swapped; a feast placed on a day its record does not state; Titus's two accounts merged into one; a link that leaves the site; a protocol-relative link; a link to a route the site does not have; a link to a study the record never names; a timeline bar that runs backwards.

What the tests prove: the route is `/study/the-temple-and-israels-worship`; the data was built from the record as it stands (its hash); every verse shown is the Berean's own words; every verse label the page uses is supplied; the plans draw Scripture's numbers (Solomon's house 60 × 20, inner room 20 × 20, the court 100 × 50, the tent's place marked inferred, the 500-cubit square marked as the Mishnah's); the 24 divisions with Abijah eighth; only stated feast days placed, the Omer and Shavuot marked argued; the two accounts of AD 70 kept apart, Josephus first; no year zero; unknown or hostile address values (`__proto__`, `constructor`, `<script>`, an unknown verse) fall back without throwing; no outside link; every section draws without failing; a reference opens its Berean words in the sheet and Escape closes it; a bare "(26:22–23)" opens Exodus 26:22–23; a check note closes the record sheet and Escape closes the note; the chosen house, feast and scale come from the address.

Browser, on the built preview (headless Brave):
- 1440 wide, dark: every section drawn, no console error, no failed section.
- 390 wide, light and dark: the page is exactly 390 wide (no sideways scroll); a reference opens its sheet and Escape closes it; a check note opens and Escape closes it; no console error.
- 320 wide, light and dark: the same, except the page measures 349 wide. The extra width is the site's own menu button in the shared top bar, not this page: it measures 349 with this page's content hidden, and the New Testament history page measures 349 too. Shared components are outside this run's folder, so it is left for the owner.
- A phone-width fault found and fixed: the psalm-of-the-day labels would not wrap and pushed the page to 429 wide at 390; they now wrap inside their cells.
