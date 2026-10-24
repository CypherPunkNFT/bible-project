# Questions — handoff

**State last verified: 2026-10-24**, by reading the built bank and the explorer: 13,137 questions in the bank, 11,030
shown (6,414 of them written for the site); every shown question has four choices, is grounded and is rated; 716 carry
the children's wording; no open flags from the owner; the question explorer answers on the local preview.

The map of this folder is [README.md](README.md); each folder's README has the detail. This file is only the state and
what comes next.

## Where it stands

- **Done:** the bank is complete for now. Every shown question is checked against the BSB, grounded, tagged, rated
  easy/medium/hard and for children, and opens the verse that holds its answer ([checks/](checks/README.md)).
- **Done:** 716 children's questions reworded for a child and checked, used by the children's page mock-up
  ([children/](children/README.md)).
- **Done, not on the site:** 7,326 questions from seven children's sources, extracted and tagged
  ([children/children-batch4.json](children/README.md#the-childrens-sources-batch-4-extracted-and-tagged)).
- **Done 2026-10-24:** the two question chats were merged into one and every question file brought under this folder.
  The sources came from `Research/BibleQuizCorpus/` and the tests plan from `Plans/TESTS.md`; both old places hold a
  pointer. Every script and document now points here.
- **Nothing about questions is on the live site.** The questions page and the children's page are local mock-ups.

## Waiting on the owner

1. **Look over the questions** in the explorer, http://127.0.0.1:8931/data_questions/, flagging any that are wrong
   (the flags land in [checks/flags.json](checks/README.md#flags-from-the-owner) for this chat to fix).
2. **Approve a release** of the questions pages to bibleguide.io. Release only on that approval, and check what is live
   right before releasing (other chats release too).

## Next, in order

1. **Fix anything the owner flags**, at its source, then rebuild and remove the flag.
2. **The children's sources toward the site**, in the order the children's curriculum needs
   ([tests/README.md](tests/README.md), Part B): first the BSB's words, then a child's words, then four choices (the
   choices come last, so they are not written twice), then the site's checks, then listed in the bank build and on
   [SOURCES.md](../../SOURCES.md). The Baptist *A Catechism for Little Children* replaces the Presbyterian catechism
   the children's page asks today.
3. **A runner for Codex (ChatGPT)** beside BatchRunner, so a GPT model can take the blind quizzes on written questions
   and be a truly independent reviewer ([written/README.md](written/README.md#codex-chatgpt-on-the-owners-subscription)).

## How work is done here

- Model work goes through BatchRunner, one minimal call per item: a pilot of a few items first, a budget on every full
  run, only one full run at a time. The Bible questions have no spending cap (owner, 2026-10-23), but report the spend.
- A wrong question is fixed to what the BSB says; hiding it is the last resort. No King James wording.
- `python scripts/build-question-bank.py` (from `Website/`) after every change; the build is the only writer of
  [bank/](bank/README.md) and of `data/questions/bank.json`, the one file the site releases.
- Keep the downloads out of git ([sources/README.md](sources/README.md)). Commit by file name; other chats work in the
  same repository.

## Starting prompt for the questions chat

Copy this into a new chat:

```
You are the questions chat for the Bible Guide site (Jarvis/Projects/BibleProject/Website). All question work is
yours: sources, written and mined questions, every check, the official bank, and the children's questions. The
children's page design belongs to another chat; it reads the bank, and asks you for changes to the questions.

Read first, in order:
1. Jarvis/Projects/BibleProject/Website/content/questions/HANDOFF.md (state and what comes next)
2. Jarvis/Projects/BibleProject/Website/content/questions/README.md (the folder map)
3. the README of each folder you are about to touch

Then check the state yourself: run python scripts/build-question-bank.py from Website/ and compare its counts with the
handoff, and read content/questions/checks/flags.json for anything the owner flagged. Fix flags first, then carry on
with "Next, in order" in the handoff. Release to bibleguide.io only when the owner approves it. Keep HANDOFF.md current.
```
