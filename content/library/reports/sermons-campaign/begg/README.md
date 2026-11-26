# Alistair Begg: the whole Truth For Life sermon archive (2026-11-26)

**Outcome:** every Alistair Begg sermon in Truth For Life's own sermon index is now held, catalogued and, where the page
states a text, on its Bible passage. 2,847 Begg sermons in the library (was 1,504); 2,687 on a passage (was 1,439).

## The archive

Truth For Life's sermon index ([sitemap-sermons.xml](raw/terms/sitemap-sermons.xml), read 2026-11-26 09:52 UTC) lists
**3,082 sermon pages**. Every one is now accounted for:

| | Pages |
|---|---:|
| Held before this run | 1,500 |
| Held now, new: distinct Begg sermons | 1,343 |
| Held now, new: second pages of a sermon also held (same sermon number "0562"/"562", or the same audio file) | 8 |
| Already held under an older address (recognised by Truth For Life's sermon number) | 4 |
| By other speakers (68 people: Sinclair Ferguson, Hershael York, Voddie Baucham…), not kept | 184 |
| Begg with others: panels, roundtables, joint interviews, not kept | 25 |
| Begg alone, but a Q&A or interview, not a sermon: listed in [progress/checkpoint.json](progress/checkpoint.json) (`needs-review-not-a-sermon`), not kept | 18 |
| **Total** | **3,082** |

Why so many were missing: the 5 October run kept only pages with a written transcript (1,482). Of the 1,343 new sermons
only 7 have one; the rest are audio/video sermons whose page still carries the publisher's `scripture_ref`. Their
catalogue records say so (asset `mediaKind: other` and a note on work and asset).

## Bible texts

Placed by [sermon-passages.py](../../../../../scripts/sermon-passages.py) from each held page's `scripture_ref`
(overlay [begg.json](../../../passage-overlays/begg.json)); never from a title.

| Begg | Before | After |
|---|---:|---:|
| Sermons (one record per sermon) | 1,504 | 2,847 |
| On a passage | 1,439 | 2,687 |
| Page states no single text ("Selected Scriptures") | 58 | 149 |
| Stated text we cannot place (`unresolved`) | 7 | 11 |

The 4 new unresolved: three publisher misprints naming verses that do not exist (Proverbs 1:22–39, John 11:45–12:57,
Job 40:1–34) and one range across two books (1 Peter 2:9 – 2 Peter 2:11), like the 7 whole-Bible survey sermons already
listed. **Audit:** 60 random new placements against the held page, 0 errors ([AUDIT.md](AUDIT.md)).

## Files

- [TERMS.md](TERMS.md): policy and robots.txt as read before fetching; copies in [raw/terms/](raw/terms/).
- [progress/collect.py](progress/collect.py): the collector (2 s between requests, resumable checkpoint, stops on
  401/403/429/503). Four batches, 1,582 requests, no refusal or error.
- [acquisition-manifest.json](acquisition-manifest.json): one entry per new sermon; `secondPagesOfOneSermon` lists the 8.
- Held pages: `sources/library/source-truth-for-life/asset-sermons-begg-<sermon number>/` (`r<database number>` for two
  pages that show no sermon number), each with provenance.json (url, sha256, retrievedAt, headers).
- Catalogue: `work-`, `edition-`, `asset-sermons-begg-*` written by `python -X utf8 scripts/catalog-campaign-sermons.py begg`.

## Not done / still open

- The 18 Q&A and interview pages by Begg alone are not catalogued: they are not sermons and the genre list has no
  "interview". Say if they should be added under another genre.
- The archive is complete as of the sitemap read on 26 November; Truth For Life adds new sermons weekly. Saving a fresh
  copy of the sitemap over raw/terms/sitemap-sermons.xml and re-running `collect.py`, `--manifest` and the two scripts
  above picks up only what is new.
- The site links to Truth For Life and does not re-host any text or audio.
