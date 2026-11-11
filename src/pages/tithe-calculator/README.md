# Tithe and giving calculator

`/tithe-calculator`, on the tools hub as **Tithe and giving calculator** (Family and life events). A tithe, or any
percentage, of an income typed in, by week, month and year. Built for sequence 41, step 7 (orchestrator job 858,
2026-11-09); the idea is in `BibleProject/PROPOSED-IDEAS.md`, the design and its three reviews in
[docs/features/tithe-calculator/design.md](../../../docs/features/tithe-calculator/design.md).

## How it works

- **Nothing is sent or stored.** What is typed lives in the page's React state only: no form element, no field
  names, nothing in the address, no browser storage, no cookies. Reloading clears it. The only request the page makes
  is for a book of the Berean when a reader opens one of the passages.
- **The sums** ([giving.ts](giving.ts)): income × times a year (week 52, every two weeks 26, twice a month 24, month
  12, year 1) × percent. A month is a twelfth of a year (about 4.33 weeks). Each pay is shown only for every two
  weeks and twice a month. Amounts are written in the site's language with the chosen currency's own decimals.
- **Reading what is typed is strict**, because a misread separator would multiply a gift by a thousand: groups of
  exactly three digits with one grouping sign, the decimal mark a different sign; `0.500` is a half, `1.234` is
  1,234, `1,0005` is refused. The field echoes what it read ("Counted as $1,234.00").
- **What the Bible says**: the Baptist Faith and Message's article XIII, the two readings Baptists hold on the tithe
  (worded as the site's generosity study words them) without choosing, and ten passages as verse ids
  ([passages.ts](passages.ts)), loaded from the Berean on opening with the converter's verse helpers
  (`src/pages/converter/verse.ts`). No prosperity promise is made anywhere.

| File | What is in it |
|---|---|
| [TitheCalculatorPage.tsx](TitheCalculatorPage.tsx) | The page: hero, the four shelves, the privacy text. |
| [Calculator.tsx](Calculator.tsx) | The fields, the figures, the status sentence for screen readers, the other-percentages table. |
| [Scripture.tsx](Scripture.tsx) | The confession, the two readings, the passage rows. |
| [giving.ts](giving.ts) | Sums, parsing and formatting (pure). |
| [passages.ts](passages.ts) | The passages, as verse ids and one-line notes. |
| [art.tsx](art.tsx), [tithe-art.ts](tithe-art.ts) | Its picture on the tools hub, in the history colour. |
| [tithe-calculator.css](tithe-calculator.css) | Its styles (`tc-` classes). |

## Translation

All its words are JSX text, attributes or whole template sentences, the forms `content/translation/extract.py
--pages` collects (checked: every sentence on the page is in its list, and `english_build_check.py` names nothing
here). Verse text stays the English Berean (`lang="en"`); currency codes are `translate="no"`.

## Checks

`npm test` runs [giving.test.ts](giving.test.ts) (the sums, parsing and its refusals, currency decimals, and each
passage id against the real Berean files) and [TitheCalculatorPage.test.tsx](TitheCalculatorPage.test.tsx) (figures as
the reader types, periods, currencies, quick and typed percentages, hints, the table, the status sentence, no fetch,
storage, cookie or address change while typing, a passage loaded and Retry, the registry entry).
