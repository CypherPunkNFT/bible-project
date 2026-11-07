# Prophets in their times: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job fe2e29510a66457b8cf8499fb876d96f · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/prophets-in-their-times-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/people-of-scripture/prophets-in-their-times/content.md) · Design: [design.md](../../content/studies/people-of-scripture/prophets-in-their-times/design.md)

A Scripture & Theology study in People of Scripture, widened from the draft to the sixteen prophets whose names head books, with Huldah and Elijah. Its one new move: **the opening verses, taken at their word.** Rulers sit in rows with no years, and a prophet touches only the rulers his text names. Six books name no ruler, and the page does not place them. Beneath that, six questions asked of any prophet, and a record of 108 lines where an empty line stays empty.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text, the held Calvin and Jamieson-Fausset-Brown files and the site's prophet list, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date; its fingerprint covers only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The script is a further near-copy of the same build script, because this job may not change the earlier folders.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves with no gap; each quoted phrase is in a reference of its own paragraph, or one paragraph of the part read of its named source, or the named confession list; every ruler touched is in its exact words, those words say he reigned or a second verse does, and every ruler named in an opening is touched or listed as an ancestor; all 108 record lines are declared, so a typo can never read as a silence; each step of Judah's succession is in its verse; names said to appear in no other book are scanned across the whole Berean, and any new or missing hit fails; each link to a person's page is a record in the site's prophet list; page files are the expected ones, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **Not checked by script:** whether a reading is right, whether a silence is real, whether a man of the same name is another man. Two Baptist Faith and Message phrases, from Articles 1 and 6, are not in any file the build reads. They were compared on 2026-10-30 through a web tool that returns extracts, and someone should compare them by eye before release.
- **Refused on purpose:** 21 wrong inputs were each tried and refused, among them an unknown key, a changed verse, a made-up quotation, a quotation not in its source, a missing record line, a ruler given the wrong words, a named ruler left out, a false succession and a false person link. A stale data.js fails `--check`, and a wrong argument exits with an error.
- **By browser against the always-on preview:** at 320, 390, 699, 701, 768, 901 and 1440 wide in both themes: nothing past the right edge, no console errors or failed files. On one wide screen: all six questions, all eighteen sheets opened and closed; a passage opened from a sheet with the way back; closing by button and Escape with focus returned; Back; opening straight on a sheet and on a passage inside a sheet; a wrong address ignored; arrow keys with one tab stop per set; reduced motion; a clear message when data.js is missing.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan, before any code. Decided here:

- **The figure claims less.** Judah and Israel have their own rows, and foreign rulers their own band, in no claimed order. The caption says order within each kingdom, not length or overlap. There are no years, and marks appear only at named rulers.
- **A ruler needs his exact words.** Zephaniah's Hezekiah is an ancestor, not a rung, and the page says so. Daniel's Darius question is avoided: the row is the Darius of Haggai and Zechariah. Ezekiel dates by Jehoiachin's exile, and Huldah's king is cited from 2 Kings 22:3.
- **"First verse" became "opening".** Jeremiah's and Ezekiel's openings run over several verses.
- **Jonah is not placed by Kings.** 2 Kings 14:25 says Jeroboam's reign carried out a word spoken through him. It does not say when he spoke, so he stays with the six.
- **No 108 tab stops.** The record is eighteen name buttons with drawn marks, and each opens one sheet.
- **Every line is declared.** An undeclared line would otherwise have read as a silence.
- **Remembrance has three states.** Named, quoted without the name, or neither. "No later book names" became "no other book gives the name", and for Obadiah and Zephaniah the page says other men bear the name and asserts nothing about them.
- **The study text was corrected.** Micah's response is kept apart from his own book. Calvin and Fausset are labelled as readings of a command. The fulfilment limit is stated as this page's listing rule, under Acts 10:43 and Luke 24:27, so it cannot be read as limiting what Christ said of the prophets.
- **Engineering.** One sheet with the address carrying it, a first tap that points and a named button that opens, verse underlining from precomputed pieces as text nodes, a schema version with a visible message, and the theme script moved out of the page so the "no inline script" check can be strict.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1 and 6 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | Joel's date and Hosea's marriage have both sides shown. Hosea's is labelled as this study's reading |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | Selections say so, and every empty line is declared |
| 9 Hard questions | ◐ | Hosea, Huldah, judgment on nations and Amos's politics are faced. No Baptist writer on Joel's date was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names what is left out |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Prophets in their times mock-up" |
| 12 Own shape | ✓ | The rulers figure and the record with silences |
| 13 Three depths | ◐ | Six questions, then a passage, then the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | The same six lines for each prophet, the same four questions for each act |
| 15 Dense, compact | ◐ | The whole main passage is set first, so some readings are long |
| 16 Joined up | ◐ | View in the address, one sheet, links to people and the timeline. Related studies such as The Twelve have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; each figure's caption says what its shape does not mean |
| 19 Art | ◐ | The gate, jar and cloud are a first pass for the owner's eye |
| 20 Colour | ✓ | The prophets' blue, with History's orange for the two found in Kings, always with the words |
| 21 Approved, not ruled out | ✓ | Type and fine rules, not boxes |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then You |
| T3 Scripture on Scripture | ✓ | The later naming of each prophet, and the New Testament's stated fulfilments |
| T4 Way of reading | ✓ | The six questions, on every prophet and in the close |
| T5 Scripture's form | ✓ | The openings are set in full and marked, as they stand |
| T6 Voice and ending | ✓ | |
