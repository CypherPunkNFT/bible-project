# Who's older? redesign (from its visual audit)

**Done:** 11 November 2026, sequence "Bible Guide: redesign every game from its audit", step 5. The audit it answers is [whos-older.md](whos-older.md); its screenshots are in [whos-older/](whos-older/) and the new ones in [whos-older/after/](whos-older/after/), named the same way so each stage pairs up. The shared instructions were [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md); my step's own brief added nothing that disagreed with it. No correction arrived during the job.

## 1. What changed

The game now looks like the face-off it always was. Two tall cards stand side by side at every size, each with a gold medallion carrying the person's initial, the name large in the site's serif and the role beneath, and a small hourglass between them in the game's gold whose sand trickles slowly and turns over, so the screen is never still. Above them a real scoreboard: the streak as a big number with a flame that lights from two in a row and pulses when it grows, or the score and three red hearts that crack and grey out one by one. A tap presses the card in; the right one tints green and a "Came first" stamp pops into its corner, a wrong pick goes red with a dashed edge, a cross stamp and a short shake, and the loser fades. The verdict rises in a band under the cards with Next inside it, and on a phone that band is pinned to the bottom of the screen, so the cards, the tick and the cross, and Next are all on one screen in every round. The timeline strip is now thick solid bars that draw in from the left with their years under their ends and a dashed bracket between them saying "at least 975 years", so the sentence under it reads as a caption of the proof. On Next, the person who stays slides into the left slot and the new challenger glides in from the right, so the "one stays" rule is finally seen. Five in a row bursts gold over the cards with its message on a small ribbon. The ending is a result card: the number counts up in gold, a ribbon and one burst for a new best, the milestone you reached as an italic line, a bar of this run against your best, a preview of the share text with Share under it, and the missed pairs each with their strip already drawn. The start screen shows a sample face-off (Moses and Paul, with the hourglass) over one row of Streak and Relaxed, with the best streak as a flame number. Rules, data, scoring, the saved game, the share text and the address are unchanged.

## 2. The audit's list, item by item

1. **Phone: keep the verdict visible, Next in reach.** Built as asked. The reveal is the kit's feedback band pinned to the bottom of the phone screen with Next in its first row; the two cards stay side by side above it with their marks showing. Measured on a 390 by 844 screen: the cards sit from 232 to 416 pixels and Next from about 450 to 494, in every round, right or wrong, milestone or not, in both themes ([phone-09](whos-older/after/phone-09-streak-reveal-right.png), [phone-14](whos-older/after/phone-14-streak-reveal-wrong.png)). The people's notes, the verse and the report link fold under "More about them", so the band stays short; as a safety net the band's reading can scroll inside it on a phone, so the row with Next can never leave the screen.
2. **Make the answer a moment, show the chain.** Built as asked. The chosen card presses, the stamp pops in with a scale, a wrong card shakes once, the bars draw in from the left over half a second and the years fade in after them, the streak number pulses up. On Next the stayer slides from the right slot into the left and the challenger arrives from the right ([desktop-12 sliding](whos-older/after/desktop-12-streak-round2-sliding.png), caught mid-slide). Nothing waits for an animation: the state changes at once, and reduced motion cuts the decoration to nothing.
3. **Give the cards presence.** Built, with one part done differently. The cards are tall (about 240 pixels on the desktop, 184 on a phone), the name is large serif, a medallion with the initial sits at the top, and the 1 and 2 key hints are small corner badges ([desktop-06](whos-older/after/desktop-06-streak-round1.png)). A bracketed qualifier ("mother of Jesus") becomes its own small line, so a long label never splits a name. **Not built: the Old Testament and New Testament tints.** The game's design says the card must never hint at a date, and a testament tint would answer most Easy pairs on sight. Instead the medallion tints only at the reveal: green on the one who came first, red on a wrong pick.
4. **Turn the status line into a scoreboard.** Built as asked. A large streak number with the kit's flame, hearts at 22 pixels that crack with a short twist and grey out when lost, and the milestone as a gold burst over the cards with its message on a ribbon ([desktop-13](whos-older/after/desktop-13-streak-milestone-5.png)). After a miss the scoreboard keeps the streak reached, so it reads "5" over "Run over, streak of 5", never "0" ([desktop-14](whos-older/after/desktop-14-streak-reveal-wrong.png)).
5. **End on a result card.** Built as asked. The number counts up in gold, "New best!" pops in with one gold-and-cream burst, the milestone you reached is the title line, a bar shows this run against your best, Share previews its text (and falls back to a copy box when the clipboard is blocked), and each missed pair has its strip drawn and its reason under it, with the people under a fold ([desktop-16](whos-older/after/desktop-16-streak-runover.png), [phone-16](whos-older/after/phone-16-streak-runover.png)). The burst and the ribbon do not fire again when an ended run is reopened after a reload; a test covers it.
6. **Make the timeline strip the proof.** Built as asked. Thick solid bars, the first person's in the game's gold, the years under each bar's ends (a narrow window gets one label, anchored to the end of the axis it sits at), a minimum visible width so Herod is a pill rather than a dot, and a dashed bracket between the bars labelled "at least 954 years". The names sit in a column of their own, so on a phone the labels no longer wrap into the next lane ([phone-09](whos-older/after/phone-09-streak-reveal-right.png)). An early-Genesis pair still shows no years at all, only "earlier" and "later", and a pair decided by a verse shows no bracket, because its windows may overlap.
7. **Show the game on the start screen.** Built as asked. A sample face-off of Moses and Paul with the hourglass, one row of Streak and Relaxed (each with a line and its best), difficulty pills at 44 pixels, and the best streak as a number with a flame. "How we date people" stays as it was ([desktop-01](whos-older/after/desktop-01-home.png), [phone-01](whos-older/after/phone-01-home.png)).

