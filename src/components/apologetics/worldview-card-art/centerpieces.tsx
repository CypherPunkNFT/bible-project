import type {CSSProperties,ReactNode} from 'react';
export type World='islam'|'buddhism'|'hinduism';

/** Same complete base + drawing overlay treatment as the Teachers station. */
export function LineDrawing({children}:{children:ReactNode}){return <>
 <g className="wc-center-base">{children}</g>
 <g className="wc-center-live">{children}</g>
 </>;}

export const drawTiming=(seconds:number)=>({'--wc-draw-delay':`${seconds}s`} as CSSProperties);

const temple='M220 244c5-61 20-116 50-147 30 31 45 86 50 147ZM233 244c4-63 17-109 37-147 20 38 33 84 37 147M247 120h46m-50 16h54m-62 18h70m-78 20h86m-94 22h102m-109 24h116M253 97h34v-8h-34ZM250 84q20-14 40 0ZM263 72v-10h14v10m-7-10V51M202 244h136v66H202ZM251 310v-37q0-24 19-24t19 24v37M245 310v-40q0-27 25-27t25 27v40M210 252h24v47h-24ZM306 252h24v47h-24ZM174 310v-47h28m136 0h28v47M174 263l14-15 14 15m136 0 14-15 14 15M170 310h200m-212 9h224m-236 9h248';

// Each ground-level wall and arch ends at y=284, the upper floor line.
const mosque=[
 'M149 284h242m-222 9h204',
 'M193 284V185h154v99',
 'M207 177c-10-27 20-57 63-78 43 21 73 51 63 78Z',
 'M270 99V87M218 177q-8-30 52-78 60 48 52 78',
 'M248 284v-44q0-24 22-36 22 12 22 36v44',
 'M253 284v-44q0-18 17-29 17 11 17 29v44',
 'M208 231v-18q0-11 10-17 10 6 10 17v18Z',
 'M312 231v-18q0-11 10-17 10 6 10 17v18Z',
 'M158 284V143h18v141',
 'M155 143h24v-8h-24Z',
 'M155 130q0-15 12-25 12 10 12 25Zm12-25V94',
 'M155 171h24m-24 56h24',
 'M364 284V143h18v141',
 'M361 143h24v-8h-24Z',
 'M361 130q0-15 12-25 12 10 12 25Zm12-25V94',
 'M361 171h24m-24 56h24',
];

function Wheel(){return <g className="wa-wheel" transform="translate(270 182)">
 {[96,78,20].map((radius,i)=><circle key={radius} r={radius} pathLength={1} className="wc-draw-stroke" style={drawTiming(i*.08)}/>)}
 {Array.from({length:8},(_,i)=><g className="wa-spoke" key={i} transform={`rotate(${i*45})`}>
  <path d="M0-20V-96" pathLength={1} className="wc-draw-stroke" style={drawTiming(.16+i*.065)}/>
  <path d="m-7-70 7-7 7 7" pathLength={1} className="wc-draw-stroke" style={drawTiming(.24+i*.065)}/>
  <circle cy="-96" r="3" pathLength={1} className="wc-draw-stroke" style={drawTiming(.30+i*.065)}/>
 </g>)}
 </g>;}

export function CardCenterpiece({world}:{world:World}){
 const paths=world==='islam'?mosque:temple.split(/(?=M)/);
 return <LineDrawing>{world==='buddhism'?<Wheel/>:<g className={world==='islam'?'wa-mosque':'wa-temple'}>
  {paths.map((d,i)=><path key={i} d={d} pathLength={1} className="wc-draw-stroke" style={drawTiming(i*.045)}/>)}
 </g>}</LineDrawing>;
}
