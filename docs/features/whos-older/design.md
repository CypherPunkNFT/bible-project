# Who's older? — design

**Feature:** approved idea 18 in [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md): *"Two characters appear; tap the one who lived first. Quick, teaches chronology."*
**Slug:** `whos-older` (already in [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) as "coming soon").
**Rules followed:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md) and the site's [AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md).
**Written:** 2026-11-07, sequence 31 step 4 (research and design). Step 5 reviews this document; step 6 builds it.
**Reviewed:** 2026-11-07, sequence 31 step 5. Corrections are applied in the body below; §15 lists each one and why.

---

## 0. Summary

- Two Bible people appear side by side. The player taps the one who **lived first**, meaning the one who came into the world first. A reveal then explains the answer: when each person lived, how sure anyone can be, and the verse that settles it when there is one.
- **The core promise: a pair is only ever asked when its order is certain.** Every person carries a deliberately wide window for when they could have been born, wide enough to cover every dating system the site already recognises. Two people are paired only if their windows do not overlap, or if a verse states the order outright ("Aaron was eighty-three", Exodus 7:7). Uncertainty therefore never needs special handling: a person whose dates are uncertain has a wide window, so they are automatically paired only with people far away in time. Job, whose dates nobody knows, can meet Esther or Peter, never Moses.
- **The data is a new hand-kept chronology file** of about 180 well-known people, built from the Bible's own numbers and the site's existing king and prophet pages. Those pages already carry reign dates in four or five dating systems. A build script checks the file against the site's people data, family links and periods, and against a second, independent dataset (Theographic). It writes a review sheet for the owner.
- **Scoring is a streak**, as in the Higher Lower Game: Streak mode ends at the first miss. Relaxed mode, for families, gives three hearts. The best streak of each mode is kept in the browser. Difficulty rises with the streak, from pairs a thousand years apart to parent and child.
- **No running cost.** There are no model calls at runtime and no new services. The explanations are templates plus hand-written lines, and the quotes come from the site's own Berean Standard Bible text.

---

## 1. What the spec fixes, and what this design decides

