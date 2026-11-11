# Reading planner — design

**Status:** designed and built in step 2 of sequence 41 ("Bible Guide: build 12 tools"), 2026-11-09 (orchestrator job 843).
**Spec:** [PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md), "Reading planner (Tools; plan generator and reading time in
one tool)": pick a time span (start and finish dates) or a set of books, and a pace (pages, chapters or minutes per day);
it builds a daily plan, shows the time per day and for the whole plan, prints, and exports to a calendar (.ics). Progress,
if kept, stays in the browser only.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) ·
[tools README](../../../src/pages/tools/README.md). No runtime AI, no accounts, nothing sent anywhere.

## 1. What it is

One page, **/reading-planner**. The visitor answers three questions and sees the plan update as they go:

1. **What to read:** the whole Bible (default), the Old Testament, the New Testament, or books they tick (a grid of the
   66 books grouped by the site's sections, with "select all in this section" buttons).
2. **How to plan it** (two tabs):
   - **Finish by a date:** a start date (default today) and a finish date (default a year on). The planner spreads the
     reading evenly over the reading days in that span and reports the pace it works out to.
   - **Read at my own pace:** a start date and a pace, in **chapters**, **minutes** or **pages** per day (a number, 1 to
     999). The planner works out how many days that takes and the finish date.
3. **Reading days and speed** (a quieter row): which days of the week they read (all seven by default; at least one must
   stay ticked), and their reading speed in words per minute (150, 200 default, 250 or 300: "slow and careful",
   "unhurried", "steady", "quick").

Below the form: the **summary** (reading days, finish date, about how long each day takes, chapters and pages a day on
average, the whole plan's reading time), then the **day list**: one row per reading day with its date, its chapters
("Genesis 1–3", "Genesis 50 – Exodus 2") linking to the reader at the first chapter, and its time ("about 12 min").

Actions: **Print** (a clean sheet of the whole plan with a tick box per day), **Add to calendar** (an .ics file, one
all-day event per reading day) and **Keep track of my progress** (see 4).

## 2. The numbers

- **Words per chapter** are counted once from the Berean Standard Bible text the site already ships
  (`data/plain/bsb/<BOOK>.json`) by [scripts/build-reading-planner-words.mjs](../../../scripts/build-reading-planner-words.mjs)
  and stored in `src/data/reading-planner/chapter-words.json` (66 books in canonical order, each an array of word counts,
  about 8 KB). A word is a run of letters or digits, apostrophes kept inside it. A test checks the file covers every
  book and chapter of the catalogue and that the counts are rebuilt identically from the text.
- **Minutes** = words ÷ reading speed. 200 words a minute is the default: studies of silent reading put the adult
  average near 238 for ordinary prose (Brysbaert, 2019); Scripture is read more slowly. Shown rounded: under a minute
  reads "under 1 min", otherwise whole minutes; totals over an hour as hours and minutes.
- **A page** is 500 words, about one page of a typical printed Bible (an English Bible of roughly 780,000 words runs
  near 1,500 pages). The page says so beside the pace.
- **Chapters are never split.** A day holds whole chapters. That keeps plans readable and matches every published plan.

## 3. Building the plan (pure functions, `planner.ts`, no imports from React)

Input: the chosen chapters in canonical order with their word counts, the reading days (a set of weekdays), the start
date, and either a finish date or a pace.

1. **Reading dates.** From the start date, walk forward and keep the dates whose weekday is ticked.
2. **How many days (D).**
   - Finish by a date: D = the number of reading dates from start to finish inclusive. If D exceeds the chapter count,
     D = the chapter count (one chapter a day; the summary says the plan finishes early).
   - Pace in chapters: D = ⌈chapters ÷ pace⌉. Pace in minutes: D = ⌈total minutes ÷ pace⌉. Pace in pages:
     D = ⌈total words ÷ (pace × 500)⌉. Then capped at the chapter count as above.
   - D is capped at 3,660 days (ten years of daily reading); beyond it the form says the pace is too slow.
3. **Splitting.** Chapters per day by count (pace in chapters) or by words (everything else). Both use the same
   balanced split: chapter *i* goes to day ⌊(words before *i* + half its words) ÷ (total ÷ D)⌋, clamped to D − 1, with
   weights 1 per chapter when splitting by count. This is monotonic (days never go backwards), so every day is a
   contiguous run of chapters. A very long chapter (Psalm 119) can leave a following day empty; empty days are then
   given the next chapter by a single fix-up pass that moves boundaries forward, and if D still cannot be filled the
   plan simply has fewer days (the summary reports the real count and finish date).
4. **Labels.** A day's range is "Book a–b" within one book, "Book a – Book b" across books, "Book a" for one chapter;
   one-chapter books (Obadiah, Philemon, 2 and 3 John, Jude) read as the book alone. Book names come from the site's
   catalogue (translated like every other book name on the site).

Errors the form shows in plain words, never a broken plan: no books chosen; finish date before start; no reading days
ticked; a pace that is not a whole number from 1 to 999; a plan longer than ten years.

## 4. Progress (browser only)

- Nothing is saved until the visitor presses **Keep track of my progress**. Then the plan's settings (books, mode,
  dates, pace, days, speed) and the days ticked as read are saved in this browser's local storage under
  `bp-reading-planner` (version 1). Nothing is sent to the server; there are no cookies and no account. The page says so
  next to the button.
- While a plan is kept, the page opens on it: the form is folded away behind **Change plan**, each day row has a "Read"
  tick box, the summary shows "12 of 365 days read", and a "Next day to read" link jumps to the first unticked day.
  No streaks and no "you are behind" message.
- **Change plan** opens the form; saving a different plan asks first ("This replaces your saved plan and its ticks")
  because ticks belong to a particular split. **Stop tracking** clears the saved plan from this browser.
- Reading is defensive: the stored value is rebuilt field by field and anything malformed is dropped, so damaged storage
  cannot break the page; a browser that refuses storage (private window) keeps working, with a note that progress
  cannot be kept here. Other tabs stay in step through the `storage` event.

## 5. Print

**Print** draws the whole plan (every day, not just the windowed rows) into the site's print portal
([PrintPortal.tsx](../../../src/pages/life-events/PrintPortal.tsx) with `usePrintSheet`, letter or A4 from the browser's
language) as a compact table: tick box, date, chapters, minutes, in two columns on a page for long plans. Heading: what
is read and the dates; footer: "Bible Guide · bibleguide.io/reading-planner". In an in-app browser that cannot print
(`canPrint`), the button is replaced with a note to open the page in the phone's browser.

## 6. Calendar file

**Add to calendar** downloads `bible-reading-plan.ics`, built in the browser: one all-day event per reading day, with
the summary "Bible reading: Genesis 1–3", a description with the time ("about 12 min") and the reader link
`https://bibleguide.io/read/bsb/GEN/1`, `TRANSP:TRANSPARENT`, no alarms. Each event's UID is stable for the same plan
(`<plan signature>-<day number>@bibleguide.io`), so importing twice updates instead of doubling. Text escaping and
line folding reuse the countdowns' RFC 5545 helpers ([ics.ts](../../../src/pages/countdowns/ics.ts)); dates use the
countdowns' calendar-date arithmetic ([calendar.ts](../../../src/pages/countdowns/calendar.ts)), so daylight saving and
month ends cannot shift a day. Plans are capped at ten years, so the file stays small (a year is about 120 KB).

## 7. Long lists

The day list can run to hundreds of rows. It uses the site's `useRowWindow` (about 50 rows drawn above and below the
visible area, the rest released, no "load more" button), exactly as the baby-names list does.

