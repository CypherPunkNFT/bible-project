# Redesign: Live youth-group quiz (/games/live-quiz, players at /play)

**Written:** 11 November 2026, from the audit [live-quiz.md](live-quiz.md) and the shared brief [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). Before-screenshots are in [live-quiz/](live-quiz/), after-screenshots in [live-quiz/after/](live-quiz/after/), named by the audit's stage numbers at both sizes (a name ending in `-light` is the light theme). My step's own brief adds one rule the shared brief also states: the room server (the Cloudflare Worker) and the messages between it and the screens must not change, and they did not. Only the leader's screen and the players' phones were redesigned. The two briefs did not disagree.

## 1. What changed

The live quiz now puts on the show the audit found missing. On the phones, the game plays in a layer that covers the whole screen, so the site's menu and the floating pencil button are out of reach until the game ends, and every player carries a small line symbol in one of the site's book colours beside their name all game. The moment you tap an answer the whole phone turns that answer's colour and says it is waiting for the others. At the reveal the phone floods green with a big centred tick and your points counting up from zero, or red with a cross and the right answer shown in its own colour, shape and letter, with a flame when you are on a streak. Between questions your place stands very large in your colour. At the end the first three places get a medal in gold, silver or bronze, the score counts up, and the night's verses are listed with their books written out in full.

On the projector, the lobby opens with a "Show on projector" button above the join code, and names pop onto the screen in the order they join, each with its symbol, with a soft chime when sound is on. During answering a large ring empties as the seconds run down, turning amber and then red with a pulse for the last five seconds (and a soft tick with sound on), beside a bar that fills as the answers come in. At the reveal a bar grows up each tile to the share of votes it took, the wrong tiles fade and the right one pulses once, with the verse beneath as before. The leaderboard is a bar per player that grows from where they stood last time, and rows slide up or down from where they were, with the arrow beside them. The podium rises third, second, first in bronze, silver and gold, with a crown and one burst of gold-and-cream confetti for the winner, and the full list appears only when more than three played. In full-screen mode the tiles grow to fill the screen and the leader's controls stay with them. The rules, the questions, the scoring, the saved room and player tokens, the share of nothing (this game has no share text) and the addresses are untouched.

## 2. The audit's list, item by item

