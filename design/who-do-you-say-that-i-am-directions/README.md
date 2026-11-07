# Who do you say that I am? The mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30 by overnight job 3d8e453ae9954a92aa79863ec454781b · **Reshaped to the rewritten text:** 2026-11-07 by job 7402c2d1d4d64f4faa32f551a642245e · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/who-do-you-say-that-i-am-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/jesus-christ/who-do-you-say-that-i-am/content.md) · Design: [design.md](../../content/studies/jesus-christ/who-do-you-say-that-i-am/design.md)

A Scripture & Theology study in the Jesus Christ field, written for someone who does not yet believe. Its one move: **a wall of 47 things people said about Jesus, each in the speaker's own Berean words, with a ruled blank to try them in, and one blank left over for the reader.** The habit it teaches is the text's own: keep the words attached to the person who said them.

## What the reshape changed, and why

The study text was rewritten after the first build. It gained a fourth concept (The Word made flesh), a Habit, a short Words list, and a long new part 05 on how the Son became a man. Its old part 06 ("Written for you") was folded into Thomas. The prose that fed the way-in strip, the three pairs and "The answer that changed" is gone. So:

- **Kept:** the heading and its ring of 47 ticks with one gap; the wall, its eight words and its blank; the verse sheet; the forms of the road, the turn, the council, the voice and Thomas; John's line of answers; the hard questions on the sheet; the close with its ruled blank and the road drawing; every Scripture, held-source and absence check.
- **Changed:** the text's Habit is now the wall's lead. Two of its four questions, "Who is speaking?" and "What exactly do they say?", label the blank's first two fields. The third field is labelled "What came next", not the Habit's "What do they do next?", because it is often someone else's words. John's line moved under Thomas, since John 20:30–31 is now in part 06. An old address that opened "Written for you" (`?reading=written`) now opens Thomas.
- **New for part 05: "Who says it, and to whom."** A ruled ledger with one row per speaker, each in their own verse: John (1:1, then 1:14, with *became* in gold), the angel to Joseph, the angel to Mary, Isaiah to Ahaz with Matthew after him, Paul to the Philippians (with *taking* in gold), Hebrews, and Paul to the Colossians. Under a rule, labelled "Later, the church. Not Scripture": Chalcedon and the Baptist Faith and Message. The ledger ends on the text's own sentence, "They do not explain *how* God and man are one person." Nothing sorts the words into a God column and a man column. Part 05's six subsections open one at a time in place.
- **Dropped:** the way-in strip, the three pairs and the whole "answer that changed" section, with its script [wy-changed.js](js/) deleted. Their prose is no longer in the text. The wall's old captions went with them; what is left is instructions, a type legend and computed counts.
- **The title.** The page now uses the text's own title, *Who do you say that I am?*, with *I am?* in gold italic and "Who Jesus really is" under it. **The first build's claim that "the page's title is the Berean's" is withdrawn:** the text chose the title, and the Berean's wording ("Who do you say I am?") stays where it belongs, in the quoted verse.
- **The focus ring** is replaced by the control's own tint and border, as the owner's standing rules ask.
- **Data schema is now 2**, so a page script and a data file from different builds refuse to run together.

## content.md: the only changes

Four "[check: …]" link notes became real links on this site. Nothing else in the text was touched.

| Where | Note it replaced | Link |
|---|---|---|
| The Selection (line 17) | the site's page on the names of Jesus | site page /study/names ("Names of God", which lists the Son's names) |
| Part 04, the voice from heaven (line 190) | the site's articles on the Trinity | site page /study/theology-articles/the-trinity |
| Part 05, the Word made flesh (line 270) | the site's answer on miracles | site page /apologetics/study/miracles |
| Question "Wasn't He simply a great teacher?" (line 370) | the site's own answer to that question | site page /apologetics/study/jesus |

## How it is built

[build-data.py](build-data.py) reads content.md through [content_parse.py](content_parse.py), with [study_lists.py](study_lists.py) for everything typed by hand, [scripture_text.py](scripture_text.py) for the Berean and the held books, the held Barnes, Jamieson-Fausset-Brown, Maclaren and Boyce files, and the site's copies of the First Vatican Council, the Nicene Creed and the Definition of Chalcedon. It checks them and writes [data.js](data.js). Exit 1 and no change to data.js if any check fails. `--check` runs the same checks, writes nothing, and fails if data.js is stale. `--links` reports whether each linked sibling mock-up exists, and never fails. Run from the Website folder: `python design/who-do-you-say-that-i-am-directions/build-data.py`.

[build_selftest.py](build_selftest.py) tries wrong inputs in memory: `python -B design/who-do-you-say-that-i-am-directions/build_selftest.py`.

## What the checks prove, and what they do not

