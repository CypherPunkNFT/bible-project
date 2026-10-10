Run from `Website/` with Python 3.13. Catalogue caches and unchanged originals are private under `../sources/`; SWORD text exports are under `.local/library/sword/`.

```
python knowledge/bulk_collect.py catalogue --source tcp
python knowledge/bulk_collect.py collect --source tcp --filter filter.json --limit 20
```

Sources: `tcp` (EEBO, ECCO, Evans), `sword`, `ccel`, `ia`, `gutenberg`. `--limit 0` collects all matches; other limits count successful new originals. JSON filters take `authors`, `subjects`, `ids`, `languages`, `collections`, and `excludeAuthors` lists. Fields combine with AND; values within a field combine with OR. IDs match exactly; other fields use case-insensitive substring matching. Screen the author/ID lists before use. Mixed catalogues require author or ID selection; `approvedCollection: true` is reserved for a previously screened collection. Mission 0 filters are under `content/library/reports/reformed-baptist-overnight/RB00/filters/`.

Robots rules, crawl delays (minimum two seconds), retry backoff, local source IDs and SHA256 duplicates are enforced. Gutenberg uses the offline CSV and static mirror only. IA uses the official cursor search API, the `Princeton` collection, historical editions through 1930, and existing downloadable `_djvu.txt`. TCP checks the CC0 release statement in offered XML; old catalogue restriction flags are preserved as historical metadata. CCEL catalogue wrappers and non-XML/login responses are rejected. Credits, contributors, source metadata and licences remain in the manifest. Nothing publishes files.

SWORD uses official CrossWire `mod2imp.exe` and companion DLLs under `../sources/bulk-catalogues/sword-tools/` (installed in Mission 0). Newer unencrypted zCom4 ZIP modules use direct compressed-block decoding with index-bound, zlib-checksum and byte-length verification because the offered Windows utility predates that driver. New acquisitions export automatically; `python knowledge/bulk_collect.py export --source sword` exports existing campaign packages. Originals remain unchanged; text derivatives carry tool and text hashes.

The manifest is appended atomically under a Windows file lock. Select the report destination with `--mission RB01` for later missions; originals are reusable across missions. Check `../KnowledgeBase/embedding-progress.json` and the existing intake pipeline before running `powershell -ExecutionPolicy Bypass -File knowledge/finish-intake.ps1`. Do not launch a second embedding worker.

For this campaign, set `deferHardDownloads: true` in each filter: one network attempt, a 20-second socket timeout, and failed IDs/URLs/errors saved to `<source>-failed-downloads.json`. Difficult requests go to the mission download TODO instead of automatic retries. `skipIds` can exclude previously failed source IDs from later runs. Robots delays and server `Retry-After` cooldowns still apply.

`monergism` uses the locally cached complete free-ebook author index and offered official EPUB/PDF links. The official whole-library ZIP page was checked first in RB04 but exposed no downloadable ZIP link. Edition credits and the source permissions policy are preserved; originals stay in the private local library.

The mission runner accepts `finalizeOnly: true` to report already completed background source batches and invoke the existing intake without downloading any file again.

`chapel`, `founders`, and `desiringgod` collect complete official ministry editions. Chapel uses its full public sitemap and individual edition metadata; RB13 also caches the complete public 2026 PDF catalogue and linked language editions. Founders retains whole-book REST JSON with an existing-text derivative, counting books rather than chapters. Desiring God follows only explicitly offered complete PDF/EPUB links. Samples, worksheets, administrative wrappers, and retail-only books are excluded. `cataloguePath` can point to a screened local catalogue within the catalogue cache.

`audienceProfile: "rb13"` records the five requested audience tags and source-stated editor/adaptation metadata; missing details remain null. `rb13_finish.py` generates the audience counts directly from manifest `audiences` fields after all source workers finish. No failed request is retried.

Chapel Library sitemap collector: `--source chapel` reads the publisher sitemap, prefers the offered EPUB (otherwise PDF), obtains public book metadata, and retains language, author, publisher and source notices. Use `approvedCollection: true` with `deferHardDownloads: true`; audio and administrative forms are excluded. No authenticated catalogue access is used.
