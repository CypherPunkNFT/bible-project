// What came first?: what the player sees after answering (design §9.3), split for the kit's feedback band: the Verdict
// (right or wrong, what came first, the streak or hearts) goes in the band's row beside Next, and the Reading folds in
// under it: the year strip where the items have years, the reason in one sentence, the verse that settles it in the
// reader's Bible, and, under a fold, each item's dates and a way to report a doubtful pair. A Bible Firsts round shows
// the question's reason and its verse. It never moves on by itself. Words: fixed phrases and names stand in their own
// elements, so the translation check passes.
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BibleAbbr, Verse } from "@/components/Verse";
import { verseHref, verseLabel } from "../whos-older/explain";
import { explainPair } from "./explain";
import type { Span } from "./order";
import type { BookNames, FirstsQuestion, PairPool, PoolPair } from "./pool";
import { Strip } from "./Strip";
import { hasStrip } from "./view";

/** A verse quoted in the reader's Bible, with its reference linking to the reader. */
function Quote({ books, verse }: { books: BookNames; verse: Span }) {
  return <blockquote className="wo-quote">
    <p>“<Verse from={verse[0]} to={verse[1]} unquoted />”</p>
    <footer><Link to={verseHref({ books }, verse)}>{verseLabel({ books }, verse)}</Link> <BibleAbbr /></footer>
  </blockquote>;
}

/** The reason, one sentence, with its verse when there is one. */
export function Reason({ pool, pair }: { pool: PairPool; pair: PoolPair }) {
  const { text, verse } = explainPair(pool, pair);
  return <>
    <p className="wo-reason">{text}</p>
    {verse && <Quote books={pool.books} verse={verse} />}
  </>;
}

export function Verdict({ right, label, status, choice = false }: { right: boolean; label: string; status?: string; choice?: boolean }) {
  return <div className="wo-verdict">
    <h2 className={right ? "wo-result is-right" : "wo-result is-wrong"}>
      {right ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
      <span>{right ? "Right!" : "Not this time"}</span>
      {status && <span className="wo-result-status">{status}</span>}
    </h2>
    {choice
      ? <p className="wo-verdict-who"><span>The answer:</span> <strong>{label}</strong></p>
      : <p className="wo-verdict-who"><strong>{label}</strong> <span>came first</span></p>}
  </div>;
}

export function Reading({ pool, pair }: { pool: PairPool; pair: PoolPair }) {
  const items = [pair.first, pair.second];
  return <div className="wo-reading">
    {hasStrip(pool.key) && <Strip pair={pair} category={pool.key} />}
    <Reason pool={pool} pair={pair} />
    {pool.key === "books" && <p className="wcf-open">
      {items.map((book) => <Link key={book.id} to={`/read/bsb/${book.id}/1`}>{book.label}</Link>)}
    </p>}
    {items.some((item) => item.when) && <details className="wo-more">
      <summary>More about them</summary>
      <ul className="wo-lines">
        {items.map((item) => <li key={item.id}>
          {item.href ? <Link to={item.href} className="wo-line-name">{item.label}</Link> : <span className="wo-line-name">{item.label}</span>}
          {item.when && <span className="wo-line-when">{item.when}</span>}
          {item.brief && <span className="wo-line-brief">{item.brief}</span>}
        </li>)}
      </ul>
      <p className="wo-report"><Link to="/contact">Something look wrong? Tell us</Link></p>
    </details>}
  </div>;
}

export function ChoiceReading({ books, question }: { books: BookNames; question: FirstsQuestion }) {
  return <div className="wo-reading">
    <p className="wo-reason">{question.why}</p>
    {question.refs[0] && <Quote books={books} verse={question.refs[0]} />}
    <p className="wo-report"><Link to="/contact">Something look wrong? Tell us</Link></p>
  </div>;
}
