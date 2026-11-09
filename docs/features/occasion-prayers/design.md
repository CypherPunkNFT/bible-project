# Prayers for occasions — design

**Status:** research & design, written in job 833 (sequence 33 "Bible Guide chain D: life moments", step 14, 2026-11-09). A single review follows in step 15, then implementation in step 16.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 10: "Before surgery, a job interview, a new home, a hard conversation: short, Scripture-rooted, shareable." This step's brief adds: cover the occasion list, write each prayer once, use public-domain historic prayers where they fit (for example the Book of Common Prayer), give verse references, and plan sharing.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)
**Siblings it builds on (all built):** [life-event-packs/design.md](../life-event-packs/design.md) (the `p()` reference reader, passage assembly, reader links, print module), [sympathy/design.md](../sympathy/design.md) (passage keys, the message builder, tone rules) and [when-youre/design.md](../when-youre/design.md) (the closest neighbour: hub filter, crisis-word match, verse sending). The "when you're…" design deliberately prays **only Scripture** and left **newly written prayers** to this feature (its 2.7). It also planned links from four of its pages to this feature (its 5.6). This document keeps that line.

## 1. What we are building, in one paragraph

A new section, **/prayers**, for someone about to face something and looking for words: "prayer before surgery", "prayer for a job interview", "prayer for a new home", "opening prayer for Bible study". There is a hub, **"Prayers for Life's Occasions"**, with a "What's happening?" filter, and **32 occasion pages** at launch in six groups: health and care, work and study, home and family, hard moments, journeys and seasons, and church and Scripture. Each page has one to three **short prayers** written once for the site in plain modern English. Usually that means one to pray *for yourself* and one to pray *for someone you love*, with the person's name filled in. Each prayer is 60 to 140 words, and under it are the **verses it is rooted in**, shown in full in the Berean Standard Bible. Thirteen pages also offer **an older prayer**: a verified collect from the 1662 Book of Common Prayer, or a stanza of St Patrick's Breastplate. Each older prayer appears exactly as written, with its source and a one-line explanation of any old word. Every prayer can be **copied or sent** as a text message, email or share-sheet message. A name can be typed in for that send only; it is never stored or put in the link. All words are written by hand once and stored in the site's code. There are no runtime model calls, no paid services and nothing new to host.

## 2. Research

### 2.1 What people search for

The list is an editorial selection checked against the titles of pages that answer these searches. It is not a measured keyword-volume study, because volume data needs a paid tool, and the cost rule asks for $0.

