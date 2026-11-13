# What came first? — design

**Feature:** the game Who's older? ([/games/whos-older](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/)) becomes **What came first?** at `/games/what-came-first`, with eight categories of "firsts" plus Mixed, approved by the owner on 2026-11-12.
**Brief:** [BRIEF.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/BRIEF.md). It wins over this document wherever they disagree.
**Shape and rules inherited from:** [Who's older? design](Jarvis/Projects/BibleProject/Website/docs/features/whos-older/design.md) (its sections 3–5 are the "certain pairs only" model), [its redesign](Jarvis/Projects/BibleProject/Website/docs/visual-audits/whos-older-redesign.md), [design/README.md](Jarvis/Projects/BibleProject/Website/design/README.md), [games README](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md), [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md), the site's [AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md).
**Written:** 2026-11-12, sequence 48 step 1 (research and design). Step 2 reviews this document once and appends a "Review" section; step 3 curates and checks the data; step 4 builds the game. No code was written in this step.

---

## 0. Summary

- **One game, nine choices.** The start screen shows eight category pills and Mixed, all visible at once. Seven categories are the familiar face-off: two cards, tap the one that came first. The eighth, **Bible Firsts**, asks one question ("Who was the first king of Israel?") with three or four answer cards in the same look.
- **The promise does not change.** A pair is only ever asked when its order is certain. Each item has a deliberately wide window of years (or a place in a sequence Scripture gives), and two items are paired only when their windows do not overlap, or a verse states the order, and the pair is not on that category's blocked list. Every category keeps its own blocked list for orders that are honestly disputed. A smaller category is accepted rather than weakening this.
- **The engine generalises with one item shape and one ordering function.** Who's older?'s `orderOf` becomes a function over a general **item** (id, label, category, a window of years or a position in a sequence, verses), steered by a small per-category rule set (§5). Who lived first keeps its data and its pairs exactly: a test proves the new function gives the same answer as the old one for every pair in the old pool.
- **Where the data comes from.** Who lived first reuses the existing pool unchanged. What happened first reuses the Timeline sort game's 248 events, its 1,453 order facts and its 47 contested pairs. Who ruled first is built from the site's own ruler pages, which already carry reign dates in several dating systems. Which comes first in your Bible needs no data file: it is generated from the 66-book order the site's catalogue already uses. The remaining four (built, journeys, deaths, Bible Firsts) are new hand-kept files, each checked by the build script.
- **Players keep what they had.** Existing Who's older? best scores and any saved run become Who lived first's, read from the old storage key the first time the new game opens. `/games/whos-older` forwards to `/games/what-came-first` with Who lived first chosen.
- **No running cost.** No model calls, no new services. Everything is generated once ahead of time and shipped as static files, loaded only when a category is played.

---

## 1. What the brief fixes, and what this design decides

| The brief fixes | This design decides |
|---|---|
| Eight categories plus Mixed, as pills, all visible | Short pill names and full question headings (§9.1); pill order; per-category accent (§9.5) |
| Same "certain pairs only" model in every category | One item shape and one `orderOf` with per-category rules (§5); what "first" means in each category (§3); each category's checks and blocked list (§4) |
| Who ruled first: begins-to-reign order | How co-regencies and the divided kingdom's conflicting synchronisms are handled (§4.3) |
| Where did they go first: one traveller's stops | Journeys as groups, first arrival only, journey origins left out (§4.5) |
| Who died first: only Scripture-settled orders | Only people whose death Scripture records; how their death windows are set (§4.6) |
| Bible Firsts: three or four answers, firsts Scripture states or plainly shows | The question file, distractor rules, what is left out and why (§4.8) |
| Mixed; bests per category and mode; old bests kept | How Mixed deals (§6.4), the new storage shape and the migration (§7) |
| New address, forward from the old one | The route that forwards, and why it lives in the router rather than the games hub (§8.2) |
| App tile in the same job | What changes in the app and how `npm run check:site` is kept passing (§8.4) |

---

## 2. Research: what the current code and data really are

Read in this step, from the live working tree.

### 2.1 The current game

| File | What it does today | What it means for the new game |
|---|---|---|
| [pairing.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/pairing.ts) | `Person` (id, label, tier, `lo`/`hi` birth window, `shown`, `english`), `Fact`, `orderOf` (label clash → blocked → fact → strict window test → null), `bandOf`, `allPairs`, `yearsBetween`, `labelsClash`, `withEnglishLabels`. No imports, so Node can load it | **Other games import it**: the Timeline game's [order.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/timeline/order.ts) (`yearsBetween`), [scripts/timeline/anchors.ts](Jarvis/Projects/BibleProject/Website/scripts/timeline/anchors.ts) (`checkYear`), [build-timeline.ts](Jarvis/Projects/BibleProject/Website/scripts/build-timeline.ts), [translated-data.test.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/translated-data.test.ts). It must stay at this path with these exports |
| [explain.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/explain.ts) | Gap rounding, `formatYear`, `yearSpan`, `verseLabel`, `verseHref`, the reason sentence | The Timeline game's [text.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/timeline/text.ts) imports five of these. It stays at this path with these signatures |
| [game.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/game.ts) | `Pool` (pairs by band, partners by person), `Run` `{stamp, mode, difficulty, seed, rounds[{left,right,pick}], hearts, over}`, the seeded dealer, "one stays", the giveaway rule (`alwaysFirst`), the Streak ramp | Generalises (§6). Nothing outside the game imports it |
| [storage.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/storage.ts) | Key `bp-whos-older`: `{version: 1, best: {streak, relaxed}, run?}`. A run whose stamp differs from the data is dropped; bests stay | Read once for the migration (§7.2) |
| [WhosOlderGame.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/WhosOlderGame.tsx), Round, Reveal, Screens, Timeline, Hourglass, view.ts, share.ts, whos-older.css | The approved redesign: tall cards with medallions, the hourglass, the scoreboard, the kit's feedback band pinned on phones, the result card | Become the new game's screens (§9), keeping the look |
| [build-whos-older.ts](Jarvis/Projects/BibleProject/Website/scripts/build-whos-older.ts) and [scripts/whos-older/](Jarvis/Projects/BibleProject/Website/scripts/whos-older/) | Builds [whos-older.json](Jarvis/Projects/BibleProject/Website/src/data/whos-older/whos-older.json) from three source files and the site's data; its `site-data.ts` (people, slugs, books, Berean text, ruler pages) | **Other builds import `site-data.ts`** (Timeline's). It stays; the new build reuses it |
| [src/data/whos-older/](Jarvis/Projects/BibleProject/Website/src/data/whos-older/) | 160 people, 38 hand facts plus 86 from family links, 9 blocked pairs; 10,789 askable pairs | **Other builds read `characters.source.json`**: [build-two-truths.ts](Jarvis/Projects/BibleProject/Website/scripts/build-two-truths.ts), [tq_pool.py](Jarvis/Projects/BibleProject/Website/scripts/twenty-questions/tq_pool.py), [anchors.ts](Jarvis/Projects/BibleProject/Website/scripts/timeline/anchors.ts). The folder stays where it is, unchanged |

### 2.2 Data the other categories can use

| Source | What it holds | Use |
|---|---|---|
| [timeline.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/timeline.json), built by [build-timeline.ts](Jarvis/Projects/BibleProject/Website/scripts/build-timeline.ts) from three source files | 248 events, each with `lo`/`hi` years, `shown`, era, tier, `dating` line, verse spans, linked people; 1,453 order facts with verse and reason (`close` marks a generation or less apart); 47 contested pairs. Its `explain()` accepts two-step chains through a third event | What happened first (§4.2). Counted in this step: **28,067 of the 30,628 possible pairs are certain by one direct link** (1,453 by a fact, 26,614 by windows), before this game's own extra blocks |
| [people-pages rulers-*.json](Jarvis/Projects/BibleProject/Website/src/data/people-pages/) (10 files) | 111 rulers: judges, the united kingdom, Israel (19), Judah (20), Egypt (9), Assyria and Babylon (9), Persia (10, including governors and queens), the Herods (6), Rome (11), neighbours (9). Each has `order`, `predecessor`, `successor`, `synchronisms` with verse spans, and `dates`: one entry per dating system (Thiele as revised by McFall, Albright, Ussher, Galil or Young stored as `other`, and a Scripture entry with no years) | Who ruled first (§4.3). **Note:** these files store BC years as positive and AD years as negative (Augustus `27` to `-14`), the reverse of the games' historians' numbering. The build converts them |
| [src/data/who-ruled/](Jarvis/Projects/BibleProject/Website/src/data/who-ruled/) (one file per book) | Which rulers are named in each chapter, with the span of their account | Cross-check only: every ruler in the category must have an account span, used as a fallback verse |
| [places.json](Jarvis/Projects/BibleProject/Website/src/data/map-quest/places.json) | Map quest's 387 places, with id, name, coordinates, tier | Journeys (§4.5): a stop links to its Map quest place when one matches, for the place name and a future map strip. Present: almost all of Paul's stops, Rameses, Succoth, Elim, Hazeroth, Ezion-geber, Shechem, Bethel, Hebron, Haran and others. **Hazard:** one "Antioch" only, while Paul's journeys need Antioch of Syria and Pisidian Antioch apart |
| `data/catalog.json` (read by `loadBooks` in [site-data.ts](Jarvis/Projects/BibleProject/Website/scripts/whos-older/site-data.ts)) and the site's verse ids (`book × 1,000,000 + chapter × 1,000 + verse`, Genesis = 1 … Revelation = 66) | The 66-book Protestant order, already the site's numbering | Which comes first in your Bible (§4.7), generated |
| The question bank, [content/questions/](Jarvis/Projects/BibleProject/Website/content/questions/) | About 5,000 questions | Read-only. Step 3 may search it for Bible Firsts candidates; it never changes it |

### 2.3 How the website and the app are wired

| Piece | Today | For this feature |
|---|---|---|
| Routes | [GamesPage.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/GamesPage.tsx) makes one route per live registry slug and sends any other `/games/...` address to the hub | An old address would land on the hub, so the forward needs its own route (§8.2) |
| Registry | [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) entry `whos-older`, shelf `family`, `art: GAME_ART.whosOlder` | The entry moves to the new slug (§8.3) |
| Hub art | [art/index.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/art/index.ts) `whosOlder: {Scene: WhosOlderScene, tone: "epistles", alt: …}` | Key renamed; drawing kept (§8.3) |
| Translation | [extract.py](Jarvis/Projects/BibleProject/Website/content/translation/extract.py) `GAME_DATA` registers `whos-older.json`'s label, tag, when, brief and fact reasons; [language-packs.ts](Jarvis/Projects/BibleProject/Website/src/lib/language-packs.ts) `PACKED_ELSEWHERE` lists `whos-older/`; [unregistered-reviewed.json](Jarvis/Projects/BibleProject/Website/content/translation/unregistered-reviewed.json) explains why the source files are not translated. The Timeline game loads its file in English only (not registered) | New data files are registered the same way (§8.5) |
| App tile | [games-hub.json](Jarvis/Projects/BibleProject/App/src/data/site/games-hub.json) is **generated** from the site's registry and art index by [site_games_hub.py](Jarvis/Projects/BibleProject/App/scripts/site_games_hub.py) (which refuses uncommitted site edits and requires `path == /games/<slug>`); [art.ts](Jarvis/Projects/BibleProject/App/src/components/games-hub/art.ts) maps slug `whos-older` to the captured drawings `games-whos-older.ts` and `games-whos-older-phone.ts`; [site_parity.py](Jarvis/Projects/BibleProject/App/scripts/site_parity.py) fingerprints `registry.ts`; the app's `language-packs.ts` is a mirrored copy | §8.4 |

---

