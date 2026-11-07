# Prayer across Scripture: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30 as *Prayer in the letters*; **reshaped:** 2026-11-07 to the rewritten text, as step 34 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/prayer-in-the-letters-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/prayer-in-the-letters/content.md) (the earlier text: [content-first-draft.md](../../content/studies/christian-life/prayer-in-the-letters/content-first-draft.md)) · Limits: [passage-notes.md](../../content/studies/christian-life/prayer-in-the-letters/passage-notes.md) · Design: [design.md](../../content/studies/christian-life/prayer-in-the-letters/design.md)

Study 04, a Scripture & Theology study in Living the Christian Life. The folder keeps its first name, `prayer-in-the-letters`. The writing run rewrote the study around the Lord's Prayer, so this page was reshaped around the prayer too. Its one habit is unchanged: **don't stop at the request; ask, so that what?**

## What the page is now

- **Heading.** The study trail, the five concepts in gold capitals (Father · Name · Bread · Forgiveness · So that), "Prayer" in ink with "across Scripture" in gold italic, the lead, and Luke 11:1 ("Lord, teach us to pray") with a link to its paragraph. Beside it, the drawing kept from the first build (a leaf of a letter, its lines stepping in, a dotted thread going on past the page) in its faint circle and dotted orbit, with the new motto "Teach us to pray. / Then ask: so that what?". Then four figures, the study's frame paragraph and its statement of what it selected.
- **01 The prayer Jesus taught. Line by line.** New, and now the page's signature. The prayer is set as ruled lines of text: the disciple's request (Luke 11:1), the address (Our Father in heaven), three lines about God and three about us, each line found once in its verse. Each line is a button that shows the part of the study that reads it, beside the prayer. Under each line are the letters' passages this study pairs with it. So the prayer *is* the menu for the six parts; there is no separate list of parts. A line under the prayer says the Berean ends it at "the evil one" and that part 02 explains the closing praise many churches add. On narrow screens the prayer sits above the chosen part.
- **The six parts**, each built once and only shown or hidden: the part's title and hook, its main readings as links, then each letter passage it reads kept whole on a tinted leaf, broken into lines that step in at each "so that" (kept from the first build), with "For whom" and "What gives confidence" beside it, then the study's own sub-sections, then Consider and Reflect, and a button to the next part. Part 01 reads only Luke and Matthew, so it has no leaf.
- **02 Six prayers in the letters. None stops at the request.** Kept from the first build: six columns read from the bottom up, from thanks to where each prayer arrives. Each column's link now goes to the part that reads its passage.
- **03 Six questions, faced.** A ruled list; each opens the one sheet from the right with its passages (the question on asking has two), then the study's reading, care notes, and what others have taught, labelled as theirs. The question on unanswered prayer opens with its care note and crisis lines, as the text puts it first. Phone numbers do not break across lines.
- **Close.** The way of reading, the invitation, the question, "Read the passage again before you answer" with Matthew 6:9–13, the way back to Living the Christian Life and the neighbouring studies, and the sources.
- **Removed, because the new text no longer has them:** the three requests about circumstances (the road and the door are now inside part 03), the six older lines from earlier Scripture, the three prayers to follow unaided (Romans 15 and Hebrews 13), and the drawing at the foot of the page (an altar with incense for Psalm 141:2, which the text no longer quotes).

