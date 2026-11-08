// 06 · Places and proposals: a small map of the land, with fixed sites as points and proposed sites as rings carrying their
// holders. The coast is Natural Earth's; the points are the site's places data; the lakes and the rings are drawn by this page,
// and the rings are placed from the record's words, never from coordinates.
import { plainText } from "@/pages/study/check-notes/checked";
import { D, LD } from "./model";
import { Head, StudyLink, T, VerseRefs } from "./parts";

/** Points whose name goes on their left (Joppa) or below (Jericho), clear of the coast and the rings beside them. */
const LEFT = new Set(["joppa"]);
const siteName = new Map(D.disputedSites.items.map((s) => [s.id, s.name]));

function LandMap() {
  const m = LD.map;
  return <figure className="ls-map">
    <svg viewBox={`0 0 ${m.width} ${m.height}`} role="img"
      aria-label={`Map of the land from Dan to the Negev. Fixed sites drawn as points: ${Object.values(m.points).map((p) => p.name).join(", ")}. Proposed sites drawn as rings: ${m.rings.map((r) => r.name.split(",")[0]).join(", ")}.`}>
      <rect width={m.width} height={m.height} className="ls-map-sea" />
      <path d={m.land} className="ls-map-land" /><path d={m.coast} className="ls-map-coast" />
      {Object.entries(m.lakes).map(([key, l]) => <ellipse key={key} cx={l.x} cy={l.y} rx={l.rx} ry={l.ry} className="ls-map-lake" />)}
      <path d={`M${m.lakes.galilee.x} ${m.lakes.galilee.y + m.lakes.galilee.ry}L${m.lakes.deadsea.x} ${m.lakes.deadsea.y - m.lakes.deadsea.ry}`} className="ls-map-river" />
      <polyline points={m.slice.map(([x, y]) => `${x},${y}`).join(" ")} className="ls-map-slice" />
      {m.labels.map((l) => <text key={l.name} x={l.x} y={l.y} textAnchor="middle" className="ls-map-band">{l.name}</text>)}
      {Object.entries(m.points).map(([key, p]) => <g key={key} className="ls-map-pt" data-fixed={key}><circle cx={p.x} cy={p.y} r="2.6" /><text x={key === "jericho" ? p.x + 4 : LEFT.has(key) ? p.x - 5 : p.x + 5} y={key === "jericho" ? p.y + 12 : p.y + 3} textAnchor={LEFT.has(key) ? "end" : "start"}>{p.name}</text></g>)}
      {m.rings.map((r, i) => {
        const before = m.rings.slice(0, i).find((o) => o.site === r.site && Math.hypot(o.x - r.x, o.y - r.y) < 30);
        return <g key={r.name} className="ls-map-ring" data-proposed={r.site}><circle cx={r.x} cy={r.y} r="8" />
          {!before && <text x={r.x + 11} y={r.y + 3}>{siteName.get(r.site)}?</text>}</g>;
      })}
    </svg>
    <figcaption className="ls-caption">Points: sites whose identification is widely agreed, from the site's places data (OpenBible.info, CC BY 4.0). Rings: proposals,
      placed by the record's description, not by coordinates. Coast: Natural Earth (public domain), today's shoreline. The lakes, the Jordan line, the band names and
      the dashed line of the slice are drawn by this page to show order, not surveyed edges.</figcaption>
  </figure>;
}

export function Places() {
  const ds = D.disputedSites;
  return <>
    <Head num="06" kicker="Places and proposals" title="A place on the ground." turn="A place on paper." lead={<p><T text={ds.lead} /></p>} />
    <div className="ls-places">
      <LandMap />
      <div>
        <p className="ls-rule"><T text={ds.rule} /></p>
        {ds.items.map((site) => <div key={site.id} className="ls-record">
          <h3>{site.name} <small>two proposals, both drawn</small></h3>
          <p className="ls-para"><T text={site.evidence} /></p>
          <ul className="ls-rings">{site.placements.map((p) => <li key={plainText(p.site)}>
            <svg viewBox="-10 -10 20 20" aria-hidden="true"><circle r="7" /></svg>
            <span><b><T text={p.site} /></b> <T text={p.held} /></span>
          </li>)}</ul>
          <p className="ls-caption"><T text={site.limit} /></p>
          <VerseRefs labels={site.verses} />
          <StudyLink title={site.link} />
        </div>)}
      </div>
    </div>
  </>;
}
