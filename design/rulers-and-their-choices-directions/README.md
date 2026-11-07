# Rulers and their choices: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job cea387cdfeb349f8a791f9ea89a1f161 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/rulers-and-their-choices-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/people-of-scripture/rulers-and-their-choices/content.md) · Design: [design.md](../../content/studies/people-of-scripture/rulers-and-their-choices/design.md)

A Scripture & Theology study in People of Scripture, widened from the draft with the Chronicler's retelling and the Persian court of Esther, as [the to-do list](../../../Pages/Topics/TODO.md) asked. Its one new move: **two beams and a line let down for every ruler.** Each of the 39 rulers of Israel and Judah in Kings hangs on a string as long as the reign the text states, ending in a shape for the writer's verdict, with threads back to the two names that come back most. Beneath that, six readings, each in a form of its own, then Kings beside Chronicles, three royal letters, and six hard questions.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held Jamieson-Fausset-Brown and Matthew Henry files, checks them, and writes [data.js](data.js). Change the words in content.md and run the script. `--check` runs the same checks and fails if data.js is out of date. Counts in content.md are named placeholders, such as `{{tied}}`, filled from what the build computed, and a count typed in by hand near a ruler fails the build.

Only one direction was built, as with the earlier mock-ups, because this is an existing draft. The script is a further near-copy of the same build script, because this job may not change the earlier folders. Extract a shared one when the real pages are built.

The stylesheet [css/rc.css](css/rc.css) was assembled in the job's workspace from the shared frame and this page's own rules. That small assembler was not kept in this folder, so edit rc.css directly from here on.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves; each quoted phrase is in a reference of its own paragraph, or the anchored note of its named commentary, or the named confession list.
- **By script, on the rulers:** 19 and 20 rulers, in the order Kings tells them. The reign verse names the ruler and holds the stated length. The verdict verse falls inside that ruler's own account, and its words are in it as whole words. The shape comes from those words, not from a hand entry. Each thread's words name Jeroboam or David, apart from Nadab, whose line says "his father". A line that reads as a contrast cannot be marked as a likeness, or the other way round. Every verse in Kings with verdict wording is either on a ruler's record or on a named list with a reason, a control verse must be found, and a listed verse the scan no longer finds fails.
- **By script, on the rest:** a stop said to be told by one account fails if its words are in the other. No verse of Esther may hold God, LORD or Lord, with a control that the same search finds God in Nehemiah. Page files are the expected ones, with one `innerHTML`, for the fixed drawings, and no inline script or handler.
- **Not checked by script:** whether a reading is right; whether a later verse cited is about that ruler; whether two verses tell the same event; whether a stop was a fair one to choose. Much of the page's most interpretive wording, the forks, the Who paid and What came after lists, the stops and the letter rows, sits in study_lists.py and not in content.md. The script proves only that those phrases are in their verses, so it needs reading by a person.
- **The Baptist Faith and Message phrases** were compared by script on 2026-10-30 against the printable PDF linked from the confession's page (sha256 92eb2d8868db03271a40d1575eb50b0313c81d56c882daad5fbced5ba0cc3ab0). The PDF is not kept, so the build checks only that each phrase is on its list and used, and does not repeat the compare.
- **Refused on purpose:** 17 wrong inputs were each tried in memory and refused, among them a wrong reign length, a verdict outside the ruler's account, words not in the verse, a likeness marked as a contrast, a dropped ruler, a verse left unaccounted for, a stale list entry, words said to be in one account that are in both, a typed count, an altered quotation, a King James phrase, and God added to Esther. That test script is in the job's workspace, not here.
- **By browser against the always-on preview:** at 320, 390, 620, 768, 951, 1100 and 1440 wide in both themes: nothing past the right edge and no console errors. 34 behaviour checks: 39 buttons and 21 threads, strings that follow the stated reign, arrow keys with one tab stop per beam, a record opened, a verse opened inside it with the way back, Escape with focus returned, Back, readings and kings in the address, a shared address restoring the view, a wrong address ignored and never made into markup, reduced motion, the pause control, and phone rows that carry the threads' words.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone.
- **Known gap:** a reviewer asked for the build's short hash to be printed on the page, so a cached old data.js could be noticed. It is not printed. The fingerprints are inside data.js and `--check` uses them.

## The three plan reviews

Security and correctness, reliability, and platform reviews were run on the plan and the text, before any code. Decided here:

