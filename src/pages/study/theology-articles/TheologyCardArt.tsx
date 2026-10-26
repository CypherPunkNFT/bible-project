// The Theology card's drawing on Study: the Scutum Fidei, the medieval shield of the Trinity. Each
// outer roundel is joined to the centre by "est" — the Father is God, the Son is God, the Spirit is
// God — and to the other two by "non est": the Father is not the Son, the Son is not the Spirit, the
// Spirit is not the Father. Six statements, which is the whole doctrine and the reason no simpler
// picture works. The drawing is decorative, so it is hidden from assistive technology; the card's
// own text carries the meaning.
import "./theology-card.css";

const OUTER = [
  { id: "pater", cx: 270, cy: 44, lines: ["PATER"] },
  { id: "filius", cx: 142, cy: 198, lines: ["FILIUS"] },
  { id: "spiritus", cx: 398, cy: 198, lines: ["SPIRITUS", "SANCTUS"] },
] as const;

// Each label sits at the midpoint of the rule it belongs to, on a patch of the page so the rule does
// not run through the letters. The patches are clear of every roundel by measurement.
const EDGES = [
  { x: 206, y: 121, text: "NON EST", width: 48 },
  { x: 334, y: 121, text: "NON EST", width: 48 },
  { x: 270, y: 198, text: "NON EST", width: 48 },
  { x: 270, y: 92, text: "EST", width: 26 },
  { x: 206, y: 167, text: "EST", width: 26 },
  { x: 334, y: 167, text: "EST", width: 26 },
];

export function TheologyCardArt() {
  return <div className="study-art study-theology-art" aria-hidden="true">
    <svg viewBox="0 0 540 260" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M30 234Q150 216 270 228T512 218" strokeWidth="1.1" opacity=".16" />
      <g strokeWidth="1.2">
        {/* the three "non est" rules round the outside, then the three "est" spokes to the centre */}
        <path d="M270 44 142 198M142 198h256M398 198 270 44" opacity=".5" />
        <path d="M270 44v92M270 136 142 198M270 136l128 62" opacity=".5" />

        {OUTER.map((node) => <circle key={node.id} cx={node.cx} cy={node.cy} r="31" fill="var(--surface)" />)}
        <circle cx="270" cy="136" r="27" fill="var(--surface)" />
        {OUTER.map((node) => <circle key={`${node.id}-ring`} cx={node.cx} cy={node.cy} r="26" strokeDasharray="2 4" opacity=".45" />)}
        <circle cx="270" cy="136" r="22" strokeDasharray="2 4" opacity=".45" />
      </g>

      <g className="th-card-node" stroke="none" fill="currentColor">
        <text x="270" y="140">DEUS</text>
        {OUTER.flatMap((node) => node.lines.map((line, i) => (
          <text key={line} x={node.cx} y={node.cy + 4 - (node.lines.length - 1) * 6 + i * 12}>{line}</text>
        )))}
      </g>

      <g className="th-card-edge" stroke="none">
        {EDGES.map((edge) => <g key={`${edge.x}-${edge.y}`}>
          <rect x={edge.x - edge.width / 2} y={edge.y - 7} width={edge.width} height="14" fill="var(--surface)" rx="2" />
          <text x={edge.x} y={edge.y + 3} fill="currentColor">{edge.text}</text>
        </g>)}
      </g>

      <g className="th-card-caption" stroke="none" fill="currentColor">
        <text x="270" y="252">SCUTUM FIDEI · THE SHIELD OF THE TRINITY</text>
      </g>
    </svg>
    <span className="study-art-note">One God. Three persons.</span>
  </div>;
}
