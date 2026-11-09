# Bible Jeopardy for church nights — design

**Status:** research and design (2026-11-09, orchestrator job 834, sequence 30 step 14). The next step reviews this
document once against the spec, the shared rules and the real code, applies its corrections in the body and appends a
**Review** section; the step after that builds it.
**Spec (owner-approved, binding):** APPROVED-IDEAS.md entry 15, "Bible Jeopardy for church nights" — "Category boards
built from the question bank, projector-ready."
**Shared rules:** FEATURE-BUILD-RULES.md (Jarvis/Projects/BibleProject/) — no runtime AI cost, reuse the site's data,
Scripture in the Berean Standard Bible (BSB), register on the /games hub, touch only this feature's own files plus its
registry entry, add tests, never deploy.
**Slug:** the hub already lists the game as `jeopardy` (coming soon) in [registry.ts](../../../src/pages/games/registry.ts),
with its drawing done (`GAME_ART.jeopardy`, an easel of category tiles). The address is therefore **/games/jeopardy**;
only this design folder is named `bible-jeopardy`, as the step brief asked.

In one paragraph: a youth leader or Sunday-school teacher opens **/games/jeopardy** on a laptop plugged into a
projector or TV, names two to six teams, and either lets the site deal a board ("Surprise me") or picks the categories
— Moses, The parables, Kings of Israel and Judah, Genesis, and so on. The site builds a board of 3 to 6 category
columns, five tiles each, worth 100 to 500, by drawing questions from the site's question bank so that each column runs
from easier to harder. The leader can swap any column, print a host sheet with every answer, then start. Teams take
turns choosing a tile; the clue fills the screen; the leader marks which team was right or wrong with one click (or one
key); the answer is then shown with its verse from the BSB. A hidden Daily Double lets a team bet its points, and an
optional Final question lets every team wager at the end. Everything runs in the one browser: no server, no accounts,
no phones needed, no AI at runtime, and it costs nothing to run.

---

## 0. Summary of decisions

| Question | Decision | Why (section) |
|---|---|---|
| One screen or phones too? | **One screen.** The laptop drives the projector; teams answer out loud. Phone buzzers are a later option. | Every church-night source plays it this way; no server means no cost and nothing to fail on church Wi-Fi (1.4) |
| Where categories come from | The test page's **59 themes** (Moses, The parables, …) and the **books of the Bible** | Already written, titled and tested on the site; 58 themes have enough questions (2.2) |
| Board size | **3–6 categories × 5 rows**, default 5 × 5, values **100–500** | The church-game norm; fits a 4:3 projector (1.3, 3.1) |
| Difficulty per row | Each column climbs: rows are drawn by the bank's own easy / medium / hard rating, then sorted | The bank rates every question (3.3) |
| Answer style | **Open answer** by default (clue only, host judges); **four choices** as a setting, on by default for children | Real Jeopardy is open; younger children need choices (3.5) |
| Who answers | **Take turns** (default, with steals) or **Buzz in** | Both are standard in churches and classrooms (1.3, 5) |
| Wrong answers | **Cost nothing by default**; "Wrong answers lose points" is a setting | Church and children's sources drop the penalty (1.3, 6) |
| Daily Double and Final | Both **on by default**, each can be switched off | The two parts people remember; both work without phones (6.3, 6.4) |
| Host's answer | Single screen: answer shown after judging; a **printable host sheet** for leaders who want it beforehand | Projector mirrors the laptop in most church halls (5.4) |
| Saving | The game in progress survives a reload; a **board link** reopens a prepared board on another device | Leaders prepare at home and play at church (7) |
| Cost | **$0** to build and run; nothing generated | Section 11 |

---

## 1. Research

### 1.1 What "Jeopardy" means to the people who will play it

The television show (as summarised by the rules guides listed under Sources; there is no public official rulebook):

- **The board:** six categories, five clues each. The first round's values run $200–$1,000 (since 2001; $100–$500
  before), the second ("Double Jeopardy") doubles them. The clue is read, and contestants buzz in.
- **Answer in the form of a question** ("What is Jericho?"). A right answer adds the clue's value; a wrong one
  subtracts it; the player who answered right chooses the next clue ("control of the board").
- **Daily Double:** one hidden tile in the first round, two in the second. Only the player who found it answers, after
  betting any amount from $5 up to their score or the round's top clue value, whichever is larger. Right adds the bet,
  wrong subtracts it, so a score can go below zero.
- **Final Jeopardy:** the category is shown, every player with more than $0 writes a secret bet between zero and their
  score, then sees the clue and writes an answer in 30 seconds. Right adds the bet, wrong subtracts it. Players at or
  below zero sit out.

### 1.2 Classroom and quiz-night tools

