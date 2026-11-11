# Two truths and a lie: the redesign report

**Written:** 11 November 2026, sequence 46 step 3, from the audit in [two-truths.md](two-truths.md) and the shared brief in [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). The game lives at `/games/two-truths`; its code is in [src/pages/games/two-truths/](../../src/pages/games/two-truths/). Before-screenshots are in [two-truths/](two-truths/), after-screenshots in [two-truths/after/](two-truths/after/).

My step's brief added three special requirements: the reveal must turn the three statements over in place with Next on the first screen; group rounds must return to the top; and the award tap must show at once. None of them disagreed with the shared brief.

## 1. What changed

The round now reads as a game, not a form. The person's name sits over three dealt-in cards, each with a lettered circle, that lift under the pointer and press down when tapped. Tapping one marks it with the game's magenta edge and a small "Your pick" tag, and a single filled button, "That's the lie", locks it in (with "Pick again" as plain text beside it). At the reveal the three cards turn over where they stand, A, then B, then C a quarter-second apart: the two true ones come up tinted green with a tick and the word "True", the made-up one comes up red with a dashed edge, a cross, "Made up" and its sentence struck through. Under the made-up card the truth it twisted is written out and its verse is open; the other two verses fold out on request. At the same moment a band rises with "You spotted it" or "Not quite" and the Next button, pinned to the bottom of a phone screen so Next is never below the fold. Above the round, ten small squares fill green or red as you go, and a "Spotted" count pops when it grows. The ending is a result card: the score counts up from nought, the band line ("Well read", "Sharp eye") sits under it in the hub's gold italic, the ten squares hop in a wave for eight or more and a short gold burst greets a perfect ten, "New best" appears when it is one, and Share, Play again and Back to games are right there. The ten stories fold out below, one per person. Group play has a colour chip per team with a bar that grows against the leader, award toggles that fill and tick the instant they are tapped, and a finish that names the winner. The start screen shows the game: three sample cards, the third turning slowly over to show "Made up", then Best, Played and Average as three numbers, a filled Play button, and the group setup behind one fold.

Kept exactly: the statements and their data, the dealing, the ten-round rule and the group rule, the scoring and the band names, the share text (score, ten squares, address), the saved game under its two storage keys, the address, keyboard play (A, B, C or 1 to 3 to pick, Enter to confirm, Enter or Space to continue, 1 to 4 to award), and everything the audit praised: words as well as colour for True and Made up, the dashed edge on the lie, the verse references and Read in context links, the person's tag and page link hidden until the reveal.

## 2. The audit's list, item by item

1. **Make the reveal a turn-over, and bring Next up to the first screen.** Built as asked. Each statement is a kit flip card; the back is mounted only once the round is revealed, so nothing about which statement is the lie reaches the page before then. The three turn 250 milliseconds apart (the kit zeroes that under reduced motion). The verdict and Next are in the kit's feedback band, sticky at the bottom on phones and in the flow under the cards on a desktop. One difference: the verse fold-out sits under each card rather than inside it, so the card never changes height while it turns; the made-up statement's verse is open by default, the two true ones say "Show the verse".
2. **Draw the statements as cards and lock in with one button.** Built as asked: lettered circles, deal-in stagger, lift on hover and on keyboard focus, press on tap, the picked card's magenta edge and "Your pick" tag, one filled "That's the lie" button with "Pick again" as plain text.
3. **Put the ten squares on screen during play.** Built as asked with the kit's progress trail; the current round is an outlined square, the newest answered one pops, and a "Spotted" count stands beside them. The share text still draws the same squares.
4. **Turn the end screen into a result card.** Built as asked: the kit's result panel with the count-up, the band line in gold italic, the ten squares, a "New best" ribbon, the kit's Share button (which says "Copied" or shows "Copy this" over a box when the clipboard is blocked), Play again and Back to games on the first screen, and the ten stories as fold-outs that fetch their verse only when opened. The count-up, the hop and the ribbon play once, when the game ends on this page, and not again on a reload.
5. **Show "Reload evidence" only when a passage failed.** Built as asked: the button lives inside the failed-load alert and reloads only that passage.
6. **Give group mode teams and a winner.** Built as asked: the kit's team chips (the site's book colours, leaving out the game's own magenta) with scores and bars, award toggles that fill in the team's colour and show a tick the moment they are tapped (the pressed state no longer depends on the focus outline the site removes), a running score on each toggle, and a "Winner" line naming the leading team, or teams, at the finish. The old "Lions: 1 · Doves: 0" line is kept for screen readers.
7. **Show the game on the start screen.** Built as asked, with one change: the main button is filled in the game's colour rather than gold, because the brief makes each game's hub colour its colour inside. The sample trio is hand-written (Noah planted a vineyard; the ark came to rest on the mountains of Ararat; Noah had four sons), never dealt from the deck, so no real lie is given away. The group setup sits behind "Set up a group".

