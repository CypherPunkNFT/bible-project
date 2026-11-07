# The signs and works of Jesus: the mock-up and its record

**Class:** LIVING · **Built:** 2026-10-30, unattended, by overnight job 82d7aa9bf2394c4da225b8eaa003f458 · **State:** mock-up for the owner's review; not on the live site
Open: http://127.0.0.1:8931/mockups/the-signs-and-works-of-jesus-directions/ · Up: [gallery](../README.md) · Study text: [content.md](../../content/studies/jesus-christ/the-signs-and-works-of-jesus/content.md) · Design: [design.md](../../content/studies/jesus-christ/the-signs-and-works-of-jesus/design.md) · Log: [STUDY_MOCKUPS_LOG.md](../../../Pages/Topics/STUDY_MOCKUPS_LOG.md), Study 14

A Scripture & Theology study in the Jesus Christ field. Its one new move: **eight accounts drawn as cords, one touching length for each of 179 verses, with a star on the 16 that tell the deed.** It teaches a reader not to read only the deed.

## How it is built

[build-data.py](build-data.py), with [scripture_text.py](scripture_text.py) for reading the texts, takes the study's content.md, [study_lists.py](study_lists.py), the site's Berean text, the site's list of miracles and the held Barnes and Maclaren files, checks them, and writes [data.js](data.js). Run `python -B design/the-signs-and-works-of-jesus-directions/build-data.py` from the Website folder, or add `--check` to change nothing and fail if data.js is stale.

The script is a further near-copy of the same build script, because this job may not change the earlier folders. Extract a shared one when the real pages are built.

## What the checks prove, and what they do not

- **By script on every build (exits with an error if any fails):** every line of content.md is used, by a closed list of keys for each section; every block quotation is word for word the Berean at its reference; every reference resolves; each quoted phrase is in the reference that cites it, in one paragraph of its named held source near its own verse, or in the confession list under its article.
- **By script, on the cords:** every verse of each account has exactly one kind, and no kind names a verse outside it. Every count is computed. A count typed beside a counted noun fails. Others must be the largest kind. The catalogue's 35 works and five kinds are read from the site's own list, and these accounts must hold a work of every kind.
- **By script, on what is said to be there or absent:** the word beg comes in exactly five verses of Mark 5:1–20, and each row of that form holds it; "Daughter" with a capital comes only at Mark 5:34 in Mark; Mark 6:41–44 holds no word of the bread growing; Mark 6:30–44 no word of sharing hidden lunches; John 2:6–9 no blessing or prayer over the jars. Controls prove the same searches find such words where they are.
- **Retold sources:** Schreiner and Piper may hold no double quotation mark at all.
- **Not checked by script:** whether a verse is sorted rightly, whether a reading is right, whether a Scripture pair belongs together. The sorting and most interpretive wording need a person's reading.
- **The Baptist Faith and Message phrases** were compared on 2026-10-30 against what a web tool returned from https://bfm.sbc.net/bfm2000/, because that page refused a direct download. The build does not repeat this. Compare by eye before release.
- **Refused on purpose:** 33 wrong inputs were each tried in memory and refused, among them a changed block quote, a phrase cited to the wrong verse, a verse with no kind, an account with no deed, a quotation from a retold source, a typed count, a confession phrase under the wrong article and a commentary quote at the wrong note. That test is in the job's workspace, not in this folder.
- **By browser against the always-on preview:** at 320, 390, 620, 768, 860, 1000, 1101 and 1440 wide in both themes: nothing past the right edge on any reading, and no console errors. Behaviour checks: 179 marks at 24 pixels each; one tab stop for each cord; arrow keys within and between cords; the readout by pointer, focus and first tap; the account opened at its verse, marked in words; bad address values ignored; closing clears the address and returns focus; every reading and question; passage and back; the try-it fold changing nothing in the address; reduced motion. Colours on the band were measured: the faintest stroke is 5.6 to 1, against a needed 3 to 1. Screenshots were read by eye.
- **Not tested:** 200% zoom, a screen reader, a real phone.

