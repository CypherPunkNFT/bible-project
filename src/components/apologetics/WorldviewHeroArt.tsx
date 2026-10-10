import {useId} from 'react';
// Decorative reading, conversation and geometry motifs, not doctrinal diagrams.
export function WorldviewHeroArt({id,card=false}:{id:string;card?:boolean}){
 const liquidClip=useId();
 return <svg className={(card?'wv-art wv-art-':'wv-hero-illustration wv-hero-illustration-')+id} viewBox="0 0 540 400" fill="none" aria-hidden="true" focusable="false">
  <ellipse cx="270" cy="350" rx="155" ry="13" opacity=".16"/>
  <circle className="wv-orbit-dots" cx="270" cy="190" r="132" strokeDasharray="1 8" opacity=".3"/>
  <circle cx="270" cy="190" r="115" opacity=".12"/>
  {id==='secular'?<>
   <g transform="translate(270 184)"><ellipse rx="94" ry="34"/><ellipse rx="94" ry="34" transform="rotate(60)"/><ellipse rx="94" ry="34" transform="rotate(120)"/><circle r="9"/><circle cx="78" cy="19" r="3"/></g>
   <g transform="rotate(-12 103 139)" opacity=".7"><path d="M83 109h40v51H83ZM90 119h20m-20 10h20m-20 10h12m-22 21v7h40m-4-58v-7H77v52h6"/></g>
   <g className="wv-dna" opacity=".7"><path d="M402 80C402 99 436 99 436 116S402 133 402 152M436 80C436 99 402 99 402 116S436 133 436 152"/>{[[402,436,80],[406,432,88],[418,420,98],[431,407,107],[436,402,116],[431,407,125],[418,420,134],[406,432,143],[402,436,152]].map(([a,b,y])=><path key={y} d={`M${a} ${y}H${b}`}/>)}</g>
   <g opacity=".65"><circle cx="419" cy="272" r="22"/><circle cx="419" cy="272" r="16" opacity=".4"/><path d="m435 288 20 20m-24-17 20 20"/></g>
   <path d="M176 326v-35q47-16 94 0 47-16 94 0v35q-47-16-94 0-47-16-94 0ZM270 291v35m-80-19q32-9 66 0m28 0q34-9 66 0" opacity=".65"/>
   <g className="wv-beaker" opacity=".75"><defs><clipPath id={liquidClip}><rect x="78" y="246" width="38" height="69" rx="7"/></clipPath></defs><g clipPath={`url(#${liquidClip})`}><path className="wv-liquid" d="M70 286q14-5 28 0t28 0v34H70Z" fill="currentColor" fillOpacity=".1"/>{[0,1,2].map(i=><circle key={i} className="wv-bubble" cx={88+i*9} cy="309" r={i===1?2.5:1.8} style={{animationDelay:`-${i*1.5}s`}}/>)}</g><path d="M72 240h50m-44 0v68q0 9 9 9h20q9 0 9-9v-68m-31 16h7m-7 10h5m-5 10h7"/></g>
  </>:id==='buddhism'?<>
   <circle cx="270" cy="184" r="82"/><circle cx="270" cy="184" r="66"/><circle cx="270" cy="184" r="18"/>
   {Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 270 184)`}><path d="M270 166V102m-7 19 7-7 7 7"/><circle cx="270" cy="102" r="3"/></g>)}
   <g className="wv-bodhi-leaf" opacity=".65"><path d="M100 150C94 136 72 132 76 112C80 96 93 96 100 109C107 96 120 96 124 112C128 132 106 136 100 150ZM100 109v50m0-36-14-9m14 18-16-8m16-1 14-9m-14 18 16-8"/></g>
   <g className="wv-palm-leaf-text" transform="rotate(10 423 132)" opacity=".7"><path d="M388 107h69v12h-69Zm0 15h69v12h-69Zm0 15h69v12h-69ZM401 103v50m42-50v50M408 113h27m-27 15h27m-27 15h27"/><circle cx="401" cy="113" r="2"/><circle cx="443" cy="143" r="2"/></g>
   <g opacity=".65"><path d="M92 300q-30-8-30-36 24 3 30 36Zm0 0q30-8 30-36-24 3-30 36ZM92 300q-20-21 0-43 20 22 0 43ZM66 310h52"/></g>
   <g className="wv-alms-bowl" opacity=".65"><path d="M388 275q29 10 58 0q-3 27-29 28-26-1-29-28ZM390 276q27 9 54 0M401 305h33"/></g>
   <path d="M166 330q52-19 104 0 52-19 104 0m-183 8q42-11 79 0 37-11 79 0" opacity=".5"/>
  </>:<>
   <path d="M270 277q-59-37 0-148 59 111 0 148ZM270 277q-89-11-96-100 79 20 96 100ZM270 277q89-11 96-100-79 20-96 100ZM270 277q-98 31-124-29 67-27 124 29ZM270 277q98 31 124-29-67-27-124 29Z"/>
   <circle className="wv-orbit-dots wv-orbit-inner" cx="270" cy="156" r="70" strokeDasharray="2 8" opacity=".45"/>
   <g opacity=".7" transform="rotate(-12 102 127)"><path d="M75 98h45v53H75ZM80 98v-8h46v55l-6 6M85 113h25m-25 12h25m-25 12h16"/></g>
   <g opacity=".65"><path d="M399 125q22 12 44 0l-6 15h-32l-6-15Zm22 0q-16-19 0-34 16 15 0 34ZM414 147h14"/></g>
   <g opacity=".55"><circle cx="100" cy="278" r="25" strokeDasharray="1 6"/><circle cx="100" cy="278" r="13"/><path d="M80 299q-6 19-21 20m17-22q-9 3-15-1"/></g>
   <g className="wv-conch" transform="rotate(9 427 282)" opacity=".7"><path d="M444 301q-24 12-42-5-17-16-7-34 9-16 28-11 23 6 22 29l11 13-12 8ZM445 280q-10-8-14 6t13 15M431 286q-26 3-28-19m13 17q-14-5-11-16m-8 15 11 14"/><path d="M427 271q-3-15-15-12-10 3-6 12 4 8 11 3 5-4 0-8"/></g>
   <path d="M191 320q79 12 158 0m-145 10q65 8 131 0" opacity=".55"/>
  </>}
  <g opacity=".45"><path d="m270 32 8 13-8 13-8-13ZM379 70l6 6-6 6-6-6ZM63 204l5 8-5 8-5-8ZM454 198v14m-7-7h14M158 60v10m-5-5h10M162 279v10m-5-5h10"/><circle cx="145" cy="192" r="3"/><circle cx="389" cy="202" r="3"/><circle cx="333" cy="43" r="2"/></g>
  <path d="M172 79q-22 13-30 29m246 99 16 12m-271 90 16 14" strokeDasharray="2 6" opacity=".3"/>
 </svg>;
}
