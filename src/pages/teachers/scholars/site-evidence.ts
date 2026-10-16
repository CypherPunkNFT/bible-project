import aliasData from '../../../../content/teachers/source-profile-aliases.json';
import usage from '../../../../content/teachers/feature-usage.json';
import type { Scholar, ScholarsData } from '@/data/teachers/pages-types';
export const featureEvidence = usage.features;
export const areaFor: Record<string,string> = {
 letters:'Theological study',topics:'Theological study',harmony:'Theological study',miracles:'Theological study',parables:'Theological study','cross-references':'Theological study','bible-texts':'Theological study',
 apologetics:'Apologetics',debates:'Apologetics',worldviews:'Apologetics','apologetics-paths':'Apologetics','apologetics-practice':'Apologetics',
 'people-apostles':'People pages','people-prophets':'People pages','people-rulers':'Rulers',
 witnesses:'Manuscripts & text','manuscript-passages':'Manuscripts & text','dead-sea-scrolls':'Manuscripts & text','printed-bible':'Manuscripts & text',
 canon:'Canon',empires:'Historical study',world:'Historical study',discoveries:'Archaeology',cities:'Archaeology',atlas:'Atlas','atlas-history':'Atlas',
};
// Explicit attribution aliases; joint author/translator credits remain separate in the full credit grid.
const aliases: Record<string,string[]> = aliasData.aliases;
export const nameKey = (name:string) => name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
export function profileFor(author:string, scholars:Scholar[]) {
  return scholars.find(s => [s.name,...(aliases[s.id] ?? [])].some(n=>nameKey(n)===nameKey(author)));
}
export function sourcesFor(s:Scholar) { return featureEvidence.flatMap(f=>f.sources.filter(r=>profileFor(r.author,[s])).map(r=>({...r,feature:f.id,area:areaFor[f.id]}))); }
const evidenceCache=new WeakMap<ScholarsData,ScholarsData>();
export function evidencedProfiles(data:ScholarsData):ScholarsData {
  const cached=evidenceCache.get(data);if(cached)return cached;
  const result:ScholarsData= {...data,scholars:data.scholars.map(s=>{
    const records=sourcesFor(s), used=records.filter(r=>r.kind!=='bibliography');
    const mentions=Object.fromEntries(Object.values(areaFor).map(area=>[area,new Set(records.filter(r=>r.area===area).flatMap(r=>r.uses.map(u=>u.evidence))).size]));
    const areas=[...new Set(used.map(r=>featureEvidence.find(f=>f.id===r.feature)!.label))];
    return {...s,mentions,site:used.length ? {status:'in-use' as const,note:`Verified sources: ${areas.join(', ')}.`} : s.site ? {status:'held' as const,note:'Recorded in the library; no feature use verified in the current source index.'} : null};
  })};
  evidenceCache.set(data,result);return result;
}
export function authorCredits(scholars:Scholar[]) {
  const names=[...new Set(featureEvidence.flatMap(f=>f.sources.map(s=>s.author)))];
  return names.map((name,i)=>{
    const records=featureEvidence.flatMap(f=>f.sources.filter(s=>s.author===name).map(s=>({...s,area:areaFor[f.id]})));
    const profile=profileFor(name,scholars);
    return {id:`credit-${i}`,name,short:name,profile,records,mentions:Object.fromEntries(Object.values(areaFor).map(area=>[area,new Set(records.filter(r=>r.area===area).flatMap(r=>r.uses.map(u=>u.evidence))).size]))};
  });
}

const activeCredits = new Set(featureEvidence.flatMap(f=>f.sources.filter(s=>s.kind!=="bibliography").map(s=>nameKey(s.author))));
export function usedEntry(p:{name:string;aliases:string[];scholar?:Scholar}) {
  return p.scholar?.site?.status === 'in-use' || [p.name,...p.aliases].some(n=>activeCredits.has(nameKey(n)));
}

/** Source-only citations do not establish a held reading representation. */
export function heldEntry(p:{records:number;population?:{counts:{publicRecords:number;localCopies:number;intakeRecords:number}}}) {
  return p.population ? p.population.counts.publicRecords+p.population.counts.localCopies+p.population.counts.intakeRecords>0 : p.records>0;
}
