# Children — questions for children of about 6 to 11

Everything about the children's questions: the ones the children's page asks today, the children's sources we
downloaded, and the plan for the children's tests. The page itself (design, lessons, the button on the questions page)
is built by the children's page chat; the plan is [../tests/README.md](../tests/README.md), Part B.

## What the children's page asks today

The children's page mock-up (`/children_mockup` on the local preview; the owner chose version E on 2026-10-24: the
parts on top, the chosen lesson large below them, the path underneath) asks two collections already in the bank:

- *Hurlbut's Bible Lessons for Boys and Girls* (1903): 619 shown questions in **88 lessons that walk through the Bible
  in order**, the backbone of the curriculum.
- *A Catechism for Young Children*: 97 shown questions. **This is the Presbyterian one** (it asks about the
  sacraments and who takes the Lord's Supper). It is to be swapped for the Baptist *A Catechism for Little Children*
  (1864), now extracted below.

**[children-wording.json](children-wording.json): all 716 in a child's words.** The check against the BSB had reworded
about half of Hurlbut's questions in the BSB's own grown-up words (owner, 2026-10-24, of "Which king of Judah
demolished the bronze snake called Nehushtan that Moses had made?": "these are not for children"). Claude Opus wrote
each one again for a child, from the 1903 wording, the checked wording, the reason for the change and the BSB verses,
with an answer of a few words and three wrong choices a child can tell apart; a second Opus call checked each against
the BSB verses. Each record is tied to the checked wording by a fingerprint; the bank build adds it to the question as
`child`, and the children's page asks that. Script: [question_children_wording.py](../../../scripts/question_children_wording.py).

**Every shown question is also rated for children** (`children`: true or false, [../checks/README.md](../checks/README.md#how-hard-each-question-is)):
2,727 of the 11,030 suit a child of about 6 to 11. That covers the whole site, not only the children's collections.

## The children's sources (batch 4), extracted and tagged

[children-batch4.json](children-batch4.json): **7,326 questions with answers** from seven children's sources, pulled
out of the downloads in [../sources/](../sources/README.md) on 2026-10-23 by
[children_batch4.py](../sources/tools/children_batch4.py). **None of it is on the site yet.**

| Source | Questions | Written for | Licence |
|---|---|---|---|
| Ministry-to-Children lessons | 2,535 | preschool, older elementary, otherwise 3 to 12 (by the site's own categories) | CC BY-SA 4.0: credit Ministry-To-Children.com (Tony Kummer), share alike |
| *The Child's Scripture Question-Book* (American Sunday-School Union, 1907) | 2,154 | younger classes | public domain |
| *The Child's Bible Question Book* (Boston, 1880) | 1,088 | the infant class | public domain |
| unfoldingWord *Open Bible Stories* questions | 672 | not stated | CC BY-SA 4.0: credit unfoldingWord, share alike |
| Manly, *The Child's Question Book on the Four Gospels* (Southern Baptist, 1864) | 514 | primary classes | public domain |
| *A Catechism for Little Children* (Baptist State Convention of North Carolina, 1864) | 200 | little children | public domain |
| Boyce, *A Brief Catechism of Bible Doctrine* (Southern Baptist, 1885) | 163 | ten to twelve and up | public domain |

How they were pulled out:
- **The five scanned books**: Claude Sonnet read the machine-read text a section at a time and wrote out each
  question with its printed answer, fixing only what the scanner misread ("tlie", "U8", "!" for "?") and changing no
  wording (62 sections, $4.04). Manly's answers, printed straight after each question, are now separate.
- **Ministry-to-Children**: Claude Sonnet kept the review questions with an answer in brackets ("Who visited the
  believers in Antioch? (Barnabas)") from 768 lessons, dropping discussion prompts ("Allow responses"), questions about
  the child's own life and teacher directions (192 calls, $4.65). Hence 2,535, not the ~3,900 bracketed lines first counted.
- **unfoldingWord** was read straight from its data file; each question's `lesson` is its story ("Open Bible Story 12").

Each record carries `age` (as its source says), `lesson`, `collection`, `kind` (`lesson` or `catechism`), the
licence and credit, and the same tags as the site's questions:
- `books`, `testament` and `topic` from the site's word lists ([question_tags.py](../../../scripts/question_tags.py));
- `passages`, `people`, `places` and `subjects` from Claude Haiku ([question_model_tags.py](../../../scripts/question_model_tags.py)
  `--records`, $0.73), every passage checked against the BSB: 5,842 hold the answer's words, 1,444 only exist, 10 were
  dropped. The site's themed tests are built from these tags, so these questions fall into themes like "Moses" or
  "David" on their own.

6,844 of the 7,326 are tied to a Bible book; most of the rest are doctrine questions ("Who is God?").

**They are not multiple choice**: every source printed a question and its answer only.

## What still has to happen before they reach the site

1. **The BSB's words.** The old books are in King James wording; each question is checked against the BSB and fixed
   (the site's rule: fix a question to what the BSB says, hide only as a last resort).
2. **A child's words**, as was done for the 716 above.
3. **Four choices**, written after the wording is settled (wrong choices written before it would have to be redone).
4. **The site's checks**: the repeat check against the whole bank, grounding, the difficulty rating.
5. **Listed** in the bank build's `BANKS` and on [SOURCES.md](../../../SOURCES.md), with the credit each licence asks.

Which of the seven to use, and in what order, belongs to the children's curriculum
([../tests/README.md](../tests/README.md), Part B).
