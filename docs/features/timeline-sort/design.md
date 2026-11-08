# Timeline sort — design

**Feature:** approved idea 13 in [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md): *"Drag Bible events (Flood, Exodus, David's reign...) into the right order."*
**Slug:** `timeline`. It is already in [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) as "coming soon" on the Daily puzzles shelf, with its picture (`GAME_ART.timeline`). The game lives at `/games/timeline`; this design folder is named `timeline-sort` because that is what this step's brief asked for.
**Rules followed:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md) and the site's [AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md).
**Written:** 2026-11-07 (sequence 30, step 7: research and design). Step 8 reviews this document; step 9 builds it.

---

## 0. Summary

- The player gets a short stack of Bible events (4 to 7 cards, such as "The Flood", "Israel leaves Egypt", "David is made king at Hebron") in a jumbled column. They drag the cards into order, **earliest at the top**, and press **Check**.
- **The core promise is the same one Who's older? makes: a set of cards is only dealt when its order is certain.** Every event carries a deliberately wide window of years, wide enough for every dating system the site already uses. It also carries the verses that fix its order against other events ("in the third month after the Israelites had gone out of Egypt", Exodus 19:1). Two events whose order is honestly unknown or disputed are never dealt together. Ezra's and Nehemiah's arrivals in Jerusalem are one such pair, and so are Daniel in the lions' den and Cyrus's decree. A disputed *date* does not stop an event being used when its *order* is not in doubt. The Exodus is the example: it was about 1446 BC or about 1260 BC, but it was certainly after Joseph and before Jericho. Its card then says so plainly in the reveal.
- **The data is a new hand-kept file of about 220 events**, built from the Bible's own numbers, the site's king and prophet pages (reign dates in up to five dating systems), and the people windows Who's older? already checks. A build script checks everything and writes a review sheet for the owner. Two outside sources are used only as cross-checks: Theographic's dated events and Robertson's public-domain Gospel harmony.
- **Two modes.** *Daily*: six events, the same for everyone that day, four tries, Wordle-style feedback and a share grid. *Practice*: Easy (4 cards), Medium (5) or Hard (7), optionally limited to one part of the story (eight "eras"). It allows one try per round and is scored by how many pairs of cards are in the right order.
- **Feedback** after each Check marks cards in the right place and joins cards that sit correctly next to each other. That way a player who has the order right but shifted by one is told so, not shown all wrong. The final reveal shows the true timeline with each event's date range, how sure anyone can be, and the reason each card follows the one before it, with the BSB verse.
- **Touch drag is built by hand on pointer events**, with no new library. It works with a finger, a mouse or a pen, with a grip handle and long-press, and the list scrolls itself near the screen's edge. It also has a tap-to-move route and full keyboard control, which the accessibility standard requires for any drag interaction.
- **No running cost.** No model calls, no services. Static JSON loaded on the game's page only.

---

## 1. What the spec fixes, and what this design decides

| The spec and brief fix | This design decides |
|---|---|
| Drag Bible events into the right order | What one card is: **a moment, worded as a happening** (§3.1). Earliest at the top of a vertical list (§9) |
| Events like the Flood, the Exodus, David's reign | A pool of about 220 events across eight eras, each with a year window and order facts (§4) |
| *(brief)* Dates or relative order; disputed dates handled honestly | Windows over every recognised dating system, verse-backed order facts, a contested list, and the rule that a dealt set must be certain on every system (§4, §5) |
| *(brief)* Difficulty levels | Easy, Medium and Hard by card count, fame and closeness; eight era packs; a daily mix (§6) |
| *(brief)* Touch drag | Pointer-event sorting with handle, long-press, auto-scroll, cancel, and non-drag alternatives (§9) |
| *(brief)* Scoring and feedback | Daily: tries out of four. Practice: pairs in order. Slot ticks plus joins, then a teaching reveal (§7, §8) |
| *(shelf in the registry)* Daily puzzles | A Daily mode with a frozen schedule, streaks and a spoiler-free share (§6.1, §11) |

---

## 2. Research

### 2.1 Ordering games that already exist