**Could be confused with:** [The book of Psalms](../praying-the-psalms-directions/README.md), the other study of prayer, which sets all 150 psalms in one picture of the book. This page has no map of a book; it is one short prayer set out as lines of text, each line opening a part. It could also be confused with [Faith under pressure](../faith-under-pressure-directions/README.md), which marks passages with a filter. Here a passage is never marked; it is broken into lines that step in, and every word stays in its order.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and writes [data.js](data.js). It uses [prose.py](prose.py) (turning prose into page text and checking every quotation), [shapes.py](shapes.py) (the stepped lines, the columns and the prayer's lines), [study_lists.py](study_lists.py) (this page's lists) and [scripture_text.py](scripture_text.py) (reading the Berean; the model page's copy, with only its first line naming this study). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date; its fingerprint covers only this study's own inputs, so another job editing a shared file cannot make this page read as stale. `--selftest` runs [build_selftest.py](build_selftest.py). The data's version number went from 1 to 2, so an old data.js shows a "run build-data.py" notice instead of half a page.

Run from the Website folder: `python -B design/prayer-in-the-letters-directions/build-data.py`, then `--check`, then `--selftest`. All three passed on 2026-11-07.

## What the checks prove, and what they do not

- **On every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section. Every block quotation is word for word the whole Berean text of its reference. Every reference exists, with no gap; split references such as "Matthew 6:12, 14–15" and whole chapters such as "Exodus 16" are each checked. A quoted phrase must be in the reference given for it (in brackets straight after it, or else in its sentence) and nowhere else. Only a sentence with no reference at all may quote from its section's readings or the prayer itself, and the build prints each of those 43 bindings so they can be read. A Baptist Faith and Message phrase must be in its own article of the copy held in the site's question sources. A commentator's or confession's phrase must be in one paragraph of the held file named for it. The study's own glosses, such as "standing prayer", must be on a short list, and every list entry must still be used. The words "I" and "my", which the study says the Lord's Prayer does not contain, are proved absent from Matthew 6:9–13. Each passage's lines join back to exactly its Berean text. Each labelled phrase, column station and line of the prayer occurs once in its verse, so the wrong one cannot be labelled. Every line of the prayer leads to a part that exists, and every part is reached. Every letter passage a part reads has a leaf, and each column's link goes to a part that reads its passage. No link leaves the site: the text may not hold a web address, a markdown link or a `javascript:` link, every source link is a page on this site, and the finished data is scanned for links. The page files are the expected nine, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **Refused on purpose:** `--selftest` first proves the real text builds. Then 28 named wrong inputs, each refused for the reason named: a block quotation changed by one word; a quotation cited to the wrong verse when another verse in scope has it; a verse that does not exist; a range that runs backwards; a quotation straddling the gap in "Matthew 6:12, 14"; a web address; a markdown link; `javascript:`; an ellipsis inside a quotation; curly quotation marks that would skip the checks; a quotation hidden in a note still to check; an unlisted italic; an unknown key; an unknown paragraph tag; a known text issue corrected without updating the list; an own term no longer used; a confession phrase changed; a source quotation changed; parts out of order; a question opening with plain prose; a line of the prayer pointing at a missing part; a line whose words occur twice in its verse; a letter beside a line that the study never cites; a column station outside its phrase; a leaf phrase that occurs twice; a study link to a missing page; a source link leaving the site; a column sent to a part that does not read it. Then **every** one of the 139 block quotations and quoted phrases in the text was changed by one word, one at a time, and every change was refused. The test never writes data.js.
- **Not checked by script:** whether a label is right, whether a reading is right, or whether a pairing of a line of the prayer with a letter is right (the page says the pairings are this study's). The commentary files are checked whole, not comment by comment, so a quotation from another comment in the same file would pass. The 15 notes the text still marks "check" (dates for the Amidah and Kaddish, the Berean footnote on Matthew 6:13, the Didache, book years and authors, the crisis lines) are shown on the page as small gold marks, unresolved.
- **In a browser, against the always-on preview, on 2026-11-07:** at 1440, 390 and 320 wide, light and dark: the page does not scroll sideways (the shared site header clips its own menu past the edge on phones, as on other mock-ups), no console errors, every button and summary at least 44 pixels tall, no focus ring on a focused control. Choosing "Give us this day our daily bread" shows part 03, puts `?part=03` in the address and moves focus to the part's heading. Choosing "hallowed be Your name" marks all three lines about God, since all three lead to part 02. A column's link opens its part. A verse link opens its sheet and Escape closes it, returning focus to the link. A question with two passages shows both. The question on unanswered prayer opens with its care note. An address with old or unknown values (`?part=99&reading=wisdom&sheet=COL.4.2-6`) is cleaned to the plain page, and a link straight to a passage opens it. The screenshots were looked at: the heading, the prayer beside part 01, part 05's leaf, the columns, the question sheet, and part 03 at 320 wide.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone, Back and Forward after the reshape (the code for them is unchanged from the first build, where they were tested), and reduced motion in a browser.

## Found in the text: needs the owner's word

I did not change the study's words. Each of these is shown on the page as the text has it, and the build holds the evidence:

1. **"Ten passages from the letters: six … and four …"** (in the selection paragraph, and "ten passages" again in the close). The study reads nine: six reported prayers and three instructions (1 Timothy 2:1–6, Ephesians 6:18–20, Colossians 4:2–4). The figures on the page show nine. The build fails if either sentence changes, so the list is updated when the text is.
2. **Baptist Faith and Message misquoted by one letter.** The study has "Lord and Savior"; the held confession's article IV reads "Lord and Saviour" (the American spelling is in the catechism printed with it, not in the article). The page marks the held wording.
3. **"Thorn in the flesh"** (the question on unanswered prayer). The Berean at 2 Corinthians 12:7 reads "a thorn in my flesh". The page marks the Berean's words.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan before any code. Decided:

- **The prayer is the menu.** The first plan put a Lord's Prayer section, the six columns and a separate list of parts one after another, three ways into the same six things. Now the prayer's lines choose the part, and there is no separate list.
- **A quotation tied to a reference must be found there.** No falling back to other verses in scope; only a sentence with no reference may quote its section's readings, and each such binding is printed. Confession phrases are checked in their article, with no unchecked list; own terms are short, keyed to their section and must be used.
- **No link leaves the site**, now including the sources (earlier this page linked out to source websites).
- **Engineering.** A new data version number so old data cannot half-draw the page; the scripts, the page and the build changed in one step; the old part names in the address are dropped, not kept; the columns' links remapped to the new parts and checked; a question can hold more than one passage; a care note may open a question; phone numbers do not break.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles II, IV, V, XIII and XVII quoted where they bear, each checked in its article. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | On 1 Timothy 2:4, Boyce, Calvin and Wesley; on God's will, Blackaby, Friesen and DeYoung; on praying in the Spirit, both Baptist views. The page does not choose |
| 3 Berean | ✓ | Every verse and link. Two misquotations found and marked (above) |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | The drawing is kept from the first build; the motto is the new text's |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", "Left open", "Care", named sources and "This study's pairing" are labelled where they come |
| 8 Precision | ✓ | The selection note says what is left out; this record says what the checks cannot prove |
| 9 Hard questions | ✓ | Six faced, each with its passage first |
| 10 Complete or says so | ◐ | Fifteen notes still to check, shown on the page; one count in the text is wrong (above) |
| 11 Sources registered | ◐ | Listed on the page with what was read. [SOURCES.md](../../SOURCES.md) still has the first build's entry; the run's last step updates shared lists |
| 12 Own shape | ✓ | The prayer as the menu, the rising columns, the stepped lines |
| 13 Three depths | ◐ | The prayer's line, the part with its passage whole, the verse. No separate page per part |
| 14 Parallel parts, card anatomy | ✓ | One part form, one leaf form, one column form |
| 15 Dense, compact | ✓ | One part shows at a time; second passages stay closed until asked for |
| 16 Joined up | ✓ | Part in the address, one sheet, twelve named studies linked to their mock-ups; The wisdom books is shown as a name, its page not yet built when this was made |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning. The prayer and the columns are lists, read in order by a screen reader |
| 19 Art | ◐ | The leaf and thread are a first pass for the owner's eye, captioned as illustrative |
| 20 Colour | ✓ | The letters' gold and ink only; each kind of line differs by its word and shape |
| 21 Approved, not ruled out | ✓ | Type, fine rules and one tinted leaf |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | Luke 11:1 opens the page, and Matthew 6:9–13 closes it |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then Reflect · your response |
| T3 Scripture on Scripture | ✓ | The letters beside each line of the prayer, and the six columns beside one another |
| T4 Way of reading | ✓ | Don't stop at the request: in the lead, on the leaves, on the columns, stated in the close |
| T5 Scripture's form | ✓ | Every letter passage whole and in order; reported prayers and instructions told apart |
| T6 Voice and ending | ✓ | |