**My own additions.** The third sample card on the start screen turns slowly over to "Made up" and back on a nine-second loop, the game's one living detail (switched off under reduced motion). On the result card the ten squares hop in a wave for a score of eight or more, and a perfect ten gets one short gold burst over the number. The "Spotted" count pops when it grows.

## 3. Faults fixed

- **Next two screens down after every answer.** Next is in the band on the first screen, sticky on phones.
- **A wrong answer showed a green box first.** The three cards keep their places and turn in step; the red card is in view with the others, and the band says "Not quite" in red.
- **The end screen was nine phone screens tall.** The result card fits one screen; the stories fold.
- **Group rounds landed with the scores hidden, and starting a group from a scrolled start page left the round off-screen.** Every new screen (a round, the result, the start) scrolls to the top through the kit's scroll hook; a saved game's return is left alone.
- **The award tap looked like nothing happened.** The toggle fills and ticks at once.
- **The Share status was empty when the clipboard was blocked.** The kit's Share button writes "Copy this" above the box, "Copied" otherwise.
- **No visible keyboard focus.** A focused card lifts with a magenta edge, a focused button lifts, a focused fold underlines, all without an outline.
- **Not fixed: a failed game load shows the site's generic screen.** The statements ship inside the game's code chunk, so the site's chunk-failure handler answers before the game's own "Try again" can; that handler is outside the game's folder and this step may not change it. The game's own path is kept for the case where the chunk loads and the data does not.

## 4. Before and after

The after-screenshots were taken on the preview with Playwright at 1440 and 390 wide, dark and light, from a fresh browser each time; the same number is the same stage as in the audit. The four most telling pairs: the reveal, the wrong answer on a phone, the result card, and the group award.

