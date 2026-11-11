# "What the Bible says when you're..." — design

**Status:** research & design, written in job 758 (sequence 33 "Bible Guide chain D: life moments", step 10, 2026-11-07). Reviewed once in job 761 / sequence 33 step 11 on 2026-11-08 (see Review). Recovery job 22410a28dba8499eacc86948216518ae verified the installed review and its body corrections on 2026-11-09 and saved an identical job-folder copy. Feature implementation follows in sequence 33 step 13.
**Spec:** [APPROVED-IDEAS.md](../../../../APPROVED-IDEAS.md) entry 9 — "Pages for anxious, grieving, lonely, tempted, facing surgery and so on — matching what hurting people search for." This step's brief adds: build the topic list from real search phrasing; passages and short pastoral notes per topic, stored ahead of time; crisis resources where appropriate; SEO; links to the site's topics.
**Rules:** [FEATURE-BUILD-RULES.md](../../../../FEATURE-BUILD-RULES.md) · [AGENTS.md](../../../AGENTS.md) · [DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md) · [SEO.md](../../../../SEO.md)
**Siblings it builds on:** [life-event-packs/design.md](../life-event-packs/design.md) (passage helpers: the `p()` reference reader, passage assembly and tidying, reader links) and [sympathy/design.md](../sympathy/design.md) (tone rules, the help strip read from the help directory, passage keys, the message builder pattern). Both are built. The sympathy design handed this feature two jobs explicitly: the "when you're grieving" page, and **crisis-resource handling for a hurting person's own pages** (sympathy 2.6 and 5.4). Where this document says "as in sympathy", reuse the existing pattern subject to the safety and integration corrections below; the urgent-help failure behavior must not be copied unchanged.

## 1. What we are building, in one paragraph

