# Children and the home: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as study 60 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site, no card in the gallery yet (the run's last step adds it)
Open: http://127.0.0.1:8931/mockups/children-and-the-home-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/children-and-the-home/content.md) · Design: [design.md](../../content/studies/christian-life/children-and-the-home/design.md) · Limits and sources: [passage-notes.md](../../content/studies/christian-life/children-and-the-home/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 60, a Scripture & Theology study in Living the Christian Life. Its one habit: **before you hold a verse as a promise, ask what kind of sentence it is.** The study has no working.md; the page was made from content.md and passage-notes.md.

The page teaches that habit by marking it everywhere. The study names four kinds of sentence: a command, a song, a story and a saying. Each has its own small mark: a doorpost for a command, rising steps for a song (the songs of ascents), a road for a story, and scales for a saying. Every Bible quotation on the page carries its kind in the margin, as the mark and as the word, with what that kind asks of you ("to be obeyed", "to be sung and trusted", "to be learned from", "to be applied with wisdom"). Part 00 draws the four kinds side by side. Choosing one marks every quotation of that kind down the page. Then six parts each pass through a figure made from their own verses, and each part ends with one "Its limits" note saying what its passage does not promise. The full design is in [design.md](../../content/studies/christian-life/children-and-the-home/design.md).

## How it is built

[build-data.py](build-data.py) takes the study's content.md and [study_lists.py](study_lists.py), checks them against the site's Berean text and the one outside source held on this PC, and writes [data.js](data.js). It uses [scripture_text.py](scripture_text.py), a byte-for-byte copy of the reader in the Grief and dying mock-up (itself The good news mock-up's reader), plus:
- [held.py](held.py), which reads article XVIII of the Baptist Faith and Message 2000 (the family) from the copy held on this PC;
- [figures.py](figures.py), which builds each part's figure and proves every word, order and count in it;
- [build_selftest.py](build_selftest.py), the wrong inputs listed below.

Run it from the Website folder: `python design/children-and-the-home-directions/build-data.py`. Add `--check` to run every check and fail if data.js is stale, or `--selftest` to try the wrong inputs. data.js is written to a temporary file first and moved into place, so a failed build never leaves half a file. It carries a fingerprint of content.md and of every .py file here, which is how `--check` knows when it is stale.

The page is [index.html](index.html), [js/ch.js](js/ch.js) (the page, the kind key and the verse sheet), [js/figures.js](js/figures.js) (the six figures), [js/art.js](js/art.js) (the drawings) and [css/ch.css](css/ch.css). Like the earlier mock-ups, it borrows the site's frame (header, footer, theme switch) from the Authors and Manuscripts mock-ups. Nothing under `src/` or `dist/` was touched. Neither were catalog.json, progress.json, MASTER-LIST.md or STUDIES.md.

One direction was built, because the text already existed.

## What the checks prove, and what they do not

- **By script on every build:**
  - Every non-blank line of content.md is placed on the page. A stray line fails the build.
  - Every block quotation (16 of them, 31 verses printed in full) is word for word the Berean at its reference.
  - Every reference exists, chapter and verse. A bare reference such as "(6:9)" is read against the book named before it.
  - A quotation followed by its own reference is in that exact verse. Any other quotation is in a verse its paragraph cites or a passage the page prints there. The frame's three examples, which stand without a reference, are pinned to their verses by name.
  - Links go only to this site.
  - Every block quotation has a kind of sentence. One, 2 Timothy 1:5, is none of the four: it is a letter remembering a family's faith, and the page says so in its margin.
  - Each of the four kinds' sample words, taken from the study's frame, is in its verse.
  - Every part has exactly one "Its limits" note.
- **The figures are proved too** (figures.py):
  - **01** Deuteronomy 6: the five places the words go, from the heart out to the town gate, are each in their verse, and their verses never step backwards (6:6, 6:7, 6:7, 6:8, 6:9). The four moments of the day are in 6:7 in the order the figure draws them.
  - **02** The answer's three steps (the child's question, the rescue, the commands) are in Deuteronomy 6:20, 6:21 and 6:24, in that order. The five generations are in Psalm 78:5–6 in the order drawn. Timothy's three are in 2 Timothy 1:5 in order. "a Greek father" and "a believing Jewish woman" are in Acts 16:1.
  - **03** "in vain" is counted in Psalm 127:1–2: three times, then "for He gives sleep to His beloved". The verses split into those three lines before the turn. Psalm 128's blessing begins with "Blessed are all who fear the LORD" (128:1) and ends with "Peace be upon Israel!" (128:6).
  - **04** Each love's reason is the one Genesis gives, in its own clause. Rebekah's love for Jacob is proved to have no "because" in Genesis 25:28, so the row says "Genesis gives no reason". The renaming of Jacob to Israel is in Genesis 35:10, and the robe and the hatred in Genesis 37:3–4.
  - **05** 1 Samuel 2:12–26 is cut into four stretches. Each Samuel stretch is proved to name him, and no stretch about Eli's sons does. Eli heard and spoke (2:22–23); "he did not restrain them" is in 1 Samuel 3:13.
  - **06** Proverbs 26:4 and 26:5, the saying and its opposite; the commands to children and to fathers in Ephesians 6 and Colossians 3; the father's five acts in Luke 15:20, proved in the order drawn.
