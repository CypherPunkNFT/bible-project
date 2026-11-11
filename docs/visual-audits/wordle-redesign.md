# Bible Wordle redesign (/games/wordle)

Built 11 November 2026 from [the audit](wordle.md), following [the redesign brief](REDESIGN-BRIEF.md). Step 2 of the games redesign sequence. The after-screenshots are in [wordle/after/](wordle/after/), named like the audit's so they pair up.

## What changed

The game now plays the way Wordle is remembered. Each letter you type gives a small pop. When you press Enter the row turns over one tile after another, and each tile stays blank until it is halfway round, so you hold your breath square by square. Only once the whole row has settled does the keyboard colour in, and each key that has just learnt something gives a small hop as it takes its colour. A win makes the five green tiles hop in a wave and a dark rounded pill above the board says the cheer once; a loss shows the answer in that same pill. About a second later the result rises where the keyboard was: on a phone it is a sheet over the lower half of the screen with the answer, the verse, the share grid and Share all in view without scrolling, and on a desktop it is a panel under the board. The answer is spelt in five green gold-edged tiles. Above the Share button you see your own coloured-square grid, exactly what will be sent. The hint is a small lamp beside the board that lights after the third guess, and the hint itself appears as a gold-edged ribbon in a slot that never moves the keys. Statistics has proper bars that grow when it opens, with today's in green, and a row of the last seven days. A small flame beside the date keeps the daily streak in view while you play. On phones the head is one compact block, so a small 360 by 640 phone now holds the whole keyboard. The rules, the daily word, the word list, the colouring, the scoring, the saved record, the share text and the address are exactly as they were.

## The audit's list, item by item

