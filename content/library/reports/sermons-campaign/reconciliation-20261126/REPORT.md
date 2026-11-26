# Sermons campaign: reconciliation and rights register, 26 November 2026

**Job:** 92d9c9859d2244f8b9be85419e741f73 · **Measured:** 2026-11-26 · **Kind:** report only; no catalogue data was changed.
**Meant to live at:** `Website/content/library/reports/sermons-campaign/reconciliation-20261126/REPORT.md`, with
[sermons-campaign-summary.92d9c9859d2244f8b9be85419e741f73.json](sermons-campaign-summary.92d9c9859d2244f8b9be85419e741f73.json)
as its `summary.json`. This job ran read-only, so it could write only to `docs/reports/`. Both files are here
under names that carry the job id. The edits to the campaign brief are prepared in
[sermons-campaign-BRIEF-EDITS.92d9c9859d2244f8b9be85419e741f73.md](sermons-campaign-BRIEF-EDITS.92d9c9859d2244f8b9be85419e741f73.md)
and still need to be applied.

## How it was counted

All counts come from the files, not from earlier reports. They were read from the shared Website folder at `main` `13ca1e1da`:

- **Catalogued:** work records in `content/library/catalog/works/` (18,702 in total) whose `creators` name the preacher's author id.
- **With a main Bible text:** non-duplicate works with a `role: "main-text"` passage that has verse ids. This uses the
  work record plus `content/library/passage-overlays/`, as `build-teacher-pages.ts` does. The column "in the record alone"
  leaves the overlays out.
- **Held files:** the asset folders in `sources/library/<source>/`, counted on disk. Separately, the catalogue assets linked
  to the preacher's works whose file is present.
- **Preachers page:** the preacher's entry in `src/data/teachers/people.json`, built 2026-11-19. That is the data the page
  shows, but it is not the live site.

The scripts used are kept in the job's own folder (`C:\FortressOrchestrator\workspaces\92d9c985…\count_92d9c985.py`,
`landed_92d9c985.py`). They only read.

### What the other jobs have landed so far (initiative 118)

**Nothing yet, as of 26 Nov.** The newest work record in the catalogue was written on 2026-10-12. No
Maclaren, Morgan or Graham work record exists. `scripts/catalog-campaign-sermons.py` still has no `maclaren` entry. The passage
overlays are unchanged since 2026-10-14. Neither `main` nor `origin/main` has a sermons commit after `4988d02d3` (October), and the only
other worktree is the language release. If those jobs are working, they are doing it outside the shared tree. Their
results must be re-counted when they land.

## Part 1. Every campaign preacher, from the files

| Preacher | Catalogued | Main Bible text (in the record alone) | Held files | On the Preachers page now |
|---|---|---|---|---|
| Alistair Begg | 1,584 (1,504 once 80 duplicates are set aside) | **1,417** (80) | 1,482 `source-begg` + 102 `source-truth-for-life` | 1,504 works · 1,417 on passages |
| John Piper | 7,465 = 2,399 messages, 2,632 *Ask Pastor John*, 2,324 articles, 110 books (7,460 after 5 duplicates) | **1,618** (5) | 7,314 `source-desiring-god` | 7,460 works · 1,618 on passages |
| C. H. Spurgeon | 3,826 (3,566 sermons) | **3,544** (3,432) | 3,652 `source-spurgeon-gems` PDFs | 3,826 works · 3,544 on passages |
| John Wesley | 141 | **140** | 139 `source-wesley-center` + 2 reused copies from the Text Creation Partnership | 141 works · 140 on passages |
| D. L. Moody | 110 (101 sermons + 9 book records) | **27** | 10 Gutenberg books | 110 works · 27 on passages |
| Billy Graham | **0** | 0 | 56 in `source-billy-graham` (49 billygraham.org pages, 7 PDFs) + 23 automatic YouTube transcripts | on the page, **0 works**; shelf shows 80 held texts |
| W. A. Criswell | **0** (not in the registry) | 0 | **2,517** in `source-criswell` | **not on the page** |
| Alexander Maclaren | **0** (not in the registry) | 0 | 14 CCEL volumes = 1,311 sermons (1,306 with a printed text) | **not on the page** |
| G. Campbell Morgan | **0** | 0 | 19 Internet Archive volumes = 97 sermons (67 with a printed text) | on the page, **0 works**; shelf 32 |
| John MacArthur | 0 | 0 | 0 sermons (1 held text on his shelf) | on the page, 0 works |
| D. Martyn Lloyd-Jones | 2 | 0 | 2 linked assets | 2 works · 0 on passages |
| R. C. Sproul | 12 | **12** | 12 linked assets, none on disk (link only); 2 held texts on his shelf | 12 works · 12 on passages |
| Sinclair B. Ferguson | 0 | 0 | 21 held texts on his shelf | 0 works |
| J. I. Packer | 8 (books) | 0 | 3 | 8 works · 0 |
| George Whitefield | 365 (58 sermons) | 57 | 12 linked | 365 · 57 |
| Jonathan Edwards | 473 (64 sermons) | 71 | 34 linked | 473 · 71 |
| John Newton | 110 (84 sermons) | 84 | 17 linked | 110 · 84 |
| J. C. Ryle | 93 (29 sermons) | 29 | 11 linked | 93 · 29 |
| John Owen | 427 (whole books) | 12 | 18 linked | 427 · 12 |
| Boston, Watson, Flavel, Sibbes, Goodwin, Charnock, Perkins | 61–194 each, all whole books | 0–2 each (from one reviewed overlay of 10 works) | 4–13 linked each | as catalogued · 0–2 |

