# The wisdom books: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 32 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-wisdom-books-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/explore-the-bible/the-wisdom-books/content.md) · Limits: [passage-notes.md](../../content/studies/explore-the-bible/the-wisdom-books/passage-notes.md) · Design: [design.md](../../content/studies/explore-the-bible/the-wisdom-books/design.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 65, an Explore the Bible study of Job, Proverbs, Ecclesiastes and the Song of Songs. Its one habit: **before you
ask what a line promises, ask who is speaking and what kind of saying it is.** The page practises the habit before it
asks the reader to: every printed Bible passage carries a speaker line above its words (who speaks, what kind of saying
it is, and, where Scripture itself judges the speaker, God's verdict in His own words).

## What is built

- **The standard heading:** study trail (Study / Explore the Bible / The wisdom books), the four concepts in gold
  capitals, *The wisdom* in ink with *books* in gold italic, the lead, and Job 28:28 under its speaker line. Beside it,
  in a faint circle and dotted orbit, a windlass over a mine shaft, its bucket going slowly down past veins of silver
  and back up, and the motto "Silver from the mine. / Wisdom from God." No face or figure of God. Four counts with what
  they mean: 4 kinds of saying, 14 voices, 29 uses of "under the sun" in Ecclesiastes, 26 verses printed in full.
- **00 Who is speaking?** The habit, the setting and the selection, then the main figure: four books as four columns of
  floating words on a fine teal line, each headed by its kind of saying with a small shape for the kind (two facing
  arcs, a balanced pair, an open arc, a wave). Each voice opens a verse where it speaks. Eliphaz and his two friends
  carry God's verdict on what they said about Him (Job 42:7); Elihu does not. Three columns end on one gold line, named
  the fear of the LORD and quoted at each point in its own verse's words ("the fear of the Lord", "The fear of the
  LORD", "Fear God"). The Song's column stops short on a dashed line at "love is as strong as death" (8:6), with the
  sentence: the Song does not name the fear of the LORD, and this page does not add it. The care note with the crisis
  lines follows directly.
- **01 The shaft (Job 28):** six layers in the poem's order going down, each a verse link, the shaft darkening with
  depth, an empty bottom ("Wisdom is not down there."), and a teal line rising through the shaft to "God knows the way"
  (28:23) and the verse that opens the study (28:28).
- **02 What God asks (Job 38–41):** what the reader is told (the council in heaven, 1:6) set against what Job is told
  (nothing of it, in the study's words); the sixteen things God shows Job as floating words along one arc in the text's
  order, each opening its verse; God's words to Job and to the friends side by side.
- **03 Two doors and two tables (Proverbs 1–9):** the same line over the front door (1:7) and the back door (9:10),
  the shared words in gold; Wisdom's table and Folly's table side by side, their calls word for word the same (9:4 and
  9:16), what each offers, and what Folly does not say (9:18).
- **04 The pair (Proverbs 26:4–5):** "Do not answer" mirrored against "Answer", then three sayings each set beside what
  stands next to it (Proverbs 16:8, Ecclesiastes 7:15, and the study's own line on Proverbs 22:6).
- **05 Fourteen pairs (Ecclesiastes 3:2–8):** read out of the Berean by the build and laid in two columns of short words.
- **06 The refrains (Song of Songs):** the clause "Do not arouse or awaken love until the time is right" once, with its
  three verses, and the three lines of belonging stepping down the page, the changing half in teal. The two Baptist
  readings of the Song sit side by side at equal size; the page chooses neither.
- **Close:** the way of reading as four questions, the close, the invitation, the question for the reader, and Job
  28:20–28 printed in full under its speaker line, then the sources and a back link to Explore the Bible.
- **Every reference** opens its verses in a sheet from the right (the model's sheet), in the Berean, and puts the
  verse in the address; Escape closes it and returns focus to the link. Notes the study still has to check show as
  small gold marks where they stand.
- On phones the arc and the shaft drawing are left out and their words stay as plain lists; the four columns, the
  doors, the tables, the pair and the two readings stack in the desktop order.

## How it is built

[build-data.py](build-data.py) (adapted from The Christian and the state build), with [figures.py](figures.py),
[held.py](held.py), [study_lists.py](study_lists.py), [build_selftest.py](build_selftest.py) and
[scripture_text.py](scripture_text.py) (an unchanged copy of The good news build's reader), reads content.md, checks it,
and writes [data.js](data.js) by a temporary file swapped into place. Run from the Website folder:
`python -B design/the-wisdom-books-directions/build-data.py`; add `--check` to run every check and fail if data.js is
stale, or `--selftest` to try the wrong inputs below. The page is [index.html](index.html), [js/wb.js](js/wb.js),
[js/figures.js](js/figures.js), [js/art.js](js/art.js) and [css/wb.css](css/wb.css). All text goes in as text nodes;
only the fixed drawings in art.js are markup. The `?ref=` value is looked up as an own key of data.js.

The page loads six shared files from other mock-up folders, as every study mock-up does: the theme script from
[who-do-you-say-that-i-am-directions](../who-do-you-say-that-i-am-directions/js/theme.js), the frame
([frame.css](../authors-directions/shared/frame.css), [frame.js](../authors-directions/shared/frame.js)),
[teachers.css](../authors-directions/teachers/teachers.css), [ms.css](../manuscripts-directions/css/ms.css) and the
[favicon](../letters-shared/favicon.svg). The build fails if one is missing. It does not fingerprint them, so another
job's edit to a shared file cannot make this page's `--check` fail; a change to one could still change this page's
look, which only a browser check would show.

## What the checks prove, and what they do not

- **By script on every build:** every non-blank line of content.md is placed on the page. Every block quotation is
  word for word the Berean at its reference. Every reference exists with no gap, and every chapter range ("Job 38–42")
  exists. A quoted phrase followed by its own references is in one of them; any other is in a verse its paragraph
  cites, its part's main readings or the passage printed just above it. The three Baptist Faith and Message quotations
  are each found in their own article (IV, XIII, XVIII) of the copy held on this PC. "Begotten, not made" (the Nicene
  Creed) is not held, so the build adds a mark to it and fails if the mark is missing. Links stay on the site, and each
  study link goes to a plain mock-up folder name.
- **The figures, by script:** every printed passage has exactly one speaker line. Every voice, floor point, layer,
  question, door, offer and line of belonging is in its verse, and every verse a figure uses lies inside a passage the
  study itself cites (the page adds none). Only Eliphaz and his two friends carry God's verdict, and that verse names
  Eliphaz. Exactly three books meet the shared line, and each point on it holds the word "fear". The shaft and the
  questions are in the text's order. The two doors share "The fear of the LORD is the beginning of". The two calls are
  the same verse word for word. Proverbs 26:4 begins "Do not answer" and 26:5 "Answer". Ecclesiastes 3:2–8 holds
  exactly 14 pairs and the study says "Fourteen pairs". The refrain clause comes exactly three times in the Song and the
  study says "Three times". Each line of belonging changes its second half.
- **Refused on purpose:** `--selftest` tried 34 wrong inputs in memory, writing nothing, and all 34 were refused for the
  right reason. Among them: a changed word in a block quotation, a block quotation under the wrong reference or cut
  short, a changed word in a quoted phrase, a quote cited to the wrong verse, a verse and a chapter range that do not
  exist, four kinds of link that leave the site (a full address, `//`, a tab, a backslash), a line the page cannot place,
  an unknown heading or italic, a changed word in a confession quotation or one searched in the wrong article, the
  Nicene phrase in a form the mark misses, a third note under the paired heading, a missing or extra speaker line,
  Elihu given the friends' verdict, the Song drawn as meeting the shared line, a floor point that misquotes its verse,
  a voice from a verse the study does not cite, layers or questions out of order, a question word not in its verse,
  Folly's call from a different verse, the pair's heads swapped, a wrong count of times, a fourth refrain verse, a
  wrong line of belonging, a study phrase the study does not have, and an unused own-term entry.
- **Two rules looser than the model's, on purpose:** (1) a block quotation may leave out a verse's opening speech
  formula and nothing else: Job 1:21 opens "saying:" in the Berean, the study quotes from "Naked", and the page prints
  "the verse opens 'saying:'" under it. (2) A quotation with several references must be in one of them, not all:
  "He mocks the mockers, but gives grace to the humble" is cited to Proverbs 3:34, James 4:6 and 1 Peter 5:5, and the
  two letters word the line differently; likewise "So I hated life" (Job 3:1; Ecclesiastes 2:17).
- **By browser against the always-on preview:** 1440, 390 and 320 wide, light and dark. The page never scrolls
  sideways at any width; the only elements past the right edge on phones are inside the shared site header's own
  sideways-scrolling menu. No console errors or warnings. A verse link opens its sheet and puts it in the address;
  Escape closes it, clears the address and returns focus to the link; a keyboard Enter on a focused link opens it too.
  Screenshots were looked at; three faults found that way were fixed (the motto overlapping the drawing, the shared
  gold line stepping between columns, words colliding at the top of the arc).
- **Not checked by script:** the study's paraphrases of Athanasius, the Talmud, the Mishnah, the Targum, Origen,
  Bernard, Gill, Spurgeon and Akin; each still carries the study's note to check. The 15 notes to check in the text,
  including all seven crisis and helpline numbers, show as gold marks.
- **Not tested:** a real phone, a screen reader, 200% zoom, the reduced-motion version in a browser (the CSS stops the
  bucket, the orbit and the sheet's slide), and colour contrast was not measured.

## Not to be confused with

The page this could most easily be confused with is [Reading the Bible well](../books-in-their-settings-directions/README.md),
another Explore the Bible page that also uses the Poetry teal and draws a lamp in its heading. That page lights one
step at a time and teaches reading a verse inside its book; this one puts a speaker line on every passage and draws
four books as four kinds of saying ending on one line. It is also unlike [The book of Psalms](../praying-the-psalms-directions/README.md),
which draws all 150 psalms as one picture: nothing here is a map of a whole book.

## Study text

content.md was not changed. It has no "[check: …]" link notes to resolve. Ten named studies link to their mock-ups on
this PC; The hope to come links to its record page, the-hope-to-come-directions.

## What needs the owner's word

The fifteen notes the study still has to check (passage-notes.md lists them), above all the crisis and helpline numbers
and article XVIII's wording against the current confession.
