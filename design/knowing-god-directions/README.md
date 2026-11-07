# God: who He is and what He does — the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, step 18 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/knowing-god-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/knowing-god/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/knowing-god/design.md) · Plan: [StudyPlan.md](../../../Pages/Topics/StudyPlan/StudyPlan.md), study 21 · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

A Scripture & Theology study of God's character, His creation and His providence, in ten passages. Its one habit:
**whenever a passage tells you what God is like, look in the same passage for what He is doing.** The page draws the
study's own closing paragraph, which names seven such pairs ("I AM" came with "I have seen"; "Holy" came with a coal
from the altar…), as seven words on one dotted orbit, each tied by a fine line to its deed. Then the ten passages are
read one at a time under the study's four concepts (Name · Character · Creation · Providence), with Romans 11:36 as the
tenth. Part 03 prints every verse of the Berean that calls God "slow to anger", so Scripture can be seen remembering
Exodus 34:6.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and [study_lists.py](study_lists.py), checks them against
the site's Berean text (through [scripture_text.py](scripture_text.py), a copy of The good news reader) and against the
held outside sources (through [held_text.py](held_text.py)), and writes [data.js](data.js). Run it from anywhere:

- `python design/knowing-god-directions/build-data.py` builds and writes data.js (through a temporary file, swapped in whole).
- `--check` runs every check and fails if data.js is missing or stale. Writes nothing.
- `--selftest` feeds the build wrong inputs in memory and proves each is refused. Writes nothing.

It writes only data.js in this folder; unlike the model build it writes nothing under `src/`. It leaves no
`__pycache__`. The page is [index.html](index.html), [js/kg.js](js/kg.js), [js/art.js](js/art.js) and
[css/kg.css](css/kg.css), with the frame borrowed from the Authors and Manuscripts mock-ups as the model does. One
direction was built, because the text already existed.

## What the checks prove, and what they do not

- **By script on every build** (all pass, and `--check` passes, 2026-11-07):
  - every block quotation is word for word the Berean at its reference; the one part of a verse (the opening Exodus
    34:6) is allowed only because it is named in a list, must run in the Berean's own words and case to the end of the
    verse, and is shown as "(part)";
  - every reference exists, with no gap in a range; whole-chapter readings (Psalm 96, Psalm 104) are read as their full
    range;
  - a quotation followed by its own reference is in that exact verse; any other quotation is in a verse its paragraph
    cites, its part's main readings, or the passage printed just above; words cut by an ellipsis must come in order;
  - the seven pairs on the orbit: each word and deed is in the study's closing paragraph as written, each verse phrase
    is in its verse, and both verses lie inside the same part's main readings;
  - the "slow to anger" census: the build scans all 66 books and refuses unless the verses it finds are exactly the 9
    said of God plus the 3 said of people (Proverbs 15:18, 16:32, James 1:19); both counts on the page come from that
    scan. The underlined words in each verse are computed, not typed. The two verses named as missed by the rule
    (Nehemiah 9:31, Psalm 111:4) are checked to hold "gracious and compassionate" and not "slow to anger". Each verse's
    one-line setting is checked against a phrase in the verse it points to;
  - the LORD count (5,569 of 31,086 verses, 18%) is counted on the site's Berean copy by the rule "the verse contains
    LORD in capitals"; "GOD" in capitals, which also stands for the name, is not counted. Counted 2026-11-07;
  - six phrases from outside Scripture are found in the held copies, each within the section cited: the Baptist Faith
    and Message 2000 article II (three phrases), the Westminster Shorter Catechism question 9 (question and answer), and
    the Second London Baptist Confession chapter 3 paragraph 1. The build also compares the Baptist Catechism (1695)
    question 12 with Westminster question 9 and confirms the study's claim that they give the same answer;
  - every link stays on this site (a protocol-relative `//` link is refused), and every study named after "Read more
    in" is on a list: it links to its mock-up where one exists on this PC, and is named in italics where it does not.