**My own additions.**
- **The hourglass.** The hub tile draws an hourglass between two portraits; the game now has one between its two cards, in the game's gold, whose sand runs out over seven seconds and then the glass turns over, looping slowly as the brief asks living details to. It pauses while the reveal is open and turns afresh with each round. On the start screen it stands between the sample cards, which breathe gently in turn.
- **Adam, Eve and Job never stay on.** The audit's note that these giveaways decided four of seven rounds is fixed in the dealing: a person with no real earliest year (the ten early-Genesis people and Job) is always the one who came first, so when they are the newer card the *other* person stays for the next round instead, and if that person had already stayed a fresh pair is dealt, so nobody is on screen three rounds running. A saved run is unaffected (its rounds are stored, not replayed), and the dealing tests were updated to use Abraham as the "stayer who came before nearly everyone" and now check the new rule.

## 3. Faults fixed

From "Phone problems": the sheet no longer hides the cards; Next is on screen in every round; the status no longer contradicts the band after a miss; the difficulty pills are 44 pixels tall (measured); the hearts are 22 pixels; the timeline labels sit on one line in their own column; the sticky hover is gone (hover styles apply only to devices that can hover, and after Next focus goes to the board, not to the first card, so nothing looks pre-selected).

From "Anything broken": the giveaway rule above; the score line after a miss. The verse-quoting pairs are rare because only 38 of the 124 facts carry a verse and most pairs are decided by their windows; that is the data, not a fault, and I left it. The report link is now muted and inside the fold, so Next is the brightest thing in the band.

From "Accessibility": the page no longer jumps 160 pixels after an answer (measured scroll of 0 at both sizes): focus goes to the Next button in the band without scrolling, so Enter carries on; the cards and buttons show focus with their own lift and gold edge; the verdict is a live region; right and wrong keep an icon and a word as well as a colour.

## 4. Before and after

