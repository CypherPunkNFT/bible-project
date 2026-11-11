// Who's older?: what the player sees after answering (design §7.1): the verdict, the timeline, the reason in one
// sentence (with the deciding verse, in the reader's Bible, when a verse decides it), each person's dates and brief, and a way to
// report a doubtful pair. It never moves on by itself.
import { Check, X } from "lucide-react";
import { forwardRef } from "react";
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

interface RevealProps { data: WhosOlderData; pair: PoolPair; pick: string | null; status?: string; milestone?: string }

export const Reveal = forwardRef<HTMLHeadingElement, RevealProps>(function Reveal({ data, pair, pick, status, milestone }, ref) {
  const right = pick === pair.first.id;
  return <section className="wo-reveal" aria-labelledby={`wo-result-${pair.first.id}-${pair.second.id}`}>
    <h2 id={`wo-result-${pair.first.id}-${pair.second.id}`} ref={ref} tabIndex={-1} className={right ? "wo-result is-right" : "wo-result is-wrong"}>
      {right ? <Check size={20} aria-hidden="true" /> : <X size={20} aria-hidden="true" />}
      {right ? "Right!" : "Not this time"}
      {status && <span className="wo-result-status">{status}</span>}
    </h2>
    {milestone && <p className="wo-milestone" role="status">{milestone}</p>}
    <p className="wo-verdict"><strong>{pair.first.label}</strong> came first.</p>
    <Timeline pair={pair} />
    <Reason data={data} pair={pair} />
    <ul className="wo-lines">
      {[pair.first, pair.second].map((person) => <li key={person.id}>
        <Link to={person.href} className="wo-line-name">{person.label}</Link>
        <span className="wo-line-when">{person.when}</span>
        {person.brief && <span className="wo-line-brief">{person.brief}</span>}
      </li>)}
    </ul>
    <p className="wo-report"><Link to="/contact">Something look wrong? Tell us</Link></p>
  </section>;
});
