# Emoji stories: the redesign report

**Written:** 11 November 2026, sequence 46 step 4, from the audit in [emoji-stories.md](emoji-stories.md) and the shared brief in [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). The game lives at `/games/emoji-stories`; its code is in [src/pages/games/emoji-stories/](../../src/pages/games/emoji-stories/). Before-screenshots are in [emoji-stories/](emoji-stories/), after-screenshots in [emoji-stories/after/](emoji-stories/after/).

My step's brief added one special requirement: the three modes (Practice, Daily, Show a room) all keep working, and Show a room is the model for the game feel. It did not disagree with the shared brief.

## 1. What changed

The game now plays like a card game instead of a form. Each puzzle's emoji are dealt in one at a time, left to right, on soft tiles the colour of the game, and a story of five or six emoji stays on one line even on a phone. Under them sit four answer cards with a serif number in a circle; they lift under the pointer, press down when tapped, and stay on screen after the answer: the card you picked presses in, the right one lights green with a tick a beat later, a wrong pick turns red with a cross and a short shake, and the other two fade. At the same moment a band rises under the cards with "Right!" or "Not this time" and the points earned, and the Next button is inside it, pinned to the bottom of a phone screen so it is never below the fold. The title, the verse and the links follow below for anyone who wants to read on, and each emoji's passage word appears under its own tile instead of in a separate list. Above the puzzle, ten small squares fill green, amber (right after a hint) or red as you go, and the running score pops when it grows. Hints are plain lines with a thin edge in the game's colour that slide in one by one, and three gold coins beside the Hint button dim as hints are spent. The round ends on a result card: the score counts up out of 30, a line in the hub's gold italic names the round ("Well told", "Storyteller"), the ten squares hop in a wave for 27 or more and a perfect 30 gets one short gold burst, "New best" appears when it is one, and Play again and Back to the start are on the first screen, with Share and the ten puzzles folded below. The Daily shows its two or three guess rows from the start, each guess turning its row red, amber or green with the verdict in words, and Share now says "Copied" or shows "Copy this" over the text when the clipboard is blocked. Show a room keeps the big one-at-a-time clues, now on tiles with empty places showing how many clues are to come, puts the four choices up as large lettered cards (the right one lights and the rest fade on Reveal), and gives the leader a team tally: add teams, tap "Got it" after each answer, and the round ends naming the winner. The start screen shows the game itself (the Noah example as dealt tiles with its answer as a settled green card), puts the three Play buttons on the first phone screen, and folds the settings behind one row.

Kept exactly: the 106 stories and their data, the dealing and the fairness rules for wrong choices, the hints and their order, the scoring (3, 2, 1, 0), the Daily's logic, guesses and share text, the saved records under the same storage keys (a round saved yesterday still comes back), the address, keyboard play (1 to 4, Enter, the room's arrow, Space, H, C, N), and everything the audit praised: emoji named for screen readers, the dashed box for a missing emoji, the proper combobox for typing, the reveal title taking focus, right and wrong always in words as well as colour.

## 2. The audit's list, item by item

1. **Turn the answer into a moment, in place.** Built as asked. The four cards stay mounted; the picked card presses in, the right card tints green with a tick (a quarter-second later when it was not the one picked, a decoration only: the state changes at once and reduced motion zeroes the delay), the picked wrong card tints red with a cross and a shake, the other two fade. The band carries "Right!" or "Not this time", the points ("3 points", "0 points") and Next. One difference from the audit's wording: the reading (title, verse, links) sits below the band in the normal flow rather than inside it, because a band taller than a phone screen would push Next off the top; the band itself stays within one screen and is sticky on phones. Once a puzzle is answered the keys 1 to 4 and the cards do nothing, so a second press can never change the score.
2. **Make the four answers cards.** Built as asked with the shared kit's answer card: a surface, rounded corners, a circled serif number, a lift and shadow on hover and on keyboard focus (the site has no focus outline), a press on tap, and a dealt-in stagger when the puzzle begins. The number sits in its own row and the title has the full width, so a long title such as "Jacob's dream of a stairway to heaven" reads in two lines at 390 wide; the cards have a fixed height so a mark never jumps the row.
3. **Deal the emoji in, on tiles.** Built as asked: soft tiles tinted with the game's colour, dealt left to right, and the passage words appear under each tile in place at hint 2 and at the reveal (the word line is reserved from the start, so nothing jumps). Built differently in one respect: the tiles are sized by how many emoji the story has, so five or six stay on one line at 390 wide, which also fixes the phone problem of a wrapped fifth emoji.
4. **Draw the score as ten squares.** Built as asked with the kit's progress trail (green, amber for right-with-a-hint, red, the current puzzle outlined, the newest popping) and a running score that pops when it grows. The end screen counts the score up, shows the same squares, says "New best" when it is one, and offers a Share line of the squares ("Emoji stories · Practice 27/30", the ten squares, the address), new in this redesign; the Daily's share text is unchanged.
5. **Make hints feel like spending.** Built with a correction to the audit's arithmetic: three coins sit beside the Hint button and dim as hints are opened, but only two can dim, because the third hint is free (the rules give 3, 2, 1, 1 points). Hints slide in as plain lines with a thin edge in the game's colour rather than as pills, to keep to the owner's rule against boxes around everything. The coins are decoration; the button's label still says "(−1 point)" or "(free)".
6. **Give the Daily Wordle-style guess tiles.** Built as asked: two or three empty rows (as many as the mode allows) are on screen from the start, the next one outlined; each guess turns its row red, amber ("Right person, different story") or green with the verdict in words; the solved screen rises the band, the stats fade in one after another, and the kit's Share button says "Copied", or writes "Copy this" above the text when it cannot copy.
7. **Stage the room and keep a score.** Built as asked, with one change: there is no dark stage panel around the clues, because the owner's rules forbid boxes inside boxes and a black stage leans towards the arcade look; the page itself is the stage. The clues deal in on tiles, with faint empty places for the clues still to come; the four choices are large lettered cards (A to D) and Reveal lights the right one and fades the rest. The team tally: the leader opens "Teams", adds up to six, names them (or they are "Team 1", "Team 2"), and after each Reveal taps the team that got it (a second tap undoes it). The chips show the scores with a bar against the leader, and the round ends with "Winner" (or "Winners" for a tie) above the names. The tally lives in the page only and is never stored, as the design says a room stores nothing.

