# Scholars-only material

On 2026-10-13 the site owner directed that Josephus be excluded from general reading content while remaining available in Scholars. This is an editorial placement rule, not a theological classification added to his profile.

- Do not use his quotations, citations, retellings or explicitly dependent claims in biographies, ruler pages, chapter supplements, letters, topic notes or the ordinary source directory.
- Remove dependent claims together with their citations. Do not leave the same claim with its attribution erased.
- Retain the Scholars entry and works, original research records and preservation snapshots.
- Preserve Scripture text, including biblical names spelled Josephus. Reader footnotes referring to the historian are omitted as complete notes; the source edition files remain intact.
- Imported topic dictionary paragraphs that use him are omitted as complete paragraphs. Four person summaries have been replaced with Scripture-based summaries.

Run `node scripts/check-editorial-sources.mjs` after data generation and before a release. It checks the general reading datasets and verifies that Scholars still includes him. Original edited datasets are preserved in `.local/josephus-editorial-backup/` for review.
