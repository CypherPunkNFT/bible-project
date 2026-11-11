// Prayers for occasions, group 4: hard moments (design 3.2, 4.3). Every request in a prayer rests on a verse listed
// beneath it, checked line by line as design 4.5 models. The funeral page prays for the living only (design 2.5 rule 2).
import { sp } from "../sympathy/types";
import { newMercies, T } from "./shared";
import type { Occasion } from "./types";

const guardMouth = (note: string) => sp("PSA 141:3", "card", note);
const slowToAnger = (note: string) => sp("JAS 1:19-20", "card", note);
const truthInLove = (note: string) => sp("EPH 4:15", "card", note);
const gentleAnswer = (note: string) => sp("PRO 15:1", "card", note);
const pleasingWords = (note: string) => sp("PSA 19:14", "card", note);
const allComfort = (note: string) => sp("2CO 1:3-4", "card", note);
const PEACE_NOTE = "Paul writes “if it is possible on your part”: reconciliation takes two, and where someone is not safe to be near, safety comes first.";
const VINDICATION_NOTE = "A promise that God brings what is right to light in his time, not that every case goes our way.";

export const HARD_OCCASIONS: Occasion[] = [
  {
    slug: "hard-conversation",
    group: "hard",
    label: "A hard conversation",
    heading: "A Prayer Before a Hard Conversation",
    searchTitle: "Prayer Before a Difficult Conversation",
    intro: "A prayer before a difficult conversation: a confrontation, a talk you have been putting off, or hard news you have to break. It asks God to guard your mouth, to help you listen first, and to let you speak the truth in love with a gentle answer. One is for you, and one is for someone you love who is facing one.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am about to have a hard conversation, and I bring it to you before I say a word. Set a guard over my mouth. Help me to listen first, and to be slow to speak and slow to anger, because my anger will not bring about what is right. Let me speak the truth in love: honest, but never cruel. When the words get sharp, give me a gentle answer instead of a harsh one. Whatever happens, let my words and my thoughts please you. In Jesus' name, amen.",
        rootedIn: [
          guardMouth("A guard over the mouth."),
          slowToAnger("Listening first, and why anger does not help."),
          truthInLove("Truth spoken in love."),
          gentleAnswer("The gentle answer that turns anger away."),
          pleasingWords("Words and thoughts that please God."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone facing one",
        forSomeone: true,
        text: "Father, [name] has a hard conversation ahead, and they are dreading it. Set a guard over their mouth. Help them to listen first, and to be slow to speak and slow to anger. Let them speak the truth in love, honestly and kindly. When things get heated, give them a gentle answer that turns anger away. And let their words and their thoughts please you, whatever the other person says. In Jesus' name, amen.",
        rootedIn: [
          guardMouth("A guard over their mouth."),
          slowToAnger("Quick to listen, slow to anger."),
          truthInLove("Honest and loving."),
          gentleAnswer("A gentle answer."),
          pleasingWords("Words that please God."),
        ],
      },
    ],
    topics: [T.speaking, T.tongue, T.meekness],
    related: ["making-peace", "speaking-in-public", "struggling-marriage"],
    words: ["difficult conversation", "hard conversation", "confrontation", "confront", "talk", "bad news to tell", "breaking news", "conflict"],
  },
  {
    slug: "making-peace",
    group: "hard",
    label: "Making peace",
    heading: "A Prayer for Making Peace",
    searchTitle: "Prayer for Reconciliation After a Conflict",
    intro: "A prayer for reconciliation after an argument, a falling-out or a long silence. It asks God for the courage to go first, a kind and forgiving heart, and peace wherever peace is possible. One is for you when you need to make things right, and one is for two people you love who are at odds with each other.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, there is something wrong between me and someone else, and I can't leave it as it is. You tell us to go and be reconciled before we bring you our gifts. Give me the courage to go first. Make me kind and tenderhearted, ready to forgive as you forgave me in Christ, and ready to say sorry where I was wrong. If it is possible on my part, help me to live at peace with them. Bless the peace I try to make. In Jesus' name, amen.",
        rootedIn: [
          sp("MAT 5:23-24", "card", "Going first to be reconciled."),
          sp("ROM 12:18", "card", "Peace, as far as it is possible.", { context: PEACE_NOTE }),
          sp("EPH 4:32", "card", "Kind, tenderhearted and forgiving."),
          sp("MAT 5:9", "card", "God's blessing on peacemakers."),
        ],
      },
      {
        id: "for-two",
        label: "For two people at odds",
        forSomeone: true,
        text: "Father, I pray for [name] and the conflict they are caught in. Make them kind and tenderhearted to one another, forgiving each other as you forgave us in Christ. Give them the courage to go and be reconciled, without waiting for the other to move first. If it is possible on their part, help them to live at peace. Make them peacemakers, and let them know your blessing in it. In Jesus' name, amen.",
        rootedIn: [
          sp("EPH 4:32", "card", "Forgiving each other."),
          sp("MAT 5:23-24", "card", "Going to be reconciled."),
          sp("ROM 12:18", "card", "Peace where it is possible.", { context: PEACE_NOTE }),
          sp("MAT 5:9", "card", "Blessed are the peacemakers."),
        ],
      },
    ],
    topics: [T.reconciliation, T.forgiveness, T.humility],
    related: ["hard-conversation", "struggling-marriage", "court-date"],
    words: ["argument", "fight", "falling out", "sorry", "apologise", "apologize", "apology", "reconcile", "reconciliation", "forgive", "estranged"],
  },
  {
    slug: "court-date",
    group: "hard",
    label: "A court date",
    heading: "A Prayer Before a Court Date",
    searchTitle: "Prayer Before Court, for Justice and Peace",
    intro: "A prayer before court, for a hearing, a custody case, a trial or a day giving evidence. It asks God for justice, for honesty and humility in what is said, and for courage and peace in a room that can feel frightening. One is for you, and one is for someone you love who has a court date.",
    before: "People go to court for many reasons: to ask for protection, to settle a custody arrangement, to answer a charge or to give evidence. These prayers make no assumption about which. They ask God for justice, honesty, courage and peace, and leave the outcome with him.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I have to go to court, and I am anxious about what will happen. I commit my way to you and trust in you. Bring what is right to light, as clear as the noonday sun. Help me to act justly, to love mercy, and to walk humbly with you as I speak and listen. Do not let me be afraid: be with me, strengthen me and hold me up. You are a refuge for the oppressed and a stronghold in times of trouble. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 37:5-6", "card", "Committing the case to God.", { context: VINDICATION_NOTE }),
          sp("MIC 6:8", "card", "Justice, mercy and humility in the courtroom."),
          sp("ISA 41:10", "card", "Strengthened and held up."),
          sp("PSA 9:9", "card", "A refuge in times of trouble."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] has a court date coming, and it weighs on them. Help them to commit their way to you and to trust you. Bring forth what is right like the dawn. Strengthen them, hold them up and keep them from fear. Help them to be honest and humble, and to act justly. Be their refuge and their stronghold in this time of trouble. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 37:5-6", "card", "Their way committed to God.", { context: VINDICATION_NOTE }),
          sp("ISA 41:10", "card", "Strength and help."),
          sp("MIC 6:8", "card", "Acting justly and humbly."),
          sp("PSA 9:9", "card", "A stronghold in trouble."),
        ],
      },
    ],
    topics: [T.lawsuits, T.integrity, T.protection],
    related: ["hard-conversation", "making-peace", "after-bad-news"],
    words: ["court", "court date", "hearing", "custody", "lawsuit", "trial", "judge", "legal", "jury", "sentencing", "testify"],
  },
  {
    slug: "after-bad-news",
    group: "hard",
    label: "After hard news",
    heading: "A Prayer After Hard News",
    searchTitle: "Prayer After Receiving Bad News",
    intro: "A prayer after bad news, for the moment the phone call or the letter changes everything. It does not ask you to understand or feel the right things. It pours out the heart to God, who is a refuge in trouble, and asks for his comfort and his mercy tomorrow morning. One is for you, and one is for someone you love.",
    before: "You do not need the right words today. If the news has knocked the breath out of you, the first line of these prayers is enough. If the news means you or someone else is in danger, call the emergency services first.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "God, I have had hard news, and I don't know what to think or feel. You are my refuge and strength, always near in trouble. Even if everything seems to be falling apart, help me not to fear. I pour out my heart to you now, all of it. Comfort me, God of all comfort. And tomorrow morning, when I wake and remember, let your mercies be new, because your faithfulness is great. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 46:1-2", "card", "A refuge, though the earth gives way."),
          sp("PSA 62:8", "card", "Pouring out your heart to God."),
          allComfort("The God of all comfort."),
          newMercies("Mercies new tomorrow morning."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] has had hard news today. Be their refuge and strength, present with them right now. When it feels as though the ground is giving way, keep them from fear. Let them pour out their heart to you. Comfort them, God of all comfort, and let me be a comfort to them too. Each morning, give them new mercies, enough for that day. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 46:1-2", "card", "God present in trouble."),
          sp("PSA 62:8", "card", "A heart poured out."),
          allComfort("Comforted, and comforting."),
          newMercies("New every morning."),
        ],
      },
    ],
    topics: [T.care, T.peace, T.waiting],
    related: ["waiting-for-results", "before-a-funeral", "someone-in-hospital"],
    elsewhere: [
      { href: "/when-youre/serious-diagnosis", title: "What the Bible says when you've had a hard diagnosis" },
      { href: "/when-youre/anxious", title: "What the Bible says when you're anxious" },
    ],
    words: ["bad news", "hard news", "shock", "shocking news", "phone call", "diagnosis", "terrible news", "devastated"],
  },
  {
    slug: "before-a-funeral",
    group: "hard",
    label: "Before a funeral",
    heading: "A Prayer Before a Funeral",
    searchTitle: "Prayer Before a Funeral, for Those Who Mourn",
    intro: "A prayer before a funeral, for the grieving family and for you as you go to the service. It asks God to be near the brokenhearted, to comfort those who mourn, and to help you weep with those who weep. One is for the family who mourn, with their name, and one is for you on the way.",
    before: "These prayers are for the living: for those who mourn, and for you as you go. They do not pray for the one who has died or say where they are. If you want to know what the Bible says about death and hope, the good news of Jesus is a place to start.",
    prayers: [
      {
        id: "for-mourners",
        label: "For those who mourn",
        forSomeone: true,
        text: "Lord, today [name] will say goodbye to someone they love. You are near to the brokenhearted: be very near to them now. Comfort those who mourn, as you have promised. Be close to them through the service, the graveside and the quiet house afterwards. God of all comfort, comfort them in this trouble, and help all of us who love them to weep with them. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 34:18", "card", "The LORD near the brokenhearted."),
          sp("MAT 5:4", "card", "Comfort for those who mourn."),
          allComfort("The God of all comfort."),
          sp("ROM 12:15", "card", "Weeping with those who weep."),
        ],
      },
      {
        id: "for-you",
        label: "For you as you go",
        text: "Father, I am going to a funeral today, and I don't know what to say to the family. Thank you that you are near to the brokenhearted, including me. Help me to weep with those who weep, and not to rush them with words. Let me bring them the comfort you have given me. Comfort the family, as you promise to comfort those who mourn. Help me simply to be there for them. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 34:18", "card", "God near the brokenhearted, you included."),
          sp("ROM 12:15", "card", "Weeping with those who weep."),
          allComfort("Passing on the comfort you have received."),
          sp("MAT 5:4", "card", "Those who mourn will be comforted."),
        ],
      },
    ],
    topics: [T.mourning, T.bereavement],
    related: ["after-bad-news", "someone-in-hospital"],
    elsewhere: [
      { href: "/sympathy", title: "Words of comfort and sympathy cards" },
      { href: "/sympathy/funeral-readings", title: "Bible readings for a funeral" },
      { href: "/when-youre/grieving", title: "What the Bible says when you're grieving" },
      { href: "/study/the-good-news", title: "The Good News: what the Bible says about hope in Jesus" },
    ],
    words: ["funeral", "memorial", "memorial service", "burial", "wake", "grieving family", "condolence", "died", "death", "loss"],
  },
];
