// Pages for the soul (design 3.2, 4.2, 4.5): angry, guilty, worthless, doubting, far from God, tempted, hurt by someone.
import { sp } from "../sympathy/types";
import { CONTEXT } from "./context";
import { CLINICAL, COUNSELLING } from "./help";
import type { WhenTopic } from "./types";

const GOOD_NEWS = { href: "/study/the-good-news", title: "The Good News: how to be made right with God" };
const PRAYER = { slug: "prayer", title: "Prayer" };

export const SOUL_TOPICS: WhenTopic[] = [
  {
    slug: "angry",
    group: "heart",
    label: "Angry",
    heading: "What the Bible Says When You're Angry",
    searchTitle: "Bible Verses About Anger: When You're Angry",
    intro: "When you're angry, the Bible does not tell you to pretend you aren't; it shows you what to do with anger before it does something to you. These verses speak of being slow to anger, of telling God honestly, and of not letting the sun go down on it. Read one before you speak.",
    passages: [
      sp("JAS 1:19-20", "card", "Quick to listen, slow to speak, slow to anger."),
      sp("EPH 4:26-27", "card", "Anger without sin, and not carried overnight.", {
        context: "Anger is not always sin; Jesus was angry at hard hearts (Mark 3:5). The warning is about what anger does if we keep it.",
      }),
      sp("PRO 15:1", "card", "A gentle answer turns away wrath."),
      sp("PSA 4:4", "card", "Search your heart on your bed, and be still."),
      sp("PRO 29:11", "card", "The wise hold their anger back."),
      sp("PSA 37:8", "card", "Let go of anger before it leads to harm."),
      sp("EPH 4:31-32", "card", "Put away bitterness, and be kind and forgiving."),
      sp("PSA 37:1-11", "reading", "Do not fret over those who do wrong; trust the LORD and wait for him."),
      sp("JON 4:1-11", "reading", "Jonah's fury, and God's patient questions.", {
        context: "God answers Jonah's fury with questions and a plant, and the book ends on God's question, not Jonah's answer.",
      }),
      sp("PSA 19:14", "blessing", "Asking that your words and thoughts please God."),
    ],
    person: {
      id: "jonah-2ki-14-25",
      line: "Jonah was so angry at God's mercy to Nineveh that he wanted to die, and God answered him with a question about his anger (Jonah 4).",
    },
    note: `Anger is not always sin. It can be a right response to real wrong, and Jesus himself was angry at hard hearts (Mark 3:5). The question Scripture asks is what we do with it.

The psalms show one way: tell God honestly. Many of them are angry prayers, and God kept them in his book. James shows another: be quick to listen, slow to speak and slow to anger, because human anger does not bring about the righteousness of God (James 1:19–20). And Paul warns against letting anger settle in overnight, where it can harden into bitterness (Ephesians 4:26–27).

So before you speak or send anything, stop. Pray the anger out to God in plain words. Ask what is underneath it: hurt, fear or injustice. Then decide what, if anything, needs to be said, and say it gently.

If your anger is turning into hurting people, with words or with your hands, please get help now; a pastor or counsellor can help you understand it and change. If someone else's anger makes you afraid at home, see the page for being hurt at home.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "anger", title: "Anger" }, { slug: "patience", title: "Patience" }, { slug: "forgiveness", title: "Forgiveness" }],
    related: ["hurt-by-someone", "struggling-marriage", "guilty"],
    words: ["angry", "anger", "rage", "furious", "mad", "bitter", "resentment", "temper"],
  },
  {
    slug: "guilty",
    group: "heart",
    label: "Guilty or ashamed",
    heading: "What the Bible Says When You Feel Guilty or Ashamed",
    searchTitle: "Bible Verses for Guilt and Shame",
    intro: "When you feel guilty or ashamed, the Bible tells the truth about sin and the deeper truth about God's forgiveness. These verses are for the weight of something you did, and for the shame that lingers even after you have asked to be forgiven. Read them slowly. God's mercy is wider than you think.",
    passages: [
      sp("1JN 1:9", "card", "Confess, and he forgives and cleanses.", { context: CONTEXT.confession }),
      sp("PSA 103:12", "card", "As far as the east is from the west."),
      sp("ROM 8:1", "card", "No condemnation for those in Christ.", {
        context: "The promise is “for those who are in Christ Jesus”. If you are not sure that includes you, the note below and The Good News say how it can.",
      }),
      sp("ISA 1:18", "card", "Sins like scarlet, made white as snow.", {
        context: "God's invitation to a nation that had turned away. He calls them to come and reason with him: he opens the door himself.",
      }),
      sp("PSA 32:5", "card", "David stopped hiding his sin, and was forgiven."),
      sp("PSA 34:5", "card", "Faces that look to God are never covered with shame."),
      sp("PSA 51:1-12", "reading", "David's prayer after his great sin: mercy, cleansing and a new heart."),
      sp("LUK 15:11-24", "reading", "The son who came home, and the father who ran.", { context: CONTEXT.prodigal }),
      sp("JHN 21:15-17", "reading", "Peter, forgiven and restored by the lakeside.", {
        context: "Peter denied Jesus three times; Jesus asked him three times whether he loved him, and gave him work to do.",
      }),
      sp("PSA 51:10-12", "blessing", "A prayer for a clean heart and the joy of salvation."),
    ],
    person: {
      id: "peter-mat-4-18",
      line: "Peter denied Jesus three times. After the resurrection Jesus asked him three times whether he loved him, and gave him his work again (John 21).",
    },
    note: `Some guilt is true. It is the conscience telling us we have done wrong, and it is a mercy, because it leads us back to God. When we bring it to him, Scripture's promise is plain: if we confess our sins, he is faithful and just to forgive us (1 John 1:9), and he removes our transgressions as far as the east is from the west (Psalm 103:12).

Some shame lingers after forgiveness, whispering that you are still the worst thing you did. Romans 8:1 speaks to that: there is no condemnation for those who are in Christ Jesus. Peter denied Jesus three times, and Jesus restored him with three questions and gave him work to do.

The heart of the good news is this: Jesus died for our sins and rose again, and everyone who turns from sin and trusts him is forgiven, completely and freely, by grace. If you are not sure that includes you, The Good News, linked below, explains how it can.

Where you can, make things right with people you have wronged. That is part of healing, not a way of earning forgiveness.`,
    help: { level: "none", entries: [] },
    topics: [
      { slug: "conviction", title: "Conviction" },
      { slug: "confession-of-sin", title: "Confession of Sin" },
      { slug: "forgiveness-of-sin", title: "The Forgiveness of Sin" },
      { slug: "repentance", title: "Repentance" },
    ],
    related: ["tempted", "far-from-god", "addiction"],
    elsewhere: [GOOD_NEWS],
    words: ["guilt", "guilty", "shame", "ashamed", "regret", "forgive me", "can god forgive me?", "sinned", "sin"],
  },
  {
    slug: "worthless",
    group: "heart",
    label: "Worthless",
    heading: "What the Bible Says When You Feel Worthless",
    searchTitle: "Bible Verses for When You Feel Worthless",
    intro: "When you feel worthless, unloved or rejected, the Bible speaks of a worth you did not earn and cannot lose: you were made by God and loved by him. These verses are for the voice that says you do not matter. Read them slowly, and let God's word speak louder than that voice.",
    passages: [
      sp("PSA 139:14", "card", "Fearfully and wonderfully made."),
      sp("ISA 49:15-16", "card", "Engraved on the palms of God's hands.", {
        context: "Spoken to Jerusalem when she said the Lord had forgotten her. A mother may forget; God says he will not.",
      }),
      sp("ZEP 3:17", "card", "God rejoices over you with singing."),
      sp("EPH 2:10", "card", "God's workmanship, made for good works."),
      sp("1JN 3:1", "card", "Called children of God, and that is what we are."),
      sp("ROM 5:8", "card", "Loved while still sinners."),
      sp("JER 31:3", "card", "An everlasting love that draws you."),
      sp("LUK 12:6-7", "card", "Not one sparrow is forgotten, and you are worth more."),
      sp("PSA 139:13-18", "reading", "Knit together in the womb, and known all your days."),
      sp("ROM 8:35-39", "reading", "Nothing can separate you from the love of God in Christ."),
      sp("PSA 17:8", "blessing", "A prayer to be kept as the apple of God's eye."),
    ],
    person: {
      id: "mephibosheth-2sa-4-4",
      line: "Mephibosheth, lame and afraid, called himself a dead dog before the king, and David gave him a place at his own table for life (2 Samuel 9).",
    },
    note: `Your worth is not what you achieve, what you look like or how other people have treated you. It was given to you by the God who made you, fearfully and wonderfully (Psalm 139:14), and it was shown at the cross: while we were still sinners, Christ died for us (Romans 5:8). Nothing you have done or failed to do can make that less.

When Jerusalem said the LORD had forgotten her, God answered that a mother might forget her nursing child, but he would not forget his people. He has engraved them on the palms of his hands.

Mephibosheth called himself a dead dog. The king gave him a place at his own table for the rest of his life. That is the kind of welcome God gives.

Feelings of worthlessness can be part of depression, and they can lie. Please talk to someone you trust, or to a doctor or counsellor. If those feelings have turned into thoughts of ending your life, please call or text the crisis line near the top of this page now.`,
    help: { level: "line", entries: [...COUNSELLING, CLINICAL] },
    topics: [{ slug: "love-of-god", title: "The Love of God" }, { slug: "grace", title: "Grace" }, { slug: "mercy", title: "Mercy" }],
    related: ["thinking-of-suicide", "depressed", "lonely"],
    words: ["worthless", "unloved", "rejected", "not good enough", "useless", "self-worth", "hate myself", "failure", "insecure"],
  },
  {
    slug: "doubting",
    group: "heart",
    label: "Doubting",
    heading: "What the Bible Says When You're Doubting",
    searchTitle: "Bible Verses for Doubt: When You Doubt God",
    intro: "When you're doubting God, the Bible does not shut the door on you; it is full of honest questions, and of a Savior who met a doubter by showing him his wounds. These verses are for faith that feels thin, prayers that seem unanswered and questions you are afraid to ask. Bring them as they are.",
    passages: [
      sp("MRK 9:24", "card", "A prayer for faith that feels thin."),
      sp("JUD 1:22", "card", "Mercy for those who doubt.", {
        context: "An instruction to the church: those who doubt are to be met with mercy, not pushed out.",
      }),
      sp("JHN 20:29", "card", "A blessing for those who believe without seeing."),
      sp("HEB 11:1", "card", "What faith is: assurance of what we hope for."),
      sp("ISA 55:8-9", "card", "God's thoughts are higher than ours."),
      sp("PSA 77:11-12", "card", "Remembering what God has done when you cannot see him now."),
      sp("MAT 14:30-31", "card", "Sinking, and caught by Jesus' hand.", {
        context: "Jesus' hand reached Peter before his question did. “Why did you doubt?” comes from someone already holding on to him.",
      }),
      sp("JHN 20:24-29", "reading", "Thomas, his doubt, and the risen Jesus who came back for him."),
      sp("PSA 73:16-26", "reading", "A psalmist's confusion, resolved in God's presence."),
      sp("1CO 15:3-8", "reading", "The witnesses to the resurrection.", {
        context: "The earliest written summary of the gospel, naming witnesses of the risen Christ, many still alive when Paul wrote. For more, see the site's apologetics pages.",
      }),
      sp("MRK 9:24", "blessing", "The shortest prayer for faith there is."),
    ],
    person: {
      id: "thomas-mat-10-3",
      line: "Thomas said he would not believe unless he saw Jesus' wounds; eight days later Jesus came and showed them to him (John 20).",
    },
    note: `Doubt is not the opposite of faith. A father once cried out to Jesus that he believed, and asked for help with his unbelief (Mark 9:24), and Jesus did not turn him away. Thomas said he would not believe unless he saw the wounds, and Jesus came back and showed them to him.

Doubts come in different kinds. Some are questions of evidence: did Jesus really rise? Is the Bible reliable? Those questions have good answers, and the site's apologetics pages are a place to start. Some doubts are of the heart: does God care, and why has he not answered? For those, the psalms are full of honest prayers that ask exactly that.

Bring your questions honestly to God and to people you trust. Read the accounts of the resurrection for yourself. Talk to a pastor who will not be shocked. Keep doing the next faithful thing while you wait.

And if you are not sure you have ever trusted Christ at all, The Good News explains, simply, how you can.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "doubting", title: "Doubting" }, { slug: "faith", title: "Faith" }, { slug: "assurance", title: "Assurance" }],
    related: ["far-from-god", "guilty"],
    elsewhere: [{ href: "/apologetics", title: "Apologetics: reasons for the hope" }, GOOD_NEWS],
    words: ["doubt", "doubts", "doubting", "unbelief", "struggling with faith", "losing faith", "is god real", "questions"],
  },
  {
    slug: "far-from-god",
    group: "heart",
    label: "Far from God",
    heading: "What the Bible Says When God Feels Far Away",
    searchTitle: "Bible Verses for When God Feels Far Away",
    intro: "When God feels far away, and your prayers seem to hit the ceiling, the Bible shows that his people have felt this all through history, and that feelings are not the measure of his presence. These verses are for dry seasons and silent nights. Read them, and keep talking to him.",
    passages: [
      sp("PSA 145:18", "card", "Near to all who call on him."),
      sp("JAS 4:8", "card", "Come near to God, and he will come near to you.", {
        context: "Written to believers who had drifted. God is not waiting to be appeased; he comes near.",
      }),
      sp("JER 29:13", "card", "Found by those who seek with all their heart.", {
        context: "From the same letter to exiles as the much-quoted 29:11: God would be found by people far from home.",
      }),
      sp("DEU 31:6", "card", "He will never leave you nor forsake you."),
      sp("ACT 17:27", "card", "He is not far from any one of us."),
      sp("PSA 139:7-8", "card", "Nowhere to go where God is not."),
      sp("ROM 8:38-39", "card", "Nothing in all creation can separate us from God's love in Christ."),
      sp("PSA 13:1-6", "reading", "A lament that ends in trust.", { context: CONTEXT.psalm13 }),
      sp("PSA 22:1-5", "reading", "The psalm Jesus prayed on the cross.", {
        context: "Jesus prayed this psalm's first line on the cross (Matthew 27:46). Feeling forsaken is something he has felt.",
      }),
      sp("PSA 63:1", "blessing", "A prayer of thirst for God in a dry land."),
    ],
    person: {
      id: "david-rut-4-17",
      line: "David wrote Psalm 63 in the wilderness of Judah, thirsting for God in a dry and weary land.",
    },
    note: `Seasons of feeling far from God are described all through Scripture. Psalm 13 asks how long God will hide his face. Jesus himself prayed from the cross, “My God, My God, why have You forsaken Me?” Feeling forsaken is something he has felt.

Feelings are real, but they are not the measure of God's presence. David asked where he could go from God's Spirit, and answered that there was nowhere (Psalm 139:7–8). God is near to all who call on him (Psalm 145:18), including those who call with very little left.

So keep coming. Read a psalm, even when it feels dry. Pray honestly, even if all you can say is that he feels far away. Stay among God's people, and let them pray for you when you cannot. Dry seasons end, though they rarely end on our timetable.

If you are not sure you have ever known God at all, he is not far from any one of us (Acts 17:27). The Good News explains how to come to him.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "presence-of-god", title: "The Presence of God" }, PRAYER, { slug: "waiting-upon-god", title: "Waiting Upon God" }],
    related: ["doubting", "lonely", "depressed"],
    elsewhere: [GOOD_NEWS],
    words: ["far from god", "god feels distant", "distant", "spiritual dryness", "dry", "silent", "unanswered prayer", "abandoned by god"],
  },
  {
    slug: "tempted",
    group: "heart",
    label: "Tempted",
    heading: "What the Bible Says When You're Tempted",
    searchTitle: "Bible Verses About Temptation: When You're Tempted",
    intro: "When you're tempted, the Bible tells you that temptation itself is not sin, that Jesus was tempted too, and that there is always a way out. These verses are for the hard moment and for the plan you make before it. Read one now, and then take the way out.",
    passages: [
      sp("1CO 10:13", "card", "A way out of every temptation.", { context: CONTEXT.wayOut }),
      sp("HEB 4:15-16", "card", "A high priest who was tempted as we are, and who helps.", {
        context: "Jesus was tempted in every way and did not sin, so he understands and helps rather than recoils.",
      }),
      sp("JAS 1:12", "card", "A blessing for those who persevere under trial."),
      sp("JAS 4:7", "card", "Submit to God, resist the devil, and he will flee."),
      sp("MAT 26:41", "card", "Watch and pray: the spirit is willing, the body is weak."),
      sp("PSA 119:11", "card", "God's word kept in the heart."),
      sp("2PE 2:9", "card", "The Lord knows how to rescue the godly from trials."),
      sp("GAL 5:16", "card", "Walk by the Spirit."),
      sp("MAT 4:1-11", "reading", "Jesus in the wilderness, answering each temptation with Scripture."),
      sp("GEN 39:7-12", "reading", "Joseph, who ran.", { context: "Joseph did not argue with the temptation; he ran." }),
      sp("1CO 6:18-20", "reading", "Run from sexual sin: your body is a temple of the Holy Spirit."),
      sp("MAT 6:13", "blessing", "From the Lord's Prayer: asking to be kept from temptation and delivered.", {
        context: "From the prayer Jesus taught his disciples.",
      }),
    ],
    person: {
      id: "joseph-gen-30-24",
      line: "Joseph refused his master's wife day after day, and when she seized him he ran, leaving his cloak in her hand (Genesis 39).",
    },
    note: `Temptation is not sin. Jesus was tempted in every way, as we are, yet without sin, and because of that he understands and helps rather than recoils (Hebrews 4:15–16). Feeling the pull of something does not make you a hypocrite. It makes you human.

Scripture promises that every temptation comes with a way out, and that others have faced the same (1 Corinthians 10:13). Often the way out is simply to leave. Joseph did not argue with his master's wife; he ran, and left his cloak behind.

Plan ahead for the moments that are hardest: the time of day, the place, the device, the mood. Tell someone you trust what you are fighting, and let them ask you how it is going. Fill your mind with something better; Jesus answered each temptation in the wilderness with Scripture.

If you have already fallen, do not hide. Confess it to God, who is faithful and just to forgive (1 John 1:9), and get up again. The page for guilt is for you. If this has become a compulsion you cannot break, the page for addiction has help.`,
    help: { level: "none", entries: [] },
    topics: [{ slug: "temptation", title: "Temptation" }, { slug: "lust", title: "Lust" }, { slug: "temptation-of-christ", title: "The Temptation of Christ" }],
    related: ["guilty", "addiction", "far-from-god"],
    words: ["tempted", "temptation", "lust", "porn", "pornography", "struggling with sin", "resist"],
  },
  {
    slug: "hurt-by-someone",
    group: "heart",
    label: "Hurt by someone",
    heading: "What the Bible Says When Someone Has Hurt You",
    searchTitle: "Bible Verses for When Someone Hurts You",
    intro: "When someone hurts you, through betrayal, cruelty or a wrong that will not heal, the Bible takes the wound seriously and speaks of a God who sees it and will judge it rightly. These verses are for the anger, the grief and the long road toward forgiveness. They do not ask you to pretend it did not happen.",
    passages: [
      sp("PSA 147:3", "card", "God binds up the wounds others leave."),
      sp("EPH 4:31-32", "card", "Putting away bitterness, as God in Christ forgave you."),
      sp("COL 3:13", "card", "Bearing with one another, and forgiving as the Lord forgave."),
      sp("ROM 12:19", "card", "Leave vengeance to God.", {
        context: "Leaving revenge to God is not pretending the wrong did not matter; it trusts the wrong to the one Judge who will deal with it rightly.",
      }),
      sp("PSA 55:12-14", "card", "When the one who hurt you was a friend."),
      sp("MAT 5:44", "card", "Pray for those who hurt you.", {
        context: "Loving and praying for someone who hurt you does not mean staying close to them or trusting them again. If you are in danger, see the page for being hurt at home.",
      }),
      sp("ROM 12:17-18", "card", "Do not repay evil for evil; live at peace as far as it depends on you."),
      sp("GEN 50:15-21", "reading", "Joseph forgives the brothers who sold him.", {
        context: "Joseph's words about God bringing good out of his brothers' evil were his own testimony, many years on. They are not something to say to someone whose wound is fresh.",
      }),
      sp("LUK 6:27-36", "reading", "Jesus on loving enemies, and being merciful as the Father is."),
      sp("PSA 55:16-17", "blessing", "Calling to God evening, morning and noon."),
    ],
    person: {
      id: "joseph-gen-30-24",
      line: "Joseph was sold into slavery by his own brothers, and many years later forgave them with tears (Genesis 50).",
    },
    note: `What happened to you matters to God. Scripture names betrayal honestly: one psalm grieves that the wound came not from an enemy but from a close friend (Psalm 55:12–14). God sees, and he will judge it rightly. That is why Paul can say to leave vengeance to him (Romans 12:19): not because the wrong did not matter, but because it matters enough to be in the hands of the one Judge who never gets it wrong.

Forgiveness is a process, and often a long one. It means releasing the debt to God, choosing over time not to repay evil for evil. It does not mean pretending, excusing what was done, trusting the person again at once, or staying close to someone who is dangerous.

Joseph's brothers sold him into slavery. Many years later he forgave them, and he could see what God had done through it. That came at the end of his story, not the beginning. Be patient with yourself.

If someone at home is hurting you, please see the page for being hurt at home now. It has help from people trained to listen.`,
    help: { level: "none", entries: [] },
    topics: [
      { slug: "forgiveness-of-injuries", title: "Forgiveness of Injuries" },
      { slug: "betrayal", title: "Betrayal" },
      { slug: "enemy", title: "Enemy" },
    ],
    related: ["abused", "angry", "heartbroken"],
    words: ["hurt", "betrayed", "betrayal", "wronged", "forgive", "unforgiveness", "bullied", "lied to", "cheated on"],
  },
];
