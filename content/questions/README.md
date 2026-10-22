# Question Bank — the site's official Bible questions

[question-bank.json](question-bank.json) is the one list of **production-ready** questions the site draws on: the
questions page (`/study/questions`), and later the home page's "How well do you know the Bible?" section and any quiz.

**4,962 questions** (built 2026-10-22): 2,831 Bible quiz, 902 Sunday school lesson and 1,229 catechism questions;
1,457 are multiple choice and 1,703 carry a scripture reference. Roman Catholic and Seventh-day Adventist books are
left out as outside the site's doctrinal scope (owner, 2026-10-22); they stay in the corpus to mine for content later.

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

## Repeats: kept, never shown

The same question asked twice in different words is a **repeat**. Repeats are not deleted; the site just never shows
them (owner, 2026-10-22). [question_repeats.py](../../scripts/question_repeats.py) finds them: every question is
embedded with its answer on the local embedding model ($0), and pairs that score 0.85 or higher become candidates.
Near-identical text counts as a repeat outright. Every other candidate is judged "same question?" by Claude Haiku: a
repeat tests the same fact, even when asked the other way round. Every decision is kept in
[repeats.json](repeats.json), so no pair is asked about twice.

First full pass (2026-10-22): 1,525 candidates. 1,359 were repeats (557 by text, 802 by Haiku) and 166 were not.
**881 questions are marked `repeat_of`**, and the page's copy holds **4,081**. Of each group, the one shown has
answer choices first, then comes from a Baptist collection, then carries a reference.

## Each record

`id`, `source_id`, `attribution_source_id`, `question`, `answer`, `options` (the choices, or `null`), `reference`,
`books` (book codes from the reference, then any book named outright), `testament` (`OT`, `NT` or `null`), `topic`
(one of 16, see `topics`), `link` (the first reference as the reader opens it), `kind` (`trivia`, `lesson`, `catechism`), `tradition` (Baptist, Reformed, Lutheran, Puritan, Methodist, or `null`
for trivia), `collection`, `lesson`, `standalone`,
`question_origin`, `licence`, `licence_class`, `attribution` (the credit owed), `source_url`, `also_in`, `repeat_of`
(the id of the question shown in its place, or `null`).

**Tags are rules, not reading.** `books`, `testament` and `topic` come from fixed word lists and the references in
[question_tags.py](../../scripts/question_tags.py): a word in the question counts three times, one in the answer once,
the referenced book three times. 4,839 of 4,962 questions get a topic and 2,303 a book; a question can sit under a near
topic, and nobody has checked them by hand.

## Rebuilding

From `Website/`: `python scripts/build-question-bank.py`. It writes this file and the page's copy,
`data/questions/bank.json` (not in git, like all of `data/`), so a release from a clean checkout must run it first.
Sources are registered in [SOURCES.md](../../SOURCES.md) under "Question Bank".
