// The leader's projector screens, one per phase (design.md 5.1): lobby, read, answer, reveal, leaderboard and podium,
// each drawn from the room's snapshot. Made to be read from ten metres away. Redesigned from the visual audit
// (docs/visual-audits/live-quiz.md): names pop into the lobby as they join, the countdown is a ring that turns red, the
// vote bars grow up the tiles at the reveal, the leaderboard is bars that grow and rows that slide, and the podium rises
// third, second, first with a crown and one burst for the winner.
import { ArrowDown, ArrowUp, Crown, Expand } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { readTime } from "@/lib/live-quiz/engine";
import type { HostView, PlayerRow } from "@/lib/live-quiz/protocol";
import { formatNumber, ordinal, plural } from "@/lib/site-format";
import type { TestQuestion } from "@/pages/questions/test/engine";
import { VerseWords } from "@/pages/questions/test/parts";
import { Confetti, Podium, StreakFlame, TimerBar, useCountUp } from "../kit";
import { byJoinOrder, medalFor, PLACE_TONES, shareOfTop, slideFrom } from "./display";
import { groupedCode } from "./leader";
import { Badge, Drain, OptionTile, type OptionState } from "./parts";
import { play } from "./sound";
import { seconds, useCountdown } from "./useRoomSocket";

const placeOf = (p: Pick<PlayerRow, "rank" | "tied">) => (p.tied ? `=${ordinal(p.rank)}` : ordinal(p.rank));

export interface LobbyProps {
  view: HostView;
  onKick: (player: PlayerRow) => void;
  /** The order players were first seen in (display.ts joinOrder), kept by the room across messages. */
  seen?: Map<string, number>;
  /** Puts the stage on the projector; left out where the browser cannot (iPhones). */
  onProjector?: () => void;
}

export function Lobby({ view, onKick, seen = new Map(), onProjector }: LobbyProps) {
  const [qr, setQr] = useState<string | null>(null);
  const joinUrl = `${window.location.origin}/play/${view.code}`;
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(joinUrl, { width: 320, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1f1b16", light: "#ffffff" } })
      .then((value) => { if (active) setQr(value); })
      .catch((error: unknown) => console.warn("live-quiz: the QR code could not be drawn", error));
    return () => { active = false; };
  }, [joinUrl]);
  const players = byJoinOrder(view.players, seen);
  return <div className="lq-lobby-screen">
    {onProjector && <button type="button" className="lq-button lq-projector" onClick={onProjector}><Expand size={18} aria-hidden="true" />Show on projector</button>}
    <div className="lq-lobby">
      <div>
        <p className="lq-join">Go to <b>{`${window.location.host}/play`}</b> and enter</p>
        <p className="lq-code" aria-label={`Game code ${view.code}`}>{groupedCode(view.code)}</p>
        {view.locked && <p className="lq-warn">Joining is locked.</p>}
      </div>
      {qr && <img className="lq-qr" src={qr} alt={`QR code that opens ${joinUrl}`} />}
    </div>
    <p className="lq-count" key={view.players.length}>{plural(view.players.length, "{n} player", "{n} players")}</p>
    {view.players.length === 0 && <p className="lq-note">Names appear here as players join. Click a name to remove that player.</p>}
    <ul className="lq-tiles" aria-label="Players">
      {players.map((p) => <li key={p.id} className="lq-arrival">
        <button type="button" className="lq-tile" data-offline={!p.connected} onClick={() => onKick(p)} title={`Remove ${p.name}`}><Badge name={p.name} /><span dir="auto">{p.name}</span></button>
      </li>)}
    </ul>
  </div>;
}

function QuestionHead({ view }: { view: HostView }) {
  const q = view.question!;
  const long = q.text.length + (q.leadIn ? q.leadIn.question.length : 0) > 140;
  return <>
    <p className="lq-qnum">{`Question ${view.index + 1} of ${view.total}`}{view.paused && <span>{" · "}Paused</span>}</p>
    {q.leadIn && <p className="lq-leadin" dir="auto">{`${q.leadIn.question} — ${q.leadIn.answer}`}</p>}
    <h2 className={long ? "lq-question lq-small" : "lq-question"} dir="auto">{q.text}</h2>
  </>;
}

export function ReadScreen({ view, offset }: { view: HostView; offset: number }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  const total = readTime({ ...view.question!, correct: 0 });
  return <><QuestionHead view={view} /><Drain left={left} total={total} /></>;
}

/** A soft tick for each of the last five seconds, when sound is on and the clock is running. */
function useTicks(secs: number, on: boolean, paused: boolean) {
  const last = useRef(secs);
  useEffect(() => {
    if (last.current !== secs && on && !paused && secs > 0 && secs <= 5) play("tick");
    last.current = secs;
  }, [secs, on, paused]);
}

export function AnswerScreen({ view, offset, sound = false }: { view: HostView; offset: number; sound?: boolean }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  const secs = seconds(left);
  useTicks(secs, sound, view.paused);
  const share = view.answered.of > 0 ? view.answered.count / view.answered.of : 0;
  return <>
    <QuestionHead view={view} />
    <div className="lq-clock">
      <TimerBar shape="ring" className="lq-big-ring" secondsLeft={secs} total={view.settings.timer} label={plural(secs, "{n} second left", "{n} seconds left")} />
      <div className="lq-answered">
        <span>{`${view.answered.count} of ${view.answered.of} answered`}</span>
        <span className="lq-answered-bar" aria-hidden="true"><span style={{ transform: `scaleX(${share})` }} /></span>
      </div>
    </div>
    <div className="lq-grid">{view.question!.options.map((text, i) => <OptionTile key={i} index={i} text={text} />)}</div>
  </>;
}

