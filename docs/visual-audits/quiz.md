# Visual audit: the Bible quiz ("How well do you know the Bible?", /games/quiz)

Audited 10 November 2026 on the local preview, played start to finish at desktop size (1440 wide) and phone size (390 wide). No code was changed. The screenshots are in [quiz/](quiz/). Names starting `desktop-` or `phone-` give the screen size, and the number gives the stage.

One thing to know first: this game is the homepage quiz, reused on a page of its own. Any change made to it will also change the homepage, unless the change is limited to the games page.

## What it looks and feels like now

It is handsome. There are twelve dark tiles, each with a gold line drawing that draws itself in: a bookshelf, an hourglass, a whirlwind, a crown. Together they look like a gallery. Pick a tile and it opens as a large card, with the picture on the left and four answer buttons on the right ([desktop-02](quiz/desktop-02-question-open.png)). When you answer, the picture turns over like a card to show the Bible verse behind the answer ([desktop-03](quiz/desktop-03-right-answer-midflip.png), caught halfway through the turn). That turn is the best moment in the game. Twelve small dashes along the top fill gold or red as you go. At the end you get a closing line ("Well read, and worth reading on."), a verse and a Try again button ([desktop-07](quiz/desktop-07-end-screen.png)).

It feels calm, careful and good to read. It does not yet feel like a game.

## Where it reads as a quiz form instead of a game

- **There is no "Play" moment.** The first screen is a menu of twelve tiles that says "start anywhere" ([desktop-01](quiz/desktop-01-start.png)). It invites browsing, not playing.
- **The question screen is a form.** It has a question, four boxes lettered A to D in a 2-by-2 grid, and a grey line saying "Pick an answer to see the passage". The layout is exactly that of an online test.
- **Right and wrong feel almost the same.** A right answer gets a gold tick and a small bold word "Right." A wrong one gets a thin red cross, the wrong answer struck through, and the same gold verse card ([desktop-05](quiz/desktop-05-wrong-answer.png)). Nothing moves, shakes, glows or makes a sound, and the score number changes without any fuss.
- **There is no tension and no reward.** There is no timer, no points for a run of right answers, no streak and no rank. The only progress shown is twelve dashes, each about the size of a grain of rice.
- **The ending is muted.** Your score appears as a huge but almost invisible ghost number (the "9" in the end-screen picture is nearly black on black). Nothing celebrates, and nothing gives you a result you would want to show anyone.
- **The board doesn't change much.** On the board, a missed question keeps its dark tile with a faint red edge, so after a round the board looks nearly the same as at the start ([desktop-06](quiz/desktop-06-board-midplay.png)).

## How the best-known games of this kind do it

- **Kahoot!** Each answer is a big coloured block with its own shape (red triangle, blue diamond and so on), there is a countdown with music, speed earns points, and a "streak" flame grows. Every answer gets a full-screen "Correct!" or "Incorrect" moment.
- **Duolingo.** A green or red banner slides up from the bottom with a sound and the correct answer, and the progress bar fills with a little burst. The lesson ends on a screen full of statistics and a celebration.
- **Trivia Crack.** You spin a wheel to choose the category, collect a character crown for each category, and the answer buttons flash and pulse.
- **Who Wants to Be a Millionaire?** A money ladder climbs beside the questions, so every right answer visibly moves you up. The final answer is locked in with a pause before the reveal.
- **Wordle** (as an example of an ending). The end is a small grid of coloured squares you can share. It is one look at how you did, and it brings people back.

What they share: one clear thing to look at, a big and instant reaction to every answer, a visible climb, and an ending worth keeping.

## Improvements, ranked by impact for the effort

1. **Make every answer land (high impact, small effort).** When you tap a right answer, it swells slightly and glows gold, a "+1" floats up to the score, and the score number bumps. When you tap a wrong answer, it shakes for half a second, the cross turns solid red, and the right answer pulses gold so your eye goes to it. Give the verse card a red-brown edge when you missed, so the card that turns over says "missed" too. Everything else on screen stays the same.
2. **Turn the dashes into a real progress trail (high, small).** Replace the twelve tiny dashes with twelve numbered circles, or twelve small copies of the tile drawings, that fill gold or red as you play. Add a streak counter ("3 in a row") that lights up from two right answers in a row. On a phone this replaces the two rows of grey bars, which currently look like a loading bar.
3. **Give the answers the look of game cards (high, medium effort).** Keep the four answers, but show them as four upright cards that deal in one after another as the question opens, each with its letter large in a corner. When you pick one, it lifts toward you before the picture turns over. On a phone they can stay 2-by-2, but taller, with a bigger area to tap. This is the change that stops the screen reading as a form.
4. **Give the end a proper ending (high, medium).** Count the score up from 0 to your total, then show a rank title tied to the score (for example "Scribe", "Elder" or "Teacher of the Law"), with the closing verse beneath it. Under that, show a row of twelve small tiles in gold and red that can be shared, the way Wordle's grid is. Replace the ghost number with a score you can actually see.
5. **Add a start (medium, small).** Above the board, add one big gold "Play all twelve" button that deals the questions one after another, and keep "or pick any tile" as the second choice. When you open a tile, it grows from its own spot on the board into the card, instead of the board being swapped out.
6. **Make the finished board show your round (medium, small).** Missed tiles should look clearly different, for example dimmed, with a red corner ribbon and the drawing turned grey. Right tiles keep their gold and gain a small gold seal. Then the board itself becomes your scorecard.

## Phone problems

- The board shows only **2 of the 12 tiles** at a time, with paging dots ([phone-01](quiz/phone-01-start.png)). Ten questions are hidden behind swipes. Directly below sit two large gold "Take a full test" and "More learning resources" boxes that stand out more than the game does.
- The score appears as a bare "0/0" or "4/6" with no label, so it is not clear which number is "right" and which is "answered".
- The small **restart arrow** sits right beside the score. One tap wipes the whole round without asking, and it is easy to hit by accident.
- In the capture, an answer showed a **gold border before anything was picked** ([phone-02](quiz/phone-02-question-open.png), option C). This is the highlight left over from the finger that tapped the tile at that spot, and it looks as if an answer had been chosen for you. It may not happen on every phone, but it is worth checking on a real one.
- The **close (X) button** overlaps the corner of the gold verse card after you answer ([phone-04](quiz/phone-04-right-answer.png)).
- The question dashes are **36 by 20 pixels**, and the Next button is 33 pixels tall. Both are below the usual 44-pixel minimum for a finger.

## Accessibility

- **No visible focus.** Someone using the keyboard cannot see which tile or answer they are on, because the whole site removes focus outlines (your decision of 6 October 2026). For this game, a suggestion that keeps that look: give a focused tile or answer the same lift and gold edge it gets when the mouse is over it.
- **Focus is lost when a question opens.** Opening a tile with Enter sends the keyboard back to the top of the page, and it then takes 14 more presses of Tab to reach the first answer. Focus should move onto the question.
- **No answer keys.** Pressing A to D or 1 to 4 does nothing. Many quiz games support this, and it would make the desktop game faster and more fun.
- **Good:** the "reduce motion" setting is respected (the card turn, the drawing-in and the slide-ins all switch off). The score is announced to screen readers, and the answer buttons are real buttons.

## Anything broken

Nothing is broken. A full round played at both sizes produced no errors, no sideways scrolling and no layout breaks. The problems above are about feel and comfort, not faults.

## Note on the brief

This followed the shared brief. The one addition is the warning at the top: because this game shares its code with the homepage, each improvement above should be built for the games page only, or agreed for both pages.
