# Baby names implementation recovery — 9 November 2026

> **Superseded in part, 9 November 2026 (finishing step).** The 187 draft meanings below were not left withheld: each now has a hand-checked meaning citing the local Strong's text, and Esther, Elisha, Michal and Matthew have sourced meanings again (Easton's dictionary is on this PC, registered as easton-txt). Sargon, the father of Darius and Candace are no longer excluded; each has a reviewed identity. What changed and why is in [design.md section 13](design.md); this file is kept as the record of the earlier recovery.

This review concerns the actual Website source, not an isolated rehearsal. It follows the reviewed design's requirement to withhold unsupported meanings rather than invent them. No publication was performed.

The initial data build produced 1,807 pages and exposed the prior report's 187 draft original-word meanings, 47 unconfirmed spelling lines and three site-added people without TIPNR records. The corrected build produces 1,816 pages (523 full, 1,293 short), with 509 aliases. SSA data remains absent; popularity sorting stays hidden rather than inventing ranks.

All 187 automatic draft derivations are withheld as headline meanings. Their pages say **Meaning uncertain**, retain attributed Strong's wording, and receive no themes from an uncertain headline. This is a conservative exclusion of proposed meanings, not a claim to have established 187 etymologies. The review also checked all 27 overrides against the actual local dictionary entries. Unverified BDB/Easton citations and their dependent proposals were removed. Esther, Elisha, Michal and Matthew now say uncertain where the inspected source did not establish the proposed gloss. Other affected overrides use the inspected Strong's wording. The Greek Matthew entry's cross-reference really points to G3164, a verb; it is not silently corrected to another entry.

Every unconfirmed spelling line now has a decision in `scripts/bible/baby-names/spelling-overrides.json`: 16 evidenced lines, 31 excluded lines, and three separately excluded site-added identities. Confirmed spellings carry numbered Berean verse IDs and must occur as complete words in the relevant source line's verses. Exclusions record individual reasons: translated titles/descriptions, unprinted variants, patronymics, or unresolved lexical/person identities. Sargon and the father of Darius are excluded pending verified original-language identities; Candace is excluded as a site-added record identifying a royal title. Other confirmed lines for the same person remain available. The build now fails on a newly unconfirmed spelling or an undocumented missing TIPNR identity instead of silently skipping it.

Source citations on override blocks are now visible even when no explanatory paragraph is present. The two original browser acceptance assertions remain intact; additional cases cover filtering, aliases, uncertainty, both Noah originals, noindex cleanup, boy/girl routes and narrow layouts. `e2e/baby-names.config.ts` uses the original preview on 8931 and starts no listener.

Validation evidence is in recovery job `969b8c83b6c24d58bc28b8f8888bea9f`:

- Data build: passes; source audit covers 1,932 blocks, with 187 derived drafts withheld, 520 uncertain blocks and zero retained unsupported secondary citations.
- Focused Python: 22 passed, with a cache-write warning at `.pytest_cache/v/cache`; no permission repair attempted.
- Full `npm test`: content 19 and release 29 passed, then native SWC refused the existing cache owner.
- Authorized `npm run test:portable`: 200 files passed, 2,046 tests passed, four expected failures. Content and release gates retained.
- Final focused portable Vitest: 52 passed.
- Browser: ten checks passed against the existing 8931 preview; screenshots saved and representative desktop/narrow images inspected. This does not establish a freshly rebuilt source bundle.
- Full `npm run build`: **blocked in required prebuild**. `scripts/build-scholar-usage.py` received `PermissionError` writing `content/teachers/site-source-audit.json`. The operation stopped. No permission repair, portable gate bypass, replacement preview or deployment was performed.

The prior job's exact document-install manifest path was not present in the sequence report or supplied workspace. Its installation cannot be asserted without reading that manifest. The requested fresh build/preview acceptance and commit remain subject to their actual receipts; this document does not claim completed delivery.
