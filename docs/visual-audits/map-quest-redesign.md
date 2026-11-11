# Redesign: Map quest (/games/map-quest)

**Written:** 11 November 2026, from the audit [map-quest.md](map-quest.md) and the shared brief [REDESIGN-BRIEF.md](REDESIGN-BRIEF.md). Before-screenshots are in [map-quest/](map-quest/), after-screenshots in [map-quest/after/](map-quest/after/), named the same way so they pair up. My step's own brief and the shared brief did not disagree. My brief adds one thing: the pin drop, the reveal of the true place and the score must land visibly, and the map data and tiles stay as they are. They do: only the map's colours and overlays changed, never its data or tiles.

## 1. What changed

Map quest now plays like the GeoGuessr-style game its engine always was. Above the map a row of five slots fills with each round's colour as you play, and the running total is a teal bar that grows, with the number counting up. The place name sits under them in the serif. Confirm floats inside the map's frame, so it is always in reach, with a one-line hint beside it until your first pin. A tap drops a gold pin that falls in with a shadow and a ring flashing where it landed; it lifts while you drag it. Confirm is now the moment: the page no longer jumps, the dashed line draws itself out from your pin to the true site over half a second in the round's colour, the true site lands as a dot with a slow breathing ring, and the answer rises as a sheet over the bottom of the map on a phone (a panel on the left of the map on a desktop) with the bullseye or square scaling in, the points counting up from zero over a bar that fills in the band's colour, and the verse folded under. A bullseye gets a small burst of gold. The dark map is now readable: the land lifted, the sea deepened, with a soft coastline, and Beginner shows the Sea of Galilee, the Dead Sea, the Jordan and the great seas by name. The end is a map of all five pins, true sites and lines, with the total counting up, a rank title (Wanderer to Cartographer), your best round, best ever and streak, the five slots hopping and confetti for a clean 5,000, and the list beneath. The home shows the hub's lamp-lit map engraving on the Daily Five card with the puzzle number and the five slots, levels and eras as pills, and a flame on the streak. Rules, data, scoring, share text, the saved-game key, the daily puzzle, the address and keyboard play are unchanged; a Daily Five saved yesterday resumes today.

## 2. The audit's list, item by item

1. **Keep the answer on screen and let it play out.** Built as asked. Focus no longer jumps the page: the kit's feedback band takes focus without scrolling, so the map stays where it is. The dashed line draws out from the pin to the true site over about half a second (at once under reduced motion), the true site is a dot in the round's colour with a ring that keeps breathing slowly, and the sheet carries the points counting up from zero over a thin bar that fills. On a phone the sheet covers the bottom of the map with Next in thumb reach and the verse scrolling inside it; on a desktop it is a panel on the left of the map. The map frames your pin and the true site clear of the sheet, with the padding capped so a small screen can always fit them.
2. **Make the dark map readable.** Built as asked, in the game's own style file only: the land is three shades lighter, the sea deeper, and a soft coastline follows the sea and the lakes (river polygons are left out, so the Nile keeps no banks). The atlas's own colours are untouched.
3. **Turn the name bar into a round strip and a score bar.** Built as asked with the kit's progress trail: five slots that fill in each round's colour (gold for a bullseye, then green, amber, orange, red), the current one ringed in teal; the running total is a bar that grows with the number counting up from the last total; the place name sits under them. The same five colours are the share squares at the end.
4. **Give the pin a drop.** Built as asked. The pin is the game's own marker: it falls in from above with a soft shadow, a ring flashes at its tip wherever it lands (and again when it is moved), and it lifts with a deeper shadow while dragged. The three-line help sentence is a one-line hint beside Confirm that goes after the first pin; the keyboard rule is in the map's spoken label.
5. **End on a map, not a table.** Built as asked. The summary opens on the total counting up with a rank title, then a still map with all five pins, true sites and lines in their colours, the five slots (which hop in turn when every round was a bullseye, with one burst of gold and cream confetti), the best round and best ever beside the streak, and the list beneath. A bullseye in a round also scales in with a small burst in the sheet.
6. **Put a map on the home.** Built differently. The Daily Five card shows the hub's lamp-lit map engraving (the same drawing as the games hub, its pin dropping on a slow loop) with "Puzzle #n" on it and the five slots, rather than a second live map: a live map on the home would start the map engine before the player has chosen anything, and the engraving is the house style. Beginner, Standard and Expert are pills with the chosen level's line under them; the six eras are pills instead of a drop-down; the streak has the kit's flame. The three columns and the hairlines stay.
7. **Warn when the answer is off the map, and name the lakes.** Built as asked, both halves. A practice round whose place has no credible site inside the era's opening view shows a small teal chip "Further afield: zoom out" beside the name (practice only: in the Daily Five everyone must see the same thing and the chip would be a hint). Beginner now shows the Mediterranean, Red, Black and Aegean Seas, the Persian Gulf, the Sea of Galilee, the Dead Sea, the Jordan, the Nile, the Euphrates and the Tigris as the game's own labels, each from a zoom that suits it, in the basemap's italic; the tiles are untouched.

