// Prayers for occasions, group 6: church and Scripture (design 3.2, 4.3). These prayers say "we" and "us", for a
// leader to pray aloud in a group. The closing page ends with a blessing from Scripture shown as Scripture.
import { sp } from "../sympathy/types";
import { priestlyBlessing, T } from "./shared";
import type { Occasion } from "./types";

const openEyes = (note: string) => sp("PSA 119:18", "card", note);
const askWisdom = (note: string) => sp("JAS 1:5", "card", note);
const equip = (note: string) => sp("HEB 13:20-21", "card", note);
const grace = (note: string) => sp("2CO 13:14", "card", note);
const keepFromStumbling = (note: string) => sp("JUD 1:24-25", "card", note);
const lamp = (note: string) => sp("PSA 119:105", "card", note);
const godBreathed = (note: string) => sp("2TI 3:16-17", "card", note);
const wordIsTruth = (note: string) => sp("JHN 17:17", "card", note);
const GATHERING_NOTE =
  "Some open with Matthew 18:20 (“where two or three gather in My name”), but that verse is about settling a wrong between believers in the church. God is gladly with his people when they meet; this page roots that in other verses.";
const wordDwell = (note: string) => sp("COL 3:16-17", "card", note, { context: GATHERING_NOTE });
const MEETING_TOPICS = [T.prayer, T.benedictions, T.wordOfGod];

export const CHURCH_OCCASIONS: Occasion[] = [
  {
    slug: "opening-a-meeting",
    group: "church",
    label: "Opening a meeting",
    heading: "An Opening Prayer for a Meeting or Bible Study",
    searchTitle: "Opening Prayer for a Meeting or Bible Study",
    intro: "An opening prayer for a Bible study, small group, church meeting or work meeting, for anyone asked to “open in prayer”. It is short enough to read aloud, says “we” for the whole group, and asks God for open eyes, wisdom and words that honour him. One is for a Bible study and one is for any meeting.",
    prayers: [
      {
        id: "bible-study",
        label: "To open a Bible study",
        text: "Father, thank you for bringing us together around your word. Open our eyes, so that we may see wonderful things in it. Let the word of Christ live richly among us as we read, talk and teach one another. Give us wisdom where we are puzzled, because you give it generously to all who ask. Let everything we say and do here be done in the name of the Lord Jesus, with thankful hearts. In Jesus' name, amen.",
        rootedIn: [
          openEyes("Open eyes for the word."),
          wordDwell("The word of Christ dwelling richly in a group."),
          askWisdom("Wisdom where the passage puzzles us."),
        ],
      },
      {
        id: "meeting",
        label: "To open any meeting",
        text: "Lord, we bring this meeting to you before we begin: the agenda, the decisions and the people around this table. Give us wisdom for what we have to decide, because you give it generously and without finding fault. Let our words be gracious, so that we know how to answer one another. Whatever we do here, in word or deed, let us do it all in the name of the Lord Jesus, giving thanks to you. In Jesus' name, amen.",
        rootedIn: [
          askWisdom("Wisdom for decisions."),
          sp("COL 4:6", "card", "Gracious words in a meeting."),
          wordDwell("Everything in word or deed in Jesus' name."),
        ],
      },
    ],
    historic: "bcp-purity",
    topics: MEETING_TOPICS,
    related: ["closing-a-meeting", "before-reading-the-bible", "speaking-in-public"],
    words: ["opening prayer", "open in prayer", "bible study", "small group", "sunday school", "devotion", "devotional", "church meeting", "meeting", "youth group", "staff meeting"],
  },
  {
    slug: "closing-a-meeting",
    group: "church",
    label: "Closing a meeting",
    heading: "A Closing Prayer for a Meeting or Bible Study",
    searchTitle: "Closing Prayer for a Meeting or Bible Study",
    intro: "A closing prayer for a meeting or Bible study, to send the group out at the end of the evening. It asks God to equip everyone to do his will, to keep them from stumbling, and to let his grace go with them. One is for a Bible study, one is for any meeting, and there is a blessing from Scripture to end with.",
    prayers: [
      {
        id: "bible-study",
        label: "To close a Bible study",
        text: "Father, thank you for this time in your word together. As we go, equip us with every good thing to do your will, and work in us what pleases you, through Jesus Christ. Keep us from stumbling this week, and keep us until you bring us before you with great joy. May the grace of the Lord Jesus Christ, the love of God, and the fellowship of the Holy Spirit be with each of us. To you be glory, now and forever. In Jesus' name, amen.",
        rootedIn: [
          equip("Equipped to do God's will."),
          keepFromStumbling("Kept from stumbling, and glory to God."),
          grace("Grace, love and fellowship for each one."),
        ],
      },
      {
        id: "meeting",
        label: "To close any meeting",
        text: "Lord, thank you for this meeting and for each person here. Equip us with every good thing to do your will in what we have decided, and work in us what is pleasing to you. May the grace of the Lord Jesus Christ, the love of God and the fellowship of the Holy Spirit go with us as we leave. Keep us from stumbling, and to you, the only God our Saviour, be glory through Jesus Christ our Lord. Amen.",
        rootedIn: [
          equip("Equipped for what was decided."),
          grace("Grace to go with everyone."),
          keepFromStumbling("Glory to the only God our Saviour."),
        ],
      },
    ],
    scriptureBlessing: priestlyBlessing("A blessing from Scripture to end with, said over the group."),
    topics: MEETING_TOPICS,
    related: ["opening-a-meeting", "before-reading-the-bible"],
    words: ["closing prayer", "close in prayer", "dismissal", "benediction", "end of meeting", "bible study", "small group", "sunday school", "meeting"],
  },
  {
    slug: "before-reading-the-bible",
    group: "church",
    label: "Before reading the Bible",
    heading: "A Prayer Before Reading the Bible",
    searchTitle: "Prayer Before Reading the Bible",
    intro: "A prayer before reading the Bible, on your own in the morning or with a group before a passage or a sermon. It asks God to open your eyes to his word, to let it light your path, and to use it to teach, correct and train you. One is for you, and one is for a group reading together.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am opening your word. Open my eyes, so that I may see wonderful things in it. Let it be a lamp to my feet and a light to my path today. All Scripture is breathed out by you: teach me, correct me where I am wrong, and train me in what is right, so that I am ready for every good work. Your word is truth: make me holy by it. In Jesus' name, amen.",
        rootedIn: [
          openEyes("Open eyes for wonderful things."),
          lamp("A lamp and a light."),
          godBreathed("Teaching, correction and training."),
          wordIsTruth("Made holy by the truth."),
        ],
      },
      {
        id: "group",
        label: "For a group",
        text: "Father, we are about to read your word together. Open our eyes to see wonderful things in it. Let it be a lamp for our feet and a light on our path. Use it to teach us, correct us and train us in what is right, so that each of us is equipped for every good work. Your word is truth: set us apart by it, and help us to hear it gladly. In Jesus' name, amen.",
        rootedIn: [
          openEyes("Eyes opened together."),
          lamp("Light for the path."),
          godBreathed("Equipped for every good work."),
          wordIsTruth("Set apart by the truth."),
        ],
      },
    ],
    historic: "bcp-advent-2",
    topics: [T.scriptures, T.wordOfGod, T.prayer],
    related: ["opening-a-meeting", "closing-a-meeting"],
    words: ["reading the bible", "bible reading", "before reading", "quiet time", "devotions", "sermon", "before a sermon", "scripture"],
  },
];