- **Every line of content.md is placed** by a closed set of rules. A line nothing knows how to place, a key given twice, an unknown tag or source, a curly double quote in prose and older wording in the site's own voice are all refused.
- **Block quotations** are the whole Berean text of their reference, or a whole-sentence start or end of it. Mark 14:61–62 is printed without its opening sentence, "But Jesus remained silent and made no reply."
- **Every quoted phrase** is in the reference its own sentence gives. If its sentence has none, it must be in the block quotation above it in the same part, or on a closed list: a held commentary under its heading and in the note on its verse, a held creed named in its sentence, the confession with its own article, or a short gloss.
- **The wall:** each line is whole words in its one verse, inside the speech credited to its speaker. A verse can hold two speakers; John 7:12 holds both "He is a good man" and "He deceives the people". The passage opened for a line holds both the line and what came next.
- **The words:** each word's lines are found by search and must equal the typed list, and negative controls must not be found (Son of Man, Son of David and son of Joseph for Son of God; kingdom for King; LORD for Lord).
- **The forms:** the second question is the same in all three Gospels; "Six verses" equals the gap from Matthew 16:17 to 16:23; "Listen to Him!" is added on the mountain and not at the river; John's answers run in his book's order. Every ledger quotation is in a passage part 05 prints or names, each gold word is in its row, and each church row is on a checked list. The closing sentence must still be in the text.
- **Numbers:** every number written as a word in the text is on a list that says how it is checked (computed, found in a verse, or plain with a reason). An unlisted one fails the build.
- **What the text says is absent:** "I am God" is in none of the four Gospels, with the same search proved on Isaiah 46:9; John 20:28–31 holds no word of touching, proved on John 20:27; and each "only in one Gospel" claim is searched with a control.
- **Links** stay on this site, and only titles on the study link list may be linked.
- **The page code:** the scripts in the folder equal those index.html loads; no innerHTML; no inline script; nothing left from an earlier page.
- **Refused on purpose: 20 wrong inputs**, each tried in memory after the unchanged inputs pass, each refused for its own stated reason. They include a changed word in a block quotation; a block quotation under the wrong reference; a quotation cited to the wrong verse; a changed word in a quoted phrase; a changed commentary quotation; a link leaving the site; a curly quote in prose; an unchecked number; an unlisted check note; a wall line taken from the narration and credited to a speaker; a word list that differs from its search; the turn's name with the wrong count; a ledger gold word not in its row; a church row in unchecked words; a readout label not in the Habit; a commentary quotation on the wrong verse; the John 10 fault with its known-issue entry removed; a known issue that is no longer true; a check note called verified when nothing in its line was checked; and an absence claim the Bible contradicts.
- **Not checked by script:** who a speaker is in prose quotations (the speaker check covers only the wall), whether a line is in the right group, whether a way of saying it is rightly judged, whether a reading is right, and the text's claim on John 1:18 that no one else in Scripture is called this.

## The text's [check] notes

None show on the page. Each is listed here with what this build did about it. "Verified" means the quotation in the same line passed its held-source check; it does not mean anyone compared it with a printed edition.

| Note in content.md | Result |
|---|---|
| Maclaren's *Expositions*, on Matthew 16 | Verified in the held Maclaren |
| Barnes' *Notes*, on Matthew 16:20 | Verified, in his note on that verse |
| The date of Isaiah 7, about 735–734 BC | **Open.** Nothing here can check it |
| Which commentators hold which reading of Isaiah 7:14; Rashi for Isaiah's wife | **Open** |
| Baptist Faith and Message wording against bfm.sbc.net (two places, both in part 05) | **Open.** The build checks only that each phrase is cited to its article on the list; the site holds no copy of the confession |
| The Definition of Chalcedon against Schaff's *Creeds of Christendom* | Verified against the site's Schaff copy |
| Maclaren's *Expositions*, on John 20 | Verified |
| The Nicene Creed against the site's creeds collection | Verified |
| Jamieson, Fausset and Brown, "wording and verse" | **Mismatch.** The words are right, but the held commentary has them on John 8:58, and the text says "on the stones in John 10" |
| Barnes on John 20:28 | Verified, in his note on that verse |
| Boyce, "probably in his *Abstract of Systematic Theology*" | Verified in the held Abstract |
| *Pastor Aeternus*, chapter 1 | Verified in the site's First Vatican Council copy |
| Maclaren on the rock, "on Matthew 16:18" | Verified in the held Maclaren |
| "confirm wording" (Jamieson, Fausset and Brown on the rock) | Verified, in their note on Matthew 16:18 |

## Faults found in the text (the build keeps them listed until the text is fixed)

1. **The Selection still describes the old shape.** It says "Six scenes were chosen", lists "the Gospel writers' own" answer, and says a seventh reading sits at the centre. The text now has six parts in all: five scenes and the reading on the incarnation. The Gospel writers' own answer was folded into Thomas.
2. **The Jamieson, Fausset and Brown quotation is placed on the wrong chapter**, as in the table above.

The build fails if either is fixed in the text and still listed, so the list cannot go stale.

## For the owner's eye

