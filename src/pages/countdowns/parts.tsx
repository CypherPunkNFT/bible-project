// Small pieces shared by the countdown pages: the mark-as-read button, a candle panel, "Explore more", the source line,
// and a load failure with Retry.
import { Link } from "react-router-dom";
import { HYMN_TITLES, OCCASIONS, occasionBySlug, type DayPanel, type Occasion } from "@/data/countdowns";
import type { ShownPassage } from "@/pages/life-events/passage";
import { countdownPath } from "./message";

export function MarkButton({ read, onToggle }: { read: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={read ? "cd-button cd-mark cd-marked" : "cd-button cd-mark"} aria-pressed={read} onClick={onToggle}>
      {read ? "Read ✓" : "Mark as read"}
    </button>
  );
}

export function SavingNote({ saving }: { saving: boolean }) {
  return saving ? null : <p className="cd-quiet" role="status">Your ticks won't be kept after you close this window.</p>;
}

export function CandlePanel({ panel, shown }: { panel: DayPanel; shown: ShownPassage | undefined }) {
  return (
    <aside className="cd-candle" aria-label={panel.heading}>
      <p className="cd-candle-kicker">If your family lights an Advent wreath</p>
      <h3>{panel.heading}</h3>
      {shown ? <blockquote className="scripture" lang="en">“{shown.text}” <a href={shown.readHref}>{shown.reference}</a></blockquote> : <p className="cd-quiet">Loading the reading…</p>}
      <p>{panel.line}</p>
      {panel.hymn && HYMN_TITLES[panel.hymn] && <p className="cd-sing">Sing: <Link to={`/study/hymns/${panel.hymn}`}>{HYMN_TITLES[panel.hymn]}</Link></p>}
    </aside>
  );
}

export function LoadFailed({ retry }: { retry: () => void }) {
  return <p className="cd-failed" role="alert">Could not load the Bible text. <button type="button" className="cd-button" onClick={retry}>Retry</button></p>;
}

export function SourceLine() {
  return <p className="cd-source">Scripture quotations are from the Berean Standard Bible (public domain).</p>;
}

export function FootLink({ occasion }: { occasion: Occasion }) {
  return occasion.footLink ? <p className="cd-foot-link"><Link to={occasion.footLink.href}>{occasion.footLink.text}</Link></p> : null;
}

export function ExploreMore({ occasion }: { occasion: Occasion }) {
  const others = [...occasion.related.map(occasionBySlug).filter((item): item is Occasion => Boolean(item)),
    ...OCCASIONS.filter((item) => item.slug !== occasion.slug && !occasion.related.includes(item.slug))];
  return (
    <section className="cd-more" aria-labelledby="cd-more-title">
      <h2 id="cd-more-title">Explore more</h2>
      <div className="cd-more-grid">
        <div><h3>Topics</h3><ul>{occasion.topics.map((topic) => <li key={topic.slug}><Link to={`/topics/${topic.slug}`}>{topic.title}</Link></li>)}</ul></div>
        {occasion.hymns && <div><h3>Hymns</h3><ul>{occasion.hymns.map((id) => <li key={id}><Link to={`/study/hymns/${id}`}>{HYMN_TITLES[id] ?? id}</Link></li>)}</ul></div>}
        <div><h3>Other countdowns</h3><ul>{others.map((item) => <li key={item.slug}><Link to={countdownPath(item.slug)}>{item.name}</Link></li>)}</ul></div>
        {occasion.elsewhere && <div><h3>Elsewhere on the site</h3><ul>{occasion.elsewhere.map((item) => <li key={item.href}><Link to={item.href}>{item.title}</Link></li>)}</ul></div>}
      </div>
    </section>
  );
}
