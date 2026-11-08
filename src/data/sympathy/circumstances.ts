// Loss of a friend or sibling, a sudden loss, a death after long illness, a loss to suicide, a death where the family does
// not know where the person stood with God, and the loss of a pet (design 4.2–4.4). Card verses on the suicide and
// faith-unknown pages carry no label: they speak only of God's nearness to the mourners (design 2.5, rule 2).
import { HOPE_WITH_GRIEF } from "./family";
import { JOHN_11_35_CONTEXT } from "./hub";
import { sp, type SympathySet } from "./types";

const DEFAULT_HEADING = "With deepest sympathy";
const COMFORTER_TOPICS = [
  { slug: "compassion-and-sympathy-of-christ", title: "The Compassion and Sympathy of Christ" },
  { slug: "holy-spirit-the-comforter", title: "The Holy Spirit, the Comforter" },
];
const ROMANS_8_26 = "When there are no words to pray, the Spirit intercedes for us with groans too deep for words.";

export const CIRCUMSTANCE_SETS: SympathySet[] = [
  {
    slug: "loss-of-friend",
    heading: "Bible Verses for the Loss of a Friend, Brother or Sister",
    short: "A friend, brother or sister",
    intro:
      "These Bible verses for the loss of a friend, brother or sister are for anyone grieving someone who walked beside them through life, and for those who want to write to them. Scripture honours friendship: David wept for Jonathan, and Jesus wept at the tomb of his friend Lazarus. There are short verses for a card and passages to read, with a label on any verse that speaks of a believer's hope. Each is in the Berean Standard Bible with a line on why it fits.",
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, for anyone who has lost a companion."),
      sp("PRO 17:17", "card", "A friend loves at all times, and a brother is born for adversity."),
      sp("2SA 1:26a", "card", "David's grief for his friend Jonathan.", {
        part: "I grieve for you, Jonathan, my brother. You were delightful to me;",
        context: "David's lament for his friend Jonathan, with whom he had made a covenant of friendship (1 Samuel 18:3).",
      }),
      sp("PHP 1:3", "card", "Thanks to God at every memory of them."),
      sp("JHN 11:35", "card", "Jesus wept for his friend.", { context: JOHN_11_35_CONTEXT }),
      sp("ROM 12:15", "card", "Weep with those who weep: what a friend's card says without words."),
      sp("PRO 18:24", "card", "A friend who stays closer than a brother."),
      sp("ECC 3:4", "card", "A time to weep and a time to mourn, as well as a time to laugh."),
      sp("1TH 4:13-14", "card", "Grieving with hope: for a friend who trusted in Christ.", { believer: true, context: HOPE_WITH_GRIEF }),
      sp("JHN 11:32-36", "reading", "Jesus at the tomb of his friend Lazarus, deeply moved and weeping."),
      sp("2SA 1:25-26", "reading", "David's lament for Jonathan, his brother in all but birth.", {
        context: "David's lament for his friend Jonathan, with whom he had made a covenant of friendship (1 Samuel 18:3).",
      }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "I'm so sorry. I know how much they meant to you, and I'm here." },
    topics: [{ slug: "bereavement", title: "Bereavement" }, { slug: "sympathy", title: "Sympathy" }],
    related: ["sudden-loss", "loss-of-spouse", "loss-of-child"],
  },
  {
    slug: "sudden-loss",
    heading: "Bible Verses for a Sudden or Tragic Loss",
    short: "A sudden or tragic loss",
    intro:
      "These Bible verses for a sudden or tragic loss are for families shaken by a death no one saw coming: an accident, a sudden illness, violence or disaster. When there was no time to say goodbye, grief often comes with shock and questions. These passages do not offer reasons. They speak of God as a refuge in trouble, of honest lament, and of the Spirit who prays when there are no words. There are short verses for a card and passages to read, each in the Berean Standard Bible with a line on why it fits.",
    passages: [
      sp("PSA 46:1", "card", "God as refuge and strength, ever present when trouble comes without warning."),
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, in the shock of the first days."),
      sp("PSA 61:2", "card", "Lead me to the rock that is higher than I: a prayer when the ground gives way."),
      sp("JHN 16:33", "card", "In the world you will have tribulation; take courage, Jesus has overcome the world."),
      sp("ISA 43:2", "card", "Through the waters and the fire, God is with his people."),
      sp("PSA 9:9", "card", "The LORD a refuge for the oppressed, a stronghold in times of trouble."),
      sp("NAM 1:7", "card", "The LORD is good, a refuge in the day of distress."),
      sp("PSA 62:8", "card", "Pour out your heart to him: grief and questions can be brought to God."),
      sp("ROM 8:26", "card", ROMANS_8_26),
      sp("PSA 46:1-11", "reading", "God our refuge when the earth gives way and the mountains fall into the sea. Be still, and know."),
      sp("PSA 13:1-6", "reading", "How long, O LORD? A lament that dares to ask, and still ends in trust."),
      sp("LAM 3:19-26", "reading", "Remembering affliction, and calling to mind the mercies that are new every morning."),
    ],
    card: { heading: DEFAULT_HEADING, inside: "I'm so sorry. There are no words for this. I'm here, and I'm praying for you." },
    topics: [{ slug: "consolation-in-affliction", title: "Consolation in Affliction" }, { slug: "mourning", title: "Mourning" }],
    related: ["loss-of-child", "loss-of-friend", "loss-to-suicide"],
  },
  {
    slug: "after-illness",
    heading: "Bible Verses After a Long Illness",
    short: "After a long illness",
    intro:
      "These Bible verses after a long illness are for families whose loved one has died after months or years of sickness, and for the friends who walked with them. Grief after a long illness often mixes sorrow with exhaustion, and relief that the suffering is over with guilt for feeling it. These passages speak of strength for the weary, rest, and, for a believer, a body raised imperishable. Verses of a believer's hope are labelled. Every verse is in the Berean Standard Bible, with a line on why it fits.",
    passages: [
      sp("PSA 73:26", "card", "When heart and flesh fail, God is the strength of the heart."),
      sp("MAT 11:28", "card", "Come to me, all who are weary and burdened, and I will give you rest."),
      sp("PSA 4:8", "card", "Lying down in peace and sleeping, after many sleepless nights."),
      sp("ISA 40:29-31", "card", "Strength for the weary, for carers who have given everything."),
      sp("ROM 8:18", "card", "Present sufferings not worth comparing with the glory to come.", { believer: true }),
      sp("PSA 116:15", "card", "The death of God's people is precious to him.", {
        believer: true,
        context: "\"Precious in the sight of the LORD is the death of His saints\": the death of his people is costly to God, and he does not treat it lightly.",
      }),
      sp("PHP 1:21-23", "card", "To live is Christ and to die is gain: Paul's longing to be with Christ.", { believer: true }),
      sp("REV 21:4", "card", "No more death, mourning, crying or pain.", { later: true }),
      sp("ISA 35:10", "card", "Sorrow and sighing will flee.", { later: true }),
      sp("2CO 4:16-18", "reading", "Outwardly wasting away, inwardly renewed day by day."),
      sp("2CO 5:1-8", "reading", "A building from God, eternal in the heavens, when this earthly tent is torn down.", { believer: true }),
      sp("1CO 15:42-44", "reading", "Sown in weakness, raised in power: the resurrection body.", { believer: true }),
    ],
    card: { heading: DEFAULT_HEADING, inside: "You cared so faithfully. I'm thinking of you, and praying you find rest." },
    topics: [{ slug: "resurrection", title: "The Resurrection" }, { slug: "heaven", title: "Heaven" }],
    related: ["loss-of-spouse", "loss-of-grandparent", "loss-of-mother"],
  },
  {
    slug: "loss-to-suicide",
    heading: "Bible Verses for a Loss to Suicide",
    short: "A loss to suicide",
    intro:
      "These Bible verses for a loss to suicide are for families and friends grieving someone who died by suicide, and for those who want to comfort them. This page does not judge, and it does not say where anyone is now. Grief after suicide often comes with guilt, anger and questions that have no answers, and every one of them can be brought to God. The verses here speak of God's nearness, his gentleness with the bruised, and his love. Each is in the Berean Standard Bible, with a line on why it fits.",
    explainer: {
      title: "For those left behind",
      paragraphs: [
        "If someone you love has died by suicide, you may be carrying questions that no one can answer: why, what you missed, what you might have said. Guilt, anger, numbness and relief can all come at once. None of these shut you out from God. The psalms invite you to pour out your heart to him (Psalm 62:8), and he is near to the brokenhearted.",
        "Some fear that a believer who dies this way is lost. Baptists believe that those who truly belong to Christ are kept by him and will never fall away, and Paul's list of what cannot separate them from God's love leaves nothing out (Romans 8:38–39). This page does not speak about any particular person; only God sees the heart. But it can say that God's love is stronger than our worst moments.",
        "You do not have to carry this alone. Support groups for people who have lost someone to suicide meet in person and online, and grief care is listed in the site's help directory.",
      ],
    },
    helpStrip: true,
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, whatever the questions."),
      sp("PSA 147:3", "card", "The God who binds up wounds, written for hearts that feel broken."),
      sp("PSA 139:12", "card", "Even the darkness is not dark to God."),
      sp("MAT 11:28", "card", "Come to me, all who are weary and burdened, and I will give you rest."),
      sp("PSA 103:13-14", "card", "God knows our frame and is mindful that we are dust, with a father's compassion."),
      sp("ISA 42:3", "card", "A bruised reed he will not break.", {
        context: "Said of God's Servant, the Messiah: he is gentle with the bruised and the faint.",
      }),
      sp("LAM 3:22-23", "card", "Mercies new every morning, written by someone grieving amid ruins."),
      sp("ROM 8:26", "card", ROMANS_8_26),
      sp("PSA 62:8", "card", "Pour out your heart to him: grief, guilt and anger can all be brought to God."),
      sp("PSA 139:7-12", "reading", "Nowhere we can go is beyond God's presence, not even the depths or the dark."),
      sp("JHN 11:32-36", "reading", "Jesus weeping with Mary at her brother's tomb."),
      sp("ROM 8:35-39", "reading", "Nothing in all creation can separate those in Christ from the love of God.", {
        believer: true,
        context: "Paul writes of those who belong to Christ: nothing in all creation, death included, can separate them from God's love.",
      }),
    ],
    card: { heading: "Holding you in prayer", inside: "I'm so sorry. I'm here for you, today and in the months ahead." },
    topics: COMFORTER_TOPICS,
    related: ["sudden-loss", "faith-unknown", "loss-of-friend"],
  },
  {
    slug: "faith-unknown",
    heading: "Bible Verses When You Don't Know Where They Stood with God",
    short: "Not knowing where they stood with God",
    intro:
      "These Bible verses are for when you don't know where they stood with God: for families grieving someone whose faith they never knew, or who seemed far from God, and for friends who want to write to them. The card verses here speak only of God's nearness to those who mourn, not of where the one who died is now. The readings speak of God as a Judge who does right and who sees what we cannot. Each is in the Berean Standard Bible, with a line on why it fits.",
    explainer: {
      title: "What this page will and won't say",
      paragraphs: [
        "This site believes that salvation comes through faith in Jesus Christ. It also believes that only God knows what passed between a person and himself, especially in their last days and hours, and it will not guess. Christ received a dying man who turned to him at the very end (Luke 23:42–43); that is not a promise about anyone in particular, but it is a reason not to pronounce.",
        "What can be said is this: God is the Judge of all the earth, and he does what is right (Genesis 18:25). He is compassionate to all he has made (Psalm 145:9). He is near to the brokenhearted (Psalm 34:18). And every question, fear and sorrow can be poured out to him.",
        "If you are writing to a family in this grief, speak of their loss and of God's nearness to them, not of where their loved one is.",
      ],
    },
    passages: [
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted, which needs no answer to any question first."),
      sp("MAT 5:4", "card", "Jesus calls those who mourn blessed, and promises them comfort."),
      sp("PSA 147:3", "card", "The God who binds up wounds, written for hearts that feel broken."),
      sp("PSA 145:8-9", "card", "The LORD is gracious and compassionate, and his compassion rests on all he has made."),
      sp("PSA 62:8", "card", "Pour out your heart to him: fears and questions too."),
      sp("JHN 11:35", "card", "Jesus wept.", { context: JOHN_11_35_CONTEXT }),
      sp("ROM 8:26", "card", ROMANS_8_26),
      sp("PSA 56:8", "card", "God keeps count of every tear."),
      sp("PSA 46:1", "card", "God as refuge and strength, ever present in trouble."),
      sp("GEN 18:25b", "reading", "The Judge of all the earth does what is right.", {
        part: "Will not the Judge of all the earth do what is right?”",
        context: "Abraham's question as he pleaded with God: God is the Judge who always does what is right, and he knows what we cannot see.",
      }),
      sp("PSA 139:1-12", "reading", "God knows every person completely, and no darkness hides anyone from him."),
      sp("PSA 103:8-18", "reading", "The LORD is compassionate and gracious; he knows how we are formed."),
      sp("LUK 23:42-43", "reading", "The dying thief and Christ's answer to him.", {
        context: "Christ received a dying man who turned to him at the very end. Only God sees what passes between a person and him; this is not a promise about anyone in particular, but a reason not to guess.",
      }),
      sp("JHN 11:32-36", "reading", "Jesus weeping with those who grieve."),
    ],
    card: { heading: DEFAULT_HEADING, inside: "I'm so sorry for your loss. I'm thinking of you and praying for you." },
    topics: COMFORTER_TOPICS,
    related: ["loss-to-suicide", "sudden-loss", "loss-of-friend"],
  },
  {
    slug: "loss-of-pet",
    heading: "Bible Verses for the Loss of a Pet",
    short: "A pet",
    intro:
      "These Bible verses for the loss of a pet are for anyone grieving a dog, a cat or another animal who shared their home and their days. The grief is real, and so is God's care for every creature he made: not one sparrow is forgotten before him. This page is honest about what Scripture says and does not say about animals. There are short verses to send or write in a card and passages to read, each in the Berean Standard Bible, with a line on why it fits.",
    explainer: {
      title: "What the Bible does and doesn't say",
      paragraphs: [
        "God made every creature and called it good, and he cares for each one: he gives the animals their food (Psalm 147:9), he preserves man and beast (Psalm 36:6), and not one sparrow falls to the ground apart from him (Matthew 10:29). Caring well for an animal is part of righteousness (Proverbs 12:10).",
        "The Bible does not say whether animals have a place in the new creation, and this page will not promise what Scripture does not say. It does speak of all creation one day set free from decay (Romans 8:21). Your grief is not foolish; it is love for one of God's creatures.",
      ],
    },
    passages: [
      sp("PSA 145:9", "card", "The LORD is good to all, and his compassion rests on all he has made."),
      sp("PSA 36:6", "card", "O LORD, you preserve man and beast."),
      sp("MAT 10:29", "card", "Not one sparrow falls to the ground apart from your Father."),
      sp("LUK 12:6", "card", "Not one sparrow is forgotten by God."),
      sp("PRO 12:10", "card", "A righteous man regards the life of his animal.", { context: "Caring well for an animal is part of righteousness." }),
      sp("JOB 12:10", "card", "The life of every living thing is in God's hand."),
      sp("PSA 147:9", "card", "God gives the animals their food."),
      sp("PSA 34:18", "card", "God's nearness to the brokenhearted."),
      sp("JOB 12:7-10", "reading", "Ask the animals and they will teach you: the hand of the LORD has done this."),
      sp("PSA 104:24-30", "reading", "All creatures look to God, and he renews the face of the earth."),
      sp("ROM 8:19-21", "reading", "All creation waiting to be set free from its bondage to decay.", {
        context: "Paul speaks of all creation set free from decay when God's children are revealed. It is hope for creation; it does not say what becomes of a particular animal.",
      }),
    ],
    card: { heading: "Thinking of you", inside: "I'm so sorry. They were so loved, and I know how much you will miss them." },
    topics: [{ slug: "sympathy", title: "Sympathy" }],
    related: ["loss-of-friend"],
  },
];
