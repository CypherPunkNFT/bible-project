// The last screen of a test: the score as a ring, how it went topic by topic, and every question missed with its answer
// and verse, so the test ends as a lesson rather than a number.
import { ArrowLeft, RotateCcw, Shuffle } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { BankTopic } from "@/lib/data";
import type { Item, Result } from "./engine";
import { VerseWords } from "./parts";
import { Ring } from "./Ring";

interface Props {
  items: Item[];
  results: Result[];
  topics: BankTopic[];
  bookNames: Record<string, string>;
  backTo: string;
  onRetake: (items: Item[]) => void;
  onNew: () => void;
}

const verdictOf = (share: number) =>
  share === 1 ? "Every one right." : share >= 0.8 ? "Very well done." : share >= 0.5 ? "A good start. Go over the ones you missed below." : "Worth another try. Read the ones you missed below first.";

export function TestResults({ items, results, topics, bookNames, backTo, onRetake, onNew }: Props) {
  const right = results.filter((r) => r.right).length;
  const missed = items.filter((_, i) => !results[i].right);
  return <section className="tp-results" aria-labelledby="tp-results-title">
    <div className="tp-results-top">
      <Ring results={results}><strong>{Math.round((right / items.length) * 100)}<small>%</small></strong></Ring>
      <div className="tp-results-copy">
        <p className="tp-eyebrow"><span aria-hidden />Your results</p>
        <h1 id="tp-results-title"><strong>{right}</strong> of {items.length} <em>right</em></h1>
        <p>{verdictOf(right / items.length)}</p>
        <div className="tp-results-actions">
          {missed.length > 0 && <button type="button" className="tp-begin-go" onClick={() => onRetake(missed)}><RotateCcw size={16} strokeWidth={1.6} aria-hidden />Retake the {missed.length} I missed</button>}
          <button type="button" className="tp-quiet" onClick={onNew}><Shuffle size={15} strokeWidth={1.6} aria-hidden />A new test</button>
          <Link className="tp-quiet" to={backTo}><ArrowLeft size={15} strokeWidth={1.6} aria-hidden />Back to the questions</Link>
        </div>
      </div>
    </div>
    <ByTopic items={items} results={results} topics={topics} />
    {missed.length > 0 && <div className="tp-missed">
      <h2>Go over <em>these</em></h2>
      <ol>{items.map((item, i) => results[i].right ? null : <li key={i}>
        <span className="tp-missed-n">{String(i + 1).padStart(2, "0")}</span>
        <div>
          <p className="tp-missed-q">{item.prompt}</p>
          {results[i].given && <p className="tp-missed-given">You chose <s>{results[i].given}</s></p>}
          <p className="tp-missed-answer">{item.q.answer}</p>
          <VerseWords q={item.q} bookNames={bookNames} />
        </div>
      </li>)}</ol>
    </div>}
  </section>;
}

function ByTopic({ items, results, topics }: { items: Item[]; results: Result[]; topics: BankTopic[] }) {
  const rows = new Map<string, { right: number; total: number }>();
  items.forEach((item, i) => {
    const title = topics.find((t) => t.id === item.q.topic)?.title ?? "Other questions";
    const row = rows.get(title) ?? { right: 0, total: 0 };
    row.total++;
    if (results[i].right) row.right++;
    rows.set(title, row);
  });
  if (rows.size < 2) return null;
  const sorted = [...rows].sort((a, b) => b[1].total - a[1].total);
  return <div className="tp-by-topic">
    <h2>By <em>topic</em></h2>
    <ul>{sorted.map(([title, { right, total }]) => <li key={title} style={{ "--share": `${(right / total) * 100}%` } as CSSProperties}>
      <span>{title}</span><span className="tp-bar" aria-hidden><span /></span><small>{right} of {total}</small>
    </li>)}</ul>
  </div>;
}
