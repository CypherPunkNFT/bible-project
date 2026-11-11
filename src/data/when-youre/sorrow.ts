// Pages for sorrow (design 3.2, 4.2, 4.5): depressed, discouraged, thoughts of suicide, lonely, grieving, heartbroken.
// The suicide page follows the safe-messaging rules of design 2.3: help first, no argument, no methods.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { CLINICAL, COUNSELLING } from "./help";
import type { WhenTopic } from "./types";

const DESPONDENCY = { slug: "despondency", title: "Despondency" };
const HOPE = { slug: "hope", title: "Hope" };
const CONSOLATION = { slug: "consolation-in-affliction", title: "Consolation in Affliction" };
const LOVE_OF_GOD = { slug: "love-of-god", title: "The Love of God" };

export const SORROW_TOPICS: WhenTopic[] = [
  {
    slug: "depressed",
    group: "heart",
    label: "Depressed",
    heading: "What the Bible Says When You're Depressed",
    searchTitle: "Bible Verses for Depression and Sadness",
    intro: "When you're depressed, the Bible does not tell you to cheer up; it gives you words for the dark and a God who stays in it with you. These verses come from people who knew heaviness from the inside: psalm writers, a prophet who asked to die, and the Lord who heals the brokenhearted. Read one slowly. It is true even on the days you cannot feel it.",
    passages: [
      sp("PSA 42:11", "card", "Words to say to your own soul on a heavy day.", {
        context: "The psalmist talks to his own soul. Asking “why are you downcast?” is not pretending; it is honesty and hope side by side.",
      }),
      sp("PSA 34:18", "card", "God comes close to the crushed, not only to the cheerful."),
      sp("PSA 40:1-2", "card", "Waiting in the pit, and a God who lifts you out of it."),
      sp("PSA 147:3", "card", "The One who counts the stars binds up broken hearts."),
      sp("LAM 3:22-23", "card", "Written among ruins: mercy that is new each morning."),
      sp("ISA 42:3", "card", "What is bruised is not thrown away.", {
        context: "Said of God's Servant, the Messiah: he does not break what is bruised or snuff out what is barely burning.",
      }),
      sp("PSA 3:3", "card", "God as the one who lifts your head when it hangs low."),
      sp("DEU 31:8", "card", "He goes ahead of you, and he does not leave."),
      sp("1KI 19:3-8", "reading", "Elijah at the end of himself, and how God cared for him.", { context: CONTEXT.elijah }),
      sp("PSA 42:1-11", "reading", "A whole psalm of thirst, tears and stubborn hope."),
      sp("PSA 13:1-6", "blessing", "A prayer for when the darkness has gone on too long.", { context: CONTEXT.psalm13 }),
    ],
    person: {
      id: "elijah-1ki-17-1",
      line: "Elijah, worn out and alone, lay down under a broom tree and asked God to take his life. God answered with sleep, food and, later, a gentle whisper (1 Kings 19).",
    },
    note: `Depression is real, and it can be an illness. It is not proof that you love God too little or that your faith has failed. Some of the most faithful people in Scripture knew this darkness. The writer of Psalm 42 asked his own soul why it was so downcast. Elijah lay down under a tree and asked to die.

Look at what God did for Elijah first. He did not lecture him. He let him sleep, woke him gently, and gave him food and water, twice. Only later did he speak, in a quiet whisper. Your body and your mind matter to God, and caring for them is part of faith, not a step away from it.

So please tell someone you trust how you are. See a doctor. Medicine and counselling are among God's good gifts, and using them is wisdom, not unbelief. Keep one verse near you for the hard hours, even if for now it feels like words on paper.

If you have thought about ending your life, please call or text the crisis line near the top of this page now. You do not have to wait until it gets worse.`,
    help: { level: "line", entries: [...COUNSELLING, CLINICAL] },
    topics: [DESPONDENCY, HOPE, CONSOLATION],
    related: ["discouraged", "lonely", "worthless", "thinking-of-suicide"],
    words: ["sad", "sadness", "empty", "numb", "low", "down", "depression", "blue", "dark"],
  },
  {
    slug: "discouraged",
    group: "heart",
    label: "Like giving up",
    heading: "What the Bible Says When You Feel Like Giving Up",
    searchTitle: "Bible Verses for When You Feel Like Giving Up",
    intro: "When you feel like giving up, the Bible speaks to the weariness of carrying something heavy for too long, and to the God who does not give up on you. These verses were written by people who were pressed, struck down and perplexed, and who found they were not destroyed. Read them slowly, one at a time.",
    passages: [
      sp("GAL 6:9", "card", "For when doing good has worn you out.", { context: CONTEXT.dueTime }),
      sp("2CO 4:8-9", "card", "Pressed on every side, but not crushed."),
      sp("ISA 40:31", "card", "New strength for those who wait on the LORD."),
      sp("PHP 1:6", "card", "What God begins, he finishes."),
      sp("PSA 27:13-14", "card", "Holding on to see God's goodness, and waiting with courage."),
      sp("2CH 15:7", "card", "Do not let your hands go limp.", {
        context: "Spoken by a prophet to King Asa as he began to restore true worship; it encourages anyone doing hard, right work.",
      }),
      sp("PSA 73:26", "card", "When your own strength fails, God is the strength of your heart."),
      sp("2CO 4:7-18", "reading", "Treasure in jars of clay: why we do not lose heart."),
      sp("HEB 12:1-3", "reading", "Running with endurance, looking to Jesus, so that you do not grow weary."),
      sp("PSA 143:7-8", "blessing", "A prayer for the morning after a long night."),
    ],
    person: {
      id: "jeremiah-2ch-35-25",
      line: "Jeremiah grew so weary of mockery that he decided to stop speaking for God, and found he could not: God's message was “a fire burning in my heart, shut up in my bones” (Jeremiah 20:9).",
    },
    note: `Feeling like giving up usually means you have been carrying something heavy for a long time: work that never seems to bear fruit, a prayer that has not been answered, a struggle that keeps coming back. It is not a sign that you are weak. Scripture's own people felt it. Jeremiah was so worn down by ridicule that he decided to stop speaking for God, and could not.

Hope, in the Bible, is not a feeling you have to produce on a bad day. It rests on a person. Paul was sure that God, who began a good work in his friends, would carry it on to completion (Philippians 1:6). That is God's work, not yours, and he does not drop what he has begun.

For today, it may be enough to do the next small thing, rest, and let someone else know how heavy it has become.

If “giving up” has started to mean giving up on life, please call or text the crisis line near the top of this page now. Reaching out is not giving up; it is a way of holding on.`,
    help: { level: "line", entries: ["crisis-text-line", ...COUNSELLING] },
    topics: [DESPONDENCY, { slug: "patience", title: "Patience" }, HOPE],
    related: ["thinking-of-suicide", "depressed", "exhausted"],
    words: ["giving up", "give up", "hopeless", "discouraged", "discouragement", "defeated", "quit", "no point"],
  },
  {
    slug: "thinking-of-suicide",
    group: "heart",
    label: "Thoughts of suicide",
    heading: "What the Bible Says When You're Having Thoughts of Suicide",
    searchTitle: "Thoughts of Suicide: Help and Hope from the Bible",
    intro: "If you're having thoughts of suicide, your pain deserves to be heard and you do not have to face it alone. The help above comes first. These Bible passages offer words for distress and reminders that your life matters to God. You can read one slowly, with someone beside you if possible.",
    passages: [
      sp("PSA 34:18", "card", "God is close to people whose hearts are broken."),
      sp("PSA 139:12", "card", "No darkness is too dark for God to see you in it."),
      sp("PSA 121:1-2", "card", "Help comes from the Maker of heaven and earth."),
      sp("MAT 11:28", "card", "Jesus invites the weary and burdened to come to him."),
      sp("PSA 62:8", "card", "You can pour out everything you feel to God."),
      sp("LAM 3:22-23", "card", "Mercy that is new each morning, written in a time of ruin."),
      sp("PSA 138:3", "card", "A psalmist remembers how God answered and gave strength.", {
        context: "A psalmist gives thanks for God's answer. This is testimony to draw encouragement from, not a prediction of survival or a substitute for urgent help.",
      }),
      sp("ISA 43:2", "card", "Deep waters, and God with you in them."),
      sp("1KI 19:3-8", "reading", "When Elijah could not go on, God gave him rest, food and company.", { context: CONTEXT.elijah }),
      sp("PSA 139:7-12", "reading", "There is nowhere you can go where God is not."),
      sp("PSA 139:13-16", "reading", "You were made by God, and your days are known to him."),
      sp("PSA 61:1-2", "blessing", "A short prayer for when your heart is faint."),
    ],
    person: {
      id: "elijah-1ki-17-1",
      line: "Elijah was so exhausted and alone that he asked God to take his life, and God answered with rest, food and company (1 Kings 19).",
    },
    note: `Your pain is real, and God sees it. He is near to the brokenhearted (Psalm 34:18). You do not have to explain it perfectly for someone to listen, and you do not have to feel hopeful before you ask for help.

You are not alone, and you do not have to carry this tonight by yourself. Please use the crisis contacts above now. If you are injured, in immediate danger or unable to stay safe, seek emergency help where you are. If you can, tell a trusted person nearby what is happening and ask them to stay with you while you reach out.

There is hope, and there is help. Your life was made by God, and it matters to him (Psalm 139:13–16). Thoughts like these can pass, and many people who have had them are glad they reached out. When Elijah was too exhausted to go on, God gave him rest, food and company before anything else.

If you are hurting yourself without wanting to die, you are welcome here too, and a doctor or counsellor can help. Reading a verse does not replace that help. Let someone help you carry this moment.`,
    help: { level: "urgent", entries: [] },
    topics: [HOPE, CONSOLATION, LOVE_OF_GOD],
    related: ["depressed", "lonely"],
    words: ["suicide", "suicidal", "want to die", "end my life", "kill myself", "self-harm", "cutting", "hurt myself", "no reason to live"],
  },
  {
    slug: "lonely",
    group: "heart",
    label: "Alone",
    heading: "What the Bible Says When You Feel Alone",
    searchTitle: "Bible Verses for Loneliness: When You Feel Alone",
    intro: "When you feel alone, the Bible names that ache honestly and speaks of a God who does not leave. These verses are for empty evenings, quiet houses and crowded rooms where no one seems to see you. They speak of his presence, and of the people he places around the lonely.",
    passages: [
      sp("DEU 31:8", "card", "The LORD goes before you and will not leave you."),
      sp("PSA 68:6a", "card", "God's way with the lonely: a family.", {
        part: "God settles the lonely in families;",
        context: "God places the lonely in families, and one of the ways he does it is through his people, the church.",
      }),
      sp("PSA 25:16", "card", "A prayer you can borrow when you are lonely."),
      sp("HEB 13:5b", "card", "God's own promise never to leave or forsake.", { part: "Never will I leave you, never will I forsake you.”" }),
      sp("PSA 27:10", "card", "Even when those closest let go, the LORD receives you."),
      sp("MAT 28:20b", "card", "Jesus' last words in Matthew: always with you.", {
        part: "And surely I am with you always, even to the end of the age.”",
        context: "Jesus' promise as he sent his disciples out, which the church has always heard as made to everyone who follows him.",
      }),
      sp("PSA 139:9-10", "card", "As far as you could go, his hand is there."),
      sp("JHN 14:18", "card", "Jesus will not leave his people as orphans."),
      sp("PSA 139:1-12", "reading", "Known completely, and never out of God's sight."),
      sp("2TI 4:16-18", "reading", "Deserted by everyone, and not alone.", {
        context: "Paul's last letter, written in prison: everyone deserted him, and the Lord stood with him.",
      }),
      sp("PSA 25:16-18", "blessing", "A prayer for the lonely and troubled heart."),
    ],
    person: {
      id: "paul-act-7-58",
      line: "Paul, at his first defense, wrote that “everyone deserted me”, and then, “But the Lord stood by me and strengthened me” (2 Timothy 4:16–17).",
    },
    note: `Loneliness hurts, and Scripture does not pretend it doesn't. David prayed, “Turn to me and be gracious, for I am lonely and afflicted” (Psalm 25:16). You can pray that prayer too, in his words or your own.

God's presence is real even on the days you cannot feel it. He has said, “Never will I leave you, never will I forsake you.” Paul knew what it was to be deserted by everyone at his trial, and he wrote that the Lord stood by him.

God also places the lonely in families, and one of the ways he does it is through his people. If you have a church, let someone there know you are struggling. If you don't, a small step is enough: one message to one person today, or one gathering this week, even if you only stay a little while.

Loneliness that lasts can weigh on your mood and your health. If it has become heavy and dark, talking to a counsellor is a wise thing to do, and the help below can point you to one.`,
    help: { level: "foot", entries: [...COUNSELLING] },
    topics: [
      { slug: "affliction-forsaken-by-friends-in", title: "Affliction: Forsaken by Friends In:" },
      { slug: "presence-of-god", title: "The Presence of God" },
      { slug: "friendship", title: "Friendship" },
    ],
    related: ["grieving", "depressed", "far-from-god"],
    words: ["alone", "lonely", "loneliness", "isolated", "forgotten", "no friends", "nobody cares", "left out"],
  },
  {
    slug: "grieving",
    group: "heart",
    label: "Grieving",
    heading: "What the Bible Says When You're Grieving",
    searchTitle: "Bible Verses for Grief and Loss",
    intro: "When you're grieving, the Bible does not hurry you or hand you a reason; it gives you words for the loss and a God who comes close. Jesus himself wept at a friend's grave. These verses are for the first raw days and for the long months after. If you are grieving a particular person, the links below lead to passages chosen for that loss.",
    passages: [
      sp("PSA 34:18", "card", "The LORD is near when your heart is broken."),
      sp("MAT 5:4", "card", "Jesus calls those who mourn blessed, and promises comfort."),
      sp("PSA 147:3", "card", "He binds up the wounds that grief leaves."),
      sp("JHN 11:35", "card", "Two words that say Jesus grieves too.", {
        context: "Jesus wept at his friend's tomb, though he knew he was about to raise him. Grief is not a failure of faith.",
      }),
      sp("PSA 56:8", "card", "Not one of your tears goes unseen."),
      sp("2CO 1:3-4", "card", "The God of all comfort, who comforts us in every trouble."),
      sp("PSA 73:26", "card", "When body and heart fail, God remains."),
      sp("REV 21:4", "card", "The day when God wipes away every tear.", {
        context: "A promise about the end of all things. It does not ask you to stop grieving now; in the first days it may help most simply to know it is there.",
      }),
      sp("JHN 11:32-36", "reading", "Mary's grief at Jesus' feet, and his tears beside hers."),
      sp("LAM 3:19-26", "reading", "Remembering the bitterness, and hoping anyway."),
      sp("PSA 31:9-10", "blessing", "A prayer for eyes and body worn out by sorrow."),
    ],
    person: {
      id: "naomi-rut-1-2",
      line: "Naomi lost her husband and both her sons, and asked to be called Mara, “bitter” (Ruth 1:20–21). Scripture lets her say so.",
    },
    note: `Grief is love continuing after someone has gone. There is no schedule for it, and no right way to do it. Some days you may be numb, some days angry, some days so tired you can barely move. You can bring all of it to God, as the psalms do.

Jesus stood at the tomb of his friend Lazarus and wept, though he knew what he was about to do. Your tears are not a failure of faith. God keeps account of them (Psalm 56:8).

The Bible's hope is real, but it does not ask you to stop grieving now. In the first days it may help most simply to know the promise is there, and to come back to it later.

If you have lost a mother, a father, a husband or wife, a child or a baby, or someone to suicide, the sympathy pages linked below have passages chosen for that loss. Many people find that a grief group helps, because others there understand without needing an explanation. You do not have to carry this alone.`,
    help: { level: "foot", entries: ["griefshare", "afsp-suicide-loss-groups"] },
    topics: [
      { slug: "bereavement", title: "Bereavement" },
      { slug: "mourning", title: "Mourning" },
      { slug: "weeping", title: "Weeping" },
      { slug: "sorrow", title: "Sorrow" },
    ],
    related: ["lonely", "heartbroken", "depressed"],
    elsewhere: [
      { href: "/sympathy/loss-of-mother", title: "If your mother has died" },
      { href: "/sympathy/loss-of-father", title: "If your father has died" },
      { href: "/sympathy/loss-of-spouse", title: "If your husband or wife has died" },
      { href: "/sympathy/loss-of-child", title: "If your child has died" },
      { href: "/sympathy/loss-of-baby", title: "If you have lost a baby" },
      { href: "/sympathy/loss-to-suicide", title: "If someone you love died by suicide" },
      { href: "/sympathy/sudden-loss", title: "If someone died suddenly" },
      { href: "/sympathy/funeral-readings", title: "Planning a funeral" },
    ],
    words: ["grief", "loss", "bereaved", "bereavement", "someone died", "mourning", "widow", "widowed", "funeral", "miss them"],
  },
  {
    slug: "heartbroken",
    group: "heart",
    label: "Heartbroken",
    heading: "What the Bible Says When Your Heart Is Broken",
    searchTitle: "Bible Verses for a Broken Heart",
    intro: "When your heart is broken, after a breakup, a betrayal or a love that ended, the Bible takes that pain seriously and speaks of a God who binds up the brokenhearted. These verses do not tell you to move on quickly. They tell you who stays when someone else has gone.",
    passages: [
      sp("PSA 147:3", "card", "God heals the brokenhearted."),
      sp("PSA 34:18", "card", "Close to you when your spirit is crushed."),
      sp("PSA 73:26", "card", "When your own heart fails, God is its strength."),
      sp("ISA 61:1", "card", "Good news for the brokenhearted.", {
        context: "Jesus read these words in Nazareth and said they were fulfilled in him (Luke 4:16–21): binding up the brokenhearted is his work.",
      }),
      sp("PSA 30:5b", "card", "Sorrow lasts the night; it is not the end.", {
        part: "Weeping may stay the night, but joy comes in the morning.",
        context: "It puts no deadline on sorrow; “the night” can be long. It promises that the night is not the end.",
      }),
      sp("ISA 54:10", "card", "A love that will not be shaken, even if mountains move."),
      sp("PSA 55:22", "card", "Give the weight of it to the LORD."),
      sp("PSA 31:9-16", "reading", "A psalm of sorrow and rejection that still says, “You are my God.”"),
      sp("ISA 61:1-3", "reading", "Comfort for all who mourn, and binding for the brokenhearted.", {
        context: "Jesus read the opening of this passage in Nazareth and said it was fulfilled in him (Luke 4:16–21).",
      }),
      sp("PSA 4:1", "blessing", "A short prayer for relief when you are in distress."),
    ],
    person: {
      id: "leah-gen-29-16",
      line: "Leah lived unloved by her husband. When her fourth son was born she said, “This time I will praise the LORD” (Genesis 29:31–35).",
    },
    note: `A broken relationship can feel like a death, and in a way it is: the end of a future you had pictured. It is right to grieve it. Scripture does not shrug at heartbreak. It says the LORD heals the brokenhearted and binds up their wounds (Psalm 147:3), and Jesus read Isaiah's words about binding up the brokenhearted as a description of his own work.

God's love does not leave when someone else's does. Through Isaiah he says that the mountains may be removed, but his loving devotion will not (Isaiah 54:10). That is not a promise that this relationship will come back; it is a promise about him.

Let yourself grieve. Cry, talk to a friend, take a walk, sleep. Try not to decide who you are, or what you are worth, from this week. The night can be long, but it is not the end of the story.

If the person who hurt you is someone you are afraid of, the page for being hurt at home is for you.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "sorrow", title: "Sorrow" }, CONSOLATION, LOVE_OF_GOD],
    related: ["grieving", "lonely", "hurt-by-someone"],
    words: ["broken heart", "heartbreak", "breakup", "break up", "broke up", "dumped", "rejected", "relationship ended"],
  },
];
