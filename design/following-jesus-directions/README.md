# Following Jesus: the mock-up and its record

**Class:** LIVING · **State:** built, mock-up only, not on the live site (2026-11-07, page-design run, study 16). Open at http://127.0.0.1:8931/mockups/following-jesus-directions/ on this PC.

Design: [design.md](../../content/studies/jesus-christ/following-jesus/design.md). Wording: [content.md](../../content/studies/jesus-christ/following-jesus/content.md). Limits: [passage-notes.md](../../content/studies/jesus-christ/following-jesus/passage-notes.md). Model: [The good news](../the-good-news-directions/README.md). Run brief: [DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md).

## What is built

One direction, because the text already existed: **read the line inside the whole.** The Sermon on the Mount is drawn as one band of 111 verse marks (Matthew 5:1–7:29), with the two frames Matthew built arched over it: the listeners (5:1–2 and 7:28–29) and "the Law and the Prophets" (5:17 and 7:12). Ten famous lines sit above the band as words; choosing one labels it at its verse and marks who is listening, what came just before and where the passage is going, each answered in the Berean's own words. The same band, thin, follows the reader through the six sermon parts and lights the part being read. Each part has one drawing taken from its own verses (the nine "Blessed are" lines; six sayings with "it was said" above a ground line and "But I tell you" below; three practices with the same refrain; the rich man's "I" and "my" counted; the Law-and-Prophets arch; four pairs). Parts 07 "Count the cost" and 08 "Come to Me" stand side by side, as the study asks. Part 09 is a vine with one leaf per verse that says "remain". Every reference opens its verses in a sheet. Full description in [design.md](../../content/studies/jesus-christ/following-jesus/design.md).

## How it is built

| File | What it does |
|---|---|
| [build-data.py](build-data.py) | Reads content.md, checks every quotation, reference, fact and link, and writes [data.js](data.js) (`window.FJ`). `--check` runs every check and fails if data.js is stale; `--selftest` feeds 20 wrong inputs in memory. Run from `Website/`. |
| [scripture_text.py](scripture_text.py) | Byte copy of the model's: loads the Berean from `data/plain/bsb`, resolves references, compares words. |
| [study_lists.py](study_lists.py) | This study's own lists: the sermon's range, the frames, the ten famous lines and their three places, the drawings' phrases, the stated counts, the crisis numbers, the care notes, the wording swaps, the study links, the sources. Every phrase in it is checked against its verse on each build. |
| [selftest.py](selftest.py) | The 20 wrong inputs and the reason each must be refused for. |
| [index.html](index.html) | The shell: the site frame, then the scripts. Strict content policy: scripts from this site only, no outside requests. |
| [js/fj-core.js](js/fj-core.js) | Shared helpers and the verse sheet. All study text goes in as text nodes. |
| [js/fj-map.js](js/fj-map.js) | The band: one mark per verse, arches, the part spans, the three place marks (a square for who, a ring for before, an arrow for after). |
| [js/fj.js](js/fj.js) | The page: opening, the map, the parts and their drawings, the question, 07 beside 08, the vine, the close. |
| [js/art.js](js/art.js) | The fixed line drawings: the two houses under rain, the mountain at the close, the four pair drawings. No person is drawn. |
| [css/fj.css](css/fj.css) | The look: the Gospels' violet for the study, the site's gold for concepts, care notes and notes still to check. |

The address keeps the view: `?line=` holds the chosen famous line and `?ref=` the open verse sheet. Both are looked up in data.js's own lists, so an unknown value is ignored.

## What the checks prove, and what they do not

