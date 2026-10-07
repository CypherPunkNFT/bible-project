# Refresh after the fourteen-mission campaign

Owner instruction, October 7: once all fourteen missions finish, rebuild and embed
the acquired delta automatically. This supersedes the earlier 5 AM condition.

Windows task **BibleProject-After14Missions-Refresh** checks every five minutes and
at login. It does not require an open chat. Windows must be running with the task's
user logged in. A missed check runs when the machine becomes available again.

The gate requires `REPORT.md` and a valid `acquisition-manifest.json` for each of
**RB01 through RB14** under
`content/library/reports/reformed-baptist-overnight/`. Acquisition missions must
write their final report only after finishing their downloads/checkpoint. The
manifest must contain a `files` array (empty is valid for a completed mission with
documented gaps); if it includes `mission`, that identity must match its folder.
Running/queued/failed manifest statuses hold the gate. Missing or invalid outputs
are recorded, never interpreted as completion. If the six added missions use
different IDs, update `KnowledgeBase/acquisition-followup-plan.json` to their
actual directory IDs before expecting the gate to release.

All mission files must be quiet for five minutes, no RB acquisition collector may
be active, and no Bible build, embedding worker or completion monitor may be
running. A shared watchdog launch lock and persisted launch claim prevent duplicate
jobs. The task launches the existing full `finish-intake.ps1` pipeline through a
hidden Windows process, reusing unchanged vectors. It disables itself after
verified completion. It never starts enrichment.

The current completion monitor finishes its existing snapshot, then leaves any
new campaign additions for this follow-up. Its resulting state is
`snapshot_complete_followup_pending`; the normal watchdog respects that wait.
When the scheduled follow-up runs, ordinary late-file verification resumes.

Runtime evidence (under the separate `KnowledgeBase` directory):

- `acquisition-followup-plan.json`: expected mission IDs and task name.
- `acquisition-followup.json`: current gate, missing/invalid reports, running or final status.
- `acquisition-followup-launch.json`: process-launch receipt.
- `acquisition-followup-<PID>.log` / `-error.log`: full intake logs.
- `acquisition-followup-check-error.json`: most recent check error, if any.

Implementation: `acquisition_followup.py`, `acquisition-followup-run.ps1`, and
`install-acquisition-followup.ps1`. Tests verify eight/thirteen missions cannot
release a fourteen-mission gate, malformed/active inputs hold it, existing embeddings
are not interrupted, only one follow-up launches, and the watchdog honors the wait.
