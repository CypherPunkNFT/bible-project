# Money, possessions and generosity: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 30 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site, no card in the gallery yet (the run's last step adds it)
Open: http://127.0.0.1:8931/mockups/money-possessions-and-generosity-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/money-possessions-and-generosity/content.md) · Design: [design.md](../../content/studies/christian-life/money-possessions-and-generosity/design.md) · Limits and sources: [passage-notes.md](../../content/studies/christian-life/money-possessions-and-generosity/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 63, a Scripture & Theology study in Living the Christian Life. Its one habit: **before you claim a promise about money, read the address on it**: who first heard it, under which of God's promises, what it was for, and what it does not promise. The study has no working.md; the page was made from content.md and passage-notes.md.

The page draws that habit as an address. Every passage carries a postmark (a ring with the book and verse, the section of the Bible named around it in that section's colour) and address lines written on fine dotted rules, as an address is written on an envelope. In part 00, five lines often lifted out of their setting (Deuteronomy 8:18, Malachi 3:10, Proverbs 3:10, Luke 16:9, Mark 12:44) are shown first as they are often heard; one switch puts every address back on. Then seven parts each open with their own address and one figure made from their own passage. Part 01 shows the order of Deuteronomy 8:12–14: four gifts rising, then "then" and the proud heart. Part 02 counts every word in David's prayer that speaks to God against every word for the givers. Part 03 shows where the tenth went, year by year, and the four guests at the gate. Part 05 shows the two rewritten bills, and part 06 the crossing of Luke 16:25 and the gate that runs back to Deuteronomy 14:29. Part 07 shows what each gift left behind. After that come four questions readers bring (tithing, wealth, poverty and debt, riches), and a close that draws the habit as a loop of five steps, with 1 Chronicles 29:10–19 printed in full. The full design is in [design.md](../../content/studies/christian-life/money-possessions-and-generosity/design.md).

## How it is built

[build-data.py](build-data.py) takes the study's content.md and [study_lists.py](study_lists.py), checks them against the site's Berean text and the Baptist Faith and Message held on this PC, and writes [data.js](data.js). It uses [scripture_text.py](scripture_text.py), a byte-for-byte copy of The good news mock-up's reader; [held.py](held.py), a copy of the Grief and dying mock-up's reader for held confessions; and [figures.py](figures.py), which builds and proves each figure. Run it from the Website folder: `python -B design/money-possessions-and-generosity-directions/build-data.py`. Add `--check` to run every check and fail if data.js is stale, or `--selftest` to try the wrong inputs below ([build_selftest.py](build_selftest.py)). data.js is written to a temporary file first and moved into place, so a failed build never leaves half a file. It carries a fingerprint of content.md and of every .py file here, which is how `--check` knows when it is stale. The build follows the Grief and dying build's lineage, adapted to this study's text (its "Frame:" and "Limit:" lines, its bulleted address in part 04, its two readings in the tithe question, and questions named by id).

The page is [index.html](index.html), [js/mp.js](js/mp.js) (the page, its questions and the verse sheet), [js/figures.js](js/figures.js) (the postmarks, the address lines and the figures), [js/art.js](js/art.js) (the drawings) and [css/mp.css](css/mp.css). Like the earlier mock-ups, it borrows the frame from the Authors and Manuscripts mock-ups. Nothing under `src/` or `dist/` was touched, and neither were catalog.json, progress.json, MASTER-LIST.md or STUDIES.md.

One direction was built, because the text already existed.

## What the checks prove, and what they do not

- **By script on every build:**
  - Every non-blank line of content.md is placed on the page.
  - Every block quotation is word for word the Berean at its reference. Two print only the spoken words, without the verse's opening frame: Luke 16:29 ("But Abraham replied,") and Mark 12:43–44 ("Jesus called His disciples to Him and said,"). The build proves each frame is exactly that.
  - Every reference exists, chapter and verse, with no gap in a range.
  - A quotation followed by its own reference, even later in the same sentence, is in that exact verse. Any other quotation is in a verse its paragraph cites, its part's main readings, the passage printed just above it, or the main readings of a part the paragraph names ("(part 01)").
  - Links go only to this site.
  - **Every address line is checked.** Each line on a postmarked address, in 00 and beside each part, is either a verse's words (found in that verse) or the study's own words (found in that part of content.md). An address card cannot say anything the study or the verse does not.
  - The figures are proved too:
    - The six steps of Deuteronomy 8:12–14 are found in the verses in the order drawn; the two drawn as the heart are exactly the ones in 8:14, which opens "then".
    - David's prayer (1 Chronicles 29:10–19) is counted by script: 25 words speak to God (You, Your, Yours) and 20 speak of the givers (I, me, my, we, us, our). The page's sentence is tested against the count. Every "You" in these verses is David speaking to God; that was checked by reading, not by script.
    - The tithe years use the study's own sentence ("the third and sixth years of each seven-year cycle"), "every three years" is found in Deuteronomy 14:28, and each of the four guests is found in 14:29.
    - The two bills' numbers are found as words in Luke 16:6 and 16:7, and each is proved to be cut, not raised.
    - The four phrases of the crossing are in Luke 16:25, and each step of the gate thread is in its verse.
    - The coins' phrases are in Mark 12:42 and 12:44. The bars are labelled as proportions only, because Mark gives no amounts for the rich.
    - The five steps of the habit in the close are the study's own words, in the order its "Way" paragraph gives them.
- **Quotations from outside Scripture:** six, all from the Baptist Faith and Message 2000, each found by script only in the article it is credited to (articles IV, XIII and XV) in the copy held on this PC. The passage notes ask for the article XIII phrases to be compared with bfm.sbc.net before publishing, because the convention may amend the confession; the held copy is the 2000 text.
- **Words in quotation marks that are not quotations** are on a short named list, each with its reason, and the build fails if an entry is never used: the rabbis' terms "first tithe", "second tithe" and "tithe of the poor"; "storehouse tithing"; and "positive confession".
- **Three misquotations in the study are kept, not hidden.** A design job may not change the study's words, so the page keeps them and shows the Berean's wording beside each. The build proves the study's words are not in the verse and the Berean's are. **The study's text needs correcting before release:**
  1. Part 02, Reflect: "comes from Your hand". 1 Chronicles 29:16 reads "from Your hand comes all this abundance" (29:14 has "everything comes from You").
  2. Part 04: "does not change". Malachi 3:6 reads "do not change" (God speaking in the first person).
  3. Part 07: "devour widows' houses" (Mark 12:40). The Berean reads "They defraud widows of their houses". "Devour" is the wording of other translations.
- **Refused on purpose:** twenty-seven wrong inputs, tried in memory without writing data.js (`--selftest`), were all refused, each for its own stated reason:
  1. a changed word in a block quotation;
  2. a block quotation under the wrong reference;
  3. a changed word in a quoted phrase;
  4. a quotation cited to the wrong verse;
  5. a reference that does not exist;
  6. a chapter that does not exist;
  7. a link that leaves the site;
  8. a link starting "//", which also leaves the site;
  9. a line the page cannot place;
  10. an italic word that is neither a named study, a question on this page nor a known term;
  11. a confession quotation with a changed word (changed in the text and the list together, so only the held copy can catch it);
  12. a confession quotation searched in the wrong article;
  13. a misquotation entry that would hide a real match;
  14. a misquotation entry removed, so the study's wording must stand alone;
  15. an own-term entry the text does not use;
  16. an address line that is not the study's own words;
  17. an address line not in its verse;
  18. a way a line is "often heard" in words the study does not use;
  19. the order of Deuteronomy 8 changed;
  20. a gift marked as the proud heart;
  21. David's prayer said to speak more of the givers than of God;
  22. a bill's number not in its verse;
  23. a bill that grows instead of shrinking;
  24. a guest not named in Deuteronomy 14:29;
  25. the poor's years moved;
  26. the habit's steps out of order;
  27. a part left without an address.
- **What these checks do not prove:** that a reading is right. A verse-existence check proves the reference exists; a phrase check proves the words are there. Whether "Israel as a nation entering its land" is the right address for Deuteronomy 8:18 is the study's judgement, carried onto the card word for word, not something a script can test. The rabbinic summary, the Talmud reference, the four scholars and the Assemblies of God paper are not checked; the page shows the study's own "to check" marks beside each.
- **By browser against the always-on preview (2026-11-07):**
  - Tested at 1440, 390 and 320 wide, light and dark. At every width the page is exactly as wide as the window, and no element of the page goes past the right edge. The only things past the edge are inside the shared site header's row of links, which scrolls inside itself, as on the other mock-ups. No console errors or warnings.
  - The screenshots were looked at. Five faults found that way were fixed: the crossing in 06 had its cells in the wrong places; the coins caption lost its reference; a straight apostrophe showed in the title "Malachi's storehouse"; small labels took the serif face; and the tithe question's second reading lost its own quotation of 2 Corinthians 9:7 outside its column (it now stays inside the reading it belongs to). The phone version of the 01 figure was redrawn after the first look, and on phones the postmark beside each part is now left out rather than shrunk.
  - A verse link opens the verse in a sheet and puts it in the address (`?ref=NEH.13.10`). Escape closes it, clears the address and returns focus to the link. An address carrying a verse opens its sheet; one carrying an unknown verse does not.
  - By keyboard alone: the "As it is often heard / With its address" switch turns the whole board and keeps the choice in the address (`?view=address`); a question opens by Enter and is kept in the address (`?q=poverty`); the italic link *Should Christians tithe?* in part 03 opens that question and moves focus to it. An address carrying `?q=rich&view=address&ref=MAL.3.10` opens all three.
  - No element on the page shows a focus outline: of 139 links and buttons, none draws one when focused. Selection is shown by each control's own border or underline.
- **Not tested:** the reduced-motion version was checked by reading the stylesheet (the two slow animations, the swaying grain and the sparkles, stop under `prefers-reduced-motion`), not by turning the setting on. Also untested: 200% zoom, a screen reader and a real phone. Colour contrast was not measured.

## Could be confused with

**Covenants and promises** ([covenants-and-promises-directions](../covenants-and-promises-directions/), study 26) teaches a near habit: "a promise is someone's before it is yours", with five questions put to each covenant. The two pages do not look alike. Covenants and promises is a table of five covenants against five questions and an arc chart of the whole Bible across a star-field hero. This page has no table and no whole-Bible chart. It works line by line: a postmark and address lines on single verses about money, a switch that takes the address off and puts it back, and seven small figures each made from its own passage. Its colour is the Gospels' violet, which no other study in Living the Christian Life uses (Grief and dying and Sexuality, singleness and divorce use History orange; Fear, anxiety and despair and Praying the Psalms use teal; Illness and healing and Learning to discern use blue; Faith in daily life and Life together use gold). **The Grief and dying page** shares this page's build lineage and verse sheet, so the two behave alike; Grief and dying is a map of voices joined by lines, in orange.

## Links in the study

**content.md was changed in two places, both allowed by the run's brief** (turning a "[check: …]" link note into a real link on this site):
1. Line 17, the opening care note: "The site's help page lists more [check: link to the site's help page]." became "The site's help page, [Help for life](/resources/life), lists more."
2. Line 297, the poverty question: "The site's help page lists places to start [check: link to the site's help page]." became "The site's help page, [Help for life](/resources/life), lists places to start."

/resources/life is the route the other studies use for Help for life. Nothing else in content.md was changed. The other "[check …]" notes are about wording, crisis numbers and sources, so they stay as written and show on the page as the study's own marks; every crisis number keeps its "check before publishing" mark.

The nine studies the text names in italics link to their mock-ups. Eight exist on this PC as of this build. *The wisdom books* does not yet: a later step of this run builds it at design/the-wisdom-books-directions/, and the build prints a warning until it exists. *Sexuality, singleness and divorce* links to its folder, marriage-sexuality-and-singleness-directions.

## For the editor and the owner

- The three misquotations above need correcting in content.md before release.
- Covenants and promises teaches nearly the same habit. The study does not link to it; the editor may want it to.
- The passage notes' open questions (the subtitle, the crisis lines, the confession wording against bfm.sbc.net, the scholars not read, storehouse tithing, Luke 16 and hell) are the writer's and the owner's, not the page's; the page shows each "to check" mark where the study puts it.
