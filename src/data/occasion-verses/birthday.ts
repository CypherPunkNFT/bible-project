// Birthdays (design 6): a short hand-picked set until a verse for every date exists. Left out on purpose, as verses often
// taken beyond what they say: Jeremiah 1:5 (a prophet's call), Jeremiah 29:11 (a promise to the exiles), Psalm 20:4 (a
// prayer for a king going to battle), 3 John 2 (a letter's greeting) and Zephaniah 3:17 (spoken to Jerusalem).
import { sp } from "../sympathy/types";
import type { Occasion } from "./types";

export const BIRTHDAY: Occasion = {
  slug: "birthday",
  group: "life",
  title: "Birthday",
  heading: "Bible Verses for a Birthday",
  intro:
    "These Bible verses for a birthday give thanks to God for a life, whether it is a first birthday or a ninetieth. There are verses for a child, verses for any age, verses for an older friend, and a blessing to write in a card or say over a birthday meal. Each is in the Berean Standard Bible with a line on why it fits.",
  sections: [
    {
      id: "child", title: "For a child",
      passages: [
        sp("PSA 139:13-14", "card", "Knit together in the womb and wonderfully made: thanks for a child's life."),
        sp("PSA 139:16", "card", "Every one of their days was written in God's book before one of them came to be."),
        sp("LUK 2:52", "card", "Jesus grew in wisdom and stature: a prayer for the year ahead."),
      ],
    },
    {
      id: "any-age", title: "For any age",
      passages: [
        sp("PSA 118:24", "card", "This is the day the Lord has made: a birthday to rejoice in."),
        sp("PSA 90:12", "card", "Teach us to number our days: a wise prayer for another year."),
        sp("PSA 16:11", "card", "The path of life, and joy in God's presence."),
        sp("LAM 3:22-23", "card", "Mercies new every morning, through every year of a life.", {
          context: "Written amid Jerusalem's ruin; the faithfulness it praises is God's, which holds every year.",
        }),
        sp("PSA 65:11", "card", "You crown the year with your bounty: thanks for the year just past."),
        sp("PHP 1:3", "card", "I thank my God every time I remember you: a friend's birthday greeting."),
        sp("PSA 23:6", "card", "Goodness and mercy all the days of my life."),
      ],
    },
    {
      id: "older", title: "For an older friend",
      passages: [
        sp("ISA 46:4", "card", "Even to your old age I will carry you: God's promise for the later years."),
        sp("PSA 92:12-14", "card", "Still bearing fruit in old age, healthy and green."),
        sp("PSA 71:17-18", "card", "Taught by God from youth, and still telling the next generation."),
        sp("PRO 16:31", "card", "Gray hair as a crown of glory, won along the path of righteousness."),
      ],
    },
    {
      id: "blessing", title: "A blessing",
      passages: [
        sp("NUM 6:24-26", "blessing", "Aaron's blessing, to write in a birthday card or say over a birthday meal."),
      ],
    },
  ],
  more: [],
};
