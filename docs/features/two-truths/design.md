# Two truths and a lie — design

**Feature:** approved idea 20 in [APPROVED-IDEAS.md](Jarvis/Projects/BibleProject/APPROVED-IDEAS.md): *"Three statements about a Bible character; spot the made-up one."*
**Slug:** `two-truths` (already in [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) as "coming soon": audiences Solo and Youth group, on the "Youth group and church night" shelf, with its own drawing).
**Rules followed:** [FEATURE-BUILD-RULES.md](Jarvis/Projects/BibleProject/FEATURE-BUILD-RULES.md), the site's [AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md), and the workspace rule that any batch of model calls runs through [BatchRunner](Jarvis/Tools/BatchRunner/README.md) with a pilot, a budget and the owner's yes.
**Written:** 2026-11-07, sequence 31 step 10 (research and design). Step 11 reviews this document once; step 12 builds the game.

---

## 0. Summary

- The game shows one Bible person and three short statements about them. Two are true, one was made up. The player picks the made-up one. The reveal then marks every statement, shows the Bible verse behind each true one, and for the made-up one shows **the truth it twisted**, with the verse that says so.
- **Nothing is written at play time.** Every statement is written once, ahead of time, checked, and stored in a JSON file the game loads. There is no running cost and no model call from the site.
- **Two sources of statements:**
  1. **A starter deck written and checked in this design** (Appendix A): 30 well-known people, 3 true statements and 2 made-up ones each, 150 statements in all. Every true statement and every correction was checked word by word against the site's own Berean Standard Bible text. The game can go live on this deck in step 12 with no model call and no spend.
  2. **A one-time generation run for the rest of the Who's older pool** (up to 130 more people, §5). A cheap model writes candidate statements from the site's own people data and the verses that data cites. A second, different model checks each one blind against the verses. A build script then runs mechanical checks, and a person reads the review sheet. This run costs plan usage, so it **waits for the owner's yes** (§13) and is a follow-up job, not part of step 12.
- **Truths must be stated by a verse; lies must be contradicted by one.** "The Bible never says so" is not enough to call something false. Every lie carries its correction sentence and the verse that contradicts it (§4).
- **Two ways to play** (§6): *Ten rounds* on your own, scored out of ten with a no-spoiler share line; and *Lead a group*, a big-type screen for a youth group, where the leader reads out the three statements, the room votes, and the leader taps *Show the answer*. Optional team tallies.

---

## 1. What the spec fixes, and what this design decides

| Fixed by the spec, the brief or the build rules | Decided here |
|---|---|
| Three statements about one Bible character; spot the made-up one. | One person per round; exactly two truths and one lie; the lie's position is random (§7). |
| Statements generated once ahead of time from the site's people data (task brief). | Leads come from three site sources with verse references (§3); a hand-checked starter deck ships first (Appendix A); the rest come from one BatchRunner run after the owner's yes (§5). |
| The true statements are fact-checked against Scripture, with references (task brief). | Five layers of checking, from the source data to a person reading the review sheet (§5.4). A true statement must be *stated* by its cited verses. |
| Lies plausible but clearly false (task brief). | "Clearly false" means *contradicted by a named verse*. "Plausible" means a swap from inside the person's own story world: a related person, a nearby place, a near number (§4.3). A list of things a lie may never do (§4.4). |
| Reveal with verses (task brief). | Each statement's verse is shown in the reader's Bible, with a link to read it in context; the lie shows its correction and the contradicting verse (§8.3). |
| No runtime model cost; reuse site data; Berean Standard Bible wording; touch only the game's own files plus its registry entry; never deploy (build rules). | The game reads one static JSON file. The site's people data, its people-pages, its question bank and its Bible text are reused. Statements follow the Berean Standard Bible's own words (§4.2). |

---

## 2. Research

### 2.1 The game everyone knows

