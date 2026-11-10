# Blessings for the home — design

**Status:** research & design, written in job 2851e9b8 (sequence 33 "Bible Guide chain D: life moments", step 17, 2026-11-10). Reviewed once in step 18 (job ca80721e, 2026-11-10): corrections are applied in the body and listed in the Review section at the end (13). Implementation is step 19.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 11: "House blessings, meal graces, bedtime blessings for kids — printable." This step's brief adds: cover sources (public-domain traditional graces and blessings, Scripture blessings such as Numbers 6:24–26), print layouts and a children's section.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)
**Tools hub entry:** already present as `home-blessings`, "Blessings for the home", status `coming-soon`, category "Prayer and the home", in [registry.ts](../../../src/pages/tools/registry.ts).
**Siblings it builds on (all built):** [occasion-prayers/design.md](../occasion-prayers/design.md) (the closest neighbour: written prayers rooted in verses shown underneath, verified historic texts with checksums, tone rules, copy and send), [life-event-packs/design.md](../life-event-packs/design.md) (the print module and its card geometry) and [sympathy/design.md](../sympathy/design.md) (passage keys, `sp()`). The prayers design drew the line this document keeps: a short prayer for **moving day** is a prayer for an occasion; a **house blessing**, graces and bedtime blessings belong here (its 2.7).

## 1. What we are building, in one paragraph

