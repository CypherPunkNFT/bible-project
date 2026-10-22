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
them (owner, 2026-10-22). [question_repeats.py](../../scripts/question_repeats.py) finds them. Every question is
embedded with its answer on the local embedding model ($0), and pairs scoring 0.75 or higher become candidates. The
same question text with near-identical answers counts as a repeat outright. Claude Haiku judges every other candidate:
two questions are a repeat only when their answers could swap, so a question asked the other way round ("Who refused to
bow?" / "What did the three friends refuse to do?") is not one. Every decision is kept in [repeats.json](repeats.json),
so no pair is asked about twice.

As of 22 October 2026, **1,245 questions are marked `repeat_of`**, and the page's copy holds **3,717**. Of each group,
the one shown has answer choices first, then comes from a Baptist collection, then carries a reference. How often a
judged pair turned out to be a repeat, by score: 86% from 0.90 up, 67% at 0.85–0.90, 20% at 0.80–0.85, 11% at
0.75–0.80, and 7% in a 99-pair sample at 0.70–0.75. So a few repeats are left below 0.75: about 3,400 pairs at
0.70–0.75 have not been judged.

## Each record

`id`, `source_id`, `attribution_source_id`, `question`, `answer`, `options` (the choices, or `null`), `reference`,
`books` (book codes from the reference, then any book named outright), `testament` (`OT`, `NT` or `null`), `topic`
(one of 16, see `topics`), `link` (the first reference as the reader opens it), `kind` (`trivia`, `lesson`, `catechism`), `tradition` (Baptist, Reformed, Lutheran, Puritan, Methodist, or `null`
for trivia), `collection`, `lesson`, `standalone`,
`question_origin`, `licence`, `licence_class`, `attribution` (the credit owed), `source_url`, `also_in`, `repeat_of`
(the id of the question shown in its place, or `null`), `passages` (each `book`, `chapter`, `verse`, `verse_end` and
`check`), `people`, `places`, `subjects` (plain topics such as "the flood" or "kings of israel"), `answer_choice` (the option that is
right, or `null` without options), `options_by` (`source`, `claude-haiku`, `true/false`, or `null`).

**Tags are rules, not reading.** `books`, `testament` and `topic` come from fixed word lists and the references in
[question_tags.py](../../scripts/question_tags.py): a word in the question counts three times, one in the answer once,
the referenced book three times. 4,839 of 4,962 questions get a topic and 2,303 a book; a question can sit under a near
topic, and nobody has checked them by hand.

**Passages, people, places and subjects are read by a model, and every passage is checked.** Claude Haiku reads each
shown question ([question_model_tags.py](../../scripts/question_model_tags.py), kept in [model-tags.json](model-tags.json)).
A script then checks every passage it names against the BSB text: a book, chapter or verse that does not exist is
dropped. A passage whose text, give or take two verses, holds a telling word of the answer has `check: "matched"`;
otherwise it is `"exists"`, usually the right place worded differently ("covenant" for the promise to Abram). As of 22
October 2026, all 3,717 shown questions are tagged: 3,049 have a passage (3,746 passages: 3,069 matched, 677 exists;
39 named verses that do not exist were dropped), 2,356 name people and 1,107 places.

## Multiple choice for written answers

Every shown question with a written answer, unless it leans on the question before it, has four choices (owner, 22
October 2026). [question_choices.py](../../scripts/question_choices.py) keeps them in [choices.json](choices.json),
never in the sources. A true-or-false answer gets "True" and "False" by rule (27). For the rest (2,050), Claude Haiku
wrote three wrong choices. The right choice is the printed answer when it is 12 words or fewer. A longer answer, mostly
catechism, is shown as Haiku's short version, and the page shows the full printed answer once the right choice is
revealed. Every set is checked: three distinct wrong choices, none matching the right one, and no "all of the above".

A right choice that is plainly the longest gives itself away. After the first run it was over 15% longer than every
wrong choice in 304 of the 610 catechism questions (50%). Those were asked again with the right choice fixed. Now it is 21% for
catechism, 27% for Bible quiz and 15% for lesson questions, against 21% in the sources' own multiple choice.

The site shows 3,308 of its 3,717 questions as multiple choice. The 409 that lean on the question before them keep
their written answers.

## Rebuilding

From `Website/`: `python scripts/build-question-bank.py`. It writes this file and the page's copy,
`data/questions/bank.json` (not in git, like all of `data/`), so a release from a clean checkout must run it first.
Sources are registered in [SOURCES.md](../../SOURCES.md) under "Question Bank".
