# Checks — what every shown question has been through

Each check keeps its decisions here by question id, never in the sources, so a rebuild never asks a model twice about
the same question. Most records carry a fingerprint of the wording they judged: a question reworded later is judged
again, never given an old answer blindly. The bank build ([build-question-bank.py](../../../scripts/build-question-bank.py))
applies them in order: repeats, choices, the BSB check, grounding, the recheck, tags, difficulty, the link verse.

| File | Check | Script |
|---|---|---|
| [repeats.json](repeats.json) | the same question asked twice | [question_repeats.py](../../../scripts/question_repeats.py) |
| [choices.json](choices.json) | four choices for written answers | [question_choices.py](../../../scripts/question_choices.py) |
| [audit.json](audit.json) | checked against the BSB, and checked again | [question_audit.py](../../../scripts/question_audit.py), [question_recheck.py](../../../scripts/question_recheck.py) |
| [grounding.json](grounding.json) | where each answer comes from | [question_grounding.py](../../../scripts/question_grounding.py) |
| [model-tags.json](model-tags.json) | passages, people, places, subjects | [question_model_tags.py](../../../scripts/question_model_tags.py) |
| [difficulty.json](difficulty.json) | how hard each question is | [question_difficulty.py](../../../scripts/question_difficulty.py) |
| [link-verse.json](link-verse.json) | the verse "Read the verse" opens | [question_link_verse.py](../../../scripts/question_link_verse.py) |
| [flags.json](flags.json) | questions the owner flagged | the question explorer |

## Repeats: kept, never shown

The same question asked twice in different words is a **repeat**. Repeats are not deleted; the site just never shows
them (owner, 2026-10-22). Every question is embedded with its answer on the local embedding model ($0), and pairs
scoring 0.75 or higher become candidates. The same question text with near-identical answers counts as a repeat
outright. Claude Haiku judges every other candidate: two questions are a repeat only when their answers could swap, so
a question asked the other way round ("Who refused to bow?" / "What did the three friends refuse to do?") is not one.

Of each group, the one shown has answer choices first, then comes from a Baptist collection, then carries a reference.
A question written for the site or mined is hidden behind any bank question it repeats, never the other way round.
How often a judged pair turned out to be a repeat, by score (22 October 2026): 86% from 0.90 up, 67% at 0.85–0.90, 20%
at 0.80–0.85, 11% at 0.75–0.80, and 7% in a 99-pair sample at 0.70–0.75, so a few repeats are left below 0.75.

## Four choices for written answers

Every shown question with a written answer, unless it leans on the question before it, has four choices (owner, 22
October 2026). A true-or-false answer gets "True" and "False" by rule. For the rest, Claude Haiku wrote three wrong
choices. The right choice is the printed answer when it is 12 words or fewer; a longer answer, mostly catechism, is
shown as Haiku's short version, and the page shows the full printed answer once the right choice is revealed. Every set
is checked: three distinct wrong choices, none matching the right one, and no "all of the above".

A right choice that is plainly the longest gives itself away: sets where it was were asked again with the right choice
fixed (now 21% for catechism, 27% for Bible quiz, 15% for lessons, against 21% in the sources' own multiple choice).
The 409 questions that lean on the one before them were sent with the two questions before them in their book: 211
keep `lead_in` (shown above the question as "First"), 195 read clearly on their own and are marked standalone.

## Checked against the BSB

The owner found "What is the 'root of all evil'?" (1 Timothy 6:10), with "Desire for riches" and "Pursuit of wealth"
as wrong choices. The BSB says "the root of all kinds of evil", and those two choices mean the same as the right
answer. So every question is checked against the BSB text of the passages it cites, and a model decides:

- **keep**: no fault;
- **fix**: change only what is wrong: a misquote or overstatement, King James or other translations' wording (owner,
  22 October 2026: "we're using BSB for all"), a wrong answer, a wrong choice that is also right, a missing or wrong
  reference;
