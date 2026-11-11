# Redesign: Bible crossword (/games/crossword)

**Written:** 11 November 2026, from the audit [crossword.md](crossword.md) and the shared brief [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). Before-screenshots are in [crossword/](crossword/), after-screenshots in [crossword/after/](crossword/after/), named the same way so they pair up. My step's own brief and the shared brief did not disagree. The one thing my brief adds is that the grid, the clues, the check and reveal logic and the puzzle data stay as they are, and they do.

## 1. What changed

The crossword now looks like a crossword and plays like a game. The grid has solid dark blocks in a tight frame, in the game's Gospels purple: the square you are on wears a purple ring with a small arrow for the direction, the rest of its word a purple band, and every letter you type pops in. When a word fills, its squares pulse once; when a check or a reveal confirms a word, its clue takes a small gold tick. A thin row of dots above the grid fills as words complete, with the count and a quiet clock beside it. On a phone the page is one screen: the grid at the top, and pinned to the bottom the clue bar with left and right arrows and the word's letters so far, the keys, and one row of tools (Clues, Check, Reveal, More). The Across and Down lists slide up as a sheet when you ask for them and close the moment you pick a clue, so you never lose sight of the grid. Check and Reveal are two small menus instead of nine pills; Reveal all, New puzzle and Change puzzle ask first in the site's own dialog, with Cancel. The last right letter sends a gold wave across the squares, "Solved!" scales in with one burst of gold and cream confetti, the time and the word count stand above the usual stats, a clean solve gets a gold award mark, and a new best time says so. The start screen is a shelf: a card per theme with a little grid drawing, the sizes drawn as grids, a live preview of the shape your choices will make, the hub's engraving beside the title, and your solved count and best time underneath. Rules, clue data, scoring, the saved-game key, the address and keyboard play (letters, Backspace, arrows, Space, Tab, Enter) are unchanged, and a puzzle saved before today still loads.

## 2. The audit's list, item by item

1. **Rebuild the phone layout around the grid and the keyboard.** Built as asked. Under 900 pixels the grid sits at the top in a frame that pans itself to the selected word (the page never scrolls), and the clue bar with ‹ › arrows, the keys and the tool row are pinned to the bottom of the screen. The Across and Down lists live in a sheet behind a Clues button and close on a pick; Clear, New puzzle and Change puzzle sit behind a More menu. Squares are at least 36 pixels on a phone, so a 13-wide grid pans sideways inside its frame rather than being clipped.
2. **Make the grid look like a crossword.** Built as asked. Empty squares are solid blocks (a near-black mix in the dark theme, so the dark theme has the same contrast as the light one), the frame is the grid's own edge, the numbers are a third of the square, the selected square has a purple ring and a tiny arrow pointing across or down.
3. **Let the finish be an event.** Built as asked. A gold wave crosses the squares from top left to bottom right, "Solved!" scales in with one confetti burst from the kit, the time taken and the number of words stand above the stats line, a clean solve gets a gold award mark and a quicker clean solve gets "New best". The clock is part of the saved game, so a reload mid-puzzle keeps the time; a save from before today has no time and is shown without one.
4. **Give typing and words feedback.** Built, one part differently. Letters pop in, the on-screen key dips and tints on press, and a word that fills pulses once. The gold tick in the list appears when a word is confirmed by a check or a reveal, not merely when it is filled: a tick for every filled-and-right word would be a free check and would change the game's rules, which the brief keeps. A filled but unconfirmed word gets a small purple dot instead.
5. **Show progress.** Built with the kit's progress trail rather than a bar: one purple dot per word above the grid, the current word ringed, with the count ("7 / 12") and the clock beside it. The start screen shows "Solved" and "Best time" for the chosen size in place of the grey sentence.
6. **Tidy the tools and protect progress.** Built as asked. Check and Reveal are menus; Reveal all opens the kit's confirm dialog with Cancel; New puzzle and Change puzzle ask the same way when letters have been typed and act at once when nothing would be lost; the tools sit above the keys on a desktop, in view.
7. **Turn the start screen into a shelf of puzzles.** Built as asked. Theme cards with a small grid drawing each, the sizes drawn as three, four and five-square grids, the book list on its own "Or one book" card, and a preview of the puzzle's shape that is laid out a moment after each choice; "Make my crossword" opens exactly the puzzle previewed.

**My own additions.** The clue bar shows the word's letters so far as a strip under the clue, with the square you are on underlined, so on a phone you can read the word even while the grid is panned. The hub's lamp-lit crossword engraving sits beside the title on the start screen. On the solved screen, resting on an answer in the list lights up its word on the grid. The ‹ › arrows wrap round at the ends.

