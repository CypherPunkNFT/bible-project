# Reading the Bible well: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as one study of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/books-in-their-settings-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/explore-the-bible/books-in-their-settings/content.md) · Design: [design.md](../../content/studies/explore-the-bible/books-in-their-settings/design.md) · Plan: [StudyPlan.md](../../../Pages/Topics/StudyPlan/StudyPlan.md), study 31 · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

An Explore the Bible study for a beginner. It covers which book to read first, how to make a habit that lasts and how
to use the site's reader. Its one habit for every passage after that is **read a verse inside the book it belongs to.**
The picture comes from the study's own motto, Psalm 119:105. A clay oil lamp sits low on a path of stepping stones and
lights only the next three. Each part of the page lights only what it needs. The two worked examples come at the habit
from opposite sides. Jonah is read from the whole book inward: its 48 verses are drawn as one line that goes down to the
roots of the mountains and comes back up. Jeremiah 29:11 is read from one verse outward: the verse is shown alone on a
card, then in its place ten verses into the letter it belongs to.

## How it is built

[build-data.py](build-data.py) takes the study's content.md and checks it against the site's Berean text
(data/plain/bsb). It reads the Berean editors' headings for the reader sample from the site's noted copy
(data/text/bsb). It writes [data.js](data.js), which stores each verse once. It uses:

- [scripture_text.py](scripture_text.py), a copy of the model's Berean reader;
- [study_lists.py](study_lists.py), every fact the figures draw, each with the verse it comes from;
- [figures.py](figures.py), which checks each figure's facts against the Berean;
- [selftest.py](selftest.py), the wrong inputs listed below.

Run it from the Website folder: `python design/books-in-their-settings-directions/build-data.py`. Add `--check` to run
every check and fail if data.js is stale; the staleness test also covers the build's own files. Add `--selftest` to
prove the refusals. Both options write nothing.

The page is [index.html](index.html), [js/rbw.js](js/rbw.js) (the page and the verse sheet), [js/figs.js](js/figs.js)
(the figures), [js/art.js](js/art.js) (the drawings) and [css/rbw.css](css/rbw.css). The frame (header, footer, theme,
fonts) is borrowed from the Authors mock-up. The theme script is shared with the Who do you say that I am mock-up. The
page keeps the model's security policy: no inline styles, so sizes come from one stylesheet built in code. The header's
nav is rebuilt from fixed strings only, never from data. Nothing under src/ was touched. One direction was built,
because the text already existed.

## What the checks prove, and what they do not

**Checked by script on every build:**
- Every non-blank line of content.md is placed on the page.
- Every block quotation is word for word the Berean at its reference.
- Every reference exists, chapter references included (John 1–21, 2 Kings 17, Jeremiah 28).
- A quotation followed by its own reference is in that exact verse. Any other quotation is in a verse its paragraph
  cites, in its part's main readings, or in the passage printed just above it.
- Short references (1:17, 4:6) belong to a named book.
- Links go only to this site.
- Numbered steps run in order, and no markup is left over as visible text.

**The figures' facts are checked the same way:**
- **The shelf:** the shelf has 66 books in the Berean's order, with chapter counts from the Berean. Every book the
  study walks through is cited on the page.
- **John:** John has 21 chapters, and the day's question is in the text word for word.
- **Jonah:** each step of Jonah's descent is in its verse ("went down to Joppa" 1:3, "gone down to the lowest part
  of the vessel" 1:5, "cast him into the sea" 1:15, "into the heart of the seas" 2:3, "To the roots of the mountains I
  descended" 2:6, "onto dry land" 2:10). The line only goes down until it comes back to dry land.
- **The same command and the reason:** the same command is in 1:2 and 3:2. The reason Jonah gives in 4:2 points back
  to 1:3.
- **What God appointed:** the four things God appointed are each in their verse.
- **The open end:** the book ends on a question.
- **The shared words:** all five shared phrases are in Jonah 4:2. The figure shows which of them Exodus 34:6 and Joel
  2:13 hold.
