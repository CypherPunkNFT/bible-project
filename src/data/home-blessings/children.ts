// Blessings for the home, group 3: for children (design 3.3, 4.5, 7). A prayer a child says is 12–50 words, short-lined
// and true for a believing child while still kind to one who is not sure; a rhyme never says more than its verses. Words a
// parent says over a child are ordinary written items. Nothing here asks for, stores or sends a child's name.
import { sp } from "../sympathy/types";
import {
  comingAndGoing, DEUTERONOMY_28_NOTE, neverSleeps, priestlyBlessing, quietedWithLove, scripture, TOPICS,
} from "./shared";
import type { BlessingPage } from "./types";

const LORDS_PRAYER_SETTING =
  "Jesus teaching his followers to pray. The Berean, like most modern translations, ends with “deliver us from the evil one” and has no closing “For yours is the kingdom…”, which is not in the oldest copies of Matthew; families who say it may keep saying it.";

export const CHILDREN_PAGES: BlessingPage[] = [
  {
    slug: "graces-for-kids",
    group: "children",
    label: "Simple graces for children",
    heading: "Simple Graces for Children",
    searchTitle: "Short Mealtime Prayers for Kids",
    intro: "Simple graces for children to say before meals: short rhymes a three-year-old can learn and a seven-year-old can read, alongside the grace many families know as “God is great, God is good”. There is an older grace by Edith Rutter Leatham, a grace to say in turns, and new rhymes, each with the verses it rests on. Print them as cards for a grace jar or as a colouring page.",
    forChildren: true,
    items: [
      {
        kind: "written",
        id: "food-to-eat",
        label: "A grace to learn by heart",
        text: "Thank you, God, for food to eat\nand every gift you give.\nYour love will never, ever end,\nand by your hand we live.\nAmen.",
        forChildren: true,
        rootedIn: [
          sp("JAS 1:17", "card", "Every good gift is from above."),
          sp("PSA 136:1", "card", "God's love endures forever."),
          sp("PSA 145:15-16", "card", "God opens his hand and feeds every living thing."),
        ],
        layouts: ["cards", "table-card", "colouring"],
      },
      { kind: "older", id: "god-is-great", label: "An older grace", layouts: ["cards", "table-card", "colouring"] },
      { kind: "older", id: "leatham-world", label: "An older grace", layouts: ["cards", "table-card", "colouring"] },
      { kind: "older", id: "come-lord-jesus", label: "An older grace", layouts: ["cards", "table-card", "colouring"] },
      {
        kind: "written",
        id: "in-turns",
        label: "A grace to say in turns",
        text: "Parent: For food to eat,\nAll: Thank you, God.\nParent: For the people here,\nAll: Thank you, God.\nParent: For Jesus, who loves us,\nAll: Thank you, God.\nAll: Amen.",
        forChildren: true,
        rootedIn: [
          sp("PSA 136:1", "card", "Give thanks to the LORD, for he is good."),
          sp("JAS 1:17", "card", "Every good gift is from above."),
          sp("1JN 4:19", "card", "He loved us first."),
        ],
        layouts: ["cards", "colouring"],
      },
      {
        kind: "written",
        id: "farmer-and-field",
        label: "For hands that made our food",
        text: "For the farmer and the field,\nthank you, God, for all they yield.\nFor the hands that cooked our food,\nthank you, God, for you are good.\nAmen.",
        forChildren: true,
        rootedIn: [
          sp("PSA 104:14", "card", "God brings food from the earth."),
          sp("JAS 1:17", "card", "Every good gift is from above."),
          sp("PSA 136:1", "card", "Give thanks to the LORD, for he is good."),
        ],
        layouts: ["cards", "table-card", "colouring"],
      },
    ],
    topics: [TOPICS.thanksgiving, TOPICS.food, TOPICS.bread],
    related: ["before-meals", "bedtime", "blessing-your-children"],
  },
  {
    slug: "bedtime",
    group: "children",
    label: "Bedtime blessings and prayers",
    heading: "Bedtime Blessings and Prayers for Children",
    searchTitle: "Bedtime Prayers and Blessings for Kids",
    intro: "Bedtime prayers and blessings for children: a short rhyme to say together at the end of the day, older prayers such as “Jesus, tender Shepherd, hear me” and “Now I lay me down to sleep”, verses about sleeping in peace, and a card your child can fill in with a prayer of their own. Print them as cards for the bedside or as a colouring page.",
    forChildren: true,
    items: [
      {
        kind: "written",
        id: "all-today",
        label: "A bedtime prayer",
        text: "Thank you, God, for all today;\nforgive the wrong I've done, I pray.\nWhen I'm afraid, I trust in you;\nyou stay awake the whole night through.\nI lie down now and close my eyes,\nand you will keep me till I rise.\nAmen.",
        forChildren: true,
        rootedIn: [
          sp("1TH 5:18", "card", "Thanks in every circumstance."),
          sp("1JN 1:9", "card", "God forgives when we confess."),
          sp("PSA 56:3", "card", "Trusting God when afraid."),
          neverSleeps("God never sleeps."),
          sp("PSA 3:5", "card", "Lying down and waking again."),
        ],
        layouts: ["wall", "cards", "colouring"],
      },
      { kind: "older", id: "duncan-shepherd", label: "An older bedtime prayer", layouts: ["wall", "cards", "colouring"] },
      { kind: "older", id: "wesley-gentle", label: "An older bedtime prayer", layouts: ["wall", "cards", "colouring"] },
      { kind: "older", id: "ken-evening", label: "An older evening hymn", layouts: ["wall", "cards", "colouring"] },
      { kind: "older", id: "watts-evening", label: "An older evening song", layouts: ["wall", "cards", "colouring"] },
      { kind: "older", id: "now-i-lay-me", label: "An older bedtime prayer", layouts: ["wall", "cards", "colouring"] },
      scripture(sp("PSA 4:8", "card", "Lying down in peace."), ["wall", "cards", "colouring"], "David's evening psalm, trusting God at the end of a hard day."),
      scripture(sp("PSA 3:5", "card", "Lying down and waking again."), ["wall", "cards", "colouring"], "David wrote this when he had to flee from his own son, and still slept."),
      scripture(sp("PSA 56:3", "card", "Trusting God when afraid."), ["wall", "cards", "colouring"], "David's prayer when he was in danger: a verse a child can learn in one go."),
      scripture(neverSleeps("God never sleeps."), ["wall", "cards", "colouring"], "A song for pilgrims on the road to Jerusalem."),
      scripture(sp("MAT 6:9-13", "card", "The prayer Jesus taught."), ["wall"], LORDS_PRAYER_SETTING),
      {
        kind: "fill-in",
        id: "my-own-prayer",
        label: "My own prayer",
        prompts: ["Thank you, God, for…", "Please help…", "I'm sorry for…", "Goodnight, God. Amen."],
        rootedIn: [
          sp("PHP 4:6", "card", "Asking God for things, with thanks."),
          sp("1JN 1:9", "card", "Telling God we are sorry."),
        ],
        layouts: ["cards", "colouring"],
      },
    ],
    topics: [TOPICS.sleep, TOPICS.night, TOPICS.protection],
    related: ["blessing-your-children", "graces-for-kids", "scripture-blessings"],
    elsewhere: [{ href: "/when-youre/afraid", title: "When your child is afraid" }],
  },
  {
    slug: "blessing-your-children",
    group: "children",
    label: "Blessings over your children",
    heading: "Blessings to Speak Over Your Children",
    searchTitle: "Blessings to Pray Over Your Children",
    intro: "Blessings to speak over your children: words a parent, a grandparent or anyone who loves a child can say at bedtime, as they leave the house, on a birthday or when they are afraid. The blessing God gave the priests of Israel, Numbers 6:24–26, is here too, with other verses to pray over a child.",
    forChildren: true,
    howTo: {
      title: "How to bless your children",
      text: "Many families say a blessing over each child at bedtime: a hand on the head or shoulder if the child likes it, and the same few words each night, so the child can one day say them back. Jesus took the children in his arms and blessed them (Mark 10:16), and Jacob blessed his grandsons by name (Genesis 48:20). A blessing asks God for good things for your child. It is a prayer, not a spell, and saying it does not make a child a Christian.",
    },
    gospel: true,
    items: [
      {
        kind: "written",
        id: "bedtime-blessing",
        label: "A bedtime blessing for your child",
        text: "Goodnight, [name]. God made every part of you, and you are wonderfully made. The Lord your God is with you; he delights in you and quiets you with his love. May you know his love all your life. Sleep well. Amen.",
        forSomeone: true,
        rootedIn: [
          sp("PSA 139:13-14", "card", "Every part made by God."),
          quietedWithLove("God's delight in his own, and his quieting love."),
        ],
        layouts: ["wall", "cards", "colouring"],
      },
      scripture(priestlyBlessing("The blessing God gave his people."), ["wall", "cards", "colouring"], "The priests of Israel spoke this over the people at God's command (Numbers 6:22–27). Christians have said it over one another, and over their children, ever since."),
      {
        kind: "written",
        id: "leaving-the-house",
        label: "As they leave the house",
        text: "Go well today, [name]. May the Lord watch over your going out and your coming in, now and always. May you be blessed when you go out and blessed when you come home. Be kind, be brave, and remember that you are loved. Amen.",
        forSomeone: true,
        rootedIn: [
          comingAndGoing("God's watch over every coming and going."),
          sp("DEU 28:6", "card", "Blessed going out and coming in.", { context: DEUTERONOMY_28_NOTE }),
        ],
        layouts: ["wall", "cards", "colouring"],
      },
      {
        kind: "written",
        id: "on-their-birthday",
        label: "On their birthday",
        text: "Happy birthday, [name]. God formed you before you were born, and you are fearfully and wonderfully made. We thank God for every year of your life. May this new year bring you closer to him, and may you always know how much you are loved. Amen.",
        forSomeone: true,
        rootedIn: [
          sp("PSA 139:13-14", "card", "Formed by God, fearfully and wonderfully made."),
          sp("PSA 118:24", "card", "A day the LORD has made."),
        ],
        layouts: ["wall", "cards", "colouring"],
      },
      {
        kind: "written",
        id: "child-who-is-afraid",
        label: "For a child who is afraid",
        text: "God is here with you, [name]. When you are afraid, you can trust him. He is mighty, he loves you, and he will quiet you with his love. You do not have to be brave on your own. Rest now. Amen.",
        forSomeone: true,
        rootedIn: [
          sp("PSA 56:3", "card", "Trusting God when afraid."),
          quietedWithLove("God among his people, quieting them with his love."),
        ],
        layouts: ["wall", "cards", "colouring"],
      },
      scripture(sp("MRK 10:16", "card", "Jesus blessed the children."), ["wall", "cards", "colouring"], "When his disciples tried to send children away, Jesus welcomed them."),
      scripture(quietedWithLove("God's quieting love."), ["wall", "cards"], "The prophet Zephaniah's promise to God's restored people."),
    ],
    topics: [TOPICS.children, TOPICS.parents, TOPICS.instruction],
    related: ["bedtime", "scripture-blessings", "graces-for-kids"],
    elsewhere: [
      { href: "/life-events/new-baby", title: "Verses and a printable card for a new baby" },
      { href: "/life-events/baby-dedication", title: "Verses for a baby dedication service" },
    ],
  },
];
