# How well do you know the Bible? (the quiz) redesign, from its visual audit

**Done:** 11 November 2026, sequence "Bible Guide: redesign every game from its audit", step 17. The audit it answers is [quiz.md](quiz.md); its screenshots are in [quiz/](quiz/) and the new ones in [quiz/after/](quiz/after/), named the same way so each stage pairs up. The shared instructions were [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). My step's own brief added one thing, which the shared brief also says: this game is the homepage quiz reused, the homepage is approved and live, and it must look exactly as it does now. So the games page got a component of its own and nothing under the homepage's folder was touched. No correction arrived during the job.

## 1. What changed

The page now opens on a big crimson "Play all twelve" button over the twelve tiles, with "or pick any tile" beside it, and every tile is in the page at once on a phone (two across) instead of two at a time behind swipes. Open a tile and the card grows out of the tile's own place on the board. The four answers are upright cards that deal in one after another, each with its letter large in the corner in the game's crimson, lifting when the pointer or the keyboard reaches them and pressing down when tapped. A right answer swells with a moment's gold, a "+1" floats up to the score and the score bumps; a wrong answer shakes with a red edge while the right one pulses gold so your eye goes to it, and the picture turns over to the verse on a card edged red-brown instead of gold, so the back says "missed" too. Along the top of the card run twelve small squares that fill gold or red as you play, with a flame that lights from two in a row and a score with its own label. The verdict and Next rise together in a band under the answers, which stays at the bottom of a phone screen, so Next is always on the first screen. The ending counts the score up from nought to twelve in gold, gives it a title (Reader, Student, Scribe, Teacher of the Law, Berean), keeps the quiz's own closing line and verse beneath, shows the twelve squares as a row you can share, and puts Try again, See the board, Read and Share right there. A full twelve makes the squares hop in turn; a new best on this device earns a ribbon and one short gold burst. Back on the board, a tile you got right keeps its gold and gains a small gold seal, and a tile you missed is dimmed with its drawing turned grey and a red "Missed" corner, so the board is your scorecard. The twelve questions, their verses, the verdict lines, the scoring and the address are exactly as they were.

## 2. The audit's list, item by item

1. **Make every answer land.** Built as asked. A right pick swells by a few percent with a soft gold ring for under a second (the one moment of glow the rules allow), a "+1" floats from the score and the score number bumps. A wrong pick shakes once with a red dashed edge and its words struck through, the right answer pulses gold twice, and the verse card that turns over is edged red-brown with a darker red face, where a right answer's is gold. Everything else on screen stays where it was: the answer cards keep their height when the marks arrive.
2. **Turn the dashes into a real progress trail.** Built as asked, with the kit's trail: twelve squares along the top of the card that fill gold or red in question order, the open one ringed in crimson and the newest popping; a flame beside them lights from two in a row with the count, and the score reads "3 right" with its label. The same twelve squares are the row on the ending and the squares in the share text, so what you see is what you send. On a phone the row is smaller and sits beside the question count, replacing the two rows of grey bars.
3. **Give the answers the look of game cards.** Built as asked with the kit's answer card. The four stand two by two, 72 pixels tall on a desktop and 64 on a phone (one column below 360 pixels), each with its letter large in the corner in the game's crimson, the answer in the serif. They deal in one after another with a short stagger when the question opens, lift with a crimson edge under the pointer or the keyboard, and press down on tap.
4. **Give the end a proper ending.** Built as asked with the kit's result panel: the score counts up from nought to your total over about a second, large and gold, with "/ 12" beside it; a rank title the score earns sits under it in the hub's gold italic (Reader up to three, Student from four, Scribe from eight, Teacher of the Law at eleven, Berean for all twelve); the quiz's own closing line and verse keep their place beneath; the twelve squares in gold and red sit under that and hop in turn for a perfect round; Share copies the title, the score, the twelve squares and the address, with a preview and a "Copied" line. The ghost number is gone.
5. **Add a start.** Built as asked. "Play all twelve" in the game's crimson stands above the board and deals the questions in order; it reads "Carry on" once some are answered, with the count beside it, and "See how you did" when all twelve are. "or pick any tile" is the second choice. When you open a tile the card grows from that tile's own place on the board (measured at the moment of the tap, then played as one motion of about half a second) instead of the board being swapped out.
6. **Make the finished board show your round.** Built as asked. A right tile keeps its gold edge and tint and gains a small gold seal with a tick; a missed tile is dimmed, its drawing turned grey and a red "Missed" corner ribbon laid across it; both still open to show the answer and the verse.

