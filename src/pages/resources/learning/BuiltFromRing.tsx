// "What it is built from" (mock-up B, under E's open stack): the titles behind a door on the inner ring and the site
// pages they are written from on the outer ring, joined by curves. Choosing a title (on the ring or in the list) draws
// its links and names its pages; choosing a page on the outer ring lights every title written from it.
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Audience, Division, Title } from "@/data/resources/learning-catalogue";
import { AUDIENCE_ART } from "./art-data";
import { AudienceShapes } from "./Art";
import { type Back, plural, ringLayout, titleUrl, toneOf } from "./model";
import { SourceLink, Status } from "./parts";

const W = 1000, H = 660, CX = 500, CY = 330, R1 = 140, R2 = 262;
const polar = (r: number, deg: number): [number, number] => { const a = ((deg - 90) * Math.PI) / 180; return [CX + r * Math.cos(a), CY + r * Math.sin(a)]; };
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const f = (n: number) => n.toFixed(1);


type Pick = { item: string } | { src: string } | null;

export function BuiltFromRing({ division, audience, items, back }: { division: Division; audience: Audience; items: Title[]; back: Back }) {
  const [pick, setPick] = useState<Pick>(null);
  const { srcs, ia, sa } = ringLayout(items);
  const picked = pick && "item" in pick ? division.title[pick.item] : null;
  const pickedPaths = new Set(picked?.builtFrom.map((b) => b.path) ?? []);
  const users = pick && "src" in pick ? new Set(items.filter((t) => t.builtFrom.some((b) => b.path === pick.src)).map((t) => t.id)) : null;
  const state = (on: boolean) => (pick ? (on ? " on" : " off") : "");
  const itemOn = (id: string) => (picked ? picked.id === id : users?.has(id) ?? false);
  const srcOn = (path: string) => (picked ? pickedPaths.has(path) : pick && "src" in pick ? pick.src === path : false);

  const links = items.flatMap((t) => t.builtFrom.map((b) => {
    const a1 = ia.get(t.id) ?? 0, a2 = sa.get(b.path) ?? 0, [x1, y1] = polar(R1, a1), [x2, y2] = polar(R2, a2), [qx, qy] = polar((R1 + R2) / 2 - 10, (a1 + a2) / 2);
    const on = picked ? picked.id === t.id : pick && "src" in pick ? pick.src === b.path : false;
    return <path key={`${t.id} ${b.path}`} className={`lk${state(on)}`} d={`M${f(x1)} ${f(y1)} Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}`} />;
  }));
  const dots = items.map((t) => {
    const a = ia.get(t.id) ?? 0, [x, y] = polar(R1, a), [tx, ty] = polar(R1 + 13, a);
    const anchor = Math.abs(a - 180) < 12 || a < 12 || a > 348 ? "middle" : a < 180 ? "start" : "end";
    return <g key={t.id} className={`it ${t.status}${state(itemOn(t.id))}`} onClick={() => setPick({ item: t.id })}>
      <circle cx={f(x)} cy={f(y)} r={t.status === "ready" ? 8 : 6.5} /><text x={f(tx)} y={f(ty + 4)} textAnchor={anchor}>{cut(t.title, 24)}</text>
    </g>;
  });
  const pages = srcs.map((s) => {
    const a = sa.get(s.path) ?? 0, [x, y] = polar(R2, a), [lx, ly] = polar(R2 + 10, a), right = ((a % 360) + 360) % 360 < 180;
    return <g key={s.path} className={`src${state(srcOn(s.path))}`} onClick={() => setPick({ src: s.path })}>
      <circle cx={f(x)} cy={f(y)} r={3.5} /><text x={f(lx)} y={f(ly + 11 / 3)} textAnchor={right ? "start" : "end"}>{cut(s.title, 34)}</text>
    </g>;
  });

  const list = <>
    <h3>{plural(items.length, "title")} behind this door</h3>
    <p>Choose a title (or a page on the outer ring) to draw its links. Every line ends at a page the site has already reviewed.</p>
    <ul>{items.map((t) => <li key={t.id}><a href={titleUrl(t.id)} onClick={(e) => { e.preventDefault(); setPick({ item: t.id }); }}>{t.title}</a> <span className="muted">· {division.kind[t.kind].name}</span> <Status title={t} /></li>)}</ul>
  </>;
  const detail = picked && <>
    <p className="lm-kicker">{division.kind[picked.kind].name} · {division.track[picked.track].name}</p>
    <h3 className="lm-gap-top">{picked.title}</h3>
    <p>{picked.sub}. <Status title={picked} /></p>
    <ul>{picked.builtFrom.map((b) => <li key={b.path}><SourceLink path={b.path} title={b.title} back={back} /></li>)}</ul>
    <p className="lm-constel-actions"><Link className="lm-btn" to={titleUrl(picked.id)} state={{ from: back }}>Open this title <ArrowRight size={14} aria-hidden="true" /></Link>
      <button type="button" className="lm-btn" onClick={() => setPick(null)}>All titles</button></p>
  </>;

  return <div className="lm-constel" style={toneOf(audience)}>
    <div><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Titles and the site pages they are built from">
      <circle className="ring" cx={CX} cy={CY} r={R1} /><circle className="ring" cx={CX} cy={CY} r={R2} strokeDasharray="2 5" />
      {links}{dots}{pages}
      <circle cx={CX} cy={CY} r={56} fill="var(--page)" stroke="var(--line)" />
      <svg x={CX - 44} y={CY - 34} width={88} height={64} viewBox="0 -8 120 88" fill="none" stroke="currentColor" strokeWidth={1.15} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--tone)" }} aria-hidden="true">
        <AudienceShapes shapes={AUDIENCE_ART[audience.art] ?? []} />
      </svg>
    </svg></div>
    <div className="lm-constel-side">{detail || list}</div>
  </div>;
}
