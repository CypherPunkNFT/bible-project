# LC01: every work the Letters study cites, held as readable text

**Date:** 2026-10-07 · **Mission:** LC01 (Letters-cited works) · **Owner's request:** "even the 79 books into the library, as long
as it doesn't involve printed scans."

## Result

All **78 works** the Letters study cites are held as readable text (the 79 on the Sources page became 78 once the
Muratorian fragment's three entries were merged). **41 were downloaded** in this mission (45 text files, 70.5 MB, about
11.6 million words); **37 were already held** and were reused, not downloaded again. None was left without readable text.

| Source | Files | Notes |
|---|---:|---|
| CCEL plain text | 12 | Ante-Nicene Fathers vols. 2, 3, 4, 5, 7; Nicene and Post-Nicene Fathers II vols. 1, 3, 4, 14; Schaff; Ramsay; Westcott on Hebrews |
| Project Gutenberg | 4 | Plummer (James and Jude), Scrivener vol. II, Lightfoot (Colossians and Philemon), Charles (Enoch, 1917) |
| archive.org full-text files | 19 | archive.org's own ready-made text of a printed copy: **machine-read and not proofread** (printed line breaks, garbled Greek). No page images or PDFs were downloaded and no OCR was run |
| Single pages | 5 | Wikisource (Bartlet in the 1911 Britannica; Polycarp, 1867), Early Christian Writings (Polycarp, Lightfoot), Hanover College (Trent, Session VI), LacusCurtius (Suetonius, Rolfe 1914) |
| bible.helloao.org | 5 | Gill on 1 John, chapters 1–5 (the same site RB03 used) |

Already held and reused: Calvin's three cited commentary volumes; Ante-Nicene Fathers vol. 1 (covers 1 Clement, Ignatius,
Polycarp, Irenaeus); Josephus; Easton's and Smith's dictionaries; the 23 cited 1915 ISBE articles, copied from the CrossWire
edition into one file each.

## Where an edition differs from the one cited

Lightfoot's *Galatians* is a 1910 printing (page cites 1865); Davidson an 1900 printing (1882); Bigg the 1901 first edition
(page also gives 1902); Conybeare and Howson an 1892 printing (1891); Ramsay CCEL's tenth edition (1895); Plummer's *James and
Jude* Gutenberg's sixth printing; Charles's *Enoch* both the cited 1912 edition (archive.org) and the cleaner 1917 text
(Gutenberg). Scrivener: volume II only, the volume the page links.

## Checks

83 file checks pass: every file matches its recorded SHA-256 fingerprint, and key phrases confirm each file holds the right
work (five phrase misses from spelling or bad machine reading on title pages were confirmed by hand). The library validator
passes. Requests were one at a time (11 s apart for CCEL, as its rules ask; 3–6 s elsewhere); no failures, no rate limits.

## Files

- [WORKS.md](WORKS.md): every work with its exact local text path. [works.json](works.json) is the same in data form.
- [acquisition-manifest.json](acquisition-manifest.json): every URL, fingerprint and edition note.
- [verification.json](verification.json), [checkpoint.json](checkpoint.json).
- Text bodies (private, not in git): `sources/library/<source>/asset-lc01-<id>/original.<ext>`; extracted text in
  `Website/.local/library/run-lc01-2026-10-07/text/` and dictionary/encyclopedia extracts in `…/extracts/`.

## How the knowledge base picks them up

No database, embedding or intake worker was started. The next run of `knowledge/finish-intake.ps1` indexes the 45 new files
as private local text (check `KnowledgeBase/embedding-progress.json` first). A read-only dry run of the library planner
(`knowledge/library.py`) found all 45 matched to the manifest. ISBE, Easton, Smith and Josephus were already indexed by
`knowledge/reference_library.py`; the per-article copies are for convenience and are not imported twice.

## Next

These texts are for checking every direct quotation on the Letters pages against the real words (owner, 2026-10-07).

## Addendum (2026-10-07)

The quotation check found three quotations taken from J. B. Lightfoot's 1891 translations (*The Apostolic Fathers*, ed.
J. R. Harmer), which the Sources page had merged into the Ante-Nicene Fathers entries. Both are now held as readable text
from the Early Christian Writings pages the citations link (the same site and method as Lightfoot's Polycarp above):

| Work | Page | Local text |
|---|---|---|
| The First Epistle of Clement to the Corinthians (whole letter, chs. 1–65) | `1clement-lightfoot.html` | `asset-lc01-0dfcd55ad358921a3184.txt` |
| Ignatius, To the Ephesians (whole letter) | `ignatius-ephesians-lightfoot.html` | `asset-lc01-de4e710212a667def358.txt` |
| Ignatius, To the Smyrnaeans (whole letter) | `ignatius-smyrnaeans-lightfoot.html` | `asset-lc01-2449cec02a8da9fff131.txt` |

Originals under `sources/library/source-early-christian-writings/<asset>/original.html`; text under
`Website/.local/library/run-lc01-2026-10-07/text/`. Three files, 202,699 bytes, 20,107 words; requests one at a time,
6 s apart. All three pass the fingerprint check, and key phrases confirm the quoted words are there: "take up the epistle of
the blessed Paul" and "the farthest bounds of the West" (Clement), "Where is the wise? Where is the disputer?" (Ephesians),
"suffered in semblance" (Smyrnaeans). **Totals now:** 80 works with readable text, 43 downloaded in LC01 as 48 files, 86
file checks, no failures. Recorded in [WORKS.md](WORKS.md) (rows 79–80), [works.json](works.json),
[acquisition-manifest.json](acquisition-manifest.json), [verification.json](verification.json) and
[checkpoint.json](checkpoint.json).
