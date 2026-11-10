# Birthday verses: research and design

**Feature:** entry 5 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md), "Every date of the year gets its own verse and a shareable card, to send to friends on their birthday."
**Step:** research and design (step 17 of sequence 32, "Bible Guide chain C"). One review follows in step 18, which corrects this document in place and adds a Review section at the end. Implementation is step 19, checked against "all 366 dates have a page and card per the design, and tests and build pass".
**Rules followed:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the site's [AGENTS.md](../../../AGENTS.md), the [doctrinal foundation](../../../../DOCTRINAL-FOUNDATION.md) (Baptist Faith and Message 2000; the Berean Standard Bible everywhere), the occasion rule in [PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md), [SEO.md](../../../../SEO.md), and the workspace batch rule (any model task repeated over many items runs through [BatchRunner](../../../../../../Tools/BatchRunner/README.md) with a pilot, a budget and the owner's yes).
**Tools hub entry:** already present as `birthday-verses`, "Birthday verses", status `coming-soon`, category "Family and life events", in [registry.ts](../../../src/pages/tools/registry.ts).
**Date:** 2026-11-10.

## 1. What we are building, in one paragraph

Every date of the year, 29 February included, gets one verse from the Berean Standard Bible, chosen once, never repeated, and fitting to send to a friend on their birthday. Wherever a fitting verse exists, its chapter and verse match the date, the way people already look for a "birthday verse": March 16 is John 3:16 (chapter 3, verse 16). Each date has its own page, `https://bibleguide.io/birthday-verses/march-16`, made to be found by people searching "Bible verse for a March 16 birthday". It shows the verse with the verses around it, a one-line note on why it fits, a ready-made picture card ("Happy birthday" above the verse, an optional line of the visitor's own such as "Love you, Anna") made by the shared verse-card generator built in step 16, and a ready-to-send birthday message. A hub page lets a visitor pick any date, and twelve month pages list each month's verses. Nothing runs a model, uploads or stores anything when a visitor uses it. The 366 choices live in the one file the occasion verse picker already set aside for them, so the picker's Birthday occasion and these pages show the same verse for the same date.

## 2. Research

### 2.1 What people search for, and what already exists (checked 2026-11-10)

| Source | What it does | What we take or avoid |
|---|---|---|
| [BirthVerse (birthverse.com)](https://birthverse.com/) and its [by-month lists](https://birthverse.com/birthday-bible-verse/) | 366 hand-picked verses, one per date, with a "calculator" and month pages; says plainly that the Bible assigns no verses to dates | **Take:** one verse per date, month pages, the honest disclaimer. **Avoid:** its choices are its own work, so none are copied; ours are chosen fresh from the Berean |
| [House of Faith](https://www.houseof.faith/bible-verse-for-my-birthday) | Pairs each date with a passage, and separately shows the reference the date "spells" (month as chapter, day as verse) across six books | Confirms the two things people want: a chosen verse, and the chapter-and-verse match |
| [taiwie.com birthday verse](https://taiwie.com/birthdayverse), [Family Faith Builders](https://www.familyfaithbuilders.org/find-birth-verse/), [The Bible Christian](https://thebiblechristian.com/how-to-find-your-birthday-bible-verse/), [Holy Land Merchandise](https://holylandmerchandise.com/what-is-my-birthday-bible-verse-2/) | Explain the social-media habit: **month = chapter, day = verse** (born August 1 → Romans 8:1 or Joshua 8:1); where the day is past the chapter's end, people "flip" the numbers (chapter 31, verse 7 for July 31) or pick freely | **Take:** the match rule, the flip as the second choice, a free choice last, and saying which one a date got. **Avoid:** listing every 3:16 in the Bible for the visitor to sort through: most are genealogies, laws and battles |
| [StorkIe BirthVerse](https://www.storkie.com/birthverse.aspx) | 366 verses where chapter and verse match month and day | Shows a strict-match set is a known product; our research (2.3) shows strict matching alone leaves some dates with nothing warm, hence the flip |
| General lists ([Bible Study Tools](https://www.biblestudytools.com/topical-verses/bible-verses-for-birthdays/), [Believers Refuge](https://believersrefuge.com/bible-verses-for-birthdays/)) | 30–40 favourite birthday verses (Psalm 118:24, 139:13–14, 90:12, Numbers 6:24–26) | These are already in the occasion verse picker's Birthday occasion ([design 6](../occasion-verses/design.md)); the date pages link there for "more verses for a birthday" |

What searchers type: "bible verse for my birthday", "[month] [day] birthday bible verse", "birthday verse by date", "what is my birthday bible verse", and the verse itself next to a date ("John 3:16 March 16"). Every page title and heading therefore names the date in words, and the page names the verse's reference in its first lines.

### 2.2 Being found without looking like spam

Google's spam policies name two things a page-per-date feature could drift into: **doorway abuse**, "sites or pages created to rank for specific, similar search queries", including "substantially similar pages that are closer to search results than a clearly defined, browseable hierarchy", and **scaled content abuse**, "many pages generated for the primary purpose of manipulating Search rankings and not helping users", whether written by people, automation or both ([Google Search Central, March 2024 spam policies](https://developers.google.com/search/blog/2024/03/core-update-spam-policies), [Wikipedia: Doorway page](https://en.wikipedia.org/wiki/Doorway_page), [summary with quotes](https://seomatic.ai/resources/scaled-content-abuse)). This design stays on the right side of both:

- **A real hierarchy:** hub → 12 month pages → 366 date pages, each linking up, across and back (section 6).
- **Each page has its own substance:** a different verse, the verses around it as page text, its own note on why it fits, its own card and message. No page is a template with only the date swapped.
- **No funnelling:** a date page answers its question on the page itself; it does not push the visitor to another page to get the verse.
- **No made-up prose at scale:** the one stored sentence per date is checked by a person-level pass (4.5); the rest of the page's words are Scripture read from the site's own Berean files.

### 2.3 Can every date have a fitting chapter-and-verse match? (measured 2026-11-10, $0, on the site's own Berean files)

A throwaway script in this job's own folder counted, for every date, the Berean verses whose chapter is the month and verse is the day, and, for days 13 to 31, the "flipped" verses whose chapter is the day and verse is the month.

| Filter | Fewest per date | Median per date | All candidates |
|---|---|---|---|
| Any verse at month:day, 220 characters or fewer | 9 (July 31) | 32 | 11,804 |
| Plus: whole sentences only (starts with a capital, ends with . ! or ?), no numbers, no hard words (death, curse, wrath, sword, burn, "son of" lists and similar), Leviticus, Numbers, 1 Chronicles, Ezra, Nehemiah, Esther, Obadiah and Nahum left out; flipped verses added for days 13–31 | **10** | **23** | **9,060** |

What the numbers mean in practice, from reading the hardest dates:

- **Most dates have several warm exact matches.** March 16: John 3:16, 2 Thessalonians 3:16 ("Now may the Lord of peace Himself give you peace at all times…"), Colossians 3:16. December 30: Mark 12:30 (love the Lord with all your heart). August 28: Romans 8:28.
- **Some dates have no warm exact match, but a warm flipped one.** July 31 has only genealogies, Jeremiah's Topheth and Mark's travel note at 7:31; its flip, **Psalm 31:7**, "I will be glad and rejoice in Your loving devotion", is ideal. March 31 at 3:31 has Lamentations 3:31 ("For the Lord will not cast us off forever"), and its flip Jeremiah 31:3 ("I have loved you with an everlasting love").
- **A few dates need a free choice.** August 29 at 8:29 offers Romans 8:29 (predestination: true, but a heavy birthday card), John 8:29 (about Jesus Himself) and Acts 8:29 (an instruction to Philip); its flips at 29:8 are warnings. February 29 at 2:29 is thin (Philippians 2:29 is the best: "Welcome him in the Lord with great joy, and honor men like him", which is about Epaphroditus).
- **The site has already hand-picked many of them** (counted in the review, step 18, $0). Of the 366 dates, **254** have at least one date-matched or flipped candidate that one of the site's own curated lists already uses (the verse of the day's pool of 428, "when you're…", countdowns, life events, sympathy, occasion prayers, home blessings, the occasion picker; the games' scene verses left out), and **153** have two or more. March 16 has six (John 3:16, 2 Thessalonians 3:16, Colossians 3:16 among them); November 29 has Psalm 29:11, "The LORD gives His people strength; the LORD blesses His people with peace", the natural replacement for the left-out Jeremiah 29:11. July 31, February 29 and December 25 have none. Being on a list does not make a verse a birthday verse (Mark 8:29, "Who do you say I am?", is on one), so this is a preference, not a choice (4.3).
- **A word-list score cannot pick for us.** Ranking candidates by warm words put "Whoever loves his life will lose it" (John 12:25) first for December 25 and "Escape will fail the swift" (Amos 2:14) first for February 14. The choice needs reading, which is why section 4 uses a model to shortlist and a careful final pass to choose.

**Flips cannot collide with matches.** A flipped verse has a chapter from 13 to 31, and an exact match always has a chapter from 1 to 12, so no flipped verse can be another date's exact match. Flips are allowed only for days 13 to 31 for that reason.

### 2.4 What the site already has that we reuse

| Piece | Where | Used for |
|---|---|---|
| **The per-date slot** | [birthday-by-date.ts](../../../src/data/occasion-verses/birthday-by-date.ts): `BIRTHDAY_BY_DATE` (`Record<"MM-DD", LifeEventPassage>`, empty), `allBirthdayDates()` (the 366 keys, 02-29 included), `monthDayOf()` (a date field's value to "MM-DD" without time zones), `birthdayDatesComplete()` | The one home of the 366 choices (section 3). Built by the occasion picker's job for exactly this step |
| The passage helper | `p()` in [life-events/types.ts](../../../src/data/life-events/types.ts) | Every entry is `p("JHN 3:16", "card", note)`: verse ids only, a bad reference fails as the file loads, and the site's verse-wording check ([check-verse-wording.py](../../../scripts/check-verse-wording.py)) keeps verse words out of code |
| The verse-card generator and share panel | [src/lib/verse-card/](../../../src/lib/verse-card/README.md), [CardSharePanel.tsx](../../../src/components/verse-card/CardSharePanel.tsx) | The picture card, its six designs, four sizes, the visitor's own line, and Share / Save / Copy picture / Copy link / Copy text (section 7) |
| Link-preview drawing | [scripts/verse-cards/](../../../scripts/verse-cards/previews.mjs) (`preview-entry.ts`; `preview-pages.ts`: `PREVIEW_VERSION`, `MAX_PICTURE_BYTES`, `FILE_LIMIT`, `fileBudget`, `withPicture`, `firstWords`) and the release copies' helpers in [shell.ts](../../../scripts/seo/shell.ts) (`fillShell`, `replaceOnce`, `escape`) | The 366 preview pictures, drawn by the same generator, and the ready-made copies (8.2, 8.3) |
| Reading Berean words | `loadChapterPlain` in [data.ts](../../../src/lib/data.ts), as [verse-cards/load.ts](../../../src/pages/verse-cards/load.ts) uses it | The verse and its neighbours on the date page |
| Dates in the visitor's language | `dateFormat` in [site-format.ts](../../../src/lib/site-format.ts), the pattern of [countdowns/format.ts](../../../src/pages/countdowns/format.ts) (UTC midnight, so no time zone moves a day) | "March 16" in headings and messages; 2024 (a leap year) as the formatting year so 29 February exists |
| Sending a text message | the sympathy and countdowns message builders ([sympathy/message.ts](../../../src/pages/sympathy/message.ts), [countdowns/message.ts](../../../src/pages/countdowns/message.ts)): share sheet, Copy, "press and hold to copy", `mailto:` and `sms:?&body=` | The "Send a birthday message" box (7.3), as the feature's own small builder on the same pattern |
| Reader links | `readerPath` in [links.ts](../../../src/lib/verse-card/links.ts) (`/read/bsb/JHN/3?hl=16`), as the verse-card page uses it | "Read John 3" from each date page |
| **The verses the site has already hand-picked** | The verse of the day's pool ([schedule.json](../../../src/data/verse-of-the-day/schedule.json)) and the passages of "when you're…", countdowns, life events, sympathy, occasion prayers, home blessings and the occasion picker, all under [src/data/](../../../src/data/) | A preference signal when choosing (4.3): a date's candidate the site already chose for encouragement has already been read once for warmth and for being taken in context |
| The occasion picker's Birthday occasion | [birthday.ts](../../../src/data/occasion-verses/birthday.ts) and its exclusion list ([design 6](../occasion-verses/design.md)) | "More verses for a birthday" link, and the same five verses left out (4.3) |
| The site's page inventory and sitemap | [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), the countdowns and life-events entries as the model | One page type, "birthday-verses" (8.1) |

### 2.5 How this fits the "one occasion tool" rule

[PROPOSED-IDEAS.md](../../../../PROPOSED-IDEAS.md) says every occasion-based verse feature, birthdays included, is one tool, the occasion verse picker, and new occasions extend it. The occasion picker's design (section 6) therefore left this slot and noted that "sequence 32's step 19 promises a separate page per date; under the one-tool rule its work should fill this file instead (noted for the owner)". This step's own brief, written by the owner for this sequence, asks for "a page per date for search traffic", and step 19 is checked against "all 366 dates have a page". Both are kept, this way:

- **One list, in the picker's file.** The 366 choices go into `BIRTHDAY_BY_DATE`, nowhere else. There is no second birthday verse list.
- **The picker gains its date field** ("Your verse for your birthday"), which its design already planned for the day the file is complete (7.5). In the picker, Birthday stays one occasion among the others.
- **The date pages are pages, not a second picker.** They show one date's verse, its card and its message, the way the verse-card pages show one verse. They exist so a search for "March 16 birthday verse" lands on an answer; choosing among many birthday verses stays in the picker, which every date page links to.
- **The Tools hub keeps its approved "Birthday verses" entry** (the hub's test holds the owner's list of ten by name). It goes live pointing at `/birthday-verses`.

Where this step's brief and the occasion rule pull apart (a separate address per date), the step's own brief is followed, as the instructions for this sequence say, and the report says so.

## 3. Dates and addresses

### 3.1 The 366 dates

- The keys are `allBirthdayDates()`: "01-01" to "12-31", 02-29 included, in calendar order. Nothing else counts as a date.
- **A date is a month and a day, never a moment.** No page, test or helper turns a date into a `Date` in the visitor's time zone. Where a weekday or a formatted name is needed, the date is formatted at UTC midnight in 2024 (a leap year), as [countdowns/format.ts](../../../src/pages/countdowns/format.ts) does, so 29 February exists and no time zone shifts a day.
- **"Today"** (the hub's quick choice) is the visitor's own calendar date, read once from their device's local clock as month and day. Someone in Sydney sees their today, not London's. That is right: they are sending a verse for a birthday where they are.

### 3.2 Addresses

| Page | Address | Example |
|---|---|---|
| Hub | `/birthday-verses` | |
| Month | `/birthday-verses/<month>` | `/birthday-verses/march` |
| Date | `/birthday-verses/<month>-<day>` | `/birthday-verses/march-16`, `/birthday-verses/february-29` |

- Month words are the English names in lower case, fixed forever like the verse-card keys; addresses are never translated (when the per-language addresses the owner approved go live, a prefix such as `/es/` goes in front of the same English slug, [language-addresses.ts](../../../src/lib/language-addresses.ts)). Day numbers have no leading zero.
- One pure module, `src/pages/birthday-verses/dates.ts`, owns the conversion: `datePath("03-16")` → `/birthday-verses/march-16`, `dateFromSlug("march-16")` → `"03-16"`, `monthPath(3)`, `monthFromSlug("march")`, and `birthdayUrl(...)` built from `SITE_ORIGIN`.
- **Forgiving reading, one official address.** `dateFromSlug` also accepts `mar-16`, `03-16`, `3-16`, `16-march` and `march16`, upper or lower case; the page then replaces the address with the official one (React Router `Navigate replace`) and the page's canonical tag always names the official one. Anything else (`february-30`, `march-32`, `smarch-1`) opens the hub with "We couldn't find that date" and the date chooser, never an error page.
- Nothing typed by a visitor (a friend's name, their own line) ever goes in an address, the page title or a share link. The only thing an address carries is the date.

## 4. Choosing the 366 verses, once

### 4.1 The order of preference for each date

1. **Date match:** a passage starting at **chapter = month, verse = day** in any of the 66 books (March 16 → John 3:16).
2. **Flipped match**, days 13 to 31 only: **chapter = day, verse = month** (July 31 → Psalm 31:7). Section 2.3 explains why flips can never collide with a date match.
3. **Chosen:** a fitting verse with no number link, used only when neither of the above offers anything warm and fitting. Expected for a handful of dates (August 29 and February 29 look like candidates); a test caps it at **24 dates** so the match rule stays the rule.

Which of the three a date got is never stored: a function computes it from the date and the reference (`matchKind(date, passage)`), so the page's explanation (6.3) can never disagree with the verse.

### 4.2 Rules every choice keeps (all tested in 9.1 except the last two, which the final pass checks by reading)

1. **Exactly one passage per date, 366 in all, no repeats:** no two dates share a verse, and no two passages overlap.
2. **Short and whole:** one chapter, one to three verses, at most **300 characters** after the generator's own tidying (so the card fits all four sizes, including the short `wide` one, which holds about 400). A passage starts a sentence and ends one; a second or third verse is added only to finish the thought the date's verse starts (Lamentations 3:22–23 style), and the passage still **starts** at the matched verse, so its reference still names the date.
3. **Not one of the verses the site has already ruled out as birthday verses** for being taken beyond what they say: Jeremiah 1:5, Jeremiah 29:11, Psalm 20:4, 3 John 1:2 and Zephaniah 3:17 (the occasion picker's list, [design 6](../occasion-verses/design.md)), nor the verse of the day's examples of promises made to one person or to Israel in exile that their plain words on their own do not carry (Jeremiah 33:3, Isaiah 43:2, [curation.ts](../../../src/data/verse-of-the-day/curation.ts)). Jeremiah 29:11 would have been November 29's flipped match; that date gets a different verse, and its note may say why in a short honest `context` line (6.3).
4. **Balance across the year:** Psalms and Proverbs together at most a third of the dates; the New Testament at least a third; no single book on more than 40 dates. (Psalms will be the largest single book, because its chapters 13 to 31 give most of the flipped matches.)
5. **Warm to receive.** Read as a message from a friend on your birthday, it encourages, blesses, gives thanks or points to God's goodness, faithfulness, love or care. Left out even when they are true and good: verses of judgment, warning or rebuke ("Do not envy a violent man", Proverbs 3:31); verses that need a paragraph to explain; verses about one particular person's errand (Acts 8:29); verses that read like a joke about age, worry or death on a birthday ("Who of you by worrying can add a single hour to his life?"); verses spoken by people Scripture does not endorse (Job's friends, the serpent); and verses that only fit a wife, husband or one sex when the card may go to anyone (Proverbs 31:12).
6. **Doctrinally sound, in the site's own voice.** Nothing that reads as a sign, fortune or destiny for people born on that day (the disclaimer is in 6.3); nothing that promises health or wealth; a promise to Israel or to an apostle is used only where its words hold for every believer, and then with its setting in the note. Everything agrees with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)).

### 4.3 How the choosing is done

The owner's build rules allow anything generated to be made once ahead of time with a cheap model and stored; the workspace batch rule says a model task repeated over many items runs through BatchRunner, one minimal call per item, with a 3-item pilot, a budget cap and the owner's yes on the pilot's estimate before the full run. Section 2.3 showed that the choice needs reading, and that there are about 9,000 candidates: too many for one working session to read, and a poor use of the strongest model. So:

| Stage | What | Cost |
|---|---|---|
| **A. Shortlist, by script** | `scripts/birthday-verses/shortlist.ts` reads the site's Berean files ([data/plain/bsb/](../../../data/plain/bsb/)) and writes, for each date, every date-matched and flipped candidate that passes the mechanical rules of 4.2 (1–3 verses, whole sentences, 300 characters, no numbers, the hard-word list, the left-out books, the excluded verses), each with the verse before and after it, and **marks each candidate the site's own curated lists already use** (2.3, 2.4: read from the files under [src/data/](../../../src/data/), the games' scene verses left out). Output: one text file per date in a git-ignored working folder (`.local/birthday-verses/items/`), ready for BatchRunner, plus a separate folder holding only the three hard dates 02-29, 07-31 and 08-29 (`.local/birthday-verses/hard/`). Prints the per-date counts, the number of dates with a curated candidate (254 when measured), and stops naming any date with fewer than 3 candidates | $0, seconds |
| **B. Ranking, one minimal call per date** | BatchRunner with `--model haiku` (its default is Sonnet, so the model is named) and `--schema` for the answer. The task file holds only the rules of 4.2 (5 and 6 in full, with the examples above), the hint that a marked candidate is one the site already chose for encouragement and is preferred when it fits a birthday, and the answer format. Each item holds the date and its candidates with their neighbours. The answer is JSON: the three best candidates in order, each with a one-line note ("why it fits a birthday", 40 to 140 characters, never quoting the whole verse), whether a second or third verse is needed to finish the thought, and a flag `"none-fitting"` when nothing is warm enough. **Two pilots, because BatchRunner's `--pilot 3` picks its own three items by size** (smallest, largest, one between): first `--pilot 3` on the full items folder, which gives the measured cost projection and suggested budget; then `--pilot 3` on the hard-dates folder (its own output folder), whose three answers are read against rules 5 and 6. If either pilot's picks break rule 5 or 6, both pilots are rerun with `--model sonnet` before the full run, and the estimate given to the owner is that model's | Pilots: a few cents of plan allowance. Full run: about 366 calls of roughly 3,000 tokens in and 250 out, about **1.1 million input and 0.1 million output tokens** on Haiku, a very small share of the Max plan (well under 1% of what the October chapter-summary run used, the batch rule's reference point). The full run uses the first pilot's suggested `--budget-usd` (it already includes headroom; a lower cap would stop the run part-way). The owner's yes covers up to **$3**: if the suggestion is higher, the full run does not start and the owner is asked again with the measured figure |
| **C. Final choice, by careful reading** | The implementing job reads the compact table of 366 dates × 3 ranked picks (about 80,000 tokens, one sitting), picks one per date, preferring a curated candidate where it is as warm as the others, keeps rules 1 and 4 across the whole year, fills the "none-fitting" dates with a chosen verse, edits each note into the site's voice, and writes the result into `BIRTHDAY_BY_DATE` month by month (each month saved as it is finished, so a stopped job loses nothing) | Part of the step-19 job itself |
| **D. Checks** | The tests of 9.1 and the site's build checks (verse wording, English check) | $0 |

**The owner's yes.** Stage B is the only step that uses the owner's plan. It is small, but the batch rule makes the yes non-negotiable, and nothing in sequence 32 has given it yet. Step 19 runs stage A and the two pilots, then:
- if the owner has said yes (in reply to this step's report, through a correction to the job, or on the decision board), it runs the full batch and carries on;
- if not, it asks on the decision board in the usual card form (what it is · recommendation · what it costs · `**Your call:** —`) with the pilot's measured figures, builds and tests everything else against a complete test fixture, and reports that the 366 choices wait for that yes. It does **not** fall back to reading all 9,000 candidates itself: that would use more of the plan than the batch, on the most expensive model, which is exactly what the batch rule exists to stop.

### 4.4 Why not the other ways

- **Strict month:day only** (StorkIe's way): leaves some dates (July 31, August 29) with no verse anyone would send. Flips and a capped free choice keep the idea and the warmth.
- **Free choice for every date** (BirthVerse's way): loses the one thing searchers bring with them, the match, and gives each date a verse with no reason to be on that day.
- **Showing every match and letting the visitor choose:** most matches are lists, laws or battles; the idea is a verse for a friend, chosen with care, not a search result.
- **The site's verse of the day for that date:** it changes every year and is chosen for a different purpose; a birthday verse must stay the same year after year so a person can call it "my verse".

### 4.5 Changing a choice later

One line in `BIRTHDAY_BY_DATE`. The address stays the same, so links people have sent keep working; a changed verse changes the date's preview picture, so its file name moves to the next design version as the verse-card previews do (8.3). The owner, or a reader writing in, can ask for any date to be changed; nothing else depends on which verse a date has.

## 5. Data

### 5.1 The choices

`src/data/occasion-verses/birthday-by-date.ts`, filling the existing record:

```ts
export const BIRTHDAY_BY_DATE: Readonly<Record<string, LifeEventPassage>> = {
  "03-16": p("JHN 3:16", "card", "The heart of the gospel: God's love for the world, given in His Son."),
  "07-31": p("PSA 31:7", "card", "Gladness in God's loving devotion, from a psalm of trust."),
  // …366 entries, in calendar order, one month per block with a comment naming the month
};
```

- `role` is always `"card"`. The `note` is the one-line "why it fits" (40 to 140 characters, a whole sentence starting with a capital, so the page can show it as stored, 6.3), written in the site's voice; a test fails a note that holds ten or more consecutive words of the verse, the same spirit as the verse-wording check. The optional `context` holds an honest setting line where rule 4.2.6 needs one (at most 200 characters), passed as `p(reference, "card", note, { context })`.
- About 366 short lines in one file, roughly 450 lines of code with the month comments: under the workspace's 500-line file limit. If it grows past that, it splits into `birthday-by-date/jan-jun.ts` and `jul-dec.ts` re-exported by the same name.
- The occasion picker reads the same record (5.3); this feature reads it through the picker's data index ([index.ts](../../../src/data/occasion-verses/index.ts)), which already re-exports it.

### 5.2 What the feature computes, never stores

In `src/pages/birthday-verses/dates.ts` and `verse.ts`, all pure:

- `matchKind(date, passage)`: `"date" | "flipped" | "chosen"` (4.1).
- `neighbours(date)`: the previous and next date in the 366-date calendar, wrapping December 31 → January 1. February 28's next date is February 29, whose next is March 1 (6.4).
- `monthDates(month)`: the dates of a month in order, from `allBirthdayDates()`.
- `toCardSpec(date, passage, words)`: the card description of 7.1.
- `birthdayMessage(...)`: the text message of 7.3.

### 5.3 Shared with the occasion verse picker

The picker's design promised a date field "only when all 366 dates are filled"; `birthdayDatesComplete()` becomes true when step 19 fills the record, so step 19 also adds that field (7.5). The picker's existing test that every `BIRTHDAY_BY_DATE` entry is a real Berean passage ([occasion-data.test.ts](../../../src/data/occasion-verses/occasion-data.test.ts)) then runs over all 366.

## 6. The pages

All three follow the site's approved design notes ([design/README.md](../../../design/README.md)): no glow, no boxes around everything, no endless scroll, one focal point (the verse). Scripture in Literata inside `.scripture` with `lang="en"` and `translate="no"`; everything else in the site's usual text styles. One stylesheet, `birthday-verses.css`, with a `bv-` prefix.

### 6.1 The hub, `/birthday-verses`

1. **`h1`:** "Birthday Bible Verses: A Verse for Every Day of the Year". One sentence under it: "Choose a birthday to see its verse, then send it as a card or a message."
2. **The date chooser:** two selects, Month and Day (the day list follows the month: 29 for February, 30 or 31 for the rest), and a **Show the verse** button that goes to the date page. Two selects rather than a date field, because a date field asks for a year nobody needs, and some browsers' date fields cannot reach 29 February in a non-leap year. Starts on today's month and day (3.1).
3. **Today:** a quick link to today's date page, "Today, November 10", with its reference and note (no verse loading needed: the note is stored). On 29 February in a leap year it shows 29 February.
4. **How the verses were chosen,** two short sentences (the honest note, 6.3), with the three kinds named.
5. **The year at a glance:** twelve month blocks in a grid (four across on a computer, two on a phone). Each block is the month's name, linking to its month page, and an ordered list of its day numbers, each a link to the date page with an accessible name such as "March 16, John 3:16". 366 short links in twelve calendar blocks, not a scrolling list of rows, so the long-list rule does not apply; they also give search engines a path to every date.
6. **More for birthdays:** links to the occasion verse picker's Birthday occasion (`/occasion-verses?o=birthday`) and to the verse cards page (`/verse-cards`).

### 6.2 A month page, `/birthday-verses/march`

1. **`h1`:** "March Birthday Bible Verses". One sentence: "A verse for every day in March, each with a card to send."
2. **The month's dates,** one row each (28 to 31 rows, under the 50-row window, so no windowing is needed): the date ("March 16") linking to its page, the reference, and the stored note. No verse words are loaded here, so a month page loads nothing but the page itself; the note says what the verse is about.
3. **Previous and next month,** and back to the hub.

### 6.3 A date page, `/birthday-verses/march-16`, top to bottom

1. **Breadcrumb:** Birthday verses › March › March 16.
2. **`h1`:** "Bible Verse for a March 16 Birthday". No year anywhere, so the page is right every year.
3. **The note,** one lead line under the heading: "March 16 · John 3:16: The heart of the gospel: God's love for the world, given in His Son." It is one translatable template with three placeholders (`{date} · {reference}: {note}`), so the language checks find no sentence built from pieces, and the note is shown exactly as stored (never lower-cased or cut, which would break notes that start with "God" or a name). The site names a page's search description from the first `<p>` of 60 or more characters inside the page ([usePageHead.ts](../../../src/components/usePageHead.ts)), so this lead is that paragraph, and it puts the date and the reference in the search snippet; with a note of at least 40 characters it is always over 60, and a test checks that for all 366 dates.
4. **The verse,** large, as page text inside a `<blockquote>` (in a `<div>`, not a `<p>`, so it is not mistaken for the description), with its reference linked to the reader at the verse (`/read/bsb/JHN/3?hl=16`). The words come from the Berean files at load time (`loadChapterPlain`), tidied with the generator's `closeNoteGaps` so the page and the card read the same.
5. **Where the number comes from,** one small line, by kind (4.1):
   - date: "Chapter 3, verse 16: the third month and the sixteenth day."
   - flipped: "Chapter 31, verse 7: the day and the month of July 31."
   - chosen: "No verse numbered for this date fits a birthday card well, so this one was chosen for it."
   Then the honest note, the same on every page: "The Bible gives no verse to any date. These are chosen as gifts to read and pray for someone, not as signs." And where the entry has a `context` line, it follows here ("Many look for Jeremiah 29:11 on this day. It was a promise to the exiles in Babylon, so we chose…").
6. **In its place:** the verse before and the verse after, smaller and quieter, with "Read John 3" to the reader. They come from the chapter already loaded for item 4, so nothing extra is fetched. At a chapter's first or last verse, only the side that exists is shown. This is what gives each page more than one sentence of its own, and it is Scripture, not made-up text.
7. **Send it as a card:** the shared share panel (7.1), with its heading "Make a birthday card".
8. **Send a birthday message:** the text message box (7.3).
9. **Around this date:** the previous and next date (with their references), "All March birthday verses", and "More verses for a birthday" (the occasion picker).
10. **Source line:** "Scripture quotations are from the Berean Standard Bible, which is in the public domain."

### 6.4 29 February

- It has its own verse and page like any other date (the slot already has the key).
- Its page adds one line: "Born on February 29? Many celebrate on February 28 or March 1 in other years; here are those verses too," with both links.
- The February 28 and March 1 pages each add one line: "Born on February 29? Its verse is here."
- The hub's chooser always offers 29 for February. "Today" shows February 29 only in a leap year, because it reads the visitor's real date.

### 6.5 Loading, failure and accessibility

- A date page loads one Berean chapter file (a few kilobytes); hub and month pages load none.
- If the chapter file fails to load: the page still shows the heading, the reference, the note and the links, with "The verse could not be loaded. Read John 3:16 in the reader." The card panel is not shown without the words (it cannot draw a verse it does not have); the message box falls back to reference and link only.
- Headings in order; the month blocks are `<nav>` lists of links; every link has an accessible name with the date written out; the card preview carries the generator's `role="img"` and `aria-label` (step 16).
- Works on a phone first: the date chooser and buttons are full width under 640 px.

## 7. The card, sending it, and the picker's date field

### 7.1 The card, through the shared generator

No new drawing code. The feature's adapter, `src/pages/birthday-verses/card.ts`:

```ts
export const toCardSpec = (date: string, words: { text: string; reference: string; book: number }): CardSpec => ({
  passage: words,                                     // Berean words read on the page, book 1–66 for the Book colour design
  heading: "Happy birthday",                          // drawn above the verse; 14 characters, under the 40 limit
  link: birthdayUrl(date),                            // https://bibleguide.io/birthday-verses/march-16
  look: "paper",                                      // default; the panel offers all six built-in designs
});
```

and the page drops in `<CardSharePanel spec={toCardSpec(date, words)} allowLine />`:

- **The visitor's own line** ("Add a line (optional)", 60 characters), for example "Happy birthday, Anna! Love, Sam". It is drawn on the picture only; the generator already guarantees it never reaches the link, the share text or a preview.
- **Sizes:** all four (square for chats, portrait for Instagram, story for status and stories, wide for email and X). With the 300-character limit of 4.2, every chosen passage fits all four even in the worst case, the "Happy birthday" heading plus a full 60-character line of the visitor's own: measured in the review with the generator's `fitSizes` and its test measure, a 300-character passage in that worst case still fits `wide` at 48 px (its floor is 36 px; even 400 characters fit, at 40 px). A test proves it for every chosen passage (9.1).
- **Designs:** the six built-in ones, Paper first. No birthday-only colours at launch: twelve month colours would be a new visual design, which the site's rules send to the owner as mock-ups first ([AGENTS.md](../../../AGENTS.md)). Noted as a later option (12).
- **What goes out with the picture** is the generator's fixed share text, "John 3:16 (BSB)" and the date page's address; the picture itself carries "Happy birthday", the verse, the reference, the visitor's line and "Berean Standard Bible · bibleguide.io". The file is named by the generator, `John-3-16-Bible-Guide.png`.

The shared generator and panel are used as they are: this feature changes no file in [src/lib/verse-card/](../../../src/lib/verse-card/) or [src/components/verse-card/](../../../src/components/verse-card/).

### 7.2 Why the card links to the date page, not the verse-card page

The person who receives the card and opens the link should land on "Bible Verse for a March 16 Birthday", with the verse, its place in the chapter and a way to send one back, not on a general verse-card maker. The verse-card page for John 3:16 stays one tap away through the reader link.

### 7.3 Sending a birthday message (text)

For the many people who send a text, not a picture. A small box under the card:

- **"Their name (optional)"**, 40 characters, `autocomplete="off"`, no `name` attribute, outside any `<form>` (the occasion picker's privacy pattern).
- **The message**, shown as it will be sent and editable in a text box:

  ```
  Happy birthday, Anna! A verse for your day:

  "For God so loved the world that He gave His one and only Son, that everyone who believes in Him shall not perish but have eternal life." John 3:16 (BSB)

  https://bibleguide.io/birthday-verses/march-16
  ```

  Without a name the first line is "Happy birthday! A verse for your day:". The verse is in the message so it stands on its own where links show no preview (the countdowns rule). The link carries no name and no tracking.
- **Buttons:** **Share** (the phone's share sheet with text, where `navigator.share` exists), **Copy message**, **Email** (`mailto:` with subject "Happy birthday"), **Text message** (`sms:?&body=`), each with the site's usual fallbacks and wording: "Copied", and the "Press and hold to copy" box when the clipboard is refused.
- Built by the feature's own `birthdayMessage({ name, text, reference, url })` in `message.ts`, following [countdowns/message.ts](../../../src/pages/countdowns/message.ts): a few lines of its own rather than an import, as the sympathy, countdowns and home-blessings features each keep their own small builder, because each one's words and subject line belong to its occasion. The fixed words are translatable templates with placeholders, so the English check finds no sentence built from pieces.

### 7.4 What leaves the visitor's device

Nothing, until they press a share button themselves. No name, line or date is sent to Bible Guide or stored in the browser; the page has no analytics (the site sets none) and adds no `localStorage`. The card page already says "Cards are drawn on your device. Nothing you type is sent or saved."; the message box says the same in one line.

### 7.5 The occasion picker's date field

The picker's design (section 6) planned "a date field ('Your verse for your birthday') once all 366 dates are filled". Step 19 adds it inside the picker's Birthday occasion, in the picker's own files ([OccasionVersesPage.tsx](../../../src/pages/occasion-verses/OccasionVersesPage.tsx)), as small as it can be: the same Month and Day selects as the hub (not a year-asking date field, for the reason in 6.1), showing the chosen date's reference and note with "Add to Our list" (the picker's usual button) and "Open this date's page and card" linking to `/birthday-verses/<month>-<day>`. The date is never put in the picker's address, as its design requires. The picker's design said "its card would use the life-event card maker"; the date page's verse-card panel replaces that, so the picker links to it rather than building a second card. If the picker's files are being changed by another job when step 19 runs, this field waits and is reported, rather than risking a clash (the verse-cards precedent).

## 8. Being found

### 8.1 Titles, sitemap and links in

- **Search title** for the hub in `ROUTE_TITLES` ([page-head.ts](../../../src/lib/page-head.ts)): "Birthday Bible Verses: A Verse for Every Day of the Year" (56 characters). Month and date pages are named from their own `h1` by the site's rules: "Bible Verse for a March 16 Birthday · Bible Guide".
- **One page type, "birthday-verses"**, in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), fed by `birthdayVersePaths()` exported from the feature's data index (the `countdownPaths()` model): 379 addresses (hub, 12 months, 366 dates), all in the sitemap.
- **Links in:** the Tools hub entry goes live at `/birthday-verses` (its navigation entry under the build rules); the occasion picker's Birthday occasion links to it (7.5). No header tab and no home-page change (a home-page change is a redesign that needs the owner's mock-up approval).

### 8.2 Ready-made copies for crawlers

Search engines that do not run the page's code must still see each date's verse. The site's usual way, capturing pages from the live site after a release ([capture.ts](../../../scripts/seo/capture.ts)), works only after the owner releases, and captures what a browser drew at that moment. These pages are fully known in advance (a date, a stored note, Berean words), so the feature writes its own copies at release instead:

- `scripts/birthday-verses/pages.ts` (pure, tested) builds, for each of the 379 addresses, the page's title, description, canonical address and plain HTML body (the `h1`, the verse with its reference, the note, the "where the number comes from" line, the verses before and after, and the links of 6.3 item 9), using the already-exported `fillShell` and `escape` from [shell.ts](../../../scripts/seo/shell.ts), so no shared release script changes.
- `scripts/birthday-verses/previews.mjs` writes those files into the release package (`birthday-verses.html`, `birthday-verses/<month>.html`, `birthday-verses/<month>-<day>.html`, matching `readyMadeFile` in [build.ts](../../../scripts/seo/build.ts)) together with the preview pictures of 8.3. It runs **before** the site's copy step, which skips any address that already has a real file, so the two never fight; the copy step's "a real file is there" lines for these addresses are expected.
- The copy sits inside `#root`, visually hidden, and the app replaces it when it starts, exactly like the site's other copies.
- **The hub's copy leaves out "Today"** (6.1 item 3): written at release, it would freeze the release day into the page for every crawler. It holds the heading, the "how the verses were chosen" lines and the twelve month lists of links.

### 8.3 Link-preview pictures

When someone pastes a date page's link into a chat, the preview should be that date's card. The verse-card design already planned "later, the 366 birthday verses" ([design 8.1](../verse-cards/design.md)).

- Drawn by the **same** bundled entry the verse-card previews use ([preview-entry.ts](../../../scripts/verse-cards/preview-entry.ts), `renderCard` in headless Edge through Playwright, both already in the project), at the `wide` size (1200 × 630), Paper design, heading "Happy birthday", **no personal line ever**.
- Written to `cards/birthday/v1/<month>-<day>.png` in the release package (not in git, not in `public/`); each date page's copy names it in `og:image`, `og:image:alt` (the reference and first words), `twitter:image` and `twitter:image:alt`, replacing the shell's four tags with `replaceOnce`. Hub and month pages keep the site's own preview picture.
- Each picture must be under 300 KB (`MAX_PICTURE_BYTES`; the six verse-card previews measured 69 to 119 KB). A test-run failure names the date.
- `v1` moves to `v2` whenever a date's verse or the card design changes, because chat apps keep an old picture for an old address for weeks.
- **File budget:** 366 pictures plus 379 pages is 745 files, against a release of about 43,800 and the 99,500 limit; the script prints its count and stops, naming the count, if the release would pass `FILE_LIMIT`.
- **When it runs:** at release. Step 19 builds and tests the script and runs it locally on three dates; adding it to the release preparation is one line, done at the next release the owner approves. No release happens in this sequence.

### 8.4 After the owner releases

`bun run seo:indexnow` sends the new addresses to Bing and the other IndexNow engines, as [SEO.md](../../../../SEO.md) describes. Nothing else is needed: the copies are written at release, not captured.

## 9. Tests (step 19)

### 9.1 Data and rules (`src/data/occasion-verses/` and `src/pages/birthday-verses/`)

- `BIRTHDAY_BY_DATE` has exactly the 366 keys of `allBirthdayDates()`, and `birthdayDatesComplete()` is true.
- Every passage is real in the Berean (the picker's existing test), inside one chapter, one to three verses, and at most 300 characters after tidying, read from the site's Berean files.
- No two dates share or overlap a verse.
- `matchKind` is `"date"` or `"flipped"` for at least 342 dates (at most 24 `"chosen"`); a flipped match occurs only on days 13 to 31.
- None of the excluded verses of 4.2.3 appears.
- Balance of 4.2.4: Psalms plus Proverbs at most 122 dates, the New Testament at least 122, no book over 40.
- Every note is 40 to 140 characters and starts with a capital, every `context` at most 200, and no note or context holds ten or more consecutive words of its verse.
- The date page's lead line (6.3 item 3) is at least 60 characters for every date.
- Every passage, made into a card by `toCardSpec`, has no `cardProblems` and fits all four sizes by `fitSizes` (using the generator's test measure, `fixedMeasure` in [test-kit.ts](../../../src/lib/verse-card/test-kit.ts)), both bare and in the worst case: with a 60-character visitor line added (7.1).

### 9.2 Addresses and pages

- `datePath` and `dateFromSlug` round-trip all 366 dates; the forgiving forms of 3.2 resolve; `february-30`, `march-32`, an empty slug and a slug with `..` resolve to nothing.
- `neighbours`: January 1's previous is December 31; February 28 → 29 → March 1.
- The hub renders 12 month blocks and 366 date links; the chooser offers 29 days for February and goes to the right page; "Today" with a fixed clock (including 29 February 2028 and 31 December) links to the right date.
- A date page renders the heading, verse, note, kind line, neighbours and the share panel; a failed chapter load shows the fallback of 6.5 and no panel; a `context` line appears only where stored.
- The message builder: with and without a name; the name never appears in the link; the `mailto:` and `sms:` addresses are encoded.
- A typed name or card line never reaches the address, page title or share text.

### 9.3 Release scripts

The site's unit tests run only files matching `src/**/*.test.{ts,tsx}` ([vitest.config.ts](../../../vitest.config.ts)), so these tests sit in `src/pages/birthday-verses/release-pages.test.ts` and import the script's pure module, as the verse-card previews' tests do ([previews.test.ts](../../../src/pages/verse-cards/previews.test.ts)). A test placed beside the script would never run.

- `pages.ts`: 379 pages with the right titles, canonical addresses and escaped bodies; every date page names its own picture; hub and month pages do not; the hub's copy has no "Today" (8.2).
- `previews.mjs` on three dates (local run, recorded in the feature's README with timings and sizes); every picture under 300 KB.

### 9.4 The site's own checks

`npm test` (content, release and unit tests) and `npm run build`, whose first steps include the English check (no unregistered on-screen English) and the verse-wording check (no verse words stored in code). The occasion picker's own tests run unchanged plus the date field's (7.5).

## 10. Building it (step 19)

### 10.1 Files

**New, the feature's own:**

| File | What |
|---|---|
| `src/pages/birthday-verses/BirthdayVersesPage.tsx` | Routes inside `/birthday-verses/*`: hub, month, date, and the forgiving redirects |
| `src/pages/birthday-verses/Hub.tsx`, `MonthPage.tsx`, `DatePage.tsx` | The three pages of section 6 |
| `src/pages/birthday-verses/DateChooser.tsx` | Month and Day selects (also used by the picker's date field, 7.5, which imports it from here: the one-tool rule makes this feature and the picker one family, and the picker's design already pointed its date field at this work) |
| `src/pages/birthday-verses/MessageBox.tsx`, `message.ts` | The text message of 7.3 |
| `src/pages/birthday-verses/dates.ts`, `verse.ts`, `card.ts`, `format.ts` | Pure helpers of 3.2, 5.2 and 7.1; dates through `dateFormat` at UTC midnight in 2024 |
| `src/pages/birthday-verses/birthday-verses.css` | `bv-` styles |
| `src/pages/birthday-verses/README.md` | What it is, files, translation, checks, the release script and its measured run |
| `src/pages/birthday-verses/*.test.ts(x)` | The tests of 9.1–9.3, the release scripts' included (`release-pages.test.ts`, 9.3) |
| `src/data/birthday-verses/index.ts` | `birthdayVersePaths()` for the sitemap |
| `scripts/birthday-verses/shortlist.ts` | Stage A of 4.3 |
| `scripts/birthday-verses/task.md` | The BatchRunner task file of stage B (the rules of 4.2 and the answer format) |
| `scripts/birthday-verses/pages.ts`, `previews.mjs` | Section 8.2–8.3 |

**Changed, the feature's slot and navigation entries only:**

| File | Change |
|---|---|
| [birthday-by-date.ts](../../../src/data/occasion-verses/birthday-by-date.ts) | Filled with the 366 choices (the slot made for this step; its header comment updated) |
| [OccasionVersesPage.tsx](../../../src/pages/occasion-verses/OccasionVersesPage.tsx) and its README | The date field of 7.5, re-read just before editing |
| [App.tsx](../../../src/App.tsx) | One lazy route, `/birthday-verses/*` |
| [page-head.ts](../../../src/lib/page-head.ts) | One `ROUTE_TITLES` entry |
| [registry.ts](../../../src/pages/tools/registry.ts) | `birthday-verses`: `status: "live"`, `path: "/birthday-verses"` |
| [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts) | One page type |
| The translation register | Status words ("Copied") as the other features registered them |

No file of the shared generator, the shared release scripts, the reader or another feature changes.

**Committing (state found in the review, 2026-11-10):** the slot file, the occasion picker's folders ([src/data/occasion-verses/](../../../src/data/occasion-verses/), [src/pages/occasion-verses/](../../../src/pages/occasion-verses/)) and the Tools hub ([src/pages/tools/](../../../src/pages/tools/)) are not yet in git: other jobs made them and have not committed them, and `App.tsx`, `page-head.ts` and `site-map-rest.ts` carry other jobs' uncommitted changes too. Step 19 re-checks `git status` first. It commits its own new files, and stages only its own lines in a shared file (`git add -p`); where its change sits in a file git does not yet track, it leaves that file uncommitted and names it in its report, rather than committing another job's whole file as its own.

### 10.2 Order of work

1. Dates, addresses and pages against a **test fixture** of 366 fake-but-valid entries (built in the test, never shipped), with their tests: everything can be built and tested before a single verse is chosen.
2. Stage A (shortlist script), then the two BatchRunner pilots of 4.3 (the cost pilot on the full folder, the quality pilot on 02-29, 07-31 and 08-29); read the hard dates' answers against 4.2.
3. The owner's yes (4.3). With it: the full run, then stage C month by month into `BIRTHDAY_BY_DATE`. Without it: the board card, and the report says the choices wait for it.
4. The picker's date field, the route, title, registry, sitemap entries.
5. Release scripts and their local run on three dates.
6. `npm test` and `npm run build`; screenshots of the hub, a month, March 16, February 29 and the card panel on the always-on preview at 127.0.0.1:8931 (never a new dev server, per the project's rules).
7. README, DevLog entry, report.

## 11. Edge cases

| Case | What happens |
|---|---|
| 29 February | Its own verse and page; links to and from February 28 and March 1 (6.4); the chooser always offers it |
| A date typed in another form (`mar-16`, `03-16`, `16-march`) | Opens the date and replaces the address with the official one (3.2) |
| An impossible date (`february-30`, `april-31`, `march-32`) or junk | The hub with "We couldn't find that date" and the chooser |
| A visitor whose clock is near midnight, or in another time zone | "Today" is their own calendar date; date pages carry no "today" at all, so nothing can be off by a day |
| The verse's chapter fails to load | Heading, reference, note and links still show; no card panel; the message falls back to reference and link (6.5) |
| A verse at the start or end of its chapter | "In its place" shows only the side that exists |
| A passage of two or three verses | Its reference names the first verse, which is the date's; the card and message carry the whole passage |
| November 29 (the flip of Jeremiah 29:11) and other famous verses left out | Another verse is chosen; a short honest `context` line may say why (4.2.3) |
| Two dates wanting the same verse | Impossible by construction for matches; the test of 9.1 catches it for chosen verses |
| A long friend's name or line | The name box stops at 40 characters, the card line at 60 (the generator's limit); emoji count as one character (the generator's `visibleLength`) |
| A name with characters that could break a message or page | The message is plain text, encoded into `mailto:`/`sms:` addresses; nothing typed is ever put into HTML or an address |
| In-app browsers (Instagram, Facebook) with no share sheet | The generator's fallbacks: save, or press and hold the picture; the message box's "press and hold to copy" |
| The reader's language is not English | The page's words are translated by the site's system; the verse stays the Berean (`translate="no"`), as everywhere on the site |
| Someone asks "is this my verse from God?" | The honest line on every page: the Bible gives no verse to any date; these are gifts to read and pray (6.3) |
| The owner changes one date's verse later | One line; the address stays; the preview picture's version moves on (4.5, 8.3) |
| The owner's yes for the batch has not arrived when step 19 runs | Everything else is built and tested on a fixture; the choices wait, said plainly (4.3) |
| A release that would pass the file limit | The preview script stops and names the count (8.3) |

## 12. Decisions this design makes, and what is left for the owner

**Made here** (each the obvious choice, so done and reported rather than asked):

- The chapter-and-verse match first, the flip second, a capped free choice last (4.1).
- One list of choices, in the picker's file; date pages as well, because this step's brief asks for them (2.5).
- Addresses `/birthday-verses/march-16`, month pages, no year anywhere (3.2, 6).
- The card links to the date page; built-in designs only; heading "Happy birthday" (7.1, 7.2).
- Ready-made copies and preview pictures written at release by the feature's own script, no shared script changed (8.2, 8.3).

**Left for the owner:**

- **Yes or no to the one small model run** that shortlists verses (4.3): about 1.1 million input tokens on Haiku, up to $3 of plan allowance, a tiny share of the Max plan; if the pilot measures more than $3, the owner is asked again before the run. Step 19 cannot finish the 366 choices without it.
- **Later, if wanted:** twelve month colours for the birthday cards (needs mock-ups for the owner first); a yearly reminder file ("remind me of Anna's birthday") built in the browser like the countdowns' calendar file; photographic or painted card backgrounds when the chapter-scene paintings are published.

## 13. Out of scope for this build

- Any server code, account, stored names or reminders by email.
- A birthday card for printing (the life-event packs and the occasion picker's certificates cover printing).
- Verses in other translations; the site quotes the Berean everywhere.
- Translating the 366 notes into the site's other languages: the notes are plain English data the site's translation system collects like every other feature's; translating them is that system's normal work, not this feature's.
- Deploying. This sequence never releases.

## Review (step 18 of sequence 32, 2026-11-10)

One critical review, against the approved idea ("every date of the year gets its own verse and a shareable card, to send to friends on their birthday"), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the workspace batch rule and BatchRunner's own instructions, and the real code. Every claim about an existing file was checked against that file; two things were measured ($0, throwaway scripts in the review job's own folder, nothing in the site changed).

**What holds up, unchanged:** the match-then-flip-then-capped-free-choice order, and the proof that a flip can never be another date's match; the one list in the occasion picker's existing slot (`BIRTHDAY_BY_DATE`, `allBirthdayDates`, `monthDayOf`, `birthdayDatesComplete` all exist as described, re-exported from the picker's index, with its test that every entry is a real Berean passage); the passage helper `p()` and its `context` extra; the card through the shared generator as it is (`CardSpec` with `passage`, `heading`, `lines`, `link`, `look`; the panel's `allowLine`; the 40-character heading and 60-character line limits; the six designs with Paper the default; the "John 3:16 (BSB)" share text and the `John-3-16-Bible-Guide.png` file name are all real); the left-out verses, which match the picker's list; the page inventory feeding the sitemap; the ready-made copy step skipping any address that already has a real file; the release wiring left for the next approved release, the same as the verse-card previews; the honest "no verse is given to any date" line; and the edge cases. The design fits the build rules: Berean only, no runtime model, a new route with its Tools hub entry as its navigation, no deploy.

**What changed, and why:**

1. **The model run could not have been piloted as written.** BatchRunner's `--pilot 3` chooses its own three items by size, so "pilot on 02-29, 07-31 and 08-29" was impossible; its default model is Sonnet, not Haiku; and the cap "$3 or the pilot's suggestion, whichever is lower" would have stopped the run part-way whenever the suggestion was higher, wasting what it had spent. Now (4.3): two pilots, one on all dates for the cost and one on a folder holding only the three hard dates for quality; `--model haiku` and `--schema` named; the full run uses the pilot's own suggested cap, and if that is above the $3 the owner is asked about, the run does not start and the owner is asked again with the measured figure.
2. **The build rules say to reuse the site's own data, and the design did not use the verses the site has already hand-picked.** Measured: 254 of the 366 dates have at least one date-matched or flipped candidate already on one of the site's curated lists (the verse of the day's pool, "when you're…", countdowns, life events, sympathy, prayers, home blessings, the occasion picker), 153 have two or more; November 29, for example, has Psalm 29:11 ("the LORD blesses His people with peace") where Jeremiah 29:11 is left out. Those verses have already been read once for warmth and for context, so the shortlist now marks them and the choosing prefers them when they fit (2.3, 2.4, 4.3). Being on a list is only a preference: some listed verses (Mark 8:29) are no birthday verse.
3. **The date page's first line would have mangled some notes.** It lower-cased the stored note after "For March 16:" (a note starting "God…" would have read "god") and added the reference only sometimes, which is a sentence built from pieces that the site's language checks stop. Now it is one translatable template, "March 16 · John 3:16: {note}", with the note shown as stored; notes are 40 to 140 characters and start with a capital, so the line always clears the 60 characters the site needs for a search description, and the snippet carries both the date and the reference (5.1, 6.3, 9.1).
4. **The release-script tests would never have run.** The site's unit tests only pick up `src/**/*.test.*`; a test beside the script under `scripts/` is silently skipped. They now sit in `src/pages/birthday-verses/release-pages.test.ts`, as the verse-card previews' tests do (9.3, 10.1).
5. **The card-size test did not cover the worst case.** It now proves every passage fits all four sizes also with "Happy birthday" and a full 60-character visitor line. Measured with the generator's own fitting code: a 300-character passage still fits the short wide card at 48 px in that case, above its 36 px floor (7.1, 9.1).
6. **The hub's ready-made copy for search engines would have frozen "Today" to the release day.** It now leaves that line out (8.2, 9.3).
7. **Commits.** The slot file, the occasion picker and the Tools hub are other jobs' work that is not yet in git, and three shared files carry other jobs' uncommitted changes. Step 19 now stages only its own lines and names, rather than commits, any untracked file it had to change (10.1).
8. **Smaller corrections:** `fillShell`, `replaceOnce` and `escape` live in [shell.ts](../../../scripts/seo/shell.ts), not the verse-card preview script (2.4); the reader link uses the generator's existing `readerPath` (2.4); "the chapter already loaded for item 3" is item 4 (6.3); the hub's search title is 56 characters, not 55 (8.1); the reason given for the message builder having its own few lines ("features do not import each other") was not a site rule (pages do import across features, and this design has the picker import the date chooser), so it now gives the real reason: each feature's message words belong to its occasion (7.3).

**Not changed, on purpose:**

- **The occasion picker's date field (7.5) stays**, although the build rules ask each chain to touch only its own feature: the picker's own design planned this field for the day the 366 dates are filled, the one-tool rule for occasions makes the two one family, and the design already says the field waits and is reported if another job is changing the picker at the time.
- **The date pages stay**, as the step-17 design argued: step 19 is checked against "all 366 dates have a page", which is this sequence's own brief and outranks the general one-tool rule where they differ.
- **The owner's yes to the model run is still needed** and is still not on record (checked 2026-11-10: nothing on the decision board or in this sequence's plan). Without it, step 19 builds and tests everything against a fixture, asks on the decision board, and cannot pass its "all 366 dates" check until the yes comes. Reading all ~9,000 candidates in the implementing job instead would cost more of the owner's plan on the most expensive model, which is what the batch rule exists to prevent.


