// Hot seat: the final standings (design §5.3, §6.7), in the site's layout. The top three in large type, the full table
// with a column per round, the two shout-outs, and "All questions tonight": every question of the session, grouped by
// turn, windowed with the site's useRowWindow (about 50 rows drawn above and below the screen, no "load more").
import { Plus, RotateCcw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatList, ordinal, plural } from "@/lib/site-format";
import { useRowWindow } from "@/lib/useRowWindow";
import { missedTurns, scoreOf, type Asked, type Session } from "./game";
import { groupInfo } from "./pool";
import { AskedRow, MarkBadge } from "./Recap";
import { StandingsTable } from "./Standings";
import { shoutOuts, standings, type ShoutOut } from "./leaderboard";

interface Props { session: Session; onAnotherRound: () => void; onNewGame: () => void; onChangePlayers: () => void }

export function Final({ session, onAnotherRound, onNewGame, onChangePlayers }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, []);
  const rows = useMemo(() => standings(session), [session]);
  const top = [1, 2, 3].map((place) => ({ place, names: rows.filter((r) => r.place === place).map((r) => r.player.name) })).filter((t) => t.names.length);
  const shouts = shoutOuts(session);
  const missed = session.ended ? missedTurns(session) : [];
  return <section className="hs-final" aria-labelledby="hs-final-title">
    <h1 id="hs-final-title" ref={heading} tabIndex={-1}>Final standings</h1>
    {rows.some((r) => r.played > 0) && <ol className="hs-podium">{top.map((t) => <li key={t.place}>
      <span className="hs-podium-place">{ordinal(t.place)}</span><strong className="hs-podium-names">{formatList(t.names)}</strong>
    </li>)}</ol>}
    {missed.length > 0 && <p className="hs-note"><span>The game ended before these players had their turn this round:</span> <span>{formatList(missed.map((p) => p.name))}</span></p>}
    <StandingsTable rows={rows} rounds={session.rounds} byRound />
    <div className="hs-shouts">
      <Shout title="Best single turn" shout={shouts.bestTurn} unit={(n) => plural(n, "{n} point", "{n} points")} />
      <Shout title="Longest run of right answers" shout={shouts.longestRun} unit={(n) => plural(n, "{n} in a row", "{n} in a row")} />
    </div>
    <div className="hs-row">
      <button type="button" className="hs-primary" onClick={onAnotherRound}><Plus size={16} aria-hidden="true" />Play another round</button>
      <button type="button" className="hs-secondary" onClick={onNewGame}><RotateCcw size={16} aria-hidden="true" />New game, same players</button>
      <button type="button" className="hs-secondary" onClick={onChangePlayers}><Users size={16} aria-hidden="true" />Change players</button>
    </div>
    <AllQuestions session={session} />
  </section>;
}

function Shout({ title, shout, unit }: { title: string; shout: ShoutOut | null; unit: (n: number) => string }) {
  if (!shout) return null;
  return <div className="hs-shout">
    <h2>{title}</h2>
    <p className="hs-shout-value">{unit(shout.value)}</p>
    <ul>{shout.who.map((w) => <li key={`${w.player.id}-${w.group}`}><span className="hs-cut">{w.player.name}</span> <span className="hs-tag">{groupInfo(w.group).label}</span></li>)}</ul>
  </div>;
}

type Row = { kind: "turn"; key: string; round: number; name: string; score: number } | { kind: "question"; key: string; asked: Asked };

function AllQuestions({ session }: { session: Session }) {
  const rows = useMemo<Row[]>(() => session.turns.flatMap((turn, t) => turn.skipped ? [] : [
    { kind: "turn" as const, key: `t${t}`, round: turn.round, name: session.players.find((p) => p.id === turn.playerId)?.name ?? "", score: scoreOf(turn.questions) },
    ...turn.questions.map((asked, i) => ({ kind: "question" as const, key: `t${t}q${i}`, asked })),
  ]), [session]);
  const [container, setContainer] = useState<HTMLOListElement | null>(null);
  const rowOf = useMemo(() => new Map(rows.map((row, i) => [row.key, i])), [rows]);
  const rowKey = useCallback((i: number) => rows[i].key, [rows]);
  const rowOfAnchor = useCallback((key: string) => rowOf.get(key), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: 72, gap: 0,
    scroller: "window", container, dataVersion: rows.length });
  if (rows.length === 0) return null;
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k);
  return <section className="hs-all" aria-labelledby="hs-all-title">
    <h2 id="hs-all-title">All questions tonight</h2>
    <ol ref={setContainer} className="hs-all-list" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((i) => {
        const row = rows[i];
        if (row.kind === "turn") return <li key={row.key} data-row={i} className="hs-all-turn">
          <span className="hs-label">{`Round ${row.round}`}</span> <span className="hs-cut">{row.name}</span> <span>{plural(row.score, "{n} point", "{n} points")}</span>
        </li>;
        return <li key={row.key} data-row={i} className={`hs-recap-row is-${row.asked.mark ?? "open"}`}>
          <span className="hs-mark-cycle is-static"><MarkBadge mark={row.asked.mark} /></span>
          <AskedRow asked={row.asked} />
        </li>;
      })}
    </ol>
  </section>;
}