**My own additions.**
- **The round is kept.** The homepage quiz forgets everything on a reload. On the games page the round in progress is kept for the tab (a reload or Back returns to the same card, already answered, without the +1 or the celebration playing again) and the best score is kept on this device, so the ending can say "New best" with one gold burst. The keys are new ones of this game's own.
- **The drawings redraw.** Under the pointer or the keyboard a tile's line drawing draws itself in again, the same way it did when the board first appeared, so the board stays alive without a loop playing everywhere.
- **Answer keys.** A to D and 1 to 4 answer an open question, once; they do nothing from a field or behind the dialog.
- **One quiet way on.** The two large gold "Take a full test" and "More learning resources" boxes that outshone the game on a phone are replaced on the games page by one plain line, "Ready for more? Take a full test", under the board.

## 3. Faults fixed

From "Anything broken": the audit found nothing broken, and nothing was.

From "Phone problems": every tile is in the page (two across on a phone), no paging dots and no swiping; the score reads "3 right" with its word, and the count "4 of 12 answered" is the trail's label and the board's line; the restart arrow beside the score is gone, and Start again is a labelled button in the page head that asks first in a site-styled dialog ("Your answers so far will not be kept"); the tap highlight that left a gold border on an answer is turned off on the tiles and the cards, and an answer only takes a state when it is really chosen; the close button sits in the card's top row, clear of the picture, so it never overlaps the verse card; the trail is not a row of buttons any more (the tiles are the way to any question), the Next button and the close button are 44 pixels, and the tap targets measured in the play-through are listed under Checks.

From "Accessibility": a focused tile or answer gets the same lift and crimson edge as under the mouse, no outline; opening a question moves the keyboard to the question itself, so the first Tab lands on answer A; A to D and 1 to 4 answer; the verdict is one live region in the band; the reduce-motion setting still switches every motion off (the staggers included).

## 4. Before and after

The after-screenshots were taken on the preview from the final build, dark theme unless the name ends in `-light`.

| Stage | Before (audit) | After |
|---|---|---|
| Start, desktop | [desktop-01](quiz/desktop-01-start.png) | [desktop-01](quiz/after/desktop-01-start.png), [light](quiz/after/desktop-01-start-light.png) |
| Start, phone | [phone-01](quiz/phone-01-start.png) | [phone-01](quiz/after/phone-01-start.png), [light](quiz/after/phone-01-start-light.png) |
| Start, full page | [desktop-01-fullpage](quiz/desktop-01-start-fullpage.png), [phone-01-fullpage](quiz/phone-01-start-fullpage.png) | [desktop-01-fullpage](quiz/after/desktop-01-start-fullpage.png), [phone-01-fullpage](quiz/after/phone-01-start-fullpage.png) |
| The card growing from its tile | none | [desktop-02a](quiz/after/desktop-02a-card-growing.png), [phone-02a](quiz/after/phone-02a-card-growing.png) |
| Question open, desktop | [desktop-02](quiz/desktop-02-question-open.png) | [desktop-02](quiz/after/desktop-02-question-open.png), [light](quiz/after/desktop-02-question-open-light.png) |
| Question open, phone | [phone-02](quiz/phone-02-question-open.png) | [phone-02](quiz/after/phone-02-question-open.png), [light](quiz/after/phone-02-question-open-light.png) |
| Right answer, mid-turn | [desktop-03](quiz/desktop-03-right-answer-midflip.png), [phone-03](quiz/phone-03-right-answer-midflip.png) | [desktop-03](quiz/after/desktop-03-right-answer-midflip.png), [phone-03](quiz/after/phone-03-right-answer-midflip.png) |
| Right answer, desktop | [desktop-04](quiz/desktop-04-right-answer.png) | [desktop-04](quiz/after/desktop-04-right-answer.png), [light](quiz/after/desktop-04-right-answer-light.png) |
| Right answer, phone | [phone-04](quiz/phone-04-right-answer.png) | [phone-04](quiz/after/phone-04-right-answer.png), [light](quiz/after/phone-04-right-answer-light.png) |
| Wrong answer, desktop | [desktop-05](quiz/desktop-05-wrong-answer.png) | [desktop-05](quiz/after/desktop-05-wrong-answer.png), [light](quiz/after/desktop-05-wrong-answer-light.png) |
| Wrong answer, phone | [phone-05](quiz/phone-05-wrong-answer.png) | [phone-05](quiz/after/phone-05-wrong-answer.png), [light](quiz/after/phone-05-wrong-answer-light.png) |
| Wrong answer, full page | [desktop-05-fullpage](quiz/desktop-05-wrong-answer-fullpage.png), [phone-05-fullpage](quiz/phone-05-wrong-answer-fullpage.png) | [desktop-05-fullpage](quiz/after/desktop-05-wrong-answer-fullpage.png), [phone-05-fullpage](quiz/after/phone-05-wrong-answer-fullpage.png) |
| The streak lit after an answer by key | none | [desktop-05b](quiz/after/desktop-05b-streak-after-key.png), [phone-05b](quiz/after/phone-05b-streak-after-key.png) |
| Board mid-play, desktop | [desktop-06](quiz/desktop-06-board-midplay.png) | [desktop-06](quiz/after/desktop-06-board-midplay.png), [light](quiz/after/desktop-06-board-midplay-light.png) |
| Board mid-play, phone | [phone-06](quiz/phone-06-board-midplay.png) | [phone-06](quiz/after/phone-06-board-midplay.png), [light](quiz/after/phone-06-board-midplay-light.png) |
| A reload mid-play keeps the round | none | [desktop-06b](quiz/after/desktop-06b-reload-keeps-round.png), [phone-06b](quiz/after/phone-06b-reload-keeps-round.png) |
| The finished board as the scorecard | none | [desktop-06d](quiz/after/desktop-06d-finished-board.png), [phone-06d](quiz/after/phone-06d-finished-board.png) |
| The ending counting up | none | [desktop-07a](quiz/after/desktop-07a-end-counting.png), [phone-07a](quiz/after/phone-07a-end-counting.png) |
| End screen, desktop | [desktop-07](quiz/desktop-07-end-screen.png) | [desktop-07](quiz/after/desktop-07-end-screen.png), [light](quiz/after/desktop-07-end-screen-light.png) |
| End screen, phone | [phone-07](quiz/phone-07-end-screen.png) | [phone-07](quiz/after/phone-07-end-screen.png), [light](quiz/after/phone-07-end-screen-light.png) |
| End screen, full page | [desktop-07-fullpage](quiz/desktop-07-end-screen-fullpage.png), [phone-07-fullpage](quiz/phone-07-end-screen-fullpage.png) | [desktop-07-fullpage](quiz/after/desktop-07-end-screen-fullpage.png), [phone-07-fullpage](quiz/after/phone-07-end-screen-fullpage.png) |
| Share pressed | none | [desktop-07b](quiz/after/desktop-07b-end-shared.png), [phone-07b](quiz/after/phone-07b-end-shared.png) |
| Keyboard focus on a tile | [desktop-08](quiz/desktop-08-keyboard-focus-tile.png) | [desktop-08](quiz/after/desktop-08-keyboard-focus-tile.png) |
| Start again asks first | none | [desktop-09](quiz/after/desktop-09-start-again-dialog.png), [phone-09](quiz/after/phone-09-start-again-dialog.png) |