## 8. Translation

All English is plain text in the page code (`src/pages/reading-planner/`), which the translation collector reads with the
rest of the site. Counts go through `plural()`, dates through the site's `dateFormat`, numbers through `formatNumber`,
and no sentence is built from pieces around a value, so the English build check and its language nets find nothing new.
The page title is added to `ROUTE_TITLES` in [page-head.ts](../../../src/lib/page-head.ts). The calendar file and the
printed sheet are written in the page's language where they reuse on-screen text.

## 9. Files

| File | What |
|---|---|
| `src/pages/reading-planner/ReadingPlannerPage.tsx` | The page: form, summary, actions |
| `src/pages/reading-planner/DayList.tsx` | The windowed day list |
| `src/pages/reading-planner/PlanSheet.tsx` | The printed sheet |
| `src/pages/reading-planner/planner.ts` | Building the plan (section 3) |
| `src/pages/reading-planner/text.ts` | Durations, ranges, dates in words |
| `src/pages/reading-planner/plan-ics.ts` | The calendar file (section 6) |
| `src/pages/reading-planner/storage.ts` | Progress in this browser (section 4) |
| `src/pages/reading-planner/reading-planner.css` | Its styles (prefix `rp-`) |
| `src/pages/reading-planner/*.test.ts(x)` | Tests (section 10) |
| `src/data/reading-planner/chapter-words.json` | Words per chapter (section 2) |
| `scripts/build-reading-planner-words.mjs` | Rebuilds that file |
| Shared, one line each | `src/App.tsx` (route), `src/lib/page-head.ts` (title), `src/pages/tools/registry.ts` (entry), `src/pages/tools/art/` (its picture) |

