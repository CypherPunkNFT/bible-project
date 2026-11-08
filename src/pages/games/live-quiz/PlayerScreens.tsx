// The phone's screens during a game (design.md 5.2), each drawn from the room's snapshot for this player: waiting,
// read, answer (four big buttons), locked in, result, leaderboard place, and the final screen with the night's verses.
import { Check, Flame, X } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { PlayerView } from "@/lib/live-quiz/protocol";
import { ordinal, plural } from "@/lib/site-format";
import { Drain, Mark } from "./parts";
import { useCountdown } from "./useRoomSocket";

const place = (you: PlayerView["you"]) => (you.tied ? `=${ordinal(you.rank)}` : ordinal(you.rank));

function Gap({ you }: { you: PlayerView["you"] }) {
  if (you.gapAbove === null || you.aboveName === null) return <p>You're in the lead!</p>;
  return <p>{`${plural(you.gapAbove, "{n} point", "{n} points")} behind ${you.aboveName}`}</p>;
}

function Head({ view }: { view: PlayerView }) {
  return <p className="lq-status"><span>{`Question ${view.index + 1} of ${view.total}`}</span><span>{plural(view.you.score, "{n} point", "{n} points")}</span></p>;
}

function QuestionText({ view }: { view: PlayerView }) {
  const q = view.question;
  if (!q?.text) return null;
  return <>
    {q.leadIn && <p className="lq-leadin" dir="auto">{`${q.leadIn.question} — ${q.leadIn.answer}`}</p>}
    <h2 className="lq-question" dir="auto">{q.text}</h2>
  </>;
}

export function AnswerButtons({ view, offset, pending, onAnswer }: { view: PlayerView; offset: number; pending: number | null; onAnswer: (choice: number) => void }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  const chosen = view.you.choice ?? pending;
  useEffect(() => {
    // A short buzz as the options open, where the phone can and the reader has not asked for less motion.
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(60);
  }, [view.index]);
  if (chosen !== null) {
    return <div className="lq-result">
      <div className="lq-option" data-i={chosen}><Mark index={chosen} /><span dir="auto">{view.question?.options?.[chosen]}</span></div>
      <p className="lq-big">Answer locked in</p>
    </div>;
  }
  return <>
    <QuestionText view={view} />
    <Drain left={left} total={view.settings.timer * 1000} />
    {view.paused && <p className="lq-warn">Paused</p>}
    <div className="lq-buttons">
      {(view.question?.options ?? []).map((text, i) => <button key={i} type="button" className="lq-option" data-i={i} disabled={view.paused} onClick={() => onAnswer(i)}>
        <Mark index={i} /><span dir="auto">{text}</span>
      </button>)}
    </div>
  </>;
}

function Result({ view }: { view: PlayerView }) {
  const { you } = view;
  const right = you.result?.right ?? false;
  return <div className="lq-result">
    <div className="lq-verdict" aria-hidden="true">{right ? <Check size={72} /> : <X size={72} />}</div>
    {!you.result ? <p className="lq-big">No answer</p> : right ? <p className="lq-big">Right!</p> : <p className="lq-big">Not this time</p>}
    {right && <p className="lq-points">{`+${you.result!.points}`}</p>}
    {you.streak >= 2 && <p><Flame size={20} aria-hidden="true" />{plural(you.streak, "{n} in a row", "{n} in a row")}</p>}
    <p>{`You're ${place(you)}`}</p>
    <Gap you={you} />
  </div>;
}

function Final({ view }: { view: PlayerView }) {
  const verses = (view.verses ?? []).filter((v) => v.link);
  return <div>
    <h1>Thanks for playing!</h1>
    <p className="lq-big">{`You finished ${place(view.you)} with ${plural(view.you.score, "{n} point", "{n} points")}.`}</p>
    {verses.length > 0 && <>
      <h2>Read the verses from tonight</h2>
      <ol className="lq-verses">{verses.map((v, i) => <li key={i}>
        <Link to={`/read/bsb/${v.link!.book}/${v.link!.chapter}${v.link!.verse ? `?v=${v.link!.verse}` : ""}`}>{v.reference ?? `${v.link!.book} ${v.link!.chapter}`}</Link>
      </li>)}</ol>
    </>}
  </div>;
}

export function PlayerScreen({ view, offset, pending, onAnswer }: { view: PlayerView; offset: number; pending: number | null; onAnswer: (choice: number) => void }) {
  const waiting = !view.leaderOnline && view.phase !== "podium" && view.phase !== "ended" && <p className="lq-warn">Waiting for the leader…</p>;
  switch (view.phase) {
    case "lobby":
      return <>{waiting}<p className="lq-big">{`You're in, ${view.you.name}! Look for your name on the screen.`}</p></>;
    case "read":
      return <>{waiting}<Head view={view} /><QuestionText view={view} /><p className="lq-big">Read it on the screen</p></>;
    case "answer":
      return <>{waiting}<Head view={view} /><AnswerButtons view={view} offset={offset} pending={pending} onAnswer={onAnswer} /></>;
    case "reveal":
      return <>{waiting}<Head view={view} /><Result view={view} /></>;
    case "leaderboard":
      return <>{waiting}<Head view={view} /><div className="lq-result"><p className="lq-big">{`You're ${place(view.you)}`}</p><Gap you={view.you} /></div></>;
    case "podium":
      return <Final view={view} />;
    case "ended":
      return <p className="lq-big">This game has ended.</p>;
  }
}
