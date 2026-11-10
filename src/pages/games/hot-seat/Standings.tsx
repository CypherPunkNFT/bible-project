// Hot seat: the session leaderboard (design §5.3, §6.6). After every turn a short table with places gained or lost; when
// players have had different numbers of turns, turns played and the average per turn are added (shown, never used to
// rank). The final screen uses the same table with one column per round.
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { formatNumber, ordinal } from "@/lib/site-format";
import type { Session } from "./game";
import { mixedLengths, unevenTurns, type Standing } from "./leaderboard";

export function StandingsTable({ rows, rounds, byRound = false }: { rows: readonly Standing[]; rounds: number; byRound?: boolean }) {
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
      <tbody>{rows.map((row) => <tr key={row.player.id} className={row.player.left ? "is-left" : undefined}>
        <td>{ordinal(row.place)}{row.moved > 0 && <span className="hs-up" aria-label="Moved up">▲</span>}{row.moved < 0 && <span className="hs-down" aria-label="Moved down">▼</span>}</td>
        <td className="hs-name-cell" aria-label={row.player.name}><span className="hs-cut">{row.player.name}</span>{row.player.left && <span className="hs-left-mark">left</span>}</td>
        {byRound && row.byRound.map((points, i) => <td key={i} className="hs-num">{points === null ? "–" : formatNumber(points)}</td>)}
        {uneven && <td className="hs-num">{formatNumber(row.played)}</td>}
        {uneven && <td className="hs-num">{row.average === null ? "–" : formatNumber(row.average, { maximumFractionDigits: 1 })}</td>}
        <td className="hs-num"><strong>{formatNumber(row.total)}</strong></td>
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
    <StandingsTable rows={rows} rounds={session.rounds} />
    <div className="hs-next">
      <button type="button" className="hs-primary hs-big" onClick={onNext}>
        {nextName === null ? "Final standings" : "Next player"}<ArrowRight size={18} aria-hidden="true" />
      </button>
      {nextName !== null && <span className="hs-next-name">{nextName}</span>}
    </div>
  </section>;
}
