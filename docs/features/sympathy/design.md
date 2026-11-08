# Funeral and sympathy page — design

**Status:** reviewed, ready to implement. Written in the research & design step (job 728, sequence 33 "Bible Guide chain D: life moments", step 4, 2026-11-07); reviewed once and corrected in place in step 5 (2026-11-07), with what changed listed in the Review section at the end. The next step implements it.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 7 — "Comforting passages and condolence cards people can send." The task for this step adds: get the tone right (gentle, not preachy), cover passages for different losses, readings for services, and card sending.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)
**Sibling it builds on:** [life-event-packs/design.md](../life-event-packs/design.md) (the life-event verse packs, built in step 3 of this chain). This design reuses its passage helpers and its home-printing module rather than writing them again; where this document says "as in the life-event packs", the rule there applies unchanged.

## 1. What we are building, in one paragraph

A quiet section of the site, **/sympathy**, for two kinds of visitor: the person who wants to comfort someone (what to write, which verse to send, how to send it), and the family or pastor planning a funeral (which passages to read, in what order). The hub page holds verses for any loss, a short guide to **what to write in a sympathy card, and what to leave out**, and doors to twelve pages for particular losses (a mother, a father, a husband or wife, a child, a baby, a grandparent, a friend or sibling, a sudden death, a death after long illness, a death by suicide, a death where the family does not know where the person stood with God, and a pet). Each page offers a hand-chosen set of Berean Standard Bible passages with one honest line on each. A separate **funeral readings** page lists passages in the order a service uses them (opening words, Psalms and Old Testament, New Testament, at the graveside, closing blessing); the family ticks the ones they want and prints a large-type readers' sheet, or sends the list to their pastor as a link. Every page has a **card maker** with four ways to send comfort: send it as a message (a text, email or chat that carries the verse and a link to a calm card page made for the person grieving), print a folded card at home, print memorial cards to hand out at a service, or simply copy the words to write inside a shop-bought card. Nothing costs anything to run, nothing new is installed, and nothing a visitor types is stored or sent to the site.

## 2. Research

### 2.1 What people search for, and what they find

Sympathy searches are among the largest Bible searches there are, and most are made in a hurry, often on a phone, by someone standing in a card aisle or about to send a text: "bible verses for sympathy cards", "condolence bible verse", "what to write in a sympathy card christian", "bible verses for loss of mother", "loss of father bible verse", "bible verses for loss of a child", "miscarriage bible verses", "bible verses for loss of a pet", "funeral bible readings", "scripture for a funeral program", "bible verses for death of a grandparent".

