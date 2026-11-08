# Live Quiz for youth groups — design

**Status:** draft from the research-and-design step (2026-11-07). One review and then the build follow as separate steps.
**Spec (owner-approved, binding):** APPROVED-IDEAS.md entry 1 — "Kahoot-style: leader shows the game on a screen, kids answer on their phones. Uses the existing ~5,000 multiple-choice questions."
**Shared rules:** FEATURE-BUILD-RULES.md (Jarvis/Projects/BibleProject/) — no runtime LLM cost, reuse site data, Berean Standard Bible for Scripture, register on the /games hub, touch only this feature's files plus its registry/nav entry, add tests, never deploy.
**Slug:** `live-quiz`.

In one paragraph: the leader opens **/games/live-quiz** on a laptop plugged into a projector or TV, picks what the
quiz covers, and gets a six-digit join code and a QR code. Kids open **bibleguide.io/play** on their phones (or scan
the QR), type the code and a name, and appear on the big screen. Each question shows on the screen; the four answers
show on every phone as big coloured buttons; faster right answers score more; after each question the screen shows the
right answer with its verse from the Berean Standard Bible, then a leaderboard; the game ends on a podium. A
Cloudflare Durable Object (a tiny single-room server that Cloudflare runs on demand) holds each room and talks to every
screen and phone over WebSockets. No account, no app install, no AI at runtime, and no new paid service.

---

## 1. Research: how comparable games work

### 1.1 The general-purpose leaders

| Game | Pacing | Join | What matters for us |
|---|---|---|---|
| **Kahoot!** | Leader-paced: everyone sees the same question at once, the leader advances | 6–7 digit PIN at kahoot.it, or QR | The model the owner named. Phones show only coloured shapes by default (question on the big screen); an option shows text on phones. Scoring formula is public (below). Lobby music, friendly-nickname generator, kick by clicking a name, lock the room. **Free plan now caps a game at 10 players** (down from 20); 50+ players needs a paid plan from about $19/month. |
| **Quizizz (now Wayground)** | Student-paced: each player moves through questions on their own phone | Code | Good for homework, weaker as a shared "room moment". Not what the spec asks for. |
| **Blooket / Gimkit** | Mostly self-paced, game-first (tower defence, in-game currency) | Code | Lots of engagement, but the quiz is secondary and sessions run longer. Too much for a first version. |
| **Mentimeter / Slido** | Leader-paced polls and quizzes | Code + QR | Same transport shape as Kahoot; confirms the six-digit-code-plus-QR pattern is now standard. |

Kahoot's published Classic scoring (support.kahoot.com, "How points work"):

`points = round(1000 × (1 − (responseTime ÷ questionTimer) ÷ 2))` for a right answer, 0 for a wrong one.
So a right answer is worth between 500 (at the buzzer) and 1000 (instant); an answer under 0.5 s gets the full 1000.
Kahoot used to add an **answer-streak bonus** (+100 per consecutive right answer, capped at +500); its help centre now
says streaks are shown but **add no points**. Kahoot also has an "Accuracy" mode where speed does not count.

Kahoot safety features worth copying (support.kahoot.com, "Live game settings", "How to handle inappropriate nicknames"):
lock the room once everyone is in; click a name to remove that player; a friendly nickname generator (adjective +
animal, three spins) so children never type a name; an automatic nickname filter; "2-step join" against bots.

### 1.2 Bible-specific competitors

| Product | Notes |
|---|---|
| **Bible Trivia Live** (bibletrivialive.com) | Free, browser-only, PIN or QR, display name, 10 questions, live leaderboard. Closest direct competitor. |
| **Bible Live Quiz: Group Trivia** (iOS/Android) | Kahoot-style for churches, questions on the TV, phones answer by room code/QR; monetised by in-app purchase. |
| **Kerygma** (kerygma.one) | 5-character room code, built for 8–14 players. |
| **TriviaMaker** "Bible Jeopardy – Youth Edition" | General quiz maker with a ready Bible game; 6-digit code or QR, no login. |
| **Bible Match** (iOS) | 2–5 players only. |

**What we have that they don't:** a 14,916-question bank (all with four options, rated easy/medium/hard, flagged for
children, tagged by book, testament and topic), Scripture in the Berean Standard Bible already on the site, and no
player cap or paywall. The reveal screen can show the actual verse — a teaching moment, which is what a youth leader
actually wants out of a quiz night.

### 1.3 Decisions taken from the research

1. **Leader-paced, Kahoot Classic flow** — that is what the spec names, and it is the shared-room moment youth groups want.
2. **Six-digit numeric code + QR**, typed on a numeric keypad. Industry standard; easy to read off a projector.
3. **Kahoot's scoring formula** (500–1000 for a right answer), **streak shown but worth no points** (keeps comebacks
   possible), and an **"accuracy only" setting** for leaders who don't want speed pressure on younger kids.