- **The verdicts come from the verse, not from a hand entry.** The first plan said "did evil" of everyone. Kings says "Judah did evil" of Rehoboam's reign, Abijam "walked in all the sins", and Elah's line comes at his death and names his father. These have their real words and a note saying so. Zimri's and Jeroboam's wording is read as it stands. Athaliah's six years are read from Joash's years in hiding, and the page says that. Jehu's two lines are a verse apart.
- **The scan was widened and may not hide a miss.** The first pattern would have missed Jehu's "in My sight", the only ruler on whom both are said.
- **"The measure" claimed too much.** Verdicts also name Asa, Joash, the house of Ahab and others. The page says two names come back most often, draws threads for those two only, and shows the others on the ruler's record. It says Jeroboam and David do different work.
- **The beams claim less.** The caption says order within each kingdom, not time, and that the two beams do not line up. 2 Kings 15:5 is the overlap example. Six reigns under two years are marked as drawn longer than scale.
- **The line does not sway.** A plumb line is true only when still, and swaying is on the standard's ruled-out list. It lets itself down and draws back, with a pause control and a still frame for reduced motion.
- **A fork only where the text names two ways.** Solomon and Rehoboam have forks. Jeroboam has three voices, Ahab four claims on one plot, David Nathan's story and whose story it was, and Manasseh two accounts side by side.
- **The Try section was cut.** It was the three-question frame a third time, and its answers were not in content.md. Hezekiah, Josiah and Jehu are reachable on the beams. Manasseh's thread in Kings beside Chronicles gave way to Abijah's, because Manasseh has a reading of his own. David and Solomon remain there, so David recurs more than the reviewer wanted.
- **The text was corrected.** The writer "notes the exception" in 1 Kings 15:5 and does not ask a question. Rehoboam's blame cites 1 Kings 12 and 2 Chronicles 10, with Article 2 for providence. The census question shows Jamieson-Fausset-Brown and Henry each by name and follows neither. Bathsheba is named among those who paid, and the page says plainly that the child died. An unattributed confession line in the invitation is now credited. "Perhaps someone in your own family" came out of Manasseh's reflection. Esther 8:11's permission to kill "including women and children" is stated and not explained away.
- **Engineering.** One sheet holds three kinds of content (record, passage, question), each in the address. Threads are drawn in the beam's own proportions, so nothing has to be measured on resize. Beams become rows at 950 wide and below, because 20 buttons cannot be tapped across a narrow screen. Shared files were changed last, by anchored edits.

Not taken up: a first tap that points and a second that opens. A tap opens the record, because the row already shows the words. A reviewer warned that 39 phone rows sit close to the sibling study's rows of rulers. They hang as cords from a spine with the verdict's words, and the owner should judge whether that is different enough.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1, 2, 4, 15 and 17 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | Two commentaries set side by side on three hard questions, and neither followed where the text is silent |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means and does not |
| 7 Claims marked | ✓ | "This study reads", named sources and flagged notes are labelled where they come |
| 8 Precision | ✓ | All 39 are drawn, the selection says what is left out, and verdict wording that differs is labelled |
| 9 Hard questions | ◐ | Six are faced. No Baptist commentary on them was read, and the page says so |
| 10 Complete or says so | ✓ | The selection note names Tibni, David and Solomon as not on a beam |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Rulers and their choices mock-up" |
| 12 Own shape | ✓ | The beams and strings, unlike the sibling's rows and record, with the caveat above about phones |
| 13 Three depths | ◐ | The beam, the record, then the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ◐ | The same three questions on each reading and the same six hands on each letter. The rail has no miniatures |
| 15 Dense, compact | ◐ | Phones scroll through 39 rows, none hidden. The rail and the king switch show one panel at a time |
| 16 Joined up | ◐ | View in the address, one sheet, links to people, reader, the rulers timeline and Prophets in their times. Related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; each caption says what the shape does not mean |
| 19 Art | ◐ | The crown and scroll, the land, the seal and the far land are a first pass for the owner's eye |
| 20 Colour | ✓ | History's orange, because Kings and Chronicles are in that section. Shape comes first, with colour never alone |
| 21 Approved, not ruled out | ✓ | Type and fine rules. The line does not sway |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then You |
| T3 Scripture on Scripture | ✓ | Deuteronomy 17 first, Kings beside Chronicles, the New Testament on rulers and on the King who serves |
| T4 Way of reading | ✓ | Who says so, who paid, what came after, on each reading and in the close |
| T5 Scripture's form | ✓ | Narrative is told in order, and Kings and Chronicles each in their own |
| T6 Voice and ending | ✓ | |
