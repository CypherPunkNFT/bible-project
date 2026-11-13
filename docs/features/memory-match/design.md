# Memory card match — design

**Status:** built and live at `/games/memory-match` (job b95c436d, 2026-11-07; where the build differs from this design and why is in §20). Reviewed by job a5fdb69f (§19). Drafted in the research & design step (job 738, 2026-11-07).
**Spec (binding):** [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md), entry 24: *"Flip cards to pair a character with their story (Daniel / the lions' den). Text-only cards — no images needed."*
**Shared rules:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md). No model runs while people play. Existing site data is reused. Scripture is quoted from the Berean Standard Bible (BSB). The game registers on the /games hub. Only this feature's files are touched, and nothing is deployed.
**Slug:** `memory-match`. **Route:** `/games/memory-match`. Already listed on the hub as "coming soon" (shelf: Family and party; audiences: Solo, Family; its hub picture already exists).

---

## 0. Summary

The game deals a grid of face-down text cards. Half are **who** cards (Daniel, Ruth, Zacchaeus) and half are **story** cards (the lions' den, gleaned in Boaz's field, climbed a sycamore tree). The player turns over two cards at a time. A who card and its own story card stay face up as a pair. Any other two cards turn back over. The board is cleared when every pair is found.

- **Content:** a hand-kept list of character–story pairs, grouped into seven themed decks plus Mixed. A starter list of 164 pairs is in Appendix A, and every one of them was checked against the site's BSB text in this step. The list lives in two small source files. A build script, run once by hand, checks the list against the site's people, BSB text and question bank, then writes one JSON file that ships with the game. Nothing is generated while people play, and no language model is used at any stage.
- **Difficulty** is set by the number of pairs (6, 9 or 12), by how well known the pairs are, by whether the card backs say "Who" or "Story", and by whether story cards may share tempting words.
- **Scoring:** in solo play the score is the number of moves (one move is turning over two cards), shown with a timer. Stars come from moves only. The thresholds come from a simulation of a player with perfect memory (§9). Up to four people can also take turns on one phone (pass and play), where the score is pairs found.
- **The hard part** is making sure every story card belongs to exactly **one** who card on the board. The design uses a "must not share a board" list, a same-first-name rule and a shared-word check. A board-drawing routine applies all of them, and the tests run it on thousands of random boards (§6).
- **Teaching:** each pair, once found, shows its Bible reference. The end screen lists every pair with one BSB verse that tells the story, plus links to the reader and the person's page. The game ships only the verse's id. Its wording is looked up when the summary is shown, in the same way as everywhere else on the site (§5.4).

---

## 1. What the spec fixes, and what this design decides

| Spec says | Design decision |
|---|---|
| Flip cards | Classic concentration rules: two cards per move. A pair stays up and a non-pair turns back. A short CSS 3D flip, replaced by a fade for people who ask for reduced motion (§11). |
| Pair a **character** with **their story** | Pairs are **asymmetric**: a who card and a story card, never two identical cards. A character may own several stories in the data (Moses: the burning bush, a basket among the reeds, the Ten Commandments), but each board uses **at most one story per character** (§6). |
| The example: Daniel / the lions' den | This exact pair is in the data and the build fails without it. A new player's first Easy board always contains it (§10). |
| Text-only cards, no images | Cards carry words only: a small "Who" or "Story" label and the name or story. Colour and a ✓ mark matched pairs, but the words carry the meaning on their own (§12). |
| (Brief) pair sets | Seven themed decks plus Mixed, from 164 starter pairs (§4, Appendix A). |
| (Brief) grid sizes by difficulty | Easy 6 pairs (12 cards), Medium 9 pairs (18), Hard 12 pairs (24). The column count is fixed when the cards are dealt, so a rotated phone never moves cards (§8). |
| (Brief) moves/timer scoring | Moves decide the stars, and the timer is shown and recorded but never scored, so slow readers are not punished. Best moves and best time are kept on the device (§9). |
| (Rules) no runtime model cost | No model at runtime or at build time. The pairs are hand-written and checked by a script (§5). |
| (Rules) reuse site data | The script reads people, people slugs, the BSB text, the BSB section headings and the question bank (§3). |
| (Rules) BSB, not KJV | Every story card must contain a check word found in its BSB passage. This catches KJV wording such as "coat of many colours" (BSB: robe), "budded" (BSB: sprouted) and "buried" (BSB: hid). The verse quoted on the end screen is looked up when the summary is shown, through `src/lib/verses.ts`, from the site's Bible text (the BSB in English). The shipped file holds only the verse id, because the build refuses verse wording in data files (§5.4). |

---

## 2. Research

### 2.1 The game form

