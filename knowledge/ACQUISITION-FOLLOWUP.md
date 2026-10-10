# Same-day acquisition intake

The owner superseded the fourteen-mission gate on 7 October 2026. `BibleProject-After14Missions-Refresh` is disabled and its plan has `enabled: false`. Historical gate tests remain; the gate is not the active processing policy.

Run `powershell -ExecutionPolicy Bypass -File knowledge/finish-intake.ps1` after each acquisition batch. Check `KnowledgeBase/embedding-progress.json` first. The pipeline takes an exclusive completion lock, waits for the current embedding worker, refreshes the local corpus and embeds with existing vectors reused. Attribution remains metadata; `evidenceOnly` does not block lawfully held text. No public text hosting or enrichment is launched.

Live logs: `KnowledgeBase/same-day-intake.log`, `same-day-intake-error.log`, `intake-completion.json`, `embedding-progress.json`. Bulk TCP: `KnowledgeBase/bulk-tcp/progress.json`.
