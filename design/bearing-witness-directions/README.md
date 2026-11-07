# Witness and the nations: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30 for the first draft ("Bearing witness"); **reshaped 2026-11-07** to the rewritten text, unattended, by job 44351daa1a7745a6aa426a4818be45ef (step 35 of the page-design run) · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/bearing-witness-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/bearing-witness/content.md) · Design: [design.md](../../content/studies/christian-life/bearing-witness/design.md) · Brief: [DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)

Study 09, in Living the Christian Life. The writing run replaced the first draft with a new study, *Witness and the nations: telling others about Jesus*: seven passages (Matthew 28, Romans 10, Romans 15, 2 Corinthians 4, 1 Corinthians 3, Philippians 1, Colossians 4:5–6), four questions readers ask, and a close on Romans 10:9–17. The old text is kept beside it as [content-first-draft.md](../../content/studies/christian-life/bearing-witness/content-first-draft.md). The folder keeps its old name, so links to it still work.

## What was kept, and what changed

- **Kept:** the habit the page teaches (*in any passage about witness, ask whose part is whose*), which the new text keeps word for word; the standard heading; the one sheet from the right for verses and questions, with Back, Escape and outside click; the address that opens a verse or a question directly; the frame and sheet styles borrowed read-only from the Authors and Manuscripts mock-ups; the letters' colour.
- **Reshaped:** the old threshold figure (a doorway with God above, the speaker near, the hearer beyond, ten passages chosen one at a time on the sill) became **section 03, a table of all seven passages against the close's three questions**, all visible at once. The study's own "Whose part is whose" line for each passage is quoted under its row.
- **New:** the heading drawing (a city on a hill, three rings, a chain reaching out, a shoot at the edge); **section 01, the chain of Romans 10:14–15**, the page's main figure; the rings of Acts 1:8 inside part 01.
- **Removed:** the wall of six doors over Colossians 4:2–6, the five doors of the New Testament, and "Sort it yourself". Their text is gone from the study: the new passage notes say the draft's door, wall and sort blocks were not carried over. The scripts behind them (`bw-wall.js`, `bw-threshold.js`, `bw-thread.js`, `bw-sort.js`) were deleted from this folder; they are in the project's git history.
- **Shown in full, not behind a selector:** the old page kept one reading open at a time. The new text says it "walks seven passages", and part 06 carries its care notes, so all seven parts are on the page in order, with an index above them.

## The page

Heading (trail, Sent · Heard · Grown, the title with its turn, the lead, 1 Corinthians 3:6, the drawing and motto, four computed figures, what was chosen and two words) → **01** the chain → **02** the seven passages, each with its main reading, also-quoted verses, text, labelled notes, its limits, Consider and Reflect → **03** whose part is whose → **04** questions readers ask (in the sheet) → close (the way of reading, the invitation, the question, "Read the passage again", and Romans 10:9–17 printed beside it), the way back to Living the Christian Life, a line of ground with seed, watering and shoot, and the sources.

## How it is built

