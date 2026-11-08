# Family charades — design

**Status:** research & design step (job cda34ed8, sequence 31 step 7, 2026-11-07). Next: one critical review (step 8), then the build (step 9).
**Spec (binding):** [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md), entry 19: *"Phone held to the forehead shows a scene (Jonah and the whale, David and Goliath); the player acts it out while others guess."*
**Step brief:** research Heads Up!-style phone party games; phone to the forehead shows a Bible scene to act out; tilt or tap for correct/pass, timer, decks by age and difficulty, scene list.
**Shared rules:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md). No model runs while people play (and none is used here at all). Existing site data is reused. Scripture wording follows the Berean Standard Bible (BSB). The game registers on the /games hub. Only this feature's files, plus its one registry line and README section, are touched. Nothing is deployed.
**Slug and route:** the hub already lists this game as `charades` ("Family charades", shelf Family and party, audiences Family and Youth group, picture `GAME_ART.charades` already drawn), so the game lives at `/games/charades`. The design folder is `family-charades` because the step brief named it so; the registry slug stays `charades` so no shared file changes beyond `status` and `load`.

---

## 0. Summary

One phone, one room, no accounts. The phone shows a Bible scene in very large letters ("Jonah and the great fish"). A guesser holds it to their forehead, screen facing out, so everyone can read it except them. The others act the scene out without words. When the guesser gets it, they **tip the phone down** (screen to the floor): *Correct*. To skip, they **tip it up** (screen to the ceiling): *Pass*. A new scene appears. When the timer (60 seconds by default) runs out, a recap lists every scene, ✓ or ↷, each with its Bible passage and a link to read the story.

