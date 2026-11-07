# Who do you say I am? The mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 3d8e453ae9954a92aa79863ec454781b · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/who-do-you-say-that-i-am-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/jesus-christ/who-do-you-say-that-i-am/content.md) · Design: [design.md](../../content/studies/jesus-christ/who-do-you-say-that-i-am/design.md)

A Scripture & Theology study in the Jesus Christ field, written for someone who does not yet believe. Its one new move: **a wall of 47 things people said about Jesus, each in the speaker's own Berean words, with a ruled blank to try them in, and one blank left over for the reader.** It teaches a reader that having the right words is not the same as trusting Him.

The page's title is the Berean's wording, *Who do you say I am?* The master list, the folder and the hub keep the listed title, *Who do you say that I am*, until the owner decides.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text, the held Barnes, Jamieson-Fausset-Brown, Maclaren and Boyce files and the site's copy of the First Vatican Council, checks them and writes [data.js](data.js). Exit 1 and no change to data.js if any check fails. `--check` runs the same checks, writes nothing and fails if data.js is stale. Run it from the Website folder: `python design/who-do-you-say-that-i-am-directions/build-data.py`.

The script is a further near-copy of the same build script, because this job may not change the earlier folders. Extract a shared one when the real pages are built.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section, and a key given twice is refused; the block quotation is word for word the Berean at its reference; every reference resolves; each quoted phrase is in the reference that cites it in its own sentence, or in one paragraph of its named held source near its anchor, or on the confession list with its own article. A reference in another sentence proves nothing. No older wording in the site's own voice.
- **By script, on the wall:** each answer's words are whole words in their one verse, and inside the speech credited to that speaker, because a verse can hold two speakers (John 7:12 holds both "He is a good man" and "He deceives the people"). Ids are unique; the ways of saying a line are a closed list; no group is empty; the passage opened for a line holds both the line and what came next, and what came next is not earlier than the line.
- **By script, on the words:** each word's lines are found by searching the lines, and must equal the list typed for it, and negative controls must not be found (Son of Man, Son of David and son of Joseph for Son of God; kingdom for King; LORD for Lord). The page says one King line states it, each prophet line is respectful, and the Holy One lines are the same words from two groups; each of these is checked.
- **By script, on the forms:** the second question is the same in Matthew 16:15, Mark 8:29 and Luke 9:20; John's line runs in the order of his book; "Listen to Him!" is in Matthew 17:5 and not in Matthew 3:17; the name "Six verses" equals the gap computed from Matthew 16:17 to 16:23. Every count in the prose is named and computed. A count typed beside a counted noun fails.
- **By script, on what is said to be absent:** the exact sentence "I am God" is in none of the four Gospels, searched verse by verse, with the same search proved on Isaiah 46:9. John 20:28–31 holds no word of touching, with the same search proved on John 20:27.
- **Not checked by script:** who a speaker is, whether a line is in the right group, whether a way of saying it is rightly judged, whether a reading is right, whether an older Scripture rightly belongs beside a later one. The sorting and most interpretive wording need a person's reading.
- **The Baptist Faith and Message phrases** were compared on 2026-10-30 against what a web tool returned from https://bfm.sbc.net/bfm2000/, because that page refused a direct download. The build proves only that each phrase is cited to the article on its list. Compare by eye before release.
- **Refused on purpose:** 37 wrong inputs were each tried in memory and refused, among them a line credited to the other speaker in its verse, a passage that does not hold its line, a word list that differs from the search, a changed block quote, a citation across a sentence break, a changed commentary quotation, a false absence and a search that could not find its own control. The test is in the job's workspace, as it changes nothing here.
- **By browser against the always-on preview:** at 320, 390, 620, 768, 1000 and 1440 wide in both themes, on the wall, each of the six readings, a question and a passage: nothing past the right edge and no console errors. Behaviour checks: pointing previews and writes nothing to the address; leaving restores what was chosen; a click, a tap or Enter chooses; a second choosing clears it; one tab stop for each group, with the arrow keys inside; a word lights its lines, hides none and draws its rule; one reading open at a time and none by default; the sheet, Back, Escape and focus returning; values in the address that do not exist are ignored; a reload focuses the chosen line; no input anywhere on the page; the moving dot pauses, and stops under reduced motion.
- **Not tested:** 200% zoom, a screen reader, a real phone.

## The three plan reviews

Theology and correctness, reliability, and platform and design reviews were run on the plan and the text before any code. What changed because of them:

- **The hero became a data graphic.** The planned road drawing moved to the close. The hero is a ring with one tick per line and one gap, around a ruled blank that never changes.
- **The blank does not cycle through answers.** It stays empty until a reader points at a line, so the page never seems to answer for them.
- **Pointing previews and choosing keeps.** Only choosing writes to the address, so a stray mouse cannot change a link someone shares.
- **The readout is a bare ruled line,** with one lasting Read it button and height held for it, so the wall does not jump. On a phone it docks at the foot of the screen.
- **The way a line was said is in the type,** upright, italic or small capitals, and never only in colour. A question is never counted as a claim.
- **Six pairs became three,** set under the wall, so they do not repeat it. "The answer that changed" became its own section, and the older Scripture rows say who draws each link and are not folded away.
- **The speech check was added,** after a reviewer showed that a line could be in the right verse and in the wrong mouth.
- **The text's claims were tightened:** the page does not lean on "I am" in Mark 14:62; it says the link from John 8:58 to Exodus 3:14 is one some readers hear; it does not say Thomas touched anything, and checks that; it keeps "The Jews" in John 5:16 to the opponents in that dispute; it gives Catholic teaching on the rock in the council's words, and says that Baptists are not bound to one reading of it; it says John wrote to persuade and treats that as a fair objection.
- **Engineering:** the chosen answer stays out of the sheet's keys, so closing the sheet keeps it; that answer's button counts as a click inside when deciding whether to close; a following reference does not count across a sentence break.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1, 2, 3, 4, 6 and 17 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | On the rock in Matthew 16, four readings are named as their holders' |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources and care notes are labelled where they come. The older Scripture says who draws each link |
| 8 Precision | ✓ | The selection says what was chosen and why, that it does not count how often a thing was said, and that the grouping is judgment |
| 9 Hard questions | ◐ | Five are faced. Baptists read: Maclaren at two passages and Boyce at one. No modern Baptist |
| 10 Complete or says so | ✓ | "A selection, not a census" |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "Who do you say I am? mock-up" |
| 12 Own shape | ✓ | A wall of words with a blank in it |
| 13 Three depths | ◐ | The line, the blank, then the passage. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | Every reading has the same anatomy, though it is ruled and has no card |
| 15 Dense, compact | ◐ | The wall is long on a phone, with one column of 47 lines. One reading shows at a time |
| 16 Joined up | ◐ | View in the address, one sheet, links to the reader and to two sibling mock-ups. Some related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, a blank line, passage again |
| 18 Graphics | ✓ | The ring names itself in words, and every line is plain text |
| 19 Art | ◐ | The ring and the road are a first pass for the owner's eye |
| 20 Colour | ✓ | The Gospels' violet, with the site's gold for links and what is lit. Type carries how a line was said |
| 21 Approved, not ruled out | ✓ | Type and fine rules. No faces and no people drawn. The dot moves slowly and can be paused |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | What is said, then labelled readings, then Consider and Reflect |
| T3 Scripture on Scripture | ✓ | Section 03, and the Scripture in the hard questions |
| T4 Way of reading | ✓ | The questions in the close |
| T5 Scripture's form | ✓ | The forms come from each text |
| T6 Voice and ending | ✓ | |
