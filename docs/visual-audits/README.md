# Visual audits of the sixteen games: the summary

Written 11 November 2026 from the sixteen audit reports in this folder, one per game, each with screenshots at desktop size (1440 wide) and phone size (390 wide). No code was changed by the audits or by this summary. Each game's report is linked from its line below; the screenshots live in the folder of the same name.

The short version: all sixteen games work underneath, and the writing in them (verses, reasons, explanations) is consistently the best thing on screen. What is missing is almost always the same handful of things, and they are missing in nearly every game. That is good news, because it means most of the fix can be built once and shared.

## One line per game: the biggest problem

- [How well do you know the Bible?](quiz.md) (the homepage quiz, at /games/quiz): handsome tiles and a lovely card turn, but right and wrong look almost the same, the score at the end is a ghost number nobody can read, and nothing ever celebrates. It shares its code with the homepage, so changes must be built for the games page only.
- [Live youth-group quiz](live-quiz.md): the bones of Kahoot are all here (colours, shapes, speed points, a podium), but every screen between the answer buttons is white text on black, the leaderboard is a table and the podium is three flat boxes. Winning and coming last look the same on the phone.
- [Bible Wordle](wordle.md): already a real game, but two faults spoil its two best moments. The keyboard never colours in, and each square shows its colour before it turns, so the reveal gives itself away. Both are tiny fixes.
- [Timeline sort](timeline.md) (the owner's example): the drag and drop works four ways, but the cards are list rows with a coloured edge, there is no timeline on screen, Check works like a submit button, and the score and Share are five and a half phone screens below the reveal.
- [Verse completion](verse-completion.md): every mode is a form. The hidden words are shown as dashes that never get filled in: the answer simply replaces the card all at once. Hard mode can be thirty one-shot guesses in a row and ends in a wall of struck-out words.
- [Bible Jeopardy](jeopardy.md): the board looks right from across a room, but nothing is an event. A tile is replaced rather than opened, the Daily Double is a bet form, the timer is a hairline, and the board is unreadable on a phone (values overflow and titles break mid-word).
- [Bible twenty questions](twenty-questions.md): the guesser has no presence. The thinking head from the start screen never appears again, every turn looks identical with no motion, and the big guess ("Are you thinking of Moses?") looks exactly like question twelve.
- [Bible crossword](crossword.md): the grid does not look like a crossword (no solid blocks, floating in a frame), the tools sit below the fold on desktop, and on a phone the puzzle opens with the grid and clue off the top of the screen.
- [Map quest](map-quest.md): the reveal is the best moment and the page hides it. Confirm scrolls the page down to the Next button, so the line from your pin to the true site plays out above the top of the screen. In the dark theme land and sea are nearly the same colour.
- [Who's older?](whos-older.md): the two cards are text boxes, and on the phone the reveal sheet covers both cards so the green and red marks are never seen, with Next below the bottom of the screen in every round.
- [Family charades](charades.md): the round screen is strong (full-screen green and orange floods) but the scene is centred text with no card, and the timer is a small number in a corner that the actors across the room cannot read.
- [Two truths and a lie](two-truths.md): three grey rows, a confirm dialog, and a reveal that is an article two phone screens long before Next. The end screen is nine phone screens tall with Play again at the bottom. Nothing moves anywhere.
- [Emoji stories](emoji-stories.md): the emoji row is the one game-like thing. The four answers vanish the moment you tap one, so your pick is never marked and right and wrong are the same page with a different first word. Screens keep the old scroll position, so a puzzle can open off the top of the phone.
- [Hot seat](hot-seat.md): the turn layout is right and the clock is good, but nothing moves: a mark swaps the question text in place, the middle of the screen is 350 to 440 pixels of empty dark, and the buzzer is a notice bar that shoves the question down mid-sentence.
- [Odd one out](odd-one-out.md): after every Next the page stays scrolled, so on a phone the new puzzle is entirely above the screen and the player is looking at the site footer. Next itself is a screen and a half down after every answer.
- [Memory card match](memory-match.md): the most game-like of the sixteen, with real cards and a true three-dimensional turn. A miss is silent (two cards wait three seconds and turn back), matched pairs never leave the board, and Play again lands at the bottom of the footer.

## Ranked from most to least in need of visual work

The ranking weighs how far the game is from feeling like a game, how much of its play is affected, and whether anything is actually broken. The group games near the bottom are not finished either, but their core loop already works as a game.

1. **Two truths and a lie.** The purest form of the problem: a multiple-choice question, a dialog, an article, a reading list. No motion, no running score, no winner in group mode.
2. **Odd one out.** The same shape, plus a scroll fault that leaves a phone player staring at the footer ten times a round.
3. **Verse completion.** Four modes, all forms, no motion at all, plus four small display faults that make the result card hard to read and a Hard mode that is a chore.
4. **Bible twenty questions.** A clever engine with nobody on screen doing the guessing, and a climax that looks like any other turn. The reverse mode is a ninety-two-row list with a transcript.
5. **Who's older?** Text-box cards on a two-thirds-empty page, and the phone sheet hides the answer and the Next button every round.
6. **Map quest.** A sound engine whose only reveal happens off screen, on a dark map that is hard to read, with no motion in its stylesheet at all.
7. **Bible crossword.** A competent engine that does not look like a crossword, with a phone layout that needs rebuilding around the grid and keyboard.
8. **Emoji stories.** A good emoji row above form boxes, an article for a reveal, and scroll positions that carry over between screens.
9. **How well do you know the Bible?** Handsome but quiet: no play moment, no reaction to an answer, a muted ending. Constrained by sharing its code with the homepage.
10. **Timeline sort.** Real drag and drop already, but the cards, the Check moment and the ending all read as a list, a submit and an article. Two small faults (links running together, the first tap after a drag ignored).
11. **Bible Jeopardy.** The board is right and the game is solid; every moment around it needs to become an event, and the phone board is broken.
12. **Family charades.** A strong round loop with the right bold feedback; needs a visible timer, a card, and a start screen that is not nine rows of chips.
13. **Hot seat.** One of the best built, with a good hand-over and a good turn layout; needs motion in the turn and a podium at the end.
14. **Live youth-group quiz.** The most game-like of the quizzes; what is missing is the show around the answers (phone result floods, animated leaderboard, a real podium).
15. **Bible Wordle.** A real game with two fixable faults and a result card that should open as a panel.
16. **Memory card match.** Already a card game; needs a miss beat, pairs that leave the board, and a scroll fix.

## What several games share, and should be built once

The redesign brief ([REDESIGN-BRIEF.md](REDESIGN-BRIEF.md)) says a shared games kit is built first. These are the pieces the audits ask for again and again, in the order they would pay off, with the games that need each one.

1. **An answer card.** A card with a surface and rounded corners that deals in with a short stagger, lifts on hover, presses down on tap, and then settles into a right state (soft green tint, tick) or wrong state (red tint, dashed edge, a short shake), with the other cards fading. Its height is fixed so adding a mark never makes the row jump. Needed by the homepage quiz, Two truths and a lie, Emoji stories, Odd one out, Verse completion (Easy and Medium), Who's older?, Bible Jeopardy (its four choices), Hot seat (the question card), Family charades (the scene card) and Twenty questions (its Yes, No and Don't know buttons). Ten games.
2. **A reveal that turns a card over in place.** The homepage quiz already has this turn, and Memory card match has a true card flip; both should be the model. Timeline sort wants its cards to flip to show their dates after Check; Two truths and a lie wants its three statements to turn over A, B, C; Verse completion wants the dashes to fill in word by word; Bible Jeopardy wants a tile to grow into the clue and the clue to turn into the answer; Bible Wordle needs its existing turn fixed so the colour appears at the halfway point. Six games.
3. **A feedback band with Next inside it.** A short band that slides up the moment you answer, carrying the verdict ("Right!" or "Not quite, it was Deborah") and the Next button, pinned to the bottom of a phone screen so Next is never below the fold. The full reading (verses, reasons, people) folds in underneath for anyone who wants it. Every audit but two found Next one to nine screens down. Needed by Two truths and a lie, Odd one out, Emoji stories, Verse completion, Who's older?, Map quest (as a sheet over the bottom third of the map), Timeline sort, the homepage quiz, Hot seat (Save turn) and Memory card match (Play again). Ten games.
4. **Scroll to the top when the screen changes.** Not a visible component but a shared behaviour. Odd one out, Memory card match, Emoji stories, Bible Jeopardy (after Build board), Two truths and a lie (group rounds), Bible crossword (after Make my crossword) and Map quest (the summary) all leave the page scrolled where the previous screen's button was, so the new screen opens off the top. Seven games, one fix.
5. **A progress trail.** A row of small squares or pips, one per round, that fill green, red or amber as each round is answered, with the newest one popping, replacing the small grey captions ("3 OF 10 · SCORE 2") and rice-grain dashes the games use now. The same row becomes the shareable grid at the end, which Wordle, Timeline sort, Two truths and a lie, Emoji stories and Map quest already produce in their share text but never show on screen. Needed by the homepage quiz, Two truths and a lie, Emoji stories, Odd one out, Verse completion, Twenty questions, Map quest, Hot seat (the recap strip), Memory card match and Bible crossword. Ten games.
6. **A result panel.** The score counting up from zero, a rank or title line in the gold italic the hub already uses ("Well read", "Scribe"), the progress trail, a "New best" ribbon, the streak with a small flame, Share with a preview of what will be copied (and a "Copied" or "Copy this" line, which Two truths and a lie and Emoji stories lack), and Play again right there. The reading (the stories, the verses, the true order) sits below it as fold-outs. On a phone the panel fits one screen. Every one of the sixteen games ends today on a heading, a sentence and a table or list with the buttons at the bottom.
7. **A streak counter with a flame.** Lights from two in a row, pulses when it grows. Asked for by the homepage quiz, Bible Wordle, Verse completion, the live youth-group quiz, Who's older?, Timeline sort and Map quest. Seven games.
8. **A timer bar or ring that the room can read.** Thick, draining, turning amber then red and pulsing for the last five seconds, with the number beside it, and a "Time!" stamp that lands over the top bar rather than pushing the question down. Needed by the live youth-group quiz, Bible Jeopardy, Family charades and Hot seat, and a quiet version for Bible crossword's solve time. Five games.
9. **Team chips, a hand-over card and a podium.** A colour chip per team or player, a "Lions, you're up" hand-over, scores as bars that grow and rows that slide past each other, and a three-step podium that rises third, second, first with a small gold-and-cream burst for the winner. The Jeopardy and live-quiz audits both say the two games should share one podium. Needed by the live youth-group quiz, Bible Jeopardy, Family charades, Hot seat, Two truths and a lie (group mode), Memory card match (two to four players) and Emoji stories (the room, which today keeps no score at all). Seven games.
10. **A restrained celebration.** A hop wave across the winning cards or squares, as Wordle's row does, and a short confetti burst in the site's gold and cream for a clean solve, a perfect round or a new best. Once, briefly, at one focal point, as the design rules require. Asked for by Bible Wordle, Timeline sort, the homepage quiz, the live youth-group quiz, Bible Jeopardy, Bible crossword, Map quest, Who's older?, Twenty questions and Memory card match. Ten games.
11. **A start screen that shows the game.** Not a component so much as a pattern every audit repeats: a small sample of the game itself (a fanned stack of cards, two cards facing off, a tilted scene card, a tiny grid) above one clear Play button, with the long tail of settings folded behind one "More options" row so Start sits on the first phone screen. Today thirteen of the sixteen open on a settings form with pills and drop-downs, and Family charades, Hot seat, Emoji stories and Bible Jeopardy put Start one to two phone screens down.
12. **A site-styled confirm dialog.** Verse completion ("Leave this round?") and Hot seat (End game) use the browser's own grey alert box; Bible crossword asks before revealing all but not before throwing a half-done puzzle away. One small dialog in the site's style, used by all three.

**About drag and drop.** The owner's brief mentions it, so it is worth saying plainly: only Timeline sort drags today, and it does so well with mouse, finger, tap and keyboard. No other audit asked for drag and drop. The nearest requests are Verse completion's Hard mode (word tiles that fly up into the gaps when tapped, as Duolingo does) and Twenty questions' suspect board (cards that flip face-down as people are ruled out). Those are tap-to-move, not drag, so a shared drag component is not a priority for the kit. What the other games need from Timeline sort is its sense of handling physical cards, which the answer card above provides.

## Faults that cut across every game

These are not design wishes; they are things to fix, and most of them have one cause.

- **No visible keyboard focus in any of the sixteen games.** The site removes focus outlines everywhere (the owner's decision of 6 October 2026, which stands). Every audit suggests the same answer: give a focused card or button the same lift and gold edge it gets on hover. That belongs in the kit so it is done once. Two truths and a lie shows the cost most sharply: its "Lions got it right" button's pressed state depends on the outline, so the tap looks like nothing happened.
- **The floating feedback pencil button covers controls.** It sits on the Check button in Timeline sort, on the P key and the end of the verse in Bible Wordle, and on the first answer in Verse completion on a small phone. It should move or hide while a game is being played.
- **The site's header and menu stay on screen during play.** On the live quiz's player phones, Bible Wordle's small-phone keyboard and Timeline sort's small-phone board, the header, the "All games" link and the title use 175 to 300 pixels the game needs. Hot seat and Family charades, which run in a fixed full-screen layer, show how it should work.
- **Tap targets under 44 pixels.** Setting chips at 36 pixels in Family charades and Who's older?; the homepage quiz's Next at 33; Map quest's zoom buttons at 29; Bible crossword's squares at 28.
- **Uneven Bible book abbreviations.** The live quiz's end-of-game verse list and Hot seat's recap mix "Gen 7:6" and "Jam 5:15" with "Ezekiel 14:1" and "Ephesians 5:6". The text comes from the question banks, but one formatting rule would fix every game.
- **A failed load shows the site's generic "This page has been updated" screen** instead of the game's own message with Try again, in Family charades and Two truths and a lie, because the data ships inside the game's code chunk. Emoji stories, Hot seat, Odd one out and Memory card match handle it correctly.
- **The "right" colour differs between games.** Emoji stories and Odd one out mark a right answer in the site's lavender Gospels colour; every other game and every share grid uses green. The kit should pick one.

## Faults particular to one game, worth fixing first

Each audit lists these under "Anything broken"; the ones that affect play most are:

- Bible Wordle: keyboard never colours; squares colour before they turn; cheer shown twice; keyboard cut off at 360 by 640.
- Timeline sort: "All gamesGame home" run together; the first tap after a mouse drag is ignored; score shown twice at the end.
- Verse completion: a hinted word is displayed as a wrong copy of itself; ticks and crosses float between words; the struck-out word and the real word run together.
- Bible Jeopardy: the board at 390 wide; "Board link copied" lingers into the next game; the score delta lingers across screens.
- Live youth-group quiz: result icons sit at the left edge instead of centred; the streak flame drops onto its own line.
- Odd one out: the wrong-answer heading splits its name onto its own line; the marked card grows and jumps its row; the same trio or answer can repeat in one round.
- Memory card match: the three end-screen stars stack in a column; Hard boards on a phone break words mid-word.
- Map quest: some places start off the opening map in the Life of Jesus and Exodus eras; Beginner's promised sea and lake names rarely appear.
- Who's older?: Adam and Eve are giveaways that can decide four rounds in seven; the status line says "Streak 0" over "streak of 6".
- Hot seat: the buzzer band shifts the question; waiting players are shown as having dropped a place; the clock ring leaves a red stub at zero.
- Family charades: a browser without a tilt sensor is told it refused motion access it was never asked for.
- Twenty questions: the game's own guess mode cannot find James son of Zebedee in twenty turns.

## What the audits praised, and what must not be lost

Keyboard play is complete in nearly every game (letters, numbers, Enter, Space, arrows). Screen-reader announcements are thorough throughout. Reduced motion is respected wherever there is motion. Progress saves and a reload resumes in every game that has rounds. The light theme is clean in all sixteen. And the teaching content (verses, dates, reasons, people links) is excellent everywhere. The redesigns are about feel, not about any of that.