## 5. Checks

All run from the Website folder after the last change, in this order.

- The game's tests and the hub's (`npx vitest run src/pages/games/quiz src/pages/games/games.test.tsx`): 38 passed, 0 failed. The game had no tests of its own before (it mounted the homepage component). The new ones cover the rules on top (the streak in answer order, the twelve marks, the next question, the rank titles, the share text), the saved round and best (read back, a bad shape ignored, storage that refuses never throws), and the page (the board and Play all twelve, a right answer with its +1, the band and the verse on the back, a wrong answer with its marks, the keys A to D and 1 to 4 answering once, the streak lighting and resetting, the board as scorecard and Carry on, Start again asking first, the ending with its rank, ribbon, hop and share text, a mixed round, a reload returning to the same answered card without celebrating, and the homepage component left as it was). The kit was not changed, so its tests were not needed.
- `npm run typecheck`: exit 0.
- `npx eslint src/pages/games/quiz --max-warnings 0`: 0 errors, 0 warnings.
- The English check (`py -3.12 content/translation/english_build_check.py`): 0 unregistered texts, 0 new, every language net 0 new.
- `npm run build`: exit 0, twice (the second after the settled answer cards' pointer edge, the faded cards, the seal over the tile's word and the phone card scrolling to the top were tidied from the first screenshots).
- Play-through on the preview with Playwright at 1440 by 900 and 390 by 844, dark and light, from a cleared browser: the start, a tile opened (the card growing), a right answer mid-turn and settled, Next, a wrong answer, two answers by key with the streak lit, the board mid-play, a reload keeping the round, Carry on to the end with one more miss, the ending counting up and settled, Share pressed, the finished board, keyboard focus on a tile, Start again's dialog and the restart. Console errors: 0 in all four passes. Measured: no sideways scroll at either width (document width equal to the screen); Play all twelve 180 by 44; the tiles 220 by 308 on the desktop and 174 by 218 on the phone; the answer cards 340 by 72 and 159 by 64; the close button 44 by 44; Next 160 by 44, at 639 on the desktop screen and 676 on the phone's 844 (inside the first screen after every answer); the Share button 44 tall; the page's scroll 0 after a right answer on the desktop; the keyboard lands on the question when it opens and on a tile after Tab on the board.

Commit: (recorded below once made).

## 6. Left for later

- The two phone-sized screenshots of the card mid-growth catch whatever frame Playwright's timer lands on, so they show the motion part-way at best; on a real phone the half-second grow is smooth.
- The homepage keeps its own quiz untouched, as the brief required, so the two now differ in feel; if the owner wants the homepage to take any of this (the Play button, the +1, the ending), that is a separate decision for the homepage.
- The share text is this game's first; it is three lines (the title and score, the twelve squares, the address) and can be changed if the owner prefers another shape.
