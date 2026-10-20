// The contact page's drawing (approved mock-up F, 2026-10-20): a tilted papyrus letter opening with Paul's greeting,
// χάρις ὑμῖν καὶ εἰρήνη ("grace to you and peace", Galatians 1:3), sealed at its edge. Styles: contact.css (.ct-*).

const LINE_LENGTHS = [1, 0.86, 0.94, 0.7, 0.9, 0.8, 0.96, 0.62];
const CROSSES: [number, number][] = [[40, 60], [486, 46], [470, 372], [62, 360]];

export function EpistleArt() {
  return (
    <figure className="ct-art">
      <svg viewBox="0 0 520 420" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <ellipse className="ct-orbit" cx="260" cy="210" rx="236" ry="178" />
        {CROSSES.map(([x, y]) => <path key={`${x}${y}`} className="ct-faint" d={`M${x} ${y - 6}V${y + 6}M${x - 6} ${y}H${x + 6}`} />)}
        <g transform="rotate(-6 260 210)">
          <path className="ct-papyrus" d="M100 96H420V330H100Z" />
          {Array.from({ length: 9 }, (_, i) => <path key={i} className="ct-fibre" d={`M${120 + i * 34} 98V328`} />)}
          <text className="ct-word" x="122" y="142" fontSize="34" lang="grc">χάρις ὑμῖν</text>
          <text className="ct-word ct-word-dim" x="122" y="178" fontSize="24" lang="grc">καὶ εἰρήνη</text>
          <path className="ct-gold" d="M122 150H290" />
          {Array.from({ length: 11 }, (_, i) => <path key={i} className="ct-line" d={`M122 ${206 + i * 11}H${122 + 270 * LINE_LENGTHS[i % 8]}`} />)}
          <path className="ct-faint" d="M420 150Q452 160 446 196T420 238" />
          <circle className="ct-seal" cx="446" cy="196" r="12" />
          <path className="ct-seal-mark" d="M446 189V203M440 195H452" />
        </g>
      </svg>
      <figcaption><span aria-hidden="true" /><b lang="grc">χάρις ὑμῖν.</b>Galatians 1:3</figcaption>
    </figure>
  );
}
