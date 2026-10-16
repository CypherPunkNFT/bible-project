# Graph monitor recovery — LK-102

**11 October 2026, evening EDT.** Repaired the graph-only completion monitor and relaunched one hidden CPU-only process. The graph still waits for final intake and embedding verification; repair does not mean a completed full-corpus graph.

## Failure and repair

The previous monitor ended after a permission failure reading `KnowledgeBase/embedding-progress.json`. No graph monitor or extractor remained when checked. The error path called the normal report function, which could reread the same inaccessible file and fail again. The saved error alone cannot distinguish a temporary Windows sharing collision from a lasting access restriction.

Changes in `Website/knowledge/enrichment/lifecycle.py`:

- JSON reads retry only permission/sharing failures, up to six attempts with short backoff (1.55 seconds of delays). Missing files remain missing; invalid JSON is an error.
- Waiting-state access failures close the gate and retry on the next 30-second poll. Ten consecutive failed polls stop with `needs_attention`; this is a bounded recovery mechanism, not an unlimited restart loop.
- Error reporting writes a minimal heartbeat and log entry without rereading the failing input. If heartbeat writing also fails, the primary error remains in stdout.
- Recovery clears old errors and resumes ordinary waiting. A previous ready gate cannot survive a failed current-status read.
- Missing verification counters, an absent corpus build, nonpositive/missing chunk counts or a missing/conflicting preparation plan cannot open the gate. Ready status still requires checks against the actual read-only corpus, input hashes, recorded deferrals and archive exclusions.
- Extraction, independent parity, validation and private-release failures are not automatically rerun. Cancellation and the graph's own exclusive lock remain enforced.

No intake/embedding/watchdog logic, corpus database, saved vectors or quality policy was changed. The newly launched graph monitor was briefly relaunched while idle to align actual stdout/stderr with its recorded canonical log paths; only this task's graph processes were stopped.

## Verification

The recovery suite and both existing graph suites passed: **40 tests and 68 subtests**. New cases exercise temporary and persistent access failures, malformed JSON, duplicate-monitor rejection, cancellation, missing completion fields, actual source/build mismatches, extraction failure and successful stage ordering. Tests use isolated fixtures, not live corpus/vector writes. An initial test invocation lacked its temporary parent folder; creating the folder resolved those setup errors.

Live verification is recorded in `KnowledgeBase/graph-development/recovery-check-20261011/verification.json`: repeated heartbeats, a closed gate while intake is incomplete, unchanged quality policy, no stderr, and continued progress from the original embedding worker. Launcher and actual worker are a single parent/child process chain, not competing monitors.

## Current operating contract

The monitor polls every 30 seconds, opens no live corpus connection while prerequisites are incomplete, and uses no embedding model or GPU. When the existing coordinator verifies final completion, it captures a retained snapshot, independently checks vector IDs against that snapshot, executes eligible graph passes, validates evidence and publishes a private release. These stages remain pending and can still stop on real input or validation failures.

The existing reviewed policy remains unchanged: **12 English topic rules** are eligible. Body citation extraction and body-entity matching failed the earlier quality review and remain deferred. The pilot is not evidence of complete multilingual or interpretive coverage. Corpus inclusion and graph extraction eligibility are separate; future quality/eligibility improvements need their own tasks.

## Paths and remaining work

- Live heartbeat: `KnowledgeBase/graph-development/monitor-state.json`.
- Launcher and actual log destinations: `KnowledgeBase/graph-development/monitor-launch.json`.
- Logs: `KnowledgeBase/graph-development/monitor.log` and `monitor-error.log`.
- Before-state copies, fixtures and live proof: `KnowledgeBase/graph-development/recovery-check-20261011/`.
- Code: `Website/knowledge/enrichment/lifecycle.py`.
- Tests: `Website/knowledge/tests/test_enrichment_monitor.py`.

LK-102 is the monitor repair and gate verification, not graph-quality expansion or final extraction. Next initiative work is LK-103: implement the evidence collection contract on a small representative source set. Final intake, new embeddings, full permitted graph extraction and private release remain pending. Persistent access errors, a machine reboot or failed extraction are not covered by a promise of guaranteed automatic completion; consult the heartbeat/log and preserve the single-monitor lock when resuming.
