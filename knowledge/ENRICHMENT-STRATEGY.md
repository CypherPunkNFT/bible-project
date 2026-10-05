# Knowledge base enrichment strategy

**Class:** LIVING · **Owner direction recorded:** 2026-10-05 · **Status:** Strategy documented; term packs and Python enrichment runner are planned.

Use an LLM to design a reusable library of terms, aliases, search patterns and contextual rules. Validate those artifacts, then run ordinary Python and SQLite FTS5 across the corpus. The intelligence goes into preparing the vocabulary and algorithms; the bulk enrichment run uses deterministic computation and makes no LLM calls.

The aim is to obtain most of the useful initial enrichment with a small share of the time and reasoning expense of reading every chunk with a model. This is an efficiency objective to measure, not a promised 80/20 coverage result. The first outputs should be useful entity/topic matches, explicit citation links and shared-reference networks. More difficult argument and interpretation analysis can use those outputs to select a much smaller body of material for later examination.

This document defines **how to execute enrichment efficiently**. [ANALYSIS.md](ANALYSIS.md) defines **which analytical layers to build** and their evidence requirements. [README.md](README.md) describes the existing local search system. [Project TODO](../../TODO.md) and [HANDOFF](../../HANDOFF.md) track delivery and resumption.

## Author intelligence into reusable artifacts

The LLM's preparation job is to turn existing project knowledge into structured, testable search instructions. Begin with [the shared library vocabulary](../content/library/vocabulary.json), canonical author/work records, biblical entities and already recorded citations. Preserve their IDs and add crosswalks where needed. Expand that foundation instead of inventing a disconnected taxonomy.

For each concept or entity, draft a term pack containing:

| Field | Purpose |
|---|---|
| Stable ID, label and definition | Identify the intended topic/entity and distinguish neighboring concepts. |
| Existing catalog IDs | Connect the rules to authoritative project records. |
| Language and source scope | State which languages, editions, genres or document kinds a rule covers. |
| Exact phrases and aliases | Include distinctive terminology, abbreviations, alternate names and historical spelling variants. |
| Broader retrieval terms | Find additional candidates while explicitly marking ambiguity. |
| Required context and proximity | Constrain ambiguous expressions through neighboring words or a defined passage/section scope. |
| Exclusions and ambiguity notes | Document common false positives and where automatic resolution must stop. |
| Output relation and evidence class | Say exactly what a successful match establishes: for example `topic_match`, not author endorsement. |
| Positive and negative examples | Provide executable fixtures and source-backed examples for checking the rule. |
| Version, origin and review record | Preserve the model/prompt used to draft it, revisions and validation results. |

An English pack does not establish multilingual coverage. Add historical and language-specific packs explicitly, testing the actual tokenizer and text normalization. Link proposed synonyms to the intended sense; doctrinally different concepts must not be silently merged because their words are similar.

LLM-authored content begins as a draft. Schema checks, compilation, fixtures and sampled corpus results establish whether a rule is fit for a versioned release. Synthetic examples test logic; source-backed examples and independently selected corpus samples test whether it works on real material. Generated content is data, never executable Python or SQL.

## Proposed artifact layout

These paths describe the intended implementation; they do not claim the files or commands already exist.

| Planned artifact | Role |
|---|---|
| `Website/knowledge/terms/schema.json` | Validate term packs, query structures, allowed relationships and test examples. |
| `Website/knowledge/terms/*.json` | Versioned domain/language packs containing the reusable authored intelligence. |
| `Website/knowledge/enrich.py` | Deterministic entry point: validate, compile, search, extract, aggregate and report. |
| `Website/knowledge/tests/` | Compiler, extraction, boundary, attribution and idempotency checks. |
| `BibleProject/KnowledgeBase/enrichment.sqlite3` | Proposed separate analytical store for runs, matches, citations and derived relationships. |
| `BibleProject/KnowledgeBase/enrichment-runs/` | Run manifests, rule-yield reports, review samples and unresolved cases. |

Use the Bible instance's corpus as a read-only input. A separate analytical store avoids losing enrichment when the current staging build replaces `knowledge.sqlite3`; join by stable IDs and recorded source hashes. Keep all state distinct from the general Fortress knowledge system. No graph-server migration is required to start.

## Deterministic enrichment pipeline

1. **Record the input snapshot.** Identify available searchable bodies, languages, source locators, catalog versions and term-pack hashes. Metadata-only records remain labeled as such.
2. **Validate and compile the rules.** Compile a restricted structured query format into parameterized FTS5 queries. Reject invalid fields, malformed expressions and unsupported operations before scanning the corpus.
3. **Search by rule across the index.** Use exact phrases first, then scoped alternatives and proximity patterns. Query the existing inverted index instead of performing one model call or a fresh full scan for every document.
4. **Inspect candidate text deterministically.** Apply bounded literal/token matching, citation parsers and context rules only to the returned passages and required neighbors. Resolve entities only when the applicable rule supplies enough disambiguating evidence.
5. **Persist located observations.** Store matched terms, source text, stable chunk/source IDs, original locations, rule version and evidence class. Retain unresolved candidates separately.
6. **Aggregate existing evidence.** Build topic-to-passage and entity-to-passage connections, explicit citation networks, co-citation and shared-reference relationships through SQL and graph algorithms. Store the observations contributing to each derived edge.
7. **Report usefulness and limitations.** Record total matches, unique passages/works reached, redundant matches, sampled errors, unresolved cases, elapsed time and any incomplete queries. Reuse the outputs in the analytical graph and retrieval layer.

The default batch requires no generation model, embedding call, network access or GPU. Intelligence may be used later to refine a noisy term pack or examine selected hard cases, but those are separate, explicitly scoped passes. Do not silently add per-chunk inference to the deterministic runner.

