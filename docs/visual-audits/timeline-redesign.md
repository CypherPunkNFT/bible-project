# Timeline sort, redesigned from its audit

Done 11 November 2026 on the local preview, from [the audit of 10 November](timeline.md) and [the redesign brief](REDESIGN-BRIEF.md). This was your example of a good game, so the brief for this step said: refine, do not reinvent; the drag and drop stays and gets better. That is what was done. The rules, the events, the scoring, the four tries, the saved game, the share text and the address are exactly as they were. The after-screenshots are in [timeline/after/](timeline/after/), named like the audit's so they pair up.

## 1. What changed

The game now looks and answers like a card game on a timeline. The start screen is a lobby: today's puzzle sits as a small fanned stack of six face-down cards carrying its number and your streak flame, the three Practice levels are three little stacks of four, five and seven cards you tap, and the part of the Bible is a row of era chips along a thin line instead of a drop-down. On the board a line runs down the left with a dot at every slot, from "Creation" at the top to "The early church" at the bottom, and the events hang off it as proper cards of one height with rounded corners, a soft shadow and a faint drawing in the corner (a crown, waves, a scroll, a star). While you drag, a dashed outline shows the slot the card will land in, and the card you hold tilts a little in your hand. When you press Check, the cards in the right place turn over one after another, top to bottom, to show their date on a green back with a small lock, the wrong ones give a short shake, two neighbours that belong together get a bridge with the word "together" on it, and one of the four small card backs at the top turns over with that try's count. When the round ends, the result comes first and fits one phone screen: "Solved it!" with a burst of gold and cream, or "Not this time" with a line naming the cards you did have right, the score once, your grid of squares, Share, the streak with its flame and the countdown. Below it the true order is one connected timeline of short rows on a shared axis of years; tap a row to open its verse, its people and the reason it comes next, and the pieces of the line you had the wrong way round are marked in the game's colour. On a win the rows hop in a wave.

## 2. The audit's list, item by item

1. **Fix the broken pieces first.** Built as asked. The two navigation links now sit in one row with a divider between them ([desktop-02](timeline/after/desktop-02-dealt.png)). The first tap after a drag by the grip is no longer ignored: the game only swallows the click that follows a drop when the drag started on the card itself, and a fresh gesture always clears the old flag; a new test plays the exact sequence the audit found. The feedback pencil shrinks while a board is on screen on a phone, hides on a short one, and the Check bar leaves it room. The link and tick marks carry their words at every size ("Right place" on the turned card, "together" on the bridge). The score is shown once.
2. **Make Check a reveal you watch.** Built as asked. Right cards turn over (one after another, about a tenth of a second apart) to a green back with a lock, the words "Right place", the event and its date ("About 1945–1434 BC", or "Early Genesis" where the Bible gives no year); wrong cards shake and stay face up; joined pairs get a drawn bridge with the word; the tries are four small card backs at the top and one turns over per try to show how many were right ([desktop-06](timeline/after/desktop-06-after-try-1-ticks-joins.png), [desktop-07](timeline/after/desktop-07-after-try-2.png)). One difference: a turned card is not locked in place. The rules say the cards stay where you put them and can still be moved, so the lock is a mark, not a bolt. Under reduced motion the cards simply change. The result is announced once, by the status line, as before.
3. **Put the result first and the reading second.** Built as asked, with the shared kit's result panel: cheer or gentle "Not this time", the score once, the grid rows, Share, the streak with a small flame, the countdown and Practice now all on one phone screen ([phone-08](timeline/after/phone-08-solved-reveal.png)). Below, the true order is one connected timeline of short rows (title, date, a bar on the shared year axis when the round has one), each opening to its verse, people and reason ([desktop-14](timeline/after/desktop-14-practice-hard-result.png)). Your results so far (the spread of tries) is a fold under it. For Practice the stars fill in one by one. Built differently: Next round sits in the result panel on the first screen rather than fixed to the bottom of the phone, because with the result first there is nothing to scroll past to reach it.
4. **Put a real timeline on the play area.** Built as asked: the rail with a dot per slot, "Creation" and "The early church" at the ends, fixed-height cards with rounded corners and a soft shadow, a faint drawing of the event's kind in the corner, a dashed outline in the landing slot while you drag ([desktop-04](timeline/after/desktop-04-mid-drag.png)), and after a Check the dot of each right card fills green while its date appears on the turned card hung on the line. The drawing is read from the words of the event's title (king, sea, prophet, temple, born and so on), since the data has no "kind" field; an event with no matching word gets a plain card motif.
5. **Turn the start screen into a game lobby.** Built as asked: the fanned stack with the puzzle number and the streak flame, three card stacks for the levels, era chips on a mini-timeline ([desktop-01](timeline/after/desktop-01-start.png), [phone-01](timeline/after/phone-01-start.png)). The era names are unchanged. "How we order events" stays as a fold.
6. **Give the end moments some feeling.** Built as asked: on a win the rows of the true order hop in a wave and one short burst of gold and cream plays once over the cheer; on a loss or a round with no star, one line says "Close. You had these in the right place:" and names them; a perfect Practice streak gets its message and a slightly larger burst.

