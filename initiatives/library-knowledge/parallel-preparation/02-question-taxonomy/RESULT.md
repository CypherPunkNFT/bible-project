# P2 complete: question taxonomy

12 October 2026. Delivered the bounded preparation task. No retrieval, answers, evaluation results or corpus-completion claim.

| Result | Count |
| --- | ---: |
| Scoped topic proposals | 25 |
| Existing website-topic IDs matched | 21 |
| Canonical mappings unresolved | 4 |
| Unanswered development questions | 80 |
| Separately reserved evaluation questions | 20 |
| Unique questions / question types | 100 / 4 |
| Questions whose source availability and relevance remain unassessed | 100 |

Each topic has aliases, narrower scope, exclusions, audience, reader task, related-topic links and mapping evidence. No new canonical IDs were registered. Five presentation groups do not constitute a doctrinal hierarchy.

**Unresolved mappings:** covenant spans differently scoped entries; suffering spans affliction and Christ-centred suffering entries; Christ's person lacks a verified exact parent topic; existing Interpretation addresses dreams/tongues rather than general hermeneutics. All four retain null canonical IDs and explicit candidate IDs. This does not mean relevant library texts are absent.

**Question design:** four questions per topic; concept, textual reading, attributed comparison and source criticism. Across the bank: 50 introductory / 50 advanced and 25 per type. Development: 40/40 difficulty and 20 per type. Reserved: 10/10 and five per type, covering all five challenge categories. All 25 topics have development coverage. The Supper, perseverance, Christ's person, worship and Christian hope have no reserved question in this first wave. Twenty separate questions cannot evaluate all 25 topics.

**Evaluation boundary:** prospective AI-assisted authoring, not independently blinded or human-reviewed evaluation. No older LK-106 held-out question texts were accessed. Reserved wording is confined to the private evaluation directory (including its authoring tool), excluded from the visual overview and notes. Future tuners must exclude that directory and freeze configuration before access. File hashes detect changes; they do not enforce access controls.

## Outputs

- [Visual taxonomy overview](taxonomy-overview.html): local standalone HTML; five groups, mapped/unresolved states, scope details, theme toggle and unresolved-only filter. Project colour palette with system/Georgia font fallbacks; no network assets or reserved questions.
- [Mapping notes](MAPPING-NOTES.md): all topic mappings, counts and split limitations.
- [Structured handoff](handoff.json): paths, input fingerprints, counts and exact integration proposals.
- [Validator](validate.py): required fields, unique IDs/wording, references/cycles, selected registry bindings, split/hash checks and reserved-wording containment.
- Private folder: `KnowledgeBase/library-knowledge/parallel-preparation/02-question-taxonomy/`. Contains `topics.json`, `mapping-evidence.json`, `questions-development.json`, `evaluation/questions-reserved.json`, `split-manifest.json`, `counts.json`, `input-versions.json`, `verification.json`, the private authoring tool and visual screenshots.

## Verification and handoff

All 43 selected input files (plan/contract, metadata, implementation references and bounded topical-entry bundles) still match their recorded hashes. No corpus was opened. The topic registry contains 5,603 entries; only selected entries' headings were inspected. Six English graph-rule labels were treated as a separate namespace. The deterministic authoring rerun accepted byte-identical outputs. Validation passes with zero duplicate questions, invalid links, cycles or reserved wording in overview files. Edge checks at 1440 and 390 pixels, both themes, confirm 25/4 filter behavior, zero horizontal overflow and zero page errors. Screenshots are in the private `visual-verification/` folder.

Run the validator from the project root: `D:\Python\python.exe Website/initiatives/library-knowledge/parallel-preparation/02-question-taxonomy/validate.py`. It reads reserved data structurally without printing questions; this is not retrieval evaluation.

Coordinator actions: review the four mappings; adopt the development set as future input; protect the reserved set; add a fresh evaluation wave if all-topic coverage is needed; review the visual for later wiki integration. Recheck registry hashes before integration. Comprehensive mining, relevance assessment and answers still require final intake, vector parity and gated graph completion. Shared source, catalogue, wiki, original assets, prior evidence, vectors and running jobs were untouched. No commit or deployment.