export function RevealScreen({ view, bookNames }: { view: HostView; bookNames: Record<string, string> }) {
  const q = view.question!;
  const counts = view.counts ?? [0, 0, 0, 0];
  const most = Math.max(1, ...counts);
  const state = (i: number): OptionState => (i === view.correct ? "right" : "wrong");
  return <>
    <QuestionHead view={view} />
    <div className="lq-grid">
      {q.options.map((text, i) => <OptionTile key={i} index={i} text={text} state={state(i)} share={counts[i] / most}>
        <span className="lq-tally" aria-label={plural(counts[i], "{n} player chose this", "{n} players chose this")}>{formatNumber(counts[i])}</span>
      </OptionTile>)}
    </div>
    <div className="lq-verse">
      {q.link ? <VerseWords q={{ link: q.link } as TestQuestion} bookNames={bookNames} /> : q.reference && <p>{q.reference}</p>}
    </div>
  </>;
}

function Move({ move }: { move: number | null }) {
  if (!move) return <span />;
  return move > 0
    ? <span className="lq-move-up" aria-label={`Up ${move}`}><ArrowUp size={22} aria-hidden="true" /></span>
    : <span className="lq-move-down" aria-label={`Down ${-move}`}><ArrowDown size={22} aria-hidden="true" /></span>;
}

/** A row's score counting from where it stood at the last leaderboard. */
function RowScore({ score, from }: { score: number; from: number }) {
  const shown = useCountUp(score, 900, from);
  return <span className="lq-score" role="img" aria-label={formatNumber(score)}><span aria-hidden="true">{formatNumber(shown)}</span></span>;
}

export interface RowProps {
  player: PlayerRow;
  /** Score bar against the top score, and where it grows from (the last leaderboard's share). */
  share?: number;
  fromShare?: number;
  fromScore?: number;
  move?: boolean;
  index?: number;
}

function Row({ player, share = 0, fromShare = 0, fromScore, move = true, index = 0 }: RowProps) {
  const style = { "--lq-share": share, "--lq-from": fromShare, "--lq-slide": move ? slideFrom(player.move) : 0, "--lq-i": index } as CSSProperties;
  const medal = medalFor(player.rank);
  return <li className="lq-row" style={style} data-medal={medal ?? undefined}>
    <span className="lq-rank">{placeOf(player)}</span>
    <span className="lq-row-name"><Badge name={player.name} /><span dir="auto">{player.name}</span>
      {player.streak >= 2 && <StreakFlame count={player.streak} label={plural(player.streak, "{n} in a row", "{n} in a row")} />}</span>
    {fromScore === undefined ? <span className="lq-score">{formatNumber(player.score)}</span> : <RowScore score={player.score} from={fromScore} />}
    {move ? <Move move={player.move} /> : <span />}
    <span className="lq-score-bar" aria-hidden="true"><span /></span>
  </li>;
}

export function LeaderboardScreen({ view, fromScores = new Map() }: { view: HostView; fromScores?: Map<string, number> }) {
  const top = view.players.slice(0, 5);
  const others = view.players.length - top.length;
  const best = Math.max(0, ...view.players.map((p) => p.score));
  return <>
    <p className="lq-qnum">{`After question ${view.index + 1} of ${view.total}`}</p>
    <h2 className="lq-question">Leaderboard</h2>
    <ol className="lq-rows lq-board">{top.map((p, i) => {
      const from = fromScores.get(p.id) ?? 0;
      return <Row key={p.id} player={p} index={i} share={shareOfTop(p.score, best)} fromShare={shareOfTop(from, best)} fromScore={from} />;
    })}</ol>
    {others > 0 && <p className="lq-count">{plural(others, "and one other", "and {n} others")}</p>}
  </>;
}

/** 3rd, 2nd and 1st rise one after another, with a crown and one burst for the winner; the full list only when more
 * than three played. */
export function PodiumScreen({ view }: { view: HostView }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = [1, 2, 3, 4].map((step) => setTimeout(() => setShown(step), step * 1300));
    return () => timers.forEach(clearTimeout);
  }, []);
  const teams = view.players.filter((p) => p.rank <= 3).map((p) => ({
    id: p.id, score: p.score, tone: PLACE_TONES[medalFor(p.rank) ?? 3],
    name: <span className="lq-podium-name"><Badge name={p.name} size={22} /><span dir="auto">{p.name}</span></span>,
  }));
  return <>
    <h2 className="lq-question">Final scores</h2>
    <div className="lq-podium" data-shown={Math.min(shown, 3)}>
      <Podium teams={teams} label="Podium" winnerExtra={<span className="lq-crown"><Crown size={28} aria-hidden="true" /><Confetti when={shown >= 3} count={30} reach={160} /></span>} />
    </div>
    {shown >= 4 && view.players.length > 3 && <ol className="lq-rows" aria-label="Full results">{view.players.map((p, i) => <Row key={p.id} player={p} move={false} index={i} />)}</ol>}
  </>;
}
