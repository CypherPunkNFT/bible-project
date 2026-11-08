// One life-event pack (design 5.2): heading, introduction (the page's search description, so it is the first long
// paragraph), the passages by role, the card maker, links onward and the source line.
import { Check, Copy } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { familyOf, lifeEventBySlug, lifeEventPath, LIFE_EVENTS_PATH, type LifeEvent, type PassageRole } from "@/data/life-events";
import { CardMaker, ROLE_TITLES } from "./CardMaker";
import { offeredOnCards, type ShownPassage } from "./passage";
import { usePackPassages } from "./usePackPassages";

const ROLES: PassageRole[] = ["reading", "card", "blessing"];

function CopyButton({ item }: { item: ShownPassage }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(`${item.text} — ${item.reference} (BSB)`)
      .then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1800); })
      .catch((error: unknown) => console.warn(`life-events: copying ${item.reference} failed`, error));
  };
  return (
    <button type="button" className="le-small-button" onClick={copy} aria-label={`Copy ${item.reference}`}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function PassageItem({ item, onUse }: { item: ShownPassage; onUse: (key: string) => void }) {
  return (
    <li className="le-passage">
      <div className="le-passage-head">
        <a href={item.readHref} className="le-reference">{item.reference}</a>
        <div className="le-passage-actions">
          {offeredOnCards(item) && (
            <button type="button" className="le-small-button" onClick={() => onUse(item.key)} aria-label={`Use ${item.reference} on the card`}>
              <span>Use on card</span>
            </button>
          )}
          <CopyButton item={item} />
        </div>
      </div>
      <blockquote className="scripture le-text" lang="en">{item.text}</blockquote>
      <p className="le-note">{item.passage.note}</p>
      {item.passage.context && <p className="le-note le-context"><strong>In context: </strong>{item.passage.context}</p>}
    </li>
  );
}

function PassageSections({ items, onUse }: { items: ShownPassage[]; onUse: (key: string) => void }) {
  return <>
    {ROLES.map((role) => {
      const shown = items.filter((item) => item.passage.role === role);
      if (!shown.length) return null;
      const groups = [...new Set(shown.map((item) => item.passage.group ?? ""))];
      return (
        <section key={role} className="le-role" aria-labelledby={`role-${role}`}>
          <h2 id={`role-${role}`}>{ROLE_TITLES[role]}</h2>
          {groups.map((group) => (
            <div key={group || "main"}>
              {group && <h3 className="le-group">{group}</h3>}
              <ul className="le-passages">
                {shown.filter((item) => (item.passage.group ?? "") === group).map((item) => <PassageItem key={item.key} item={item} onUse={onUse} />)}
              </ul>
            </div>
          ))}
        </section>
      );
    })}
  </>;
}

export function PackPage({ event }: { event: LifeEvent }) {
  const family = familyOf(event);
  const { state, retry } = usePackPassages(event);
  const [chosen, setChosen] = useState<{ key: string; count: number } | null>(null);
  const use = (key: string) => {
    setChosen((current) => ({ key, count: (current?.count ?? 0) + 1 }));
    document.getElementById("card-maker")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };
  const passages = state.status === "ready" ? state.value : null;
  const related = event.related.map(lifeEventBySlug).filter((item): item is LifeEvent => Boolean(item));
  return (
    <article className="le-page le-pack mx-auto max-w-5xl px-4 sm:px-6" style={{ "--family": `var(--${family.tone})` } as CSSProperties}>
      <nav className="le-crumbs" aria-label="Breadcrumb"><Link to={LIFE_EVENTS_PATH}>Life events</Link><span aria-hidden="true"> / </span><span>{family.title}</span></nav>
      <h1>{event.heading}</h1>
      <p className="le-intro">{event.intro}</p>
      {event.explainer && (
        <section className="le-explainer" aria-labelledby="le-explainer-title">
          <h2 id="le-explainer-title">{event.explainer.title}</h2>
          <p>{event.explainer.text}</p>
        </section>
      )}
      {state.status === "loading" && <p className="le-status" role="status">Loading the verses…</p>}
      {state.status === "error" && (
        <p className="le-status le-failed" role="alert">The verses could not be loaded. Check your connection and try again. <button type="button" className="le-small-button" onClick={retry}>Retry</button></p>
      )}
      {passages && <PassageSections items={passages} onUse={use} />}
      <CardMaker event={event} passages={passages} chosen={chosen} />
      <section className="le-more" aria-labelledby="le-more-title">
        <h2 id="le-more-title">Explore more</h2>
        <ul>
          {event.topics.map((topic) => <li key={topic.slug}><Link to={`/topics/${topic.slug}`}>{`Topic: ${topic.title}`}</Link></li>)}
          {related.map((item) => <li key={item.slug}><Link to={lifeEventPath(item)}>{item.heading}</Link></li>)}
          <li><Link to={LIFE_EVENTS_PATH}>All life events</Link></li>
        </ul>
      </section>
      <p className="le-source">Scripture quotations are from the Berean Standard Bible (public domain).</p>
    </article>
  );
}
