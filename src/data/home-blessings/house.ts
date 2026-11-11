// Blessings for the home, group 1: for the house (design 3.3, 4.4, 4.5). Every thing a blessing says about God, or asks
// of him, rests on a verse listed under it. The words ask God to make a home his and give it to him; they never vow on
// behalf of everyone who lives there (design 2.4 rule 4).
import { sp } from "../sympathy/types";
import {
  comingAndGoing, GIVES_SLEEP, myHouse, peaceToThisHouse, peacefulPlace, priestlyBlessing, scripture,
  strangersWelcome, TOPICS,
} from "./shared";
import type { BlessingPage, Station } from "./types";

const STATIONS: Station[] = [
  {
    id: "front-door",
    heading: "At the front door",
    place: "",
    reading: peaceToThisHouse("Jesus' greeting for every house his followers entered."),
    prayer: "Lord, we begin as Jesus taught: peace to this house, and to everyone who lives here. Watch over every coming and going through this door, now and always, and let it open to friends and strangers alike. In Jesus' name.",
    rootedIn: [
      comingAndGoing("God's watch over every coming and going."),
      sp("ROM 12:13", "card", "A door open to others."),
    ],
    aside: sp("DEU 6:9", "card", "A verse by the door.", {
      context: "Israel was told to write God's words on their doorposts. Christians are not given that command, but many put a verse by the door as a reminder; this sheet can be that verse.",
    }),
  },
  {
    id: "where-we-gather",
    heading: "Where we gather",
    place: "the living room",
    reading: sp("PSA 133:1", "card", "How good it is to live together in harmony."),
    prayer: "Lord, thank you for this room where we sit together. Let the people who gather here live in harmony. Make us devoted to one another, and eager to honour each other above ourselves. In Jesus' name.",
    rootedIn: [sp("ROM 12:10", "card", "Devoted to one another, honouring one another.")],
  },
  {
    id: "where-food-is-shared",
    heading: "Where food is made and shared",
    place: "the kitchen and the table",
    reading: sp("PSA 145:15-16", "card", "Every living thing fed from God's open hand."),
    prayer: "Lord, every good thing we eat comes from your open hand. Thank you for our daily bread. Let the meals made and shared in this place be eaten with gladness and sincere hearts. In Jesus' name.",
    rootedIn: [
      sp("MAT 6:11", "card", "Asking God for daily bread."),
      sp("ACT 2:46", "card", "Meals shared with gladness and sincerity."),
    ],
  },
  {
    id: "where-we-rest",
    heading: "Where we rest",
    place: "the bedrooms",
    reading: sp("PSA 4:8", "card", "Lying down in peace, trusting God."),
    prayer: "Lord, you give sleep to those you love. Let everyone who rests in these rooms lie down and sleep in peace, trusting you to keep them. Give rest to the tired at the end of each day. In Jesus' name.",
    rootedIn: [sp("PSA 127:2b", "card", "Sleep as God's gift.", { part: GIVES_SLEEP })],
  },
  {
    id: "a-childs-room",
    heading: "A child's room",
    place: "",
    reading: sp("MRK 10:16", "card", "Jesus took the children in his arms and blessed them."),
    prayer: "Lord Jesus, you took children in your arms and blessed them. Bless the child who sleeps here, and let them know your welcome. Help us speak of your words at home, when we lie down and when we get up. In your name.",
    rootedIn: [
      sp("MRK 10:14", "card", "Jesus' welcome to children."),
      sp("DEU 6:7", "card", "God's words spoken at home, morning and night."),
    ],
    aside: sp("PSA 139:13", "card", "For a baby on the way: pray for the child God is forming."),
  },
  {
    id: "where-work-is-done",
    heading: "Where the work is done",
    place: "a study, a laundry or a workshop",
    reading: sp("COL 3:23", "card", "Work done wholeheartedly, for the Lord."),
    prayer: "Lord, bless the work done in this place, paid or unpaid, seen or unseen. Help us to work at it with our whole hearts, for you and not for praise. Establish the work of our hands. In Jesus' name.",
    rootedIn: [sp("PSA 90:17", "card", "Asking God to establish the work of our hands.")],
  },
  {
    id: "a-room-for-guests",
    heading: "A room for guests",
    place: "or wherever guests sleep",
    reading: sp("ROM 12:13", "card", "Practising hospitality."),
    prayer: "Lord, thank you for the friends and strangers who will stay here. Make us glad to welcome them, and let them find rest and kindness under this roof. Teach us to share what we have. In Jesus' name.",
    rootedIn: [strangersWelcome("Welcoming strangers.")],
  },
  {
    id: "outside",
    heading: "Outside",
    place: "a garden, a balcony or a yard",
    reading: sp("PSA 24:1", "card", "The earth is the LORD's."),
    prayer: "Lord, the earth is yours, and everything in it. Thank you for this patch of ground, this garden, balcony or yard. Help us to tend it well and to enjoy it with thanks, because it is yours before it is ours. In Jesus' name.",
    rootedIn: [sp("GEN 2:15", "card", "God gave the first people a garden to work and keep.")],
  },
  {
    id: "all-together",
    heading: "All together",
    place: "back at the door, or at the table",
    reading: myHouse("Joshua's words about his own household."),
    prayer: "Lord, unless you build this house, our work on it is in vain. We give this home to you. Make it a home that serves you, and we pray that everyone who lives here would come to know you and love you. In Jesus' name.",
    rootedIn: [sp("PSA 127:1", "card", "The LORD who builds the house.")],
  },
];

