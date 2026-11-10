# Visual audit: Bible Wordle (/games/wordle)

Audited 10 November 2026 on the local preview. I played today's puzzle (number 4, answer BRIBE) four times from a fresh start: a win in three tries and a loss at desktop size (1440 wide), and a win in four and a loss at phone size (390 wide). I also checked a small phone (360 by 640), the light theme, the high-contrast colours and keyboard use. No code was changed. The screenshots are in [wordle/](wordle/). Names starting `desktop-` or `phone-` give the screen size, and the number gives the stage.

## What it looks and feels like now

Unlike most of the site's games, this one already is a real game, because it copies a game everyone knows. On first visit a "How to play" box opens with three example rows ([desktop-01](wordle/desktop-01-first-visit-help.png)). Behind it is the familiar six-by-five grid of empty squares and an on-screen keyboard, in the site's dark colours with its serif title ([desktop-02](wordle/desktop-02-start.png)). Typed letters fill the squares, a refused word makes the row shake and a short line appears ("Not in the word list", [phone-06](wordle/phone-06-not-in-word-list.png)), and each played row turns over one square at a time. After three guesses a "Show a hint" link offers the word's kind, such as "Something you could see or hold" ([phone-08](wordle/phone-08-hint-shown.png)). At the end a card replaces the keyboard. It has a cheer such as "Splendid!", the word in large spaced capitals, the Bible verse with the word highlighted, a gold Share button, four statistics and a countdown to tomorrow's puzzle ([desktop-07](wordle/desktop-07-won-result-fullpage.png)). The verse at the end is the best moment, and it is what makes this Bible Wordle rather than just Wordle.

It is clean and calm and it works. But two faults take the excitement out of the two moments that matter most in Wordle, the reveal and the win.

## Where it falls short of a game

