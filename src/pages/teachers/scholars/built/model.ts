// "Built on their work": who feeds which part of the site, and where every node and ribbon sits for a stage width.
// Live features are read from each in-use scholar's own site note (no hand-made mapping); books held in the library
// gather under one dashed "In the library" group.
import { featureEvidence, profileFor } from "../site-evidence";
import type { Scholar, Field } from "@/data/teachers/pages-types";

export interface Feature { id: string; name: string; tone: string; sub: string; planned: boolean; test: RegExp | null; total: number; matched: number }
export interface RibbonPerson {
 id:string; name:string; short:string; field:Field; works:[string,string|number][];
 born?:number; died?:number|null; circa?:boolean; faith?:Scholar['faith'];
 site?:Scholar['site']; profileId?:string; sourceUrl:string; creditLabel?:string;
 kind: 'citation' | 'data' | 'bibliography'; uses: {page:string;address:string;locator:string;evidence:string;consultation?:string}[];
}
export interface Row { s: RibbonPerson; fs: Feature[] }
export interface Link { f: Feature; s: RibbonPerson }
export interface Model { features: Feature[]; rows: Row[]; usedCount: number; links: Link[]; totalCount: number; matchedCount: number }
export type SourceArea = 'all' | 'study' | 'texts' | 'canon' | 'history' | 'archaeology' | 'people' | 'apologetics' | 'atlas';
export const SOURCE_AREAS: {id: SourceArea; label: string; features: string[] | null}[] = [
 {id:'all',label:'All areas',features:null},
 {id:'study',label:'Theological study',features:['topics','harmony','miracles','letters','parables','cross-references','bible-texts']},
 {id:'texts',label:'Manuscripts & text',features:['witnesses','manuscript-passages','dead-sea-scrolls','printed-bible']},
 {id:'canon',label:'Canon',features:['canon']},
 {id:'history',label:'Historical study',features:['empires','world']},
 {id:'archaeology',label:'Archaeology',features:['discoveries','cities']},
 {id:'people',label:'People & history',features:['people-rulers','people-apostles','people-prophets']},
 {id:'apologetics',label:'Apologetics',features:['apologetics','debates','worldviews','apologetics-paths','apologetics-practice']},
 {id:'atlas',label:'Atlas',features:['atlas','atlas-history']},
];

export function modelForArea(model: Model, area: SourceArea): Model {
 const ids=SOURCE_AREAS.find(tab=>tab.id===area)?.features;
 if(!ids)return model;
 const features=model.features.filter(f=>ids.includes(f.id));
 const rows=model.rows.filter(row=>row.fs.some(f=>ids.includes(f.id)));
 return {features,rows,usedCount:rows.length,links:model.links.filter(link=>ids.includes(link.f.id)),totalCount:features.reduce((n,f)=>n+f.total,0),matchedCount:features.reduce((n,f)=>n+f.matched,0)};
}

