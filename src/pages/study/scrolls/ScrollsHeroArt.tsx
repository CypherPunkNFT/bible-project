import { useId, useRef, useState, type CSSProperties } from 'react';
import './scrolls-hero-art.css';

// Original format illustration: marks are graphic strokes, never invented manuscript text.
export default function ScrollsHeroArt() {
  const id = useId().replace(/:/g, '');
  const [view, setView] = useState<'scroll' | 'fragments'>('scroll');
  const figure = useRef<HTMLElement>(null);
  const [overScroll, setOverScroll] = useState(false);
  const [lifted, setLifted] = useState<number | null>(null);
  const toggleFragment = (i:number) => setLifted(current => current === i ? null : i);
  const main = 'M94 151 Q245 111 493 141 L491 349 468 352 451 347 434 353 413 349 386 353 360 347 342 352 318 347 292 353 268 345 243 351 222 347 195 351 172 344 151 349 128 342 100 349Z';
  const pieces = ['M147 362L244 348 259 365 249 388 263 406 247 431 218 438 197 429 179 441 153 423 161 399 141 384Z','M322 353L410 367 426 391 414 409 426 438 397 452 377 440 353 448 337 425 319 419 329 394 314 377Z','M465 388L512 373 535 393 526 414 538 429 516 456 487 449 476 428 458 417Z'];
  const marks = (x:number,y:number,columns:number,rows:number,width:number) => Array.from({length:columns},(_,c)=>Array.from({length:rows},(_,r)=><path key={`${c}-${r}`} d={`M${x+c*(width+16)} ${y+r*9}h${width-((r*7+c*5)%13)}`} fill="none" stroke="currentColor" strokeWidth={1.25} strokeDasharray={`${5+r%3} 3 2 3 7 3`} opacity={.28+(r%4)*.08}/>));
  return <figure ref={figure} className={`dss-art dss-art-${view}${overScroll ? ' dss-over-scroll' : ''}`}>
    <div className="dss-art-top"><span>THE WRITTEN SURFACE</span><span className="dss-art-index">SCROLL / FRAGMENT</span></div>
    <div className="dss-art-scene">
      <svg className="dss-art-drawing" viewBox="0 0 640 520" role="group" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>A line drawing of an unrolled scroll and manuscript fragments</title><desc id={`${id}-desc`}>Original schematic artwork, not a historical manuscript or a proposed reconstruction. {view==='scroll'?'The scroll form is emphasised.':'The separate fragments are emphasised.'}</desc>
        <defs>
          <clipPath id={`${id}-body`}><path d={main}/></clipPath>
          <clipPath id={`${id}-lens-clip`}><circle cx="421" cy="224" r="45"/></clipPath>
          {pieces.map((d,i)=><clipPath key={i} id={`${id}-piece-${i}`}><path d={d}/></clipPath>)}
        </defs>
        <g className="dss-art-contours" fill="none" stroke="currentColor" strokeWidth=".7"><path d="M21 315Q144 263 271 320T626 316M18 335Q147 282 274 341T630 338M22 356Q151 304 279 363T632 359M30 379Q160 328 282 385T626 381M47 402Q175 353 292 407T614 403"/><path d="M69 79H570M69 74V84M570 74V84"/><path d="M570 112V296" strokeDasharray="2 7"/></g>
        <g className="dss-art-scroll-form dss-scroll-motion" style={{transformOrigin:'320px 240px'} as CSSProperties}
          onPointerEnter={() => setOverScroll(true)} onPointerLeave={() => setOverScroll(false)}
          onPointerMove={event => {
            if(event.pointerType === 'touch') return;
            const box=event.currentTarget.ownerSVGElement!.getBoundingClientRect();
            figure.current?.style.setProperty('--scroll-x',`${((event.clientX-box.left)/box.width-.5)*12}px`);
            figure.current?.style.setProperty('--scroll-y',`${((event.clientY-box.top)/box.height-.5)*10-5}px`);
          }}>
          <g id={`${id}-lens-source`} transform="translate(-6 -10) rotate(-9 320 250)">
            <path d="M97 154Q241 114 493 144L493 357Q280 335 103 355Z" fill="currentColor" fillOpacity=".06" opacity=".6" transform="translate(4 7)"/>
            <path d={main} fill="currentColor" fillOpacity=".055" stroke="currentColor" strokeWidth="1"/>
            <g clipPath={`url(#${id}-body)`}>
              {marks(129,171,4,18,65)}
              <path d="M294 125Q287 230 296 354" fill="none" stroke="currentColor" opacity=".5"/>
              {Array.from({length:16},(_,i)=><path key={i} d={`M290 ${145+i*12}l9 2`} stroke="currentColor" strokeWidth="1" opacity=".6"/>)}
              <path d="M105 159Q249 125 484 149M109 326Q284 311 486 334" fill="none" stroke="currentColor" opacity=".23"/>
              <path d="M189 264l7-4 5 5-4 9-8-3ZM397 194l5-2 3 8-7 2Z" fill="currentColor" fillOpacity=".06" opacity=".6"/>
            </g>
            <g className="dss-left-curl">
              <path className="curl-ground" d="M77 154L84 338Q97 351 110 338L104 154Z" stroke="none"/>
              <path d="M77 154L84 338Q97 351 110 338L104 154" fill="currentColor" fillOpacity=".055" stroke="currentColor"/>
              <ellipse className="curl-ground" cx="90.5" cy="154" rx="13.5" ry="6" stroke="currentColor"/>
              <ellipse cx="90.5" cy="154" rx="7" ry="2.5" fill="none" stroke="currentColor" opacity=".65"/>
              <path d="M101 160L107 332" fill="none" stroke="currentColor" opacity=".45"/>
            </g>
            <path d="M487 141Q507 123 526 139L531 330Q521 356 491 349L485 167Q473 151 487 141Z" fill="currentColor" fillOpacity=".055" stroke="currentColor"/>
            <ellipse cx="506" cy="144" rx="22" ry="12" fill="currentColor" fillOpacity=".05" transform="rotate(-5 506 144)"/>
            <ellipse cx="506" cy="144" rx="12" ry="5" fill="currentColor" fillOpacity=".06"/>
            <path d="M522 158L526 325Q515 344 496 341" fill="none" stroke="currentColor" opacity=".55"/>
          </g>
        </g>
        <g className="dss-art-pieces">
          {pieces.map((d,i)=><g key={i} className={`dss-art-piece dss-art-piece-${i}`} role="button" tabIndex={0} aria-label={`Lift illustrative fragment 0${i+1}`} aria-pressed={lifted===i} onClick={()=>toggleFragment(i)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleFragment(i);}}}>
            <path className="dss-fragment-hit" d={d} fill="transparent" stroke="none"/>
            <g className="dss-fragment-lift">
              <path d={d} fill="currentColor" fillOpacity=".055" stroke="currentColor"/><g clipPath={`url(#${id}-piece-${i})`}>{marks([157,332,475][i],[369,373,393][i],1,9,[89,78,55][i])}<path d={`M130 ${410+i*4}H550`} stroke="currentColor" opacity=".25"/></g><path className="dss-fragment-outline" d={d} fill="none" stroke="currentColor" strokeOpacity=".35"/>
              <text className="dss-fragment-label" x={[200,375,501][i]} y={[463,474,478][i]} textAnchor="middle" fill="currentColor" stroke="none">0{i+1}</text>
            </g>
          </g>)}
        </g>
        <g className="dss-looking-glass" aria-hidden="true">
          <path className="lens-ground" d="M459 265L499 305Q504 310 509 305Q513 300 508 295L468 255" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M467 264L501 298" fill="none" stroke="currentColor" opacity=".35"/>
          <circle className="lens-ground" cx="421" cy="224" r="51" stroke="currentColor" strokeWidth="1.4"/>
          <g clipPath={`url(#${id}-lens-clip)`} className="lens-ink"><g transform="translate(421 224) scale(1.65) translate(-421 -224)"><g className="dss-scroll-motion" style={{transformOrigin:'320px 240px'} as CSSProperties}><use href={`#${id}-lens-source`}/></g></g></g>
          <circle cx="421" cy="224" r="45" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6"/>
          <path d="M387 207A38 38 0 0 1 415 187" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".4"/>
        </g>
      </svg>
    </div>
    <div className="dss-art-controls" role="group" aria-label="Explore the manuscript illustration"><button type="button" aria-pressed={view==='scroll'} onClick={()=>setView('scroll')}><span>01</span>The scroll</button><button type="button" aria-pressed={view==='fragments'} onClick={()=>setView('fragments')}><span>02</span>The fragments</button><a href="#dss-isaiah" aria-label="Examine the real Isaiah manuscript">See the real object ↗</a></div>
    <div className="dss-art-note" aria-live="polite"><strong>{view==='scroll'?'A continuous surface. A fragile survival.':'A surviving piece is not the whole work.'}</strong><span>{view==='scroll'?'Columns of writing, sheets joined along their edges.':'Most of this collection reaches us in fragments.'}</span></div>
    <figcaption className="dss-art-caption">Illustrative forms · not manuscript facsimiles or proposed joins.</figcaption>
  </figure>;
}
