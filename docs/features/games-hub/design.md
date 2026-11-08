# Games hub redesign: a striking /games with original art for every game

**Date:** 2026-11-07 · **Builds on:** the games hub from job 714 ([GamesPage.tsx](../../../src/pages/games/GamesPage.tsx),
[registry.ts](../../../src/pages/games/registry.ts), [README.md](../../../src/pages/games/README.md)) · **Rules:**
[AGENTS.md](../../../AGENTS.md), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · Not deployed.

## What the owner asked for

A games page that is genuinely visually compelling: a strong hero, rich cards with art, polished hover and motion, the
games laid out by type (daily puzzles; family and party; youth group and church night; solo), coming-soon games that still
look inviting, great on phones and desktop, fast, accessible. Original art for every game, one coherent visual language,
carried in the registry so future games get art the same way. Registry changes minimal and additive, because four feature
chains are editing it in parallel.

## The visual language: "lamp-lit line engravings"

The site already has a line-art language the owner likes a lot ([design/README.md](../../../design/README.md),
"Line-art scenes"; the doorway drawings in [StationArt.tsx](../../../src/components/stations/StationArt.tsx)). The owner's
notes on it: drawings should loop slowly rather than play once, carry more detail (a moving flame, drifting sparks), and
must not be "thin line drawings" or "an arcade look" (neon on black, glowing plates). So the game art is a richer cousin
of the station drawings, not a new style:

- **One canvas:** every scene is an SVG in a 240 × 160 box (3:2), the station drawings' size.
- **An arched window behind every scene.** Each drawing sits in front of a soft, filled church-window arch in its game's
  tint, with a faint sun-disc. This one repeated shape is what ties fifteen different subjects together, and it reads as
  "Bible", not "arcade".
- **Engraving, not outline.** Main strokes in the game's book colour; a second, darker ink for key details; parallel
  hatching for shadow (a nod to engraved Bible illustration such as Doré's, drawn from scratch); a few filled planes at low
  opacity so the pictures have weight. Rounded caps and joins throughout, like the stations.
- **One book colour per game** from the site's canonical palette (history terracotta, poetry teal, prophets blue, gospels
  purple, Acts magenta, epistles gold, Revelation crimson), fixed per game rather than cycled by position, so a game keeps
  its colour wherever it moves.
- **One living detail per scene** that moves when the card is hovered or focused (and always, slowly, in the hero): tiles
  flip, a pin drops and rings out, a stopwatch hand sweeps, rain falls, a card lifts. Everything is still under
  `prefers-reduced-motion`.
- **Light/dark:** colours come from the theme tokens (`--history`, `--surface`, `--ink`, …), so the art follows the
  reader's theme with no second set of drawings.

**Public-domain engravings (Doré):** considered and not used. They are raster images (hundreds of KB each for a crisp
card), their dense cross-hatching fights the clean line art at card size, and fifteen of them would not form one
language with the hand-drawn scenes. The hatching in the SVGs nods to them at zero weight. NOTICE.md therefore needs no
new credit: every piece is original to this site.

## The fifteen scenes

The registry holds the homepage quiz plus the fourteen approved games, so fifteen pieces of art.

