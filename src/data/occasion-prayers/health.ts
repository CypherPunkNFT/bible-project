// Prayers for occasions, group 1: health and care (design 3.2, 4.3). Every request in a prayer rests on a verse listed
// beneath it, checked line by line as design 4.5 models.
import { sp } from "../sympathy/types";
import { guarded, HEAL_NOTE, myTimes, T } from "./shared";
import type { Occasion } from "./types";

const healMe = (note: string) => sp("JER 17:14", "card", note, { context: HEAL_NOTE });
const goodGift = (note: string) => sp("JAS 1:17", "card", note);
const peaceBeyond = (note: string) => sp("PHP 4:6-7", "card", note);
const HEALING_PRAISE_NOTE = "Praise for God's healing, not a promise that every illness ends now (2 Corinthians 12:7–9).";

export const HEALTH_OCCASIONS: Occasion[] = [
  {
    slug: "before-surgery",
    group: "health",
    label: "Before surgery",
    heading: "A Prayer Before Surgery",
    searchTitle: "Prayer Before Surgery, for You or Someone You Love",
    intro: "A prayer before surgery can be short, because God already knows what is coming. Here is one to pray for yourself the night before or as you are wheeled in, one for someone you love who is having an operation, and one for the family in the waiting room. Each asks plainly for healing and for steady hands, and leaves the hours ahead in God's hands.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Father, I trust you. My times are in your hands, and so am I. Please quiet my fear. Thank you for the surgeons, the anaesthetist and the nurses, and for their skill, which is your good gift. Give them clear minds and steady hands. When I go to sleep, let me lie down in peace, because you alone keep me safe. Heal me, Lord, and bring me safely through. Whatever comes, keep my heart and mind in your peace, which is greater than I can understand. In Jesus' name, amen.",
        rootedIn: [
          myTimes("Trust, and the hours ahead held by God."),
          sp("PSA 4:8", "card", "Lying down in peace, for the anaesthetic."),
          peaceBeyond("Bringing the fear and the requests to God, and his peace."),
          healMe("The plain request for healing."),
          goodGift("The surgeons' skill as a good gift from the Father."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, I bring [name] to you today as they go into surgery. Their times are in your hands. Be with them, and do not let them be afraid. Hold them up with your strong hand. Thank you for the surgeons and nurses who will care for them, and for their skill, which is your good gift. Give them clear minds and steady hands. Heal [name], Lord, and bring them safely through. Whatever comes, keep their heart and mind, and mine, in your peace, which is greater than we can understand. In Jesus' name, amen.",
        rootedIn: [
          myTimes("Their times are in God's hands."),
          sp("ISA 41:10", "card", "God with them, holding them up, so they need not fear."),
          goodGift("The surgeons' skill as God's gift."),
          healMe("Asking God to heal."),
          peaceBeyond("Peace for them, and for you."),
        ],
      },
      {
        id: "family",
        label: "For the family waiting",
        text: "Lord God, we are waiting, and the hours are long. You are our refuge and strength, always near in times of trouble, and you are here with us in this waiting room. We give you every worry we are carrying, because you care for us. We ask you to care for the one we love and for everyone working around them. Give us strength for the news when it comes, and guard our hearts and minds in your peace while we wait. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 46:1", "card", "God, present in trouble, and in the waiting room too."),
          sp("1PE 5:7", "card", "Every worry handed to the God who cares."),
          peaceBeyond("Requests made to God, and his peace guarding the waiting."),
        ],
      },
    ],
    historic: "bcp-perils",
    topics: [T.sickness, T.physician, T.prayer],
    related: ["waiting-for-results", "someone-in-hospital", "recovering"],
    elsewhere: [{ href: "/when-youre/facing-surgery", title: "What the Bible says when you're facing surgery" }],
    words: ["surgery", "operation", "op", "anaesthetic", "anesthesia", "surgeon", "procedure", "hospital"],
  },
  {
    slug: "waiting-for-results",
    group: "health",
    label: "Waiting for results",
    heading: "A Prayer While Waiting for Test Results",
    searchTitle: "Prayer While Waiting for Test Results",
    intro: "A prayer while waiting for test results is for the days between the scan or biopsy and the phone call, when the mind runs ahead to every possible answer. These prayers ask God for good news, for a steady heart in the meantime, and for peace whatever the results say. One is for you, and one is for someone you love who is waiting.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am waiting for results, and my mind keeps running ahead to every answer they might bring. I bring it all to you. Help me not to fear bad news, but to keep my heart steady, trusting in you. I ask you plainly: let the news be good. Keep my mind fixed on you, and give me your perfect peace. Help me to live today and leave tomorrow's worries with you. Whatever the results say, guard my heart and mind in your peace. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 112:7", "card", "A steady heart that does not fear bad news.", {
            context: "A picture of someone who trusts God, not a promise that the news will be good.",
          }),
          peaceBeyond("Asking plainly, and peace that guards the heart."),
          sp("MAT 6:34", "card", "Today's trouble is enough; tomorrow's can wait."),
          sp("ISA 26:3", "card", "Perfect peace for a mind kept on God."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] is waiting for results, and the waiting is hard. Keep them from fear of bad news, and steady their heart as they trust in you. I ask you for good news for them. Where their mind races, give them your perfect peace. Help them to take one day at a time, without carrying tomorrow's trouble today. And whatever the results say, guard their heart and mind in your peace, which is greater than we can understand. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 112:7", "card", "A steady heart in the face of news."),
          sp("ISA 26:3", "card", "Perfect peace for a racing mind."),
          sp("MAT 6:34", "card", "One day at a time."),
          peaceBeyond("Asking, and the peace that follows."),
        ],
      },
    ],
    historic: "bcp-peace",
    topics: [T.care, T.peace, T.waiting],
    related: ["after-bad-news", "starting-treatment", "before-surgery"],
    elsewhere: [
      { href: "/when-youre/serious-diagnosis", title: "What the Bible says when you've had a hard diagnosis" },
      { href: "/when-youre/anxious", title: "What the Bible says when you're anxious" },
    ],
    words: ["results", "test results", "biopsy", "scan", "mri", "ct scan", "blood test", "waiting"],
  },
  {
    slug: "starting-treatment",
    group: "health",
    label: "Starting treatment",
    heading: "A Prayer Before Treatment Begins",
    searchTitle: "Prayer Before Chemotherapy or Treatment",
    intro: "A prayer before chemotherapy, radiation or any long treatment is for the start of a hard road. These prayers ask God to heal, to give strength on the days the treatment wears you down, and to renew you inwardly when your body is weary. One is for you as you begin, and one is for someone you love who is starting treatment.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, my treatment begins soon, and I don't know how my body will cope. My flesh and my heart may fail, but you are the strength of my heart. When I am tired and sick, renew me inwardly day by day, even while my outer self is weary. I wait on you: give me strength to keep going, to walk and not faint. Thank you for the skill of everyone caring for me, your good gift. Heal me, Lord. Whatever comes, you are my portion forever. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 73:26", "card", "When flesh and heart fail, God remains."),
          sp("2CO 4:16", "card", "Renewed inwardly while the body is worn down."),
          sp("ISA 40:31", "card", "Strength for those who wait on the LORD."),
          healMe("Asking God to heal."),
          goodGift("The skill of doctors and nurses as God's gift."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] is starting treatment, and the road ahead looks long. When their body grows weak and their heart is tired, be the strength of their heart. Renew them inwardly day by day, even as the treatment wears them down. Give them strength to keep going when they are weary, to walk and not faint. Heal them, Lord, and let this treatment do them good. Whatever comes, be their portion forever. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 73:26", "card", "God, the strength of a failing heart."),
          sp("2CO 4:16", "card", "Renewed day by day."),
          sp("ISA 40:31", "card", "Walking and not fainting."),
          healMe("A prayer for healing."),
        ],
      },
    ],
    topics: [T.sickness, T.physician, T.prayer],
    related: ["waiting-for-results", "recovering", "someone-in-hospital"],
    elsewhere: [{ href: "/when-youre/serious-diagnosis", title: "What the Bible says when you've had a hard diagnosis" }],
    words: ["treatment", "chemo", "chemotherapy", "radiation", "radiotherapy", "cancer", "infusion", "dialysis"],
  },
  {
    slug: "someone-in-hospital",
    group: "health",
    label: "Someone in hospital",
    heading: "A Prayer for Someone in Hospital",
    searchTitle: "Prayer for Someone in the Hospital",
    intro: "A prayer for someone in hospital, to pray at home or beside their bed when you visit. It asks God to sustain them through long nights and hard days, to comfort them, and to make your visit a comfort too. There is also a prayer for when you are the one in the hospital bed, and an older prayer from the 1662 prayer book's service for visiting the sick.",
    prayers: [
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Lord, [name] is in hospital, and I can't fix what they are facing. Sustain them on their sickbed, and raise them up again. In the long nights and the hard days, be with them, so that even in the darkest valley they are not afraid. Comfort them, God of all comfort, in every trouble. When I visit, let me bring your comfort with me, and help me to look after [name] well. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 41:3", "card", "Sustained on a sickbed.", {
            context: "A psalm of God's care for the one who cares for the weak, not a promise that every sick person recovers.",
          }),
          sp("PSA 23:4", "card", "Not afraid, even in the darkest valley."),
          sp("2CO 1:3-4", "card", "The God of all comfort, and comfort passed on."),
          sp("MAT 25:36", "card", "Looking after the sick, for the one who visits."),
        ],
      },
      {
        id: "for-you",
        label: "For yourself in hospital",
        text: "Father, I am in hospital, far from my own bed and my own routines. Sustain me here, and restore me from this bed of sickness. When the nights are long and the news is uncertain, help me to fear no evil, because you are with me. Comfort me in this trouble, God of all comfort, and let the comfort I receive here reach the people around me: the patient in the next bed, the nurses, and everyone who visits. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 41:3", "card", "Sustained and restored."),
          sp("PSA 23:4", "card", "No fear, because God is with you."),
          sp("2CO 1:3-4", "card", "Comforted, and comforting others."),
        ],
      },
    ],
    historic: "bcp-sick",
    topics: [T.sickness, T.physician, T.prayer],
    related: ["before-surgery", "recovering", "starting-treatment"],
    elsewhere: [{ href: "/when-youre/sick", title: "What the Bible says when you're sick or in pain" }],
    words: ["hospital", "hospitalised", "hospitalized", "visit", "visiting", "icu", "intensive care", "ward", "sick"],
  },
  {
    slug: "recovering",
    group: "health",
    label: "Recovering",
    heading: "A Prayer for Recovery",
    searchTitle: "Prayer for Recovery After Surgery or Illness",
    intro: "A prayer for recovery after surgery or illness, for the slow weeks when healing takes longer than anyone hoped. These prayers ask God to finish the healing and to give strength to the weak. One is for you, one is for someone you love who is recovering, and one is a prayer of thanks for when you are well again.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am recovering, and it is slower than I hoped. I cried to you for help, and I am still crying to you. Heal me fully. On the days I feel weak, give me your strength, because you give power to the faint and strength to the weak. You forgive all my sins and heal my diseases, and I trust you with this healing too. Help me not to forget all your kindness to me, even on the hard days. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 30:2", "card", "Crying to God for help, and his healing."),
          sp("PSA 103:2-3", "card", "Remembering his kindness.", { context: HEALING_PRAISE_NOTE }),
          sp("ISA 40:29", "card", "Strength for the weak."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, thank you for bringing [name] this far. Now I ask you to heal them fully. When they are tired of being tired, give them strength, because you give power to the faint and increase the strength of the weak. Hear them when they cry to you for help, and heal them, Lord. Help them, and all of us around them, to remember your kindness and to bless you for it. In Jesus' name, amen.",
        rootedIn: [
          sp("ISA 40:29", "card", "Power for the faint."),
          sp("PSA 30:2", "card", "A cry for help, and healing."),
          sp("PSA 103:2-3", "card", "Blessing God for his kindness.", { context: HEALING_PRAISE_NOTE }),
        ],
      },
      {
        id: "thanks",
        label: "Thanks when you are well again",
        text: "Lord, I love you, because you heard my voice when I called for mercy. I cried to you for help, and you healed me. Thank you. You answered me, and you have been my salvation. I will not forget your kindness to me: the doctors, the medicine, the friends who sat with me, and the slow days that finally ended. As long as I live, I will call on you. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 116:1-2", "card", "Loved, heard, and calling on God for life."),
          sp("PSA 118:21", "card", "Thanks for an answered prayer."),
          sp("PSA 30:2", "card", "You healed me."),
          sp("PSA 103:2-3", "card", "Not forgetting his kind deeds.", { context: HEALING_PRAISE_NOTE }),
        ],
      },
    ],
    topics: [T.sickness, T.physician, T.prayer],
    related: ["before-surgery", "someone-in-hospital", "starting-treatment"],
    elsewhere: [{ href: "/when-youre/sick", title: "What the Bible says when you're sick or in pain" }],
    words: ["recovery", "recovering", "healing", "get well", "convalescing", "rehab", "after surgery", "well again"],
  },
  {
    slug: "giving-birth",
    group: "health",
    label: "Giving birth",
    heading: "A Prayer Before Giving Birth",
    searchTitle: "Prayer for Labor and a Safe Delivery",
    intro: "A prayer for labour and a safe delivery, for a mother about to give birth and for those who love her. It thanks God for the child he has been forming, asks him to guard mother and baby, and to lead gently through every hour. One prayer is for you as your baby comes, and one is for someone in labour now.",
    before: "Every birth is different, and plans often change in the delivery room. These prayers ask God for a safe delivery and trust him with what cannot be planned. If you are afraid, say so: he gently leads those who are with young.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Father, my baby is coming soon. You formed this child and knit them together in my womb, and I praise you, because they are fearfully and wonderfully made. I am nervous about the labour and the pain. Gently lead me, as a shepherd leads those with young, and carry me close when I am tired. Guard me and my baby, and watch over us in these hours. Give us a safe delivery, and turn the anguish into joy when I hold my child. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 139:13-14", "card", "A child God has been forming."),
          sp("ISA 40:11", "card", "The shepherd who gently leads those with young."),
          sp("JHN 16:21", "card", "Anguish turned to joy when a child is born."),
          guarded("Guarding mother and baby."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone in labour",
        forSomeone: true,
        text: "Lord, [name] is in labour now. You have knit this baby together and made them wonderfully, and I praise you for this child. Gently lead [name] through every hour, as a shepherd leads those with young, and hold them close when they are worn out. Guard mother and child, and watch over them both. Give them a safe delivery, and soon let the anguish be forgotten in the joy of a child born into the world. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 139:13-14", "card", "A child fearfully and wonderfully made."),
          sp("ISA 40:11", "card", "Gentle leading, close to the shepherd's heart."),
          sp("JHN 16:21", "card", "Joy that a child is born."),
          guarded("Guarding mother and child."),
        ],
      },
    ],
    topics: [T.children, T.parents, T.blessing],
    related: ["new-baby", "someone-in-hospital"],
    elsewhere: [{ href: "/life-events/expecting", title: "Verses and a printable card while expecting a baby" }],
    words: ["birth", "giving birth", "labour", "labor", "delivery", "c-section", "caesarean", "cesarean", "due date", "pregnant", "baby coming"],
  },
];
