# The shared games kit, in plain words

Written 11 November 2026 as step 1 of the redesign sequence, before any game was rebuilt. The code is in
`src/pages/games/kit/` and the developer's list is the "Kit" section of `src/pages/games/README.md`. This page says the
same thing for the owner: what each piece does, why it exists, and which games are expected to pick it up.

## The idea

The sixteen visual audits kept asking for the same handful of things: a card that reacts when you tap it, a reveal
that turns over instead of swapping, a Next button that is never below the bottom of the phone, a row of squares that
fills as you play, a score that counts up, a flame for a streak, teams with a winner, a short celebration. So those were
built once, as behaviour only. The kit never decides a colour, a corner or a typeface: each game tells it "my colour is
the Gospels purple, my corners are soft, my face is the page's surface" by setting a few variables, and the same pieces
then move and settle in that game's look. Two games should never look alike, and with the kit they will not: the kit
moves, the game dresses.

Three rules the kit keeps for every game:

- **Nothing waits for an animation.** The moment you answer, the answer is marked, the score is counted and Next is
  there. The motion only decorates what has already happened, and for a reader who asks their phone for reduced motion
  the motion is gone and nothing else changes.
- **No focus outline.** When you move through a game with the keyboard, the piece you are on lifts a little and takes
  the game's colour on its edge, exactly as it does under the mouse. There is never a blue box.
- **Every word passes the translation check.** A name or an answer is never glued into a sentence; it stands in its
  own place under a short fixed label, so the six translations of the site can carry it.

## The pieces

1. **The answer card.** Deals in with a short stagger, lifts when you hover or reach it with the keyboard, presses down
   when you tap, then settles: a soft green tint and a tick for right, a red tint, a dashed edge and a short shake for
   wrong, the other cards fading. Its height never changes when the mark arrives, so the row never jumps. It can also
   be a plain card with no button behaviour, for a question or a scene.
   *Asked for by:* the homepage quiz, Two truths and a lie, Emoji stories, Odd one out, Verse completion, Who's older?,
   Bible Jeopardy, Hot seat, Family charades, Bible twenty questions.

2. **The flip card.** Turns a card over in place, like a playing card or a Wordle tile, and the back's colour appears
   exactly at the half-turn rather than before it (the fault Bible Wordle's audit found). The words on the back are not
   in the page until the card turns, so a face-down answer cannot be read by a screen reader or found with a search.
   *Asked for by:* Bible Wordle, Timeline sort, Two truths and a lie, Bible Jeopardy, Memory card match, the homepage
   quiz. (Verse completion's word-by-word fill and Jeopardy's tile growing into its clue are not flips; those games
   build them themselves.)

3. **The feedback band.** The moment you answer, a band slides up carrying the verdict and the Next button, stuck to
   the bottom of a phone screen so Next is never off the bottom; the full reading (verses, reasons, people) folds in
   under it for anyone who wants it. Keyboard focus moves to Next when the band opens, so Enter carries on.
   *Asked for by:* Two truths and a lie, Odd one out, Emoji stories, Verse completion, Who's older?, Map quest, Timeline
   sort, the homepage quiz, Hot seat (Save turn), Memory card match (Play again).

4. **Scroll to the top when the screen changes.** Not a thing you see: a rule that when a new screen opens, the page is
   at the top of it, rather than wherever the previous screen's button was.
   *Asked for by:* Odd one out, Memory card match, Emoji stories, Bible Jeopardy, Two truths and a lie, Bible crossword,
   Map quest.

5. **The progress trail.** A row of small squares or dots, one per round, that fill green, red or amber as each round is
   answered, the newest one popping, in place of the small grey "3 of 10" captions. The same marks make the share grid
   at the end, so what you see on screen is what you send.
   *Asked for by:* the homepage quiz, Two truths and a lie, Emoji stories, Odd one out, Verse completion, Bible twenty
   questions, Map quest, Hot seat, Memory card match, Bible crossword.

6. **The result panel.** The ending that fits one phone screen: the score counting up from zero, a rank or title line in
   the hub's gold italic ("Well read", "Scribe", each game's own words), the trail, a "New best" ribbon, the streak,
   Share with a preview of what will be sent and a "Copied" line, and Play again right there. The reading sits below
   as fold-outs. The real score is there for a screen reader from the first instant; only the digits count.
   *Asked for by:* all sixteen games, which today end on a heading, a sentence and a list with the buttons at the bottom.

