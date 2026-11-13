# "What came first?" — the brief

**Written:** 2026-11-12, from the owner's decisions in chat, for the Fortress sequence "Bible Guide: What came first? game".
**Read this whole file before touching anything.** Your step's own brief says which part is yours; this file says what the
whole feature is and the rules every step follows.

## 1. What the owner asked for

The game **Who's older?** (`/games/whos-older`, folder `src/pages/games/whos-older/`) becomes **What came first?**: the same
"tap the one that came first" game, with categories of "firsts" instead of only people. The owner's words: *"it should be
what was first with options for Who Lived First, What was built First."* After a brainstorm he approved the first release
with **eight categories** (owner, 2026-11-12):

| # | Category (title on screen) | What a round asks | Data |
|---|---|---|---|
| 1 | **Who lived first?** | Two people: who was born first | The existing Who's older? pool, unchanged (`src/data/whos-older/`) |
| 2 | **What happened first?** | Two events | The Timeline sort game's 248 dated events and its contested pairs (`src/data/timeline/`) |
| 3 | **Who ruled first?** | Two rulers: who began to reign first | Judges, kings of Israel and Judah, foreign kings (Pharaohs named in Scripture, Assyria, Babylon, Persia), NT rulers (Herods, Roman governors, Caesars named in Scripture). New hand-kept file; reuse the reign dates on the site's king pages and `src/data/who-ruled/` |
| 4 | **What was built first?** | Two things built or made | New hand-kept file: Noah's ark, Babel, altars, the golden calf, the Tabernacle, the Ark of the Covenant, the bronze serpent, Solomon's Temple and palace, Jeroboam's calves, Ahab's ivory house, Hiel's Jericho, the second Temple, Nehemiah's wall, Herod's Temple (John 2:20), and more |
| 5 | **Where did they go first?** | Two places on **one traveller's** journey: which they reached first | New hand-kept file: Paul's journeys (Acts), Israel's wilderness stops, Abraham's travels, and others where Scripture gives the order. A pair is only ever two stops of the same traveller; the card names the traveller. Places from the Map Quest data (`src/data/map-quest/places.json`) where they match |
| 6 | **Who died first?** | Two people: who died first | New hand-kept facts (Moses or Aaron, Sarah or Abraham, ...). People ids from the Who's older? pool where possible |
| 7 | **Which comes first in your Bible?** | Two books: which comes first in the Bible's order | Generated from the 66-book Protestant order the site already uses. No research, no disputes; teaches finding books |
| 8 | **Bible Firsts** | A different format: one question ("Who was the first king of Israel?", "the first martyr?", "Jesus's first sign?") with three or four answers | New hand-kept file of firsts **the Bible itself states or plainly shows**, each with its verse. Candidates may be drawn from the question bank (`content/questions/`, read-only), never by changing the bank |

Plus a **Mixed** option that deals rounds from every category.

**Left out on purpose (owner, 2026-11-12):** what God made first (the days of Creation) and the order of the plagues.
Also left out, because their order is disputed or unclear: which book was written first, and which of Jesus's miracles came
first (the gospels often do not settle the order; "his first sign", John 2:11, belongs in Bible Firsts instead).

## 2. The promise that does not change

**A pair is only ever asked when its order is certain.** This is the heart of Who's older? (its design:
`docs/features/whos-older/design.md`, sections 0, 3, 4 and 5) and it holds for every category: wide windows that must not
overlap, or an order fact with its verse, and a blocked-pairs list for orders that are honestly disputed. A Bible Firsts
question is only included when Scripture states or plainly shows the "first" (the verse is shown in the reveal); a "first"
that is only tradition or inference is left out. Doctrine: the site agrees with the Baptist Faith and Message 2000;
quotations are the Berean Standard Bible (`../../../../DOCTRINAL-FOUNDATION.md`, `CLAUDE.md` of the project).

## 3. What the game becomes

- **Name and address:** title "What came first?", slug `what-came-first`, address `/games/what-came-first`. The old address
  `/games/whos-older` forwards to it (Who lived first chosen). The registry entry moves to the new slug; the hub tile's text,
  picture alt and art key follow; the description says the new game.
- **Start screen:** the eight categories and Mixed as **pills, all visible at once** (owner's standing rule: no dropdowns,
  every option always visible). Streak and Relaxed modes and the difficulty bands stay as they are.