## 3. Definitions: what "first" means in each category

| # | Pill | Heading on the round | Under the heading | "First" means exactly |
|---|---|---|---|---|
| 1 | People | **Who lived first?** | The one who came into the world first. | Born first (Adam and Eve: formed first). Unchanged from Who's older? |
| 2 | Events | **What happened first?** | The one that happened earlier in the Bible's story. | The event's moment came first. Each event is one moment (Timeline sort's definition); an event with a span is dated by its start, as Timeline does |
| 3 | Rulers | **Who ruled first?** | The one who began to reign, judge or govern first. | **Began to rule first**: the first year counted as theirs, whether as co-regent or alone (§4.3). Not who reigned longer, not who ended first |
| 4 | Buildings | **What was built first?** | The one that was finished or made first. | **Completed (or made) first**. For long works the finish decides: Solomon's Temple (finished in his 11th year, 1 Kings 6:38) came before his palace (finished at the end of twenty years, 1 Kings 9:10). An item whose start and finish both matter is dated by its finish window |
| 5 | Journeys | **Where did *Paul* go first?** (the traveller's name in its own element) | *Second journey* (Acts 15:36–18:22): which place did he reach first? | **First arrival** of that traveller at that place within that journey. Later visits do not count, and the journey's starting place is never a card (§4.5) |
| 6 | Deaths | **Who died first?** | The one whose death came first. | Died first, as Scripture records it. People who did not die (Enoch, Elijah), who died and were raised (Lazarus, Dorcas, Eutychus), or whose death Scripture does not record, are never cards (§4.6) |
| 7 | Books | **Which comes first in your Bible?** | In the order of the 66 books. | Earlier in the 66-book Protestant order (Genesis 1 … Revelation 66). Not which was written first, which the brief rules out |
| 8 | Bible firsts | the question itself, e.g. **Who was the first king of Israel?** | Pick the one answer. | The first **as Scripture states it or plainly shows it**, with the verse in the reveal. A first that rests on tradition or inference is left out (§4.8) |
| — | Mixed | changes every round to that round's category heading | as the category | Rounds dealt from every category (§6.4) |

**The Bible's timeline, not a verdict on history** (Who's older? §3.2) holds in every category: the game asks for order as the Bible tells it, shows absolute years only as "about" and only where the site's own pages already give them, and explains a wide range in words.

**Never asked, by the owner's decision (2026-11-12):** what God made on which day of Creation, the order of the plagues, which book was written first, and which of Jesus's miracles came first. §4.2 shows how the events category enforces the first, second and fourth of these on data that would otherwise allow them.

**Never a card in any category:** Jesus (as in Who's older? §3.3: a "who came first" question about Him collides with John 8:58), God, angels, Satan, Melchizedek in the people categories. Jesus may appear inside an event's wording ("Jesus calms a storm") because the events category asks about the moment, not His existence; that is how the Timeline game already words them.

---

## 4. Data, category by category

### 4.0 The common model

Every category's generated file has the same outer shape, so one loader, one translation rule and one stamp check serve all of them:

```jsonc
{
  "about": "Generated by scripts/build-what-came-first.ts …; do not edit.",
  "stamp": "3f9a…",                 // hash of this file's inputs; a saved run made from another stamp is dropped (§7)
  "category": "ruled",
  "books": { "11": ["1KI", "1 Kings"] },     // reader codes and names for verse links, as whos-older.json has
  "items": [ /* §5.1 */ ],
  "facts": [ { "first": "…", "second": "…", "kind": "succession", "refs": [[11011043, 11011043]], "why": "…" } ],
  "blocked": [ ["pekahiah-2ki-15-22", "pekah-2ki-15-25"] ]   // ids only; reasons stay in the source file and the review sheet
}
```

Hand-kept source files sit beside the generated ones in a new folder, [src/data/what-came-first/](Jarvis/Projects/BibleProject/Website/src/data/what-came-first/). Every source file has three parts, as Who's older?'s do: the **items**, the **order facts** (each with a verse and a one-line `why`), and the **blocked pairs** (each with a written `reason`). The rule from Who's older? §4.3 carries over to every category: **facts are not chained**. If A is before B and B before C, A and C are asked only if their own windows or a direct fact settle it, so every reveal is one sentence and one verse. (The Timeline game's two-step explanations are deliberately not used here; §4.2 shows the direct links alone give over 28,000 pairs.)

Windows follow Who's older? §4.2.1: the smallest and largest year over **every** dating system the site recognises, widened when in doubt; historians' numbering (negative = BC, no year 0, checked); an open edge (`null`) proves nothing; `shown: false` for early-Genesis items whose bounds only keep the text's order and are never printed as years.

### 4.1 Who lived first? (category 1)

- **Data:** [src/data/whos-older/](Jarvis/Projects/BibleProject/Website/src/data/whos-older/) exactly as it is, built by the existing [build-whos-older.ts](Jarvis/Projects/BibleProject/Website/scripts/build-whos-older.ts), loaded as now through `inSiteLanguage("whos-older/whos-older.json", …)`. No file in that folder changes, so the translations already made keep matching by stamp, and the three other builds that read `characters.source.json` are untouched.
- **Checks, blocked pairs, count:** unchanged (Who's older? §4.5, §4.6): 160 people, 10,789 pairs, 9 blocked pairs.
- **Adapter:** `categories/lived.ts` turns each `Character` into an item (§5.1): `lo`/`hi` are the birth window; `tag`, `when`, `brief`, `href` as now.

### 4.2 What happened first? (category 2)

- **"First":** the event's moment came first (§3).
- **Data source:** the Timeline sort game's [timeline.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/timeline.json): events, facts and contested pairs. The Timeline game and its files are **not changed**.
- **Generated file:** `src/data/what-came-first/events.json`, written by the new build from `timeline.json` plus one small hand-kept file, `events.source.json`, holding only this game's extra exclusions and blocks. A copy is needed, rather than loading `timeline.json` directly, because the Timeline game loads its file in English only, while this game must load through `inSiteLanguage` and register its texts (§8.5). The copy keeps only what this game reads: per event `id, label, tier, lo, hi, shown, dating, refs, people`; the facts; the contested pairs plus this game's blocks. Expected size about 350–450 KB raw, loaded only when Events or Mixed is played. Step 4 measures it; if it is over 500 KB, the build drops facts whose pair is also settled by windows at least 100 years apart (the windows then explain it) and reports how many.
- **Hand-kept file shape** (`events.source.json`):

```jsonc
{
  "excluded": [ { "id": "…", "reason": "…" } ],                      // never dealt in this game
  "blockedGroups": [                                                  // every event in a against every event in b
    { "a": ["creation", "adam-formed", "eve-made"], "b": ["creation", "adam-formed", "eve-made"],
      "reason": "The order of what God made in the Creation week is left out of this game (owner, 2026-11-12)." },
    { "a": ["water-into-wine", "officials-son", "calms-storm", "feeding-5000", "walking-on-water", "lazarus-raised"],
      "b": ["water-into-wine", "officials-son", "calms-storm", "feeding-5000", "walking-on-water", "lazarus-raised"],
      "reason": "Which of Jesus's miracles came first is left out (owner, 2026-11-12); his first sign is a Bible First instead." }
  ]
}
```

- **What is blocked and why:**
  - **Timeline's 47 contested pairs**, carried over: for example Enoch taken against Noah's birth (the Hebrew and Samaritan texts of Genesis 5 disagree), Ezra's arrival against Nehemiah's (Ezra's "Artaxerxes" may be the first or the second), the war with Benjamin against each judge's story.
  - **The Creation week:** God creating the heavens and the earth, Adam formed and Eve made, against each other. These three still meet later events (the Flood, Babel), because that is not a question about the days of Creation. Adam before Eve stays in category 1, where it already is.
  - **Jesus's miracles against each other** (the six miracle events in the list today). A miracle against a non-miracle event (Jesus's baptism, the Last Supper) stays, because that is not "which miracle came first". Step 3 re-reads the event list and adds any other miracle of Jesus to the group; the build fails if an event whose label has Jesus healing, feeding, raising, calming or walking on water is outside the group.
  - **The plagues:** the only plague event today is the Passover night, with no other plague to pair it with. The build fails if an event naming a plague is added later without a blocked group.
- **Checks the build runs:** every id in `events.source.json` exists in `timeline.json`; each blocked group would otherwise produce at least one pair (else a notice that it is dead weight); the miracle and plague guards; at least 8 partners per event after blocking (an event below 8 is dropped with a notice); at least 300 pairs per difficulty band; facts and windows never contradict (Timeline's build already checks this; repeated here because this build reads the generated file).
- **Realistic count:** about 245 events and about **28,000 pairs**; the new blocks remove about 18 (three Creation pairs, fifteen miracle pairs).
- **Bands:** Easy = windows, both tier 1, at least 400 years apart; Medium = both tier 1–2 and at least 100 years apart, or a fact between two tier-1 events not marked `close`; Hard = everything else (every `close` fact, every tier-3 event).

### 4.3 Who ruled first? (category 3)

- **"First":** began to rule first: the first year counted as the ruler's, as co-regent or alone. Judges count from when they began to judge, governors from when they took office.
- **Data source:** the site's ruler pages ([rulers-*.json](Jarvis/Projects/BibleProject/Website/src/data/people-pages/)), read through [site-data.ts](Jarvis/Projects/BibleProject/Website/scripts/whos-older/site-data.ts) `loadPeoplePages`. The hand-kept file `rulers.source.json` names which rulers are in the pool, their card label and tag, tier, any extra order facts, and the blocked pairs. **The windows are computed by the build from the pages, never typed by hand**, so they cannot drift from what the ruler pages say.
- **How a ruler's window is set (the build's rule):**
  1. Take every system's `from` year on the ruler's page (Thiele–McFall, Albright, Ussher, Galil or Young). These include co-regency starts where a system dates one (Thiele's Jehoram of Judah from 854 BC while his father Jehoshaphat still reigned).
  2. Also take, in each system, the **predecessor's last year** on the same throne, because that is where a sole reign begins when another system counts a co-regency.
  3. The window is the smallest and largest of all of these. A ruler whose page has no years (the judges, the unnamed pharaohs) has **no window** and can only be paired through order facts.
  4. Convert to historians' numbering (the pages store BC positive and AD negative).
- **Hand-kept file shape** (`rulers.source.json`):

```jsonc
{
  "rulers": [ { "id": "ahaziah-2ki-8-24", "label": "Ahaziah of Judah", "tag": "King of Judah", "tier": 3,
                "artaxerxesSystems": null } ],                     // optional per-ruler system filter, see Artaxerxes below
  "facts":  [ { "first": "ehud-jdg-3-15", "second": "shamgar-jdg-3-31", "kind": "stated",
                "refs": [[7003031, 7003031]], "why": "After Ehud came Shamgar." } ],
  "blocked": [ { "a": "ahab-1ki-16-28", "b": "jehoshaphat-1ki-15-24", "reason": "…" } ]
}
```

- **Order facts (kinds):**
  - `succession`: predecessor and successor on one throne, derived by the build from the pages' `predecessor`/`successor` fields, with the account verse ("Rehoboam his son reigned in his place", 1 Kings 11:43). Listed on the review sheet for the owner to strike.
  - `synchronism`: a verse dating one ruler's accession by another's reign year, from the pages' `synchronisms` ("In the second year of Joash … Amaziah … became king", 2 Kings 14:1). Only where that year is 2 or more, so the other was already reigning.
  - `stated`: a verse that states the order and is not a succession on one throne ("After Ehud came Shamgar", Judges 3:31; "After Abimelech … Tola", Judges 10:1; a new king "who did not know Joseph", Exodus 1:8; Darius the Mede "received the kingdom" when Belshazzar was slain, Daniel 5:30–31).
- **Co-regencies and the divided kingdom (the hard rule):** a `succession` or `synchronism` fact is used **only if every system that dates both rulers puts the first ruler's start strictly before the second's**. If any system disagrees, or puts them in the same year, the build **fails** and names the pair until it is added to the blocked list with its reason. Pairs across the two kingdoms with no fact are decided only by windows, and windows spanning every system automatically overlap wherever the systems disagree. So:
  - **Ahab and Jehoshaphat** are never asked. 1 Kings 22:41 puts Jehoshaphat's accession in Ahab's fourth year, and Thiele–McFall and Ussher agree, but Albright dates Jehoshaphat (873 BC) before Ahab (869 BC). Blocked.
  - **Pekah against Menahem and Pekahiah** is never asked. 2 Kings 15:27 places Pekah after Pekahiah, but Thiele–McFall counts Pekah's twenty years from a rival reign beginning in 752 BC, the year Menahem began. The succession fact Pekahiah → Pekah fails the rule; blocked.
  - **Jehoram of Judah and Joram of Israel** are never asked: 2 Kings 1:17 and 8:16 give synchronisms in opposite directions (the co-regency of Jehoshaphat and Jehoram), and their windows overlap.
  - **Joash of Israel and Amaziah of Judah** *are* asked: 2 Kings 14:1 states it, and every system puts Joash first (798, 801 and 841 BC against 796, 800 and 839 BC), though their windows overlap.
  - Same-year starts (Rehoboam and Jeroboam I; Archelaus, Herod Antipas and Philip the tetrarch, all 4 BC) have touching windows and no fact, so they are never asked.
- **Other blocked pairs and cautions (seed list for step 3):**

| Pair | Reason |
|---|---|
| Darius the Mede and Cyrus | Daniel 6:28 names "the reign of Darius and the reign of Cyrus the Persian", but who Darius the Mede was is disputed (some identify him with Cyrus himself, others with the governor Gubaru), so their order over Babylon cannot be settled in one line |
| Samson against Jephthah, Ibzan, Elon, Abdon and Eli | Judges 10:7 has the Philistine and Ammonite oppressions begin together, and many chronologies overlap Samson with Jephthah's successors and with Eli. Samson pairs only with judges before Jephthah and with the kings |
| Shamgar against Deborah | Judges 3:31 says "After Ehud came Shamgar", but Judges 5:6 places Shamgar's days alongside Jael's, so his order against Deborah is unclear |
| Artaxerxes (caution, not a block) | His page carries a second system (404 BC, Artaxerxes II) because of the Ezra 7:7 dispute. The card is Nehemiah's Artaxerxes (Nehemiah 2:1, Artaxerxes I, 465/464 BC). The source file filters his window to the Artaxerxes I systems and the review sheet says why; any pair that would flip under Artaxerxes II is blocked |
| Nebuchadnezzar and Belshazzar (caution) | Daniel 5:2 calls Nebuchadnezzar Belshazzar's "father", which many read as "predecessor". The windows settle the order (605 against about 553 BC); no "parent" fact may be added for it, as Who's older? also decided |
| Tiberius (caution) | Luke 3:1's "fifteenth year of Tiberius" is counted from AD 14 or from a co-regency from AD 11/12; the window spans both |

- **The pool (candidates for step 3; every name has a ruler page on the site):**
  - **Leaders and judges (no years; facts only):** Moses, Joshua, Othniel, Ehud, Deborah, Gideon, Abimelech, Tola, Jair, Jephthah, Ibzan, Elon, Abdon, Samson, Eli, Samuel; Shamgar only if step 3 finds him a page or a people id. Among themselves they pair only by the "after him" verses (Judges 3:31; 4:1; 8:33–9:1; 10:1, 3; 12:8, 11, 13; 1 Samuel 4:18 with 7:15). Against every king, foreign ruler and NT ruler they pair through one `stated` fact each: all of them began before Saul (1 Samuel 8:1–5; 10:1). Moses before Joshua (Deuteronomy 34:9; Joshua 1:1–2); Joshua before Othniel (Judges 1:1 with 3:9). These facts are stored once per judge against Saul and expanded by the build to every later ruler, and that expansion is listed on the review sheet: it is the one place a fact reaches more than its own pair, and it is safe only because every later ruler began after Saul (checked against every system's window).
  - **United kingdom:** Saul, Ish-bosheth, David, Solomon.
  - **Israel (19):** Jeroboam I, Nadab, Baasha, Elah, Zimri, Omri, Ahab, Ahaziah, Joram, Jehu, Jehoahaz, Jehoash, Jeroboam II, Zechariah, Shallum, Menahem, Pekahiah, Pekah, Hoshea.
  - **Judah (20):** Rehoboam, Abijah, Asa, Jehoshaphat, Jehoram, Ahaziah, Athaliah, Joash, Amaziah, Uzziah, Jotham, Ahaz, Hezekiah, Manasseh, Amon, Josiah, Jehoahaz, Jehoiakim, Jehoiachin, Zedekiah.
  - **Egypt:** the pharaoh of Joseph's day, the pharaoh of the oppression, the pharaoh of the Exodus (no years; facts Exodus 1:8 and 2:23), Solomon's father-in-law, Shishak, So, Tirhakah, Necho, Hophra.
  - **Assyria and Babylon:** Tiglath-pileser, Shalmaneser, Sargon, Sennacherib, Esarhaddon, Merodach-baladan, Nebuchadnezzar, Evil-merodach, Belshazzar.
  - **Persia:** Cyrus, Darius the Mede, Darius the Persian, Ahasuerus (Xerxes), Artaxerxes; governors Zerubbabel, Nehemiah and Gedaliah. Vashti and Esther are queens consort, not rulers, and are left out.
  - **Neighbours:** Hiram of Tyre, Hazael, Rezin. Mesha only if step 3 finds a window or fact. The three Ben-hadads are left out (no years, one name).
  - **Herods:** Herod the Great, Archelaus, Herod Antipas, Philip the tetrarch, Herod Agrippa I, Agrippa II.
  - **Rome:** Augustus, Quirinius (wide window: AD 6 or the debated earlier term), Tiberius, Pontius Pilate, Claudius, Sergius Paulus, Gallio, Felix, Nero, Porcius Festus. Lysanias and Candace have no years and are left out.
- **Labels:** repeated names are qualified on both sides so Who's older?'s clash rule (§5.3 there) passes: "Ahaziah of Israel" and "Ahaziah of Judah", "Jehoahaz of Israel" and "Jehoahaz of Judah", "Jehoash of Israel" and "Joash of Judah", "Joram of Israel" and "Jehoram of Judah", "Jeroboam I" and "Jeroboam II", "Darius the Mede" and "Darius the Persian", the Herods by their full names, "Pharaoh (Joseph's day)", "Pharaoh (the oppression)", "Pharaoh (the Exodus)", "Pharaoh (Solomon's father-in-law)". The king Zechariah is "Zechariah, king of Israel", so he can never be read as the prophet.
- **Checks the build runs:** every id has a ruler page (or, for a governor without one, a people id and an anchor verse); the window rule above; the succession and synchronism rule (fatal); the judges' expansion check; facts never contradict and contain no loop; every fact verse has Berean words; the clash rule; at least 8 partners per ruler (else dropped with a notice); at least 200 pairs per band (this category is smaller than people).
- **Realistic count:** about **105 rulers**. Most kings of Israel and Judah meet most foreign and NT rulers by windows, so roughly **4,000–4,500 pairs**; the judges add a few hundred through their facts.
- **Bands:** Easy = windows, both tier 1, at least 300 years apart (David and Nebuchadnezzar); Medium = windows at least 50 years apart with both tier 1–2, or a succession between two tier-1 rulers (David and Solomon); Hard = everything else (synchronisms, close successions, judges among themselves, tier 3).

### 4.4 What was built first? (category 4)

- **"First":** finished or made first (§3). An item that took years is dated by its finish window; a thing made in a moment (the golden calf, the bronze serpent) by that moment.
- **Data source:** new hand-kept file `built.source.json`. Windows are set the Who's older? way (§4.2.1 there) from an **anchor**: most items hang on a Timeline event or a ruler whose window already exists, and the build computes their window from it, so the same date is never typed twice. An item without an anchor gets a hand window with its reasoning in `when`.
- **Hand-kept file shape:**

```jsonc
{
  "items": [
    { "id": "solomon-temple", "label": "Solomon's Temple", "tag": "Jerusalem", "tier": 1,
      "anchor": { "kind": "reign-year", "ruler": "solomon-2sa-5-14", "year": [11, 11] },   // finished in his 11th year
      "refs": [[11006038, 11006038]], "when": "Finished in Solomon's eleventh year (1 Kings 6:38), about 960 BC on the site's dates." },
    { "id": "noahs-ark", "label": "Noah's ark", "tag": "Built by Noah", "tier": 1,
      "anchor": { "kind": "event", "event": "ark-commanded" }, "shown": false, "refs": [[1006014, 1006022]], "when": "…" }
  ],
  "facts":   [ { "first": "golden-calf", "second": "tabernacle", "kind": "stated", "refs": [[2040017, 2040017]], "why": "…" } ],
  "blocked": [ { "a": "…", "b": "…", "reason": "…" } ]
}
```

  Anchor kinds, reused from the Timeline build's [anchors.ts](Jarvis/Projects/BibleProject/Website/scripts/timeline/anchors.ts) where they fit: `event` (a Timeline event's window), `reign-year` (a ruler's accession window plus a year range), `person-age` (a Who's older? birth window plus an age), or `hand` (a window typed with reasoning).
- **Candidates (step 3 completes and checks each verse):**

| Item | Deciding verse | Anchor or order |
|---|---|---|
| The city Cain built (Enoch) | Genesis 4:17 | Early Genesis, `shown: false`; before the ark (fact: Cain's line, before the Flood) |
| Noah's ark | Genesis 6:14–22 | Event `ark-commanded`; `shown: false` |
| Noah's altar after the Flood | Genesis 8:20 | After the ark (Genesis 8:18–20) |
| The tower of Babel | Genesis 11:4–9 | Event `babel`; after the ark (fact Genesis 10:32–11:2: "after the flood") |
| Abram's altar at Shechem | Genesis 12:7 | Event for Abram's call; before his altar at Bethel (12:8) and at Hebron (13:18) |
| Abraham's altar on Moriah | Genesis 22:9 | After Hebron's altar (narrative years: Isaac's birth, 21:5) |
| Jacob's pillar at Bethel | Genesis 28:18 | Jacob's flight; before his altar at Shechem (33:20) and his altar at Bethel (35:7) |
| Pithom and Rameses, the store cities | Exodus 1:11 | Before the Exodus; hand window over the early and late Exodus dates |
| The golden calf | Exodus 32:4 | Before the Tabernacle (Exodus 40:17, set up in the second year) and the ark of the covenant (made in Exodus 37:1, after the calf) |
| The ark of the covenant | Exodus 37:1–9 | Before the Tabernacle was set up (Exodus 40:20–21 puts the ark in it) |
| The Tabernacle | Exodus 40:17 | First day of the first month of the second year |
| The bronze serpent | Numbers 21:8–9 | Fortieth year (after Aaron's death, Numbers 20:28–21:4) |
| The memorial stones at Gilgal | Joshua 4:20 | After the Jordan crossing |
| Joshua's altar on Mount Ebal | Joshua 8:30 | After Ai |
| The altar by the Jordan ("Witness") | Joshua 22:10, 34 | End of the conquest |
| Gideon's altar "The LORD Is Peace" | Judges 6:24 | Gideon's call; before his ephod (8:27) |
| Micah's idol | Judges 17:4 | **Blocked against every judge's item**: Judges 17–21 is not tied to any judge (the same reason Timeline blocks the war with Benjamin) |
| Samuel's stone "Ebenezer" | 1 Samuel 7:12 | Samuel's judgeship, before Saul |
| Saul's first altar | 1 Samuel 14:35 ("the first altar he built to the LORD") | Saul's reign |
| David's palace | 2 Samuel 5:11 | David's reign; Hiram's craftsmen |
| David's altar on Araunah's threshing floor | 2 Samuel 24:25 | Late in David's reign; before Solomon's Temple on the same site (2 Chronicles 3:1) |
| Solomon's Temple | 1 Kings 6:1, 6:38 | Reign-year 4–11 of Solomon; finished first |
| Solomon's palace | 1 Kings 7:1; 9:10 | Finished at twenty years; after the Temple (fact 1 Kings 9:10) |
| Jeroboam's golden calves at Bethel and Dan | 1 Kings 12:28–29 | Jeroboam I's accession |
| Samaria, built by Omri | 1 Kings 16:24 | Omri's reign |
| Ahab's temple of Baal in Samaria | 1 Kings 16:32 | Ahab's reign |
| Ahab's ivory house | 1 Kings 22:39 | Ahab's reign. **Blocked against his temple of Baal**: no verse orders them |
| Jericho rebuilt by Hiel | 1 Kings 16:34 | Ahab's days |
| Elijah's altar on Mount Carmel | 1 Kings 18:31–32 | Ahab's reign. **Blocked against the other Ahab-reign items** |
| Ahaz's altar copied from Damascus | 2 Kings 16:10–11 | Ahaz's reign, after Tiglath-pileser took Damascus |
| Hezekiah's tunnel | 2 Kings 20:20; 2 Chronicles 32:30 | Hezekiah's reign |
| Nebuchadnezzar's golden image | Daniel 3:1 | Nebuchadnezzar's reign |
| The altar rebuilt by the returned exiles | Ezra 3:2–3 | Seventh month after the return (Cyrus) |
| The second Temple | Ezra 6:15 | Finished in the sixth year of Darius, about 515 BC |
| Nehemiah's wall | Nehemiah 6:15 | Finished in 52 days, Artaxerxes I's twentieth year (445/444 BC) |
| Herod's Temple | John 2:20 ("forty-six years") | Herod the Great's rebuilding, begun about 20/19 BC and still under way in Jesus's ministry (John 2:20). By the "finished first" rule its window runs from about 20 BC to its completion in the AD 60s; it is later than every other item either way, so the long window costs no pairs. Its `when` line says so |

- **What is blocked and why:** items in one reign that no verse orders (Ahab's three); anything from Judges 17–21 against the judges' items; the tower of Babel against Noah's altar if step 3 finds the windows tie them (both early Genesis: as in the Timeline game, two `shown: false` items never prove order by their invented bounds, so only facts decide between them).
- **Checks the build runs:** every anchor resolves (event, ruler or person exists); computed windows are recorded on the review sheet beside the anchor; facts agree with windows, never contradict, no loop; every verse has Berean words; labels unique; at least 6 partners per item (smaller pool); at least 100 pairs per band.
- **Realistic count:** about **35–40 items**, roughly **550–650 pairs**: most items are centuries apart.
- **Bands:** Easy = windows, both tier 1, at least 400 years apart (Noah's ark and Solomon's Temple); Medium = at least 100 years or a fact between tier-1 items; Hard = the rest.

### 4.5 Where did they go first? (category 5)

- **"First":** first arrival of **one traveller on one journey** (§3). A pair is only ever two stops of the same journey; the card heading names the traveller and the line under it names the journey and its chapters.
- **Data source:** new hand-kept file `journeys.source.json`. Each journey is an ordered list of stops. A stop's position is its **first arrival** in the narrative of that journey; a place revisited later in the same journey keeps its first position and the revisit is not a card. Place ids link to Map quest's [places.json](Jarvis/Projects/BibleProject/Website/src/data/map-quest/places.json) where a place matches, for the name; otherwise the stop carries its own name.
- **Hand-kept file shape:**

```jsonc
{
  "journeys": [
    { "id": "paul-2", "traveller": "Paul", "travellerId": "paul-act-7-58", "title": "Second journey",
      "span": [44015036, 44018022], "origin": "antioch-syria",          // the starting place is never a card
      "stops": [
        { "id": "paul-2-troas", "place": "Troas", "placeId": "…", "arrive": [44016008, 44016008], "tier": 2 },
        { "id": "paul-2-philippi", "place": "Philippi", "placeId": "…", "arrive": [44016012, 44016012], "tier": 1 }
      ] }
  ],
  "blocked": [ { "journey": "exodus", "a": "kadesh", "b": "…", "reason": "…" } ]
}
```

- **Rules:**
  - **Only stops of one traveller on one journey are paired.** Paul's second-journey Philippi never meets his voyage to Rome.
  - **The journey's origin is never a card,** even when the traveller comes back to it (Paul's first journey starts and ends at Antioch of Syria; asking "Antioch or Derbe?" would make both answers defensible).
  - **Every stop must have an arrival verse** that places the traveller there. A place mentioned only as a departure point ("sailed from Cenchreae", Acts 18:18) is not a stop.
  - **Repeated visits:** a stop's position is the first arrival. If a place is visited twice and the first arrival is itself uncertain, the place is left out of that journey.
  - **Two stops whose order the text leaves unclear** (a summary like "through Phrygia and Galatia") are blocked against each other, or the summary region is left out.
- **Candidates (step 3 completes and checks each arrival verse):**

| Journey (traveller) | Stops in first-arrival order | Hazards |
|---|---|---|
| Paul, first journey (Acts 13:4–14:26) | Seleucia 13:4, Salamis 13:5, Paphos 13:6, Perga 13:13, Pisidian Antioch 13:14, Iconium 13:51, Lystra 14:8, Derbe 14:20, Attalia 14:25 | Origin Antioch of Syria left out. "Pisidian Antioch" needs its own stop name; Map quest has one "Antioch", so link it to whichever Antioch that place is and give the other its own name |
| Paul, second journey (Acts 15:36–18:22) | Derbe 16:1, Lystra 16:1, Troas 16:8, Samothrace 16:11, Neapolis 16:11, Philippi 16:12, Amphipolis 17:1, Apollonia 17:1, Thessalonica 17:1, Berea 17:10, Athens 17:15, Corinth 18:1, Ephesus 18:19, Caesarea 18:22 | Derbe and Lystra arrive in one verse (16:1, "came to Derbe and then to Lystra" in the Berean): keep only if step 3 confirms the wording orders them, else block. Cenchreae is a departure only. "Syria and Cilicia" (15:41) is a region summary, left out |
| Paul, third journey (Acts 18:23–21:17) | Ephesus 19:1, Macedonia 20:1, Greece 20:2, Troas 20:6, Assos 20:13, Mitylene 20:14, Chios 20:15, Samos 20:15, Miletus 20:15, Cos 21:1, Rhodes 21:1, Patara 21:1, Tyre 21:3, Ptolemais 21:7, Caesarea 21:8, Jerusalem 21:17 | "Galatia and Phrygia" (18:23) is a summary, left out. Regions (Macedonia, Greece) only if step 3 is content to show regions as "places" |
| Paul, voyage to Rome (Acts 27:1–28:16) | Sidon 27:3, Myra 27:5, Cnidus 27:7, Fair Havens 27:8, Cauda 27:16, Malta 28:1, Syracuse 28:12, Rhegium 28:13, Puteoli 28:13, Forum of Appius 28:15, Three Taverns 28:15, Rome 28:16 | Origin Caesarea left out. Forum of Appius and Three Taverns are where the brothers *came to meet* Paul (28:15); keep only if step 3 reads the verse as placing Paul there in that order, else block the pair |
| Israel in the wilderness (Exodus 12–19; Numbers 10–33) | Succoth, Etham, Pi-hahiroth (the sea), Marah, Elim, the Wilderness of Sin, Rephidim, Mount Sinai, Kibroth-hattaavah, Hazeroth, Ezion-geber, Mount Hor, the plains of Moab | Origin Rameses left out. **Kadesh left out**: Israel is at Kadesh early (the spies, Numbers 13:26) and again late (Numbers 20:1; 33:36), and Numbers 33 lists only the late stop. **Moseroth and Bene-jaakan left out**: Deuteronomy 10:6 and Numbers 33:30–31 give them in opposite orders. The card's traveller is "Israel" |
| Abraham (Genesis 11:31–22:19) | Haran 11:31, Shechem 12:6, Bethel and Ai 12:8, Egypt 12:10, Hebron (Mamre) 13:18, Gerar 20:1, Beersheba 21:31–33, Moriah 22:2–9 | Origin Ur left out. Bethel revisited (13:3): first arrival 12:8 counts. **Beersheba against Gerar**: Gerar 20:1, then the Beersheba covenant 21:31; keep, with the verses |
| Jacob (Genesis 28–46) | Bethel 28:19, Haran 29:4, Mahanaim 32:2, Penuel 32:30, Succoth 33:17, Shechem 33:18, Bethel again (not a card), Bethlehem road (Ephrath) 35:19, Hebron (Mamre) 35:27, Egypt 46:6 | Origin Beersheba left out (28:10). Bethel's first arrival is 28:19 |
| Elijah (1 Kings 17–19) | the brook Cherith 17:3–5, Zarephath 17:10, Mount Carmel 18:20, Jezreel 18:46, Beersheba 19:3, Horeb 19:8, Abel-meholah (Elisha's call, 19:16–19) | Abel-meholah is where Elisha lived; 19:19 does not name the place. Keep only if step 3 is content with "found Elisha" wording; else leave out |
| Elijah and Elisha's last walk (2 Kings 2:1–8) | Bethel 2:2, Jericho 2:4, the Jordan 2:6–8 | Origin Gilgal left out. Small (3 stops, 3 pairs) |
| The ark of the covenant (1 Samuel 4–7; 2 Samuel 6) | Ebenezer (the battle, 4:1–11), Ashdod 5:1, Gath 5:8, Ekron 5:10, Beth-shemesh 6:12, Kiriath-jearim 7:1, the house of Obed-edom 2 Samuel 6:10–11, the City of David 6:12 | Origin Shiloh left out. The traveller is a thing; the heading reads "Where did the ark of the covenant go first?" **Owner's call** whether a non-person traveller is welcome (§13) |
| Joseph (Genesis 37) | Shechem 37:14, Dothan 37:17, Egypt 37:28 | Origin Hebron left out. Small |
| Philip the evangelist (Acts 8) | Samaria 8:5, the desert road to Gaza 8:26, Azotus 8:40, Caesarea 8:40 | Origin Jerusalem left out |
| Peter (Acts 9:32–10:24) | Lydda 9:32, Joppa 9:38–39, Caesarea 10:24 | Small |
| David fleeing Saul (1 Samuel 19–27) | Naioth in Ramah 19:18, Nob 21:1, Gath 21:10, the cave of Adullam 22:1, Mizpeh of Moab 22:3, the forest of Hereth 22:5, Keilah 23:5, the Wilderness of Ziph 23:14, Maon 23:24, En-gedi 23:29, Gath again (not a card), Ziklag 27:6 | Tier 3 throughout; the narrative is generally taken as sequential, but step 3 checks every adjacent pair and blocks any it doubts |

  **Left out on purpose:** Jesus's journeys (the gospels often do not settle their order, and the owner ruled out "which miracle came first" for the same reason); the holy family's Bethlehem → Egypt → Nazareth against Luke's Bethlehem → Jerusalem → Nazareth (harmonising the two is a matter of argument).
- **Checks the build runs:** every stop has an arrival verse with Berean words; no stop repeats within a journey; the origin is not a stop; every blocked pair names stops of one journey; journeys with fewer than 3 stops are dropped with a notice; every stop has at least 2 partners; places matched to Map quest are listed with their place id, unmatched ones listed for review.
- **Realistic count:** about **14 journeys and 110–120 stops**, about **600 pairs**.
- **Bands:** by distance in the journey and tier: Easy = at least 6 stops apart and both tier 1–2; Medium = 3–5 apart; Hard = 1–2 apart (neighbouring stops) or any tier-3 stop.

### 4.6 Who died first? (category 6)

- **"First":** died first, as Scripture records it (§3). **Only people whose death Scripture records or plainly states** are cards: each carries the verse of their death (or, for Rebekah, of her burial, Genesis 49:31). That is what "Scripture-settled" means here: the deaths themselves are in the text, and the order between two of them is settled either by a verse or by the Bible's own numbers.
- **Never cards:** Enoch and Elijah (taken, did not die); Lazarus, the widow's son, Jairus's daughter, Dorcas, Eutychus (died and were raised, so "died first" has two answers); Jesus; anyone whose death Scripture does not record (Ruth, Daniel, most apostles: tradition only).
- **Data source:** new hand-kept file `died.source.json`. People ids from the Who's older? pool where the person is there. A death window is set by one of:
  - `age`: the person's Who's older? birth window plus their age at death stated in Scripture (Abraham 175, Genesis 25:7; Isaac 180, 35:28; Jacob 147, 47:28; Joseph 110, 50:26; Moses 120, Deuteronomy 34:7; Aaron 123, Numbers 33:39; Joshua 110, Joshua 24:29);
  - `anchor`: a Timeline event or ruler window (Saul's death is the end of his reign; Stephen's death is the Timeline event of his stoning);
  - `lifespan`: birth window plus 0–120 years, for someone whose age is unknown but whose birth window exists;
  - `hand`, with reasoning.
- **Order facts** carry the close pairs that windows cannot separate, each with its verse:

| Died first | Then | Verse that settles it |
|---|---|---|
| Abel | Adam | Genesis 4:8; 5:5 (Seth born after Abel's death, 4:25) |
| Sarah | Abraham | Genesis 23:2; 25:8 |
| Sarah | Rebekah | Genesis 24:67 (Isaac comforted after his mother's death when he married Rebekah); 49:31 |
| Rachel | Jacob | Genesis 35:19; 49:33 |
| Rebekah | Jacob | Genesis 49:31 (Jacob says she is already buried) |
| Isaac | Jacob | Genesis 35:29; 49:33 |
| Jacob | Joseph | Genesis 50:1, 26 |
| Miriam | Aaron | Numbers 20:1 (Kadesh) before 20:28 (Mount Hor) |
| Aaron | Moses | Numbers 20:28; Deuteronomy 34:5 |
| Moses | Joshua | Joshua 1:1 ("After the death of Moses") |
| Gideon | Abimelech | Judges 8:32; 9:54 |
| Eli | Samuel | 1 Samuel 4:18; 25:1 |
| Samuel | Saul | 1 Samuel 28:3 ("Now Samuel had died") |
| Saul | David | 1 Samuel 31:4–6; 1 Kings 2:10 |
| Amnon | Absalom | 2 Samuel 13:29; 18:15 |
| Absalom | David | 2 Samuel 18:15; 1 Kings 2:10 |
| David | Joab | 1 Kings 2:10; 2:34 |
| David | Solomon | 1 Kings 2:10; 11:43 |
| Ahab | Jezebel | 1 Kings 22:37; 2 Kings 9:33 |
| Jehu | Elisha | 2 Kings 10:35; 13:20 (Elisha dies in Jehoash's reign) |
| John the Baptist | Judas | Matthew 14:10; 27:5 |
| Judas | Stephen | Matthew 27:5; Acts 7:60 |
| Ananias | Sapphira | Acts 5:5, 7–10 ("about three hours later") |
| Stephen | James son of Zebedee | Acts 7:60; 12:2 |
| James son of Zebedee | Herod Agrippa I | Acts 12:2; 12:23 |

- **What is blocked and why:**

| Pair | Reason |
|---|---|
| Saul and Jonathan (also Abinadab and Malchi-shua) | Same day, same battle (1 Samuel 31:2–6) |
| Nadab and Abihu | Same moment (Leviticus 10:2) |
| Methuselah and Lamech (Noah's father) | The Hebrew numbers put Lamech's death 5 years before Methuselah's; the Greek and Samaritan numbers differ |
| Korah, Dathan and Abiram | Same event (Numbers 16:31–35) |
| Terah and anyone near Abraham's move | Genesis 11:26, 11:32 and Acts 7:4 leave Abraham's birth year relative to Terah open by 60 years |

- **Candidates (about 45):** Abel, Adam, Methuselah, Noah, Sarah, Abraham, Ishmael (Genesis 25:17), Isaac, Rebekah, Rachel, Jacob, Joseph, Miriam, Aaron, Moses, Joshua, Eglon (Judges 3:21), Sisera (4:21), Gideon, Abimelech, Samson (16:30), Eli, Samuel, Saul, Goliath (1 Samuel 17:50), Nabal (25:38), Uzzah (2 Samuel 6:7), Amnon, Absalom, David, Joab, Solomon, Ahab, Jezebel, Jehu, Elisha, Josiah (2 Kings 23:29), Herod the Great (Matthew 2:19), John the Baptist, Judas, Ananias, Sapphira, Stephen, James son of Zebedee, Herod Agrippa I.
- **Checks the build runs:** every person has a death verse with Berean words; no excluded person; every death window follows from its rule; a death never falls before the same person's birth window (fatal); every fact agrees with windows, never contradicts, no loop; labels unique (the clash rule); at least 6 partners per person; at least 100 pairs per band.
- **Realistic count:** about **45 people**, about **700–800 pairs** (windows separate most; the facts cover near contemporaries).
- **Bands:** as Who lived first's (§6.3 there).

### 4.7 Which comes first in your Bible? (category 7)

- **"First":** earlier in the 66-book Protestant order (§3). No disputes, so no blocked list.
- **Data source:** generated **at run time**, with no data file: the 66 books in the site's own numbering (Genesis 1 … Revelation 66, the same numbers as every verse id), with each book's name as the reader's current Bible names it, through the site's catalogue helpers (`useCatalog`, `bookByNum` in [refs.ts](Jarvis/Projects/BibleProject/Website/src/lib/refs.ts)). Translation therefore needs nothing new: book names are already the reader's Bible's.
- **Item:** `{ id: "MIC", label: "Micah", position: 33, tag: "Prophets" }`. The tag is the book's section in the site's library (Law, History, Poetry, Prophets, Gospels, Acts, Epistles, Revelation). **Review question for step 2:** the section is a strong hint (Law always before Prophets); this design shows it, because finding a book by its section is exactly what the brief says this category teaches.
- **Checks (in the tests, since there is no build step):** exactly 66 items with positions 1–66, no gaps; names come from the catalogue; no apocryphal book (the catalogue's numbers above 66 are excluded, as `loadBooks` already does).
- **Count:** 66 books, **2,145 pairs**.
- **Bands:** Easy = different testaments, or at least 20 books apart; Medium = 6–19 apart in one testament; Hard = 1–5 apart (Nahum and Habakkuk, Philippians and Colossians).
- **Reveal:** "Micah is book 33 and Nahum book 34" with a small shelf strip (§9.3), and a link to open the book in the reader.

### 4.8 Bible Firsts (category 8)

- **"First":** a first that **Scripture states, or plainly shows in the narrative it gives**. Each question's reveal quotes the verse. A first that rests on tradition or inference is left out.
- **Format:** one question, three or four answer cards (the kit's `AnswerCard`), exactly one right. Order of the options shuffled by the run's seed.
- **Data source:** new hand-kept file `firsts.source.json`; candidates may be drawn from the question bank (read-only). Generated into `firsts.json`.
- **Hand-kept file shape:**

```jsonc
{
  "questions": [
    { "id": "first-king-israel", "question": "Who was the first king of Israel?", "tier": 1,
      "answer": "Saul", "options": ["David", "Samuel", "Ish-bosheth"],      // 2 or 3 wrong options, hand-written
      "refs": [[9010001, 9010001], [9010024, 9010024]],
      "why": "Samuel anointed Saul, and the people shouted 'Long live the king!'",
      "answerId": "saul-1sa-9-2" }                                          // optional link to a person, place or book
  ],
  "left-out": [ { "question": "Who first saw the risen Jesus?", "reason": "…" } ]
}
```

- **Rules for wrong options:** each must be a plausible member of the same kind (another king, another disciple) and **must not also be a defensible answer** under any reading. The build checks no wrong option equals the answer after normalising, and the review sheet shows each question with its options so the owner can strike a doubtful one.
- **Candidates (step 3 checks each verse's Berean wording):**

| Question | Answer | Verse |
|---|---|---|
| Who was the first man? | Adam | 1 Corinthians 15:45 ("The first man Adam"); Genesis 2:7 |
| Who was the first person to die? | Abel | Genesis 4:8 |
| Who built the first city named in the Bible? | Cain | Genesis 4:17 |
| In whose days did people begin to call on the name of the LORD? | Enosh | Genesis 4:26 |
| Who was the father of all who play the harp and flute? | Jubal | Genesis 4:21 |
| Who was the first to be a mighty one on the earth? | Nimrod | Genesis 10:8; 1 Chronicles 1:10 |
| Which bird did Noah send out first? | A raven | Genesis 8:7 |
| Who was Jacob's firstborn son? | Reuben | Genesis 29:32; 49:3 |
| Who was the first king of Israel? | Saul | 1 Samuel 10:1, 24 |
| Who was the first king of the ten northern tribes? | Jeroboam | 1 Kings 12:20 |
| Who was Judah's first king after the kingdom split? | Rehoboam | 1 Kings 12:17; 14:21 |
| Whom did the LORD raise up as the first deliverer in the book of Judges? | Othniel | Judges 3:9 |
| Who was Israel's first high priest? | Aaron | Exodus 28:1; Hebrews 5:4 |
| What was the first of Jesus's signs? | Turning water into wine at Cana | John 2:11 |
| Whom did Andrew first find and bring to Jesus? | His brother Simon | John 1:41 |
| Which apostle does Matthew name first in his list of the Twelve? | Simon Peter | Matthew 10:2 ("first, Simon") |
| Who reached Jesus's empty tomb first, in John's account? | the other disciple, whom Jesus loved | John 20:4 |
| Which is the first and greatest commandment, Jesus said? | Love the Lord your God with all your heart, soul and mind | Matthew 22:37–38 |
| Which is the first commandment with a promise? | Honour your father and mother | Ephesians 6:2 |
| Where were the disciples first called Christians? | Antioch | Acts 11:26 |
| Through whose household did God first visit the Gentiles, as Peter told the council? | Cornelius | Acts 15:7, 14 with Acts 10 |
| Who was the first believer baptised in Philippi? | Lydia | Acts 16:14–15 |
| Who was the first of the church to be killed for his faith in the book of Acts? | Stephen | Acts 7:59–60; 8:1 — **wording matters**: "the first Christian martyr" is a traditional title; the question asks only what Acts shows |

- **Left out, and why (recorded in the file):** "Who first saw the risen Jesus?" (Mark 16:9 states it, but that verse is in the longer ending whose place in Mark is disputed, and the other gospels do not settle it); "the first prophet" (Abraham is the first called one, Genesis 20:7, but "first" there is only first mention); anything on the days of Creation or the order of the plagues (owner); "the first apostle to die" (Acts records only James's death, 12:2; "first" would be inference).
- **Checks the build runs:** every question has 2 or 3 wrong options, all different from the answer and from each other; every verse has Berean words; no question duplicates another's answer and wording; `answerId`, if given, exists.
- **Realistic count:** **about 25 questions** in the first release. Bible Firsts has no pairs, so it is dealt by question (§6.3).
- **Bands:** the question's `tier` (1 Easy, 2 Medium, 3 Hard).

### 4.9 Counts at a glance (estimates; step 3 reports the real ones)

| Category | Items | Askable rounds | Blocked |
|---|---|---|---|
| 1 Who lived first? | 160 (existing) | 10,789 pairs | 9 pairs (existing) |
| 2 What happened first? | about 245 | about 28,000 pairs | Timeline's 47 contested, plus the Creation-week and miracle groups |
| 3 Who ruled first? | about 105 | about 4,000–4,500 pairs | seed list §4.3 plus every failing succession or synchronism |
| 4 What was built first? | 35–40 | about 550–650 pairs | a handful (§4.4) |
| 5 Where did they go first? | 110–120 stops in about 14 journeys | about 600 pairs | Kadesh, Moseroth/Bene-jaakan, unclear summaries |
| 6 Who died first? | about 45 | about 700–800 pairs | §4.6 |
| 7 Which comes first in your Bible? | 66 | 2,145 pairs | none |
| 8 Bible Firsts | about 25 questions | 25 questions | the left-out list |

---

## 5. The engine: one item shape, one ordering function

### 5.1 The item

```ts
// src/pages/games/what-came-first/order.ts — no imports except ../whos-older/pairing.ts, so Node can load it (the build shares it)
export type CategoryKey = "lived" | "happened" | "ruled" | "built" | "went" | "died" | "books" | "firsts";
export type PairCategory = Exclude<CategoryKey, "firsts">;

export interface Item {
  id: string;
  label: string;            // on the card
  english?: string;         // the English label in a translated copy, for the clash rule (as Who's older? does)
  category: PairCategory;
  tier: Tier;               // 1 famous, 2 known, 3 deep cut
  lo: number | null;        // window of years (historians' numbering), null = open edge; both null for a positional item
  hi: number | null;
  shown: boolean;           // false = early Genesis: bounds keep the order only, never printed, never prove order between two such items
  position?: number;        // instead of years: place in a sequence (a journey's first arrivals, the 66 books)
  group?: string;           // only items of the same group are ever paired (a journey)
  refs: Span[];             // the verses the item rests on
}
```

Each category adds its own display fields in its adapter (Who lived first's `tag`, `when`, `brief`, `href`; a journey stop's place id; a book's section), but pairing reads only the fields above.

### 5.2 One ordering function

`orderOf(a, b, index, rules)` returns `{ first, second, reason }` or `null` (never ask). It is Who's older?'s function with three switches added, and the build and the game import the same file:

1. Same id, or either id on `rules.excluded` → `null`.
2. `a.group !== b.group` → `null` (journeys: one traveller, one journey).
3. `rules.clash` and the two English labels could be misread as one person → `null` (Who's older? §5.3; on for people, rulers and deaths; off for events, buildings, stops and books, whose labels are phrases or unique names).
4. The pair is blocked → `null`.
5. A direct order fact → `{ reason: fact }`.
6. Both have a `position` → the lower one first, `{ reason: { kind: "position", apart } }`.
7. Windows strictly apart (`a.hi < b.lo`; an open edge proves nothing) → `{ reason: { kind: "windows", gap } }` with `gap` from `yearsBetween`. If both are `shown: false`, this step proves order only when `rules.hiddenBoundsProve` is on (on for Who lived first, which already pairs Adam and Noah this way; off for every other category, as in the Timeline game).
8. Otherwise → `null`.

| Category | `clash` | `hiddenBoundsProve` | `excluded` | Ordered by |
|---|---|---|---|---|
| lived | on | on | Jesus, Melchizedek (Who's older?'s list) | windows, facts |
| happened | off | off | `events.source.json` `excluded` | windows, facts |
| ruled | on | off | — | windows, facts |
| built | off | off | — | windows, facts |
| went | off | off | — | position within a group |
| died | on | off | the never-cards of §4.6 | windows, facts |
| books | off | off | — | position |

**Who lived first must not change by a single pair.** A parity test runs the new `orderOf` with the `lived` rules and Who's older?'s own `orderOf` over every pair of the 160 people and requires the same answer (both `null`, or the same first and the same reason).

### 5.3 Per-category pieces

`src/pages/games/what-came-first/categories.ts` lists the eight categories in pill order. Each entry has: `key`; pill name; heading and the line under it (§3); its book-colour tone (§9.5); `format: "pair" | "choice"`; `rules` (§5.2); `bandOf(order)` (the bands in §4); `load()` (its data through `inSiteLanguage`, or the catalogue for books); and the words for the reveal's strip ("born", "began to reign", "finished", "died", "reached"). Each category's adapter (`categories/<key>.ts`, a few dozen lines) turns its generated file into items. Adding a ninth category later means one adapter, one entry and one data file.

### 5.4 What happens to the old folder

Other games import the old folder's helpers, and other builds read its data (§2.1), so:

- **Stay where they are, unchanged:** [pairing.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/pairing.ts), [explain.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/explain.ts) and their tests, [data.test.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/data.test.ts), all of [src/data/whos-older/](Jarvis/Projects/BibleProject/Website/src/data/whos-older/), [build-whos-older.ts](Jarvis/Projects/BibleProject/Website/scripts/build-whos-older.ts) and [scripts/whos-older/](Jarvis/Projects/BibleProject/Website/scripts/whos-older/). The folder becomes "Who lived first's model".
- **Shrinks:** [game.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/game.ts) keeps only Who lived first's types (`Character`, `WhosOlderData`, `PoolPair`) and `buildPool`, which `explain.ts` and `data.test.ts` use; the run and the dealer move to the new folder and are generalised there.
- **Move** with `git mv` (so their history follows) into `src/pages/games/what-came-first/`: the page, Round, Reveal, Screens, Timeline (becomes Strip), Hourglass, view.ts, share.ts, storage.ts, the stylesheet and their tests. The stylesheet keeps its `wo-` class names, so the approved look carries over without a rewrite; new classes use `wcf-`.

---

## 6. Scoring, modes and dealing

### 6.1 What stays exactly as it is

Streak (the first miss ends the run) and Relaxed (three hearts, with Easy, Medium, Hard or Mixed difficulty); the ramp (rounds 1–5 Easy, 6–15 Easy and Medium, then Medium and Hard with 40% Hard); no pair twice in a run; an item not reused within 8 rounds unless it stays; the seeded dealer, so a reload deals the same; side balance (the left card is right about half the time); milestone lines at 5, 10, 15, 25 and 50; the result card, share and recap of misses. Who's older? §6 has the details; none of them change.

### 6.2 Pair categories (1–7)

- **"One stays"** as now, inside the chosen category: the newer card moves left and a challenger arrives. In Journeys the challenger always comes from the same journey (its partners are only there); when that journey has no unused partner left, a fresh pair starts, usually from another journey.
- **The giveaway rule generalises.** Today a person with no real earliest year (early Genesis, Job) never stays, because they are the answer against everyone. The general rule: **an item that is first in every one of its pairs, or last in every one, never stays** (Genesis and Revelation among the books; Adam; the last stop of a journey; Herod Agrippa I among the deaths). Who's older?'s own rule is kept as part of it, so Who lived first deals as it does now.

### 6.3 Bible Firsts (category 8)

- One question, three or four answer cards; the options' order comes from the run's seed. One tap locks the answer, as the pair cards do.
- Streak and Relaxed work the same way. The ramp chooses the band by round number; a question is never asked twice in a run.
- **When every question has been asked, the run ends as a complete run** ("You answered all 25"), counted as its score, rather than repeating questions whose answers the player has just seen. The same applies in Relaxed.
- No hourglass and no "one stays" (there is nothing to carry over).

### 6.4 Mixed

- Each round's category is drawn by the run's seed, evenly among the eight, with two limits: **never the same category three rounds running**, and **Bible Firsts never twice running**. A category whose questions or pairs are used up drops out of the draw.
- **No "one stays" in Mixed:** each round is a fresh pair, because a card carried from "Who ruled first?" into "What was built first?" would make no sense.
- The heading changes every round to that category's question, with a small category chip above it so the change is noticed.
- The band follows the ramp by round number, applied to that round's category; a category with nothing left in a band falls back to an easier band, as now.
- Mixed loads every category's data at the start of the run (in parallel; the start button waits for all of them), so no round ever waits on a download.

### 6.5 Best scores

Kept **per category and per mode**, plus Mixed's own: nine choices × two modes = eighteen bests. The start screen shows the selected pill's bests under Streak and Relaxed. Relaxed's best covers all difficulties together, as today.

---

## 7. Saved bests and runs, and the migration

### 7.1 The new storage

One key, `bp-what-came-first`:

```jsonc
{
  "version": 1,
  "choice": "ruled",                                  // the pill last chosen, so the start screen opens on it
  "best": { "lived": { "streak": 14, "relaxed": 9 }, "ruled": { "streak": 3, "relaxed": 0 }, "mixed": { … } },
  "run": {
    "choice": "mixed", "mode": "streak", "difficulty": "mixed", "seed": 123, "hearts": 3, "over": false,
    "stamps": { "lived": "a1b2…", "ruled": "c3d4…" },  // each category's data stamp at the time of its rounds
    "rounds": [
      { "category": "lived", "left": "moses-exo-2-10", "right": "paul-act-7-58", "pick": "moses-exo-2-10" },
      { "category": "firsts", "question": "first-king-israel", "order": [2, 0, 3, 1], "pick": null }
    ]
  }
}
```

A Bible Firsts round stores the question id and the order its options were shown in (indexes, not words, so a language change cannot break it); the pick is an index into that order. The run is saved when each round is dealt and after each answer, exactly as now, so a reload brings back the same unanswered round and can neither undo a miss nor skip one.

A saved run is resumed only if **every** category in `stamps` still has that stamp; otherwise it is dropped and the bests stay. To check that, the page loads the data of the categories named in the saved run before it shows Continue.

### 7.2 Migration from Who's older?

On the first read, if `bp-what-came-first` is missing or unreadable and `bp-whos-older` holds a valid save:

1. `best.lived` = the old `best` (`streak` and `relaxed` as they are).
2. The old `run`, if it is still valid against Who lived first's data (the same checks as today's `parseRun`), becomes a run with `choice: "lived"`, `stamps: { lived: <old stamp> }`, and every round tagged `category: "lived"`. Because this job does not change `whos-older.json`, its stamp is unchanged and the run resumes on the same pair.
3. `choice` = `"lived"`.
4. The new key is written at once. **The old key is never written or deleted**, so going back to an older build of the site still finds it; and since migration runs only when the new key is missing, it never runs twice.

If storage is unavailable, the migration happens in memory on each visit and nothing is lost, which is today's behaviour for a blocked store.

---

## 8. Address, forward, registry, app tile and translation

### 8.1 The address

- The game lives at **`/games/what-came-first`**, page `src/pages/games/what-came-first/WhatCameFirstGame.tsx`, window title "What came first? · Games · Bible Guide".
- An optional query chooses the pill: `?c=lived`, `happened`, `ruled`, `built`, `went`, `died`, `books`, `firsts` or `mixed`. Choosing a pill updates the address in place (no new history entry), so a shared link opens the same category. An unknown value is ignored. Without one, the start screen opens on the player's last choice, else Who lived first.

### 8.2 The forward from `/games/whos-older`

The games hub sends any unknown `/games/...` address to the hub itself, so the old address needs its own route. One line in [App.tsx](Jarvis/Projects/BibleProject/Website/src/App.tsx), beside the site's other forwards (it already forwards `/testimonies/design` and `/study/rulers` the same way):

```tsx
<Route path="/games/whos-older" element={<Navigate to="/games/what-came-first?c=lived" replace />} />
```

React Router ranks this exact path above `/games/*`, so it wins wherever it sits. This keeps the hub's [GamesPage.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/GamesPage.tsx) untouched, as the brief requires. A test renders the app's routes at `/games/whos-older` and expects the new game with Who lived first chosen.

### 8.3 Registry and hub entry

- In [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts), the `whos-older` entry is replaced **in the same position** on the family shelf: `slug: "what-came-first"`, `load: () => import("./what-came-first/WhatCameFirstGame")`, `title: "What came first?"`, description *"Two people, events, kings, places or books: tap the one that came first. Eight kinds of round, or all mixed."*, audiences and shelf unchanged, `art: GAME_ART.whatCameFirst`.
- In [art/index.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/art/index.ts), only the entry's key is renamed from `whosOlder` to `whatCameFirst`. The drawing (`WhosOlderScene`: two portraits and an hourglass) and its tone stay, and so does its alt text, because the picture itself has not changed and the alt describes the picture. A new drawing is left to the owner (§13).
- [games README](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md): the "Who's older?" section becomes "What came first?", with the categories, the data files, the build command and the shared-file warnings of §5.4.

### 8.4 The phone app's tile

The app's games page draws its tiles from [games-hub.json](Jarvis/Projects/BibleProject/App/src/data/site/games-hub.json), which is **generated** from the website's committed registry and art index. In order:

1. Commit the website's registry and art index change first: the app's generator refuses uncommitted site edits.
2. In `App/`, run `python scripts/sync-site-content.py`. It rewrites the tile (slug, title, description, `path: "/games/what-came-first"`, tone, alt) and the app's mirrored copy of `language-packs.ts` (§8.5).
3. In [art.ts](Jarvis/Projects/BibleProject/App/src/components/games-hub/art.ts), the map key `'whos-older'` becomes `'what-came-first'`. The captured drawings are reused under the new slug's names (`git mv` of `games-whos-older.ts` and `games-whos-older-phone.ts` to `games-what-came-first*.ts`, imports renamed); if [capture-site-art.mjs](Jarvis/Projects/BibleProject/App/scripts/capture-site-art.mjs) names files by slug and is the expected way, re-capture instead.
4. Re-record the parity fingerprint of the games page as [site_parity.py](Jarvis/Projects/BibleProject/App/scripts/site_parity.py)'s header describes, because `registry.ts` is in its list.
5. `npm run check:site` in `App/` must pass, and the build report records its output.

### 8.5 Translation

- Every generated data file is loaded through `inSiteLanguage("what-came-first/<file>.json", english)` and its English labels are attached for the clash rule (`withEnglishLabels`, generalised from people to items).
- [extract.py](Jarvis/Projects/BibleProject/Website/content/translation/extract.py) `GAME_DATA` gains one entry per generated file, collecting only on-screen words: `events.json` (label, dating, fact reasons), `ruled.json` (label, tag, when, fact reasons), `built.json` (label, tag, when, fact reasons), `journeys.json` (journey title, traveller, place name), `died.json` (label, tag, when, fact reasons), `firsts.json` (question, answer, options, why). Never collected: ids, verse spans, positions, stamps, the book lists. Names of people and places take each language's Bible forms, as the other games' do.
- [language-packs.ts](Jarvis/Projects/BibleProject/Website/src/lib/language-packs.ts) `PACKED_ELSEWHERE` gains `"what-came-first/"` (and the app's mirrored copy follows through the sync of §8.4).
- [unregistered-reviewed.json](Jarvis/Projects/BibleProject/Website/content/translation/unregistered-reviewed.json) gains one line per `*.source.json` ("a build input no page reads"), as the Who's older? source files have.
- Page words (pill names, headings, lines, reveal templates) pass [english_build_check.py](Jarvis/Projects/BibleProject/Website/content/translation/english_build_check.py): counts with `plural`, numbers with `formatNumber`, and names in their own element ("Where did <span>Paul</span> go first?"; "Micah is book <span>33</span> of 66" with `formatNumber`).
- Books need nothing new: their names are the reader's Bible's own.

---

## 9. Screens

The approved Who's older? redesign is the template for every screen: tall cards with a medallion, the gold hourglass between them, the scoreboard (flame number or hearts), the kit's feedback band pinned to the bottom of a phone with Next in its first row, the result card. What changes is listed here; everything else stays.

### 9.1 Start

- Title **What came first?** and one line: *"Two from the Bible. Tap the one that came first."*
- **Nine pills, all visible at once** (no dropdown, no "more"): **People · Events · Rulers · Buildings · Journeys · Deaths · Books · Bible firsts · Mixed**. Short names keep them to three rows of three on a 390-pixel phone and one or two rows on a desktop; each pill is at least 44 pixels tall. The chosen pill fills with its category's tone; the others are outlined. The chosen category's full heading appears under the pills ("Who ruled first?").
- Below: the sample face-off for the chosen category (two real items from its data, with the hourglass; for Bible Firsts, a sample question with its answers greyed), then the row of **Streak** and **Relaxed** with that category's bests, then **Continue** when a run is saved (naming its category: "Continue Mixed, streak 6").
- The fold "How we date people" becomes **"How we decide what came first"**: the four sentences of today, made general (the Bible's order; dates are reconstructions; every window covers the dating systems; a pair is only asked when certain on all of them or a verse states it), plus one sentence for the chosen category (rulers: co-regencies; journeys: one traveller, first arrival; deaths: only deaths Scripture records; books: the 66-book order; Bible Firsts: only firsts Scripture states or plainly shows).

### 9.2 Round

- The heading is the category's question with its line under it (§3). In Journeys the traveller's name sits in its own element, and the line names the journey and its chapters. In Mixed a small chip with the category's short name sits above the heading, in its tone.
- **Cards:** name large in the site's serif, tag beneath, medallion at the top. The medallion carries the initial for people, rulers and deaths (as now); a small category glyph for events, buildings and stops (an initial of "God …" or "The …" would mean nothing); the book's short code for books. The tag never hints at the date (§4: events show no era, books show their library section, see §13).
- **Bible Firsts:** the question as the heading (no line under it), and three or four answer cards from the kit, two by two on a phone, one row on a desktop. No hourglass. The cards are shorter than the pair cards so the question, the answers and the pinned band all fit one 390 × 844 screen with Next visible; the build report measures it.
- Keys as now (`1`/`←`, `2`/`→`); for Bible Firsts `1`–`4`.

### 9.3 Reveal

The verdict band, the "Came first" stamp, the fold "More about them" and the report link are as now. The proof strip depends on the category:

| Category | Strip | Reason sentence |
|---|---|---|
| People, events, rulers, buildings, deaths | Today's timeline strip: two thick bars, years under their ends, the dashed bracket "at least N years". Bars labelled with the category's word: "born", "about", "began to reign", "finished", "died". Early-Genesis items: no years, "earlier" and "later", as now | Windows: *"Even on the dating systems that bring them closest, Solomon's Temple was finished at least 400 years before Nehemiah's wall."* Fact: the fact's `why`, then the verse quoted in the reader's Bible with its link |
| Journeys | **Route strip:** the journey's stops as dots along one line in arrival order, the two asked stops filled and named, the others small and unnamed, the origin as an open ring at the start | *"On his second journey, Paul reached Troas (Acts 16:8) before Philippi (16:12)."* with the first arrival verse quoted |
| Books | **Shelf strip:** 66 thin ticks with a gap between the testaments, the two books' ticks raised and named, their numbers under them | *"Micah is book 33 of 66; Nahum is book 34."* with a link to open each book in the reader |
| Bible Firsts | No strip. The right answer card is marked, a wrong pick marked as wrong | The question's `why`, then its verse quoted in the reader's Bible |

### 9.4 Run over

The result card as now, titled with the category ("Who ruled first? — streak of 12"), the bests bar for that category and mode, the share preview, and the missed rounds each with its strip (or, for Bible Firsts, its question and the right answer). Share text: *"What came first? · Who ruled first? — streak of 12 🔥 bibleguide.io/games/what-came-first?c=ruled"*, never naming an item.

### 9.5 Look, accessibility and motion

- **One room, eight accents.** The game's gold stays for the hourglass, the flame, the "Came first" stamp and the primary buttons. Each category carries one of the site's eight book-colour tones (the same tones the hub's art uses: law, history, poetry, prophets, gospels, acts, epistles, revelation), on its pill, its Mixed chip and a thin rule under its heading only. Step 4 assigns them so that neighbouring pills differ and checks contrast in both themes. No glow, no box inside a box.
- **No focus outline**, as the site rules: cards and pills show focus with the kit's lift and gold edge.
- **Reduced motion:** no state waits on an animation (the state changes at once, decoration is cut).
- **Both themes** finished and screenshotted.
- Screen readers: pills are a single-choice group of buttons with `aria-pressed`; the heading change in Mixed is announced with the round; the verdict through the polite live region, as now.

---

## 10. Files (for step 3 and step 4)

### 10.1 Created

| File | What |
|---|---|
| `src/data/what-came-first/events.source.json`, `rulers.source.json`, `built.source.json`, `journeys.source.json`, `died.source.json`, `firsts.source.json` | Hand-kept sources (§4) |
| `src/data/what-came-first/events.json`, `ruled.json`, `built.json`, `journeys.json`, `died.json`, `firsts.json` | Generated, "do not edit" header, each with its stamp |
| `scripts/build-what-came-first.ts` | Builds all six generated files and the review sheet; fails on any contradiction, naming the items. Runnable with `node --experimental-strip-types`, like the other game builders. Reuses [site-data.ts](Jarvis/Projects/BibleProject/Website/scripts/whos-older/site-data.ts) and the Timeline build's anchors |
| `scripts/what-came-first/checks.ts`, `rulers.ts` (window and succession rules, §4.3), `review-sheet.ts` | The build's parts, each under 500 lines |
| `docs/features/what-came-first/review-sheet.md` | Generated owner's review sheet (§12) |
| `docs/features/what-came-first/data-report.md` | Step 3's report: counts per category, dropped items, check output |
| `docs/features/what-came-first/build-report.md` | Step 4's report with screenshots |
| `src/pages/games/what-came-first/order.ts` | `Item`, `orderOf`, rules (§5) |
| `src/pages/games/what-came-first/categories.ts` and `categories/{lived,happened,ruled,built,went,died,books,firsts}.ts` | The category list and adapters (§5.3) |
| `src/pages/games/what-came-first/pool.ts` | Pairs by band and partners, generalised from Who's older?'s `buildPool` |
| `src/pages/games/what-came-first/game.ts` | Run, dealing, the giveaway rule, Bible Firsts dealing, Mixed (§6) |
| `src/pages/games/what-came-first/explain.ts` | Reason sentences per category and reason kind; reuses Who's older?'s gap and year helpers |
| `src/pages/games/what-came-first/CategoryPills.tsx`, `ChoiceRound.tsx`, `Strip.tsx` | The pills, the Bible Firsts round, the three strips |

### 10.2 Moved (`git mv`) from `src/pages/games/whos-older/` into `src/pages/games/what-came-first/`, then generalised

`WhosOlderGame.tsx` → `WhatCameFirstGame.tsx`; `Round.tsx`, `Reveal.tsx`, `Screens.tsx`, `Hourglass.tsx`, `view.ts`, `share.ts`, `storage.ts`; `Timeline.tsx` → `Strip.tsx`; `whos-older.css` → `what-came-first.css` (keeping its `wo-` classes); and the tests `WhosOlderGame.test.tsx`, `game.test.ts`, `storage.test.ts`, `view.test.ts`.

### 10.3 Changed

| File | Change |
|---|---|
| `src/pages/games/whos-older/game.ts` | Keeps only Who lived first's types and `buildPool` (§5.4) |
| [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) | Only the entry (§8.3) |
| [art/index.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/art/index.ts) | Only the entry's key (§8.3) |
| [App.tsx](Jarvis/Projects/BibleProject/Website/src/App.tsx) | One forward route (§8.2) |
| [extract.py](Jarvis/Projects/BibleProject/Website/content/translation/extract.py), [language-packs.ts](Jarvis/Projects/BibleProject/Website/src/lib/language-packs.ts), [unregistered-reviewed.json](Jarvis/Projects/BibleProject/Website/content/translation/unregistered-reviewed.json) | Registration of the new data (§8.5) |
| [games README](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) | The game's section (§8.3) |
| App: [games-hub.json](Jarvis/Projects/BibleProject/App/src/data/site/games-hub.json) (regenerated), [art.ts](Jarvis/Projects/BibleProject/App/src/components/games-hub/art.ts), the two captured drawings (renamed or re-captured), the app's `language-packs.ts` (mirrored), `site-parity.json` (re-recorded) | §8.4 |

### 10.4 Not changed

Every other game (the Timeline game included, though this game reads its data); the hub's `GamesPage.tsx`, `games.css` and drawings; the kit; the question bank; `src/data/whos-older/` and its builder; `src/data/timeline/`. `SOURCES.md` gains nothing unless step 3 uses a source outside Scripture and the site's own data (none is planned).

---

## 11. Tests (for step 3 and step 4)

- **order.test.ts:** each step of `orderOf` (§5.2) in isolation: group mismatch is `null`; clash on and off; blocked beats a fact; a fact beats windows; positions; strict windows (touching is not certain); open edges prove nothing; two `shown: false` items prove nothing unless `hiddenBoundsProve`. **Parity with Who's older?:** for every pair of the 160 people, the new function with the `lived` rules gives the same answer as `whos-older/pairing.ts` `orderOf`.
- **data.test.ts** (one block per generated file): ids unique; labels unique within the category; every fact's verse span has Berean words; facts agree with windows, never contradict, no loop; every blocked pair names two real items; at least the partner and band minimums of §4; and **an independent second check**, written separately from `orderOf`, over 2,000 random pairs per category: if an order is returned, then a fact exists, or the windows are strictly apart, or both items have positions in one group. Category-specific: no Creation-week pair and no miracle-against-miracle pair among the events; no excluded or never-card person among rulers and deaths; every journey stop shares its group with its partner and no journey's origin is a stop; Bible Firsts options all differ from the answer.
- **rulers.test.ts:** the window rule on real pages (Jehoram of Judah's window includes Thiele's 854 BC co-regency start and the sole-reign start after Jehoshaphat); the BC/AD conversion (Augustus `27` → −27, Tiberius `-14` → 14); Ahab and Jehoshaphat never asked; Pekah and Pekahiah never asked; Joash of Israel before Amaziah asked, by its synchronism; Rehoboam and Jeroboam I never asked.
- **books.test.ts:** 66 items, positions 1–66, names from the catalogue, the bands of §4.7.
- **game.test.ts** (moved and extended): everything it checks today, run for Who lived first; plus: Journeys' stayer always gets a same-journey challenger; the general giveaway rule (Genesis and Revelation never stay); Bible Firsts never repeats a question and ends complete when all are used; Mixed never deals one category three times running nor Bible Firsts twice running; Mixed has no stayer; side balance 40–60% over 1,000 seeded rounds in every pair category.
- **storage.test.ts** (moved and extended): bests per category and mode; a saved Mixed run resumes; a run with any changed stamp is dropped while bests stay; **migration**: an old `bp-whos-older` save with bests and a mid-run becomes Who lived first's bests and run, resumes on the same pair, writes the new key, leaves the old key byte-for-byte as it was, and does not run again on the next read; corrupt old data migrates nothing and breaks nothing; storage unavailable still plays.
- **WhatCameFirstGame.test.tsx** (moved and extended): the nine pills render with no dropdown; choosing a pill updates `?c=`; a scripted round in each category with a fixed seed shows the right heading, the reveal's reason and verse link; a Bible Firsts round; a Mixed run whose heading changes; the run-over card; **the forward**: the app's routes at `/games/whos-older` show this game with Who lived first chosen.
- [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx): runs unchanged (it checks every live entry has art and a shelf).
- **Unchanged and must still pass:** Who's older?'s `pairing.test.ts`, `explain.test.ts`, `data.test.ts`; the Timeline game's tests (it imports the old helpers); [translated-data.test.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/translated-data.test.ts).
- Then the site's full tests, `npm run typecheck`, eslint on the new folder, `npm run build` (which runs the English check first), and in `App/` `npm run check:site`. Never deploy.

---

## 12. The owner's review sheet

`docs/features/what-came-first/review-sheet.md`, generated by the build, one section per category, in plain words, with no codes left unexplained:

1. **At the top:** the counts per category (items, askable rounds per band, blocked pairs), and every warning still needing a decision.
2. **Per pair category:** every item with its label, tag, window as "about …" (or "no years: ordered by verses"), how the window was set (the anchor, or "from the ruler page's systems: Thiele–McFall 874, Albright 869, Ussher 918 BC"), and its verse.
3. **Every order fact** with its verse reference, its kind in words ("follows on one throne", "dated by the other king's reign", "the verse says so"), and its one-line reason. Facts derived by the build (successions, the judges' expansion) are listed apart, so the owner can strike any that look wrong: striking means adding the pair to the source file's blocked list.
4. **Every blocked pair** with its reason, and every pair the build refused (a succession or synchronism that a dating system contradicts) with the system that contradicts it.
5. **Journeys:** each journey as a numbered route, the origin marked, each stop with its arrival verse and its Map quest place (or "no map place").
6. **Deaths:** each person with the verse of their death and how their death window was set.
7. **Bible Firsts:** each question with its answer, its wrong options, its verse, and the left-out list with reasons.
8. **Books:** one line: "66 books in the site's order; nothing to review."

---

## 13. Open points for the review step and the owner

1. **A thing as a traveller.** The ark of the covenant's journey (Ebenezer → Ashdod → Gath → Ekron → Beth-shemesh → Kiriath-jearim → Obed-edom's house → the City of David) is one of the clearest itineraries in Scripture, but the brief speaks of "one traveller". This design includes it with the heading "Where did the ark of the covenant go first?"; the owner may strike it.
2. **Books' section as the card's tag.** Showing "Prophets" under Micah makes Law-against-Prophets pairs easy. That is the teaching the brief asks for ("teaches finding books"); the alternative is no tag.
3. **Bible Firsts wording on Stephen.** The question asks for "the first of the church killed for his faith in the book of Acts", not "the first Christian martyr", to keep to what Acts shows. The owner may prefer the familiar title.
4. **The hub picture.** The tile keeps Who's older?'s drawing (two portraits and an hourglass). A drawing that says "events, kings, places and books" would be a job of its own.
5. **Which category opens first** for a new player: Who lived first (this design, because the game grew from it) or Mixed.
6. **Bible Firsts' end.** A Streak run in Bible Firsts ends after about 25 questions as a complete run. The owner may prefer more questions before release; the category is accepted smaller rather than padded (brief §2).
7. **Regions as journey stops** (Macedonia, Greece on Paul's third journey): kept only if the owner is content for a region to stand as a "place".

---

## 14. Edge cases

| Case | Handling |
|---|---|
| Two rulers began the same year (Rehoboam and Jeroboam I) | Touching windows, no fact: never asked |
| Dating systems disagree about a co-regency or a synchronism | The windows overlap, and any fact for that pair fails the build until it is blocked (§4.3) |
| A king with the same name in both kingdoms | Qualified labels on both sides; the clash rule refuses an unqualified pair |
| Pages with no years (judges, unnamed pharaohs) | No window; paired only by verses (§4.3) |
| A place visited twice on one journey | First arrival only; an uncertain first arrival leaves the place out (§4.5) |
| The journey's starting place | Never a card |
| Two stops in one verse | Kept only if the wording orders them; otherwise blocked |
| Someone who died twice (Lazarus) or did not die (Elijah) | Never a card in Deaths |
| Two deaths on one day (Saul and Jonathan) | Blocked |
| The days of Creation, the plagues, Jesus's miracles against each other | Never asked (§4.2) |
| A Bible First whose "first" is only tradition | Left out, with its reason in the file |
| A wrong option that could also be defended | The owner strikes it from the review sheet; the build refuses an option equal to the answer |
| Every Bible First used up | The run ends complete (§6.3) |
| A category with nothing left at a band | Easier band, then a fresh pair, then (pair categories) a repeat rather than stopping, as now |
| Mixed's next category has nothing left | It drops out of the draw |
| Data updated while a run is saved | The run is dropped if any of its categories' stamps changed; bests stay |
| Old Who's older? save | Migrated once to Who lived first; the old key is left alone (§7.2) |
| Someone opens `/games/whos-older` | Forwarded to `/games/what-came-first?c=lived` |
| Translated data stale for one category | That category shows English until the translation is rebuilt, as every game does; the others are unaffected |
| A reader in another language | Book names in their Bible's language; other labels translated when the copies exist |
| Storage blocked | Play works, bests show "not saved on this device", migration happens in memory |
| Small phone, Bible Firsts with four answers | Two by two, measured to fit with Next on screen (§9.2) |
| Reduced motion | No state waits on an animation |

---

## 15. Cost

- **Runtime:** none. No model, no API, no new service. Static JSON loaded only when a category is played.
- **One-time:** curating about 105 rulers (mostly computed), 35–40 buildings, about 14 journeys, about 45 deaths and about 25 Bible Firsts is reading work for step 3, from Scripture and the site's own pages. **No model batch is needed.** If step 3 wants a cheap model to draft `when` lines, it must use the workspace's [BatchRunner](Jarvis/Tools/BatchRunner/README.md) rules (pilot, minimal context, owner's approval of the estimate first); this design does not require it.
- **Licences:** Scripture quotations from the Berean Standard Bible, already used site-wide; the ruler pages' dates are the site's own research; no new source.

---

## 16. Sources

- Owner's brief: [BRIEF.md](Jarvis/Projects/BibleProject/Website/docs/features/what-came-first/BRIEF.md) (2026-11-12).
- Who's older? design and implementation notes: [design.md](Jarvis/Projects/BibleProject/Website/docs/features/whos-older/design.md); its redesign: [whos-older-redesign.md](Jarvis/Projects/BibleProject/Website/docs/visual-audits/whos-older-redesign.md).
- Timeline sort, whose events and contested pairs this game reuses: [build-timeline.ts](Jarvis/Projects/BibleProject/Website/scripts/build-timeline.ts), [order.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/timeline/order.ts).
- The site's chronology policy: [Research/People/METHODOLOGY.md §3](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md) (Thiele–McFall main; Albright, Galil, Young and Ussher alternatives; dates are reconstructions, always "about").
- The site's ruler pages: [src/data/people-pages/](Jarvis/Projects/BibleProject/Website/src/data/people-pages/); places: [places.json](Jarvis/Projects/BibleProject/Website/src/data/map-quest/places.json).
- The app's hub sync: [site_games_hub.py](Jarvis/Projects/BibleProject/App/scripts/site_games_hub.py), [sync-site-content.py](Jarvis/Projects/BibleProject/App/scripts/sync-site-content.py), [site_parity.py](Jarvis/Projects/BibleProject/App/scripts/site_parity.py).
- Scripture: the verses cited in §4, to be checked against the Berean Standard Bible by step 3's build.