1. **The shape of the phrase is almost always "prayer + preposition + occasion":** "prayer **before** surgery", "prayer **for** a job interview", "prayer **for** a new home", "prayer **before** a difficult conversation", "opening prayer **for** a meeting", "prayer **for** safe travel". So each heading and search title begins with "Prayer…" or "A Prayer…" and names the occasion in the searcher's own words (3.2).
2. **People ask for themselves and for someone else, separately.** Pages that rank for these searches split them: "prayer for **someone** having surgery", "for my husband / wife / friend", "for a friend's interview". Prayer sites with occasion sections ([Lords-prayer-words.com interview page](https://www.lords-prayer-words.com/topics/prayer_for_job_interview.html): a prayer before entering the room, one for a friend, one for after the interview; [Knowing-Jesus surgery category](https://www.knowing-jesus.com/prayer/category/prayers-for-surgery): for yourself, husband, wife, friend) show the same split. This is why most pages here have a "For you" prayer and a "For someone you love" prayer, and some have a third for the moment after ("after the interview", "for the family in the waiting room").
3. **Some searches are about gatherings, not crises.** "Opening prayer for Bible study", "closing prayer for a meeting" and "prayer before reading the Bible" are constant searches by small-group leaders, Sunday-school teachers and people asked to "open in prayer" at work or church. They fit a Bible site naturally and are included (group 6).
4. **The life-event searches are mostly answered already.** "Wedding verses", "verses for a new baby" and "graduation verses" are served by the built life-event packs. Here those occasions get only the *prayer* ("prayer for a couple on their wedding day"), and each page links to the pack.

### 2.2 What they find today

The pages that answer these searches ([HymnsandVerses "33 Prayers for Surgery"](https://hymnsandverses.com/33-prayers-for-surgery/), [Biblicaltick "23 Powerful Prayers For Job Interview"](https://biblicaltick.com/23-powerful-prayers-for-job-interview/), [Elevatedprayers "50 Most Effective Prayers For Job 2026"](https://elevatedprayers.com/prayers-for-job/), [Divineattention "40 Powerful Prayer Points for a New Job & Career Breakthrough"](https://divineattention.org/prayer-points-for-new-job/), [Prayerscapes occasions](https://www.prayerscapes.com/prayers/occasions/prayer_for_job_interview.html), [Jesusanswers](https://www.jesusanswers.com/prayer-for-interview-for-job)) show five problems this feature is designed to avoid. These are editorial observations from a sample, not a claim about every page.

1. **Quantity over usefulness.** Twenty to fifty prayers on one page, with nothing to tell a nervous person which to pray. Here a page has one prayer for you, one for someone else, and at most one more.
2. **"Powerful", "most effective", "breakthrough", "prayer points".** This is the language of technique and of prosperity teaching, as if the right words obtain the result. Scripture says the opposite (Matthew 6:7–8: the Father knows what you need before you ask), and the site's doctrine rules prosperity teaching out (2.5).
3. **Promised outcomes.** "You will get the job", "the surgery will be a success". Prayers here ask honestly and boldly, and leave the outcome with God (2.5).
4. **Little or no Scripture.** Most of these prayers echo no verse that the reader can check, and when they quote one it is usually King James. Here every prayer lists the verses it prays, in the Berean (4.3).
5. **Prayer as a service.** Some sites collect prayer requests with a counter ("728,193+ prayers answered") or route them through a shrine. This site does nothing of the kind: no request form, no counters, no "send us your prayer" (section 9).

### 2.3 Baptists and written prayers

This matters for how the feature is framed, not only what it contains:

- **Baptists pray freely and have no prayer book.** Free prayer is a conviction with a history. John Bunyan wrote *I Will Pray with the Spirit* (1662) from Bedford jail, where he was held for preaching outside the established church; it argued against praying only from imposed set forms. Charles Spurgeon, the most widely read Baptist preacher, preached against the Prayer Book's baptismal service; the site's own library holds that sermon, *Thus Saith the Lord: Or The Book of Common Prayer Weighed in the Balances of the Sanctuary* (catalogue work `work-spurgeon-sermon-0591`).
- **Baptists have also always used written helps.** They have prayed the psalms, sung hymns (which are written prayers), and taught the Lord's Prayer as a pattern ("This, then, is how you should pray", Matthew 6:9). The Presbyterian Matthew Henry's *A Method for Prayer* (1710) was widely used among English Dissenters, Baptists included. It is a book of prayers built almost entirely from Scripture's own words, and its sixth chapter, "Occasional Addresses to God", covers exactly this feature's ground: journeys, sickness, sick children, morning and evening ([1710 text](https://mrmatthewhenry.com/wp-content/uploads/2015/05/a-method-for-prayer-1710-edition.pdf), [sections online](https://www.matthewhenry.org/read/)).
- **So the site offers its prayers as words to begin with, not words required.** Every page says so in one line: *"Pray these words, or let them start you off in your own. God hears plain words."* The prayers follow Henry's method rather than copying his text: each one prays back what particular verses say, and the verses are shown underneath. Henry's own words are King James Scripture, which the Berean-everywhere rule would make us restate line by line, so his book is the model and is not quoted.

### 2.4 Historic prayers: what fits, and the rights

The owner suggested the Book of Common Prayer. It is the best source of short, Scripture-soaked prayers in English, and much of it is shared by all English-speaking Protestants. The research on each candidate source:

| Source | Rights | Decision |
|---|---|---|
| **Book of Common Prayer, 1662** (Church of England) | Public domain in the United States. **In the United Kingdom the text is not public domain**: rights are vested in the Crown and administered by Cambridge University Press as the Crown's patentee. Cambridge permits reproduction of **up to 500 words for liturgical and non-commercial educational use**, with the acknowledgement *"Extracts from The Book of Common Prayer, the rights in which are vested in the Crown, are reproduced by permission of the Crown's patentee, Cambridge University Press."* For material not offered for sale, such as orders of service or posters, "BCP 1662" at the end of the quotation is enough ([Cambridge rights and permissions](https://www.cambridge.org/bibles/about/rights-and-permissions/rights-and-permissions-bcp); [Church of England guide to liturgical copyright, 4th ed. 2024](https://www.churchofengland.org/sites/default/files/2025-06/a-brief-guide-to-liturgical-copyright-4th-ed-2024.pdf)) | **Use, within the permission:** eight collects totalling **449 words** (4.4), the full acknowledgement on every page that shows one, and "BCP 1662" at the end of every copied or sent text. A test holds the total under 500. The site is free and non-commercial; this needs no request, payment or account |
| Book of Common Prayer, 1928 (US Episcopal) | Public domain in the US (published 1928) | Not needed: every collect chosen is in the 1662 book, and 1662 is the shared original |
| Book of Common Prayer, 1979 (US Episcopal) | Said by its publisher never to have been copyrighted ([Wikimedia Commons record](https://commons.wikimedia.org/wiki/File:Book_of_common_prayer_(TEC,_1979).pdf)) | **Not used.** Its contemporary-language occasion prayers ("Before an Operation", "For the Unemployed") come from a denomination outside the owner's standard for churches the site commends ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md), "no liberal denominations") |
| **St Patrick's Breastplate**, English verse by Cecil Frances Alexander (1889) | Public domain (Alexander died in 1895). Text checked against C. H. H. Wright's *The Writings of Saint Patrick*, "Version of Mrs. Alexander" ([Wikisource](https://en.wikisource.org/wiki/The_Writings_of_Saint_Patrick,_the_Apostle_of_Ireland/Version_of_Mrs._Alexander)) | **Use one stanza only** ("Christ be with me, Christ within me…", 53 words) for journeys. The rest of the hymn binds "the power of" creation, angels and saints to oneself, which a Baptist page should not commend. It is labelled "traditionally attributed to St Patrick", because the Old Irish original is probably later than Patrick |
| Matthew Henry, *A Method for Prayer* (1710) | Public domain | Used as the method (2.3), not quoted |
| C. H. Spurgeon, *The Pastor in Prayer* (1893) | Public domain; recorded in the site's library catalogue (`work-reconciled-077140138445564ee88a036a`) but its text is not held on the site | Not at launch: these are long pulpit prayers, and cutting them into occasion-length pieces would misrepresent them. A later "Prayers of the Baptist past" collection could use them whole (section 9) |
| *The Valley of Vision* (Banner of Truth, 1975) | **In copyright** | Not used, despite its popularity |
| "Prayer of St Francis" ("Make me an instrument of your peace") | First printed in French in 1912, not by Francis; English versions vary in date and rights | Not used: the false attribution alone rules it out |
| Serenity Prayer (Reinhold Niebuhr) | 20th century; disputed authorship and rights | Not used |
| John Baillie, *A Diary of Private Prayer* (1936) | Rights uncertain across countries | Not used |

**Two doctrinal checks on every historic text** (2.5). First, the text must agree with the Baptist Faith and Message 2000 wherever it speaks: no prayers for the dead, no invocation of saints, no baptismal regeneration and no priestly absolution. That excludes much of the 1662 Visitation of the Sick and Burial services, which is why no historic prayer appears on the funeral page. Second, under the doctrinal foundation, "a historic document's own text stays as written; Scripture inside it is restated in the Berean wherever it can be matched". None of the chosen texts quotes a verse outright. "That peace which the world cannot give" alludes to John 14:27 and is kept as written. The text is shown as printed; only old words get an explanation beside it (4.4).

**A site-wide observation for the owner** (not this feature's decision). The creeds collection already shows the 1662 Prayer Book catechism in full (`data/creeds/doc/anglican-catechism-1662*.json`, from Schaff's *Creeds of Christendom*), and its source and licence fields are empty. That is far more than 500 words. If the site treats the 1662 text as US public domain, that is defensible for a US-hosted site. If it wants to stay inside Cambridge's permission everywhere, the catechism would need a request to Cambridge. Either way, this feature stays inside the 500-word permission.

### 2.5 Doctrine sets the boundaries

The site writes in agreement with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). For prayers that means:

1. **Prayer is to God, through Christ.** Every prayer is addressed to God the Father, or to the Lord Jesus where Scripture models it (Acts 7:59), and closes in Jesus' name (John 14:13–14; 1 Timothy 2:5). None is addressed to Mary, saints or angels, and none asks for their intercession (article 2: one God; article 4: one Mediator).
2. **No prayers for the dead.** The funeral page prays for those who mourn and for the people going to the service, never for the one who has died. This follows sympathy's rule 3: no false comfort, and no pronouncing on where someone is.
3. **Ask boldly, and leave the outcome with God.** Scripture invites honest asking for healing, work, safety and a good result (Philippians 4:6; James 4:2; 1 John 5:14–15). Prayers ask plainly, without hedging every line, and they also trust God with the answer ("your will be done", Matthew 6:10; Jesus in Gethsemane, Luke 22:42). No prayer says or implies that enough faith, or the right words, guarantees the result. Prosperity teaching is excluded (article 13 as the foundation applies it). Words such as "claim", "declare", "decree", "breakthrough" and "favour" (in the sense of entitlement) are banned by a test (7.3).
4. **Doctors, medicine, counsellors and lawyers are gifts.** The health prayers thank God for surgeons and nurses and ask for their skill (Luke "the beloved physician", Colossians 4:14; the poultice of figs, Isaiah 38:21), as the "when you're…" pages already say.
5. **A prayer "for someone" does not assume their faith.** It asks God to be near them, keep them and help them. It never puts words of faith in the other person's mouth, so a believer can send it to a friend who does not share their faith. Where the gospel belongs naturally (the before-a-funeral and new-year pages), the page links the site's study *The Good News* (`/study/the-good-news`) in one sentence and does not press.
6. **Marriage is one man and one woman for life** (article 18). The wedding-day prayer is for husband and wife. The struggling-marriage prayer asks for restoration and does not rule on divorce. Like the "when you're…" struggling-marriage page, it links quietly to the page on being hurt at home (`/when-youre/abused`), because separating for safety is a different question.
7. **War and peace are left open** (article 16; the foundation lists just war and pacifism as Baptist views). The deployment prayer asks for the soldier's safety, courage, integrity and return, and for the family at home. It neither celebrates war nor judges service.
8. **Life from conception** (article 15). The new-baby and giving-birth prayers speak of the baby as a person God is forming (Psalm 139:13–14).
9. **Baptism and dedication.** The new-baby prayer is a prayer, not a christening. Where a family is planning a dedication service, the page links the baby-dedication life-event pack.

### 2.6 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| Reading a short reference into verse ids, with exact "a"/"b" excerpts; passage roles | `p("PSA 31:14-15a", role, note, { part, context })`, `BOOK_NUMBERS`, `LifeEventPassage` | [types.ts](../../../src/data/life-events/types.ts) |
| The sympathy wrapper that adds labels (`believer`) to a passage, used by the "when you're…" data | `sp()`, `SympathyPassage` | [src/data/sympathy/](../../../src/data/sympathy/) |
| Assembling and tidying a passage; its reference; reader link; the card length limits (240 / 320 / 700) | `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL`, `CARD_MAX`, `DISPLAY_MAX` | [passage.ts](../../../src/pages/life-events/passage.ts) |
| Loading a page's passages (pattern to copy, passing `"bsb"` explicitly) | `useSympathyPassages`, `resolveRange` | [useSympathyPassages.ts](../../../src/pages/sympathy/useSympathyPassages.ts), [verses.ts](../../../src/lib/verses.ts) |
| A permanent key for a passage (`psalm-31-14-15a`) | `passageKey` | [card-keys.ts](../../../src/data/sympathy/card-keys.ts) |
| Building a message, an email link and a numberless `sms:` link (pattern to copy; the "when you're…" builder is closest) | `verseMessage`, `emailHref`, `textHref`; sympathy `buildMessage`, `mailtoHref`, `smsBodyHref` | [when-youre/message.ts](../../../src/pages/when-youre/message.ts), [sympathy/message.ts](../../../src/pages/sympathy/message.ts) |
| Recognising crisis words typed into a filter | `urgentMatches(value)`, `normaliseFeeling(value)` | [when-youre/help.ts](../../../src/data/when-youre/help.ts) |
| The site's public address for links | `SITE_ORIGIN = "https://bibleguide.io"` | [page-head.ts](../../../src/lib/page-head.ts) |
| Page title, description, sitemap | `h1` plus the first `<p>` of 60+ characters inside `<main>`; `ROUTE_TITLES`; a page type in the design-review inventory fed by a paths function, as `whenYourePaths()` is | [page-head.ts](../../../src/lib/page-head.ts), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts) |
| Unknown address | The site's own not-found page, as the life-event packs use | [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) |
| Topic pages to link (`/topics/<slug>`), all checked on 2026-11-09 to exist with references | `prayer` (415), `sickness` (93), `physician` (10), `labor` (21), `industry` (69), `diligence` (96), `wisdom` (351), `decision` (260), `peace` (183), `reconciliation` (14), `forgiveness` (46), `house` (96), `children` (326), `parents` (209), `marriage` (268), `soldiers` (42), `missions` (25), `word-of-god` (456), `scriptures` (187), `thankfulness` (275), `thanksgiving` (92), `speaking` (190), `tongue` (19), `care` (30), `fear-unholy` (47), `contentment` (49), `integrity` (111), `mourning` (89), `bereavement` (22), `protection` (102), `faith` (290), `waiting-upon-god` (70), `rest` (25), `knowledge` (28), `strangers` (37), `sleep` (13), `meekness` (150), `humility` (231), `friendship` (64), `time` (89), `blessing` (416), `benedictions` (86), `lawsuits` (4) | [data/topics/index.json](../../../data/topics/index.json) |
| Life-event packs to link | `wedding`, `new-baby`, `expecting`, `baby-dedication`, `back-to-school`, `graduation`, `new-job`, `retirement`, `missionary` | [src/data/life-events/](../../../src/data/life-events/) |
| "When you're…" pages to link | `facing-surgery`, `serious-diagnosis`, `sick`, `out-of-work`, `big-decision`, `struggling-marriage`, `abused`, `grieving`, `anxious`, `afraid` | [src/data/when-youre/](../../../src/data/when-youre/) |
| Sympathy pages to link | `/sympathy`, `/sympathy/funeral-readings` | [src/data/sympathy/](../../../src/data/sympathy/) |

Topic slugs that **do not exist** and must not be linked: `guidance`, `travel`, `journey`, `home`, `trust`, `study`, `work`, `employment`, `comfort`, `courts`, `childbirth`, `new-year`, `family` (no references).

**What does not exist yet:** Chain C's shared verse-card generator. [docs/features/verse-cards/design.md](../verse-cards/design.md) was absent on 2026-11-09, and there is no generator code in `src/`. Section 6.4 says how prayers switch to it later. The home-blessings feature (this chain's steps 17–19) has not been designed either, and section 5.5 says how the two link once it exists.

### 2.7 Neighbouring features: who covers what

| Need | Where it belongs | How the pages relate |
|---|---|---|
| What the Bible says to someone hurting: verses, a pastoral note, crisis help | "When you're…" (`/when-youre`, built) | Those pages pray Scripture only. This feature holds the written prayers. Facing surgery ↔ before surgery, big decision ↔ big decision, out of work ↔ looking for work, struggling marriage ↔ struggling marriage link both ways (5.5). Crisis help stays there: these pages link to it and do not copy it |
| Verses and a printable card for a wedding, baby, new job, school, retirement or mission | Life-event packs (`/life-events`, built) | A prayer page for the same day links to its pack ("Verses and a printable card for the day"). Packs are not edited |
| Comfort after a death, funeral readings, condolence cards | Sympathy (`/sympathy`, built) | The before-a-funeral page prays for those who mourn and links to sympathy's funeral readings and cards. The sympathy design planned a link back from its "Explore more" once this exists (5.5) |
| House blessings, meal graces, bedtime blessings | Home blessings (approved idea 11, steps 17–19, not yet designed) | **The boundary:** the prayer for **a new home** here is a short prayer for moving day and settling in, for yourself or for someone who has moved. A **house blessing** (a printable blessing to read room by room, or hang by the door), graces and bedtime blessings belong to home blessings. No meal or bedtime prayers here. Each feature links to the other once both exist |
| Advent and Lent readings | Countdowns (`/countdowns`) | None needed at launch. The countdowns design planned personal countdowns (a wedding, a baby) that link to "the matching prayer page"; those countdowns are not built, so nothing is added there now |
| A verse for each birthday | Birthday verses (approved idea 5, chain C) | The birthday prayer links there once it exists |

## 3. The occasions

### 3.1 How the list was chosen

An occasion earns a page when (a) people search for a prayer for it in the shape of 2.1, (b) it is a **moment** (something about to happen, happening, or just happened) rather than a long-running hurt, which belongs to "when you're…", and (c) a prayer for it needs its own words, not a lightly reworded neighbour. Close neighbours were merged: "first day at work" into **new job**; "test anxiety" into **exam**; "college" into **first day of school** (the student prayer) and **when a child leaves home** (the parent's prayer); "presentation", "speech" and "preaching" into **speaking in public**; "argument" and "apology" into **making peace**; "flight" and "road trip" into **travel**; "small group", "church meeting" and "work meeting" into **opening** and **closing a meeting**. Occasions left to other features are in 2.7, and occasions left for later in 3.3.

### 3.2 The 32 launch occasions

**Prayers** names the written prayers on the page, in order; the first is the featured one. **Older prayer** names the historic prayer, if any, by the short names of 4.4.

| Group | Address `/prayers/…` | Heading | Search title (≤ 50 characters, before " · Bible Guide") | Searches it answers | Prayers | Older prayer |
|---|---|---|---|---|---|---|
| Health and care | `before-surgery` | A Prayer Before Surgery | Prayer Before Surgery, for You or Someone You Love | prayer before surgery · for someone having surgery · for surgeons | For you · For someone you love · For the family waiting | Lighten our darkness |
| Health and care | `waiting-for-results` | A Prayer While Waiting for Test Results | Prayer While Waiting for Test Results | prayer for test results · waiting for biopsy results | For you · For someone you love | Peace the world cannot give |
| Health and care | `starting-treatment` | A Prayer Before Treatment Begins | Prayer Before Chemotherapy or Treatment | prayer before chemo · before a procedure · for treatment to work | For you · For someone you love | — |
| Health and care | `someone-in-hospital` | A Prayer for Someone in Hospital | Prayer for Someone in the Hospital | prayer for someone in the hospital · hospital visit prayer | For someone you love · For yourself in hospital | Look down from heaven |
| Health and care | `recovering` | A Prayer for Recovery | Prayer for Recovery After Surgery or Illness | prayer for recovery · healing after surgery | For you · For someone you love · Thanks when you are well again | — |
| Health and care | `giving-birth` | A Prayer Before Giving Birth | Prayer for Labor and a Safe Delivery | prayer for safe delivery · before giving birth · c-section | For you · For someone in labour | — |
| Work and study | `job-interview` | A Prayer Before a Job Interview | Prayer Before a Job Interview | prayer for job interview · for a friend's interview | For you · For someone you love · After the interview | Go before us |
| Work and study | `new-job` | A Prayer for Starting a New Job | Prayer for a New Job and Your First Day | prayer for new job · first day at work | For you · For someone you love | The beginning of this day |
| Work and study | `looking-for-work` | A Prayer While Looking for Work | Prayer for Finding a Job | prayer to find a job · job search · unemployed | For you · For someone you love | — |
| Work and study | `exam` | A Prayer Before an Exam | Prayer Before an Exam or Test | prayer before exam · test anxiety · for students | For you · For a student | Go before us |
| Work and study | `first-day-of-school` | A Prayer for the First Day of School | Prayer for the First Day of School | first day of school prayer · back to school · for my child · starting college | For your child · For a student starting college | — |
| Work and study | `speaking-in-public` | A Prayer Before Speaking in Public | Prayer Before a Presentation or Speech | prayer before speaking · presentation · before preaching | For you · For someone you love | — |
| Work and study | `big-decision` | A Prayer for a Big Decision | Prayer for Guidance in a Big Decision | prayer for guidance · decision making · direction | For you · For someone you love | Ruler and guide |
| Home and family | `new-home` | A Prayer for a New Home | Prayer for a New Home and Moving Day | prayer for new home · moving · new house · new apartment | For your household · For someone who has moved | — |
| Home and family | `moving-away` | A Prayer When Moving Away | Prayer for Moving to a New City | prayer for moving away · relocation · leaving home | For you · For someone leaving | Christ be with me |
| Home and family | `new-baby` | A Prayer for a New Baby | Prayer for a Newborn Baby and Parents | prayer for newborn · new parents | For the baby and parents · The parents' own prayer | — |
| Home and family | `wedding-day` | A Prayer for a Couple on Their Wedding Day | Prayer for a Couple on Their Wedding Day | wedding prayer · bride and groom · newlyweds | For the couple · The couple's own prayer | — |
| Home and family | `struggling-marriage` | A Prayer for a Struggling Marriage | Prayer for a Struggling Marriage | prayer for my marriage · restoration · for my husband / wife | For your marriage · For a couple you love | — |
| Home and family | `child-leaving-home` | A Prayer When a Child Leaves Home | Prayer When Your Child Leaves Home | empty nest · child going to college · for adult child | A parent's prayer · For the one leaving | — |
| Hard moments | `hard-conversation` | A Prayer Before a Hard Conversation | Prayer Before a Difficult Conversation | before a difficult conversation · confrontation · breaking hard news | For you · For someone facing one | — |
| Hard moments | `making-peace` | A Prayer for Making Peace | Prayer for Reconciliation After a Conflict | prayer for reconciliation · after an argument · apologising | For you · For two people at odds | — |
| Hard moments | `court-date` | A Prayer Before a Court Date | Prayer Before Court, for Justice and Peace | prayer before court · custody hearing · legal case | For you · For someone you love | — |
| Hard moments | `after-bad-news` | A Prayer After Hard News | Prayer After Receiving Bad News | prayer after bad news · shocking news | For you · For someone you love | — |
| Hard moments | `before-a-funeral` | A Prayer Before a Funeral | Prayer Before a Funeral, for Those Who Mourn | prayer before a funeral · for a grieving family | For those who mourn · For you as you go | — |
| Journeys and seasons | `travel` | A Prayer Before a Journey | Prayer for Safe Travel | prayer for safe travel · before a trip · before a flight | For you · For someone travelling | Christ be with me |
| Journeys and seasons | `deployment` | A Prayer for Someone Deploying | Prayer for a Soldier Being Deployed | prayer for deployed soldier · military family | For the one deploying · For the family at home | — |
| Journeys and seasons | `mission-trip` | A Prayer Before a Mission Trip | Prayer Before a Mission Trip | mission trip prayer · for a missions team | For the team · For someone going | Christ be with me |
| Journeys and seasons | `new-year` | A Prayer for the New Year | Prayer for the New Year | new year prayer · start of the year | For you · For your household | The beginning of this day |
| Journeys and seasons | `birthday` | A Birthday Prayer | Birthday Prayer for a Friend or Family Member | birthday prayer · for my son / daughter / friend | For someone you love · On your own birthday | — |
| Church and Scripture | `opening-a-meeting` | An Opening Prayer for a Meeting or Bible Study | Opening Prayer for a Meeting or Bible Study | opening prayer for bible study · small group · church meeting | To open a Bible study · To open any meeting | Unto whom all hearts be open |
| Church and Scripture | `closing-a-meeting` | A Closing Prayer for a Meeting or Bible Study | Closing Prayer for a Meeting or Bible Study | closing prayer · dismissal · benediction | To close a Bible study · To close any meeting | — (a blessing from Scripture instead, 4.3) |
| Church and Scripture | `before-reading-the-bible` | A Prayer Before Reading the Bible | Prayer Before Reading the Bible | prayer before reading the bible · before a sermon | For you · For a group | Read, mark, learn |

Search titles are at most 50 characters, so with " · Bible Guide" (14) none exceeds 64. Headings are unique. Labels for hub cards are short forms ("Before surgery", "Job interview"). The search phrases guide the writer and the reviewer. They are **never** shown on the page or hidden in it.

32 occasions in six groups is under the site's long-list threshold of about 50 rows, so the hub renders every card and needs no windowing.

### 3.3 Added later, as data only (no code change)

Starting a business; retirement (a pack exists; a prayer could join it); adoption day; a church's new pastor; before preaching (if "speaking in public" proves too general for pastors); a grandchild's birth; a storm or disaster warning; voting and elections; a prodigal child (left to "when you're…" worried-about-child for now); a sick child (the 1662 prayer for a sick child was read and **not** used: it prays the child may be received into rest if not healed, which a parent searching at a bedside should not meet unprepared). Each can be added as one data entry plus its words, and the tests then cover it automatically.

## 4. Prayer sources and writing plan

### 4.1 What a page holds

| Part | How many | Source |
|---|---|---|
| Written prayers | 1–3 per page; the first is featured | Written once by hand for the site (4.2, 4.6) |
| "Rooted in Scripture" | 2–5 verses or short passages per written prayer, shown under it in full | Berean Standard Bible, loaded from the site's files (4.3) |
| Context notes | Only on a verse often misread (4.3) | Written by hand |
| An older prayer | 0 or 1 per page (thirteen pages) | The nine verified texts of 4.4 |
| Introduction | 40–90 words; the first sentence names the occasion and becomes the search description | Written by hand |
| "A word before you pray" | 0–60 words, only where something must be said (giving birth, court date, after bad news, before a funeral, struggling marriage) | Written by hand |

### 4.2 How a written prayer is built

Each prayer follows the old order that Matthew Henry and the psalms both teach, in about 60 to 140 words:

1. **Address** God simply ("Father", "Lord", "Lord God"), sometimes with one line from Scripture about who he is ("my times are in your hands").
2. **Say what is happening**, honestly, including the fear ("You know how nervous I am").
3. **Ask** plainly: for help, for peace, for the people involved (surgeons, interviewers, the person in the hard conversation), and for the good outcome itself. Asking is not a lack of trust.
4. **Trust**: whatever the answer, God is near and good ("whatever comes, keep me in your peace").
5. **Close** in Jesus' name ("In Jesus' name, amen.").

**Rooted in Scripture, checkably.** Every distinct thing a prayer says about God, or asks of him, comes from one of the verses listed under it. "Give me your peace, which is bigger than I can understand" sits over Philippians 4:6–7. The reviewer reads each prayer beside its verses and strikes any line that has no verse under it. The verses are prayed, not quoted: the prayer does not paste Berean sentences into itself, so the Berean-everywhere rule is met by showing the verses beneath.

**"For someone" prayers** use the token `[name]` for the person, never at the start of a sentence (the site's translation check cannot pick up text that begins with a bracket, as the sympathy build found). Pronouns are singular "they/them", so the prayer works for anyone without guessing. On the page the token shows as a soft placeholder ("[name]"). In a sent message it becomes the typed name, or stays as "[name]" for the sender to fill in (6.1).

**Voice:** modern English ("you", never "thee" in the site's own prayers); short sentences; everyday words; British spelling as in the sibling features' prose; American spelling only where a search title must match what people type ("Labor"). No exclamation marks. One prayer, one mood: the job-interview prayer is calm, not hyped.

### 4.3 The verses each page's prayers rest on

These are the planned roots. The writer may swap a verse for a better one, keeping to the rules of this section, and the reviewer checks the final set. References are given in the site's `p()` form.

| Page | Rooted in | Context note needed |
|---|---|---|
| before-surgery | `PSA 31:14-15a`, `PSA 4:8` (sleep in safety, for the anaesthetic), `ISA 41:10`, `PHP 4:6-7`; family: `PSA 46:1`, `1PE 5:7` | — |
| waiting-for-results | `PSA 112:7`, `PHP 4:6-7`, `MAT 6:34`, `ISA 26:3` | — |
| starting-treatment | `PSA 73:26`, `2CO 4:16`, `ISA 40:31`, `JER 17:14` | — |
| someone-in-hospital | `PSA 41:3`, `PSA 23:4`, `2CO 1:3-4`, `MAT 25:36` (for the visitor) | PSA 41:3: a psalm of God's care for the one who cares for the weak, not a promise that every sick person recovers |
| recovering | `PSA 30:2`, `PSA 103:2-3`, `ISA 40:29`; thanks: `PSA 116:1-2`, `PSA 118:21` | PSA 103:3: praise for God's healing, not a promise that every illness ends now (2 Corinthians 12:7–9) |
| giving-birth | `PSA 139:13-14`, `ISA 40:11`, `JHN 16:21`, `PSA 121:7-8` | — |
| job-interview | `PRO 16:3`, `PRO 3:5-6`, `COL 3:23`; after: `PHP 4:11-12`, `PRO 16:9` | — |
| new-job | `PSA 90:17`, `COL 3:23-24`, `MIC 6:8` | — |
| looking-for-work | `MAT 6:31-33`, `PSA 55:22`, `PRO 16:9`, `LAM 3:22-23` | MAT 6:33: God's care for daily needs, not a promise of a particular job |
| exam | `JAS 1:5`, `PRO 2:6`, `COL 3:23`, `2TI 1:7` | — |
| first-day-of-school | `DEU 31:8`, `JOS 1:9`, `PRO 1:7`, `LUK 2:52` | — |
| speaking-in-public | `EXO 4:11-12`, `PSA 19:14`, `COL 4:6`, `2TI 1:7` | EXO 4:11–12: God's answer to Moses' fear of speaking. It shows God's care for a hesitant speaker, not a promise of eloquence |
| big-decision | `PRO 3:5-6`, `JAS 1:5`, `PSA 32:8`, `PRO 16:9` | — |
| new-home | `PSA 127:1`, `PRO 24:3-4`, `JOS 24:15b`, `ROM 12:13` | — |
| moving-away | `GEN 12:1`, `DEU 31:8`, `PSA 139:9-10`, `JER 29:7` | JER 29:7 (seek the peace of the city you live in) is used instead of 29:11, which is the verse most often misapplied to moves |
| new-baby | `PSA 127:3`, `PSA 139:13-14`, `MRK 10:14`, `NUM 6:24-26` | — |
| wedding-day | `GEN 2:24`, `ECC 4:9-10`, `1CO 13:4-7`, `COL 3:14` | — |
| struggling-marriage | `EPH 4:2-3`, `COL 3:13-14`, `1CO 13:4-7`, `ECC 4:12` | — |
| child-leaving-home | `NUM 6:24-26`, `PSA 121:7-8`, `PHP 1:6`, `3JN 1:4` | 3JN 1:4: John's joy over his spiritual children, used as a parent's hope, not a promise |
| hard-conversation | `PSA 141:3`, `JAS 1:19`, `EPH 4:15`, `PSA 19:14`, `PRO 15:1` | — |
| making-peace | `MAT 5:23-24`, `ROM 12:18`, `EPH 4:32`, `MAT 5:9` | ROM 12:18: "as far as it depends on you"; reconciliation takes two, and safety comes first |
| court-date | `PSA 37:5-6`, `MIC 6:8`, `ISA 41:10`, `PSA 9:9` | — |
| after-bad-news | `PSA 46:1-2`, `PSA 62:8`, `2CO 1:3-4`, `LAM 3:22-23` | — |
| before-a-funeral | `MAT 5:4`, `PSA 34:18`, `2CO 1:3-4`, `ROM 12:15` | — |
| travel | `PSA 121:7-8`, `PSA 139:9-10`, `JOS 1:9`, `PRO 3:6` | — |
| deployment | `PSA 91:1-2`, `JOS 1:9`, `PSA 121:7-8`, `DEU 31:6` | PSA 91: trust in God's protection, not a guarantee that no harm will come (the "when you're…" design's note on this psalm applies) |
| mission-trip | `MAT 28:19-20`, `ACT 1:8`, `COL 4:3`, `2TH 3:1` | — |
| new-year | `LAM 3:22-23`, `PSA 90:12`, `JAS 4:14-15`, `PRO 16:9` | — |
| birthday | `PSA 139:13-14`, `PSA 139:16`, `PSA 90:12`, `NUM 6:24-26` | — |
| opening-a-meeting | `PSA 119:18`, `COL 3:16-17`, `JAS 1:5` | A short note that Matthew 18:20 ("where two or three gather in My name") is about church discipline. The site does not use it as an opening line, though God is gladly with his people when they meet |
| closing-a-meeting | `HEB 13:20-21`, `2CO 13:14`, `JUD 1:24-25`; **a blessing from Scripture**: `NUM 6:24-26`, shown as Scripture, not as a written prayer | — |
| before-reading-the-bible | `PSA 119:18`, `PSA 119:105`, `2TI 3:16-17`, `JHN 17:17` | — |

**Never used as a root anywhere** (a test enforces it): `JER 29:11`, `ROM 8:28`, `PHP 4:13`, `MAT 18:20`, `DEU 8:18`, `3JN 1:2`, `MAL 2:16`, `PRO 22:6`. Each is a verse that occasion-prayer pages commonly misuse as a promise of success, presence, prosperity or results. The site handles them in context notes, never as a foundation.

### 4.4 The older prayers (verified texts)

Each text below was checked on 2026-11-09, word for word, against Lynda Howell's transcription of the 1662 Book of Common Prayer ([eskimo.com/~lhowell/bcp1662](https://www.eskimo.com/~lhowell/bcp1662/)). The Breastplate stanza was checked against Wikisource's scan of Wright's edition. The implementation step stores each text exactly as below, with its source and that check date. Capitals in the printed book's first words (for example "O LORD") are set in ordinary case. The texts are shown in Literata like Scripture, but marked as historic prayers, not Scripture.

| Short name | Source | Words | Pages | Explanation shown beside it |
|---|---|---|---|---|
| **The beginning of this day** | BCP 1662, Morning Prayer, the Third Collect, for Grace | 72 | new-job, new-year | "Governance" means God's guiding rule |
| **Peace the world cannot give** | BCP 1662, Evening Prayer, the Second Collect, for Peace | 69 | waiting-for-results | "Counsels" means plans and advice |
| **Lighten our darkness** | BCP 1662, Evening Prayer, the Third Collect, for Aid against all Perils | 35 | before-surgery ("for the night before") | — |
| **Unto whom all hearts be open** | BCP 1662, Holy Communion, the Collect for Purity | 48 | opening-a-meeting | "Magnify" means praise |
| **Go before us** | BCP 1662, Holy Communion, the collect "Prevent us, O Lord" | 51 | job-interview, exam | "Prevent" here has its old meaning, "go before". The prayer asks God to go ahead of us in all we do |
| **Look down from heaven** | BCP 1662, The Order for the Visitation of the Sick | 52 | someone-in-hospital | "The prayer book's words; for a woman, say 'her'." |
| **Read, mark, learn** | BCP 1662, the Collect for the Second Sunday in Advent | 63 | before-reading-the-bible | "Inwardly digest" means take it in so that it becomes part of you |
| **Ruler and guide** | BCP 1662, the Collect for the Fourth Sunday after Trinity | 59 | big-decision | "Things temporal… things eternal": what passes and what lasts |
| **Christ be with me** | St Patrick's Breastplate, English verse by Cecil Frances Alexander (1889), one stanza | 53 | moving-away, travel, mission-trip | "Traditionally attributed to St Patrick of Ireland (5th century)" |

**Book of Common Prayer total: 449 distinct words.** That is under Cambridge's 500-word permission, which leaves 51 words of room; the test fails if a later addition goes over. A text used on two pages counts once.

The texts, exactly:

- *The beginning of this day:* "O Lord, our heavenly Father, Almighty and everlasting God, who hast safely brought us to the beginning of this day; Defend us in the same with thy mighty power; and grant that this day we fall into no sin, neither run into any kind of danger; but that all our doings may be ordered by thy governance, to do always that is righteous in thy sight; through Jesus Christ our Lord. Amen."
- *Peace the world cannot give:* "O God, from whom all holy desires, all good counsels, and all just works do proceed; Give unto thy servants that peace which the world cannot give; that both our hearts may be set to obey thy commandments, and also that by thee, we, being defended from the fear of our enemies, may pass our time in rest and quietness; through the merits of Jesus Christ our Saviour. Amen."
- *Lighten our darkness:* "Lighten our darkness, we beseech thee, O Lord; and by thy great mercy defend us from all perils and dangers of this night; for the love of thy only Son, our Saviour, Jesus Christ. Amen."
- *Unto whom all hearts be open:* "Almighty God, unto whom all hearts be open, all desires known, and from whom no secrets are hid; Cleanse the thoughts of our hearts by the inspiration of thy Holy Spirit, that we may perfectly love thee, and worthily magnify thy holy Name; through Christ our Lord. Amen."
- *Go before us:* "Prevent us, O Lord, in all our doings with thy most gracious favour, and further us with thy continual help; that in all our works begun, continued, and ended in thee, we may glorify thy holy Name, and finally by thy mercy obtain everlasting life; through Jesus Christ our Lord. Amen."
- *Look down from heaven:* "O Lord, look down from heaven, behold, visit, and relieve this thy servant. Look upon him with the eyes of thy mercy, give him comfort and sure confidence in thee, defend him from the danger of the enemy, and keep him in perpetual peace and safety; through Jesus Christ our Lord. Amen."
- *Read, mark, learn:* "Blessed Lord, who hast caused all holy Scriptures to be written for our learning; Grant that we may in such wise hear them, read, mark, learn, and inwardly digest them, that by patience and comfort of thy holy Word, we may embrace, and ever hold fast, the blessed hope of everlasting life, which thou hast given us in our Saviour Jesus Christ. Amen."
- *Ruler and guide:* "O God, the protector of all that trust in thee, without whom nothing is strong, nothing is holy; Increase and multiply upon us thy mercy; that, thou being our ruler and guide, we may so pass through things temporal, that we finally lose not the things eternal: Grant this, O heavenly Father, for Jesus Christ's sake our Lord. Amen."
- *Christ be with me:* "Christ be with me, Christ within me, / Christ behind me, Christ before me, / Christ beside me, Christ to win me, / Christ to comfort and restore me, / Christ beneath me, Christ above me, / Christ in quiet, Christ in danger, / Christ in hearts of all that love me, / Christ in mouth of friend and stranger." (Line breaks as in the hymn. The final comma in Wright's edition, which runs into the next stanza, ends here as a full stop, and the page notes "from a longer hymn".)

The "Go before us" collect's phrase "with thy most gracious favour" is the 1662 sense of God's undeserved kindness. It is not the "favour" of prosperity preaching, and the tone test (7.3) applies to the site's own prayers, not to historic texts.

### 4.5 Two prayers written in full, to set the standard

These are working drafts. The implementation step may polish them, and the reviewer judges every other prayer against them.

**Before surgery: for you** (102 words; rooted in Psalm 31:14–15a, Psalm 4:8, Isaiah 41:10, Philippians 4:6–7)

> Father, my times are in your hands, and so am I. You know everything that will happen in that room today. Please quiet my fear. Give the surgeons, the anaesthetist and the nurses clear minds and steady hands, and thank you for their skill, which comes from you. When I go to sleep, let me lie down in your peace; when I wake, let me know you are still with me. I ask you to bring me safely through and to heal me. Whatever comes, keep my heart in your peace, which is greater than I can understand. In Jesus' name, amen.

**Before a hard conversation: for you** (86 words; rooted in Psalm 141:3, James 1:19, Ephesians 4:15, Psalm 19:14)

> Lord, you know the conversation ahead of me, and you know the person I will be talking with. Set a guard over my mouth. Help me to listen first, to be slow to speak and slow to anger. Let me speak the truth in love: honest, but never cruel. Keep me from wanting to win more than I want what is right. Soften both our hearts. If I am wrong, show me. Whatever happens, let my words and my thoughts please you. In Jesus' name, amen.

**Before surgery: for someone you love** (opening, to show the token): "Father, I bring [name] to you today as they go into surgery. You made them and you know them completely…"

### 4.6 Tone rules for every word the site writes here

- **No technique:** never "powerful", "effective", "breakthrough", "prayer points", "claim", "declare", "decree", "speak it into being", "name it", "manifest", "I command". God is asked, not instructed.
- **No promises the Bible does not make:** never "you will get the job", "the surgery will succeed", "God will heal you", "everything happens for a reason", "God won't give you more than you can handle".
- **No pressure or guilt:** never "if you have enough faith", "just pray", "at least".
- **No hype:** no "!" outside quoted Scripture; no capitals for emphasis.
- **Kind to the reader who is not sure:** an introduction may say "If you're not sure how to pray, or whether you can, these words are a place to start".
- **Short:** a prayer that will not fit on one phone screen at normal text size is too long. 140 words is the ceiling, and most are 70–110.

### 4.7 Who writes it, and when

All words are written **by hand in the implementation step** (step 16), directly into the data files, as the life-event, sympathy and "when you're…" steps wrote theirs. That is about 75 prayers of roughly 100 words each, 32 introductions, a handful of "word before you pray" notes and about a dozen context notes: roughly 9,000–10,000 words. A cheap-model batch is not used. Prayers are the most doctrine-sensitive words on the site, there are few enough items to write carefully, and a batch would still need every line re-checked. The cost is $0, with no runtime model calls. If the writing does not fit one sitting, the implementation should finish the first two groups to full quality, say so, and finish in a follow-up rather than rush.

## 5. Pages

### 5.1 Addresses and routing

One route, `<Route path="/prayers/*">`, as the life-event, sympathy and "when you're…" features do: the hub at `/prayers`, an occasion at `/prayers/<slug>`. "Prayers" is the word people search, so the address reads naturally ("bibleguide.io/prayers/before-surgery"). The code folder uses the feature slug `occasion-prayers` (`src/pages/occasion-prayers/`, `src/data/occasion-prayers/`), as the brief names it.

Each prayer and verse has an anchor: prayers by role (`#for-you`, `#for-someone`, `#after`, `#family`, …), verses by the sympathy `passageKey`, and the older prayer by `#older-prayer`. A shared link opens at the prayer once the page has drawn, using a feature-local hash effect copied from the sympathy pattern ([scroll.ts](../../../src/pages/sympathy/scroll.ts)). A malformed fragment is ignored safely, and a verse that roots two prayers on one page gets a unique id for its second appearance (`-2`).

**An unknown occasion** shows the site's [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx), as the life-event packs do, and the crawler-copy capture already recognises it. These are not crisis pages, so the "when you're…" gentle-hub fallback is not needed. **A retired slug** goes in a small redirect list in the data, pointing to its replacement with replace navigation. Tests reject cycles and invalid targets.

### 5.2 An occasion page, top to bottom

1. **`h1`**: "A Prayer Before Surgery". The page sets `document.title` to its search title plus " · Bible Guide", which [page-head.ts](../../../src/lib/page-head.ts) keeps because the page names itself.
2. **Introduction**: the first `<p>` of 60+ characters inside `<main>`, so it becomes the search description (no kicker or breadcrumb paragraph that long before it).
3. **"A word before you pray"**, on the five pages that have one (4.1).
4. **The featured prayer**, set apart in a quiet panel in Literata: its label ("For you"), the prayer, and three buttons: **Copy**, **Send** and, on the "for someone" prayer, **Send to them** with the name field (6.1). Under it, **"Rooted in Scripture"**: each verse in full as real page text inside `.scripture` with `lang="en"`, its reference linked to the reader (`readHref`), and a context note where 4.3 lists one.
5. **The other written prayers** (one or two), each with the same parts.
6. **"An older prayer"**, on thirteen pages: the historic text in a panel with `lang="en"`, its source line ("Book of Common Prayer, 1662: Morning Prayer, the Collect for Grace"), the one-line explanation, and Copy / Send.
7. **"Pray these words, or let them start you off in your own. God hears plain words."** (2.3), with a link to Matthew 6:7–8 in the reader.
8. **"Explore more"**: two to four sibling occasions, the matching "when you're…" page, life-event pack or sympathy page (5.5), and two or three site topics (5.4).
9. **Source lines**: "Scripture quotations are from the Berean Standard Bible (public domain)." On a page with a 1662 text, also the Crown acknowledgement in full (2.4).

Scripture is shown in full under each prayer rather than gathered at the foot, because the claim "rooted in Scripture" should be checkable on the spot. A page loads only the Berean books its verses come from, typically 6 to 10.

### 5.3 The hub (`/prayers`)

1. `h1` **"Prayers for Life's Occasions"**, and an introduction: "Short prayers for the moments that matter, before surgery, a job interview, a new home or a hard conversation, each rooted in Scripture and easy to send to someone you love." Search title in `ROUTE_TITLES`: **"Short Prayers for Every Occasion, Rooted in Scripture"** (53 characters).
2. **"What's happening?"**: one text box that filters the cards as the visitor types, matching each occasion's label, heading and a short list of plain words (stored per occasion: "operation", "op", "anaesthetic" → before surgery; "biopsy", "scan", "MRI" → waiting for results; "chemo", "radiation" → treatment; "interview" → job interview; "laid off", "unemployed" → looking for work; "test", "finals", "SAT" → exam; "moving", "house", "apartment" → new home; "argument", "sorry", "apologise" → making peace; "custody", "hearing", "lawsuit" → court date; "flight", "road trip", "vacation" → travel; "army", "navy", "deployed" → deployment; "small group", "Sunday school", "devotion" → opening a meeting). The match result count is announced through a quiet `aria-live` status, and what is typed is never stored, put in the address or sent anywhere.
   **Crisis words.** If the typed words match the "when you're…" crisis list (`urgentMatches` from [help.ts](../../../src/data/when-youre/help.ts), imported, not copied), a calm line appears above the results: *"If you are thinking of ending your life or someone is hurting you, help is here,"* linking the matching urgent page (`/when-youre/thinking-of-suicide`, `/when-youre/abused`), where the help box, numbers and quick exit live. A non-match never implies safety, and the filter is only a way to find a page.
3. **Six groups of link cards**: "Health and care" (6), "Work and study" (7), "Home and family" (6), "Hard moments" (5), "Journeys and seasons" (5), "Church and Scripture" (3). Each card shows the label and the first words of its featured prayer (from the data, so no Bible books load to draw the menu).
4. **"Looking for something else?"**: one line each to "What the Bible says when you're…", the life-event packs and the sympathy pages.
5. The source line.

### 5.4 Links to the site's topics

Two or three per page, all confirmed on 2026-11-09 to exist with references (2.6). The data test checks every slug and title.

| Pages | Topics |
|---|---|
| before-surgery, starting-treatment, someone-in-hospital, recovering | `sickness`, `physician`, `prayer` |
| waiting-for-results, after-bad-news | `care`, `peace`, `waiting-upon-god` |
| giving-birth, new-baby | `children`, `parents`, `blessing` |
| job-interview, new-job, looking-for-work | `labor`, `industry`, `contentment` |
| exam, first-day-of-school | `wisdom`, `knowledge`, `diligence` |
| speaking-in-public, hard-conversation | `speaking`, `tongue`, `meekness` |
| big-decision | `decision`, `wisdom`, `waiting-upon-god` |
| new-home | `house`, `blessing`, `thankfulness` |
| moving-away, travel | `protection`, `strangers`, `prayer` |
| wedding-day, struggling-marriage | `marriage`, `forgiveness`, `humility` |
| child-leaving-home, birthday | `parents`, `children`, `time` |
| making-peace | `reconciliation`, `forgiveness`, `humility` |
| court-date | `lawsuits`, `integrity`, `protection` |
| before-a-funeral | `mourning`, `bereavement` |
| deployment | `soldiers`, `protection` |
| mission-trip | `missions`, `prayer` |
| new-year | `time`, `thankfulness` |
| opening-a-meeting, closing-a-meeting | `prayer`, `benedictions`, `word-of-god` |
| before-reading-the-bible | `scriptures`, `word-of-god`, `prayer` |

### 5.5 Links to and from other features

**From this feature (own files only):**
- "When you're…": before-surgery → `facing-surgery`; waiting-for-results and after-bad-news → `serious-diagnosis` and `anxious`; someone-in-hospital and recovering → `sick`; looking-for-work → `out-of-work`; big-decision → `big-decision`; struggling-marriage → `struggling-marriage` and, worded quietly, `abused` ("If someone at home is hurting you"); before-a-funeral → `grieving`; travel and deployment → `afraid`.
- Life-event packs: wedding-day → `wedding`; new-baby → `new-baby`, `baby-dedication`; giving-birth → `expecting`; new-job → `new-job`; first-day-of-school → `back-to-school`; child-leaving-home → `graduation`; mission-trip → `missionary`.
- Sympathy: before-a-funeral → `/sympathy` and its funeral readings page, `/sympathy/funeral-readings`.
- The Good News (`/study/the-good-news`): new-year and before-a-funeral, one sentence each (2.5 rule 5).
- Home blessings and birthday verses: added as data once those features exist; until then, nothing (no "coming soon" links).

**Into this feature (narrow edits to other features' files that their own designs planned; each file is re-read just before editing and its tests must still pass):**
- "When you're…" (its design 5.6): one `elsewhere` entry on each of `facing-surgery` → `/prayers/before-surgery`, `big-decision` → `/prayers/big-decision`, `out-of-work` → `/prayers/looking-for-work`, `struggling-marriage` → `/prayers/struggling-marriage`, in [src/data/when-youre/](../../../src/data/when-youre/). Its hub's "For someone you love" block (its 5.3 item 5) gains "Prayers for life's occasions". The pastoral note on facing-surgery, which its design says should link "a prayer before surgery" once it exists, gets that link through the same `elsewhere` entry, not by rewriting the note.
- Sympathy (its 2.6): one line in the hub's "Explore more": "Prayers before a funeral" → `/prayers/before-a-funeral`.

### 5.6 Entry points

- **Home page:** one new line of link text, "Short prayers for life's occasions", in the same Resources block as the life-event, sympathy, countdown and "when you're…" lines in [HomePage.tsx](../../../src/pages/HomePage.tsx) (lines 278–282 on 2026-11-09). This is a new line, not a reworded one, for the translation reason the life-event design gives. A new block would be a home redesign that needs the owner's mock-up first.
- **Route:** the lazy import and `<Route path="/prayers/*">` in [App.tsx](../../../src/App.tsx). **Hub title:** one `ROUTE_TITLES` entry in [page-head.ts](../../../src/lib/page-head.ts). **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), fed by `occasionPrayerPaths()`.

### 5.7 Being found

- **Titles and descriptions:** heading, search title and first sentence each answer one search phrase from 3.2, and every page's introduction is written for that occasion, so no two pages are near-copies even where verses repeat.
- **Real text:** every prayer, verse and note is ordinary page text, which the site's crawler copies carry.
- **Sitemap and crawler copies:** `occasionPrayerPaths()` returns the hub and the 32 occasion addresses. After the owner releases the feature: `bun run seo:capture --only /prayers`, commit the captures, then `bun run seo:indexnow` (per [SEO.md](../../../../SEO.md)). This feature never deploys.
- **What we deliberately do not do:** no FAQ markup (no rich results since 2023), no keyword lists, no "50 powerful prayers" padding, and no separate pages for "prayer for my husband's surgery" and "prayer for my wife's surgery". One "for someone you love" prayer with a name field serves them all.

## 6. Sharing

### 6.1 Copy and send

Every written prayer and every older prayer has:

- **Copy:** copies the prayer, then a source line. For a written prayer: `— A prayer before surgery, bibleguide.io/prayers/before-surgery`. For a 1662 text: `— Book of Common Prayer (BCP 1662)`, which satisfies Cambridge's short-form rule (2.4). For the Breastplate: `— St Patrick's Breastplate, tr. C. F. Alexander`.
- **Send:** builds a plain message that the visitor sees, and can still edit in their own app:

  ```
  I'm praying for you.

  Father, I bring Sam to you today as they go into surgery. … In Jesus' name, amen.

  A prayer before surgery: https://bibleguide.io/prayers/before-surgery#for-someone
  ```

  - **Opening line:** a choice of three: "I'm praying for you." (default on "for someone" prayers), "I prayed this for you today.", or none (default on "for you" prayers, which people send to share a prayer rather than to say they prayed). There is no free-text field. The visitor adds their own words in their own app, so nothing they write is drawn by the site.
  - **Name field** (on "for someone" prayers only, at most 40 characters): replaces every `[name]` in the message. Left empty, `[name]` stays in the text for the sender to fill in, and a hint says so. The name is held in the page's memory only. It is never saved, never in the link, never sent to the site, and is drawn with `translate="no"` in the on-page preview (so "Grace" or "Joy" is not translated).
  - **Buttons**, as in the sympathy message tab: **Share…** (`navigator.share({ text })`, shown only where supported), **Copy message**, **Email** (`mailto:` with the subject "A prayer for you"), and on phones **Text message** (`sms:?&body=…`, no number). A cancelled share is not an error. A blocked clipboard shows the text selected with "Press and hold to copy".
  - **The link** is built from `SITE_ORIGIN`, never from the address the page is open at, carries the prayer's anchor, and has no tracking parameters.
- **Verses** under a prayer have **Copy** only ("text — reference (BSB)"). Sending single verses is what the "when you're…" pages already do, so this feature does not repeat it.

### 6.2 What the person receiving it sees

The link opens the occasion page at the prayer, which is highlighted for a moment (not on reduced-motion settings). The prayer they were sent is first on their screen with its verses beneath, and the page around it is gentle and makes no demands. A separate quiet recipient page, as sympathy built for condolences, is not needed: the message itself already carries the whole prayer, and the occasion pages hold nothing that would jar someone in hospital.

### 6.3 Printing

Not a separate format at launch. A print stylesheet hides the site header, footer, buttons and other prayers when the visitor uses **"Print this prayer"**: a button that marks one prayer and calls the browser's print dialog through the life-event `usePrintSheet` module, so a prayer can go on a hospital bedside table or into an order of service. Printable cards and framed blessings are the home-blessings feature's job (2.7), and a later prayer card can borrow its layouts.

### 6.4 Switching to the shared verse-card generator later

Chain C's generator did not exist on 2026-11-09. Each Send button is handed a plain **prayer-card description** (`{ page, anchor, label, heading, text, source, rootedIn: string[] }`) built by one pure function, so that when the generator exists:

- **"Save as image"** joins Copy and Send, drawing the prayer (or its featured verse, if prayers prove too long for an image) in the generator's quiet style;
- each occasion page asks the generator for its **link-preview image** (`og:image`) of the featured prayer's first lines.

The implementation step checks [docs/features/verse-cards/design.md](../verse-cards/design.md) and the generator's real interface before starting, and reuses only an existing compatible interface without editing the other chain's feature. Until then the message carries the full prayer in its own text, so nothing is half-built.

### 6.5 Privacy

The feature stores nothing and sends nothing: no accounts, no saved prayers, no request forms, no counters, no analytics events beyond what the site already does on any page. The hub filter's text and the name field live only in the page's memory.

## 7. Building it

### 7.1 Data

Under `src/data/occasion-prayers/`, importing nothing through the `@/` alias (so build scripts can read them, as the sibling data does):

- `types.ts`, `index.ts` (the occasions in hub order, `occasionBySlug`, `occasionPrayerPaths()`, `PRAYERS_PATH = "/prayers"`, the redirect list, the group titles), `historic.ts` (the nine texts of 4.4 with source, section, check date, word count and explanation), and six content files, one per group: `health.ts`, `work.ts`, `home.ts`, `hard.ts`, `journeys.ts`, `church.ts`. Each stays under the 500-line target, and long prayers stay on readable lines, never squeezed onto single lines.

```ts
import type { SympathyPassage } from "../sympathy/types";

export type OccasionGroup = "health" | "work" | "home" | "hard" | "journeys" | "church";

/** "for-you" | "for-someone" | "after" | "family" | … : the prayer's anchor on the page. */
export interface WrittenPrayer {
  id: string;
  label: string;                  // "For you", "For someone you love", "For the family waiting"
  text: string;                   // 60–140 words; "[name]" only when forSomeone, never sentence-initial
  forSomeone?: true;              // shows the name field and defaults the opening line
  rootedIn: SympathyPassage[];    // 2–5, role "card", built with sp(); context notes on the passage
}

export interface HistoricPrayer {
  id: "bcp-grace" | "bcp-peace" | "bcp-perils" | "bcp-purity" | "bcp-prevent" | "bcp-sick" | "bcp-advent-2" | "bcp-trinity-4" | "breastplate";
  title: string;                  // "The beginning of this day"
  text: string;                   // exactly as 4.4
  source: string;                 // "Book of Common Prayer, 1662: Morning Prayer, the Third Collect, for Grace"
  rights: "bcp-1662-crown" | "public-domain";
  explanation?: string;           // one line on an old word
  checkedAgainst: string;         // URL and date of the word-for-word check
}

export interface Occasion {
  slug: string;                   // "before-surgery"
  group: OccasionGroup;
  label: string;                  // "Before surgery", for the hub card
  heading: string;                // h1
  searchTitle: string;            // ≤ 50 characters
  intro: string;                  // 40–90 words
  before?: string;                // "A word before you pray", ≤ 60 words
  prayers: WrittenPrayer[];       // 1–3; the first is featured
  historic?: HistoricPrayer["id"];
  scriptureBlessing?: SympathyPassage; // closing-a-meeting only (NUM 6:24-26)
  topics: { slug: string; title: string }[]; // 2–3
  related: string[];              // 2–4 sibling slugs
  elsewhere?: { href: string; title: string }[]; // when-youre, life-events, sympathy, the good news
  words: string[];                // plain words for the hub filter; never rendered
}
```

Verse text is not stored. It is loaded from the Berean files at view time, as everywhere on the site.

### 7.2 Files

New, in `src/pages/occasion-prayers/`: `PrayersPage.tsx` (the route), `Hub.tsx`, `OccasionPage.tsx`, `PrayerPanel.tsx` (a written prayer with its Rooted-in verses), `OlderPrayer.tsx`, `SendPrayer.tsx`, `message.ts` (the pure message, copy-text and card-description builders), `filter.ts` (the pure hub filter, using the imported crisis match), `usePrayerVerses.ts` (the loader, on the pattern of [useSympathyPassages.ts](../../../src/pages/sympathy/useSympathyPassages.ts)), `anchors.ts`, `occasion-prayers.css`, and tests; plus `src/data/occasion-prayers/`. Reused without change: the life-event passage helpers and print module, `p()`/`sp()`, `passageKey`, `SITE_ORIGIN`, `urgentMatches`. Narrow integration edits: [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), and the planned inbound links of 5.5. **Sources register** (owner rule: every source a feature uses is registered): an entry in [SOURCES.md](../../../SOURCES.md) for the 1662 Book of Common Prayer (the transcription used for checking, the Crown/Cambridge terms, the 449-word count) and for Alexander's Breastplate (Wikisource, public domain), and a line in [NOTICE.md](../../../NOTICE.md) with the Crown acknowledgement. Both files are shared and have uncommitted work from other jobs, so re-read them and add with an edit rather than rewriting. No new dependencies; nothing in [public/_headers](../../../public/_headers).

### 7.3 Tests (added in the implementation step, run with the site's `test` and `build`)

- **Passage data** (reading the real Berean files): every root's verse ids exist and ranges run forward in one chapter; every excerpt is exact with the right "a"/"b" mark; each written prayer has 2–5 roots; every root is 320 characters or fewer after tidying; **no root anywhere is one of the eight never-used verses of 4.3**; the closing blessing is exactly Numbers 6:24–26.
- **Words:** 32 occasions, slugs unique and URL-safe, headings unique, search titles ≤ 50 characters, intros 40–90 words, "word before you pray" ≤ 60 words, each page 1–3 written prayers with unique ids, each prayer 60–140 words and ending "amen."; `[name]` appears in every `forSomeone` prayer and in no other, and never begins a sentence; **tone scan** of the site's own words (written prayers, intros, notes; not Scripture, not historic texts): none of "powerful", "breakthrough", "prayer points", "claim", "declare", "decree", "manifest", "I command", "God will heal", "you will get", "everything happens for a reason", "more than you can handle", "enough faith", "just pray", "at least", and no "!"; **no saint, Mary or angel is addressed** (no sentence in a written prayer opens with "Saint", "St", "Mary", "Holy Mother" or "angel").
- **Historic texts:** each matches its stored text character for character (a checksum per text, so an accidental edit fails); the distinct 1662 texts total ≤ 500 words, counted the way 4.4 counts them; every page showing a 1662 text renders the full Crown acknowledgement; copied and sent 1662 text ends with "BCP 1662"; every `historic` id exists.
- **Links:** every topic slug exists with at least one reference and its title matches; every `related` slug is a real occasion; every `elsewhere` address is a real route (checked against `whenYourePaths()`, `lifeEventPaths()`, `sympathyPaths()`); struggling-marriage links `/when-youre/abused`; redirects have no cycles and valid targets; `occasionPrayerPaths()` holds the hub and the 32 occasions and nothing else.
- **Page tests** (Testing Library): the hub shows 32 cards in six groups; typing "operation" shows before-surgery; typing a crisis word shows the calm help line linking the right urgent page above the results; an occasion page shows heading, intro as the first qualifying paragraph, every prayer, every root reference, context notes, the older prayer with its source and explanation, topics and source lines; verse text is inside `.scripture` with `lang="en"`; an unknown slug renders the not-found page; a retired slug redirects.
- **Message builder:** the name replaces every `[name]`; an empty name leaves `[name]`; a name containing `[name]`, markup or emoji is inserted as plain text; the link starts `https://bibleguide.io/prayers/` with the prayer's anchor whatever address the test page is at; the opening-line choices behave as 6.1; Share is hidden without `navigator.share`; Email and Text links carry the encoded body; the name never appears in `location`, storage or any request.
- **Inbound links:** the four "when you're…" pages and the sympathy hub show their new lines; those features' existing tests still pass.

## 8. Edge cases

| Case | What happens |
|---|---|
| The surgery, interview or court case goes badly | No prayer promised otherwise. The interview page's "after the interview" prayer serves either answer; recovering has a thanksgiving and a prayer for slow recovery; after-bad-news exists for the worst day |
| The sender's friend does not share their faith | "For someone" prayers ask God to help the person and never speak for them (2.5 rule 5). The opening line "I'm praying for you." is the sender's own statement |
| Someone types a name with emoji, a very long name, or text in another script | Limited to 40 characters, inserted as plain text, preserved in the message as typed |
| No name typed | `[name]` stays in the message, with a hint above the buttons: "Add their name here, or fill it in before you send" |
| A phone with no share sheet; desktop browsers | Share is hidden; Copy, Email and (on phones) Text remain |
| The clipboard is blocked (some in-app browsers) | The message is shown selected in a box with "Press and hold to copy" |
| A very long SMS | Phones send it as a joined message; prayers are capped at 140 words, so a message stays well under 1,500 characters |
| The site is shown in another language | The site's own prayers translate like any page text. Scripture and the historic prayers keep `lang="en"`, because the Berean and the 1662 wording are the point and the Crown permission covers that English text. The name keeps `translate="no"` |
| Someone at the hub is in danger | Crisis words show the calm line to the "when you're…" urgent pages (5.3). The struggling-marriage page links the abuse page quietly. Court-date pages make no assumption about why someone is in court (a protection order, a custody hearing, a charge) |
| Giving birth goes wrong, or a baby dies | The giving-birth page stays hopeful and does not mention loss, as the life-event expecting pack does. The sympathy baby-loss page is reached through sympathy and "when you're…", not from here |
| A deployment prayer read by someone who believes Christians should not fight | It asks for safety, integrity, courage and return, and for the family at home. It does not praise the war (2.5 rule 7) |
| A pastor uses the opening or closing prayer aloud in a group | Those prayers use "we" and "us", and the page has "Print this prayer" for a reader to hold |
| A Baptist reader uneasy about prayer-book prayers | The older prayer is always second to the site's own prayers, clearly labelled with its source, and offered rather than urged (2.3) |
| A future editor adds a 1662 text that pushes the total over 500 words | The historic-texts test fails and names the total |
| A historic text is accidentally "modernised" in the data | Its checksum test fails |
| The hub and pages before the verse-card generator exists | Messages carry the whole prayer in text; no image is promised or half-built |
| Reduced motion | The arrival highlight on a linked prayer is skipped |
| A verse root appears under two prayers on one page | The second occurrence gets a suffixed DOM id, so anchors stay unique |
| An occasion is retired | Its slug goes in the redirect list to an explicitly named replacement, never a guessed one |

## 9. Out of scope for this build

Prayer requests, prayer walls, counters or "we will pray for you" forms (they need moderation and invite promises the site cannot keep); saving favourite prayers or accounts; audio; printable prayer cards and house blessings (home blessings); graces and bedtime prayers (home blessings); images and link previews (waiting for the shared verse-card generator, 6.4); translated prayer texts; a "Prayers of the Baptist past" collection drawing on Spurgeon's *The Pastor in Prayer* and similar public-domain sources (a good later idea, held for the owner); the later occasions of 3.3.

## 10. Questions for the review (step 15)

There is no owner decision card. Every choice here has an obvious recommendation and costs nothing:

1. **The 1662 texts stay within Cambridge's 500-word permission** (449 words), rather than relying on US public domain alone. This is safe everywhere and cheap. The reviewer should confirm the acknowledgement wording and the "BCP 1662" short form against Cambridge's page, which refused automated fetches during this research (its terms were confirmed through search results and the Church of England's guide).
2. **The creeds collection's full 1662 catechism** (2.4, last paragraph) is a site-wide question outside this feature. The reviewer may want to record it for the owner as a fact rather than a decision.
3. **Check the two sample prayers (4.5) hard.** They set the standard for about 75 more.
4. **Check each "rooted in" set** against 4.2's rule that every petition has a verse beneath it, and each context note against the verse's real subject.
5. **Address and naming:** `/prayers` for the route, `occasion-prayers` for the folders. Both follow the brief and the sibling pattern.
