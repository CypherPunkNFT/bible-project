# Historic preachers: a costed plan for one catalogue record per sermon

Written 2026-11-26. **A plan only.** I changed no catalogue data, downloaded nothing and left the ~34,000 untracked reconciled records alone. The machine-readable plan is beside this file: [historic-sermons-split-plan.5046654718d849d0b2b4eb9252ad5193.json](historic-sermons-split-plan.5046654718d849d0b2b4eb9252ad5193.json).

**Where this should live:** the brief asked for a new dated folder at `Website/content/library/reports/sermons-campaign/2026-11-26-historic-splitting/` holding `REPORT.md` and `plan.json`. This job was read-only, so the service refused that write. Moving these two files there unchanged (renamed `REPORT.md` and `plan.json`) is the only filing step left.

**Done since:** the first round (Calvin, Bullinger, Flavel, Sibbes, Owen and the 26 namesake corrections) in commit `75ce992f7`. Steps 6–13 are reported in [RESULTS-steps-6-13.md](RESULTS-steps-6-13.md), and the remaining zeros with their reasons in [zeros-20261126.md](../zeros-20261126.md) (all 2026-11-26).

## The answer in brief

- **Most of the work does not need splitting scanned books.** The library already holds **clean, hand-typed transcriptions** (Text Creation Partnership TEI, which is public domain, CC0) for nearly every preacher who matters here. They mark each sermon with `<div type="sermon">`, a heading and the printed Bible text. One small parser covers Calvin, Bullinger, Flavel, Sibbes, Rutherford and Watson.
- **Calvin is the big win: about 520 distinct sermons**, with delivery dates and printed texts in the headings. They include all 159 Job sermons and 190 of the 200 Deuteronomy sermons, which helps Deuteronomy and Job, two books that are short of sermons on the site.
- **Calvin's Deuteronomy does not need the Princeton scan.** The same 1583 edition (STC 4442) is already held as clean text, TCP A17698. The Princeton/archive.org copy is a 1,412-page image scan. The owner's no-scans rule rules it out as a text source, and the clean text makes it unnecessary.
- **Perkins on Jude cannot become 66 sermon records honestly.** The "66 sermons" appear only on the title page. Neither the clean 1606 text nor the 1631 Works prints the sermon breaks: the text is divided by verse into 21 units. The honest result is 21 verse-unit records labelled as an exposition that came from sermons, plus one series record that cites the title page.
- **Several large "zeros" are not mainly sermon gaps:** Bunyan's 1,026 is mostly *Pilgrim's Progress* editions and translations (519 records). Rutherford's 366 is his *Letters*. Owen's 427 includes chapter sections of treatises. Bunyan's real sermon-form works number **18**, already in the catalogue as 174 duplicate "treatise" records.
- **The no-scans rule completely blocks Robert Murray M'Cheyne and John Gill.** Their sermons are held only as Internet Archive page scans with the host's machine-read text. It also blocks most of Boston's and Goodwin's collected works, and any Ryle expansion.
- **Steps 1–11 and 13 add about 1,190 sermon records**, all of them checked counts. That includes Bullinger (about 150), who is on the page with 1; without him it is about 1,040. The optional Edwards/Whitefield extras (step 12) could add roughly 30 more. The plan also adds about 110 units derived from sermons (Watson's 88 *Body of Divinity* topics and Perkins's 21 Jude verse units), plus Perkins's other expositions. These go on passages without being counted as sermons. **Money cost: $0.** It is local parsing with no AI model and no downloads. The time estimate is about 8–11 working sessions.

## What is held, and in what form

Counts were measured on 2026-11-26 from the reconciliation file list (`private-catalog.jsonl`), the catalogue (18,702 works) and the held files themselves. "Sermon divs" are counted `<div type="sermon">` elements, de-duplicated by TCP id. Only texts where the preacher is **named first** are counted (see the namesake section for why).

