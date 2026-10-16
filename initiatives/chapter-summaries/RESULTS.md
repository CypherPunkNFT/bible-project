# Results and evaluation record

## Full run: the whole Bible, 2026-10-13 (current)

Ran 19:30–22:10 America/New_York.

**Outcome:** every one of the 1,189 chapters of the 66 books now has a Claude draft in `.local/chapter-summary-studio/claude/summaries-v3.sqlite3`. All are `status=draft`, none approved. This count includes the 48 sample chapters below; the full run wrote the other 1,141.

**Settings:** the same as the sample. Claude agents ran 8 at a time, with writer prompt v3 and length gate v2. Each batch went through these steps:
1. Planners.
2. Writer lanes.
3. Blind review.
4. Revision of every flagged chapter from its findings.
5. A fresh blind re-review of each revision.
6. Import, in the order second revision → retry → revision → main.

Batches overlapped: while one batch was in review, the next was being written. The batch list is in `claude-pilot/full-run-batches.json` and the per-batch record is in `claude-pilot/full-run-progress.json`.

| | Chapters | No material issue, first review | Revised | No material issue after revision |
| --- | ---: | ---: | ---: | ---: |
| Full run (24 batches) | 1,141 | **1,041 (91%)** | 100 | **1,141** |
| Sample (earlier) | 48 | 38 | 10 | 48 |

- **Revision passes:** 98 of the 100 revisions passed their re-review the first time. Two needed a second revision:
  - Exodus 13, in `full-02-rev2`.
  - Luke 12, in `full-20-rev2`. Its parable dropped the condition that the servant who knew his master's will *and did not act on it* gets the heavier beating.
- **Length-gate retries:** two chapters ran over the word limit on both attempts and were written again from scratch:
  - Psalm 127: 72 words against the 70-word limit for short chapters. Retried in `full-13-retry`.
  - Daniel 11: 208 words against 200. Retried in `full-18-retry`.
  - Both retries passed review.
- **Lengths:** across all 1,189, the mean is 161 words and none is over 200.
- **Weakest stretches:**
  - Genesis 1–48: 40 of 48 clean.
  - 2 Corinthians 12 – Hebrews 10: 40 of 48 clean. Hebrews' dense argument accounts for three of the eight flags.
  - Matthew 9 – Luke 17: 41 of 48 clean.
  - 2 Chronicles 24 – Job 4: 41 of 48 clean.
- **Strongest:** Psalm 114 – Proverbs 12, with all 48 clean.

| Batch | Chapters | Count | Clean first review | Revised | Note |
| --- | --- | ---: | ---: | ---: | --- |
| full-01 | GEN 1–48 | 48 | 40 | 8 | |
| full-02 | GEN 49 – LEV 8 | 48 | 42 | 6 | EXO 13 revised twice |
| full-03 | LEV 9 – NUM 29 | 48 | 45 | 3 | |
| full-04 | NUM 30 – JOS 7 | 48 | 41 | 7 | |
| full-05 | JOS 8 – 1SA 6 | 48 | 44 | 4 | |
| full-06 | 1SA 7 – 1KI 1 | 48 | 46 | 2 | |
| full-07 | 1KI 2 – 1CH 2 | 48 | 45 | 3 | |
| full-08 | 1CH 3 – 2CH 23 | 48 | 47 | 1 | |
| full-09 | 2CH 24 – JOB 4 | 48 | 41 | 7 | |
| full-10 | JOB 5 – PSA 10 | 48 | 42 | 6 | |
| full-11 | PSA 11 – PSA 62 | 48 | 47 | 1 | |
| full-12 | PSA 63 – PSA 113 | 48 | 46 | 2 | |
| full-13 | PSA 114 – PRO 12 | 48 | 48 | 0 | PSA 127 retried for length |
| full-14 | PRO 13 – ISA 9 | 48 | 44 | 4 | |
| full-15 | ISA 10 – ISA 58 | 48 | 44 | 4 | |
| full-16 | ISA 59 – JER 41 | 48 | 44 | 4 | |
| full-17 | JER 42 – EZK 34 | 48 | 45 | 3 | |
| full-18 | EZK 35 – AMO 5 | 48 | 42 | 6 | DAN 11 retried for length |
| full-19 | AMO 7 – MAT 7 | 48 | 46 | 2 | |
| full-20 | MAT 9 – LUK 17 | 48 | 41 | 7 | LUK 12 revised twice |
| full-21 | LUK 18 – ACT 22 | 48 | 44 | 4 | |
| full-22 | ACT 23 – 2CO 10 | 48 | 42 | 6 | |
| full-23 | 2CO 12 – HEB 10 | 48 | 40 | 8 | |
| full-24 | HEB 11 – REV 21 | 37 | 35 | 2 | |

