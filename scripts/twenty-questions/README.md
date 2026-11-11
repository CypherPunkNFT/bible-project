# Bible twenty questions: the tagging build

How the game file for `/games/twenty-questions` is made (design:
[docs/features/twenty-questions/design.md](../../docs/features/twenty-questions/design.md), sections 3–6). Everything
here runs on this PC by hand; none of it runs in the site's build. The model passes run through the workspace's BatchRunner
on the owner's Max plan, never through a metered key.

## The hand-kept files

| File | What it holds |
|---|---|
| [tags.source.json](tags.source.json) | The 94 questions: id, section, everyday or detail, the question as asked, which other questions a yes implies or excludes. |
| [pool.source.json](pool.source.json) | The 354 people (design §3.1's rule plus the hand additions and named drops in [tq_pool.py](tq_pool.py)), their display labels and tier (1 = well known, 2 = the rest). |
| [corrections.source.json](corrections.source.json) | Hand fixes of values the site data gets wrong (each with a reason; a stale one fails the build) and the hand slip list. |
| [jesus.source.json](jesus.source.json) | Every value for Jesus, set by hand only (design §3.4), including "doesn't really apply". |
| [model/](model/) | The two passes' task prompts ([task.A.md](model/task.A.md), [task.B.md](model/task.B.md)), the resolver's ([task.resolver.md](model/task.resolver.md)) and the output [schema.json](model/schema.json). |

## The value chain ([tq_chain.py](tq_chain.py))

For each person and tag, in order: Jesus's hand file; a hand correction; a final yes or no from the site's data
([tq_data.py](tq_data.py): sex, era, nation, tribe, offices, family, books named in, reigns, and the era closures such as
"no Old Testament person met Jesus"); otherwise the model's merged value ([model.values.json](model.values.json)); otherwise
unsure. The model is only ever asked the tags the earlier stages leave open (about 43 per person).

## The model run (design §5.3–§5.6)

```
py -3.12 scripts/twenty-questions/tq_items.py BATCH_DIR [--pilot]      # one item per person per pass
python <BatchRunner>/batch_runner.py --task model/task.A.md --items BATCH_DIR/items-A --out BATCH_DIR/out-A --pilot 3 --model haiku --schema model/schema.json
python <BatchRunner>/batch_runner.py ... --budget-usd X --detach         # then the same for pass B
py -3.12 scripts/twenty-questions/tq_merge.py BATCH_DIR                  # -> model.values.json; refuses while a pass is incomplete
py -3.12 scripts/twenty-questions/tq_resolver.py BATCH_DIR               # items for the yes-against-no disputes
python <BatchRunner>/batch_runner.py --task model/task.resolver.md --items BATCH_DIR/resolver-items --out BATCH_DIR/out-resolver --model sonnet ...
py -3.12 scripts/twenty-questions/tq_merge.py BATCH_DIR                  # again: applies the resolver's answers
```

Each item carries the label, brief, the site's story, the settled data values, up to 150 BSB verses (every book the person
is named in is represented) and the open tags with the values the model may give. Pass B reverses the book order and
shuffles the tags. The merge ([tq_merge.py](tq_merge.py)): agree stands; one unsure wins; yes against no goes to the
resolver; a yes needs a verse that belongs to the person ([tq_refs.py](tq_refs.py): in their verse list, in a chapter of
it, in a letter they wrote, or naming them when the first name is unique in the people list); a book tag is never no; a
family no needs a verse; a yes that breaks an implies/excludes rule drops to unsure, and a settled yes decides the tags it
implies or excludes. Every drop is listed in the review sheet.

## Rebuilding the game files

```
py -3.12 scripts/twenty-questions/tq_build.py
node --experimental-strip-types scripts/twenty-questions/check.ts
```

`tq_build.py` writes `src/data/twenty-questions/twenty-questions.json` (shipped) and `twenty-questions-evidence.json`
(shipped, loaded only on result screens), with a new `version` whenever anything changes;
[server/twenty-questions-ids.ts](../../server/twenty-questions-ids.ts), the report endpoint's allow-list;
[tagged.json](tagged.json) (every value with its source, not shipped) and [build-notes.json](build-notes.json).

`check.ts` runs design §5.5's checks and the play simulation, rewrites
[docs/features/twenty-questions/review-sheet.md](../../docs/features/twenty-questions/review-sheet.md), and exits 1 while
any check fails. `npm test` holds the measured figures as a floor (`FLOORS` in
[data.test.ts](../../src/pages/games/twenty-questions/data.test.ts)); raise them, never lower them, when the tags improve.

## Not built yet

- `learn.ts` (design §10.4), which turns exported reports into proposed changes. It needs reports, so it waits until
  the migration is applied at release and players have sent some.