**My own additions.** The Noah example on the start screen is a live puzzle: its tiles deal in and then breathe one after another on a slow nine-second loop (switched off under reduced motion), and its answer sits beside it as a settled green card, so the first screen shows what the game looks like. On the result card the ten squares hop in a wave for 27 or more and a perfect 30 gets one short gold-and-cream burst over the number, once, never on a reload. The running score pops each time it grows.

## 3. Faults fixed

- **Screens kept the old scroll position**, so a puzzle or a room started from a scrolled phone page opened off the top. Every new screen (a puzzle, the result, the Daily, the start) now scrolls to the top through the kit's shared hook; a saved game's return on a reload is left alone.
- **"Stop this round" overdrew the "All games" link** (and "Back to the start" in the Daily). The button now sits on its own line under the link.
- **The Share status was empty when the clipboard was blocked.** The kit's Share button writes "Copy this" over the box, "Copied" otherwise, in both the Daily and the new Practice share.
- **The room kept no score.** The team tally above.
- **The start page was long** on a phone, with Start practice at the edge of the first screen and the room button a screen below: the settings are behind one fold, so all three buttons sit on the first screen.
- **The room did not fit a phone**: the clue tiles are sized by the story's count, the controls are 44 pixels tall, the keys line is hidden on touch screens, Full screen is hidden where the browser cannot do it (iPhones), and the full-screen room can scroll.
- **Play again was below the fold** on the score screen: the result card puts it on the first screen and folds the ten puzzles below.
- **Five-emoji stories wrapped** at 390 wide: fixed by the tile sizing.
- **No visible keyboard focus** on answers or Next: a focused card lifts with the game's edge, a focused button lifts and gains an inset edge, without an outline.
- **"Try again" on the failed-load screen looked like text**: it is now underlined in the game's colour and 44 pixels tall.
- **Right was lavender**, the Gospels colour, while every share grid is green: right is now the kit's green everywhere in the game.
- All tap targets are at least 44 pixels: the buttons, the chips, the hint button, the suggestions, the links in the reveal, the fold rows.

## 4. Before and after

Every after-shot has the same name as its before-shot, so each pair can be opened side by side: before in [emoji-stories/](emoji-stories/), after in [emoji-stories/after/](emoji-stories/after/). The after set also has light-theme copies of the Daily and room screens (the `-light` names), one more on the result card's Share line (`desktop-23b-practice-end-share.png`) and one on the room's team award (`desktop-45b-room-story-1-awarded.png`). The four that tell the story best:

| Screen | Before | After |
|---|---|---|
| A puzzle answered right, desktop | [desktop-08](emoji-stories/desktop-08-practice-round-1-reveal-right.png): the four buttons gone, a text block of verdict, title, verse, word list, and Next at the bottom of it | [after/desktop-08](emoji-stories/after/desktop-08-practice-round-1-reveal-right.png): the six emoji on tiles with their words under them, the four cards still there with the right one green and ticked, the band "Right! 3 points" with Next, the reading below |
| A puzzle answered wrong, phone | [phone-14](emoji-stories/phone-14-practice-round-2-reveal-wrong.png): a fifth emoji wrapped to a second line and the verdict as plain text | [after/phone-14](emoji-stories/after/phone-14-practice-round-2-reveal-wrong.png): the story on one line, the picked card red with a cross, the right one green, "Not this time · 0 points" and Next in the band pinned to the bottom |
| The end of a Practice round, phone | [phone-21](emoji-stories/phone-21-practice-end.png): "Your score: 27 of 30" as a line, then the list of ten, with Play again below the fold | [after/phone-21](emoji-stories/after/phone-21-practice-end.png): the score counted up large, "Well told" in the hub's gold italic, the ten squares, Play again and Back to the start on the first screen, Share and the ten puzzles folded below |
| The Daily, desktop | [desktop-31](emoji-stories/desktop-31-daily-guess-1-wrong.png): "Guess 2 of 3" as a line and a list of tried titles | [after/desktop-31](emoji-stories/after/desktop-31-daily-guess-1-wrong.png): three rows, the first red with "Not this one", the second outlined as the next, the third empty |

Other pairs worth a look: the start ([desktop-01](emoji-stories/desktop-01-start.png) against [after/desktop-01](emoji-stories/after/desktop-01-start.png): the live Noah example and the settings behind one row), the room's choices ([phone-44](emoji-stories/phone-44-room-story-1-choices.png) against [after/phone-44](emoji-stories/after/phone-44-room-story-1-choices.png): the clue tiles with empty places, the lettered cards, the team chips) and the room's end ([desktop-49](emoji-stories/desktop-49-room-end.png) against [after/desktop-49](emoji-stories/after/desktop-49-room-end.png): the winner named with the scores).

Two of the audit's shots have no after-shot: `desktop-33-daily-guess-2-close` and `phone-33`, because today's Daily (puzzle #3) has no story that shares a person with it, so the "right person, different story" verdict could not be produced in the play-through (a unit test covers it instead). Three after-shots have no before-shot (`desktop-10`, `desktop-17`, `desktop-51`, with their phone twins), because the audit's own set skipped those numbers; they show the second puzzle as it lands after Next, the fourth puzzle in the light theme after a reload, and Practice as it lands after Start.

## 5. Checks

All run on 11 November 2026 after the last change, from the Website folder.

| Check | Command | Result |
|---|---|---|
| Unit tests, this game | `npx vitest run src/pages/games/emoji-stories` | 7 files, 63 tests passed; six are new: two in the game's test file (the team tally, and a restored round not counting again) and four in the new `redesign.test.ts` (the verdict words, the room's team names and rows, and the Practice share text) |
| Unit tests, whole site | `npx vitest run` | 3,336 passed, 4 marked by the suite itself as expected failures, none in the games, exit 0 |
| Types | `npm run typecheck` | exit 0 |
| Lint | `npx eslint src/pages/games/emoji-stories` | 0 errors, 0 warnings |
| English check | inside `npm run build` (prebuild) | 0 unregistered texts in 1,837 page files, 0 new |
| Build | `npm run build` | exit 0 (one Tailwind warning about an ambiguous class in `src/components/atlas/OldMapsFold.tsx`, not touched by this work) |
| Play-through | Playwright, 1440 x 900 and 390 x 844, dark and light, against the preview on port 8931 | exit 0, 0 console errors, 167 after-shots |

What the play-through measured, beyond the screenshots:

- **Next is on the first screen** after every answer: at 600 (right) and 720 (wrong) of 900 on desktop, at 614 and 734 of 844 on the phone, with the page not scrolled.
- **Play again is on the first screen** of the result card: its bottom edge at 424 of 900 on desktop and 400 of 844 on the phone.
- **All three Play buttons are on the first phone screen**: Start practice ends at 195 and Start a room round at 372 of 844.
- **Every landing is at the top of the page**: Practice after Start, each puzzle after Next, the result, the Daily, the room and its second story, in both themes, and Practice started from a start page scrolled to the bottom.
- **The keyboard works as before**: 1 to 4 picks, Enter moves on, the room's arrow, Space, H, C and N still do their jobs, and a pick after the reveal changes nothing.
- **A reload mid-round restores the puzzle** without moving focus or counting the answer again.

Commit on `main`: `d64c1a6a4ff5d46ecc25dc867788f49f9ca730e7`, "Redesign: Emoji stories (from its visual audit)".

## 6. Left for later

- **The room's emoji at 1440 wide** are about 97 pixels, where the design asked for 120 and more. The tiles are sized by the story's count so that a six-emoji story fits the 720-pixel column; a wider column for the room alone would be a layout change for the hub to decide.
- **The "right person, different story" verdict** is unit-tested but has no after-shot, because the puzzle of the day had no story sharing its person.
- **The sound and haptics** the audit mentioned under "how the best-known games do it" are not built: the hub has no sound yet and the owner's rules do not ask for it.
- **The Daily's share text is unchanged** on purpose; the audit's idea of adding the ten-square line to it would change what people already post.