(Each range skips the sample chapters inside it.)

**What the reviewers kept catching** were one-phrase slips, the same kinds as in the sample. Each recurring kind was added to the writer instructions for later batches:
- An instruction or plan reported as something that happened.
- God's or Christ's agency dropped or moved, for example "the Lord, who will raise us" where 1 Corinthians 6:14 says God will raise us.
- A pronoun pointing at the wrong people, for example "their weapons" in 2 Corinthians 10.
- A wrong speaker, or a quotation credited to the wrong person, for example Moses and Isaiah in Romans 10.
- A condition or time limit dropped, for example Hebrews 9:8.
- A command turned into a report, for example "the readers recall" for "Remember the early days" in Hebrews 10:32.
- A later identification imported into a vision (Daniel, Isaiah).

**How the work was organised:** one fresh agent per task, with no shared context. A batch used:
- 6 planners, each planning 8 chapters.
- 8 writer lanes, each writing 6 chapters.
- 6 reviewers, each reviewing 8 chapters.
- 1–2 revision lanes.
- 1–2 re-reviewers.

That comes to about 23 agents per batch and about 550 for the run. Each agent reported 80–150 thousand tokens, so roughly 60–75 million in total against the owner's Claude plan. The run never hit a usage limit.

**Process notes, from the agents' own reports:**
- One writer used Python to shorten its own ISA 28 work file. From then on, writer instructions said "no scripts".
- One revision lane ran an extra word count on Luke 24.
- No agent reported touching files outside its run folder. Every raw submission is kept with its SHA-256 fingerprint, so the folders show exactly what each agent submitted.

**Caveats (unchanged):** the reviewers are Claude, the same family as the writers, and no person has read these drafts. "No material issue found" means one blind inspection, not approval. Approval belongs to the owner, in the studio.

## Sample run at full-run settings — 2026-10-13, evening

**Owner settings:** under 200 summary words is fine; Claude runs 8 in parallel. The run used writer prompt v3 and length gate v2 (200 words; 70 for chapters of 1–5 verses).

**Chapters:** 48 unseen ones, 8 from each reading section, chosen with seed `20261014`. History: EXO 30, LEV 3, 1SA 14, 2SA 17, 1CH 13, 2CH 10, 2CH 31, NEH 5. Poetry: PSA 41, 44, 50, 51, 91, 95, 112, 125. Prophets: ISA 39, JER 15, JER 47, EZK 18, AMO 6, OBA 1, HAG 2, ZEC 11. Gospels and Acts: MAT 8, MRK 3, MRK 7, LUK 13–15, ACT 2, ACT 20. Letters: 2CO 11, EPH 3, 1TH 2, 1TI 4, 2TI 4, PHM 1, HEB 6, JAS 5. Revelation: 3, 4, 7, 9, 11, 14, 19, 22. They range from 5 to 52 verses, and Mark 7 lacks verse 16 in BSB.

