// Answer matching (design §6): every worked example of §6.6, the typo allowance at its boundaries, equivalent forms,
// retyped openings and references, and the "Show next word" hint. Hidden parts are read from the BSB on disk.
import vocabularyFile from "@/data/verse-completion/vocabulary.json";
import { bsbWords } from "@/lib/bsb-for-tests";
import { allowance, judge, matchAnswer, withNextWord, type AnswerContext } from "./match";
import { cleanVerse } from "./passage";
import { words } from "./words";

const vocabulary = new Set(vocabularyFile as string[]);

/** A context whose hidden part starts at the first word of `from` inside the verse. */
function contextFor(code: string, book: string, chapter: number, verse: number, from: string, to?: string): AnswerContext {
  const text = cleanVerse(bsbWords({ code, chapter, verse }));
  const list = words(text);
  const start = list.findIndex((word, i) => text.slice(word.start).replace(/^[“‘"']/, "").startsWith(from) && i >= 0);
  if (start < 0) throw new Error(`test: "${from}" not found in ${code} ${chapter}:${verse}`);
  const end = to ? list.findIndex((word, i) => i >= start && word.key === to) + 1 : list.length;
  return { hidden: list.slice(start, end), opening: list.slice(0, start), reference: { book, chapter, verse, last: verse }, vocabulary };
}

const accuracy = (input: string, context: AnswerContext) => Math.round(matchAnswer(input, context).accuracy);

describe("verse completion matching: the worked examples (§6.6)", () => {
  const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");
  const lean = contextFor("PRO", "Proverbs", 3, 5, "lean not");
  const word = contextFor("JHN", "John", 1, 1, "the Word was God");
  const believes = contextFor("JHN", "John", 3, 16, "everyone who", "him");
  const grace = contextFor("2CO", "2 Corinthians", 12, 9, "My grace", "you");
  const withGod = contextFor("JHN", "John", 1, 1, "and the Word was with God", "god");
  const strength = contextFor("PHP", "Philippians", 4, 13, "who gives");
  const honor = contextFor("EXO", "Exodus", 20, 12, "Honor your", "father");

  it("scores each example as the design works it out", () => {
    expect(accuracy("i shall not want", shepherd)).toBe(100);
    expect(accuracy("lean not on your own understandin", lean)).toBe(100);
    // §6.6 works this one out as 71% (two extras and a missing "not", cost 3), but the cheapest alignment under §6.4's own
    // costs pairs "do" with "lean" (wrong, 1) and leaves the second "lean" extra (1): 5 ÷ (6 + ½) = 77%, still two stars.
    expect(accuracy("don't lean on your own understanding", lean)).toBe(77);
    expect(accuracy("the lord was god", word)).toBe(75);
    expect(accuracy("everyone who believe in him", believes)).toBe(90);
    expect(accuracy("my grace is enough for you", grace)).toBe(83);
    expect(accuracy("and the word was god", withGod)).toBe(83);
    expect(accuracy("who gives me strenght", strength)).toBe(100);
    expect(accuracy("Psalm 23:1 The Lord is my shepherd, I shall not want", shepherd)).toBe(100);
    expect(accuracy("honour your father", honor)).toBe(100);
  });

  it("marks each word with its verdict and keeps extras apart", () => {
    const result = matchAnswer("don't lean on your own understanding", lean);
    expect(result.marks.map((mark) => mark.verdict)).toEqual(["wrong", "exact", "exact", "exact", "exact", "exact"]);
    expect(result.extras).toEqual(["lean"]);
    expect(matchAnswer("everyone who believe in him", believes).marks[2]).toMatchObject({ verdict: "near", credit: 0.5 });
    expect(matchAnswer("who gives me strenght", strength).marks[3]).toMatchObject({ verdict: "typo", typed: "strenght" });
  });
});

describe("verse completion matching: the rules (§6.1–§6.4)", () => {
  it("allows 0, 1 or 2 slips by length, with the boundaries at 3/4 and 6/7 letters", () => {
    expect([3, 4, 6, 7].map(allowance)).toEqual([0, 1, 1, 2]);
    expect(judge("son", "sun", new Set())).toBe("wrong");
    expect(judge("sons", "sona", new Set())).toBe("typo");
    expect(judge("hearts", "haerts", new Set())).toBe("typo");
    expect(judge("hearts", "hxxrts", new Set())).toBe("wrong");
    expect(judge("shepherd", "shephard", new Set())).toBe("typo");
    expect(judge("shepherd", "shxphxrx", new Set())).toBe("wrong");
  });

  it("never calls a changed first letter or a real BSB word a typo; a first-two swap is one", () => {
    expect(judge("mercy", "nercy", vocabulary)).toBe("wrong");
    expect(judge("love", "live", vocabulary)).toBe("wrong");
    expect(judge("word", "lord", vocabulary)).toBe("wrong");
    expect(judge("mercy", "emrcy", vocabulary)).toBe("typo");
  });

  it("ignores case, punctuation, quote and dash styles; expands contractions; maps British spellings and numbers", () => {
    const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");
    expect(accuracy("“I SHALL — not want!!”", shepherd)).toBe(100);
    expect(accuracy("I shall not want", shepherd)).toBe(100);
    expect(judge("cannot", "cannot", vocabulary)).toBe("exact");
    const honor = contextFor("EXO", "Exodus", 20, 12, "Honor your", "mother");
    expect(accuracy("honour your father & mother", honor)).toBe(100);
  });

  it("removes a retyped opening only when the whole opening was typed, and a reference only when it is this passage's", () => {
    const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");
    expect(accuracy("The LORD is my shepherd; I shall not want.", shepherd)).toBe(100);
    expect(accuracy("I shall not want (Psalm 23:1)", shepherd)).toBe(100);
    expect(accuracy("Psalms 23 1 I shall not want", shepherd)).toBe(100);
    expect(accuracy("John 3:16 I shall not want", shepherd)).toBeLessThan(100);
  });

  it("charges extra words half each, scores an empty answer 0 and survives 600 characters of noise", () => {
    const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");
    expect(accuracy("and i shall not want", shepherd)).toBe(89); // 4 ÷ (4 + ½)
    expect(matchAnswer("", shepherd).accuracy).toBe(0);
    const started = performance.now();
    const noise = matchAnswer("zq xv ".repeat(200), shepherd);
    expect(performance.now() - started).toBeLessThan(1000);
    expect(noise.accuracy).toBeLessThan(5);
  });

  it("is word perfect only with every word exact, nothing extra and no hint", () => {
    const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");
    expect(matchAnswer("I shall not want.", shepherd).perfect).toBe(true);
    expect(matchAnswer("I shall not wnat", shepherd).perfect).toBe(false);
    expect(matchAnswer("I shall not want", { ...shepherd, hinted: new Set([3]) }).perfect).toBe(false);
  });
});

describe("verse completion: Show next word (§5.2)", () => {
  const shepherd = contextFor("PSA", "Psalms", 23, 1, "I shall");

  it("puts the earliest unearned word in place, keeps the rest, and that word then scores zero", () => {
    const first = withNextWord("i not want", shepherd)!;
    expect(first).toEqual({ answer: "i shall not want", index: 1 });
    const scored = matchAnswer(first.answer, { ...shepherd, hinted: new Set([first.index]) });
    expect(scored.marks[1]).toMatchObject({ verdict: "wrong", credit: 0 });
    expect(Math.round(scored.accuracy)).toBe(75);
  });

  it("replaces a wrong word, starts an empty answer and stops when every word has credit", () => {
    expect(withNextWord("i shall not need", { ...shepherd, hinted: new Set() })).toEqual({ answer: "i shall not want", index: 3 });
    expect(withNextWord("", shepherd)).toEqual({ answer: "I", index: 0 });
    expect(withNextWord("i shall not want", shepherd)).toBeNull();
  });

  it("does not move a hint's penalty onto a repeated word elsewhere", () => {
    const hinted = new Set([0]);
    const result = matchAnswer("i shall not want", { ...shepherd, hinted });
    expect(result.marks.map((mark) => mark.credit)).toEqual([0, 1, 1, 1]);
  });
});
