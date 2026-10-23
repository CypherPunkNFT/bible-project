# Question Bank — the site's official Bible questions

[question-bank.json](question-bank.json) is the one list of **production-ready** questions the site draws on: the
questions page (`/study/questions`), and later the home page's "How well do you know the Bible?" section and any quiz.

**6,511 questions** (built 2026-10-23, the new questions below included): 3,287 Bible quiz, 902 Sunday school lesson
and 2,322 catechism questions. **4,667 are shown**; the rest are repeats or hidden. Roman Catholic and Seventh-day Adventist books are
left out as outside the site's doctrinal scope (owner, 2026-10-22); they stay in the corpus to mine for content later.

## What "production-ready" means here

Taken from the quiz corpus at [Research/BibleQuizCorpus/](../../../Research/BibleQuizCorpus/MANIFEST.md) only when
the question is:

- **typed text**, not machine-read off a page scan;
- **answered**, with the answer its source printed;
- **publishable** under the owner's rule of 2026-10-17;
- from a bank someone has looked at and listed in `BANKS` in
  [build-question-bank.py](../../scripts/build-question-bank.py). A new bank in the corpus stops the build until it is
  listed there or in `LEFT_OUT`.

The same question and answer in two banks is kept once (choices first, then a reference, then the original over a
copy), with the other banks named in `also_in`. Everything left out, and why, is in the file's `left_out` list.

Every shown question has been **checked against the BSB** and **grounded** (see the two sections below), and
[question-table.csv](question-table.csv) holds all of it as one table. `standalone: false` marks a question that leans
on the one before it ("What were their names?"); it is a best guess from the wording.

## Repeats: kept, never shown

