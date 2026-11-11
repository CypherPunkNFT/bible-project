// Prayers for occasions, group 5: journeys and seasons (design 3.2, 4.3). Every request in a prayer rests on a verse
// listed beneath it, checked line by line as design 4.5 models. Psalm 121:7–8 always carries its note (shared.ts).
import { sp } from "../sympathy/types";
import { guarded, newMercies, priestlyBlessing, STEPS_NOTE, T } from "./shared";
import type { Occasion } from "./types";

const withYou = (note: string) => sp("JOS 1:9", "card", note);
const handHolds = (note: string) => sp("PSA 139:9-10", "card", note);
const numberDays = (note: string) => sp("PSA 90:12", "card", note);
const knitTogether = (note: string) => sp("PSA 139:13-14", "card", note);
const daysWritten = (note: string) => sp("PSA 139:16", "card", note);
const withYouAlways = (note: string) => sp("MAT 28:19-20", "card", note);
const witnesses = (note: string) => sp("ACT 1:8", "card", note);
const openDoor = (note: string) => sp("COL 4:3", "card", note);
const wordSpread = (note: string) => sp("2TH 3:1", "card", note);

export const JOURNEY_OCCASIONS: Occasion[] = [
  {
    slug: "travel",
    group: "journeys",
    label: "Travel",
    heading: "A Prayer Before a Journey",
    searchTitle: "Prayer for Safe Travel",
    intro: "A prayer for safe travel, before a road trip, a flight or a long journey home. It asks God to watch over your going and your coming, to guide and hold you wherever you are, and to keep you from fear on the way. One is for you as you set out, and one is for someone you love who is travelling.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am setting out on a journey. Watch over my going out and my coming in, and guard me on the way. Whether I go by road, by air or by sea, your hand will guide me and hold me fast. Keep me from fear, because you are with me wherever I go. In all my ways I acknowledge you: make my path straight, and bring me safely to where I am going. In Jesus' name, amen.",
        rootedIn: [
          guarded("Watched over, going and coming."),
          handHolds("Guided and held, even by the farthest sea."),
          withYou("Courage, for God goes with you wherever you go."),
          sp("PRO 3:6", "card", "A straight path for those who acknowledge him."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone travelling",
        forSomeone: true,
        text: "Father, [name] is travelling today. Watch over their going and their coming, and guard them on the way. On the road, in the air or across the sea, let your hand guide them and hold them fast. Give them courage and keep them from fear, because you are with them wherever they go. Make their path straight, and bring them safely there and home again. In Jesus' name, amen.",
        rootedIn: [
          guarded("Guarded on the way."),
          handHolds("Held fast wherever they are."),
          withYou("God with them wherever they go."),
          sp("PRO 3:6", "card", "A straight path."),
        ],
      },
    ],
    historic: "breastplate",
    topics: [T.protection, T.strangers, T.prayer],
    related: ["moving-away", "mission-trip", "deployment"],
    elsewhere: [{ href: "/when-youre/afraid", title: "What the Bible says when you're afraid" }],
    words: ["travel", "safe travel", "trip", "journey", "flight", "flying", "road trip", "drive", "vacation", "holiday", "commute"],
  },
  {
    slug: "deployment",
    group: "journeys",
    label: "Deployment",
    heading: "A Prayer for Someone Deploying",
    searchTitle: "Prayer for a Soldier Being Deployed",
    intro: "A prayer for a soldier being deployed, and for the military family left at home. It asks God to be a shelter and a fortress, to give courage and keep from fear, to help the one serving act justly in hard places, and to bring them safely home. One is for the one deploying, and one is for the family at home.",
    prayers: [
      {
        id: "for-someone",
        label: "For the one deploying",
        forSomeone: true,
        text: "Lord, [name] is deploying, and we are sending them with our love and our prayers. Be their shelter and their fortress, the God they can trust. Give them courage and keep them from fear and discouragement, because you go with them wherever they go. Help them to act justly and to love mercy, even in hard places. Guard their soul, and watch over their going and their coming. Bring them home safely to us. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 91:1-2", "card", "God, a shelter and a fortress.", {
            context: "Trust in God's protection, not a guarantee that no harm will come.",
          }),
          withYou("Courage, for God goes with them."),
          sp("MIC 6:8", "card", "Justice and mercy, even in hard places."),
          guarded("Their going and their coming."),
        ],
      },
      {
        id: "family",
        label: "For the family at home",
        text: "Father, the one we love has gone, and the house feels different. We trust you with them: you are our refuge and our fortress too. Watch over their going and coming, and ours. When we lie awake worrying, help us to be strong and courageous, because you are with us and will never leave us. Give us strength for the ordinary days, and bring us together again. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 91:1-2", "card", "A refuge for the family too.", {
            context: "Trust in God's protection, not a guarantee that no harm will come.",
          }),
          sp("DEU 31:6", "card", "Strong and courageous, for God never leaves."),
          guarded("Watching over every coming and going."),
        ],
      },
    ],
    topics: [T.soldiers, T.protection],
    related: ["travel", "moving-away", "child-leaving-home"],
    elsewhere: [{ href: "/when-youre/afraid", title: "What the Bible says when you're afraid" }],
    words: ["deployment", "deployed", "deploying", "military", "army", "navy", "air force", "marines", "soldier", "troops", "service member"],
  },
  {
    slug: "mission-trip",
    group: "journeys",
    label: "Mission trip",
    heading: "A Prayer Before a Mission Trip",
    searchTitle: "Prayer Before a Mission Trip",
    intro: "A prayer before a mission trip, for a church team about to leave and for someone you love who is going. It asks God for the Spirit's power to be Christ's witnesses, an open door for the word, and the presence Jesus promised to the end of the age. One is for the team to pray together, and one is for someone going.",
    prayers: [
      {
        id: "team",
        label: "For the team",
        text: "Father, Jesus sent his followers to make disciples of all nations, and he promised to be with them always. We go in his name. Fill us with the power of your Holy Spirit to be his witnesses where we are going. Open a door for the word, so that we can make Christ known clearly. Let your word spread quickly and be held in honour. And let us know, every day we are away, that Jesus is with us to the end of the age. In Jesus' name, amen.",
        rootedIn: [
          withYouAlways("Sent, with Jesus' promise to be with us."),
          witnesses("The Spirit's power to be witnesses."),
          openDoor("An open door for the word."),
          wordSpread("The word spreading and honoured."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone going",
        forSomeone: true,
        text: "Father, [name] is going on a mission trip. Send them out in the name of Jesus, who promised to be with his people always. Give them the power of your Holy Spirit to be his witnesses. Open a door for the word where they go, and help them to speak of Christ clearly. Let your word spread and be held in honour. Watch over their going out and their coming in. In Jesus' name, amen.",
        rootedIn: [
          withYouAlways("Jesus with them always."),
          witnesses("Power to be witnesses."),
          openDoor("A door for the word."),
          wordSpread("The word held in honour."),
          guarded("Watched over on the journey."),
        ],
      },
    ],
    historic: "breastplate",
    topics: [T.missions, T.prayer],
    related: ["travel", "opening-a-meeting", "speaking-in-public"],
    elsewhere: [{ href: "/life-events/missionary", title: "Verses and a printable card for a missionary" }],
    words: ["mission trip", "missions", "missionary", "short-term mission", "outreach", "missions team", "evangelism"],
  },
  {
    slug: "new-year",
    group: "journeys",
    label: "New year",
    heading: "A Prayer for the New Year",
    searchTitle: "Prayer for the New Year",
    intro: "A prayer for the new year, to pray on New Year's Eve, on the first morning or at a family table. It thanks God for mercies new every morning, asks him to teach us to number our days, and holds this year's plans lightly in his hands. One is for you, and one is for your household.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, a new year is beginning, and I don't know what it holds. Thank you for every mercy that carried me through the year behind me. Your mercies are new every morning, and your faithfulness is great. Teach me to number my days, so that I gain a heart of wisdom. I will make plans, but help me to hold them lightly and to say, “If the Lord is willing.” You rule over my steps: lead them this year. In Jesus' name, amen.",
        rootedIn: [
          newMercies("Mercies new every morning of the year."),
          numberDays("Numbering our days."),
          sp("JAS 4:14-15", "card", "Plans held lightly: “If the Lord is willing”."),
          sp("PRO 16:9", "card", "Our plans, and God's rule over our steps.", { context: STEPS_NOTE }),
        ],
      },
      {
        id: "household",
        label: "For your household",
        text: "Father, we thank you for bringing our household through another year. Because of your loving devotion we were not consumed, and your mercies have been new every morning. As this year begins, teach us to number our days and to live wisely. We make our plans for this year, but you rule over our steps. If you are willing, we will live and do this or that. Lead us, together, through every day of it. In Jesus' name, amen.",
        rootedIn: [
          newMercies("Not consumed, because of his loving devotion."),
          numberDays("A heart of wisdom for the year."),
          sp("JAS 4:14-15", "card", "Plans held lightly, if the Lord is willing."),
          sp("PRO 16:9", "card", "God determines our steps.", { context: STEPS_NOTE }),
        ],
      },
    ],
    historic: "bcp-grace",
    topics: [T.time, T.thankfulness],
    related: ["birthday", "new-home", "big-decision"],
    elsewhere: [{ href: "/study/the-good-news", title: "The Good News: a fresh start in Jesus" }],
    words: ["new year", "new years eve", "new years", "january", "resolution", "resolutions", "start of the year"],
  },
  {
    slug: "birthday",
    group: "journeys",
    label: "Birthday",
    heading: "A Birthday Prayer",
    searchTitle: "Birthday Prayer for a Friend or Family Member",
    intro: "A birthday prayer for a friend, a son or daughter, a parent or anyone you love, to send with a card or say at the table. It thanks God for making them, asks him to teach them wisdom in the year ahead, and asks his blessing on them. One is for someone you love, and one is for your own birthday.",
    prayers: [
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Lord, today is [name]'s birthday, and I thank you for them. You formed them and knit them together, and they are fearfully and wonderfully made. Every one of their days was known to you before one of them came to be. Teach them to number their days and to grow in wisdom this year. Bless them and keep them; make your face shine on them, be gracious to them, and give them peace. In Jesus' name, amen.",
        rootedIn: [
          knitTogether("Thanks for the person God made."),
          daysWritten("Every day known to God."),
          numberDays("Wisdom for the year ahead."),
          priestlyBlessing("A blessing to send."),
        ],
      },
      {
        id: "for-you",
        label: "On your own birthday",
        text: "Father, today is my birthday. Thank you for making me. You formed me in my mother's womb, and every one of my days was written in your book before one of them came to be. I praise you for the years behind me, the easy and the hard. Teach me to number my days, so that I gain a heart of wisdom for the year ahead. Bless me and keep me, and give me your peace. In Jesus' name, amen.",
        rootedIn: [
          knitTogether("Formed in the womb."),
          daysWritten("Days written in God's book."),
          numberDays("A heart of wisdom."),
          priestlyBlessing("Blessing and peace."),
        ],
      },
    ],
    topics: [T.parents, T.children, T.time],
    related: ["new-year", "new-baby", "child-leaving-home"],
    words: ["birthday", "bday", "birthday prayer", "turning", "anniversary of birth", "son's birthday", "daughter's birthday"],
  },
];
