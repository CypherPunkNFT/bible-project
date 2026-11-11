# Bible Guide games: the redesign brief

**Written:** 2026-11-11, for the Fortress sequence "Bible Guide: redesign every game from its audit" (one job per game, run one after another, starting once the audit sequence has finished). **Read this whole file before touching anything.** Your step's own brief says which game is yours and anything special about it; this file says how every step works.

## 1. What the owner asked for

The owner likes the games but says most of them look visually underdeveloped: they read like plain multiple-choice forms instead of real games with cards, drag and drop, motion and a sense of play. The **Timeline sort game** (`/games/timeline`) is his example of what a game should feel like. He had every game audited (the reports in this folder, one per game, with screenshots) and now wants each game **rebuilt into a more visually interactive and stimulating game, using its audit and your own creative judgement**.

Your job is one game. Make it feel like a game people want to keep playing: a clear thing to look at, a big and instant reaction to every move, a visible climb, and an ending worth keeping. Keep the game's rules, data, scoring, saved progress and address. This is look, feel, motion, layout and flow, plus any faults the audit found.

## 2. The site, the folder, the preview

- **Website folder:** `D:\FortressOfSolitude\Jarvis\Projects\BibleProject\Website` (React + TypeScript + Vite + Tailwind; a git repository whose `main` is what the owner sees; the live site is released separately and **never by you**). Rules for working in it: its `AGENTS.md` (runtimes, Bun and Python paths, portable build and test commands when the native ones refuse).
- **The games:** `src/pages/games/<slug>/`, one folder per game, registered in `src/pages/games/registry.ts`, playable at `http://127.0.0.1:8931/games/<slug>`. How the hub and the registry work: `src/pages/games/README.md`. Each game's reviewed design is in `docs/features/<feature>/design.md` (the feature names differ slightly from the slugs: `bible-wordle`, `timeline-sort`, `bible-jeopardy`, `family-charades`, and so on); read yours, because it explains the rules and data you must keep.
- **The audits:** `docs/visual-audits/<slug>.md` with screenshots in `docs/visual-audits/<slug>/`. `docs/visual-audits/README.md` (written by the last audit step) ranks the games and names improvements several games share. Read your game's audit in full, and the README if it exists.
- **The preview** at `http://127.0.0.1:8931` is always on and serves `dist/`. **Never start `vite`, `npm run dev` or `npx vite`** (a dev server watches millions of files and has frozen this PC). To see your work, run the build (section 7); it updates `dist/` file by file and the preview shows the new build on the next load. Screenshots: drive the preview with Playwright from the Website's `node_modules` (`createRequire` on the Website's `package.json`, then `require("playwright")`), as the audit jobs did, at desktop 1440 wide and phone 390 wide, in both the dark theme (default) and the light theme (`localStorage` key `bp-theme`).

## 3. Design rules that bind every game

**Keep the site's look and design system.** Game feel, not a new site. Use the tokens in `src/index.css` (`--page`, `--surface`, `--ink`, `--muted`, `--line`, `--accent` and the book colours `--history`, `--poetry`, `--prophets`, `--gospels`, `--acts`, `--epistles`, `--revelation`), the serif `--font-serif` for titles and the sans `--font-sans` for small labels. Every game already has **one book colour** on the hub (`src/pages/games/art/index.ts`); that colour is the game's colour everywhere inside it. The visual language of the hub and its drawings is described in `docs/features/games-hub/design.md` ("lamp-lit line engravings"): your game should look like a room of the same house.

**What the owner has approved and what he has rejected** is recorded in `design/README.md`. The parts that bind games:

