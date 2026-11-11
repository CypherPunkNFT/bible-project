// Prayers for occasions, group 2: work and study (design 3.2, 4.3). Every request in a prayer rests on a verse listed
// beneath it, checked line by line as design 4.5 models.
import { sp } from "../sympathy/types";
import { newMercies, STEPS_NOTE, T } from "./shared";
import type { Occasion } from "./types";

const steps = (note: string) => sp("PRO 16:9", "card", note, { context: STEPS_NOTE });
const trustNotLean = (note: string) => sp("PRO 3:5-6", "card", note);
const askWisdom = (note: string) => sp("JAS 1:5", "card", note);
const noFear = (note: string) => sp("2TI 1:7", "card", note);
const wholeBeing = (note: string) => sp("COL 3:23", "card", note);
const WORK_TOPICS = [T.labor, T.industry, T.contentment];
const STUDY_TOPICS = [T.wisdom, T.knowledge, T.diligence];

export const WORK_OCCASIONS: Occasion[] = [
  {
    slug: "job-interview",
    group: "work",
    label: "Job interview",
    heading: "A Prayer Before a Job Interview",
    searchTitle: "Prayer Before a Job Interview",
    intro: "A prayer before a job interview, to pray in the car, the lobby or the minute before you log on. It asks God for the job, for clear thinking and honest answers, and for trust whatever the answer turns out to be. There is one for you, one for a friend or family member who has an interview, and one for the waiting afterwards.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I have an interview today, and I want this job. I commit this interview and all my plans to you. Help me to trust you with all my heart and not to lean on my own understanding. Help me to give it my whole effort, and to answer as someone who serves you, not only the people across the table. Please give me this job, if it is the right place for me. Whatever they decide, make my path straight, and keep me trusting you. In Jesus' name, amen.",
        rootedIn: [
          sp("PRO 16:3", "card", "Committing the interview and the plans to the LORD."),
          trustNotLean("Trust, and a straight path, whatever the answer."),
          wholeBeing("Doing your best as for the Lord."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] has an interview today, and it matters to them. Help them to commit their plans to you and to trust you with all their heart. Give them wisdom and clear thinking, because you give generously to anyone who asks. Let them work at it with their whole being, as for you. I ask you to give them this job if it is the right place for them. Whatever the answer, make their path straight. In Jesus' name, amen.",
        rootedIn: [
          sp("PRO 16:3", "card", "Plans committed to the LORD."),
          trustNotLean("Trusting with all the heart."),
          askWisdom("Wisdom, given generously to those who ask."),
          wholeBeing("Their whole effort, as for the Lord."),
        ],
      },
      {
        id: "after",
        label: "After the interview",
        text: "Lord, the interview is over, and now I wait. I made my plans, but you rule over my steps, and I leave the answer with you. If they say yes, help me to start well, and I will thank you. If they say no, teach me to be content, whether I have plenty or I am in need, and show me the next step. Either way, I trust you with all my heart. In Jesus' name, amen.",
        rootedIn: [
          sp("PHP 4:11-12", "card", "Learning to be content, whatever the answer.", {
            context: "Paul learned contentment in want and in plenty. It is learned over time, not switched on.",
          }),
          steps("Our plans, and God's rule over our steps."),
          trustNotLean("Trust with all the heart."),
        ],
      },
    ],
    historic: "bcp-prevent",
    topics: WORK_TOPICS,
    related: ["new-job", "looking-for-work", "big-decision"],
    words: ["interview", "job interview", "zoom interview", "application", "hiring", "recruiter"],
  },
  {
    slug: "new-job",
    group: "work",
    label: "Starting a new job",
    heading: "A Prayer for Starting a New Job",
    searchTitle: "Prayer for a New Job and Your First Day",
    intro: "A prayer for starting a new job, for the first day at work and the weeks of learning that follow. It asks God to establish the work of your hands, to help you work wholeheartedly, and to deal justly and kindly with the people around you. One is for you, and one is for someone you love who is starting somewhere new.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I am starting a new job, and I want to do it well. Let your kindness rest on me as I learn, and establish the work of my hands. Help me to work with my whole heart, as serving you and not only the people I report to. Teach me to act justly, to love mercy, and to walk humbly, with my colleagues and with you. Through the nerves of the first days, remind me that it is the Lord Christ I am serving. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 90:17", "card", "Asking God to establish the work of your hands."),
          sp("COL 3:23-24", "card", "Working wholeheartedly, for the Lord."),
          sp("MIC 6:8", "card", "Justice, mercy and humility at work."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] is starting a new job this week. Let your kindness rest on them, and establish the work of their hands. Give them the heart to work at it with their whole being, as serving you. Help them to act justly, to love mercy and to walk humbly among the people they work with, and to deal kindly and fairly with everyone they meet there. In Jesus' name, amen.",
        rootedIn: [
          sp("PSA 90:17", "card", "The work of their hands established."),
          sp("COL 3:23-24", "card", "Wholehearted work."),
          sp("MIC 6:8", "card", "Justice, mercy and humility."),
        ],
      },
    ],
    historic: "bcp-grace",
    topics: WORK_TOPICS,
    related: ["job-interview", "looking-for-work", "speaking-in-public"],
    elsewhere: [{ href: "/life-events/new-job", title: "Verses and a printable card for a new job" }],
    words: ["new job", "first day at work", "first day", "starting work", "career", "promotion", "new role"],
  },
  {
    slug: "looking-for-work",
    group: "work",
    label: "Looking for work",
    heading: "A Prayer While Looking for Work",
    searchTitle: "Prayer for Finding a Job",
    intro: "A prayer for finding a job, for the weeks or months of applications, waiting and silence. It asks God plainly to provide work, to carry the worry about money and tomorrow, and to show his mercy new each morning. One is for you, and one is for someone you love who is out of work or searching.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Father, I need work. You know what I need before I ask, and I am asking: please provide a job. Help me not to be eaten up by worry about money and tomorrow. I cast this burden on you; hold me up when I am discouraged. Guide my steps as I search and apply. Each morning, let me see your mercies new, even on the days with no reply. Help me to seek your kingdom first, and to trust you for the rest. In Jesus' name, amen.",
        rootedIn: [
          sp("MAT 6:31-33", "card", "The Father knows what you need.", {
            context: "God's care for daily needs, not a promise of a particular job.",
          }),
          sp("PSA 55:22", "card", "A burden cast on the LORD, who sustains."),
          steps("Guidance for each step of the search."),
          newMercies("Mercies new every morning, rejection emails included."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Lord, [name] is looking for work, and it is wearing them down. Please provide the job they need. You know what they need for food, clothes and rent. Carry this burden with them, and hold them up. Guide their steps through every application and interview. Let them find your mercies new each morning, even after another refusal. Help them to seek you first, and to trust you for the rest. In Jesus' name, amen.",
        rootedIn: [
          sp("MAT 6:31-33", "card", "The Father who knows their needs."),
          sp("PSA 55:22", "card", "A burden God carries."),
          steps("Their steps, guided."),
          newMercies("New mercies each morning."),
        ],
      },
    ],
    topics: WORK_TOPICS,
    related: ["job-interview", "new-job", "big-decision"],
    elsewhere: [{ href: "/when-youre/out-of-work", title: "What the Bible says when you're out of work" }],
    words: ["job search", "unemployed", "laid off", "redundant", "fired", "out of work", "find a job", "jobless"],
  },
  {
    slug: "exam",
    group: "work",
    label: "Before an exam",
    heading: "A Prayer Before an Exam",
    searchTitle: "Prayer Before an Exam or Test",
    intro: "A prayer before an exam or test, for students of any age facing finals, a driving test or a professional exam. It asks God for wisdom and a clear memory, for calm in place of fear, and for the will to work hard. One is for you, and one is for a student you love.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I have an exam soon, and I'm nervous. You give wisdom generously to anyone who asks, so I am asking. Help me to remember what I have studied and to understand the questions, because knowledge and understanding come from you. Calm my fear: you have not given me a spirit of fear, but of power, love and self-control. Help me to do my honest best, as for you. Whatever the result, I trust you with it. In Jesus' name, amen.",
        rootedIn: [
          askWisdom("Asking for wisdom, and God's generous answer."),
          sp("PRO 2:6", "card", "Knowledge and understanding come from God."),
          wholeBeing("Doing your honest best, as for the Lord."),
          noFear("Power, love and self-control in place of fear."),
        ],
      },
      {
        id: "for-student",
        label: "For a student",
        forSomeone: true,
        text: "Father, [name] has an exam coming up. Give them wisdom as they study and as they write, because you give it generously. Bring back to their mind what they have learned, and give them understanding. Take away the fear that freezes their thinking, and give them a calm and steady mind. Help them to work hard and to do their best, as for you. And whatever the result, keep them from fear. In Jesus' name, amen.",
        rootedIn: [
          askWisdom("Wisdom given generously."),
          sp("PRO 2:6", "card", "Knowledge and understanding from God."),
          noFear("A sound mind instead of fear."),
          wholeBeing("Hard work, as for the Lord."),
        ],
      },
    ],
    historic: "bcp-prevent",
    topics: STUDY_TOPICS,
    related: ["first-day-of-school", "speaking-in-public", "job-interview"],
    words: ["exam", "exams", "test", "finals", "sat", "act", "gcse", "a levels", "bar exam", "driving test", "test anxiety", "study"],
  },
  {
    slug: "first-day-of-school",
    group: "work",
    label: "First day of school",
    heading: "A Prayer for the First Day of School",
    searchTitle: "Prayer for the First Day of School",
    intro: "A prayer for the first day of school, for a child walking through a new door, and for a student starting college. It asks God to go before them, to keep them from fear, and to help them grow in wisdom as Jesus did. One is for your child, and one is for a student leaving for college or university.",
    prayers: [
      {
        id: "for-child",
        label: "For your child",
        forSomeone: true,
        text: "Father, today is [name]'s first day at school. Go before them through the door, and be with them all day. Don't let them be afraid or discouraged. Help them to grow in wisdom and stature, and in favour with you and with the people around them, as Jesus did. Give them a love of learning that starts with knowing you. Be with them wherever they go: in the classroom, at lunch and in the playground. In Jesus' name, amen.",
        rootedIn: [
          sp("DEU 31:8", "card", "The LORD goes before them."),
          sp("JOS 1:9", "card", "Not afraid, for God is with them wherever they go."),
          sp("PRO 1:7", "card", "Knowledge that begins with the fear of the LORD."),
          sp("LUK 2:52", "card", "Growing as Jesus grew."),
        ],
      },
      {
        id: "for-student",
        label: "For a student starting college",
        forSomeone: true,
        text: "Lord, [name] is starting college, with new people, new freedom and a lot to learn. Give [name] courage, and keep them from fear and discouragement, because you go with them wherever they go. Let them grow in wisdom, and let their learning begin with honouring you. Help them to grow in favour with you and with the people they meet. Go before them into every new room, and never leave them. In Jesus' name, amen.",
        rootedIn: [
          sp("JOS 1:9", "card", "Courage, for God goes with them."),
          sp("PRO 1:7", "card", "Learning that begins with honouring God."),
          sp("LUK 2:52", "card", "Growing in wisdom and favour."),
          sp("DEU 31:8", "card", "God goes ahead and never leaves."),
        ],
      },
    ],
    topics: STUDY_TOPICS,
    related: ["exam", "child-leaving-home", "moving-away"],
    elsewhere: [{ href: "/life-events/back-to-school", title: "Verses and a printable card for back to school" }],
    words: ["school", "first day of school", "back to school", "kindergarten", "college", "university", "freshman", "new school"],
  },
  {
    slug: "speaking-in-public",
    group: "work",
    label: "Speaking in public",
    heading: "A Prayer Before Speaking in Public",
    searchTitle: "Prayer Before a Presentation or Speech",
    intro: "A prayer before a presentation, a speech, a sermon or a eulogy, for anyone whose nerves rise as the moment comes to stand up. It asks God for the right words, for calm in place of fear, and for speech that is gracious and pleasing to him. One is for you, and one is for someone you love who has to speak.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I have to speak in front of people, and my nerves are getting the better of me. You made my mouth. Help me as I speak, and teach me what to say. Take away the spirit of fear, and give me power, love and self-control. Let my words be gracious and seasoned with salt, so that I know how to answer. Let the words of my mouth and the thoughts of my heart please you, whether people are impressed or not. In Jesus' name, amen.",
        rootedIn: [
          sp("EXO 4:11-12", "card", "God who made the mouth helps the speaker.", {
            context: "God's answer to Moses' fear of speaking. It shows God's care for a hesitant speaker, not a promise of eloquence.",
          }),
          noFear("Power, love and self-control instead of fear."),
          sp("COL 4:6", "card", "Gracious words, seasoned with salt."),
          sp("PSA 19:14", "card", "Words that please God."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] has to speak in public soon. You gave each of us a mouth. Help them as they speak, and teach them what to say. Give them a spirit of power, love and self-control in place of fear. Let their words be gracious and seasoned with salt, so that they know how to answer whoever is listening. And let the words of their mouth and the thoughts of their heart please you. In Jesus' name, amen.",
        rootedIn: [
          sp("EXO 4:11-12", "card", "Help and teaching for a nervous speaker."),
          noFear("No spirit of fear."),
          sp("COL 4:6", "card", "Gracious speech."),
          sp("PSA 19:14", "card", "Words pleasing to God."),
        ],
      },
    ],
    topics: [T.speaking, T.tongue, T.meekness],
    related: ["job-interview", "hard-conversation", "opening-a-meeting"],
    words: ["speech", "presentation", "public speaking", "talk", "sermon", "preaching", "eulogy", "toast", "pitch"],
  },
  {
    slug: "big-decision",
    group: "work",
    label: "A big decision",
    heading: "A Prayer for a Big Decision",
    searchTitle: "Prayer for Guidance in a Big Decision",
    intro: "A prayer for guidance in a big decision: a job offer, a move, a relationship or a choice about care for someone you love. It asks God for wisdom, which he gives generously to anyone who asks, and for trust when the way is not clear. One is for you, and one is for someone you love who has to choose.",
    prayers: [
      {
        id: "for-you",
        label: "For you",
        text: "Lord, I have a big decision to make, and I can't see the way clearly. You give wisdom generously to anyone who asks, without finding fault, so I am asking for it now. Help me to trust you with all my heart and not to lean on my own understanding. Instruct me and teach me the way I should go; give me counsel and watch over me. I will make my plans, but you rule over my steps. Make my path straight. In Jesus' name, amen.",
        rootedIn: [
          trustNotLean("Trust, and a straight path."),
          askWisdom("Wisdom for anyone who asks."),
          sp("PSA 32:8", "card", "God's counsel and his watchful eye."),
          steps("Our plans, and God's rule over our steps."),
        ],
      },
      {
        id: "for-someone",
        label: "For someone you love",
        forSomeone: true,
        text: "Father, [name] has a big decision to make. Give them wisdom, because you give it generously to all who ask. Help them to trust you rather than lean on their own understanding. Teach them the way they should go, give them good counsel, and watch over them as they choose. Whatever they decide, rule over their steps and make their path straight. In Jesus' name, amen.",
        rootedIn: [
          askWisdom("Wisdom, given generously."),
          trustNotLean("Trust over their own understanding."),
          sp("PSA 32:8", "card", "Teaching and counsel."),
          steps("Their steps, in God's hands."),
        ],
      },
    ],
    historic: "bcp-trinity-4",
    topics: [T.decision, T.wisdom, T.waiting],
    related: ["moving-away", "job-interview", "looking-for-work"],
    elsewhere: [{ href: "/when-youre/big-decision", title: "What the Bible says when you're facing a big decision" }],
    words: ["decision", "guidance", "direction", "choice", "choose", "crossroads", "discernment", "what should i do"],
  },
];
