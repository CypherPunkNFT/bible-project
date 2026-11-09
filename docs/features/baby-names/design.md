# Biblical baby names — research and design

**Feature:** entry 2 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md), "Biblical baby names: a page for every biblical name: meaning, the person's story, verses where it appears. Strong search-traffic draw."
**Step:** research and design (step 7 of sequence 32, "Bible Guide chain C"); reviewed once in step 8, with the corrections applied in place and listed in section 11. Implementation follows.
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the site's [AGENTS.md](../../../AGENTS.md), the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md), [SEO.md](../../../../SEO.md) and the sources register [SOURCES.md](../../../SOURCES.md).
**Date:** 2026-11-07.

## 1. What we are building, in one paragraph

A new section at `/baby-names`. Every name borne by a person in the Bible gets its own page: what the name means (with where that meaning comes from and how sure it is), who bore it and their story, and the verses where it appears, quoted from the Berean Standard Bible. A browse page lists every name with filters for boy or girl, Old or New Testament, first letter and meaning theme, plus a search box and a "popular today" sort. Two landing pages, "Biblical boy names" and "Biblical girl names", target the two biggest searches. Every name page links to the full person page(s) already on the site, and every person page gains one link back. All data is built once, ahead of time, by a script from free sources already on this PC (plus one free US government download). There is no running cost, no model call at runtime, and no model call needed at build time either.

## 2. Research

### 2.1 Who searches, and for what

- **The searches are real but no public volume figure exists for them.** No source gave a monthly figure for "biblical baby names", "bible names for boys" or "bible names for girls", so this design does not invent one. The nearest published numbers (Ahrefs, July 2025) are about 97,000 searches a month for "baby names" and about 21,000 for "unique baby names"; the biblical searches are a slice of that. One blog citing Google Trends puts the yearly peak for baby-name searches in April; that is unconfirmed. If the owner wants a number before release, Google Keyword Planner (free with a Google Ads account) gives one.
- **Biblical names dominate what American parents actually choose.** The US Social Security Administration's 2025 list (published 8 May 2026) has Noah at number 2 for boys. Copies of the same data put Benjamin 11, Levi 12, Elizabeth 17, Samuel 18, Ezra 20, Asher 28, Abigail 41, Naomi 47 and Hannah 56 (these copies could not be checked against ssa.gov, which blocked the research fetch; the build reads the official file itself, section 3.4).
- **Three kinds of search the design serves**, from widest to narrowest:
  1. Lists: "biblical baby names", "bible names for girls", "unique biblical boy names", "biblical names that mean light". The hub, the boy and girl pages and the meaning filter answer these.
  2. One name: "hannah meaning in the bible", "biblical meaning of the name levi", "is eden a biblical name", "who was abigail in the bible". The name pages answer these. No source measured these patterns; that publishers retitle old name dictionaries as "Christian name meaning" pages suggests they pay.
  3. A person, reached through the name: "how many zechariahs are in the bible". The name pages list every bearer, which no competitor does well.

### 2.2 What the existing sites do, and the gap

| Site | What a name page holds | How it handles meaning | Where it falls short |
|---|---|---|---|
| Behind the Name (`/name/ruth`) | Etymology, popularity charts, namesakes. Best filters anywhere: gender, letters, meaning words, length | Editors write each etymology | Almost no story, few verses. Built around the name, not the Scripture |
| Abarim Publications (`/Meaning/Ruth.html`) | Summary, "in the Bible", long etymology | Sets three dictionaries side by side and says plainly when a meaning is unknown | Dense; some readings are its own and odd (Mary as "Myrrhs"); not made for parents; no filters |
| BibleHub topical pages | Hitchcock, Smith, Easton and other old dictionaries stacked, plus every verse | Shows contradictions with no ruling: Ruth is "drunk; satisfied" in one, "friend" in another | A wall of text; no answer |
| Bible Study Tools (Salem) | Hitchcock's 1869 dictionary retitled "Christian Name Meaning" | Prints old guesses as fact, no warning | Wrong meanings with confidence |
| Bible Gateway encyclopedia | Scholarly article | Honest ("meaning unknown") | Not built for name searches; no browsing |
| Parenting sites (Nameberry, The Bump, BabyCenter, Parade, Pampers, MomJunction) | Lists of 100 to 700 names; per-name pages with popularity and heavy advertising | One unsourced line | No verses, no story, and they often merge different people who share a name |

**The gap:** nobody combines a meaning that is sourced and honestly labelled, the bearer's actual story, the verses themselves in a modern translation, a clear separation of different people with the same name, and filters made for parents. The site already holds most of what that takes (2.4), which is why this is a strong traffic feature for little work.

