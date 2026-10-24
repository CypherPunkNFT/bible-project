# Quiz competitor research — summary (Fortress job 456, 22 Oct 2026)

Source: read-only Fortress job 456. Full report (25+ competitor profiles, side-by-side table, ranked lists of 20 topic gaps and 20 feature ideas, all sourced):
`C:\FortressOrchestrator\workspaces\a8c23fdc3b7c4a08a34e486f693231a6\COMPETITOR-RESEARCH.a8c23fdc3b7c4a08a34e486f693231a6.md`
Measurement scripts and their output (analyse-bank, gap-check, coverage, perbook) are in the same folder.

## Current bank, measured
- 6,467 records in `question-bank.json`; 4,861 shown (the rest are hidden near-duplicates).
- Formats: 4,780 four-choice, 81 true/false.
- **No difficulty, age-band or grade field exists.** Every competitor has 3+ difficulty tiers. The 181 questions imported from Ministry-to-Children had age bands (5–8, 9–12, teen) in the source; the import dropped them.
- Chapter coverage: 707 of 1,189 chapters (59.5%). 21 books at 100% (e.g. Matthew, Romans, Hebrews). Thin: Ezekiel 8/48, Job 8/42, Jeremiah 13/52, Psalms 54/150, 1 Chronicles 6/29, 2 John 0. BibleMaximum ships a 15-question quiz for every chapter.
- 3,761 shown questions carry a verse checked against the BSB text; 3,138 of those verses contain a key word of the answer.
- 1,098 shown questions have neither a printed reference nor a located verse. Answers are as sources printed them, not yet fact-checked.
- Questions and test pages are still local mock-ups. The themed-test structure designed 22 Oct (four shelves: Lives, Stories, Teaching, Know your Bible; ~45 themed tests) is better organised than any competitor's.

## Biggest unused advantage
The reading side has ~40 public-domain translations in 14 languages plus Hebrew, Greek, Latin and Septuagint. The quiz uses none of them. Competitors are locked to KJV or NIV. Possible additions: complete-the-verse questions in any translation (e.g. Geneva 1599, Young's Literal) and translation-comparison questions.

## Topic gaps (keyword counts across shown questions)
- Jewish feasts and festivals: 85
- Christmas / Easter / Advent / Lent: 73
- Geography and places: 85 (an atlas with 216 tagged places already exists)
- Tabernacle and temple furnishings: 20
- Sacrificial offering system: 8
- Revelation detail: 33; seven churches: 35
- Weights, measures, coins: 58
- Church history and creeds: 61
- Beatitudes: 19
- Chronological ordering: 1

## Feature ideas, rough value order
1. Difficulty tiers and age bands (a tagging pass; the source collection tells you most of the answer).
2. Fill-in-the-blank generated from the checked verses.
3. Daily question picked by date (no server needed).
4. "In what book and chapter?" questions.
5. Progress coloured onto the site's own book map instead of a leaderboard (no competitor does this).
6. "Who said it?" from the 2,356 people-tagged questions.
7. Printable quiz PDFs with a separate answer key, for Sunday-school teachers.

Competitive church quizzing (Nazarene and Assemblies of God) formalises about ten question types, including "according to [verse]", book-and-chapter, quotation completion, situation and reference questions. Four of these can be generated cheaply from the checked verses.

## Recommended against
Global leaderboards, timed answering, and coins, gems or hints. If you add a streak, keep it browser-only, forgiving by default, and never shown to anyone else. (2026 reviews of YouVersion's streak describe users losing long streaks during hospital stays and rushing readings to beat it.)

## Trust signal
Three competitors advertise "a Scripture reference on every answer". Closing the 1,098-question gap would make this the most verifiable bank in the field.
