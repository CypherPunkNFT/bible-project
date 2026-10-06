# Sources, corpus dashboard and acquisition bibliography

The public reference desk at `/sources` (also `/versions`) connects the reading website to the collection behind it. It preserves the Scripture edition table, study and atlas credits, research reports and source registry, and adds a measured corpus dashboard and an expandable collection → author → work → acquisition-source browser. Its warm surfaces, Literata headings and gold accents follow the Bible website; the same bibliography powers the JarvisWiki collection dashboard.

## What is represented

The 6 October 2026 export has **16,469 reconciled library records**, plus **29 published study citations** on the website: **16,498 reference records**. It verifies **15,479 acquired files** against the local source tree. The separate measured library inventory contains **30,904 files / 5.30 GB**, including metadata and provenance. These counts measure different things; they are not unique-book totals.

| Collection | Scope |
| --- | --- |
| Sermons & exposition | Published sermons, pulpit volumes, biblical series and acquired ministry transcripts |
| Understanding Scripture | Commentaries, interpretation, biblical theology and language helps |
| Theology & doctrine | Systematic theology and studies of particular doctrines |
| Apologetics & other beliefs | Arguments, debates and comparative documentary sources |
| Christian life & devotion | Prayer, holiness, assurance, suffering and pastoral care |
| Church & ministry | Preaching, pastoral work, missions and church life |
| History & biography | Church history, historical lives, correspondence and witnesses |
| Confessions & standards | Confessions, catechisms, creeds and related documents |
| Awaiting collection assignment | Acquired material without a reconciled collection placement |

Actual labels and boundaries come from `vocabulary.json`. Some records belong to several collections. A record can represent a book, edition, sermon, chapter or witness. Source formats and edition labels stay attached to their links. The 37 Scripture editions remain separately browsable below the directory, including coverage and licences; they are not inferred from sermon or library totals.

The foundations also identify eBible, OpenBible cross-references and geocoding, STEP Bible proper names, Robertson's Gospel harmony, Torrey, Nave, Easton, OpenStreetMap/Protomaps and NASA/Natural Earth preview data. The research section links the collection reports, acquisition audits and extraction decisions. The source registry identifies libraries, archives and ministries; acquisition rows can additionally name hosts absent from that registry.

## Evidence and inclusion rules

`JarvisWiki/wiki/_build/bible_bibliography.py` reads:

- `content/library/catalog/works`, `editions` and `assets`, with `authors.json` and `sources.json`.
- JSON manifests, results and inventories under `content/library/reports`.
- `BibleProject/sources/library/*/*/provenance.json`.

Work, edition and asset IDs and exact source URLs join records. Matching titles alone never merge works. A link is labelled **Acquired from** only when its reported file exists under the Bible Project source root. A missing file, catalogued destination or finding-aid link does not establish acquisition. Metadata-only/evidence-only files do not become anonymous books. The public projection contains bibliographic fields and web links, not source bodies, absolute paths, arbitrary report content or private permission notes.

Explicit report categories and bibliographic identities take precedence. Supplemental authors come from recorded identity, source inventories or explicit acquisition author-group IDs. Unresolved identities are labelled rather than guessed. At this checkpoint, **701 acquired records have incomplete title or author attribution**, and **7,295 records await collection assignment**. Collectively authored documents may legitimately lack an individual author. The bibliography is a reconciliation of available evidence, not a claim that every miscellaneous physical file has complete bibliographic identity. The physical inventory includes support files not represented as works.

Acquisition is not publication permission, theological endorsement, completeness of a work, successful text extraction or embedding. Preserve edition, partial-text and permission decisions in the underlying acquisition reports. Published study citations retain their own editorial roles.

## Measurements and interaction

Library size, file formats and source-folder bars come from `bible-corpus-snapshot.json`. Source bars show share of stored bytes, not download completion. Search document/passage/verse counts come from the dated knowledge coverage report. Embedding progress comes from a separately timestamped checkpoint and is explicitly not live. Later acquisitions can require another import and verification.

Each collection supports author/title/source search and acquired-versus-catalogue filtering. Authors and works render progressively, with Show more controls. The separate flat bibliography searches all records and preserves pagination and collection filters. Large exports load once; expanding an author renders only that author's current work page.

## Refresh

From `Jarvis/Projects/JarvisWiki`:

```powershell
python -X utf8 wiki/_build/bible_bibliography.py
python -X utf8 wiki/_build/bible_collection.py --refresh
python -X utf8 -m unittest discover -s wiki/_build -p test_bible_bibliography.py
python -X utf8 wiki/_build/linkcheck.py
```

From `Jarvis/Projects/BibleProject/Website`:

```powershell
python -X utf8 scripts/sync-corpus-dashboard.py
node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit
node node_modules/typescript/bin/tsc -p tsconfig.node.json --noEmit
node node_modules/vite/bin/vite.js build
```

The sync stores reviewed metadata in `content/library/corpus-dashboard.json`; ordinary website builds do not need the corpus drive or Python. `scripts/source-directory.ts` produces `public/content/sources/directory.json`, combining that snapshot with published study citations and the existing registry. Refresh explicitly after acquisitions; no recurring snapshot job was added. These commands do not control acquisition or embedding workers.

Before release, check distinct IDs, source URLs, category membership, source-byte totals, exported-field privacy, search/filters, author expansion, mobile layout and both themes. Adapter regression tests cover verified files versus missing/outside files, same-title identities, inherited asset metadata and public field projection. Publication of the website and wiki are separate release steps.
