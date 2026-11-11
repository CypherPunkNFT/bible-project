# Memory card match redesign (from its visual audit)

**Done:** 11 November 2026, sequence "Bible Guide: redesign every game from its audit", step 8. The audit it answers is [memory-match.md](memory-match.md); its screenshots are in [memory-match/](memory-match/) and the new ones in [memory-match/after/](memory-match/after/), named the same way so each stage pairs up (the desktop numbers run one ahead of the phone's from stage 8, as in the audit; stages 41 to 46 are new moments the audit had no shot of). The shared instructions were [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md); my step's own brief said the same things and added one line, that the card flip is the heart of this game and should be the best flip on the site. No correction arrived during the job.

## 1. What changed

The board now behaves like cards on a table. A new board deals in, each card dropping into place a few hundredths of a second after the one before. A tap turns a card over in a true arc: it lifts towards you, tilts a touch at the half-turn, throws a soft shadow onto the table underneath, lands, and a faint sheen crosses its face as it settles, all in under half a second with the hub's easing. Two cards that are not a pair tilt side to side with a thin red edge the moment the second one lands, and a tap anywhere on the board, or on either card, turns them back at once; the timed turn-back is still there for anyone who waits. A pair is stamped with a teal tick in the corner, takes its colour, settles once, then both cards lift off the board together and fly up to a shelf above the grid, where a small card in that colour lands in the next empty slot. Behind them the board keeps a flat, faint, empty slot, so the board visibly empties as you play, and the shelf fills. Tapping the shelf opens the pairs found as plain text. Above the shelf a row of dots fills in each pair's colour, the move count pops up each time it grows, three small stars dim one by one as the move thresholds pass so the player can see what they are still playing for, a flame lights from two pairs in a row, and the timer sits at the right. In pass and play the players are coloured chips with bars, the chip whose turn it is lifts, and when a non-pair hands the turn over a banner with the next name slides in over the shelf for a second and a half. The ending opens on one screen: the heading, the three stars dropping in one after another, the moves counting up beside the time, a "New best" ribbon with one burst of gold when it is one, and Play again and Change game right there; the stories wait below as light rows with a coloured rule, no boxes inside boxes. With two or more players the winner's name wears a crown and each player's line carries a small pile of the pairs they took. The start screen has a fan of three face-down cards beside the title, the front one turning over to show Daniel and back again on a slow loop, three chip rows, Deal, and the long tail of settings under "More options". Rules, data, scoring, saved progress (the same storage keys), keyboard play and the address are unchanged.

## 2. The audit's list, item by item

1. **Fix the two things that are broken.** Built as asked. Every new screen (a dealt board, the summary, the start screen after Quit) opens at the top of the page through the kit's scroll-to-top, keyed on the screen and the round; measured scroll is 0 after Play again and after Quit at both sizes and in both themes ([desktop-24](memory-match/after/desktop-24-play-again-as-seen.png), [phone-23](memory-match/after/phone-23-play-again-as-seen.png), [phone-25](memory-match/after/phone-25-start-after-quit-as-seen.png)). The three stars sit in a row ([desktop-21](memory-match/after/desktop-21-summary-solo.png)).
2. **Give a miss a beat.** Built as asked. When the second card lands, both cards tilt three degrees each way for half a second and take a thin red edge with a faint red tint; a tap anywhere on the board, on an empty slot, or on either of the two cards turns them back at once. The timed turn-back (3, 2.5 or 2 seconds by level) stays as the fallback. The "Turn them back" button is gone. The "When I tap" setting is kept, because it is a saved setting and an accessibility promise, but it has moved under "More options" on the start screen ([desktop-11](memory-match/after/desktop-11-wrong-pair-both-up.png), [desktop-43](memory-match/after/desktop-43-wrong-pair-turning-back-on-tap.png)).
3. **Let a match leave the board.** Built as asked, with one choice. The tick is a 20-pixel teal stamp in the corner of each card while the pair settles; about two thirds of a second after the turn, both cards lift, shrink and fly to their slot on the shelf, then the slot fills with a small card in the pair's colour and the board keeps a flat empty slot. The shelf is above the grid at both sizes rather than beside it on the desktop, because the shelf has one slot per pair from the deal (so the flight has a fixed target and nothing jumps), and twelve slots fit a row above the grid but not a column beside a Hard board. The shelf is one button that opens the pairs as text, rather than twelve tiny buttons, so the tap target is never under 44 pixels even at 320 wide. The "Pairs found" list is gone ([desktop-15](memory-match/after/desktop-15-right-pair-settled.png), [desktop-44](memory-match/after/desktop-44-right-pair-flying.png), [desktop-16](memory-match/after/desktop-16-mid-play-3-of-6.png), [desktop-46](memory-match/after/desktop-46-mid-play-shelf-open.png)).
4. **Give the bar a track.** Built as asked. Six, nine or twelve dots above the grid fill in each pair's colour as it is found (the kit's progress trail, extended to take a colour per dot), the move count pops when it grows, and three small stars show the stars still in hand: all three while the moves are within the three-star limit, two past it, one past the two-star limit, with the limits in words on hover ([desktop-16](memory-match/after/desktop-16-mid-play-3-of-6.png)). The limits are the thresholds the game already scored on; nothing about scoring changed.
5. **Make the end a moment.** Built as asked with the kit's result panel. The heading stays; the stars drop in one at a time; the moves count up beside the time; "New best" is a ribbon with one gold-and-cream burst; Play again and Change game sit right under; "The stories" follow below as rows the player scrolls to, each with a coloured rule, the verse, and the links ([desktop-21](memory-match/after/desktop-21-summary-solo.png), [phone-20](memory-match/after/phone-20-summary-solo.png)). On a 390 by 844 phone Play again sits at 356 to 401 pixels, on the first screen.
6. **Give two-player play a handover.** Built as asked. When the turn passes, the kit's hand-over card ("You're up" and the name) slides in over the shelf for a second and a half and fades; it never blocks a tap. The players are the kit's chips: the one whose turn it is lifts with its colour, the leader's chip takes a border, and a bar grows with each pair taken. At the end the winner's name carries a crown and each player's line has a pile of small cards in the colours of the pairs they took ([desktop-35](memory-match/after/desktop-35-two-players-turn-passed.png), [desktop-37](memory-match/after/desktop-37-summary-two-players.png)).
7. **Show cards on the start screen.** Built as asked. Three face-down cards fan out beside the title, and the front one turns over to show Daniel and back on a seven-second loop. The chip rows are three: Deck, How hard, Players. "Turn non-pairs back" and the timer switch live under "More options" ([desktop-01](memory-match/after/desktop-01-start.png), [phone-01](memory-match/after/phone-01-start.png), [desktop-41](memory-match/after/desktop-41-start-more-options-open.png)).

