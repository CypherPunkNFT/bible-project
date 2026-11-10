# Emoji stories — design

**Status:** research and design, sequence 31 step 14 (2026-11-09); reviewed once, step 15 (2026-11-09) — corrections
applied in the body and listed in the [Review](#review) section at the end. **Implemented, step 16 (2026-11-09):** live
on `/games/emoji-stories` in the local preview (not released). The set has 106 puzzles (tiers 40/47/19, Old and New
Testament 53 each): Appendix A's 71 plus 35 new ones. Two more new candidates, Nicodemus and Joseph in prison, were
dropped after a blind solve missed them three times out of three; the golden calf, the temptation and the talents moved to tier 3 for the same reason. The Daily
starts on 2026-11-09. The Daily screen's file is `DailyScreen.tsx`, not `Daily.tsx`, because Windows reads `./Daily`
and `./daily` as the same file. Two more choices made in the build: the emoji row is `role="group"` with the
"Clues: …" label rather than `role="img"` (§11.7), because an image role would hide each tile's own label from touch
exploration; and the Daily's *Answer with* choice is kept for that day only, so every Daily opens on Typing (§6.1) while
Practice and rooms remember the device's choice. Code: [src/pages/games/emoji-stories/](../../../src/pages/games/emoji-stories/). Approved spec: entry 21 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) — *"A Bible story told in emoji
(boat, rain, rainbow = Noah); guess the story."* Shared rules: [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md).
Slug and registry entry: `emoji-stories`, already listed as coming soon in
[registry.ts](../../../src/pages/games/registry.ts) (shelf *Family and party*, audiences solo, family and youth group).

## 0. Summary

A row of three to six emoji tells one Bible story; the player names the story. Everything below follows from one
principle: **a puzzle is fair only when every emoji stands for something actually in the passage, and the row as a whole
fits one story better than any other in the set.**

- **The puzzle set is written once, by hand, and stored** in one data file. Each emoji carries the word from the
  site's own Berean Standard Bible (BSB) passage that it stands for ("🧺 basket", Exodus 2:3), and the tests check every
  one of those words against the BSB text, every emoji against the Unicode version list, and every pair of puzzles for
  being too alike. A generated review sheet puts each emoji's official Unicode name beside its word ("cactus — rain"),
  so a clue that does not mean what it claims is easy to spot by eye. A 71-puzzle starter set is in
  [Appendix A](#appendix-a-starter-set-71-puzzles); it already passes all the mechanical checks. No model runs at play
  time, and none is needed to write the set.
- **Two ways to answer.** *Choices* (four story titles, one tap) is the default: it works for children, on every phone,
  and in every site language. *Typing* (search box with suggestions from the game's closed list of stories) is offered
  as the harder way, and is the default for the Daily puzzle. A typed answer is never judged by its spelling: the player
  picks a story from the suggestions and the game compares story ids.
- **Three hints, least to most revealing:** where it is in the Bible (the book), what the pictures mean (each emoji's
  passage word appears under it), and who is in it. Hints cost points in Practice; in the Daily each wrong guess opens
  the next one.
- **The reveal** shows the story's title, each emoji with its passage word, a key verse quoted from the BSB, and links to
  read the whole passage and, where there is one, the main person's page.
- **Three modes:** *Daily* (one puzzle for everyone on a local date, three guesses — two if answering by choices — and
  a spoiler-free share line),
  *Practice* (rounds of ten, Easy / Mixed / Hard, Old / New Testament / both) and *Show a room* (big emoji appear one at
  a time on a screen for a family or youth group to shout out; the leader reveals).

## 1. What the spec fixes, and what this design decides

| The spec fixes | This design decides |
|---|---|
| A Bible story told in emoji; the player guesses the story. | What makes a puzzle fair and how that is checked (§5); how answers are taken and matched (§6); the hint ladder (§7); modes, scoring and the daily schedule (§8–§9); the reveal (§10); screens (§11). |
| The owner's example: boat, rain, rainbow = Noah. | The starter puzzle for Noah is 🚢 ark · 🐾 animals · 🌧️ rain · 🕊️ dove · 🌈 rainbow, every word checked in Genesis 6:13–9:17. |
| The shared rules: no runtime model cost, reuse site data, BSB wording, games register in the hub, touch only this game's files, tests and build in the implement step, never deploy. | All followed; where a rule shapes a choice it is named at that point. |

## 2. Research

### 2.1 Emoji-guessing games

- **App quizzes ("Guess the emoji", "Emoji quiz").** A fixed sequence of levels, each a short emoji row for a film,
  phrase or saying, answered by building the word from a tray of letters. Their weak spot, and the commonest complaint,
  is clues that only work as puns on the title's *words* (🐝 for "be"): solvable only if you already know the title and
  think in English sound-alikes. For a Bible game that is doubly bad, because children, translated pages and readers who
  know the story but not its usual English title are all shut out.
- **Daily emoji film puzzles (Emovi, from the makers of Worldle, and its imitators).** One puzzle a day for everyone,
  three guesses, the answer typed into a search box that suggests titles from the game's own list, and a share line of
  coloured squares. Third-party guides agree on the three guesses but disagree on how hints work (one optional hint, up
  to two hints, or extra clues after wrong guesses), and one tip they give is telling: *"sometimes the emoji clue may
  represent the words in the title more than the actual movie plot"* — the pun problem again. What carries over: a
  closed list so spelling never costs a guess, three tries, hints that open as you miss, and a share line that does not
  give the answer away.
- **Bible emoji games for churches.** This is a well-worn youth-group format, sold and shared as slides and printables:
  Download Youth Ministry's *Emoji Bible Stories* and *New Test-Emoji Game* (ten stories each, on a screen), its *Bible
  Emoji Battle* (**emoji revealed one by one**, head-to-head or in teams), KidzMatter's Old and New Testament decks with
  a leader's answer sheet, Church Visuals' ten Genesis stories in **three emoji each**, a Teachers Pay Teachers set of
  twenty children's stories in **three to seven emoji** whose answer slides give **the reference and a summary**, and a
  free online quiz with a 15-second timer that shows the answer with a summary and reference. The story list these sets
  share is the one charades already uses (creation, the fall, Noah, the burning bush, Jericho, Jonah, the lions' den, the
  nativity, Zacchaeus, the prodigal son, feeding the five thousand…). Two things to copy: the reveal ends with the
  passage, and a room plays best when the emoji arrive one at a time.

### 2.2 How emoji look on different phones

- **The same emoji is drawn differently by Apple, Google, Samsung and Microsoft**, and people read them differently.
  The University of Minnesota's GroupLens study (*"Blissfully happy" or "ready to fight"*, ICWSM 2016) showed 125
  renderings of 25 emoji: the same "grinning face with smiling eyes" read as blissful on Google's design and ready to
  fight on Apple's; in a quarter of cases people could not even agree whether one rendering was positive or negative,
  and the disagreement grew across platforms. **Faces and feelings are the least reliable clues**; objects, animals and
  weather are read consistently.
- **New emoji are missing on older devices.** A phone or computer can only draw emoji its font knows. Anything from
  Unicode Emoji 14.0 (2021) onward is missing on many phones still in use; Windows 10's emoji font stops before Emoji
  13.0 (2020), so 🪜 ladder, 🪨 rock, 🪵 wood and the like show as empty boxes there. The tempting 🫏 donkey is Emoji 15.0
  (2022). A missing emoji is not a cosmetic problem here: it deletes a clue.
- **Flags never show on Windows.** A flag emoji is two "regional indicator" letters; Windows' emoji font has no flag
  pictures, so Chrome and Edge on Windows show the letters ("EG") instead. Firefox brings its own font and is unaffected.
- **Combined emoji fall apart on older fonts.** Many people and job emoji (🧑‍🌾 farmer) are several emoji joined by an
  invisible joiner; a font that does not know the combination shows the parts side by side, changing the clue. Skin-tone
  versions add a colour square on fonts without them.

### 2.3 What the research means for this game

1. **Clues stand for things in the passage, never for sounds of the title.** Each emoji names its passage word, and the
   tests check that word is in the BSB text. Puns are out by construction.
2. **Objects, animals, places and weather carry the puzzle; faces may add colour but never carry it** (the closeness
   rule in §5.4 counts only non-face emoji, so no face is ever what separates two puzzles).
3. **Only emoji up to Unicode 13.0, no flags, no joined sequences, no skin tones** — and the page still guards against a
   missing glyph (§11.6).
4. **A closed list of answers** for typing, three guesses in the Daily, hints that open on a miss, a share line without
   the answer.
5. **For a room, reveal the emoji one at a time**, and finish every puzzle with the passage.

## 3. Site data reused

| What | Where | Used for |
|---|---|---|
| The BSB text, one file per book | `data/plain/bsb/<BOOK>.json` (keys `"chapter:verse"`) | The tests check every clue word against the passage; the key verse is quoted from it. |
| Verse display and links | `Verse` in [Verse.tsx](../../../src/components/Verse.tsx) (`bible="bsb"`), the reader's address form `/read/bsb/<BOOK>/<chapter>?hl=<verse>` (as [two-truths/Reveal.tsx](../../../src/pages/games/two-truths/Reveal.tsx) uses) | The reveal's quote and its "Read the story" link. |
| Charades' 129 checked scenes | [scenes.json](../../../src/data/charades/scenes.json) | The story list and its references were the starting point for Appendix A; ids are kept where the story is the same, so the two games can link to each other later. No code dependency. |
| People pages | [people-slugs.json](../../../src/data/people-slugs.json), read through `slugOf` in [people-slugs.ts](../../../src/lib/people-slugs.ts); pages live at `/people/<slug>` | The reveal's "More about Noah" link; the "right person, wrong story" feedback (§6.4). |
| Bible Wordle's daily pattern | [wordle/daily.ts](../../../src/pages/games/wordle/daily.ts), [daily-rules.ts](../../../src/pages/games/wordle/daily-rules.ts), [share.ts](../../../src/pages/games/wordle/share.ts); Timeline sort's committed [timeline/daily.ts](../../../src/pages/games/timeline/daily.ts) and [daily-rules.ts](../../../src/pages/games/timeline/daily-rules.ts) | The same local-date numbering, schedule-file approach and share fallback. **Copied in small, not imported**: the Wordle folder is still uncommitted in the working tree (checked again at review), and the Two truths step found that importing another chain's uncommitted file breaks a commit of this game on its own. Timeline's copy is committed and is the safer one to read from. |
| The games hub | [registry.ts](../../../src/pages/games/registry.ts), [README.md](../../../src/pages/games/README.md) | Going live is one entry change; its shelf and picture are already set. |

The ~5,000-question bank is not used: its questions are text and would not make emoji puzzles. The people and places data
are used only for links.

## 4. Content model

One hand-kept file, [src/data/emoji-stories/stories.json](../../../src/data/emoji-stories/stories.json) (written in the
implement step), holds the stories and their puzzles; a build script writes two more from it (§12).

```json
{
  "about": "Emoji stories, hand-kept. Design: docs/features/emoji-stories/design.md. npm test checks every row.",
  "version": 1,
  "stories": [
    {
      "id": "baby-moses",
      "title": "Baby Moses in the basket",
      "ref": "EXO 2:1-10",
      "key": "EXO 2:3",
      "tier": 1,
      "testament": "old",
      "who": "Moses, his mother and Pharaoh's daughter",
      "people": ["moses-exo-2-10"],
      "aliases": ["moses in the bulrushes", "moses in the basket", "moses in the reeds"],
      "emoji": [["👶", "child"], ["🧺", "basket"], ["🌿", "reeds"], ["👸", "daughter"]],
      "confusable": []
    }
  ]
}
```

| Field | Meaning and rule |
|---|---|
| `id` | Stable, lower case with hyphens; the charades scene id where the story is the same. Never reused, never renamed. |
| `title` | The answer as shown on choice buttons, in suggestions and on the reveal. Short (≤ 48 characters), the name people use for the story. |
| `ref` | The passage, one or more ranges in the charades form (`"GEN 18:9-15; GEN 21:1-7"`, `"JON 1:3-2:10"`). Every clue word must be inside it. |
| `key` | One to three verses inside `ref`, quoted on the reveal. Must contain at least one clue word; at most 60 words. |
| `tier` | 1 = every Sunday-school child knows it; 2 = regular church-goers know it; 3 = Bible readers know it. Sets Easy / Hard (§8). |
| `testament` | `"old"` or `"new"`, for the Practice filter and for picking believable wrong choices. |
| `who` | Hint 3 (§7): the main people, or "A story Jesus told" for a parable. Plain words, no Bible reference. |
| `people` | Person ids (as in `data/study/people/`), optional; for the reveal's link and the near-miss feedback. |
| `aliases` | Other names for the story that a player might type (§6.3): traditional names ("the fall", "Jacob's ladder", "the widow's mite"), main names ("Noah"), common spellings ("Zaccheus"). **No alias may be made only of clue words** ("basket", "ladder"), so typing straight off the pictures does not find the answer; a traditional name that contains clue words follows the same limit as titles (§5.2.6). |
| `emoji` | Three to six pairs of `[emoji, word]`. The word is the passage word the emoji stands for, as it is spelled in the site's BSB. Order is the order the story tells them. |
| `confusable` | Ids of stories this one must never be offered beside as a wrong choice (§5.4); kept symmetric by the test. |
| `retired` | Optional `true`. A retired story is never dealt again and never scheduled, but stays in the file for past Daily puzzles. Never delete a story after launch. |

One puzzle per story keeps the model simple and the answer list unambiguous. A story can be split later (Jonah's storm
and Jonah's fish) only by giving each its own id and passage.

## 5. The puzzle set (written once, checked for fairness)

### 5.1 Which stories

- **Launch with at least 100 puzzles, aiming for 120**, so the Daily goes three to four months before any repeat and
  every Practice filter has at least 20. The 71 in Appendix A are the start; the implement step adds the rest from the
  remaining charades scenes (Hannah's prayer, Philip and the Ethiopian, Eutychus, Jairus's daughter…) and other
  well-known stories (the ten virgins, Joseph in prison, the Shunammite's son), always
  within the content rules below.
- **Balance:** about half Old and half New Testament; about 40% tier 1, 45% tier 2, 15% tier 3; parables and miracles
  both represented.
- **Content rules (family audience):** nothing gory or frightening in the emoji (no 🩸 💀 ☠️ 🔪 🔫 💣 ⚰️), no innuendo
  emoji, no flags, nothing mocking. Hard stories (Cain and Abel, Abraham and Isaac) are allowed when the emoji stay
  gentle, as children's Bibles tell them. **No face emoji (😴 🤫 😢 and the like) and no adult person ever stands for
  God or for Jesus**; where the story needs Him, the passage's own signs do the work (🕊️ dove, 🔥 fire, ☁️ heavens,
  🗣️ voice, 💤 for His sleep), or the other clues do. The one exception is 👶 for the infant Jesus in the birth
  stories, as every nativity scene and children's Bible shows Him. Because a clue word cannot show *who* an emoji
  stands for, this rule is checked by eye on the review sheet, which marks every face and person emoji.

### 5.2 Rules for each clue

1. **It stands for something in the passage**, and its word is spelled as the site's BSB spells it. Memory is not good
   enough: this BSB says *ladder* in Genesis 28:12, *doorframes* in Exodus 12:7, *wealthy* for Zacchaeus and *sleeping*
   for Jesus in the boat — the first draft of Appendix A had all four wrong (§5.6).
2. **No puns or sound-alikes**, no letters spelling a name (🅰️, 🔤), no number emoji standing for anything but a number
   in the text (5️⃣ 🍞 2️⃣ 🐟 is fine; 1️⃣ 2️⃣ is fine for "the Twelve" only where the passage says twelve). A number
   emoji's clue word must itself be a number, so the BSB check proves the number is there.
3. **The emoji means what the word says, on every platform.** Its Unicode name should be the word or plainly include it
   (🧺 *basket* — basket). Near fits are allowed when the picture is unmistakable (🚢 *ship* for the ark, 🏨 *hotel*
   for the inn) and are what the review sheet is for. A cactus for "no rain" is not a near fit.
4. **Faces only as extra colour** (😂 Sarah laughed, 😭 Peter wept), never as one of the two clues that make a puzzle
   distinct (§5.4), and never for God or Jesus (§5.1). A "face" is any emoji in a Unicode `face-…` subgroup of
   `emoji-test.txt` (so 💤, 👀, ✋ and 👶 are not faces), which makes the rule testable.
5. **3 to 6 emoji.** Fewer is a riddle, more is a list.
6. **Not the title spelled out.** For tier 2 and 3, at most one clue word may appear in the title (otherwise *Choices*
   becomes a word-matching exercise). Words are compared after the normalising of §6.3, and a word that differs only
   by a final *s* counts as the same ("widow's" → "widows" counts as "widow", "dreams" as "dream").

### 5.3 Rules for each emoji character

- On the allow-list in [emoji.json](../../../src/data/emoji-stories/emoji.json), which the build script writes from
  Unicode's official `emoji-test.txt` (kept in the raw sources folder as `<sources>/unicode/emoji-test-15.1.txt`, where
  `<sources>` is found the way [build-wordle.ts](../../../scripts/build-wordle.ts) and `scripts/bible/paths.py` find it:
  `BIBLE_SOURCES`, else `sources/` in the site, else `../sources`, which today holds Wordle's `enable/` word list):
  each emoji's Unicode name, version and subgroup (the subgroup is what marks a face, §5.2.4). The script pins the
  file's SHA-256 (`d876ee249aa28eaa76cfa6dfaa702847a8d13b062aa488d465d0395ee8137ed9` for 15.1, checked at review) as
  Wordle pins its word list, and stops if the file differs.
- **Fully qualified** (with the colour-presentation selector, e.g. `🕊️` not `🕊`), **Unicode Emoji 13.0 or earlier**, no
  joiner (U+200D), no skin-tone modifier, no regional-indicator (flag) letters, not on the blocked list in §5.1.
- Appendix A uses 148 different emoji, all 13.0 or earlier; thirteen are from 12.0 or 13.0. The eleven from 13.0 (🪵 🪨
  🪖 🩴 🪟 🪣 🪢 🪜 🪙 🪦 🫓) are the ones a Windows 10 computer cannot draw; the two from 12.0 (🩹 🤏) draw on any Windows 10
  updated since 2019 but may be missing on older phones — §11.6 covers both.

### 5.4 One story, not two: the closeness rule and confusable pairs

Most emoji recur: 🔥 is in the burning bush, Mount Carmel, the fiery furnace, the golden calf, Pentecost, Peter's denial
and the beach breakfast. That is fine — the *row* tells the story. Two checks keep rows apart:

- **The closeness rule (a test):** for every two puzzles A and B, A has **at least two non-face emoji B lacks** (face
  as defined in §5.2.4). One distinct emoji is too thin: if it is missing on the device, or misread, the two rows become
  the same; and a face is the clue most often misread. Appendix A's first draft failed it once — the manna (🐦 💧 🍞 🍯)
  and Elijah fed by ravens (🐦 🍞 🥩 💧) rows differed by one emoji; Elijah's brook became 🏞️ and the pair is now also
  listed as confusable. The review found three more pairs separated only by faces (Jesus calms the storm from Jesus
  walks on the water by 😴 🤫 alone; Peter's denial from the fiery furnace and from the beach breakfast by 🐓 and 😭);
  the storm and Peter rows were changed (Review, below).
- **Confusable pairs (hand-kept, symmetric):** stories a fair player could still mix up never appear as each other's
  wrong choices — Jesus calms the storm / Jesus walks on the water / Jonah (⛵ 🌊 ⛈️), the Red Sea / walking on water,
  manna / ravens, Elijah's chariot / the Red Sea, the fiery furnace / Peter's denial (3️⃣ 🔥), the golden calf / Mount
  Carmel (🐂 🔥) and Lazarus / the empty tomb (🪦 🪨) — the review's blind solves mixed up manna and the ravens, and
  the golden calf and Mount Carmel. The build lists every pair sharing two or more emoji in the review sheet, so the
  list is easy to complete; Appendix A has 26 such pairs after the review's changes.

### 5.5 Who writes the set, and the checks it must pass

**The implement step writes the remaining puzzles by hand** into `stories.json`, starting from Appendix A. This is
authoring once, ahead of time, like the charades scenes; no model is called at play time and no batch job is needed.

Checks, in order:

| # | Check | How |
|---|---|---|
| 1 | Every clue word occurs as a whole word in the BSB text of `ref`; `key` is inside `ref`, ≤ 60 words, contains a clue word. | `stories.test.ts`, reading `data/plain/bsb/` (the same way [scenes.test.ts](../../../src/pages/games/charades/scenes.test.ts) does). |
| 2 | Every emoji is on the allow-list, fully qualified, ≤ 13.0, no joiner, skin tone, flag or blocked emoji; 3–6 per puzzle. | `stories.test.ts` against `emoji.json`; the build script refuses to write `emoji.json` for an emoji not in `emoji-test.txt`. |
| 3 | The closeness rule, counting only non-face emoji; confusable lists symmetric and naming real ids. | `stories.test.ts`, faces read from the subgroup in `emoji.json`. |
| 4 | Tier 2–3 titles contain at most one clue word (§5.2.6), and so does every alias; no alias is made only of clue words; no clue word is "God", "LORD", "Jesus" or "Christ"; every number emoji (keycaps, 🔟, 💯) has a number as its clue word. | `stories.test.ts`. |
| 5 | Ids unique and address-safe; titles unique (case-insensitive); aliases unique across stories unless the alias is a person's name (§6.3); every `people` id exists. | `stories.test.ts`. |
| 6 | **Meaning check by eye**, including the rule that no face or adult person stands for God or Jesus (§5.1). | [review-sheet.md](review-sheet.md), written by the build: each puzzle with every emoji's Unicode name beside its word ("🌵 *cactus* — rain" stands out), every face and person emoji marked, the pairs sharing two or more emoji, and the counts per tier and testament. |
| 7 | **Blind solve.** Someone who did not write a puzzle sees only its emoji and the full title list and names the story. A puzzle missed, or solved only via hint 3, is rewritten or moved up a tier. | The review step did this for Appendix A (four runs, see the Review section); the implement step does it for what it adds, using one minimal-context call that sees only the emoji and titles (no workspace context, no tools, as the workspace's batch rule requires; a run of 71 puzzles read about 3,600 tokens). The owner may also play the sheet. A larger repeated model pass is §15's open point, not part of the plan. |

### 5.6 Prototype evidence (this step)

The Appendix A draft was run through checks 1–3 with a throwaway script (Python, the site's `data/plain/bsb/` and Unicode's
`emoji-test.txt` 15.1). The first run found **17 problems in 71 puzzles**: thirteen clue words not in this BSB's wording
(stairway → *ladder*, doorposts → *doorframes*, rich → *wealthy*, asleep → *sleeping*, house → *home* in Mark 2…), one
emoji outside the version limit (🫏 donkey, Emoji 15.0, which was also not in Luke 2 at all), and passage ranges too short
for their clue (the golden calf's fire is in Exodus 32:20). After fixes it found one closeness failure (manna and the
ravens). Reading the rows by eye then caught what no mechanical check can: 🌵 cactus standing for "no rain", 😴 sleeping
face standing for Saul *relieving himself* in the cave, 🙅 for Esther's fast and 🏚️ for famine — all replaced. That is
exactly why §5.5 has a review sheet and a blind solve as well as tests. The final run: **71 puzzles, 142 distinct emoji,
0 problems, highest version 13.0, no closeness failures.** That run covered checks 1–3 only. The review re-ran them with
its own script and added check 4 and the face-aware closeness rule: five tier 2 titles had two or three clue words in
them, the Last Supper's 1️⃣ 2️⃣ stood for "apostles" rather than a number in Luke's text, and three pairs were told apart
only by faces. All are fixed in Appendix A; the corrected set passes checks 1–4 (Review, below).

## 6. Answering: choices or typing

### 6.1 The choice

| | Choices (four titles, one tap) | Typing (search box, closed list) |
|---|---|---|
| Who it suits | Children, families, first-timers, phones | Regular players, the Daily |
| Difficulty | Recognition: easier; three wrong titles also teach | Recall: harder, closer to the room game |
| Fairness risk | Wrong choices that also fit (handled by §6.2) | Spelling and wording ("Noah's ark" / "the flood"): handled by never judging text (§6.3) |
| Translated site | Works fully once the game data is collected for translation (§15.1); until then the titles show in English | Matches English titles and aliases until then; translated titles join the search keys once they exist |
| Accessibility | Four big buttons, keys 1–4 | A standard combobox with a listbox; screen-reader friendly but more steps |

**Decision:** both, chosen with one switch, *Answer with: Choices / Typing*, remembered on the device. Practice and
Show-a-room open on Choices; the Daily opens on Typing and can switch to Choices **before the first guess** of the day
(the share line then says "with choices"). **With choices the Daily allows two guesses, not three**: three tries at four
titles would win three times in four by luck alone, and a streak would mean nothing; two keeps a blind guess at one in
two, and a wrong title is greyed out after it is picked. On a translated site everything opens on Choices.

### 6.2 Picking the wrong choices

Three wrong titles, from stories that have a puzzle, are not retired, and are not the answer:

1. **Never** a story in the answer's `confusable` list, and never a story whose puzzle shares two or more emoji with the
   answer's puzzle (the same rule, applied automatically, so a missed confusable pair cannot produce an unfair choice).
2. **Believable:** prefer the same testament and a tier within one of the answer's; fall back to the other testament
   only if fewer than three remain.
3. **No near-duplicate titles:** not two stories with the same main person on one screen (David and Goliath beside David
   spares Saul invites a coin toss on a misread emoji).
4. **Order** shuffled; the right one in each position about a quarter of the time over a round (a test deals 1,000
   rounds and checks 15–35% per position).
5. **The Daily's choices are seeded by the puzzle number**, so everyone who switches to choices sees the same four.

### 6.3 Matching a typed answer

The player types; the game suggests; **the player picks a suggestion, and the pick is judged by story id.** Free text is
never compared with the answer, so no one is marked wrong for spelling, word order or "the".

- **Search keys of a story:** its title, its aliases, and the plain names of its `people`. On a translated site, the
  translated title too.
- **Normalising** both the typed text and the keys: Unicode NFKD, accents removed, lower case, apostrophes removed
  (`noah's` → `noahs`, and `noah` still matches), `&` → `and`, everything else that is not a letter or digit → space,
  spaces collapsed; then the words *the, a, an, of, and, in, on, at, to* dropped.
- **Ranking** (best score per story, top six shown):
  1. a key equal to the text (100);
  2. a key starting with the text (80);
  3. every typed word is the start of some word in one key (60) — "mos bask" finds *Baby Moses in the basket*;
  4. every typed word of five or more letters is within one edit (insert, delete, change or swap two neighbours) of a
     key word, or two edits at eight letters or more (40) — "zacheus", "nebuchadnezer";
  ties by tier (better known first), then title.
- **Suggestions start at two letters** and update as the player types. Arrow keys move, Enter picks the highlighted one;
  with nothing highlighted, Enter picks the top suggestion only when it scored 100, otherwise it opens the list.
  Tapping a suggestion picks it. A *Guess* button is enabled only once a story is picked.
- **No suggestion:** "No story by that name in this game — try a person or a place." Typing a story the game does not
  have costs nothing.
- **A name shared by several stories** ("David", "Elijah", "Peter") is a fine search: it lists all of that person's
  stories, and the player must choose. That is the recall the mode asks for.
- **Known trade-off, accepted:** a player can type a clue word ("basket") and find a title containing it. Searching costs
  no guess; finding the title through the clue is still solving the clue. Aliases never include clue words (§4), and the
  tier 2–3 title rule (§5.2.6) keeps it from being trivial.

### 6.4 Right, close or wrong

- **Right:** the picked story is the answer.
- **Close:** the picked story shares a person with the answer ("Right person, different story" — Elijah's ravens for
  Elijah's chariot). Shown in amber with words, counted as a wrong guess.
- **Wrong:** anything else.

## 7. Hints

Three, in a fixed order from least to most revealing, the same in every mode:

| Hint | Shows | Example (baby Moses) |
|---|---|---|
| 1. Where | The Bible book(s) of `ref`, and the testament | "Exodus · Old Testament" |
| 2. The pictures | Each emoji's passage word appears under it | 👶 child · 🧺 basket · 🌿 reeds · 👸 daughter |
| 3. Who | The story's `who` line | "Moses, his mother and Pharaoh's daughter" |

- **Practice:** a *Hint* button opens the next one; the first two cost a point each and the third is free (the score
  never drops below 1 for a right answer, §8.2).
- **Daily:** each wrong guess opens the next hint for free; the player may also open one early, and the share line
  shows how many were opened (💡). After the last wrong guess (the third, or the second with choices) the answer is
  revealed, so in the Daily hint 3 is only ever seen by asking for it (and the share line counts it).
- **Show a room:** the leader's *Hint* button shows the next one large on the screen.
- A hint never names the story's title. Hint 3 for a parable is "A story Jesus told", never the parable's name.

## 8. Modes and rules

### 8.1 Daily

One puzzle for everyone on a local calendar date (§9). Three guesses, typed by default (two with choices, §6.1). A solved or lost Daily stays
solved on reload and on the same day in another tab. Stats on the device: played, solved, current and best streak, and a
1/2/3-guess distribution. The share line, copied or sent with the phone's share sheet (the Wordle fallback: share sheet,
else clipboard, else a box to copy from):

```
Emoji stories #42  👶🧺🌿👸
🟥🟨🟩  💡1
bibleguide.io/games/emoji-stories
```

The emoji row is the *puzzle*, not the answer, so it invites friends to play without spoiling. 🟥 wrong, 🟨 close, 🟩 right,
⬜ unused guesses; "with choices" is added when answered by choices (two squares, not three).

### 8.2 Practice

Rounds of ten. Filters: **Easy** (tier 1), **Mixed** (all), **Hard** (tiers 2–3); **Old Testament / New Testament /
Both**. A combination is offered only with at least 20 puzzles. One answer per puzzle; 3 points with no hint, 2 with one,
1 with two or three, 0 if wrong; best score per filter kept on the device. A puzzle seen in the last 60 practice puzzles
on this device is not dealt again while others remain. The round in progress survives a reload (session storage).

### 8.3 Show a room

For a family round the table or a youth group with one screen. The game shows **one emoji at a time**, very large;
*Next clue* adds the next, *Hint* shows the next hint, *Show choices* puts four titles on screen, *Reveal* shows the
answer and the passage (§10), *Next story* moves on. Rounds of ten from the same filters as Practice. The room keeps its
own score; the game does not. Keyboard: → or Space next clue, H hint, C choices, Enter reveal. Nothing is stored except
the last 60 puzzles shown.

## 9. The Daily schedule

Like Bible Wordle and Timeline sort: a schedule file, written ahead of time, read by the page.

- [daily.json](../../../src/data/emoji-stories/daily.json): `{ epoch, frozenThrough, days: [storyId, …] }` (as built:
  `frozenThrough` is the number of days a rebuild must keep, today plus 14, in place of a build date); puzzle #1 is the
  epoch (a local date), `days[n − 1]` is puzzle *n*. Written by `scripts/build-emoji-stories.ts`, about two years ahead.
- **Rules** (in `daily-rules.ts`, shared by the script and the page): no story again within 300 days, or within the pool
  size minus 30 when the pool is smaller (so at least 30 stories are always free to choose from); at most one tier 3 and
  at least three tier 1 in any seven days; Sundays tier 1 (families play together); never more than three days in a row
  from the same testament. Seeded (mulberry32, as Wordle), so the same file always comes out of the same inputs.
- **When no story meets every rule on a day** (possible with a pool of 100–120 and these tier rules, which the first
  draft's "pool minus 10" made likely), the rules give way in a fixed order — first the testament run, then the weekly
  tier mix, then the repeat gap, never the Sunday rule — and the build lists every day that needed it in the review
  sheet. A day is never left empty and the build never loops.
- **Append-only:** a rebuild never changes a day already written for today or earlier, nor the next 14 days; it may
  re-plan days after that (new puzzles join the schedule there). A retired story stays on past days.
- **Past the end of the file**, the page carries on with the same rules over the active stories.
- **Epoch:** the build date until launch. To number from the real launch day, delete `daily.json` and rebuild with
  `--epoch YYYY-MM-DD` before the first release; after launch, never.
- **Local date and the clock:** the puzzle number comes from the device's local calendar date (Wordle's
  `calendarDay`); the page re-checks at midnight and when the tab regains focus.

## 10. The reveal

Shown after a right answer, after the last wrong guess, or on *Reveal* in a room:

1. **The verdict**, in words and colour ("Right!", "Not this time"); for a close or wrong pick, "You picked *David and
   Goliath*".
2. **The title**, as a heading that takes focus.
3. **The emoji with their passage words** under each (hint 2, in full).
4. **The key verse**, quoted from the BSB with `<Verse bible="bsb" …>`, and its reference with "BSB".
5. **Links:** "Read the story" to the passage start (`/read/bsb/EXO/2?hl=1-10` for a one-chapter passage, else the first
   chapter with its first verse highlighted), and "More about Moses" for the first person with a page.
6. **What next:** *Next puzzle* (Practice), the stats and share button (Daily), *Next story* (room).

If the verse text cannot be loaded, the reference and link still show, with "The verse could not be loaded."

## 11. Screens

### 11.1 Start

Title, one-line explanation with the owner's example drawn as a live puzzle (🚢 🐾 🌧️ 🕊️ 🌈 = *Noah's ark and the flood*),
then three cards: **Today's puzzle** (#n, or "Solved in 2 — come back tomorrow" with the time left), **Practice**
(filters and *Start*), **Show a room**. The *Answer with* switch and a *How to play* panel. `?play=daily|practice|room`
opens a mode directly, as Map quest and Timeline do.

### 11.2 Puzzle

- The emoji row, large (about 3rem each on a phone, 4rem on a computer), wrapping to two lines only when needed, in the
  order the story tells them.
- Under it: the hints opened so far; then the answer area (four choice buttons, or the search box with its suggestion
  list and a *Guess* button); then guess slots (Daily) or the round's progress and score (Practice).
- *Hint* button with "(−1 point)" in Practice for the first two hints and "(free)" for the third, or "(shows on your
  share)" in the Daily.

### 11.3 Reveal

As §10, below the puzzle, which stays on screen so the player can match each emoji to its word.

### 11.4 Round end (Practice)

Score out of 30; a line per puzzle with its emoji, its title and a right or wrong mark (each line opens that puzzle's
reveal); *Play again*; the best score for this filter.

### 11.5 Room

The emoji at about a third of the screen height each, the leader's buttons in a row along the bottom, and a full-screen
button.

### 11.6 Emoji that cannot be drawn

The emoji are ordinary text, drawn by the device's own emoji font through a font stack (`"Apple Color Emoji", "Segoe UI
Emoji", "Noto Color Emoji", sans-serif`), so nothing is downloaded and nothing is paid for. On first use the page tests
the current puzzle's emoji: it draws each to a small hidden canvas and checks for coloured pixels and a width unlike the
"missing" box (the same test the common flag-emoji fixes use). **An emoji that does not draw shows its Unicode name in
small type under an empty tile** ("ladder"). That is less of a give-away than hint 2's passage word, and keeps the
puzzle solvable on Windows 10 and old phones. If the canvas is unavailable, nothing is shown and the emoji are assumed
to draw.

### 11.7 Accessibility and look

- The emoji row is one `role="img"` with a label listing the Unicode names in order ("Clues: baby, basket, herb,
  princess"); each tile also has its own label for touch exploration. Hint 2 adds the passage words in visible text.
- Choices are real buttons, keys 1–4 (ignored while typing in a form, and for a held-down key, as Odd one out does).
  The search box is the WAI-ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-activedescendant`, a
  `listbox` of options). Right, close and wrong are words as well as colours. The reveal heading takes focus.
- The room mode's clue-by-clue entrance is a short fade; with *reduce motion* it simply appears.
- Site colours and fonts, light and dark themes, in `emoji-stories.css` with an `es-` prefix. The game's hub picture
  already exists (`GAME_ART.emojiStories`).

## 12. Files (for the implement step)

| File | What |
|---|---|
| `src/data/emoji-stories/stories.json` | Hand-kept stories and puzzles (§4), from Appendix A plus the additions. |
| `src/data/emoji-stories/emoji.json` | Generated: each emoji used, its Unicode name, version and subgroup. |
| `src/data/emoji-stories/daily.json` | Generated: the schedule (§9). |
| `scripts/build-emoji-stories.ts` | Writes the two generated files and the review sheet; `--check` fails if any is out of date; `--epoch`. Reads `<sources>/unicode/emoji-test-15.1.txt` (Unicode 15.1, downloaded once from unicode.org, free; SHA-256 pinned, §5.3). Run with `node --experimental-strip-types`. |
| `docs/features/emoji-stories/review-sheet.md` | Generated (§5.5 check 6). |
| `src/pages/games/emoji-stories/EmojiStoriesGame.tsx` | The page: default export, no props. Screens split into `Start.tsx`, `Puzzle.tsx`, `Reveal.tsx`, `RoundEnd.tsx`, `Room.tsx` to stay under 500 lines each. |
| `…/answer-match.ts` | Normalising, search keys, ranking (§6.3). Pure functions. |
| `…/deal.ts` | Practice rounds, wrong choices (§6.2), recent-puzzle memory. Pure, seeded. |
| `…/daily.ts`, `…/daily-rules.ts` | Local-date numbering and the schedule rules (own copies of the Wordle pattern). |
| `…/emoji-support.ts` | The canvas check (§11.6). |
| `…/storage.ts`, `…/share.ts` | `bp-emoji-stories` in local storage (settings, Daily record, stats, best scores, recent puzzles); `bp-emoji-stories-round` in session storage. Parsed defensively. |
| `…/emoji-stories.css` | Styles. |
| `…/*.test.ts(x)` | §13. |
| [registry.ts](../../../src/pages/games/registry.ts) | The existing entry: `status: "live", load: () => import("./emoji-stories/EmojiStoriesGame")`; shelf and art unchanged. |
| [README.md](../../../src/pages/games/README.md) | A short *Emoji stories* section, added with an edit like the other games'. |

No change to `package.json`, `prebuild`, App.tsx, the menu or the hub page. The game's words and data stay in English in
every language until the translation collector is pointed at `stories.json` by a translation job (§15); the page's own
interface text must pass the build's English-text check (`content/translation/english_build_check.py`) the same way the
other games' pages do.

## 13. Tests (for the implement step)

- **Data** (`stories.test.ts`): §5.5 checks 1–5 over the real file, the counts in §5.1 (at least 100 active puzzles, 20
  per offered filter), and that `emoji.json`, `daily.json` and the review sheet match a fresh build (running
  `scripts/build-emoji-stories.ts --check`, as [statements.test.ts](../../../src/pages/games/two-truths/statements.test.ts)
  does for Two truths; this needs the pinned `emoji-test-15.1.txt` in `<sources>/unicode/`, §5.3).
- **Matching** (`answer-match.test.ts`): every title and alias finds its own story first; the spec's example ("noah",
  "the flood", "Noahs ark", "ark") finds Noah; "zacheus" and "Zaccheus" find Zacchaeus; "david" lists every David story;
  "the" alone suggests nothing; accents and curly apostrophes match plain ones.
- **Dealing** (`deal.test.ts`): 1,000 rounds per filter — no confusable or two-shared-emoji choice, no two choices with
  the same person, positions balanced, no repeats within a round, recent puzzles avoided.
- **Daily** (`daily.test.ts`): every schedule rule over the whole file plus a year of fallback days (any day where a
  rule gave way must follow the §9 order); a small pool (40 stories, only five of them tier 1) still fills two years without an
  empty day; the frozen days are unchanged by a rebuild with an extra story; puzzle numbers across daylight-saving
  changes in three time zones. With choices a Daily allows two guesses.
- **Page** (`EmojiStoriesGame.test.tsx`): a Practice round with choices; a Daily solved by typing on the second guess with
  a close first guess; a lost Daily; hints and score; reload keeps the Daily; the share text; the missing-emoji label
  (canvas mocked); the hub serves `/games/emoji-stories`.
- The site's `npm test` and `npm run build`, as the shared rules require.

## 14. Edge cases

| Case | What happens |
|---|---|
| An emoji the device cannot draw | Its Unicode name under an empty tile (§11.6). The closeness rule means the row still differs from every other by at least one more emoji. |
| Canvas unavailable or blocked | No check; emoji assumed drawable. |
| A clue reads differently on another platform | Rules 5.2.3–5.2.4 and the review sheet; faces never decide a puzzle. |
| Two stories fit the same row | The closeness rule (test), confusable pairs, and the blind solve. |
| A wrong choice also fits | Never offered: confusable and two-shared-emoji stories are excluded (§6.2). |
| Typed spelling, word order, "the", apostrophes | Never judged: the player picks a story from suggestions (§6.3). |
| Typed name of a person with several stories | All of their stories listed; the player chooses. |
| Typed text matches nothing | "No story by that name in this game"; costs nothing. |
| The player picks the same wrong story twice in the Daily | The second pick is refused before counting ("Already tried"). |
| Switching to choices mid-Daily | Only before the first guess, and the Daily then has two guesses (§6.1); afterwards the switch is disabled with a line saying why. |
| No story meets every schedule rule on a day | The rules give way in a fixed order (§9); the day is listed in the review sheet. |
| Daily opened just before midnight, answered after | The answer counts for the puzzle that was opened; the page then offers the new one. |
| Device clock wrong or changed | Puzzle number follows the device date; a date before the epoch shows puzzle #1's "starts on" message. |
| Daily played on two devices | Separate records; no account, no server. |
| Storage blocked or full (private mode) | The game plays; a quiet line says the score and streak cannot be remembered on this device. |
| Corrupt saved data | Ignored and replaced with a fresh record, never a crash. |
| Past the end of `daily.json` | The page continues with the same rules (§9). |
| A story retired after launch | Never dealt or scheduled again; past Daily puzzles still show it. |
| Fewer than 20 puzzles for a filter | That filter is not offered (§8.2). |
| Fewer than three believable wrong choices | Fall back to the other testament, then any tier; the test guarantees three always exist. |
| Key verse fails to load | Reference and link still shown, with a short note. |
| A person without a page | No "More about" link. |
| Translated site | Interface and (once collected) titles translated; aliases English; Choices is the default; clue words in hint 2 stay English until collected. |
| Very narrow phone (320 px) | Six emoji wrap to two rows of three; choice buttons stack. |
| Screen reader | Labels as §11.7; the reveal heading takes focus. |
| Room mode on a projector | Full-screen button; very large emoji; keyboard controls. |
| A sensitive story asked about by a parent | The content rules (§5.1) keep emoji gentle; every reveal shows the passage itself. |

## 15. Open points for the review step and the owner

1. **Translation.** The puzzle words (titles, `who`, clue words) would need an entry in the translation collector's list
   of game files (`content/translation/extract.py`, `GAME_DATA`), which is shared with other chains; this design leaves
   it to a translation job rather than touching that file. Until then the game's data shows in English in every language
   (as Wordle's words and the charades scenes do), and typing on a translated site matches English titles.
2. **Emoji pictures.** Native emoji keep the game free and light but look different on each device. Bundling one set of
   free emoji pictures (for example Twemoji, CC-BY 4.0, self-hosted, about 1–2 KB each, with a credit line) would make
   every device show the same pictures and remove the missing-glyph problem, at the cost of copied artwork and a licence
   credit. **Recommended: not now**; revisit if the missing-emoji label proves common.
3. **A larger model blind solve.** The review's blind solve was four single calls, each showing one model all 71
   puzzles at once (about 3,600 tokens in and 1,000 out per call, on the Max plan). That is cheap enough to repeat in
   the implement step for the added puzzles (§5.5 check 7). What stays open is a bigger pass — one call per puzzle,
   several runs or several models, through the workspace's batch tool — which would measure each puzzle more fairly
   than one model guessing all of them together. About 120 calls of ~1,500 tokens each: a very small share of the Max
   plan. Not part of the implement step; only on the owner's yes.
4. **Launch size.** 100 puzzles minimum is a judgement call; the review may raise or lower it.

## 16. Sources

- Emovi (teuteuf.fr) as described by third-party guides: [Today's Dailies — movie games](https://todaysdailies.com/daily-movie-games),
  [dlegames.org — Emovi](https://dlegames.org/game/emovi), [dailydles.com — Emovi](https://dailydles.com/games/emovi).
- H. Miller et al., GroupLens, *"Blissfully happy" or "ready to fight": Varying Interpretations of Emoji*, ICWSM 2016:
  [paper (PDF)](https://grouplens.org/site-content/uploads/ICWSM16_Emoji-Final_Version.pdf); summary at
  [ScienceAlert](https://www.sciencealert.com/it-s-official-new-study-confirms-we-have-no-idea-what-we-re-saying-when-we-use-emojis).
- Flags on Windows: [Chromium issue 40766658](https://issues.chromium.org/issues/40766658),
  [Missing flag emojis on Windows](https://prinsfrank.nl/2021/01/25/Non-existing-flag-emojis-on-windows),
  [Regional indicator symbol](https://en.wikipedia.org/wiki/Regional_indicator_symbol).
- Unicode emoji list with versions: [emoji-test.txt, Emoji 15.1](https://unicode.org/Public/emoji/15.1/emoji-test.txt).
- Church emoji games: [Download Youth Ministry — Emoji Bible Stories](https://www.downloadyouthministry.com/p/emoji-bible-stories/games-1535.html),
  [Bible Emoji Battle](https://www.downloadyouthministry.com/p/bible-emoji-battle/games/bible-based-10243.html),
  [New Test-Emoji Game](https://www.downloadyouthministry.com/p/new-test-emoji-game/games-1334.html),
  [KidzMatter — Old Testament](https://www.kidzmatterstore.com/products/emoji-bible-stories-old-testament-bible-quiz-game),
  [Church Visuals — Emoji Bible Story](https://churchvisuals.com/product/emoji-bible-story/),
  [Teachers Pay Teachers — Guess the Bible Story](https://www.teacherspayteachers.com/Product/Guess-the-Bible-Story-Emoji-Game-5606446),
  [Bliss Quizzes — emoji Bible quiz](https://www.blissquizzes.com/emoji-bible-quiz-guess-the-bible-story-emoji-quiz).
- Site code read for this design: the games [registry](../../../src/pages/games/registry.ts) and
  [README](../../../src/pages/games/README.md), [charades scenes](../../../src/data/charades/scenes.json) and
  [their test](../../../src/pages/games/charades/scenes.test.ts), Wordle's [daily.ts](../../../src/pages/games/wordle/daily.ts),
  [daily-rules.ts](../../../src/pages/games/wordle/daily-rules.ts) and [share.ts](../../../src/pages/games/wordle/share.ts),
  [verses.ts](../../../src/lib/verses.ts), [translated-data.ts](../../../src/pages/games/translated-data.ts), the Two truths
  and Odd one out designs and their review sections, and `data/plain/bsb/`.

## Appendix A. Starter set (71 puzzles)

Every row passed checks 1–4 of §5.5 on 2026-11-09 (re-run independently at review, after the review's changes): each
word is in the site's BSB text of the passage, every emoji is Unicode 13.0 or earlier with no joiner, flag or skin
tone, every puzzle has at least two non-face emoji that any other puzzle lacks, tier 2–3 titles hold at most one clue
word, and every number emoji stands for a number in the text. The review also blind-solved the set (§5.5 check 7;
results in the Review section). Still to do on these rows (implement step): `key`, `who`, `people`, `aliases` and
`confusable` for each. Ids match the charades scene ids where the story is the same. Tier counts: 28 tier 1, 38 tier 2,
5 tier 3; 40 Old and 31 New Testament; 14 tier 1 in each testament — the additions should lean towards tier 1 (each
testament needs 20 for the Easy filters) and tier 3, and towards the New Testament.

| # | Story (answer) | Passage (BSB) | Tier | Emoji, and the passage word each one stands for |
|---|---|---|---|---|
| 1 | God creates the world (`creation`) | GEN 1:1-2:3 | 1 | 🌍 earth · ☀️ light · 🌳 trees · 🐟 fish · 🐦 birds · 7️⃣ seventh |
| 2 | The serpent and the forbidden fruit (`garden-fruit`) | GEN 3:1-13 | 1 | 🌳 tree · 🐍 serpent · 🍎 fruit · 🍃 leaves |
| 3 | Cain and Abel's offerings (`cain-abel`) | GEN 4:1-10 | 2 | 🌾 soil · 🐑 flock · 🎁 offering · 😠 angry · ❓ where |
| 4 | Noah's ark and the flood (`noah-flood`) | GEN 6:13-9:17 | 1 | 🚢 ark · 🐾 animals · 🌧️ rain · 🕊️ dove · 🌈 rainbow |
| 5 | The tower of Babel (`tower-babel`) | GEN 11:1-9 | 2 | 🧱 bricks · 🗼 tower · 🗣️ language · 🌍 earth |
| 6 | Sarah laughs, and Isaac is born (`sarah-laughs`) | GEN 18:9-15; GEN 21:1-7 | 2 | ⛺ tent · 👵 old · 😂 laughed · 👶 son |
| 7 | Abraham, Isaac and the ram (`isaac-ram`) | GEN 22:1-14 | 2 | ⛰️ mountains · 🪵 wood · 🔥 fire · 🐏 ram |
| 8 | Lot's wife looks back (`lots-wife`) | GEN 19:15-26 | 2 | 🔥 fire · 🏃 run · 👀 look · 🧂 salt |
| 9 | Esau trades his birthright (`esau-stew`) | GEN 25:27-34 | 2 | 🏹 hunter · 😫 famished · 🍲 stew · 💰 sell |
| 10 | Jacob's dream of a stairway to heaven (`jacob-ladder`) | GEN 28:10-17 | 2 | 🪨 stones · 😴 sleep · 🪜 ladder · 👼 angels |
| 11 | Joseph, his robe and his brothers (`joseph-robe`) | GEN 37:3-28 | 1 | 🧥 robe · 🌾 sheaves · 🌙 moon · ⭐ stars · 💰 silver |
| 12 | Joseph explains Pharaoh's dreams (`pharaohs-dreams`) | GEN 41:14-36 | 2 | 🐄 cows · 🌾 grain · 7️⃣ seven · 💭 dream |
| 13 | Baby Moses in the basket (`baby-moses`) | EXO 2:1-10 | 1 | 👶 child · 🧺 basket · 🌿 reeds · 👸 daughter |
| 14 | The burning bush (`burning-bush`) | EXO 3:1-6 | 1 | 🐑 flock · 🔥 fire · 🌿 bush · 🩴 sandals |
| 15 | The plagues of Egypt (`plagues`) | EXO 8:1-10:23 | 1 | 🐸 frogs · 🦟 gnats · 🦗 locusts · 🌑 darkness |
| 16 | The first Passover (`passover`) | EXO 12:1-13 | 2 | 🐑 lamb · 🚪 doorframes · 🌙 night · 🫓 unleavened · 🌿 herbs |
| 17 | Crossing the Red Sea (`red-sea`) | EXO 14:15-29 | 1 | ✋ hand · 🌊 sea · 🏜️ dry · 🚶 walked · 🐎 horses |
| 18 | Manna and quail in the wilderness (`manna`) | EXO 16:11-31 | 2 | 🐦 quail · ⛺ camp · 💧 dew · 🍞 bread · 🍯 honey |
| 19 | The Ten Commandments (`ten-commandments`) | EXO 19:16-20; EXO 34:1-4; EXO 34:28 | 1 | ⛰️ mountain · ⛈️ thunder · 🔟 Ten · 🪨 stone |
| 20 | The golden calf (`golden-calf`) | EXO 32:1-20 | 2 | 💍 earrings · 🔥 fire · 🐂 calf · 🎶 singing · 💃 dancing |
| 21 | Balaam's talking donkey (`balaams-donkey`) | NUM 22:21-33 | 2 | 🐴 donkey · 🗡️ sword · 👼 angel · 💬 said |
| 22 | Rahab hides the spies (`rahab`) | JOS 2:1-21 | 3 | 🏠 house · 🕵️ spies · 🪢 rope · 🔴 scarlet |
| 23 | The walls of Jericho (`jericho`) | JOS 6:1-20 | 1 | 🚶 march · 7️⃣ seven · 📯 horns · 📢 shout · 🧱 wall |
| 24 | Gideon's fleece and the 300 (`gideon`) | JDG 6:36-40; JDG 7:16-22 | 2 | 🐑 fleece · 💧 dew · 📯 horns · 🏺 jars · 🔥 torches |
| 25 | Samson's strength (`samson`) | JDG 14:5-9; JDG 16:17-30 | 2 | 🦁 lion · 🍯 honey · ✂️ shave · 🏛️ pillars |
| 26 | Ruth and Naomi (`ruth`) | RUT 1:16-17; RUT 2:2-3; RUT 3:7; RUT 4:13 | 2 | 👵 Naomi · 🚶 go · 🌾 grain · 👣 feet · 💒 wife |
| 27 | God calls young Samuel (`samuel-called`) | 1SA 3:1-10 | 2 | 🕯️ lamp · 🛏️ lying · 🗣️ called · 👂 listening |
| 28 | David and Goliath (`david-goliath`) | 1SA 17:34-50 | 1 | 🐑 sheep · 5️⃣ five · 🪨 stones · 🛡️ armor · 🗡️ sword |
| 29 | David spares Saul in the cave (`david-saul-cave`) | 1SA 24:1-7 | 3 | 🕳️ cave · ✂️ cut · 🧥 robe |
| 30 | Solomon and the two mothers (`solomon-judgment`) | 1KI 3:16-28 | 2 | 👩 woman · 👶 son · 🗡️ sword · ⚖️ justice |
| 31 | Ravens feed Elijah (`elijah-ravens`) | 1KI 17:1-6 | 3 | 🐦 ravens · 🍞 bread · 🥩 meat · 🏞️ brook |
| 32 | Elijah and the prophets of Baal (`elijah-carmel`) | 1KI 18:20-39 | 2 | ⛰️ Mount · 🐂 bulls · 💧 water · 🔥 fire |
| 33 | Elijah goes up in a whirlwind (`elijah-chariot`) | 2KI 2:7-14 | 2 | 🧥 cloak · 🌊 waters · 🔥 fire · 🐎 horses · 🌪️ whirlwind |
| 34 | Naaman dips seven times (`naaman`) | 2KI 5:1-14 | 2 | 🪖 army · 7️⃣ seven · 🛁 wash · 👶 child |
| 35 | Jonah and the great fish (`jonah`) | JON 1:3-2:10 | 1 | ⛵ ship · ⛈️ storm · 🐋 fish · 3️⃣ three |
| 36 | The fiery furnace (`fiery-furnace`) | DAN 3:19-28 | 1 | 3️⃣ three · 🔥 furnace · 7️⃣ seven · 👼 angel |
| 37 | The writing on the wall (`writing-on-wall`) | DAN 5:1-28 | 2 | 🍷 wine · ✋ hand · ✍️ wrote · 🧱 wall · ⚖️ scales |
| 38 | Daniel in the lions' den (`lions-den`) | DAN 6:10-23 | 1 | 🙏 prayed · 🪟 windows · 🦁 lions · 👼 angel |
| 39 | Queen Esther saves her people (`esther`) | EST 4:14-16; EST 5:1-8 | 2 | 👸 queen · 🍽️ banquet · 3️⃣ three · 👑 king |
| 40 | Nehemiah and the walls of Jerusalem (`nehemiah-wall`) | NEH 2:17-18; NEH 4:17-18; NEH 6:15 | 3 | 🧱 wall · 🔨 rebuild · 🗡️ sword · 5️⃣ fifty-two · 2️⃣ fifty-two |
| 41 | Jesus is born in Bethlehem (`nativity`) | LUK 2:1-16 | 1 | 👶 Child · 🏨 inn · 🐑 flocks · 👼 angel |
| 42 | The Magi follow the star (`magi`) | MAT 2:1-12 | 1 | ⭐ star · 👑 King · 🎁 gifts · 👶 Child |
| 43 | The boy Jesus in the temple (`boy-jesus`) | LUK 2:41-50 | 2 | 1️⃣ twelve · 2️⃣ twelve · 🏛️ temple · 🔍 searching · ❓ questions |
| 44 | John the Baptist in the wilderness (`john-baptist`) | MAT 3:1-6 | 2 | 🐫 camel · 🦗 locusts · 🍯 honey · 🏞️ river |
| 45 | Jesus is baptized (`jesus-baptized`) | MAT 3:13-17 | 2 | 🏞️ Jordan · 🌊 water · 🕊️ dove · ☁️ heavens · 🗣️ voice |
| 46 | Water into wine at Cana (`water-into-wine`) | JHN 2:1-11 | 1 | 💒 wedding · 6️⃣ six · 🏺 jars · 💧 water · 🍷 wine |
| 47 | Jesus calms the storm (`calm-storm`) | MRK 4:35-41 | 1 | ⛵ boat · 🌀 windstorm · 🌊 waves · 💤 sleeping · 😨 afraid |
| 48 | Jesus walks on the water (`walk-on-water`) | MAT 14:22-33 | 1 | ⛵ boat · 🌬️ wind · 🚶 walked · 🌊 water · ✋ hand |
| 49 | Feeding the five thousand (`loaves-fish`) | JHN 6:5-13 | 1 | 5️⃣ five · 🍞 loaves · 2️⃣ two · 🐟 fish · 🧺 baskets |
| 50 | The man let down through the roof (`through-roof`) | MRK 2:1-12 | 2 | 🏠 home · 4️⃣ four · 🛏️ mat · 🚶 walk |
| 51 | Jesus and the Samaritan woman (`woman-at-well`) | JHN 4:5-15 | 2 | 🪣 well · 💧 water · 6️⃣ sixth · 👩 woman |
| 52 | Zacchaeus climbs a tree (`zacchaeus`) | LUK 19:1-10 | 1 | 🤏 small · 🧗 climbed · 🌳 tree · 💰 wealthy · 🏠 house |
| 53 | The good Samaritan (`good-samaritan`) | LUK 10:30-37 | 1 | 🛣️ road · 🩹 bandaged · 🐴 animal · 🏨 inn |
| 54 | The prodigal son (`prodigal-son`) | LUK 15:11-32 | 1 | 💰 estate · 🐖 pigs · 🏃 ran · 💍 ring · 🎉 celebrate |
| 55 | The lost sheep (`lost-sheep`) | LUK 15:3-7 | 1 | 💯 hundred · 🐑 sheep · 🔍 lost · 🎉 rejoice |
| 56 | The house on the rock (`house-on-rock`) | MAT 7:24-27 | 1 | 🏠 house · 🪨 rock · 🏖️ sand · 🌧️ rain |
| 57 | The farmer sowing seed (`sower`) | MAT 13:3-9 | 2 | 🌱 seed · 🐦 birds · 🪨 rocky · 🌵 thorns · 🌾 crop |
| 58 | The mustard seed (`mustard-seed`) | MAT 13:31-32 | 2 | 🤏 smallest · 🌱 seeds · 🌳 tree · 🐦 birds |
| 59 | The widow's offering (`widows-coins`) | MRK 12:41-44 | 2 | 🏛️ treasury · 👵 widow · 2️⃣ two · 🪙 coins |
| 60 | The ten lepers (`ten-lepers`) | LUK 17:11-19 | 2 | 🔟 ten · 🚶 way · 1️⃣ One · 🙏 thanksgiving |
| 61 | Lazarus, come out! (`lazarus`) | JHN 11:17-44 | 2 | 4️⃣ four · 😢 weeping · 🪦 tomb · 🪨 stone · 🚶 came |
| 62 | Jesus rides into Jerusalem (`palm-sunday`) | JHN 12:12-15 | 1 | 🌴 palm · 📣 shouting · 🐴 donkey · 👑 King |
| 63 | The Last Supper (`last-supper`) | MRK 14:17-25 | 1 | 1️⃣ Twelve · 2️⃣ Twelve · 🍞 bread · 🙏 thanks · 🍷 cup |
| 64 | Peter denies Jesus three times (`peter-rooster`) | LUK 22:54-62 | 2 | 🔥 fire · 👧 girl · 3️⃣ three · 🐓 rooster · 😭 wept |
| 65 | The empty tomb (`empty-tomb`) | LUK 24:1-12 | 1 | 🌅 morning · 🌿 spices · 🪦 tomb · 🪨 stone · ❓ Why |
| 66 | Doubting Thomas (`doubting-thomas`) | JHN 20:24-29 | 2 | 8️⃣ Eight · ✋ hands · 👀 see · 🙏 believe |
| 67 | Breakfast on the beach (`breakfast-beach`) | JHN 21:1-14 | 3 | 🎣 fish · 🥅 net · 1️⃣ 153 · 5️⃣ 153 · 3️⃣ 153 · 🔥 fire |
| 68 | The Holy Spirit at Pentecost (`pentecost`) | ACT 2:1-13 | 2 | 🌬️ wind · 🔥 fire · 👅 tongues · 🗣️ speak |
| 69 | Saul on the road to Damascus (`road-damascus`) | ACT 9:1-9 | 2 | 🛣️ journey · ⚡ flashed · 👀 see · 3️⃣ three |
| 70 | Paul and Silas sing in prison (`prison-songs`) | ACT 16:22-30 | 2 | ⛓️ chains · 🕛 midnight · 🎶 hymns · 🚪 doors |
| 71 | Paul's shipwreck and the snake (`shipwreck`) | ACT 27:39-28:6 | 2 | 🚢 ship · 🌊 sea · 🏝️ island · 🔥 fire · 🐍 viper |

## Review

**One critical review, sequence 31 step 15, 2026-11-09.** Read against the approved spec (entry 21 of APPROVED-IDEAS.md),
the shared build rules, and the site's code and data as they stand today. Every correction below is already made in
the body above; this section says what changed and why.

### How it was checked

- **Every file and pattern the design leans on was opened:** the hub entry (`emoji-stories`, still coming soon, shelf
  and picture set), `Verse`, the reader's `?hl=` links as Two truths' reveal builds them, the charades scenes and their
  BSB test, people slugs and the `/people/<slug>` route, Wordle's and Timeline's daily files, Wordle's build script and
  how it finds the raw sources folder, Two truths' `--check` test, and the translation checks. All exist as described;
  Wordle's folder is indeed still uncommitted.
- **Appendix A was re-checked with an independent script** (not the design step's): every clue word against the BSB
  text of its passage, every emoji against Unicode's `emoji-test.txt` 15.1 (version, qualification, joiners, skin tones,
  flags, subgroup), the closeness rule, the title rule and the number rule. All 71 rows' BSB words and all emoji
  versions were right. The design's own rules turned up fifteen problems, plus three more once the title rule was made
  precise. The final run has none.
- **The set was blind-solved** (the design's own check 7, which it gave to this step): one model (Sonnet) saw only the
  71 emoji rows, shuffled, and the list of titles, with no workspace context or tools, in one call per run (about 3,600
  tokens in, 1,000 out). Four runs: 66, 68, 67 and 68 of 71 right. Puzzles missed were strengthened between runs.

### What changed, and why

1. **Five titles gave the answer away, and three more once the rule was made precise.** The design says a tier 2 or 3
   title may contain at most one clue word, but its prototype never ran that check. Gideon's title held three, and four
   others two. Retitled: *Gideon's fleece and the 300*, *Elijah and the prophets of Baal*, *Jesus and the Samaritan
   woman*, *The widow's offering*, *The ten lepers*. The rule now counts plurals and possessives as the same word
   ("widow's" = "widow"), which caught *Esau sells his birthright for stew*, *Nehemiah rebuilds the wall* and *Thomas
   sees and believes*: now *Esau trades his birthright*, *Nehemiah and the walls of Jerusalem* and *Doubting Thomas*
   (§5.2, Appendix A).
2. **Faces were deciding puzzles, though the design said they never would.** It claimed the closeness rule kept faces
   from being what tells two puzzles apart, but the rule as written counted every emoji. Jesus calms the storm differed
   from Jesus walks on the water only by 😴 and 🤫. "Face" is now defined from Unicode's own grouping (any `face-…`
   subgroup), and the closeness rule counts only non-face emoji (§2.3, §5.2, §5.4, check 3).
3. **The rule that no face stands for Jesus was broken by four puzzles, and by its own example.** 😴 and 🤫 were Jesus
   asleep and Jesus saying "Silence!"; 😢 was "Jesus wept"; 👶 was the infant Jesus in the nativity and the Magi. The
   storm is now ⛵ boat · 🌀 windstorm · 🌊 waves · 💤 sleeping · 😨 afraid (💤 is a sign of sleep, not a face, and the fear
   is the disciples'). Lazarus keeps 😢 but its word is now *weeping*, which John 11:33 gives to Mary and the mourners.
   The rule now says plainly that 👶 for the infant Jesus is allowed, as in every nativity scene, and that the review
   sheet marks every face and person emoji, because no test can tell whom an emoji stands for (§5.1, §5.2, check 6).
4. **The Last Supper used 1️⃣ 2️⃣ for "apostles".** Luke 22:14–20 never says twelve, so the numbers stood for something
   not in the text, against the design's own principle. The passage is now Mark 14:17–25 ("Jesus arrived with the
   Twelve"), and a new check requires every number emoji's word to be a number (§5.2, check 4).
5. **The Red Sea's 🧱 brick wall stood for walls of water.** That is the opposite picture, and it pointed towards Jericho,
   which shares 🚶 and 🧱. Now 🏜️ desert for "dry ground" (Exodus 14:16, 22, 29).
6. **Puzzles strengthened after the blind solve:** Peter's denial gained 👧 the servant girl (it was told apart from
   two others only by 🐓 and a face); the empty tomb gained 🪦 tomb; manna gained ⛺ camp; the Passover gained 🌙 night and
   swapped 🍞 for 🫓 flatbread, "unleavened"; Zacchaeus gained 🧗 climbed; Cain and Abel gained 🎁 offering; the golden
   calf gained 🎶 singing; Jesus' baptism gained 🏞️ Jordan; Gideon gained 📯 horns. Elijah fed by ravens moved to tier 3,
   and the golden calf / Mount Carmel and Lazarus / empty tomb pairs joined the "never offered side by side" list.
7. **The Daily could be won by luck.** With choices it allowed three guesses at four titles, so a blind tapper won three
   days in four and a streak meant nothing. With choices the Daily now has two guesses (§6.1, §7, §8.1, §14).
8. **The Daily schedule could get stuck.** "No repeat within pool size minus 10 days" leaves about ten stories to choose
   from each day, and the Sunday, weekly-tier and testament rules can then rule out all ten. Now at least 30 are always
   free, and when nothing fits, the rules give way in a fixed order (never the Sunday rule), with each such day listed
   in the review sheet and tested (§9, §13, §14).
9. **Hint costs disagreed.** One section said every hint costs a point, another that two or three hints both leave 1
   point. Now the first two cost a point and the third is free, and the button says so (§7, §11.2). It also now says
   that in the Daily hint 3 is only seen if asked for, since the last miss ends the game.
10. **The raw Unicode file would not be found where the design put it.** The site finds raw sources through a setting
    or one of two folders, not a fixed `../sources`; the design now uses that same rule, pins the file's checksum as
    Wordle pins its word list, and says the data test needs it (§5.3, §12, §13).
11. **Smaller corrections:** the two Unicode 12.0 emoji (🩹 🤏) do draw on Windows 10 updated since 2019 — only the 13.0
    ones do not (§5.3); the translated-site row said titles are translated now, which contradicts the open point that
    leaves translation to a later job (§6.1); the alias rule as written would have banned "Jacob's ladder" and "the
    burning bush", so it now bans aliases made *only* of clue words (§4); person links now name the real helper and
    route (§3); Appendix A's counts are updated (148 emoji, 26 pairs sharing two or more, tiers 28 / 38 / 5).

### Decisions on the open points

- **Launch size:** kept at 100 minimum. Appendix A has 14 tier 1 puzzles in each testament and the Easy filters need
  20, so the additions must bring at least six tier 1 puzzles per testament; the appendix note now says so.
- **Translation and emoji pictures:** left as the design recommends (a later translation job; native emoji, no bundled
  picture set).

### Left for the implement step

- **Manna and the ravens remain the hardest pair.** The model swapped them in two of four runs; both are about birds,
  bread and meat. They are never offered side by side, ravens is now tier 3, and the first hint (Exodus or 1 Kings)
  separates them. The implement step's blind solve should look at them again; dropping the ravens puzzle is acceptable.
- **The golden calf** was missed in two runs before it gained 🎶 (then solved), and **Naaman** once, at low
  confidence: both worth a look on the review sheet.
- The design step's list of what the implement step must still write for each row (`key`, `who`, `people`, `aliases`,
  `confusable`) is unchanged.
