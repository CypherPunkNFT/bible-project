# Sermons campaign: every held sermon on its Bible passage, then many more sermons

**Class:** LIVING · **Opened:** 2026-10-08 by the owner · **State last verified:** 2026-10-08 (steps 1–2 done for Begg, Piper, Spurgeon; Wesley and Moody catalogued; Graham acquiring; not yet released) · Owner of this work: the chat started from the prompt at the end.

## What the owner asked (their words, condensed)

> "We need a lot more non-Spurgeon sermons. Alistair Begg must have a hundred sermons out there. Let's find them, let's find more. Billy Graham. Let's go and do some bulk downloads… Let's go through all of these and find the references. We really got to make sure we're doing a good job with this. It's a huge undertaking… Make sure this is really reflected [on the Teachers page]: *Every chapter, lit by our teachers*, *Teachers through the Bible*, and *All 47, by where they served* (their works) need to be updated."

## The owner's scope and starting order (decided 2026-10-08 — this replaces "Reformed only")

> "Any Baptist, and then… I just want the conservative, non-heretical, close-to-Baptist-as-possible sermons and preachers. We should go deep on Billy Graham; yes on Wesley, Moody. Just these alone, I'm sure you can bulk download hundreds. Let's start with that first, and then expand if we need to."

- **Who belongs on Preachers & authors:** any Baptist; beyond that, only **conservative, non-heretical** preachers as close to Baptist as possible. Not every member of a denomination qualifies just because of the label; some Presbyterian, Anglican, Congregational and Methodist bodies have heretical wings. The test is the preacher, not the denomination. Being Reformed is no longer required. Every person keeps a plain tradition label.
- **Start with three, and go deep:**
  1. **Billy Graham** (1918–2018, Southern Baptist evangelist). Go deep: as many sermons as can lawfully be had. The library holds only 4 PDFs (`sources/library/source-billy-graham`). Look at the Billy Graham Evangelistic Association's own published sermons and transcripts (read its terms first) and the Billy Graham Center Archives at Wheaton College for sermon listings and dates.
  2. **John Wesley** (1703–1791, the Methodists' founder, an Anglican priest). His sermons are public domain: the standard sermons and the wider set are on CCEL and the Wesley Center Online, each with its announced text.
  3. **D. L. Moody** (1837–1899, evangelist, Chicago). Public-domain sermon books are on CCEL, Project Gutenberg and the Internet Archive; prefer real text over scans (the owner does not want printed scans or OCR work).
  Expand only after these three are in and showing on the page, and ask the owner before adding anyone else outside the Baptist family.
- **Adding a person to the page** means: an author entry in the library registry ([authors.json](../../Website/content/library/authors.json), with the owner's scope as the basis, through the library's validator); a life entry in [content/teachers/lives.json](../../Website/content/teachers/lives.json) (years, places with arrival years, one line, best-known works, any documented links), fact-checked like the rest (2026-10-08 check: 17 errors in ~460 claims, so check everything); and a tradition family and colour in [shared/people.ts](../../Website/src/pages/teachers/shared/people.ts) (there is no Methodist family yet). Then update the wording that still says "Reformed": the station doorway text in [TeachersPage.tsx](../../Website/src/pages/TeachersPage.tsx) ("Five centuries of Reformed pastors and theologians…"), and any other page copy that says so. The landing's "Forty-seven…" line is computed from the data.

## Why the Teachers page looks thin today

The page is live at [/teachers/preachers-and-authors](https://bibleproject.io/teachers/preachers-and-authors) (notes: [README](README.md), [HANDOFF](HANDOFF.md)). Three of its sections run on **sermons that carry a main Bible text** in the library catalogue:

| Section | What it shows | What it reads |
|---|---|---|
| 01 · Every chapter, lit by our teachers | 1,189 chapter squares lit by how many works take each chapter as their main text; a chip per teacher repaints it | `chapters` and each person's `passages` |
| 02 · Teachers through the Bible | Ring of 66 book spokes per teacher; book panel listing each work with "Read the sermon ↗" | each person's `passages` (title, reference, verse id, date, reading address) |
| 08 · All 47, by where they served | Each person's "N works" | each person's `works` and `genres` |
| also: landing figures, the profile drawer (genre bar, 66-book strip, "Read them on a passage"), the /teachers station counts | | `works`, `genres`, `books`, `passages`, summary.json |

Only **11 of the 47** have any work with a main Bible text, and **Spurgeon is 3,432 of 3,892** of them. Yet the library **already holds** far more sermons whose passage was simply never recorded:

| Teacher | Catalogued works | …with a main Bible text | Files already held (sources/library) |
|---|---|---|---|
| Alistair Begg | 1,584 sermons | **80** | 1,482 Truth For Life pages in `source-begg` + 102 in `source-truth-for-life` |
| John Piper | 7,465 (5,031 sermons, 2,324 articles) | **5** | 7,314 Desiring God files in `source-desiring-god` |
| George Whitefield | 365 | 57 | collected works volumes |
| Jonathan Edwards | 473 | 71 | collected works volumes |
| John Newton | 110 | 84 | |
| J. C. Ryle | 93 | 29 | |
| John Owen | 427 | 12 | |
| Thomas Boston, Thomas Watson, John Flavel, Richard Sibbes, Thomas Goodwin, Stephen Charnock, Perkins… | 61–194 each | **0** | Puritan collections (L02), many sermons with a heading text |
| Spurgeon | 3,826 | 3,432 | complete (L01) |

(Counts from `src/data/teachers/people.json` as built on 2026-10-08 in the shared Website folder.)

**Proof the references are there:** a held Begg page (`sources/library/source-begg/asset-expanded-004173dc264bd38295ad/original.html`, "Made Perfect in Weakness") carries structured metadata: `scripture_ref … content="2 Corinthians 12:1–10"`. Desiring God pages need a look: the one checked was an article whose references sit in the body; messages may have a structured Scripture field. Puritan and 18th–19th-century volumes usually state the text under each sermon heading.

## How the data flows (read before changing anything)

1. **Catalogue** — `Website/content/library/catalog/works/*.json`. A sermon's main text lives in `passages`: `[{ reference, numberingSystem: "english", role: "main-text", start, end, verification, locator }]`, with `start`/`end` as verse ids `book*1e6 + chapter*1e3 + verse` (KJV/English numbering, 66 books). Delivery dates in `dates` (`event: "delivery"`). Rules: [CATALOG.md](../../Website/content/library/CATALOG.md), [schema.json](../../Website/content/library/schema.json), validator `node scripts/validate-library.mjs` (in Website/). Editions (`catalog/editions`) link works to assets (`catalog/assets`), and assets point at the held file and its original address.
2. **Held files** — `BibleProject/sources/library/<source-id>/<asset-id>/original.*` with `provenance.json` (url, sha256, retrievedAt). Never change a held file; new bytes are a new asset.
3. **Teachers data** — `Website/scripts/build-teacher-pages.ts` (`npm run teacher-pages`, `npm run teacher-pages:check`) reads the catalogue through [scripts/teacher-pages/people.ts](../../Website/scripts/teacher-pages/people.ts) (`collectHoldings`: every work with a `role: "main-text"` passage counts towards `books`, `chapters` and `passages`; the reading address comes from the asset, else the volume it is part of, else the cited source) and writes `src/data/teachers/people.json`, `scholars.json`, `summary.json`. The page code needs no change for more passages: the sections compute everything from that file.
4. **Release** — the global [HANDOFF](../../HANDOFF.md) section 4 (own worktree, build before prepare, data compared with the live package, verify on the pages.dev address, wait ~4 minutes, verify live).

## Hard facts and traps

- **About 34,000 catalogue records are not in git.** `content/library/catalog/{works,editions,assets}` holds ~34k untracked "reconciled" records from the library campaign ([campaign-reconciliation](../../Website/content/library/reports/campaign-reconciliation/)); Begg's 1,584 and Piper's 7,465 works are among them. The Teachers data is therefore built in the shared Website folder, never from a clean checkout (there it counts 4,874 works instead of 17,938). Decide with the owner early whether those records get committed (size, review) — passages written into untracked files are only as safe as those files. Never delete or "clean" them.
- **Main text, not every citation.** The sermon-coverage audit ([report](../../Website/content/library/reports/sermon-coverage/REPORT.md)) separates a sermon's announced text from passing quotations and from proven exposition. Record the source's announced/heading text as `main-text` with its `verification` and a `locator` saying where it was read (e.g. "TFL page meta scripture_ref"); never infer a passage from a title alone; list what could not be resolved instead of guessing.
- **Source terms first.** [sources.json](../../Website/content/library/sources.json) records per source: Desiring God `automation: manual-only` and its [permissions page](https://www.desiringgod.org/permissions); Truth For Life `unreviewed`; MLJ Trust's terms prohibit systematic retrieval for a database; Piper retrieval stopped on HTTP 429 with 491 destinations unresolved ([ready-text-completion](../../Website/content/library/reports/ready-text-completion/REPORT.md)). The owner authorises private local indexing of lawfully held text; the site never re-hosts texts (it links to the original). Before any bulk download: read the source's terms and robots.txt, throttle, keep a resumable checkpoint, record provenance exactly as existing assets do, and stop on 429/blocks.
- **The library charter still says Reformed.** Its eligibility rules ([CHARTER.md](../../Website/content/library/CHARTER.md), [AUTHORS.md](../../Website/content/library/AUTHORS.md)) were written for a Reformed collection. The owner's 2026-10-08 scope above (any Baptist; conservative, non-heretical, close to Baptist) widens it. Record that decision in the charter, with the date and the owner's words, before adding Graham, Wesley and Moody. For anyone beyond these three outside the Baptist family, ask the owner first.
- **Other chats share the folder.** Commit only your own files by name; never `git add -A`. The library desk has its own missions (BACKLOG L00–L15, [MISSION-TEMPLATE.md](../../Website/content/library/MISSION-TEMPLATE.md)) — this campaign extends L04 (modern preaching), L05 (Scripture coverage) and L02/L03 (historic preaching); record it there the same way.

## Step 1 results (recon, 2026-10-08)

Read-only count of the shared Website folder's catalogue (18,450 works) against every held file's `provenance.json`; held file ↔ work matched by web address (the reconciled works do not point at held assets by id).

| Teacher | Catalogued | Main text now | Held page states a text | Held, no text stated | Not held |
|---|---|---|---|---|---|
| Alistair Begg | 1,584 sermons | 80 | **1,424** (TFL `scripture_ref` meta) | 58 | 22 |
| John Piper | 7,465 = 2,399 messages + 2,632 *Ask Pastor John* interviews (filed as `sermon`) + 2,324 articles + 110 books | 5 | **~1,615** messages (DG "Scripture:" link, `data-grouping-type="Scripture"`; 42 pages list 2+) | ~750 messages | 254 records |
| Spurgeon | 3,566 sermons | 3,432 | 113 have a written reference with no verse ids | | |

- **Historic preachers** (Whitefield, Edwards, Owen, Boston, Watson, Sibbes, Goodwin, Flavel, Charnock, Perkins): the catalogue holds them almost entirely as whole books (`treatise`/`collected-works`), not one record per sermon, and some reconciled records belong to namesakes (e.g. a physician Thomas Watson's *Lectures on … Physic*, a copy book). Putting them on passages means first splitting each held volume into sermon records, then reading the heading text; slower, after Begg and Piper.
- **Git safety:** only Begg's 80 already-placed works are in git (80 of 1,584); the other Begg and Piper works are untracked reconciled records. Decision: passages found by this campaign go in a **committed overlay** (`content/library/passage-overlays/<source>.json`: work id → passage, verification, locator) that `build-teacher-pages.ts` merges, so the work is safe without committing or editing the ~34k untracked records.
- Expected effect of Begg + Piper alone: passages ≈ 3,892 → ≈ 6,930; Spurgeon falls from ~88% to ~half of the chart.
- Scripts: scratch recon only (not committed); counts reproducible from the method above.

## Progress (2026-10-08, this chat)

**Step 2, held sermons placed** (commit `48da8608`): [sermon-passages.py](../../Website/scripts/sermon-passages.py) reads each publisher's stated text, checks every verse against our KJV and writes [passage-overlays/](../../Website/content/library/passage-overlays/) (begg, piper, spurgeon), which [people.ts](../../Website/scripts/teacher-pages/people.ts) merges. Re-run it after any new Begg/Piper download.

| Teacher | On a passage before → after | Notes |
|---|---|---|
| Begg | 80 → 1,417 | 80 second records of one sermon marked `duplicateOf` (works 1,584 → 1,504); 58 pages state no text; 7 whole-Bible survey sermons left unplaced |
| Piper | 5 → 1,618 | 2,632 *Ask Pastor John* episodes counted as `interview` (overlay only: adding the genre to vocabulary.json breaks the Reformed-reading publication hash, so it is not in the vocabulary) |
| Spurgeon | 3,432 → 3,544 | one heading left: "Romans 10:59" (no such verse) |

Audit: 50 random per source against the held page: Begg 0 errors, Piper 0; Spurgeon 2 reading errors (a doubled heading; "43:1-4; 22-25" read as chapters), fixed in the parser and re-checked over all 112.

**Step 3, first acquisitions** (commit `f61e05e2`): [catalog-campaign-sermons.py](../../Website/scripts/catalog-campaign-sermons.py) writes one work per sermon from each run's manifest in [reports/sermons-campaign/](../../Website/content/library/reports/sermons-campaign/) (manifest, TERMS.md, catalogue-run.json with every unplaced sermon and why).

| Preacher | Sermons | On a printed text | Source |
|---|---|---|---|
| John Wesley | 141 (139 fetched, 2 already held as TCP copies) | 140 (one misprint, "Isa. 2:21") | Wesley Center Online, Jackson 1872 |
| D. L. Moody | 101 from 10 books (plus 10 book records) | 27 (the rest print no reference, e.g. the Ten Commandments addresses, or a misprint) | Project Gutenberg mirror (folder moved to `source-gutenberg`, provenance path updated, checksums verified) |
| Billy Graham | in progress | | billygraham.org |

People added to the page: authors.json, lives.json (fact-checked: 3 homes added, 2 wording fixes, 7 documented links), a Methodists family (`--apocrypha`), Moody with the Evangelicals, directory towns, "Fifty", station text "Baptist, Reformed and evangelical". Charter records the owner's widened scope.

## The work, in order

1. **Recon (report numbers before acting).** Per teacher and per source: catalogued sermons, how many already have a main text, how many held files, and which structured field (if any) carries the text. Sample each source by hand.
2. **Extract the main text from files already held** — Begg first (structured `scripture_ref`), then Piper (find the reliable field; separate messages from articles), then the historic collections (Whitefield, Edwards, Newton, Ryle, Owen, the Puritans) from sermon headings. One small, tested parser per source; references converted to verse ids with the project's existing Scripture index (see how `scripts/analyze-sermon-coverage.py` and the Spurgeon reports resolve references). Write `passages` into the catalogue (or, if the owner prefers, a separate reviewed overlay that `build-teacher-pages.ts` merges — say which and why). Audit a random sample of at least 50 per source against the original page; report the error rate.
3. **Bulk-acquire**, within each source's terms. First **Billy Graham (deep), John Wesley and D. L. Moody**, the owner's starting three, each added to the registry, lives.json and the page as above. Then Begg's wider Truth For Life archive. Then other conservative, close-to-Baptist preachers, only with the owner's say-so. Catalogue each new sermon with its main text at acquisition time.
4. **Rebuild and show it.** `npm run teacher-pages` in the shared Website folder; check sections 01, 02 and 08, the landing figures, the drawer and the station counts by eye (1440 light/dark, 390); update any spec that hard-codes counts (`e2e/teachers-*.spec.ts`); `tsc`, eslint, the Teachers specs against your own build; commit by name; release per the HANDOFF; DevLog in `Jarvis/DevLogs/`.

## Done looks like

- Billy Graham, John Wesley and D. L. Moody are on the Preachers & authors page with hundreds of sermons on their Bible passages.
- Begg and Piper each show hundreds or thousands of sermons on their Bible passages on the live page; the historic preachers show theirs; Spurgeon is no longer most of the chart.
- Every recorded main text has a source locator and a verification level; unresolved items are listed, not guessed.
- The before/after numbers per teacher are in the DevLog and in this file.

## Copy-paste prompt for the new chat

> Start the Bible Project's **sermons campaign** (Jarvis/Projects/BibleProject). Read, in order: `Pages/Teachers/SERMONS-CAMPAIGN.md` (this brief: goal, data flow, traps, the four steps), `Pages/Teachers/README.md` and `HANDOFF.md`, the global `HANDOFF.md` (sections 3–4: what is live, how to release), and `Website/content/library/README.md`, `CATALOG.md`, `BACKLOG.md`. The goal: every sermon the library already holds gets its main Bible text recorded (Alistair Begg 1,482 held pages but only 80 with a passage; John Piper 7,314 held files but 5; the historic preachers' volumes), then bulk-acquire more sermons within each source's terms, then rebuild the Teachers data so *Every chapter, lit by our teachers*, *Teachers through the Bible* and *All 47, by where they served* reflect it, and release. Begin with step 1 (recon) and report the numbers to the owner in short plain words before extracting. Scope (owner, 2026-10-08): any Baptist, otherwise only conservative, non-heretical preachers as close to Baptist as possible; Reformed is no longer required. Start acquisition with Billy Graham (go deep), John Wesley and D. L. Moody (hundreds of sermons between them), add each to the registry, `content/teachers/lives.json` (fact-checked) and the page, then expand only with the owner's say-so. Rules: the owner doesn't read code — report briefly and plainly, explain any number; never guess a passage; respect source terms (throttle, checkpoints, stop on 429); never delete or clean the ~34,000 untracked catalogue records; commit only your own files by name; build the Teachers data in the shared Website folder (`npm run teacher-pages`); test against your own build (`vite build --outDir .local/<name>`, `vite preview --outDir .local/<name> --port <port>`); release only per the HANDOFF; write a DevLog entry at the end.
