// Growing and working: first day of school, graduation, new job, retirement. Notes written for each event (design 4.2–4.4).
import { p, type LifeEvent } from "./types";

const JOSHUA_CONTEXT =
  "Said to Joshua as he led Israel into the land; the courage it calls for rests on God's presence, which the New Testament promises to every believer (Matthew 28:20).";
const AARON = "Aaron's blessing, to speak or write over someone setting out.";

export const GROWING_EVENTS: LifeEvent[] = [
  {
    slug: "back-to-school",
    family: "growing",
    heading: "Back to School Bible Verses",
    short: "First day of school",
    intro:
      "These back to school Bible verses are short and easy to remember, chosen for a child, a teenager or a student starting a new school year, and for the parents and teachers praying for them. They speak of wisdom that begins with the Lord, courage for new places, and working at everything as for him. Every verse is short enough for a lunchbox note, a bookmark or a small card, and each comes in the Berean Standard Bible with a line on why it fits the first day.",
    passages: [
      p("PRO 1:7", "card", "Where real learning starts: the fear of the Lord is the beginning of knowledge."),
      p("PRO 2:6", "card", "Wisdom, knowledge and understanding come from the Lord."),
      p("JAS 1:5", "card", "Ask God for wisdom when a lesson is hard; he gives generously."),
      p("PHP 4:6-7", "card", "For first-day nerves: pray about everything, and God's peace will guard you."),
      p("JOS 1:9", "card", "Be strong and courageous in a new place: the Lord is with you.", { context: JOSHUA_CONTEXT }),
      p("COL 3:23", "card", "Homework and all: work at it with all your heart, as for the Lord."),
      p("DAN 1:17", "card", "Four young students to whom God gave knowledge and understanding.", {
        context: "Daniel and his friends studied faithfully in a foreign school while staying loyal to God.",
      }),
      p("LUK 2:52", "card", "Jesus grew in wisdom and stature, and in favour with God and people."),
      p("1TI 4:12", "card", "Let no one look down on you for being young: be an example."),
      p("PSA 32:8", "card", "God's promise to instruct and teach you in the way you should go."),
      p("ISA 41:10", "card", "Do not fear, for I am with you: for any new beginning."),
      p("PRO 3:5-6", "card", "Trust the Lord, not your own understanding, in every new step."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "Have a wonderful first day", inside: "Praying for you today and all this year.", names: 1, date: false, ornament: "book" },
    topics: [{ slug: "wisdom", title: "Wisdom" }, { slug: "instruction", title: "Instruction" }, { slug: "school", title: "School" }, { slug: "children", title: "Children" }],
    related: ["graduation", "new-job"],
  },
  {
    slug: "graduation",
    family: "growing",
    heading: "Graduation Bible Verses",
    short: "Graduation",
    intro:
      "These graduation Bible verses are for a student finishing high school, college or any course of study, and for the family and friends writing in their card. They give thanks for what has been finished and look ahead with trust: pressing on toward the goal, committing plans to the Lord, walking humbly with God. There is a reading for a graduation service or party, many short verses for a card, and a blessing. Each verse is in the Berean Standard Bible, with an honest note where a favourite is often read as a promise of success.",
    passages: [
      p("PHP 3:13-14", "reading", "Forgetting what is behind and pressing on toward the goal: one finish line, and the race goes on."),
      p("PRO 3:5-6", "card", "The classic graduation verse: trust the Lord with the paths ahead."),
      p("JER 29:11", "card", "God's good purposes for his people, for someone facing an unknown future.", {
        context: "Spoken to Judah in exile, with seventy years still to wait (29:10); its promise is God's faithfulness to his people over the long haul, not a guarantee of a smooth career.",
      }),
      p("JOS 1:9", "card", "Courage for the next place you go, because God goes too.", { context: JOSHUA_CONTEXT }),
      p("PHP 1:6", "card", "The one who began a good work in you will carry it on to completion."),
      p("MIC 6:8", "card", "What the Lord requires, whatever career comes next."),
      p("COL 3:23-24", "card", "Whatever you do next, work at it for the Lord."),
      p("PRO 16:3", "card", "Commit your works to the Lord as you make plans."),
      p("PRO 16:9", "card", "We plan our course, and the Lord directs our steps."),
      p("ECC 12:1", "card", "Remember your Creator in the days of your youth."),
      p("ECC 12:13", "card", "The conclusion of all study: fear God and keep his commandments."),
      p("1TI 4:12", "card", "Young, and an example to others in speech, conduct, love, faith and purity."),
      p("ISA 40:31", "card", "Those who wait on the Lord will renew their strength."),
      p("PSA 90:17", "card", "A prayer that God will establish the work of the graduate's hands."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "Congratulations, graduate", inside: "So proud of all you have finished, and praying for all that is ahead.", names: 1, date: true, ornament: "mortarboard" },
    topics: [{ slug: "wisdom", title: "Wisdom" }, { slug: "young-men", title: "Young Men" }, { slug: "diligence", title: "Diligence" }],
    related: ["back-to-school", "new-job"],
  },
  {
    slug: "new-job",
    family: "growing",
    heading: "Bible Verses for a New Job",
    short: "New job",
    intro:
      "These Bible verses for a new job are for someone starting work, changing careers or taking on a new role, and for the friends sending good wishes. They treat work as a calling from the first garden onward: done wholeheartedly, as for the Lord, with skill and with contentment. There is a reading on contentment, short verses for a card or a desk, and a blessing on the work of their hands. Each verse is in the Berean Standard Bible, with honest notes where a verse is often read as a promise of wealth.",
    passages: [
      p("PHP 4:11-13", "reading", "Paul's secret of contentment in plenty and in want, for a new job and every season of work.", {
        context: "Paul's secret of contentment in want and in plenty: \"I can do all things\" (4:13) is strength to be content in either, not a promise of success at anything we try.",
      }),
      p("COL 3:23-24", "card", "Work at it with all your heart, as working for the Lord."),
      p("PRO 16:3", "card", "Commit your work to the Lord, and your plans will be established."),
      p("PRO 22:29", "card", "Skill in your work is noticed: a verse for the first day."),
      p("ECC 9:10", "card", "Whatever your hands find to do, do it with all your might."),
      p("GEN 2:15", "card", "Work was part of God's good design before anything went wrong."),
      p("DEU 8:18", "card", "Remember the Lord who gives the strength to earn a living.", {
        context: "God gives the ability to earn \"to confirm His covenant\": a call to remember him in plenty, not a promise of riches.",
      }),
      p("1CO 10:31", "card", "Whatever you do, do it all to the glory of God."),
      p("MAT 6:33", "card", "Seek first God's kingdom, and trust him for the rest.", {
        context: "\"All these things\" are the food, drink and clothing of 6:31–32: God's care for daily needs, not a promise of wealth.",
      }),
      p("EPH 6:7", "card", "Serve with good will, as to the Lord and not to people."),
      p("JOS 1:9", "card", "Courage for a new workplace: the Lord is with you.", { context: JOSHUA_CONTEXT }),
      p("PSA 90:17", "blessing", "A blessing on the work of their hands, short enough for a card too."),
    ],
    card: { heading: "On your new job", inside: "Wishing you joy in the work, and praying God blesses it.", names: 1, date: false, ornament: "key" },
    topics: [{ slug: "industry", title: "Industry" }, { slug: "diligence", title: "Diligence" }, { slug: "labor", title: "Labor" }, { slug: "contentment", title: "Contentment" }],
    related: ["graduation", "retirement"],
  },
  {
    slug: "retirement",
    family: "growing",
    heading: "Retirement Bible Verses",
    short: "Retirement",
    intro:
      "These retirement Bible verses are for someone finishing a long working life, and for the colleagues, church and family who want to honour them. Scripture does not picture retirement as the end of usefulness: the righteous still bear fruit in old age, Caleb asked for a mountain at eighty-five, and the Levites who retired kept helping their brothers. There are readings for a retirement gathering, short verses for a card, and a blessing. Each is in the Berean Standard Bible, with a line on why it fits.",
    passages: [
      p("PSA 92:12-15", "reading", "The righteous still bearing fruit in old age, green and full of sap."),
      p("PSA 71:17-18", "reading", "A prayer to keep declaring God's power to the next generation, even when old and grey."),
      p("JOS 14:10-12", "reading", "Caleb, still strong at eighty-five, asks for the hill country: a new chapter, not an ending."),
      p("TIT 2:2-5", "reading", "What older men and women can still give: example, teaching and encouragement."),
      p("NUM 8:25-26", "reading", "The Levites retire from heavy work at fifty but keep helping their brothers.", {
        context: "The Levites retired from the heavy work at fifty but kept helping their brothers: the one place the Bible speaks of retiring, and it is a change of service, not an end to it.",
      }),
      p("ISA 46:4", "card", "Even to your old age and grey hairs, God will carry you."),
      p("PRO 16:31", "card", "Grey hair, a crown of splendour gained in a righteous life."),
      p("MAT 25:21", "card", "\"Well done, good and faithful servant\": for a long and faithful service.", {
        context: "From the parable of the talents: the master's words at the end of faithful service, which we long to hear from Christ.",
      }),
      p("PSA 90:12", "card", "Teach us to number our days: for the years now opening up."),
      p("ECC 3:1", "card", "A season for everything, and a new one beginning."),
      p("2TI 4:7", "card", "Fought the good fight, finished the race, kept the faith.", {
        context: "Paul wrote this near the end of his life; used here for finishing a long work well.",
      }),
      p("PSA 90:17", "blessing", "A blessing on the work still to come."),
    ],
    card: { heading: "Happy retirement", inside: "Thanking God for your years of work, and for all that is still ahead.", names: 1, date: false, ornament: "tree" },
    topics: [{ slug: "old-age", title: "Old Age" }, { slug: "aged", title: "Aged" }, { slug: "labor", title: "Labor" }],
    related: ["new-job", "graduation"],
  },
];
