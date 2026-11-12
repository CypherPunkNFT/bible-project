// Timeline sort's reveal (design §8.3; redesigned from docs/visual-audits/timeline.md, item 3): the true order as one
// connected timeline, a short row per event on a shared axis of years (dropped when any card is from early Genesis),
// with the slot the player had it in. A row opens to its dating line, the reason it follows the one before (the joins
// the player had the wrong way round are marked on the connecting line), its BSB verse and its people. All the teaching
// stays; each reader decides how deep to go. On a win the rows hop in a wave, top to bottom (the kit's hop).
import { ArrowDown, ChevronDown } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { Verse } from "@/components/Verse";
import { formatNumber } from "@/lib/site-format";
import { joinsOf } from "./order";
import { barOf, reasonOf, verseLink, whenOf, yearAxis, type Loaded } from "./text";

interface Props {
  loaded: Loaded;
  /** The round's events in their true order. */
  truth: readonly string[];
  /** The player's last order. */
  order: readonly string[];
  /** The rows hop in a wave (a solved Daily, a perfect Practice round). */
  celebrate?: boolean;
}

const WHEN_WORD = { about: "About", by: "By", from: "From", early: "Early Genesis" } as const;

export function Reveal({ loaded, truth, order, celebrate = false }: Props) {
  const events = truth.map((id) => loaded.byId.get(id)!);
  const axis = yearAxis(events);
  const joins = joinsOf(loaded.index, truth);
  const playerAt = new Map(order.map((id, i) => [id, i]));
  return <section className="tl-reveal" aria-label="The true order">
    <h3 className="tl-reveal-title">The true order</h3>
    {axis && <p className="tl-axis-ends" aria-hidden="true"><span>{axis.loText}</span><span>{axis.hiText}</span></p>}
    <ol className={`tl-truth${celebrate ? " kit-hop" : ""}`} aria-label="The true order, earliest first">
      {events.map((event, i) => {
        const had = playerAt.get(event.id)!;
        const verse = verseLink(loaded.data, event.refs[0]);
        const bar = axis ? barOf(event, axis) : null;
        const reason = i > 0 ? reasonOf(loaded, joins[i - 1]) : null;
        const wrongWay = i > 0 && playerAt.get(truth[i - 1])! > had;
        const when = whenOf(event);
        return <li key={event.id} className={`tl-step${wrongWay ? " is-missed" : ""}${had === i ? " is-right" : ""}`} style={{ "--kit-i": i } as CSSProperties}>
          <details className="tl-event">
            <summary>
              <span className="tl-step-head">
                <span className="tl-step-title">{event.label}</span>
                <span className="tl-step-meta">
                  {had !== i && <span className="tl-had">{`You placed it at ${formatNumber(had + 1)}`}</span>}
                  {when.years ? <span className="tl-step-when"><span>{WHEN_WORD[when.kind]}</span> <span className="tl-years">{when.years}</span></span>
                    : <span className="tl-step-when">{WHEN_WORD.early}</span>}
                </span>
              </span>
              {bar && <span className="tl-bar" aria-hidden="true">
                <span className={bar.open ? "is-open" : undefined} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
              </span>}
              <ChevronDown size={16} aria-hidden="true" className="tl-step-chevron" />
            </summary>
            <div className="tl-step-body">
              {reason && <p className={`tl-reason${wrongWay ? " is-missed" : ""}`}>
                <ArrowDown size={14} aria-hidden="true" />
                <span>{wrongWay && <strong>You had these the other way round. </strong>}{reason.text}
                  {reason.verses.map((v) => <span key={v.href}> <Link to={v.href}>{v.label}</Link></span>)}</span>
              </p>}
              <p className="tl-dating">{event.dating}</p>
              <blockquote className="tl-quote">
                <p><Verse bible="bsb" from={event.refs[0][0]} to={event.refs[0][1]} max={3} /></p>
                <footer><Link to={verse.href}>{verse.label}</Link> (BSB)
                  {event.people.map((person) => <span key={person.href}> · <Link to={person.href}>{person.name}</Link></span>)}</footer>
              </blockquote>
            </div>
          </details>
        </li>;
      })}
    </ol>
    <details className="tl-yours">
      <summary>Your order</summary>
      <ol>{order.map((id, i) => <li key={id} className={truth[i] === id ? "is-right" : undefined}>
        {loaded.byId.get(id)!.label}{truth[i] === id ? " ✓" : ""}</li>)}</ol>
    </details>
    <p className="tl-wrong"><span>Something look wrong?</span> <Link to="/contact">Tell us</Link></p>
  </section>;
}
