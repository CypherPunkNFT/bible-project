import type { ScholarsData } from '@/data/teachers/pages-types';
import type { LibraryPerson } from '../catalogue/library';
export type Mode = 'era' | 'az';
export interface Group { key:string; label:string; people:LibraryPerson[] }
export function buildGroups(data:ScholarsData, people:LibraryPerson[]):Record<Mode,Group[]> {
 const date=(p:LibraryPerson)=>p.facts?.dates.born??p.facts?.dates.floruit??p.scholar?.born??Infinity;
 const era=Object.entries({...data.eras,unknown:'Era not documented'}).map(([key,label])=>({key,label,people:people.filter(p=>(p.facts?.dates.era??p.scholar?.era??'unknown')===key).sort((a,b)=>date(a)-date(b)||a.name.localeCompare(b.name))})).filter(g=>g.people.length);
 const az:Group[]=[];
 for(const p of [...people].sort((a,b)=>a.name.localeCompare(b.name))) {
  const key=p.name[0].toLocaleUpperCase();let group=az.find(g=>g.key===key);
  if(!group){group={key,label:key,people:[]};az.push(group);}group.people.push(p);
 }
 return {era,az};
}
export const USE_LABEL = { 'in-use':'Verified feature use', held:'Held in the library; use unverified' } as const;
