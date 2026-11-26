# Historic sermons, second round: what steps 6–13 of the plan did

Done 2026-11-26 (job 4b5ae800), from files already held. Nothing was downloaded, no held file was changed, no AI model was called, and the cost was $0. The plan is [REPORT.md](REPORT.md) / [plan.json](plan.json). The first round (Calvin, Bullinger, Flavel, Sibbes, Owen) is commit `75ce992f7`.

## What changed on the Preachers & authors page

"On a passage" means a sermon whose own printed text gives a Bible passage. A passage is never taken from a title.

| Preacher | Sermons on a passage, before → after | Works on the page, before → after | How |
|---|---|---|---|
| Thomas Boston | 0 → 76 | 194 → 275 | 81 sermons split from three held e-books (*Sixty-Six Sermons*, *Amiable Professors*, *Christ Jesus Duly Prized*); 5 print a wrong reference and are listed without a passage |
| Thomas Goodwin | 0 → 67 | 158 → 223 | 60 Ephesians sermons read against the e-book's contents page, 3 appended Ephesians sermons, 2 on repentance; 4 single printed sermons marked "sermon" (2 placed) |
| Samuel Rutherford | 0 → 35 | 366 → 427 | 61 sermons (*Quaint Sermons*, *Communion Sermons*, *Trial and Triumph of Faith*, two printed sermons); 26 print no reference at their head |
| Thomas Watson | 0 → 28 | 135 → 157 | 22 sermons from the books that bind them in; 8 single printed sermons marked "sermon" (7 placed) |
| George Whitefield | 57 → 74 | 365 → 383 | 18 sermons (TCP N25065) the library did not already hold; Edwards added none, because every candidate was already held |
| William Perkins | 0 → 1 | 114 → 135 | *Exhortation to Repentance* (Zephaniah 2:1–2) marked "sermon"; Jude became **21 verse units of an exposition**, catalogued as commentary on their verses and never counted as sermons (the "66 sermons" exist only on the title page) |
| Stephen Charnock | 0 → 1 | 61 → 60 | his one printed sermon (2 Corinthians 5:19) marked "sermon"; the scanned copy of the same sermon is now linked to it as a duplicate |
| John Knox | 0 → 1 | 31 → 31 | his printed sermon on Isaiah 26:13 marked "sermon" |
| John Bunyan | 0 → 1 | 1,025 → 888 | his 18 sermon-form discourses: one record each is marked "sermon", and 137 reprints, extracts and translations are linked to it as duplicates; 22 volumes that bind a second work are left alone |

**Whole page:** sermons on a passage went from 9,070 to 9,297, and passages recorded from 9,211 to 9,456. **Spurgeon's share** of sermons on a passage fell from 39.07% to 38.12%; of works on a passage, from 38.48% to 37.48%. His own count is unchanged at 3,544.

**People with no sermon on a passage:** 37 before, 29 after. Every one of the 29 has its reason in [zeros-20261126.md](../zeros-20261126.md).

## Checks

- **Placement audit:** for each preacher, a random 50 placed records (or all of them, where there are fewer) were checked against the held file read raw. See [audit-20261126.txt](audit-20261126.txt). Two errors turned up and both are fixed. One was Charnock's sermon, recorded as the whole of 2 Corinthians 5 instead of 5:19. The other was Bunyan's *Saved by Grace*, where the record chosen to stand for the discourse was a volume binding four works. Error rates: Rutherford 0/35, Boston 0/50, Goodwin 0/50, Watson 0/21, Perkins 0/21, Whitefield 0/17, single sermons 1/11, Bunyan links 1/50.
- **Misprints are listed, never corrected.** Where the words quoted at a sermon's head are not in the verses it prints, the sermon is kept and listed without a passage. The reason names the verse the words do come from. Examples: Boston prints 1 Kings 16:21 for 18:21, Luke 16:26 for 14:26 and Acts 28:23 for 27:23; Rutherford prints Jeremiah 1:4–5 for 50:4–5; Watson's *God's Anatomy upon Man's Heart* cites Hebrews 4:12 but quotes 4:13.
- **Only the first-named author counts.** Every single sermon is checked against its record's first creator before it is marked.
- **The first round was not disturbed.** Calvin, Bullinger, Flavel, Sibbes and Owen re-read identically after every parser change. `node scripts/validate-library.mjs` passes.

## Files

- New sermon records: `content/library/catalog/works/work-sermons-{rutherford,boston,goodwin,watson,perkins,whitefield}-*.json` (268), written by [catalog-historic-sermons.py](../../../../../scripts/catalog-historic-sermons.py). Each preacher's run report, with every unplaced sermon and why, is in `../<preacher>/catalogue-run.json`.
- Overlay for records the library already held: [historic-sermons-20261126.json](../../../passage-overlays/historic-sermons-20261126.json), written by [relabel-historic-sermons.py](../../../../../scripts/relabel-historic-sermons.py). Its run report is [relabel-run.json](relabel-run.json), which lists each Bunyan discourse, the record that stands for it and the volumes left alone.
- [cpu-reviewed-teachers-20261014.json](../../../passage-overlays/cpu-reviewed-teachers-20261014.json) got three hand-added fields. Two records it already placed (Watson's farewell sermon and Bunyan's *Saint's Knowledge*) are now marked "sermon". The scanned Charnock copy is now linked as a duplicate. The later overlay file would otherwise have silently replaced these entries.
