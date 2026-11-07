# Every life in God's image: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, step 29 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/every-life-in-gods-image-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/every-life-in-gods-image/content.md) · Design: [design.md](../../content/studies/christian-life/every-life-in-gods-image/design.md) · Plan: [StudyPlan.md](../../../Pages/Topics/StudyPlan/StudyPlan.md), study 62 · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Living the Christian Life study of human dignity from the womb to the deathbed. Its one habit: **when a passage tells you how to treat a person, look around the scene for the one who cannot speak.** The page's shape comes from the passages themselves. Each walked passage is a scene with people placed in it, so each is drawn as a room seen from above. A room for the womb, the king's table, the church meeting, the court at the gate and the bedside. Every room asks the same question, "Who here cannot speak?", and the close names the five people the rooms find.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and [study_lists.py](study_lists.py), checks them, and writes [data.js](data.js). Its helpers are:
- [scripture_text.py](scripture_text.py), an unchanged copy of The good news mock-up's Berean reader;
- [held.py](held.py), which reads the outside sources held on this PC;
- [figures.py](figures.py), which makes every figure and count;
- [build_selftest.py](build_selftest.py), the wrong inputs.

Run it from the Website folder: `python -B design/every-life-in-gods-image-directions/build-data.py`. Add `--check` to run every check and fail if data.js is stale, or `--selftest` to try the wrong inputs in memory. The page is [index.html](index.html), [js/el.js](js/el.js) (the page), [js/rooms.js](js/rooms.js) (the figures), [js/art.js](js/art.js) (the drawings) and [css/el.css](css/el.css). The site frame comes from the Authors and Manuscripts mock-ups and is linked, not copied. Nothing under `src/` or `dist/` was touched, and the shared lists (catalog, progress, master lists) were left for the run's last step.

One direction was built, because the text already existed.

### The parts of the page

- **Opening:** the standard heading. Beside it, a set table in a faint circle and dotted orbit: a knitted cloth edge that draws itself, a candle, plates and an empty chair, under "Knit in secret. / Seated at the table." No one is drawn. Four computed figures and the care note with its crisis lines follow.
- **01:** Genesis 1:27 and 9:6 side by side, "in His own image" marked in both. The four words Genesis 1:26–27 does not use (strong, clever, useful, healthy) are proved absent by script.
- **02–06, the rooms:** floor plans with walls and the door's swing. People are rings, things are squares, and the LORD is named in words only. Choosing a mark prints the verse words that place it, with the verse link. "Who here cannot speak?" fills one ring and gives the study's own reason. On phones (640 wide and below) the plan is left out and the room becomes the list of who is in it.
- **Within the rooms:** part 02 marks the twelve times the grown man says I, me or my in Psalm 139:13–16, inside the printed psalm. Part 03 lays 2 Samuel 9 out as a long table, one place a verse.
- **Body:** reading in one column. The notes that read, limit or leave open stand in the margin at 1100 wide and above. Care notes stay in the line of reading.
- **Questions and close:** three questions open in place, the first open from the start. The close shows the five people joined by a dotted line, the way of reading, and 2 Samuel 9 in full.

### Which page it could be confused with, and why it is not

**The church and its calling** ([its mock-up](../the-church-and-its-calling-directions/README.md)). Its one move is worded "ask who was in the room, before asking what a line says to you", and this study's lead says "ask who is in the room who cannot speak for themselves". The words are close, but the habit differs:
- that page asks who first heard a letter, and shows it as text plates beside each reading, with rings of one English word and a line of water;
- this page asks who in the scene has no voice, and shows it as a drawn floor plan per passage, with one person found in each.

The colour differs too (teal here). The rooms are drawings, and that page has none. **Grief and dying** is in the same category and was this build's code base. Its look is a map of mourners' voices joined by lines, in History orange, and nothing of it is reused here except behaviour (the verse sheet, the text runs, the checks).

## What the checks prove, and what they do not

- **By script on every build (exit 1 and data.js unchanged if any fails):**
  - Every non-blank line of content.md is placed on the page.
  - Every block quotation is word for word the Berean at its reference, and every reference and chapter exists.
  - A quotation followed by its own reference is in that exact verse. Any other quotation is in a verse its paragraph cites, its part's main readings, or the passage printed just above it.
  - Links go only to this site. Every italic is a named study or fails.
  - Every Baptist Faith and Message phrase is found in its own article (III or XV) of the copy held on this PC. The phrase with an ellipsis is found piece by piece.
  - Every mark in every room is in its verse, or in the study's own content.md. Each room has exactly one person who cannot speak, with a reason in the study's own words, and that person is one the close's Way paragraph names. The four "small and costly" answers are in the Way paragraph.
  - Counts made by script: "table" in 2 Samuel 9 in verses 7, 10, 11 and 13, "always" beside it in 7, 10 and 13, "lame in both feet" in 3 and 13. Twelve first-person words in Psalm 139:13–16, and "Open your mouth" twice in Proverbs 31:8–9.