| Game | How it works | What we take | What we avoid |
|---|---|---|---|
| **Timeline** (Asmodee card game, Frédéric Henry, 2010; [rules summary](https://opinionatedgamers.com/2011/11/08/nathan-beelerreview-timeline-inventions/)) | Players place a card left or right of the cards already down; it is flipped to show its year. A wrong card is discarded and replaced. Two cards with the *same* year count as right in either order if they sit side by side ([review](https://thegaragegamers.blogspot.com/2015/08/timeline-historical-events-game-review.html)). | Proof that ordering famous events is fun with no trivia recall. Its tie rule names the problem that we solve differently: we never deal two events whose order is a tie or unknown. | Single exact years printed as fact. |
| **Wikitrivia** (Tom J. Watson, 2022) | Insert cards into a growing timeline; three lives; data from Wikidata. | Show the truth after a miss and carry on. | Its known weakness: wrong or ambiguous dates made unfair cards. |
| **Timdle** ([timdle.com](https://www.timdle.com/)) | Daily nine events; one is pinned as an anchor and the other eight are placed one at a time. Each wrong guess costs a point; streaks; an endless mode. | Daily rhythm and streaks. | One-card-at-a-time insertion is a different game from the spec's "drag events into order". It is noted as a later idea in §16. |
| **Chronle** ([chronle.com](https://chronle.com/)) | Daily events reordered by a drag handle; correct events turn green after each submission; limited moves. | The drag handle, which avoids fighting the page's scrolling, and the daily share. | Per-slot green only (see 2.3). |
| **Chrono** ([timedle.com/chrono](https://timedle.com/chrono)) | Six events a day, five attempts. After "Check Answer" each card in the right position turns green and each wrong one red. Unlimited practice mode. | Six events per day and a practice mode beside the daily. | Red-for-wrong with no other signal, and per-slot marks only. |
| **HistoryGuessr Timeline Daily** ([history-guessr.com](https://www.history-guessr.com/)) | Five events, three tries. After each try, each pair of neighbouring cards shows whether they belong together. Drag **or tap** into place, phone-friendly. Emoji share. | **Neighbour links as feedback**, and a tap alternative to dragging. | Links alone are hard to read for a first-time player, so we pair them with slot ticks. |
| **Bible Timeline game, BibleGamesHub** ([biblegameshub.com](https://biblegameshub.com/bible-timeline)) | About 30 events from Creation to Acts, ordered in "narrative order". Easy 5, Medium 8, Hard 10 cards, five rounds. Exodus labelled "Date debated", Abraham "Patriarchal period", David "Early tenth century BC". | Card counts by level, and an honest "date debated" label. | Only 30 events, so it repeats quickly. "Narrative order" is not always the order things happened (§3.2). |
| **Bible Times** (Mighty Good Games, iOS and Android) and **Bible History Game** (iOS) | 150 illustrated Bible event cards to order, alone or with up to four players; speed and sudden-death modes. A reviewer of the second says some events "feel random and are hard to place" ([App Store](https://apps.apple.com/us/app/bible-history-game/id545018219)). | A pool in the low hundreds is enough to stay fresh. | Events nobody could place. Our tiers and the rule that every card follows the one before for a stated reason exist to stop that. |

### 2.2 What makes the moment after Check worth having

The research the Who's older? design used applies here too: explaining *why* an answer is right teaches more than marking it right or wrong, especially after a confident mistake (Hattie and Timperley, *The Power of Feedback*, 2007; Butler, Karpicke and Roediger, 2008). So the reveal gives a reason for every step of the true order, not just a tick (§8.3).

### 2.3 Scoring a sort fairly

Marking only "right slot or not" punishes one early mistake far too hard. Suppose the true order is A B C D E F and the player puts B C D E F A. Every card is in the wrong slot (0 of 6), yet 10 of the 15 pairs of cards are in the right order. The only error is A. Two fairer measures exist:

- **Pairs in order.** Of all pairs of cards, how many are the right way round? This is the standard measure of how close two orderings are (Kendall's tau). In the example: 10 of 15.
- **Correct neighbours.** How many adjacent cards are correctly consecutive? This is HistoryGuessr's signal. In the example: B–C, C–D, D–E and E–F, so 4 of 5.

The design uses **pairs in order** to score Practice and **slot ticks plus neighbour joins** as the feedback between tries in Daily (§7). Both are simple to compute, cannot be read two ways, and are easy to test.

### 2.4 Dragging on phones, and the accessibility rule

- WCAG 2.2 success criterion 2.5.7, *Dragging Movements* (level AA), requires that anything done by dragging can also be done with single taps or clicks and no dragging. The tap-to-move route (§9.3) meets it, and the keyboard route (§9.4) covers people who cannot use a pointer at all.
- The usual phone problems, and what we do about each, are in §9.2: a drag that the browser takes as a scroll, the long-press text menu on iOS, a call or notification cancelling the touch, and a list taller than the screen in landscape.
- The site has no drag-and-drop library. It already uses `framer-motion` 12.38 and hand-rolls pointer capture in several places ([QuizSlider.tsx](Jarvis/Projects/BibleProject/Website/src/pages/home/QuizSlider.tsx), [PillScroll.tsx](Jarvis/Projects/BibleProject/Website/src/components/apologetics/PillScroll.tsx)). `framer-motion`'s `Reorder` component was considered and **rejected**: it has no keyboard or tap route, and it hides the order logic inside the component, where it cannot be unit-tested. Adding `@dnd-kit` would be a new dependency for one game. A small pointer-event sorter of our own, with the order logic in a pure function (§9.1), is less code to trust.

### 2.5 The site's data, and how far it can be trusted for order

| Source | What it gives | Can it decide order? |
|---|---|---|
| [whos-older/characters.source.json](Jarvis/Projects/BibleProject/Website/src/data/whos-older/characters.source.json) (built, 160 people) | A **birth window** for each person, set over every dating system the site recognises. Exodus dates covered: Ussher's 1491 BC, the early date of about 1446 BC, and late dates down to 1210 BC, with both readings of Exodus 12:40. Early Genesis is marked "order only". | **Yes, as an anchor.** "Moses is born" uses Moses' window directly, and "Joseph is sold into Egypt" is Joseph's window plus 17 years. Reusing these windows keeps the two games from ever disagreeing (§4.6, check 6). |
| [people-pages](Jarvis/Projects/BibleProject/Website/src/data/people-pages/) rulers files ([types.ts](Jarvis/Projects/BibleProject/Website/src/data/people-pages/types.ts)) | Every king's reign in up to five systems (`thiele-mcfall`, `albright`, `galil`, `ussher`, `other`), **BC written as positive numbers**. Also `events` within a reign, with the year of the reign when the Bible gives one. | **Yes**: the site's best dated material. Real values: Solomon 1015 BC (Ussher), 971 BC (Thiele–McFall), 962 BC (Albright). Zedekiah's reign ends between 588 and 586 BC. Hoshea's ends between 724 and 721 BC. **Not every page carries every system**: David's page has only Ussher and Thiele–McFall, and Hoshea's has no `other` (§4.3, step 2). |
| [METHODOLOGY.md](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md) §3 | Site policy: dates are reconstructions, never Scripture; always "about"; show the range where systems differ by more than 3 years. | Policy, followed here. |
| [harmony.json](Jarvis/Projects/BibleProject/Website/data/study/harmony.json) | A. T. Robertson, *A Harmony of the Gospels* (1922, public domain; [SOURCES.md](Jarvis/Projects/BibleProject/Website/SOURCES.md)). Numbered sections with Gospel references, in Robertson's order. | **No, cross-check only.** A harmony is one scholar's arrangement, and some of its order is debated (the temple cleansing, the order of Galilean events). The build warns when a Gospel order fact disagrees with it (§4.6). |
| Theographic Events.csv ([held copy](Jarvis/Projects/BibleProject/sources/theographic/), CC BY-SA 4.0) | 450 events (94 of them births and deaths), each with **one** Ussher-type start year. | **No, cross-check only, never shipped.** It contains plain errors. "Judgeship of Jair" sits at 1991 BC, before Abraham, and "Nimrod's kingdom begins" at 1821 BC, after Abraham. It also prints single years for everything. Read by the build for order warnings only, which also keeps its share-alike licence out of the game. |
| [data/text/bsb/](Jarvis/Projects/BibleProject/Website/data/text/bsb/) | Berean Standard Bible text | Quotes in the reveal, filled in at build time. |
| [question bank](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) | About 5,000 multiple-choice questions | **Not a source of events.** Only 6 of its strings concern order at all ("Esau came first…"). It may help suggest which stories players know. |

**Conclusion:** no existing file is an event list with honest order. The game needs its own small, hand-kept and checked event file. Most of the dating work is already done in the people windows and the reign tables.

---

## 3. Definitions

### 3.1 What one card is

- **A moment, worded as a happening:** "Samaria falls to Assyria", "Solomon begins building the temple", "Paul is shipwrecked on Malta". Never a span ("David's reign", "the wilderness years"), because "before" is unclear when spans overlap. A span becomes its beginning or one clear moment inside it: "David is made king at Hebron", "Israel refuses to enter Canaan at Kadesh".
- Labels are at most 48 characters, so a card fits two lines on a 320-pixel phone. They are unique, and two labels about the same person must be told apart by more than the person's name. Example: "Samuel anoints the boy David" against "David is made king at Hebron". The build checks both rules.
- **No date, book or chapter is shown on the card while sorting.** Book order is close to time order, so a reference would give the answer away. The reveal shows them all.

### 3.2 The order things happened, as the Bible tells it

- The game asks **when things happened in the story**, not where they are written. Judges 17–21 (the war against Benjamin) is printed at the end of Judges, but Phinehas, Aaron's grandson, is still priest in it (Judges 20:28). So it happened early in the period. Book order is a hint, never a rule.
- As in Who's older? (its design, §3.2), the game follows **the Bible's own timeline**. A one-sentence "How we order events" panel on the start screen (§10.1) says so. It does not argue about historicity or the age of the earth. Years are shown only as "about", and only where the site's own reign tables or people windows support them.
- **Early Genesis is order only.** From Creation to Abraham the Hebrew and Greek texts of Genesis 5 and 11 differ by centuries. Those events are marked `shown: false`: they are placed in order, but the game never prints a year for them (§4.3, step 6).

### 3.3 What is never a card

| Excluded | Why |
|---|---|
| Events whose occurrence is itself disputed as one or two events, chiefly **the temple cleansing** | John puts it at the start of the ministry (John 2:13–22) and the other Gospels in the last week (Mark 11:15–17). Readers disagree on whether it happened once or twice, so the card could not be placed honestly. |
| Future or prophesied events (the Second Coming, the events of Revelation 4–22) | They have not happened, and their order is exactly what interpretations of Revelation dispute. John *receiving* the vision on Patmos is allowed (§5.3). |
| When a book was written ("Isaiah writes chapter 40") | Authorship dates are disputed, and they are not events in the story. |
| Events from books that give no date and tie to nothing (Joel's locust plague, Obadiah's oracle) | They would have no window narrower than several centuries, and no partner close enough to be interesting. |
| Several cards describing the same moment ("Jesus dies" and "the temple curtain tears") | They would be a tie. Only one is kept. |
| Events after the Bible's narrative (the fall of the temple in AD 70) | Not Bible events. A reveal may mention them for context. |

---

## 4. Event data — source and model

### 4.1 Files

| File | Kind | Content |
|---|---|---|
| [events.source.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/events.source.json) | **hand-kept** | The pool: one entry per event (§4.2) |
| [facts.source.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/facts.source.json) | **hand-kept** | Order facts: pairs of events whose order a verse settles (§4.4) |
| [contested.source.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/contested.source.json) | **hand-kept** | Pairs or groups never dealt together, each with a reason (§4.5) |
| [timeline.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/timeline.json) | **generated**, with a "do not edit" header | What the game loads: events (with BSB quotes and links), facts, contested pairs, the order rank (§5.1) and a hash stamp |
| [daily.json](Jarvis/Projects/BibleProject/Website/src/data/timeline/daily.json) | **generated** | The Daily schedule (§6.1) |
| [review-sheet.md](Jarvis/Projects/BibleProject/Website/docs/features/timeline-sort/review-sheet.md) | **generated** | The owner's review sheet: every event's window beside the other sources, every fact, every warning (§4.6) |
| [build-timeline.ts](Jarvis/Projects/BibleProject/Website/scripts/build-timeline.ts) | script | Reads the sources and the site data and writes the generated files. Run by hand with `node --experimental-strip-types scripts/build-timeline.ts`, like the Who's older? and Wordle builders. It **fails** on any contradiction. It reads the site data through Who's older?'s build helpers in [site-data.ts](Jarvis/Projects/BibleProject/Website/scripts/whos-older/site-data.ts) (`Bsb`, `loadPeople`, `loadPeoplePages`, `loadBooks`, `parseCsv`), imported and never edited. |

The game loads `timeline.json` with a dynamic import on its own route only. At about 220 events and about 250 facts it should be roughly 90–120 KB raw and about 30 KB compressed. `daily.json` (about 1,100 days × 6 ids, roughly 150 KB raw and about 25 KB compressed) is loaded only when Daily is opened.

**Node can only load plain files.** Every game file the build imports (`order.ts`, `daily-rules.ts`) may import only other relative files, written with their `.ts` extension, and never the `@/` alias, React or JSON, as Who's older?'s `pairing.ts` and Map quest's `daily-rules.ts` already do. Map quest's `daily.ts` (`calendarDay`, `msUntilMidnight`) imports without an extension, so only the game may import it, never the build.

### 4.2 An event entry

```jsonc
{
  "id": "exodus",                         // lower-case, unique, never reused (§4.7)
  "label": "Israel leaves Egypt",         // the card; at most 48 characters, unique
  "era": "exodus",                        // one of the eight eras (§6.3)
  "tier": 1,                              // 1 famous, 2 known, 3 deep cut
  "when": { "lo": -1495, "hi": -1208 },   // widest window of years over every recognised system; negative = BC, no year 0. Must contain the anchor's range: Moses' window (-1575..-1288) plus 80
  "shown": true,                          // false = early Genesis, order only (§3.2)
  "dating": "About 1495–1210 BC. Scholars date the Exodus differently: about 1446 BC from 1 Kings 6:1, or about 1260 BC from Egyptian history. Its place in the story is not in doubt.",
  "refs": [[2012040, 2012042]],           // the verses the card is about (Exodus 12:40–42); the first span is quoted in the reveal
  "people": ["moses-exo-2-10"],           // optional site person ids, linked in the reveal
  "anchor": { "kind": "person-age", "person": "moses-exo-2-10", "age": [80, 80], "refs": [[2007007, 2007007]] }  // optional: how the window was set, re-checked by the build (§4.6)
}
```

`anchor` kinds: `person-age` (a whos-older person's birth window plus an age range), `reign-year` (a ruler's people-page id plus a year of the reign, worked out in every system on that page), `outside` (a fixed outside date such as Cyrus's capture of Babylon in 539 BC, with its source named in `dating`), and `manual` (written by hand, with a `note`). Every anchored window is recomputed by the build and must **contain** the computed range. It may be wider, never narrower.

### 4.3 How a window is set (the rules the build step follows)

1. **Find the anchor**: the verse that best fixes the moment. Examples: a king's year ("in the fourteenth year of King Hezekiah"), a person's age ("Abram was seventy-five years old when he left Haran"), or a count from another event ("in the four hundred and eightieth year after the Israelites had come out of Egypt", 1 Kings 6:1).
2. **Date it in every system.** For reign-year anchors, use every system on the ruler's page, converting the page's positive BC numbers to negative years. Pages do not all carry the same systems (David's has no Albright dates; Hoshea's has no `other`). So the build also works out the missing systems from the neighbouring ruler where the Bible links them (David's reign ends when Solomon's begins, so Albright puts David's accession at 962 + 40 = 1002 BC). Where that is not possible it prints a warning naming the missing system, and the window is widened by hand with a `note`. For person-age anchors, use the person's whos-older birth window, which already spans the systems. For the Exodus and earlier, cover the three Exodus dates and both readings of Exodus 12:40, exactly as the people windows do.
3. **The window is the smallest and largest result.** When in doubt, widen. A window that is too wide costs a few rounds. One that is too narrow could deal a set with no certain answer.
4. **Unknown edges stay open** (`lo: null` or `hi: null`). Job's trials are the one expected case. Nobody knows how early he lived, but Ezekiel 14:14 already names him as a famous man of the past, so `hi` is about −593, Ezekiel's day. (Who's older? uses −650, but that bounds Job's *birth*; his trials came later in his life, so the event's window must reach Ezekiel's day.)
5. **Count across the BC/AD line correctly.** Historians' numbering has no year 0: 1 BC is followed by AD 1. The gap from 10 BC to AD 15 is 24 years. Use Who's older?'s `yearsBetween` and `checkYear` from [pairing.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/pairing.ts), imported and never edited.
6. **Early Genesis** (Creation to Babel, and the patriarchs before Abram's call) gets internal bounds that respect the order the text gives. They sit wholly before the earliest year of Abram's call, as Who's older? does (its design, §4.2.1 step 6). These events are `shown: false`. Their `dating` line speaks in the text's own terms ("before the Flood, in Adam's line (Genesis 5)"). Their bounds are made up to keep the file consistent, so **between two `shown: false` events only facts prove order**, never the windows (§5.1).
7. **Write `dating` in plain words**, always with "about", always naming the reason for a wide range. It must never be more precise than the sources.

### 4.4 An order fact

```jsonc
{
  "first": "exodus", "second": "sinai-commandments",
  "refs": [[2019001, 2019001]],
  "why": "Israel reached Mount Sinai in the third month after leaving Egypt.",
  "close": true                          // true = the text puts them within about a generation; used by the difficulty rules (§6.2)
}
```

- A fact needs a verse that **states** the order or puts the two events in one plain sequence. Examples: "the next day", "after six days", "forty days", an age at each event, or one event presupposing the other ("the land had rest forty years in the days of Gideon", then the later judges). If reaching the answer needs an argument, it is not a fact.
- **Gospel facts** need either a time link in the text ("six days before the Passover", John 12:1; "on the first day of the week", Luke 24:1), or every Gospel that tells both events telling them in the same order. Robertson's harmony is a cross-check only.
- **Judges facts** need the text's own sequence and numbers. The judges may have overlapped regionally (Judges 10:7 has the Ammonite and Philistine oppressions at once), so the order of two judges is a fact only where the text's sequence makes it plain. Gideon (Judges 6–8) before Jephthah (Judges 11) qualifies, with Abimelech, Tola and Jair between them (Judges 9–10).
- Facts **may chain**, unlike in Who's older?: the Exodus before Sinai, and Sinai before Kadesh, puts the Exodus before Kadesh. A round only ever needs each card to follow the one before it, so the reveal never needs more than two steps to explain one join (§5.1).

### 4.5 Contested pairs

Pairs whose order is honestly disputed. They are never dealt together, whatever the windows or facts say. If the facts would make one of them certain, **the build fails**, because that means a fact claims more than the evidence allows. Seed list:

| Pair or group | Why |
|---|---|
| Ezra arrives in Jerusalem / Nehemiah rebuilds the walls | Ezra came "in the seventh year of King Artaxerxes" (Ezra 7:7). That is 458 BC if it means Artaxerxes I, the traditional view, or 398 BC if it means Artaxerxes II, a view held by many scholars since van Hoonacker. Nehemiah's twentieth year of Artaxerxes I is 445/444 BC. The windows overlap, and the game says so in both cards' `dating` lines. |
| War against Benjamin and Micah's idol (Judges 17–21) / any judge from Ehud onwards | The stories are set early (Phinehas is priest, Judges 20:28; Moses' grandson serves at Dan, 18:30) but are not tied to any judge. |
| Ruth comes to Bethlehem / any judge | "In the days when the judges ruled" (Ruth 1:1), but which judge is unknown. Ruth can still meet Jericho, which is earlier by a fact, and David's birth, which is later because she was his great-grandmother (Ruth 4:17). |
| Daniel in the lions' den / Cyrus lets the exiles go home | Both fall in the first years after Babylon fell, and Daniel 6:28 names the two reigns without ordering these events. The identity of "Darius the Mede" is itself debated. |
| Jesus' birth / the census under Quirinius as a separate card | How Luke 2:2 fits Quirinius's known census of AD 6 is debated, so the census is not a separate card. "Jesus is born" carries the census in its reveal. |
| Paul's letter to the Galatians / the Jerusalem council | Whether it was written before or after Acts 15 is debated. (Writing events are excluded anyway, §3.3; listed so no one adds it.) |

### 4.6 The build's checks (all fatal unless marked)

1. Every id is unique; every label is unique and at most 48 characters; ids listed in `people` exist in [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) and are not groups.
2. Every window has `lo < hi` where both are set, and no year 0. Every `shown: false` window ends before the earliest year of Abram's call.
3. **Anchors recompute.** Each anchored window must contain the range its anchor gives in every system (§4.2).
4. Every fact agrees with the windows: never `first.lo > second.hi`.
5. **No contradictions.** Windows and facts taken together contain no loop (A before B before C before A). If one is found, the build names every event in it. Every contested pair is *uncertain* under the full chain of windows and facts.
6. **Agreement with Who's older?** An event anchored on a person's age must lie within that person's lifetime as the people windows allow. Any fact between two "is born" events must not contradict a Who's older? order fact.
7. **Cross-check with Theographic (warning).** Where both sources have the event, a Theographic order that contradicts a certain order in our data is a warning. It must get a one-line resolution note in the source file before release, as Who's older? does with its `resolutions`. Skipped with a notice if the held copy is missing.
8. **Cross-check with Robertson's harmony (warning).** A Gospel fact whose two events fall in harmony sections in the opposite order is a warning that needs a resolution note.
9. **Enough rounds.** Every pool event can appear in at least 20 different valid Medium rounds. Each level and each era pack can produce at least 200 different rounds. The Daily generator fills three years without breaking its rules. An event with too few partners is dropped with a notice, which is not fatal.
10. Every quote is non-empty BSB text. The stamp changes only when the inputs change.

The review sheet lists, per era, every event (label, window, `dating`, anchor, Theographic year if any), every fact with its verse, every contested pair, and every warning with its resolution. That is the owner's way to check the content by eye.

### 4.7 Building the pool

About **220 events** in eight eras, chosen by hand in three tiers:

| Era (`era`) | About | Tier-1 examples |
|---|---|---|
| Beginnings (`beginnings`) | 10 | God creates the heavens and the earth; Adam and Eve leave Eden; Cain kills Abel; the Flood; the Tower of Babel |
| Patriarchs (`patriarchs`) | 30 | God calls Abram to leave Haran; Sodom is destroyed; Isaac is born; Jacob dreams of a stairway; Joseph is sold into Egypt; Jacob's family settles in Egypt |
| Exodus and conquest (`exodus`) | 30 | Moses is born; the burning bush; Israel leaves Egypt; the Ten Commandments at Sinai; the walls of Jericho fall |
| Judges and the united kingdom (`kingdom`) | 35 | Gideon defeats Midian; Samson pulls down Dagon's temple; Samuel is born; Saul is made king; David kills Goliath; David is made king at Hebron; Solomon begins building the temple |
| Divided kingdom and exile (`divided`) | 35 | The kingdom splits under Rehoboam; Elijah on Mount Carmel; Jonah preaches in Nineveh; Samaria falls to Assyria; Sennacherib besieges Jerusalem; Josiah finds the Book of the Law; Jerusalem and the temple are destroyed |
| Return (`return`) | 15 | Cyrus lets the exiles go home; the second temple is finished; Esther becomes queen; Nehemiah rebuilds the walls |
| Life of Jesus (`jesus`) | 40 | Jesus is born; Jesus is baptised; water into wine at Cana; the feeding of the five thousand; the entry into Jerusalem; the Last Supper; the crucifixion; the empty tomb |
| Early church (`church`) | 25 | The ascension; Pentecost; Stephen is stoned; Saul meets Jesus on the Damascus road; the Jerusalem council; Paul is shipwrecked on Malta; John's vision on Patmos |

- Tier 1 is about 60 events a churchgoing family would know, tier 2 about 90, and tier 3 about 70.
- `id`s are never reused. An event removed after launch is marked `"retired": true` instead of deleted, so past Daily puzzles still show it, but it is never dealt again. This applies the fix the Wordle review made for its own removed words.

---

## 5. Order and dealing rules

### 5.1 The shared functions

`src/pages/games/timeline/order.ts` is imported by both the build script and the game, as Who's older?'s `pairing.ts` is, so they cannot disagree.

- `link(a, b)`: a **direct** reason that `a` came before `b`. Either a fact `a → b`, or windows that share no year (`a.hi < b.lo`; an open edge never proves anything on that side). Windows never count when **both** events are `shown: false`, because their bounds are invented (§4.3, step 6); between those only a fact proves order. It returns `{ kind: "fact", fact }` or `{ kind: "windows", gap }`, where `gap = yearsBetween(a.hi, b.lo)`. That is the **smallest** distance any combination of systems allows. It returns `null` if the pair is contested or neither reason holds.
- `explain(a, b)`: `link(a, b)`, or a two-step reason through one other pool event `m` with `link(a, m)` and `link(m, b)` (preferring facts, then the largest smallest gap). Otherwise `null`.
- `rank`: a whole-pool order written by the build. It is a topological sort of all windows and facts, with ties broken by window midpoint and then id. It is consistent with every certain order.
- `validRound(events)`: sort the events by `rank`; the round is valid if **every consecutive pair has an `explain` reason** and no two events form a contested pair. Because each card is certainly after the one before it, the whole order is certain and there is exactly one right answer. Non-neighbouring pairs need no check of their own, since they follow by chaining.

### 5.2 Dealing

`deal(level, era, rng)` in `deal.ts`:

1. Filter the pool by level, tier and era (§6.2).
2. Pick a random first event, weighted towards events the player has seen least recently (kept in the browser, §11.1).
3. Repeatedly add a random candidate that keeps `validRound` true and meets the level's closeness rules (§6.2). Stop at the level's card count.
4. If it gets stuck, start again; after 200 attempts, drop the "seen least" weighting. **Certainty is never relaxed.**
5. Shuffle the cards for display so that at most one card starts in its right slot and the starting order is not already sorted.

### 5.3 Worked examples

Windows below are illustrative but follow §4.3 with the site's real values: the people windows from Who's older? and the reign dates on the people-pages. The build step sets every real one and records it in the review sheet.

| Event | Window | Basis |
|---|---|---|
| God calls Abram to leave Haran | about 2140–1638 BC | Abraham's window (2215–1713 BC) plus 75 years (Genesis 12:4) |
| Joseph is sold into Egypt | about 1945–1445 BC | Joseph's window (1962–1462 BC) plus 17 years (Genesis 37:2). He was 39 when Jacob's family arrived (41:46, 45:6), so this is 22 years before they settle |
| Israel leaves Egypt | about 1495–1208 BC | Moses' window (1575–1288 BC) plus 80 years (Exodus 7:7). It covers Ussher's 1491 BC, the early date about 1446 BC and late dates to 1210 BC, the same coverage as the people windows |
| The walls of Jericho fall | about 1455–1168 BC | Forty years after the Exodus (Numbers 14:33; Joshua 5:6) |
| David is made king at Hebron | about 1055–1002 BC | David's page: Ussher 1055 BC, Thiele–McFall 1010 BC. His page has no Albright dates, so Albright's comes from Solomon's page: 962 BC + 40 years = 1002 BC (§4.3, step 2) |
| Solomon begins building the temple | about 1012–959 BC | His fourth year (1 Kings 6:1). Solomon's page gives his accession as 1015 BC (Ussher), 971 BC (Thiele–McFall) and 962 BC (Albright), so his fourth year is about 1012, 968 and 959 BC |
| The kingdom splits under Rehoboam | about 975–922 BC | Rehoboam's page: Ussher 975 BC to Albright 922 BC |
| Samaria falls to Assyria | about 724–721 BC | Hoshea's ninth and last year (2 Kings 17:6): his reign ends in 724 BC (Albright), 723 BC (Thiele–McFall) or 721 BC (Ussher) on his page |
| Jerusalem and the temple are destroyed | about 588–586 BC | Zedekiah's eleventh year (2 Kings 25:2–9) |
| Cyrus lets the exiles go home | about 539–536 BC | Cyrus's first year over Babylon (Ezra 1:1) |
| Esther becomes queen | about 479–478 BC | Xerxes' seventh year (Esther 2:16) |
| Ezra arrives in Jerusalem | about 458–398 BC | Artaxerxes' seventh year (Ezra 7:7), read as either Artaxerxes |
| Nehemiah rebuilds the walls | about 445–444 BC | Artaxerxes I's twentieth year (Nehemiah 2:1) |
| Jesus is born | about 7–2 BC | Before Herod's death (Matthew 2:1, 2:19): 4 BC on most reckonings, 1 BC on a minority one |
| The crucifixion | AD 30–33 | The two dates scholars favour |
| John's vision on Patmos | about AD 64–96 | Under Nero or Domitian: both are held |

| Pair (next to each other in a round) | Verdict | Reason shown in the reveal |
|---|---|---|
| Jericho → David made king | certain | windows: at least 113 years apart |
| Israel leaves Egypt → Solomon begins the temple | certain | windows: at least 196 years apart. The reveal adds 1 Kings 6:1's "four hundred and eightieth year" as context |
| Esther becomes queen → Ezra arrives | certain, **Hard** | windows: at least 20 years apart, even on the traditional date for Ezra |
| Israel leaves Egypt → Ten Commandments at Sinai | certain | fact, Exodus 19:1 |
| Jericho falls → Gideon defeats Midian | certain, two steps | Jericho falls (Joshua 6) before Joshua's death (Joshua 24:29), which came before Gideon's day (Judges 2:8–11; 6:1). The middle step must itself be a pool event ("Joshua dies"), because `explain` only routes through pool events |
| The entry into Jerusalem → the Last Supper → the crucifixion | certain | facts, Mark 11–15 with John 12:1 |
| The crucifixion → John's vision on Patmos | certain | windows: AD 33 against AD 64 at the earliest |
| Ezra arrives / Nehemiah rebuilds the walls | **never together** | contested (§4.5) |
| Daniel in the lions' den / Cyrus lets the exiles go home | **never together** | contested; windows overlap |
| Job's trials / Israel leaves Egypt | **never together** | Job's window is open at the early end |
| The feeding of the five thousand / the Sermon on the Mount | **never together** unless a fact is found | the Gospels arrange Galilean events differently, and neither is tied in time to the other |

---

## 6. Modes, difficulty and rules

### 6.1 Daily

- **Six cards, the same for everyone on the same local date**, four tries. The puzzle number counts from an epoch, as in Wordle and Map quest.
- **Rules:** sort, press **Check**, read the marks (§7.1), adjust and check again. Solved when all six are right; over after four tries.
- **Check** is disabled until the order differs from every order already checked, so a try is never wasted on the same answer.
- **Schedule:** `daily.json` is written by the build for about three years ahead, following Wordle's reviewed rules ([its design](Jarvis/Projects/BibleProject/Website/docs/features/bible-wordle/design.md)):
  - Every day up to 14 days after the build date is frozen and copied unchanged, so a build that goes live up to two weeks late never changes a puzzle anyone has seen. As in Wordle, the file is `{ epoch, builtOn, frozenThrough, days }`, the margin is `FROZEN_AHEAD = 14` (changeable with `--freeze-days`, never below 2), and the games README says to put a new build live within 14 days or build again.
  - Past days are kept exactly as played, even after the file is extended. If the frozen margin reaches past the end of the old file, the build first extends it with the **same fallback function the browser uses**, then freezes those days, so days that browsers worked out for themselves never change (Wordle's rule; Map quest's build does not do this, and must not be copied here).
  - Retired events still display on their past days.
  - Past the end of the file, the game carries on with the same rules from a seeded generator (`mulberry32`, seeded with the puzzle number). It replays forward from the file's last 60 days, so the repeat rule still holds.
  - The epoch is the build date. It may be changed with `--epoch YYYY-MM-DD` before the first release; after launch, never.
- **A day's rules** (`daily-rules.ts`, shared by the build and the fallback):
  - six cards, valid by §5.1;
  - at least two tier-1 cards and at most one tier-3;
  - cards from at least three eras;
  - at most two of the five joins between neighbouring cards rely on a `close` fact or a window gap under 40 years, so a day is never all detail (a two-step join counts as close if either step is; a join to or from a `shown: false` event counts only by its fact, never by its invented gap);
  - no event repeats within 28 days.
- The local-date helpers (`calendarDay`, `msUntilMidnight`) and `mulberry32` are **imported** from Map quest's [daily.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/map-quest/daily.ts) and [daily-rules.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/map-quest/daily-rules.ts), never copied or edited. If the build step finds an import awkward, a private copy in this game's folder with a comment naming the original is acceptable. Editing Map quest's files is not.

### 6.2 Practice

- One round at a time, **one try per round**: sort, Check, then the reveal straight away (§8.3). **Next round** deals a new set.
- The player picks a **level** and, optionally, an **era** (§6.3). Both are remembered.

| Level | Cards | Who | How close cards may be |
|---|---|---|---|
| **Easy** | 4 | tier 1 only | Each join is by windows at least 200 years apart, a fact between two early-Genesis events, or a join from an early-Genesis event to a dated one. Example: the Flood, Israel leaves Egypt, David is made king, Jesus is born |
| **Medium** | 5 | tiers 1–2 | Each join is by windows at least 40 years apart, or by a fact that is not `close`. Example: Joseph is sold, Moses is born, Jericho falls, the kingdom splits, Samaria falls |
| **Hard** | 7 | any tier | Any join, including facts days apart. Example: seven events of Holy Week and Easter, or Esther and Ezra 20 years apart |

- **With an era chosen**, the card count is the level's and the tier filter stays. The closeness rule drops to Hard's, since events inside one era are often close. If an era and level together cannot fill a round, the game widens the tier filter by one step and says so in one line ("Not enough Easy events in the Return era: showing some harder ones.").

### 6.3 Eras

Beginnings, Patriarchs, Exodus and conquest, Judges and the united kingdom, Divided kingdom and exile, Return, Life of Jesus, Early church (§4.7), plus **All of the Bible** (the default). The era names match Map quest's style ("Abraham's world", "Life of Jesus") where they cover the same ground. They are labels only, never shown on cards.

---

## 7. Scoring

### 7.1 Daily: feedback between tries

After each Check:
- **Right place:** each card in its correct slot gets a tick, the words "Right place" (visually hidden for screen readers, shown as a label on wide screens) and a green edge.
- **Joined:** between two neighbouring cards that are correctly consecutive in the true order, a link icon appears in the gap, with the text "these two belong together". This tells a player whose block of cards is right but shifted that the block is right.
- Nothing is marked red. A card with neither mark is simply unmarked. "Wrong" is implied, and red-for-wrong adds nothing for colour-blind players.
- The cards stay where the player put them, so they can see the marks and adjust.

**Score:** solved in *k*/4, or X/4 if not solved. Kept per puzzle with a streak (consecutive days solved), a best streak and a distribution, as in Wordle.

### 7.2 Practice: pairs in order

- **Score of a round** = pairs of cards in the right order ÷ all pairs: 6 pairs at Easy, 10 at Medium, 21 at Hard. It is shown as "9 of 10 pairs in order" plus **stars**: all pairs 3 stars, at least 80% 2 stars, at least 60% 1 star.
- **Perfect streak:** consecutive perfect rounds at the current level. The best perfect streak per level is kept.
- Why this measure: see §2.3. Moving one card from top to bottom of six still scores 10 of 15, which is honest about how much the player knew.

### 7.3 No timer

There is no clock and no points for speed, in either mode. The game is about learning order, and families sort together.

---

## 8. Feedback and the reveal

### 8.1 While dragging

The lifted card casts a shadow and grows slightly; the others slide aside to show where it will land. A thin "Earliest" label sits above the first slot and "Latest" below the last, so the direction is never in doubt.

### 8.2 After a Daily try

The marks in §7.1, a line such as "2 in the right place, 3 joins, 3 tries left" (also announced to screen readers), and the Check button returns once the order changes.

### 8.3 The reveal (end of a Daily, or after the one Practice try)

1. A banner: **"Solved in 3!"**, **"Not this time"** (Daily) or **"9 of 10 pairs in order"** with stars (Practice).
2. **The true timeline**, a vertical strip with the six cards in order. Each card shows:
   - the label, and a small "you had it at 4" note when the player's position differed;
   - the **dating line**: "About 1495–1210 BC…" with its plain-words reason, or, for `shown: false` events, the text's own terms with no year;
   - a soft bar on a year axis showing the window, drawn faded where it is wide. If **any** card in the set is `shown: false`, the year axis is dropped and the cards are evenly spaced with era words instead ("before the Flood", "David's time"). As in Who's older?, one axis cannot honestly carry real years and invented ones together;
   - the BSB quote of its first verse span, linked to the verse (`/read/bsb/EXO/12?hl=40`), and links to any people's pages.
3. **Between every two consecutive cards, the reason** the lower one is later, in one line:
   - windows: *"At least 113 years later, even on the dating systems that bring them closest."* Gaps over 1,000 years are rounded down to the hundred. When either card is `shown: false`, the line is *"Later in the Bible's story"*, with no number.
   - fact: the fact's `why` and its verse link.
   - two steps: the two reasons joined ("Joshua died before Gideon's day (Judges 2:8–11); Jericho fell in Joshua's lifetime (Joshua 6)").
   The joins the player got the wrong way round are highlighted, so the eye goes to what they needed to learn.
4. **Your order**, a toggle that shows the player's final order beside the true one (small, collapsed by default on phones).
5. **"Something look wrong? Tell us"**, linking to the site's `/contact` page, as in Who's older?. This is Wikitrivia's lesson.
6. **Next round** (Practice) or **Share** and the countdown to tomorrow (Daily).

### 8.4 Why the wording is honest

- The gap shown is the *minimum* any system allows. The game never says "the Exodus was in 1446 BC".
- Every year says "about" and shows a range where systems differ by more than 3 years ([METHODOLOGY.md](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md)).
- Wide ranges say why ("scholars date the Exodus differently"). Contested pairs are never asked, and both cards' `dating` lines name the dispute when they appear in other rounds ("Some scholars date Ezra's arrival after Nehemiah's, to 398 BC.").
- Quotes are BSB. The site's per-person `story` and `article` texts quote the KJV and are not used.

---

## 9. Touch drag and other controls

### 9.1 The order logic (pure, testable)

`sortable.ts` holds a pure function, `move(order, from, to)`, which returns a new array with one card taken out and inserted at `to`. It has unit tests for moving up, down, to the ends and onto itself. Every input method ends in a call to it, so drag, tap and keyboard cannot disagree.

### 9.2 Drag with a finger, mouse or pen

- **Where a drag starts:**
  - From the **grip handle** (a 44 × 44 px target at the card's right edge, `touch-action: none`), a drag starts at once, for any pointer.
  - From **anywhere else on the card**, a mouse starts a drag after moving 4 px. A finger or pen starts one after a **300 ms long-press**, with a short vibration where the phone supports it. Moving more than 8 px before then is treated as a page scroll, and the card body keeps `touch-action: pan-y`. So a finger can scroll the page from a card, and can always drag from the handle.
  - **Making the long-press drag actually work on phones.** The browser reads `touch-action` when the finger first lands, so on a `pan-y` card body it will take the first vertical movement after the long-press as a scroll and send `pointercancel`, ending the drag at once. Pointer events cannot stop that. So each card also gets a native `touchmove` listener added with `{ passive: false }` (React's `onTouchMove` is passive and cannot do this) that calls `preventDefault()` only once the long-press has armed. Before it arms the listener does nothing, and the page scrolls normally. This must be tried by hand on iOS Safari and Android Chrome. If either still cancels, the build keeps the handle drag and tap-to-move and drops the long-press, rather than shipping a drag that breaks.
- **During the drag:**
  - The card follows the pointer vertically (a `transform`, no layout change) under `setPointerCapture`.
  - The target slot is where the card's centre crosses the neighbouring card's midpoint.
  - The other cards slide with `framer-motion` `layout` animation, already a site dependency. Under reduced motion they jump.
- **Auto-scroll:** within 48 px of the top or bottom edge of the screen, the page scrolls at a speed proportional to the distance into that band. The card's position and target slot are worked out from the pointer **plus how far the page has scrolled since the drag began**, and recomputed on every scroll step even when the finger is still; otherwise the card drifts away from the finger. This matters for Hard (7 cards) on a phone held sideways.
- **Ending the drag:**
  - Dropping (`pointerup`) calls `move`.
  - **Escape**, `pointercancel` (an incoming call, the system taking the gesture) or losing pointer capture puts the card back where it started. A drag never leaves a half-moved state.
  - Only one pointer drags at a time; a second finger is ignored.
- **iOS and Android quirks:** cards use `user-select: none` and `-webkit-touch-callout: none`, and the context menu is suppressed on cards, so long-press never opens the text-selection or "copy" menu. Tap highlight colour is transparent.
- **Size:** each card is at least 56 px tall with its label on at most two lines. Seven cards plus the header fit a 667-px-tall phone screen held upright, so auto-scroll is only needed sideways or on very small screens.

### 9.3 Tap to move (no dragging needed)

Tapping a card **selects** it (lifted look, "Selected" announced). This is the same "lifted" state the keyboard uses (§9.4): pressing Enter or Space on a card's button fires its click, so the two routes must share one state, not fight. Then:
- tapping another card moves the selected card into that card's slot (an insert, not a swap), or
- the selected card shows **▲** and **▼** buttons that move it one slot at a time;
- tapping the selected card again, or anywhere outside the list, deselects it.

This is the route WCAG 2.2's dragging rule requires (§2.4). It is also the easiest route for small children, who often cannot hold a long-press.

### 9.4 Keyboard and screen readers

- The list is an `<ol>` of `<li>`s, each holding one card `<button>` named like "Israel leaves Egypt, position 3 of 6".
- **Space or Enter** picks a card up (the same lifted state as a tap, §9.3), **↑ and ↓** move it, **Space or Enter** drops it, and **Escape** cancels and returns it. These are the familiar keys from widely used sortable lists.
- Every move is announced through a polite live region ("Israel leaves Egypt, now position 2 of 6"), and so are the marks after a Check.
- Focus stays on the moved card. After Check, focus goes to the result line; after the reveal opens, to its heading.

---

## 10. Screens

### 10.1 Start

- Title **Timeline sort**, and the one-line rule: "Put Bible events in the order they happened, earliest at the top."
- Two large buttons:
  - **Today's timeline**, with the puzzle number, or "Done — see your result" once played;
  - **Practice**, which opens the level row (Easy, Medium, Hard) and an era menu (All of the Bible by default).
- Daily stats (streak, best) under the Daily button; the best perfect streak for the chosen level under Practice.
- **Continue**, highlighted, when a round is in progress (§11.1).
- A fold-out, **"How we order events"**, in four short sentences:
  - the game follows the order the Bible gives;
  - absolute dates are reconstructions, and scholars' systems differ;
  - every event has a window wide enough for those systems;
  - a set is only dealt when its order is certain on every one of them, or a verse states it.
- A back link to the games hub.

### 10.2 Sort

- Header: mode, puzzle number or level and era, and tries used (Daily: four small dots).
- "Earliest" above the list, the cards, "Latest" below.
- A one-line hint the first time: "Drag a card by its handle, or tap a card and then where it goes."
- **Check**, full width at the bottom and sticky on phones. Disabled until the order has changed since the last Check (Daily), or until the player has moved at least one card (Practice), so a round can't be submitted by accident in its dealt order.

### 10.3 Between Daily tries

The same screen, with the marks of §7.1 and the result line. The tries already used are listed underneath as rows of small squares, as on the share grid.

### 10.4 Reveal

As §8.3. On a phone it is a full page that scrolls; on wide screens it sits beside the sorted list.

### 10.5 Daily done

Result ("Solved in 3/4"), **Share**, streak, best streak, the distribution of tries, a countdown to the next puzzle, and **Practice now**. Reopening the game later the same day goes straight here.

### 10.6 Look

Its own `timeline.css`, using the site's tokens, light and dark, following the existing games ([whos-older.css](Jarvis/Projects/BibleProject/Website/src/pages/games/whos-older/whos-older.css), [map-quest.css](Jarvis/Projects/BibleProject/Website/src/pages/games/map-quest/map-quest.css)). Cards use the "history" book colour of its hub picture. Ticks, links and stars always come with text or an icon, never colour alone.

---

## 11. Saving and sharing

### 11.1 Saved in the browser (`bp-timeline`)

```jsonc
{
  "version": 1,
  "stamp": "…",                                  // timeline.json's stamp when saved
  "daily": { "results": { "12": { "tries": [["exodus", "…"]], "solved": true } }, "streak": 3, "best": 5 },
  "practice": { "level": "medium", "era": "all", "bestPerfect": { "easy": 4, "medium": 2, "hard": 0 }, "recent": ["exodus", "…"] },
  "round": { "mode": "practice", "dealt": ["…"], "order": ["…"], "checked": false }   // the round in progress
}
```

- A round is saved **when it is dealt** and after every move and Check. A reload brings back the same cards in the same order, and cannot re-deal a hard set or undo a try. Who's older? learned this.
- A saved Practice round whose stamp no longer matches the data is dropped, and a fresh one is dealt; stats are kept. **Daily results are never dropped**: a past day's cards come from `daily.json`, and retired events still display (§4.7).
- `recent` holds the last 60 events seen, for the "seen least" weighting in dealing (§5.2).
- If storage is unavailable (private mode, full), the game plays normally without saving and never shows an error.
- A Daily opened before midnight stays that day's puzzle until it is finished or the page is reloaded, so midnight never swaps the cards under a player. The next reload shows the new day.

### 11.2 Share (Daily only)

No event names or spoilers, one row per try, 🟩 for a card in its right place and ⬜ otherwise:

```
Timeline sort #12 3/4
⬜🟩⬜⬜🟩⬜
🟩🟩⬜🟩🟩⬜
🟩🟩🟩🟩🟩🟩
bibleguide.io/games/timeline
```

`shareText` is this game's own, in `timeline/share.ts`. Sharing itself goes through Map quest's generic `shareResult` ([share.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/map-quest/share.ts)), imported and not edited, as Who's older? does: phone share sheet, else clipboard, else a select-and-copy box. Practice has no share; a perfect streak shows a short celebration instead, with no motion under reduced motion.

---

## 12. Files (for step 9)

| File | Change |
|---|---|
| [src/data/timeline/](Jarvis/Projects/BibleProject/Website/src/data/timeline/) `events.source.json`, `facts.source.json`, `contested.source.json` | new, hand-kept |
| [src/data/timeline/](Jarvis/Projects/BibleProject/Website/src/data/timeline/) `timeline.json`, `daily.json` | new, generated |
| [build-timeline.ts](Jarvis/Projects/BibleProject/Website/scripts/build-timeline.ts) | new: runnable with `node --experimental-strip-types` |
| [review-sheet.md](Jarvis/Projects/BibleProject/Website/docs/features/timeline-sort/review-sheet.md) | new, generated |
| `src/pages/games/timeline/TimelineGame.tsx` | new: the page, default export; `?play=daily|practice` reopens a mode, as in Map quest |
| `src/pages/games/timeline/order.ts` | new: `link`, `explain`, `validRound`. Shared with the build |
| `src/pages/games/timeline/deal.ts` | new: Practice dealing and shuffling (§5.2) |
| `src/pages/games/timeline/daily-rules.ts`, `daily.ts` | new: the day rules (shared with the build) and today's puzzle with its fallback |
| `src/pages/games/timeline/scoring.ts` | new: slot ticks, joins, pairs in order, stars |
| `src/pages/games/timeline/sortable.ts`, `useSortable.ts` | new: the pure `move` and the pointer, tap and keyboard handling |
| `src/pages/games/timeline/storage.ts`, `share.ts` | new |
| `src/pages/games/timeline/SortList.tsx`, `Reveal.tsx`, `Screens.tsx`, `timeline.css` | new: the screens |
| [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) | **only** the `timeline` entry: `status: "live"`, `load: () => import("./timeline/TimelineGame")`. Title, description, shelf and art unchanged |
| [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx) | **only** the "not built yet" test: pick a coming-soon slug from `GAMES` instead of `/games/timeline` (§13) |
| [README.md](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) (games) | add a short "Timeline sort" section like the others |

No change to shared components, the router, the menu or other games' files, apart from the one hub test above. The imports from Who's older? (`yearsBetween`, `checkYear`) and Map quest (`shareResult`, date helpers, `mulberry32`) are read-only.

---

## 13. Tests (for step 9)

- **order.test.ts:** every row of the §5.3 verdict table, including the "never together" rows. Windows that touch (`hi == lo`) are not certain. Open edges never prove order. Two `shown: false` events with separate windows but no fact are not certain. A contested pair beats a fact. Two-step explanations prefer facts. `validRound` accepts a chain and rejects a set with one uncertain join.
- **scoring.test.ts:** pairs in order for B C D E F A against A–F (10 of 15); the reversed order scores 0; star thresholds; slot ticks and joins for a shifted block (no ticks, four joins).
- **sortable.test.ts:** `move` up, down, to both ends and onto itself; a cancelled drag leaves the order unchanged.
- **deal.test.ts:** with a fixed seed, every dealt round at every level and era is valid; card counts by level; tier filters; Easy's 200-year rule; the shuffle never starts sorted and has at most one card in its right slot; widening announced when an era is thin.
- **daily.test.ts:** the frozen first days match `daily.json`; the day rules hold over the whole file and 365 fallback days; no repeat within 28 days; puzzle numbers across daylight-saving changes in three time zones (as Wordle's tests do).
- **data.test.ts** (on the generated file): ids and labels unique; label length; windows valid, no year 0; `shown: false` before Abram's call; facts agree with windows; no loop; contested pairs uncertain; every quote non-empty; every era and level can deal 200 rounds; the generated file matches its sources' stamp. **An independent second check**, written separately from `order.ts`: for 2,000 random dealt rounds, every consecutive pair is joined by a chain of at most two direct links through pool events, each link being a fact or windows that share no year (never windows between two `shown: false` events), and no pair in the round is contested.
- **storage.test.ts:** a reload mid-round brings back the same cards and order; a Daily try cannot be undone by reloading; an old stamp drops the Practice round but keeps stats and Daily results; storage unavailable means no crash.
- **TimelineGame.test.tsx:** start, play a Daily with the keyboard (pick up, move, drop, Check), see the marks, solve, see the reveal with a verse link, share falling back to the copy box; the tap-to-move route moves a card; Check is disabled for an unchanged order.
- **[games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx) needs one small change.** Its test "sends the address of a game not built yet back to the hub" opens `/games/timeline`, which stops being true the moment Timeline sort goes live. Change only that test, to take the first coming-soon slug from `GAMES` instead of naming one, so it also survives the later games in this chain going live. Everything else in that file covers the new entry as it is.
- Run the site's tests and build. **Never deploy.**

---

## 14. Cost

- **Runtime:** none. No model, no API, no new service, no new npm dependency. Static JSON in the site bundle, loaded only on the game's page.
- **One-time:** curating about 220 events, their windows and about 250 facts is reading work for the build step, from Scripture plus the existing people windows and reign tables. **No model batch is required.** If the build step wants a cheap model to draft `dating` lines, that is under 250 short calls. It must run under the batch rules ([BatchRunner](Jarvis/Tools/BatchRunner/README.md)), with a pilot and the owner's approval first. This design does not need it.
- **Licences:** the reign dates and people windows are the site's own research. BSB quotes are already used site-wide. Robertson's harmony is public domain. Theographic is read only by the build's cross-check and never shipped.

---

## 15. Edge cases

| Case | Handling |
|---|---|
| Order honestly unknown (Job's trials and the Exodus) | Never dealt together: no `explain` reason, so `validRound` fails (§5.1). |
| Order disputed by scholars (Ezra and Nehemiah) | On the contested list. Never together, and the build fails if a fact would make it certain (§4.5). Both cards' `dating` lines name the dispute. |
| Date disputed but order not (the Exodus, Jesus' birth, Patmos) | A wide window. Used freely, with the dispute named in the reveal. |
| Dating systems disagree (Solomon's fourth year: 1012, 968 or 959 BC) | The window spans them all, and the reveal shows "about 1012–959 BC". |
| Book order is not time order (Judges 17–21) | Order comes from windows and facts, never from book position; contested where unclear (§3.2). |
| Same moment told twice ("Jesus dies" / "the curtain tears") | Only one card exists (§3.3). |
| Two cards that sound alike (David anointed three times) | Distinct labels, and the build fails on duplicates or near-duplicates (§3.1). |
| Early Genesis with no real years | `shown: false`: no years printed, no year axis in that reveal (§8.3). |
| An event removed after launch | Retired, not deleted; past Daily puzzles still show it (§4.7). |
| Data changed after a schedule was built | Frozen 14 days ahead; past days never change (§6.1). |
| Past the end of `daily.json` | Seeded fallback with the same rules (§6.1). |
| Midnight while playing | The open puzzle stays until finished or reloaded (§11.1). |
| Reload mid-round | Same cards, same order, same tries used (§11.1). |
| Storage unavailable | Plays without saving, no error. |
| Drag interrupted (call, notification, gesture taken) | `pointercancel` returns the card to its start (§9.2). |
| Finger meant to scroll the page | Card bodies scroll unless held 300 ms; the handle always drags (§9.2). |
| Long-press opens the copy menu on iOS | Suppressed on cards (§9.2). |
| Phone held sideways, Hard round taller than the screen | Auto-scroll near the edges (§9.2). |
| Cannot drag at all (motor impairment, switch access) | Tap-to-move and the keyboard (§9.3–9.4). |
| Double tap on Check | Disabled while a check is processed, and for an unchanged order. |
| Dealt order happens to be right | Impossible: the shuffle forbids a sorted start (§5.2). |
| Reduced motion | No slide, lift or celebration animation; cards jump. |
| Translated site | Labels, dating lines and reasons are English in every language. This is the same known gap as the other games, and the help panel says so. |

---

## 16. Decisions for the owner, and later ideas

**Decisions, none blocking the build:**
- **Four tries for the Daily.** The comparable games use three to six. Four with ticks and joins should let most players finish in two or three.
- **Whether Job's trials and John's vision on Patmos belong in the pool.** Both are used only with far-away events, and their cards say plainly how uncertain their dates are.
- **Whether to read the review sheet before launch.** It lists every event, window, fact and contested pair in plain words.

**Later, not in this version (left out to keep the scope small):**
- An **Endless** mode in the Timdle and Wikitrivia style: insert one card at a time into a growing line, until three misses.
- A **family pass-the-phone** mode, with several players taking turns on one round.
- Past Daily puzzles (an archive).

---

## Review (sequence 30, step 8, 2026-11-07)

One critical review against the approved spec (idea 13), [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md) and the real codebase. I checked these against the files themselves: the registry entry, the exports of Who's older?'s `pairing.ts` and Map quest's `daily.ts`, `daily-rules.ts` and `share.ts`, the reign dates on the people-pages, the Who's older? windows, the `/contact` route, the `?hl=` verse-link form, Theographic's Jair and Nimrod rows, the `framer-motion` version, and the hub tests. Every correction below has already been made in the body above.

**Problems that would have broken the build or the game**

1. **The hub's own test would have failed.** [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx) checks that a game not built yet sends you back to the hub, using `/games/timeline` as its example. The design said that file needed no change. It does: §12 and §13 now tell step 9 to change only that one test, so it takes any coming-soon game from the registry.
2. **The Exodus example broke the design's own rule.** Its window (1491–1210 BC) was narrower than its anchor, Moses' window plus 80 years (1495–1208 BC). The build's check that an anchored window must contain its anchor would have failed on the worked example. It is now 1495–1208 BC. Jericho moves with it (1455–1168 BC), and the gaps that depend on them are corrected: Jericho to David is 113 years, not 115, and the Exodus to the temple is 196, not 198. "Joseph is sold into Egypt" is now Joseph's own window plus 17 (1945–1445 BC), as §2.5 already promised.
3. **Samaria's fall was dated too narrowly.** Hoshea's page ends his reign in 724 BC under Albright, so the window is 724–721 BC, not 723–721. A window narrower than the sources is the one mistake §4.3 forbids, because it could deal a set with no certain answer.
4. **Job's window was borrowed from the wrong thing.** The −650 limit is Who's older?'s bound on Job's *birth*. His trials came later in his life, so their window now runs to about 593 BC, Ezekiel's day.
5. **Long-press dragging would not have worked on phones.** On a card body that lets the page scroll, the browser takes the first movement after the long-press as a scroll and cancels the drag. §9.2 now adds a listener that holds the page still only once the long-press has armed, requires a test on real iPhone and Android browsers, and says to drop long-press rather than ship a broken one. The drag handle and tap-to-move are unaffected.

**Gaps in the dating rules**

6. **Not every king's page carries every dating system.** David's page has no Albright dates and Hoshea's has no `other`, so "date it in every system on the page" could quietly produce windows that are too narrow. §4.3 now has the build fill a missing system from the neighbouring ruler where the Bible links them, or warn so that the window is widened by hand. The David row shows how.
7. **Early-Genesis windows are made up**, so they must never prove an order on their own. Between two early-Genesis events only a verse now counts (§4.3, §5.1, a new test in §13). The Daily's "not too close" rule also ignores their invented gaps (§6.1).
8. **Two-step reasons need a real middle card.** The Jericho-to-Gideon example goes through Joshua's death, so "Joshua dies" must be an event in the pool (§5.3). The independent data test in §13 now accepts the mixed verse-plus-dates chains the game itself allows, instead of rejecting them.

**Smaller corrections**

9. The Solomon row listed his accession years as if they were his fourth year. The window was right; the explanation now gives both (§5.3, §15).
10. The Daily schedule file is about 150 KB raw, not 40 KB. It now follows all of Wordle's reviewed schedule rules: it records when it was built and how far it is frozen, the freeze margin can be changed, and a rebuild after the file has run out keeps the days browsers already worked out for themselves (§6.1).
11. Node runs the build script without bundling, so game files the build shares may only import other files by relative path with `.ts` on the end. Map quest's `daily.ts` is game-only for that reason. The build should reuse Who's older?'s data loaders rather than write new ones (§4.1).
12. Tap-to-select and the keyboard's pick-up now share one "lifted" state, since Enter on a button also fires a tap. The list is an ordered list of items, each holding a button (§9.3, §9.4). Auto-scroll now keeps the card under the finger while the page moves (§9.2).

**Checked and left as written**

- The spec's examples include "David's reign". The design turns spans into single moments ("David is made king at Hebron"), because "before" is unclear when spans overlap. That keeps the spec's intent and does not override a decision by the owner.
- No running cost, BSB quotes only, reuse of the site's data, changes limited to the game's own files plus its registry entry, and "never deploy" all match the rules. The long-list rule does not apply, since a round has at most seven cards.
- The three decisions left for the owner in §16 still stand, and none of them blocks the build.
