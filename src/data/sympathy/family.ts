// Loss of a mother, a father, a husband or wife, a child, a baby, a grandparent (design 4.2–4.4). Notes, context notes,
// introductions and the baby page's explainer were written by hand for these pages.
import { sp, type SympathySet } from "./types";

export const HOPE_WITH_GRIEF =
  "Paul does not say \"do not grieve\", but \"do not grieve like the rest, who are without hope\". Christians grieve, and grieve with hope.";
const MOTHERS_COMFORT = "God's words to his people, picturing his own comfort as a mother's. Read for a mother, it honours both.";
const PSALM_116_15 = "The psalm says “Precious in the sight of the LORD is the death of His saints”: the death of his people is costly to God, and he does not treat it lightly.";
const SONG_8 = "The love of husband and wife, \"as strong as death\": words that honour a marriage and the grief of losing the one you loved. They say nothing about marriage after death.";
const PARENT_TOPICS = [{ slug: "death-of-saints", title: "The Death of Saints" }, { slug: "hope", title: "Hope" }];
const CHILD_TOPICS = [{ slug: "consolation-in-affliction", title: "Consolation in Affliction" }, { slug: "weeping", title: "Weeping" }];
const DEFAULT_HEADING = "With deepest sympathy";

export const FAMILY_SETS: SympathySet[] = [
  {
    slug: "loss-of-mother",
    heading: "Bible Verses for the Loss of a Mother",
    short: "A mother",
    intro:
      "These Bible verses for the loss of a mother are for a son or daughter whose mother has died, and for friends who want to write to them. Some honour a mother's life and faith; others speak of God, who comforts his people as a mother comforts her child, and who stays near when the person who first held us is gone. There are short verses to send or write in a card, and passages to read at home or at the funeral. Every verse is in the Berean Standard Bible, with a line on why it fits.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, for a son or daughter in the first days."),
      sp("ISA 66:13a", "card", "God's comfort pictured as a mother's comfort.", { part: "As a mother comforts her son, so will I comfort you,", context: MOTHERS_COMFORT }),
      sp("PRO 31:28-29", "card", "Her children rise up and call her blessed: a tribute to a much-loved mother."),
      sp("PRO 31:30-31", "card", "A woman who fears the LORD, and the honour her life has earned."),
      sp("2TI 1:5", "card", "A sincere faith that lived first in a grandmother and a mother, for a mother who passed on her faith."),
      sp("PSA 73:26", "card", "When heart and flesh fail, God is the strength of the heart."),
      sp("PSA 90:1-2", "card", "God our dwelling place in every generation, from before the mountains were born."),
      sp("PHP 1:3", "card", "Thanks to God at every memory of her."),
      sp("1TH 4:13-14", "card", "Grieving with hope: for a mother who trusted in Christ.", { believer: true, context: HOPE_WITH_GRIEF }),
      sp("PRO 31:25-31", "reading", "The portrait of a woman of strength and kindness, often read at a mother's funeral.", {
        context: "A portrait of a woman who fears the Lord, read for a mother whose life showed it. It is a tribute, not a checklist.",
      }),
      sp("JHN 14:1-3", "reading", "Jesus promises a place prepared in his Father's house for those who trust him.", { believer: true }),
      sp("PSA 23:1-6", "reading", "The shepherd psalm, for a family walking through the valley together."),
    ],
    card: { heading: DEFAULT_HEADING, inside: "Thinking of you as you grieve your mother, and holding you in my prayers." },
    topics: PARENT_TOPICS,
    related: ["loss-of-father", "loss-of-grandparent", "loss-of-spouse"],
  },
  {
    slug: "loss-of-father",
    heading: "Bible Verses for the Loss of a Father",
    short: "A father",
    intro:
      "These Bible verses for the loss of a father are for a son or daughter of any age whose father has died, and for the friends who write to them. Some give thanks for a father who walked with integrity; others speak of God, who has compassion on his children as a father does, and who is a father to those left without one. There are short verses for a card and passages to read at home or at the funeral, all in the Berean Standard Bible with a line on why each fits.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, for a son or daughter in the first days."),
      sp("PSA 103:13", "card", "God's compassion is like a father's compassion for his children."),
      sp("PRO 20:7", "card", "A righteous man who walks with integrity, and the blessing he leaves to his children."),
      sp("PRO 17:6", "card", "The glory of a son is his father: honour for a father who was looked up to."),
      sp("PSA 68:5", "card", "A father to the fatherless, for children of any age."),
      sp("DEU 33:27a", "card", "The everlasting arms underneath, when the one who held the family together is gone.",
        { part: "The eternal God is your dwelling place, and underneath are the everlasting arms." }),
      sp("PHP 1:3", "card", "Thanks to God at every memory of him."),
      sp("ROM 14:8", "card", "Whether we live or die, we belong to the Lord: for a father who trusted in Christ.", { believer: true }),
      sp("2TI 4:7-8", "card", "Finishing the race and keeping the faith, for a father of long faith.", { believer: true }),
      sp("PSA 103:13-18", "reading", "Our days are like grass, but the LORD's loving devotion lasts to children's children."),
      sp("PSA 121:1-8", "reading", "The LORD who watches over your coming and going, now and forevermore."),
      sp("JHN 14:1-3", "reading", "Jesus promises a place prepared in his Father's house for those who trust him.", { believer: true }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "Thinking of you as you grieve your father, and holding you in my prayers." },
    topics: PARENT_TOPICS,
    related: ["loss-of-mother", "loss-of-grandparent", "loss-of-spouse"],
  },
  {
    slug: "loss-of-spouse",
    heading: "Bible Verses for the Loss of a Husband or Wife",
    short: "A husband or wife",
    intro:
      "These Bible verses for the loss of a husband or wife are for a widow or widower, and for the friends who want to stand with them. They speak of God, who defends the widow, who stays when the house is quiet, and who says \"never will I leave you\". Some honour the love of a marriage; others are for the long nights alone. There are short verses for a card and passages to read at home or at the funeral, all in the Berean Standard Bible, with a line on why each fits.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, for a widow or widower in the first days."),
      sp("PSA 4:8", "card", "Lying down in peace and sleeping: for the nights alone."),
      sp("HEB 13:5b", "card", "God's own promise never to leave or forsake.", { part: "Never will I leave you, never will I forsake you.”" }),
      sp("PSA 68:5", "card", "God as a defender of widows, in his holy dwelling."),
      sp("PSA 146:9", "card", "The LORD watches over the foreigner and sustains the fatherless and the widow."),
      sp("ISA 54:5", "card", "God's faithfulness to those who have lost a husband.", {
        context: "Spoken to God's people pictured as a widow (54:4). Widows have held on to it for centuries; it speaks of God's faithfulness, not of a replacement for the husband they loved.",
        hint: "Written to a widow: for a man who has lost his wife, another verse will suit better.",
      }),
      sp("SNG 8:7a", "card", "Love that many waters cannot quench, for a long and faithful marriage.",
        { part: "Mighty waters cannot quench love; rivers cannot sweep it away.", context: SONG_8 }),
      sp("ISA 41:10", "card", "Do not fear, for I am with you: God holds up the one who feels they cannot stand."),
      sp("PSA 73:26", "card", "When heart and flesh fail, God is the strength of the heart."),
      sp("SNG 8:6-7", "reading", "Love as strong as death, set as a seal on the heart.", { context: SONG_8 }),
      sp("ISA 43:1-2", "reading", "Through the waters and through the fire: you are mine, and I will be with you."),
      sp("PSA 121:1-8", "reading", "The LORD who watches over your coming and going, now and forevermore."),
      sp("ROM 8:35-39", "reading", "Nothing in all creation, death included, can separate those in Christ from the love of God.", { believer: true }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "I'm so sorry. I'm thinking of you, and praying for you in the days ahead." },
    topics: [{ slug: "widows", title: "Widows" }, { slug: "death-of-saints", title: "The Death of Saints" }],
    related: ["loss-of-mother", "loss-of-father", "after-illness"],
  },
  {
    slug: "loss-of-child",
    heading: "Bible Verses for the Loss of a Child",
    short: "A child",
    intro:
      "These Bible verses for the loss of a child are for parents whose son or daughter has died, at any age, and for those who love them. Nothing makes this loss smaller, and none of these verses try to. They speak of God, who keeps count of every tear, who gathers the lambs in his arms, and who does not willingly bring grief. Scripture also records a father's anguish without rebuke. There are short verses for a card and passages to read, all in the Berean Standard Bible with a line on why each fits.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, which no grief is too deep to reach."),
      sp("PSA 56:8", "card", "God keeps count of every tear, and writes each one down."),
      sp("ISA 40:11", "card", "The shepherd who gathers the lambs in his arms and carries them close to his heart."),
      sp("MAT 5:4", "card", "Jesus calls those who mourn blessed, and promises them comfort."),
      sp("LAM 3:31-33", "card", "The Lord does not willingly bring affliction or grief.", {
        context: "Written in the ruins of Jerusalem. \"He does not willingly afflict\": God takes no pleasure in our grief.",
      }),
      sp("PSA 147:3", "card", "The God who binds up wounds, written for hearts that feel broken."),
      sp("2CO 1:3-4", "card", "The God of all comfort, who comforts us in every trouble."),
      sp("ISA 25:8", "card", "The day God swallows up death forever and wipes the tears from every face.", { later: true }),
      sp("2SA 18:33", "reading", "King David weeping for his son Absalom.", {
        context: "King David's cry for his son Absalom. Scripture records a parent's anguish, \"if only I had died instead of you\", without rebuke.",
      }),
      sp("JHN 11:32-36", "reading", "Mary's grief at her brother's tomb, and Jesus weeping with her."),
      sp("REV 21:3-4", "reading", "God dwelling with his people, and death, mourning and crying gone for good.", { later: true }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "There are no words. I love you, and I'm holding you in my prayers." },
    topics: CHILD_TOPICS,
    related: ["loss-of-baby", "sudden-loss", "loss-of-friend"],
  },
  {
    slug: "loss-of-baby",
    heading: "Bible Verses for the Loss of a Baby",
    short: "A baby",
    intro:
      "These Bible verses for the loss of a baby are for mothers and fathers after a miscarriage, a stillbirth, or the death of an infant, and for the family and friends who grieve with them. A baby lost at any stage is a child, and their parents are grieving a son or daughter. These passages speak of God, who knit that child together, who knew them before birth, and who welcomes little children. There are short verses for a card and passages to read, each in the Berean Standard Bible, with a line on why it fits.",
    explainer: {
      title: "Where is my baby now?",
      paragraphs: [
        "Scripture does not answer every question we bring to it, and this is one where honesty matters. When King David's infant son died, David said, \"I will go to him, but he will not return to me\" (2 Samuel 12:23). Many Christians, Baptists prominent among them, take hope from those words, and from the character of God, the Judge of all the earth who does what is right (Genesis 18:25), that a baby who dies is safe with the Lord. The confession of faith this site follows does not rule on the question, so we do not either; we offer the hope as so many hold it, and why.",
        "A baby lost early is still your child, and the grief is real. Fathers grieve too, often quietly. Grief after a miscarriage is often hidden, because few people knew, so a card from a friend can be a great kindness. If you are expecting again, the verses for expecting a baby may help.",
      ],
    },
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, for parents in the first days."),
      sp("PSA 147:3", "card", "The God who binds up wounds, written for hearts that feel broken."),
      sp("PSA 56:8", "card", "God keeps count of every tear, the hidden ones too."),
      sp("ISA 40:11", "card", "The shepherd who gathers the lambs in his arms and carries them close to his heart."),
      sp("MRK 10:14b", "card", "Jesus welcomes the little children.", {
        part: "Let the little children come to Me, and do not hinder them! For the kingdom of God belongs to such as these.",
        context: "Jesus welcomed the little children others turned away.",
      }),
      sp("JER 1:5", "card", "Known by God before birth.", {
        context: "God's words calling Jeremiah as a prophet; they also show God knowing a person before birth, which is why parents who lost a baby before birth hold on to them.",
      }),
      sp("ISA 66:13a", "card", "God's comfort pictured as a mother's comfort.",
        { part: "As a mother comforts her son, so will I comfort you,", context: "God's words to his people, picturing his own comfort as a mother's." }),
      sp("REV 21:4", "card", "The day when God will wipe away every tear and death will be no more.", { later: true }),
      sp("PSA 139:13-16", "reading", "God knitting a child together in the womb, and every one of their days known to him."),
      sp("2SA 12:22-23", "reading", "David's words after his infant son died.", {
        context: "David's words after his infant son died: \"I will go to him, but he will not return to me.\" Many Christians take hope from them that a child who dies is safe with the Lord (see the explainer).",
      }),
      sp("MRK 10:13-16", "reading", "Jesus takes the children in his arms and blesses them."),
    ],
    card: { heading: DEFAULT_HEADING, inside: "I'm so sorry for the loss of your little one. I'm holding you both in my prayers." },
    topics: CHILD_TOPICS,
    related: ["loss-of-child", "loss-of-spouse", "sudden-loss"],
  },
  {
    slug: "loss-of-grandparent",
    heading: "Bible Verses for the Loss of a Grandparent",
    short: "A grandparent",
    intro:
      "These Bible verses for the loss of a grandparent are for grandchildren grieving a grandmother or grandfather, and for anyone mourning someone who lived a long life. Some give thanks for grey hair as a crown and a faith handed down; others speak of God, who carries his people even to old age. Verses that speak of a believer's hope are labelled, so you can choose them knowingly. There are short verses for a card and passages to read, all in the Berean Standard Bible.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, at any age."),
      sp("GEN 25:8", "card", "Abraham, old and full of years.", { context: "Said of Abraham: \"old and contented\". For a long life, fully lived." }),
      sp("PRO 16:31", "card", "Grey hair as a crown of glory, for a long and upright life."),
      sp("PRO 17:6", "card", "Grandchildren are the crown of the aged."),
      sp("ISA 46:4", "card", "God carries his people even to old age and grey hairs."),
      sp("PSA 90:12", "card", "Teach us to number our days: thankfulness for every year."),
      sp("2TI 1:5", "card", "A sincere faith that lived first in a grandmother, for a grandparent who passed on their faith."),
      sp("PSA 116:15", "card", "The death of God's people is precious to him.", { believer: true, context: PSALM_116_15 }),
      sp("REV 14:13", "card", "Blessed are the dead who die in the Lord: rest from their labors.", { believer: true }),
      sp("MAT 25:21", "card", "Well done, good and faithful servant.", {
        believer: true,
        context: "From the parable of the talents: the master's words at the end of faithful service, which believers long to hear from Christ.",
      }),
      sp("PSA 92:12-15", "reading", "The righteous still bearing fruit in old age, fresh and green."),
      sp("PSA 71:17-18", "reading", "A prayer from old age: declaring God's strength to the next generation."),
      sp("2TI 4:6-8", "reading", "Paul at the end of his life: the good fight fought, the race finished.", { believer: true }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "Thinking of you as you remember your grandparent, and holding you in my prayers." },
    topics: PARENT_TOPICS,
    related: ["loss-of-mother", "loss-of-father", "after-illness"],
  },
];
