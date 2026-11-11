# Bible Wordle — design

**Step:** sequence 30, step 4 (research & design), 2026-11-07. Reviewed once in step 5 (2026-11-07); its corrections are applied in the body and listed in §17. Next: implementation (step 6).
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 12, "Bible Wordle: daily word puzzle with a Bible word; shareable scores."
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) and the site's [AGENTS.md](../../../AGENTS.md).
**The task brief also asked for:** a daily Bible word, a word list, checking guesses, a shareable emoji score, streaks kept in the browser, and a short verse shown with the answer.
**Address:** `/games/wordle`. The registry slug `wordle` already exists as "coming soon" in [registry.ts](../../../src/pages/games/registry.ts); this design keeps that slug. Only the design folder is called `bible-wordle`.

---

## 0. Summary of decisions

| Question | Decision |
|---|---|
| Core game | Classic Wordle: guess a 5-letter word in 6 tries. Green means the right letter in the right spot, yellow means the letter is in the word but elsewhere, grey means it is not in the word. Repeated letters use the standard two-pass rule (§3.2). |
| Today's word | One word for everyone on the same **local calendar date**, changing at the player's own midnight, as in Wordle and Map quest. Puzzle `#1` is a launch date stored once in the data file (§6). |
| Where the answers come from | A **hand-curated list of 450–600 Bible words**, each with a category, a difficulty and one verse, drawn from the five-letter words of the Berean Standard Bible (BSB) on this site. There are 1,978 distinct ones; after filtering, about 840 ordinary words and about 140 names are left to choose from (§4.1). |
| Which guesses are accepted | Any word in the **allowed list**: the public-domain ENABLE word list's five-letter words, plus every five-letter word in the site's BSB, WEB, KJV and ASV Bibles (names included), plus every answer, minus a short block list of slurs. That comes to roughly 10,000 words. An unknown word is refused and does **not** use up a try (§4.2). |
| Picking the day's word | A schedule file is generated 3 years ahead. No word comes back within 300 days. A person or place never follows another person or place, and the hardest words appear at most once a week. Christmas and Easter can be pinned to a chosen word (pins are placed first and the rules are checked around them). Days up to **14 days after a build** are frozen, so a build that reaches the live site up to two weeks late still never changes a puzzle anyone has played. A word taken out after launch is marked `retired`, never deleted. If the file ever runs out the same rules carry on in the browser (§6). |
| Verse with the answer | One short verse (30 words or fewer where one exists), stored as a **verse id only** and shown in the **BSB** with the answer highlighted, plus a link to read it in context. Names always get a hand-picked verse; ordinary words get an automatic pick that a person checks (§5). |
| Sharing | The Wordle emoji grid, with no letters and no verse reference, so it spoils nothing: `Bible Wordle #42 4/6`, then the rows, then `bibleguide.io/games/wordle`. A `*` marks hard mode and 💡 marks a game where the hint was used. It uses the phone's share sheet, then the clipboard, then a box to copy from (§7). |
| Streaks | Kept in this browser only (localStorage key `bp-wordle`): games played, win %, current streak, best streak and how many tries each win took. The game plays the same without storage (§8). |
| Extras | Hard mode, a high-contrast colour option, and one optional hint after the third guess (the word's category, such as "A person in the Bible"). There is no practice mode or archive in this version (§3.4, §15). |
| Cost | **$0.** No new service and no runtime model. The ENABLE list is a free, one-time download kept with the site's other raw sources; only the generated guess list ships (§13). |

---

## 1. What the spec fixes, and what this design decides

The owner's entry is one line: a **daily** word puzzle, a **Bible** word, **shareable scores**. Everything else is decided here and checked by the review:

- **Daily** means one shared puzzle per date, with a number, so friends can compare results. It does not mean unlimited play.
- **A Bible word** means the answer is always a word or name that appears in the Bible. The verse shown afterwards is what makes the game teach something rather than just entertain (the task brief asks for it).
- **Shareable scores** means the spoiler-free emoji grid that made Wordle spread (§2.1).

---

## 2. Research

### 2.1 Wordle itself

- **Origin.** Josh Wardle built it for his partner and released it publicly in **October 2021**. He added the share button on **16 December 2021**, crediting a group of players in New Zealand who had started posting coloured-square grids. The game went viral within weeks. The New York Times bought it on **31 January 2022** for a price reported in the low seven figures, and kept players' streaks.
- **What made it work** (the parts this design copies on purpose):
  1. **One puzzle a day, the same for everyone.** Scarcity makes it a habit, and a shared answer gives people something to talk about.
  2. **The spoiler-free grid.** It shows *how* you did without saying *what* the word was. That makes it social and is the main reason it grew.
  3. **Streaks and a guess-distribution chart.** These are the reason to come back tomorrow.
  4. **No account, no ads, instant start.** Everything lives in the browser.
- **Two word lists.** The original code shipped about **2,315 curated answers**, common words chosen by hand with simple plurals left out, and about **10,657 more words accepted only as guesses** (about 12,970 in all). The answers sat in the public JavaScript file in order, so anyone could read ahead. That turned out not to matter for a casual game, and the same is accepted here (§14).
- **Repeated letters.** Greens are given out first, across the whole word. Then yellows are given left to right, only while copies of that letter in the answer remain unused. Every extra copy is grey (example: answer APPLE, guess ALLEY → only one L can light up).
- **Hard mode.** It limits which guesses you may play (green letters must stay where they are, yellow letters must be used again). It never changes how tiles are coloured, it can only be switched before the first guess, and it shows an asterisk on the share grid.
- **Accessibility.** There is a high-contrast option (orange and blue instead of green and yellow) for colour-blind players. The share grid uses the same colours.
- **Midnight.** The puzzle changes at the device's local midnight, so two friends in different time zones can briefly be on different puzzles. Wordle accepts this, and so does this design.

### 2.2 Bible clones already out there

| Game | What it does | Taken / left |
|---|---|---|
| **Christian Wordle** | Guess a five-letter word taken from a Bible verse. A hint links to the chapter. Free, in the browser. A 2026 review faults its word schedule being visible in advance, unclear rights to the Scripture text, and no privacy policy. | **Take** the verse anchor. **Avoid** unclear text rights: this site quotes the BSB, which it already carries under the BSB's free licence, and stores nothing about the player outside their browser. |
| **Biblicle** (FaithTree) | A five-letter word from the English Bible each day. After solving, it shows where the word appears, with links. Optional account to sync. | **Take** "where it appears" (the verse plus a link to read it). **Leave** accounts. |
| **Bibordle** | "Guess the word from the Bible in six tries. Each guess must be a valid five-letter word from the Bible." Easy mode, high contrast, swap Enter and Backspace, a stats panel. | **Leave** the Bible-only guess rule. Players' usual starting words (ADIEU, CRANE, SLATE) are missing from the Bible, and having them refused is the commonest annoyance in such clones. **Take** high contrast. |
| **BibleDle** | A hub of daily Bible word games. A paid supporter plan unlocks the archive, stats and offline packs. | **Leave** paywalls. Stats here are free and local. |
| **EverWell Bible Wordle** | Five tries, and each word comes with a passage reference you can read as a hint. Free play is limited per day. | **Take** an optional hint, but a softer one (§3.4). |
| **Lordle** | A different game: guess where a verse comes from. | Not relevant beyond confirming that people want daily Bible games. |

**What none of them does well**, and this design does: it accepts any real English word as a guess while every answer is a Bible word; it explains the answer with a short, well-known verse in modern English, highlighting the word; it says who a name is (for example "Moses' brother, first high priest of Israel" for AARON, from the site's people data) and links to that person's page; and it keeps the schedule free of runs of obscure names.

### 2.3 What this site already has (checked in the code and data, 2026-11-07)

- **The games hub** ([README.md](../../../src/pages/games/README.md)). A game becomes live by setting `status: "live"` and `load` on its registry entry. Each game gets exactly **one address**, `/games/<slug>`, and anything deeper returns to the hub. So all of Bible Wordle's screens are state inside one page. The hub's test counts entries from the registry, so making the game live needs no test change.
- **Map quest's Daily Five** ([daily.ts](../../../src/pages/games/map-quest/daily.ts), [daily-rules.ts](../../../src/pages/games/map-quest/daily-rules.ts), [share.ts](../../../src/pages/games/map-quest/share.ts), [storage.ts](../../../src/pages/games/map-quest/storage.ts)). This is already a working daily puzzle on this site. It handles local calendar-day numbering that survives daylight-saving changes, a launch date stored in the data file, a schedule generated with frozen past days, a seeded generator for days past the end of the file, sharing through the share sheet, then the clipboard, then a manual copy box, and a localStorage record rebuilt field by field so damaged data cannot break the page. Bible Wordle follows the same patterns, and the review that fixed Map quest's design (its §12) is the checklist this design was written against.
- **Bible text.** The BSB is at `data/plain/bsb/<BOOK>.json` (`{"1:1": "…"}`, 66 books, 31,086 verses). The WEB, KJV and ASV sit beside it. Pages may **not** store a verse's wording: [check-verse-wording.py](../../../scripts/check-verse-wording.py) runs before every build and fails if it finds one. Pages store verse ids (`BBCCCVVV`, e.g. 43003016) and load the words through [verses.ts](../../../src/lib/verses.ts). `useVerses({ id }, { bible: "bsb" })` returns a verse in the BSB whatever the site language. Map quest's [Play.tsx](../../../src/pages/games/map-quest/Play.tsx) shows the reference link pattern: `/read/<bible>/<BOOK>/<chapter>?v=<verse>`.
- **Cross-references** at `data/xref/<BOOK>/<chapter>.json`. Each verse lists `[target, end, votes]`, and the votes added up make a good measure of how well known a verse is (John 1:1 scores very high). This is used to pick verses automatically (§5).
- **People** in `data/study/people.json` (`id`, name `n`, one-line description `b`, mention count `c`; 3,133 rows, about 384 KB, so it is read by the build script only, never by the game page). Readable addresses are in [people-slugs.json](../../../src/data/people-slugs.json) (`{ "slugs": { "<slug>": "<person id>" } }`), and person pages live at `/people/<slug>`. One person's record, including `b` in the site's language where a translation exists, loads with `loadPersonDetail(id)` from [study.ts](../../../src/lib/study.ts).
- **Raw downloads** live in the site's sources folder, found the way [paths.py](../../../scripts/bible/paths.py) finds it (the `BIBLE_SOURCES` variable, else `sources/` inside the site, else `../sources` beside it), with their checksums in [SOURCES.md](../../../SOURCES.md). The `intake/` folder is the data-intake catalogue web page, not a store for raw files.
- **Translation.** Before every build, [english_build_check.py](../../../content/translation/english_build_check.py) stops the build when page code gains on-screen English that is not registered for translation. Its checks also catch sentences built from pieces, hand-written plurals, and number or date formats fixed to one language. The game's text must be written to pass it (§10).

### 2.4 The five-letter words in the BSB (measured this job)

Counted with a throwaway script over all 66 BSB books:

- **1,978** distinct five-letter words.
  - **1,391** appear in lower case at least once (ordinary words).
  - **587** appear only capitalised (names of people, places and peoples).
- Leaving out words used fewer than 5 times, plurals ending in -s whose singular is also in the list, and past tenses ending in -ed leaves **837 ordinary candidates**. Among them: *altar, angel, bread, cloud, cross, crown, faith, flesh, glory, grace, manna, mercy, myrrh, olive, peace, sword, tithe, tribe, wrath*. There are also function words like *their* and *which*, which curation drops.
- Names used 8 times or more: **141 candidates**. Most of them match a person in `people.json`. Among them: *Jesus 1,404, David 966, Moses 853, Judah 838, Egypt 607, Jacob 383, Aaron 321, Peter 174, Isaac 138, Sarah, Caleb, Jonah, Naomi, Rahab, Hagar, Silas, Titus, Enoch, Joppa, Sinai*.

So **450–600 good answers** are realistic. That is more than a year without repeats.

---

## 3. Rules of the game

### 3.1 Play

1. The board has 6 rows of 5 tiles. The player types with the on-screen keyboard or a physical keyboard. Letters A–Z only, and case does not matter.
2. **Enter** submits a full row. Before a guess is checked:
   - a row with fewer than 5 letters gets "Not enough letters";
   - a word that is not in the allowed list (§4.2) gets "Not in the word list";
   - a word already guessed in this game gets "You already tried that word";
   - in hard mode, a word that breaks the hard-mode rule (§3.3) gets that rule's message.

   In all four cases the row shakes and **no try is used**.
3. A valid guess turns its tiles one by one (green, yellow or grey) and colours the keyboard keys. A key keeps its best colour so far: green beats yellow, and yellow beats grey.
4. Guessing the word within 6 tries is a **win**. After 6 wrong tries the game is **lost** and the answer is shown. Either way the result card opens (§9.3).
5. **One game per day.** Each guess is saved the moment it is played. Reloading the page brings back the same board, and a finished puzzle cannot be played again.

### 3.2 Colouring a guess (the exact rule)

```
evaluate(guess, answer):            // both 5 lower-case letters
  result = [absent × 5]
  left = count of each letter in answer
  for i in 0..4: if guess[i] == answer[i]: result[i] = correct; left[guess[i]] -= 1
  for i in 0..4: if result[i] != correct and left[guess[i]] > 0: result[i] = present; left[guess[i]] -= 1
  return result
```

Test cases that must hold:

| Answer | Guess | Result |
|---|---|---|
| APPLE | ALLEY | 🟩🟨⬛🟨⬛ |
| ABBEY | BABES | 🟨🟨🟩🟩⬛ |
| MANNA | NANNY | ⬛🟩🟩🟩⬛ |
| JESUS | SEEKS | 🟨🟩⬛⬛🟩 |
| SHEOL | SHEOL | 🟩🟩🟩🟩🟩 |

### 3.3 Hard mode

- When it is on, every later guess must keep each **green** letter in its place and must contain each **yellow** letter. The check counts letters: for each letter, the guess must contain it at least as many times as it was marked green or yellow within any single earlier guess (so two yellow tiles of the same letter, or one green and one yellow, mean the letter must appear twice). Grey tiles never restrict a guess, as in Wordle.
- The messages are "Letter {position} must be {letter}" and "Your guess must include {letter}". Each is written as one sentence with values filled in, the way the translation rules require (§10).
- It can only be switched on or off **before the first guess** of today's puzzle. After that the switch is greyed out and says why. The setting is remembered for the next day.
- A game finished in hard mode gets `*` after the score in the share text.

### 3.4 One optional hint

- After the **third** wrong guess, a "Show a hint" button appears. It reveals the word's category in one line:

  | Category | Hint |
  |---|---|
  | `person` | A person in the Bible |
  | `place` | A place in the Bible |
  | `creature` | An animal or creature in the Bible |
  | `object` | Something you could see or hold |
  | `idea` | An idea, quality or feeling |
  | `action` | Something people do |

- Using it is saved with the game, and the share text gets 💡. It never changes the score or the streak.
- **Why only this hint:** players who have never seen a name like ABNER can be stuck after three greys. A category helps without giving the word away, and marking it in the share keeps comparisons honest. A chapter reference, the hint some clones give, nearly gives the answer away for names.

---

## 4. The word lists

### 4.1 Answers: the Bible words

**Source:** the five-letter words of the site's own BSB text (§2.4), chosen by hand into a curation file. Choosing answers is done once, by the person or job implementing this, not by a model while the game runs. With fewer than 1,000 candidates to read through, no batch model run is needed: the implementer works through the candidate list in its own session, never by starting one agent per word. (If a batch run were ever wanted, the workspace's batch rule applies: BatchRunner, a pilot, and the owner's yes on the cost first.)

**A candidate becomes an answer only if:**
1. It is exactly 5 letters A–Z (no apostrophes or hyphens).
2. It appears in the BSB at least **3 times**, so it is plainly a Bible word and a verse can be found.
3. It is not a function word (*their, which, would, about*), not a simple plural (*kings, hands*), and not a past tense (*asked*) unless that form is a word in its own right (*risen*). Wordle's own answer list keeps the same rule.
4. Its spelling is **the same in American and British English**. The BSB spells *honor, favor, labor, valor, armor* the American way, and British players would feel cheated. These stay guessable but are never answers. So that the build and the tests can check this, the curation file keeps a hand-made `usSpellings` list of five-letter American-only spellings (at least *honor, favor, labor, valor, armor, color, ardor, rumor, humor, savor, vapor, tumor, fiber, liter, miter, saber, ocher*), and no answer may be in it.
5. It is suitable for a family game: no bodily, sexual or gruesome words (*vomit, semen, filth*), even though they are in Scripture.
6. A **name** must belong to someone or somewhere a churchgoer could reasonably know. That means a person mentioned at least 10 times in `people.json` (`c ≥ 10`), or a well-known place (Egypt, Sinai, Sodom, Joppa). Names found only in genealogies (*Nebat, Mahli, Jeiel*) are left out. Only the BSB's spelling of a name counts (other Bibles' spellings are still accepted as guesses).

**Each answer carries:**
- `category`: one of the six in §3.4;
- `tier`: 1 = an everyday word (*bread, water, light*), 2 = a word that sounds biblical (*altar, manna, tribe, Moses*), 3 = a specialist word (*ephod, cubit, Sheol, Abner*);
- `verse`: an optional id that overrides the automatic pick, and is **required** for every `person` and `place` (§5);
- `person`: optional, the people-slug used for the "who is this" line and its link (e.g. `aaron`);
- `retired`: optional, `true` for a word taken out after launch (see below).

**Size:** at least **450**, aiming for about 550. Roughly 15% names, at most 15% tier 3, the rest tiers 1–2. If curation ends below 400 words that are not retired, the build script refuses to build (§6), because a 300-day no-repeat window would not be safe.

**Owner review:** the finished list is a plain JSON file. Before launch the owner can delete any word. **After launch a word is never deleted, only marked `retired: true`**: it is never scheduled again, but it keeps its entry (category, verse, person) in `answers.json`, because a frozen past or current day may still use it and the result card needs that entry. The build stops with a message ("puzzle #N is frozen and uses WORD: mark it retired instead of deleting it") if a frozen day's word is missing from the curation file, as Map quest's build does for a removed place.

### 4.2 Allowed guesses

Players must be able to use ordinary English, not just Bible words (§2.2). The allowed list is the union of:

1. **ENABLE**, the "Enhanced North American Benchmark Lexicon": its five-letter words (about 8,600). It is formally released into the **public domain**, which is why it is preferred to the 12dicts *2of12inf* list (which carries the separate licence of the word list it was built from) and to the New York Times' own lists (owned by the Times, so not used).
2. **Every five-letter A–Z word in the site's BSB, WEB, KJV and ASV**, names included, so *Jesus, Sheol, thine, hadst* are accepted.
3. **Every answer** (already covered by 2, but listed so the build can check it).
4. **Minus** a short hand-kept block list of slurs (`blocked` in the curation file). A blocked word is reported as "Not in the word list".

The expected total is **about 10,000 words**. They are stored as a single string of lower-case words joined end to end (`"aahedaaliiaargh…"`). That is about 50 KB raw and about 20 KB compressed, and it loads only when the game opens.

**Getting ENABLE:** download it once from a well-known mirror (e.g. `https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt`) into the site's sources folder as `<sources>/enable/enable1.txt`, beside the other raw downloads (§2.3). The build script finds that folder the same way [paths.py](../../../scripts/bible/paths.py) does (`BIBLE_SOURCES`, else `sources/` inside the site, else `../sources`). Record the address, date and SHA-256 in the build script's header and in [SOURCES.md](../../../SOURCES.md); the script checks the SHA-256 and stops if the file differs. Treat the download as data: the script only reads lines that match `^[a-z]{5}$`. Credit "ENABLE word list (public domain)" in [NOTICE.md](../../../NOTICE.md). Do not put it in `intake/`, which is the data-intake catalogue page.

### 4.3 Files

All of these sit under `src/data/wordle/`:

| File | Kept by | Holds |
|---|---|---|
| `curation.json` | hand | `answers: [{ word, category, tier, verse?, person?, retired?, note? }]`, `blocked: [...]`, `usSpellings: [...]`, `pins: { "YYYY-MM-DD": "word" }`, `easter?: "word"` (§6.2). Read by the build script and the tests only, **never imported by the game page** (it holds the block list and notes). |
| `answers.json` | generated | `{ word: { c: category, t: tier, v: verseId, p?: personSlug, pid?: personId, r?: 1 } }` for every answer, retired ones included (`r: 1`). The verse id is the curated one or the automatic pick; `pid` is looked up from `people-slugs.json` so the page can load the person's record. |
| `daily.json` | generated | `{ epoch: "YYYY-MM-DD", builtOn: "YYYY-MM-DD", frozenThrough: n, days: ["faith", "moses", …] }`, about 1,100 days. |
| `guesses.json` | generated | `{ "source": "…", "words": "aahed…" }`, the allowed list (§4.2). |

**Build:** `node --experimental-strip-types scripts/build-wordle.ts [--epoch YYYY-MM-DD] [--freeze-days N]`. It reads the curation file, the existing `daily.json`, the four Bibles, the cross-references, `people.json`, `people-slugs.json` and the ENABLE file. It writes the three generated files, but only after every check passes, and all three together. It is run by hand when the curation changes (not in `prebuild`) and reads only files.

**How the page loads them:** like Odd one out, the page loads `answers.json`, `daily.json` and `guesses.json` with `import()` (all three together, in `Promise.all`), so they arrive only on this page and a failure shows the "Try again" screen (§9.6). It never imports `curation.json`.

The script **stops with a message naming the word and the problem** when:
- an answer breaks the rules in §4.1;
- an answer is missing from the BSB;
- a person or place has no verse;
- a verse id does not exist, or its BSB text does not contain the word;
- a `person` slug is unknown;
- an answer is in `usSpellings`;
- there are fewer than 400 answers that are not retired;
- a pin names a word that is not an answer, or is retired;
- a frozen day's word is missing from the curation file (§4.1);
- `--epoch` is given while `daily.json` already exists with a different epoch (§6.1);
- the ENABLE file's SHA-256 differs from the recorded one;
- the schedule cannot keep a rule (§6).

---

## 5. The verse shown with the answer

**Choosing the verse (in the build, once):**
- **People and places: picked by hand, always.** A prototype of the automatic rule chose well for ordinary words but badly for names. For JONAH it chose Matthew 16:17 ("Simon son of Jonah", the wrong man). For MOSES it chose Exodus 34:6, which is about God. For DAVID it chose 1 Samuel 23:16, which is about Jonathan. So every `person` and `place` answer must carry `verse` in the curation file, and the build refuses one without it. Choose a verse *about* that person or place: for Moses, e.g. Exodus 3:4 or Deuteronomy 34:10; for Jonah, Jonah 1:17.
- **Other words: automatic, then checked.** Among BSB verses containing the word as a whole word (case ignored, possessive *’s* allowed), keep those of **30 words or fewer**; if none qualify, take the shortest. Then pick the one whose cross-reference votes add up highest, since a well-known verse teaches more. Prototype results: FAITH → 1 Corinthians 16:13, GRACE → Ephesians 2:8, GLORY → Psalm 57:5, CROWN → Revelation 3:11, BREAD → Matthew 4:4, EAGLE → Psalm 103:5, MANNA → John 6:31. The implementer reads the automatic picks and overrides any that are odd, such as a verse where the word means something unexpected.
- Only the **verse id** is stored, never the wording (the site's verse-wording check enforces this).

**Showing it:**
- The verse is loaded with `useVerses({ id }, { bible: "bsb" })`. It is **always the BSB**, even when the site is in another language, because the puzzle word is English and must appear in the verse. This matches the build rule that Scripture is quoted from the BSB.
- Every whole-word match of the answer in the verse is highlighted. Matching ignores case and allows *’s*, as in "the eagle’s".
- Under the verse:
  - the reference as a link, `/read/bsb/<BOOK>/<chapter>?v=<verse>` (formatted with `formatRange`), labelled "Read in context";
  - for a person, their one-line description and a link to `/people/<slug>`. The description is the `b` field of `loadPersonDetail(pid)` from [study.ts](../../../src/lib/study.ts), which loads only that one person and gives the site's translation where there is one. The page never loads the whole 384 KB `people.json`.
- If the verse cannot load (offline, or a fetch fails), the reference link is still shown with the line "The verse could not be loaded." If the person's record cannot load, the description is left out and the link to their page stays. The game result is never held back.

---

## 6. Daily selection

### 6.1 Date and number

- The puzzle follows the **player's local calendar date** and changes at their midnight.
- `#N = whole local calendar days since epoch + 1`, counted with `Date.UTC(y, m, d)` as Map quest's `calendarDay` does. Dividing milliseconds would go wrong on daylight-saving days.
- The **epoch** (the date of puzzle #1) is stored once, at the top of `daily.json`. The script and the game both read it from there, so they cannot disagree. The first build sets it with `--epoch`, which defaults to the build date. As with Map quest, the date can be moved to the real launch day before the first release, and never after: the script refuses an `--epoch` that differs from the one in an existing `daily.json` (moving it would renumber every puzzle and put every pin on the wrong day). To move it before launch, delete `daily.json` and run the script again with the new `--epoch`; the games README says so, as it does for Map quest.
- A game opened before midnight is finished as that day's puzzle (§14).

### 6.2 Rules for the schedule

The rules live in one shared file, `src/pages/games/wordle/daily-rules.ts`. The build script and the game both use it, so they cannot drift apart. Any import in it is relative and carries its `.ts` extension (or it has none), so Node can run it directly with `--experimental-strip-types`, as Map quest's file does. Retired words are never chosen.

1. **No repeats within 300 days.** This allows a word pinned to a yearly date, and needs a pool comfortably above 300.
2. **Names are spread out:** a `person` or `place` never follows a `person` or `place` on the next day, and there are at most 2 of them in any 7 days.
3. **Hard words are spread out:** at most one tier-3 word in any 7 days (which also means never two days running).
4. **Pins win.** `pins` in the curation file fix a word to a date, e.g. Christmas Day → `jesus`, and each Easter Sunday → `risen`. The build lists the next three years' Easter dates (computed with the standard Gregorian computus) and adds them to its pins if the curation has an `easter` word. **Pins are placed first**, and every rule is then checked in both directions around them: the pinned word is not chosen in the 300 days before its pin, and the day before and after a pinned person (Christmas's `jesus`) is not a person or place. Pins also obey rule 1 among themselves (Christmas pins are 365 days apart, Easter pins at least 331); if one cannot, the build stops and names it. Pins exist only inside the file: past its end the browser carries on without them.
5. **Choosing each day:** a seeded generator (mulberry32, seeded with the puzzle number, already in Map quest's rules file) shuffles the words still available that day. It gives a gentle preference to words unused for longest, so none gets starved, then takes the first that keeps rules 1–3 against both the days before and any pins ahead, backtracking if needed. If no word fits, the build stops with an error naming the day and the rule. It never quietly relaxes a rule.

### 6.3 The schedule file, frozen days, and what happens past its end

- `daily.json` holds about **3 years** of days (about 1,100 words, about 10 KB). It loads with the game.
- **Frozen days:** every day up to **14 days after the build date** is frozen (`FROZEN_AHEAD = 14` in the build script, changeable with `--freeze-days`; never below 2, which is what every time zone on Earth needs). The script copies those days unchanged and refuses to alter them. The margin is 14 rather than Map quest's 2 because building and putting the site live are separate steps done by hand: if the new file reached the live site later than the frozen margin, days that players had already played from the old file would change under them, and a stored board would be replayed against a different answer. The cost is that a retired word can still appear up to two weeks after the build. The build writes `builtOn` into `daily.json`, and the games README says to put a new build live within 14 days or build again. Later days are regenerated on each build, so a retired word cannot stay scheduled beyond the margin.
- **Past the end of the file**, the game uses the same rules in the browser. It replays forward from the file's last 300 days, so no-repeat still holds, and the game never breaks if nobody rebuilds it.
- **Rebuilding after the file has run out:** if the frozen margin reaches past the end of the existing file, the script first extends the existing days with the **same fallback function the browser uses** (kept in `daily-rules.ts`, like Map quest's `nextDay`), then freezes them. So days that browsers worked out for themselves are kept exactly as players saw them. (Map quest's build only copies days that are in its file; Wordle must not copy that shortcut.)
- **Being able to read ahead:** the schedule can be read in the site's files, as Wordle's was. That is accepted for a casual game (§14). The game itself never shows a future word.

---

## 7. Sharing

**The text** (written by `shareText` in `share.ts`):

```
Bible Wordle #42 4/6*
⬛🟨⬛⬛⬛
🟩⬛🟨⬛⬛
🟩🟩⬛🟩⬛
🟩🟩🟩🟩🟩
bibleguide.io/games/wordle
```

- A loss reads `X/6`. Hard mode adds `*`, and using the hint adds a space and 💡 after the score.
- The squares are 🟩 correct, 🟨 present, and ⬛ absent in dark theme or ⬜ in light theme, as in Wordle. High-contrast colours (§9.5) give 🟧 correct and 🟦 present.
- It never includes letters, the word, the category or the verse reference, so it spoils nothing for someone who has not played yet.
- The puzzle number is written with plain digits, so the line reads the same in every language and pastes cleanly into chats. The game name "Bible Wordle" is kept as a name and not translated.

**How it is sent:** the phone's share sheet (`navigator.share`) where there is one. Otherwise the text is copied to the clipboard with a "Copied" notice. If the clipboard is blocked, a box opens with the text selected, ready to copy by hand. This is the same chain as Map quest's `shareResult`. Bible Wordle gets its own small copy of that function rather than importing Map quest's (whose warnings say "Map quest") or moving it into a shared file, which these four parallel chains must not do. Making one shared helper later is noted in §15.

The share button appears only once the day's game is finished, and it stays available until the next puzzle.

---

## 8. Stats and streaks, kept in the browser

**Key:** `bp-wordle` in localStorage. It is rebuilt field by field on every read, like Map quest's `parseStats`, so a damaged or hand-edited value comes back as a sound record and never breaks the page.

```ts
interface WordleRecord {
  v: 1;
  played: number;            // finished daily games (won or lost)
  won: number;
  streak: number;            // wins on consecutive puzzle numbers
  bestStreak: number;
  lastWon: number;           // puzzle number of the last win (0: none)
  lastDone: number;          // highest puzzle number finished (0: none)
  dist: [number, number, number, number, number, number]; // wins in 1..6 tries
  today: { n: number; guesses: string[]; hard: boolean; hint: boolean } | null;
  settings: { hard: boolean; contrast: boolean };
  seenHelp: boolean;
}
```

- **Only the guesses are stored.** Colours and win or loss are worked out again from the answer, so the record cannot disagree with the board.
- **Finishing puzzle n:** `played += 1`. On a win, `won += 1`, the matching `dist` bar goes up by one, and `streak = lastWon === n - 1 ? streak + 1 : 1`, then `lastWon = n`. On a loss, `streak = 0`. Either way `lastDone = n` and `bestStreak = max(bestStreak, streak)`.
- **The streak shown** is `streak` if `lastWon` is today's puzzle or the day before, otherwise 0. A missed day ends the streak, but today does not break it until today is over.
- **A puzzle number at or below `lastDone`** (someone set their clock back) can be played but never changes the stats.
- **Opening the page:** if `today.n` matches the current puzzle, its guesses are replayed onto the board without animation. If it is an older, unfinished puzzle, it is dropped (Map quest does the same).
- **No storage** (a private window, storage blocked or full): the game plays normally, the stats panel says "Your stats can't be saved in this browser", and every read or write is wrapped in `try/catch` with a logged warning.
- **Two tabs:** each tab listens for the `storage` event and reloads today's board when the other tab plays. A guess is recorded only if the stored list is exactly one shorter than the board, so a double tap or the other tab can never add a guess twice.

---

## 9. Screens

Everything is on the one page `/games/wordle`, inside the site's normal header and footer. It starts with the "All games" back link used by the other games (`gm-back` from `games.css`).

### 9.1 Game screen (the page itself)

- **Header row:**
  - "Bible Wordle" and below it "#42 · Saturday 7 November", with the date written by the site's date formatter so it follows the site language;
  - three icon buttons, each with a text label for screen readers: **How to play** (?), **Statistics** (bar chart), **Settings** (gear).
- **The board:** 6 × 5 tiles, centred. Tiles are about 56 px on desktop and fit the width on phones (about 52 px at 320 px wide). They turn over one after another, about 250 ms each.
- **The message line** directly under the board, read out by screen readers (`aria-live="polite"`). It shows refusals ("Not in the word list"), the hint, and the win line.
- **The on-screen keyboard:** QWERTY in three rows, with Enter at the left of the bottom row and Backspace at the right, as in Wordle. Keys are at least 44 px tall and colour as letters are learnt. The page never focuses a text box, so a phone's own keyboard never pops up.
- **"Show a hint"** appears above the keyboard after the third wrong guess (§3.4).
- On phones the board and keyboard fit on one screen without scrolling at 360 × 640.

### 9.2 How to play (opens by itself on the first visit, then from **?**)

- "Guess the Bible word in six tries." Each guess must be a real five-letter word, and an unknown word doesn't use a try.
- Three example rows, using Bible words with one tile coloured each, as Wordle does: **F**AITH (F is in the word and in the right spot), GR**A**CE (A is in the word but in another spot), BREA**D** (D is not in the word at all).
- "Every answer is a word or name from the Bible. When you finish, you'll see a verse where it appears."
- "A new puzzle every day at midnight." In languages other than English it adds "The words in this puzzle are English."

### 9.3 Result card (replaces the keyboard when the game ends)

1. The answer in large letters. On a win, a line based on the number of tries:

   | Tries | Line |
   |---|---|
   | 1 | Hallelujah! |
   | 2 | Wonderful! |
   | 3 | Splendid! |
   | 4 | Well done! |
   | 5 | Good and faithful! |
   | 6 | Just in time! |

   On a loss: "The word was" above the answer.
2. **The verse card** (§5): the BSB verse with the word highlighted, the reference link "Read in context", and for a person, their one-line description and a link to their page.
3. **Share** button (§7), with the "Copied" notice or the copy box.
4. A small summary (played, win %, streak) and a link to the full statistics.
5. "Next puzzle in 05:12:33", counting down to local midnight, recomputed from the clock every second so a tab that was asleep is right. At midnight it becomes a **Play #43** button.

### 9.4 Statistics (from the bar-chart button, any time)

- Four figures: **Played**, **Win %**, **Current streak**, **Best streak**.
- **Guess distribution:** six horizontal bars (1–6), each sized against the largest, with today's bar highlighted when today was won.
- The no-storage line when storage is unavailable (§8).

### 9.5 Settings (from the gear)

- **Hard mode**, a switch, disabled after today's first guess, with the reason shown.
- **High-contrast colours**, a switch: orange for correct and blue for present, on the tiles, the keyboard and the share grid.
- Light and dark follow the site's theme; there is no separate switch.

How to play, Statistics and Settings open as native `<dialog>` panels. Escape closes them, focus moves into the panel and returns to the button afterwards, and typed letters are ignored while a panel is open.

### 9.6 Loading and failure

- While the three data files load (the `import()` calls in §4.3): "Loading today's puzzle…".
- If any of them fails: "The puzzle could not be loaded." with a **Try again** button that runs the imports again, as Odd one out's `CantLoad` screen does.

---

## 10. Accessibility and language

- **Screen readers:**
  - each tile's label says its letter and state, e.g. "F is in the right spot", "A is in the word, wrong spot", "T is not in the word";
  - each submitted row is announced in one line;
  - keyboard keys say their state too ("E is not in the word").
- **Not colour alone:** the high-contrast option, plus the tile labels.
- **Keyboard:** physical letter keys, Enter and Backspace work anywhere on the page. Keys pressed with Ctrl, Alt or Meta are ignored, so browser shortcuts still work. Enter typed while a button has focus presses that button and does not also submit a guess. After an on-screen key is clicked, focus is moved off it so Enter cannot repeat that key.
- **Motion:** with `prefers-reduced-motion`, tiles change colour without turning over and rows do not shake.
- **Mobile:** `touch-action: manipulation` on keys, so a double tap does not zoom.
- **Translation:**
  - all on-screen English is written so the collector registers it;
  - sentences with values ("Letter {position} must be {letter}", the countdown) are single texts with placeholders, at most three values each, per [README.md](../../../content/translation/README.md);
  - there are no hand-written plurals;
  - numbers and dates go through the site's formatters;
  - the `document.title` follows the head-text rule the other games use.
- **What stays English on purpose:** the word lists and the puzzle itself are English, and the verse is always the BSB. The implementer records this as a ruling with its reason in the translation system's `unregistered-reviewed.json` (or wherever the data check asks for it), so it is not flagged as missed translation.

---

## 11. Files (for the implementation step)

New, all inside this game's own folders:

| File | Purpose |
|---|---|
| `src/pages/games/wordle/WordleGame.tsx` | The page (default export): loads the data, shows the error state, the header and the three panels. |
| `.../wordle/Board.tsx`, `Keyboard.tsx`, `Result.tsx`, `Panels.tsx` | Board, keyboard, result card with verse, and the help, stats and settings dialogs. |
| `.../wordle/evaluate.ts` | `evaluate`, keyboard state, hard-mode check, guess validation. |
| `.../wordle/daily-rules.ts` | The schedule rules (§6.2) and the day-by-day fallback past the file's end, shared with the build script. |
| `.../wordle/daily.ts` | The puzzle number, the date of a number, the word for a number (calling the fallback past the file), time until midnight. |
| `.../wordle/storage.ts` | `bp-wordle` read, parse and write, and the streak rules (§8). |
| `.../wordle/share.ts` | `shareText` and `shareResult` (§7). |
| `.../wordle/text.ts` | Category hints and win lines, written as label texts so translation picks them up. |
| `.../wordle/wordle.css` | Game styles (uses the site's colours and theme variables). |
| `src/data/wordle/curation.json`, `answers.json`, `daily.json`, `guesses.json` | §4.3. |
| `scripts/build-wordle.ts` | §4.3. |

Outside the repository: `<sources>/enable/enable1.txt`, the ENABLE download, in the site's raw-sources folder (§4.2). It is needed only to rebuild the guess list; the game ships the generated `guesses.json`.

Changed, one line or entry each:

- [registry.ts](../../../src/pages/games/registry.ts): the `wordle` entry becomes `status: "live", load: () => import("./wordle/WordleGame")`. The title, description and audiences stay as they are.
- [README.md](../../../src/pages/games/README.md) for games: a short "Bible Wordle" section like Map quest's (the data and build command, the epoch and how to move it before launch, "retire, never delete" after launch, "put a build live within 14 days", where ENABLE lives, known gaps).
- [SOURCES.md](../../../SOURCES.md) and [NOTICE.md](../../../NOTICE.md): the ENABLE credit and how the lists were derived.

Not touched: `App.tsx`, the router, the hub page, the menu and other games' files. (Map quest's code is read and copied from, never changed.)

---

## 12. Tests (Vitest, so they run in `npm test`)

- **`evaluate.test.ts`:** the table in §3.2; keyboard best-colour rules; hard mode, including a letter needed twice and green letters kept in place; refusals (too short, unknown, repeated).
- **`data.test.ts`**, over the real generated files:
  - every answer is 5 letters A–Z, in the guess list, and in `curation.json`;
  - every verse id exists in the BSB and its text contains the word as a whole word (read with [bsb-for-tests.ts](../../../src/lib/bsb-for-tests.ts));
  - every person and place has a verse that was chosen by hand;
  - every `person` slug exists and its `pid` matches `people-slugs.json`;
  - there are at least 400 answers that are not retired;
  - no `blocked` word is in the guess list;
  - no answer is in `usSpellings`;
  - every word in `daily.json` (frozen days included) has an entry in `answers.json`, and no day after `frozenThrough` uses a retired word.
- **`daily.test.ts`:**
  - the whole schedule keeps every rule in §6.2, including around pins (no pinned word in the 300 days before its pin, no person or place beside a pinned person);
  - pins land on their dates;
  - the frozen days match a copy saved at implementation time;
  - the fallback past the end of the file keeps the rules for 400 more days and gives the same words on every run;
  - a schedule cut short and rebuilt keeps the fallback days a browser would have shown (§6.3).
- **`daily-dst.test.ts`**, a file of its own like Map quest's, because it sets the time zone for its whole process: puzzle numbers go up by exactly 1 across both daylight-saving changes in `America/New_York`, `Europe/London` and `Australia/Sydney`.
- **`storage.test.ts`:**
  - damaged values (wrong types, negative numbers, a 9-letter guess, a `dist` with 3 entries) come back sound;
  - streak cases: win after a win the day before, win after a gap, a loss, a replayed old puzzle;
  - a guess for the wrong puzzle or a duplicate guess is refused.
- **`share.test.ts`:** a win, a loss (`X/6`), hard mode `*`, the hint 💡, light and dark squares, high contrast; and never a letter of the answer in the text.
- **`WordleGame.test.tsx`** (Testing Library, fixed date and data):
  - type a word with the physical keyboard and see the tiles and keys colour;
  - an unknown word is refused without using a row;
  - winning shows the result card, the verse and the share button;
  - a reload brings back the board;
  - storage failing still lets the game play.
- The hub's own [games.test.tsx](../../../src/pages/games/games.test.tsx) covers the registry entry without any change.

Implementation also runs `npm run lint`, `npm test` and `npm run build` (whose `prebuild` includes the translation and verse-wording checks) and reports their real results.

---

## 13. Cost

- **Money:** $0. No API, no model at runtime, no new package, no new service. Choosing answers and checking verses is done by hand in the implementation step. With fewer than 1,000 short items, no batch model run is needed.
- **External dependency:** none at runtime. ENABLE is downloaded once into the site's raw-sources folder, and the game ships only the generated list of about 10,000 words (`guesses.json`, in the repository). If the mirror disappeared later, the game keeps working; only rebuilding the guess list would need the saved download or another copy matching the recorded SHA-256.
- **Page weight:** about 20 KB compressed for the guess list, about 15 KB for answers and schedule, and one BSB book file for the verse. All of it loads only on this page.

---

## 14. Edge cases

| Case | What happens |
|---|---|
| Repeated letters in the guess or answer | The two-pass rule (§3.2), with tested examples. |
| An unknown word, too few letters, or a repeat guess | Refused with a message and a shake; no try used. |
| Hard mode switched on mid-game, or in another tab | The switch is locked after the first guess. Each game stores the mode it started with. |
| Midnight passes during a game | The board keeps the puzzle it opened with, and finishing it counts for that number. When the game ends, "Play #43" is offered. |
| Two friends in different time zones | They can be on different puzzles for a few hours. This is accepted, as in Wordle. |
| Clock set back, or a puzzle number below 1 | Below 1, the page shows "Bible Wordle begins on {date}." A puzzle at or below `lastDone` plays but never changes the stats. |
| Clock set forward | The player gets that day's word. Their streak is their own business, as in Wordle. |
| Past the end of `daily.json` | The browser carries on with the same rules (§6.3). |
| The owner removes a word after launch | The word is marked `retired`, not deleted (§4.1). The next build keeps frozen days, including any that use it, and reschedules later days without it. Its verse and category stay in `answers.json`, so a frozen day that uses it still shows a full result card. Deleting it outright makes the build stop with a message saying to retire it instead. |
| A new build reaches the live site days after it was made | Days up to 14 days after the build are frozen, so nothing anyone has played changes (§6.3). Later than that, build again before putting it live. |
| Storage blocked, full or damaged | The game plays, stats are not kept, a notice appears, and the damaged record is rebuilt as empty (§8). |
| Two tabs open | They stay in step through the `storage` event, and a guess cannot be counted twice (§8). |
| Data files fail to load | "The puzzle could not be loaded." with **Try again**. |
| The verse fails to load | The reference link is still shown, with a short note. |
| The answer appears in the verse as a possessive or capitalised | Highlighting ignores case and allows *’s*. |
| The site in Spanish or another language | The interface is translated, the words stay English with a note, and the verse is the BSB, with "Read in context" opening the BSB. |
| Rude words | They can be typed as guesses if they are in ENABLE or a Bible (slurs are blocked), but they are never answers, because only curated words can be answers. |
| British spellings | Answers avoid US/UK spelling differences. Guesses accept whatever ENABLE and the Bibles contain. |
| Reading tomorrow's answer in the site's files | Possible, as it was in Wordle. The game never displays it. |
| Pressing Enter on a focused button, or tapping keys very fast | Enter goes to the focused button only. Input is locked while a row turns over, so a double Enter cannot submit twice. |
| Ctrl/Cmd + letter, non-Latin keyboards, IME input | Shortcuts are ignored. Only A–Z key values count, so the on-screen keyboard always works. |
| Screen-reader and reduced-motion users | §10. |
| The share sheet is cancelled | Nothing happens and no notice is shown. If sharing fails, the text is copied instead, and if the clipboard is blocked a copy box opens (§7). |
| The first-ever visit | How to play opens by itself once (`seenHelp`). |

---

## 15. Open points for the review step and the owner

1. **The owner may want to read the answer list** before launch, especially the names and the tier-3 words. It is one JSON file (§4.1). Before launch words can simply be deleted; after launch they are marked `retired`.
2. **Christmas and Easter pins** (`jesus`, `risen`) are a suggestion. Remove `pins` to turn them off.
3. **No practice mode or archive** in this version, to keep the "one a day" habit and the scope small. If families ask for more, a "past puzzles" mode that does not count towards stats could be added later from the same schedule.
4. **A shared share helper:** Testimonies, Map quest and Bible Wordle will each hold the same share-sheet/clipboard fallback. Merging them is a small job for after the four chains finish, not for this one.
5. **The 300-day window and the name/tier spacing** are judgement calls. The review may tighten or loosen them, as long as the pool size keeps them achievable (§6.2).

---

## 16. Sources

- Wordle history and word-list sizes: [Wikipedia, Wordle](https://en.wikipedia.org/wiki/Wordle); [Wordle's founder built the game for his partner](https://theygotacquired.com/gaming/wordle-acquired-by-the-new-york-times/); [Will Wordle ever run out of words?](https://wordlesolver.online/blog/will-wordle-run-out-of-words/).
- Repeated letters and hard mode: [How Wordle handles duplicate letters](https://www.word-challenge.com/guides/duplicate-letter-handling/); [Wordle duplicate letter rules](https://5letterwords.io/blog/wordle-duplicate-letter-rules); [Wordle hard mode guide](https://www.wordleanalyzer.com/blog/wordle-hard-mode-guide/).
- Bible clones: [Christian Wordle (faith.tools)](https://faith.tools/app/christian-wordle); [Christian Wordle review](https://learnofchrist.com/resources/christian-wordle); [Biblicle](https://faithtree.com/game/biblicle/); [Bibordle](https://bibordle.web.app/); [BibleDle](https://bibledle.com/); [EverWell games](https://www.everwellwithchrist.com/games); [Lordle](https://faith.tools/app/lordle).
- Word-list licences: [12dicts readme](https://wordlist.aspell.net/12dicts-readme/) (12dicts public domain except lists built on AGID); [SCOWL copyright file](https://github.com/neopass/wordlist/blob/master/scowl/Copyright) (ENABLE's master list formally released into the public domain).
- Site code and data: everything in §2.3 and §2.4 was read or measured on 2026-11-07. The word counts and verse picks came from throwaway scripts kept in this job's own folder, not in the site.

---

## 17. Review

**Review step:** sequence 30, step 5, 2026-11-07. One critical pass against the owner's spec (APPROVED-IDEAS.md entry 12: a daily puzzle, a Bible word, shareable scores), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the site's [AGENTS.md](../../../AGENTS.md), and the real code: the games [registry.ts](../../../src/pages/games/registry.ts) and [README.md](../../../src/pages/games/README.md), Map quest's daily files and its schedule builder [build-map-quest-daily.ts](../../../scripts/build-map-quest-daily.ts), Odd one out's loading screen, [verses.ts](../../../src/lib/verses.ts), [study.ts](../../../src/lib/study.ts), [paths.py](../../../scripts/bible/paths.py), [check-verse-wording.py](../../../scripts/check-verse-wording.py) and the data files the design names.

**Verdict:** the design meets the spec and the rules: one shared puzzle per date, answers that are always Bible words, a spoiler-free share grid, BSB verses stored as ids only, no runtime model and $0 cost, only the game's own files plus its registry entry. All five colouring examples in §3.2 were worked through by hand and are correct. The registry slug `wordle`, `useVerses({ id }, { bible: "bsb" })`, `formatRange`, `bsb-for-tests.ts`, the BSB and cross-reference file formats, the people fields and Map quest's patterns are as the design describes. The problems below were all fixed in the body above; nothing was left open.

### What changed, and why

| # | Problem found | Fix applied | Where |
|---|---|---|---|
| 1 | **Removing a word after launch would break past puzzles.** Frozen days keep the removed word, but the design rebuilt `answers.json` from the curation file, so that day's result card would have no verse or category. Map quest's own build stops in this case. | After launch a word is never deleted, only marked `retired: true`: never scheduled again, but its entry stays in `answers.json`. The build stops, with a message saying to retire it, if a frozen day's word is missing. Tests check every scheduled word has an entry. | §0, §4.1, §4.3, §12, §14, §15 |
| 2 | **A late release could change puzzles people had already played.** Freezing only two days past the build assumes the new file goes live within two days, but building and putting the site live are separate manual steps. Days in between would be regenerated, and a stored board replayed against a different answer. | Freeze 14 days past the build (`FROZEN_AHEAD = 14`, `--freeze-days`, never below 2), write `builtOn` into `daily.json`, and the README says to put a build live within 14 days or build again. The cost, stated in the doc: a retired word can still appear for up to two weeks. | §0, §4.3, §6.3, §11, §14 |
| 3 | **Rebuilding after the file had run out would rewrite days browsers had already worked out.** Copying only the days in the old file (Map quest's approach) regenerates fallback days with different words. | The build first extends the old schedule with the same fallback function the browser uses (kept in `daily-rules.ts`), then freezes. A test covers it. | §6.3, §11, §12 |
| 4 | **Pins were not checked ahead.** Choosing days one by one could put `jesus` a month before its Christmas pin, or a person on Christmas Eve next to the pinned `jesus`, breaking the no-repeat and name-spacing rules. | Pins are placed first and every rule is checked in both directions around them. Pins exist only inside the file. Tests cover it. | §6.2, §12 |
| 5 | **Wrong place for the ENABLE download.** `intake/` is the data-intake catalogue web page, not file storage. The site keeps raw downloads in its sources folder (found by `paths.py`) with checksums in SOURCES.md. The cost section also wrongly said the raw file sits in the repository. | ENABLE goes to `<sources>/enable/enable1.txt`, found the same way `paths.py` finds the folder, with its SHA-256 checked. Only the generated `guesses.json` ships. | §0, §2.3, §4.2, §4.3, §11, §13 |
| 6 | **The person line would have loaded a 384 KB file.** "Their one-line description from `people.json`" means fetching all 3,133 people in the browser, in English only. | `answers.json` stores the person id too (looked up from `people-slugs.json`, whose real shape is `{ slugs: { slug: id } }`). The result card loads just that person with `loadPersonDetail(id)`, which is translated where the site has it. If it fails, the description is left out and the link stays. | §2.3, §4.3, §5 |
| 7 | **No safe way to move the launch date.** The design said the epoch could be moved before launch but not how, and moving it would renumber puzzles and shift pins. | As Map quest does: the script refuses a different `--epoch` while `daily.json` exists; to move it before launch, delete the file and build again. Written into the README section too. | §4.3, §6.1, §11 |
| 8 | **The US/UK spelling test had nothing to check against.** | Added a hand-kept `usSpellings` list to the curation file, with a starting list; the build and the tests refuse any answer in it. | §4.1, §4.3, §12 |
| 9 | **How the data loads was unclear,** and nothing stopped the page from importing the curation file, which holds the slur block list. | The page loads the three generated files with `import()` in `Promise.all`, like Odd one out, and "Try again" runs them again. `curation.json` is for the build and the tests only. | §4.3, §9.6 |
| 10 | **Smaller precision fixes.** | Hard mode's letter count is stated exactly (the most times a letter was green or yellow in any one earlier guess). `daily-rules.ts` imports carry `.ts`, as Node needs. The time-zone test gets its own file, as in Map quest, adding Sydney. A redundant clause in the tier-3 rule was removed. Curation is done in the implementer's own session, never one agent per word, in line with the workspace batch rule. | §3.3, §4.1, §6.2, §12 |

### Checked and kept as they are

- **The 300-day window and the name and tier-3 spacing** (open point 5). With at least 400 active answers, about 15% names and at most 15% tier 3, both rules leave plenty of room, and the build stops rather than relaxing a rule if they ever cannot be met.
- **Plain digits in the share text's puzzle number.** Map quest's share text also writes `#${n}` with plain digits.
- **Two time zones briefly on different puzzles, and a schedule that can be read in the site's files.** These are accepted on purpose, as in Wordle.
- **The owner's open points in §15** (reading the list, the Christmas and Easter words, no archive) are the owner's to decide. None of them blocks the implementation.

### Noted for later, outside this feature

Map quest's schedule builder has the same short two-day freeze (problem 2) and the same copy-only rebuild (problem 3). This review did not change it, because the chains must touch only their own feature. It is worth a small follow-up after the four chains finish.
