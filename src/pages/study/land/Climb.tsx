// 02 · Up and down: the road from Jerusalem to Jericho drawn twice, at true scale and with a stated stretch, then the verses
// that say "up" and "down" whatever the compass direction, and the pilgrim's going up in Jewish terms first.
import { climbLine, D, phraseByLabel, verseByLabel } from "./model";
import { Head, StudyLink, T, ThreeParts, VerseRef, VerseRefs } from "./parts";

const WIDTH = 600;
const STRETCH = 5;

function Profile({ stretch }: { stretch: number }) {
  const pts = D.transect.points;
  const from = pts.find((p) => p.id === "ridge")!, to = pts.find((p) => p.id === "jericho")!;
  const line = climbLine(WIDTH, stretch, from, to);
  const h = Math.max(line.y2, 2) + 34;
  return <figure className="ls-profile">
    <svg viewBox={`-12 -22 ${WIDTH + 24} ${h}`} aria-hidden="true">
      <path d={`M0 0L${WIDTH} ${line.y2}V${line.y2 + 10}H0Z`} className="ls-ground" />
      <line x1="0" y1="0" x2={WIDTH} y2={line.y2} className="ls-line" />
      <circle cx="0" cy="0" r="4" /><circle cx={WIDTH} cy={line.y2} r="4" />
      <text x="0" y="-9" className="ls-svg-label">Jerusalem · about {from.elevation} m</text>
      <text x={WIDTH} y={line.y2 - 9} textAnchor="end" className="ls-svg-label">Jericho · about {to.elevation} m</text>
    </svg>
    <figcaption className="ls-caption">{stretch === 1
      ? `True scale: a fall of about ${from.elevation - to.elevation} m in about ${to.km - from.km} km, one metre up drawn the same as one metre along. Drawn true, the road barely tilts.`
      : `The same road with the height stretched ${stretch} times, so the fall can be seen.`}</figcaption>
  </figure>;
}

function Way({ way }: { way: "up" | "down" }) {
  const rows = [...phraseByLabel.entries()].filter(([, p]) => p.way === way);
  return <div className="ls-way">
    <p className="ls-way-head"><span aria-hidden="true">{way === "up" ? "↗" : "↘"}</span> {way === "up" ? "Going up" : "Going down"}</p>
    <ul>{rows.map(([label, p]) => <li key={label}>
      <q>{p.phrase}</q> <VerseRef label={label} />
    </li>)}</ul>
  </div>;
}

export function Climb() {
  const going = D.faith.items.find((f) => f.id === "goingup")!;
  const ok = verseByLabel.size > 0;
  return <>
    <Head num="02" kicker="Up and down" title="Up to Jerusalem." turn="Down to Jericho."
      lead={<p>Scripture's travellers go up to Jerusalem and down from it, from the north as from the east. The heights explain the words before anything else does.</p>} />
    <div className="ls-climb">
      <Profile stretch={1} />
      <Profile stretch={STRETCH} />
    </div>
    {ok && <div className="ls-ways"><Way way="up" /><Way way="down" /></div>}
    <p className="ls-caption">Each line is quoted word for word from the Berean Standard Bible; choose a reference to read the verse.</p>
    <div className="ls-record">
      <h3>{going.name}</h3>
      <ThreeParts evidence={going.evidence} background={going.background} inference={going.inference} limit={going.limit} />
      <VerseRefs labels={going.verses} />
      <p className="ls-muted"><T text={D.faith.lead} /></p>
      <StudyLink title={going.link} />
    </div>
  </>;
}