- **Round:** the same two cards and hourglass, with the category's question as the round's heading ("Who ruled first?").
  In Mixed the heading changes per round. Bible Firsts uses three or four answer cards in the same look (kit `AnswerCard`).
- **Reveal:** as now: the right answer, when each lived/happened/reigned/was built when known, how sure, and the verse that
  settles it in the reader's current Bible (`src/lib/verses.ts`).
- **Best scores:** kept per category and mode. **Existing players keep their Who's older? bests and any saved run**: they
  become Who lived first's (read the old storage keys, `storage.ts`).
- **Look:** keep the approved Who's older? redesign (`docs/visual-audits/whos-older-redesign.md`) and the games kit
  (`src/pages/games/kit/`). Each category may carry its own accent from the site's book colours, but the game stays one room.

## 4. Rules every step follows

- Website folder `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website` (React + TypeScript + Vite + Tailwind, a git
  repository). Its `AGENTS.md` has the runtimes and the portable build and test commands. Also `../FEATURE-BUILD-RULES.md`.
- **Never start `vite`, `npm run dev` or `npx vite`.** The preview at `http://127.0.0.1:8931` is always on and serves
  `dist/`; run the build and reload. Screenshots: Playwright from the Website's `node_modules`, desktop 1440 and phone 390,
  dark and light theme (`localStorage` key `bp-theme`).
- **No focus outline**, no glow everywhere, no boxes in boxes, no dropdowns; a round and its reveal fit one phone screen
  (Next on the first screen). Reduced motion: no state waits on an animation. Rules in `design/README.md`.
- **Words on screen pass the translation check** (`content/translation/english_build_check.py`, run first by
  `npm run build`): counts with `plural`, numbers with `formatNumber`, from `src/lib/site-format.ts`; names in their own
  element. Game data loads through `inSiteLanguage` like Who's older? does (`../translated-data`), so the new data files
  must be registered the same way.
- **The phone app shows this game as a tile on its games page** (`App/src/data/site/games-hub.json`,
  `App/src/components/games-hub/art.ts`, `App/src/lib/language-packs.ts`). The website and the app share one design: the
  implement step updates the app's tile in the same job and `npm run check:site` (in `App/`) must pass. List of mirrored
  files: `App/scripts/site_parity.py`.
- **No runtime model cost.** Anything generated is generated once ahead of time and stored. No new services.
- **Register every new source** in `SOURCES.md` (licence, checksum, planned use) if one is used.
- Touch only this game's own files, its data, its build script, its registry/hub entry and the app tile. Do not change any
  other game, the hub's `games.css`/`GamesPage.tsx`/`art/` beyond the entry, or the question bank. Never `git stash`
  (other chats work in this tree); commit only your own files.
- **Never deploy.** Commit to `main` with a clear message; the owner releases.
- Every step writes its report as it goes (not as the last act) and copies it into its own job folder.

## 4a. Owner's decisions on the design's open points (2026-11-12, binding)

1. **The ark of the covenant's journey is in** Where did they go first, as its own journey.
2. **Stephen:** the Bible Firsts question says **"the first Christian martyr"** (Acts presents him so: 7:59–60, 8:1, 22:20).
3. **A new player opens on Mixed**, not Who lived first. (A player arriving from the old /games/whos-older link still lands
   on Who lived first.)
4. **Bible Firsts launches with what passes the checks**; no padding with weaker ones. **Later the same day the owner added
   36 more questions:** [firsts-additions.md](firsts-additions.md) (about 61 in all). Creation was ruled out as a category
   to play, not as a theme, so Genesis 1–3 questions are welcome. No "first of the Ten Commandments" question; "the first
   and greatest commandment" stands instead.

## 5. The steps

1. **Research and design** → `docs/features/what-came-first/design.md`.
2. **Review** the design once, critically, against this brief and the real code; fix the doc; append a "Review" section.
3. **Curate the data** → the hand-kept source files, the build script's checks, and an owner review sheet
   (`docs/features/what-came-first/review-sheet.md`), plus `docs/features/what-came-first/data-report.md`.
4. **Build the game** → rename, categories, Mixed, Bible Firsts, redirect, saved bests carried over, app tile, tests,
   build, screenshots → `docs/features/what-came-first/build-report.md`.
