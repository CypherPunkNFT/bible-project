# Angels, demons and spiritual powers: the mock-up and its record

**Class:** LIVING · **Built:** 2026-11-07, as step 6 of the page-design run ([DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/angels-demons-and-spiritual-powers-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/god-and-christian-faith/angels-demons-and-spiritual-powers/content.md) · Design: [design.md](../../content/studies/god-and-christian-faith/angels-demons-and-spiritual-powers/design.md) · Limits and sources: [passage-notes.md](../../content/studies/god-and-christian-faith/angels-demons-and-spiritual-powers/passage-notes.md) · Standard: [STUDY-STANDARD.md](../../../Pages/Study/STUDY-STANDARD.md)

Study 53, a Scripture & Theology study. Its one habit: **read the text as far as it goes, and stop where it stops.** The study takes Deuteronomy 29:29 as its rule ("the secret things belong to the LORD our God, but the things revealed belong to us"), and every part has the same three sub-heads: what the text shows, what it means, what Scripture leaves unsaid. The page draws that rule as a line. Section 00 splits the verse across a dashed divide and lays out an edge chart, one row per part: what the text reveals on one side, what it leaves unsaid on the other. Then every part crosses the line once: two columns in full light, a dashed rule marked "Here the text stops", and a quieter, veiled band beyond it where the views stand side by side under "Shown, not chosen".

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) (a copy of The good news mock-up's reader) and [study_lists.py](study_lists.py) (this page's own lists), reads the study's content.md, checks it against the site's Berean text and the held copies of the outside sources, and writes [data.js](data.js). Run it from the Website folder:

- `python design/angels-demons-and-spiritual-powers-directions/build-data.py` writes data.js.
- `--check` runs every check and fails if data.js is stale. It writes nothing.
- `--selftest` feeds twelve wrong inputs in memory and proves each is refused for the right reason. It writes nothing.

The page is [index.html](index.html), [js/adp.js](js/adp.js), [js/art.js](js/art.js) and [css/adp.css](css/adp.css). The frame is borrowed from the Authors and Manuscripts mock-ups, as in the model. Nothing under `src/` was touched, and content.md was not changed: it has no "[check: …]" link notes to resolve.

The study text is in a different shape from The good news, with three sub-heads per part, bullet views and short references like "(16:10 · BSB)". So the parser is this page's own. Only the reader of the Berean is shared.

One direction was built, because the text already existed.

## The page

- **Opening.** The standard heading: the study trail; the concepts in gold capitals (Angels · The adversary · Demons · The powers); the title in ink with *spiritual powers* as its gold italic turn. The lead is the study's own opening, Elisha's servant at Dothan, with 2 Kings 6:16 printed in full. Beside it, in a faint circle and dotted orbit, the hills round a small walled town full of chariots of fire: wheels, low cars and slow flames along two ridges. The motto is "Open his eyes / that he may see.", the words of 2 Kings 6:17, checked in that verse. No riders, faces or figures of God, of Christ, of an angel or of a demon.
- **Four counts**, each with its rule and what it means: 295 verses with "angel", "angels" or "archangel" (109 in the Old Testament, 186 in the New); 78 verses naming Satan or the devil; 73 with "demon" or "demons"; and two holy angels named, Gabriel in 4 verses and Michael in 5. A note under them says these are verses, not passages, and names what the words miss (cherubim, seraphim, "the host of heaven", "the sons of God").
- **00 The line Moses drew.** The study's frame paragraph; Deuteronomy 29:29 split at its "but" across a dashed divide, "The LORD's" on one side and "Ours" on the other; the neighbouring-studies paragraph; the three questions, each with its own mark (an open eye, a dashed edge, an arrow that points up); then the edge chart.
- **01–07.** Each part is one band: a large number, the title, the hook in italic, the main readings and a small drawing. Under them, "What the text shows" and "What it means" side by side, then the dashed edge, the veiled "What Scripture leaves unsaid", and "Where it points" with Consider and Reflect. The same three marks label the sub-heads all the way down. The drawings are a line with light above it (01); Peter's cell door open, with the chain fallen (02); the spring in the desert (03); a hedge round a house, with a line outside it that stops at the hedge (04); the synagogue door (05); the cross with the record of debt nailed to it and struck through (06); and a shield and sword (07).
  - **Part 01, one line.** "All things were created through Him and for Him" sits above a rule. Below it are thirteen created things, each opening its verse: Paul's list from Colossians 1:16, and the host, angels, sun, moon and stars and sons of God from Nehemiah 9:6, Psalm 148 and Job 38:7.
  - **Part 06, the order in Colossians 2:13–15.** Seven steps in the passage's own order, from "God made you alive with Christ" to "triumphing over them by the cross". The last three are marked as the victory.
