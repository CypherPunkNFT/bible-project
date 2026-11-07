# Women of the Bible: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 11 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/women-of-the-bible-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/people-of-scripture/women-of-the-bible/content.md) · Design: [design.md](../../content/studies/people-of-scripture/women-of-the-bible/design.md) · Limits and sources: [passage-notes.md](../../content/studies/people-of-scripture/women-of-the-bible/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 46, a Scripture & Theology study in People of Scripture. Its one habit: **read her story first, then read how later Scripture remembers her.** The study opens with the one act Jesus said would be "told in memory of her" (Mark 14:9), and the third of its three questions for every life is "How does later Scripture remember her?" The page draws that: one chart of sixteen stories with a curve from each down to every later book that looks back on her, and then the stories themselves, facing each other in the pairs and trios the text sets them in.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) (a copy of The good news mock-up's reader), [study_lists.py](study_lists.py) (this page's own lists) and [selftest.py](selftest.py) (the wrong inputs), reads the study's content.md, checks it against the site's Berean text and the copies of the outside sources held on this PC, and writes [data.js](data.js). Run it from the Website folder:

- `python design/women-of-the-bible-directions/build-data.py` writes data.js.
- `--check` runs every check and fails if data.js is stale. It writes nothing.
- `--selftest` feeds seventeen wrong inputs in memory and proves each is refused for the right reason. It writes nothing.

The page is [index.html](index.html), [js/wb.js](js/wb.js), [js/art.js](js/art.js) and [css/wb.css](css/wb.css), with the frame borrowed from the Authors and Manuscripts mock-ups, as in the model. Unlike the model, the build writes nothing under `src/`. The parser is this page's own, because the text's shape is its own (sub-heads per woman, "Where the passage stops", numbered questions, bullet views, a "[open]" note, bold-led steps). One direction was built, because the text already existed.

## The page

- **Opening.** The standard heading: the trail (Study / People of Scripture / Women of the Bible); the three questions in gold capitals (What she did · What God did · How Scripture remembers her); *Women of* in ink with *the Bible* in gold italic; the lead, which is the study's own first paragraph at the dinner in Bethany. Beside it, in a faint circle and dotted orbit, an alabaster flask lying on the table with its neck snapped off, the nard running out into a pool, the broken neck beside it, and the scent rising slowly. Motto: "What she has done / will also be told.", checked in Mark 14:9 and linked to it. No face or figure of anyone.
- **Four counts**, each with what it means: 16 stories (17 women: Martha and Mary share one story); 5 stories a later book names again, with 3 more echoed or set aside; 34 verses printed in full; 134 references, each opening its verses. All four are computed on every build.
- **00 Three questions for every life.** The selection paragraph with its two site links, the confession paragraph, and the three questions side by side, each with its own mark (an open book for what she did, a four-point star for what God did, a curved arrow for how Scripture remembers her). The book and the arrow label the same strands on every woman further down; the star returns at the close. Then **Told in memory of her**: the sixteen stories in the Bible's order across the top, the 66 books as a band of ticks in their section colours along the bottom, and a fine curve from each story to every later book that looks back on her, coloured by that book's section. Solid curves name her (Sarah in Hebrews 11:11 and 1 Peter 3:6; Miriam in Micah 6:4; Rahab in Matthew 1:5, Hebrews 11:31 and James 2:25; Ruth in Matthew 1:5; Priscilla in Romans 16:3–4 and 1 Corinthians 16:19). Dashed curves are Hannah's song echoed in Mary's (Luke 1:47), Mark 14:9 for the anointing at Bethany ("Mark does not name her"), and Paul's use of Hagar (Galatians 4:21–31), which the study sets aside. Pointing at, focusing or choosing a story dims the other curves and writes its memories on the line below, each in the verse's words with its reference. Below 1000 pixels wide the curves are left out and the same memories are listed.
- **01–08.** Each part opens with its number, its title with the turn in gold italic, its hook in italic and its main readings. Then the women of the part face each other across fine rules between two heavy ones: her small drawing (a tent, a spring, a tambourine, a scarlet cord in a window, a palm, a scroll, a sheaf, the doorposts at Shiloh, loaves and a wineskin, the sceptre, a stone water jar, the opened tomb, the nard, purple cloth by a river, a stitched tent cloth and awl, a letter) and her name, one line of her story in the verse's own words, and where later Scripture remembers her, or "No later memory in these readings". Junia stands in part 08's row behind a dashed rule with "One verse, not a story: not counted among the sixteen." Then the reading in one column: each woman's sub-head carries her drawing; "Where the passage stops" and "What the text gives them, and what it does not" are set as a dashed rule with the words in small capitals, so the reader sees where the text ends and comment begins; views sit side by side across a rule; the one "[open]" note on Deborah is marked "Read more than one way". Consider and Reflect close each part side by side.
- **The question.** "A question: do these women show that women may be pastors?", then the site's view, the two readings of 1 Corinthians 11 and 14 side by side, the other traditions' view and the home, each with its label in a margin column.
- **Close.** The closing paragraph, then the same paragraph read as a list under the star: "He kept His word to / a laughing Sarah", "He saw / a runaway slave" and six more, each clause on a fine rule with links to the parts it names. Then the reader's question, "Read the passage again before you answer.", and beside them Mark 14:3–9 printed in full as the passage the study began with, under the flask standing empty. Then the sources, a line saying how many outside quotations were checked, and a link back to People of Scripture.
- **Every reference** opens its verses in a sheet from the right, in the Berean, and puts the reference in the address (`?ref=RUT.1.16`).

