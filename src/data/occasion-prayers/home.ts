// Prayers for occasions, group 3: home and family (design 3.2, 4.3). Every request in a prayer rests on a verse listed
// beneath it, checked line by line as design 4.5 models. A house blessing to read room by room belongs to the home
// blessings feature (design 2.7); the new-home prayer here is for moving day and settling in.
import { sp } from "../sympathy/types";
import { guarded, priestlyBlessing, T } from "./shared";
import type { Occasion } from "./types";

const MY_HOUSE = "As for me and my house, we will serve the LORD!”";
const loveIs = (note: string) => sp("1CO 13:4-7", "card", note);
const MARRIAGE_TOPICS = [T.marriage, T.forgiveness, T.humility];

export const HOME_OCCASIONS: Occasion[] = [
  {
    slug: "new-home",
    group: "home",
    label: "A new home",
    heading: "A Prayer for a New Home",
    searchTitle: "Prayer for a New Home and Moving Day",
    intro: "A prayer for a new home, for moving day and the first weeks of settling into a new house or apartment. It asks God to build the household, to fill its rooms with wisdom and good things, and to make it a place where others are welcome. One is for your own household, and one is for someone who has just moved.",
    prayers: [
      {
        id: "for-you",
        label: "For your household",
        text: "Lord, thank you for this new home. Unless you build the house, all our work on it is wasted, so we ask you to build this one. Fill its rooms with wisdom and understanding, and with good things. As for us and our house, we want to serve you here. Make it a place where the door is open, where friends and strangers are welcome and needs are shared. When the boxes are unpacked, let it be a house that you have built. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 127:1", "card", "The LORD who builds the house."),
          sp("PRO 24:3-4", "card", "Rooms filled through wisdom and understanding."),
          sp("JOS 24:15b", "card", "A household that serves the LORD.", { part: MY_HOUSE }),
          sp("ROM 12:13", "card", "An open door and shared needs."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone who has moved",
        forSomeone: true,
        text: "Father, [name] has just moved into a new home. Build their house, Lord, because without you the work is in vain. Fill its rooms with wisdom, understanding and every good thing. Make it a place where they serve you, and where others find a welcome and a share of what they have. Let it be a home that you have built and that you keep. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 127:1", "card", "A house the LORD builds and protects."),
          sp("PRO 24:3-4", "card", "Wisdom, understanding and good things."),
          sp("ROM 12:13", "card", "Hospitality, an open door."),
        ],
      },
    ],
    topics: [T.house, T.blessing, T.thankfulness],
    related: ["moving-away", "new-baby", "new-year"],
    elsewhere: [{ href: "/blessings/house-blessing", title: "A house blessing to read and print" }],
    words: ["new home", "moving", "move", "moving day", "house", "new house", "apartment", "flat", "housewarming"],
  },
  {
    slug: "moving-away",
    group: "home",
    label: "Moving away",
    heading: "A Prayer When Moving Away",
    searchTitle: "Prayer for Moving to a New City",
    intro: "A prayer for moving to a new city or country, when you are leaving people and places you love. It asks God to go ahead of you, to guide and hold you wherever you settle, and to help you seek the good of your new home. One is for you, and one is for someone you love who is leaving.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am moving away, leaving people and places I love. Abram left his country and went where you showed him, and I want to go trusting you too. Go before me, and never leave me. Keep me from fear and discouragement. Even if I settle by the farthest sea, your hand will guide me there and hold me fast. Help me to seek the good of the place I am going and to pray for it. In Jesus' name, amen.",
        rootedIn: [
          sp("GEN 12:1", "card", "Leaving home in trust.", {
            context: "God's call to Abram was particular to him. Here it is a picture of leaving home in trust; it does not mean every move is a call from God.",
          }),
          sp("DEU 31:8", "card", "The LORD goes ahead and never leaves."),
          sp("PSA 139:9-10", "card", "Guided and held, even by the farthest sea."),
          sp("JER 29:7", "card", "Praying for the place you go.", {
            context: "God told the exiles in Babylon to seek the welfare of their new city and pray for it. The prosperity is the city's good, not a promise of personal wealth.",
          }),
        ],
      },
      {
        id: "for-someone",
        label: "For someone leaving",
        forSomeone: true,
        text: "Father, [name] is moving away, and I will miss them. Go before them, be with them, and never leave or forsake them. Keep them from fear and discouragement in a new place. Wherever they settle, let your hand guide them and hold them fast. Help them to seek the good of their new city and to pray for it, and let them share in its welfare. In Jesus' name, amen.",
        rootedIn: [
          sp("DEU 31:8", "card", "God goes ahead of them."),
          sp("PSA 139:9-10", "card", "Held fast wherever they settle."),
          sp("JER 29:7", "card", "Seeking the good of the new city.", {
            context: "The prosperity is the city's welfare, which the exiles were to pray for, not a promise of personal wealth.",
          }),
        ],
      },
    ],
    historic: "breastplate",
    topics: [T.protection, T.strangers, T.prayer],
    related: ["new-home", "travel", "big-decision"],
    words: ["moving away", "relocation", "relocating", "new city", "emigrating", "leaving home", "move abroad"],
  },
  {
    slug: "new-baby",
    group: "home",
    label: "A new baby",
    heading: "A Prayer for a New Baby",
    searchTitle: "Prayer for a Newborn Baby and Parents",
    intro: "A prayer for a newborn baby and the new parents, to pray at the hospital, at home or in a card. It thanks God for a child he has formed, asks his blessing on the baby, and asks his peace for the whole family. One prayer is for the baby and parents, with the baby's name, and one is for the parents to pray themselves.",
    prayers: [
      {
        id: "for-baby",
        label: "For the baby and parents",
        forSomeone: true,
        text: "Lord, thank you for [name]. Children are a gift from you, and this child is a gift to this family. You formed them and knit them together, and they are fearfully and wonderfully made. Bless [name] and keep them; make your face shine on them and be gracious to them. Jesus, you welcome little children: let this one come to you. And give this whole family your peace. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 127:3", "card", "Children, a gift from the LORD."),
          sp("PSA 139:13-14", "card", "A person God formed in the womb."),
          sp("MRK 10:14", "card", "Jesus welcomes little children."),
          priestlyBlessing("The LORD's blessing and peace."),
        ],
      },
      {
        id: "parents",
        label: "The parents' own prayer",
        text: "Father, you have given us this child, and we are amazed. Thank you. You formed them in the womb, and they are wonderfully made. Help us never to hinder them from coming to you, but to bring them to Jesus by how we love them and teach them. We feel how much we do not know. Bless us and keep us, be gracious to us, and give us peace in these new days. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 127:3", "card", "A child as God's gift."),
          sp("PSA 139:13-14", "card", "Wonderfully made."),
          sp("MRK 10:14", "card", "Not hindering the children."),
          priestlyBlessing("Blessing and peace for new parents."),
        ],
      },
    ],
    topics: [T.children, T.parents, T.blessing],
    related: ["giving-birth", "birthday", "new-home"],
    elsewhere: [
      { href: "/life-events/new-baby", title: "Verses and a printable card for a new baby" },
      { href: "/life-events/baby-dedication", title: "Verses for a baby dedication service" },
    ],
    words: ["baby", "newborn", "new baby", "new parents", "born", "infant", "birth announcement"],
  },
  {
    slug: "wedding-day",
    group: "home",
    label: "A wedding day",
    heading: "A Prayer for a Couple on Their Wedding Day",
    searchTitle: "Prayer for a Couple on Their Wedding Day",
    intro: "A prayer for a couple on their wedding day, for guests, parents or a friend asked to pray at the reception. It asks God to make husband and wife one, to teach them a patient and kind love, and to bind them together for life. One is for the couple, with their names, and one is for the bride and groom to pray together.",
    prayers: [
      {
        id: "for-couple",
        label: "For the couple",
        forSomeone: true,
        text: "Lord, thank you for [name] on their wedding day. As a man leaves his father and mother and is united to his wife, make this husband and wife one, as you designed from the beginning. Teach them a love that is patient and kind, that keeps no record of wrongs, and that bears, believes, hopes and endures all things. When one falls, let the other lift them up. Over everything, let them put on love, which binds them together in perfect unity. In Jesus' name, amen.",
        rootedIn: [
          sp("GEN 2:24", "card", "Husband and wife, one flesh."),
          sp("ECC 4:9-10", "card", "Two are better than one."),
          loveIs("Patient, kind, enduring love."),
          sp("COL 3:14", "card", "Love, the bond of perfect unity."),
        ],
      },
      {
        id: "for-us",
        label: "The couple's own prayer",
        text: "Father, today we become husband and wife. Make us one, as you made marriage to be. Teach us to be patient and kind with each other, not proud or rude, not easily angered, keeping no record of wrongs. When one of us falls, help the other to lift them up. Two are better than one: let us share the work and the load of our home. Above all, clothe us in love, the bond of perfect unity, all our days. In Jesus' name, amen.",
        rootedIn: [
          sp("GEN 2:24", "card", "One flesh."),
          loveIs("Love as the couple's daily practice."),
          sp("ECC 4:9-10", "card", "Lifting each other up."),
          sp("COL 3:14", "card", "Clothed in love."),
        ],
      },
    ],
    topics: MARRIAGE_TOPICS,
    related: ["struggling-marriage", "new-home", "new-baby"],
    elsewhere: [{ href: "/life-events/wedding", title: "Verses and a printable card for a wedding" }],
    words: ["wedding", "marriage", "bride", "groom", "newlyweds", "reception", "getting married", "engagement"],
  },
  {
    slug: "struggling-marriage",
    group: "home",
    label: "A struggling marriage",
    heading: "A Prayer for a Struggling Marriage",
    searchTitle: "Prayer for a Struggling Marriage",
    intro: "A prayer for a struggling marriage, when love has grown tired and words come out sharp. It asks God for humility and patience, for forgiveness on both sides, and for the bond between husband and wife to be restored. One is for your own marriage, and one is for a couple you love who are having a hard time.",
    before: "If someone at home is hurting you or frightening you, your safety comes first, and that is a different question from this one. These prayers are for a marriage that is strained, not for staying in danger. The help page linked below is for when someone at home is hurting you.",
    prayers: [
      {
        id: "for-you",
        label: "For your marriage",
        text: "Lord, our marriage is struggling, and I am tired. I bring it to you. Give me humility and gentleness, and patience to bear with my husband or wife in love. Help me to forgive as you forgave me, and to keep no record of wrongs. Help us both to work hard at keeping the peace between us. Clothe us again in love, and bind us together. We are not strong enough alone: hold us together like a cord of three strands. In Jesus' name, amen.",
        rootedIn: [
          sp("EPH 4:2-3", "card", "Humility, patience and the bond of peace."),
          sp("COL 3:13-14", "card", "Forgiving as the Lord forgave, and putting on love."),
          loveIs("Love that keeps no record of wrongs."),
          sp("ECC 4:12", "card", "A cord of three strands.", {
            context: "In its setting this is about the strength of companions. Christians often read the third strand as God in a marriage, as this prayer does.",
          }),
        ],
      },
      {
        id: "for-couple",
        label: "For a couple you love",
        forSomeone: true,
        text: "Father, I pray for [name] and their marriage, which is going through a hard time. Give them humility, gentleness and patience with each other. Help them to bear with one another in love and to forgive as you have forgiven them. Teach them the love that is patient and kind and keeps no record of wrongs. Help them to keep the peace between them, and bind them together again in love. In Jesus' name, amen.",
        rootedIn: [
          sp("EPH 4:2-3", "card", "Patience, and the bond of peace."),
          sp("COL 3:13-14", "card", "Forgiveness and love."),
          loveIs("Patient and kind love."),
        ],
      },
    ],
    topics: MARRIAGE_TOPICS,
    related: ["making-peace", "hard-conversation", "wedding-day"],
    elsewhere: [
      { href: "/when-youre/struggling-marriage", title: "What the Bible says when your marriage is struggling" },
      { href: "/when-youre/abused", title: "If someone at home is hurting you" },
    ],
    words: ["marriage", "struggling marriage", "marriage problems", "husband", "wife", "spouse", "restoration", "separated", "counselling"],
  },
  {
    slug: "child-leaving-home",
    group: "home",
    label: "A child leaving home",
    heading: "A Prayer When a Child Leaves Home",
    searchTitle: "Prayer When Your Child Leaves Home",
    intro: "A prayer when your child leaves home for college, work, the military or a home of their own. It asks God to bless and keep them, to watch over their going out and coming in, and to finish the good work he has begun in them. One is a parent's prayer, and one is for the one who is leaving.",
    prayers: [
      {
        id: "parent",
        label: "A parent's prayer",
        forSomeone: true,
        text: "Father, [name] is leaving home, and my heart is full of thanks and a little ache. Bless them and keep them. Make your face shine on them and be gracious to them, and give them peace. Guard their soul, and watch over their going out and coming in, now and always. You began a good work in them; carry it on to completion. My great hope, Lord, is to hear that they are walking in the truth. In Jesus' name, amen.",
        rootedIn: [
          priestlyBlessing("The blessing a parent can pray over a child who leaves."),
          guarded("Watching over their going and coming."),
          sp("PHP 1:6", "card", "The good work God began, carried on."),
          sp("3JN 1:4", "card", "A parent's greatest hope.", {
            context: "John's joy over his spiritual children, used here as a parent's hope, not a promise.",
          }),
        ],
      },
      {
        id: "for-you",
        label: "For the one leaving",
        text: "Lord, I am leaving home. I am excited and a little afraid. Watch over my going out and my coming in, and guard my soul in a new place with new freedom. You began a good work in me: carry it on to completion. Help me to walk in the truth wherever I go. Bless my family as I leave them, and bless me and keep me. Make your face shine on me, and give me your peace. In Jesus' name, amen.",
        rootedIn: [
          guarded("Guarded in a new place."),
          sp("PHP 1:6", "card", "God finishes what he starts."),
          sp("3JN 1:4", "card", "Walking in the truth."),
          priestlyBlessing("Blessing and peace for the one leaving, and for home."),
        ],
      },
    ],
    topics: [T.parents, T.children, T.time],
    related: ["first-day-of-school", "moving-away", "birthday"],
    elsewhere: [{ href: "/life-events/graduation", title: "Verses and a printable card for a graduation" }],
    words: ["empty nest", "leaving home", "child leaving", "going to college", "going to university", "adult child", "flying the nest"],
  },
];
