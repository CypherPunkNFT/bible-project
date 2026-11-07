# The kingdom he announced: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, unattended, by design job ef94a06ca6ee4bd0859660ce056f2745 (study-page design run, step 16) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-kingdom-he-announced-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/jesus-christ/the-kingdom-he-announced/content.md) · Design: [design.md](../../content/studies/jesus-christ/the-kingdom-he-announced/design.md) · Run brief: [DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study in the Jesus Christ field, study 15. Its one new move: **listen for the tense.** Before deciding what a kingdom saying means, hear whether Jesus says the kingdom *is near*, *has come upon you*, *is in your midst* or *will be like*. The page sets those verbs out as a grammar book sets out a verb, one line per part, and each part carries its line.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and [study_lists.py](study_lists.py) (this page's own lists), checks them against the site's Berean text and the held text of the Baptist Faith and Message 2000, and writes [data.js](data.js). [scripture_text.py](scripture_text.py) is an unchanged copy of the model's Berean reader (same sha256 as The good news copy, 9f674d78…). Run from the Website folder:

- `python design/the-kingdom-he-announced-directions/build-data.py` builds and writes data.js (written to a temporary file, then moved into place).
- `--check` runs every check and fails if data.js is not exactly what the inputs build now. It writes nothing. data.js records a fingerprint of its four inputs.
- `--selftest` feeds wrong inputs in memory ([build_selftest.py](build_selftest.py)) and fails unless every one is refused. It writes nothing.

Unlike the model, this build writes **only** data.js, beside itself. Nothing under `src/` was touched, and the script turns off Python's bytecode cache so it leaves no `__pycache__` in the shared folder tree.

The page is [index.html](index.html), [js/kh.js](js/kh.js) (the page), [js/art.js](js/art.js) (the fixed line drawings) and [css/kh.css](css/kh.css). The frame (site header, footer, theme switch) is borrowed by link from the Authors, Manuscripts and Who do you say that I am mock-ups, as in the model; if those files change, this page's frame changes with them. The parser is this page's own, because this study's text has its own line kinds: a subtitle with a "[proposed: …]" note, a hook per part, a "Text:" line per question, notes marked [read], [open], [other], [care] and [source:…], a four-line list in part 02, main readings with whole chapters ("with Psalms 93, 97 and 99, and Daniel 2 and 7"), and fourteen "[check: …]" notes. One direction was built, because the text already existed.

**content.md was not changed.** Its one link note, "[check: name the site's apologetics answer on this question, if one exists, and link it here]" (question 3), has no answer to link to: none of the site's apologetics answers (src/generated/apologetics.ts, searched 2026-11-07) deals with whether Jesus expected the end at once. It stays a note. The other thirteen are notes to check facts, not links, so the brief does not allow turning them into anything.

## The page

- **Opening.** The standard heading: trail (Study / Jesus Christ / The kingdom he announced), the concepts in gold capitals (Reign · Nearness · Seed · Delay), the title with *he announced* as its gold italic turn, the proposed subtitle, the lead, and Mark 1:15 in full. Beside it, in a faint circle and dotted orbit: a mustard tree grown from one seed, birds in its branches, and a closed arched door with an oil lamp burning at its threshold. The motto beneath in two lines. No person is drawn. Four computed figures, each with what it means: 7 passages walked, 8 kingdom sayings set by tense on 6 lines, 12 of Matthew 13's 58 verses naming the kingdom, 29 verses printed in full (distinct verses; Mark 1:14–15 counted once though printed twice).
- **00 The kingdom in its tenses.** The frame paragraph, then a table of six lines, one per part: the part and this page's name for the line (Always, Come close, Like a seed, Already here, Received, Still to come), the verb as a large italic button, the clause it stands in with its verse, and how this study reads it. Choosing a verb prints its verse beneath with the verb marked (underlined and coloured, so colour is not the only carrier), and puts `?tense=` in the address. Nothing is chosen at first. "Is in your midst" carries a gold "Readers differ" note, because the study says the Greek can also be read "inside you". The column of names is headed "How this study reads it", and the note under the table says the names are reading aids, not words the verses use.
- **01–06 The parts.** Number, small drawing, the part's saying in violet italic with the rest of its title, the hook, the main readings (walked first, then "with" and the quoted chapters), and a tag linking back to its line in the table. The reading runs in one column; "This study reads", "Readers differ" and "Another reading" stand in the margin beside the paragraph they follow (below it under 1100 pixels wide). "With care" notes stay in the main column in gold. Outside views ([source:…]) are labelled by name with a dashed rule. Consider and Reflect close each part.
- **Part 03, Matthew 13 in order.** The seven parables placed by verse along the chapter, in three rows taken from the part's own question (hearing; growth or worth; the end), with the turn at 13:36 into the house and the chapter's end in "his hometown" (13:54 says hometown; the page does not name Nazareth). A ring marks the three Jesus explains himself. Each parable is a button in chapter order; pointing or focusing writes its opening line into a fixed-height line beneath (so nothing moves), choosing opens the verses. Under 900 pixels it is a plain list in the same order.
- **Questions readers ask.** Four questions on one dotted thread (wide screens) with each answer opening in place. The fourth, on children who die, begins with the crisis lines and is open from the start, so care is never folded away. The third carries "Waiting, in Jesus' own stories": three phrases, each checked in its verse (Matthew 13:30, 25:5, 25:19).
- **Close.** The way of reading, its three asks set against *Has come · Is near · Will be like*, the invitation, the question, "Read the passage again before you answer", Mark 1:14–15 in full, the seed and door drawn again, a closed list "Notes still to be checked (14)", the sources, and a link back to Jesus Christ.
- **Every reference** opens its verses in a sheet, in the Berean.

