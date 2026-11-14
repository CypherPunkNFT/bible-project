# Team play with phones — design

**Status:** draft for review (2026-11-13).
**Owner's ask (2026-11-13):** games where a laptop is the big screen and each team plays from its own phone, with no
server of our own to run, starting with **Memory card match** and **Map quest**. The owner chose the Cloudflare room
relay (the way the live quiz already works) and chose **not** to build a direct phone-to-laptop link (WebRTC with QR
handshakes) as a fallback: if phones can load bibleguide.io they can reach the relay, and every game's one-screen
mode is the real fallback.

In one paragraph: the leader opens a game on the laptop, picks **Play with team phones**, names two to six teams and
gets a five-digit code and a QR code. One person per team opens **bibleguide.io/team** (or scans the QR) and taps
their team's name. The laptop holds the game exactly as it does today; each phone is that team's controller. In
Memory match the team whose turn it is taps two cards on its phone and they turn on the big screen. In Map quest the
big screen names a place, every team drops a pin on its own phone, and the big screen reveals all pins at once with
the points. A small Cloudflare Durable Object (one tiny room per game code, the same thing the live quiz uses) passes
messages between the laptop and the phones. It knows nothing about either game.

---

## 1. Why a relay that knows no rules

The live quiz's room (src/lib/live-quiz/room-core.ts, engine.ts) holds the quiz's rules on the server. Doing the same
per game means a new server engine for every game. Instead:

- **The laptop is the referee.** It already runs each game's rules (memory-match/game.ts, map-quest/game.ts). Phones
  send *inputs* ("flip card 7", "my pin is here"); the laptop applies them through the same functions a click uses and
  sends each phone the *view* it should show.
- **The room only relays and remembers.** It checks who is who (tokens), forwards inputs to the laptop, forwards each
  view to that team's phone, and keeps the latest view per team so a phone that reconnects sees the right screen at
  once.
- **Any later game** (Jeopardy buzzers, Hot seat, Two truths…) plugs in with no server change: it defines its own
  input and view shapes.

Cheating by a phone is not a concern for a youth-group night; the laptop validates every input anyway (wrong turn,
card already up, place already revealed → ignored).

## 2. The room server

New files, built on the live quiz's proven pattern (a thin Cloudflare adapter over a testable core):

| File | What it holds |
|---|---|
| `src/lib/team-room/protocol.ts` | Message shapes, limits, validators, close codes. Shared by browser and server. |
| `src/lib/team-room/core.ts` | `TeamRoomCore`: create, sign-in, claim, relay, alarm and wipe, over storage and socket interfaces (fakes in tests). |
| `src/lib/team-room/api.ts` | HTTP routes: create, info, socket upgrade. |
| `server/team-room/room.ts` | The Durable Object class `TeamRoom`, adapting Cloudflare's storage, hibernating sockets and alarm to the core. |
| `functions/api/team-room/[[path]].ts` | The release's route into `api.ts`. |

**Routes** (all under `/api/team-room/`):
- `POST rooms` with `{ game: "memory-match" | "map-quest", teams: string[] }` (2–6 names, 1–20 characters each) →
  `{ code, token }`. Code: five digits, 10000–99999, from secure random numbers; five tries for a free one.
- `GET rooms/:code` → `{ exists, game, teams: [{ id, name, taken }] }` for the join page.
- `GET rooms/:code/socket` → WebSocket upgrade into that room's Durable Object.

**Messages over the socket**

| From | Message | Room does |
|---|---|---|
| Laptop | `{ t: "host", token }` | Checks the token's hash; closes any older laptop socket ("opened on another screen"); sends `teams` (who has a phone). |
| Laptop | `{ t: "view", team, view }` (`team`: a team id or `"*"` for all) | Stores it as that team's latest view and forwards `{ t: "view", view }` to that team's phone(s). |
| Laptop | `{ t: "free", team }` | Drops that team's phone (closes it, clears its token) so another phone can take the team. |
| Laptop | `{ t: "end" }` | Closes every socket and wipes the room. |
| Phone | `{ t: "claim", team }` | Gives the phone the team if no *connected* phone holds it; replies `{ t: "claimed", team, token }` and the team's latest view. A team whose phone has dropped can be taken over (dead battery → another phone). |
| Phone | `{ t: "rejoin", team, token }` | Back after a drop or reload: checks the token, re-sends the latest view. |
| Phone | `{ t: "input", data }` | Forwards `{ t: "input", team, data }` to the laptop. Dropped, with `{ t: "host-offline" }` back, if no laptop is connected. |
| Room → all | `{ t: "teams", teams: [{ id, name, online }] }` to the laptop on every change; `{ t: "host", online }` to phones when the laptop drops or returns. |