| Step | Agents in parallel | Wall time | Result |
| --- | ---: | --- | --- |
| Plan (`sample-1`) | 6 planners × 8 chapters | ~1.5 min | 48 of 48 accepted first try |
| Write | 8 lanes × 6 chapters | ~5 min | 48 of 48 validated; 11 needed a second try for length |
| Blind review | 6 reviewers × 8 chapters | ~5.5 min | **38 of 48 no material issue**; 10 revise |
| Revise (`sample-1-rev`) | 5 lanes × 2 | ~2.5 min | 8 of 10 accepted; 2 blocked by length |
| Revise again (`sample-1-rev2`, word limit now stated in the request) | 1 lane × 2 | ~2 min | 2 of 2 accepted first try |
| Re-review the 10 revisions (fresh reviewers) | 3 | ~3 min | **10 of 10 no material issue** |
| Import into `.local/chapter-summary-studio/claude/` | — | seconds | 48 drafts, all `status=draft`, review verdict attached |

**The ten first-pass misses** were all one-phrase slips of condition, agency or place:
- Psalm 51:13 teaching made conditional on bloodguilt.
- Nehemiah 5:10 "let us stop" turned into an order to others.
- Jeremiah 15:19 second condition dropped.
- Luke 13 fig tree "spared" (the owner never answers).
- Acts 20:23 chains placed in Jerusalem.
- Revelation 14:3 the 144,000 made the singers.
- 2 Corinthians 11:4 a hypothetical stated as fact.
- 2 Timothy 4:19 "greet" turned into Paul greeting.
- Philemon 17 "if you consider me a partner" dropped.
- James 5:3 gold testifying instead of its corrosion.

Each revision got its packet, its earlier draft and the findings, and each fix was confirmed by a reviewer who had not seen the earlier version.

**Lengths:** mean 161 words (68–199). Chapters over 30 verses averaged 176 words, chapters of 20 verses or fewer 148.

**Tokens** (as reported by the agents): planners ≈ 13k per chapter, lane writers ≈ 16k per chapter (one-agent-per-chapter writing in the pilot cost ≈ 72k), reviewers ≈ 16k per chapter. Revisions and re-reviews add about 15k per chapter averaged over the batch. Total ≈ 60k per chapter.

**Process notes:**
- Several lane writers read only the evidence part of later prompt files, assuming the identical instructions above it. The prompts are identical within a run, so the input was the same.
- One lane ran a `sleep 1` and one ran a Python word count on its own draft. Neither touched project files.

**Caveats (unchanged):** the reviewers are Claude; no human has reviewed any draft; "no material issue found" is one inspection, not approval.

## Claude pilot with deterministic coverage — 2026-10-13

Readable report of every draft, verdict and quoted material issue: [claude-pilot/REPORT.md](../../.local/chapter-summary-studio/claude-pilot/REPORT.md). Rubric used for every draft: [REVIEW-RUBRIC.md](REVIEW-RUBRIC.md).

### What ran, and in what environment

- **Writer and planner:** Claude, model `claude-opus-5-5`, running as Claude Code subagents inside one interactive VS Code session on this workstation. They read the exact local BSB packets from disk and submitted through [chapter_summary_claude_pilot.py](../../scripts/chapter_summary_claude_pilot.py). No API key, no unattended automation and no extra software were used. Usage counted against the owner's Claude plan inside this session; this session cannot see whether that plan is metered.
- **Comparison writer:** local `qwen3.6:27b-q4_K_M` through Ollama on the RTX 4090. It used the exact round-3 writer settings (temperature 0, 32,768-token context, reasoning on, two attempts) on the **same packets**, with the **same prompt version and acceptance checks** as the Claude writer in that run ([chapter_summary_writer_comparison.py](../../scripts/chapter_summary_writer_comparison.py)).
- **Review:** fresh Claude reviewer agents saw the BSB text and the drafts labelled A/B/C in a seeded random order. The label key sat in a separate file they were told not to open. Then I inspected every Claude draft against the source myself and adjudicated severity where reviewers were inconsistent (below).
- **Sources:** byte-identical to the round-3 inputs for all eight development chapters and their context passages (checked at prepare time).

### Runs

| Run | Chapters | Section plans | Writer prompt | Length gate |
| --- | --- | --- | --- | --- |
| `dev-1` | the eight development chapters | new Claude planner, section starts only | v1 (the unchanged round-3 Qwen writer prompt) | off |
| `dev-2` | same | reused from `dev-1` (identical packets) | v2 (adds length/shape and keep-conditions guidance) | off |
| `fresh-1` | Exodus 21, 2 Samuel 11, Psalm 88, Isaiah 53, Mark 9, Job 22, Daniel 7, James 2 | new Claude planner | v2 | on (enabled before any writer ran; recorded in the manifest) |

