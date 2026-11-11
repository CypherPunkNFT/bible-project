// Hot seat: the hand-over before each turn (design §6.2). Names who sits and suggests who reads; the reader taps Start.
// The chair and stopwatch from the start page's drawing stand faded behind the name like a spotlight; the name rises
// in and Start follows a beat later (decoration only: every button works from the first frame). A player who has
// stepped out can be skipped this round. On a computer the turn's keys are listed here.
import { BarChart3, Menu, Play, SkipForward } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { plural } from "@/lib/site-format";
import { GAME_ART, GameArtImage } from "../art";
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

/** Each block rises in a beat after the one above it. */
const beat = (i: number) => ({ "--hs-i": i } as CSSProperties);

export function Handover(props: Props) {
  const heading = useRef<HTMLParagraphElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [props.player.id, props.round]);
  return <section className="hs-handover" aria-label="Next turn" key={`${props.round}-${props.player.id}`}>
    <div className="hs-spot" aria-hidden="true"><GameArtImage art={GAME_ART.hotSeat} className="hs-spot-art" /></div>
    <p className="hs-kicker hs-rise" style={beat(0)}>{`Round ${props.round} of ${props.rounds} · turn ${props.position} of ${props.ofTurns}`}</p>
    <div className="hs-who hs-rise" style={beat(1)}>
      <span className="hs-label">In the hot seat</span>
      <p className="hs-name" ref={heading} tabIndex={-1}>{props.player.name}</p>
      <span className="hs-group">{groupInfo(props.player.group).label}</span>
    </div>
    <div className="hs-who is-reader hs-rise" style={beat(2)}>
      <span className="hs-label">Reading</span>
      {props.reader ? <p className="hs-reader">{props.reader.name}</p> : <p className="hs-reader">Anyone else can read.</p>}
    </div>
    <p className="hs-note hs-rise" style={beat(3)}>Sit facing the reader. No peeking!</p>
    <div className="hs-rise" style={beat(4)}>
      {props.ready ? <button type="button" className="hs-primary hs-big" onClick={props.onStart}>
        <Play size={20} aria-hidden="true" />{plural(props.seconds, "Start {n} second", "Start {n} seconds")}
      </button> : props.waiting}
    </div>
    <div className="hs-row hs-rise" style={beat(5)}>
      <button type="button" className="hs-secondary" onClick={props.onSkip}><SkipForward size={16} aria-hidden="true" />Skip this round</button>
      <button type="button" className="hs-secondary" onClick={props.onStandings}><BarChart3 size={16} aria-hidden="true" />Standings</button>
      <button type="button" className="hs-secondary" onClick={props.onMenu}><Menu size={16} aria-hidden="true" />Menu</button>
    </div>
    <p className="hs-keys">On a computer: → Right, ← Wrong, ↓ Pass, Backspace Undo, Esc pause.</p>
  </section>;
}
