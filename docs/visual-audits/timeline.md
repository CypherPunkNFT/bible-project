# Visual audit: Timeline sort (/games/timeline)

Audited 10 November 2026 on the local preview. This is the game you gave as your example. I played today's daily puzzle (number 4) from a fresh start four times: a win in three tries and a loss using all four tries, at desktop size (1440 wide) and again at phone size (390 wide). I also played a Practice round on Hard (seven cards) at both sizes and on Easy on the phone. I checked mouse dragging, finger dragging (press and hold), tap-to-move, the keyboard, a small phone (360 by 640) and the light theme. No code was changed. The screenshots are in [timeline/](timeline/). Names starting `desktop-` or `phone-` give the screen size, and the number gives the stage.

## What it looks and feels like now

The start screen is two boxes side by side ([desktop-01](timeline/desktop-01-start.png)). "Today's timeline" has a short paragraph and a gold "Play #4" button. "Practice" has level pills (Easy, 4 cards; Medium, 5; Hard, 7), a drop-down menu for the part of the Bible, and a "Start practice" button. It reads like a settings page.

Play is six events stacked as full-width dark bars, each with an orange stripe on its left edge, a column of grip dots off to the right, and tiny "EARLIEST" and "LATEST" labels above and below ([desktop-02](timeline/desktop-02-dealt.png), [phone-02](timeline/phone-02-dealt.png)). Underneath is a "Check" button. Four small rings under the title count your tries.

The moving itself works well, and in three ways. You can drag a bar by its grip with the mouse, and the others slide aside ([desktop-04](timeline/desktop-04-mid-drag.png)). On a phone you can press and hold a bar, then drag it ([phone-04](timeline/phone-04-mid-drag-long-press.png)). Or you can tap a bar, which lifts it and shows up and down arrows, then tap where it should go ([phone-03](timeline/phone-03-card-lifted-tap.png)).

When you press Check, everything changes at once with no motion. Bars in the right slot get a green border and a small tick. Neighbours that belong next to each other get a small green "these two belong together" tag. A bold line of text says "2 in the right place. 0 joins. 3 tries left.", and a row of green and white squares is added below ([desktop-06](timeline/desktop-06-after-try-1-ticks-joins.png), [desktop-07](timeline/desktop-07-after-try-2.png)).

When you win or run out of tries, the screen becomes a long reading page. At the top is a plain heading, "Solved in 3!" or "Not this time". Below it are the six events in the true order, each in a box with its date range, a Bible verse, and links to the people in it. Between each pair is a line giving the reason for the order, and pairs you had the wrong way round are marked in bold ([desktop-08](timeline/desktop-08-solved-reveal.png), [desktop-12](timeline/desktop-12-lost-reveal.png)). The score, the Share button, your streak and a countdown to tomorrow's puzzle sit at the very bottom ([desktop-09](timeline/desktop-09-daily-done-share-stats.png)).

The teaching in that reveal is excellent: real verses, honest date ranges, and a reason for every step. It is the best part of the game. The trouble is that it arrives as an article, not as the payoff of a game.

## Where it reads as a form instead of a game

You're right about this one, though the cause is not the questions. It already is drag and drop. What makes it feel like a form is how everything looks and how it answers you.

- **The cards are list rows, not cards.** Full-width text bars with a coloured edge look like a to-do list or a settings list. Nothing about them says "playing card": no card shape, no picture, no back, and nothing to flip. Long titles wrap onto two lines on a phone, so the bars are uneven heights ([phone-02](timeline/phone-02-dealt.png)).
- **There's no timeline on screen.** The game is called Timeline sort, but there's no line, no years and no eras while you play. There are only the two tiny words "Earliest" and "Latest". You're sorting a list, not placing events on history.
- **Check works like a submit button.** You press it, and the page quietly redraws with green borders and a sentence of results. Nothing flips, locks into place, bounces or shakes. The feedback is something you read, not something you see happen.
- **Winning and losing feel the same.** "Solved in 3!" and "Not this time" are the same plain heading in the same place, followed by the same long article. Nothing celebrates a win, and nothing encourages you after a loss.
- **The result is hidden at the bottom.** The score, Share and streak come after six long event boxes. On a phone that's about five and a half screens of scrolling ([phone-08 full page](timeline/phone-08-solved-reveal-fullpage.png), [phone-09](timeline/phone-09-daily-done-share-stats.png)). The score is also shown twice: "Solved in 3!" at the top and "Solved in 3/4" at the bottom.
- **Practice ends on a fraction.** A round ends with "9 of 21 pairs in order" and three empty star outlines ([desktop-14](timeline/desktop-14-practice-result.png)). The "Next round" button is below the whole reading. After a Hard round on a phone, it is about six and a half screens down.
- **The start screen is a settings page.** It has pills, a drop-down menu and two boxes of paragraphs. There are no cards, and nothing shows what the game looks like.

