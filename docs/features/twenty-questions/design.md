# Bible twenty questions — design

**Status:** researched and designed (2026-11-09, orchestrator job e66e4660, sequence 30 step 17); reviewed once
(2026-11-10, orchestrator job 2f1dd1dc, sequence 30 step 18), with the corrections applied in the body and listed in
the **Review** section at the end. The next step builds it.
**Spec (owner-approved, binding):** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 16, "Bible twenty
questions": the player thinks of a Bible character and the site asks yes/no questions and guesses, with no AI model
running at play time. Each character carries tags; each tag has one pre-written question, generated once in advance
with a cheap model and stored; the player answers with yes / no / don't know buttons; before each question the site
counts how many remaining characters have each tag and asks the one closest to a 50/50 split; a reverse mode lets
the site pick a character while the player asks questions chosen from the same pre-written set, never typed freely;
the main one-time work is tagging every character accurately.
**This step's brief adds:** research Akinator-style games, **learning from wrong guesses**, and a plan for the
one-time tagging from the site's people data.
**Shared rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md): no runtime AI cost, reuse the site's
data, Scripture in the Berean Standard Bible (BSB), register on the /games hub, touch only this feature's own files
plus its registry entry, add tests, never deploy.
**Slug and address:** the hub already lists the game as `twenty-questions` ("coming soon") in
[registry.ts](../../../src/pages/games/registry.ts), with its drawing done (`GAME_ART.twentyQuestions`, a head in
profile thinking in question marks). The address is **/games/twenty-questions**.

---

## 0. Summary of decisions

| Spec or brief says | This design |
|---|---|
| Player thinks of a Bible character | A pool of **about 400 people** from the site's own people data (§3): everyone with a ruler, prophet or apostle page, everyone with a written life story, the 160 people already checked for the "Who's older?" game, and everyone named 20 or more times. Jesus is included and tagged by hand (§3.4). |
| Characters carry tags | About **120 tags** in seven groups: who, when, role, family and people, story, places, books (§4). Every value is **yes**, **no** or **unsure** (plus **n/a**, set only by hand, for a question that makes no sense about Jesus). "Unsure" is for things the Bible does not settle, or where a fair reader could answer either way. A yes or no on a story tag carries a verse that shows it. |
| One pre-written question per tag, generated once with a cheap model | One batch call writes all ~120 questions from the tag definitions. A script checks their form, and they are stored in a hand-kept file (§6). The same wording is used in both modes. |
| Yes / no / don't know buttons | Exactly those three buttons, plus a quiet "Undo" (§8). "Don't know" never rules anyone out. |
| Ask the tag closest to a 50/50 split of the remaining characters | Before each question the site counts, among the characters still in play, how many have the tag (yes), how many do not (no) and how many are unsure. It asks the question whose split is closest to even, counting unsure characters on both sides (§7). With no unsure characters that is exactly the spec's 50/50 rule. |
| (Research finding) players make mistakes | "Still in play" means **fits every answer but at most one**. A single wrong answer, the most common way these games fail, does not lose the game (§7.2). Measured on the site's data: with no forgiveness, one wrong answer loses every game; with it, about three in four are still won. |
| Reverse mode, questions from the same set, never typed | The site secretly picks a famous character. The player picks questions from the same list, grouped and searchable, and the site answers yes, no or "The Bible doesn't say" (§9). |
| Learning from wrong guesses (brief) | When the site loses, the player picks who they meant from a list. The site then shows where their answers and its notes disagreed, each with its verse. That is a small Bible lesson, and it also lets the player say "your notes look wrong". The device remembers the correction at once. The anonymous report (ids only, no text) feeds a review script that improves the shared tags at the next build. Votes never overwrite Scripture (§10). |
| Main one-time work: tagging every character | A five-stage pipeline (§5). About half the values come straight from site data with no model. A cheap model fills the story tags in two independent passes, each yes citing a verse. A stronger model settles only the disagreements. Mechanical checks and a full play simulation gate the result. |
| No runtime AI cost | Play is a lookup in one static JSON file, about 70 KB (§12). The tagging run is a one-time batch through the workspace's BatchRunner tool. That run needs the owner's yes on its estimate before it starts (§5.6, §16). |

---

## 1. Research

### 1.1 Akinator (Elokence, 2007)

