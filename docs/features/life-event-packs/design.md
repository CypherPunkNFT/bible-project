# Life-event verse packs — design

**Status:** reviewed, ready to implement. Written in the research & design step (job 718, sequence 33 "Bible Guide chain D: life moments", step 1, 2026-11-07); reviewed once and corrected in place in step 2 (2026-11-07, see the Review section at the end). Implementation (step 3) follows as a separate job.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 6 — "Weddings, baptisms, new babies, graduations and similar: chosen passages plus a printable card for each."
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)

## 1. What we are building, in one paragraph

A small section of the site, **/life-events**, with one page per life event (wedding, new baby, baptism, graduation and eleven more). Each page offers a hand-chosen set of Berean Standard Bible passages, sorted by use: longer readings for a ceremony, short verses for a card, and a blessing to speak aloud. Each passage carries a one-line note on why it fits and, where a verse is often lifted out of context, an honest context note. Below the passages, a card maker lets the visitor add names, a date and a short message, preview the result, and print it on a home printer as a folded greeting card, a sheet of small cards, a frameable display print, or a clean sheet of the readings. Printing uses the browser's own print dialog (which also offers "Save as PDF"), so nothing new is installed and nothing costs anything to run. Each page is written to be found by the searches people actually make ("bible verses for a wedding", "baptism verses", "graduation bible verses").

## 2. Research

### 2.1 What people search for, and what they find

The searches this feature answers are some of the most common Bible searches on the web: "bible verses for wedding", "baptism verses", "new baby bible verses", "graduation bible verses", "anniversary bible verses", "baby dedication verses", "retirement bible verses", "verses for a new job", "back to school bible verses". The pages that rank today fall into three kinds:

1. **Long listicles** (40–100 verses, mostly NIV/KJV, often padded, frequently quoting verses wrongly or out of context, heavy with ads).
2. **Card shops and printable sellers** (Etsy, greeting-card sites) that sell a single verse on a design.
3. **Church and ministry pages** with a short list of readings for a ceremony.

What none of them combine: a **short, curated list sorted by use** (read at the ceremony vs. write in a card), the **full text in a modern translation** on the page, **honest context** for verses that are commonly misapplied, and a **free printable card made from the same verses**, without ads or sign-up. That combination is the reason a visitor would choose this page and the reason another site would link to it.

### 2.2 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book chapter files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| Loading verses in the app | `useVerses`, `resolveVerses`, `resolveRange`, `verseReference`; verse ids are `BBCCCVVV` (book number, chapter, verse: `19119105` is Psalm 119:105). **They default to the Bible of the site's current language**, so this feature always passes the Berean explicitly (`{ bible: "bsb" }`, or `"bsb"` as the slug argument). `verseReference` formats a plain range only; the skipped-verse and "a"/"b" references in 4.1 are built by the feature's own small helper on top of it | [verses.ts](../../../src/lib/verses.ts) |
| Reading a verse in tests | `bsbWords()` | [bsb-for-tests.ts](../../../src/lib/bsb-for-tests.ts) |
| Links to read a passage | `/read/bsb/<BOOK>/<chapter>?hl=<verse>` (as the home page does) | [HomePage.tsx](../../../src/pages/HomePage.tsx) |
| Topical verse lists to link to and to draw candidates from | Torrey's and Nave's topical Bibles: marriage (268 references), husbands, wife, children (326), parents, baptism (138), new birth, dedication, vows, wisdom, young men, old age, friendship, blessing, Christian minister. Slugs confirmed in the index at review: `marriage`, `husbands`, `wife`, `children`, `parents`, `baptism`, `new-birth`, `dedication`, `vows`, `wisdom`, `young-men`, `old-age`, `aged`, `friendship`, `blessing`, `minister-christian` (not "christian-minister"), `pastor`, `deacon`, `ordination`, `adoption`, `missions`, `diligence`, `industry`, `labor`, `school` | [data/topics/index.json](../../../data/topics/index.json), pages at `/topics/<slug>` |
| QR codes | The `qrcode` package is already a dependency (used for testimonies) | [package.json](../../../package.json), [TestimoniesPage.tsx](../../../src/pages/TestimoniesPage.tsx) |
| Fonts | Literata (serif, for Scripture) and Archivo (sans) are bundled | [package.json](../../../package.json) |
| Page titles and descriptions for search engines | `ROUTE_TITLES` for main pages; every other page is named from its `h1`, and its description is the first `<p>` inside `<main>` of 60+ characters, cut to about 155 characters | [page-head.ts](../../../src/lib/page-head.ts), [usePageHead.ts](../../../src/components/usePageHead.ts) |
| Leaving Scripture and visitors' words untranslated | When the site is shown in another language, the page translator swaps English page text phrase by phrase, but skips anything inside `.scripture` or an element with its own `lang`, and anything under `translate="no"` | [page-translator.ts](../../../src/lib/page-translator.ts) |
| Sitemap and ready-made copies for crawlers that do not run scripts | Sitemap built from the design-review page inventory; captured text of main pages written as HTML copies on release | [scripts/seo/pages.ts](../../../scripts/seo/pages.ts), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), [capture.ts](../../../scripts/seo/capture.ts), [build.ts](../../../scripts/seo/build.ts) |

**What does not exist yet:**
- **No print styling anywhere in the site** (`@media print` appears in no source file). Print is new ground; section 6 designs it carefully.
- **No verse-card generator yet.** Chain C's shared generator ([docs/features/verse-cards/design.md](../verse-cards/design.md)) had not been written when this design was drafted, and still did not exist when it was reviewed (no `docs/features/verse-cards/` folder on 2026-11-07). Section 7.4 shows how the cards here are built so they can switch to it later.
- **No PDF library.** Playwright is present, but only as a test tool.

### 2.3 Doctrine sets the event list

The site writes in agreement with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). For this feature that means:

- **Baptism is believer's baptism by immersion.** So the baby pack is **baby dedication** (parents and church committing to raise the child in the Lord, as Hannah gave Samuel to the Lord), not christening or infant baptism. The dedication page says plainly that dedication is not baptism and does not save. There is no "first communion" or "confirmation" pack, because both belong to other traditions' practice.
- **Marriage is the lifelong covenant of one man and one woman.** The wedding, engagement and anniversary packs speak of husband and wife, bride and groom.
- **The pastor's office is limited to men.** The ordination pack is for pastors (and deacons), and its pastor wording follows that. The confession does not say who may be a deacon, so the deacon wording does not add a ruling (4.4).
- **No prosperity teaching.** Graduation and new-job packs do not present wealth or success as the reward of faith; where a verse is commonly read that way (Deuteronomy 8:18, Jeremiah 29:11), its context note says what it actually says.
- **Security of the believer** (Article 5) shapes the new-believer pack (John 10:27–29, 1 John 5:11–13).

### 2.4 Neighbouring features: what this pack does NOT cover

Several other approved ideas sit right next to this one. To avoid two pages competing for the same search and saying different things, these events are left to their own features, and the pack pages link to them once they exist:

| Event | Belongs to |
|---|---|
| Funerals, sympathy, loss of a baby | Funeral and sympathy page (approved idea 7, this chain's step 4) |
| Birthdays | Birthday verses (approved idea 5, chain C) |
| A new home, house blessing | Blessings for the home (approved idea 11, this chain's step 16) |
| Surgery, illness, get-well | "What the Bible says when you're..." (idea 9) and prayers for occasions (idea 10) |
| Advent, Lent, Christmas, Easter | Countdowns (idea 8) |

### 2.5 Printing at home: what works and what goes wrong

Findings that shaped section 6:

- **Browsers print backgrounds off by default.** Any design that depends on a coloured background prints as white. Cards must look right with ink only on lines, type and small ornaments; `print-color-adjust: exact` is set, but the design never relies on it.
- **Home printers cannot print to the edge.** Most leave roughly a quarter inch (6 mm) unprinted. Every printed element stays at least 0.3 in (8 mm) inside each cut or fold line.
- **The page size must be set from code.** `@page { size: …; margin: 0 }` sets the paper and removes the browser's own header and footer (date, address, page number) in Chrome and Edge. Firefox honours it; Safari's support is newer and less dependable. Where a browser ignores it, the sheet is still exactly one page tall and centred, so the result is still usable.
- **Scaling ruins folded cards.** If the dialog shrinks the page to fit, fold lines move. The sheet is built in physical units (inches or millimetres) at exactly the paper's size, so "Default" and "100%" both print it correctly; the on-page instructions say "Scale: 100% (or Default)".
- **Duplex printing is unreliable at home.** A **quarter-fold card** prints on one side of one sheet and gives a front, an inside and a back after two folds. That is the format chosen for the greeting card.
- **Paper sizes.** Letter (8.5 × 11 in) in the US and Canada; A4 (210 × 297 mm) elsewhere. A quarter of Letter is 4.25 × 5.5 in, which fits a standard A2 envelope; a quarter of A4 is exactly A6 (105 × 148 mm), which fits a C6 envelope. Both are common, cheap envelope sizes.
- **Fonts must be loaded before printing,** or the browser prints a fallback face. `document.fonts.ready` alone is not enough: it only waits for fonts already being fetched, and a face the screen has not used yet (Literata italic, say) is not fetched until something needs it. The print button first asks for each face the sheet uses with `document.fonts.load(…)`, then waits for `document.fonts.ready`.
- **Phones do not always wait for the print.** On some phone browsers `window.print()` returns, and `afterprint` fires, before the page has been laid out for printing, so anything removed on `afterprint` can be missing from the printout. Print styles therefore stay in place until the visitor leaves the page (6.5).
- **A sheet exactly one page tall can spill onto a blank second page** through rounding. The sheet is drawn a hair shorter than the paper with its overflow hidden.
- **In-app browsers** (Facebook, Instagram) often have no working `window.print()`. The page detects this and shows "Open this page in your browser to print".

### 2.6 Why browser printing, not generated PDF files

| Option | Cost | Verdict |
|---|---|---|
| **Print stylesheet + the browser's print dialog** ("Save as PDF" is in every desktop dialog and in iOS/Android share sheets) | Nothing to install; text stays sharp; fonts embed; personalised names work | **Chosen** |
| Generate PDFs in the browser with a library (pdf-lib, jsPDF) | A new dependency of about 300 KB; fonts must be embedded by hand; layout written twice (screen and PDF) | Rejected (adds weight for no gain) |
| Pre-build PDFs at release time with Playwright | 15 packs × 4 formats × 2 paper sizes = 120 extra files; cannot carry the visitor's names | Possible later as a "download blank card" extra; not in this build |

No option here costs money or adds an outside service.

## 3. Event list

Fifteen packs at launch, in four families (the hub groups them this way). Each has a short address used in its URL.

| Family | Pack (address) | Search phrase it is written for |
|---|---|---|
| **Love and marriage** | Engagement (`engagement`) | engagement bible verses |
| | Wedding (`wedding`) | bible verses for a wedding / wedding readings |
| | Wedding anniversary (`anniversary`) | anniversary bible verses |
| **New life** | Expecting a baby (`expecting`) | bible verses for pregnancy / expecting a baby |
| | New baby (`new-baby`) | bible verses for a new baby |
| | Adoption (`adoption`) | bible verses about adoption |
| | Baby dedication (`baby-dedication`) | baby dedication verses |
| **Faith** | New believer (`new-believer`) | bible verses for a new Christian |
| | Baptism (`baptism`) | baptism verses / bible verses for baptism |
| | Ordination of a pastor or deacon (`ordination`) | ordination bible verses |
| | Sending a missionary (`missionary`) | bible verses for missionaries / commissioning |
| **Growing and working** | First day of school (`back-to-school`) | back to school bible verses |
| | Graduation (`graduation`) | graduation bible verses |
| | New job (`new-job`) | bible verses for a new job |
| | Retirement (`retirement`) | retirement bible verses |

**Later, added as data only** (no code change; see 7.1): Mother's Day, Father's Day, a child's first Bible, a new church plant or building dedication, a son or daughter leaving home, a milestone anniversary page (25th, 50th). Not chosen for launch because they are seasonal days or smaller searches; the owner can promote any of them.

## 4. Passage plan

### 4.1 How passages are chosen

1. **Candidates** come from three places: the site's own Torrey and Nave topic lists for the event's subject (marriage, children, baptism, wisdom, old age, ministers…); the passages churches traditionally read at that event; and the verses people actually put in cards.
2. **Each pack keeps 9–16 passages**, in three roles:
   - **Reading**: a longer passage to read aloud at a ceremony or service (up to about 1,100 characters).
   - **Card verse**: short enough to fit a card front (240 characters or fewer at full size, see 6.4).
   - **Blessing**: words to speak over the person (often Numbers 6:24–26, Aaron's blessing).
3. **Every passage gets one written line** on why it fits this event, and verses often taken out of context also get a **context note** (4.3). These 182 short lines are written once, by hand, in the implementation step, straight into the data file, then checked against the doctrinal foundation. This is ordinary authoring of one file, not a batch of model calls, so it costs nothing at runtime and needs no batch tooling.
4. **Berean Standard Bible only.** Text is never typed into the data: the data holds verse ids, and the words come from the site's Berean files, so a typo cannot creep in. A test checks every id against the Berean text.
5. **Partial verses** (for example, only "a cord of three strands is not quickly broken" from Ecclesiastes 4:12) are stored as an exact excerpt of the verse, and a test checks that the excerpt really occurs in the Berean wording. The excerpt may stand for the first or last verse of a range, not only for a single verse: the plan needs this for 1 Corinthians 13:4–8a and 13:7–8a, which end on "Love never fails." The reference shows the verse with the letter "a" when the excerpt is the verse's opening words (Song of Songs 8:7a, 1 Corinthians 13:8a) and "b" when it is its closing words (Ecclesiastes 4:12b, Joshua 24:15b), as is usual.
6. **Verses the Berean leaves out.** Some older translations include verses that the oldest manuscripts lack; the Berean omits them (Acts 8:37 is the one this plan meets). A passage that spans one lists it as skipped, and the reference reads "Acts 8:35–36, 38".
7. **Verses lifted out of a paragraph.** The Berean text is stored a verse at a time, so a passage cut from a longer speech can begin with an opening quotation mark that never closes, or end with a closing one that never opened (Joshua 1:9, Joshua 24:15b, Mark 10:9, Zephaniah 3:17 and five more in this plan); and a passage can end mid-sentence on a comma, colon or dash (1 Samuel 1:27, Proverbs 5:18, 1 Peter 2:2, Ephesians 4:11–12 and five more; Ecclesiastes 12:1 ends on a comma just inside a closing quotation mark). When a passage's text is assembled, a double quotation mark with no partner inside the passage is dropped, and a final comma, semicolon, colon or dash (or no final mark at all), looking past any closing quotation marks, becomes an ellipsis "…" ("them,”" becomes "them…”"). Single quotation marks are left alone, because the same character is also the apostrophe. A test runs every planned passage through this and checks that its double quotation marks pair up and that, past any closing quotation marks, it ends on a full stop, "!", "?" or "…". The words themselves are never changed.

### 4.2 The passages

Every reference below was checked against the site's Berean files on 2026-11-07, and again in the review: all 182 entries exist (Acts 8:37 is the only omitted verse, handled as above). Length in characters is in brackets where it decides the role. **R** = reading, **C** = card verse, **B** = blessing, **ctx** = carries a context note. The implementation step may swap a passage if the review finds a better one, but must keep each pack within 9–16 passages with at least three card verses.

**Engagement** — R: Song of Songs 2:10–13 (to the end of the beloved's words, so the quotation closes); Song of Songs 8:6–7; 1 Corinthians 13:4–7. C: Genesis 24:67; Proverbs 18:22; Proverbs 19:14; Proverbs 3:5–6; Ephesians 4:2–3; Colossians 3:14. B: Philippians 1:9–11 (Paul's prayer that love may abound in knowledge).

**Wedding** — R: Genesis 2:18–24 [963]; Ecclesiastes 4:9–12; Song of Songs 8:6–7; Ruth 1:16–17 (ctx); Matthew 19:4–6; 1 Corinthians 13:4–8a; Ephesians 5:22–33 [1,097] (the confession's own reading of marriage, Article 18); Colossians 3:12–14; 1 John 4:7–12. C: Ecclesiastes 4:12b; Mark 10:9; 1 Corinthians 13:7; Colossians 3:14; 1 John 4:19; Proverbs 18:22. B: Numbers 6:24–26.

**Wedding anniversary** — R: Ecclesiastes 4:9–12; Proverbs 31:10–12; Colossians 3:12–14. C: Proverbs 5:18; Proverbs 31:28–29; Song of Songs 8:7a; 1 Corinthians 13:7–8a; Lamentations 3:22–23 (ctx); Psalm 100:5; 1 Peter 4:8; Psalm 34:3. B: Psalm 90:17.

**Expecting a baby** — R: Psalm 139:13–16; Luke 1:41–45. C: Jeremiah 1:5 (ctx); Psalm 127:3; Isaiah 40:11; Psalm 22:9–10; Philippians 4:6–7 [227]; Genesis 21:6; Psalm 71:6. B: Numbers 6:24–26.

**New baby** — R: Psalm 127:3–5; Mark 10:14–16. C: Psalm 139:13–14; 1 Samuel 1:27; James 1:17; Genesis 33:5; John 16:21 (ctx); Zephaniah 3:17 (ctx); Psalm 103:17–18 (verse 17 alone stops mid-sentence) [216]. B: Numbers 6:24–26.

**Adoption** — R: Ephesians 1:4–6; Romans 8:15–17; Galatians 4:4–7; Esther 2:7 (ctx) [266]. C: 1 John 3:1; Psalm 68:5–6; John 14:18; James 1:27; Deuteronomy 10:18. B: Numbers 6:24–26.

**Baby dedication** — R: 1 Samuel 1:27–28; Deuteronomy 6:4–9; Psalm 78:4–7; Mark 10:13–16; Luke 2:22–24 (ctx; verse 22 alone stops mid-sentence) [348]; 2 Timothy 3:14–15. C: Proverbs 22:6 (ctx); Luke 2:40; Ephesians 6:4; Joshua 24:15b "As for me and my house, we will serve the LORD!" (ctx); 3 John 1:4. B: Numbers 6:24–26.

**New believer** — R: Ephesians 2:8–10; John 10:27–29; 1 John 5:11–13. C: John 3:3; John 3:16; 2 Corinthians 5:17; Romans 10:9–10 [231]; Luke 15:7; Philippians 1:6; Romans 8:1; 1 Peter 2:2; Psalm 40:2–3 [234].

**Baptism** — R: Matthew 28:18–20; Romans 6:3–4; Acts 2:38–41 (ctx); Acts 8:35–36, 38; Matthew 3:13–17; 1 Peter 3:21 (ctx); Acts 16:30–34. C: Galatians 3:26–27; Colossians 2:12; 2 Corinthians 5:17; Galatians 2:20; Romans 6:4.

**Ordination of a pastor or deacon** — R: 1 Timothy 3:1–7 [771]; Titus 1:5–9; 2 Timothy 4:1–5; 1 Peter 5:1–4; Acts 13:2–3; 1 Timothy 4:14–16. For deacons, R: Acts 6:1–6 [846]; 1 Timothy 3:8–13. C: Acts 20:28; Jeremiah 3:15; 2 Timothy 2:15; Isaiah 6:8; Ephesians 4:11–12.

**Sending a missionary** — R: Matthew 28:18–20; Acts 13:2–3; Romans 10:14–15; 3 John 1:6–8 (send them on their way "in a manner worthy of God"). C: Acts 1:8; Isaiah 6:8; Isaiah 52:7; Psalm 96:3; Joshua 1:9 (ctx); 2 Corinthians 5:20; Acts 20:24; Psalm 139:9–10. B: Numbers 6:24–26.

**First day of school** — C: Proverbs 1:7; Proverbs 2:6; James 1:5; Philippians 4:6–7; Joshua 1:9 (ctx); Colossians 3:23; Daniel 1:17 (ctx); Luke 2:52; 1 Timothy 4:12; Psalm 32:8; Isaiah 41:10; Proverbs 3:5–6. B: Numbers 6:24–26. (All short: this pack is mainly for lunchbox notes and small cards, so it has no long readings.)

**Graduation** — R: Philippians 3:13–14. C: Proverbs 3:5–6; Jeremiah 29:11 (ctx); Joshua 1:9 (ctx); Philippians 1:6; Micah 6:8; Colossians 3:23–24; Proverbs 16:3; Proverbs 16:9; Ecclesiastes 12:1; Ecclesiastes 12:13; 1 Timothy 4:12; Isaiah 40:31; Psalm 90:17. B: Numbers 6:24–26.

**New job** — R: Philippians 4:11–13 (ctx). C: Colossians 3:23–24; Proverbs 16:3; Proverbs 22:29; Ecclesiastes 9:10; Genesis 2:15; Deuteronomy 8:18 (ctx); 1 Corinthians 10:31; Matthew 6:33 (ctx); Ephesians 6:7; Joshua 1:9 (ctx). B: Psalm 90:17 (stored once, as the blessing; at 125 characters it also appears in the card maker's verse picker, see 6.4).

**Retirement** — R: Psalm 92:12–15; Psalm 71:17–18; Joshua 14:10–12 (Caleb, still strong at eighty-five); Titus 2:2–5 (verse 4 stops mid-sentence; verse 5 completes it) [458]; Numbers 8:25–26 (ctx). C: Isaiah 46:4; Proverbs 16:31; Matthew 25:21 (ctx); Psalm 90:12; Ecclesiastes 3:1; 2 Timothy 4:7 (ctx). B: Psalm 90:17.

### 4.3 Context notes (the verses most often misapplied)

These notes are part of what makes the pages worth linking to. Each is one or two plain sentences, shown under the verse in a muted style, never as a scolding.

| Verse | Used for | What the note says |
|---|---|---|
| Ruth 1:16–17 | Weddings | Ruth spoke these words to her mother-in-law Naomi, not to a husband; couples use them for the same loyalty and shared faith. |
| Jeremiah 29:11 | Graduation | Spoken to Judah in exile, with seventy years still to wait (29:10); its promise is God's faithfulness to his people over the long haul, not a guarantee of a smooth career. |
| Jeremiah 1:5 | Expecting | God's words calling Jeremiah as a prophet; it also shows God knowing a person before birth, which is why it is loved by expecting parents. |
| Joshua 1:9 | School, missions, new job | Said to Joshua as he led Israel into the land; the courage it calls for rests on God's presence, which the New Testament promises to every believer (Matthew 28:20). |
| Joshua 24:15b | Dedication | The end of Joshua's challenge to Israel to choose whom they will serve; quoted here as a household's own choice. |
| Proverbs 22:6 | Dedication | A proverb: wisdom about how life usually goes, not a promise that guarantees how a child will turn out. |
| Deuteronomy 8:18 | New job | God gives the ability to earn "to confirm His covenant": a call to remember him in plenty, not a promise of riches. |
| Philippians 4:11–13 | New job | Paul's secret of contentment in want and in plenty: "I can do all things" (4:13) is strength to be content in either, not a promise of success at anything we try. |
| Matthew 6:33 | New job | "All these things" are the food, drink and clothing of 6:31–32: God's care for daily needs, not a promise of wealth. |
| Lamentations 3:22–23 | Anniversary | Written amid Jerusalem's ruin; the faithfulness it praises is God's, which is what holds a marriage. |
| 1 Peter 3:21 | Baptism | The water "symbolizes" the baptism that saves, which Peter says is "not the removal of dirt from the body, but the pledge of a clear conscience toward God", and it saves "through the resurrection of Jesus Christ": baptism pictures the salvation faith receives. |
| Acts 2:38–41 | Baptism | Forgiveness comes to those who repent and trust in Jesus' name; baptism is how they confessed him in public. It is "those who accepted his message" who were baptized (2:41), which is why Baptists baptize believers. |
| Luke 2:22–24 | Dedication | Mary and Joseph kept a rite of the Law of Moses; Christian baby dedication follows its spirit of giving a child to the Lord, and is not baptism. |
| Daniel 1:17 | School | Daniel and his friends studied faithfully in a foreign school while staying loyal to God. |
| Esther 2:7 | Adoption | Mordecai raised his orphaned cousin as his own daughter, one of Scripture's plain pictures of adoption. |
| Numbers 8:25–26 | Retirement | The Levites retired from the heavy work at fifty but kept helping their brothers: the one place the Bible speaks of retiring, and it is a change of service, not an end to it. |
| John 16:21 | New baby | Jesus used a mother's joy after childbirth to picture his disciples' sorrow turning to joy when they would see him again; it is loved by new parents because the picture is so true. |
| Zephaniah 3:17 | New baby | Spoken to God's restored people, rejoicing over them; it describes how God delights in those who are his, which is why parents love it for a child. |
| Matthew 25:21 | Retirement | From the parable of the talents: the master's words at the end of faithful service, which we long to hear from Christ. |
| 2 Timothy 4:7 | Retirement | Paul wrote this near the end of his life; used here for finishing a long work well. |
| Song of Songs (all) | Engagement, wedding | Shown as the love of husband and wife, as the book itself presents it. |

### 4.4 Words the site writes

Besides the passage notes, each pack has: a unique introduction (one paragraph of 60–160 words, which also becomes the page's search description, so its first sentence must stand alone and name the event), card wording defaults (a heading and an inside line), and for three packs a short explainer: **baby dedication** (what it is and is not), **adoption** (God's adoption of believers, with language that honours birth parents: never "real parents" or "given up"), and **ordination** (what ordination is in a Baptist church: the congregation's recognition, by the laying on of hands, of a calling God has given, Acts 13:3 and 1 Timothy 4:14). The confession limits the office of pastor to men, so the pastor wording says so in the site's own voice. It says nothing about who may serve as a deacon, and Baptist churches differ there, so the deacon wording describes the office (servants the congregation recognises, Acts 6:3–6) and lets 1 Timothy 3:8–13 speak for itself without adding a ruling of the site's own.

## 5. Pages and search traffic

### 5.1 Addresses

| Address | What it is |
|---|---|
| `/life-events` | The hub: all fifteen packs in their four families, each card naming one verse reference from the pack |
| `/life-events/<pack>` | One pack page (passages and the card maker) |

The card maker lives **on the pack page itself**, not on a separate address. That keeps one page per search phrase (no thin "card" page competing with the pack page) and means anyone who links to "wedding verses" also lands on the card maker. Print modes are local state, not part of the address.

An unknown pack address renders the site's own [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) (not a page of this feature's making): the crawler-copy capture recognises a missing page by that page's heading.

### 5.2 What each pack page shows, top to bottom

1. **`h1`**: "Bible Verses for a Wedding" (the search phrase, title case). The site turns this into the tab title "Bible Verses for a Wedding · Bible Guide" automatically.
2. **Introduction paragraph.** It must be the first `<p>` of 60 or more characters inside `<main>` (no kicker, breadcrumb or caption paragraph of that length before it), because that is what becomes the search description.
3. **"Readings for the ceremony"** (role R), **"Verses for a card"** (role C), **"A blessing to speak"** (role B): each passage shows its full Berean text as real page text (not an image), its reference linked to the reader (`/read/bsb/<BOOK>/<chapter>?hl=<verse>`), its one-line note, and its context note if any. A section with no passages (four packs have no blessing; the school pack has no readings) is left out, heading and all. The verse text sits in an element with the class `scripture` and `lang="en"`, so the site's page translator never swaps its words when the site is shown in another language. A small **"Use on card"** button appears on each passage the card maker's verse picker offers (every card verse, and a blessing of 320 characters or fewer, see 6.4) and selects it there. A **"Copy"** button copies "text — reference (BSB)".
4. **"Make a printable card"**: the card maker (section 6).
5. **"Explore more"**: links to the matching topic pages (wedding → `/topics/marriage`, `/topics/husbands`, `/topics/wife`; baptism → `/topics/baptism`, `/topics/new-birth`; and so on) and to the sibling packs in the same family. When the sympathy page, birthday verses and home blessings exist, the packs that border them link there too (for example, expecting → sympathy page for a family who has lost a baby, worded gently).
6. **Source line**: "Scripture quotations are from the Berean Standard Bible (public domain)."

No pack has more than 16 passages, so the long-list rule (render about 50 rows around the visible area, auto-load on scroll) never applies; it is not needed here.

### 5.3 Hub page

`h1` "Bible Verses for Life's Big Moments", a short introduction, then four family groups with one card per pack (title, the reference of the pack's first card verse, "Verses and a printable card"). The hub shows references, not verse text: the Berean is stored one whole book per file, so quoting one verse from each of fifteen packs would fetch about a dozen whole books (roughly a quarter of a megabyte even compressed) just to draw a menu. Its search title goes into `ROUTE_TITLES`: **"Bible Verses for Weddings, Babies, Baptisms and Graduations"** (59 characters, so it is not cut off in search results, as the 77-character first draft would have been).

A pack page does load its passages' whole books, about a dozen for the wedding pack (about 810 KB, about 260 KB compressed). That is in line with the site's topic pages, which do the same, and is acceptable for a page whose purpose is the text.

### 5.4 Being found

- **Sitemap and ready-made copies:** add one page type, "life-event", to the design-review inventory ([site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts)) listing the hub and every pack, so all sixteen addresses reach the sitemap. The list is not typed out a second time: the data index exports one function that returns the sixteen addresses, and both the inventory and a test use it, so a pack added later reaches the sitemap by itself (the inventory already imports site data the same way, for the parables guide) and get ready-made copies for crawlers that do not run scripts (sixteen files, far inside the file budget). Captures are taken from the live site, so they only appear after the owner releases the feature; until then the pages simply are not captured (the capture skips addresses that show "page not found").
- **Real text on the page:** every verse, note and introduction is ordinary text, which is what those copies carry and what search engines read.
- **Distinct from the topic pages:** `/topics/marriage` answers "what does the Bible teach about marriage" (hundreds of references); `/life-events/wedding` answers "what should we read at our wedding / write in a card". Each links to the other, so they support rather than compete.
- **Avoiding duplicate-content signals:** some verses appear in several packs (Numbers 6:24–26 in eight). Each pack's introduction and notes are written for that event, so no two pages are near-copies.
- **No FAQ markup.** Google stopped showing FAQ rich results for most sites in 2023; it would add work for no gain.
- **After release:** `bun run seo:capture --only /life-events`, commit the captures, and `bun run seo:indexnow` (per [SEO.md](../../../../SEO.md)). Releasing is the owner's call; this feature never deploys.

### 5.5 Entry points (navigation)

The top navigation is full, and the rules say to touch shared files as little as possible. So:
- **Home page:** one new one-line link, "Verses and printable cards for life's big days", linking to `/life-events`, added as a new paragraph at the end of the Resources preview's opening block in [HomePage.tsx](../../../src/pages/HomePage.tsx). Not a new block: the Resources section is made of large feature blocks, each with its own drawing, facts and wording the owner approved, and a new one would be a home-page redesign that needs a mock-up and the owner's yes first. And not a reworded existing paragraph: the site's translations are keyed by each paragraph's exact English, so rewording one would drop it back to English in every translated language. A new line is simply English until it is translated. The other five chain D features will want entries too; keeping this to one line leaves room for the shared hub below.
- **Route:** two lines in [App.tsx](../../../src/App.tsx) (a lazy import and `<Route path="/life-events/*">`).
- **Search title:** one entry in `ROUTE_TITLES` in [page-head.ts](../../../src/lib/page-head.ts).
- **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts).

The rest of this chain (sympathy, countdowns, "when you're…", prayers, home blessings) may later want a shared "Life moments" hub. That is not this feature's decision; if one is made, `/life-events` becomes one of its doors without changing its addresses.

## 6. Print and card approach

### 6.1 Print formats

| Format | Sheet | Finished size | What it is for |
|---|---|---|---|
| **Folded card** | Letter or A4, portrait, one side | 4.25 × 5.5 in (A2 envelope) / 105 × 148 mm (A6, C6 envelope) | A greeting card: front, inside message, back |
| **Small cards, 4 per sheet** | Letter or A4, portrait | Same as above, cut along guides | Place cards at a wedding table, lunchbox notes, gift tags, cards for a baptism class |
| **Display print** | Letter or A4, portrait | Letter: everything kept inside a centred 8 × 10 in area, so the sheet trimmed to 8 × 10 fits a standard 8 × 10 frame (or an 11 × 14 frame with an 8 × 10 mat); a whole Letter sheet does not fit an 8 × 10 frame. A4: fits an A4 frame as it is | A nursery wall, a sign at a reception or a graduation table |
| **Readings sheet** | Letter or A4, as many pages as needed | — | Every passage of the pack in order (readings, then card verses, then the blessing), each with its reference and note, for an officiant or a family planning a service. No personal fields |

Paper is chosen with a Letter / A4 switch, defaulting from the browser's language (US, Canada, Mexico, the Philippines and a few others to Letter; everyone else to A4).

### 6.2 The folded card, panel by panel

One sheet, portrait, printed on one side, folded in half top-to-bottom with the print outside, then in half again left-to-right. The four quarters of the sheet become:

| Quarter of the sheet | Becomes | Printed upright or turned |
|---|---|---|
| Bottom right | **Front**: the chosen verse, its reference, the pack's small ornament, optional heading ("On your wedding day") | Upright |
| Bottom left | **Back**: QR code to the pack page, "bibleguide.io/life-events/wedding", "Scripture: Berean Standard Bible" | Upright |
| Top left | **Inside right**: names, date, short message, room to write by hand | Turned 180° |
| Top right | **Inside left**: left blank for handwriting, or a second verse if the visitor picks one | Turned 180° |

The top half is turned 180° because folding it behind the bottom half flips it; this is the standard layout for one-sided quarter-fold cards. The implementation must confirm it by printing a real sheet (or a PDF from the print dialog, folded on screen) before the step is called done. Faint dashed fold guides are printed by default and can be switched off.

### 6.3 Personalising

Fields depend on the pack (the data names which ones it uses):

| Field | Used by | Limit |
|---|---|---|
| Names | Two names: wedding, engagement, anniversary. One name: baptism, new baby, dedication, adoption, ordination, missionary, graduation, retirement. (The data says how many, 7.1) | 40 characters each |
| Date | wedding, anniversary, baptism, dedication, ordination, graduation | Typed freely, 40 characters (people write dates many ways) |
| Heading | all | 50 characters; default from the pack ("On your wedding day", "Welcome, little one") |
| Message | all | 160 characters |
| Second verse (inside left) | folded card | Any card-fit passage of the pack |

Everything the visitor types stays in the page's memory only. It is **not put in the address** (so a shared link never carries someone's names), not saved, and not sent anywhere. React escapes it, so typed markup prints as plain text. Everything the visitor typed is drawn inside `translate="no"`, because the site's page translator would otherwise turn a baby called Grace, Hope or Joy into Gracia, Esperanza or Alegría when the site is shown in Spanish. Long names shrink one step in size before they would wrap badly; past the limit, the field stops accepting characters and says how many are allowed.

### 6.4 Which verse fits which format

Lengths are measured on the Berean text, so the rule is checked by a test rather than eyeballed:

| Characters | Folded card front / small card | Display print | Readings sheet |
|---|---|---|---|
| up to 240 | Full size (about 14 pt) | Yes | Yes |
| 241–320 | One step smaller (about 12 pt) | Yes | Yes |
| 321–700 | Not offered | Yes | Yes |
| over 700 | Not offered | Not offered | Yes |

Of the 182 planned entries (re-measured in the review, partial verses at their excerpt length), 130 are 240 characters or fewer, 14 fall between 241 and 320, 34 between 321 and 700, and 4 are over 700 (Genesis 2:18–24, Ephesians 5:22–33, 1 Timothy 3:1–7, Acts 6:1–6). Every card verse is 320 characters or fewer.

What the verse picker offers depends on the format chosen:
- **Folded card and small cards:** every card verse, plus the blessing if it is 320 characters or fewer. These are the passages that carry a "Use on card" button on the page.
- **Display print:** any passage of the pack of 700 characters or fewer.
- **Readings sheet:** no picker; it prints the whole pack (6.1).

If the visitor switches to a format that cannot take the verse they had chosen, the picker falls back to the pack's first card verse and says so.

### 6.5 How printing works in code

- **One sheet component, two uses.** The same component draws the chosen format at true size (inches or millimetres). On screen it sits inside a preview box scaled down to fit; for printing it is drawn into a separate container attached directly to the page body, outside the app, so print styles can hide the whole app and show only the sheet. The print copy is rendered (hidden on screen) as soon as the card maker is shown, not only when Print is pressed, so its fonts and QR code are already in hand.
- **Single-sheet formats** (folded card, small cards, display print) are drawn a hair shorter than the paper (for example `calc(11in - 1px)`) with overflow hidden and no page break after, so rounding never spills a blank second page.
- **The paper size is set only from this page.** `@page` rules cannot be limited to one part of a page, so the card maker adds a small style element when the visitor presses Print: `@page { size: 8.5in 11in; margin: 0 }` (or `210mm 297mm`) for the single-sheet formats. The **readings sheet** runs over several pages, and with a zero page margin its second and later pages would print right to the paper's edge, so it uses `@page { size: …; margin: 0.75in }` (19 mm) instead. With a real margin the browser may add its own header and footer (date, address), so the on-page instructions for that format say to switch off "Headers and footers" in the dialog. Changing format or paper updates the element in place.
- **Print styles are switched on by a marker, not by loading a file.** A stylesheet loaded with a page stays loaded after the visitor leaves it, so every print rule is written under a class on the document root (`print-sheet-active`) that this page adds when Print is pressed. The marker and the `@page` element are **not** removed on `afterprint`, because some phone browsers fire it before they have laid the page out for printing (2.5). They stay until the visitor leaves the pack page, and are removed then. The one side effect is harmless: printing from the browser's own menu later on the same page prints the card again rather than the page. Every other page on the site prints exactly as before.
- **The print mechanism knows nothing about life events.** The portal container, the `@page` element, the marker, the font and readiness wait and the in-app browser check live in one small self-contained module in this feature's folder, taking a sheet to print and a paper size and nothing else. The sympathy cards (this chain's step 4) and printable home blessings (step 16) will need the same thing, and can import it rather than write a second copy. Moving it to a shared folder later is a one-file move, and not this feature's decision.
- **The Print button waits** until the verse text and the QR code are ready and every font face the sheet uses has loaded: `document.fonts.load(…)` for each face (Literata, its italic if used, Archivo), then `document.fonts.ready`. Then it calls `window.print()`. While anything is missing, the button says what it is waiting for.
- **Ink only, no backgrounds:** thin rules, the ornament as line art, dark type. The sheet uses fixed light-palette colours written into its own styles (for example the poetry colour `#18716a`), not the site's theme colour variables, so dark mode cannot reach the printout whatever the browser decides about colour schemes when printing.
- **Readings sheet** uses the normal page flow with `break-inside: avoid` on each passage, so a reading never splits across pages unless it is longer than a page.
- **QR code** is made in the browser with the existing `qrcode` package as an SVG pointing at the plain public page address, built from the site's `SITE_ORIGIN` constant in [page-head.ts](../../../src/lib/page-head.ts) (`https://bibleguide.io/life-events/<pack>`), never from the address the page happens to be open at (a card printed from the local preview must not carry a `127.0.0.1` address). No tracking parameters. If it fails, the card prints without it and the written address stays.

### 6.6 Look

Each family uses one of the site's existing category colours (their light-theme values) for its ornament and rules (love and marriage: poetry; new life: gospels; faith: acts, whose book is full of baptisms and sendings; growing and working: epistles). Each pack has one small line-art ornament (two rings, a sprig, water, a lamp, a mortarboard, a path…) drawn as an SVG inside the feature's own folder. Scripture in Literata; small text in Archivo. One clean style per pack at launch; more styles can follow once chain C's verse-card generator gives the site a shared set.

## 7. Building it

### 7.1 Data

One TypeScript data file per family under [src/data/life-events/](../../../src/data/life-events/) (keeps each file well under 500 lines), plus an index. Adding a pack later means adding one entry; no code change.

```ts
export interface LifeEventPassage {
  from: number;            // verse id BBCCCVVV
  to?: number;             // last verse id, same book
  skip?: number[];         // verses the Berean omits inside the range (Acts 8:37)
  part?: { verse: number; text: string };
                           // exact excerpt standing for one verse, which must be the first or last of the
                           // passage: Ecclesiastes 4:12b, or verse 8 of 1 Corinthians 13:4-8a ("a" when the
                           // excerpt opens the verse, "b" when it closes it)
  role: "reading" | "card" | "blessing";   // one role per passage; a blessing that fits also shows on cards
  note: string;            // why it fits this event (one line)
  context?: string;        // honest context, for commonly misapplied verses
  group?: string;          // optional sub-heading, e.g. "For deacons"
}

export interface LifeEvent {
  slug: string;                                   // "wedding"
  family: "love" | "new-life" | "faith" | "growing";
  heading: string;                                // h1, "Bible Verses for a Wedding"
  shortName: string;                              // "Wedding", for the hub and links
  intro: string;                                  // 60–160 words; becomes the search description
  explainer?: string;                             // dedication, adoption, ordination
  passages: LifeEventPassage[];
  card: { heading: string; inside: string; names: 0 | 1 | 2; date: boolean; ornament: string };
  topics: string[];                               // /topics/<slug> links; each must exist
  related: string[];                              // sibling pack slugs
}
```

Verse text is **not** stored; it is loaded with the site's existing verse functions ([verses.ts](../../../src/lib/verses.ts)), always from the Berean Standard Bible, whatever language the site is shown in (the notes are English in this build). Those functions default to the site language's own Bible, so every call passes `"bsb"` explicitly. The quotation-mark and sentence-end tidying of 4.1 is applied once, where a passage's text is assembled, so the page, the cards and the readings sheet all show the same words.

The data files import nothing through the `@/` path alias, so the build scripts (which run outside Vite) can import the index for the sitemap.

### 7.2 Files

All new files live in the feature's own folders: `src/pages/life-events/` (hub, pack page, card maker, print sheet, the self-contained print module of 6.5, styles, ornaments) and `src/data/life-events/`. Shared files touched, each by a line or two: [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts). No new dependencies.

### 7.3 Tests (added in the implementation step, run with the site's `test` and `build`)

The site's `vitest` run only collects tests under `src/` (`src/**/*.test.{ts,tsx}`, in a jsdom page), so every test below lives beside the feature's code there. jsdom has no `document.fonts` and no real printing, so the card maker tests supply stand-ins for `document.fonts` and `window.print`.

- **Data checks** (read the real Berean files through `bsbWords`): every verse id exists; `to` is in the same book and after `from`; every `skip` verse really is absent from the Berean and inside the range; every `part` names the first or last verse of its passage and is an exact excerpt of it; every pack has 9–16 passages, at least three of them card verses; every card-role passage is 320 characters or fewer (measured after the tidying of 4.1); every assembled passage has paired double quotation marks and, past any closing quotation marks, ends on a full stop, "!", "?" or "…"; slugs are unique and URL-safe; every `topics` slug exists in [data/topics/index.json](../../../data/topics/index.json); every `related` slug is a real pack; every intro is 60–160 words.
- **Page tests** (Testing Library): the hub lists all packs; a pack page shows its heading, introduction, every passage's reference and its context notes; a role section with no passages is not shown; verse text sits inside `.scripture` with `lang="en"`; an unknown slug shows the site's not-found page; "Use on card" selects that verse in the card maker.
- **Card maker tests:** field limits; the number of name fields follows the pack's data; typed text is not written into the address and is drawn inside `translate="no"`; Print is disabled until verses, QR and fonts are ready; pressing Print adds the `@page` style element (zero margin for single sheets, a real margin for the readings sheet) and the `print-sheet-active` marker; `afterprint` leaves both in place; leaving the page removes both; the folded format turns the top two quarters; the QR code points at `https://bibleguide.io/life-events/<pack>` whatever address the test page is at; switching to a format that cannot take the chosen verse falls back to the first card verse.
- **Print check in the browser** (Playwright, in the e2e folder; not part of the default `test` command, so run by hand in the implementation step): print each format of one pack to PDF and check it is exactly one page of the right size (readings sheet excepted).
- **Search inventory:** the address list the data index exports (which the sitemap uses) contains `/life-events` and every pack, and nothing else.

### 7.4 Switching to the shared verse-card generator later

Chain C is building a reusable verse-card generator (shareable social images, approved idea 4). It did not exist when this was written. To make the switch easy:

- The card maker builds a plain **card description** (verse ids, reference, resolved text, heading, names, date, message, pack slug, ornament, colour) and hands it to the sheet component. The sheet only draws a description; it never reads the page's state.
- When the generator exists, the pack page adds a **"Share as image"** button that hands the same description to it, and the review step for that work decides whether the generator's styles should also replace this feature's printed styles. Printing stays here regardless: the generator is for screens and social media; this feature is for paper.
- Until then the page offers "Copy" (text) and the plain page link for sharing, so nothing is half-built.

## 8. Edge cases

| Case | What happens |
|---|---|
| A range crosses a verse the Berean omits (Acts 8:37) | Stored as `skip`; reference reads "Acts 8:35–36, 38"; a test proves the verse really is absent |
| A partial verse ("a" or "b" reference) | Stored as an exact excerpt, alone or as the first or last verse of a range; a test proves the excerpt occurs in the verse; a "b" excerpt is shown with its first letter capitalised |
| A verse cut from a longer speech or sentence | Unpartnered double quotation marks dropped; a passage ending on a comma, colon or dash ends with "…"; the words are never changed; a test checks every planned passage |
| Verse text fails to load (offline, slow network) | Passages show a short "could not load" line with Retry; Print stays disabled with the reason shown |
| Browser prints backgrounds off | Nothing depends on backgrounds |
| Printer cannot print to the edge | Every element at least 0.3 in / 8 mm from cut and fold lines |
| Visitor's dialog shrinks or enlarges the page | On-page instructions: "Scale 100% (or Default), Margins None or Default"; the sheet is exactly one page, so "Default" is safe |
| Browser ignores `@page size` | Sheet is still one page and centred; instructions say to choose Letter or A4 in the dialog |
| In-app browser without printing | "Open this page in your browser to print" with the address to copy |
| Phone printing (iOS, Android) | Works through the share/print sheet; "Save as PDF" is offered there too; preview scales to the phone's width |
| Fonts not loaded at print time | Print asks for each face with `document.fonts.load(…)`, then waits for `document.fonts.ready` |
| Dark mode | The sheet uses fixed light-palette colours, not theme variables, so it always prints light |
| Leaving the page mid-print | `@page` style and `print-sheet-active` marker removed on unmount, so the next page prints normally |
| Phone browser fires `afterprint` early | Nothing is removed on `afterprint`; print styles stay until the visitor leaves the page |
| Readings sheet runs to several pages | Real page margin on every page; the instructions say to switch off the dialog's headers and footers |
| Very long names, right-to-left names, emoji | Length limits, one automatic size step, `overflow-wrap: anywhere`; text direction follows the text; emoji print as the system draws them |
| Typed markup or script in a field | Escaped by React; prints as text |
| Personal details | Never in the address, never stored, never sent |
| QR code fails | Card prints without it; written address remains |
| Site shown in another language | Pages and notes stay English, verses stay Berean in this build (verse text marked `.scripture`, `lang="en"`, so the page translator leaves it alone; typed names under `translate="no"`); a translated version is later work through the site's translation system |
| Expecting pack and pregnancy loss | Wording avoids assuming every pregnancy ends in a birth; a gentle link to the sympathy page once it exists |
| Adoption wording | Honours birth parents; avoids "real parents", "given up"; focuses on God's welcome and the family's joy |
| Dedication mistaken for baptism | The page's explainer says plainly what dedication is and is not |
| Ordination and the pastor's office | Pastor wording follows the confession (pastors are men); deacon readings sit under their own sub-heading, and the deacon wording adds no ruling the confession does not make |
| A verse in many packs | Fine: each pack's note is written for that event; intros are unique |
| Hub page and topic pages competing | Different intents (verses to use vs. what the Bible teaches); linked both ways |
| A pack added later | One data entry; tests check it automatically; it reaches the hub and the sitemap by itself |
| Releasing | This feature never deploys; captures and IndexNow happen only after the owner's release |

## 9. Out of scope for this build

Pre-built PDF downloads; more than one card style per pack; translated packs; envelope printing; a shared "Life moments" hub for the whole chain; links from the topic pages back to the packs (those pages are shared files; worth adding later in one small change).

## 10. Review

**Step 2 of sequence 33, 2026-11-07. One critical review, against the approved idea (entry 6 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md)), the [feature build rules](../../../../FEATURE-BUILD-RULES.md), the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md) and the real code.** Every correction below is already made in the sections above; this list says what changed and why. The passage figures were re-measured by a script reading the site's own Berean files.

**Verdict:** the design is sound and fits the approved idea: fifteen events with chosen passages and a printable card for each, Berean text only, no running cost, no new dependency, nothing deployed. The problems found were in the details an implementer would otherwise have hit half-way through: a data model that could not hold three of the planned passages, Berean text that looks broken when lifted out of its paragraph, print behaviour on phones and over several pages, and two places where the site's translation system would have changed words it must not touch.

### What changed, and why

**Passages and their text**
1. **The count was 182, not 181.** Fixed in three places. The band figures the draft gave already added up to 182.
2. **Partial verses at the end of a range could not be stored.** The draft allowed an excerpt only for a single verse, but the plan uses 1 Corinthians 13:4–8a and 13:7–8a, which end on "Love never fails." The excerpt can now stand for the first or last verse of a passage, and references take "a" as well as "b" (4.1, 7.1).
3. **Passages lifted out of a paragraph show stray quotation marks or stop mid-sentence.** The Berean is stored a verse at a time. In the draft's plan ten passages began or ended with a quotation mark whose partner lies outside the passage (Joshua 1:9 ends with a closing mark that never opened, for example), and twelve ended on a comma, colon or dash (1 Peter 3:21 ends "…through the resurrection of Jesus Christ,"). Four were fixed by lengthening them (item 4); for the nine of each kind that remain, added one tidying rule, applied wherever text is assembled, and a test over every passage (4.1). The words themselves are never changed.
4. **Four passages lengthened so they end where the sentence or speech ends:** Song of Songs 2:10–12 became 2:10–13, Psalm 103:17 became 103:17–18, Luke 2:22 became 2:22–24, and Titus 2:2–4 became 2:2–5. The rules of 9–16 passages per pack and at least three card verses still hold for every pack.
5. **New-job blessing.** "Psalm 90:17 doubles as the blessing" could not be stored, because each passage has one role. It is now stored once, as the blessing; a blessing that is short enough appears on cards anyway. The pack still has 12 passages.
6. **Length figures re-measured** with partial verses at their excerpt length: 130, 14, 34 and 4 in the four size bands (6.4). No card verse is over 320 characters, and no reading is over about 1,100.

**Context notes and doctrine**
7. **Four context notes added** where a verse is commonly read beyond what it says: Acts 2:38–41 (often read as saying baptism itself forgives; the note shows that the people baptized were those who had believed, which matches the site's believer's-baptism view), Matthew 6:33 ("all these things" are food and clothing, not wealth, which matches the rule against prosperity teaching), John 16:21 and Zephaniah 3:17 (both much used for new babies; each note says whom the words were first spoken to).
8. **1 Peter 3:21 note rewritten.** The draft's quotation ran across a dash in the Berean as if it were one phrase, and it said "not the water", which the verse does not say. It now quotes the Berean exactly.
9. **Two notes tightened:** the Philippians note now covers the reading actually planned (4:11–13), and the Numbers 8 note no longer claims to be "the Bible's only retirement law". It is now "the one place the Bible speaks of retiring", which is what the Berean's own wording ("they must retire") supports.
10. **Deacon wording.** The confession limits the office of pastor to men, but says nothing about who may be a deacon, and Baptist churches differ on it. The draft's ordination explainer spoke of "a man's calling" for both offices. Pastor wording keeps it; the deacon wording now adds no ruling of the site's own (2.3, 4.4, 8).

**Code facts the draft had wrong or left open**
11. **The site's verse functions default to the Bible of the site's language**, not the Berean. Every call now passes the Berean explicitly, or a visitor viewing the site in Spanish would have seen Spanish verses under "Berean Standard Bible" (2.2, 7.1).
12. **The page translator would have translated things it must not.** Verse text now sits in `.scripture` with `lang="en"`. Visitors' typed names sit under `translate="no"`, so a baby named Grace or Joy is not turned into Gracia or Alegría on a printed card (2.2, 5.2, 6.3).
13. **Home-page entry.** The draft called for "one added card beside Find help", but the Resources section is made of large illustrated blocks the owner approved. A new one would be a redesign needing a mock-up first, and rewording an existing paragraph would lose its translations. The entry is now one new line of link text (5.5).
14. **Hub search title** shortened from 77 to 59 characters so search results do not cut it off (5.3).
15. **The hub shows verse references, not verse text.** Quoting one verse per pack would have fetched about a dozen whole books of the Bible just to draw a menu (5.3).
16. **The sitemap list comes from the data**, not a second hand-typed list, so a pack added later reaches it by itself. The test sits under `src/`, because the site's test runner only looks there (5.4, 7.3).
17. **An unknown pack renders the site's own not-found page.** The crawler-copy step recognises missing pages by that page's heading (5.1). The introduction must be the first long paragraph on the page, or a different paragraph becomes the search description (5.2).
18. **Which verses the card maker offers was defined two different ways**, and the readings sheet's contents were not defined at all. Both are now spelled out per format (6.1, 6.4). The data now says how many name fields a pack has, one or two (6.3, 7.1).

**Printing**
19. **The readings sheet would have printed to the paper's edge** on every page after the first, because it shared the single sheets' zero page margin. It now has a real margin (6.5).
20. **Print styles are no longer removed on `afterprint`**, which some phone browsers fire before printing. They stay until the visitor leaves the page (2.5, 6.5).
21. **Fonts:** `document.fonts.ready` does not fetch a face nobody has used yet, so each face is now requested explicitly (2.5, 6.5).
22. **A blank second page:** a sheet exactly as tall as the paper can spill over, so it is drawn a hair shorter (2.5, 6.5).
23. **Frames:** a Letter sheet does not fit an 8 × 10 in frame, as the draft said it did. The display print now keeps everything inside an 8 × 10 area, so the sheet can be trimmed to fit (6.1).
24. **Dark mode:** the sheet now uses fixed light colours, not the site's theme colours, so it cannot print dark (6.5, 6.6).
25. **The QR code** is built from the site's public address constant, so a card printed from the local preview never carries a `127.0.0.1` address (6.5).
26. **The print mechanism is kept free of anything to do with life events**, in one small module. The sympathy cards and home blessings later in this chain need the same thing and can import it instead of copying it (6.5, 7.2). The marker class was renamed to match (`print-sheet-active`).

### Checked and found correct
- Every one of the 182 references exists in the site's Berean files; Acts 8:37 is the only omitted verse met, and is handled.
- The quarter-fold layout (front bottom right, back bottom left, top half turned 180°, top left as inside right) is right; worked through fold by fold.
- The routing pattern (`/life-events/*`), the automatic page titles, the not-found handling in the crawler-copy step, the file budget, the `qrcode` package and the bundled fonts all exist as the draft describes.
- The long-list rule genuinely does not apply (no pack exceeds 16 passages). There is no runtime model cost and no new dependency. Neighbouring features are left to their own steps (sympathy is this chain's step 4, home blessings step 16).
- The chain C shared verse-card generator still did not exist on 2026-11-07. Section 7.4's plan to switch to it later stands.

### Left for the implementation step
- Print a real folded card, or fold a PDF of one, before calling the step done (6.2).
- Write the 182 notes, the context notes, 15 introductions and 3 explainers into the data files, checking each against the doctrinal foundation (4.1, 4.4).
