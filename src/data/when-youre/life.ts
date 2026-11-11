// Pages for life's pressures (design 3.2, 4.2, 4.5): out of work, money worries, addiction, a big decision, frightening
// times. None promises work, money or recovery (design 2.5 rule 1); the addiction page keeps clinical care distinct.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { CLINICAL, COMMUNITY, FOOD } from "./help";
import type { WhenTopic } from "./types";

const CONTENTMENT = { slug: "contentment", title: "Contentment" };
const PROTECTION = { slug: "protection", title: "Protection" };

export const LIFE_TOPICS: WhenTopic[] = [
  {
    slug: "out-of-work",
    group: "life",
    label: "Out of work",
    heading: "What the Bible Says When You're Out of Work",
    searchTitle: "Bible Verses for Job Loss and Unemployment",
    intro: "When you're out of work, after a layoff, a firing or months of applications with no reply, the Bible speaks to the fear, the shame and the practical needs. These verses are for the job search, the bills and the question of who you are without your work. God knows what you need.",
    passages: [
      sp("MAT 6:31-33", "card", "Your Father knows what you need.", {
        context: "Not a promise of wealth: your Father knows what you need, and his kingdom comes first.",
      }),
      sp("PHP 4:19", "card", "God will supply every need.", { context: CONTEXT.needs }),
      sp("PSA 23:1", "card", "The Shepherd who provides."),
      sp("PRO 16:3", "card", "Commit your work to the LORD.", { context: CONTEXT.proverbs }),
      sp("PSA 37:5", "card", "Commit your way to the LORD, and trust him."),
      sp("LAM 3:22-23", "card", "Mercies new every morning, job-search mornings too."),
      sp("COL 3:23-24", "card", "Whatever work you find, do it for the Lord."),
      sp("PSA 37:1-7", "reading", "Trust in the LORD and do good; be still and wait for him."),
      sp("RUT 2:1-12", "reading", "Ruth gleans in Boaz's field.", {
        context: "God's law let the poor gather grain at the edges of fields; Ruth's provision came through someone's generosity. Accepting help is not shameful.",
      }),
      sp("PSA 90:17", "blessing", "Asking God to establish the work of your hands."),
    ],
    note: `Losing work can hit everything at once: money, routine, the people you saw every day, and your sense of who you are. It is right to grieve it. It is not a mark of failure.

Your worth is not your job. It was given to you by God, who made you and knows what you need (Matthew 6:32). Jesus' words about seeking God's kingdom first are not a promise of wealth or of a particular job; they are an invitation to trust the Father who feeds the birds while you do the work in front of you.

So take one practical step each day: one application, one call, one conversation. Commit your plans to the LORD (Proverbs 16:3) and do the next thing with all your heart. Tell your church; people there may know of work, and they will want to pray.

Accepting help is not shameful. Ruth gathered grain in Boaz's field under a law God gave so that the poor could eat, and her provision came through someone's generosity. The community-services line and food banks below are there for times like this.`,
    help: { level: "foot", entries: [COMMUNITY, FOOD] },
    topics: [{ slug: "labor", title: "Labor" }, { slug: "industry", title: "Industry" }, CONTENTMENT],
    related: ["money-worries", "discouraged", "big-decision"],
    elsewhere: [{ href: "/prayers/looking-for-work", title: "A prayer while looking for work" }],
    words: ["job loss", "lost my job", "laid off", "fired", "unemployed", "unemployment", "redundant", "looking for work", "job search"],
  },
  {
    slug: "money-worries",
    group: "life",
    label: "Money worries",
    heading: "What the Bible Says When You're Worried About Money",
    searchTitle: "Bible Verses for Financial Hardship and Debt",
    intro: "When you're worried about money, with bills you cannot pay, debt that keeps growing or not enough for food, the Bible speaks to the fear and points to a God who meets needs. It does not promise wealth, and neither does this page. These verses are for the kitchen table, the bank statement and the sleepless night.",
    passages: [
      sp("PHP 4:19", "card", "God will supply every need.", { context: CONTEXT.needs }),
      sp("MAT 6:33", "card", "Seek first the kingdom."),
      sp("HEB 13:5", "card", "Content, because God will never leave you."),
      sp("PSA 34:10", "card", "Those who seek the LORD lack no good thing."),
      sp("PRO 3:5-6", "card", "Trusting the LORD rather than your own understanding.", { context: CONTEXT.proverbs }),
      sp("1TI 6:6-8", "card", "Godliness with contentment."),
      sp("2CO 9:8", "card", "God is able to provide what you need."),
      sp("LUK 12:22-31", "reading", "The ravens and the lilies: your Father knows."),
      sp("1KI 17:8-16", "reading", "A widow's last meal, and enough day by day.", {
        context: "A widow with one meal left; enough came, day by day.",
      }),
      sp("PRO 30:8-9", "blessing", "A prayer for neither poverty nor riches."),
    ],
    note: `Money fear is heavy, and it is often hidden. People feel ashamed to say they cannot pay, and so they carry it alone. You do not have to.

God promises to meet the needs of his people (Philippians 4:19). He does not promise to make anyone rich, and the site does not teach otherwise. Paul learned to be content with little or with much, and Jesus told his followers not to be anxious about food and clothing, because their Father knows they need them (Luke 12:30). The widow of Zarephath had one meal left; there was enough, day by day.

Take one practical step today. List what you owe and what comes in. Call one creditor and ask about a plan. Talk to someone you trust; many churches help quietly with bills and food, and some have people who can help with budgets and debt.

Accept help when it is offered, and look for it when it is not. The community-services line and food banks below are there for exactly this, and using them is not a failure. The prayer of Proverbs 30 asks for neither poverty nor riches, only daily bread.`,
    help: { level: "foot", entries: [COMMUNITY, FOOD, "usda-national-hunger-hotline"] },
    topics: [{ slug: "poverty", title: "Poverty" }, { slug: "debt", title: "Debt" }, CONTENTMENT],
    related: ["out-of-work", "anxious", "cant-sleep"],
    words: ["money", "money worries", "debt", "bills", "broke", "can't pay", "financial", "poverty", "rent", "food"],
  },
  {
    slug: "addiction",
    group: "life",
    label: "Addiction",
    heading: "What the Bible Says When You're Struggling with Addiction",
    searchTitle: "Bible Verses for Addiction and Recovery",
    intro: "When you're struggling with addiction, to alcohol, drugs, gambling or something else that has taken hold, the Bible speaks of freedom, of a way out, and of a God who does not give up on you when you slip. These verses are for the fight and for the people who walk it with you. Help from people is listed on this page too.",
    passages: [
      sp("1CO 10:13", "card", "A way out, and others who have faced the same.", { context: CONTEXT.wayOut }),
      sp("2CO 5:17", "card", "In Christ, a new creation."),
      sp("GAL 5:1", "card", "Christ has set us free."),
      sp("JHN 8:36", "card", "Free indeed."),
      sp("PSA 40:1-3", "card", "Lifted out of the pit, with a new song."),
      sp("1JN 1:9", "card", "If you slip, confess, and be forgiven.", { context: CONTEXT.confession }),
      sp("JAS 5:16", "card", "Confess to one another and pray for one another.", {
        context: "James calls believers to confession and prayer. This is spiritual counsel, not evidence of a recovery group's medical effectiveness; clinical treatment and peer support have distinct roles.",
      }),
      sp("ROM 7:15-25", "reading", "Doing what you do not want to do, and thanks to God through Christ.", {
        context: "Paul describes the struggle with sin and ends with thanks to God through Jesus Christ. Christians differ over the speaker's situation in this passage; it does not diagnose Paul with addiction or reduce a substance-use disorder to a failure to resist temptation.",
      }),
      sp("PSA 40:1-5", "reading", "Waiting, rescue and a firm place to stand."),
      sp("PSA 51:10", "blessing", "A prayer for a clean heart and a steadfast spirit."),
    ],
    person: {
      id: "paul-act-7-58",
      line: "Paul wrote honestly about the struggle with sin, doing what he did not want to do (Romans 7:19). His words are not about addiction, but they are honest about how hard the fight can be.",
    },
    note: `Addiction is not beyond God's reach, and it is not something to fight alone. If you have tried to stop and could not, that is not proof that you are weak or that God has given up on you. Paul wrote honestly of doing what he did not want to do, and ended with thanks to God through Jesus Christ (Romans 7:15–25).

Recovery usually needs more than willpower. It can involve medical care, professional treatment and the support of people who understand: a recovery group, a pastor, a few trusted friends. A church or peer group is a real help, but it does not replace clinical care, and the help below includes both.

Some substances are dangerous to stop suddenly. Talk to a doctor or the national helpline below before you do. If you or someone else is in medical danger, get emergency help now.

If you slip, come back. Confess it to God, who is faithful and just to forgive (1 John 1:9), tell someone who is walking with you, and take the next step. In Christ there is freedom (Galatians 5:1), and it is often walked out one day at a time.`,
    help: { level: "line", entries: ["celebrate-recovery", CLINICAL, "samhsa-helpline"] },
    topics: [{ slug: "drunkenness", title: "Drunkenness" }, { slug: "temptation", title: "Temptation" }, { slug: "self-control", title: "Self-control" }],
    related: ["tempted", "guilty", "depressed"],
    words: ["addiction", "addicted", "alcohol", "drinking", "drugs", "gambling", "recovery", "relapse", "sober", "sobriety", "opioids"],
  },
  {
    slug: "big-decision",
    group: "life",
    label: "A big decision",
    heading: "What the Bible Says When You're Facing a Big Decision",
    searchTitle: "Bible Verses for Guidance and Decisions",
    intro: "When you're facing a big decision, about work, a move, a relationship or a path you cannot undo, the Bible promises wisdom to those who ask and speaks of a God who guides people who listen. These verses are for weighing choices, praying them through and taking the step. You do not need to be certain to be faithful.",
    passages: [
      sp("PRO 3:5-6", "card", "Trust the LORD with all your heart, and he will make your paths straight.", { context: CONTEXT.proverbs }),
      sp("JAS 1:5", "card", "Ask God for wisdom, and he gives generously."),
      sp("PSA 32:8", "card", "God's promise to instruct and counsel you."),
      sp("ISA 30:21", "card", "A word behind you: this is the way.", {
        context: "Spoken to a nation that would turn back to God: he guides people who listen.",
      }),
      sp("PRO 16:9", "card", "You plan your way; the LORD directs your steps."),
      sp("PSA 119:105", "card", "A lamp for your feet."),
      sp("PRO 15:22", "card", "Plans succeed with many counsellors."),
      sp("PSA 25:4-10", "reading", "A prayer to be shown God's ways and led in his truth."),
      sp("NEH 2:1-5", "reading", "Nehemiah prays, then answers the king.", {
        context: "Nehemiah prayed in the moment, then answered with a plan; prayer and planning belong together.",
      }),
      sp("PSA 143:8", "blessing", "Asking God to show you which way to go."),
    ],
    person: {
      id: "nehemiah-neh-1-1",
      line: "Nehemiah prayed to God in the moment the king asked what he wanted, and then laid out a clear plan (Nehemiah 2:4–5).",
    },
    note: `God promises wisdom to anyone who asks for it (James 1:5). He usually gives it through ordinary means: Scripture, prayer, the counsel of wise people (Proverbs 15:22), and the circumstances he places you in. He rarely gives it through a sign in the sky, and you do not need one.

So pray, and be honest with God about what you hope for and what you fear. Plan: write down the options and what each would mean. Ask people who know you and love God what they see. Then step. Nehemiah prayed in the moment before he answered the king, and then gave a clear plan; prayer and planning belong together.

Proverbs says that a person plans their way, but the LORD directs their steps (Proverbs 16:9). That is not a reason to be frozen; it is a reason to be free. If both paths honour God, you may choose either, and he will be with you on the one you take.

You do not need to be certain to be faithful. You need to trust the one who leads you.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "decision", title: "Decision" }, { slug: "waiting-upon-god", title: "Waiting Upon God" }, { slug: "prayer", title: "Prayer" }],
    related: ["anxious", "out-of-work", "afraid"],
    elsewhere: [{ href: "/prayers/big-decision", title: "A prayer for a big decision" }],
    words: ["decision", "decide", "choice", "choosing", "guidance", "direction", "god's will", "crossroads", "which way"],
  },
  {
    slug: "troubled-times",
    group: "life",
    label: "Frightening times",
    heading: "What the Bible Says When the World Feels Frightening",
    searchTitle: "Bible Verses for Troubled Times",
    intro: "When the world feels frightening, with war, disaster, sickness or news that will not stop, the Bible speaks of a God who rules history and is a refuge in trouble. These verses were written in wars, plagues and exile, by people who knew fear of the future. Read one, and look up from the headlines for a while.",
    passages: [
      sp("PSA 46:1-2", "card", "A refuge and strength when the earth itself is shaken."),
      sp("JHN 16:33", "card", "Trouble in the world, and Jesus who has overcome it."),
      sp("PSA 91:1-2", "card", "Dwelling in the shelter of the Most High.", { context: CONTEXT.psalm91 }),
      sp("ISA 26:3", "card", "Perfect peace for a mind kept on God."),
      sp("PSA 112:7", "card", "Not afraid of bad news.", { context: CONTEXT.badNews }),
      sp("PSA 27:1", "card", "With the LORD as your light and your stronghold."),
      sp("2TI 1:7", "card", "Power, love and self-control in place of fear."),
      sp("PSA 91:1-16", "reading", "The whole psalm of trust in God's protection, read in context.", { context: CONTEXT.psalm91 }),
      sp("PSA 46:1-11", "reading", "God our refuge, though nations rage.", { context: CONTEXT.beStill }),
      sp("HAB 3:17-19", "reading", "Though the harvests fail, yet I will rejoice in the LORD."),
      sp("PSA 86:11", "blessing", "Asking God for an undivided heart."),
    ],
    person: {
      id: "habakkuk-hab-1-1",
      line: "Habakkuk asked God “how long?” as violence filled his land, and ended his book resolving to rejoice in the LORD though the harvests failed (Habakkuk 1:2; 3:17–18).",
    },
    note: `News can make the whole world feel out of control: wars, disasters, illness, elections, prices. It is natural to be afraid. Scripture was written in times like these, through invasions, famines and exile, and its people trusted a God who rules history, even when it did not look like it. Psalm 46 calls God our refuge and strength, and says we will not fear though the earth itself is shaken.

Psalm 91 is the psalm people search for most in frightening times. It is a song of trust in God's protection, but it is not a promise that nothing hard will ever touch a believer; when the devil quoted it to Jesus, Jesus refused to use it that way. Its promise is God's presence in trouble and his final keeping.

Jesus told his disciples plainly that in this world they would have trouble, and to take heart, because he has overcome the world (John 16:33).

Some practical steps: limit how much news you take in, especially at night. Pray for the world by name. Then do one good thing near you: a meal for a neighbour, a call to someone alone. Fear shrinks when love has something to do.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "trouble", title: "Trouble" }, PROTECTION, { slug: "refuge", title: "Refuge" }],
    related: ["afraid", "anxious", "cant-sleep"],
    words: ["war", "news", "world", "disaster", "end times", "future", "fear of the future", "pandemic", "psalm", "politics"],
  },
];
