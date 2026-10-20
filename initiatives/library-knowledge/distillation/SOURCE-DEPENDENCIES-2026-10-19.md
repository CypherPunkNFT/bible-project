# Twelve-record source and reader dependencies

19 October 2026, America/New_York. Read-only continuation of the bounded task in [TODO](../TODO.md). [Machine-readable inventory](source-dependencies-2026-10-19.json) retains exact document IDs, original/cache hashes, source locations, selected spans/context, work/edition assertions, reader dependencies and explicit holds. The [original proposed scope](rehearsal-scope-2026-10-18.json) and [Hodge inspection](HODGE-READINESS-2026-10-18.md) remain intact. This inventory is not execution of the twelve-query rehearsal or a consistent corpus/vector backup.

The held source dependencies are available for all twelve records. The ten book originals and ten extraction caches match their historical fingerprints; the two lexical records share one matching XML asset. All eight selected KR passage spans and their expanded contexts reconstruct exactly. These checks establish availability and reproducibility for those locations, without certifying complete or accurate books. The current semantic generation, vector/index retention and candidate adapter remain unverified.

## Source and reader findings

| Slot | Selected source | Original / extraction / selected evidence | Reader evidence | Remaining distinction or hold |
| --- | --- | --- | --- | --- |
| D01 | Hodge, 1877 PDF | Original and historical cache match; prior page-level inspection retained | Current local source binding exists; a prepared page cache was not present at inspection | Known scan text/reading-order defects remain; no new whole-book clearance. |
| D02 | Hodge, revised EPUB | Original, cache, span and context match; selected non-whitespace character sequence also occurs in native XHTML | Prior browser proof and existing page files locate the passage on page 32/34 | Electronic notice says October 2018; underlying print exemplar remains unidentified. Containing-work link still requires 31 Next clicks. |
| D03 | Matthew Henry, Supper EPUB | Original and cache intact; selected span/context and native XHTML match | Exact local record returns 404; served fallback is `permission-required`, zero pages. Browser shows the catalogue notice, without text | This is a reader/identity binding hold, not missing extracted text. Work/edition IDs remain null. No substitute copy was chosen. |
| D04 | Boyce, Abstract EPUB | Original and cache intact; selected span/context and native XHTML match | Same observed fallback behavior as D03; browser shows no reading text | Reader binding and exact work/edition identity unresolved. Placeholder OPF date does not identify an edition. |
| D05 | Gill, Doctrinal Divinity EPUB | Original, cache, span/context and native XHTML match | Exact current local binding exists; prepared reading pages were not present at inspection | Recorded catalogue IDs are retained; print date and actual page behavior remain unverified here. |
| D06 | Whitefield, TCP N22608 XML | Original, cache and selected span/context match. Native comparison requires separating two generated labels from author text; see below | Existing local reading-page cache contains the selected span on displayed page 5/8; browser pagination not retested | Source has an illegible word. Preserve its gap; do not present generated labels as Whitefield's words or infer direct use of this edition by Piper. |
| D07 | Piper, Seeing Beauty EPUB | Original, cache, span/context and native XHTML match | Exact local binding exists; prepared reading pages were not present at inspection | Source header names Piper/Crossway and a 2014 copyright notice. Existing private-use/public-export limits remain. Quotation dependence is separate from source independence. |
| D08 | Calvin Genesis EPUB, editorial notes | Original, cache, span/context and native XHTML match | Exact local binding exists; prepared reading pages were not present at inspection | Selected heading is Notes, with Ed. markers. OPF creator Calvin does not attribute every note to him. Named editor remains unresolved. OPF 2026 concerns this electronic packaging, not Calvin's composition. |
| D09 | Calvin Corinthians XML | Original, cache, span/context and native XML character sequence match | Exact local binding exists; prepared reading pages were not present at inspection | Header names John Pringle as translator. Keep translation/editorial roles and CCEL use cautions; a Public Domain header string does not replace the existing use decision. |
| D10 | Fergusson, TCP A41197 XML | Matching original/cache; retained LK quote occurs once in the cache and resolves to a native XML paragraph | Public-record fallback works. Exact served bundle matches its content hash; browser reads the quote on page 25/36 after 24 Next clicks | Earlier concern about the missing local index binding is resolved through the existing fallback. Saved reader page index 24 is displayed page 25. Historical gaps/conflict and containing-work navigation remain. |
| D11 | HebrewStrong.xml, H1:0 | Shared XML hash matches; entry H1, Hebrew language attribute, term and meaning-element hashes match | Exact local KR-140 evidence record; no general reader mapping established | Meaning gloss is not a context-selected verse translation. Protected script control remains included. |
| D12 | HebrewStrong.xml, H2:1 | Same XML asset; entry H2, Aramaic language attribute, term and usage-element hashes match | Exact local KR-140 evidence record; no general reader mapping established | Its English target is a usage element, whereas D11 uses meaning. Keep that source distinction; the two entries are not independent corroboration. |

There are twelve document records and eleven distinct original assets, not twelve independent books. D01/D02 are related Hodge witnesses. D11/D12 share one lexicon asset. Work-family identity and quotation dependence need their own review; document counts do not settle them.

