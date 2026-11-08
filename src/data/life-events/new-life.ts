// New life: expecting, new baby, adoption, baby dedication. Notes written for each event (design 4.2–4.4).
import { p, type LifeEvent } from "./types";

const AARON = "Aaron's blessing, to speak or write over a child and the family.";

export const NEW_LIFE_EVENTS: LifeEvent[] = [
  {
    slug: "expecting",
    family: "new-life",
    heading: "Bible Verses for Expecting a Baby",
    short: "Expecting a baby",
    intro:
      "These Bible verses for expecting a baby are for parents waiting for a child, and for the friends and family who pray with them through the months of waiting. They speak of God who knows a child before birth, who carries his people like a shepherd carries lambs, and who hears an anxious heart. There are two passages to read and pray, short verses for a card or a baby shower, and a blessing. Each is in the Berean Standard Bible, with a line on why it fits.",
    passages: [
      p("PSA 139:13-16", "reading", "God forming a child in the womb and knowing every one of their days before one of them came to be."),
      p("LUK 1:41-45", "reading", "Two expectant mothers, Elizabeth and Mary, and an unborn child who leaps for joy."),
      p("JER 1:5", "card", "Known by God before birth: why expecting parents treasure this verse.", {
        context: "God's words calling Jeremiah as a prophet; it also shows God knowing a person before birth, which is why it is loved by expecting parents.",
      }),
      p("PSA 127:3", "card", "Children are a heritage from the Lord, already, before they arrive."),
      p("ISA 40:11", "card", "The shepherd who carries the lambs close to his heart and gently leads the nursing ewes."),
      p("PSA 22:9-10", "card", "A prayer from the womb onward: God has been this child's God from the start."),
      p("PHP 4:6-7", "card", "For the waiting and the worries: prayer, thanks, and God's peace."),
      p("GEN 21:6", "card", "Sarah's laughter at a long-awaited child, for joyful news."),
      p("PSA 71:6", "card", "Upheld by God from birth: a verse for a baby shower card."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "Waiting with you", inside: "Praying for you and your little one in these months of waiting.", names: 1, date: false, ornament: "seed" },
    topics: [{ slug: "children", title: "Children" }, { slug: "parents", title: "Parents" }, { slug: "prayer", title: "Prayer" }],
    related: ["new-baby", "baby-dedication", "adoption"],
    elsewhere: [{ href: "/sympathy/loss-of-baby", title: "If you have lost a baby" }],
  },
  {
    slug: "new-baby",
    family: "new-life",
    heading: "Bible Verses for a New Baby",
    short: "New baby",
    intro:
      "These Bible verses for a new baby welcome a son or daughter into the world and give thanks to the God who made them. There are readings for a family's thanksgiving or a church welcome, short verses for a card or a birth announcement, and Aaron's blessing to speak over the child. Every verse is in the Berean Standard Bible with a line on why it suits a new baby, and an honest note where a favourite verse was first spoken about something else. Print a card with the baby's name below.",
    passages: [
      p("PSA 127:3-5", "reading", "Children as a gift and a reward from the Lord, and the happiness of a full quiver."),
      p("MRK 10:14-16", "reading", "Jesus takes the children in his arms and blesses them."),
      p("PSA 139:13-14", "card", "Fearfully and wonderfully made: the most loved verse for a newborn."),
      p("1SA 1:27", "card", "Hannah's thanks for the child she prayed for."),
      p("JAS 1:17", "card", "Every good and perfect gift is from above, and this one most of all."),
      p("GEN 33:5", "card", "Jacob's answer, \"the children God has graciously given\", for proud new parents."),
      p("JHN 16:21", "card", "Anguish forgotten for joy that a child is born.", {
        context: "Jesus used a mother's joy after childbirth to picture his disciples' sorrow turning to joy when they would see him again; it is loved by new parents because the picture is so true.",
      }),
      p("ZEP 3:17", "card", "God rejoicing over his own with singing, the way parents sing over a new baby.", {
        context: "Spoken to God's restored people, rejoicing over them; it describes how God delights in those who are his, which is why parents love it for a child.",
      }),
      p("PSA 103:17-18", "card", "The Lord's loving devotion to children's children, for a family welcoming a new generation."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "Welcome, little one", inside: "Rejoicing with you over this new life.", names: 1, date: false, ornament: "star" },
    topics: [{ slug: "children", title: "Children" }, { slug: "parents", title: "Parents" }, { slug: "thanksgiving", title: "Thanksgiving" }],
    related: ["baby-dedication", "expecting", "adoption"],
  },
  {
    slug: "adoption",
    family: "new-life",
    heading: "Bible Verses About Adoption",
    short: "Adoption",
    intro:
      "These Bible verses about adoption celebrate a child welcomed into a new family, and the God who adopts everyone who trusts in Christ as his own sons and daughters. There are readings on God's adoption of believers and on a child raised as a family's own, short verses for a card on adoption day or a homecoming, and a blessing for the child. Each passage is in the Berean Standard Bible with a line on why it fits, written with respect for every part of a child's story.",
    explainer: {
      title: "Adoption in the Bible",
      text: "In the New Testament, adoption describes what God does for everyone who trusts in Christ: he welcomes them as his own children, with the full rights of sons and daughters, and gives them his Spirit so they can call him Father. An adopted child's family pictures that welcome. A child's story begins before adoption, so these pages speak of birth parents with respect and of the adoptive family's joy, and avoid words such as \"real parents\" or \"given up\".",
    },
    passages: [
      p("EPH 1:4-6", "reading", "Chosen in love and adopted as God's sons through Jesus Christ, to the praise of his grace."),
      p("ROM 8:15-17", "reading", "The Spirit of sonship, by whom we cry \"Abba! Father!\", and the inheritance of God's children."),
      p("GAL 4:4-7", "reading", "God sent his Son so that we might receive adoption: no longer a slave, but a son and an heir."),
      p("EST 2:7", "reading", "Mordecai takes in his cousin Esther and raises her as his own daughter.", {
        context: "Mordecai raised his orphaned cousin as his own daughter, one of Scripture's plain pictures of adoption.",
      }),
      p("1JN 3:1", "card", "The manner of love the Father has given us: to be called children of God, and to be his."),
      p("PSA 68:5-6", "card", "God, a father of the fatherless, who settles the lonely in families."),
      p("JHN 14:18", "card", "Jesus' promise not to leave his own as orphans."),
      p("JAS 1:27", "card", "Caring for orphans as the heart of true religion."),
      p("DEU 10:18", "card", "The God who does justice for the fatherless and loves the foreigner, as an adoptive family does."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "Welcome home", inside: "Rejoicing with your family on this day of welcome.", names: 1, date: false, ornament: "heart" },
    topics: [{ slug: "adoption", title: "Adoption" }, { slug: "children", title: "Children" }, { slug: "family", title: "Family" }],
    related: ["new-baby", "baby-dedication", "expecting"],
  },
  {
    slug: "baby-dedication",
    family: "new-life",
    heading: "Baby Dedication Verses",
    short: "Baby dedication",
    intro:
      "These baby dedication verses are for the day parents stand before their church to give their child to the Lord and promise, with the congregation, to raise that child to know him. There are readings for the service, from Hannah dedicating Samuel to Jesus blessing the children, short verses for a dedication card or certificate, and Aaron's blessing to speak over the child. Each passage is in the Berean Standard Bible, with a line on why it fits and an honest note where a verse is often stretched.",
    explainer: {
      title: "What baby dedication is, and is not",
      text: "Baby dedication is a promise made by parents and a church: the parents commit to raise their child in the instruction of the Lord, and the congregation commits to help them, as Hannah gave Samuel to the Lord. It is not baptism and it does not save the child. Baptism follows later, when a person has trusted in Christ for themselves and asks to be baptized as a believer.",
    },
    passages: [
      p("1SA 1:27-28", "reading", "Hannah brings the son she prayed for and gives him to the Lord for as long as he lives."),
      p("DEU 6:4-9", "reading", "Loving the Lord with all your heart and teaching his words to your children at home and on the road."),
      p("PSA 78:4-7", "reading", "Telling the next generation the praises of the Lord, so that they put their hope in God."),
      p("MRK 10:13-16", "reading", "Parents bring their children to Jesus, and he blesses them."),
      p("LUK 2:22-24", "reading", "Mary and Joseph present the infant Jesus to the Lord at the temple.", {
        context: "Mary and Joseph kept a rite of the Law of Moses; Christian baby dedication follows its spirit of giving a child to the Lord, and is not baptism.",
      }),
      p("2TI 3:14-15", "reading", "Timothy knew the Scriptures from infancy, the gift every dedicating parent hopes to give."),
      p("PRO 22:6", "card", "Training a child in the way to go.", {
        context: "A proverb: wisdom about how life usually goes, not a promise that guarantees how a child will turn out.",
      }),
      p("LUK 2:40", "card", "The child grew strong, filled with wisdom, and the grace of God was on him."),
      p("EPH 6:4", "card", "Raising children in the discipline and instruction of the Lord."),
      p("JOS 24:15b", "card", "A household's own choice to serve the Lord.", {
        part: "As for me and my house, we will serve the LORD!”",
        context: "The end of Joshua's challenge to Israel to choose whom they will serve; quoted here as a household's own choice.",
      }),
      p("3JN 1:4", "card", "No greater joy than children walking in the truth."),
      p("NUM 6:24-26", "blessing", AARON),
    ],
    card: { heading: "On your dedication day", inside: "Praying with your family as you give this child to the Lord.", names: 1, date: true, ornament: "sprig" },
    topics: [{ slug: "dedication", title: "Dedication" }, { slug: "children", title: "Children" }, { slug: "parents", title: "Parents" }],
    related: ["new-baby", "baptism", "adoption"],
  },
];