- **Quotations from outside Scripture:** three short phrases from the Baptist Faith and Message 2000, each found by script in article XVIII (the family) of the copy held on this PC, and searched only there. The study itself still asks for them to be checked against bfm.sbc.net, because the convention can amend the confession, so the page keeps that mark.
- **Words in quotation marks that are not quotations** are on short named lists in study_lists.py, each entry with its reason. The build fails if an entry is never used. These are:
  - the study's own terms: "Hear" (the meaning of the Hebrew word Shema), "wise son" (from the Passover Haggadah), "songs of ascents" (the psalms' headings, which the site's Berean text does not hold as verses), "house" (a word the study explains), and "according to his way" (the study's word-for-word rendering of the Hebrew of Proverbs 22:6);
  - one quotation in British spelling: "honour your father and mother", where the Berean reads "Honor your father and mother" (Ephesians 6:2). The build proves the two differ only in that spelling.
- **The kinds are this page's reading of the study.** The study names the kind for most of its passages in its own words ("This is a command", "These are songs", "a story", "It is a proverb"). For the others the page assigns the kind in study_lists.py. Deuteronomy 6:20 is marked a command because it stands inside the commanded instruction of Deuteronomy 6, even though the child's words in it are a question. A reviewer may want to look at that one.
- **Refused on purpose:** twenty-four wrong inputs, tried in memory without writing data.js (`--selftest`), were all refused, each for its own stated reason:
  1. a changed word in a block quotation;
  2. a block quotation under the wrong reference;
  3. a changed word in a quoted phrase;
  4. a quotation cited to the wrong verse;
  5. a reference that does not exist;
  6. a chapter that does not exist;
  7. a link that leaves the site;
  8. a link starting "//", which also leaves the site;
  9. a line the page cannot place;
  10. an italic word that is neither a named study nor a known term;
  11. a confession phrase with one word changed;
  12. a confession phrase searched in the wrong article;
  13. a part with its "Its limits" note removed;
  14. a block quotation with no kind of sentence;
  15. a kind's sample words under a verse that does not hold them;
  16. an own-term entry the text does not use;
  17. a spelling entry that would hide a real difference in wording;
  18. the rings of Deuteronomy 6 put out of order;
  19. the five generations of Psalm 78 in the wrong order;
  20. the count of "in vain" changed;
  21. a reason for a parent's love that Genesis does not give;
  22. "no reason given" claimed where Genesis gives one;
  23. a Samuel stretch that does not name him;
  24. the father's acts on the road out of order.

  The first self-test run found one real gap: a stray line placed after the opening's help lines was silently joined to the care note. The build now allows only one paragraph there, and case 9 proves it.
- **By browser against the always-on preview:**
  - Tested at 1440, 390 and 320 wide, light and dark. The page is exactly as wide as the window at every width. The only things past the right edge are the site header's own navigation links, inside its scrolling strip, as on every mock-up. There are no console errors.
  - The screenshots were looked at, and five things were changed after looking: the heart was drawn as the outer ring instead of the inner, the hero's markers along the road read as gravestones and became young olive saplings, the generations were spaced apart instead of linked, one reference was printed twice, and a figure caption gave a number in digits.
  - A verse link opens the verse in a sheet and puts it in the address (`?ref=`). Escape shuts it and returns focus to the link.
  - Choosing a kind in part 00 marks its quotations and lists them, and keeps the kind in the address (`?kind=`). The ring chosen in part 01 is kept in the address too (`?ring=`). Unknown values in the address are ignored.
  - The stylesheet removes the focus outline from every link and button on the page and in the sheet; this was read in the stylesheet, not tabbed through.
- **Not tested:** the reduced-motion version was checked by reading the stylesheet, not by turning the setting on. The sheet was opened by a scripted click and shut with the Escape key; the other controls were not walked through by keyboard alone. Also untested: 200% zoom, a screen reader and a real phone. Colour contrast was not measured.

## Could be confused with

- **Faith in daily life** ([faith-in-daily-life-directions](../faith-in-daily-life-directions/README.md)) is the nearest neighbour in subject: its drawing is a door, a bench and a bowl. This page's drawing is a doorpost with its small case, with a road running from it to the horizon, saplings along the road and an olive beside a low table. There is no open doorway and no room. Its page is organised around daily practice; this one around kinds of sentence.
- **Chosen and kept** ([chosen-and-kept-directions](../chosen-and-kept-directions/README.md)) sorts its passages into four purposes before reading them. This page also has a four-part key, so it could be mistaken for that board. It is not a sort: the passages stay in the study's order, and the four kinds are marks in the margin that a reader can light, not columns the passages are moved into.
- **Grief and dying** ([grief-and-dying-directions](../grief-and-dying-directions/README.md)) and **Marriage, sexuality and singleness** ([marriage-sexuality-and-singleness-directions](../marriage-sexuality-and-singleness-directions/README.md)) also use History orange, and Grief and dying shares this page's build lineage and verse sheet. Grief and dying is a map of voices joined by lines to the ones they speak to. This page has no line map: its figures are nested rooms, a chain, a count, a family row, a strip of stretches and a road.

## Links in the study

content.md was changed twice, as the run brief allows, to turn a "[check: …]" link note into a real link on this site:
- the help page in the opening's care note now links to [Help for life](/resources/life);
- the Christian reading of Deuteronomy 6:4 now links to the site's article [The Trinity](/study/theology-articles/the-trinity), which exists in the site's article list.

Eleven "[check …]" notes remain, and they stay as the study's own marks on the page:
- seven "check before publishing" marks on the crisis numbers;
- three "wording against bfm.sbc.net" marks on the confession phrases;
- one asking for the named commentators who hold each reading of "in the way he should go" (Proverbs 22:6) to be read directly. That needs the study's author, not a design job.

The ten studies the text names in italics link to their mock-ups. Nine exist on this PC as of this build. *The wisdom books* has no mock-up folder yet, because that study is designed later in the run. The build warns about it and still passes; the link will work once that page exists.
