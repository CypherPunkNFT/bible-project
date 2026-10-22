// Pieces every look of the test page shares: the options, the open-answer reveal, the verse after an answer, the row
// of marks, the next button and the keyboard. Each look places and styles them its own way (test-page.css).
import { ArrowRight, ArrowUpRight, Check, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadChapterPlain, rightChoice } from "@/lib/data";
import { plainLookup } from "@/lib/refs";
import { useAsync } from "@/lib/useAsync";
import { LETTERS } from "../model";
import { choiceState } from "./controls";
import { verseOf, type Run, type TestQuestion, type VerseRef } from "./engine";

export function Tick({ right }: { right: boolean }) {
  return <svg className={`tp-tick ${right ? "is-right" : "is-wrong"}`} viewBox="0 0 24 24" aria-hidden>
    {right ? <path pathLength={1} d="M4 13.5 9.5 19 20 5.5" /> : <path pathLength={1} d="M6 6 18 18M18 6 6 18" />}
  </svg>;
}

export function Choices({ run }: { run: Run }) {
  const { item, answered } = run;
  if (!item.choices) return null;
  return <ol className={`tp-choices ${item.format === "truefalse" ? "is-pair" : ""}`}>
    {item.choices.map((option, i) => {
      const state = choiceState(option, rightChoice(item.q), answered);
      return <li key={option}><button type="button" className={state} disabled={Boolean(answered)} onClick={() => run.choose(option)}>
        <span className="tp-letter">{item.format === "truefalse" ? option[0] : LETTERS[i]}</span>
        <span className="tp-choice-text">{option}</span>
        {state === "is-right" && <Tick right />}{state === "is-wrong" && <Tick right={false} />}
      </button></li>;
    })}
  </ol>;
}

export function OpenAnswer({ run }: { run: Run }) {
  const { item, revealed, answered } = run;
  if (item.format !== "open") return null;
  if (!revealed && !answered) return <div className="tp-open is-waiting">
    <p>Think of your answer, then look.</p>
    <button type="button" className="tp-reveal" onClick={run.reveal}><Eye size={17} strokeWidth={1.6} aria-hidden />Show the answer</button>
  </div>;
  return <div className="tp-open">
    <p className="tp-open-answer">{item.q.answer}</p>
    <div className="tp-self" role="group" aria-label="Did you know it?">
      <button type="button" className="is-knew" aria-pressed={answered?.right === true} disabled={Boolean(answered)} onClick={() => run.mark(true)}><Check size={16} aria-hidden />I knew it</button>
      <button type="button" className="is-missed" aria-pressed={answered?.right === false} disabled={Boolean(answered)} onClick={() => run.mark(false)}><X size={16} aria-hidden />I missed it</button>
    </div>
  </div>;
}

/** One line after an answer: right, or what the answer is. */
export function Verdict({ run }: { run: Run }) {
  const { item, answered } = run;
  if (!answered) return null;
  if (item.format === "open") return <p className="tp-verdict">{answered.right ? "Marked as known." : "Marked to go over again."}</p>;
  return <p className={`tp-verdict ${answered.right ? "is-right" : "is-wrong"}`}>{answered.right ? "Right." : <>Not quite: it is <strong>{item.q.answer}</strong>.</>}</p>;
}

export function NextButton({ run }: { run: Run }) {
  const last = run.index + 1 >= run.items.length;
  return <button type="button" className="tp-next" disabled={!run.answered} onClick={run.next}>
    {last ? "See your results" : "Next question"}<ArrowRight size={16} strokeWidth={1.6} aria-hidden />
  </button>;
}

const refLabel = (ref: VerseRef, bookNames: Record<string, string>) =>
  `${bookNames[ref.book] ?? ref.book} ${ref.chapter}${ref.verse ? `:${ref.verse}${ref.verseEnd && ref.verseEnd !== ref.verse ? `–${ref.verseEnd}` : ""}` : ""}`;

/** Up to three verses' words from the Berean Standard Bible, shortened past 260 letters. */
async function loadWords(chapters: string[], ref: VerseRef): Promise<string | null> {
  if (!ref.verse || !chapters.includes(String(ref.chapter))) return null;
  const plain = await loadChapterPlain("bsb", ref.book, chapters, String(ref.chapter));
  const last = Math.min(ref.verseEnd ?? ref.verse, ref.verse + 2);
  const words: string[] = [];
  for (let v = ref.verse; v <= last; v++) {
    const text = plainLookup(plain, ref.chapter, v);
    if (text) words.push(text.replace(/^¶\s*/, ""));
  }
  const joined = words.join(" ");
  return joined.length > 260 ? `${joined.slice(0, 257).replace(/\s+\S*$/, "")}…` : joined || null;
}

/** The verse the question comes from, in its own words, with a link to read it. */
export function VerseWords({ q, bookNames }: { q: TestQuestion; bookNames: Record<string, string> }) {
  const catalog = useCatalog();
  const ref = verseOf(q);
  const chapters = ref ? catalog.translations.find((t) => t.slug === "bsb")?.books[ref.book] ?? [] : [];
  const words = useAsync(() => (ref ? loadWords(chapters, ref) : Promise.resolve(null)), `tp-verse:${ref ? refLabel(ref, {}) : "none"}`);
  if (!ref) return null;
  const to = `/read/bsb/${ref.book}/${ref.chapter}${ref.verse ? `?v=${ref.verse}` : ""}`;
  return <figure className="tp-verse">
    {words.status === "ready" && words.value && <blockquote>{words.value}</blockquote>}
    <figcaption><Link to={to}>{refLabel(ref, bookNames)}<ArrowUpRight size={13} strokeWidth={1.6} aria-hidden /></Link></figcaption>
  </figure>;
}

export function KeyHint({ run }: { run: Run }) {
  const { item } = run;
  const hint = item.format === "open" ? "Space shows the answer · Y or N to mark it · Enter for the next"
    : item.format === "truefalse" ? "T or F to answer · Enter for the next" : "A to D to answer · Enter for the next";
  return <p className="tp-keys">{hint}</p>;
}