**The build** (`python design/following-jesus-directions/build-data.py`) passes, then `--check` passes. It refuses, with the line and the reason, if:
- any block quotation is not word for word the Berean at its reference (partial block quotes must be one unbroken run of the verse's words);
- any quoted phrase is not in a verse its paragraph cites;
- a reference does not exist in the Berean;
- a link leaves the site;
- a phrase the page draws (a famous line, a beatitude promise, a pair, the rich man's words, a vine verse) is not in its verse;
- a stated count is wrong. The counts are 111 verses, six "But I tell you", five "have heard that it was said", "remain" 12 times in 7 verses, and the rich man's first-person words;
- a crisis number is not in the site's checked help lines, [life.json](../../src/data/resources/life.json);
- a care note is lost or turned into a plain paragraph;
- a wording swap (below) no longer applies;
- the parts' ranges do not cover the sermon exactly once.

**The self-test** (`--selftest`) feeds 20 wrong inputs in memory, and each is refused for the expected reason; data.js is not touched:
1. a changed word in a block quotation;
2. a block quotation under the wrong reference;
3. a changed word in a quoted phrase;
4. a quote cited to the wrong verse;
5. a reference that does not exist (Matthew 5:1–49);
6. a link that leaves the site;
7. a protocol-relative link (`//host`);
8. a line the page cannot place;
9. a relative "verse 16" outside its part;
10. a crisis number that is not a checked help line;
11. a care note turned into a plain paragraph;
12. an unpaired quotation mark;
13. a famous line's phrase changed;
14. a famous line's verse outside its whole;
15. a wrong count in a stated fact;
16. a wording swap that no longer applies;
17. a beatitude promise changed;
18. a pair's phrase under the wrong verse;
19. a study link that leaves the site;
20. the parts' ranges with a gap.

**In a browser** (Playwright, 2026-11-07), at 1440, 390 and 320 wide, light and dark:
- nothing reaches past the right edge (page width equals window width at all three);
- no console errors or warnings;
- a verse link opens its sheet with the right passage, and Escape closes it, returns focus to the link and clears `?ref=` from the address;
- `?ref=JHN.15.4` opens that verse on load;
- `?ref=zzz&line=__proto__` is ignored and the page draws normally.

I looked at the screenshots myself. That pass found one fault, now fixed: in the vine, two verse numbers were partly covered by their leaves and by the stem.

**What the checks do not prove.**
- The Berean comparison is not blind to everything. Block quotations ignore only straight versus curly quotes and the kind of dash. Short quoted phrases also ignore quotation marks and apostrophes, the case of their first letter, and a comma or full stop at either end. A phrase with "…" is checked piece by piece, so the words left out are not checked. A change of only those things would pass.
- The study's own sentences between quotations are not checked against anything; they are the study's wording as written.
- The "three places" for each famous line (who, before, after) are this page's reading aids. The build checks that each place's phrase is in its verse, not that it is the best choice.
- The six "[check: …]" notes in content.md stay open. They concern the Mishnah and Talmud sayings, Jewish "yoke" language, the Lutheran and dispensational readings, and the just-war limits. The page shows each as a small gold "check" mark.

**What was not tested.**
- A real screen reader.
- Windows high-contrast mode.
- Print.
- Firefox and Safari: Chromium only.
- Touch on a real phone: phones were imitated by window width only.
- The reduced-motion setting was read in the CSS and not switched on in the browser. Under it the rain stops.

## Findings (written as they came)

**Four places where the study's wording is not the Berean's,** plus one counting sentence that is slightly off. Each was found by reading the verses before building. The build refuses each as written. For the first three, the page shows the Berean's words through a short named list in [study_lists.py](study_lists.py) (`MISQUOTE_FIXES`). The build fails if the study's wording ever changes so that an entry no longer applies. content.md was not changed. Each needs the owner's word before content.md is corrected:

1. **Part 06 quotes 1 John 5:13** as "I write these things to you who believe". The Berean has "I have written these things to you who believe". [passage-notes.md](../../content/studies/jesus-christ/following-jesus/passage-notes.md) already flags this as its open question 2.
2. **Part 02 quotes "be holy, for I am holy" at Leviticus 19:2.** The Berean at 19:2 has "Be holy because I, the LORD your God, am holy." The nearest wording, "be holy, because I am holy", is at Leviticus 11:44.
3. **The care note in part 02 quotes "Do not resist an evil person"** as Jesus' words. The Berean at Matthew 5:39 has "But I tell you not to resist an evil person". The page shows the Berean's words. The build's note about this swap ends "…does not" only because those two words pin it to the one care note.
4. **Part 04 quotes the Law's "bad eye" at Deuteronomy 15:9.** That is the Hebrew idiom, not the Berean, which has "look upon your poor brother begrudgingly". The text already marks it "[check: the idiom in the Hebrew of Deuteronomy 15:9]". The page shows it on the list of outside sources as the Hebrew's wording, not as a Berean quotation.
5. **Part 02 says "Six times He says, 'You have heard that it was said… But I tell you'".** "But I tell you" is in six verses (5:22, 28, 32, 34, 39, 44). "You have heard that it was said" is in five; at 5:31 the Berean has "It has also been said". The quotation is left as written, since both halves are in the section's verses. The sentence would be exact as "Six times He sets what was said beside 'But I tell you'". Counted by script.

**The crisis lines in part 02** (988, 024, 800 911 2000, 188) are each in the site's checked list, [life.json](../../src/data/resources/life.json). The build checks this on every run.

**No content.md changes.** None of the six "[check: …]" notes is a link note; all are facts still to verify, so there was nothing to turn into a link.

## Links in the study

Each "Read more in …" is shown in italics. It is a link only where that study already has a mock-up on this PC (listed in `STUDY_LINKS` in [study_lists.py](study_lists.py)). The studies with mock-ups are:
- Prayer across Scripture;
- The kingdom he announced;
- Sexuality, singleness and divorce;
- Leviticus: holiness and sacrifice;
- Who do you say that I am?;
- Saved by grace;
- The cross, the empty tomb and the throne;
- Witness and the nations;
- The good news.

Four are not yet pages and are shown as plain italics: The Christian and the state, The Ten Commandments, Fear, anxiety and despair, and Money, possessions and generosity. *Chosen and kept* is also plain italics. *The Cost of Discipleship* is a book and is never linked. The run's last step adds the real links.

## The page it could be confused with

- **[Faith under pressure](../faith-under-pressure-directions/)** also draws rain on a building. Its picture is the storm and the wall that holds, a picture of enduring. Here the rain is only the test in Matthew 7:24–27. The page is organised by **where a line sits in a passage**, not by pressure and endurance, and its drawings come from verse positions and counts.
- **[The kingdom he announced](../the-kingdom-he-announced-directions/)**, the sister study, places parables by verse along a chapter. Here **one 111-verse speech is the whole**, shown with its two frames as arches. The reader starts from a famous line and is shown its listeners, what came just before and where the passage is going. The band then follows the reader through the reading, which no other page does.