## 10. Tests

- **planner:** reading dates skip unticked weekdays; finish-by-date uses exactly the reading dates in range; each pace
  unit gives the expected day count; the split is contiguous, covers every chapter once, in order, and is balanced
  (no day over twice the target unless it is a single chapter); empty-day fix-up; caps (chapter count, ten years);
  every error case.
- **text:** range labels within a book, across books and for one-chapter books; durations (under a minute, minutes,
  hours and minutes).
- **ics:** CRLF line ends, folded lines, one VEVENT per day with consecutive all-day dates, stable UIDs, escaping.
- **storage:** round trip; malformed values dropped; storage that throws.
- **data:** the words file covers the catalogue's 66 books and 1,189 chapters; recount from the text matches.
- **page:** renders with defaults (whole Bible, finish in a year), switching to pace mode and changing the unit updates
  the summary; choosing books; errors shown; Add to calendar produces a download; Keep track saves to local storage and
  a reload shows the kept plan with ticks; the day list draws a window, not every row.
- **tools registry:** the existing checks cover the new live entry (its route must exist in App.tsx).

## 11. Review (three cycles before code, 2026-11-09) and what changed

Security and correctness, reliability, and hardening reviews read this design against the code it reuses. Where this
section and the sections above disagree, this section is what was built.

- **The split guarantees exactly D non-empty days.** Each chapter's day is the balanced choice clamped to "the previous
  chapter's day or the next one, and late enough that the chapters left can fill the days left", in integer arithmetic.
  The "fix-up pass" and "fewer days" fallback are gone. The Psalms over 150 days give one psalm a day (tested).
- **A chapter pace is kept exactly** (4 a day gives 4, 4, … and the remainder last). Minutes and pages are averages; the
  summary shows the longest day and says when days run over the pace because a chapter is never split.
- **D is at most the chapter count (1,189)**, so the ten-year limit is on the calendar span (finish no later than ten
  years after the start, and never past 2200), checked before any dates are walked. New error: "None of your reading
  days fall between these dates".
- **Progress is simpler:** no separate "keep track" step. Ticking a day saves the plan's settings and ticks; ticks show
  only on the identical plan (a fingerprint of its days and chapters), changing a setting and back brings them back, and
  ticking a different plan asks before replacing the saved one. "Forget my saved plan" clears it; "Open my saved plan"
  appears when the form shows a different plan. Storage is the countdowns' pattern: rebuilt field by field, dropped whole
  if any setting is wrong, read inside a try, re-read before each write, kept in step across tabs.
- **No sentence is pieced around a value.** The summary is label and value pairs ("Days read" / "12 / 365"); times use
  the browser's unit formatting through the site's `formatNumber` and `formatList`; counts in sentences go through
  `plural()`; one-word speed names sit under `label:` so the collector reads them. The English build check reports
  nothing new.
- **The calendar file has its own small builder** (`plan-ics.ts`, its own PRODID and a description holding the time and
  link) and reuses only the countdowns' escaping and folding, so the countdowns' file is untouched. Event ids depend on
  the books and the start date, not the pace, so re-importing after changing the pace updates rather than doubles.
- **Print** mounts the full sheet only after Print is pressed and removes it after printing.
- **"Next day to read"** scrolls by the row window's own offsets, so it works when the row is not drawn.
- **Registration:** the tools hub gained a "study" category from a sister job (sequence 41 step 1); the planner sits
  there in the poetry colour. Its picture is in [art.tsx](../../../src/pages/reading-planner/art.tsx), handed to the
  registry by [planner-art.ts](../../../src/pages/reading-planner/planner-art.ts). The page is in the design-review
  inventory ([site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts)), so it reaches the sitemap.
- **The word counter** lives in [scripts/reading-planner-word-count.mjs](../../../scripts/reading-planner-word-count.mjs)
  (not under `src/`, so it is not page code); `node scripts/build-reading-planner-words.mjs --check` is what the data test
  runs. The 66 books hold 1,189 chapters and 726,040 words, about 1,450 of the planner's pages.
