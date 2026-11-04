// Section 03: popes and kings, as an engraved balance over eleven rounds. The tilt is this study's stated judgement of one event, never a score,
// and each round says in words which way it leans, why, and where that stops. The list is the interface.
import { BALANCE, D, findRound, panDrop, TILT_ANGLE, TILT_WORD, type Round } from "./model";
import { Cite, Head, Picture, Quote, StandPanel, ThreeParts } from "./parts";

function Pan({ x, drop, label }: { x: number; drop: number; label: string }) {
  const [, top] = BALANCE.pivot;
  return <g className="mv-pan" style={{ transform: `translateY(${drop.toFixed(1)}px)` }}>
    <path d={`M${x} ${top}L${x - 34} ${top + 60}M${x} ${top}L${x + 34} ${top + 60}`} />
    <path d={`M${x - 38} ${top + 60}H${x + 38}C${x + 30} ${top + 84} ${x - 30} ${top + 84} ${x - 38} ${top + 60}Z`} />
    <text x={x} y={top + 54} textAnchor="middle">{label}</text>
  </g>;
}

function Balance({ round }: { round: Round }) {
  const [px, py] = BALANCE.pivot, drop = panDrop(round.tilt), left = px - BALANCE.arm, right = px + BALANCE.arm;
  return <svg className="mv-balance" viewBox="0 0 360 240" role="img" aria-label={`An engraved balance. For ${round.head} it leans: ${TILT_WORD[round.tilt].toLowerCase()}. That is this study's judgement of one event.`}>
    <path d={`M${px} ${py}V212M${px - 44} 222H${px + 44}M${px - 24} 212H${px + 24}L${px + 44} 222M${px - 24} 212L${px - 44} 222`} />
    <circle cx={px} cy={py - 8} r="5" />
    <g className="mv-beam" style={{ transform: `rotate(${TILT_ANGLE[round.tilt]}deg)`, transformOrigin: `${px}px ${py}px` }}><path d={`M${left} ${py}H${right}`} /></g>
    <Pan x={left} drop={drop.left} label="Pope" />
    <Pan x={right} drop={drop.right} label="King" />
  </svg>;
}

export function Powers({ roundId, onChange }: { roundId: string | null; onChange: (values: Record<string, string | null>) => void }) {
  const round = findRound(roundId);
  return <>
    <Head num="03" kicker="Popes and kings" title={<>Two powers claimed.<em> Neither held the whole field.</em></>}
      lead="Each side wrote out what it was owed, and each had a real weapon. Choose a round. The balance shows who this study thinks came out ahead in that one event, and no more than that." />
    <div className="mv-powers">
      <div className="mv-balancewrap" aria-live="polite"><Balance round={round} /><p className="mv-tiltword"><b>{TILT_WORD[round.tilt]}</b> · {round.when}</p><p className="mv-caption">{D.roundsNote}</p></div>
      <ol className="mv-roundlist">{D.rounds.map((r) => <li key={r.id}><button type="button" aria-pressed={r.id === round.id} onClick={() => onChange({ round: r.id })}>
        <small>{r.when}</small><span><strong>{r.head}</strong><small>{r.who}</small></span><em>{r.tilt === "level" ? "Level" : r.tilt === "pope" ? "Pope" : "King"}</em>
      </button></li>)}</ol>
    </div>
    <div className={`mv-roundrecord${round.picture ? " withpic" : ""}`}>
      <div>
        <p className="mv-kicker">{round.who}</p>
        <h3>{round.head}</h3>
        <ThreeParts evidence={round.text} inference={round.why} limit={round.limit} />
        {round.verse && <Quote label={round.verse} />}
        <Cite ids={round.sources} />
      </div>
      {round.picture && <Picture id={round.picture} />}
    </div>
    <StandPanel stand={D.powersStand} labels={D.powersStand.verses ?? []} />
  </>;
}