| Tool | How it plays | What we take from it |
|---|---|---|
| **JeopardyLabs** (jeopardylabs.com) | Free, no sign-up. A board on the projector, click a tile to see the clue, Space shows the answer. Teams' names and scores are editable; the host adds or removes points by hand. Keys: arrows move round the board, Enter/Space opens, Space reveals, Esc closes, number keys 1–9 pick a team, ↑/↓ change its score. Answers are spoken aloud; buzzers are a separate free app. | **The model for our host flow.** Fast, nothing to install, keyboard-driven. We add what it lacks: content (the leader does not have to write 25 questions), the Daily Double and Final rules applied automatically, and undo. |
| **Factile** (playfactile.com) | Jeopardy-style boards, Daily Doubles, a doubled second round, a Final round, timers, team play, phone buzzers with a buzz-in queue (up to 100 teams). Free plan: three custom games, up to five teams; buzzers need the paid plan. | Confirms Daily Double + Final + timer as the expected feature set, and phone buzzers as a premium extra. Its many settings make it slow to learn — we keep ours to one screen of settings. |
| **TriviaMaker, Super Teacher Tools, Flippity, Wordwall** | Template makers: the teacher types the questions. | The common pain: **writing the questions is the work.** Our board is built from the bank in a second. |
| **Printable and PowerPoint "Bible Jeopardy" sets** (Sunday-school sites, mybiblesong.com, biblethought.org, mashupmath.com, sundayschoolnetwork.com) | A fixed set of 25 questions in 5 categories, $100–$500, played with a printed board or slides. | Fixed sets run out after one night. Ours never repeats until the bank is exhausted (8). |
| **Browser "Bible Jeopardy" games** (e.g. bibleversenow.org) | Small fixed boards; the page could not be read when researched (it refused automated access), so not compared further. | — |

### 1.3 How churches actually play it (youth-ministry and Sunday-school guides)

- **Five categories by five clues, 100 to 500 points** is the usual church layout; children's versions use smaller
  numbers. Categories are things like "Old Testament people", "New Testament stories", "Bible places".
- **Two to four teams of about equal size** works best for a big group; each team often names a **captain** who gives
  the answer after the team confers. A coin toss decides who starts.
- **Steals:** almost every guide adds one. If the team that chose the clue is wrong (or runs out of time, about
  25 seconds in one guide), the next team — or any team that buzzes — may answer for the points.
- **No penalty for wrong answers** with children: "a negative score discourages more than it entertains."
- **Buzzers** are anything to hand — a bell, a squeaky toy, a raised hand — and the host decides who was first.
- **Final question:** kept, sometimes with the teams choosing how much to play for.

### 1.4 What this means for us

1. **One projected screen, answers spoken aloud, the host judges.** That is how every church guide plays it, and
   JeopardyLabs' success shows it is enough. Phone buzzers would need the live quiz's room server and good Wi-Fi in the
   hall; they are listed as a later addition (12), not built now.
2. **The questions are the product.** The leader should get a ready, balanced board in seconds, and a different one
   next week.
3. **Two answering styles** cover the guides: *Take turns* (each team chooses in turn and answers first; others may
   steal) and *Buzz in* (anyone may answer; right answer takes control, as on television).
4. **Gentle defaults for church:** wrong answers cost nothing unless the leader turns that on; the Daily Double and the
   Final keep the drama without a penalty on every miss.
5. **Keyboard first, like JeopardyLabs**, so a leader can run it with a presentation clicker or from across the room.
6. **No copied trade dress.** "Jeopardy!" is a registered trademark of Jeopardy Productions (Sony Pictures
   Television). The owner approved the name "Bible Jeopardy", and the hub already uses it — as hundreds of church and
   classroom games do — but the game does not use the show's logo, its blue-and-gold look, its "think" music or its
   phrases ("America's Favorite Quiz Show"). It looks like the rest of Bible Guide. If the owner ever wants a name with
   no trademark in it, "Bible Quiz Board" would need only the registry title and the page heading changed.

---

## 2. Data (all already on the site)

### 2.1 Sources

