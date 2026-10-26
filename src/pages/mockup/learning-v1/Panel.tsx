// The panel beside a door's stack (mock-up A): the title pointed at (or the one clicked) with its cover, its facts, and,
// when it is ready, four real pages that open the page viewer, both downloads and what was checked. A planned title
// says so and offers nothing to download.
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Division, Title } from "@/data/resources/learning-catalogue";
import { type Back, plural, samplePages, titleUrl, toneOf } from "./model";
import { Cover, Downloads, SourceLink, Status } from "./parts";

export function Panel({ title: t, division, back, onPage }: { title: Title; division: Division; back: Back; onPage: (page: number) => void }) {
  const a = division.audience[t.audience], k = division.kind[t.kind], track = division.track[t.track], r = t.record;
  const series = t.series.length ? t.series.map((s) => <span key={s.id} className="lm-record-line">{division.seriesById[s.id].name} <span className="muted">· {s.step} of {division.inSeries(s.id).length}</span></span>)
    : <span className="muted">None</span>;
  const sessions = t.sessions ? <>{plural(t.sessions, "session")}{t.minutes ? `, about ${t.minutes} minutes each` : ""}{r ? ` · ${r.pages} pages` : " (planned)"}</> : <span className="muted">Set when it is written</span>;
  const guide = t.guide ? "Yes" : r ? <>Not yet <span className="muted">· the “How to use” page covers groups</span></> : "No";
  const rows: [string, ReactNode][] = [
    ["For", <>{a.name}{a.setting ? "" : ` · ${a.age}`} <span className="muted">· {a.how.toLowerCase()}</span></>], ["Kind", k.name], ["Subject", track.name], ["Series", series], ["Sessions", sessions], ["Leader guide", guide],
    [r ? "Written from" : "Will be written from", <ul className="lm-pn-from">{t.builtFrom.map((b) => <li key={b.path}><SourceLink className="" path={b.path} title={b.title} back={back} /></li>)}</ul>],
  ];
  return <div className="lm-pn" style={toneOf(a)}>
    <div className="lm-pn-top">
      <div className="lm-pn-cover"><Cover title={t} division={division} /></div>
      <div><p className="lm-kicker">{k.name} · {track.short}</p><h3>{t.title}</h3><p className="lm-pn-sub">{t.sub}</p><Status title={t} /></div>
    </div>
    <dl className="lm-pn-facts">{rows.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}</dl>
    {r ? <>
      <div className="lm-pn-pages">{samplePages(t).map(([n, caption]) => <button key={n} type="button" onClick={() => onPage(n)}>
        <img src={r.pageImages?.[n - 1]} alt={`Page ${n}: ${caption}`} loading="lazy" width={1000} height={1414} /><small>p. {n} · {caption}</small></button>)}</div>
      <Downloads title={t} />
      <p className="lm-pn-note">{t.review}</p>
    </> : <p className="lm-pn-note">Not written yet, so there is nothing to download. It becomes ready only after its pages are written from the sources above and every verse is checked.</p>}
    <Link className="lm-pn-open" to={titleUrl(t.id)} state={{ from: back }}>Open the title <ArrowRight size={14} aria-hidden="true" /></Link>
  </div>;
}