- **The letter:** each of the seven letter notes is inside Jeremiah 29:1–14 and in its verse. "Within two years" is in
  Jeremiah 28:3 and "seventy years" in 29:10.
- **The reader sample:** the reader sample's four labels are true of Jonah 1:15–2:2. The heading is a real editors'
  heading, the chapter number begins a chapter, and LORD is printed.

**Two quotations from outside Scripture are checked by script.** Both are from the Baptist Faith and Message 2000:
"truth, without any mixture of error" (article I) and "There is no salvation apart from personal faith in Jesus Christ
as Lord." (article IV). They are checked against the site's record of the confession in
[DOCTRINAL-FOUNDATION.md](../../../DOCTRINAL-FOUNDATION.md), not against the published text.

**Refused on purpose.** Running `--selftest` on 2026-11-07 gave "23 of 23 wrong inputs refused as expected; nothing
written". Each wrong input was tried in memory and refused for the right reason, which the test checks by the words of
the refusal:
1. a changed word in a block quotation;
2. a block quotation under the wrong reference;
3. a changed word in a quoted phrase;
4. a quote cited to the wrong verse;
5. a verse reference that does not exist;
6. a chapter reference that does not exist;
7. a link that leaves the site;
8. a line the page cannot place;
9. an unclosed bold mark;
10. numbered steps out of order;
11. a short reference with no book;
12. a Baptist Faith and Message quotation edited away from its wording;
13. an unbalanced quotation mark;
14. a short quote with no verse;
15. a step of Jonah's descent given to the wrong verse;
16. a thing God appointed moved to a verse without it;
17. a shared phrase that Jonah 4:2 does not hold;
18. Hananiah's two years made three;
19. a letter note sent to the wrong verse;
20. an editors' heading looked for where there is none;
21. an outside quotation looked for in the wrong held copy;
22. a held source outside the allowed folders;
23. the six-week example with a mark that is not a day.

One note on case 12. Once the edited words no longer match the named confession, the build treats them as a Scripture
quotation, and refuses them as "not in Jonah 4:10–11", the passage above. The input is refused, but the message points
to the passage, not to the confession.

**Run on 2026-11-07:**
- `python design/books-in-their-settings-directions/build-data.py` printed "all checks pass; wrote data.js (181,715
  bytes; 7 points still marked to check before publishing)".
- `--check` printed "all checks pass; data.js is current". It exited 0.

**Not checked by script:**
- Two Jewish sources are named but not quoted: the Babylonian Talmud, Megillah 31a, for the reading of Jonah on the
  afternoon of Yom Kippur, and the Mishnah, Avot 3:2, for Rabbi Hanina's saying. Neither is held on this PC.
- The study's own terms ("good news", "Lord", "master", "you", "all of you") are on a short named list in
  study_lists.py, so they are not treated as quotations.
- The six weeks of reading in part 02 are an example, not anyone's record. The page labels them so.
- Whether the reader really has each feature part 03 names is still marked to confirm in the text.

**By browser against the always-on preview:**
- **Widths and themes.** The page was opened at 1440, 390 and 320 wide, in light and dark (dark through the site's own
  saved theme). At every width the page is exactly as wide as the window, so nothing runs past the right edge. The
  console showed no errors and no warnings.
- **The verse sheet.**
  - Clicking the Jeremiah 29:1–14 link opened its 14 verses in the sheet and put ?ref=JER.29.1-14 in the address.
  - Escape closed the sheet, cleared the address and put focus back on the link.
  - Opening the address with ?ref=JON.1.3 opened Jonah 1:3 directly.
- **The screenshots, looked at by eye:**
  - the heading and drawing, the Jonah line, the letter, the shelf and the stepping stones (light, 390 and 320);
  - the heading, the Jonah line and the open sheet (dark, 1440);
  - the heading (dark, 390) and the shelf (dark, 320).