4. **Answers on the phone show their text**, not just shapes (our options are long — median 29 characters, 1 in 20 over
   79 — and unreadable from the back of a hall). The question text on phones is a leader setting, on by default.
5. **Kahoot's safety set**: lock room, remove player, friendly-name generator, name filter.
6. **No player paywall.** Cap at 100 players per room (see 7.2), which covers any youth group.

---

## 2. Data sources (all already on the site)

| Need | Source | Facts measured on 2026-11-07 |
|---|---|---|
| Questions | The question bank, `data/questions/bank.json`, read with `loadQuestionBank()` in [src/lib/data.ts](../../../src/lib/data.ts) (type `BankQuestion`) | **14,916 questions, every one with exactly 4 options** (the spec's "~5,000" is out of date — the bank has grown). Kinds: 8,801 trivia, 4,334 Sunday-school lesson, 1,781 catechism. Levels: 4,734 easy / 6,655 medium / 3,527 hard. 5,838 flagged suitable for children 6–11; 716 have special child wording. 14,672 read on their own (`standalone`); 195 have a two-part lead-in. The right option is always among the four (`answer_choice ?? answer`, helper `rightChoice`). Question length: median 77 characters, 95th percentile 133, max 224. |
| Filters the leader picks from | The study test page's ready-made pieces in [src/pages/questions/test/](../../../src/pages/questions/test/): themes ([themes.ts](../../../src/pages/questions/test/themes.ts)), level and children's settings ([settings.ts](../../../src/pages/questions/test/settings.ts)), the filter model ([model.ts](../../../src/pages/questions/model.ts)) | Reuse as-is: same pool rule as the test page (`standalone` or has a `lead_in`), same level/children filter, same topic/testament/book facets. |
| Verse on the reveal screen | `VerseWords` / `loadWords` in [parts.tsx](../../../src/pages/questions/test/parts.tsx) — up to three verses from the BSB via `loadChapterPlain("bsb", …)`, cut at 260 letters, linked to the reader | 14,622 questions carry a `link` to a verse; 294 have none (the reveal then shows only the reference text, or nothing). |
| Translations | `data/i18n/{ar,es,hi,id,pt,zh,…}/questions/bank.json`, chosen automatically by `loadQuestionBank()` from the leader's language | The room carries the leader's question text, so phones see the leader's language. |
| QR code | `qrcode` 1.5.4, already a dependency in package.json | No new package. |

**No generation step is needed.** Nothing is produced by a model, at build time or at runtime. The friendly names
(section 6.3) are a short fixed word list written by hand into the code.

### 2.1 Which questions go into a game

From the bank, in the leader's browser:

1. Pool = questions that read on their own (`standalone`, or have a `lead_in`, shown above the question exactly as the
   test page does), filtered by the leader's choices: **Kinds** (default: Bible quiz + Sunday school; catechism is
   opt-in because catechism answers are tradition-specific — Lutheran, Reformed — and a mixed youth group may not share
   one), **Level** (Easy / Medium / Hard / Mixed), **For children** (only `children: true`, with the `child` wording
   where it exists), and optionally a **theme, testament or book**.
2. Leave out the 28 questions whose wording points outside themselves ("this passage", "the following", "in this
   story") and any whose options say "all of the above" / "none of the above" (none today, but the rule protects
   option shuffling). This is a small pure filter with a test.
3. Draw N at random without repeats (N = 10, 15, 20 or 30; default 15). **Mixed** level orders the draw easy →
   medium → hard so the game warms up.
4. Shuffle each question's four options (the bank already varies the right answer's position; shuffling again stops
   kids memorising "it's always B" from earlier games) and record the right option's new index.