Every planner submission was accepted on its first attempt, including Genesis 5 and Psalm 119, which blocked Qwen in round 3, and Mark 9, where BSB leaves out verses 44 and 46.

### Outcomes

Reviewer verdict counts, then the count after my adjudication:

| Run | Draft set | Drafts | No material issue found (reviewer → adjudicated) | Material issues | Mean score /16 | Mean summary words |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| dev-1 | Claude | 8 | 8 → 8 | 0 | 15.0 | 164 |
| dev-1 | Qwen, same packets | 8 | 4 → 3 | 12 (+1) | 11.9 | 118 |
| dev-1 | Qwen round 3, preserved | 6 | 1 → 1 | 7 | 11.5 | 111 |
| dev-1 | Qwen round 2, preserved (Genesis 5 only) | 1 | 0 | 2 | 13.0 | 134 |
| dev-2 | Claude | 8 | 8 → 8 | 0 | 14.75 | 152 |
| fresh-1 | Claude | 8 | 8 → 7 | 0 (+1) | 14.75 | 150 |
| fresh-1 | Qwen, same packets | 8 | 2 → 2 | 22 | 10.5 | 125 |

**Adjudications, both stricter than the reviewer:**
1. dev-1 Jonah 4, Qwen same-packet: "God sends a worm and scorching wind to destroy it" assigns the withering to the wind (v. 7 vs v. 8). This is a changed agent, the same error Codex rated material in round 3. Reviewer: minor. Adjudicated: **material**.
2. fresh-1 Exodus 21, Claude: it keeps "punishment if a servant struck by his master dies" but omits verse 21's exception ("if the servant gets up after a day or two, the owner shall not be punished, since the servant is his property"). The source rules forbid dropping difficult material to keep a summary comfortable. Reviewer: minor. Adjudicated: **material omission**. This is the one Claude draft I would send back.

**Errors Qwen still made with complete, exact sections** (all quoted in the report): blood → "the ground crying out for justice" and one city → "descendants establish cities" (Genesis 4); the wind withering the plant (Jonah 4); God's direct "You have removed my friends" → "wrath and waves isolate him" (Psalm 88); the confessing "we" → "observers" and "when … a guilt offering" → "so that" (Isaiah 53); an "accidental" quarrel and "life for a life" detached from its case (Exodus 21); the scribes' dispute given to the crowd and a reward moved from the cup of water to miracle-workers (Mark 9); "justified by deeds and not by faith alone" replaced (James 2); the Ancient of Days made the agent of every passive verb (Daniel 7). The coverage fix removed Qwen's blocking failures, but these meaning errors are the writer's.

**Claude's recurring weaknesses** (all minor except the Exodus 21 omission):
- **Length.** v1 averaged 164 words, with 7 of 8 over 140 and two first attempts over the 240 limit. v2 guidance alone gave 152, with 7 of 8 still over 140. v2 plus the gate gave 150: the gate removed the extremes (three rejections, all rewritten on the second attempt), but 7 of 8 are still between 141 and 174 words. The approved "usually 80–140" is **not yet met**.
- **Near-list prose.** The summaries tend to retell verse by verse.
- **Small omissions under length pressure.** Examples: "Listen to Him!" (Mark 9:7), the exultation in verse 3 (1 Corinthians 13).
- **A v2 side effect.** "Vary how you refer to the speaker" produced "the psalmist … the speaker" in Psalm 88, which can read as two people.
- **What v2 did fix:** both dropped conditions in Genesis 4 (vv. 7, 15) and Romans 1's "often planned … prevented until now".

### What this comparison is and is not