**One example of the confusion this fixes.** Noah, the most popular biblical boy's name in America, is also the name of a woman: Noah, a daughter of Zelophehad (Numbers 26:33), who with her four sisters won the right of daughters to inherit. Her name is a different Hebrew word from the ark-builder's (Strong's gives "movement" for hers, "rest" for his). Most name sites never mention her; some give her the wrong meaning. The page model in this design is therefore **one name, then one or more Hebrew or Greek originals, then one or more people**.

### 2.3 Why most name meanings online are wrong

- **Hitchcock's Bible Names Dictionary (1869)** is the meaning source behind most free name pages, because it is old enough to be free. Its compiler was a church historian, and many entries are guesses from what a name sounds like: Ruth "drunk; satisfied", Jesse "gift; oblation; one who is", Esther "secret; hidden" (the name is Persian, probably "star"), Hannah "gracious; merciful; he that gives".
- **Strong's Concordance (1890)** gives a short derivation for every Hebrew and Greek name and is far more careful, but it has its own habits: it writes "Jehovah", it sometimes gives an adverb where a parent wants a noun (Miriam, and so Mary: "rebelliously"), and for many names it only points to another entry ("the same as 8282").
- **The Bible sometimes explains a name itself**, usually by wordplay rather than etymology: Eve "because she would be the mother of all the living" (Genesis 3:20), Isaac and laughter (Genesis 21:6), Samuel "because I asked the LORD for him" (1 Samuel 1:20). The Berean Standard Bible's footnotes state these plainly and honestly hedge them ("Noah sounds like the Hebrew for rest or comfort"; "Seth probably means granted or appointed").
- **Some meanings are genuinely unknown or contested.** Mary/Miriam has been read as "bitter", "rebellion" and an Egyptian "beloved"; "star of the sea" is a much later title for Jesus' mother, not a meaning. Ruth may mean "friend". Esther is Persian.

The design's answer (section 3.3): show the Bible's own explanation first when there is one; give a plain meaning drawn from Strong's otherwise; label every meaning with how sure it is; keep Hitchcock only as a clearly labelled "older dictionary" line; and hand-check the most-searched names.

### 2.4 What the site already has that we reuse

- **Every named person** (3,133 entries, from STEP Bible's proper-names data, [TIPNR](../../../../sources/stepbible/TIPNR.txt)): the index [people.json](../../../data/study/people.json) gives each person's id, name, other spellings, a one-line description, reference count and period; each detail file in [data/study/people/](../../../data/study/people/) gives sex, tribe, family links, a short summary, a longer article, every verse reference, and for 252 people a written story. Loaders: `loadPeople()` and `loadPersonDetail(id)` in [study.ts](../../../src/lib/study.ts). Person pages live at `/people/<id>` (ids like `hannah-1sa-1-2`), and [PersonProfile.tsx](../../../src/components/study/PersonProfile.tsx) already says "one of N people named X". Measured: **1,762 distinct names** among the individuals (groups excluded); 546 of them have 5 or more references in total, 320 have 10 or more, and 219 have at least one bearer with a written story. The most shared: Zechariah (29 people), Shemaiah (26), Maaseiah and Meshullam (20 each), Azariah (19).
- **The Berean text**, one book per file in [data/plain/bsb/](../../../data/plain/bsb/) (plain words, 128 KB for 1 Samuel, 232 KB for Psalms) and a few chapters per file in [data/text/bsb/](../../../data/text/bsb/) (the reader's chunks, located by `textChunkPath` in [data.ts](../../../src/lib/data.ts)). Helpers in [verses.ts](../../../src/lib/verses.ts) (`useVerses`, `resolveVerses`, `verseReference`) read the **whole plain book** for any verse in it, which is fine for a handful of verses; `loadChapterPlain` in [data.ts](../../../src/lib/data.ts) reads just the chunk holding one chapter, which is what a long verse list needs (4.1, item 8). The verse helpers default to the Bible of the site's language, so every call must pass `"bsb"` (copy [usePackPassages.ts](../../../src/pages/life-events/usePackPassages.ts)).
- **Name-meaning sources already on this PC** (3.1): Strong's dictionaries, the Brown-Driver-Briggs Hebrew lexicon, the Berean's own footnotes, Hitchcock.
- **The long-list machinery:** [useRowWindow.ts](../../../src/lib/useRowWindow.ts) with [row-window.ts](../../../src/lib/row-window.ts) renders 50 rows above and below the visible area and loads as you scroll, exactly what the build rules require.
- **The search-engine machinery** ([SEO.md](../../../../SEO.md)): [page-head.ts](../../../src/lib/page-head.ts) names each page from its heading and first long paragraph; the sitemap and the ready-made plain-HTML copies for crawlers come from the page inventory in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts).
- **The new-baby verse packs** at `/life-events/new-baby`, `/life-events/expecting`, `/life-events/adoption` and `/life-events/baby-dedication` ([new-life.ts](../../../src/data/life-events/new-life.ts)). A parent choosing a name is the same visitor; the name pages link there.

**Not reused:** `/study/names` is already the Names of God page ([NamesPage](../../../src/pages/study/), data `data/study/names.json`), so this feature cannot live there. Theographic's people data (CC BY-SA, share-alike) is not used, so the pages carry no share-alike obligation. STEP's machine-written summaries in TIPNR are not newly published by this feature: the name page shows the same `short` summary the person pages already show, and no more.

## 3. Data sources and the meaning method

### 3.1 Sources

| Source | Where on this PC | Licence | Used for | Credit on the page |
|---|---|---|---|---|
| STEP Bible TIPNR proper names | [sources/stepbible/TIPNR.txt](../../../../sources/stepbible/TIPNR.txt) | CC BY 4.0 (Tyndale House) | Which people bear each name; each person's sex; the Hebrew or Greek form and its individual Strong's number; all references | "People data: STEP Bible" linked to www.STEPBible.org (required by its licence) |
| Site people data (built from TIPNR) | [data/study/](../../../data/study/) | as above | Person ids for links, one-line descriptions, summaries, stories, period | as above |
| Strong's Hebrew and Greek dictionaries (1890), Open Scriptures edition | [HebrewStrong.xml](../../../../sources/openscriptures/HebrewLexicon/HebrewLexicon-master/HebrewStrong.xml) (Hebrew, with BDB cross-links) and [strongs-greek-dictionary.js](../../../../sources/openscriptures/strongs/strongs-master/greek/strongs-greek-dictionary.js) | Public domain text; the Hebrew file's edition is CC BY 4.0, credit Open Scriptures | The main meaning, the root word, the origin language, related names | "Meanings: Strong's Concordance (Open Scriptures edition)" |
| Berean Standard Bible text and footnotes | [sources/ebible/engbsb/](../../../../sources/ebible/engbsb/) (USFM, with footnotes) and [data/plain/bsb/](../../../data/plain/bsb/) | Public domain | Verses; the Bible's own name explanations (175 footnotes of the form "Naomi means pleasant", "Samuel sounds like the Hebrew for heard of God", covering 132 names) | "Scripture quotations are from the Berean Standard Bible (public domain)." |
| Hitchcock's Bible Names Dictionary (1869), CCEL edition | [hitchcock-bible-names.xml](../../../../sources/ccel/hitchcock-bible-names.xml) (2,623 names) | Text public domain; CCEL's markup is not reused | Only the collapsed "older dictionary" line (3.3) | "Older meaning: Hitchcock's Bible Names (1869)" |
| US Social Security Administration baby names, national file | **not yet on this PC**: free download `https://www.ssa.gov/oact/babynames/names.zip`, added to [fetch-sources.py](../../../scripts/fetch-sources.py) and [SOURCES.md](../../../SOURCES.md) with its checksum. SSA replaces the file at the same address every May, so the register records the data year beside the checksum and a new year means a new checksum, not a failed download | US government work, public domain | "Popular today" rank and sort; which names count as in use | "US popularity: Social Security Administration, 2025" |

**Deliberately not used for published text:**
- The long "Meaning" column of STEP's lexicons (TBESH, TBESG): it is Online Bible's abridged BDB, and STEP's own note says permission must be gained before using it (recorded in [SOURCES.md](../../../SOURCES.md), STEPBible section). The same "Hannah = grace" style lines also appear inside Open Scriptures' `StrongHebrewG.xml`, so the build reads **only** the `<source>` and `<meaning>` elements of `HebrewStrong.xml`, which are Strong's own words.
- Theographic (share-alike, see 2.4).
- Any website's meanings (Abarim, Behind the Name and the rest are copyright).

**SOURCES.md note:** the register currently says Hitchcock supplies "the meaning of each name on person and place pages". The implementation step updates that line to say Hitchcock is shown only as a labelled older meaning on the baby-name pages, and adds the SSA file.

**Cost and dependency check (the owner's cost rule):** nothing here costs money. The SSA file is a free, account-free download made once per year at build time; if ssa.gov disappeared, the site would keep working with the last file it has. No paid API, no cloud service, no runtime call.

### 3.2 Which names get a page

- **The unit is the English spelling as the Berean prints it.** All people spelled the same share one page (the 29 Zechariahs are one page with 29 people on it). Different spellings get different pages (Miriam and Mary are two pages, linked to each other).
- **Two-word entries** ("Mary Magdalene", "Sergius Paulus") are mapped by hand in the spelling file to the given name's page (Mary Magdalene is a bearer on the Mary page, her epithet kept on her card). There are only a handful.
- **Spelling comes from the Berean, not from TIPNR.** TIPNR uses ESV spellings, which occasionally differ. The build takes the spelling found in the Berean text of the person's verses (the USFM carries Strong's tags beside each word, which locates it), keeps TIPNR's and KJV forms as "also spelled", and lists every case it could not match so a hand-made correction file settles it (3.5). A name whose Berean spelling cannot be confirmed fails the build rather than publishing a guess.
- **Who is included:** every individual in the people data who has an actual name (1,762 distinct entries, of which about 55 are descriptions standing in for a name, "Daughter of Pharaoh", "Unnamed ancestor of Joseph…", "Huge man"; a person qualifies only when TIPNR gives a Hebrew or Greek proper-name form for them, which removes those), minus the exclusions below, plus a small hand-chosen set of **place and other names that parents use** (about 30: Eden, Jordan, Bethany, Sharon, Shiloh, Zion, Salem, Carmel, Galilee, and the angel Gabriel, who is missing from the people data). Their "bearer" section shows the place, with a link to its atlas page, or for Gabriel the passages where he appears (Daniel 8:16, 9:21; Luke 1:19, 1:26). Note: Eden is also a person (two Levites under Hezekiah), so the Eden page carries both.
- **Excluded entirely:** names and titles of God (they belong to `/study/names`), Satan and the names of evil spirits (Baal-zebub, Abaddon, Legion), the names of pagan gods, and groups (the 78 people-group rows). The excluded list is a small hand-written file with a reason per entry, so the review can check it.
- **Jesus** gets a page, written with reverence: it says the name means "the LORD saves" (the Berean's own note at Matthew 1:21), that it is the Greek form of Joshua, that it is widely given to boys in Spanish- and Portuguese-speaking families (Jesús) and rarely in English-speaking ones, and it links to the Gospels study (`/study/gospels`) and his person page rather than trying to tell his story in a card. Immanuel ("God with us", the Berean note at Isaiah 7:14) gets a page as a name given to children (Emmanuel).
- **Two kinds of page, one template** (the search-engine reason is in 6.4): about 600 to 700 **full pages** (a name is full when any bearer has 5 or more references, or the Berean explains it, or a bearer has a written story, or the spelling is in the SSA top 1,000 for either sex in the latest year) are indexed and listed in the sitemap; the other roughly 1,000 **short pages** (mostly names mentioned once or twice, in genealogies and lists) exist, are reachable from the browse page, and tell search engines not to list them. The build prints the exact counts.

### 3.3 The meaning method

Every name page shows one **headline meaning** (a few words), a **confidence label**, and underneath it the sources it came from. The build chooses them by these rules, in order; no model is involved, so the result is repeatable and testable.

1. **Hand-checked override** (file `meaning-overrides.json`, 3.5). Used for names where the automatic rule would mislead. Every override must cite at least one source from 3.1 by name and entry number; a test rejects one that does not. The implementation step writes overrides for at least these known problems: Mary and Miriam (Strong's "rebelliously" alone would be the headline; the override gives "meaning uncertain" with the main proposals named, "bitter", "rebellion", Egyptian "beloved", and says "star of the sea" is a later title), Elijah (Strong's "God of Jehovah" becomes "my God is the LORD"), Esther (Persian, probably "star", from the Strong's note "of Persian derivation" plus Easton's public-domain article), Ruth ("probably friend", keeping Strong's own "probably"), Jesse (Strong's gives no clear gloss), and every Hebrew name whose Strong's gloss is an adverb or verb form where a phrase reads better ("let him add" for Joseph stays, it is accurate; adverbs do not).
2. **The Bible's own explanation.** If a Berean footnote says "X means …", that is the headline, labelled **"Given in the Bible"**, and the naming verse is quoted. If the footnote says "sounds like" (wordplay, 35 of the 175), the page shows it as **"Wordplay in the Bible"** and takes the headline from Strong's (rule 3), so Noah reads "rest" with the Genesis 5:29 wordplay on "comfort" shown beneath. "Probably" or "possibly" in the footnote gives the label "Probable". A note can do both ("Reuben means Look, a son and also sounds like the Hebrew for He has seen my misery", Genesis 29:32): the "means" part is the headline and the wordplay is shown beneath. A note belongs to the original word tagged at that verse in the USFM (its Strong's number), not to the English spelling, so the Genesis 5:29 note joins the ark-builder's meaning block and never the other Noah's. Notes about places ("Nod means wandering", Babel) are ignored unless the place is one of the extra names (3.2).
3. **Strong's gloss.** The text after the derivation in Strong's entry (for Hannah, H2584: "from H2603; favored" → "favored"). Where the entry only points elsewhere ("the same as 8282", "a form of 3076", "a variation of 5833", "for 7468", or in Greek "of Hebrew origin (H3110)"), the build follows the pointer, up to three steps, until it reaches a gloss: John → Johanan → H3076 "Jehovah-favored" (cleaned to "favored by the LORD"); James → Jacob → "heel-catcher (i.e. supplanter)"; Elizabeth → Elisheba → "God of (the) oath". When the chain ends on an ordinary word's entry rather than a name's, that entry holds a full dictionary definition, not a short gloss (Sarah → H8282 "a mistress, i.e. female noble lady, princess, queen"; Ezra → H5833 "aid help(-ed, -er)"; Rachel → H7353 "a ewe [the females being the predominant element of a flock]…"; Stephen → G4735 "a chaplet (as a badge of royalty…)"). The build then takes only the definition's first phrase as a draft and **puts the name on the hand-check list automatically**; an override settles the wording ("princess", "help", "ewe", "crown"). Label **"Probable"**, or **"Probable (Strong's says 'probably')"** when Strong's itself hedges.
4. **No gloss reachable.** Strong's says "of foreign origin", "of Persian derivation", "of Egyptian derivation", "of Latin origin" or gives nothing usable: headline **"Meaning uncertain"**, label **"Uncertain"**, with the origin language stated ("a Persian name"). Paul is the one common exception, because Strong's itself gives "(little)": headline "small", label "Probable", origin "Latin".
5. **Wording clean-up**, applied to every automatic headline and tested: "Jehovah" becomes "the LORD" (and "Jehovah-saved" style compounds become "saved by the LORD"); the source's spelling is kept (the site's own copy uses both "favor" and "favour", so there is no house rule to impose); trailing semicolons and Strong's cross-reference numbers are removed; the headline is at most 40 characters, otherwise it goes to the override list.

**Hitchcock** appears only inside a closed "Older dictionary meaning" disclosure, labelled with the book and year, and only when it differs from the headline, with one fixed sentence: "Nineteenth-century dictionaries often guessed a meaning from how a name sounds; the meaning above follows the Hebrew [or Greek] word itself." It never feeds the headline, the page description, the theme filter or the browse list. "Same as Miriam" style entries are read as cross-references, not meanings.

**Names that share an English spelling but not an original word** (Noah, and the other 15 names borne by both men and women; and any name with two Strong's numbers) get **one meaning block per original**, each tied to the people who bore that form. The headline in the browse list is the one belonging to the bearer with the most references, followed by "(and others)".

**The hand check.** Before the implementation step calls the data done, it prints a review sheet (a CSV in the job's own folder, not in the site) of the 150 names with the highest SSA rank plus every name with an override, showing headline, label, Strong's text, Berean note and Hitchcock side by side, and checks each by eye against the Brown-Driver-Briggs entry in [BrownDriverBriggs.xml](../../../../sources/openscriptures/HebrewLexicon/HebrewLexicon-master/BrownDriverBriggs.xml). Anything wrong becomes an override with its citation.

### 3.4 The other things each name carries

| Field | How it is worked out |
|---|---|
| Gender in the Bible | From the bearers' sex in the people data: boy, girl, or both. Names whose bearers' sex is not stated (about 90) are shown as "not stated" and appear only under "All" |
| Used today | From the SSA national file for the latest year: rank for boys and for girls, where the exact spelling ranks. Shown as "#56 for girls in the US, 2025". When modern use differs from the Bible ("Ariel: two men in the Bible; today mostly given to girls"), the page says so in one generated sentence from the two facts |
| Testament | From each bearer's **period** in the people data, not the first verse: Jesus' first reference in the data is Isaiah 7:14, which would wrongly make him "Old Testament". Periods "life-of-christ" and "early-church" count as New Testament, the other nine periods in the data as Old; a name with bearers in both is "both" and appears under either filter (20 names, for example Zechariah, Joseph, Simeon). 75 rows in [people.json](../../../data/study/people.json) have no period; today all of them are people groups, which are excluded, but if a named person ever arrives without one, the testament falls back to the book of their first reference and the build lists them |
| Origin language | Hebrew, Aramaic, Greek, Latin, Persian, Egyptian, Babylonian or "other", from the Strong's derivation wording, then the Strong's number's letter (H or G) |
| Original word | Hebrew or Greek with its transliteration, from TIPNR and Strong's (חַנָּה, Channah) |
| Root and related names | Strong's root numbers give "Names from the same root" (Hannah, Hananiah, Johanan, John all go back to the root "to be gracious"); the Greek "of Hebrew origin" pointers give "The same name in the other Testament" (Mary ↔ Miriam, Jesus ↔ Joshua, John ↔ Johanan, James ↔ Jacob, Elizabeth ↔ Elisheba); the people data's other spellings and TIPNR's give "Also spelled" |
| Meaning themes | Up to two, from a fixed keyword list applied to the headline meaning only: God and the LORD; grace and favour; gift; joy and praise; light; strength and courage; peace and rest; help and rescue; love and friendship; nature (plants and animals: Rachel ewe, Deborah bee, Jonah dove, Tamar palm tree, Susanna lily); royalty. "Meaning uncertain" names get no theme. The keyword list lives in code and is tested name by name for the 150 checked names |
| Who, in one line | The best-known bearer's one-line description from the people data ("Mother of Samuel"), plus "and N others" |
| Key verses | Up to six per bearer, chosen by rule: the first appearance, the naming verse if the Berean explains the name, then the first verse in each further book, in Bible order |
| Caution line | A short hand-written list (about 25: Jezebel, Cain, Delilah, Judas Iscariot's entry on the Judas page, Herod, Haman, Ahab, Athaliah, Nimrod and similar) where the best-known bearer is remembered for evil. The page tells the story honestly anyway; the line just says it plainly at the top ("In the Bible, Jezebel is remembered as the queen who promoted Baal worship and had Naboth killed"), so no parent is caught out. It is information, not a ruling on whether to use the name |

### 3.5 The build script and what it writes

- **Script:** `scripts/bible/build_baby_names.py`, Python like its neighbour [study_people.py](../../../scripts/bible/study_people.py), run by hand when a source changes (TIPNR tracks STEP's master branch, so person ids can drift; the script checks every person id it links to exists in [people.json](../../../data/study/people.json) and fails loudly if not).
- **Hand-written inputs** in `scripts/bible/baby-names/`: `meaning-overrides.json` (each with a citation), `spelling-overrides.json`, `excluded.json` (with reasons), `extra-names.json` (the place and other names, each with its atlas id or passages), `cautions.json`, `themes.json` (the keyword list, shared with the tests).
- **Outputs, served as static files** (the site's file budget is 100,000 per release; it uses about 43,000, so about 1,800 more is safe):
  - `data/baby-names/index.json`: one compact row per name (slug, name, gender, testament, headline meaning, label, themes, who-line, reference count, SSA ranks, full or short). About 1,800 rows, roughly 250 KB raw and 50 KB compressed: loaded once by the browse page.
  - `data/baby-names/names/<slug>.json`: everything one name page needs in one fetch: originals with meanings and sources, bearers (person id, one-line description, summary or story opening, sex, period, key verse references, all verse references), related names, caution, Hitchcock line. Bearer text is copied in at build time, so the name page never reads the per-person files (which a release swaps for packed files, per [AGENTS.md](../../../AGENTS.md)).
  - `data/baby-names/index.json` also carries an `aliases` table (every other spelling, TIPNR spelling and two-word name that should land on a page → that page's slug), which the name page uses for its redirects (5.1).
  - `src/data/baby-names/person-links.json`: the short list of **exceptions** for the link on person pages (6.5): person id → name-page slug where the slug rule applied to the person's listed name would land on the wrong page or none (spelling corrected to the Berean's, two-word names such as Mary Magdalene, alternative forms), and person id → `null` where the person gets no link (excluded names, people without a real name, groups). Expected to be a few hundred entries, a few kilobytes, so it can sit in the code bundle and the person page makes no extra download.
  - Verse **text** is not copied into these files; pages fetch it from the Berean files the site already serves.
- **Slug rule:** lower case, letters only, hyphens kept (`maher-shalal-hash-baz`), accents removed. A test proves every slug is unique and none clashes with a reserved word (`boys`, `girls`, `meaning`, `letter`, `search`).

## 4. The name page

Address `/baby-names/<slug>`, for example `/baby-names/hannah`.

### 4.1 Top to bottom

1. **Breadcrumb:** "Baby names › Hannah" (short, under 60 characters, so it never becomes the search description).
2. **Heading (`h1`):** the name, large, followed on the same heading by "Meaning in the Bible" in smaller type, so the heading reads "Hannah: Meaning in the Bible" (a visually hidden colon keeps it one phrase when read as text). The site turns this into the tab and search title "Hannah: Meaning in the Bible · Bible Guide" automatically. The name itself carries `translate="no"`, so the page translator never turns Hannah into Ana on a Spanish visit.
3. **Fact line:** "Girl's name · Hebrew חַנָּה (Channah) · Old Testament · 1 person · 11 verses · #56 for girls in the US, 2025". The Hebrew carries `lang="he" dir="rtl"`; Greek carries `lang="grc"`.
4. **Opening paragraph**, built from the data by a fixed template and always the first paragraph of 60 or more characters inside the main area, because it becomes the search description. Example: "Hannah is a girl's name from the Hebrew Channah, meaning "favored". In the Bible it belongs to one woman: the mother of the prophet Samuel, first named in 1 Samuel 1:2." Every clause comes from a data field (the bearer's one-line description and first reference); the template never adds story details the data does not hold, since no model writes these sentences. The template has variants for one bearer, several bearers ("Zechariah is a boy's name from the Hebrew Zekaryah, meaning "the LORD has remembered". Twenty-nine men in the Bible bear it, among them the prophet Zechariah and the father of John the Baptist."), meaning uncertain, and renamed people ("Abram is the name Abraham was born with…").
5. **Caution line**, if the name has one (3.4).
6. **"What the name means":** one block per original word: headline meaning, confidence label as a small badge ("Given in the Bible", "Probable", "Uncertain"), the Berean's own explanation with the naming verse quoted, Strong's wording with its number, the root word, and the closed "Older dictionary meaning" line when it differs.
7. **"Hannah in the Bible":** one card per bearer, in order of reference count: their one-line description; their story opening (the written story's first paragraph where the person has one, otherwise the same short summary the person page shows); their key verses quoted in full from the Berean; and **"Read Hannah's full story"**, linking to `/people/<id>`. People with more names than one say so ("also called Hadassah"). When more than five people share the name, the top three get full cards and the rest are compact rows (description, reference count, link); no name has more than 29 bearers, so this list never needs the long-list window.
8. **"Every verse that names Hannah":** all references across all bearers, in Bible order, each with its text and a link to the reader at that verse (`/read/bsb/<BOOK>/<chapter>?hl=<verse>`). Short lists render whole. Long ones (David has about 1,100) use the row window from [useRowWindow.ts](../../../src/lib/useRowWindow.ts): about 50 rows above and below the visible area, loading as the reader scrolls, with each row's text fetched through `loadChapterPlain` (the reader's few-chapter chunks, [data.ts](../../../src/lib/data.ts)) as it comes into range, so a name with a thousand verses never downloads half the Old Testament at once. The cut-off between "short" and "long" is the same as the window's: lists of 100 verses or fewer render whole through `useVerses` with `"bsb"`; longer ones use the window and the chunk loader, never `resolveVerses`, which would read every whole book the list touches. Verse text sits in an element with the class `scripture` and `lang="en"`, so the translator never changes it.
9. **"Related names":** same name in the other Testament, also spelled, names from the same root, and three names with the same theme and gender. Each a link.
10. **"For a new baby":** links to the verse packs `/life-events/new-baby`, `/life-events/expecting` and `/life-events/baby-dedication`.
11. **Sources line:** "Scripture quotations are from the Berean Standard Bible (public domain). People data: STEP Bible (link). Meanings: Strong's Concordance, Open Scriptures edition; the Berean's notes; US popularity: Social Security Administration." Hitchcock is named only when its line is shown.

### 4.2 Two hard cases worked through

- **Mary** (`/baby-names/mary`): fact line "Girl's name · Greek Μαρία (Maria), from Hebrew Miriam · New Testament · 6 women…". Meaning block: headline "Meaning uncertain", badge "Uncertain", one sentence on the three main proposals and the later "star of the sea" title, Strong's wording shown as Strong's wording. "Mary in the Bible" lists Jesus' mother first (most references), then Mary Magdalene, Mary of Bethany, Mary the wife of Clopas, Mary the mother of John Mark, and Mary of Rome (six women; the people data files Mary Magdalene under her two-word name, which the spelling file maps here, 3.2). "The same name in the other Testament": Miriam.
- **Noah** (`/baby-names/noah`): "Boy's and girl's name". Two meaning blocks: "Noah, the ark-builder: rest (Genesis 5:29 plays on 'comfort')" and "Noah, daughter of Zelophehad: movement". Two bearer cards. Used today: "#2 for boys in the US, 2025".

### 4.3 Short pages

A short page uses the same template; sections with nothing in them are left out, heading and all. It always has the opening paragraph, the meaning block, the bearer card and the verse. It sets `<meta name="robots" content="noindex,follow">` while it is shown (and removes it when the visitor leaves, as [RecipientCard.tsx](../../../src/pages/sympathy/RecipientCard.tsx) already does), and it is not in the sitemap, so it gets no ready-made copy: a crawler that does not run the page's code receives the site's plain shell, which has nothing in it to index. Visitors see no difference.

## 5. Browse and filter

### 5.1 Addresses

| Address | What it is | Search title (`ROUTE_TITLES` in [page-head.ts](../../../src/lib/page-head.ts)) |
|---|---|---|
| `/baby-names` | Every name, with all filters | "Biblical Baby Names: Meanings and Bible Stories" (47 characters) |
| `/baby-names/boys` | The same list, starting filtered to boys, with its own heading and opening paragraph | "Biblical Boy Names: Meanings and Bible Stories" |
| `/baby-names/girls` | The same, for girls (names borne by women, by both, and the girl-used place names) | "Biblical Girl Names: Meanings and Bible Stories" |
| `/baby-names/<slug>` | A name page | from its heading (4.1) |

Each of the three list pages has its own `h1` ("Biblical Baby Names", "Biblical Boy Names", "Biblical Girl Names") and its own opening paragraph naming how many names it holds, so they are three distinct pages, not one page three times. An unknown slug shows the site's own [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) (the crawler-copy step recognises a missing page by its heading, "Nothing is written here."). A slug typed with capitals or an old spelling (`/baby-names/Elias`) redirects in place to the right page (`/baby-names/elijah`), looked up in the index's `aliases` table (3.5), with the page saying "Elias is the Greek form of Elijah, used in the King James New Testament". The same table catches person-page links whose listed spelling differs from the Berean's.

### 5.2 The list

- **Search box** at the top: matches the start of the name and any "also spelled" form, as you type ("eli" finds Eli, Eliab, Elias → Elijah, Elijah, Elisha, Elizabeth…).
- **Filters**, each a row of buttons, combinable:
  - **Boy · Girl · Both · All** (the boy and girl pages start with theirs selected).
  - **Old Testament · New Testament · All.**
  - **Letter:** A to Z, plus All. Letters with no names are shown but disabled.
  - **Meaning:** the eleven themes from 3.4, as chips; choosing one shows only names with that theme.
  - **Show: well-known names · all names.** "Well-known" is the full-page set (3.2) and is the default, so a parent is not shown Maaseiah before Miriam; "all names" adds the short pages. The count of names matching is always shown ("214 names").
- **Sort:** Popular today (SSA rank, names without a rank after, then A–Z) · A–Z · Most mentioned in the Bible. Default is Popular today on the boy and girl pages and A–Z on the hub. "Popular today" uses the boys' rank when the Boy filter is on, the girls' rank when Girl is on, and the better of the two otherwise.
- **Each row:** name (link), a small boy/girl marker with a text label (not colour alone), headline meaning with its badge when it is "Uncertain", the who-line, and OT/NT. Rows, not cards, per the build rules.
- **Long list:** up to about 1,800 rows, through [useRowWindow.ts](../../../src/lib/useRowWindow.ts): about 50 rows rendered above and below the visible area, more appearing as the visitor scrolls, no "load more" button.
- **Filter state in the address** (`/baby-names?g=girl&t=nt&l=m&m=light&sort=popular`), so a filtered list can be shared and the back button works. The official address (`canonical`) of every filtered view stays the plain page address, so search engines never see hundreds of filter combinations as separate pages.
- **No results:** "No names match all of these. Remove a filter" with buttons that clear each active filter.
- **For crawlers:** ready-made copies are made by [capture.ts](../../../scripts/seo/capture.ts), which reads the page as a browser shows it, so a list page's copy holds only the rows the window has drawn at capture time (the first screenful plus the 50-row margin, roughly 60 to 80 rows), and filtered views are not captured at all, since the inventory drops the part of an address after "?". Engines that do not run the page's code therefore reach the name pages through the sitemap (every full page), the "Related names" links on each captured name page, and the two landing pages. No special crawler-only list is built.

## 6. Search-engine plan

### 6.1 Titles and descriptions

- List pages: titles in `ROUTE_TITLES` (5.1). Name pages: "Hannah: Meaning in the Bible · Bible Guide" from the heading, which matches the commonest wording of the search ("hannah meaning in the bible", "biblical meaning of hannah"). A very long name runs past 60 characters and is shortened by the search engine; acceptable, as those are short pages.
- Descriptions: the opening paragraph (4.1, item 4), which always states the meaning and the main bearer in its first sentence. `baby-names` is **not** added to the site's section list (`SECTIONS`), which would append "· Baby Names" and push titles past 60 characters.
- Canonical: the page's own address, set automatically. Filters never change it (5.2).

### 6.2 Sitemap and ready-made copies

- One new page type, "baby-name", in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), listing the three list pages and every **full** name page, from one exported function `babyNamePaths(rows)`, following the life-events pattern (`lifeEventPaths()` in `src/data/life-events/`, imported by the same file). `babyNamePaths` is a pure function over the index rows, so the browser code can import its module safely; the inventory reads `data/baby-names/index.json` with its existing `readJson` helper and passes the rows in. The sitemap ([pages.ts](../../../scripts/seo/pages.ts)) and a test both use it, so a name that becomes "full" later reaches the sitemap by itself. The type must not be added to the sitemap-only list in `pages.ts`: these pages should get ready-made copies.
- Ready-made copies: about 650 more files, within the site's copy budget (99,500 in [build.ts](../../../scripts/seo/build.ts); about 1,700 copies exist today). Copies are captured from the live site, so they appear only after the owner releases the feature; until then the capture skips the addresses.
- After a release (the owner's call; this feature never deploys): `bun run seo:capture --only /baby-names`, commit the captures, then `bun run seo:indexnow`, as [SEO.md](../../../../SEO.md) describes.

### 6.3 Structured data

None. The site has no per-page structured data anywhere, and none of the obvious types earns anything here: Google stopped showing FAQ rich results for most sites in August 2023 and for every site from 7 May 2026, and there is no rich result for a name or its meaning. The opening paragraph's first sentence ("Hannah is a girl's name from the Hebrew Channah, meaning "favored"") is the shape search engines and AI answers quote, which does more than markup would.

### 6.4 Not tripping the "mass-produced pages" rule

Google's spam policy targets large numbers of pages that add nothing, however they are made. About 1,000 of the names appear only once or twice in the whole Bible (measured: 765 of 1,762 names have three or more references), mostly in genealogies; a thousand indexable pages that each say "son of X, 1 Chronicles 4:17" would look exactly like that and could drag the whole section down. So:
- Only full pages (3.2) are indexed and in the sitemap; short pages exist for the owner's "a page for every biblical name", serve visitors who arrive from the browse list or a person page, and say `noindex`.
- Every full page is different in substance: its own meaning with sources, its own people, their own verses quoted in full, its own related names. The template supplies structure, the data supplies the content.
- The opening paragraph is never the same twice: the template varies by number of bearers, gender, meaning confidence and renaming.

### 6.5 Links in

- From every person page (the only shared-file change beyond the usual route, title, sitemap and home-line registration, so it is kept to one line): under the person's name, "The name Hannah: meaning and everyone who bore it", linking to `/baby-names/<slug>`. The slug is the slug rule applied to the person's listed name, **unless** the person appears in the small exceptions file `src/data/baby-names/person-links.json` (3.5): the listed names come from TIPNR (ESV spellings, two-word names), while the name pages use the Berean's spelling, so the plain rule alone would send some links to the wrong page or to none. An exception entry gives the right slug, or `null` for no link (excluded names, people without a real name, groups). No extra download on the person page. A test proves every person in the people index either has `null` or resolves to a slug that exists in the built index.
- From the home page: one new line of link text in the Resources block of [HomePage.tsx](../../../src/pages/HomePage.tsx) (around line 278), beside the existing life-events and sympathy lines (other chains running in parallel may add their own lines here, so the implementation re-reads the file just before editing and adds its line without touching the others): "Biblical baby names: meanings and the people who bore them". A new line, not a new feature block (a new block would be a home-page redesign needing the owner's mock-up approval) and not a reworded paragraph (the site's translations are keyed by each paragraph's exact English).
- No top-navigation entry: the navigation is full and the build rules ask for minimal shared changes.
- Not done here, and left for the owner or the life-events feature to choose: a link from the new-baby verse pack back to the names. It is that feature's file.

## 7. Building it

### 7.1 Files

| File | Change |
|---|---|
| `scripts/bible/build_baby_names.py` and `scripts/bible/baby-names/*.json` | New: the build script and its hand-written inputs (3.5) |
| `scripts/fetch-sources.py`, [SOURCES.md](../../../SOURCES.md) | Add the SSA download and its checksum; correct the Hitchcock line |
| `data/baby-names/` | New: built output |
| `src/pages/baby-names/` | New: `BabyNamesPage.tsx` (nested routes), `NameList.tsx`, `NamePage.tsx`, `useBabyNames.ts` (loading), styles |
| `src/data/baby-names/index.ts` | New, browser-safe (no file-system access): `babyNamePaths(rows)`, the one copy of the slug rule, and `nameLinkFor(person)` for the person-page link, shared by the pages, the inventory, the person page and tests. The Python build applies the same slug rule, and a test checks the two agree on every name |
| `src/data/baby-names/person-links.json` | New, written by the build: the exceptions for person-page links (3.5) |
| [App.tsx](../../../src/App.tsx) | Two lines: a lazy import and `<Route path="/baby-names/*">` |
| [page-head.ts](../../../src/lib/page-head.ts) | Three `ROUTE_TITLES` entries |
| [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts) | One page type |
| [HomePage.tsx](../../../src/pages/HomePage.tsx) | One line |
| [PersonProfile.tsx](../../../src/components/study/PersonProfile.tsx) | One link (6.5) |

The source register and fetch script go beyond the build rules' "own files plus registry and navigation entry", but every feature that brings in a new source registers it there (Bible Wordle did the same on 7 November 2026), so they stay; the SOURCES.md change is a new section at the top plus the one corrected Hitchcock line (line 1410 today); every other shared file gets only the lines listed.

### 7.2 Tests (added in the implementation step, run with the site's `test` and `build`)

The site's `test` command runs the content tests, the release tests and Vitest; it does **not** run the Python tests in `scripts/tests/`. So the checks that guard what visitors see are written in Vitest against the built files, and the Python tests cover the build's internal rules and are run by hand (`python -m pytest scripts/tests/test_baby_names.py`) when the build runs.

- **Python (`scripts/tests/test_baby_names.py`, beside the existing `test_odd_one_out.py` and `test_memory_match.py`):** the Strong's pointer-following on the examples in 3.3 (Sarah, John, James, Elizabeth, Stephen, Ezra); the clean-up rules ("Jehovah" never appears in output); every override has a citation; every person id exists; every slug unique and unreserved; every full name has at least one quoted verse; no headline comes from Hitchcock; Noah has two meaning blocks; Jesus is New Testament; excluded names absent.
- **Vitest (next to the code, under `src/`, where the site's test runner looks):** the list filters and their combinations, sort orders, search including "also spelled", filter state read from and written to the address, the empty state; the name page renders the heading, the opening paragraph as the first long paragraph, the verse text inside `.scripture` with `lang="en"`, the name under `translate="no"`, the `noindex` tag on short pages only; an unknown slug shows the not-found page; an alias redirects to its main page; `babyNamePaths()` returns the three list pages plus exactly the full names; every person in the people index either gets `null` or a link to a slug present in the built index (6.5). Against the built data, also in Vitest so the mechanical test run covers them: no headline contains "Jehovah", every slug is unique and unreserved, Noah has two meaning blocks, Jesus is New Testament, no excluded name has a page, and every override cites a source.
- **Playwright (e2e/):** load `/baby-names`, scroll the long list and confirm rows keep appearing with no button; open a name, follow its person link.

## 8. Edge cases

1. **One spelling, different original words** (Noah; the 16 names borne by both men and women; names with two Strong's numbers): one meaning block per original, each tied to its people (3.3).
2. **One person, several names** (Abram and Abraham, Sarai and Sarah, Jacob and Israel, Simon, Peter and Cephas, Saul and Paul, Hadassah and Esther, Naomi and Mara, Gideon and Jerubbaal, Daniel and Belteshazzar): each name gets its page; the bearer card says "also called"; the opening paragraph of the less-used name says which is the person's main name.
3. **Many people, one name** (Zechariah 29): bearers by reference count; top three in full; the rest as rows.
4. **Thin names**: short pages, not indexed (4.3, 6.4).
5. **Sex not stated** (about 90 names): "not stated"; shown under All only.
6. **Modern use differs from the Bible** (Ariel, Noah, Eden, Jordan): the "used today" sentence says so; the gender filter means gender in the Bible, and the filter's label says "in the Bible".
7. **Old or other-language spellings that parents use** (Elias for Elijah, Isaias, Timotheus, Emmanuel for Immanuel): they are found by the search box and redirect to the main page, which names the form in its opening paragraph. They do not get their own indexed pages (duplicates). Whether the most popular of these (Elias is in the US top 100) deserve their own full page is listed for the owner (section 9).
8. **First reference misleads the testament** (Jesus, Immanuel first appear in Isaiah 7:14): testament comes from the period (3.4).
9. **Names of God, Satan, evil spirits, pagan gods**: excluded, with reasons in a reviewable file (3.2). Jesus and Immanuel included with care.
10. **Villains' names**: the caution line (3.4); the page still tells the story plainly.
11. **Angels and places** (Gabriel; Eden, Jordan, Bethany): the hand-chosen extra names (3.2). Raphael is not included: he appears only in Tobit, which is not in the Protestant canon the site follows.
12. **Meaning sources disagree or are contested** (Mary, Ruth, Esther): override with citation, label "Uncertain" or "Probable", proposals named (3.3).
13. **The Bible's wordplay is not the etymology** (Noah, Moses, Samuel): shown as "Wordplay in the Bible" under the etymological headline, never as the meaning itself (3.3).
14. **Berean spelling differs from TIPNR's** (ESV-based): the build uses the Berean's and fails on any it cannot confirm (3.2).
15. **Person ids drift** when STEP updates TIPNR: the build checks every link (3.5); a test checks again.
16. **Hyphenated and very long names** (Maher-shalal-hash-baz, Zaphenath-paneah): slug keeps hyphens; the heading wraps; the title may be shortened by search engines.
17. **Site shown in another language**: name and Hebrew/Greek not translated, verse text not translated, everything else through the site's existing translator; verse calls pass `"bsb"` explicitly.
18. **No SSA rank**: no badge, sorted after ranked names. SSA publishes each May; the source is refreshed by re-running the fetch and build.
19. **A name with a thousand verses** (David, Jesus, Moses): the verse list uses the row window and loads text a chunk of chapters at a time through `loadChapterPlain`, never whole books (4.1, item 8).
20. **Empty filter combination**: the "remove a filter" message (5.2).
21. **Unknown or capitalised address**: not-found page or redirect (5.1).
22. **Hitchcock says "same as Miriam"**: treated as a cross-reference (3.3).
23. **People with no name** ("Daughter of Pharaoh", "Unnamed ancestor of Joseph"): not names, so no page and no link from their person page (3.2).
24. **Two-word names** (Mary Magdalene, Sergius Paulus): mapped by hand to the given name's page (3.2).
25. **A Strong's chain that ends on an ordinary word** (Sarah, Ezra, Rachel, Stephen): the long dictionary definition is never shown as the headline; the name goes to the hand-check list and gets an override (3.3).

## 9. Decisions this design makes, and what is left for the owner

Decided here, within the approved idea:
- Every biblical person's name gets a page, but only about 650 well-attested or popular ones are offered to search engines; the rest are marked not to be listed, so a thousand one-verse pages cannot count against the site.
- Meanings follow Strong's and the Berean's own notes, are labelled for certainty, and are hand-checked for the 150 most popular names. Hitchcock is shown only as an older, labelled opinion.
- No model is used at build time or at runtime; the pages are built entirely from data. If the owner later wants a written paragraph per popular name, it can be generated once with a cheap model under the batch rules (a pilot, a budget and the owner's yes first); nothing in this design depends on it.

Left for the owner (none of these blocks the build):
1. Whether the most popular alternative spellings that are not the Berean's (Elias, Emmanuel) should also get their own full pages for search traffic, or stay as redirects (the default here).
2. Whether to add a link from the new-baby verse pack to the name pages (another feature's file).
3. Whether to add the UK's official baby-name statistics beside the US figures later.

## 10. Out of scope for this build

Virtue and word names that are not names in the Bible (Grace, Faith, Hope, Trinity); names from the Apocrypha; a "name generator" or quiz; shareable name cards (the shared verse-card generator in this chain could add one later); popularity charts over time; user accounts or saved favourites (the site has no accounts).

## 11. Review

**Reviewed:** 2026-11-07, step 8 of sequence 32, once, against the approved idea (entry 2 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md)), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) and the real code and data. All corrections below are already applied in the sections named; nothing is left as a separate to-do.

**Verdict:** sound, and faithful to the approved idea ("a page for every biblical name: meaning, the person's story, verses where it appears"). Every rule is met: Berean quotations, no model at runtime or build time, reuse of the site's people and Bible data, a row window for long lists, own route plus home and person-page entries, no deployment. Six things would have failed or misled the implementer and were fixed; six smaller ones were tightened.

**Checked and found right** (so the implementer can rely on them): the Strong's entries the meaning method quotes (Hannah H2584 "favored", Johanan H3076 "Jehovah-favored", Sarah H8283 pointing to H8282 "a mistress, i.e. female noble lady, princess, queen", Noah H5146 "rest", the woman Noah H5270 "movement", Ruth H7327 "probably for 7468; friend", Miriam H4813 "rebelliously", Ezra H5830 and Rachel H7354 pointing to ordinary words); the 175 Berean name footnotes covering 132 names; the people counts (3,133 entries; Zechariah 29, Shemaiah 26, Maaseiah and Meshullam 20, Azariah 19); six women named Mary once Mary Magdalene is mapped in; two Noahs; Jesus filed under the "life-of-christ" period; Gabriel absent from the people data; the reader's `?hl=` highlight; the not-found heading the capture step looks for; the 99,500-file copy budget and 1,682 existing captures; the sitemap-only list in [pages.ts](../../../scripts/seo/pages.ts); the four baby-related life-event pack addresses; the "one of N people named X" line in [PersonProfile.tsx](../../../src/components/study/PersonProfile.tsx); and the Hitchcock line in [SOURCES.md](../../../SOURCES.md).

**What was wrong, and what changed:**

1. **Verse text loading was described wrongly** (2.4, 4.1 item 8, edge case 19). The design said the Berean is stored one chapter per file and that the site's verse helpers fetch it that way. In fact [data/text/bsb/](../../../data/text/bsb/) holds a few chapters per file, and `useVerses`/`resolveVerses` read the whole plain book for any verse in it. An implementer using the helpers the design named would have made David's page download every whole book he appears in. Now: lists of up to 100 verses use `useVerses` with `"bsb"`; longer lists use the row window and `loadChapterPlain` from [data.ts](../../../src/lib/data.ts), which reads one chunk at a time.
2. **Links from person pages would have broken** (3.5, 6.5, 7.1, 7.2). The design built each person-page link by applying the slug rule to the person's listed name. But those names are TIPNR's (ESV spellings and two-word names like "Mary Magdalene"), while the name pages use the Berean's spellings, and excluded names have no page. Now the build writes a small exceptions file, `src/data/baby-names/person-links.json` (person id → correct slug, or no link), bundled with the code, so the person page still makes no extra download. The index also carries an `aliases` table that the name page uses for redirects, and the test now checks every person either has no link or links to a page that exists.
3. **The promise about crawler copies could not be kept** (5.2). The design said each list page's ready-made copy would carry its first 200 rows. Copies are captured from the page as a browser draws it, and the row window draws only about 60 to 80 rows; filtered views are never captured. Now the design says so and relies on the sitemap, the related-name links and the two landing pages, which is enough.
4. **The opening-paragraph example promised details no data field holds** (4.1 item 4). "Who prayed for a son at Shiloh and gave him back to the LORD" cannot come from a fixed template over the people data, which has only "The mother of the prophet Samuel." The example now uses only data fields, and the design states that the template never adds story details.
5. **The tests that matter would not have been run** (7.2). The site's `test` command runs content tests, release tests and Vitest, not the Python tests. The checks on what visitors see (no "Jehovah", unique slugs, two Noah blocks, Jesus as New Testament, no excluded names, cited overrides, person links resolving) are now also required in Vitest against the built files; the Python tests remain for the build's internals and are run by hand with the build.
6. **One slug rule was planned in two places** (7.1, 6.2). The file list had a `slug.ts` under the pages and the slug rule again in `src/data/baby-names/index.ts`, and `babyNamePaths()` was said to read the built index itself, which would put file-system code into a module the browser imports. Now there is one browser-safe module with the slug rule, `babyNamePaths(rows)` as a pure function, and the inventory reads the JSON with its own `readJson`, the way life-events does with `lifeEventPaths()`. A test checks the Python build's slug rule agrees with it.

**Smaller corrections:**

- Berean footnotes (3.3 rule 2): only 35 of the 175 name notes are "sounds like" notes, not 44 (44 counts every "sounds like" note, including ones that are not about names). Added the rule for a note that does both (Reuben, Genesis 29:32), tied each note to the Strong's number tagged at its verse so it can never land on the wrong Noah, and excluded place notes ("Nod means wandering") unless the place is one of the extra names.
- Testament (3.4): named exactly which periods count as New Testament, and added a fallback for any named person without a period (today the 75 such rows are all excluded people groups).
- "Popular today" sort (5.2): said which US rank is used when the gender filter is on "All" or "Both" (the better of the two).
- Short pages (4.3): noted that they get no ready-made copy, so crawlers that do not run the page's code see only the empty shell, and pointed to the existing pattern for adding and removing the `noindex` tag ([RecipientCard.tsx](../../../src/pages/sympathy/RecipientCard.tsx)).
- SSA download (3.1): the file is replaced at the same address every May, so its checksum is recorded per data year.
- Shared files (6.5, 7.1): the home-page line sits in a block other chains may also edit, so it is re-read just before editing; the source-register change is justified and limited to a new section plus the one Hitchcock line; the Jesus page now names its link targets (`/study/gospels` and his person page).

**Not changed, on purpose:** the full/short page split and the roughly 650 indexed pages; the meaning method's order (override, the Bible's own note, Strong's, uncertain); Hitchcock shown only as a labelled older opinion; no top-navigation entry; and the three questions left for the owner in section 9. These are reasoned, within the approved idea and the rules, and none blocks the build.

## 12. Implementation recovery audit — job754, 8 November 2026

This is an incomplete recovery checkpoint, not implementation approval or a change to the requirements above. The actual implementation and Vitest files already existed when the recovery began; the original job report had stopped recording progress after the data tests.

- Initial data: 1,809 pages (523 full, 1,286 short), 500 aliases, 27 meaning overrides. Final recovery data: 1,807 pages (521 full, 1,286 short), 499 aliases; removed Jew (people designation) and Zealot (epithet), preserving Judah and Simon, with explicit exclusion reasons. SSA is absent. The owner-approved optional fallback remains: no US ranks or Popular sort, and Most mentioned on the boy/girl landing pages. No SSA download or bypass was attempted during recovery.
- Existing Greek XML deviation verified against the local prologue and [upstream XML](https://raw.githubusercontent.com/openscriptures/strongs/master/greek/StrongsGreekDictionaryXML_1.4/strongsgreek.xml): public-domain Strong text, XML prepared by Ulrik Petersen. Preserve this input rather than importing the different Greek JSON edition.
- [HebrewLexicon upstream readme](https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master/readme.md) confirms the CC BY 4.0 edition and public-domain dictionary text, asking for credit to the Open Scriptures Hebrew Bible Project. [STEP upstream](https://github.com/STEPBible/STEPBible-Data) confirms CC BY 4.0. [Berean official terms](https://berean.bible/terms.htm) confirm the text's public-domain dedication. These were opened on 8 November 2026. Exact local file hashes and consultation limits are in the original job folder's source-verification-job754.json.
- Applied fixes: place-name atlas links; preservation of the wordplay in Reuben's combined Berean note; beloved meanings assigned to Love rather than Joy; non-name exclusions; Jesus's special Gospels/person-page treatment while retaining a distinct Jesus Justus card. These defects have failing-before and passing-after focused regression receipts. Also corrected Greek-versus-Hebrew origin labels and Greek root language/direction attributes, and added full project attribution and licence links. Actual baby-name data rebuilt successfully. Final focused Vitest: 51 passed in three files, using the portable esbuild transformer. Python: 22 passed. These checks do not replace final canonical supervisor gates or the required browser checks.

Still required before calling implementation done:

1. Complete and record the design's per-name source and theme review (fallback selection: the 150 most mentioned names plus all overrides). The source extraction is in review-extract-job754.json; extraction is not review. Settle all 187 remaining flagged original-word drafts with reviewed wording and citations.
2. Verify or correct unsupported exact-source attributions in existing overrides. Direct inspection found that local BDB entries for David, Mary/Miriam and Michal do not contain the wording attributed to them. The local BDB is incomplete; do not treat a citation string as verification or invent missing support.
3. Resolve the 47 unconfirmed spelling lines and three missing TIPNR identities in the actual build log, preserving every qualifying name and documenting exclusions; make unresolved Berean spellings fail as section 3.2 requires. Current code logs and skips them.
4. Complete remaining template/design reconciliation and final canonical gates after stable source/data changes. Section 7.2's existing e2e/baby-names.spec.ts long-scroll/person-link acceptance check remains a supervisor operation under the recovery authorization; no browser or visual result is claimed here.

The full original report, focused command receipts and pending source decisions remain in the original job folder. No deployment, push, commit, alternate preview server, ACL change, antivirus change, paid model call or new job was performed. This appendix is staged for supervisor installation because the recovery authorization prohibits attempts to write inherited protected docs.

## 13. Finishing the meanings, spellings and missing people — 9 November 2026

This section records what the finishing step changed after the recovery audit in section 12. The requirements above are unchanged; this is how the open items in section 12 were settled.

**Flagged draft meanings (section 12, item 1).** The earlier re-run had turned every draft meaning (a Strong's pointer chain that ends on an ordinary word) into "Meaning uncertain". That withheld meanings Strong's states plainly, including the three nature examples section 3.4 relies on (Deborah "bee", Jonah "dove", Tamar "palm tree"). Section 3.3 says an override settles a draft, so every flagged block now has a hand-checked entry in `meaning-overrides.json`, marked `"reviewed": "job 824"`:

- 185 draft blocks: 168 labelled Probable, 16 labelled "Probable (Strong's says 'probably')" because Strong's itself hedges, and 1 left Meaning uncertain (Abimael) where Strong's gives no usable sense. The other flagged drafts were already settled by an existing override or by the Bible's own note.
- 22 automatic headlines that came out malformed (for example Benaiah "prolonged from and , the LORD has built"), rewritten from the same Strong's text: 14 Probable, 7 hedged, and Meshach left uncertain.
- 6 headlines taken from the Bible's own notes that were longer than 40 characters, shortened word for word and still labelled Given in the Bible.

Every citation is built from the actual local Strong's entries along the chain. A test checks that every word of a reviewed headline appears in its own citation or explanation. Unpleasant senses are shown plainly and get no theme. The data build now lists any flagged draft still without an override, and a test fails if one reaches a page.

**Existing overrides (section 12, item 2).** Easton's dictionary is on this PC, already registered as `easton-txt` (`../sources/ccel/ebd2.txt`), and every quoted phrase was found in it. Esther is therefore "star" again, citing Strong's ("of Persian derivation") and Easton ("the Persian word satarah, which means a star"). Further changes:

- Elijah "whose God is the LORD" (Easton). The design's "my God is the LORD" is in no local source.
- Elisha "God his salvation" (Easton).
- Michal "rivulet" (Strong's "apparently", and Easton).
- Matthew "gift of the LORD": Strong's G3156 says "Matthaeus (i.e. Matthitjah)", and H4993 says "gift of Jah". The G3164 cross-reference in both local Greek editions is noted as a misprint.
- Mary, Miriam and Jesse stay uncertain. Their explanations name only the proposals a local source actually prints. The design's "bitter", Egyptian "beloved" and "star of the sea" are in no local source, so they are not shown.
- The Moses override was re-keyed to Moses's own Strong's numbers, so it no longer covers the Manasseh reading of Judges 18:30.

**Origin language.** Strong's "of foreign derivation" and "of foreign origin" used to fall through to Hebrew or Greek, so pages such as Sargon wrongly said "from the Hebrew". They now give the language as other, shown as "a foreign name".

**Spellings and missing people (section 12, item 3).** All unconfirmed spelling lines have reviewed decisions in `spelling-overrides.json`: 16 confirmed spellings, 32 exclusions with individual reasons, and one verse move. The build fails on any new unconfirmed line, on a decision that no longer matches anything, and on a site-added person that is neither identified nor excluded. Three people the site has but TIPNR lacks now have reviewed identities. Each identity names its Strong's number and verses, and its spelling must appear in every one of those Berean verses:

- **Sargon** (Isaiah 20:1, H5623). TIPNR files the Sargon line under Sennacherib, so the Sargon page showed the wrong man. That line is now excluded, and Sargon's page shows Sargon.
- **The father of Darius the Mede** (Daniel 9:1, H325, printed "Xerxes"). TIPNR had put this verse on the king of Esther's story. It is moved to its own person with a reviewed `dropRefs` decision, so the verse is counted once. The Xerxes page now lists two men.
- **Candace** (Acts 8:27, G2582). The Berean prints it as the queen's name without an article, and Strong's calls it "an Egyptian queen". She keeps a page. Many think Candace was the title of the queens of Meroe; that is recorded in the decision's reason, and her card says only what Acts says.

"The Tartan" and "the Rabshakeh" are Assyrian offices printed with "the", like the already excluded Rab-mag. They are now in `excluded.json`.

**Easton credit.** A page that cites Easton adds the line "Also cited: Easton's Illustrated Bible Dictionary (1897), public domain." Easton is listed in the baby-names table of `SOURCES.md`.

**Tests.** The Python tests now cover:

- foreign origins;
- reviewed identities, and every way one can be wrong;
- verse moves that cannot invent a verse or empty a line;
- the headline-word check;
- that no flagged draft reaches a page;
- the Sargon, Xerxes and Candace pages.

The site data test replaces the earlier assertion that Esther, Matthew, Michal and Elisha are uncertain. It checks:

- Esther "star" with its Easton citation;
- Deborah, Jonah and Tamar under the nature theme;
- every headline at most 40 characters and well formed;
- the three people's bearers.

Gate results and browser screenshots are recorded in the job's report, not here.