| Game | Colour | Scene | Living detail |
|---|---|---|---|
| How well do you know the Bible? (quiz) | Revelation crimson | An open Bible on a lectern cloth, a large question mark rising from its pages, small sparks | The question mark bobs, sparks twinkle |
| Live youth-group quiz | Gospels purple | A big screen on a stand with a question and four answer bars; three phones held up in front | The answer bars fill one after another |
| Bible Wordle | Epistles gold | Two rows of five letter tiles: a guess with gold/marked/empty tiles, then the solved word GRACE | The tiles of the answer flip in turn |
| Timeline sort | History terracotta | A dated line with three event cards (an ark, the parted sea, a crown), one card lifted by a hand | The lifted card slides into its slot |
| Verse completion | Gospels purple | An unrolled scroll with lines of writing and a blank, a quill above it | The quill writes the missing line |
| Bible Jeopardy | Prophets blue | A category board of value tiles (100–400) on an easel | One tile turns over |
| Bible twenty questions | Poetry teal | A head in profile with a thought cloud of question marks, and Yes / No tags | The question marks appear one by one |
| Map quest | Poetry teal | A coastline map with hills, a dashed route, a compass rose and a pin | The pin drops and a ring spreads |
| Who's older? | Epistles gold | Two oval portrait cameos of bearded figures facing each other, an hourglass between | The hourglass turns |
| Family charades | Revelation crimson | A figure miming with arms raised, a card held to the forehead, an audience's speech marks | The arms wave |
| Two truths and a lie | Acts magenta | Three fanned cards, two ticked, the middle one hiding a small mask | The middle card lifts |
| Emoji stories | Acts magenta | Three round faces in a row (an ark, a rain cloud, a rainbow) joined by arrows | The rain falls, the rainbow draws |
| Hot seat | History terracotta | A chair under a lamp, a large stopwatch reading 60 behind it | The stopwatch hand sweeps |
| Odd one out | Prophets blue | Three sheep and a goat on a hillside, the goat ringed (Matthew 25) | The ring pulses |
| Memory card match | Poetry teal | A grid of face-down cards with two turned up showing a matching lion (Daniel) | A third card flips over and back |

## The page