- **Fixed after looking:**
  - Two labels overlapped and the arc was clipped in the Jonah figure.
  - The close's paragraphs were uneven in width.
  - The chosen stepping stone showed a box instead of its own outline.
- **Note on full-page screenshots.** A full-page screenshot over 16,384 pixels tall repeats the page. That is a fault
  of the screenshot tool, not the page, so screenshots of the visible window were used instead.

**Not tested:** 200% zoom, a screen reader, a real phone, reduced motion in a browser (the CSS has it, but it was not
switched on and watched), and keyboard use of the Jonah line beyond the code. Colour contrast was not measured. On the
1440 Jonah line, the dashed arc from 4:2 back to 1:3 runs through the label "Chapters 1–2: Jonah runs". The label is
still readable, but it would be cleaner lifted clear of the arc.

## Pages it could be confused with, and why it is not one of them

- **[Learning to discern](../learning-to-discern-directions/).** It also uses Acts 17:11, widens a passage in steps,
  and has a flame in its hero. It is about testing claims. This page is about the order and habit of reading. Its
  Acts 17:11 is one of five daily steps, not a figure. Its widening is drawn as a library, a whole book and a letter,
  not as rings around one claim.
- **[The good news](../the-good-news-directions/).** It has lamplight and a road. Its road is the thread that one
  message runs down. Here the path is stepping stones lit three at a time, and the lamp moves to the question chosen.
- **[The shape of Scripture](../the-shape-of-scripture-directions/).** It is in the same Explore the Bible category,
  and both pages show the whole library. There the library is the subject. Here the shelf is only the colour key and a
  way to each part, and four of its five lit books are read on the page.
- **[Reading Daniel and Revelation](../reading-daniel-and-revelation-directions/).** It also reads a book in its
  setting, on a rail of seals. Here
  Jonah's line follows the story's own direction of travel, down and up, and nothing is sealed or revealed.

## Links in the study

content.md was not changed. Its seven check notes all ask for a fact to be confirmed. None of them asks for a link,
which is the only change this run allows. Named studies with a mock-up on this PC link to it; the rest are named in
italics, because they are not pages yet.

## Still for the owner's word before publishing

The text has seven points marked to check, and the page shows each one where it stands. They are also listed in a
closed box at the foot of the page.
- **The reader (part 03).** Each feature named in "a few ways to use the reader well" must exist in the current reader,
  and be reached the way the text says.
- **The Yom Kippur reading (part 04).** The text says Jonah is read on the afternoon of Yom Kippur, citing the
  Babylonian Talmud, Megillah 31a. That matches what this chat knows of the source; it still needs a check against the
  text.
- **The crisis lines (part 04, five marks).** The numbers are 988 in the United States, 024 in Spain, Línea de la Vida
  800 911 2000 in Mexico and CVV 188 in Brazil. All four match the checked entries in the site's crisis-line list,
  [life.json](../../src/data/resources/life.json). That file was only read, not changed. One mark asks for each other
  Spanish-speaking country's line to be added. That is new wording, so it was left for the owner.

## Plan review

Before any code was written, one review agent read the plan three times, as a security architect, an SRE lead and a
principal engineer. Every finding was built in:
- **The security policy:** keep the model's full security policy line, and build the header only from fixed strings.
- **Output and input text:** print safely to the Windows console, and read content.md as UTF-8 with or without a
  byte-order mark.
- **Jonah's text:** refuse an empty or short copy of Jonah, and confirm it has 48 verses.
- **Chapter references:** match them strictly, so a verse reference is never read as a chapter. A chapter reference
  never counts as evidence for a quotation.
- **Markup in the study text:** match check notes and numbered steps strictly, and refuse any leftover markup.
- **Colour:** parts 01 and 02 use the violet that the Gospels and Acts share, per the study standard.
