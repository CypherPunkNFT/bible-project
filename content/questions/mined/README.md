# Mined — new questions from sources that could not be used as they were

[question_mining.py](../../../scripts/question_mining.py) makes three more sources usable with Claude Haiku (owner, 22
October 2026), kept in [mined.json](mined.json), each record saying how it was made:

- **BibleQA** has no licence. Only its questions not already on the site were sent. Haiku wrote a new question for
  each fact, so none of BibleQA's wording is used.
- **BibleData** (CC BY 4.0, credited) is a table of Bible facts. Name meanings and modern place names are left out, and
  so is any row about a person or place no question on the site names. Haiku kept the rows a church quiz would ask
  and worded them as questions.
- **Two Lutheran catechism books printed without answers** (Stump, 1910; Mezger, 1923; public domain). Haiku answered
  each question from the book's own lesson text, and reworded those that lean on the question before.

Every kept question has three wrong choices, re-asked where the right one was plainly the longest. A Bible fact's
passage must exist in the BSB and hold the answer's words. Questions that name their own answer were dropped. Then
every new question went through the repeat check ([../checks/](../checks/README.md)): one that repeats a question on
the site is hidden behind it, never the other way round, and never joins two of the site's questions into one group.

As of 22 October 2026: 1,506 kept (693 Mezger, 400 Stump, 321 BibleData, 92 BibleQA) and 357 hidden as repeats, so
**1,148 mined questions are shown**. The downloads they came from are in [../sources/](../sources/README.md) (batch 1
and batch 3).
