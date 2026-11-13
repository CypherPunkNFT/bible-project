# What came first? — data report (sequence 48, step 3: curate and check the data)

**Date:** 2026-11-12. **Design followed:** [design.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/design.md), with the owner's later decisions in [BRIEF.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/BRIEF.md) section 4a and [firsts-additions.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/firsts-additions.md).
**For the owner to read:** [review-sheet.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/review-sheet.md), every item, every order fact with its verse, every blocked pair and every question, in plain words.

Every item, order fact and question carries the verse that settles it, and the build checks each verse against the site's own Berean text (the item's name must stand in the verse). Where a verse did not settle the order, the pair was blocked or the item left out, never guessed. No game code was written; that is step 4.

## 1. Counts

| Category | Items | Askable pairs | Easy | Medium | Hard | Order facts | Blocked pairs |
|---|---|---|---|---|---|---|---|
| Who lived first? (Who's older?'s people, unchanged) | 160 | 10,789 | 1,003 | 4,777 | 5,009 | Who's older?'s own | 9 |
| What happened first? (the Timeline game's events) | 248 | 28,052 | 2,332 | 10,738 | 14,982 | 1,453 | 68 |
| Who ruled first? | 95 | 4,194 | 583 | 653 | 2,958 | 81, plus 1,248 "judges came before Saul" pairs | 17 |
| What was built first? | 37 | 653 | 164 | 71 | 418 | 90 | 13 |
| Where did they go first? | 117 stops in 14 journeys | 538 | 53 | 57 | 428 | none (stop order) | 2 |
| Who died first? | 48 | 1,039 | 172 | 523 | 344 | 113 | 7 |
| Which comes first in your Bible? | 66 books | 2,145 | 1,271 | 574 | 300 | none (Bible order) | 0 |
| Bible Firsts | 61 questions (22 easy, 27 medium, 12 hard) | — | — | — | — | — | — |

No item was dropped by the build for having too few certain partners: every item in the source files reached its category's minimum.

## 2. The files

Hand-kept sources (edit these, then rebuild), all in [src/data/what-came-first/](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/):
- [rulers.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/rulers.source.json): 97 named rulers (95 reach the game), the order facts, the judges' "before Saul" rule, blocks and the left-out list.
- [built.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/built.source.json), [journeys.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/journeys.source.json), [died.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/died.source.json), [firsts.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/firsts.source.json).
- [events.source.json](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/events.source.json): only this game's own blocks on top of the Timeline's events.

Generated (never edit by hand; each carries a stamp the tests re-check): events.json, ruled.json, built.json, journeys.json, died.json, books.json, firsts.json in the same folder, and the review sheet. Who lived first reads Who's older?'s own file unchanged.

Build and checks: [build-what-came-first.ts](Jarvis/Projects/BibleProject/Website/scripts/build-what-came-first.ts) with its parts in [scripts/what-came-first/](Jarvis/Projects/BibleProject/Website/scripts/what-came-first/). The one rule that decides whether a pair may be asked, shared by the build and (in step 4) the game: [order.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/what-came-first/order.ts), with the difficulty bands in [bands.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/what-came-first/bands.ts) and two small adapters in [categories/](Jarvis/Projects/BibleProject/Website/src/pages/games/what-came-first/categories/).

Rebuild: `node --experimental-strip-types scripts/build-what-came-first.ts` (from the Website folder). It writes nothing and exits 1 if any check fails, naming the items involved.

## 3. Build check output (the last run, verbatim)

```
what came first: every check passed.
  lived:    160 people, 10789 pairs (easy 1003, medium 4777, hard 5009); Who's older?'s file, stamp 65a386894fde, parity with its orderOf proved for every pair
  happened: 248 events, 28052 pairs (easy 2332, medium 10738, hard 14982), 1453 facts, 68 blocked; stamp b6ee13be7ed9
  ruled:    95 rulers, 4194 pairs (easy 583, medium 653, hard 2958), 81 facts + 1248 before-Saul, 17 blocked; stamp f3ab2e451d02
  built:    37 items, 653 pairs (easy 164, medium 71, hard 418), 90 facts, 13 blocked; stamp 3c3ca273b32f
  went:     14 journeys, 117 stops, 538 pairs (easy 53, medium 57, hard 428), 2 blocked; stamp 2163cd029680
  died:     48 people, 1039 pairs (easy 172, medium 523, hard 344), 113 facts, 7 blocked; stamp 71a67902ef95
  books:    66 books, 2145 pairs (easy 1271, medium 574, hard 300); stamp d13c0429b0e4
  firsts:   61 questions, 9 left out; stamp b70197220961
  review sheet: docs\features\what-came-first\review-sheet.md
```

What the build checks, in plain words: every verse span exists in the Berean text and the item's name or phrase stands in it; no year 0 and no window that ends before it starts; no two items share a label; every order fact points at real items, never runs against the windows or both ways, and never makes a loop; a succession or "dated by the other king's reign" fact is refused (and the pair blocked) when any dating system puts the second ruler first; every pair the game may ask rests on a fact, on windows that share no year, or on positions in one journey, re-checked by a second check written apart from the ordering rule; no blocked pair is ever asked; every item has enough certain partners and every band enough pairs; miracles of Jesus, plagues and the Creation week are never paired among themselves; no question asks about the days of Creation, the plagues, which book was written first or which miracle came first; every Bible Firsts option differs from the answer and is never one of the question's defensible answers.

## 4. Tests

New tests in [src/pages/games/what-came-first/](Jarvis/Projects/BibleProject/Website/src/pages/games/what-came-first/): order.test.ts (each step of the ordering rule, the bands, the "before Saul" expansion), data.test.ts (every generated file against its stamp and sources, and each category's rules), rulers.test.ts (the known hard ruler pairs), build-checks.test.ts (each build check refuses the mistake it exists for).

Run on 2026-11-12, after the last rebuild:
- What came first?'s 82 tests (4 files), with Who's older?'s, the Timeline game's, the translated-data and games-hub tests: 23 files, 245 tests, all passed.
- `eslint` on the new folders: no warnings. TypeScript (app and scripts settings): no errors.
- The site's full test run (`npx vitest run`) on the final state: 3,615 passed, 1 failed. The failure is the crossword's "clue file is stale" test: another job has uncommitted changes to the Map quest places file, which the crossword build reads. This step touched neither file.

Hard pairs the tests pin down: Ahab and Jehoshaphat, Pekah and Pekahiah, Rehoboam and Jeroboam, Ish-bosheth and David, Herod the Great and Augustus, Sargon and Merodach-baladan are never asked; Joash of Israel is asked before Amaziah of Judah; every judge is asked before Saul and before Pilate, but never against another judge by that rule alone.

## 5. What was left out, and why

**Who ruled first?** (from the source file's left-out list)
- The Pharaohs of Joseph's day, of the oppression and of the Exodus, and Solomon's father-in-law: never named in Scripture (the brief asks for named Pharaohs).
- So, king of Egypt: no years and no verse ordering him against another ruler.
- Nero: Scripture never names him (Paul appeals to "Caesar", Acts 25:11).
- Hiram, Hazael and Rezin: dated on one system only.
- The three Ben-hadads, Mesha, the queen of Sheba, Candace and Lysanias: no usable years and too few verse orders.
- Zerubbabel: when he began to govern is not told (first called governor in Darius's second year, Haggai 1:1).
- Vashti and Esther: queens consort, not rulers.

**What was built first?** Abram's altar at Bethel; Jacob's altars at Shechem and Bethel (Jacob's pillar is his one card); Gideon's ephod (not dated within his forty years, not a building); Nebuchadnezzar's dream statue (never built).

**Who died first?** Terah (Abraham's birth year against his is open by sixty years); Lamech, Noah's father (the Hebrew, Greek and Samaritan numbers differ); Nadab and Abihu, Korah with Dathan and Abiram, and Saul's sons Abinadab and Malchishua (each group died together).

**Where did they go first?** 41 places left out, each with its reason on the review sheet. The kinds: regions rather than places (Cyprus, Galatia, the Negev); places only sailed past (Chios, Cnidus, Cauda); places with no arrival verse (Iconium on the second journey, Cenchrea); stops whose order the texts dispute (Kadesh, Moseroth and Bene-jaakan, the camps after Iye-abarim, Philippi and Macedonia on the third journey); and Jerusalem at Acts 18:22, where the city is supplied by the translation.

**What happened first?** All 248 Timeline events are kept. Three groups are never paired among themselves (the Creation week, Jesus's miracles, the plagues), and two single pairs are blocked (Hezekiah reopening the temple and Samaria's fall; the anointing at Bethany and the entry into Jerusalem), on top of the Timeline's 47 contested pairs.

**Bible Firsts:** 9 left out: who first saw the risen Jesus (rests on Mark's disputed longer ending), the first prophet and the first vineyard (first mention only), Nimrod as first mighty one (no "first" in the verse), the first apostle to die (depends on who counts), and the four the owner ruled out (days of Creation, plagues, book written first, miracle first).

## 6. Bible Firsts: the owner's 36 added questions

**All 36 are in; none was dropped.** Every verse was read in the Berean text and passes the build's checks. No wrong answer was replaced: none of them could be defended as right. Changes made, each because a check called for it:
- **Stephen** now reads "Who was the first Christian martyr?" (Acts 7:59–60, 8:1, 22:20), with John the Baptist and Jesus on its never-offered list.
- **#21, Jesus's first words:** asked as "In the story of Jesus's life, what are the first words the Bible records Him saying?" The table's wording ("the first words of Jesus that the Bible records") could be read in page order, and in page order two of the given wrong answers would be right: "Let it be so now" (Matthew 3:15) and "Man shall not live on bread alone" (Matthew 4:4) both come before Luke 2:49. Rewording the question kept all the owner's wrong answers. The answer quotes the Berean in full: "Why were you looking for Me? Did you not know that I had to be in My Father's house?"
- **#5, Judah's twins:** "Judah's twin put out his hand" reads as if Judah had a twin; it now says "One of Judah's twin sons put out his hand first and got the scarlet thread. Which twin was born first?"
- **#28, "We love because…":** every question must end with a question mark, so it reads "How does John finish the words "We love because..."?"
- **#25 and #26** use the site's Bible's words for the answer: "The kingdom of God and His righteousness"; "The beam (log) in your own eye".
- **#22, Andrew:** the table's note says "Peter never an option", but its wrong-answers column lists Peter. Peter was kept as a wrong answer, because he came after Andrew (John 1:41–42), so he cannot be right.

One small build change came with this: a verse that says "firstfruits" now counts as stating a first (for "the firstfruits of those who have fallen asleep", 1 Corinthians 15:20).

## 7. Where this departs from the design

- **Books has a data file** (books.json), though the design said none was needed: the brief asks for built data for every category. The game can still show each book's name in the reader's own Bible.
- **The ordering rule (order.ts) was written in this step**, because the build counts askable pairs with it and the design wants build and game to share one file.
- **Unnamed Pharaohs and Nero are left out**, because the brief asks for rulers "named in Scripture".
- **One new blocked ruler pair, Pekah and Jotham:** the build found that Albright's dates put Jotham's start before Pekah's, so their "dated by the other king's reign" fact was refused.
- **"Other" dating entries are compared only within one historian's dates**, so two different historians' 609 BC does not wrongly refuse Neco before Jehoahaz.
- **Easy band for rulers:** the design's rule (both famous, 300+ years apart) gave only 73 easy pairs. Now: both well known and 300+ years apart, or a judge-before-Saul pair of two famous rulers.
- **Easy band for buildings:** 30 under the design's rule. Now: both well known and 400+ years apart, and the per-band minimum is 50 (the pool is under 40 items).
- **Bible Firsts holds 61 questions**, not 20–25, because the owner added 36.

## 8. Judgement calls the owner may want to check (all on the review sheet)

- **Buildings:** several order facts are drawn from the story's flow rather than one verse saying "before": Cain's city before Noah's ark, Noah's altar before Babel, the Hebron altar before Moriah, Moriah before Jacob's pillar, Samaria before Ahab's buildings.
- **Deaths:** three facts rest on Genesis arithmetic: Methuselah died in the Flood year; Ishmael died when Isaac was 123 and Jacob 63.
- **Journeys:** Paul reaches Rome at Acts 28:16 (not the summary at 28:14); Moriah is matched by "the place God had designated" and Ebenezer by "camp"; Jacob's Haran (Genesis 29:4) and David's Ziklag (1 Samuel 27:5–7) do not literally say "arrived"; Israel's later wilderness stops use the Numbers 33 list.
- **Bible Firsts (from the first 25):** Jubal is "the father of all who play the harp and flute" ("father of", not "first"); the tomb question offers "They came together" as a wrong answer.

## 9. Left for step 4

- **Translation registration:** the new generated files need their on-screen words registered for translation (the design's list for [extract.py](Jarvis/Projects/BibleProject/Website/content/translation/extract.py) and [language-packs.ts](Jarvis/Projects/BibleProject/Website/src/lib/language-packs.ts)), and each source file a line in [unregistered-reviewed.json](Jarvis/Projects/BibleProject/Website/content/translation/unregistered-reviewed.json) saying it is a build input no page reads. That goes with the game's loader, so it is left to step 4.
- **events.json is 502,579 bytes**: just over 500,000 bytes, though under 500 KB counted in 1,024s (about 491 KB). The design leaves this to step 4: if it counts as over, the build should drop the facts whose pair is also settled by windows at least 100 years apart.
- **A new player opens on Mixed** (owner's decision): a game setting, for step 4.
