# Answer pictures: a drawing of the right answer, shown when a child gets it right

**Class:** LIVING · **Started:** 2026-10-25 (owner: "create images of the answers when they're correct. This will allow
the children to really remember the answer. So if the answer is Babel, then a tower of Babel can show.")
· Questions folder: [README](../README.md) · [HANDOFF](../HANDOFF.md)

When a child picks the right answer on the children's page, a small line drawing of that answer draws itself in beside
it: the tower of Babel for "Babel", people walking off in every direction from the unfinished tower for "God spread them
over all the earth". The owner approved the plan below on 2026-10-25 ("I definitely want to do it").

## What it starts from (2026-10-25)

- **14,916 shown questions, 5,838 of them for children**, with **12,505 different answers**.
- Most answers only make sense with their question ("In the camp where Saul was sleeping", "Interpreted their
  dreams"), so a picture is drawn from the question and the answer together, never the answer alone.
- About 2,200 answers are a word or two; about 6,200 are a sentence; some are doctrine ("an act of God's free grace").
- Many questions can share one picture. The expected number of pictures is 2,000 to 4,000; step 2 gives the real one.

## The owner's decisions (2026-10-25)

1. **Children's questions first**, then everyone else's.
2. **The site's own line drawings**, like the children's page's, not full-colour pictures: they match the site, they
   can draw themselves in, and a bad one is fixed by editing it.
3. **God the Father is never drawn.** His work is shown instead: light breaking through, the people scattering, the
   waters parting.
4. **Jesus is a simple figure seen in the distance or from behind, with no detailed face.** Where the verse suits it,
   a symbol alone, such as a crown.
5. **Doctrine answers that cannot be drawn take a symbol** from one fixed set of about 40 (cross, open Bible, crown,
   lamp, dove…), reused where it fits.

## The steps

| Step | What | Cost | State |
|---|---|---|---|
| 0 | The plain list: every shown question with its right answer, keyed by the bank's own question id | none (a script) | **Done 2026-10-25:** [answers.json](answers.json), [answers.csv](answers.csv) |
| 1 | A picture idea for every question: one line, a short shared picture name (`tower-of-babel`), how hard to draw (easy, medium, hard, symbol), and a flag if it would show God or Jesus. 50 questions per model call, about 300 calls, each carrying only the instructions and its 50 questions | small | not started |
| 2 | Merge: group by picture name, fold near-duplicates, count the questions each picture serves | none (a script) | not started |
| 3 | About 12 sample drawings in the children's page style, on a local mock-up page, for the owner to approve the look | small | not started |
| 4 | Drawing in waves: one picture per call, an SVG line drawing in the site's colours with no words; a script checks each one (opens, site colours only, no text). Children's and most-used first, about 200 per wave | the large part | not started |
| 5 | A review gallery on the local preview with a "redraw this" button; redraws go into the next wave | none | not started |
| 6 | On the site: the picture draws itself in beside the right answer in the children's lesson; the questions page later | none | not started |

**Where the calls are billed** is being settled: the owner asked (2026-10-25) whether the $250 Claude Code cloud credit,
which runs out on 5 November 2026, can pay for steps 1 and 4 instead of the Max plan. Every run follows the batch rule
(one minimal call per item, a 3-item pilot first, the owner told the cost before the full run).

## Files

| File | What | Made by |
|---|---|---|
| [answers.json](answers.json) | Every shown question: id, question, right answer, for children or not, difficulty, kind, reference, people, places | `python scripts/question_pictures_list.py` (from `Website/`), [question_pictures_list.py](../../../scripts/question_pictures_list.py); rerun after the bank is rebuilt |
| [answers.csv](answers.csv) | The same as one table, for a spreadsheet | the same |
