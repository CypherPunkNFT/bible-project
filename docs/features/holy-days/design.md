# Holy days calendar: design

Sequence 41, step 3 (orchestrator job 844), 2026-11-09. Idea: "Holy days calendar (Tools): dates for Easter, Lent,
Advent, Pentecost and the biblical feasts in any year" (BibleProject/PROPOSED-IDEAS.md). Brief: the dates for Easter
(Western and Orthodox), Lent, Advent, Pentecost and the biblical feasts for any year, computed in code, with a short
explanation and key passages for each.

## What the visitor sees

`/holy-days` (one page; the year is in the address as `?year=2027` so a link can be shared).

1. Heading **Holy days calendar** and one paragraph saying what it is (the page head reads it as the description).
2. A year control: previous year, a number box, next year, and "This year". Years 1583 (the first full year of the
   Gregorian calendar) to 9999. An out-of-range or non-numeric `?year=` falls back to this year, quietly.
3. "Coming up": the next holy day from today (the visitor's own date), with "in N days" (only when the year shown is
   this year).
4. A filter of three pressed buttons, all on by default: **Western churches**, **Orthodox churches**, **Biblical
   feasts**. Turning all off is not possible (the last one stays pressed).
5. The year's days in date order, grouped under month headings: weekday and date, name, a small tradition label, and
   for feasts that last several days the span ("8 days, to Thursday, December 12"). Each row is a button that opens
   its detail beneath it (one open at a time, `aria-expanded`): the short explanation, how the date is worked out, a
   note for the biblical feasts that the day begins at sunset the evening before, and two or three **key passages**
   whose Berean words load from the site's Berean files only when the row is opened (with Retry on failure), each
   linking to the reader at that verse.
6. A short closing note in the site's Baptist voice: Scripture does not command Christians to keep these days (Romans
   14:5–6; Colossians 2:16–17); the biblical feasts point to Christ (Hebrews 10:1); the Lord's Day is the first day of
   the week (Baptist Faith and Message, article VIII). Baptist churches keep Christmas and Easter; many keep Advent;
   keeping Lent is a personal choice in most. It does not choose among those practices.

About 24 rows a year: the long-list rule (about 50 rows rendered either side of view) does not come into play; all rows
are rendered.

## The days

Western churches (Gregorian Easter, Meeus/Jones/Butcher, already in `src/pages/countdowns/calendar.ts`, reused):
Epiphany (6 January), Ash Wednesday, the start of Lent (Easter − 46), Palm Sunday (− 7), Maundy Thursday (− 3), Good
Friday (− 2), Easter Sunday, Ascension Day (+ 39), Pentecost (+ 49), the first Sunday of Advent (the Sunday on or after
27 November), Christmas Day (25 December).

Orthodox churches (Julian Easter computed by the Meeus Julian method, then converted to the Gregorian calendar through
the Julian day number; correct for any year, not a fixed "+13 days"): Christmas in the churches that keep the Julian
calendar (25 December Julian, 7 January from 1901 to 2099), Clean Monday, the start of Great Lent (Pascha − 48),
Pascha (Orthodox Easter), Orthodox Pentecost (+ 49). Where the two Easters coincide, both rows show and the Orthodox
explanation says they fall together this year.

Biblical feasts (Leviticus 23, plus Purim in Esther 9 and the Feast of Dedication in John 10:22), on the Hebrew
calendar as fixed in the fourth century and used by Jewish communities today (computed with the arithmetic of
Reingold and Dershowitz, *Calendrical Calculations*: molad, the postponement rules, month lengths):
Purim (14 Adar; Adar II in a leap year), Passover (15 Nisan, the Passover meal the evening before) with the Feast of
Unleavened Bread (15–21 Nisan), Firstfruits (16 Nisan, the common Jewish reckoning; the explanation notes the reading
"the day after the Sabbath" as the Sunday in the feast, which ties it to the resurrection, 1 Corinthians 15:20),
the Feast of Weeks / Shavuot (6 Sivan), the Feast of Trumpets / Rosh Hashanah (1 Tishri), the Day of Atonement / Yom
Kippur (10 Tishri), the Feast of Tabernacles / Sukkot (15–21 Tishri), the Feast of Dedication / Hanukkah (25 Kislev,
eight days). Every row says the day begins at sunset the evening before, and the page notes that in Bible times months
began with the sighted new moon, so the fixed calendar can differ by a day or so.

**Drift:** the Hebrew calendar runs about a day every 216 years behind the Gregorian, so by the year 4000 Hanukkah
falls in January of the next year. For a Gregorian year Y the code computes each feast in Hebrew years Y + 3760 and
Y + 3761 and keeps every date inside Y, so no feast is lost or doubled at year ends.

