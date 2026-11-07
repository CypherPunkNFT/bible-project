# Sexuality, singleness and divorce: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 9 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/marriage-sexuality-and-singleness-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/marriage-sexuality-and-singleness/content.md) · Design: [design.md](../../content/studies/christian-life/marriage-sexuality-and-singleness/design.md) · Limits and sources: [passage-notes.md](../../content/studies/christian-life/marriage-sexuality-and-singleness/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 43, a Scripture & Theology study in Living the Christian Life. Its one habit: **before you read a hard verse, find the question it was answering, then go back to the beginning.** That is what Jesus does in Matthew 19:3–12, and that one conversation holds all three of the study's subjects. The Pharisees ask about divorce, and Jesus answers from Genesis. They press Him about Moses, and He goes back again. The disciples say "it is better not to marry", and He answers with His saying on those who do not marry. So the page draws the conversation first, as seven turns over a ground line marked "From the beginning". Every part then carries the study's three questions as one rule with three stations: **From the beginning**, **Asked first**, and **Holiness · Grace**.

## How it is built

[build-data.py](build-data.py) reads the study's content.md, checks it against the site's Berean text and the held copies of the outside sources, and writes [data.js](data.js). It works with three helpers: [scripture_text.py](scripture_text.py) (a copy of The good news mock-up's Berean reader), [study_lists.py](study_lists.py) (this page's own lists) and [drawn.py](drawn.py) (the checks behind each figure). Run it from the Website folder:

- `python design/marriage-sexuality-and-singleness-directions/build-data.py` writes data.js.
- `--check` runs every check and fails if data.js is stale. It writes nothing.
- `--selftest` feeds 18 wrong inputs in memory and proves each is refused for the right reason. It writes nothing.

The page is [index.html](index.html), [js/msd.js](js/msd.js), [js/art.js](js/art.js) and [css/msd.css](css/msd.css). The frame is borrowed from the Authors and Manuscripts mock-ups, as in the model. The parser is adapted from the Angels, demons and spiritual powers mock-up, whose study text has the same shape: a byline, main readings, bullet views and outside sources held on this PC. Nothing under `src/` was touched.

**content.md was not changed.** It has no "[check: …]" link notes to resolve. The study folder has no working.md. The brief lists one to read, but only content.md and passage-notes.md exist, so this page was designed from those two.

One direction was built, because the text already existed.

## The page

- **Opening.** The standard heading:
  - the study trail (Study / Living the Christian Life);
  - the concepts in gold capitals (The design · The body · Singleness · Divorce);
  - the title *Sexuality, singleness* in ink, with *and divorce* as its gold italic turn;
  - the lead, which is the study's first two paragraphs, then Matthew 19:4–5 printed in full.

  Beside it, in a faint circle and dotted orbit, is the garden at the beginning. A river leaves Eden and parts into four (Genesis 2:10), between two trees, under a rising sun. The ripples on the water move slowly and keep moving. There is no person, no face and no figure of God. The motto is "Have you not read / from the beginning?". Both lines are Matthew 19:4's own words, checked in that verse.
- **Four counts**, each with what it means. All are made by script on every build:
  - 6 verses in the Berean hold "one flesh": Genesis 2:24 and the 4 New Testament passages that quote it.
  - "From the beginning" comes 2 times in Matthew 19:3–12.
  - The divorce saying has 4 tellings in the Gospels. 2 carry an exception, both in Matthew.
  - 4 views on divorce and remarriage are held by Baptists. The page shows them side by side and does not choose.
- **00 Have you not read?** The study's frame paragraph comes first. Then Matthew 19:3–12 is drawn as seven turns across the page. Each turn shows who spoke (the Pharisees, Jesus or the disciples), their words, the verse, and the number of the part of this study that reads it.
  - A ground line runs under the turns, marked "From the beginning", with "male and female" (Genesis 1:27) and "they will become one flesh" (Genesis 2:24).
  - A dashed root runs down to it from each of the two turns where Jesus goes back.
  - Pointing at a turn, or reaching it by keyboard, prints its whole verse on a reading line beneath.
  - Then come the study's three questions, each with its own mark: a root going down, a question in a circle, and a balance. The study's note "Many people read these pages carrying a wound" follows in gold.