**My own additions.** The line and the true site's dot wear the round's colour, so a near miss is green and a wide miss red on the map itself, not only in the card. The end screen gives a rank title by the share of points (Wanderer, Pilgrim, Traveller, Mapmaker, Cartographer) through the kit's rank line, and a "New best" ribbon when a Daily Five beats your record. MapLibre's own zoom buttons are restyled in the site's colours at thumb size with no blue focus halo.

## 3. Faults fixed

- Confirm below the fold on a phone: it floats inside the map's frame, bottom right, so it is on the first screen with the map.
- The reveal scrolling the map away: focus moves without scrolling and the sheet is over the map, so the line and the true site are in view.
- Zoom buttons 29 pixels square: 44 pixels, in the site's surface colour.
- Three lines of grey help text: one line beside Confirm, gone after the first pin.
- The summary landing scrolled under the header: the kit's scroll-to-top runs when the summary opens.
- The home 2,868 pixels tall with 13-pixel radios: pills at 44 pixels, the level's description on one line, the era pills in place of the drop-down.
- No visible keyboard focus on any button: every button lifts and takes a teal edge on focus, the pills too; the map's zoom buttons tint. No outline anywhere.
- The crosshair at 55 percent: now at 85 percent with a hairline of surface colour behind it, so it reads on land and sea.
- The help sentence and a disabled Confirm under the "map couldn't load" panel: they live inside the map's stage now and go with it.
- Some places starting off the map: the "Further afield" chip (item 7).
- Beginner's thin water names: the game's own labels (item 7).

## 4. Before and after

Each row pairs an audit screenshot in [map-quest/](map-quest/) with the same moment in [map-quest/after/](map-quest/after/). Phone shots are 390 pixels wide, desktop 1440.

| Moment | Before | After | What to look for |
|---|---|---|---|
| Home, phone | [phone-01-home](map-quest/phone-01-home.png) | [phone-01-home](map-quest/after/phone-01-home.png) | The lamp-lit map engraving on the Daily Five card with "Puzzle #n"; level and era as pills; the streak's flame. |
| Home, desktop, full page | [desktop-02-home-fullpage](map-quest/desktop-02-home-fullpage.png) | [desktop-02-home-fullpage](map-quest/after/desktop-02-home-fullpage.png) | The three columns and hairlines kept; the page far shorter without the radios and drop-down. |
| Map just drawn, phone | [phone-06-daily-place1-map-drawn](map-quest/phone-06-daily-place1-map-drawn.png) | [phone-06-daily-place1-map-drawn](map-quest/after/phone-06-daily-place1-map-drawn.png) | The five slots and the total bar above the name; Confirm and the one-line hint inside the map's frame; the brighter crosshair; the land lifted off the sea. |
| Pin dropped, desktop | [desktop-08-daily-place1-pin-dropped](map-quest/desktop-08-daily-place1-pin-dropped.png) | [desktop-08-daily-place1-pin-dropped](map-quest/after/desktop-08-daily-place1-pin-dropped.png) | The gold pin with its shadow and the ring at its tip; the hint gone; Confirm lit. |
| Bullseye reveal, phone | [phone-10-daily-place1-reveal-right](map-quest/phone-10-daily-place1-reveal-right.png) | [phone-10-daily-place1-reveal-right](map-quest/after/phone-10-daily-place1-reveal-right.png) | The sheet over the bottom of the map with the bullseye, the distance, the points over a full gold bar, Next in thumb reach and the verse under; the first slot filled gold. |
| Wide miss, phone | [phone-14-daily-place2-reveal-wrong-map](map-quest/phone-14-daily-place2-reveal-wrong-map.png) | [phone-14-daily-place2-reveal-wrong-map](map-quest/after/phone-14-daily-place2-reveal-wrong-map.png) | The red dashed line from the pin to the true site's red dot, both in view above the sheet; the red square; the short bar. |
| Wide miss, desktop | [desktop-14-daily-place2-reveal-wrong-map](map-quest/desktop-14-daily-place2-reveal-wrong-map.png) | [desktop-14-daily-place2-reveal-wrong-map](map-quest/after/desktop-14-daily-place2-reveal-wrong-map.png) | The answer as a panel on the left of the map, the line and both ends framed to its right. |
| Near miss, desktop | [desktop-19-daily-place3-reveal-near-miss](map-quest/desktop-19-daily-place3-reveal-near-miss.png) | [desktop-19-daily-place3-reveal-near-miss](map-quest/after/desktop-19-daily-place3-reveal-near-miss.png) | A green line and dot for a near miss: the colour tells the verdict on the map itself. |
| Daily summary, phone | [phone-24-daily-summary](map-quest/phone-24-daily-summary.png) | [phone-24-daily-summary](map-quest/after/phone-24-daily-summary.png) | The total and rank title, the five slots, then the still map of all five results, and the list beneath instead of a table. |
| Daily summary, desktop, full page | [desktop-25-daily-summary-fullpage](map-quest/desktop-25-daily-summary-fullpage.png) | [desktop-25-daily-summary-fullpage](map-quest/after/desktop-25-daily-summary-fullpage.png) | Best round, best ever and the streak beside the map; Share and Game home as pills. |
| Home after the daily, phone | [phone-27-home-daily-done](map-quest/phone-27-home-daily-done.png) | [phone-27-home-daily-done](map-quest/after/phone-27-home-daily-done.png) | The day's five colours on the card with the score and the time to the next puzzle. |
| Practice summary, phone | [phone-33-practice-summary](map-quest/phone-33-practice-summary.png) | [phone-33-practice-summary](map-quest/after/phone-33-practice-summary.png) | Play again and Change settings under the map. |
| Light reveal, phone | [phone-41-light-reveal](map-quest/phone-41-light-reveal.png) | [phone-41-light-reveal](map-quest/after/phone-41-light-reveal.png) | The same sheet in light; the atlas's light colours untouched. |
| Map that cannot load, phone | [phone-42-map-failed](map-quest/phone-42-map-failed.png) | [phone-42-map-failed](map-quest/after/phone-42-map-failed.png) | The panel with Retry and All games, and no stray help sentence or disabled Confirm under it. |

