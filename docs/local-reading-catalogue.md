# Local reading catalogue

The intake database already contains `library_records` (canonical works, editions,
assets, series and runs) and `library_files` (individual source files and extraction
metadata). These are different entities. A file, format, anthology contribution,
edition and intellectual work must not be counted interchangeably.

The loopback profile reader uses a joined, private SQLite read model at
`.local/local-library/catalog.sqlite3`. `scripts/reader_catalog.py` reads the intake
tables without modifying them and records works, creators, editions, assets, files,
reading copies, contributor memberships, source-hash bindings, profile shelves and
linkage issues in separate tables. Exact source-hash asset joins require compatible
contributor identities. Ambiguous author matches are reported, not silently merged.

Both the profile shelf and its source-editions list query this model. The original
profile JSON is still used for biographical and scripture-chart data; those figures
are not presented as counts of readable files. Public builds retain their separately
licensed public reading records. This does not publish private source files.

On this workstation, both the portable build and npm prebuild refresh the private
index and joined catalogue automatically, when the private reader is present. A
failed refresh fails that build. The query path rejects an older catalogue if the
reader index snapshot has changed. An intake change made after a build is reflected
on the next local build; this is a build snapshot, not a live intake watcher.

For a standalone rebuild, run the existing KnowledgeBase venv Python directly:

```
..\KnowledgeBase\.venv\Scripts\python.exe -X utf8 scripts\local_library.py --build-index
```

Use cmd.exe with shell login disabled. This reads intake and existing extracted
text; writes only the private reader's generated files; and does not start models,
embedding, acquisition, OCR or watchdog jobs.

Every refresh writes `.local/local-library/catalog-audit.json` and
`catalog-audit.md` covering all 52 existing profiles and the complete canonical
catalogue/file inventory. Detailed issues are queryable in the `issues` table.
Rows in `files` with a null `work_id` also expose the remaining intake-to-work
reconciliation backlog. Missing author metadata counts mean missing explicit fields
on intake rows, not proof that an author cannot be established from source evidence.

This establishes one consistent reader query path and a visible backlog. It does
not establish complete author bibliographies, verified edition identity for every
file, complete transcriptions, or public permission for locally held material.
