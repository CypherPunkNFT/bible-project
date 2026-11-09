# Countdowns — design

**Status:** research & design, written in step 7 of sequence 33 ("Bible Guide chain D: life moments"), 2026-11-07; reviewed once and corrected in place in step 8 the same day (see section 12, Review). The next step implements it.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 8: "Daily reading plus a card leading up to an occasion. Advent and Lent to start, with countdowns for many different occasions; churches can share them with their congregations." This step's brief adds: build it to support many occasions (Easter week, Pentecost, a wedding, a baby's due date, custom dates), and cover the content for each day (stored ahead of time), the date logic including moveable feasts, progress kept in the browser, and sharing with a congregation.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)
**Siblings it builds on:** [life-event-packs/design.md](../life-event-packs/design.md) (passage helpers, home printing, QR codes) and [sympathy/design.md](../sympathy/design.md) (the share-a-message pattern, permanent link keys, no visitor text in links). Where this document says "as in the life-event packs" or "as in sympathy", the rule there applies unchanged.

## 1. What we are building, in one paragraph

A section of the site, **/countdowns**, where each **occasion** is a run of days leading up to a date. Every day has one short Berean Standard Bible reading, a few lines of reflection, a one-sentence prayer, an optional question for families or groups, and a **day card**: that day's key verse with "12 days until Christmas" on it, ready to share. Two seasonal countdowns launch: **Advent** (from Advent Sunday to Christmas Day, 22 to 29 days depending on the year) and **Lent** (the 47 days from Ash Wednesday to Easter Day). A third, **Holy Week**, is the last eight days of Lent shown on their own page, so it needs no new writing. Each countdown works out its own dates every year, including Easter, which moves. A visitor can tick off the days they have read; that record stays in their own browser and is never sent anywhere. Churches get a **"For your church"** panel on each countdown: a link and QR code that everyone opens to the same day on the same date, a printable one-page reading plan and a half-page bulletin insert, an "Add to calendar" file with one entry a day, and a ready-made announcement to paste into a newsletter. The engine also handles occasions whose date the visitor chooses (a wedding, a baby's due date, any date), and those are added later as data, without changing code; section 5.3 sets out their content. Nothing costs anything to run. All the writing is done once, by hand, before release and stored in the site's files. Nothing a visitor types is stored by the site or placed in a link.

## 2. Research

### 2.1 What people look for

Advent and Lent are among the most searched devotional topics of the year. The searches cluster around a plan to follow and something to use with others: "advent reading plan", "advent devotional", "advent scripture readings by day", "advent candle readings", "jesse tree readings", "lent reading plan", "40 days of lent scripture", "lent devotional", "holy week readings", "ash wednesday scripture", "advent calendar bible verses". Personal countdowns are searched as "wedding countdown bible verses", "bible verses for each week of pregnancy" and "countdown to due date verses".

What ranks today falls into four kinds:

