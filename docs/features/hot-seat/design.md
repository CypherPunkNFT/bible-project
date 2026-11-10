# Hot seat — design

**Status:** designed (job 0d6edd1a, sequence 31 step 17, 2026-11-10) and reviewed once (job f7d6bba9, step 18, 2026-11-10; corrections applied in the body, list in §17). Next: the build (step 19).
**Spec (binding):** [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md), entry 22: *"One player in the hot seat answers rapid-fire questions from the question bank for 60 seconds while the group reads them off a phone; score how many they get."*
**Step brief:** research rapid-fire party quiz formats; one player answers quick-fire questions from the question bank for 60 seconds while the group reads them off a phone and marks right/wrong. Cover question selection by age, timer, scoring, multiple rounds and players, and a leaderboard for the session.
**Shared rules:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md). No model runs while people play, and none is needed to build this game: every question already exists in the bank. Existing site data and code are reused. Scripture wording follows the Berean Standard Bible (BSB). The game registers on the /games hub. Only this feature's own files, plus its one registry entry and one README section, are touched. Nothing is deployed.
**Slug and route:** the hub already lists the game as `hot-seat` ("Hot seat", shelf *Youth group and church night*, audiences Youth group and Family, picture `GAME_ART.hotSeat` already drawn: a chair under a lamp with a stopwatch reading 60). So the game lives at `/games/hot-seat`, and the registry change is only `status` and `load`.

---

## 0. Summary

One phone, one room, no accounts, no server. Players take turns in the **hot seat**. Someone else holds the phone and is the **reader**: the phone shows them a short question **and its answer**, they read the question aloud, the player in the seat shouts an answer, and the reader taps **✓ Right**, **✗ Wrong** or **↷ Pass**. The next question appears at once. After **60 seconds** a buzzer sounds; the question already on screen may still be answered ("I've started, so I'll finish", §2.1). A recap lists every question with its answer and Bible reference, marks can be fixed, and the points go on the **session leaderboard**. Then the phone goes to the next reader and the next player sits down.

