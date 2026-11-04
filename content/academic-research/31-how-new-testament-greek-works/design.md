# How New Testament Greek works: design record

The page: [/study/how-new-testament-greek-works](../../../src/pages/study/greek/GreekPage.tsx). Its evidence and limits: [the research record](../31-how-new-testament-greek-works.json). Its words and counts: [the data build](../../../scripts/build-greek-study.py).

## What this page is for

A reader hears "in the Greek" in sermons and commentaries, and has no way to judge what is being said. They leave able to read the letters, find who acts and who receives, and ask of any claim about a verb: *is that in the form, or in the verse?* They do not leave able to translate, and the page says so.

## Directions, and one honest gap

The study standard asks for three or four directions built as mock-ups, then a stop for the owner to choose. That stop is not possible inside a remote job, because the owner cannot answer mid-job. So three directions were weighed in writing, one was built, and the choice is the owner's to overturn on review:

1. **Move the words and watch nothing break (built).** The first thing a reader does is press a word group in a clause of John 3:16 and see the English fall apart, or reverse, while the Greek holds. No other study on the site does this, and it teaches the page's main idea before a single rule is stated.
2. **A grammar in order: alphabet, then nouns, then verbs.** The most familiar. Rejected: it puts the reward last, and it reads as a sibling of How Hebrew works.
3. **One long walk through John 1.** Warm and rich. Rejected: the walk would keep meeting the argument over the article too early, and would slide towards translating.

## Form and motion

- The page is an open sheet with a left margin that holds each section's number and name, sticky on wide screens. Content sits to the right. This keeps it apart from How Hebrew works (a ruled sheet with a peeled line) and Strong's numbers (an alphabet band and cards), which share its field.
- Each job an ending does has its own underline, solid, double, dotted or wavy, always with a word beside it. Colour never carries the meaning. The underline is not skipped around descenders, or the styles could not be told apart.
- The header drawing is new and ours: the stem λόγ with dotted threads to five endings. It is labelled as illustrative and not a facsimile. Motto: "Move the words. / Watch the endings."
- Tone colour is the Study hub's field colour for Languages & translation. Motion is limited to a slow orbit, moving threads and two sparks in the header, and all of it stops under reduced motion.
- Greek is set in the site's own Literata, which the site already downloads with both of its Greek sets, so breathing marks and the iota under a vowel stay whole with nothing new added. It is marked as Greek for screen readers and takes no synthesised weight.
- The arcs from article to noun are measured from the words as drawn, inside the line's own scroller, and measured again once the font arrives. The curve itself is worked out in [model.ts](../../../src/pages/study/greek/model.ts), where it is tested.
- The order buttons move the real elements, so reading order and focus stay true, and focus follows the group the reader pressed.

## What was kept out, and why

- **Looking words up by number.** Strong's numbers does that. The sheet here shows a word's form only, and links there.
- **Word-frequency tables.** Words across the letters has them. The page counts forms of four nouns to show endings, and nothing about what those words mean.
- **Why translators choose as they do, and how context fixes meaning.** Both are planned studies.
- **The Septuagint, Aramaic and how "Lord" came to stand for God's name.** Each is a planned study, with one line of handover.
- **The papyrus as a window on daily life or as a letter form.** One return is shown for its language alone.
- **John 3:16 word by word.** It opens the page once. The real lines are Romans 5:8, John 3:35 and John 1:1.

## What the three reviews changed

Before any code was written, the plan was reviewed for reliability, for platform and edge cases, and for security and correctness. These changed what was built:

- The page was shortened: the stem fan and the real line became one section, and the article section was cut to one tested claim with a compact table.
- The article test now shows places where John plainly means God with no article, and says that Greek has no word for "a". It names where the rendering "a god" is best known and says plainly that one point of grammar does not prove a doctrine.
- Harner's table is called his possibilities, not a survey, and the page notes that Colwell's rule cannot be run backwards.
- John 8:58, John 13:31 and Romans 8:30 are marked as the places where readers differ most.
- Burton's statement is quoted exactly and marked as the traditional account, with the note on participles.
- Words are counted from the Nestle-Aland edition only, so that words from STEP's other editions are not counted twice, and word comparison ignores punctuation and uses one canonical letter form.
- The STEP credit, its link and a note of what was done with the data are on the page, and a test checks them.

## Decisions for the owner to overturn

- John 1:1 is the one place the page speaks in the site's own voice on a contested reading, under the Baptist Faith and Message 2000. On the narrower question of how to describe one Greek noun, it reports two grammarians and does not choose.
- The New World Translation is named once as where "a god" is best known. It is named as a fact about a rendering, and the argument is against the grammar claim, not the people.