**My own additions.** The cards deal onto the rail one after another when a board opens, and the card you hold tilts a degree like a card in a hand. The grid of squares you will share is shown on screen as real squares, built row by row, not as a line of emoji. The lobby's top card breathes slowly, so the picture never sits dead.

## 3. Faults fixed

From "Anything broken": the run-together links, the ignored first tap after a grip drag, and the score shown twice. From "Phone problems": the pencil over Check, the small-phone board (on 360 by 640 all six cards and Check now fit, with the title smaller, the hint hidden and the cards a little shorter: [phone-16](timeline/after/phone-16-small-phone-360x640.png)), the tick and link marks without words, the list jumping after a Check (cards have one fixed height, so a mark never changes a row), and the long reading before Share (one screen now). From "Accessibility": a card focused from the keyboard gets the same lift and edge it gets when picked up ([desktop-15](timeline/after/desktop-15-keyboard-focus-card.png)), with no outline.

## 4. Before and after

| Stage | Before | After |
|---|---|---|
| Start, desktop | [desktop-01](timeline/desktop-01-start.png) | [desktop-01](timeline/after/desktop-01-start.png) |
| Start, phone | [phone-01](timeline/phone-01-start.png) | [phone-01](timeline/after/phone-01-start.png) |
| Dealt, desktop | [desktop-02](timeline/desktop-02-dealt.png) | [desktop-02](timeline/after/desktop-02-dealt.png) |
| Dealt, phone | [phone-02](timeline/phone-02-dealt.png) | [phone-02](timeline/after/phone-02-dealt.png) |
| A card lifted by a tap | [desktop-03](timeline/desktop-03-card-lifted-tap.png) · [phone-03](timeline/phone-03-card-lifted-tap.png) | [desktop-03](timeline/after/desktop-03-card-lifted-tap.png) · [phone-03](timeline/after/phone-03-card-lifted-tap.png) |
| Mid-drag | [desktop-04](timeline/desktop-04-mid-drag.png) · [phone-04](timeline/phone-04-mid-drag-long-press.png) | [desktop-04](timeline/after/desktop-04-mid-drag.png) · [phone-04](timeline/after/phone-04-mid-drag.png) |
| After try 1 | [desktop-06](timeline/desktop-06-after-try-1-ticks-joins.png) · [phone-06](timeline/phone-06-after-try-1-ticks-joins.png) | [desktop-06](timeline/after/desktop-06-after-try-1-ticks-joins.png) · [phone-06](timeline/after/phone-06-after-try-1-ticks-joins.png) |
| After try 2 | [desktop-07](timeline/desktop-07-after-try-2.png) · [phone-07](timeline/phone-07-after-try-2.png) | [desktop-07](timeline/after/desktop-07-after-try-2.png) · [phone-07](timeline/after/phone-07-after-try-2.png) |
| Solved | [desktop-08](timeline/desktop-08-solved-reveal.png) · [phone-08](timeline/phone-08-solved-reveal.png) | [desktop-08](timeline/after/desktop-08-solved-reveal.png) · [phone-08](timeline/after/phone-08-solved-reveal.png) |
| Solved, whole page | [desktop-08 full](timeline/desktop-08-solved-reveal-fullpage.png) · [phone-08 full](timeline/phone-08-solved-reveal-fullpage.png) | [desktop-08 full](timeline/after/desktop-08-solved-reveal-fullpage.png) · [phone-08 full](timeline/after/phone-08-solved-reveal-fullpage.png) |
| Share and stats | [desktop-09](timeline/desktop-09-daily-done-share-stats.png) · [desktop-10](timeline/desktop-10-after-share.png) | [desktop-09](timeline/after/desktop-09-daily-done-share-stats.png) (a row opened) · [desktop-10](timeline/after/desktop-10-after-share.png) · [phone-10](timeline/after/phone-10-after-share.png) |
| One try left | [desktop-11](timeline/desktop-11-loss-try-3-one-left.png) · [phone-11](timeline/phone-11-loss-try-3-one-left.png) | [desktop-11](timeline/after/desktop-11-loss-try-3-one-left.png) · [phone-11](timeline/after/phone-11-loss-try-3-one-left.png) |
| Lost | [desktop-12](timeline/desktop-12-lost-reveal.png) · [phone-12](timeline/phone-12-lost-reveal.png) | [desktop-12](timeline/after/desktop-12-lost-reveal.png) · [phone-12](timeline/after/phone-12-lost-reveal.png) |
| Practice, Hard, dealt | [desktop-13](timeline/desktop-13-practice-hard-dealt.png) · [phone-13](timeline/phone-13-practice-hard-dealt.png) | [desktop-13](timeline/after/desktop-13-practice-hard-dealt.png) · [phone-13](timeline/after/phone-13-practice-hard-dealt.png) |
| Practice result | [desktop-14](timeline/desktop-14-practice-result.png) · [phone-14](timeline/phone-14-practice-result.png) · [phone-15 Easy](timeline/phone-15-practice-easy-result.png) | [desktop-14](timeline/after/desktop-14-practice-hard-result.png) · [phone-14](timeline/after/phone-14-practice-hard-result.png) · [phone-14 Easy](timeline/after/phone-14-practice-easy-result.png) |
| Keyboard focus and move | [desktop-15](timeline/desktop-15-keyboard-focus-card.png) · [desktop-16](timeline/desktop-16-keyboard-lifted-moved.png) | [desktop-15](timeline/after/desktop-15-keyboard-focus-card.png) · [desktop-16](timeline/after/desktop-16-keyboard-lifted-moved.png) |
| Small phone, 360 by 640 | [phone-16](timeline/phone-16-small-phone-360x640.png) | [phone-16](timeline/after/phone-16-small-phone-360x640.png) |
| Light theme | [phone-17](timeline/phone-17-light-theme-after-check.png) | [desktop-17](timeline/after/desktop-17-light-theme-after-check.png) · [phone-17](timeline/after/phone-17-light-theme-after-check.png) · [desktop-17 start](timeline/after/desktop-17-light-start.png) · [desktop-18 solved](timeline/after/desktop-18-light-solved.png) |

