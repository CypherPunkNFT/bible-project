# Proposed edits to the sermons campaign brief (job 92d9c985, 2026-11-26)

Target file: `Website/content/library/reports/sermons-campaign/CAMPAIGN-BRIEF.md`. This job was read-only, so it could not
edit the brief itself. Apply each replacement exactly as written. The owner's quoted words (the two `>` blocks) and every other
line stay as they are. Evidence for each edit: [sermons-campaign-REPORT.92d9c9859d2244f8b9be85419e741f73.md](sermons-campaign-REPORT.92d9c9859d2244f8b9be85419e741f73.md).

## 1. Line 3, the state line

Replace:

```
**Class:** LIVING · **Opened:** 2026-10-08 by the owner · **State last verified:** 2026-10-08 (steps 1–2 done for Begg, Piper, Spurgeon; Wesley and Moody catalogued; Graham acquiring; not yet released) · Owner of this work: the chat started from the prompt at the end.
```

with:

```
**Class:** LIVING · **Opened:** 2026-10-08 by the owner · **State last verified:** 2026-11-26 (steps 1–2 done for Begg, Piper, Spurgeon; Wesley and Moody catalogued; Maclaren 1,311 and Morgan 97 sermons finished acquiring on 2026-10-09 but not catalogued; Criswell stopped at 2,517 of 4,093 and Graham at 56 files, neither catalogued; nothing is acquiring now; reconciliation: [reconciliation-20261126/REPORT.md](reconciliation-20261126/REPORT.md)) · Owner of this work: the chat started from the prompt at the end.
```

## 2. After line 46, a note under the "Why the Teachers page looks thin" table

Insert after `(Counts from \`src/data/teachers/people.json\` as built on 2026-10-08 in the shared Website folder.)`:

```
**Now (2026-11-26):** with a main Bible text, Begg 1,417, Piper 1,618, Spurgeon 3,544, Wesley 140, Moody 27; the page lists 52 people, not 47. The table above is the state before the campaign.
```

## 3. Line 59, the untracked-records trap

Replace the sentence opening `**About 34,000 catalogue records are not in git.**` and running to the end of that bullet with:

```
- **The catalogue records are now in git (checked 2026-11-26).** All 18,702 work records under `content/library/catalog/works` are tracked, and nothing under `catalog/` is untracked. The October warning (about 34,000 untracked "reconciled" records, Begg's and Piper's among them) no longer applies; still never delete or "clean" them.
```

## 4. Line 61, source terms

Replace `Truth For Life \`unreviewed\`;` with:

```
Truth For Life reviewed 2026-11-26 (its policies page lets anyone copy and distribute Alistair's sermons unaltered, free of charge and credited, and post its written content elsewhere with a link and credit; robots.txt blocks only filtered listings) — `sources.json` still says `unreviewed` and needs updating;
```

## 5. Line 98, the Graham row of the step 3 table

Replace:

```
| Billy Graham | in progress | | billygraham.org |
```

with:

```
| Billy Graham | stopped: 56 files held (49 pages, 7 PDFs), scan about 1,600 of 3,056; 0 catalogued | | billygraham.org (personal use only) |
| Alexander Maclaren | 1,311 held (14 volumes), **not catalogued** | 1,306 | CCEL, public domain |
| G. Campbell Morgan | 97 held (19 volumes), **not catalogued** | 67 | Internet Archive |
| W. A. Criswell | 2,517 of 4,093 held, **not catalogued**; not in the registry | (sermon pages carry a Scripture field in their header; not yet read for the 2,517) | wacriswell.com, no licence: owner's decision |
```

## Lines checked and left alone

The owner's quotations, the scope, the data-flow section, the step 1 and step 2 results (historical and still accurate as
history), "The work, in order", "Done looks like" and the copy-paste prompt.
