// Pages for the body (design 3.2, 4.2, 4.5): facing surgery, sick, a hard diagnosis, caregiving, dying. None of them
// promises healing (design 2.5 rule 1), and each says once, gently, that doctors and medicine are among God's gifts.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { COMMUNITY } from "./help";
import type { WhenTopic } from "./types";

const WAITING_ROOM = "For the family in the waiting room";
const MY_TIMES = "My times are in Your hands;";
const CONSOLATION = { slug: "consolation-in-affliction", title: "Consolation in Affliction" };
const SICKNESS = { slug: "sickness", title: "Sickness" };
const AFFLICTIONS = { slug: "afflictions-and-adversities", title: "Afflictions and Adversities" };

export const BODY_TOPICS: WhenTopic[] = [
  {
    slug: "facing-surgery",
    group: "body",
    label: "Facing surgery",
    heading: "What the Bible Says When You're Facing Surgery",
    searchTitle: "Bible Verses Before Surgery",
    intro: "When you're facing surgery, it is natural to be afraid, and the Bible has words for the night before, the morning of, and the hours in the waiting room. These verses are short enough to hold as you are wheeled in. Your times are in God's hands, and so are the people caring for you.",
    passages: [
      sp("ISA 41:10", "card", "God's hand holding you up as you go in."),
      sp("PSA 56:3", "card", "Trusting God while you are afraid."),
      sp("PSA 23:4", "card", "Through the darkest valley, and not alone."),
      sp("DEU 31:8", "card", "The LORD goes ahead of you into that room."),
      sp("PSA 31:14-15a", "card", "Your times are in his hands.", {
        part: MY_TIMES,
        context: "The hours ahead, and the people caring for you, are held by God.",
      }),
      sp("ISA 26:3", "card", "Perfect peace for a mind kept on God."),
      { ...sp("PHP 4:6-7", "card", "For those waiting: bring every worry to God.", { context: CONTEXT.philippians4 }), group: WAITING_ROOM },
      { ...sp("PSA 46:1", "card", "God, present in trouble, and in the waiting room too."), group: WAITING_ROOM },
      sp("PSA 121:1-8", "reading", "The LORD who watches over your going out and your coming in."),
      sp("ISA 38:1-5", "reading", "Hezekiah's prayer when he was ill, and God's answer.", {
        context: "God answered Hezekiah's prayer, and Isaiah also told them to apply a poultice of figs (Isaiah 38:21). Prayer and medicine are not rivals. This was Hezekiah's answer; it is not a promise of the same outcome for everyone.",
      }),
      sp("PSA 31:14-15a", "blessing", "A short prayer to say before the operation.", { part: MY_TIMES }),
    ],
    person: {
      id: "hezekiah-2ki-16-20",
      line: "When King Hezekiah was ill, he prayed and wept, and God answered him; his cure also came through a poultice of figs (Isaiah 38).",
    },
    note: `It is natural to be afraid before an operation. You are handing yourself over to other people's skill, and you will not be awake to see what happens. Bring that fear to God plainly; he is not disappointed in you for feeling it.

Your surgeons, anaesthetists and nurses are part of God's care for you, not rivals to it. Paul called his friend Luke “the beloved physician” (Colossians 4:14). When Hezekiah was ill, God answered his prayer, and the prophet Isaiah also told them to apply a poultice of figs. Prayer and medicine belong together.

“My times are in Your hands,” prays Psalm 31. The hours ahead, the people around you, and whatever comes after are held by God. That is not a promise of a particular outcome; it is a promise about who holds you.

Ask someone to pray for you at the time of the operation, and tell them when it is. If you are the one waiting for news, the last two verses above are for you. Let others sit with you, and give each slow hour to God.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "physician", title: "Physician" }, SICKNESS, { slug: "prayer", title: "Prayer" }],
    related: ["afraid", "sick", "serious-diagnosis"],
    elsewhere: [{ href: "/prayers/before-surgery", title: "A prayer before surgery" }],
    words: ["surgery", "operation", "hospital", "procedure", "anaesthetic", "anesthesia", "before surgery"],
  },
  {
    slug: "sick",
    group: "body",
    label: "Sick or in pain",
    heading: "What the Bible Says When You're Sick or in Pain",
    searchTitle: "Bible Verses for Sickness and Chronic Pain",
    intro: "When you're sick or in pain, whether for a week or for years, the Bible speaks honestly of bodies that fail and of a God whose grace is enough. These verses are for long nights, slow recoveries and chronic illness that does not go away. They make no promises Scripture does not make, and they keep you company.",
    passages: [
      sp("2CO 12:9", "card", "Grace that is enough when the weakness stays.", { context: CONTEXT.thorn }),
      sp("PSA 73:26", "card", "When flesh and heart fail, God remains."),
      sp("JER 17:14", "card", "A prayer for healing you can make your own.", {
        context: "Jeremiah's prayer for healing of body and soul. You can ask God to heal you; asking is itself an act of faith.",
      }),
      sp("PSA 121:1-2", "card", "Help from the Maker of heaven and earth."),
      sp("2CO 4:16", "card", "Wasting away outwardly, renewed inwardly day by day."),
      sp("ROM 8:18", "card", "Present suffering, and the glory to come."),
      sp("PSA 6:2", "card", "Honest words for a body in pain."),
      sp("ISA 40:29", "card", "Strength for the weak."),
      sp("2CO 12:7-10", "reading", "Paul's thorn, his prayers, and the grace that was enough.", { context: CONTEXT.thorn }),
      sp("JAS 5:13-16", "reading", "Calling the church to pray for the sick.", {
        context: "James tells the sick to ask the elders of the church to pray over them. Baptists read the anointing oil as either a sign or the medicine of the day; either way, it is good to ask your church to pray with you.",
      }),
      sp("PSA 6:2-4", "blessing", "A prayer for mercy and healing."),
    ],
    person: {
      id: "epaphroditus-php-2-25",
      line: "Epaphroditus was so ill that he nearly died, and Paul wrote of the sorrow it caused and of God's mercy to them both (Philippians 2:25–30).",
    },
    note: `God can heal, and sometimes he does. Sometimes he gives grace to carry an illness instead. Paul asked three times for his “thorn” to be taken away, and God answered that his grace was sufficient (2 Corinthians 12:9). Paul also left his friend Trophimus sick at Miletus (2 Timothy 4:20). Whether you are healed is not a verdict on your faith.

Ask your church to pray with you; James tells the sick to call for the elders (James 5:14). Keep seeing your doctors and taking your treatment. Medicine and the people who give it are among God's gifts, and using them is part of trusting him.

Chronic illness can be lonely. People stop asking, or ask the wrong things. Tell those around you what actually helps: a meal, a lift, a visit, a message that expects no reply.

You can be honest with God about your pain. The psalms are full of people who were, and who asked him plainly to heal them. He hears that prayer.`,
    help: { level: "none", entries: [] },
    topics: [SICKNESS, { slug: "suffering", title: "Suffering" }, AFFLICTIONS],
    related: ["serious-diagnosis", "facing-surgery", "exhausted"],
    words: ["sick", "illness", "ill", "chronic illness", "chronic pain", "pain", "healing", "disease", "unwell"],
  },
  {
    slug: "serious-diagnosis",
    group: "body",
    label: "A hard diagnosis",
    heading: "What the Bible Says When You've Had a Hard Diagnosis",
    searchTitle: "Bible Verses for a Hard Diagnosis or Cancer",
    intro: "When you've had a hard diagnosis, cancer or other bad news from the doctor, or you are waiting for results, the Bible has words for the moment everything shifts. These verses are for the shock, the waiting rooms and the long road of treatment. You do not have to find the right words or feelings; let these speak for you.",
    passages: [
      sp("PSA 46:1", "card", "God, our refuge, present in trouble."),
      sp("ISA 43:2", "card", "Through deep waters, with God beside you."),
      sp("JOS 1:9", "card", "Courage, for the LORD goes with you."),
      sp("PSA 112:7", "card", "Not afraid of bad news.", { context: CONTEXT.badNews }),
      sp("ISA 41:10", "card", "Held up by God's righteous right hand."),
      sp("LAM 3:22-23", "card", "Mercies new every morning, treatment days included."),
      sp("PSA 31:14-15a", "card", "Your times are in his hands.", { part: MY_TIMES }),
      sp("PSA 46:1-11", "reading", "God our refuge, though the earth gives way."),
      sp("2CO 4:16-18", "reading", "Renewed inwardly, and fixing our eyes on what is unseen."),
      sp("PSA 86:6-7", "blessing", "Calling on God in the day of trouble."),
    ],
    person: {
      id: "job-job-1-1",
      line: "Job lost his health along with almost everything else, said honestly how he felt, and God came and spoke to him (Job 1–2, 38–42).",
    },
    note: `Hard news can shake everything at once: your body, your plans, your sense of time. You do not have to have the right words or the right feelings. Job did not. He said what he felt, honestly, and God did not turn away from him.

Take it one step at a time: the next appointment, the next question, the next day. You do not have to understand the whole road to take the next step on it. God's mercies are new every morning (Lamentations 3:22–23), and that includes the mornings of treatment days.

Ask your doctors every question you have; write them down beforehand. Treatment and the people who give it are among God's good gifts. Scripture does not promise that every illness will be cured, and this page will not either. It does promise that God will be with you in deep waters (Isaiah 43:2).

Let others carry some of this. Tell a few people you trust, let your church pray, and accept the meals and the lifts. You were not meant to face this alone.`,
    help: { level: "none", entries: [] },
    topics: [AFFLICTIONS, { slug: "trial-of-faith", title: "The Trial of Faith" }, { slug: "hope", title: "Hope" }],
    related: ["sick", "facing-surgery", "dying"],
    words: ["cancer", "diagnosis", "diagnosed", "test results", "bad news", "tumor", "tumour", "waiting for results", "scan", "biopsy"],
  },
  {
    slug: "caregiving",
    group: "body",
    label: "Caring for someone ill",
    heading: "What the Bible Says When You're Caring for Someone Who Is Ill",
    searchTitle: "Bible Verses for Caregivers",
    intro: "When you're caring for someone who is ill, an aging parent, a sick husband or wife, or a child whose needs never stop, the Bible honours that work and speaks to the weariness that comes with it. These verses are for caregivers who have little left for themselves. Read one, and let someone care for you for a moment.",
    passages: [
      sp("GAL 6:2", "card", "Carrying one another's burdens."),
      sp("GAL 6:9", "card", "Do not grow weary in doing good.", { context: CONTEXT.dueTime }),
      sp("MAT 11:28", "card", "Rest for the weary carer."),
      sp("PSA 55:22", "card", "Cast your burden on the LORD."),
      sp("ISA 46:4", "card", "God carries his people into old age."),
      sp("MAT 25:40", "card", "Done for the least of these, done for Christ.", {
        context: "Jesus says that care given to the least of his brothers is given to him. Unseen care is seen.",
      }),
      sp("COL 3:23-24", "card", "Working with all your heart, as for the Lord."),
      sp("RUT 1:15-18", "reading", "Ruth's promise to stay with Naomi."),
      sp("ISA 40:28-31", "reading", "The God who never grows weary gives strength to those who are."),
      sp("PSA 90:17", "blessing", "Asking God to establish the work of your hands."),
    ],
    person: {
      id: "ruth-rut-1-4",
      line: "Ruth would not leave her widowed mother-in-law Naomi, and stayed to care for her in a strange land (Ruth 1:16–18).",
    },
    note: `Caring for someone you love is holy work. It is also exhausting work, often unseen, often without a day off, and mixed with grief for the person they used to be. You can feel love, resentment, tiredness and guilt in the same hour. God is not shocked by any of it.

Jesus said that what is done for the least of his brothers is done for him (Matthew 25:40). The meals, the medicines, the nights you were woken: he sees them all.

You need rest and help too, and asking for it is not failing. Scripture tells us to carry one another's burdens (Galatians 6:2), which means someone is meant to help carry yours. Let family, friends or your church take a turn. Ask the doctor or care team about respite and support for carers. The community-services line below can point you to local help.

Ruth would not leave Naomi, and God provided for them both through other people's kindness. Let that happen for you.`,
    help: { level: "foot", entries: [COMMUNITY] },
    topics: [{ slug: "patience", title: "Patience" }, CONSOLATION],
    related: ["exhausted", "sick", "dying"],
    words: ["caregiver", "carer", "caregiving", "caring for", "aging parent", "elderly parent", "dementia", "looking after"],
  },
  {
    slug: "dying",
    group: "body",
    label: "Facing death",
    heading: "What the Bible Says When You or Someone You Love Is Dying",
    searchTitle: "Bible Verses for the Dying and Their Families",
    intro: "When you or someone you love is dying, the Bible speaks with honesty and with hope: of the valley of the shadow of death, of a Shepherd who walks through it, and of the promises Jesus made to those who trust him. These verses are for the bedside, the hospice room and the last conversations. Read them aloud if you can.",
    passages: [
      sp("PSA 23:4", "card", "The Shepherd with you in the darkest valley.", {
        context: "David's trust in the LORD as his shepherd. It is an invitation to trust him too, whoever you are and wherever you stand.",
      }),
      sp("JHN 11:25-26", "card", "Jesus: the resurrection and the life.", { believer: true, context: CONTEXT.believerHope }),
      sp("ROM 14:8", "card", "Whether we live or die, we belong to the Lord.", { believer: true }),
      sp("PSA 73:26", "card", "When flesh and heart fail, God is our portion."),
      sp("2CO 5:1", "card", "A house from God, eternal in the heavens.", { believer: true }),
      sp("PHP 1:21", "card", "To live is Christ, and to die is gain.", { believer: true }),
      sp("JHN 3:16", "card", "God's love for the world, and eternal life for all who believe."),
      sp("REV 21:4", "card", "No more death, mourning, crying or pain.", { believer: true }),
      sp("JHN 14:1-6", "reading", "Jesus prepares a place, and is the way.", { believer: true }),
      sp("1CO 15:51-57", "reading", "Death swallowed up in victory.", { believer: true }),
      sp("ROM 10:9-13", "reading", "Everyone who calls on the name of the Lord will be saved.", {
        context: "For anyone not sure where they stand with God: everyone who calls on the name of the Lord will be saved. It is not too late.",
      }),
      sp("PSA 31:5", "blessing", "The prayer Jesus prayed as he died.", {
        context: "Jesus prayed these words as he died (Luke 23:46), and Christians have prayed them at the end ever since.",
      }),
    ],
    person: {
      id: "simeon-luk-2-25",
      line: "Simeon, an old man, held the infant Jesus in the temple and said he could now depart in peace, for he had seen God's salvation (Luke 2:25–32).",
    },
    note: `For the one who is dying, and for those beside them: it is all right to be afraid, and it is all right to say goodbye. Death is an enemy, and Scripture does not pretend otherwise. Jesus wept at a grave.

For those who trust Christ, death is not the end. Jesus said that he is the resurrection and the life, and promised a place prepared in his Father's house. The passages marked “For a believer” speak of that hope. As he died, Jesus prayed the words of Psalm 31:5, committing his spirit into his Father's hands, and Christians have prayed them at the end ever since.

If you are not sure where you stand with God, it is not too late. Everyone who calls on the name of the Lord will be saved (Romans 10:13). You can call on him now, in your own words. The Good News explains how.

Some practical words: say what matters while you can: thank you, I forgive you, I love you. Ask a pastor to visit and pray. Let the people caring for you help with pain and comfort; that is good care, not giving up.`,
    help: { level: "none", entries: [] },
    topics: [
      { slug: "death-of-saints", title: "The Death of Saints" },
      { slug: "resurrection", title: "The Resurrection" },
      { slug: "heaven", title: "Heaven" },
    ],
    related: ["grieving", "serious-diagnosis", "caregiving"],
    elsewhere: [{ href: "/study/the-good-news", title: "The Good News: how to be made right with God" }],
    words: ["dying", "death", "terminal", "terminal illness", "hospice", "end of life", "palliative", "last days", "facing death"],
  },
];