| The spec fixes | This design decides |
|---|---|
| Two characters, tap the one who lived first | What "lived first" means when two lives overlap: **born first** (§3.1) |
| Quick | One tap per round. No timer. A reveal you can skip past in one tap |
| Teaches chronology | An explanation after every answer, a timeline strip with honest blurred windows, and a recap of missed pairs (§7) |
| *(this step's brief)* Honest about uncertain dates; never pair people whose order is unknown | Birth windows plus order facts, and the pairing rules in §5 |
| *(this step's brief)* Streak scoring | Streak and Relaxed modes and difficulty ramp (§6) |

---

## 2. Research

### 2.1 The reference games

| Game | How it works | What we take | What we avoid |
|---|---|---|---|
| **The Higher Lower Game** ([higherlowergame.com](https://www.higherlowergame.com/)) | Two search terms. The left one shows its monthly Google searches; guess whether the right one is higher or lower. A right guess slides the right card over to the left and brings a new challenger. **One miss ends the run.** The only goal is your best streak. | The two-card face-off, one tap, sudden death, best streak. The **"one stays"** chain: the newer card stays for the next round, so each answer builds on the last. | Its comparisons have no explanation. You learn a number, not a reason. |
| **Wikitrivia** ([Wikipedia article](https://en.wikipedia.org/wiki/Wikitrivia)), Tom J. Watson, January 2022 | Place cards ("born", "created", "ended") on a growing timeline. **Three lives.** After a miss it shows the right date and play goes on. Data from Wikidata. | Three lives for a gentler mode, and showing the truth after a miss. | Its known weakness: wrong or ambiguous Wikidata dates made unfair cards, and the creator had to ask players to report them. That is exactly the failure our "certain pairs only" rule exists to prevent. |
| **Timeline** (Asmodee card game, 2010) | Event cards with the year on the back, placed into a shared line. | Proof that ordering famous things is fun on its own, with no trivia recall needed. | Single exact years printed as fact. |
| **Wordle and Map quest's Daily Five** | A daily puzzle and a result you can share without spoilers. | A no-spoiler share text for a streak. | A daily mode is left for later (§13). The spec asks for a quick endless game. |

Similar sites report that higher-or-lower streaks of about 15 are typical and 30 or more are excellent ([playhigherlower.com](https://playhigherlower.com/how-to-play)). That fits the milestone messages in §6.4.

**What makes the reveal worth reading.** Research on feedback in learning (Hattie and Timperley, *The Power of Feedback*, 2007; Butler, Karpicke and Roediger, 2008) finds that explaining **why** an answer is right teaches more than marking it right or wrong, especially after a confident wrong answer. So every reveal carries a reason, not only a tick.

### 2.2 The site's data, and how far it can be trusted for order

| Source | What it gives | Can it decide order? |
|---|---|---|
| [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) | 3,133 people: name, other names, one-line brief `b`, mention count `c`, period `p`, group flag `g` | **No, cross-check only.** The period comes from STEP Bible's names data (TIPNR) plus the book of first mention ([study_people.py](Jarvis/Projects/BibleProject/Website/scripts/bible/study_people.py) `people_period`). It is coarse (12 periods) and has hazards seen in this job. **Job** is filed under Patriarchs, though his book never dates him. **Perez** is under Exodus, though he was born in Genesis 38. **Esther** is under Return, though she lived between Zerubbabel and Ezra. **Nebuchadnezzar** is under Divided kingdom and **Cyrus** under Exile. Two people in neighbouring periods can be in either order. |
| [data/study/people/](Jarvis/Projects/BibleProject/Website/data/study/people/) (one file per person) | Parents `pa`, children `ch`, siblings `si`, spouses `sp`, era label `e` | **Parent before child, yes**, after a cross-check (§4.4). Siblings, no: the data does not say who is older. |
| [src/data/people-pages/](Jarvis/Projects/BibleProject/Website/src/data/people-pages/) rulers files | Every king of Israel and Judah, the Herods, Rome, Persia, Assyria and Babylon, with reign `order`, predecessor and successor, Judah's ages at accession, and **reign dates in several systems**: Scripture's numbers, Thiele as revised by McFall (main), Albright, Galil, Young and Ussher | **Yes**: the site's best dated material. Policy in [METHODOLOGY.md §3](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md): *dates are reconstructions, never Scripture; always "about"; show the range where systems differ by more than 3 years.* This design follows that policy. |
| people-pages prophets files | Each prophet's `kings` list: "in the days of Uzziah…", with verses | **Yes, through the kings' dates.** It anchors a prophet's working years. |
| Theographic Bible Metadata ([held copy](Jarvis/Projects/BibleProject/sources/theographic/), CC BY-SA 4.0) | People.csv lists 3,069 people, but **only 75 have a birth year** and 64 a death year. Its `minYear`/`maxYear` columns are the years of the first and last verse naming the person, not a lifespan: Aaron's runs to AD 64 because Hebrews mentions him. 450 dated events, 268 people. One Ussher-type chronology (Adam born 4004 BC). | **No.** The site's methodology already rules it out as a source of dates ("usable only as a cross-check of event order"). Used here the same way, in the build's cross-check report only, and never shipped, which also keeps its share-alike licence out of the game. |
| [data/text/bsb/](Jarvis/Projects/BibleProject/Website/data/text/bsb/) | Berean Standard Bible text | Quotes in the reveal, filled in at build time. |
| [people-slugs.json](Jarvis/Projects/BibleProject/Website/src/data/people-slugs.json) | Readable addresses (`/people/moses`) | Links from the reveal. |

**Conclusion:** no existing file can decide "who came first" safely on its own. Mention counts also fail as a fame signal for New Testament people: Nehemiah has 5 mentions and Timothy 24. The game needs its own small, hand-kept, checked chronology. The site already holds most of the raw material for it.

---

## 3. Definitions

### 3.1 "Lived first"

The round's heading uses the spec's words, **"Who lived first?"**, with one small line under it: *"The one who came into the world first."*

- When two lives never overlapped (Abraham and David), "lived first" is obvious.
- When they overlapped (David and Solomon, Aaron and Moses), the answer is **whoever was born first**.
- "Came into the world" rather than "born" covers **Adam and Eve**. Neither was born, but Scripture says Adam was formed first (Genesis 2:7, 2:22; 1 Timothy 2:13).

### 3.2 The Bible's timeline, not a verdict on history

The game asks about order **as the Bible tells it**. The "How we date people" panel on the start screen (§8.1) says so in one sentence. It does not argue about whether people existed or how old the earth is. Absolute dates are shown only as "about", and only where the site's own king and prophet pages already give them.

### 3.3 Who can never appear

| Excluded | Why |
|---|---|
| **Jesus** | "Who lived first, Jesus or Abraham?" collides with John 8:58 ("before Abraham was born, I am") and with the church's teaching that the Son exists eternally. Asking about his birth alone would teach something misleading. He is mentioned in explanations (for example, "John the Baptist was born about six months before Jesus") but never shown as a card. |
| God, angels, Satan | They were never born. |
| **Melchizedek** | Hebrews 7:3: "without father or mother or genealogy, without beginning of days". A puzzle about his birth would contradict the text the game quotes. |
| Groups and peoples (`g` set) | They are not persons. |
| Unnamed people ("a wife of Ezekiel") | They have no name to show. |
| People absent from the curated pool | Everyone else in the 3,133 has no reviewed window. |

---

## 4. Chronology data — source and model

### 4.1 Files

| File | Kind | Content |
|---|---|---|
| `src/data/whos-older/characters.source.json` | **hand-kept** | The pool: one entry per person (§4.2) |
| `src/data/whos-older/order-facts.source.json` | **hand-kept** | Pairs whose order a verse states outright (§4.3) |
| `src/data/whos-older/blocked-pairs.source.json` | **hand-kept** | Pairs that must never be asked even if the windows seem to allow it (§4.5) |
| `src/data/whos-older/whos-older.json` | **generated**, "do not edit" header | What the game loads: characters with labels, briefs and links; all facts, including parent facts derived from the family links; BSB quotes; a hash stamp |
| `docs/features/whos-older/review-sheet.md` | **generated** | The owner's review sheet: every person's window beside the other sources, every fact, every warning (§4.6) |
| `scripts/build-whos-older.ts` | script | Reads the three source files plus the site data and writes both generated files. Run by hand after editing a source file, like Map quest's builder. It **fails** on any contradiction. |

The game loads `whos-older.json` with a dynamic import on its own route only. At about 180 people and about 150 facts it should be roughly 60–90 KB raw.

### 4.2 A character entry

```jsonc
{
  "id": "moses-exo-2-10",              // must exist in data/study/people.json, not a group
  "label": "Moses",                    // shown on the card; unique in the pool (§5.3)
  "tag": "Prophet and lawgiver",       // short neutral role, shown on the card; never a hint about date
  "tier": 1,                           // 1 famous, 2 known, 3 deep cut (§6.3)
  "born": { "lo": -1575, "hi": -1330 },// widest birth window over the recognised systems (§4.2.1); integers, negative = BC (§4.2.2)
  "shown": true,                       // false = window too speculative to print as years (early Genesis)
  "when": "Led Israel out of Egypt. Born about 1575–1330 BC: the range covers the traditional, the early and the late dates given for the Exodus.",
  "basis": [[2007007, 2007007], [11006001, 11006001]],  // verse spans the window rests on (Exod 7:7; 1 Kgs 6:1)
  "systems": { "ussher": -1571, "early-exodus": -1526, "late-exodus": -1330 }  // optional: the per-system estimates the window spans, for the review sheet
}
```

#### 4.2.1 How a window is set (the rules the implement step follows)

1. **Anchor.** Find the person's best-dated moment in Scripture: a king's accession, "in the year King Uzziah died", "the third year of Jehoiakim", the twentieth year of Artaxerxes.
2. **Date the anchor in every recognised system.** For the kings and prophets, use every system on the person's people-page: Thiele–McFall, Young (stored as system `other`), Albright, Galil where given, and Ussher. Where a system gives only one end of a reign (the David page's Albright entry has only the end, 962 BC), count the other end from Scripture's length of reign (962 + 40 = 1002 BC). For the Exodus and earlier, use **three** Exodus dates: Ussher's 1491 BC, the early date of about 1446 BC, and the late date of about 1270–1250 BC. Ussher's 1491 is not a new source: it follows from 1 Kings 6:1 and the Ussher reign dates already on the site's Solomon page (accession 1015 BC, so his fourth year is 1012 BC, plus 480 years). Run the Bible's own numbers back from each: Genesis 21:5, 25:26, 47:9, Exodus 12:40, Exodus 7:7. For Exodus 12:40, cover both readings, 430 years in Egypt alone or Canaan and Egypt together. For figures fixed by outside history (Cyrus, the Herods, Augustus), use the standard range, which is narrow.
3. **Birth from the anchor.** If Scripture gives an age at the anchor (most kings of Judah, Moses at 80, Joseph at 30), birth = anchor − age, in each system. Otherwise allow:
   - "child", "boy" or "girl": 0–20 years (the Hebrew word for boy also covers young men: Saul calls David "just a boy" in 1 Samuel 17:33, yet David had already been described as a warrior in 16:18);
   - "youth", "young man" or "young woman": 12–30 years, widened to 12–40 if the same person holds an adult command or office at about that time (Joshua leads the army in Exodus 17:9 and is Moses' "young assistant" in Exodus 33:11; Paul is "a young man" in Acts 7:58 and acts "with authority from the chief priests" in Acts 26:10);
   - nothing said: the person was an adult at the anchor, so allow 15–80 years.
   
   Ages count at the anchor's own date in each system: an anchor known only as "during Ahab's reign" runs from the first year of the reign in the earliest system to the last year in the latest system.
4. **The window is the smallest and largest result** over all systems and all allowances. When in doubt, **widen**. A window that is too wide costs a few pairs. One that is too narrow could ask a question with no certain answer. **Several anchors:** when one person has more than one anchor (Paul: a young man at Stephen's death, and an official acting for the chief priests soon after), each anchor gives its own window by these rules, and the person's window is where they overlap. That is still safe, because each window on its own already covers every system.
5. **Unknown edges stay open.** `lo: null` means "no earliest bound". Job is the example: nobody knows how early he lived, but Ezekiel 14:14 already names him as a famous man of the past, so `hi` is about −650. `hi: null` would mean no latest bound, and is not expected in the pool.
6. **Early Genesis is order only.** From Adam to Abraham, the Hebrew and Greek texts of Genesis 5 and 11 differ by centuries, so years would be fiction. These people get internal bounds, placed so that the order the genealogies give is respected. They are marked `shown: false`, so the game never prints a year for them; their `when` line speaks in generations ("ten generations after Adam, before the Flood (Genesis 5)"). All their internal bounds lie **before Abraham's earliest year**, and the build checks this. So `shown: false` is only for people the genealogies place wholly before Abraham's birth, such as his ancestors back to Adam. Abraham's own generation (his brothers Nahor and Haran) gets an ordinary window that overlaps his.
7. **Write `when` in plain words**, always with "about", always naming the reason for any wide range. Never more precise than the sources.

#### 4.2.2 Year numbers

`lo` and `hi` use **historians' numbering**: −30 is 30 BC, 10 is AD 10, and there is **no year 0** (1 BC is followed by AD 1). The build fails on a 0. Order checks (`a.hi < b.lo`) are unaffected. A gap that crosses from BC into AD is one year shorter than plain subtraction gives (10 BC to AD 15 is 24 years, not 25), so the shared `yearsBetween(bc, ad)` helper in `pairing.ts` subtracts that one year. The explanation (§7.2) promises a *minimum* gap, so it must never be overstated by that year.

### 4.3 An order fact

```jsonc
{
  "first": "aaron-exo-4-14", "second": "moses-exo-2-10",
  "kind": "stated-age",                // stated-age | birth-order | parent | grandparent | generation-gap | created-first
  "refs": [[2007007, 2007007]],
  "why": "When they spoke to Pharaoh, Moses was eighty and Aaron eighty-three."
}
```

- **stated-age**: ages given at the same moment. Aaron and Moses (Exodus 7:7). Ishmael and Isaac: Abram was 86 at Ishmael's birth and 100 at Isaac's (Genesis 16:16; 21:5).
- **birth-order**: the text narrates the births in order. Cain, Abel and Seth (Genesis 4:1–2, 4:25). Esau before Jacob (Genesis 25:25–26). Manasseh before Ephraim (Genesis 41:51–52). Amnon before Absalom, with Solomon born later in Jerusalem (2 Samuel 3:2–5; 5:14). **Jacob's sons**, only where the order is plain, because the four mothers' births in Genesis 29–30 may overlap in time. Allowed: one mother's sons in the order she bore them; Reuben before any brother ("my firstborn", Genesis 49:3); Benjamin after any brother (born last, Genesis 35:16–18); Leah's first four (Reuben, Simeon, Levi, Judah) before Joseph, since Rachel was still childless after Judah's birth (Genesis 29:35–30:1) and Joseph was her first son (30:22–24). Any other pair of Jacob's sons is not a fact.
- **parent / grandparent**: Jesse and David, David and Solomon, Zechariah and John the Baptist, Herod the Great and Herod Antipas. Hand-kept facts carry a verse. Facts derived from the family links (§4.4) are added by the build.
- **generation-gap**: the text shows one as a child or youth while the other is grown or old **at the same time**, or the text's own numbers put a generation between them. A plain impression is not enough: if the deciding verse needs an argument to reach the answer, it is not a fact. Eli and Samuel (1 Samuel 1–3). Moses and Joshua, his "young assistant" (Exodus 33:11). Mordecai, who brought up his cousin Esther (Esther 2:7). Paul and Timothy: Paul was already acting "with authority from the chief priests" (Acts 26:10) some thirty years before he told Timothy to let no one despise his "youth" (1 Timothy 4:12). Elizabeth "in her old age" and Mary (Luke 1:36). Saul and David: Saul calls David "just a boy" (1 Samuel 17:33) when Saul's own son Jonathan had long been a commander (13:2).
  - *Not used as deciding verses:* Philemon 9, where Paul calls himself "now aged", because many scholars read the Greek word as "ambassador" instead. Samuel and Saul, because 1 Samuel 12:2 shows Samuel "old and gray" but says nothing of Saul's age, and Saul already had a grown son. Neither pair is excluded; it simply needs disjoint windows like any other pair.
- **created-first**: Adam and Eve (Genesis 2:7, 2:22; 1 Timothy 2:13).

A fact is the **only** way two people with overlapping windows can be paired. Facts are **not chained**: if A is older than B and B is older than C, that does not on its own make A and C a pair. Their own windows or a direct fact must decide. This keeps every explanation to one sentence and one verse.

### 4.4 Parent facts from the family links

The build walks `pa` (parents) in the per-person files (`data/study/people/*.json`) and adds a `parent` fact for each parent and child both in the pool, and a `grandparent` fact one step further. No deeper: distant ancestors are almost always decided by their windows anyway, and a long chain through imported family records is where an identification error would hide. Each derived fact:
- must agree with the windows. If the parent's earliest possible birth is after the child's latest, **the build fails** and names both people.
- is listed in the review sheet under "derived from family links", so the owner can strike any that look wrong (strike = add the pair to `blocked-pairs.source.json`).
- explains itself by template ("Isaac was Jacob's father") and links to both people's pages.

The per-person files are read **only by the build, on this PC**. Releases replace them with packed files (the site's [AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md), "Person packs"), so the game itself must never fetch them: everything it needs is in `whos-older.json`.

### 4.5 Blocked pairs

Some pairs look safe on paper but are honestly disputed, or would start an argument the game cannot settle in one line. The file lists them with a reason, and the build drops them whatever the windows or facts say. Seed list:

| Pair | Reason |
|---|---|
| Perez and Zerah | Twins. Zerah's hand came out first and was marked with a scarlet thread "This one came out first", but Perez was born first (Genesis 38:27–30). Either answer can be defended. |
| Shem, Ham and Japheth (any two) | The order of Noah's sons is unclear. Genesis 10:21 can be read as calling either Shem or Japheth the elder, and Genesis 9:24's "youngest son" (Ham) can also be read as "younger". |
| Abraham and Lot, Abraham and his brothers Nahor and Haran | Lot is a nephew, but nothing says Abraham was born before Lot. Genesis 11:26 lists Terah's sons, but 11:32 with 12:4 suggests the list need not be in birth order. |

### 4.6 The build's checks (all fatal unless marked)

1. Every id exists in `people.json`, is not a group, and is not on the §3.3 exclusion list.
2. Every label is unique in the pool, after aliases are merged (§5.3).
3. Every window has `lo < hi` where both are set, and `basis` cites at least one verse.
4. Every fact agrees with the windows: never first.lo > second.hi.
4a. **Facts never contradict each other.** No pair has two facts pointing opposite ways, and the facts, taken together with the derived parent facts, contain no loop (A before B, B before C, C before A). A loop means a data error somewhere in it, and the build names every person in it. Facts are still not chained when *asking* (§4.3); this check only catches contradictions.
5. **Cross-check with the site's periods.** If the windows say A is certainly before B but `people.json` puts A in a *later* period than B, write a **warning** (not fatal, because the periods have known errors). Every warning is listed at the top of the review sheet and needs a one-line resolution note in the source file before release.
6. **Cross-check with the people-pages.** The pages give reign dates, not birth dates, so the build turns each system's reign into a birth bound before comparing. For a ruler whose page records an age at accession, the birth year that age gives in **every** system must fall inside the window. For a ruler with no recorded age, the window must reach at least from 80 years before the earliest system's accession year to 15 years before the latest one (the adult allowance of §4.2.1). A prophet is checked the same way against the reign of the first king in their `kings` list: adult at some point in it, on every system. A window narrower than any system is fatal. Example: David was thirty at accession (2 Samuel 5:4), and his page gives accession as 1055 BC (Ussher), 1010 BC (Thiele–McFall) and about 1002 BC (Albright, counted back from 962 BC). So his window must reach from at least 1085 BC to 1032 BC.
7. **Cross-check with Theographic.** Its 75 birth years and its "Birth of …" events are read from the held copy if present, and skipped with a notice if not. A Theographic birth year outside a person's window is a warning, not an error: Theographic follows one Ussher-type system. A Theographic *order* that contradicts a certain pair is a warning that must be resolved.
8. **Enough pairs.** Every pool member has at least 8 certain partners, and each difficulty band (§6.3) has at least 300 pairs. A person below 8 is dropped with a notice, not fatal.
9. The generated file's stamp changes only when its inputs change.

### 4.7 Building the pool

About **180 people**, chosen by hand in three tiers. Mention counts are not usable as a fame signal: Nehemiah has 5 mentions and Timothy 24. The question bank's people tags may help suggest candidates, as in the odd-one-out design, but the final list is a decision.

- **Tier 1, famous (about 60):** Adam, Eve, Cain, Abel, Noah, Abraham, Sarah, Isaac, Rebekah, Jacob, Esau, Rachel, Leah, Joseph, Moses, Aaron, Miriam, Joshua, Rahab, Gideon, Deborah, Samson, Ruth, Boaz, Hannah, Samuel, Saul, Jonathan, David, Goliath, Bathsheba, Solomon, Elijah, Elisha, Jezebel, Jonah, Isaiah, Jeremiah, Daniel, Nebuchadnezzar, Esther, Mordecai, Ezra, Nehemiah, Cyrus, Herod the Great, Mary the mother of Jesus, Joseph of Nazareth, John the Baptist, Peter, Andrew, John son of Zebedee, Mary Magdalene, Lazarus, Martha, Pontius Pilate, Paul, Timothy, Stephen, Lydia.
- **Tier 2, known (about 70):** more judges and kings (Ehud, Jephthah, Eli, Rehoboam, Jeroboam, Ahab, Jehu, Hezekiah, Josiah, Manasseh, Zedekiah), prophets (Nathan, Amos, Hosea, Micah, Ezekiel, Habakkuk, Haggai, Zechariah, Malachi), Methuselah, Enoch, Seth, Lot, Ishmael, Laban, Judah, Benjamin, Caleb, Naomi, Absalom, Job, Joel (prophet), Obadiah (prophet), Belshazzar, Darius the Mede, Xerxes (Ahasuerus), Artaxerxes, Haman, Zerubbabel, Elizabeth, Zechariah the priest, Nicodemus, Zacchaeus, Thomas, Matthew, Barnabas, Silas, Priscilla, Aquila, Apollos, Herod Antipas, Caesar Augustus.
- **Tier 3, deep cut (about 50):** Othniel, Shamgar, Tola, Abimelech, Omri, Jeroboam II, Uzziah, Ahaz, Huldah, Baruch, Joshua the high priest, Simeon, Anna, Gamaliel, Herod Agrippa I, Felix, Festus, Philemon, Onesimus, Titus, Epaphras, and others.
- **Same-name people** (Joel the prophet versus Joel son of Samuel; Obadiah the prophet versus Ahab's steward; the Johns, Marys, Jameses and Herods) get distinct labels (§5.3). The build fails if a label could point at two pool members.

Most New Testament people were contemporaries whose birth order is unknown, so they pair mostly with Old Testament people. Within the New Testament they pair only through facts (Elizabeth and Mary, Zechariah and John the Baptist, Paul and Timothy) or outside dates (Herod the Great was born about 73 BC, decades before Paul's earliest possible birth). That is correct, not a gap.

---

## 5. Pairing rules

### 5.1 The one function

`orderOf(a, b)` in `src/pages/games/whos-older/pairing.ts` returns either `{ first, second, reason }` or `null` (never ask). The build script and the game import the **same file**, as Map quest's `daily-rules.ts` is shared, so they cannot disagree. Checks in this order:

1. Either person excluded, or the same person → `null`.
2. The pair is in `blocked-pairs` → `null`.
3. There is a direct fact → `{ reason: fact }`.
4. `a.born.hi < b.born.lo` (strictly, with no shared year) → a first, `{ reason: "windows", gap: yearsBetween(a.born.hi, b.born.lo) }` (§4.2.2). The same with a and b swapped. A `null` edge counts as unbounded, so it can never prove an order on that side.
5. Otherwise → `null`.

`gap` is the **smallest** distance any combination of systems allows. That is what makes the explanation honest (§7.2).

### 5.2 Worked examples (windows illustrative; the implement step sets the real ones by §4.2.1)

| Person | Birth window | Basis |
|---|---|---|
| Abraham | about 2215–1750 BC | Bible's numbers back from all three Exodus dates (1491, about 1446, about 1250 BC) and both readings of Exod 12:40: 1491 + 430 + 290 = 2211 at the earliest, 1250 + 430 + 75 = 1755 at the latest |
| Moses | about 1575–1330 BC | 80 at the Exodus (Exod 7:7): 1491 + 80 = 1571, 1250 + 80 = 1330 |
| Joshua | about 1535–1260 BC | Moses' "young assistant" (Exod 33:11) while already leading the army (Exod 17:9), so 12–40 at the Exodus on all three dates |
| David | about 1090–1030 BC | 30 at accession (2 Sam 5:4): Ussher 1055 + 30 = 1085, Albright about 1002 + 30 = 1032 |
| Elijah | about 1000–865 BC | adult at some time in Ahab's reign: Ussher's first year 918 + 80 = 998, Albright's last year 850 + 15 = 865 |
| Isaiah | about 840–755 BC | adult in the year Uzziah died (Isa 6:1): Ussher 758 + 80 = 838, Thiele–McFall 739 + 15 = 754 |
| Daniel | about 640–615 BC | taken as a youth (12–30) in Jehoiakim's third year (Dan 1:1–4): Ussher's 607 + 30 = 637, Thiele–McFall's 605 + 12 = 617 |
| Esther | about 510–490 BC | young woman (12–30) brought to the king in Xerxes' seventh year, 479/478 BC (Est 2:16) |
| Job | open – about 650 BC | named as a famous man of the past in Ezek 14:14 |
| Joel (prophet) | about 900–400 BC | proposed dates run from the 9th century to after the exile |
| Peter | about 55 BC – AD 20 | married working adult (15–80) in Jesus' ministry, about AD 27–33 |
| Paul | about 10 BC – AD 15 | two anchors (§4.2.1 step 4): "a young man" at Stephen's death, about AD 31–36 (Acts 7:58; 12–40, as he also held office), and acting for the chief priests then (Acts 26:10; at least 20) |

The reign years in this table are the ones on the site's own people-pages for David, Solomon, Ahab, Uzziah and Jehoiakim (checked in the review). The other windows are still illustrative: the implement step sets every real one by §4.2.1.

| Pair | Verdict | Reason shown |
|---|---|---|
| Abraham / David | Abraham, **Easy** | windows: at least 660 years apart |
| Elijah / Isaiah | Elijah, **Hard** | windows: at least 25 years apart |
| Daniel / Esther | Daniel, **Medium** | windows: at least 105 years apart |
| Job / Esther | Job, **Medium** | windows. The `when` line says nobody knows when Job lived, but by Ezekiel's day he was already a famous figure of the past |
| Joel / David | David, **Medium** | windows: at least 130 years apart |
| Moses / Joshua | Moses, **Hard** | fact: Exod 33:11 |
| Aaron / Moses | Aaron, **Hard** | fact: Exod 7:7 |
| Adam / Eve | Adam, **Medium** | fact: Gen 2:22, 1 Tim 2:13 |
| Peter / Paul | **never asked** | windows overlap and nothing states it |
| Job / Moses | **never asked** | Job's window is open at the early end |
| Joel / Isaiah | **never asked** | windows overlap |
| Elijah / Elisha | **never asked** | overlap. Elisha was Elijah's successor, but no verse says who was born first |
| Daniel / Ezekiel | **never asked** | both were taken to Babylon young, within about eight years |
| Perez / Zerah | **never asked** | blocked (§4.5) |

### 5.3 Labels and identity

- **One person, one card.** The pool is keyed by site id, so a person can never meet themselves. Aliases are merged: the site files Jacob under the name "Israel" (`israel-gen-25-26`), so the label must say **Jacob**. The same holds for Abram/Abraham and Saul/Paul.
- **Same names get qualified labels everywhere:** "John the Baptist" and "John (son of Zebedee)", "Herod the Great" and "Herod Antipas", "Joel (prophet)", "Mary (mother of Jesus)" and "Mary Magdalene". A pair whose labels share a first word is allowed only when **both** labels carry a qualifier ("Herod the Great" and "Herod Antipas" may meet; a bare "James" may never meet another James), so a pair can never be misread on a small screen.
- The card's `tag` is a hand-written neutral role ("King of Judah", "Prophet", "Queen of Persia"). The one-line brief from `people.json` is **not** shown on the card, because many briefs give the answer away ("Son of Jacob", "Moses' brother"). It appears in the reveal.

---

## 6. Scoring, modes and difficulty

### 6.1 Streak (the main mode)

- Endless. Each right answer adds 1 to the streak. **The first miss ends the run.** The run-over screen shows the final streak and the best.
- **"One stays":** after each round, the right-hand (newer) person moves to the left and a new challenger arrives on the right. No person stays more than two rounds running. If no unused partner with a certain order is left for the stayer at the current difficulty, try the next band down, then start a fresh pair.
- **No side gives the answer away.** Because the stayer is always on the left, the challenger is chosen so that the left card is the right answer about half the time: with even odds, pick among the stayer's partners who came *after* them, otherwise among those who came *before*, and fall back to the other group if one is empty. Without this rule a stayer like Adam, who comes before everyone, would make "left" right every time. A fresh pair is placed on the two sides at random.
- No timer. The game is about learning order, not reflexes, and families play it together.

### 6.2 Relaxed (for families and younger players)

- **Three hearts.** A miss costs a heart, shows the reveal, and play continues. The score is the number of right answers before the third miss. This is the Wikitrivia rule.
- The player picks a difficulty: **Easy, Medium, Hard or Mixed** (Mixed follows the Streak ramp).
- Relaxed has its own best score, kept apart from Streak.

### 6.3 Difficulty bands

| Band | Rule | Example |
|---|---|---|
| **Easy** | Decided by windows, both tier 1, and a window gap of at least 400 years | Noah and Peter; Abraham and David |
| **Medium** | Not Easy, and either: decided by windows, both tier 1 or 2, with a gap of at least 100 years; or a `parent`, `grandparent` or `created-first` fact between two tier-1 people | Daniel and Esther; Job and Esther; Methuselah and Paul; Adam and Eve; David and Solomon |
| **Hard** | Everything else allowed: gap under 100 years; any `stated-age`, `birth-order` or `generation-gap` fact (these turn on a detail of the text); any fact involving a tier-2 or tier-3 person; any tier-3 person | Elijah and Isaiah; Aaron and Moses; Moses and Joshua; Omri and Uzziah |

The band follows the reason `orderOf` gives: a pair with a fact is banded by the fact, even if its windows also happen to be disjoint. For a pair where either person is `shown: false` (early Genesis), the gap between the internal bounds is not a real number of years. Such a pair is banded by its gap only when the other person has a real window, because the internal bounds all sit before Abraham's earliest year, so the gap is still a true minimum. When **both** are `shown: false` (Adam and Noah), the pair is Medium if both are tier 1 and Hard otherwise.

**Streak ramp:** rounds 1–5 Easy; rounds 6–15 a mix of Easy and Medium (equal weights); from round 16, Medium and Hard, Hard 40%. Within a band, choose at random, weighting slightly towards people the player has seen least in this run.

**No repeats:** the same pair never comes twice in a run. A person is not reused within 8 rounds unless they are the stayer. After 400 rounds (unlikely) the pair rule relaxes to "not within the last 200".

### 6.4 Best scores and milestones

- Saved in the browser under `bp-whos-older`: `{ version: 1, best: { streak, relaxed }, run?: <current run> }`. The current run is saved **when each pair is dealt** (before the player answers) and again after every answer. A reload therefore brings back the same unanswered pair, and resumes a run that has just ended on its run-over screen. A reload can neither undo a miss nor skip a question: if the run were saved only after answers, reloading would deal a fresh pair, which is a free skip.
- The saved run carries the generated file's stamp, as Odd one out's saved round does. If the data has changed since (a person removed, a window corrected), the saved run is dropped and the start screen offers a new one; the best scores are kept.
- Milestone toasts at a streak of 5, 10, 15, 25 and 50 ("10 in a row — you know your kings!"). A **new best** gets a short celebration on the run-over screen, with no confetti if the player prefers reduced motion.
- **Share:** a text with no spoilers, through Map quest's share helper ([share.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/map-quest/share.ts)): phone share sheet, else clipboard, else a select-and-copy box. Text: `Who's older? — streak of 17 🔥\nbibleguide.io/games/whos-older`. It never names a person. **Review decision:** import only the generic `shareResult` function from Map quest's `share.ts`, never edit that file, and write Who's older's own `shareText` in `whos-older/share.ts`, since Map quest's `shareText` builds Map quest's own result. A copy would be a second share routine to keep in step; the import adds only Map quest's small scoring module to this game's download.

---

## 7. The explanation after each answer

### 7.1 What the reveal shows

1. A banner: **"Right!"** or **"Not this time"**, with the streak or hearts after the answer.
2. A **timeline strip**. One horizontal axis, with each person's birth window drawn as a soft, blurred bar labelled "born about …". The overlap-free gap between the bars is the visual proof. If **either** person is `shown: false`, the whole strip drops its year marks: the two bars are drawn in order with word labels only ("before the Flood", "Abraham's time", "David's time"), because one axis cannot honestly carry real years on one side and invented ones on the other. An open edge fades out with an arrow ("earlier — unknown").
3. **The reason, one sentence:**
   - windows: *"Even on the dating systems that bring them closest, Abraham was born at least 660 years before David."* Gaps over 1,000 years are rounded down to the hundred: "at least 1,200 years".
   - windows, when either person is `shown: false`: no number of years is printed, since the internal bounds are not real years. The sentence is *"In the Bible's own order, Noah lived long before Peter."* The two `when` lines below it give the generations.
   - fact: the fact's `why`, then the BSB quote of its first verse span in quotation marks, with a link to the verse (`/read/bsb/EXO/7?hl=7`).
4. **Each person's line:** name (linked to the person page), the `when` line, and the people.json one-line brief.
5. A small link: **"Something look wrong? Tell us"**, to the site's existing [contact page](Jarvis/Projects/BibleProject/Website/src/App.tsx) (`/contact`). This is Wikitrivia's lesson: let players flag doubtful data.
6. **Next** (also Enter or Space). The reveal never advances by itself.

### 7.2 Why the wording is honest

- The gap shown is the *minimum*: the distance the two windows leave even when every uncertainty is pushed to bring them together. The game never says "David was born in 1040 BC".
- Every absolute date says "about" and gives a range where systems differ by more than 3 years, following [METHODOLOGY.md](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md).
- Wide windows are explained in the `when` line ("the range covers both the early and the late date for the Exodus"), so a player sees *why* a date is fuzzy.
- Quotes are BSB. The per-person `story`, `article` and `short` texts quote the KJV and are never used.

### 7.3 Run-over recap

The run-over screen lists **the pairs the player got wrong** in this run (for Streak, the one that ended it), each with its one-sentence reason and a "show" toggle that brings back the full reveal. That is the moment a player is most ready to learn the order.

---

## 8. Screens

### 8.1 Start

- Title **Who's older?**, a one-line rule ("Two Bible people. Tap the one who lived first."), and two large buttons: **Streak** and **Relaxed**. Relaxed opens a four-choice difficulty row.
- Best scores under each button ("Best streak: 14").
- **If a run is in progress:** a third, highlighted button, **Continue (streak 6)**.
- A fold-out, **"How we date people"**, in four short sentences. The game follows the order the Bible gives. Absolute dates are reconstructions, and scholars' systems differ. Every person has a window wide enough for those systems. A pair is only asked when the order is certain on every one of them, or a verse states it.
- A back link to the games hub.

### 8.2 Round

- Header: streak counter (or three hearts) and the mode.
- **"Who lived first?"** with the line *"The one who came into the world first."* under it.
- Two large cards, side by side on wide screens and stacked on narrow phones (top = left). Each shows the name and the neutral tag. The whole card is the button.
- Keys: `1`/`←` for the left (top) card, `2`/`→` for the right (bottom) card.
- Tapping locks both cards at once, so a double tap cannot answer twice.

### 8.3 Reveal

As §7.1. On a phone it slides up as a sheet over the cards. The chosen card is outlined, green if right and red if wrong, with a tick or cross icon and the words "Right"/"Wrong", so colour is never the only signal.

### 8.4 Run over

Final score, best score, a **New best!** badge, **Share**, the missed-pairs recap (§7.3), **Play again** (same mode) and **Back to start**.

### 8.5 Accessibility and look

- Cards are real `<button>`s with names like "Moses, prophet and lawgiver". The verdict and reason are announced through a polite live region. Focus moves to the reveal heading, then to **Next**.
- Reduced motion: no slide or celebration animation.
- Styling follows the existing games (`odd-one-out.css`, `map-quest.css`): its own `whos-older.css`, site tokens, light and dark.

---

## 9. Files (for step 6)

| File | Change |
|---|---|
| `src/data/whos-older/characters.source.json`, `order-facts.source.json`, `blocked-pairs.source.json` | new, hand-kept |
| `src/data/whos-older/whos-older.json` | new, generated |
| `scripts/build-whos-older.ts` | new. Runnable with `node --experimental-strip-types`, as Map quest's daily builder is |
| `docs/features/whos-older/review-sheet.md` | new, generated |
| `src/pages/games/whos-older/WhosOlderGame.tsx` | new: the page, default export |
| `src/pages/games/whos-older/pairing.ts` | new: `orderOf`, difficulty bands. Shared with the build |
| `src/pages/games/whos-older/game.ts` | new: run state (reducer), the ramp, pair picking with the "one stays" rule and no-repeat rules |
| `src/pages/games/whos-older/explain.ts` | new: reason sentences and gap rounding |
| `src/pages/games/whos-older/storage.ts` | new: `bp-whos-older` load and save, tolerant of storage being unavailable; drops a saved run whose stamp no longer matches the data |
| `src/pages/games/whos-older/share.ts` | new: `shareText` for this game; sharing itself through Map quest's `shareResult` (§6.4) |
| `src/pages/games/whos-older/Round.tsx`, `Reveal.tsx`, `Timeline.tsx`, `Screens.tsx`, `whos-older.css` | new: the screens |
| `src/pages/games/registry.ts` | **only** the `whos-older` entry: `status: "live"`, `load: () => import("./whos-older/WhosOlderGame")`. Description unchanged |
| `src/pages/games/README.md` | add a short "Who's older?" section like Map quest's |

No change to shared components, the router, the menu or other games.

---

## 10. Tests (for step 6)

- **pairing.test.ts:** every row of the §5.2 verdict table, including the six "never asked" rows. Strictness: touching windows (`hi == lo`) is not certain. `null` edges never prove order. Blocked pairs beat facts. Exclusions. `yearsBetween` across the BC/AD line (10 BC to AD 15 is 24) and a year 0 rejected. The bands, including a tier-2 pair 1,000 years apart being Medium (not Hard), a fact pair banded by its fact, and two `shown: false` people.
- **explain.test.ts:** gap rounding; a pair with a `shown: false` person prints no number of years.
- **data.test.ts** (on the generated file): ids exist in `people.json` and are not groups. No excluded people. Unique labels. Windows valid; no year 0; every `shown: false` window ends before Abraham's earliest year. Facts agree with windows, no two facts point opposite ways, and the facts contain no loop. Every quote is non-empty. At least 8 partners per person. At least 300 pairs per band. **An independent second check**, written separately from `orderOf`: for 2,000 random pool pairs, if `orderOf` returns an order, then either a fact exists or the windows are disjoint. Nothing else may produce an order.
- **game.test.ts:** the ramp by round number, no repeated pair, the stayer leaves after two rounds, fall back to a lower band then a fresh pair, Streak ends on a miss, Relaxed ends on the third miss, a double tap is ignored. **Side balance:** over 1,000 seeded rounds the left card is right between 40% and 60% of the time, including runs where the stayer comes before everyone.
- **storage.test.ts:** best score kept per mode; a resumed run; an ended run stays ended after reload; a reload before answering brings back the same pair; a saved run with an old stamp is dropped while best scores stay; storage unavailable means play without saving and no crash.
- **WhosOlderGame.test.tsx:** start, play a scripted round with a fixed random seed, reveal text and verse link, run-over screen, share falling back to the copy box.
- The existing [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx) covers the registry entry with no change.
- Run the site's tests and build. Never deploy.

---

## 11. Cost

- **Runtime:** none. No model, no API, no new service. Static JSON in the site bundle, loaded only on the game's route.
- **One-time:** curating about 180 windows and about 60 hand facts is reading work for the implement step: Scripture plus the existing people-pages. **No model batch is needed.** If a later step wants a cheap model to draft `when` lines, it would be under 200 short calls, and it must run under the batch rules ([BatchRunner](Jarvis/Tools/BatchRunner/README.md)), with a pilot and owner approval first. This design does not require it.
- **Licences:** people-pages dates are the site's own research. BSB quotes are already used site-wide. Theographic is read only by the build's cross-check and never shipped, so its share-alike terms do not reach the game.

---

## 12. Edge cases

| Case | Handling |
|---|---|
| Order unknown (Peter/Paul) | Never asked: `orderOf` returns `null` (§5.1). |
| Dates disputed by centuries (Joel, Obadiah, Job) | Wide or open windows, so they meet only people far away. Their `when` line says the dates are disputed and why. |
| Systems disagree (Hezekiah 726 versus 715 BC) | The window spans every system. The game shows a range with "about". |
| Same person under two names (Jacob/Israel, Abram/Abraham, Saul/Paul) | One id, one label; the build merges aliases and fails on duplicates. |
| Same name, different people (two Joels, the Marys, the Herods) | Qualified labels; two people sharing a first name meet only when both labels are qualified (§5.3). |
| Twins | Esau and Jacob are allowed (Genesis 25:25–26 is plain). Perez and Zerah are blocked (§4.5). |
| Adam and Eve, neither born | "Came into the world first", from Genesis 2 and 1 Timothy 2:13. |
| Elijah and Enoch did not die | The game asks only about who came first, so it does not matter. |
| Jesus, God, angels, Melchizedek | Excluded (§3.3). |
| Site period disagrees with the windows | Build warning. The owner resolves it in the review sheet before release. |
| Derived parent link is wrong (an imported identification error) | Cross-checked against the windows (fatal on contradiction) and listed for the owner to strike. |
| A brief gives the answer away ("Moses' brother") | Briefs appear only in the reveal. Cards show a neutral tag. |
| The stayer has no certain partner left | Lower band, then a fresh pair (§6.1). |
| Very long run exhausts pairs | Pair no-repeat relaxes after 400 rounds (§6.3). |
| Double tap or tap during the reveal animation | Cards lock on the first tap. |
| Reload mid-run, or reload right after a miss | The run resumes on the same pair. An ended run stays ended. |
| Data updated while a run is saved | The saved run is dropped (stamp check, §6.4); best scores stay. |
| A pair with an early-Genesis person (Noah and Peter) | No years on the timeline and no number in the reason (§7.1). |
| A stayer who comes before (or after) everyone, such as Adam | Challengers are balanced so the left card is not always right (§6.1). |
| Dates across the BC/AD line | Historians' numbering with no year 0; gaps are not overstated by a year (§4.2.2). |
| Storage blocked (private browsing) | Play works. Best scores show "not saved on this device". |
| Two players on one phone (family) | Relaxed mode. The game keeps no player identity, so it is one shared score. |
| Small phones and landscape | Cards stack under 640 px. The reveal sheet scrolls. |
| Keyboard-only or screen-reader player | §8.5. |
| Other site languages | Labels, tags and `when` lines are English in every language, as in Map quest (a known gap noted in the README). |
| Player thinks an answer is wrong | "Something look wrong? Tell us" goes to `/contact`. The data rules make a wrong pair a curation bug to fix, never a matter of opinion. |
| Generated file edited by hand | The "do not edit" header. Tests check the stamp matches the inputs. |

---

## 13. Open points for the review step and the owner

1. **Is sudden death right for the main mode?** It is the Higher-Lower convention and makes streaks meaningful. Relaxed covers families. The reviewer may swap which mode opens first.
2. **Daily mode.** A shared daily ten with share squares, reusing Map quest's daily rules, is easy to add later. It was left out to keep the first version quick, as the spec says.
3. **Excluding Jesus** (§3.3) is a theological judgement made here. The owner may prefer a special explanation card instead.
4. ~~Importing Map quest's share helper across game folders, or copying it~~. Settled in review: import `shareResult` only (§6.4).
5. **Pool size.** About 180 is enough for long streaks: a rough estimate is 70–80% of the roughly 16,000 possible pairs being certain. The data test's band minimums prove it on the real file.

---

## 14. Sources

- Higher Lower Game: [higherlowergame.com](https://www.higherlowergame.com/); rules and typical scores as described by [playhigherlower.com](https://playhigherlower.com/how-to-play).
- Wikitrivia: [Wikipedia](https://en.wikipedia.org/wiki/Wikitrivia); [Wikimedia Deutschland on Wikidata games](https://www.wikimedia.de/2021/en/themen/playful-learning-with-free-data-the-wikidata-games-wikitrivia-wiki-guessr/).
- Feedback research: J. Hattie and H. Timperley, "The Power of Feedback", *Review of Educational Research* 77 (2007); A. C. Butler, J. D. Karpicke and H. L. Roediger, "Correcting a metacognitive error: feedback increases retention of low-confidence correct responses", *JEP: LMC* 34 (2008).
- Site chronology policy: [Research/People/METHODOLOGY.md §3](Jarvis/Projects/BibleProject/Research/People/METHODOLOGY.md) (Thiele–McFall main system; Albright, Galil, Ussher alternatives; Theographic as a cross-check only).
- Site data examined in this job: [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json), [people-periods.ts](Jarvis/Projects/BibleProject/Website/src/lib/people-periods.ts), [people-pages](Jarvis/Projects/BibleProject/Website/src/data/people-pages/), [Theographic People.csv and Events.csv](Jarvis/Projects/BibleProject/sources/theographic/theographic-bible-metadata-master/CSV/).
- Earlier designs in this chain, for structure and conventions: [map-quest/design.md](Jarvis/Projects/BibleProject/Website/docs/features/map-quest/design.md), [odd-one-out/design.md](Jarvis/Projects/BibleProject/Website/docs/features/odd-one-out/design.md).

---

## 15. Review

**Reviewed:** 2026-11-07, sequence 31 step 5. This was one critical review against approved idea 18, [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md) and the real codebase. Every correction below is already applied in the body above.

**Verdict:** the design fits the spec ("two characters, tap the one who lived first; quick; teaches chronology") and the build rules:
- no running cost;
- it reuses the site's people, family links, people-pages and Berean Standard Bible text;
- it touches only its own files plus its registry and README entries;
- tests and build come in step 6, and nothing is deployed.

Its central idea is sound: ask a pair only when its order is certain on every dating system. But several of its own worked numbers broke that idea, and a few game rules had holes. Fixed as follows.

### What was checked against the codebase, and held

- The `whos-older` entry already sits in [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) as "coming soon". The games [README.md](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) confirms that going live means changing only `status` and adding `load`, as §9 says.
- The routes the reveal links to exist in [App.tsx](Jarvis/Projects/BibleProject/Website/src/App.tsx): `/read/:slug/:book/:chapter`, `/people/:id` and `/contact`. Odd one out's tests already use `/read/bsb/MAT/4?hl=18-19`.
- The ids and fields used in the design are real:
  - in [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json): `moses-exo-2-10`, `israel-gen-25-26` (Jacob, filed as "Israel"), `aaron-exo-4-14`, and the fields `b`, `c`, `p`, `g`;
  - in the per-person files: `pa`, `ch`, `si`, `sp`, `e`.
- The build approach matches Map quest's [build-map-quest-daily.ts](Jarvis/Projects/BibleProject/Website/scripts/build-map-quest-daily.ts): `node --experimental-strip-types`, and a rules file shared with the game. The data folder (`src/data/whos-older/`) and the dynamic import match Odd one out. The tests run on vitest.
- Every Berean Standard Bible wording the design quotes or relies on was read from the site's own text in [data/text/bsb/](Jarvis/Projects/BibleProject/Website/data/text/bsb/). That includes the verses added in this review.

### Corrections

1. **Some example birth windows broke the design's own rules and the site's own dates** (§4.2, §5.2). Each window is meant to cover every dating system on the site. Checked against the reign dates on the site's people-pages, four were too narrow, which is the dangerous direction:
   - **David** ended at 1035 BC. His page's Albright dates put his accession about 1002 BC, and he was thirty then, so he was born about 1032 BC. The window is now about 1090–1030 BC. On the old window, check 6 in §4.6 would have failed the build.
   - **Elijah** ended at 885 BC. Albright's dates have Ahab reigning until 850 BC, so the latest adult birth is 865 BC. The window is now about 1000–865 BC, and Elijah and Isaiah are "at least 25 years apart", not 45.
   - **Moses** ended at 1340 BC. The late Exodus date of 1250 BC plus his 80 years gives 1330 BC.
   - **Joshua** ended at 1310 BC. The design's own allowance for a "young man" a year after a 1250 BC Exodus gives about 1260 BC.

   Peter and Daniel were also narrower than the rule gives. Joel and David are now "at least 130 years apart", not 135. Every changed window now shows its working, and the table says which reign years came from the site.
2. **Ussher's Exodus date was left out** (§4.2.1 step 2). The design promised to cover every system the site recognises. The site's Solomon page carries Ussher's dates, and with 1 Kings 6:1 they put the Exodus in 1491 BC. Moses is now about 1575–1330 BC and Abraham about 2215–1750 BC. No verdict in the examples changes.
3. **The age allowances were too tight** (§4.2.1 step 3). "Boy" and "young man" were both given 12–25 years. But Hebrew uses "boy" for a young warrior (David in 1 Samuel 16:18 and 17:33). Joshua and Paul are called young while holding command or office. The allowances are now:
   - 0–20 years for a child or boy;
   - 12–30 for a youth;
   - 12–40 where the person also holds office.

   A new step 4 allows several anchors per person. Each anchor's window must be wide on its own, and they are combined by their overlap.
4. **Pairs with an early-Genesis person would have printed made-up numbers** (§7.1, §6.3). People from Adam to Abraham have invented placeholder bounds (`shown: false`). Yet the reason sentence and the timeline would still have printed "at least N years" for Noah and Peter. Such pairs now show no years at all: "In the Bible's own order, Noah lived long before Peter." The build checks that all placeholder bounds sit before Abraham's earliest year, and a new rule says how these pairs are banded.
5. **A difficulty-band hole** (§6.3). A tier-2 person 1,000 years from anyone (Methuselah and Paul) met neither the Easy rule nor the Medium rule (gap 100–399), so the pair fell into Hard. Medium now covers any windows gap of 100 years or more between tier-1 and tier-2 people.
   - The undefined "different Testaments" test was dropped. No data field says which Testament a person belongs to, and "at least 400 years apart" covers almost every such pair anyway.
   - Fact pairs are banded by their fact.
6. **The left card could give the answer away** (§6.1). Under "one stays", the stayer is always on the left. A stayer who comes before everyone (Adam) would make "left" right every round. Challengers are now chosen so that the left card is right about half the time, and a test requires 40–60% over 1,000 rounds.
7. **A reload was a free skip** (§6.4). The run was saved only after answers, so reloading before answering dealt a fresh pair. That contradicted the design's own promise that "a reload can neither undo a miss nor skip a question". The pair is now saved when dealt. A saved run is also dropped if the data has changed since, as Odd one out already does with its saved round.
8. **Two generation-gap facts were not certain** (§4.3).
   - Paul and Timothy: many scholars read Philemon 9's "now aged" as "ambassador", so it no longer decides the pair. Acts 26:10 with 1 Timothy 4:12 decides it instead.
   - Samuel and Saul: dropped as a fact. 1 Samuel 12:2 says Samuel was old but nothing about Saul's age, and Saul already had a grown son.

   The fact rule now says a verse that needs an argument to reach the answer is not a fact.
9. **Jacob's sons were left vague** (§4.3). The four mothers' births may overlap in time, so "only where the narrative order is plain" is now an explicit list:
   - one mother's sons in the order she bore them;
   - Reuben before any brother, and Benjamin after any brother;
   - Leah's first four sons before Joseph.
10. **Facts could contradict each other unnoticed** (§4.6). A new check 4a fails the build on two facts pointing opposite ways, or on a loop of facts.
11. **No year 0** (§4.2.2, new). The year numbering and a `yearsBetween` helper are now defined. A gap that crosses from BC into AD is never overstated by a year, which matters because the game promises a minimum gap.
12. **The people-page check is restated** (§4.6 check 6). The pages give reign dates, not birth dates. The check now says how a reign becomes a birth bound for kings with a recorded age, kings without one, and prophets. David is the worked example.
13. **Smaller fixes:**
    - The build reads the per-person family files only on this PC. Releases pack them (the site's AGENTS.md, "Person packs"), so the game must never fetch them (§4.4).
    - Genesis 9:24 was added to the reasons Noah's sons are blocked (§4.5).
    - The share helper question is settled: import Map quest's generic `shareResult`, never edit it, and add this game's own `share.ts` (§6.4, §9, §13).
    - The test plan covers all of the above (§10). It also now counts six "never asked" rows in the verdict table, not four.
    - New edge-case rows were added (§12).

### Left for the owner (unchanged from §13)

- Which mode opens first.
- A daily mode later.
- Whether leaving Jesus out of the cards is right.

None of these blocks step 6. The design's defaults are buildable as written: Streak first, no daily mode, Jesus excluded.