## 5. Checks

All run from the Website folder after the last change to the code.

| Check | Result |
|---|---|
| The game's tests and the hub's (`npx vitest run src/pages/games/timeline src/pages/games/games.test.tsx`) | 83 passed, 0 failed (the page's 8 include 3 new: the marks after a try, the first tap after a grip drag, the lobby; plus 3 new for the card motifs) |
| Typecheck (`npm run typecheck`) | exit 0 |
| ESLint on the game folder, zero warnings | exit 0 |
| English check (`py -3.12 content/translation/english_build_check.py`) | 0 unregistered, 0 new |
| Build (`npm run build`) | exit 0, twice (once more after the two fixes from the first play-through) |
| Playwright on the preview at 1440 and 390, dark and light, fresh storage: a win in three tries, a loss in four, Practice on Hard and Easy, keyboard play, a 360 by 640 phone | 0 console errors; no sideways scroll at 360 |

The kit was not changed. Before any code was written the plan went through one review pass that read it as a security and correctness reviewer, a reliability reviewer and a platform reviewer in turn; its changes (a turn that is purely a decoration of a state already set, a drop that never swallows a tap from a new gesture, names in their own element, one fixed card height) are in the build.

**Commit:** 8a1ba1ad6 on main, pushed to origin and accepted, followed by 73b87863a (the same work with six files' line endings put back to LF) and a small commit recording these hashes in this report. Nothing was released or deployed.

## 6. Left for later

- The long-press drag on a real iPhone and a real Android phone is still to be tried by hand, as the game's design asks; the grip drag and tap-to-move were played in the test browser.
- The drawing in a card's corner is read from the title's words, so a few events get the plain card motif. A "kind" field in the event data would make every card specific.
- No sound.