5. **Play again** in the same room draws from the pool minus questions already used in that room (kept in the leader's
   browser for the room's life).

If the filters leave fewer questions than N, the setup screen says so ("Only 7 questions match — play 7, or widen the
filters") and offers to play what there is; with fewer than 3 the Create button is disabled.

Questions need a **stable id** for "already used" tracking. The bank has no id field; use a short hash of
`collection + question` computed in the browser (8 duplicate question texts exist; the collection makes them unique).

---

## 3. Game flow

### 3.1 Phases (one room)

```
create → LOBBY ──start──▶ READ ──(read time)──▶ ANSWER ──(timer ends / everyone answered / leader skips)──▶ REVEAL
                                                                                                          │
           ┌──────────────────────────────────── next ◀── LEADERBOARD ◀──next (or auto after 8 s)─────────┘
           ▼
     (last question) ──▶ PODIUM ──"play again"──▶ LOBBY (same players, scores reset)   or   "end" ──▶ ENDED
```

| Phase | Big screen | Phones | Ends when |
|---|---|---|---|
| **Lobby** | Join code, address, QR, names appearing, player count, Start, Lock | "You're in — look for your name on the screen" | Leader presses Start (needs ≥ 1 player) |
| **Read** | Question number, question text large, a draining bar | "Question 3 of 15 — read it on the screen" (+ the question text if that setting is on) | Read time: 2 s + 40 ms per character of the question, clamped to 3–7 s |
| **Answer** | Question, the four options with colour + shape + letter, countdown, "18 of 24 answered" | Four big buttons (colour, shape, letter, option text), countdown | Timer (10 / 20 / 30 s, default 20) runs out, **or** every connected player has answered, **or** the leader presses Skip |
| **Reveal** | Right option highlighted, a bar per option with how many chose it, the reference and BSB verse text with a link | Big ✓ or ✗, "+850", streak flame if ≥ 2, "You're 4th" | Leader presses Next (or 8 s later if Auto-advance is on) |
| **Leaderboard** | Top 5 with rise/fall arrows, "and 19 others" | Own rank and "120 points behind Sam" | Leader presses Next (or 6 s with Auto-advance). Skipped after the last question. |
| **Podium** | 3rd, 2nd, 1st revealed in turn; then a full ranked list; buttons Play again / End | Final rank and score, "Thanks for playing", a link to read more on the site | Leader chooses Play again or End |

Answering is **once per question**: the first tap locks in (as in Kahoot). A phone that taps after the deadline gets
"Time's up" and no points.

### 3.2 Leader controls (always on screen, keyboard-friendly for a clicker)

Start · Next (Space / → / Page Down, which most presentation clickers send) · Skip (close answers now) · Pause/Resume
the timer (for "wait, the projector died") · Lock / Unlock joining · Remove player (click a name; in the lobby and
from the player list during the game) · End game · Fullscreen · Sound on/off.

### 3.3 Settings at room creation

| Setting | Choices | Default |
|---|---|---|
| Questions | 10 / 15 / 20 / 30 | 15 |
| Time per question | 10 / 20 / 30 s | 20 s (30 s automatically suggested when "For children" is on) |
| Kinds | Bible quiz, Sunday school, Catechism | Bible quiz + Sunday school |
| Level | Easy / Medium / Hard / Mixed | Mixed |
| For children (6–11) | on / off | off |
| Theme / testament / book | any of the test page's themes, OT/NT, a book | none |
| Scoring | Speed counts (500–1000) / Accuracy only (1000 per right answer) | Speed counts |
| Names | Players type a name / Name picker only | Players type |
| Question text on phones | on / off | on |
| Auto-advance | on / off | off |

All settings except the questions themselves can be changed in the lobby before Start.

---

## 4. Scoring

- **Right answer, speed counts:** `round(1000 × (1 − (t ÷ T) ÷ 2))`, where `t` is seconds from the moment the options
  opened (**server clock**) to the moment the server received the answer, clamped to `[0, T]`, and `T` is the timer.
  `t < 0.5 s` → 1000. Range 500–1000.
- **Right answer, accuracy only:** 1000.
- **Wrong or no answer:** 0. Never negative (children's game).
- **Streak:** consecutive right answers are counted and shown (flame and number on the phone, flame next to the name on
  the leaderboard) but **add no points**, following Kahoot's current rule — a kid who misses question 1 can still win.
- **Pause** stops the clock: paused time is not counted in `t`.
- **Ranking:** by score, highest first. Equal scores **share a rank** ("=3rd"); display order among them is by the
  smaller total answer time on right answers, then by name.
- **Latency fairness:** timing on the server means a slow phone network costs a little time (typically 50–200 ms ≈ 2–5
  points on a 20 s question). That is acceptable and cannot be gamed, unlike a phone reporting its own time. The server
  accepts answers until **250 ms after** the official deadline to absorb that network delay.

---

## 5. Screens

Visual language: the site's existing tokens and category colours (Tailwind, CSS variables); the four answer colours
must each pass contrast with white text and be told apart by **shape and letter** too (colour-blind safe):
A ▲, B ◆, C ●, D ■. Text inside answer buttons uses `dir="auto"` so Arabic and other right-to-left questions lay out
correctly.

### 5.1 Leader (laptop on a projector) — route `/games/live-quiz`

1. **Setup** — title, one-line explanation ("Show this screen on a projector; players join on their phones — no app"),
   the settings in section 3.3 with the live count of matching questions, and **Create room**. While the question bank
   loads, a quiet loading line; if it fails, the site's normal error message with Retry.
2. **Lobby** — designed to be read from 10 m away: the code very large (`482 913`, grouped 3+3), "Go to
   **bibleguide.io/play**", the QR code (links to `/play/482913`), player names flowing in as tiles (click to remove),
   count "24 players", **Start**, **Lock**, settings gear.
3. **Read** — question number and text only, large, with a draining bar.
4. **Answer** — question at top, four answer tiles in a 2×2 grid (colour, shape, letter, text), big countdown, answered
   counter.
5. **Reveal** — wrong tiles dimmed, right tile marked ✓, per-option counts as bars, then the verse block:
   the reference and up to three verses of BSB text (the test page's `VerseWords`), and Next.
6. **Leaderboard** — top 5 rows with score and movement arrows.
7. **Podium** — 3rd, 2nd, 1st appear one after another, then the full list (rows, not cards; long lists follow the site
   rule of rendering about 50 rows either side of the visible area — irrelevant at ≤ 100 players but use the same list
   component), **Play again** and **End**.
8. **Ended / room expired** — "This game has ended" with a link back to setup.

Laptop-only: below 900 px wide, the setup page warns "The leader screen is made for a laptop on a projector" but still
works (a leader may test on a tablet).

### 5.2 Player (phone) — routes `/play` and `/play/:code`

`/play` is a short, memorable address deliberately outside `/games/…` so it can be read off a projector and typed with
one thumb. The route chunk must stay small (no question bank, no heavy libraries): phones download only the page and
receive questions over the socket.

1. **Code** — six-digit field, numeric keypad (`inputmode="numeric"`, `autocomplete="one-time-code"` off), Join.
   Prefilled and skipped when arriving from the QR link.
2. **Name** — text field (max 16 characters), or, in "Name picker only" rooms, a generated two-word name with
   "Spin again" (three spins) and **This is me**.
3. **Waiting** — "You're in, *Gentle Dove*! Look for your name on the screen."
4. **Read** — "Question 3 of 15" and, if the setting is on, the question text.
5. **Answer** — the four buttons filling the screen (each at least 64 px tall, text wraps; long options shrink to a
   minimum readable size), countdown bar. Optional short vibration when the options open (where supported and not
   reduced-motion).
6. **Locked in** — "Answer locked in" with the chosen colour.
7. **Result** — ✓/✗, points gained, streak, rank and gap to the next player up.
8. **Final** — rank, score, "Read the verses from tonight" (a list linking each question's verse in the reader).
9. **States** — Reconnecting… (with spinner), Removed by the leader, Room locked, Room full, Room not found / ended,
   Waiting for the leader (when the leader's screen is disconnected).

Keep the screen awake during a game with the Screen Wake Lock API where available (and re-request it after the tab
returns to the foreground).

### 5.3 Hub registration

The game registers itself in the /games hub registry (`src/pages/games/registry.ts`, documented in the README beside
it) with its title, one-line description ("Kahoot-style quiz for youth groups: the leader shows it on a screen, players
answer on their phones"), route `/games/live-quiz`, and status switched from "coming soon" to live. **Note for the build
step:** on 2026-11-07 the hub (built by the job that created it, "job 714") was **not yet in the source tree** —
`src/pages/games/` does not exist. If it still doesn't exist when the build starts, add only this game's routes and
leave the registry entry to be added as soon as the hub lands (do not build a competing hub).

---

## 6. Technical approach

### 6.1 Where things run

```
Leader laptop (React page)                   Cloudflare                              Phones (React page)
  - loads the question bank                    Worker (existing site worker)            - /play, tiny bundle
  - picks + shuffles questions   ──POST──▶      /api/live-quiz/rooms  ──▶  Durable Object "LiveQuizRoom"
  - shows screens               ◀══WS══▶      /api/live-quiz/rooms/:code/socket ═══▶   (one per room code)  ◀══WS══▶ answer buttons
```

**Server-authoritative room.** The Durable Object owns the room's truth: phase, timers, players, answers, scores.
Screens and phones are views of it. That way a leader's laptop can reload, or a phone can drop off Wi-Fi, and rejoin the
exact same game; scores use one clock (the server's); and the right answer is **never sent to phones before the
reveal**.

The leader's browser picks the questions (it already has the bank loaded) and sends them to the room when creating it:
text, four options, right index, reference and verse link, at most 30 questions. The room validates their shape and
lengths (question ≤ 400 characters, options ≤ 200, exactly 4 options, right index 0–3) and keeps them. The server never
needs the 17 MB bank.

### 6.2 Why a Durable Object, and the alternatives rejected

| Option | Verdict |
|---|---|
| **Durable Object + WebSockets with the Hibernation API** | **Chosen.** One object per room is exactly the "single room server" this needs; Cloudflare routes every phone of a room to the same object; WebSockets give instant pushes; hibernation means an idle room (leader talking about the verse for three minutes) costs nothing; the site already runs on Cloudflare Workers, so it is the same account, bill and deploy. Works on the free plan too. |
| Durable Object + polling or Server-Sent Events | More requests, laggier, and SSE connections cannot hibernate. No benefit. |
| D1 database polled by phones | ~1 request per phone per second: 30 phones × 25 min ≈ 45,000 requests per game, plus write races on answers. No. |
| Workers KV | Changes can take up to 60 s to be seen everywhere. Unusable for a live game. |
| Peer-to-peer WebRTC with the leader's laptop as host | Still needs a signalling server, often a paid relay (TURN) on church/school Wi-Fi, and a leader reload ends the game. No. |
| Hosted realtime service (Ably, Pusher, Firebase) | New external account, keys and vendor dependency for something Cloudflare already does; free tiers cap connections. Fails the owner's cost-and-dependency rule for no gain. |
| `partyserver` (Cloudflare's open-source PartyKit successor, a thin wrapper over Durable Objects) | Would save perhaps 100 lines but adds a dependency; plain Durable Objects are enough. Kept as a fallback if the hand-written socket handling proves fiddly. |

### 6.3 Code layout (new files only, plus small entries in shared files)

| File | What it is |
|---|---|
| `src/lib/live-quiz/protocol.ts` | Message types shared by server and browser, plus validators for every incoming message. |
| `src/lib/live-quiz/engine.ts` | **Pure game logic, no I/O**: `applyHostAction`, `applyPlayerMessage`, `onDeadline`, `score`, `rank`, `nextWakeAt`, name rules. Every rule in sections 3, 4 and 7 lives here and is unit-tested. |
| `src/lib/live-quiz/names.ts` | Friendly-name word lists (e.g. Brave/Gentle/Joyful/Faithful… × Lion/Dove/Lamb/Cedar/Eagle/Sparrow…), a small block-list for typed names, normalisation. |
| `src/lib/live-quiz/pick.ts` | Question selection from section 2.1 (pool, exclusions, draw, mixed ordering, option shuffle, stable id). |
| `server/live-quiz/room.ts` | The Durable Object class `LiveQuizRoom`: socket accept/close, storage load/save, alarm → `engine.onDeadline`, fan-out of the engine's outgoing messages. Thin; holds no rules of its own. |
| `functions/api/live-quiz/[[path]].ts` | Routes `POST /api/live-quiz/rooms` (create, picks a free code) and `GET /api/live-quiz/rooms/:code` (exists / locked / full) and the socket upgrade `GET /api/live-quiz/rooms/:code/socket` to the room's object. Declares its own `LiveQuizEnv` type for the binding rather than editing shared types. |
| `src/pages/games/live-quiz/…` | Leader page, player page, their components, CSS, and a `useRoomSocket` hook (connect, reconnect with backoff, server-time offset). |
| Shared-file entries | the hub registry entry; two routes (`/games/live-quiz`, `/play[/:code]`) in [src/App.tsx](../../../src/App.tsx); `"/api/live-quiz/*"` added to the `include` list in [public/_routes.json](../../../public/_routes.json) (the release's `run_worker_first` list is built from it); in [scripts/prepare-testimonies-release.ts](../../../scripts/prepare-testimonies-release.ts) the generated `wrangler.jsonc` gains `durable_objects: { bindings: [{ name: "LIVE_QUIZ", class_name: "LiveQuizRoom" }] }` and `migrations: [{ tag: "live-quiz-v1", new_sqlite_classes: ["LiveQuizRoom"] }]`; [server/site-worker.mjs](../../../server/site-worker.mjs) re-exports `LiveQuizRoom` (the release copy must carry `room.ts` beside it so wrangler bundles it). |

The release changes are written but **not run** — the rules say never deploy.

### 6.4 Local development

The dev server (Vite on port 8930, started by "Start site.cmd") has no Workers runtime. Add:

- `wrangler.live-quiz.jsonc` — a dev-only config whose `main` is a tiny dev worker exporting `LiveQuizRoom` and routing
  `/api/live-quiz/*` to it, with the Durable Object binding and migration.
- script `"live-quiz:dev": "wrangler dev -c wrangler.live-quiz.jsonc --port 8932"` (Miniflare runs Durable Objects,
  alarms and hibernation locally — no Cloudflare account or cost).
- in [vite.config.ts](../../../vite.config.ts) a dev-server proxy: `"/api/live-quiz": { target: "http://127.0.0.1:8932", ws: true }`.

If the leader page cannot reach the API locally it says so plainly ("The live-game server isn't running on this PC —
run `bun run live-quiz:dev`") rather than a generic error. To try it with real phones on the same Wi-Fi, the dev server
would need to listen on the LAN address; that is a manual step for the owner, not a default.

### 6.5 Messages (JSON over the socket)

Every message has a `t` (type). The server validates every incoming message against `protocol.ts` and drops anything
malformed or too large (> 4 KB) with an `error` reply.

**First message on every socket** authenticates (never put tokens in the URL, where they end up in logs):
- leader: `{t:"host", token}`
- new player: `{t:"join", name}` → server replies `{t:"joined", playerId, token, name}`; the phone keeps `{code, playerId, token}` in `localStorage` for the room's life
- returning player: `{t:"rejoin", playerId, token}`

**Leader → server:** `start`, `next`, `skip`, `pause`, `resume`, `lock {locked}`, `kick {playerId}`, `settings {…}`
(lobby only), `again {questions}`, `end`.

**Player → server:** `answer {index, choice}` — `index` is the question number, so a late answer to an old question is
recognised and ignored.

**Server → everyone:** `state {…}` — a full snapshot of what that viewer may see, sent on every (re)connect and every
phase change, with `serverNow` so each device can correct its countdown for clock skew. Phase payloads carry
`opensAt` / `closesAt` as server timestamps. Phones **never** receive `correct` before the reveal snapshot.
**Server → leader only:** `players` (list changes), `answered {count, of}`.
**Server → each phone only:** its own result in the reveal (`you: {choice, right, points, streak, score, rank, gapAbove}`),
`kicked`, `ended`.

Outgoing messages are free on Cloudflare, so personal per-phone messages cost nothing extra.

### 6.6 Room code and tokens

- **Code:** six digits, 100000–999999, from `crypto.getRandomValues`. The create endpoint asks the object named
  `room:<code>` to claim itself; if that room is already live it tries another code (up to 5 tries, then a clear
  error). With few live rooms among 900,000 codes, a clash is very rare.
- **Leader token:** 32 random bytes (base64url), returned once by the create call, kept in the leader's `localStorage`
  keyed by code; the room stores only its SHA-256 hash. Only a socket that proves the token can control the game.
- **Player token:** same scheme per player, so a dropped phone can rejoin as itself and nobody else can take its place.
- Each socket's role and player id travel in its hibernation attachment (`serializeAttachment`), so they survive the
  object sleeping.

### 6.7 Storage, timers, clean-up

- In memory while awake; **written through** to the object's SQLite-backed storage on every change, because a
  hibernating object loses its memory and is rebuilt from storage when the next message or alarm wakes it
  (`blockConcurrencyWhile` loads it in the constructor).
- Keys: `room` (settings, phase, question list, current index, deadlines, used-locked flags, leader token hash) written
  on phase changes; `p:<playerId>` (name, token hash, score, streak, current answer, answer times) written on join and
  each answer. About 500 row writes in a 30-player, 15-question game.
- **One alarm** per object, always set to the engine's `nextWakeAt`: the end of the current read or answer window, the
  auto-advance moment, or the clean-up time.
- **Clean-up:** a room is wiped (`storage.deleteAll()`) 1 hour after its podium/end, after 2 hours with no leader
  connected, or 6 hours after creation, whichever comes first. Nothing about players outlives the room.

### 6.8 Privacy

No accounts, no email, no tracking. A player's name exists only inside the room and is deleted with it. Nothing is
logged except Cloudflare's normal request logs (which carry no tokens because tokens are sent inside the socket). The
site's privacy page gets one sentence: "Live quiz rooms keep players' chosen names only for the game, and delete
them within a few hours."

---

## 7. Edge cases and how each is handled

### 7.1 Connections

| Case | Behaviour |
|---|---|
| Phone locks its screen / switches app / loses Wi-Fi | The socket drops. On return (`visibilitychange`, `online`) the hook reconnects with backoff (0.5 s, 1, 2, 4, max 8 s), sends `rejoin`, receives the current `state`. The player keeps their score; questions they missed score 0. Shown as "Reconnecting…". The leader's tile for that player greys out while disconnected. |
| Leader's laptop reloads or crashes | The page finds `{code, token}` in `localStorage` and resumes the same room in its current phase. While no leader is connected, timers already running still finish (a question still closes on time), but the game **never advances past a reveal** without the leader; phones show "Waiting for the leader". |
| Leader never comes back | Room wiped after 2 hours without a leader (6.7). |
| "Everyone answered" with disconnected players | Counts only connected players, so one dead phone can't hold up the question. |
| A player answers twice (double tap, or two tabs) | The first answer stands; later ones are ignored. Two tabs with the same token: the newer socket replaces the older one (the older gets "Opened on another tab"). |
| Answer arrives after the deadline | Accepted up to 250 ms late (network grace), otherwise "Time's up", 0 points. |
| Answer for an old question (delayed packet) | Ignored: its `index` does not match the current question. |
| Clock skew on devices | Countdowns use `serverNow` offset from each `state`; scoring never uses device clocks. |
| Code update deployed mid-game | Cloudflare disconnects sockets; everyone reconnects to the same object with state intact from storage. |
| Weak church Wi-Fi | Messages are tiny (< 2 KB). Phones can use mobile data instead; nothing requires the same network. |

### 7.2 Joining

| Case | Behaviour |
|---|---|
| Wrong code / room ended | "No game with that code — check the screen." |
| Room locked | "This game is locked. Ask the leader to unlock it." |
| Room full (100 players) | "This game is full." 100 keeps the lobby legible on a projector and fan-out trivially cheap; raise later if asked. |
| Joining after the game started | Allowed (unless locked); joins with 0 points from the next question. Kahoot allows the same. |
| Duplicate name | Case-insensitive; the phone is asked to pick another ("Sam is taken — try Sam B"). |
| Rude or invisible names | Trimmed, Unicode-normalised, control and zero-width characters removed, 1–16 characters. A short block-list rejects obvious words ("Please choose another name"). The real safeguards are **Remove player** and **Name picker only** — no list catches everything, and the doc should not pretend otherwise. |
| Removed player tries again | The room remembers removed player ids and their device token; the same phone can't rejoin that room. (A determined kid can clear storage; the leader can lock the room.) |
| Random people guessing codes | 900,000 codes, few live rooms, codes die within hours; the leader sees every name and can lock. The join-check endpoint answers only exists/locked/full. Add Cloudflare's rate limiting rule on `/api/live-quiz/*` at release time only if abuse is seen (free rule, no code). |

### 7.3 Content and the bank

| Case | Behaviour |
|---|---|
| Filters match too few questions | Setup says how many match; can play fewer; Create disabled below 3. |
| Question has no verse link (294) | Reveal shows the reference string if there is one, else just the answer. |
| Verse text fails to load | Reveal shows the reference with its link; never blocks the game. |
| Two-part questions (195 with `lead_in`) | Lead-in shown above the question on screen and phone, as the test page does. |
| Long question or option | Screen text scales down to a minimum; phone buttons wrap; validator caps lengths. |
| Leader's language is not English | Questions come from that language's bank; phone UI uses the site's own language handling; answer text `dir="auto"`. |
| Leader sends edited question text | Possible (the leader's browser builds the list), but it only reaches the leader's own invited players, who are already in the room listening to that leader. Shape and length validation applies; no HTML is ever rendered from messages (React text only). |

### 7.4 Game control

| Case | Behaviour |
|---|---|
| Start with zero players | Start disabled until one player is in. |
| Every player leaves mid-game | Game continues; leader can End. |
| Leader presses Next twice quickly | Each action names the phase it was pressed in; a stale one is ignored, so a double press never skips a question. |
| Pause during Answer | Timer and alarm stop; remaining time is stored; Resume restarts both. Answers are refused while paused. |
| Ties on the podium | Shared rank and equal podium height; order by total answer time, then name. |
| Play again | Same room and players, scores and streaks reset, new questions drawn from those not yet used. |
| Browser without WebSockets / very old phone | Effectively none today; the join page shows "This browser can't join live games" if `WebSocket` is missing. |
| Two leaders in the same room | The leader token is single-holder: a second leader socket with the token replaces the first (the first sees "Opened on another screen"). |

---

## 8. Cost

### 8.1 Cloudflare pricing (developers.cloudflare.com, Durable Objects pricing, read 2026-11-07)

| | Workers Free | Workers Paid ($5/month) |
|---|---|---|
| Durable Object requests (each connection, alarm and HTTP call; **incoming WebSocket messages count 20 to 1**; outgoing messages free) | 100,000 / day | 1 million / month included, then $0.15 per million |
| Duration (memory × time awake; **hibernating sockets are not billed**) | 13,000 GB-s / day | 400,000 GB-s / month included, then $12.50 per million GB-s |
| SQLite rows written | 100,000 / day | 50 million / month included, then $1.00 per million |
| SQLite storage | 5 GB | 5 GB-month included |

On the Free plan, going over a daily limit makes further calls **fail** until midnight UTC (no surprise bill).

### 8.2 One typical game: 30 players, 15 questions, about 25 minutes

| Item | Amount |
|---|---|
| Requests | 31 socket connections + ~650 incoming messages (joins, 15 answers each, leader clicks, some reconnects) ÷ 20 ≈ 33 + ~20 alarms + 1 create ≈ **85 requests** |
| Duration, worst case (object never hibernates) | 128 MB × 1,500 s = **188 GB-s**; with hibernation during reveals and talk, realistically well under half that |
| Rows written | **~500**, all deleted when the room is wiped |
| Leader's download | the question bank once (it is already what the Questions page downloads); phones download only the small /play page |

### 8.3 What that means

- **Most likely cost: $0 extra.** The release notes in AGENTS.md describe a 100,000-file limit for the site's Worker,
  which is the Workers **Paid** figure (Free allows 20,000 files), so the account appears to already pay the $5/month
  plan. Its included allowance covers about **2,100 games a month even if rooms never hibernate**, and far more with
  hibernation (requests alone would cover ~11,000 games). *The owner should confirm the plan in the Cloudflare
  dashboard.*
- **Beyond the allowance:** about **$0.0023 per game** in the worst case — e.g. 10,000 games in one month ≈ $18.
- **On the Free plan:** about 69 worst-case games a day before new rooms fail until midnight UTC; no charge.
- **One-time cost:** none. No model calls, no generation, no new service.

```
COST/DEPENDENCY GATE (to be approved by the owner at release, not at build):
- Action: add a Durable Object class (LiveQuizRoom) to the site's existing Cloudflare Worker.
- Cost: $0 within the plan allowance (~2,100+ games/month on Workers Paid); worst case ~$0.0023 per game above it.
  Recurring only per game played. Nothing is spent by building or testing locally.
- Cloud dependency: yes — Cloudflare Durable Objects, on the account the site already uses. If it is down, live games
  can't start or continue; the rest of the site is unaffected.
- Self-hosted: local development runs fully offline (wrangler dev / Miniflare). Production needs Cloudflare.
- Local/free alternative: none that keeps "phones join from anywhere"; a LAN-only server on the leader's laptop would be
  free but needs installing software at every church — not viable for this audience.
- Reversible: yes. Remove the binding and class (a "deleted_classes" migration); no data or lock-in remains.
```

---

## 9. Tests the build step should add

- **Engine (unit, vitest):** scoring formula (instant, half time, buzzer, < 0.5 s, accuracy mode, pause excluded),
  ranking with ties, phase transitions for every leader action including stale/double actions, "everyone answered"
  counting only connected players, late-answer grace, answers to old questions ignored, once-only answers, join rules
  (duplicate, full, locked, removed, late join), clean-up times from `nextWakeAt`.
- **Picking (unit):** pool filters, exclusions, mixed ordering, option shuffle keeps the right answer, too-few handling,
  stable ids, no repeats on play again.
- **Protocol (unit):** every validator rejects malformed, oversized and wrong-phase messages; no message to a phone
  contains `correct` before the reveal.
- **Room object (unit with a fake storage and fake sockets):** state survives a simulated hibernation (rebuild from
  storage), alarm drives deadlines, tokens are checked by hash.
- **Pages (component):** player screens for each phase render from a `state` snapshot; leader lobby shows code and QR.
- Then the site's own `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`.
- **Manual end-to-end** (recorded in the build step's report): `bun run live-quiz:dev` + the dev server, one leader tab
  and three player tabs (one on a phone-sized viewport), play a full 5-question game, reload the leader mid-question,
  drop and rejoin a player, remove a player, lock the room, play again.

---

## 10. Out of scope for the first version (possible later)

Team mode; custom question sets typed by the leader; a separate "leader remote" on the leader's phone; music beyond
simple generated ticks and chimes; saving results or reports; image questions; double-points questions. Each can be
added on top of this design without changing the room model.

---

## Sources

- Kahoot help centre: "How points work" — https://support.kahoot.com/hc/en-us/articles/115002303908-How-points-work
- Kahoot help centre: "Live game settings" — https://support.kahoot.com/hc/en-us/articles/115016055107-Live-game-settings
- Kahoot help centre: "How to handle inappropriate nicknames" — https://support.kahoot.com/hc/en-us/articles/115002201267-How-to-handle-inappropriate-nicknames
- Kahoot (2016) on the former streak bonus — https://medium.com/inside-kahoot/experimenting-with-answer-streaks-to-help-make-learning-awesome-3b3357e42595
- Kahoot free-plan player limit (third-party, Nov 2026) — https://triviamaker.com/host-kahoot-for-free/ ; https://nibble-app.com/blog/kahoot-cost
- Blooket / Gimkit / Kahoot / Quizizz comparison — https://triviamaker.com/blooket-vs-gimkit-vs-kahoot/ ; https://www.teachfloor.com/blog/blooket-vs-gimkit-vs-kahoot--vs-quizizz
- Bible competitors — https://bibletrivialive.com/ ; https://apps.apple.com/us/app/bible-live-quiz-group-trivia/id6762076569 ; https://kerygma.one/ ; https://triviamaker.com/
- Cloudflare Durable Objects pricing — https://developers.cloudflare.com/durable-objects/platform/pricing/
- Cloudflare Durable Objects WebSockets / Hibernation API — https://developers.cloudflare.com/durable-objects/best-practices/websockets/
