# Bible twenty questions: the tagging build

How the game file for `/games/twenty-questions` is made (design:
[docs/features/twenty-questions/design.md](../../docs/features/twenty-questions/design.md), sections 3–6). Everything
here runs on this PC by hand; none of it runs in the site's build, and none of it calls a paid service.

## The hand-kept files

| File | What it holds |
|---|---|
| [tags.source.json](tags.source.json) | The 92 questions: id, section, everyday or detail, the question as asked, which other questions a yes implies or excludes. |
| [pool.source.json](pool.source.json) | The 298 people, their display labels and tier (1 = well known, 2 = the rest). Made once by [tq_pool.py](tq_pool.py). |
| [story.source.json](story.source.json) | The hand-written values for the story, place and book questions: per question, who is yes (with the verse that shows it), no or unsure, and the default rules for everyone not listed. |
| [jesus.source.json](jesus.source.json) | Every value for Jesus, set by hand only (design §3.4), including "doesn't really apply". |

Values for sex, era, nation, tribe, role and family come from the site's own data ([tq_data.py](tq_data.py)): the
people list, the people pages' rulers, and the odd-one-out facts.

## Rebuilding

```
python scripts/twenty-questions/tq_build.py
node --experimental-strip-types scripts/twenty-questions/check.ts
```

`tq_build.py` checks every hand verse names the person (or is marked `(context)` for first-person and narrated
passages), and writes:

- `src/data/twenty-questions/twenty-questions.json` (shipped) and `twenty-questions-evidence.json` (shipped, loaded
  only on result screens), with a new `version` whenever anything changes;
- [server/twenty-questions-ids.ts](../../server/twenty-questions-ids.ts), the report endpoint's allow-list;
- [tagged.json](tagged.json) (every value with its source, not shipped) and [build-notes.json](build-notes.json).

`check.ts` runs design §5.5's checks and the play simulation, rewrites
[docs/features/twenty-questions/review-sheet.md](../../docs/features/twenty-questions/review-sheet.md), and exits 1 while
any check fails. Today it does fail: the hand values leave many pairs of people that no question separates, so the
simulation is below the design's targets. That is listed in the review sheet. `npm test` holds the current figures as
a floor (`FLOORS` in [data.test.ts](../../src/pages/games/twenty-questions/data.test.ts)); raise them when the tags
improve.

## Not built yet

- The two-pass model tagging of design §5.3–5.6 (BatchRunner, cheapest model first, one call per person), which would
  replace most "unsure" values. It needs the owner's yes on its cost first.
- `learn.ts` (design §10.4), which turns exported reports into proposed changes. It needs reports, so it waits until
  the migration is applied at release and players have sent some.
