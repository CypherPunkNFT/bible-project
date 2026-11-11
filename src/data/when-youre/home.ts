// Pages for home and family (design 3.2, 4.2, 4.5): divorce, a struggling marriage, being hurt at home, infertility, a
// worried parent. The abuse page follows design 2.4 and 2.5 rule 7: safety first, and no ruling on the marriage.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { COUNSELLING } from "./help";
import type { WhenTopic } from "./types";

const PRAYER = { slug: "prayer", title: "Prayer" };

export const HOME_TOPICS: WhenTopic[] = [
  {
    slug: "divorce",
    group: "life",
    label: "Divorce",
    heading: "What the Bible Says When You're Going Through a Divorce",
    searchTitle: "Bible Verses for Divorce",
    intro: "When you're going through a divorce, the Bible grieves with you and speaks of a God whose love does not leave, whatever led you here. These verses are for the legal letters, the empty rooms, the children's questions and the nights alone. This page will not judge your story; it offers Scripture for the loss.",
    passages: [
      sp("PSA 34:18", "card", "Near to you in the grief of a marriage ending."),
      sp("ISA 54:10", "card", "A love that will not be removed.", { context: CONTEXT.isaiah54 }),
      sp("ROM 8:26", "card", "When you cannot find the words to pray."),
      sp("PSA 55:22", "card", "Cast the weight of it on the LORD."),
      sp("PSA 62:8", "card", "Pour out your heart to him."),
      sp("LAM 3:22-23", "card", "New mercies for each new morning."),
      sp("PSA 46:1", "card", "A refuge and strength when everything is shaken."),
      sp("ISA 54:4-8", "reading", "God's word to his people, pictured as a wife deserted.", { context: CONTEXT.isaiah54 }),
      sp("PSA 55:12-22", "reading", "Betrayal by a companion, and casting your burden on God."),
      sp("PSA 86:16-17", "blessing", "Asking God to turn to you and show you his goodness."),
    ],
    note: `Divorce is a deep loss, whatever led to it. It can bring grief, anger, relief, shame and fear all at once, along with practical worries about money, home and children. All of that can be brought to God.

God is near to the brokenhearted (Psalm 34:18). Through Isaiah he spoke to his people as to a wife who had been abandoned, and told them that his loving devotion would not depart from them (Isaiah 54:10). That is a promise about his love for you, not about your marriage, and it holds whatever happens next.

This page does not judge your story or rule on your divorce. Christians who hold to the Bible's teaching on marriage still differ on some questions of divorce and remarriage, and those are best talked through with a pastor you trust, who knows you and your circumstances. A counsellor can also help, for you and for your children.

When you cannot find words, the Spirit himself intercedes for you (Romans 8:26).

If you are in danger from your husband or wife, please see the page for being hurt at home now.`,
    help: { level: "foot", entries: [...COUNSELLING] },
    topics: [{ slug: "divorce", title: "Divorce" }, { slug: "consolation-in-affliction", title: "Consolation in Affliction" }],
    related: ["abused", "heartbroken", "lonely"],
    words: ["divorce", "divorced", "divorcing", "separated", "separation", "marriage ended", "custody", "left me"],
  },
  {
    slug: "struggling-marriage",
    group: "life",
    label: "A struggling marriage",
    heading: "What the Bible Says When Your Marriage Is Struggling",
    searchTitle: "Bible Verses for a Struggling Marriage",
    intro: "When your marriage is struggling, with distance, conflict or a hurt that will not heal, the Bible speaks of patience, forgiveness and a love that keeps choosing the other person. These verses are for husbands and wives who want to keep going. If you are afraid of your spouse, that is not a struggling marriage; the page for being hurt at home is for you.",
    passages: [
      sp("ECC 4:12", "card", "A cord of three strands is not quickly broken.", {
        context: "About companions who help each other up; often read at weddings, it fits a marriage worth fighting for.",
      }),
      sp("EPH 4:2-3", "card", "Humble, gentle, patient, bearing with one another in love."),
      sp("COL 3:13-14", "card", "Forgiving as the Lord forgave, and putting on love."),
      sp("1PE 4:8", "card", "Love covers over a multitude of sins."),
      sp("EPH 4:32", "card", "Kind, tenderhearted and forgiving."),
      sp("ROM 12:10", "card", "Outdo one another in showing honour."),
      sp("PRO 15:1", "card", "A gentle answer turns away anger."),
      sp("1CO 13:4-8a", "reading", "What love is, and what it does.", {
        part: "Love never fails.",
        context: "Paul describes love in the church family. That love “bears all things” is not a command to endure abuse; if you are afraid at home, see the page for being hurt at home.",
      }),
      sp("COL 3:12-15", "reading", "Clothed with compassion, kindness and patience."),
      sp("PSA 143:10", "blessing", "Asking God to teach you to do his will."),
    ],
    note: `Many marriages go through hard seasons and come through them. Distance, money, children, illness, old hurts and plain tiredness can wear down two people who once could not wait to be together. Struggling does not mean you have failed, and it does not mean it is over.

For ordinary conflict, small steps can help: listen before you answer, speak gently (Proverbs 15:1), let go of keeping score, and forgive as the Lord forgave you (Colossians 3:13). Pray for your husband or wife, even if you cannot yet pray together. Get help early; a pastor or a counsellor can help you hear each other again, and asking for help is a sign that you care.

One clear line: if you are afraid of your spouse, if you are being controlled, threatened, hit or forced, that is not a “struggling marriage”, and steps like these are not the answer. Please do not try joint counselling or confrontation with someone who is hurting you. See the page for being hurt at home, and talk to an advocate who can help you think about your safety.

God cares about your marriage, and he cares about you.`,
    help: {
      level: "foot",
      entries: [...COUNSELLING, "domestic-violence-hotline"],
      extra: [{ label: "If you are afraid of your spouse: what the Bible says, and where to get help", href: "/when-youre/abused" }],
    },
    topics: [{ slug: "marriage", title: "Marriage" }, { slug: "forgiveness", title: "Forgiveness" }, { slug: "patience", title: "Patience" }],
    related: ["abused", "hurt-by-someone", "divorce"],
    elsewhere: [{ href: "/prayers/struggling-marriage", title: "A prayer for a struggling marriage" }],
    words: ["marriage problems", "struggling marriage", "marriage", "husband", "wife", "spouse", "arguing", "fighting", "drifting apart"],
  },
  {
    slug: "abused",
    group: "life",
    label: "Hurt at home",
    heading: "What the Bible Says When Someone at Home Is Hurting You",
    searchTitle: "Bible Verses About Abuse, and Where to Get Help",
    intro: "If someone at home is hurting you, what is happening matters and your safety comes first. The contacts above can help you talk through your situation. Scripture names oppression and calls God's people to protect the vulnerable. These passages do not ask you to endure violence or put yourself in greater danger.",
    passages: [
      sp("PSA 9:9", "card", "A stronghold for the oppressed in times of trouble."),
      sp("PSA 34:18", "card", "Near to you when your spirit is crushed."),
      sp("PSA 10:17-18", "card", "God hears the afflicted and defends the oppressed.", { context: CONTEXT.abuseHelp }),
      sp("PSA 12:5", "card", "God rises for the oppressed who groan."),
      sp("PSA 82:3-4", "card", "God's command to rescue the weak.", { context: CONTEXT.abuseHelp }),
      sp("PSA 72:14", "card", "Your life is precious in God's sight."),
      sp("COL 3:19", "card", "What God asks of husbands.", { context: "Harshness and abuse are the opposite of what God asks." }),
      sp("1SA 19:9-12", "reading", "David escapes through a window at night.", { context: CONTEXT.escape }),
      sp("ACT 9:23-25", "reading", "Paul is let down the wall in a basket to escape a plot.", { context: CONTEXT.escape }),
      sp("PSA 55:20-22", "reading", "A companion whose smooth words hid violence.", {
        context: "A psalm about a companion who “attacks his friends” with speech “smooth as butter”. Scripture names this kind of betrayal.",
      }),
      sp("PSA 31:1-2", "blessing", "A prayer for refuge and rescue."),
    ],
    person: {
      id: "david-rut-4-17",
      line: "David escaped Saul's spear and fled at night, let down through a window by his wife Michal (1 Samuel 19).",
    },
    note: `What is happening to you is wrong, and it is not your fault. God sees the oppressed and hears them (Psalm 10:17–18); their lives are precious in his sight (Psalm 72:14). Seeking safety is not faithlessness, and it is not a betrayal of your family.

If you are in immediate danger, use emergency help if it is safe to do so. An advocate can listen and help you think through a safety plan that fits your situation. You do not have to follow anyone else's timetable for leaving, confront the person hurting you, or tell them your plans.

David escaped through a window at night when Saul tried to kill him. Paul was lowered from a city wall in a basket. Their stories are not a plan for your circumstances, but they show that getting away from danger is not a failure to trust God.

A trustworthy pastor should help you get safe, never send you back into danger. Joint counselling, reconciliation and confronting the person can increase the danger where there is control or abuse.

This page does not tell you what to decide about your marriage. Separating for safety is a different question from divorce. Your safety comes first, and you deserve to be heard without blame.`,
    help: { level: "urgent", entries: [] },
    topics: [
      { slug: "oppression", title: "Oppression" },
      { slug: "injustice", title: "Injustice" },
      { slug: "protection", title: "Protection" },
      { slug: "refuge", title: "Refuge" },
    ],
    related: ["hurt-by-someone", "afraid"],
    words: ["abuse", "abused", "abusive", "domestic violence", "hits me", "hurts me", "controlling", "afraid of my husband", "afraid of my wife", "unsafe at home"],
  },
  {
    slug: "infertility",
    group: "life",
    label: "Infertility",
    heading: "What the Bible Says When You're Struggling with Infertility",
    searchTitle: "Bible Verses for Infertility",
    intro: "When you're struggling with infertility, waiting month after month for a child who has not come, the Bible does not hide that longing; it gives it words. These verses are for the waiting, the disappointment and the grief that others may not see. This page will not promise you a child. It offers Scripture for the ache.",
    passages: [
      sp("PSA 34:18", "card", "Near to you in the grief others may not see."),
      sp("PSA 62:8", "card", "Pour out your heart to him."),
      sp("PSA 56:8", "card", "Every tear kept."),
      sp("ROM 12:12", "card", "Joyful in hope, patient in affliction, faithful in prayer."),
      sp("PSA 27:13-14", "card", "Waiting for the LORD with courage."),
      sp("LAM 3:25", "card", "The LORD is good to those who wait for him."),
      sp("PSA 73:26", "card", "God, the strength of your heart."),
      sp("1SA 1:9-18", "reading", "Hannah pours out her soul before the LORD.", {
        context: "Hannah's story ends with a son; this page does not promise that yours will. It is here because God heard her anguish, and the priest's misunderstanding did not stop her prayer.",
      }),
      sp("GEN 30:1-2", "reading", "Rachel's cry.", {
        context: "Rachel's cry is in Scripture, unedited. So is Jacob's angry answer: grief can strain a marriage, and Scripture records that too.",
      }),
      sp("PSA 13:1-2", "blessing", "A prayer for long waiting."),
    ],
    person: {
      id: "hannah-1sa-1-2",
      line: "Hannah prayed in such anguish that the priest thought she was drunk; she told him she had been pouring out her soul before the LORD (1 Samuel 1:15).",
    },
    note: `The longing for a child is deep, and Scripture does not hide it. Hannah wept so bitterly in the temple that the priest thought she was drunk. Rachel cried out to Jacob that she would die without children. Their words are in the Bible, unedited, because God is not offended by grief like yours.

This page will not promise you a child. Some of the women in Scripture who longed for children received them, and their stories are told because God heard them. But God does not promise every person a child, and if he does not give you one, it is not a punishment or a verdict on your faith. Your worth is not measured by children.

Your grief is real, including the quiet loss that can come each month. You can pour out your heart to God (Psalm 62:8), as Hannah did. Be gentle with yourself around baby announcements, showers and some church occasions; it is all right to step away.

The site does not rule on fertility treatments; if you are weighing them, talk them through with your doctor and a pastor you trust. And let a friend or two carry this with you.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "barrenness", title: "Barrenness" }, { slug: "childlessness", title: "Childlessness" }, PRAYER],
    related: ["grieving", "discouraged", "lonely"],
    words: ["infertility", "infertile", "trying to conceive", "childless", "waiting for a baby", "barren", "ivf"],
  },
  {
    slug: "worried-about-child",
    group: "life",
    label: "Worried about your child",
    heading: "What the Bible Says When You're Worried About Your Child",
    searchTitle: "Bible Verses for a Wayward or Struggling Child",
    intro: "When you're worried about your child, whether a little one who is sick, a teenager who is struggling, or a grown son or daughter who has walked away from the faith, the Bible speaks to a parent's particular grief. These verses are for praying through the night and keeping the door open. God's own heart for wayward children is in them.",
    passages: [
      sp("LAM 2:19", "card", "Pouring out your heart for your children through the night.", {
        context: "Written among the ruins of Jerusalem: a call to pour out your heart for your children through the night.",
      }),
      sp("LUK 15:20", "card", "The father who saw his son from far off, and ran.", { context: "The father was watching the road." }),
      sp("2PE 3:9", "card", "God is patient, not wanting anyone to perish."),
      sp("PSA 103:17", "card", "The LORD's loving devotion, to children's children."),
      sp("ISA 40:11", "card", "The Shepherd who gathers the lambs in his arms."),
      sp("PHP 1:6", "card", "What God began, he will carry on."),
      sp("LUK 15:11-24", "reading", "The son who left, and the father who waited.", { context: CONTEXT.prodigal }),
      sp("MRK 9:17-24", "reading", "A father's desperate plea for his son."),
      sp("PRO 22:6", "reading", "A proverb about raising children, read honestly.", {
        context: "A proverb describes how things usually go, not a guarantee. A grown child's choices are their own; faithful parents have prodigals too, and God himself has wayward children.",
      }),
      sp("LAM 2:19", "blessing", "Pray it through the night, in your own words if you need to."),
    ],
    person: {
      id: "jairus-mrk-5-22",
      line: "Jairus, a synagogue leader, fell at Jesus' feet and pleaded with him to come to his dying daughter (Mark 5:22–43).",
    },
    note: `Loving a child who is struggling, or who has walked away, is a particular kind of grief. You may lie awake replaying what you could have done differently. Please hear this: you are not the only influence in your child's life, and you are not God. Proverbs 22:6 describes how things usually go; it is not a guarantee, and faithful parents have prodigals too. God himself has wayward children.

What you can do is pray, and keep praying. Lamentations calls parents to pour out their hearts like water before the Lord for their children, through the night. Keep the door open. Keep loving them, even when you cannot approve of everything they do. In Jesus' story, the father was watching the road, and he ran when he saw his son.

Look after yourself too. Talk to your husband or wife, a friend or a pastor; a counsellor can help you think through hard decisions about boundaries and help. If your child is in danger, or may harm themselves, contact emergency help or a crisis line straight away.

God is patient, not wanting anyone to perish (2 Peter 3:9). You can leave your child in his hands.`,
    help: { level: "foot", entries: [...COUNSELLING] },
    topics: [{ slug: "parents", title: "Parents" }, { slug: "prayer-in-behalf-of-children", title: "The Prayer in Behalf of Children" }],
    related: ["anxious", "cant-sleep", "discouraged"],
    words: ["child", "son", "daughter", "prodigal", "teenager", "wayward", "left the faith", "my kids", "children"],
  },
];
