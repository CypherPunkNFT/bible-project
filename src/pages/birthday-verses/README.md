# Birthday verses (`/birthday-verses`)

A verse for every date of the year, each with its own page, a picture card and a text message to send a friend on
their birthday. Design and decisions: [docs/features/birthday-verses/design.md](../../../docs/features/birthday-verses/design.md).
The 366 choices live in the occasion verse picker's one list,
[birthday-by-date.ts](../../data/occasion-verses/birthday-by-date.ts); the cards are drawn by the shared generator
([src/lib/verse-card/](../../lib/verse-card/README.md)), unchanged.

| File | What it does |
|---|---|
| [BirthdayVersesPage.tsx](BirthdayVersesPage.tsx) | The routes: hub, `/birthday-verses/march`, `/birthday-verses/march-16`; other spellings ("mar-16", "03-16", "16-march", "Mar") move to the official address, anything else opens the hub with a note |
| [Hub.tsx](Hub.tsx) | The date chooser, Today, how the verses were chosen, the year as 12 month blocks of 366 links, more for birthdays |
| [MonthPage.tsx](MonthPage.tsx) | One row per date: the date, its reference and its note (no verse words loaded) |
| [DatePage.tsx](DatePage.tsx) | Heading, lead line, the verse from the Berean chapter file, where its number comes from, the verses around it, the card, the message, the dates around it; a chapter that fails keeps everything but the card |
| [DateChooser.tsx](DateChooser.tsx) | Month and Day selects (29 days for February always); also used by the picker's date field |
| [BirthdayDateField.tsx](BirthdayDateField.tsx) | "Your verse for your birthday" inside the occasion picker's Birthday occasion |
| [MessageBox.tsx](MessageBox.tsx), [message.ts](message.ts) | The text message: optional name (40 characters, never stored or put in an address), Share, Copy message, Email, Text message on phones |
| [dates.ts](dates.ts) | Addresses and the calendar, re-exported from [src/data/birthday-verses/](../../data/birthday-verses/index.ts) (which the sitemap and release scripts read), plus `birthdayUrl` and today's date |
| [verse.ts](verse.ts), [card.ts](card.ts), [format.ts](format.ts) | A date's passage, heading, lead line and "where the number comes from" line; its card; dates as words at UTC midnight in 2024 |
| [birthday-verses.css](birthday-verses.css) | `bv-` styles |

A date is a month and a day ("03-16"), never a moment: nothing turns it into a time in the visitor's time zone, and
only the hub's "Today" reads the visitor's clock. Which kind of match a date has (chapter and verse, the other way
round, or chosen) is computed from the reference by `matchKind`, never stored.

## Translation

Every on-screen sentence is one template string (the English check finds no pieced sentences); dates go through the
site's `dateFormat`. Verse words stay the Berean (`lang="en"`, `translate="no"`). The 366 notes are English data that
the site's translation system collects like any other feature's.

## Release copies and preview pictures

[scripts/birthday-verses/pages.ts](../../../scripts/birthday-verses/pages.ts) builds the ready-made copies of all 379
pages (the hub's copy leaves out Today); [previews.mjs](../../../scripts/birthday-verses/previews.mjs) writes them into
a prepared release folder with each date's preview card (`cards/birthday/v1/<month>-<day>.png`, wide, Paper, "Happy
birthday", never a visitor's line). Run it before the site's copy step. It is not yet part of the release preparation:
that is one line, added at the next release the owner approves.

Measured locally on 2026-11-10 with `bun scripts/birthday-verses/previews.mjs <folder> --dates 03-16,02-29,07-31`:
13 hub and month pages and 3 date pages and pictures in 2.0 seconds; pictures 105 to 109 KB (limit 300 KB). At that
rate all 366 should take a few minutes.

## Checks

- [birthday-data.test.ts](birthday-data.test.ts): the 366 choices against the design's rules (one per date, no overlaps,
  1–3 verses and at most 300 characters, at most 24 chosen, the ruled-out verses, the year's balance, notes, lead lines,
  and every card fitting all four sizes even with a full 60-character line of the visitor's own).
- [dates-message.test.ts](dates-message.test.ts): addresses, the calendar, the number lines and the message.
- [birthday-pages.test.tsx](birthday-pages.test.tsx): the three pages, Today with fixed clocks, the forgiving addresses,
  29 February, a failed chapter, and that a typed name or line never reaches the address.
- [picker-date-field.test.tsx](picker-date-field.test.tsx): the picker's date field.
- [release-pages.test.ts](release-pages.test.ts): the 379 copies, their pictures, and that their English matches the pages'.

## Choosing the verses

[scripts/birthday-verses/shortlist.ts](../../../scripts/birthday-verses/shortlist.ts) lists every date-matched and
flipped candidate that passes the mechanical rules ($0, seconds). The 366 were then chosen by reading the shortlist,
preferring verses the site's own lists already use; the model ranking step the design planned was not run (no owner
approval for it was on record). To change a date's verse, edit its one line and move the preview version to `v2`.
