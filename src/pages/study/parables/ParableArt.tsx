import type { ParableRoom } from '@/data/parables';

/** Original vector scenes, sharing the site's fine-line study illustration language. */
export function ParableArt({ room, hero = false }: { room: ParableRoom; hero?: boolean }) {
  return <svg viewBox="0 0 360 180" fill="none" className={`pb-art${hero ? ' pb-art-hero' : ''}`} aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="180" cy="88" r="69" opacity=".12" /><circle cx="180" cy="88" r="83" strokeDasharray="1 7" opacity=".25" />
      <path d="M24 153Q95 128 173 146T338 151M48 163Q150 141 309 163" opacity=".25" />
      {room === 'field' && <>
        <path d="M57 140Q109 76 191 126T325 140M30 142Q147 166 329 117" opacity=".3" />
        {[96,120,146,218,241,267].map((x,i)=><g key={x} transform={`translate(${x} ${112+i%3*8}) rotate(${i%2?8:-8})`}><path d="M0 28V-25M0-5Q-15-7-12-19Q0-17 0-5M0-13Q15-15 12-27Q0-25 0-13M0 8Q-16 6-13-6Q0-4 0 8" /></g>)}
        <path d="M174 133V71M174 94Q147 87 151 66Q172 68 174 94M175 84Q204 78 200 57Q180 61 175 84" strokeWidth="2" />
        <circle cx="174" cy="46" r="3" fill="currentColor" className="pb-seed"/><path d="M174 55V62" strokeDasharray="1 4"/>
        <path d="M50 51q7-8 14 0q7-8 14 0M270 46q7-8 14 0q7-8 14 0" opacity=".5" />
      </>}
      {room === 'home' && <>
        <path d="M133 138V79L183 40L234 79V138M121 88L183 37L246 88M149 72V51H161V62" />
        <path d="M171 138V103a13 13 0 0 1 26 0v35" fill="currentColor" fillOpacity=".09" strokeWidth="1.8" />
        <path d="M149 94h12v15h-12zM209 94h12v15h-12zM175 145Q124 151 125 170M198 145Q244 156 206 177" />
        <path d="M77 133v-35m0 13q-23-3-16-20q9-15 16 2q7-17 17-3q9 19-17 21M282 135v-35m0 9q-22-3-15-18q9-15 15 2q8-17 18-3q8 19-18 19" opacity=".6" />
        <path d="M110 145q17-21 35-8" strokeDasharray="2 5"/><circle cx="106" cy="148" r="3" fill="currentColor"/>
        <circle cx="183" cy="114" r="27" opacity=".13" className="pb-halo" />
      </>}
      {room === 'treasure' && <>
        <path d="M121 98h119v47H121zM121 98l13-30h92l14 30M134 68q46-45 92 0M149 98V70M210 98V70" />
        <path d="M121 111h119M174 102h14v21h-14zM180 109v7"/><path d="M130 137h32M205 137h25" opacity=".5"/>
        <circle cx="265" cy="137" r="17"/><circle cx="265" cy="137" r="11" opacity=".4"/>
        <path d="M65 146l16-7l16 7l-16 8zM65 151l16 8l16-8M65 156l16 8l16-8"/>
        {[[-37,-8],[-18,-32],[10,-41],[36,-24],[58,-4]].map(([x,y],i)=><path key={i} d={`M${181+x} ${54+y}v7m-3.5-3.5h7`} opacity=".6"/>) }
        <path d="M155 54l-8-14M204 49l7-13M179 40V22" opacity=".4"/>
      </>}
      {room === 'door' && <>
        <path d="M124 146V66a57 57 0 0 1 114 0v80M141 146V68a40 40 0 0 1 80 0v78"/>
        <path d="M153 146V72l49-17v91M153 72l49-17M189 106v6M112 146h139M106 155h151M99 164h165" />
        <path d="M271 143q-22 0-24-18h48q-2 18-24 18M265 125q-7-11 6-22q13 11 6 22" fill="currentColor" fillOpacity=".08" />
        <path d="M271 95v-7M249 105l-6-6M291 105l6-6" opacity=".5"/>
        <path d="M81 132V85M71 85h20M77 82l4-9l4 9M71 94h20v16H71z"/><circle cx="271" cy="117" r="34" opacity=".12" className="pb-halo"/>
      </>}
    </g>
  </svg>;
}
