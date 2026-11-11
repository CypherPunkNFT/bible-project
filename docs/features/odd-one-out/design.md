# Odd one out — design

**Status:** draft from the research & design step (job 717, 2026-11-07), reviewed once and corrected in place by the review step (2026-11-07, see §17 Review). Implemented and live on the games hub (implement step, 2026-11-07, see §18 Implementation notes).
**Spec (binding):** [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md), entry 23: *"Four items (e.g. Peter, John, Paul, James); find the one that doesn't belong and see why (Paul — the only one not with Jesus during his ministry)."*
**Shared rules:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md). No model runs while people play, existing site data is reused, Scripture is quoted from the Berean Standard Bible (BSB), the game registers on the /games hub, only this feature's files are touched, and nothing is deployed.
**Slug:** `odd-one-out`. **Route:** `/games/odd-one-out`.

---

## 0. Summary

The player sees four Bible people, places or books and taps the one that doesn't belong. The answer is then shown with the reason, a one-line fact for each of the four, verse references, and links into the site's own person, place and book pages.

All puzzles are built **once, ahead of time**, by a deterministic Python script. The script reads the site's existing people, rulers, apostles, prophets, places, letters and book data, plus a small hand-curated facts file. It writes one JSON file that ships with the site. Nothing is generated while people play, and the core build uses **no language model at all**: the explanations are filled in from hand-written phrases and site data.

The hard part is making sure **only one answer is defensible**. The design rests on four ideas:

1. Every item gets a fact sheet listing many properties, including obvious surface ones such as "the only woman" or "the only one whose name starts with a different letter".
2. A candidate set is rejected if **any** property singles out a different item.
3. Unknown facts count against the set, never for it.
4. A second, independent solver in the test suite re-checks every shipped set.

A quick prototype on the real data (§5.6) showed why sets must be **built around a near-miss item** rather than sampled at random. Random sampling kept 7 of 920 sets, and those were poor puzzles. Construction around a near miss kept 201 of 439 attempts.

---

## 1. What the spec fixes, and what this design decides

| Spec says | Design decision |
|---|---|
| Four items | Always exactly four, all of the **same kind** (all people, all places or all books). Mixing kinds would make "the only place" a second answer. |
| Find the one that doesn't belong | One tap answers. No second guess and no timer: the game is family-paced and teaching-first (§9). |
| …and see why | Every set carries a headline reason, a one-line fact with a verse reference for each item, a key verse quoted in BSB, and links to the site's pages (§7). |
| The example: Peter, John, Paul, James → Paul | This exact set is in the curated set list. It is the first puzzle a new player sees on Easy People, and it doubles as a test fixture (§12). |
| (Brief) built once ahead of time from tagged people/places/books data | One build script, run by hand. Its output is committed. A `--check` mode proves the output is current (§5). |
| (Brief) guard against sets with more than one valid answer | The uniqueness checks in §6 are layered: construction-time rejection, the conservative handling of unknowns, a separate test-suite solver, a review sheet the owner can skim, and a veto list. |
| (Rules) no runtime model cost | No model at runtime. The core build uses none either. An *optional* extra check by a cheap model is designed in §6.6, but it is not part of the implement step and needs the owner's yes first. |

---

## 2. Research

### 2.1 The puzzle form

- **Psychometric "classification" items.** Verbal-reasoning tests (school entrance exams, Mensa-style tests) have long used "which word is the odd one out?". Good items have one category that three share and that clearly excludes the fourth. Bad items are the ones test-prep forums argue about: a solver finds a second, equally valid category. The classic weakness of the form is that **any four things differ in many ways**.
- **Colton, "Automated Puzzle Generation" (AISB 2002).** This is the founding paper on machine-made odd-one-out puzzles. It generated them, along with analogy and next-in-sequence puzzles, from a theory-formation system over structured data. Its central technical problem is exactly ours: a puzzle **should have only one plausible answer**, and the generator has to search for alternative answers and discard sets that have them. Its worked example: in a number set, 18 is odd because the others are square numbers, but another number is odd for a different reason, so the set is ambiguous. *Lesson:* uniqueness has to be checked against a broad, deliberately over-inclusive set of properties, not only the intended one.
- **Pintér et al., "Automated Word Puzzle Generation via Topic Dictionaries" (2012).** This work builds odd-one-out sets from coherent concept groups, then adds a weakly related intruder. It rates each set by its *least-related member*, because one member that is too weakly connected to the rest makes a puzzle ambiguous. *Lesson:* the three "belonging" items must be **tightly** grouped, and the odd item must be **close but outside**. A random outsider is too easy, and a weak member creates rivals.
- **Hebart et al., THINGS odd-one-out (Nature Human Behaviour, 2020).** This study collected about 1.5 million human "odd one out of three" judgements to map how people judge similarity. People pick whichever difference is **most salient to them**, often a visual or surface one rather than the "intended" category. *Lesson:* surface properties (only woman, only New Testament, only one with a book named after them, first letters) are the ones players reach for first. They must always be checked, even though they never make good headline reasons.
- **"Which One Doesn't Belong?" (Christopher Danielson, 2016; wodb.ca).** This maths-education book designs every set so that **each of the four** can be defended, to spark argument. That is the opposite of what we want, and it confirms how easily four items yield four answers. *Lesson:* uniqueness has to be engineered. It never happens by accident.
- **NYT Connections (Wyna Liu, 2023–).** Sixteen words go into four groups of four, with deliberate *red herrings*: words that seem to belong to a group but don't. Each board is hand-built from a notebook of category ideas, and another editor reviews it. Players get angry when two groupings are both valid, and the game's answer screen names each category. *Lessons:* (a) red herrings make Hard mode fun, as long as the true answer stays unique. (b) Naming the category afterwards is what makes the moment satisfying. (c) Even hand-made puzzles get a second reviewer, which is why this design adds an owner review sheet and veto list.
- **TV quizzes.** BBC *Odd One Out* (1982–85) and the connections rounds of *Only Connect* show the "reveal the link" beat the spec asks for: the explanation is the payoff, not an afterthought.

### 2.2 What the research means for this game

1. **Build sets, don't sample them.** Start from a meaningful category, pick an outsider that is a *near miss*, then pick three members so that nothing else stands out (§5.4).
2. **Over-check, under-explain.** Check rivals against every property we can compute, including silly surface ones. Use only meaningful, curated categories as the explained reason.
3. **Treat unknowns as dangerous.** A missing fact must never let a set through (§6.2).
4. **Make the reveal the reward.** Name the category, show why each member fits, and link to learn more (§7).
5. **Add a human pass.** The script writes a review sheet, and the owner can veto any set by its id (§6.5).

---

## 3. Site data reused

