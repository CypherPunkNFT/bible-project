# Visual audit: the live youth-group quiz (/games/live-quiz, players at /play)

Audited 10 November 2026 on the local preview. No code was changed. I played one full ten-question game with the leader's screen at desktop size (1440 wide) and three players on phone-sized screens (390 wide): Ruth always answered right, Boaz always wrong, and Naomi got some right, some wrong, and let one question run out. A second short game checked the name picker, keyboard use and the leader's full-screen mode. The screenshots are in [live-quiz/](live-quiz/). Names starting `desktop-` or `phone-` give the screen size, and the number gives the order of play.

This game has two halves that look different: the **leader's screen** (meant for a projector) and the **players' phones**. Both are covered below.

## What it looks and feels like now

This is already the most game-like of the site's quizzes, because its model is Kahoot!. The leader sets up a game, and a huge six-digit code and a QR code appear for the room to join ([desktop-03](live-quiz/desktop-03-leader-lobby-players.png)). The question appears first on its own, with a gold bar draining underneath ([desktop-04](live-quiz/desktop-04-leader-read.png)). Then four answers open in four strong colours, each with its own shape and letter (red triangle, blue diamond, ochre circle, green square), with a countdown and "2 of 3 answered" ([desktop-05](live-quiz/desktop-05-leader-answer-midplay.png)). On the phones, those same four colours become four big buttons filling the screen ([phone-05](live-quiz/phone-05-player-answer-buttons.png)), and the phone gives a short buzz as they open. At the reveal, the right answer gets a ring, the others fade, each shows how many people picked it, and the Bible verse appears underneath ([desktop-06](live-quiz/desktop-06-leader-reveal.png)). There is a leaderboard between questions, and at the end the third, second and first places appear one after another on a podium ([desktop-08](live-quiz/desktop-08-leader-podium-revealing.png), [desktop-09](live-quiz/desktop-09-leader-podium-final.png)).

The bones of a real party game are all here: speed scoring, streaks, a podium that builds suspense, and "863 points behind Naomi" on your phone. What is missing is the *show*. Almost every moment between the answer buttons is white text on a black page, and nothing moves, flashes, counts up or celebrates.

## Where it reads as a form or quiz instead of a game

- **The leader's first screen is a settings form.** It is a long page of ten labelled rows of pill buttons and drop-down lists, with "13,122 questions" and Create room to the side ([desktop-01](live-quiz/desktop-01-leader-setup.png)). It works, but nothing on it hints at the colourful game that follows.
- **The waiting room is static.** Players' names appear as small grey pills, in alphabetical order rather than the order they joined, with no pop or sound as each one arrives. Most of the screen is empty, and the site's own menu bar stays at the top unless the leader finds the small Fullscreen button ([desktop-03](live-quiz/desktop-03-leader-lobby-players.png)).
- **The countdown is just a number.** During answering, the projector shows a plain "8" in the corner, and the draining bar from the reading stage disappears. Nothing builds as time runs out.
- **The phone's result screens are plain text.** Right and wrong look the same: black screen, white text, a white tick or cross ([phone-07](live-quiz/phone-07-player-right.png), [phone-08](live-quiz/phone-08-player-wrong.png)). There is no green or red, and a wrong answer doesn't tell you which one was right. "Answer locked in" is a line of text under your chosen colour, with no sense of waiting for the others ([phone-06](live-quiz/phone-06-player-locked-in.png)).
- **The leaderboard is a table.** Rank, name, score, in thin rows, with no bars and no movement as people overtake each other ([desktop-07](live-quiz/desktop-07-leader-leaderboard.png)). On the phone it is two lines of centred text ([phone-10](live-quiz/phone-10-player-leaderboard.png)).
- **The ending doesn't celebrate.** The podium blocks are flat brown boxes, and first place is only slightly lighter. All three names sit at the same height, so it barely reads as a podium. The same three names then repeat in a table below. On the winner's phone it says "Thanks for playing! You finished 1st with 9,909 points." followed by a plain list of verse references ([phone-11](live-quiz/phone-11-player-final-winner.png)). Winning and coming last look the same.

## How the best-known games of this kind do it

- **Kahoot!** The answering screen is the same idea as here, but everything around it is staged. Names bounce into the lobby to music. A big circular timer counts down to music. Each phone floods green ("Correct", with a streak flame) or red ("Incorrect") full-screen. On the scoreboard, bars slide into place as people overtake each other. The podium plays a drum roll, then fireworks for the winner.
- **Jackbox Games** (Quiplash, Trivia Murder Party). The phone shows your own avatar and colour throughout, so it feels like *your* controller. The big screen fills every pause with animation and a host voice, and the room never stares at an empty page.
- **Mentimeter quizzes and Quizizz.** After each question, the answer bars grow from zero in front of the room, and the leaderboard animates rows sliding up and down. Quizizz adds funny memes on the phone after each answer.
- **Blooket and Gimkit** (popular in youth groups and classrooms). You choose a character in the lobby. The leader's screen shows the race between players as moving avatars, not as a list.

What they share: the waiting moments are part of the show, every answer gets a full-screen colour response on the phone, and rank changes are animated so the room can see them happen.

## Improvements, ranked by impact for the effort

