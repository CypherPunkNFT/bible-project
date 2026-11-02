# Making a full Bible Guide release faster

**Status, 2026-11-02: finished.** A full release's machine time should fall from about 11-12 minutes to about 7. The safe
changes are in the scripts. Nothing was published while measuring this. **Recommended next: build the package on the internal C: drive.**

## Where the time goes today

Real clock from the full release of 2026-11-02 afternoon, largest first. Machine time was about 11 minutes, or about
25 minutes with the search-copy refresh. Start to live took 18 min 10 s, because the person running it stopped between stages.

| Stage | Seconds | What it is |
|---|---:|---|
| Refresh of search-engine copies | 849 | A browser reads 1,680 pages of the live site, four at a time. Run before the release |
| Reader packs | 223 | Groups Bible text and cross-reference files |
| Wrangler (Cloudflare's upload tool) reading all files | 112 | It fingerprints every file in a new package |
| Pre-build checks | 86 | About half of it is one check, see below |
| Data copy | 79 | Copies the data folder into the package |
| Live checks | 56 | Opening pages on the live site |
| Vite (the code build) | 48 | Measured again at 38 s |
| Population hosting | 29 | Splits the large scholar files |
| Build copy | 26 | Copies 5 GB of the finished build into the package |
| Sending changed files | 20 | 2,062 files that time |
| Search-engine pages, atlas, checks, the rest | about 25 | |

## What the measurements found

All of this was measured on a throwaway copy, not on the live package.

**The disk is the main cause.** Everything runs on D:, a USB drive (SanDisk Extreme). Writing one new file there costs
about 6-7 ms, and the internal C: drive about 0.1-0.5 ms. Bitdefender is the active antivirus and may add to this; I could
not separate the two without turning it off, which I did not do.

**More threads made D: writes worse.** Packing the same 41,497 Bible text files (writing 24,179):

| How | Seconds |
|---|---:|
| One thread, writing to D: | 48 |
| Four threads, writing to D: | 180 |
| Eight threads, writing to D: | 198, including a little other work |
| Eight threads, writing to C: | 5 |

**Reading is the opposite: threads help a lot** the first time a file is read: 2.64 ms per file with one thread, 0.51 with
eight and 0.32 with 32 (24,179 files of an archived package that had not been read recently).

**Reader packs (223 s) was almost all disk work, not computing.** Profile: reading files 95 s, writing 43 s, opening 38 s,
deleting 11 s. JSON work took about 6 s and the fingerprint sum 1 s. It split as text 159 s, cross-references 2 s and the
content stamp 43 s. The wasteful part: the previous stage copies about 42,700 files into the package, and this stage reads
them and then deletes them.

**The verse-wording check takes about 45-49 s of the 86 s before Vite.** It is the check that no file but the Bibles holds a
whole verse. It is pure computing over about 24,000 files, on one processor. With a shortcut and 12 processes it took 17 s, and a verse
planted on purpose was still caught, with exactly the same report as the old check.

**Wrangler's reading can be done ahead on many threads.** Fingerprinting the live package took 30.5 s on one thread and 6.6 s on
16, and **all 43,098 fingerprints matched the ones wrangler itself calculated**. Wrangler took 112 s on this step in the real
release.

**The cause you were warned about, program launches on D:, does not show up today.** Launches took 0.07-0.24 s (node, python,
bun), and npm 0.48 s, not 2.9 s.

**Robocopy is not faster here:** 443 s for 59,427 files, about 7.4 ms each, against about 1.3 ms each for the copy the script
already uses.

**Vite is not the problem.** 38 s for 4,031 modules, and it takes less than 1 s to bring the finished folder up to date.

## What other sources say

- **The in-memory patch of wrangler has to stay.** The newest wrangler, 4.156.2, was downloaded and read: it still writes the
  per-file log line and still fingerprints one file at a time. All three pieces of text the patch looks for are still there
  word for word, so it should keep working after an upgrade (read, not run). The [wrangler changelog](https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/CHANGELOG.md),
  in the part I read, has nothing on this. It does list retry improvements for uploads in 4.149.0 and 4.156.1, which are a reason to upgrade on their own.
- **Cloudflare's own method** ([direct upload](https://developers.cloudflare.com/workers/static-assets/direct-upload/)) sends a list of fingerprints and
  then only the files it does not already hold. It offers no way to skip fingerprinting, so keeping our own record is the right approach.
- **Limits** ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)): 100,000 files per version and 25 MiB per file on the paid plan.
- **Vite 8** uses a new bundler, Rolldown. [Reports](https://www.infoq.com/news/2026/05/vite-v8-rust/) claim builds 10-30 times faster, mostly from sources repeating the Vite team's numbers.
  It could save about 30 s here, but it changes the code visitors receive, so it needs its own careful release.
- **A warning:** [wrangler issue 16658](https://github.com/cloudflare/workers-sdk/issues/16658), filed on the day of this research, reports deploys that
  succeeded but kept serving old files for hours, with wrangler 4.151.0 and 4.156.2. It cleared by itself and its cause is not confirmed. So keep the live checks after each release.
- **Antivirus exclusions:** I found no measurement for Bitdefender. [One report on Microsoft Defender](https://dev.to/florinvica/9-things-that-silently-kill-your-net-build-time-and-how-to-fix-each-one-3kb4) claims 30-60% on builds.

## Ideas, with seconds saved, risk and effort

"Risk" means risk to what visitors get.

| Idea | Saves | Risk | Effort | Decision |
|---|---:|---|---|---|
| Stop copying the text and cross-reference files; pack straight from the source, reading ahead on threads | about 55 s of copy, about 100 s of packing | None seen: output was byte-identical | Small | **Done** |
| Read the stamp's files several at a time, in the same order | 36 s | None: same stamp | Small | **Done** |
| Faster verse-wording check | about 28 s | None to the site; it is only a check | Small | **Done** |
| Work out wrangler's fingerprints ahead on threads | up to about 100 s | Very low: all 43,098 matched | Small | **Done** |
| Build the package on C: instead of D: | not measured end to end; packing went from 48 s to 5 s | None to visitors, but C: is 94% full (114 GB free) and each package is about 8 GB. Moving old packages to the archive would stop working across drives | Medium | **Recommended next** |
| One command for the whole full release | about 7 min of the 18, the stops between stages, and it removes the two hand steps | Low, if the checks are kept | Medium | Recommended after that |
| Refresh search copies only for changed pages, separately from the release | up to 14 min | Medium: copies could fall behind. More than four browser pages at once could lose text, as nine hymn pages already did | Medium | Recommended, owner's choice |
| Reuse the previous package and link unchanged files | most of the copy and packing | Real: a linked file changed in one package changes in both, and a mistake could serve old files | Large | Not now |
| Carry the fingerprint memory across packages | little once fingerprints are worked out ahead | Real: it relies on dates and sizes being copied exactly | Small | Not needed |
| Antivirus exclusion for the release folder | unknown | Security choice, the owner's | Small | Try only if the C: move is not enough |
| Vite 8 | about 30 s | Medium: changes the delivered code | Medium | Later |

## Before and after

Rehearsed on a throwaway copy of the code, using the same finished build and the same data as the live site.

| Stage | Before | After | How known |
|---|---:|---:|---|
| Whole package preparation | 381 s | **193-228 s**, two full runs | Full run |
| of which reader packs | 223 s | 77-90 s | Full run |
| of which data copy | 79 s | 27-47 s, four runs | Full run |
| Wrangler's fingerprinting | 112 s | about 11 s | The rehearsal upload took 20 s the first time and 9 s the second. Wrangler reported "43098 unchanged, 0 read" |
| Verse-wording check | 45-49 s | 17 s | Measured alone |
| **Machine time for a full release** | **about 11-12 min** | **about 6-7 min** (not counting the search-copy refresh) | Sum of the above; a real full release has not been run |

**Proof it publishes the same thing:** in both full runs the rehearsal package was compared with the live package file by file. All **43,100 files are
byte-identical**, with the same settings file and the same list of Worker files. The rehearsal upload (`--dry-run`) did use the
fingerprints worked out ahead, and on the live package all 43,098 matched wrangler's own values. No real upload was made, so the sending step itself was not exercised.

## What was changed

Only the scripts that prepare a release and the check that runs before a build. What gets published stays the same.

- [pack-reader-data.mjs](../scripts/pack-reader-data.mjs) and [prepare-testimonies-release.ts](../scripts/prepare-testimonies-release.ts): the Bible text and cross-reference files are no longer copied and then deleted. They are read where they are, and only the grouped files are written.
- [read-ahead.mjs](../scripts/read-ahead.mjs), new: reads those files on 16 threads first, because first reads are 5-8 times faster that way. The writing stays on one thread.
- [prefill-asset-hashes.mjs](../scripts/prefill-asset-hashes.mjs), new, called by [deploy-worker.mjs](../scripts/deploy-worker.mjs): works out wrangler's fingerprints ahead on 16 threads. This also runs for quick releases.
- [check-verse-wording.py](../scripts/check-verse-wording.py): the verse-wording check, now with a shortcut and 12 processes.
- [pack-reader-data.test.ts](../src/lib/pack-reader-data.test.ts): updated for the new way of packing.

Safety added after review:
- If the data's catalogue changes during a prepare, packing stops rather than mixing old and new.
- Fingerprints are only worked out ahead for wrangler 4.147.0, the version they were checked against. With any other version wrangler reads the files itself, so **upgrading wrangler loses this saving until the copied sum is checked again**.
- If working them out ahead fails, the upload still goes ahead, more slowly.

## Recommended next

**Build the package on the internal C: drive.** The disk is the largest remaining cost. Packing the text fell from 48 s to 5 s on C:, and the copies should gain in the same way, though that has not been run end to end. It needs nothing from Cloudflare and cannot change what visitors get. It does need about 8 GB free on C: for each package, and C: has 114 GB free and is 94% full. Moving old packages to the archive on D: would have to become a real copy, because a rename cannot cross drives.

## What is not finished or not proven

- No real full release has run with these changes, so the "after" total is added up from measured parts. The next full release's stage timings will confirm it.
- The real upload was not run, as instructed. Only the rehearsal was.
- The final small reordering of one safety check was covered by the tests, not by a third full run.
- The pre-build time was measured step by step, and about 30 s of the old 86 s was not explained by the steps I could time. One step, the profile shelves, could not run in the scratch copy because a folder git does not hold was missing.
- Bitdefender's share of the disk cost is unknown. Population hosting (29 s) and the build copy (26 s) were timed but not improved. The search-copy refresh was read and taken from the last release's timing, not re-measured.
- Removing wrangler's second per-file log, for uploaded files, might save up to about 8 s of sending. This is an estimate, so it was left alone.