## Files (all new, in the tool's own folders)

- `src/pages/holy-days/hebrew.ts`: Hebrew calendar arithmetic (no imports).
- `src/pages/holy-days/dates.ts`: Orthodox Easter, Julian conversion, and `holyDaysInYear(year)` returning
  `{ key, date, end?, tradition }[]` sorted by date. Imports only `countdowns/calendar.ts`.
- `src/pages/holy-days/days.ts`: per key: name, tradition, explanation (2–3 sentences), how the date is reckoned, key
  passages as verse ids (book × 1,000,000 + chapter × 1000 + verse; one chapter each). No verse wording is stored.
- `src/pages/holy-days/HolyDaysPage.tsx`, `DayRow.tsx`, `usePassages.ts` (Berean words through `resolveRange`, the
  way the sympathy pages do), `holy-days.css`, `art.tsx` (its own hub picture with the games' drawing kit, so the
  shared `tools/art/` files are untouched).
- Tests: `hebrew.test.ts` (fixed reference dates from an independent library, pyluach 2.2.0, for 20 years from 1583 to
  4000 including the years where the browser's own Hebrew calendar is wrong; weekday rules — Rosh Hashanah never on
  Sunday, Wednesday or Friday, Passover never on Monday, Wednesday or Friday, Yom Kippur never on Friday or Sunday —
  checked for every year 1583–9999), `dates.test.ts` (Western and Orthodox Easter against fixed dates from
  python-dateutil; every Easter a Sunday; offsets; Advent Sunday between 27 November and 3 December; every year
  1583–9999 gives each key exactly once or, for drifting feasts, as often as it falls in the year, all dates inside the
  year, sorted), `holy-days-page.test.tsx` (renders a year from the address, bad years fall back, the filter, opening a
  row loads and shows Berean words with the reader link, Retry on failure, every passage id resolves to Berean text).

Shared lines (one each, re-read just before editing, Edit only): a lazy import and `<Route path="/holy-days" …>` in
`src/App.tsx`; a title in `ROUTE_TITLES` (`src/lib/page-head.ts`); a live entry in `src/pages/tools/registry.ts` in
the **sharing** category (beside Countdowns, whose card already says "follow Advent and Lent together"), tone `acts`
(Pentecost), so it does not compete with the sisters' new study category. The tools test's fixed count of ten is
changed to "the ten approved tools are still there" only if no sister has already done so.

## Rules kept

No runtime AI; nothing stored and nothing sent (the only state is the year in the address); Berean words loaded from
the site's own Berean files, never typed in; dates through the countdowns' `site-format` helpers (`dateFormat` at UTC,
`plural` for "in N days" and "N days"), so the language nets stay clean; all English in page code, so `extract.py
--pages` collects it, with `page-register.json` for anything its rules skip; the English build check must pass. Doctrine:
the closing note follows the Baptist Faith and Message 2000 and shows, without choosing, the practices Baptists hold.
Preview only; never deployed.

## Review (three reviews before code, 2026-11-09)

Security and correctness, reliability, and edge cases were each reviewed once against the code. None found a critical
problem. What changed because of them (where this disagrees with the sections above, this wins):

- **Rows** are identified by `${key}:${dateKey(date)}` (React key, open state, `aria-controls`), because after about
  the year 4000 Hanukkah can begin twice in one Gregorian year; a test covers such a year. A row belongs to the year
  its first day is in; its last day may be in the next year and is then shown with its year. Same-day rows keep a
  fixed order (Western, Orthodox, feasts).
- **Orthodox Christmas** is 25 December of Julian year Y − 1 (4 January in 1583, 7 January 1901–2099, 8 January from
  2101); the reckoning text never says "7 January". Julian Easter: a = Y mod 4, b = Y mod 7, c = Y mod 19,
  d = (19c + 15) mod 30, e = (2a + 4b − d + 34) mod 7, month ⌊(d + e + 114) / 31⌋, day (d + e + 114) mod 31 + 1; Julian
  date → Julian day number → day number (JDN − 2440588). Checked against python-dateutil for every year 1583–4099.
- **Hebrew arithmetic** uses a non-negative `mod` and no bitwise operators (part counts pass 32 bits). Weekday tests:
  Rosh Hashanah only Monday, Tuesday, Thursday, Saturday; first day of Passover only Sunday, Tuesday, Thursday,
  Saturday; Yom Kippur only Monday, Wednesday, Thursday, Saturday. Drift is described as "about a day every two
  centuries". Checked against pyluach for every year 1583–9999 (the browser's own Hebrew calendar is wrong in some
  years, e.g. 1701, so tests use fixed reference dates, not `Intl`).
