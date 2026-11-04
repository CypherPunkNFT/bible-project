// Section 03: a change of scale, from the passage to one word. Cassian takes four senses out of this very passage, and says one Jerusalem can
// carry them all. The four lobes are the controls, and the chosen sense reads out inside the figure; the medieval rhyme and Tyndale's reply follow.
import { D, type Sense } from "./model";
import { Cite, Head, Quote } from "./parts";
import { ReaderTest } from "./ReaderTest";

const LOBES: Record<string, { d: string; x: number; y: number }> = {
  history: { d: "M200 164c-44 0-70-30-70-62s28-62 70-62 70 30 70 62-26 62-70 62z", x: 200, y: 96 },
  allegory: { d: "M236 200c0-44 30-70 62-70s62 28 62 70-30 70-62 70-62-26-62-70z", x: 298, y: 196 },
  moral: { d: "M200 236c44 0 70 30 70 62s-28 62-70 62-70-30-70-62 26-62 70-62z", x: 200, y: 296 },
  anagogy: { d: "M164 200c0 44-30 70-62 70s-62-28-62-70 30-70 62-70 62 26 62 70z", x: 102, y: 196 },
};

function Quatrefoil({ sense, onSense }: { sense: Sense; onSense: (id: string) => void }) {
  return <svg className="hc-foil" viewBox="20 20 360 360" role="group" aria-label="Four senses around the word Jerusalem. Choose one.">
    {D.senses.items.map((item) => {
      const lobe = LOBES[item.id], on = item.id === sense.id;
      return <g key={item.id} className={`hc-lobe${on ? " on" : ""}`} role="button" tabIndex={0} aria-pressed={on} aria-label={`${item.name}: ${item.alt}`} onClick={() => onSense(item.id)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSense(item.id); } }}>
        <path d={lobe.d} />
        <text x={lobe.x} y={lobe.y} textAnchor="middle">{item.name}</text>
        <text className="sub" x={lobe.x} y={lobe.y + 20} textAnchor="middle">{item.alt}</text>
      </g>;
    })}
    <circle className="hc-foil-heart" cx="200" cy="200" r="37" />
    <text className="hc-foil-word" x="200" y="205" textAnchor="middle">Jerusalem</text>
  </svg>;
}

export function Senses({ sense, onSense }: { sense: Sense; onSense: (id: string) => void }) {
  const { sets, rhyme, tyndale, test, note } = D.senses;
  return <>
    <Head num="03" kicker="One word" title={<>One Jerusalem.<em> Four ways.</em></>}
      lead="What did “four senses” mean in practice? John Cassian, about 420 to 430, draws three of his four examples from this passage, then shows one city carrying all four. Choose a sense." />
    <div className="hc-senses">
      <Quatrefoil sense={sense} onSense={onSense} />
      <div className="hc-sense-read" aria-live="polite">
        <p className="hc-kicker">{sense.n} / 04 · {sense.alt}</p>
        <h3>{sense.name}</h3>
        <p className="hc-sense-asks">{sense.asks}</p>
        <dl className="hc-sense-sets">
          <div><dt>{sets[0].name}<small>{sets[0].who}</small></dt><dd>{sense.jerusalem}</dd></div>
          <div><dt>{sets[1].name}<small>{sets[1].who}</small></dt><dd>{sense.light}</dd></div>
        </dl>
        <p className="hc-caption">{note}</p>
        <Cite ids={sets.map((s) => s.source)} />
      </div>
    </div>
    <div className="hc-senses-after">
      <div>
        <p className="hc-kicker">How it was taught</p>
        <p className="hc-rhyme" lang="la">{rhyme.latin.split(" / ").map((line) => <span key={line}>{line}</span>)}</p>
        <p className="hc-para">{rhyme.english}</p>
        <p className="hc-caption">{rhyme.note}</p>
        <Cite ids={[rhyme.source]} />
      </div>
      <div>
        <p className="hc-kicker">The reply, in 1528</p>
        <p className="hc-reply">“{tyndale.quote}”</p>
        <p className="hc-para">{tyndale.more}</p>
        <p className="hc-trail-inline"><a href={tyndale.profile.href}>{tyndale.profile.label} →</a></p>
        <Cite ids={[tyndale.source]} />
      </div>
      <div>
        <Quote label="Psalm 147:12" />
        <ReaderTest test={test} kicker="Try the scheme" yes="Cassian's sense." no="Not that sense." />
      </div>
    </div>
  </>;
}
