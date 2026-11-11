// Who's older?: what the player sees after answering (design §7.1), split for the kit's feedback band: the Verdict
// (right or wrong, who came first, the streak or hearts) goes in the band's row beside Next, and the Reading folds in
// under it: the timeline strip, the reason in one sentence (with the deciding verse, in the reader's Bible, when a verse
// decides it), and, under a fold, each person's dates and brief and a way to report a doubtful pair. It never moves on
// by itself. Words: fixed phrases and names stand in their own elements, so the translation check passes.
import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { BibleAbbr, Verse } from "@/components/Verse";
import { explain, verseHref, verseLabel } from "./explain";
import type { PoolPair, WhosOlderData } from "./game";
import { Timeline } from "./Timeline";

/** The reason, one sentence, with its verse when there is one. */
export function Reason({ data, pair }: { data: WhosOlderData; pair: PoolPair }) {
  const { text, verse } = explain(pair);
  return <>
    <p className="wo-reason">{text}</p>
    {verse && <blockquote className="wo-quote">
      <p>“<Verse from={verse[0]} to={verse[1]} unquoted />”</p>
      <footer><Link to={verseHref(data, verse)}>{verseLabel(data, verse)}</Link> <BibleAbbr /></footer>
    </blockquote>}
  </>;
}

export function Verdict({ pair, pick, status }: { pair: PoolPair; pick: string | null; status?: string }) {
  const right = pick === pair.first.id;
  return <div className="wo-verdict">
    <h2 className={right ? "wo-result is-right" : "wo-result is-wrong"}>
      {right ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
      <span>{right ? "Right!" : "Not this time"}</span>
      {status && <span className="wo-result-status">{status}</span>}
    </h2>
    <p className="wo-verdict-who"><strong>{pair.first.label}</strong> <span>came first</span></p>
  </div>;
}

export function Reading({ data, pair }: { data: WhosOlderData; pair: PoolPair }) {
  return <div className="wo-reading">
    <Timeline pair={pair} />
    <Reason data={data} pair={pair} />
    <details className="wo-more">
      <summary>More about them</summary>
      <ul className="wo-lines">
        {[pair.first, pair.second].map((person) => <li key={person.id}>
          <Link to={person.href} className="wo-line-name">{person.label}</Link>
          <span className="wo-line-when">{person.when}</span>
          {person.brief && <span className="wo-line-brief">{person.brief}</span>}
        </li>)}
      </ul>
      <p className="wo-report"><Link to="/contact">Something look wrong? Tell us</Link></p>
    </details>
  </div>;
}
