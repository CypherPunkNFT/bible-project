// The phone's screens during a game (design.md 5.2), each drawn from the room's snapshot for this player: waiting,
// read, answer (four big buttons), locked in, result, leaderboard place, and the final screen with the night's verses.
// Redesigned from the visual audit (docs/visual-audits/live-quiz.md): the whole phone floods with the chosen colour
// while waiting, green or red at the reveal, the points count up, a wrong answer is told the right one, and the end
// shows a medal or the place very large. Every state is in the page at once; the motion only decorates it.
import { Award, Check, X } from "lucide-react";
import { useContext, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CatalogContext } from "@/lib/catalog";
import type { PlayerView } from "@/lib/live-quiz/protocol";
import { formatNumber, ordinal, plural } from "@/lib/site-format";
import { StreakFlame, TimerBar, useCountUp } from "../kit";
import { fullReference, medalFor, PLACE_TONES } from "./display";
import { identityOf } from "./identity";
import { Badge, GameLayer, Mark } from "./parts";
import { seconds, useCountdown } from "./useRoomSocket";

const OPTION_TONES = ["var(--lq-a)", "var(--lq-b)", "var(--lq-c)", "var(--lq-d)"];
const place = (you: PlayerView["you"]) => (you.tied ? `=${ordinal(you.rank)}` : ordinal(you.rank));

function Gap({ you }: { you: PlayerView["you"] }) {
  if (you.gapAbove === null || you.aboveName === null) return <p className="lq-gap">You're in the lead!</p>;
  return <p className="lq-gap"><span>{plural(you.gapAbove, "{n} point behind", "{n} points behind")}</span> <span className="lq-name" dir="auto">{you.aboveName}</span></p>;
}

/** The top bar: your symbol and name all game, the question number and your points. */
function Head({ view }: { view: PlayerView }) {
  return <header className="lq-status">
    <span className="lq-me"><Badge name={view.you.name} /><span className="lq-name" dir="auto">{view.you.name}</span></span>
    <span>{`Question ${view.index + 1} of ${view.total}`}</span>
    <span className="lq-status-score">{plural(view.you.score, "{n} point", "{n} points")}</span>
  </header>;
}

function QuestionText({ view }: { view: PlayerView }) {
  const q = view.question;
  if (!q?.text) return null;
  return <>
    {q.leadIn && <p className="lq-leadin" dir="auto">{`${q.leadIn.question} — ${q.leadIn.answer}`}</p>}
    <h2 className="lq-question" dir="auto">{q.text}</h2>
  </>;
}

/** A ring that empties as the time runs; the total is the longest time this question has shown, so no bank is needed. */
function Ring({ view, offset }: { view: PlayerView; offset: number }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  const total = useRef({ index: view.index, ms: 0 });
  if (total.current.index !== view.index) total.current = { index: view.index, ms: 0 };
  if (left !== null && left > total.current.ms) total.current.ms = left;
  const secs = seconds(left);
  return <TimerBar shape="ring" className="lq-ring" secondsLeft={secs} total={Math.max(1, Math.ceil(total.current.ms / 1000))} warnAt={1} label={plural(secs, "{n} second left", "{n} seconds left")} />;
}

/** The reading beat: the question (when the leader lets phones show it) and a get-ready ring, so the buttons never
 * arrive without warning; no longer told to "read it on the screen" while the screen is right there on the phone. */
function ReadScreen({ view, offset }: { view: PlayerView; offset: number }) {
  return <div className="lq-read">
    <QuestionText view={view} />
    {!view.question?.text && <p className="lq-big">Read it on the screen</p>}
    <div className="lq-ready"><Ring view={view} offset={offset} /><span className="lq-ready-word">Get ready</span></div>
  </div>;
}

export function AnswerButtons({ view, offset, pending, onAnswer }: { view: PlayerView; offset: number; pending: number | null; onAnswer: (choice: number) => void }) {
  const left = useCountdown(view.closesAt, offset, view.paused ? view.remaining : null);
  const chosen = view.you.choice ?? pending;
  useEffect(() => {
    // A short buzz as the options open, where the phone can and the reader has not asked for less motion.
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) navigator.vibrate?.(60);
  }, [view.index]);
  if (chosen !== null) {
    return <div className="lq-result lq-locked" data-i={chosen}>
      <div className="lq-option lq-chosen" data-i={chosen}><Mark index={chosen} /><span dir="auto">{view.question?.options?.[chosen]}</span></div>
      <p className="lq-big">Answer locked in</p>
      <p className="lq-waiting" role="status">Waiting for the others…</p>
    </div>;
  }
  const secs = seconds(left);
  return <>
    <QuestionText view={view} />
    <TimerBar className="lq-phone-timer" secondsLeft={secs} total={view.settings.timer} label={plural(secs, "{n} second left", "{n} seconds left")} />
    {view.paused && <p className="lq-warn">Paused</p>}
    <div className="lq-buttons">
      {(view.question?.options ?? []).map((text, i) => <button key={i} type="button" className="lq-option" data-i={i} style={{ "--lq-i": i } as CSSProperties} disabled={view.paused} onClick={() => onAnswer(i)}>
        <Mark index={i} /><span dir="auto">{text}</span>
      </button>)}
    </div>
  </>;
}

/** "+850" counting up from zero; the real figure is the label from the first render. */
function Points({ points }: { points: number }) {
  const shown = useCountUp(points, 700);
  return <p className="lq-points" role="img" aria-label={`+${formatNumber(points)}`}><span aria-hidden="true">{`+${formatNumber(shown)}`}</span></p>;
}