The JSON file gives each preacher's counts by genre, the linked assets that are present on disk, and the definitions.

**What this means.** About 8,000 sermons are held and fully recorded, but none of them is on the Preachers page:
Criswell 2,517, Maclaren 1,311, Morgan 97 and Graham's 56 pages. Maclaren and Morgan finished in October with complete manifests. Criswell and Graham
stopped partway, and their only manifests are progress snapshots. Of the three acquisitions the brief lists as
"in progress", Maclaren and Morgan actually finished. Criswell stopped at 61 per cent.

### The brief's lines that were stale, and what is true now

1. **"State last verified: 2026-10-08 … Graham acquiring; not yet released."** No acquisition is running. The scratch
   folders the launchers point at no longer exist. Graham's scan stopped at about 1,600 of 3,056 pages, with 56 files held. Criswell's run
   stopped at 09:58 UTC on 2026-10-09 with 2,517 of 4,093 held. None of it is catalogued.
2. **Step 3 table, "Billy Graham | in progress".** Stopped. 56 held, 0 catalogued, and Graham shows 0 works on the page.
3. **Maclaren and Morgan are missing from the brief altogether.** Both finished on 2026-10-09 (1,311 and 97 sermons) and have
   never been catalogued (README: "Done, not yet catalogued").
4. **Criswell, "25 held / 4,068 remaining".** That figure is the checkpoint saved to git after 25 sermons. The held folder has **2,517**,
   so **1,576** remain. All 2,517 provenance records are marked `restricted-license`.
5. **Moody, "27 on a printed text".** That is still what the page shows. But the manifest's own count is 50 with a stated text, against 27 placed,
   so 23 stated texts were not placed. Worth a look when Maclaren and Morgan land.
6. **"Why the Teachers page looks thin" table.** The "with a main Bible text" column (Begg 80, Piper 5, Spurgeon 3,432) is the
   pre-campaign state. It is now 1,417, 1,618 and 3,544. The "Only 11 of the 47" line is also out of date: the page now lists 52 people.
7. **"About 34,000 catalogue records are not in git."** They are no longer untracked: `git ls-files` counts all
   18,702 work records as tracked, and `git status` shows nothing untracked under `catalog/`. A clean checkout
   should now see the same catalogue, so the brief's warning to build only in the shared folder no longer has that reason.
8. **Truth For Life `unreviewed`.** It has now been reviewed (Part 2). `sources.json` still says `unreviewed`, and the brief repeats it.

## Part 2. Rights register: the preachers who are blocked

Every terms page and robots.txt below was read again today (2026-11-26) with the campaign's honest user agent. Copies are kept in
the job folder (`terms_92d9c985/`). No sermon page was fetched. For gty.org only robots.txt was read, because its robots.txt shuts our client out
of everything else, including the policy page. Its policy text is quoted from the copies the October run saved
(`macarthur/progress/terms/`).