## The three plan reviews

Theology and correctness, reliability, and platform and design reviews were run on the plan and the text before any code. What changed because of them:

- **The tie-break rule for sorting a verse was written down and put on the page,** and many kinds changed under it.
- **Sixteen deed verses, not fifteen,** after the feeding's last verses and the crossing were re-sorted under the rule.
- **The try-it fold moved inside section 01,** with no score, not in the address and not in the totals.
- **"Two roads" became three columns,** with "not recorded" cells, because two roads forced fear into one side or the other.
- **Scripture became three voices, not rows.** Job 9:8 was dropped, because the study could not show the link.
- **The text's claims were tightened:** Mark puts the news of the child's death after the woman and does not say the pause changed anything; Scripture can list spirits apart from sickness and can also name a spirit behind a bodily trouble; James 5:15 is quoted and not softened; the care note on "the Jews" names who is meant at John 9:22.
- **Engineering:** the verse in the address is checked against its account and cleared on close; the sheet scrolls to the verse after it resets; a mark counts as a click inside when deciding whether to close the sheet; one tab stop per cord; unknown bracket tokens are refused.

## Against the standard

✓ meets it · ◐ partly · ✗ not yet

| Rule | | Note |
|---|---|---|
| 1 Doctrine | ✓ | Articles 1, 2, 3, 4 and 10 quoted where they bear. A reviewer's reading, not the owner's |
| 2 History without choosing | ✓ | On whether these gifts continue the page does not choose, and names who holds what |
| 3 Berean | ✓ | Every verse and link. Rewritten from the draft's King James |
| 4 Heading | ✓ | |
| 5 Drawing and motto | ✓ | |
| 6 Figures with meanings | ✓ | Computed, each with what it means |
| 7 Claims marked | ✓ | "This study reads", named sources and care notes are labelled where they come. The older Scripture says who draws each link |
| 8 Precision | ✓ | The selection says what was chosen and why, and that sorting is judgment |
| 9 Hard questions | ◐ | Five are faced. One Baptist is read at two passages, and two modern Baptists only on one question, each in one piece |
| 10 Complete or says so | ✓ | "A selection, not a census", with a link to the catalogue |
| 11 Sources registered | ✓ | See [SOURCES.md](../../SOURCES.md), section "The signs and works of Jesus mock-up" |
| 12 Own shape | ✓ | Cords measured in verses |
| 13 Three depths | ◐ | The cord, the account, then the verse. No separate page per passage |
| 14 Parallel parts, card anatomy | ✓ | Every card and every reading has the same anatomy |
| 15 Dense, compact | ◐ | The band is one screen and a bit on a wide display. Phones scroll through it. One reading shows at a time |
| 16 Joined up | ◐ | View in the address, one sheet, links to the reader, Miracles and Encounters. Related studies have no pages yet |
| 17 Closing | ✓ | Way of reading, invitation, question, passage again |
| 18 Graphics | ✓ | Words stand beside each cord, and each mark has its verse and kind as its name |
| 19 Art | ◐ | The boat and cord are a first pass for the owner's eye |
| 20 Colour | ✓ | The Gospels' violet. Stroke and shape carry each kind |
| 21 Approved, not ruled out | ✓ | Type and fine rules. No faces and no people drawn. The cord moves slowly and can be paused |
| 22 Prose | ✓ | |
| 23 Access and checks | ◐ | See above |
| T1 Passage first and last | ✓ | |
| T2 Says, means, respond apart | ✓ | Text, then labelled readings, then You |
| T3 Scripture on Scripture | ✓ | Section 04, and the Scripture in the hard questions |
| T4 Way of reading | ✓ | The four questions in the close |
| T5 Scripture's form | ✓ | The forms come from each text |
| T6 Voice and ending | ✓ | |