A new section, **/blessings**, for families who want words to say at home and something to print: a blessing for a new or old house, graces for the table, and blessings and prayers for children at bedtime. There is a hub, **"Blessings for the Home"**, and **eight pages** in four groups: *for the house* (a house blessing; blessing your home room by room), *at the table* (prayers before meals; graces for holidays), *for children* (simple graces for children; bedtime blessings and prayers; blessings to speak over your children) and *from Scripture* (the Bible's own blessings, Numbers 6:24–26 first). Each page holds three kinds of words, always labelled: **Scripture** in the Berean Standard Bible; **older blessings and graces** that are public domain everywhere, each checked word for word against an early printing and shown exactly as written (a 1741 table grace by John Cennick, Mary Duncan's 1839 "Jesus, tender Shepherd", Arthur Guiterman's 1918 "House Blessing" and ten others); and **short blessings written once for the site** in plain modern English, each with the verses it rests on shown beneath it. Everything can be **printed** in five layouts made for real use: a framed wall print, four cards to a sheet, a folded table card, a colouring page for children, and a room-by-room order to hold while walking through the house. Every item can also be copied, and Scripture blessings will become shareable pictures once the shared verse-card generator exists. All words are written by hand once and stored in the site's code. There are no runtime model calls, no paid services, nothing stored about visitors and nothing new to host.

## 2. Research

### 2.1 What people search for

As in the prayers design, this is an editorial selection checked against the pages that answer these searches, not a measured keyword study (volume data needs a paid tool, and the cost rule asks for $0).

1. **Three families of search, matching the spec's three nouns.** *House:* "house blessing prayer", "blessing for a new home", "house blessing printable", "how to bless your house", "house blessing room by room". *Table:* "prayer before meals", "short grace before meals", "family dinner prayer", "Thanksgiving prayer before the meal", "Christmas dinner prayer", "grace for kids". *Bedtime:* "bedtime prayers for kids", "bedtime blessing for children", "blessing to pray over your children", "Now I lay me down to sleep".
2. **"Printable" is attached to all three.** People want a sheet for the fridge, a sign by the door, a card at a child's bedside. The results are dominated by printables: room-by-room house-blessing PDFs ([Sara, Living Free prayer walk](https://saralivingfree.com/wp-content/uploads/2021/12/5-prayer-walk-for-a-peaceful-home-free-pdf.pdf), [A Good Book Hunt verses by room](https://www.agoodbookhunt.com/book-lists/bible-verses-for-home-by-room), [Loving Life at Home one-page blessing](https://lovinglifeathome.com/2019/05/06/house-blessing-printable/)), bedtime prayer cards ([For the Family fill-in-the-name blessings](https://forthefamily.org/bedtime-blessings/), [Childhood Bible Stories cards](https://childhoodbiblestories.com/bedtime-prayers)) and shop prints of "God is great, God is good" and "Bless the four corners of this house".
3. **Parents search on behalf of children, and children are the audience at the table and at bed.** So the children's pages must work twice over: as words a parent reads to a three-year-old, and as words a seven-year-old can read alone.
4. **Old words are wanted by name.** "Come, Lord Jesus, be our guest", "God is great, God is good", "Now I lay me down to sleep", the Doxology ("Praise God from whom all blessings flow"). People search the first line because they half-remember it from childhood. Each gets its own anchor and its first line in the page text, so the search finds the page.

### 2.2 What they find today, and what we do differently

An editorial sample, not a claim about every page:

1. **Gated printables.** Many "free printables" ask for an email address first. Here every print is one tap, with no address, account or sign-up.
2. **Older words misattributed or retouched.** Guiterman's 1918 poem is sold everywhere as a "traditional Irish blessing"; "Now I lay me down to sleep" is printed with a dozen invented endings and no word of which is original. Here each older text names its real author and first printing, and is shown as first printed. Where a line troubles parents (the "If I should die before I wake" line), the page says so honestly and offers a gentler older prayer beside it, instead of rewriting the old one (4.3).
3. **King James or paraphrase for Scripture.** Most cards quote the KJV, or a translation that prints "Yahweh". Here every verse is the Berean Standard Bible, loaded from the site's files.
4. **Practices outside Baptist conviction.** House-blessing liturgies online often sprinkle holy water, chalk the door at Epiphany, burn sage or "cleanse the house of spirits" ([an example parish liturgy](https://www.holycommunionbend.org/hp_wordpress/wp-content/uploads/2021/03/Blessings-for-a-Home.pdf) sprinkles holy water room by room). None of that is here (2.4).
5. **The "powerful prayer" genre.** "40 Powerful Short Bedtime Prayers For Kids 2026". The prayers design's tone rules apply here unchanged (4.6).
6. **Generated prayers.** At least one site writes a child's bedtime prayer with an AI model from the child's name and worries. This site writes its words once, by hand, and never sends a child's name anywhere (8.3).

### 2.3 How Baptists bless a home

This shapes the whole feature:

- **Baptists have no house-blessing rite and no priestly blessing of objects.** What they have, and what this feature serves, is **family worship**: reading Scripture, singing and praying together at home, a habit Baptist and other Dissenting families kept for centuries (Matthew Henry's *A Method for Prayer*, 1710, used among Dissenters, has morning and evening family prayers and graces; the prayers design 2.3 describes it). Deuteronomy 6:7 is the charter: speak of God's words "when you sit at home and when you walk along the road, when you lie down and when you get up". The table and the bedside are exactly those moments.
- **A "house blessing" in a Baptist home is a dedication and a prayer.** The family, often with friends or their pastor, asks God's favour on the home and gives the household to his service ("As for me and my house, we will serve the LORD", Joshua 24:15b). Jesus' own instruction gives the opening words: "Whatever house you enter, begin by saying, 'Peace to this house'" (Luke 10:5). A room-by-room walk with a verse and a short prayer in each room is a common, free-church-friendly form, and is what page 3.2's "room by room" builds.
- **To bless the food is to thank God for it.** Jesus "looking up to heaven, He spoke a blessing" over the loaves (Matthew 14:19) and "gave thanks" (John 6:11); Paul "took bread and gave thanks to God in front of them all" (Acts 27:35); food "received with thanksgiving… is sanctified by the word of God and prayer" (1 Timothy 4:4–5). Israel was told to bless the LORD *after* eating too (Deuteronomy 8:10), so the table page has a short thanks for after the meal.
- **Parents blessing children is biblical and old.** Jacob blessed his grandsons (Genesis 48:20); the priests blessed Israel with the words God gave (Numbers 6:22–27); Jesus "took the children in His arms, placed His hands on them, and blessed them" (Mark 10:16). A parent saying "The LORD bless you and keep you" over a child at bedtime is a Scripture prayer for the child, not a priestly act.

### 2.4 Doctrine sets the boundaries

Everything the site writes agrees with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). For this feature:

1. **A blessing asks God; it does not work by itself.** No words, objects or rituals make a house safe. Nothing here uses holy water, oil, salt, chalk, candles as protection, sage or "smudging", and nothing speaks of cleansing a house of spirits or "claiming" it. The page says plainly, once: *"A house blessing is not a charm. It is a family asking God to make their home his, and giving it to him."* (Psalm 127:1).
2. **Addressed to God, through Christ.** Every written blessing and grace is addressed to God (or, as a spoken blessing, asks the LORD to bless someone), and prayers close in Jesus' name. Nothing is addressed to saints, Mary or angels. Older texts that mention angels (Watts's evening song, 4.3) ask *God* for his angels' care; a note gives Hebrews 1:14 and says the prayer is to God, not to angels.
3. **No promises the Bible does not make.** A bedtime blessing may say God is near and watches over the child (Psalm 121:3–4) and that we can sleep in peace trusting him (Psalm 4:8). It never says "nothing bad will ever happen to you". Verses that sound like guarantees carry the same notes the prayers feature uses (`GUARD_NOTE` on Psalm 121, the Psalm 91 note; 4.4). A grace never implies that thankful families will always have plenty; one older grace (the Selkirk Grace) remembers those who have no food.
4. **A blessing "for" a child does not put words of faith in the child's mouth they cannot mean.** Children's prayers are simple and true for a believing child, and still kind to a child who is not sure: "Thank you, God, for all today" rather than vows. The same holds for a household: the site's words ask God to make a home his and give it to him, but never vow on behalf of every person in it (Joshua's "As for me and my house" is shown as Scripture, his own words, not put in the family's mouth). The site does not claim that saying a prayer makes a child a Christian. Where the gospel belongs (the "blessing your children" page), one sentence links the site's study *The Good News* (`/study/the-good-news`), as the prayers feature does.
5. **Marriage and family** (article 18). Family words assume a household of any shape: parents, a single mother, grandparents raising grandchildren, a widower, a couple without children, a student in a flat. No blessing assumes two parents or children at all, except the pages that are for children.
6. **Life from conception** (article 15). A new baby's room in the room-by-room order is blessed as a person's room ("for the child you are forming", Psalm 139:13).
7. **Baptism and dedication.** Nothing here is a christening or a dedication service. The "blessing your children" page links the life-event baby-dedication pack for families planning one.
8. **Scripture in the Berean, older texts as written.** Under the doctrinal foundation, "a historic document's own text stays as written". None of the chosen older texts quotes a verse outright, so none needs restating; allusions stay as written.

### 2.5 Sources and rights

The rule for every older text: **public domain in both the United States and the United Kingdom** (US: first published before 1931; UK: author died more than 70 years ago), checked word for word against an early printing or scan before it is stored. Where a text survives in several wordings, the page shows the earliest one we can check and records which. Research done 2026-11-10.

| Source | Rights | Decision |
|---|---|---|
| **Berean Standard Bible** | Public domain (dedicated 2023) | All Scripture, loaded from [data/plain/bsb/](../../../data/plain/bsb/) |
| **John Cennick, "Be present at our table, Lord"**, *Sacred Hymns for the Children of God*, 1741 ([hymnary.org](https://hymnary.org/text/be_present_at_our_table_lord); [Cyber Hymnal 611](https://hymnary.org/hymn/CYBER/611)) | PD (Cennick d. 1755) | **Use** stanza 1 (the classic grace) and the stanza "We thank thee, Lord, for this our food, / But more because of Jesus' blood" (gospel-centred, loved by evangelicals). Line 3 varies in later books ("Thy creatures bless" / "These mercies bless"); store the 1741 wording after checking a scan, and gloss "creatures" (created things: the food) |
| **The Common Table Prayer, "Come, Lord Jesus, be our guest"** (German "Komm, Herr Jesu, sei unser Gast", earliest known printing a 1698 schoolbook; [Eggert, *Lutheran Quarterly* 37, 2023](https://www.lutheranquarterly.org/wp-content/uploads/2023/03/03_LUT_37-1_Eggert_049-072.pdf)) | German original PD. The English couplet is anonymous, and **no dated English printing was found** at review (web search 2026-11-10). The wording also varies: the common Lutheran form is "let **Thy** gifts to us be blessed", the Moravian one "Come, Lord Jesus, our Guest to be" | **Use only once a pre-1931 English printing is found and checked** (the rule above; HathiTrust, Google Books or an early Lutheran or Moravian hymnal or catechism). Store that printing's wording, whether "Thy gifts" or "these gifts", and name it. Label "Traditional German table prayer (printed by 1698)". Not attributed to Luther, a common error. If no such printing is found, the item is left out (before-meals keeps nine items; graces-for-kids keeps at least four, if "God is great" is also left out) and the step says so |
| **"God is great, God is good"** (American, anonymous) | Author unknown; no earliest printing found ([search notes](https://medium.com/mustard-seed-sentinel/god-is-great-god-is-good-61eb090f53e9) agree the origin is unclear). An anonymous folk grace with generations of use and no claimant | **Use only once a pre-1931 printing is found and checked**, as for every older text: the review does not exempt it. A web search at review (2026-11-10) found no dated printing; popular pages say it circulated in Sunday-school books in the 1800s, and one gives an older wording, "God is great, and God is good, and we thank Him for our food". Step 19 searches dated collections (HathiTrust full text, Google Books, before 1931), stores the wording of the printing it finds and labels it "Traditional children's grace, author unknown", with that printing named. If none is found, the item is left out and the step reports it: the page's first line still answers the search in the introduction ("…the grace many families know as 'God is great, God is good'"), naming it without printing the text |
| **Edith Rutter Leatham, "Thank you for the world so sweet"**, first printed as "Mary's Grace" in *Our Little Dots*, 1899 ([hymnology note](https://ldshymnology.wordpress.com/2023/11/12/the-childrens-songbook-part-2-songs-of-thanksgiving/); [hymnary.org](https://hymnary.org/text/thank_you_for_the_world_so_sweet)) | PD (published 1899; Leatham d. 1939) | **Use** on the children's graces page. Credit her by name; most sites print it anonymously |
| **The Selkirk Grace** (Scots, traditional; often credited to Robert Burns, but older) | PD | **Use** once, on the before-meals page, with a gloss ("hae" = have, "canna" = cannot, "wad" = would, "thankit" = thanked). It is the one grace that remembers those with no food (2.4 rule 3). Label "Traditional Scottish grace, long linked with Robert Burns" |
| **Thomas Ken, the Doxology** ("Praise God, from whom all blessings flow…", the closing stanza of his morning and evening hymns, 1690s) | PD (Ken d. 1711) | **Use** as a sung grace (many Baptist families sing it before meals) and to close the room-by-room order. Gloss "Ghost" = Spirit. Third line "ye heavenly host" as Ken wrote it, not the modern "angelic host" |
| **Thomas Ken, Evening Hymn, stanza 1** ("Glory to thee, my God, this night, / For all the blessings of the light…") | PD | **Use** on the bedtime page. Ken's own early text (1697) reads "**Under** thy own almighty wings"; later hymnals print "Beneath thine own". Store the wording of the edition actually checked (Ken's 1709 revision if a scan is found), and say which ([hymnary.org instances](https://hymnary.org/hymn/CP1998/25); [1697 text note](https://www.hymnsandcarolsofchristmas.com/Hymns_and_Carols/NonChristmas/glory_to_thee_my_god_this_night-1697.htm)) |
| **Mary Lundie Duncan, "Jesus, tender Shepherd, hear me"**, written 1839 for her children; printed in *Memoir of Mrs W. W. Duncan* (Edinburgh, 1841) and *Rhymes for my Children* (1842) ([Canterbury Dictionary of Hymnology](https://hymnology.hymnsam.co.uk/j/jesus,-tender-shepherd,-hear-me); [Hymntime](http://www.hymntime.com/tch/htm/j/t/e/n/jtenders.htm)) | PD (Duncan d. 1840) | **Use** stanzas 1 and 2, labelled "the first two verses". Stanza 3 ("Take me, when I die, to heaven") is shown on the page in full, not on the children's print by default (4.3). Variants ("has/hath led me", "clothed me, warmed and fed me" / "warmed me, clothed and fed me") are settled against an 1841/1842 scan |
| **Charles Wesley, "Gentle Jesus, meek and mild"**, *Hymns and Sacred Poems*, 1742 | PD (Wesley d. 1788) | **Use** stanza 1 on the bedtime page; gloss "suffer" = allow (as in Jesus' "let the little children come to Me", Mark 10:14). Check against a 1742 scan |
| **Isaac Watts, *Divine Songs Attempted in Easy Language for the Use of Children***, 1715 | PD; **already in the site's hymn data** ([divine.json](../../../data/hymns/texts/divine.json), 44 songs, each with source and licence) | **Use** Song 26, "An Evening Song", stanzas 3–4 ("I lay my body down to sleep…"). **The site's copy of stanza 3 ends "head" twice** ("Let angels guard my head… Their watch around my head"); Watts's rhyme is head / bed. The implementer checks the [CCEL scan](https://ccel.org/ccel/watts/divsongs), stores the correct line here, and reports the hymn-data slip to the hymns owner rather than editing that data (another feature's file). The Cradle Hymn (Song S8, "Hush, my dear") is linked, not printed: 14 stanzas is too long for a card |
| **"Now I lay me down to sleep"** (*The New England Primer*; Fleet's 1737 edition is usually cited, an earlier form may appear in Wheler's *The Protestant Monastery*, 1698) ([overview](https://en.wikipedia.org/wiki/Now_I_Lay_Me_Down_to_Sleep)) | PD | **Use** in the four-line form people search for, checked against a dated Primer scan, with the honest note of 4.3. Never with an invented gentler ending: the gentler options are the other older prayers on the same page |
| **Arthur Guiterman, "House Blessing"**, *The Mirthful Lyre* (Harper, 1918), p. 188 ([archive.org scan](https://archive.org/details/mirthfullyre01guitgoog)) | PD in the US (published 1918) and UK (Guiterman d. 1943); [hymnary.org](https://hymnary.org/text/bless_the_four_corners_of_this_house) lists it as public domain | **Use** as the house page's older blessing and a wall print. **Checked on 2026-11-10 against the scan's text** (4.3). Credit Guiterman, and say gently that it is often sold as an Irish blessing but is his |
| Helen Taylor, "Bless This House" (song, 1927) | Lyric probably PD in the US (1927) and UK (Taylor d. 1945 or earlier, to be confirmed); the music and later arrangements are not | **Not used.** Its rights need more checking than its value repays, and Guiterman's poem covers the same ground |
| **Book of Common Prayer 1662** | Crown copyright in the UK; Cambridge permits up to 500 words. The prayers feature already uses **449** of them | **Not used anywhere in this feature**, so the site stays inside the permission. "Peace be to this house" is taken from Luke 10:5 in the Berean instead |
| "The Lord is good to me" (the "Johnny Appleseed" grace, 1948 song) | In copyright | Not used |
| Modern "bless this home" plaques, Irish toasts ("May the road rise…") | Varied or folk; the toasts are wishes, not prayers to God | Not used |
| Martin Luther's evening prayer (Small Catechism) | German original PD; most English translations in copyright | Not at launch; a later addition if a PD translation is checked |
| Matthew Henry, *A Method for Prayer* (1710) | PD | Used as the model for family prayers, not quoted (its Scripture is KJV, as the prayers design found) |

**The thirteen older texts total about 420 words** (418 as drafted in 4.3), all public domain, so no word cap applies (unlike the 1662 book). Two of the thirteen ("Come, Lord Jesus" and "God is great, God is good") ship only if their pre-1931 printing is found. All but Guiterman's poem (71 words, 371 characters) are short enough for a card; Duncan's two verses (51 words) fit a card only by the printed-line limit of 6.1.

### 2.6 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| A short reference read into verse ids, with exact "a"/"b" excerpts and context notes | `p()`, `sp()`, `SympathyPassage` | [types.ts](../../../src/data/life-events/types.ts), [src/data/sympathy/](../../../src/data/sympathy/) |
| Shared roots and notes already used by the prayers: Numbers 6 with its note, Psalm 121 with `GUARD_NOTE`, Lamentations 3, topic titles `T` | `priestlyBlessing`, `guarded`, `GUARD_NOTE`, `newMercies`, `T` | [shared.ts](../../../src/data/occasion-prayers/shared.ts) (imported, not copied, so a note is written once) |
| Assembling and tidying a passage; its reference; reader link; card length limits (240 / 320 / 700) | `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL`, `CARD_MAX`, `DISPLAY_MAX` | [passage.ts](../../../src/pages/life-events/passage.ts) |
| Loading a page's verses | `usePrayerVerses` (pattern to copy) | [usePrayerVerses.ts](../../../src/pages/occasion-prayers/usePrayerVerses.ts) |
| Permanent passage key for anchors | `passageKey` | [card-keys.ts](../../../src/data/sympathy/card-keys.ts) |
| Printing one sheet outside the app; paper size; can this browser print; wait for fonts | `PrintPortal`, `usePrintSheet(paper, margin)`, `defaultPaper`, `canPrint`, `useFontsReady`, `PAPER_SIZE` | [print-sheet.ts](../../../src/pages/life-events/print-sheet.ts) (its header names home blessings as a planned user), [PrintPortal.tsx](../../../src/pages/life-events/PrintPortal.tsx) |
| Card geometry proven in print: quarter-fold card 4.25 × 5.5 in / A6, four small cards per sheet with cut guides, display print in an 8 × 10 in area on Letter / whole A4 | The life-event sheet rules | [life-event-packs design 6.1–6.6](../life-event-packs/design.md), [life-events-sheet.css](../../../src/pages/life-events/life-events-sheet.css) (geometry copied into this feature's own sheet CSS, not imported, because `CardSheet.tsx` is built around the packs' card description) |
| Line-art ornaments that print with ink only | `Ornament` (star, sprig, vine, sunrise, lamp, book, key, tree, heart …) | [Ornament.tsx](../../../src/pages/life-events/Ornament.tsx) |
| Copy with a fallback when the clipboard is blocked | `useCopy` | [useCopy.tsx](../../../src/pages/occasion-prayers/useCopy.tsx) (pattern to copy) |
| Tab title that resets on leaving | `usePrayerHead` | [usePrayerHead.ts](../../../src/pages/occasion-prayers/usePrayerHead.ts) (pattern to copy) |
| Public address for links | `SITE_ORIGIN = "https://bibleguide.io"` | [page-head.ts](../../../src/lib/page-head.ts) |
| Unknown address | The site's not-found page | [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) |
| Watts's children's songs, with source and licence | Hymn data and hymn pages at `/study/hymns/:id` | [data/hymns/texts/divine.json](../../../data/hymns/texts/divine.json), [HymnPage.tsx](../../../src/pages/study/hymns/HymnPage.tsx) |
| Topic pages, all checked on 2026-11-10 to exist with references | `blessing` (416), `benedictions` (86), `house` (96), `hospitality` (105), `children` (326), `parents` (209), `instruction-of-children` (20), `sleep` (13), `rest` (25), `night` (93), `thankfulness` (275), `thanksgiving` (92), `food` (61), `bread` (173), `praise` (457), `peace` (183), `protection` (102), `prayer` (415), `grace` (86), `strangers` (37) | [data/topics/index.json](../../../data/topics/index.json) |

Topic slugs that **do not exist** (or have no references) and must not be linked: `family`, `home`, `fathers`, `mothers`, `guests`, `singing`.

**What is still being built:** Chain C's verse-card generator ([verse-cards/design.md](../verse-cards/design.md)). At review (2026-11-10, later the same day) its implement step (sequence 32 step 16) was running and its code was already in the site folder but **not committed**: [src/lib/verse-card/](../../../src/lib/verse-card/README.md) (`CardSpec`, `Look`, `lookProblems`, `renderCard`) and [CardSharePanel.tsx](../../../src/components/verse-card/CardSharePanel.tsx). Section 8.2 is written against that real interface and says how this feature adopts it.

### 2.7 Neighbouring features: who covers what

| Need | Where it belongs | How the pages relate |
|---|---|---|
| A short prayer for moving day, for yourself or someone who has moved | Prayers for occasions, `/prayers/new-home` (built) | The house-blessing page links to it ("A prayer for moving day"). Its `elsewhere` list gains a link back to `/blessings/house-blessing`, as both designs planned (5.5) |
| Opening and closing prayers for a meeting; Numbers 6 as a closing blessing | Prayers for occasions, `/prayers/closing-a-meeting` | The Scripture-blessings page links there for church use; that page is not changed |
| Verses and a printable card for a new baby or a dedication | Life-event packs (built) | The "blessing your children" page links `new-baby` and `baby-dedication`. Packs are not edited |
| Advent and Lent readings | Countdowns (`/countdowns`) | Not linked at launch; an Advent table grace is a later idea (10) |
| What the Bible says to a frightened child or a grieving family | "When you're…" (`/when-youre`, built) and sympathy (`/sympathy`, built) | The holiday-graces page has one grace for "a table with an empty chair", linking `/sympathy` and `/when-youre/grieving` quietly. The bedtime page links `/when-youre/afraid` for parents |
| Bible questions and lessons for children | The children's tests at `/study/questions/children` (the children's page chat's work) | The children's band on the hub links it in one line. Nothing on the children's page is changed |
| Picture cards of a verse | Verse cards (chain C) | Scripture items adopt the generator once it exists (8.2) |

## 3. Pages and categories

### 3.1 How the pages were chosen

A page earns its place when (a) people search for it in the shapes of 2.1, (b) it is a distinct *use* at home (the door, the table, the bed), and (c) its words and its print layout differ from its neighbours'. Merged: "kitchen blessing" and "blessing for the dining room" into **room by room**; "after-meal thanks" into **before meals**; "Christmas", "Easter" and "Thanksgiving" dinner into **holiday meals**; "morning prayers for kids" into **blessings to speak over your children** (a blessing as they leave the house); "blessing for a nursery" into **room by room** and **blessings to speak over your children**. Left for later: 10.

### 3.2 The eight launch pages

| Group | Address `/blessings/…` | Heading | Search title (≤ 50 characters, before " · Bible Guide") | Searches it answers | Children's styling |
|---|---|---|---|---|---|
| For the house | `house-blessing` | A House Blessing | House Blessing Prayer to Read and Print | house blessing prayer · blessing for a new home · bless this house · printable | — |
| For the house | `room-by-room` | Blessing Your Home, Room by Room | House Blessing Room by Room, with Scripture | how to bless your house · room by room house blessing · home dedication | — |
| At the table | `before-meals` | Prayers Before Meals | Prayers Before Meals: Short Graces for the Table | prayer before meals · short grace · family dinner prayer · Come, Lord Jesus · Doxology | — |
| At the table | `holiday-meals` | Graces for Holiday Meals | Thanksgiving and Christmas Dinner Prayers | Thanksgiving prayer before meal · Christmas dinner prayer · Easter dinner prayer | — |
| For children | `graces-for-kids` | Simple Graces for Children | Short Mealtime Prayers for Kids | grace for kids · God is great God is good · prayer before meals for kids | Yes |
| For children | `bedtime` | Bedtime Blessings and Prayers for Children | Bedtime Prayers and Blessings for Kids | bedtime prayers for kids · Now I lay me down to sleep · Jesus tender Shepherd | Yes |
| For children | `blessing-your-children` | Blessings to Speak Over Your Children | Blessings to Pray Over Your Children | blessing over children · parents' blessing · Numbers 6 blessing for kids | Yes |
| From Scripture | `scripture-blessings` | Blessings from the Bible | Bible Blessings to Say at Home, Like Numbers 6 | Numbers 6:24-26 · the Lord bless you and keep you · biblical blessings · benedictions | — |

Search titles are at most 50 characters. Headings are unique. The hub's title in `ROUTE_TITLES`: **"Home Blessings, Table Graces and Bedtime Prayers"** (48). Eight pages is far below the ~50-row long-list threshold, so the hub renders every card and needs no windowing and no filter box.

### 3.3 What each page holds

Each page is a short introduction and then a list of **items**. An item is one of three kinds, always labelled so a reader knows what they are holding:

| Kind | Label on the page | Source | Shown as |
|---|---|---|---|
| **Scripture** | the reference ("Numbers 6:24–26") and "Berean Standard Bible" | loaded from the site's Berean files | Literata, inside `.scripture` with `lang="en"` |
| **Older** | "An older grace" / "An older blessing", the author and year ("John Cennick, 1741") | the verified texts of 4.3 | Literata, `lang="en"`, with glosses beside |
| **Written for this site** | "A blessing" / "A grace" / "A bedtime prayer", with **"Rooted in Scripture"** under it | written by hand once (4.5) | Literata; the verses it rests on in full beneath, as on the prayers pages |

| Page | Items (in order; the first is featured) | Count |
|---|---|---|
| house-blessing | written: *At the front door* (4.5) · older: Guiterman, "House Blessing" · Scripture: Luke 10:5, Psalm 127:1, Joshua 24:15b, Isaiah 32:18 · written: *A blessing for someone's new home* (to give as a housewarming card; `[name]`) | 7 |
| room-by-room | an order of nine stations (4.4), each a Scripture reading and a short written prayer, then the Doxology and Numbers 6:24–26 said together; a one-paragraph "How to do it" at the top | 9 stations |
| before-meals | older: Come, Lord Jesus · older: Cennick stanza 1 · older: Cennick "for this our food… Jesus' blood" · written: *A grace for every day* · older: the Doxology (sung) · older: the Selkirk Grace · written: *Thanks after the meal* (Deuteronomy 8:10) · Scripture: Psalm 145:15–16, Psalm 136:1, 1 Timothy 4:4–5 | 10 |
| holiday-meals | written graces: *Thanksgiving* (Psalm 100:4–5, Psalm 107:1) · *Christmas* (Luke 2:10–11) · *Easter* (Matthew 28:6, 1 Corinthians 15:57) · *A birthday meal* (Psalm 118:24, Psalm 90:12) · *A table with an empty chair* (Psalm 34:18, Romans 12:15) · *Guests at our table* (Hebrews 13:2, Romans 12:13) | 6 |
| graces-for-kids | written rhyme: *Thank you, God, for food to eat* (4.5) · older: God is great, God is good · older: Leatham, "Thank you for the world so sweet" · older: Come, Lord Jesus · written: *A grace to say in turns* (a call-and-response for a family with small children) · written rhyme: *For hands that made our food* (farmers, cooks; Psalm 104:14, James 1:17) | 6 |
| bedtime | written rhyme: *Thank you, God, for all today* (4.5) · older: Duncan, "Jesus, tender Shepherd" (stanzas 1–2) · older: Wesley, "Gentle Jesus" · older: Ken, "Glory to thee, my God, this night" · older: Watts, Evening Song (stanzas 3–4) · older: "Now I lay me down to sleep" with its note · Scripture: Psalm 4:8, Psalm 3:5, Psalm 56:3, Psalm 121:3–4 · Scripture: the Lord's Prayer, Matthew 6:9–13 (with a note that the Berean, like most modern translations, has no closing "For yours is the kingdom…", and families who say it may keep saying it. The passage starts "So then, this is how you should pray:", because the site's references can only cut the *end* of a passage; that opening is kept and reads naturally as Jesus teaching it. At 62 words it is the one long item on a children's page, offered on screen and as a wall print only, 6.1) · **"My own prayer"** fill-in card (6.3) | 12 |
| blessing-your-children | written: *A bedtime blessing for your child* (`[name]`, 4.5) · Scripture: Numbers 6:24–26 · written: *As they leave the house* (Psalm 121:8 with `GUARD_NOTE`, Deuteronomy 28:6) · written: *On their birthday* (Psalm 139:13–14) · written: *For a child who is afraid* (Psalm 56:3, Zephaniah 3:17) · Scripture: Mark 10:16 · Scripture: Zephaniah 3:17 (with its note, 4.2); then, as the page's `howTo` paragraph rather than an item, "How to bless your children" (hand on the head or shoulder if the child likes it, the same words each night, Mark 10:16 and Genesis 48:20) | 7 + how-to |
| scripture-blessings | Scripture only, each with one line on who said it and when: Numbers 6:24–26 (featured) · 2 Corinthians 13:14 · Romans 15:13 · 2 Thessalonians 3:16 · 1 Thessalonians 5:23 · Hebrews 13:20–21 · Jude 1:24–25 · Ephesians 3:20–21 · Psalm 121:7–8 (`GUARD_NOTE`) · Psalm 134:3 ("May the LORD, the Maker of heaven and earth, bless you from Zion.", 65 characters, read 2026-11-10) | 10 |

Every page also has: the introduction (the first `<p>` of 60+ characters inside `<main>`, so it becomes the search description); **"Explore more"** (sibling pages, 2.7's links, two or three topics from 5.4); and the source lines (6.2 item 8).

## 4. Content: the words, their sources and how they are written

### 4.1 What is written, and by whom

| Part | How many | Source |
|---|---|---|
| Written blessings, graces and prayers | about 30, 25–120 words each | written by hand in step 19 (4.5–4.7) |
| Room-by-room station prayers | 9, 25–50 words each | written by hand (4.4) |
| Older texts | 13 (4.3) | verified, stored exactly |
| Scripture items and roots | about 45 passages | Berean files |
| Introductions | 9 (8 pages and the hub), 40–90 words | written by hand |
| Glosses and notes | about 15 one-liners | written by hand |

Roughly 4,000 words of the site's own. A cheap-model batch is not used: these words are said over children and food every day, there are few enough to write carefully, and every line would still need a doctrinal read. Cost $0, no runtime model.

### 4.2 Scripture per page (the planned roots)

References in the site's `p()` form; all were read in the Berean files on 2026-11-10, and every one is within the 320-character card limit except where marked.

| Page | Scripture items and roots | Context notes |
|---|---|---|
| house-blessing | `LUK 10:5` (65 characters), `PSA 127:1`, `JOS 24:15b` (the excerpt the prayers data uses), `ISA 32:18`, `ROM 12:13`, `PSA 121:8` | `PSA 121:8` carries `GUARD_NOTE` (God goes with his people; not a guarantee that no harm comes). `LUK 10:5`: Jesus' instruction to the seventy-two for the houses they visited; the page uses his greeting as a fitting first word, not as a rite. `ISA 32:18` ("Then my people will dwell in a peaceful place, in safe and secure places of rest") carries a note: "Isaiah describes the peace of God's people under the coming righteous King (Isaiah 32:1, 17). The blessing asks God for that kind of peace in this home; it is a prayer, not a promise that no trouble will come." |
| room-by-room | 4.4 | 4.4 |
| before-meals | `PSA 145:15-16`, `PSA 136:1`, `1TI 4:4-5`, `DEU 8:10`, `MAT 14:19` (239, the blessing over the loaves), `ACT 27:35`, `JAS 1:17` | `DEU 8:10` is God's word to Israel entering the land; the page uses it for thanks after eating, which Christians have long drawn from it |
| holiday-meals | `PSA 100:4-5`, `PSA 107:1`, `LUK 2:10-11`, `MAT 28:6`, `1CO 15:57`, `PSA 118:24`, `PSA 90:12`, `PSA 34:18`, `ROM 12:15`, `HEB 13:2`, `ROM 12:13` | `HEB 13:2` ("entertained angels without knowing it"): a reason to welcome strangers, not a promise that guests are angels |
| graces-for-kids | `PSA 145:15-16`, `JAS 1:17`, `PSA 136:1`, `PSA 104:14` (118 characters; it ends in a colon, so the implementer confirms how `tidyPassageText` shows it, or trims it with an exact excerpt. Verse 15 is left out: it adds wine, which a children's grace does not need), `MAT 6:11` | — |
| bedtime | `PSA 4:8`, `PSA 3:5`, `PSA 56:3` (40), `PSA 121:3-4`, `PSA 127:2b` (excerpt "for He gives sleep to His beloved."), `MAT 6:9-13` (316 characters, 62 words, near the limit; begins "So then, this is how you should pray:", 3.3), `1TH 5:18`, `1JN 1:9`, `HEB 1:14` (for the angels note) | `PSA 121:3-4` uses the shared Psalm 121 note. `PRO 3:24` was considered and **not used**: it is the reward of keeping wisdom (3:21), and a child with nightmares should not read it as a broken promise |
| blessing-your-children | `NUM 6:24-26` (the shared `priestlyBlessing` root), `MRK 10:16`, `MRK 10:14`, `GEN 48:20`, `PSA 121:8` (`GUARD_NOTE`), `DEU 28:6`, `PSA 139:13-14`, `PSA 56:3`, `ZEP 3:17` | `DEU 28:6` is part of the covenant blessings promised to Israel for obedience; the page prays its picture of blessing over a child's comings and goings, and the note says it is not a promise to every family on the same terms. `GEN 48:20`: Jacob's blessing over his grandsons, an example of a family blessing, not a formula to copy. `ZEP 3:17` ("The LORD your God is among you… He will quiet you with His love") carries a note: "God spoke this to his restored people, Jerusalem (Zephaniah 3:14–17). Christian parents pray it over their children as a picture of how God loves his own, and ask that their child would know that love." |
| scripture-blessings | as listed in 3.3; `JUD 1:24-25` (276), `EPH 3:20-21` (225), `HEB 13:20-21` (317, near the limit) | Each item has one line of setting (who said it, to whom). Numbers 6: "The priests of Israel spoke this over the people at God's command (Numbers 6:22–27). Christians have said it over one another, and over their children, ever since." |

**Never used as a root** (the prayers feature's list; it is a constant inside that feature's test file and not exported, so this feature's test repeats the same eight with a comment pointing to [occasion-prayers-data.test.ts](../../../src/data/occasion-prayers/occasion-prayers-data.test.ts) rather than editing that file): Jeremiah 29:11, Romans 8:28, Philippians 4:13, Matthew 18:20, Deuteronomy 8:18, 3 John 1:2, Malachi 2:16, Proverbs 22:6. Proverbs 22:6 matters especially here: on a children's page it reads as a guarantee about how a child turns out. Deuteronomy 6:9 ("Write them on the doorposts of your houses") is shown on the room-by-room front door station with a note (4.4) but is not used as a promise.

### 4.3 The older texts (exact words)

Each is stored exactly, with source, the edition checked, the check date, glosses and a word count, and a checksum test (9.3) catches an accidental edit. As in the prayers feature, the checksums live in the **test file**, not beside the text in the data, so an edit to the words cannot quietly update its own checksum. Capitalisation of pronouns for God follows the printing checked. Line breaks are kept: these are verse.

| Short name | Text as it will be stored (pending the scan check named) | Words | Checked against | Gloss / note shown beside it |
|---|---|---|---|---|
| **House Blessing** (Guiterman, 1918) | "Bless the four corners of this house, / And be the lintel blest; / And bless the hearth and bless the board / And bless each place of rest; / And bless the door that opens wide / To stranger as to kin; / And bless each crystal window-pane / That lets the starlight in; / And bless the rooftree overhead / And every sturdy wall. / The peace of man, the peace of God, / The peace of Love on all!" | 71 | *The Mirthful Lyre* (1918), p. 188, archive.org text of the Harvard copy, read 2026-11-10. The scan's text reads "comers" (a scanning slip for "corners") and its punctuation after the first line must be read on the page image | "Lintel": the beam over the door. "Board": the table. "Rooftree": the main beam of the roof. "Often sold as an Irish blessing; the words are by the American poet Arthur Guiterman." |
| **Come, Lord Jesus** (Common Table Prayer) | "Come, Lord Jesus, be our guest, / And let these gifts to us be blessed. Amen." (or "Thy gifts", whichever the printing has) | 15 | **a pre-1931 English printing, required** (2.5); left out if none is found | "A table prayer German families have said since at least 1698." |
| **Be present at our table** (Cennick, 1741, stanza 1) | "Be present at our table, Lord; / Be here and everywhere adored; / Thy creatures bless, and grant that we / May feast in paradise with thee." | 24 | 1741 scan to be checked for line 3 | "Thy creatures": the things you made, this food. "Paradise": heaven, the feast to come (Revelation 19:9) |
| **More because of Jesus' blood** (Cennick, 1741) | "We thank thee, Lord, for this our food, / But more because of Jesus' blood; / Let manna to our souls be given, / The Bread of Life sent down from heaven." | 29 | 1741 scan ("food" or "good" in line 1 is a known variant) | "Manna": the bread God sent Israel in the desert; Jesus calls himself the true bread from heaven (John 6:32–35) |
| **God is great, God is good** (traditional) | "God is great, God is good, / Let us thank him for our food. / By his hands we all are fed; / Give us, Lord, our daily bread. Amen." | 27 | **a pre-1931 printing, required** (2.5); its wording replaces this one; left out if none is found | — |
| **Thank you for the world so sweet** (Leatham, 1899) | "Thank you for the world so sweet, / Thank you for the food we eat, / Thank you for the birds that sing, / Thank you, God, for everything." | 26 | an early printing (1899 or her 1913 *Lyrics and Poems*) | — |
| **The Selkirk Grace** (traditional Scottish) | "Some hae meat and canna eat, / And some wad eat that want it; / But we hae meat, and we can eat, / Sae let the Lord be thankit." | 27 | an early printing | "Hae": have. "Canna": cannot. "Wad": would. "Sae": so. "Thankit": thanked. "A grace that remembers those who have no food." |
| **The Doxology** (Ken) | "Praise God, from whom all blessings flow; / Praise him, all creatures here below; / Praise him above, ye heavenly host; / Praise Father, Son, and Holy Ghost." | 25 | Ken's 1709 edition if a scan is found, else a dated 18th-century printing | "Ghost": Spirit. "Often sung before meals, to the tune Old Hundredth." |
| **Glory to thee, my God, this night** (Ken, stanza 1) | "Glory to thee, my God, this night, / For all the blessings of the light; / Keep me, O keep me, King of kings, / Under thy own almighty wings." | 27 | 1697 wording as above, or the 1709 revision ("Beneath thine own") if that is the scan found; the page names the edition | "Almighty wings": a picture from the psalms of God's shelter (Psalm 91:4) |
| **Jesus, tender Shepherd** (Duncan, stanzas 1–2) | "Jesus, tender Shepherd, hear me; / Bless thy little lamb tonight; / Through the darkness be thou near me; / Watch my sleep till morning light. // All this day thy hand has led me, / And I thank thee for thy care; / Thou hast clothed me, warmed and fed me; / Listen to my evening prayer." | 51 | 1841 *Memoir* or 1842 *Rhymes for my Children* | "Written in 1839 by Mary Duncan, a Scottish mother, for her own children." Stanza 3 is shown on the page under "The third verse" with a note (below) |
| **Gentle Jesus** (Wesley, 1742, stanza 1) | "Gentle Jesus, meek and mild, / Look upon a little child; / Pity my simplicity, / Suffer me to come to thee." | 19 | 1742 scan | "Suffer": let, allow. Jesus said, "Let the little children come to Me" (Mark 10:14) |
| **An Evening Song** (Watts, 1715, Song 26, stanzas 3–4) | "I lay my body down to sleep, / Let angels guard my head, / And through the hours of darkness keep / Their watch around my bed. // With cheerful heart I close mine eyes, / Since thou wilt not remove; / And in the morning let me rise / Rejoicing in thy love." | 47 | CCEL scan; the site's hymn data has "head" for "bed" (2.5) | "This asks God for his angels' care: the Bible calls angels God's servants sent to help his people (Hebrews 1:14). The prayer is to God, not to the angels." "Remove": go away |
| **Now I lay me down to sleep** (*New England Primer*) | "Now I lay me down to sleep, / I pray the Lord my soul to keep; / If I should die before I wake, / I pray the Lord my soul to take." | 30 | a dated Primer scan; if the earliest checked wording differs ("I lay me down to rest me…"), show the familiar form labelled "as it has been said for two centuries" and give the Primer's in a note | Note below |

**The note on the death line.** Shown beside "Now I lay me down to sleep" and under Duncan's third verse, in the site's voice: *"Children used to pray this when many did not live to grow up. It trusts God with everything, even death, and that is a true and good thing to know. Some children find the line about dying frightening; if yours does, the prayers above it are gentler. There is no need to change the old words: choose the prayer that fits your child."* Neither text is altered and neither is printed on a children's card unless the parent picks it.

### 4.4 The room-by-room order

A printable order (the flowing "order" layout of 6.1) for a family, friends or a pastor walking through a home. Each station: a heading, the place, one Scripture reading (said by anyone), a short written prayer (25–50 words, said by the leader), and "**All:** Amen." A station can be skipped; the print has a checkbox list so a family chooses which rooms to print.

| # | Station | Reading | The prayer asks for (roots in brackets) |
|---|---|---|---|
| 1 | **At the front door** | Luke 10:5 · Psalm 121:8 | Peace on the house and all who live in it (Luke 10:5); God's watch over every coming and going (Psalm 121:8, `GUARD_NOTE`); a door open to others (Romans 12:13). Deuteronomy 6:9 is shown beneath with the note: "Israel was told to write God's words on their doorposts. Christians are not given that command, but many put a verse by the door as a reminder; this sheet can be that verse." |
| 2 | **Where we gather** (living room) | Psalm 133:1 | Harmony, patience and honour for one another (Psalm 133:1, Romans 12:10) |
| 3 | **Where food is made and shared** (kitchen and table) | Psalm 145:15–16 | Thanks for daily bread; gladness and sincerity at the table (Acts 2:46, Matthew 6:11) |
| 4 | **Where we rest** (bedrooms) | Psalm 4:8 | Rest, peace and sleep as God's gift (Psalm 4:8, Psalm 127:2b) |
| 5 | **A child's room** | Mark 10:16 | The child to know Jesus' welcome; parents to teach them God's words at home (Mark 10:14, Deuteronomy 6:7). For a baby on the way: "for the child you are forming" (Psalm 139:13) |
| 6 | **Where the work is done** (study, laundry, workshop) | Colossians 3:23 | Work done wholeheartedly for the Lord; God to establish the work of our hands (Colossians 3:23, Psalm 90:17, with the prayers feature's reading-check on "favour") |
| 7 | **A room for guests** (or wherever guests sleep) | Romans 12:13 | Hospitality to friends and strangers (Romans 12:13, Hebrews 13:2 with its note) |
| 8 | **Outside** (garden, balcony, yard) | Psalm 24:1 | Thanks that the earth is the LORD's; care for what we are given (Psalm 24:1, Genesis 2:15) |
| 9 | **All together** (back at the door, or the table) | Joshua 24:15b | The home given to God, and a prayer that everyone who lives here would know and serve him (Joshua 24:15b, Psalm 127:1): asked for, not vowed on each person's behalf (2.4 rule 4); then the Doxology sung or said, and Numbers 6:24–26 said over everyone |

"How to do it", at the top of the page (written, about 80 words): any time, not only on moving day; anyone may lead, a parent, a friend or a pastor; children can carry the sheet or read a verse; no candles, water or oil are needed, because the blessing is the prayer (2.4 rule 1).

### 4.5 Written words, three samples to set the standard

Working drafts for step 19 to polish; the reviewer judges every other written item against these. Each follows the prayers feature's rule: **every thing a blessing says about God, or asks of him, rests on a verse listed under it.**

**House blessing: At the front door** (77 words; rooted in Luke 10:5, Psalm 127:1, Joshua 24:15b, Isaiah 32:18, Romans 12:13, Psalm 121:8)

> Peace to this house, and to everyone who lives here. Lord, unless you build this house, our work on it is in vain, so we ask you to build it. Make this a home that serves you. Make it a peaceful place, safe and secure, a place of rest. Let its door be open to friends and strangers, and its table ready to share. Watch over our coming and going, now and always. In Jesus' name, amen.

Rooting: "Peace to this house" (Luke 10:5); build, in vain (Psalm 127:1); a home that serves God (Joshua 24:15b, asked for rather than vowed for everyone, 2.4 rule 4); peaceful, secure, rest (Isaiah 32:18, with its note in 4.2); open door, sharing (Romans 12:13); coming and going (Psalm 121:8, with `GUARD_NOTE`).

**Children's grace: Thank you, God, for food to eat** (25 words; rooted in James 1:17, Psalm 136:1, Psalm 145:15–16)

> Thank you, God, for food to eat
> and every gift you give.
> Your love will never, ever end,
> and by your hand we live.
> Amen.

Rooting: every good gift from above (James 1:17); love that endures forever (Psalm 136:1); "You open Your hand and satisfy" (Psalm 145:16).

**Children's bedtime prayer: Thank you, God, for all today** (44 words; rooted in 1 Thessalonians 5:18, 1 John 1:9, Psalm 56:3, Psalm 121:3–4, Psalm 3:5)

> Thank you, God, for all today;
> forgive the wrong I've done, I pray.
> When I'm afraid, I trust in you;
> you stay awake the whole night through.
> I lie down now and close my eyes,
> and you will keep me till I rise.
> Amen.

Rooting: thanks for the whole day, hard days included (1 Thessalonians 5:18, "Give thanks in every circumstance"; the draft's "this good day" said more than that verse and was changed at review); forgiveness (1 John 1:9); "When I am afraid, I put my trust in You" (Psalm 56:3); God neither slumbers nor sleeps (Psalm 121:3–4); "I lie down and sleep; I wake again, for the LORD sustains me" (Psalm 3:5).

**A bedtime blessing for your child** (opening, to show the token): "Goodnight, [name]. God made every part of you, and you are wonderfully made. The Lord your God is with you; he delights in you and quiets you with his love…" (Psalm 139:13–14, Zephaniah 3:17, both among its roots; Zephaniah 3:17 carries its note from 4.2, and the Berean says "among you" where the blessing says "with you", which the root shown beneath makes plain). It closes by saying Numbers 6:24–26 itself, shown as Scripture in its own block, not run into the written words.

### 4.6 Writing rules for every word the site writes here

The prayers feature's tone rules (its 4.6) apply in full: no technique words ("powerful", "claim", "declare", "decree", "breakthrough"…), no promises Scripture does not make, no pressure or guilt, no "!" outside quoted Scripture, modern English ("you", never "thee" in the site's own words), British spelling in prose as in the siblings. Added for this feature:

- **Children's words:** mostly words of one or two syllables, short lines, a steady rhythm; rhyme where it comes naturally and never at the cost of truth (a rhyme that says more than its verse is rewritten). A child's prayer (a written item marked `forChildren`) is **12 to 50 words**, so it can be learned by heart; the 25-word floor for the site's other written words does not apply, because a two-line rhyme or a call-and-response grace is rightly shorter. Read aloud before it is accepted. Words a parent says over a child (the "blessing your children" page) are ordinary written items, 25–120 words.
- **Rhyme is not Scripture.** A rhyme never puts a verse into rhyme and calls it the verse. The verses are shown beneath, as they are.
- **`[name]`** in a blessing a parent says or a housewarming card: never at the start of a sentence (the translation check cannot pick up bracket-initial text, as the sympathy build found); never inserted into Scripture or an older text. Where a family wants a name with Numbers 6, the print puts it as a heading above the verse ("For Lily"), not inside the verse.
- **Graces thank God, not the food**, and do not imply plenty is a reward for faith.
- **No word that frightens a child** in the site's own writing (death, devils, punishment). Older texts that contain such words carry the note of 4.3.
- **Household words** never assume two parents, children, a house rather than a flat, or a family of believers (2.4 rule 5).

### 4.7 Who writes it, and when

All site words are written by hand in step 19 directly into the data files, as the prayers, life-event and sympathy builds did. If the writing does not fit one sitting, the step finishes the house and table pages and the bedtime page to full quality, says so, and finishes the rest in a follow-up rather than rushing children's words. Every older text is checked against its named scan in that step, and the check (URL, page, date) is stored with the text.

## 5. Pages

### 5.1 Addresses and routing

One route, `<Route path="/blessings/*">`, as the siblings do: the hub at `/blessings`, a page at `/blessings/<slug>`. "Blessings" is the word people search and reads naturally ("bibleguide.io/blessings/bedtime"). The code folders use the feature slug: `src/pages/home-blessings/`, `src/data/home-blessings/`.

Each item has an anchor (`#come-lord-jesus`, `#house-blessing-guiterman`, `#front-door`, verses by `passageKey`), and a shared link opens at the item using the feature-local hash effect the prayers feature copied from sympathy ([scroll.ts](../../../src/pages/sympathy/scroll.ts)). An unknown page shows [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx). The tab title comes from a small `useBlessingHead(title)` hook on the pattern of `usePrayerHead`, putting back `DEFAULT_TITLE` when the page is left.

### 5.2 A page, top to bottom

1. **`h1`** and, through `useBlessingHead`, the tab title (search title plus " · Bible Guide").
2. **Introduction** (the search description).
3. **The featured item** in a quiet panel: its kind label, the words, glosses, and the buttons **Copy** and **Print…** (6.1). Under a written item, "Rooted in Scripture" with each verse in full, linked to the reader (`readHref`), and any context note.
4. **The other items**, each with the same parts. On the table and bedtime pages, older texts carry their author and year in small type under the words ("Mary Lundie Duncan, 1839").
5. **"Print a set"** (on the table and children's pages): choose several items and print them together as cards (6.1), so a family can make a "grace jar" or a week of bedtime cards in one go.
6. **"Explore more"**: sibling pages, the neighbours of 2.7, two or three topics (5.4).
7. **Source lines:** "Scripture quotations are from the Berean Standard Bible (public domain)." and, where older texts appear, "Older graces and blessings on this page are in the public domain; each names its author and first printing."

### 5.3 The hub (`/blessings`)

1. `h1` **"Blessings for the Home"**, and an introduction: "Words to bless your home, give thanks at the table and pray with your children at bedtime: blessings from Scripture, graces families have said for centuries, and short new ones, every one ready to print."
2. **Four groups of link cards** (For the house · At the table · For children · From Scripture), each card showing its label and the first line of its featured item (from the data, so no Bible books load to draw the menu).
3. **The children's band**: the "For children" group is drawn as its own band with a little more warmth (the bedtime ornament, larger first lines) and one line for parents: "Graces and bedtime prayers to say with your children, a card they can fill in, and colouring pages." It also links the children's Bible questions (`/study/questions/children`) in one line.
4. **"Looking for something else?"**: one line each to prayers for occasions (`/prayers`, naming "a prayer for moving day"), the life-event packs and "what the Bible says when you're…".
5. The source line.

### 5.4 Topics linked

| Pages | Topics |
|---|---|
| house-blessing, room-by-room | `house`, `hospitality`, `blessing` |
| before-meals, graces-for-kids | `thanksgiving`, `food`, `bread` |
| holiday-meals | `thankfulness`, `praise`, `hospitality` |
| bedtime | `sleep`, `night`, `protection` |
| blessing-your-children | `children`, `parents`, `instruction-of-children` |
| scripture-blessings | `benedictions`, `blessing`, `peace` |

### 5.5 Links to and from other features

**From this feature (own files only):** house-blessing → `/prayers/new-home`; scripture-blessings → `/prayers/closing-a-meeting`; blessing-your-children → `/life-events/new-baby`, `/life-events/baby-dedication`, `/study/the-good-news`; holiday-meals ("a table with an empty chair") → `/sympathy`, `/when-youre/grieving`; bedtime → `/when-youre/afraid`; the Watts evening song → its hymn page under `/study/hymns/` (the implementer confirms the id in the hymn index; if the hymn has no page, no link).

**Into this feature (narrow edits that both designs planned; re-read each file just before editing; its tests must still pass):**
- Prayers for occasions: one `elsewhere` entry on `new-home` → `{ href: "/blessings/house-blessing", title: "A house blessing to read and print" }` in [home.ts](../../../src/data/occasion-prayers/home.ts). That feature's link test accepts only addresses in a fixed set (`whenYourePaths()`, `lifeEventPaths()`, `sympathyPaths()` and `/study/the-good-news`, line 241 of [occasion-prayers-data.test.ts](../../../src/data/occasion-prayers/occasion-prayers-data.test.ts) on 2026-11-10), so the same change adds `...homeBlessingPaths()` to that set: two lines in the prayers feature's files, nothing else.

### 5.6 Entry points

- **Tools hub** (the main nav entry): the existing entry `slug: "home-blessings"` in [registry.ts](../../../src/pages/tools/registry.ts) changes to `status: "live", path: "/blessings"` once the route works, and nothing else. No header tab. The tools test refuses a live tool without a route, so the route comes first.
- **Home page:** one new line in the Resources block of [HomePage.tsx](../../../src/pages/HomePage.tsx), after "Short prayers for life's occasions" (line 283 on 2026-11-10): "Blessings, graces and bedtime prayers for the home". A new line, not a reworded one (the translation reason the life-event design gives). The file has carried other jobs' uncommitted work; re-read it just before the edit and commit only this line.
- **Route:** lazy import and `<Route path="/blessings/*">` in [App.tsx](../../../src/App.tsx). **Hub title:** one `ROUTE_TITLES` entry in [page-head.ts](../../../src/lib/page-head.ts). **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), fed by `homeBlessingPaths()` (the hub and the eight pages).

### 5.7 Being found

Headings, search titles and first sentences answer 3.2's searches; old first lines are page text, so "Come, Lord Jesus, be our guest" finds the table page. Every word is ordinary page text in the crawler copies. After the owner releases the feature: `bun run seo:capture --only /blessings`, commit the captures, then `bun run seo:indexnow` ([SEO.md](../../../../SEO.md)). This feature never deploys. No FAQ markup, no keyword lists, no "50 powerful bedtime prayers" padding.

## 6. Print layouts

### 6.1 The five layouts

All use the shared module: `PrintPortal` draws one sheet outside the app; `usePrintSheet(paper, margin)` writes the `@page` rule and opens the browser's print dialog; `defaultPaper()` picks Letter or A4 from the browser's language, with a visible **Letter / A4** switch; `useFontsReady` waits for Literata and the sans face so the printout never falls back; the Print button is hidden where `canPrint()` is false (in-app browsers), with the line "Open this page in your browser to print". Sheets use **fixed light colours and strokes only**: no backgrounds, no dark mode on paper, nothing that needs a colour printer.

| Layout | Paper | Finished size and how it is used | Fits | Offered on |
|---|---|---|---|---|
| **Wall print** | Letter or A4, portrait, one page | Letter: everything inside a centred 8 × 10 in area, so the sheet trimmed to 8 × 10 fits a standard frame; A4: fits an A4 frame as it is (the life-event display-print geometry). A large heading, the words, a line-art ornament, the reference or author, and a small footer "bibleguide.io/blessings/…". Optional **family line** under the words ("The Okafor home · 2026", 40 characters). Words at 19 pt Literata, the life-event display print's middle size | any item up to **90 words / 520 characters / 14 printed lines at 44 characters** (Guiterman's poem, 12 lines; Numbers 6; the front-door blessing; Duncan's two verses; the Lord's Prayer) | house-blessing, scripture-blessings, bedtime, blessing-your-children |
| **Cards, four to a sheet** | Letter or A4, portrait | Four cards of 4.25 × 5.5 in (Letter) or 105 × 148 mm (A6, on A4) with faint cut guides (switchable). One item per card; "Print a set" fills sheets with the chosen items in order, so eight graces make two sheets for a **grace jar** or a week of bedtime cards. Small footer per card. Words at 14 pt (the life-event folded card's size); a card whose item fits **8 printed lines at 26 characters** (the short rhymes and graces: the children's grace of 4.5 comes to 7, Wesley to 5, the Selkirk Grace to 8) goes up to 18 pt | items up to **60 words / 360 characters / 12 printed lines at 34 characters** (Duncan's two verses come to 11) | before-meals, graces-for-kids, holiday-meals, bedtime, scripture-blessings, blessing-your-children |
| **Table card** (folded tent) | Letter or A4, **landscape**, one page | Folded once along the long middle line into a tent that stands on the table, each face about 11 × 4.25 in (297 × 105 mm on A4). The same grace is printed on both halves, the top half turned 180°, so it reads upright from both sides of the table. A dashed fold guide (switchable). Words at 18 pt | items up to **45 words / 280 characters / 6 printed lines at 60 characters** | before-meals, graces-for-kids, holiday-meals |
| **Colouring page** (children) | Letter or A4, portrait, one page | The words in large type (**at least 24 pt**) inside a wide border of simple line art to colour: stars and moon (bedtime), wheat and loaves (graces), a house and a garden (home). Outline shapes only, no people, no faces, no pictures of God (2.4; also avoids art that misrepresents Scripture). Optional child's name as a heading ("Lily's bedtime prayer", `translate="no"`) | items up to **50 words / 14 printed lines at 32 characters** (Duncan's two verses come to 13, Watts's to 11) | graces-for-kids, bedtime, blessing-your-children |
| **Room-by-room order** | Letter or A4, portrait, **flows over as many pages as needed** | The order of 4.4 for the rooms the family ticked, with "Leader" and "All" marks, each station kept together (`break-inside: avoid`), ordinary page margins, page numbers. No promise to fit one page | — | room-by-room |

**Text limits are enforced in data, not discovered on paper.** Each item's data lists the layouts it allows, and a test (9.3) checks every item against the limits above, so a long text never reaches a fixed-size sheet. Words alone are not enough: verse keeps its line breaks, so a 51-word poem of long lines can need more room than 60 words of prose. Each limit therefore also counts **printed lines**: every stored line (a prose text is one line) is wrapped at whole words to the layout's characters-per-line figure, and a stanza break counts as a line. The figures assume Literata at about 0.52 em a character on the layout's text width, slightly generous on purpose; the PDF check of 6.4 confirms them. This is the lesson of the countdowns build, which stopped at an unverified "fits exactly one page" promise: here only short, capped texts go on fixed sheets, and the one variable-length document flows.

### 6.2 Personalising a print

| Field | Layouts | Limit | Rules |
|---|---|---|---|
| Family line | wall print (house pages) | 40 characters | "The Smith home", "The Garcias · 2026" |
| Name heading | wall print, cards, colouring page (children's and blessing pages) | 30 characters | Drawn as a heading above the words ("For Lily"), never inserted into Scripture or an older text |
| `[name]` in a written blessing | any layout of a `forSomeone` item | 40 characters | Replaces the token; left empty, the print shows a blank line to write on |

Everything typed stays in the page's memory only: never saved, never in the address, never sent. It is drawn with `translate="no"` and `dir="auto"`, so "Grace" or "Joy" is not translated and right-to-left names print correctly. React escapes it, so markup prints as text. Long names shrink one step before wrapping.

### 6.3 The "My own prayer" card

On the bedtime page, a card for children aged about 6–11 to fill in by hand, printed four to a sheet or as a colouring page: four short prompts with writing lines, "Thank you, God, for…", "Please help…", "I'm sorry for…", "Goodnight, God. Amen." Rooted beneath (on the screen, and in small type on the card's back edge) in Philippians 4:6 (requests with thanksgiving) and 1 John 1:9 (confession). It teaches children to pray in their own words, which is the Baptist instinct (the prayers design's 2.3), and needs no rights at all. In the data it is its own item kind, `fill-in` (9.1), so the word and line limits for printed texts do not apply to it; its sheets are tested on their own (9.3).

### 6.4 Checking the prints

The implement step prints every layout to PDF from the browser's print dialog on the always-on preview at http://127.0.0.1:8931 (never a new dev server, per the project's notes), on Letter and A4, with the allowed item that has the most printed lines in each fixed layout (Duncan's two verses on cards and the colouring page, Guiterman's poem on the wall print) and one 18 pt card; saves the PDFs or screenshots of them; and checks: one page for each fixed layout, cut guides on the 4.25 × 5.5 in / A6 lines, the table card's top half upside down, the colouring border clear of the words, and nothing in colour. If a check cannot be done, the step says so plainly rather than calling the layout finished.

## 7. The children's section

### 7.1 Who it is for

| Age | How they use it | What the page gives them |
|---|---|---|
| About 2–5 (read to them) | A parent says the words; the child joins in the "Amen" or a repeated line | Short rhymes first; the call-and-response grace ("**Parent:** For food and friends, **All:** Thank you, God"); the colouring page |
| About 6–8 (early readers) | Reads a card at the table or bedside | Large type (short rhymes on cards at 18 pt, longer cards at 14 pt, the colouring page at 24 pt or more; 6.1), short lines, rhymes, the older children's prayers of Duncan, Wesley and Leatham |
| About 9–11 | Prays in their own words; may lead grace | The "My own prayer" card; "take a turn to lead grace" with the graces-jar set; Scripture blessings to say over a younger sibling |

### 7.2 How the children's pages differ

- **Children's styling** (3.2 column): a little more space, larger type for the words, the first item a rhyme, gentle line-art ornaments (star, moon, sprig), and no long notes before the words. Notes for parents sit under the items in a quiet "For parents" line.
- **Every prayer a child says is a short card.** Children's written prayers and the older children's prayers are at most 50 words, and each fits a card and a colouring page by the printed-line limits of 6.1. Scripture on a children's page can be longer (the Lord's Prayer is 62 words); such an item is offered on screen and as a wall print only.
- **Nothing collected from children.** No accounts, no names stored, no "send us your child's prayer". The name field is the parent's, and it never leaves the page (6.2).
- **No pictures of Jesus or of God** in the line art; stars, moons, loaves, houses and plants only.
- **Truthful and gentle together.** Children's words say true things about God simply; frightening older lines are labelled and optional (4.3).

### 7.3 Links for parents

The bedtime page has one line for a frightened child's parent ("When your child is afraid": `/when-youre/afraid`). The blessing page links *The Good News* in one sentence for a parent who wants to explain the gospel to a child. The hub's children's band links the children's Bible questions. Nothing else is linked from children's pages, so there is no path from a bedtime card to heavy material.

## 8. Copying and sharing

### 8.1 Copy

Every item has **Copy**: the words, then a source line. Written item: `— A house blessing, bibleguide.io/blessings/house-blessing`. Older text: `— John Cennick, 1741`, then the page address. Scripture: `— Numbers 6:24–26 (BSB)`, then the page address. The address is built from `SITE_ORIGIN` with the item's anchor and no tracking parameters. A blocked clipboard shows the text selected with "Press and hold to copy" (the prayers feature's `useCopy` pattern).

**Send** (text message, email, share sheet) is offered only on the two items made to give someone: *A blessing for someone's new home* and the Scripture blessings. It reuses the shape of the prayers feature's message builder (opening line choice, name field, numberless `sms:`, `mailto:` with subject "A blessing for your home" / "A blessing for you"), copied into this feature's `message.ts` rather than imported, because that builder knows about prayer occasions. Home blessings are mostly printed, so the rest of the feature does not repeat sending.

### 8.2 The verse-card generator, once it exists

The generator ([verse-cards/design.md](../verse-cards/design.md); its code and how-to in [src/lib/verse-card/README.md](../../../src/lib/verse-card/README.md)) always draws the footer "Berean Standard Bible · bibleguide.io". So only Scripture items can become pictures; graces, older texts and written blessings cannot, because a picture would label them as Bible text. The interface below was read from the generator's code at review (2026-11-10), while its build was still running:

- this feature adds one pure adapter, `toCardSpec(item, page)`, in its own folder, returning a `CardSpec`: `{ passage: { text, reference, book }, heading, link, look: HOME_LOOK }`. `text` and `reference` are the tidied passage and its reference as the page shows them; `book` is the book number (1–66); `heading` is written by the feature and at most 40 characters ("A blessing for your home", "A blessing for you"); `link` is `SITE_ORIGIN + "/blessings/" + slug + "#" + key`, which the generator requires to be on `SITE_ORIGIN`;
- `HOME_LOOK` is a plain `Look` object: `{ id: "home-blessings", name: "Home", background: <warm cream>, text: <deep brown>, accent: <muted brown>, ornament: "sprig" }`. Its `id` must not be one of the six built-in ids (`paper`, `night`, `dawn`, `olive`, `book`, `bold`), which the generator refuses, and this feature's own test checks `lookProblems(HOME_LOOK)` returns `[]` (4.5:1 contrast);
- Scripture items gain **"Make a picture"**, opening `<CardSharePanel spec={toCardSpec(item, page)} looks={[HOME_LOOK, "paper"]} />` next to Copy. A typed name for Numbers 6 ("For Lily") may go in `spec.lines`, which the generator draws on the picture only and never puts in a link or the share text;
- **no link-preview pictures at launch.** The generator's preview pictures are drawn by its release script for its own curated verses; adding these pages would mean editing chain C's script, which this feature must not do. A later, separate change can add them.

Step 19 uses the generator **only if it is committed** to the site's main branch when the step starts (at review it was in the folder but uncommitted, its own build unfinished), and re-reads `CardSpec`, `Look` and `CardSharePanel`'s props before writing the adapter, adjusting to any change without editing chain C's files. If it is not committed, nothing is half-built: no "Make a picture" button is shown, and printing and copying carry the feature.

### 8.3 Privacy

The feature stores nothing and sends nothing: no accounts, no saved favourites, no forms, no counters, no analytics beyond what the site already does on any page. Typed names and family lines live only in the page's memory and on the printed sheet.

## 9. Building it (step 19)

### 9.1 Data

Under `src/data/home-blessings/`, importing nothing through the `@/` alias (so build scripts can read it, as the sibling data does). Imports `sp()` and `SympathyPassage` from [sympathy/types.ts](../../../src/data/sympathy/types.ts), and the shared roots (`priestlyBlessing`, `GUARD_NOTE`, `T`) from the prayers data's [shared.ts](../../../src/data/occasion-prayers/shared.ts). A reference can only cut the end of its last verse (`"JOS 24:15b"` with its exact words); it cannot start partway into a verse, which is why the Lord's Prayer keeps its opening words (3.3).

```ts
import type { SympathyPassage } from "../sympathy/types";

export type BlessingGroup = "house" | "table" | "children" | "scripture";
export type PrintLayout = "wall" | "cards" | "table-card" | "colouring" | "order";

export interface OlderText {
  id: "guiterman-house" | "come-lord-jesus" | "cennick-table" | "cennick-blood" | "god-is-great" | "leatham-world"
    | "selkirk" | "doxology" | "ken-evening" | "duncan-shepherd" | "wesley-gentle" | "watts-evening" | "now-i-lay-me";
  title: string;                 // "Jesus, tender Shepherd"
  lines: string[];               // exactly as printed; "" marks a stanza break
  author: string;                // "Mary Lundie Duncan"
  year: string;                  // "1839" or "printed by 1698"
  source: string;                // first printing, in words
  checkedAgainst: string;        // URL, page and date of the word-for-word check
  glosses?: { word: string; meaning: string }[];
  note?: string;                 // e.g. the death-line note, the angels note
  extraLines?: { label: string; lines: string[] }; // Duncan's third verse, shown on the page only
}

export type BlessingItem =
  | { kind: "written"; id: string; label: string; text: string; forSomeone?: true; forChildren?: true;
      rootedIn: SympathyPassage[]; layouts: PrintLayout[] }
  | { kind: "older"; id: string; text: OlderText["id"]; layouts: PrintLayout[] }
  | { kind: "scripture"; id: string; passage: SympathyPassage; setting?: string; layouts: PrintLayout[] }
  | { kind: "fill-in"; id: "my-own-prayer"; label: string; prompts: string[]; // the "My own prayer" card (6.3)
      rootedIn: SympathyPassage[]; layouts: ("cards" | "colouring")[] };

export interface Station { id: string; heading: string; place: string; reading: SympathyPassage; prayer: string;
  rootedIn: SympathyPassage[]; aside?: SympathyPassage }

export interface BlessingPage {
  slug: string; group: BlessingGroup; label: string; heading: string; searchTitle: string;
  intro: string; forChildren?: true;
  items: BlessingItem[];          // the first is featured
  stations?: Station[];           // room-by-room only
  howTo?: string;                 // room-by-room and blessing-your-children
  topics: { slug: string; title: string }[];
  related: string[];              // sibling slugs
  elsewhere?: { href: string; title: string }[];
}
```

Files: `types.ts`, `index.ts` (pages in hub order, `pageBySlug`, `homeBlessingPaths()`, `BLESSINGS_PATH = "/blessings"`, group titles, `LAYOUT_LIMITS` with words, characters, printed lines and characters per line for each layout, and the 18 pt card threshold), `older.ts` (the texts of 4.3 with their sources and checks; the checksums sit in the test file, 4.3), and one content file per group: `house.ts`, `table.ts`, `children.ts`, `scripture.ts`. Each under the 500-line target. Verse text is never stored; it loads from the Berean files at view time.

### 9.2 Files

New, in `src/pages/home-blessings/`: `BlessingsPage.tsx` (the route), `Hub.tsx`, `BlessingPage.tsx`, `ItemPanel.tsx` (one item of any kind, with its roots, glosses and buttons), `RoomByRoom.tsx`, `PrintChooser.tsx` (layout, paper, personal fields, "print a set"), `sheets/` (`WallPrint.tsx`, `CardsSheet.tsx`, `TableCard.tsx`, `ColouringPage.tsx`, `OrderSheet.tsx`, `borders.tsx` with the line-art borders, `home-blessings-sheet.css`), `message.ts` (copy text and the two send messages), `useBlessingVerses.ts`, `useBlessingHead.ts`, `anchors.ts`, `home-blessings.css`, `README.md`, and tests. Reused without change: `print-sheet.ts`, `PrintPortal`, `Ornament`, `p()`/`sp()`, `passageKey`, the shared roots, `SITE_ORIGIN`. Narrow integration edits: [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [registry.ts](../../../src/pages/tools/registry.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), the one `elsewhere` entry in [home.ts](../../../src/data/occasion-prayers/home.ts) with the one-line widening of the route set in [occasion-prayers-data.test.ts](../../../src/data/occasion-prayers/occasion-prayers-data.test.ts) (5.5), and one line in [SOURCES.md](../../../SOURCES.md) and [NOTICE.md](../../../NOTICE.md) if the site's source-register rule requires it: each older text with author, first printing, the scan checked and "public domain" (the project rule that every source a feature uses is registered).

**The build's English check.** `npm run build` stops when page code gains English that is not registered for translation. Run it early, register the new text as the prayers and "when you're…" builds did, and never widen its baseline.

### 9.3 Tests (run with the site's `test` and `build`)

- **Passages** (reading the real Berean files): every reference and excerpt exists and is exact; every Scripture item and root is 320 characters or fewer after tidying; no root is on the never-used list (the same eight verses as the prayers test, 4.2); Numbers 6:24–26 is the featured item on scripture-blessings; Psalm 121, Deuteronomy 28:6, Isaiah 32:18 and Zephaniah 3:17 carry their notes wherever used.
- **Words:** eight pages, slugs unique and URL-safe, headings unique, search titles ≤ 50 characters, intros 40–90 words; written items 25–120 words, except `forChildren` written items at 12–50; older texts on children's pages ≤ 50 words; `[name]` only in `forSomeone` items and never sentence-initial; prayers addressed to God end "amen."; the prayers feature's whole-word tone scan over the site's own words (not Scripture, not older texts), plus "devil", "die", "death" and "punish" in children's written items; no "!" in the site's words; no saint, Mary or angel addressed.
- **Older texts:** each matches its checksum (held in the test file); each has author, year, source and a `checkedAgainst` naming a URL, the printing's year (before 1931) and the check date, so "Come, Lord Jesus" and "God is great, God is good" cannot ship without their dated printing (2.5); the death-line note is shown wherever "now-i-lay-me" or Duncan's third verse appears; no 1662 Prayer Book text appears anywhere in the feature.
- **Print limits:** every item allows only layouts its length fits (`LAYOUT_LIMITS`: wall 90 words / 520 characters / 14 lines at 44; cards 60 / 360 / 12 lines at 34; table card 45 / 280 / 6 lines at 60; colouring 50 words / 14 lines at 32), with printed lines counted as 6.1 says (a fixture checks the counter: Duncan's two verses are 11 lines at 34 and 13 at 32); the 18 pt card size is chosen exactly when an item fits 8 lines at 26; the room-by-room order is the only `order` layout; `fill-in` items allow only cards and colouring.
- **Links:** every topic slug exists with references and its title matches; every `related` slug is a page; every `elsewhere` address is a real route; `homeBlessingPaths()` holds the hub and the eight pages and nothing else; the tools entry is live at `/blessings`; the prayers `new-home` page shows its new link and that feature's tests still pass.
- **Pages** (Testing Library): the hub shows four groups and eight cards with the children's band; each page shows heading, intro as the first qualifying paragraph, every item with its kind label, every root reference and note, glosses and source lines; Scripture and older text carry `lang="en"`; an unknown slug renders the not-found page; the tab title is set and reset; Print is hidden when `canPrint()` is false.
- **Sheets:** each layout draws only the chosen items, the right paper size in its `@page` rule, the family line and name heading under `translate="no"`, a blank line where `[name]` was left empty; the table card draws the item twice, one copy turned; "print a set" of nine cards makes three sheets.
- **Copy and send:** copy text ends with the right source line and a `SITE_ORIGIN` address with the item's anchor whatever address the test page is at; a typed name never appears in `location`, storage or a request.
- **Pictures** (only if the generator is committed, 8.2): `toCardSpec` gives no `cardProblems` for every Scripture item, its heading is ≤ 40 characters and its link is on `SITE_ORIGIN`; `lookProblems(HOME_LOOK)` is `[]`; written and older items have no "Make a picture" button.

### 9.4 Order of work

1. Data types, older texts (each checked against its scan, checksums; the search for dated printings of "Come, Lord Jesus" and "God is great, God is good" first, so the pages are planned with or without them), and the passage tests.
2. The house and table pages' words; then children's and Scripture pages.
3. Pages and hub; copy; the hash scroll; the route, title, sitemap and registry entry.
4. Sheets and the print chooser; then the PDF checks of 6.4 on 127.0.0.1:8931, Letter and A4, light and dark mode on screen.
5. The inbound link from prayers, the home-page line, the source register.
6. The site's tests and build; screenshots of the hub and two pages at 390 × 844 and 1440 × 900.

## 10. Edge cases

| Case | What happens |
|---|---|
| A family in a flat, a dorm room or a rented room | The house page says "any home: a house, a flat, a single room". Room-by-room lets them tick only the rooms they have |
| A household that is not all believers | Blessings ask God and give the home to him without speaking for each person; nothing requires everyone to say the words. Graces work as one person praying aloud for the table |
| Guests at the table who do not pray | The "guests at our table" grace is short and warm; the page suggests a host simply says, "We usually give thanks before we eat" |
| A grieving family's first holiday | "A table with an empty chair" grace names the loss gently, prays for comfort (Psalm 34:18) and links sympathy quietly; it never says where the loved one is |
| A family short of food | No grace implies plenty is a reward. The Selkirk Grace remembers the hungry; the everyday grace thanks God for "what we have" |
| A child frightened by "If I should die before I wake" | The note of 4.3; gentler older prayers above it; the text is never altered and never put on a child's print unless chosen |
| A child afraid of the dark | Psalm 56:3, the "child who is afraid" blessing, and the link for parents to `/when-youre/afraid` |
| A child's name such as Grace, Joy or Hope, or a name in another script | `translate="no"`, `dir="auto"`, 30–40 characters, shrinks before wrapping |
| No name typed on a `[name]` blessing | The print shows a blank line to write the name by hand |
| Printing from a phone | The print dialog's "Save as PDF" or a nearby printer; in-app browsers (no print dialog) see "Open this page in your browser to print" instead of the button |
| A black-and-white printer | Every sheet is strokes and text on white; nothing depends on colour |
| A browser that ignores `@page size` | The sheet is still one page and centred (the life-event sheet rule); the PDF check of 6.4 confirms on Letter and A4 |
| Someone wants the old wording they grew up with ("Beneath thine own almighty wings", "These mercies bless") | The page names the edition checked and, where the familiar later wording differs, says so in the gloss line. The stored text stays the checked one |
| Someone believes "God is great, God is good" is copyrighted | It ships only with a dated printing from before 1931 (2.5), named on the page; if a rights holder ever appears anyway, the item is removed in one data edit |
| No pre-1931 printing is found for "Come, Lord Jesus" or "God is great, God is good" | The item is left out of the data, the step's report says so, and the pages still work with the remaining items; it can be added later in one data entry once a printing is found |
| A text is accidentally "modernised" in the data | Its checksum test fails |
| A future editor adds a Book of Common Prayer text | The test refusing 1662 text in this feature fails, with a message pointing to the prayers feature's 500-word allowance |
| The site is shown in another language | Site-written words translate like any page text, and children's rhymes lose their rhyme in translation (accepted; the meaning stays). Scripture and older texts keep `lang="en"` |
| A church prints dozens of house blessings for a housewarming or new-members gift | Fine: every text is public domain or the site's own; the footer's address is the only credit asked |
| Reduced motion | The arrival highlight on a linked item is skipped |
| The verse-card generator is not yet committed when step 19 starts | Copy and print carry the feature; no "make a picture" button is shown (8.2) |

## 11. Out of scope for this build

Audio of the graces or sung Doxology; an Advent or Lent table grace series (could join countdowns later); morning prayers as their own page; grandparents' blessings as their own page; Luther's evening prayer (needs a public-domain translation checked); prayer requests, accounts or saved favourites; translated texts of the older graces; a printed booklet format; pictures of graces as images (the generator draws Scripture only, 8.2); selling prints. Each later page can be added as one data entry, and the tests then cover it.

## 12. Questions for the review (step 18)

No owner decision card is needed: every choice has an obvious recommendation and costs nothing.

1. **Older texts:** confirm the rights reasoning of 2.5 for each, especially the two with no dated first printing ("God is great, God is good" and the English "Come, Lord Jesus"), and that no Book of Common Prayer text is used.
2. **The death-line note** (4.3): check it is honest, gentle and does not alter the old text.
3. **The three samples** (4.5): check each line against its verses as the prayers review did; they set the standard for about 30 more.
4. **The print limits** (6.1): confirm they are tight enough for one page in each fixed layout, and that the table card's turned top half is right for a tent folded along its long middle line.
5. **Watts in the site's hymn data** (2.5): the "head"/"bed" slip in [divine.json](../../../data/hymns/texts/divine.json) is reported, not fixed here. The review may want to record it for whoever owns the hymns.
6. **Address and naming:** `/blessings` for the route, `home-blessings` for the folders, following the brief and the sibling pattern.

## 13. Review (step 18)

**Reviewed once** in job ca80721e (sequence 33 step 18), 2026-11-10, against the approved spec (entry 11 of [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md)), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), the doctrinal foundation and the real code. Every correction below is already made in the body above; this section records what changed and why.

### What was checked and found right

- **The code the design reuses exists as described:** the `home-blessings` entry in the tools registry (status "coming soon"); the prayers feature's shared roots (`priestlyBlessing`, `guarded`, `GUARD_NOTE`, `T`); the passage helpers and their card limits (240 / 320 / 700 characters); the print module (`PrintPortal`, `usePrintSheet`, `defaultPaper`, `canPrint`, `useFontsReady`, `PAPER_SIZE`, and a header that already names home blessings); `sp()`, the sympathy hash scroll, `useCopy`, `usePrayerHead`, `usePrayerVerses`; the routes it links to (`/prayers/new-home`, `/prayers/closing-a-meeting`, `/when-youre/afraid`, `/when-youre/grieving`, `/life-events/new-baby`, `/life-events/baby-dedication`, `/study/the-good-news`, `/study/questions/children`, `/study/hymns/:id`); the prayers test's never-used verse list and its route set (line 241); the home page's prayers line (283).
- **All twenty topics** exist with the reference counts the design gives, and the six it rules out really have no references.
- **Every verse** was read in the Berean files: the lengths given are right (Luke 10:5 is 65 characters, Matthew 6:9–13 316, Hebrews 13:20–21 317, Psalm 134:3 65), and the quotations in 2.3 match the Berean wording.
- **The Watts slip is real:** the site's hymn data has "head" at the end of both rhyming lines of Song 26, stanza 3, where Watts's rhyme is head / bed. Left for the hymns owner, as the design says (question 5).
- **Search titles** are all at most 50 characters. The table card's turned top half is right for a tent folded along its long middle line (question 4). The death-line note is honest and leaves the old text alone (question 2), with one wording fix below. `/blessings` and `home-blessings` follow the sibling pattern (question 6). No Book of Common Prayer text is used (question 1).

### What changed, and why

1. **Two older texts now need a dated printing, like the other eleven** (2.5, 4.3, 9.3, 9.4, 10). "God is great, God is good" and the English "Come, Lord Jesus" had no dated source; the draft used them anyway, against its own rule that every older text is checked against an early printing. A web search at review found none. The common Lutheran wording also says "*Thy* gifts", not "these gifts". Now each ships only once step 19 finds a printing from before 1931 and stores that printing's wording; otherwise it is left out and reported. Why: the site's rule is public domain *shown*, not assumed, and an unsourced text cannot be registered with its first printing.
2. **The front-door blessing no longer vows for the whole household** (2.4, 4.4 station 9, 4.5). "As for us and our house, we will serve you" put Joshua's vow in the mouth of every person in the home, which the design's own rules forbid (a household that is not all believers, 2.4 rule 5, 4.6, 10). It now asks: "Make this a home that serves you" (77 words). The room-by-room closing station changed the same way. Joshua 24:15 is still shown as Scripture, as his own words.
3. **The children's bedtime prayer no longer calls every day good** (2.4, 3.3, 4.5). "Thank you, God, for this good day" said more than its verse; 1 Thessalonians 5:18 says to give thanks *in every circumstance*. It is now "Thank you, God, for all today; / forgive the wrong I've done, I pray", which also drops the day / today rhyme.
4. **Two promises to Israel gained context notes** (4.2, 4.5, 9.3). Isaiah 32:18 ("safe and secure places of rest") and Zephaniah 3:17 ("He will quiet you with His love") are spoken to God's people in a particular setting and were used with no note, though Psalm 121 and Deuteronomy 28:6 had one. Both now carry a short note, and the tests check it.
5. **Print limits now count printed lines, not just words, and the type sizes were fixed** (6.1, 6.4, 7.1, 7.2, 9.3). Verse keeps its line breaks, so words alone were no guide. Worked through: at the planned 18 pt, Duncan's two verses would need about 17 lines on a 4.25 × 5.5 in card and overflow it, and at 28 pt they would overflow the colouring page. Each fixed layout now has a characters-per-line figure and a maximum number of printed lines. Cards are 14 pt, with 18 pt only for items of 8 lines or fewer at 26 characters. The colouring page is at least 24 pt. The PDF check uses the item with the most printed lines. Why: the design's own lesson from the countdowns build (an unverified "fits one page" promise stalls a build) needed numbers a test can hold.
6. **The verse-card generator section was rewritten against the real code** (2.6, 8.2, 9.3, 10). The draft said it was not built. At review its build (sequence 32 step 16) was running and its code was in the site folder, uncommitted. 8.2 now uses the actual `CardSpec` fields (`passage.book`, a heading of at most 40 characters, a link on `SITE_ORIGIN`) and the `Look` shape, including the rule that a feature's look may not reuse a built-in id. It uses the generator only if it is committed when step 19 starts. The plan to add link-preview pictures was dropped from launch, because it would mean editing chain C's release script.
7. **The Lord's Prayer is handled honestly** (3.3, 4.2, 7.2, 9.1). The site's references can only cut the end of a passage, so Matthew 6:9–13 starts "So then, this is how you should pray:" and runs to 62 words. That broke the claim that every children's item is under 50 words. The opening is kept. The 50-word rule now covers prayers a child says, and longer Scripture on a children's page is offered on screen and as a wall print only.
8. **Children's written prayers are 12–50 words** (4.6, 9.3). The draft's tests set a 25-word floor for every written item, which would have refused the short rhymes and the call-and-response grace the children's pages plan.
9. **The "My own prayer" card has a data type** (6.3, 9.1, 9.3). It was planned but fitted none of the three item kinds. It is now a `fill-in` item, limited to cards and colouring pages.
10. **Checksums live in the test file** (4.3, 9.1), as the prayers feature does, so an edit to an old text cannot quietly update its own checksum in the same file.
11. **Smaller corrections:** the blessing-your-children page has 7 items plus a how-to paragraph, not 9 (3.3). The hub's search title is 48 characters, not 47 (3.2). The older texts total about 420 words, not 440 (2.5). The data imports `sp()` from the sympathy types, not the prayers data (9.1). The death-line note says "the line about dying" instead of "the third line", and "There is no need to change the old words" instead of "Please don't feel you must…" (4.3).

### Left as it was

- **No owner decision is needed.** Every change above has an obvious answer and costs nothing.
- The hymn-data slip stays reported, not fixed: it belongs to the hymns pages, and this chain touches only its own files.
- The search table (2.1) is still an editorial sample, not a measured keyword study, as the design says.
