# Bearing witness: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 5fbd7f8fd8f34256b2e15a1941d07d91 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/bearing-witness-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/bearing-witness/content.md) · Design: [design.md](../../content/studies/christian-life/bearing-witness/design.md)

A Scripture & Theology study in Living the Christian Life, section 5, "Before a watching world". Its one new move: **the threshold**, a drawn doorway with God on the lintel, the one who speaks on the near side and the one before them beyond, and ten passages along the sill, each sorted in its own words. Around it, Colossians 4:2–6 as the map of six readings in a wall of doors, five New Testament doors, five hard questions, and three passages for the reader to sort.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Calvin, Jamieson-Fausset-Brown and creed files, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date; its fingerprint covers only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Frame and sheet styles are borrowed, read-only, from the Authors and Manuscripts mock-ups.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves with no gap; each quoted phrase is in a reference of its own paragraph, or one paragraph of its named source, or the named confession list; every phrase in the figures is in its verse as whole words, in its passage, and in one place only; the words the page says are not in Colossians 4:2–6 are confirmed absent; the eight letters and five questions the page counts are counted; source links are https or a site page; page files are the expected ones, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **Not checked by script:** whether a reading is right, or a phrase rightly sorted. The commentary files are checked whole, not comment by comment, so a quotation from another comment in the same file would pass. Three Baptist Faith and Message phrases, from Articles 5 and 11, are not in any file the build reads; the build lists them each run. They were compared on 2026-10-30 through a web tool that returns extracts, and someone should compare them by eye before release.
- **Refused on purpose:** 25 wrong inputs were each tried and refused, among them an unknown key, a changed verse, a made-up quotation, a quotation not in its source, a short source quotation, a phrase in two places, a phrase from outside its passage, a word falsely said to be absent, a `javascript:` source link and a sixth question. A stale data.js fails `--check`, and a wrong argument exits with an error.
- **By browser against the always-on preview:** 148 automated checks, all passing on the last run. At 320, 390, 699, 701, 768, 901, 1101 and 1440 wide in both themes: nothing past the right edge, no console errors or failed files. On one wide screen: all six doors, all nine phrases, all ten passages, all five questions; a passage opened from a question with the way back; closing by button, Escape, outside click and two quick clicks, with focus returned; Back, without redrawing the reading; opening straight on a question and on a passage inside one; a wrong address ignored; arrow keys with one tab stop per set; reduced motion and pause; a clear message when data.js is missing. These checks found two real faults, both fixed: the first phrase click was lost because the figure redrew under the pointer, and focus was lost after closing the sheet.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan, before any code. Decided here:

- **Order follows Colossians.** Prayer, courage, conduct, speech, ready, gentleness, so the map is the paragraph.
- **No pills on the figure.** A passage is chosen on the sill. An empty place says "not named"; requests and hopes are marked so they do not read as promises.
- **The Philippi section and two questions were cut.** The page keeps to its habit.
- **"Not promised" is not a fourth place.** The note under the figure names what the sort cannot hold.
- **Engineering.** The outside-click rule exempts question buttons; a second close while Back is on its way is ignored; one list of what the sheet can hold; no reading redraw on Back when the door is unchanged; roving keys on phrases, doors and sill; marks kept in text order as text nodes; a visible message if the frame or data is missing.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 4, 5, 11 and 17 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | Election's details among Baptists are shown and not chosen |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | The selection note and the figure's limit say what is left out |
| 9 Hard questions | ◐ | Five faced. No Baptist commentator on these verses was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Bearing witness mock-up" |
| 12 Own shape | ✓ | The wall of doors and the threshold |
| 13 Three depths | ◐ | The wall, the reading, the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | One door card, one reading form, the same lines for each of the five doors |
| 15 Dense, compact | ◐ | The threshold's drawing leaves some open space beside short lists |
| 16 Joined up | ◐ | View in the address, one sheet, a link back to the field. Related studies mostly have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; the figure's note says what its shape does not mean |
| 19 Art | ◐ | The door, chain and arches are a first pass for the owner's eye |
| 20 Colour | ✓ | The letters' colour for light and marks, always with words |
| 21 Approved, not ruled out | ✓ | Type, fine rules and arches, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | Colossians 4:2–6 opens section 01 and closes the page |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then Your response |
| T3 Scripture on Scripture | ✓ | The ten passages and five doors read one another |
| T4 Way of reading | ✓ | Whose part is whose, taught in the figure, tried in section 05, stated in the close |
| T5 Scripture's form | ✓ | Colossians 4 is set whole, and its order is kept |
| T6 Voice and ending | ✓ | |