- **01–06.** Each part has a large number, the title, the hook in italic, the main readings and a small drawing:
  - the river parting (01);
  - a well (02);
  - a doorway with a lamp, the body as a temple (03);
  - a tree in leaf beside a dry stump (04);
  - a rolled certificate (05);
  - a table with a lamp (06).

  Under the head is **the three-question rule**, filled for that part from study_lists.py. It gives the Genesis phrase the part goes back to; who asked first, and what they asked (a question, a slogan, or "No one asked. A father begins"); and the holiness and the grace, each in its verse's own words. Then the text follows in one reading column, with each part's own figure:
  - **01, where Scripture quotes Genesis 2:24 again.** Matthew 19:5, Mark 10:7–8, 1 Corinthians 6:16 and Ephesians 5:31, each labelled with the question it answers there.
  - **02, the Song's own refrain.** The 117 verses of the Song of Songs as a strip in its eight chapters. It marks where "Do not arouse or awaken love until the time is right" comes (2:7, 3:5, 8:4) and where the lovers say they belong to each other (2:16, 6:3, 7:10). Each mark opens its verse.
  - **03.** 1 Corinthians 6:11 is printed with its three verbs set apart: washed, sanctified, justified.
  - **04, three kinds.** Matthew 19:12's three kinds of eunuch side by side (by birth, by what others did, by choice), with Isaiah 56's "dry tree" and "everlasting name" beneath.
  - **05, a case in four steps.** Deuteronomy 24:1–4 as the law gives it: *If, If, and, then*. The command is only in the last step. Under it are the two words that turn Matthew 19:7–8: they asked why Moses would "order", and Jesus said "permitted".
  - **06, four tellings and four views.** Matthew 5:32, Matthew 19:9, Mark 10:11–12 and Luke 16:18, with the exception marked where it stands. Then "not I, but the Lord" beside "I, not the Lord". Then the four views as four numbered columns under "Shown, not chosen". Beneath them, on one rule, the four things all four views agree on, in the study's own words.
  - Notes marked "With care" are in the site's gold. The "Open question" note in part 04 is set off with a dashed rule. Consider and Reflect end each part side by side.
- **Close: Back to the beginning.** The garden again, the closing paragraph and Matthew 19:3–12 printed in full, with its verse numbers. Then the question for the reader, "Read the passage again before you answer.", the sources, and a link back to Living the Christian Life.
- **Every reference** opens its verses in a sheet, in the Berean. The sheet's reference goes in the address (`?ref=`).

**Colour:** History orange. The study's habit is to go back to Genesis 1–2, where the Bible's history starts. Jesus points there twice, and the drawings are of the garden. The site's gold marks the care notes.

## Why it does not look like its neighbours

- **The page it could be confused with is [Faith in daily life](../faith-in-daily-life-directions/)**, the other Christian Life study about the household. That page sorts 35 reasons into two columns of dots (toward the Lord, toward another person). It uses filled pills and card-like boxes, and the site's gold as its colour. This page has no boxes and no dot columns. Its shape is one conversation laid along a line, and three stations repeated in every part. Its colour is orange.
- **[The good news](../the-good-news-directions/)** quotes Jesus too, but runs its parts down one thread with a sticky left rail, in violet. This page has no rail. Its parts open with the three-question rule across the page.
- **[Angels, demons and spiritual powers](../angels-demons-and-spiritual-powers-directions/)** (whose parser this borrows) splits every part at a dashed "Here the text stops" line, with a veiled band beyond. Nothing like that is here. The views in part 06 sit in plain columns with a band of agreement under them.
- **[The hope to come](../the-hope-to-come-horizon/)** also sets Baptist views side by side, but as cards on a horizon in a section of their own. Here they stay inside the part that reads them.

## What the checks prove, and what they do not