| Stage | Before (desktop) | After (desktop) | Before (phone) | After (phone) |
|---|---|---|---|---|
| Start | [desktop-01](two-truths/desktop-01-start.png) | [desktop-01](two-truths/after/desktop-01-start.png) | [phone-01](two-truths/phone-01-start.png) | [phone-01](two-truths/after/phone-01-start.png) |
| Start, two teams | [desktop-03](two-truths/desktop-03-start-teams-2.png) | [desktop-03](two-truths/after/desktop-03-start-teams-2.png) | [phone-03](two-truths/phone-03-start-teams-2.png) | [phone-03](two-truths/after/phone-03-start-teams-2.png) |
| Round 1 | [desktop-04](two-truths/desktop-04-round-1.png) | [desktop-04](two-truths/after/desktop-04-round-1.png) | [phone-04](two-truths/phone-04-round-1.png) | [phone-04](two-truths/after/phone-04-round-1.png) |
| Hover on a statement | [desktop-06](two-truths/desktop-06-round-1-hover.png) | [desktop-06](two-truths/after/desktop-06-round-1-hover.png) | | |
| Picked | [desktop-07](two-truths/desktop-07-round-1-picked.png) | [desktop-07](two-truths/after/desktop-07-round-1-picked.png) | [phone-07](two-truths/phone-07-round-1-picked.png) | [phone-07](two-truths/after/phone-07-round-1-picked.png) |
| Pick again | [desktop-09](two-truths/desktop-09-round-1-pick-again.png) | [desktop-09](two-truths/after/desktop-09-round-1-pick-again.png) | [phone-09](two-truths/phone-09-round-1-pick-again.png) | [phone-09](two-truths/after/phone-09-round-1-pick-again.png) |
| Reveal, right, as it turns | [desktop-10](two-truths/desktop-10-round-1-reveal-correct-top.png) | [desktop-10](two-truths/after/desktop-10-round-1-reveal-correct-top.png) | [phone-10](two-truths/phone-10-round-1-reveal-correct-top.png) | [phone-10](two-truths/after/phone-10-round-1-reveal-correct-top.png) |
| Reveal, right, settled | [desktop-11](two-truths/desktop-11-round-1-reveal-correct.png) | [desktop-11](two-truths/after/desktop-11-round-1-reveal-correct.png) | [phone-11](two-truths/phone-11-round-1-reveal-correct.png) | [phone-11](two-truths/after/phone-11-round-1-reveal-correct.png) |
| Reveal, right, whole page | [desktop-12](two-truths/desktop-12-round-1-reveal-correct-fullpage.png) | [desktop-12](two-truths/after/desktop-12-round-1-reveal-correct-fullpage.png) | [phone-12](two-truths/phone-12-round-1-reveal-correct-fullpage.png) | [phone-12](two-truths/after/phone-12-round-1-reveal-correct-fullpage.png) |
| Round 2 | [desktop-13](two-truths/desktop-13-round-2.png) | [desktop-13](two-truths/after/desktop-13-round-2.png) | [phone-13](two-truths/phone-13-round-2.png) | [phone-13](two-truths/after/phone-13-round-2.png) |
| Reveal, wrong | [desktop-15](two-truths/desktop-15-round-2-reveal-wrong.png) | [desktop-15](two-truths/after/desktop-15-round-2-reveal-wrong.png) | [phone-15](two-truths/phone-15-round-2-reveal-wrong.png) | [phone-15](two-truths/after/phone-15-round-2-reveal-wrong.png) |
| Reveal, wrong, whole page | [desktop-16](two-truths/desktop-16-round-2-reveal-wrong-fullpage.png) | [desktop-16](two-truths/after/desktop-16-round-2-reveal-wrong-fullpage.png) | [phone-16](two-truths/phone-16-round-2-reveal-wrong-fullpage.png) | [phone-16](two-truths/after/phone-16-round-2-reveal-wrong-fullpage.png) |
| Keyboard pick | [desktop-17](two-truths/desktop-17-round-3-keyboard-pick-b.png) | [desktop-17](two-truths/after/desktop-17-round-3-keyboard-pick-b.png) | [phone-17](two-truths/phone-17-round-3-keyboard-pick-b.png) | [phone-17](two-truths/after/phone-17-round-3-keyboard-pick-b.png) |
| Focus on Next | [desktop-18](two-truths/desktop-18-round-3-reveal-focus-next.png) | [desktop-18](two-truths/after/desktop-18-round-3-reveal-focus-next.png) | | |
| Focus on a statement | [desktop-19](two-truths/desktop-19-round-4-keyboard-focus-statement.png) | [desktop-19](two-truths/after/desktop-19-round-4-keyboard-focus-statement.png) | | |
| Light theme, round | [desktop-20](two-truths/desktop-20-round-4-light.png) | [desktop-20](two-truths/after/desktop-20-round-4-light.png) | [phone-20](two-truths/phone-20-round-4-light.png) | [phone-20](two-truths/after/phone-20-round-4-light.png) |
| Light theme, reveal | [desktop-21](two-truths/desktop-21-round-4-light-reveal.png) | [desktop-21](two-truths/after/desktop-21-round-4-light-reveal.png) | [phone-21](two-truths/phone-21-round-4-light-reveal.png) | [phone-21](two-truths/after/phone-21-round-4-light-reveal.png) |
| Round 10 | [desktop-22](two-truths/desktop-22-round-10.png) | [desktop-22](two-truths/after/desktop-22-round-10.png) | [phone-22](two-truths/phone-22-round-10.png) | [phone-22](two-truths/after/phone-22-round-10.png) |
| Result | [desktop-24](two-truths/desktop-24-summary.png) | [desktop-24](two-truths/after/desktop-24-summary.png) | [phone-24](two-truths/phone-24-summary.png) | [phone-24](two-truths/after/phone-24-summary.png) |
| Result, whole page | [desktop-25](two-truths/desktop-25-summary-fullpage.png) | [desktop-25](two-truths/after/desktop-25-summary-fullpage.png) | [phone-25](two-truths/phone-25-summary-fullpage.png) | [phone-25](two-truths/after/phone-25-summary-fullpage.png) |
| Share | [desktop-26](two-truths/desktop-26-summary-share.png) | [desktop-26](two-truths/after/desktop-26-summary-share.png) | [phone-26](two-truths/phone-26-summary-share.png) | [phone-26](two-truths/after/phone-26-summary-share.png) |
| A story opened (new) | | [desktop-26b](two-truths/after/desktop-26b-summary-story-open.png) | | [phone-26b](two-truths/after/phone-26b-summary-story-open.png) |
| Start after a game | [desktop-27](two-truths/desktop-27-start-after-game.png) | [desktop-27](two-truths/after/desktop-27-start-after-game.png) | [phone-27](two-truths/phone-27-start-after-game.png) | [phone-27](two-truths/after/phone-27-start-after-game.png) |
| Group, teams named | [desktop-28](two-truths/desktop-28-start-group-named.png) | [desktop-28](two-truths/after/desktop-28-start-group-named.png) | [phone-28](two-truths/phone-28-start-group-named.png) | [phone-28](two-truths/after/phone-28-start-group-named.png) |
| Group round 1, as landed | [desktop-29](two-truths/desktop-29-group-round-1.png) | [desktop-29](two-truths/after/desktop-29-group-round-1.png) | [phone-29](two-truths/phone-29-group-round-1.png) | [phone-29](two-truths/after/phone-29-group-round-1.png) |
| Group reveal, as it turns | [desktop-31](two-truths/desktop-31-group-reveal-top.png) | [desktop-31](two-truths/after/desktop-31-group-reveal-top.png) | [phone-31](two-truths/phone-31-group-reveal-top.png) | [phone-31](two-truths/after/phone-31-group-reveal-top.png) |
| Group, award just tapped | [desktop-40](two-truths/desktop-40-group-award-just-tapped.png) | [desktop-40](two-truths/after/desktop-40-group-award-just-tapped.png) | [phone-40](two-truths/phone-40-group-award-just-tapped.png) | [phone-40](two-truths/after/phone-40-group-award-just-tapped.png) |
| Group, awarded | [desktop-33](two-truths/desktop-33-group-awarded.png) | [desktop-33](two-truths/after/desktop-33-group-awarded.png) | [phone-33](two-truths/phone-33-group-awarded.png) | [phone-33](two-truths/after/phone-33-group-awarded.png) |
| Group round 2, as landed after Next | [desktop-42](two-truths/desktop-42-group-round-2-as-landed-after-next.png) | [desktop-42](two-truths/after/desktop-42-group-round-2-as-landed-after-next.png) | [phone-42](two-truths/phone-42-group-round-2-as-landed-after-next.png) | [phone-42](two-truths/after/phone-42-group-round-2-as-landed-after-next.png) |
| Group finished | [desktop-35](two-truths/desktop-35-group-finished.png) | [desktop-35](two-truths/after/desktop-35-group-finished.png) | [phone-35](two-truths/phone-35-group-finished.png) | [phone-35](two-truths/after/phone-35-group-finished.png) |

