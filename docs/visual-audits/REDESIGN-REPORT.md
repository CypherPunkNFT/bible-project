# Bible Guide games: the redesign report (all sixteen games)

**Written:** 2026-11-11, as the last step of the Fortress sequence "Bible Guide: redesign every game from its audit". It closes the sequence: every game has been rebuilt from its audit by its own step, and this step checked the whole set together, played every game, and wrote the summary below for the owner to hear read aloud. The sixteen single-game reports are linked from section 4; the shared rules every step followed are in [the redesign brief](REDESIGN-BRIEF.md).

## 1. The checks, run once over every game

All five checks were run from the Website folder on 2026-11-11, over the whole games folder, not one game at a time.

| Check | Result |
|---|---|
| Every games test (`npx vitest run src/pages/games`) | First run: 892 of 893 passed; one crossword test failed because it waited one tick for the clue file and, with 106 test files running at once, that was not always enough. The test now waits for the start screen properly (the game did not change). Second run: 106 files, 893 tests, all passed. |
| Types (`npm run typecheck`) | Passed, all three projects (app, node, worker). Run again after the two small fixes below: passed. |
| Lint (`npx eslint src/pages/games --max-warnings 0`) | Passed, zero warnings, run again after the fixes. |
| English check (`py -3.12 content/translation/english_build_check.py`) | Passed: 0 unregistered texts in 1,887 page files, nothing new; the plural, pieced-sentence, number-format and title nets found nothing. |
| Build (`npm run build`) | Passed (the pre-build data checks, then Vite in about 50 seconds), so the preview at 127.0.0.1:8931 shows all sixteen redesigned games. Run again after the fixes: passed (Vite in 55 seconds), and the preview was refreshed. |

**Small faults fixed in this step** (each in the game's own folder; games.css, the hub page and the art folder were not touched):

- **Bible crossword:** a test that could fail when the whole folder ran at once (above). Test file only.
- **Hot seat, on a phone:** the final standings opened about two thousand pixels down the page, in the site's footer, so the player saw links instead of the podium. The game had kept the page's scroll from the setup screen behind its full-screen layer; the standings now bring the page back to the top the moment they open. This was found by the play-through and confirmed by measuring the page: the heading sat 1,930 pixels above the screen.
- **Live youth-group quiz, leader's screen on a phone:** the "This game has ended" message had the same symptom, because the ended screen is far shorter than the stage it replaces. The page now returns to the top when the room closes. (The leader's screen is meant for a laptop or projector, and says so on a phone, so this was a small one.)

**Commit:** `d738db2b7` on `main`, "Games redesign: whole-hub checks, play-through of all sixteen games and the owner's report", pushed to origin and accepted; this hash line was added in a small second commit. Nothing was released or deployed.

**Bigger things noticed and not fixed here** are listed in section 6, with the ones each step left for later in section 4.

## 2. Playing every game

Every game was played on the preview with Playwright, from fresh storage, at 1,440 wide and at 390 wide, in the dark theme and in the light theme: 64 runs in all. Each run opened the game, started a round, gave one answer, and went on to the end screen, with the browser's console watched throughout. The screenshots are in [final-play/](final-play/), one folder per game, named by size, theme and stage.

| | Result |
|---|---|
| Runs | 64 (16 games, 2 sizes, 2 themes) |
| Runs that reached the end screen | 64 |
| Console errors | 0 |
| Page errors (uncaught exceptions) | 0 |

How each game was taken to its end, so the owner knows what the screenshots show: Wordle was lost on purpose with six wrong words; Timeline sort played a Practice round and pressed Check; Memory card match found all six pairs; Odd one out, Two truths, Verse completion, Emoji stories and the quiz took the first answer every time through all their rounds; Who's older ran a Streak until the first miss; Twenty questions answered Yes to everything until the site guessed; the crossword typed one letter and then revealed the puzzle; Map quest dropped five pins on a Practice round; Jeopardy built the default three-team board with the Final round switched off, marked one clue right and ended the game from its menu; Hot seat ran two 30-second turns and saved them; Charades took one card and ended the round from Pause; the live quiz created a room on the local room server, had one player join from a phone-sized page and answer, and then ended the game from the leader's bar (the room server was started on this PC for the test and stopped afterwards; nothing was deployed).

