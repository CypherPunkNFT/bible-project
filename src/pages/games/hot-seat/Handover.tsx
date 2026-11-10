// Hot seat: the hand-over before each turn (design §6.2). Names who sits and suggests who reads; the reader taps Start.
// A player who has stepped out can be skipped this round. On a computer the turn's keys are listed here.
import { BarChart3, Menu, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { plural } from "@/lib/site-format";
import type { Player } from "./game";
import { groupInfo } from "./pool";

interface Props {
  round: number;
  rounds: number;
  /** This player's place in the round's order, from 1, and how many sit this round. */
  position: number;
  ofTurns: number;
  player: Player;
  reader: Player | null;
  seconds: number;
  /** Start can be tapped: the questions have loaded. */
  ready: boolean;
  /** Shown instead of Start while the questions load or after they failed. */
  waiting: ReactNode;
  onStart: () => void;
  onSkip: () => void;
  onStandings: () => void;
  onMenu: () => void;
}

export function Handover(props: Props) {
  const heading = useRef<HTMLParagraphElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [props.player.id, props.round]);
  return <section className="hs-handover" aria-label="Next turn">
    <p className="hs-kicker">{`Round ${props.round} of ${props.rounds} · turn ${props.position} of ${props.ofTurns}`}</p>
    <div className="hs-who">
      <span className="hs-label">In the hot seat</span>
      <p className="hs-name" ref={heading} tabIndex={-1}>{props.player.name}</p>
      <span className="hs-group">{groupInfo(props.player.group).label}</span>
    </div>
    <div className="hs-who is-reader">
      <span className="hs-label">Reading</span>
      {props.reader ? <p className="hs-reader">{props.reader.name}</p> : <p className="hs-reader">Anyone else can read.</p>}
    </div>
    <p className="hs-note">Sit facing the reader. No peeking!</p>
    {props.ready ? <button type="button" className="hs-primary hs-big" onClick={props.onStart}>
      <Play size={20} aria-hidden="true" />{plural(props.seconds, "Start {n} second", "Start {n} seconds")}
    </button> : props.waiting}
    <div className="hs-row">
      <button type="button" className="hs-secondary" onClick={props.onSkip}><SkipForward size={16} aria-hidden="true" />Skip this round</button>
      <button type="button" className="hs-secondary" onClick={props.onStandings}><BarChart3 size={16} aria-hidden="true" />Standings</button>
      <button type="button" className="hs-secondary" onClick={props.onMenu}><Menu size={16} aria-hidden="true" />Menu</button>
    </div>
    <p className="hs-keys">On a computer: → Right, ← Wrong, ↓ Pass, Backspace Undo, Esc pause.</p>
  </section>;
}