**Limits:** phone messages ≤ 1 KB, laptop messages ≤ 16 KB; flood limit 20 messages per 10 s for phones and 120 for
the laptop (incoming messages are billed); at most 60 sockets per room. Views are stored under their own key per
team, so no stored value comes near Cloudflare's size limit.

**Lifetime:** the alarm wipes the room 3 hours after its last message, and in any case 12 hours after it was made;
`end` wipes at once. Nothing about a team outlives its room. No names of children are stored beyond team names the
leader typed.

**Tokens:** random 32-byte tokens; only their SHA-256 hash is stored (as the live quiz does). The laptop keeps its
token and the code in sessionStorage so a reload of the big screen rejoins the same room; a phone keeps its team
token in sessionStorage for the same reason.

## 3. The shared browser pieces

| File | What it holds |
|---|---|
| `src/pages/games/team-play/useTeamRoom.ts` | The socket hook: connect, sign in on every (re)connect, back-off reconnects (0.5, 1, 2, 4, 8 s), retry at once when the tab or network returns; final closes stop it. Adapted from the live quiz's `useRoomSocket` (the second copy; extract a shared one if a third appears). |
| `src/pages/games/team-play/host.ts` | `createTeamRoom(game, teams)`, and `useTeamHost(...)`: the laptop's side — team list with online dots, `sendView(team, view)`, `onInput(team, data)`, `free(team)`, `end()`. |
| `src/pages/games/team-play/Lobby.tsx` | The big screen's join panel: QR code (the `qrcode` package the site already has), "bibleguide.io/team · code 48213", each team's name with "phone joined" or "waiting", a **Free** button per team, and **Start**. Also used small, as a "join" strip, during play so a late phone can still join. |
| `src/pages/games/team-play/TeamJoinPage.tsx` | `/team` and `/team/:code`: type the code (number keypad), see the teams, tap yours; then the game's phone screen. "Waiting for the big screen" while the laptop is away. |
| `src/pages/games/team-play/team-play.css` | Their styles, from the games kit's tokens (team tones from `teamTone`). |

Route: `/team` and `/team/:code` in src/App.tsx, beside the live quiz's `/play`. Separate join page so the live quiz's
six-digit `/play` flow is untouched.

## 4. Memory card match with team phones

**Start screen:** under the player count, a choice **"Each team on its own phone"** (shown when 2–4 players are
chosen). Deal → the lobby on the big screen → **Start**.

**Big screen:** today's board, unchanged in look; the track already shows whose turn it is. The board stays
clickable, so the leader can tap for a team whose phone has died. A thin join strip shows the code.

