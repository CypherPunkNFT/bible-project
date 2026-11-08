// The leader's projector screens, one per phase (design.md 5.1): lobby, read, answer, reveal, leaderboard and podium,
// each drawn from the room's snapshot. Made to be read from ten metres away.
import { ArrowDown, ArrowUp, Flame } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { readTime } from "@/lib/live-quiz/engine";
import type { HostView, PlayerRow } from "@/lib/live-quiz/protocol";
import { ordinal, plural } from "@/lib/site-format";
import type { TestQuestion } from "@/pages/questions/test/engine";
import { VerseWords } from "@/pages/questions/test/parts";
import { groupedCode } from "./leader";
import { Drain, OptionTile, type OptionState } from "./parts";
import { seconds, useCountdown } from "./useRoomSocket";

const placeOf = (p: Pick<PlayerRow, "rank" | "tied">) => (p.tied ? `=${ordinal(p.rank)}` : ordinal(p.rank));

export function Lobby({ view, onKick }: { view: HostView; onKick: (player: PlayerRow) => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const joinUrl = `${window.location.origin}/play/${view.code}`;
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(joinUrl, { width: 320, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1f1b16", light: "#ffffff" } })
      .then((value) => { if (active) setQr(value); })
      .catch((error: unknown) => console.warn("live-quiz: the QR code could not be drawn", error));
    return () => { active = false; };
  }, [joinUrl]);
  return <div>
    <div className="lq-lobby">
      <div>
        <p className="lq-join">Go to <b>{`${window.location.host}/play`}</b> and enter</p>
        <p className="lq-code" aria-label={`Game code ${view.code}`}>{groupedCode(view.code)}</p>
        {view.locked && <p className="lq-warn">Joining is locked.</p>}
      </div>
      {qr && <img className="lq-qr" src={qr} alt={`QR code that opens ${joinUrl}`} />}
    </div>
    <p className="lq-count">{plural(view.players.length, "{n} player", "{n} players")}</p>
    {view.players.length === 0 && <p className="lq-note">Names appear here as players join. Click a name to remove that player.</p>}
    <ul className="lq-tiles" aria-label="Players">
      {view.players.map((p) => <li key={p.id}>
        <button type="button" className="lq-tile" data-offline={!p.connected} onClick={() => onKick(p)} title={`Remove ${p.name}`}>{p.name}</button>
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

export function AnswerScreen({ view, offset }: { view: HostView; offset: number }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  return <>
    <QuestionHead view={view} />
    <div className="lq-clock">
      <strong aria-label={plural(seconds(left), "{n} second left", "{n} seconds left")}>{seconds(left)}</strong>
      <span>{`${view.answered.count} of ${view.answered.of} answered`}</span>
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
      {q.options.map((text, i) => <OptionTile key={i} index={i} text={text} state={state(i)}>
        <span className="lq-tally" aria-label={plural(counts[i], "{n} player chose this", "{n} players chose this")}>{counts[i]}</span>
        <span className="lq-tally-bar" style={{ width: `${(counts[i] / most) * 100}%` }} />
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
    ? <span className="lq-move-up" aria-label={`Up ${move}`}><ArrowUp size={20} aria-hidden="true" /></span>
    : <span className="lq-move-down" aria-label={`Down ${-move}`}><ArrowDown size={20} aria-hidden="true" /></span>;
}

function Row({ player, move = true }: { player: PlayerRow; move?: boolean }) {
  return <li className="lq-row">
    <span className="lq-rank">{placeOf(player)}</span>
    <span dir="auto">{player.name}{player.streak >= 2 && <Flame size={18} aria-label={`Streak of ${player.streak}`} />}</span>
    <span className="lq-score">{player.score}</span>
    {move ? <Move move={player.move} /> : <span />}
  </li>;
}

export function LeaderboardScreen({ view }: { view: HostView }) {
  const top = view.players.slice(0, 5);
  const others = view.players.length - top.length;
  return <>
    <p className="lq-qnum">{`After question ${view.index + 1} of ${view.total}`}</p>
    <h2 className="lq-question">Leaderboard</h2>
    <ol className="lq-rows">{top.map((p) => <Row key={p.id} player={p} />)}</ol>
    {others > 0 && <p className="lq-count">{plural(others, "and one other", "and {n} others")}</p>}
  </>;
}

/** 3rd, 2nd and 1st appear one after another, then the full ranked list. */
export function PodiumScreen({ view }: { view: HostView }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = [1, 2, 3, 4].map((step) => setTimeout(() => setShown(step), step * 1300));
    return () => timers.forEach(clearTimeout);
  }, []);
  const top = view.players.filter((p) => p.rank <= 3).slice(0, 3);
  const order = [top[1], top[0], top[2]]; // 2nd, 1st, 3rd from left to right
  const revealAt = (p: PlayerRow | undefined) => (p ? 4 - Math.min(p.rank, 3) : 0); // 3rd first, 1st last
  return <>
    <h2 className="lq-question">Final scores</h2>
    <div className="lq-podium">
      {order.map((p, i) => p ? <div key={p.id} className="lq-step" data-place={Math.min(p.rank, 3)} data-hidden={shown < revealAt(p)}>
        <span className="lq-rank">{placeOf(p)}</span><strong dir="auto">{p.name}</strong><span>{p.score}</span>
      </div> : <div key={`empty-${i}`} />)}
    </div>
    {shown >= 4 && <ol className="lq-rows" aria-label="Full results">{view.players.map((p) => <Row key={p.id} player={p} move={false} />)}</ol>}
  </>;
}
