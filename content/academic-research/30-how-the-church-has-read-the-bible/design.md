# How the church has read the Bible: design record

The page: [/study/how-the-church-has-read-the-bible](../../../src/pages/study/church-reading/ChurchReadingPage.tsx). Its evidence and limits: [the research record](../30-how-the-church-has-read-the-bible.json). Its verses and counts: [the data build](../../../scripts/build-church-reading-study.py).

## What this page is for

A reader hears "the church always read it this way", or "the Reformers threw out allegory", and has no way to test it. They leave able to tell what a passage says from what a reader asks of it, keep allegory, type, illustration and the four senses apart, and say what each stage of Christian reading was trying to answer. The question it carries: who taught me to read it this way, and what did they want it to answer?

## The material's own shape

The list entry names one passage read across every stage, and the passage holds the very word the argument is about. Medieval readers met Scripture as a glossed page: the text in the middle, its readers around it, tied to its words by small marks. So the study's shape is already an object in the record, and a leaf of that very passage survives (Paris, Latin 312). The page is built as that object.

## Directions, and one honest gap

The study standard asks for three or four directions built as mock-ups, then a stop for the owner to choose. That stop is not possible inside a remote job, because the owner cannot answer mid-job. So three directions were weighed in writing, one was built, and the choice is the owner's to overturn on sight.

1. **A glossed page of Galatians 4 (built).** The Berean text at the centre, twelve readers' notes in two margins, each tied by a letter to the words it fastens on. The central comparison is visible at once (rule A5), the form is the subject's own, and a date is not needed to see the pattern.
2. **A line of time as the main view.** It explains sequence best and is the obvious history-of-interpretation shape. Rejected as the lead: it promises a clean succession (allegory, then senses, then plain sense, then criticism), and the evidence denies one. Chrysostom holds a figure to its history a thousand years before the Reformers, and Luther goes on allegorising. It survives as section 04, with its ranges drawn as ranges and a stated gap.
3. **A family tree of schools.** Alexandria and Antioch branching to modern methods. Rejected: the evidence cannot bear descent lines, since most influence between these readers is unproved or unread here, and it would treat tendencies as parties.

Against the site's other studies: three lists side by side, a dot field, an inspection desk, a year wheel and a house are all taken. Nobody on the site reads one passage as a page with readers around it. The farming year, built just before this one, shares only what every study must share (the heading, the three-part record, the claims and the sheet). Its wheel beside a list becomes here a figure whose own lobes are the controls, and it sits in a different field with a different tone.

## Behaviour

The view lives in the address: `reader` (who is lit), `ask` (the question), `sense` (the chosen sense), `open` (the record sheet). An unknown value falls back to the default through a Map. An open record wins over `reader`, so the lit words always belong to the record beside them. Focus returns to the opener, found again by its key after the render. The questions are pressed buttons, and whatever opens a sheet is marked as opening a dialog. Motion is the orbit, two sparkles and the ties breathing; all of it stops for reduced motion. The four questions are one at a time on purpose: forty-eight cells at once would be the dense comparison block the owner has ruled out.

## Headline voice

Concept line: Letter · Figure · Sense · Margin. Title: How the church has read the Bible, with the turn "one passage, twelve readers". Motto: "One passage. / Every reader's margin."

| Section | Headline | What it does | Depth |
|---|---|---|---|
| Opening | | Trail, title, drawing of a glossed page, four true figures, outcomes | Way in |
| 01 The glossed page | One passage. *Twelve margins.* | Eleven verses in the Berean at the centre; twelve notes, six each side, in date order; letter marks on the phrases; a chosen reader lights their phrase and fills a strip below with their quotation and what they were looking for, then opens the record sheet. Under it the real leaf, its detail, what can be read on it, and the one Greek word | Collection, then item |
| 02 Four questions | Same verses. *Different questions.* | Four visible question tabs; all twelve readers answer the chosen one in date order; one sentence reads the column. Not a 48-cell table, which the owner has ruled out as a dense comparison block | Comparison |
| 03 Four senses | One Jerusalem. *Four ways.* | A four-lobed drawing with Jerusalem at its middle; choosing a sense gives Cassian's Jerusalem and Aquinas's "let there be light" for it; the medieval rhyme; Tyndale's reply; a reader's test | Scale change: one word |
| 04 Line of time | A long argument. *No clean handover.* | Twelve bars on one track from AD 200 to 2010, grouped into five kinds of reading, each bar a range and each bar opening its record; five turns in words; the site's own stance from the Baptist confessions | Scale change: the whole |
| 05 Verse 30 | Expel the slave woman. *Whom?* | The verse once, six later readers' targets in a list, then evidence, inference and limit, and the site's stance on conscience | Consequence |
| 06 Claims | Four things often said. *One test each.* | Four popular claims with three-part records and tests; a Lyra leaf with the medieval one | Discernment |
| 07 Where it stops | A selection, stated. *The passage stays.* | Words to keep apart, reach, what is left to neighbours, reading trail, credits, closing question, way back | Trail |

## Where the evidence cannot go

- **No influence lines.** The page sets readers side by side; it does not claim one read another, unless the source says so (Calvin naming Origen; Caneday and Anderson reporting Calvin).
- **No point dates.** Each reader is a bar with a stated range. A bar is drawn no narrower than a small minimum so it can be seen and pressed, and the key says so.
- **The gap from about 430 to 1260 is the selection's, not the church's.** The line of time says so where the gap is.
- **The reading on the leaf is this study's own**, from the photograph, unverified by a specialist, and marked so.
- **Reader summaries in the margins are this site's**, marked with the letter and name. Only the words in quotation marks are the reader's or their translator's.

## Doctrine

Academic study, so history is reported without ranking. The site's own voice holds Scripture as "truth, without any mixture of error" (Baptist Faith and Message 2000, article 1), and says so at the stance in section 04 and at the Origen claim. Where a reader denies something the site holds, or attacks Paul, that reader's words stay theirs and the page says the site does not adopt them. On how far a type reaches, where Baptists differ, it does not choose. Verse 30's target list ends in article 17, "A free church in a free state", which rules out force. The long history between Jews and Christians is named at that verse and handed to the planned study.

## What is checked

The build proves every verse exists in the Berean with its stated phrase, that the eleven verses run unbroken, that each reader's phrase is in the verse they fasten on, that the reader marks and dates are in order, that the Greek word is tagged once in the site's King James on Galatians 4:24, and that quoted Scripture and the 1689 Confession's wording are as held on this site. Every quotation from an outside reader was checked by a throwaway script against the fetched or held text during research; that script is not part of the site, because the texts are not. None of this proves a reading is right.