- **The game.** The player thinks of a real or fictional character. A genie asks questions, and the player answers
  Yes, No, Don't know, Probably or Probably not. It usually guesses within about 20 questions and, when it fails,
  asks who it was. ([Akinator explainer, playhop](https://playhop.com/blog/guides/how-does-akinator-know-what-you-are-thinking/);
  [Codemia](https://codemia.io/knowledge-hub/path/what_kind_of_algorithm_is_behind_the_akinator_game_1))
- **How it chooses.** Elokence has never published its method, and explainers disagree. The well-supported common
  ground: every character is linked to the answers expected for each question; the game keeps a score (in effect a
  probability) for every candidate; and it asks whichever question is expected to tell the candidates apart best.
  The first questions are broad ("Is your character real?") and later ones narrow. A research paper that played
  against Akinator's API found it exposes its top guesses with probabilities and ranks, which supports the
  probability-score reading. ([CLRN](https://www.clrn.org/is-akinator-ai/);
  [Reversing the Twenty Questions Game, arXiv 2301.08718](https://arxiv.org/abs/2301.08718))
- **How it learns.** Each failed game ends with the player naming the character and, in effect, contributing their
  answers. That grows the database and adjusts how strongly each answer counts for each character. Its accuracy is
  only as good as that crowd-built data. ([CLRN](https://www.clrn.org/is-akinator-ai/))
- **A known weakness.** The arXiv study found that players who answer "don't know" or "probably" too often push it
  towards a fallback guess. Vague answers carry almost no information.

### 1.2 20Q (Robin Burgener, 1988; handheld toy 2004)

- **The game.** A neural network over an object-to-question relevance table. The handheld answers Yes, No, Unknown
  and Sometimes; the web version offers many more ("Irrelevant", "Probably", "Doubtful" …).
  ([Wikipedia: 20Q](https://en.wikipedia.org/wiki/20Q);
  [patent US20060230008A1](https://patents.google.com/patent/US20060230008A1/en))
- **"Unknown" is not counted.** The patent says an Unknown answer is left out of the calculation. Answers like
  "Irrelevant" add little information. This is the model for our "Don't know": it simply rules nobody in or out.
- **It survives wrong answers.** Burgener built it to keep learning "even if the player was lying or obfuscating"
  ([Globe and Mail](https://www.theglobeandmail.com/technology/science/is-it-animal-vegetable-or-artificial-intelligence/article18161750/)).
  The online version can still win after the player answers a question wrongly
  ([Baeldung](https://www.baeldung.com/cs/decision-trees-20-questions)). The published figure is about 80 % right
  within 20 questions and 98 % within 25 ([Scienceline](https://scienceline.org/2006/07/tech-schrock-20q/)).

### 1.3 The mathematics of twenty questions

- **Twenty yes/no questions can in principle tell apart 2²⁰, about a million, things.** Our pool of about 400
  needs at least log₂ 400 ≈ 8.6 perfectly even questions. That leaves a wide margin inside 20 for uneven splits,
  "don't know" answers, mistakes and guesses.
- **Asking the question closest to 50/50 is the textbook greedy method.** A yes/no question carries the most
  information when its two answers are equally likely, and with noise-free answers it is the binary-search idea
  behind decision trees. Jedynak, Frazier and Sznitman showed that, under a known noise model, the greedy one-step
  choice is in fact optimal for reducing uncertainty
  ([Twenty Questions with Noise](https://people.orie.cornell.edu/pfrazier/pub/2011_JedynakFrazierSznitman_20questions.pdf)).
  So the owner's rule is the right one; this design only has to define "remaining" and the split carefully once
  answers can be unknown or wrong.
- **Wrong answers are the real danger.** The "twenty questions with a liar" literature (the Rényi–Ulam game) shows
  that tolerating even one lie costs only a few extra questions
  ([Dagan et al., The entropy of lies](http://www.cs.toronto.edu/~yuvalf/Lies.pdf)). A system that throws a
  candidate out on the first contradiction never recovers. A study of 20-questions agents found table-based greedy
  systems are "easily affected by noisy answers"; a method that tolerates them did clearly better in human tests,
  where wrong answers are common ([Hu et al., EMNLP 2018](https://aclanthology.org/D18-1361.pdf)). The same paper
  notes that picking among near-equal questions at random, rather than always the single best, makes games less
  repetitive.

### 1.4 Bible guessing games that already exist

- Searching found **no Akinator-style Bible app**. What exists is printed or face-to-face. There are "Guess Who"
  style board games with 24 Bible characters, and printable "Who am I?" and "Bible 20 Questions" cards, split into
  Old and New Testament people. There are also party versions where a name is stuck on a player's back.
  ([Bible Games Central](https://biblegamescentral.com/bible-who-am-i/);
  [Gathered Again](https://gatheredagain.com/bible-who-am-i-game/); Amazon listings for "Guess Bible Who Am I" games.)
- **What their questions look like.** The sample questions are the obvious ones: "Am I a male?", "Am I an Old
  Testament character?", "Was I a king?". These broad questions are what players will expect first, so the
  everyday tags (§4.2) must exist and be phrased the same simple way.
- **The board games use 24 characters.** A child's mental list of Bible people is short and famous. That shapes
  reverse mode: its secret characters come only from the famous tier (§9.1).

### 1.5 What this means for the design

1. Keep the owner's 50/50 rule. It is the right method and easy to explain on the page.
2. "Don't know" rules nobody out (20Q). A tag the Bible does not settle is stored as **unsure**, which also rules
   nobody out.
3. Forgive one wrong answer (§7.2). That turns "lost on one slip" into "usually still wins".
4. Choose randomly among near-equal questions so two games for Moses don't play identically.
5. Learn from losses like Akinator, but carefully. Our data is Scripture, and a crowd vote must never be able to
   rewrite what the text says (§10).
6. Most players think of famous people. Guess the most famous candidate first, and draw reverse-mode secrets only
   from the famous tier.

---

## 2. Data already on the site (measured)

| Source | What it gives this game |
|---|---|
| [data/study/people.json](../../../data/study/people.json) | 3,133 rows: id, name `n`, other names `o`, one-line description `b`, mention count `c`, coarse period `p`, group flag `g` (78 rows are tribes or peoples, not persons). Loaded on the site by `loadPeople()` / `loadEnglishPeople()` in [study.ts](../../../src/lib/study.ts). |
| [data/study/people/](../../../data/study/people/) (one file per person) | Sex `s` (2,856 M, 201 F, 76 G for groups); era `e` (Before the Flood … New Testament); tribe or nation `t` (blank for 1,639); role phrase `d` ("King living at the time of …", 109 kings, 31 prophets, 15 judges, 13 apostles, 45 priests, 16 high priests …); parents `pa`, siblings `si`, spouses `sp`, children `ch`; **books the person is named in, with counts, `k`**; verse list `refs`; the site's article; and for 252 people the site's own life story `story`. **Read only by the build:** releases replace these files with packs (the site's [AGENTS.md](../../../AGENTS.md), "Person packs"), so the game must never fetch them. |
| [src/data/people-pages/](../../../src/data/people-pages/) | Curated groups behind the ruler, prophet and apostle pages: kings of Israel and Judah, the united kingdom, the judges, Egypt, Assyria and Babylon, Persia, Rome, the Herods, neighbouring rulers, the Twelve, the Jerusalem church, Paul's companions and seven prophet groups. 393 people in all. |
| [scripts/odd-one-out/](../../../scripts/odd-one-out/) | The odd-one-out build already turns this data into **yes / no / unsure** values for monarch, prophet, apostle, judge, priest, king of Judah/Israel, Herod, Roman, Persian, pharaoh, the Twelve, writing prophet, Paul's companion, son of Jacob, son of David and more ([ooo_people.py](../../../scripts/odd-one-out/ooo_people.py)). It also has a hand-kept table of display labels for same-named people ([facts.json](../../../scripts/odd-one-out/facts.json) `people.labels`: "John the Baptist", "John son of Zebedee" …). Both are reused (§5.2), not copied. |
| [src/data/whos-older/characters.source.json](../../../src/data/whos-older/characters.source.json) | 160 well-known people, already chosen by hand in fame tiers and labelled. |
| [data/questions/bank.json](../../../data/questions/bank.json) | 14,916 quiz questions with a `people` list of **names** (not ids): Jesus 1,880, Moses 660, David 631, Paul 605 … A useful fame signal once names are matched to ids. |
| [src/lib/people-roles.ts](../../../src/lib/people-roles.ts) | The site's own reading of each person's role from their description (king, prophet, priest, Levite, judge, leader, warrior, disciple, family). Used as a cross-check. |
| BSB text, `data/plain/bsb/<BOOK>.json` | Verse words for the evidence shown after a game. Pages store **verse ids only** and load the words through [verses.ts](../../../src/lib/verses.ts) `resolveVerses(…, "bsb")`. [check-verse-wording.py](../../../scripts/check-verse-wording.py) fails the build if a game file holds a verse's wording. |
| [src/data/people-slugs.json](../../../src/data/people-slugs.json) | Readable person addresses (`/people/moses`) for "Read about Moses" links. |

**Measured on this data** (scripts and their saved output are in this job's folder, `scratch/measure-e66e.py`,
`simulate-e66e.py`, `simulate2-e66e.py`, `simulate3-e66e.py`, with `.out.txt` files):

- The pool rule in §3 gives **406 people**: 47 women and 359 men; 93 New Testament, 134 divided kingdom, 50 united
  kingdom, 39 exile and return, 32 patriarchs, 27 judges, 23 Exodus and wilderness, 8 before the Flood. The four
  rules alone give 466; dropping people named only once (unless rule 2 or 3 keeps them) brings it to 406.
- **Tags from site data alone cannot tell everyone apart.** With the 58 data tags (sex, era, role, tribe, page
  group, son of Jacob or David, married, has children), **180 of the 406 share their exact pattern with someone
  else**. Adding a "named in book X" tag for every book still leaves **72**. So the story tags from the model pass
  are needed, and §5.5's check makes sure no famous person is left without a tag that separates them.
- **The 50/50 rule is quick.** With data tags plus book tags and truthful answers, the site needed **8.7 questions
  on average, at most 12**, to narrow 406 to as few as the tags allow.
- **One wrong answer is fatal without forgiveness.** If the player answers one of the first five questions wrongly
  and the site removes everyone who contradicts any answer, the right person is lost in **406 of 406** games.
- **With forgiveness (§7.2), on the same thin data tags:** truthful players win **96 %** within 20, averaging 13.1
  questions; with one wrong answer the site still wins **77 %**. Strict elimination wins only 50 %, even when the
  site is allowed to reconsider after a wrong guess. Forgiveness has a price on thin tags: strict elimination wins
  100 % of truthful games against forgiveness's 96 %, because people who differ by a single tag are harder to
  separate. The full tag set will separate people far better, and §5.5 sets the targets the real tags must meet,
  including check 5 (every famous person is separated from everyone else by at least two tags, one answering yes
  where the other answers no).

---

## 3. The character pool

### 3.1 Who is in it

A person is a **candidate** if they are not a group (`g`) and any of these holds:

1. they appear in a ruler, prophet or apostle page group (393);
2. they are in the "Who's older?" pool (160);
3. they have the site's own written life story (`story`, 252);
4. they are named 20 or more times (`c ≥ 20`, 132).

People named only once (for example "A wife of Ezekiel", or a prophet's father who has a line on a prophet page)
are dropped unless rule 2 or 3 includes them. The measured result is **406 people**. The pool is fixed by a hand-kept list
(`scripts/twenty-questions/pool.source.json`), seeded by this rule. People can then be added or removed with a
one-line reason, so a later change to the people data never silently changes the game.

**Additions by hand** (well known but caught by none of the rules): the build lists famous names from the question
bank's `people` field (names asked about in 5 or more questions) whose person is not in the pool. Examples are
Zacchaeus, Goliath, Delilah, Nicodemus and Eve, depending on which rules already catch them. Each is added unless
there is a reason not to. The list of additions and refusals is in the review sheet (§5.7).

### 3.2 Who is not in it

- **God the Father and the Holy Spirit.** They are not characters in the sense of this game, and treating them as
  a "Bible character to guess" would be irreverent. They are not in the people data anyway.
- **Angels, Satan and demons**, such as Gabriel, Michael and the serpent. The site's people data does not include
  them, and every tag here assumes a human life. If a player thinks of Gabriel, the "Who was it?" list (§10.1) does
  not offer him; the player taps "Someone not on this list" and nothing is recorded. Adding angels is a possible
  later extension with its own tags.
- **People only in parables**, such as the Good Samaritan and the Prodigal Son. They are not historical
  characters in the people data. Lazarus in Luke 16 is a separate person from Lazarus of Bethany; only the latter
  is in the pool.
- **Groups and peoples** (`g`).

### 3.3 Tiers and fame

Each pool member has a **tier**:

| Tier | About | Used for |
|---|---|---|
| 1 Famous | 150 | The people a Sunday-school child knows: Adam to Paul. Reverse mode **Easy** draws only from here. Guesses prefer them. |
| 2 Known | 250 | Everyone else in the pool. Reverse mode **Hard** draws from tiers 1 and 2. |

Tier 1 starts from "Who's older?" tiers 1–2 and odd-one-out's "easy" people, then is edited by hand in the pool
file. **Fame** (used only to order guesses, §7.4) is: tier first, then the number of bank questions naming the
person (matched to an id through the label table, §3.5), then the mention count `c`. Mention counts on their own
mislead: Nehemiah has 5 mentions and Timothy 24.

### 3.4 Jesus

Jesus (`jesus-isa-7-14`, 1,160 mentions) is in the pool, tier 1. Children will think of him first, and leaving
him out would make the game feel broken. His tags are **set by hand**, never by the model. They are checked
against the Baptist Faith and Message 2000, article II.B (fully God and fully man, virgin birth, sinless life,
death, bodily resurrection, ascension, return).

- Questions are answered as the Bible presents him. "Is your person a king?" is **yes** (John 18:37, Revelation
  19:16). "A prophet?" is **yes** (Acts 3:22, Luke 24:19). "A priest?" is **yes** (Hebrews 4:14). "Did your person
  rise from the dead?" is **yes**. "Did your person do miracles?" is **yes**.
- Questions that make no sense about him are **n/a** (§4.1), which never rules him out. "Did your person meet
  Jesus?" is one.
- **No tag in the whole set judges anyone's sin or salvation** (§4.6), so the game never asks a question whose
  answer about Jesus would be irreverent.
- The guess is worded "Are you thinking of **Jesus**?", and the reveal links to the site's page on him.
- In reverse mode Jesus can be the secret character. The answers follow the same hand-set values: "The Bible
  doesn't say" for unsure ones and "That doesn't really apply" for the n/a ones.

### 3.5 Display labels

The game must never show two pool members under one name. Labels come from odd-one-out's label table (Jacob for
`israel-gen-25-26`, "John the Baptist", "Mary mother of Jesus" …), then "Who's older?" labels, then the
person's `n`. The pool has same-named people (Zechariah ×7, Simon ×4, Pharaoh ×4, Joseph ×3, Judas ×3, James ×3,
Herod ×3 …). Each gets a distinguishing label ("Zechariah the prophet", "Zechariah father of John the Baptist",
"Pharaoh of the Exodus"). **The build fails** if two pool members share a label. Searches match labels and
other names (`o`), so "Israel" finds Jacob and "Saul" offers both King Saul and "Paul (also called Saul)".

---

## 4. The tag schema

### 4.1 Values

Every tag has, for every pool member, exactly one value:

| Value | Meaning | Effect in guess mode | Reverse-mode answer |
|---|---|---|---|
| **yes** | Scripture shows it | A "No" from the player contradicts it | "Yes" |
| **no** | Scripture shows it is not so, or the person is not in that part of the story at all | A "Yes" contradicts it | "No" |
| **unsure** | The Bible does not settle it, or a fair reader could answer either way | Never contradicts anything | "The Bible doesn't say" |
| **n/a** | The question makes no sense for this person ("Did your person meet Jesus?" for Jesus). Set **only in the hand file** (§3.4); the model passes never output it | Never contradicts anything (the engine treats it exactly like unsure) | "That doesn't really apply" |

A yes or no value may also carry a **slip mark**: "players often get this wrong". In guess mode a slip-marked
value is treated as **unsure**, so a common misunderstanding cannot cost the game. In reverse mode, and in the
lesson after a game, the true value and its verse are shown. Example: "Did your person enter the Promised Land?"
is **no** for Moses, with Deuteronomy 34:4. Many players would answer yes, so the value is slip-marked. Slip marks
come from the tagging passes (§5.3) and from learning (§10.4).

**The truth rule for tagging.** A value records the answer **Scripture** gives to the question **as worded**,
read the way an ordinary player would read it. It is not the answer a commentary or a tradition gives. If
answering needs a tradition, a disputed date, or a choice between interpretations, the value is **unsure**. This is
also why "Did your person write part of the Bible?" is deliberately **not** a tag: for Moses, Samuel or the Gospel
writers the answer rests partly on tradition about authorship (§4.6). The two authorship tags ask only what the text
itself shows: a book named after the person, and a letter that opens with their name as its writer. That is the
site's doctrinal rule ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)): where the Baptist Faith and
Message is silent, do not choose.

**Evidence.** Every **yes** on a story, place or book tag, and every **no** that rests on a statement ("did not
enter"), carries one verse id (`BBCCCVVV`), or a short span, that shows it. Data tags carry their source instead,
such as "people-pages: rulers-judah". The evidence is shipped in a separate file and loaded only for the lesson
after a game (§12).

### 4.2 The tag groups

The starting list has **about 120 tags**. The tagging build may add a few narrow **separating tags** where §5.5's
check finds famous people it cannot tell apart, for example "Was your person famous for great strength?" for
Samson. Each tag has an id, a group, a one-sentence **definition** (what counts as yes) and a **level**:

- **everyday:** anyone who knows the story can answer;
- **detail:** a well-read player can answer; a child will often say "don't know".

The 50/50 rule prefers everyday questions (§7.3).

**People from before Israel existed.** For everyone who lived before Jacob's sons (Adam, Noah, Abraham, Sarah,
Isaac, Rebekah, Esau and the like), both "Is your person an Israelite?" and "Is your person from another nation?"
are **unsure**. Strictly they are not descended from Jacob, but a player thinking of Abraham will answer "No" to
"another nation", and many will answer "Yes" to "Israelite". Jacob himself is **yes** for "Israelite".

| Group | Tags (starting list) | Source |
|---|---|---|
| **Who** (everyday) | woman · israelite (descended from Jacob) · from another nation (not an Israelite) | data `s`; tribe `t`, family and page groups, then model where unclear |
| **When** (everyday, one tag per era) | before the Flood · time of Abraham, Isaac and Jacob · Egypt and the wilderness (Exodus to Deuteronomy) · the judges · the first kings (Saul, David, Solomon) · the divided kingdom · exile and return · Jesus' life on earth · the early church (Acts and after) · New Testament (umbrella tag) | data `e` and `p`; NT split checked by the model (`p` has known errors) |
| **Role** (everyday unless marked) | king or queen who ruled · ruled Israel or Judah · ruled another nation · queen (ruling or royal wife) · pharaoh · Roman official · member of Herod's family · prophet or prophetess · priest · high priest · judge of Israel · one of the Twelve · followed Jesus during his ministry · travelled with Paul · religious leader in Jesus' day (Pharisee, Sadducee, scribe, member of the council) · soldier, commander or warrior · Levite (detail) · servant or official at a royal court · shepherd · fisherman · tax collector | people-pages groups, odd-one-out values, `d`, people-roles.ts; model for shepherd, fisherman, court official, Jesus' followers |
| **Family and people** | married (in the story) · had children (in the story) · a son of Jacob (the twelve) · a son of David · a twin · had a famous brother or sister in the pool (detail) · had their name changed (Abram, Sarai, Jacob, Simon Peter, Hoshea/Joshua, Daniel …) · a long-awaited child born to a mother who could not have children · lived to 120 years or more · tribe of Judah, of Levi, of Benjamin, of Ephraim (detail) | `pa`/`sp`/`ch`/`si`; model with verse for the rest. Empty family data means **unsure**, never no. |
| **Story** (everyday) | did miracles (God worked wonders through them) · was raised from the dead · taken to heaven without dying · an angel spoke to them · God spoke to them in a dream or vision · interpreted dreams · was put in prison or held captive · was put to death by others · led God's people · fought in a battle · worked against God's people · betrayed or denied someone close · anointed with oil · built something famous (the ark, the temple, the walls …) · a famous story with an animal · crossed water by a miracle or walked on water · a song or psalm in the Bible is credited to them · known for something done as a child or teenager · met Jesus · spoke with Jesus after he rose · was baptised (detail) | model, two passes, each yes or no with a verse |
| **Places** (detail) | lived or worked in Egypt · lived in Babylon or Persia · in Jerusalem · in Galilee · went to Rome · travelled by sea | model with verse |
| **Books** | **everyday groups:** takes part in Genesis · in Exodus to Deuteronomy · in Joshua, Judges or Ruth · in Samuel or Kings · in Chronicles (detail) · in Ezra, Nehemiah or Esther · in the Prophets · in the Psalms or wisdom books · in the Gospels · in Acts · in the letters · in Revelation · **a book of the Bible is named after them** · **a New Testament letter opens with their name as its writer**. **Detail:** one tag per book for the books the pool's people take part in, about 30 after dropping books where no pool member acts. | data `k` decides **no** (never named in that book); the model decides between **yes** (takes part in the book's events) and **unsure** (only mentioned); book names and letter openings are a fixed hand table |

**Book tags mean "takes part in", not "is mentioned".** A player thinking of Abraham will answer "no" to "Is your
person in the Gospels?", even though the Gospels name him. So:

- **no:** never named in the book;
- **yes:** acts or speaks in the book's events;
- **unsure:** only mentioned there.

Abraham in Matthew is therefore unsure. Moses in Mark is **yes**, because he appears at the Transfiguration
(Mark 9:4).

### 4.3 Tag record (hand-kept, `scripts/twenty-questions/tags.source.json`)

```json
{
  "id": "raised-from-dead",
  "group": "story",
  "level": "everyday",
  "definition": "The person died and was brought back to life in Scripture's account (not counting the final resurrection).",
  "question": "Did your person die and come back to life?",
  "source": "model",
  "implies": [],
  "excludes": []
}
```

- `source`: `data`, `model` or `hand`. It records which stage owns the value.
- `implies` and `excludes` are **consistency rules** checked in §5.5. For example, `king-israel-judah` implies
  `king`; `the-twelve` implies `new-testament` and `met-jesus`; `era-before-flood` excludes `new-testament`;
  `woman` excludes `son-of-jacob`.

### 4.4 Character record (generated, `scripts/twenty-questions/tagged.json`, not shipped)

```json
{
  "id": "moses-exo-2-10",
  "label": "Moses",
  "tier": 1,
  "values": {
    "prophet":       { "v": "yes", "by": "data", "src": "people-pages:prophets-wilderness-judges" },
    "entered-canaan":{ "v": "no",  "by": "model", "ref": 5034004, "slip": true },
    "in-gospels":    { "v": "yes", "by": "model", "ref": 41009004, "why": "Appears at the Transfiguration" },
    "raised-from-dead": { "v": "no", "by": "model" }
  },
  "passes": { "a": "…hash…", "b": "…hash…", "resolved": ["in-gospels"] }
}
```

### 4.5 What the game ships (generated, `src/data/twenty-questions/twenty-questions.json`)

Compact and ids only:

```json
{
  "version": "2026-11-…-<hash>",
  "tags": [{ "id": "woman", "q": "Is your person a woman?", "g": "who", "l": 0 }],
  "people": [{ "id": "moses-exo-2-10", "label": "Moses", "also": ["Moshe"], "t": 1, "f": 2, "slug": "moses", "v": "nnyy?n…" }]
}
```

- `v` holds one character per tag, in tag order: `y` yes, `n` no, `?` unsure, `-` n/a (hand file only), `Y` yes
  slip-marked, `N` no slip-marked. At 400 people × 120 tags that is 48 KB of letters.
- The whole file is about 70 KB raw and roughly 15 KB compressed.

A second file, `twenty-questions-evidence.json`, maps person to tag to verse id (only where a ref exists). It is
loaded only for the lesson after a game.

### 4.6 What is never a tag

- **Salvation, sin or spiritual standing** ("Was your person saved?", "Was your person good?"). Romans 3:23 says
  all have sinned, and judging individuals is not a game question. "Worked against God's people" is allowed
  because it is a plain narrative fact with a verse. Mixed cases such as King Saul are unsure.
- **Contested history or dating**, such as whether Job lived in the patriarchs' time, or anything that needs an
  absolute date.
- **Appearance and invented details** that Scripture does not give (hair colour, age at an event that is not
  stated).
- **Anything only tradition supplies** (how Peter died, where Thomas went). The site's people pages label these
  "tradition". The game does not use them.

---

## 5. The one-time tagging plan

Five stages, run by hand on this PC by the implementation step (or a dedicated tagging job). Every output is
committed so the game is reproducible. The model stages follow the workspace's batch rule: one minimal call per
character through **BatchRunner** (`toolkit run batch-runner`), with a pilot before the full run, a budget cap
and the owner's yes on the estimate.

### 5.1 Stage 0: the pool

`scripts/twenty-questions/build-pool.ts` applies §3.1 and writes the seed for `pool.source.json`, which is then
edited by hand for tiers, additions and labels. **Checks:**

- every id exists in people.json and is not a group;
- labels are unique;
- every tier-1 person has a people-slug.

### 5.2 Stage 1: tags from site data (no model)

`scripts/twenty-questions/tags-from-data.ts` fills every `source: "data"` tag:

- **Sex.** `s`: F means woman yes; M means woman no.
- **Era.** `e` and `p` fill the era tags. Where they disagree, or where the NT split depends on `p`, the value is
  left for the model to confirm (§5.3). `p` is coarse and sometimes rests on a tradition: Job is filed under the
  patriarchs, a dating §4.6 treats as contested, so **every era tag is unsure for Job**. (Esther under "return" is
  right: her story falls in the Persian period between the returns.)
- **Offices.** People-pages groups and odd-one-out's yes / no / unsure values for monarch, prophet, judge, priest,
  apostle, the Twelve, king of Judah or Israel, Herod, Roman, Persian, pharaoh, writing prophet and Paul's
  companion. These are read by importing [ooo_people.py](../../../scripts/odd-one-out/ooo_people.py)'s functions
  read-only, with no edits to odd-one-out's files. The odd-one-out script is Python, so this stage may be Python
  too. The language follows whichever way imports cleanly.
- **Family.** Sons of Jacob and of David come from `pa`. Married and had children come from `sp` and `ch`:
  **yes** when present, **unsure** when empty.
- **Tribe.** `t`. "Tribe of Judah(?)" gives unsure.
- **Books.** `k`. A book the person is not named in gives **no**; the model then decides yes or unsure for every
  book they are named in.
- **Book named after them / letter writer.** A fixed hand table, from Joshua and Ruth to Jude, with the Gospel
  writers counted for the Gospels that carry their names.

About **half of all values** are set here. A data value is final unless a consistency rule (§5.5) flags it. The
model may not overwrite it.

### 5.3 Stage 2: the model passes (story, places, book participation)

**Input per character:** one call, with nothing but this in its context:

- the tag definitions for the model-owned tags (about 70);
- the character's label, brief, the site's `story` or article;
- the character's data values from stage 1 (so it does not contradict them);
- the list of books they are named in, with counts;
- **the BSB text of up to 150 of their verses**, chosen by `refs`: always the first and last, then the verses
  around their densest chapters.

**Output:** JSON, one entry per tag:

```json
{ "v": "yes" | "no" | "unsure", "ref": "Mark 9:4", "slip": false }
```

A yes always needs a ref. A no needs a ref only when it rests on a statement. Slip is true when the model judges
that most players would answer the question the other way.

**Two independent passes**, A and B, use different verse orderings and the cheapest model that passes the pilot
(Haiku-class to start). Each "no ref, yes value" is dropped to unsure automatically.

**Pilot first:** 12 characters chosen to be hard: Jesus excluded (hand-tagged), Moses, Samson, Ruth, Jonah, Esther,
Judas Iscariot, Mary mother of Jesus, Nicodemus, Saul, Paul, a Herod and an obscure tier-2 king.

- An agent compares the pilot's values with the text, tag by tag, and writes the error rate per tag group to the
  review sheet.
- If the cheap model's error rate on the pilot is above **3 %** of yes/no values, the full run uses the next model
  up.
- The pilot's first call must show an input of a few thousand tokens. Tens of thousands mean workspace context is
  leaking into the call, and the run stops.

### 5.4 Stage 3: settling disagreements

`scripts/twenty-questions/merge-passes.ts` compares A and B value by value:

- **They agree:** the value stands.
- **One says unsure:** the value is unsure. This is the safe direction, because unsure never costs a game.
- **One says yes and the other no:** the pair goes to a **resolver** call with a stronger model (Sonnet-class).
  The call sees only that character, the disputed tags, both refs and the verses, and its answer is final.
  Expected volume: a few percent of values.

Every ref must be a real verse id that lies in the person's own `refs` or whose BSB text contains one of the
person's names. Otherwise the value drops to unsure and the case is listed.

### 5.5 Stage 4: mechanical checks and the play simulation (gate)

`scripts/twenty-questions/check.ts` **fails the build** on:

1. a broken `implies` or `excludes` rule (a king of Judah who is not a king; a woman who is a son of Jacob);
2. a model value that contradicts a data value;
3. any yes on a story, place or book tag without a valid ref;
4. **two tier-1 people that no tag separates**. The site could never tell them apart. The fix is a separating tag
   or a data correction, and the check names both people;
5. a tier-1 person **separated** from another pool member by **fewer than two** tags. One wrong answer would then
   make them indistinguishable. This warns for tier 2 and fails for tier 1;

   A tag **separates** two people only when one is yes and the other no, reading slip-marked values as unsure, as
   guess mode does (§4.1). An unsure or n/a value never separates anyone, so two people who differ only by one
   being unsure where the other is yes count as **not** separated by that tag;
6. a tag that is yes for nobody or for everybody in the pool. It is useless, so it is removed or redefined;
7. Jesus's values differing from the hand file.

"Fails the build" here means the **tagging build**: these game checks are not part of the site's `prebuild`, and
this feature must not add them to the shared [package.json](../../../package.json) (the "Who's older?" checks in
[scripts/whos-older/](../../../scripts/whos-older/) work the same way: run by hand with
`node --experimental-strip-types`). What guards the site's own `npm test` is the data test of §15, which runs the
same simulation over the shipped file. Because the scripts import [engine.ts](../../../src/pages/games/twenty-questions/engine.ts)
directly under Node, the engine uses only relative imports with their `.ts` extension and no `@/` alias, the way
the "Who's older?" scripts import [pairing.ts](../../../src/pages/games/whos-older/pairing.ts).

It then **plays every pool member** through the real selection code (§7), the same TypeScript module the game
uses, and requires:

| Player | Target (within 20 questions, guesses included) |
|---|---|
| Truthful, never "don't know" | ≥ 99 % of tier 1, ≥ 97 % of the pool |
| Truthful, answering "don't know" to every **detail** question | ≥ 95 % of tier 1 |
| One wrong answer at a random question among the first ten | ≥ 85 % of tier 1 |

Failing a target means adding separating tags or reviewing values. It is never met by lowering the target. The
simulation's per-person results go to the review sheet.

### 5.6 Stage 5: the run, its size and the approval gate

**Size of the run** (estimate to be confirmed by the pilot's measured usage):

- Two passes × about 400 characters = **about 800 calls**.
- Each call is about 6,000–9,000 input tokens (70 tag definitions of about 40 tokens each, the article and story,
  up to 150 verses) and about 1,500 output tokens.
- Total: about **6–7 million input and 1.2 million output tokens on a Haiku-class model**, plus a few dozen
  Sonnet-class resolver calls and one question-writing call (§6).
- For scale, the October Bible chapter-summary run read about **994 million** tokens. This run is well under 1 % of
  that.

Before the full run the implementation step reports the pilot's measured usage, the projected total as a share of
the owner's Max plan, and the BatchRunner `--budget-usd` cap it will use. **It then waits for the owner's yes**,
as the workspace's batch and cost rules require. No new service, licence or recurring cost is involved. If the
owner says no, the game still works on the data tags alone. It plays noticeably worse, as §2 measured (72 of 406
people share a pattern), so this is not recommended.

### 5.7 The review sheet

`docs/features/twenty-questions/review-sheet.md` is generated by `check.ts`. It lists:

- the pool changes;
- every resolver decision;
- every slip mark;
- every value dropped to unsure for a bad ref;
- the consistency warnings;
- the simulation results, worst first.

It is for the review agents and for future maintainers. The owner does not have to read it.

---

## 6. Writing the questions (once)

- **One call** for all tags, with the cheapest model that writes clean English. Its input is the tag list (id,
  definition, level, group) and these style rules:
  - start with "Is", "Was", "Did", "Does" or "Has"; end with "?";
  - at most 70 characters;
  - say "your person", never "he" or "she", so the question works before sex is known;
  - plain words a ten-year-old understands (no "patriarch", "theophany", "Levitical");
  - match the definition exactly, with no wider and no narrower meaning;
  - Bible book names as the BSB spells them.
- `scripts/twenty-questions/check-questions.ts` enforces the form rules mechanically and fails on a duplicate or
  near-duplicate question.
- **A reviewing agent** then reads each question beside its definition and fixes any whose natural reading would
  change who answers yes. Example: a "met Jesus" definition that includes the risen Jesus must say so, because Paul
  met him on the Damascus road. The final wording is written into `tags.source.json` and committed. From then on a
  question changes only by editing that file.
- **Examples:** "Is your person a woman?" · "Did your person live before the Flood?" · "Was your person one of
  the twelve apostles?" · "Did your person die and come back to life?" · "Is your person in the book of Acts?" ·
  "Is there a book of the Bible named after your person?"
- Translations: the site translates its pages, but the game's questions are English in the first release. That
  matches the other games built from English data. The game file is listed in the translation register only if
  the implementation step finds the existing pipeline handles game data files (it does for some, see
  [translated-data.ts](../../../src/pages/games/translated-data.ts)).

---

## 7. Choosing the next question (guess mode)

All of this runs in the browser on the shipped file. A step is about 400 people × (up to 25 answers + 120 tags), a
few tens of thousands of comparisons, which is instant on any phone. It lives in one pure module,
`src/pages/games/twenty-questions/engine.ts`, which the build's simulation also uses.

### 7.1 State

- `answers`: the list of (tag, Yes / No / Don't know).
- `rejected`: the people already guessed wrongly.
- For each person, **misses** = the number of answers that contradict their value. A Yes against **no**, or a No
  against **yes**, is a miss. Unsure, n/a and slip-marked values, values this device has softened (§10.3), and
  every "Don't know", never count as a miss.

### 7.2 Who is "remaining"

- `best` = the smallest miss count among people not rejected.
- **Remaining** = everyone not rejected whose misses are at most `best + 1`.
- **Leading** = those with exactly `best` misses.

For a truthful player this means "everyone who fits every answer, plus everyone who fits all but one". That one
step of forgiveness is what saves a game after a slip (§2: 77 % against 50 %). It is the simplest reading of the
spec's "remaining characters" that survives a wrong answer.

### 7.3 The 50/50 rule

For every tag not yet asked, count among the **remaining** people:

- `y` = how many have yes;
- `n` = how many have no;
- `u` = how many are unsure (including n/a, slip-marked and device-softened values).

Skip a tag where `y` or `n` is 0, because its answer could not change anything. A tag's **split score** is
`max(y, n) + u`: the most people who could still be remaining after the answer. The **lowest** score is the tag
closest to 50/50. With no unsure people, this is exactly "the tag whose count is closest to half".

Choosing among the best:

1. **Everyday first.** Consider detail tags only if the best everyday tag's score is worse than a 70/30 split of
   the remaining.
2. **Variety.** Pick at random (seeded per game) among the tags within 2 of the best score, or within 5 % of the
   remaining count when it is above 40. Games then differ without losing information (§1.3).
3. **Never** ask a tag an earlier answer already settles. `tags.source.json` keeps a small hand-made list of
   these. For example, after "Yes" to "one of the twelve apostles", "Did your person follow Jesus during his
   ministry?" is skipped. Forgiveness alone would otherwise keep such a tag splitting the field.

### 7.4 When to guess

The site guesses instead of asking when any of these holds:

- **only one person is leading** and at least 3 questions have been answered;
- **no tag splits** the remaining (everyone left has the same values);
- **the 20th turn** is reached.

The guess is the leading person with the highest fame (§3.3). A guess uses up a turn, as in the traditional
game: "Is it Moses?" is question 14 of 20. A **wrong guess** adds that person to `rejected`, and play continues.
A **right guess** ends the game.

### 7.5 Running out

After 20 turns without a right guess the site says so and offers two choices: **"Keep going: 5 more"** (20Q's
own figure is 98 % within 25) or **"I give up, tell me who you were thinking of"**. After 25 turns only the
second remains. It leads to the learning screen (§10).

---

## 8. Guess mode, start to finish

1. **Start.** "Think of a person from the Bible. Don't tell anyone. I'll try to guess who it is in 20 questions."
   Tap **I'm ready**. A small line underneath says "Real people from the Bible, from Adam to the early church. Not
   angels." A "How does it guess?" link opens §11.6.
2. **A question.** One large question card ("Is your person a woman?"), three big buttons, **Yes**, **No**, **Don't
   know**, and a turn counter (7 of 20). Each answer moves to the next question at once. The screen does not show
   a running list of who is left; that would spoil the magic and is reserved for reverse mode's helper.
3. **Undo.** A quiet **Undo** button takes back the last answer (or the last wrong-guess reply), as many times as
   needed. Undoing is free and does not count as a turn.
4. **A guess.** "Are you thinking of… **John the Baptist**?" with the person's brief line, so a player who thought
   of a different John can tell at once that this is not their person. Buttons: **Yes!** / **No**.
5. **Won.** "Got it in 9!" The person's name, short life summary (from the site's own story where there is one),
   a **Read about Ruth** link to their person page and **Play again** / **Swap: you ask the questions**. A small
   **"Your answers"** list shows each question and answer. Any answer that differed from the site's notes is
   marked, with the verse, the same as the lesson in §10.2. That teaches even after a win.
6. **Lost or gave up.** The learning screen (§10).

---

## 9. Reverse mode ("You ask")

### 9.1 Setup

- The site picks a secret person:
  - **Easy:** tier 1 only;
  - **Hard:** the whole pool.
- The pick is random, but it avoids the last 30 secrets stored on the device (§12).
- The player has **20 turns**. Asking a question or making a guess each uses one.

### 9.2 Asking

- **The question picker** is the same tag list, in seven sections (Who, When, Role, Family and people, Story,
  Places, Books), with a search box. Typing "king" filters to the matching questions. **No free typing is ever
  sent or answered:** the search only filters the fixed list. Already-asked questions are shown greyed with their
  answer.
- **The answer** appears in a running log under the picker: "Is your person a king? — **No**."
  - Unsure values answer "**The Bible doesn't say**".
  - n/a values (§4.1, set only in the hand file, §3.4) answer "**That doesn't really apply**".
  - Slip-marked values answer with the **true** value, because this is where the game teaches.
  - Each Yes or No answer from a model tag has a small "Why?" that shows the verse (loaded from the evidence file),
    so a surprising answer can be checked against Scripture.
- **The helper** is off by default, behind a "Show hints" switch:
  - a counter, "**People still possible: 37**";
  - an expandable list of those people, as a virtualised list per the site's long-list rule (about 50 rows
    rendered above and below the visible area, rows not cards, no "load more");
  - beside each question in the picker, a thin bar showing how evenly it would split the people still possible.
  The helper teaches the 50/50 strategy without explaining any mathematics. "Still possible" uses the same engine
  as guess mode on the answers the site has given, without forgiveness, since the site never answers wrongly. It
  reads slip-marked values as their **true** value, because the site's answers are true values too; otherwise the
  counter would keep people the site's own answer has already ruled out.

### 9.3 Guessing

- A **Make a guess** button opens a search over the pool's labels and other names.
- A wrong guess costs a turn and shows "No, it isn't Peter."
- A right guess ends the game: "Yes! It was **Barnabas**. You got it in 12." The end screen includes the person's
  summary and link, and one line of comparison: "The site would have needed about 9 questions." That figure comes
  from running the engine on the secret person with truthful answers.
- After 20 turns the site reveals the person, with the same summary and link.

### 9.4 Families and classes

Reverse mode works well on one screen for a family: one person taps, everyone suggests questions. No accounts,
rooms or phones-as-buzzers. That keeps it in the hub's "solo / family" audiences already set in the registry.

---

## 10. Learning from wrong guesses

### 10.1 "Who were you thinking of?"

After a loss the site asks who it was, with a search box:

1. It first searches the **pool**: labels and other names, tier 1 shown first.
2. **"Not in my list?"** then searches **all 3,055 people** in the site's people list (`loadEnglishPeople()` in
   [study.ts](../../../src/lib/study.ts), already used by the people pages; no new data file). That list also
   holds the 78 tribes and peoples, so the search drops every row with the group flag `g`. Choosing one of these
   records a **nomination** (§10.3).
3. **"Someone not on this list"** (an angel, a parable character, a mistake) closes politely and records nothing.

**No free text is ever accepted.** There is nothing to moderate and nothing personal to store.

### 10.2 The lesson: where we disagreed

For a pool member, the site lists every answer that contradicted its notes:

> **You said:** No to "Was your person a prophet?"
> **Our notes:** Yes. *Moses is called a prophet in Deuteronomy 34:10:* "Since that time, no prophet has risen in
> Israel like Moses…" (BSB, loaded at this moment from the site's Bible).

Each row has two buttons: **"Oh, I see"** (the player accepts the note) and **"I still think your note is
wrong"**. The page ends with "Thanks: this helps the game get better." When nothing contradicted, because the
person was simply not reached in time, the row list is replaced by "Your answers all matched our notes; we just
ran out of questions. We'll ask sharper questions next time." The case is still reported (§10.3), because it shows
a weak spot.

### 10.3 What is recorded

**On the device, at once:**

- Every "I still think your note is wrong" softens that one value to **unsure** for this device, stored in the
  game's storage (§12).
- The device never adopts the player's value as true. It only stops using that value against them. A player who
  thinks of the same person again will not lose on the same disagreement.
- A **Reset what the game learned on this device** link in the start screen's "How does it guess?" panel clears
  it.

**Shared, anonymous:** one small report is sent to `POST /api/twenty-questions/report`:

```json
{ "v": "<game file version>", "who": "moses-exo-2-10", "inPool": true,
  "answers": [["prophet","n"],["woman","n"],…], "guesses": ["aaron-exo-4-14"],
  "disputed": ["prophet"], "result": "lost" }
```

- Ids and letters only, no free text, no account, no cookie. The report row stores no IP address.
- Cloudflare sees the request as with any page load.
- The server checks every id against an allow-list built from the game file. It rejects anything malformed, any
  body over a few kilobytes, and any report whose `answers` exceed 25 or whose tags it does not know.
- It applies the same Origin and `Sec-Fetch-Site` checks as the testimonies endpoint (`checkOrigin` in
  [testimonies.ts](../../../server/testimonies.ts)). That function is private to the testimonies file, so the new
  handler carries its own copy of these few lines rather than editing or exporting from testimonies.ts.
- It rate-limits the way testimonies.ts's `limited()` does: a count per hour under a **hashed** key made from the
  action, the visitor's connection address (`CF-Connecting-IP`) and the hour, in a small limits table of its own
  that deletes expired rows. A generous cap (about 30 reports an hour) is far above real play. The hash is the
  only trace of the address, and it is deleted when its hour ends.
- It writes one row to a new table `twenty_questions_reports` in the site's existing D1 database (binding `DB`,
  [wrangler.jsonc](../../../wrangler.jsonc)), through a new migration in [migrations/](../../../migrations/)
  (`0006_twenty_questions_reports.sql`, the next free number today, creating both tables).
- A won game sends the same report with `"result": "won"`, so agreement is counted too, not only disputes. It is
  sent when the player **leaves the won screen** (Play again, Swap, a link, or the page closing, using `fetch` with
  `keepalive`), not the moment the guess is confirmed, so "Actually, that wasn't my person" (§13) can still turn it
  into a loss without a false "won" report.
- Reverse mode sends no report: the site's answers there come straight from its notes, so they teach it nothing.

A report failing to send is silent and harmless: the game never waits for it.

**This is the only part of the feature that touches shared files:** one migration, one handler file
(`server/twenty-questions.ts`) and one route file, `functions/api/twenty-questions/report.ts`. The site's routes
are file-based: [site-worker.mjs](../../../server/site-worker.mjs) forwards every request to the compiled
[functions/](../../../functions/) folder, so the worker itself needs no edit. The route file is two lines, in the
same pattern as [contact.ts](../../../functions/api/contact.ts), which hands the request to
`server/contact.ts`. The worker already refuses every POST to `/api/` on the temporary `workers.dev` address, so
the test address can never write reports. The migration is **applied to the live database at release**, a step
for whoever releases (the implementation step never deploys). Until it is applied the endpoint fails and the game
drops reports silently. The game must work fully without the endpoint.

**Cost:** rows in the D1 database the site already uses, far inside the owner's existing paid Workers plan
allowance. No new service and no new recurring charge. One report is a few hundred bytes.

### 10.4 Turning reports into better tags (offline, at a later build)

`scripts/twenty-questions/learn.ts` runs on this PC on an export of the table (`wrangler d1 export`, run by
whoever does the next tagging update). It never runs automatically. For every (person, tag) it counts the reports
where the player's answer **agreed** and **disagreed** with the stored value, and lists cases for review:

| Pattern | Proposed action | Decided by |
|---|---|---|
| ≥ 8 reports on one value, and ≥ 50 % disagree, but the verse is clear | **Slip-mark** the value: players commonly get it wrong. The game stops penalising it and keeps teaching it. | Mechanical, then listed in the review sheet |
| ≥ 8 reports, ≥ 50 % disagree, and the evidence is weak or the question ambiguous | Re-check with one resolver call (§5.4) on that value. If it is not clearly supported, set it to **unsure**. If the question's wording is the problem, rewrite the question (§6). | Resolver call plus agent review |
| One tag disputed across many different people | The **question** is ambiguous; rewrite it, keeping its definition | Agent review |
| A person outside the pool nominated in ≥ 3 reports | Add them to the pool in tier 2 and tag them through §5 in a small run | Agent review, then the same pipeline |
| Losses where every answer matched the notes, concentrated on certain people | Add a separating tag for them (§5.5 check 5) | Agent review |

**The rule that does not bend:** a crowd vote can soften a value to unsure, slip-mark it, or prompt a re-check.
It can **never** turn a yes into a no, or a no into a yes, against the verse. Only a resolver call reading the
text can do that, and it records why. Scripture is the authority, not the majority. That differs from Akinator on
purpose.

Each update rebuilds `twenty-questions.json` with a new `version`. Device-side softened values are keyed by
version, person and tag (softening Moses's "prophet" value does not touch anyone else's), and are dropped when the
version changes. The shared file has then absorbed what the reports
taught.

---

## 11. Screens

The game uses the games hub's shared look ([games.css](../../../src/pages/games/games.css)) and the approved
creative rules: no glow everywhere, no box around everything, no chat bubbles. One page, `TwentyQuestionsGame`,
with the screens below. Mobile first, because players will mostly be on phones. Every button is at least 48 px
tall, and the three answer buttons sit within thumb reach at the bottom.

### 11.1 Start

- The game's drawing (`GAME_ART.twentyQuestions`) and the title.
- Two large choices:
  - **"I think, you guess"** (guess mode);
  - **"You ask the questions"** (reverse mode), with an **Easy / Hard** switch underneath.
- A "How does it guess?" link (§11.6).
- If a game was in progress, **Continue your game** is shown first (§12).

### 11.2 Question (guess mode)

- The turn counter as a row of 20 small dots that fill in. Gold dots are guesses.
- The question in large type.
- Yes / No / Don't know.
- Undo.
- A "Quit" link that asks for confirmation.
- After question 15, a gentle line "Thinking hard…" shows the game is not stuck.

### 11.3 Guess

"Are you thinking of…" with the name in large type, the brief line, and **Yes!** / **No**. No picture: the site's
person pages carry no portraits, and the game adds no placeholder art.

### 11.4 Result and lesson

- **Won:** the person's summary, link, turn count, the "Your answers" list with any disagreements marked and
  versed, Play again, Swap modes.
- **Lost:** "Who were you thinking of?" search (§10.1), then the lesson rows (§10.2), then Play again.

### 11.5 Reverse mode

- The turn dots.
- The question picker, sectioned and searchable. On phones it is a full-height sheet; on wide screens a column
  beside the log.
- The answer log (newest at the top).
- **Make a guess.**
- The "Show hints" switch with its counter, possible-people list and split bars.
- The result screen.

### 11.6 "How does it guess?"

A short panel in plain words:

> "Every person in this game has a list of facts from the Bible, each checked against a verse. Before each question
> I count how many of the people still possible would answer yes, and I ask the question that splits them closest
> to half and half. Twenty perfect questions could tell a million people apart. 'Don't know' is always fine: it
> never rules anyone out. If you make one mistake I can usually still find your person. When I lose, you can tell me
> who it was, and that helps the game get better."

It also has a link to reset this device's learned changes.

### 11.7 Loading and failure

- The game file loads with a dynamic `import()` on the game's own route only, the pattern the other games use.
- If it fails: "The game couldn't load. Check your connection and try again", with a Retry button.
- If the evidence file or a verse fails to load, the lesson rows show the reference ("Deuteronomy 34:10") without
  the words. They never block.

### 11.8 Accessibility

- The answer buttons are real buttons with clear labels.
- Keyboard: **Y**, **N** and **D** answer, **U** undoes, **Enter** confirms a guess.
- The question region is an `aria-live="polite"` area, so screen readers announce each new question.
- The dot counter has a text equivalent ("Question 7 of 20").
- Colour is never the only signal: the gold guess dots also have a different shape.

### 11.9 Hub entry

The implementation step changes the registry entry `twenty-questions` to `status: "live"` and adds
`load: () => import("./twenty-questions/TwentyQuestionsGame")`, keeping its title, description, audiences
(solo, family), shelf and art. Nothing else in the hub changes.

---

## 12. Saving (browser storage)

- **One localStorage record, `bp-twenty-questions`.** It is rebuilt field by field on every read, the same as the
  other games, so damaged data cannot break the page.
- **What it holds:**
  - the game in progress (mode, answers, rejected guesses, reverse-mode secret id and asked tags, random seed,
    game-file version);
  - the last 30 reverse-mode secrets;
  - the device's softened values (§10.3), keyed by game-file version, person and tag;
  - simple totals (games played, won by the site, won by the player).
- **A reload resumes the game.** An in-progress game from an older game-file version is dropped with a one-line
  note, because the tags may have changed.
- **Without storage** (private browsing, or storage full) the game plays normally. It just cannot resume or
  remember.

---

## 13. Edge cases

| Case | Handling |
|---|---|
| Player answers "Don't know" to everything | Nobody is ever ruled out, so no tag can narrow the field. After 6 straight "Don't know" answers the site says "That's all right: try a few yes or no answers if you can", then keeps going. At turn 20 it guesses the most famous people in order, which is honest and harmless. |
| Player answers wrongly once | Forgiveness (§7.2) usually still finds them. After the game, the lesson shows the slip with its verse. |
| Player answers wrongly twice or more | The right person may fall out of "remaining". Each wrong guess, and the lesson, still teach, and the report helps find genuinely confusing questions. |
| Player thinks of someone not in the pool | The site eventually loses. "Not in my list?" finds them among all 3,055 people and nominates them (§10.4). |
| Player thinks of an angel, Satan or a parable character | The start screen says "real people, not angels". If they try anyway, "Someone not on this list" ends politely (§10.1). |
| Same-named people (John, Mary, Herod) | Distinct labels (§3.5). The guess shows the brief line, so "Mary mother of Jesus" and "Mary of Bethany" are clear. The "Who was it?" search shows both with their briefs. |
| A person known by two names (Jacob/Israel, Saul/Paul, Simon/Peter) | One pool member, found by any of its names. The "had their name changed" tag covers it. |
| The player's answer is reasonable but the note is stricter | That is what unsure and slip marks are for. If the tagging missed one, the lesson's "I still think your note is wrong" softens it on the device at once and feeds §10.4. |
| No tag separates the remaining people | The site guesses them in fame order (§7.4). §5.5 check 4 makes this impossible for tier-1 pairs. |
| The 20 turns are spent on wrong guesses after one slip | Rare, because guesses happen only when one person leads. "Keep going: 5 more" covers it (§7.5). |
| Undo after a wrong guess | The guess and its rejection are undone together, and the person returns to play. |
| Player taps Yes on a guess by mistake | The won screen has "Actually, that wasn't my person", which reopens the game as if they had said No. The won report has not been sent yet (it goes when the player leaves the won screen, §10.3), so no false win is recorded. |
| Reverse mode: player asks only detail questions | Fine: they get "The Bible doesn't say" more often. The helper (if on) shows how little each answer narrowed. |
| Reverse mode: the secret is Jesus | Allowed. The hand-set values answer, and questions that do not apply say so (§3.4). |
| Two tabs open | Each plays its own game; the last one saved wins the stored record. Not worth locking. |
| Game file updated while a game is open | The open game keeps its loaded file. A resume on a later visit drops a game from an older version (§12). |
| Report endpoint down, blocked or removed | The report is dropped silently; the game is unaffected. |
| Report abuse (scripted floods of fake disputes) | Ids-only validation, rate limit and Origin checks. More importantly, §10.4 never lets votes overturn Scripture, and every proposed change passes a resolver check. The worst a flood can do is slip-mark or soften values, which is visible in the review sheet and reversible. |
| Children | The questions are written for a ten-year-old (§6). No tag concerns violence beyond "put to death by others", which is a plain narrative fact (John the Baptist, Stephen). |

---

## 14. Files (for the implementation step)

**Game (new):** `src/pages/games/twenty-questions/`

- `TwentyQuestionsGame.tsx`: page and screen switch.
- `GuessMode.tsx`, `ReverseMode.tsx`, `QuestionPicker.tsx`, `Lesson.tsx`, `PersonSearch.tsx`: screens.
- `engine.ts`: the pure selection logic of §7, shared with the build's simulation.
- `storage.ts`: §12.
- `report.ts`: §10.3, which sends and forgets.
- `twenty-questions.css`.
- Tests beside each.

**Data:**

- `src/data/twenty-questions/twenty-questions.json`: shipped, generated.
- `src/data/twenty-questions/twenty-questions-evidence.json`: shipped, generated, loaded lazily.

**Build (new):** `scripts/twenty-questions/`

- `pool.source.json`: hand-kept.
- `tags.source.json`: hand-kept, with definitions and questions.
- `jesus.source.json`: hand-kept.
- `build-pool.ts`, `tags-from-data.(ts|py)`, `prompt.md` (the model pass's system prompt), `merge-passes.ts`,
  `check.ts`, `check-questions.ts`, `learn.ts`.
- `tagged.json`: generated, committed, not shipped.
- BatchRunner job files.

**Server (small, shared, §10.3):**

- `server/twenty-questions.ts`;
- `functions/api/twenty-questions/report.ts`: the two-line route file (no edit to `server/site-worker.mjs`);
- `migrations/0006_twenty_questions_reports.sql` (or the next free number), creating the reports table and its
  own limits table; applied to the live database only at release.

**Hub:** the registry entry change of §11.9.

**Docs:**

- this design;
- `docs/features/twenty-questions/review-sheet.md` (generated);
- a short README in `scripts/twenty-questions/` on how to rerun tagging and learning.

---

## 15. Tests

- **Engine:**
  - misses and remaining (§7.1–7.2), including "Don't know", unsure and slip values never counting;
  - the split score and its tie rules;
  - everyday before detail;
  - seeded variety is reproducible;
  - guess triggers;
  - the wrong-guess path;
  - Undo, including undoing a guess;
  - 20 and 25 turn limits.
- **The simulation as a test.** A unit test runs the §5.5 simulation on a fixed small fixture (about 30 people,
  25 tags). A data test (vitest, beside the engine, like the "Who's older?" `data.test.ts`) runs it on the real
  shipped file and fails below the §5.5 targets, so `npm test` guards it without any change to `package.json`.
- **Data:**
  - every shipped id is a real person;
  - labels are unique;
  - `v` strings have one letter per tag and only allowed letters, with `-` (n/a) only where the hand file sets it;
  - no person before Jacob's sons is yes or no on "Israelite" or "another nation" (§4.2);
  - every tag question passes the form rules;
  - no verse wording is stored (the existing check covers this);
  - Jesus's values match the hand file.
- **Reverse mode:**
  - the answer for each value kind;
  - the "doesn't apply" wording for n/a values, and the engine treating `-` exactly like `?`;
  - the hints counter reading slip-marked values as their true value;
  - "still possible" counts;
  - secrets avoid the last 30;
  - a wrong guess costs a turn.
- **Learning:**
  - softened values apply only to their version, person and tag;
  - a won report is sent only on leaving the won screen, and "Actually, that wasn't my person" sends none;
  - reverse mode sends no report;
  - reset clears them;
  - report payloads contain only allowed ids and letters;
  - a failed send does not affect play.
- **Server handler:** validation rejects unknown ids, oversized and malformed bodies, and missing or foreign
  Origin; the hourly limit refuses the report over the cap; one valid report writes one row and stores no IP
  address (run against the local D1 binding).
- **UI:**
  - a full guess-mode game with scripted answers reaches the right person;
  - a full reverse-mode game;
  - keyboard controls;
  - resume after reload;
  - the hub shows the game as live.

---

## 16. Cost

| Item | Cost |
|---|---|
| Playing | $0. A static file and browser code. No model and no paid call at play time. |
| Tagging, once | About 800 Haiku-class calls plus a few dozen Sonnet-class resolver calls and one question-writing call. That is about 6–7 million input and 1.2 million output tokens, well under 1 % of the October chapter-summary run. It runs through BatchRunner with a pilot, a budget cap and the **owner's yes on the measured estimate before the full run** (§5.6). |
| Learning updates | Occasional small runs: one resolver call per disputed value, plus tagging for nominated people. Each is gated the same way when it is a batch. |
| Reports | Rows in the D1 database the site already has, inside the existing paid Workers plan. No new service, no new recurring charge. |
| Dependencies | None new. The game runs fully without the report endpoint. |

---

## 17. Sources consulted

- Akinator explainers:
  [playhop guide](https://playhop.com/blog/guides/how-does-akinator-know-what-you-are-thinking/),
  [Codemia](https://codemia.io/knowledge-hub/path/what_kind_of_algorithm_is_behind_the_akinator_game_1),
  [CLRN](https://www.clrn.org/is-akinator-ai/),
  [Medium: how Akinator reads your mind](https://medium.com/@inemri/how-akinator-reads-your-mind-unveiling-the-games-algorithmic-magic-c8ee86dbc1d3).
- [Reversing the Twenty Questions Game (arXiv 2301.08718)](https://arxiv.org/abs/2301.08718).
- 20Q: [Wikipedia](https://en.wikipedia.org/wiki/20Q),
  [patent US20060230008A1](https://patents.google.com/patent/US20060230008A1/en),
  [Globe and Mail interview](https://www.theglobeandmail.com/technology/science/is-it-animal-vegetable-or-artificial-intelligence/article18161750/),
  [Scienceline](https://scienceline.org/2006/07/tech-schrock-20q/),
  [Baeldung: decision trees and 20 questions](https://www.baeldung.com/cs/decision-trees-20-questions).
- Theory:
  [Jedynak, Frazier & Sznitman, Twenty Questions with Noise](https://people.orie.cornell.edu/pfrazier/pub/2011_JedynakFrazierSznitman_20questions.pdf),
  [Dagan et al., The entropy of lies](http://www.cs.toronto.edu/~yuvalf/Lies.pdf),
  [Hu et al., Playing 20 Question Game with Policy-Based Reinforcement Learning (EMNLP 2018)](https://aclanthology.org/D18-1361.pdf).
- Bible guessing games:
  [Bible Games Central: Bible Who Am I](https://biblegamescentral.com/bible-who-am-i/),
  [Gathered Again: Bible Who Am I game](https://gatheredagain.com/bible-who-am-i-game/), and Amazon listings for
  "Guess Bible Who Am I" board games (24 characters).

---

## Review (2026-11-10, orchestrator job 2f1dd1dc, sequence 30 step 18)

One critical review, as [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) asks, against the approved spec
(entry 16 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md)), those rules and the real codebase. Every
correction below is already made in the body above; this list says what changed and why.

**Checked and found right (no change):** the design meets every line of the spec: tags per character, one
pre-written question per tag written once by a cheap model, yes / no / don't know buttons, the closest-to-50/50
rule over the remaining characters, a reverse mode over the same fixed question set with no free typing, and the
tagging as the main one-time work. No AI model runs at play time. Against the code: the hub entry
`twenty-questions` and its drawing exist in [registry.ts](../../../src/pages/games/registry.ts) and
[art/index.ts](../../../src/pages/games/art/index.ts); live games use `load: () => import(...)`; game data under
`src/data/` is loaded with a dynamic `import()` (as "Who's older?" does); the storage key style `bp-<game>`
matches; verse ids are `BBCCCVVV` with wording loaded through `resolveVerses` in
[verses.ts](../../../src/lib/verses.ts), and [check-verse-wording.py](../../../scripts/check-verse-wording.py)
scans `src/` and `data/`; the people files carry the fields named in §2; the odd-one-out label table, the people
addresses file and the 21 people-page groups exist; "Who's older?" has 160 people with tiers; the D1 binding `DB`
exists and the next free migration number is 0006; the quoted Deuteronomy 34:10 matches the site's BSB text.

**Corrected:**

1. **The report route was in the wrong place** (§10.3, §14). The design said to add "one route line" to
   [site-worker.mjs](../../../server/site-worker.mjs). That file adds no routes: it forwards every request to the
   [functions/](../../../functions/) folder, which the release compiles with `wrangler pages functions build`. The
   route is now a two-line file, `functions/api/twenty-questions/report.ts`, in the pattern of
   [contact.ts](../../../functions/api/contact.ts); the worker is not touched. Also noted: the worker already
   refuses writes on the temporary `workers.dev` address, and the new migration must be applied to the live
   database at release, which the implementation step does not do.
2. **The anti-abuse checks could not be reused as written, and the privacy line overstated** (§10.3).
   `checkOrigin` and the rate limiter in [testimonies.ts](../../../server/testimonies.ts) are private to that
   file, and the site's limiter counts per hour, not per minute, under a hashed key built from the visitor's
   address. The handler now carries its own copy of the origin check (testimonies.ts stays untouched, per the
   rule to avoid shared files) and its own hourly limits table. "No IP address stored" became the accurate
   statement: the report row stores none, and the hashed limit key is deleted when its hour ends.
3. **"That doesn't really apply" could not be stored** (§4.1, §4.5, §3.4, §9.2). The table promised a separate
   reverse-mode answer for questions that make no sense about a person, but the shipped letters (`y n ? Y N`)
   had no way to record it. Added an **n/a** value, letter `-`, set only in the hand file for Jesus and treated
   exactly like unsure by the engine.
4. **The "can the site tell these two apart?" checks counted unsure as a difference** (§5.5 checks 4 and 5). Two
   people where one is unsure and the other yes on every distinguishing tag would have passed, yet the game can
   never separate them, because unsure rules nobody out. A tag now separates two people only when one is yes and
   the other no, reading slip-marked values as unsure, as guess mode does.
5. **People from before Israel existed would have been tagged so that honest players lose** (§4.2). By the
   literal definition Abraham is not an Israelite and so would be yes for "from another nation", but a player
   thinking of Abraham answers no. Both tags are now unsure for everyone before Jacob's sons, with a data test.
6. **"Fails the build" was not how this site's game checks work** (§5.5, §15). Game checks are not in the site's
   `prebuild`, and adding them would mean editing the shared `package.json`. The tagging checks now fail the
   tagging build (run by hand, like the "Who's older?" scripts), and the full play simulation over the shipped
   file runs as a vitest data test, so `npm test` guards it. The engine keeps to relative `.ts` imports so the
   Node scripts can load it.
7. **The device's corrections were keyed too loosely** (§10.4, §12). Softened values were "keyed by version and
   tag", which would have softened a tag for every person at once. They are now keyed by version, person and tag.
8. **Reverse mode's hint counter would have been wrong with slip marks** (§9.2). Reading slip-marked values as
   unsure would keep people the site's own true answer has already ruled out; the counter now reads true values.
9. **A mistaken "Yes!" on a guess would have sent a false "won" report** (§10.3, §13). The won report is now sent
   only when the player leaves the won screen, so "Actually, that wasn't my person" still works cleanly. Reverse
   mode sends no report, which the design had left unsaid.
10. **Smaller fixes.** Guess-screen portraits removed (§11.3): the site's person pages have none. The full people
    list has 3,055 people, not 3,054, and the "Not in my list?" search must drop the 78 tribe and nation rows it
    also holds (§10.1, §13). The authorship example in §4.1 named a tag that is not in the list and leaned on
    tradition; it now says why "wrote part of the Bible" is deliberately not a tag. §5.2 called Esther's period an
    error (it is right) and left Job's contested dating to the era tags; every era tag is now unsure for Job. The
    guess example in §8 now uses John the Baptist, a name that actually needs telling apart.

**Left as designed, on purpose:** the forgiveness rule, the split score and the guess triggers are a reasonable
first reading and the §5.5 simulation targets gate them on the real tags; changing them before that measurement
would be guesswork. The one-time tagging run still waits for the owner's yes on the pilot's measured estimate
(§5.6); nothing in this review changes its size or cost.