7. **The streak flame.** A small flame that lights from two in a row and pulses when the streak grows.
   *Asked for by:* the homepage quiz, Bible Wordle, Verse completion, the live youth-group quiz, Who's older?, Timeline
   sort, Map quest.

8. **The timer the room can read.** A thick bar or a ring that drains, turning amber and then red and pulsing for the
   last five seconds, with the number beside it, and a "Time!" stamp that lands over the top bar instead of pushing
   the question down. A quiet version for the crossword's solve time. The game keeps the clock; the kit only draws it.
   *Asked for by:* the live youth-group quiz, Bible Jeopardy, Family charades, Hot seat, Bible crossword.

9. **Teams.** A colour chip per team or player with its score and a thin bar that grows against the leader, the team
   whose turn it is lifted; a hand-over card ("You're up" and the name very large); a winner line; and one podium,
   shared by every group game, that rises third, second, first with the celebration on the winner. Equal scores share
   a place, the rule Hot seat already uses.
   *Asked for by:* the live youth-group quiz, Bible Jeopardy, Family charades, Hot seat, Two truths and a lie (group
   mode), Memory card match (two to four players), Emoji stories (the room).

10. **The restrained celebration.** A hop wave across the winning row of cards or squares, as Wordle's does, and one
    short burst of confetti in the site's gold and cream from one point, once, for a clean solve, a perfect round or a
    new best. Nothing under reduced motion.
    *Asked for by:* Bible Wordle, Timeline sort, the homepage quiz, the live youth-group quiz, Bible Jeopardy, Bible
    crossword, Map quest, Who's older?, Bible twenty questions, Memory card match.

11. **The options fold.** One "More options" row that hides the long tail of settings, so the start screen is the game's
    picture and one Play button on the first phone screen.
    *Asked for by:* thirteen of the sixteen start screens.

12. **The confirm dialog.** A small question in the site's own style ("Leave this round?") in place of the browser's
    grey alert box, with focus returned to where you were.
    *Asked for by:* Verse completion, Hot seat, Bible crossword.

Not built: drag and drop. Only Timeline sort drags, it already does so well, and no other audit asked for it.

## Which games are expected to use which pieces

| Game | Pieces it is expected to use |
|---|---|
| Bible Wordle (step 2) | flip card (the half-turn colour fix), streak flame, result panel with share, celebration (hop wave), confirm dialog if it adds one |
| Two truths and a lie (step 3) | answer card, flip card (A, B, C turn over), feedback band, progress trail, result panel, teams (group mode), scroll to top |
| Emoji stories (step 4) | answer card, feedback band, progress trail, result panel with share, teams (the room), scroll to top |
| Who's older? (step 5) | answer card (the two people), feedback band (the phone sheet), streak flame, result panel, celebration |
| Verse completion (step 6) | answer card (Easy and Medium), feedback band, progress trail, streak flame, result panel, confirm dialog, options fold |
| Odd one out (step 7) | answer card, feedback band, progress trail, result panel, scroll to top |
| Memory card match (step 8) | feedback band (Play again), progress trail (pairs found), result panel, teams (pass and play), celebration, scroll to top |
| Bible twenty questions (step 9) | answer card (Yes, No, Don't know), progress trail (the twenty turns), result panel, celebration |
| Bible crossword (step 10) | timer (quiet), progress trail, result panel, celebration, confirm dialog, scroll to top |
| Map quest | feedback band (a sheet over the map), progress trail, streak flame, result panel, celebration, scroll to top |
| How well do you know the Bible? (the homepage quiz, games-page version only) | answer card, flip card, feedback band, progress trail, streak flame, result panel, celebration |
| Timeline sort | flip card (dates after Check), feedback band, streak flame (Daily), result panel with share, celebration |
| Bible Jeopardy | answer card (the four choices), flip card (clue to answer), timer, teams and podium, celebration, scroll to top |
| Family charades | answer card as the scene card, timer (the draining bar), teams, result panel (the recap count-up), options fold |
| Hot seat | answer card as the question card, feedback band (Save turn), progress trail (the recap strip), timer, teams, hand-over card and podium, confirm dialog |
| Live youth-group quiz | timer, streak flame, teams and podium, celebration, result panel (player phones) |

Each game step decides for itself; a piece that does not fit a game is left out, and a step may extend a piece as long
as what is already there keeps working. The games' own rules, data, scoring, saved games and share text are untouched
by the kit.

## Checks run on the kit

Forty-four tests over every pure function and every component (`npx vitest run src/pages/games/kit`), the hub's own
tests, the TypeScript check, the linter with zero warnings, the English-text check and the full site build. The results
are reported in the step's own report and its commit.