- **Wording:** Passover is the lamb at twilight on 14 Nisan (Leviticus 23:5); 15–21 Nisan is Unleavened Bread; the row
  is dated 15 Nisan as the Jewish calendar keeps it and says so. Tabernacles runs 15–22 Tishri with the eighth day
  (Leviticus 23:36, 39). Explanations describe traditions in the third person; no merit attached to Lent; Maundy
  Thursday speaks of the Lord's Supper as an ordinance; the Day of Atonement points to Hebrews 9–10. Closing note
  softened: "Many Baptist churches observe Christmas, Easter and Advent; some believers keep Lent and others do not."
- **The year:** `?year=` is read only as `/^\d{4}$/` within 1583–9999; anything else shows this year and is cleaned
  from the address (replace). The box keeps a draft and applies it on Enter or blur (replace); the arrows add a history
  entry and are `aria-disabled` at the ends; "This year" hides when this year is shown; the year is shown without a
  thousands separator; the open row closes when the year changes.
- **Coming up** follows the filter, uses the countdowns' `useToday` (midnight-safe), looks at last year's spans and
  next year's days: "today", "now, day 3 of 8", or "in N days"; a feast notes it begins at sunset the evening before.
- **Translation:** every sentence with a value is one template string or one `plural()` call; month headings and dates
  through `dateFormat` with `calendar: "gregory"` and UTC. The build check is run as soon as page files exist. This job
  does not run `english_build_check.py --shrink` or `extract.py --pages` (both rewrite shared files); `page-register.json`,
  `unregistered-reviewed.json` and `english-baseline.json` join the shared, Edit-only list.
- **Accessibility:** filter is a labelled `role="group"` of `aria-pressed` buttons with a polite "Showing x of y"; the
  last pressed one is `aria-disabled` with a hint; rows are `<h3><button aria-expanded aria-controls>`; loading in
  `role="status"`; logical CSS, wraps at 320px, arrows flip right to left; empty months left out.
- **Passages** reuse the countdowns' `showPassage`; each open row loads under `holy-days:<row id>:<attempt>`. The Retry
  test runs first in its file, before any Berean book is cached.
- **Tests** of the dates run in the node environment, collect failures into one array and assert once.
- **Tools test:** its count of ten becomes "the ten approved tools are all present" unless a sister has already done it.

## Built (2026-11-09, job 844)

Files as planned, in `src/pages/holy-days/` (hebrew.ts, dates.ts, days.ts, format.ts, DayRow.tsx, HolyDaysPage.tsx,
holy-days.css, art.tsx, dates.test.ts, holy-days-page.test.tsx), plus one line each in `src/App.tsx`,
`src/lib/page-head.ts` and `src/pages/tools/registry.ts` (category "sharing", tone "acts"). The tools test's count had
already been replaced by a sister job, so it was not touched.

**Translation registration.** Every text the page shows is registered by the ordinary page rules (`extract.py --pages`
collects it), so none needs a line in `page-register.json`, which is only for texts the rules pass by (the converter's
and word counter's one-word labels are there for that reason; this page has none). The proof is a test in the
translation folder, `content/translation/test_holy_days_texts.py` (run with `python -m pytest
content/translation/test_holy_days_texts.py -q`): it checks that the page's headings, buttons, labels and value-built
sentences, the closing note, and every holy day's name, explanation, reckoning and passage note are all in
`extract.page_strings()`, so a later rewording the rules would skip fails there instead of staying English. The shared
collection itself (`extract.py --pages`, which appends chunks to the separate SiteTranslation repository) is run by the
translation workstream, not by a feature job.

Learned while building:
- **Hanukkah can be missing from a year**, not only doubled: from about 3030 the drift carries it past 31 December
  (13 December 3030, then 1 January 3032, none in 3031). The page simply has no row; the test allows it after 3000.
- **"Coming up" prefers a day that begins today** over one already under way (Easter Sunday falls inside the week of
  Unleavened Bread).
- **What the translation collector skips** (checked with `extract.page_strings()`, which the build check does not
  catch): strings holding `\"` escapes, strings with a semicolon, templates led by a value or a "Word:" label, and very
  short quoted fragments. The page's sentences were reworded to avoid them (curly quotes, full stops, "Today is …",
  "Next comes …", "Lasts 8 days, until …"); every text of the page and of days.ts is now collected.
