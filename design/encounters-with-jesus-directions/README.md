# Encounters with Jesus: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job f5c4c05d5be14716b8d3c311cec06c1a · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/encounters-with-jesus-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/jesus-christ/encounters-with-jesus/content.md) · Design: [design.md](../../content/studies/jesus-christ/encounters-with-jesus/design.md) · Log: [STUDY_MOCKUPS_LOG.md](../../../Pages/Topics/STUDY_MOCKUPS_LOG.md), Study 13

A Scripture & Theology study in the Jesus Christ field, widened from the draft's six groups as [the to-do list](../../../Pages/Topics/TODO.md) asked, so that illness, grief, money and doubt are each met in single stories. Its one new move: **one plate of fifteen meetings, set by who moved first and by the last thing the record says of that person,** with each meeting's words written under its drawing.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Barnes, Jamieson-Fausset-Brown and Maclaren files, checks them, and writes [data.js](data.js). Run `python design/encounters-with-jesus-directions/build-data.py` from the Website folder. Add `--check` to run the same checks and fail if data.js is stale, writing nothing. The page reads no other data. Each count in the text is named, such as `{{meetings}}`, and filled in by the script.

Only one direction was built, as with the earlier mock-ups, because this is an existing draft. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Extract a shared one when the real pages are built.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves. Each quoted phrase is in the verse its own sentence cites, or one paragraph of its named held source close to the note it is cited to, or the listed confession phrases with their own article.
- **By script, on the meetings:** each phrase on a meeting is in one verse, as whole words, inside that meeting's own passage. Later Scripture must be outside it. Row, column and chip counts are computed and must add up. A count typed beside a counted noun fails. The sentence both sisters say must be word for word in John 11:21 and in John 11:32. Page files are the expected ones, the only innerHTML is in en-core.js, and the drawings are fixed strings.
- **By script, on what is absent:** John 4 holds no word for prostitute or the like; John 3:1–2 holds no fear; Mark 10:17–31 holds no "young" or "ruler"; John 20:27–29 holds no touching. Controls prove the same searches find "young" in Matthew 19:20, "ruler" in Luke 18:18, "fear" in John 19:38 and "touched" in Mark 5:27.
- **Not checked by script:** whether a meeting sits in the right cell, whether a reading is right, whether a chip fits the meeting, whether Levi is the Matthew of Matthew 10:3. Much of the most interpretive wording, the cells, the lists on each group's form and the test's answers, sits in study_lists.py and needs a person's reading.
- **The Baptist Faith and Message phrases** were compared by script on 2026-10-30 against the text served at https://bfm.sbc.net/bfm2000/ (sha256 of the page, 15b1496bf19cf64648d97added2bb82f8635f1f0c04cd4541810463a764d6647), each under its own article. The page is not kept here, so the build cannot repeat this. Compare them by eye before release.
- **Refused on purpose:** 32 wrong inputs were each tried in memory and refused, among them a phrase not in its verse, a phrase outside the meeting's passage, an unknown row, a changed sister's sentence, a false absence claim, a broken control, a typed count, a stray line, a misquoted answer, a quotation cited to the next verse, a wrong article, older wording, curly quotes and a commentary quotation given to the wrong source. The script that did this is in the job's workspace and not in this folder.
- **By browser against the always-on preview:** at 320, 390, 620, 768, 951, 1100, 1101 and 1440 wide in both themes: nothing past the right edge on any group, and no console errors. 100 and more behaviour checks: every meeting opens and closes with focus returned, a passage opens from a record and comes back, the browser's Back closes, closing from two levels works, wrong address values are ignored, chips toggle, every question opens, the test stays out of the address and gives its answer whichever button is chosen, the arrow keys move along the rail, every reference resolves, and reduced motion stops the paths and hides the pause button. Screenshots were read by eye at 1440 and 390, and dark at 1280.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone.
- **Known gap:** the build's short hash is not printed on the page, so a cached old data.js would not be visible. The fingerprints are inside data.js and `--check` uses them.

## The three plan reviews

Theology and correctness, reliability, and platform and design reviews were run on the plan and the text, before any code. The plan's differences from what was built:

- **Thirteen meetings became fifteen.** The plan had one entry for the man with the withered hand and those watching him. They are now two, because he was called and they came to accuse. Bartimaeus was added, so the road in Mark 10 has its other ending.
- **Mary moved.** The plan put her under "He began it", from "is asking for you" in John 11:28. She is now under "They came to Him", from "she got up quickly and went to Him" in John 11:29, and her record says the sisters had already sent word in John 11:3. It remains a close call.
- **The counts changed with them, and are computed.** The text names each count and the script fills it in. Reviews found miscounts in the first text.
- **Quotations are checked against the reference that goes with them.** The plan said "the nearest reference", and reviews found this could pass a quotation on a reference that does not hold it. Now it is the next reference in the same sentence, then the one before. Commentary quotations are each tied to their own note. Over-claims in the first text were corrected in the same pass.
- **After the last line draws only those seen again.** The plan drew thirteen lines with seven open ends. Now six run on, and the nine others are named once as not seen again, as far as the record lets us tell.
- **The test is not a two-way quiz.** The plan offered "says it" or "added". It now has three neutral choices, with no score or right-or-wrong colours, and nothing in the address.
- **Forms changed.** The group on calls is a path with what was left, rather than a table of verbs. The man who went away has one turning line with Bartimaeus further on, rather than a table of three Gospels' words.
- **The hard questions are five, not six.** The one on "good" was cut.
- **Engineering.** One sheet holds three kinds of content (meeting, passage, question), each in the address. All values read from the address go through Maps. Only the sheet adds a Back-button step. Hover has a focus equivalent, and every line a hover would show is written under the drawing.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 3, 4, 7 and 13 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | Named commentators are labelled as theirs. On water in John 3:5, the page does not choose |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ✓ | "This study reads", named sources and care notes are labelled where they come. The older-Scripture rows say who draws each link |
| 8 Precision | ✓ | The selection says what a meeting is, what grew from the draft, and names some left out |
| 9 Hard questions | ◐ | Five are faced. Alexander Maclaren is the one Baptist read, and only on four passages. No modern Baptist commentary was read |
| 10 Complete or says so | ✓ | "A selection, not a census" |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Encounters with Jesus mock-up" |
| 12 Own shape | ✓ | A plate of meetings, then seven forms. Unlike the sibling studies' beams and rows |
| 13 Three depths | ◐ | The plate, the record, then the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | Every record has the same seven lines. Every group has the same anatomy on the rail, with a drawing |
| 15 Dense, compact | ◐ | The plate is one screen and a bit on a wide display. Phones scroll through fifteen cards, none hidden. The rail shows one group at a time |
| 16 Joined up | ◐ | View in the address, one sheet, links to people, reader, Miracles and the Gospels page. Related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning, and each is written under its drawing |
| 19 Art | ◐ | The well, the jar and the small object drawings are a first pass for the owner's eye |
| 20 Colour | ✓ | The Gospels' violet. Words and borders carry state, with colour never alone |
| 21 Approved, not ruled out | ✓ | Type and fine rules. No faces and no people drawn. The paths move slowly and can be paused |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then You |
| T3 Scripture on Scripture | ✓ | The older-Scripture rows, Later Scripture on each record, 1 Peter 1:8 with Thomas, 1 Thessalonians 4:13 with grief |
| T4 Way of reading | ✓ | Who moved first, what was at stake, where the record stops, on each record and in the close |
| T5 Scripture's form | ✓ | Mark 5's fold is kept as a fold, and each conversation is told in its order |
| T6 Voice and ending | ✓ | |
