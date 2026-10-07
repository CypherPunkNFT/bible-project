import type { familyBranch } from "./genealogy";
type Branch=ReturnType<typeof familyBranch>;

export const treeMarkerPairs=[
  ["hezron-gen-46-12","daughter-of-machir-1ch-2-21"],
  ["aaron-exo-4-14","elisheba-exo-6-23"],
];
export const usesTreeMarkers=(a:string,b:string)=>treeMarkerPairs.some(pair=>pair.includes(a) && pair.includes(b));

/** Presentation-only alignment of the two requested local co-parent families. */
export function alignTreeFamilies(input:Branch):Branch {
  const branch={...input,positions:input.positions.map(n=>({...n})),clusters:input.clusters.map(c=>({...c,members:[...c.members]}))};
  const nodes=new Map(branch.positions.map(n=>[n.person.id,n]));
  const owner=new Map(branch.clusters.map(c=>[c.id,c.parents.map(id=>nodes.get(id)).filter(n=>n && n.generation<c.generation).sort((a,b)=>b!.generation-a!.generation || Number(b!.person.s==="M")-Number(a!.person.s==="M"))[0]?.person.id]));
  const overlaps=()=>branch.positions.some((a,i)=>branch.positions.slice(0,i).some(b=>Math.hypot(a.x-b.x,a.y-b.y)<116));
  const reflectToward=(id:string,partnerId:string)=>{
    const node=nodes.get(id),partner=nodes.get(partnerId),cluster=branch.clusters.find(c=>c.members.includes(id));
    if(!node || !partner || !cluster) return;
    const ids=new Set(cluster.members),boxes=new Set([cluster.id]);
    let changed=true;
    while(changed) {changed=false;for(const c of branch.clusters) if(!boxes.has(c.id) && ids.has(owner.get(c.id) ?? "")) {boxes.add(c.id);c.members.forEach(member=>ids.add(member));changed=true;}}
    if(ids.has(partnerId)) return;
    const affected=branch.positions.filter(n=>ids.has(n.person.id));
    const axis=Math.min(...affected.map(n=>n.x+76))+Math.max(...affected.map(n=>n.x+76));
    if(Math.abs(axis-node.x-152-partner.x)>=Math.abs(node.x-partner.x)) return;
    affected.forEach(n=>{n.x=axis-n.x-152;});
    if(overlaps()) {affected.forEach(n=>{n.x=axis-n.x-152;});return;}
    branch.clusters.filter(c=>boxes.has(c.id)).forEach(c=>{c.x=axis-c.x-c.width;});
  };
  reflectToward("esau-gen-25-25","mahalath-gen-28-9");
  reflectToward("mahalath-gen-28-9","esau-gen-25-25");
  const mahalath=nodes.get("mahalath-gen-28-9"),esau=nodes.get("esau-gen-25-25");
  const ishmaelChildren=branch.clusters.find(c=>c.members.includes("mahalath-gen-28-9"));
  if(mahalath && esau && ishmaelChildren) {
    const nearest=ishmaelChildren.members.map(id=>nodes.get(id)!).sort((a,b)=>Math.abs(a.x-esau.x)-Math.abs(b.x-esau.x))[0];
    if(![...owner.values()].some(id=>id===mahalath.person.id || id===nearest.person.id)) [mahalath.x,nearest.x]=[nearest.x,mahalath.x];
  }
  reflectToward("amram-exo-6-18","jochebed-exo-6-20");
  const mother=nodes.get("jochebed-exo-6-20"),father=nodes.get("amram-exo-6-18");
  if(mother && father && ![...owner.values()].includes(mother.person.id)) {
    const previous=mother.x,cluster=branch.clusters.find(c=>c.members.includes(mother.person.id));
    const target=father.x+132;
    if(cluster && target>=cluster.x-12 && target<=cluster.x+cluster.width-140) {
      mother.x=target;if(overlaps()) mother.x=previous;
    }
  }
  return branch;
}
