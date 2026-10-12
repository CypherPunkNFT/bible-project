import type { Sky, SkyData, SkyNode, SkyField } from "./layout";
import type { Field } from "@/data/teachers/pages-types";
/** Earlier centuries have a separate compressed scale; modern years retain proportional spacing. */
export const timelineX=(year:number)=>year<1500?60+Math.max(0,year)/1500*340:440+(year-1500)/526*1040;
export function buildTimeline(data:SkyData):Sky {
  const known=data.scholars.filter(s=>s.born!==undefined).sort((a,b)=>a.born!-b.born!);
  const unknown=data.scholars.filter(s=>s.born===undefined),nodes:SkyNode[]=[];
  for(const s of known){
    const x=timelineX(s.born!),near=nodes.filter(n=>Math.abs(n.x-x)<40),candidates=[0];
    for(const n of near){const h=Math.sqrt(40*40-(n.x-x)**2);candidates.push(n.y+h,n.y-h);}
    candidates.sort((a,b)=>Math.abs(a)-Math.abs(b)||b-a);
    const y=candidates.find(y=>near.every(n=>Math.hypot(n.x-x,n.y-y)>=39.99))??0;
    nodes.push({s,x,y,hx:x,hy:y});
  }
  unknown.forEach((s,i)=>{const x=1590+(i%4)*40,y=(Math.floor(i/4)-(Math.ceil(unknown.length/4)-1)/2)*40;nodes.push({s,x,y,hx:x,hy:y});});
  const half=Math.max(130,...nodes.map(n=>Math.abs(n.y)))+45,h=half*2;
  nodes.forEach(n=>{n.y+=half;n.hy=n.y;});
  const fields=(Object.keys(data.fields) as Field[]).map(field=>{
    const own=nodes.filter(n=>n.s.field===field),mx=own.reduce((s,n)=>s+n.x,0)/own.length,my=own.reduce((s,n)=>s+n.y,0)/own.length;
    return {field,own,mx,my,bottom:Math.max(...own.map(n=>n.y)),r:150} as SkyField;
  });
  return {name:"band",w:1760,h,size:36,nodes,fields};
}