- **Close.** The same hills, ordinary now. Then the closing paragraph and the pairs Romans 8:38–39 names, set on fine rules around "the love of God that is in Christ Jesus our Lord". The passage follows in full, then the question, then "Read the passage again before you answer.", then the sources and a link back to God & Christian Faith.
- **Every reference**, including the short ones ("16:10"), opens its verses in a sheet from the right, in the Berean. The sheet's reference goes in the address (`?ref=`).

**Colour:** the Prophets' blue. The opening, Elisha's prayer that his servant's eyes be opened (2 Kings 6, among the Former Prophets in the Hebrew order), and the study's two glimpses behind the curtain (Zechariah 3, Daniel 10) all come from the prophets.

## Why it does not look like its neighbours

- **The page it could be confused with is The hope to come** ([the-hope-to-come-horizon](../the-hope-to-come-horizon/)). Both studies have a "what it leaves open" step in their concepts, and both set Baptist views side by side. They differ in three ways. The hope to come is built on a horizon and on cards, with "Several maps" as one section of its own. Here the boundary is a single dashed line, drawn from one verse, that every part crosses at the same point. And the views sit inside the veiled band of the part they belong to, never in a section of their own.
- **[The good news](../the-good-news-directions/)** runs its parts down one thread with a sticky left rail. This page has no rail and no thread: each part is a full-width band split across the page.
- **[Faith under pressure](../faith-under-pressure-load-bearing/)** and **[Covenants and promises](../covenants-signs/)** both have a wide hero picture and a coloured band. This page keeps the standard circled drawing and has no bands.

## What the checks prove, and what they do not

**Recorded run, 2026-11-06 20:48 local time:** `python design/angels-demons-and-spiritual-powers-directions/build-data.py --check` printed "build-data: all checks pass; data.js is current" and exited 0. The preview answered 200 for the page, data.js, both scripts and the stylesheet. The page loaded with its title, its heading, 7 parts and 168 verse links, nothing wider than the window, and no console errors or warnings.

**By script on every build** (all pass on 2026-11-07):
- Every non-blank line of content.md is placed on the page. The opening and the close must have the shape the page places, each part must have its main readings, its three sub-heads in order, Consider and Reflect, and the study must carry exactly three questions.
- Every block quotation is word for word the Berean at its reference: 2 Kings 6:16, Deuteronomy 29:29 and Romans 8:38–39.
- Every reference exists in the Berean, with no gap in a range: 125 different passages. "Jude 6" and "Jude 9" are read as Jude 1:6 and 1:9.
- A short reference such as "(16:10 · BSB)" takes its book only from a table in study_lists.py, keyed by part. The build fails on a short reference with no entry, and on an entry the text no longer uses.
- Any "chapter:verse" left unlinked in the text fails the build.
- A quotation with its own reference beside it must be in that reference. That includes `("Does Job fear God for nothing?" 1:9 · BSB)` and pairs like `"Be silent!" and "Come out of him!" (1:25 · BSB)`. A quotation without one may be in a verse its paragraph cites, its part's main readings, or the passage printed above it. A quotation under three words with no reference beside it must be pinned to its verse. Four are pinned: "by the finger of God" to Luke 11:20, "Him" and "for Him" to Colossians 1:16, and "to accuse" to Zechariah 3:1.
- Phrases are matched as whole words, ignoring case, punctuation and quotation marks. A phrase cut by "..." is checked piece by piece.
- **20 of the 21 quotations from outside Scripture are found by script in the copies held on this PC.** Each is listed by part, with its source and a place-marker. It must be found within 1,500 characters of that marker, so a common phrase ("of the devil", "Without doubt") cannot pass on text from another chapter. The sources are Calvin's *Institutes* (Allen, 1813, Internet Archive scan), Boyce's *Abstract*, Justin's *Dialogue with Trypho*, Augustine's *On the Trinity* and *On Christian Doctrine*, Jamieson, Fausset and Brown, and the site's copies of the Second London Confession and the Orthodox Longer Catechism.
- One correction is made to a held copy, never to the study: the Calvin scan reads "the same chief **augel**" where the printed book has "angel". The fix is named in study_lists.py.
- Held sources may only be read from `BibleProject/sources/` and `Website/data/creeds/`.
- Every drawn phrase is in its verse: the motto, the thirteen created things and the rule over them in part 01, the edge chart's seven "revealed" phrases, and the ten words of Romans 8:38–39 with its centre line. The seven steps of Colossians 2:13–15 must be in the passage **in that order**.
- Each edge-chart row names only people the part itself names. Where a part sets out its views as a list, there must be exactly one name per view: three in part 02, two in part 03, three in part 04.
- The counts are made from the Berean on every build. Gabriel must be in exactly the four verses listed and Michael, the angel, in exactly the five (Daniel, Jude and Revelation only; the men called Michael in Numbers, Chronicles and Ezra are not counted).
- A study named in the text links to its mock-up only if that folder holds an index.html. Study 18 and Study 30 link; Study 15 and Study 25 are shown in italics as not yet pages. Study 25 is being designed in this same run, but its page was not finished when this was built.
- Links may only go to this site.

