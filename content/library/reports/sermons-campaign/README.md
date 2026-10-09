# Sermons campaign: resume here

State 2026-10-09: nothing released. On `main`: Begg 1,417 / Piper 1,618 / Spurgeon 3,544 / Wesley 140 / Moody 27 sermons on passages; page lists 52 teachers (Graham, MacArthur, Morgan without sermons yet). Brief: [CAMPAIGN-BRIEF.md](CAMPAIGN-BRIEF.md).

Running on the owner's PC in their own windows (resume from checkpoints; restart with `progress/run-download.cmd` copied back to the scratch folder named inside it):
- Graham: billygraham.org sitemap scan, ~1,720 / 3,056 pages.
- Criswell: wacriswell.com, ~42 / 4,093 sermons.

Done, not yet catalogued: Maclaren 1,311 sermons ([maclaren/acquisition-manifest.json](maclaren/acquisition-manifest.json), held in `sources/library/source-ccel`); Morgan 97 sermons from 19 files, 67 with a printed text ([morgan/acquisition-manifest.json](morgan/acquisition-manifest.json), held in `sources/library/source-internet-archive`; The Westminster Pulpit is lending-only on archive.org, not obtainable).

Blocked: MacArthur. gty.org robots.txt blocks automated access. Owner to choose: email Grace to You for permission (recommended) or transcribe the audio locally.

Next, per preacher: manifest at `<name>/acquisition-manifest.json` → add to `PREACHERS` in `scripts/catalog-campaign-sermons.py` (register author + source; held folder name = source id) → `python -X utf8 scripts/catalog-campaign-sermons.py <name>` → `node scripts/validate-library.mjs` → `npm run teacher-pages` → check placed passages → private build + `playwright test -c .local/pw-sermons.config.ts` → show the owner → release only on the owner's go (global HANDOFF section 4) → DevLog.
