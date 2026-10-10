/** Selected objects from the approved collection-card artwork. */
export function ObjectArt({item,x,y,scale=1}:{item:'leaf'|'beads'|'bowl';x:number;y:number;scale?:number}){
 return <g className={'wa-object wa-'+item} transform={`translate(${x} ${y}) scale(${scale})`} opacity=".8">
 {item==='leaf'?<path d="M0 32C-6 18-28 14-24-6C-20-22-7-22 0-9C7-22 20-22 24-6C28 14 6 18 0 32ZM0-9v48m0-25-14-9m14 18-16-8m16-1 14-9m-14 18 16-8"/>:item==='beads'?<><circle r="26" strokeDasharray="1 6.3"/><path d="M-16 22q-4 18-18 20m18-17q-12 3-17-2m-1 19-3 9m3-9 3 9"/></>:<path d="M-33-10q33 11 66 0q-4 31-33 33-29-2-33-33ZM-30-9q30 10 60 0M-18 26h36"/>}
 </g>;
}
export function BowlFlame(){return <g className="wc-bowl-flame"><ObjectArt item="bowl" x={0} y={0}/><g className="wc-bowl-flames" fill="var(--wc-surface,var(--page))"><path d="M0-5C-20-11-18-27-7-45C-7-28 16-25 12-12C9-8 5-5 0-5Z"/><path d="M0-5C-7-11-10-18-2-29C-1-19 8-16 6-11C5-8 2-5 0-5Z"/></g></g>;}
export function FireAltar(){return <g className="wc-firealtar">
 <path className="wc-hearth" d="M-34 12 0 0 34 12 0 24ZM-34 12v13L0 37l34-12V12M0 24v13M-45 25v12L0 53l45-16V25M-45 25l11-4m68 0 11 4M0 37v16M-20 12 0 5 20 12 0 19Z"/>
 <g className="wc-flames" fill="var(--wc-surface,var(--page))">
  <path d="M0 12C-18 10-33-2-25-25C-25-9-13-12-10-4C-18 5-6 10 0 12Z"/>
  <path d="M0 12C15 12 30 1 18-17C8-30 9-42 13-57C-5-41-15-20-9-3C-5 8-3 11 0 12Z"/>
  <path d="M0 12C-11 8-16-3-7-17C-7-5 10-5 10 4C9 10 3 12 0 12Z"/>
 </g>
 </g>;}

const paths:Record<string,string>={
 lotus:'M0 29q-26-28 0-70 26 42 0 70ZM0 29q-43-9-46-47 35 5 46 47Zm0 0q43-9 46-47-35 5-46 47ZM0 29q-41 17-57-15 33-13 57 15Zm0 0q41 17 57-15-33-13-57 15',
 trident:'M0 48V-45M-25-37q-7 37 25 37t25-37M-25-37l-6 11m6-11 7 10M25-37l-7 10m7-10 6 11M0-45l-6 12m6-12 6 12M-5 3h10v9H-5Zm0 14h10M-4 42h8',
 banner:'M0-56v10M-22-38q22-15 44 0ZM-22-38v10h44v-10M-30-25q30 12 60 0v15q-30 12-60 0ZM-30-6q30 12 60 0v15q-30 12-60 0ZM-30 13q30 12 60 0v15q-30 12-60 0ZM-22 34v13m11-10v14m11-13v16m11-17v14m11-17v13M0 54v7',
 vajra:'M-11-5h22v10h-22ZM-11-5q-6-9-10-9v28q4 0 10-9M11-5q6-9 10-9v28q-4 0-10-9M-21-14q-17-10-29 14 12 24 29 14M21-14q17-10 29 14-12 24-29 14M-21-14q-5 9-29 14 24 5 29 14M21-14q5 9 29 14-24 5-29 14M-50 0h100M-21-14q-19-27-29 14 10 41 29 14M21-14q19-27 29 14-10 41-29 14',
};
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


export function CardArtifactGlyph({id}:{id:string}){
 return id==='garland'?<Necklace/>:id==='bell'?<TempleBell/>:id==='bowl'?<BowlFlame/>:id==='firealtar'?<FireAltar/>:<path d={paths[id]}/>;
}
export function CardIslamObject({number}:{number:number}){
 return <g className="wc-islam-object" data-object={number}>{number===45?<><path d="M0-32C-35-30-35 29 0 33C35 29 35-30 0-32" opacity=".4"/>{Array.from({length:33},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/33;return <circle key={i} cx={Math.cos(a)*27} cy={Math.sin(a)*32} r="2.25"/>;})}<path d="M0 35v7M-4 42h8v7h-8ZM-3 49l-4 13m5-13v13m3-13v13m2-13 4 13"/></>:
number===46?<g transform="rotate(-8)"><path d="M-29-43h58v86h-58ZM-24-37h48v74h-48ZM-18 29V-5q0-13 18-24 18 11 18 24v34M-12 26V-4q0-8 12-16 12 8 12 16v30M-18 29h36M-22-28l4-4 4 4-4 4ZM14-28l4-4 4 4-4 4Z"/>{[-24,-16,-8,0,8,16,24].map(x=><path key={x} d={`M${x}-43v-8M${x} 43v8`}/>)}</g>:
number===47?<><path d="M0-65v22M0-43-22-18m22-25 22 25M-27-26q27-8 54 0-27 8-54 0ZM-24-24l10 19q-20 10-17 28 3 21 31 21t31-21q3-18-17-28l10-19M-31 17q31 11 62 0M-28 27q28 9 56 0M-13 44v6h26v-6M-17 50h34M-7 6q7-6 14 0v7H-7Z"/><circle cy="-43" r="3"/></>:
number===51?<><path d="M0-64v21M-5-38v-5h10v5M0-37a37 37 0 1 0 0 74 37 37 0 1 0 0-74ZM-37 0h74M-35 7h70M-12-35q-12 35 0 70m24-70q12 35 0 70"/>{[-18,0,18].map(x=>[-18,19].map(y=><path key={`${x}:${y}`} d={`M${x} ${y-4}l4 4-4 4-4-4Z`}/>))}<circle cy="-38" r="3"/></>:null}</g>;
}