**Refused on purpose.** `--selftest`, run 2026-11-07: 12 of 12 wrong inputs were refused, each for the expected reason, and nothing was written. Nine are changes to the text: a changed word in a block quotation; a block quotation under the wrong reference; a changed word in a quoted phrase; a quote cited to the wrong verse; a reference that does not exist (Jude 26); a short reference with no book in the table; a link that leaves the site; a line the page cannot place; and a changed word in an outside quotation. Three are changes to study_lists.py: an outside quotation looked for in the wrong chapter of its source; a place-marker the source does not hold; and a quotation given to the wrong held source.

**A real fault the checks caught while building.** A continuation such as "Hebrews 13:2; 1 Peter 1:12" was first read as "Hebrews 13:2" plus "Hebrews 13:1". The "1" of "1 Peter" was taken as a verse. It is fixed, and overlapping references now fail the build.

**Not checked by script:**
- The one sentence from the Baptist Faith and Message 2000 (Article III, "Through the temptation of Satan man transgressed the command of God"). No copy is held on this PC. A search of the project folder for it ran out of time and found nothing. The page says so under its sources. Compare it with bfm.sbc.net by eye before release.
- The reading of any passage. The checks prove the words are the Berean's and sit in the verses cited, not that the study reads them rightly.
- The section and chapter numbers given for outside sources ("*Institutes* I.14.7", "question 106"). The place-markers place each quotation in the right passage of its source, but the printed number beside it is not compared.

**By browser, against the always-on preview, 2026-11-07:**
- At 1440, 390 and 320 wide, in light and dark: nothing runs past the right edge (the page's scroll width equals the window width at every size) and the console shows no errors. Screenshots were taken of the hero, section 00, parts 01, 02, 03, 04 and 06, and the close, and were looked at.
- A verse link reached by keyboard and opened with Enter opens its sheet and puts `?ref=2KI.6.15` in the address. Escape closes it, clears the address and returns focus to the link, with no outline drawn.
- Opening the page with `?ref=DEU.29.29` opens that sheet. `?ref=__proto__` is ignored without an error.

**Not tested:** 200% zoom, a screen reader, a real phone. The reduced-motion rule is in the CSS (flames, fire, glow and sparkles stop) but was not tried with the setting on. Colour contrast was not measured.

## For the owner

- **Section.** The passage notes record that no field fits angels well, and that a sixth, "The unseen world", was offered as an alternative. The page follows the brief and sits in God & Christian Faith.
- **The hero drawing** draws the chariots of fire as wheels and flames, with no horses or riders, so that nothing in the unseen world is given a body. If you want horses, they can be added as line drawings without riders.
- **Two open questions from the passage notes still stand.** Whether a believer can be troubled by a demon from within is shown from the texts only, with no named holders; the page says "The texts are shown; no view is chosen". And whether to explain that the Hebrew of Job 1–2 says "the satan".
