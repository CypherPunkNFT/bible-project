# Question Bank — the site's official Bible questions

[question-bank.json](question-bank.json) is the one list of **production-ready** questions the site draws on: the
questions page (`/study/questions`), and later the home page's "How well do you know the Bible?" section and any quiz.

**8,866 questions** (built 2026-10-22): 2,831 Bible quiz, 902 Sunday school lesson, 2,516 Bible reading and 2,617
catechism questions; 1,457 are multiple choice and 3,604 carry a scripture reference.

## What "production-ready" means here

Taken from the quiz corpus at [Research/BibleQuizCorpus/](../../../Research/BibleQuizCorpus/MANIFEST.md) only when
the question is:

- **typed text**, not machine-read off a page scan;
- **answered**, with the answer its source printed;
- **publishable** under the owner's rule of 2026-10-17;
- from a bank someone has looked at and listed in `BANKS` in
  [build-question-bank.py](../../scripts/build-question-bank.py). A new bank in the corpus stops the build until it is
  listed there or in `LEFT_OUT`.

The same question and answer in two banks is kept once (choices first, then a reference, then the original over a
copy), with the other banks named in `also_in`. Everything left out, and why, is in the file's `left_out` list.

**Not yet done:** the answers are as the sources printed them and have **not been fact-checked**. `standalone: false`
marks a question that leans on the one before it ("What were their names?"); it is a best guess from the wording.

## Each record

`id`, `source_id`, `attribution_source_id`, `question`, `answer`, `options` (the choices, or `null`), `reference`,
`kind` (`trivia`, `lesson`, `reading`, `catechism`), `tradition` (Baptist, Reformed, Lutheran, Puritan, Methodist,
Roman Catholic, Seventh-day Adventist, or `null` for trivia), `collection`, `lesson`, `standalone`,
`question_origin`, `licence`, `licence_class`, `attribution` (the credit owed), `source_url`, `also_in`.

## Rebuilding

From `Website/`: `python scripts/build-question-bank.py`. It writes this file and the page's copy,
`data/questions/bank.json` (not in git, like all of `data/`), so a release from a clean checkout must run it first.
Sources are registered in [SOURCES.md](../../SOURCES.md) under "Question Bank".
