# Blessings for the Home (`/blessings`)

The hub and eight pages of blessings, graces and bedtime prayers, each ready to copy, send or print. Design:
[design.md](../../../docs/features/home-blessings/design.md).

## Where things are

- **Words:** [src/data/home-blessings/](../../data/home-blessings/). One file per group ([house.ts](../../data/home-blessings/house.ts),
  [table.ts](../../data/home-blessings/table.ts), [children.ts](../../data/home-blessings/children.ts),
  [scripture.ts](../../data/home-blessings/scripture.ts)), the older texts in [older.ts](../../data/home-blessings/older.ts),
  and hub order, print limits and addresses in [index.ts](../../data/home-blessings/index.ts). Verse wording is never stored:
  every verse is a passage built with `sp()` and loads from the Berean files when the page opens.
- **Pages:** [BlessingsPage.tsx](BlessingsPage.tsx) (routes), [Hub.tsx](Hub.tsx), [BlessingPage.tsx](BlessingPage.tsx),
  [ItemPanel.tsx](ItemPanel.tsx) (one item of any kind), [RoomByRoom.tsx](RoomByRoom.tsx) (the walking order),
  [PrintChooser.tsx](PrintChooser.tsx) (one item, or "Print a set"), [SendPanel.tsx](SendPanel.tsx).
- **Print:** [useBlessingPrint.tsx](useBlessingPrint.tsx) draws a [print-job.ts](print-job.ts) into the shared print portal;
  the five layouts are in [sheets/](sheets/).
- **Copy and send text:** [message.ts](message.ts). Typed names stay in component state only.

## Adding or changing words

- **A written blessing or grace:** add an item to its page's file, with 1–6 verses in `rootedIn` and only the layouts its
  length fits. The data test checks words, tone, verses and print limits, and tells you which limit an item breaks.
- **An older text:** check it word for word against a printing from before 1931, store it exactly as printed (old
  spellings get a gloss, never an edit), fill in `checkedAgainst` with the URL, the printing's year and the check date, and
  add its sha256 checksum (lines joined with `\n`) to `CHECKSUMS` in
  [home-blessings-data.test.ts](../../data/home-blessings/home-blessings-data.test.ts). Register it in
  [SOURCES.md](../../../SOURCES.md).
- **A new page:** one entry in a group file, its slug in `HUB_ORDER` and its layouts in `PAGE_LAYOUTS`. The sitemap,
  hub and tests pick it up.

## Tests

[home-blessings-data.test.ts](../../data/home-blessings/home-blessings-data.test.ts) (words, verses, older texts, print
limits, links), [pages.test.tsx](pages.test.tsx), [sheets.test.tsx](sheets.test.tsx) and [message.test.ts](message.test.ts).

## Not here yet

Scripture items will get a "Make a picture" button once the shared verse-card generator is committed (design 8.2).