The same question asked twice in different words is a **repeat**. Repeats are not deleted; the site just never shows
them (owner, 2026-10-22). [question_repeats.py](../../scripts/question_repeats.py) finds them. Every question is
embedded with its answer on the local embedding model ($0), and pairs scoring 0.75 or higher become candidates. The
same question text with near-identical answers counts as a repeat outright. Claude Haiku judges every other candidate:
two questions are a repeat only when their answers could swap, so a question asked the other way round ("Who refused to
bow?" / "What did the three friends refuse to do?") is not one. Every decision is kept in [repeats.json](repeats.json),
so no pair is asked about twice.

As of 22 October 2026, **1,245 questions are marked `repeat_of`**, and the page's copy holds **3,717**. Of each group,
the one shown has answer choices first, then comes from a Baptist collection, then carries a reference. How often a
judged pair turned out to be a repeat, by score: 86% from 0.90 up, 67% at 0.85–0.90, 20% at 0.80–0.85, 11% at
0.75–0.80, and 7% in a 99-pair sample at 0.70–0.75. So a few repeats are left below 0.75: about 3,400 pairs at
0.70–0.75 have not been judged.

## Each record

`id`, `source_id`, `attribution_source_id`, `question`, `answer`, `options` (the choices, or `null`), `reference`,
`books` (book codes from the reference, then any book named outright), `testament` (`OT`, `NT` or `null`), `topic`
(one of 16, see `topics`), `link` (the first reference as the reader opens it), `kind` (`trivia`, `lesson`, `catechism`), `tradition` (Baptist, Reformed, Lutheran, Puritan, Methodist, or `null`
for trivia), `collection`, `lesson`, `standalone`,
`question_origin`, `licence`, `licence_class`, `attribution` (the credit owed), `source_url`, `also_in`, `repeat_of`
(the id of the question shown in its place, or `null`), `passages` (each `book`, `chapter`, `verse`, `verse_end` and
`check`), `people`, `places`, `subjects` (plain topics such as "the flood" or "kings of israel"), `answer_choice` (the option that is
right, or `null` without options), `options_by` (`source`, `claude-haiku`, `true/false`, or `null`; with ", audited by
…" added when the audit replaced wrong choices), `hidden` (why the audit hid it, or `null`), `audit` (`verdict`, the
fault `kinds`, `why` and `by`, or `null` if not audited), `grounding` (`basis`, `strength`, `outside`, `verses`,
`note`, `doubt`, `by`, or `null` if not grounded).

**Tags are rules, not reading.** `books`, `testament` and `topic` come from fixed word lists and the references in
[question_tags.py](../../scripts/question_tags.py): a word in the question counts three times, one in the answer once,
the referenced book three times. 4,839 of 4,962 questions get a topic and 2,303 a book; a question can sit under a near
topic, and nobody has checked them by hand.

**Passages, people, places and subjects are read by a model, and every passage is checked.** Claude Haiku reads each
shown question ([question_model_tags.py](../../scripts/question_model_tags.py), kept in [model-tags.json](model-tags.json)).
A script then checks every passage it names against the BSB text: a book, chapter or verse that does not exist is
dropped. A passage whose text, give or take two verses, holds a telling word of the answer has `check: "matched"`;
otherwise it is `"exists"`, usually the right place worded differently ("covenant" for the promise to Abram). As of 22
October 2026, all 3,717 shown questions are tagged: 3,049 have a passage (3,746 passages: 3,069 matched, 677 exists;
39 named verses that do not exist were dropped), 2,356 name people and 1,107 places.

## Multiple choice for written answers

Every shown question with a written answer, unless it leans on the question before it, has four choices (owner, 22
October 2026). [question_choices.py](../../scripts/question_choices.py) keeps them in [choices.json](choices.json),
never in the sources. A true-or-false answer gets "True" and "False" by rule (27). For the rest (2,050), Claude Haiku
wrote three wrong choices. The right choice is the printed answer when it is 12 words or fewer. A longer answer, mostly
catechism, is shown as Haiku's short version, and the page shows the full printed answer once the right choice is
revealed. Every set is checked: three distinct wrong choices, none matching the right one, and no "all of the above".

A right choice that is plainly the longest gives itself away. After the first run it was over 15% longer than every
wrong choice in 304 of the 610 catechism questions (50%). Those were asked again with the right choice fixed. Now it is 21% for
catechism, 27% for Bible quiz and 15% for lesson questions, against 21% in the sources' own multiple choice.

**Two-part questions.** The 409 that lean on the question before them ("What was the name of this boy?") were sent
with the two questions before them in their book. Haiku wrote choices that fit, and said whether the question needs
its first part: 211 keep `lead_in` (the question just before, with its printed answer), which the page shows above
the question as "First"; 195 read clearly on their own and are marked standalone. The catechism sets were rebalanced
for length the same way (19% "clearly longest" across all catechism).

Every question the site shows is now multiple choice. One model set held a second right answer (Malta beside Melita,
the same island) and was corrected by hand; others like it may remain.

## Checked against the BSB

The owner found "What is the 'root of all evil'?" (1 Timothy 6:10), with "Desire for riches" and "Pursuit of wealth"
as wrong choices. The BSB says "the root of all kinds of evil", and those two choices mean the same as the right
answer. So [question_audit.py](../../scripts/question_audit.py) checks questions one at a time against the BSB text
of the passages they cite (and the passages in model-tags.json), and Claude Sonnet decides for each:

- **keep**: no fault;
- **fix**: change only what is wrong:
  - reword a question or answer that misquotes or overstates the Bible;
  - replace King James or other translations' wording with the BSB's, in the question, answer and choices (owner,
    22 October 2026: "we're using BSB for all");
  - correct a wrong answer;
  - replace a wrong choice that is also right;
  - add or correct the reference;
- **hide**: only as a last resort. The owner said: "we can improve them, fix them", not take them away. A question
  about tradition ("Who was crucified upside down?") becomes one the Bible answers ("In John 21:18-19, whose death
  did Jesus foretell?").

A reference in brackets at the end of a printed answer ("Titus (Tit 3:15 - Phm 1:1)") gave the right choice away; it
is moved into the reference by rule before the check. Every reply is checked before it is kept: three distinct wrong
choices, no filler, a reference that exists in the BSB, and a question that does not contain its own answer.

Every decision is in [audit.json](audit.json) by question id: the faults found, the question `before` and `after`,
why (in one plain sentence), the model, and the date. The build applies it after the choices. A record whose `before`
no longer matches the question (its source or choices changed) is skipped and reported as stale, never applied
blindly. A hidden question stays in the official bank with `hidden` set, and if it was the one shown for a group of
repeats, the best of the rest takes its place. Every phrase in quotation marks was then compared with the BSB text
by script, and four fixes were corrected by hand (`by` says so).

The Hugging Face collection (821 shown) was checked first, on 22 October 2026; every other collection followed on 23
October (owner's yes). As of 23 October 2026, all **4,847** questions that were shown are checked:
- **3,743 fixed, 1,102 kept, 2 hidden** (one about Hindu scripture; one no fair Bible question could be made from).
- Faults found (a question can have several): a wrong choice also right 2,003; King James or other wording 814; a
  misquote or overstatement 256; a wrong answer 246; a missing or wrong reference 2,670; other 1,252.
- A changed answer may run up to 15% past the length limit or its own length: long catechism answers whose King James
  quotations were replaced with the BSB's grow a little.
- [question_audit_quotes.py](../../scripts/question_audit_quotes.py) lists every quotation of three words or more that
  its passage does not hold word for word. Eight were corrected by hand (`by` says so: "consumed with sorrow" in
  Matthew 26:38, "naked I will return" in Job 1:21, ...). The 52 it still lists were read and are not quotations of
  a verse: nicknames ("the love chapter"), the catechisms' own words ("This is most certainly true"), a quotation
  split by "he said", fill-in-the-blank questions, and the doxology of the Lord's Prayer, which the BSB gives in a
  footnote.
- The repeat check was run again on the new wording: fixes that put several collections' questions into the BSB's
  words made 210 more of them repeats.

The page shows **4,667** questions.

## Where each answer comes from

Owner, 23 October 2026: "either there's a verse or there isn't". [question_grounding.py](../../scripts/question_grounding.py)
records, for every shown question, one of two bases, in [grounding.json](grounding.json):
- **scripture**: the verses that hold the answer, "stated" when a verse says it outright, "taught" when the verses
  teach it or it follows plainly from them (most catechism answers);
- **outside** the Bible: the kind of knowledge that answers it instead (the Bible as a book, church teaching,
  history, language and manuscripts, geography or nature, other), with a one-line note. "Which book comes after
  Ruth?" is the Bible as a book; "Which book did Jesus write?" too, noting that Scripture records none.

**The model never names a verse it has not read.** Each question goes to Claude Haiku with the BSB text of its own
reference, its tagged passages, and the eight verses closest in meaning to the question and its answer, found in a
local index of all 31,086 BSB verses (Qwen3-Embedding-4B on this PC, $0; `.local/question-grounding/`, rebuilt by
`index`). A verse it names that was not shown is refused by the script; one it says holds the answer but was not
among them ("missing") is sent again with that passage. Each record keeps which passages were shown and why, the
wording it judged (a later change makes the record stale), the model and the date.

As of 23 October 2026: **all 4,667 shown questions grounded**, the 44 written ones below included (all 44 scripture).
Of the first 4,629: 4,179 scripture (2,579 stated, 1,600 taught) and 450
outside (231 the Bible as a book, 162 church teaching, 29 history, 21 language and manuscripts, 7 other or nature).
- Claude Sonnet judged a random 100 again: the same basis in 97, and the three others were catechism answers on the
  line between "taught" and "church teaching".
- The model also says when the printed answer looks wrong by the verses ("doubt"). The 27 Bible quiz and lesson answers
  it doubted were audited again with the doubt attached (`question_audit.py prepare RUN --doubts`): 22 fixed (Jehu's
  father is Jehoshaphat, 2 Kings 9:2; Psalms are songs of praise and prayer, not "Wisdom"), 5 kept; the 7
  such doubts still recorded are on answers that check found right. The 87
  catechism doubts are kept as the catechisms' own teaching ("a soul that can never die" says more than the verses
  shown) and stay listed in the table.
- A question with no reference gets the verses read as its reference (243). In 65 the reference holds none of the
  verses read; read one by one, the reference is right and another verse also holds the answer.

## Checked again against the verses that hold the answer

The first check judged each question by the passages it cited. Grounding later found the verses that actually hold
each answer, and for about a third of the shown Scripture questions the check had not seen all of them, so their wrong
choices and quotations were never compared with those verses. [question_recheck.py](../../scripts/question_recheck.py)
sends each such question again, as the site shows it now, with those verses first (owner, 23 October 2026: "I do not
want any questions to be wrong"). A "keep" leaves the record as it was, an earlier fix included; a "fix" keeps the
source's wording as `before`, adds the new faults to the earlier ones, and gives both reasons. Each record gets
`rechecked` (model, date, verdict), shown in the explorer.

Finished 23 October 2026: 1,661 of the 1,668 chosen were checked again, **1,198 kept, 463 fixed**, for $30.80 at list
price. Of the first 444 fixes: 392 a missing or wrong reference, 38 King James or other wording, 17 a misquote, 16 a
wrong answer, 3 a wrong choice also right, 4 other. Seven replies were refused by the reply checks. Afterwards the
quotation check still lists 56, all read: the 52 above, and BSB words split by "he said" ("Go away from me, Lord," he
said, "for I am a sinful man").

## Questions written for the site

The owner, 23 October 2026: "we're gonna have to start creating our own questions and our own answers", through
several independent reviews, with parallel writers that never write the same questions.
[question_writing.py](../../scripts/question_writing.py) writes them one **BSB section** at a time: the BSB's own
headings ("The Creation", "Cain and Abel") divide the Bible into 3,016 sections. [writing-map.json](writing-map.json)
lists each one with its verses, its related sections, how many shown questions already land in it (1,396 have none),
and how many to write: one per 60 words of text, two to eight, less those already asked (8,028 in all).

**No overlap by construction.** One call owns one section, and every question must cite verses inside it, so two calls
never write from the same verses. Each call is shown the questions the site already asks about its section. Sections
the BSB links as related passages ("(Mark 1:1-8; Luke 3:1-18)") wait for each other in Bible order, five waves in all
(Matthew before Mark before Luke), and each writer is shown what was written for its linked sections. What still
repeats is caught by the repeat check over the whole bank, which hides a written question behind any bank question it
repeats.

**Every question passes five checks, or is rejected, never patched by hand:**
1. the script's own rules ([question_writing_gate.py](../../scripts/question_writing_gate.py)): the cited verses lie in
   the section; every name and number of the answer is in them exactly ("75" is not "seventy-five") and most of its
   other words; quotations word for word; four distinct choices, no "all of the above"; no King James wording; it
   names whom it is about; it does not hold its answer; the right choice is not plainly the longest;
2. a blind quiz with the section's text: another model must pick the writer's answer and call no other choice right
   by the section or anywhere in the Bible ([question_writing_review.py](../../scripts/question_writing_review.py));
3. a blind quiz with no text at all: the question must be clear on its own, and no other choice right anywhere in the
   Bible;
4. the site's own BSB check (the audit above), by a fresh model. A suggested fix sends the fixed wording through every
   check once more; a second fault rejects it;
5. after publishing, grounding as for every question: a written question it finds is not answered by Scripture, or
   whose answer it doubts, is hidden.
Passed questions go to [written.json](written.json) as the bank "Written for the site from the BSB", each with its
section, cited verses and the full review history; rejected ones are kept there too, with the stage and the reason.
Nothing reaches the bank until a run is published.

**The pilot, 23 October 2026** (`pilot-1`: 15 sections, ten in Genesis, the rest in Leviticus and Ezekiel). Claude
Sonnet wrote 54 questions; **44 passed every check** and are shown. The script's rules rejected 10: 8 because the right
choice was plainly the longest, 2 because the answer's words were not in the cited verses. The two blind quizzes (Claude
Haiku) failed none, and the BSB check sent one back with a fix, which then passed. All 44 were grounded in Scripture and
none is a repeat. The writing cost $0.31 at list price.

## Codex (ChatGPT) on the owner's subscription

Owner, 23 October 2026: can Codex run on a subscription too? **Yes, measured the same day** with 14 small calls:

- **Signed in with ChatGPT, not an API key.** Codex is the OpenAI extension in VS Code (`codex-cli 0.162`). The plan
  is ChatGPT Pro, with a weekly Codex allowance: 3% used at the time, resetting 29 October 2026 at 16:05. The account
  has no paid credits, so reaching the limit stops the work; it never buys more.
- **Runs headless,** one call at a time with no chat window (`codex exec`).
- **Minimal calls.** Codex always sends its own instructions and tools: 14,479 tokens for a one-word prompt. These
  options bring it to its floor:
  - `--ignore-user-config --ignore-rules --ephemeral -s read-only --skip-git-repo-check`;
  - every optional feature off (`--disable` each one `codex features list` shows on);
  - `-c model_instructions_file=TASK` replaces Codex's own instructions with the task, as BatchRunner's
    `--system-prompt` does;
  - `-c include_permissions_instructions=false -c include_environment_context=false -c include_apply_patch_tool=false
    -c web_search="disabled"`.
  The floor is about 4,500 tokens of Codex's own besides the task and item, against under 1,000 for Claude through
  BatchRunner; most of it is cached between calls.
- **Models:** GPT-6-Luna ("fast and affordable", like Haiku), GPT-6.1-Sol (the workhorse, like Sonnet), GPT-6-Astra
  (the frontier model). Set with `-m`, effort with `-c model_reasoning_effort=low|medium|high`.
- **The site's reply format works** (`--output-schema` with the writers' schema.json, `-o` for the reply).
- **Four calls at once** ran in 4 seconds.
- **The plan's usage can be read** after each saved call: its session log carries `rate_limits` (percent used, window,
  reset time), so a runner can stop before the limit.