| Stage | Before (audit) | After |
|---|---|---|
| Start, desktop | [desktop-01](whos-older/desktop-01-home.png) | [desktop-01](whos-older/after/desktop-01-home.png) |
| Start, phone | [phone-01](whos-older/phone-01-home.png) | [phone-01](whos-older/after/phone-01-home.png) |
| Relaxed open, phone | [phone-04](whos-older/phone-04-home-relaxed-open.png) | [phone-04](whos-older/after/phone-04-home-relaxed-open.png) |
| Round 1, desktop | [desktop-06](whos-older/desktop-06-streak-round1.png) | [desktop-06](whos-older/after/desktop-06-streak-round1.png) |
| Round 1, phone | [phone-06](whos-older/phone-06-streak-round1.png) | [phone-06](whos-older/after/phone-06-streak-round1.png) |
| Right answer, desktop | [desktop-09](whos-older/desktop-09-streak-reveal-right.png) | [desktop-09](whos-older/after/desktop-09-streak-reveal-right.png) |
| Right answer, phone | [phone-08](whos-older/phone-08-streak-reveal-right.png) | [phone-09](whos-older/after/phone-09-streak-reveal-right.png) |
| Next on the phone | [phone-10](whos-older/phone-10-streak-reveal-right-sheet-scrolled.png) | [phone-09](whos-older/after/phone-09-streak-reveal-right.png) (no scroll needed) |
| Mid-play, one stays | [desktop-12](whos-older/desktop-12-streak-round4-midplay.png) | [desktop-12 sliding](whos-older/after/desktop-12-streak-round2-sliding.png), [desktop-12](whos-older/after/desktop-12-streak-round2-midplay.png) |
| Five in a row | [desktop-13](whos-older/desktop-13-streak-milestone-5.png) | [desktop-13](whos-older/after/desktop-13-streak-milestone-5.png), [phone-13](whos-older/after/phone-13-streak-milestone-5.png) |
| Wrong answer, desktop | [desktop-14](whos-older/desktop-14-streak-reveal-wrong.png) | [desktop-14](whos-older/after/desktop-14-streak-reveal-wrong.png) |
| Wrong answer, phone | [phone-13](whos-older/phone-13-streak-reveal-wrong.png) | [phone-14](whos-older/after/phone-14-streak-reveal-wrong.png) |
| Run over, desktop | [desktop-16](whos-older/desktop-16-streak-runover.png) | [desktop-16](whos-older/after/desktop-16-streak-runover.png) |
| Run over, phone | [phone-15](whos-older/phone-15-streak-runover.png) | [phone-16](whos-older/after/phone-16-streak-runover.png) |
| Shared (copy box) | [desktop-20](whos-older/desktop-20-streak-runover-shared.png) | [desktop-20](whos-older/after/desktop-20-streak-runover-shared.png) |
| Reload mid-run | [desktop-21](whos-older/desktop-21-home-after-reload-midrun.png) | [desktop-21](whos-older/after/desktop-21-home-after-reload-midrun.png), [desktop-22](whos-older/after/desktop-22-streak-resumed.png) |
| Relaxed round, phone | [phone-22](whos-older/phone-22-relaxed-round1.png) | [phone-22](whos-older/after/phone-22-relaxed-round1.png) |
| Relaxed wrong, phone | [phone-23](whos-older/phone-23-relaxed-reveal-wrong.png) | [phone-23](whos-older/after/phone-23-relaxed-reveal-wrong.png) |
| Relaxed over | [desktop-29](whos-older/desktop-29-relaxed-runover.png) | [desktop-29](whos-older/after/desktop-29-relaxed-runover.png) |
| Light theme | [desktop-33](whos-older/desktop-33-light-reveal.png), [phone-32](whos-older/phone-32-light-reveal.png) | [desktop-33](whos-older/after/desktop-33-light-reveal.png), [phone-33](whos-older/after/phone-33-light-reveal.png) |
| Cannot load | [desktop-35](whos-older/desktop-35-cant-load.png) | [desktop-38](whos-older/after/desktop-38-cant-load.png) |

## 5. Checks

All run from the Website folder after the last change, in this order.

- The game's tests and the hub's (`npx vitest run src/pages/games/whos-older src/pages/games/games.test.tsx`): 89 passed, 0 failed. New tests cover the strip's bars, years and bracket, the stayer rule and its giveaway exception, the slide classes, the scoreboard after a miss, keyboard play, the result card and "New best" not repeating after a reload.
- `npm run typecheck`: exit 0.
- `npx eslint src/pages/games/whos-older`: 0 errors, 0 warnings.
- The English check (`py -3.12 content/translation/english_build_check.py`): 0 unregistered texts, 0 new.
- `npm run build`: exit 0 (four times; the later ones after the strip's bracket, the result bars and the year labels on narrow bars were tidied from the screenshots).
- Play-through on the preview with Playwright at 1440 and 390, dark and light, fresh and from a saved game: start, Relaxed open, a Streak run by tap and by keyboard through the five-in-a-row milestone to a miss, the result card, Share with the clipboard blocked, a reload mid-run and Continue, a Relaxed Easy run to the last heart, the light theme, and a game that cannot load. Console errors: 0 at both sizes. The kit was not changed, so its tests were not needed.

Commit: `797ab41782e29e2d2284bcbd35ec8e23baeade83` on `main`, "Redesign: Who's older? (from its visual audit)", pushed to origin; a second small commit records this hash in the report. Nothing was released.

## 6. Left for later

- The cards carry an initial in a medallion rather than a drawn portrait; drawing 160 faces in the hub's engraving style is a job of its own.
- Sound was not added.