- **Controlled:** identical Scripture, identical packets, identical prompt version and identical acceptance checks between Claude and Qwen within a run. The writer is the only difference, but "writer" includes how it runs: Claude worked as a tool-using agent that could re-read its prompt and check its own draft; Qwen answered in one schema-constrained call.
- **Not controlled:** Claude's planner chose different section boundaries from Qwen's round 3, and Jonah 4's packet added 3:10 as context. So "Claude vs Qwen round 3" compares pipelines, not models.
- **Reviewer bias risk:** the reviewers are Claude too. Labels were hidden and shuffled, but Claude's longer, more literal style is recognisable, and a same-family reviewer may favour it. No human has reviewed these drafts.
- **Dev set reuse:** the development chapters shaped the v2 change. `fresh-1` is the first unseen evaluation: 8 chapters, one draft each. That is a small sample.
- **What "no material issue found" means:** one inspection by one reviewer. It is not approval.

### Review of the prior Codex critiques (round 3)

I re-checked each against the BSB text. All six are substantially correct; none is invented.
- **Rated too strongly:** Romans 1 dropping "with power" is a minor precision loss, not a defect on the level of the others.
- **Missed:**
  - Jonah 4 turns God's closing question into an assertion ("His own rightful compassion") and calls Jonah's anger "misplaced".
  - 1 Corinthians 13 says love "outlasts childhood reasoning", which the text does not say.
  - Genesis 4 calls Lamech "arrogant", an evaluation the text does not make.
  - Romans 1's summary loses verse 32's "although they know God's righteous decree … worthy of death".

The blind reviewers independently caught most of these. So the Codex critiques were sound but incomplete, which supports not treating any single reviewer as the gate.

## Evidence-first campaign (Qwen, rounds 1–3, earlier on 2026-10-13)

The same eight BSB chapters were attempted in all three rounds: Romans 1, Genesis 4, Genesis 5, Psalm 117, Psalm 119, Proverbs 10, Jonah 4, and 1 Corinthians 13. These cover letters, narrative, genealogy, a very short psalm, the longest chapter, and wisdom sayings. They do not cover every biblical genre.

[Browse every output and critique](../../.local/chapter-summary-studio/evidence-first-trials/report.html). [Machine-readable verification and hashes](../../.local/chapter-summary-studio/evidence-first-trials/verification.json).

| Round | Approach | Drafts produced | Blocked before draft | No material issue found in Codex review | Chapter-processing time |
| --- | --- | ---: | ---: | ---: | ---: |
| 1 | Generated claims + exact quotations + retrieved verses | 5 | 3 | 0 | 567.97 s / 9m 28s |
| 2 | Selected references + Python-retrieved verse text | 7 | 1 | 0 | 229.75 s / 3m 50s |
| 3 | Complete sections + sentence support + reasoning writer | 6 | 2 | 1 | 656.82 s / 10m 57s |

Total: **24 chapter attempts, 18 drafts, six blocked outcomes, zero human approvals**. About 24m 15s of measured chapter processing excludes the time spent changing code and performing editorial review. Input/output token totals include extraction, writing, retries, and advisory model review:

| Round | Input tokens | Output tokens |
| --- | ---: | ---: |
| 1 | 61,507 | 23,491 |
| 2 | 55,934 | 8,903 |
| 3 | 55,203 | 28,122 |

Reasoning-enabled generation is included in the runtime's output token accounting. These measurements do not establish a full-Bible ETA: failures are not completed chapters, chapter lengths vary, and no production quality gate passed. The earlier roughly 90-minute expectation for brief paragraph generation should not be reused.

## Final-round chapter findings

| Chapter | Codex editorial result | Specific observation |
| --- | --- | --- |
| Romans 1 | Revise | Retains the closing approval-of-wrongdoing point, but still drops “with power” and Jew-first/Greek-next qualifications; wording blurs conduct and penalty |
| Genesis 4 | Revise | Fixes blood/ground confusion, but adds unsupported simultaneity and imprecise Lamech/vengeance language; invitation confuses Cain with his line |
| Genesis 5 | Blocked | Section plan ends at verse 24; verses 25–32 absent; writer not called |
| Psalm 117 | No material issue found | Preserves “toward us,” the audience, and enduring faithfulness; remains unapproved |
| Psalm 119 | Blocked | Second section plan ends at verse 128; verses 129–176 absent; writer not called |
| Proverbs 10 | Revise | Claims about joy are attached to verses 19–24 though the explicit statement is verse 28; whirlwind wording shifts the image |
| Jonah 4 | Revise | Makes both worm and wind wither a plant that already withered before the wind; mis-scopes the final description of people/cattle |
| 1 Corinthians 13 | Revise | Adds “forever” to faith, hope, and love remaining in verse 13; this qualification is not supplied by that verse |