- **Origins.** Matching hidden pairs is old. In 16th-century Japan, *kai-awase* matched painted clam-shell halves. *Uta-garuta*, later the Hyakunin Isshu card game, matches the **second half of a poem to its first half**. That is the closest ancestor of this game, because its pairs are related rather than identical. In 19th-century England and America, a pairs game played with ordinary cards was called *Pelmanism*, *Pairs* or *Concentration*.
- **Ravensburger's *memory®* (1959).** The Swiss diplomat William Hurter brought his father's home-made picture-pair game to Otto Maier Verlag (Ravensburger) in 1958. It shipped in April 1959 and has sold about 75 million copies. Its rules are the ones every family knows. A found pair is kept, and **finding a pair earns another turn**, which is what makes it a family game. This design keeps that rule in pass-and-play (§7).
- **NBC's *Concentration* (1958–1973).** The game show ran 3,770 episodes, with prizes hidden behind numbered squares and a rebus revealed as pairs were matched. Its lesson for us: the payoff of a match can carry **content**, not only points. Here, each match reveals a Bible reference.
- **Term–definition matching in learning apps.** Flashcard apps match a term to its definition against a clock (for example, Quizlet's "Match"). They show the asymmetric pair works for learning, and that a visible timer motivates adults. It also stresses younger and slower readers, so this design shows the timer without scoring it.
- **Paired-associate learning.** Linking a cue to a response ("Daniel → lions' den") is the classic *paired-associate* method of memory research, introduced by Mary Whiton Calkins in the 1890s. Being asked to retrieve an answer strengthens memory more than reading it again: the *testing effect* (Roediger & Karpicke, 2006). A match game asks the player to retrieve "which story was Daniel's?" over and over, so it teaches, provided the story is shown again at the end (§10).

### 2.2 The mathematics of moves

- **Velleman & Warrington, "What to Expect in a Game of Memory" (*American Mathematical Monthly* 120(9), 2013)** worked out the expected number of moves for an optimal solitaire player with perfect memory. It is about **1.61 moves per pair** for large boards. Earlier work by Foerster and Wattenhofer had shown that no strategy averages fewer than about 1.5n − 1 moves, and that an optimal player needs at most 1.75n.
- **Our own simulation** (this step, 4,000 games per case; script kept in the job folder): a perfect-memory player averages 9.1 moves for 6 pairs, 13.9 for 9 and 18.8 for 12, or 1.51n to 1.57n, which fits the published result for small boards. Nine games in ten finish within 10, 15 and 20 moves. A player who forgets each remembered card with 10% chance per move finishes nine games in ten within 11, 18 and 26 moves. These numbers set the star thresholds in §9.
- **Who/Story backs barely help a perfect player.** With the card type printed on the back, the simulated perfect player's average changes by under 0.2 moves. The help is for people: a child is never puzzled by turning over two names. So the type is printed on Easy and Medium backs only. Hard drops it, so a move spent on two who cards is a real mistake there (§8).

### 2.3 Who plays it

- **Children are good at this game.** Baker-Ward & Ornstein (1988) had 5- to 9-year-olds and adults play a 16-pair picture Concentration. They needed the same number of trials, but the children took more pairs as soon as both positions were known. Later studies (Chagnon & McKelvie 1992; Krøjgaard et al. 2019) found the child advantage smaller or limited to about age 8 and up. *Lesson:* Easy must be playable by a young reader. Text cards make reading the bottleneck, so Easy uses the best-known pairs, short labels, Who/Story backs and a longer look at non-pairs.
- **Text cards are slower than picture cards.** A picture is recognised at a glance, but a 4-word story label has to be read. So non-pairs stay visible longer than in picture games (3 s on Easy), and the player can tap at once to turn them back sooner, or switch to "turn back when I tap" (§11, §12).

### 2.4 What the research means for this game

1. **Asymmetric pairs need an "only one owner" guarantee.** "Parted the water" fits Moses, Joshua, Elijah and Elisha. A story card must point at one person on the board, and §6 engineers that, as the odd-one-out design had to for its own puzzles.
2. **Keep the family rule.** In pass-and-play, finding a pair means you go again.
3. **Score moves, show time.** Moves measure memory, while time measures reading speed and confidence.
4. **Make the reveal teach.** Show the reference on each match, and the BSB verse and links at the end.

---

## 3. Site data reused

| Source (all existing) | What it gives this game |
|---|---|
| [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) | 3,133 people: id, name (`n`), other names (`o`), mention count (`c`). The build checks each named character's person id and uses the name and aliases for the giveaway check. Mention counts are shown on the review sheet as a fame signal. |
| [people-slugs.json](Jarvis/Projects/BibleProject/Website/src/data/people-slugs.json) | Readable person addresses (`/people/<slug>`) for the end-screen links. |
| [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/) | The plain BSB verse text, one file per book (`"28:12": "…"`). The build uses it for the check-word test and to confirm the key verse exists. In the browser, [verses.ts](Jarvis/Projects/BibleProject/Website/src/lib/verses.ts) reads the same files to show the key verse on the summary. |
| [data/text/bsb/](Jarvis/Projects/BibleProject/Website/data/text/bsb/) | The BSB reader text. These files also carry the BSB **section headings** (`h: [["s", "Daniel in the Lions' Den"]]`, 3,017 of them). The review sheet prints the heading at or just before each pair's passage as evidence that the passage is the story. Headings were also the main place this step looked for candidate stories. |
| [bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) | The question bank: 14,916 questions, more than the "~5,000" the rules mention. Its `people` tags are counted per name as a second fame signal for the tier check on the review sheet. It is **not** a source of pairs. |

**Not used:** the per-person `story`, `article` and `short` text, which quotes the KJV, and the people-pages groups, which are about offices, not stories.

**Why the pairs are hand-kept rather than derived.** No existing dataset maps a character to a famous story. Generating pairs from headings alone gives wording that is too long and inconsistent for a card ("Isaiah's Message of Deliverance", "The LORD Visits Sinai"), and it cannot know which stories children know. The judgement worth paying for is in choosing the pairs. 164 short rows are written once, like odd-one-out's facts file, and everything checkable is checked by the script.

---

## 4. Pair sets (decks)

| Deck (chip label) | Covers | Starter pairs | Tier 1 / tier ≤ 2 / all |
|---|---|---|---|
| **Mixed** (default) | everything | 164 (142 characters) | 65 / 143 / 164 |
| **In the beginning** | Genesis to Joshua | 32 | 15 / 31 / 32 |
| **Judges and kings** | Judges to Chronicles, Elijah and Elisha | 40 | 13 / 35 / 40 |
| **Prophets and exile** | the prophets, Daniel, Esther, Ezra–Nehemiah, Job | 28 | 12 / 20 / 28 |
| **Women of the Bible** | from Sarah to Priscilla | 30 | 12 / 27 / 30 |
| **Meeting Jesus** | the Gospels | 30 | 19 / 29 / 30 |
| **The early church** | Acts and the letters | 24 | 4 / 19 / 24 |
| **Parables** | figures in Jesus' parables | 15 | 6 / 14 / 15 |

(A pair can belong to more than one deck: Ruth is in Women and in Judges and kings. So the deck counts add up to more than 164. The Mixed row counts each pair once.)

**Tiers** are hand-assigned and checked on the review sheet against the two fame signals:
- **Tier 1:** known to most churchgoing children (Noah and the ark, David and the giant Goliath, Zacchaeus).
- **Tier 2:** known to regular adult readers (Jehu, who drove like a madman; Lydia, a dealer in purple cloth).
- **Tier 3:** deeper cuts (Baruch, who wrote the scroll as dictated; Gamaliel, "Leave these men alone").

**Parable figures** (the good Samaritan, the prodigal son) are characters in stories Jesus told, not people in history. They get their own deck and are marked "In a parable Jesus told" on the end screen. Mixed includes them. *(This is the one deck the owner might prefer to drop. See §17.)*

**Editorial choices for a family game.** No story whose point is sexual (no Bathsheba). **A card whose words describe a killing or a gruesome death is tier 2 or 3**, so it never appears on Easy: "killed his brother" (Cain), "stoned for his faith" (Stephen), "the tent peg" (Jael), "hanged on his own gallows" (Haman), "eaten by worms" (Herod Agrippa). The rule is about what the card says. A tier 1 card may point to a story with danger in it if its words do not dwell on the harm, as "the giant Goliath" and "two mothers, one baby" do. Story labels describe events and never judge people.

### 4.1 The card text rules (checked by the build)

1. **Length:** at most 30 characters for both who and story labels. This was measured for the tightest layout: Hard on a 320 px phone, §8. Words longer than 12 letters (Nebuchadnezzar) must carry soft hyphens in the source (`Nebu­chad­nezzar`), so they break cleanly in narrow cards.
2. **Story labels start in lower case** unless they begin with a proper noun or a quotation ("For such a time as this"). Quotations must be BSB wording.
3. **A story label never names its own character** or any of that character's aliases (no "Noah's ark", so it is "the ark and the flood"). The build checks this against `n` and `o` in people.json and the who label.
4. **A story label may name a minor person who is not a who card anywhere** (the giant Goliath, Naboth's vineyard, Boaz). If a capitalised word in a story label matches a word in another who card's label (Damascus in "blinded on the Damascus road" and "Ananias of Damascus"), the two must be on each other's "must not share a board" list, or the build fails.
5. **The check word** (§5.3) must occur in the BSB text of the passage.
6. **A quotation on a card must match the BSB word for word**, apart from leaving out words at either end. The build checks it: text inside quotation marks in a label must occur, ignoring case and punctuation, in the passage. (The draft's "You are the man!" failed this. The BSB at 2 Samuel 12:7 reads "You are that man!")

---

## 5. Building the data (once, ahead of time)

**Script:** `scripts/build-memory-match.py`, Python 3.12, the same style as `scripts/build-odd-one-out.py`.
- `py -3.12 scripts/build-memory-match.py` writes `src/data/memory-match/pairs.json` and `docs/features/memory-match/review-sheet.md`.
- `py -3.12 scripts/build-memory-match.py --check` rebuilds in memory and exits non-zero if either output is out of date. The pytest suite runs it, so `npm run test:data` notices stale data.

### 5.1 Hand-kept inputs

`scripts/memory-match/characters.json`: one entry per who card.

```jsonc
{
  "daniel":        { "label": "Daniel", "person": "daniel-ezk-14-14" },
  "mary-magdalene":{ "label": "Mary Magdalene", "person": "<the id of Mary Magdalene>" },
  "three-friends": { "label": "Shadrach, Meshach, Abednego", "person": null, "group": true },
  "good-samaritan":{ "label": "The good Samaritan", "person": null, "parable": true }
}
```

`scripts/memory-match/pairs.json`: one entry per pair.

```jsonc
[
  { "who": "daniel", "story": "the lions' den", "ref": "DAN 6:16-23", "check": "den",
    "tier": 1, "decks": ["prophets"], "keyVerse": "DAN 6:22", "notWith": [] },
  { "who": "naaman", "story": "dipped seven times", "ref": "2KI 5:10-14", "check": "seven",
    "tier": 1, "decks": ["judges-kings", "prophets"], "notWith": ["elisha"] }
]
```

- `person` is an **explicit people.json id**, never looked up by name. The prototype showed why: looking people up by name picked the wrong record for all three Marys, for King Herod and Herod Agrippa (both resolved to Herod Antipas), for Simeon (resolved to Jacob's son), for both Simons, for Gamaliel and for Darius. 52 of the starter pairs need an id chosen by hand (Appendix A marks them). 25 have no person record at all (groups, unnamed people, parable figures). They get `null`, and their end-screen line links only to the passage.
- `keyVerse` is optional. If it is missing, the build picks the first verse in the passage that contains the check word. It must lie inside `ref` (ranges may cross chapters, `ACT 27:39-28:1`, and may list two passages with `;`).
- `notWith` lists characters this story card could plausibly be claimed by (§6.1). The build makes it symmetric.

### 5.2 What the build does

1. Load the inputs, people.json, people-slugs.json, the BSB text and headings, and the question bank.
2. For each pair, **fail the build** on any of:
   - an unknown `who` or person id;
   - a who label none of whose words is the person's `n` or one of their `o` (so "Pontius Pilate" passes on "Pilate", and "King Saul" on "Saul");
   - a reference or key verse that does not exist, or a key verse outside the passage;
   - a check word not found in the passage (§5.3);
   - a quotation in a label that is not BSB wording (§4.1 rule 6);
   - any card-text rule in §4.1 broken;
   - a `notWith` key that does not exist;
   - a duplicate `(who, story)`;
   - the spec's pair (Daniel / the lions' den) missing.
3. Compute, per pair:
   - a **stable id**: a short hash of `who` plus the story text, so the "already seen" list in the browser survives rebuilds;
   - the person link (`/people/<slug>`) and reader link (`/read/bsb/<BOOK>/<chapter>?hl=<first>-<last>`, the passage's verses in its first chapter, the same form odd-one-out uses, e.g. `/read/bsb/MAT/4?hl=18-19`);
   - the key verse's **id** (`BBCCCVVV`, books numbered as in `scripts/bible/books.py`) and its reference text ("Daniel 6:22"). **Never the verse's wording** (§5.4);
   - the content words of the story label (minus stop words), for the shared-word rule (§6.2);
   - the symmetric `notWith` list.
4. For each deck and difficulty, count the distinct characters in its pool (§8). Mark the combination **offered** only if there are at least *pairs on the board + 3*, so boards vary. A combination below that is hidden with a warning (not a failure). If Mixed falls below it at any difficulty, the build fails.
5. Write `pairs.json` (shape in §5.4) and the review sheet: one row per pair with the BSB heading near the passage, the key verse, the tier, the person's mention count and question-bank count, and the `notWith` list, so the owner can skim it.

### 5.3 The BSB check word

Each pair names one word or phrase that must appear, ignoring case, in the BSB text of its passage. It is cheap, and in this step it caught every case where card wording had drifted from the BSB:

| First draft of the card | BSB says | Card now |
|---|---|---|
| Aaron: his staff budded | "had sprouted, put forth buds, blossomed, and produced almonds" (Num 17:8) | his staff sprouted almonds |
| Samson: strength in his hair (check word "razor") | "My hair has never been cut… If I am shaved" (Judg 16:17) | check word "hair" |
| Martha: busy with all the serving | "distracted by all the preparations" (Luke 10:40) | distracted by preparations |
| Stephen: check word "stoned" | "began to stone him… While they were stoning him" (Acts 7:58–59) | check word "stone" |
| The servant with one talent: buried the money | "dug a hole in the ground, and hid his master's money" (Matt 25:18) | hid the money in the ground |
| David: the giant Goliath, passage 1 Sam 17:48–50 | Goliath is named at 17:4 and 17:23, not in the final verses | passage 1 Sam 17:4–50 |
| Enoch: check word "took" | "God had taken him away" (Gen 5:24) | check word "taken" |

(Joseph's card reads "the robe of many colors", following Genesis 37:3 in the BSB, not the KJV's "coat".)

### 5.4 The shipped file

`src/data/memory-match/pairs.json`, generated, with a header saying "do not edit":

```jsonc
{
  "about": "Memory match pairs. Generated by scripts/build-memory-match.py; do not edit.",
  "version": 1,
  "stamp": "<hash of inputs>",
  "decks": [ { "key": "beginnings", "title": "In the beginning", "offered": { "easy": true, "medium": true, "hard": true } } ],
  "characters": { "daniel": { "label": "Daniel", "href": "/people/daniel" } },
  "pairs": [
    { "id": "mm-4be1c2", "who": "daniel", "story": "the lions' den", "tier": 1, "decks": ["prophets"],
      "ref": "Daniel 6:16–23", "readerHref": "/read/bsb/DAN/6?hl=16-23",
      "keyVerse": "Daniel 6:22", "keyVerseId": 27006022,
      "words": ["lion", "den"], "notWith": ["belshazzar", "darius"] }
  ]
}
```

**No verse wording in this file.** The site's build runs [check-verse-wording.py](Jarvis/Projects/BibleProject/Website/scripts/check-verse-wording.py) before every build (`prebuild`). It fails if any file under `src/` or `data/` holds a whole verse of ten words or more as a text of its own, outside the Bibles themselves. A `keyQuote` field holding "My God sent His angel and shut the mouths of the lions…" would stop the build. The site's rule, stated at the top of [verses.ts](Jarvis/Projects/BibleProject/Website/src/lib/verses.ts), is that pages and data hold verse ids and the words are looked up there. So the summary takes every board pair's `keyVerseId` and calls `useVerseTable(ids)` from `src/lib/verses.ts`, which reads `data/plain/<bible>/<BOOK>.json` for the site's current Bible: the BSB in English, and a translated Bible where the site's language has one. While the text loads, and if a Bible has no text for that verse, the line shows the reference alone. Story and who labels are only a few words long, so the check never touches them.

At 164 pairs the file is about 40–50 KB raw and roughly 12 KB compressed. It is loaded with a dynamic import on the game route only.

---

## 6. One story, one owner: guarding against ambiguous boards

A board is fair only if every story card on it belongs to exactly one who card on it. Four rules secure that, and the **board-drawing routine** in `board.ts` applies all of them every time cards are dealt.

### 6.1 "Must not share a board" (`notWith`)

This is a curated list. Use it where a player who knows the stories could reasonably match the story card to another character:
- **Same scene, different actor.** "The golden calf" fits Moses as well as Aaron (Moses burned it). "For such a time as this" was said *by Mordecai to* Esther. Ananias was "sent to Straight Street" to the blinded Paul.
- **Same kind of event.** Mordecai "would not bow down", and so did Shadrach, Meshach and Abednego before the statue. Matthew was "called from the tax booth", and Zacchaeus was a tax collector too. Stephen was "stoned for his faith", and Paul was stoned at Lystra. Gehazi and Ananias and Sapphira both "lied" about money. Joash and Josiah were both boy kings.
- **Same name, different story.** The beggar in the parable of the rich man is called Lazarus, so "a great chasm between them" could be claimed by the who card Lazarus.
- **Shared names in the label** (§4.1 rule 4).

The starter list has 59 such links, counted once per pair of characters after the review (§19). The build makes them symmetric, so listing a link on one side is enough.

### 6.2 Shared words between story cards

Two story cards that share a content word ("the walls of Jericho", "the writing on the wall", "rebuilt Jerusalem's walls") are not ambiguous. Each still has one owner, but they tempt a wrong pairing.
- **Easy:** never on one board.
- **Medium and Hard:** allowed, and they are good red herrings, as in NYT Connections.

**How "content word" is worked out** (by the build, stored as `words`, so the browser does no text processing): lower-case the label, drop quotation marks and punctuation, drop a trailing possessive `'s` or `'`, drop stop words (a, an, the, of, in, on, at, to, for, by, his, her, their, from, with, and, as, this, that, me, I, you, all), then drop a final plural `s` from words of four letters or more ("walls" → "wall", "angels" → "angel", "stars" → "star"). Without this, "the walls of Jericho" and "the writing on the wall", or "the angel's announcement" and "angels in the night fields", would not count as sharing a word.

### 6.3 Same first name

Characters whose labels share a first name (Mary Magdalene, Mary of Bethany, Mary, mother of Jesus; King Herod and Herod Agrippa; the Simons; Philip the evangelist and the apostle Philip, if he is added later; Ananias of Damascus and Ananias and Sapphira) are **never on one board**. The "first name" is the label's first word after dropping "The" and "King", lower-cased, with trailing punctuation and a possessive `'s` removed. So King Saul's is "saul", "Mary, mother of Jesus" gives "mary", Lot's wife gives "lot" (and so never meets Lot, who is also on her `notWith` list), and Joseph of Arimathea never meets Joseph of Genesis. The rule also keeps some parable figures apart that would not confuse anyone (The rich fool and The rich man, The wise men and The wise builder). That is harmless, and the board tests confirm every deck still draws. Labels are always qualified anyway, so a Mixed board never shows two cards reading just "Mary".

### 6.4 One story per character

A character appears at most once per board. Moses never brings two of his stories onto the same board, so no story card can belong to "the other Moses card".

### 6.5 The drawing routine

1. Take the pool for the deck and difficulty (§8).
2. Shuffle it with a seeded random generator, putting pairs the player hasn't seen recently first (§10).
3. Walk the list and add each pair that breaks none of §6.1–6.4 against the pairs already chosen.
4. Stop at the board's pair count.
5. If the walk runs out, restart with a fresh shuffle, up to 50 times, then fall back to ignoring the recently-seen order. The tests show this never fails on the starter data (§14).

Then the 2n cards are shuffled into positions with a Fisher–Yates shuffle. Where the type is printed on the backs, a who card and its story are never adjacent in the first two positions. That is a cosmetic nicety against a lucky first move that teaches nothing, not a fairness rule.

### 6.6 Prototype evidence (this step, real data)

The board rules in §6.1–6.4 were run 2,000 times for every deck and difficulty on the 164 starter pairs. **Every draw succeeded.** The thinnest pool is Parables on Hard: 15 characters for a 12-pair board. It is offered, but its boards repeat. Adding parable figures (the workers in the vineyard, the two debtors) is an easy later improvement.

---

## 7. Game rules

### 7.1 Solo (default)

- **A move is two cards turned over.** Turning cards back does not count. A pair stays face up and the next move starts. A non-pair stays visible for a moment (§11), then turns back.
- **Tapping a third card** while a non-pair is showing turns the non-pair back at once and starts the next move with the tapped card. Experienced players never wait.
- **Tapping a face-up or matched card** does nothing and costs nothing.
- **The timer** starts on the first card turned and stops on the last pair. It pauses while the page is hidden (another app or tab). It can be hidden with one tap, which is remembered.
- **The board is finished** when all pairs are found. The summary shows moves, time, stars and the pairs (§10).

### 7.2 Pass and play (2–4 players, one device)

- Chosen on the start screen. Players are "Player 1"… "Player 4", or names typed in, kept for the session only.
- On your turn you turn over two cards. **A pair is yours and you go again.** A non-pair passes the turn. This is the published family rule.
- No timer, no stars, no records. The scoreboard shows pairs per player and whose turn it is, in words and with a highlighted name.
- The end screen ranks the players. Equal scores are a shared win ("Player 1 and Player 3 share the win, with 4 pairs each").

### 7.3 Things deliberately left out

- **No daily board or sharing:** the spec doesn't ask for it. Boards are random, so a daily seed could be added later without data changes.
- **No hint button:** the "Study the pairs" option (§10) covers players who don't know the stories yet.
- **No online multiplayer:** pass and play only.

---

## 8. Difficulty and grid sizes

| | **Easy** | **Medium** | **Hard** |
|---|---|---|---|
| Pairs / cards | 6 / 12 | 9 / 18 | 12 / 24 |
| Grid on a narrow screen (< 640 px wide) | 3 columns × 4 rows | 3 × 6 | 4 × 6 |
| Grid on a wide screen | 4 columns × 3 rows | 6 × 3 | 6 × 4 |
| Card backs | say **Who** or **Story** | say **Who** or **Story** | all the same |
| Pairs drawn from | tier 1. If the deck has fewer than 10 distinct tier-1 characters, tier-2 pairs are added, best known first (question-bank count, then mention count, then pair id, so the order is fixed), until the pool has 10 distinct characters. The build stores the result, so the browser does not rank anything | tiers 1–2 | all tiers, with at least 4 pairs of tier 2 or 3 |
| Story cards sharing a word (§6.2) | never | allowed | allowed |
| A non-pair stays up for | 3 s | 2.5 s | 2 s |
| ★★★ at most (moves) | 11 | 16 | 21 |
| ★★ at most (moves) | 15 | 23 | 30 |

**Why these sizes.** 12, 18 and 24 all divide into 3- and 6-column grids, and 24 also into 4 columns. That keeps every grid full, with no gaps that hint at structure. Text cards need more room than picture cards, so sizes stop at 24 (the classic 36- and 52-card spreads are unreadable as text on a phone).

**Fit check (for the implement step to verify).** On a 360 × 640 phone, after the site header and the game bar (about 64 px), Hard has roughly 6 rows × 80 px. The header is sticky and measures 61 px: a 4 px colour strip, a row with `min-height: 56px` ([site-navigation.css](Jarvis/Projects/BibleProject/Website/src/components/site-navigation.css)) and a 1 px border, plus the safe-area inset on notched phones. Each card is then about 80 × 72 px with the gaps. A real phone's browser bar takes some of the 640 px, so the Playwright check in §14 measures the viewport rather than trusting these sums. Keep the start screen's heading off the board screen, so that the board starts right under the game bar. That holds four lines of 0.75rem text, enough for the longest starter labels of 30 characters ("took extra oil for their lamps", "forgiven much, forgave nothing") with soft-hyphenated long names. Easy and Medium use 0.95rem and 0.85rem. Every card is far above the 24 px minimum target size in WCAG 2.2 and above the common 44 px touch guideline. On a 320 × 568 screen, Hard may scroll by up to one row. That is accepted, because shrinking the text further would hurt more.

**The column count is fixed when cards are dealt** and kept for that board, including on resume. Rotating a phone, resizing a window or zooming never moves a card to a different row or column, which would wreck the player's memory. The cards resize instead. If they no longer fit, the board scrolls.

**Text size and zoom.** At browser zoom of 200% or a very large system text size, cards keep their columns and grow taller, and the page scrolls. Cards never truncate text.

---

## 9. Scoring

- **Moves** decide the stars. Thresholds are `ceil(1.75 × pairs)` for three stars and `ceil(2.5 × pairs)` for two. Every finished board earns at least one star.
  - Three stars is close to what a player with near-perfect recall achieves nine times in ten: the simulated 90th percentile is 10, 15 and 20 moves.
  - Two stars covers a player who forgets now and then.
  - These are formulas, not tuned tables, so a later board size needs no new numbers.
- **The lowest possible score** is one move per pair, a lucky streak. It is accepted and needs no special handling.
- **Time** is shown as m:ss (above 59:59, as "60:00+"). It is recorded as best time, never scored.
- **Records, per device (local storage only, no account, no server):** for each deck and difficulty in solo play, the fewest moves, the fastest time and the most stars. The summary marks a new record in words ("New best: 14 moves").
- **"Studied the pairs first"** (§10) does not change scoring. It shows which story goes with which character, never where the cards are.

---

## 10. Screens

Mobile first, following the site's existing Tailwind tokens and light and dark themes, like the other games under `src/pages/games/`.

1. **Start**
   - Title "Memory card match" and the line "Turn over two cards at a time. Pair each person with their story."
   - **Deck** chips: Mixed, In the beginning, Judges and kings, Prophets and exile, Women of the Bible, Meeting Jesus, The early church, Parables.
   - **How hard** chips: Easy, Medium, Hard, each with its card count ("Easy · 12 cards"). Combinations the build marked as not offered are disabled, with a short reason ("Not enough pairs yet").
   - **Players:** Just me / 2 / 3 / 4. Name fields appear for 2–4 players.
   - A **Deal the cards** button.
   - The best record for the current choice, if there is one.
   - **First run:** a new player's first Easy board on a device always includes Daniel / the lions' den (tracked by its own flag in storage, the way odd-one-out tracks its opening puzzle).
2. **Study the pairs** (optional, a link under Deal the cards: "See the pairs first")
   - A list of the board's who–story pairs, in random order, with references.
   - A **Start playing** button.
   - Positions are not shown.
3. **Board**
   - **Bar above the grid:** in solo, moves, the timer (with a hide button) and "pairs found 3 of 9". In pass and play, each player's pairs, with the current player named ("Player 2's turn").
   - **The grid** (§8).
   - **Under the grid, a "Pairs found" list** grows with each match: "Daniel — the lions' den · Daniel 6". References are plain text during play, so no link leads away from a live board. This list also serves screen-reader users and anyone who wants to re-read a pair.
   - A small **Restart** menu (new cards, same choice) and **Quit** (back to Start, after confirming).
4. **Summary**
   - Solo: "All 9 pairs in 14 moves · 1:32", stars shown as ★ icons *and* words ("3 stars"), and any new record. Pass and play: the ranking.
   - **The stories:** every pair on the board, each with the who label, story label, the key verse quoted (looked up through `useVerseTable` in `src/lib/verses.ts`; the reference alone while it loads or if the text is missing, §5.4), a reader link to the passage, and a person-page link where there is one. Parable figures carry "In a parable Jesus told". The list is short (6–12 entries), so it renders whole, and the rule for long lists does not apply.
   - **Play again** (new cards, same choice) and **Change game** (back to Start).
5. **Can't load**
   - "The cards didn't load" with **Try again**, drawn by the game itself when the dynamic import of `pairs.json` fails. The odd-one-out design notes that the site's `DataUnavailable` is an error class, not a screen.

**Resume.** The board in progress is kept in session storage: the deal, the column count, the cards face up, moves, elapsed time, players and turn. A reload or Back returns to the same board. A new tab starts fresh.

---

## 11. The flip animation

**Structure (CSS only, no animation library):**

```html
<button class="mm-card" aria-label="…">
  <span class="mm-card__inner">            <!-- perspective comes from the grid -->
    <span class="mm-card__face mm-card__back">Who</span>
    <span class="mm-card__face mm-card__front">…label, only when face up…</span>
  </span>
</button>
```

- The grid sets `perspective: 800px`. `.mm-card__inner` has `transform-style: preserve-3d` and `transition: transform 300ms cubic-bezier(.2,.7,.3,1)`. A face-up card's inner element gets `transform: rotateY(180deg)`.
- Both faces are absolutely positioned with `backface-visibility: hidden`, plus the `-webkit-` prefix for older iOS Safari. The front face is pre-rotated by `rotateY(180deg)`.
- Only `transform` and `opacity` animate (cheap on phones; 24 cards are well within budget). There is no `will-change` on idle cards.
- **A match:** 150 ms after the second card lands, both cards take the pair's colour, gain a ✓ and the word "Matched", and settle once (scale 1 → 1.04 → 1 over 220 ms). No confetti, though a subtle finish (the cards settle in a wave) is fine.
- **A non-pair:** both cards stay up for the difficulty's delay (§8), then turn back in 250 ms. A tap on a third card cuts the wait (§7.1).
- **Face-down text is not in the page.** The front face's label is rendered only while the card is face up or matched, and for the 250 ms it takes to turn back. Otherwise the text would be read out by screen readers, visible to text search and selectable, which is cheating by accident.
- **The game logic does not wait for animation events.** State changes run on timers whose lengths match the CSS durations. This keeps the rules identical under reduced motion, in tests (jsdom has no transitions) and in background tabs.
- **Reduced motion** (`prefers-reduced-motion: reduce`): no rotation and no settle. Faces swap with a 120 ms cross-fade, and matched cards just change colour and gain the ✓.
- **Forced colours** (Windows high contrast): a `forced-colors: active` block gives faces system-colour borders and keeps the ✓ and "Matched" text, since background colours are dropped in that mode.
- **Pair colours** come from the site's seven book colours (history, poetry, prophets, gospels, acts, epistles, revelation), cycling through the pairs. They decorate. The ✓ and the words carry the meaning.

---

## 12. Accessibility

- **Real buttons.** Each card is a `<button>` in a `role="group"` labelled "Cards, 3 columns by 6 rows". A single tab stop enters the grid (roving tabindex).
  - Arrow keys move by row and column using the dealt column count. Home and End go to the first and last card.
  - Enter or Space turns a card over.
  - Matched cards stay focusable, so arrow movement stays predictable, but activating them does nothing.
- **Names that say what a sighted player sees:**
  - face down: "Row 2, column 3, face down, who card". On Hard: "…, face down".
  - face up: "Daniel, who card, face up".
  - matched: "Daniel, matched with the lions' den".
- **Status messages** in an `aria-live="polite"` region (WCAG 4.1.3):
  - first card: "Daniel."
  - pair: "The lions' den. A pair: Daniel and the lions' den. 3 of 6 pairs found."
  - non-pair: "The burning bush. Not a pair."
  - pass and play: "Player 2's turn."
  - end: "All pairs found in 14 moves."
- **Focus** stays on the card just turned. When the board is finished, focus moves to the summary heading.
- **No time limit, ever, and adjustable timing** (WCAG 2.2.1).
  - A setting, "Turn non-pairs back: after a moment / when I tap", is remembered on the device.
  - The timer can be hidden and is never scored.
  - Hold timers pause while the page is hidden.
- **Colour is never the only signal** (WCAG 1.4.1). Matched cards show ✓ and "Matched". The Who and Story backs differ in their words and in a border pattern (solid vs dashed), not in colour alone.
- **Contrast** meets WCAG AA in both themes for card text, backs and the ✓.
- **Motion:** reduced-motion and forced-colours handling as in §11.
- **Reading load:** Easy uses short, well-known labels, Who/Story backs and the longest look at non-pairs. "See the pairs first" helps players who don't yet know the stories.
- **Language:** the board is marked `lang="en"`, so screen readers pronounce the names in English.

---

## 13. Files

**New, this feature only:**
- `scripts/build-memory-match.py`
- `scripts/memory-match/characters.json`, `scripts/memory-match/pairs.json` (hand-kept)
- `scripts/tests/test_memory_match.py` (pytest, run by `npm run test:data`)
- `src/data/memory-match/pairs.json` (generated)
- `docs/features/memory-match/review-sheet.md` (generated)
- `src/pages/games/memory-match/`:
  - `MemoryMatchGame.tsx`: the screens. A **default export, a React component with no props**, as the [games README](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) requires.
  - `Board.tsx`, `Card.tsx`, `Summary.tsx`
  - `game.ts`: the pure state machine (turning cards, matching, moves, turns, stars, timer arithmetic)
  - `board.ts`: drawing pairs and dealing positions (§6.5)
  - `storage.ts`: records, seen pairs, the opening flag, settings and resume, under keys `bp-memory-match-best`, `-seen`, `-opener`, `-settings`, `-game`
  - `memory-match.css`
  - tests (§14)

**Touched (one entry):** the games hub registry [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts). Only the `memory-match` entry changes: `status: "live"` and `load: () => import("./memory-match/MemoryMatchGame")`, keeping its title, description, audiences, shelf and art. **No change** to App.tsx, the menu, the hub page, the hub's art or [games.test.tsx](Jarvis/Projects/BibleProject/Website/src/pages/games/games.test.tsx), whose counts follow the registry. *(Note from the odd-one-out implementation: registry.ts was left uncommitted there because the hub itself was uncommitted. The implement step should check the file's state and report it the same honest way.)*

---

## 14. Tests

All run under `npm test` (vitest) unless marked pytest.

**`pairs.test.ts`** checks the shipped data:
- Every pair's `who` exists, ids are unique, and there is no duplicate `(who, story)`.
- Labels are at most 30 characters, and long words carry soft hyphens.
- No story label contains its own character's label words.
- `notWith` is symmetric and every key exists.
- Every offered combination has at least *pairs on the board + 3* distinct characters in its pool.
- Daniel / the lions' den is present, tier 1.
- Every `keyVerseId` is a well-formed `BBCCCVVV` id, and no pair carries verse wording (there is no `keyQuote` field, §5.4).

**`board.test.ts`** checks the drawing routine (§6.5) over 1,000 seeded draws for every offered deck and difficulty:
- The board has exactly n pairs and 2n cards, each pair once.
- No character appears twice, no two labels share a first name, and no `notWith` link falls within a board.
- On Easy, no two story cards share a content word.
- On Hard, at least 4 pairs are tier 2 or 3.
- Recently seen pairs are avoided while the pool allows, and the oldest come back first when it runs out.
- Card positions are a permutation, and over many seeds each pair's cards land in every position roughly equally often.
- The first Easy board on a fresh device contains the spec's pair.

**`game.test.ts`** checks the rules:
- Two cards make one move, a pair stays up and a non-pair turns back.
- A third tap during a non-pair turns it back and starts the next move.
- Taps on face-up or matched cards, and double taps, are ignored.
- Stars at the threshold edges (11 vs 12 moves on Easy).
- The timer starts on the first card, stops on the last pair and excludes hidden time.
- Pass and play: a pair means another turn, a non-pair passes it, the ranking is right and ties are shared.
- A corrupt saved game or record is ignored safely.

**`MemoryMatchGame.test.tsx`** checks the page:
- Start to finish on a seeded Easy board using only the keyboard (arrow keys and Enter).
- Live-region messages for a pair and a non-pair.
- Face-down cards contain no story or character text in the page.
- The reduced-motion class path works.
- The summary lists every pair with working reader links, and shows each key verse's text once the verse lookup answers (mock `useVerseTable` with `vi.mock("@/lib/verses")`; no existing page test does this yet, so this test sets the pattern), or the reference alone when it answers with no text.
- The hub serves the game at `/games/memory-match`.

**`test_memory_match.py`** (pytest) checks the builder:
- A missing check word fails the build ("budded" for Num 17:8).
- An unknown person id fails.
- A story naming its own character fails ("Noah's ark").
- A capitalised word shared with another who label, without a `notWith` link, fails.
- A key verse outside the passage fails.
- A quoted label that is not BSB wording fails ("You are the man!" for 2 Sam 12:7).
- A `notWith` key that is not a who card fails (the draft's "Eli").
- The content words come out as §6.2 says ("the walls of Jericho" → `wall`, `jericho`).
- Removing the spec's pair fails.
- `notWith` comes out symmetric.
- The ids are stable across runs.
- `--check` detects changed output, and passes on the real site data.

**Layout (Playwright, existing `npm run test:e2e` setup):**
- At 360 × 640, a seeded Hard board with the longest labels fits with no card text clipped.
- At 320 × 568, it scrolls by no more than one row.
- Rotating mid-game keeps every card in its row and column.

**Before handing back**, the implement step runs `npm test`, `npm run test:data`, `npm run typecheck`, `npm run lint`, `py -3.12 scripts/check-verse-wording.py` (part of `prebuild`, so it decides whether the build can run at all) and `npm run build`, and reports the results honestly, including failures elsewhere in the site that were already there.

---

## 15. Cost

- **Playing:** none. Static JSON, no server calls, no model.
- **Building the data:** none. Local Python, no model.
- **Writing the pairs:** the starter list in Appendix A was written and checked in this step. The implement step adds person ids and soft hyphens, and may trim or add pairs. It is hand work, not a batch job.

---

## 16. Edge cases

| Case | Handling |
|---|---|
| A story more than one character could claim ("parted the water") | Avoided in wording where possible ("dipped seven times", not "washed in the Jordan", since John baptised there). Otherwise covered by a `notWith` link (§6.1). |
| One character, several stories (Moses, Elijah, Peter, Paul) | At most one per board (§6.4). Different boards show different stories, which adds variety. |
| Same-name people (three Marys, two Herods, Simons, Philips, Ananiases, King Saul vs Saul who became Paul) | Labels are always qualified (King Saul; Paul is "Paul"). Same first names never share a board (§6.3). Ids are explicit (§5.1). |
| A story card that names someone (the giant Goliath, Naboth's vineyard) | Allowed only for people who are not who cards. A shared capitalised word with any who label needs a `notWith` link, or the build fails (§4.1). |
| Group characters (Shadrach, Meshach, Abednego; the wise men; the shepherds) | `group: true` and no person link. Labels within 30 characters. |
| Unnamed people (Lot's wife, the Samaritan woman, the widow of Zarephath) | Allowed, with no person link. The reader link carries the reference. |
| Parable figures | Their own deck, marked "In a parable Jesus told" (§4). The owner may drop the deck (§17). |
| KJV wording creeping into a card | The BSB check word (§5.3). Quotations must be BSB text. |
| Violence or adult themes | Editorial rule: no sexual stories. Violent ones are tier 2–3 and never on Easy (§4). |
| A deck too thin for a difficulty | The build marks it not offered, and the chip is disabled with a reason. Mixed must always be offered. |
| Double tap, or tapping during the flip | The first tap counts. Taps on face-up or matched cards are ignored. Taps during the 300 ms flip of the second card are ignored, and taps during the non-pair hold turn the pair back (§7.1). |
| Rotation, resize, zoom mid-game | The column count is fixed at the deal and the cards resize. If they don't fit, the board scrolls (§8). |
| Reload or Back mid-game | Resumed from session storage (§10). |
| Page hidden mid-game (call, app switch) | The timer and hold timers pause. On return, a non-pair still showing gets its full delay again. |
| Local storage unavailable or corrupt | The game still works, without records, the seen list or remembered settings. Corrupt values are ignored, never thrown. |
| Session storage corrupt | A fresh deal instead of a crash. |
| Data file fails to load | The can't-load screen with Try again. |
| Key verse text slow, missing or failing to load | The summary still renders. Each line shows its reference and reader link, and the quote fills in when the lookup answers. A Bible with no text for that verse leaves the reference alone (§5.4). |
| Very long names | Soft hyphens in the data, wrapping text, and the 30-character cap, all tested at 320 px (§8, §14). |
| Screen-reader player | Full keyboard play, announced card text and results, and the Pairs found list (§12). |
| Pass and play: a player leaves | Quit and deal again. No forfeit logic (YAGNI). |
| Pass and play: tie | A shared win, named in words (§7.2). |
| Pool exhausted for the seen list | The oldest seen pairs come back first (§6.5). |
| Site data changes later (people rebuilt) | `--check` fails in `npm run test:data`, and a rebuild re-checks every id. Stable pair ids keep the seen lists valid. |
| Translation into the site's other languages | Version 1 is English, as for the other games. The labels are data, so a later per-language file can be added without logic changes. |

---

## 17. Open points for the review step and the owner

1. **Owner (optional):** keep or drop the Parables deck. It stretches "character" to people in stories Jesus told. The game is complete without it, and Mixed then draws from the other six decks.
2. **Review step:** done; see §19. Appendix A was read critically and corrected in place, and the §8 fit numbers were checked against the real header.
3. **Implement step:**
   - Choose the 52 person ids marked "choose" in Appendix A. Watch the ones the prototype got wrong (§5.1), and for Lazarus take `lazarus-jhn-11-1`, not the parable's beggar.
   - Ship verse ids, never verse wording, and run `scripts/check-verse-wording.py` (§5.4).
   - Add soft hyphens.
   - Read the generated review sheet before handing back.
   - Report how many pairs each deck and difficulty reached and which combinations, if any, are hidden.

---

## 18. Sources

- Daniel J. Velleman and Gregory S. Warrington, "What to Expect in a Game of Memory", *The American Mathematical Monthly* 120(9), 2013, pp. 787–805, doi:10.4169/amer.math.monthly.120.09.787. Publication list: <https://www.amherst.edu/people/facstaff/djvelleman/publications>
- Lynne Baker-Ward and Peter A. Ornstein, "Age differences in visual-spatial memory performance: Do children really out-perform adults when playing Concentration?", *Bulletin of the Psychonomic Society* 26, 1988, pp. 331–332: <https://link.springer.com/article/10.3758/BF03337672>
- Joyce Chagnon and Stuart J. McKelvie, "Age Differences in Performance at Concentration: A Pilot Study", *Perceptual and Motor Skills* 74(2), 1992: <https://doi.org/10.2466/pms.1992.74.2.412>
- Samantha Gualtieri and Amy S. Finn, "The Sweet Spot: When Children's Developing Abilities, Brains, and Knowledge Make Them Better Learners Than Adults", *Perspectives on Psychological Science*, 2022 (a review citing the Concentration studies): <https://journals.sagepub.com/doi/full/10.1177/17456916211045971>
- Henry L. Roediger III and Jeffrey D. Karpicke, "Test-Enhanced Learning", *Psychological Science* 17(3), 2006 (the testing effect)
- Concentration (card game): <https://en.wikipedia.org/wiki/Concentration_(card_game)>. Concentration (NBC game show, 1958–1973): <https://en.wikipedia.org/wiki/Concentration_(game_show)>
- Ravensburger *memory®* history (William Hurter, 1958–59): <https://www.alte-spiele.de/Memory.htm>, <https://www.brandora.de/de/licensing/brand-hub/de_memory>
- W3C, WCAG 2.2 (success criteria 1.4.1, 2.2.1, 2.3.3, 2.5.8, 4.1.3) and the WAI-ARIA Authoring Practices (roving tabindex): <https://www.w3.org/TR/WCAG22/>, <https://www.w3.org/WAI/ARIA/apg/>
- Site data: the BSB text and section headings in `data/text/bsb/`, people.json, people-slugs.json, bank.json (§3)

---

## Appendix A. Starter pairs (164, checked against the BSB in this step)

How to read it:
- **Check word:** the word the build requires in the BSB passage. All 164 were found in this step.
- **Tier:** 1 well known, 2 known to regular readers, 3 deeper cuts.
- **Person record:** the people.json id where the name is unique. "Choose" marks names shared by several records, where the implement step picks the right id by hand. "None" means a group, an unnamed person or a parable figure.
- **Must not share a board with:** the `notWith` links (§6.1). The build makes them symmetric.

| # | Who | Story card | Passage (BSB) | Check word | Tier | Decks | Person record | Must not share a board with |
|---|---|---|---|---|---|---|---|---|
| 1 | Adam | named the animals | GEN 2:19-20 | names | 1 | Beginnings | `adam-gen-2-19` | — |
| 2 | Eve | the serpent and the fruit | GEN 3:1-6 | serpent | 1 | Beginnings | `eve-gen-3-20` | Adam |
| 3 | Cain | killed his brother | GEN 4:8 | killed | 2 | Beginnings | `cain-gen-4-1` | — |
| 4 | Enoch | God took him away | GEN 5:24 | taken | 2 | Beginnings | choose: 2 named Enoch | Noah, Elijah |
| 5 | Methuselah | lived 969 years | GEN 5:27 | 969 | 2 | Beginnings | `methuselah-gen-5-21` | — |
| 6 | Noah | the ark and the flood | GEN 6:13-22 | ark | 1 | Beginnings | choose: 2 named Noah | — |
| 7 | Abraham | counted the stars | GEN 15:5 | stars | 2 | Beginnings | `abraham-gen-11-26` | — |
| 8 | Abraham | the ram in the thicket | GEN 22:13 | thicket | 2 | Beginnings | `abraham-gen-11-26` | Isaac |
| 9 | Lot | fled from Sodom | GEN 19:15-29 | Sodom | 2 | Beginnings | `lot-gen-11-27` | Lot's wife |
| 10 | Lot's wife | a pillar of salt | GEN 19:26 | salt | 1 | Beginnings, Women | none (no link) | — |
| 11 | Esau | sold his birthright | GEN 25:29-34 | birthright | 1 | Beginnings | `esau-gen-25-25` | Jacob |
| 12 | Isaac | blessed the wrong son | GEN 27:18-29 | bless | 2 | Beginnings | `isaac-gen-17-19` | Jacob, Rebekah |
| 13 | Jacob | a ladder to heaven | GEN 28:10-17 | ladder | 1 | Beginnings | `jacob-mat-1-15` | — |
| 14 | Jacob | wrestled until daybreak | GEN 32:24-30 | wrestled | 2 | Beginnings | `jacob-mat-1-15` | — |
| 15 | Joseph | the robe of many colors | GEN 37:3 | colors | 1 | Beginnings | choose: 10 named Joseph | — |
| 16 | Joseph | Pharaoh's dreams | GEN 41:14-32 | dream | 2 | Beginnings | choose: 10 named Joseph | — |
| 17 | Moses | a basket among the reeds | EXO 2:3-10 | basket | 1 | Beginnings | `moses-exo-2-10` | Miriam |
| 18 | Moses | the burning bush | EXO 3:1-6 | bush | 1 | Beginnings | `moses-exo-2-10` | — |
| 19 | Moses | the Ten Commandments | EXO 20:1-17; EXO 34:28 | Ten Commandments | 1 | Beginnings | `moses-exo-2-10` | — |
| 20 | Aaron | the golden calf | EXO 32:1-6 | calf | 1 | Beginnings | `aaron-exo-4-14` | Moses |
| 21 | Aaron | his staff sprouted almonds | NUM 17:8 | almonds | 2 | Beginnings | `aaron-exo-4-14` | — |
| 22 | Korah | swallowed by the earth | NUM 16:31-33 | swallowed | 2 | Beginnings | choose: 4 named Korah | — |
| 23 | Balaam | the talking donkey | NUM 22:28-30 | donkey | 1 | Beginnings | `balaam-num-22-5` | — |
| 24 | Caleb | still strong at eighty-five | JOS 14:10-11 | eighty-five | 2 | Beginnings | choose: 2 named Caleb | — |
| 25 | Joshua | the walls of Jericho | JOS 6:20 | wall | 1 | Beginnings | choose: 5 named Joshua | Rahab |
| 26 | Joshua | the sun stood still | JOS 10:12-13 | sun | 2 | Beginnings | choose: 5 named Joshua | — |
| 27 | Achan | loot hidden in his tent | JOS 7:21 | tent | 2 | Judges & kings | `achan-jos-7-1` | — |
| 28 | Ehud | the left-handed judge | JDG 3:15 | left-handed | 2 | Judges & kings | choose: 2 named Ehud | — |
| 29 | Gideon | the fleece on the floor | JDG 6:36-40 | fleece | 1 | Judges & kings | `gideon-jdg-6-11` | — |
| 30 | Gideon | trumpets and torches in jars | JDG 7:16-20 | jars | 2 | Judges & kings | `gideon-jdg-6-11` | — |
| 31 | Jephthah | a rash vow | JDG 11:30-31 | vow | 3 | Judges & kings | `jephthah-jdg-11-1` | — |
| 32 | Samson | strength in his hair | JDG 16:17 | hair | 1 | Judges & kings | `samson-jdg-13-24` | Delilah |
| 33 | Samson | the lion and the honey | JDG 14:5-9 | honey | 2 | Judges & kings | `samson-jdg-13-24` | — |
| 34 | Samuel | a voice calling at night | 1SA 3:4-10 | called | 1 | Judges & kings | `samuel-1sa-1-20` | — |
| 35 | King Saul | hid among the baggage | 1SA 10:22 | baggage | 2 | Judges & kings | `saul-1sa-9-2` | — |
| 36 | King Saul | the medium at Endor | 1SA 28:7-14 | Endor | 2 | Judges & kings | `saul-1sa-9-2` | — |
| 37 | David | the giant Goliath | 1SA 17:4-50 | Goliath | 1 | Judges & kings | `david-rut-4-17` | — |
| 38 | David | played the harp for the king | 1SA 16:23 | harp | 2 | Judges & kings | `david-rut-4-17` | — |
| 39 | Jonathan | the arrows signal | 1SA 20:20-22 | arrows | 2 | Judges & kings | choose: 12 named Jonathan | David |
| 40 | Absalom | his head caught in an oak | 2SA 18:9 | oak | 2 | Judges & kings | `absalom-2sa-3-3` | — |
| 41 | Nathan | "You are that man!" | 2SA 12:7 | man | 2 | Judges & kings | choose: 6 named Nathan | David |
| 42 | Uzzah | steadied the ark | 2SA 6:6-7 | ark | 3 | Judges & kings | choose: 2 named Uzzah | — |
| 43 | Solomon | asked God for wisdom | 1KI 3:5-12 | wise | 1 | Judges & kings | `solomon-2sa-5-14` | — |
| 44 | Solomon | two mothers, one baby | 1KI 3:16-28 | sword | 1 | Judges & kings | `solomon-2sa-5-14` | — |
| 45 | Ahab | Naboth's vineyard | 1KI 21:1-16 | vineyard | 2 | Judges & kings | choose: 2 named Ahab | Jezebel |
| 46 | Elijah | fed by ravens | 1KI 17:4-6 | ravens | 1 | Judges & kings, Prophets & exile | choose: 4 named Elijah | — |
| 47 | Elijah | fire on Mount Carmel | 1KI 18:19-39 | fire | 1 | Judges & kings, Prophets & exile | choose: 4 named Elijah | — |
| 48 | Elijah | taken up in a whirlwind | 2KI 2:11 | whirlwind | 1 | Judges & kings, Prophets & exile | choose: 4 named Elijah | — |
| 49 | Elisha | the floating axe head | 2KI 6:5-7 | float | 2 | Judges & kings, Prophets & exile | `elisha-1ki-19-16` | — |
| 50 | Naaman | dipped seven times | 2KI 5:10-14 | seven | 1 | Judges & kings, Prophets & exile | choose: 4 named Naaman | Elisha |
| 51 | Jehu | drove like a madman | 2KI 9:20 | madman | 2 | Judges & kings | choose: 5 named Jehu | — |
| 52 | Joash | a baby hidden in the temple | 2KI 11:2-3 | hid | 3 | Judges & kings | choose: 8 named Joash | Josiah |
| 53 | Hezekiah | the shadow went back | 2KI 20:9-11 | shadow | 2 | Judges & kings | choose: 4 named Hezekiah | — |
| 54 | Josiah | king at eight years old | 2KI 22:1 | eight | 2 | Judges & kings | choose: 2 named Josiah | — |
| 55 | Uzziah | leprosy for burning incense | 2CH 26:16-21 | incense | 3 | Judges & kings | choose: 5 named Uzziah | — |
| 56 | Daniel | the lions' den | DAN 6:16-23 | den | 1 | Prophets & exile | choose: 2 named Daniel | — |
| 57 | Shadrach, Meshach, Abednego | the fiery furnace | DAN 3:19-27 | furnace | 1 | Prophets & exile | none (no link) | — |
| 58 | Belshazzar | the writing on the wall | DAN 5:5-28 | wall | 1 | Prophets & exile | `belshazzar-dan-5-1` | Daniel |
| 59 | Nebuchadnezzar | ate grass like an ox | DAN 4:33 | grass | 2 | Prophets & exile | `nebuchadnezzar-2ki-24-1` | Shadrach, Meshach, Abednego |
| 60 | Jonah | the great fish | JON 1:17 | fish | 1 | Prophets & exile | `jonah-2ki-14-25` | — |
| 61 | Jonah | the vine that withered | JON 4:6-7 | plant | 3 | Prophets & exile | `jonah-2ki-14-25` | — |
| 62 | Isaiah | a live coal on his lips | ISA 6:6-7 | coal | 2 | Prophets & exile | `isaiah-2ki-19-2` | — |
| 63 | Jeremiah | lowered into a muddy cistern | JER 38:6 | cistern | 2 | Prophets & exile | choose: 8 named Jeremiah | — |
| 64 | Jeremiah | the potter's house | JER 18:1-6 | potter | 2 | Prophets & exile | choose: 8 named Jeremiah | — |
| 65 | Ezekiel | the valley of dry bones | EZK 37:1-10 | bones | 1 | Prophets & exile | `ezekiel-ezk-1-3` | — |
| 66 | Hosea | married Gomer | HOS 1:2-3 | Gomer | 3 | Prophets & exile | `hosea-hos-1-1` | — |
| 67 | Amos | a basket of summer fruit | AMO 8:1-2 | fruit | 3 | Prophets & exile | choose: 2 named Amos | — |
| 68 | Nehemiah | rebuilt Jerusalem's walls | NEH 2:17-18 | wall | 1 | Prophets & exile | choose: 3 named Nehemiah | — |
| 69 | Ezra | read the Law to the people | NEH 8:1-8 | read | 2 | Prophets & exile | choose: 2 named Ezra | Josiah, Nehemiah |
| 70 | Mordecai | would not bow down | EST 3:2 | bow | 2 | Prophets & exile | choose: 2 named Mordecai | Shadrach, Meshach, Abednego |
| 71 | Haman | hanged on his own gallows | EST 7:9-10 | gallows | 2 | Prophets & exile | `haman-est-3-1` | — |
| 72 | Job | lost all, yet praised God | JOB 1:13-22 | naked | 1 | Prophets & exile | `job-job-1-1` | — |
| 73 | Gehazi | lied and got leprosy | 2KI 5:20-27 | leprous | 3 | Prophets & exile | `gehazi-2ki-4-12` | Naaman, Elisha, Ananias and Sapphira |
| 74 | Baruch | wrote the scroll as dictated | JER 36:4 | scroll | 3 | Prophets & exile | choose: 4 named Baruch | Jeremiah |
| 75 | Jehoiakim | burned the scroll | JER 36:22-23 | fire | 3 | Prophets & exile | `jehoiakim-2ki-23-34` | Baruch, Jeremiah |
| 76 | Zerubbabel | laid the temple foundation | EZR 3:8-11 | foundation | 3 | Prophets & exile | choose: 2 named Zerubbabel | Solomon |
| 77 | Darius | signed a law he regretted | DAN 6:6-14 | distressed | 3 | Prophets & exile | choose: 3 named Darius | Daniel |
| 78 | Sarah | laughed at God's promise | GEN 18:10-15 | laughed | 1 | Women, Beginnings | `sarah-gen-11-29` | Abraham |
| 79 | Hagar | the God who sees me | GEN 16:7-13 | sees | 2 | Women, Beginnings | `hagar-gen-16-1` | — |
| 80 | Rebekah | water for the camels | GEN 24:15-20 | camels | 2 | Women, Beginnings | `rebekah-gen-22-23` | — |
| 81 | Rachel | stole her father's idols | GEN 31:19 | idols | 3 | Women, Beginnings | `rachel-gen-29-6` | — |
| 82 | Miriam | danced with a tambourine | EXO 15:20 | tambourine | 2 | Women, Beginnings | choose: 2 named Miriam | — |
| 83 | Rahab | the scarlet cord | JOS 2:15-21 | scarlet | 1 | Women, Beginnings | `rahab-jos-2-1` | — |
| 84 | Deborah | judged under a palm tree | JDG 4:4-5 | palm | 2 | Women, Judges & kings | choose: 2 named Deborah | — |
| 85 | Jael | the tent peg | JDG 4:21 | peg | 2 | Women, Judges & kings | `jael-jdg-4-17` | — |
| 86 | Delilah | the secret of his strength | JDG 16:4-19 | strength | 2 | Women, Judges & kings | `delilah-jdg-16-4` | Samson |
| 87 | Naomi | "Call me Mara" | RUT 1:20 | Mara | 3 | Women, Judges & kings | `naomi-rut-1-2` | — |
| 88 | Ruth | "Wherever you go, I will go" | RUT 1:16 | go | 1 | Women, Judges & kings | `ruth-rut-1-4` | Naomi |
| 89 | Ruth | gleaned in Boaz's field | RUT 2:2-3 | glean | 1 | Women, Judges & kings | `ruth-rut-1-4` | — |
| 90 | Hannah | prayed for a son | 1SA 1:10-11 | prayed | 1 | Women, Judges & kings | `hannah-1sa-1-2` | — |
| 91 | Abigail | loaded donkeys with food | 1SA 25:18 | donkeys | 2 | Women, Judges & kings | choose: 2 named Abigail | — |
| 92 | The queen of Sheba | tested the king's wisdom | 1KI 10:1-3 | test | 2 | Women, Judges & kings | none (no link) | Solomon |
| 93 | The widow of Zarephath | the flour that never ran out | 1KI 17:12-16 | flour | 2 | Women, Judges & kings | none (no link) | Elijah |
| 94 | Jezebel | thrown from a window | 2KI 9:30-33 | window | 2 | Women, Judges & kings | `jezebel-1ki-16-31` | Eutychus |
| 95 | Esther | "For such a time as this" | EST 4:14 | time | 1 | Women, Prophets & exile | `esther-est-2-7` | Mordecai |
| 96 | Mary, mother of Jesus | the angel's announcement | LUK 1:26-38 | angel | 1 | Women, Meeting Jesus | choose: 5 named Mary | Zechariah |
| 97 | Elizabeth | the baby leaped for joy | LUK 1:41-44 | leaped | 2 | Women, Meeting Jesus | `elizabeth-luk-1-5` | Mary, mother of Jesus |
| 98 | Anna | prophetess in the temple | LUK 2:36-38 | prophetess | 3 | Women, Meeting Jesus | `anna-luk-2-36` | Simeon |
| 99 | Martha | distracted by preparations | LUK 10:40 | preparations | 1 | Women, Meeting Jesus | `martha-luk-10-38` | — |
| 100 | Mary of Bethany | sat at Jesus' feet | LUK 10:39 | feet | 1 | Women, Meeting Jesus | choose: 5 named Mary | — |
| 101 | Mary Magdalene | first to see the risen Jesus | JHN 20:11-18 | Rabboni | 1 | Women, Meeting Jesus | choose: 5 named Mary | — |
| 102 | The Samaritan woman | met Jesus at a well | JHN 4:6-26 | well | 1 | Women, Meeting Jesus | none (no link) | — |
| 103 | Lydia | a dealer in purple cloth | ACT 16:14 | purple | 2 | Women, Early church | `lydia-act-16-14` | — |
| 104 | Tabitha | made clothes for widows | ACT 9:36-41 | widows | 2 | Women, Early church | `tabitha-act-9-36` | — |
| 105 | Priscilla | tentmaker with her husband | ACT 18:2-3 | tentmakers | 2 | Women, Early church | `priscilla-act-18-2` | Paul |
| 106 | Rhoda | forgot to open the gate | ACT 12:13-16 | gate | 2 | Women, Early church | `rhoda-act-12-13` | — |
| 107 | The wise men | followed the star | MAT 2:1-11 | star | 1 | Meeting Jesus | none (no link) | — |
| 108 | The shepherds | angels in the night fields | LUK 2:8-15 | shepherds | 1 | Meeting Jesus | none (no link) | — |
| 109 | King Herod | outwitted by the Magi | MAT 2:16 | outwitted | 2 | Meeting Jesus | choose: 3 named Herod | The wise men |
| 110 | Zechariah | struck silent | LUK 1:18-22 | silent | 2 | Meeting Jesus | choose: 29 named Zechariah | — |
| 111 | Simeon | held the baby in the temple | LUK 2:25-32 | arms | 2 | Meeting Jesus | choose: 4 named Simeon | Anna |
| 112 | John the Baptist | locusts and wild honey | MAT 3:4 | locusts | 1 | Meeting Jesus | choose: 4 named John | — |
| 113 | John the Baptist | baptized Jesus | MAT 3:13-17 | baptized | 1 | Meeting Jesus | choose: 4 named John | — |
| 114 | Peter | walked on the water | MAT 14:28-31 | walked | 1 | Meeting Jesus | `peter-mat-4-18` | — |
| 115 | Peter | the rooster crowed | MAT 26:69-75 | rooster | 1 | Meeting Jesus | `peter-mat-4-18` | — |
| 116 | Andrew | the boy with five loaves | JHN 6:8-9 | loaves | 2 | Meeting Jesus | `andrew-mat-4-18` | — |
| 117 | Nathanael | seen under the fig tree | JHN 1:45-50 | fig | 2 | Meeting Jesus | `nathanael-jhn-1-45` | — |
| 118 | Matthew | called from the tax booth | MAT 9:9 | tax | 1 | Meeting Jesus | `matthew-mat-9-9` | Zacchaeus |
| 119 | Nicodemus | came to Jesus at night | JHN 3:1-2 | night | 1 | Meeting Jesus | `nicodemus-jhn-3-1` | — |
| 120 | Jairus | his daughter raised | MRK 5:22-42 | daughter | 2 | Meeting Jesus | `jairus-mrk-5-22` | — |
| 121 | Bartimaeus | the blind beggar at Jericho | MRK 10:46-52 | blind | 1 | Meeting Jesus | `bartimaeus-mrk-10-46` | — |
| 122 | Zacchaeus | climbed a sycamore tree | LUK 19:1-10 | sycamore | 1 | Meeting Jesus | `zacchaeus-luk-19-2` | — |
| 123 | Lazarus | raised after four days | JHN 11:38-44 | four days | 1 | Meeting Jesus | choose: 2 named Lazarus (take `lazarus-jhn-11-1`; `lazarus-luk-16-20` is the beggar in the parable) | The rich man |
| 124 | Thomas | "Unless I see the nail marks" | JHN 20:24-29 | nail | 1 | Meeting Jesus | `thomas-mat-10-3` | — |
| 125 | Judas Iscariot | thirty pieces of silver | MAT 26:14-16 | silver | 1 | Meeting Jesus | choose: 5 named Judas | — |
| 126 | Pontius Pilate | washed his hands | MAT 27:24 | washed | 1 | Meeting Jesus | `pilate-mat-27-2` | — |
| 127 | Barabbas | set free instead of Jesus | MAT 27:15-26 | released | 2 | Meeting Jesus | `barabbas-mat-27-16` | — |
| 128 | Simon of Cyrene | carried the cross | MRK 15:21 | cross | 2 | Meeting Jesus | choose: 7 named Simon | — |
| 129 | Joseph of Arimathea | gave his own tomb | MAT 27:57-60 | tomb | 2 | Meeting Jesus | choose: 10 named Joseph | Nicodemus |
| 130 | Paul | blinded on the Damascus road | ACT 9:1-9 | Damascus | 1 | Early church | `paul-act-7-58` | Ananias of Damascus |
| 131 | Paul | shipwrecked on Malta | ACT 27:39-28:1 | Malta | 1 | Early church | `paul-act-7-58` | — |
| 132 | Silas | sang in prison at midnight | ACT 16:25-26 | midnight | 1 | Early church | `silas-act-15-22` | Paul |
| 133 | The Philippian jailer | "What must I do to be saved?" | ACT 16:27-34 | saved | 2 | Early church | none (no link) | Silas, Paul |
| 134 | Stephen | stoned for his faith | ACT 7:54-60 | stone | 2 | Early church | `stephen-act-6-5` | Paul |
| 135 | Philip the evangelist | ran up to a chariot | ACT 8:26-39 | chariot | 2 | Early church | choose: 4 named Philip | The Ethiopian official |
| 136 | The Ethiopian official | baptized on a desert road | ACT 8:26-39 | water | 2 | Early church | none (no link) | Philip the evangelist |
| 137 | Ananias of Damascus | sent to Straight Street | ACT 9:10-18 | Straight | 3 | Early church | choose: 3 named Ananias | Paul |
| 138 | Ananias and Sapphira | lied about the money | ACT 5:1-11 | lie | 2 | Early church | none (no link) | Barnabas |
| 139 | Barnabas | sold a field for the church | ACT 4:36-37 | field | 2 | Early church | `barnabas-act-4-36` | Ananias and Sapphira |
| 140 | Cornelius | a centurion's vision | ACT 10:1-8 | vision | 2 | Early church | `cornelius-act-10-1` | Peter |
| 141 | Peter | a sheet full of animals | ACT 10:9-16 | sheet | 2 | Early church | `peter-mat-4-18` | Cornelius |
| 142 | Peter | freed from prison by an angel | ACT 12:6-11 | angel | 1 | Early church | `peter-mat-4-18` | Silas, Paul, Rhoda |
| 143 | Eutychus | fell from a window | ACT 20:9-12 | window | 2 | Early church | `eutychus-act-20-9` | Jezebel |
| 144 | Matthias | chosen by casting lots | ACT 1:23-26 | lots | 2 | Early church | `matthias-act-1-23` | — |
| 145 | Simon the sorcerer | offered money for the Spirit | ACT 8:9-24 | money | 2 | Early church | choose: 7 named Simon | — |
| 146 | Gamaliel | "Leave these men alone" | ACT 5:34-39 | Leave these men alone | 3 | Early church | choose: 2 named Gamaliel | — |
| 147 | Herod Agrippa | eaten by worms | ACT 12:21-23 | worms | 3 | Early church | choose: 3 named Herod | — |
| 148 | Timothy | his grandmother's faith | 2TI 1:5 | grandmother | 3 | Early church | `timothy-act-16-1` | — |
| 149 | Apollos | the eloquent Alexandrian | ACT 18:24-26 | Alexandria | 3 | Early church | `apollos-act-18-24` | Priscilla |
| 150 | The good Samaritan | helped a man beaten by robbers | LUK 10:30-37 | robbers | 1 | Parables | none (no link) | — |
| 151 | The prodigal son | came home to a feast | LUK 15:11-32 | feast | 1 | Parables | none (no link) | — |
| 152 | The prodigal son's brother | sulked outside the party | LUK 15:25-32 | angry | 2 | Parables | none (no link) | The prodigal son |
| 153 | The man with 100 sheep | left the ninety-nine | LUK 15:3-7 | ninety-nine | 1 | Parables | none (no link) | — |
| 154 | The woman with the lost coin | swept the house | LUK 15:8-10 | sweep | 2 | Parables | none (no link) | — |
| 155 | The sower | seed on four kinds of soil | MAT 13:3-9 | seed | 1 | Parables | none (no link) | — |
| 156 | The rich fool | built bigger barns | LUK 12:16-21 | barns | 2 | Parables | none (no link) | — |
| 157 | The wise builder | built on the rock | MAT 7:24-25 | rock | 1 | Parables | none (no link) | — |
| 158 | The foolish builder | built on the sand | MAT 7:26-27 | sand | 1 | Parables | none (no link) | — |
| 159 | The persistent widow | kept asking the unjust judge | LUK 18:1-8 | judge | 2 | Parables | none (no link) | — |
| 160 | The tax collector who prayed | "God, have mercy on me" | LUK 18:9-14 | mercy | 2 | Parables | none (no link) | Matthew, Zacchaeus |
| 161 | The servant with one talent | hid the money in the ground | MAT 25:14-30 | hid | 2 | Parables | none (no link) | — |
| 162 | The unforgiving servant | forgiven much, forgave nothing | MAT 18:21-35 | forgive | 2 | Parables | none (no link) | — |
| 163 | The five wise virgins | took extra oil for their lamps | MAT 25:1-13 | oil | 2 | Parables | none (no link) | — |
| 164 | The rich man | a great chasm between them | LUK 16:19-31 | chasm | 3 | Parables | none (no link) | Lazarus |

---

## 19. Review

**One critical review, 2026-11-07 (job a5fdb69f, step 5 of sequence 32).** I checked the design against the spec (APPROVED-IDEAS entry 24), the shared build rules and the real codebase: the build scripts in `package.json`, `scripts/check-verse-wording.py`, `src/lib/verses.ts`, `scripts/bible/books.py`, the games registry and README, the odd-one-out game as built, the site header CSS, people.json and the plain BSB text in `data/plain/bsb/`. A scratch script checked every Appendix A row against the BSB. It looked at check words, quotations, label lengths, person ids and `notWith` names. It then re-ran the §6 board rules 2,000 times for every deck and difficulty on the corrected list. Every correction below is already made in the body above.

The design's overall shape holds: concentration rules, asymmetric who/story pairs, the one-owner guarantee, move-based stars, the screens, accessibility and zero cost. It meets the spec, with Daniel / the lions' den guaranteed and text-only cards.

### Would have broken the build

| What | Why it mattered | Change |
|---|---|---|
| The shipped `pairs.json` held each key verse's full wording (`keyQuote`). | `npm run build` runs `scripts/check-verse-wording.py` first (`prebuild`). It fails if any file under `src/` or `data/` holds a whole verse of ten words or more as a text of its own. Most key verses are that long, so the build would have stopped. The site's rule is that data holds verse ids and the words come from `src/lib/verses.ts`. | `keyQuote` replaced by `keyVerseId` (`BBCCCVVV`; Daniel 6:22 is 27006022). The summary looks the text up with `useVerseTable` and shows the reference alone while it loads or if a Bible lacks the verse. This also means the quote follows the site's language. Tests, the edge-case table and the pre-handback checklist were updated to match (§1, §3, §5.2, §5.4, §10, §14, §16). |
| Appendix A row 34 (Samuel) listed "Eli" as must-not-share. | Eli is not a who card, and §5.2 fails the build on a `notWith` name that does not exist. | Link removed. Eli can never be on a board, so nothing is lost. A builder test now covers it (§14). |

### Card wording that was not BSB, or that a knowledgeable player could dispute

| Row | Draft | BSB / fact | Now |
|---|---|---|---|
| 41 Nathan | "You are the man!" | "You are that man!" (2 Sam 12:7) | "You are that man!" |
| 88 Ruth | "Where you go, I will go" | "wherever you go, I will go" (Ruth 1:16) | "Wherever you go, I will go" |
| 40 Absalom | caught by his hair in a tree | "Absalom's head was caught fast in the tree" (2 Sam 18:9). The hair is a later tradition. | his head caught in an oak |
| 27 Achan | loot buried in his tent | "hidden in the ground inside my tent" (Josh 7:21) | loot hidden in his tent |
| 150 The good Samaritan | helped the man robbers beat | ungrammatical | helped a man beaten by robbers |

The design checked check words, but nothing checked that a quotation on a card is BSB wording. That is how two misquotes got through. I added **card-text rule 6** (§4.1): quoted text must occur in the passage. It is a build failure (§5.2) and a builder test (§14).

### Boards that could have had two plausible owners for one story

I added five links to "must not share a board" (§6.1, Appendix A). There are now 59 links in all. The draft said 56, but a count of its own table gives 55.
- **Nebuchadnezzar and Shadrach, Meshach, Abednego.** He had them thrown into "the fiery furnace".
- **Lazarus and The rich man.** The beggar in that parable is named Lazarus, and people.json even has a separate record for him.
- **Gehazi and Ananias and Sapphira.** Both lied to get money.
- **Joash and Josiah.** Both were boy kings (aged seven and eight), so "king at eight years old" tempts Joash.
- **Ezra and Nehemiah.** Both stand at the reading of the Law (Neh 8:9).

### Rules that contradicted themselves or were too vague to build the same way twice

- **Violence on Easy (§4).** The draft said violent stories are never tier 1, yet David / the giant Goliath was tier 1, and it made Cain's "killed his brother" an exception. The rule is now about what the card says: a card whose words describe a killing or gruesome death is tier 2 or 3. **Cain and Stephen ("stoned for his faith") moved to tier 2.** Goliath stays tier 1, because the card only names him. The deck table was recounted from the appendix: Mixed 65 tier-1 pairs, In the beginning 15, The early church 4.
- **Shared words (§6.2).** The draft did not say how words are compared. So "walls" vs "wall" and "angel's" vs "angels" would not have counted as shared, and Easy boards could have paired them. It now spells out lower-casing, punctuation, possessives, stop words and plural `s`. The build stores the result.
- **First names (§6.3).** Commas and possessives are now stripped ("Mary," and "Lot's"). The doc also notes the harmless side effect on parable figures such as The rich fool and The rich man.
- **Easy pool top-up (§8).** The draft said tier 2 is added when a deck has fewer than 10 tier-1 characters, but not how many to add. It now adds until the pool reaches 10 distinct characters, in a fixed order, computed by the build.

### Smaller corrections

- **Header (§8).** The site header is 61 px (a 4 px strip, a 56 px row and a 1 px border; `src/components/site-navigation.css`), not 56 px. It is sticky. The Hard fit still holds, at about 86 px per row on 360 × 640. The Playwright check measures the real viewport.
- **Reader links (§5.2).** These now highlight the passage's whole range (`?hl=16-23`), the form odd-one-out already uses and tests.
- **Data source (§3).** The verse text the build and browser use is `data/plain/bsb/`. `data/text/bsb/` holds the reader text and the section headings.

### Checked and found correct (no change)

- All 164 check words occur in their BSB passages, including two that look like KJV wording but are in the site's BSB: Jacob's "ladder" (Gen 28:12) and Jonah's "vine" (Jonah 4:6).
- Every fixed person id in Appendix A exists in people.json, and `daniel-ezk-14-14` is the prophet.
- The registry entry (`memory-match`, Family shelf, Solo and Family audiences, art already there) matches §13. Going live is still a one-entry change.
- After the corrections, every deck at every difficulty is offered, and 2,000 random boards each drew without a failure.
- "The left-handed judge" (Ehud) stays tier 2. Regular adult readers know him, and the card is not violent.

### Left to the owner

- Keep or drop the Parables deck (§17). This is unchanged, and the game is complete either way.

---

## 20. Implementation notes

**Built 2026-11-07 (job b95c436d, step 6 of sequence 32).** The game follows this design. Where the build had to differ, or settled something the design left open, it is listed here.

### Files as built

- Builder: `scripts/build-memory-match.py`, with its checks in `scripts/memory-match/mm_build.py` (references, card text, content words, first names) and `scripts/memory-match/mm_pairs.py` (who cards, pairs, links, pools, the shipped document). Hand-kept inputs: `scripts/memory-match/characters.json` and `pairs.json`, made from Appendix A. Builder tests: `scripts/tests/test_memory_match.py`.
- Generated: `src/data/memory-match/pairs.json` and `docs/features/memory-match/review-sheet.md`.
- Game: `src/pages/games/memory-match/` holds `MemoryMatchGame.tsx`, `Screens.tsx` (start, "See the pairs first", can't load), `Board.tsx`, `Card.tsx`, `Summary.tsx`, `game.ts`, `deal.ts`, `storage.ts`, `memory-match.css`, and the tests `pairs.test.ts`, `deal.test.ts`, `game.test.ts` and `MemoryMatchGame.test.tsx`.
- Layout checks: `e2e/memory-match.spec.ts` with its own config, `e2e/memory-match.config.ts` (port 8961).
- The registry entry is live. Nothing else on the hub changed.

### Where the build differs, and why

| Design | As built | Why |
|---|---|---|
| `board.ts` beside `Board.tsx` (§13) | The drawing and dealing module is `deal.ts`, and its tests are `deal.test.ts`. | Windows file names ignore case, so `./Board` could not tell the two files apart and the type check failed. |
| Appendix A row 13: Jacob is `jacob-mat-1-15` | `israel-gen-25-26` | `jacob-mat-1-15` is Jacob the father of Joseph, Mary's husband (Matthew 1:15). The patriarch's record is named Israel, with Jacob among its other names. |
| A story never names its character or "aliases" (§4.1 rule 3) | The words "Jesus" and "God" are not treated as aliases, and words inside a quotation are checked as BSB wording instead. | people.json lists "Jesus" as another name of Barabbas (Matthew 27:17) and "God" for Jacob, which would fail "set free instead of Jesus". Naomi's other name is Mara, and her card is her own words, "Call me Mara". |
| A capitalised word in a story shared with another who label needs a link (§4.1 rule 4) | "Jesus", "God", the label's first word and the words of quotations are left out. | Otherwise every story mentioning Jesus would need a link to "Mary, mother of Jesus". |
| `notWith` is "made symmetric" (§5.1, §6.1) | A link joins two **characters**: every pair of either character carries the other. | §6.1 counts links "once per pair of characters" and says one side is enough. Linking only the one story would leave Abraham's other story free to meet Isaac. Every deck still draws at every difficulty (below). |
| The key verse defaults to the first verse holding the check word (§5.1) | Three are set by hand: Paul's Damascus road (Acts 9:3, the light from heaven rather than the letters to the synagogues), fire on Mount Carmel (1 Kings 18:38, the fire falling) and the unforgiving servant (Matthew 18:33, "Shouldn't you also have had mercy"). | The automatic choice landed on a verse that does not tell the story. |
| An "offered" combination needs pairs + 3 characters (§5.2) | Hard also needs 4 characters with tier 2 or 3 pairs. | Otherwise a Hard board could be offered that cannot hold its 4 deeper pairs. |
| "Turn non-pairs back: when I tap" (§12) | A "Turn them back" button also appears under the grid while a non-pair waits. | Tapping a third card still works, but the button is easier with a keyboard or switch. |
| Enter or Space on a card (§12) | Handled by the card's own key handler. | The tests can then play the whole board with the keyboard, and a repeated key cannot turn two cards. |

### What the build found

- 164 pairs and 142 characters pass every check, and every deck is offered at every difficulty. The Easy top-up from tier 2 adds King Saul to Judges and kings, seven characters to The early church, and four to Parables (the review sheet lists them).
- `deal.test.ts` draws 1,000 boards for each of the 24 deck and difficulty combinations. Every board is fair: one character per pair, no shared first name, no linked characters, no shared story words on Easy, and at least 4 deeper pairs on Hard.
- The Parables decision (§17) is still the owner's. The deck is in.
- On a 360 × 640 phone, a Hard board made of the 12 longest labels first clipped words and ran past the screen. Three changes made it fit: the small "Who"/"Story" tag and the "✓ Matched" mark now sit in the card's top and bottom padding, the Hard cards have narrower side padding, and card words may break inside a long word (soft hyphens first). The layout checks in `e2e/memory-match.spec.ts` check the 360 × 640 fit, the one-row limit at 320 × 568, and that turning the phone moves no card.

### Two more versions (2026-11-12)

The owner asked for more ways to play beyond a person and their story, and confirmed two. A "Match" row on the start screen now picks one of three versions (`src/pages/games/memory-match/versions.ts`); the last pick is remembered, and a board in progress keeps its own version after Back or a reload.

| Version | The two cards | Source | Card designs |
|---|---|---|---|
| People and stories | Who · Story | `pairs.json` (unchanged) | teal with a bust · wine red with an open book |
| Places and events | Place · Event | `scripts/memory-match/places.json`: 67 events at 61 places, each with its BSB verse; a place's link opens it on the atlas map | forest green with a map pin · ochre with a spark |
| Verses | Begins · Ends | verse completion's pool, one-verse passages that split well near the middle (127; six bad splits left out in `scripts/memory-match/verses.json`) | plum with an opening quotation mark · slate blue with a closing one |

- The game code still calls the two sides `who` and `story`; a version only names them and picks their designs. Hard keeps one plain navy back for every version.
- The verses file ships verse ids and split points only (the site keeps no verse wording in its data). When a Verses board is dealt, its twelve or fewer verses are fetched from the BSB and split in the browser (`verse-cards.ts`) exactly as the build split them (`mm_verses.py`); `versions.test.ts` checks every shipped verse against the build's review sheet. If the verses cannot be fetched, the start screen says so and the deal can be tried again.
- Best records for Places and Verses are kept apart from the people version's (`places/<deck>`, `verses/<deck>`); the people version keeps its old keys.
- Review sheets: `docs/features/memory-match/places-review-sheet.md` and `verses-review-sheet.md`.