Two things happened during play that were not faults in a game: one verse fetch was refused by the preview server during a Verse completion round (the game offered Try again and Skip, and Try again worked), and the Hot seat and live-quiz phone scroll faults in section 1 were found here and fixed. After the fixes the two games were played again at both sizes and both themes: all eight runs reached the end screen with no console errors, and on the phone the Hot seat final standings now open at the top of the page with the heading in view (measured: the page's scroll is 0 and the heading sits 139 pixels down, under the site header). The screenshots in [final-play/hot-seat/](final-play/hot-seat/) and [final-play/live-quiz/](final-play/live-quiz/) are from the replay.

**Keyboard play, saved games and share** were checked by each step's own tests and play-through rather than repeated here; the single-game reports say what was pressed. Nothing was released or deployed, and the live site still shows the games as they were before this sequence.

## 3. One family, sixteen rooms

Looked at side by side on one sheet, the sixteen games read as one house: the site's dark page or cream page, the serif for every title and question, the small sans for labels, each game wearing the one book colour it has on the hub, and the same handful of behaviours from the shared kit showing through in every room:

- cards that deal in one after another, lift under the pointer and press when tapped;
- a verdict band that rises with Next inside it, pinned to the bottom of a phone screen so Next is always on the first screen;
- a trail of small squares across the top that fills green, amber or red as a round goes;
- an ending that counts the score up in large serif, gives it a title in the hub's gold italic, shows a "New best" ribbon with one short burst of gold and cream, and puts Play again and Share right there;
- for the four group games, a podium that rises third, second, first with the winner's name very large in its team colour.

Each game still keeps its own look: the Wordle tiles, the timeline's line of dots, the card table and shelf of Memory match, the hand-drawn ring of Odd one out, the struck-through lie of Two truths, the gaps in the verse, the hourglass between two tall cards, the emoji tiles, the thinking head and its cloud, the purple grid, the map with its gold pin, the crimson Play button over twelve tiles, the Jeopardy board, the stopwatch dial, the red scene card, and the colour-flooded phones of the live quiz.

**Two that look alike.** The closest pair is **Odd one out and Two truths and a lie**: both show a name over a short stack of dealt cards that tint green or red, the same band and ten-square trail, and an ending card that differs mainly in colour (blue against magenta). They sit on different shelves of the hub (Daily puzzles and Family), so the owner's rule about two things in one category is not broken, but seen together they are siblings. A second, lighter resemblance is **Emoji stories and the quiz**, which both put four lettered answer cards under the puzzle with the band beneath. And **the four group games share one podium**, which is the kit working as intended, but Jeopardy, Hot seat and Family charades are all on the same shelf, so if the owner wants each ending to be unmistakably its own, that is the place to add a different flourish per game (section 6).

## 4. Game by game

One paragraph of what changed and one of what is left, per game, drawn from each step's own report (linked) and checked against the files. The order is the order the steps ran in.
### Bible Wordle ([its report](wordle-redesign.md))

**What changed.** The game now plays the way Wordle is remembered: each letter pops in, Enter turns the row over one tile after another, and the keyboard colours in only once the row has settled. A win makes the five green tiles hop in a wave with the cheer in a pill above the board; the result then rises where the keyboard was, on a phone as a sheet over the lower half of the screen with the answer, the verse, your coloured-square grid and Share all in view. The hint is a small lamp beside the board that lights after the third guess. Statistics has real bars and a row of the last seven days, and a small flame keeps the daily streak in view. A small 360 by 640 phone now holds the whole keyboard. Rules, the daily word, scoring, saved record, share text and address are unchanged.

**What is left.** The seven-day row only knows days finished from now on; there is no earlier history to recover. No sound.

### Timeline sort ([its report](timeline-redesign.md))

**What changed.** The owner's own example game was polished rather than rebuilt. The start screen is a lobby: today's puzzle as a fanned stack of six face-down cards with its number and your streak flame, three Practice levels as little stacks of cards, and the part of the Bible as a row of era chips. On the board a line runs down the left with a dot at every slot and the events hang off it as proper cards with a soft shadow and a faint drawing in the corner. A dashed outline shows where a dragged card will land. On Check the right cards turn over top to bottom to show their date on a green back, wrong ones shake, and neighbours that belong together get a "together" bridge. The result fits one phone screen; the true order below is one connected timeline you can tap into.

**What is left.** The long-press drag on a real iPhone and Android phone is still to be tried by hand. A few events get the plain card motif because the corner drawing is read from the title's words. No sound.

### Memory card match ([its report](memory-match-redesign.md))

**What changed.** The board now behaves like cards on a table. A new board deals in card by card; a tap turns a card over in a true arc with a shadow on the table; two cards that are not a pair tilt with a thin red edge and can be tapped back at once; a pair is stamped with a teal tick and both cards fly up to a shelf above the grid, so the board visibly empties as the shelf fills. Above the shelf a row of dots fills, the move count pops, three stars dim one by one as the move thresholds pass, and a flame lights from two pairs in a row. Pass-and-play has coloured player chips with bars and a hand-over banner. The ending opens on one screen with the stars dropping in, the moves counting up and a "New best" ribbon; two or more players see a crown on the winner. Rules, data, scoring, saved progress, keyboard play and address are unchanged.

**What is left.** The last pair does not fly to the shelf because the ending must open at once (nothing may wait for an animation). A phone turned sideways still scrolls a little on Hard. No sound.

### Odd one out ([its report](odd-one-out-redesign.md))

**What changed.** The game now plays like the picture on its hub tile: four name cards deal in, lift under the pointer and press when tapped. A right answer tints the card green with a hand-drawn ring; a wrong pick turns red with a dashed edge, shakes once, and a beat later the true odd one lifts with its ring. A row of ten squares fills green or red with the score popping and a flame from two in a row. The verdict and Next rise together in a bar under the cards with the reason as one large sentence and the rest folded under "Why", so Next is on the first screen in every round. The round ends on a result card with the score counting up, a title, a new-best ribbon and Share. The start screen shows a sample deal with the ring drifting from card to card.

**What is left.** Anna beside Annas in one Easy People set, and Easy sets that rest on "the only woman" or "the only man", are in the puzzle data, which this work was told to keep. The key verse inside "Why" shows a short note if the Bible text cannot be fetched. No sound.

### Two truths and a lie ([its report](two-truths-redesign.md))

**What changed.** The person's name sits over three dealt-in cards with lettered circles. Tapping one marks it with the game's magenta edge and a "Your pick" tag, and one filled button, "That's the lie", locks it in. At the reveal the three cards turn over where they stand a quarter-second apart: the true ones green with a tick, the made-up one red with a dashed edge, a cross and its sentence struck through, with the truth it twisted written out beneath. A band rises with "You spotted it" or "Not quite" and Next, pinned to the bottom of a phone screen. Ten squares fill as you go; the ending counts the score up with a band line in gold italic, a wave for eight or more, a gold burst for ten, and Share, Play again and Back to games right there. Group play has colour chips with bars and award toggles that fill the instant they are tapped.

**What is left.** The failed-load screen is still the site's generic one, because the fix belongs to the site shell, not the game. Verses behind true statements fetch only when opened, by design. No sound.

### Verse completion ([its report](verse-completion-redesign.md))

**What changed.** The verse is now the game. Every hidden word is a gap as wide as the word, drawn in the game's lavender, and the next gap to fill breathes slowly. In Hard mode and First letters each word you give lands in its own gap in the verse itself, green when right and red with a wavy line when missed; in Whole words the typing box sits inside the card so a phone keyboard never covers it. On Easy and Medium the three endings are cards that deal in and settle green or red. A band rises under the card with the stars filling one after another, a short verdict and Next, pinned to the bottom of a phone screen. A trail of ten segments runs across the top. The round ends on a result panel with the stars counting up out of thirty, the day streak's flame and the ten verses as small cards with Add buttons. The start screen is a lobby with My verses as a ring and the three levels as cards showing John 3:16 with its gaps.

**What is left.** No sound. A Hard card still hides every word after the opening, as the rules say. My verses keeps its list layout.

### Who's older? ([its report](whos-older-redesign.md))

**What changed.** Two tall cards stand side by side at every size, each with a gold medallion carrying the person's initial, and a small hourglass between them whose sand trickles and turns over. Above them a real scoreboard: the streak as a big number with a flame, or the score and three red hearts that crack one by one. A tap presses the card in; the right one tints green with a "Came first" stamp, a wrong pick goes red with a cross and a shake. The verdict rises in a band with Next inside it, pinned to the bottom on a phone. The timeline strip is now thick solid bars with a dashed bracket saying how many years apart. On Next the person who stays slides left and the challenger glides in from the right. Five in a row bursts gold. The ending counts the number up in gold with a new-best ribbon, a bar against your best, the share text and the missed pairs.

**What is left.** The cards carry an initial in a medallion rather than a drawn portrait; drawing 160 faces in the hub's engraving style is a job of its own. No sound.

### Emoji stories ([its report](emoji-stories-redesign.md))

**What changed.** Each puzzle's emoji are dealt in one at a time on soft tiles the colour of the game, and a story of five or six emoji stays on one line even on a phone. Four answer cards with serif numbers lift and press; after the answer the picked card presses in, the right one lights green a beat later, a wrong pick turns red with a shake, and the other two fade. A band rises with "Right!" or "Not this time", the points and Next, pinned to the bottom of a phone screen. Ten squares fill green, amber or red; three gold coins dim as hints are spent. The ending counts the score up out of 30 with a title line, a wave for 27 or more and a burst for 30. The Daily shows its guess rows from the start; Show a room has large lettered cards and a team tally. The start screen shows the Noah example as dealt tiles.

**What is left.** The room's emoji at desktop width are about 97 pixels where the design asked for 120; a wider column would be a hub decision. The "right person, different story" verdict has no after-shot because the day's puzzle had no such story. No sound. The Daily's share text was deliberately left as it was.

### Bible twenty questions ([its report](twenty-questions-redesign.md))

**What changed.** The thinking head from the start screen now sits beside every question in the game's teal, and its cloud reacts to each answer: a tick for Yes, a cross for No, a wobbling question mark for Don't know, and three pulsing dots from the fifteenth question. Each question slides in; the three answer buttons show their keys and leave a short wash of colour. When the site is ready to guess, the turn dots pulse gold and a card scales in with the name in large serif and "Yes, that's them!". Winning fills the dots gold and bursts a little confetti; losing gives the player the same burst under "You win!". The disagreements lesson is one card at a time. In "You ask the questions" the people still possible are a suspect board that visibly shrinks, the log is an exchange with the newest answer in a band pinned to the bottom of a phone, and the ending shows your trail of turns against the site's.

**What is left.** No sound. The lesson cards are tapped away rather than swiped. The hint count still counts the whole pool on Easy, as the design says. The James son of Zebedee wording in reverse mode is a notes problem, not a visual one.

### Bible crossword ([its report](crossword-redesign.md))

**What changed.** The grid has solid dark blocks in a tight frame in the game's Gospels purple: the square you are on wears a purple ring with a direction arrow, the rest of its word a purple band, and every letter pops in. A filled word pulses once; a confirmed word's clue takes a gold tick. A row of dots above the grid fills as words complete, with a quiet clock. On a phone the page is one screen: the grid at the top and, pinned to the bottom, the clue bar with arrows, the keys and one row of tools; the Across and Down lists slide up as a sheet. Check and Reveal are two small menus; Reveal all, New puzzle and Change puzzle ask first. The last right letter sends a gold wave across the squares and "Solved!" scales in with confetti. The start screen is a shelf of theme cards with a live preview of the grid shape.

**What is left.** A long clue makes the phone's pinned clue bar four lines tall. The site's floating correction pencil still sits over the right end of the pinned row; moving it is a site-shell change. No sound. In this final pass one of its tests was found to be timing-sensitive when the whole games folder ran at once, and the test was steadied (the game itself did not change).

### Map quest ([its report](map-quest-redesign.md))

**What changed.** Above the map a row of five slots fills with each round's colour and the running total is a teal bar that grows with the number counting up. Confirm floats inside the map's frame, so it is always in reach. A tap drops a gold pin that falls in with a shadow and a ring flashing where it landed. On Confirm the page no longer jumps: the dashed line draws itself from your pin to the true site, the true site lands as a dot with a breathing ring, and the answer rises as a sheet over the bottom of the map on a phone with the points counting up. A bullseye gets a small burst of gold. The dark map is now readable, with Beginner naming the Sea of Galilee, the Dead Sea, the Jordan and the great seas. The end is a map of all five pins with the total counting up, a rank title from Wanderer to Cartographer, and confetti for a clean 5,000. The home shows the hub's map engraving on the Daily Five card.

**What is left.** No sound, because a first sound should be a decision for the whole hub. The street atlas used elsewhere on the site has the same older "map that cannot load" rule this game fixed for itself; it was left alone as outside the game.

### Bible Jeopardy ([its report](jeopardy-redesign.md))

**What changed.** On Start game the category titles drop in and the tiles fill the board column by column. A chosen tile grows out of its place to fill the stage with the clue on it, and shrinks back leaving the gap. A mark lands with a green flash or a red shake, a short chime or buzz, the score counting to its new number and "+300" floating up. The Daily Double floods the stage in the team's colour. The timer is three times thicker, turning gold then red and pulsing for the last five seconds, and "Time!" stamps over the clue at the end. The results open on the winner's name very large in its team colour with one burst of confetti over a podium rising third, second, first. Sounds can be turned off in the game menu. On a phone the board shows one category at a time from a row of chips, so every tile is readable and tappable.

**What is left.** Full screen on a real projector could not be checked in the test browser. The tie-breaker screen was checked by tests, not by a screenshot. A swipe between phone categories was not built because it would fight the page's own scrolling. One housekeeping note: because two jobs shared one working tree, part of this redesign went in under another job's commit message; nothing was rewritten and the files are all on main.

### Hot seat ([its report](hot-seat-redesign.md))

**What changed.** Before each turn the chair-and-stopwatch drawing stands faded behind the player's name like a spotlight and the 3, 2, 1 lands large. In the turn the question and its answer sit on one card in the middle of the screen; Right throws the card off to the right with a green tick, Wrong throws it left with a red cross, Pass drops it away with an amber arrow, and the next card settles up at once while "+1" floats out of the score. The clock is a dial big enough for the room that turns red and pulses for the last five seconds, with a red "Time!" stamp at the buzzer. The recap shows the turn as a strip of tiles with the score counting up and Save turn pinned to the bottom of a phone screen. Standings settle in row by row; the next player is a "You're up" card. The final standings open on a podium with a burst of gold for the winner. The start page is a line-up of player cards with the settings folded under one row, so Start game sits on the first screen.

**What is left.** Standings rows settle into their new order rather than sliding past each other. The question bank's own references are abbreviated unevenly in its data. The end of turn and the podium have no sound of their own.

### Family charades ([its report](charades-redesign.md))

**What changed.** The start page opens on a tilted scene card in the game's deep red with the edges of two more behind it, its title changing slowly from Noah to David to Jonah to Daniel, and Start right under it on the first phone screen; the settings fold behind one "More options" row. In the round the scene is a real card with the deck's name, a row of green ticks growing along the top and "9 cards left" at the bottom, with the cards still to come showing behind it. A thin red bar drains with the clock, the seconds twice as large as before, and the score pops with a "+1". Got it throws the card down with a green tick, Pass throws it up with an orange arrow, and the next card slides in. The recap counts the score up beside a bar against this device's best. Teams get a colour each, a "You're up" hand-over card and a podium at the end. The rules, scenes, scoring, saved settings, tilt controls, sound and address are untouched.

**What is left.** A failed scenes load still shows the site's generic "This page has been updated" screen because the scenes ship inside the game's code. The tilt path could not be played in the headless browser; its code and tests are unchanged.

### Live youth-group quiz ([its report](live-quiz-redesign.md))

**What changed.** On the phones the game plays in a layer that covers the whole screen, so the site's menu and pencil are out of reach until the game ends, and every player carries a small line symbol in one of the site's book colours. A tap turns the whole phone that answer's colour; the reveal floods it green with a big tick and points counting up, or red with a cross and the right answer. On the projector, names pop onto the lobby screen as they join, a large ring empties as the seconds run down, a bar grows up each tile to its share of votes at the reveal, the leaderboard is a bar per player growing from where they stood, and the podium rises third, second, first with a crown and confetti. Full-screen mode makes the tiles fill the screen. The worker and the messages between leader and phones are unchanged.

**What is left.** "2 of 3 in" on the phone and "You beat 4 players" at the end need the phone to be told how many are in the room, which the messages do not carry; one field on the phone's snapshot would do it when the worker next changes. Letting a player pick their own symbol would need the same. The first question's lead-in wording is a question-bank edit. A real full-screen projector shot is still owed. Whether the generated sounds carry in a hall is for the first real evening to tell.

### How well do you know the Bible? ([its report](quiz-redesign.md))

**What changed.** The games-page version of the homepage quiz now opens on a big crimson "Play all twelve" button over the twelve tiles, with every tile in the page at once on a phone. A tile's card grows out of its place on the board; the four answers are upright cards that deal in with their letters in crimson. A right answer swells with gold and a "+1" floats to the score; a wrong one shakes with a red edge while the right one pulses gold, and the picture turns to the verse on a card edged red-brown. Twelve squares run along the top with a flame from two in a row. The verdict and Next rise in a band that stays at the bottom of a phone screen. The ending counts the score up to twelve in gold with a title from Reader to Berean, a shareable row of squares, and Try again, See the board, Read and Share. Back on the board a tile you got right keeps its gold seal and a missed tile is dimmed with a red "Missed" corner. The homepage quiz is untouched, as the brief required.

**What is left.** The homepage and the games-page quiz now differ in feel; whether the homepage should take any of this is a separate decision. The share text is this game's first and can be reshaped if the owner prefers.


## 5. Contact sheet: before and after

One desktop pair and one phone pair per game, at the same stage of play, as links. The left is the audit's screenshot from before the redesign; the right is the step's after-screenshot. The full sets are in each game's folder and its after/ folder, and this step's own play-through shots are in [final-play/](final-play/).

| Game | Desktop before | Desktop after | Phone before | Phone after |
|---|---|---|---|---|
| Bible Wordle | [before](wordle/desktop-07-won-result.png) | [after](wordle/after/desktop-07-won-result.png) | [before](wordle/phone-09-lost-result.png) | [after](wordle/after/phone-09-lost-result.png) |
| Timeline sort | [before](timeline/desktop-08-solved-reveal.png) | [after](timeline/after/desktop-08-solved-reveal.png) | [before](timeline/phone-08-solved-reveal.png) | [after](timeline/after/phone-08-solved-reveal.png) |
| Memory card match | [before](memory-match/desktop-11-wrong-pair-both-up.png) | [after](memory-match/after/desktop-11-wrong-pair-both-up.png) | [before](memory-match/phone-10-wrong-pair-both-up.png) | [after](memory-match/after/phone-10-wrong-pair-both-up.png) |
| Odd one out | [before](odd-one-out/desktop-07-puzzle-1-right.png) | [after](odd-one-out/after/desktop-07-puzzle-1-right.png) | [before](odd-one-out/phone-06-puzzle-1-right.png) | [after](odd-one-out/after/phone-06-puzzle-1-right.png) |
| Two truths and a lie | [before](two-truths/desktop-07-round-1-picked.png) | [after](two-truths/after/desktop-07-round-1-picked.png) | [before](two-truths/phone-10-round-1-reveal-correct-top.png) | [after](two-truths/after/phone-10-round-1-reveal-correct-top.png) |
| Verse completion | [before](verse-completion/desktop-04-pick-easy-right-result.png) | [after](verse-completion/after/desktop-04-pick-easy-right-result.png) | [before](verse-completion/phone-04-pick-easy-right-result.png) | [after](verse-completion/after/phone-04-pick-easy-right-result.png) |
| Who's older? | [before](whos-older/desktop-09-streak-reveal-right.png) | [after](whos-older/after/desktop-09-streak-reveal-right.png) | [before](whos-older/phone-06-streak-round1.png) | [after](whos-older/after/phone-06-streak-round1.png) |
| Emoji stories | [before](emoji-stories/desktop-08-practice-round-1-reveal-right.png) | [after](emoji-stories/after/desktop-08-practice-round-1-reveal-right.png) | [before](emoji-stories/phone-08-practice-round-1-reveal-right.png) | [after](emoji-stories/after/phone-08-practice-round-1-reveal-right.png) |
| Bible twenty questions | [before](twenty-questions/desktop-10-guess-the-guess.png) | [after](twenty-questions/after/desktop-10-guess-the-guess.png) | [before](twenty-questions/phone-10-guess-the-guess.png) | [after](twenty-questions/after/phone-10-guess-the-guess.png) |
| Bible crossword | [before](crossword/desktop-09-play-first-word-typed.png) | [after](crossword/after/desktop-09-play-first-word-typed.png) | [before](crossword/phone-09-play-first-word-typed.png) | [after](crossword/after/phone-09-play-first-word-typed.png) |
| Map quest | [before](map-quest/desktop-10-daily-place1-reveal-right.png) | [after](map-quest/after/desktop-10-daily-place1-reveal-right.png) | [before](map-quest/phone-10-daily-place1-reveal-right.png) | [after](map-quest/after/phone-10-daily-place1-reveal-right.png) |
| How well do you know the Bible? | [before](quiz/desktop-04-right-answer.png) | [after](quiz/after/desktop-04-right-answer.png) | [before](quiz/phone-04-right-answer.png) | [after](quiz/after/phone-04-right-answer.png) |
| Bible Jeopardy | [before](jeopardy/desktop-07-answer-right.png) | [after](jeopardy/after/desktop-07-answer-right.png) | [before](jeopardy/phone-08-board-one-played.png) | [after](jeopardy/after/phone-08-board-one-played.png) |
| Hot seat | [before](hot-seat/desktop-13-turn-1-after-right-settled.png) | [after](hot-seat/after/desktop-13-turn-1-after-right-settled.png) | [before](hot-seat/phone-10-turn-1-first-question.png) | [after](hot-seat/after/phone-10-turn-1-first-question.png) |
| Family charades | [before](charades/desktop-14-live-card-2-score-1.png) | [after](charades/after/desktop-14-live-card-2-score-1.png) | [before](charades/phone-14-live-card-2-score-1.png) | [after](charades/after/phone-14-live-card-2-score-1.png) |
| Live youth-group quiz | [before](live-quiz/desktop-06-leader-reveal.png) | [after](live-quiz/after/desktop-06-leader-reveal.png) | [before](live-quiz/phone-07-player-right.png) | [after](live-quiz/after/phone-07-player-right.png) |

Four sheets made for this step show all sixteen games at once, which is how the family check in section 3 was done: [the answer moment on a desktop, dark](final-play/sheet-desktop-dark-answer.png), [the answer moment on a phone, light](final-play/sheet-phone-light-answer.png), [the end screens on a desktop, dark](final-play/sheet-desktop-dark-end.png) and [the end screens on a phone, dark](final-play/sheet-phone-dark-end.png).

## 6. What needs the owner's word

Nothing here was done; each is a decision, and the games work without it.

1. **Releasing.** Everything is on main and on the preview only. The live site still shows the old games until the owner releases.
2. **Sound for the whole hub.** Jeopardy, Hot seat, Charades and the live quiz have short generated tones with an off switch; the twelve other games have none, and several steps said a first sound should be one decision for all games rather than one game at a time.
3. **The homepage quiz.** The games-page quiz now plays very differently from the homepage's, which was left untouched as instructed. Whether the homepage should take any of it (the Play button, the +1, the ending with a title) is the owner's call, and so is the shape of the quiz's new three-line share text.
4. **The live quiz's room server.** Two things the audit asked for on the phones ("2 of 3 in" while waiting, "You beat 4 players" at the end) and letting a player choose their own symbol all need one small addition to the messages the server sends. The server was deliberately not changed in this sequence.
5. **Portraits for Who's older.** The two cards carry an initial in a gold medallion; drawn faces for 160 people in the hub's engraving style would be a job of its own.
6. **Endings on the same shelf.** The three family games (Jeopardy, Hot seat, Charades) share the kit's podium, and Odd one out and Two truths share the kit's result card. Say whether each should get its own distinct flourish, or whether the shared shape is the point.
7. **Data, not design.** Odd one out has Anna beside Annas in one Easy set and Easy sets that rest on "the only woman" or "the only man"; the Hot seat question bank abbreviates its references unevenly; the live quiz's first question lead-in reads oddly; Twenty questions' notes on James son of Zebedee are inconsistent in reverse mode. All are edits to the data files, which the steps were told to keep.
8. **Outside the games.** The site's floating correction pencil sits over the right end of the crossword's pinned tool row on a phone; the site's generic "page has been updated" screen is what Charades and Two truths show if their data fails to load; and the street atlas used on other pages has the same older "map that cannot load" rule that Map quest fixed for itself. Each is a change to the site shell or another page.
9. **Hand testing.** Still owed on real devices: the long-press drag in Timeline sort on an iPhone and an Android phone, the tilt controls in Charades, and Jeopardy and the live quiz full-screen on a real projector. The test browser cannot do these.
10. **Housekeeping.** Part of the Jeopardy redesign went in under another job's commit message because two jobs shared one working tree; the files are all on main and nothing was rewritten. If the owner wants the history tidy, that is a rewrite he would have to ask for.
