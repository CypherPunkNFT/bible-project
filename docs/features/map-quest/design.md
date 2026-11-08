# Map quest — design

**Status:** draft (research & design step, job 716, sequence 31 step 1, 2026-11-07). One review and the implementation follow as separate steps.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 17 — "Player is given a place (Jericho, Corinth...) and drops a pin on a blank map; closer pin = more points." Open points listed there: place data, disputed locations, map style, difficulty and era modes, distance scoring, daily five-place shareable challenge.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) — reuse site data, no runtime LLM cost, BSB quotations, register on the /games hub, touch only this feature's files plus its registry entry, never deploy.

---

## 1. Summary of decisions

| Open point | Decision | One-line reason |
|---|---|---|
| Place data | Build the game's place list from the **same OpenBible.info geocoding data the atlas already uses**, read from the raw file so alternative sites survive; keep atlas place ids. | The atlas places *are* OpenBible data (best site only); the raw file adds the alternative sites and verse references the game needs. CC BY 4.0, already recorded in the site's sources list. |
| Disputed locations | **Both options, each where it fits.** Sites disputed only locally (all serious candidates within 25 km, e.g. Emmaus, Bethsaida) stay in play and the pin scores against the **nearest** candidate. Sites disputed across long distances (Mount Sinai, Sodom, Tarshish, Ophir) are **excluded from normal and daily play** and appear only in an optional "Disputed sites" mode that accepts any credible candidate. | Excluding Emmaus would throw away good expert material over a 17 km quarrel; scoring Mount Sinai against one mountain would teach something scholars do not agree on. |
| Map style | **Blank physical map**: the site's own earth-toned atlas basemap (land, vegetation, seas, lakes, rivers) with **every label, modern border and place dot removed**. Beginner level adds sea, lake and river names. **No modern borders at any level, no period region overlays in this version.** | Coastlines, the Jordan, the Dead Sea and the Sea of Galilee are the same as in Bible times; modern borders are anachronistic and politically loaded; period regions shift by era, exist only roughly for a few areas, and would give answers away. |
| Difficulty | Three levels by how well-known the place is: **Beginner** (a hand-checked list of ~60 famous places), **Standard** (mentioned in 5+ verses), **Expert** (every playable place). | Verse count tracks fame well (Jerusalem 955, Bethel 69, Jericho 63), but misses Sunday-school names such as Capernaum and Corinth, so the beginner list is curated. |
| Era modes | **All eras** plus five eras: **Abraham's world**, **Exodus & conquest**, **Kings & the divided kingdom**, **Life of Jesus**, **Paul's journeys**. A place belongs to an era if a verse in that era's books names it. Paul's journeys also uses the site's existing journey stops. Each era opens on a map view that frames its whole area. | No era tags exist in any data, but verse references give a reliable, testable mapping. |
| Scoring | **0–1,000 points per place, 5,000 per game**, on a logarithmic distance curve with a 3 km full-marks circle: `score = 1000 × (1 − ln(1 + max(0, d − 3)/10) / ln(1 + 2497/10))`, zero at 2,500 km or more. | One curve that still tells Bethel from Jerusalem (17 km) yet gives fair credit for Babylon from 200 km. Each doubling of the miss costs roughly 120 points. |
| Daily challenge | **"Daily Five"**: the same five places for everyone on the same calendar date (local midnight, as Wordle does), ordered easy to hard, one attempt per day, a streak, and a spoiler-free shareable result of five coloured squares. | This copies the proven Wordle and Worldle pattern. Using the local date means everyone's "today" starts at their own midnight. |
| Map/tile cost | **$0 new cost, no new dependency.** It reuses the site's self-hosted map tiles and the MapLibre packages already bundled for the atlas. | The tiles are already published under bibleguide.io/atlas-tiles/. |

---

## 2. Research

### 2.1 The three reference games

