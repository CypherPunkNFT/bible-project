// Timeline sort's reveal (design §8.3): the true timeline, each card with its dating line, its window on a year axis
// (dropped when any card is from early Genesis), its BSB verse and people; between every two cards the reason the
// lower one is later, with the joins the player had the wrong way round highlighted.
import { ArrowDown } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { joinsOf } from "./order";
import { barOf, reasonOf, verseLink, yearAxis, type Loaded } from "./text";

interface Props {
  loaded: Loaded;
  /** The round's events in their true order. */
  truth: readonly string[];
  /** The player's last order. */
  order: readonly string[];
  banner: ReactNode;
  children?: ReactNode;
}

export const Reveal = forwardRef<HTMLHeadingElement, Props>(function Reveal({ loaded, truth, order, banner, children }, heading) {
  const events = truth.map((id) => loaded.byId.get(id)!);
  const axis = yearAxis(events);
  const joins = joinsOf(loaded.index, truth);
  const playerAt = new Map(order.map((id, i) => [id, i]));
  return <section className="tl-reveal" aria-labelledby="tl-reveal-heading">
    <h2 id="tl-reveal-heading" ref={heading} tabIndex={-1} className="tl-banner">{banner}</h2>
    {axis && <p className="tl-axis-ends" aria-hidden="true"><span>{axis.loText}</span><span>{axis.hiText}</span></p>}
    <ol className="tl-truth" aria-label="The true order, earliest first">
      {events.map((event, i) => {
        const had = playerAt.get(event.id)!;
        const verse = verseLink(loaded.data, event.refs[0]);
        const bar = axis ? barOf(event, axis) : null;
        const reason = i > 0 ? reasonOf(loaded, joins[i - 1]) : null;
        const wrongWay = i > 0 && playerAt.get(truth[i - 1])! > had;
        return <li key={event.id} className="tl-step">
          {reason && <p className={`tl-reason${wrongWay ? " is-missed" : ""}`}>
            <ArrowDown size={14} aria-hidden="true" />
            <span>{wrongWay && <strong>You had these the other way round. </strong>}{reason.text}
              {reason.verses.map((v) => <span key={v.href}> <Link to={v.href}>{v.label}</Link></span>)}</span>
          </p>}
          <article className="tl-event">
            <h3>{event.label}{had !== i && <span className="tl-had"> — you had it at {had + 1}</span>}</h3>
            <p className="tl-dating">{event.dating}</p>
            {bar && <div className="tl-bar" aria-hidden="true">
              <span className={bar.open ? "is-open" : undefined} style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
            </div>}
            <blockquote className="tl-quote">
              <p>{event.quote}</p>
              <footer><Link to={verse.href}>{verse.label}</Link> (BSB)
                {event.people.map((person) => <span key={person.href}> · <Link to={person.href}>{person.name}</Link></span>)}</footer>
            </blockquote>
          </article>
        </li>;
      })}
    </ol>
    <details className="tl-yours">
      <summary>Your order</summary>
      <ol>{order.map((id, i) => <li key={id} className={truth[i] === id ? "is-right" : undefined}>
        {loaded.byId.get(id)!.label}{truth[i] === id ? " ✓" : ""}</li>)}</ol>
    </details>
    <p className="tl-wrong">Something look wrong? <Link to="/contact">Tell us</Link></p>
    {children}
  </section>;
});