**Colour:** History orange. Ten of the sixteen stories are told in Genesis to Esther (counted by the build). The chart uses all six section colours for what they already mean across the site.

## Why it does not look like its neighbours

- **The page it could be confused with is Long Memory**, the site's study of how later Scripture remembers a person ([/study/long-memory](http://127.0.0.1:8931/study/long-memory)), because this page borrows its move. Long Memory follows one person's every mention across the 66 books as points of light. This page draws sixteen people at once, only the memories the study itself reads, as curves from story to remembering book. Then it leaves the chart and reads the stories in the text's own pairs.
- **[Rulers and their choices](../rulers-and-their-choices-directions/)**, the other People of Scripture mock-up, hangs 39 rulers on strings sized by their reigns. This page has no strings or verdict shapes. Its people stand side by side in short rows, two or three at a time.
- **[The good news](../the-good-news-directions/)** runs down one thread with a sticky rail and a two-column ledger. This page has no rail and no ledger.
- **[Faith under pressure](../faith-under-pressure-load-bearing/)** and **[The hope to come](../the-hope-to-come-horizon/)** open with a wide landscape across a coloured band. This page keeps the standard circled drawing, like **[The book of Psalms](../praying-the-psalms-directions/)**. It differs from that page below the heading: it has no five books and no gate.

## What the checks prove, and what they do not

**Recorded run, 2026-11-07:** `build-data.py` printed "all checks pass; wrote data.js"; `--check` printed "build-data: all checks pass; data.js is current" and exited 0; `--selftest` printed "selftest: 17 of 17 wrong inputs refused for the expected reason; nothing written". The preview answered 200 for the page, data.js, both scripts and the stylesheet.

**By script on every build:**
- Every non-blank line of content.md is placed on the page, or the build fails ("a line the page does not know how to place"). The title, the draft line, the question section and the close must be present. The parts must be numbered 01, 02 … in order and each must have main readings. A part may have both Consider and Reflect or neither, never one alone. The close must end with the reader's question and "Read the passage again before you answer."
- Every block quotation is word for word the Berean at its reference. It is either the whole passage or one unbroken run of whole words from it. Five are runs, and the page marks each "part of the verse": Ruth 1:16, 1 Samuel 2:8, 1 Samuel 25:32–33, Luke 1:38 and Acts 18:26.
- Every reference exists in the Berean, with no gap in a range: 134 different passages. Short continuations ("Judges 4:21; 5:24", "Acts 16:11–15, 40") take their book from the reference before them. "; 1 Peter" or "; 1 Corinthians" is never read as verse 1, the fault that caught the Angels page. Overlapping references fail the build. A part's main readings must be references only.
- A quotation with its own reference right after it must be in that reference. Any other quotation must be in a verse its paragraph cites, its part's main readings, or the passage printed just above it. Matching is by whole words, ignoring curly or straight quotation marks.
- **Outside quotations:** all 28 quotations from outside Scripture are listed in study_lists.py, and each must still be in content.md. **23 were found word for word in the copies held on this PC:** eight phrases of the Baptist Faith and Message 2000; the two Criswell sermons (1960, 1984); Piper's 2006 sermon on Romans 16; Calvin on Romans and on 1 Timothy; Matthew Henry, volumes 2, 5 and 6; the Chalcedonian Definition (the site's creeds page); and the Berean's own notes "Or deaconess" (Romans 16:1) and "Or their wives" (1 Timothy 3:11). Each phrase is looked for only in its own named source.
- Each of the sixteen stories in study_lists.py must sit in the part it names, under the sub-heads it names. Her line must be in its verse, and that verse must lie inside a passage content.md cites. Each remembering verse must lie inside a passage content.md cites, so the chart draws no memory the study does not read. A "named" memory must hold her name (Prisca for Priscilla). An echo must not claim to name her. Hannah's echo is checked at both ends: "My heart rejoices in the LORD" in 1 Samuel 2:1 and "my spirit rejoices in God my Savior" in Luke 1:47.
- The list must hold 16 stories and 17 women, and the opening must still say "sixteen women's stories". Junia's sub-head must exist and her line must be in Romans 16:7.
- Each of the eight clauses on the closing list must be, word for word, a clause of the closing paragraph.
- The motto must be in Mark 14:9.
- A named study links to its mock-up only if that folder holds an index.html. *The signs and works of Jesus* and *The church and its calling* link.
- Links may only go to this site.