type RawSource = (typeof featureEvidence)[number]['sources'][number];
type Source = Pick<RawSource,'id'|'author'|'title'|'year'|'url'|'kind'> & {uses:{page:string;address:string;locator:string;evidence:string;citationId:string;consultation?:string}[]};
const sourceKey = (value: string) => value.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** The graph labels the lead contributor; the source records retain full credits. */
export function primaryAuthor(credit: string): string {
 return credit.split(/\s*[,;(·]|\s+(?:&|and)\s+/)[0].trim() || credit;
}

/** Keep this overview small; the source index retains the complete bibliography. */
export function topSources(sources: Source[], limit = 8): Source[] {
 const groups: Source[] = [];
 for (const source of sources) {
  const existing = groups.find(r => sourceKey(r.author) === sourceKey(source.author)
   && sourceKey(r.title) === sourceKey(source.title) && r.year === source.year && r.url === source.url);
  if (existing) {
   const seen = new Set(existing.uses.map(u => JSON.stringify(u)));
   existing.uses.push(...source.uses.filter(u => !seen.has(JSON.stringify(u))));
   if (existing.kind === 'bibliography' && source.kind !== 'bibliography') existing.kind = source.kind;
  } else groups.push({...source, uses: [...source.uses]});
 }
 const usageCount = (r: Source) => new Set(r.uses.map(u => `${u.evidence}|${u.locator}`)).size;
 return groups.sort((a,b) => Number(a.kind === 'bibliography') - Number(b.kind === 'bibliography')
  || usageCount(b) - usageCount(a)).slice(0,limit);
}

export function buildModel(scholars: Scholar[], limit = 8, query = ''): Model {
 const overview=featureEvidence;
 const tones: Record<string,string>={topics:'--poetry',harmony:'--gospels',miracles:'--acts',letters:'--epistles','people-rulers':'--prophets','people-apostles':'--history','people-prophets':'--history',apologetics:'--revelation',witnesses:'--prophets','manuscript-passages':'--prophets','dead-sea-scrolls':'--poetry',canon:'--gospels','printed-bible':'--epistles',discoveries:'--history',cities:'--history',empires:'--prophets',world:'--poetry',parables:'--gospels','cross-references':'--epistles',atlas:'--poetry'};
 const words=query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
 const records=overview.map(f=>{const all=topSources(f.sources,Infinity);const matches=all.filter(s=>words.every(word=>[f.label,s.author,s.title,s.year,...s.uses.flatMap(u=>[u.page,u.locator])].join(' ').toLocaleLowerCase().includes(word)));return{all,matches};});
 const features:Feature[]=overview.map((f,i)=>({id:f.id,name:f.label,tone:tones[f.id]??(f.id==='atlas-history'?'--poetry':f.id==='bible-texts'?'--epistles':'--revelation'),sub:'Documented source records',planned:false,test:null,total:records[i].all.length,matched:records[i].matches.length}));
 const rows:Row[]=overview.flatMap((f,i)=>records[i].matches.slice(0,limit).map(r=>{
  const author=primaryAuthor(r.author);
  const profile=profileFor(author,scholars);
  const s:RibbonPerson={creditLabel:r.author,id:`${f.id}:${r.id}`,name:author,short:author,field:profile?.field??'reference',
   works:[[r.title,r.year]],born:profile?.born,died:profile?.died,faith:profile?.faith,profileId:profile?.id,sourceUrl:r.url,kind:r.kind as RibbonPerson['kind'],uses:r.uses,
   site:{status:r.kind==='bibliography'?'held':'in-use',note:`${r.kind==='data'?'Feature input':r.kind==='citation'?'Page citation':'Bibliography only'}: ${r.uses.map(u=>u.page).filter((v,i,a)=>a.indexOf(v)===i).join('; ')}`}};
  return {s,fs:[features[i]]};
 }));
 return {features:features.filter(f=>!words.length||f.matched>0),rows,usedCount:rows.length,links:rows.flatMap(({s,fs})=>fs.map(f=>({f,s}))),totalCount:records.reduce((n,r)=>n+r.all.length,0),matchedCount:records.reduce((n,r)=>n+r.matches.length,0)};
}

const ROW = 28, GAP = 3, GROUP_GAP = 24, TOP = 28, RIB = 9;
export const ROW_HEIGHT = ROW;

interface Box { x: number; y: number; w: number; h: number }
export interface Layout {
  height: number;
  openingHeight: number;
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
  const height = Math.max(100,rowY(rows.length - 1) + ROW + 8);
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
  // Settle crowded bottom groups backwards; shifting every label would lift the
  // first feature over the column headings as the index grows.
  let ceiling=height-8;
  for(let i=feat.length-1;i>=0;i--){feat[i].y=Math.min(feat[i].y,ceiling-feat[i].h);ceiling=feat[i].y-16;}

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
    openingHeight: rowY(Math.max(0, rows.map(row=>row.fs[0]?.id).lastIndexOf('people-rulers'))) + ROW + 8,
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
