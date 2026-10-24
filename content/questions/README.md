# Questions — every Bible question the site has, uses or may use

Everything about the site's questions lives in this folder (brought together 2026-10-24): the downloads they come
from, the questions written and mined for the site, every check, the official bank, the children's questions and the
plan for the tests. Each folder has its own README with the detail.

**Only one file reaches the live site:** `data/questions/bank.json`, which the bank build writes from this folder. None
of this folder is released, so adding to it never adds to what the site sends.

## Where things stand (2026-10-24)

- **13,137 questions in the bank, 11,030 shown**: 9,913 Bible quiz, 902 Sunday school lesson and 2,322 catechism
  questions, 6,414 of the shown written for the site. The rest are repeats or hidden.
- Every shown question is **multiple choice, checked against the BSB, grounded** (the verses that hold its answer, or
  why it is answered from outside the Bible), **tagged** by book, theme, people and places, and **rated** easy, medium
  or hard, and whether it suits children.
- **716 children's questions** are reworded in a child's words for the children's page.
- **7,326 more children's questions** are extracted from seven children's sources and tagged, not on the site yet.
- The questions page and the children's page are still local mock-ups; nothing about questions is on the live site
  until the owner approves a release.

## The folders

| Folder | What it holds | README |
|---|---|---|
| [sources/](sources/) | Every question bank, quiz set, catechism and Sunday school book downloaded, with the register of where each came from and its licence. The 1.5 GB of downloads stay on this PC, not in git. | [sources/README.md](sources/README.md) |
| [written/](written/) | The 6,414 shown questions written for the site from the BSB, one BSB section at a time, and the Codex measurements | [written/README.md](written/README.md) |
| [mined/](mined/) | 1,148 shown questions made from sources that could not be used as they were (no licence, a table of facts, books without answers) | [mined/README.md](mined/README.md) |
| [checks/](checks/) | Every check's decisions: repeats, choices, the BSB check, grounding, tags, difficulty, the verse each link opens, and the owner's flags | [checks/README.md](checks/README.md) |
| [bank/](bank/) | **The official bank**, built from all of the above, and its table for Excel | [bank/README.md](bank/README.md) |
| [children/](children/) | The children's page wording and the extracted children's sources | [children/README.md](children/README.md) |
| [tests/](tests/) | The plan for the tests: themed tests for teens and adults (Part A) and the children's curriculum (Part B) | [tests/README.md](tests/README.md) |

[COMPETITOR-RESEARCH-SUMMARY.md](COMPETITOR-RESEARCH-SUMMARY.md): what other Bible quiz sites do, measured 22 October
2026 (its counts are from that day).

## How a question reaches the site

```
sources/  ──┐
written/  ──┼──> checks/ ──> bank/question-bank.json ──> data/questions/bank.json ──> the site
mined/    ──┘                                       (the only file released)
```

1. A source is downloaded into [sources/](sources/README.md) and listed in its register.
2. Its questions are extracted and put in one record shape; the bank build stops until a new bank is listed as taken
   in or left out, so nothing enters or drops without a decision.
3. The checks in [checks/](checks/README.md) run on it with BatchRunner, one minimal model call per batch of items.
4. `python scripts/build-question-bank.py` (from `Website/`) writes the bank, its table, the explorer's copy and the
   site's copy.

To look over every question, flag one, or run a quick test: the question explorer on the local preview,
http://127.0.0.1:8931/data_questions/ ([bank/README.md](bank/README.md#the-question-explorer-local-only)).

## Who works on what

- **The questions chat** (one chat for all question work, from 2026-10-24): sources, writing, mining, checks, the
  bank, and the children's questions themselves. Its starting prompt is in [HANDOFF.md](HANDOFF.md).
- **The children's page chat**: the children's page design (the mock-up at `/children_mockup`). It reads the bank and
  [children/](children/README.md), and asks the questions chat for changes to the questions.
