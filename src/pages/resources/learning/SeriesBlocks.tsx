// Series that cross the ages (mock-up A): each series as its name and kind on the left, and its titles as points on one
// line in order, each saying who it is for and whether it is ready. The filled point is the one ready today.
import { Link } from "react-router-dom";
import type { Division } from "@/data/resources/learning-catalogue";
import { type Back, titleUrl } from "./model";
import { SecHead } from "./parts";

export function SeriesBlock({ division, id, here, back }: { division: Division; id: string; here?: string; back: Back }) {
  const s = division.seriesById[id];
  return <div className="lm-path">
    <div><span className="type">{s.type}</span><h3>{s.name}</h3><p>{s.line}</p></div>
    <div className="lm-nodes">{division.inSeries(id).map((t) => <Link key={t.id} className={`lm-node ${t.status}${t.id === here ? " here" : ""}`} to={titleUrl(t.id)} state={{ from: back }}
      aria-current={t.id === here ? "page" : undefined}>
      <i /><b>{t.title}</b><small>{division.audience[t.audience].name} · {division.kind[t.kind].name} · {t.status === "ready" ? "ready" : "planned"}</small>
    </Link>)}</div>
  </div>;
}

export function SeriesBlocks({ division, num, back }: { division: Division; num: string; back: Back }) {
  return <section className="lm-sec" aria-labelledby="lm-series-title">
    <SecHead num={num} id="lm-series-title" title={<>Series that <em>cross the ages</em></>}
      lead="Some titles belong together: one subject told at every age, or a path to follow in order. The filled point is the one ready today." />
    <div className="lm-series">{division.series.map((s) => <SeriesBlock key={s.id} division={division} id={s.id} back={back} />)}</div>
  </section>;
}