- **Questions by age, per player** (§3): each player picks their own group — *Little ones* (about 4–7), *Kids* (8–12), *Teens and adults*, or *Bible experts* — so grandpa and a six-year-old can play the same game, each against questions that suit them. Little ones hear **two choices** ("Was it Noah or Moses?") by default; everyone else answers open, as on TV quiz shows.
- **Which questions** (§3.2): the bank's 14,916 questions are filtered down to the ones that work when read aloud at speed: Bible quiz and Sunday-school questions, complete on their own, no "which of these", no two-part questions, question at most 140 characters and the answer to judge at most 40. Measured on today's bank: **3,080** for Little ones, **4,428** for Kids, **10,580** for Teens and adults, **7,174** for Bible experts. No question is asked twice in a session, and the phone remembers the last 2,000 asked so the next game night is fresh.
- **Scoring** (§5): one point per right answer. Wrong answers and passes cost nothing but time (as in *The Chase*'s 60-second round). Equal totals share a place. The reader is the judge: "near enough" counts.
- **Rounds and players** (§4): 1–12 players (a name may be a team), 1–5 rounds, every player one turn per round, the order turning by one each round so nobody always goes first. Players can join, leave or change group between turns. "Play another round" extends the same session.
- **Leaderboard** (§5.3): standings after every turn and a final table with each round's points, the best single turn and the longest run of right answers. Kept on the phone so a reload or a locked screen never loses the evening.
- **Cost:** none. No new service, no dependency, no generated content. Everything comes from the question bank the site already ships.

---

## 1. What the spec fixes, and what this design decides

| Spec or brief says | Design decision |
|---|---|
| One player in the hot seat answers rapid-fire questions | One player per turn; a full-screen turn view built for speed: question and answer readable at a glance, three large buttons, the next question instantly (§6.4). |
| from the question bank | The site's own bank ([bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json)), loaded with the site's existing loader in the reader's language. Nothing new is written or generated (§3). |
| for 60 seconds | 60 seconds by default; 30, 45 and 90 also offered for the whole game (§4.3). |
| the group reads them off a phone | The phone is held by a reader, not by the player. It shows the answer too, so the reader can judge without knowing the Bible well (§6.4). The game suggests who reads next (the previous player), so the job moves round the room (§4.2). |
| marks right/wrong (brief) | ✓ Right, ✗ Wrong, and ↷ Pass for "skip it, next one". One-step Undo during the turn; every mark can be changed on the recap before the points are kept (§5.2). |
| score how many they get | One point per right answer, shown large during the turn and on the recap (§5). |
| question selection by age (brief) | Four groups, chosen per player; they set which questions are drawn and whether two choices are read (§3.1). |
| multiple rounds and players (brief) | 1–12 players, 1–5 rounds, turns rotated, players added or removed between turns, rounds added at the end (§4). |
| leaderboard for the session (brief) | Standings after each turn; final table with per-round points and shout-outs; the session survives reloads for 12 hours (§5.3, §7). |
| (Rules) no runtime model cost | Nothing is generated at all. |
| (Rules) reuse site data | The question bank, its children's wording, its levels and references; the live quiz's question filters and ids; the charades game's sound and keep-awake code; the site's row windowing (§9). |
| (Rules) BSB, not KJV | The game adds no Scripture text of its own. Questions and answers are the bank's, which the questions chat already checks against the BSB; references link to the site's BSB reader. |
| (Rules) long lists | The only long list is "All questions tonight" on the final screen (up to several hundred rows): windowed with the site's `useRowWindow`, about 50 rows above and below the screen, no "load more" (§6.7). |

### 1.1 Not the icebreaker of the same name

"Hot seat" is also a well-known youth-group icebreaker in which the group asks one person questions *about themselves* (favourite food, worst haircut). The setup screen's first line says plainly that this is a **Bible quiz** (§6.1); the hub card already sits among the Bible games with its stopwatch picture, and its description is kept as it is (§10) so its existing translations stay valid. No get-to-know-you questions are included; that would need a new hand-written list and is not what the spec asks.

---

## 2. Research

### 2.1 Rapid-fire rounds on television

| Show | The rapid-fire part | What this game takes from it |
|---|---|---|
| **The Chase** (UK ITV since 2009; US, Australian and German versions) | The **Cash Builder**: each contestant alone answers as many quick-fire, open-ended questions as they can in **60 seconds**; each right answer is worth money (£1,000 in the UK, $5,000 on the first US version (2013–2015), $2,000 in Australia, €500 in Germany). No penalty for a wrong answer. | The exact shape of a turn: one player, 60 seconds, open questions, a point per right answer, no penalty. The spec's "60 seconds" is this format. |
| **Mastermind** (BBC since 1972) | One contender in the famous black chair answers questions for two minutes (two and a half for general knowledge since 2010). They may say "pass" to save time. When the time-up beeps sound mid-question, the host finishes reading it and allows an answer, which gave Magnus Magnusson his catchphrase *"I've started, so I'll finish."* Ties go to fewer passes, then to five sudden-death questions. Answers to passed questions are read out after the round. | **The question on screen at the buzzer may still be answered** (§4.3). Passing is allowed. Answers are given after the turn, on the recap, not during it. The tie-break by passes is *not* taken (§5.1): in a family game it pushes children to guess wrong rather than pass. |
| **Family Feud — Fast Money** (US since 1976) | Two family members answer the same five questions in **20 and 25 seconds**; the host reads, the contestant blurts, and passing to come back later is allowed. | Proof that very short clocks work if the questions are short. Sets the question-length limit (§3.2): a question the reader cannot say in about five seconds kills the pace. |
| **Millionaire Hot Seat** (Australia, Nine Network 2009–2023, Network Ten from 2026) | Six contestants take turns in the "hot seat" against a clock that grows with the question's difficulty (15, 30, 45 seconds); one pass per player hands the question to the next contestant. | The name, and the idea that the seat **rotates through the room**. Its pass-to-the-next-player and elimination rules are left out (§8): they need a host's judgement and leave children sitting out. |

### 2.2 The party and youth-group versions

- **The icebreaker "Hot seat"** (youth-ministry sites and party blogs) seats one person while the group fires questions for a set time, commonly **60 seconds**; a "speed seat" variant counts how many questions fit in the minute, and the record holder gets bragging rights. Youth-ministry game lists already describe a **"Hot Seat Bible Edition"**: one volunteer, 60 seconds of rapid-fire Bible questions, count the right answers, crown a champion. Its only equipment is "a chair, a timer and a list of questions", which is exactly the part a leader has to prepare by hand and this game removes.
- **5 Second Rule** (PlayMonster): the player in the "Hot Seat" must name three things in five seconds while a twisting timer runs; the player to their left reads the card; choose **2–3 rounds for large groups, 4–5 for small**; the junior and Disney editions let younger players give fewer answers. Two lessons: **the reader is another player, not a host**, and **a handicap for younger players is normal and accepted** in family games. This design's round counts (§4.3) and per-player age groups (§3.1) follow from it.
- **Existing Bible quiz apps** (Kahoot-style quizzes, Bible trivia apps) are almost all multiple choice on the player's own screen. None found does the reader-and-hot-seat shape on one phone, with answers shown to the reader, per-player age levels and a session leaderboard; that gap is the reason for this game.

### 2.3 Why a quick-fire quiz helps people remember

Recalling an answer strengthens memory more than reading it again: in Roediger and Karpicke's experiments (*Psychological Science*, 2006), students who were tested on a passage remembered substantially more of it a week later than students who re-studied it, even though re-studying made them feel more confident. That is the **testing effect**. Two things in this game serve it: every question demands a spoken answer (not a recognition tap), and the **recap after each turn shows every answer with its Bible reference** and a link to read the passage, so a missed fact is corrected while it is still fresh.

### 2.4 What the research means for this game

1. **Copy the Cash Builder**: one player, 60 seconds, open questions, a point per right answer, no penalty. People already know it.
2. **Short questions, short answers.** Pace is the whole game. A question must be sayable in a breath and an answer judgeable at a glance.
3. **Show the reader the answer.** The reader is a fellow player, often a child or a non-expert; they must be able to judge without knowing the Bible.
4. **Handicap by age, not by points.** Easier questions for younger players keep one leaderboard fair and keep everyone on it.
5. **Let the last question finish**, and give the answers afterwards, Mastermind-style.
6. **Rotate the seat and the reader** so nobody watches the whole evening from the side.

---

## 3. Questions by age

### 3.1 The four groups (chosen per player)

| Group | For | Questions drawn | Answer style (default) |
|---|---|---|---|
| **Little ones** | about 4–7 | Bank questions marked suitable for children (`children: true`, judged for about 6–11), level **easy** only, in the children's wording where the bank has one (few do, see below) | **Two choices**: the reader reads the question, then "…was it *A* or *B*?" (§3.3) |
| **Kids** | 8–12 | Children's questions, **easy and medium**, children's wording where present | Open answer |
| **Teens and adults** | 13 and up | All Bible quiz and Sunday-school questions, **easy, medium and hard**; the first two questions of a turn are easy (a warm-up, as the live quiz ramps up) | Open answer |
| **Bible experts** | anyone who wants it hard | **Medium and hard** only | Open answer |

The labels match the family charades game's age words (Little ones, Kids, Teens and adults), so the games hub speaks one language. A player's group can be changed between turns; it takes effect from their next turn.

One setting decides who hears two choices: **Little ones** (default), **Little ones and kids**, or **Nobody**.

**What the bank really gives the younger groups (measured in review):** the bank has no questions written for under-6s. Little ones draw exactly the easy half of the Kids pool, so the difference between the two groups is the medium questions and the two-choice reading, and the two choices are what make the game fair for a 4- to 7-year-old. A usable children's wording (`child`, with four valid options) exists for only **180** of the 3,080 Little ones questions and **260** of the 4,428 Kids questions; every other question is read in its ordinary wording, which the bank's children flag already judges simple enough. The setup's group picker says "Little ones (4–7): easy questions, two choices read out" so nobody expects picture-book questions.

### 3.2 Which questions are eligible at all

Starting from the bank's 14,916 questions, a question is in a group's pool only if every rule holds:

1. **Kind:** Bible quiz or Sunday school (the bank's `trivia` and `lesson`). **Catechism questions are left out**, unlike the live quiz and Jeopardy where they are opt-in: only 451 of 1,781 are short enough for this game, their answers are set formulas that one church tradition recites, and a spoken rapid-fire answer to "What is the chief end of man?" cannot be judged "near enough". (Decided in review, §14.)
2. **Playable at all:** the live quiz's `isPlayable` test from [pick.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/pick.ts): the question stands on its own, its four options are valid and include the right one, it does not point at "this passage" or "the following", and no option is "all/none of the above". (The options are needed for the two-choice style.)
3. **No two-part questions:** questions with a `lead_in` (whose first part must be read first) are left out; they double the reading time.
4. **Answerable without choices:** the wording shown does not match `(which|what|who) of (these|the following)` or `which one of`, nor contain a capital-letter "NOT" — the same rule Bible Jeopardy uses when its choices are hidden ([categories.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/categories.ts) keeps it as a private constant, so this game keeps its own copy with a comment naming the source, rather than editing another game's file). It applies to all styles, so a Little one's question never depends on choices that were not read.
5. **Short enough to fire:** the wording shown is at most **140 characters** (about five seconds read aloud; the median eligible question is about 80), and the answer the reader judges (the bank's short `answer_choice`, or the children's answer) is at most **40 characters**.
6. **The group's own filter** (§3.1): children's flag and level.
7. **Testament** (setting): Both (default), Old Testament or New Testament. Questions about the Bible as a whole (no testament) are only in Both.

**Measured on today's bank (2026-11-10, English):**

| Group | Pool | By level | Old / New Testament |
|---|---|---|---|
| Little ones | 3,080 | easy 3,080 | 1,516 / 1,557 |
| Kids | 4,428 | easy 3,080, medium 1,348 | 2,266 / 2,155 |
| Teens and adults | 10,580 | easy 3,406, medium 4,497, hard 2,677 | 7,097 / 3,469 |
| Bible experts | 7,174 | medium 4,497, hard 2,677 | 5,379 / 1,790 |

The smallest pool a game can ask for (Bible experts, New Testament: 1,790) still covers a 12-player, 5-round evening (60 turns of about 12 questions = 720) more than twice. The pool test (§11) re-measures these on the real bank and fails if any group falls below 1,000 in Both, so a bank change that breaks the game is caught.

### 3.3 Two choices

For a player answering with two choices, the reader sees the question, then a line **"A lamp  or  A shield?"** with the right one marked. The wrong choice is drawn at random from the question's three wrong options (the children's options when the children's wording is used), and the order of the two is random. The answer box still shows the right one. A child who is ready for open answers can be moved to Kids at any turn.

### 3.4 Drawing questions for a turn

Questions are drawn **one at a time, as the turn needs them** (a fast pair can get through 20 in a minute), from the player's group pool, at random, skipping:

- any question **already asked this session** (to anyone: a player who just heard Ben's answers must not get the same question);
- any question on the phone's **seen list** (the last 2,000 asked on this phone across sessions), unless fewer than 200 unseen questions remain in that pool, in which case the oldest seen entries for that pool are forgotten first;
- any question whose **first four words** match one already asked in this turn ("Is the book of…", "In Psalm 119, what…"), so a turn never feels like a drill of one template;
- where possible, a question with the **same topic** as the one just asked (the bank's `topic`: Creation and the patriarchs, Moses and the Exodus, Judges and kings…); the next eligible one in the shuffled order is taken instead, looking at most five ahead.

For *Teens and adults* the first two draws of each turn come from easy questions. Within a turn, levels are otherwise as the pool holds them (about a third easy, two-fifths medium, a quarter hard).

Each drawn question is frozen into the turn as it was shown, by passing it through the live quiz's exported `toQuizQuestion(q, children, random)`, which already returns everything needed: the id (`questionId`), the wording shown (children's or ordinary, by the same rule as the pool), the four options with the right one's place, the reference trimmed by `trimReference`, and the reader link checked by the live quiz's private `cleanLink`. The game keeps from it the id, the wording, the right option as the answer to judge, the reference and the link, adds the bank's full printed `answer` when it differs from the right option, and, for two choices, the right option plus one of the other three (§3.3). So a recap, a reload or a change of site language never re-reads the bank for questions already asked, and the game re-implements none of the live quiz's private helpers.

---

## 4. Rounds, players and the clock

### 4.1 Players

- **1 to 12 entries.** Each has a name and a group. The name is cleaned with the live quiz's `normaliseName` and capped at its `NAME_MAX` (16): `normaliseName` does not cut, so the field has `maxLength={NAME_MAX}` and the game also cuts the cleaned name to 16 characters by code point, so an emoji is never split. Empty names become "Player 1", "Player 2"… (written with the number filled into one registered phrase, §6.0). The live quiz's rude-name filter is not used: names here are typed by the group on its own phone and never shown outside the room. One entry is enough to play (someone still reads); the setup suggests at least two.
- **A name may be a team.** For a youth group of 20, five teams of four: the team sends a different member to the seat each round, and the game needs no team logic. The setup says so in one line.
- The roster and each person's group are remembered on the phone for next time.

### 4.2 Turns and readers

- A **round** is one turn for every player still in the game. The order is the setup order, **turned by one each round** (round 2 starts with the second player), so nobody always goes first or last.
- Before each turn a **hand-over screen** names the player and suggests the reader: **the player who just sat**, or for the very first turn the line "Anyone else can read." The suggestion is only text; anyone may read.
- A player who has stepped out can be **skipped this round** from the hand-over screen; that turn is recorded as not played (§5.3 handles the averages).

### 4.3 The clock

- **Length:** 30, 45, **60** (default, from the spec) or 90 seconds, set for the game. Changing it mid-game applies from the next turn; the standings then note "turns of different lengths".
- **Start:** the reader taps **Start** on the hand-over screen; a 3-2-1 count (one beep each) gives the player time to sit up, then the first question shows and the clock runs.
- **Display:** large digits plus a draining ring at the top of the turn screen. From 5 seconds the digits change colour and a soft tick sounds each second.
- **Sounds** are the charades game's existing tones (its `beep` kinds): `tick` for each count-down number and each of the last five seconds, `buzzer` at time, and `correct` / `pass` on a Right / Pass mark. Wrong has no tone (charades has none, and a sad noise for a child's wrong answer is not wanted).
- **Time is up:** a buzzer sounds and a band says **"Time! Finish this question."** The question on screen can still be marked Right, Wrong or Pass (Mastermind's rule); after that mark, no new question is drawn and the recap opens. If the reader does nothing for 15 seconds after the buzzer, the open question is left unmarked and the recap opens (it shows as "not answered" and can be marked there).
- **Accuracy:** the clock keeps an end time, not a count of ticks (the charades game's method), so a slow phone or a dropped frame never gives extra time.
- **Pause:** a pause button (and leaving the page, locking the phone, or opening the menu) stops the clock and **hides the question and answer**, so nobody peeks during a pause. Resume continues with the time that was left.

### 4.4 Rounds

- **1 to 5 rounds**, default **2** (5 Second Rule's advice: 2–3 for large groups, 4–5 for small). The setup shows an estimate: players × rounds × (turn length + about 40 seconds for the hand-over and recap), written as one counted phrase, e.g. "About 25 minutes" (`plural(n, "About {n} minute", "About {n} minutes")`, §6.0).
- After the last round the final standings offer **Play another round**, which adds one round to the same session and keeps every point, and **New game** (same players, scores to zero).
- **End game** in the menu ends the session at once; the standings then say which players did not get a turn in the unfinished round.

---

## 5. Scoring and the leaderboard

### 5.1 Points

- **✓ Right: one point.** ✗ Wrong and ↷ Pass: no point and no penalty. Their only cost is time, so passing a hard question quickly is good play, as in the Cash Builder.
- Every group scores the same: the handicap is in the questions (§3.1), not in the points. A two-choice right answer is also one point.
- **The reader judges, generously.** The answer box shows the bank's short answer and, when it differs, the full printed answer in smaller type; a line on the how-to card says *"Near enough counts. Lamp is lamp, and Jonah's 'whale' is his great fish."* The game never checks spelling or speech.
- **Ties share a place**: both rows show the same place (written with the site's `ordinal`, "1st"), and the final screen names a shared top place with `formatList` ("Anna and Ben"). There is no tie-break: the evening is for fun, and a pass-count tie-break (Mastermind's) would teach children to guess rather than pass. A group that wants a decider can play another round.

### 5.2 Fixing a mistake

- **Undo** (during the turn): takes back the last mark and shows that question again; can be pressed repeatedly back to the turn's first question. The clock keeps running.
- **On the recap:** tapping a row's mark cycles it Right → Wrong → Pass (and "not answered" → Right…), and the turn total updates. Points join the leaderboard only when the reader taps **Save turn**.

### 5.3 The session leaderboard

- **After each turn:** a short standings table (place, name, total, a ▲/▼ for places gained or lost this turn) on the way to the next hand-over.
- **When players have played different numbers of turns** (joined late, skipped, game ended mid-round), the table adds **turns played** and **average per turn**, and sorts by total with a note; the average is shown, not used to rank, because a late joiner should see their real total.
- **Final standings:** places 1–3 named at the top in large type (no confetti, no glow), then the full table with one column per round and the total; shout-outs for **best single turn** and **longest run of right answers** (with the player's name and group).
- **Phone records:** the phone keeps the best single-turn score per group, turn length and answer style (open or two choices), since a two-choice turn is easier and must not set the open-answer record. A turn that beats it gets one line on the recap: "New best on this phone", with the group, seconds and style shown beside it as separate labels (§6.0). Records are by group, not by name, because names typed on a shared phone are not identities.

---

## 6. Screens

The setup and the final standings sit in the site's normal layout. The hand-over, count-down, turn and recap are a fixed full-screen layer over the page (as charades does), so a scroll or the site header never gets in the reader's way. The look follows the games' existing styles and the site's approved design rules: no glow everywhere, no boxes around everything, no chat bubbles. Everything works one-handed on a phone held upright, and with a mouse and keyboard on a computer.

### 6.0 Words on screen (the translation check)

The first step of `npm run build` is the site's English-text check ([english_build_check.py](Jarvis/Projects/BibleProject/Website/content/translation/english_build_check.py), described in [the translation README](Jarvis/Projects/BibleProject/Website/content/translation/README.md)). It stops the build on new on-screen English that the translation collector cannot register, and its "language nets" also stop it on sentences built from pieces around a value, hand-written singular/plural choices, and number formats fixed to one language. Every word this game shows is written to pass it, the way the charades and Jeopardy screens are:

- **A player's name always stands in its own element**, never inside a sentence. The fixed words around it are whole phrases of their own: a label such as "In the hot seat" or "Reading" above or beside the name, not "Give the phone to {name} to read". The example lines in §6.1–6.6 are written that way.
- **Counts** use the site's `plural(n, "{n} point", "{n} points")`; **places** use `ordinal`; **lists of names** use `formatList`; **numbers** use `formatNumber`; all from [site-format.ts](Jarvis/Projects/BibleProject/Website/src/lib/site-format.ts). A whole phrase with numbers only, like "Round 2 of 3", may be one template string, as charades' "Turn 2 of 3" is.
- Labels such as the group names and the mark words are plain string literals the collector reads.
- Text no reader sees, or that is English on purpose, needs a ruling in `content/translation/unregistered-reviewed.json` instead. This game should need none.

The build step runs `py -3.12 content/translation/english_build_check.py` before the full build and fixes anything it names in the game's own files.

### 6.1 Setup

- Title, the game's picture, and one line: *"One player, sixty seconds, as many Bible questions as they can answer. Someone else reads from this phone."* A **How to play** link opens a short card (§6.8).
- **Players:** one row per player: name field, group picker (Little ones / Kids / Teens and adults / Bible experts), move up/down, remove. **Add player** up to 12. Hint: "A name can be a team."
- **Game:** seconds per turn (30 / 45 / 60 / 90), rounds (1–5), testament (Both / Old / New), two choices for (Little ones / Little ones and kids / Nobody), sound on/off.
- The time estimate (§4.4).
- **Start game**, disabled with "Loading questions…" until the bank has loaded (loading starts when the page opens, so it is usually ready before names are typed). If loading fails: "The questions could not be loaded." and **Try again** (§9 says how). If a group's pool under the chosen testament held fewer than 60 questions, that group's option would show "too few questions" and be unavailable; with today's bank this never happens, but the check protects against a future bank change.
- If a saved session less than 12 hours old exists: a band at the top, **Carry on tonight's game** with "Round 2 of 3" and the leader shown under a "Leading" label (the name in its own element, §6.0), or **Start fresh**.

### 6.2 Hand-over (full screen)

- "Round 2 of 3 · turn 4 of 6".
- An "In the hot seat" label, the player's name very large under it, and their group underneath ("Kids").
- A "Reading" label with the suggested reader's name (§4.2), and the line "Sit facing the reader. No peeking!"
- **Start** with the turn's seconds as a counted phrase (`plural(n, "Start {n} second", "Start {n} seconds")`), large. Smaller: **Skip this round** (skips the player named above), **Standings**, **Menu**. On a computer, the keys of §6.4 are listed here.

### 6.3 Count-down

3, 2, 1 in very large digits, one second each, one beep each (sound on). Tapping anywhere does nothing (an accidental double tap on Start must not mark the first question).

### 6.4 The turn (full screen) — the screen that matters most

From top to bottom, in portrait:

1. **Top bar:** the clock (ring and digits), the score (**✓ 7**), and a pause button.
2. **The question**, in large type sized to fit (140 characters at most, so it always fits without scrolling on a 360-pixel-wide phone at 22 pixels or more). For two choices, the line "*A* or *B*?" below it.
3. **The answer**, in a tinted band directly under the question: the short answer in bold; the full printed answer smaller when it differs; the reference (e.g. Acts 8:38) in small type. The reader's eye goes question → answer → buttons without moving the phone.
4. **The buttons**, filling the bottom third: **✗ Wrong** and **↷ Pass** side by side, and **✓ Right** the widest, on the right, under the right thumb. Each at least 64 pixels high, each with its symbol, its word and its own colour (never colour alone). A small **Undo** sits above them on the left.

Each mark gives instant feedback (a short colour flash on the score and, on Android, a 30 ms vibration through charades' `buzz(30)`; none when the reader asks for reduced motion) and the next question replaces the old one with no animation, so nothing slows the pace.

**On a computer** the same layout is centred; keys: **→** Right, **←** Wrong, **↓** Pass, **Backspace** Undo, **Esc** pause. The keys are listed on the hand-over screen. Space is deliberately not used (a stray press would score).

**Landscape** (a phone turned sideways): question and answer on the left two-thirds, the three buttons stacked on the right.

### 6.5 Recap

- The player's name, and under it the score as a counted phrase (`plural(n, "{n} point", "{n} points")`), large; the phone-record line when earned.
- One row per question asked: the mark (tap to change, §5.2), the question, the answer, the reference as a link that opens the passage in the site's reader **in a new tab**, so the game is not lost (the link is `/read/bsb/{book}/{chapter}` with `?v={verse}` when there is a verse, written the way Jeopardy's [Verse.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/Verse.tsx) writes it, with `target="_blank" rel="noopener"` and a hidden "(opens in a new tab)"). A turn rarely exceeds 25 rows, so no windowing is needed here.
- **Save turn** → standings (§5.3) → next hand-over.

### 6.6 Standings between turns

The table of §5.3 and one button, **Next player**, with the next player's name shown beside it in its own element (§6.0). Also reachable from the hand-over screen at any time.

### 6.7 Final standings

Top three, full table with a column per round, the two shout-outs (§5.3), and buttons: **Play another round**, **New game, same players**, **Change players** (back to setup with the roster filled in). Below, **All questions tonight**: every question asked in the session, grouped by turn, each with its answer, mark and reader link. It can run to several hundred rows, so it is windowed with the site's `useRowWindow` (about 50 rows above and below the visible area, the rest drawn as the page scrolls; no "load more" button).

### 6.8 Menu and How to play

- **Menu** (a sheet over any game screen; opening it pauses a running turn): Resume, **Players** (add a player, who joins from the next round with 0 points; remove a player, who stays in the standings marked "left"; change a group), **Settings** (seconds, testament, two choices, sound; applied from the next turn), **How to play**, **End game**.
- **How to play** (five short lines): *Pick who is in the hot seat. Someone else holds the phone and reads each question out loud. The phone shows the answer too: tap Right, Wrong or Pass. Sixty seconds per turn; a question started before the buzzer can still be answered. Near enough counts. Most points after the last round wins.*

---

## 7. What the game keeps on the phone

| Key | Storage | Contents |
|---|---|---|
| `bp-hot-seat` | local | Settings, the last roster (names and groups), phone records per group and turn length. Version-stamped. |
| `bp-hot-seat-game` | local | The session in progress: settings, players (with joined round and left flag), every saved turn with its frozen questions and marks, the turn in progress (questions so far, marks, time left), and the time it was last saved. Offered back for 12 hours (§6.1), then discarded. Written after every mark. |
| `bp-hot-seat-seen` | local | The ids of the last 2,000 questions asked on this phone (16 characters each, about 40 KB). |

Local storage, not session storage (which the charades game uses), because phones often unload a background tab between turns while the reader passes the phone round, and the evening's leaderboard must survive that. A full session (12 players, 5 rounds, about 15 questions a turn, each frozen at about 300 bytes) is about 300 KB, well inside the browser's limit. If storage is unavailable (private browsing on some browsers, or full), the game still plays, with one line on the setup: "This browser is not saving, so a reload will lose the scores." Nothing leaves the phone; there are no accounts, no server and no analytics events beyond the site's existing page views.

---

## 8. Things deliberately left out

| Left out | Why |
|---|---|
| Steals (others answer what the player missed) | Needs a second judge per question and breaks the one-player rhythm; Jeopardy already does steals for church nights. |
| Passing a question to the next player, elimination (Millionaire Hot Seat) | Leaves children sitting out; needs a host. |
| Negative points for wrong answers | Punishes guessing, which is how children learn; the Cash Builder has none. |
| A projector or room screen | The live quiz and Jeopardy cover the big-screen case; this game is for a living room or a circle of chairs with one phone. |
| Speech recognition or typed answers | Judging spoken, near-enough answers is what people do well and machines do badly; it would also need the microphone. |
| Share card or online leaderboard | A one-room party game; nothing to compare across rooms. Could come later from the same final table. |
| Catechism questions | §3.2 rule 1; decided in review (§14). |
| Themed decks (Moses, Jesus' miracles…) | The pool is big enough that "everything" stays fresh; the test page's themes could be added later as one more setting, as Jeopardy uses them. |
| Get-to-know-you questions | Not Bible questions and not in the bank (§1.1). |

---

## 9. Reused code and data (imported, never edited)

| From | What |
|---|---|
| [data.ts](Jarvis/Projects/BibleProject/Website/src/lib/data.ts) | `loadQuestionBank` (the bank in the reader's language, in parts), `BankQuestion`, `QuestionBank`. Loaded through a small hook in `HotSeatGame.tsx` written like Jeopardy's `useBank` in [JeopardyGame.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/JeopardyGame.tsx): it re-runs on a change of site language (`useSiteLanguage`) and on a retry counter, so **Try again** works (`loadQuestionBank` forgets a failed load, so a retry fetches again). The shared [useQuestionBank.ts](Jarvis/Projects/BibleProject/Website/src/pages/questions/useQuestionBank.ts) is not used: it has no retry. Jeopardy's hook is not exported, so its dozen lines are written again, with a comment naming the source. |
| [pick.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/pick.ts) | `isPlayable`, `poolOf` (kinds, level, children, testament), `toQuizQuestion` (freezing a drawn question, §3.4), `questionId`. |
| [names.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/names.ts) | `normaliseName`, `NAME_MAX`. |
| [categories.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/categories.ts) | `shownText` (the children's wording rule). The "needs choices" pattern is copied (it is not exported), with a comment naming the source. |
| [charades/sound.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/charades/sound.ts), [charades/sensors.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/charades/sensors.ts) | `unlockSound`, `beep` (`tick`, `buzzer`, `correct`, `pass`), `buzz`; `requestWakeLock`, `releaseWakeLock`. A wake lock is dropped by the browser whenever the page is hidden, and `requestWakeLock` does not ask again by itself, so the game requests it again on its own `visibilitychange` handler while a session is open. |
| [useRowWindow](Jarvis/Projects/BibleProject/Website/src/lib/useRowWindow.ts) | The windowed "All questions tonight" list (`scroller: "window"`). |
| [site-format.ts](Jarvis/Projects/BibleProject/Website/src/lib/site-format.ts) | `plural`, `ordinal`, `formatList`, `formatNumber` (§6.0). |
| (no shared helper exists) | The recap's "read the passage" link is written inline as `/read/bsb/{book}/{chapter}?v={verse}`, exactly as the live quiz's player screens and Jeopardy's `Verse.tsx` do; there is no site helper for it to import. |

If the build step finds that importing from another game's folder makes that game harder to change, it may copy the few lines instead; either way no other game's file is edited.

---

## 10. Files

**New, all in [src/pages/games/hot-seat/](Jarvis/Projects/BibleProject/Website/src/pages/games/hot-seat/):**

| File | What it does |
|---|---|
| `HotSeatGame.tsx` | The page (default export): loads the bank, holds the session, switches between screens, saves after every change. |
| `Setup.tsx`, `Handover.tsx`, `Countdown.tsx`, `Turn.tsx`, `Recap.tsx`, `Standings.tsx`, `Final.tsx`, `MenuSheet.tsx`, `HowToPlay.tsx` | The screens of §6. |
| `pool.ts` | The groups and the eligibility rules of §3.1–3.2: `poolFor(questions, group, settings)`, pool sizes for the setup check. Pure. |
| `deal.ts` | Drawing the next question (§3.4) and building the two choices (§3.3); takes a random function so tests are repeatable. Pure. |
| `game.ts` | The session as one reducer: start turn, mark, undo, time up, finish, fix a recap mark, save turn, skip, add/remove player, change group or settings, add round, end; standings, averages, shout-outs, records. The only place points change. Pure. |
| `storage.ts` | Reading and writing the three keys of §7, with version checks, the 12-hour expiry, the seen-list cap and the "not saving" detection. |
| `hot-seat.css` | The full-screen layer, the turn layout (portrait and landscape), the buttons. |
| Tests | `pool.test.ts`, `deal.test.ts`, `game.test.ts`, `storage.test.ts`, `HotSeatGame.test.tsx`, plus a small `hot-seat.test.fixture.ts` question set (its name keeps it out of the translation collector and Vitest's file list, as Jeopardy's fixture does). |

**Changed (one entry each):**

- [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts): the `hot-seat` entry gets `status: "live"` and `load: () => import("./hot-seat/HotSeatGame")`; title, description, audiences, shelf and art stay as they are.
- [src/pages/games/README.md](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md): a "Hot seat" section like the other games' (what it is, code, what is saved, checks, known gaps).

No change to the router, header, other games, the bank or its scripts.

---

## 11. Tests the build step adds (all in `npm test`)

- **pool.test.ts:** on the fixture, each rule of §3.2 includes or excludes the right questions (a lead-in question, a "which of these", a "NOT", a 141-character question, a 41-character answer, a catechism question, a children's question with and without children's wording). **Against the real bank** (skipped when [bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) is absent, as Jeopardy's test does): prints the four pool sizes for Both, Old and New, and fails if any group has fewer than 1,000 in Both or 300 in either testament.
- **deal.test.ts:** with a seeded random function: no question repeats within a session across 60 simulated turns of 20 draws for every group; the first-four-words rule and the topic spread hold; *Teens and adults* turns open with two easy questions; two-choice pairs always contain the right answer and one of that question's own wrong options, in both orders over many draws; the seen list is honoured and its oldest entries are forgotten only when fewer than 200 unseen remain.
- **game.test.ts:** marks and points; Undo back to the first question; time-up allows exactly one more mark and then no new question; the 15-second idle close; recap fixes change the total before saving and never after; round order turns by one each round; skips, late joiners and leavers give the right turns-played and averages; ties share a place; best turn, longest run, phone records; Play another round keeps points, New game clears them.
- **storage.test.ts:** round-trip of all three keys; a damaged or older-version value is ignored, not thrown; a session older than 12 hours is not offered; the seen list stays at 2,000; a store that throws on write leaves the game playable and flags "not saving".
- **HotSeatGame.test.tsx:** a whole two-player, one-round game with the fixture bank and fake timers: setup, hand-over, count-down, marking by button and by key, the buzzer and the last question, recap fix, standings, final; the pause hides question and answer; a reload mid-turn offers "Carry on" and resumes with the time that was left; the bank failing to load shows "The questions could not be loaded." with **Try again**, and a second attempt that succeeds opens the setup.
- The existing [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx) covers the registry entry with no change.
- **The build's English-text check** (§6.0): `py -3.12 content/translation/english_build_check.py` reports nothing new in `src/pages/games/hot-seat/`, run before `npm run build` (which runs it first anyway).

**Manual checks** for the build step, on the always-on preview at http://127.0.0.1:8931/games/hot-seat (never a new dev server): screenshots of every screen at phone width (portrait and landscape) and desktop, light and dark; a real one-minute turn to check the pace (a reader should manage 10–15 questions); the question at its 140-character maximum on a 360-pixel-wide screen.

---

## 12. Edge cases

| Case | What happens |
|---|---|
| The bank fails to load or is slow | Setup shows "Loading questions…"; on failure, "The questions could not be loaded." and **Try again** (§6.1, §9). A game in progress that needs new questions after a reload waits for the bank on the hand-over screen with the same message. |
| A group's pool runs dry in a long session | The seen list's oldest entries for that pool are forgotten first (§3.4); if even the session-asked rule leaves nothing (not reachable with today's pools), questions asked earlier this session become eligible again, oldest first, and the recap marks them "asked earlier". |
| Reader taps the wrong button | Undo at once, or fix it on the recap (§5.2). |
| A question the reader cannot pronounce or judge | Pass. The recap shows the answer for everyone. |
| The player answers just as the buzzer sounds | The question on screen may always be finished (§4.3). |
| Phone locks, a call comes in, the tab is closed | The clock pauses (page hidden) and the question is hidden; on return the turn resumes with the time left. After a closed tab, "Carry on tonight's game" restores everything up to the last mark. |
| Accidental Back or a link opened in the same tab | The session is saved after every mark; returning to `/games/hot-seat` offers "Carry on". Recap links open in a new tab. |
| Several tabs open on the game | Each tab keeps its own session in memory; the most recent save wins on the next "Carry on". Rare on a shared phone, and the cost is at most one turn. (Jeopardy's tab-claiming was considered and left out, §14.) |
| A player leaves mid-game | Menu → Players → Remove: their points stay in the table, marked "left"; they are skipped from then on. |
| A latecomer arrives | Menu → Players → Add: they start from the next round with 0 points; the table shows turns played and averages (§5.3). |
| Only one player | The game runs; the final screen shows their total and phone records. |
| 12 players, 5 rounds | About an hour; the estimate says so before Start. The leaderboard table scrolls inside the site layout (12 rows). |
| Turn length changed mid-game | Applies from the next turn; the standings note "turns of different lengths". |
| The site language is not English | Questions come from the bank in the reader's language (the site's existing translated bank parts), and the frozen questions keep the language they were shown in. Known gaps: the "needs choices" filter (§3.2 rule 4) is an English pattern, so in other languages a few "which of these" questions can slip through (the reader passes them); and question ids are computed from the shown text, so the seen list may not recognise a question asked earlier in another language. Checked in review: `questionId` hashes the question's collection, its `question` and its `answer`, and a translated bank part replaces `question` and `answer`, so the same question has a different id in each language. That is accepted: it costs at most an occasional repeat after someone changes the site language, even within one evening if the language is changed mid-game, and keying on the English text would mean loading the English bank as well. The game's own words are written to pass the build's English-text check (§6.0), so the translation collector registers them; until a translation run reaches them they show in English, as the other games' do. |
| Sound blocked (iPhone on silent, sound not yet unlocked) | Sound is started on the Start tap; it is never the only signal: the clock's digits, ring and the "Time!" band carry everything. |
| Screen dims during a turn | Wake lock requested on Start game and on every return to the page; where unsupported, a 60-second turn rarely outlasts the phone's dim timeout, and any tap keeps it awake. |
| Reduced motion | No flashes or ring animation (the ring steps once a second); no vibration. |
| Very long names | Capped at 16 characters on entry; the table truncates with an ellipsis and the full name in its accessible label. |
| A question in the bank is wrong | Pass during the turn. Fixing questions belongs to the questions chat ([content/questions/HANDOFF.md](Jarvis/Projects/BibleProject/Website/content/questions/HANDOFF.md)); the game adds no flagging of its own. |

---

## 13. Accessibility

- Buttons at least 64 × 64 pixels during the turn, each with symbol, word and colour; focus visible; every control reachable by keyboard; the keys of §6.4.
- The question and answer are real text (screen readers read them; the browser zoom enlarges them). A polite live region announces each new question for a reader using a screen reader, and "Time" at the buzzer.
- Contrast at least 4.5 : 1 in light and dark themes for all text, including the tinted answer band.
- Colour is never the only signal: marks have symbols and words, the last five seconds have digits as well as colour, the buzzer has the "Time!" band as well as sound.

---

## 14. Points that were open, as decided in review

None of these needs the owner: each has an obvious answer that keeps the game simple, and each can be changed later without losing anything.

1. **Catechism questions stay out** (§3.2 rule 1). Only 451 of the bank's 1,781 are short enough, and a recited formula cannot be judged "near enough" at speed. A church that wants catechism drills has the live quiz and Jeopardy, which offer them.
2. **Groups stay per player**, every new player defaulting to *Teens and adults*, so a group that does not care never touches the picker. Per-player groups are the only way a grandparent and a six-year-old share one fair leaderboard, which is the point of the game.
3. **The 140 / 40 character limits stay** as two constants in `pool.ts`; the build step's manual one-minute turn (§11) confirms the pace. The pools were re-measured in review with these limits and match §3.2 exactly.
4. **No tie-break** (§5.1). "Play another round" is the decider for a group that wants one.
5. **No tab claiming** (§12). A second tab on the same shared phone is rare, and the worst case is losing one turn's marks, which the recap and "Carry on" already make cheap. Jeopardy's version (a tab id saved with the game, so a tab that sees a newer save from another tab says "This game is open in another tab" with **Use this tab**) can be copied later in a few lines if two tabs ever turn out to be common.
6. **The seen list keeps `questionId` on the question as shown.** Checked: the id is a hash of the question's collection, its `question` and its `answer`; translated bank parts replace `question` and `answer`, so ids differ by language. The cost is an occasional repeat after a language change (§12); keying on English would mean downloading the English bank alongside the translated one. Not worth it.

---

## 15. Cost

None. No model, no new service, no new dependency, no new data file. The game reads the question bank the site already ships (the same download Jeopardy and the test page use) and stores a few hundred kilobytes in the player's own browser.

---

## 16. Sources

- APPROVED-IDEAS.md entry 22 and FEATURE-BUILD-RULES.md (binding spec and shared rules).
- The site's question bank, measured 2026-11-10: [bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) (14,916 questions; schema `bibleproject.question-bank/v2`); the live quiz's filters in [pick.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/pick.ts); Jeopardy's open-answer rule in [categories.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/categories.ts) and [its design](Jarvis/Projects/BibleProject/Website/docs/features/bible-jeopardy/design.md) §3.5; the charades game's timer, sound and keep-awake code and [its design](Jarvis/Projects/BibleProject/Website/docs/features/family-charades/design.md).
- The Chase (British game show), Wikipedia: https://en.wikipedia.org/wiki/The_Chase_(British_game_show); American and Australian versions: https://en.wikipedia.org/wiki/The_Chase_(American_game_show), https://en.wikipedia.org/wiki/The_Chase_Australia; German version: https://en.wikipedia.org/wiki/Gefragt_%E2%80%93_Gejagt.
- Mastermind (British game show), Wikipedia: https://en.wikipedia.org/wiki/Mastermind_(British_game_show).
- Family Feud Fast Money: LiveAbout, "Family Feud: The Rules of the Game": https://www.liveabout.com/family-feud-brief-overview-1396911; Family Fortunes, Wikipedia: https://en.wikipedia.org/wiki/Family_Fortunes.
- Millionaire Hot Seat: Simple English Wikipedia: https://simple.wikipedia.org/wiki/Millionaire_Hot_Seat; Australian game shows wiki: https://australiangameshows.fandom.com/wiki/Millionaire_Hot_Seat; Network Ten: https://10.com.au/millionaire-hot-seat.
- Hot seat as a party and youth-group game: Faithful Parables, "20 Christian Games for Youth Fellowship" (Hot Seat Bible Edition): https://faithfulfable.com/christian-games-for-youth-fellowship/; KraftyLab, "Hot Seat Questions" (speed-seat variant): https://www.kraftylab.com/blog/hot-seat-questions; Quizado, "Question games": https://quizado.com/blog/question-games.
- 5 Second Rule rules: Geeky Hobbies: https://www.geekyhobbies.com/5-second-rule-rules/; Geeky Hobbies, Disney edition: https://www.geekyhobbies.com/5-second-rule-disney-edition-rules/.
- Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science*, 17(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x

---

## 17. Review

**One review, 2026-11-10** (job f7d6bba9, sequence 31 step 18), as [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md) asks: read critically against the spec (APPROVED-IDEAS.md entry 22), the shared rules and the real code. The corrections below are already made in the body above; this section only records them.

**Checked and found right (no change):**
- The four pool sizes, their level and testament splits, and the 14,916-question total: re-measured on today's [bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) with §3.2's rules, and every number in the §3.2 table matched exactly. The bank has no trivia or Sunday-school question without a level, and ten topics, the largest about a fifth of the bank, so the topic-spread rule of §3.4 always has somewhere to go.
- The code the design reuses exists with the names it gives: `isPlayable`, `poolOf`, `questionId`, `trimReference` in [pick.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/pick.ts); `normaliseName` and `NAME_MAX` in [names.ts](Jarvis/Projects/BibleProject/Website/src/lib/live-quiz/names.ts); `shownText` and the private "needs choices" pattern in Jeopardy's [categories.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/jeopardy/categories.ts); `unlockSound`, `beep`, `buzz`, `requestWakeLock`, `releaseWakeLock` in charades; `useRowWindow`.
- The hub entry `hot-seat` (coming soon, shelf for youth groups and church nights, audiences youth group and family, picture already drawn), so the registry change is only `status` and `load`.
- The charades game's age labels, its end-time clock and its use of session storage; the fixture name staying out of Vitest's file list; Jeopardy's real-bank test being skipped when the bank is absent.
- The spec is met: one player, 60 seconds, questions from the bank, read off one phone, a score of how many were right; and the brief's age selection, timer, scoring, rounds, players and session leaderboard are all covered. No model, no cost, no new data, nothing deployed.

**Corrected, most important first:**
1. **The build would have failed on the game's own words.** The first step of `npm run build` is the site's English-text check, which also stops the build on sentences built around a value and hand-written plurals. The design did not mention it, and many of its example lines were exactly that kind of sentence ("Anna scored 9", "Give the phone to Ben to read", "Skip Anna this round", "1st = Anna and Ben", "8 players, 2 rounds: about 25 minutes"). Added §6.0 (names in their own element; counts, places and lists through the site's `plural`, `ordinal` and `formatList`), rewrote those lines in §4.2, §4.4, §5.1, §5.3, §6.1, §6.2, §6.5 and §6.6, and added the check to §11 and §12.
2. **"Retry" had nothing behind it.** §9 loaded the bank through the shared `useQuestionBank`, which has no retry, while §11 and §12 promised one. §9 now loads it the way Jeopardy does (a small hook that re-runs on a retry counter and on a change of site language), and the button is named "Try again" as in Jeopardy.
3. **A "site verse-link helper" that does not exist.** No shared helper writes reader links; the live quiz and Jeopardy each write `/read/bsb/{book}/{chapter}?v={verse}` inline. §6.5 and §9 now say so. In the same place, §3.4 now freezes each question with the live quiz's exported `toQuizQuestion`, which already returns the id, the shown wording, the options, the trimmed reference and a checked link, instead of rebuilding the live quiz's private helpers.
4. **The children's wording was oversold.** Only 180 of the 3,080 Little ones questions and 260 of the 4,428 Kids questions have a usable children's wording, and the Little ones pool is exactly the easy half of the Kids pool. §3.1 now says this plainly: the two choices read aloud are what make it fair for the youngest, and the group picker says so.
5. **§1.1 said the hub card calls the game a Bible quiz,** but the card's description, which §10 keeps unchanged, does not. §1.1 now gives that job to the setup screen and keeps the description, so its existing translations stay valid.
6. Smaller fixes: `normaliseName` does not shorten names, so §4.1 adds the 16-character cut (by code point, so an emoji is never split); phone records are kept per answer style too, so an easier two-choice turn never sets the open-answer record (§5.3); the sounds are mapped to charades' existing tones, with no tone for Wrong (§4.3); the wake lock is asked for again by the game itself after the page is hidden, since charades' helper does not (§9); the US prize in the research table is dated to the first US version of The Chase (§2.1).

**Open points (§14) decided** without needing the owner: catechism stays out, groups stay per player, the length limits stay, no tie-break, no tab claiming, and the seen list keeps its current ids (checked: they differ by language, an accepted small cost).

**Left for the build step:** the manual one-minute turn and screenshots on the always-on preview (§11), and running the English-text check before the full build. Nothing in this design needs the owner's decision.