function Result({ view }: { view: PlayerView }) {
  const { you } = view;
  const right = you.result?.right ?? false;
  const answered = you.result !== null;
  const correct = view.correct;
  return <div className="lq-result" data-verdict={!answered ? "none" : right ? "right" : "wrong"}>
    <div className="lq-verdict" aria-hidden="true">{right ? <Check size={88} strokeWidth={2.5} /> : <X size={88} strokeWidth={2.5} />}</div>
    {!answered ? <p className="lq-big">No answer</p> : right ? <p className="lq-big">Right!</p> : <p className="lq-big">Not this time</p>}
    {right && <Points points={you.result!.points} />}
    {!right && correct !== null && <p className="lq-itwas"><span>It was</span><span className="lq-option lq-itwas-tile" data-i={correct}><Mark index={correct} /><span dir="auto">{view.question?.options?.[correct]}</span></span></p>}
    {you.streak >= 2 && <p className="lq-streak"><StreakFlame count={you.streak} label={plural(you.streak, "{n} in a row", "{n} in a row")} /><span>{plural(you.streak, "{n} in a row", "{n} in a row")}</span></p>}
    <p className="lq-place-line"><span>You're</span> <strong>{place(you)}</strong></p>
    <Gap you={you} />
  </div>;
}

function Standing({ view }: { view: PlayerView }) {
  const { tone } = identityOf(view.you.name);
  return <div className="lq-result lq-standing">
    <p className="lq-label">Your place</p>
    <p className="lq-place-big" style={{ "--lq-tone": tone } as CSSProperties}>{place(view.you)}</p>
    <Gap you={view.you} />
    {view.you.streak >= 2 && <p className="lq-streak"><StreakFlame count={view.you.streak} label={plural(view.you.streak, "{n} in a row", "{n} in a row")} /><span>{plural(view.you.streak, "{n} in a row", "{n} in a row")}</span></p>}
  </div>;
}

/** The end: a medal for the first three places, the place very large for everyone else, the score counting up, and the
 * night's verses with their books written out in full. */
function Final({ view }: { view: PlayerView }) {
  const books = useContext(CatalogContext)?.books ?? [];
  const verses = (view.verses ?? []).filter((v) => v.link);
  const medal = medalFor(view.you.rank);
  const tone = medal ? PLACE_TONES[medal] : identityOf(view.you.name).tone;
  const shown = useCountUp(view.you.score, 900);
  return <div className="lq-final" data-medal={medal ?? undefined}>
    <p className="lq-label">Thanks for playing!</p>
    <div className="lq-final-place" style={{ "--lq-tone": tone } as CSSProperties}>
      {medal && <Award className="lq-medal" size={64} strokeWidth={1.6} aria-hidden="true" />}
      <p className="lq-place-big">{place(view.you)}</p>
      <p className="lq-me lq-final-name"><Badge name={view.you.name} /><span className="lq-name" dir="auto">{view.you.name}</span></p>
    </div>
    <p className="lq-final-score" role="img" aria-label={plural(view.you.score, "{n} point", "{n} points")}><span aria-hidden="true">{formatNumber(shown)}</span><span className="lq-label" aria-hidden="true">points</span></p>
    {verses.length > 0 && <>
      <h2>Read the verses from tonight</h2>
      <ol className="lq-verses">{verses.map((v, i) => <li key={i}>
        <Link to={`/read/bsb/${v.link!.book}/${v.link!.chapter}${v.link!.verse ? `?v=${v.link!.verse}` : ""}`}>{fullReference(v.reference, v.link, books)}</Link>
      </li>)}</ol>
    </>}
  </div>;
}

/** The flood behind each phase: your chosen colour while locked in, green or red at the reveal, nothing otherwise. */
function floodFor(view: PlayerView, pending: number | null): string | undefined {
  if (view.phase === "answer") {
    const chosen = view.you.choice ?? pending;
    return chosen === null ? undefined : OPTION_TONES[chosen];
  }
  if (view.phase === "reveal") return !view.you.result ? "var(--lq-none)" : view.you.result.right ? "var(--lq-right)" : "var(--lq-wrong)";
  return undefined;
}

export function PlayerScreen({ view, offset, pending, onAnswer }: { view: PlayerView; offset: number; pending: number | null; onAnswer: (choice: number) => void }) {
  const waiting = !view.leaderOnline && view.phase !== "podium" && view.phase !== "ended" && <p className="lq-warn">Waiting for the leader…</p>;
  switch (view.phase) {
    case "lobby":
      return <>{waiting}<div className="lq-result lq-in">
        <p className="lq-big">You're in!</p>
        <p className="lq-me lq-in-name"><Badge name={view.you.name} size={40} /><span className="lq-name" dir="auto">{view.you.name}</span></p>
        <p className="lq-note">Look for your name on the screen.</p>
      </div></>;
    case "read":
      return <>{waiting}<Head view={view} /><ReadScreen view={view} offset={offset} /></>;
    case "answer":
      return <>{waiting}<Head view={view} /><AnswerButtons view={view} offset={offset} pending={pending} onAnswer={onAnswer} /></>;
    case "reveal":
      return <>{waiting}<Head view={view} /><Result view={view} /></>;
    case "leaderboard":
      return <>{waiting}<Head view={view} /><Standing view={view} /></>;
    case "podium":
      return <Final view={view} />;
    case "ended":
      return <p className="lq-big">This game has ended.</p>;
  }
}

/** The phone's game in its fixed layer, flooded for the phase. */
export function PlayerLayer({ view, offset, pending, onAnswer, children }: { view: PlayerView; offset: number; pending: number | null; onAnswer: (choice: number) => void; children?: ReactNode }) {
  return <GameLayer tone={floodFor(view, pending)} label="Live quiz">
    {children}
    <PlayerScreen view={view} offset={offset} pending={pending} onAnswer={onAnswer} />
  </GameLayer>;
}
