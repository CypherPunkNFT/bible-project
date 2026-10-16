# Baseline and dependencies

**Historical setup record.** For the latest documented assessment, use [REVIEW-2026-10-13.md](REVIEW-2026-10-13.md), the stage result reports linked from [README.md](README.md), and the actual current owner status files. The counts/PIDs below are not live operating evidence.

Observed 11 October 2026 during documentation setup. This is a dated planning snapshot, not a live status dashboard or a new completion verification.

| System | Observation | Evidence |
| --- | --- | --- |
| Current embedding pass | 8,458,873 total chunks; 6,877,925 indexed; 1,580,948 remaining; file reports running at 18:07:10 UTC (2:07:10 p.m. EDT) | `KnowledgeBase/embedding-progress.json` |
| Local model | Qwen/Qwen3-Embedding-4B, revision `5cf2132abc99cad020ac570b19d031efec650f2b`, 2,560 dimensions | `Website/knowledge/config.json` |
| Browser pack | 85,385,431 bytes; 25 studies and 31,098 WEB verses; version `9db35ceaa8c9` | `MeaningPack/site/meaning.json` |
| Browser model | `ibm-granite/granite-embedding-small-english-r2`, 384 dimensions | Same manifest and `Website/scripts/build-meaning-pack.py` |
| Graph | Software/pilot implemented; full-corpus extraction and private release not complete in saved report | `KnowledgeBase/graph-development/REPORT.md`, updated October 9 |
| Graph monitor | Last saved state `needs_attention`; permission error reading embedding progress and unmet completion gates | `KnowledgeBase/graph-development/monitor-state.json`, October 9 |
| Graph pilot limitations | 120 documents / 66,867 chunks; 12/24 passing English topic rules; production citation/entity extraction deferred | Same report and `quality-policy.json` |
| Existing public release | Handoff records 149,799 library records and 19,841 on-site reading copies in October 10 release | Project `HANDOFF.md`; not reverified live in this documentation task |

Paths above are relative to the BibleProject root. Embedding counts describe the current corpus build, not every pending acquisition. The integration master plan records additional prepared chunks awaiting coordinator reconciliation; do not add candidate counts to the corpus total.

## Dependencies to verify before execution

1. Current intake/coordinator state, remaining input handoffs and eventual final vector parity.
2. Whether the graph monitor's October 9 failure remains current; repair through existing ownership rather than launch a second monitor blindly.
3. Applicable graph quality policy and unresolved identities. The pilot's structural validation is not proof of semantic accuracy.
4. Public permission and reading coverage for the selected pilot inputs.
5. Adequate source metadata for multilingual, historical and sermon-specific claims.

No runtime file was changed during this documentation setup. No new pipeline, model, source download or public content export was launched.