| Source (all existing) | What it gives this game |
|---|---|
| [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) | 3,133 people: name, other names (`o`), a one-line description (`b`), mention count (`c`, used for fame), period (`p`), group flag (`g`, marks peoples rather than persons). |
| [data/study/people/](Jarvis/Projects/BibleProject/Website/data/study/people/) (one file per person) | Sex (`s`), testament/era (`e`), tribe or nation (`t`), role phrase (`d`: "King / Prophet / Apostle / Judge / Priest / Levite / Warrior … living at the time of …"), parents, siblings, spouses and children ids, books the person appears in with counts (`k`), and verse references (`refs`). |
| [src/data/people-pages/](Jarvis/Projects/BibleProject/Website/src/data/people-pages/) | Curated groups with display names, for example: kings of Israel and of Judah (with realm and house), the judges, the Herods, Rome, Persia, Assyria and Babylon, Egypt, the united kingdom (Saul, David, Solomon), the Twelve, Paul's companions, the Jerusalem church, and seven prophet groups. **These are the main source of headline categories for people.** |
| [src/data/apostle-pages/](Jarvis/Projects/BibleProject/Website/src/data/apostle-pages/) | The Twelve plus Matthias and Paul, with story entries, places and companions. Paul's file lists the places on his journeys. |
| [prophets.json](Jarvis/Projects/BibleProject/Website/data/study/prophets.json) | 64 prophets, each marked as a prophet, a writing prophet, a New Testament prophet or a false prophet. |
| [people-slugs.json](Jarvis/Projects/BibleProject/Website/src/data/people-slugs.json) | Readable person addresses such as "james-son-of-zebedee", used for links and for disambiguated labels. |
| [places.json](Jarvis/Projects/BibleProject/Website/data/places.json) | 1,252 places: type (settlement, region, mountain, river, island, body of water…), coordinates, a location confidence score, and the verses where each is named. |
| [data/places-by-book/](Jarvis/Projects/BibleProject/Website/data/places-by-book/) | Places named in each book. |
| [catalog.json](Jarvis/Projects/BibleProject/Website/data/catalog.json) | The books with their sections (history, poetry, prophets, gospels, epistles, revelation, apocrypha). |
| [letters.json](Jarvis/Projects/BibleProject/Website/data/study/letters.json) | 21 letters, with the name each opens in and its recipients. |
| [data/text/bsb/](Jarvis/Projects/BibleProject/Website/data/text/bsb/) | BSB text, for key-verse quotes and for chapter counts ("one-chapter books"). |
| [bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) | Not a source of sets. Its `people` and `places` tags are used only as a **fame signal**: an item that is asked about in the question bank is one players know. *(Review: these tags are display names such as "Paul" or "Mary", not ids. A tag counts only when it matches the name of exactly one person or place in the pool; "Mary", "James", "Antioch" and the like are ignored.)* |