**Could be confused with:** [The good news](../the-good-news-directions/README.md), whose frame, verse sheet and questions-that-open it shares by behaviour. It is not the same page: The good news is a ledger of news against response and a road of six parts on a sticky rail; this page is a table of verbs, a reading with a study-Bible margin, and a chapter plot. Within the Jesus Christ field, Encounters with Jesus is a plate of fifteen meetings, Who do you say that I am a wall of answers, and The signs and works of Jesus a set of roads; none uses a verb table or a margin. [The hope to come horizon](../the-hope-to-come-horizon/) draws the future as a landscape; this page draws no timeline of the future at all.

## What the checks prove, and what they do not

**Recorded run, 2026-11-07:** `python design/the-kingdom-he-announced-directions/build-data.py` printed "build-data: all checks pass; wrote data.js (124,207 bytes)"; `--check` printed "build-data: all checks pass; data.js is current" and exited 0; `--selftest` printed "17 of 17 wrong inputs refused" and exited 0.

- **By script on every build (exits 1, data.js untouched, if any fails):** every non-blank line of content.md is placed, by a closed list of line kinds; every block quotation is word for word the Berean at its reference; every reference exists with no gap; a quotation with its own reference after it is in that reference; any other quotation is in a verse its paragraph cites, its part's walked passages, or the passage printed just above it, and a quotation cut with "…" must have its pieces in order in one passage. Each part title's quoted saying is in its walked passage. Links are plain links on this site only (no "//", no backslash, no ".."). Italic study names link to a mock-up only if that mock-up's index.html exists.
- **The confession:** the six Baptist Faith and Message phrases are checked word for word inside their own article (III, IV, V, IX) of "The 2000 Baptist Faith and Message" text held in [baptist-know-the-truth-catechism.json](../../content/questions/sources/extracted/baptist-know-the-truth-catechism.json), and the paragraph must name that article. So the four "[check: wording]" notes on those phrases are answered on the page's list of notes ("Matches article … word for word"), but the notes themselves stay in content.md for the editor to clear.
- **The lists:** each tense line's verb is inside its clause and the clause inside its verse, with the mark's offsets computed by the build; each parable's opening words are in its first verse; the three proofs that Jesus explains a parable are in their verses; the three kinds are still named by part 03's Consider question; the chapter marks ("sat by the sea", "went into the house", "hometown", "because of their unbelief") are in their verses; Matthew 13 ends at verse 58; the three waiting phrases are in their verses; the close's three asks are in the Way paragraph word for word; the main readings walk exactly seven passages and the selection says "seven passages".
- **Refused on purpose (`--selftest`, 17 wrong inputs, each in memory):** a changed word in a block quotation; a block quotation under the wrong reference; a changed word in a quoted phrase; a quotation cited to the wrong verse; a reference that does not exist; a link off the site; a link that only looks local ("/\example.com"); a line the page cannot place; a "…" quotation in the wrong order; a confession phrase under the wrong article; a changed word in a confession phrase; a tense verb not in its verse; a parable opening not in its verse; a parable kind the part's question does not name; the selection's count changed; an outside quotation that is really a cited verse; a study link to a page that does not exist. data.js's bytes were compared before and after.
- **Not checked by script:** "the yoke of the kingdom of heaven" (Mishnah, not held) and "inside you" (older translations), both on a named list; the Kaddish, 11QMelchizedek, Scofield, Augustine, *Lumen Gentium*, Rauschenbusch, Schweitzer, Dodd and Ladd, none read; the crisis numbers (988, 024, 800 911 2000, 188), which the study marks to check. Words the study uses as its own terms ("good news", "heaven", "will come", "work out the date", "realized eschatology", "already and not yet", "millennium") are on a short named list. Whether a parable sits in the right row, and whether a tense name is apt, need a person's reading: they are this page's reading aids.
- **By browser against the always-on preview, 2026-11-07:** at 1440, 390 and 320 wide, light and dark: no element of the page past the right edge (page width equals window width at every size), no console errors. A verse link opens its sheet and puts `?ref=` in the address; Escape closes it, clears the address and returns focus to the link. Choosing "is in your midst" marks those words in Luke 17:21, sets `?tense=midst`, and only that button is pressed. A parable button writes its line and opens its verses, and focus returns to it. A thread link opens its question; a note number opens the list of notes. `?ref=constructor&tense=__proto__` is ignored; `?ref=LUK.17.20-21&tense=midst` opens the sheet with focus on its heading and the verb marked. Screenshots were read by eye at all three widths in both themes.
- **Not tested:** 200% zoom, a screen reader, a real phone, measured colour contrast. Reduced motion is handled by a CSS rule that stops the lamp, flame, birds and sparkles; it was not switched on in the browser.
- **Known limit:** the page is long (about 18,600 pixels at 1440 wide, 30,600 at 390), because the study text is about 5,000 words and every line is placed. The margin notes and the folded questions keep it shorter than a single column would be. If the owner wants it nearer The good news's length, the text needs trimming (passage-notes.md already asks whether to cut it toward 4,000 words).