- No glow everywhere ("we're not children"): glow is for one focal point at most, for a moment.
- No boxes around everything: prefer words and shapes with lines over bulky containers; one card shape per game is fine, nested boxes are not.
- No arcade or video-game look: no neon on black, no sci-fi panels, no grids behind grids, no plus/minus/undo-redo button rows, no simulated-metal lettering.
- No chat bubbles, no music-score imitation, no endless scrolling: a round and its reveal must fit on one phone screen or the Next button must be on the first screen (every audit found Next one to nine screens down).
- Line art and living details loop slowly; nothing plays once and stops.
- Premium, modern and quiet: motion with easing (the hub uses `cubic-bezier(.16, 1, .3, 1)`), never bouncing cartoons.
- **No focus outline, ever** (owner, 2026-10-06; `src/index.css` removes it site-wide and you must not add one back). Show focus with the component's own lift, edge or underline, as the hub does. Make sure a pressed or selected state never depends on the outline (the Two truths audit found an award button whose pressed state was invisible for that reason).
- **Reduced motion:** `src/index.css` cuts every animation and transition to 0.01 ms under `prefers-reduced-motion`. So no game state may wait for an animation to end; the state changes at once and the animation decorates it.
- Both themes, dark and light, must look finished. Check both.

**Sound** is optional. If you add it, do it the way `src/pages/games/charades/sound.ts` does: short generated tones, no audio files, created inside a tap, with an on/off switch, and never the only signal.

**Phones first for the group games.** Charades, Hot seat, Live quiz and Jeopardy are played with a phone in hand or a projector; the audit's phone section is as important as the desktop one. Tap targets at least 44 pixels. Nothing scrolls sideways.

## 4. What to build, and how far to go

1. **Build the audit's ranked improvements**, in order, all of them unless one conflicts with these rules or with the game's design; when you skip one, the report says why. Items 1 to 4 are the heart of the job.
2. **Fix what the audit lists under "Anything broken" and "Phone problems"** (lost scroll position, buttons that overlap, states that look like nothing happened, Next below the fold).
3. **Add one or two ideas of your own** that the audit did not think of, if they make the game more alive without breaking the rules above. Say which ones were yours in the report.
4. **Keep intact:** the rules, the data files, the scoring, the share text format, the saved-game keys in storage, the daily puzzle logic, the address, the registry entry (change nothing in it unless the description must change), keyboard play (letters, numbers, Enter, Space) and everything the audit praised under "Done well". A player who saved a game yesterday must find it today.
5. **Do not touch** `src/pages/games/games.css`, `src/pages/games/GamesPage.tsx`, the `art/` folder or any other game's folder. The hub's files are mirrored in the phone app (`App/scripts/site_parity.py`), so a change there fails the app's checks. Your game's look lives in its own stylesheet in its own folder. The one shared place you may change is the games kit (section 5).
6. **The quiz** (`/games/quiz`) is the homepage quiz reused. The homepage is approved and live: its look must not change. Build the games-page version so that the homepage is untouched (a games-page component of its own, or switches the homepage never sets), never by editing what the homepage shows.
7. **The live youth-group quiz** has a Cloudflare Worker (`wrangler.live-quiz.jsonc`, `src/lib/live-quiz/`) that holds rooms and messages. Redesign the leader's screen and the players' phones; do not change the worker or the messages between them.

## 5. The shared games kit

Step 1 of the sequence builds `src/pages/games/kit/`: the behaviour several games share, named from the audits' README (likely a dealt-in card with press and lift, a reveal that turns a card over in place, a feedback band that slides up with Next inside it, a progress trail of squares or dots, a score count-up with a rank line and share, a streak counter, team chips, a restrained celebration). The kit carries **behaviour, not the look**: hooks, small components and keyframes driven by CSS variables the game sets (its colour, its radius, its type), so every game looks like itself. Owner's rule: two things in the same category must never look alike.

A game step uses the kit where it fits and may **extend or fix it** when it needs to, keeping it backward compatible, running the kit's tests and the tests of every game that imports it. The kit never imports a game. The kit's pieces and what each is for are listed in `src/pages/games/README.md` under a "Kit" heading; keep that list true.

## 6. Words on screen: the translation check

The site is translated into six languages, and the first step of `npm run build` is an English-text check (`content/translation/english_build_check.py`, explained in `content/translation/README.md`) that **stops the build** on on-screen English the collector cannot register, on sentences built from pieces around a value, on hand-written singular/plural choices and on number formats fixed to one language. Write every new word the way the newest games do (see "Words on screen" in `docs/features/hot-seat/design.md`):