**GeoGuessr** (the best-known pin-drop game; bought Seterra in 2022).
- You drop a pin, and the game draws a line to the true spot and shows the distance and points: 5,000 per round, five rounds.
- The formula has never been published. Players reverse-engineered it as `5000 × exp(−10 × d / D)`, where `D` is the diagonal of the map's bounding box ([latb.io](https://latb.io/geoguessr/articles/the-maths)). On the world map that becomes `5000 × exp(−d / 1492.7 km)` ([jerrywei.net](https://www.jerrywei.net/blog/claude-plays-geoguessr)). Full marks within about 25 m.
- **Lesson:** exponential decay tied to the map's size is harsh up close and forgiving far away, and its scale has to change per map. We have one map that mixes a 25 km Holy Land question with a 2,000 km "where is Rome" question, so one exponential cannot suit both (worked through in §6.2).

**Worldle** (Teuteuf; daily country-silhouette guessing).
- One puzzle per day, chosen from the date, the same for everyone. Six guesses. Each guess shows the distance in km, an arrow in one of 8 compass directions, and a "proximity %".
- Sharing is text only and spoiler-free: `#Worldle #N X/6`, one row of coloured squares per guess, plus an arrow ([worldle.teuteuf.fr](https://worldle.teuteuf.fr/), [dailydles](https://dailydles.com/games/worldle)).
- **Lessons:** a daily number, a share grid that never names the answer, and the same content for everyone on a date are what make it spread. Worldle clones disagree on UTC versus local midnight; Wordle uses local midnight.

**Seterra** (map quiz; now on geoguessr.com).
- "Pin" mode (click the named place) and "Type" mode. Three tries per item; the item's colour records how many tries it took (white, then yellow, orange, red); after three misses the answer is shown. The score is percentage plus time. Learn and Review modes replay what you missed ([geoguessr.com/l/wor](https://www.geoguessr.com/l/wor), [HandWiki](https://handwiki.org/wiki/Company:Seterra)).
- **Lessons:** levels and themed sets (by continent; for us, by era) keep learners coming back. Always show the right answer after a miss — that moment is where the learning happens.

### 2.2 Existing Bible map games (the competition)
- **Bible MapQuest OT/NT** (CrazyGames; also sold as "Interactive Bible Map Games" on Teachers Pay Teachers) is the closest match: two players move a pin and the closest wins over 5 rounds. But it is emulated Flash and works only with a desktop mouse ([crazygames](https://www.crazygames.com/game/bible-mapquest)).
- **Sporcle** has type-in Bible location quizzes. **BibleWalks** has click-the-site games.
- I found **no modern, mobile-friendly, daily, GeoGuessr-style Bible map game.** That gap is the opportunity.

### 2.3 The place data
- **OpenBible.info Bible Geocoding Data** ([site](https://www.openbible.info/geo/), [GitHub](https://github.com/openbibleinfo/Bible-Geocoding-Data)).
  - Licence: **CC BY 4.0** (credit "OpenBible.info"). Parts derived from OpenStreetMap are **ODbL 1.0**.
  - The author warns: "There are almost certainly errors."
  - The site already holds a checksummed copy at `BibleProject/sources/openbible-geo/` and records it in [SOURCES.md:1384](../../../SOURCES.md#L1384) and [NOTICE.md](../../../NOTICE.md).
- **The raw file** `ancient.jsonl` has 1,341 places.
  - Each place lists `identifications[]`: candidate sites, each with `resolutions[].lonlat` and a crowd/scholar score `score.vote_total`.
  - It also has `verses[]` (OSIS references) and `types`.
  - **748 places have more than one candidate** (up to 14).
- **The atlas's own file** [data/places.json](../../../data/places.json) has 1,252 records and is built by [opendata.py:60-94](../../../scripts/bible/opendata.py#L60-L94).
  - It keeps **only the first candidate**, with `confidence = vote_total/1000` and verse ids. It has **no alternatives and no era tags**.
  - So the "site atlas coordinates" and "OpenBible geocoding" options in the spec are the same data. The game should read the raw file to keep the alternatives.
- **What vote_total means in practice** (probed for this design):
  - **500 is the value a place gets when only one site has ever been proposed**: Rome, Athens, Corinth, Jericho, Bethlehem and Patmos all sit at exactly 500.
  - Below 500 means the votes are split: Mount Sinai 463, Sodom 477, Golgotha 397, Emmaus 219.
  - Some well-attested places with weak rivals score above 500: Ai/et-Tell 765, Capernaum 860, Haran 837.
- **Disputes measured** (strong candidates = at least half the top score):
  - 1,207 places: candidates within 10 km.
  - 126 places: candidates more than 10 km apart.
  - 48 places: candidates more than 50 km apart.
  - Examples: Emmaus has two strong candidates 17 km apart. Bethsaida has two about 2 km apart. Ophir's candidates are 740 km apart. Tarshish's run from Spain to Sardinia.
  - **Mount Sinai looks settled in this data** (Jebel Musa 463 against 93 for the next candidate), **even though scholars seriously propose Jebel Sin Bishar, Har Karkom, Jebel Serbal and sites in Arabia.** So a few places need a hand-written override (§4.3).
- **The site's own curated disputes:** [40-the-land-of-the-bible.json](../../../content/academic-research/40-the-land-of-the-bible.json) lists Ai and Sodom as disputed. Its build script follows the rule "a proposed site is never given coordinates". The game must not present one Sodom site as fact, and this design keeps that faith.
- **Regions:** OpenBible has only rough shapes for some regions (Galilee, Judea, Samaria, Ephraim, Decapolis, Idumea, and the Roman provinces Macedonia, Achaia, Asia and Galatia). It has **no tribal allotments** (Judah, Benjamin, Manasseh, Zebulun, Naphtali are missing) and no Perea. The Website itself holds no region boundaries at all.
- **Paul's journeys:** the site already holds ordered journey stops with place ids in [paul-letters.json](../../../src/data/letters/paul-letters.json) (`maps`, ids `journey-1`…`journey-3`), used by [paul-journey.ts](../../../src/pages/places/paul-journey.ts).

### 2.4 The site's map code
- **Street atlas** ([StreetAtlasMap.tsx](../../../src/components/atlas/StreetAtlasMap.tsx), [street-style.ts](../../../src/components/atlas/street-style.ts)).
  - Built with MapLibre GL 6.12.0, PMTiles 4.5.0 and Protomaps basemaps 5.7.2.
  - It reads one 867 MB map file, served in 24 MiB pieces from the site's own `/atlas-tiles/` ([chunked-source.ts](../../../src/components/atlas/chunked-source.ts)).
  - The file has two parts: a **"world" layer, zoom 0–8, covering 12°W–73°E, 8°N–49°N**, and a **"detail" layer, zoom 9–15, only within 50 km of each place**. Roads, buildings and icons were stripped at build time.
  - The style already limits itself to an "ancient look" layer set ([street-style.ts:95-99](../../../src/components/atlas/street-style.ts#L95-L99)) with earth-toned light and dark palettes (`EARTH`, lines 24-39).
  - A first view loads about 0.8 MB.
- **SVG maps:** the site also has a pre-projected land outline, [atlas-map.json](../../../src/data/atlas-map.json) (137 KB, Natural Earth), with the projection helper [projection.ts](../../../src/components/atlas/projection.ts). It is coastline only: no lakes, rivers or Dead Sea. Other pages hand-drew those.
- **No games hub yet:** `src/pages/games/registry.ts` does not exist at the time of writing. The /games hub is job 714, in another chain.
- **No daily, seeded or share-score code** exists. The only clipboard code is "Copy link" at [TestimoniesPage.tsx:207](../../../src/pages/TestimoniesPage.tsx#L207). It falls back to "select and copy" when copying fails.
- **localStorage pattern:** a constant key, try/catch on read and write, a warning in the console, and the page keeps working without storage. Example: [record.ts](../../../src/pages/questions/test/record.ts).
- **Verse text:** [verses.ts](../../../src/lib/verses.ts) `useVerses({ids})` resolves BBCCCVVV verse ids into the current Bible text (BSB by default). Place verse ids plug straight in.

---

## 3. Place data — decision

**Use:** `BibleProject/sources/openbible-geo/Bible-Geocoding-Data-main/data/ancient.jsonl`. This is the same checksummed source and path that [build-data.py:241-242](../../../scripts/build-data.py#L241-L242) already reads.

**Build:** a new script, `scripts/build-map-quest.py`, run by hand when the data or curation changes. It writes a committed `src/data/map-quest/places.json` (estimated 60–80 KB, ~530 records). The output is committed because the atlas's `data/places.json` is not in git, and tests must read the game data from disk.

**Record shape:**
```json
{ "id": "a1b2c3d", "name": "Jericho", "lon": 35.4446, "lat": 31.8717,
  "alts": [], "tier": 1, "scope": "holy", "eras": ["exodus", "kingdoms", "jesus"],
  "verseCount": 63, "verse": 4002063 }
```
- `id` = the OpenBible/atlas id, so "Open in atlas" works.
- `lon`/`lat` = the top candidate.
- `alts` = other credible candidates for local disputes (§4).
- `tier` 1/2/3 = Beginner/Standard/Expert.
- `scope` = `holy` inside the box 33.8–36.9°E, 29.4–33.6°N, otherwise `wider`. It is used only for daily mixing.
- `eras` = §5.2.
- `verse` = the verse shown on the reveal card: hand-picked for Beginner places, otherwise the first verse in Bible order that names the place.

**Filters (applied in this order; counts from probing the real file):**
1. **Point-like places only.** Keep these types: settlement, mountain, hill, island, spring, well, fortress, campsite, cave. Drop regions, rivers, seas, peoples, gates, towers, pools and "special". This removes about 454. Regions and rivers have no single point to aim at; gates and pools sit inside Jerusalem.
2. **A credible location must exist.** Candidates are credible if `vote_total ≥ max(50, 20% of the best)`; otherwise only the best candidate counts. Drop the place if its credible votes total under 300. This removes about 247 places that are too uncertain to score fairly.
3. **Dispute width** (§4): credible candidates more than 25 km apart are removed from normal play. That is about 75 places.
4. **One place per name:** where several places share a name (Aphek ×4, Bethlehem 1/2/3, Ai 1/2/3), keep only the one named in the most verses. A player shown "Bethlehem" must never be marked wrong for choosing the famous one.
5. **No near-duplicates:** drop a place within 2 km of a better-known playable place (Zion, City of David and Mount Zion all sit on Jerusalem).
6. **Curation file** `src/data/map-quest/curation.json`, hand-maintained:
   - `beginner`: about 60 ids with hand-picked verses;
   - `forceDisputed`: places treated as widely disputed whatever the votes say;
   - `exclude`: places to drop;
   - `disputedNotes`: the short text for the Disputed sites mode.

**Expected pool** (probed): about **530 playable places** — about 400 in the Holy Land and 125 in the wider world. Of those, 78 are named in 10+ verses and about 140 in 5+.

**Credit:** the game screen footer reads "Place locations: OpenBible.info (CC BY 4.0) · Map: © OpenStreetMap contributors, Protomaps". The map attribution already carries the OpenStreetMap line. Add a row to [SOURCES.md](../../../SOURCES.md) naming the derived file and saying it is available under its sources' terms (CC BY 4.0 / ODbL 1.0) — the ODbL share-alike condition.

---

## 4. Disputed locations — decision

### 4.1 Local disputes stay in play (nearest candidate scores)
- **Rule:** a place whose credible candidates all lie within 25 km of each other is playable.
- The pin is scored against the **nearest credible candidate**.
- The reveal shows every candidate as a hollow ring, the scored one filled, with one line of text: "Scholars propose 2 sites; you were scored against the nearest."
- About 90 playable places have more than one candidate (Emmaus 17 km apart, Bethsaida ~2 km, Ai/et-Tell against Khirbet el-Maqatir ~1 km).
- **Why:** the spec offered "exclude" or "accept any candidate". For a short-distance dispute, accepting any candidate costs nothing in fairness and keeps good questions.

### 4.2 Wide disputes leave normal play
- **Rule:** credible candidates more than 25 km apart, or a place listed in `forceDisputed`, means the place is **not in Practice or Daily pools**.
- **Why:** a player who knows the debate would be marked down for picking a respectable site. And a single answer would teach a certainty the site's own Land study refuses to claim.

### 4.3 The "Disputed sites" mode
- An optional practice mode of about 10–15 famous disputed places, five per game:
  - Mount Sinai / Horeb (Jebel Musa, Jebel Sin Bishar, Har Karkom, Jebel Serbal, Jebel al-Lawz);
  - Sodom and Gomorrah (Bab edh-Dhra, Tall el-Hammam);
  - Kadesh-barnea, Tarshish, Ophir, Emmaus, Golgotha, Bethsaida, Cana, Gath.
- **Scoring:** any credible candidate counts (nearest one scored).
- **Reveal:** every candidate is labelled, with a two-line note from `disputedNotes` on who proposes which and why.
- **Who writes the notes:** a person, at implementation time, from the OpenBible candidate descriptions and the Land study. No LLM is needed for ~15 short notes.
- **`forceDisputed` starts as:** Mount Sinai, Mount Horeb, Sodom, Gomorrah. These look settled in the vote data but are not settled in scholarship (§2.3).

---

## 5. Difficulty and era modes — decision

### 5.1 Difficulty (which places can come up)

| Level | Pool | Approx. size | Map help |
|---|---|---|---|
| Beginner | `curation.beginner`: famous places a churchgoer has heard of — Jerusalem, Bethlehem, Nazareth, Jericho, Babylon, Nineveh, Rome, Corinth, Ephesus, Athens, Capernaum, Damascus, Hebron, Bethel, Tyre, Ur, Haran, Patmos… Seeded from places in 25+ verses, then edited by hand. | ~60 | Sea, lake and river names shown (Mediterranean Sea, Dead Sea, Sea of Galilee, Jordan, Nile, Euphrates) |
| Standard | Tier 1 + places in 5+ verses | ~160 | No labels |
| Expert | Every playable place | ~530 | No labels |

Levels decide **which places** come up, not how they are scored, so scores stay comparable.

### 5.2 Eras (which part of the story)
A place is in an era if at least one of its verses falls in that era's chapters. Each era opens on a map view framing its whole area, so opening the map gives nothing away.

| Era | Chapters | Opening view (W, S, E, N) | Playable places (probe) |
|---|---|---|---|
| All eras | — | 10°E, 24°N, 50°E, 42°N | ~530 |
| Abraham's world | Genesis 11–50 | 28°E, 24°N, 50°E, 39°N | ~36 |
| Exodus & conquest | Exodus, Numbers, Deuteronomy, Joshua, Judges | 30°E, 26°N, 38°E, 34°N | ~270 |
| Kings & the divided kingdom | 1 Samuel – 2 Kings, 1–2 Chronicles | 31°E, 28°N, 46°E, 37°N | ~200 |
| Life of Jesus | Matthew, Mark, Luke, John | 34°E, 30.5°N, 36.5°E, 33.5°N | ~33 |
| Paul's journeys | Acts 13–28, plus every stop in the site's journey maps | 11°E, 30°N, 37°E, 42°N | ~40–70 |

- **"Divided kingdom" widened:** the spec's "divided kingdom" became "Kings & the divided kingdom" (Saul to the exile). The divided-kingdom chapters alone (1 Kings 12 onward) give a thinner, mostly repeated pool, and Saul's and David's places belong to the same map.
- **Small pools:** if an era and level together leave fewer than 15 places (e.g. Abraham's world on Beginner), the game widens to the next level automatically and says so in one line.

---

## 6. Scoring — decision

### 6.1 Distance
- Great-circle (haversine) distance on a sphere of radius 6,371.0088 km, between the pin and the true site (the nearest credible candidate, §4).
- Shown as km with miles in brackets ("38 km (24 mi)").
- No helper exists in the codebase yet, so `scoring.ts` adds one.

### 6.2 Points per place
```
d      = distance in km
score  = 1000 × (1 − ln(1 + max(0, d − 3) / 10) / ln(1 + 2497 / 10))     for d < 2500
score  = 0                                                               for d ≥ 2500
rounded to the nearest whole point
```

| Miss | 3 km | 5 | 10 | 17 (Bethel for Jerusalem) | 25 | 50 | 100 | 200 | 500 | 1,000 | 2,000 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Points | 1000 | 967 | 904 | 842 | 789 | 685 | 571 | 451 | 289 | 165 | 40 |

**Why this curve rather than GeoGuessr's exponential:**
- An exponential tuned for the Holy Land (decay of 75 km) gives a 200 km miss on Babylon only about 70 points.
- One tuned for the wider world (400 km) gives Bethel-for-Jerusalem 958 points, so nearly no difference from a perfect pin.
- The log curve treats a *proportional* error the same everywhere: each doubling of the miss costs about 120 points. That matches how hard the question feels at every scale, with one formula and no per-place scale to explain.
- The **3 km full-marks circle** absorbs finger imprecision on a phone and the size of a town mound.

### 6.3 Game total and colour bands
- **5 places per game → 0–5,000.**
- Each place also gets a colour for the summary and share grid:

| Band | Points | Miss roughly |
|---|---|---|
| 🎯 | ≥ 950 | within 6 km |
| 🟩 | 800–949 | within 23 km |
| 🟨 | 600–799 | within 84 km |
| 🟧 | 350–599 | within 356 km |
| 🟥 | < 350 | farther |

- **No timer and no penalty for zooming.** It is a learning game for families and youth groups; speed would reward guessing over knowing.

---

## 7. Daily Five — decision

- **What it is:** five places, the same for everyone on the same calendar date.
- **Date:** the player's **local date**, changing at their own midnight. A game started before midnight finishes as that day's game.
- **Number:** puzzle `#1` is the launch date (constant `DAILY_EPOCH`, set by the implementer). `#N = days since epoch + 1`.
- **The mix**, in order, easy to hard:
  - slot 1 Beginner;
  - slot 2 Beginner or Standard;
  - slots 3–4 Standard;
  - slot 5 Expert.
  - At least one wider-world place and one Holy Land place.
  - No two places within 15 km of each other.
  - No place repeats within 90 days.
  - Disputed-only places are never used.
- **How a day's places are chosen:** a schedule file, `src/data/map-quest/daily.json`, generated by the build script for 3 years ahead (~1,100 days × 5 ids, about 45 KB, loaded only on the daily screen).
  - The script **only appends**: it refuses to change any date already in the file. So a later data or curation change can never alter a past puzzle, or today's puzzle in the middle of the day.
  - Past the end of the file, the game falls back to the same rules driven by a seeded random generator (mulberry32 seeded with the date number). The game therefore never breaks if nobody extends the file.
  - The answers are readable in the site's files, as Wordle's were. That is acceptable for a casual game.
- **One attempt:** each confirmed pin is saved straight away. Reloading resumes at the next place; a confirmed place cannot be redone. Once finished, the daily card shows the result, the share button and a countdown to the next puzzle.
- **Stats** (localStorage key `bp-map-quest`):
  - games played, current streak, best streak, best score;
  - the last 30 daily totals;
  - today's in-progress picks.
  - Wrapped in try/catch like [record.ts](../../../src/pages/questions/test/record.ts). Without storage the game still plays; streaks simply are not kept.
- **Share text** (no place names; spoiler-free):
  ```
  Bible Map Quest #42 — 3,912 / 5,000
  🎯🟩🟨🟩🟥
  bibleguide.io/games/map-quest
  ```
  - Uses `navigator.share` where available (phones). Otherwise it copies to the clipboard with a "Copied" toast, and falls back to a select-and-copy box when the clipboard is blocked, the same way Testimonies does.

---

## 8. Map and tile approach — decision and cost

**Approach:** a new game map component, `QuestMap.tsx`, built on **MapLibre with the site's existing PMTiles file**, and its own style builder, `quest-style.ts`.
- **Layers:** only background, earth, landcover, park, beach, water, streams and rivers. No `places_country`, no `boundaries*`, no label layers, no place dots.
- **Beginner** adds back only `water_label_ocean`, `water_label_lakes` and `water_waterway_label`.
- **Only the "world" source is used** (zoom 0–8), allowed to stretch to **maxZoom 10**. The "detail" source is never loaded, for two reasons:
  - Detail exists only within 50 km of a Bible place. In sparse areas (Arabia, Anatolia, Persia) sharp patches would reveal where the places are.
  - At zoom 8, one pixel is about 0.5 km. That is finer than the 3 km full-marks circle.
- **Pan limit:** `maxBounds` = the atlas's `BOUNDS`. Opening views are per era (§5.2). `renderWorldCopies: false`.
- **What it reuses** from [street-style.ts](../../../src/components/atlas/street-style.ts): `tilesBase()`, `MAP_KEY` and `BOUNDS`, which are already exported. It needs the `EARTH` palette exported, a one-word change that adds an export without altering anything. It registers the PMTiles protocol the same way [StreetAtlasMap.tsx:21-23](../../../src/components/atlas/StreetAtlasMap.tsx#L21-L23) does; MapLibre's `addProtocol` simply replaces an existing handler with the same key, so moving between atlas and game is safe.
- **Loading:** MapLibre is loaded lazily (`React.lazy`) so it adds nothing to other pages.

**Rejected alternative:** an SVG map from [atlas-map.json](../../../src/data/atlas-map.json) with d3-zoom. It is lighter, but has no Sea of Galilee, Dead Sea, Jordan or Nile. Those are exactly the landmarks players aim by, and the site would have to hand-draw them, as the Teachers pages did.

**Cost:**
- **$0 one-time, $0 recurring.**
- The tiles, fonts and MapLibre code are already published in the site's own Cloudflare static assets. Static-asset requests there are not billed per request, and a game view loads about 1 MB, cached by the browser.
- No paid API, no new external service, no new npm package, no runtime LLM.
- The place data is built once, locally, from a file already on disk.
- **Dependency:** the game needs the site's own `/atlas-tiles/`, which already backs the atlas. If those fail, the game shows an error state (§10).
- **Not in this version** (would need its own cost gate): one-sentence "why this place matters" blurbs for ~530 places. Rule-compliant only as a one-off pre-generated batch through BatchRunner (pilot, budget, owner approval). This version shows a BSB verse instead.

---

## 9. Screens

All routes sit under `/games/map-quest`. The registry entry is in `src/pages/games/registry.ts` (slug `map-quest`), flipped from "coming soon" to live.

1. **Game home**
   - Title, a one-line "how to play", and three cards:
     - **Daily Five** — states: Play / Resume (2 of 5) / Done (total, bands, share, countdown to next).
     - **Practice** — level picker (Beginner / Standard / Expert) and era picker (§5.2); Start.
     - **Disputed sites** — one line explaining that any proposed site counts.
   - Stats strip: played, streak, best.
   - Credits footer (§3).
2. **Round**
   - Map fills the screen.
   - A top bar shows "Place 2 of 5", the place name large, and the running total.
   - Tap or click drops a pin. Tapping elsewhere moves it; it can also be dragged.
   - A bottom **Confirm** button is disabled until a pin exists, so panning never commits a guess by accident.
   - **Keyboard:** arrow keys and +/− pan and zoom (MapLibre's built-in keyboard handler). A visible centre crosshair and **Enter** place the pin at the centre of the map. This makes the game playable without a pointer.
3. **Reveal**
   - The map fits both points (instant jump if reduced motion is on).
   - It draws a dashed line pin→site, the true site marker, and alternative candidates as rings.
   - The card shows:
     - name; distance in km (mi); points and colour band;
     - the reveal verse in BSB with its reference linking to the reader;
     - "Mentioned in N verses";
     - "Open in atlas" (`/study/atlas/map?find=<name>` — the implementer should use a place-id parameter if the atlas has one);
     - the candidate note for disputed places.
   - **Next.**
4. **Summary**
   - Total out of 5,000, and five rows: band, name, distance, points.
   - Daily: Share, streak, countdown. Practice: Play again (same settings) and Change settings.
   - Screen readers: each result is announced through a polite live region ("Jericho: 12 kilometres away, 884 points").

Light and dark themes come from the site theme (the `EARTH` palettes). Layout must work from 320 px wide upward.

---

## 10. Edge cases

| Case | Behaviour |
|---|---|
| Confirm without a pin | Button disabled; Enter with no pin places it at the crosshair first. |
| Pin in the sea or at the map's edge | Allowed and scored normally; the map can't pan outside `BOUNDS`. |
| Miss over 2,500 km | 0 points, never negative. |
| Place with several credible candidates | Scored against the nearest; all shown on reveal (§4.1). |
| Same name for several places | Only the most-mentioned is ever asked (§3 filter 4). |
| Same place twice in one game, or two places within 15 km | Prevented by the picker. |
| Era + level pool under 15 | Widen to the next level, with a one-line notice (§5.2). |
| Leaving mid-daily | Confirmed picks persist; reloading resumes; no redo. |
| Playing across midnight | The game keeps the date it started on; the new puzzle appears after finishing or on return. |
| Device clock wrong or changed | Harmless: it changes only which puzzle the player sees and their own streak. |
| Date beyond `daily.json` | Seeded fallback with the same mixing rules (§7). |
| localStorage unavailable (private window) | Game plays; no streak or resume; console warning only. |
| WebGL unavailable, or tiles fail to load | Error panel: "The map couldn't load", Retry, and a link back to /games. Daily progress is untouched. No second SVG renderer in this version. |
| Offline | Same as tile failure. Tiles already in the browser cache still work. |
| Reduced motion | No fly-to animation; instant jumps. |
| Small phones | Pinch zoom; Confirm stays within thumb reach; the name bar never covers more than 20% of the map. |
| Clipboard blocked | Select-and-copy box (§7). |
| Data rebuilt after launch | `daily.json` past dates are frozen by the script; a test checks every scheduled id still exists in `places.json`. |
| Shared result spoils answers | The share text never names places. |

---

## 11. Implementation plan (for step 3)

New files (this feature's own):
- `scripts/build-map-quest.py`: filters §3, eras §5.2, appends to the daily schedule §7. Plus `scripts/tests/test_build_map_quest.py`.
- `src/data/map-quest/places.json`, `daily.json` (generated); `curation.json` (hand-written).
- `src/pages/games/map-quest/`:
  - `MapQuestPage.tsx`, `QuestMap.tsx`, `quest-style.ts`;
  - `scoring.ts` (haversine, score, band);
  - `pools.ts` (level and era filters, widening, picker rules);
  - `daily.ts` (date → number → places, with fallback);
  - `storage.ts`, `share.ts`, `map-quest.css`;
  - a `*.test.ts` beside each logic file.

Shared files touched (minimal):
- the games registry entry;
- `export` added to `EARTH` in [street-style.ts](../../../src/components/atlas/street-style.ts);
- one row each in [SOURCES.md](../../../SOURCES.md) and [NOTICE.md](../../../NOTICE.md).

Tests to include:
- the score table in §6.2;
- band thresholds;
- haversine against a known pair (Jerusalem–Jericho ≈ 23 km);
- nearest-candidate scoring;
- pool sizes and widening;
- the daily picker obeys every mixing rule over 365 days;
- no repeats within 90 days;
- every scheduled id exists;
- the fallback beyond the schedule;
- share text contains no place names;
- storage failure does not throw.

**Dependency:** the /games hub and registry (job 714, another chain) did not exist when this was written. If it still does not exist at implementation time, the implement step must check its status rather than build a hub of its own.