## The three plan reviews

Security and correctness, reliability, and platform and design reviews were run on the plan before any code. What changed because of them:

- **Quotations are checked more tightly than in the model.** A quotation not tied to its own reference may no longer pass on whole chapters quoted only "with" (Psalms 93, 97, 99, Daniel 2, 7); the one phrase that needs Daniel is tied to Daniel 7:13 by name. "…" pieces must be in order in one passage. An outside phrase found in a cited verse is refused.
- **The confession is checked by script**, against the held 2000 text, article by article, instead of being left to the eye.
- **Three rows for the parables, not four,** because part 03's question names three (hearing; growth or worth; the end). "His hometown", not "Nazareth", because Matthew 13:54 does not name the town; "hard ground" is labelled as the study's reading.
- **The table's names are labelled as this page's reading aids,** and the leaven is not used for the "like a seed" line (the mustard seed is), because the study shows the leaven read two ways.
- **The waiting phrases moved to the question that argues delay,** and Luke 17:22 was dropped from them, because it does not speak of delay.
- **Questions open in place rather than as tabs,** so the care note on children is never hidden behind another tab. Notes still to check are numbered links to one closed list, reachable by keyboard and touch, not tooltips.
- **Engineering:** address values go through Maps (no inherited names); the sheet keeps other address values; the build emits the verb's offsets so the page never builds markup from data; data.js is written atomically; no bytecode cache.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles III, IV, V, VI, IX, X, XIII, XV as the study names them; millennium left open. A reviewer's reading, not the owner's |
| 3 Berean | ✓ | Every verse printed and every sheet |
| 4–5 Heading, drawing, motto | ✓ | No person drawn |
| 6 Figures with meanings | ✓ | Computed |
| 7 Claims marked | ✓ | This study reads / Readers differ / Another reading / With care / named sources |
| 9 Hard questions | ◐ | Both readings given where the study gives them; the outside sources are named, not read |
| 10 Complete or says so | ✓ | "A selection, not a census", and the table's own note |
| 11 Sources registered | ◐ | Listed on the page; not added to SOURCES.md (outside this job's two places) |
| 12 Own shape | ✓ | The verbs' tenses, from the study's frame and close |
| 15 Dense, compact | ◐ | Long; see the known limit |
| 16 Joined up | ◐ | View in the address; related studies link where a mock-up exists |
| 18 Graphics | ✓ | Each graphic states its question and reaches the verse |
| 20 Colour | ✓ | Gospels' violet; gold for care, notes to check and readers differ; words carry each meaning too |
| 21 Ruled out | ✓ | No boxes around sections, one glow (the lamp), no focus rings |
| 23 Access and checks | ◐ | See above |
| T1–T6 | ✓ | Passage first and last (Mark 1:15 opens, Mark 1:14–15 closes) |

## Files

Created in this folder: README.md, build-data.py, build_selftest.py, scripture_text.py (copy), study_lists.py, data.js (built), index.html, css/kh.css, js/kh.js, js/art.js. Created beside the study text: [design.md](../../content/studies/jesus-christ/the-kingdom-he-announced/design.md). Nothing else in the Website folder was changed.
