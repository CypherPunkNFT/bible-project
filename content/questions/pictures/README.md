# Answer pictures: moved to their own repository

**Moved 2026-10-25** (owner: "make a GitHub that is only dedicated to this… organize this as its own little thing").

The answer-pictures project, a line drawing of the right answer shown when a child gets it right, now lives on its
own, so a cloud session can copy it in seconds (this site's repository, about 1 GB, timed out when a cloud session
tried to clone it):

- On this PC: [Jarvis/Projects/BibleProject/AnswerPictures/](../../../../AnswerPictures/README.md)
- On GitHub: the private repository **CypherPunkNFT/bible-answer-pictures**

It holds the plan, the owner's five decisions, the job every session runs, a copy of the shown children's questions
(only those: owner, 2026-10-25) with the BSB text of each question's verse, and the BSB itself. Its `tools/build.py` refreshes that copy from this folder's
`bank/question-bank.json`; the questions are still made, checked and kept here.

The first versions of the list and the chunks were made here (Website commits `588d9a66d`, `549e2043e`) and removed
when the project moved; they are in the git history.
