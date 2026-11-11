// Pages for the heart (design 3.2, 4.2, 4.5): anxious, afraid, overwhelmed, can't sleep, exhausted.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { CLINICAL, COUNSELLING } from "./help";
import type { WhenTopic } from "./types";

const PEACE = { slug: "peace", title: "Peace" };
const REST = { slug: "rest", title: "Rest" };
const PROTECTION = { slug: "protection", title: "Protection" };

export const HEART_TOPICS: WhenTopic[] = [
  {
    slug: "anxious",
    group: "heart",
    label: "Anxious",
    heading: "What the Bible Says When You're Anxious",
    searchTitle: "Bible Verses for Anxiety and Worry",
    intro: "When anxiety won't let go, these verses from the Bible speak to the worry, and point to the God who carries it. They are short enough to hold in your mind on a hard night. Start with the first, read it slowly, and breathe. Below them are Jesus' own words about worry, a psalm to pray, and a word for you.",
    passages: [
      sp("PHP 4:6-7", "card", "Bring every worry to God, and receive a peace beyond understanding.", { context: CONTEXT.philippians4 }),
      sp("1PE 5:7", "card", "Cast it on him, because he cares for you."),
      sp("ISA 41:10", "card", "Do not fear: God is with you, and he holds you up."),
      sp("PSA 94:19", "card", "When anxiety overwhelms you, God's comfort reaches you."),
      sp("MAT 6:34", "card", "One day at a time.", { context: CONTEXT.matthew6 }),
      sp("JHN 14:27", "card", "The peace Jesus gives, not the kind the world gives."),
      sp("ISA 26:3", "card", "Perfect peace for the mind that rests on God."),
      sp("PSA 55:22", "card", "Cast your burden on the LORD, and he will sustain you."),
      sp("MAT 6:25-34", "reading", "Jesus on worry: the birds, the lilies and a Father who knows.", { context: CONTEXT.matthew6 }),
      sp("PSA 139:23-24", "blessing", "Asking God to search your anxious thoughts and lead you."),
    ],
    note: `Anxiety is not proof of sin or of weak faith. Your heart racing, your mind running ahead to everything that could go wrong: Scripture does not answer that with “stop it”. It answers with “bring it”. Paul, writing from prison, says to present your requests to God with thanksgiving, and Peter says to cast all your anxiety on him, because he cares for you (Philippians 4:6; 1 Peter 5:7).

Try one verse, slowly, out loud if you can. Breathe in on the first half and out on the second. Name the worry to God by its name, then name the next one. You do not have to feel calm for him to hear you.

Jesus tells his followers to look at the birds and the flowers, and to take one day at a time. That is an invitation, not a rebuke.

If anxiety is constant, keeps you from sleeping or brings panic attacks, please talk to a doctor or a counsellor. That is wisdom, not unbelief; medicine and counselling are among God's gifts. The help below can point you to someone.`,
    help: { level: "foot", entries: [...COUNSELLING, CLINICAL] },
    topics: [{ slug: "care", title: "Care" }, PEACE, { slug: "prayer", title: "Prayer" }],
    related: ["afraid", "overwhelmed", "cant-sleep"],
    words: ["worried", "worry", "worrying", "anxiety", "panic", "panic attack", "nervous", "on edge", "uneasy"],
  },
  {
    slug: "afraid",
    group: "heart",
    label: "Afraid",
    heading: "What the Bible Says When You're Afraid",
    searchTitle: "Bible Verses About Fear: When You're Afraid",
    intro: "When you're afraid, the Bible's answer is one of its most repeated commands, “do not fear”, and it almost always comes with a reason: God is with you. These verses are for fear of something real, a threat, a danger or a step you have to take. Hold one of them, say it aloud, and take the next step with God beside you.",
    passages: [
      sp("ISA 41:10", "card", "Do not fear: God is with you, he strengthens you and holds you up."),
      sp("PSA 56:3-4", "card", "Trust is what you do while you are afraid."),
      sp("JOS 1:9", "card", "Courage, because the LORD goes with you wherever you go."),
      sp("PSA 27:1", "card", "With the LORD as your light, whom shall you fear?"),
      sp("2TI 1:7", "card", "God's Spirit gives power, love and self-control, not timidity."),
      sp("DEU 31:8", "card", "He goes ahead of you, and he will never leave you."),
      sp("PSA 34:4", "card", "David sought the LORD and was delivered from his fears."),
      sp("ISA 43:1", "card", "Called by name, and belonging to God."),
      sp("PSA 27:1-14", "reading", "A psalm of confidence that still admits the dangers are real."),
      sp("MRK 4:35-41", "reading", "A storm, frightened disciples, and Jesus who calms it."),
      sp("PSA 61:1-3", "blessing", "A prayer to be led to the rock that is higher than you."),
    ],
    person: {
      id: "gideon-jdg-6-11",
      line: "Gideon was threshing wheat in a winepress, hiding from his enemies, when the angel greeted him as a “mighty man of valor” (Judges 6:11–16).",
    },
    note: `Fear is not a sin. It is what a person feels when something real threatens them, and Scripture is full of frightened people. When God says “do not fear”, it is rarely a scolding. It nearly always comes with a promise: I am with you, I will help you, I have called you by name.

Courage, in the Bible, is not the absence of fear. Gideon was hiding when God called him. David wrote, “When I am afraid, I put my trust in You” (Psalm 56:3): not if, but when. Trust is what you do while you are still afraid.

So name what you are afraid of to God, plainly. Say it out loud if you can. Then take one verse with you, and take the next step, even a small one. You are not walking into it alone.

If your fear comes from someone at home who hurts or threatens you, the page for being hurt at home is for you, and it has help from people trained to listen.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "fear-unholy", title: "Unholy Fear" }, { slug: "courage", title: "Courage" }, PROTECTION],
    related: ["anxious", "troubled-times", "facing-surgery"],
    words: ["afraid", "fear", "scared", "frightened", "terrified", "fearful"],
  },
  {
    slug: "overwhelmed",
    group: "heart",
    label: "Overwhelmed",
    heading: "What the Bible Says When You Feel Overwhelmed",
    searchTitle: "Bible Verses for Stress and Feeling Overwhelmed",
    intro: "When you feel overwhelmed, with too much to do, too much to carry and too little left, the Bible speaks of a Savior who invites the weary to rest. These verses are for the days when everything is urgent and you cannot see past the next hour. Read one, put something down, and take one step.",
    passages: [
      sp("MAT 11:28-30", "card", "Jesus' invitation to the weary: come, and rest."),
      sp("PSA 61:2", "card", "When your heart is faint, a rock higher than you."),
      sp("ISA 40:29", "card", "Strength for the weary and power for the faint."),
      sp("EXO 14:14", "card", "The LORD will fight for you."),
      sp("2CO 12:9", "card", "Grace that is enough, and power in weakness.", { context: CONTEXT.thorn }),
      sp("PSA 46:10", "card", "Stop, and know that he is God.", { context: CONTEXT.beStill }),
      sp("PSA 62:1-2", "card", "Rest for the soul in God alone."),
      sp("LUK 10:38-42", "reading", "Martha, busy and upset, and Jesus' gentle answer.", {
        context: "Jesus speaks to Martha gently, by name, twice. He is not despising her work; he is inviting her to sit down.",
      }),
      sp("PSA 61:1-8", "reading", "A prayer from the ends of the earth for a faint heart."),
      sp("PSA 142:1-3", "blessing", "Pouring out your complaint when your spirit is faint."),
    ],
    person: {
      id: "martha-luk-10-38",
      line: "Martha was busy serving Jesus himself, and he told her gently, by name, that she was “worried and upset about many things” (Luke 10:41).",
    },
    note: `Jesus did not invite the organised and the capable. He invited “all you who are weary and burdened”, and promised rest (Matthew 11:28). If that is you today, the invitation is for you.

You are allowed to put things down. Not everything on your list is yours to carry, and not everything has to be done today. Martha was busy with good work, serving Jesus himself, and he spoke to her gently, by name, twice. He was not despising what she did. He was inviting her to sit down.

When everything feels urgent, it can help to write it all down, give the list to God in prayer, and then choose one next step. One is enough for today. Ask for help with the rest; that is not weakness.

If being overwhelmed has gone on for a long time, or has turned into hopelessness, please talk to someone you trust or to a doctor. You were never meant to carry everything alone.`,
    help: { level: "none", entries: [] },
    topics: [REST, PEACE, { slug: "waiting-upon-god", title: "Waiting Upon God" }],
    related: ["anxious", "exhausted", "discouraged"],
    words: ["overwhelmed", "stress", "stressed", "too much", "pressure", "swamped", "can't cope", "busy"],
  },
  {
    slug: "cant-sleep",
    group: "heart",
    label: "Can't sleep",
    heading: "What the Bible Says When You Can't Sleep",
    searchTitle: "Bible Verses for Sleep: When You Can't Sleep",
    intro: "When you can't sleep, and your mind races through the night, these verses from the Bible are short enough to hold in the dark. They speak of a God who does not sleep, so that you do not have to stay on guard. Read one slowly, give each worry to him by name, and rest in the words.",
    passages: [
      sp("PSA 4:8", "card", "Lying down in peace, because the LORD keeps you safe."),
      sp("PSA 3:5", "card", "Sleep and waking, both held by God.", {
        context: "Written as David fled from his own son Absalom. The psalm places sleep and trust in the middle of danger.",
      }),
      sp("PRO 3:24", "card", "Lying down without fear, and sweet sleep."),
      sp("PSA 127:2", "card", "He gives sleep to those he loves.", { context: CONTEXT.sleepGift }),
      sp("PSA 121:3-4", "card", "The One who keeps you never sleeps."),
      sp("PSA 63:6", "card", "Remembering God through the watches of the night."),
      sp("ISA 26:3", "card", "Perfect peace for a mind that rests on him."),
      sp("PSA 121:1-8", "reading", "A psalm of the God who keeps you, by day and by night."),
      sp("PSA 91:1-6", "reading", "Resting in the shadow of the Almighty.", { context: CONTEXT.psalm91 }),
      sp("PSA 4:8", "blessing", "A one-line prayer for lying down tonight."),
    ],
    person: {
      id: "david-rut-4-17",
      line: "David wrote of lying down, sleeping and waking again, “for the LORD sustains me”, while he was fleeing from his son Absalom (Psalm 3).",
    },
    note: `Lying awake with a racing mind is hard, and it is common. The night can make every worry look larger than it is. You do not have to fight for sleep tonight.

Instead, try this: choose one verse below and read it slowly, two or three times. Then give your worries to God one at a time, by name, and leave each with him. The psalm says that he who watches over you will not slumber (Psalm 121:3). He is awake, so you do not have to be on guard.

Sleep is a gift God gives, not something you have to earn (Psalm 127:2). David wrote of lying down and sleeping while he was in real danger, because the LORD sustained him. Reading a verse will not make you fall asleep, but it can turn a sleepless hour into a prayer.

If sleep problems persist, affect your daily life or worry you, please talk to a doctor. Poor sleep can have causes worth looking into, and getting help with it is wise.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "sleep", title: "Sleep" }, PEACE, PROTECTION],
    related: ["anxious", "overwhelmed", "exhausted"],
    words: ["insomnia", "sleep", "sleepless", "awake", "can't sleep", "cannot sleep", "night", "racing mind"],
  },
  {
    slug: "exhausted",
    group: "heart",
    label: "Exhausted",
    heading: "What the Bible Says When You're Exhausted",
    searchTitle: "Bible Verses for When You're Tired and Weary",
    intro: "When you're tired and weary, worn down by work, caring, worry or a long season with no break, the Bible speaks of a God who gives rest and does not ask you to earn it. These verses are for the bone-tired. Read one, and if you can, let yourself stop for a while.",
    passages: [
      sp("MAT 11:28-30", "card", "Rest for the weary, from one who is gentle and humble in heart."),
      sp("ISA 40:29-31", "card", "Strength for the faint, and wings like eagles."),
      sp("PSA 23:1-3", "card", "The Shepherd who makes you lie down and restores your soul."),
      sp("MRK 6:31", "card", "Jesus tells his tired friends to come away and rest.", {
        context: "Jesus himself told his tired disciples to come away and rest.",
      }),
      sp("PSA 127:2", "card", "Toiling late is not the only way: God gives sleep.", { context: CONTEXT.sleepGift }),
      sp("EXO 33:14", "card", "God's presence goes with you, and he gives rest."),
      sp("PSA 4:8", "card", "Lying down in peace tonight."),
      sp("ISA 40:27-31", "reading", "The everlasting God, who never grows tired, strengthens the weary."),
      sp("EXO 18:17-23", "reading", "Moses learns he cannot carry it all alone.", {
        context: "Moses' father-in-law tells him the work is too heavy to handle alone, and to share the load. That is good counsel still.",
      }),
      sp("PSA 25:4-5", "blessing", "Asking God to show you his ways and lead you."),
    ],
    person: {
      id: "moses-exo-2-10",
      line: "Moses judged the people by himself from morning until evening, until his father-in-law told him the work was too heavy for him to carry alone (Exodus 18).",
    },
    note: `Rest is God's idea. He built a day of rest into the week, and when his disciples came back worn out, Jesus told them to come away with him to a quiet place and rest a while (Mark 6:31). Exhaustion is not laziness, and rest is not unbelief.

Moses tried to carry a whole people's problems by himself, from morning to evening, until his father-in-law said plainly that he could not do it alone (Exodus 18). That is still good counsel. What could you share? Who could you ask?

If you are weary in your soul as well as your body, the invitation of Jesus is for you: come to him and find rest. He is gentle and humble in heart, and his yoke is easy.

Long exhaustion can have medical causes. If it does not lift with rest, or comes with low mood that will not shift, please see a doctor. Looking after your body is part of looking after the life God gave you.`,
    help: { level: "none", entries: [] },
    topics: [REST, { slug: "patience", title: "Patience" }],
    related: ["overwhelmed", "cant-sleep", "caregiving"],
    words: ["tired", "weary", "exhausted", "burnout", "burned out", "burnt out", "worn out", "drained", "fatigue"],
  },
];
