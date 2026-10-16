# Pinned CPU recovery

This workstream owns only this new package and private `KnowledgeBase/library-knowledge/connected-research/recovery/` outputs. It installs no service and changes no selected pointer. The existing analytics global lease serializes every population backup, restore and verification. A competing live or inaccessible owner is refused; continue development/tests and retry the same command after that owner releases its lease.

The supported release set is **KR-101 `kr101-31239794030518bcb2299a31`**, in full: 100,889 supported documents/entries, all 214,449 scope dispositions, 1,161,753 selected sections and 1,469,536 segments. The snapshot also preserves the database's historical job/checkpoint records. All consumed representation dependencies and hash-bound originals, release exports, frozen development/reserved fixtures, verification/review receipts, source code including untracked modules, configuration and Python/SQLite/package/Git identities are inventoried. Upstream LA-02/03 immutable release evidence is retained as provenance; the captured KR-101 scope is the operational recovery boundary. This is not a backup of upstream regeneration, later analytical releases, the live corpus/FTS, vectors or the website. No vector version is selected, and this is explicitly CPU-only.

From Website in **cmd.exe**, with login disabled, using the existing venv Python:

```bat
..\KnowledgeBase\.venv\Scripts\python.exe -B -m unittest knowledge.library_analytics.recovery.test_recovery -v
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.archive pin --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.archive backup --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014 --stop-after 200
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.archive backup --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.archive restore --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014 --stop-after 200
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.archive restore --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.verify verify --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014
..\KnowledgeBase\.venv\Scripts\python.exe -B -m knowledge.library_analytics.recovery.verify query --work ..\KnowledgeBase\library-knowledge\connected-research\recovery\kr101-v2-20261014 --term assurance
```

`pin` creates an immutable plan; reruns reuse it. Any new semantic/code/input version needs a new owned work directory. `backup` hashes source and copied bytes, fsyncs/renames each file, then commits its artifact fact and JobStore checkpoint atomically. A crash between file rename and checkpoint safely recopies it. Same-generation resume rehashes prior committed sources and outputs and rejects drift. The source SQLite is captured through its supported online backup API, including committed WAL; no source checkpoint is forced. Completed runs preserve the original receipt and validate the inventory again.

`restore` refuses an existing file with different bytes and never overwrites production. Every historical source path maps through the pinned inventory, with no fallback to an original file. Full database integrity, selected counts, dependency resolution, frozen located witnesses and twelve heading queries are checked. Captured code is executed from the restored Website import root. A disposable child exits inside a JobStore transaction, then resumes from its committed checkpoint; results must equal uninterrupted operation and an idempotent rerun. This is recovery verification, not new theological/retrieval quality review. Native structures and heading candidates retain their previous limitations and review states.

The archive includes environment identity, not an offline Windows/Python installer or package wheelhouse. The drill uses the installed Python environment. On a new machine install the recorded Python/packages before running the captured code. No fully offline machine rebuild is claimed.

`backup/receipt.json` and `restored/verification.json` are the actual recovery receipts; `plan.json` records closure and omissions. The backup folder is self-contained for retained section facts and evidence. The work control SQLite/log/receipt files are separate from the immutable data inventory. Preserve both for audit. Local copies on D: do not establish disk-loss protection. No destination is inferred from a mounted drive or another project's backup policy; private data is never uploaded by these commands.
