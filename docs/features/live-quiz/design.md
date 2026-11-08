# Live Quiz for youth groups — design

**Status:** reviewed (2026-11-07). Written by the research-and-design step, then reviewed once against the spec, the
shared rules and the real codebase; the corrections are applied in the body below and listed in the **Review** section
at the end. The build step follows.
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
4. **Answers on the phone show their text**, not just shapes (our options are long — median 24 characters, 1 in 20 over
   68, longest 157 — and unreadable from the back of a hall). The question text on phones is a leader setting, on by default.
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
2. Leave out the questions whose wording points outside themselves ("this passage", "the following", "in this
   story" and similar — a fixed phrase list in `pick.ts`; the three phrases above match 13 questions today), any whose
   options say "all of the above" / "none of the above" (none today, but the rule protects option shuffling), and the
   15 two-part questions whose lead-in (question + answer) is over 400 characters — too long to read off a projector
   in the read window, and over the room's size limit (6.1). This is a small pure filter with a test.
3. Draw N at random without repeats (N = 10, 15, 20 or 30; default 15). **Mixed** level orders the draw easy →
   medium → hard so the game warms up.
4. Shuffle each question's four options (the bank already varies the right answer's position; shuffling again stops
   kids memorising "it's always B" from earlier games) and record the right option's new index. With **For children**
   on, a question that has `child` wording uses its `child.question`, `child.options` and `child.answer` instead
   (all 716 have exactly four options, the answer always among them).
5. Trim the `reference` string to 160 characters (ending "…") before it goes into the room: most are short (99% under
   73 characters) but 42 are long lists of references, up to 1,679 characters. The `link` (book, chapter, verse) is
   sent as is.
6. **Play again** in the same room draws from the pool minus questions already used in that room (the room keeps the
   used ids, so this survives a leader reload).

