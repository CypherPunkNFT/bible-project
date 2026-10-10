// What the profile holds about one scholar, every fact from the data: field, name, years and age, faith and site
// badges, the one-line summary, born / died / faith / era, key works, how the site uses them, where the site names them
// (relative bars), their life on a 0–2026 line, a small map, their finds and their step in how the Bible reached English.
import { Map as MapIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { Scholar, ScholarsData } from "@/data/teachers/pages-types";
import { eraParts, lived, NOW, yearPct, years } from "../marks/facts";
import { Mark } from "../marks/Mark";
import { toneStyle } from "../marks/shapes";
import { ProfileMap } from "./ProfileMap";

function SiteBadge({ s, compact }: { s: Scholar; compact?: boolean }) {
  if (!s.site) return null;
  if (s.site.status === "in-use") return <span className="prf-badge prf-badge-used"><i />Used on this site</span>;
  return <span className="prf-badge prf-badge-held">{compact ? "In the library" : "In the library, planned"}</span>;
}

function AreaBars({ s }: { s: Scholar }) {
  const rows = Object.entries(s.mentions).sort((a, b) => b[1] - a[1]);
  if (!rows.length) return <p className="prf-empty">Not named in the site's pages yet.</p>;
  const top = rows[0][1];
  return <>
    <ul className="prf-areas">{rows.map(([area, n]) => <li key={area}><span>{area}</span><i><b style={{ width: `${Math.max(6, n / top * 100)}%` }} /></i></li>)}</ul>
    <p className="prf-note">Bars compare the site's areas with each other for this scholar, from a rough search of the site's own text.</p>
  </>;
}

/** Their life on a line from year 0 to today: works as dots, faint marks for every other scholar. */
function LifeBar({ data, s }: { data: ScholarsData; s: Scholar }) {
  return <div className="prf-lb" role="img" aria-label={`Lived ${years(s)}, shown on a line from year 0 to ${NOW}`}>
    <div className="prf-lb-track">
      {data.scholars.filter((o) => o.id !== s.id).map((o) => <i key={o.id} className="prf-lb-other" style={{ left: yearPct((o.born + o.died) / 2) }} />)}
      <b style={{ left: yearPct(s.born), width: `max(4px, calc(${yearPct(s.died)} - ${yearPct(s.born)}))` }} />
      {s.works.map(([title, y]) => <i key={`${title}-${y}`} className="prf-lb-work" style={{ left: yearPct(y) }} title={`${title}, ${y}`} />)}
    </div>
    {[0, 500, 1000, 1500, 2000].map((y) => <span key={y} className="prf-lb-tick" style={{ left: yearPct(y) }}>{y}</span>)}
  </div>;
}

function Extras({ data, s }: { data: ScholarsData; s: Scholar }) {
  const finds = data.finds.filter((f) => f.by.includes(s.id));
  const steps = data.chain.steps, stepAt = steps.findIndex(([id]) => id === s.id);
  const shortOf = (id: string) => data.scholars.find((x) => x.id === id)?.short ?? id;
  return <>
    {finds.length > 0 && <section className="prf-card"><h3>Finds and digs</h3><ul className="prf-finds">
      {finds.map((f) => <li key={f.id}><b>{f.name}</b><span>{f.year} · {f.where[0]}</span><p>{f.line}</p></li>)}</ul></section>}
    {stepAt >= 0 && <section className="prf-card"><h3>How the Bible reached English</h3>
      <p className="prf-chain">Step <b>{stepAt + 1}</b> of {steps.length}: {steps[stepAt][1]}.</p>
      <ol className="prf-chain-row">{steps.map(([id], i) => <li key={id} className={i === stepAt ? "prf-on" : undefined}>{shortOf(id)}</li>)}</ol></section>}
  </>;
}

export function ProfileContent({ data, s }: { data: ScholarsData; s: Scholar }) {
  const [eraName, eraSpan] = eraParts(data, s.era), c = s.circa ? "c. " : "";
  return <div className="prf-grid" style={toneStyle(s.field)}>
    <div className="prf-main">
      <header className="prf-head"><Mark scholar={s} size={88} className="prf-mark" /><div>
        <p className="kicker">{data.fields[s.field]}</p>
        <h2 id="sc-prf-name">{s.name}</h2>
        <p className="prf-years">{years(s)} <span>· lived {lived(s)}</span></p>
        <p className="prf-tags"><span className="prf-faith">{data.faiths[s.faith]}</span><SiteBadge s={s} compact /></p></div></header>
      <p className="prf-line">{s.line}</p>
      <dl className="prf-facts">
        <div><dt>Born</dt><dd>{c}{s.born}</dd></div><div><dt>Died</dt><dd>{c}{s.died}</dd></div>
        <div><dt>Faith</dt><dd>{data.faiths[s.faith]}</dd></div><div><dt>Era</dt><dd>{eraName}<small>{eraSpan}</small></dd></div>
      </dl>
      <section><h3>Key works</h3><ol className="prf-works">{s.works.map(([title, year]) => <li key={`${title}-${year}`}><b>{title}</b><span>{year}</span></li>)}</ol></section>
      {s.acquiredId && <section><h3>Acquired texts</h3><p>{s.heldTexts.toLocaleString()} held text representations · {s.readableTexts.toLocaleString()} readable here. Editions and formats can overlap.</p><Link to={`/teachers/works?author=${encodeURIComponent(s.acquiredId)}`}>Browse the full shelf →</Link></section>}
      {s.faith === "catholic" && <aside className="acq-warning"><strong>Doctrinal review</strong><p>Review Catholic doctrinal claims against the project standard, including justification and Marian teachings. Assess philosophical arguments separately; these topics do not imply every author holds every listed position.</p></aside>}
      <section><h3>How this site uses their work</h3>
        {s.site ? <div className="prf-use"><SiteBadge s={s} /><p>{s.site.note}</p></div> : <p className="prf-empty">Not used on this site yet.</p>}</section>
      <section><h3>Where the site names them</h3><AreaBars s={s} /></section>
    </div>
    <div className="prf-aside">
      <section className="prf-card"><h3>Across two thousand years</h3><LifeBar data={data} s={s} />
        <p className="prf-note">Their life on a line from the time of Christ to today. Small dots are their works; faint marks are the other scholars.</p></section>
      <section className="prf-card"><h3>Where they mainly worked</h3><ProfileMap data={data} s={s} />
        <p className="prf-place"><MapIcon size={14} aria-hidden="true" />{s.place[0]}</p></section>
      <Extras data={data} s={s} />
    </div>
  </div>;
}
