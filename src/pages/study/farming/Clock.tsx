// Section 02: eight passages that keep the stone's order, each drawn on the wheel. The passages agree on the order; the months remain
// this study's placing, and each record says where the agreement stops.
import { D, findPassage, seasonNames } from "./model";
import { Head, Quote, ThreeParts } from "./parts";
import { Wheel } from "./Wheel";

export function Clock({ passageId, onPassage }: { passageId: string | null; onPassage: (id: string) => void }) {
  const passage = findPassage(passageId);
  const drawn = passage.chords ? ` Lines join ${passage.chords.map(([a, b]) => `${seasonNames([a])} to ${seasonNames([b])}`).join(", and ")}.` : "";
  return <>
    <Head num="02" kicker="The same clock" title={<>The stone gives an order.<em> Scripture keeps to it.</em></>}
      lead="None of these passages is about the calendar. Each one mentions the work in passing, and in the order the stone has it. Pick a passage to draw it on the wheel." />
    <div className="fy-clock">
      <ol className="fy-passages">{D.clock.map((p) => <li key={p.id}>
        <button type="button" aria-pressed={p.id === passage.id} onClick={() => onPassage(p.id)}><strong>{p.name}</strong><small>{p.verses.join(", ")}</small></button>
      </li>)}</ol>
      <div className="fy-clockwheel">
        <Wheel lit={passage.seasons} chords={passage.chords} centre={[passage.verses[0], passage.verses.length > 1 ? `and ${passage.verses.length - 1} more` : "on the wheel"]}
          label={`The year wheel for ${passage.name}. Lit: ${seasonNames(passage.seasons)}.${drawn}`} />
      </div>
      <div className="fy-clockrecord" aria-live="polite">
        <h3>{passage.name}</h3>
        {passage.verses.map((label) => <Quote key={label} label={label} />)}
        <ThreeParts evidence={passage.says} inference={passage.agrees} limit={passage.limit} />
      </div>
    </div>
  </>;
}