- **hide**: only as a last resort ("we can improve them, fix them"). A question about tradition ("Who was crucified
  upside down?") becomes one the Bible answers ("In John 21:18-19, whose death did Jesus foretell?").

Every reply is checked before it is kept: three distinct wrong choices, no filler, a reference that exists in the BSB,
and a question that does not contain its own answer. Each decision keeps the question `before` and `after`, the
faults, why (in one plain sentence), the model and the date; a record whose `before` no longer matches is reported as
stale. [question_audit_quotes.py](../../../scripts/question_audit_quotes.py) lists every quotation of three words or
more that its passage does not hold word for word; the 56 it still lists were all read and are not quotations of a
verse (nicknames like "the love chapter", the catechisms' own words, quotations split by "he said").

As of 23 October 2026: the 4,847 source questions then shown were checked by Claude Sonnet (3,743 fixed, 1,102 kept,
2 hidden); the 6,425 written questions were checked by Sonnet while writing and again by Claude Opus at high effort
(6,125 kept, 300 fixed, [../written/](../written/README.md)).

**Checked again against the verses that hold the answer.** Grounding later found the verses that actually hold each
answer, and for about a third of the shown Scripture questions the first check had not seen all of them.
[question_recheck.py](../../../scripts/question_recheck.py) sent each again with those verses first (owner: "I do not
want any questions to be wrong"): 1,661 checked, 1,198 kept, 463 fixed, $30.80. Each record gets `rechecked`.

## Where each answer comes from (grounding)

Owner, 23 October 2026: "either there's a verse or there isn't". Every shown question has one of two bases:
- **scripture**: the verses that hold the answer, "stated" when a verse says it outright, "taught" when the verses
  teach it or it follows plainly from them (most catechism answers);
- **outside** the Bible: the Bible as a book, church teaching, history, language and manuscripts, geography or nature,
  or other, with a one-line note. "Which book comes after Ruth?" is the Bible as a book.

**The model never names a verse it has not read.** Each question goes to Claude Haiku with the BSB text of its own
reference, its tagged passages, and the eight verses closest in meaning, from a local index of all 31,086 BSB verses
(Qwen3-Embedding-4B on this PC, $0; `.local/question-grounding/`). A verse it names that was not shown is refused.
The model also says when the printed answer looks wrong by the verses (`doubt`); Bible quiz doubts were audited again,
catechism doubts are kept as the catechisms' own teaching. A question with no reference gets the verses read as its
reference. As of 24 October 2026, **all 14,916 shown questions are grounded** (the 3,928 from the children's sources
by Claude Haiku that day, $2.55).

## Tags

**Rules, not reading:** `books`, `testament` and `topic` come from fixed word lists and the references in
[question_tags.py](../../../scripts/question_tags.py): a word in the question counts three times, one in the answer
once, the referenced book three times. Nobody has checked them by hand.

**Read by a model, and every passage checked:** Claude Haiku names each question's passages, people, places and
subjects ([model-tags.json](model-tags.json)). A script checks every passage against the BSB text: one that does not
exist is dropped; one whose text, give or take two verses, holds a telling word of the answer is `"matched"`, otherwise
`"exists"` (usually the right place worded differently). The site's themed tests are built from these tags.

## How hard each question is

Every shown question has two ratings, set by Claude Opus (owner, 23 October 2026):
- **`level`, for teens and adults:** `easy` (most churchgoers would know it), `medium` (a regular Bible reader would)
  or `hard` (it takes close knowledge of that passage). Plainly wrong choices make a question easier.
- **`children`:** true when a Sunday-school child of about 6 to 11 could answer it and it suits that age.

Opus reads 40 questions to a call, with answer, choices and reference but no Bible text, at low effort. As of 23
October 2026, all 11,030 are rated ($16.92): 2,516 easy, 5,233 medium, 3,281 hard; 2,727 suit children. On 24 October
the 3,928 from the children's sources were rated the same way ($5.24): 2,240 easy, 1,442 medium, 246 hard; 3,135 suit
children. All 14,916 shown: 4,734 easy, 6,655 medium, 3,527 hard; 5,838 suit children. The tests draw by level and by
children.

## The verse "Read the verse" opens

Owner, 24 October 2026: "How can you glorify God?" opened 1 Corinthians 10:31, which says to do all for God's glory
but not how; the answer is in 1 John 5:3. Where a question's first reference does not hold the answer's words (its
passage is not "matched"), Claude Opus is shown every verse the question cites or was grounded in and picks the one
that shows the answer, or none. 826 questions were checked; **397 now open a different verse**. On 24 October 470
more were checked, mostly from the children's sources ($1.51); 530 shown questions now open a different verse.

A book of one chapter (Obadiah, Philemon, 2 and 3 John, Jude) is often cited by verse alone: "Philemon 13" is read as
Philemon 1:13, both when the verses are checked and for the link (fixed 24 October 2026; it had opened a chapter 13
that does not exist).

## Flags from the owner

[flags.json](flags.json) holds the questions the owner flagged while test-taking in the question explorer
([../bank/](../bank/README.md#the-question-explorer-local-only)), keyed by id, each with the note and the wording as it
was shown. A chat that fixes one fixes it at its source (the audit, the choices or the sources), rebuilds, and removes
the flag (the page's "Remove flag", or by editing the file).