**Recorded runs, 2026-11-07, from the Website folder:**
- `build-data.py` printed "build-data: all checks pass; wrote data.js (74,709 bytes)".
- `--check` printed "build-data: all checks pass; data.js is current" and exited 0.
- `--selftest` printed "selftest: 18 of 18 wrong inputs refused as expected; nothing written".
- `ruff check` (errors, pyflakes, warnings) passed on the four Python files.
- `node --check` passed on both scripts.

**By script on every build:**
- Every non-blank line of content.md is placed on the page, or the build fails. A line in an unknown form fails it: a stray heading, a table, or a misspelled note tag such as "[Care]".
- The page places the opening, the parts and the close in fixed places, so content.md must keep that shape. The opening is two paragraphs, a block quotation and three more paragraphs. There must be three numbered questions and six parts, 01 to 06. Each part needs main readings, a one-paragraph hook and sub-heads. The close needs its "Your question" line.
- Every block quotation is word for word the Berean at its reference.
- Every reference exists in the Berean, with no gap in a range: 93 different passages. A short reference such as "(5:32; 19:9)" takes its book only from a table in study_lists.py. Any "chapter:verse" left unlinked fails the build.
- A quotation with its own reference beside it must be in that reference. A quotation without one may be in a verse its paragraph cites, its part's main readings, or the passage printed above it. Any quotation under three words with no reference beside it must be pinned to its verse; ten are pinned. One example is "were", pinned to 1 Corinthians 6:11. The study's own "no" in part 02 is listed as its own word, not a quotation.
- **All 20 quotations from outside Scripture are found by script in the copies held on this PC.** Each must lie within 1,500 characters of a place-marker in its source, so a common phrase cannot pass on text from another chapter. The sources are:
  - the Baptist Faith and Message 2000 (Articles III, XV and XVIII, from the copy held with the Know the Truth catechism);
  - the Berean's own footnote on Malachi 2:16 ("For He hates sending away", held in the site's Berean text);
  - Matthew Henry's Exposition (on Matthew 19 and 1 Corinthians 7) and his Concise Commentary (on the Song of Solomon);
  - Piper's 1986 paper and two of his answers (2008, 2015);
  - Bethlehem Baptist Church's 1989 statement;
  - Gill's *Body of Practical Divinity*;
  - Marsh on the 1689 Confession;
  - the Westminster Confession;
  - Criswell's 1980 sermon.

  Held sources may only be read from the project's `sources/` folder, `Website/content/questions/sources/` and the site's Berean text.
- **Every phrase the page draws beside the text is in its verse:**
  - the motto;
  - the seven turns, in the passage's own order;
  - the ground line;
  - all 24 phrases of the three-question rule;
  - the three kinds of eunuch, in order;
  - Isaiah 56:3 and 56:5;
  - the three verbs of 1 Corinthians 6:11, in order;
  - the four steps of Deuteronomy 24:1–4, one verse each, in order;
  - "not I, but the Lord" and "I, not the Lord".
- "Order" must be in Matthew 19:7 and not in 19:8, and "permitted" in 19:8 and not in 19:7.
- **The counts are made from the Berean:**
  - Every verse in the Berean with "one flesh" must be Genesis 2:24 or inside a passage the part 01 figure lists. Today there are 6.
  - "From the beginning" must come exactly as many times in Matthew 19:3–12 as there are turns drawn going back.
  - The Song's two refrains are found by search and must be the verses the strip marks.
  - The exception "except for sexual immorality" is found by search in each telling. The build fails if it is found outside Matthew.
  - Part 06 must set out exactly four views.
  - Each of the four agreements must be the study's own words in part 06.
- A study named in the text links to its mock-up only if that folder holds an index.html. Study 05 (Faith in daily life) and Study 29 / *Humanity, sin and renewal* link. *The wisdom books* and *Following Jesus and the Sermon on the Mount* are shown in italics as not yet pages.
- Links may only go to this site. A link must start with "/" and a letter, digit, "_" or "-", so "//host" and "/\host" are refused.

