import {layoutLandingArc} from '../../preachers/landing/arc';
import {THIS_YEAR} from '../../shared/people';
export const FOCUS_PERIODS=[{start:0,end:1399},{start:1400,end:1599},{start:1600,end:1799},{start:1800,end:THIS_YEAR}];
export interface FocusPerson {id:string;name:string;born:number}
export const focusName=(name:string)=>name.replace(/\s*\[\s*(?:c\.?\s*)?\d{1,4}\s*[-–—]\s*\d{0,4}\s*\]\s*$/i,'');
export function focusLayout(input:FocusPerson[],viewportWidth:number){
 const people=[...input].sort((a,b)=>a.born-b.born||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
 const groups=FOCUS_PERIODS.map(({start,end})=>people.filter(p=>p.born>=start&&p.born<=end));
 const seed=groups.flatMap(group=>group.length<=8?group:Array.from({length:8},(_,i)=>group[Math.round(i*(group.length-1)/7)]));
 const width=Math.max(880,viewportWidth),height=418;
 // Empty searches still retain the timeline geometry, never a synthetic mark.
 const reference=layoutLandingArc(seed.length?seed:[{id:'timeline-origin',born:0}],width);
 const radius=reference.r*.85,distance=radius*2+4,dy=(height-reference.height)/2;
 const start=reference.centuries[0].x,todayX=width-24;
 const compressed=start+(400/2026)*(reference.today.x-start)*.88;
 const sx=(year:number)=>year<=1400?start+year/1400*(compressed-start):compressed+(year-1400)/(THIS_YEAR-1400)*(todayX-compressed);
 const path=reference.arcPath.replace(/([ML])([\d.]+) ([\d.]+)/g,(_,c,x,y)=>c+x+' '+(Number(y)+dy));
 const base=Number(path.match(/^M[\d.]+ ([\d.]+)/)![1]),arcY=(x:number)=>base-22*Math.sin(Math.PI*x/width);
 const priority=new Set(seed.map(p=>p.id));
 const placed:{id:string;x:number;y:number}[]=[];
 for(const p of [...seed,...people.filter(p=>!priority.has(p.id))]){
  const x=sx(p.born),near=placed.filter(p=>Math.abs(p.x-x)<distance),candidates=[arcY(x)];
  for(const q of near){const h=Math.sqrt(distance**2-(q.x-x)**2);candidates.push(q.y-h,q.y+h);}
  candidates.sort((a,b)=>Math.abs(a-arcY(x))-Math.abs(b-arcY(x))||a-b);
  const y=candidates.find(y=>y-radius>=64&&y+radius<=height-54&&near.every(q=>Math.hypot(q.x-x,q.y-y)>=distance-.01));
  if(y!==undefined)placed.push({id:p.id,x,y});
 }
 const positions=new Map(placed.map(p=>[p.id,p]));
 return {width,height,radius,path,positions,today:{x:todayX,y:arcY(todayX)},year2000:sx(2000),groups:groups.map((people,i)=>({...FOCUS_PERIODS[i],x:sx(FOCUS_PERIODS[i].start),right:sx(i===groups.length-1?THIS_YEAR:FOCUS_PERIODS[i].end+1),people,hidden:people.filter(p=>!positions.has(p.id)).length}))};
}