The comments distinguish factual alteration, unsupported interpretation, citation mismatch, omitted precision, and style. “No material issue found” describes this inspection, not a human approval or proof that no error exists.

Qwen's advisory reviewer passed 17 of 18 produced drafts. Its sole objection was to Jonah “recalling his flight,” a reasonable paraphrase; it missed more concrete defects in that same draft. It cannot serve as a reliable approval authority on this evidence.

## What changed between rounds

Round 1 proved that exact quotation checks can coexist with bad extracted claims. Genesis 5's claim changed “after 500” to “at 500” while carrying the correct source verse. Some claims included facts from neighboring, uncited verses. Genesis 4 and 1 Corinthians 13 concatenated quotations across verse boundaries and were correctly blocked.

Round 2 eliminated generated claims and model-copied quotations from the intermediate packet. Python fetched actual text for selected verse IDs. This reduced runtime and quote-format failures, but selection missed Romans 1:32 and the writer still broadened Psalm 117's “us” to “humanity,” changed Genesis 4's subjects, and added permanence to 1 Corinthians 13:13.

Round 3 hydrated every verse in each proposed section and asked the reasoning-enabled writer for internal sentence/outline citations. The writer's output was transformed back into the unchanged reader schema. Psalm 117 improved. Other semantic problems persisted, and the eight-section splitter omitted the endings of Genesis 5 and Psalm 119. Those incomplete packets were not sent to the writer.

## Earlier studio campaign — a separate set of rounds

Do not confuse `pilot-round2-results.json` and `pilot-round3-results.json` directly under the studio output directory with `evidence-first-trials/round-1/2/3`.

The earlier v3 campaign tested nine initial chapters (Romans 1; Genesis 1 and 5; Leviticus 12; Psalms 117 and 119; Job 4; Proverbs 10; Revelation 12), then reviewer refinements on Romans 1/Genesis 1, followed by the eight-chapter set used above. It exposed speaker, qualifier, range, invitation, and imported-background errors. The earlier review report is [pilot-review-report.json](../../.local/chapter-summary-studio/pilot-review-report.json).

Fast scoped-review calibration missed three known defects while accepting a good control. A later reasoning-review calibration caught only one of those three known defects and was much slower. These reviewer experiments are distinct from round 3's reasoning-enabled **writer**.

Five earlier studio examples were manually corrected and remain in the active v3 database. Their pre-edit outputs are preserved in `pilot-examples-before-editorial-corrections.json`. They must not be used as untouched model outputs when scoring the new experiments.

## Historical largest-chapter benchmark

The preserved Psalm 119 benchmark used the old short-output pipeline with a 16,384-token runtime context and 600-token output cap. It recorded 4,049 input tokens, 147 output tokens, 4,196 total, and about 5.01 seconds. It is not a benchmark for the current structured, cited, reasoning-enabled pipeline. Its old `valid=true` field refers to the checks then applied and is not a retrospective semantic approval.

[Original benchmark artifact](../../.local/chapter-summary-studio/psalm119-token-benchmark.json).

## Evaluation limitations and decision

The development batch was reused for prompt refinement; there is no unseen holdout result. Multiple mechanisms changed together, so their individual effects are not isolated. Validation rejects structural failures but cannot score faithful meaning. Editorial inspection was performed by Codex, not by an independent human editorial panel.

The full Bible run remains paused. *(Superseded on 2026-10-13: deterministic coverage, the controlled comparison and a fresh-chapter evaluation were then carried out. See the Claude pilot section at the top. Still no automatic approval and no production import.)*