*Two truths and a lie* is a party and classroom ice-breaker: a person says three things about themselves and the others guess which is false. It works because (a) the true statements are chosen to be surprising and (b) the lie is chosen to be ordinary, so the "obvious lie" is often the truth. TV formats built on the same idea (the BBC's *Would I Lie to You?*, the US *To Tell the Truth*) show that the fun lives in the reveal: hearing why the strange thing is true.

**What we take:** surprising truths, ordinary lies, and a reveal that tells the story behind the answer.
**What changes for us:** the statements are about a Bible person, not the speaker, so the reveal can always point at a verse. The game teaches rather than only entertains.

### 2.2 Learning research that shapes the rules

- **Feedback with the reason teaches more than right/wrong** (Hattie and Timperley, *The Power of Feedback*, 2007; Butler, Karpicke and Roediger, 2008). Every reveal gives the verse, not just a tick.
- **Wrong options can be learned as true.** Roediger and Marsh (2005, "The positive and negative consequences of multiple-choice testing") found that the wrong answers people read in a multiple-choice test sometimes turn up later as "facts" (the *negative suggestion effect*), and that showing the correct answer afterwards largely removes it (Butler and Roediger, 2008). Repetition alone also makes a statement feel truer (the *illusory truth effect*, Hasher, Goldstein and Toppino, 1977).
  **Consequences for this game, all binding:**
  1. The lie is never shown on its own after the reveal. Wherever it appears again (the reveal, the recap), it is struck through and followed straight away by **"The truth:"** and the correcting verse.
  2. The share text never contains a statement, only the score pattern (§6.1).
  3. The same lie is not dealt again soon: recently seen statements are avoided (§7).
- **Surprise helps memory.** A true statement that sounds wrong ("Elisha made an iron axe head float") makes the player commit to a guess and then corrects them, which is the pattern that research on "hypercorrection" (Butterfield and Metcalfe, 2001) found sticks best.

### 2.3 The site's data, and how far each source can be trusted

| Source | What it gives | Trust for this game |
|---|---|---|
| [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) | 3,133 people: id, name, other names, a one-line brief, mention count, period | Labels and briefs only. |
| [data/study/people/](Jarvis/Projects/BibleProject/Website/data/study/people/) (one file per person, from STEP Bible's names data, CC BY 4.0) | Family links, tribe, sex, era, and a short **article** about each person; all 3,133 have one (median 642 characters) | **A lead, never proof.** Articles mix sentences with references, in several formats (`(Exo.2.1-2)`, `(Gen. 25:24-26)`, `(Exodus 3-4)`), with sentences that have none. On the 160-person Who's older pool, the median person has 5 article sentences carrying a reference. One error was found in this job: Aaron's article calls him "the older brother of Moses and Miriam", but Scripture never says which of Aaron and Miriam was older (Exodus 7:7 makes Aaron three years older than Moses; the sister who watches over baby Moses in Exodus 2:4 is not named). **Release builds pack these files** ([AGENTS.md](Jarvis/Projects/BibleProject/Website/AGENTS.md), "Person packs"), so the game itself must never read them; only the build and the generation items do. |
| [src/data/people-pages/](Jarvis/Projects/BibleProject/Website/src/data/people-pages/) | 199 prophets, rulers, apostles and church figures with **4,036 claims marked as Scripture**, each with exact verse-id references | **The best leads.** Hand-curated with references. Their quotations use the King James wording, so only the facts and references are reused, never the wording. |
| [data/questions/bank.json](Jarvis/Projects/BibleProject/Website/data/questions/bank.json) | 14,916 questions, 6,021 of them Bible trivia naming a person, each with its answer, three wrong options (audited), a reference and a "matched" passage check. 141 of the 160 pool people have at least 3 trivia questions | **Good leads for both kinds of statement.** A question plus its answer is a true fact with a reference. Its wrong options were written to be plausible, so they are natural **lie candidates**, and the question's own passage is the verse that contradicts them. People are named, not given ids, so leads are matched by name and checked (Joseph, John, Mary, James and others share names). |
| [src/data/whos-older/characters.source.json](Jarvis/Projects/BibleProject/Website/src/data/whos-older/characters.source.json) | 160 hand-chosen people with readable, unambiguous labels ("Joseph of Egypt", "Jeroboam I"), a one-line tag and a fame tier | **The pool.** It already solves the namesake problem for labels and is the list players will know. |
| [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/) | The Berean Standard Bible text, one file per book, `"chapter:verse": text` | **The final judge.** Every check word must be found in its cited verses here. |

**What the prototype check in this job showed.** Writing Appendix A against the real text caught eight mismatches before anything shipped, all of the same kind: the statement used a common English word where the Berean Standard Bible uses another. Jacob's dream is of a **ladder**, not a stairway (Genesis 28:12); David played the **harp**, not a lyre (1 Samuel 16:23); Zacchaeus repays **fourfold**; Gideon keeps **three hundred** men, written out; Moses dies at **a hundred and twenty**. A reveal that shows a verse disagreeing with the "true" statement above it would look like an error, so statements follow the Berean Standard Bible's own words for the key noun or number (§4.2). Two of the drafted lies were also replaced because they were only "not mentioned" rather than contradicted (Daniel thrown into the furnace; Samson naming a belt to Delilah, when he really did tell her three false secrets). That is exactly the failure §4.3 rules out.

---

## 3. Who appears

- **The pool is the Who's older list of 160 people** ([characters.source.json](Jarvis/Projects/BibleProject/Website/src/data/whos-older/characters.source.json)), reusing its ids, labels and tags. A person is playable once they have at least **3 truths and 2 lies** that pass every check.
- **Jesus and God never appear as the subject** (Jesus is not in the Who's older pool either). A made-up statement about Jesus or God would put a false claim about them in front of players, and the reveal's correction cannot always undo that. This is listed for the owner (§15).
- **Launch deck:** the 30 people of Appendix A, 24 from the Old Testament and 6 from the New, 9 of them women. A ten-round game draws 10 different people, so the launch deck gives three games before a person repeats.
- **After the generation run:** every pool person who passes, up to 160. The start screen's Old Testament / New Testament choice is offered only when each side has at least 10 playable people.

---

## 4. Statements: what makes a good one

### 4.1 One statement

| Field | Meaning |
|---|---|
| `id` | Stable id, `<person id>:t1`, `:l2` …; never reused, so vetoes and "recently seen" survive rebuilds. A removed statement is marked `"retired": true`, never deleted. |
| `who` | Person id from the pool. |
| `kind` | `"truth"` or `"lie"`. |
| `text` | What the player reads, 20–110 characters, one sentence. |
| `refs` | Verse-id ranges (`BBCCCVVV`, as everywhere on the site). For a truth: the verses that state it. For a lie: the verses that contradict it. |
| `check` | Words that must occur, as written, in the cited verses of the site's Berean Standard Bible (the build checks this). |
| `truth` | Lies only: the correction, one sentence, shown after "The truth:". |
| `swap` | Lies only: what was changed: `person`, `place`, `number`, `object`, `group` (tribe or nation), `order` or `outcome`. |
| `swapIn` | Lies only: the exact words in `text` that carry the made-up detail ("Babylon", "seven stones", "Gehazi"). The build checks they are in the lie and **not** in the lie's own verses. |
| `topic` | Short key ("age-at-death", "birthplace"). Two statements with the same topic are never dealt together. |
| `clash` | Optional list of statement ids never dealt with this one, for cases the topic key misses (Appendix A, Zacchaeus). |
| `origin` | `"hand"` (Appendix A or later hand edits) or `"generated:<run id>"`. |

### 4.2 Rules for every statement

1. **One fact per sentence.** No "and" joining two claims, where one half could be true and the other false.
2. **Use the Berean Standard Bible's key word** for the noun, name or number the statement turns on (ladder, harp, fourfold). Numbers are written the way that Bible writes them in that verse.
3. **Same voice and length for all three.** Lengths in a round should be within about a third of each other; a lie must not be the only short, vague or oddly specific line. The build warns when a person's lies are on average more than 25% shorter or longer than their truths.
4. **No giveaway words:** no "only", "never", "always", "first" or "not" in a lie unless the contradicting verse itself turns on that word; no hedges ("probably", "it is said").
5. **Name the person or use "he"/"she" plainly**, never a different name for them in the same round (Abram is fine where the verse uses it; the label says who is meant).
6. **Family-friendly.** The game is on the Youth group shelf. Truths may mention sin and violence the way the Bible does (Aaron made the golden calf; Samson struck down a thousand men), plainly and without detail.

### 4.3 Rules for a lie: plausible but clearly false

**Clearly false** means a cited verse says something that cannot be true at the same time as the lie: a different name, place, number, group or outcome for the same event. The reveal shows that verse. Not enough:
- "Scripture never says this" (argument from silence). *Noah had a daughter* is not clearly false.
- "Tradition says otherwise", or a point scholars dispute.

**Plausible** means the swapped-in detail comes from the person's own story world, so a half-remembering player could believe it:

| Swap | Example from Appendix A | Why it is plausible | What contradicts it |
|---|---|---|---|
| person | *Elisha was taken up to heaven in a chariot of fire.* | It was his master Elijah. | 2 Kings 13:20, "Elisha died and was buried". |
| place | *Sarah was buried near Bethlehem.* | That is where Rachel was buried. | Genesis 23:19, the cave of Machpelah. |
| number | *David picked seven stones for his sling.* | Seven is a "Bible number". | 1 Samuel 17:40, five smooth stones. |
| object | *Rahab hung a blue cloth from her window.* | A sign in a window is right; the colour and thing are not. | Joshua 2:21, a scarlet cord. |
| group | *Paul was from the tribe of Judah.* | Judah is the best-known tribe. | Philippians 3:5, Benjamin. |
| order | *Jacob was born first, before his twin Esau.* | Jacob got the birthright. | Genesis 25:25–26. |
| outcome | *Gideon agreed to become Israel's king.* | The people did ask him. | Judges 8:23. |

### 4.4 What a lie may never do

1. **Be true of a namesake.** "John wrote a Gospel" is true of one John; "Herod killed John the Baptist" is true of one Herod. The verifier is asked about namesakes explicitly (§5.4), and the label always says which person is meant.
2. **Turn on a number the manuscripts disagree on**: Goliath's height (1 Samuel 17:4), Saul's age at accession (1 Samuel 13:1), Ahaziah's age (2 Kings 8:26 against 2 Chronicles 22:2), Jehoiachin's age (2 Kings 24:8 against 2 Chronicles 36:9), and any number the Berean Standard Bible footnotes. Such facts may not be truths either. The list is kept in the build's block list and grows as the verifier flags more.
3. **Rest on a popular myth in either direction**: the apple, the whale, the three wise men, Mary Magdalene as a prostitute, Jonah's three days "in a whale". These are not clearly false or clearly true from the text, so they make unfair rounds.
4. **Invent a sin, a crime or a shameful act** for a person ("Ruth worshipped idols in Bethlehem"). Swapping who did a deed the Bible records is fine; making up a new wrong is not.
5. **Touch doctrine**: nothing about salvation, the nature of God or Christ, the sacraments, or anything Christian traditions disagree on.
6. **Be a plain negation** of a truth ("Moses did not die at 120"). Players spot those instantly and they teach nothing.
7. **Contradict one of the two truths dealt with it** in a way that gives the answer away. The `topic` and `clash` fields prevent this (§7).

---

## 5. Making the statements (once, ahead of time)

### 5.1 The two routes

| Route | Who writes | Cost | When |
|---|---|---|---|
| **Starter deck** (Appendix A) | Written in this design and checked word by word against the site's Berean Standard Bible by a script. | None now; already done in this job. | Ships in step 12. |
| **Generation run** for the other pool people | A cheap model, one call per person, through BatchRunner; then a second model checks blind. | Plan usage; needs the owner's yes (§13). | A follow-up job after the yes. Step 12 does not run it. |

Both routes end in the same source file and pass the same build checks, so the game never knows which route a statement came from.

### 5.2 The generation items (one text file per person)

A script (`scripts/two-truths/make-items.ts`, written by the follow-up job) writes one UTF-8 file per person who is not yet playable. Because a BatchRunner call cannot open files, each item carries everything:
1. The person's label, tag and id, and the names of namesakes in [people.json](Jarvis/Projects/BibleProject/Website/data/study/people.json) (same first name) so the model knows whom **not** to describe.
2. **Leads:** the person's people-pages claims marked as Scripture (fact text + references), their article sentences, and their question-bank trivia items (question, answer, wrong options, reference), each lead numbered.
3. **The verses:** the Berean Standard Bible text of every verse any lead cites, keyed by reference, capped at about 60 verses (most-cited first). A statement may only cite verses that appear in its item.
4. The statements already in the source file for that person, so the model adds new ones and avoids their topics.

### 5.3 The generation call

- **Task prompt** (the whole system prompt, Appendix B): the rules of §4 in short form, the output schema, and two worked examples from Appendix A.
- **Output** (enforced with BatchRunner's `--schema`): up to 6 truths and 4 lies. Each truth gives `text`, `refs` (only references present in the item), `check` (words copied from those verses), `topic`, and the lead number it came from. Each lie gives `text`, `truth`, `refs`, `check`, `swap`, `swapIn`, `topic` and the lead it twists.
- **Model:** the pilot tries Haiku first on three people, including one from Appendix A so its output can be compared with a checked set. Sonnet is used only if Haiku's statements fail the checks of §5.4 noticeably more often (the rule: the cheapest model that passes the pilot).

### 5.4 The checking layers (a statement must pass all of them)

1. **Sources with references.** Every lead comes from the site's own data and arrives with its verses; the model never works from memory alone.
2. **Mechanical build checks** (`scripts/build-two-truths.ts`, fatal unless marked; they run on the starter deck too):
   - every `refs` range exists in the site's Berean Standard Bible, and every `check` phrase occurs in it (case and curly quotes ignored);
   - for a lie, its `swapIn` words occur in `text` and do **not** occur, as whole words, in its own cited verses. (A looser rule, "no word of the lie that is missing from the correction may appear in the verse", was tried on Appendix A in this job and raised 10 false alarms out of 60 lies, on ordinary words like "son", "angel" and "prophet"; naming the swapped detail explicitly raised none.);
   - lengths 20–110 characters (correction sentences up to 140); no giveaway words in lies (§4.2 rule 4); no block-listed topic (§4.4 items 2–3);
   - every person has at least 3 truths and 2 lies, ids are unique, topics and clashes point at real statements;
   - warning only: a person whose lies differ in average length from their truths by more than 25%.
3. **Blind second check by a different model** (a second BatchRunner run; Sonnet if generation used Haiku). One call per person. The verifier sees the statements **unlabelled and shuffled**, each with its cited verses, and answers for each: `stated` (the verses say it), `contradicted` (the verses say otherwise), or `not-stated`; plus "could this be true of another Bible person with this name?" and, for the correction sentences, `stated` or not. A truth must come back `stated`; a lie `contradicted`; its correction `stated`; and no namesake flag. Anything else is dropped into the review sheet's "flagged" list, never auto-fixed.
4. **A person reads it.** Each build writes [review-sheet.md](Jarvis/Projects/BibleProject/Website/docs/features/two-truths/review-sheet.md): per person, every statement with its verse text, kind, swap and verifier verdict. Anything that reads wrong goes in `veto.json` by id, with a reason; the next build drops it. Generated statements start as `"reviewed": false` and the game only deals reviewed ones, so nothing generated reaches players until someone has read it. The owner may delegate the reading to a reviewing job; the sheet says who reviewed what.
5. **The test suite re-checks the shipped file** independently of the build (§11): every reference and check phrase against the Bible text, every person's minimum counts, and the dealing rules.

### 5.5 Merging

An import script (follow-up job) reads the BatchRunner output folder, keeps only statements that passed layer 3, gives them stable ids and `origin: "generated:<run id>"`, and appends them to the source file. It never edits or removes an existing statement. Then the build runs, the review sheet is read, and reviewed statements go live with the next ordinary release.

---

## 6. Rules and modes

### 6.1 Ten rounds (solo, the default)

- Ten rounds, ten different people. Each round: the person's label and tag, then three statements marked A, B and C. Tap the one you think is made up.
- **Score:** one point per lie spotted. No timer, no lives: the game is about reading and learning, and a family can play it together on one phone.
- After each pick, the reveal (§8.3) opens in place; *Next* moves on.
- **End screen:** score out of ten, a short line by score band (0–4 "Good start", 5–7 "Well read", 8–9 "Sharp eye", 10 "Perfect"), the recap (each person, with the lie struck through and its truth), *Play again*, and *Share*. The share text is the game name, the score and one square per round (🟩 spotted, 🟥 missed), plus the site address. No statements, so no spoilers and no lies travelling on their own.
- **Kept on the device:** best score, games played, average score.

### 6.2 Lead a group (youth group, church night)

- For one screen in a room (a projector, a TV, or the leader's phone). Big type, high contrast, statements labelled A, B and C.
- No picking on the device. The leader reads the person and statements aloud; the room votes (hands, sides of the room, or cards). The leader taps **Show the answer**, which opens the same reveal in large type, then *Next*.
- **Optional teams** (2 to 4, named "Team 1" … or renamed): after the reveal, the leader taps each team that got it right; a running tally shows at the top. Without teams there is no score.
- Rounds go on until the leader stops or the deck runs out; *Finish* shows the tally and the recap.
- Keyboard on a laptop: Space or Enter shows the answer, then moves to the next round; 1–4 award teams.

### 6.3 What the start screen offers

- *Play ten rounds* and *Lead a group*.
- *Old Testament / New Testament / Everyone*: offered only when both sides have at least 10 playable people (§3); until then, Everyone without a choice.
- A one-paragraph "How it works" with an honest note: "Every true statement is taken from a Bible verse, and every made-up one is shown against the verse that corrects it."

---

## 7. Dealing a round

`deal(deck, recent, rng)` in `src/pages/games/two-truths/deal.ts`, pure and seedable for tests:

1. **Person:** one not yet used in this game, preferring people not in the device's last 40 people played; within that, at random.
2. **Lie:** one of the person's lies, preferring any not in the last 300 statements seen.
3. **Truths:** two of the person's truths that share no `topic` with each other or with the lie and are not in the lie's `clash` list, again preferring unseen ones.
4. **Order:** the three shuffled, so the lie is equally likely to be A, B or C. A test deals 3,000 rounds and requires each position to hold the lie 30–37% of the time.
5. If preferences cannot all be met (a small deck, a long-time player), they give way in this order: unseen statements, then recent people. A round is never dealt with clashing statements, and never with fewer than two truths.

With 3 truths and 2 lies, each launch person has 6 possible rounds (4 for Zacchaeus, whose second lie may only be dealt with his first two truths).

---

## 8. Screens

### 8.1 Start

Title, one-line explanation, the two mode buttons, the testament choice when offered, best score, and the "How it works" paragraph. Link back to the games hub.

### 8.2 Round

- Top: "Round 3 of 10" (solo) or the team tally (group).
- The person: label in large type, the tag below ("Moses' brother, first high priest of Israel" style, from the pool), and nothing else about them, so the page does not hint at an answer.
- Three full-width statement buttons, A, B and C, each with the whole sentence. On a phone they stack; on a wide screen they stay stacked (reading three sentences side by side is harder).
- Solo: tapping a statement selects it and asks "Is this the made-up one?" with *Yes, that's the lie* / *Pick again*, so a mis-tap on a phone does not cost a point.

### 8.3 Reveal

- A result line, announced to screen readers: "You spotted it" or "Not quite: that one is true."
- **Each statement, marked in words and colour** (never colour alone): **True** with the verse reference, the verse text in the reader's current Bible (looked up through [verses.ts](Jarvis/Projects/BibleProject/Website/src/lib/verses.ts) from the stored verse ids, as other games do) and a *Read in context* link (`/read/<Bible>/<BOOK>/<chapter>?hl=<verse>`).
- **The lie**: struck through, labelled **Made up**, followed immediately by **"The truth:"**, the correction sentence, the contradicting verse's text and its *Read in context* link.
- The player's pick is outlined so they can see what they chose.
- A link to the person's page (`/people/<readable address>`, from [people-slugs.json](Jarvis/Projects/BibleProject/Website/src/data/people-slugs.json), falling back to `/people/<id>` as Wordle does).
- *Next* (or *See your score* after round ten). Focus moves to the result line when the reveal opens.

### 8.4 End (solo) and Finish (group)

Score or tally, band line, share button (solo), the recap list (each round: person, lie struck through, "The truth:" line, reference), *Play again*, *Back to games*.

### 8.5 Accessibility and look

- Built in the site's existing game style (see [games.css](Jarvis/Projects/BibleProject/Website/src/pages/games/games.css) and the sibling games), light and dark themes, no new fonts or images.
- Real buttons; keyboard A/B/C or 1/2/3 to pick, Enter to confirm, Space or Enter for *Next*. Result and team tallies in a polite live region.
- Group mode text at least 1.75rem for statements on wide screens; nothing depends on hover.
- Reduced-motion users get no card flip; the reveal simply appears.

---

## 9. Data and files (for step 12)

| File | What it is |
|---|---|
| `src/data/two-truths/statements.source.json` | The hand-kept source: the pool ids used, then every statement as in §4.1. Step 12 creates it from Appendix A (person ids are in Appendix A's headings). |
| `src/data/two-truths/blocklist.json` | Topics and number facts that may never be used (§4.4 items 2–3), each with a reason. |
| `src/data/two-truths/veto.json` | Statement ids removed after review, each with a reason. Starts empty. |
| `scripts/build-two-truths.ts` | Run with `node --experimental-strip-types`, as the Map quest and Who's older build scripts are. Reads the source, block list and veto, the pool, the people-slugs file and the Berean Standard Bible text; runs §5.4 layer 2; refuses to write on any fatal failure; writes the game file and the review sheet. |
| `src/data/two-truths/two-truths.json` | Generated. A `stamp` (hash of the content, for the translation copies), the people (id, label, tag, readable address) and the reviewed statements (no verse wording, verse ids only). Loaded by dynamic import, like Odd one out's sets. |
| `docs/features/two-truths/review-sheet.md` | Generated on every build (§5.4 layer 4). |
| `src/pages/games/two-truths/TwoTruthsGame.tsx` | The page (default export, no props). |
| `…/two-truths/deal.ts`, `game.ts`, `storage.ts`, `share.ts` | Pure dealing, the run's state (round, picks, score), device storage, share text. The share helper follows Who's older: reuse Map quest's generic share function, never edit it. |
| `…/two-truths/Round.tsx`, `Reveal.tsx`, `Screens.tsx`, `two-truths.css` | The screens of §8. |
| `…/two-truths/*.test.ts(x)` | §11. |
| [registry.ts](Jarvis/Projects/BibleProject/Website/src/pages/games/registry.ts) | Only the `two-truths` entry changes: `status: "live"` and its `load`. The shelf and drawing line stay as they are. |
| [README.md](Jarvis/Projects/BibleProject/Website/src/pages/games/README.md) (games) | A "Two truths and a lie" section like the siblings'. |
| `content/translation/extract.py` | One line added to `GAME_DATA` for `src/data/two-truths/two-truths.json` (`.people[].label`, `.people[].tag`, `.statements[].text`, `.statements[].truth`), as Who's older and Odd one out did, so translated sites can show translated statements. Until a translation exists the game shows English, and the "How it works" panel says so on a translated site. |

**Device storage.** `localStorage["bp-two-truths"]`: best score, games played, total score, last 300 statement ids seen, last 40 people, group team names. `sessionStorage["bp-two-truths-run"]`: the game in progress, saved **when a round is dealt** (so reloading cannot re-deal a hard round), with the data `stamp`; a saved game whose stamp no longer matches is dropped.

---

## 10. The follow-up generation job (after the owner's yes)

Not part of step 12. When the owner says yes (§13), one job does this, in order:
1. Write `make-items.ts`, the task prompt (Appendix B), the output schema and the import script; test them on fixtures.
2. Make the items for every pool person not yet playable.
3. BatchRunner pilot on 3 people (`--pilot 3`, Haiku), read the logged usage (the first call's input must be a few thousand tokens, proving no workspace context leaks in) and the statements.
4. Report the projected share of the plan to the owner; on their yes, the full run with the pilot's suggested `--budget-usd`, detached.
5. The blind verifier run (§5.4 layer 3), same procedure: pilot, then full.
6. Import, build, write the review sheet, and hand the sheet to the owner or a reviewing job. Statements go live only once reviewed.

---

## 11. Tests (for step 12)

- **Data** (`statements.test.ts`): every statement in the shipped file has refs that exist in [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/) and check words found in them, written independently of the build script; every lie has a correction and a swap; no lie's swapped-in word appears in its own verses; every person has at least 3 truths and 2 lies; the generated file matches its sources (the build's `--check` mode).
- **Dealing** (`deal.test.ts`): 3,000 seeded rounds: never a topic or clash pair, always two truths and one lie of the same person, lie position 30–37% each, no person twice in one game; preferences give way in the stated order on a tiny deck; Zacchaeus's clash is honoured.
- **Game state and storage:** scoring, the confirm step, a reload restoring the same round, a stale stamp dropping the saved game, storage that cannot be read or written (private mode) leaving the game playable.
- **Share text:** score and squares only; contains no statement text.
- **Page** (`TwoTruthsGame.test.tsx`): a full solo game with picks by click and keyboard; the reveal shows "Made up" and "The truth:" for the lie and verse links for all three; group mode with two teams awarding points; the hub lists the game as live (the hub's own tests count from the registry).
- Then the site's full `npm test` and build, as the build rules require.

---

## 12. Edge cases

| Case | What happens |
|---|---|
| A verse the reader's Bible does not number (some translations merge or split verses) | The reveal shows the reference with the site's usual short note, as other pages do; the Berean Standard Bible check at build time still guarantees the statement is right. |
| Translated site | Statements in English until the translation copy matches the data stamp; verses in the language's Bible. Names in statements follow the translator's Bible forms. |
| Two truths that are each fine but together give the lie away | Prevented by `topic` and `clash` (§7); the review sheet lists each person's possible rounds count so a reader can spot a pair the keys missed and add a clash. |
| A statement true of a namesake | Blocked by the verifier's namesake question and the review; labels always qualify namesakes. |
| A statement the reviewer doubts after launch | Add its id to `veto.json` and rebuild; it disappears, and a saved game containing it is dropped because the stamp changes. |
| The deck runs short in a long group session | Preferences give way (§7); when every person has been used, the game says "That's every person in the deck" and offers the finish screen. |
| A person with exactly 3 truths and 2 lies loses one to a veto | They drop out of play until a new statement is added; the build lists them as "not playable". |
| Mis-tap on a phone | Solo asks to confirm before scoring (§8.2). |
| Reload mid-round | Same round, same order; the pick, if confirmed, stands. |
| Private browsing / storage blocked | The game plays; nothing is remembered; no error is shown beyond the console. |
| Very long label or statement on a narrow phone (320px) | Statements wrap; buttons grow in height; nothing is cut off. Checked in the page test at 320px width. |
| Someone plays the same game every day | With 30 people they will see repeats within a week; the "recent" lists keep the same lie from coming back soon. The generation run is what fixes this for good. |

---

## 13. Cost

- **Playing the game:** nothing. Static JSON, no server, no model.
- **Step 12 (building the game on the starter deck):** nothing beyond the build job itself; no model calls.
- **The generation run (§10), only with the owner's yes:**

```
COST/DEPENDENCY GATE:
- Action: one-time generation of statements for up to 130 more people, then a blind check of each statement, through BatchRunner on the Max plan
- Cost: estimated about 130 generation calls of ~5,000 tokens in and ~1,500 out, plus 130 check calls of ~3,000 in and ~500 out: about 1.4 million tokens in total. For scale, the Bible chapter-summary run read about 994 million tokens and used about 23% of a week's plan, so this is of the order of a few hundredths of one percent. One-time; nothing recurs. The BatchRunner pilot measures the real figure before the full run, and the full run is capped with --budget-usd.
- Cloud dependency: only during the run (Anthropic, via the owner's existing plan). The game never calls anything; if the service vanished, the game would keep working.
- Local alternative: write more statements by hand, as Appendix A was, at no plan cost but a few hours of careful work per 30 people; or stay on the 30-person starter deck.
- Reversible: yes. Generated statements are ordinary rows in the source file and can be vetoed or removed; nothing locks the site to a vendor.

Proceed?
```

---

## 14. What is deliberately left out

- **A daily puzzle.** The spec asks for a simple guessing game; a daily mode can be added later with the same deck if the owner wants one.
- **Players writing their own statements.** Free text from players would need moderation and checking; out of scope.
- **A timer in solo play.** It would push players to guess instead of read.

---

## 15. Open points for the review step and the owner

1. **Jesus and God as subjects:** excluded by default (§3). The owner may prefer to include Jesus with truths only from the Gospels and lies limited to places and people around him (born in Nazareth instead of Bethlehem, for example). The default is buildable as written.
2. **The generation run:** needs the owner's yes under the cost gate (§13). Until then the game runs on the 30-person starter deck.
3. **Who reads the review sheet for generated statements:** the owner, or a reviewing job they name (§5.4 layer 4).

None of these blocks step 12.

---

## 16. Sources

- Roediger, H. L., and Marsh, E. J. (2005). The positive and negative consequences of multiple-choice testing. *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 31(5), 1155–1159.
- Butler, A. C., and Roediger, H. L. (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. *Memory & Cognition*, 36(3), 604–616.
- Butler, A. C., Karpicke, J. D., and Roediger, H. L. (2008). Correcting a metacognitive error: feedback increases retention of low-confidence correct responses. *JEP: LMC*, 34(4), 918–928.
- Hattie, J., and Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1), 81–112.
- Hasher, L., Goldstein, D., and Toppino, T. (1977). Frequency and the conference of referential validity. *Journal of Verbal Learning and Verbal Behavior*, 16(1), 107–112.
- Butterfield, B., and Metcalfe, J. (2001). Errors committed with high confidence are hypercorrected. *JEP: LMC*, 27(6), 1491–1494.
- Site data: STEP Bible's names data (TIPNR, CC BY 4.0) via [study_people.py](Jarvis/Projects/BibleProject/Website/scripts/bible/study_people.py); the people-pages; the question bank; the Berean Standard Bible text in [data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/).
- Sibling designs reused for conventions: [Who's older](Jarvis/Projects/BibleProject/Website/docs/features/whos-older/design.md) (pool, build script, saved-round rule, share helper) and [Odd one out](Jarvis/Projects/BibleProject/Website/docs/features/odd-one-out/design.md) (review sheet, veto file, optional model check through BatchRunner).

---

## Appendix A. Starter deck (30 people, 150 statements)

Every true statement and every correction below was checked by script against the site's Berean Standard Bible text ([data/plain/bsb/](Jarvis/Projects/BibleProject/Website/data/plain/bsb/)): the reference exists and the check words (in brackets) occur in it. Each lie was then read against its verse to confirm the verse contradicts it, not merely leaves it out, and its swapped-in words (in italics after the swap kind) were checked to be absent from that verse. Swap kinds are as in §4.3. Person ids are the Who's older pool ids.

**For step 12:** turn each row into a statement of §4.1. Give every statement of a person its own `topic` (no two statements of one person in this deck share a topic), and copy the one `clash` (Zacchaeus). Check words go into `check` as written; references become verse-id ranges.

### Noah (`noah-gen-5-29`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Noah was 600 years old when the floodwaters came on the earth. | Genesis 7:6 [600 years old] |
| True | Noah sent out a raven before he sent out a dove. | Genesis 8:7–8 [raven] |
| True | After the flood, Noah planted a vineyard. | Genesis 9:20 [vineyard] |
| Made up (number: *four sons*) | ~~Noah had four sons who went into the ark with him.~~ **The truth:** Noah had three sons: Shem, Ham and Japheth. | Genesis 6:10 [three sons] |
| Made up (place: *Sinai*) | ~~The ark came to rest on Mount Sinai.~~ **The truth:** The ark came to rest on the mountains of Ararat. | Genesis 8:4 [Ararat] |

### Abraham (`abraham-gen-11-26`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Abraham was a hundred years old when his son Isaac was born. | Genesis 21:5 [hundred years old] |
| True | Abraham's family set out from Ur of the Chaldeans. | Genesis 11:31 [Ur of the Chaldeans] |
| True | Abraham bought a cave at Machpelah to bury Sarah. | Genesis 23:19 [Machpelah] |
| Made up (person: *his wife Sarah*) | ~~Abraham's son Ishmael was born to his wife Sarah.~~ **The truth:** Ishmael's mother was Hagar, Sarah's Egyptian servant. | Genesis 16:15 [Hagar] |
| Made up (number: *50*) | ~~Abraham was 50 years old when he left Haran.~~ **The truth:** Abram was seventy-five years old when he left Haran. | Genesis 12:4 [seventy-five years old] |

### Sarah (`sarah-gen-11-29`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Sarah laughed when she heard she would have a son. | Genesis 18:12 [laughed] |
| True | Sarah lived to be 127 years old. | Genesis 23:1 [127] |
| True | Sarah's name was first Sarai. | Genesis 17:15 [Sarai] |
| Made up (place: *Bethlehem*) | ~~Sarah was buried near Bethlehem.~~ **The truth:** Sarah was buried in the cave of Machpelah, near Mamre at Hebron. | Genesis 23:19 [Machpelah] |
| Made up (number: *60*) | ~~Sarah was 60 years old when God promised her a son.~~ **The truth:** Sarah was ninety when God promised her a son. | Genesis 17:17 [ninety] |

### Jacob (`israel-gen-25-26`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Jacob worked seven years for Laban to marry Rachel. | Genesis 29:20 [seven years] |
| True | Jacob dreamed of a ladder reaching up to heaven. | Genesis 28:12 [ladder] |
| True | Jacob was renamed Israel after he wrestled through the night. | Genesis 32:28 [Israel] |
| Made up (order: *born first*) | ~~Jacob was born first, just before his twin brother Esau.~~ **The truth:** Esau was born first; Jacob came out grasping his heel. | Genesis 25:25–26 [heel] |
| Made up (person: *Leah more than Rachel*) | ~~Jacob loved his wife Leah more than Rachel.~~ **The truth:** Jacob loved Rachel more than Leah. | Genesis 29:30 [loved Rachel more than Leah] |

### Joseph of Egypt (`joseph-gen-30-24`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Joseph's brothers sold him for twenty shekels of silver. | Genesis 37:28 [twenty shekels] |
| True | Joseph was thirty years old when he entered Pharaoh's service. | Genesis 41:46 [thirty years old] |
| True | In prison, Joseph explained the dreams of a cupbearer and a baker. | Genesis 40:5–8 [cupbearer] |
| Made up (order: *firstborn of Jacob*) | ~~Joseph was the firstborn of Jacob's twelve sons.~~ **The truth:** Reuben was Jacob's firstborn son. | Genesis 49:3 [firstborn] |
| Made up (place: *Babylon*) | ~~Joseph was sold to traders heading for Babylon.~~ **The truth:** Joseph was taken down to Egypt and sold to Potiphar. | Genesis 39:1 [Potiphar] |

### Moses (`moses-exo-2-10`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Moses was eighty years old when he spoke to Pharaoh. | Exodus 7:7 [eighty years old] |
| True | Moses' father-in-law Jethro was a priest of Midian. | Exodus 3:1 [priest of Midian] |
| True | Moses was a hundred and twenty years old when he died. | Deuteronomy 34:7 [hundred and twenty years old] |
| Made up (place: *Jordan River*) | ~~As a baby, Moses was hidden in a basket by the Jordan River.~~ **The truth:** Moses' basket was placed among the reeds along the Nile. | Exodus 2:3 [Nile] |
| Made up (outcome: *across the Jordan*) | ~~Moses led Israel across the Jordan into the promised land.~~ **The truth:** Moses saw the land from the mountain, but God told him he would not cross into it. | Deuteronomy 34:4 [not cross] |

### Aaron (`aaron-exo-4-14`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Aaron was three years older than his brother Moses. | Exodus 7:7 [eighty-three] |
| True | Aaron's staff sprouted, blossomed and produced almonds. | Numbers 17:8 [almonds] |
| True | Aaron made a golden calf while Moses was on the mountain. | Exodus 32:4 [calf] |
| Made up (group: *Judah*) | ~~Aaron was from the tribe of Judah.~~ **The truth:** Aaron was a Levite. | Exodus 4:14 [Levite] |
| Made up (place: *Sinai*) | ~~Aaron died on Mount Sinai.~~ **The truth:** Aaron died on the top of Mount Hor. | Numbers 20:27–28 [Hor] |

### Miriam (`miriam-exo-15-20`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Miriam was called a prophetess. | Exodus 15:20 [prophetess] |
| True | Miriam took a tambourine and led the women in dancing after the sea crossing. | Exodus 15:20 [tambourine] |
| True | Miriam and Aaron spoke against Moses because of his Cushite wife. | Numbers 12:1 [Cushite] |
| Made up (person: *aunt*) | ~~Miriam was Moses' aunt.~~ **The truth:** Miriam was Aaron's sister. | Exodus 15:20 [sister] |
| Made up (place: *Egypt*) | ~~Miriam died in Egypt before the Exodus.~~ **The truth:** Miriam died and was buried at Kadesh, in the wilderness. | Numbers 20:1 [Kadesh] |

### Joshua (`joshua-exo-17-9`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Joshua was one of the twelve men sent to spy out Canaan. | Numbers 13:2–16 [Joshua] |
| True | The wall of Jericho collapsed when the people shouted. | Joshua 6:20 [shout] |
| True | Joshua died at the age of 110. | Joshua 24:29 [110] |
| Made up (group: *Levi*) | ~~Joshua was from the tribe of Levi.~~ **The truth:** Joshua son of Nun, then called Hoshea, was from the tribe of Ephraim. | Numbers 13:8 [Ephraim] |
| Made up (number: *forty days*) | ~~Israel marched around Jericho for forty days.~~ **The truth:** On the seventh day they marched around Jericho seven times. | Joshua 6:15 [seventh day] |

### Rahab (`rahab-jos-2-1`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Rahab hid two Israelite spies on her roof. | Joshua 2:6 [roof] |
| True | Rahab let the spies down from her window by a rope. | Joshua 2:15 [rope] |
| True | Rahab is named in Matthew's family line of Jesus. | Matthew 1:5 [Rahab] |
| Made up (place: *Ai*) | ~~Rahab lived in the city of Ai.~~ **The truth:** Rahab lived in Jericho. | Joshua 2:1 [Jericho] |
| Made up (object: *blue cloth*) | ~~Rahab hung a blue cloth from her window as a sign.~~ **The truth:** Rahab tied a scarlet cord in her window. | Joshua 2:21 [scarlet cord] |

### Deborah (`deborah-jdg-4-4`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Deborah held court under a palm tree. | Judges 4:5 [palm] |
| True | Deborah was a prophetess who judged Israel. | Judges 4:4 [prophetess] |
| True | Deborah and Barak sang a song of victory. | Judges 5:1 [sang] |
| Made up (person: *herself*) | ~~Deborah killed the enemy commander Sisera herself.~~ **The truth:** Jael, the wife of Heber, killed Sisera with a tent peg. | Judges 4:21 [tent peg] |
| Made up (person: *Gideon*) | ~~Deborah's army commander was Gideon.~~ **The truth:** Deborah summoned Barak son of Abinoam to lead the army. | Judges 4:6 [Barak] |

### Gideon (`gideon-jdg-6-11`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Gideon tested God with a fleece of wool. | Judges 6:37 [fleece] |
| True | Gideon's army was cut down to three hundred men. | Judges 7:7 [three hundred] |
| True | Gideon was threshing wheat in a winepress when the angel came. | Judges 6:11 [winepress] |
| Made up (group: *Judah*) | ~~Gideon was from the tribe of Judah.~~ **The truth:** Gideon said his clan was the weakest in Manasseh. | Judges 6:15 [Manasseh] |
| Made up (outcome: *agreed*) | ~~Gideon agreed to become Israel's king.~~ **The truth:** Gideon refused: he would not rule over Israel, for the LORD would rule. | Judges 8:23 [will not rule] |

### Samson (`samson-jdg-13-24`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Samson tore apart a young lion with his bare hands. | Judges 14:6 [lion] |
| True | Samson struck down a thousand men with a donkey's jawbone. | Judges 15:15 [jawbone] |
| True | Samson tied torches to the tails of foxes. | Judges 15:4 [foxes] |
| Made up (group: *Egyptians*) | ~~Delilah handed Samson over to the Egyptians.~~ **The truth:** Delilah handed Samson over to the Philistines. | Judges 16:18–21 [Philistines] |
| Made up (group: *Benjamin*) | ~~Samson's family was from the tribe of Benjamin.~~ **The truth:** Samson's father Manoah was from the tribe of Dan. | Judges 13:2 [Danites] |

### Ruth (`ruth-rut-1-4`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Ruth came from the land of Moab. | Ruth 1:4 [Moab] |
| True | Ruth gathered grain in the field of Boaz. | Ruth 2:3 [Boaz] |
| True | Ruth was the great-grandmother of King David. | Ruth 4:17 [David] |
| Made up (person: *Rachel*) | ~~Ruth's mother-in-law was named Rachel.~~ **The truth:** Ruth's mother-in-law was Naomi. | Ruth 1:22 [Naomi] |
| Made up (outcome: *went back to Moab*) | ~~Ruth went back to Moab after her husband died.~~ **The truth:** Ruth refused to leave Naomi: "Wherever you go, I will go." | Ruth 1:16 [wherever you go] |

### Hannah (`hannah-1sa-1-2`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Hannah prayed for a son at the house of the LORD in Shiloh. | 1 Samuel 1:9–11 [Shiloh] |
| True | Hannah brought her son Samuel to Eli the priest. | 1 Samuel 1:25 [Eli] |
| True | Each year Hannah made Samuel a little robe. | 1 Samuel 2:19 [robe] |
| Made up (person: *Jesse*) | ~~Hannah's husband was named Jesse.~~ **The truth:** Hannah's husband was Elkanah. | 1 Samuel 1:8 [Elkanah] |
| Made up (number: *no more children*) | ~~Hannah had no more children after Samuel.~~ **The truth:** Hannah later had three more sons and two daughters. | 1 Samuel 2:21 [three sons and two daughters] |

### Samuel (`samuel-1sa-1-20`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | As a boy, Samuel heard the LORD call his name in the night. | 1 Samuel 3:10 [Samuel] |
| True | Samuel anointed Saul with a flask of oil. | 1 Samuel 10:1 [anointed] |
| True | Samuel anointed David, the youngest of Jesse's sons. | 1 Samuel 16:11–13 [youngest] |
| Made up (person: *Zadok*) | ~~Samuel grew up serving the priest Zadok.~~ **The truth:** Samuel grew up serving the LORD under Eli the priest. | 1 Samuel 3:1 [Eli] |
| Made up (outcome: *honest*) | ~~Samuel's sons followed his ways as honest judges.~~ **The truth:** Samuel's sons did not walk in his ways; they took bribes. | 1 Samuel 8:3 [bribes] |

### David (`david-rut-4-17`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | David was the youngest son of Jesse. | 1 Samuel 17:14 [youngest] |
| True | David played the harp to soothe King Saul. | 1 Samuel 16:23 [harp] |
| True | David was thirty years old when he became king. | 2 Samuel 5:4 [thirty years old] |
| Made up (number: *seven stones*) | ~~David picked seven stones for his sling before facing Goliath.~~ **The truth:** David chose five smooth stones from the stream. | 1 Samuel 17:40 [five smooth stones] |
| Made up (person: *son of Samuel*) | ~~David's friend Jonathan was a son of Samuel.~~ **The truth:** Jonathan was the son of King Saul. | 1 Samuel 14:1 [son of Saul] |

### Solomon (`solomon-2sa-5-14`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Solomon asked God for a discerning heart to govern the people. | 1 Kings 3:9 [discern] |
| True | Solomon built the temple of the LORD in Jerusalem. | 1 Kings 6:14 [temple] |
| True | The queen of Sheba came to test Solomon with hard questions. | 1 Kings 10:1 [Sheba] |
| Made up (person: *Michal*) | ~~Solomon's mother was Michal.~~ **The truth:** Solomon's mother was Bathsheba. | 2 Samuel 12:24 [Bathsheba] |
| Made up (number: *twenty years*) | ~~Solomon reigned over Israel for twenty years.~~ **The truth:** Solomon reigned in Jerusalem over all Israel for forty years. | 1 Kings 11:42 [forty years] |

### Elijah (`elijah-1ki-17-1`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Ravens brought Elijah bread and meat by a brook. | 1 Kings 17:6 [ravens] |
| True | Elijah faced the prophets of Baal on Mount Carmel. | 1 Kings 18:19–20 [Carmel] |
| True | Elijah went up to heaven in a whirlwind. | 2 Kings 2:11 [whirlwind] |
| Made up (person: *Gehazi*) | ~~Elijah chose Gehazi to be the prophet after him.~~ **The truth:** God told Elijah to anoint Elisha son of Shaphat to succeed him. | 1 Kings 19:16 [Shaphat] |
| Made up (place: *Egypt*) | ~~Elijah fled from Queen Jezebel to Egypt.~~ **The truth:** Elijah fled to Beersheba and on to Horeb, the mountain of God. | 1 Kings 19:3–8 [Beersheba] |

### Elisha (`elisha-1ki-19-16`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Elisha asked Elijah for a double portion of his spirit. | 2 Kings 2:9 [double portion] |
| True | Elisha made an iron axe head float. | 2 Kings 6:5–6 [float] |
| True | Elisha told Naaman to wash seven times in the Jordan. | 2 Kings 5:10 [seven times] |
| Made up (person: *chariot of fire*) | ~~Elisha was taken up to heaven in a chariot of fire.~~ **The truth:** Elisha died and was buried; it was Elijah who went up in the whirlwind. | 2 Kings 13:20 [Elisha died] |
| Made up (object: *fishing nets*) | ~~Elisha was mending fishing nets when Elijah called him.~~ **The truth:** Elisha was plowing with twelve pairs of oxen when Elijah called him. | 1 Kings 19:19 [oxen] |

### Jonah (`jonah-2ki-14-25`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Jonah boarded a ship bound for Tarshish. | Jonah 1:3 [Tarshish] |
| True | Jonah was inside the fish for three days and three nights. | Jonah 1:17 [three days] |
| True | God made a plant grow up to shade Jonah's head. | Jonah 4:6 [plant] |
| Made up (place: *Babylon*) | ~~God sent Jonah to preach to the city of Babylon.~~ **The truth:** God sent Jonah to the great city of Nineveh. | Jonah 1:2 [Nineveh] |
| Made up (outcome: *ignored*) | ~~The people of Nineveh ignored Jonah's warning.~~ **The truth:** The people of Nineveh believed God and proclaimed a fast. | Jonah 3:5 [fast] |

### Esther (`esther-est-2-7`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Esther was raised by her cousin Mordecai. | Esther 2:7 [Mordecai] |
| True | Esther became queen in place of Vashti. | Esther 2:17 [Vashti] |
| True | Esther asked the Jews in Susa to fast for three days. | Esther 4:16 [three days] |
| Made up (person: *Nebuchadnezzar*) | ~~Esther's husband was King Nebuchadnezzar.~~ **The truth:** Esther was taken to King Xerxes of Persia, who made her queen. | Esther 2:16–17 [Xerxes] |
| Made up (person: *Miriam*) | ~~Esther's Hebrew name was Miriam.~~ **The truth:** Esther's Hebrew name was Hadassah. | Esther 2:7 [Hadassah] |

### Daniel (`daniel-ezk-14-14`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Daniel asked to be given vegetables to eat instead of the king's food. | Daniel 1:12 [vegetables] |
| True | Daniel prayed three times a day with his windows open toward Jerusalem. | Daniel 6:10 [three times a day] |
| True | Daniel read the writing on the wall for King Belshazzar. | Daniel 5:25–28 [MENE] |
| Made up (person: *Nebuchadnezzar*) | ~~King Nebuchadnezzar had Daniel thrown into the lions' den.~~ **The truth:** It was King Darius who had Daniel thrown into the lions' den. | Daniel 6:9–16 [Darius] |
| Made up (place: *Assyria*) | ~~Daniel was taken away to Assyria as a young man.~~ **The truth:** Daniel was among the young men taken to Babylon by Nebuchadnezzar. | Daniel 1:1–6 [Babylon] |

### Nehemiah (`nehemiah-neh-1-1`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Nehemiah was cupbearer to the king of Persia. | Nehemiah 1:11 [cupbearer] |
| True | Nehemiah's builders worked with a weapon in one hand. | Nehemiah 4:17 [weapon] |
| True | Jerusalem's wall was finished in fifty-two days. | Nehemiah 6:15 [fifty-two days] |
| Made up (person: *Nebuchadnezzar*) | ~~Nehemiah served King Nebuchadnezzar.~~ **The truth:** Nehemiah served King Artaxerxes. | Nehemiah 2:1 [Artaxerxes] |
| Made up (person: *the priest who read*) | ~~Nehemiah was the priest who read the Law aloud to the people.~~ **The truth:** Ezra the priest read the Law to the people; Nehemiah was the governor. | Nehemiah 8:2 [Ezra the priest] |

### Mary (mother of Jesus) (`mary-mat-1-16`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | The angel Gabriel told Mary she would have a son. | Luke 1:26–31 [Gabriel] |
| True | Mary went to visit her relative Elizabeth. | Luke 1:39–40 [Elizabeth] |
| True | Mary stood near the cross when Jesus was crucified. | John 19:25 [His mother] |
| Made up (place: *Bethlehem*) | ~~Mary was living in Bethlehem when the angel came to her.~~ **The truth:** Gabriel was sent to Mary in Nazareth, a town in Galilee. | Luke 1:26–27 [Nazareth] |
| Made up (person: *Zechariah*) | ~~Mary was engaged to a man named Zechariah.~~ **The truth:** Mary was pledged in marriage to Joseph, of the house of David. | Luke 1:27 [Joseph] |

### John the Baptist (`john-mat-3-1`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | John the Baptist ate locusts and wild honey. | Matthew 3:4 [locusts] |
| True | John's father Zechariah was a priest. | Luke 1:5 [priest] |
| True | John the Baptist was beheaded on Herod's orders. | Matthew 14:10 [beheaded] |
| Made up (object: *linen*) | ~~John the Baptist wore fine robes of linen.~~ **The truth:** John wore clothing of camel's hair with a leather belt. | Matthew 3:4 [camel's hair] |
| Made up (place: *Sea of Galilee*) | ~~John baptized people in the Sea of Galilee.~~ **The truth:** John baptized people in the Jordan River. | Matthew 3:6 [Jordan] |

### Peter (`peter-mat-4-18`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Peter walked on the water toward Jesus. | Matthew 14:29 [walked on the water] |
| True | Peter denied knowing Jesus three times. | Matthew 26:75 [three times] |
| True | Peter's brother was Andrew. | Matthew 4:18 [Andrew] |
| Made up (object: *tax collector*) | ~~Peter was a tax collector before he followed Jesus.~~ **The truth:** Peter was a fisherman, casting a net into the sea. | Matthew 4:18 [fishermen] |
| Made up (person: *Matthew*) | ~~Peter's name before he met Jesus was Matthew.~~ **The truth:** Peter's name was Simon; Jesus named him Peter. | Matthew 10:2 [Simon] |

### Zacchaeus (`zacchaeus-luk-19-2`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Zacchaeus climbed a sycamore tree to see Jesus. | Luke 19:4 [sycamore] |
| True | Zacchaeus was a chief tax collector in Jericho. | Luke 19:1–2 [chief tax collector] |
| True | Zacchaeus promised to give half his possessions to the poor. | Luke 19:8 [half] |
| Made up (outcome: *tall*) | ~~Zacchaeus was so tall he could see over the crowd.~~ **The truth:** Zacchaeus was small in stature and could not see over the crowd. | Luke 19:3 [small] |
| Made up (number: *twice*) | ~~Zacchaeus promised to pay back twice what he had cheated.~~ **The truth:** Zacchaeus promised to repay anyone he had cheated fourfold. Never dealt with true statement 3. | Luke 19:8 [fourfold] |

### Paul (`paul-act-7-58`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Paul was born in Tarsus. | Acts 22:3 [Tarsus] |
| True | Paul was blinded by a light on the road to Damascus. | Acts 9:3–9 [Damascus] |
| True | Paul was shipwrecked on the island of Malta. | Acts 28:1 [Malta] |
| Made up (object: *fisherman*) | ~~Paul was a fisherman before he met Jesus.~~ **The truth:** Paul was a tentmaker by trade. | Acts 18:3 [tentmakers] |
| Made up (group: *Judah*) | ~~Paul was from the tribe of Judah.~~ **The truth:** Paul was from the tribe of Benjamin. | Philippians 3:5 [Benjamin] |

### Lydia (`lydia-act-16-14`)

| Kind | Statement | Verse [check words] |
|---|---|---|
| True | Lydia was a dealer in purple cloth. | Acts 16:14 [purple] |
| True | Lydia came from the city of Thyatira. | Acts 16:14 [Thyatira] |
| True | Lydia met Paul at a place of prayer by a river. | Acts 16:13 [river] |
| Made up (place: *Corinth*) | ~~Lydia met Paul in Corinth.~~ **The truth:** Paul met Lydia at Philippi. | Acts 16:12–14 [Philippi] |
| Made up (outcome: *refused*) | ~~Lydia refused to be baptized.~~ **The truth:** Lydia and her household were baptized. | Acts 16:15 [baptized] |

---

## Appendix B. The generation task prompt (for the follow-up job)

```
You write statements for a Bible game, "Two truths and a lie", about ONE person named in the item.
Use ONLY the leads and verses in the item. Never cite a verse that is not in the item.

TRUTHS (up to 6): each one fact, stated by the cited verses, 20-110 characters, one sentence, in plain
modern English, using the verse's own key word for the thing or number it turns on. Prefer facts that
are surprising but true. Not about God's or Christ's nature or any doctrine.

LIES (up to 4): each one sentence that a half-remembering reader could believe, made by swapping ONE
detail of a fact in the leads for a detail from the same story world (a related person, a nearby place,
a near number, a similar object, another tribe or nation, the reverse order, the opposite outcome).
A lie must be CONTRADICTED by a cited verse: give the corrected sentence in "truth", the verse in "refs",
and in "swapIn" the exact words of the lie that carry the made-up detail. Never: a fact true of another person with the same name; a number the manuscripts disagree on;
popular myths (apple, whale, three wise men); a new sin or crime the Bible does not record; doctrine;
a plain negation; the words only/never/always/first/not unless the verse turns on them.
Lies and truths must read alike in length and tone.

"check": copy 1-4 consecutive words from the cited verses exactly as written.
"topic": a short key; never give two statements the same topic.
Return JSON matching the schema. If the leads cannot support 3 truths and 2 lies, return what you can.
```

The two worked examples given with it are Appendix A's Moses and Ruth entries, in the output schema's form.