**Phone (the team's controller):** a copy of the grid at the same columns, card faces as the big screen shows them
(face down, face up with their words, or found and tinted in the finder's team tone). On the team's turn: "Your turn
— tap two cards" and the grid is live; otherwise "Team Lions is choosing" and the grid is still.

**Wiring:** the board gets one new optional prop, `remoteFlip: { index, seq } | null`. An input `{ flip: index }` from
the team whose turn it is becomes a `remoteFlip`; the board runs it through the same tap handler a click uses, so the
flip timing, turn-back and hand-over rules stay in one place. After every committed change the laptop sends each team
its view `{ columns, cards: [{ state: "down" | "up" | "found", text?, tone? }], turn, you, names, scores, finished }`
(about 3 KB for the biggest board).

## 5. Map quest with team phones

**Home:** a fourth choice, **"Team game"**: level and era as in practice, team names (2–6), → the lobby → **Start**.
Five places, as a normal round.

**Each place, big screen:** the place's name large, the team chips with a tick as each team pins, a 60-second countdown
(no points off for time in team play; the countdown only ends the place), and **Reveal now**. The place reveals when
every team with a phone has pinned, when the countdown ends, or on **Reveal now**.

**Phone:** the same blank map the game uses (`QuestMap`, same opening view per era), "Drop your pin: Jericho",
**Lock in**. A locked pin can be changed until the reveal.

**Reveal, big screen:** the map draws every team's pin and its line to the place, each in its team tone (`QuestMap`'s
`summary` mode already takes several shapes with their own colours), the place's verse reference, and each team's
distance and points from `scorePin` (no hints, no time penalty). Then a standings list, **Next place**. After five:
the final standings. **Phone after a reveal:** its own distance and points, and the team's place in the standings.

A team that did not pin scores 0 for that place.

## 6. Release wiring (one added line or entry each)

- `server/site-worker.mjs`: `export { TeamRoom } from "./team-room.mjs";` and `/api/team-room/` exempted from the
  workers.dev write block, as the live quiz is.
- `scripts/prepare-testimonies-release.ts`: bundle `server/team-room/room.ts` to `worker/team-room.mjs`; add the
  `TEAM_ROOM` binding and a second migration `{ tag: "team-room-v1", new_sqlite_classes: ["TeamRoom"] }`.
- `public/_routes.json`: `"/api/team-room/*"`.
- Local: the live quiz's dev worker (`npm run live-quiz:dev`, wrangler on 8928) also serves `/api/team-room/`; its
  config gains the binding and migration; `vite.config.ts` proxies `/api/team-room` to 8928 like the quiz.

## 7. Cost and dependency

- Cost: Durable Object requests and time on the Workers Paid plan the site already has. A two-hour game with six team
  phones is a few thousand messages (incoming WebSocket messages count 20 to 1) and hibernates between moves; the
  plan includes 1 million requests and 400,000 GB-s a month. Expected extra cost: **$0**.
- Dependency: Cloudflare, which already serves the whole site. If the room cannot be reached, the leader plays the
  same game on one screen.
- Deploying adds a new Durable Object class to the live Worker. **Deploy only with the owner's yes.**

## 8. Tests

- `core.test.ts` with in-memory fakes: create; host sign-in and replacement; claim, take-over of a dropped team,
  refusal while held; rejoin with good and bad tokens; relay both ways; views remembered and re-sent; host-offline;
  free; end; flood; size limits; the alarm's wipe.
- `api.test.ts`: route shapes, code retries, refusals.
- Memory match: the view builder (`phoneView(game, team)`) and the input filter (wrong team, bad index → ignored).
- Map quest: the team round reducer (pins in, reveal when all pinned, scoring, standings) as pure functions.
- One end-to-end check by hand on the local preview: laptop window plus two phone-sized windows, both games.

## 9. Not in this version

Phone buzzers for Jeopardy and Hot seat (they plug into the same room later); more than one phone per team;
spectator view; sound on phones.

---

## Review (2026-11-13, three reviews: security and correctness, reliability, platform fit)

None found a reason to change the overall approach. These corrections are binding on the build and override the sections above where they differ.

**Room server**
1. **Two phones claiming one team at once:** hash the token first, then check and set the socket's team with no
   `await` in between (as room-core's `join` does). Tested with two claims fired together.
2. **A team stays held by its phone while that phone is away.** iOS and Android drop the socket whenever the screen
   locks, so "taken over when dropped" would let a second team member or a stranger take the team and bounce it.
   A held team is released only by the leader's **Free** or after its phone has been away **2 minutes**. The join
   page shows such a team as "phone away". A refused claim says "This team already has a phone — ask the leader to tap
   Free". A phone whose team was given to another phone gets a final close with that message and goes back to the team
   list. The laptop's team list shows "phone away".
3. **Every view carries `v`**, a number the laptop raises on every change, plus the round (`place` index or board
   `round`); every input echoes the `v` and round it was made on. The laptop ignores an input from an earlier round
   (a pin locked as the leader moved on, a flip queued during a hand-over).
4. **`"*"` views:** one view sent to all teams overwrites every team's stored view; a per-team view overwrites that
   team's. Unknown team ids are refused. On every sign-in the laptop re-sends all views.
5. **Heartbeat:** the room answers `"ping"` with `"pong"` through Cloudflare's automatic response, which does not wake
   the room. The phone pings when its tab becomes visible and after every input, and reconnects if no pong comes
   within 3 seconds, so a dead socket that still reads as open is caught.
6. **Floods:** a phone over its limit has its extra messages dropped quietly, never its socket closed (kids mash). Phones
   send only on a tap or **Lock in**, never while dragging a pin. Countdowns travel as a deadline timestamp, never as
   per-second views.
7. **Alarm:** re-armed at most every 5 minutes, not on every message (each re-arm is a storage write).
8. The QR code and link carry only `/team/<code>`, never the leader's token.

**Memory match**
9. **No `remoteFlip` prop.** The board registers a handle `flipFor(team, index)` on a ref the parent passes. It
   checks the turn and the 420 ms flip lock against the *latest* game, held in a ref. If the lock is still running, it
   retries when the lock ends. A fresh board (New cards) registers a fresh handle, so nothing replays. After every
   input, applied or not, the laptop sends the views again, so a phone never waits on nothing.
10. In team mode the non-pair turns back automatically (the "when I tap" setting would wait for a tap on the laptop).
11. **One view to all teams** (`"*"`): the phone knows its own team id. The grid is checked at 360 px for Hard (6
    columns): the phone shows the board's words small, wrapping, with the card number.
12. Room code, token and team ids are saved with the board in sessionStorage, so a reloaded laptop is still in team
    mode. **New cards** keeps the room; **Quit** ends it; the study screen tells phones "Study the pairs on the big
    screen"; the summary tells phones who won.

**Map quest**
13. **(Critical) A laptop reload must not lose the game.** The team round is saved in sessionStorage on every change:
    the questions, the current place, each team's pin per place, scores, whether the place is revealed, the deadline
    as a clock time, and the room code and token. Team mode is kept out of `?play=`.
14. **Reveal rule:** the place reveals when every team that held a phone when the place started has locked a pin, when
    the countdown ends, or on **Reveal now**. A phone that locks its screen before pinning does not trigger an early
    reveal. Phones re-send a locked pin, tagged with its place, when they hear the big screen is back.
15. **Map colours:** team tones are CSS variables, which the map library cannot read. Resolve them to real colours as
    the solo summary already does (`resolvedBandColor` in words.ts). Give the map an optional pin colour so the solo
    summary keeps its look. Draw the true site or area once, in neutral ink.
16. The laptop mounts a fresh map for each place's reveal, because `QuestMap` reads `summary` once, on mount. The phone
    keeps one ordinary map for the whole game, re-framed per place by its existing reset. If its map cannot start, the
    phone says "The map would not load on this phone — the leader can reveal without your pin" and offers a retry.

**Platform**
17. dev-worker.ts's path check must admit `/api/team-room/`, not just the wrangler settings.
18. `/team` sends a six-digit code on to `/play/<code>` (it is a live quiz code). The live quiz's `/play` is not touched.
19. The quick one-page release script refuses changes under server/ and functions/, so this ships through the full
    release. Deploy only with the owner's yes.

## 10. Owner's changes after the first test (2026-11-13 evening)

The owner, after playing it live: "lets bring the card visuals not these number cards like a calculator button", and
"just two devices and not three ... no options, its either three devices for HDMI or two for direct team to team play".

**One rule covers both setups, with nothing to choose: a team without a phone plays on the screen that started the
game.** Three devices: a laptop on the TV over HDMI, a phone per team. Two devices: one player starts the game on their
own phone or laptop and plays on it; the other joins with a phone. The starting screen already shows the board, so
the second setup needs no new mode.

### 10.1 Memory card match: the phone shows the real cards
- The phone's grid uses the big screen's `Card` (Card.tsx), `CardBack` and `Emblem` (CardArt.tsx) and the card styles in
  memory-match.css. The phone wraps itself in `.mm-page` for the card style settings, with a smaller `--mm-above`
  so the grid fits under the phone's header lines.
- The view gains `version` (the version key, so the phone draws that version's sides) and, per card, `k` (who/story
  kind) **only when the back shows the kind anyway** (Easy and Medium; `typedBacks`). On Hard a face-down card carries
  no kind, and the phone draws every face-down card with the same placeholder kind and the plain back, so nothing
  differs between them on screen or in the page. Face-up cards carry `k` and their words (already shown on the TV).
- Per card, `t` (the pair's colour number, as the board computes it: order of first appearance) for face-up and found
  cards only. A face-down card never carries its pair, colour or words.
- Found cards show as the big screen shows them once they leave: an empty slot ("taken").
- A tapped card shows "sent" until the next view: a new optional `pending` prop on `Card` adds a class
  (`is-pending`, dimmed and slightly pressed). Not your turn: the grid is dimmed and taps do nothing.
- Card ids sent back are still only the card's position and the board's round (unchanged input).

### 10.2 Memory card match: the starting screen plays for teams without a phone
- Today any tap on the starting screen is applied, whoever's turn it is. New: `Board` gets `localTaps` (default
  true). With team phones, the game passes false while the team whose turn it is has a phone joined ("held"):
  taps and keys on that screen then do nothing, and it says "{team} is choosing on their phone." When that team has
  no phone (never joined, away, or freed), the screen takes taps, and says "Your turn, {team}: tap two cards here."
  Phones' taps (the `remote` path) are unchanged.
- The lobby's line becomes "{n} of {n} teams have a phone. Teams without one play on this screen." (shared by both
  games).

### 10.3 Map quest: the starting screen pins for teams without a phone
- `startPlace` expects **every** team (not only those holding a phone). A place reveals early when every team has
  pinned; otherwise at the clock or on Reveal now, as before.
- During a place, the starting screen shows a map for the first team, in team order, that has no phone held and no
  pin yet: "Drop the pin for {team}", a map (the same `QuestMap` the phones use), and Lock in, which calls `addPin`
  for that team. After it, the next such team, if any. Teams with phones pin on their phones as now.
- The pin a team locks on the starting screen is visible to anyone watching that screen until the reveal; with a
  TV that is the room, which is acceptable for a team without a phone.
- The Team game card's line becomes: "For a group: the places show on this screen, and each team drops its pin on
  its own phone, or on this screen if it has none."

### 10.4 Tests
- Phone view: no `k`, `t` or words on face-down cards on Hard; `k` on Easy; `t` and words on face-up ones.
- Board: with `localTaps` false a click does nothing; a remote tap still applies.
- Map quest: `startPlace` expects every team; reveal waits for a team with no phone until it pins or time is up.
- Check on the local servers with a laptop window and one phone window (two devices) and with two phones (three).

### 10.5 Review of section 10 (three reviews, 2026-11-13; these replace the points above where they differ)
1. **"No phone" means `open` only** (never joined, or freed), never `away`: phones go away whenever their screen locks
   (Review 2), and the starting screen must not take a turn from a team whose phone is only asleep. The starting screen
   also plays when **its own connection is down** (its team list is then stale): `localTaps = socket not open || the
   turn's team is open`. An `away` team's turn says "{team}'s phone is away." with a **Free** button beside it; Free (also
   in the strip) is how the leader takes over a stalled phone.