**Refused on purpose.** `--selftest` gave 18 of 18 wrong inputs, each refused for the expected reason, with nothing written.
- **Ten are changes to the text:**
  - a changed word in a block quotation;
  - a block quotation under the wrong reference;
  - a changed word in a quoted phrase;
  - a quote cited to the wrong verse;
  - a reference that does not exist (Malachi 5:14);
  - a short reference with no book in the table;
  - a link that leaves the site;
  - a line the page cannot place;
  - a changed word in an outside quotation;
  - a fifth view on divorce.
- **Eight are changes to study_lists.py:**
  - a rule phrase not in its verse;
  - two turns of the conversation out of order;
  - a refrain list that misses a verse;
  - a quotation of Genesis 2:24 left off the figure;
  - an outside quotation looked for in the wrong source;
  - a place-marker its source does not hold;
  - a held source outside the allowed folders;
  - an exception search that also finds Mark and Luke.

**Faults caught while building:**
- The study's part 02 has no Consider or Reflect. The build first refused it. The text was not changed: part 02 is listed in `NO_QUESTIONS`, the page leaves the space out, and the build will fail once the text gains them, so the list cannot go stale.
- Two self-test cases first failed for the wrong reason, and both were fixed. One was refused with "is not in" instead of "does not come after". The other was a meaningless patch.
- A review of the plan before the code found that saved web pages (.html) must have their tags and scripts stripped before a quotation can match. That is done.

**Not checked by script:**
- The reading of any passage. The checks prove the words are the Berean's and sit in the verses cited, not that the study reads them rightly.
- The site's own lines on the page:
  - each turn's "→ part" tag;
  - the plain labels ("By birth", "A slogan in Corinth", "A question about divorce");
  - the questions over the figures.

  They are this page's summaries, written to match the study.
- The Baptist Faith and Message is checked against the copy held on this PC, not against bfm.sbc.net. The doctrinal foundation asks for that comparison before release.

**By browser, against the always-on preview, 2026-11-07:**
- At 1440, 390 and 320 wide, in light and dark, nothing runs past the right edge. The page's scroll width equals the window width at every size, and no element inside the page reaches past it at 320. The console shows no errors or warnings.
- Screenshots were taken and looked at:
  - at 1440 in light: the hero, section 00 and part 01;
  - at 1440 in dark: the hero, the Song strip (02), 1 Corinthians 6:11 (03), the three kinds (04), the case (05), the views (06) and the close;
  - at 390 in light: the hero, the turns and the case;
  - at 320: the three-question rule, the Song strip and the views in dark, and the Song's legend in light (after a fix that keeps each key beside its words).
- On phones the turns become a list down one line, the roots and the reading line are left out, and the part drawings are left out.
- A verse link reached by keyboard and opened with Enter opens its sheet and puts `?ref=GEN.2.24` in the address. Escape closes it, clears the address and returns focus to the link, with no outline drawn.
- Focusing a turn prints its verse on the reading line.
- Opening the page with `?ref=GEN.2.24` opens that sheet. `?ref=__proto__` is ignored without an error.

**Not tested:**
- 200% zoom, a screen reader, or a real phone.
- The reduced-motion setting itself. The rule is in the CSS (the ripples, sun, sparkles and lamp flames stop) but was not tried with the setting on.
- Colour contrast was not measured.
- 1280 wide was not looked at separately. The seven turns fold into rows of four below 1100.

## For the owner

- **Part 02 has no Consider or Reflect in the study text.** Every other part has both. The page shows part 02 without them. This is for the writer, not the page.
- **The study's own open questions still stand** (listed in passage-notes.md):
  - length (about 2,730 words, above the aim);
  - whether to name the rabbinic schools in part 05;
  - a Southern Baptist voice for part 06's views;
  - Proverbs 5:19;
  - how much to say on same-sex sexuality;
  - whether to say more on abuse.
- **Placement.** The page sits in Living the Christian Life, as the plan has it. The passage notes suggest the Topics card on marriage and family as the natural place to link it from, once it is built.
