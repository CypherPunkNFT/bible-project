import type { PlacesDestination } from "./PlacesCollectionMockup";

/** Decorative illustrations, not geographic reconstructions or plotted itineraries. */
export function PlacesArtwork({ kind }: { kind: PlacesDestination }) {
  return <svg className={`places-artwork places-artwork-${kind}`} viewBox="0 0 480 185" fill="none" aria-hidden="true" focusable="false">
    {kind === "atlas" && <>
      <g stroke="currentColor" opacity=".1"><path d="M30 42H450M30 91H450M30 140H450M96 15V175M192 15V175M288 15V175M384 15V175" /><ellipse cx="240" cy="95" rx="195" ry="73" /><ellipse cx="240" cy="95" rx="155" ry="53" /></g>
      <path d="M58 22L152 18 184 34 198 28 232 41 260 32 292 45 316 41 343 62 374 59 411 81 413 139 381 169 306 163 278 151 238 148 196 156 158 149 132 159 76 139 54 112 79 95 106 100 129 91 141 104 161 109 183 105 198 121 237 126 275 118 304 129 337 115 343 92 319 80 295 83 277 70 252 75 230 63 205 74 183 65 171 71 145 56 104 62 82 49Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeOpacity=".5" />
      <g stroke="currentColor" strokeWidth="1.5">{[[106,55],[165,69],[218,64],[284,78],[337,96],[324,129],[374,145]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===4?13:8} opacity=".25"/><circle cx={x} cy={y} r={i===4?5:3} fill="currentColor"/></g>)}</g>
      <path d="M346 94H395M324 134V156H281" stroke="currentColor" opacity=".6"/><g fill="currentColor" fontSize="8" letterSpacing="2"><text x="399" y="96">E</text><text x="239" y="159">EXPLORE</text></g>
    </>}
    {kind === "journeys" && <>
      <g stroke="currentColor" opacity=".09">{[0,1,2,3].map(i=><path key={i} d={`M20 ${90+i*14}Q100 ${-10+i*14} 210 ${100+i*14}T465 ${65+i*14}`} />)}</g>
      <path d="M48 136C97 134 75 39 138 53S189 154 253 119 289 31 339 49 360 119 433 57" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 5" />
      <path d="M48 136C97 134 75 39 138 53S189 154 253 119" stroke="currentColor" strokeWidth="2" />
      {[[48,136],[138,53],[253,119],[339,49],[433,57]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===2?17:10} fill="var(--surface)" stroke="currentColor" strokeOpacity={i>2?.4:.8}/><circle cx={x} cy={y} r={i===2?6:3.5} fill="currentColor" opacity={i>2?.4:1}/></g>)}
      <g fill="currentColor" fontSize="8" letterSpacing="2"><text x="24" y="163">CALLED</text><text x="113" y="28">SENT</text><text x="229" y="158">ONWARD</text></g><path d="M246 88L253 78 260 88" stroke="currentColor" opacity=".65" />
    </>}
    {kind === "cities" && <>
      <g stroke="currentColor" opacity=".13"><path d="M40 148L238 58 438 148 240 185Z M62 137L240 173 417 138 M91 124L240 154 389 125 M131 106L240 133 350 107"/><path d="M99 156L280 73M162 169L338 99M207 179L392 123M376 162L184 83M318 174L126 111"/></g>
      <path d="M88 124V79L107 70 143 78V112M88 79L123 89 143 78M123 89V133M320 121V82L344 70 385 81V128M320 82L361 94 385 81M361 94V145" fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".6" />
      <path d="M178 127V68L240 38 302 68V127L240 152Z" fill="var(--surface)" stroke="currentColor"/><path d="M178 68L240 89 302 68M240 89V152M195 60L240 17 285 60 240 77Z" fill="currentColor" fillOpacity=".12" stroke="currentColor"/>
      <g stroke="currentColor" strokeOpacity=".65"><path d="M189 83V122M204 89V129M220 95V136M255 94V136M271 89V129M287 83V121M195 60L240 44 285 60"/></g><path d="M55 151H77M403 151H426" stroke="currentColor"/><circle cx="55" cy="151" r="2" fill="currentColor"/><circle cx="426" cy="151" r="2" fill="currentColor"/>
    </>}
    {kind === "gospels" && <>
      <g stroke="currentColor" strokeOpacity=".12"><path d="M43 140L110 57 153 102 193 64 258 136M262 133L320 69 364 99 402 58 450 141"/><path d="M73 143L110 98 135 126M368 140L405 104 428 141"/></g>
      {[34,73,112,151].map((y,i)=><g key={y}><text x="25" y={y+3} fill="currentColor" opacity=".7" fontSize="8" letterSpacing="1.5">{["MATTHEW","MARK","LUKE","JOHN"][i]}</text><path d={`M103 ${y}C170 ${y} 167 91 242 91S345 ${y} 427 ${y}`} stroke="currentColor" strokeWidth="1.2" opacity={.35+i*.15}/><circle cx="427" cy={y} r="3.5" fill="currentColor" opacity={.4+i*.15}/></g>)}
      <circle cx="242" cy="91" r="26" fill="var(--surface)" stroke="currentColor"/><circle cx="242" cy="91" r="19" stroke="currentColor" strokeOpacity=".25"/><path d="M242 77V106M232 87H252" stroke="currentColor" strokeWidth="2"/>
    </>}
  </svg>;
}