## How the best-known games of this kind do it

- **Timeline, the card game (Asmodee).** This is the classic. Each card has a picture and an event on the front, and the year on the back. You place a card into the row on the table, then flip it over: the year either fits or it doesn't. The flip is the whole thrill, and the row of cards on the table *is* the timeline.
- **Hitster.** The same idea with songs. The cards build up into a growing line in front of you, and every turn ends with a flip that reveals the year.
- **Wikitrivia (web).** A free web game built on the Timeline idea. You drag one card at a time into a horizontal row of cards. The year appears the moment it lands, a right card turns green and stays, and a wrong one turns red and slides into its true place. Hearts at the top show the lives you have left.
- **Wordle (New York Times).** This game already copies Wordle's daily puzzle, its four tries and its grid of shareable squares. What it doesn't copy is the payoff: the tile-by-tile reveal, the winning row hopping, and a result window that opens right away with Share at the top.

What they share: every guess ends in a *reveal you watch*, usually a flip. Placed cards build a visible line of history. The result comes first and the reading comes after.

## Improvements, ranked by impact for the effort

1. **Fix the broken pieces first (high impact, tiny effort).** These are listed under "Anything broken" below: the two navigation links run together, the first tap after a drag is ignored, the feedback pencil button covers Check on the phone, and on a phone the link tag has no words. Each one is a small change, and each one makes the game feel less unfinished.

2. **Make Check a reveal you watch (biggest gain in feel, small to medium effort).** When you press Check, the cards flip one after another from top to bottom, like the Timeline card game. A card in the right slot shows its date range on its back ("about 1446 BC"), glows green, settles with a small bounce, and gets a lock icon. A card in the wrong slot gives a short shake and stays face up. Matching pairs get a visible link drawn between them, with a word ("together"), not just a small tag. The tries left become four small card backs at the top, and one turns over each time you use a try. Under "reduce motion", the cards simply change, as they do now.

3. **Put the result first and the reading second (high, small to medium).** When the round ends, show a compact result panel at the top: a cheer or a gentle "Not this time, here's the true order", your grid of squares, the Share button, your streak with a small flame, and the countdown. On a phone it fits on one screen. Below it, the true order appears as a single connected timeline, one short row per event: title, date range, and a bar on a shared axis of years. Tap a row to open its verse, its people and the reason it comes next. This keeps all the teaching, but each reader decides how deep to go. For Practice, the stars fill in one by one, and "Next round" stays fixed at the bottom of the phone screen.

4. **Put a real timeline on the play area (high, medium).** Draw a vertical line down the left of the cards with a dot at each slot. The ends say "Creation" at the top and "The early church" at the bottom, in place of the tiny "Earliest" and "Latest". Hang the cards off that line as proper playing cards: a fixed height, rounded corners, a soft shadow, and a small faint drawing of the event's kind (a crown for a king, a scroll for a prophet, waves for a sea event) in the corner. While you drag, show a dashed outline in the slot where the card will land, not an empty gap. As cards lock in after a Check, the dates fill in along the line, so the timeline literally builds as you get things right.

5. **Turn the start screen into a game lobby (medium, small to medium).** Show today's puzzle as a small fanned stack of six face-down cards, with "Play #4" and the streak flame on it. Make the Practice levels three card stacks of 4, 5 and 7 cards that you tap to pick, not pills. Make the part-of-the-Bible menu a row of era chips along a mini-timeline (Beginnings, Patriarchs, Exodus, Kings, Exile, Jesus, Church), not a drop-down.