| Preacher | Page now (works / sermons) | Clean text held | Sermons in clean text (checked) | Scan / host OCR only | Rule blocks? |
|---|---|---|---|---|---|
| Calvin | 350 / 0 | 16 TCP sermon books; Monergism modernised e-books of the same | **542 divs → ~520 distinct** (Deut 190 of 200, Job 159, Ephesians 48, Galatians 43, Divers 23, Ps 119 22, Jacob & Esau 12, Melchizedek 9, small 16; the 16 Ten Commandments sermons are already in the Deuteronomy series and the 3 *Homilies* repeat *Four godly sermons*) | 112 OCR files | No |
| Flavel | 131 / 1 | TCP ×20, CCEL ThML ×6 | **88**: *Fountain of Life* 42, *Method of Grace* 35, *England's Duty* (Rev 3:20) 11 | Whole Works OCR ×15 copies | Rest of Works only |
| Sibbes | 152 / 0 | TCP own ×31, Monergism | **84** across 14 TCP texts (*Bowels Opened* 20, *Returning Backslider* 16, *Beams of Divine Light* 11, *Glorious Feast* 9, …) + up to 7 that exist only in the e-books | Grosart Works scans (L02) | No |
| Owen | 427 / 0 | CCEL ThML "Sermons of John Owen" (= Goold vols 8–9) | **73** (16 published in his lifetime + 57 posthumous); TCP singles and Monergism e-books are the same sermons | Goold scans (L02), OCR ×247 | No |
| Boston | 194 / 0 | Monergism e-books only (modern transcriptions) | **103** numbered (*Sixty-Six Sermons* 66, *Liberty to the Captives* 10, *Christ Jesus Duly Prized* 8, *I Count All Things But Loss* 8, *Amiable Professors* 7, *Christ's Invitation* 4) | 12-volume Whole Works: OCR only (717 OCR "SERMON n" lines over ~10 copies) | Yes, beyond the 103 |
| Goodwin | 166 / 0 | Monergism *Ephesians 1–2*; TCP own ×24 | **~75**: Ephesians 65, *On Repentance* 2, ~8 Parliament/occasional sermons | Works 1681 and Nichol: OCR only | Yes, the rest |
| Rutherford | 366 letters / 0 | TCP, CCEL ThML, Monergism | **45**: *Trial & Triumph of Faith* 27 (TCP shows 54 divs = 27 sermons at two levels), *Communion Sermons* 14, 4 single printed sermons; + up to 16 more from *Quaint Sermons* after de-duplication | – | No |
| Watson | 146 / 0 | TCP own ×30 | **28 sermons** (*Seven Sermons* 7, 10 added to *Beatitudes*, 9 printed singles, *Heaven Taken by Storm* 2) + **88 topic units** of *Body of Divinity* | Body 1806 scans (L02) | No |
| Bunyan | 1,026 / 0 | TCP ×44, CCEL, Gutenberg, Monergism | **18** sermon-form discourses (each already a record, 174 records between them) | 866 OCR files | No |
| Perkins | 114 / 0 | TCP ×50 | **2** true sermons (Zephaniah) + **21** Jude verse units + other expositions derived from preaching (Matthew 5–7, Revelation 1–3, Hebrews 11, Galatians) | Works 1626/1631 scans (L02) | No |
| Charnock | 61 / 0 | TCP, CCEL, Monergism | **1** (sermon on 2 Cor 5:19, A32722). His other works are printed as "Discourses" (derived from sermons) | OCR | No |
| Knox | 31 / 0 | TCP ×10 | **1** (Isaiah 26 sermon, 1565, A04931): his only printed sermon | – | No |
| Gill | 73 / 0 | Body, Cause of God, commentary | **0** in clean text | *Collection of Sermons and Tracts*: OCR only | **Yes, entirely** |
| M'Cheyne | 5 / 0 | Chapel e-booklets with no sermon headings | **0** in clean text | *Sermons*, *Additional Remains*, *Memoir & Remains*: OCR only | **Yes, entirely** |
| Edwards | 473 / 64 | TCP own ×28 | 15 single printed sermons; overlap with the 64 already catalogued not yet resolved | OCR ×342 | – |
| Whitefield | 365 / 58 | TCP ×62 | 95 sermon headings in 24 texts; probably about 18 new (Gurney's shorthand *Eighteen Sermons*, 1771) once matched to the 57 in the Works | OCR ×228 | – |
| Ryle | 93 / 29 | Monergism/Chapel tracts (no sermon headings) | 0 found beyond the selection | 473 OCR "SERMON n" lines | Yes, for expansion |
| Bullinger *(on the page with 1)* | 19 / 1 | TCP | **154**: *Decades* 50, *Hundred Sermons on the Apocalypse* 101 divs, 3 singles | – | No |

"Clean text" means hand-typed TEI (TCP), CCEL ThML, Gutenberg text or publisher-made e-books. **Internet Archive "djvu" text is machine-read (OCR) from scans.** I treat it as covered by the owner's rule. It is never used as a text source in this plan, only as a page locator if needed.

## How the parser finds each sermon

| Source | Marker to key on | Main text | Example (checked) |
|---|---|---|---|
| TCP TEI | `<div type="sermon" n="…">` plus its `<head>`; collection prefaces and tables are separate `div` types | the first `<q>` or `<bibl>` under the head, or the verse numbers quoted at the start | Calvin Deuteronomy: "On Wednesday the xx. of March. 1555. The first Sermon vpon the first Chapter." + Deut 1:1ff. Flavel: "Serm. 42 … ACT. X.XLII." Sibbes: "SERMON I. CANT. V. I." |
| CCEL ThML | `<div2 title="Sermon …">` under a `div1` part ("Sermons Published During the Lifetime…", "Posthumous Sermons: Part II") | `<scripRef>` in the sermon's opening (Owen's file has 3,685) | Owen: 16 + 1 + 30 + 13 + 13 |
| Monergism e-book | `<h1–h4>` matching `SERMON [IVX…]` or "The First Sermon" | heading suffix ("SERMON I.—Revelation 19:11…") or first paragraph | Boston *Sixty-Six Sermons* 66; Rutherford *Communion Sermons* 14 |

Rules carried over from the existing pipeline ([catalog-campaign-sermons.py](../../Website/scripts/catalog-campaign-sermons.py), [sermon-passages.py](../../Website/scripts/sermon-passages.py)): record a passage only where the source prints one, and convert it with the project's Scripture index. Misprints and unbounded ranges are listed in the run report, never guessed. Old-style dates in headings ("xx. of March. 1555") are kept as printed witnesses and not converted. A sermon whose head is not tagged gets no record until it is found in the text.

**Checked repair lists, so nobody is surprised:** Calvin Deuteronomy has `n` = 1–200 but 12 numbers are missing (39, 48, 60, 61, 67, 73, 84, 107, 111, 115, 117, 157), 70 appears twice, and there are 28 "missing pages" gaps. Those 12 headings are lost or untagged. Locate them inside the neighbouring sermon or leave them as "boundary unverified": never fill them from the scan. Calvin Job has 159 sermons but only 152 distinct `n` values, so its numbering needs repair from the head ordinals. Bullinger's *Decades* restart `n` at 1 in each decade, so key on decade + sermon.

## Namesakes and misattributions to clear first

These records are on the Preachers page under the wrong person today. Each was checked against the held file's library author string (with dates) or its title.

| Filed under | Record (catalogue id ends) | Actually |
|---|---|---|
| Thomas Watson | *Lectures on the Principles and Practice of Physic* ×4 (…3757acd7, …564bf261, …9d14f19a, …cf84c91a) | Sir Thomas Watson (1792–1882), physician |
| Thomas Watson | *A Copy Book* ×5 (…17b372be, …4e0f6dd7, …ae301733, …ec3b1ab8, …f1df116e) | Thomas Watson of Newport Pagnell, writing master |
| Thomas Watson | *Holsome and Catholyke Doctryne … Seuen Sacramentes* (…0837f925); *Twoo Notable Sermons* (…902d3aab) | Thomas Watson (1513–1584), Catholic bishop of Lincoln |
| John Owen | *History of the … British and Foreign Bible Society* ×3 (…69c4f916, …c463de97, …d5e2b619) | John Owen (1766–1822) |
| John Owen | *The True Way to Loyalty*; *Immoderate Mourning for the Dead* (…96a8b6dd, …0daaae75) | John Owen, chaplain to Lord Grey of Ruthin |
| John Owen | *Epigrams of … Mr. Iohn Owen, Gentleman* (…c0cd9741) | John Owen the Latin epigrammatist (d. 1622) |
| John Owen | *Poema* (…1f7376a5, from CCEL) | not checked: confirm before keeping |
| Thomas Goodwin | *Moses and Aaron*, *Romanae historiae anthologia*, *Demeanour of a Good Subject* (…5e4cafc3, …e88c0568, …080e677a) | Thomas Goodwin (1586/7–1642), schoolmaster |
| Thomas Goodwin | *Of the Happiness of Princes* ×2, funeral sermons ×3 (…1929c2f4, …40f72bca, …2e537ce6, …c79b9edd, …e241dccc) | Thomas Goodwin of Pinner (1650?–1716?), his son |
| John Bunyan | *Bunyan's Pilgrim's Progress, in Verse* (…8095b0ff) | E. P. Dyer's verse adaptation |
| John Murray *(author group)* | *A Godly and Fruitfull Sermon Preached at Lieth*; *Nehemiah, or the Struggle for Liberty* | two earlier John Murrays, not the Westminster professor (1898–1975) |

**Traps for the splitting itself:** these were found in the held files and are not yet records under the wrong preacher. Count a preacher only when **named first** in the source's author field.
- 24 of the 48 TCP texts that credit Goodwin (124 sermon divs) are really John Preston's, Sibbes's or Jeremiah Burroughs's books, which Goodwin edited or prefaced (*Life Eternall*, *Gospel-Worship*, *The Rare Jewel of Christian Contentment*, *Bowels Opened*).
- 7 of the TCP texts that credit Sibbes (78 divs) are Preston's or Gataker's (*The Breast-plate of Faith and Love*, *The New Covenant*, *The Saints' Qualification*, *The Saints' Daily Exercise*).
- TCP N01911 (*Some Important Truths about Conversion*, 7 sermons) is Increase Mather's, not Owen's.
- Calvin's library name also matches Calvin Coolidge, Calvin Colton and Calvin Batchelder. Whitefield's matches George Whitefield Samson and Chadwick. Ryle's matches his son, Bishop Herbert Ryle. Edwards's matches Jonathan Edwards the younger (1745–1801). Bonar's matches mostly Horatius, not Andrew.
- Some Whitefield records are unauthorised shorthand reports ("Taken by a master of short-hand"). Whitefield disowned some of these. Label them as reports, not as his own text.

**How to fix without touching the untracked records:** add a committed overlay that the Teachers build merges, the way the passage overlays already work: work id → "not this preacher", with the real name and the evidence. Alternatively, re-bind by file hash in [identity-corrections.json](../../Website/content/library/identity-corrections.json). Do not edit or delete the reconciled files.

## Order: most sermons for least work

Effort is my estimate, in working sessions of about 3 hours each. Counts are the checked figures above.

| # | Job | Sermons added | Effort | Why this position |
|---|---|---|---|---|
| 0 | Namesake overlay (table above) | removes 26 wrong records | 0.5 | Must come first so counts are honest |
| 1 | **TCP sermon parser + Calvin** (Deuteronomy, Job, Ephesians, Galatians, Psalm 119, Jacob & Esau, Divers, small books) | **~520** | 2 | One parser; texts and dates are in the headings; fills Deuteronomy and Job |
| 2 | Bullinger *Decades* + *Apocalypse* (same parser) | ~150 | 0.5 | Moves him off 1. He is outside the brief's list but on the page |
| 3 | Flavel (same parser) | 88 | 0.5 | Clean, numbered, texts printed |
| 4 | Sibbes (same parser; Preston trap) | 84 (+7) | 0.5 | |
| 5 | Owen (ThML parser) | 73 | 1 | Second parser, but one clean file |
| 6 | Rutherford (TCP + e-book) | 45 (+16) | 0.5 | Small; de-duplicate *Quaint Sermons* against the singles |
| 7 | Boston (e-book parser) | 103 | 1 | Big yield; modern transcription; source terms not yet reviewed |
| 8 | Goodwin (e-book Ephesians + TCP singles) | ~75 | 1 | Same e-book parser; Preston/Burroughs trap |
| 9 | Watson (TCP) | 28 (+88 topic units) | 0.5 | Smaller once *Body of Divinity* is kept as topic units |
| 10 | Bunyan: re-label 18 discourses, link the 174 duplicates to them | 18 | 1 | Identity work, not splitting |
| 11 | Perkins: Jude 21 verse units + Zephaniah 2 | 2 (+21 derived) | 0.5 | Honest result is small |
| 12 | Edwards / Whitefield extras (match by printed text against the L03 inventory) | ≈15 + ≈18, unconfirmed | 1 | Heavy de-duplication, small net gain |
| 13 | Charnock, Knox | 1 + 1 | – | Do them alongside step 1 |
| – | M'Cheyne, Gill, Ryle expansion, the rest of Boston's and Goodwin's Works | 0 | – | **Blocked by the no-scans / no-OCR rule** |

The first five steps use two parsers. They deliver about 915 of the roughly 1,190 sermons in this plan, which is about three-quarters.

## The two sub-jobs ready to start now

**1. Perkins, *Exposition upon the Whole Epistle of Jude*.** The asset is already held: TCP A09434 = STC 19724.3, 1606, edited by Thomas Taylor, CC0. It is at `sources/library/source-tcp-bulk/asset-bulk-tcp-a09434/original.xml` (1,139,557 bytes, sha256 `30364c9d…3cb3613`). The title page says "containing threescore and sixe sermons preached in Cambridge". The text has **21 `<div type="verse">` units** (n = 1, 4–21, "22,23", "24,25"), each headed `<bibl>Vers. N.</bibl><q>…</q>`. It has no sermon headings or numbered breaks. I also checked L02's 1631 Works vol. 3 machine-read text: no "Serm. N" breaks in Jude either. **Deliverable:** one series record (title-page claim "66 sermons", stated as unrecoverable), 21 component works classed as exposition derived from sermons, each with its verse range as main text, which covers all 25 verses of Jude. No sermon count is claimed. The L02 scan is not needed. Effort: about 0.5 session.

**2. Calvin, *Sermons upon Deuteronomie* (1583).** I checked the asset and its conditions:
- The Princeton record page refused automated reading (HTTP 403) today, so I could not re-read its wording. Its archive.org item `sermonsofmiohnca1583calv` does exist. It reads: 1583, London, Henry Middleton for Thomas Woodcocke, contributed by Princeton Theological Seminary Library, `possible-copyright-status: NOT_IN_COPYRIGHT`, no access restriction, **1,412 page images at 400 ppi**. So it is a scan. Under the owner's rule it is at most a link for page images, and it is **not to be downloaded or read by OCR**.
- The **same edition is already held as clean text**: TCP A17698 (STC 4442, ESTC S107166), 11.4 MB, sha256 `f824773b…9abb`. Its header says "Phase I text … Creative Commons 0 1.0 Universal". The label question therefore does not arise for this text. As the coverage report warned, the No Known Copyright label says nothing about modern Calvin editions such as the Monergism modernisations. Those count only as extra copies of the same sermons.
- **Deliverable:** 200 sermon works. 188 are cleanly bounded today. The 12 lost headings are listed above; recover them from the text or flag them as boundary unverified. Each work gets its printed delivery date (1555–56) and its quoted Deuteronomy passage. The existing whole-book records (TCP, Monergism) become the container and witnesses. Effort: about 1 session inside step 1.

## What must not be counted, and how this plan avoids it

1. **One work per sermon, many witnesses.** A sermon found in TCP, CCEL, a Monergism modernisation, a Chapel abridgment and an OCR scan is **one** work. The others attach as editions or assets, with `abridgment` and `modernization` set. Identity key: preacher + series + ordinal where printed. Otherwise use preacher + printed main text + normalised title, confirmed by the opening words.
2. **Count work ids, never files.** This follows the sermon-coverage report's rule. Collection volumes stay as containers (`is-part-of`) and are not counted as sermons.
3. **Known overlaps already removed from the figures above:** Calvin's *Ten Commandments* (16) are inside Deuteronomy; Calvin's *Homilies* (3) repeat *Four Godly Sermons*. Flavel's *Christ Knocking at the Door* (12) is *England's Duty*. Sibbes's *Union with Christ* (21) is *Bowels Opened*. Owen's *Posthumous Sermons of 1756* (13), *Excellency of Christ* (4) and his TCP Parliament sermons are all inside the CCEL 73. Rutherford's TCP *Trial & Triumph* (54 divs) is 27 sermons. Rutherford's Parliament sermons in the e-book are TCP A57979 and A92145.
4. **No invented deliveries.** Expositions derived from sermons (Perkins on Jude, Matthew 5–7, Hebrews 11 and Galatians; Charnock's *Discourses*; Watson's *Body of Divinity* topics, which follow the catechism and not 176 deliveries) become **units derived from sermons**. They can carry main texts and so light chapters on the page, but they do **not** add to "sermons". This follows L03's precedent with Edwards's *History of Redemption*.
5. **First-named author only.** This avoids the Preston/Burroughs/Mather inflation (202 divs in the traps above).
6. **A check before the page is rebuilt.** The run fails if any new sermon shares a printed text and an ordinal with another of the same preacher's sermons, or if any preacher's total exceeds the checked ceiling in the plan file.

## Which of the 39 zeros should stay zero

**Authors, not preachers, for this campaign (18). Their zero is honest:** Zacharias Ursinus, William Ames, Francis Turretin, Herman Witsius, Archibald Alexander, Charles Hodge, A. A. Hodge, Abraham Kuyper, B. B. Warfield, Herman Bavinck, Geerhardus Vos, Louis Berkhof, J. Gresham Machen, John Murray, J. I. Packer, D. A. Carson, James R. White, Samuel Zwemer. *A caveat, checked:* Alexander (*Practical Sermons*), Hodge (*Princeton Sermons*, which are outlines, plus four single sermons) and Warfield (*Faith and Life* chapel talks, *The Gospel of the Incarnation*, two sermons) have small sermon-form books in the catalogue. They are optional later and are not part of this plan.

**Zero, but only because of what is held:**
- Brainerd (journal), John G. Paton (autobiography), William Carey (his 1792 sermon was never printed) and Andrew Bonar (held as biographer; the "Bonar" sermon e-books are Horatius's) are not sermon gaps the library can fill.
- G. Campbell Morgan, Billy Graham, John MacArthur and Sinclair Ferguson have 0 works on the page because their campaigns are separate. Morgan, Graham and MacArthur have their own sermons-campaign folders. They are outside this plan.

**Zeros this plan fills:** Calvin, Owen, Sibbes, Flavel (1 now), Boston, Goodwin, Rutherford, Watson, Bunyan, Perkins, Charnock, Knox.

**Zeros the no-scans rule keeps:** M'Cheyne and Gill. Show both as "sermons held only as scans" so the zero is not read as "never preached".

## Cost, rules and boundaries

- **Money:** $0. It is local parsing of files already held: no AI model calls, no paid service, no downloads. The batch-work rule is not triggered, because every sermon boundary comes from markup. If a later step does call a model per sermon, it must go through BatchRunner with a pilot and a budget.
- **Rights:** TCP Phase I texts are CC0. CCEL allows personal and educational use and the site links out. Monergism and Gutenberg are marked "unreviewed" in [sources.json](../../Website/content/library/sources.json). Read their terms before step 7, as the campaign brief requires. Chapel Library is manual-only.
- **Untracked records:** new sermon and container records are new committed files. Links to the reconciled duplicate whole-book records and the namesake exclusions go in committed overlays. No reconciled file is edited.

## Method and reproduction

Read-only scans run from this job's workspace (`C:\FortressOrchestrator\workspaces\5046654718d849d0b2b4eb9252ad5193\`, scripts named `*.5046654718d849d0b2b4eb9252ad5193.py`):
- profile every catalogue work by author id;
- stream `campaign-reconciliation/catalogue/private-catalog.jsonl` for held files by author string;
- count sermon markers per held file (TEI `div type="sermon"` and `head`, ThML `div title`, e-book `h1–h4`, OCR "SERMON n" lines for information only);
- collapse by TCP id and first-named author;
- inspect the key texts by hand.

Not done: a full proofread, matching the Edwards/Whitefield extras by printed text, checking the *Quaint Sermons* overlap, and a line-by-line look at Sibbes's *Beams of Divine Light* (11 divs with no headings).