1. **Hero** (two columns on desktop, stacked on phones): the existing serif hero text ("Bible games for / every table and
   room."), the stats line, and a row of jump links to the four shelves with their counts. Beside it, a large hero drawing
   in the same language: **the games table**, a long table under a hanging lamp, with Wordle tiles, fanned cards, a map with
   a pin, an hourglass and an open Bible on it, framed by the arched window; the flame flickers and the props move in slow
   loops. On phones the drawing sits above the text at a modest height so the heading is still in the first screen.
2. **Four shelves** in this order, each an `<section>` with a numbered serif heading, one line on what it is for, and a
   count ("4 games · 2 ready to play"):
   - **Daily puzzles**, quick puzzles to come back to (Wordle and Map quest set a new one each day): Bible Wordle, Map quest, Timeline sort, Odd one out.
   - **Family and party**, for the living room: Family charades, Emoji stories, Memory card match, Who's older?
   - **Youth group and church night**, for a room and a screen: Live youth-group quiz, Bible Jeopardy, Hot seat, Two truths
     and a lie.
   - **Solo**, on your own: How well do you know the Bible?, Verse completion, Bible twenty questions.
   Within a shelf, live games first, then the rest, each in registry order (the hub's existing rule, now per shelf).
3. **Tiles, not boxes.** The owner has rejected "boxes around everything" and "the same glowing box repeated"
   ([design/README.md](../../../design/README.md)), so the games keep the hub's hairline grid: each tile is the arched
   picture, the serif title, the one-line description, the audience chips and a footer (**Play** or **Coming soon**),
   separated from its neighbours by thin lines, with the short coloured rule along the top that runs the tile's width on
   hover or keyboard focus. The arch is the only shape around a picture; there is no card box, shadow or lift. A status
   badge sits on the picture: "Ready to play" in the game's `-tab` / `-tab-ink` colour pair, or a quiet outlined "Coming
   soon". Coming-soon tiles keep their full art and its slow motion (that is what keeps them inviting), slightly softened,
   and do not link. Grid: as many 15rem-wide columns as fit (four on desktop, two on tablets); dividers do not depend on a
   tile's position, so shelves of any size line up. Phones (under 640px): a compact row per game, picture on the left,
   words on the right; hatching is hidden there because it turns to mush at that size.
4. **Motion budget:** CSS only, `transform` and `opacity` (plus two short stroke-draws). Each scene's one living detail
   loops slowly all the time (the owner wants line art that "loops slowly, not plays once"), so phones, which have no
   hover, see it too; hover effects (the picture rising a few pixels) sit inside `@media (hover: hover)`. Tiles fade up as
   they scroll into view only where the browser supports scroll-driven animation, inside `@supports (animation-timeline:
   view())` and `prefers-reduced-motion: no-preference`, starting from 0.35 opacity rather than 0, so nothing can be left
   invisible. No JavaScript animation, no images to download. No glow, no projector beam, nothing arcade-like.
5. **Empty and small shelves:** a shelf with no games is not drawn and loses its jump link; a shelf with no live game says
   "4 games · all coming soon", not "0 ready to play".

## Accessibility

- Every scene is `role="img"` with a short plain-English label from the registry (its alt text); the tile's link keeps
  its name from the title (`aria-labelledby`), so the picture does not lengthen the link's name. The hero drawing has its
  own label.
- The site has no focus outline anywhere (owner's call, [index.css](../../../src/index.css)), so keyboard focus shows as
  the full-width coloured rule plus an underlined title, and both stay under reduced motion.
- Text colours are the site's tokens; badges use the `-tab` / `-tab-ink` pairs made for text on a colour. The arch tint
  is `color-mix(var(--tone) 12%, var(--surface))`, so tone strokes stay visible on it in the dark theme too.
- `prefers-reduced-motion: reduce`: no fade-ups, no loops, no rise; the art is shown complete and still.
- `forced-colors: active` (Windows high contrast): filled planes are dropped, strokes use `CanvasText`, badges get a border.
- Shelves are labelled sections (`id="shelf-<key>"`, with a scroll margin for the jump links) with `h2`; tiles are list
  items with `h3` titles. On phones the `h1` stays first in the page order; the drawing is moved above it with CSS only.

## How the art lives in the registry (minimal, additive)

Each entry gains **one added line, placed after its `audiences` line** (the other chains edit the `slug`/`status`/`load`
lines when they make a game live, so the two edits never touch the same line):

```ts
shelf: "daily", art: GAME_ART.wordle,
```

- `art` is a `GameArt` record from the new [art/](../../../src/pages/games/art/) folder: the scene component, its book
  colour (`tone`, a closed list of the seven) and its alt text. `GAME_ART` is declared `satisfies Record<string,
  GameArt>`, so a mistyped key fails the typecheck.
- `shelf` is which of the four shelves the game sits on: `"daily" | "family" | "groups" | "solo"`.
- **Both are optional in the type**, so no other chain's typecheck can break while the fifteen lines go in, or if a
  chain's edit drops one. The hub falls back to a plain arch and to the shelf of the game's first audience, so a page
  never breaks. The tests then require every entry to carry both, with a failure message pointing to the README.
- The art folder imports nothing from the registry (no import cycle); `registry.ts` gains one import line and the `Shelf`
  type with its labels. Existing fields, entry order and the helpers (`isLive`, `gamePath`, `gamesForHub`) are unchanged.
- Each entry is edited with its own small exact-match edit, re-reading the file immediately before.
- [games.css](../../../src/pages/games/games.css) is also imported by the quiz, live-quiz, map-quest and odd-one-out game
  pages, which use `.gm-back` (and the quiz `.gm-quiz`). Those rules stay exactly as they are, and every new rule is
  under a `gm-` or `ga-` class, never a bare element.
- Adding a future game: draw a scene in the art folder's style (README explains the conventions), add it to `GAME_ART`,
  and put `shelf` and `art` on the entry.

## Files

| File | Change |
|---|---|
| `src/pages/games/art/parts.tsx` | New: the shared drawing parts (stroke helpers, the arch backdrop, hatching) and the `GameArt` / `Tone` types. |
| `src/pages/games/art/scenes-*.tsx` | New: the fifteen scenes, split across files to stay under 500 lines each. |
| `src/pages/games/art/index.ts` | New: `GAME_ART`, one record per game. |
| `src/pages/games/art/HeroArt.tsx` | New: the games-table hero drawing. |
| `src/pages/games/art/game-art.css` | New: the art's strokes, fills and living details, with the reduced-motion fallback. |
| `src/pages/games/registry.ts` | One import line; the `Shelf` type and labels; `shelf` + `art` on each entry. |
| `src/pages/games/GamesPage.tsx` | The new hero, shelves and cards. Routes unchanged. |
| `src/pages/games/games.css` | The new layout and cards (the `/games/quiz` rules at the bottom kept as they are). |
| `src/pages/games/games.test.tsx` | Tests for art, shelves and the new structure. |
| `src/pages/games/README.md` | Explains `shelf` and `art` and how to draw a new game's picture. |
| `docs/features/games-hub/` | This note and the desktop/mobile screenshots. |

## Verification

While working: `npx vitest run src/pages/games`. At the end: `npm test` once (failures outside the games folder belong to
other chains and are reported, not fixed), `npm run typecheck`, eslint on the changed files, and `npx vite build` rather
than `npm run build`: the build's pre-step regenerates people, scholar and catalogue files that this work does not touch
and that four parallel chains would otherwise race on. Rebuilding refreshes the owner's preview on port 8931, which
AGENTS.md allows. Screenshots come from a one-off Playwright script pointed at that existing preview (the project's
Playwright config would start its own server on port 8932, and AGENTS.md forbids new preview endpoints): desktop 1440 x
900 and phone 390 x 844, light theme, full page with reduced motion so nothing is caught mid-fade, plus a dark desktop
shot; saved in this folder.

## Review (2026-11-07, three passes: correctness and security, reliability, edge cases and design fit)

No critical security issue (the art is static JSX; colours come from a fixed list). What changed in this plan and why:

- **Fields made optional, line moved after `audiences`.** Required fields would have broken the other chains' typecheck
  while the fifteen lines were going in, or whenever a chain's edit dropped one. The tests enforce coverage instead.
- **Hairline tiles instead of rounded, shadowed, lifting cards**, because the owner has rejected boxes around everything.
- **Focus is shown by the coloured rule and an underlined title**, because the site has no focus outline.
- **Living details loop slowly all the time**, not only on hover: the owner asked for looping line art, and phones have
  no hover. Hover-only effects moved inside `@media (hover: hover)`.
- **No glowing Jeopardy tile or projector beam** (arcade look); the tile turns instead.
- **Hatching drawn as plain lines, no shared SVG `id`s**, which break silently when the first copy is hidden.
- **Grid by available width (four columns on desktop)** instead of a fixed three, so 4/4/4/3 shelves do not strand a
  tile, and dividers no longer depend on `nth-child`. Empty shelves are skipped; an all-coming-soon shelf says so.
- **Arch tint mixed from the tone and the surface**, so strokes stay visible in the dark theme; badges use the `-tab`
  pairs; high-contrast rules added.
- **Scroll fade-ups guarded** and started from 0.35 opacity, so screenshots and jump links never meet invisible tiles.
- **`vite build` instead of `npm run build`, games-only tests while iterating, screenshots against the existing preview**
  (reasons above), and the shared `.gm-back` / `.gm-quiz` rules protected.
- Kept: "Daily puzzles" is the owner's own name for the shelf, so it stays, with a description that is honest about which
  games have a new puzzle each day (Wordle and Map quest). Alt text stays on the tile pictures because the owner asked
  for it; the labels are kept short and describe the picture rather than repeat the title.

## Result (2026-11-07)

Built as planned above, with two fixes found in the screenshots: the grid is a fixed four columns on desktop and two
below 1100px (a width-based grid made five columns on wide screens and left every shelf a gap), and the sheep's legs were
shortened (they read as small trees). Screenshots, taken from the owner's preview on port 8931 (the site is dark unless a
reader picks light):

| File | What it shows |
|---|---|
| [games-hub-desktop.png](games-hub-desktop.png) | Desktop 1440 px, dark (the site's default), whole page |
| [games-hub-desktop-light.png](games-hub-desktop-light.png) | Desktop, light theme, whole page |
| [games-hub-desktop-hero.png](games-hub-desktop-hero.png) | Desktop first screen with motion on |
| [games-hub-tablet.png](games-hub-tablet.png) | Tablet 768 px, dark, whole page |
| [games-hub-mobile.png](games-hub-mobile.png) | Phone 390 px, dark, whole page |
| [games-hub-mobile-light.png](games-hub-mobile-light.png) | Phone, light theme, whole page |
| [games-hub-mobile-first-screen.png](games-hub-mobile-first-screen.png) | Phone first screen with motion on |

Weight: the hub's own chunk, with all sixteen drawings, is 35.8 KB of script (11.7 KB compressed) and 12.1 KB of styles
(3.2 KB compressed); no images are downloaded.
