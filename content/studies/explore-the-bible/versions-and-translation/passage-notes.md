# Passage notes — Versions and translation

2026-10-13. Reader draft: [content.md](content.md). Local source: `data/plain/{kjv,asv,web}/`. Quotations retain the stored text. Excerpts in the comparison table are identified as excerpts.

## Full-verse quotation register

| Section | Verse | Local KJV record |
| --- | --- | --- |
| 01 | 1 Corinthians 13:4 | 1CO.json, 13:4 |
| 02 | 1 Thessalonians 4:15 | 1TH.json, 4:15 |
| 03 | Luke 1:4 | LUK.json, 1:4 |
| 04 | Nehemiah 8:8 | NEH.json, 8:8 |
| 05 | Philippians 1:27 | PHP.json, 1:27 |
| 06 | 2 Timothy 3:17 | 2TI.json, 3:17 |

## Comparison checks and limits

- 1 Corinthians 13:4: KJV charity/ASV love/WEB love; KJV and ASV suffereth long/WEB is patient. Read the complete chapter for its account of love. This does not prove a global superiority claim.
- 1 Thessalonians 4:15: KJV prevent/ASV precede, with the exact ASV phrase checked locally. Verses 13–18 establish the paragraph's concern. No unsupported etymology or comprehensive word history is asserted.
- Philippians 1:27: all three opening excerpts checked verbatim against local records. The interpretation of conversation is supported by the compared wording and the shared-conduct context. Read through 1:30.
- 2 Timothy 3:14–17: retain KJV as the quoted anchor. The ASV rendering of 3:16 differs in syntax and would require a fuller treatment than this introductory comparison; do not quietly substitute it or claim every difference is modernization.
- Luke 1:1–4 concerns Luke's writing, not a modern translation's credentials. Nehemiah 8:8 concerns public reading and understanding, not a prescription for a particular modern translation method. Neither is offered as proof of publisher authority.

## Primary external sources consulted

1. [WEB preface](https://ebible.org/engwebp/FRT01.htm), accessed 2026-10-13: project-described relation to ASV, contemporary style and note abbreviations. Used narrowly and attributed. Do not inherit its disputed historical anecdotes or theological judgments as independently verified conclusions.
2. [WEB edition page](https://ebible.org/engwebp/), accessed 2026-10-13: identifies the 66-book edition and related variants. Local import mapping uses `engwebp` for slug `web`.
3. [WEB FAQ](https://ebible.org/eng-web/webfaq.htm), accessed 2026-10-13: supplementary edition distinctions. Its use of WEBC means Catholic Edition, whereas the local catalogue uses WEBC for Classic with Deuterocanon. Use full names and source IDs; these abbreviations must not be silently equated. No site correction is part of this content-only task.

The preface-derived exposition is deliberately limited. Local verse excerpts are sourced from the repository snapshot, not claimed to have been compared against every current publisher file.

## Local resources inventoried

| Resource | Finding and reuse |
| --- | --- |
| `src/pages/VersionsPage.tsx` | Existing edition table, source credits and descriptions of text-only downloads; reuse the distinction between verse text and accompanying material, without treating its legal statements as newly audited |
| `data/catalog.json` | Selected entries inspected: KJV 80 book-code entries, ASV 66, WEB 66, local WEBC 81; these are dataset coverage counts, not a ruling about canon or every historical edition |
| `scripts/bible/translations.py` | Confirms `web` source mapping through WEB/engwebp and Classic through WEBC/eng-web |
| `src/lib/numbering.ts` | Existing numbering labels; no claim that all editions align verse for verse |
| `src/pages/ChartsPage.tsx` | Previously inspected edition timeline and coverage distinction; no new charts commissioned |

Catalogue years were inspected as metadata only. The exact revision/source history of the local KJV text remains unresolved; the draft explicitly avoids treating 1611 as proof of a facsimile transcription. No Josephus material is used.