- **Refused on purpose:** `--selftest` tries 25 wrong inputs in memory without writing data.js, and each is refused for its own reason (25 of 25 on 2026-11-07):
  - a changed word in a block quotation, and a block quotation under the wrong reference;
  - a changed word in a quoted phrase, and a quote cited to the wrong verse;
  - a reference and a chapter that do not exist;
  - an outside link and a protocol-relative link;
  - a line the page cannot place, and an unknown italic;
  - a first-sentence quotation cut mid-sentence;
  - a changed confession phrase, and a confession phrase searched in the wrong article;
  - a wrong held wording for the Talmud;
  - unused or false entries on the own-terms and misquote lists;
  - a room mark not in its verse, and a mark claiming the study's words when it has none;
  - two silent people in one room, a reason not in the study's words, and a silent person the close does not name;
  - the table counted at the wrong verses;
  - "in His own image" under a verse without it;
  - an "unnamed" word the verse does use;
  - a wrong count of "Open your mouth".
- **Not checked by script:**
  - The two Catechism of the Catholic Church phrases (paragraph 2278). The Catechism is not held on this PC, so the page marks them as not yet compared.
  - Where people sit in each plan. That is a drawing of the scene, not a claim of the text.
  - The crisis numbers, which are shown as the study has them, each marked to check before publishing.
- **By browser against the always-on preview:** 1440, 390 and 320 wide, light and dark.
  - The page is never wider than the window: scroll width equals window width at every size. The only elements past the edge are inside the shared site header's own sideways-scrolling menu, the same 12 as on the Grief and dying mock-up.
  - No console errors.
  - A verse link opens its verses in a sheet and puts the reference in the address. Escape closes it and returns focus to the link. `?ref=2SA.9.13` opens that verse on load.
  - Enter on a plan mark prints its words, the find button marks the one who cannot speak, a verse on the 2 Samuel 9 table prints that verse, and a question opens in place.
  - No outline is drawn on a pressed control.
- **Not tested:** 200% zoom, a screen reader, a real phone, the reduced-motion rule in a browser that asks for it (the rule is in [css/el.css](css/el.css) and stops every animation), and colour contrast.

## For the editor (the study's text was not changed)

1. **"Three times" at the king's table.** Part 03 says the chapter "says three times that Mephibosheth will eat at the king's table", then cites four verses (2 Samuel 9:7, 10, 11, 13). The Berean has "table" in all four verses, and "always" beside it in three (7, 10, 13). The page shows the verses and prints a note. The build refuses if the study's count later matches the four verses and the note is left in.
2. **Revelation 7:9 is printed as a block quotation of only its first sentence.** It is word for word, and the build proves it stops at a sentence's end. The page says the verse goes on, and the sheet shows it whole.
3. **The Talmud saying.** The English Bava Metzia held on this PC (59b) reads "in thirty-six places, and some say in forty-six places, with regard to causing any distress to a convert". The study has "and some say forty-six" and applies it to the foreigner. The page keeps the study's words and shows the held wording beside them. The editor should decide whether the saying, which this translation reads as about converts, supports the sentence it is in.
4. **Wording close to another study.** "Who is in the room" is also the habit of *The church and its calling*, in another sense (see above). The editor may want to word one of them differently.
5. **Notes still marked to check, as the study has them.** These are:
   - the five crisis lines, and the other countries the site serves;
   - the after-abortion help link, which appears twice;
   - whether *The Christian and the state* treats the death penalty and immigration (it is being designed beside this page, so it is not linked);
   - the 1995, 2024 and 2026 Southern Baptist Convention resolutions;
   - Catechism paragraph 2278;
   - the Talmud translation.
   Each shows on the page as a small gold "to check" mark.

## Log of findings (written as the work went)

- 2026-11-07 · The study folder has content.md and passage-notes.md, and no working.md. Grief and dying, in the same category and written in the same markup (hooks, "[read]", "[care]", "[open]", "[source:ccc]"), was taken as the code base; its look was not.
- The Baptist Faith and Message 2000 and the English Talmud (Bava Metzia) are held on this PC. The Catechism of the Catholic Church is not.
- The first build passed every quotation once three things were handled: the lead quotes "in the image of God" before any reference is printed (allowed from Genesis 1:27, by name); the crisis lines are a list under the top care note; and Revelation 7:9 is a first-sentence quotation (allowed by name).
- *The Christian and the state* appears only inside "to check" notes, so it is shown as plain italics there and not linked.
- The first browser pass found the table room's labels crossing ("from Lo-debar" over "The king's sons", "King David" over the table), the meeting room's labels crossing its drawn chair and back wall, the gate's "Those who judge" over the gate towers, chairs at the bedside drawn as squares that looked like things to choose, and a mark's verse link printed as text. All fixed and shot again.