1. **Make the phone's result screen land (high impact, small effort).** Flood the whole phone green with a big centred tick for "Right!", or red with a cross for "Not this time". Count the "+909" up from zero, and for a wrong answer show the right answer's colour and shape ("It was ◆ B"). Light a flame and "3 in a row" when a streak is running. Let the locked-in screen keep your chosen colour as the background, with a gently pulsing "Waiting for the others… 2 of 3 in". This one change makes every round feel like Kahoot!.
2. **Give the projector a real countdown and reveal (high, small).** Replace the bare number with a large ring that empties as time runs down. It turns red in the last five seconds and gives a soft tick when sound is on. At the reveal, let the four vote bars grow from zero up the full height of each tile, then fade the wrong tiles and pulse the right one. Leave the verse where it is: it is this game's strength.
3. **Animate the leaderboard and the podium (high, medium effort).** On the leaderboard, show each player as a bar whose length is their score. Bars grow from the previous scores to the new ones, and rows slide past each other when someone overtakes, with the up and down arrows sitting beside the moving row. On the podium, make the blocks rise from the floor, put a gold crown or laurel and a confetti burst on first place, and use gold, silver and bronze tints. Show the full list only when there are more than three players.
4. **Make the lobby feel alive (medium, small).** Each new name pops onto the screen in the order players join, with a small bounce and a random answer colour. A soft chime plays when sound is on, and the player count ticks up. Make Fullscreen the leader's obvious first step, for example a large "Show on projector" button above the code.
5. **Give each player an identity (medium, medium).** Let players pick or be given a little symbol (a lamb, a fish, a lamp, a dove) and a colour when they join. Show it on their phone's top bar all game and beside their name on every big-screen list. The name picker already has the charm for this: make "Spin again" actually spin the words like a slot machine ([phone-14](live-quiz/phone-14-player-name-picker.png)).
6. **Celebrate on every phone at the end (medium, small).** Show a medal for the top three, or "You beat 4 players" for everyone else, above "Read the verses from tonight", with your final rank large and coloured.
7. **Fill the projector in full-screen mode (lower, small).** In full screen the answer tiles take only the top half of the screen and the bottom half is empty ([desktop-11](live-quiz/desktop-11-leader-answer-fullscreen.png)). Let the four tiles grow to fill it, so the back row can read them.

## Phone problems

- **The site's full header and menu stay on every player screen**, together with the floating pencil button in the bottom-right corner. Players can tap away from the game halfway through by accident, and the header takes space from the answer buttons. In a game, the phone should show only the game.
- **The reading stage sends a mixed message.** The phone shows the whole question and also says "Read it on the screen" ([phone-04](live-quiz/phone-04-player-read.png)). It has no "get ready" countdown either, so the buttons arrive without warning.
- **The join box's sample code "123 456"** is large and fairly bright, so it can look as if a code has already been filled in ([phone-01](live-quiz/phone-01-player-join-code.png)).
- **The leader's setup on a phone** is one long column with Create room at the very bottom, but it says so plainly ("made for a laptop on a projector"), which is fair ([phone-13](live-quiz/phone-13-leader-setup.png)).
- Good: the four answer buttons are big and easy to hit (each well over the 44-pixel minimum), and nothing scrolled sideways at either size.

## Accessibility

- **Good:** every answer has a shape and a letter as well as a colour, so colour-blind players are fine. Each of the four colours is strong enough to carry white text. The leader can press Space, the right arrow or Page Down to go on, so a presentation clicker works. The podium and the time bar respect the "reduce motion" setting.
- **No visible keyboard focus on the phone's answer buttons.** One Tab reaches the first answer, but nothing shows which one is selected ([phone-15](live-quiz/phone-15-player-answer-keyboard-focus.png)). This comes from the site-wide removal of focus outlines (your decision of 6 October 2026). A suggestion that keeps that look: give a focused answer a thick white inner border.
- **Right and wrong rely on the icon and the words.** Screen readers hear "Right!" or "Not this time", which is good. When the colour floods suggested above are added, the words should stay.
- **The full-screen projector hides Pause and Skip**, because the control bar sits outside the full-screen area. Next still works from the keyboard, but a leader who needs to pause has to leave full screen first.

## Anything broken

- **The big tick and cross on the phone's result screen sit against the left edge, not centred** above "Right!", "Not this time" and "No answer" ([phone-07](live-quiz/phone-07-player-right.png), [phone-08](live-quiz/phone-08-player-wrong.png), [phone-09](live-quiz/phone-09-player-no-answer.png)). The site's base styles make every icon a block of its own, so "centre this text" does not move it. This is a one-line fix.
- **On the leaderboard, the streak flame drops onto its own line** under the player's name instead of sitting beside it ([desktop-07](live-quiz/desktop-07-leader-leaderboard.png), Ruth).
- **On the reveal, the link icon after the verse reference sits alone on its own line** ([desktop-06](live-quiz/desktop-06-leader-reveal.png), under "Mark 4:39").
- **The players' end-of-game verse list mixes short and full book names**, "Gen 7:6" and "Gen 50:3" beside "Ezekiel 14:1" and "Jeremiah 49:23" ([phone-11](live-quiz/phone-11-player-final-winner.png)).
- **A small content oddity:** the first question's lead-in line quoted "Peace, be still" (an older Bible wording), and the question itself quoted "Silence! Be still!" (the site's Bible), so the same words of Jesus appeared twice in two wordings ([desktop-04](live-quiz/desktop-04-leader-read.png)).

Otherwise the game ran cleanly. A full game with three players joined, answered, scored, ranked and finished with no errors, no stalls and no layout breaks. The only browser warnings were that the test browser would not let the phones keep their screens awake, which is expected in testing.

## Note on the brief

This followed the shared brief. Two notes. First, this game has two screens (projector and phones), so the screenshots cover both, and the start, mid-play, right, wrong and end stages appear once for each. Second, playing it locally needed the game's local room server, which wasn't running, so I started it on this PC for the test. It runs entirely on the PC, at no cost, and its game data was kept in my own job folder, not the website's.
