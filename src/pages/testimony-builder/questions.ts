// The Testimony builder's eighteen prompts (docs/features/testimony-builder/design.md §2 and §9): five parts, each
// prompt with the heading its answer gets on the sheet, the question, guidance and an example. The texts are data so the
// translation collector takes them: every string is under 400 characters, starts with a word, and holds no semicolon,
// equals sign or backslash (content/translation/page_rules.py). Scripture is quoted only inside a writer's own sentence,
// never as a verse on its own, as the build's verse-wording check requires.
import { MAX_TESTIMONY_BLURB } from "@/lib/testimonies";

export type PartKey = "before" | "turning" | "since" | "reader" | "page";

export interface Part {
  key: PartKey;
  /** The part's name, shown over its questions in the list and on the open question. */
  title: string;
}

export const PARTS: readonly Part[] = [
  { key: "before", title: "Before Christ" },
  { key: "turning", title: "The turning" },
  { key: "since", title: "Life since" },
  { key: "reader", title: "To the reader" },
  { key: "page", title: "On the page" },
];

export type QuestionKind = "long" | "line";

export interface Question {
  /** Lower-case words joined by hyphens: the key its answer is stored under. */
  id: string;
  part: PartKey;
  /** A paragraph answer (textarea) or a single line (name, title, when). */
  kind: QuestionKind;
  /** The answer's heading on the sheet. A line question has none: it goes in the title block. */
  heading?: string;
  /** The short name in the questions list. */
  short: string;
  /** The question itself, which labels the answer box. */
  text: string;
  /** Why it matters and what to put in, a few sentences. */
  guidance: readonly string[];
  /** A few sentences in an ordinary voice, marked as an example, never copied into the answer. */
  example?: readonly string[];
  /** The most UTF-16 units the answer may hold (maxLength counts the same way). */
  limit: number;
}

export const LONG_LIMIT = 4000;
/** The counter appears once an answer passes this many characters. */
export const COUNTER_FROM = 3500;
export const NAME_LIMIT = 60;
export const TITLE_LIMIT = 120;
export const WHEN_LIMIT = 80;

