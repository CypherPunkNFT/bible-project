import type { PlacesDestination } from "./PlacesCollectionMockup";

/** Decorative illustrations, not geographic reconstructions or plotted itineraries. */
export function PlacesArtwork({ kind }: { kind: PlacesDestination }) {
  return <svg className={`places-artwork places-artwork-${kind}`} viewBox="0 0 480 185" fill="none" aria-hidden="true" focusable="false">
    {kind === "early-church" && <>
      <path d="M80 157V75Q80 15 145 15H335Q400 15 400 75V157M105 157V80Q105 39 149 39H331Q375 39 375 80V157" stroke="currentColor" opacity=".25" />
      <path d="M150 157V96Q150 58 185 58Q220 58 220 96V157M260 157V96Q260 58 295 58Q330 58 330 96V157" stroke="currentColor" opacity=".45" />
      <path d="M213 147V113H267V147M202 147H278M226 113V88M254 113V88" stroke="currentColor" strokeWidth="2" />
      <path d="M226 88Q217 77 226 67Q235 77 226 88ZM254 88Q245 77 254 67Q263 77 254 88Z" fill="currentColor" opacity=".8" />
      <path d="M120 165H360M155 174H325" stroke="currentColor" opacity=".35" /><circle cx="240" cy="32" r="4" fill="currentColor" />
    </>}
    {kind === "catholic-orthodox" && <>
      <path d="M44 151H438M75 161H405" stroke="currentColor" opacity=".25" />
      <path d="M86 151V91L144 44 202 91V151M111 151V104H178V151M132 151V120Q144 105 156 120V151M144 44V20M137 29H151" fill="currentColor" fillOpacity=".07" stroke="currentColor" />
      <path d="M290 151V92H395V151M304 92Q289 66 317 48Q337 30 343 22Q350 38 367 48Q395 66 381 92M343 22V9M335 16H351M325 151V121Q343 102 360 121V151" fill="currentColor" fillOpacity=".1" stroke="currentColor" />
      <path d="M175 164Q240 192 314 164M199 118Q244 80 288 118" stroke="currentColor" strokeDasharray="3 5" opacity=".6" /><circle cx="243" cy="102" r="7" fill="var(--surface)" stroke="currentColor" />
    </>}
    {kind === "reformation" && <>
      <path d="M110 158V28H265V158M98 28H278M98 158H278M110 53H265M187 28V86M164 86H210V101H164Z" stroke="currentColor" strokeWidth="2" />
      <path d="M187 59H226L241 49M124 139H250L233 118H141Z" fill="currentColor" fillOpacity=".12" stroke="currentColor" />
      <path d="M291 42L370 30 392 135 313 151ZM300 55L378 42M312 77L366 68M316 92L370 83M320 107L374 98M323 121L356 116" stroke="currentColor" opacity=".7" />
      <path d="M60 171H420M137 148H236" stroke="currentColor" opacity=".25" /><path d="M296 155L379 143" stroke="currentColor" opacity=".5" />
    </>}
    {kind === "missions" && <>
      <ellipse cx="240" cy="93" rx="150" ry="77" stroke="currentColor" opacity=".4" /><ellipse cx="240" cy="93" rx="80" ry="77" stroke="currentColor" opacity=".18" />
      <path d="M90 93H390M105 61H375M105 125H375M240 16V170" stroke="currentColor" opacity=".18" />
      <path d="M137 110Q200 7 285 58T351 117M176 53Q183 147 298 140M137 110Q216 168 351 117" stroke="currentColor" strokeDasharray="3 5" opacity=".65" />
      {[[137,110],[176,53],[240,93],[285,58],[298,140],[351,117]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="11" fill="var(--surface)" stroke="currentColor" strokeOpacity=".45"/><circle cx={x} cy={y} r="4" fill="currentColor"/></g>)}
    </>}
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
