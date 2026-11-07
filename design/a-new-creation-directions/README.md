# A new creation: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30 from the first draft · **Reshaped:** 2026-11-07 to the rewritten text, by design job c94ee6add94548a59f775fd9c73c6330 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/a-new-creation-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/christian-life/a-new-creation/content.md) · Design: [design.md](../../content/studies/christian-life/a-new-creation/design.md) · Run brief: [DESIGN_RUN.md](../../../Pages/Topics/StudyPlan/DESIGN_RUN.md)

A Scripture & Theology study in Living the Christian Life, section 1. Its one habit of reading: **before you obey a command in a letter, look back for what the letter says is already true of you in Christ.** Its one shape: **the fold**, a vertical crease down the page with what a letter says is already so on its left, what it tells you to do on its right, and the letter's own joining word on the crease. The page uses the fold three times: once for each of the six parts, once for the six places the text itself names, and once for the close's own list of five things God has done.

## What changed in the reshape, and why

The writing run rewrote the study on 2026-11-06 (the old text is [content-first-draft.md](../../content/studies/christian-life/a-new-creation/content-first-draft.md)). The habit stayed the same, so the fold stayed. What the new text no longer carries went with it.

| Kept | Changed | Removed |
|---|---|---|
| The fold, its crease and joining word, the wash in the letters' colour | Six new parts (In Christ; Dead to sin, alive to God; Taking off and putting on; Truth, anger, forgiveness and love; Growing up; Pressing on), each with its own line across the fold | The five letters drawn as lines with their turns: the text no longer has that section |
| The heading, the garment drawing and its moving thread, the motto beside it | Section 02 is now the six places the text's own fold note names (Colossians 3:1, Romans 6:11, Romans 12:1, Ephesians 4:25, Colossians 3:12, 2 Peter 1:5), not eight chosen by the page | The three commands to look back from: their text is gone |
| Each part opening in place beneath its line, built once and only shown or hidden | The close's list ("you died with Christ, so count yourself dead to sin; …") is drawn as five lines across the fold, the text shown once | The four Beholds and Colossians' two rails: their captions are gone |
| Ephesians' four three-part lines, now inside part 04 | The frame paragraph has a place under the figures; the subtitle sits under the title | The two page files for the removed sections (nc-turn.js and nc-back.js); they remain in the git history |
| The one sheet from the right, for a verse or a hard question, with the way back | Six questions, four of them reworded, and new labels: "Other Christians" and the confessions | The 2px focus outline (the owner's rule: no focus ring) |

## How it is built

[build-data.py](build-data.py) reads the study's content.md, [study_lists.py](study_lists.py), the site's Berean text and the held confessions, checks them, and writes [data.js](data.js). [scripture_text.py](scripture_text.py) reads the Berean (a copy of the model's). [held.py](held.py) reads the held Baptist Faith and Message, Second London Confession and Luther's Small Catechism, one article or section at a time. [folds.py](folds.py) builds and checks the lines across the fold, Ephesians' four lines and the close's pairs. [build_selftest.py](build_selftest.py) holds the wrong inputs. Change the words in content.md and run the script.

- `python -B design/a-new-creation-directions/build-data.py` builds; `--check` runs every check and fails if data.js is out of date; `--selftest` tries the wrong inputs in memory. Any failure exits 1 and leaves data.js as it was; a wrong argument exits 2.
- The fingerprint in data.js covers only this study's inputs, so another job editing a shared frame file cannot make this page read as stale.
- Frame and sheet styles are borrowed, read-only, from the Authors and Manuscripts mock-ups, as before.

## What the checks prove, and what they do not

- **By script on every build (exit 1 if any fails):** every non-blank line of content.md is placed by a closed list of rules, or the build stops. Every block quotation is word for word the Berean at its reference. The one that stops inside its last verse (Romans 12:18–19) is allowed by name only at a sentence end, and the page prints how the verse goes on. Every reference resolves with no gap, including short forms such as "(4:25, 28, 29, 32)" after a book name. Each quoted phrase is in the verse cited beside it. With no reference beside it, the phrase must be in a verse its paragraph cites, in its part's main readings, or in the passage printed just above. Baptist Faith and Message phrases must be in the article their paragraph names (IV, V or VII) in the copy held on this PC. The Second London Confession and Luther's phrases must be in their own section. Each line across the fold has its phrases in their verses as whole words, inside its span. Each part's line is inside that part's own main reading. The six places in section 02 must be the ones the text's fold note names, in its order. The close's five pairs must rebuild to the exact paragraph. Italics must be a known study whose mock-up folder has a page, or a known book title. Links stay on the site. Source links are https or a site page. Page files are the expected nine, with one `innerHTML` for the fixed drawings and no inline script or handler. Every entry in every list is used.
- **What one entry allows:** "a foothold" in the question on anger is checked against its own verse, not the reference later in the sentence (Ephesians 4:31), which belongs to the next clause. Four quoted words are the text's own, not Scripture: "since" and "for this very reason" (named as joining words), "try to be new" (what Paul does not say), and "there is a new creation" (another translation's wording).
- **Not checked by script:** whether a reading is right, whether a pairing is right, or which place a part turns on. Choosing that place for each part is this study's reading, and the page says so under the six lines. What Calvin and Wesley are said to have written is described, not quoted, and each place carries the text's own "to check" note. Punctuation is not compared in the confessions: the held Second London Confession has a comma after "death" that the study leaves out.
- **Refused on purpose (`--selftest`, 26 of 26 refused for the right reason on 2026-11-07):** a changed word in a block quotation; a block quotation under the wrong reference; one that stops mid-verse where none is allowed; a changed word in a quoted phrase; a made-up quotation; a quotation cited to the wrong verse; a reference that does not exist; an off-site link; a protocol-relative link; an unknown italic; a key in the wrong place; an unknown paragraph tag; an unknown source marker; a changed confession phrase; a confession phrase credited to an article its paragraph does not name; a seventh question; a close pair without its "so"; a place the text names that the list leaves out; a confession phrase searched in the wrong section; an unused list entry; a fold phrase not in its verse; a joining word that is only part of a word; a part's line outside that part's reading; one of Ephesians' lines with words from another verse; a study link to a folder with no page; a `javascript:` source link. Also tried by hand: a data.js one byte stale fails `--check` (exit 1), and an unknown argument exits 2.
- **By browser against the always-on preview (2026-11-07):** at 1440, 390 and 320 wide in light and dark, the page draws with no console errors, and nothing scrolls past the right edge (page width equals window width at every size). Nothing visible pokes out either: the only boxes past the edge were the closed sheet, the shared site header's scrolling menu and the drawing's clipped lines. Every button and summary is at least 44 pixels tall. A verse link opens its sheet, with its address. Escape closes it and returns focus to the link. A part opens beneath its line, with the address, and only one is open at a time. Arrow keys and End move along the six lines with one tab stop and no outline. A question opens on the sheet with its verse, then "This study reads", then Calvin's note marked to check. A verse opened from inside a question has a way back to the question. Opening straight on a passage works. An old or wrong address (`?reading=old-and-new&sheet=bogus&question=nope`) is ignored and opens part 01. Screenshots were looked at: the multi-word joining words ("on account of", "For this very reason") first wrapped over the crease, so the crease was widened.
- **Not tested:** 200% zoom, a screen reader, measured colour contrast, a real phone, the reduced-motion version in an emulator (its rule is in the CSS, unchanged from the first build), and hover on a touch screen.

## For the owner

- **The text says "six letters"; its readings come from eight books.** The Selection says the study "walks nine passages from six letters". Nine passages is right if the two Ephesians 4 readings and the two Colossians 3 readings each count as one. The main readings come from 2 Corinthians, Romans, Ephesians, Colossians, James, Hebrews, 2 Peter and Philippians. The build prints this every run. The words are the writing run's, so the page shows them as written.
- **Twelve notes in the text are still marked to check**, in four kinds: the crisis and domestic-violence phone numbers ("before publishing"); Calvin on Romans 12:1; Calvin on Ephesians 4:26; Calvin and Wesley on Romans 7. Each shows on the page as a small "to check" tag, and the build lists them each run.
- **Which place each part turns on** is this mock-up's choice: 2 Corinthians 5:15, Romans 6:10–11, Colossians 3:9 (the text calls it "the fold at its clearest"), Ephesians 4:32, 2 Peter 1:3–5 and Philippians 3:12 (the command comes first, with no joining word).
- **The card line in the design catalog is now out of date.** It still describes fourteen places, five letters and three look-backs. A line for the run's last step: *One fold down the page: what a letter says is already so on the left, what it tells you to do on the right, the letter's own joining word on the crease. Six parts each open beneath their line; the six places the text names; the close's five "so"s across the same fold; and six hard questions.*

## Which page it could be confused with, and why it is not

**Faith in daily life** also pairs an instruction with its reason, so it is the nearest in idea. That page sorts each reason by where it points, toward the Lord or toward another person, and its shape is six everyday rooms. This page reads one direction only, from what is already so to what to do, and its shape is one crease that never changes. Bearing witness uses doors and Faith under pressure uses dark layers. Nothing swings or descends here.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles IV, V and VII quoted where they bear, each checked in its article |
| 2 History without choosing | ✓ | Romans 7, the law's use and God's choosing are left open as the text leaves them |
| 3 Berean | ✓ | Every verse and link |
| 4 Heading | ✓ | Trail, gold concepts, title with its turn in gold italic, subtitle, lead, drawing in a faint circle and dotted orbit, two-line motto |
| 5 Drawing and motto | ✓ | "Made new. / Now grow into it." beside the garment hung ready |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", "Left open", "Other Christians", named sources, "to check" |
| 9 Hard questions | ✓ | Six, each on the sheet with its verse first |
| 12 Own shape | ✓ | The fold |
| 13 Three depths | ◐ | The line, the part, the verse. No separate page per passage |
| 17 Closing | ✓ | The close's pairs, way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words carry every meaning; colour never alone |
| 23 Access and checks | ◐ | See "Not tested" above |
| T1 Passage first and last | ✓ | 2 Corinthians 5:17 opens the page, and 5:14–17 closes it |
| T4 Way of reading | ✓ | Taught on the fold, shown in six places, stated in the close |