**Never use** the per-person `story`, `article` or `short` text in the game: it quotes the KJV. Explanations use only the one-line `b` brief, the rule phrases and the BSB key quote. The build reads the one-file-per-person folder in the working tree; release builds pack those files (see the site's AGENTS.md), which does not matter here because the game ships only its own generated JSON.

The twenty-questions game (entry 16) will one day build a full character-tag table, but in chain A it comes after this game is built. **This game must not depend on it.** If that table exists later, its tags can be added to the fact sheet as more rival checks, which is cheap to do.

---

## 4. Content model

A set has four items, one odd item, one **rule** (the reason) and a **polarity**:
- `members-share`: the three share the rule and the odd one lacks it. For example, three are kings of Judah and one is a king of Israel.
- `odd-only`: only the odd one has the rule. For example, the only woman, or the only one who is a river.

The shipped file is `src/data/odd-one-out/sets.json`. It is generated, and its header says "do not edit":

```jsonc
{
  "about": "Odd one out sets. Generated by scripts/build-odd-one-out.py; do not edit.",
  "version": 1,
  "stamp": "<hash of inputs>",               // changes only when inputs change
  "rules": {
    "followed-jesus": {
      "kind": "person",
      "members": "followed Jesus during his ministry",                       // used for members-share
      "odd": "was not with Jesus during his ministry",                       // the odd item's line
      "keyRef": [40004018, 40004022],
      "keyQuote": "As Jesus was walking beside the Sea of Galilee, he saw two brothers, …"  // BSB, filled in at build time
    },
    "the-twelve": {
      "kind": "person",
      "members": "were among the Twelve Jesus chose",
      "odd": "was not one of the Twelve",
      "keyRef": [40010002, 40010004],
      "keyQuote": "These are the names of the twelve apostles: first Simon, who is called Peter, …"
    }
  },
  "items": {
    "peter-mat-4-18": { "kind": "person", "label": "Peter", "brief": "Apostle of Jesus, leader in the early church",
                        "href": "/people/peter", "ref": 40004018 }
  },
  "sets": [
    { "id": "ooo-3f9a2c", "kind": "person", "difficulty": "easy",
      "items": ["peter-mat-4-18", "john-mat-4-21", "paul-act-7-58", "james-mat-4-21"],   // stored order; the game shuffles
      "odd": "paul-act-7-58", "rule": "followed-jesus", "polarity": "members-share",
      "labels": { "john-mat-4-21": "John", "james-mat-4-21": "James" },   // seed sets only: per-set display labels (§6.4)
      "facts": { "peter-mat-4-18": [40004018], "john-mat-4-21": [40004021], "james-mat-4-21": [40004021], "paul-act-7-58": [44009001] },
      "also": ["the-twelve"] }                 // other properties that single out the SAME odd item (§6.3)
  ]
}
```

(The verse ids in this example are illustrative; the build fills in the real ones.)

- **Set ids** are a short hash of the rule, the polarity and the sorted item ids. They stay the same across rebuilds, so the "already seen" record in the player's browser survives a data refresh.
- `items` and `rules` are stored once and referenced by id, which keeps the file small. At about 420 sets the file should be around 150–250 KB raw and much smaller compressed. It is loaded with a dynamic import only on the game route, so it never adds weight to other pages.

---

## 5. Building the sets (once, ahead of time)

**Script:** `scripts/build-odd-one-out.py`, Python 3.12, the same style as the site's `build-people-pages-index.py` family. Commands:
- `py -3.12 scripts/build-odd-one-out.py` writes `src/data/odd-one-out/sets.json` and `docs/features/odd-one-out/review-sheet.md`.
- `py -3.12 scripts/build-odd-one-out.py --check` exits non-zero if the committed output differs from a fresh build.

**Curated inputs** live beside the script in `scripts/odd-one-out/`:
- `rules.json`: the rule catalogue (§5.3), with the hand-written phrases, tier, kind, source and key verse for each rule.
- `facts.json`: a small set of hand-curated facts the site data does not hold. Every fact carries verse references. Examples: who followed Jesus during his ministry, the seven churches of Revelation, the Philistine cities, the books of the Law, the four Gospels, books named after a person, Old Testament people a book is named after, and qualified labels for same-named people and places.
- `veto.json`: set ids the owner has rejected, each with a one-line reason.
- `seed-sets.json`: hand-written sets that must ship, starting with the spec's own example. They still go through every check.

The build is **deterministic**: a fixed random seed and sorted inputs, so the same inputs always produce the same file. It is not added to `prebuild`, and `package.json` is not changed (shared file, see the rules). The implement step runs it by hand and commits the output. The vitest suite guards the output (§12).

### 5.1 The item pool (who and what may appear)

**People:**
- Not a group (`g` unset), and not Jesus or God. Unnamed people ("a wife of Peter") are excluded.
- At least one of: a mention count at or above the fame line for the difficulty (§8), membership of a curated people-pages group, or a mention in the question bank.
- Known **aliases are merged**. The site stores Jacob under the name "Israel" (`israel-gen-25-26`, other names include "Jacob"), so the label must read **Jacob**. A small `labels` override table in `facts.json` covers such cases, and the build fails if a label override names an id that doesn't exist.

**Places:**
- Mentioned in at least 3 verses (Easy needs 15 or more).
- Gates, roads, pools, campsites and structures are excluded as too obscure.
- **Same-named places** (120 names occur more than once, for example Antioch, Samaria the city and the region, Galilee, Babylon, Aphek) get the same treatment as same-named people (§6.4): never two in one set, and a place whose name is shared appears only with a qualified label from `facts.json` ("Antioch in Syria"), or not at all.

**Books:**
- The 66 books of the Protestant canon. The Apocrypha is excluded, because whether those books belong is itself a matter of tradition.

### 5.2 The fact sheet (properties per item)

Every property is **tri-state**: true, false or unknown. Each one has a **tier** (how likely a player is to think of it) and a **use**: `rule` means it can be a headline reason, and it is always also used for rival checks; `rival` means it is only used for rival checks.

| Kind | Property | Tier | Use | Derived from |
|---|---|---|---|---|
| person | woman | 1 | rule | `s` |
| person | Old vs New Testament | 1 | rule | `e` |
| any | a Bible book bears this name ("John", "James", "Peter", "Ruth", "Timothy") | 1 | rival | the shown label's first name vs catalogue book names; always known, no claim about who wrote what |
| person | an Old Testament book is named after them | 2 | rule | `facts.json`, only where the book's title plainly names that person (Joshua, Ruth, Ezra, Nehemiah, Esther, Job, the prophets); **unknown** for everyone else, so it never rests on who wrote a New Testament book |
| person | king/queen, prophet, apostle, judge, priest | 1 | rule | `d` role word + people-pages groups |
| person | one of the Twelve | 1 | rule | apostle pages (the Twelve only, not Matthias or Paul) |
| person | followed Jesus during his ministry | 2 | rule | `facts.json` (the Twelve + named disciples, with verse refs) |
| person | king of Israel (north) / king of Judah | 2 | rule | people-pages rulers (`realm`) |
| person | a Herod, a Roman ruler, a Persian king, a king of Assyria/Babylon, a Pharaoh | 2 | rule | people-pages ruler groups |
| person | a writing prophet | 2 | rule | prophets.json `kind` |
| person | son of Jacob; child of David; child of Zebedee; sibling of X | 2 | rule | family links (`pa`, `ch`, `si`). **Skipped for a set that contains X itself** (§6.1) |
| person | Paul's companion | 2 | rule | people-pages "Paul's companions". Skipped for a set that contains Paul |
| person | era (Patriarchs … Exile and Return) | 2 | rival | `e` |
| person | tribe | 3 | rival | `t` (blank, which is 1,639 of 3,133 people including Peter, John, James and Paul, or marked "(?)" become unknown) |
| person | named in the Gospels / Acts / the Law / Genesis | 3 | rival | `k` |
| person | non-Israelite (Edom, Egypt…) | 2 | rival | `t` |
| any | first letter of the label (three share it, one differs) | 1 | rival | label |
| any | label carries a qualifier ("James, son of Zebedee") | 1 | rival | label (§6.4) |
| place | settlement / region / mountain or hill / river / island / sea or lake | 1 | rule | `type`, with `mountain`, `hill` and `mountain range` merged into one class and `body of water` read as sea or lake. The data types Mount Zion, the Mount of Olives and Golgotha as hills, and Zion (148 verses) as a settlement, so a split such as "the only hill" would mislead |
| place | label word: "Mount", "Sea", "River", "Valley", "Wilderness" | 1 | rival | the shown label |
| place | one of the seven churches of Revelation | 2 | rule | `facts.json` (Rev 2–3) |
| place | a Philistine city | 2 | rule | `facts.json` |
| place | on Paul's journeys | 2 | rule | Paul's apostle-page places |
| place | named only in the New / only in the Old Testament | 2 | rule | `verses` |
| place | outside the land of Israel | 2 | rival | coordinates; **unknown** when confidence is below 0.5 |
| book | Old vs New Testament | 1 | rule | catalogue |
| book | a Gospel; a book of the Law; a prophet book; a poetry book; a history book | 1 | rule | catalogue sections, except that the **Gospels** (the four) and the **Law** (the five) come from `facts.json`: the catalogue files Acts under its `gospels` section |
| book | a letter that opens in Paul's name | 2 | rule | letters.json (the site's careful wording, not claims about who wrote it) |
| book | a one-chapter book | 2 | rule | BSB chapter count |
| book | named after a person | 2 | rule | `facts.json` |
| book | letter to a church vs to a person | 2 | rule | letters.json `recipients` |

Properties with many values (era, tribe, place type, book section) are checked as one yes/no property per value ("tribe is Judah", "era is Judges").

The table is the starting set for the implement step. The implement step may add properties freely, because more properties make the checks stricter. It may only add **rule** properties if they have hand-written phrases in `rules.json`.

### 5.3 The rule catalogue

Each `rules.json` entry has: `id`, `kind`, `tier`, `members` phrase, `odd` phrase, optional `oddOnly` phrase (for the `odd-only` polarity), `keyRef`, and `source` (the site file or `facts.json` key). A rule is only a headline if a person would accept it as a real biblical category. "Not named in the book of Acts" is a fact, but nobody would call it *the* reason. That is why book-appearance properties are rival-only.

The spec's example is the rule `followed-jesus` with the odd phrase "was not with Jesus during his ministry". The `the-twelve` rule ("was not one of the Twelve") gives the same answer for that set; it goes in the set's `also` list and is shown as the "also true" line (§6.3). Note that **"named in the Gospels" is not the same rule.** James the brother of Jesus is named in the Gospels (Matthew 13:55) but did not follow Jesus during his ministry (John 7:5). This is why that rule is curated with verse references rather than derived from where a name appears.

### 5.4 Construction (for each rule and polarity)

