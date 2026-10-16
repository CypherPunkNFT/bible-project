import type { Scholar } from '@/data/teachers/pages-types';
import { authorCredits } from '../site-evidence';
export const AREAS: [string,string][] = [['Theological study','--epistles'],['Manuscripts & text','--prophets'],['Canon','--gospels'],['Historical study','--poetry'],['Archaeology','--history'],['People pages','--history'],['Rulers','--prophets'],['Apologetics','--revelation'],['Atlas','--poetry']];
export type SortKey = 'era'|'wide';
export type NamedPerson = ReturnType<typeof authorCredits>[number];
export function buildHeat(scholars:Scholar[]) {
 const named=authorCredits(scholars);
 const max=new Map(AREAS.map(([area])=>[area,Math.max(1,...named.map(s=>s.mentions[area]??0))]));
 const weight=(s:NamedPerson,area:string)=>(s.mentions[area]??0)/(max.get(area)??1);
 const width=(s:NamedPerson)=>AREAS.filter(([a])=>s.mentions[a]).length;
 return {named,unnamed:scholars.filter(s=>!named.some(n=>n.profile?.id===s.id)),weight,
 sorted:(key:SortKey)=>[...named].sort((a,b)=>key==='era' ? (a.profile?.born??Infinity)-(b.profile?.born??Infinity)||a.name.localeCompare(b.name) : width(b)-width(a)||Object.values(b.mentions).reduce((x,y)=>x+y,0)-Object.values(a.mentions).reduce((x,y)=>x+y,0)||a.name.localeCompare(b.name))};
}
export const areaPhrase=(area:string)=>area==='Topics'?'the Topics, harmony and miracles pages':`the ${area}`;