**Refused on purpose.** `--selftest` refused all 17 wrong inputs, each for the expected reason, and wrote nothing. Ten change the text:
1. a changed word in a block quotation;
2. a block quotation under the wrong reference;
3. a changed word in a quoted phrase;
4. a quote cited to the wrong verse;
5. a reference that does not exist (Genesis 16:20);
6. a reference that does not exist in a part's readings (Ruth 5:1–22);
7. a link that leaves the site;
8. a line the page cannot place;
9. a changed word in an outside quotation;
10. a changed clause in the closing paragraph.

Seven change study_lists.py:
1. a remembering verse that does not name her;
2. a remembering verse the study does not cite;
3. her line given to the wrong verse;
4. a motto not in its verse;
5. an outside quotation looked for in the wrong held source;
6. a story dropped from the list;
7. a study link to a mock-up that does not exist.

**Real faults the checks caught while building:**
- The text has five partial-verse block quotations. The model's rule would have refused them, so the rule now accepts an unbroken run of whole words and the page labels it.
- Part 06 has no Consider or Reflect. The page leaves them out rather than invent them.
- The first reading of "cited" refused a phrase from Exodus 15:21 under a passage cited as Exodus 15:20–21. "Cited" now means inside a cited passage.
- Four selftest cases at first tested nothing, among them a "not cited" verse that lay inside a cited range. They were rewritten until each one failed for its own reason.
- In the browser, references in the trail, the readings and the memory lines first printed as raw addresses, because nested lists were not flattened. This was fixed and checked again.

**Not checked by script:**
- The five outside quotations no copy is held for: Pius IX's words from *Ineffabilis Deus* (1854); "more honourable than the cherubim"; the two Barnes phrases; and the English Standard Version's "well known to the apostles". The study marks the hymn and the Barnes phrases "[check: …]"; it does not mark the Pius IX or the English Standard Version wording.
- The section numbers printed beside outside sources ("Article VI", "on 2 Kings 22:14"). The words are found in the right source, but not tied to the article or comment named.
- Whether the study reads any passage rightly. The checks prove the words are the Berean's and sit in the verses cited, not that the reading is right.
- Whether the one-line summaries chosen for each woman's row are the best line of her story. They are proved to be in the verse, not proved to be the right choice.

**By browser, against the always-on preview, 2026-11-07** (Playwright):
- At 1440, 390 and 320 wide, in light and dark: the page's scroll width equals the window width at every size, and the console shows 0 errors and 0 warnings. The only boxes past the right edge at 390 and 320 are the shared header's own scrolling menu, as on The good news page.
- The page has 8 parts, and 199 verse links once drawn.
- Screenshots were taken and looked at: at 1440 in light, the hero, the chart, parts 01, 03 and 08, the question and the close; at 1440 in dark, the hero and part 04; at 390 in dark, the hero and part 04; at 320 in light, the hero and part 04; the open sheet; and the chart with Rahab chosen. The last pass was run on the final files.
- A verse link reached by keyboard and opened with Enter opens its sheet from the right and puts `?ref=RUT.1.16` in the address. Escape closes it, clears the address and returns focus to the link, with no outline drawn.
- Opening the page with `?ref=RUT.1.16` opens that sheet. `?ref=__proto__` opens nothing and throws nothing.
- Choosing Rahab on the chart writes her three memories on the line below and dims the other nine curves.

**Not tested:** 200% zoom, a screen reader, a real phone. The reduced-motion rule is in the CSS (the scent, the pour, the pool, the sparkles and the small flames stop) but was not tried with the setting on. Colour contrast was not measured.

## Changes to content.md

None. Its five "[check: …]" notes, on four lines, are fact checks, not link notes: the Orthodox hymn wording; a named Orthodox source; the wording and date of Chrysostom on Junia; whether Article VI reads "pastor" or "pastor/elder/overseer"; and Barnes on 1 Corinthians 11 and 14. The brief allows only link notes to be resolved here. The page does not show the notes, so a reader does not see editorial marks. data.js keeps them with their line numbers (`study.checks`), and they stay in content.md for the writer. The draft line ("Study 46 · People of Scripture · First content draft") is kept in data.js and not shown either, because the page shows only the page.

## For the owner

- **Five checks are still open in the text** (listed above). Separately, five quotations on the page are not proved against any source held on this PC: Pius IX, the Orthodox hymn, Barnes twice and the English Standard Version phrase. Only the hymn and Barnes carry a check note in the text.
- **"Sixteen stories", seventeen women.** The text counts Martha and her sister Mary as one story. The page keeps that and says so in its first count.
- **Two studies are named but not linked**, because the text names them in plain words, not as links: Study 38, Prophets in their times, which has a mock-up on this PC, and Study 43, on marriage, sexuality and singleness, whose page is being designed alongside this one. Making them links means changing content.md's wording. That is a writing change, so it was left for the run's last step or a writing pass.
- **Not done here, by the run's rules:** the gallery card in catalog.json, the progress and master lists, and the commit. The run's last step adds them.