1. **Candidates.** Members are the items where the rule is true; outsiders are the items where it is false. Items where it is unknown are never used.
2. **Pick a near-miss odd item.** Rank outsiders by similarity to the members. Similarity is measured only over **rule-use** properties at tiers 1–2; surface properties are left out, because the prototype showed they otherwise pull every set towards four names with the same first letter. Easy takes an outsider from anywhere in the top half; Hard takes one from the top 10%. Hard sets therefore have a built-in red herring: the odd item shares most of the members' other properties.
3. **Pick three members.** From the members most similar to the odd item (top 12), try combinations of three in a seeded order and keep the first one that passes all checks in §6. If none passes, drop that odd item.
4. **Variety limits.** No item appears in more than 6 sets. No rule supplies more than 15% of a kind's sets. The same four items never appear twice under different rules (the first one built is kept).
5. **Seed sets** from `seed-sets.json` are checked the same way and **fail the build** if they don't pass. A hand-written set gets no exemption.
6. **Veto.** Ids in `veto.json` are dropped. The build fails if a vetoed id no longer exists, so stale entries get noticed.

**Targets:**

| Kind | Easy | Medium | Hard | Total |
|---|---|---|---|---|
| People | ~80 | ~80 | ~80 | ~240 |
| Places | ~40 | ~40 | ~40 | ~120 |
| Books | ~25 | ~25 | ~10 | ~60 |

The build prints the counts it actually achieved. **Minimum to offer a combination:** 20 sets, which is two rounds. Below that, the combination (for example Hard Books) is hidden from the start screen rather than repeating sets. "Mixed" draws from all kinds.

### 5.5 Explanations (template, not a model)

The headline and the lines are filled in from `rules.json` phrases plus the item's label and `brief`:
- **Headline, `members-share`:** "**Paul** was not with Jesus during his ministry. Peter, John and James were among the Twelve Jesus chose."
- **Headline, `odd-only`:** "**The Jordan** is the only river. Bethel, Hebron and Shiloh are towns."
- **Per-item line:** label, then the site's one-line `brief`, then the verse reference that proves the rule fact for that item (`facts[item]`, else the item's first reference). Each line links to the item's page.
- **Key verse:** `rules[rule].keyRef` (one short quote, at most two verses). The build checks the BSB holds it; the page shows its words from the reader's Bible through `<Verse>` (2026-11-07: the site's rule that data files hold verse ids, never wording, `scripts/check-verse-wording.py`, so `keyQuote` is no longer written).
- **"Also true":** when §6.3 finds tier-1 or tier-2 properties that single out the same odd item, one extra line names them: "Paul is also the only one who …". A player who chose the right item for a different reason is told they were right.

### 5.6 Prototype evidence (real site data, this job)

