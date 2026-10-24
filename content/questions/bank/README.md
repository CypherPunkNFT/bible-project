# Bank — the site's official Bible questions

[question-bank.json](question-bank.json) is the one list of **production-ready** questions the site draws on: the
questions page (`/study/questions`), the children's page, and later the home page's "How well do you know the Bible?"
section and any quiz. Every build writes it, together with [question-table.csv](question-table.csv) and the site's
own copy, `data/questions/bank.json`, **the only question file released with the site**.

**20,326 questions** (built 2026-10-24): 9,913 Bible quiz, 7,749 Sunday school lesson and 2,664 catechism questions.
**14,916 are shown**, 6,391 of them written for the site ([../written/](../written/README.md)) and 3,928 from the
seven children's sources ([../children/](../children/README.md#the-childrens-sources-in-the-bank-24-october-2026));
the rest are repeats or hidden. Roman Catholic and Seventh-day Adventist books are left out as outside the site's doctrinal scope (owner,
2026-10-22); they stay in [../sources/](../sources/README.md) to mine for content later.

## What "production-ready" means here

A question is taken from [../sources/](../sources/MANIFEST.md) only when it is:

- **typed text**, not machine-read off a page scan;
- **answered**, with the answer its source printed;
- **publishable** under the owner's rule of 2026-10-17;
- from a bank someone has looked at and listed in `BANKS` in
  [build-question-bank.py](../../../scripts/build-question-bank.py). A new bank in the sources stops the build until it
  is listed there or in `LEFT_OUT`.

Questions written for the site ([../written/](../written/README.md)) and made from sources that could not be used as
they were ([../mined/](../mined/README.md)) join as banks of their own.

The same question and answer in two banks is kept once (choices first, then a reference, then the original over a
copy), with the other banks named in `also_in`. Everything left out, and why, is in the file's `left_out` list.

Every shown question then goes through the checks in [../checks/](../checks/README.md): repeats, four choices, the BSB
check, grounding, the recheck, tags, difficulty and the verse its link opens. `standalone: false` marks a question that
leans on the one before it ("What were their names?"); it is a best guess from the wording.

## Each record

`id`, `source_id`, `attribution_source_id`, `question`, `answer`, `options` (the choices, or `null`), `reference`,
`books` (book codes from the reference, then any book named outright), `testament` (`OT`, `NT` or `null`), `topic`
(one of 16, see `topics`), `link` (the verse "Read the verse" opens), `kind` (`trivia`, `lesson`, `catechism`),
`tradition` (Baptist, Reformed, Lutheran, Puritan, Methodist, or `null` for trivia), `collection`, `lesson`,
`standalone`, `question_origin`, `licence`, `licence_class`, `attribution` (the credit owed), `source_url`, `also_in`,
`repeat_of` (the id of the question shown in its place, or `null`), `passages` (each `book`, `chapter`, `verse`,
`verse_end` and `check`), `people`, `places`, `subjects` (plain topics such as "the flood" or "kings of israel"),
`answer_choice` (the option that is right, or `null` without options), `options_by` (`source`, `claude-haiku`,
`true/false`, or `null`; with ", audited by …" added when the audit replaced wrong choices), `hidden` (why it is
hidden, or `null`), `audit` (`verdict`, the fault `kinds`, `why` and `by`, or `null` if not audited), `grounding`
(`basis`, `strength`, `outside`, `verses`, `note`, `doubt`, `by`, or `null` if not grounded), `level` and `children`
(how hard it is), and `child` (the children's page wording, [../children/](../children/README.md), or absent).

## The table

[question-table.csv](question-table.csv): one row per question, shown, repeat or hidden, with its wording, choices,
reference, basis, verses, note, doubt, the audit's verdict, faults and reason, and which model did each part. It opens
in Excel.

## The question explorer (local only)

http://127.0.0.1:8931/data_questions/ (the third card on the local data hub, `/data/`) shows all 20,326 questions in
one table: filters with counts, sorting, and each question's before and after wording, faults, reason, verses, basis
note, doubt, level, models and source. **Simulate** shuffles whatever the filters leave and runs it as a quiz (keys
1–4, Enter for next). Its data, `.local/question-explorer/questions.json`, is written by every build
([question_explorer.py](../../../scripts/question_explorer.py)); it is never in `data/`, which is released with the
site. The page and its endpoint are [analysis-desk/questions.*](../../../analysis-desk/) and
[data-questions-vite.ts](../../../scripts/data-questions-vite.ts); none of it is deployed. Questions the owner flags
there are saved to [../checks/flags.json](../checks/README.md#flags-from-the-owner).

## Rebuilding

From `Website/`: `python scripts/build-question-bank.py`. It reads the sources, the written and mined questions and
every check, and writes the two files here and `data/questions/bank.json` (not in git, like all of `data/`), so a
release from a clean checkout must run it first. Sources are registered in [SOURCES.md](../../../SOURCES.md) under
"Question Bank".