- **Refused on purpose (`--selftest`, 2026-11-07): 18 of 18 wrong inputs refused for the expected reason, data.js
  untouched.** A changed word in a block quotation; a block quotation under the wrong reference; a changed word in a
  quoted phrase; a quotation cited to the wrong verse; a reference that does not exist (Jonah 5:2); a link off the site;
  a protocol-relative link; a part of a verse not on the list; the listed part with its case changed (Lord for LORD); a
  changed outside quotation; an outside quotation listed but not in its held source; a misquotation entry that is no
  longer true; a pair deed not in the closing paragraph; a census list missing a verse; a pair whose verse does not
  hold its words; a marker the page does not know; a study the page cannot link or name; a line outside any part.
- **Not checked by script:** whether each passage is read rightly; the one-line settings beyond the phrase each points
  to; the four help-line numbers in part 09 (they match the entries in [life.json](../../src/data/resources/life.json),
  checked by eye, and the text keeps its own "check before publishing" marks).
- **By browser against the always-on preview** (Chromium, 2026-11-07): 1440, 390 and 320 wide, light and dark, on the
  default view, part 03 and part 10. The page is never wider than the window; the only things past the right edge are
  inside the shared site header's navigation, which scrolls sideways by design and does the same on The good news. No
  console errors or warnings. A verse link opened from the keyboard opens its sheet from the right and puts it in the
  address; Escape closes it and returns focus to the link. Choosing a passage from the keyboard opens it and puts
  `?part=` in the address. A hostile address (`?part=constructor&ref=__proto__`) is ignored. With reduced motion set,
  every animation stops. Screenshots were looked at; the orbit's first version had two words colliding, now fixed.
- **Not tested:** a screen reader, 200% zoom, a real phone, colour contrast (not measured; the light theme uses a
  darker orange for text for that reason).

## Found in the study text (for the owner; not changed here)

The design run lets this page change content.md only to turn a link note into a link, and the text has none, so
content.md is unchanged. The build found and marks these:

1. **A misquotation in part 01.** The text quotes Moses keeping the sheep "on the far side of the wilderness"; the
   Berean (Exodus 3:1) reads "to the far side of the wilderness". The page shows the Berean's words beside it. One word
   in content.md (line 25) fixes it; then remove the entry from `MISQUOTED` in study_lists.py.
2. **Heidelberg Catechism question 27** is quoted in a translation not held here. The held CCEL copy reads "…as it
   were by his hand, he still upholds heaven and earth, with all creatures, and so governs them that herbs and grass…
   yea, all things, come not by chance, but by his fatherly hand." The page keeps the study's own "not yet confirmed"
   mark. The build proves the study's wording is still not in the held copy, so this note cannot go stale silently.
3. **Checks the held copies settle:** Westminster Shorter Catechism question 9 matches word for word; the Baptist
   Catechism gives the same answer at **question 12**; the Second London Baptist Confession chapter 3 paragraph 1 has
   "neither the author of sin"; the three Baptist Faith and Message article II phrases match. The text's own "[check:]"
   notes for these can be cleared by the editor.
4. **Still open from the text:** Berakhot 9b, the occasions of the Thirteen Attributes, Aratus and Epimenides; the
   site's Trinity articles and the apologetics answers are named in prose without links (passage-notes item 10).
   Every "[check: …]" note is shown on the page as "Not yet confirmed", never hidden.

## Could be confused with

**Leviticus: holiness and sacrifice** ([the-law-of-moses-and-the-christian-directions](../the-law-of-moses-and-the-christian-directions/)),
the same category's other History-orange page. It is not the same: that page has a plan of the camp and two columns in
every part; this one has an orbit of words and one passage open at a time. Also near: **The good news** (a left/right
ledger of news then response) and **The hope to come** (promise, "therefore", call in three columns). This page has no
ledger and no columns; the pairs float on a ring. **Grace, faith and salvation** has a giant numeral, a margin kept in
view and a switch that marks verbs; **Humanity, sin and renewal** keeps three questions in a margin. This page has none
of those: its three questions stay in the study's own frame paragraph, and the parts carry only the text.

## Links in the study

Studies named after "Read more in" with a mock-up on this PC link to it: Angels, demons and spiritual powers; The
cross, the empty tomb and the throne; Who do you say that I am?; Genesis 1–11; The good news. Every life in God's image,
Fear, anxiety and despair, and Chosen and kept are named in italics, because they are not pages yet.