- A player's or team's name stands in its own element, never inside a sentence.
- Counts use `plural`, places `ordinal`, numbers `formatNumber`, lists `formatList`, all from `src/lib/site-format.ts`.
- Labels are plain string literals between tags or under keys the collector reads. Whole phrases with numbers only ("Round 2 of 10") may be one template string.
- Text no reader sees needs no ruling; test fixtures are named `*.test.fixture.ts` or `*.test.*` so the collector skips them.

Run the check yourself (`py -3.12 content/translation/english_build_check.py` from the Website folder, or the runtime's Python named in `AGENTS.md`) and fix what it names in your own files. Do not add rulings to `unregistered-reviewed.json` for text a reader sees.

## 7. Verify before you report

In this order, from the Website folder, all with the runtime rules in `AGENTS.md`:

1. Your game's own tests and the hub's: `npx vitest run src/pages/games/<slug> src/pages/games/games.test.tsx` (and `src/pages/games/kit` if you touched it). Update tests that asserted on the old layout; add tests for any new logic (a count-up, a streak, a shuffle). Never lower a threshold to make a test pass.
2. Types and lint: `npm run typecheck` and `npx eslint src/pages/games/<slug>` (and the kit) with zero warnings.
3. The English check (section 6).
4. The build: `npm run build` (several minutes: its pre-build runs data checks, then Vite about a minute). If native SWC refuses the owner's cache, `bun run build:portable` as `AGENTS.md` says. The build updates `dist/`, so the preview now shows your work.
5. **Play it.** Open the game on the preview with Playwright at 1440 and 390, dark and light, from a fresh storage and from a saved game: start, a right answer, a wrong answer, mid-play, the end screen, share, keyboard play. Watch the console for errors. Save the screenshots as `docs/visual-audits/<slug>/after/desktop-NN-stage.png` and `phone-NN-stage.png`, named like the audit's so before and after pair up.
6. If something fails and you cannot fix it inside your time, leave the game working as it was before that change (revert that piece), and say so in the report.

## 8. Commit

Commit on `main` in the Website repository when the checks pass: **stage your own files by path** (the game folder, the kit if changed, `src/pages/games/README.md` if changed, the report and the after-screenshots), **never `git add -A`, never `git stash`, never a rebase or a force**: other chats have uncommitted work in the same tree, and it is theirs. Message: `Redesign: <game title> (from its visual audit)` and a line per audit item built. Push to `origin main` if the push is accepted without force; if it is refused, leave the commit and say so. **Never release or deploy** anything: the live site is the owner's call.

## 9. The report, for the owner to hear read aloud

Write `docs/visual-audits/<slug>-redesign.md`, short and plain, no code words, in this shape:

1. **What changed**, in one paragraph: how the game feels now.
2. **The audit's list, item by item:** built as asked / built differently (how and why) / not built (why). Then your own additions.
3. **Faults fixed** from "Anything broken" and "Phone problems", and any you found.
4. **Before and after:** for each stage, the audit's screenshot and your `after/` screenshot side by side as links (desktop and phone).
5. **Checks:** which tests, typecheck, lint, English check and build ran, and their result, honestly. The commit hash.
6. **Left for later**, if anything.

Write the report **as you go**, not at the end: a run with nothing written degrades the work. Keep a working ledger in your own folder, and update the report after each item. **Also copy the finished report and the four most telling after-screenshots into your own working folder** (`C:\FortressOrchestrator\workspaces\<your task id>\docs\visual-audits\`): the completion check reads only there, and four audit steps were sent back for want of that copy.

Write one DevLog entry for the job in `Jarvis/DevLogs/2026/11/` (project `bibleproject`, category `enhancement`), as the workspace rule requires, and run the DevLog filer's rebuild.

## 10. Time

A job has five hours and 400 steps. Spend the first twenty minutes reading (this file, the audit, the design doc, the game's code, the kit) and writing a short plan at the top of your ledger. Build the audit's items in rank order so the most valuable work lands first. Leave the last forty minutes for the build, the play-through, the report, the commit and the DevLog. If you are running out, commit what works and report what was not done. A half-built item that breaks the game is worse than an item not done.