**My own additions.**
- **The flip itself**, as my brief asked. It was a flat 300-millisecond hinge; it is now a 420-millisecond arc with a lift, a tilt, a shadow and a sheen, and a card turning back makes the same journey in reverse. Hover and keyboard focus lift the card and colour its edge in teal; a press sinks it.
- **The deal.** A new board deals in card by card from the top, so a fresh board is a moment and not a page load.
- **A streak.** Two or more pairs in a row light a small flame with the count in the track, the kit's streak flame; it resets on a miss. It is decoration only and does not touch the score.
- **The best as stars.** On the start screen the saved best for the chosen deck and level shows its stars beside the words.

**Not added.** No share text: the game's design leaves sharing out on purpose, and the brief says to keep the share text as it is, which here means none. No sound.

## 3. Faults fixed

From "Anything broken": the page left scrolled after Play again and Quit (scroll measured at 0 after each); the stars stacked in a column (now a row); long words breaking mid-word on Hard phone boards (the text now breaks only at a word's own break points and hyphenates where the browser can; "the vine that withered" and "steadied the ark" fit whole at 390 and sideways).

From "Phone problems": Play again and Quit land at the top; the end screen's buttons are on the first screen; Hard words no longer break mid-word, and at 320 wide the Hard text drops a size so three-line stories keep inside their cards; a phone turned sideways gets shorter rows and a lower shelf (the columns stay as dealt, which the game's design requires, so a Hard board still scrolls a little sideways-on, 527 pixels on a 390-tall screen, down from 635); the "Turn them back" button at the bottom of the screen is gone, since a tap on the board does it.

From "Accessibility": keyboard focus is visible as the card's lift and teal edge (no outline, as the site rules require), on empty slots too; the Who and Story labels on a face are 10 pixels instead of 8; the stamp is 20 pixels; the track's words are 12 and 18 pixels. Every flip, pair and miss is still announced; face-down text is still kept out of the page; the timer can still be hidden; reduced motion still cross-fades the faces and now also skips the flight and the deal; Windows high contrast gets borders for the empty slot, the miss edge, the stamp and the filled shelf slot.

## 4. Before and after