export const HOUSE_PAGES: BlessingPage[] = [
  {
    slug: "house-blessing",
    group: "house",
    label: "A house blessing",
    heading: "A House Blessing",
    searchTitle: "House Blessing Prayer to Read and Print",
    intro: "A house blessing to read when you move into a new home, or any time you want to give the home you have to God, whether it is a house, a flat or a single room. Here is a blessing to say at the front door, an older house blessing by Arthur Guiterman, verses from Scripture, and a blessing to give someone in a card.",
    howTo: {
      title: "What a house blessing is",
      text: "A house blessing is not a charm. It is a family asking God to make their home his, and giving it to him. No water, oil, salt or candles are needed: the blessing is the prayer.",
    },
    items: [
      {
        kind: "written",
        id: "front-door",
        label: "A blessing at the front door",
        text: "Peace to this house, and to everyone who lives here. Lord, unless you build this house, our work on it is in vain, so we ask you to build it. Make this a home that serves you. Make it a peaceful place, safe and secure, a place of rest. Let its door be open to friends and strangers, and its table ready to share. Watch over our coming and going, now and always. In Jesus' name, amen.",
        rootedIn: [
          peaceToThisHouse("The greeting Jesus gave for every house."),
          sp("PSA 127:1", "card", "The LORD who builds the house."),
          myHouse("A household that serves the LORD."),
          peacefulPlace("A peaceful place, safe and secure, a place of rest."),
          sp("ROM 12:13", "card", "An open door and a table ready to share."),
          comingAndGoing("God's watch over every coming and going."),
        ],
        layouts: ["wall"],
      },
      { kind: "older", id: "guiterman-house", label: "An older blessing", layouts: ["wall"] },
      scripture(peaceToThisHouse("Jesus' greeting for every house."), ["wall", "cards"], "Jesus sent seventy-two of his followers ahead of him and told them how to greet each house they entered."),
      scripture(sp("PSA 127:1", "card", "The LORD who builds the house."), ["wall", "cards"], "A song of Solomon, one of the songs pilgrims sang on the way up to Jerusalem."),
      scripture(myHouse("Joshua's words about his own household."), ["wall", "cards"], "Joshua's words to the people of Israel near the end of his life, when he called them to choose whom they would serve."),
      scripture(peacefulPlace("A peaceful place, safe and secure."), ["wall", "cards"], "Isaiah's picture of life under the coming righteous King."),
      {
        kind: "written",
        id: "for-a-new-home",
        label: "A blessing for someone's new home",
        text: "May God bless your new home, [name], and everyone who comes through its door. May the Lord build this house with you, so that your work on it is not in vain. May it be a peaceful place, a place of rest and welcome, and may he watch over your coming and going, now and always. Amen.",
        forSomeone: true,
        rootedIn: [
          sp("PSA 127:1", "card", "The LORD who builds the house."),
          peacefulPlace("A peaceful place, a place of rest."),
          sp("ROM 12:13", "card", "A home where others are welcome."),
          comingAndGoing("God's watch over every coming and going."),
        ],
        layouts: ["wall", "cards"],
      },
    ],
    topics: [TOPICS.house, TOPICS.hospitality, TOPICS.blessing],
    related: ["room-by-room", "before-meals", "scripture-blessings"],
    elsewhere: [{ href: "/prayers/new-home", title: "A prayer for moving day" }],
  },
  {
    slug: "room-by-room",
    group: "house",
    label: "Room by room",
    heading: "Blessing Your Home, Room by Room",
    searchTitle: "House Blessing Room by Room, with Scripture",
    intro: "Blessing your home room by room is a simple way to give a house, a flat or a single room to God: walk through it together, read a verse in each place, and pray a short prayer. Here is an order for nine stations, from the front door to the garden, ending with the Doxology and the blessing God gave Israel's priests. Tick the rooms you have and print the order to carry with you.",
    howTo: {
      title: "How to do it",
      text: "Any time will do, not only moving day. Anyone may lead: a parent, a friend or a pastor. One person reads the verse, the leader says the prayer, and everyone answers “Amen.” Children can carry the sheet or read a verse. Skip any room you do not have, and add your own words wherever you like. No candles, water or oil are needed, because the blessing is the prayer.",
    },
    items: [
      { kind: "older", id: "doxology", label: "Sung or said together", layouts: [] },
      scripture(priestlyBlessing("Said over everyone at the end."), [], "The priests of Israel spoke this over the people at God's command (Numbers 6:22–27). Say it over everyone at the end."),
    ],
    stations: STATIONS,
    topics: [TOPICS.house, TOPICS.hospitality, TOPICS.blessing],
    related: ["house-blessing", "scripture-blessings", "before-meals"],
    elsewhere: [{ href: "/prayers/new-home", title: "A prayer for moving day" }],
  },
];
