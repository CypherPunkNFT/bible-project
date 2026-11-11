// Blessings for the home, group 4: the Bible's own blessings (design 3.3, 4.2), Numbers 6:24–26 first. Scripture only,
// each with one line on who said it and to whom.
import { sp } from "../sympathy/types";
import { GUARD_NOTE, priestlyBlessing, scripture, TOPICS } from "./shared";
import type { BlessingPage } from "./types";

const BOTH = ["wall", "cards"] as const;
const both = () => [...BOTH];

export const SCRIPTURE_PAGES: BlessingPage[] = [
  {
    slug: "scripture-blessings",
    group: "scripture",
    label: "Blessings from the Bible",
    heading: "Blessings from the Bible",
    searchTitle: "Bible Blessings to Say at Home, Like Numbers 6",
    intro: "Blessings from the Bible to say at home, over your family or a friend: the blessing God gave the priests of Israel in Numbers 6:24–26, and nine more, each with a line on who first said it and to whom. Print one for the wall or as cards, copy it into a message, or send it to someone who needs a blessing today.",
    items: [
      scripture(priestlyBlessing("The blessing God gave his people."), both(), "The priests of Israel spoke this over the people at God's command (Numbers 6:22–27). Christians have said it over one another, and over their children, ever since."),
      scripture(sp("2CO 13:14", "card", "Father, Son and Holy Spirit."), both(), "Paul's closing words to the church in Corinth, naming the Father, the Son and the Holy Spirit together."),
      scripture(sp("ROM 15:13", "card", "Joy, peace and hope."), both(), "Paul's prayer for the Christians in Rome, near the end of his letter to them."),
      scripture(sp("2TH 3:16", "card", "The Lord of peace."), both(), "Paul's farewell to the church in Thessalonica, a young church going through hard times."),
      scripture(sp("1TH 5:23", "card", "Kept whole."), both(), "Paul's blessing at the end of his first letter to the Thessalonians."),
      // 61 words: one over the cards limit (design 6.1), so the wall print only.
      scripture(sp("HEB 13:20-21", "card", "The God of peace equips us."), ["wall"], "The closing blessing of the letter to the Hebrews, written to Christians tempted to give up."),
      scripture(sp("JUD 1:24-25", "card", "The God who keeps us from stumbling."), both(), "Jude ends his short letter by giving glory to the God who keeps his people."),
      scripture(sp("EPH 3:20-21", "card", "More than we ask or imagine."), both(), "Paul ends his prayer for the Ephesians by praising God, who can do far more than we ask."),
      scripture(sp("PSA 121:7-8", "card", "The LORD who watches over us.", { context: GUARD_NOTE }), both(), "A song for pilgrims on the road to Jerusalem."),
      scripture(sp("PSA 134:3", "card", "A blessing from Zion."), both(), "The last of the songs pilgrims sang on the way up to Jerusalem, a blessing for those who served in the temple by night."),
    ],
    topics: [TOPICS.benedictions, TOPICS.blessing, TOPICS.peace],
    related: ["blessing-your-children", "house-blessing", "bedtime"],
    elsewhere: [{ href: "/prayers/closing-a-meeting", title: "Prayers to close a meeting, with Numbers 6 for church use" }],
  },
];