- **Nothing on the page now shows the Habit's last example,** "a hesitant answer to someone who later gives his life". The first build's "answer that changed" section did, and the text dropped it.
- **Some wall lines come from outside the study's six passages,** for example the tempter, the man born blind and the centurion. The wall is the study's widest view; the readings are its close ones.
- **The Son of God word lights 10 lines from 6 of the 10 groups.** Lines that ask or dare are counted as asking or daring, not as claims.
- **Source register:** the site's [SOURCES.md](../../SOURCES.md) section for this study does not list the Nicene Creed or the Definition of Chalcedon, which the rewritten text now quotes. This job may not edit that file; the run's last step should add them.

## The three plan reviews

Theology and correctness, reliability, and design reviews were run on the reshape plan before any code. What changed because of them:

- **No [check] notes on the page.** One review wanted them shown, two said the page shows only the page; the owner's rule decided it. They are all in the table above.
- **The part 05 form became a ledger by speaker**, not two columns of God-words and man-words. A two-column form would have claimed to divide what the text says it cannot explain.
- **Quotation rule:** a quotation's own sentence decides its reference; only a sentence with no reference may lean on the block quotation above it.
- **Commentary place:** each held commentary quotation must be in the note on the verse the text names, or be on the known-issue list. This found the John 10 fault.
- **Known issues must stay true**, and every number word must be listed, so the build cannot quietly accept a changed text.
- **The study links are a pinned list** that must stay on this site. Whether a sibling mock-up exists is only reported, because other jobs change those folders.
- **The wall's old captions were cut,** so the site does not speak prose the text no longer has.

## Could be confused with

**Encounters with Jesus**, because both are about people meeting Jesus and what they made of Him. It is not the same page: Encounters is a plate of separate meetings, each its own scene. This is one wall of words in type on fine rules, with a blank to try each line in, and no cards. **The signs and works of Jesus** is cords on a brown band. This page has no cords, no band and no cards.

## Tested in a browser

On the always-on preview, 2026-11-07:

- **At 1440, 390 and 320 wide, light and dark:** the page is never wider than the screen and there are no console errors. At 390 and 320 the only items past the edge are the site's own top menu, which scrolls sideways by design, and the road drawing, which its frame clips. The screenshots were looked at: the heading, title, lead and verse sit as planned on a phone.
- **Behaviour:** a verse link opens its sheet and Escape closes it. The ledger has 7 rows and its gold words are *became* and *taking*. Part 05's six subsections open one at a time, and opening a third closes the first. Each group of wall lines is one tab stop, the arrow keys move inside it, and a focused line has no outline. Choosing a line presses it and puts it in the address, and the blank's label reads "What exactly do they say?". The word Son of God lights 10 lines, hides none and draws 10 marks. `?reading=written` opens Thomas with both its forms. Address values that do not exist are ignored without an error. There is nowhere to type on the page.
- **Not tested:** 620, 768 and 1000 wide on this pass (the first build was checked there); 200% zoom; a screen reader; a real phone; the reduced-motion setting on this pass.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Baptist Faith and Message articles quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | On the rock in Matthew 16, the readings are named as their holders' |
| 3 Berean | ✓ | Every verse and link |
| 4 Heading | ✓ | Trail, four concepts in gold, title with its turn in gold italic, lead, ring and motto |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | Readings, named sources and the church's later words are labelled where they come |
| 8 Precision | ◐ | The Selection's count of scenes is wrong in the text (fault 1) |
| 9 Hard questions | ◐ | Five are faced. Baptists read: Maclaren and Boyce. No modern Baptist |
| 10 Complete or says so | ✓ | "A selection, not a census" |
| 11 Sources registered | ◐ | The Nicene Creed and Chalcedon still need adding to SOURCES.md |
| 12 Own shape | ✓ | A wall of words with a blank in it, and a ledger by speaker |
| 13 Three depths | ◐ | The line, the blank, then the passage. No separate page per passage |
| 14 Parallel parts | ✓ | Every reading has the same anatomy |
| 15 Dense, compact | ◐ | The wall is long on a phone. One reading, and one part 05 subsection, shows at a time |
| 16 Joined up | ◐ | View in the address, one sheet, links to site pages and sibling mock-ups. Some related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, a ruled blank, passage again |
| 18 Graphics | ✓ | The ring names itself in words; every line is plain text |
| 19 Art | ◐ | The ring and the road are a first pass for the owner's eye |
| 20 Colour | ✓ | The Gospels' violet, with the site's gold for links and what is lit. Type carries how a line was said |
| 21 Approved, not ruled out | ✓ | Type and fine rules. No faces, no people drawn, no focus ring |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See the browser section |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | What is said, then labelled readings, then Consider and Reflect |
| T3 Scripture on Scripture | ✓ | The part 05 ledger, and the Scripture in the hard questions |
| T4 Way of reading | ✓ | The Habit leads the wall; the close repeats the way of reading |
| T5 Scripture's form | ✓ | Each form comes from its own text |
| T6 Voice and ending | ✓ | |
