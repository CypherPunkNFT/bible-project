// Hot seat: the session leaderboard (design §5.3, §6.6). After every turn a short table whose rows settle into their
// new order one after another with the totals counting up, and places gained or lost marked; when players have had
// different numbers of turns, turns played and the average per turn are added (shown, never used to rank). The next
// player is shown as a "You're up" card that is the button to the hand-over. The final screen uses the same table with
// one column per round.
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { formatNumber, ordinal } from "@/lib/site-format";
import { HandOver, useCountUp } from "../kit";
import type { Session } from "./game";
import { mixedLengths, unevenTurns, type Standing } from "./leaderboard";

/** A total that counts up to its value when the table opens; the real number is in the row for readers from the start. */
function Total({ value, countMs }: { value: number; countMs: number }) {
  const shown = useCountUp(value, countMs);
  if (countMs <= 0) return <strong>{formatNumber(value)}</strong>;
  return <strong data-value={value}><span className="sr-only">{formatNumber(value)}</span><span aria-hidden="true">{formatNumber(shown)}</span></strong>;
}

export function StandingsTable({ rows, rounds, byRound = false, countMs = 0 }: { rows: readonly Standing[]; rounds: number; byRound?: boolean; countMs?: number }) {
  const uneven = unevenTurns(rows);
  return <div className="hs-table-wrap">
    <table className="hs-table">
      <thead><tr>
        <th scope="col">Place</th><th scope="col">Name</th>
        {byRound && Array.from({ length: rounds }, (_, i) => <th scope="col" key={i} className="hs-num">{`Round ${i + 1}`}</th>)}
        {uneven && <th scope="col" className="hs-num">Turns played</th>}
        {uneven && <th scope="col" className="hs-num">Average per turn</th>}
        <th scope="col" className="hs-num">Total</th>
      </tr></thead>
      <tbody>{rows.map((row, i) => <tr key={row.player.id} className={`hs-standing${row.player.left ? " is-left" : ""}${row.moved > 0 ? " is-up" : ""}`} style={{ "--hs-i": i } as CSSProperties}>
        <td className="hs-place"><span className="hs-place-no">{ordinal(row.place)}</span>{row.moved > 0 && <span className="hs-up" aria-label="Moved up">▲</span>}{row.moved < 0 && <span className="hs-down" aria-label="Moved down">▼</span>}</td>
        <td className="hs-name-cell" aria-label={row.player.name}><span className="hs-cut">{row.player.name}</span>{row.player.left && <span className="hs-left-mark">left</span>}</td>
        {byRound && row.byRound.map((points, i) => <td key={i} className="hs-num">{points === null ? "–" : formatNumber(points)}</td>)}
        {uneven && <td className="hs-num">{formatNumber(row.played)}</td>}
        {uneven && <td className="hs-num">{row.average === null ? "–" : formatNumber(row.average, { maximumFractionDigits: 1 })}</td>}
        <td className="hs-num"><Total value={row.total} countMs={countMs} /></td>
      </tr>)}</tbody>
    </table>
    {uneven && <p className="hs-note">Players have had different numbers of turns, so the table is by total; the average is shown beside it.</p>}
  </div>;
}

interface BetweenProps {
  session: Session;
  rows: readonly Standing[];
  /** The next player's name, or null when the game is over and the button opens the final standings. */
  nextName: string | null;
  onNext: () => void;
}

export function BetweenTurns({ session, rows, nextName, onNext }: BetweenProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  return <section className="hs-between" aria-labelledby="hs-standings-title">
    <h2 id="hs-standings-title" ref={heading} tabIndex={-1}>Standings</h2>
    {mixedLengths(session) && <p className="hs-note">Turns of different lengths were played.</p>}
    <StandingsTable rows={rows} rounds={session.rounds} countMs={700} />
    <div className="hs-next">
      {nextName === null
        ? <button type="button" className="hs-primary hs-big" onClick={onNext}>Final standings<ArrowRight size={18} aria-hidden="true" /></button>
        : <button type="button" className="hs-next-card" onClick={onNext}>
          <HandOver name={nextName} tone="var(--history)">
            <span className="hs-primary hs-big hs-next-go">Next player<ArrowRight size={18} aria-hidden="true" /></span>
          </HandOver>
        </button>}
    </div>
  </section>;
}