1. **Make the phone's result screen land.** Built as asked, with one part built differently. The whole phone floods green for "Right!" with a big centred tick, red for "Not this time" with a cross, and a quiet dark grey for "No answer". The points count up from zero to "+909" over about two thirds of a second (the real figure is in the page from the first moment for screen readers). A wrong answer or no answer is told the right one: "It was" and then the right answer as a tile in its own colour with its shape and letter. A streak of two or more lights the kit's flame with "3 in a row". The locked-in screen keeps the colour you chose as the whole background, shows your chosen answer as a tile, and says "Waiting for the others…" breathing gently. **Built differently:** the audit asked for "2 of 3 in" on the phone, but the room server tells only the leader's screen how many have answered, and the messages may not change, so the phone says "Waiting for the others…" without the count.
2. **Give the projector a real countdown and reveal.** Built as asked. The bare number became the kit's ring, large (about nine rem on a wide screen), with the seconds inside it; it is the game's lavender until ten seconds, amber until five, then red and pulsing. With sound on, a soft tick sounds once a second for the last five seconds (and never while paused). Beside the ring, "2 of 3 answered" has a bar that fills as the answers come in. At the reveal a translucent bar grows from the floor of each tile up to its share of the votes (against the most-chosen answer), the wrong tiles fade to a third, the right one keeps a double ring and pulses once, and the count pops in. The verse stays where it was, now rising in a beat later.
3. **Animate the leaderboard and the podium.** Built as asked. Each of the top five rows carries a bar in the game's colour (gold for first place) whose length is the score against the leader's; the bar grows from where that player stood at the last leaderboard to where they stand now, and the score counts from the old to the new. Rows slide into place from where they were: a climber comes up from as many rows below as they climbed, a faller comes down, capped at five rows, with the up or down arrow popping in beside them. The podium is the kit's shared podium (as the audit asked, the same one Jeopardy uses), with taller steps for a projector: third place rises first in bronze, then second in silver, then first in gold with a crown on the step and one short burst of gold-and-cream confetti; each step stays at the floor until its place is called, on the same 1.3-second beat as before. The full list underneath appears only when more than three played.
4. **Make the lobby feel alive.** Built as asked. Names pop onto the screen in the order players join (the server sends them ranked, so the leader's screen remembers the order it first saw each one), each pill carrying the player's symbol in their colour; the player count pops as it changes; with sound on, a short chime plays for each arrival after the first snapshot (never a chime per player when the leader's screen reconnects). A large "Show on projector" button sits above the code and is the first thing on the screen; it is hidden on browsers that cannot go full screen (iPhones), where the Fullscreen button in the bar is hidden too.
5. **Give each player an identity.** Built differently. Players cannot pick a symbol, because the choice would have to travel to the server and the messages may not change. Instead every player gets a symbol (fish, dove, lamp, star, sun, moon, leaf, anchor, flame, shell, mountain or flower, as thin line icons in the site's engraving manner) and one of the site's seven book colours, worked out from their name alone, so the phone and the big screen agree without a word between them. The symbol sits in the phone's top bar all game, on the "You're in" screen, beside the name on every big-screen list, in the lobby, on the podium and on the end screen. "Spin again" on the name picker now spins the words like a slot machine for half a second before settling (the real name is chosen at once; the cycling words are decoration, hidden from screen readers, and skipped when the reader asked for less motion).
6. **Celebrate on every phone at the end.** Built differently. The first three places get a medal in gold, silver or bronze above their place, everyone else sees their place very large in their own colour, the score counts up from zero, and "Read the verses from tonight" follows. The audit's "You beat 4 players" could not be built: the phone is never told how many played, and the messages may not change.
7. **Fill the projector in full-screen mode.** Built as asked. The stage is a column and the answer grid grows to fill whatever is left, so in full screen the four tiles take the whole height. The control bar (Next, Skip, Pause, Lock, Sound, End game) now lives inside the full-screen element, dimmed until the mouse comes near, so Pause and Skip no longer vanish in full screen (the audit's accessibility note). The settings panel and the player list moved inside too.

**My own additions.** The answered-count bar beside the ring, filling as each answer lands, so the room can see the pace. A small living picture of the game on the setup page (a screen with the four tiles breathing in turn and three phones lifting to vote), with the long tail of settings folded behind the kit's "More options" row so Create room sits on the first phone screen. Keyboard focus on the phone's answer buttons is a thick white inner edge with a small lift (the audit's suggestion), and every button, pill and chip on both screens shows focus the way it shows hover. The site-styled confirm dialog replaces the browser's grey box for "Remove this player?" and "End this game for everyone?".

## 3. Faults fixed

From "Anything broken":

- **The tick and cross sat against the left edge.** Fixed: the mark is centred above the words on every result screen.
- **The streak flame dropped onto its own line on the leaderboard.** Fixed: the name row is a flex row and the flame (now the kit's) sits beside the name.
- **The link icon after the verse reference sat alone on its own line.** Fixed: the icon is inline with the reference.
- **The end-of-game verse list mixed short and full book names.** Fixed: the phone writes each book out in full from the site's own book list (which the whole site already carries), so "Gen 7:6" reads "Genesis 7:6"; where a book code is unknown it keeps the bank's words.
- **The first question's lead-in quoted an older wording.** Not fixed: that is the question bank's content, not the game's screens.

From "Phone problems":

- **The site's header, menu and floating pencil stayed on every player screen.** Fixed: from the moment a player is in the room until the game ends, the phone plays in a fixed layer over the whole page, as Hot seat and Charades do, so nothing but the game can be tapped and the answer buttons get the whole screen. The join and name steps keep the normal page.
- **The reading stage sent a mixed message.** Fixed: when the leader lets phones show the question, the phone shows the question with a "Get ready" ring emptying under it and no longer says "Read it on the screen"; when the leader keeps the text on the big screen only, the phone says "Read it on the screen" with the same ring, so the buttons never arrive without warning.
- **The sample code looked filled in.** Fixed: the placeholder is faint.
- **The leader's setup on a phone was one long column with Create room at the bottom.** Fixed: on a phone the count and Create room come first, and the room settings fold behind "More options".
- Tap targets: every button, chip, select and verse link is at least 44 pixels tall.

From "Accessibility":

- **No visible keyboard focus on the answer buttons.** Fixed with the thick white inner edge.
- **Full screen hid Pause and Skip.** Fixed: the controls are inside the full-screen element.
- Right and wrong still say "Right!" and "Not this time" in words; the colours were added, not swapped in.

## 4. Before and after

Each pair is the audit's before-shot and the after-shot of the same stage, dark theme unless named `-light`. The game was played for real on the preview with three phones (Ruth, Boaz and Naomi) and ten questions on a ten-second timer, so the after-shots show live scores, not mock-ups.

| Stage | Before | After | What to look for |
|---|---|---|---|
| Leader's setup, 1440 | [desktop-01](live-quiz/desktop-01-leader-setup.png) | [after](live-quiz/after/desktop-01-leader-setup.png) · [light](live-quiz/after/desktop-01-leader-setup-light.png) | Count and Create room beside a small living picture of the game; the rest of the settings behind "More options". |
| Leader's setup on a phone, 390 | [phone-13](live-quiz/phone-13-leader-setup.png) | [after](live-quiz/after/phone-13-leader-setup.png) | Create room on the first screen. |
| Lobby, empty | [desktop-02](live-quiz/desktop-02-leader-lobby-empty.png) | [after](live-quiz/after/desktop-02-leader-lobby-empty.png) | "Show on projector" above the code. |
| Lobby with players | [desktop-03](live-quiz/desktop-03-leader-lobby-players.png) | [after](live-quiz/after/desktop-03-leader-lobby-players.png) · [picker name](live-quiz/after/desktop-03b-leader-lobby-picker-name.png) | Each name with its symbol in its colour, in the order they joined. |
| Reading the question | [desktop-04](live-quiz/desktop-04-leader-read.png) | [after](live-quiz/after/desktop-04-leader-read.png) | Unchanged in shape; the drain bar now runs the full read time. |
| Answering, mid-play | [desktop-05](live-quiz/desktop-05-leader-answer-midplay.png) | [after](live-quiz/after/desktop-05-leader-answer-midplay.png) · [light](live-quiz/after/desktop-05-leader-answer-midplay-light.png) | The ring with the seconds inside it, and the "answered" bar filling beside it. |
| Reveal | [desktop-06](live-quiz/desktop-06-leader-reveal.png) | [after](live-quiz/after/desktop-06-leader-reveal.png) · [later](live-quiz/after/desktop-06b-leader-reveal-later.png) · [light](live-quiz/after/desktop-06-leader-reveal-light.png) | Vote bars up the tiles, wrong tiles faded, the right one ringed; verse reference and its link icon on one line. |
| Leaderboard | [desktop-07](live-quiz/desktop-07-leader-leaderboard.png) | [after](live-quiz/after/desktop-07-leader-leaderboard.png) · [later](live-quiz/after/desktop-07b-leader-leaderboard-later.png) | A bar per row, gold for first; the flame beside the name, not under it. |
| Podium, rising | [desktop-08](live-quiz/desktop-08-leader-podium-revealing.png) | [after](live-quiz/after/desktop-08-leader-podium-revealing.png) | Third and second up, first still at the floor. |
| Podium, final | [desktop-09](live-quiz/desktop-09-leader-podium-final.png) | [after](live-quiz/after/desktop-09-leader-podium-final.png) · [light](live-quiz/after/desktop-09-leader-podium-final-light.png) | Bronze, silver, gold steps with the crown on first; no list for three players. |
| Join page at desktop size | [desktop-10](live-quiz/desktop-10-player-join-at-desktop.png) | [after](live-quiz/after/desktop-10-player-join-at-desktop.png) | Faint placeholder in the code field. |
| Phone: join, name, lobby | [phone-01](live-quiz/phone-01-player-join-code.png) · [02](live-quiz/phone-02-player-name.png) · [03](live-quiz/phone-03-player-lobby.png) | [join](live-quiz/after/phone-01-player-join-code.png) · [name](live-quiz/after/phone-02-player-name.png) · [lobby](live-quiz/after/phone-03-player-lobby.png) | The lobby is the first screen in the full-screen layer: no site header, no pencil, the player's symbol beside "You're in". |
| Phone: read, answer, locked in | [phone-04](live-quiz/phone-04-player-read.png) · [05](live-quiz/phone-05-player-answer-buttons.png) · [06](live-quiz/phone-06-player-locked-in.png) | [read](live-quiz/after/phone-04-player-read.png) · [answer](live-quiz/after/phone-05-player-answer-buttons.png) · [locked in](live-quiz/after/phone-06-player-locked-in.png) | The "Get ready" ring under the question; four tall buttons filling the screen; the chosen colour flooding the phone. |
| Phone: keyboard focus | [phone-15](live-quiz/phone-15-player-answer-keyboard-focus.png) | [after](live-quiz/after/phone-15-player-answer-keyboard-focus.png) | The thick white inner edge on the focused button. |
| Phone: right, wrong, no answer | [phone-07](live-quiz/phone-07-player-right.png) · [08](live-quiz/phone-08-player-wrong.png) · [09](live-quiz/phone-09-player-no-answer.png) | [right](live-quiz/after/phone-07-player-right.png) · [wrong](live-quiz/after/phone-08-player-wrong.png) · [no answer](live-quiz/after/phone-09-player-no-answer.png) | Green flood with a centred tick and the counted points; red flood with the right answer as a tile; grey for no answer. |
| Phone: between questions | [phone-10](live-quiz/phone-10-player-leaderboard.png) | [after](live-quiz/after/phone-10-player-leaderboard.png) · [in the lead](live-quiz/after/phone-10b-player-leaderboard-leader.png) | The place very large in the player's colour. |
| Phone: the end | [phone-11](live-quiz/phone-11-player-final-winner.png) · [12](live-quiz/phone-12-player-final-last.png) | [winner](live-quiz/after/phone-11-player-final-winner.png) · [middle](live-quiz/after/phone-11b-player-final-middle.png) · [last](live-quiz/after/phone-12-player-final-last.png) · [light](live-quiz/after/phone-12-player-final-last-light.png) | A medal for the first three, the score counting up, and the verses with full book names. |
| Phone: name picker | [phone-14](live-quiz/phone-14-player-name-picker.png) | [after](live-quiz/after/phone-14-player-name-picker.png) | Caught mid-spin: the words cycling before they settle. |

The audit's full-screen shot ([desktop-11](live-quiz/desktop-11-leader-answer-fullscreen.png)) has no after-shot: a headless browser cannot enter real full-screen mode, so that one must be judged by eye on the projector. All other stages have both themes.

## 5. Checks

All run on 11 November 2026 after the last change.

| Check | Result |
|---|---|
| Game tests (`npx vitest run src/pages/games/live-quiz src/pages/games/games.test.tsx`) | 6 files, 43 tests, all passed |
| TypeScript (`tsc -p tsconfig.app.json --noEmit`) | clean |
| ESLint on the game folder, warnings as errors | clean |
| English check (`content/translation/english_build_check.py`) | 0 unregistered texts |
| Production build (`vite build`) | built |
| Playwright play-through, 1440 leader + three 390 phones, dark and light | both ran to the podium; no console errors on any page |
| The room server ([wrangler.live-quiz.jsonc](../../wrangler.live-quiz.jsonc), [src/lib/live-quiz/](../../src/lib/live-quiz/), [server/](../../server/)) | not changed; the play-throughs ran against it unmodified |

The play-through script lives outside the site at `C:\FortressOrchestrator\workspaces\667d38ebaaad47cfa53ac1860e583e5f\playthrough.667d38eb.mjs`; it drives the preview on port 8931 against a local room server on port 8928.

Commit: _(recorded below once made)_.

## 6. Left for later

- **"2 of 3 in" on the phone and "You beat 4 players" at the end.** Both need the phone to be told how many are in the room, which the messages do not carry today. One field on the phone's snapshot would do it, when the worker next changes.
- **Picking your own symbol.** The phone and the big screen agree on a symbol from the name alone, which needs no message. Letting a player choose would need the choice sent to the server and out to the leader.
- **The first question's lead-in wording** is the question bank's data, not the screens; it needs an edit to the bank entry.
- **A real full-screen screenshot** on the projector, to confirm the tiles fill the height and the control bar fades in on mouse movement, since a headless browser cannot enter full screen.
- **Sound.** The tick, chime and reveal sounds are made with the browser's own oscillator, so they need no files; whether they carry in a hall is for the first real evening to tell.
