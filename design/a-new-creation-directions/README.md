# A new creation: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job f3945eb0614040299a0c288d06168c4c · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/a-new-creation-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/a-new-creation/content.md) · Design: [design.md](../../content/studies/christian-life/a-new-creation/design.md)

A Scripture & Theology study in Living the Christian Life, section 1. Its one new move: **the fold**, a vertical crease down the page with what a letter says is already so on its left, what it tells you to do on its right, and the letter's own joining word on the crease. Fourteen places sit across it. Around them, five letters drawn as lines to show where four of them turn, three commands for the reader to look back from, and six hard questions.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Calvin, Wesley, Boyce, Jamieson-Fausset-Brown and creed files, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date; its fingerprint covers only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Frame and sheet styles are borrowed, read-only, from the Authors and Manuscripts mock-ups.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves with no gap; each quoted phrase is in the reference that belongs to it, or one paragraph of its named source, or the named confession list; every phrase in the figures is in its stated verse as whole words; each fold's phrases lie inside its passage; every mark said to come before a turn does; the count of ten Berean verses with both Behold and new is computed; the six letters, fourteen places, seven joining words of eight, five letters, four Beholds and six questions the page counts are counted; source links are https or a site page; page files are the expected ones, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **Not checked by script:** whether a reading is right, whether a pairing is right, or whether a turn is rightly placed. The commentary files are checked whole, not comment by comment, so a quotation from another comment in the same file would pass. Eight Baptist Faith and Message phrases, from Articles 4, 5 and 7, are not in any file the build reads; the build lists them each run. They were compared on 2026-10-30 through a web tool that returns extracts, and someone should compare them by eye before release.
- **Refused on purpose:** 25 wrong inputs were each tried and refused, among them an unknown key, a changed verse, a made-up quotation, a quotation not in its source, a short source quotation, a quotation under the wrong source, a phrase from outside its passage, a joining word that is only part of a word, a command placed after the turn it is said to precede, a wrong count of Behold verses, a `javascript:` source link and a seventh question. The tests ran in memory, and are not kept in this folder. A stale data.js fails `--check`, and a wrong argument exits with an error.
- **By browser against the always-on preview:** 98 automated checks, all passing on the last run. At 320, 390, 619, 621, 768, 859, 861, 1101 and 1440 wide in both themes: nothing past the right edge, no console errors or failed files, every button at least 44 pixels tall. On one wide screen: a line opening its reading without moving, with focus kept; closing it; the reading restored from the address; a wrong address ignored; arrow keys, Home and End with one tab stop per set; a passage opened from a reading and from a question, with the way back; closing by button, Escape, outside click and two quick clicks, with focus returned; Back; opening straight on a passage; focus and leaving on the lines in sections 02 and 03; reduced motion and pause; a clear message when data.js is missing.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone. The hover behaviour on a touch screen, where the line beneath is hidden and a tap opens the sheet at once, was decided and not tried on a device.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan, before any code. Decided here:

- **A fold, not a hinge.** Nothing swings, and the door picture belongs to Bearing witness.
- **Fourteen places.** Galatians 3:27 and Romans 13:14 were candidates and were dropped in review. Six carry the readings and eight show the pattern is wider.
- **Whose act it is, on each line.** Not every left half is God's act. Saying so stopped the page claiming more than the verses do.
- **Marks are not the controls.** Drawn marks can sit a few pixels apart on a phone, so the references beneath, in text order, are what you press.
- **Quotations bound to their citation.** A phrase is checked against the reference right after it, then the one before it.
- **Engineering.** All six readings are built once and only shown or hidden, so links survive the sheet and Back; the line's position is measured and restored after opening; hover and focus use one path and revert on leaving; a close that loses its Back has a timeout; a visible notice if a script fails, with each section in its own file so the rest of the page still draws.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 4, 5 and 7 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | Romans 7 is shown from three writers, and the page does not choose |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | The selection note says what is left out and what the checks cannot prove |
| 9 Hard questions | ◐ | Six faced. On forgiveness and trust no writer was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "A new creation mock-up" |
| 12 Own shape | ✓ | The fold and the lines |
| 13 Three depths | ◐ | The line, the reading, the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | One line form for all fourteen, one reading form, the same lines for each letter |
| 15 Dense, compact | ✓ | Readings stay closed until chosen; the first is open |
| 16 Joined up | ◐ | View in the address, one sheet, a link back to the field. Related studies are partly mock-ups only, and the page says which have no page yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; the notes say what each figure does not mean |
| 19 Art | ◐ | The garment, heap and thread are a first pass for the owner's eye |
| 20 Colour | ✓ | The letters' colour for wash and marks, always with words |
| 21 Approved, not ruled out | ✓ | Type, fine rules and a single fold, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | 2 Corinthians 5:17 opens the page, and 5:14–21 closes it |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then Reflect · your response |
| T3 Scripture on Scripture | ✓ | The fourteen places, the Beholds and the look-backs read one another |
| T4 Way of reading | ✓ | Look back for what is already so: taught on the fold, tried in section 04, stated in the close |
| T5 Scripture's form | ✓ | The fold keeps the letters' own words, and marks where the command comes first |
| T6 Voice and ending | ✓ | |