| Need | Source | Facts (measured 2026-11-09 by a throwaway script over `data/questions/bank.json`) |
|---|---|---|
| Questions | The question bank, read with `loadQuestionBank()` in [data.ts](../../../src/lib/data.ts) (type `BankQuestion`) | 14,916 questions, each with four options, a level (easy/medium/hard), a children flag, books, testament, people, places and subjects. |
| What can stand on a projector | `isPlayable`, `poolOf`, `questionId`, `toQuizQuestion`, `trimReference` in [pick.ts](../../../src/lib/live-quiz/pick.ts) (the live quiz's own selection code) | Imported, not copied or changed. The live quiz's default (Bible quiz + Sunday school, catechism left out) leaves **13,122** playable questions: 3,921 easy, 5,819 medium, 3,382 hard. For children (`children: true`, children's wording where it exists): **5,061**, of which 3,488 easy, 1,568 medium, 5 hard. |
| Categories | The test page's themes: `SHELVES`, `THEMES` and `inTheme` in [themes.ts](../../../src/pages/questions/test/themes.ts) | 59 themes in 4 shelves and 20 groups, each with a title and a one-line description. With the default pool, 58 have questions (the "God and his word" theme draws only on catechism questions, so it is empty unless catechism is switched on). |
| Book categories | `books` on each question; book names from `bank.books` | 57 of the 66 books have 25 or more playable questions (38 for children). |
| Verse on the answer screen | `VerseWords` in [parts.tsx](../../../src/pages/questions/test/parts.tsx) — the BSB text of the linked verse, linked to the reader | 14,622 questions carry a `link`; the rest show only the reference. |
| Team names | `friendlyName` and `checkName` in [names.ts](../../../src/lib/live-quiz/names.ts) | "Brave Lions" style names for one-click team naming, plus the same typed-name filter. |
| Translations | `loadQuestionBank()` picks the leader's language automatically | Clues and answers follow the site language, as in the live quiz. |

**Nothing is generated.** No model runs at build time or at runtime; no new data file is added.

### 2.2 How well the bank fills a board (measured)

- **Questions per theme**, adult pool: from 22 ("Jesus Christ") to 1,029 ("Isaiah and Jeremiah"); the median theme
  has about 230. Children's pool: 16 to 402.
- **Can every column climb from easy to hard?** For the three difficulty settings of 3.3, the number of themes with
  enough questions at each level to fill the five rows exactly: Gentle 58, Standard 58, Challenging 55 (of 58 usable).
  For children only Gentle is offered, and 56 themes fill it exactly.
- **Simulation:** 2,000 random six-column boards per pool, one theme per group, no question used twice: the adult
  Standard board never fell short and never needed a question off its level. The children's Gentle board never fell
  short; about 1 tile in 90 used a neighbouring level (handled by 3.4).
- **Overlap:** 5,299 of the 11,273 questions that belong to some theme belong to more than one (a Moses question is
  also often a "plagues and the sea" question). Section 3.2 deals with it.
- **Clue length:** median 82 characters, 99% under 156, longest 214 (children: median 66, longest 187). **Answer
  length:** median 21, 99% under 66, longest 109. Both fit a projector at the sizes in 9.3.
- **Questions that make no sense without their options** ("Which of these is NOT one of the Ten Commandments?"): 25
  adult, 6 children's. They are left out when choices are hidden (3.5).

---

## 3. Board generation

All of this is pure functions in the browser, in `generate.ts` and `categories.ts` (10), with a seeded random number
generator so tests can repeat a board exactly.

### 3.1 The board's shape

- **Columns:** 3, 4, 5 or 6 categories (default 5). Six is the television board; five is the church norm and reads
  better on a 4:3 projector.
- **Rows:** always five, worth **100, 200, 300, 400, 500**. (Fixing five rows keeps the difficulty ladder simple; a
  shorter game is made with fewer columns.)
- **Rough length**, shown on the setup screen: about 1¼ minutes a tile, so 3 columns ≈ 20 minutes, 5 ≈ 30–35,
  6 ≈ 40, plus about 5 minutes for the Final.

### 3.2 Choosing categories

A **category** is either a theme (id `theme:<theme id>`, title and line from [themes.ts](../../../src/pages/questions/test/themes.ts)) or a book
(id `book:<code>`, title the book's name in the site language, line "Questions from <book>").

The **candidates** of a category are the questions in the current pool (3.5) that belong to it (`inTheme` for themes,
`books` contains the code for books). A category is **offered** only if it has at least **8** candidates and can fill
its five rows (so a swap always has somewhere to go); otherwise it is greyed in the picker with "Too few questions with
these settings".

- **Surprise me** (the default): picks the board's categories at random from the offered **themes**, at most **one
  theme per group** (so never "Moses" beside "The plagues and the sea", or "Peter" beside "Paul"), and preferring a
  spread of shelves (no more than two columns from the same shelf when the board has five or six columns). Books are
  not in the surprise draw: themes make better headings.
- **Choose categories:** a picker lists every offered category under the test page's shelves and groups, then "Old
  Testament books" and "New Testament books", each with its question count. The leader ticks up to the column count;
  any column left empty is filled by the surprise rule.
- **Testament:** an optional filter (Both / Old / New). For themes, it narrows candidates to questions of that
  testament; a theme left with too few is greyed out.

### 3.3 The difficulty ladder

Each column's five rows have a target level, set by the board's **difficulty**:

| Difficulty | 100 | 200 | 300 | 400 | 500 | Final question |
|---|---|---|---|---|---|---|
| **Gentle** (forced when *For children* is on) | easy | easy | easy | medium | medium | medium |
| **Standard** (default) | easy | easy | medium | medium | hard | hard |
| **Challenging** | medium | medium | hard | hard | hard | hard |

The levels are the bank's own ratings (`level`, made by [question_difficulty.py](../../../scripts/question_difficulty.py)).

### 3.4 Filling the board

1. **Fill the scarcest column first.** Columns are processed in order of fewest candidates, so a small category
   ("Ruth and Naomi", 78) gets its pick before a big overlapping one takes its questions. Their screen order is the
   order the leader chose, or the draw order for Surprise me.
2. **For each row**, pick at random a candidate at the target level that is not already on this board and **not
   recently played** (8). If there is none, take the nearest level: for a target of easy, medium then hard; of hard,
   medium then easy; of medium, easy then hard. If the only remaining candidates are recently played, use the one
   played longest ago.
3. **Sort the column** by level (easy, medium, hard; the draw order breaks ties), so a lower value is never a harder
   question than a higher one in the same column, even after a fallback.
4. If a column still cannot reach five (only possible with very narrow filters), the category is dropped and replaced
   by the surprise rule; if no category can replace it, the board has fewer columns and the preview says so ("Only 4
   categories have enough questions with these settings").
5. **Each tile stores** the `toQuizQuestion` result (id, text, lead-in, four shuffled options with the right one's
   index, reference trimmed to 160 characters, verse link), its category id and its value. The children's wording is
   used where the setting asks for it, exactly as the live quiz does.

### 3.5 The pool (which questions are eligible at all)

The live quiz's `poolOf` with these filters, then one extra rule:

- **Kinds:** Bible quiz and Sunday school by default; **catechism** is opt-in, as in the live quiz, because its answers
  belong to one church tradition (mostly Reformed or Lutheran catechisms), and the site speaks in the Baptist Faith
  and Message's voice. A leader whose church uses a catechism can switch it on, which also brings in the doctrinal
  themes ("God and his word" and others).
- **For children:** only questions marked suitable for children of about 6 to 11, in their children's wording.
- **Testament:** as 3.2.
- **Extra rule — open answer needs a self-contained clue.** When choices are hidden, questions matching
  `/\b(which|what|who) of (these|the following)\b|\bwhich one of\b|\bNOT\b/` (case-sensitive "NOT") are left out
  (25 adult, 6 children's today). With choices shown they stay in.

Levels are **not** a pool filter here: every board mixes levels by row.

### 3.6 Daily Double and Final question

- **Daily Double** (on by default): one tile, chosen at random from rows 300–500 (weights 1 : 2 : 2, so it is usually
  further down, as on television), never shown until opened. A board of three columns still gets one.
- **Final question** (on by default): a category **not on the board**, drawn by the surprise rule (a theme from a
  group not already used), and one question from it at the Final level in the table of 3.3, never the same question as
  any tile. The leader can swap it on the preview like a column.

### 3.7 The preview, swapping and redrawing

The preview (9.2) shows the categories and the tile values, **not the clues** (the leader may be standing in front of
the projector). Per column: **Swap** (another category by the surprise rule, or a chosen one) and **New questions**
(same category, redrawn). For the whole board: **New board**. Swapping redraws only that column and keeps every other
tile, the Daily Double moving only if it was in that column.

---

## 4. Teams

- **2 to 6 teams** (default 3). Each has a name and a colour.
- **Names:** "Team 1", "Team 2"… by default, editable (at most 16 characters, through the live quiz's `checkName`
  filter); a dice button fills a friendly name ("Faithful Eagles") from `friendlyName`.
- **Colours:** six fixed, distinct colours from the site's book palette (the `tone` colours the hub art uses:
  history, poetry, prophets, gospels, acts, epistles), each team also shown with its **number** so colour is never the
  only cue.
- **Starting team:** Team 1, or **Random** with a button (the coin toss the guides suggest).
- Teams can be renamed, but not added or removed, once the game starts.

---

## 5. Host flow (one round, step by step)

The person running the game is called **the host** on screen ("leader" in the live quiz; here the guides say host).

### 5.1 Before the night

1. Open /games/jeopardy. **Setup** (9.1): teams, board, rules.
2. **Preview** (9.2): swap anything, then optionally **Print host sheet** (5.4) and **Copy board link** (7.2) to reopen
   the same board on the church laptop.
3. **Start game** opens the board full-screen (the browser's full-screen mode on the game area, as the live quiz's
   leader screen does). Esc leaves full screen; the game carries on in the page.

### 5.2 A turn

1. **Choose.** The scoreboard highlights the team whose turn it is ("Team 2 to choose"). The team calls out a
   category and value; the host clicks that tile (or moves to it with the arrow keys and presses Enter).
2. **The clue** fills the screen: category, value, the clue (with its lead-in above it for two-part questions), and the
   four choices if shown. An optional timer bar runs (6.5).
3. **Answer.** A team says its answer. The host marks it with the **team's button** on the clue screen — **Right** or
   **Wrong** — or with the keys (1–6 right, Shift+1–6 wrong).
   - **Right:** the points are added, the answer and its verse are shown (5.3), and the turn rules decide who chooses
     next (5.5).
   - **Wrong:** the team's button greys out for this clue (no team answers the same clue twice); points are taken off
     only if *Wrong answers lose points* is on. Then other teams may try (a steal).
4. **Nobody knows / time's up:** **Show answer** (Space) reveals it with no change to any score.
5. **Back to the board** (Esc or Enter on the answer screen): the tile is now empty, and the next chooser is
   highlighted.
6. After the last tile: the **Final question** if on (6.4), otherwise **Results** (9.7).

### 5.3 The answer screen

The right answer in large type (the option text, `answer_choice` or the children's answer), the question above it in
small type, and the **verse**: the BSB text of the linked verse with its reference, linked to the reader (opens in a
new tab so the game is not lost) — the teaching moment the live quiz also gives. Questions without a link show the
reference only. The score change is shown on the scoreboard ("+300 Team 2").

### 5.4 The host sheet

Most church projectors mirror the laptop, so the host cannot see an answer the room cannot. Two ways round it:

- **Default:** the host judges by ear and presses Right/Wrong; the answer appears after, for everyone. With
  well-known Bible facts this is how JeopardyLabs and printable sets are played.
- **Print host sheet** (preview and game menu): a printer-friendly page (the browser's own print, no PDF library)
  listing every tile — category, value, clue, answer, reference — with the Daily Double and the Final marked. Printed
  before the game, it lets the host judge open answers confidently.

A second "presenter" window on an extended display is left for later (12).

### 5.5 Who chooses and who may answer

| | **Take turns** (default) | **Buzz in** |
|---|---|---|
| Who answers first | The team whose turn it is. Its button is highlighted. | Anyone; the host clicks whoever was first (a hand, a bell). |
| After a wrong answer | Steal: any other team may answer (the host clicks whichever team answers). | Any team that has not tried this clue may answer. |
| Value of a steal | The full value. | — |
| Who chooses next | The **next team in order**, whatever happened, so every team chooses equally often (fair for children). | The team that answered **right**; if nobody did, the same team chooses again. |
| Daily Double | Only the team that chose it. | Only the team that chose it. |

The host can always override who chooses next by clicking a team's name on the scoreboard ("Make Team 3 choose").

---

## 6. Scoring

All scoring is one pure reducer, `rules.ts`, that turns the game state and one host action into the next state. It is
the only place points change, and every rule below is a unit test.

### 6.1 Tiles

- **Right:** + the tile's value.
- **Wrong:** 0 by default; − the tile's value if **Wrong answers lose points** is on (default off; the setup screen
  explains "On, like the TV show. Off is kinder for children").
- Each team can be marked once per clue. A clue closes for scoring once a team is right; the host can still show the
  answer.
- Scores are whole numbers and may go below zero only through a penalty or a Daily Double. A negative score is shown
  with a minus sign and the word "minus" for screen readers, never by colour alone.

### 6.2 Correcting mistakes

- **Undo** (button in the game menu, key **Z**): reverses the last scoring action, steal, Daily Double bet, tile
  opening or Final mark, one at a time, back to the start of the game. The history is part of the saved game (7.1).
- **Adjust a score:** click a team's score to get −100 / +100 buttons and a box to type an exact score (for a ruling
  the host makes, "we'll accept that"). Adjustments are actions too, so they can be undone.
- **Reopen a tile:** an emptied tile can be reopened from the game menu ("Replay a tile") if it was closed by mistake;
  undo is usually simpler.

### 6.3 Daily Double

1. When the hidden tile is opened, a full-screen **"Daily Double"** card appears for the choosing team (no clue yet).
2. **Bet:** from 0 up to the team's score or 500 (the board's top value), whichever is larger — the television rule,
   scaled to our values, so a team at zero can still bet 500. Quick buttons **Half**, **All** and **500**, or type a
   number; the box refuses anything outside the range and says why.
3. The clue appears; only that team answers. **Right:** + the bet. **Wrong:** − the bet (the bet is what makes it a
   Daily Double, so this applies even when ordinary penalties are off; the setup screen says so). No steals.
4. The turn then passes as for any tile.

### 6.4 Final question

1. **Category screen:** "Final question: The parables". Every team **writes its bet on paper** (the projector cannot
   hide a bet). Teams at zero or below write 0: they still answer, for the fun of it, but cannot change their score
   (the television show would leave them out; a church night should not).
2. **Clue screen** with a 30-second timer (on by default here, as on television; the host can pause it).
   Teams write their answers.
3. **Show answer.** Then, for each team in turn, the host types the team's **bet** (0 to its score, refused outside
   that) and clicks **Right** or **Wrong**. Scores update one team at a time, lowest score first, for suspense.
4. **Results.**

### 6.5 Timer (optional)

Off by default for tiles; 15, 20 or 30 seconds if switched on. A bar drains across the top of the clue; when it ends it
turns to "Time" and nothing else happens — the host still decides. No sound in this version (the show's music is
copyrighted, and a sound the leader did not expect is worse than none). The timer pauses while the window is hidden.

### 6.6 End and ties

- **Results** rank teams by score; equal scores share a place ("1st — Team 1 and Team 3, 1,200").
- **Tie for first:** a **Tie-breaker** button deals one more question (a hard one, or medium for children, from a
  category not used tonight); the first tied team marked right wins. Optional: the host may just leave the tie.
- **End early:** the game menu's **End game** goes to the Final (if on) or Results, leaving unplayed tiles; the host is
  asked to confirm.

---

## 7. Saving

### 7.1 The game in progress

The whole game (settings, teams, board tiles with their question copies, scores, history for undo, whose turn, which
screen) is saved in `localStorage` under one key, `bible-jeopardy:game`, after every action. Opening /games/jeopardy
with a saved unfinished game offers **Carry on** (with team names, scores and tiles left) or **New game**. A saved game
older than 7 days is offered too, with its date. A damaged or foreign record is ignored and removed, never crashes the
page. If storage is unavailable (private mode, full), the game plays normally and the setup screen notes it will not
survive a reload.

Only one game is kept. Two tabs: the most recent writer wins; the other tab, on its next action, sees a newer save
from another tab and says "This game is open in another tab", with **Use this tab** (as verse completion's tab
take-over does).

### 7.2 The board link

**Copy board link** puts the prepared board in the address, so it can be prepared on one device and opened on another:

`/games/jeopardy?board=<version>.<language>.<settings>.<ids>`

- `settings`: column count, difficulty, choices on/off, children, catechism, testament, Daily Double position, Final
  on/off — a few letters and digits.
- `ids`: each tile's 16-character question id from `questionId`, column by column, plus the categories and the Final's
  id. A full six-column board is about 31 × 17 + 100 ≈ 650 characters, well inside every browser's address limit.
- **Teams are not in the link** (they are set on the night).
- Opening it loads the bank, finds each id, and shows the preview with **Use this board**. An id that is no longer in
  the bank (the bank was updated) is redrawn for the same category and level, and the preview lists how many tiles
  changed ("2 questions are no longer in the bank and were replaced"). A board made in another site language is
  redrawn with the same categories, as ids are computed from the question's own text, and the preview says so.
- A malformed link is ignored with a notice, and setup opens normally.

---

## 8. Not repeating questions

The browser keeps the ids of the last **1,500** questions shown on finished or abandoned boards (`bible-jeopardy:seen`,
newest last). Board generation avoids them (3.4 step 2), so a church using one laptop sees fresh clues week after week:
the adult pool would take about 500 boards of 25 to exhaust. A **Forget played questions** link on the setup screen
clears the list. A link-loaded board does not check this list (it is the leader's chosen board).

---

## 9. Screens

All screens live inside the game page at /games/jeopardy, under the site header and footer until **Start game**; the
board, clue and result screens are the **stage**, which goes full-screen. Layout targets: 1280 × 720 (16:9 projector)
and 1024 × 768 (4:3), readable from the back of a hall; setup and preview also work on a phone.

### 9.1 Setup

One page, three short sections, with a **Build board** button:

- **Teams:** how many (2–6 stepper), each name with its dice button, starting team (Team 1 / Random).
- **Board:** categories (**Surprise me** / **Choose categories** — the picker of 3.2 opens in a panel), columns
  (3–6, with the rough length), difficulty (Gentle / Standard / Challenging), *For children* (forces Gentle and shows
  choices), *Show the four choices*, testament (Both / Old / New), *Include catechism questions*.
- **Rules:** who answers (Take turns / Buzz in, each with a one-line explanation), *Wrong answers lose points*,
  *Daily Double*, *Final question*, timer (Off / 15 / 20 / 30 s).

Settings are remembered for next time (`bible-jeopardy:settings`), team names too. A **How to play** link opens the
rules (9.8).

### 9.2 Preview

The board as it will look, columns with category titles and one-line descriptions, tiles showing values only. Under
each column **Swap** and **New questions**; above, **New board**, **Print host sheet**, **Copy board link**,
**Back to setup**, and the primary **Start game**. If a category was dropped or levels fell back, a one-line notice
says so.

### 9.3 Board (stage)

- **Top:** the category titles, one per column, centred, up to three lines; the font shrinks for long titles
  (longest today is 30 characters, "Pentecost and the first church").
- **Grid:** 5 rows of value tiles. Open tiles show the value large (about 7% of the screen height); played tiles are
  empty and darker. The keyboard focus ring is thick and visible from the back.
- **Bottom bar:** the scoreboard — each team's number, name, colour and score; the team to choose is raised and
  labelled "to choose". A small menu button (☰) holds Undo, Print host sheet, Replay a tile, Adjust scores, Full
  screen, How to play and End game.
- **Colours:** the site's own palette in its current light or dark theme, with the game's art colour (the "prophets"
  tone) for tiles, never the television show's blue and gold. The stage meets WCAG AA contrast in both themes, and a
  **Stage: light / dark** switch in the menu overrides the site theme for a washed-out projector.

### 9.4 Clue

Category and value at the top; the clue centred in very large type, sized by its length (up to 80 characters about 6%
of the screen height, up to 140 about 5%, longer about 4%), never cut off; a two-part question's lead-in in smaller
type above it; the four choices (A–D) in a 2 × 2 grid when shown. The timer bar if on. Along the bottom, the team
buttons, each with **✓ Right** and **✗ Wrong** (the choosing team's first in *Take turns*), and **Show answer**.

### 9.5 Answer

The answer large, the verse (5.3), who scored ("Team 2 +300", or "No points"), and **Back to board**.

### 9.6 Daily Double and Final

- **Daily Double card:** the words "Daily Double", the team's name, the bet box with Half / All / 500, **Show clue**.
- **Final:** category card with the instruction to write bets on paper; clue with its timer; answer; then the
  marking panel — each team's row with a bet box, ✓ and ✗ — revealed one team at a time from the lowest score.

### 9.7 Results

Teams in rank order on a simple podium for the top three (no confetti video; a short rise with `prefers-reduced-motion`
respected), the final scores, and: **Tie-breaker** (if needed), **Play again** (same teams and settings, a new board
avoiding tonight's questions) and **New game** (back to setup). A line links to the study test page for anyone who
wants to keep going alone.

### 9.8 How to play

A short panel (also printable) with the rules as configured: choosing, answering, steals, penalties, Daily Double and
Final, plus the keyboard keys.

### 9.9 Loading and failure

While the bank loads (about 17 MB uncompressed in English, already split in parts for the release), setup shows its
controls with the category counts as placeholders, and **Build board** waits. If the bank fails to load: "The questions
could not be loaded" with **Try again**. If the verse text fails, the answer screen shows the reference alone.

### 9.10 Keyboard and clicker

| Key | Board | Clue | Answer |
|---|---|---|---|
| Arrows | move between tiles | — | — |
| Enter | open tile | — | back to board |
| Space | open tile | show answer | back to board |
| 1–6 | — | team right | — |
| Shift + 1–6 | — | team wrong | — |
| Esc | leave full screen | back to board (only before anyone is marked; afterwards it is the same as Enter on the answer) | back to board |
| Z | undo | undo | undo |
| F | full screen | full screen | full screen |

Presentation clickers send Page Down / Page Up: **Page Down** acts as Space (open, show answer, back to board, in
order), **Page Up** as Esc. Keys with Ctrl, Alt or Meta are ignored, so browser shortcuts still work. Number keys are
ignored while a text box has focus.

### 9.11 Hub entry

In [registry.ts](../../../src/pages/games/registry.ts), the existing entry becomes live:
`slug: "jeopardy", status: "live", load: () => import("./jeopardy/JeopardyGame")`, keeping its title, description,
audiences (church night, youth group), shelf and art line unchanged. The page title follows the other games:
"Bible Jeopardy · Games · Bible Guide".

---

## 10. Files (for the implementation step)

New folder `src/pages/games/jeopardy/`; nothing else is created outside it.

| File | What it holds |
|---|---|
| `JeopardyGame.tsx` | Default export loaded by the hub: loads the bank, reads a saved game or a board link, switches between the screens. |
| `Setup.tsx`, `CategoryPicker.tsx` | 9.1 and the category picker of 3.2. |
| `Preview.tsx` | 9.2. |
| `Stage.tsx`, `Board.tsx`, `Scoreboard.tsx`, `ClueScreen.tsx`, `AnswerScreen.tsx`, `DailyDouble.tsx`, `FinalRound.tsx`, `Results.tsx` | The stage and its screens (9.3–9.7). |
| `HostSheet.tsx`, `HowToPlay.tsx` | 5.4 and 9.8; both print with a print stylesheet. |
| `categories.ts` | Category list from themes and books, candidates, offered/greyed, the surprise rule (3.2, 3.5). |
| `generate.ts` | The ladder, filling, Daily Double and Final placement, swaps, redraws (3.3–3.7), with a seedable random function. |
| `rules.ts` | The pure reducer: turns, steals, scoring, bets, Final, undo, adjustments (5.5, 6). |
| `keys.ts` | Key → action mapping (9.10). |
| `storage.ts` | Saved game, settings and seen list, with validation (7.1, 8). |
| `link.ts` | Board link encode/decode and validation (7.2). |
| `jeopardy.css` | Stage, sizes, print styles. |
| Tests | `generate.test.ts`, `categories.test.ts`, `rules.test.ts`, `storage.test.ts`, `link.test.ts`, `keys.test.ts`, `JeopardyGame.test.tsx` (13). |

**Shared code is imported, never edited:** [pick.ts](../../../src/lib/live-quiz/pick.ts) and [names.ts](../../../src/lib/live-quiz/names.ts) from the live quiz,
[themes.ts](../../../src/pages/questions/test/themes.ts) and `VerseWords` from the test page, `loadQuestionBank` from [data.ts](../../../src/lib/data.ts). The only shared
file changed is the registry entry (9.11). Each file stays under 500 lines (the workspace code standard).

---

## 11. Cost

- **Running cost: $0.** Everything runs in the browser from files the site already serves (the question bank, the BSB
  chapter files). No server code, no Durable Object, no database, no new dependency, no external service.
- **One-time cost: $0.** No generation: the categories, levels, children's wording and verse links already exist.
- **No external dependency.** If the site's static files load, the game works; once loaded, a game survives the hall's
  Wi-Fi dropping (only the verse text on the answer screen needs the network, and it falls back to the reference).

---

## 12. Out of scope for the first version (possible later)

- **Phone buzzers** using the live quiz's room server (teams buzz on a phone; the first buzz is highlighted).
- **Presenter window**: a second browser window on an extended display, showing the answer and controls to the host
  only, kept in step with the projector window (same-browser messaging, no server).
- **A doubled second round** ("Double Jeopardy").
- **Custom questions** typed by the leader, and **saved named boards**.
- **Sound effects.**

---

## 13. Tests (Vitest, so they run in `npm test`)

- **`generate.test.ts`** (with a seeded random function and a small fixture bank): five rows per column with values
  100–500; each column's levels never fall as the value rises; the Standard ladder is exact when the fixture allows;
  fallbacks take the nearest level; no question appears twice on a board or as both a tile and the Final; scarce
  columns fill first (a small category wedged against a big overlapping one keeps its questions); recently seen ids are
  avoided until the pool runs short; the Daily Double lands only in rows 300–500 and its distribution over many seeds
  roughly matches 1 : 2 : 2; swapping a column keeps every other tile; the same seed gives the same board.
- **`categories.test.ts`**: at most one theme per group and the shelf spread in Surprise me; categories with fewer than
  8 candidates are not offered; the testament filter; the open-answer rule drops "Which of these … NOT" clues only when
  choices are hidden; catechism off by default; children's wording used when asked for. Plus one test **against the
  real bank on disk**: with default settings at least 50 themes are offered, and 200 random Standard boards of six
  columns fill without falling short.
- **`rules.test.ts`**: every row of 5.5 and 6 — right/wrong with penalties off and on; one mark per team per clue;
  steals at full value; next chooser in both modes and the host override; Daily Double bet limits (0, score, 500 when
  the score is lower, refused above), right and wrong (penalised even with penalties off); Final bets 0..score, teams at
  or below zero bet 0; tie-breaker; undo of each kind of action, repeatedly, back to the start; score adjustment.
- **`storage.test.ts`**: a damaged, partial, wrong-typed or foreign saved game is dropped; settings and the seen list
  round-trip; the seen list keeps the newest 1,500; storage that throws leaves the game playable.
- **`link.test.ts`**: encode → decode gives the same board; a missing id is redrawn for the same category and level
  and counted; a link in another language redraws with the same categories; malformed links are refused.
- **`keys.test.ts`**: the table of 9.10, including clicker keys, modifier keys ignored and keys ignored in text boxes.
- **`JeopardyGame.test.tsx`** (fixture bank, stubbed verse loading): set up three teams, build and preview a board,
  start, play a right answer, a wrong answer and a steal, a Daily Double and the Final, undo once, reload mid-game and
  carry on, and reach Results with the right ranking.
- **The hub's** [games.test.tsx](../../../src/pages/games/games.test.tsx) needs no change: it counts live games from the registry.
- The implementation step runs the site's tests and build, including the build's English-translation check (14).

---

## 14. Accessibility and language

- **Screen readers:** the board is a grid with column headers (category names) and cells announced as "Moses, 300,
  open" or "played"; the clue screen's text is a heading-and-paragraph pair; score changes are announced once through a
  polite live region ("Team 2, plus 300, now 900").
- **Not colour alone:** teams have numbers as well as colours; played tiles are empty, not just darker; right and wrong
  have symbols and words.
- **Keyboard:** everything works without a mouse (9.10); focus returns to the opened tile's position after each clue.
- **Motion:** with `prefers-reduced-motion`, tiles do not zoom open and the podium does not rise.
- **Zoom:** setup and preview survive 200% zoom; the stage scales with the screen rather than with zoom, and its text
  never drops below the sizes in 9.3–9.4.
- **Translation:** all on-screen English is written for the site's translation collector
  ([content/translation/README.md](../../../content/translation/README.md)); sentences with values ("{team}, plus {points}") are
  single texts with placeholders, at most three values each; no hand-made plurals; numbers through the site's
  formatters; the `document.title` rule the other games use, so the build's English check passes. Clues and answers
  come from the translated bank in the leader's language; theme titles are the same strings the test page shows, so they are translated wherever the test
  page's are. The verse is always the BSB, in English, as on the test page.

---

## 15. Edge cases

| Case | What happens |
|---|---|
| Filters leave too few categories for the chosen column count | The board is built with what there is (at least 3); the preview says how many and suggests widening (catechism, testament, children). Fewer than 3: **Build board** is disabled with the reason. |
| A category's questions are all recently played | Recently played ones are used, oldest first (3.4); the seen list is not an obstacle to a full board. |
| The same question belongs to two categories on the board | It is used once; the scarcer column took it first (3.4). |
| Children's mode, a column cannot reach medium | Nearest level (easy) is used and the column is still sorted; the 1-in-90 rate measured in 2.2. |
| A question has no verse link | The answer screen shows the reference text only; nothing breaks. |
| A reference is a long list (up to 1,679 characters in the bank) | Trimmed to 160 characters by `trimReference`. |
| Two-part question (115 adult) | The lead-in (its question and answer) shows above the clue in smaller type, as on the test page and the live quiz. |
| The host marks the wrong team | **Undo**, or adjust the score. |
| The host opens the wrong tile | Esc before anyone is marked returns it to the board unplayed. |
| All teams are wrong | Show answer; no points (or penalties if on); the turn passes as 5.5 says. |
| Daily Double opened by a team at zero or below | Bet up to 500 (the top value), as on television. |
| A team at zero or below at the Final | Plays for fun with a bet of 0 (6.4). |
| Every team at zero or below at the Final | The Final is still played for fun; all bets are 0. |
| Ties | Shared place; optional tie-breaker (6.6). |
| Browser reloads, laptop sleeps, tab closed | The saved game offers **Carry on** with everything, including undo history (7.1). |
| Projector at 1024 × 768 or a small TV | Grid and type scale to the stage; six columns at 4:3 wrap long titles to three lines. |
| Full screen refused (some browsers in kiosk mode) | The game plays in the page; the menu's Full screen shows "Use your browser's full-screen key (F11)". |
| Site language changed mid-game | The game keeps the clues it saved (the board stores its own copies); new boards use the new language. |
| Bank updated between preparing a link and using it | Missing ids redrawn and counted (7.2). |
| Storage full or blocked | Plays without saving; setup says so. |
| Very long team name | Limited to 16 characters by the shared name check; long names are shortened with "…" on the scoreboard and shown whole in Results. |
| A team name the filter blocks | Refused with the live quiz's message; the dice offers a friendly name. |
| Six teams on a phone-width setup screen | Setup is a single column; the stage is meant for a wide screen and says "Best on a laptop or TV" under 600 px wide. |
| A clue's wording points elsewhere ("this passage") | Already excluded by the live quiz's `isPlayable`. |
| Catechism on, mixed congregation | Opt-in only; the setting's line says catechism answers follow one church tradition. |

---

## Sources

Read 2026-11-09.

- Factile, features and buzzer pages — playfactile.com/features, playfactile.com/features/virtual-buzzer
- JeopardyLabs, "About" and FAQ (keyboard, teams, buzzers) — jeopardylabs.com/about
- Jeopardy! rules summaries (Daily Double and Final wagers, negative scores): makemyjeopardy.com/guides/jeopardy-rules,
  gameshows.com/jeopardy/how-to-play, triviabliss.com/jeopardy-rules, playfactile.com/blog/how-to-play-jeopardy-complete-game-rules-explained
- Church and Sunday-school guides: mybiblesong.com/bible-jeopardy-game-with-pdf, biblethought.org/bible-jeopardy,
  sundayschoolnetwork.com/jeopardy.html, mashupmath.com/bible-jeopardy, young-catholics.com (reusable youth-ministry
  Jeopardy), biblevise.com (Bible games for teens and youth groups)
- Comparisons of game makers: soonlab.ai/blog/top-jeopardy-game-maker (2026), apptraitsolutions.com (2024)
- This site: [live quiz design](../live-quiz/design.md) (pool rules and question selection reused),
  [verse completion design](../verse-completion/design.md) (saving, tab take-over, translation rules),
  [games hub design](../games-hub/design.md) (registry and art).
