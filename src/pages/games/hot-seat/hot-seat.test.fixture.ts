// Hot seat: a made-up question bank for the tests (design §11). `fixtureQuestions(n)` gives n playable questions spread
// over levels, testaments, topics and the children's flag, each opening with different words; `ruleQuestions` holds
// one question per eligibility rule. Used only by the *.test.ts(x) files (the name keeps it out of Vitest's file list).
import type { BankQuestion, QuestionBank } from "@/lib/data";
import type { FrozenQuestion } from "./deal";

const LEVELS = ["easy", "medium", "hard"] as const;
const TOPICS = ["beginnings", "exodus", "kings", "prophets", "jesus", "church"];
/** With NAMES, 480 different opening words, as a real bank has: a turn rarely runs out of new ones. */
const NAMES = ["Abram", "Sarah", "Isaac", "Rebekah", "Jacob", "Leah", "Rachel", "Joseph", "Moses", "Aaron", "Miriam", "Joshua", "Gideon", "Deborah", "Samson", "Ruth", "Hannah", "Samuel", "Saul", "David", "Jonathan", "Solomon", "Elijah", "Elisha", "Isaiah", "Jeremiah", "Daniel", "Esther", "Nehemiah", "Jonah", "Mary", "Peter", "Andrew", "James", "John", "Martha", "Lazarus", "Paul", "Barnabas", "Timothy"];
const OPENERS = ["Who led", "Where did", "What was", "How many", "Which city", "Who wrote", "When did", "What did", "Whose son", "Who built", "Why did", "Who saw"];

export function bankQuestion(i: number, extra: Partial<BankQuestion> = {}): BankQuestion {
  const answer = `Answer ${i}`;
  const testament = i % 2 === 0 ? "OT" : "NT";
  return {
    question: `${OPENERS[i % OPENERS.length]} ${NAMES[Math.floor(i / OPENERS.length) % NAMES.length]} in fixture ${i}?`, answer, options: [answer, `Wrong ${i}a`, `Wrong ${i}b`, `Wrong ${i}c`],
    reference: `Gen ${(i % 50) + 1}:${(i % 20) + 1}`, kind: "trivia", tradition: null, collection: "fixture", lesson: null, books: ["GEN"],
    testament, topic: TOPICS[i % TOPICS.length], link: { book: "GEN", chapter: (i % 50) + 1, verse: (i % 20) + 1 }, standalone: true,
    answer_choice: answer, lead_in: null, level: LEVELS[i % 3], children: i % 4 < 2, child: null,
    ...extra,
  };
}

export const fixtureQuestions = (count: number, from = 0) => Array.from({ length: count }, (_, i) => bankQuestion(from + i));

const long = (length: number) => `Who ${"a".repeat(length - 5)}?`;

/** One question per rule of §3.2, keyed by what it tests. */
export function ruleQuestions(): Record<string, BankQuestion> {
  return {
    plain: bankQuestion(9001, { level: "easy", children: true }),
    leadIn: bankQuestion(9002, { lead_in: { question: "Who was first?", answer: "Adam" } }),
    whichOfThese: bankQuestion(9003, { question: "Which of these men built the ark?" }),
    capitalNot: bankQuestion(9004, { question: "Who did NOT go into the ark?" }),
    longQuestion: bankQuestion(9005, { question: long(141) }),
    longestQuestion: bankQuestion(9006, { question: long(140) }),
    longAnswer: bankQuestion(9007, { answer: "x".repeat(41), answer_choice: "x".repeat(41), options: ["x".repeat(41), "Wrong a", "Wrong b", "Wrong c"] }),
    catechism: bankQuestion(9008, { kind: "catechism" }),
    childWorded: bankQuestion(9009, { level: "easy", children: true, child: { question: "Who built a big boat?", answer: "Noah", options: ["Noah", "Moses", "David", "Paul"] } }),
    notStandalone: bankQuestion(9010, { standalone: false }),
    noLevel: bankQuestion(9011, { level: null }),
  };
}

export function fixtureBank(questions: BankQuestion[] = fixtureQuestions(400)): QuestionBank {
  return { kinds: { trivia: "Bible quiz" }, topics: [], books: [], collections: [], questions };
}

let serial = 0;
/** A frozen question for the reducer and storage tests. */
export function frozen(extra: Partial<FrozenQuestion> = {}): FrozenQuestion {
  serial++;
  return { id: `q${String(serial).padStart(15, "0")}`, text: `Question ${serial}?`, answer: `Answer ${serial}`, full: null, reference: "Gen 1:1",
    link: { book: "GEN", chapter: 1, verse: 1 }, level: "easy", topic: "beginnings", choices: null, ...extra };
}

/** A repeatable random function (mulberry32), so a failing draw can be replayed. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