A throwaway prototype (kept in this job's own folder, not shipped) ran the checks above on 115 well-known, uniquely named people with about 25 derived properties.

| Approach | Tried | Kept | What the kept sets looked like |
|---|---|---|---|
| Random four (three members + any outsider) | 920 | 7 (0.8%) | Poor: for example Job as the "only non-apostle" next to Peter, Judas and Paul (too easy, and Job differs in ten other ways). |
| Built around a near-miss odd item (§5.4) | 439 odd items | 201 sets, across 14 rules | Mostly sound (for example Leah, Rachel and Rebekah with Lot as the only man). |

The prototype also exposed **four problems the design now handles:**
- **First letters skewed the sets.** When first letters counted towards similarity, sets drifted to four names starting with A ("Abijah, Ahaz, Asa, Abishai"). Surface properties are now used for rival checks only.
- **Weak headlines.** The prototype produced rules like "Adam is the only one not named in Acts". Book-appearance properties are therefore rival-only.
- **The same odd item stood out on several properties.** For example "Abijah, Ahaz, Asa + Aaron": Aaron is not a king *and* is from another era. The answer is unique, but the reason is not; §6.3 handles this.
- **Jacob appears under the name "Israel"** in the site data. Hence the alias and label table in §5.1.

---

## 6. Guarding against more than one valid answer

### 6.1 The core check (run on every candidate)

For a set {m1, m2, m3, odd} with intended rule R:
1. R must be **known** for all four items and must give the intended split.
2. Every other property Q of that kind (both uses, all tiers) is tried in **both directions**: the one item where Q is true while the other three are false, and the one item where Q is false while the other three are true.
3. If Q can single out any item **other than** the odd one, there is a **rival answer** and the set is rejected.
4. If Q singles out the odd item too, it is recorded in `also` (§6.3).
5. **Relations anchored on a member are skipped.** A property of the form "related to X" (sibling of X, child of X, companion of X) is not checked when X is one of the four. Otherwise every set holding two brothers fails: in the spec's own set James and John are brothers in the data, so "the only sibling of John" would single out James. Relations to someone outside the set ("child of Zebedee") are checked as normal.

### 6.2 Unknowns count against the set

*(Corrected in review.)* The draft treated every unknown as whichever value would create a rival. Applied literally, that rejects the spec's own set: the tribe is blank for Peter, John, James and Paul (and for 1,639 of the 3,133 people), so any of them could be "the only one from tribe X" by filling in the blanks, and a failing seed set stops the build. Nobody can name an answer from a fact that neither the Bible nor the data states, so the rule is now:

1. **The item being singled out must have a known value.** An unknown can never be the thing that makes an item stand out.
2. **Unknowns on the other three count against the set.** When checking whether Q singles out item X (known value v), each other item with an unknown value is assumed to have the opposite of v. If that lets Q single out a non-odd X, the set is rejected.
3. **Items with an unknown tier-1 fact are left out of the pool** for that kind (a person with no recorded sex, a place with no type), because a player could well know the missing fact.
4. For the **intended rule R**, all four values must still be known (§6.1, step 1).

Examples of unknowns:
- A tribe that is blank or marked "(?)" in the data.
- A place whose location confidence is below 0.5 (666 of the 1,252 places; 0.5 itself is the data's ordinary value and counts as known), which makes "outside the land of Israel" unknown.
- A person with no era (94 people).

This is still the main protection against gaps in the data: a gap next to a real difference can only *remove* a set, never let a doubtful one through.

### 6.3 Unique answer, but several reasons

If other properties at tiers 1–2 also single out the odd item:
- **Easy:** allowed. The headline uses the intended rule and the "also true" line names the others. The player's answer is right whatever their reason.
- **Medium:** at most one extra reason.
- **Hard:** none. The intended rule must be the *only* thing that singles out the odd item. This is what makes Hard sets clean and red-herring-rich.

### 6.4 Label and surface checks

- **No two items share a display name** in a set (Mary, James, John, Herod, Zechariah…; for places Antioch, Samaria, Galilee…). In generated sets each same-named person or place has a qualified label ("James, son of Zebedee") from the people slugs or the `labels` table.
- **Seed sets may set their own display labels.** A hand-written set can give a bare name where the other three make it clear, so the spec's example shows "Peter, John, Paul, James" exactly as the owner wrote it, not "John, son of Zebedee". The qualified name still appears in the reveal's per-item line. All label checks below run on the labels actually shown.
- **Qualifier check.** If exactly one label is qualified, or exactly one is bare, the qualifier itself becomes a rival ("the only one with a description"). The set is rejected unless that item is the odd one *and* the qualifier doesn't give the reason away.
- **No giveaway words.** A label may not contain a word from its rule's phrases, ignoring short common words ("the", "of", "a", "was", "one"). "John the Baptist" may not be the odd one in a rule about prophets or the Twelve; "Simon the Zealot" is fine. For places, "Mount Carmel" may not be the odd one in a "the only mountain" set.
- **First-letter check.** If three labels share a first letter and the fourth doesn't, that is a rival, unless the fourth is the odd one.
- **Alias collisions.** No item may be another item's alias. For example "Saul" (Paul) beside "Saul" (the king) is blocked by id and alias, not just by label.

### 6.5 Human review and veto

Every build writes `docs/features/odd-one-out/review-sheet.md`, one line per set: the four labels, the answer, the headline, the "also true" reasons and the set id. The owner (or a reviewer) skims it, and any set that reads wrong goes into `veto.json` with a reason. The rebuild drops it. Vetoes are by stable id, so they survive rebuilds. The review step of this sequence should read a sample of the sheet once the implement step has produced it.

### 6.6 Optional extra check by a cheap model (not in the implement step)

A language model asked "list every defensible odd one out among these four, with reasons" is a good adversary. It knows facts our fact sheet doesn't, such as "Moses is the only one who didn't enter the Promised Land". It is **optional**, and the core design works without it. If the owner wants it later:
- Run it through [BatchRunner](Jarvis/Tools/BatchRunner/README.md), as the batch rule requires. One minimal call per set, the cheapest model (Haiku), a pilot of 3 sets first, and a budget cap. The model output goes only into a list of flagged set ids for human judgement. It never edits sets automatically.
- **Size:** about 420 sets × roughly 600 input and 150 output tokens. That is a few hundred thousand tokens in total, a very small share of the Max plan. The exact figure comes from the pilot.
- It **needs the owner's explicit yes** under the cost rule before it runs, so it is listed under owner decisions (§15), not as an implement task.

### 6.7 The independent second check (in the test suite)

`src/pages/games/odd-one-out/sets.test.ts` holds a **separate TypeScript solver**. It does not read the rule, polarity or `also` fields. For each shipped set it recomputes, from a fact table the build writes alongside the sets, every item that some property can single out, and asserts that the answer is exactly one item. That item must equal `odd`. Because it is written independently of the Python checker, a bug in one is caught by the other. The fact table is stored in `src/data/odd-one-out/facts-table.json` as compact per-item, per-property values that keep all three states (true, false, unknown; two bitsets, "known" and "true", work), plus the anchor id of each relation property. It is imported only by tests. The solver applies the same unknown rule (§6.2) and the same anchored-relation skip (§6.1, step 5), written from the text of this design rather than ported from the Python.

---

## 7. What the player sees after answering

1. **Result banner**, with an icon *and* words (never colour alone): "Right!" or "Not quite: the odd one out was **Paul**."
2. **Headline reason** (§5.5).
3. **Four lines**, one per item, in the order shown: the label, the site's one-line brief, and a verse reference link. The odd item's line is marked.
4. **Key verse** in BSB, with its reference linking to the reader at that verse.
5. **"Also true"** line when there is one (§6.3).
6. **Next** button (and the Enter key). On the last set of a round, **See results**.

The links go to existing pages, in the forms the site already uses: people at `/people/<slug>` (slugs from people-slugs.json), places at `/study/atlas/map?place=<id>` (the `placeHref` form in [atlas-data.ts](Jarvis/Projects/BibleProject/Website/src/pages/study/hub/atlas-stage/atlas-data.ts)), and verses and books in the reader at `/read/bsb/<BOOK CODE>/<chapter>?hl=<verse>` (as the home quiz and the connections panel link). Links open in the same tab. Round progress is held in session storage, so pressing Back returns to the same set (§14).

---

## 8. Difficulty

| | Easy | Medium | Hard |
|---|---|---|---|
| Fame of items | People mentioned 60+ times, or in the question bank's people tags; places in 15+ verses | 20+ mentions or a curated group member; places in 6+ verses | 8+ mentions; places in 3+ verses |
| Rule tiers | Tier 1 rules, and the best-known tier 2 rules (the Twelve, kings of Judah) | Tier 1–2 | Tier 2 |
| Odd item | From the top half of near misses | Top quarter | Top 10% (red herring) |
| Other reasons for the same answer | Allowed | At most one | None |

Books are all well known, so book difficulty comes only from rule tier and near-miss strength. Hard Books may fall below the minimum; if so it is hidden (§5.4).

---

## 9. Game rules

- **A round is 10 sets** of the chosen kind (People, Places, Books, Mixed) and difficulty.
- **One tap answers.** Changing your mind is not possible. The reveal appears immediately.
- **Score:** 1 point per right answer. The round summary shows the score out of 10 and the best streak in the round. The best score for each kind and difficulty is kept on this device (local storage only, no account and no server).
- **No timer.** It is a teaching game for families and groups, and reading the reveal is the point.
- **Answer position:** the four items are shuffled for each showing with a random permutation, so the odd item is in each slot equally often (tested).
- **Freshness:** sets seen recently (stored by set id on this device, up to the last 200) are avoided until the pool for that combination runs out. Then the oldest seen come back first.
- **First run:** a new player's first Easy People round starts with the spec's example set (Peter, John, Paul, James), which teaches the game by example.
- **No sharing or daily mode.** The spec doesn't ask for them, so they are left out. A shared daily set could be added later from the same data.

---

## 10. Screens

Mobile first. Follows the site's existing Tailwind tokens and light/dark themes. The layout keeps the four choices fully visible on a 320 px wide screen.

1. **Start**
   - Title "Odd one out" and the line "Four names. One doesn't belong. Can you see why?"
   - Two rows of chips: **What** (People / Places / Books / Mixed) and **How hard** (Easy / Medium / Hard). Combinations with too few sets are disabled, with a short reason.
   - A **Play** button.
   - The best score for the current choice, if there is one.
2. **Puzzle**
   - Progress "3 of 10" and the score so far.
   - The prompt "Which one doesn't belong?"
   - Four large choice buttons in a 2×2 grid, or a single column below 360 px. Long names wrap and never truncate ("Chedorlaomer", "Maher-shalal-hash-baz").
   - A small kind label ("People") so Mixed rounds stay clear.
3. **Reveal** (on the same screen, below the grid, which scrolls into view)
   - The chosen button is marked right or wrong and the odd item is marked, using ✓/✗ icons plus words.
   - The explanation block from §7, then **Next**.
4. **Round summary**
   - The score, the best streak, and a list of the 10 sets. Each row shows the four labels, a ✓/✗ mark and the headline, and can be tapped to expand its full explanation again.
   - **Play again** (same choice) and **Change game** (back to Start).
5. **Can't load**
   - "The puzzles didn't load" with a **Try again** button. The game draws this screen itself when the dynamic import of the sets file fails; the site's `DataUnavailable` in [data.ts](Jarvis/Projects/BibleProject/Website/src/lib/data.ts) is an error class for failed data fetches, not a ready-made screen.

**Accessibility:**
- The choices are real buttons, and keys 1–4 select them.
- The result is announced through an `aria-live="polite"` region.
- Focus moves to the result heading after answering, and to the first choice on Next.
- Animations respect `prefers-reduced-motion`.
- The colour contrast meets WCAG AA in both themes.

---

## 11. Files

**New, this feature only:**
- `scripts/build-odd-one-out.py`, and the inputs `scripts/odd-one-out/{rules,facts,veto,seed-sets}.json`
- `scripts/tests/test_odd_one_out.py` (pytest, run by `npm run test:data`)
- `src/data/odd-one-out/sets.json` and `src/data/odd-one-out/facts-table.json` (generated)
- `src/pages/games/odd-one-out/OddOneOutGame.tsx` (the screens; a **default export, a React component with no props**, as the games README requires), `game.ts` (pure logic: round building, shuffling, scoring, freshness), `game.test.ts`, `sets.test.ts`, `odd-one-out.css`
- `docs/features/odd-one-out/review-sheet.md` (generated)

**Touched (one entry):**
- The games hub registry [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts). *(Corrected in review: the hub now exists, and `odd-one-out` is already listed there as coming soon.)* Following the [games README](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md), the implement step changes only that entry: `status: "live"` and `load: () => import("./odd-one-out/OddOneOutGame")`, keeping its title, description and audiences. The hub then serves the game at `/games/odd-one-out` by itself. **No change to App.tsx, the menu or the hub page**, and no change to [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx), whose counts follow the registry.

---

## 12. Tests

All tests run under `npm test` (vitest) unless marked pytest.

**`sets.test.ts`** checks the shipped data:
- Every set has 4 distinct ids, all of one kind, and every id exists in `items`.
- `odd` is one of the four, `rule` exists, and there are no duplicate set ids or duplicate quads.
- No two labels in a set are the same.
- Every fact reference is a valid verse id.
- Every kind and difficulty combination that is offered has at least 20 sets.
- The independent solver (§6.7) finds exactly one answer and it equals `odd`.
- The spec's example set is present, shows the labels Peter, John, Paul and James, and answers Paul.
- Every set using the Gospels rule counts only Matthew, Mark, Luke and John as Gospels (never Acts), and no set holds two same-named places.

**`game.test.ts`** checks the game logic:
- A round has 10 distinct sets.
- The shuffle is a permutation, and over many seeded rounds the odd item's position is roughly uniform.
- Scoring and the best streak are correct.
- Freshness skips recently seen sets and falls back to the oldest when the pool runs out.
- Hidden combinations are reported as unavailable.
- Corrupt local storage is ignored safely.

**`test_odd_one_out.py`** (pytest) checks the checker itself:
- A known-ambiguous set is rejected ("Peter, Andrew, Mary Magdalene, Paul": both "the only woman" and "not one of the Twelve / followed Jesus" are rivals).
- A clean set passes.
- An unknown on another item creates a rival (a known "tribe of Judah" beside three blanks still singles that item out when it isn't the odd one).
- An unknown value never singles out its own item: four people with blank tribes pass.
- A relation anchored on a member is skipped: Peter, John, James, Paul passes even though James and John are brothers.
- The qualifier and first-letter rivals are caught.
- A "Mount …" place typed as a hill is not treated as differing from a mountain.
- A giveaway label is rejected.
- A seed set that fails stops the build.
- A stale veto id stops the build.
- `--check` detects changed output.
- `--check` passes on the real site data, so `npm run test:data` notices when the committed sets have gone stale.

**Before handing back**, the implement step runs `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`, and reports the results honestly.

---

## 13. Cost

- **Running the game:** no cost. Static JSON, no server calls, no model.
- **Building sets:** no cost. Local Python, no model.
- **The optional model check (§6.6):** only with the owner's yes, through BatchRunner with a budget cap. Its expected size is a very small share of the Max plan.

---

## 14. Edge cases

| Case | Handling |
|---|---|
| Same-name people (Mary ×6, James ×4, John, Herod, Zechariah, Saul/Saul) | Never two in one set. Labels are qualified from the slugs (§6.4). Ids, not names, are compared. |
| Name stored under an alias (Jacob as "Israel") | Labels override table. The build fails on an unknown id in it. |
| A qualifier gives the answer away ("John the Baptist" in a prophets set) | Giveaway-word check rejects it. |
| Contested facts (who wrote Hebrews, 2 Peter, the Gospels) | Authorship is never used. Only "opens in Paul's name" from the site's letters data. "A book bears this name" is matched on the name alone, and the "book named after them" rule covers only Old Testament people whose book plainly names them (§5.2). |
| Disputed locations (Mount Sinai, Emmaus) | Location-based properties become unknown (confidence below 0.5), and unknowns count against the set (§6.2). The place can still appear in type-based sets ("the only mountain"). |
| Place types that disagree with the name (Mount Zion and the Mount of Olives typed as hills, Zion as a settlement) | Mountains and hills are one class; label words ("Mount", "Sea") are rival properties; a giveaway label can't be the odd one (§5.2, §6.4). |
| Same-named places (Antioch ×2, Samaria city and region, Galilee ×2) | Never two in one set; qualified label from `facts.json` or left out (§5.1). |
| Brothers in one set (James and John) | Relations anchored on a member are not checked (§6.1, step 5). |
| Tradition-dependent canon (the Apocrypha) | Excluded. |
| "One of the Twelve" vs "apostle" (Matthias, Paul, Barnabas) | Separate rules with exact phrases. "The Twelve" means the list in Matthew 10 (Matthias is not in it). Both rules exist as rival properties, so a set where they disagree is rejected. |
| "Named in the Gospels" vs "followed Jesus" (James the brother of Jesus) | Curated `followed-jesus` facts with refs. The book-appearance property is rival-only (§5.3). |
| Moral judgements ("the only evil king") | Not used as rules in version 1. They need judgement calls and verse-by-verse sourcing. They could be added later as curated facts with refs. |
| Jesus, God, angels, Satan | Excluded from the pool. |
| Peoples and nations (Amorites, Edomites) | Excluded (`g` flag). |
| Very long names | They wrap. The buttons grow in height; the layout is tested at 320 px. |
| Double tap or tap during reveal | The first tap locks the answer; later taps are ignored until Next. |
| Reload or Back mid-round | The round (set ids, position, score) is kept in session storage and resumed. A new tab starts fresh. |
| Pool exhausted for a combination | Oldest-seen sets come back first. Combinations under 20 sets are hidden. |
| Data file fails to load | "Can't load" screen with Try again. No partial game. |
| Local storage unavailable or corrupt | The game still works; best scores and freshness are just not kept. |
| Site data changes later (people rebuilt) | `--check` fails in whatever runs it, a rebuild regenerates sets, and stable ids keep vetoes and "seen" lists valid where the sets survive. |
| Translation into the site's other languages | Version 1 is English. Rule phrases and briefs are data, so a later translation pass can add per-language phrase files without changing the logic. |
| The /games hub | Built (registry already lists this game as coming soon). Going live is a one-entry registry change (§11). |

---

## 15. Open points for the review step and the owner

1. **Owner decision (optional):** whether to run the extra cheap-model check of every set for answers the fact sheet can't see (§6.6). It needs a yes under the cost rule. The game is complete without it.
2. **Review step (done, §17):** the people-pages groups cover the curated people rules listed (kings of Israel and of Judah, judges, Herods, Rome, Persia, Assyria and Babylon, Egypt, the united kingdom, the Twelve, Paul's circle, the Jerusalem church, seven prophet groups; there are 22 group files in all). `facts.json` grows by the four Gospels, the Old Testament people a book is named after and the qualified place labels, which keeps it to a few dozen entries.
3. **Implement step:** read a sample of the generated review sheet before handing back, and say in the report how many sets each kind and difficulty reached and which combinations are hidden.

---

## 16. Sources

- Simon Colton, "Automated Puzzle Generation", AISB 2002: <http://ccg.doc.gold.ac.uk/wp-content/uploads/2016/08/colton_aisb02.pdf> (also <https://www.researchgate.net/publication/2892578_Automated_Puzzle_Generation>)
- Balázs Pintér et al., "Automated Word Puzzle Generation via Topic Dictionaries", 2012: <https://arxiv.org/abs/1206.0377>; topic-model version <https://discovery.ucl.ac.uk/1433225/1/pinter12automated.pdf>
- Martin N. Hebart et al., "Revealing the multidimensional mental representations of natural objects underlying human similarity judgements", Nature Human Behaviour 4, 2020 (THINGS triplet odd-one-out task)
- Christopher Danielson, *Which One Doesn't Belong?* (Stenhouse 2016; Charlesbridge 2019): <https://www.charlesbridge.com/products/which-one-doesnt-belong-playing-with-shapes>, <https://talkingmathwithkids.com/wp-content/uploads/2026/02/look-inside.pdf>
- NYT Connections: <https://en.wikipedia.org/wiki/The_New_York_Times_Connections>; Slate interview with Wyna Liu (July 2024): <https://slate.com/life/2024/07/connections-nyt-today-wordle-wyna-liu.html>
- Knowledge-graph question generation with difficulty control (background): <https://arxiv.org/pdf/2602.20135>, <https://arxiv.org/html/2604.10748>

---

## 17. Review

**Review step, 2026-11-07, one pass.** The design was checked against the approved spec (APPROVED-IDEAS.md entry 23), the shared build rules, and the real site code and data: the games hub and its README, people and per-person files, people-pages groups, places, the catalogue, the question bank, the routes in App.tsx and the vitest and npm setup. The research, the content model, the build-around-a-near-miss approach, the layered uniqueness checks, the rules, screens and cost section held up. The problems found are all fixed in the body above; this list says what changed and why.

**Would have broken the build**

1. **The owner's example set would have been rejected, which stops the build** (§6.2 rewritten). The draft treated every unknown fact as whatever value creates a rival answer. The tribe is blank in the data for Peter, John, James and Paul (and for 1,639 of the 3,133 people), so any of them could be "the only one from tribe X", and a failing hand-written set stops the build by design. Now an unknown can never be what singles an item out; unknowns on the *other* three items still count against the set; items missing a tier-1 fact leave the pool. The protection against data gaps stays, without rejecting every New Testament set.
2. **Brothers in one set created a false rival** (§6.1 step 5, §5.2). In the data James and John list each other as siblings, so "the only sibling of John" would single out James in the spec's set. Relations anchored on someone who is in the set ("sibling of X", "companion of Paul") are now skipped for that set; relations to someone outside it ("child of Zebedee") are still checked.
3. **"Has a Bible book named after them" relied on who wrote which book** (§5.2, §14). That contradicted the design's own rule never to use authorship, and with John and James unknown it made Peter "the only one with a book" and rejected the spec's set again. It is now two properties: a surface check on the name alone ("a Bible book bears this name": John, James and Peter yes, Paul no), and a curated rule only for Old Testament people whose book plainly names them.

**Would have produced wrong or confusing puzzles**

4. **Acts counted as a Gospel** (§5.2, §12). The site's catalogue files Acts under its `gospels` section. The four Gospels now come from the curated facts file, as the five books of the Law already did, and a test checks it.
5. **Place types disagree with place names** (§5.2, §6.4, §14). The data types Mount Zion, the Mount of Olives and Golgotha as hills and Zion as a settlement, so "the only hill" or "the only mountain" would mislead. Mountains and hills are now one class, words in the name ("Mount", "Sea") are rival checks, and a name that gives away the reason can't be the odd one.
6. **Same-named places were not guarded** (§5.1, §6.4, §14). 120 place names occur more than once (Antioch, Samaria the city and the region, Galilee). The same-name rule that covered people now covers places.
7. **Question-bank tags are names, not ids** (§3, §5.1). The draft used them as a fame signal by person. "Mary" or "James" would have let obscure namesakes into Easy rounds; a tag now counts only when it matches exactly one person or place.
8. **The spec's example would not have looked like the spec** (§4, §6.4, §12). Generated sets always qualify same-named people, so it would read "John, son of Zebedee". Hand-written seed sets may now set their own display labels, so the first puzzle reads Peter, John, Paul, James, as the owner wrote it; the reveal still gives the full name.
9. **The content-model example contradicted §5.3 and §6.3** (§4). It filed the spec's set under "the Twelve" with the "not with Jesus during his ministry" wording, and an empty "also true" list. It now uses the `followed-jesus` rule, gives "the Twelve" its own wording ("was not one of the Twelve"), and lists it under "also true".

**Out of date or imprecise about the codebase**

10. **The games hub now exists** (§11, §14, §15). The draft said it didn't and planned a fallback route in App.tsx. The hub and its registry are built and already list this game as coming soon; going live is one registry entry (`status: "live"` plus `load`), the page file is a default export with no props, and App.tsx, the menu, the hub page and the hub's test stay untouched. The fallback is removed.
11. **Link forms** (§7). Set to the forms the site actually uses: `/people/<slug>`, `/study/atlas/map?place=<id>`, and `/read/bsb/<BOOK>/<chapter>?hl=<verse>`.
12. **The can't-load screen** (§10). `DataUnavailable` is an error class, not a screen; the game draws its own.
13. **KJV text** (§3). The per-person story and article text quotes the KJV. It is now explicitly off limits; explanations use only the one-line brief, the rule phrases and the BSB key quote.
14. **Smaller points.** Properties with many values are checked one value at a time (§5.2). The giveaway-word check ignores short common words (§6.4). The second solver keeps all three states and the same two corrected rules (§6.7). The Python tests run the staleness check on the real data, so `npm run test:data` catches out-of-date sets (§12). The people-pages count is corrected to seven prophet groups plus the united kingdom (§3).

**Checked and left as designed:** one tap and no timer, rounds of 10, the difficulty table, the variety limits, the minimum of 20 sets before a combination is offered, the optional cheap-model check staying an owner decision (§6.6), no change to `package.json` or `prebuild`, and the edge-case table apart from the rows added above. The set targets in §5.4 can't be confirmed until the build runs; the build reports its counts and hides thin combinations, which is the right safeguard.

## 18. Implementation notes

**Implement step, 2026-11-07.** The game is built to this design and listed as live on the games hub (`status: "live"` in [registry.ts](../../../src/pages/games/registry.ts)). The set builder is [build-odd-one-out.py](../../../scripts/build-odd-one-out.py) with its modules and hand-kept data in [scripts/odd-one-out/](../../../scripts/odd-one-out/); it writes [sets.json](../../../src/data/odd-one-out/sets.json), the [facts-table.json](../../../src/data/odd-one-out/facts-table.json) that the second solver reads, and the [review-sheet.md](review-sheet.md) for the owner to skim. The page is [OddOneOutGame.tsx](../../../src/pages/games/odd-one-out/OddOneOutGame.tsx) and its neighbours in [src/pages/games/odd-one-out/](../../../src/pages/games/odd-one-out/).

**What the build produced.** 321 sets. People: 60 Easy, 80 Medium, 23 Hard. Places: 30 Easy, 40 Medium, 40 Hard. Books: 25 Easy, 14 Medium, 9 Hard, so Books Medium and Books Hard are below the minimum of 20 and are hidden on the start screen, as §8 and §14 intend. Mixed rounds draw only from combinations that are offered on their own.

**Where the build had to decide something the design left open, or differs from it**

1. **Family relations as rivals only for well-known people.** Checked literally, the generic relations rejected the owner's example: Peter is "the only son of John (Peter's father)" and "the only brother of Andrew". A relation property now counts as a rival only when the person it is anchored on is mentioned at least 60 times; relations anchored on someone in the set are still skipped (§6.1 step 5).
2. **"An Old Testament book bears their name" (the curated rule from §5.2).** If it were unknown for everyone not on the list, the rule could never be used. It is false for everyone except the listed people, and unknown only for Solomon, David and Moses, whose links to books are disputed.
3. **Shared names (§5.1, §6.4).** Requiring a label for every shared name would have dropped Noah, Hezekiah, Babylon, Bethel and many more. A name stays bare when its main bearer is mentioned at least four times as often as the next person or place with that name; other namesakes need a curated label or are left out.
4. **The seven churches of Revelation.** Smyrna, Pergamum and Philadelphia have only two verses each, under the three-verse minimum. Places that carry a hand-written fact skip the verse minimum.
5. **The first-letter check** runs only as "three share a letter, one differs", as §6.4 says. Run both ways it rejects nearly every set.
6. **Queens.** Queens by marriage (Jezebel, Esther, Vashti) are unknown for "ruled as king or queen"; only Athaliah, the queen of Sheba and Candace count as true.
7. **"Also true" lines** are shown only when all four items' facts are known. Otherwise a rival that exists only because of a data gap produced false lines such as "Aaron is the only Israelite". The extra-reason limits for Medium and Hard (§8) count only these certain reasons.
8. **Variety limits (§5.4).** An item appears at most six times per difficulty rather than six times overall; one rule supplies at most 15% of a kind's sets, and half of that per difficulty; an item is the odd one for a given rule only once. Hard is built first, then Medium, then Easy, because building Easy first left too few items for Hard.
9. **Places.** The data types Tarshish, Ophir, Ezion-geber and Elath as islands with low confidence, so they are left out; the compass points North, South, East and West are not places and are left out; "only in the Old (or New) Testament" looks at every place sharing the name, so Samaria counts as named in the New Testament. Easy places need at least 15 verses, because question-bank tags were letting obscure places in. An Easy person needs at least three question-bank questions.

10. **Fixes after an independent review of the finished build.** It checked about 150 sets against the site's own Bible text, and these changes followed:
    - Wrong facts corrected in [facts.json](../../../scripts/odd-one-out/facts.json). Ezekiel was a priest (Ezekiel 1:3). Abraham is called a prophet (Genesis 20:7). Barabbas did not follow Jesus. Cornelius was a Gentile, and Apollos and Aquila were Jews (Acts 10; 18:2, 24). En-gedi is a town, not a region.
    - A new `unsure` table makes some facts unknown where a reader could argue either way: Cyrus and Artaxerxes as kings of Babylon (Ezra 5:13; Nehemiah 13:6); Joshua as a judge; the eras of Eli and Samuel, who span the judges and the kingdom; Nathanael as one of the Twelve or an apostle (often identified with Bartholomew); and Cornelius, a centurion, as a Roman official.
    - The town of Carmel is labelled "Carmel in Judah", so that it doesn't read as Mount Carmel.
    - "Outside the land of Israel" is unknown for the Phoenician coast (Tyre) and for the Philistine cities.
    - **A stricter check than §6.2.** When one item's fact is unknown and the other three agree, that item could be the odd one out for that reason, so the set is rejected. This applies to the headline rules and to "not an Israelite". A set whose rule is about one of its own four (for example "son of Jacob" with Jacob in the set) is rejected too.
    - The extra reasons no longer repeat "New Testament times" twice or read "the time of before the Flood".
    - On the page, the number keys and Enter are ignored while someone is typing in a form (the site's correction form), and so is a held-down key. The owner's example opens the first Easy People round once per device, tracked by its own flag. It is not shown where storage can't remember it, and it doesn't depend on which game was played first. A corrupt saved position now starts a fresh round instead of crashing. Focus moves to the score heading when the summary opens.
    - The TypeScript tests also check that every set's shipped rule really splits the four three-and-one, as the reason shown says.

**Checks added (§12).** [test_odd_one_out.py](../../../scripts/tests/test_odd_one_out.py) covers the builder and runs the staleness check on the real data. [sets.test.ts](../../../src/pages/games/odd-one-out/sets.test.ts) holds the second solver, written from this design's text rather than copied from the Python checker; it reads only the fact table and the labels shown, never a set's rule, and finds exactly one answer, the shipped one, in every set. [game.test.ts](../../../src/pages/games/odd-one-out/game.test.ts) covers rounds, shuffling, scoring and storage, and [OddOneOutGame.test.tsx](../../../src/pages/games/odd-one-out/OddOneOutGame.test.tsx) covers the page and the hub serving it.
