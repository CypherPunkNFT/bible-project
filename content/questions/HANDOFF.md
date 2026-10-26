# Questions — handoff

**State last verified: 2026-10-24**, by reading the built bank and the explorer: 20,326 questions in the bank, 14,916
shown (6,391 written for the site, 3,928 from the seven children's sources); every shown question has four choices, is
grounded and is rated; no open flags from the owner; the question explorer answers on the local preview with all
20,326 rows.

The map of this folder is [README.md](README.md); each folder's README has the detail. This file is only the state and
what comes next.

## Where it stands

- **Done:** the bank is complete for now. Every shown question is checked against the BSB, grounded, tagged, rated
  easy/medium/hard and for children, and opens the verse that holds its answer ([checks/](checks/README.md)).
- **Done:** 716 children's questions reworded for a child and checked, used by the children's page mock-up
  ([children/](children/README.md)).
- **Done 2026-10-24:** the seven children's sources are in the bank: 7,326 questions reworded to the BSB and for a
  child, four choices, checked against the BSB; 367 dropped as unfit; 3,928 shown, the rest repeats of questions
  already shown ([children/](children/README.md#the-childrens-sources-in-the-bank-24-october-2026)). A children's
  question never pushes a site question off the page. About $160 at API list price.
- **Done 2026-10-24:** the two question chats were merged into one and every question file brought under this folder.
  The sources came from `Research/BibleQuizCorpus/` and the tests plan from `Plans/TESTS.md`; both old places hold a
  pointer. Every script and document now points here.
- **Done 2026-10-24 (page, not questions):** the questions page's "Every question" rail has **By difficulty** (Easy,
  Medium, Hard), crossed with book, theme and search; its address key is `?d=` because `?level=` is the test page's own
  setting, and the test banner does not carry it. The chosen filters are gold rounded-square chips at the far right
  of the results bar, each removing itself, then a grey Clear all (Website commit `8b1759f69`). On the Study page's
  Questions & Answers card the two gold counts are 1.3× their line, and each part of the difficulty bar lights with
  its name and opens the list at that difficulty
  ([QuizDoor.tsx](../../src/pages/mockup/QuizDoor.tsx), [quiz-door.css](../../src/pages/mockup/quiz-door.css)):
  **not committed**, because those two files also hold the Study chat's unsaved edits; commit them with that work.
  The rail's four categories (By the book, By theme, By difficulty, Show) are solid gold tabs (3 px corners, to read
  like 02's theme box; the owner turned down a soft tint as "a new standard") that fold their group shut and open, open
  to begin with ([FilterRail.tsx](../../src/pages/mockup/questions/FilterRail.tsx) `RailGroup`). No line between 02 and 03.
  01's book tiles (both Testaments) have the same 3 px corners.
- **Done 2026-10-25 (children's page mock-up):** the top of "The whole course, answers included" is **"Contents
  beside it"**, the owner's real pick (they read each version's label on `/children_mockup?course=versions` as a
  caption under the design above it, so "number 3" meant the list, not the columns). The eight parts sit in two
  columns, each with its lessons and questions under its name; the 100 lessons · 716 questions sit under the words,
  above the button ([ParentGuide.tsx](../../src/pages/mockup/children/ParentGuide.tsx) `CourseHead`; the columns
  design is `GlanceHead`, version 3 on the versions page, which stays). Website commit `f700ed5b6`. Inside the course,
  each question shows its four choices lettered A–D and already revealed, the right one filled in green, as on the
  questions page with answers shown (the "Answer" and "Other choices" lines went).
  The parts are now named Creation, Exodus and Kingdom (the rest unchanged). Exodus and "The cross and the empty
  tomb" have their own drawings, the sea parted with the fire going before and three crosses, because the quiz's
  drawings they used belonged to other questions (Elijah's chariot of fire, the tear of "Jesus wept")
  ([part-art.tsx](../../src/pages/mockup/children/part-art.tsx)). The lessons in a part sit on one smooth winding road,
  level across with a wide round turn at each side, never two stacked; each part's road is its own (turns reach out
  and sweeps drop by their own amounts, the same on every visit), and the road is one solid line along which a wave
  (a swell on both sides of the line) flows at one steady speed as the page scrolls, lighting each lesson it passes
  through as under the pointer
  ([road.ts](../../src/pages/mockup/children/road.ts) `layRoad`, `useTraveller`). Website commits `53aa005c3`,
  `d484feea7`, `79e01bb84`, `7223bc6c0`.
  Each road but the last part's ends in a hexagon in the next part's colour, holding its drawing ("Next part"); choosing
  it brings that part in and goes up to the start of its road, which comes in with its line fading in and its lessons
  rising one after another. This move is a first take: the owner said "we need to think about how we're gonna do that",
  so ask before building more. The small See all questions under the road is gone. The course's top shows the part
  being looked at above as chosen, and its button reads "Open the Creation course" (and so on), opening at the lesson
  in the card above. Website commit `c68de2546`. The hexagon is a third larger than a lesson's circle and stands 1.6
  times the usual gap past the last lesson; the wave runs wholly into it and ends there (`c0aa0eabe`). When a road is brought to the top (the hexagon),
  the wave starts on its first lesson (`abaa80c4e`).
  In the course's top the chosen part has no arrow, even under the pointer; the others' arrow points down. Once the
  course is open its top marks the part the course is at, and its list of lessons shows only that part, the others
  folded to their names (choosing one opens it at its first lesson) (`819737998`).
  There are no side pages any more: "Start with your child" in the course puts its lesson in the card at the top and
  goes up to it, and is not shown for the lesson already there; the panel that slid in beside the page is gone, with
  its styles and the unused direction A page (archived in `BibleProject/ARCHIVE/mockups/`). Choosing a lesson's
  circle zooms from where it is, with no scroll up to the road's start first (`2c70a6dd1`).
  As the circle is pressed, the road's wave glides from wherever it was to that circle, on the zoom's clock (so the
  ticker slows it too), and stays there while the lesson is open.
- **Nothing about questions is on the live site.** The questions page and the children's page are local mock-ups.

## Waiting on the owner

1. **Look over the questions** in the explorer, http://127.0.0.1:8931/data_questions/, flagging any that are wrong
   (the flags land in [checks/flags.json](checks/README.md#flags-from-the-owner) for this chat to fix).
2. **Approve a release** of the questions pages to bibleguide.io. Release only on that approval, and check what is live
   right before releasing (other chats release too).

## Next, in order

1. **Fix anything the owner flags**, at its source, then rebuild and remove the flag.
2. **The children's page on the new questions**, for the children's page chat: the Baptist *A Catechism for Little
   Children* (bank `children-little`, 89 shown) is ready to replace the Presbyterian catechism the page asks today;
   which other sources the lessons use belongs to the curriculum ([tests/README.md](tests/README.md), Part B).
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
