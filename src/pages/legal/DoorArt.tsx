// Drawings for the Privacy and Support pages (2026-10-25): two doors. Privacy is the inner room with its door
// shut (Matthew 6:6), a lamp burning on the table beside an open Bible; Support is the door opened to whoever knocks
// (Matthew 7:7), light spilling onto the path. A lighthouse marks the Help for life band. Every drawing loops slowly
// (the flame, the motes, the beam). Styles: legal.css (.lg-art, .lg-*).

const MOTES = [[0, 0], [14, -22], [-12, -40], [8, -58], [-6, -76]];
const STARS: [number, number, number][] = [[112, 150, 0], [146, 172, 1.2], [128, 200, 2.4]];

/** A four-pointed star centred on (x, y). */
const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r}L${x + r * 0.28} ${y - r * 0.28}L${x + r} ${y}L${x + r * 0.28} ${y + r * 0.28}L${x} ${y + r}L${x - r * 0.28} ${y + r * 0.28}L${x - r} ${y}L${x - r * 0.28} ${y - r * 0.28}Z`;

/** "Go into your inner room, shut your door": a room seen from inside, the door shut, a lamp and an open book. */
export function InnerRoomArt() {
  return (
    <figure className="lg-art">
      <svg viewBox="0 0 520 420" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse className="lg-orbit" cx="260" cy="220" rx="236" ry="182" />
        <ellipse className="lg-wash" cx="190" cy="278" rx="62" ry="40" />
        <path className="lg-faint" d="M58 356V96Q58 84 70 84H450Q462 84 462 96V356" />
        <path className="lg-faint" d="M58 120H462" />
        {Array.from({ length: 6 }, (_, i) => <path key={i} className="lg-faint" d={`M${98 + i * 66} 84V120`} />)}
        {/* The window: night outside, three stars that come and go. */}
        <path className="lg-paper" d="M92 236V168Q92 132 130 132Q168 132 168 168V236Z" />
        <path className="lg-faint" d="M130 132V236M92 190H168" />
        {STARS.map(([x, y, delay]) => <path key={`${x}${y}`} className="lg-star" style={{ animationDelay: `${delay}s` }} d={star(x, y, 5)} />)}
        {/* The door, shut, with its latch and keyhole. */}
        <path className="lg-paper" d="M326 356V178Q326 146 368 146Q410 146 410 178V356Z" />
        <path className="lg-line" d="M338 356V184Q338 160 368 160Q398 160 398 184V356" />
        {[352, 368, 384].map((x) => <path key={x} className="lg-fibre" d={`M${x} ${x === 368 ? 162 : 168}V354`} />)}
        <path className="lg-gold" d="M392 262H404M398 256V268" />
        <circle className="lg-gold" cx="382" cy="280" r="3" />
        <path className="lg-gold" d="M382 283V290" />
        {/* The table, the clay lamp and the open book. */}
        <path className="lg-line" d="M128 300H298M140 300V356M286 300V356M134 308H292" />
        <path className="lg-paper" d="M188 298Q212 286 238 294Q264 286 288 298L284 280Q262 270 238 278Q214 270 192 280Z" />
        <path className="lg-line" d="M238 278V294" />
        {[0, 1, 2].map((i) => <path key={i} className="lg-fibre" d={`M${200} ${285 + i * 4}Q216 ${280 + i * 4} 232 ${285 + i * 4}M${244} ${285 + i * 4}Q260 ${280 + i * 4} 276 ${285 + i * 4}`} />)}
        <path className="lg-paper" d="M138 298Q140 284 160 284Q176 284 184 290L192 288Q186 298 170 299Z" />
        <path className="lg-line" d="M150 284Q156 278 164 284" />
        <g className="lg-flame"><path className="lg-gold-fill" d="M190 288Q181 276 190 260Q199 276 190 288Z" /></g>
        <g className="lg-motes">{MOTES.map(([dx, dy], i) => <circle key={i} className="lg-mote" style={{ animationDelay: `${i * 1.1}s` }} cx={190 + dx} cy={250 + dy} r="1.4" />)}</g>
        <path className="lg-faint" d="M40 356H480" />
      </svg>
      <figcaption><span aria-hidden="true" /><b>“Shut your door.”</b>Matthew 6:6</figcaption>
    </figure>
  );
}

/** "Knock, and the door will be opened to you": a door standing open, light on the path, a lantern by the frame. */
export function OpenDoorArt() {
  return (
    <figure className="lg-art">
      <svg viewBox="0 0 520 420" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse className="lg-orbit" cx="260" cy="214" rx="236" ry="182" />
        {[[70, 74, 0], [452, 96, 1.6], [420, 52, 3], [104, 140, 2.2]].map(([x, y, delay]) => <path key={`${x}${y}`} className="lg-star" style={{ animationDelay: `${delay}s` }} d={star(x, y, 5)} />)}
        {/* The house front: a roof line and a few courses of stone. */}
        <path className="lg-line" d="M104 346V160L260 82L416 160V346" />
        {[200, 240, 280, 320].map((y) => <path key={y} className="lg-fibre" d={`M104 ${y}H196M324 ${y}H416`} />)}
        {[[140, 200], [170, 240], [130, 280], [370, 220], [350, 300], [390, 260]].map(([x, y]) => <path key={`${x}${y}`} className="lg-fibre" d={`M${x} ${y}V${y + 40}`} />)}
        {/* The doorway, lit from within, and the door swung open on its hinge. */}
        <path className="lg-glow" d="M210 346V214Q210 172 260 172Q310 172 310 214V346Z" />
        <path className="lg-line" d="M204 346V212Q204 164 260 164Q316 164 316 212V346" />
        <path className="lg-beam" d="M210 346H310L344 392H176Z" />
        <g className="lg-door"><path className="lg-paper" d="M210 346V214Q210 188 222 180L176 196Q168 208 168 226V352Z" />
          {[182, 194].map((x) => <path key={x} className="lg-fibre" d={`M${x} ${x === 182 ? 202 : 196}V${x === 182 ? 350 : 348}`} />)}
          <circle className="lg-gold" cx="200" cy="270" r="5" /></g>
        {/* The lantern on its bracket, swaying a little. */}
        <path className="lg-line" d="M330 186H356V194" />
        <g className="lg-lantern"><path className="lg-paper" d="M346 200H366L362 232H350Z" /><path className="lg-line" d="M344 200H368M348 234H364" />
          <path className="lg-gold-fill" d="M356 226Q351 219 356 210Q361 219 356 226Z" /></g>
        <g className="lg-motes">{MOTES.map(([dx, dy], i) => <circle key={i} className="lg-mote" style={{ animationDelay: `${i * 1.1}s` }} cx={260 + dx * 1.6} cy={300 + dy} r="1.5" />)}</g>
        <path className="lg-faint" d="M36 346H204M316 346H484" />
        {[[252, 364, 14], [244, 378, 17], [256, 394, 20]].map(([x, y, r]) => <ellipse key={y} className="lg-faint" cx={x} cy={y} rx={r} ry={r / 4} />)}
      </svg>
      <figcaption><span aria-hidden="true" /><b>“Knock, and the door will be opened to you.”</b>Matthew 7:7</figcaption>
    </figure>
  );
}

/** A lighthouse on its rock, the beam sweeping back and forth over the water. */
export function LighthouseArt() {
  return (
    <svg className="lg-light" viewBox="0 0 220 160" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g className="lg-sweep"><path className="lg-beam" d="M110 42L210 22V62Z" /><path className="lg-beam" d="M110 42L10 22V62Z" /></g>
      <path className="lg-paper" d="M98 134L102 56H118L122 134Z" />
      <path className="lg-line" d="M100 92H120M99 114H121" />
      <path className="lg-paper" d="M100 56V38H120V56Z" /><path className="lg-gold-fill" d="M106 52V42H114V52Z" />
      <path className="lg-line" d="M96 38L110 26L124 38Z" />
      <path className="lg-line" d="M72 140Q90 128 110 132Q134 126 150 140Z" />
      <path className="lg-wave" d="M20 146Q34 140 48 146T76 146M146 146Q160 140 174 146T202 146" />
      <path className="lg-wave lg-wave-b" d="M34 154Q48 148 62 154T90 154M128 154Q142 148 156 154T184 154" />
    </svg>
  );
}