If the filters leave fewer questions than N, the setup screen says so ("Only 7 questions match — play 7, or widen the
filters") and offers to play what there is; with fewer than 3 the Create button is disabled.

Questions need a **stable id** for "already used" tracking and for the leader page to find its own copy of a question
after a reload. The bank has no id field; use a short hash of `collection + question + answer` computed in the browser.
(8 question texts repeat; `collection + question` alone still collides once — two catechism questions both reading
"What are they?" — while adding the answer makes all 14,916 unique, measured 2026-11-07.)

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
| **Read** | Question number, question text large, a draining bar | "Question 3 of 15 — read it on the screen" (+ the question text if that setting is on) | Read time: 2 s + 40 ms per character of the question (lead-in included), clamped to 3–7 s, or 3–12 s when there is a lead-in. Pause holds it; Next skips it |
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
| Names | Players type a name / Name picker only | Players type (Name picker only is automatically suggested when "For children" is on — children then never type a name, the safeguard Kahoot recommends) |
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

1. **Code** — six-digit field, numeric keypad (`inputmode="numeric"`, `autocomplete="off"`, so phones neither offer
   saved values nor treat it as a text-message login code), Join.
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

The /games hub now exists in the working tree ([registry.ts](../../../src/pages/games/registry.ts), its
[README.md](../../../src/pages/games/README.md) and [GamesPage.tsx](../../../src/pages/games/GamesPage.tsx); checked
2026-11-07 during the review). Its registry **already has a `live-quiz` entry** with `status: "coming-soon"`, title
"Live youth-group quiz", audiences youth group and church night. Going live is a one-entry change, following the README:

```ts
{
  slug: "live-quiz", status: "live", load: () => import("./live-quiz/LiveQuizGame"),
  title: "Live youth-group quiz",
  description: "The leader puts the game on a screen and everyone answers on their phones, from thousands of questions.",
  audiences: ["youth-group", "church-night"],
},
```

`GamesPage` then serves the leader page at `/games/live-quiz` by itself — **no route for it in `src/App.tsx`**. The game
page is drawn inside the site's normal header and footer; the leader's Fullscreen control (3.2) puts the game area
alone on the projector. Keep the existing description (it is already within the README's 140-character limit).

The player page is the one exception to the README's "a game never touches the router": `/play` deliberately sits
outside `/games/…` (5.2), so it needs its own two `<Route>` lines in `src/App.tsx`, lazy-loaded like every other page.

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
stable id, text, optional lead-in, four options, right index, reference and verse link, at most 30 questions. The room
validates their shape and lengths and keeps them: question ≤ 300 characters (longest in the bank: 224), each option ≤ 200
(longest: 157), exactly 4 options, right index 0–3, lead-in question + answer ≤ 400 (longer ones never enter the pool,
2.1), reference ≤ 160 (trimmed in 2.1), link book code ≤ 8 characters with whole-number chapter and verse, id ≤ 16
characters. Worst case that is about 1.7 KB per question and about 51 KB for 30, so the create request body is capped at
64 KB. The server never needs the 17 MB bank.

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
| `src/lib/live-quiz/room-core.ts` | Everything the room object does that is not Cloudflare-specific — load/save through a small `RoomStorage` interface, token-hash checks, routing a socket's message to the engine, turning the engine's output into per-socket sends through a `RoomSockets` interface, computing the next alarm. Unit-tested with in-memory fakes. |
| `server/live-quiz/room.ts` | The Durable Object class `LiveQuizRoom` (`extends DurableObject` from `cloudflare:workers`): adapts `ctx.storage`, `ctx.acceptWebSocket` / `getWebSockets` / attachments and `setAlarm` to `room-core`'s interfaces, and nothing else. A few dozen lines; holds no rules of its own. |
| `functions/api/live-quiz/[[path]].ts` | Routes `POST /api/live-quiz/rooms` (create, picks a free code) and `GET /api/live-quiz/rooms/:code` (exists / locked / full) and the socket upgrade `GET /api/live-quiz/rooms/:code/socket` to the room's object. Declares its own `LiveQuizEnv` type for the binding rather than editing shared types. |
| `src/pages/games/live-quiz/…` | `LiveQuizGame.tsx` (the leader page, default export, loaded by the hub registry), `PlayPage.tsx` (the player page for `/play`), their components, CSS, and a `useRoomSocket` hook (connect, reconnect with backoff, server-time offset). |
| Shared-file entries | the hub registry entry going live (5.3); the `/play` and `/play/:code` routes in [src/App.tsx](../../../src/App.tsx) (no `/games/live-quiz` route — the hub serves it); `"/api/live-quiz/*"` added to the `include` list in [public/_routes.json](../../../public/_routes.json) (the release's `run_worker_first` list is built from it); in [scripts/prepare-testimonies-release.ts](../../../scripts/prepare-testimonies-release.ts) the generated `wrangler.jsonc` gains `durable_objects: { bindings: [{ name: "LIVE_QUIZ", class_name: "LiveQuizRoom" }] }` and `migrations: [{ tag: "live-quiz-v1", new_sqlite_classes: ["LiveQuizRoom"] }]`, and the same script bundles `server/live-quiz/room.ts` with its `src/lib/live-quiz/` imports into one file, `worker/live-quiz-room.mjs`, using the esbuild already installed (0.25.12; `cloudflare:workers` marked external); [server/site-worker.mjs](../../../server/site-worker.mjs) gains one line, `export { LiveQuizRoom } from "./live-quiz-room.mjs";`; the privacy page's one sentence (6.8). Each is an added line or entry — the other chains are editing some of the same files in parallel. |

**Rules for the shared code in `src/lib/live-quiz/`** (it is compiled three ways: into the browser bundle, by
`wrangler pages functions build`, and into the room bundle): relative imports only — the `@/` alias exists only in the
Vite and app TypeScript configs, not in [tsconfig.worker.json](../../../tsconfig.worker.json) or the worker builds — and
no DOM, React or browser-only APIs (the worker typecheck uses `lib: ["ES2023"]` and no DOM types).

**Why not copy `room.ts` into the release as it is:** the release's `site-worker.mjs` sits in a separate release folder;
a copied `room.ts` would still import `../../src/lib/live-quiz/…`, which does not exist there. Bundling it to one file
first avoids that.

**The release path:** Durable Object classes can only be defined by a Worker, not by a Cloudflare Pages project, so this
game needs the Workers release (`scripts/deploy-worker.mjs`, which runs `wrangler deploy` and applies the migration) —
the path the site already uses. Also, [server/site-worker.mjs](../../../server/site-worker.mjs) refuses every non-GET
`/api/` request on the temporary `*.workers.dev` address (to protect the shared testimonies database); creating a room is
a POST, so on that test address room creation fails unless `/api/live-quiz/` is exempted from that check. The room
touches no database, so exempting it is safe; the build step should add that exemption next to the check.

The release changes are written but **not run** — the rules say never deploy.

### 6.4 Local development

The dev server (Vite on port 8930, started by "Start site.cmd") has no Workers runtime. Add:

- `wrangler.live-quiz.jsonc` — a dev-only config whose `main` is a tiny dev worker exporting `LiveQuizRoom` and routing
  `/api/live-quiz/*` to it, with the Durable Object binding and migration.
- script `"live-quiz:dev": "wrangler dev -c wrangler.live-quiz.jsonc --ip 127.0.0.1 --port 8928"` (Miniflare runs
  Durable Objects, alarms and hibernation locally — no Cloudflare account or cost). **Not 8932**: the site's browser
  checks already start their own preview there (comment at the top of [vite.config.ts](../../../vite.config.ts)), and
  8930–8947 are mostly taken by other local tools; 8928 is unused by anything in the site. It is a back-end port only,
  never opened in a browser, so it does not break the AGENTS.md rule against new preview addresses.
- in [vite.config.ts](../../../vite.config.ts) the same proxy entry in **both** `server` and `preview`:
  `proxy: { "/api/live-quiz": { target: "http://127.0.0.1:8928", ws: true } }`. The `preview` one matters: the owner's
  one preview address, 8931, is `vite preview` started from this same config by `scripts/start-preview.mjs`.

If the leader page cannot reach the API locally it says so plainly ("The live-game server isn't running on this PC —
run `bun run live-quiz:dev`") rather than a generic error. To try it with real phones on the same Wi-Fi, the dev server
would need to listen on the LAN address; that is a manual step for the owner, not a default.

### 6.5 Messages (JSON over the socket)

Every message has a `t` (type). The server validates every incoming message against `protocol.ts` and drops anything
malformed or too large with an `error` reply. Size limits: **1 KB** for any player message, **4 KB** for leader
messages, except the leader's `again {questions}`, which carries a fresh list of up to 30 questions and may be up to
**64 KB** (the same limit as the create request, 6.1).

**Flood guard:** every incoming message is billed (20 count as one request, 8.1), so a socket that sends more than 20
messages in any 10 seconds is closed with "Too many messages"; a phone's normal traffic is one answer per question.
A closed phone can reconnect and rejoin as itself.

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
- Keys: `room` (settings, phase, question list, current index, deadlines, locked flag, ids of questions already used
  in this room, removed player ids, leader token hash) written on phase changes; `p:<playerId>` (name, token hash, score, streak, current answer, answer times) written on join and
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
| Leader's laptop reloads or crashes | The page finds `{code, token}` in `localStorage` and resumes the same room in its current phase. The reveal's verse block is drawn from the room's own copy of each question (reference and `link`), with the bank's book names once the bank has reloaded, so it does not depend on the leader's earlier in-memory draw. While no leader is connected, timers already running still finish (a question still closes on time), but the game **never advances past a reveal** without the leader; phones show "Waiting for the leader". |
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
| Removed player tries again | The room remembers removed player ids and refuses their token, and the phone keeps a "removed from game <code>" mark in `localStorage`, so the same phone can't simply rejoin that room. (A determined kid can clear storage and join under a new name; the leader can remove again and lock the room. There is no device identity beyond that, by design — no fingerprinting of children's phones.) |
| Random people guessing codes | 900,000 codes, few live rooms, codes die within hours; the leader sees every name and can lock. The join-check endpoint answers only exists/locked/full. Add Cloudflare's rate limiting rule on `/api/live-quiz/*` at release time only if abuse is seen (free rule, no code). |
| Someone scripts room creation | Creating a room needs no account, so it can be automated. An empty room costs about three billed requests and a few row writes, and is wiped after 2 hours without a leader (6.7): on the Paid plan a million requests (the monthly allowance) is roughly 300,000 junk rooms, and past that $0.15 per million. Not worth code now; the same free rate-limiting rule covers it if it happens. |

### 7.3 Content and the bank

| Case | Behaviour |
|---|---|
| Filters match too few questions | Setup says how many match; can play fewer; Create disabled below 3. |
| Question has no verse link (294) | Reveal shows the reference string if there is one, else just the answer. |
| Verse text fails to load | Reveal shows the reference with its link; never blocks the game. |
| Two-part questions (195 with `lead_in`) | Lead-in shown above the question on screen and phone, as the test page does; its characters count towards the read time. The 15 whose lead-in is over 400 characters are left out (2.1). |
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

**Where they go:** the site's vitest only collects `src/**/*.test.{ts,tsx}` ([vitest.config.ts](../../../vitest.config.ts)),
so every test lives under `src/` — `src/lib/live-quiz/*.test.ts` and `src/pages/games/live-quiz/*.test.tsx`. A test
file under `server/` would silently never run. Nothing imports `server/live-quiz/room.ts` in tests (its
`cloudflare:workers` import cannot load in vitest's jsdom); the room's behaviour is tested through `room-core.ts`.

- **Engine (unit, vitest):** scoring formula (instant, half time, buzzer, < 0.5 s, accuracy mode, pause excluded),
  ranking with ties, phase transitions for every leader action including stale/double actions, "everyone answered"
  counting only connected players, late-answer grace, answers to old questions ignored, once-only answers, join rules
  (duplicate, full, locked, removed, late join), clean-up times from `nextWakeAt`.
- **Picking (unit):** pool filters, exclusions (including over-long lead-ins), mixed ordering, option shuffle keeps the
  right answer, children's wording swapped in, reference trimming, too-few handling, stable ids unique across the real
  bank's duplicate texts, no repeats on play again.
- **Protocol (unit):** every validator rejects malformed, oversized (per-message limits in 6.5, create body in 6.1) and
  wrong-phase messages; a 30-question worst-case `again` is accepted; no message to a phone contains `correct` before
  the reveal.
- **Room core (unit, `room-core.ts` with in-memory fake storage and fake sockets):** state survives a simulated
  hibernation (rebuild from storage), alarm drives deadlines, tokens are checked by hash, the flood guard closes a
  spamming socket.
- **Hub (existing):** [games.test.tsx](../../../src/pages/games/games.test.tsx) already checks every registry entry and
  needs no change when this game goes live.
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

---

## Review

**Reviewed 2026-11-07, once, by the review step of the Bible Guide games chain** (orchestrator job
97051f1125ff4c0cb86fc3d7af7ec7d5). Checked against the owner's approved spec (APPROVED-IDEAS.md entry 1), the shared
rules (FEATURE-BUILD-RULES.md), the site's AGENTS.md, and the real code and data in this repository: the question bank
was re-measured, and the hub, router, worker entry point, release script, Vite, vitest and TypeScript configs were read.
Every correction below is already applied in the body above.

**Verdict:** the design is sound and fits the spec — leader-paced, Kahoot-style, phones answer, built on the existing
question bank, no runtime AI, Scripture from the Berean Standard Bible, registered on the /games hub, no deploy. The
choice of one Cloudflare Durable Object per room is right, and the cost figures check out (re-computed: about 188 GB-s
and 85 requests for a 30-player game, so about 2,100 games a month inside the $5 plan's allowance even without
hibernation, about $0.0023 per game beyond it). Six problems would have broken or misled the build; they are fixed.

### Problems that would have broken the build (fixed)

| # | What was wrong | What changed | Where |
|---|---|---|---|
| 1 | The doc said the /games hub did not exist yet and told the build to add a `/games/live-quiz` route in `src/App.tsx`. The hub now exists, already lists this game as "coming soon", and serves every live game's page by itself. A second route would duplicate it and break the README's rule. | Section rewritten: make the existing registry entry live (code given), no `/games/live-quiz` route; only `/play` needs router lines, as a stated exception. File names `LiveQuizGame.tsx` / `PlayPage.tsx` fixed. | 5.3, 6.3 |
| 2 | Every incoming socket message was capped at 4 KB, but "play again" sends up to 30 new questions over the socket (about 50 KB) — it would always have been refused. | Separate limits: 1 KB player, 4 KB leader, 64 KB for "play again" and for room creation. | 6.1, 6.5 |
| 3 | The room's size checks covered only question and option text. The bank has references up to 1,679 characters and two-part lead-ins up to 1,826 — they would either be rejected or pass unchecked. | References trimmed to 160 characters; the 15 questions with lead-ins over 400 characters left out of the pool; every field now has a limit, worst case worked out. | 2.1, 6.1, 7.3 |
| 4 | The release step was told to copy `room.ts` beside the worker's entry file. `room.ts` imports the shared game logic from `src/lib/live-quiz/`, which does not exist in the release folder, so the release build would fail. | Release script bundles the room and its imports into one file with the esbuild already installed; the worker entry re-exports it in one line. | 6.3 |
| 5 | Room tests were planned beside `server/live-quiz/room.ts`, but the site's test runner only collects tests under `src/`, and `room.ts` imports a Cloudflare-only module the test runner cannot load. Those tests would never run. | Room logic moved into `src/lib/live-quiz/room-core.ts` behind small storage/socket interfaces and tested there; `room.ts` becomes a thin adapter; test locations spelled out. | 6.3, 9 |
| 6 | The local game server was put on port 8932, which the site's browser checks already use for their own preview. | Moved to 8928 (unused by anything in the site), bound to 127.0.0.1, back-end only. | 6.4 |

### Smaller corrections (fixed)

- **Owner's only preview (8931) would not have reached the game server**: the proxy was only on the dev server. It now goes in both the `server` and `preview` blocks of vite.config.ts, since 8931 is `vite preview` from the same config. (6.4)
- **Shared code compiled three ways**: added the rule that `src/lib/live-quiz/` uses relative imports only and no browser-only APIs — the worker builds and worker typecheck know neither the `@/` alias nor DOM types. (6.3)
- **Test address would refuse room creation**: the worker blocks every non-GET `/api/` call on `*.workers.dev`; noted that `/api/live-quiz/` needs exempting (it touches no database). Also noted that Durable Objects need the Workers release path, not Pages — which is already the site's path. (6.3)
- **Stable question id collided**: `collection + question` repeats once in the real bank (two catechism questions "What are they?"); now `collection + question + answer`, measured unique across all 14,916. (2.1)
- **"Play again" memory lost on a leader reload**: the used-question list moved from the leader's browser into the room's storage, with the removed-player list. (2.1, 6.7)
- **Leader reload and the verse block**: the reveal now draws on the room's copy of each question's reference and link, not on the leader's lost in-memory draw. (7.1)
- **Children's wording**: spelled out that "For children" swaps in the 716 questions' child wording, options and answer (all verified four options with the answer among them). (2.1)
- **Read time with a lead-in**: lead-in characters now count, with a 12-second ceiling instead of 7 when there is one; Pause holds and Next skips. (3.1, 7.3)
- **Children's names**: "Name picker only" is suggested automatically when "For children" is on, so children don't type names. (3.3)
- **Message flood guard**: incoming messages are billed, so a socket sending more than 20 messages in 10 seconds is closed. (6.5)
- **Scripted room creation**: added the edge case with its cost bound (about 300,000 junk rooms per million requests); no code needed now. (7.2)
- **Removed players**: the doc mentioned a "device token" that the design never defines. Now: the room refuses the removed player's token and the phone keeps a "removed" mark; no device fingerprinting of children's phones. (7.2)
- **Code field**: `autocomplete="one-time-code" off` was contradictory; now `autocomplete="off"`. (5.2)
- **Measurements corrected**: option length is median 24 characters, 1 in 20 over 68, longest 157 (was "median 29, 1 in 20 over 79"); the "28 questions pointing outside themselves" figure could not be reproduced from the phrases given (they match 13), so the doc now names a phrase list and leaves the count to the build. (1.3, 2.1)

### Checked and left as written

- **The spec's "~5,000 questions"**: the bank has grown to 14,916, all with exactly four options and the right answer always among them (re-measured). Using the whole bank, filtered by the leader, keeps the owner's intent; the default kinds (Bible quiz + Sunday school) still give 13,135, and 5,071 of those suit children.
- **Kinds, levels, children's flag, links, standalone and lead-in counts, question lengths** in section 2: all re-measured and correct.
- **Cloudflare pricing and the Free/Paid inference** in section 8: arithmetic re-done and correct; the owner should still confirm the plan in the Cloudflare dashboard before release.
- **Scripture**: the reveal uses the test page's existing Berean Standard Bible verse block (`loadChapterPlain("bsb", …)`), as the rules require.
- **Shared files**: every touch outside this feature's folder is a one-line or one-entry addition (registry, router, routes list, release script, worker entry, Vite proxy, package script, privacy sentence), as the parallel-chains rule asks.