Shots with no "before" partner: [desktop-17-daily-resumed-after-reload](map-quest/after/desktop-17-daily-resumed-after-reload.png) and its phone twin (a Daily Five reloaded mid-game resumes on the same round with its slots filled), [desktop-26-daily-summary-after-share](map-quest/after/desktop-26-daily-summary-after-share.png) (the share button's "Copied" state) and [desktop-43-light-practice-summary](map-quest/after/desktop-43-light-practice-summary.png) (the summary map in light). The audit's shots 09 (mid-drag) and 12 (the reveal with the map scrolled to the top) have no "after": the drag is a moment the script cannot hold still, and the page no longer scrolls on reveal, so there is no "map top" to scroll to.

## 5. Checks

All run on 11 November 2026 from the Website folder, after the last code change.

| Check | Result |
|---|---|
| The game's tests (`npx vitest run src/pages/games/map-quest`) | 9 files, 54 tests, all pass |
| Every games test (`npx vitest run src/pages/games`) | 831 pass; 2 fail in `twenty-questions/data.test.ts`, which reads data files another job has changed and not yet committed. Map quest does not touch them. |
| `npm run typecheck` | exit 0 |
| `npx eslint src/pages/games/map-quest` | clean |
| English check (`py -3.12 content/translation/english_build_check.py`) | 0 unregistered texts, 0 new |
| `npm run build` | exit 0 (six builds through the work, the last after the map-failure fix) |
| Playwright play-throughs (desktop 1440 by 900 and phone 390 by 844, dark and light): Daily Five with a bullseye, a wide miss, a near miss, the Enter key and a reload mid-game; practice with the Jesus era; a disputed place; a map that cannot load | 86 screenshots, no console errors |
| Tile-failure check: the atlas blocked at the network, cold and with a warm cache, desktop and phone | the "map couldn't load" panel shows about three seconds after the first failed square |

The commit hash is recorded at the end of this file.

## 6. Left for later

- **Sound.** The shared brief allows a soft sound on the pin drop and the bullseye; none is added, because no other redesigned game has one yet and a first sound should be a decision for the whole hub.
- **The map that cannot load, before this step.** The old game only showed its "couldn't load" panel when the piece list answered with an HTTP error; a dropped connection left a blank map for ever. That is fixed here (a failed square with no land three seconds later now shows the panel), and [StreetAtlasMap.tsx](../../src/components/atlas/StreetAtlasMap.tsx) has the same older rule. It is outside this game and was left alone.
- **Twenty questions tests.** Two of its data tests fail against another job's uncommitted files; that job owns them.

- Commit: 2a87f0ef1 on main, "Redesign: Map quest (from its visual audit)", pushed to origin. This note itself is a second small commit.
