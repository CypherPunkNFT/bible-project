// "Built on their work": who feeds which part of the site, and where every node and ribbon sits for a stage width.
// Live features are read from each in-use scholar's own site note (no hand-made mapping); books held in the library
// gather under one dashed "In the library" group.
import { featureEvidence, profileFor } from "../site-evidence";
import type { Scholar, Field } from "@/data/teachers/pages-types";

export interface Feature { id: string; name: string; tone: string; sub: string; planned: boolean; test: RegExp | null }
export interface RibbonPerson {
 id:string; name:string; short:string; field:Field; works:[string,string|number][];
 born?:number; died?:number|null; circa?:boolean; faith?:Scholar['faith'];
 site?:Scholar['site']; profileId?:string; sourceUrl:string;
}
export interface Row { s: RibbonPerson; fs: Feature[] }
export interface Link { f: Feature; s: RibbonPerson }
export interface Model { features: Feature[]; rows: Row[]; usedCount: number; links: Link[] }

export function buildModel(scholars: Scholar[]): Model {
 const tones=['--poetry','--gospels','--acts','--epistles','--prophets','--history','--history','--revelation'];
 const features:Feature[]=featureEvidence.map((f,i)=>({id:f.id,name:f.label,tone:tones[i],sub:'Verified source records',planned:false,test:null}));
 const rows:Row[]=featureEvidence.flatMap((f,i)=>f.sources.map(r=>{
  const profile=r.author.includes(" & ") ? undefined : profileFor(r.author,scholars);
  const s:RibbonPerson={id:`${f.id}:${r.id}`,name:r.author,short:r.author,field:profile?.field??'reference',
   works:[[r.title,r.year]],born:profile?.born,died:profile?.died,faith:profile?.faith,profileId:profile?.id,sourceUrl:r.url,
   site:{status:r.kind==='bibliography'?'held':'in-use',note:`${r.kind==='data'?'Feature input':r.kind==='citation'?'Page citation':'Bibliography only'}: ${r.uses.map(u=>u.page).filter((v,i,a)=>a.indexOf(v)===i).join('; ')}`}};
  return {s,fs:[features[i]]};
 }));
 return {features,rows,usedCount:rows.length,links:rows.flatMap(({s,fs})=>fs.map(f=>({f,s})))};
}

const ROW = 34, GAP = 4, GROUP_GAP = 30, TOP = 34, RIB = 11;
export const ROW_HEIGHT = ROW;

interface Box { x: number; y: number; w: number; h: number }
export interface Layout {
  height: number;
  /** Left / width of the three column labels. */
  cols: [Box, Box, Box];
  feat: Box[];
  work: Box[];
  sch: Box[];
  ribbons: string[];
  connectors: string[];
}

/** Every node box and ribbon path for a stage `width` pixels wide (desktop only). */
export function layoutFor(model: Model, width: number): Layout {
  const { features, rows, usedCount, links } = model;
  const LW = Math.min(210, Math.max(150, width * .17));
  const MX = LW + Math.max(140, width * .22), MW = Math.max(220, width * .33), RX = MX + MW + Math.max(40, width * .05);
  const rowY = (i: number) => TOP + i * (ROW + GAP) + (i >= usedCount ? GROUP_GAP : 0);
  const height = rowY(rows.length - 1) + ROW + 8;
  const center = new Map(rows.map(({ s }, i) => [s.id, rowY(i) + ROW / 2]));
  const mid = (s: RibbonPerson) => center.get(s.id) ?? 0;

  // Feature nodes: centred on their books, then pushed apart so none overlap.
  const feat = features.map((f) => {
    const targets = links.filter((l) => l.f === f).map((l) => mid(l.s));
    const h = Math.max(48, targets.length * (RIB + 1) + 18);
    const y = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length - h / 2 : TOP;
    return { x: 0, y, w: LW, h };
  });
  let floor = TOP;
  for (const b of feat) { b.y = Math.max(b.y, floor); floor = b.y + b.h + 16; }
  const over = floor - 16 - height;
  if (over > 0) feat.forEach((b) => { b.y -= over; });

  // Ribbon ends: stacked inside each feature node (by target height) and inside each book (by source height).
  const slot = (centre: number, k: number, n: number) => centre - (n * RIB + (n - 1)) / 2 + k * (RIB + 1) + RIB / 2;
  const ribbons = links.map((l) => {
    const box = feat[features.indexOf(l.f)];
    const mine = links.filter((x) => x.f === l.f).sort((a, b) => mid(a.s) - mid(b.s));
    const into = links.filter((x) => x.s === l.s).sort((a, b) => features.indexOf(a.f) - features.indexOf(b.f));
    const y1 = slot(box.y + box.h / 2, mine.indexOf(l), mine.length).toFixed(1), y2 = slot(mid(l.s), into.indexOf(l), into.length).toFixed(1);
    const xm = (LW + MX) / 2;
    return `M${LW} ${y1}C${xm} ${y1} ${xm} ${y2} ${MX} ${y2}`;
  });
  return {
    height,
    cols: [{ x: 0, y: 0, w: LW - 14, h: 0 }, { x: MX, y: 0, w: MW, h: 0 }, { x: RX, y: 0, w: width - RX, h: 0 }],
    feat,
    work: rows.map((_, i) => ({ x: MX, y: rowY(i), w: MW, h: ROW })),
    sch: rows.map((_, i) => ({ x: RX, y: rowY(i), w: width - RX, h: ROW })),
    ribbons,
    connectors: rows.map(({ s }) => `M${MX + MW - 8} ${mid(s)}H${RX - 6}`),
  };
}

/** What the caption and the highlight follow: a feature, a scholar, or one ribbon (both). */
export interface Focus { f: Feature | null; s: RibbonPerson | null }

export interface Lit { links: Set<Link>; features: Set<string>; scholars: Set<string> }

export function litBy(model: Model, focus: Focus | null): Lit {
  const lit = focus ? model.links.filter((l) => (!focus.f || l.f === focus.f) && (!focus.s || l.s === focus.s)) : [];
  return { links: new Set(lit), features: new Set(lit.map((l) => l.f.id)), scholars: new Set(lit.map((l) => l.s.id)) };
}