| Stage | Before (audit) | After |
|---|---|---|
| Start, desktop | [desktop-01](memory-match/desktop-01-start.png) | [desktop-01](memory-match/after/desktop-01-start.png) |
| Start, phone | [phone-01](memory-match/phone-01-start.png) | [phone-01](memory-match/after/phone-01-start.png) |
| Two players' names | [desktop-04](memory-match/desktop-04-start-two-players-names.png) | [desktop-04](memory-match/after/desktop-04-start-two-players-names.png) |
| See the pairs first | [desktop-05](memory-match/desktop-05-study-pairs-first.png) | [desktop-05](memory-match/after/desktop-05-study-pairs-first.png) |
| Easy board dealt, desktop | [desktop-06](memory-match/desktop-06-board-easy-dealt.png) | [desktop-06](memory-match/after/desktop-06-board-easy-dealt.png) |
| Easy board dealt, phone | [phone-06](memory-match/phone-06-board-easy-dealt.png) | [phone-06](memory-match/after/phone-06-board-easy-dealt.png) |
| Hover | [desktop-08](memory-match/desktop-08-board-easy-hover-card.png) | [desktop-08](memory-match/after/desktop-08-board-easy-hover-card.png) |
| First card mid-flip | [desktop-09](memory-match/desktop-09-first-card-mid-flip.png), [phone-08](memory-match/phone-08-first-card-mid-flip.png) | [desktop-09](memory-match/after/desktop-09-first-card-mid-flip.png), [phone-08](memory-match/after/phone-08-first-card-mid-flip.png) |
| Wrong pair, both up | [desktop-11](memory-match/desktop-11-wrong-pair-both-up.png), [phone-10](memory-match/phone-10-wrong-pair-both-up.png) | [desktop-11](memory-match/after/desktop-11-wrong-pair-both-up.png), [phone-10](memory-match/after/phone-10-wrong-pair-both-up.png) |
| Wrong pair turned back | [desktop-13](memory-match/desktop-13-wrong-pair-turned-back.png) | [desktop-13](memory-match/after/desktop-13-wrong-pair-turned-back.png), and the tap that did it [desktop-43](memory-match/after/desktop-43-wrong-pair-turning-back-on-tap.png) |
| Right pair, settled | [desktop-15](memory-match/desktop-15-right-pair-settled.png), [phone-14](memory-match/phone-14-right-pair-settled.png) | [desktop-15](memory-match/after/desktop-15-right-pair-settled.png), [phone-14](memory-match/after/phone-14-right-pair-settled.png) |
| Right pair leaving the board | none | [desktop-44](memory-match/after/desktop-44-right-pair-flying.png), [desktop-45](memory-match/after/desktop-45-right-pair-on-shelf.png) |
| Mid-play, desktop | [desktop-16](memory-match/desktop-16-mid-play-3-of-6.png) | [desktop-16](memory-match/after/desktop-16-mid-play-3-of-6.png) |
| Mid-play, phone | [phone-15](memory-match/phone-15-mid-play-3-of-6.png) | [phone-15](memory-match/after/phone-15-mid-play-3-of-6.png) |
| The shelf opened | none | [desktop-46](memory-match/after/desktop-46-mid-play-shelf-open.png) |
| Keyboard focus | [desktop-18](memory-match/desktop-18-keyboard-focus-on-card.png) | [desktop-18](memory-match/after/desktop-18-keyboard-focus-on-card.png) |
| Reload mid-board | [desktop-19](memory-match/desktop-19-reload-mid-board-resumed.png) | [desktop-19](memory-match/after/desktop-19-reload-mid-board-resumed.png) |
| Summary, desktop | [desktop-21](memory-match/desktop-21-summary-solo.png), [desktop-22](memory-match/desktop-22-summary-solo-fullpage.png) | [desktop-21](memory-match/after/desktop-21-summary-solo.png), [desktop-22](memory-match/after/desktop-22-summary-solo-fullpage.png) |
| Summary, phone | [phone-20](memory-match/phone-20-summary-solo.png), [phone-21](memory-match/phone-21-summary-solo-fullpage.png) | [phone-20](memory-match/after/phone-20-summary-solo.png), [phone-21](memory-match/after/phone-21-summary-solo-fullpage.png) |
| Play again as seen | [desktop-24](memory-match/desktop-24-play-again-as-seen.png), [phone-23](memory-match/phone-23-play-again-as-seen.png) | [desktop-24](memory-match/after/desktop-24-play-again-as-seen.png), [phone-23](memory-match/after/phone-23-play-again-as-seen.png) |
| Quit confirm | [desktop-25](memory-match/desktop-25-quit-confirm.png) | [desktop-25](memory-match/after/desktop-25-quit-confirm.png) |
| Start after Quit as seen | [desktop-26](memory-match/desktop-26-start-after-quit-as-seen.png), [phone-25](memory-match/phone-25-start-after-quit-as-seen.png) | [desktop-26](memory-match/after/desktop-26-start-after-quit-as-seen.png), [phone-25](memory-match/after/phone-25-start-after-quit-as-seen.png) |
| Start with a best | [desktop-27](memory-match/desktop-27-start-with-best.png) | [desktop-27](memory-match/after/desktop-27-start-with-best.png) |
| Medium board | [desktop-28](memory-match/desktop-28-board-medium-dealt.png) | [desktop-28](memory-match/after/desktop-28-board-medium-dealt.png) |
| Hard board, desktop | [desktop-30](memory-match/desktop-30-board-hard-dealt.png), [desktop-32](memory-match/desktop-32-board-hard-two-up.png) | [desktop-30](memory-match/after/desktop-30-board-hard-dealt.png), [desktop-32](memory-match/after/desktop-32-board-hard-two-up.png) |
| Hard board, phone, two up | [phone-31](memory-match/phone-31-board-hard-two-up.png) | [phone-31](memory-match/after/phone-31-board-hard-two-up.png) |
| Two players, turn passed | [desktop-35](memory-match/desktop-35-two-players-turn-passed.png), [phone-34](memory-match/phone-34-two-players-turn-passed.png) | [desktop-35](memory-match/after/desktop-35-two-players-turn-passed.png), [phone-34](memory-match/after/phone-34-two-players-turn-passed.png) |
| Two players, after a match | [desktop-36](memory-match/desktop-36-two-players-after-match.png) | [desktop-36](memory-match/after/desktop-36-two-players-after-match.png) |
| Summary, two players | [desktop-37](memory-match/desktop-37-summary-two-players.png) | [desktop-37](memory-match/after/desktop-37-summary-two-players.png) |
| 320 wide, Hard | [phone-40](memory-match/phone-40-narrow-320-hard-two-up.png) | [phone-40](memory-match/after/phone-40-narrow-320-hard-two-up.png) |
| Sideways phone, Hard | [phone-41](memory-match/phone-41-landscape-hard-board.png) | [phone-41](memory-match/after/phone-41-landscape-hard-board.png) |
| Light theme | [desktop-39](memory-match/desktop-39-light-theme-board.png) | the whole run again in light (the light shots follow the phone's numbering at both sizes): [light-desktop-06](memory-match/after/light-desktop-06-board-easy-dealt.png), [light-desktop-15](memory-match/after/light-desktop-15-mid-play-3-of-6.png), [light-desktop-10](memory-match/after/light-desktop-10-wrong-pair-both-up.png), [light-desktop-20](memory-match/after/light-desktop-20-summary-solo.png), [light-phone-15](memory-match/after/light-phone-15-mid-play-3-of-6.png), [light-phone-20](memory-match/after/light-phone-20-summary-solo.png) |

## 5. Checks

All run from the Website folder after the last change to the code.

| Check | Result |
|---|---|
| The game's tests, the hub's and the kit's (`npx vitest run src/pages/games/memory-match src/pages/games/games.test.tsx src/pages/games/kit`) | 120 passed, 0 failed (the game page's 12 include 5 new: the miss and the tap-back, the stamp, the flight and the shelf, the stars in hand, the ending and the scroll, the hand-over) |
| Typecheck (`npm run typecheck`) | exit 0 |
| ESLint on the game folder and the kit, zero warnings | exit 0 |
| English check (`py -3.12 content/translation/english_build_check.py`) | 0 unregistered, 0 new |
| Build (`npm run build`) | exit 0, twice (once more after the phone fixes) |
| Playwright on the preview at 1440 and 390, dark and light, fresh storage and a reload mid-board | 0 console errors in all four runs; no sideways scroll at 320, 390, 844 or 1440 |

Before any code was written the plan went through one review pass that read it as a security and correctness reviewer, a reliability reviewer and a platform reviewer in turn; its five changes (timed phases that only decorate a state already set, a finish that never waits for the flight, one tap handler, a shelf with a fixed slot per pair and one button, names in their own elements) are in the build.

**Commit:** (filled in below once made).

## 6. Left for later

- The last pair of a board does not fly to the shelf: the ending opens at once, as the rule that nothing waits for an animation requires; the stars dropping in carry that moment instead.
- A phone turned sideways still scrolls a little on Hard, because the columns are fixed when the cards are dealt (the game's design, so a turned phone never moves a card).
- No sound.
