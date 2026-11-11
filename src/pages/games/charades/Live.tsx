// Family charades: the live screen of a round (design §7.3, redesigned from the visual audit). The scene sits on a
// tinted card with the deck's name at the top and the cards left at the bottom; a thin timer bar drains across the top
// with the seconds large beside it; on an answer the card slides off in the direction of the tilt (down for got it, up
// for pass) while the flood colour shows, and the next card slides in from the far side. Every state changes at once;
// the animations only decorate it, so reduced motion loses nothing.
import { Check, EyeOff, Pause, Redo2 } from "lucide-react";
import { useLayoutEffect, useRef, type RefObject } from "react";
import { formatNumber, plural } from "@/lib/site-format";
import { TimerBar } from "../kit";
import { cardsLeft, type Scene } from "./deck";
import { leftMs, type Round } from "./game";
import type { RoundProps } from "./Round";

export interface Leaving { id: string; mark: "correct" | "pass" }

interface LiveProps extends RoundProps {
  round: Round; clock: number; feedback: "correct" | "pass" | null; leaving: Leaving | null; hidden: boolean; tiltOn: boolean; tiltLost: boolean; turn: number;
  onAnswer: (mark: "correct" | "pass") => void; onPause: () => void; onHide: () => void;
}

/** How many ticks the strip shows before it sums the rest. */
export const TICKS_SHOWN = 12;

export function Live({ scenes, round, clock, feedback, leaving, hidden, tiltOn, tiltLost, turn, pictures, mode, seconds, deckTitle, onAnswer, onPause, onHide }: LiveProps) {
  const scene = round.current ? scenes.get(round.current) : undefined;
  const secondsLeft = Math.ceil(leftMs(round, clock) / 1000);
  const score = round.rows.filter((r) => r.mark === "correct").length;
  const left = cardsLeft(round.dealer, (id) => scenes.get(id)?.story);
  const lastMark = useRef<"correct" | "pass" | null>(null);
  if (leaving) lastMark.current = leaving.mark;
  const big = !tiltOn;
  return <div className="ch-live" data-feedback={feedback ?? undefined}>
    <div className="ch-card" data-turn={turn}>
      <div className="ch-card-inner">
        <div className="ch-top">
          <TimerBar secondsLeft={secondsLeft} total={seconds} warnAt={5} label={plural(secondsLeft, "{n} second left", "{n} seconds left")} className="ch-timer" />
          <span className="ch-score-wrap">
            <span key={score} className="ch-score" aria-label={`Score ${score}`}>{formatNumber(score)}</span>
            {feedback === "correct" && <span className="ch-plus" aria-hidden="true">+1</span>}
          </span>
          <span className="ch-tools">
            {mode === "act" && <button type="button" className="ch-tool" aria-pressed={hidden} onClick={onHide}><EyeOff size={16} aria-hidden="true" />{hidden ? "Show card" : "Hide card"}</button>}
            <button type="button" className="ch-tool" onClick={onPause} aria-label="Pause"><Pause size={16} aria-hidden="true" /></button>
          </span>
        </div>
        <div className="ch-deck" data-left={Math.min(left, 3)}>
          {leaving && <LeavingCard scene={scenes.get(leaving.id)} mark={leaving.mark} deckTitle={deckTitle} picture={pictures} />}
          {scene && !hidden && <div key={scene.id} className="ch-scene-card" data-enter={lastMark.current ?? "first"}>
            <CardHead deckTitle={deckTitle} score={score} />
            <SceneCard scene={scene} picture={pictures} />
            <p className="ch-card-foot">{plural(left, "{n} card left", "{n} cards left")}</p>
          </div>}
          {hidden && !feedback && <p className="ch-hidden-note">Card hidden</p>}
        </div>
        {feedback && <p className="ch-feedback" aria-live="polite">{feedback === "correct" ? "✓ Correct!" : "↷ Pass"}</p>}
      </div>
    </div>
    {tiltLost && <p className="ch-tilt-lost" role="status">Tilt stopped; use the buttons</p>}
    <div className={`ch-answer${big ? " is-big" : ""}`}>
      <button type="button" className="ch-pass" onClick={() => onAnswer("pass")} disabled={!!feedback || !scene}><Redo2 size={20} aria-hidden="true" />Pass</button>
      <button type="button" className="ch-got" onClick={() => onAnswer("correct")} disabled={!!feedback || !scene}><Check size={20} aria-hidden="true" />Got it</button>
    </div>
  </div>;
}

/** The deck's name and a strip of ticks, one per scene got this round (the last twelve, then a sum). Decorative. */
function CardHead({ deckTitle, score }: { deckTitle: string; score: number }) {
  const shown = Math.min(score, TICKS_SHOWN);
  const more = score - shown;
  return <div className="ch-card-head">
    <span className="ch-card-deck">{deckTitle}</span>
    <span className="ch-ticks" aria-hidden="true">
      {Array.from({ length: shown }, (_, i) => <span key={i} className="ch-tick">✓</span>)}
      {more > 0 && <span className="ch-tick-more">{formatNumber(more)}</span>}
    </span>
  </div>;
}

/** The answered card on its way off the screen: a copy with no heading, hidden from readers, gone with the feedback. */
function LeavingCard({ scene, mark, deckTitle, picture }: { scene: Scene | undefined; mark: "correct" | "pass"; deckTitle: string; picture: boolean }) {
  if (!scene) return null;
  return <div className={`ch-scene-card ch-leaving is-${mark}`} aria-hidden="true">
    <div className="ch-card-head"><span className="ch-card-deck">{deckTitle}</span></div>
    <div className="ch-scene">
      {picture && scene.picture && <span className="ch-picture">{scene.picture}</span>}
      <div className="ch-title">{scene.title}</div>
    </div>
    <span className="ch-stamp">{mark === "correct" ? "✓" : "↷"}</span>
  </div>;
}

/** The scene as large as fits in three lines, never below 28 px (§7.3). Not a live region: it is never read aloud by itself. */
function SceneCard({ scene, picture }: { scene: Scene; picture: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useFitText(box, title, scene.id);
  return <div ref={box} className="ch-scene">
    {picture && scene.picture && <span className="ch-picture" aria-hidden="true">{scene.picture}</span>}
    <h2 ref={title} className="ch-title">{scene.title}</h2>
  </div>;
}

const MIN_TEXT_PX = 28;
const MAX_TEXT_PX = 160;

/** Largest font size between 28 px and the cap at which the title fits its box in at most three lines. */
function useFitText(box: RefObject<HTMLElement>, text: RefObject<HTMLElement>, key: string) {
  useLayoutEffect(() => {
    const fit = () => {
      const el = text.current;
      const area = box.current;
      if (!el || !area) return;
      let low = MIN_TEXT_PX;
      let high = MAX_TEXT_PX;
      const fits = (size: number) => {
        el.style.fontSize = `${size}px`;
        const lines = el.scrollHeight / (size * 1.15);
        return lines <= 3.2 && el.scrollWidth <= area.clientWidth + 1 && el.scrollHeight <= area.clientHeight;
      };
      if (!area.clientWidth) { el.style.fontSize = ""; return; } // no layout (tests): the CSS size stands
      while (high - low > 1) { const mid = Math.floor((low + high) / 2); if (fits(mid)) low = mid; else high = mid; }
      el.style.fontSize = `${low}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [box, text, key]);
}