1. **Church and blog PDFs.** A list of dates and references, sometimes with a printable bookmark, for example [Flourishing Mama](https://flourishingmama.com/advent-bible-reading-plan/), [Church Posting](https://churchposting.com/resources/worship/advent-readings/) and [The Purposeful Mom](https://thepurposefulmom.com/lent-bible-reading-plan-2022-free-printable.html). The reader has to look each passage up somewhere else, and the dates are usually printed for one year only.
2. **Family guides**, such as [Clarity Church's Advent devotional](https://www.claritychurch.org/advent-devotional-2026/): four candle Sundays, each with a reading and a family question, plus 25 daily December readings. Good material, but locked in a PDF.
3. **Apps**, such as [Sacred](https://thesacredapp.com/blog/advent-devotional-2026) and YouVersion plans: a daily reading, a weekly theme and a prayer. They need an account or an install, and most count streaks.
4. **Jesse Tree sets** ([Confessions of a Homeschooler](https://www.confessionsofahomeschooler.com/blog/2015/11/the-jesse-tree-free-printable.html), [Faithful Kids](https://faithfulkids.app/printables/jesse-tree)): one Old Testament story a day from Creation to the birth of Christ, with an ornament for each, December 1 to 24 or 25.

The gaps this feature fills: the passage is printed in full on the page, so nobody has to look it up; the dates work themselves out every year, so a church never sends out last year's plan; it works on a phone with no install and no account; one link serves a whole congregation; and nobody is made to feel guilty for missing a day (2.5).

### 2.2 How Advent plans are built, and the date problem they all dodge

Advent begins on **Advent Sunday**, the fourth Sunday before Christmas. That is the Sunday falling on or nearest to 30 November, so always between **27 November and 3 December** ([Advent Sunday](https://en.wikipedia.org/wiki/Advent_Sunday); [movable observances](https://en.wikipedia.org/wiki/List_of_movable_Western_Christian_observances)). One web source gives 28 November as the earliest date; that is wrong. The verification in 2.6 confirms 27 November, for example in 2022, 2033 and 2039. Counting from Advent Sunday to Christmas Eve, **Advent is anywhere from 22 to 28 days long**, and each length comes up in about one year in seven.

Published plans deal with the varying length in one of two ways:

- **By calendar date** (most devotionals, every Jesse Tree, most Advent calendars): one reading for each of December 1 to 24, or to 25. The plan never changes length, and the Christmas story always falls on the right days. What it gives up: in years when Advent Sunday falls in late November, the first few days of Advent have no reading.
- **By week** (candle plans): four Sunday themes, usually hope, peace, joy and love ([Crosswalk](https://www.crosswalk.com/special-coverage/christmas-and-advent/what-are-advent-readings.html), [Christianity.com](https://www.christianity.com/wiki/holidays/advent-wreath-meaning-of-advent-candles.html)), with weekday readings under each. The fourth week shrinks to between one and seven days. The traditional candle names are the prophecy candle, the Bethlehem candle, the shepherds' candle and the angels' candle, and a white Christ candle is lit at Christmas. The order of the themes varies between churches; one Anglican church, for example, uses hope, love, joy, peace ([Christ the Redeemer](https://ctrfw.org/advent)). The wreath itself is a 19th-century Lutheran custom (Johann Hinrich Wichern, Hamburg, 1839).

**Design decision (4.2):** combine the two. The daily readings follow the calendar date, December 1 to 25, plus up to four "first days of Advent" readings for 27 to 30 November, which appear only in years when Advent has already begun by then. The candle themes are a separate panel added on each Advent Sunday, whatever date it falls on. Nothing is ever dropped from the main sequence, and every Advent Sunday has its candle.

### 2.3 How Lent plans are built

Lent runs from **Ash Wednesday to Holy Saturday**. It is described as "forty days", but it spans 46 calendar days, because the six Sundays are not counted: each Sunday is a little Easter, a celebration of the resurrection. So Ash Wednesday always falls **46 days before Easter** ([History.com](https://www.history.com/articles/lent-history); [Learn Religions](https://www.learnreligions.com/how-date-of-ash-wednesday-determined-542441)). Published plans handle Sundays in three ways ([BibleStudyTools](https://www.biblestudytools.com/bible-study/topical-studies/40-day-lenten-devotional-article.html), [Do Not Depart](https://donotdepart.com/40-days-jesus-reading-plan-lent), [Kathy Howard](https://www.kathyhoward.org/free-bible-reading-plan-for-lent/)):

1. 40 readings with Sundays left free, often suggested as catch-up days (the most common);
2. 40 readings plus six Sunday readings on the resurrection;
3. a numbered reading for every one of the 46 days.

**Design decision (4.3):** the second way, plus Easter Day itself, making 47 entries. Weekdays are numbered "Day 12 of 40", which matches how people speak of Lent. Sundays are labelled "A Sunday in Lent", each with a short resurrection passage, and their page says plainly that Sundays are not counted. The countdown line ("23 days until Easter") counts calendar days. Lent's length never varies, so its dates are simply "n days before Easter".

### 2.4 Where Baptists stand on the seasons

The site writes in agreement with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). The confession says nothing about a church calendar, and Baptists hold that "the sole authority for faith and practice" is Scripture. What Southern Baptist sources say:

- The ERLC (the Southern Baptist Convention's ethics agency) calls observing Lent, for most Southern Baptists, "a matter of personal conviction and conscience". It is less prominent in SBC churches than in Anglican ones, but it is "a meaningful time for many Southern Baptists who choose to participate" ([ERLC explainer](https://erlc.com/resource/explainer-what-you-should-know-about-lent/)).
- The Baptist Paper: for Southern Baptists, the point of Lent "is not on giving up something for the sake of giving it up". Many give up something that distracts them from God ([The Baptist Paper](https://thebaptistpaper.org/lent-what-you-should-know-about-this-season/)).
- Lifeway Research, reported by Baptist Press: about a quarter of Americans observe Lent, and some Baptist pastors are uneasy with it. One wrote that his own attempt "does not memorialize the death of Christ as much as it trivializes it" ([Baptist Press, 2025](https://www.baptistpress.com/resource-library/news/most-americans-skip-lent/); [Baptist Press, 2017](https://www.baptistpress.com/resource-library/news/lent-has-narrow-appeal-lifeway-research-reports/)).
- Advent is more widely kept in Baptist churches (candles, Christmas readings), and SBC churches already keep a week of prayer before the Christmas offering for international missions and the Easter offering for North American missions ([Baptist News Global, 2009](https://baptistnews.com/article/increasingly-baptists-turning-to-the-observation-of-lent/)).

**Rules that follow** (they bind the writing in 4.5):

1. **A help, never a duty.** Each seasonal page says in its introduction that Scripture does not command the season, and that many Christians, Baptists among them, keep it freely as a way to prepare for Christmas or Easter. Romans 14:5–6 ("each one should be fully convinced in his own mind") is the ground. No page says anyone ought to keep it.
2. **No merit in the practice.** Nothing suggests that giving something up, fasting or reading every day earns favour with God. Fasting is presented as Jesus speaks of it in Matthew 6:16–18: voluntary, quiet and directed to God. Salvation is by grace through faith (the confession's article 4).
3. **Scripture only, no invented liturgy.** No ashes ritual, no saints' days, and no prayers addressed to anyone but God. Mary appears as Luke presents her, favoured, blessed among women, and the Lord's servant, and the site's voice does not go beyond that. The traditional antiphons sung on the days before Christmas (the "O Antiphons") are not used: they are church texts, not Scripture.
4. **Both comings.** Advent looks back to the first coming and forward to the second. The first readings (watchfulness, Mark 13) say so, in line with the confession's article 10, on last things.
5. **The cross at the centre of Lent.** Good Friday's reflection speaks of Christ's death in the confession's terms (article 4: Christ's substitutionary death; "by His stripes we are healed", Isaiah 53:5). Easter Day speaks of a bodily resurrection.
6. **Western dates.** The site's Easter is the Western (Gregorian) Easter kept by Baptist, Catholic and most Protestant churches. Orthodox Easter, often later, is mentioned in one line (9, edge cases) and not computed.

### 2.5 Progress without guilt

Devotional apps lean on streaks, and the common complaint is the guilt of a broken one. Lent plans make the opposite point: Sundays are suggested as catch-up days, and "don't worry if you miss a day" is common advice. This design therefore keeps **no streak**. It shows "12 of 25 read", leaves every earlier day open, and offers "2 earlier days you haven't read" as a gentle link, never as a warning. Days are marked read by pressing a button, never automatically, so the record means what the reader says it means.

### 2.6 Dates, verified

The date rules were checked by a script in this job's folder, using the standard Gregorian Easter calculation (the Meeus/Jones/Butcher algorithm) over the years 1583 to 4099:

| Fact | Result |
|---|---|
| Easter Day | Between 22 March and 25 April. 2024: 31 Mar · 2025: 20 Apr · 2026: 5 Apr · 2027: 28 Mar · 2028: 16 Apr · 2038: 25 Apr (the latest) · 2285: 22 Mar (the earliest) · 2008: 23 Mar |
| Ash Wednesday (Easter − 46 days) | Between 4 February and 10 March. 2027: 10 Feb. Falls on 29 February in 2096 |
| Palm Sunday (− 7), Good Friday (− 2), Holy Saturday (− 1) | Fixed distances from Easter |
| Ascension Day (+ 39, a Thursday), Pentecost (+ 49) | Pentecost between 10 May and 13 June. 2027: Ascension 6 May, Pentecost 16 May |
| Advent Sunday | First Sunday on or after 27 November. 2025: 30 Nov · 2026: 29 Nov · 2027: 28 Nov · 2028: 3 Dec |
| Advent Sunday to Christmas Eve | 22 to 28 days; across 1900–2200 each length occurs 42 to 44 times |
| Fourth Sunday of Advent falls on Christmas Eve | 2023, 2028, 2034 |
| US Thanksgiving (for a later occasion) | Fourth Thursday of November. 2026: 26 Nov. *Not* always three days before Advent Sunday (that shortcut fails) |

### 2.7 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| A passage as verse ids, from a short reference, with exact "a"/"b" excerpts; one chapter per passage | `p("ISA 9:2-7", role, note)`, `BOOK_NUMBERS`, `LifeEventPassage` | [life-events/types.ts](../../../src/data/life-events/types.ts) |
| Assembling and tidying a passage's words; its reference; its reader link; card length limits (240 full size, 320 smaller) | `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL`, `CARD_MAX` | [passage.ts](../../../src/pages/life-events/passage.ts) |
| Loading verses in the app (always passing `"bsb"`) | `resolveRange`; the loaders [usePackPassages.ts](../../../src/pages/life-events/usePackPassages.ts) and [useSympathyPassages.ts](../../../src/pages/sympathy/useSympathyPassages.ts) are the pattern to copy | [verses.ts](../../../src/lib/verses.ts) |
| Printing one or more sheets: paper size, the `@page` rule, waiting for fonts, spotting in-app browsers, Letter or A4 from the browser's language | `usePrintSheet`, `useFontsReady`, `canPrint`, `defaultPaper`, `<PrintPortal>` | [print-sheet.ts](../../../src/pages/life-events/print-sheet.ts), [PrintPortal.tsx](../../../src/pages/life-events/PrintPortal.tsx) |
| QR code drawn as SVG from the site's public address | `qrModules`, `<QrCode>` | [qr.ts](../../../src/pages/life-events/qr.ts), [QrCode.tsx](../../../src/pages/life-events/QrCode.tsx) |
| The site's public address, never the address the page happens to be open at | `SITE_ORIGIN = "https://bibleguide.io"` | [page-head.ts](../../../src/lib/page-head.ts) |
| Share-a-message pattern: share sheet, then copy, then a box to copy by hand; `mailto:` and `sms:?&body=` links | `buildMessage`, `mailtoHref`, `smsBodyHref` (sympathy's own; their subject line and card address are fixed for sympathy, so this feature writes its own small builder on the same pattern) | [message.ts](../../../src/pages/sympathy/message.ts) |
| Permanent link keys, with a committed list a test checks and an alias list | `passageKey`, `KEPT_KEYS`, `KEY_ALIASES` (the pattern, not the code: countdown keys are day keys, not passage keys) | [card-keys.ts](../../../src/data/sympathy/card-keys.ts) |
| Local calendar-day arithmetic that survives daylight-saving changes; a date read as a calendar date and never through `new Date(text)`; time to local midnight; a test that runs in several time zones | `calendarDay`, `parseDateKey`, `msUntilMidnight`, `daily-dst.test.ts` (in Bible Wordle; this feature writes its own tiny calendar module on the same rules rather than importing from a game) | [wordle/daily.ts](../../../src/pages/games/wordle/daily.ts), [daily-dst.test.ts](../../../src/pages/games/wordle/daily-dst.test.ts) |
| Saving to this browser only: a storage key, rebuilt field by field so damaged data cannot break the page; kept in step across tabs; works without saving in a private window | `useProgress` (`bp-read`), Wordle's `storage.ts` | [progress.ts](../../../src/lib/progress.ts), [wordle/storage.ts](../../../src/pages/games/wordle/storage.ts) |
| Hymns for the season (this collection holds only Watts and the Olney Hymns of Newton and Cowper) | Confirmed ids: `gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come`, `gutenberg-watts-hymns-1-3-behold-the-grace-appears`, `ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes`, `gutenberg-watts-hymns-2-136-the-king-of-glory-sends-his-son`, `gutenberg-watts-psalms-121-2-to-heaven-i-lift-my-waiting-eyes`, `gutenberg-watts-hymns-3-7-when-i-survey-the-wondrous-cross`, `gutenberg-watts-hymns-2-9-alas-and-did-my-saviour-bleed`, `gutenberg-watts-hymns-2-76-hosanna-to-the-prince-of-light`, `ccel-watts-psalms-hymns-iii-1-twas-on-that-dark-that-doleful-night`, `gutenberg-watts-hymns-2-72-bless-d-morning-whose-young-dawning-rays`, `gutenberg-watts-hymns-2-34-come-holy-spirit-heavenly-dove`, `ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound` | [collection.json](../../../data/hymns/collection.json), pages at `/study/hymns/<id>` |
| Topic pages to link to | Confirmed slugs: `birth-of-christ`, `incarnation-of-christ`, `christ-the-messiah`, `prophecies-concerning-the-coming-of-christ`, `second-coming-of-christ`, `waiting-upon-god`, `watchfulness`, `fasting`, `repentance`, `self-denial`, `confession-of-sin`, `crucifixion`, `atonement-by-christ`, `resurrection-of-christ`, `ascension-of-christ`, `pentecost`, `holy-spirit`, `marriage`, `children-the-gift-of-god`, `hope`, `joy`, `peace` | [data/topics/index.json](../../../data/topics/index.json), pages at `/topics/<slug>` |
| Life-event packs to link to (for the later personal occasions) | `wedding`, `engagement`, `expecting`, `new-baby`; the life-event type already has an optional `elsewhere` field (added by sympathy) for links out to other features | [love.ts](../../../src/data/life-events/love.ts), [new-life.ts](../../../src/data/life-events/new-life.ts), [types.ts](../../../src/data/life-events/types.ts) |
| Page titles, descriptions, sitemap, not-found page | As in the life-event packs: the `h1`, the first `<p>` of 60+ characters, `ROUTE_TITLES`, one page type in the design-review inventory | [page-head.ts](../../../src/lib/page-head.ts), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) |

**What does not exist yet:**
- **No church-calendar module.** The only church-date code on the site is Bible Wordle's `easterDate(year)` in [daily-rules.ts](../../../src/pages/games/wordle/daily-rules.ts) (the same Gregorian calculation, returning `"YYYY-MM-DD"`), which the game uses for its own schedule. Nothing computes Advent, Ash Wednesday or the other dates. This feature writes one small module with no imports (6.1) rather than importing from a game, and a test checks that its Easter agrees with Wordle's for every year 1900–2200 (8.3), so the two can never drift apart.
- **No reading-plan feature.** The site has reading *progress* by chapter ([progress.ts](../../../src/lib/progress.ts)) but no plan.
- **No shared verse-card generator.** Chain C's generator (approved idea 4; its design is to live at [docs/features/verse-cards/design.md](../verse-cards/design.md)) had not been written on 2026-11-07: `docs/features/` holds bible-wordle, games-hub, life-event-packs, live-quiz, map-quest, memory-match, odd-one-out, sympathy and whos-older. Section 8.4 describes how the day card switches to it later. The implementation step checks again before it starts.

### 2.8 Neighbouring features: who covers what

| Need | Where it belongs | How the two relate |
|---|---|---|
| Verses and a printable card for the day itself (the wedding, the birth) | Life-event packs (built) | A personal countdown leads up to the day; its last page links to the matching pack. The pack links back through its `elsewhere` field once that countdown exists (5.3) |
| A verse for every date of the year (birthdays) | Birthday verses (approved idea 5, another chain) | Different purpose: one verse for a date, not a run of days. No link needed |
| A verse of the day on a church's own website | Verse-of-the-day widget (approved idea 3, another chain) | Later: in Advent and Lent the widget could show the countdown's reading for the day. Noted for that feature (10); nothing built here |
| Short prayers for a wedding, a birth or a hard week | Prayers for occasions (this chain's step 13) | Personal countdowns link to the matching prayer page once it exists |
| A baby's loss during a due-date countdown | Sympathy, `/sympathy/loss-of-baby` (built) | The baby countdown has a quiet link there and a one-tap "Stop this countdown" (5.3, 9) |

## 3. Occasions

### 3.1 At launch

| Occasion | Address | Target day | First day | Days | Content |
|---|---|---|---|---|---|
| **Advent** | `/countdowns/advent` | Christmas Day, 25 December | Advent Sunday, or 1 December if that is earlier (Advent Sunday falls 27 Nov to 3 Dec) | 25 to 29 | 29 day entries (27 Nov to 25 Dec) and 5 candle panels (4.2) |
| **Lent** | `/countdowns/lent` | Easter Day | Ash Wednesday (Easter − 46) | 47 | 47 day entries (4.3) |
| **Holy Week** | `/countdowns/holy-week` | Easter Day | Palm Sunday (Easter − 7) | 8 | None of its own: it shows Lent's last eight entries, and links to Lent's day pages |

Launching only these three keeps the writing to what the approved spec names (Advent and Lent). The Holy Week page costs only a page, and it answers the "Easter week" request in this step's brief.

### 3.2 Added later as data (no code change), content plans in section 5

| Occasion | Target | First day | Days | Date rule kind |
|---|---|---|---|---|
| **Pentecost: ten days of waiting** | Pentecost (Easter + 49) | Ascension Day (Easter + 39) | 11 | Easter-relative (Acts 1:4–14: the disciples waited and prayed between the Ascension and Pentecost) |
| **A wedding** | The visitor's date | 30 days before | 31 | Chosen |
| **A baby on the way** | The visitor's due date | 30 days before | 31, plus up to 14 "still waiting" days after the due date | Chosen, with days after the target |
| **Any date** ("Waiting well") | The visitor's date | 20 days before | 21 | Chosen |
| Later ideas: Thanksgiving (21 days of gratitude, fourth Thursday of November), a baptism, a mission trip, a move to a new home, a church anniversary | — | — | — | Fixed, nth weekday, or chosen |

A personal countdown's "Days" count includes the day itself: the wedding runs from `d-30` ("30 days to go") through `d-1` to `the-day`, 31 entries in all.

The engine supports all four date-rule kinds from the first release (6.2), and its tests include a chosen-date occasion and an occasion with days after the target, built from test data (8.3). That way the later occasions really are just data.

## 4. Content per day

### 4.1 What a day holds

Every day is stored ahead of time in the feature's data files. Nothing is generated when a visitor opens a page.

| Part | What it is | Limits |
|---|---|---|
| **Key** | Permanent, used in links: `dec-12`, `nov-27`, `day-12`, `sunday-3`, `easter` | Lowercase letters, digits and hyphens; never changed once released (6.5) |
| **Label** (some days) | The day's name in the calendar: "Ash Wednesday", "Palm Sunday", "Good Friday", "Holy Saturday", "Christmas Eve", "Christmas Day", "Easter Day" | — |
| **Title** | A few words on what the day is about: "The shoot from Jesse's stump" | 50 characters at most |
| **Reading** | One or two passages, as verse ids only (never typed text), each within one chapter (the `p()` helper's rule) | Most 300 to 1,500 characters, a two-to-five-minute read; Good Friday and Christmas Day run longer, on purpose |
| **Card verse** | One verse or a short range, normally from the day's reading, for the day card | 240 characters or fewer after tidying (`CARD_FULL`), so it is always printed at full size |
| **Reflection** | The site's own words on the reading: what it says, and why it matters on the way to Christmas or Easter | 60 to 110 words |
| **Prayer** | One or two sentences, addressed to God | 45 words at most |
| **Question** (optional) | One line for a family table or a small group | 120 characters at most |
| **Hymn** (optional) | An id from the site's hymn collection | Must exist (tested) |

The Advent candle panels (4.2) hold a theme, a candle name, one short passage and one sentence a family can read as they light the candle.

### 4.2 Advent: the plan

The arc runs from longing, through God's promises from Genesis to Malachi, to their fulfilment in Luke and Matthew: the shape of the Jesse Tree, but drawn straight from Scripture. Every reference below was checked against the site's Berean files on 2026-11-07 by a script in this job's folder: every verse exists, and every card verse's length is shown in brackets.

**The first days of Advent** (each shown only in years when Advent Sunday falls on or before its date, 6.2):

| Key | Theme | Reading | Card verse [characters] |
|---|---|---|---|
| `nov-27` | Longing for God to come | Isaiah 64:1–4 | Isaiah 64:1 [97] |
| `nov-28` | Keep watch | Mark 13:32–37 | Mark 13:33 [87] |
| `nov-29` | Waiting for the morning | Psalm 130:1–8 | Psalm 130:5 [70] |
| `nov-30` | Salvation is nearer now | Romans 13:11–14 | Romans 13:12 [122] |

**Promises** (always shown):

| Key | Theme | Reading | Card verse |
|---|---|---|---|
| `dec-01` | The first promise | Genesis 3:8–15 | Genesis 3:15 [139] |
| `dec-02` | A blessing for every family on earth | Genesis 12:1–3 | Genesis 12:3 [126] |
| `dec-03` | God will provide the lamb | Genesis 22:6–14 | Genesis 22:8 [117] |
| `dec-04` | The scepter of Judah | Genesis 49:8–10 | Genesis 49:10 [137] |
| `dec-05` | The Passover lamb | Exodus 12:21–27 | Exodus 12:13 [187] |
| `dec-06` | A prophet like Moses | Deuteronomy 18:15–19 | Deuteronomy 18:15 [107] |
| `dec-07` | Ruth, Boaz and a redeemer | Ruth 4:13–17 | Ruth 4:14 [146] |
| `dec-08` | David's throne forever | 2 Samuel 7:8–16 | 2 Samuel 7:16 [98] |
| `dec-09` | The Son, the King | Psalm 2:6–12 | Psalm 2:7 [101] |
| `dec-10` | Immanuel | Isaiah 7:10–14 | Isaiah 7:14 [144] |
| `dec-11` | A child is born | Isaiah 9:2–7 | Isaiah 9:6 [191] |
| `dec-12` | The shoot from Jesse's stump | Isaiah 11:1–10 | Isaiah 11:1 [97] |
| `dec-13` | Comfort, and a voice in the wilderness | Isaiah 40:1–11 | Isaiah 40:11 [139] |
| `dec-14` | Why he came: the Servant who suffers | Isaiah 53:1–6 | Isaiah 53:5 [162] |
| `dec-15` | The righteous Branch | Jeremiah 23:5–6 | Jeremiah 23:5 [190] |
| `dec-16` | Little Bethlehem | Micah 5:2–5 | Micah 5:2 [190] |
| `dec-17` | The messenger before the Lord | Malachi 3:1–4 | Malachi 3:1 [226] |

**Fulfilment:**

| Key | Theme | Reading | Card verse |
|---|---|---|---|
| `dec-18` | An angel in the temple | Luke 1:5–17 | Luke 1:17 [217] |
| `dec-19` | Zechariah's silence, Elizabeth's joy | Luke 1:18–25 | Luke 1:25 [113] |
| `dec-20` | "I am the Lord's servant" | Luke 1:26–38 | Luke 1:38 [112] |
| `dec-21` | Mary visits Elizabeth; Mary's song | Luke 1:39–56 | Luke 1:46–47 [84] |
| `dec-22` | Zechariah's song: the sunrise from on high | Luke 1:67–79 | Luke 1:78–79 [194] |
| `dec-23` | Joseph | Matthew 1:18–25 | Matthew 1:23 [131] |
| `dec-24` (Christmas Eve) | No room | Luke 2:1–7 | Luke 2:7 [152] |
| `dec-25` (Christmas Day) | Good news of great joy; the Word became flesh | Luke 2:8–20 and John 1:1–14 | Luke 2:11 [80] |

**Candle panels**, one on each Advent Sunday (whatever its date) and one on Christmas Day. The panel heading says "If your family lights an Advent wreath", and the introduction notes that churches order the themes differently:

| Panel | Theme · candle | Passage [characters] | Hymn |
|---|---|---|---|
| `candle-1` | Hope · the prophecy candle | Isaiah 9:2 [127] | `gutenberg-watts-psalms-121-2-to-heaven-i-lift-my-waiting-eyes` |
| `candle-2` | Peace · the Bethlehem candle | Luke 2:14 [81] | `gutenberg-watts-hymns-2-136-the-king-of-glory-sends-his-son` |
| `candle-3` | Joy · the shepherds' candle | Luke 2:10 [125] | `ccel-watts-psalms-hymns-i-4-1-shepherds-rejoice-lift-up-your-eyes` |
| `candle-4` | Love · the angels' candle | John 3:16 [135] | `gutenberg-watts-hymns-1-3-behold-the-grace-appears` |
| `candle-christ` | The Christ candle | John 8:12 [163] | `gutenberg-watts-psalms-98-2-joy-to-the-world-the-lord-is-come` |

Hymns for the days themselves (optional field): `dec-11` Joy to the world; `dec-14` and `dec-25` as the implementer judges. The collection holds only Watts and the Olney Hymns, so later carols such as "O come, O come, Emmanuel" are not available, and the plan does not pretend they are.

### 4.3 Lent: the plan

The arc: return to God (Ash Wednesday to Saturday); in the wilderness (week 1); who Jesus is, and the cost of following him (week 2); grace for the thirsty and the lost (week 3); light for those who walk in darkness (week 4); from death to life (week 5); then Holy Week day by day, ending at the empty tomb. Sundays carry resurrection passages, among them the three Old Testament and Gospel passages where the third-day rising is foretold. Checked against the Berean files on 2026-11-07 in the same way as Advent.

| Key | Day | Theme | Reading | Card verse [characters] |
|---|---|---|---|---|
| `day-1` | Ash Wednesday · Day 1 | Return to me with all your heart | Joel 2:12–17 | Joel 2:13 [196] |
| `day-2` | Day 2 | A clean heart | Psalm 51:1–12 | Psalm 51:10 [70] |
| `day-3` | Day 3 | The fast God chooses | Isaiah 58:6–11 | Isaiah 58:11 [180] |
| `day-4` | Day 4 | Treasure in heaven | Matthew 6:16–21 | Matthew 6:21 [58] |
| `sunday-1` | A Sunday in Lent | You will not abandon me to the grave | Psalm 16:8–11 | Psalm 16:10 [84] |
| `day-5` | Day 5 | Tempted in the wilderness | Matthew 4:1–11 | Matthew 4:4 [125] |
| `day-6` | Day 6 | Not by bread alone | Deuteronomy 8:1–3 | Deuteronomy 8:3 [231] |
| `day-7` | Day 7 | A High Priest who understands | Hebrews 4:14–16 | Hebrews 4:16 [133] |
| `day-8` | Day 8 | A way out | 1 Corinthians 10:12–13 | 1 Corinthians 10:13 [229] |
| `day-9` | Day 9 | The crown of life | James 1:12–18 | James 1:12 [161] |
| `day-10` | Day 10 | Show me your ways | Psalm 25:1–10 | Psalm 25:4–5 [150] |
| `sunday-2` | A Sunday in Lent | "Destroy this temple" | John 2:18–22 | John 2:19 [82] |
| `day-11` | Day 11 | "Who do you say I am?" | Mark 8:27–33 | Mark 8:29 [95] |
| `day-12` | Day 12 | Take up your cross | Mark 8:34–38 | Mark 8:34 [170] |
| `day-13` | Day 13 | "Listen to him" | Mark 9:2–8 | Mark 9:7 [115] |
| `day-14` | Day 14 | He humbled himself | Philippians 2:5–11 | Philippians 2:8 [111] |
| `day-15` | Day 15 | Not to condemn, but to save | John 3:14–21 | John 3:17 [100] |
| `day-16` | Day 16 | Set toward Jerusalem | Luke 9:51–62 | Luke 9:62 [110] |
| `sunday-3` | A Sunday in Lent | On the third day | Hosea 6:1–3 | Hosea 6:2 [105] |
| `day-17` | Day 17 | Living water | John 4:7–15 | John 4:14 [153] |
| `day-18` | Day 18 | Come to the waters | Isaiah 55:1–7 | Isaiah 55:7 [180] |
| `day-19` | Day 19 | The lost sheep and the lost coin | Luke 15:1–10 | Luke 15:7 [157] |
| `day-20` | Day 20 | The father runs | Luke 15:11–24 | Luke 15:20 [176] |
| `day-21` | Day 21 | The joy of being forgiven | Psalm 32:1–7 | Psalm 32:5 [162] |
| `day-22` | Day 22 | "God, have mercy on me, a sinner" | Luke 18:9–14 | Luke 18:13 [161] |
| `sunday-4` | A Sunday in Lent | "After three days he will rise" | Mark 10:32–34 | Mark 10:34 [101] |
| `day-23` | Day 23 | The light of the world | John 9:1–7 | John 9:5 [53] |
| `day-24` | Day 24 | Live as children of light | Ephesians 5:8–14 | Ephesians 5:8 [89] |
| `day-25` | Day 25 | The Lord is my light | Psalm 27:1–5 | Psalm 27:1 [116] |
| `day-26` | Day 26 | Treasure in jars of clay | 2 Corinthians 4:5–10 | 2 Corinthians 4:6 [175] |
| `day-27` | Day 27 | What the Lord requires | Micah 6:6–8 | Micah 6:8 [144] |
| `day-28` | Day 28 | Blessed are the poor in spirit | Matthew 5:3–10 | Matthew 5:6 [83] |
| `sunday-5` | A Sunday in Lent | Laid down, and taken up again | John 10:14–18 | John 10:17 [87] |
| `day-29` | Day 29 | "I am the resurrection" | John 11:17–27 | John 11:25–26 [190] |
| `day-30` | Day 30 | Jesus wept, then called Lazarus out | John 11:32–44 | John 11:35 [11] |
| `day-31` | Day 31 | Can these bones live? | Ezekiel 37:1–14 | Ezekiel 37:14 [174] |
| `day-32` | Day 32 | Buried with him, raised with him | Romans 6:3–11 | Romans 6:4 [185] |
| `day-33` | Day 33 | Unless a grain of wheat falls | John 12:20–26 | John 12:24 [141] |
| `day-34` | Day 34 | A face set like flint | Isaiah 50:4–9 | Isaiah 50:7 [142] |
| `sunday-6` | Palm Sunday | The King comes, riding on a colt | Luke 19:28–40 | Luke 19:38 [100] |
| `day-35` | Monday of Holy Week · Day 35 | A house of prayer | Mark 11:15–19 | Mark 11:17 [175] |
| `day-36` | Tuesday of Holy Week · Day 36 | The greatest commandment | Mark 12:28–34 | Mark 12:30 [117] |
| `day-37` | Wednesday of Holy Week · Day 37 | Anointed for burial; betrayed for silver | Mark 14:3–11 | Mark 14:8 [70] |
| `day-38` | Thursday of Holy Week · Day 38 | He washed their feet; the Lord's Supper | John 13:1–15 and Luke 22:14–20 | John 13:34 [103] |
| `day-39` | Good Friday · Day 39 | "It is finished" | Isaiah 53:1–12 and John 19:16–30 | John 19:30 [112] |
| `day-40` | Holy Saturday · Day 40 | The tomb is sealed | Matthew 27:57–66 | Job 19:25 [79] |
| `easter` | Easter Day | He is not here; he has risen | Matthew 28:1–10 and 1 Corinthians 15:3–8 | Matthew 28:6 [80] |

Three choices in this table need a word. **Day 8's** 1 Corinthians 10:13 appears here because it is about temptation, which is exactly its subject. (The sympathy pages keep it off condolence cards because it is so often misquoted to grieving people as "God won't give you more than you can handle".) **Holy Saturday's** card verse is from Job, not the day's reading: the reading ends with soldiers guarding a sealed tomb, and the day's card carries the hope that waits beside it. Its reflection says why. **Day 38** uses "the Lord's Supper", the confession's own name for it (article 7), and the reflection presents it as the confession does: a memorial act of obedience.

Hymns (optional): `day-38` `ccel-watts-psalms-hymns-iii-1-twas-on-that-dark-that-doleful-night`; `sunday-6` `gutenberg-watts-hymns-2-76-hosanna-to-the-prince-of-light`; `day-39` `gutenberg-watts-hymns-3-7-when-i-survey-the-wondrous-cross` and `gutenberg-watts-hymns-2-9-alas-and-did-my-saviour-bleed` (the field takes one id, so the implementer picks one); `easter` `gutenberg-watts-hymns-2-72-bless-d-morning-whose-young-dawning-rays`; `day-22` `ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound`.

**Holy Week** (`/countdowns/holy-week`) lists `sunday-6`, `day-35` to `day-40` and `easter` with their dates for the year. Each links to the Lent day page, so there is one page per day, never two copies.

### 4.4 Introductions

Each occasion page has an introduction of 60 to 160 words. Its first sentence stands on its own and names the season, because it becomes the search description:

- **Advent:** what Advent is (the weeks of waiting before Christmas, remembering the long wait for the Messiah and looking ahead to his return); that the plan runs by date from 1 December, with a few extra first days in years when Advent starts in November; one reading a day, about five minutes; "Advent is not commanded in Scripture; many Christians, Baptists among them, keep it freely to prepare their hearts for Christmas" (2.4, rule 1).
- **Lent:** the forty days before Easter, not counting Sundays; reading through repentance, temptation and grace to the cross and the empty tomb; "Lent is not commanded in Scripture. Many Christians, Baptists among them, keep it freely. Some set something aside to make room for prayer. That earns nothing from God: it is a way to turn toward him" (2.4, rules 1 and 2).
- **Holy Week:** the eight days from Palm Sunday to Easter, day by day through the Gospels.
- **The hub** (`/countdowns`): a daily reading and a card for each day leading up to Christmas, Easter and other days, free, with nothing to sign up for.

### 4.5 Writing the words

**How much:** 76 reflections (29 Advent, 47 Lent), 76 prayers, about 50 questions (the implementer may leave out a question where none is natural), 76 titles (planned above), 5 candle sentences and 4 introductions. At most about 8,500 words of reflection, plus about 2,500 words of prayers and questions.

**Who writes them, and how:** the implementation step writes them by hand, straight into the data files, as the life-event and sympathy steps wrote their notes. That is ordinary authoring of a few files, not a batch of model calls, so it adds no cost beyond the job itself and needs no batch tooling. Advent and Lent are both in scope: the step after it is judged on both countdowns working. The words come to about 11,000, which fits one implementation job if it writes them straight into the data files (Advent first, then Lent, file by file as in 8.1, saving each file as it goes). If it still runs out of room, it says so plainly in its report, naming the Lent days still unwritten, so a follow-up can finish them before release; it does not present a half-written Lent as done. It must never ship days with placeholder text, and it must not drop Lent from the hub to make the build pass. A test rejects empty or placeholder text such as "TODO" or "lorem" (8.3). Drafting with a cheap model through the workspace's batch runner is possible later, especially for the occasions in section 5, but only after the owner has seen a cost estimate and said yes. The house rule on batch work requires that, and an unattended step cannot ask.

**Rules for every word the site writes** (the review step checks the plan against them; some are tested):

1. **Start from the text.** Each reflection says what the passage says before applying it. No allegory that the New Testament does not itself make. Where the New Testament reads an Old Testament passage as pointing to Christ (Isaiah 7:14 in Matthew 1:23, Micah 5:2 in Matthew 2:6, Isaiah 53 in Acts 8:32–35, Hosea 6:2 alongside 1 Corinthians 15:4), the reflection may say so and cite it.
2. **In agreement with the confession** (2.4): grace, not merit; Christ's substitutionary death; a bodily resurrection; both comings; the Lord's Supper as a memorial.
3. **Short and plain.** No exclamation marks except inside quoted Scripture. No "you should", and no guilt about missed days or about whether someone keeps the season at all.
4. **Suitable for a family table.** Nothing a parent would hesitate to read aloud to a ten-year-old; Good Friday and the binding of Isaac (`dec-03`) are handled honestly and gently.
5. **Prayers are addressed to God** (Father, Lord, Lord Jesus), in plain modern English, ending "Amen."
6. **Questions are open,** not quiz questions: "What are you waiting for this year, and how does Simeon's patience speak to that?" Not "Who was Zechariah's wife?" (The question bank already does quizzes.)
7. **Berean wording only** when the reflection quotes Scripture, checked against the files.

## 5. Later occasions: content plans

These are not built in the launch step. They are planned here so the engine is built for them, and each can be added as one data file. References were picked for fit and have not yet been checked against the Berean files the way the launch plans were; the step that adds each occasion checks them with the same data tests.

### 5.1 Pentecost: ten days of waiting (Easter-relative, 11 days)

Ascension Day (Acts 1:1–11) · waiting and prayer in the upper room (Acts 1:12–14) · "I will not leave you as orphans" (John 14:15–18) · "Peace I leave with you" (John 14:25–27) · the Spirit of truth (John 16:7–15) · the promise in Joel (Joel 2:28–32) · a new heart and a new spirit (Ezekiel 36:25–27) · children of God by the Spirit (Romans 8:14–17) · the fruit of the Spirit (Galatians 5:22–25) · sealed with the promised Spirit (Ephesians 1:13–14) · Pentecost Day (Acts 2:1–13 and 2:36–41). Hymn: `gutenberg-watts-hymns-2-34-come-holy-spirit-heavenly-dove`. The introduction says, in agreement with the confession's article 2 (on the Holy Spirit), that the Spirit indwells every believer from conversion. It does not present Pentecost as a second experience to seek.

### 5.2 A wedding (chosen date, 31 days: 30 days to go, then the day)

The arc: God's design (Genesis 2:18–24), covenant love (Ruth 1:16–17; Song of Songs 8:6–7), what love is (1 Corinthians 13:4–7), the household (Ephesians 5:21–33 split over three days; Colossians 3:12–17; 1 Peter 3:7), building on the Lord (Psalm 127:1; Ecclesiastes 4:9–12; Matthew 19:4–6), the first sign at a wedding (John 2:1–11), and on the day itself, the marriage supper of the Lamb (Revelation 19:6–9). The reflections agree with the confession's article 18, on the family: marriage is the covenant union of one man and one woman for life. Its last day links to `/life-events/wedding`, and the wedding pack links back through its `elsewhere` field.

### 5.3 A baby on the way (chosen due date, 31 days plus up to 14 after)

Knit together in the womb (Psalm 139:13–16), a gift from the Lord (Psalm 127:3), known before birth (Jeremiah 1:5; Luke 1:41–44), "For this child I prayed" (1 Samuel 1:27–28), he gently leads those with young (Isaiah 40:11), anguish turned to joy (John 16:21), do not be anxious (Philippians 4:6–7; Isaiah 41:10), teaching the next generation (Deuteronomy 6:4–7; Psalm 78:4). The 14 **"still waiting"** days after the due date (keys `after-1` to `after-14`) are on patience and God's timing (Psalm 27:14; Psalm 31:15; Lamentations 3:25–26; Habakkuk 2:3). After the fourteenth, the page keeps showing `after-14` with "Still waiting? This last reading is here for every day until your baby comes". It does not count up indefinitely. Every page of this occasion carries, at the foot and in small type, "If your pregnancy has ended in loss", linking to `/sympathy/loss-of-baby`, and the "Stop this countdown" control is one tap with no cheerful wording (9). Its last day links to `/life-events/new-baby`, and the expecting pack links here through its `elsewhere` field.

### 5.4 Any date: "Waiting well" (chosen date, 21 days: 20 to go, then the day)

For a move, a surgery date, a homecoming or a church's big Sunday. On waiting on God and his timing: Psalm 27:14; Isaiah 40:31; Lamentations 3:25–26; Habakkuk 2:3; James 5:7–8; Romans 8:24–25; Psalm 37:7; Psalm 130:5–6; Micah 7:7; Galatians 6:9; Philippians 4:6–7; Proverbs 16:9; James 4:13–15; Psalm 31:14–15; Ecclesiastes 3:1–8; Psalm 90:12; Matthew 6:34; Isaiah 26:3–4; Psalm 62:5–8; Hebrews 10:23; and on the day, Psalm 118:24 (21 passages, one per day). Written so that it fits a joyful day and a hard one alike.

### 5.5 Personal occasions and names

A visitor can give a personal countdown a name ("Anna and Tom's wedding"). That name is stored **only in their own browser** (6.4) and shown only there. It is never put in a link, a calendar file's address or a shared message unless the visitor types it into their own message. A shared link carries only the occasion and the date (`/countdowns/wedding?date=2027-06-12`), and the person who opens it sees "A wedding countdown: 34 days to go". The reason is the one the sympathy design gives: a link that showed visitor-written words on bibleguide.io could be used to put any words on the site's own address. The owner may prefer to allow a name in shared links; that is listed as an open question (11).

## 6. Date logic, data and progress

### 6.1 The calendar module

One small file, `src/pages/countdowns/calendar.ts`, with **no imports**, so tests and build scripts can load it as it is (as Bible Wordle's `daily-rules.ts` does). It works only in **plain calendar dates** (`{ year, month, day }`) and whole **day numbers**, never in times of day:

- `dayNumber(date)` = `Date.UTC(year, month − 1, day) / 86 400 000`, and `fromDayNumber(n)` going the other way. Adding n days is adding n to the day number, so daylight-saving changes, month ends and 29 February cannot cause an off-by-one (the rule Bible Wordle and Map quest already follow).
- `today(now: Date)` reads the device's **local** year, month and day. "Today" always means the visitor's own date, and it changes at their own midnight.
- `parseDateKey("2027-06-12")` reads a date written as text strictly: exactly `YYYY-MM-DD`, a real day of a real month (it rejects `2027-02-30`), and a year between 1900 and 2200. It never uses `new Date(text)`, which reads a date as UTC and can land on the previous day in the Americas.
- `easterSunday(year)`: the Gregorian calculation verified in 2.6, in integer arithmetic (`Math.floor`).
- `sundayOnOrAfter(year, month, day)` (Advent Sunday is the first Sunday on or after 27 November) and `nthWeekday(year, month, weekday, nth)` (for Thanksgiving later).
- `msUntilMidnight(now)`, as in Wordle.

### 6.2 Occasions as data

```ts
import type { LifeEventPassage } from "../life-events/types";

/** When the occasion's own day falls in a given year. */
export type DateRule =
  | { kind: "fixed"; month: number; day: number }                       // Christmas: 12-25
  | { kind: "easter"; offset: number }                                   // Easter 0, Pentecost 49
  | { kind: "nth-weekday"; month: number; weekday: number; nth: number } // Thanksgiving (later)
  | { kind: "chosen" };                                                  // the visitor's own date

/** When the countdown starts. */
export type StartRule =
  | { kind: "before"; days: number }                                     // Lent: 46 days before Easter
  | { kind: "sunday-on-or-after"; month: number; day: number };          // Advent Sunday: first Sunday on/after 11-27

/** Which date a day entry belongs to, measured from the occasion's own day ("the target"). */
export type DayAt =
  | { before: number }   // n days before the target; 0 is the target day itself
  | { date: string }     // "12-17": a fixed calendar date in the target's year (Advent)
  | { after: number };   // n days after the target ("still waiting", the baby occasion)

export interface CountdownDay {
  key: string;                    // permanent (6.5)
  at: DayAt;
  label?: string;                 // "Good Friday", "Christmas Eve"
  title: string;                  // 50 characters at most
  readings: LifeEventPassage[];   // role "reading"; one or two, each within one chapter; p() needs a one-line note for each
  card: LifeEventPassage;         // role "card"; 240 characters or fewer after tidying
  reflection: string;             // 60–110 words
  prayer: string;                 // 45 words at most, ends "Amen."
  question?: string;
  hymn?: string;                  // id in data/hymns/collection.json
}

/** An extra panel on a day, such as an Advent candle. `week` n means the date given by the occasion's `start` rule
 *  (Advent Sunday itself, never the earlier `alwaysFrom` date) + 7n days, counting from 0: candle-1 is week 0,
 *  candle-4 is week 3. `before` counts back from the target, as in DayAt (the Christ candle is before 0). */
export interface DayPanel {
  key: string;
  on: { week: number } | { before: number };
  heading: string;                // "Second Sunday of Advent: the candle of peace"
  passage: LifeEventPassage;
  line: string;                   // one sentence to read while lighting the candle
  hymn?: string;
}

export interface Occasion {
  slug: string;                   // "advent"
  name: string;                   // "Advent"
  heading: string;                // h1
  intro: string;                  // 60–160 words; first sentence is the search description
  targetName: string;             // "Christmas", used in "13 days until Christmas"
  target: DateRule;
  start: StartRule;
  alwaysFrom?: string;            // "12-01": days from this date are shown even before the start (Advent)
  afterDays: number;              // how long the page stays on this year's occasion after the target (6.3)
  days: CountdownDay[] | { borrow: string; fromKey: string };  // Holy Week borrows Lent's last eight days
  panels?: DayPanel[];
  maxAfter?: number;              // "still waiting" days shown after the target (the baby occasion: 14)
  topics: { slug: string; title: string }[];
  related: string[];              // other occasion slugs
  elsewhere?: { href: string; title: string }[];  // life-event packs, sympathy, prayers
}
```

**The window** of an occasion in a given year runs from the earlier of its start and its `alwaysFrom` date up to the target day, plus any days after the target that the occasion has. **Every date in the window must have exactly one day entry.** A test checks this for every year from 1900 to 2200 (8.3), so a mistake in the data is caught at build time, not in December. For Advent this one rule does all the work:

- If Advent Sunday is 27 November, the window starts on 27 November and all four "first days" appear.
- If it is 29 November, the window starts on the 29th: `nov-29` and `nov-30` appear, while `nov-27` and `nov-28` fall outside the window and are simply not shown.
- If it is 2 December, `alwaysFrom` keeps 1 December in the window, so the familiar December 1 start still works, and the first candle panel appears on the 2nd.

Panels are added on top of the day's entry and never replace it. In years like 2028, when the fourth Sunday of Advent is Christmas Eve, 24 December shows Luke 2:1–7 *and* the candle of love.

**Days after the target** (only the baby occasion has them): the window runs on past the target for `maxAfter` days, one `after-n` entry each. These days replace that occasion's "afterwards" state (6.3): a baby countdown does not finish three days after the due date. From the day after the last `after` entry, the page keeps showing that last entry with its "for every day until your baby comes" line, and the countdown ends only when the visitor presses "Our baby is here" or "Stop this countdown" (5.3). The exactly-one-entry rule covers the window up to `maxAfter`; the open-ended tail after it is the one stated exception.

**Holy Week borrows Lent's days but has its own window**, from its own `start` (Palm Sunday, Easter − 7) to Easter. Its states (6.3) come from that window, so during the first five weeks of Lent the Holy Week page shows "coming up" with a link to today's Lent reading. It shares Lent's run id (`lent:<Easter date>`), so its read marks are Lent's, and its `afterDays` equals Lent's.

### 6.3 Which year's countdown a page shows

Given today's local date and an occasion with a calendar rule, the page works out the **run** (one year's dates) to show. It takes the first of the runs for last year, this year and next year whose last shown day (the target, plus `afterDays`) is today or later. It then shows that run in one of these states:

| State | When | What the page shows |
|---|---|---|
| **Coming up** | Before the window opens | "Advent 2026 begins on Sunday 29 November, in 22 days." The first day's entry as a preview, the calendar with every door closed, and the church panel at the top, because churches plan weeks ahead |
| **Counting down** | Inside the window, before the target | Today's entry, "13 days until Christmas", the calendar with today marked |
| **The day** | The target day | The target's entry (Christmas Day, Easter Day) with its panel |
| **Afterwards** | Up to `afterDays` after the target: Advent 11 days (to 5 January, the end of the twelve days of Christmas), Lent 7 days (Easter week), personal occasions 3 days (except the baby occasion, whose "still waiting" days take the place of this state, 6.2) | The target's entry, a short closing line, the full plan for anyone catching up, and a pointer onward (after Lent, to Pentecost once it exists; after Advent, to next year's date) |
| Then | — | The next year's run, in the "coming up" state |

**Personal occasions** take the target from the visitor's saved countdown or from `?date=` in the address, read with `parseDateKey`. If the date is further away than the countdown is long, the page says "Your countdown starts on 13 May (30 days before)" and shows the first day as a preview. Dates more than two years ahead are refused, with a plain message saying why. If the target is closer than the countdown's length, the visitor starts partway through. "You started with 10 days to go. The earlier days are here if you'd like them." This is the same "late start" Advent and Lent give anyone who finds them partway through.

**Midnight while the page is open:** the page works out today again when the tab becomes visible (`visibilitychange`) and on a timer set to `msUntilMidnight + 1 second`. A phone left on the page overnight shows the new day in the morning. A day page the visitor is reading never changes under them; only the "today" marks move.

**Pages computed in the visitor's browser only.** "Today" depends on the visitor's clock and time zone, so nothing about today is decided when the site is built. That keeps cached and crawler copies from showing a stale day (7.7).

### 6.4 Progress in the browser

**Storage key:** `bp-countdowns` in localStorage. Like [progress.ts](../../../src/lib/progress.ts), it is never sent anywhere, works without an account, and is kept in step between open tabs (the `storage` event plus a page event).

```json
{
  "v": 1,
  "runs": {
    "advent:2026-12-25": { "read": ["nov-29", "dec-01", "dec-02"] },
    "lent:2027-03-28":   { "read": ["day-1"] }
  },
  "mine": [
    { "id": "k3f9q2", "occasion": "wedding", "date": "2027-06-12", "name": "Anna and Tom", "read": ["d-30"] }
  ]
}
```

- **A run's id is the occasion and its target date**, so each year starts fresh and last year's ticks stay with last year. Holy Week uses Lent's run, so a day read on the Holy Week page is ticked on the Lent page too.
- **Personal countdowns ("mine")** each have a random local id, so a wedding moved to a new date keeps its ticks. The optional name is kept only here (5.5).
- **A day is marked read only when the visitor presses "Mark as read"** (the button becomes "Read ✓", and pressing it again clears the mark). Nothing is ticked automatically.
- **Rebuilt field by field on every read**, as Wordle's storage is: unknown fields are dropped, keys must look like day keys (`^[a-z0-9-]{1,20}$`), at most 60 keys per run, at most 10 personal countdowns, names cut to 60 characters, dates checked with `parseDateKey`. Damaged or hand-edited data comes back as a sound record and never breaks the page. Unreadable data is logged with `console.warn` and treated as empty.
- **Tidy-up:** on save, runs whose target is more than 400 days past are removed.
- **When storage is refused** (a private window, or storage that is full or blocked), the page works as normal, and a quiet line says "Your ticks won't be kept after you close this window".
- **No streaks, no reminders, no counts of missed days** (2.5). The calendar shows "12 of 25 read". If earlier days are unread, a link says "2 earlier days you haven't read", and it opens the first of them.

### 6.5 Keys and addresses

- **Day keys are permanent**, because they sit in people's messages, church newsletters and calendar files for years. Advent uses dates (`dec-12`); Lent uses days and Sundays (`day-12`, `sunday-3`, `easter`); personal occasions use days to go (`d-30` … `d-1`, `the-day`, `after-1` … `after-14`). A committed list of every released key (`KEPT_KEYS`) is checked by a test. A key retired on purpose moves to an alias list that points at its replacement, as sympathy's card keys do.
- **Addresses:** `/countdowns` (hub) · `/countdowns/<occasion>` · `/countdowns/<occasion>/<key>` (a day). Holy Week has no day pages of its own; it links to `/countdowns/lent/<key>`. Personal occasions add `?date=YYYY-MM-DD` and nothing else.
- **An unknown day key** (a mistyped or cut-off link from a newsletter) is replaced in the address bar by the occasion page (a client-side redirect with `replace`, the gentle line passed in the router's state), which then shows "We couldn't find that day; here is today's reading", not the site's not-found page. Redirecting matters because the site derives each page's canonical link from its path ([page-head.ts](../../../src/lib/page-head.ts)): rendering the plan at the mistyped address would give search engines a second copy of it. A retired key in the alias list redirects the same way to its replacement day. A congregation member who mistypes a link should still land on the plan. **An unknown occasion** gets the site's own not-found page.

## 7. Pages and sharing

### 7.1 Routing

One route in [App.tsx](../../../src/App.tsx), `<Route path="/countdowns/*">`, loaded lazily like the life-event and sympathy pages. Unlike sympathy's card links, every countdown page keeps the site's header and footer: these pages are for regular readers, not for someone grieving.

### 7.2 An occasion page, top to bottom

1. **`h1`**: Advent: "Advent Reading Plan: A Daily Devotional to Christmas". Lent: "Lent Reading Plan: 40 Days of Scripture to Easter". Holy Week: "Holy Week Readings: Palm Sunday to Easter".
2. **Introduction** (4.4), the first `<p>` of 60+ characters inside `<main>`.
3. **Status line**, drawn in the browser (6.3): "Advent 2026 · Sunday 29 November to Friday 25 December · Today is 12 December: 13 days until Christmas".
4. **Today**: the day card (7.5), the day's title and reference, "Read today's reading" (to the day page) and "Mark as read". On an Advent Sunday, its candle panel sits beside it. Before the season, the first day is shown as a preview.
5. **The calendar** (7.4), with "12 of 25 read" and the catch-up link.
6. **Every day**: the whole plan as a list, one row a day: this year's date and weekday, the label, the title, the reference and a read mark. At 29 and 47 rows, both stay under the site's long-list threshold of about 50, so the list is drawn in full.
7. **For your church** (7.6).
8. **Explore more**: the occasion's topic pages and hymns, the other countdowns, and for Advent and Lent the Holy Week page.
9. **Source line**: "Scripture quotations are from the Berean Standard Bible (public domain)."

### 7.3 A day page

1. **`h1`**: "Advent, December 12: The shoot from Jesse's stump" · "Lent, Day 12: Take up your cross" · "Good Friday: “It is finished”". The day's stored title is used exactly as written (no automatic title-casing), and fixed text such as headings, shared messages and calendar titles puts the month first ("December 12"), as the site's mostly American readers expect. Dates drawn in the browser (status lines, "This year: …", door labels) are formatted with `Intl` for the visitor's region, so the day-month examples elsewhere in this document are only illustrations.
2. **The date this year**, drawn in the browser: "This year: Saturday 12 December 2026 · 13 days until Christmas". When the page is opened on another day: "This reading is for Sunday 20 December". Day pages are never locked (7.4).
3. **The reading(s)**: full Berean text as real page text inside `.scripture` with `lang="en"`, each reference linked to the reader.
4. **Reflection**, then **Prayer**, then **"Talk about it"** (the question, when there is one), then **"Sing"** (the hymn link, when there is one).
5. **The candle panel**, on the days that have one this year.
6. **The day card** and its share buttons (7.5).
7. **"Mark as read"**, then links to the **previous and next day** and **back to the plan**.
8. **Source line.**

The first `<p>` of 60+ characters is the reflection's first sentence, so each day page has its own search description.

### 7.4 The calendar

- **Advent:** a grid of doors, one per day of this year's window, numbered by date. Today's door is marked. Read days carry a small tick. Days still to come look closed.
- **Lent:** a seven-column week grid from Ash Wednesday. Sundays are set apart (a lighter tile marked "Sunday"), and the Holy Week row is labelled.
- **A door still to come** shows, when tapped, "This one opens on Sunday 20 December", with a small "Read it now" link. Families keep the surprise, and a pastor can still look ahead. Locking would protect nothing (it is all public), and it would stop leaders preparing.
- **Accessibility:** the grid is an ordered list of links, not an interactive grid widget. Each link's label reads, for example, "12 December, Isaiah 11:1–10, read". It works with ordinary Tab navigation. Door animations are left out under `prefers-reduced-motion`.

### 7.5 The day card, and sharing a day

**The card** is drawn on the page in HTML and CSS: the occasion's small line ornament, the day line, the card verse, its reference, and "bibleguide.io/countdowns/advent". The day line comes from the entry, not from today's date, so it is always true for that day: "13 days until Christmas" (a fixed date), "Day 12 of 40 · 33 days until Easter" (a fixed distance from Easter), "Christmas Day", "Easter Day". The look follows the occasion: Advent a deep blue-violet accent and a star (Numbers 24:17; Matthew 2:2), Christmas Day white and gold, Lent a muted purple with a plain line, Palm Sunday a palm branch, Easter Day a sunrise. Colours are fixed values in the feature's own stylesheet, readable in light and dark mode.

**Sharing a day** follows the sympathy pattern (share sheet, then copy, then a box to copy by hand; `mailto:` and `sms:?&body=` links built by the feature's own small message builder):

```
"Then a shoot will spring up from the stump of Jesse, and a Branch from his roots will bear fruit." — Isaiah 11:1 (BSB)

Advent, December 12: The shoot from Jesse's stump
https://bibleguide.io/countdowns/advent/dec-12
```

The verse is in the text itself, so the message stands on its own where links show no preview. The link is built from `SITE_ORIGIN`, carries no tracking, and for a personal occasion carries only `?date=`. Saving the card as an image waits for the shared verse-card generator (8.4).

### 7.6 For your church

A panel on each seasonal occasion page, headed "For your church". This is the main way the spec's "churches can share them with their congregations" is met, with no accounts and no server:

| Item | What it does |
|---|---|
| **One link for everyone** | `https://bibleguide.io/countdowns/advent` with a Copy button. Everyone who opens it sees the right day for their own date, every day of the season, so the church shares one link once. |
| **QR code** | Drawn with the life-event QR module from `SITE_ORIGIN`. "Download QR code" saves it as an SVG file for slides and bulletins. |
| **Print the reading plan** | One sheet, Letter or A4: the title, this year's dates, and every day in two columns (date, weekday, label, reference, a box to tick), with the QR code and address at the foot. It uses the life-event print module with a real page margin; its own sheet component copies the life-event measurements, as sympathy's does. |
| **Bulletin insert** | Two half-sheets per page with a cut line: this year's dates and references in compact form, plus the QR code. |
| **Candle readings for the service** (Advent) | The five candle panels on one large-type sheet for whoever lights the wreath in a service. |
| **Add to calendar** | Downloads `bible-guide-advent-2026.ics`: one **all-day** event per day of this year's run, titled for example "Advent · Dec 12: Isaiah 11:1–10", with the day's link. Each event carries `DTSTART;VALUE=DATE` and `DTEND;VALUE=DATE` (the next day, because the end is exclusive), a `DTSTAMP` (required by the calendar standard, RFC 5545), a `UID`, a `SUMMARY` and a `URL`, inside a `VCALENDAR` with `VERSION:2.0` and `PRODID:-//Bible Guide//Countdowns//EN`. All-day dates have no time zone, so the events land on the right day wherever the phone is. No alarms, because calendar apps treat alarms on all-day events inconsistently. The file is built in the browser (a Blob download), with CRLF line ends, lines folded at 75 bytes, commas, semicolons and backslashes escaped, and unique ids (`advent-2026-dec-12@bibleguide.io`). |
| **Announcement to copy** | An editable paragraph with this year's dates: "This Advent, read along with us: one short Bible reading a day from Sunday 29 November to Christmas Day, free at bibleguide.io/countdowns/advent. Open the link each day and it shows the right reading." The church edits it in the box and copies it. Nothing is sent. |
| **Look ahead** | One line: every day page can be opened early to prepare a sermon or a small-group plan. |

Nothing in the panel collects anything, and the site never learns which church shared what.

### 7.7 Being found

- **One page type, "countdowns"**, in the design-review inventory, fed by one function in the data index. At launch it returns 80 indexable addresses: the hub, the three occasion pages and the 76 day pages. Holy Week has no day pages, and personal pages are indexed only without `?date=`. An occasion added later reaches the sitemap by itself.
- **Search title** in `ROUTE_TITLES` for the hub: "Advent and Lent Devotionals: Daily Bible Reading Plans" (54 characters).
- **No year in headings** ("Advent Reading Plan", never "Advent 2026"), so the pages stay right year after year. The year appears only in the status line and the plan dates, which are drawn in the browser.
- **Crawler copies** are captured by a headless browser and so include that year's dates. They should be refreshed before each season: `bun run seo:capture --only /countdowns` in October and January, after the owner releases. This note goes in the feature's README section.
- Distinct from topic pages: `/topics/birth-of-christ` answers "what does the Bible teach"; `/countdowns/advent` answers "what do I read today".

### 7.8 Entry points

- **Home page:** one new line in the Resources block, beside the life-event and sympathy lines, in [HomePage.tsx](../../../src/pages/HomePage.tsx): "Advent and Lent daily readings". A seasonal home-page banner would be a redesign, which needs the owner's approval of mock-ups first ([AGENTS.md](../../../AGENTS.md)), so it is not part of this build (10).
- **Route:** lines in [App.tsx](../../../src/App.tsx). **Search title:** one entry in [page-head.ts](../../../src/lib/page-head.ts). **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts).
- **No changes to other features' files at launch.** The links from the wedding and expecting packs come with the personal occasions (5.2, 5.3), each as one entry in the pack's existing `elsewhere` field.

## 8. Building it

### 8.1 Data

Under `src/data/countdowns/`: `types.ts` (6.2), `advent.ts` (29 days and 5 panels), `lent-1.ts` (`day-1` to `day-22` and Sundays 1–3) and `lent-2.ts` (the rest), split so each file stays under 500 lines, `holy-week.ts` (a borrow, with no days of its own), `keys.ts` (`KEPT_KEYS` and aliases), and `index.ts` (the occasions in hub order, plus the sitemap address list). As with the life-event and sympathy data, they import nothing through the `@/` alias, so build scripts can read them. They import `p()` from [life-events/types.ts](../../../src/data/life-events/types.ts) by a plain relative path. Verse text is never stored; it is loaded from the Berean files when a page opens.

### 8.2 Files

New, in `src/pages/countdowns/`: the router page, hub, occasion page, day page, calendar, day card, share panel, church panel, print sheets (plan, bulletin insert, candle readings) with their stylesheet, ornaments, `calendar.ts` (6.1), `season.ts` (window and run, 6.2–6.3), `storage.ts` (6.4), `ics.ts`, `message.ts`, a verse loader on the pattern of `useSympathyPassages`, `countdowns.css`, and tests. Reused without change: the life-event print module, passage helpers, QR module and `p()`. Shared files touched by a line or two: [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts). No new dependencies. No `_headers` change: no page needs hiding from search engines.

### 8.3 Tests (added in the implementation step, run with the site's `test` and `build`)

- **Calendar:** Easter for 2008, 2019, 2024–2030, 2038 and 2285 matches 2.6; Advent Sunday for 2022 (27 Nov), 2025–2028; Ash Wednesday 2096 is 29 February; Thanksgiving 2026 is 26 November; `easterSunday` agrees with Bible Wordle's `easterDate` for every year 1900–2200 (the test imports the game's function; the page never does); `parseDateKey` rejects `2027-02-30`, `2027-2-3`, `2201-01-01` and text; adding days crosses month ends, year ends and 29 February correctly.
- **Time zones** (a file of its own, like Wordle's `daily-dst.test.ts`, because it sets the zone for its process): in `America/New_York`, `Europe/London`, `Australia/Sydney` and `Pacific/Auckland`, `today()` changes exactly at local midnight, and day numbers rise by exactly 1 across both daylight-saving changes.
- **Coverage, every year 1900–2200:** each seasonal occasion's window has exactly one entry per date, with no gaps; the target has an entry; Advent's window is 25 to 29 days and never starts after 1 December; Lent's is 47; Holy Week's borrow gives 8 entries in order, and its page is "coming up" until Palm Sunday even while Lent is counting down; every candle panel falls on a Sunday inside the window, or on Christmas Day.
- **The engine on test data:** a chosen-date occasion with `after` days (written in the test file, not the site's data). It checks: a start partway through; the 14-day clamp after the target; a target in the past; a date too far ahead refused; a moved date keeping its ticks.
- **Which run is shown:** with a fixed clock (`vi.setSystemTime`): 1 November shows Advent "coming up"; 12 December "counting down"; 25 December "the day"; 5 January "afterwards"; 6 January next year's "coming up"; Easter + 7 still Lent "afterwards" and Easter + 8 next year's Lent; a page open across midnight moves its "today" mark.
- **Data:** every verse id exists in the Berean files and every range runs forward within one chapter; every card verse is 240 characters or fewer after tidying; every assembled passage has paired double quotation marks and ends on ".", "!", "?" or "…" (as the life-event tests check); keys are unique, URL-safe and in `KEPT_KEYS`, and every kept key still resolves directly or through an alias; titles are 50 characters or fewer; reflections are 60–110 words; prayers are 45 words or fewer and end "Amen."; questions are 120 characters or fewer; nothing is empty and nothing contains "TODO", "TBD" or "lorem"; no "!" appears in the site's own words; every hymn id exists in the collection and every topic slug in the topics index; every occasion intro is 60–160 words and contains no year.
- **Storage:** damaged JSON gives an empty record with a warning; the record is rebuilt field by field; the caps hold; old runs are tidied away; a `setItem` that throws sets the "won't be kept" state; a change in another tab is picked up.
- **Calendar file:** CRLF line ends; no line over 75 bytes; escaping; all-day `VALUE=DATE` start dates matching the run, each with an end date one day later; a `DTSTAMP`, `VERSION:2.0` and `PRODID` present; one event per day; unique ids.
- **Message:** the link starts `https://bibleguide.io/countdowns/` whatever address the test page is at; the text holds the tidied verse and "(BSB)"; a personal link carries only `?date=`; Share is hidden when `navigator.share` is missing; Email and Text links carry the encoded body.
- **Pages** (Testing Library, fixed clock): the hub lists the three occasions; an occasion page lists every day of the run with dates, marks today and shows the candle panel on an Advent Sunday; tapping a door still to come shows its opening date and a "Read it now" link; a day page shows reading text inside `.scripture` with `lang="en"`, the reflection, the prayer and the question; "Mark as read" sets and clears the mark in storage; an unknown day key redirects to the occasion page (the address changes) and shows the gentle line; an unknown occasion shows the not-found page; an invalid `?date=` shows the date form with the reason.
- **Print, in a browser** (Playwright, the e2e folder, run by hand as sympathy's was): the reading plan, the bulletin insert and the candle sheet each print as exactly one page on Letter and on A4.
- **Sitemap inventory:** 80 addresses, and none carries a `?date=`.

### 8.4 Switching to the shared verse-card generator later

When chain C's generator exists, the day card component already builds a plain **card description** (occasion, key, day line, verse text, reference, style). It hands that description to the generator for **"Save as image"** in the share panel, and day pages ask the generator for their **link-preview image** (`og:image`). Printing stays here. Until then the shared message carries the verse in its own text, so nothing is half-built.

## 9. Edge cases

| Case | What happens |
|---|---|
| Advent Sunday on 27 November (2022, 2033) | Window starts 27 November; all four first-days entries shown; 29 days in all |
| Advent Sunday on 2 or 3 December (2029, 2028) | Window still starts 1 December (`alwaysFrom`); the first candle appears on Advent Sunday; November entries not shown |
| Fourth Sunday of Advent on Christmas Eve (2023, 2028, 2034) | 24 December shows its reading and the candle of love together; panels never replace a day |
| A church orders the candle themes differently | The panel heading says "If your family lights an Advent wreath", and the introduction says the order varies; the daily readings do not depend on the candles |
| Ash Wednesday on 29 February (2096), or Lent across a leap day | Day-number arithmetic; tested |
| Easter at its earliest (22 March) or latest (25 April) | Lent is always 47 days; tested across 1900–2200 |
| Orthodox Easter (often a week or more later) | Not computed. One line on the Lent page: "Dates follow the Western calendar used by most Protestant and Catholic churches; Orthodox churches usually keep Easter later." |
| Visitor's clock or time zone is wrong | The page follows the device; nothing to correct. Each day page also shows the date it is for |
| A congregation spread over several time zones | Each person sees the day for their own date; for a few hours two people may be on different days, as with Wordle |
| Page left open past midnight | "Today" moves at midnight (timer and `visibilitychange`); a day being read never changes under the reader |
| Someone finds Lent on day 20 | Late start: today's day shown; earlier days open; "earlier days you haven't read" offered gently |
| Opening a day still to come | Day pages always open, with "This reading is for Sunday 20 December"; calendar doors show the date first, then "Read it now" |
| Visiting between seasons (for example in July) | "Coming up" for the next season, with its dates, the first day's preview and the church panel |
| 26 December to 5 January | Advent "afterwards": Christmas Day's entry, the full plan, next year's start date |
| Storage refused (private window, full or blocked storage) | Works without saving; a quiet line explains |
| Damaged or hand-edited storage | Rebuilt field by field; never breaks the page |
| Two tabs open | Ticks kept in step through the `storage` event |
| Holy Week page and Lent page | One run and one set of ticks; Holy Week links to Lent's day pages |
| Mistyped day key in a newsletter link | Redirected to the occasion page with a gentle line, never "page not found"; the address changes, so search engines never see a duplicate plan |
| A day key retired | The alias list points to its replacement; `KEPT_KEYS` test fails if a key disappears |
| Shared links and visitor words | Links carry only the occasion, a day key and (for personal occasions) a checked date; names stay on the device |
| Invalid, impossible or far-off `?date=` | Date form with a plain reason ("That date doesn't exist" / "Choose a date within the next two years") |
| Personal date already passed | "This day has come", with the last day's entry for 3 days; then "This countdown has finished", with a Remove button. The baby occasion is the exception: it moves on to its "still waiting" days (6.2) |
| Wedding moved to a new date | The visitor edits the date; ticks kept (by local id) |
| Baby arrives early | "Our baby is here" ends the countdown: the last day's entry, the new-baby pack link, then Remove |
| Baby is overdue | Up to 14 "still waiting" days; after that `after-14` stays, with a line for every day until the baby comes |
| A pregnancy ends in loss during a baby countdown | A small link to `/sympathy/loss-of-baby` on every page of that occasion; "Stop this countdown" removes it in one tap with no cheerful wording; there are no reminders that could arrive later |
| A visitor uneasy with Lent | The introduction says it is not commanded and earns nothing; Lent is one occasion among several, never pushed elsewhere on the site |
| Calendar file imported twice | Unique, stable event ids, so most calendar apps update the events instead of adding duplicates |
| In-app browsers (Facebook, Instagram) that cannot print or download | Print and calendar buttons say "Open this page in your browser to print or save", as the life-event print module already detects |
| Share sheet missing (most desktop browsers) or cancelled | Share hidden; Copy, Email and (on phones) Text remain; a cancelled share shows nothing |
| Clipboard blocked | The text appears selected in a box with "Press and hold to copy" |
| Verse text fails to load | "Could not load" with Retry; card share and printing wait until the text loads, and say why |
| Site shown in another language | Pages and reflections stay English and verses stay Berean in this build (`.scripture` with `lang="en"`); dates are formatted with `Intl` in English for the visitor's region (US: "Sunday, November 29"; elsewhere: "Sunday 29 November") |
| Daylight-saving day | Day numbers via `Date.UTC`; tested in four zones |
| Releasing | This feature never deploys; crawler captures and IndexNow only after the owner releases |

## 10. Out of scope for this build

Push notifications and email reminders (they would need a server and stored contact details); accounts and progress synced across devices; a church dashboard showing its members' progress (a server again, and privacy questions); Orthodox dates; translated pages; audio readings; saving the day card as an image and link-preview images (waiting for the shared verse-card generator, 8.4); a printable cut-out Advent calendar (a later print format: one sheet component, no new data); the twelve days of Christmas and Eastertide as count-up plans; a verse-of-the-day widget mode for church websites (belongs to approved idea 3); a seasonal home-page banner (needs mock-ups and the owner's approval); the occasions of section 5 (data only, once written).

## 11. Questions for the owner

The design has a working default for each of these, so none blocks the next steps:

1. **Names in shared personal links.** Default: none. A wedding link says "A wedding countdown", and names stay on the visitor's device, so nobody can put arbitrary words on bibleguide.io through a link (5.5). Allowing a name would make shared wedding and baby countdowns warmer, at that risk.
2. **Should future Advent doors stay closed?** Default: doors look closed and open with one extra tap ("Read it now"); day pages are never locked (7.4).
3. **Lent on a Southern Baptist site.** Default: included, as the spec asks, framed as voluntary and earning nothing (2.4). The owner may prefer the page to lead with "40 days to Easter" over the word "Lent".
4. **Candle theme order.** Default: hope, peace, joy, love, then the Christ candle (the most common order). Churches that differ are told the order varies.
5. **Which personal occasion comes first** after launch: the wedding, the baby or "any date". Default: the wedding, which is the most searched of the three.

## 12. Review

**Reviewed** in step 8 of sequence 33, 2026-11-07, once and critically, against the approved spec (entry 8 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md)), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) and the real codebase. The corrections below are already written into the body above; this section records what changed and why.

### What was checked and found sound

- **Every helper the design reuses exists with the name and role it gives:** `p()`, `BOOK_NUMBERS` and the `elsewhere` field in [types.ts](../../../src/data/life-events/types.ts); `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL` (240) and `CARD_MAX` (320) in [passage.ts](../../../src/pages/life-events/passage.ts); the print, QR, verse-loading and message modules; `SITE_ORIGIN` (`https://bibleguide.io`) and `ROUTE_TITLES` in [page-head.ts](../../../src/lib/page-head.ts); Wordle's `calendarDay`, `parseDateKey` and `msUntilMidnight`; the sitemap inventory's per-feature page types; and `bun run seo:capture --only <prefix>`.
- **Every planned passage exists in the Berean files**, and every card verse is 240 characters or fewer after tidying. **Every hymn id** exists in the hymn collection and **every topic slug** in the topics index.
- **Every date fact in 2.6** was recomputed independently: the Easter dates, Ash Wednesday on 29 February 2096, Ascension and Pentecost 2027, the Advent Sundays (27 November in 2022, 2033, 2039), the fourth Sunday of Advent on Christmas Eve in 2023, 2028 and 2034, and the spread of Advent lengths (22 to 28 days, 42 to 44 years each over 1900–2200). All correct.
- **Counts:** Lent has exactly 47 entries in the right weekday order (40 numbered days, 6 Sundays, Easter Day); Holy Week's borrow gives 8; the sitemap's 80 addresses add up (hub, 3 occasion pages, 29 + 47 day pages). The example dates for 2026 (Advent Sunday 29 November, 12 December a Saturday, Christmas a Friday) are right.
- **Scripture wording** quoted in the body (Isaiah 11:1, Isaiah 53:5, Romans 14:5) matches the Berean text.
- **The rules:** no runtime model cost; existing data reused (passages, hymns, topics, life-event packs, sympathy); Berean only; lists under the long-list threshold; only the feature's own files plus four one-line shared entries; no deployment. The shared verse-card generator from chain C still has no design on 2026-11-07 (`docs/features/` has no `verse-cards` folder), so the day card's plan to switch to it later (8.4) stands.

### What changed, and why

1. **Existing Easter code acknowledged (2.7, 8.3).** The design said nothing on the site computes a church date. In fact Bible Wordle's [daily-rules.ts](../../../src/pages/games/wordle/daily-rules.ts) already has `easterDate(year)`. The design keeps its own import-free module (so a page never depends on a game), and a test now checks the two agree for every year 1900–2200.
2. **Wrong countdown figure (7.5).** "Day 12 of 40 · 30 days until Easter" was wrong: Day 12 of Lent is 33 days before Easter. Corrected.
3. **Personal countdown lengths (3.2, 5.2–5.4).** A countdown that starts "30 days before" and includes the day itself has 31 entries (`d-30` to `d-1`, then `the-day`), not 30. The wedding and baby rows now say 31. "Any date" listed 21 passages but would have needed 22 days; it now starts 20 days before, giving 21 days to match its 21 passages. A sentence in 3.2 states the counting rule.
4. **The baby countdown's ending (6.2, 6.3, 9).** The general rule that personal countdowns finish three days after their date contradicted the baby occasion's "still waiting" days. The body now says the after-days replace that state, the last one stays until the visitor says the baby has come or stops the countdown, and the coverage rule names this open-ended tail as its one exception.
5. **Which date the candle weeks count from (6.2).** "Start date + 7n days" could have been read as the window's first day, which is 1 December in late years, putting every candle on a weekday. It now says the `start` rule's date (Advent Sunday itself), counting weeks from 0.
6. **Holy Week's own window (6.2, 8.3).** The design shared Lent's run with Holy Week but never said which dates drive the Holy Week page's states. It now has its own window (Palm Sunday to Easter) and shows "coming up" during the first five weeks of Lent, while sharing Lent's read marks. A test covers it.
7. **A complete calendar file (7.6, 8.3).** The plan left out fields the calendar standard requires or that apps rely on: `DTSTAMP`, an exclusive `DTEND` for all-day events, `VERSION` and `PRODID`. They are now specified and tested. Without them some calendar apps reject or mis-date the file.
8. **Mistyped day links (6.5, 8.3, 9).** Showing the plan at a mistyped address would give search engines a duplicate page, because the site builds each page's canonical link from its address. A mistyped or retired key now redirects to the occasion page (or the replacement day) with the same gentle line.
9. **Lent must not be dropped (4.5).** The design let the implementation ship Advent alone if the writing would not fit. The next step is judged on Advent *and* Lent working, so the fallback now is to write both (about 11,000 words, Advent first) and, if that truly cannot be finished, to name the unwritten Lent days in the report, never to remove Lent from the hub or fill it with placeholders.
10. **Fixed text in American date order, stored titles as written (7.3, 7.5, 7.6).** The design's own edge cases expect American readers (Letter paper, Thanksgiving, "Sunday, November 29"), but its headings, shared messages and calendar titles used "12 December". Fixed text now reads "December 12"; browser-drawn dates still follow the visitor's region through `Intl`. Day-page headings had been shown in title case while the stored titles are in sentence case, which would have needed an automatic title-caser that gets small words wrong. Headings now use the stored title as written.
11. **Card verse lengths (4.2, 4.3).** Fourteen bracketed lengths were one character too high, because the tidying step drops an unpaired closing quotation mark. They now match the tidied text. No card was near the 240-character limit because of this, and the data test remains the authority.
12. **A small authoring note (6.2).** `p()` takes a required one-line note for every passage, so the data files must give one. Noted in the type.

### Not changed

The open questions for the owner (section 11) stay as written, each with a working default, so none blocks the implementation. The doctrinal framing (2.4), the Advent and Lent reading plans, the privacy rules for personal names (5.5) and the church panel were checked and are kept as designed.

## 13. Implementation notes

**Built** in step 9 of sequence 33, 2026-11-07, to the design above. Advent (29 days, 5 candle panels), Lent (47 days) and Holy Week (Lent's last eight days) are live in the local source; nothing was deployed.

**Where things are:**
- Data: [src/data/countdowns/](../../../src/data/countdowns/): `types.ts`, `advent.ts`, `lent-1.ts`, `lent-2.ts`, `keys.ts` (`KEPT_KEYS`, `KEY_ALIASES`), and `index.ts` (the three occasions with their introductions, `HYMN_TITLES`, `countdownPaths()` for the sitemap).
- Engine and pages: [src/pages/countdowns/](../../../src/pages/countdowns/): `calendar.ts` (no imports), `season.ts` (window, run, state, day line), `storage.ts` (`bp-countdowns`), `ics.ts`, `message.ts`, `card.ts`, and the pages.
- Shared entries: one route in `App.tsx`, the hub's search title in `page-head.ts`, one line in the home page's Resources block, one page type in `scripts/design-review/site-map-rest.ts`.

**Adding an occasion** (Pentecost, a wedding, a baby, any date): write its days in one new data file, add one `Occasion` entry to `OCCASIONS` in `index.ts`, and add its keys to `KEPT_KEYS`. No page code changes. A chosen-date occasion uses `target: { kind: "chosen" }`; the baby occasion adds `maxAfter: 14`, `finishLabel: "Our baby is here"` and `footLink` to `/sympathy/loss-of-baby`. The tests already exercise a chosen-date occasion with "still waiting" days on test data, and a test wedding added as data only renders, takes a `?date=` and keeps its ticks.

**Small departures from the design, and why:**
- The `Occasion` type gained presentation fields the design's sketch left implicit: `summary` (the hub line), `numberedOf` ("Day 12 of 40"), `calendar` (doors or week grid), `style` (the card's look), `note`, `closing` (the "afterwards" line), `finishLabel` and `footLink` (for the personal occasions).
- Hymn links carry display titles from `HYMN_TITLES` in the data, as sympathy's funeral hymns do, so a page never loads the whole hymn collection; a test checks every id exists in the collection.
- Day 33's title says "kernel of wheat", the Berean's own word, and day 37's says "betrayed for money", as Mark has it (the silver is in Matthew).
- Hymns chosen where the plan left the choice open: December 14, "Alas, and Did My Saviour Bleed"; December 25, "Shepherds, Rejoice, Lift Up Your Eyes"; Good Friday, "When I Survey the Wondrous Cross".
- The reflections run 87 to 110 words (about 7,300 words in all), inside the 60–110 limit.

**Code review before release** (one independent read of the built code against this design) found eleven problems, all fixed, most with a test in `countdowns-states.test.tsx`. The serious ones: the first print of a church sheet came out blank, because the print area was only created when the button was pressed (it now stays mounted); and a browser that blocks site storage made every countdown page fail, because storage was read outside the guard (it now falls back to "ticks last for this visit"). The others bring the pages into line with sections 6.2, 6.3, 7.4 and 7.6: the church panel leads while a season is still coming up; Holy Week links to today's Lent reading while Lent is under way; the "afterwards" days give next year's start date; the Lent calendar labels its Holy Week row; sharing is offered only once the verse has loaded; the announcement resets when the page rolls over to next year; Holy Week's calendar file uses Lent's event ids, so importing both files never doubles a day; a built-in name such as `constructor` in a day address is treated as an unknown day; and a candle reading is fetched afresh when the year's candle panels change.

**Browser print verification (2026-11-09):** completed section 8.3 on the actual approved preview. All 20 Advent (including the maximum 29-day season), Lent and Holy Week reading-plan, bulletin and applicable candle-sheet cases print as exactly one page on Letter/A4. Fixed clipping in Lent bulletin inserts with three compact columns and restored white paper margins. Final checks used the rebuilt source, no injected styles; 111 focused tests and the normal gated portable build passed. Evidence: [print-verification-20261109.json](print-verification-20261109.json). Crawler copies should be refreshed before each season once the owner releases: `bun run seo:capture --only /countdowns` in October and January.