- **Two ways to play** (§1.1): *Guess it* (the default: the phone on the guesser's forehead, the group acts) and *Act it* (classic charades: the actor reads the phone, acts, and the group guesses). The spec's literal wording cannot be played as written (whoever has the phone on their forehead cannot read the scene), so this is the design's main decision and the first point for the owner.
- **Controls** (§5): tilt where the phone has a working motion sensor and permission, big **Got it / Pass** buttons everywhere, and arrow keys on a computer. If tilt is unavailable, refused or silent, the game drops to buttons on its own and says so in one line. The tilt maths works the same whether the phone is upright or sideways.
- **Decks** (§3): pick *who is playing* (Little ones 4–7, Kids 8–12, Teens and adults), then *Everything* at Easy, Medium or Hard, or a theme deck (In the beginning; Judges, kings and prophets; Jesus' life; Miracles; Parables; The early church; Christmas and Easter). A deck is offered only when it holds at least 12 scenes.
- **Scenes** (§4, Appendix A): a hand-kept list of **129 scenes**, every one checked in this step against the site's own BSB text: each passage exists and contains the scene's check word. The check caught three of my own wrong assumptions (the site's BSB says *ladder*, not stairway, for Jacob's dream; *harp*, not lyre, for David; and there is no "sower" in Matthew 13:3–9).
- **Scoring** (§6): one point per correct scene; passes are free, as in Heads Up!. Optional teams (2–4, taking turns) keep running totals. A mis-tilt can be fixed on the recap before the score is kept.
- **Cost:** none. No new service, no new dependency, about 20 KB of static data.

---

## 1. What the spec fixes, and what this design decides

| Spec or brief says | Design decision |
|---|---|
| Phone held to the forehead shows a scene | The default mode, *Guess it*: a full-screen card, readable from across a living room, on the forehead of the guesser (§7.3). |
| "the player acts it out while others guess" | Taken literally this is impossible: the person with the phone on their forehead cannot see the scene. Two readings are both offered (§1.1). |
| Examples: Jonah and the whale, David and Goliath | Both are in the scene list, tier 1 (the easiest), for all ages. The card reads **"Jonah and the great fish"**, because the BSB says "a great fish" (Jonah 1:17) and never "whale"; "whale" is the KJV's word in Matthew 12:40. Guessers who shout "Jonah and the whale!" are of course right (§6.2). The data test fails if either scene is missing. |
| (Brief) tilt or tap for correct/pass | Tilt down = correct, tilt up = pass, exactly as Heads Up! does, so anyone who has played it already knows. Buttons and keys always work too (§5). |
| (Brief) timer | 30, 60, 90 or 120 seconds; 60 by default, 90 for Little ones. Visible to the actors in large digits; sound for the last five seconds (§6.1). |
| (Brief) decks by age and difficulty | Age group sets the content and reading level; difficulty applies to the Everything deck; theme decks mix difficulties (§3). |
| (Brief) scene list | 129 starter scenes in Appendix A, hand-kept in one small JSON file and checked by a test against the BSB (§4). |
| (Rules) no runtime model cost | Nothing is generated. The list is hand-written and machine-checked. |
| (Rules) reuse site data | The test reads the site's BSB plain text; the recap links to the site's reader and formats references with the site's own helpers; sound and screen-awake code follow the live quiz's existing patterns (§4.3). |
| (Rules) BSB, not KJV | Every card carries a check word that must occur in its BSB passage (§4.2). |
| (Rules) long lists | Not applicable: the longest list on screen is one round's recap, typically under 20 rows. |

### 1.1 The two modes

**Guess it (default) — "Heads Up! with acting."** The guesser holds the phone to their forehead. Everyone else acts the scene out, without words, at the same time or one at a time as they like. The guesser shouts guesses and tilts. This keeps the spec's picture (phone on the forehead, scene on the screen, acting, guessing) and is how Heads Up!'s own "act it out" decks are played. One phone serves the whole room, and the guesser needs no reading at all, so a four-year-old can be the guesser while the grown-ups act.

**Act it — classic charades.** The actor holds the phone facing themselves, reads the scene, then acts it out while the group guesses. When someone gets it, the actor taps *Got it* (or tilts, if they turned tilt on). This is the parlour game the name "charades" means, and it suits a youth group where one person performs for a crowd. Buttons are the default here, because tilting a phone while acting is awkward.

Both modes use the same decks, timer, scoring and recap; they differ only in the get-ready instruction, the default control, and that *Act it* shows a "Hide card" button so the actor can put the phone down without the scene showing.

---

## 2. Research

### 2.1 Heads Up! and the phone-on-forehead form

- **Heads Up!** came out in May 2013 for *The Ellen DeGeneres Show*, built by Impending (the makers of the to-do app Clear) and now published by Warner Bros. You pick a deck, hold the phone to your forehead and have 60 seconds while the others give clues. The App Store listing's own rule: *"Tilt down for correct answers and up to pass on challenging words."* Passing costs nothing. At the end it shows a recap of correct and passed words, and it can play back a video of the round recorded on the front camera. It has over 100 themed decks, some of them "act it out" decks. One 2013 review (Common Sense Media) describes the tilt directions the other way round; the App Store listing, press coverage and rule guides all agree on down = correct, so that is what this game uses.
- **What makes it work:** zero setup (no teams, no cards, no pencils), one shared object everyone looks at, a short timer that creates panic and laughter, and a recap that lets the group relive the round. The recording feature is the one part this game deliberately leaves out (§8, privacy and cost).
- **Bible versions already exist, all as native apps:** *Bible Charades – Heads Up Game* (iOS; adjustable timer and difficulty, packs including "For Kids"), *Selah: Bible Charades* (Android; paid decks, optional video), *Biblical Charades* and *Bible Charades!* (about 200 cards). They show the demand, and they show the gaps this site can fill: no install, no ads or subscriptions, a scene list checked against a modern translation, and a recap that links each scene to the passage.
- **An open-source web clone** (*heads-gone*, a football version) confirms the web can do this: it reads tilt from the browser's orientation events, asks iOS for permission on Start, and has Pass / Got it buttons and arrow keys as fallbacks. It computes tilt as `cos(beta)·cos(gamma)` so it works in portrait and landscape, the same approach as §5.2.

### 2.2 Charades itself

Charades began in 18th-century France as a spoken or written riddle about a word, syllable by syllable. By the 19th century the English played *acted* charades as a parlour game: Thackeray's *Vanity Fair* and Charlotte Brontë's *Jane Eyre* both have scenes of house guests performing them. The modern rules (no words, the group guesses, a timer) are the game families still know. Two lessons carry over: **acting needs something concrete to act** (a scene with a person and an action, not an abstract idea), and **the fun is in the guessing, so the guess is judged by the room, not by a machine**.

### 2.3 Why acting a story helps it stick

Memory research calls it the **enactment effect**: people remember actions they performed better than ones they only heard or read (Engelkamp and Cohen's work on "subject-performed tasks", from the 1980s on). A child who has *been* the great fish swallowing Jonah has a hook for the story. The recap turns that into reading: every scene has its passage and a one-tap link to read it.

### 2.4 What the browser can and cannot do (checked for this design)

| Capability | Where it works | What the game does |
|---|---|---|
| **Orientation events** (`deviceorientation`: angles `beta` and `gamma`) | Android Chrome and Firefox: on by default, secure pages (HTTPS) only. iPhone and iPad (Safari since iOS 13): off until the page calls `DeviceOrientationEvent.requestPermission()` **inside a tap**, which shows Apple's "Allow motion and orientation access" prompt and resolves `"granted"` or `"denied"`. Computers: usually no events, or events whose angles are `null`. | Ask on the Start tap (iOS); otherwise listen and wait up to one second for a real reading; drop to buttons if none arrives (§5.4). |
| **Orientation lock** (`screen.orientation.lock`) | Android Chrome, only while the page is fullscreen. Not on iPhone or iPad at all. iPhone Safari has no element fullscreen either. | Never rely on it. The card turns itself to stay upright for the watchers (§5.3). On Android, try fullscreen and a landscape lock on the Start tap and ignore failure. |
| **Keep screen awake** (Screen Wake Lock) | Chrome and Android browsers; Safari in normal tabs since iOS 16.4, and in Home Screen web apps only since iOS 18.4. Released whenever the page is hidden. | Request it on Start, re-request on return to the page, release at the end (the live quiz's existing pattern). Rounds are short, so a failure only means the phone may dim on a long recap. |
| **Vibration** | Android only; iPhone Safari does not support it. | A short buzz on correct and pass where available, off when the reader asks for reduced motion (the live quiz's existing rule). Never the only signal. |
| **Sound** (Web Audio) | Everywhere, once started from a tap; on iPhone it may be silent while the ring switch is on silent. | Synthesised beeps, no audio files. Sound is never the only signal (§7.5). |

### 2.5 What the research means for this game

1. **Copy the Heads Up! controls exactly** (down = correct, up = pass, free passes, 60 seconds, a recap). Familiarity is worth more than novelty in a party game.
2. **Never depend on the sensor.** A third of the ways people will open this page (a laptop, a refused prompt, an old phone, a page opened over plain HTTP during testing) give no tilt. Buttons must be a full game, not a fallback screen.
3. **Arm the tilt only from upright.** A phone lying on a table or held flat while setting up must never score.
4. **Make the card readable sideways and upright,** because the web cannot lock the screen the way an app can.
5. **Pick scenes you can act**: a person doing something visible, short enough to read at a glance from across a room.

---

## 3. Decks: by age and by difficulty

### 3.1 Two words used below

- **Tier** is how hard a scene is to guess *and* to act: **1** known to most churchgoing children and easy to act (Noah builds the ark); **2** known to regular readers (Naaman dips seven times); **3** deeper cuts (Rhoda leaves Peter at the gate). Tiers are hand-assigned, as in Memory card match.
- **Age** is the youngest group a scene is offered to: **4+**, **8+** or **12+**. It answers "can a young child act this, and should they?", not only "do they know it".

### 3.2 The choices on the start screen

1. **Who's playing?** — *Little ones (4–7)* · *Kids (8–12)* · *Teens and adults*. This sets the pool (scenes with age 4+, 8+ or all), whether pictures show (on for Little ones), and the default timer (90 s for Little ones, 60 s otherwise). Default: Kids.
2. **Deck** — *Everything* (default) or one theme.
3. **Difficulty** — shown only for *Everything* with Kids or Teens and adults: *Easy* (tier 1), *Medium* (tiers 1–2, default) or *Hard* (tiers 2–3). Little ones always get their whole pool (34 of its 45 scenes are tier 1). Theme decks are already narrow, so they play all tiers their age group allows.

### 3.3 Scene counts for every offered deck (from Appendix A)

A deck is **offered only if it holds at least 12 scenes**; a typical acted round gets through 6–12 scenes, so 12 means no repeat within a round and little across two. Smaller decks show as a disabled chip saying "Not enough scenes for this age yet".

| Deck | Little ones (4+) | Kids (8+) | Teens and adults |
|---|---|---|---|
| Everything, Easy | — (whole pool: **45**) | **35** | **35** |
| Everything, Medium | — | **96** | **97** |
| Everything, Hard | — | **89** | **94** |
| In the beginning (Genesis–Joshua) | **16** | 32 | 32 |
| Judges, kings and prophets | 7 (hidden) | 29 | 32 |
| Jesus' life | **16** | 37 | 37 |
| Miracles (both Testaments) | **14** | 33 | 33 |
| Parables | 6 (hidden) | 14 | 15 |
| The early church (Acts) | 1 (hidden) | 13 | 14 |
| Christmas and Easter | 8 (hidden) | 14 | 14 |

The data test recomputes this table from the file and checks the "offered" rule, so adding scenes later opens decks by itself.

### 3.4 Editorial rules for a family acting game

- **Act what is visible.** Every scene names a person or thing *and* something happening ("Zacchaeus climbs a tree", not "Zacchaeus").
- **No scene whose point is sexual** (no Bathsheba, no Potiphar's wife) and **no gruesome death to act out** (no Jael's tent peg, no Judas, no Eglon, no bears and Elisha).
- **Violence is age 8+ unless it is the familiar children's version.** "David and Goliath" is 4+ because the spec names it and every children's Bible has it; "Samson pushes the pillars" (he dies with the crowd) and "Job sits in the ashes" are 12+.
- **The crucifixion is not a charades card.** Acting it for laughs against a timer is not fitting. The Christmas and Easter deck carries Holy Week through Palm Sunday, the Last Supper, washing feet, Peter and the rooster, the empty tomb, Thomas, and the ascension. *(Open point for the owner, §13.)*
- **God is acted at most indirectly.** Only "God creates the world" and "God calls young Samuel" put God in the scene, and both can be acted from the human side (the world appearing; Samuel waking). *(Open point, §13.)*
- **Titles are BSB-faithful.** Where the familiar name is a KJV word, the card uses the BSB's (great fish, not whale; Magi, not wise men; robe, not coat).

---

## 4. The scene list

### 4.1 The file

`src/data/charades/scenes.json` — **hand-kept**, not generated. With 129 short rows and nothing to derive, a build script would add machinery without adding a check; the checks live in a test instead (§4.2), as Who's older?'s data test does.

```jsonc
{
  "about": "Family charades scenes, hand-kept. Design: docs/features/family-charades/design.md §4 and Appendix A. npm test checks every row against the BSB.",
  "version": 1,
  "themes": [
    { "key": "beginnings", "title": "In the beginning" },
    { "key": "kings", "title": "Judges, kings and prophets" },
    { "key": "jesus", "title": "Jesus' life" },
    { "key": "miracles", "title": "Miracles" },
    { "key": "parables", "title": "Parables" },
    { "key": "church", "title": "The early church" },
    { "key": "seasons", "title": "Christmas and Easter" }
  ],
  "scenes": [
    { "id": "jonah-fish", "title": "Jonah and the great fish", "ref": "JON 1:17-2:10", "check": "fish",
      "tier": 1, "age": 4, "themes": ["kings", "miracles"], "picture": "🐋", "story": "jonah-1" }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | Lower case, hyphens, unique, never reused for a different scene (the "recently seen" list in the browser keys on it). |
| `title` | The card. At most 36 characters (fits two lines at the minimum card size, §7.3). Starts with a capital; no full stop. |
| `ref` | Book code, chapter:verse, optional range (may cross a chapter: `JON 1:17-2:10`); several passages joined with `;`. Book codes as in the site's reader (`scripts/bible/books.py`). |
| `check` | A word or phrase that must occur, ignoring case and punctuation, in the BSB text of `ref`. |
| `tier` | 1, 2 or 3 (§3.1). |
| `age` | 4, 8 or 12 (§3.1). |
| `themes` | One or more theme keys. |
| `picture` | Optional, one to two emoji, shown above the title for Little ones (and for anyone who switches pictures on). Only emoji from Unicode Emoji 13.0 (2020) or older, so older Android phones do not show empty boxes. |
| `story` | Optional group key: scenes from one episode share it, and a round never deals two of them (§4.4). |

**No verse wording in the file.** The site's `prebuild` check ([check-verse-wording.py](Jarvis/Projects/BibleProject/Website/scripts/check-verse-wording.py)) refuses whole verses in data files; titles are a few words, and the one quotation ("Lazarus, come out!", John 11:43) is three words, so the check is never triggered.

### 4.2 The data test (`scenes.test.ts`, part of `npm test`)

It reads [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/) with `readFileSync`, as Who's older?'s data test reads the people file, and fails on:

1. a duplicate `id`, an unknown theme key, a tier outside 1–3, an age outside {4, 8, 12}, a title over 36 characters;
2. a `ref` whose book, chapter or verse does not exist in the BSB plain text;
3. a `check` that does not occur in the BSB text of the passage;
4. a `picture` outside the allowed emoji list (a small set in the test: every emoji Appendix A uses, all Emoji 13.0 or older);
5. a `story` key used by only one scene (a typo);
6. either spec example missing (`jonah-fish`, `david-goliath`), or either not tier 1 and age 4+;
7. the Everything deck at any age and difficulty falling below 12 scenes.

It also prints (does not fail) the §3.3 table, so a reviewer sees what a change does to the decks.

**This step ran the same checks** on the starter list with a throwaway script (kept in the job folder, `scenes/check_scenes.cda34ed8.py`): all 129 references exist and all 129 check words occur in the site's BSB text. It caught three of the draft's titles, written from memory, that did not match the site's BSB:

| Draft title | Site's BSB says | Card now |
|---|---|---|
| Jacob dreams of a stairway | "a dream about a ladder that rested on the earth" (Genesis 28:12) | Jacob dreams of a ladder to heaven |
| David plays the lyre for Saul | "David would pick up his harp and play" (1 Samuel 16:23) | David plays the harp for Saul |
| The sower and the seed (check word "sower") | "A farmer went out to sow his seed" (Matthew 13:3); "sower" only at 13:18 | The farmer sowing seed (check word "sow") |

### 4.3 Site data and code reused

| Existing piece | Use here |
|---|---|
| [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/) | The data test's source of truth for references and check words. |
| The reader route `/read/bsb/<BOOK>/<chapter>?hl=<first>-<last>` (as Memory card match and Odd one out link) | "Read the story" on the recap: the passage's verses in its first chapter. |
| [refs.ts](Jarvis/Projects/BibleProject/Website/src/lib/refs.ts) (`formatRange`, book names) | Turning `JON 1:17-2:10` into "Jonah 1:17–2:10" on the recap. |
| [PlayPage.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/live-quiz/PlayPage.tsx) (wake lock), [PlayerScreens.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/live-quiz/PlayerScreens.tsx) (vibrate, gated on reduced motion), [LeaderRoom.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/live-quiz/LeaderRoom.tsx) (Web Audio beeps) | Patterns copied into this game's own small files, not imported from live-quiz, so the two games stay independent (shared-file rule). |
| [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) entry `charades` | Switched to `status: "live"` with `load`; title, description, audiences, shelf and art stay as they are. |

**Not used:** the question bank (a quiz question is not an actable scene), and Memory card match's pairs file (its story labels are written to sit beside a name, "the lions' den", and are not actable on their own; a few scenes overlap in subject, which is expected).

### 4.4 Dealing scenes

`deck.ts`, pure and tested:

1. **Pool** = scenes allowed by age group, deck and difficulty (§3.2).
2. **Order**: shuffle the pool (Fisher–Yates with `crypto.getRandomValues`), then move scenes on the device's *recently seen* list to the back, oldest-seen first. The list holds the last 200 scene ids played, across rounds and visits (§6.4).
3. **One per story per round**: while dealing, skip a scene whose `story` key was already dealt this round (so "Noah builds the ark" and "The rainbow promise" never meet in one round, when a guesser could shout "Noah!" for both). Five story groups exist in the starter list: Noah, Joseph sold by his brothers, Jonah's storm and fish, Peter freed from prison, and the first disciples called.
4. **Running out**: if a long team game uses up the pool, the deal starts again from a fresh shuffle, still never repeating a scene inside one round. At 12 or more scenes per deck and at most about 15 per round, this always succeeds; the test proves it over 1,000 simulated rounds per offered deck.

---

## 5. Controls

### 5.1 The three ways to answer, all live at once

| Way | Correct | Pass | Available |
|---|---|---|---|
| **Tilt** | Screen tipped toward the floor | Screen tipped toward the ceiling | Guess it: on by default when the sensor works. Act it: off by default, can be turned on. |
| **Buttons** | *Got it* (green, ✓) | *Pass* (amber, ↷) | Always, in both modes. In Guess it with tilt on, they are smaller and sit at the screen's bottom edge so an actor can tap them for a guesser who tilts poorly; with tilt off they are large (at least 64 px tall, the full width split in two). |
| **Keys** | → or Space | ← | Always (a laptop on a table facing the actors, the guesser facing away, a helper pressing keys). Esc pauses. |

The start screen has a *Controls* choice: **Tilt and buttons** (default where the sensor works) or **Buttons only**. It remembers the choice.

### 5.2 Reading the tilt

The browser reports the phone's angles `beta` and `gamma` (degrees). The one number the game needs is **which way the screen faces, up or down**:

> **v = cos(beta) × cos(gamma)**

It is +1 with the phone lying face up on a table, −1 face down, and about 0 when the screen faces the room — on a forehead. It does not depend on whether the phone is upright or sideways, or which way round, so no orientation handling is needed for scoring. (It is the vertical part of the screen's facing direction under the angle convention of the W3C orientation specification; the *heads-gone* clone uses the same quantity.)

**The detector** (`tilt.ts`, pure, no browser objects, fed one reading at a time with its time stamp):

| State | Enters when | Leaves when |
|---|---|---|
| **Waiting for upright** | Start of a round, and after every answer | `|v| < 0.35` (within about 20° of facing the room) held for 300 ms → **Armed** |
| **Armed** | — | `v < −0.6` held for 120 ms → **Correct**; `v > +0.6` held for 120 ms → **Pass** (0.6 is about 37° past upright) |
| **Answered** | A correct or pass | The answer shows for 700 ms, then → Waiting for upright; the next scene appears only once the phone is upright again |

- The gap between 0.35 and 0.6 is deliberate: small nods and laughter do not count, and one tip can never count twice.
- A reading with `beta` or `gamma` equal to `null` is ignored (some computers send these).
- The thresholds are named constants in `tilt.ts`, so the build step can tune them after trying a real phone. The tests feed recorded-style sequences (steady forehead with jitter, a clean tip down, a clean tip up, a slow lean back, a phone put down flat) and check the outcome of each.

### 5.3 Keeping the card upright for the watchers

On a forehead the phone is usually sideways. An app can lock the screen sideways; a web page cannot (§2.4), and if the phone's own rotation lock is on, the page stays in portrait while the phone is held sideways, so the scene would read sideways to the room.

So, when tilt readings are available, the card **turns itself in steps of 90°** so its text stays upright to the people looking at it:

- The direction of "up" across the screen is `(−cos(beta)·sin(gamma), sin(beta))` in the phone's own frame. Its angle, minus the angle the browser has already turned the page (`screen.orientation.angle`, or the old `window.orientation` on older iPhones), snapped to the nearest 90°, is the turn to apply with a CSS transform on the card.
- The turn is updated **only while the phone is near upright** (`|v| < 0.35`), and only after the new angle has held for 400 ms, so the card never spins during a tilt or a wobble.
- Without tilt readings, the card simply follows the page's own layout; both portrait and landscape layouts are designed (§7.3).
- The sign of the angle depends on the browser's conventions and **must be checked on one real iPhone and one real Android phone** during the build (§11, manual checks); the pure function is unit-tested on known angles.

### 5.4 Getting permission, and falling back

All of this happens on the **Start** tap, because iOS only allows the permission prompt, fullscreen, wake lock and sound to start from a tap:

1. If the player chose *Buttons only*: skip to step 5.
2. If `DeviceOrientationEvent.requestPermission` is a function (iPhone, iPad): call it. `"granted"` → step 3. `"denied"` or an error → buttons, with the line *"Tilt is off because motion access was not allowed. You can play with the buttons, or reload the page and allow it."*
3. Listen for `deviceorientation`. If no reading with real numbers arrives within **1 second**: buttons, with *"This device isn't sending tilt here, so use the buttons."* (This covers computers, phones without the sensor, and pages opened over plain HTTP, where browsers send nothing.)
4. Tilt works: the get-ready screen says "Hold the phone to your forehead, screen facing out".
5. Also on the tap: try to keep the screen awake; start sound; on browsers that allow it (Android), try fullscreen and then a landscape lock, ignoring any refusal.

If readings **stop** in the middle of a round (for more than 3 seconds while the page is visible), the buttons grow to full size and a small line says *"Tilt stopped; use the buttons"*. The round goes on.

---

## 6. Timer and scoring

### 6.1 The timer

- **Length:** 30, 60, 90 or 120 seconds; default 60, or 90 when Little ones is chosen (acting takes children longer). Remembered per age group.
- **Start:** a 3-2-1 countdown that begins once the phone is held upright (tilt) or the *Start round* button is tapped (buttons). The first scene shows at "Go!".
- **Display:** large digits in a corner of the card, readable by the actors; the last 10 seconds turn amber and the last 5 tick (sound on).
- **Timing:** from an end time measured with `performance.now()`, not by counting ticks, so a busy phone never stretches a round.
- **Time's up:** a buzzer and a full-screen "Time's up!" for 1.2 seconds. The scene on screen at that moment is listed on the recap as *not played*, neither correct nor passed, and scores nothing (Heads Up! behaves the same way). It does not count as seen, so it may come up again soon.
- **Pause:** Esc, or the small ⏸ button, or the page being hidden (a call, a notification, switching apps) pauses the clock and covers the scene. Resume needs a tap, and then the phone held upright again (tilt), so nobody loses seconds while putting the phone back on their forehead.

### 6.2 What counts as correct

The room decides, as in every charades game; the screen only records it. *How to play* states the house rule shown on the start screen:

- **Easy and Little ones:** naming the main person *or* the main thing counts ("Jonah!", "the whale!").
- **Medium and Hard:** say who *and* what happens ("Jonah swallowed by the fish").
- Any wording counts: "whale" for the great fish, "wise men" for the Magi, "Joseph's coat" for the robe.

### 6.3 Points

- **One point per correct scene.** Passes cost nothing (as in Heads Up!), but the recap shows how many there were.
- **Fixing a mis-tilt:** on the recap, tapping a row's mark switches it between ✓ and ↷ (a not-played scene can be switched to ✓ too, for a guess that came just as the buzzer went). The score updates at once. Once the player taps *Next* or *Done*, the round's score is final.

### 6.4 Teams (optional)

- A *Teams* switch on the start screen: 2, 3 or 4 teams, named *Team 1…4* by default and renamable (16 characters at most), and the number of turns each (1–5, default 3).
- Turns rotate between teams. Between turns a hand-over screen says *"Team 2: pass the phone to your next guesser"* and shows the totals. Within a team, players take turns being the guesser; the game does not track individual players.
- After the last turn: final standings, the highest total first, with ties shown as ties (no tie-break: it is a family game).
- **Quick play** (Teams off) is one round at a time with one score and *Play again*.

### 6.5 What the game keeps on the device

- **`bp-charades` in local storage:** `{ version: 1, settings: { mode, ageGroup, deck, difficulty, seconds per age group, controls, sound, pictures }, best: { "30": n, "60": n, "90": n, "120": n }, recent: [up to 200 scene ids] }`. *Best* is the best single-round score per round length, shown on the start screen ("Best in 60 seconds: 11").
- **`bp-charades-game` in session storage:** a team game in progress (teams, totals, whose turn, finished rounds), so a reload, or opening "Read the story" in the same tab and coming back, never loses the scores. A round interrupted by a reload is dropped and that team's turn starts again; a half-played round cannot be resumed fairly.
- As in Who's older?'s storage file: storage that is missing, full or broken never stops the game; it just keeps nothing.

---

## 7. Screens

All screens live on the one page at `/games/charades`. The setup and recap sit inside the site's normal header and footer; the round itself fills the whole screen.

### 7.1 Start (setup)

- Title, the hub picture, one line: *"Hold the phone to your forehead, everyone acts out the Bible scene, and you guess."*
- **Mode:** two large cards, *Guess it — phone on your forehead* (default) and *Act it — classic charades*.
- **Who's playing?** chips: Little ones (4–7) · Kids (8–12) · Teens and adults.
- **Deck** chips: Everything · the seven themes (disabled with a reason where too small, §3.3); **Difficulty** chips under Everything (not for Little ones).
- **Round length** chips: 30 · 60 · 90 · 120 s. **Controls:** Tilt and buttons / Buttons only (the tilt option is hidden on devices that report no sensor support at all). **Sound** on/off. **Pictures** on/off (default on for Little ones). **Teams** switch, with team count, names and turns when on.
- *How to play* (collapsed): five short lines with a small drawing of the tilt directions, and the house rule of §6.2.
- **Start** (the big button; it runs §5.4). Below it: *Best in 60 seconds: 11*.

### 7.2 Get ready (full screen)

- Guess it with tilt: *"Hold the phone to your forehead, screen facing out."* with a drawing; *"Tip down when you get it. Tip up to pass."* The countdown starts by itself once the phone is upright.
- Guess it with buttons: *"Hold the phone on your forehead, or give it to a helper who holds it facing the actors. Tap Got it or Pass."* and a *Start round* button.
- Act it: *"Read your scene, then act it out. No talking! Tap Got it when someone guesses."* and *Start round*.
- With teams: *"Team 2's turn"* at the top.

### 7.3 The card (full screen, during the round)

- The scene title as large as fits: the text is sized to fill the card in at most three lines, never below 28 px, using the screen's short side in portrait and long side in landscape (the 36-character limit was set so the longest title, "A burning coal touches Isaiah's lips", fits in two lines at 28 px on a 320 px-wide phone in portrait).
- The picture above it, when pictures are on.
- The timer in a corner; the round's score small in the opposite corner.
- Buttons as §5.1. In *Act it*, a *Hide card* button blanks the card until tapped again.
- High contrast in both the light and dark themes (dark text on the paper colour, or light on ink), no decoration behind the text.
- **Feedback:** after an answer the whole screen turns green with "✓ Correct!" or amber with "↷ Pass" for 700 ms, with a sound and a short vibration where available. The words and symbols carry the meaning; colour only reinforces it.

### 7.4 Time's up and recap

- "Time's up!" for 1.2 seconds, then the recap (back in the site's layout).
- Large score: *"7 correct"*, with *"3 passed"* beside it; *"New best!"* if it is one.
- The list, in the order played: ✓ / ↷ / – (not played), the scene title, its reference ("Jonah 1:17–2:10") and **Read the story**. Tapping the mark corrects it (§6.3).
- Buttons: *Next team* (teams) or *Play again*, and *Change deck*.

### 7.5 Pause sheet, team hand-over, final standings

- **Pause:** Resume · End round now (goes to the recap with what was played) · Sound on/off.
- **Hand-over** and **final standings:** team names and totals, largest first, as in §6.4. Final standings offer *New game* and *Change deck*.

---

## 8. Things deliberately left out

- **Camera recording** (Heads Up!'s video replay): it would film children in people's homes, need a camera permission, and store video. Not worth it for a Bible site.
- **Speech recognition** to judge guesses: needs a cloud service or heavy downloads on many phones, and charades is judged by the room anyway.
- **Online play / several phones:** the live quiz already covers group play across devices; charades is one phone in one room.
- **Custom decks typed by players:** they would put unchecked text on the site's pages and need storage and moderation. Possible later if the owner wants it (§13).
- **A share text:** a living-room game has no daily puzzle to compare. (*Best* scores stay on the device.)

---

## 9. Accessibility

- **A blind or low-vision guesser can play Guess it fully:** the guesser never needs to see the screen. Tilt, or a sighted actor tapping the buttons, records the answer; sound gives feedback.
- **Act it with a screen reader:** the card is a heading the reader can read on request; it is not a live region, so a screen reader never announces a scene out loud to the room by itself.
- **Buttons and keys** do everything tilt does, so tilt is never required; every control has a visible label and a focus outline.
- **Reduced motion:** the card turns without animation, the feedback colour changes without a fade or shake, the countdown has no zoom, and there is no vibration.
- **No flashing:** feedback is one colour change per answer, well under the three-flashes-per-second limit.
- **Text size:** card text never below 28 px; the setup screen follows the site's normal sizes and zoom.
- **Colour:** green and amber are paired with ✓ / ↷ and words, and both pass contrast against their text in both themes.
- **Sound** is optional and never the only signal; vibration likewise.

---

## 10. Files

| File | What it holds |
|---|---|
| `src/data/charades/scenes.json` | The hand-kept scene list (§4.1, Appendix A). |
| `src/pages/games/charades/CharadesGame.tsx` | The page: setup, round, recap and teams screens, wired to a reducer. Default export, no props (games README). |
| `src/pages/games/charades/Setup.tsx`, `Round.tsx`, `Recap.tsx`, `Teams.tsx` | The screens (§7). |
| `src/pages/games/charades/game.ts` | The round reducer: start, answer, pause, resume, time up, fix a mark; team rotation and totals. Pure. |
| `src/pages/games/charades/deck.ts` | Pools, offered decks, dealing (§3, §4.4). Pure. |
| `src/pages/games/charades/tilt.ts` | `screenFacing(beta, gamma)`, `uprightTurn(beta, gamma, screenAngle)`, and the detector state machine (§5.2, §5.3). Pure. |
| `src/pages/games/charades/sensors.ts` | Permission request, the one-second readiness check, the `deviceorientation` listener as a React hook, fullscreen and orientation-lock attempts, wake lock (§5.4). |
| `src/pages/games/charades/sound.ts` | Web Audio beeps: correct, pass, tick, buzzer. |
| `src/pages/games/charades/storage.ts` | `bp-charades` and `bp-charades-game` (§6.5). |
| `src/pages/games/charades/charades.css` | The full-screen card, fit-to-size text, feedback colours, both themes, reduced motion. |
| Tests: `tilt.test.ts`, `deck.test.ts`, `game.test.ts`, `storage.test.ts`, `scenes.test.ts`, `CharadesGame.test.tsx` | §11. |
| [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) | The `charades` entry: `status: "live"`, `load: () => import("./charades/CharadesGame")`. Nothing else in the file. |
| [README.md](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) | A "Family charades" section like the other games': data, controls, known gaps, checks. |

No new dependency. The words are English in every language, like the other games' (a known gap, noted in the README section).

---

## 11. Tests

All run in `npm test` (Vitest), beside the code:

- **`tilt.test.ts`:** `screenFacing` at known angles (flat face up = 1, face down = −1, upright portrait and both landscape directions ≈ 0); the detector on synthetic sequences: forehead jitter (±15°) never answers; a tip down past 40° gives one Correct; a tip up gives one Pass; holding tipped gives exactly one answer; a phone put down flat before arming gives nothing; a `null` reading is ignored; arming needs 300 ms upright. `uprightTurn` gives 0/90/180/270 for the four ways of holding, and does not change during a tilt.
- **`deck.test.ts`:** pools match §3.3; small decks are not offered; no scene twice in one round; never two scenes of one story in one round; recently seen scenes come last; 1,000 simulated rounds per offered deck all deal 15 scenes; running out reshuffles without a repeat inside a round.
- **`game.test.ts`:** time up leaves the current scene not played; pause stops the clock; fixing a mark changes the score until *Next*; team rotation and totals; ties.
- **`storage.test.ts`:** round trip; broken or missing storage never throws; an old `version` is dropped.
- **`scenes.test.ts`:** every rule of §4.2 against the real BSB files.
- **`CharadesGame.test.tsx`** (with fake timers): a buttons-only round from Start to recap; a tilt round driven by dispatched `deviceorientation` events, including a mocked iOS `requestPermission` returning `"granted"` and `"denied"` (the second ending on buttons with its message), and no readings at all (buttons after one second); the hub opens `/games/charades` and shows the game.
- **Manual checks the build step should report** (cannot be automated): on one iPhone (Safari) and one Android phone (Chrome), over HTTPS (the local preview opened over plain HTTP on a phone sends no tilt), confirm tip down = Correct, tip up = Pass, the card stays upright sideways with the phone's rotation lock both on and off, and the screen stays awake through a round.

---

## 12. Edge cases

| Situation | What happens |
|---|---|
| iPhone, player refuses motion access | Buttons, with the one-line reason and how to get tilt back (§5.4). |
| Computer, or a phone with no sensor | No readings within 1 s → buttons; the tilt option is hidden next time if the browser reports no support. |
| Page opened over plain HTTP (testing on a phone) | Browsers send no orientation events on insecure pages → buttons, same message. The README notes it for developers. |
| Readings stop mid-round | After 3 s without readings while visible, buttons grow and a line explains; the round continues. |
| Phone lying flat when Start is tapped | The detector waits for upright; nothing scores until the phone is held up. |
| Guesser leans back laughing | Needs about 37° past upright held for 120 ms; a lean usually passes through the 20° neutral band without reaching it. If it does count, the recap fixes it. |
| Phone held upright (portrait) instead of sideways | Works the same: the tilt number does not depend on orientation, and the portrait card layout is designed. |
| Phone's rotation lock on, held sideways | The card turns itself 90° so the room reads it upright (§5.3). |
| Phone held upside down | The card turns 180° the same way. |
| Incoming call, notification, app switch | Page hidden → pause, scene covered, clock stopped; resume needs a tap and upright again. |
| Screen dims or locks | Wake lock prevents it where supported (and is requested again on return); on iPhone Home Screen web apps before iOS 18.4 it may dim on a long recap, never in a 60-second round with taps. |
| Sound silent (iPhone on silent, or browser blocks audio) | Feedback is visual first; nothing depends on sound. |
| Two answers in quick succession (tilt and tap together) | The first answer wins; the card ignores input during the 700 ms feedback and until upright again. |
| Answer at the same instant as the buzzer | Time's up wins; the recap lets the room mark that scene ✓ (§6.3). |
| Deck smaller than a long team game needs | Reshuffle; never a repeat inside one round (§4.4). |
| Settings change between team turns | Not offered mid-game; *Change deck* ends the team game after a confirmation. |
| Reload during a team game | Team totals and finished rounds come back from session storage; the interrupted round's turn restarts. |
| Reload during quick play | Back to the start screen with settings kept. |
| Storage blocked (private mode) | Game plays normally, keeps nothing. |
| An emoji not supported by an old phone | Pictures are limited to Emoji 13.0 or older; if one still shows as a box, the title carries the scene on its own. |
| Very small screen (320 px) or very large (tablet, laptop) | Text fits by size rule (§7.3) between 28 px and a cap that keeps three lines inside the card. |
| A deck chosen that has become too small after a data change | Saved settings fall back to Everything at the age group's default. |
| Keyboard user on a computer | → / Space, ← and Esc do everything; focus stays on the card during a round. |

---

## 13. Open points for the review step and the owner

1. **Which mode is the main one?** This design defaults to *Guess it* (phone on the guesser's forehead, everyone acts), because it keeps the spec's forehead picture and the spec's literal wording cannot be played. *Act it* (classic charades) is offered beside it. The owner may prefer the reverse default.
2. **No crucifixion card** (§3.4). Confirm, or name an alternative scene.
3. **God in scenes** ("God creates the world", "God calls young Samuel"). Keep, or drop for families who would rather not act God at all.
4. **Parables** are stories Jesus told, not events. They are their own deck and appear in Everything; drop them from Everything if preferred.
5. **Custom decks** typed by players: left out (§8). Wanted later?
6. **Tilt thresholds** (§5.2) are starting values from the research; the build step should try them on a real phone and may adjust them.

---

## 14. Cost

- **Money:** none. No new service, no API, no model at any stage, no new npm package.
- **Size:** `scenes.json` about 20 KB raw (well under 10 KB compressed), loaded only with the game's own page.
- **External dependency:** none. The phone's own sensors and the browser's built-in audio, all on the device.

---

## 15. Sources

- Heads Up! rules and history: [App Store listing](https://apps.apple.com/us/app/id623592465) ("Tilt down for correct answers and up to pass"), [MacRumors forum, 2013](https://forums.macrumors.com/threads/new-party-game-heads-up-featured-on-the-ellen-show.1577896/), [AppSamurai case study](https://appsamurai.com/blog/mobile-app-success-story-heads-up/), [Common Sense Media review](https://www.commonsensemedia.org/app-reviews/heads-up) (gives the directions reversed), [PlayPartyGame rules guide](https://playpartygame.com/guessing-and-mystery-games/how-to-play-heads-up/), [Psycat Games rules guide](https://psycatgames.com/magazine/party-games/heads-up-game/).
- Bible versions: [Bible Charades – Heads Up Game](https://apps.apple.com/us/app/bible-charades-heads-up-game/id6448217228), [Selah: Bible Charades](https://play.google.com/store/apps/details?id=com.selah.bible.headsup.quiz.games), [Biblical Charades](https://apps.apple.com/us/app/biblical-charades/id1615680390), [Bible Charades!](https://apps.apple.com/us/app/bible-charades/id6475134920).
- Web clone and tilt approach: [heads-gone on GitHub](https://github.com/matt-jeffries/heads-gone); [MDN, Detecting device orientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation); [MDN, DeviceOrientationEvent.requestPermission()](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static); [W3C DeviceOrientation draft with screen-angle remapping](https://richtr.github.io/deviceorientation/spec-source-orientation.html).
- Orientation lock and fullscreen: [MDN, ScreenOrientation.lock()](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock); [W3C Screen Orientation](https://www.w3.org/TR/2022/WD-screen-orientation-20221012).
- Wake lock: [WebKit, Safari 18.4 features](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/), [WebKit bug 254545](https://bugs.webkit.org/show_bug.cgi?id=254545), [Can I use: Screen Wake Lock](https://caniuse.com/wake-lock).
- Enactment effect: Engelkamp, J. & Cohen, R. L. (1991), "Current issues in memory of action events", *Psychological Research* 53; Cohen, R. L. (1981), "On the generality of some memory laws", *Scandinavian Journal of Psychology* 22.
- Scene wording: the site's own BSB text, [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/), checked by script in this step.

---

## Appendix A. Starter scenes (129, every reference and check word checked against the site's BSB)

Columns: **Card** is what the screen shows; **Pic** the picture for Little ones; **Check word** must occur in the passage; **Tier** 1 easiest to 3 hardest; **Age** the youngest group offered it; **Decks** the themes (Beg = In the beginning, Kings = Judges, kings and prophets, Jesus = Jesus' life, Mir = Miracles, Par = Parables, Church = The early church, Seas = Christmas and Easter); **Story** marks scenes never dealt together in one round. Every scene is also in Everything.

| # | id | Card | Pic | Passage (BSB) | Check word | Tier | Age | Decks | Story |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `creation` | God creates the world | 🌍 | Genesis 1:1–31 | created | 1 | 4+ | Beg |  |
| 2 | `adam-names-animals` | Adam names the animals | 🦒 | Genesis 2:19–20 | names | 1 | 4+ | Beg |  |
| 3 | `forbidden-fruit` | The serpent and the fruit | 🐍 | Genesis 3:1–7 | serpent | 1 | 4+ | Beg |  |
| 4 | `noah-builds-ark` | Noah builds the ark | 🚢 | Genesis 6:13–22 | ark | 1 | 4+ | Beg | noah |
| 5 | `animals-into-ark` | The animals go into the ark | 🐘 | Genesis 7:7–9 | two by two | 1 | 4+ | Beg | noah |
| 6 | `dove-olive-leaf` | The dove brings an olive leaf | 🕊️ | Genesis 8:8–11 | olive | 2 | 4+ | Beg | noah |
| 7 | `rainbow` | The rainbow promise | 🌈 | Genesis 9:12–17 | rainbow | 1 | 4+ | Beg | noah |
| 8 | `tower-of-babel` | The tower of Babel | 🧱 | Genesis 11:1–9 | tower | 2 | 8+ | Beg |  |
| 9 | `abraham-stars` | Abraham counts the stars | ✨ | Genesis 15:5 | stars | 2 | 4+ | Beg |  |
| 10 | `sarah-laughs` | Sarah laughs at the news | 😂 | Genesis 18:10–15 | laughed | 2 | 8+ | Beg |  |
| 11 | `lots-wife` | Lot's wife looks back | 🧂 | Genesis 19:26 | salt | 2 | 8+ | Beg |  |
| 12 | `esau-stew` | Esau trades his birthright for stew | 🍲 | Genesis 25:29–34 | stew | 2 | 8+ | Beg |  |
| 13 | `jacob-ladder` | Jacob dreams of a ladder to heaven | 🪜 | Genesis 28:10–17 | ladder | 2 | 8+ | Beg |  |
| 14 | `jacob-wrestles` | Jacob wrestles until daybreak | 🤼 | Genesis 32:22–30 | wrestled | 2 | 8+ | Beg |  |
| 15 | `joseph-robe` | Joseph's robe of many colors | 🧥 | Genesis 37:3 | robe | 1 | 4+ | Beg | joseph-37 |
| 16 | `joseph-sold` | Joseph's brothers sell him | 💰 | Genesis 37:23–28 | sold | 2 | 8+ | Beg | joseph-37 |
| 17 | `pharaohs-dreams` | Joseph explains Pharaoh's dreams | 🐄 | Genesis 41:14–32 | cows | 2 | 8+ | Beg |  |
| 18 | `joseph-forgives` | Joseph forgives his brothers | 🤗 | Genesis 45:1–15 | Joseph | 2 | 8+ | Beg |  |
| 19 | `baby-moses` | Baby Moses in a basket | 🧺 | Exodus 2:1–10 | basket | 1 | 4+ | Beg |  |
| 20 | `burning-bush` | The burning bush | 🔥 | Exodus 3:1–6 | bush | 1 | 4+ | Beg |  |
| 21 | `plague-of-frogs` | The plague of frogs | 🐸 | Exodus 8:1–15 | frogs | 1 | 4+ | Beg, Mir |  |
| 22 | `red-sea` | Crossing the Red Sea | 🌊 | Exodus 14:21–29 | sea | 1 | 4+ | Beg, Mir |  |
| 23 | `miriam-tambourine` | Miriam dances with a tambourine | 🪘 | Exodus 15:20–21 | tambourine | 3 | 8+ | Beg |  |
| 24 | `manna` | Manna from heaven | 🍞 | Exodus 16:13–31 | manna | 2 | 4+ | Beg, Mir |  |
| 25 | `water-from-rock` | Moses strikes the rock | 🪨 | Exodus 17:1–7 | rock | 2 | 8+ | Beg, Mir |  |
| 26 | `moses-arms` | Moses' arms held up | 🙌 | Exodus 17:10–13 | hands | 3 | 8+ | Beg |  |
| 27 | `ten-commandments` | The Ten Commandments | 📜 | Exodus 34:1–4; Exodus 34:28 | Ten Commandments | 1 | 4+ | Beg |  |
| 28 | `golden-calf` | The golden calf | 🐂 | Exodus 32:1–6 | calf | 2 | 8+ | Beg |  |
| 29 | `giant-grapes` | The spies carry huge grapes | 🍇 | Numbers 13:23 | grapes | 3 | 8+ | Beg |  |
| 30 | `balaams-donkey` | Balaam's talking donkey | 🐴 | Numbers 22:21–33 | donkey | 2 | 8+ | Beg, Mir |  |
| 31 | `rahab-cord` | Rahab and the scarlet cord | 🧶 | Joshua 2:15–21 | scarlet | 3 | 8+ | Beg |  |
| 32 | `jericho-walls` | The walls of Jericho fall | 🎺 | Joshua 6:1–20 | wall | 1 | 4+ | Beg, Mir |  |
| 33 | `gideon-fleece` | Gideon and the fleece | 🐑 | Judges 6:36–40 | fleece | 2 | 8+ | Kings |  |
| 34 | `gideon-jars` | Gideon's torches, jars and horns | 🏺 | Judges 7:16–22 | jars | 3 | 8+ | Kings |  |
| 35 | `samson-lion` | Samson and the lion | 🦁 | Judges 14:5–6 | lion | 2 | 8+ | Kings |  |
| 36 | `samson-pillars` | Samson pushes the pillars | 🏛️ | Judges 16:25–30 | pillars | 2 | 12+ | Kings |  |
| 37 | `ruth-gleans` | Ruth gleans in Boaz's field | 🌾 | Ruth 2:2–17 | glean | 2 | 8+ | Kings |  |
| 38 | `hannah-prays` | Hannah prays for a baby | 🙏 | 1 Samuel 1:9–20 | prayed | 3 | 8+ | Kings |  |
| 39 | `samuel-called` | God calls young Samuel | 🛏️ | 1 Samuel 3:1–10 | Samuel | 1 | 4+ | Kings |  |
| 40 | `david-anointed` | Samuel anoints the shepherd boy | 🫒 | 1 Samuel 16:1–13 | anointed | 2 | 8+ | Kings |  |
| 41 | `david-harp` | David plays the harp for Saul | 🎶 | 1 Samuel 16:14–23 | harp | 2 | 8+ | Kings |  |
| 42 | `david-goliath` | David and Goliath | 🪨 | 1 Samuel 17:4–50 | Goliath | 1 | 4+ | Kings |  |
| 43 | `david-cuts-robe` | David cuts Saul's robe | ✂️ | 1 Samuel 24:1–7 | robe | 3 | 8+ | Kings |  |
| 44 | `david-dances` | David dances before the ark | 💃 | 2 Samuel 6:12–16 | dancing | 2 | 8+ | Kings |  |
| 45 | `solomon-two-mothers` | Solomon and the two mothers | ⚖️ | 1 Kings 3:16–28 | sword | 2 | 8+ | Kings |  |
| 46 | `solomon-temple` | Solomon builds the temple | 🛕 | 1 Kings 6:1–14 | temple | 2 | 8+ | Kings |  |
| 47 | `queen-of-sheba` | The queen of Sheba visits | 👑 | 1 Kings 10:1–13 | Sheba | 3 | 8+ | Kings |  |
| 48 | `elijah-ravens` | Ravens feed Elijah | 🐦 | 1 Kings 17:2–6 | ravens | 2 | 4+ | Kings, Mir |  |
| 49 | `elijah-carmel` | Fire on Mount Carmel | 🔥 | 1 Kings 18:20–39 | fire | 2 | 8+ | Kings, Mir |  |
| 50 | `elijah-chariot` | Elijah's chariot of fire | 🐎 | 2 Kings 2:11–12 | chariot | 2 | 4+ | Kings, Mir |  |
| 51 | `widows-oil` | The widow's jars of oil | 🏺 | 2 Kings 4:1–7 | oil | 3 | 8+ | Kings, Mir |  |
| 52 | `naaman-dips` | Naaman dips seven times | 🛁 | 2 Kings 5:9–14 | seven | 2 | 8+ | Kings, Mir |  |
| 53 | `floating-axe` | The floating axe head | 🪓 | 2 Kings 6:1–7 | axe | 3 | 8+ | Kings, Mir |  |
| 54 | `nehemiah-wall` | Nehemiah rebuilds the wall | 🧱 | Nehemiah 2:17–18; Nehemiah 6:15 | wall | 3 | 8+ | Kings |  |
| 55 | `esther-scepter` | Queen Esther before the king | 👑 | Esther 5:1–3 | scepter | 2 | 8+ | Kings |  |
| 56 | `job-ashes` | Job sits in the ashes | 😔 | Job 2:7–13 | ashes | 3 | 12+ | Kings |  |
| 57 | `isaiah-coal` | A burning coal touches Isaiah's lips | 🔥 | Isaiah 6:6–7 | coal | 3 | 12+ | Kings |  |
| 58 | `dry-bones` | The valley of dry bones | 🦴 | Ezekiel 37:1–10 | bones | 3 | 8+ | Kings |  |
| 59 | `fiery-furnace` | Three friends in the fiery furnace | 🔥 | Daniel 3:19–27 | furnace | 1 | 4+ | Kings, Mir |  |
| 60 | `writing-on-wall` | The writing on the wall | ✋ | Daniel 5:5–6 | wrote | 2 | 8+ | Kings |  |
| 61 | `lions-den` | Daniel in the lions' den | 🦁 | Daniel 6:16–23 | den | 1 | 4+ | Kings, Mir |  |
| 62 | `jonah-storm` | Jonah thrown overboard | ⛈️ | Jonah 1:4–15 | storm | 2 | 8+ | Kings | jonah-1 |
| 63 | `jonah-fish` | Jonah and the great fish | 🐋 | Jonah 1:17–2:10 | fish | 1 | 4+ | Kings, Mir | jonah-1 |
| 64 | `jonah-plant` | Jonah sulks under a plant | 🌿 | Jonah 4:5–8 | plant | 3 | 8+ | Kings |  |
| 65 | `angel-visits-mary` | The angel visits Mary | 👼 | Luke 1:26–38 | Gabriel | 1 | 4+ | Jesus, Seas |  |
| 66 | `no-room-inn` | No room at the inn | 🏠 | Luke 2:1–7 | inn | 1 | 4+ | Jesus, Seas |  |
| 67 | `shepherds-angels` | Angels appear to the shepherds | 🐑 | Luke 2:8–14 | shepherds | 1 | 4+ | Jesus, Seas |  |
| 68 | `magi-star` | The Magi follow the star | ⭐ | Matthew 2:1–11 | Magi | 1 | 4+ | Jesus, Seas |  |
| 69 | `flight-to-egypt` | Escape to Egypt by night | 🌙 | Matthew 2:13–15 | Egypt | 3 | 8+ | Jesus, Seas |  |
| 70 | `simeon-holds-jesus` | Simeon holds baby Jesus | 👶 | Luke 2:25–32 | Simeon | 3 | 8+ | Jesus, Seas |  |
| 71 | `boy-jesus-temple` | Boy Jesus in the temple | 📖 | Luke 2:41–50 | temple | 2 | 8+ | Jesus |  |
| 72 | `john-locusts` | John eats locusts and honey | 🦗 | Matthew 3:1–4 | locusts | 2 | 8+ | Jesus |  |
| 73 | `jesus-baptized` | Jesus is baptized | 🕊️ | Matthew 3:13–17 | baptized | 1 | 4+ | Jesus |  |
| 74 | `water-into-wine` | Water into wine | 🍷 | John 2:1–11 | wine | 1 | 4+ | Jesus, Mir |  |
| 75 | `fishers-of-men` | Fishers of men | 🎣 | Matthew 4:18–20 | fishers of men | 2 | 8+ | Jesus | first-disciples |
| 76 | `nets-full-of-fish` | Nets full of fish | 🐟 | Luke 5:4–7 | nets | 2 | 4+ | Jesus, Mir | first-disciples |
| 77 | `calming-the-storm` | Jesus calms the storm | ⛈️ | Mark 4:35–41 | storm | 1 | 4+ | Jesus, Mir |  |
| 78 | `walking-on-water` | Jesus walks on the water | 🌊 | Matthew 14:25–31 | water | 1 | 4+ | Jesus, Mir |  |
| 79 | `loaves-and-fish` | Five loaves and two fish | 🍞 | John 6:5–13 | loaves | 1 | 4+ | Jesus, Mir |  |
| 80 | `through-the-roof` | A man lowered through the roof | 🏠 | Mark 2:1–12 | roof | 2 | 8+ | Jesus, Mir |  |
| 81 | `pool-of-bethesda` | Pick up your mat and walk | 🛏️ | John 5:1–9 | mat | 3 | 8+ | Jesus, Mir |  |
| 82 | `blind-bartimaeus` | Blind Bartimaeus sees | 👀 | Mark 10:46–52 | Bartimaeus | 2 | 8+ | Jesus, Mir |  |
| 83 | `ten-lepers` | Ten lepers, one comes back | 🔟 | Luke 17:11–19 | ten | 2 | 8+ | Jesus, Mir |  |
| 84 | `jairus-daughter` | Jairus's daughter gets up | 🧒 | Mark 5:35–43 | girl | 2 | 8+ | Jesus, Mir |  |
| 85 | `lazarus` | Lazarus, come out! | 🪦 | John 11:38–44 | Lazarus, come out | 2 | 8+ | Jesus, Mir |  |
| 86 | `zacchaeus` | Zacchaeus climbs a tree | 🌳 | Luke 19:1–10 | sycamore | 1 | 4+ | Jesus |  |
| 87 | `jesus-and-children` | Jesus welcomes the children | 🧒 | Mark 10:13–16 | children | 1 | 4+ | Jesus |  |
| 88 | `mary-and-martha` | Martha busy, Mary listening | 🍽️ | Luke 10:38–42 | Martha | 2 | 8+ | Jesus |  |
| 89 | `woman-at-well` | The woman at the well | 🪣 | John 4:5–15 | well | 2 | 8+ | Jesus |  |
| 90 | `widows-coins` | The widow's two small coins | 🪙 | Mark 12:41–44 | coins | 2 | 8+ | Jesus |  |
| 91 | `transfiguration` | Jesus shines on the mountain | ☀️ | Matthew 17:1–8 | shone | 3 | 8+ | Jesus |  |
| 92 | `coin-in-fish` | A coin in the fish's mouth | 🐟 | Matthew 17:24–27 | coin | 3 | 8+ | Jesus, Mir |  |
| 93 | `palm-sunday` | Riding into Jerusalem on a donkey | 🌿 | Matthew 21:1–11 | branches | 1 | 4+ | Jesus, Seas |  |
| 94 | `temple-tables` | Jesus overturns the tables | 🪙 | Matthew 21:12–13 | tables | 2 | 8+ | Jesus, Seas |  |
| 95 | `washing-feet` | Jesus washes the disciples' feet | 🦶 | John 13:3–12 | feet | 2 | 4+ | Jesus, Seas |  |
| 96 | `last-supper` | The Last Supper | 🍞 | Luke 22:14–20 | bread | 2 | 8+ | Jesus, Seas |  |
| 97 | `peter-rooster` | Peter and the rooster | 🐓 | Luke 22:54–62 | rooster | 2 | 8+ | Jesus, Seas |  |
| 98 | `empty-tomb` | The empty tomb | 🪨 | Luke 24:1–8 | tomb | 1 | 4+ | Jesus, Seas |  |
| 99 | `doubting-thomas` | Thomas sees and believes | ✋ | John 20:24–29 | Thomas | 2 | 8+ | Jesus, Seas |  |
| 100 | `breakfast-on-beach` | Breakfast on the beach | 🔥 | John 21:4–13 | charcoal | 3 | 8+ | Jesus |  |
| 101 | `ascension` | Jesus is taken up in a cloud | ☁️ | Acts 1:9–11 | cloud | 2 | 4+ | Jesus, Church, Seas |  |
| 102 | `good-samaritan` | The good Samaritan | 🩹 | Luke 10:30–37 | Samaritan | 1 | 4+ | Par |  |
| 103 | `prodigal-son` | The prodigal son comes home | 🐖 | Luke 15:11–32 | pigs | 1 | 8+ | Par |  |
| 104 | `lost-sheep` | The lost sheep | 🐑 | Luke 15:3–7 | sheep | 1 | 4+ | Par |  |
| 105 | `lost-coin` | The lost coin | 🪙 | Luke 15:8–10 | coin | 2 | 4+ | Par |  |
| 106 | `house-on-rock` | The house on the rock | 🏠 | Matthew 7:24–27 | rock | 1 | 4+ | Par |  |
| 107 | `lamp-under-basket` | A lamp under a basket | 🪔 | Matthew 5:14–16 | basket | 2 | 4+ | Par |  |
| 108 | `mustard-seed` | The mustard seed | 🌱 | Matthew 13:31–32 | mustard | 2 | 4+ | Par |  |
| 109 | `sower` | The farmer sowing seed | 🌾 | Matthew 13:3–9 | sow | 2 | 8+ | Par |  |
| 110 | `speck-and-beam` | A speck and a beam in the eye | 🪵 | Matthew 7:3–5 | beam | 2 | 8+ | Par |  |
| 111 | `talents` | The servants and the talents | 💰 | Matthew 25:14–30 | talents | 3 | 8+ | Par |  |
| 112 | `pearl` | The pearl of great price | 🦪 | Matthew 13:45–46 | pearl | 3 | 8+ | Par |  |
| 113 | `pharisee-tax-collector` | The Pharisee and the tax collector | 🙏 | Luke 18:9–14 | tax collector | 3 | 12+ | Par |  |
| 114 | `pentecost` | Tongues of fire at Pentecost | 🔥 | Acts 2:1–4 | fire | 2 | 8+ | Church |  |
| 115 | `lame-man-leaps` | The lame man leaps up | 🦵 | Acts 3:1–10 | leaping | 2 | 8+ | Church, Mir |  |
| 116 | `saul-blinded` | Saul blinded on the road | 💡 | Acts 9:1–9 | light | 2 | 8+ | Church |  |
| 117 | `basket-over-wall` | Saul escapes in a basket | 🧺 | Acts 9:23–25 | basket | 2 | 8+ | Church |  |
| 118 | `tabitha` | Tabitha, get up! | 🧵 | Acts 9:36–41 | Tabitha | 3 | 8+ | Church, Mir |  |
| 119 | `peters-sheet` | Peter's vision of the sheet | 🐾 | Acts 10:9–16 | sheet | 3 | 12+ | Church |  |
| 120 | `peter-freed` | An angel frees Peter from prison | ⛓️ | Acts 12:6–11 | chains | 2 | 8+ | Church, Mir | peter-prison |
| 121 | `rhoda-door` | Rhoda leaves Peter at the gate | 🚪 | Acts 12:12–16 | Rhoda | 3 | 8+ | Church | peter-prison |
| 122 | `prison-earthquake` | Paul and Silas sing in prison | 🎶 | Acts 16:25–26 | singing | 2 | 8+ | Church, Mir |  |
| 123 | `eutychus` | Eutychus falls asleep in the window | 🪟 | Acts 20:9–12 | window | 3 | 8+ | Church, Mir |  |
| 124 | `philip-chariot` | Philip and the Ethiopian's chariot | 📜 | Acts 8:26–39 | chariot | 3 | 8+ | Church |  |
| 125 | `shipwreck` | Paul's shipwreck | 🚢 | Acts 27:39–44 | aground | 2 | 8+ | Church |  |
| 126 | `snake-in-fire` | Paul shakes off a snake | 🐍 | Acts 28:3–6 | viper | 2 | 8+ | Church, Mir |  |
| 127 | `rich-fool` | The rich fool builds bigger barns | 🌾 | Luke 12:16–21 | barns | 3 | 8+ | Par |  |
| 128 | `unforgiving-servant` | The servant who would not forgive | 💸 | Matthew 18:23–35 | debt | 3 | 8+ | Par |  |
| 129 | `banquet-excuses` | The banquet guests make excuses | 🍽️ | Luke 14:16–24 | banquet | 3 | 8+ | Par |  |
