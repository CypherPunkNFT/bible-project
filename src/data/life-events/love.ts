// Love and marriage: engagement, wedding, anniversary. Notes written for each event (design 4.2–4.4).
import { p, type LifeEvent } from "./types";

const SONG_CONTEXT = "Shown as the love of husband and wife, as the Song of Songs itself presents it.";

export const LOVE_EVENTS: LifeEvent[] = [
  {
    slug: "engagement",
    family: "love",
    heading: "Bible Verses for an Engagement",
    short: "Engagement",
    intro:
      "These Bible verses for an engagement are chosen for a couple who have promised to marry, and for the family and friends who want to bless them. There are passages to read together as you prepare, short verses to write in a congratulations card, and a prayer to pray over the two of you. Each one comes in the Berean Standard Bible with a line on why it fits, and every card verse can be printed on a folded card or a small card at home, free.",
    passages: [
      p("SNG 2:10-13", "reading", "Spring has come and the beloved calls: the joy of a love that is ready to begin.", { context: SONG_CONTEXT }),
      p("SNG 8:6-7", "reading", "Love that seals itself to one person and that no flood can put out: the promise an engagement looks toward.", { context: SONG_CONTEXT }),
      p("1CO 13:4-7", "reading", "What love does day by day, worth reading together long before the wedding."),
      p("GEN 24:67", "card", "Isaac and Rebekah, a match the Lord led, and a husband who loved his wife."),
      p("PRO 18:22", "card", "A glad word for the one who has found a wife, and for the friends congratulating him."),
      p("PRO 19:14", "card", "A wise husband or wife is a gift from the Lord, not a stroke of luck."),
      p("PRO 3:5-6", "card", "For a couple planning a life together: trust the Lord with the plans."),
      p("EPH 4:2-3", "card", "The humility, patience and peace a couple will need, starting now."),
      p("COL 3:14", "card", "Love as the bond that holds every other virtue together."),
      p("PHP 1:9-11", "blessing", "Paul's prayer that love may grow in knowledge and insight, to pray over an engaged couple."),
    ],
    card: { heading: "On your engagement", inside: "With joy at your news, and prayers for the road ahead.", names: 2, date: false, ornament: "ring" },
    topics: [{ slug: "marriage", title: "Marriage" }, { slug: "courtship", title: "Courtship" }, { slug: "love", title: "Love" }],
    related: ["wedding", "anniversary"],
  },
  {
    slug: "wedding",
    family: "love",
    heading: "Bible Verses for a Wedding",
    short: "Wedding",
    intro:
      "These Bible verses for a wedding are the readings and card verses most loved for the day a man and a woman become husband and wife. The readings are full passages for the ceremony, from the first marriage in Genesis to Paul's picture of Christ and the church; the card verses are short enough to write in a card or print on one; and Aaron's blessing closes the service. Every passage is in the Berean Standard Bible with a line on why it suits a wedding, and a note where a verse is often read out of its setting. Below them, make a printable card with the couple's names and the date.",
    passages: [
      p("GEN 2:18-24", "reading", "The first wedding: God makes the woman, brings her to the man, and the two become one flesh."),
      p("ECC 4:9-12", "reading", "Two are better than one, and a cord of three strands, husband, wife and the Lord, is not quickly broken."),
      p("SNG 8:6-7", "reading", "A love strong as death that many waters cannot quench: the bride and groom's promise in poetry.", { context: SONG_CONTEXT }),
      p("RUT 1:16-17", "reading", "A vow of loyalty to the end, and a shared God, that couples make their own.", {
        context: "Ruth spoke these words to her mother-in-law Naomi, not to a husband; couples use them for the same loyalty and shared faith.",
      }),
      p("MAT 19:4-6", "reading", "Jesus on marriage: God made them male and female, joined them, and no one is to separate them."),
      p("1CO 13:4-8a", "reading", "The best-known wedding reading: what love is, what it does, and that it never fails.", { part: "Love never fails." }),
      p("EPH 5:22-33", "reading", "Marriage as a picture of Christ and the church: a husband's self-giving love and a wife's respect."),
      p("COL 3:12-14", "reading", "The clothes of a Christian marriage: compassion, patience, forgiveness, and love over them all."),
      p("1JN 4:7-12", "reading", "God is love, and his love is the spring of ours: a reading for any Christian wedding."),
      p("ECC 4:12b", "card", "Three strands: the couple bound together with the Lord.", { part: "a cord of three strands is not quickly broken." }),
      p("MRK 10:9", "card", "Jesus' own words on the joining that happens at a wedding."),
      p("1CO 13:7", "card", "Four short lines on how love holds on."),
      p("COL 3:14", "card", "Love, the bond that ties a marriage together."),
      p("1JN 4:19", "card", "The shortest card verse here: every love begins with God's."),
      p("PRO 18:22", "card", "A cheerful verse for the groom and his family."),
      p("NUM 6:24-26", "blessing", "Aaron's blessing, often spoken over the couple at the end of the ceremony."),
    ],
    card: { heading: "On your wedding day", inside: "With love and prayers as you begin your life together.", names: 2, date: true, ornament: "rings" },
    topics: [{ slug: "marriage", title: "Marriage" }, { slug: "husbands", title: "Husbands" }, { slug: "wife", title: "Wife" }, { slug: "bride", title: "Bride" }],
    related: ["engagement", "anniversary"],
  },
  {
    slug: "anniversary",
    family: "love",
    heading: "Bible Verses for a Wedding Anniversary",
    short: "Wedding anniversary",
    intro:
      "These Bible verses for a wedding anniversary give thanks for a marriage that has lasted, whether it is the first year or the fiftieth. There are passages to read at an anniversary dinner or a renewal of vows, short verses for a card from a husband, a wife, children or friends, and a blessing on the years still to come. Each verse is in the Berean Standard Bible, with a line on why it fits and an honest note where one is often read out of context. Then print a card with the couple's names and the date.",
    passages: [
      p("ECC 4:9-12", "reading", "Two who have lifted each other up through the years, held by a third strand."),
      p("PRO 31:10-12", "reading", "A husband's praise for a wife whose worth he has learned over many years."),
      p("COL 3:12-14", "reading", "The patience and forgiveness that made the years possible, and the love that binds them."),
      p("PRO 5:18", "card", "Joy in the wife of your youth, still, years later."),
      p("PRO 31:28-29", "card", "A husband and children who rise up and call her blessed."),
      p("SNG 8:7a", "card", "Floods have not put out this love.", { part: "Mighty waters cannot quench love; rivers cannot sweep it away.", context: SONG_CONTEXT }),
      p("1CO 13:7-8a", "card", "A love that has borne, believed, hoped and endured, and not failed.", { part: "Love never fails." }),
      p("LAM 3:22-23", "card", "Mercies new every morning, through every year of a marriage.", {
        context: "Written amid Jerusalem's ruin; the faithfulness it praises is God's, which is what holds a marriage.",
      }),
      p("PSA 100:5", "card", "The Lord's faithfulness through all generations, and through all your years."),
      p("1PE 4:8", "card", "Love that covers a multitude of sins: the secret of a long marriage."),
      p("PSA 34:3", "card", "An invitation to praise the Lord together for the years he has given."),
      p("PSA 90:17", "blessing", "A blessing on the work of the couple's hands in the years ahead."),
    ],
    card: { heading: "Happy anniversary", inside: "Thanking God for your marriage, and for every year to come.", names: 2, date: true, ornament: "vine" },
    topics: [{ slug: "marriage", title: "Marriage" }, { slug: "husbands", title: "Husbands" }, { slug: "wife", title: "Wife" }, { slug: "faithfulness", title: "Faithfulness" }],
    related: ["wedding", "engagement"],
  },
];