1. **Fix the two faults.** Built as asked. The keyboard colours green, yellow and grey (the plain key rule no longer overrides the colours), each tile shows its colour only at the half-turn (the tiles are now the shared kit's flip cards, which have two faces, so the colour cannot show early), and the keyboard takes its colours only after the row has finished turning.
2. **Make the win and the loss land.** Built as asked. The winning row hops tile by tile (the kit's hop wave), the cheer appears once in a dark pill above the board and fades, the loss shows the answer in that pill, letters pop as they are typed, and under "reduce motion" every one of these is cut to nothing with the game state unchanged.
3. **Give the ending its own moment.** Built as asked, with one difference. The result rises about a second after the last turn, as a sheet over the lower half of a phone and as a panel under the board on a desktop; the answer is five green gold-edged tiles; the share grid preview sits above Share; the streak flame shows from two days in a row; the close button returns you to the board and a Show result button brings the panel back. The difference: the cheer line is kept inside the panel as well, because the design doc requires it there and a player who comes back later would otherwise never see it; the pill fades the moment the panel rises, so only one cheer is ever on screen at a time.
4. **Fit the phone.** Built differently. On phones the title, the date (in its short form) and the three icons sit in one compact block of two tight lines, about 60 pixels shorter than before, and the "All games" link became the arrow at the left of that block rather than going into the site menu, which this job may not change. The board's size is now worked out from the height of the screen first, so a 360 by 640 phone shows all three rows of keys. The site's floating pencil button shrinks and steps aside while a game is in progress on a phone, and on a short phone it hides until the game is over.
5. **Make the hint feel like part of the game.** Built as asked. The lamp sits at the right of the slot under the board, dim until the third guess, then lights in the game's gold with one soft ring. Pressed, the hint appears as a gold-edged ribbon in that slot, and the keys do not move.
6. **Make the statistics window feel earned.** Built as asked. The bars grow from zero when the window opens, today's bar is green, and a row of the last seven days shows a green square for a win, a grey one for a loss and an empty one for a day with no record. To make that row truthful the saved record now remembers the last fourteen finished puzzles; records saved before today simply start the row from today, and nothing else in the record changed.

**My own additions.**

- The keyboard colours in with a small hop on each key that has just taken a colour, so the keyboard visibly "thinks with you" row by row, not only the board.
- The streak flame sits beside the date in the head during play, not only at the end, so the daily habit is in view from the moment the page opens.

## Faults fixed

- The keyboard never coloured in: fixed.
- The tiles showed their colour before they turned: fixed, structurally, by the two-faced tile.
- The cheer was shown twice on a win: fixed; it is in the pill while the row hops, then only in the panel.
- The keyboard was cut off on a 360 by 640 phone: fixed by the compact head and the height-based tile size.
- The pencil button crowded the keyboard and covered the end of the verse on phones: it steps aside during play and the result sheet sits above it.
- The hint line pushed the keyboard down mid-game: the hint now lives in a slot of fixed height.
- The result started below the fold on phones: it is a sheet in view.
- No visible keyboard focus: the game's own focus outline rule is gone (the site forbids outlines) and every key, button, lamp and link now shows focus as the same lift and gold edge it shows under the mouse.

One phone limit to know about: keys are 44 pixels tall everywhere, but ten keys across a 320 to 390 pixel screen cannot each be 44 pixels wide; they are about 31 pixels wide on a 390 phone, as they were and as every full-keyboard word game has them.

## Before and after

| Stage | Before | After |
|---|---|---|
| First visit, How to play | [desktop-01](wordle/desktop-01-first-visit-help.png) · [phone-01](wordle/phone-01-first-visit-help.png) | [desktop-01](wordle/after/desktop-01-first-visit-help.png) · [phone-01](wordle/after/phone-01-first-visit-help.png) |
| Start | [desktop-02](wordle/desktop-02-start.png) · [phone-02](wordle/phone-02-start.png) | [desktop-02](wordle/after/desktop-02-start.png) · [phone-02](wordle/after/phone-02-start.png) |
| Row turning midway | [desktop-03](wordle/desktop-03-row-turning-midway.png) · [phone-04](wordle/phone-04-row-turning-midway.png) | [desktop-03](wordle/after/desktop-03-row-turning-midway.png) · [phone-04](wordle/after/phone-04-row-turning-midway.png) |
| Refused row | [desktop-04](wordle/desktop-04-not-enough-letters.png) · [phone-06](wordle/phone-06-not-in-word-list.png) | [desktop-04](wordle/after/desktop-04-not-enough-letters.png) · [phone-06](wordle/after/phone-06-not-in-word-list.png) |
| Mid-play, keyboard | [desktop-05](wordle/desktop-05-midplay.png) · [phone-07](wordle/phone-07-midplay-hint-offered.png) | [desktop-05](wordle/after/desktop-05-midplay.png) · [phone-07](wordle/after/phone-07-midplay-hint-offered.png) |
| Hint shown | [phone-08](wordle/phone-08-hint-shown.png) | [phone-08](wordle/after/phone-08-hint-shown.png) |
| Winning row turning | [desktop-06](wordle/desktop-06-winning-row-turning.png) · [phone-14](wordle/phone-14-winning-row-turning.png) | [desktop-06](wordle/after/desktop-06-winning-row-turning.png) · [phone-14](wordle/after/phone-14-winning-row-turning.png) |
| The win's hop and cheer (new) | — | [desktop-06b](wordle/after/desktop-06b-win-hop-and-cheer.png) · [phone-14b](wordle/after/phone-14b-win-hop-and-cheer.png) |
| Won result | [desktop-07](wordle/desktop-07-won-result.png) · [phone-15](wordle/phone-15-won-result.png) | [desktop-07](wordle/after/desktop-07-won-result.png) · [phone-15](wordle/after/phone-15-won-result.png) |
| Won result, light theme | — | [desktop-07 light](wordle/after/desktop-07-won-result-light-theme.png) · [phone-15 light](wordle/after/phone-15-won-result-light-theme.png) |
| Statistics | [desktop-08](wordle/desktop-08-statistics.png) · [phone-10](wordle/phone-10-statistics.png) | [desktop-08](wordle/after/desktop-08-statistics.png) · [phone-10](wordle/after/phone-10-statistics.png) |
| Keyboard focus on Share | [desktop-09](wordle/desktop-09-keyboard-focus-share.png) | [desktop-09](wordle/after/desktop-09-keyboard-focus-share.png) · [after sharing](wordle/after/desktop-09b-shared-copied.png) · [result closed](wordle/after/desktop-09c-result-closed.png) |
| Lost result | [desktop-10](wordle/desktop-10-lost-result.png) · [phone-09](wordle/phone-09-lost-result.png) | [desktop-10](wordle/after/desktop-10-lost-result.png) · [phone-09](wordle/after/phone-09-lost-result.png) |
| Lost result, light theme | [desktop-11](wordle/desktop-11-lost-result-light-theme.png) | [desktop-11](wordle/after/desktop-11-lost-result-light-theme.png) |
| Settings, high contrast | [phone-11](wordle/phone-11-settings.png) · [phone-12](wordle/phone-12-high-contrast-board.png) | [phone-11](wordle/after/phone-11-settings.png) · [phone-12](wordle/after/phone-12-high-contrast-board.png) |
| Small phone, 360 by 640 | [phone-16](wordle/phone-16-small-phone-360x640.png) | [phone-16](wordle/after/phone-16-small-phone-360x640.png) |

## Checks

All run from the Website folder on 11 November 2026, after the last change:

- The game's tests, the hub's and the kit's (`npx vitest run src/pages/games/wordle src/pages/games/games.test.tsx src/pages/games/kit`): 11 files, 123 tests, all passed. Three page tests were added (the lamp stays dark until the third guess and the keyboard learns each row; Escape closes the result and Show result brings it back with the share grid letter-free; the last-seven-days row), one storage test was added for the recent-days history, and one existing assertion was narrowed to the long date so the short phone date does not match it twice. No threshold was lowered.
- Typecheck (`npm run typecheck`): passed.
- Lint on the game folder and the kit, zero warnings: passed.
- The English check (`py -3.12 content/translation/english_build_check.py`): 0 unregistered texts, 0 new.
- The build (`npm run build`, native): passed; the preview shows this build.
- Played on the preview with Playwright at 1440 by 900 and 390 by 844, dark and light, from a fresh browser (the How to play panel opens) and from a browser that had seen it: a win in three, a refused short row and an unknown word, a loss in six with the hint, Statistics, Settings with high contrast, the Share button by keyboard and by click, closing and reopening the result with Escape and Show result, and a 360 by 640 phone. No console errors in any run.
- Commit on main: d022cf7d6, "Redesign: Bible Wordle (from its visual audit)", pushed to origin and accepted. (This line was added in a small follow-up commit, since the hash is only known after the first.)

## Left for later

- The seven-day row only knows days finished from today on; there is no history to recover for earlier days, and the audit's older records are not changed.
- Sound was not added (the brief leaves it optional).
