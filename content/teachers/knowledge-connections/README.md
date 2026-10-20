# Knowledge, handed on — connection research

Research compiled 16 October 2026 for `/teachers/scholars`, nested in Sources in use 01. The owner requested about **50 chains total** across the five fields, as the backend for a later circle-selection and animated-link interface. This pass prepares data only. It does not alter or rebuild the page, start corpus work, or publish anything.

The dataset contains **50 editorial threads: ten per field**, comprising the five current examples plus 45 additions. Every retained thread has **at least five distinct substantive nodes**. There are **183 authors or credited groups, 244 work/edition/documentary records and 216 explicit connections**. These are fifty selectable research threads, not fifty disjoint networks or fifty new discoveries.

The owner subsequently required a five-node minimum and authorized replacing weak candidates. All 44 previously short threads were revised: 33 expanded and 11 replaced with stronger candidates. The active distribution is **43 five-node, four six-node and three seven-node threads; zero below five**. Nodes represent works, editions or documentary records, so one author can contribute more than one distinct work. Branches preserve real parallel contributions instead of inventing a single linear sequence.

## Files

- `research.json`: authored source of truth. Authors, works, connections, chains and sources have stable, dataset-local IDs. The exact five existing examples are also retained in `baselineSnapshot`.
- `index.json`: generated research plus existing profile/population links and conservative library-title candidates. This is the interface data artifact; the separate existing local mock also reads it. This pass does not rebuild or modify that mock.
- `chains.csv`: one row per selectable thread, with field, authors, works, connection count and review state.
- `connections.csv`: one row per connection within its thread, including both authors and works, the contribution, relationship type, evidence URL, locator and caveat.
- `summary.json`: counts, identity coverage and remaining limitations.
- `archive/research-before-five-node-minimum.json`: historical snapshot of the earlier short candidates, excluded from active counts and exports. Replacements record `formerCandidateId` where their identifier changed.

Build or verify from Website:

```text
python scripts/build-knowledge-connections.py
python scripts/build-knowledge-connections.py --check
python -m unittest discover -s scripts/tests -p test_knowledge_connections.py
```

The builder reads the current packaged scholar population and its shelves. It writes only this research directory and rejects chains with fewer than five distinct nodes. It also requires connected graphs, valid endpoints and evidence references, ten chains per field, and no duplicate chain signatures. Research, population-index and profile hashes record the principal inputs; `--check` recomputes the complete export, including current shelf candidates. A population refresh may require rebuilding these exports.

## Relationship contract

Each `connection` connects a source/earlier work to the work that uses, revises, translates, continues, contests or extends it. `relationship` retains the specific action, and `claim` explains what the later contributor did. `relationshipFamily` supports later grouping. A criticism is evidence of engagement, not agreement. `assertsDirectTextualDependence` is deliberately narrow; false does not mean the authors were unrelated.

`chains.workIds` is a display membership/order, **not an implicit list of causal arrows**. Draw only the explicit `edgeIds`. Nestle compares three editions in parallel; Rice draws on several reference works; the Descartes objections form branches. The baseline ontological-argument thread includes thematic reformulations, and Jericho includes new independent evidence. Neither should become an invented teacher-student lineage.

A work node can represent an edition, paper family, report series or excavation record. `recordKind` makes that distinction explicit. Exact single-book/edition identities remain the preferred refinement before display. Dates are display labels; the research does not claim every edition date has been independently checked.

Corporate translators and joint credits stay distinct from individuals. Dataset-local author IDs do not replace canonical library IDs. A group is not automatically joined to one named member. Faith, recommendation and professional credentials are not inferred from field membership.

## Evidence and remaining review

Each connection has an evidence source and locator. Sources include primary author prefaces and correspondence, published papers, excavation projects, holding institutions, publisher descriptions and edition catalogues. `sources.access` records the consultation scope: opened texts, excerpts, catalogue evidence or inherited citations. Source summaries establish some connections without a full-work collation; this is disclosed in `evidenceScope`.

- **184 supported connections** have relationship-level support at the cited text or source-summary level. This does not certify every bibliographic detail or constitute human editorial approval.
- **4 bibliographic-only connections** establish an edition/revision attribution, with substantive comparison still open.
- **28 carried-forward connections** preserve the five existing examples. Their original citations have not all been rechecked at passage level in this pass.

Existing curated profile identities and the two existing explicit lineage mappings are reused where possible. Exact names elsewhere are retained as candidates rather than silently merged. The current export links 28 author identities and finds library-title candidates for 12 work records. **No exact held edition is claimed as reconciled yet.** Lack of a candidate in the linked packaged shelf does not prove absence from the complete private collection. External interlocutors can appear as sourced context without a held copy.

Before connecting this to the page, review candidate editions and precise citation locators and retain the evidence/identity status in the consumer. Nine focused integrity tests cover the data contract, including rejection of four-node chains and repeated nodes used to meet the minimum. The research table is complete at the requested size; editorial passage review and exact held-edition reconciliation remain separately flagged.

Examples include [Socrates correcting his use of Rufinus](https://ccel.org/ccel/schaff/npnf202/npnf202.ii.v.i.html), [Bliss refining Petrie excavation sequence](https://www.pef.org.uk/about/history/frederick-jones-bliss/), [Bauer lexicography revised by Danker](https://press.uchicago.edu/ucp/books/book/chicago/G/bo3622223.html), and [Luther directly answering Erasmus](https://ccel.org/ccel/luther/bondage.v.html). Every individual connection is listed in the exports with its own source.