Not retaken: the failed-load screen ([desktop-37](two-truths/desktop-37-cant-load.png)), which is the site's and unchanged (section 3).

## 5. Checks

All run from the Website folder after the last change to the game's files, in the brief's order. The test runner's own verdict, not this table, decides whether the step passes.

| Check | Result |
|---|---|
| The game's tests and the hub's (`npx vitest run src/pages/games/two-truths src/pages/games/games.test.tsx`) | 39 passed in 6 files |
| The kit's tests (the kit was not changed; the game imports it) | 44 passed in 3 files |
| Typecheck (`npm run typecheck`) | passed |
| Lint on the game folder (`npx eslint --max-warnings 0 src/pages/games/two-truths`) | passed, zero warnings |
| English on-screen text check (`py -3.12 content/translation/english_build_check.py`) | 0 unregistered, 0 new, every net 0 |
| Build (`npm run build`, native) | passed; the first attempt failed before Vite ran, when a pre-build script could not open a scholar-population data file that another chat has modified (a transient lock outside this game); the retry passed unchanged |
| Play-through with Playwright at 1440 and 390, dark and light, solo and group | no console errors; Next on the first screen after every answer (at most 796 of 900 pixels down on the desktop, 741 of 844 on the phone); every new round and the group's first round landed at the top |

Tests changed: the game's component tests now look for the cards, the lock-in button, the band, the folds, the trail, the ribbon and the winner line instead of the old headings and article list; the share-helper test was removed with the helper it tested, since sharing now goes through the kit's own tested button. No threshold was lowered.

**Commit:** on `main`, "Redesign: Two truths and a lie (from its visual audit)"; the hash is recorded in the line below once the commit exists.

## 6. Left for later

- The failed-load screen stays the site's generic one (section 3); fixing it means teaching the site's chunk-failure handler about games that carry their own data, which is outside this game's folder.
- Sound was not added.
- The verse behind a true statement still fetches only when its fold is opened, so a player who opens all three on a slow connection waits for each in turn; that is by design, to keep the reveal light.
- Nothing was deployed or released.