A section of the site, **/when-youre**, for a person who is hurting right now and has typed what they feel into a search box: "bible verses for anxiety", "what does the bible say when you feel alone", "bible verses before surgery". There is a hub, **"What the Bible Says When You're…"**, with a "How are you feeling?" filter, and **33 topic pages** at launch, in three groups: what is happening *in your heart* (anxious, afraid, overwhelmed, depressed, discouraged, having thoughts of suicide, lonely, grieving, heartbroken, angry, guilty, feeling worthless, doubting, when God feels far away, exhausted, tempted, hurt by someone, can't sleep), *in your body* (facing surgery, sick or in pain, a serious diagnosis, caring for someone who is ill, facing death), and *in your life* (out of work, money worries, divorce, a struggling marriage, being hurt at home, infertility, worried about your child, addiction, a big decision, frightening times). Each page offers six to eight short **verses to hold on to**, one to three **passages to read slowly**, one psalm or prayer from Scripture to **pray in your own words**, one **person in the Bible who felt this way**, a short **pastoral note** written by hand, links to the site's **topics**, and **help from real people** where it is needed: two pages open with crisis help, four carry a calm help line, and other pages carry the quiet crisis line, with relevant support at the foot where specified. Every word is written once and stored; Scripture is the Berean Standard Bible; there are no runtime model calls or new paid services; the feature neither persists nor transmits its filter input (the browser, shared application and network can still retain visits; see 6.6).

## 2. Research

### 2.1 What hurting people search for

The list is a qualitative editorial selection, not a measured keyword-volume or search-ranking study. App search reports support broad demand; the phrase patterns and comparison pages below are research examples rather than a reproducible live ranking sample. No traffic or medical benefit is inferred from them:

1. **What Bible apps report people searching.** YouVersion's year-end releases name the searches that lead: in 2025 "love", "anxiety" and "peace" were among the most-searched terms worldwide, with "stress", "anxiety" and "hope" topping the UK, and Isaiah 41:10 ("So do not fear, for I am with you") the most-engaged verse for the fourth time in six years ([YouVersion 2025 release](https://www.prnewswire.com/news-releases/youversion-announces-2025-verse-of-the-year-as-bible-engagement-reaches-new-heights-globally-302632694.html)). YouVersion’s official release dated 6 October 2026 says "anxiety", "hope" and "healing" were among that year’s most-searched terms and "Psalm 91", the psalm of God's protection, was the single most-searched term ([YouVersion 2026](https://www.youversion.com/news/anxiety-hope-and-healing-youversion-reveals-what-the-world-is-searching-for-in-the-bible-this-year)). In 2024 the top verse was Philippians 4:6 ("Be anxious for nothing"), with Psalm 94:19 ("When anxiety overwhelms me…") close behind, and Logos reported Philippians 4:6 and Matthew 11:28 in its ten most-clicked verses ([Christianity Today, Dec 2024](https://www.christianitytoday.com/2024/12/top-bible-verses-anxiety-fear-psalms-philippians/)).
2. **The shape of the phrases people type,** seen in the titles of the pages that rank for them. Four patterns cover nearly all of it: **"bible verses for [noun]"** ("for anxiety", "for depression", "for surgery", "for a broken heart", "for job loss", "for infertility", "for addiction recovery", "for caregivers", "for sleep"); **"bible verses when you feel [adjective]"** ("alone", "overwhelmed", "like giving up", "far from God", "worthless"); **"what does the bible say about [noun]"** ("anxiety", "anger", "guilt", "doubt", "divorce", "abuse", "suicide"); and **"scripture for someone [situation]"** ("having surgery", "with cancer", "who is dying"). The page heading, the search title and the first sentence of each page are written to answer one of these exactly (section 3).
3. **The oldest "when you're…" list there is.** The front of every Gideon Bible has carried "Where to find help when…" for generations: afraid, anxious, bereaved, bitter, conscious of sin, defeated, depressed, disaster threatens, discouraged, doubting, facing a crisis, friends fail, leaving home, lonely, needing guidance, needing peace, sick or in pain, sorrowful, tempted, in trouble, weary, worried ([Gideons International UK helps](https://gideonsinternational.org.uk/helps/), [Gideons Ireland](https://gideons.ie/read%20the%20bible/where%20to%20find%20help%20-%20when%20anxious.html), [the classic list](https://biblesnet.com/scriptures/)). It is the same need the owner described, tested on millions of hotel-room readers, and every entry in it maps to a page below.
4. **The questions people ask beside the verses.** Pages ranking for the heavier searches answer questions like "is suicide a sin?", "does a Christian who dies by suicide go to heaven?", "what does the Bible say about self-harm?" ([examples](https://www.stayhere.live/stayhereguides/bible-verses-about-suicidal-thoughts), [Bible Hub on self-harm](https://biblehub.com/q/what_does_the_bible_say_on_self-harm.htm)). Search titles such as "I want to die: 21 Bible verses for when you feel like giving up" ([To Save A Life](https://tosavealife.com/mental-health/i-want-to-die-21-bible-verses-for-when-you-feel-like-giving-up/)) show that some people searching "giving up" are in danger. That is why the discouraged page carries a help line and not only the suicide page (section 6).

### 2.2 What they find today

The pages that rank ([Bible Study Tools](https://www.biblestudytools.com/topical-verses/worry-and-anxiety-bible-verses/), [Christianity.com](https://www.christianity.com/bible/bible-verses-for-depression-to-heal-your-soul-38), [Billy Graham](https://billygraham.org/articles/bible-verses-on-anxiety-fear), dozens of "35 powerful verses" blogs, and for surgery [biblereasons](https://biblereasons.com/surgery/) and its many copies) illustrate four editorial risks this feature aims to avoid (not a verified claim about every competitor or current ranking):

1. **Long, undifferentiated lists**, mostly King James, often 30 to 60 verses with no word on which to read first. A person in a panic needs one verse, not sixty.
2. **Verses torn from their setting.** Jeremiah 29:11 offered to someone grieving; Romans 8:28 to someone just diagnosed; Psalm 91 presented as a promise that nothing bad will happen; "God won't give you more than you can handle" credited to 1 Corinthians 10:13, which is about temptation. Hardly any page says what a verse meant to its first hearers.
3. **No help from people.** Most pages for depression or "giving up" show no crisis line at all, and the few that do bury it.
4. **Promises Scripture does not make.** Healing, a child, a job, a restored marriage, offered as if guaranteed to enough faith. This is the opposite of what the site teaches (2.5).

The verses that recur on nearly every page, and so the ones people will look for here, are all in the plan: Philippians 4:6–7, 1 Peter 5:7, Isaiah 41:10, Psalm 94:19, Matthew 6:34, Matthew 11:28–30, 2 Timothy 1:7, Isaiah 26:3, Psalm 34:18, Psalm 147:3, Psalm 42:11, Deuteronomy 31:8, Joshua 1:9, Psalm 23:4, Psalm 56:3, Psalm 46:1, Psalm 91, Psalm 4:8, 1 Corinthians 10:13 (on its real subject, temptation), Proverbs 3:5–6.

### 2.3 What suicide-prevention guidance asks of a page like this

Current guidance checked in this review: [988 on helping someone](https://988lifeline.org/help-someone-else/) and [AFSP on safe communication](https://afsp.org/how-to-talk-safely-about-suicide/). They support direct, nonjudgmental language, hope, connection and access to help without debating or moralising. The earlier [Action Alliance framework](https://suicidepreventionmessaging.org/988messaging/framework), [SAVE PDF](https://www.save.org/wp-content/uploads/2026/05/Safe-Messaging-Guidelines-.pdf) and [faith resource collection](https://theactionalliance.org/faith-hope-life/other-resources) remain research leads, not independently verified sources in this review. The three-part editorial shape below is not represented as a verified quotation from those leads.

- **Put help first and make it easy:** a number that can be tapped to call or text, open all hours, with a line for other countries.
- **Say three things:** the pain is real; you are not alone; there is hope and help.
- **Never:** describe methods or places; present suicide as a solution, a relief, a way to be reunited, or a common response to trouble; give a single simple cause; use "committed suicide" (it carries the old sense of a crime). Say "died by suicide" or "thoughts of suicide".
- **Avoid hopeless images** and sensational wording; keep the tone calm.

Two consequences for this design. Self-harm and suicide are related safety concerns but not interchangeable intentions; do not label a visitor from their search input. First, the suicide page does **not** argue "is suicide a sin?" or "would I go to heaven?": for a person at risk, any answer can be heard as permission or as condemnation. Those questions belong to the grieving family, and the sympathy page for a loss to suicide already answers them in the confession's terms; this feature links there only from the grieving page, for people who have lost someone (5.6). Second, the site's own topic page **/topics/suicide** lists the Bible's instances of suicide (Saul, Ahithophel, Judas) with references, and **/topics/desired-death** lists people who asked to die. Neither is linked from any page in this feature, and a test enforces it (9.4).

### 2.4 Domestic abuse: what safety guidance asks

The [National Domestic Violence Hotline’s internet-safety guidance](https://www.thehotline.org/plan-for-safety/internet-safety/) and [help page](https://www.thehotline.org/get-help/), checked 2026-11-08, support visible contact options and rapid exit, but explicitly warn that browsing can be monitored even in private/incognito mode. Quick exit does not erase history or make a device safe. Use a safer device if possible; a live advocate can help make a personal safety plan. Do not direct a reader to confront an abuser or leave on a prescribed schedule. Show US emergency help separately from advocacy and give other-country help equal clarity. The directory holds the Hotline, Childhelp, RAINN and emergency contacts. The theological note says that abuse is wrong and seeking safety is not faithlessness (1 Samuel 19:12; Acts 9:25); these narratives are pastoral support, not a universal escape plan.

### 2.5 Doctrine sets the boundaries

The site writes in agreement with the Baptist Faith and Message 2000 ([DOCTRINAL-FOUNDATION.md](../../../../DOCTRINAL-FOUNDATION.md)). For these pages that means:

1. **No promises Scripture does not make.** God can heal, provide work, give a child and restore a marriage, and he does not promise each of these to each person. Pages never say or imply "if you have enough faith". Paul's thorn stayed (2 Corinthians 12:7–9); he left Trophimus sick at Miletus (2 Timothy 4:20). The doctrinal foundation already rules prosperity teaching out.
2. **Suffering is not proof of sin, and feelings are not proof of unbelief.** Elijah asked to die and God fed him and let him sleep (1 Kings 19:4–8); the psalmists lament; Jesus wept, and prayed Psalm 22 on the cross. Depression, anxiety and doubt are met with care, never with blame.
3. **Doctors, medicine and counsellors are gifts, not a lack of faith.** Luke was "the beloved physician" (Colossians 4:14); Isaiah told Hezekiah's attendants to apply a poultice of figs while God answered his prayer (Isaiah 38:21); Paul told Timothy to take a little wine for his stomach (1 Timothy 5:23). The confession's call to care for the sick (article 15) fits this. Pages that touch mental or physical illness say so once, gently. These biblical examples do not establish clinical efficacy for prayer, Scripture, a treatment or a recovery group. Scripture supports spiritual care alongside appropriate professional care; the feature does not diagnose, prescribe, discourage treatment or promise symptom relief.
4. **The gospel plainly, never as pressure.** Salvation is by grace through personal faith in Christ (article 4). Pages where it belongs naturally (guilty, far from God, doubting, facing death) say it in a sentence and link the site's own study *The Good News* at `/study/the-good-news` (routed in [App.tsx](../../../src/App.tsx)). Crisis pages do not.
5. **Hope after death is labelled, as in sympathy.** On the facing-death page, passages about a believer's hope carry the small **"For a believer"** label (sympathy 2.5 rule 1), and the page also offers Romans 10:9–13 and John 3:16 for anyone not sure where they stand.
6. **Marriage and divorce.** The confession settles that marriage is one man and one woman for life (article 18) and does not rule on the grounds for divorce or remarriage (listed as an open question in the doctrinal foundation). The divorce page grieves with the reader and never rules on whether their divorce was justified; it points to their pastor for that. Malachi 2:16 ("I hate divorce", in older translations) is not used as a card verse anywhere: its subject is men who betray their wives, and quoted to a divorced person it lands as condemnation.
7. **Abuse.** The confession asks husbands to love their wives "as Christ loved the church" (article 18) and opposes violence against the vulnerable (article 15); abuse contradicts both. Separating for safety is not the same question as divorce, and the abuse page says so; on divorce itself it stays where the confession stays (point 6).
8. **Life is precious from conception to natural death** (article 15). The suicide page says it as comfort ("you were made by God and your life matters to him", Psalm 139:13–16), never as a rule. The infertility page does not rule on fertility treatments, on which the confession is silent.

### 2.6 What the site already has that we reuse

| Need | What exists | Where |
|---|---|---|
| Berean text of every verse | Per-book files, `{"chapter:verse": "text"}` | [data/plain/bsb/](../../../data/plain/bsb/) |
| Reading a short reference into verse ids, with exact "a"/"b" excerpts | `p("PSA 30:5b", role, note, { part, context })`, `BOOK_NUMBERS`, `LifeEventPassage` | [types.ts](../../../src/data/life-events/types.ts) |
| Assembling, tidying and referencing a passage; reader links; card length limits (240 full size, 320 card maximum, 700 display) | `assemblePassage`, `tidyPassageText`, `passageReference`, `readHref`, `CARD_FULL`, `CARD_MAX`, `DISPLAY_MAX` | [passage.ts](../../../src/pages/life-events/passage.ts) |
| Loading a page's passages (the pattern to copy) | `useSympathyPassages` / `showPassage`: `resolveRange` per passage with `"bsb"` passed explicitly | [useSympathyPassages.ts](../../../src/pages/sympathy/useSympathyPassages.ts), [verses.ts](../../../src/lib/verses.ts) |
| A permanent, catalogue-free key for a passage (`psalm-34-18`, `john-11-25b`) | `passageKey` | [card-keys.ts](../../../src/data/sympathy/card-keys.ts) |
| Crisis lines and help with per-entry checked dates (mostly 2026-10-08; do not assume one common date), with call/text/chat contacts | `988-lifeline`, `crisis-text-line`, `emergency-911`, `veterans-crisis-line`, `domestic-violence-hotline`, `childhelp-hotline`, `rainn-hotline`, `samhsa-helpline`, `211-united-way`, `find-a-helpline`, `griefshare`, `afsp-suicide-loss-groups`, `celebrate-recovery`, `findtreatment-gov`, `focus-on-the-family-counseling`, `acbc-find-a-counselor`, `feeding-america-locator`, `usda-national-hunger-hotline` | [life.json](../../../src/data/resources/life.json), loaded with `loadResource("life")` from [resources/index.ts](../../../src/data/resources/index.ts) |
| Turning a contact into a tap-to-call or tap-to-text link | `wayOf`, `dialable`, `smsHref` | [contact-links.ts](../../../src/pages/resources/contact-links.ts) |
| The calm help strip, reading numbers from the directory and dropping lines it cannot find (the model for this feature's help box) | `HelpStrip` | [HelpStrip.tsx](../../../src/pages/sympathy/HelpStrip.tsx) |
| Topic pages to link to (5,603 topics; `/topics/<slug>`) | Slugs confirmed for this plan, all with references: `care` (the site's "anxiety" topic, by alias), `fear-unholy`, `courage`, `peace`, `rest`, `despondency`, `hope`, `sorrow`, `mourning`, `bereavement`, `weeping`, `consolation-in-affliction`, `afflictions-and-adversities`, `affliction-forsaken-by-friends-in`, `friendship`, `presence-of-god`, `love-of-god`, `anger`, `conviction`, `confession-of-sin`, `forgiveness-of-sin`, `forgiveness`, `repentance`, `mercy`, `grace`, `assurance`, `doubting`, `faith`, `waiting-upon-god`, `temptation`, `lust`, `sickness`, `physician`, `suffering`, `trial-of-faith`, `patience`, `death-of-saints`, `resurrection`, `heaven`, `labor`, `industry`, `poverty`, `debt`, `contentment`, `divorce`, `marriage`, `widows`, `oppression`, `injustice`, `protection`, `refuge`, `barrenness`, `childlessness`, `parents`, `prayer-in-behalf-of-children`, `drunkenness`, `decision`, `trouble`, `persecution`, `holy-spirit-the-comforter`, `prayer`, `joy` | [data/topics/index.json](../../../data/topics/index.json) |
| People pages ("someone in the Bible who felt this way"; `/people/<id>`) | Ids confirmed: `gideon-jdg-6-11`, `martha-luk-10-38`, `elijah-1ki-17-1`, `jeremiah-2ch-35-25` (the prophet), `paul-act-7-58`, `naomi-rut-1-2`, `leah-gen-29-16`, `jonah-2ki-14-25`, `peter-mat-4-18`, `mephibosheth-2sa-4-4`, `thomas-mat-10-3`, `david-rut-4-17`, `moses-exo-2-10`, `joseph-gen-30-24`, `hezekiah-2ki-16-20`, `epaphroditus-php-2-25`, `job-job-1-1`, `ruth-rut-1-4`, `simeon-luk-2-25`, `hannah-1sa-1-2`, `jairus-mrk-5-22`, `nehemiah-neh-1-1`, `habakkuk-hab-1-1` | [data/study/people/](../../../data/study/people/) |
| Other site pages to link | `/sympathy` and its loss pages, `/life-events`, `/apologetics`, `/study/the-good-news`, `/resources/life` (Help for life), `/study/hymns/<id>` | [App.tsx](../../../src/App.tsx) |
| Page title, description, sitemap, crawler copies | `h1` and first `<p>` of 60+ characters; a page may set and clean up its own `document.title`; the preservation decision is in [usePageHead.ts](../../../src/components/usePageHead.ts), while `isUnnamed` is exported by page-head.ts. Urgent help must not supply the first long `<p>` used as the description (7.1); `ROUTE_TITLES` for the hub; one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts) fed by a paths function in the data index, as `sympathyPaths()` is | [page-head.ts](../../../src/lib/page-head.ts) |

Topic slugs **not** to use: `providence` and `love-of-parents-for-children` (no references), `strength` (one), `infirmity` (two); and never `suicide` or `desired-death` (2.3). There is no `loneliness`, `comfort` or `trust-in-god` topic.

**What does not exist yet:** Chain C's shared verse-card generator ([docs/features/verse-cards/design.md](../verse-cards/design.md)) was still absent on 2026-11-07 (checked: no such folder, and no generator code in `src/`). Section 8.3 says how this feature uses it once it exists; until then sharing is by text and link, which needs no image. The prayers-for-occasions feature (this chain's step 13) has not been designed yet; this feature links to it once it exists (5.6).

### 2.7 Neighbouring features: who covers what

| Need | Where it belongs | How the pages relate |
|---|---|---|
| Comforting someone else after a death; funeral readings; condolence cards | Sympathy (`/sympathy`, built) | The **grieving** page here is for the person grieving. It does not repeat the twelve sympathy loss pages; it opens doors to them ("If your mother has died", "If you have lost a baby", "If someone you love died by suicide"). Sympathy's recipient card page and its hub link back here (5.7), as the sympathy design planned |
| Weddings, babies, baptisms | Life-event packs (`/life-events`, built) | None needed. The infertility page does not link to the "expecting a baby" pack: a reader still waiting for a child should not be shown one |
| Written prayers before surgery, a job interview, a hard conversation | Prayers for occasions (step 13, not yet designed) | Each page here prays **Scripture itself** (a psalm or a prayer from the Bible), never a newly written prayer, so the two features do not overlap. Once occasion prayers exist, the facing-surgery, big-decision, out-of-work and struggling-marriage pages link to the matching prayer (5.6) |
| Doubts about whether Christianity is true | Apologetics (`/apologetics`, built) | The doubting page is pastoral; it links to apologetics for the questions of evidence |
| A full directory of help near you | Help for life (`/resources/life`, built) | This feature shows only the few entries a page needs, read from that page's data, and links there for the rest |

## 3. The topics

### 3.1 How the list was chosen

A topic earns a page at launch when it is (a) a phrase people really search in one of the four forms of 2.1, (b) a hurt or a hard situation rather than an occasion (occasions belong to prayers for occasions and the life-event packs), and (c) distinct enough from its neighbours to need its own passages and its own note. Close neighbours were merged where one page serves both searches honestly: "worried" into **anxious**; "discouraged" and "feel like giving up" into one page; "breakup" into **heartbroken**; "guilt" and "shame" together; "unloved", "rejected" and "worthless" together; "cancer" and "waiting for test results" into **a hard diagnosis**; self-harm searches receive a help-first entry on **thoughts of suicide**, without saying that self-harm necessarily means suicidal intent. That page explicitly welcomes someone who is self-harming without wanting to die and points to professional support; immediate injury or inability to stay safe needs local urgent/emergency care. No self-harm methods are listed. "Afraid", "anxious" and "overwhelmed" stay separate because people search them separately and Scripture speaks to them differently (fear of a threat, worry about tomorrow, too much to carry).

### 3.2 The 33 launch pages

The **Help** column says what crisis or support help the page carries (section 6): **Urgent** = a help box first, directly under the heading; **Line** = a calm one-line help strip under the introduction, and help at the foot; **Foot** = relevant help at the foot only; **—** = only the quiet line every page carries.

| Group | Address `/when-youre/…` | Heading: "What the Bible Says When…" | Search title (before " · Bible Guide") | Search phrases it answers | Help |
|---|---|---|---|---|---|
| Heart | `anxious` | You're Anxious | Bible Verses for Anxiety and Worry | bible verses for anxiety · what does the bible say about anxiety · verses for worry | Foot |
| Heart | `afraid` | You're Afraid | Bible Verses About Fear: When You're Afraid | bible verses about fear · when you are afraid · do not fear | — |
| Heart | `overwhelmed` | You Feel Overwhelmed | Bible Verses for Stress and Feeling Overwhelmed | bible verses for stress · when you feel overwhelmed | — |
| Heart | `depressed` | You're Depressed | Bible Verses for Depression and Sadness | bible verses for depression · when you feel sad · empty | Line |
| Heart | `discouraged` | You Feel Like Giving Up | Bible Verses for When You Feel Like Giving Up | bible verses for discouragement · when you feel like giving up · hopeless | Line |
| Heart | `thinking-of-suicide` | You're Having Thoughts of Suicide | Thoughts of Suicide: Help and Hope from the Bible | bible verses for suicidal thoughts · i want to die · self-harm | Urgent |
| Heart | `lonely` | You Feel Alone | Bible Verses for Loneliness: When You Feel Alone | bible verses for loneliness · when you feel alone · forgotten | Foot |
| Heart | `grieving` | You're Grieving | Bible Verses for Grief and Loss | bible verses for grief · comfort in grief · loss | Foot |
| Heart | `heartbroken` | Your Heart Is Broken | Bible Verses for a Broken Heart | bible verses for a broken heart · after a breakup | — |
| Heart | `angry` | You're Angry | Bible Verses About Anger: When You're Angry | bible verses about anger · what does the bible say about anger | — |
| Heart | `guilty` | You Feel Guilty or Ashamed | Bible Verses for Guilt and Shame | bible verses for guilt · shame · can God forgive me | — |
| Heart | `worthless` | You Feel Worthless | Bible Verses for When You Feel Worthless | bible verses for self-worth · when you feel worthless · unloved · rejected | Line |
| Heart | `doubting` | You're Doubting | Bible Verses for Doubt: When You Doubt God | bible verses for doubt · when you doubt God · struggling with faith | — |
| Heart | `far-from-god` | God Feels Far Away | Bible Verses for When God Feels Far Away | when God feels distant · far from God · spiritual dryness | — |
| Heart | `exhausted` | You're Exhausted | Bible Verses for When You're Tired and Weary | bible verses for when you're tired · weary · burnout | — |
| Heart | `tempted` | You're Tempted | Bible Verses About Temptation: When You're Tempted | bible verses about temptation · lust · resisting temptation | — |
| Heart | `hurt-by-someone` | Someone Has Hurt You | Bible Verses for When Someone Hurts You | when someone hurts you · betrayal · struggling to forgive | — |
| Heart | `cant-sleep` | You Can't Sleep | Bible Verses for Sleep: When You Can't Sleep | bible verses for sleep · to fall asleep · insomnia | — |
| Body | `facing-surgery` | You're Facing Surgery | Bible Verses Before Surgery | bible verses for surgery · before surgery · for someone having surgery | — |
| Body | `sick` | You're Sick or in Pain | Bible Verses for Sickness and Chronic Pain | bible verses for healing · when you're sick · chronic illness · chronic pain | — |
| Body | `serious-diagnosis` | You've Had a Hard Diagnosis | Bible Verses for a Hard Diagnosis or Cancer | bible verses for cancer patients · bad news from the doctor · waiting for results | — |
| Body | `caregiving` | You're Caring for Someone Who Is Ill | Bible Verses for Caregivers | bible verses for caregivers · caring for aging parents | Foot |
| Body | `dying` | You or Someone You Love Is Dying | Bible Verses for the Dying and Their Families | bible verses for the dying · facing death · terminal illness | — |
| Life | `out-of-work` | You're Out of Work | Bible Verses for Job Loss and Unemployment | bible verses for job loss · unemployed · looking for work | Foot |
| Life | `money-worries` | You're Worried About Money | Bible Verses for Financial Hardship and Debt | bible verses for financial hardship · debt · money worries | Foot |
| Life | `divorce` | You're Going Through a Divorce | Bible Verses for Divorce | bible verses for divorce · healing after divorce | Foot |
| Life | `struggling-marriage` | Your Marriage Is Struggling | Bible Verses for a Struggling Marriage | bible verses for a struggling marriage · marriage problems | Foot |
| Life | `abused` | Someone at Home Is Hurting You | Bible Verses About Abuse, and Where to Get Help | what does the bible say about abuse · abusive marriage · domestic violence | Urgent |
| Life | `infertility` | You're Struggling with Infertility | Bible Verses for Infertility | bible verses for infertility · trying to conceive · waiting for a baby | — |
| Life | `worried-about-child` | You're Worried About Your Child | Bible Verses for a Wayward or Struggling Child | prodigal child · child who left the faith · praying for my child | Foot |
| Life | `addiction` | You're Struggling with Addiction | Bible Verses for Addiction and Recovery | bible verses for addiction · recovery · alcohol | Line |
| Life | `big-decision` | You're Facing a Big Decision | Bible Verses for Guidance and Decisions | bible verses for guidance · decision making · direction | — |
| Life | `troubled-times` | The World Feels Frightening | Bible Verses for Troubled Times | bible verses for troubled times · psalm 91 · fear of the future | — |

Search titles are at most 50 characters, so with " · Bible Guide" (14) the longest is 64; the few over 60 still lead with their key words, which is the part a cut-off title keeps. The search phrases are there for the writer and reviewer; they are **never** shown on the page or hidden in it (no keyword lists, 7.4).

### 3.3 Added later, as data only

Ready to add as one data entry each, with no code change, when the owner wants them: facing exams; getting older; retirement; an empty nest; leaving home or moving; starting over; waiting (on God, on news); single when you don't want to be; jealous; insecure; bullied (with Childhelp for children); persecuted for your faith; a military deployment (with the Veterans Crisis Line); after a natural disaster; a new parent who is overwhelmed. Two sensitive topics are **left for the owner to decide** rather than added: an unplanned pregnancy, and life after an abortion. The help directory already holds checked entries for both (its "pregnancy help" and "after an abortion" groups), so each would be one data entry if approved.

## 4. Passage plan

### 4.1 How passages are chosen

The rules of the life-event packs (their 4.1) apply unchanged: verse ids only, never typed text; Berean Standard Bible only; exact excerpts for "a"/"b" verses, checked by a test; the same tidying of quotation marks and cut sentences; one written line per passage. On top of those:

1. **Three roles.** **Hold** (a short verse to hold on to, copy or send: 320 characters or fewer after tidying, the site's card limit); **Read** (a longer passage to read slowly, no limit); **Pray** (one passage per page that is itself a prayer, 700 characters or fewer, shown with the line "Pray these words, or put them in your own"). In the data these are the life-event roles `card`, `reading` and `blessing` respectively, so the shared helpers take them unchanged, with the page giving them their own names.
2. **Counts.** Each page has 6–8 Hold verses, 1–3 Read passages and exactly one Pray passage. The first Hold verse is the page's **featured verse** (shown first and used for sharing and, later, the link-preview image); it may not carry the "For a believer" label.
3. **One person, optionally.** A page may name one person in the Bible who felt this way, by people id, with one or two sentences. Twenty-seven pages do (six explicitly have no person).
4. **Every page makes room to lament.** Pain is acknowledged in every introduction or pastoral note. Where a lament fits, include it without forcing every set into that literary category: caregiving, temptation, marriage and decisions also need prayer, wisdom and action. Do not claim every planned set includes a lament. Checked by editorial review, not a keyword test.
5. **Pages stay distinct.** No two pages share more than three Hold or Read passages (tested), so each page answers its own search with its own Scripture; Psalm 34:18, the verse every source puts first for the brokenhearted, is the most shared, on several pages.
6. **Kept off Hold everywhere, with the reason given where it matters:** Romans 8:28 and Jeremiah 29:11 (true, but quoted in fresh pain they rush a person to a reason; Jeremiah 29:11 was spoken to exiles facing seventy years away from home); Malachi 2:16 (2.5 rule 6); Proverbs 22:6 (a proverb, not a promise; it appears once, as a Read passage with its context note, on the worried-about-child page). **1 Corinthians 10:13** appears only on the tempted and addiction pages, because its subject is temptation; on no page is it offered as "God won't give you more than you can handle".

### 4.2 The passages

The original design checked references on 2026-11-07; the review rechecked the corrected reference plan against current Berean files on 2026-11-08: all exist, none crosses a verse the Berean omits, every Hold verse is within 320 characters (lengths in brackets where over 200), and every Pray passage is within 700. **ctx** marks a passage that carries a context note (4.3); **(b)** marks the "For a believer" label. The review may swap a passage for a better one, keeping the counts and rules.

**anxious** — Hold: Philippians 4:6–7 [227] (ctx); 1 Peter 5:7; Isaiah 41:10; Psalm 94:19; Matthew 6:34 (ctx); John 14:27; Isaiah 26:3; Psalm 55:22. Read: Matthew 6:25–34 (ctx). Pray: Psalm 139:23–24.

**afraid** — Hold: Isaiah 41:10; Psalm 56:3–4; Joshua 1:9; Psalm 27:1; 2 Timothy 1:7; Deuteronomy 31:8; Psalm 34:4; Isaiah 43:1. Read: Psalm 27:1–14; Mark 4:35–41. Pray: Psalm 61:1–3. Person: Gideon, hiding in a winepress when the angel called him "mighty man of valor" (Judges 6:11–16).

**overwhelmed** — Hold: Matthew 11:28–30 [235]; Psalm 61:2; Isaiah 40:29; Exodus 14:14; 2 Corinthians 12:9 (ctx); Psalm 46:10 (ctx); Psalm 62:1–2. Read: Luke 10:38–42 (ctx); Psalm 61:1–8. Pray: Psalm 142:1–3. Person: Martha, "worried and upset about many things" (Luke 10:41).

**depressed** — Hold: Psalm 42:11 (ctx); Psalm 34:18; Psalm 40:1–2; Psalm 147:3; Lamentations 3:22–23; Isaiah 42:3 (ctx); Psalm 3:3; Deuteronomy 31:8. Read: 1 Kings 19:3–8 (ctx); Psalm 42:1–11. Pray: Psalm 13:1–6 [492] (ctx). Person: Elijah, who lay down under a broom tree and asked to die, and was given sleep, food and a gentle word (1 Kings 19).

**discouraged** — Hold: Galatians 6:9 (ctx); 2 Corinthians 4:8–9; Isaiah 40:31; Philippians 1:6; Psalm 27:13–14; 2 Chronicles 15:7 (ctx); Psalm 73:26. Read: 2 Corinthians 4:7–18; Hebrews 12:1–3. Pray: Psalm 143:7–8 [265]. Person: Jeremiah, who wanted to stop speaking and could not, "fire shut up in my bones" (Jeremiah 20:9).

**thinking-of-suicide** — Hold: Psalm 34:18; Psalm 139:12; Psalm 121:1–2; Matthew 11:28; Psalm 62:8; Lamentations 3:22–23; Psalm 138:3; Isaiah 43:2 [212]. Read: 1 Kings 19:3–8 (ctx); Psalm 139:7–12; Psalm 139:13–16. Pray: Psalm 61:1–2. Person: Elijah (as on the depressed page, told here only as "he was so exhausted and alone that he asked God to take his life, and God answered with rest, food and company"; no other detail).

**lonely** — Hold: Deuteronomy 31:8; Psalm 68:6a "God settles the lonely in families" (ctx); Psalm 25:16; Hebrews 13:5b "Never will I leave you, never will I forsake you."; Psalm 27:10; Matthew 28:20b "And surely I am with you always, even to the end of the age." (ctx); Psalm 139:9–10; John 14:18. Read: Psalm 139:1–12; 2 Timothy 4:16–18 (ctx). Pray: Psalm 25:16–18. Person: Paul, deserted at his trial ("everyone deserted me… But the Lord stood by me", 2 Timothy 4:16–17).

**grieving** — Hold: Psalm 34:18; Matthew 5:4; Psalm 147:3; John 11:35 (ctx); Psalm 56:8; 2 Corinthians 1:3–4 [243]; Psalm 73:26; Revelation 21:4 (ctx). Read: John 11:32–36; Lamentations 3:19–26. Pray: Psalm 31:9–10. Person: Naomi, who asked to be called Mara, "bitter", after her husband and sons died (Ruth 1:20–21). Plus the doors to the sympathy loss pages (5.3).

**heartbroken** — Hold: Psalm 147:3; Psalm 34:18; Psalm 73:26; Isaiah 61:1 [213] (ctx); Psalm 30:5b "Weeping may stay the night, but joy comes in the morning." (ctx); Isaiah 54:10; Psalm 55:22. Read: Psalm 31:9–16; Isaiah 61:1–3 (ctx). Pray: Psalm 4:1. Person: Leah, unloved by her husband, who named her fourth son "This time I will praise the LORD" (Genesis 29:31–35).

**angry** — Hold: James 1:19–20; Ephesians 4:26–27 (ctx); Proverbs 15:1; Psalm 4:4; Proverbs 29:11; Psalm 37:8; Ephesians 4:31–32. Read: Psalm 37:1–11; Jonah 4:1–11 (ctx). Pray: Psalm 19:14. Person: Jonah, angry enough to want to die, met by God with a question (Jonah 4).

**guilty** — Hold: 1 John 1:9 (ctx); Psalm 103:12; Romans 8:1 (ctx); Isaiah 1:18 (ctx); Psalm 32:5; Psalm 34:5. Read: Psalm 51:1–12; Luke 15:11–24 (ctx); John 21:15–17 (ctx). Pray: Psalm 51:10–12. Person: Peter, who denied Jesus three times and was asked three times, "Do you love Me?" (John 21).

**worthless** — Hold: Psalm 139:14; Isaiah 49:15–16 [217] (ctx); Zephaniah 3:17; Ephesians 2:10; 1 John 3:1; Romans 5:8; Jeremiah 31:3; Luke 12:6–7. Read: Psalm 139:13–18; Romans 8:35–39. Pray: Psalm 17:8. Person: Mephibosheth, who called himself "a dead dog" and was given a place at the king's table for life (2 Samuel 9).

**doubting** — Hold: Mark 9:24; Jude 1:22 (ctx); John 20:29; Hebrews 11:1; Isaiah 55:8–9; Psalm 77:11–12; Matthew 14:30–31 [223] (ctx). Read: John 20:24–29; Psalm 73:16–26; 1 Corinthians 15:3–8 (ctx). Pray: Mark 9:24. Person: Thomas, who said he would not believe without seeing, and was not turned away (John 20).

**far-from-god** — Hold: Psalm 145:18; James 4:8 (ctx); Jeremiah 29:13 (ctx); Deuteronomy 31:6; Acts 17:27; Psalm 139:7–8; Romans 8:38–39 [278]. Read: Psalm 13:1–6; Psalm 22:1–5 (ctx). Pray: Psalm 63:1. Person: David, writing Psalm 63 "in the wilderness of Judah", thirsty for God.

**exhausted** — Hold: Matthew 11:28–30 [235]; Isaiah 40:29–31 [300]; Psalm 23:1–3; Mark 6:31 (ctx); Psalm 127:2 (ctx); Exodus 33:14; Psalm 4:8. Read: Isaiah 40:27–31; Exodus 18:17–23 (ctx). Pray: Psalm 25:4–5. Person: Moses, judging the people alone from morning to evening until Jethro said, "You cannot handle it alone" (Exodus 18).

**tempted** — Hold: 1 Corinthians 10:13 (ctx); Hebrews 4:15–16 (ctx); James 1:12; James 4:7; Matthew 26:41; Psalm 119:11; 2 Peter 2:9; Galatians 5:16. Read: Matthew 4:1–11; Genesis 39:7–12 (ctx); 1 Corinthians 6:18–20. Pray: Matthew 6:13 (ctx). Person: Joseph, who ran from Potiphar's wife and left his cloak behind (Genesis 39).

**hurt-by-someone** — Hold: Psalm 147:3; Ephesians 4:31–32; Colossians 3:13; Romans 12:19 (ctx); Psalm 55:12–14 [270]; Matthew 5:44 (ctx); Romans 12:17–18. Read: Genesis 50:15–21 (ctx); Luke 6:27–36. Pray: Psalm 55:16–17. Person: Joseph, sold by his brothers, who forgave them many years later (Genesis 50).

**cant-sleep** — Hold: Psalm 4:8; Psalm 3:5 (ctx); Proverbs 3:24; Psalm 127:2 (ctx); Psalm 121:3–4; Psalm 63:6; Isaiah 26:3. Read: Psalm 121:1–8; Psalm 91:1–6 (ctx). Pray: Psalm 4:8. Person: David, who wrote "I lie down and sleep" while fleeing his son Absalom (Psalm 3).

**facing-surgery** — Hold: Isaiah 41:10; Psalm 56:3; Philippians 4:6–7 [227] (ctx); Psalm 23:4; Deuteronomy 31:8; Psalm 31:14–15a "But I trust in You, O LORD; I say, 'You are my God.' My times are in Your hands"; Isaiah 26:3; Psalm 46:1. Read: Psalm 121:1–8; Isaiah 38:1–5 (ctx). Pray: Psalm 31:14–15a. Person: Hezekiah, who prayed when he was ill, and whose cure came with a poultice of figs (Isaiah 38). A line under the Hold verses marks Psalm 46:1 and Philippians 4:6–7 "for the family in the waiting room".

**sick** — Hold: 2 Corinthians 12:9 (ctx); Psalm 73:26; Jeremiah 17:14 (ctx); Psalm 121:1–2; 2 Corinthians 4:16; Romans 8:18; Psalm 6:2; Isaiah 40:29. Read: 2 Corinthians 12:7–10 (ctx); James 5:13–16 (ctx). Pray: Psalm 6:2–4. Person: Epaphroditus, who "was ill, nearly to the point of death" (Philippians 2:27).

**serious-diagnosis** — Hold: Psalm 46:1; Isaiah 43:2 [212]; Joshua 1:9; Psalm 112:7 (ctx); Isaiah 41:10; Lamentations 3:22–23; Psalm 31:14–15a. Read: Psalm 46:1–11; 2 Corinthians 4:16–18. Pray: Psalm 86:6–7. Person: Job, who lost his health and said so honestly, and to whom God came (Job 1–2, 38–42).

**caregiving** — Hold: Galatians 6:2; Galatians 6:9 (ctx); Matthew 11:28; Psalm 55:22; Isaiah 46:4; Matthew 25:40 (ctx); Colossians 3:23–24. Read: Ruth 1:15–18; Isaiah 40:28–31. Pray: Psalm 90:17. Person: Ruth, who would not leave Naomi (Ruth 1:16).

**dying** — Hold: Psalm 23:4; John 11:25–26 (b); Romans 14:8 (b); Psalm 73:26; 2 Corinthians 5:1 (b); Philippians 1:21 (b); John 3:16; Revelation 21:4 (b). Read: John 14:1–6 (b); 1 Corinthians 15:51–57 (b); Romans 10:9–13 (ctx). Pray: Psalm 31:5 (ctx). Person: Simeon, who held the infant Jesus and said, "Now dismiss Your servant in peace" (Luke 2:29). Psalm 23:4 leads as an invitation to trust the Shepherd, not a claim that every reader already belongs to him; explain its faith setting without pressuring a dying reader. Revelation 21:4 also carries the believer’s-hope label here.

**out-of-work** — Hold: Matthew 6:31–33 [304] (ctx); Philippians 4:19 (ctx); Psalm 23:1; Proverbs 16:3 (ctx); Psalm 37:5; Lamentations 3:22–23; Colossians 3:23–24. Read: Psalm 37:1–7; Ruth 2:1–12 (ctx). Pray: Psalm 90:17. No person.

**money-worries** — Hold: Philippians 4:19 (ctx); Matthew 6:33; Hebrews 13:5; Psalm 34:10; Proverbs 3:5–6; 1 Timothy 6:6–8; 2 Corinthians 9:8. Read: Luke 12:22–31; 1 Kings 17:8–16 (ctx). Pray: Proverbs 30:8–9. No person.

**divorce** — Hold: Psalm 34:18; Isaiah 54:10 (ctx); Romans 8:26; Psalm 55:22; Psalm 62:8; Lamentations 3:22–23; Psalm 46:1. Read: Isaiah 54:4–8 (ctx); Psalm 55:12–22. Pray: Psalm 86:16–17. No person.

**struggling-marriage** — Hold: Ecclesiastes 4:12 (ctx); Ephesians 4:2–3; Colossians 3:13–14; 1 Peter 4:8; Ephesians 4:32; Romans 12:10; Proverbs 15:1. Read: 1 Corinthians 13:4–8 (ctx); Colossians 3:12–15. Pray: Psalm 143:10. No person.

**abused** — Hold: Psalm 9:9; Psalm 34:18; Psalm 10:17–18 [206] (ctx); Psalm 12:5; Psalm 82:3–4 (ctx); Psalm 72:14; Colossians 3:19 (ctx). Read: 1 Samuel 19:9–12 (ctx); Acts 9:23–25 (ctx); Psalm 55:20–22 (ctx). Pray: Psalm 31:1–2. Person: David, who escaped Saul's spear and fled at night (1 Samuel 19).

**infertility** — Hold: Psalm 34:18; Psalm 62:8; Psalm 56:8; Romans 12:12; Psalm 27:13–14; Lamentations 3:25; Psalm 73:26. Read: 1 Samuel 1:9–18 (ctx); Genesis 30:1–2 (ctx). Pray: Psalm 13:1–2. Person: Hannah, who "poured out her soul before the LORD" (1 Samuel 1:15); see the context note.

**worried-about-child** — Hold: Lamentations 2:19 [239] (ctx); Luke 15:20 (ctx); 2 Peter 3:9; Psalm 103:17; Isaiah 40:11; Philippians 1:6. Read: Luke 15:11–24 (ctx); Mark 9:17–24; Proverbs 22:6 (ctx). Pray: Lamentations 2:19. Person: Jairus, who came to Jesus for his dying daughter (Mark 5:22–43).

**addiction** — Hold: 1 Corinthians 10:13 (ctx); 2 Corinthians 5:17; Galatians 5:1; John 8:36; Psalm 40:1–3 [303]; 1 John 1:9 (ctx); James 5:16 (ctx). Read: Romans 7:15–25 (ctx); Psalm 40:1–5. Pray: Psalm 51:10. Person: Paul describes the struggle with sin (Romans 7:19); do not imply that he had an addiction.

**big-decision** — Hold: Proverbs 3:5–6 (ctx); James 1:5; Psalm 32:8; Isaiah 30:21 (ctx); Proverbs 16:9; Psalm 119:105; Proverbs 15:22. Read: Psalm 25:4–10; Nehemiah 2:1–5 (ctx). Pray: Psalm 143:8. Person: Nehemiah, who prayed in the moment before answering the king, then gave a plan (Nehemiah 2:4–5).

**troubled-times** — Hold: Psalm 46:1–2; John 16:33; Psalm 91:1–2 (ctx); Isaiah 26:3; Psalm 112:7 (ctx); Psalm 27:1; 2 Timothy 1:7. Read: Psalm 91:1–16 (ctx); Psalm 46:1–11; Habakkuk 3:17–19. Pray: Psalm 86:11. Person: Habakkuk, who asked God "how long?" and ended "yet I will exult in the LORD" (Habakkuk 1:2, 3:18).

In all: 33 pages, 346 planned passage placements (240 Hold, 73 Read, 33 Pray), 274 distinct reference/partial keys. Full-verse lengths and existence pass review checks; exact partial assembly and tidy lengths must also pass implementation tests. Four pages intentionally repeat a passage across roles, handled by the anchor rule in 5.1.

**Exact partial contract:** `p()` takes the excerpt of only the last verse in `extras.part`, not the whole displayed range. For Psalm 31:14–15a use the exact opening of verse 15, `My times are in Your hands;`; verse 14 is loaded in full. Hebrews 13:5b must retain the exact closing substring including its curly closing quote; Matthew 28:20b likewise. Displayed plan quotations above are reading aids, not string literals: take those raw excerpts from current BSB text and check `partLetter` before `tidyPassageText`. The original simplified punctuation is not an acceptable raw excerpt.

### 4.3 Context notes

One or two plain sentences, muted, under the passage; never a scolding. The wording here is the plan; the implementation step writes the final lines and checks each against the Berean text and the doctrinal foundation.

| Passage | Page(s) | What the note says |
|---|---|---|
| Philippians 4:6–7 | anxious, facing surgery | Paul wrote this from prison. It is an invitation to bring every worry to God, not a rebuke for feeling anxious. |
| Matthew 6:34, 6:25–34 | anxious | Jesus is not scolding worriers; he points them to a Father who feeds the birds, and to one day at a time. |
| Matthew 6:31–33 | out of work | Not a promise of wealth: your Father knows what you need, and his kingdom comes first. |
| 2 Corinthians 12:9, 12:7–10 | overwhelmed, sick | Paul asked three times for his "thorn" to be taken away. God's answer was grace to carry it, not its removal. |
| Psalm 46:10 | overwhelmed, troubled times | "Be still" is first God telling warring nations to stop and know that he is God. It calls us to trust his rule, which is also why we can rest. |
| Luke 10:38–42 | overwhelmed | Jesus speaks to Martha gently, by name, twice. He is not despising her work; he is inviting her to sit down. |
| Psalm 42:11 | depressed | The psalmist talks to his own soul. Asking "why are you downcast?" is not pretending; it is honesty and hope side by side. |
| Isaiah 42:3 | depressed | Said of God's Servant, the Messiah: he does not break what is bruised or snuff out what is barely burning. |
| 1 Kings 19:3–8 | depressed, thoughts of suicide | Elijah asked God to take his life. God did not rebuke him: he let him sleep, gave him food twice, and later spoke in a quiet whisper. |
| Psalm 13 | depressed (pray), far from God | "How long?" four times. Lament is a way of praying, and this one ends in trust without pretending the pain has gone. |
| Galatians 6:9 | discouraged, caregiving | Written about doing good to others: the harvest comes "in due time", which is not always soon. |
| 2 Chronicles 15:7 | discouraged | Spoken by a prophet to King Asa as he began to restore true worship; it encourages anyone doing hard, right work. |
| Psalm 138:3 | thoughts of suicide | A psalmist gives thanks for God’s answer. This is testimony to draw encouragement from, not a prediction of survival or a substitute for urgent help. |
| Psalm 68:6a | lonely | God places the lonely in families, and one of the ways he does it is through his people, the church. |
| Matthew 28:20b | lonely | Jesus' promise as he sent his disciples out, which the church has always heard as made to everyone who follows him. |
| 2 Timothy 4:16–18 | lonely | Paul's last letter, written in prison: everyone deserted him, and the Lord stood with him. |
| John 11:35 | grieving | Jesus wept at his friend's tomb, though he knew he was about to raise him. Grief is not a failure of faith. |
| Revelation 21:4 | grieving | A promise about the end of all things. It does not ask you to stop grieving now; in the first days it may help most simply to know it is there. |
| Isaiah 61:1, 61:1–3 | heartbroken | Jesus read these words in Nazareth and said they were fulfilled in him (Luke 4:16–21): binding up the brokenhearted is his work. |
| Psalm 30:5b | heartbroken | It puts no deadline on sorrow; "the night" can be long. It promises that the night is not the end. |
| Ephesians 4:26–27 | angry | Anger is not always sin; Jesus was angry at hard hearts (Mark 3:5). The warning is about what anger does if we keep it. |
| Jonah 4:1–11 | angry | God answers Jonah's fury with questions and a plant, and the book ends on God's question, not Jonah's answer. |
| 1 John 1:9 | guilty, addiction | Written to believers: confessing again is not failing at faith; it is how faith lives. |
| Romans 8:1 | guilty | "For those who are in Christ Jesus." If you are not sure that includes you, the page's note and *The Good News* say how it can. |
| Isaiah 1:18 | guilty | God's invitation to a nation that had turned away. "Come, let us reason together": he opens the door himself. |
| Luke 15:11–24 | guilty, worried about your child | The father sees his son "while he was still in the distance" and runs. Read for guilt, you are the son; read as a parent, it shows God's own heart. |
| John 21:15–17 | guilty | Peter denied Jesus three times; Jesus asked three times, "Do you love Me?", and gave him work to do. |
| Isaiah 49:15–16 | worthless | Spoken to Jerusalem when she said "the Lord has forgotten me". A mother may forget; God says he will not. |
| Jude 1:22 | doubting | An instruction to the church: those who doubt are to be met with mercy, not pushed out. |
| Matthew 14:30–31 | doubting | Jesus' hand reached Peter before his question did. "Why did you doubt?" comes from someone already holding on to him. |
| 1 Corinthians 15:3–8 | doubting | The earliest written summary of the gospel, naming witnesses of the risen Christ, many still alive when Paul wrote. For more, the site's apologetics pages. |
| James 4:8 | far from God | Written to believers who had drifted. God is not waiting to be appeased; he comes near. |
| Jeremiah 29:13 | far from God | From the same letter to exiles as the much-quoted 29:11: God would be found by people far from home. |
| Psalm 22:1–5 | far from God | Jesus prayed this psalm's first line on the cross (Matthew 27:46). Feeling forsaken is something he has felt. |
| Mark 6:31 | exhausted | Jesus himself told his tired disciples to come away and rest. |
| Psalm 127:2 | exhausted, can't sleep | Not a rebuke of hard work: sleep is something God gives, not something you have to earn. |
| Exodus 18:17–23 | exhausted | "You cannot handle it alone." Moses' father-in-law tells him to share the load, and that is good counsel still. |
| 1 Corinthians 10:13 | tempted, addiction | About temptation: there is always a way out, and others have faced the same. It does not say God never lets hardship exceed our strength (Paul says the opposite in 2 Corinthians 1:8). |
| Hebrews 4:15–16 | tempted | Jesus was tempted in every way and did not sin, so he understands and helps rather than recoils. |
| Genesis 39:7–12 | tempted | Joseph did not argue with the temptation; he ran. |
| Matthew 6:13 | tempted | From the prayer Jesus taught his disciples. |
| Romans 12:19 | hurt by someone | Leaving revenge to God is not pretending the wrong did not matter; it trusts the wrong to the one Judge who will deal with it rightly. |
| Matthew 5:44 | hurt by someone | Loving and praying for someone who hurt you does not mean staying close to them or trusting them again. If you are in danger, see the page for being hurt at home. |
| Genesis 50:15–21 | hurt by someone | "You meant evil against me, but God meant it for good" was Joseph's own testimony, many years on. It is not something to say to someone whose wound is fresh. |
| Psalm 3:5 | can't sleep | Written as David fled from his own son Absalom. The psalm places sleep and trust amid danger; it gives no date or claim that this was his worst week. |
| Psalm 91 (1–2, 1–6, 1–16) | can't sleep, troubled times | A psalm of trust in God's protection, and 2026's most-searched Bible term. It is not a promise that nothing hard will touch a believer: the devil quoted it to Jesus, and Jesus refused to use it that way (Matthew 4:6–7). Its promise is God's presence and final keeping. |
| Psalm 31:14–15a | facing surgery | "My times are in Your hands": the hours ahead, and the people caring for you, are held by God. |
| Isaiah 38:1–5 | facing surgery | God answered Hezekiah's prayer, and Isaiah also told them to apply a poultice of figs (38:21). Prayer and medicine are not rivals. This was Hezekiah's answer; it is not a promise of the same outcome for everyone. |
| Jeremiah 17:14 | sick | Jeremiah's prayer for healing of body and soul. You can ask God to heal you; asking is never a lack of faith. |
| James 5:13–16 | sick | James tells the sick to ask the elders of the church to pray over them. Baptists read the anointing oil as either a sign or the medicine of the day; either way, it is good to ask your church to pray with you. |
| Psalm 112:7 | hard diagnosis, troubled times | A picture of a person who trusts God, to grow into; feeling afraid of bad news does not mean you have failed it. |
| Matthew 25:40 | caregiving | Care given to "the least of these" is given to Christ. Unseen care is seen. |
| John 11:25–26 and the (b) passages | facing death | These speak of the hope of those who trust Christ, and carry the "For a believer" label, as on the sympathy pages. |
| Romans 10:9–13 | facing death | For anyone not sure where they stand with God: "Everyone who calls on the name of the Lord will be saved." It is not too late. |
| Psalm 31:5 | facing death (pray) | Jesus prayed these words as he died (Luke 23:46), and Christians have prayed them at the end ever since. |
| Philippians 4:19 | out of work, money worries | Paul wrote this to a poor church that had given generously to him. God meets needs; he does not promise wealth. |
| Proverbs 16:3, 3:5–6 | out of work, big decision | Proverbs are wisdom about how life usually goes, not guarantees of a particular outcome. |
| Ruth 2:1–12 | out of work | God's law let the poor gather grain at the edges of fields; Ruth's provision came through someone's generosity. Accepting help is not shameful. |
| 1 Kings 17:8–16 | money worries | A widow with one meal left; enough came, day by day. |
| Isaiah 54:10, 54:4–8 | divorce | Spoken to God's people pictured as a wife who had been abandoned. It describes God's unfailing love for you; it is not a promise about your marriage. |
| Ecclesiastes 4:12 | struggling marriage | About companions who help each other up; often read at weddings, it fits a marriage worth fighting for. |
| 1 Corinthians 13:4–8 | struggling marriage | Paul describes love in the church family. "Bears all things" is not a command to endure abuse; if you are afraid at home, see the page for being hurt at home. |
| Psalm 10:17–18, 82:3–4 | being hurt at home | God hears the oppressed, and he commands his people to rescue the weak. Asking for help is not betraying your family. |
| 1 Samuel 19:9–12, Acts 9:23–25 | being hurt at home | David escaped through a window at night; Paul was let down the city wall in a basket. Fleeing danger is not faithlessness. |
| Psalm 55:20–22 | being hurt at home | A psalm about a companion who "attacked his friends" with smooth words. Scripture names this kind of betrayal. |
| Colossians 3:19 | being hurt at home | What God asks of husbands. Harshness and abuse are the opposite of it. |
| 1 Samuel 1:9–18 | infertility | Hannah's story ends with a son; the page does not promise that yours will. It is here because God heard her anguish and the priest's misunderstanding did not stop her prayer. |
| Genesis 30:1–2 | infertility | Rachel's cry "Give me children, or I will die" is in Scripture, unedited. |
| Lamentations 2:19 | worried about your child | Written among the ruins of Jerusalem: a call to pour out your heart for your children through the night. |
| Luke 15:20 | worried about your child | The father was watching the road. |
| Proverbs 22:6 | worried about your child | A proverb describes how things usually go, not a guarantee. A grown child's choices are their own; faithful parents have prodigals too, and God himself has wayward children. |
| James 5:16 | addiction | James calls believers to confession and prayer. This is spiritual counsel, not evidence of a recovery group’s medical effectiveness; clinical treatment and peer support have distinct roles. |
| Romans 7:15–25 | addiction | Paul describes the struggle with sin and ends with thanks to God through Jesus Christ. Christians differ over the speaker’s situation in this passage; it does not diagnose Paul with addiction or reduce a substance-use disorder to a failure to resist temptation. |
| Isaiah 30:21 | big decision | Spoken to a nation that would turn back to God: he guides people who listen. |
| Nehemiah 2:1–5 | big decision | Nehemiah prayed in the moment, then answered with a plan; prayer and planning belong together. |

### 4.4 Words the site writes

Besides one line per passage and the applicable context notes above, each page has:

- **An introduction** of 40–110 words. Its first sentence names the feeling or situation plainly and stands alone, because it becomes the search description: "When anxiety won't let go, these verses from the Bible speak to the worry, and point to the God who carries it." The rest says what the page offers in one or two sentences.
- **A pastoral note**, "A word for you", of 120–250 words: written by hand, warm, in the second person, honest about what Scripture does and does not promise. Its plan for each page is in 4.5.
- **A person line** (one or two sentences, 27 pages) and its people id.
- **Card defaults** are not needed: this feature sends text, not cards (8.1).

### 4.5 What each pastoral note says

Each row is the plan; the implementation step writes the final note in the tone rules of 4.6 and checks it against the doctrinal foundation.

| Page | The note says |
|---|---|
| anxious | Anxiety symptoms are not proof of sin or weak faith; Scripture's answer is not "stop it" but "bring it" (Philippians 4:6, 1 Peter 5:7). Try one verse slowly, out loud, and breathe. If anxiety is constant or brings panic attacks, a doctor or counsellor can help, and that is wisdom, not unbelief. |
| afraid | Fear is the most-repeated reason for "do not fear" in Scripture, and it always comes with "for I am with you". Courage is not the absence of fear (Gideon was hiding when he was called). Name what you are afraid of to God. |
| overwhelmed | Jesus invited the weary, not the organised. You are allowed to put things down. One next step is enough for today. |
| depressed | Depression is real and can be an illness; it is not proof that you lack faith (Elijah, the psalmists). God met Elijah first with sleep and food. Tell someone you trust; see a doctor; medicine and counselling are among God's gifts. If you have thought about ending your life, please use the help at the top of the page now. |
| discouraged | Feeling like giving up usually means you have been carrying something heavy for a long time. Scripture's people felt it too (Jeremiah). Hope is not a feeling you produce; it is a person who holds you (Philippians 1:6). If "giving up" has started to mean giving up on life, please use the crisis contacts above now. |
| thinking-of-suicide | In the three-part editorial shape of 2.3: your pain is real, and God sees it (Psalm 34:18); you are not alone, and you do not have to carry this tonight by yourself; there is hope and help. Your life was made by God and matters to him (Psalm 139:13–16). Please use the crisis contacts above now, and if you can tell a trusted person near you. Thoughts like these can pass, and many people who have had them are glad they reached out. No argument, no theology of suicide, no mention of methods (2.3). |
| lonely | Loneliness is an ache Scripture names (Psalm 25:16). God's presence is real even when it is not felt, and he also places the lonely in families, often through a church. One small step: a message to one person, or one gathering this week. |
| grieving | Grief is love continuing; there is no schedule. Jesus wept. You may be angry, numb or exhausted, and you can bring all of it to God. For particular losses, the sympathy pages have passages chosen for a mother, a father, a husband or wife, a child, a baby and more. Grief groups help many people. |
| heartbroken | A breakup or a betrayed love can feel like a death, and Scripture takes heartbreak seriously (Psalm 147:3). God's love does not leave when someone else's does (Isaiah 54:10). Let yourself grieve; do not decide who you are from this week. |
| angry | Anger is not always sin; it can be a response to real wrong. The question is what we do with it: tell God honestly (the psalms do), slow down before speaking (James 1:19), and do not let it settle in. If anger is turning into hurting people, get help. |
| guilty | Some guilt is true and leads us to God, who forgives completely (1 John 1:9, Psalm 103:12); some shame lingers after forgiveness, and Romans 8:1 speaks to it. The gospel in two sentences, with a link to *The Good News*. Making things right where you can is part of healing. |
| worthless | Your worth is not what you achieve or how others treat you; it was given by God who made you and was shown at the cross (Romans 5:8). Feelings of worthlessness can be part of depression; please talk to someone, and the help line is here. |
| doubting | Doubt is not the opposite of faith; Thomas doubted and Jesus came to him. Bring your questions honestly; read the accounts of the resurrection; talk to a pastor. Link to the apologetics pages for the questions of evidence, and to *The Good News*. |
| far-from-god | Seasons of feeling far from God are described all through Scripture, and Jesus himself prayed "Why have You forsaken Me?". Feelings are not the measure of God's presence (Psalm 139:7–8). Keep coming: read a psalm, pray honestly, stay with God's people. If you are not sure you have ever known him, *The Good News* explains how. |
| exhausted | Rest is God's idea (the Sabbath, Mark 6:31). Exhaustion is not laziness and rest is not unbelief. Share the load (Exodus 18). Long exhaustion can have medical causes; see a doctor if it persists. |
| tempted | Temptation is not sin; Jesus was tempted. Every temptation has a way out (1 Corinthians 10:13), and running is often it (Joseph). Tell someone you trust; plan ahead for the moments that are hardest. If you have fallen, the guilty page and 1 John 1:9 are for you. |
| hurt-by-someone | What happened to you matters to God, and he will judge it rightly (Romans 12:19). Forgiveness is a process that releases the debt to God; it does not mean pretending, excusing, trusting again at once or staying in danger. If someone at home is hurting you, see that page now. |
| cant-sleep | Lying awake with a racing mind is common. Instead of fighting for sleep, read one verse slowly and give each worry to God by name. Sleep is a gift (Psalm 127:2). If sleep problems persist, affect daily life or concern you, seek professional advice; the site sets no waiting period and does not promise that reading a verse will bring sleep. |
| facing-surgery | It is natural to be afraid. Your surgeons and nurses are part of God's care for you (Luke the physician; Hezekiah's figs). Your times are in his hands (Psalm 31:15). Ask someone to pray for you at the hour of the operation. A line for the family waiting. Once prayers for occasions exist, a link to "a prayer before surgery". |
| sick | God can heal and sometimes does; sometimes he gives grace instead, as with Paul's thorn, and that is not a verdict on your faith. Ask your church to pray (James 5:14). Chronic illness can be lonely; tell people what helps. |
| serious-diagnosis | Hard news can shake everything at once. You do not have to have the right words or feelings; Job did not. Take the next appointment, the next question, one at a time. God's mercies are new each morning (Lamentations 3:22–23). Let others carry some of this. |
| caregiving | Caring for someone you love is holy work and exhausting work. You need rest and help too, and asking for it is not failing (Galatians 6:2). Local help: the directory’s community-services entry. |
| dying | For the one who is dying and those beside them: it is all right to be afraid and to say goodbye. For those who trust Christ, death is not the end (the labelled passages). If you are not sure where you stand with God, it is not too late (Romans 10:13; *The Good News*). Practical words: say what matters; ask a pastor to visit. |
| out-of-work | Losing work can hit identity, money and hope at once. Your worth is not your job. God knows what you need (Matthew 6:32). Practical steps and help (community services, food banks). Accepting help is not shameful (Ruth). |
| money-worries | Money fear is heavy and often hidden. God promises to meet needs, not to make anyone rich; the site does not teach otherwise. Take one practical step, talk to someone, and accept help (community services, food banks). |
| divorce | Divorce is a deep loss, whatever led to it. God is near to the brokenhearted and his love does not leave (Isaiah 54:10). This page does not judge your story; questions about divorce and remarriage are best talked through with a pastor you trust. If you are in danger, see the page for being hurt at home. |
| struggling-marriage | Many marriages go through hard seasons and come through. For ordinary conflict, small steps can include listening and getting help early. Before suggesting joint prayer, reconciliation, disclosure or couples counselling, clearly distinguish coercion and abuse: use specialist individual advocacy where safety is in question; do not ask the reader to try these steps with an abuser. One clear line: if you are afraid of your spouse, that is not a "struggling marriage"; see the page for being hurt at home. |
| abused | If you are in immediate danger, use local emergency help if it is safe to do so. What is happening to you is wrong, and it is not your fault. God hates violence and sees the oppressed (Psalm 10, Psalm 72:14). Getting safe is not faithless or unloving. Talk to an advocate (the hotline) and to someone you trust; a pastor should help you get safe, never send you back into danger. The site does not tell you what to decide about your marriage; your safety comes first. |
| infertility | The longing for a child is deep and Scripture does not hide it (Hannah, Rachel). This page will not promise you a child. Your grief is real, including each month's loss. God hears, and your worth is not measured by children. Be gentle with yourself around baby announcements and some church occasions. |
| worried-about-child | Loving a child who is struggling or has walked away is a particular grief. You are not the only influence in their life, and you are not God (Proverbs 22:6's note). Keep praying, keep the door open, and look after yourself. The father in the parable was watching the road. |
| addiction | Addiction is not beyond God's reach and it is not something to fight alone. Recovery can involve professional treatment and support from trusted people; a church or peer group does not replace clinical care. Do not advise stopping substances abruptly or give a detox plan; urgent medical concerns need local medical help. If you slip, come back (1 John 1:9). Help is listed below. |
| big-decision | God promises wisdom to those who ask (James 1:5), usually through Scripture, prayer, wise counsel (Proverbs 15:22) and the circumstances he gives, rarely through a sign. Pray, plan, ask, then step. You do not need to be certain to be faithful. |
| troubled-times | News can make the world feel out of control. Scripture was written in wars, plagues and exile, and its people trusted a God who rules history (Psalm 46). Psalm 91 is about his presence, not a guarantee against harm (its note). Limit what you take in; pray for the world; do one good thing nearby. |

### 4.6 Tone rules for every word the site writes here

These extend the sympathy tone rules (sympathy 4.4), which apply unchanged. The review checks the data against them; some are tested (9.4).

1. **Short, plain and warm.** No exclamation marks in the site's own voice. No "Remember…", "You should…", "Just pray", "at least", "everything happens for a reason", "God won't give you more than you can handle".
2. **Name it.** "When you're anxious", not "in this season".
3. **No blame.** Never "lack of faith", "if you really trusted God", or anything implying that the pain is the reader's fault.
4. **No promises Scripture does not make** (2.5 rule 1). Never "God will heal you", "God will give you a child", "your marriage will be restored", "your child will come back".
5. **Professional help is wise.** Pages touching mental or physical illness say once, gently, that doctors, medicine and counsellors are among God's gifts.
6. **Safe language around suicide** (2.3): "thoughts of suicide", "died by suicide", never "committed"; no methods; no suggestion that death is relief or reunion.
7. **Gospel plainly, never pushed** (2.5 rule 4); not on the two urgent pages.
8. **Say what the page will not say.** Where the honest answer is "Scripture doesn't promise that" (infertility, healing) or "the site doesn't rule on that" (divorce grounds, fertility treatment), the note says so in a sentence.

## 5. Pages

### 5.1 Addresses and routing

One route, `<Route path="/when-youre/*">`, as the life-event and sympathy pages do: the hub at `/when-youre`, topics at `/when-youre/<slug>`. The address uses the feature's own name so it reads as the owner's phrase ("bibleguide.io/when-youre/anxious"); search engines weigh the heading and title far more than the address. Verse anchors on a page use the sympathy `passageKey` (`/when-youre/anxious#isaiah-41-10`), so an ordinary topic’s shared link can open at the verse after the async text has mounted. Implement a feature-local hash effect (sympathy/scroll.ts is the pattern), handle malformed fragments safely, and give repeated passages unique DOM ids: the first occurrence owns the stable passage key, later roles append `-pray` or `-read`. On urgent topics, retain the hash without auto-scrolling beyond the help; offer an explicit “Go to shared verse” link after the help.

**An unknown topic address** (a typo, a cut-off link, a page retired later) does not show "page not found" to someone who is hurting. It shows the hub with one gentle line, "We couldn't find that page. Here is everything we have; if you are in danger, the help is at the top", and adds a route-scoped `<meta name="robots" content="noindex">` with cleanup when a valid page is opened (as the sympathy recipient page does), so search engines do not treat it as a duplicate of the hub. A page retired on purpose gets an entry in a small redirect list in the data instead, which sends its address with replace navigation to its explicitly recorded replacement, never a guessed “nearest” topic. Reject redirect cycles and invalid targets in data tests. The hub fallback applies to extra path segments too.

### 5.2 A topic page, top to bottom

1. **`h1`**: "What the Bible Says When You're Anxious" (section 3). The page sets its own `document.title` to the search title plus " · Bible Guide" (3.2), which [page-head.ts](../../../src/lib/page-head.ts) keeps because a page that names itself keeps its name.
2. **Help box, on the two urgent pages only**, directly under the heading and before anything else (6.2).
3. **Introduction**, the first qualifying `<p>` inside `<main>`, so it becomes the search description. Urgent help remains visually and semantically before it but uses a heading, descriptive `<div>` text and real links rather than an earlier long `<p>` (7.1).
4. **Help strip, on the four "Line" pages only**, under the introduction (6.3).
5. **The featured verse**, set large in Literata, with its reference linked to the reader and two buttons, **Copy** and **Send to someone** (8.1).
6. **"Verses to hold on to"**: the remaining Hold verses, each with its full Berean text as real page text inside `.scripture` with `lang="en"`, its reference linked to the reader, its one-line note, any context note, any label, and Copy / Send buttons. On the facing-surgery page, a small heading "For the family in the waiting room" sits above its last two.
7. **"Read slowly"**: the Read passages, each collapsed after its first two lines with a "Read the whole passage" toggle when longer than about 600 characters, with its note and context note.
8. **"Pray these words"**: the Pray passage, set apart in a quiet panel, with the line "Pray these words, or put them in your own".
9. **"Someone who felt this way"**: the person line and a link to their page at `/people/<id>`, where a page has one.
10. **"A word for you"**: the pastoral note.
11. **"If you need someone to talk to"**: the page's foot help (6.4), on "Line" and "Foot" pages.
12. **"Explore more"**: two to four related topic pages of this feature, the site topics of 5.4, and the cross-feature links of 5.6.
13. **The quiet line every page carries** (6.5), then the source line: "Scripture quotations are from the Berean Standard Bible (public domain)."

Order matters on purpose: Scripture comes before the note, because the visitor came for "what the Bible says"; help comes first only where safety is at stake.

### 5.3 The hub (`/when-youre`)

1. `h1` **"What the Bible Says When You're…"**, and an introduction: "Whatever you're going through, the Bible has words for it. Choose what's closest to how you feel." Search title in `ROUTE_TITLES`: **"Bible Verses for Hard Times: Anxiety, Grief, Fear and More"** (58 characters).
2. **The quiet crisis line**, always, in the green help style: "In immediate danger: use your local emergency number. In the US, for thoughts of suicide or emotional crisis, call or text the crisis line below." with tap-to-call and tap-to-text links read from the data (6.5).
3. **"How are you feeling?"**: one text box that filters the topic list as the visitor types, matching each topic's heading, its label and a short list of plain words people use for it (stored per topic: "worried", "panic", "nervous" for anxious; "stress", "too much" for overwhelmed; "breakup" for heartbroken; "cancer", "test results" for a hard diagnosis; "insomnia" for can't sleep; "porn" for tempted; "drinking", "drugs" for addiction; "laid off", "fired" for out of work). **The filter is a navigation aid, never a diagnosis or risk assessment; a non-match must not imply safety. Match case, apostrophes, punctuation and self-harm spelling variants; if both abuse and self-harm/suicide match, show both kinds of help. When abuse help appears on the hub, show the same quick exit and device-safety note as on the abuse topic. Keep focus in the input and announce result count through a quiet `aria-live` status, without reading the entire help box on every keystroke. If what is typed matches a crisis word** ("suicide", "kill myself", "end my life", "want to die", "self-harm", "cutting", "hurt myself", "abuse", "hits me", "afraid of my husband"…), the full help box of the matching urgent page appears at the top of the results at once, above the links. What is typed is never stored, never put in the address, never sent anywhere (6.6).
4. **Three groups of link cards**, "In your heart" (18), "In your body" (5), "In your life" (10): each card shows the short label ("Anxious") and its featured verse's reference (not its text, for the reason the life-event hub gives: quoting a verse per card would load a dozen whole books just to draw a menu). The two urgent pages appear in their groups like any other, with no alarming styling; crisis help is reached through the quiet line and the filter, never by making the list frightening. 33 cards is under the site's long-list threshold of about 50 rows, so the list renders in full.
5. **"For someone you love"**: links to the sympathy pages (comforting someone who is grieving), the caregiving page, and, once it exists, prayers for occasions.
6. The source line.

### 5.4 Links to the site's topics

Each page links two to four topic pages, by slug and title, all confirmed to exist with references (2.6). The data test checks every one (9.4).

| Page | Topics (`/topics/<slug>`) |
|---|---|
| anxious | `care`, `peace`, `prayer` |
| afraid | `fear-unholy`, `courage`, `protection` |
| overwhelmed | `rest`, `peace`, `waiting-upon-god` |
| depressed | `despondency`, `hope`, `consolation-in-affliction` |
| discouraged | `despondency`, `patience`, `hope` |
| thinking-of-suicide | `hope`, `consolation-in-affliction`, `love-of-god` (never `suicide` or `desired-death`, 2.3) |
| lonely | `affliction-forsaken-by-friends-in`, `presence-of-god`, `friendship` |
| grieving | `bereavement`, `mourning`, `weeping`, `sorrow` |
| heartbroken | `sorrow`, `consolation-in-affliction`, `love-of-god` |
| angry | `anger`, `patience`, `forgiveness` |
| guilty | `conviction`, `confession-of-sin`, `forgiveness-of-sin`, `repentance` |
| worthless | `love-of-god`, `grace`, `mercy` |
| doubting | `doubting`, `faith`, `assurance` |
| far-from-god | `presence-of-god`, `prayer`, `waiting-upon-god` |
| exhausted | `rest`, `patience` |
| tempted | `temptation`, `lust`, `temptation-of-christ` |
| hurt-by-someone | `forgiveness-of-injuries`, `betrayal`, `enemy` |
| cant-sleep | `sleep`, `peace`, `protection` |
| facing-surgery | `physician`, `sickness`, `prayer` |
| sick | `sickness`, `suffering`, `afflictions-and-adversities` |
| serious-diagnosis | `afflictions-and-adversities`, `trial-of-faith`, `hope` |
| caregiving | `patience`, `consolation-in-affliction` |
| dying | `death-of-saints`, `resurrection`, `heaven` |
| out-of-work | `labor`, `industry`, `contentment` |
| money-worries | `poverty`, `debt`, `contentment` |
| divorce | `divorce`, `consolation-in-affliction` |
| struggling-marriage | `marriage`, `forgiveness`, `patience` |
| abused | `oppression`, `injustice`, `protection`, `refuge` |
| infertility | `barrenness`, `childlessness`, `prayer` |
| worried-about-child | `parents`, `prayer-in-behalf-of-children` |
| addiction | `drunkenness`, `temptation`, `self-control` |
| big-decision | `decision`, `waiting-upon-god`, `prayer` |
| troubled-times | `trouble`, `protection`, `refuge` |

The topic pages answer "what does the Bible teach about this", in Nave's arrangement; these pages answer "what do I read now, and what does it mean for me". They complement rather than compete.

### 5.5 Related pages within the feature

Each page names two to four sibling pages in its data (`related`), for example anxious → afraid, overwhelmed, can't sleep; depressed → discouraged, lonely, worthless, thoughts of suicide; guilty → tempted, far from God, addiction; struggling marriage → hurt by someone, divorce, being hurt at home. **Every page whose subject can shade into danger links to the matching urgent page** (depressed, discouraged and worthless → thoughts of suicide; struggling marriage, divorce and hurt by someone → being hurt at home); the urgent pages link only to gentle siblings (thoughts of suicide → depressed, lonely; being hurt at home → hurt by someone, afraid), never to each other's heavy subjects.

### 5.6 Links to other features

- **Sympathy:** the grieving page's "doors": "If your mother has died", "…your father", "…your husband or wife", "…your child", "If you have lost a baby", "If someone you love died by suicide", "If someone died suddenly", "Planning a funeral", each to its sympathy page. The divorce and heartbroken pages do not link there.
- **Apologetics** from the doubting page; ***The Good News*** (`/study/the-good-news`) from guilty, far from God, doubting and facing death.
- **Help for life** (`/resources/life`) from every page (6.5).
- **Prayers for occasions** (sequence 33 steps 14–16), once it exists: facing surgery, big decision, out of work, struggling marriage. Until then, nothing (no "coming soon" link).

### 5.7 Entry points

- **Home page:** one new line of link text, "What the Bible says when you're hurting", in the same Resources block as the life-event, sympathy and countdown lines in [HomePage.tsx](../../../src/pages/HomePage.tsx) (lines 278–280 at the time of writing), for the reason those designs give (a new block is a redesign needing the owner's mock-up).
- **Route:** two lines in [App.tsx](../../../src/App.tsx) (the lazy import and the route). **Hub title:** one entry in `ROUTE_TITLES` in [page-head.ts](../../../src/lib/page-head.ts). **Sitemap:** one page type in [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), fed by `whenYourePaths()`.
- **From sympathy** (the change its design planned in its 2.6 and 5.5): the recipient card page's "More words of comfort" link, now `/sympathy#verses` in [RecipientCard.tsx](../../../src/pages/sympathy/RecipientCard.tsx), points to `/when-youre/grieving`; and the sympathy hub's "Explore more" gains one line, "When you're grieving yourself". Two one-line edits to another feature's files, re-read just before editing; the sympathy tests must still pass, and the recipient test that expects `/sympathy#verses` is updated with it.

## 6. Crisis and support help

### 6.1 The principles

1. **Every contact comes from the help directory’s checked data** ([life.json](../../../src/data/resources/life.json)), selected by entry id. Do not copy numbers, codes or helpline URLs into feature data or prose. This differs from sympathy: a required contact missing or a pending/null/rejected load must never leave urgent help blank. Render a number-free fallback immediately: “If you are in immediate danger, use your local emergency number. If you are thinking of suicide or self-harm, reach out to a crisis service or a trusted person now.” Keep the local `/resources/life` link and Retry visible; it shares the same directory and is not represented as an independent outage-proof fallback. Retain the fallback for a missing required primary contact even if optional contacts load. Missing optional rows may be omitted. Avoid coupling help loading to Bible/catalogue loading.
2. **Help is calm, never alarming:** the site's existing green help style, never red, no flashing, no pop-ups, no modal that blocks the verses.
3. **Help scales with risk:** urgent box, calm line, foot help, quiet line (3.2), set per page in the data and tested.
4. **United States first, the world one tap away.** The directory is US-based; every help box and strip also shows "Outside the US: find a helpline" from its `find-a-helpline` entry, and the foot help links to the directory's "Outside the United States" group on `/resources/life`. The site does not guess the visitor's country (no location lookup, nothing sent).
5. **Faith and non-faith help are both offered where both exist**, as the directory already marks them, and crisis lines always come first whatever their faith label.

### 6.2 The urgent help box (thoughts of suicide; someone at home is hurting you)

Under the heading, before the introduction, a box headed in plain words:

- **Thoughts of suicide:** "You don't have to face this alone. Talk to someone now, any time, day or night." Then large tap targets: **Call 988** and **Text 988** (from `988-lifeline`), **Chat online** (its chat contact), a Crisis Text Line row built from the `crisis-text-line` entry's own contact and note (its code is never typed in this feature), **"US: in immediate danger or unable to stay safe, call emergency services"** (from `emergency-911`), **"Veterans: press 1 after dialling 988"** (from `veterans-crisis-line`'s note), and **"Outside the US: find a helpline"**. Under the links, one line: "If you can, tell someone near you how you're feeling right now."
- **Someone at home is hurting you:** "If you are in immediate danger, contact local emergency services if it is safe to do so." Label the directory’s emergency call button US; Then **Call**, **Text** and **Chat** for the National Domestic Violence Hotline (`domestic-violence-hotline`), **"If you are under 18 or a child is being hurt: Childhelp"** (`childhelp-hotline`), **"After sexual assault: RAINN"** (`rainn-hotline`), and "Outside the US: find a helpline". Plus the safety tools of 6.6.

The box is a labelled region (`<section aria-label="Help right now">`) placed early in DOM order; that alone does not force a screen reader announcement or override the site header, and its links are real `tel:` and `sms:` links built with `dialable` and `smsHref` from [contact-links.ts](../../../src/pages/resources/contact-links.ts).

### 6.3 The calm help strip (depressed, discouraged, worthless, addiction)

One line under the introduction, the sympathy strip's wording adapted: "If you're thinking about ending your life, you can call or text 988, any time, day or night." with Call and Text links and "Outside the US: find a helpline". On the addiction page it reads instead: "For help with drugs or alcohol, call the SAMHSA National Helpline, free and confidential, any time." from `samhsa-helpline`, followed by the 988 line. Use the same calm visual style, with this feature’s robust fallback. Label US contacts explicitly. SAMHSA is treatment information/referral, not emergency response or counselling; do not render its TTY or ZIP-code text service as interchangeable with its main phone line.

### 6.4 Foot help ("If you need someone to talk to")

| Page | Entries from life.json |
|---|---|
| anxious, depressed, worthless, lonely | `focus-on-the-family-counseling`, `acbc-find-a-counselor` (the directory's counselling group) |
| discouraged | `crisis-text-line`, then the counselling pair |
| grieving | `griefshare`; and "If someone you love died by suicide": `afsp-suicide-loss-groups` |
| caregiving | `211-united-way` |
| out-of-work | `211-united-way`, `feeding-america-locator` |
| money-worries | `211-united-way`, `feeding-america-locator`, `usda-national-hunger-hotline` |
| divorce, worried-about-child | the counselling pair |
| struggling-marriage | the counselling pair; and one separate line, "If you are afraid of your spouse", linking to the being-hurt-at-home page and to `domestic-violence-hotline` |
| addiction | `celebrate-recovery`, `findtreatment-gov`, `samhsa-helpline` |
| thinking-of-suicide, abused | none extra (the box at the top is the help) |

Each entry shows its name, its one-line summary from the directory, its contacts as links, and whether it is a Christian organisation (the directory's `faith` flag), then "More help near you" linking `/resources/life`. Show each entry’s actual `checked` date and source link; do not hard-code a common date (Find A Helpline currently differs). A directory date records its last check, not a guarantee of availability or confidentiality. Distinguish pastoral counselling from licensed clinical care; the two faith-based counselling entries must not be presented as a complete mental-health treatment directory. For clinical treatment, offer the existing `findtreatment-gov` locator alongside these choices where relevant.

### 6.5 The quiet line on every page

Above the source line on every topic page, small and calm: "If you're in crisis, call or text 988 (US) or find help near you." with the 988 links from the data and "find help near you" to `/resources/life`. A hurting visitor can arrive at any page, including the big-decision one; this line costs nothing and is never alarming.

### 6.6 Privacy and safety on these pages

- **No feature persistence or telemetry.** Keep filter state only in memory; no feature writes to local storage, session storage, cookies or query parameters, and no analytics events carry the query or chosen topic. Test the feature’s behavior against the shared-app baseline rather than promising the whole site writes nothing. Visiting a URL, loading scripts, opening a reader, calling, texting or sharing can leave history, cache, network, phone or message records outside this feature. Do not promise that a shared device cannot reveal the visit.
- **Quick exit whenever abuse help is visible** (topic, hub match or relevant fallback): a fixed, keyboard-accessible “Leave this page” control, plus two non-repeating Escape presses within one second, navigates immediately with `location.replace("https://www.google.com/")`; no animation, popup or confirmation. Clean up its key handler on unmount. Replacement removes only the current history entry and does not erase previous visits, session history, monitoring or network records. Under the help: “This device or internet connection may be monitored. Quick exit and private browsing do not erase all traces. If possible, use a safer device to contact an advocate.” No automatic history clearing; no blanket privacy-window assurance.
- **Sending is never automatic.** Nothing on these pages contacts anyone; Send builds a message the visitor sends from their own app (8.1).
- **The hub query is processed locally.** No query in requests, referrers, console logs, URLs or storage. Helpline anchors use `referrerPolicy="no-referrer"`; use a route-scoped `meta[name="referrer"]` no-referrer policy while this feature is mounted (restoring the prior policy on cleanup) so imperative quick exit also avoids sending a referrer; new-tab help links also use `rel="noopener noreferrer"`. Shared URLs intentionally name the topic: on abuse pages warn that sending/copying can expose the subject in messages and link previews, and let the visitor choose. Do not call the message anonymous or harmless because it omits free text.

## 7. Being found

### 7.1 Titles, headings and descriptions

Each page has a search title, an `h1` and an introduction naming its subject. Code inspection confirms [capture.ts](../../../scripts/seo/capture.ts) reads `document.title`, and [shell.ts](../../../scripts/seo/shell.ts) preserves it unless unnamed; the feature sets its title on every topic change and restores the default on cleanup. No 33-entry fallback in `ROUTE_TITLES` is needed. The hub gets its one route title. Both [usePageHead.ts](../../../src/components/usePageHead.ts) and capture select the first paragraph of at least 60 characters; shell.ts recomputes the description with `pageHead`, ignoring capture.description. Therefore keep urgent help first with semantic headings, div text and links, and make the intro the first qualifying `<p>`. This avoids a shared SEO refactor. Test title and description after topic-to-topic navigation and into/out of unknown paths, and with late help/verse loading. Do not rely on effect order, a hand-set meta description alone, or a capture override to solve it.

### 7.2 Sitemap and crawler copies

As in sympathy (its 5.7): one page type, "when-youre", in the design-review inventory, fed by `whenYourePaths()` in the data index, which returns the hub and the 33 topic addresses (never anchors or unknown addresses), so a topic added later reaches the sitemap by itself. This review performs no capture, commit, indexing or publication. A future owner-authorized release must capture the approved build at the explicitly selected base and refresh stale captures, then build crawler copies and sitemaps; capture defaults to production and would otherwise see an unpublished route as missing. Publication and IndexNow remain separately authorized supervisor work.

### 7.3 Links that help a page be found

The hub links every page; every page links its siblings, its topics, the hub and the matching sympathy, apologetics or good-news page; the home page links the hub; sympathy links the grieving page (5.7). Each page's people link sends readers on into the site's people pages and back.

### 7.4 What we deliberately do not do

- **No FAQ markup.** This is a pastoral reading page, not a structured FAQ. Do not promise a rich result or an eligibility benefit; help and context must remain available in ordinary page text.
- **No keyword lists,** hidden text, or near-duplicate pages for each spelling ("anxiety", "anxious", "worry"): one page per intent, with the other words in its search title, heading and text where they read naturally, and in the hub filter's word list, which is never rendered as page text.
- **No thin pages.** Each page has its own introduction, its own note per passage, its own pastoral note and at most three passages shared with any other page (4.1 rule 5); that is what keeps 33 related pages from looking like copies of one another.
- **No medical claims.** These are pages about Scripture; health topics carry the gentle "see a doctor" line and never advice. Search engines hold health and crisis pages to a higher standard of care, these are editorial safeguards, not proof that a search engine’s quality criteria have been met: Scripture quoted exactly, help from named, dated, checked organisations, and an honest note.

## 8. Sharing, and verse cards later

### 8.1 Copy and send

Each Hold verse (and the Pray passage) has:

- **Copy:** copies "text — reference (BSB)", ready to paste anywhere or write in a card.
- **Send to someone:** builds a plain message the visitor can edit:

  ```
  "Cast all your anxiety on Him, because He cares for you." — 1 Peter 5:7 (BSB)

  More verses for when you're anxious: https://bibleguide.io/when-youre/anxious#1-peter-5-7
  ```

  The link is built from `SITE_ORIGIN`, never from the address the page is open at, and carries no tracking. Buttons, as in the sympathy message tab (its 6.2): **Share…** (`navigator.share`, shown only where supported), **Copy message**, **Email** (`mailto:` with the subject "A verse for you"), and on phones **Text message** (`sms:?&body=…`, no number). A cancelled share is not an error; a blocked clipboard shows the text selected with "Press and hold to copy". There is no free-text field in the builder (the visitor adds their own words in their own app), so nothing typed is ever drawn on the site.
- **On the two urgent pages** the Send button reads "Send this to a friend" and the message ends with the page link, never with a crisis-specific line about the sender; the message itself includes a short, number-free invitation to use the help at the top. Urgent-page anchors must not auto-scroll past that help.

### 8.2 Printing

Not at launch (section 11). A printable sheet of a page's verses for a hospital bedside is a natural later addition using the life-event print module.

### 8.3 Switching to the shared verse-card generator later

Chain C's generator (approved idea 4) did not exist on 2026-11-07. The page hands each Send button a plain **card description** (`{ key, reference, text, page: slug, heading }`), built by one pure function, so that when the generator exists:

- **"Save as image"** joins Copy and Send, drawing the verse with the generator's quiet style;
- each topic page asks the generator for its **link-preview image** (`og:image`) of its featured verse, so a shared link shows the verse itself in a chat.

The implementation step checks [docs/features/verse-cards/design.md](../verse-cards/design.md) and its actual supported API before starting; reuse only an existing compatible interface without editing or implementing that other chain’s feature. Until then the message carries the verse in its own text, so nothing is half-built.

## 9. Building it

### 9.1 Data

Under `src/data/when-youre/`, importing nothing through the `@/` alias (so build scripts can read them, as the life-event and sympathy data do):

- `types.ts`, `index.ts` (the list in hub order, `topicBySlug`, `whenYourePaths()`, `WHEN_YOURE_PATH`, the redirect list), `words.ts` (the hub filter's plain-word lists and the crisis words);
- six initial content groups, split further within this feature if readable notes exceed the 500-line target (formatting must not hide long content on single lines): `heart.ts` (anxious, afraid, overwhelmed, can't sleep, exhausted), `sorrow.ts` (depressed, discouraged, thoughts of suicide, lonely, grieving, heartbroken), `soul.ts` (angry, guilty, worthless, doubting, far from God, tempted, hurt by someone), `body.ts` (facing surgery, sick, a hard diagnosis, caregiving, dying), `home.ts` (divorce, struggling marriage, being hurt at home, infertility, worried about your child), `life.ts` (out of work, money worries, addiction, big decision, troubled times).

They use the life-event `p()` helper and `BOOK_NUMBERS` from [types.ts](../../../src/data/life-events/types.ts) and the sympathy `passageKey` from [card-keys.ts](../../../src/data/sympathy/card-keys.ts), by plain relative imports of files with no dependencies.

```ts
import type { LifeEventPassage } from "../life-events/types";

/** Hold = "card", Read = "reading", Pray = "blessing" in the shared role type (design 4.1). */
export interface TopicPassage extends LifeEventPassage {
  believer?: true;                       // "For a believer" (design 2.5 rule 5); never on the featured verse
  forFamily?: true;                      // facing surgery: "For the family in the waiting room"
}

export type HelpLevel = "urgent" | "line" | "foot" | "none";

export interface WhenTopic {
  slug: string;                          // "anxious"
  group: "heart" | "body" | "life";
  label: string;                         // "Anxious", for the hub card
  heading: string;                       // h1, "What the Bible Says When You're Anxious"
  searchTitle: string;                   // "Bible Verses for Anxiety and Worry" (≤ 50 characters)
  intro: string;                         // 40–110 words; first sentence stands alone
  passages: TopicPassage[];              // 6–8 card, 1–3 reading, exactly 1 blessing; first card = featured
  person?: { id: string; line: string }; // /people/<id>
  note: { title: string; text: string }; // "A word for you", 120–250 words
  help: { level: HelpLevel; entries: string[]; extra?: { label: string; href: string }[] }; // life.json ids
  topics: { slug: string; title: string }[];   // 2–4, /topics/<slug>
  related: string[];                     // 2–4 sibling slugs
  elsewhere?: { href: string; title: string }[]; // sympathy doors, apologetics, good news
  words: string[];                       // plain words for the hub filter; never rendered
}
```

Verse text is not stored; it is loaded from the Berean files at view time, as everywhere on the site.

### 9.2 Files

All new files in `src/pages/when-youre/`: `WhenYourePage.tsx` (the route), `Hub.tsx`, `TopicPage.tsx`, `HelpBox.tsx` (urgent box, strip and foot help, reading life.json by id), `QuickExit.tsx`, `PassageList.tsx`, `SendVerse.tsx`, `message.ts` (the pure message and card-description builders), `filter.ts` (the pure hub filter and crisis-word match), `useTopicPassages.ts` (the loader, on the pattern of [useSympathyPassages.ts](../../../src/pages/sympathy/useSympathyPassages.ts)), `when-youre.css`, and tests; plus `src/data/when-youre/`. Reused without change: the life-event passage helpers ([passage.ts](../../../src/pages/life-events/passage.ts)), `p()` and `BOOK_NUMBERS`, the sympathy `passageKey`, `loadResource` and [contact-links.ts](../../../src/pages/resources/contact-links.ts). Shared integration edits, kept narrow and reconciled with current parallel work (do not promise an exact line count): [App.tsx](../../../src/App.tsx), [page-head.ts](../../../src/lib/page-head.ts), [HomePage.tsx](../../../src/pages/HomePage.tsx), [site-map-rest.ts](../../../scripts/design-review/site-map-rest.ts), and the two sympathy lines of 5.7 ([RecipientCard.tsx](../../../src/pages/sympathy/RecipientCard.tsx), the sympathy hub). No new dependencies. Nothing in [public/_headers](../../../public/_headers) is needed: every real page is indexable and the unknown-address page marks itself.

### 9.3 Writing the words

One note per final passage, the applicable context notes, 33 introductions, 33 pastoral notes (roughly 4,000–8,000 words), 27 person lines and the hub filter's word lists, written once, by hand, in the implementation step, directly into the data files, as the life-event and sympathy steps wrote theirs. This is careful pastoral writing on sensitive subjects, which is a reason in itself to write it by hand rather than generate it. It is ordinary authoring of six files, not a batch of model calls, so it requires no runtime model calls or separate paid generation job; authoring and review still take time and must remain within the original budget caps; no words are generated at runtime. It is more than the sympathy step wrote (about 207 notes), so if the implementation does not fit in one sitting it should say so and finish in a follow-up rather than rush the two urgent pages, which are written first and checked hardest.

### 9.4 Tests (added in the implementation step, run with the site's `test` and `build`)

- **Passage data** (reading the real Berean files): every verse id exists and every range runs forward in one chapter; every excerpt is exact, with the right "a"/"b" mark; every page has 6–8 Hold, 1–3 Read, exactly one Pray; every Hold verse is 320 characters or fewer after tidying, every Pray passage 700 or fewer; every assembled passage has paired double quotation marks and ends on ".", "!", "?" or "…" before any closing quote; the featured verse carries no "For a believer" label; **no two pages share more than three distinct Hold or Read passage keys**; **no Hold verse anywhere is Romans 8:28, Jeremiah 29:11, Malachi 2:16 or Proverbs 22:6, and 1 Corinthians 10:13 appears only on the tempted and addiction pages**.
- **Words:** intros 40–110 words, pastoral notes 120–250, search titles at most 50 characters, slugs unique and URL-safe, headings unique; **tone checks** on authored strings (with explicitly reviewed corrective-context exceptions; do not modify Scripture to satisfy phrase scans): no "committed suicide", no "!" outside quoted Scripture, no "at least", "just pray", "lack of faith", "everything happens for a reason", "more than you can handle" (except inside the tempted page's context note that corrects it), no "God will heal you".
- **Links:** every topic slug exists in the topics index with at least one reference and its title matches; **no page links `suicide` or `desired-death`**; every person id exists in the people data; every `related` slug is a real page; every `elsewhere` address is a real route (sympathy pages checked against `sympathyPaths()`); depressed, discouraged and worthless relate to the suicide page, struggling marriage, divorce and hurt-by-someone relate to the abuse page.
- **Help:** every help entry id exists in life.json; the two urgent pages are exactly `thinking-of-suicide` and `abused`; the "line" pages are exactly depressed, discouraged, worthless and addiction; helpline contacts and URLs are read from life.json and no literal contact value is duplicated in feature data or code. Tests must distinguish valid verse ids, references and year/length constants from telephone numbers instead of flagging any digit run. Test missing individual primary contacts as well as pending, null and rejected loads; notes supply text keywords and Veterans instructions.
- **Page tests** (Testing Library): the hub lists all 33 pages in three groups and shows the quiet crisis line; typing "worried" shows anxious; typing a crisis word shows the matching urgent help box above the results; a topic page shows heading, intro, every reference, notes, context notes, labels, person link, topics and the quiet line; verse text is inside `.scripture` with `lang="en"`; the urgent help box appears before the introduction on the two urgent pages and on no other; the strip appears on the four line pages only; foot help shows the entries named in 6.4; with life.json failing to load the page still renders and the urgent pages show the number-free fallback line; an unknown topic shows the hub with the gentle line and the `noindex` meta, never the not-found page; a retired slug in the redirect list goes to its target.
- **Privacy:** instrument this feature’s storage and outgoing requests against shared-app baseline; filter input never appears in storage, query, logs or requests. Contact/share actions remain explicit; safe-device copy makes no erase-history promise.
- **Quick exit:** shows on the abuse page and whenever the hub shows abuse help, remains accessible at narrow widths and zoom, calls `location.replace` immediately with the exact neutral address; two non-repeating Escapes within one second do the same, timeouts reset and unmount removes the handler.
- **Message builder:** the message holds the tidied verse, the reference with "(BSB)" and a link starting `https://bibleguide.io/when-youre/` with the verse's anchor, whatever address the test page is at; Share is hidden when `navigator.share` is missing; Email and Text links carry the encoded body.
- **Sympathy links:** the recipient card's "More words of comfort" now points to `/when-youre/grieving`; the sympathy hub shows "When you're grieving yourself"; the existing sympathy tests pass (the one expecting the old link updated with the change).
- **Sitemap inventory:** `whenYourePaths()` holds the hub and the 33 unique topic addresses and nothing else. Unknown paths clean up robots noindex on valid navigation; redirects replace history and cannot cycle.
- **Anchors and help:** duplicate passage keys across roles have unique DOM ids; async ordinary-topic fragments resolve safely. Shared urgent-topic fragments never bypass help; the explicit post-help link reaches the verse.
- **Contacts:** `wayOf` merges chat/web into one category; select actual chat contacts by their original kind, preserving all contact notes. `smsHref(value)` alone cannot prefill HOME/START/GO/HOPE when the keyword is held in contact.note. Add a feature-local adapter using the checked note with explicit tests, or show the keyword beside the number as a manual instruction; never guess a keyword, send an automatic SMS or edit shared helpers broadly. SAMHSA ZIP-code instructions remain manual input.
- **Metadata:** verify the urgent help’s text remains visible/accessible before intro, intro supplies the first qualifying paragraph, titles update on client navigation, and pure readyMade/pageHead checks preserve the intended title and intro description. Browser checks remain a later authorized supervisor operation.

## 10. Edge cases

| Case | What happens |
|---|---|
| A visitor in immediate danger lands on any page | The urgent pages open with help; every other page carries the quiet line with 988 and a link to all help; the hub filter brings up the help box for crisis words |
| A visitor searches "giving up" and means their life | The discouraged page carries the calm 988 strip under its introduction and relates to the suicide page; its pastoral note names the possibility gently |
| The help directory fails to load, or an entry is renamed | Lines whose entry is missing are left out; urgent pages fall back to the complete number-free emergency/crisis fallback and Retry of 6.1; the page itself never fails |
| A helpline's number changes | It is changed once in life.json, the site's single checked source; this feature holds no numbers (tested) |
| A visitor outside the US | "Outside the US: find a helpline" on every help box and strip; the directory's other-countries group one tap away; no location lookup |
| A shared or watched device (abuse) | No feature persistence; quick exit replaces only the current entry; safer-device warning explicitly says private browsing and exit do not erase all traces |
| An abuser finds a sent link | Topic URLs and previews can disclose the subject; warn before sharing and keep the choice with the reader |
| A reader asks "is suicide a sin?" on the suicide page | Not argued there (2.3); the page speaks to the reader's life and safety. A family bereaved by suicide finds the theology on the sympathy suicide-loss page, linked from the grieving page |
| A child reads the abuse page | Childhelp is in the urgent box with "If you are under 18 or a child is being hurt" |
| A believer's-hope passage on the dying page read by someone who isn't a believer | It carries the "For a believer" label; the page also offers John 3:16 and Romans 10:9–13 and says it is not too late |
| A divorced reader expects condemnation | The page grieves with them, never rules on their divorce, keeps Malachi 2:16 off (tested), and points to a pastor for their questions |
| A reader takes Psalm 91 as a promise nothing bad will happen | Its context note says what it does and does not promise, with Jesus' own refusal to misuse it |
| A grieving parent of a prodigal reads Proverbs 22:6 as an accusation | It is a Read passage with a context note, never a card verse, and the pastoral note addresses it |
| Infertility page and baby announcements | No baby imagery, no link to the expecting pack, no promise of a child |
| A reader wants to send a verse to a struggling friend | Copy or Send builds a message with the verse and a page link; nothing goes through the site |
| Share sheet unsupported, cancelled, or clipboard blocked | As in sympathy: Share hidden, cancel silent, text shown selected to copy by hand |
| Typed markup in the hub filter | Treated as text; never rendered as HTML; never stored or sent |
| Unknown or retired topic address | Hub with a gentle line and `noindex`, or a redirect to the nearest page; never "page not found" |
| Verse text fails to load | Passages show "could not load" with Retry; the help, intro and pastoral note still show, so help is not hidden by a Bible-text error |
| Very long Read passages (Psalm 27, Matthew 6:25–34, Psalm 91) | Collapsed after two lines with "Read the whole passage" |
| Site shown in another language | Pages stay English and verses Berean in this build (`.scripture lang="en"`); helpline names stay as the directory has them; translation is later work |
| Dark mode, small phones, screen readers | The help box is the first labelled region; tap targets at least 44 px; colours from the site's theme; no motion |
| A topic added later | One editorially reviewed data entry plus its tests and passage/key checks; it reaches the hub, filter and sitemap through the registry |
| Releasing | This feature never deploys; crawler copies and IndexNow only after the owner releases |

## 11. Out of scope for this build

Written prayers (Scripture is prayed instead; written prayers are the prayers-for-occasions feature); printing (8.2); images and link previews (waiting for the shared verse-card generator, 8.3); audio of the verses; reminders or "verse a day for a hard week" sign-ups (they would need stored contact details); comments, testimonies or "talk to someone" chat on the site itself (they would need moderation and crisis staffing, and the directory already points to people trained for it); location-based help; translated pages; the "later" topics of 3.3 and the two left for the owner's decision.

## 12. Decisions for the owner, and questions for the review

The design takes these positions; each is easy to change in the data:

1. **The two hardest pages are included:** thoughts of suicide, and someone at home hurting you. People search for both, and the pages that rank today often give no help. Both follow the national safety guidance (2.3, 2.4) and are written first and checked hardest. Removing either is deleting one data entry.
2. **The abuse page says that getting safe is not faithless,** and that separating for safety is a different question from divorce, on which it does not rule (2.5 rules 6–7). This is the most theologically sensitive line in the feature and the review should check its wording against the doctrinal foundation.
3. **Scripture is prayed, no prayers are written here,** to keep clear of the prayers-for-occasions feature (2.7).
4. **No promises of healing, children, work or reconciliation,** stated openly on the pages where readers most hope for them (2.5 rule 1).
5. **The address is `/when-youre/…`,** matching the feature's name; `/when-you-are/…` or `/help/…` would work equally well if the owner prefers.
6. **Unplanned pregnancy and after an abortion are not at launch,** pending the owner's word (3.3).

The single review is recorded below. Final authored content and implementation behavior still need the checks in 9.4; this review is not clinical certification and does not implement them.


## Review

Reviewed once on 2026-11-08 for job 761, sequence 33 step 11, against approved idea 9, FEATURE-BUILD-RULES, the local doctrinal foundation, the actual life-event/sympathy/help-directory implementations and the SEO pipeline. The 33 pages and original research/design history are retained. This was a design review only; no feature implementation, site tests, build, browser automation, commit, push or deployment was performed. Recovery job 22410a28dba8499eacc86948216518ae checked the actual installed document on 2026-11-09: the corrections below are present in its body. The former staging-only restriction is superseded by the owner's recovery authorization; installation is no longer pending. The recovery updates delivery status and sequence references without repeating the one-time design review.

### Changed and why

1. **Help and safety:** removed false private-window/history guarantees, limited no-storage promises to feature behavior, added monitored-device and sharing warnings, US scope, distinct emergency/crisis/referral roles, primary-contact/loading fallbacks and accurate entry dates. Abuse help on the hub now includes quick exit too. Current Hotline guidance contradicts the old private-window advice. Calls, SMS, browser and network records cannot be erased by this feature.
2. **Clinical boundaries:** Scripture and Bible narratives are spiritual care, not clinical evidence. Self-harm is not assumed to mean suicidal intent; no diagnosis, treatment promise, mandatory waiting period or advice to stop treatment is permitted. Abuse advocacy precedes reconciliation or joint-counselling suggestions. Crisis wording remains nonjudgmental and directs readers to people. Childhelp must not be called an emergency or reporting line.
3. **Passages and context:** guilty and abused had four Read passages despite the 1–3 limit. Removed guilty’s extra Micah reading; moved Colossians 3:19 to Hold on abused. Replaced the suicide page’s Psalm 118:17 assertion of survival with Psalm 138:3. Exhausted, marriage and troubled-times Pray selections now address God instead of being declarations or commands to the reader. Removed the unsupported “worst week” chronology and the implied diagnosis of Paul’s addiction. Corrected the person count and unverified hand totals. Existing repetitions across Hold/Pray need unique anchors. Final wording must use exact Berean excerpts and disclose believer-specific promises consistently, not imply universal salvation from a comforting verse.
4. **Real integration:** capture reads document.title; readyMade preserves it. The description comes from the first qualifying paragraph in both runtime and release, so help-first markup needs deliberate semantics. No broad SEO refactor is required. Added title cleanup, noindex cleanup, redirect-cycle tests, async fragment handling and the urgent-fragment safety rule. Contact values and notes are separate; the shared sms helper does not derive keywords from notes and wayOf collapses chat/web.
5. **Scope and evidence:** retained the official October 2026 YouVersion report (independently opened in this review) and qualified keyword/ranking assertions as qualitative evidence. Removed automatic capture/commit/IndexNow language. Future shared-generator use depends on a compatible actual API and must not implement another chain. Content may split into more files rather than becoming unreadable to meet a line cap. No new paid authoring jobs or runtime model calls are authorized.

### Current official source checks (2026-11-08)

- [YouVersion, 6 October 2026](https://www.youversion.com/news/anxiety-hope-and-healing-youversion-reveals-what-the-world-is-searching-for-in-the-bible-this-year): opened successfully; supports anxiety/hope/healing among top searches and Psalm 91 as the most-searched term. It measures Bible App searches, not Google keyword volumes or treatment outcomes.
- [988](https://988lifeline.org/) and [helping someone](https://988lifeline.org/help-someone-else/), [AFSP](https://afsp.org/how-to-talk-safely-about-suicide/): opened; support access to crisis help and calm, hopeful, nonjudgmental language.
- [The Hotline internet safety](https://www.thehotline.org/plan-for-safety/internet-safety/) and [get help](https://www.thehotline.org/get-help/): opened; support device-monitoring warnings, quick exit and live-advocate contacts. A separately attempted couples-counselling article URL was inaccessible; that page is not cited as verified.
- [Veterans Crisis Line](https://www.veteranscrisisline.net/), [Crisis Text Line](https://www.crisistextline.org/), [Childhelp](https://childhelphotline.org/), [RAINN hotline](https://rainn.org/hotline), [Find A Helpline](https://findahelpline.com/), [911.gov](https://www.911.gov/calling-911/): opened; compare rendered contacts/notes and service scope with life.json before implementation completion. One guessed RAINN URL failed; the actual directory URL redirected successfully to its current hotline page. Childhelp explicitly distinguishes itself from reporting and emergency services.
- [NIMH depression](https://www.nimh.nih.gov/health/publications/depression) and [NHS self-harm help](https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/self-harm/getting-help/): opened; professional support is distinct from devotional reading. Do not copy UK emergency numbers into US-labelled resources.
- [SAMHSA National Helpline](https://www.samhsa.gov/find-help/helplines/national-helpline): direct opens returned 403; official search-index excerpt supports 24/7 treatment referral/information and says it does not provide counselling. Treat this as partial verification, not a successful full-page/contact audit; recheck before relying on its precise contact details.
- [Baptist Faith and Message 2000](https://bfm.sbc.net/bfm2000/): opened and compared with the local doctrinal boundaries. Bible examples are not clinical evidence.
- Earlier research links (2025/2024 news, Gideon lists, comparison blogs, Action Alliance and SAVE documents) were not all reverified. Retained as historical research leads, not newly certified facts or proof that all competing pages omit help. No search-volume audit, licensed clinical review, live helpline test or browser verification is claimed.

### Remaining implementation acceptance checks

Write and review the final 33 introductions/notes and exact Scripture excerpts; validate the data, contacts, accessible help, privacy behavior, metadata, routing and sharing described in 9.4; run the required site tests and build in sequence 33 step 13. These are implementation acceptance checks, not unfinished review delivery. The owner has authorized browser checks on the existing preview at http://127.0.0.1:8931 for the recovery chains; use that preview without another listener or replacement tree. Protected commits remain a supervisor operation; publication is not authorized. No implementation or browser verification is claimed by this review recovery.