2. **The `localTaps` check sits only where this screen's own taps enter** (a card's click, Enter/Space in `move`, a tap on
   the board between cards), never inside `tap()`, which phones also use. Tested for click and keys.
3. **No pair colour (`t`) in the view**: the board numbers pair colours by first appearance, so `t` would point at a
   face-up card's partner. The phone passes one fixed tone. A found card carries its words and its partner's words
   (both shown on the TV's shelf), so it is read out as "X, matched with Y" and drawn as the empty slot.
4. **The view carries `difficulty`**; the phone wraps its grid in `mm-play is-{difficulty} is-{version}` (text sizes),
   imports memory-match.css, keys the grid by round (New cards deals again), keeps a card's words for the turn-back
   (CLOSE_MS) so a non-pair turns back instead of snapping, drops the lift shadow in its grid, and sets `--mm-above`
   to about 10.5rem with smaller Hard text; Hard may scroll a little.
5. **`Card` takes `kind` instead of the whole card** (it reads only the kind), and one optional `hold?: "sent" | "wait"`
   that adds a class and `aria-disabled`: "sent" for the tapped card, "wait" for every card when it is not this team's
   turn. Face-down Hard cards all get one fixed placeholder kind.
6. **Map quest pins on the starting screen** (for `open` teams, or any team while its connection is down): the leader
   picks the team from pills (default the first that has not pinned); the choice stays until Lock in; the map is keyed
   by place and team so no pin carries over; Lock in pins for the team and place shown, through `roundRef` (set at
   once, as the phone path does, so two pins at the same moment both stay); refused if that team's phone is now held.
   Last pin wins. The map has the phone's "Try the map again". The place screen moves into its own `PlaceScreen` and
   `ScreenPin` (the TeamGame function is over 50 lines); the map sits outside the polite live region.
7. **`expected` goes**: a place reveals early when every team has pinned (`readyToReveal` reads `room.teams`, so a
   round saved before this change behaves the same); `startPlace`/`nextPlace` no longer take the team list.
8. **Wording** (each one whole sentence for the translator): the lobby's "One phone per team: go to" becomes "Team
   phones: go to"; its count becomes "Phones joined: {n} of {n}. Teams without a phone play on this screen."; Memory
   card match's "A phone per team" becomes "With phones"; Map quest's card line keeps its level and era tail.
9. **Accepted**: in two-device play the starting screen is also a player, and its page holds the whole board (as it
   always has for one-screen play). A pin entered on a TV is seen by the room before the reveal.
