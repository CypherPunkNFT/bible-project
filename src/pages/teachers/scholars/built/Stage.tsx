// The desktop ribbon diagram: one SVG for the ribbons, and the feature, book and scholar nodes laid over it from the
// stage width. Positions change only on resize; hovering only toggles classes.
import type { CSSProperties } from "react";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { faithOf, toneOf, yearsOf } from "./labels";
import type { Layout, Lit, Model } from "./model";
import { Mark } from "../marks/Mark";

interface StageProps {
  data: ScholarsData;
  model: Model;
  layout: Layout | null;
  lit: Lit | null;
  pinned: string | null;
}

const box = (b: { x: number; y: number; w: number; h: number }): CSSProperties => ({ left: b.x, top: b.y, width: b.w, height: b.h });
const on = (yes: boolean | undefined) => (yes ? " blt-on" : "");

export function Stage({ data, model, layout, lit, pinned }: StageProps) {
  const { features, rows, links } = model;
  return <>
    <svg preserveAspectRatio="none" className="blt-art" aria-hidden="true" viewBox={layout ? `0 0 ${layout.cols[2].x + layout.cols[2].w} ${layout.height}` : undefined}>
      <g>{rows.map(({ s }, i) => <path key={s.id} className={`blt-con${on(lit?.scholars.has(s.id))}`} d={layout?.connectors[i]} />)}</g>
      <g>{links.map((l, i) => <path key={`${l.f.id}|${l.s.id}`} className={`blt-rib${l.s.site?.status === "held" ? " blt-planned" : ""}${on(lit?.links.has(l))}`}
        data-f={l.f.id} data-s={l.s.id} data-scholar={l.s.id} style={{ "--tone": `var(${l.f.tone})` } as CSSProperties} d={layout?.ribbons[i]} />)}</g>
    </svg>
    {["On this site", "Source / work", "Contributor / source provider"].map((label, i) => <span key={label} className="blt-col"
      style={layout ? { left: layout.cols[i].x, width: layout.cols[i].w, textAlign: i === 0 ? "right" : undefined } : undefined}>{label}</span>)}
    {features.map((f, i) => {
      const n = links.filter((l) => l.f === f).length;
      return <button key={f.id} type="button" className={`blt-feat${f.planned ? " blt-planned" : ""}${on(lit?.features.has(f.id))}`} data-f={f.id}
        aria-pressed={pinned === f.id} style={{ "--tone": `var(${f.tone})`, ...(layout ? box(layout.feat[i]) : {}) } as CSSProperties}>
        <b>{f.name}</b><small>{n} of {f.matched} sources</small><i aria-hidden="true" />
      </button>;
    })}
    {rows.map(({ s }, i) => {
      const [title, year] = s.works[0];
      const more = s.works.length - 1;
      return <button key={s.id} type="button" className={`blt-work${s.site?.status === "held" ? " blt-planned" : ""}${on(lit?.scholars.has(s.id))}`}
        data-s={s.id} data-source={s.id} style={layout ? box(layout.work[i]) : undefined} title={`${title} · Inspect source connections`}>
        <i aria-hidden="true" /><span>{title}</span><small>{year}{more ? ` · and ${more} more` : ""}</small>
      </button>;
    })}
    {rows.map(({ s }, i) => <button key={s.id} type="button" className={`blt-sch${on(lit?.scholars.has(s.id))}`} data-s={s.id} data-scholar={s.id}
      style={{ "--i": i, "--tone": `var(${toneOf(s.field)})`, ...(layout ? box(layout.sch[i]) : {}) } as CSSProperties}>
      {s.profileId ? <Mark scholar={s} size={22} /> : <span aria-hidden="true">{s.name.split(/\s+/).slice(0,2).map(w=>w[0]).join("")}</span>}
      <span><b>{s.name}</b><small>{s.profileId?`${yearsOf(s)} · ${faithOf(data,s)}`:'Recorded source credit'}</small></span>
    </button>)}
  </>;
}