[build-data.py](build-data.py) reads the study's content.md and writes [data.js](data.js), with [study_lists.py](study_lists.py) (the figures' phrases and the named sources), [figures.py](figures.py) (the figure checks and the page-file check), [held.py](held.py) (the Baptist Faith and Message held on this PC) and [scripture_text.py](scripture_text.py) (an unchanged copy of the model page's Bible-text reader). The parser started from the Christian and the state build, the same writing-run format; that folder was not changed.

- `python -B design/bearing-witness-directions/build-data.py` builds; `--check` fails if data.js is not what the build would write; `--selftest` tries wrong inputs in memory and writes nothing; any other argument exits with an error.
- data.js is written to a temporary file and moved into place, so the preview never serves half a file. The page checks `schema: 2` and shows a plain message if data.js is missing or from the old build.
- The `--check` fingerprint covers content.md, every `.py` in this folder and the held confession file. It does not cover the shared frame files, so another job editing those cannot make this page read as stale; the build instead checks that each shared file it borrows exists.

## What the checks prove, and what they do not

**By script on every build (exit 1 if any fails):**
- every non-empty line of content.md has one place on the page, or the build stops; each part has exactly one main reading, one "Its limits", one Consider and one Reflect; the opening is lead, verse, what was chosen, two words; the close is four paragraphs and a Passage;
- every block quotation is word for word the Berean at its reference. One, Revelation 7:9, is the verse's first sentence only; the build allows a quotation that is the verse's opening whole sentences and the page says "first sentence" beside it;
- every reference resolves, including whole chapters and chapter runs ("Romans 9–11", "Isaiah 52–53");
- every quoted phrase is in the verse cited for it, or (with no citation) in a verse its paragraph cites, its part's readings or the passage just above it;
- every Baptist Faith and Message quotation is in its own article of the copy held on this PC, and where the line names an article it is that one;
- every italic is either a study on the link list (all 14 have a mock-up folder) or a listed title or term; every link stays on this site; every list entry is used;
- the chain's links are the verses' own four "how can they …" verbs and then "sent", in order; each Berean phrase in the chain, the rings and the table is in its verse and inside its part's passage, and in one place only; every sentence the page quotes from the study is in the study; the study's "It walks seven passages" matches its seven parts;
- index.html loads exactly the expected scripts, with no inline script or handler; one `innerHTML`, for the fixed drawings.

**Refused on purpose:** `--selftest` tries 34 wrong inputs and each is refused for the right reason (34 of 34 on the last run): a changed word in a block quotation, a block under the wrong reference, a block cut off mid-sentence, a changed quoted phrase, a quotation cited to the wrong verse, a change inside nested quotes, a verse and a chapter range that do not exist, a link off the site in four forms, a stray line, an unknown heading, an unknown italic, a list item in an unknown form, a second "Its limits", Main readings in an unknown form, a fifth close paragraph, a changed confession quotation, a confession quotation under the wrong article in the text, a not-held quotation the mark would miss, a confession quotation searched in the wrong article, a false misquote entry, unused list entries, the chain with a link missing or out of order, a chain phrase not in its verse, a chain link given a place without the study's words, a study line the study does not have, a phrase from outside its passage, a phrase in two places, the rings out of order and a missing table row. A stale data.js fails `--check`.

**Not checked by script:** whether a reading is right, or a phrase rightly placed in the table. The placements are this page's judgment and the page says so under the table.

**By browser, against the always-on preview, 2026-11-07:** at 1440, 390 and 320 wide in light and dark: the page itself never scrolls sideways (the shared site header clips its own menu on phones, as on every mock-up), the study data loads, no console errors or warnings. A verse link opens its sheet and Escape closes it, with focus back on the link; a verse opened by keyboard (Enter) works the same; a question opens in the sheet; an address naming a question opens straight on it; a made-up address is ignored. Screenshots were looked at for the heading, the chain, the rings, the table, a part, the close and phone layouts.

**Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone, the reduced-motion version in a browser (the stylesheet stops the light along the chain, and the pause button hides itself).

## Findings for the owner (the study's text was not changed)

1. **One misquotation.** Part 06 quotes Philippians 1:17 as "to add to the distress of my chains". The Berean reads "can add to the distress of my chains". The page marks it beside the quotation; the build confirms both readings.
2. **Two quotations not compared.** No copy of the Abstract of Principles (1858) or the New Hampshire Confession (1833) is held on this PC. Each quotation carries a gold mark saying so.
3. **Eleven notes the study still has to check** show as gold diamonds where they stand: the definition of "unreached", the people-group explorer, the five crisis lines, the 2012 statement's wording, the year of the International Mission Board's rename, the North American Mission Board's founding year, and current mission figures.
4. **The people-group explorer.** The text points the reader to "the site's people-group explorer … by country and language". The only explorer in the site's code is the Muslim-world explorer on the worldviews page, which covers Muslim peoples only. No link was made; the note stays for your decision.
5. **Two judgments made by this page,** both said on the page in words: the verse names no sender for "sent", so the chain quotes the study's close, which counts sending among God's acts, and notes that its missions question shows churches sending; and 2 Corinthians 4:4, "the god of this age", is shown as "another hand", outside the three places, as the study's own line ("An enemy blinds") has it.

## Could be confused with

- **The good news** (its heading drawing is a road with footprints from an open door). That is why this page draws no footprints and no road: a city, rings and a chain.
- **The Christian and the state**, whose build this one's parser started from. That page is two columns around a coin, in violet; this one is a chain of five links and a seven-row table with three columns, in the letters' gold.
- **Faith in daily life** (rooms) and **Faith under pressure** (layers), its neighbours in the same field.

## Against the standard

✓ meets it · ◐ partly

| Rule | | Note |
|---|---|---|
| Doctrine | ✓ | Articles IV, V, XI, XIV and XVII quoted where the text quotes them, each checked in its article |
| History without choosing | ✓ | Miraculous gifts and election shown without choosing; Lumen Gentium and Pinnock labelled as others' views |
| Berean | ✓ | Every verse, link and sheet |
| Heading, drawing and motto | ✓ | |
| Figures with meanings | ✓ | Computed, each says what it means |
| Claims marked | ✓ | "This study reads", "Left open", "Other Christians", "Care", "Its limits" labelled where they come |
| Hard questions | ✓ | Four, in the sheet |
| Own shape | ✓ | The chain and the seven-by-three table come from Romans 10 and the close's three questions |
| Dense, compact | ◐ | All seven parts are long; the index helps, but the page is long on a phone |
| Joined up | ◐ | Verse sheet, part ↔ table links, 14 study links to mock-ups; no live pages yet |
| Art | ◐ | A first pass for the owner's eye |
| Access | ◐ | See "Not tested" |
| Passage first and last | ✓ | 1 Corinthians 3:6 opens; Romans 10:9–17 is printed at the close |
| Says, means, respond apart | ✓ | Text, labelled notes, then Consider and Reflect |