The pages that rank today ([ByScripture](https://byscripture.com/bible-verses-for-sympathy-cards/), [Twigs Paper](https://twigspaper.com/blogs/paper-trails/the-definitive-guide-to-writing-christian-sympathy-card-messages), [Good Catholic](https://www.goodcatholic.com/how-to-write-a-sympathy-card/), [GodTube](https://www.godtube.com/blog/15-sympathy-card-messages-bible-verses-quotes.html), and long lists of "73 best verses") fall into the same three kinds the life-event research found: long, ad-heavy lists (mostly King James), card shops selling one verse on a design, and short church lists of funeral readings. They share three weaknesses this feature is built to fix:

1. **They treat every loss alike.** The same twenty verses are offered for a grandmother of ninety-four and for a stillborn baby. Hardly any page separates verses about a believer's hope (which a family may not share) from verses about God's nearness to the grieving (which anyone can receive).
2. **They do not help with tone.** A few have a line on what to avoid; none explains why a much-loved verse can wound in the first week (Romans 8:28, Job 1:21) or warns that a verse promising heaven may not fit the person who died.
3. **Sending stops at "copy this".** None lets someone send a verse as a gentle card by text or email, and the printable ones are sold, not free.

The verses that recur across all of them (so the ones people will look for here) are Psalm 34:18, Matthew 5:4, Psalm 147:3, John 14:27, Matthew 11:28, Revelation 21:4, Psalm 30:5, Psalm 23, John 14:1–3, 1 Peter 5:7, Isaiah 41:10, Psalm 46:1 and John 11:35. All are in the plan below.

### 2.2 What grief-care guidance says about tone

Grief-support organisations agree closely on what helps and what hurts ([Speaking Grief](https://speakinggrief.org/get-better-at-grief/supporting-grief/what-not-to-say), [Bristol Hospice](https://bristolhospice.com/what-to-say-to-someone-who-is-grieving/), and from a Christian widow's side [Lisa Appelo](https://lisaappelo.com/hopeingrief/in-grief-what-not-to-say-what-to-say-instead/)):

- **Helps:** saying the loss plainly ("I'm so sorry"); saying the person's name; sharing a specific memory; offering one concrete thing ("I'll bring dinner on Thursday") instead of "let me know if you need anything"; showing up again weeks and months later, when most cards have stopped.
- **Hurts, even when meant kindly:** "everything happens for a reason"; "they're in a better place" (unless you know the family holds that hope, and even then it can sound like "so stop grieving"); "God needed another angel"; anything starting "at least…"; "I know how you feel"; "be strong"; "time heals".
- **From the Christian side specifically:** Romans 8:28 ("God works all things together for good") is true and precious, but quoted in fresh grief it rushes a person to find a reason for their loss instead of leaving room to lament. Scripture itself makes that room: Jesus wept at his friend's tomb though he was about to raise him (John 11:35), and nearly a third of the Psalms are laments.

Several of these also have a plain biblical answer, which lets the page correct gently without scolding: people do not become angels when they die (Hebrews 12:22–23 keeps "the spirits of the righteous made perfect" distinct from "myriads of angels"); "God won't give you more than you can handle" is not in the Bible (1 Corinthians 10:13 is about temptation, and Paul wrote of being burdened "far beyond our ability to endure", 2 Corinthians 1:8); and 1 Thessalonians 4:13 does not say "do not grieve" but "do not grieve like the rest, who are without hope".

### 2.3 Language around suicide

Suicide-prevention bodies ([AFSP](https://storytelling.afsp.org/for-social-media-creators), the International Association for Suicide Prevention, and the NIH style guide) agree: say **"died by suicide"** or "took their own life", never "committed suicide" (a phrase from when suicide was a crime) or "successful". People bereaved by suicide are themselves at higher risk, so a page for them should show where help is, calmly and without alarm. The site already has that help gathered and checked: [life.json](../../../src/data/resources/life.json) holds the 988 Suicide & Crisis Lifeline, the emergency number, a helpline finder for other countries, and two grief-care entries (GriefShare and the American Foundation for Suicide Prevention's loss-survivor groups), shown on the site's "Help for life" page at `/resources/life`. This feature reads those entries; it never types a phone number of its own.

### 2.4 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| Loading verses in the app | `resolveRange` (and `useVerses` for a single passage); verse ids `BBCCCVVV`. They default to the site language's Bible, so every call passes `"bsb"` explicitly. The life-event loader [usePackPassages.ts](../../../src/pages/life-events/usePackPassages.ts) is the pattern to copy (it takes a `LifeEvent`, so this feature writes its own small loader the same way: `resolveRange` per passage, then `assemblePassage` and `passageReference`) | [verses.ts](../../../src/lib/verses.ts) |
| Turning a short reference into verse ids, checking it, and holding an exact excerpt for an "a"/"b" verse | `p("PSA 30:5b", role, note, { part })`, `BOOK_NUMBERS` | [types.ts](../../../src/data/life-events/types.ts) |
| Assembling a passage's words (dropping unpartnered quotation marks, ending a cut sentence with "…", capitalising), formatting its reference, its reader link, the card length limits (240 full size, 320 smaller, 700 for a display print) | `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL`, `CARD_MAX`, `DISPLAY_MAX` | [passage.ts](../../../src/pages/life-events/passage.ts) |
| Printing one sheet with the browser's print dialog: paper size, `@page` rule, the print marker kept until the page closes, waiting for fonts, spotting in-app browsers that cannot print, Letter/A4 default from the browser's language | `usePrintSheet(paper, margin)`, `useFontsReady`, `canPrint`, `defaultPaper`, `PAPER_SIZE`, `<PrintPortal>`; written to know nothing about life events precisely so this feature could import it. **Not** reusable as they are: the sheet layouts themselves ([CardSheet.tsx](../../../src/pages/life-events/CardSheet.tsx), [life-events-sheet.css](../../../src/pages/life-events/life-events-sheet.css)), which are tied to the life-event card description and its ornaments; this feature draws its own sheets to the same measurements (6.3) | [print-sheet.ts](../../../src/pages/life-events/print-sheet.ts), [PrintPortal.tsx](../../../src/pages/life-events/PrintPortal.tsx), [print-sheet.css](../../../src/pages/life-events/print-sheet.css) |
| QR code drawn as SVG squares from the site's public address | `qr.ts`, `QrCode.tsx` | [qr.ts](../../../src/pages/life-events/qr.ts), [QrCode.tsx](../../../src/pages/life-events/QrCode.tsx) |
| Crisis and grief-care contacts | Entries `988-lifeline`, `emergency-911`, `find-a-helpline`, `griefshare`, `afsp-suicide-loss-groups` | [life.json](../../../src/data/resources/life.json), shown on [LifePage.tsx](../../../src/pages/resources/LifePage.tsx) |
| Topic pages to link to | Confirmed slugs: `bereavement`, `mourning`, `death-of-saints`, `resurrection`, `heaven`, `hope`, `consolation-in-affliction`, `weeping`, `sympathy`, `compassion-and-sympathy-of-christ`, `holy-spirit-the-comforter`, `widows`, `orphan`, `death` | [data/topics/index.json](../../../data/topics/index.json), pages at `/topics/<slug>` |
| Hymns for a service | The site's hymn collection (older public-domain hymnals). Confirmed ids: `ccel-olney-hymns-41-amazing-grace-how-sweet-the-sound`, `gutenberg-watts-psalms-90-2-our-god-our-help-in-ages-past`, `ccel-watts-psalms-hymns-ps-54-my-shepherd-will-supply-my-need`, `gutenberg-watts-psalms-23-3-the-lord-my-shepherd-is`, `gutenberg-watts-hymns-2-66-there-is-a-land-of-pure-delight` | [collection.json](../../../data/hymns/collection.json), pages at `/study/hymns/<id>` |
| Keeping a page out of search results | A page-level `<meta name="robots" content="noindex">` added by the page itself (as the research preview page does), and `X-Robots-Tag` lines in the site's headers file | [ResearchPreviewPage.tsx](../../../src/pages/research/ResearchPreviewPage.tsx), [public/_headers](../../../public/_headers) |
| Page titles, descriptions, sitemap, crawler copies, not-found handling | Same as the life-event packs: `h1` names the page, the first `<p>` of 60+ characters inside `<main>` is the description, `ROUTE_TITLES` for the hub, a page type in the design-review inventory for the sitemap, the site's own not-found page for unknown addresses | [page-head.ts](../../../src/lib/page-head.ts), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), [NotFoundPage.tsx](../../../src/pages/NotFoundPage.tsx) |

**What does not exist yet:**
- **No shared verse-card generator.** Chain C's generator (approved idea 4, shareable verse images; design to live at [docs/features/verse-cards/design.md](../verse-cards/design.md)) had not been written on 2026-11-07 (still absent at review, same day): the `docs/features/` folder holds only games-hub, life-event-packs, live-quiz, map-quest, odd-one-out, sympathy and whos-older. The implementation step checks again before it starts and, if the generator exists by then, follows 7.5 directly. Section 7.5 shows how this feature's cards switch to it later.
- **No link-preview images per page.** A sympathy link pasted into a chat shows the site's default preview. Making a preview image for each verse is exactly what the verse-card generator is for, so this feature does not build its own (7.5); the message it sends carries the verse in its own text so it stands on its own without a preview.

### 2.5 Doctrine sets the boundaries

The site writes in agreement with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). For a sympathy page that means holding two things together: the site teaches plainly that Christ will raise the dead and that salvation comes only through personal faith in him (the confession's articles on salvation and on last things), and the page must never pronounce on where a particular person who died now is. The rules that follow from it:

1. **Hope for a believer is labelled as that.** Passages that speak of a Christian's hope after death (1 Thessalonians 4:13–14, Philippians 1:21–23, 2 Corinthians 5:6–8, Revelation 14:13, Psalm 116:15) carry a small visible label, **"For a believer"**, on the page and in the card maker, so a sender chooses them knowingly. They are never the default card verse on any page.
2. **Comfort for the mourner fits everyone.** Every page's default card verse, and every card verse on the "faith unknown" and "suicide" pages, speaks of God's nearness and care (Psalm 34:18, Matthew 5:4, Psalm 147:3…; on the pet page, Psalm 145:9, God's compassion on all he has made) and says nothing about where the one who died now is. The rule covers card verses only: readings on those two pages may carry the "For a believer" label, shown as on every other page.
3. **No false comfort.** The site's own voice never says the dead become angels, watch over us, or "are in a better place" without qualification. It never implies that everyone who dies goes to heaven, and it never implies that a particular person did not.
4. **Where the confession is silent, show the views and do not choose.** The confession does not say what becomes of babies and young children who die before they can believe. Many Christians, Baptists prominent among them, take hope from David's words over his infant son ("I will go to him", 2 Samuel 12:23) and from God's character as the Judge who does what is right (Genesis 18:25). The baby page says exactly that: that many take this hope and why, not that the site has ruled (4.4).
5. **Security of the believer** (the confession's article that true believers "will never fall away") is the honest answer to the fear, common after a suicide, that a believer who died that way is lost. The suicide page says so gently in its explainer, in the confession's terms, and still pronounces on no individual (4.4).
6. **No liturgy is invented.** Baptist churches have no fixed funeral service; the pastor leads it. So the funeral readings page offers Scripture arranged by where a service commonly uses it, and says plainly that the order is a suggestion for the family and pastor to change freely. It does not print words for the minister to say.
7. **Life from conception.** The confession contends "for the sanctity of all human life from conception to natural death", so a miscarriage at any stage is the loss of a child and the baby page speaks of it that way, using "baby", never "pregnancy tissue" or "fetus".

### 2.6 Neighbouring features: who covers what

| Need | Where it belongs | How the two pages relate |
|---|---|---|
| A grieving person looking for comfort for themselves, by feeling ("when you're grieving", "when you're lonely") | "What the Bible says when you're…" pages (approved idea 9, this chain's step 10), which also design crisis-resource handling for the whole chain | This feature is organised **by the loss and by the task** (sending a card, planning a service). The "when you're grieving" page should link to these loss pages rather than repeat them; this feature links back to it once it exists, and the recipient card page (5.5) points there for "more words of comfort" |
| Prayers for a grieving friend, before a funeral | Prayers for occasions (approved idea 10, step 13) | Linked from "Explore more" once it exists |
| A new baby, expecting a baby | Life-event packs (built in step 3) | The life-event "expecting" pack was designed to link here, gently, for a family who has lost a baby; the baby page here links back to it for a pregnancy after loss. Both links are one line each |
| Countdowns (Advent, Lent) | Countdowns (approved idea 8) | None needed |

### 2.7 Printing and sending: what changes from the life-event packs

The life-event research on home printing (2.5 and 2.6 of that design: browsers print no backgrounds, printers cannot reach the edge, the paper size must be set from code, scaling ruins folds, one-sided quarter-fold cards, fonts must be requested before printing, phones fire `afterprint` early, in-app browsers cannot print) applies unchanged, and the module that encodes it is reused as it is. Three things are new here:

- **People send sympathy more often than they print it.** Many condolences today go by text or WhatsApp in the first hours. Phones offer a share sheet to web pages (`navigator.share`), supported in Safari on iPhone and Chrome on Android; desktop browsers are patchier, so every share has a copy-to-clipboard and an email fallback.
- **A sympathy link is opened by someone grieving.** If the link sent to them lands on a page titled "Bible Verses for Sympathy Cards" with a card maker on it, the comfort reads as a form letter. So the link goes to a separate, quiet **card page** made for the recipient (5.5).
- **Memorial cards** (a name, dates and a verse, handed to guests at a service, often kept in a Bible or wallet afterwards) are a common printed item at funerals and fit the life-event small-card format exactly.

## 3. The pages and their losses

Thirteen passage sets at launch (the hub's own "any loss" set plus twelve particular losses), and the funeral readings page.

| Page (address) | Heading (`h1`) | Search phrase it is written for |
|---|---|---|
| `/sympathy` | Bible Verses for Sympathy Cards | bible verses for sympathy cards / condolence bible verses / what to write in a sympathy card |
| `/sympathy/loss-of-mother` | Bible Verses for the Loss of a Mother | bible verses for loss of mother |
| `/sympathy/loss-of-father` | Bible Verses for the Loss of a Father | bible verses for loss of father |
| `/sympathy/loss-of-spouse` | Bible Verses for the Loss of a Husband or Wife | bible verses for loss of husband / loss of wife / widow |
| `/sympathy/loss-of-child` | Bible Verses for the Loss of a Child | bible verses for loss of a child |
| `/sympathy/loss-of-baby` | Bible Verses for the Loss of a Baby | miscarriage bible verses / stillbirth / infant loss |
| `/sympathy/loss-of-grandparent` | Bible Verses for the Loss of a Grandparent | bible verses for loss of grandmother / grandfather / a long life |
| `/sympathy/loss-of-friend` | Bible Verses for the Loss of a Friend, Brother or Sister | bible verses for loss of a friend / brother / sister |
| `/sympathy/sudden-loss` | Bible Verses for a Sudden or Tragic Loss | bible verses for sudden death / tragic loss |
| `/sympathy/after-illness` | Bible Verses After a Long Illness | bible verses for death after illness / cancer |
| `/sympathy/loss-to-suicide` | Bible Verses for a Loss to Suicide | bible verses for loss to suicide |
| `/sympathy/faith-unknown` | Bible Verses When You Don't Know Where They Stood with God | bible verses for death of a non believer / unsaved loved one |
| `/sympathy/loss-of-pet` | Bible Verses for the Loss of a Pet | bible verses for loss of a pet |
| `/sympathy/funeral-readings` | Bible Readings for a Funeral | funeral bible readings / bible verses for a funeral / scripture for a funeral program |
| `/sympathy/card/<key>` | (recipient card page, not indexed, 5.5) | — |

**On the pet page.** A pet's death is a real grief, and it is one of the larger searches here. The page is honest: the Bible does not say whether animals have a place in the new creation, and the page does not promise what Scripture does not say. It shows that God made, knows and cares for every creature (Psalm 145:9, Matthew 10:29) and that caring well for an animal is righteous (Proverbs 12:10). If the owner would rather not have it, removing it is deleting one data entry.

**Later, added as data only** (no code change): loss of a service member or first responder (John 15:13, with a context note, since it speaks first of Christ's own death); loss of a pastor; the anniversary of a death or the first holidays without someone (a set of "thinking of you" cards for months later, which grief guidance says matter most and are sent least); loss of a grandchild; loss of a twin.

## 4. Passage plan

### 4.1 How passages are chosen

The rules of the life-event packs (4.1 there) apply unchanged: verse ids only, never typed text; Berean Standard Bible only; exact excerpts for "a"/"b" verses checked by a test; the same tidying of quotation marks and cut-off sentences; one written line per passage; context notes for verses often taken beyond what they say. On top of those:

1. **Two roles, not three.** **Card verse** (to send or write in a card; 320 characters or fewer after tidying) and **reading** (to read slowly at home, or aloud at a service). The funeral readings page adds a third, **blessing**, for its closing words. Each set keeps 9–16 passages with at least six card verses.
2. **Two labels a passage can carry:**
   - **For a believer** (2.5, rule 1): it speaks of a Christian's hope after death. Shown as a small label beside the reference, on the page, in the card maker's verse list and on the readings sheet.
   - **Often better a few weeks on**: a verse of future joy (Psalm 30:5b, Revelation 21:4, Isaiah 25:8, Isaiah 35:10) that grief guidance and pastors alike say can sting in the first days, when the morning feels impossibly far. Shown as a small muted hint in the card maker, never as a warning on the page.
3. **Each set's first card verse is its default card verse**, and it must be one that carries neither label (tested).
4. **Excerpts sit only on a single verse**, never on the first verse of a longer passage. The life-event helper (`p()` and `passageReference`) puts an excerpt's "a"/"b" mark on the last verse of a passage; every excerpt in this plan is a single verse (Psalm 30:5b, John 11:25b, Mark 10:14b, Hebrews 13:5b, Deuteronomy 33:27a, Isaiah 66:13a, Song of Songs 8:7a, 2 Samuel 1:26a, Job 1:21b, Genesis 18:25b, Genesis 3:19b), so the shared helper works as it is and needs no change.
5. **Verses kept off cards on purpose,** with the reason given in the "What to leave out" guide (5.3): Romans 8:28; Job 1:21 (a mourner's own confession; on the funeral readings page as a reading only); Jeremiah 29:11; Isaiah 57:1–2 ("the righteous are guided from the presence of evil", which invites a reason for one particular death); 1 Corinthians 10:13. None appears as a card verse anywhere.

### 4.2 The passages

Every reference below was checked against the site's Berean files on 2026-11-07 (all exist; none crosses a verse the Berean omits). Length in characters is given in brackets where it decides the role. **R** = reading, **C** = card verse, **(b)** = labelled "For a believer", **(w)** = "often better a few weeks on", **ctx** = carries a context note (4.3). The first C in each list is the set's default card verse. The implementation step may swap a passage if the review finds a better one, keeping the counts and the default rule.

**Any loss (the hub, `/sympathy`)** — C: Psalm 34:18 [71]; Matthew 5:4; Psalm 147:3; 2 Corinthians 1:3–4 [243]; John 14:27; Psalm 46:1; Deuteronomy 33:27a "The eternal God is your dwelling place, and underneath are the everlasting arms."; Lamentations 3:22–23; Romans 15:13; 1 Peter 5:7; Psalm 23:4; John 11:35 (ctx); Psalm 30:5b "Weeping may stay the night, but joy comes in the morning." (w); Revelation 21:4 (w). R: Psalm 23:1–6 [576]; John 11:32–36 [379]. (16)

**Loss of a mother** — C: Psalm 34:18; Isaiah 66:13a "As a mother comforts her son, so will I comfort you…" (ctx); Proverbs 31:28–29 [142]; Proverbs 31:30–31 [167]; 2 Timothy 1:5 (a faith first held by a grandmother and a mother); Psalm 73:26; Psalm 90:1–2 [185]; Philippians 1:3; 1 Thessalonians 4:13–14 [279] (b, ctx). R: Proverbs 31:25–31 [548] (ctx); John 14:1–3 [335] (b); Psalm 23:1–6. (12)

**Loss of a father** — C: Psalm 34:18; Psalm 103:13; Proverbs 20:7; Proverbs 17:6 "…the glory of a son is his father."; Psalm 68:5 (for children of any age); Deuteronomy 33:27a; Philippians 1:3; Romans 14:8 (b); 2 Timothy 4:7–8 [264] (b). R: Psalm 103:13–18 [517]; Psalm 121:1–8 [522]; John 14:1–3 (b). (12)

**Loss of a husband or wife** — C: Psalm 34:18; Psalm 4:8 (for the nights alone); Hebrews 13:5b "Never will I leave you, never will I forsake you."; Psalm 68:5; Psalm 146:9; Isaiah 54:5 (ctx; written to a widow, so the card maker's hint says another verse suits a man who has lost his wife); Song of Songs 8:7a "Mighty waters cannot quench love; rivers cannot sweep it away." (ctx); Isaiah 41:10; Psalm 73:26. R: Song of Songs 8:6–7 [343] (ctx); Isaiah 43:1–2 [391]; Psalm 121:1–8; Romans 8:35–39 [595] (b). (13)

**Loss of a child** — C: Psalm 34:18; Psalm 56:8 (God keeps count of every tear); Isaiah 40:11; Matthew 5:4; Lamentations 3:31–33 [195] (ctx); Psalm 147:3; 2 Corinthians 1:3–4; Isaiah 25:8 [172] (w). R: 2 Samuel 18:33 [199] (ctx); John 11:32–36; Revelation 21:3–4 [350] (w). (11)

**Loss of a baby** (miscarriage, stillbirth, the death of an infant) — C: Psalm 34:18; Psalm 147:3; Psalm 56:8; Isaiah 40:11; Mark 10:14b "Let the little children come to Me, and do not hinder them! For the kingdom of God belongs to such as these." (ctx); Jeremiah 1:5 (ctx); Isaiah 66:13a (ctx); Revelation 21:4 (w). R: Psalm 139:13–16 [416]; 2 Samuel 12:22–23 [257] (ctx); Mark 10:13–16 [495]. Plus the explainer of 4.4. (11)

**Loss of a grandparent** (and anyone who lived a long life) — C: Psalm 34:18; Genesis 25:8 (ctx); Proverbs 16:31; Proverbs 17:6; Isaiah 46:4; Psalm 90:12; 2 Timothy 1:5; Psalm 116:15 (b, ctx); Revelation 14:13 [216] (b); Matthew 25:21 (b, ctx). R: Psalm 92:12–15 [324]; Psalm 71:17–18 [231]; 2 Timothy 4:6–8 [362] (b). (13)

**Loss of a friend, brother or sister** — C: Psalm 34:18; Proverbs 17:17; 2 Samuel 1:26a "I grieve for you, Jonathan, my brother. You were delightful to me…" (ctx); Philippians 1:3; John 11:35 (ctx); Romans 12:15; Proverbs 18:24; Ecclesiastes 3:4 "a time to weep and a time to laugh, a time to mourn and a time to dance…"; 1 Thessalonians 4:13–14 (b, ctx). R: John 11:32–36; 2 Samuel 1:25–26 [219] (ctx). (11)

**A sudden or tragic loss** — C: Psalm 46:1; Psalm 34:18; Psalm 61:2 ("Lead me to the rock that is higher than I"); John 16:33; Isaiah 43:2 [212]; Psalm 9:9; Nahum 1:7; Psalm 62:8; Romans 8:26 (when there are no words to pray). R: Psalm 46:1–11 [961]; Psalm 13:1–6 [492]; Lamentations 3:19–26 [516]. (12)

**After a long illness** — C: Psalm 73:26; Matthew 11:28; Psalm 4:8; Isaiah 40:29–31 [300]; Romans 8:18 (b); Psalm 116:15 (b, ctx); Philippians 1:21–23 [255] (b); Revelation 21:4 (w); Isaiah 35:10 (w). R: 2 Corinthians 4:16–18 [350]; 2 Corinthians 5:1–8 [793] (b); 1 Corinthians 15:42–44 [315] (b). (12)

**A loss to suicide** — C (none labelled, rule 2.5.2): Psalm 34:18; Psalm 147:3; Psalm 139:12 "even the darkness is not dark to You…"; Matthew 11:28; Psalm 103:13–14 [149]; Isaiah 42:3 (ctx); Lamentations 3:22–23; Romans 8:26; Psalm 62:8. R: Psalm 139:7–12 [489]; John 11:32–36; Romans 8:35–39 (b, ctx; read with the explainer; labelled as on the spouse page, since it speaks of those who belong to Christ). Plus the explainer and help strip of 4.4 and 5.4. (12)

**When you don't know where they stood with God** — C (none labelled, rule 2.5.2): Psalm 34:18; Matthew 5:4; Psalm 147:3; Psalm 145:8–9 [153]; Psalm 62:8; John 11:35; Romans 8:26; Psalm 56:8; Psalm 46:1. R: Genesis 18:25b "Will not the Judge of all the earth do what is right?" (ctx); Psalm 139:1–12 [880]; Psalm 103:8–18 [942]; Luke 23:42–43 [149] (ctx); John 11:32–36. Plus the explainer of 4.4. (14)

**Loss of a pet** — C: Psalm 145:9; Psalm 36:6 ("O LORD, You preserve man and beast"); Matthew 10:29; Luke 12:6; Proverbs 12:10 (ctx); Job 12:10; Psalm 147:9; Psalm 34:18. R: Job 12:7–10 [339]; Psalm 104:24–30 [641]; Romans 8:19–21 [322] (ctx). Plus the explainer of 4.4. (11)

**Funeral readings** (`/sympathy/funeral-readings`, grouped by part of the service; this page is not a set and has no 16-passage cap, but at 47 rows it stays under the site's long-list threshold of about 50, so it renders in full):

| Part of the service | Passages |
|---|---|
| **Opening words** (spoken as the service begins) | John 11:25b "I am the resurrection and the life. Whoever believes in Me will live, even though he dies."; Deuteronomy 33:27a; Lamentations 3:22–23; Psalm 46:1; Matthew 5:4; 2 Corinthians 1:3–4; Job 19:25; Psalm 121:1–2; Romans 14:8 (b) |
| **Psalms and Old Testament** | Psalm 23:1–6; Psalm 90:1–12 [1,003] (ctx); Psalm 121:1–8; Psalm 46:1–11; Psalm 139:1–12; Psalm 103:8–18; Ecclesiastes 3:1–11 [938] (ctx); Isaiah 25:6–9 [609]; Isaiah 40:28–31 [484]; Lamentations 3:22–26 [348]; Job 19:25–27 [256] |
| **New Testament** | John 14:1–6 [575]; John 11:17–27 [928]; John 6:37–40 [468]; Romans 8:31–39 [1,039]; Romans 14:7–9 [303]; 1 Corinthians 15:20–26 [584]; 1 Corinthians 15:51–57 [714]; 2 Corinthians 4:16–18; 2 Corinthians 5:1–8 (b); 1 Thessalonians 4:13–18 [827] (b, ctx); Philippians 3:20–21 [229]; 2 Timothy 4:6–8 (b); Revelation 7:13–17 [756]; Revelation 21:1–7 [980] |
| **At the graveside** | John 11:25–26 [190]; 1 Corinthians 15:42–44 (b); 1 Corinthians 15:55–57 [203]; Psalm 103:15–18 [367]; Revelation 14:13 (b); Job 1:21b "Naked I came from my mother's womb, and naked I will return. The LORD gave, and the LORD has taken away. Blessed be the name of the LORD." (ctx); Genesis 3:19b "For dust you are, and to dust you shall return." (ctx) |
| **Closing blessing** | Numbers 6:24–26; 2 Corinthians 13:14; Hebrews 13:20–21 [317]; Jude 1:24–25 [276]; Romans 15:13; 2 Thessalonians 2:16–17 [197] |

Under the table, a short block **"Readings for a particular life"** points (with links, not repeated text) to the passages that suit a believer of long faith (2 Timothy 4:6–8, Psalm 92:12–15, Proverbs 31:25–31 for a woman of faith, Matthew 25:21), a child (Mark 10:13–16, Isaiah 40:11), a sudden death (Psalm 46), and a person whose faith the family did not know (Psalm 139:1–12, Psalm 90, John 11:17–27: passages that speak to the mourners about God and about Christ's word to them, without claiming anything about the one who died). A second block, **"Hymns"**, links the five confirmed hymns of 2.4 by title.

Most Psalm 90 and Ecclesiastes 3 readings at funerals run the whole passage; they are given whole here.

### 4.3 Context notes

Each is one or two plain sentences, shown in a muted style under the verse, never as a scolding. The wording below is the plan; the implementation step writes the final lines and checks each against the doctrinal foundation and the Berean wording.

| Verse | Page | What the note says |
|---|---|---|
| John 11:35 | Any loss, friend, faith unknown | Jesus wept at his friend Lazarus's tomb, though he knew he was about to raise him. Grief is not a failure of faith. |
| 1 Thessalonians 4:13–14 / 4:13–18 | Mother, friend, funeral | Paul does not say "do not grieve", but "do not grieve like the rest, who are without hope". Christians grieve, and grieve with hope. |
| Isaiah 66:13a | Mother, baby | God's words to his people, picturing his own comfort as a mother's. Read for a mother, it honours both. |
| Proverbs 31:25–31 | Mother | A portrait of a woman who fears the Lord, read for a mother whose life showed it. It is a tribute, not a checklist. |
| Isaiah 54:5 | Husband or wife | Spoken to God's people pictured as a widow (54:4). Widows have held on to it for centuries; it speaks of God's faithfulness, not a replacement for the husband they loved. Because it says "your husband is your Maker", the card maker's hint suggests another verse when the card is for a man who has lost his wife. |
| Song of Songs 8:6–7 / 8:7a | Husband or wife | The love of husband and wife, "as strong as death": words that honour a marriage and the grief of losing the one you loved. The note keeps to that and makes no claim about marriage after death. |
| Lamentations 3:31–33 | Child | Written in the ruins of Jerusalem. "He does not willingly afflict": God takes no pleasure in our grief. |
| 2 Samuel 18:33 | Child | King David's cry for his son Absalom. Scripture records a parent's anguish, "if only I had died instead of you", without rebuke. |
| 2 Samuel 12:22–23 | Baby | David's words after his infant son died: "I will go to him, but he will not return to me." Many Christians take hope from them that a child who dies is safe with the Lord (see the explainer). |
| Mark 10:14b | Baby | Jesus welcomed the little children others turned away. |
| Jeremiah 1:5 | Baby | God's words calling Jeremiah as a prophet; they also show God knowing a person before birth, which is why parents who lost a baby before birth hold on to them. |
| Genesis 25:8 | Grandparent | Said of Abraham: "old and contented". For a long life, fully lived. |
| Psalm 116:15 | Grandparent, after illness | "Precious in the sight of the LORD is the death of His saints": the death of his people is costly to God; he does not treat it lightly. |
| Matthew 25:21 | Grandparent | From the parable of the talents: the master's words at the end of faithful service, which believers long to hear from Christ. |
| 2 Samuel 1:25–26 / 1:26a | Friend | David's lament for his friend Jonathan, with whom he had made a covenant of friendship (1 Samuel 18:3). |
| Isaiah 42:3 | Suicide | Said of God's Servant, the Messiah: he is gentle with the bruised and the faint. |
| Romans 8:35–39 | Suicide | Paul writes of those who belong to Christ: nothing in all creation, death included, can separate them from God's love. |
| Genesis 18:25b | Faith unknown | Abraham's question as he pleaded with God: God is the Judge who always does what is right, and he knows what we cannot see. |
| Luke 23:42–43 | Faith unknown | Christ received a dying man who turned to him at the very end. Only God sees what passes between a person and him; this is not a promise about anyone in particular, but a reason not to guess. |
| Proverbs 12:10 | Pet | Caring well for an animal is part of righteousness. |
| Romans 8:19–21 | Pet | Paul speaks of all creation set free from decay when God's children are revealed. It is hope for creation; it does not say what becomes of a particular animal. |
| Psalm 90:1–12 | Funeral | Moses' psalm, read at funerals for centuries because it is honest about how short life is and ends in prayer: "teach us to number our days". |
| Ecclesiastes 3:1–11 | Funeral | A poem on every season of life, hard ones included; it ends with God who "has set eternity in the hearts of men". |
| Job 1:21b | Funeral (graveside) | Job's own words in his grief: a mourner's confession of trust, which belongs to the one who says it, not a thing to tell someone else. |
| Genesis 3:19b | Funeral (graveside) | Spoken after the fall; read at a graveside alongside the answer the resurrection gives (1 Corinthians 15:22). |

### 4.4 Words the site writes

Besides the notes, each set has a unique **introduction** (60–160 words; its first sentence stands alone and names the loss, since it becomes the search description, as in the life-event packs) and **card defaults** (a heading and an inside line). Four pages carry a short **explainer** (about 120–220 words each), written once by hand in the implementation step and checked against the doctrinal foundation:

- **Loss of a baby — "Where is my baby now?"** Scripture does not answer every question we bring to it. David, when his infant son died, said "I will go to him" (2 Samuel 12:23), and many Christians, Baptists prominent among them, have taken hope from those words and from the character of God, the Judge of all the earth who does what is right, that a baby who dies is safe with the Lord. The confession the site follows does not rule on it; the page says so plainly and offers the hope as others hold it. It also says: a baby lost early is still a child; fathers grieve too; grief after miscarriage is often hidden, so a card is a kindness. It links to the expecting-a-baby pack for a pregnancy after loss, worded "when you are expecting again".
- **Loss to suicide — "For those left behind."** Written in the language of 2.3. It says: this page does not judge; grief after suicide often comes with guilt, anger and questions that have no answers, and all of these can be brought to God (Psalm 62:8). Some fear that a believer who dies this way is lost; Baptists believe that those who truly belong to Christ are kept by him, and Paul's list of what cannot separate them from God's love leaves nothing out (Romans 8:38–39). It names no individual's state, and points to the loss-survivor groups in the site's help directory.
- **When you don't know where they stood with God — "What this page will and won't say."** It says plainly that the site believes salvation is through faith in Christ, and that it does not know, and will not guess, what passed between a person and God, especially in their last days (Luke 23:42–43). What it can say: God is the Judge who does right (Genesis 18:25), he is compassionate to all he has made (Psalm 145:9), he is near to the brokenhearted (Psalm 34:18), and the questions themselves may be poured out to him. It suggests that a card to such a family speaks of their grief and of God's nearness to them, not of where their loved one is.
- **Loss of a pet — "What the Bible does and doesn't say."** As in section 3: God made and cares for every creature; the Bible does not say whether animals share in the new creation, and the page does not promise it.

**Tone rules for every word the site writes on these pages** (the review step checks the data against them, and a few are tested, 7.4):
1. **Short, plain and warm.** No exclamation marks. No "Remember…" or "You should…". No "at least". The site never tells a grieving person how to feel.
2. **Name the loss.** "When your mother has died", not "in this season".
3. **"Died", not euphemisms in the site's own voice** ("passed", "lost", "gone home" are fine in a visitor's card, never imposed). "Died by suicide", never "committed".
4. **Room to lament.** Every set includes, among its card verses or readings, at least one honest lament or one passage where God meets sorrow (Psalm 13, 2 Samuel 18:33, John 11:35, Psalm 34:18, Psalm 56:8, Psalm 73:26), not only promises. Every set in 4.2 meets this (most through Psalm 34:18; after a long illness through Psalm 73:26). This is checked by the review of the data, not by a test.
5. **No reasons offered.** The site never suggests why a particular death happened.
6. **Hope labelled, never assumed** (2.5).
7. **No calls to action on a recipient's screen.** The recipient card page sells nothing and asks nothing (5.5).

## 5. Pages

### 5.1 Addresses and routing

As in the life-event packs: one route, `<Route path="/sympathy/*">`, with the hub at `/sympathy`, sets at `/sympathy/<set>`, the readings at `/sympathy/funeral-readings`, recipient cards at `/sympathy/card/<key>`. An unknown set renders the site's own not-found page. The card maker lives on each page (no separate maker page), so one page answers one search.

### 5.2 A set page, top to bottom

1. **`h1`** (the search phrase in title case, section 3).
2. **Introduction paragraph**, the first `<p>` of 60+ characters inside `<main>`.
3. **Help strip, only on the suicide page** (5.4).
4. **"Verses for a card"** (role C) then **"Passages to read"** (role R), each passage showing its full Berean text as real page text inside `.scripture` with `lang="en"`, its reference linked to the reader, its one-line note, any context note, and its labels. Each card verse has **"Use on card"** and **"Copy"** buttons ("Copy" gives "text — reference (BSB)", ready to write in a shop-bought card). Card verses come first here (the life-event pages put readings first), because most visitors to a sympathy page are writing a card.
5. **Explainer**, on the four pages that have one, placed after the verses so the verses are what a visitor meets first.
6. **"Send comfort"**: the card maker (section 6).
7. **"What to write"**: a short link to the guide on the hub (5.3), not a copy of it.
8. **"Explore more"**: the matching topic pages (any loss → `bereavement`, `mourning`, `sympathy`; mother/father/grandparent → `death-of-saints`, `hope`; spouse → `widows`; child, baby → `consolation-in-affliction`, `weeping`; after illness → `resurrection`, `heaven`; suicide and faith unknown → `compassion-and-sympathy-of-christ`, `holy-spirit-the-comforter`), the funeral readings page, sibling loss pages, and the help directory's grief care (`/resources/life`). Once they exist: the "when you're grieving" page and the prayers page.
9. **Source line**: "Scripture quotations are from the Berean Standard Bible (public domain)."

### 5.3 The hub (`/sympathy`)

1. `h1` "Bible Verses for Sympathy Cards", then the introduction.
2. **"Choose the loss"**: the twelve loss pages as a simple list of cards, each with its short name and one card-verse reference (references, not verse text, for the reason the life-event hub gives: quoting one verse per page would fetch a dozen whole books just to draw a menu). The funeral readings page is the first card, set apart.
3. **"Verses for any loss"**: the hub's own set (4.2).
4. **"What to write in a sympathy card"**, the guide, in three short parts:
   - **Short lines you can use or adapt** (about ten, written for this page): "I'm so sorry. I'm holding you in my prayers." · "There are no words, but I love you and I'm here." · "I'll always remember {name}'s laugh." · "I'm bringing dinner on Thursday; no need to reply." · and lines for later: "Thinking of you as {name}'s birthday comes round." Placeholders are shown as "[their name]", never filled in by the site.
   - **Meant kindly, but can land hard** (each with one gentle sentence of why, 2.2): "Everything happens for a reason"; "They're in a better place" (unless you know the family holds that hope, and even then, let them say it first); "God needed another angel" (people do not become angels; Hebrews 12:22–23); "At least…"; "I know how you feel"; "God won't give you more than you can handle" (not in the Bible; 1 Corinthians 10:13 is about temptation); quoting Romans 8:28 in the first days.
   - **Keep showing up**: a card a month later, at the first birthday, at the first Christmas, is often the one remembered.
5. **"Send comfort"**: the card maker, with the hub's verses.
6. "Explore more" and the source line.

Search title in `ROUTE_TITLES`: **"Bible Verses for Sympathy Cards and Funerals"** (45 characters).

### 5.4 Help strip and grief care

- **On the suicide page**, under the introduction: a calm strip in the site's existing green help style (not red), reading the 988 entry from [life.json](../../../src/data/resources/life.json): "If you're struggling yourself, you can call or text 988, any time, day or night." with call and text links built the way [LifePage.tsx](../../../src/pages/resources/LifePage.tsx) builds them, plus "Outside the US: find a helpline" from the `find-a-helpline` entry, and "Groups for people who have lost someone to suicide" from `afsp-suicide-loss-groups`. If an entry is missing from the data, its line is left out rather than typed in.
- **On every page**, in "Explore more": "Grief support near you" linking to `/resources/life` (where GriefShare is listed).
- **Not on the recipient card page.** A person opening a card from a friend should not be met with a crisis line. The step that designs the "when you're grieving" pages owns crisis handling for the grieving person's own pages; the recipient card links there once it exists (5.5).

### 5.5 The recipient card page (`/sympathy/card/<key>`)

What the person grieving sees when they open a link a friend sent:

- The chosen verse, set large in Literata in the chosen card style (6.6), its reference, and a quiet line: "Sent to you with sympathy."
- Below, small: "Read it in the Bible" (the reader link), and, once the "when you're grieving" page exists, "More words of comfort" pointing there; until then, the hub's "any loss" verses at `/sympathy#verses`.
- A very small site name at the foot. **No card maker, no "make your own", no list of other pages, no crisis strip, nothing to sign up for.**
- **No personal words in the link.** The address carries only the verse key and the style (`/sympathy/card/psalm-34-18?style=olive`). The sender's own words travel in their own message (6.2), which the recipient reads in their messaging app above the link. This is deliberate: a link that displayed visitor-written text on the site's own domain could be used by anyone to put any words on bibleguide.io (a fake "notice of death", say), and it would put names into addresses that get logged and forwarded.
- **Not indexed:** the page adds `<meta name="robots" content="noindex">` itself, as the research preview page does; one line in [public/_headers](../../../public/_headers) adds `X-Robots-Tag: noindex` for `/sympathy/card/*`; and these addresses are left out of the sitemap. Its `h1` is the reference ("Psalm 34:18") so the tab reads sensibly.
- **Keys are permanent.** A passage key is made from the passage's verse ids and excerpt mark (`psalm-34-18`, `john-11-25b`, `2-corinthians-1-3-4`, `song-of-songs-8-7a`), one per passage across all sets and the readings page (a verse on several pages has one key). It is computed from the data alone, through a fixed book-name table in this feature's data folder, **never from the catalogue's book names**: the recipient page must find its passage before the catalogue loads, and a catalogue name that is later reworded or translated must not change a key. Because links sit in people's messages for years, a key must never stop working: a test compares today's keys with a committed list and fails if one disappears; a key retired on purpose moves to an alias list pointing at its replacement. The same list covers the readings keys used in funeral-list links (5.6), which sit in pastors' messages just as long.
- **Unknown key** (a mistyped or cut-off link): the page still shows a card, with Psalm 34:18 and a gentle line, "We couldn't find the exact verse this link pointed to. Here are words of comfort from Psalm 34:18." Never the site's "page not found" to someone grieving.
- **Unknown style:** falls back to the plain style.

### 5.6 The funeral readings page

1. `h1` "Bible Readings for a Funeral", introduction (which says the order is a suggestion; the family and pastor shape the service).
2. The five parts of 4.2, each passage with its text collapsed to its first line and a **"Show reading"** toggle (the page would otherwise be very long), its reference, note, labels, length as reading time ("about 1 minute aloud", at about 150 words a minute), and a **"Add to our list"** checkbox.
3. **"Our readings"**: a panel (sticky at the bottom on phones, beside the list on wide screens) listing what is ticked, in service order, which the family can reorder with up and down buttons, plus three actions:
   - **Print readers' sheet** (6.4): every chosen reading in full, large type, one per page or flowing, for the people who will read aloud.
   - **Send the list to our pastor**: shares or copies a link whose address holds only the chosen passage keys in order (`/sympathy/funeral-readings?list=psalm-23-1-6,john-14-1-6,…`). No names, no personal data. Opening it ticks those readings and shows them in that order. Unknown keys in the list are skipped with a one-line note. The page also keeps this same `?list=` in its own address as the family ticks and reorders (replacing the history entry, not adding one), so a reload, a phone that drops the tab, or a trip to a hymn page and back does not lose the list. The page's official address (canonical) ignores the query, so search engines see one page.
   - **Copy as text**: references and full text, for a funeral program.
4. "Readings for a particular life", "Hymns", "Explore more" and the source line.

### 5.7 Being found

As in the life-event packs (5.4 there): one page type, "sympathy", in the design-review inventory, fed by one function in the data index that returns the fourteen indexable addresses (the hub, the twelve loss pages and the readings page; recipient cards excluded), so a set added later reaches the sitemap by itself; captures for crawlers only after the owner releases. Distinct from the topic pages: `/topics/bereavement` answers "what does the Bible teach"; `/sympathy/loss-of-mother` answers "what can I send or read". No FAQ markup. After release: `bun run seo:capture --only /sympathy`, commit, `bun run seo:indexnow`.

### 5.8 Entry points

- **Home page:** one new line of link text, "Words of comfort and sympathy cards", at the end of the same Resources block where the life-event line sits, in [HomePage.tsx](../../../src/pages/HomePage.tsx), for the reasons the life-event design gives (a new block is a redesign needing the owner's mock-up; rewording a line loses its translations).
- **Route:** two lines in [App.tsx](../../../src/App.tsx). **Search title:** one entry in [page-head.ts](../../../src/lib/page-head.ts). **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts). **Headers:** one line in [public/_headers](../../../public/_headers).
- **Link from the life-event "expecting" pack** to `/sympathy/loss-of-baby`, worded "If you have lost a baby", in that pack's "Explore more", which its design already planned. This is the only change to another feature's files, and it is **not** a single data entry as first written: a pack's `related` list takes only other pack slugs (anything else is silently dropped by [PackPage.tsx](../../../src/pages/life-events/PackPage.tsx)). It takes three small additive edits: an optional `elsewhere?: { href: string; title: string }[]` field on `LifeEvent` in [types.ts](../../../src/data/life-events/types.ts), one line in PackPage.tsx's "Explore more" list that renders it, and the one entry in [new-life.ts](../../../src/data/life-events/new-life.ts). No existing field or behaviour changes, and the life-event tests must still pass. (The life-event packs are this chain's own step 3, already finished; another chain may still touch them, for example to move their cards to the shared verse-card generator, which is why the edit stays this small and purely additive. Re-read the three files just before editing them.)

## 6. The card maker: sending comfort

### 6.1 The flow

One component, on every set page and the hub:

1. **Choose a verse.** A list of the page's card verses (with their labels and hints, 4.1), the default selected. "Use on card" on any passage selects it here and scrolls here.
2. **Choose a style**: Plain, Olive branch, Morning light, Lily (6.6). Plain is the default.
3. **Choose how to send**, as four tabs:

| Tab | What it makes | Personal fields |
|---|---|---|
| **Send as a message** (default on phones) | A message for the visitor's own text, email or chat app (6.2) | Your message (500 characters) |
| **Print a card** (default on wide screens) | The life-event folded quarter-fold card, Letter or A4 (6.3) | Their name(s) (60), heading (50), your message (300), your name (60) |
| **Memorial cards** | Four cards per sheet to hand out at a service (6.3) | Name of the person who died (60), dates (40, typed freely), heading (50, default "In loving memory") |
| **Display print** | One sheet for a memorial table or beside a photograph; any passage of the page of 700 characters or fewer (6.3) | Name (60), dates (40) |

Copying the words for a shop-bought card is the "Copy" button on each verse, so it needs no tab.

Everything typed stays in the page's memory: never in the address, never saved, never sent to the site. Typed text is drawn under `translate="no"` (so a name like Grace or Joy is not translated), escaped by React, and shrinks one size step before wrapping badly, all as in the life-event card maker.

### 6.2 Send as a message

- **What is sent** is plain text the visitor sees and can edit before sending:

  ```
  [your message, if any]

  "The LORD is near to the brokenhearted; He saves the contrite in spirit." — Psalm 34:18 (BSB)

  https://bibleguide.io/sympathy/card/psalm-34-18?style=olive
  ```

  The verse is in the text itself, so the message is complete even where links do not preview. The link is built from the site's `SITE_ORIGIN` constant, never from the address the page is open at (as the life-event QR codes are), and carries no tracking.
- **Buttons:** **Share…** (opens the phone's share sheet with `navigator.share({ text })`; shown only where the browser supports it), **Copy message** (clipboard), **Email** (a `mailto:` link with the subject "Thinking of you" and the message as its body), and on phones **Text message** (an `sms:?&body=…` link with no number, so the visitor picks the person in their own app; the `?&body=` form is the one [contact-links.ts](../../../src/pages/resources/contact-links.ts) uses because both iPhone and Android read it, but its `smsHref` needs a number, so the message builder writes this one-line link itself). **Preview the card** opens the recipient page in a new tab so the sender sees exactly what will arrive.
- **Nothing goes through the site.** The site never sends a message or email itself, holds no addresses, and has no server part for this. It costs nothing to run.
- A cancelled share sheet is not an error and shows nothing. A failed clipboard write shows the text selected in a box with "Press and hold to copy".

### 6.3 Printed formats

All three use the life-event print module unchanged ([print-sheet.ts](../../../src/pages/life-events/print-sheet.ts), [PrintPortal.tsx](../../../src/pages/life-events/PrintPortal.tsx), [QrCode.tsx](../../../src/pages/life-events/QrCode.tsx)) and the life-event sheet **measurements**, but not its sheet component: the life-event [CardSheet.tsx](../../../src/pages/life-events/CardSheet.tsx) draws a life-event card description with life-event ornaments and has no memorial-card layout, so this feature writes its own sheet component and stylesheet, copying the panel sizes, safe margins and fold positions from [life-events-sheet.css](../../../src/pages/life-events/life-events-sheet.css) (with a comment naming the source) rather than importing or changing it. The shared rules: true-size sheets, a hair shorter than the paper, ink only, every element at least 0.3 in (8 mm) from cut and fold lines, fixed light colours, fonts requested before printing, in-app browsers told to open the page in a browser, "Scale: 100% (or Default)" in the on-page instructions.

- **Folded card** (quarter-fold, one side of one sheet, 4.25 × 5.5 in for an A2 envelope or A6 for a C6 envelope): front (bottom right) the verse, reference, ornament and the heading (default "With deepest sympathy"; choices also "Thinking of you", "With love and sympathy", "Holding you in prayer", "In loving memory of [name]"); inside right (top left, turned 180°) the recipient's name, the message and the sender's name, with room to write by hand; inside left (top right, turned) blank for handwriting, or a second card verse; back (bottom left) "bibleguide.io/sympathy" and "Scripture: Berean Standard Bible", **with no QR code by default** (a code on a condolence card reads as marketing; a checkbox adds it for those who want the passage link).
- **Memorial cards, four per sheet:** front only, each the same: heading, the name, the dates, the verse and reference, and a thin rule; cut guides on. It offers the page's card verses (all 320 characters or fewer, the life-event small-card rule), at full size up to 240 characters and one step smaller above that.
- **Display print:** the life-event display print (inside an 8 × 10 in area on Letter, so it can be trimmed for a standard frame; A4 as is), with the name and dates under the verse.

### 6.4 Readers' sheet (funeral readings page)

Drawn by this feature's own sheet component (6.3) on the model of the life-event readings sheet, with these differences: larger type for reading aloud at a lectern (Literata at about 16 pt, line spacing 1.5), each reading headed by its part of the service and its reference in Archivo, and an option **"Start each reading on a new page"** (on by default, so each reader can be handed their own page). Calls `usePrintSheet(paper, "0.75in")` (or "19mm" on A4), a real page margin so the sheet runs on over several pages, and shows the on-page reminder to switch off the browser's headers and footers, exactly as the life-event readings sheet does.

### 6.5 How it is built

- The card maker builds a plain **card description** (passage key, reference, resolved text, style, heading, names, dates, message, page slug) and hands it to the sheet or to the message builder; neither reads the page's state. This is what makes the later switch to the shared verse-card generator a small change (7.5).
- The message text is built by one pure function from the description, so it is tested without a browser.
- The recipient page and the message builder share one function that turns a passage into its key, so a key printed on a message always resolves.

### 6.6 Look

Sympathy pages and cards use a quiet palette: the site's dark ink for type, one muted accent (a soft slate blue-grey, a fixed light value written into the sheet's own styles, never the theme variables), generous white space, and no bright category colour. Four styles, each a small line-art ornament drawn as an SVG in the feature's folder:

| Style | Ornament | Why it fits |
|---|---|---|
| **Plain** (default) | A single thin rule | Fits any loss and any faith |
| **Olive branch** | A small olive sprig | Peace (Genesis 8:11) |
| **Morning light** | A low horizon line with a rising half-circle | "Joy comes in the morning" (Psalm 30:5); the resurrection at dawn |
| **Lily** | A single lily outline | "Consider how the lilies of the field grow" (Matthew 6:28); lilies have long been used at Christian funerals |

Deliberately left out: angels and wings (people do not become angels), butterflies and balloons (not biblical symbols, and the latter trivialise), crosses as decoration on a card a family may not share faith with (the verse carries the faith; the visitor can still choose any style), photographs, and any colour fill (it prints white anyway). Scripture in Literata; small text in Archivo. The recipient page uses the same styles at screen size, with a little more space, and honours the visitor's dark mode on screen (only print is forced light).

## 7. Building it

### 7.1 Data

Under `src/data/sympathy/`: one file per group of sets (keeping each under 500 lines; for example `family.ts` for mother, father, spouse, child, baby, grandparent; `circumstances.ts` for friend, sudden, illness, suicide, faith unknown, pet; `hub.ts`; `funeral.ts`), plus `types.ts` and an `index.ts`. Like the life-event data, they import nothing through the `@/` alias, so build scripts can read them. They import the life-event `p()` helper and `BOOK_NUMBERS` from [types.ts](../../../src/data/life-events/types.ts) (a plain relative import of a file with no dependencies).

```ts
import type { LifeEventPassage } from "../life-events/types";

/** A sympathy passage is a life-event passage (so the shared helpers take it) with two optional labels.
 *  The life-event PassageRole is already "reading" | "card" | "blessing"; "blessing" is used only on the funeral readings page. */
export interface SympathyPassage extends LifeEventPassage {
  believer?: true;                         // "For a believer" (design 2.5, 4.1)
  later?: true;                            // "Often better a few weeks on" (design 4.1)
  servicePart?: "opening" | "old-testament" | "new-testament" | "graveside" | "blessing";  // funeral page only
}

export interface SympathySet {
  slug: string;                 // "loss-of-mother"; "" for the hub's own set
  heading: string;              // h1
  short: string;                // "A mother", for the hub list and links
  intro: string;                // 60–160 words; the search description
  explainer?: { title: string; text: string };
  helpStrip?: true;             // suicide page only (5.4)
  passages: SympathyPassage[];  // first card verse = default; must carry no label
  card: { heading: string; inside: string };
  topics: { slug: string; title: string }[];
  related: string[];
}
```

A small `card-keys.ts` holds the fixed book-name table that keys are built from, the committed list of passage keys (card verses and funeral readings) and the alias list (5.5). The "what to write" lines are a short typed list in `hub.ts`.

Verse text is not stored. The passage helpers of [passage.ts](../../../src/pages/life-events/passage.ts) (`assemblePassage`, `passageReference`, `readHref`) are typed for `LifeEventPassage`; a sympathy passage extends that type, so it is passed to them directly with no cast (its extra fields are ignored). They stay where they are: moving them to a shared folder would be a refactor of another feature's files, which the build rules ask the parallel chains to avoid, so this feature imports them from the life-event folder as they are. (Their error messages begin "life-events:"; that is harmless.) Not usable as they are: `passagesInOrder` (it takes a whole life event and puts readings first) and `pickerPassages` (it applies the life-event rule that a short blessing counts as a card verse); this feature's own picker applies its labels and the 320-character card limit itself.

### 7.2 Files

All new files in `src/pages/sympathy/` (hub, set page, readings page, recipient card page, card maker, message builder, sheet components, styles, ornaments, tests) and `src/data/sympathy/`. Reused without change: the life-event print module (print-sheet.ts, PrintPortal.tsx), passage helpers (passage.ts), QR code (qr.ts, QrCode.tsx), `p()` helper and `BOOK_NUMBERS`. Not reused, but copied in measurement only: the life-event sheet layout (6.3). Shared files touched by a line or two: [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), [public/_headers](../../../public/_headers), and, for the one "Explore more" link from the expecting pack (5.8), the life-event [types.ts](../../../src/data/life-events/types.ts) (one optional field), [PackPage.tsx](../../../src/pages/life-events/PackPage.tsx) (one rendered line) and [new-life.ts](../../../src/data/life-events/new-life.ts) (one entry). No new dependencies.

### 7.3 Writing the words

About 207 one-line notes (160 on the thirteen sets, 47 on the readings page), 25 context notes, 13 introductions plus one for the readings page, 4 explainers, card defaults and the "what to write" guide: written once, by hand, in the implementation step, directly into the data files, as the life-event step did with its 182 notes. That is ordinary authoring of a few files, not a batch of model calls, so it costs nothing and needs no batch tooling. No words are generated at runtime.

### 7.4 Tests (added in the implementation step, under `src/`, run with the site's `test` and `build`)

- **Data checks** (reading the real Berean files through `bsbWords`): every verse id exists and every range runs forward in one chapter; every excerpt is exact and sits on a single verse with the right "a"/"b" mark; every set has 9–16 passages with at least six card verses; every card verse is 320 characters or fewer after tidying; every assembled passage has paired double quotation marks and ends on ".", "!", "?" or "…"; **each set's first card verse carries neither label; the suicide and faith-unknown sets have no labelled card verse; no card verse anywhere is Romans 8:28, Job 1:21, Jeremiah 29:11, Isaiah 57:1–2 or 1 Corinthians 10:13**; the funeral page's passages each have a service part; slugs unique and URL-safe; every topic slug and title exists in the topics index; every hymn id exists in the hymn collection; every `related` slug is a real set; every intro 60–160 words.
- **Tone checks** on every string the site writes in the data: no "committed suicide", no "!" outside quoted Scripture, no "at least", no "angel" except in the "what to leave out" guide.
- **Passage keys:** every card verse and every funeral reading has a key; keys are unique; keys are computed from the data alone (the test runs without the catalogue); every key in the committed list still resolves (directly or through an alias).
- **Life-event link:** the expecting pack's page shows the "If you have lost a baby" link to `/sympathy/loss-of-baby`, and the existing life-event tests still pass.
- **Page tests** (Testing Library): the hub lists all twelve loss pages and the readings page; a set page shows heading, introduction, every reference, context notes and labels; verse text is inside `.scripture` with `lang="en"`; the suicide page shows the help strip built from the data and no other page does; an unknown set shows the site's not-found page.
- **Recipient page:** shows the verse for a known key in the given style; unknown key shows Psalm 34:18 with the gentle line, never the not-found page; unknown style falls back to plain; adds the `noindex` meta; shows no card maker and no help strip.
- **Message builder:** the message holds the typed words, the tidied verse, the reference with "(BSB)", and a link starting `https://bibleguide.io/sympathy/card/` whatever address the test page is at; no typed text appears in the link; Share is hidden when `navigator.share` is missing; Email and Text links carry the encoded body.
- **Card maker:** field limits; typed text never written into the address and drawn under `translate="no"`; the print paths add and keep the `@page` rule and marker as the life-event tests check; the folded card has no QR code unless the box is ticked; switching from the display print (which takes readings up to 700 characters) to the folded card or memorial cards falls back to the default card verse and says so.
- **Readings page:** ticking adds to "Our readings" in service order; reordering works; the list link holds only keys; ticking and reordering keep `?list=` in the page's own address without adding history entries; opening a list link restores the order and skips unknown keys with a note.
- **Print check in a browser** (Playwright, the e2e folder, run by hand in the implementation step): the folded card, memorial sheet and display print are each exactly one page on Letter and A4; the readers' sheet runs on, one reading per page when that option is on.
- **Sitemap inventory:** the address list the data index exports holds the fourteen indexable pages and no `/sympathy/card/` address.

### 7.5 Switching to the shared verse-card generator later

Chain C is building a shared generator of verse images for sharing (approved idea 4). It did not exist when this was written. When it does:

- The card maker hands the same **card description** (6.5) to the generator to offer **"Save as image"** in the "Send as a message" tab (for people who send pictures rather than links), using this feature's four styles or the generator's own, as that feature's review decides.
- The recipient card page asks the generator for its **link-preview image** (`og:image`), so a link pasted into a chat shows the verse itself.
- Printing stays here: the generator is for screens; this feature's sheets are for paper.

Until then the message carries the verse in its own text, so nothing is half-built.

## 8. Edge cases

| Case | What happens |
|---|---|
| A sender picks a verse about a believer's hope for a family who may not share it | The verse carries a visible "For a believer" label; it is never the default; the "what to write" guide says why |
| A verse of future joy chosen in the first days | Allowed; the card maker shows a muted hint "Often better a few weeks on", not a block |
| Someone looks for Romans 8:28 or "more than you can handle" | Neither is offered as a card verse; the guide explains gently, with the Scripture |
| Loss of a baby at any stage, including early miscarriage | Spoken of as the loss of a child; "baby", never clinical words; fathers named as grieving too |
| A parent asks where their baby is now | The explainer gives the hope many hold, its grounds, and says the confession does not rule |
| Death by suicide | Language "died by suicide"; no judgment and no statement on the person; the believer's security stated in the confession's terms; help strip read from the site's checked data; no strip on any other page or on the recipient card |
| The family does not know whether the person believed | Card verses speak only of God's nearness to the mourners; the explainer says what the site will and won't say; no verse implies either outcome |
| Pet loss | Honest explainer; no promise Scripture does not make; can be removed as one data entry |
| A recipient opens a card link | A quiet card page with no maker, no marketing and no crisis strip |
| A card link is mistyped, cut off, or its key retired | Psalm 34:18 with a gentle line, or the alias's replacement; never "page not found" |
| Card links found by search engines | `noindex` meta, `X-Robots-Tag` header line, not in the sitemap |
| Someone tries to put their own words on a bibleguide.io page through a link | Impossible: links carry only a verse key and a style from fixed lists |
| Share sheet not supported (most desktop browsers) | The Share button is hidden; Copy, Email and (on phones) Text remain |
| Share sheet cancelled | Nothing shown; not treated as an error |
| Clipboard blocked | The message appears selected in a box with "Press and hold to copy" |
| Very long personal message in a `mailto:` or `sms:` link | The 500-character limit keeps the encoded link far below the roughly 2,000-character limits mail and text apps tolerate |
| Typed markup or script in a field | Escaped by React; prints and sends as text |
| Names translated by the page translator | Typed text drawn under `translate="no"` |
| Site shown in another language | Pages and notes stay English and verses stay Berean in this build (verse text in `.scripture` with `lang="en"`); a translated version is later work through the site's translation system |
| Readings list link with unknown or duplicate keys | Unknown keys skipped with a one-line note; duplicates kept once |
| A long reading in the readers' sheet | Real page margin, flows over pages; "Start each reading on a new page" on by default |
| Printing problems (backgrounds, edges, scaling, fonts, phones, in-app browsers, dark mode, leaving mid-print) | Handled by the reused life-event print module exactly as its design's edge-case table describes |
| QR code on a condolence card | Off by default; a checkbox adds it |
| Verse text fails to load | Passages show "could not load" with Retry; Print and Send stay disabled with the reason shown; the recipient page shows its card with a Retry |
| A set added later | One data entry; tests check it; it reaches the hub and the sitemap by itself |
| Releasing | This feature never deploys; captures and IndexNow only after the owner releases |

## 9. Out of scope for this build

Images for sharing and link previews (waiting for the shared verse-card generator, 7.5); a full funeral program or order-of-service designer; words for the minister (no liturgy is invented, 2.5); online memorial or guestbook pages (they would need storage of visitors' words, a server part, moderation, and cost); reminders to send a card on the anniversary (would need accounts or stored contact details); envelope printing; translated pages; funeral bookmarks (a later print format, data and one sheet component); the "later" sets of section 3.

## Review

**Reviewed once,** in step 5 of sequence 33 (2026-11-07), against the approved spec (APPROVED-IDEAS.md entry 7), [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md), [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) and the real codebase as it stands after the life-event packs were built. Every correction below has already been made in the body above; this list says what changed and why.

**What was checked and found sound.** All card-verse lengths, computed from the site's Berean files, are within the 320-character card limit (the longest is Isaiah 40:29–31 at 300). Every Scripture wording the document quotes matches the Berean text, with one exception (below). Every excerpt sits on a single verse with the right "a"/"b" mark, which is what the life-event `p()` helper supports. All fourteen topic slugs and all five hymn ids exist; hymn pages live at `/study/hymns/<id>`. The five help-directory entries the suicide page reads (the 988 line, the emergency number, the helpline finder, GriefShare and the suicide-loss groups) exist in [life.json](../../../src/data/resources/life.json), and the 988 entry carries both call and text contacts. `SITE_ORIGIN` exists in [page-head.ts](../../../src/lib/page-head.ts), the official page address ignores the query string, the hub's search title is 45 characters, and the home page's Resources block has the life-event line to sit beside. Every set has 11–16 passages, at least six card verses, and a default card verse with no label. The passage and note counts (160 set passages, 47 readings, 25 context notes) add up. The doctrine is handled correctly: the confession's own words on the security of the believer and on life from conception are quoted accurately, and where it is silent (babies who die) the design shows the hope others hold without ruling.

**Corrections made (most important first):**

1. **The printed cards cannot reuse the life-event card sheet "unchanged".** Only the print plumbing is generic (print-sheet.ts, PrintPortal.tsx, the QR code, the passage helpers). The sheet layout, [CardSheet.tsx](../../../src/pages/life-events/CardSheet.tsx) with its stylesheet, draws a life-event card description with life-event ornaments and has no memorial-card layout. Sections 2.4, 6.3, 6.4 and 7.2 now say that this feature writes its own sheet component, copying the life-event measurements rather than importing or changing that file. *Why:* as written, the implementer would either have hit a wall or edited another feature's component.
2. **The link from the "expecting a baby" pack is three small edits, not one data entry.** A pack's `related` list accepts only other pack slugs, and PackPage.tsx silently drops anything else, so a plain data line would have shown nothing and no test would have noticed. Section 5.8 now specifies an optional `elsewhere` field on the life-event type, one rendered line, and the one entry, with a test; 7.2 lists all three files. *Why:* it is the only change to another feature's files, so it has to be stated exactly.
3. **Card keys are now computed from the data alone, never from the catalogue's book names,** and the permanent-key list now also covers funeral readings (5.5, 7.1, 7.4). *Why:* the recipient page has to find its verse before the catalogue loads, and a later rewording or translation of a book name must not break links sitting in people's messages. Funeral-list links sit in pastors' messages just as long as card links, so their keys must never break either.
4. **The funeral readings page now keeps the family's chosen list in its own address as they tick** (5.6, 7.4). *Why:* on a phone a dropped tab or a reload would otherwise lose a grieving family's selection. The address holds only reading keys, never names, and search engines still see one page.
5. **The passage type was simplified.** The life-event role type already includes "blessing", so a sympathy passage now just extends the life-event passage type instead of redefining its role (7.1). The design's open question is settled: the shared passage helpers stay in the life-event folder and are imported as they are, because moving them would be a refactor of another feature's files. The two helpers that do not fit are named.
6. **One Scripture quotation was wrong.** Isaiah 57:1 in the Berean reads "the righteous are guided from the presence of evil", not "taken away from evil" (4.1).
7. **Labels made consistent.** Romans 8:35–39 was labelled "For a believer" on the husband-or-wife page but not on the suicide page; it is now labelled on both, and rule 2.5.2 now says plainly that the no-label rule on the suicide and faith-unknown pages covers card verses only. John 11:35 on the friend page gained the context note the notes table already assigned to it.
8. **Two rules were reworded to match the plan they govern.** "Room to lament" (4.4, tone rule 4) said every set's readings include a lament, which the father, grandparent, after-illness and pet sets did not meet; it now counts any passage in the set, every set meets it, and it is checked by review rather than a test. The default-card-verse rule (2.5.2) said "only God's nearness", which the pet page's Psalm 145:9 did not meet; it now says "God's nearness and care, and nothing about where the one who died now is", which is the point of the rule.
9. **Two notes made gentler or more accurate.** Isaiah 54:5 ("your husband is your Maker") now carries a hint that another verse suits a man who has lost his wife. The Luke 23:42–43 note on the faith-unknown page could be read as hinting that the person turned to God at the end; it now says it is not a promise about anyone in particular, only a reason not to guess.
10. **Smaller accuracy fixes.** The text-message link is written by the message builder itself (`sms:?&body=…`), since the help directory's link helper needs a phone number (6.2). The readers' sheet calls the print module with a real page margin; there is no separate "multi-page mode" (6.4). The verse loader follows the life-event loader's pattern rather than the hooks first named (2.4). The dates were corrected from 2026-11-08 to 2026-11-07. The shared verse-card generator was confirmed still absent, and the implementer is told to check again before starting (2.4).

**Left as designed, deliberately:** the pet-loss page, plain text links with no visitor-written words on the recipient page, and no QR code on condolence cards by default. These are the three choices the design step offered the owner to change, and nothing in the review argues against them. The owner's spec for this feature is one line, so the scope (twelve loss pages, funeral readings, four sending methods) is the design step's reading of it; it stays within the build rules: no runtime cost, Berean text, under the long-list threshold, own route and one home-page line, never deployed.
