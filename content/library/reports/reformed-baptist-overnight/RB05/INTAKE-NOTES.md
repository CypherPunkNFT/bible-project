# RB05: later intake requirements

No database, embedding or enrichment job was launched here. Follow the owner-directed **post-RB14 aggregate gate** in project HANDOFF, including finished current intake, valid final reports/manifests, five quiet minutes and no active collectors.

Eight source-first originals were acquired. Seven mixed journal parents have explicit `evidenceOnly: true`, which the current generic importer recognizes as metadata-only. [48 exact private slices](selected-components.json) are prepared for useful church-study lessons/articles; they are **advisory**, not yet wired into the importer. The recovered Dagg introduction is a historical component, not another whole book.

[Five additional Fuller components](fuller-components.json) reuse the already acquired RB04 collection: the complete church-polity band, ordination band, communion band and two worship/singing essays. These are newly prepared reading locations, **not new downloads**. The source's running headings sometimes appear before the previous article ends; boundaries were checked against actual body endings. Keep the RB04 anthology hold until contributor-aware integration. Fuller argues for strict communion and questions instrumental music; these remain his attributed positions.

Before releasing any journal parent:

1. Integrate component identities, source original/derivative hashes, exact line/page boundaries and contributor-specific decisions. Preserve the full immutable parent privately, its original copyright notices and source credits.
2. Enforce author argument, Scripture, historical/opposing quotations and publisher/editor matter separately. Exclude reviews, advertisements/news and incidental reviewed Catholic/progressive books. A publisher's doctrine or article citation cannot approve a quoted voice.
3. Resolve the [contributor queue](theological-evidence.json) and work-specific rights. Older 9Marks issues give conditional reproduction permission; this does not license all 9Marks books. Founders offers these particular PDFs for download, without a blanket external full-text or AI-indexing license. Do not relax public-hosting flags.
4. Deduplicate repeated articles against other missions and prior ledgers at work/content level. Seven issue witnesses and 48 selected units do not mean 48 new books. Chapter/navigation units also include front matter.
5. Keep the distinct Baptist/Presbyterian, communion, worship and female-deacon positions in [THEOLOGICAL-DISTINCTIONS.md](THEOLOGICAL-DISTINCTIONS.md). The system should show source-specific comparison, not synthesize a new church constitution.

Before importing Dagg:

- Reconcile `asset-rb01-9d92196f59fd67117d4a` against [identity-corrections.json](identity-corrections.json). It is **Stan Reeves**, not Dagg. RB01 target/manifest/bibliography/intake metadata and private provenance have been corrected without changing original bytes. Remove/relabel any earlier DB/FTS attribution in the later intake; no DB correction was made here.
- Combine thirteen correctly identified RB01 Church Order components with `asset-rb05-20bf4bdf56c07737c44b`, the recovered *Obedience to Christ*. The SermonIndex page also contains a duplicate preface/TOC; the selected derivative excludes them and the reformatter footer. This is a complete offered component set across two hosts, not a critically collated 1858 edition.
- The held Appendix `asset-rb01-b0316e24a0234138ae8c` now remains evidence-only because Dagg's preface credits **G. W. Samson** with the chief article. Preserve Dagg framing, Samson contribution and quoted geography separately. Do not infer a global Samson approval.

The current planner is read-only and can verify hints/selected derivatives without opening or rebuilding SQLite. Final [verification.json](verification.json) records that parity. Until the later import and vector checks finish, these originals remain **acquired, not ingested or embedded**.
