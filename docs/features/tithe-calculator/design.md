# Tithe and giving calculator: design

Sequence 41, step 7 (orchestrator job 858), 2026-11-09. The idea: [PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md),
"tithe and giving calculator (browser only, nothing stored)". Brief: a tithe or any chosen percentage, by week, month or
year, from income entered; runs only in the browser; nothing is sent or stored.

## 1. Where it lives

- Address `/tithe-calculator`, one route in `src/App.tsx` (lazy import), a tab title in `src/lib/page-head.ts`.
- Its own folder `src/pages/tithe-calculator/` so the parallel tool builds never share a file:
  `giving.ts` (pure sums and parsing), `TitheCalculatorPage.tsx` (page), `Calculator.tsx` (form and result),
  `PercentTable.tsx` (other percentages), `Scripture.tsx` (what the Bible says, verses loaded on demand),
  `art.tsx` + `tithe-art.ts` (hub picture), `tithe-calculator.css` (`tc-` classes), `README.md`, tests.
- One entry in `src/pages/tools/registry.ts`: slug `tithe-calculator`, live, category `family` (household money),
  audiences families, churches, anyone, a tone no other tool in that category has (checked by the hub's test).

## 2. The sums (`giving.ts`)

- How often the income comes: `week` (52 a year), `two-weeks` (26), `half-month` (24), `month` (12), `year` (1).
- Yearly income = amount × times a year. Giving a year = yearly income × percent / 100.
  Giving a week = a year's / 52; a month = a year's / 12; each pay = a year's / times a year (shown only for
  every two weeks and twice a month, where it differs from week and month).
- A month is a twelfth of a year (about 4.33 weeks), so a month's figure is a little more than four weeks' giving; the
  page says so in one line.
- Parsing the amount (`parseAmount`): trims spaces and currency signs; accepts `1000`, `1,000`, `1,000.50`, `1.000,50`,
  `1 000`, `1000,5`. Rule: if both `.` and `,` appear the last one is the decimal mark; if one appears once and is
  followed by 1–2 digits it is the decimal mark, otherwise it groups thousands. Refuses empty, negative, zero,
  non-numbers, exponent notation, and more than 1,000,000,000,000 (returns null; the page shows a hint).
