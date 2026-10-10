import {useId,type CSSProperties} from 'react';
import {FineDetails} from './art';
import {LineDrawing,drawTiming} from './centerpieces';

type Instrument='glassware'|'dna'|'microscope'|'molecule';
type Placement={id:Instrument;x:number;y:number;scale:number;turn?:number};
const instruments:Placement[]=[
 {id:'molecule',x:132,y:150,scale:.76},
 {id:'glassware',x:263,y:151,scale:1.16},
 {id:'dna',x:626,y:150,scale:1.10,turn:-12},
 {id:'microscope',x:779,y:158,scale:1.04},
];

// The complete outer silhouette includes the neck lip and the widening base.
const flaskSilhouette='M-15-61H15v6h-4v38L43 39q5 9-5 9h-76q-10 0-5-9l32-56v-38h-4Z';

/** Each backbone winds twice; the rungs and paired rails remain legible at card size. */
function DNA(){
 const helixX=(y:number)=>26*Math.cos((y+72)*Math.PI/72*2);
 const rail=(sign:number,inner=false)=>Array.from({length:145},(_,i)=>{
  const y=i-72,x=helixX(y)*sign*(inner?.86:1);
  return `${i?'L':'M'}${x.toFixed(2)} ${y}`;
 }).join(' ');
 return <g className="wc-dna-detail">
  <path d={rail(1)}/><path d={rail(-1)}/>
  <g opacity=".40"><path d={rail(1,true)}/><path d={rail(-1,true)}/></g>
  {Array.from({length:21},(_,i)=>{
   const y=-70+i*7,x=Math.abs(helixX(y));
   return x>5?<g className="wc-dna-rung" key={i} opacity={i%2?.58:.9}>
    <path d={`M${-x+2} ${y}H-1.7M1.7 ${y}H${x-2}`}/>
    <circle cx={-x} cy={y} r="1.6"/><circle cx={x} cy={y} r="1.6"/>
   </g>:null;
  })}
 </g>;
}

function Glassware({flask=false}:{flask?:boolean}){
 const clip=useId();
 const shape=flask?'M-11-55v38L-43 39q-5 9 5 9h76q10 0 5-9L11-17v-38Z':'M-27-46h54v84q0 10-10 10h-34q-10 0-10-10Z';
 return <g className={'wc-glassware '+(flask?'wc-flask':'wc-beaker')}>
  <defs><clipPath id={clip}><path d={shape}/></clipPath></defs>
  <g clipPath={`url(#${clip})`}>
   <path className="wc-science-liquid" d={flask?'M-57 24q14-5 28 0t28 0t28 0t28 0v29H-57Z':'M-44 10q14-4 28 0t28 0t28 0v43H-44Z'} fill="currentColor" fillOpacity=".12"/>
   {[0,1,2,3].map(i=><circle key={i} className="wc-science-bubble" cx={-15+i*10} cy={flask?41:37} r={i%2?2.4:1.6} style={{animationDelay:`-${i*1.13}s`}}/>)}
  </g>
  {flask?<>
   <path d="M-11-55v38L-43 39q-5 9 5 9h76q10 0 5-9L11-17v-38M-15-61h30v6h-30ZM-6-50v29L-31 29M16 1h7m-3 12h9m-3 12h10M-28 41h56"/>
  </>:<>
   <path d="M-31-51h65l-7 5v84q0 10-10 10h-34q-10 0-10-10v-84l-4-5ZM-20-41v75M5-29h15M10-16h10M5-3h15M10 10h10M5 23h15M10 36h10"/>
  </>}
 </g>;
}

function GlasswarePair(){
 const mask=useId();
 return <g className="wc-glassware-pair">
  <defs><mask id={mask} className="wc-flask-occlusion" x="-80" y="-90" width="165" height="175" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" style={{maskType:'luminance'}}>
   <rect x="-80" y="-90" width="165" height="175" fill="white" stroke="none"/>
   <path d={flaskSilhouette} transform="translate(16 8)" fill="black" stroke="black" strokeWidth="2.5"/>
  </mask></defs>
  <g className="wc-rear-glassware" mask={`url(#${mask})`}><g transform="translate(-22 -5) scale(.74)"><Glassware/></g></g>
  <g className="wc-front-glassware" transform="translate(16 8)"><Glassware flask/></g>
 </g>;
}

function InstrumentGlyph({id}:{id:Instrument}){
 if(id==='glassware')return <GlasswarePair/>;
 if(id==='dna')return <DNA/>;
 if(id==='microscope')return <g><path d="m-18-53 12-8 29 42-12 8ZM-18-53l-6-9 12-8 6 9M10-10 4-2l9 13 11-8-6-10M23-26q37 5 31 38-5 28-37 29M27-13q22 7 16 27-4 12-20 15M-35 17h63v7h-63ZM-24 24v6h36v-6M-11 30v14M-34 44h66l10 10h-86ZM3 42h14M-28 8l6 9m41-3 6 3"/><circle cx="27" cy="-9" r="6"/><circle cx="27" cy="-9" r="2"/></g>;
 return <g className="wc-refined-molecule"><path d="M0-27 23.4-13.5v27L0 27-23.4 13.5v-27ZM0-27v-17m23.4 30.5 14.8-8.5M23.4 13.5 38.2 22M0 27v17m-23.4-30.5-14.8 8.5m14.8-35.5-14.8-8.5"/>
  <path d="M5-18.8l11.5 6.6M16.5 7.7 5 14.3M-16.5 7.5v-15" opacity=".7"/>
  {[[0,-49],[42.4,-24.5],[42.4,24.5],[0,49],[-42.4,24.5],[-42.4,-24.5]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="5"/><circle cx={x} cy={y} r="1.2" fill="currentColor" stroke="none" opacity=".4"/></g>)}
 </g>;
}

export function ScienceArtwork(){
 return <svg className="wv-art wc-wide-art wc-wide-secular" viewBox="0 0 900 300" fill="none" aria-hidden="true" focusable="false" data-world="secular">
 <circle className="wc-card-orbit" cx="450" cy="150" r="124" strokeDasharray="1 8" opacity=".69"/>
 <circle cx="450" cy="150" r="112" opacity=".12"/>
 <g className="wc-card-centerpiece wc-atom" transform="translate(450 150)">
  <LineDrawing>
   {[0,60,120].map((angle,i)=><ellipse key={angle} rx="102" ry="38" transform={`rotate(${angle})`} pathLength={1} className="wc-draw-stroke" style={drawTiming(i*.15)}/>)}
   <circle r="9" fill="currentColor" fillOpacity=".13" pathLength={1} className="wc-draw-stroke" style={drawTiming(.3)}/>
  </LineDrawing>
  {[0,60,120].map((angle,i)=><g className="wc-electron-orbit" data-orbit={angle} transform={`rotate(${angle})`} key={angle}>
   <circle className="wc-electron" r="3.6" fill="currentColor" strokeWidth=".8" style={{'--wc-orbit-start':`${[0,50,0][i]}%`} as CSSProperties}/>
  </g>)}
 </g>
 {instruments.map(item=><g key={item.id} className="wc-science-object" data-instrument={item.id} transform={`translate(${item.x} ${item.y}) rotate(${item.turn??0}) scale(${item.scale})`}><InstrumentGlyph id={item.id}/></g>)}
 <FineDetails world="secular"/>
 <g opacity=".28"><path d="M219 56l5 5-5 5-5-5ZM702 256l4 5-4 5-4-5ZM87 206v8m-4-4h8"/><circle cx="718" cy="64" r="3"/></g>
 </svg>;}
