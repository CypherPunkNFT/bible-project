// The Journeys page header picture (Pilgrim direction): a road winding through hills toward a city at dawn, with
// tents along the way, mile-stones lighting in turn and a traveller walking it. Purely decorative.
const STARS: [number, number][] = [[60, 40], [120, 70], [210, 30], [300, 55], [470, 36], [520, 80], [430, 92], [250, 96], [170, 44], [40, 110]];
const MILES: [number, number][] = [[132, 326], [176, 292], [246, 266], [308, 238], [336, 214], [378, 194]];
const ROAD = "M118 340C160 312 150 292 214 276S322 248 300 230 352 206 388 190";
const TENT = "M0 22 14 2l14 20M14 2v20M14 22l-5-8M-6 22h40";

export function JourneysHero() {
  return <svg className="pg-art" viewBox="0 0 560 340" fill="none" aria-hidden>
    <defs>
      <linearGradient id="pg-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="pg-sky1" /><stop offset="1" className="pg-sky2" /></linearGradient>
      <radialGradient id="pg-sun" cx=".5" cy=".5" r=".5"><stop offset="0" className="pg-sun1" /><stop offset="1" className="pg-sun2" /></radialGradient>
      <clipPath id="pg-clip"><rect width="560" height="340" rx="22" /></clipPath>
    </defs>
    <g clipPath="url(#pg-clip)">
      <rect width="560" height="340" fill="url(#pg-sky)" />
      <g className="pg-stars">{STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.6} style={{ animationDelay: `${i * 0.37}s` }} />)}</g>
      <circle className="pg-glow" cx="392" cy="176" r="150" fill="url(#pg-sun)" />
      <circle className="pg-sundisc" cx="392" cy="176" r="40" />
      <path className="pg-birds" d="M300 104q5-5 10 0q5-5 10 0M330 88q4-4 8 0q4-4 8 0M282 122q3-3 6 0q3-3 6 0" />
      <path className="pg-hill-far" d="M0 214C60 188 120 178 190 192S300 176 360 186 470 170 560 184V340H0z" />
      <g className="pg-city"><path d="M372 188v-14h6v-6l4-4 4 4v6h6v14M398 188v-9a6 6 0 0 1 12 0v9M414 188v-18h4v-4h4v4h4v18M352 188v-8h8v8" /></g>
      <path className="pg-hill-mid" d="M0 248C70 222 150 214 230 228S360 206 440 218 520 210 560 214V340H0z" />
      <path className="pg-hill-near" d="M0 288C90 262 170 270 250 284S420 268 560 280V340H0z" />
      <path className="pg-road-bed" d={ROAD} />
      <path id="pg-road" className="pg-road" d={ROAD} />
      {MILES.map(([x, y], i) => <circle key={i} className="pg-mile" cx={x} cy={y} r="3.4" style={{ animationDelay: `${0.9 + i * 1.1}s` }} />)}
      <g className="pg-tent" transform="translate(70 262)"><path d={TENT} /></g>
      <g className="pg-tent" transform="translate(470 246) scale(.7)"><path d={TENT} /></g>
      <g className="pg-walker"><circle r="9" className="pg-walker-halo" /><circle r="4.2" className="pg-walker-dot" />
        <animateMotion dur="9s" repeatCount="indefinite" rotate="0"><mpath href="#pg-road" /></animateMotion></g>
    </g>
  </svg>;
}
