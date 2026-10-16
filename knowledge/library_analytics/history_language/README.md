# KR-140 private history and language processing

Ownership: this package and `KnowledgeBase/library-knowledge/connected-research/history-language/` only. User authorization of 14 October 2026 supersedes the older context's stop-after-KR-120 instruction. Shared TODO/HANDOFF/context, processors, schemas and refresh utilities remain owned by other chats. Coordinator reconciliation goes in the private task handoff after execution.

Pinned parents: `kr101-31239794030518bcb2299a31` and `kr102-1b03f58bf6e6749f9170bf38`. The input freeze resolves their summaries/manifests once and checks those immutable identities thereafter. Research records come from a consistent registry read transaction; selected rows and original records are frozen privately. Titles never substitute for identities. No encoder/vector access or public output.

Run from Website using `C:\Windows\System32\cmd.exe`, login disabled, and `..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m` followed by:

```
knowledge.library_analytics.history_language.processor --prepare
knowledge.library_analytics.history_language.processor --calibrate
knowledge.library_analytics.history_language.processor --run
knowledge.library_analytics.history_language.processor --run --resume
knowledge.library_analytics.history_language.processor --status
knowledge.library_analytics.history_language.processor --query Merneptah --kind history
knowledge.library_analytics.history_language.processor --query father --kind language
knowledge.library_analytics.history_language.release --witnesses
knowledge.library_analytics.history_language.release
knowledge.library_analytics.history_language.release --verify
```

Prepare, calibration, population and export acquire the existing global JobStore lease. A live or inaccessible owner blocks population work. There is no scheduler or forced takeover. A `--limit N` checkpoint or private `cancel.request` stops after an atomic group; resume preserves committed jobs. Source/code/frozen-input changes reject same-generation resume. Explicit `--new-generation` permits a new implementation generation, retaining old facts. It does not adopt new acquisitions or mutate the frozen source selection. Whole-system refresh integration remains later work.

Adapters:

* All existing research citations: held literal source witnesses, explicit existing claim/source links, full-title mention candidates, separate recorded date roles and unassigned chronology mentions. Full citation records retain limits, competing interpretations, source versus edition distinction, permissions and review provenance. Institutional summaries remain institutional summaries.
* Every pinned supported entry in HebrewStrong.xml and LexicalIndex.xml: source-authored original-language headword and English definition/usage spans, explicit cross-reference numbering systems and null translator where unknown. Editorial glosses are lexical aids.
* Every registered Assyrian archive corpusjson file: original-language token and source-authored English guideword/sense via JSON pointers and native token references. Proper-name annotations preserve native IDs, restorations and alternatives without invented canonical people/place IDs.
* Every registered repaired ORACC HTML edition: explicit labeled English ATF groups aligned to uniquely identified native source-line ranges. Many source lines may align to one English block. Ambiguous/missing/reversed labels are deferred. ATF notes, lacunae, restorations, markup and literal edition credit statements remain visible.

## Curated Scripture identities (`scripture-entities`, added 15 October 2026)

The entity dictionary used for located historical mentions now covers Scripture's own named identities, not only the registry's scholars, archaeology and evidence namespaces. `scripture-entities` is **registered in the selection's namespace list** and supplied by a curated supplement built from files already in this repository — the 21 researched group files in [people-pages/](../../../src/data/people-pages/), the atlas pins they reference in [places.json](../../../data/places.json), and the tribe records in [tribes.json](../../../design/tribes-directions/data/tribes.json). Nothing is fetched from the network and the shared registry is never written to.

578 rows: 196 researched people (rulers, prophets, apostles and the early church, from 199 role records), 368 places (352 atlas pins plus 16 curated names the research gives no pin) and the 14 tribes. Each row carries its research group files, their `Research/People` dossiers and its file-scoped citation ids. `inputs/scripture-entities.json` and `inputs/supplement.json` are frozen independently of `inputs/selection.json`, with the same staleness discipline, so the already-frozen base selection and criteria stay byte-identical and the earlier generation remains verifiable.

Identity discipline is unchanged and extended: no person equality is asserted, every candidate id is retained, and a title occurrence does not prove referent identity. A figure the research covers twice (Moses, Deborah and Samuel are each both ruler and prophet) is one identity with two role records. Variant names and a figure's other person records are recorded as candidates and are never match keys. Places are one row per atlas pin titled by the atlas name — the research's own annotated labels ("Jerusalem, the Temple") are attestations, not titles — and a curated reference that omits its pin is folded into the pinned row of the same name rather than becoming a second identity. Mentions remain `candidate-ambiguous`; same-titled identities (four researched Zechariahs, three Ben-hadads, two Samarias) are all retained, unresolved.

Mention keys for this namespace need four characters rather than six, recorded with its measurement in `SUPPLEMENT_CRITERIA`: at six the dictionary cannot reach David, Egypt, Edom, Ekron, Gaza, Tyre, Ahaz, Peter or the tribe Judah, which is most of the epigraphic evidence it exists to connect; below four it would reach Pharaoh "So", which matches the English word. Every other namespace keeps six. **The quality gates say nothing about this dictionary:** `inputs/quality-cases.json` was frozen before it existed and is not rewritten, and located precision and recall score only `explicit-citation-claim` links, so a passing run is not evidence that these identities are correct.

```
knowledge.library_analytics.history_language.pending_generation
knowledge.library_analytics.history_language.pending_generation --status
knowledge.library_analytics.history_language.workflow --new-generation --wait-seconds 3600
```

`pending_generation` takes no lease: it freezes the supplement, records the run id the next population will use, and copies the current generation's pointers into `generations/<run>/` so starting a new one cannot lose them. `workflow` waits for the existing global owner to finish — it never forces the lease and never opens the shared store for writing while an owner is live — then runs prepare, calibration and population for the new generation.

`inputs/quality-cases.json` freezes independent source-annotation oracles before development calibration. Reserved cases are excluded from calibration decisions. Population evaluation measures correct located source annotations against frozen literal/ordinal baselines. It does not establish semantic translation accuracy, historical authenticity, influence, canonical entity resolution or theological endorsement. Those require specialist review. Existing KR/LK question splits are untouched.

SQLite tables include source witnesses, historical links, date roles, language alignments, native source annotations, pinned section/alignment bindings, reverse dependencies, source dispositions and atomic job checkpoints. `queries.sql` gives generation-bound SQL. Containing-book routes keep their inherited navigation state; no page selectors or source/edition equivalence are invented. Historical resources absent from KR-101 are explicitly unbound.

Exports use deterministic gzip JSONL, schema, frozen inputs, code and quality receipts in immutable `releases/<run>/`. Repeated export verifies and returns unchanged. No global latest pointer is promoted. This is local persistence, not a backup/restore claim. Originals, credits, Catholic cautions and work/edition distinctions remain in the source records; Josephus public use remains restricted to Scholars. KR-150 and public integration are outside this workstream.

Focused tests: `..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 -m unittest knowledge.library_analytics.history_language.test_history_language -v`.

For indexed routine lookups use `knowledge.library_analytics.history_language.located_queries --entity evidence:BA-001`, `--scope lexicon:HebrewStrong.xml --entry H1:0`, or `--scope resource:eaacf879-12e0-4563-ac2c-fe188d0f1bd6` for the Q003424 translation group. `--examples` saves executed queries and SQLite plans. Generic processor substring queries scan the selected population.