## 3. Faults fixed

- Landing in the wrong place after "Make my crossword": the page now opens at the top when a puzzle opens or the start screen returns (the kit's scroll-to-top).
- The selected square hiding under the header after a clue was picked: the grid's frame pans itself and the page is never scrolled, so the square is always in view.
- The medium grid ten pixels too wide at 390: squares are at least 36 pixels and the frame pans; nothing is clipped.
- The page four screens tall on a phone: it is one screen, with the lists in a sheet.
- Small squares and 7-pixel numbers: squares are 36 to 44 pixels on a phone and the numbers are a third of the square.
- The clue bar not sticky: it is pinned to the bottom with the keys.
- No visible keyboard focus on the start screen or the tools: every button lifts and takes a purple edge on focus, with no outline.
- Greyed-out sizes explaining themselves only on hover: the note under the sizes now says a greyed-out choice has too few clues, and the greyed buttons point to it for screen readers.
- "New puzzle" and "Change puzzle" discarding a puzzle with no warning: both ask when letters would be lost.
- The "Yes, reveal all" button staying armed: the confirmation is a dialog with Cancel and goes away on its own.
- The floating correction pencil sat over the Backspace key on a phone: the pinned tool row leaves it room.

## 4. Before and after

| Stage | Before (desktop) | After (desktop) | Before (phone) | After (phone) |
|---|---|---|---|---|
| Start | [01](crossword/desktop-01-start.png) | [after](crossword/after/desktop-01-start.png) | [01](crossword/phone-01-start.png) | [after](crossword/after/phone-01-start.png) |
| Start, full page | [02](crossword/desktop-02-start-fullpage.png) | [after](crossword/after/desktop-02-start-fullpage.png) | [02](crossword/phone-02-start-fullpage.png) | [after](crossword/after/phone-02-start-fullpage.png) |
| Start, keyboard focus | [03](crossword/desktop-03-start-primary-focused.png) | [after](crossword/after/desktop-03-start-primary-focused.png) | [03](crossword/phone-03-start-primary-focused.png) | [after](crossword/after/phone-03-start-primary-focused.png) |
| Exodus, Hard | [04](crossword/desktop-04-start-exodus-hard.png) | [after](crossword/after/desktop-04-start-exodus-hard.png) | [04](crossword/phone-04-start-exodus-hard.png) | [after](crossword/after/phone-04-start-exodus-hard.png) |
| A book chosen | [05](crossword/desktop-05-start-book-chosen.png) | [after](crossword/after/desktop-05-start-book-chosen.png) | [05](crossword/phone-05-start-book-chosen.png) | [after](crossword/after/phone-05-start-book-chosen.png) |
| Ready, Medium | [06](crossword/desktop-06-start-ready-medium.png) | [after](crossword/after/desktop-06-start-ready-medium.png) | [06](crossword/phone-06-start-ready-medium.png) | [after](crossword/after/phone-06-start-ready-medium.png) |
| First open | [07](crossword/desktop-07-play-first-open.png) | [after](crossword/after/desktop-07-play-first-open.png) | [07](crossword/phone-07-play-first-open.png) | [after](crossword/after/phone-07-play-first-open.png) |
| Play, full page | [08](crossword/desktop-08-play-fullpage.png) | [after](crossword/after/desktop-08-play-fullpage.png) | [08](crossword/phone-08-play-fullpage.png) | [after](crossword/after/phone-08-play-fullpage.png) |
| First word typed | [09](crossword/desktop-09-play-first-word-typed.png) | [after](crossword/after/desktop-09-play-first-word-typed.png) | [09](crossword/phone-09-play-first-word-typed.png) | [after](crossword/after/phone-09-play-first-word-typed.png) |
| Direction toggled | [10](crossword/desktop-10-play-direction-toggled.png) | [after](crossword/after/desktop-10-play-direction-toggled.png) | [10](crossword/phone-10-play-direction-toggled.png) | [after](crossword/after/phone-10-play-direction-toggled.png) |
| Check letter, wrong | [11](crossword/desktop-11-play-check-letter-wrong.png) | [after](crossword/after/desktop-11-play-check-letter-wrong.png) | [11](crossword/phone-11-play-check-letter-wrong.png) | [after](crossword/after/phone-11-play-check-letter-wrong.png) |
| Check puzzle | [12](crossword/desktop-12-play-check-puzzle-wrong.png) | [after](crossword/after/desktop-12-play-check-puzzle-wrong.png) | [12](crossword/phone-12-play-check-puzzle-wrong.png) | [after](crossword/after/phone-12-play-check-puzzle-wrong.png) |
| Reveal letter | [13](crossword/desktop-13-play-reveal-letter.png) | [after](crossword/after/desktop-13-play-reveal-letter.png) | [13](crossword/phone-13-play-reveal-letter.png) | [after](crossword/after/phone-13-play-reveal-letter.png) |
| Reveal word | [14](crossword/desktop-14-play-reveal-word.png) | [after](crossword/after/desktop-14-play-reveal-word.png) | [14](crossword/phone-14-play-reveal-word.png) | [after](crossword/after/phone-14-play-reveal-word.png) |
| Mid play | [15](crossword/desktop-15-play-mid-play.png) | [after](crossword/after/desktop-15-play-mid-play.png) | [15](crossword/phone-15-play-mid-play.png) | [after](crossword/after/phone-15-play-mid-play.png) |
| Mid play, full page | [16](crossword/desktop-16-play-mid-play-fullpage.png) | [after](crossword/after/desktop-16-play-mid-play-fullpage.png) | [16](crossword/phone-16-play-mid-play-fullpage.png) | [after](crossword/after/phone-16-play-mid-play-fullpage.png) |
| Down clue picked | [17](crossword/desktop-17-play-down-clue-picked.png) | [after](crossword/after/desktop-17-play-down-clue-picked.png) | [17](crossword/phone-17-play-down-clue-picked.png) | [after](crossword/after/phone-17-play-down-clue-picked.png) |
| On-screen key tapped | [18](crossword/desktop-18-play-onscreen-key-tapped.png) | [after](crossword/after/desktop-18-play-onscreen-key-tapped.png) | [18](crossword/phone-18-play-onscreen-key-tapped.png) | [after](crossword/after/phone-18-play-onscreen-key-tapped.png) |
| Reveal all, confirm | [19](crossword/desktop-19-play-reveal-all-confirm.png) | [after](crossword/after/desktop-19-play-reveal-all-confirm.png) | [19](crossword/phone-19-play-reveal-all-confirm.png) | [after](crossword/after/phone-19-play-reveal-all-confirm.png) |
| Solved (helped) | [20](crossword/desktop-20-solved.png) | [after](crossword/after/desktop-20-solved.png) | [20](crossword/phone-20-solved.png) | [after](crossword/after/phone-20-solved.png) |
| Solved, full page | [21](crossword/desktop-21-solved-fullpage.png) | [after](crossword/after/desktop-21-solved-fullpage.png) | [21](crossword/phone-21-solved-fullpage.png) | [after](crossword/after/phone-21-solved-fullpage.png) |
| Solved after reload | [22](crossword/desktop-22-solved-after-reload.png) | [after](crossword/after/desktop-22-solved-after-reload.png) | [22](crossword/phone-22-solved-after-reload.png) | [after](crossword/after/phone-22-solved-after-reload.png) |
| Start after a solve | [23](crossword/desktop-23-start-after-solved.png) | [after](crossword/after/desktop-23-start-after-solved.png) | [23](crossword/phone-23-start-after-solved.png) | [after](crossword/after/phone-23-start-after-solved.png) |
| Hard, Large chosen | [24](crossword/desktop-24-start-hard-large.png) | [after](crossword/after/desktop-24-start-hard-large.png) | [24](crossword/phone-24-start-hard-large.png) | [after](crossword/after/phone-24-start-hard-large.png) |
| Large open | [25](crossword/desktop-25-play-large-open.png) | [after](crossword/after/desktop-25-play-large-open.png) | [25](crossword/phone-25-play-large-open.png) | [after](crossword/after/phone-25-play-large-open.png) |
| Large, full page | [26](crossword/desktop-26-play-large-fullpage.png) | [after](crossword/after/desktop-26-play-large-fullpage.png) | [26](crossword/phone-26-play-large-fullpage.png) | [after](crossword/after/phone-26-play-large-fullpage.png) |
| Large, panned right | [27](crossword/desktop-27-play-large-grid-scrolled-right.png) | [after](crossword/after/desktop-27-play-large-grid-scrolled-right.png) | [27](crossword/phone-27-play-large-grid-scrolled-right.png) | [after](crossword/after/phone-27-play-large-grid-scrolled-right.png) |
| Resumed after reload | [29](crossword/desktop-29-play-resumed-after-reload.png) | [after](crossword/after/desktop-29-play-resumed-after-reload.png) | [29](crossword/phone-29-play-resumed-after-reload.png) | [after](crossword/after/phone-29-play-resumed-after-reload.png) |
| New puzzle (now asks) | [30](crossword/desktop-30-play-new-puzzle.png) | [after](crossword/after/desktop-30-play-new-puzzle.png) | [30](crossword/phone-30-play-new-puzzle.png) | [after](crossword/after/phone-30-play-new-puzzle.png) |
| Small open | [31](crossword/desktop-31-play-small-open.png) | [after](crossword/after/desktop-31-play-small-open.png) | [31](crossword/phone-31-play-small-open.png) | [after](crossword/after/phone-31-play-small-open.png) |
| Last letter left | [32](crossword/desktop-32-play-small-last-word-left.png) | [after](crossword/after/desktop-32-play-small-last-word-left.png) | [32](crossword/phone-32-play-small-last-word-left.png) | [after](crossword/after/phone-32-play-small-last-word-left.png) |
| Solved clean | [33](crossword/desktop-33-solved-clean.png) | [after](crossword/after/desktop-33-solved-clean.png) | [33](crossword/phone-33-solved-clean.png) | [after](crossword/after/phone-33-solved-clean.png) |
| Solved clean, full page | [34](crossword/desktop-34-solved-clean-fullpage.png) | [after](crossword/after/desktop-34-solved-clean-fullpage.png) | [34](crossword/phone-34-solved-clean-fullpage.png) | [after](crossword/after/phone-34-solved-clean-fullpage.png) |
| Light, solved | [35](crossword/desktop-35-light-solved.png) | [after](crossword/after/desktop-35-light-solved.png) | [35](crossword/phone-35-light-solved.png) | [after](crossword/after/phone-35-light-solved.png) |
| Light, start | [36](crossword/desktop-36-light-start.png) | [after](crossword/after/desktop-36-light-start.png) | [36](crossword/phone-36-light-start.png) | [after](crossword/after/phone-36-light-start.png) |
| Light, checked and revealed | [37](crossword/desktop-37-light-play-checked-and-revealed.png) | [after](crossword/after/desktop-37-light-play-checked-and-revealed.png) | [37](crossword/phone-37-light-play-checked-and-revealed.png) | [after](crossword/after/phone-37-light-play-checked-and-revealed.png) |
| Landing after Make (phone only) | | | [phone-38](crossword/phone-38-play-landing-after-make.png) | [after](crossword/after/phone-38-play-landing-after-make.png) |
| After tapping a clue in the list (phone only) | | | [phone-39](crossword/phone-39-after-tapping-clue-in-list.png) | [after](crossword/after/phone-39-after-tapping-clue-in-list.png) |

New after-screenshots with no before: the gold wave as it crosses the grid ([desktop](crossword/after/desktop-33a-solved-wave.png), [phone](crossword/after/phone-33a-solved-wave.png)), the phone's clue sheet open ([dark](crossword/after/phone-16-play-clue-sheet-open.png), [light](crossword/after/phone-40-light-clue-sheet.png)).

## 5. Checks

Run from the Website folder on 11 November 2026, in this order, all passing:

- The game's tests and the hub's: `npx vitest run src/pages/games/crossword src/pages/games/games.test.tsx`, 42 tests, all pass (the page tests were rewritten for the menus, the dialogs and the clock; new tests cover the save fields, the confirmed-square rule and the clock).
- `npm run typecheck`: clean.
- `npx eslint src/pages/games/crossword --max-warnings 0`: clean.
- The English check (`py -3.12 content/translation/english_build_check.py`): 0 unregistered texts, 0 new in every net.
- `npm run build`: passed twice (once before the screenshot fixes, once after).
- Playwright play-through on the preview at 1440 and 390, dark and light, from fresh storage and from a saved game: start, a wrong letter checked, reveals, mid play, the clue sheet, the confirm dialogs, a reload mid-puzzle, a helped solve, a clean solve, the light theme. No console errors at either size.
- Commit: 66adb9723 on main, "Redesign: Bible crossword (from its visual audit)", pushed to origin. This note itself is a second small commit.

## 6. Left for later

- A long clue makes the phone's pinned clue bar four lines tall, which leaves less room for the grid on the smallest phones; a smaller clue type on phones would help.
- The site's floating correction pencil still sits over the right end of the pinned row; the row leaves it room rather than hiding it. Moving it on game pages would be a change to the site shell, which this job does not touch.
- Sound was not added.