The non-whitespace native comparisons are explicitly diagnostic: they do not validate layout, punctuation normalization, speaker role or complete transcription. Exact cached text and expanded context are separately hashed. Current catalogue work/edition IDs remain recorded assertions with their historical counterparts visible; no IDs were minted or transferred to a new generation.

## Hodge edition identity narrowed, with print identity still open

The held EPUB's final copyright section states an electronic-edition date of October 2018 and names Monergism Books. Its revised/enlarged preface is dated 6 August 1878; its Calibre package timestamp is in January 2025. These are three distinct date roles. None identifies the exact print exemplar. The OPF date `0101-01-01` is unusable for that purpose. Keep the held EPUB's separate catalogue identity and its embedded notices; do not assign it the 1877 Goold-edited scan's identity or rights record.

The source copyright-section locator, offset/hash and native package metadata are retained in the inventory. No catalogue metadata or permissions were changed. Existing private-reading and public-use gates remain separate.

## Whitefield: source markup and generated labels

The saved Whitefield span contains `[Editorial gap: illegible]` and `[Source page 127]`. A plain native-body comparison initially fails because those labels were generated during extraction. The XML supplies an illegible one-word `gap` with its original marker and a `pb` numbered 127. Their exact XPaths and attributes are in the inventory.

A diagnostic comparison removing only those two generated labels matches the remaining non-whitespace sequence in the native source. The raw cache, selected span and original XML were retained unchanged. This supports typed annotations for the gap/page break; it does not recover the unreadable word. Do not quote the generated labels as author prose or silently fill the gap. The gap does not automatically invalidate an unaffected, separately checked quotation elsewhere in the span.

## Planning corrections and execution boundary

The proposed Q08 calls the selected `editor-voice` passage prefatory. The actual selected witness is editorial Notes. The inventory records proposed replacement wording: “Who speaks in the selected editorial notes, and which source marks distinguish them from Calvin's prose?” The old proposed question remains preserved; no query, relevance label or candidate revision was changed. The wider pilot already allows preface or note attribution cases.

For `father-gloss`, preserve separate meaning/usage roles in any future dossier adapter. The original frozen KR-140 evaluation remains unchanged. No specialist lexical/translation judgment is claimed by this source check.

The full pilot remains gated. The source-owner completion receipt still reports protected embedding/index work, the supervisor remains busy in `verification_only` with budget 3/3, and the last parity receipt remains dated with `enrichment_ready:false`. This task did not open the live corpus or vector/index store. Coherent generation selection, retained index/fragment access, exact source-to-passage mapping, matched lexical/current-hybrid scope and the live proposal dependency adapter are not established by these source hashes.

## Henry/Boyce diagnosis and concrete repair proposal

The reader builder currently serves a profile-scoped collection. `scripts/local_library.py` intersects resolved source authors with IDs from the 52-person `src/data/teachers/people.json`, attempts recovery only against that same list, then skips a copy if no profile author remains. Neither Matthew Henry nor James Petigru Boyce has a profile there. The loaded canonical author/alias registry also supplies neither name; their existing public records instead retain source contributor IDs. OPF bylines independently name Henry/Boyce, and both originals/extractions are intact.

This profile gate excludes correctly attributed copies by those authors; rebuilding the unchanged index cannot make them eligible. The current live `library_files` metadata was deliberately not read during protected corpus work, so additional intake/identity issues are not ruled out. This is an established coverage limitation, not proof that every internal metadata field has been audited. No canonical author/profile ID should be invented to make the books pass the gate.

The minimal proposal is a private, explicitly bounded inclusion of only these two exact source hashes, with reader-copy eligibility separated from prominent-profile shelf membership. Extend the existing reader builder and reuse its guarded source/cache paths, original-hash checks, exact `local-<sha>` / `held-<sha-prefix>` identities and normal page preparation. Use the already verified source/header, extraction and existing public-record metadata; preserve source author names, existing contributor IDs, credits and private-use notices. Keep unresolved work/edition IDs null. No new profile or public availability change is required. Do not expand automatically to every unprofiled holding.

Before application, validate the scoped eligibility in a disposable fixture, demonstrate exact selected-span reading for both books, retain loopback guards and unchanged public permission-required records, and check Hodge/Fergusson controls and unchanged curation fingerprints. The existing reader-index owner must apply/publish the change with source-hash and changed-index conflict checks, retaining its last-good configuration/index. Rollback belongs to that owner; never overwrite newer concurrent index work. No source, corpus, vector, curation, scheduler or preview-port changes are part of this proposal. Exact input hashes, affected implementation and validation/rollback requirements are in the manifest.

This completes the bounded read-only diagnosis and makes the repair reviewable. Applying code or index changes remains outside the current read-only instruction.

## Preservation and continuation

Only initiative planning outputs and TODO/HANDOFF were written. Source assets, extraction caches, historical stores/reviews, reader implementation/index, candidate decisions and schedulers were not changed. Reader checks used the original 8931 preview and existing files; no new reading cache was prepared. A timed-out historical descriptor query was replaced with exact run/document index lookups and a strict read budget; no live corpus query or competing writer was started.

The single TODO records the completed dependency inventory/diagnosis and the scoped reader proposal's application gate. Reader availability and semantic readiness remain separate: applying a future reader fix would not authorize the twelve-query rehearsal or establish the full-corpus/index gate.