- **The reveal gives itself away (a fault).** Every square shows its final colour the moment you press Enter, before it has turned. The squares then turn, but they are already green or grey ([desktop-03](wordle/desktop-03-row-turning-midway.png), caught partway through: the last two squares haven't turned yet and are already coloured). In Wordle the colour appears halfway through each turn, so you hold your breath square by square. Here that suspense is lost.
- **The keyboard never colours in (a fault).** After any number of guesses, every key is still the same dark grey ([desktop-05](wordle/desktop-05-midplay.png): R, I and E are found and C, A, N, P and D are ruled out, yet the keyboard looks untouched). Only the letters go a slightly brighter white, which is almost invisible. In Wordle the coloured keyboard is the main tool for planning the next guess, so without it the game is noticeably harder and feels unfinished. The cause is one line in the game's style sheet: the plain key colour is written after the green, yellow and grey colours, so it wins.
- **The win doesn't celebrate.** The winning row turns green and stops. Nothing hops, glows or bursts. The cheer appears twice, once under the board and again at the top of the card ("Splendid!" and "Splendid!", [desktop-07](wordle/desktop-07-won-result.png)).
- **The ending reads like a page section, not a result screen.** The result card simply appears below the board, where the keyboard was. On a phone you see only "The word was BRIBE" and the start of the verse; the Share button and your statistics are off the bottom of the screen, and nothing scrolls you there ([phone-09](wordle/phone-09-lost-result.png)).
- **Typing has no touch.** Letters appear in the squares without the small "pop" that makes each key press feel physical.
- **Small things look like web page parts.** The hint is an underlined link, messages are plain bold text, and the statistics window shows bars as small grey boxes with a "0" in them ([phone-10](wordle/phone-10-statistics.png)).

## How the best-known games of this kind do it

- **Wordle (New York Times).** Each letter pops slightly as you type it. On Enter, each square flips and its colour shows at the halfway point. The keyboard keys turn green, yellow or dark grey as you learn. A win makes the row's squares hop one after another, with a toast like "Magnificent". A loss shows the answer in a dark pill above the board. After a moment the statistics window opens by itself, with today's bar highlighted, and the Share button sits right there.
- **Quordle and Octordle.** The same game on four or eight boards. The keyboard keys split into coloured quarters so you can track every board at once. This shows how central the coloured keyboard is to this kind of game.
- **Waffle.** A daily word puzzle whose finished grid celebrates with stars for the swaps you had left, and a daily streak that you can see.
- **Duolingo.** The streak flame that grows each day you come back. This is the model for a daily habit, which fits "a word from the Bible every day".

What they share: suspense in every reveal, a keyboard that thinks with you, a win you can feel, and a result screen that gets to the point and makes you want to come back tomorrow.

## Improvements, ranked by impact for the effort

1. **Fix the two faults (biggest impact, tiny effort).** Make the keys turn green, yellow or grey as letters are found. This is a one-line change to the style sheet. Then make each square stay blank until it is halfway through its turn, and only then show its colour, so the row reveals itself square by square. Have the keyboard colour in after the row has finished turning, not before. Nothing else on screen changes.
2. **Make the win and the loss land (high, small).** When you win, the five green squares hop up one after another, and the cheer appears once, as a dark rounded pill above the board that fades away. When you lose, the pill shows the answer. Add the small pop when a letter is typed. Turn all of this off when the "reduce motion" setting is on, as the turn already is.
3. **Give the ending its own moment (high, medium).** About a second after the last turn, have the result card slide up over the keyboard area as a panel. On a phone it covers the lower half of the screen and needs no scrolling. Spell the answer in five green tiles in the site's gold-edged style instead of plain capitals, with the verse below. Show a preview of your own coloured-square grid right above the Share button, so you can see what you are about to share. Then show the streak, with a small flame from two days in a row. The close button returns you to the board.
4. **Fit the phone (high, small).** On phones, put the title, the date and the three icons on one compact line and drop the "All games" link into the site menu. This gives back about 60 pixels, enough for the whole keyboard to fit a small phone. Move the floating pencil button out of the way while the game is being played (see Phone problems).
5. **Make the hint feel like part of the game (medium, small).** Show the hint as a small lamp button beside the board, in the same style as the keys, that lights up after the third guess. When pressed, the hint appears as a gold-edged ribbon above the board, not grey text under it.
6. **Make the statistics window feel earned (medium, small).** Have the bars grow from zero when the window opens, with today's bar in green, and replace the grey boxes with proper bars. Add a row of the last seven days as small squares, green for a win and grey for a loss, so the daily habit shows at a glance.

## Phone problems

- **On a small phone (360 by 640) the keyboard doesn't fit.** Only the top row of keys shows when the game opens. The rows with Enter and Backspace are off the bottom, and the floating pencil button sits on top of the P key ([phone-16](wordle/phone-16-small-phone-360x640.png)). A note in the game's own style sheet says it should fit this size without scrolling, but the site's menu bar, the "All games" link and the large title use up about 175 pixels above the board.
- **The pencil button crowds the keyboard on a normal phone too.** At 390 by 844 it sits just under the Backspace key once the hint line appears ([phone-08](wordle/phone-08-hint-shown.png)), and it covers the end of the verse on the result screen ([phone-09](wordle/phone-09-lost-result.png)).
- **The hint line pushes the keyboard down** by about 28 pixels mid-game. Moving keys under the thumb invite mistakes.
- The result card starts below the fold, as described above.
- Keys are 31 pixels wide on a 390-wide phone. That is normal for a full keyboard in a word game, and the height of 51 pixels is generous.

## Accessibility

- **No visible keyboard focus.** The game has its own gold focus ring, but the site's global rule that removes all focus outlines (your choice of 6 October 2026) overrides it, so tabbing to Share shows nothing ([desktop-09](wordle/desktop-09-keyboard-focus-share.png)). As with the quiz, a suggestion that keeps that look: give a focused key or button the same lift or gold edge it gets on hover.
- **Colour-blind players lose more from the keyboard fault.** The high-contrast setting works well on the board, with orange and blue ([phone-12](wordle/phone-12-high-contrast-board.png)), but the keyboard shows no colours in either mode.
- **Good:** physical keyboard typing works, every square and key tells a screen reader its letter and whether it is right, each guess is read out, the help, statistics and settings windows close with Escape and give focus back, the light theme works ([desktop-11](wordle/desktop-11-lost-result-light-theme.png)), and the turn and shake switch off under "reduce motion".

## Anything broken

- The keyboard never colours in (described above).
- The squares show their colour before they turn (described above).
- The cheer is shown twice on a win.
- The keyboard is cut off on a 360-by-640 phone, against the game's own stated target.

No errors appeared in the browser in any of the four games, and nothing scrolled sideways at any size.

## Note on the brief

This followed the shared brief. One difference from the other games: this one already has the shape of a real game, so most of the suggestions are about restoring and adding Wordle's well-known feel, not changing the layout. The first improvement is a fault fix and could be done before any design work.
