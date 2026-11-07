# The church and its calling: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by job e00c9814c2db4818a81f0de8d18a3766 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-church-and-its-calling-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/the-church-and-its-calling/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/the-church-and-its-calling/design.md)

A Scripture & Theology study in God & Christian Faith, section 4. Its one new move: **ask who was in the room, before asking what a line says to you**. It starts from one English word in four sizes: every use of church or churches in the Berean New Testament on four rings. Six readings each open with who was listening. Ten baptisms in Acts run down a line of water. Six phrases of 1 Peter 2:9–10 stand beside older verses. Three lines often read alone are tried in their rooms, and six hard questions are faced.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Barnes, Jamieson-Fausset-Brown and creed files, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date. Its fingerprint covers only this study's own inputs, so another job editing a shared frame file cannot make this page read as stale. That also means a change to a shared frame file is not detected here.

Only one direction was built, not the three or four the standard asks of a brand-new study: this is an existing draft, as with the earlier mock-ups. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Frame and sheet styles are borrowed, read-only, from the Authors and Manuscripts mock-ups.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves with no gap; each quoted phrase is in the reference next to it, or one paragraph of its named source, or the named confession list; each commentary quotation falls in the note of the verse it is cited to; the word list equals exactly a scan of the Berean New Testament, use by use and in Bible order; a use on the house ring is a church meeting at a house; a use on the many-places ring is the plural or on a named list of three; every verse in Acts with baptize or baptism is a baptism row or on the named list of twelve; each room, baptism and older-verse phrase is in its verse as whole words; a claim of the same words is tested; the page's stated counts are computed; source links are https or a site page; page files are the expected ones, with one `innerHTML` for the fixed drawings and no inline script or handler.
- **The confession:** the ten Baptist Faith and Message phrases are in no file this build reads. Each was compared by script on 2026-10-30 against the printable text linked from the confession's own page (sha256 in [study_lists.py](study_lists.py)), adopted 2000 and amended 2023. All ten matched exactly. The file is the Southern Baptist Convention's, so it is not kept here, and the build does not repeat this compare. What it does check is that the page's quoted phrase is on the list.
- **Not checked by script:** whether a ring is right, whether a reading is right, whether a pairing is right, or whether a "who was in the room" note is right. The rings count one English word; "assembly" and "congregation" are not counted, and the page says so. No Greek was compared.
- **Refused on purpose:** 25 wrong inputs were each tried in memory or on a temporary copy and refused: a misquoted verse, a changed block quotation, a misquoted source, a quotation from the wrong note, a commentary phrase not in the commentary, a reference that does not exist, an unknown key, heading and source tag, an altered confession phrase, a verse dropped from the word list, a use missing from a two-use verse, a singular use on the many-places ring, a house-ring use with no house, the list out of order, a baptism phrase and a room phrase not in their verses, an Acts verse left unaccounted for, a false claim of the same words, an http link, a script link, readings out of order, `innerHTML` outside the one place allowed, an inline script, and a page file missing. The tests are not kept in this folder.
- **By browser against the always-on preview:** all 53 automated checks passing on the last run. At 320, 390, 620, 768, 1100 and 1440 wide, with 390 and 1440 in both themes: nothing in the page past the right edge (the shared menu scrolls sideways inside its own strip, as on other mock-ups), no console errors or failed files, every button at least 44 pixels tall. Also: 111 points with one tab stop; arrow keys walking them in Bible order; a point opening its verse and focus returning to it; ring buttons with their lists; a drawing opening its reading; arrow keys and Enter; Back closing the sheet and keeping the reading; a phrase opening its older verse; answers starting closed; a passage opened from a question having a way back; closing by button, Escape and outside click; a wrong address ignored; opening straight from a link; a shared address restoring all views; reduced motion and pause; a phone-sized touch screen; one clear message when data.js is missing.
- **Looked at by eye:** screenshots at 1440 in both themes and at 390 and 320 in light.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone. The small references in the ring list are 30 pixels tall with gaps, below the 44 used for buttons.

## The three plan reviews

Security and correctness, reliability, and principal-engineer reviews were run on the plan, before any code. Decided here:

- **Text fixes.** Six points in the text were weakened or corrected: "eight of ten" was wrong and is computed as nine of ten with Lydia's household flagged; "no infant" became "no infant is named, and none is ruled out"; Baptist readings are labelled as Baptist on Acts 2:38 and 1 Peter 3:21; the household question no longer leans on verses that say nothing; "Baptists come to meet the Lord" became a report that Baptists differ; Luther's and Westminster's own words replaced summaries.
- **Tighter checks.** A commentary quotation must sit in its own verse's note. A many-places use must be plural or named. Counts stated in words are computed.
- **Phone path.** The rings cannot be tapped accurately at phone width, so the ring buttons and written list are the full path, and the drawing adds the shape.
- **Engineering.** One tab stop for the points. Fixed drawings only as markup. Each part of the page is skipped safely when the core could not start, with one notice.
- **Late correction, by eye on the built page.** "One sentence gives six names" was wrong twice: 1 Peter 2:9–10 is two sentences and two of the six are not names. The section is now "Six phrases". "Where Scripture used it first" became "an older verse", since Isaiah is not the earliest place.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 4, 6, 7 and 11 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ◐ | Shown without choosing on the Lord's nearness, Israel and the church, and 1 Corinthians 14:34. On baptism, the Supper and pastors the page holds with the confession and shows others as theirs |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources, close calls and flagged notes are labelled where they come |
| 8 Precision | ✓ | The selection note and the care note under the rings say what is left out and what the checks cannot prove |
| 9 Hard questions | ◐ | Six faced. On "recognizing the body" no writer holding this study's second reading was read, and other churches' reasons for ordaining women are not surveyed, and the page says both |
| 10 Complete or says so | ✓ | The list of uses and the baptisms are complete by scan, and what is not counted is named |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "The church and its calling mock-up" |
| 12 Own shape | ✓ | The rings and the line of water |
| 13 Three depths | ◐ | The ring, the reading, the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | One reading form with its room plate, one baptism form, one phrase form |
| 15 Dense, compact | ◐ | One reading shows at a time and the answers stay closed, but the ten baptisms make a long phone page |
| 16 Joined up | ◐ | View in the address, one sheet, a link back to the field. Related studies are mock-ups only, and the page says the Holy Spirit study has no page yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning. The rings have a full written list, and the water is text in a list |
| 19 Art | ◐ | The stones and six small drawings are a first pass for the owner's eye, captioned as this study's |
| 20 Colour | ✓ | One page colour. Section colours on the points, with a legend and with the written list as well |
| 21 Approved, not ruled out | ✓ | Type, fine rules, one tinted plate |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | 1 Peter 2:4–5 opens the page, and 1 Peter 2:4–10 closes it |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then Reflect · your response |
| T3 Scripture on Scripture | ✓ | The rings, the baptisms and the older verses, each saying how close the wording is |
| T4 Way of reading | ✓ | Who was in the room: taught in the plates, tried in section 05, stated in the close |
| T5 Scripture's form | ✓ | Letters are read as letters to rooms. Acts is read as narrative, with what it does not say marked |
| T6 Voice and ending | ✓ | |

## Not resolved

The frame files borrowed from other mock-ups are not in the fingerprint, so a change there is not detected here. Room details inside a reading are not in the address, because only the chosen reading is. The address keeps a ring, a reading and a phrase, so a shared link shows the same views.
