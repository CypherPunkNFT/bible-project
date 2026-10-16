# P2 · Define the questions before mining

**Outcome:** a useful, machine-readable question architecture ready for later retrieval, without claiming that the unfinished library can answer every question.

Read PILOT.md, PLAN.md, EVIDENCE-CONTRACT.md and current topic metadata/registries. Begin with the 25 proposed pilot topics. Refine their scope and aliases; preserve existing canonical IDs where an actual match exists. For absent or ambiguous matches, use clearly provisional planning keys plus a null canonical ID and mapping issue. Never register new production IDs in this task.

## Work to deliver

1. Create `topics.json` in the private track folder: 25 topic proposals with title, parent/related proposals, canonical ID or null, aliases, narrower scope, exclusions, audience, intended reader task, ambiguity notes and mapping evidence. Cross-topic links must resolve. Avoid circular parentage and overlapping scopes disguised as new topics.
2. Create 100 original, unanswered reader questions: 80 development and 20 reserved for future evaluation. Stratify across all 25 topics, introductory/advanced use and question types. Include reported-opponent versus author position, ambiguous terms, independent-work diversity, source gaps and thin multilingual coverage as design cases. Describe the evidence needed, never fabricate an answer or relevance judgment.
3. Save the two sets separately as `questions-development.json` and `evaluation/questions-reserved.json`. Assign distinct IDs; record deterministic split rationale and file hashes in `split-manifest.json`. Do not copy reserved wording into public summaries or design fixtures. This is a prospective split, not a claim of independent human/blind evaluation. Future tuners must not open the reserved set before their configuration is frozen.
4. Supply a compact visual taxonomy overview and `MAPPING-NOTES.md` in the proposal folder, plus a lightweight validator in the owned folder for required fields, unique IDs, valid references, split disjointness and expected totals.

## Acceptance and independence

All 25 topics have explicit scopes and canonical mapping outcomes; all 100 questions have an intent and evidence requirement. Report counts by topic, question type and difficulty and every unresolved canonical match. No retrieval, vector lookup, generated theological answers, graph changes or claims of sufficient holdings. Do not open or reuse the previous LK-106 held-out question texts; use its high-level limitations only. This work defines future inputs to LK-203/LK-301 and does not complete either comprehensive topic mining or evaluation.

Own only this track's directories. P1 and P4 can proceed with their own synthetic fixtures. Finish with RESULT.md and handoff.json under the shared contract.
