import aliasData from '../../../../content/teachers/source-profile-aliases.json';
import usage from '../../../../content/teachers/feature-usage.json';
import type { Scholar, ScholarsData } from '@/data/teachers/pages-types';
export const featureEvidence = usage.features;
export const areaFor: Record<string,string> = { letters:'Letters study', apologetics:'Apologetics', topics:'Topics', harmony:'Topics', miracles:'Topics', 'people-apostles':'People pages', 'people-prophets':'People pages', 'people-rulers':'Rulers' };
// Explicit attribution aliases; joint author/translator credits remain separate in the full credit grid.
const aliases: Record<string,string[]> = aliasData.aliases;
export const nameKey = (name:string) => name.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
export function profileFor(author:string, scholars:Scholar[]) {
  return scholars.find(s => [s.name,...(aliases[s.id] ?? [])].some(n=>nameKey(n)===nameKey(author)));
}
export function sourcesFor(s:Scholar) { return featureEvidence.flatMap(f=>f.sources.filter(r=>profileFor(r.author,[s])).map(r=>({...r,feature:f.id,area:areaFor[f.id]}))); }
export function evidencedProfiles(data:ScholarsData):ScholarsData {
  return {...data,scholars:data.scholars.map(s=>{
    const records=sourcesFor(s), used=records.filter(r=>r.kind!=='bibliography');
    const mentions=Object.fromEntries(Object.values(areaFor).map(area=>[area,new Set(records.filter(r=>r.area===area).flatMap(r=>r.uses.map(u=>u.evidence))).size]));
    const areas=[...new Set(used.map(r=>featureEvidence.find(f=>f.id===r.feature)!.label))];
    return {...s,mentions,site:used.length ? {status:'in-use' as const,note:`Verified sources: ${areas.join(', ')}.`} : s.site ? {status:'held' as const,note:'Recorded in the library; no feature use verified in the current source index.'} : null};
  })};
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