## FTS5 implementation details

The existing index is `chunks_fts(title, search_text)`. The interactive `retrieval.fts_query()` function converts user wording into a safe literal query; it is not an enrichment query compiler. The new runner needs its own validated compiler so authored phrase, Boolean and proximity structures retain their intended meaning. Bind compiled MATCH expressions and metadata filters as parameters; whitelist SQL structure and escape literal FTS terms.

For example, a proposed English rule could compile to:

```sql
search_text : ("justification by faith" OR NEAR("justification" "faith", 12))
```

That match establishes that the terms occur in the specified relationship. It does not establish the author's doctrine, agreement with the quoted words, or substantial treatment of the subject. The distance is a draft tuning parameter to test, not a theological rule.

FTS5 supports phrases, Boolean expressions, proximity groups and column scoping. Use its ranking and snippets to prioritize inspection, while recording actual evidence locations separately. [SQLite FTS5 documentation](https://www.sqlite.org/fts5.html)

Default to body-text matches; keep title and catalog-only matches in distinct evidence fields. Fetch all matches for a completed rule using deterministic pagination, rather than reusing the UI's top-result limits. A deliberate time or hit budget produces an explicitly incomplete run that can resume. Record denominator and scope so ranked samples are never reported as exhaustive coverage.

Account for chunk boundaries: a phrase can straddle two existing chunks. Reconstruct bounded adjacent context from the same source section, or add tested overlapping search windows where needed, preserving a mapping to the original text. Do not join unrelated sections. Deduplicate overlapping hits by source identity and location. The search index's normalized text can differ from the original; map matches back explicitly instead of reporting normalized character positions as source offsets.

## What the cheap passes can establish

| Deterministic result | Interpretation retained in the database |
|---|---|
| Exact phrase or alias occurrence | A located textual match; ambiguous identities remain candidates. |
| Several contextual topic rules match | A rule-based topic candidate with its component evidence. |
| Parsed explicit Scripture citation | This source cites this reference in this edition/numbering context. |
| Known main-text/exposition metadata | An existing catalog assertion, retaining its evidence class; not a new body review. |
| Two references occur in the same defined section | Co-citation within that scope. |
| Two works share references or topic matches | A reproducible similarity based on named features. |
| Distinctive matching wording | A located textual parallel; source dependence or allusion remains a further claim. |

A topic match must not automatically become `endorses`, `supports`, `contradicts` or `influenced_by`. Negation and quoted objections can be signals for review, but simple exclusion rules must not remove all discussion of opposing views. Repeated words alone cannot establish a sustained exposition. Unmatched terminology does not prove a subject is absent.

Keep LLM-drafted definitions and ontological links identifiable as authored proposals until validated. Store heuristic scores with their components and tuning version; do not present a score as a calibrated probability of doctrinal correctness.

## Prioritize high return work

Begin with distinctive entity aliases, explicit references and well-defined topic phrases. Reuse existing curated metadata before inferring anything from prose. Expand contextual patterns only where the initial rules show useful additional coverage.

Measure **validated new coverage per unit of processing and review time**. A rule matching thousands of duplicate editions or generic occurrences may contribute less than a precise rule identifying an unconnected section. Report unique works as well as passages, group duplicate witnesses, and account for common references and document length in graph weights.

Use the first run's results to rank the next work: high-yield validated rules first, noisy broad terms for revision, zero-hit terms for inspection, and unresolved cases by potential value. Consolidate identical searches and reuse their hit sets. Cache by corpus identity, term-pack hash and compiler/normalization version; recompute changed documents and affected rules. Withdraw stale observations when their input disappears or changes.

For the initial English topic pass, topics such as justification, covenant, assurance, prayer and suffering are candidate pilots, to be reconciled with the existing vocabulary. Include both distinctive and ambiguous terms so the pilot measures precision and missed coverage. Extend languages and subjects based on measured value rather than an arbitrary list size.

## Build sequence and acceptance criteria

1. Draft and validate the first term pack against existing vocabulary/catalog IDs, with real-source examples and ambiguous cases.
2. Implement the schema, compiler and pure Python runner. Validate actual FTS behavior against this project's SQLite/tokenizer configuration.
3. Run a declared pilot; inspect representative matches, false positives and independently selected missed cases. Refine the reusable rules.
4. Process the eligible snapshot, saving exact evidence and resumable completion state. Aggregate citations and topic/entity matches into the graph described in [ANALYSIS.md](ANALYSIS.md).
5. Publish a run report and update TODO/HANDOFF with actual coverage, commands, limitations and next priorities.

Acceptance requires: no model/network calls in the default batch; repeatable results for the same inputs; no duplicate observations after reruns; correct invalidation after changes; source locations that resolve; honest incomplete-run reporting; and measured accuracy/yield on reviewed examples. Include tests for phrase boundaries, ambiguous names, quoted disagreement, multilingual scope and version-specific Scripture references.

Set pilot quality targets before the broad run and compare results with those targets. Record missed cases alongside match quality. The strategy succeeds through useful verified connections at low cost, not simply a high count of generated tags or edges.

## Relationship to the analytical roadmap

This is the preferred first implementation method for K01 entities, K02 Scripture citations, K03 topics and the initial K06 graph computations, with K10 evaluation accompanying every pilot. It can supply candidates for K04 argument analysis, K05 allusions and K08 historical comparisons. Those interpretive layers retain their additional evidence requirements; term matching does not complete them automatically. K07 lexical enrichment starts from real available annotations, and K09 retrieval can combine these deterministic connections with the existing FTS/vector search.

The prior broader roadmap remains the destination. This strategy determines the economical first route: **author the intelligence once, validate it, execute it repeatedly, and reserve further reasoning for the cases that justify it.**
