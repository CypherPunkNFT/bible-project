import {ArtifactGlyph} from '../worldview-compositions/glyphs';
import {IslamObjectGlyph} from '../worldview-compositions/islam-objects';

const flowers=[[-47,-25],[-44,-8],[-38,9],[-28,25],[-15,38],[0,45],[15,38],[28,25],[38,9],[44,-8],[47,-25]];
// Interpolate the cord through the exact points used for the flower centers.
const cord=flowers.slice(1).reduce((path,point,i)=>{
 const previous=flowers[i],before=flowers[Math.max(0,i-1)],after=flowers[Math.min(flowers.length-1,i+2)];
 const control1=previous.map((v,j)=>v+(point[j]-before[j])/6);
 const control2=point.map((v,j)=>v-(after[j]-previous[j])/6);
 return `${path} C${control1.join(' ')} ${control2.join(' ')} ${point.join(' ')}`;
},`M${flowers[0].join(' ')}`);

function Necklace(){return <g className="wc-refined-necklace">
 <path className="wc-necklace-cord" d={`M-48-43L-47-25 ${cord.slice(cord.indexOf(' C'))} L48-43`} strokeWidth=".9" opacity=".7"/>
 {flowers.map(([x,y],i)=><g className="wc-necklace-flower" key={i} transform={`translate(${x} ${y})`}>
  <path d="M0-7q7-4 5 5 8 2 2 7-2 8-7 2-7 4-5-5-8-2-2-7 2-8 7-2Z"/>
  <circle r="2"/>
 </g>)}
 </g>;}

function TempleBell(){return <g className="wc-refined-bell" strokeWidth=".85">
 <circle cy="-33" r="4"/><path d="M-2-29v7m4-7v7M-6-22h12v5H-6Z"/>
 <path d="M-6-17C-15-16-17-6-17 3c-1 10-4 17-9 20H26C21 20 18 13 17 3c0-9-2-19-11-20Z"/>
 <path d="M-16-1Q0-7 16-1M-21 16Q0 21 21 16M-27 23Q0 29 27 23v4Q0 34-27 27Z"/>
 <path d="M0 30v5"/><circle cy="37" r="3"/>
 <path d="M-10-11c-4 9-2 20-11 31M0-1q-7 5 0 11 7-6 0-11Z" opacity=".56" strokeWidth=".55"/>
 </g>;}

/** A pear-shaped metal ewer with a narrow neck, curved spout and open handle. */
function MetalEwer(){return <g className="wc-refined-ewer">
 <path d="M12-21C43-41 61-9 33 17M16-13C36-27 47-11 31 7"/>
 <path d="M-10-19C-23-14-32 4-30 24c2 16 13 22 30 22s28-6 30-22c2-20-7-38-20-43M-10-19v-19h20v19"/>
 <path d="M-27 4c-12-10-17-22-18-36h-9c0 26 8 45 24 51M-56-33h13M-14-38h28v-5h-28ZM-14-44Q0-60 14-44M0-52v-7"/>
 <path d="M-13 45v7h26v-7M-18 52h36v4h-36ZM-26 28q26 9 52 0M-20-3q20 6 40 0"/>
 <path d="M0 5q-13 10 0 19 13-9 0-19ZM-5 10q5 4 10 0M-20 7q-7 14 1 22" opacity=".6" strokeWidth="1"/>
 </g>;}

export function CardArtifactGlyph({id}:{id:string}){
 return id==='garland'?<Necklace/>:id==='bell'?<TempleBell/>:<ArtifactGlyph id={id}/>;
}
export function CardIslamObject({number}:{number:number}){
 return number===50?<MetalEwer/>:<IslamObjectGlyph number={number}/>;
}