6. **Give the end moments some feeling (medium, small).** On a win, the six locked cards hop in a wave from top to bottom, as Wordle's winning row does. Then the cheer appears once, in a pill that fades away. On a perfect Practice streak, the "perfect rounds in a row" message, which already pops in, gets a small spark. On a loss or a zero-star round, show one encouraging line ("Close: you had Cain and Hagar right") in place of the bare fraction.

## Phone problems

- **The feedback pencil button sits on top of the Check button.** It covers the right end of Check on a 390-wide phone ([phone-02](timeline/phone-02-dealt.png), [phone-07](timeline/phone-07-after-try-2.png)). It also sits over the reading at the end.
- **On a small phone (360 by 640), only four cards fit.** The fifth is half hidden under the Check bar, which stays fixed at the bottom, and the sixth is off the screen ([phone-16](timeline/phone-16-small-phone-360x640.png)). Dragging does scroll the page, but you can't see the whole puzzle at once. Nearly 300 pixels are used above the first card, by the site menu bar, the links, the title, the try rings and the hint.
- **The tick and link marks lose their words on a phone.** "Right place" shrinks to a thin tick, and "these two belong together" becomes a bare chain-link icon that a new player won't understand ([phone-07](timeline/phone-07-after-try-2.png)). The tick also makes its card taller, so the list jumps after every Check.
- **The reading is very long on a phone.** It is about five and a half screens to reach Share after the daily puzzle, and about six and a half to reach "Next round" after a Hard practice round.
- What works well: all six cards fit on a 390 by 844 phone before the first Check, pressing and holding to drag works, the up and down arrows on a lifted card are big enough to tap, and nothing scrolls sideways at any size.

## Accessibility

- **No visible keyboard focus.** Tabbing onto a card shows nothing at all ([desktop-15](timeline/desktop-15-keyboard-focus-card.png)), because the site-wide rule that removes focus outlines (your choice of 6 October 2026) applies here too. As with the other games, a suggestion that keeps that look: give the focused card the same lift and orange edge it gets when picked up.
- **Good:** keyboard play is complete. Enter picks a card up, the arrow keys move it, and Escape puts it back ([desktop-16](timeline/desktop-16-keyboard-lifted-moved.png)). Every move is announced to screen readers ("now position 2 of 6"). Ticks and links always come with an icon, not colour alone. The light theme works ([phone-17](timeline/phone-17-light-theme-after-check.png)). Motion switches off under the "reduce motion" setting.
- When adding the animations above, keep the announcements, and have the flip sequence announce the result once at the end, not card by card.

## Anything broken

- **The two navigation links run together.** During play the top line reads "All gamesGame home", with no space between, in two different sizes and colours ([desktop-02](timeline/desktop-02-dealt.png), [phone-02](timeline/phone-02-dealt.png)).
- **The first tap after a drag is ignored.** After you drag a card by its grip with the mouse, your next tap on any card does nothing; the second tap works. I confirmed this with a separate test ([desktop-17](timeline/desktop-17-first-tap-after-drag-ignored.png)). The likely cause: after a drop, the game ignores one click, expecting it to land on the card. When you drag by the grip, that click lands on the grip instead, so the game ignores your next real tap. It probably happens with a finger on the grip too.
- **The score is shown twice at the end:** "Solved in 3!" at the top and "Solved in 3/4" at the bottom.
- **Not a fault:** a "Select and copy your result" box appeared after pressing Share in my tests ([desktop-10](timeline/desktop-10-after-share.png)). That's the game's planned fallback when a browser blocks copying, as my test browser did. In a normal browser it copies. The white squares in the share grid look pale purple on Windows because of the emoji font.

Apart from the copy warning above, the browser logged no errors in any of the games I played.

## Note on the brief

This followed the shared brief. One thing differs from what the brief expected: this game isn't multiple choice underneath. It already has real drag and drop, with finger, mouse, tap and keyboard all working. So the suggestions are about how the cards look and how the game answers you, not about changing how you play.
