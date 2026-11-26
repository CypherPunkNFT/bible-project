# Held sermons with no Bible text recorded: what is left, and why

**Made:** 2026-11-26 (orchestrator job 79c7008b). **Nothing was downloaded**: every finding below comes from files
already held in `sources/library` or from logs already in this folder's neighbours. Campaign brief:
[SERMONS-CAMPAIGN.md](../../../../../../Pages/Teachers/SERMONS-CAMPAIGN.md).

A sermon on the Teachers page counts as "on its Bible text" when its catalogue record or its passage overlay carries a
main text with verse ids. The rule is unchanged: a text is recorded only when the source prints it, with a locator, and
never inferred from a title. Everything else is listed here with the reason found.

## Before and after (sermons with no recorded text, from `src/data/teachers/people.json`)

| Preacher | Before | After | Placed now | Real gap in the source | Other reason |
|---|---|---|---|---|---|
| John Piper | 778 | 777 | 1 | 754 (held page has no Scripture field) | 23 have no held page (**since resolved, 2026-11-26 job 6ca48b16:** 6 placed, the other 17 pages carry no Scripture field, so 771 left, all textless at the source; [piper/REPORT.md](../piper/REPORT.md)) |
| Alistair Begg | 87 | 65 | 22 | 58 ("Selected Scriptures") | 7 survey sermons spanning several books, deliberately unplaced |
| D. L. Moody | 74 | 74 | 0 | 51 print no text; 19 quote a verse but print no reference; 2 give only a starting verse | 2 print a wrong reference |
| Charles Spurgeon | 22 | 22 | 0 | — | 21 are site files catalogued as sermons; 1 misprinted heading ("Romans 10:59") |
| D. Martyn Lloyd-Jones | 2 | 2 | 0 | — | both are whole eBooks of sermons (Monergism), not single sermons |
| John Wesley | 1 | 1 | 0 | — | printed "Isa. 2:21" is a misprint ([wesley run](../wesley/catalogue-run.json)) |
| George Whitefield | 1 | 1 | 0 | — | *Sermons on Important Subjects*, a whole volume |
| Heinrich Bullinger | 1 | 1 | 0 | — | *The Decades*, a whole volume |
| John Flavel | 1 | 1 | 0 | — | *The Fountain of Life Opened*, a whole volume |
| **Total** | **967** | **944** | **23** | | |

Added since the brief was measured, each listed by its own acquisition job: Alexander Maclaren 35
([run](../maclaren/catalogue-run.json)), G. Campbell Morgan 48 ([run](../morgan/catalogue-run.json)), Billy Graham 23
([run](../graham-transcripts/catalogue-run.json)).

## Where each list lives

- **Begg, Piper, Spurgeon:** each overlay in [passage-overlays/](../../../passage-overlays/) now has an `unplaced` list
  (every sermon still without a text, with the reason seen and where it was read) beside `unresolved` (a stated text we
  could not read). [sermon-passages.py](../../../../../scripts/sermon-passages.py) rewrites both on every run.
- **Moody, Wesley, Maclaren, Morgan, Graham:** `unplaced` in each preacher's `catalogue-run.json` in
  [sermons-campaign/](../).
- **Lloyd-Jones, Whitefield, Bullinger, Flavel:** the table above. Each record is a whole book of sermons, so it has no
  single text. Putting them on passages means first cataloguing each sermon inside the volume.

## What was found, preacher by preacher

**Begg (22 placed).** The 22 sermons listed as "not held" were held all along, in
`sources/library/source-truth-for-life/asset-ready-completion-begg-*`. Those folders hold only `original`, with no
provenance file, so the script never read them. It now finds each one's address by the file's sha256 in
[ready-text-completion/acquisition-manifest.json](../../ready-text-completion/acquisition-manifest.json); all 102 matched.
The 22 are a 2 Timothy series plus two 1 Timothy 6:11–16 sermons. They are not second copies of other sermons: no other
held page has the same Truth For Life ID. The other 80 files in that folder are copies of sermons already placed, and all
80 state the same text as the catalogue. Of what remains, the 58 pages each read **"Selected Scriptures"** where the
text goes: the publisher names no single passage. The 7 survey sermons (for example "Judges 1:1 – 2 Chronicles 36:23")
stay in `unresolved`. Placing one would light only its first chapter on the chapter chart.

**Piper (1 placed).** One page's real "Scripture:" link (Psalm 147:1) was missed because the page title itself contains
"Scripture:". The other 754 held messages have no Scripture field at all; every "Scripture:" on those pages is in the
title or the body. Nineteen open with an indented quotation. These are left unplaced because they are not reliably the
sermon's text: one is a prayer, one a hymn, one a letter, and some are epigraphs. A person could decide them one by one:

| Message | Reference at the end of the opening quotation |
|---|---|
| [Called to Be Lights in the World](https://www.desiringgod.org/messages/called-to-be-lights-in-the-world) | 1 Peter 2:9 |
| [Let the Nations Be Glad!](https://www.desiringgod.org/messages/let-the-nations-be-glad-session-2) | Psalm 63:1–3 |
| ["I Will Build My Church"](https://www.desiringgod.org/messages/i-will-build-my-church) | Matthew 16:13–18 |
| [Public Worship in a Secular World](https://www.desiringgod.org/messages/public-worship-in-a-secular-world-what-why-and-how-session-1) | Psalms 69:30–31 |
| [Exiles on the Earth](https://www.desiringgod.org/messages/exiles-on-the-earth) | 1 Peter 1:1–2 |
| [The Donkey, the Stallion, and the Strategy of the Hills](https://www.desiringgod.org/messages/the-donkey-the-stallion-and-the-strategy-of-the-hills) | Matthew 23:37–39 |
| [It Will Be Worth It](https://www.desiringgod.org/messages/it-will-be-worth-it) | Matthew 9:38 |
| [How Our Children Can Know the Bible Is True](https://www.desiringgod.org/messages/how-our-children-can-know-the-bible-is-true) | Acts 20:26–27 |
| [Sustained by Sovereign Grace—Forever](https://www.desiringgod.org/messages/sustained-by-sovereign-grace-forever--2) | 2 Corinthians 6:8–10 |
| [My Friendship with John MacArthur](https://www.desiringgod.org/messages/my-friendship-with-john-macarthur) | Psalm 19:7–11 |
| [The Pursuit of God in Corporate Worship](https://www.desiringgod.org/messages/the-pursuit-of-god-in-corporate-worship-session-1) | Isaiah 6:1–3 |
| [Is Jesus an Egomaniac?](https://www.desiringgod.org/messages/is-jesus-an-egomaniac--3) | Matthew 10:37–39 |
| [How a Dead Dog Loves a King](https://www.desiringgod.org/messages/how-a-dead-dog-loves-a-king) | none printed (a letter, a hymn) |
| [Why God Created the World](https://www.desiringgod.org/messages/why-god-created-the-world) | Isaiah 43:5–7 |
| [The Pleasures of God](https://www.desiringgod.org/messages/the-pleasures-of-god-session-3--2) | Isaiah 40:28–31 |
| [Suffering](https://www.desiringgod.org/messages/suffering) | Romans 8:18–23 |
| [Leadership and Scripture Memory](https://www.desiringgod.org/messages/leadership-and-scripture-memory) | Psalm 1:1–6 |
| [The Providence of God](https://www.desiringgod.org/messages/the-providence-of-god-session-1) | none printed (a letter, a hymn) |
| [The Theology of Romans](https://www.desiringgod.org/messages/the-theology-of-romans) | Romans 8:1–39 |

The 23 with no held page, from the October fetch log
([modern-texts/piper-results.json](../../modern-texts/piper-results.json)). Four of them logged a Scripture field. It
cannot be checked against a held page, so it is not recorded. Recording it would need the page saved, under Desiring
God's manual-only terms, which is a decision for later:

| Message | What the October fetch found | Scripture field it logged |
|---|---|---|
| [Five Points with Many Questions](https://www.desiringgod.org/messages/five-points-with-many-questions) | page had no written text (audio or video only), so it was not kept | — |
| [Together for Good?](https://www.desiringgod.org/messages/together-for-good) | page had no written text (audio or video only), so it was not kept | — |
| [What Stirs the Church to Sing?](https://www.desiringgod.org/messages/what-stirs-the-church-to-sing) | page had no written text (audio or video only), so it was not kept | Ephesians 1:1–6 |
| [Reset Your Mind on Jesus](https://www.desiringgod.org/messages/reset-your-mind-on-jesus) | page had no written text (audio or video only), so it was not kept | Colossians 3:1–4 |
| [Salvation Is More Than an Offer](https://www.desiringgod.org/messages/salvation-is-more-than-an-offer) | page had no written text (audio or video only), so it was not kept | — |
| [Q&A with Piper, Mason, Driscoll, Greear, and Stetzer](https://www.desiringgod.org/messages/q-and-a-with-piper-mason-driscoll-greear-and-stetzer) | held back for an authorship check | — |
| [Life Changing Things I've Learned about Missions](https://www.desiringgod.org/messages/life-changing-things-ive-learned-about-missions) | page had no written text (audio or video only), so it was not kept | — |
| [Where to Stand When All Is Shaking](https://www.desiringgod.org/messages/where-to-stand-when-all-is-shaking) | page had no written text (audio or video only), so it was not kept | Romans 8:32 |
| [God Chose You for God](https://www.desiringgod.org/messages/god-chose-you-for-god) | page had no written text (audio or video only), so it was not kept | — |
| [T4G 2008 Panel Discussion](https://www.desiringgod.org/messages/t4g-2008-panel-discussion) | held back for an authorship check | — |
| [Biblical Foundations for Seeking God's Justice in a Sinful World](https://www.desiringgod.org/messages/biblical-foundations-for-seeking-gods-justice-in-a-sinful-world) | held back for an authorship check | — |
| [God’s Call Overcomes Our Resistance](https://www.desiringgod.org/messages/gods-call-overcomes-our-resistance) | page had no written text (audio or video only), so it was not kept | — |
| [Gravity and Gladness](https://www.desiringgod.org/messages/gravity-and-gladness-q-and-a) | held back for an authorship check | — |
| [Jesus Christ and the Life of the Mind: Examining the Word and Works of God](https://www.desiringgod.org/messages/jesus-christ-and-the-life-of-the-mind-examining-the-word-and-works-of-god) | held back for an authorship check | — |
| [Doug Wilson Interviews John Piper and Tim Chester](https://www.desiringgod.org/messages/doug-wilson-interviews-john-piper-and-tim-chester) | held back for an authorship check | — |
| [The Greatness of God in the Doctrines of Grace](https://www.desiringgod.org/messages/the-greatness-of-god-in-the-doctrines-of-grace) | page had no written text (audio or video only), so it was not kept | — |
| [We Cannot Please God Without Grace](https://www.desiringgod.org/messages/we-cannot-please-god-without-grace) | page had no written text (audio or video only), so it was not kept | — |
| [Race and the Christian](https://www.desiringgod.org/messages/race-and-the-christian) | held back for an authorship check | — |
| [Surprise Presentation of the Book “For the Fame of God’s Name”](https://www.desiringgod.org/messages/surprise-presentation-of-the-book-for-the-fame-of-gods-name) | held back for an authorship check | — |
| [A Kingdom That Cannot Be Shaken](https://www.desiringgod.org/messages/a-kingdom-that-cannot-be-shaken) | fetch failed (connection reset) | — |
| [God Holds His People Fast](https://www.desiringgod.org/messages/god-holds-his-people-fast) | page had no written text (audio or video only), so it was not kept | — |
| [Prayer at Harvest Time: Now!](https://www.desiringgod.org/messages/prayer-at-harvest-time-now) | fetch failed (server error 500) | — |
| [Sing in the Fullness of the Spirit](https://www.desiringgod.org/messages/sing-in-the-fullness-of-the-spirit) | page had no written text (audio or video only), so it was not kept | Ephesians 5:15–20 |

**Moody (none placed).** Twelve of the 51 sermons listed as stating no text were opened at random in the held Project
Gutenberg books. All twelve begin straight into the address, with no text above it. The 19 with a quotation and no
reference include the Ten Commandments addresses. Two give a starting verse with no end: "John ix., beginning at the
fifth verse" and "the fifteenth chapter of Second Samuel, beginning at the nineteenth verse". Two print a wrong
reference: "Luke xvii. 10" for "Two men went up into the temple to pray", and "Matthew xvi. 1; John vi. 69". In the
second, John 6:69 is right, so that sermon could be placed on John 6:69 alone if the owner wants.

**Spurgeon (none placed).** Twenty-one "sermons" are catalogue records of Spurgeon Gems site files:

- 13 volume prefaces (`chsp1–13.pdf`)
- two *Sword and Trowel* pieces (`chsof7.pdf`, `chsofs.pdf`)
- the title index and the two Scripture indexes
- `robots.txt`, the About page and the sermons listing page

They belong in another genre or out of the catalogue. That is a catalogue correction this job did not make. The one
real sermon left is no. 1700, whose heading reads "Romans 10:59", a verse that does not exist.

**Since corrected (2026-11-26, job 9da892a6).** Each held file was read again. [sermon-passages.py](../../../../../scripts/sermon-passages.py)
now writes the correction into [spurgeon.json](../../../passage-overlays/spurgeon.json); the catalogue records are not
edited. The 13 prefaces, which Spurgeon wrote for each volume, become `front-matter`, a genre used only in the overlay,
like Piper's `interview`. The two *Sword and Trowel* pieces, "Our First Sermon" (January 1880) and "Our First Seven
Years" (April 1876), become `article`. The three indexes, compiled by the website, and the three web pages, held as
evidence of the site's terms and inventory, are marked not Spurgeon's (`notBy`), so no Teachers page counts them.
Spurgeon's sermons on the Teachers page went from 3,566 to 3,545 and his catalogue works from 3,826 to 3,820. His
sermons with a recorded text are unchanged at 3,544, and his `unplaced` list went from 21 to 0. No. 1700 stays in
`unresolved`, as it was.

## Audit (each held file re-read by a separate method)

| Source | Checked | Errors | How |
|---|---|---|---|
| Begg | 82 (60 random + all 22 new) | 0 | The page's visible scripture line, not the meta tag the script reads, re-parsed and compared with the recorded verse ids |
| Piper | 61 (60 random + the 1 new) | 0 | The visible link text of the header "Scripture:" list |
| Spurgeon | 60 random of 112 | 0 | The held PDF's printed first page. One wording difference only: the catalogue heading says "1 Cor 11:28" and the PDF prints "I Corinthians 11:28", the same verse |
| Moody (claims of no text) | 12 random of 51 | 0 | The held Gutenberg HTML under each heading |
