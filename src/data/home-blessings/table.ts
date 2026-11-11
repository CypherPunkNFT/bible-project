// Blessings for the home, group 2: at the table (design 3.3, 4.2). To bless the food is to thank God for it. Graces thank
// God, not the food, and never imply that plenty is a reward for faith (design 4.6).
import { sp } from "../sympathy/types";
import { DEUTERONOMY_8_NOTE, scripture, strangersWelcome, TOPICS } from "./shared";
import type { BlessingPage } from "./types";

const openHand = (note: string) => sp("PSA 145:15-16", "card", note);
const goodForever = (note: string) => sp("PSA 136:1", "card", note);

export const TABLE_PAGES: BlessingPage[] = [
  {
    slug: "before-meals",
    group: "table",
    label: "Prayers before meals",
    heading: "Prayers Before Meals",
    searchTitle: "Prayers Before Meals: Short Graces for the Table",
    intro: "Prayers before meals: short graces for the family table, old and new. Here are graces families have said for generations, among them “Come, Lord Jesus, be our guest”, John Cennick's “Be present at our table, Lord”, the Doxology and the Selkirk Grace, with a short grace for every day and a thanks for after the meal. To bless the food is to thank God for it.",
    items: [
      { kind: "older", id: "come-lord-jesus", label: "An older grace", layouts: ["cards", "table-card"] },
      { kind: "older", id: "cennick-table", label: "An older grace", layouts: ["cards", "table-card"] },
      { kind: "older", id: "cennick-blood", label: "An older grace", layouts: ["cards", "table-card"] },
      {
        kind: "written",
        id: "every-day",
        label: "A grace for every day",
        text: "Lord, thank you for this food and for the hands that made it. Every good gift comes from you, and you open your hand to feed us. Thank you for what we have. Bless our time together. In Jesus' name, amen.",
        rootedIn: [
          sp("JAS 1:17", "card", "Every good gift is from above."),
          openHand("God's open hand."),
          sp("1TI 4:4-5", "card", "Food received with thanksgiving."),
        ],
        layouts: ["cards", "table-card"],
      },
      { kind: "older", id: "doxology", label: "A sung grace", layouts: ["cards", "table-card"] },
      { kind: "older", id: "selkirk", label: "An older grace", layouts: ["cards", "table-card"] },
      {
        kind: "written",
        id: "after-the-meal",
        label: "Thanks after the meal",
        text: "Lord, we have eaten and we are satisfied, and we bless you for your goodness to us. Thank you for this meal and for the people who shared it. Your love endures forever. Amen.",
        rootedIn: [
          sp("DEU 8:10", "card", "Blessing the LORD after eating.", { context: DEUTERONOMY_8_NOTE }),
          goodForever("God's love endures forever."),
        ],
        layouts: ["cards", "table-card"],
      },
      scripture(openHand("God feeds every living thing."), ["cards", "table-card"], "A psalm of David praising God, who feeds everything he has made."),
      scripture(goodForever("God's love endures forever."), ["cards", "table-card"], "The opening line of a psalm Israel sang in turns, every verse answered “His loving devotion endures forever.”"),
      scripture(sp("1TI 4:4-5", "card", "Food received with thanksgiving."), ["cards", "table-card"], "Paul to Timothy, against teachers who said some foods were forbidden."),
    ],
    topics: [TOPICS.thanksgiving, TOPICS.food, TOPICS.bread],
    related: ["holiday-meals", "graces-for-kids", "house-blessing"],
  },
  {
    slug: "holiday-meals",
    group: "table",
    label: "Holiday meals",
    heading: "Graces for Holiday Meals",
    searchTitle: "Thanksgiving and Christmas Dinner Prayers",
    intro: "Graces for holiday meals: prayers before Thanksgiving dinner, Christmas dinner and Easter lunch, for a birthday meal, for guests at the table, and for a first holiday with an empty chair. Each is short enough to read aloud before everyone eats, and each rests on the verses shown beneath it. Print one as a folded card to stand by the plates.",
    howTo: {
      title: "When guests do not pray",
      text: "A host can simply say, “We usually give thanks before we eat,” and pray briefly for the whole table. Nobody needs to join in for the grace to be said.",
    },
    items: [
      {
        kind: "written",
        id: "thanksgiving",
        label: "A Thanksgiving grace",
        text: "Lord, we come to this table with thanks. You are good, and your love lasts through every generation. Thank you for this food, for this year, and for each person here. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 100:4-5", "card", "Coming to God with thanksgiving."),
          sp("PSA 107:1", "card", "Give thanks, for he is good."),
        ],
        layouts: ["cards", "table-card"],
      },
      {
        kind: "written",
        id: "christmas",
        label: "A Christmas grace",
        text: "Lord, thank you for the good news of great joy: a Saviour has been born, Christ the Lord. Fill this table with that joy. Thank you for this food, for the people here, and most of all for Jesus. In his name, amen.",
        rootedIn: [sp("LUK 2:10-11", "card", "Good news of great joy for all the people.")],
        layouts: ["cards", "table-card"],
      },
      {
        kind: "written",
        id: "easter",
        label: "An Easter grace",
        text: "Lord, the tomb is empty: Jesus is not here, he has risen, just as he said. Thank you for the victory he has won for us. As we share this meal, fill us with the joy of Easter morning. In Jesus' name, amen.",
        rootedIn: [
          sp("MAT 28:6", "card", "He has risen, just as he said."),
          sp("1CO 15:57", "card", "The victory through our Lord Jesus Christ."),
        ],
        layouts: ["cards", "table-card"],
      },
      {
        kind: "written",
        id: "birthday-meal",
        label: "A grace for a birthday meal",
        text: "Lord, this is the day you have made, and we are glad in it. Thank you for the one whose birthday we celebrate, and for every year you have given. Teach us to number our days and grow wise. Bless this meal and everyone at this table. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 118:24", "card", "The day the LORD has made."),
          sp("PSA 90:12", "card", "Numbering our days."),
        ],
        layouts: ["cards"],
      },
      {
        kind: "written",
        id: "empty-chair",
        label: "A table with an empty chair",
        text: "Lord, there is an empty place at this table today, and we feel it. You are near to the brokenhearted, so be near to us now. Thank you for the one we miss, and for the years we shared. Help us to weep together, and still to give thanks together for this food. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 34:18", "card", "The LORD is near to the brokenhearted."),
          sp("ROM 12:15", "card", "Weeping with those who weep."),
        ],
        layouts: ["cards"],
      },
      {
        kind: "written",
        id: "guests",
        label: "Guests at our table",
        text: "Lord, thank you for everyone at this table today, old friends and new. Thank you for this food and for the joy of sharing it. Make our home a place where strangers become friends. In Jesus' name, amen.",
        rootedIn: [
          strangersWelcome("Welcoming strangers."),
          sp("ROM 12:13", "card", "Practising hospitality."),
        ],
        layouts: ["cards", "table-card"],
      },
    ],
    topics: [TOPICS.thankfulness, TOPICS.praise, TOPICS.hospitality],
    related: ["before-meals", "graces-for-kids", "blessing-your-children"],
    elsewhere: [
      { href: "/sympathy", title: "Words of comfort for a grieving family" },
      { href: "/when-youre/grieving", title: "What the Bible says when you're grieving" },
    ],
  },
];
