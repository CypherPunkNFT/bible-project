# Verse completion — design

**Step:** sequence 30, step 10 (research & design), 2026-11-07. Recovery coverage check: step 11, 2026-11-09. One review completed in step 12, 2026-11-09 (§19). Next: implementation (step 13).
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 14, "Verse completion: shown the start of a verse, pick or type the rest; doubles as memorization."
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) and the site's [AGENTS.md](../../../AGENTS.md).
**The task brief also asked for:** how verses are chosen, a multiple-choice mode and a typed mode, forgiving answer matching, difficulty levels, and progress saved in the browser.
**Address:** `/games/verse-completion`. The registry entry `verse-completion` already exists as "coming soon" in [registry.ts](../../../src/pages/games/registry.ts), on the Solo shelf, with its art (`GAME_ART.verseCompletion`, "a scroll with one line left blank and a quill writing it in") already drawn in [art/index.ts](../../../src/pages/games/art/index.ts). This design keeps the slug, the shelf and the art.

---

## 0. Summary of decisions

| Question | Decision |
|---|---|
| Core game | A **round of 10 verses**. Each shows its reference and the opening words; the rest is hidden. You complete it by **picking** or **typing**, then see the whole verse with what you got right marked, and a link to read it in context (§3). |
| Where the verses come from | A **hand-curated pool of about 600 passages** (one to three verses each, one book, at most 45 words), stored as **verse ids only**. The words load at play time from the site's own Berean Standard Bible (BSB). Candidates are ranked by the total votes on their own outgoing cross-references in the site's data, a discovery proxy that surfaces the well-known verses (John 3:16, Jeremiah 29:11, Proverbs 3:5, Psalm 23:1). A person then checks them by hand. Each passage gets a **fame tier**: Famous, Well known or Deeper (§4). |
| Pick mode (multiple choice) | **Easy and Medium:** choose the right ending from **three**. The two wrong endings are real endings of other verses of similar length and shape, chosen when the data is built. **Hard:** rebuild the ending **word by word**, choosing from three words each time (§5.1). |
| Type mode | Type the rest of the verse. Two input styles: **Whole words** (the default), or **First letters**, where one key per word reveals that word. First letters is quicker on a phone and cannot be given away by the keyboard's word suggestions (§5.2). |
| Forgiving matching | Case, punctuation, quote styles, dashes and apostrophes are ignored. Contractions, British spellings and number words are accepted. Each word gets a typo allowance that grows with its length, unless the typo spells a different real word. Words are lined up one by one, so one missed word does not mark everything after it wrong. Every word is shown as right, typo-accepted, near (wrong ending, half credit), wrong or missing. Typing the shown opening again is fine (§6). |
| Difficulty | **Easy:** Famous verses, most of the verse shown, only the last part hidden. **Medium:** Famous and Well known verses, about half hidden. **Hard:** every tier, only the opening few words shown, and word-by-word picking in Pick mode. The split points are worked out once at build time, at natural pauses in the sentence (§7). |
| Memorisation | **My verses**: any passage can be added with one tap, and missed ones can be added all at once at the end of a round. Each added passage climbs **five review boxes**, coming back after 1, 3, 7, 14 and 30 days. Correct typed answers move it up; picking can lift it only to box 2, because choosing from options is weaker practice than recalling the words. A miss sends it back to box 1. Passing box 5 marks it **Memorised**. A **Review** button plays the due passages with only their opening words shown (§8). |
| Progress in the browser | One localStorage record (`bp-verse-completion`), rebuilt field by field on every read so damaged data cannot break the page. It holds settings, per-passage progress, the last 60 passages played (so rounds don't repeat), a day streak and a round in progress, so a reload resumes where you were. The game plays normally without storage (§9). |
| Language | The page's words are translated like the other games. The verses are always the English BSB, because the matching rules are English-specific. The help says so (§12). |
| No daily puzzle, no sharing | The spec asks for a game that doubles as memorisation, not a daily shared puzzle, so this version has neither. That is listed as an open point (§16). |
| Cost | **$0.** No runtime model and no new service. The pool is curated once, in the implementer's own session, using a local script that ranks candidates (§14). |

---

## 1. What the spec fixes, and what this design decides

The owner's entry is one line. It fixes three things:

- **"Shown the start of a verse":** the prompt is always the *opening* of a passage. It is never a gap in the middle and never a reference alone.
- **"Pick or type the rest":** two answer modes. Picking is multiple choice; typing is free recall.
- **"Doubles as memorization":** the game must actually help people learn verses by heart. That means repeated recall, spaced over days, of the *same* verses, plus some way to keep and come back to the verses you are learning (§2.2).

Everything else is decided here and checked by the review: which verses, how much is hidden, how answers are judged, how difficulty works, and what is remembered between visits.

---

## 2. Research

### 2.1 Verse-memory apps already out there

| App | How it works | Taken / left |
|---|---|---|
| **The Bible Memory App** (formerly Scripture Typer, [biblememory.com](https://biblememory.com/pages/users-manual)) | Three stages per verse. **Type It:** the text is visible and you type each word's first letter. **Memorize It:** only every second or third word shows, and different words drop out each pass. **Master It:** a blank box. A wrong letter fills that word in red and lowers the score. Mastering or passing a review needs **90% accuracy**. Options let you type every letter, or include or skip punctuation and the reference. Mastered verses go into spaced review with reminders; the algorithm is not published ([bulletin 446](https://biblememory.com/bulletin/446)). | **Take** the first-letter input, the 90% bar for "passed", and ignoring punctuation. **Leave** accounts and reminders. |
| **Verses** ([App Store](https://apps.apple.com/us/app/verses-bible-memory/id939461663)) | Six games in a fixed order: Tap to Reveal, Listen, Reorder, **Word Bank** (starts easy and removes more words each time), Type Out (first letters), Speak Out. A "memory health" indicator says when to review. | **Take** the idea that the easier modes are steps towards typing, and a visible measure of how well a verse is known. |
| **Remember Me** ([remem.me](https://www.remem.me/how-rm-works/practice/), free and open source) | Flashcards, first letters, word-by-word typing, gap fill and word puzzles. Verses sit in boxes (New, Due, Known). Reviews come after **1, 2, 4, 8, 16… days**, and a failed review sends the verse back to the start. Daily goal and streaks. | **Take** the box system with growing gaps and a reset on failure, plus the day streak. |
| **VerseLocker** ([Scripture Memory Fellowship](https://scripturememory.com/verselocker/)) | Blur, initials, word choice, typing, audio loop. Badges and a leaderboard. | **Take** word choice as an easier mode. **Leave** leaderboards (no accounts here). |
| **Fighter Verses** ([help page](https://fighter-verses.appspot.com/ios-help.html)) | Quick Blanks, Typing, Type First Letter (the right letter fills the word in), Word Bank, trivia multiple choice. Its own help admits that **guessing lets you pass without knowing the verse**, and reviews come daily, weekly or monthly. | **Take** first-letter auto-fill. **Fix** the guessing problem: picking alone can never mark a verse Memorised (§8). |
| **YouVersion Bible Loop** ([memory levels](https://help.youversion.com/l/en/article/voabe8h9uq-memory-verse-levels)) | Level 1: fill blanks from a word bank. Level 2: the **whole verse blank, with three word choices per blank**. Level 3: first letters. Level 4: write or speak the whole verse. Levels unlock in order. | **Take** three choices per word as the hardest picking mode (Pick at Hard). |
| **Clozemaster** ([review](https://togetherwelearnmore.com/clozemaster-complete-review/)) | Fill-the-gap sentences, multiple choice or typed. **Typing scores double.** You can switch one sentence to multiple choice partway. | **Take** the principle that typed answers count for more. |
| **Duolingo** ([how answers are checked](https://blog.duolingo.com/how-user-reports-improve-course-content)) | Answers are compared with lists of accepted answers. Small slips are accepted with a "You have a typo" note (the exact rule is not published). | **Take** "accepted, but we show you the slip". |
| **Dwell** ([review](https://timwildsmith.com/reviews/dwell-app)) | Audio only: loop a passage with pauses for reflection. No quizzes. | Not relevant beyond confirming that the market splits into listening apps and quiz apps. |

**The proposed browser experience:** no account and no install, a curated pool with the opening always shown, word-by-word feedback, and browser-saved review boxes. This is a product proposal, not a verified market-uniqueness claim. App details and research qualifications remain as recorded in §18; numerical thresholds and review gaps are design choices.

### 2.2 What the learning research says

- **Testing beats rereading.** Recalling something from memory strengthens it more than studying it again, and the gap grows with delay (Roediger & Karpicke 2006, [doi:10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x)). So the game always asks before it shows.
- **Producing the words beats reading them** (the generation effect: Slamecka & Graf 1978, [doi:10.1037/0278-7393.4.6.592](https://doi.org/10.1037/0278-7393.4.6.592); a meta-analysis by Bertsch et al. 2007, [doi:10.3758/BF03193441](https://doi.org/10.3758/BF03193441), reports a moderate average effect). So typing is the main memorisation mode.
- **Typed recall beats multiple choice for retention**, when feedback follows (Kang, McDermott & Roediger 2007, [doi:10.1080/09541440601056620](https://doi.org/10.1080/09541440601056620)). Multiple choice can also plant the wrong options in memory, and showing the right answer afterwards reduces that (Marsh et al. 2007, [doi:10.3758/BF03194051](https://doi.org/10.3758/BF03194051); Butler & Roediger 2008, [Memory & Cognition 36](https://link.springer.com/article/10.3758/MC.36.3.604)). Multiple choice with *plausible* wrong options does still make people retrieve (Little et al. 2012, [doi:10.1177/0956797612443370](https://doi.org/10.1177/0956797612443370)).
  - **What follows for the game:** Pick is the easy entry point, the wrong options must be plausible, and the whole correct verse is always shown after every answer. Pick can lift a passage only partway up the review boxes.
- **Cues that shrink over time help.** Practice with gradually reduced partial cues beat both restudy and plain testing for hard material (Fiechter & Benjamin 2018, [doi:10.3758/s13423-017-1366-9](https://doi.org/10.3758/s13423-017-1366-9)). This supports Easy → Medium → Hard showing less and less of the verse, and Review showing only the opening words. No controlled study of the first-letter method for long passages was found; the apps' claims are anecdotal, so this design offers it as an input style, not as a learning claim.
- **Spacing.** Reviews spread over growing gaps beat reviews crammed together. The best gap grows with how long you want to remember (Cepeda et al. 2008, [doi:10.1111/j.1467-9280.2008.02209.x](https://doi.org/10.1111/j.1467-9280.2008.02209.x)). The Leitner box system moves a card up one box when you get it right and back to the first box when you miss. The SM-2 algorithm (SuperMemo) uses gaps of 1 day, then 6 days, then the previous gap times an ease factor ([SuperMemo](https://www.supermemo.com/en/archives1990-2015/english/ol)). A **five-box Leitner list** is chosen here because players can understand it at a glance ("box 3 of 5, back on Thursday") and it needs no per-verse ease number.

### 2.3 Wrong options for multiple choice

The standard item-writing guidelines (Haladyna, Downing & Rodriguez 2002, [PDF](https://cmapspublic3.ihmc.us/rid=1P2XTLCSS-11K09T9-BD5/Haladyna_2002_-Appl_Meas_Educ.pdf)) say every wrong option should be plausible, and options should be about the same length. A meta-analysis found **three options** works as well as four or five (Rodriguez 2005, [PDF](https://edmeasurement.net/8268/Rodriguez-2005-Random-effects-meta-analysis-three-options.pdf)). For verse endings that means wrong endings taken from **real verses** of similar length, ending with the same kind of punctuation, cut at a similar natural pause, and never the longest or shortest option every time (§5.1).

### 2.4 Typing on phones

- `autocorrect="off"` (now widely supported, [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocorrect)), `autocapitalize="none"`, `spellcheck={false}` and `autocomplete="off"` stop the phone from "fixing" answers.
- **Nothing a web page does can hide the iPhone's word-suggestion bar** ([Apple](https://support.apple.com/en-ng/104995), [Apple developer forums](https://developer.apple.com/forums/thread/696748)), and suggestions can draw on words on the page. The First letters style sidesteps this: one key per word gives the keyboard nothing to suggest.
- **iOS Smart Punctuation** turns straight quotes into curly ones and `--` into a dash, with no way for a page to stop it. The matcher therefore treats all quote and dash forms as the same (§6.1).
- **Android keyboards** often send key code 229 for every key in `keydown`, so the First letters style reads characters from the input's `input` event instead (§5.2).

### 2.5 What this site already has (checked in the code and data, 2026-11-07)

- **The games hub** ([README.md](../../../src/pages/games/README.md)). A game goes live by setting `status: "live"` and `load` on its registry entry. Each game has exactly **one address**, so every screen here is state inside one page. The hub's own test, [games.test.tsx](../../../src/pages/games/games.test.tsx), checks every registry entry.
- **Bible text.** The BSB is at `data/plain/bsb/<BOOK>.json` (`{"3:16": "…"}`), 66 files, 31,086 verses. Plain text has no footnotes or headings, but keeps curly quotes and em dashes. Verses the BSB leaves out (for example Matthew 17:21) are simply absent. Compressed, a book file is 0.8 KB (2 John) to 77 KB (Psalms), with a median of 11 KB.
- **No page may store a verse's wording.** [check-verse-wording.py](../../../scripts/check-verse-wording.py) runs before every build and fails if any file outside the Bibles holds a whole verse of ten words or more. Pages store verse ids (`BBCCCVVV`, e.g. John 3:16 is 43003016) and load the words through [verses.ts](../../../src/lib/verses.ts): `resolveRange(catalog, start, end, "bsb")` returns a passage's verses, and the book files are fetched once per session by `loadPlain` in [data.ts](../../../src/lib/data.ts). Tests read the BSB from disk with [bsb-for-tests.ts](../../../src/lib/bsb-for-tests.ts).
- **References and links.** `formatRange` in [refs.ts](../../../src/lib/refs.ts) writes "John 3:16–17". The reader route is `/read/<bible>/<BOOK>/<chapter>`, with `?v=16` to select a verse and `?hl=16-18` to shade a range. Similar link helpers exist in [passage.ts](../../../src/pages/life-events/passage.ts) and [deck.ts](../../../src/pages/games/charades/deck.ts).
- **Cross-references** at `data/xref/<BOOK>/<chapter>.json`. Each verse lists `[target, end, votes]`. Adding up the votes on the references a verse *gives* is a good measure of how well known it is (measured below).
- **Curated verse lists that hold ids only:** life-event packs ([src/data/life-events/](../../../src/data/life-events/), about 182 passages, 115 marked as card verses), sympathy ([src/data/sympathy/](../../../src/data/sympathy/), about 160, 120 card verses) and countdowns ([src/data/countdowns/](../../../src/data/countdowns/), 76 card verses). Card verses are short, warm and well known, so they are good candidates. There is no memory-verse or verse-of-the-day list on the site yet.
- **No fuzzy-matching code exists.** There is no edit-distance helper anywhere in `src/`. [search-language.ts](../../../src/lib/search-language.ts) has `foldWord` (lower case, accents removed) and word splitting with `Intl.Segmenter`, which the matcher can reuse for splitting.
- **Patterns from the other games:** Map quest's [daily.ts](../../../src/pages/games/map-quest/daily.ts) gives local calendar-day numbers that survive daylight-saving changes (`calendarDay`). Bible Wordle and Timeline sort keep their records in localStorage under `bp-wordle` and `bp-timeline`, rebuilt field by field. Timeline keeps the last 60 practice items to avoid repeats. Game data lives in `src/data/<game>/`, built by `node --experimental-strip-types scripts/build-<game>.ts`. On-screen labels are written as `{ label: "…" }` objects so the translation collector finds them ([wordle/text.ts](../../../src/pages/games/wordle/text.ts)).
- **Languages.** The site is released in English, Spanish, Brazilian Portuguese, Simplified Chinese, Arabic, Hindi and Indonesian. Every existing game keeps its game words in English in every language and says so in its help.
- **Licence.** The BSB has been dedicated to the public domain since 30 April 2023 ([berean.bible terms](https://berean.bible/terms.htm); also [SOURCES.md](../../../SOURCES.md) and [NOTICE.md](../../../NOTICE.md)). Attribution is appreciated but not required. The one request is not to call an altered text the BSB, and this game shows verses unaltered.

### 2.6 The BSB, measured for this game (throwaway script, this job)

- **Verse length:** median 22 words. One verse in ten is 12 words or fewer, and one in ten is 37 or more.
- **Punctuation in the text:** commas, full stops, semicolons, question and exclamation marks, colons, hyphens, brackets, curly double quotes (about 6,700 pairs), curly apostrophes and single quotes (about 3,600 and 1,450) and em dashes (about 1,670). Em dashes often join two words with no space ("salvation—whom"), so they must split words (§6.1).
- **Verses that are not a whole sentence:** 2,748 start in lower case (they continue the verse before) and 3,893 do not end with a full stop, question or exclamation mark. Such verses enter the pool only joined to their neighbours (§4.2).
- **Digits:** 498 verses contain digits, nearly all census figures such as "22,600". None suits the game, but the matcher still handles numbers (§6.1).
- **How well known a verse is.** Adding up the votes on each verse's own cross-references puts these at the top: Romans 8:29, Isaiah 41:10, Isaiah 44:3, Romans 12:2, Jeremiah 29:11, John 3:16, Proverbs 3:5, Philippians 4:13, Matthew 6:33, Proverbs 4:23, Genesis 1:1. Psalm 23:1 and John 1:1 are in the top 25. Votes on references *pointing to* a verse rank worse (an obscure verse such as Ephesians 4:22 reaches the top 25), so they are not used.
- **How many good candidates there are.** Single verses of 8–40 words that are a complete sentence:

| Total votes on the verse's own cross-references | Verses | Of which 8–40 words and a complete sentence |
|---|---|---|
| 2,000 or more | 63 | 51 |
| 1,200 or more | 144 | 117 |
| 800 or more | 271 | 221 |
| 500 or more | 544 | 430 |
| 300 or more | 1,149 | 867 |

  Fame fades between 300 and 500 votes. Rank 200 is Matthew 7:24 (974 votes), rank 400 John 5:24 (620), rank 1,000 Hebrews 10:5 (328). About **600 passages** is therefore realistic: roughly 430 strong single verses, plus multi-verse passages (Proverbs 3:5–6, Philippians 4:6–7) and the site's curated card verses.
- **Vocabulary:** the BSB uses 14,369 distinct words once lower-cased with apostrophes removed. As a list that is 143 KB, or 42 KB compressed. The typo rule uses it (§6.3).

---

## 3. How a round plays

1. **Start screen.** Choose **Pick** or **Type** (and, for Type, the input style), then **Easy**, **Medium** or **Hard**, and optionally **Old Testament only** or **New Testament only**. Press **Play**. If any of your saved verses are due, a **Review (n due)** button sits above Play (§8.3).
2. **Ten passages, one at a time.** Each card shows:
   - the reference at the top ("Proverbs 3:5–6"), because knowing where a verse is comes with knowing it, and every memory app shows it;
   - the shown opening words, in large type;
   - a row of short grey lines standing for the hidden words, one line per word, so you can see how much is left;
   - the answer area for the mode (§5).
3. **After each answer** the whole passage is shown with each hidden word marked (§6.5), plus the card's stars (§3.1), a **Read in context** link (opens the reader in a new tab, so the round is not lost), an **Add to My verses** toggle (§8.1) and **Next**.
4. **"I don't know"** is always available. It reveals the passage and scores the card 0 stars. It is not a failure screen: the passage is shown the same way, so the player still learns it.
5. **Round summary** after ten cards: total stars out of 30, each passage as one row with its stars, **Add all missed to My verses**, **Play again** (same settings) and **Change settings**.

### 3.1 Stars

Every card earns 0–3 stars from its **accuracy**, the share of hidden words the player got right (§6.4):

| Accuracy | Stars |
|---|---|
| 90% or more (the game's chosen "passed" threshold) | three |
| 70–89% | two |
| 40–69% | one |
| below 40%, or "I don't know" | none |

- **Pick at Easy and Medium** is all or nothing: the right ending is 100%, a wrong one 0%.
- **Pick at Hard and both Type styles** use the word-by-word accuracy.
- A word revealed with the **Show next word** hint (Type only, §5.2) counts as wrong.
- A **word-perfect** card (Type, Whole words only, every word exact, no extra words, no typos, no hints) gets a small "Word perfect" mark beside its stars. It costs nothing to show and rewards care.

Stars are the only score. There is no timer: memorising is not a race, and a timer would punish slow typists on phones.

---

## 4. The verse pool

### 4.1 What a passage is

A **passage** is one to three consecutive verses in one book, 8 to 45 words in total in the BSB, that starts at the start of a sentence and ends at the end of one. Most are single verses. Two- and three-verse passages exist because many of the verses people learn are really pairs, such as Proverbs 3:5–6, Philippians 4:6–7 and Isaiah 40:30–31.

### 4.2 Choosing them (a one-time job, done by the implementer)

1. **A candidate script** ranks every BSB verse by the total votes on its own cross-references (§2.6), and adds the card verses from life-event packs, sympathy and countdowns. For each candidate it reports the word count, whether it is a whole sentence, and, if not, the smallest neighbouring range (up to three verses) that is. It writes a candidate sheet to the implementer's scratch space, not into the site.
2. **The implementer reads the sheet and curates** in their own session, writing the chosen passages into `curation.json` (§11). No model is needed. In keeping with the workspace rule on batch work, this is never done with one agent per verse. Rules for the pool:
   - **Keep** verses people know, quote, learn or would want to learn: comfort, promises, commands of Jesus, well-known Psalms and Proverbs, the great statements of faith.
   - **Leave out** genealogies, census figures and any verse with digits; verses that only make sense with the verse before ("Therefore…" is fine if the verse stands on its own); and verses unsuitable for a family game (violence, sexual content). The hub lists this game for solo play, but children use it too.
   - **Split pairs sensibly.** Where the famous part is one verse of a pair (John 3:16), keep that verse alone. Add the pair as its own passage only if the pair is also well known.
   - **Balance.** At least a third of the pool from the Old Testament (Psalms, Proverbs, Isaiah and the Torah are strong there), and no book above 12% of the pool (Psalms will press on that limit).
3. **Fame tier**, one per passage, set by the curator using the votes as a guide:
   - **Famous** (about 150): verses most churchgoers would recognise (John 3:16, Psalm 23:1, Jeremiah 29:11, Philippians 4:13, Genesis 1:1, Romans 8:28).
   - **Well known** (about 250): widely quoted and taught (Matthew 7:24, Isaiah 26:3, 2 Timothy 1:7, Micah 6:8).
   - **Deeper** (about 200): worth knowing, less often heard (Zephaniah 3:17, Habakkuk 3:17–18).
4. **Retiring, never deleting.** Once the game is live, a passage that needs to go is marked `retired: true`: never dealt again, but its entry stays, so saved progress and a round in progress never point at nothing. This is the same rule Bible Wordle's review settled.

### 4.3 What the build works out for each passage

The build script reads the BSB from disk and, for each passage, works out and stores the following. All of it is numbers, never wording (§11):

- **`words`**: how many words the passage has, by the matcher's own word splitting (§6.1). The test suite re-counts these from the BSB, so a change in the Bible text is caught at once.
- **`split`**: for each difficulty, the word index where the hidden part starts (§7.2).
- **`decoys`**: for Pick at Easy and Medium, two other passages per difficulty whose endings serve as the wrong options (§5.1).
- **`stamp`** (one for the whole pool file): a deterministic hash of the complete generated pool, canonical BSB text of every included passage, vocabulary and a matcher/rules version. Text, decoy and retirement changes invalidate rounds even when word counts stay unchanged; wording participates in the hash but is not emitted into the pool. The stored record keeps it, so a round in progress from an older pool is dropped (§9).

### 4.4 Loading the words at play time

- The page loads the pool file (ids and numbers only, roughly 40 KB) with `import()`, then the BSB book files it needs through `resolveRange(catalog, from, to, "bsb")`.
- **A round is dealt with at most two passages per book** (§7.3), and each Easy or Medium card's decoys come from the **same book where possible** (§5.1). So a round fetches about 8 book files, roughly 150 KB compressed in all, each only once per session.
- **The first card waits only for its own book.** The rest load in order in the background while the player answers. If a later book is slow, its card shows a short "Loading the verse…" line in place of the text.

---

## 5. Answer modes

### 5.1 Pick (multiple choice)

**Easy and Medium: choose the ending.**
- Three buttons, each showing an ending in full: the right one, and the endings of the two decoy passages cut at those passages' own split points for the same difficulty. Their order is shuffled per card.
- **How the build chooses decoys.** They are stored as passage ids, so the choice is deterministic and testable:
  1. Candidates are other active passages whose ending at this difficulty has a word count within 30% of the right ending's (at least ±2 words), and whose ending finishes with the same kind of mark (full stop, question mark or exclamation mark).
  2. **Prefer the same book** (no extra download, and often a similar style). Otherwise prefer the same testament.
  3. Never use an ending whose first three or last three words match the right ending's after normalising (§6.1), so no two options look identical. Never use a passage that shares a verse with this one.
  4. Prefer candidates that share a content word with the shown opening (for example "LORD", "love", "heart"), which makes them plausible.
  5. Of what is left, choose so that the right ending is not always the longest or the shortest. Across the pool, the right ending should be the longest of the three on about a third of cards; the build reports the share and a test checks that it lies between 25% and 42%.

All three endings must be pairwise distinct after normalisation, including the two decoys. A curator checks every resulting prompt for grammatical fit, plausible wrong options and exactly one correct continuation. Emit a local BSB-resolved review sheet for this check, never bundled verse wording. If two eligible decoys cannot be found, fail the builder with the passage id rather than inventing an ending. Measure the longest-option share separately for Easy and Medium, counting ties fractionally.
- **Answering:** one tap. A right answer turns that button green with a tick. A wrong one turns red with a cross, and the right one is marked with a tick. Both then show the full passage.

**Hard: word by word.**
- The hidden part is rebuilt one word at a time. For each hidden word, three word buttons appear: the right word and two others.
- **The two other words** are chosen in the browser from words already loaded, with a seeded random number generator (seeded by passage id and the round's seed, so a reload shows the same choices):
  1. First choice: a word from **later in this same passage** (one of the next four hidden words), which tests the order.
  2. Then words from the passage's decoy passages and from its own book.
  3. Never a word that normalises to the same form as the right word, never the same word twice, and never a word that differs from the right one only by its ending (as defined for "near" in §6.3). Such a pair would be a trick, not a test.
  4. Prefer the same capitalisation (a capitalised right word gets capitalised options) and a similar length (within two letters).
- **Answering:** a right tap places the word and moves on. A wrong tap shakes that button (no motion with reduced motion), marks the word as missed, then places the right word and moves on. There is one try per word, so the score is honest. Punctuation is attached to each placed word automatically.
- **Keyboard:** keys **1**, **2** and **3** choose the buttons left to right.

For Hard, use the union of the Easy and Medium decoy passages. Relax length/capitalisation preferences if necessary, then traverse distinct words in the loaded book deterministically. Never relax uniqueness or the ending-exclusion rule; if two wrong words still cannot be found, mark the card unavailable (§10.7). Wait for all required decoy books before enabling Pick, so only the correct option is never briefly visible. Apply identical punctuation/capitalisation styling to all word buttons to avoid formatting clues.

### 5.2 Type

One text box below the shown opening, with `autocomplete="off"`, `autocorrect="off"`, `autocapitalize="none"`, `spellcheck={false}` and `enterKeyHint="done"`. Its label, read to screen readers, is "Type the rest of the verse".

**Whole words (default).**
- Type the rest and press **Check** (or Enter; Shift+Enter makes a new line). The matcher (§6) scores it.
- **Show next word**: align the current answer (§6.4), find the earliest target without full credit and insert or replace its aligned answer token at that position, preserving the rest. Track hinted target indices in a set; each always scores zero even if later retyped or realigned. Repeated words must not transfer the penalty to another occurrence. Disable the hint when all targets have full credit. Show the count of distinct hinted targets.
- Input is capped at 600 characters. The builder verifies every full passage fits this cap; word count alone does not bound character length.

**First letters.**
- Type the first letter of each hidden word, in order. Each key reveals one word at once:
  - **right letter:** the word appears in the normal colour;
  - **wrong letter:** the word appears struck through with a cross and counts as wrong, and play moves on. There is one try per word, as in the Bible Memory App.
- The "first letter" is the first letter or digit of the word after normalising (§6.1), so "LORD’s" is **l** and "‘Do" is **d**. Case does not matter.
- **How keys are read:** a real, visible input box keeps the phone keyboard open. Characters are read from its `input` event and the box is emptied after each one, because many Android keyboards report every key as code 229 in `keydown`. Pasting several characters takes them one at a time.
- No hint button: one key per word is already the lightest possible help.

For First letters consume letters/digits only, ignoring spaces and punctuation. Defer composition until `compositionend`, process committed text once, and prevent duplicate input/composition events from advancing twice. Stop at the final target and lock the card before revealing the result. Backspace cannot undo a scored attempt.
- **Why it exists:** it is quicker on a phone, and the keyboard's suggestion bar has nothing to give away. The accuracy it measures is the share of first letters right. It can lift a passage only to box 4 (§8.2), because a first letter is a strong cue.

---

## 6. Answer matching (Type, whole words)

The goal: **forgive slips, never forgive a different word.** Memorising means the right words in the right order, but nobody should lose a star for a missing comma, a capital letter or "honour" spelt the British way.

### 6.1 Normalising (applied to both the typed answer and the passage)

In this order:

1. Unicode **NFKC** (turns odd widths and ligatures into ordinary letters), then **lower case**.
2. **Apostrophes removed**, every form (`'` `’` `‘` `ʼ`): "God’s" and "Gods" both become `gods`.
3. **Dashes and hyphens become spaces**, every form (`-` `‐` `–` `—` `―`). "salvation—whom" becomes two words, and "burnt-offering" matches "burnt offering". The passage is split the same way, so word counts agree.
4. **`&` becomes `and`.** Commas between digits are removed ("1,000" becomes `1000`).
5. **Every other character that is not a letter or digit becomes a space**: quotes of every kind, brackets and all punctuation.
6. **Accents are removed** from Latin letters with the site's `foldWord` ("naïve" becomes `naive`). The text is then split on spaces.

### 6.2 Equivalent forms (applied word by word, both sides)

A small hand-kept table, `equivalents.ts`, maps alternative forms onto the BSB's:

- **Contractions** expand: `dont` → `do not`, `wont` → `will not`, `cant` → `cannot`, `im` → `i am`, `youre` → `you are`, `theyre` → `they are`, `isnt` → `is not`, `shouldnt` → `should not`, and the other common `n't` forms. `its`, `ill`, `well`, `shell` and `were` are **not** expanded, because they are also real words. Expansion happens before lining up, so "don't be afraid" matches "do not be afraid". `can not` (two words) is joined into `cannot`.
- **British spellings** map to the BSB's American ones: honour, saviour, neighbour, favour, labour, colour, behaviour, splendour, judgement, worshipped, counsellor, fulfil, recognise, realise, and so on. The table lists each pair explicitly. There is no automatic rule, because automatic rules produce false matches.
- **Number words and digits** are the same: `forty` ↔ `40`, `three` ↔ `3`, `thousand` ↔ `1000` (0–20, the tens, hundred, thousand). The pool avoids digits, so this matters little, but it costs a few lines.
- **"LORD", "Lord" and "lord"** are already the same after lower-casing. The capitals in the BSB's "LORD" are a translation convention, not a word to memorise.

### 6.3 Judging one typed word against one passage word

| Verdict | Rule | Credit |
|---|---|---|
| **Exact** | The same after normalising and the equivalents table. | 1 |
| **Typo** | Not exact, but all three hold: (a) the Damerau–Levenshtein distance (letters added, removed, changed, or swapped with a neighbour) is within the allowance for the passage word's length: **0 for 1–3 letters, 1 for 4–6, 2 for 7 or more**; (b) the first letter matches (a swap of the first two letters is allowed); (c) the typed word is **not itself a BSB word** (the 14,369-word vocabulary, §2.6). Rule (c) stops "live" passing for "love", or "lord" for "word". | 1, shown with a dotted underline and a note: "accepted: you typed *shephard*" |
| **Near** | Not exact or typo, but the two words differ only by a common ending: one is the other plus `s`, `es`, `ed`, `d`, `ing`, `eth`, `th` or `ly` (e.g. "believe" for "believes"). | ½, shown as near, with the right word |
| **Wrong** | Anything else, including a different real word. | 0 |

### 6.4 Lining up the answer with the passage

People drop a word, add one, or swap two. Comparing position by position would mark everything after the first slip wrong, so the words are lined up first.

- **Word-level alignment.** Needleman–Wunsch, a standard dynamic-programming method that works like a diff, lines up the typed words with the hidden passage words at the lowest total cost. An exact pair costs 0, a typo 0.1, a near pair 0.5 and a wrong pair 1. Skipping a passage word (missing) or a typed word (extra) costs 1 each. Ties are broken towards the alignment that gives the player more credit, then towards pairing over skipping. A hidden part is at most 45 words and the input at most 600 characters, so the table is tiny.
- **Typed the shown opening again?** Compare the unchanged answer with a prefix-stripped candidate only when the entire normalised shown opening matches its prefix. Choose the higher accuracy; prefer unchanged input on a tie. Never discard words just because the first two match: a repeated phrase can legitimately begin the hidden ending.
- **Typed the reference?** A leading or trailing reference such as "Proverbs 3:5" or "John 3 16" is removed if it matches this passage's reference.

Parse the exact book/chapter/verse or range at an input boundary before punctuation is stripped, then compare opening-removal candidates. Never strip arbitrary numbers or a different passage reference.
- **Accuracy** = total credit ÷ (hidden words + extra words × ½), capped between 0% and 100%. Extra words cost half each, so a stray "and" barely matters but pasting a paragraph does.
- **Two passage words typed as one** ("burntoffering"), or one typed as two, are handled where the equivalents table lists them. Elsewhere they score as one wrong and one missing word. That is honest and rare.

### 6.5 Showing the result

The whole passage is shown, with the opening in normal weight and each hidden word marked:

- **exact:** plain, with a tick for screen readers;
- **typo:** dotted underline, with what was typed shown on tap or focus;
- **near:** the right word with a half marker and what was typed;
- **wrong:** the right word highlighted, with what was typed struck through beside it;
- **missing:** the right word highlighted with a "missed" marker;
- **extra** typed words are listed under the verse ("Also typed: *and*, *the*"), not woven into it.

Every state has its own symbol and text label, never colour alone (§12).

### 6.6 Worked examples (each becomes a unit test, §13)

| Hidden part (BSB) | Typed | Result |
|---|---|---|
| "I shall not want." | `i shall not want` | 4 exact → 100% |
| "lean not on your own understanding;" | `lean not on your own understandin` | 5 exact + 1 typo → 100% |
| "lean not on your own understanding;" | `don't lean on your own understanding` | expands to "do not lean on your own understanding". The words are right but the order is not: "lean on your own understanding" pairs exactly, the passage's "not" is missing, and "do" and the early "not" are extra → 5 ÷ (6 + 2 × ½) = 71%, two stars |
| "the Word was God." | `the lord was god` | "lord" is a BSB word, so wrong → 3 ÷ 4 = 75% |
| "everyone who believes in Him" | `everyone who believe in him` | 4 exact + 1 near → 4.5 ÷ 5 = 90% |
| "My grace is sufficient for you," | `my grace is enough for you` | "enough" wrong → 5 ÷ 6 = 83% |
| "and the Word was with God," | `and the word was god` | "with" missing; the rest lined up and exact → 5 ÷ 6 = 83%, not 2 ÷ 6 |
| "who gives me strength." | `who gives me strenght` | neighbouring letters swapped, distance 1, 8 letters, not a BSB word → typo → 100% |
| "I shall not want." (shown: "The LORD is my shepherd;") | `Psalm 23:1 The Lord is my shepherd, I shall not want` | reference removed, retyped opening removed → 100% |
| "honor your father" | `honour your father` | British spelling → exact → 100% |

---

## 7. Difficulty

### 7.1 What each level changes

| | Easy | Medium | Hard |
|---|---|---|---|
| Verses dealt | Famous only | Famous and Well known (60 : 40) | all tiers (Famous 30%, Well known 40%, Deeper 30%) |
| How much is hidden | the last part, about a third of the words | about half | everything after the opening few words |
| Pick mode | choose the ending from 3 | choose the ending from 3 | word by word, 3 choices each |
| Type mode | as chosen (Whole words or First letters) | as chosen | as chosen |

The **testament filter** narrows every tier. If a tier runs short (for example Easy with Old Testament only), the round is filled from the next tier.

### 7.2 Where the split falls (worked out once, by the build)

The split is placed at a **natural pause**, so the shown opening reads as a phrase and the hidden part as its completion.

1. **Candidate split points** are the word boundaries after a word followed by `,` `;` `:` `—` `.` `?` or `!`, and before a joining word (`and`, `but`, `for`, `that`, `so`, `because`, `who`, `which`, `when`, `if`).
2. **Targets**, as the share of the passage's words that is shown: Easy 0.65, Medium 0.45, Hard 0.2.
3. Choose the candidate nearest the target. If none lies within ±0.15 of it, split at the word nearest the target instead.
4. **Limits, applied last:** at least **2 words shown** and at least **3 words hidden**; Hard shows at most 6 words. If Easy and Medium land on the same point in a short verse (Psalm 23:1, "The LORD is my shepherd; | I shall not want."), that is fine.
5. **A curator may override** any split in `curation.json`, for example to keep "For God so loved the world" together as the shown opening at Hard. The build checks overrides against the same limits.

6. Require `hard <= medium <= easy` after limits and overrides; reject violations. Break equal-distance split ties towards the earlier boundary. Keep offsets into the original BSB string for verbatim punctuation, spacing and dash joins; normalised tokens are comparison data only.

### 7.3 Dealing a round

- 10 passages from the level's tiers and the testament filter, leaving out retired ones.
- **None of the last 60 passages played** (stored, §9), as Timeline sort does. If the filter leaves too few, the oldest of those 60 come back first.
- **Unplayed passages first**, then the rest at random, so a new player sees variety and a regular player eventually meets the whole pool.
- **At most two passages per book** in a round. That keeps downloads small (§4.4) and a round varied.
- The random number generator is seeded per round and the seed is stored with the round, so a reload deals the same round.

Apply absolute exclusions first: retirement, due My verses passages and testament. Relax recent history oldest-first, then tier preferences, keeping the book cap. Never loop indefinitely: if fewer than ten unique non-overlapping passages fit, deal the available count and show it; if none fit, offer Review or another filter. Report available deck sizes per level/testament at build time. Reviews ignore recent history, tier, testament and the book cap, so settings cannot strand due passages.

---

## 8. Memorisation: My verses and the review boxes

### 8.1 Adding a passage

- **Add to My verses** is a toggle on every card's result and on every row of the round summary. **Add all missed** on the summary adds every passage that earned fewer than three stars.
- Nothing is added automatically. A list that fills itself with every verse played becomes a chore, and the point is to learn the verses the player *chose*.
- A newly added passage goes into **box 1** and is due **tomorrow**, since it has just been practised.

### 8.2 The five boxes

| Box | Comes back after | Meaning shown to the player |
|---|---|---|
| 1 | 1 day | Learning |
| 2 | 3 days | Learning |
| 3 | 7 days | Getting there |
| 4 | 14 days | Nearly there |
| 5 | 30 days | Nearly there; one more pass to be Memorised |
| Memorised | 60 days | Memorised (box 5 with a badge) |

**After a passage in My verses is answered**, in a review or in an ordinary round:

- **Passed** (90% or more):
  - if it was **due** (its due day is today or earlier), it moves **up one box**, subject to the ceiling below;
  - if it was **not yet due**, it stays where it is. This stops cramming from racing a verse to the top in one evening, the same rule Leitner boxes use.
- **Partly right** (70–89%): it stays in its box and comes back after that box's gap, counted from today.
- **Missed** (below 70%, or "I don't know"): it goes back to **box 1**, due tomorrow, and loses any Memorised badge.
- **Ceilings by answer style**, because recognising is weaker than recalling (§2.2):
  - **Pick** can lift a passage to **box 2** at most;
  - **First letters** to **box 4**;
  - only **Whole words** reaches box 5 and **Memorised**.
- **Memorised:** a whole-words pass of a due passage in box 5 sets the badge and the next review 60 days on. Memorised passages still come back, because verses fade without review.

**Promotion requires the Hard split**, in Review or one-card practice. Easy/Medium passes earn stars but cannot advance a box, postpone its due date or renew a badge. A due Hard pass below the answer-style ceiling moves up one box and sets `due = today + gap(new box)`. A pass at or above its ceiling preserves box and due date and explains which stronger style is needed; it never demotes prior progress. Early passes preserve box/due. A 70–89% result clears any Memorised badge (box 5 then uses 30 days); a miss resets as above at any difficulty. Renewing a Memorised badge requires a due Hard Whole-words pass. Adding a result starts at box 1 without also promoting from that same answer.

### 8.3 Review rounds

- **Review (n due)** appears on the start screen whenever at least one passage is due. It plays up to 10 due passages, the most overdue first.
- Review always uses the **Hard split** (only the opening words shown, §7.2), because the aim is recall from the smallest cue. It uses the player's chosen answer mode, so Pick in a review is word by word.
- If more than 10 are due, the summary offers **Review the next 10**.
- Ordinary rounds never deal a due passage from My verses ahead of the review, so the review keeps its purpose. They may deal passages from My verses that are not due, which count as described above.

### 8.4 Day streak

- A day counts when the player finishes at least one round or review on it, using the **local calendar day** (`calendarDay` from Map quest's [daily.ts](../../../src/pages/games/map-quest/daily.ts), which survives daylight-saving changes).
- Finishing on the day after the last counted day adds one; a gap starts again at 1. The streak shown is 0 once a whole day has been missed, but today does not break it until today is over (the same rule as Bible Wordle).

---

## 9. Progress saved in the browser

**Key:** `bp-verse-completion` in localStorage. Like Bible Wordle's and Timeline sort's records, it is **rebuilt field by field on every read**: an unknown, damaged or hand-edited value comes back as a sound record and never breaks the page.

```ts
interface VerseCompletionRecord {
  v: 1;
  settings: {
    answer: "pick" | "type";
    style: "words" | "letters";          // Type only
    level: "easy" | "medium" | "hard";
    testament: "all" | "ot" | "nt";
  };
  seenHelp: boolean;
  /** Only passages the player has played or added. Keyed by passage id (e.g. "jhn-3-16"). */
  passages: Record<string, {
    played: number;                      // times answered
    best: number;                        // best accuracy, 0–100
    last: number;                        // local day number last answered
    box: 0 | 1 | 2 | 3 | 4 | 5;          // 0: not in My verses
    due: number;                         // local day number it is next due (box > 0)
    memorised: boolean;
  }>;
  recent: string[];                      // last 60 passage ids dealt, newest last
  days: { streak: number; best: number; last: number };
  totals: { rounds: number; cards: number; stars: number };
  round: {                               // the round in progress, or null
    pool: string;                        // the pool file's stamp when dealt
    seed: number;
    id: string;                          // unique round identity
    review: boolean;
    settings: VerseCompletionRecord["settings"];
    ids: string[];                       // the 10 (or fewer) passages dealt
    done: { id: string; status: "answered" | "skipped"; accuracy: number; stars: 0 | 1 | 2 | 3 }[];
    finished: boolean;                   // summary/streak already committed
  } | null;
}
```

- **Size.** About 80 bytes per passage played. If every one of about 600 passages has been played, the record is about 50 KB, well inside the usual 5 MB limit.
- **Reading:**
  - passage ids not in the pool file are dropped (with a logged warning), and retired passages are kept, so progress is never lost to a retirement;
  - numbers are clamped to their ranges, and anything malformed falls back to the default for that field;
  - `recent` keeps only known ids, at most 60.
- **The round in progress** is saved after every answered card. On opening the page, a round whose `pool` stamp matches the current pool file resumes at the first unanswered card, with the same seed and so the same choices. Otherwise it is dropped. A card that was half answered starts again blank, which is simpler and fair.

Persist the deal before showing its first card. Commit each answered/skipped card and its progress/totals together, once per round id and card index; disable repeat submission. Persist skips so reload never replays a failed card. Validate done entries as a unique ordered prefix of ids, with finite numbers and bounded arrays. Increment round totals/streak once on completion, never on rendering or reopening the summary. An all-skipped round earns no streak. Final accuracy thresholds use unrounded values; round only display percentages.
- **Writing:** every write first re-reads the stored record, changes only what this answer changed (one passage, the round, the streak), and writes it back. This reduces stale writes but localStorage read/modify/write is not atomic across tabs. Use a single writable active round: another tab observes progress and must explicitly take over before answering. Recheck ownership on focus and before commits; use Web Locks when available to serialize writes, otherwise warn that simultaneous-tab updates may race rather than promising lossless merges. Each tab listens for the `storage` event and refreshes its start screen and My verses counts.
- **No storage** (a private window, storage blocked or full): the game plays normally. My verses and the streak are hidden, and the start screen says "Your progress can't be saved in this browser". Every read and write is wrapped in `try/catch` with a logged warning.
- **Clear my progress**, at the foot of My verses, asks for confirmation and then removes the key.
- **Progress stays in this browser.** No account and no server; the record never syncs between devices. The help says so.

---

## 10. Screens

Everything is on the one page `/games/verse-completion`, inside the site's normal header and footer. It starts with the "All games" back link the other games use (`gm-back` from [games.css](../../../src/pages/games/games.css)). The page is built mobile first. The verse text is large (at least 1.25rem on phones), and every button is at least 44 px tall.

### 10.1 Start

- Title "Verse completion" and one line: "See the start of a verse and finish it. Play for fun, or keep verses to learn by heart."
- If storage works: the **day streak**, and a **My verses** line ("12 verses · 3 due · 2 memorised") that opens My verses.
- **Review (3 due)**, the main button whenever anything is due.
- **Answer:** Pick | Type, as a two-choice switch. Under Type: **Whole words** | **First letters**.
- **Difficulty:** Easy | Medium | Hard, each with one line of explanation ("Famous verses, the last part hidden").
- **Verses from:** Whole Bible | Old Testament | New Testament.
- **Play** (the main button when nothing is due), and **How to play**.
- Settings are remembered (§9).

### 10.2 Card

- A header: "3 of 10", the stars so far, and a **Leave round** link. Leaving asks for confirmation, keeps the answered cards' stars in the totals, and drops the round.
- The **reference** ("Proverbs 3:5–6"), then the **shown opening**, then grey lines for the hidden words.
- The **answer area**:
  - **Pick, choose the ending:** three full-width buttons, stacked.
  - **Pick, word by word:** the passage builds up in place; three word buttons sit below it, large enough for thumbs.
  - **Type, whole words:** the text box (three lines tall, growing), with **Check**, **Show next word** and **I don't know**.
  - **Type, first letters:** the passage builds up word by word as letters are typed, above a one-character input with the label "Type the first letter of the next word", and **I don't know** (which reveals the rest).
- While the card's book is loading: the reference, and "Loading the verse…" in place of the text.

### 10.3 Card result

- The **whole passage** with every hidden word marked (§6.5), the stars, and "Word perfect" where earned.
- For typed answers, a one-line summary: "14 of 16 words right · 1 typo accepted · 1 missed".
- **Read in context** (the reader at `/read/bsb/<BOOK>/<chapter>?hl=<first>-<last>`, opening in a new tab), **Add to My verses** (a toggle that shows the box once added), and **Next** (focused, so Enter moves on).
- In a review: the box change, in words ("Up to box 3: back in 7 days", "Back to box 1: back tomorrow", "Memorised!").

### 10.4 Round summary

- Stars out of `3 × answered cards`, with the actual dealt count and skipped count; never a fixed 30 for a short review or one-card practice.
- One row per dealt passage: reference, stars or skipped status, and an **Add** toggle for answered cards. Tapping an answered row shows its passage again.
- **Add all missed to My verses**, **Play again**, **Change settings**. After a review: **Review the next 10** if more are due.

### 10.5 My verses

- A header with the counts and **Review due**.
- **Filter:** All | Due | Memorised. **Sort:** due first (default), by box, or in Bible order.
- **One row per passage:** the reference, a five-step box meter with a text label ("Box 3 of 5"), and when it is next due ("Due today", "Tuesday 17 November", written with the site's date formatter). The verse text is *not* shown in the row, because that would mean downloading every book in the list.
- **Tapping a row expands it:** it loads and shows the passage, its best accuracy, and **Practise now** (a one-card round using the Hard split and chosen answer style) and **Remove from My verses**.
- **Long lists** follow the site rule: rows are windowed with the existing [useRowWindow](../../../src/lib/useRowWindow.ts) (50 rows drawn above and below the visible area, from [row-window.ts](../../../src/lib/row-window.ts)). There is no "load more" button.
- **Clear my progress** at the foot.
- **Empty state:** "No verses yet. Tap Add to My verses after any verse to start learning it."

### 10.6 How to play

A dialog, opened by itself on the first visit and afterwards from **How to play**:

- the two modes and three difficulties, in one sentence each;
- what counts as right: "Capitals, punctuation and small typos don't count against you. A different word does";
- how My verses and the boxes work, in three short lines;
- "The verses are the Berean Standard Bible, in English, in every language of the site";
- "Your progress stays in this browser. Your answers are not uploaded."

### 10.7 Loading and failure

- **Pool file fails to load:** "The game couldn't load. Check your connection and try again", with **Try again**, which re-runs the `import()`.
- **A book fails to load mid-round:** that card shows "This verse couldn't load" with **Try again** and **Skip**. A skipped card scores nothing, is left out of the total (the summary says "out of 27"), and is not recorded against the passage.
- **A passage the BSB file does not have** (it cannot happen if the build checks pass, but a stale browser cache might): treated as a failed load and skipped, with a logged warning.

---

## 11. Files (for the implementation step)

All new, inside the game's own folders, plus the one registry line. This follows the rule that the four chains touch only their own feature.

| File | What it holds |
|---|---|
| [src/pages/games/verse-completion/](../../../src/pages/games/verse-completion/)`VerseCompletionGame.tsx` | The page: loads the pool, holds the screen state (start, card, result, summary, My verses), and resumes a saved round. Default export. |
| `Start.tsx`, `Card.tsx`, `Result.tsx`, `Summary.tsx`, `MyVerses.tsx`, `Help.tsx` | The screens of §10. |
| `PickEnding.tsx`, `PickWords.tsx`, `TypeWords.tsx`, `TypeLetters.tsx` | The four answer areas of §5. |
| `words.ts` | Splits BSB text into words, each with its display form (punctuation attached, dashes kept on the left) and its normalised form (§6.1). Used by the page, the build and the tests, so the word counts always agree. |
| `normalise.ts`, `equivalents.ts` | §6.1 and §6.2. |
| `match.ts` | Damerau–Levenshtein distance, the word verdicts (§6.3), the alignment and accuracy (§6.4), and the removal of a retyped opening or reference. |
| `choices.ts` | The word-by-word options for Pick at Hard (§5.1). |
| `deal.ts` | Dealing a round (§7.3) and a review (§8.3), with the seeded random number generator. |
| `boxes.ts` | The box rules (§8.2) and the streak (§8.4). |
| `storage.ts` | Reading, rebuilding and writing the record (§9). |
| `text.ts` | Every on-screen label, as `{ label: "…" }` objects, as in [wordle/text.ts](../../../src/pages/games/wordle/text.ts). |
| `verse-completion.css` | The game's styles, scoped under one class, using the site's colour variables and the hub's `gm-` classes. |
| [src/data/verse-completion/](../../../src/data/verse-completion/)`curation.json` | **Hand-kept:** each passage's id, `from`/`to` verse ids, tier, optional split overrides, `retired`, and a short curator's note (never verse wording). Read by the build and the tests only, never by the page. |
| `pool.json` | **Generated:** `{ stamp, passages: [{ id, from, to, tier, testament, words, split: { easy, medium, hard }, decoys: { easy: [id, id], medium: [id, id] }, retired? }] }`. Ids and numbers only. |
| `vocabulary.json` | **Generated:** the sorted list of distinct BSB words (§2.6), loaded only when Type with Whole words is played. |
| `scripts/build-verse-completion.ts` | Reads `curation.json` and the BSB from disk, checks every rule (§4, §7.2) and writes `pool.json` and `vocabulary.json`. It stops with a clear message, never writes a half-checked file, and refuses a passage that is missing from the BSB, has the wrong length, does not start and end a sentence, contains digits or a contraction (§15), or a curation entry with a duplicate id. Run with `node --experimental-strip-types scripts/build-verse-completion.ts`. |
| `scripts/verse-completion-candidates.ts` | The candidate ranking of §4.2. It writes its sheet to a path given on the command line, never into `src/`. |
| [registry.ts](../../../src/pages/games/registry.ts) | The existing entry gets `status: "live"` and `load: () => import("./verse-completion/VerseCompletionGame")`. Title, description, audience, shelf and art stay. |
| [src/pages/games/README.md](../../../src/pages/games/README.md) | A short "Verse completion data" note: how to add or retire a passage and rebuild. It is added with Edit, since other chains may change this file too. |

The game draws no new art. The scene already exists.

---

## 12. Accessibility and language

- **Screen readers:**
  - the reference and the shown opening are one heading-and-paragraph pair;
  - the hidden words are announced as a count ("16 words to complete"), not as sixteen lines;
  - each result is announced once through a polite live region ("Three stars. 14 of 16 words right, 1 typo accepted, 1 missed");
  - in First letters and word-by-word picking, each placed word is announced ("shepherd, right" / "want, missed").
- **Not colour alone:** every word state has its own symbol and a text label (§6.5), and the box meter has a text label.
- **Keyboard:** everything works without a mouse. Keys 1–3 choose word options; Enter checks or moves on; focus moves to the result heading after an answer and to the next card's input after **Next**. Keys pressed with Ctrl, Alt or Meta are ignored, so browser shortcuts still work.
- **Motion:** with `prefers-reduced-motion`, nothing shakes or slides.
- **Text size:** the layout survives 200% zoom, and long passages wrap. Nothing is cut off.
- **Translation:**
  - all on-screen English is written for the site's translation collector; sentences with values ("{count} of {total} words right") are single texts with placeholders, at most three values each, as [content/translation/README.md](../../../content/translation/README.md) requires;
  - there are no hand-written plurals, and numbers and dates go through the site's formatters;
  - the `document.title` follows the rule the other games use, so the build's English check ([english_build_check.py](../../../content/translation/english_build_check.py)) passes.
- **What stays English on purpose:** the verses (always the BSB) and the matching rules (contractions, British spellings, number words, the vocabulary). Matching text in Chinese, which has no spaces between words, or in Arabic, would need a different design. The implementer records this as a ruling with its reason wherever the translation check asks for one (Bible Wordle used `unregistered-reviewed.json`), so it is not flagged as missed translation.

---

## 13. Tests (Vitest, so they run in `npm test`)

- **`words.test.ts`:** em-dash joins split ("salvation—whom" is two words); a stand-alone dash joins the word before; curly and straight quotes vanish; apostrophes are removed; the display forms rejoin to the original text.
- **`match.test.ts`:** every worked example in §6.6; the typo allowance at each length boundary (3/4 and 6/7 letters); a first-letter change is never a typo; a typed BSB word is never a typo; first-two-letter swaps are typos; contractions, British spellings and number words; a retyped opening and a typed reference are removed; extra words cost half each; empty input scores 0; 600 characters of noise finishes quickly and scores near 0.
- **`choices.test.ts`:** three distinct options, the right one among them; no option equal to the right word after normalising, or differing only by an ending; the same seed gives the same options.
- **`deal.test.ts`:** 10 passages, none retired, none of the last 60 (unless the filter leaves too few), at most two per book, unplayed passages first, tiers in the level's proportions over many rounds, testament filters respected, the same seed gives the same round; review order puts the most overdue first and deals at most 10.
- **`boxes.test.ts`:** every row of §8.2: up one box only when due, the three ceilings, stay on 70–89%, back to box 1 on a miss, Memorised set and lost, 60-day gap; the streak across a missed day, across daylight-saving changes, and when today is not yet over.
- **`storage.test.ts`:** a damaged, partial, wrong-typed or foreign record comes back sound; unknown ids are dropped and retired ones kept; a round from another pool stamp is dropped; the write path re-reads and changes only one passage; storage that throws leaves the game playable.
- **`data.test.ts`**, against the BSB on disk via [bsb-for-tests.ts](../../../src/lib/bsb-for-tests.ts):
  - every passage exists in the BSB, 8–45 words, one to three verses, one book, starting and ending a sentence, with no digits and no contraction;
  - `words` matches a fresh count, and every split obeys §7.2's limits;
  - decoys exist, are active, differ from the passage and each other, and the "right ending longest" share lies between 25% and 42%;
  - ids are unique, at least a third of the pool is Old Testament, no book is above 12%, and the tier counts are within 20% of the targets in §4.2;
  - `pool.json` matches what the build would write from `curation.json`, so a hand edit to the generated file is caught;
  - `pool.json` holds no verse wording (the build's own wording check covers this too).
- **`VerseCompletionGame.test.tsx`:** with a small fixture pool and stubbed verse loading, play one Pick round and one Type round to the summary, add a passage to My verses, reload mid-round and resume at the same card, and use **I don't know**.
- **The hub's** [games.test.tsx](../../../src/pages/games/games.test.tsx) needs no change: it counts live games from the registry.
- The implementation step runs the site's tests and build, and the build's verse-wording and English checks must pass.

Additional acceptance cases: complete versus partial retyped openings and repeated phrases; hinted repeated-word indices and realignment; same-word-count BSB edits changing the stamp; pairwise decoy uniqueness and missing-decoy loads; sparse/empty decks and due-only books; split ordering; Hard-only promotion and every style ceiling with existing higher boxes; badge loss on partial answers; skipped/short/all-skipped summaries; duplicate submits, reload after the last answer and tab takeover; IME/paste input once only. Check keyboard, 320px layout, 200% zoom and reduced motion on the authorised original preview. These are implementation-step checks, not tests claimed run during this document review.

---

## 14. Cost

- **Running cost: $0.** Everything runs in the browser from static files the site already serves (the BSB book files) plus two small generated files (the pool, about 40 KB, and the vocabulary, about 42 KB compressed). There is no model at runtime, no server code, no new service and no new dependency.
- **One-time cost: $0.** The candidate ranking is a local script over the site's own data. The curation of about 600 passages is reading and choosing, done by the implementer in their own session. No model is called per verse, and no batch of agents is used.
- **No external dependency.** If the site's static files load, the game works.

---

## 15. Edge cases

| Case | What happens |
|---|---|
| A passage contains a contraction ("don’t", 79 in the whole BSB) | The build refuses it. Expanding contractions only on the typed side then stays correct, because the passage side never has one. Almost none of the 79 are memory verses. |
| The BSB text changes in a future data update | `data.test.ts` re-counts every passage, so changed word counts or broken sentence ends fail the tests until the build is re-run. A changed split moves at most a word or two; saved progress is by passage id, so it survives. |
| A passage is retired after launch | Never dealt, but kept in `pool.json`. Saved progress keeps it; My verses shows it with "No longer in the game" and offers **Remove**. Its changed pool stamp drops the old round; saved passage progress is retained. |
| Verses the BSB leaves out (Matthew 17:21) | Cannot enter the pool: the build checks every verse exists. |
| The player types the whole verse from the start, or adds the reference | The retyped opening and the reference are removed before lining up (§6.4). |
| The player pastes the verse from elsewhere | Allowed. It is solo practice, and pasting only cheats the player. The 600-character cap applies. |
| Empty answer and **Check** | Treated as "I don't know": 0 stars, passage shown. |
| Extra spaces, line breaks, all capitals, no punctuation | All ignored (§6.1). |
| iPhone Smart Punctuation (curly quotes, `--` turned into a dash) | Normalised away (§6.1). |
| The phone's word suggestions give away the next word | Cannot be prevented by a web page (§2.4). First letters avoids it, and the help suggests that style on phones. |
| Android keyboard sends code 229 for every key | First letters reads the `input` event, not `keydown` (§5.2). |
| Typos that are real words ("live" for "love", "lord" for "word") | Wrong, never typo (§6.3). The vocabulary list decides. |
| A short verse where Easy and Medium splits coincide | Allowed (§7.2). Hard still shows at most 6 words. |
| A short shown opening that is not unique ("For God…", "The LORD…") | The reference is always shown, so the passage is never ambiguous. |
| Testament filter leaves too few passages at a tier | The round is filled from the next tier (§7.1); with Old Testament only at Easy there are still about 50 Famous passages. |
| Fewer than 60 passages left after the recent-list exclusion | The oldest recent passages come back first (§7.3). |
| More than 10 passages due | Review plays 10, then offers the next 10 (§8.3). |
| The device clock is changed (days skipped or set back) | Due days and the streak use the local calendar day. Setting the clock back makes nothing due early; setting it forward makes reviews due sooner. It is a solo game, so this only affects the player, and there is no shared puzzle to spoil. |
| Two tabs open | Writes re-read and change only what they need, and the `storage` event refreshes the other tab (§9). Only one tab answers at a time, with explicit takeover and the limitations in §9. |
| Storage unavailable or full | The game plays; progress features are hidden with an explanation (§9). |
| The site is shown in another language | The page's text is translated; the verses stay English BSB, as the help says (§12). |
| A book file fails to load mid-round | That card offers **Try again** or **Skip** (§10.7). |
| A very long passage on a small phone | It wraps. The answer area stays below it, and the page scrolls the active input into view. |

---

## 16. Open points for the review step and the owner

None of these blocks the implementation.

1. **A daily verse with a shareable score**, like Bible Wordle and Timeline sort. Left out because the spec asks for memorisation, not a daily puzzle. It could be added later with the same daily machinery (`daily.ts`, `share.ts`) and one passage a day.
2. **Playing in the site's own language's Bible.** Left out because the matching rules are English-specific, and Chinese needs character-level matching (§12).
3. **Reading the pool before launch.** The build step's candidate sheet and `curation.json` can be shown to the owner as a plain list of references and tiers, if wanted.
4. **Whether Pick should ever lift a passage above box 2.** The research says recognition is weaker than recall, so this design says no. The owner may prefer a gentler path for children.
5. **Speaking the verse aloud** (as Verses and YouVersion offer). Left out: browser speech recognition is uneven and on some browsers sends audio to a cloud service, which would conflict with "nothing leaves the browser".

---

## 17. Sources

- Bible Memory App: [users' manual](https://biblememory.com/pages/users-manual), [bulletin 446](https://biblememory.com/bulletin/446), [App Store](https://apps.apple.com/us/app/the-bible-memory-app/id496790833)
- Verses: [App Store](https://apps.apple.com/us/app/verses-bible-memory/id939461663)
- Remember Me: [how practice works](https://www.remem.me/how-rm-works/practice/)
- VerseLocker: [scripturememory.com/verselocker](https://scripturememory.com/verselocker/)
- Fighter Verses: [iOS help](https://fighter-verses.appspot.com/ios-help.html)
- YouVersion: [memory verse levels](https://help.youversion.com/l/en/article/voabe8h9uq-memory-verse-levels), [verse memorization](https://help.youversion.com/l/en/article/h8owck8of7-verse-memorization)
- Clozemaster: [review](https://togetherwelearnmore.com/clozemaster-complete-review/); Duolingo: [blog](https://blog.duolingo.com/how-user-reports-improve-course-content); Dwell: [review](https://timwildsmith.com/reviews/dwell-app)
- Roediger & Karpicke 2006, [doi:10.1111/j.1467-9280.2006.01693.x](https://doi.org/10.1111/j.1467-9280.2006.01693.x)
- Slamecka & Graf 1978, [doi:10.1037/0278-7393.4.6.592](https://doi.org/10.1037/0278-7393.4.6.592); Bertsch et al. 2007, [doi:10.3758/BF03193441](https://doi.org/10.3758/BF03193441)
- Fiechter & Benjamin 2018, [doi:10.3758/s13423-017-1366-9](https://doi.org/10.3758/s13423-017-1366-9)
- Kang, McDermott & Roediger 2007, [doi:10.1080/09541440601056620](https://doi.org/10.1080/09541440601056620); Marsh et al. 2007, [doi:10.3758/BF03194051](https://doi.org/10.3758/BF03194051); Butler & Roediger 2008, [Memory & Cognition](https://link.springer.com/article/10.3758/MC.36.3.604); Little et al. 2012, [doi:10.1177/0956797612443370](https://doi.org/10.1177/0956797612443370)
- Cepeda et al. 2008, [doi:10.1111/j.1467-9280.2008.02209.x](https://doi.org/10.1111/j.1467-9280.2008.02209.x); SuperMemo SM-2, [supermemo.com](https://www.supermemo.com/en/archives1990-2015/english/ol)
- Haladyna, Downing & Rodriguez 2002, [PDF](https://cmapspublic3.ihmc.us/rid=1P2XTLCSS-11K09T9-BD5/Haladyna_2002_-Appl_Meas_Educ.pdf); Rodriguez 2005, [PDF](https://edmeasurement.net/8268/Rodriguez-2005-Random-effects-meta-analysis-three-options.pdf)
- MDN, [autocorrect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/autocorrect); Apple, [predictive text](https://support.apple.com/en-ng/104995), [developer forums](https://developer.apple.com/forums/thread/696748)
- Berean Standard Bible, [terms](https://berean.bible/terms.htm)
- Site measurements (§2.6): a throwaway script over `data/plain/bsb/` and `data/xref/`, run on 2026-11-07; not kept in the site.

## 18. Recovery source verification (2026-11-08)

This completes the interrupted research/design draft; it is not the subsequent review or implementation step. The approved idea is entry 14 in the project-level APPROVED-IDEAS.md. The actual source document stopped after section 7; sections 8–17 were recovered from this same job's saved draft.

- The current official [Berean terms](https://berean.bible/terms.htm) confirm the April 30, 2023 public-domain dedication, freely permitted uses, optional attribution, and the request to reserve the Berean name for verbatim text. Display canonical BSB wording; answer normalisation is comparison logic only.
- The current official [Bible Memory manual](https://biblememory.com/pages/users-manual) confirms first-letter practice, progressively hidden words, full recall, and increasing review intervals. It does not establish every numerical/detail claim in the older research table; the proposed 90% threshold is a game design choice, not a newly verified universal learning threshold.
- The Remember Me practice URL could not be retrieved during recovery. Its exact doubling schedule remains an inherited research claim, not newly verified evidence. Other app details and linked papers were preserved from the original run and were not all independently rechecked. Claims of market uniqueness are hypotheses, not an exhaustive current market audit. The five-box intervals and answer-style ceilings are proposed product rules, not clinically validated schedules.
- Cross-reference votes are an editorial candidate-discovery aid, not a measured fame score. The outgoing-vote rule in section 4.2 governs; manual selection remains required. Pool size, download sizes and tier counts are targets/estimates until the implementation step measures its curated data.

Implementation must resolve the normal design details and run section 13's checks in its separately authorised step. No game code, registry status, build, browser or publication was changed by this recovery.


## 19. Review

One critical design review completed on 2026-11-09 (sequence 30, step 12), against approved idea 14, FEATURE-BUILD-RULES.md, AGENTS.md and the current games registry/README, verse resolver, search normalisation and calendar-day implementation. Corrections above are applied directly in the body.

- Kept the approved opening-plus-pick/type game, BSB-only text, browser progress, existing registry slug/art and zero runtime model cost. Removed the unsupported market-uniqueness claim and identified the pass bar as a product choice (§2–3).
- Made decoy validation pairwise and editorial, specified Hard fallback/loading, and removed formatting clues (§5). Added composition-safe First letters and target-index hint penalties to avoid accidental extra attempts or lost-word penalties.
- Replaced two-word prefix stripping with complete-opening candidate comparison, specified reference parsing order, and required verbatim display offsets and ordered splits (§6–7).
- Bounded sparse-deck dealing and separated review eligibility from ordinary-round filters. Required Hard recall for promotion and made ceiling, due-date and badge transitions explicit (§7–8).
- Expanded the pool fingerprint to detect text/rules/retirement changes; added persisted skips, round identity and once-only completion. Replaced the impossible lossless localStorage concurrency promise with a single active writer and explicit limitations (§4, §9, §15).
- Fixed short-round totals and one-card practice, clarified that answers are not uploaded while static Bible files still load from the site, and added corresponding implementation acceptance cases (§10, §13).

Validation for this review is document/source consistency checking only. No game implementation, tests/build, browser run, paid generation, commit, push or deployment was performed. Section 18 retains the earlier research verification limits; this review did not repeat that research sweep. The implementation step must run all specified checks and measure curated pool targets.

## 20. Implementation notes

Built on 2026-11-09 (sequence 30, step 13). The game is live in the registry. Deviations from the text above, all deliberate:

- **Worked example (§6.6).** Under the alignment rules of §6.4 the example scores 77%, not 71%. The code follows §6.4; `match.test.ts` pins 77% and says why.
- **Pool size.** 619 curated passages (tiers 169 / 250 / 200, 237 Old Testament, Psalms capped at 70). `pool.json` is about 125 KB, not the ~40 KB estimate, because each passage carries its three split points and four decoy ids. It loads only when the game opens.
- **Accent folding.** Answers drop accents inline in the matcher rather than through a shared `foldWord` helper, so the game does not depend on search code.
- **One active tab.** No Web Locks. A per-tab id kept in sessionStorage owns the round in progress; another tab sees "playing in another tab" with a button to take over (§9, §15 limitations still apply).
- **Decoy review.** The build writes the full review sheet (`--review PATH`); only a sample of it was read by eye in this step. A full editorial read of every Pick prompt is still owed.