**The real job, once.** Each model was given the writers' exact instructions and the pilot section "Rebekah Is
Chosen" (Genesis 24:15-61), and its reply went through the site's script checks (`.local/question-writing/codex-test/`,
`score.py`):
- GPT-6-Luna, 6 seconds: 4 of 4 passed. One has a wrong choice he also did later ("bowed down and worshiped"), which
  the blind quizzes are there to catch.
- GPT-6.1-Sol, 31 seconds: 3 of 4 passed and read well ("From which people had Abraham forbidden his servant to
  choose a wife for Isaac?" The Canaanites). The fourth was rightly refused: "She agreed to go" is not in the verse,
  which says "I will go".

**Why it matters here:** every reviewer of a written question so far is a Claude model checking another Claude
model. A GPT model taking the blind quizzes (checks 2 and 3 above) would be truly independent, and would run on the
ChatGPT plan instead of the Claude one.

**Next:** a runner for `codex exec` beside BatchRunner: one call per item with the options above, several at once,
resume after a stop, and a stop when the weekly allowance nears its limit.

## The table

[question-table.csv](question-table.csv) is written by every build: one row per question, shown, repeat or hidden,
with its wording, choices, reference, basis, verses, note, doubt, the audit's verdict, faults and reason, and which
model did each part. It opens in Excel.

## The question explorer (local only)

http://127.0.0.1:8931/data_questions/ (the third card on the local data hub, `/data/`) shows all 6,467 questions in
one table: filters with counts, sorting, and each question's before and after wording, faults, reason, verses, basis
note, doubt, models and source. **Simulate** shuffles whatever the filters leave and runs it as a quiz (keys 1–4,
Enter for next). Its data, `.local/question-explorer/questions.json`, is written by every build
([question_explorer.py](../../scripts/question_explorer.py)); it is never in `data/`, which is released with the site.
The page and its endpoint are [analysis-desk/questions.*](../../analysis-desk/) and
[data-questions-vite.ts](../../scripts/data-questions-vite.ts); none of it is deployed.

**[flags.json](flags.json) holds the questions the owner flagged while test-taking**, keyed by id, each with the note
and the wording as it was shown. A chat that fixes one fixes it at its source (audit, choices or the corpus), rebuilds,
and removes the flag (the page's "Remove flag" or by editing the file).

## New questions from sources that could not be used as they were

[question_mining.py](../../scripts/question_mining.py) makes three more sources usable with Claude Haiku (owner, 22
October 2026), kept in [mined.json](mined.json), each record saying how it was made:
- **BibleQA** has no licence. Only its questions not already on the site were sent. Haiku wrote a new question for
  each fact, so none of BibleQA's wording is used.
- **BibleData** (CC BY 4.0, credited) is a table of Bible facts. Name meanings and modern place names are left out, and
  so is any row about a person or place no question on the site names. Haiku kept the rows a church quiz would ask
  and worded them as questions.
- **Two Lutheran catechism books printed without answers** (Stump, 1910; Mezger, 1923; public domain). Haiku answered
  each question from the book's own lesson text, and reworded those that lean on the question before.

Every kept question has three wrong choices, re-asked where the right one was plainly the longest. A Bible fact's
passage must exist in the BSB and hold the answer's words. Questions that name their own answer were dropped. Then
every new question went through the repeat check. A new question that repeats one on the site is hidden behind it,
never the other way round, and a new question never joins two of the site's questions into one group.

As of 22 October 2026: 1,506 kept (693 Mezger, 400 Stump, 321 BibleData, 92 BibleQA) and 357 hidden as repeats, so
**1,148 new questions are shown**. The site shows 4,861 questions, all multiple choice.

## Rebuilding

From `Website/`: `python scripts/build-question-bank.py`. It writes this file and the page's copy,
`data/questions/bank.json` (not in git, like all of `data/`), so a release from a clean checkout must run it first.
Sources are registered in [SOURCES.md](../../SOURCES.md) under "Question Bank".