export const QUESTIONS: readonly Question[] = [
  {
    id: "began", part: "before", kind: "long", limit: LONG_LIMIT,
    heading: "Where I began", short: "Where I began",
    text: "Where did you grow up, and what was home like? What did you believe about God then?",
    guidance: [
      "Start where a stranger can stand beside you: a place, a family, an ordinary day.",
      "Say what you thought about God before anything changed, even if the answer is that you never thought about Him at all. A reader who grew up the same way will know this story is for them.",
      "Two or three honest sentences are enough. You are setting the scene, not writing a memoir.",
    ],
    example: [
      "I grew up in a small town outside Memphis, the middle of three children. We went to church at Christmas and Easter, and I thought God was something like the weather: real, distant, and nothing to do with my week.",
    ],
  },
  {
    id: "living-for", part: "before", kind: "long", limit: LONG_LIMIT,
    heading: "What I was living for", short: "What I was living for",
    text: "Before you knew Christ, what were you chasing, leaning on, or hoping would make you whole?",
    guidance: [
      "Everyone lives for something: approval, success, a relationship, comfort, control, being left alone. Name yours plainly.",
      "This is the part of your story a reader will measure their own life against, so be specific rather than dramatic. Ordinary idols are the most recognisable ones.",
      "Resist the urge to make the old life sound either glamorous or worse than it was. Tell it straight.",
    ],
    example: [
      "I was living for the next promotion. If I was the best in the room, I felt safe. If I was not, I felt nothing at all, and I filled the evenings with whatever kept that feeling away.",
    ],
  },
  {
    id: "missing", part: "before", kind: "long", limit: LONG_LIMIT,
    heading: "What was missing", short: "What was missing",
    text: "Was there a hard season, a habit, a fear or an emptiness that shaped you before Christ?",
    guidance: [
      "Share only what you are willing for a stranger to read. A testimony does not need every detail to be true, and some things belong to a pastor or a friend rather than a page.",
      "What matters is the gap: what you could not fix, forgive, carry or quiet on your own. That gap is where the gospel will land in the next part.",
      "If you came to Christ young, the emptiness may be small and quiet. Say so. God saves children too, and their stories are no less His.",
    ],
    example: [
      "When my father died I was twenty-two, and I discovered I had no one to be angry at and no one to thank. I kept busy for two years so I would not have to sit in that silence.",
    ],
  },
  {
    id: "pointed", part: "turning", kind: "long", limit: LONG_LIMIT,
    heading: "Who pointed me to Jesus", short: "Who pointed me to Jesus",
    text: "Who, or what event, helped bring you to Christ?",
    guidance: [
      "Name the people and the means God used: a friend who kept inviting you, a grandmother's prayers, a sermon, a book, a Bible left in a drawer, a hospital bed.",
      "Say what they actually did, not just that they were kind. A reader who wants to help someone else will learn from it.",
      "Give the credit where it belongs. People carried the message, but it was God who opened your heart.",
    ],
    example: [
      "A coworker named Dana asked me to lunch every Thursday for a year and never once pushed. When I finally asked her why she seemed so settled, she told me about Jesus like she was telling me about a person she knew.",
    ],
  },
  {
    id: "scene", part: "turning", kind: "long", limit: LONG_LIMIT,
    heading: "The day everything changed", short: "The day everything changed",
    text: "Where were you, and what was happening, when you were saved? Tell it like a scene.",
    guidance: [
      "Put the reader in the room: the place, the time of day, who was there, what was said, what you prayed or thought.",
      "For some it was one moment they can date. For others it was a slow turning, and they only know they were once blind and now see. Either is a true conversion. Tell the kind you had.",
      "Use your own words for what you did: you trusted Christ, you turned from your sin, you asked Him to save you. Say what repentance and faith looked like for you.",
    ],
    example: [
      "It was a Tuesday night in March, in my car in the church parking lot, after a Bible study on the prodigal son. I did not get out. I sat there and told God I had been running my own life into the ground and I was done, and I asked Jesus to forgive me and take over. Nothing lit up. But I drove home a different man.",
    ],
  },
  {
    id: "saw", part: "turning", kind: "long", limit: LONG_LIMIT,
    heading: "What I came to see", short: "What I came to see",
    text: "What did you come to see about yourself, and about Jesus: your sin, the cross, His grace?",
    guidance: [
      "This is the heart of a testimony. A story about becoming a nicer person is not the gospel. Say what you understood: that you had sinned against God, that Jesus died in your place and rose again, and that forgiveness was a gift you could not earn.",
      "Use plain words. If you write grace, repentance or saved, add what you mean by it, so a reader who has never been inside a church can follow.",
      "Keep Jesus the hero. Your sin is the background. His mercy is the point.",
    ],
    example: [
      "I had always thought of myself as a good person who made a few mistakes. That night I saw that I had spent my whole life ignoring the God who made me, and that this was the real problem under all the others. And I saw that Jesus had already paid for it on the cross. I did not have to make it up to Him. I only had to receive it.",
    ],
  },
  {
    id: "passage", part: "turning", kind: "long", limit: LONG_LIMIT,
    heading: "A passage God used", short: "A passage God used",
    text: "Was there a verse or passage God used in bringing you to Himself? What did it mean to you right then?",
    guidance: [
      "Write the reference and, if you like, the words as you remember them, then say what they meant to you in that season.",
      "You do not need a verse. Many people were saved through a sermon or a conversation and found their verse later. Leave this blank if that is you.",
      "Bible Guide quotes the Berean Standard Bible, a modern English translation. You may check any wording in the reader before you print.",
    ],
    example: [
      "Dana wrote Romans 5:8 on a napkin: that God showed His love for us in that Christ died for us while we were still sinners. Still sinners. Not once we had cleaned up. That was the first time I believed God could want me as I was.",
    ],
  },
  {
    id: "let-go", part: "turning", kind: "long", limit: LONG_LIMIT,
    heading: "What I let go of", short: "What I let go of",
    text: "What did you have to let go of, and what did it cost?",
    guidance: [
      "Following Jesus means turning around, and turning around means leaving something behind: a habit, a plan, a relationship, a grudge, a picture of yourself.",
      "Be honest about the cost. A testimony that admits something was hard to give up is more believable than one that says it was all easy.",
      "If what you let go of involves other people, write it in a way that protects them.",
    ],
    example: [
      "I had to let go of being right. For years I had kept a ledger of everyone who had wronged me, and I knew every entry by heart. Forgiving my brother cost me the one thing I thought I was owed, and it was the first truly free thing I ever did.",
    ],
  },
  {
    id: "now", part: "since", kind: "long", limit: LONG_LIMIT,
    heading: "My life now", short: "My life now",
    text: "What is your life like now? What is different from before?",
    guidance: [
      "Come back to the things you wrote in the first part: what you lived for, what was missing. What has become of them?",
      "Be concrete. A reader cannot picture joy and peace, but they can picture you sleeping through the night, or calling your mother on Sundays, or praying before a hard meeting.",
      "Do not claim more than is true. God does not need you to exaggerate His work.",
    ],
    example: [
      "I still work hard, but I no longer need the room to notice. I read the Bible most mornings before the house wakes up. The silence I used to run from has become the place I meet God.",
    ],
  },
  {
    id: "changing", part: "since", kind: "long", limit: LONG_LIMIT,
    heading: "How things are changing", short: "How things are changing",
    text: "How are things still changing in your life? Where are you still growing?",
    guidance: [
      "Readers trust a story that does not pretend the struggle is over. Name a place where God is still at work in you: a temper, a fear, a habit of hiding, a slowness to forgive.",
      "This is also where you can show how change happens for a Christian: through Scripture, prayer, the church, and the patient work of the Holy Spirit over years, not in a single leap.",
    ],
    example: [
      "I am still learning to ask for help. The old habit of carrying everything alone did not vanish at the parking lot. But I notice it now, and I have people who notice it too, and I am slowly becoming someone who can say I am not all right.",
    ],
  },
  {
    id: "faithful", part: "since", kind: "long", limit: LONG_LIMIT,
    heading: "When God proved faithful", short: "When God proved faithful",
    text: "Tell about a time since you came to Christ when God proved faithful.",
    guidance: [
      "Pick one real day or season, with the details you remember, rather than a list of blessings.",
      "Faithfulness is not always rescue. Sometimes God gave you what you asked for, and sometimes He carried you through what He did not take away. Both belong here.",
    ],
    example: [
      "When we lost the baby, I expected to lose my faith with her. Instead the church brought meals for six weeks, my wife and I prayed together for the first time in our marriage, and I found that the God I had met in the parking lot was still there in the hospital.",
    ],
  },
  {
    id: "church", part: "since", kind: "long", limit: LONG_LIMIT,
    heading: "My church family", short: "My church family",
    text: "What does your church family mean to you now?",
    guidance: [
      "The Christian life is not lived alone. Say how you came to belong to a local church, what it has given you, and what it has asked of you.",
      "If you were baptised as a believer, this is a good place to tell it: when, where, and what it meant to go under the water and come up again.",
    ],
    example: [
      "I was baptised at Grace Baptist on a cold Sunday in January, in a tank behind the choir loft, with Dana crying in the second row. Those people have since buried my mother with me, taught my children, and told me the truth when I did not want it. They are my family.",
    ],
  },
  {
    id: "tell-you", part: "reader", kind: "long", limit: LONG_LIMIT,
    heading: "If you are where I was", short: "If you are where I was",
    text: "If someone reading this is where you once were, what would you tell them?",
    guidance: [
      "Write to one person, not a crowd. Picture someone exactly where you were in the first part, and speak to them.",
      "Tell them what you wish someone had told you, and tell them what to do next: pray, open a Bible, find a church, talk to a Christian they trust.",
      "Jesus told a man He had healed to go home and tell his people how much the Lord had done for him. That is all a testimony is.",
    ],
    example: [
      "If you are sitting in a car in a parking lot tonight, sure that you have gone too far to come back: you have not. The God who made you is not waiting for you to fix yourself. Tell Him the truth. He already knows it, and He sent His Son for you anyway.",
    ],
  },
  {
    id: "verse", part: "reader", kind: "long", limit: LONG_LIMIT,
    heading: "A verse to leave you with", short: "A verse to leave you with",
    text: "Which verse would you leave them with?",
    guidance: [
      "One verse, with its reference, and if you like a sentence on why this one.",
      "You may write the words from the Bible you read. Bible Guide quotes the Berean Standard Bible in modern English, and you can check any wording in the reader.",
    ],
    example: [
      "I would leave you with Matthew 11:28, where Jesus calls everyone who is weary and burdened to come to Him for rest. I came tired. He kept His word.",
    ],
  },
  {
    id: "one-sentence", part: "reader", kind: "long", limit: MAX_TESTIMONY_BLURB,
    heading: "What the Lord has done for me", short: "In one sentence",
    text: "In one sentence, what has the Lord done for you?",
    guidance: [
      "This is your whole testimony in a breath: the line you could say to a stranger in an elevator.",
      "It is kept short on purpose, within 600 characters, so you can also use it as the summary when you share your testimony on the Bible Guide testimony tree.",
    ],
    example: [
      "The Lord took a man who had everything under control and nothing worth keeping, forgave him, and gave him a life he would never have chosen and would not now trade for anything.",
    ],
  },
  {
    id: "name", part: "page", kind: "line", limit: NAME_LIMIT,
    short: "Your name",
    text: "Your name as readers will see it",
    guidance: [
      "A first name is enough if you prefer. It is printed under the title.",
    ],
  },
  {
    id: "title", part: "page", kind: "line", limit: TITLE_LIMIT,
    short: "A title",
    text: "A title for your testimony",
    guidance: [
      "A few words a stranger would want to read on. A phrase from your own story often works best. If you leave this blank, the sheet is headed My testimony.",
    ],
    example: ["The Parking Lot", "How much the Lord has done for me", "Still sinners"],
  },
  {
    id: "when", part: "page", kind: "line", limit: WHEN_LIMIT,
    short: "When it happened",
    text: "When did it happen?",
    guidance: [
      "For example the summer of 2014, or at nineteen. It is printed beside your name.",
    ],
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

export const questionById = (id: string): Question | undefined => QUESTIONS.find((question) => question.id === id);

export const questionIndex = (id: string): number => QUESTIONS.findIndex((question) => question.id === id);

/** The questions whose answers are the testimony itself (not the title block). */
export const STORY_QUESTIONS: readonly Question[] = QUESTIONS.filter((question) => question.kind === "long");

/** An answer counts once it holds something other than spaces. */
export const isAnswered = (text: string | undefined): boolean => Boolean(text && text.trim() !== "");