| Preacher | Wanted | What the source's own terms say (current) | Held today | Single next step |
|---|---|---|---|---|
| **John MacArthur** (Grace to You, gty.org) | his sermons on their passages | robots.txt today is still `User-agent: *` / `Disallow: /`. It allows only Googlebot, Bingbot, Meta and Facebook previews. The copyright policy (October copy) lets anyone use Sermon Series transcripts if they are "free", unchanged and credited, with no print reproduction; "You may link to and share media … but you may not post that media on your website". It says nothing that permits automated retrieval. | 0 sermons | **Owner emails letters@gty.org** asking for a bulk export or permission to retrieve. Until they answer, the only lawful route is links added by hand. |
| **W. A. Criswell** (wacriswell.com) | all 4,093 | robots.txt allows everything but `/wp-admin/`, with a 10-second delay, so retrieval is allowed. There is still no terms, copyright or licence page. The only legal page is the Privacy Policy, which refers to "the legal notice", but no such notice exists. No licence is granted, so the default is all rights reserved (W. A. Criswell Foundation). | **2,517** held, 0 catalogued, 1,576 not held | **Owner decides:** (a) catalogue the 2,517 as links to the originals and finish the remaining 1,576 the same way, or (b) first ask the Foundation for permission. This is a decision, not a crawl. |
| **D. Martyn Lloyd-Jones** (MLJ Trust) | his sermons | Terms, current: "Systematic retrieval of data or other content from this Site to prepare any collection, compilation, database, or directory is prohibited." The audio licence allows downloading and copying for yourself but not distributing, and nothing may be posted online without written permission. robots.txt blocks only `/accounts` and `/search`, but the terms forbid this use anyway. | 2 works | **Owner writes to the Trust** for permission. Without it, at most a few hand-picked links. Even a complete link index would be a "directory". |
| **John Piper** (Desiring God) | the rest of his messages | Permissions page, current: Piper's content may be freely used and shared "for personal or noncommercial … uses provided that when publishing textual content online … only quotes and excerpts may be used, not the entire work". Audio and video may be embedded but not re-uploaded. Some books are under a publisher licence that "limits use to this site". robots.txt allows message pages. The October stop was a rate limit (HTTP 429), not a ban. | 7,314 files; 1,618 on passages; 491 destinations never resolved | **After a cool-down, resume the 491 at the 3-second pace already set**, stopping at the first 429. Then run `sermon-passages.py` again. Every record is a link out. |
| **Alistair Begg** (Truth For Life) | his whole archive | **Reviewed today** ([policies page](https://www.truthforlife.org/about/policies/)): "You may duplicate and distribute copies of Alistair's sermons without prior permission", if unaltered, free of charge and credited, under "an irrevocable, nonexclusive and royalty-free right". Written web content may be posted on another site if it is unedited, links to the original and the homepage, and carries "Copyright Truth For Life. Used with Permission." Rights can be revoked. No clause on automated access. robots.txt blocks only filtered listing pages, and declares `Content-Signal: search=yes, ai-train=yes, ai-input=yes`. Sermons from 2011-11-06 on quote the ESV; earlier ones the NIV. | 1,482 + 102 pages; 1,417 on passages | **Update `sources.json`** to `automation: allowed` (throttled) with this evidence, then acquire the rest of the archive from its sitemap. The size of the archive was not counted: reading the sitemap was outside this job. |
| **R. C. Sproul, Sinclair Ferguson, J. I. Packer** (Ligonier) | their teaching | Copyright policy, current: "To share free audio and video content … you must hyperlink to the page that contains the media. Content may not be re-uploaded"; "No article may be re-uploaded or re-posted in full on another website without permission". Sproul's books from other publishers are outside the policy. robots.txt blocks only `/api` and asset folders. | Sproul 12 records with passages; Ferguson 21 held texts; Packer 3 | **Build a link index by hand or with a slow, polite pass over Ligonier's own pages**, recording each sermon's passage from its page. No text is held. |

### Plainly, for the owner

The site links to the originals and never re-hosts them. That rule stands, so "complete" below means every sermon findable on
its Bible passage, with a link to the original.

- **Can be complete as text (public domain, held privately, linked on the page):** Spurgeon, Wesley, Moody, Maclaren, Morgan's
  public-domain volumes, Whitefield, Edwards, Newton, Ryle, Owen and the Puritans.
- **Can be complete, held privately under the publisher's own permission:** **Alistair Begg.** Truth For Life gives
  more than any other modern source. **John Piper** is close behind: private copies are allowed, and pages may only quote. Both are
  slow work, not a rights problem.
- **Can only ever be a complete index of links:** **Sproul, Ferguson and Packer** (Ligonier), and **Billy Graham**. The
  association allows only personal use and no reproduction without written permission. The 56 files already held are for
  private study only.
- **Needs the owner's decision:** **Criswell.** Fetching is allowed, but there is no licence. The owner can accept links-only
  cataloguing of what is held, or ask first.
- **Closed unless the owner gets written permission:** **MacArthur**, because robots.txt shuts out everyone except named search
  engines. There is a permitted route for using transcripts, but there is no permitted way to retrieve them automatically.
  **Lloyd-Jones**, because the terms forbid building any collection or directory from the site.

## Part 3. Two loose ends (flagged, not fixed)

### John Bunyan and D. A. Carson: yes, their shelves are lost, and it is worse than "filed on the scholars side"

- In `content/library/authors.json` both are `eligibility: "provisional"`. `scripts/build-acquired-teachers.py` (lines 163
  and 175) files every author that is not exactly `eligible` under `side: "scholars"`. The 16 Baptists in
  `content/teachers/acquired-selection.json` are the exception, and Bunyan and Carson are not on that list.
- The built input `.local/teacher-library/teacher-input.json` (last built **2026-10-10**) has both on the scholars side, with **1,032** held
  records for Bunyan and **377** for Carson.
- `scripts/teacher-pages/people.ts:119` keeps only the preachers side. `scripts/teacher-pages/scholars.ts:44` keeps only the scholars side,
  matched by the Scholars page's own ids, and neither man is in `content/teachers/scholars.json`.
- **Result in the built Preachers data:** both appear on the Preachers page (Bunyan 1,026 works, Carson 1 work), but both have
  `heldTexts: 0` and `acquiredShelf: null`. Their acquired shelves are reachable from **neither** page. There is no "Browse the full
  shelf" link at all.
- **Clean fix:** derive the side from the Preachers page's own roster. Use `preachers` when the author id is in
  `content/teachers/lives.json`, and fall back to the eligibility rule only for people on neither page. That is one rule
  shared by lines 163 and 175. Then rebuild `build-acquired-teachers.py` followed by `npm run teacher-pages`. Do not mark them `eligible` just to
  move a shelf: provisional is a judgment about the person, and should stay separate from where the shelf is filed.
- A side oddity: Carson has 1 work but 373 catalogue assets whose editions point at it. That linkage is worth a look when this is fixed.

### Acquisition manifests in `reports/` with no catalogue records

All 41 manifests were joined to the catalogue by every available route: asset id, work id, checksum, file path, address, and the
reconciliation manifest. Twelve reach no catalogue record at all:

| Manifest | Entries | What it is | Finished but not landed? |
|---|---|---|---|
| `sermons-campaign/maclaren` | 1,311 sermons | complete, 1,306 with a printed text | **Yes: land it** |
| `sermons-campaign/morgan` | 97 sermons | complete, 67 with a printed text | **Yes: land it** |
| `graham-transcripts-20261010` | 116 files (23 sermon transcripts) | automatic YouTube transcripts, not checked for accuracy | Yes, though transcripts are not a reading text; at most a link to each original video |
| `reformed-baptist-overnight/RB12` | 2,257 | Baptist association and convention minutes | Yes, if the library wants them; not sermons |
| `reformed-baptist-overnight/RB09` | 584 | Josephus, Lightfoot, Edersheim (background) | Not sermons |
| `letters-cited/LC01` | 48 | volumes behind the cited-letters feature | Kept for that feature by design |
| `csel-20261009`, `patristic-expansion-20261009` | 1,111 · 4,452 | Latin and patristic repositories for private reading | By design (private intake) |
| `private-biblical-history`, `local-downloads-20261010` | 92,926 · 633 | private collections (the latter includes an "unrelated billing invoice") | By design |
| `campaign-reconciliation/text` (two) | 3 each | summaries, not acquisitions | n/a |

**Two held runs have no acquisition manifest at all.** Criswell's 2,517 pages and Graham's 56 files have only progress snapshots
(`criswell/progress/manifest.json` at 25 entries; Graham none). `build-acquired-teachers.py` reads their provenance files directly. Each needs a manifest built from those
provenance files before it can be catalogued.

## Files

- This report and its counts file in `docs/reports/` (names above).
- The proposed edits to the brief: `sermons-campaign-BRIEF-EDITS.92d9c9859d2244f8b9be85419e741f73.md`.
- Nothing in `Website/` was changed.