- Percentage (`parsePercent`): a number above 0 and at most 100, decimals allowed (12.5); otherwise null.
- Display: amounts through `formatNumber` (site language) with `style: "currency"` and the chosen currency;
  percentages through `formatNumber(p / 100, { style: "percent", maximumFractionDigits: 2 })`. Nothing calls Intl or
  toLocaleString directly (the build's language net refuses it). Rounding happens only at display.

## 3. The page (in the tools hub's look: games.css hero and numbered shelves, like /converter)

- Hero: "Tools" link back, h1 "Tithe and giving calculator", a lede, a jump list, the drawing.
- **01 Calculate.** Fields: Income (text, inputMode decimal), How often (select: every week, every two weeks, twice a
  month, every month, every year), Currency (select of 16 common currencies, default US dollar, plus "No currency
  sign"; option text is the code and its sign, `translate="no"`), Percentage (quick buttons 10% "a tithe", 5, 15, 20
  with aria-pressed, and a text field for any other). Results as the user types, in an `aria-live="polite"` region:
  each week · each month · each year (and each pay where it differs), and "of a yearly income of …". Before any income
  is typed it shows a short prompt, not zeros. An invalid field keeps the field's text, marks it `aria-invalid`,
  shows a hint and hides the result rather than showing stale numbers.
  A neutral note: whether to give from income before or after tax is a question Christians answer differently; type
  the figure you have decided on.
- **02 Other percentages.** A small table (5, 10, 12, 15, 20, 25%, plus the chosen one if not among them, marked as
  yours) with a week, month and year column each, from the same income. Six or seven rows: no row windowing needed.
- **03 What the Bible says about giving.** First the confession (BF&M 2000, article XIII, quoted exactly:
  "should contribute of their means cheerfully, regularly, systematically, proportionately, and liberally for the
  advancement of the Redeemer's cause on earth"), then the two readings Baptists hold (the tithe as the starting
  point; generous, proportionate giving without a fixed tenth), worded as in the site's generosity study, with no
  choice made, and what both agree on. No prosperity promise anywhere (doctrinal foundation, article 13).
  Then the passages as rows the reader opens (one button each, `aria-expanded`), each with a one-line note; opening
  one loads that verse from the Berean ("bsb", whatever the site language) via `resolveRange` in `src/lib/verses.ts`,
  with Loading, an error with Retry, and a "Read in context" link to `/read/bsb/<BOOK>/<ch>?hl=v-v`. Verses are
  stored as ids only (the build's verse-wording check forbids verse text in code):
  Genesis 14:20, Genesis 28:22, Leviticus 27:30, Malachi 3:10, Matthew 23:23, Mark 12:43–44,
  1 Corinthians 16:2, 2 Corinthians 8:12, 2 Corinthians 9:7, Acts 20:35.
- **04 Private by design.** Nothing typed leaves the browser: no address parameters, no browser storage, no
  cookies, no network request except the Berean verse files a reader chooses to open. Refreshing clears it.

## 4. Privacy (the brief's hard rule)

- Form values live in React state only. No `useSearchParams` writes, no `localStorage`/`sessionStorage`, no
  analytics. A test spies on `Storage.prototype.setItem` and `fetch` and checks the address stays `/tithe-calculator`
  while the user types.

## 5. Translation

- All English is written as JSX text, attributes (`aria-label`, `title`) or full sentences in quotes, the forms
  `content/translation/page_rules.py` collects. Option labels are JSX text, not data in a `.ts` file. One-word labels
  the collector passes by (if the build check names any) go in `content/translation/page-register.json` with a reason,
  as the converter and word counter did. Check: `python content/translation/english_build_check.py` exits 0.
- Book names in references come from the catalogue (already translated); verse text stays the English Berean
  (`lang="en"`).

## 6. Tests (vitest, `npm test`)

- `giving.test.ts`: every period's yearly factor; week/month/year/pay figures for 1,000 a week at 10%
  (100 / 433.33 / 5,200); 12.5%; parsing (`1,000.50`, `1.000,50`, `1 000`, `$1,000`, `1000,5`, refusals: "", "-5",
  "0", "abc", "1e3", over the cap); percent bounds (0, 100, 100.5, 12.5).
- `TitheCalculatorPage.test.tsx`: heading; prompt before income; typing 1000 weekly shows $100 / $433.33 / $5,200;
  changing to every month; the 15% button and a typed 12.5%; invalid income and percent hints with the result hidden;
  the other-percentages table; no storage writes, no fetch, address unchanged while typing; opening Malachi 3:10
  loads the Berean words (served from disk by `life-events/test-kit`) and links to the reader; Retry when it fails;
  the registry entry is live at `/tithe-calculator`.
- A data test reads `data/plain/bsb/*.json` and checks each verse id holds the word it is chosen for (tenth, tithe,
  give, income, cheerful), so a wrong id cannot slip in.

## 7. Not doing (YAGNI)

No saving, no printing, no charts, no tax calculation, no currency conversion, no "giving goal" tracking.

## 8. What the three reviews changed (2026-11-09)

Reviewed by a security and correctness pass, a reliability pass and an edge-case pass before any code was written.
- **Parsing made strict** (a misread could multiply a gift by 1,000): `0.500`, `.5` and `0,125` are decimals;
  thousands groups must be exactly three digits with one grouping sign throughout (`,` `.` space, no-break space,
  `'`), the decimal mark being the other sign; `1,0005`, `1,23,456`, `1.5.5` are refused. The one ambiguous shape,
  `1.234` / `1,234`, reads as 1,234, and the field always echoes what it read ("Read as 1,234.00").
- **Percent** accepts `12,5` and a trailing `%`; shown with up to 2 decimals, typed with at most 2 (more is refused).
- **No form element** (Enter can never put the income in the address); inputs have no `name`, `autoComplete="off"`,
  `dir="ltr"`.
- **Screen readers:** the figures are not a live region; one `role="status"` sentence, present from the start, is
  updated after typing pauses (700 ms).
- **Quick percentages:** a labelled group of `type="button"` buttons with `aria-pressed`; the percentage field is
  the one source of truth (a button writes into it; a typed value presses the matching button or none). 10% is
  labelled "a tenth", and the table does not single it out unless it is the chosen percentage.
- **Currency:** the currency's own decimals (yen none); "No currency sign" is a plain number with two decimals; a
  code the browser refuses falls back to that. Figures sit in `<bdi>` for right-to-left pages; long figures wrap.
- **Rounding** is stated: each figure is rounded on its own, so twelve months may differ from the year by a cent.
- **Passages:** one open at a time, retry counter per row, empty text shows the reference and link only. The privacy
  shelf says opening a passage asks this site for that book's Berean file, which carries nothing typed.
- **Hub:** tone chosen after re-reading registry.ts at edit time; unique Scene and alt; single-line Route.
- PercentTable folded into Calculator.tsx.
