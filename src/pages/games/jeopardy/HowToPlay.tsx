// Bible Jeopardy's rules panel (design 9.8): choosing, answering, steals, penalties, the Daily Double and the Final as
// this game is set up, plus the keyboard keys. It can be printed.
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Settings } from "./model";

interface Props { settings: Settings; onClose: () => void; onPrint: () => void }

export function Rules({ settings }: { settings: Settings }) {
  return <>
    <h2>How to play</h2>
    <ul>
      <li>{settings.answering === "turns"
        ? "Teams take turns to choose a category and a value. The choosing team answers first; if it is wrong, any other team may steal for the full value."
        : "A team chooses a category and a value, then any team may answer: the host picks whoever was first. A right answer chooses the next tile."}</li>
      <li>{settings.choices ? "The clue comes with four choices." : "The clue comes alone: answer out loud, and the host judges."}</li>
      <li>{settings.penalty ? "A wrong answer loses the tile's value." : "A wrong answer costs nothing."}</li>
      {settings.dailyDouble && <li>One tile hides a Daily Double. Only the team that found it answers, after betting from 0 up to its score or 500. Right adds the bet, wrong takes it off.</li>}
      {settings.final && <li>The Final question: every team writes a bet on paper, from 0 up to its score, then answers the last clue. Right adds the bet, wrong takes it off.</li>}
      <li>The host can undo any mistake, change a score, or make another team choose.</li>
    </ul>
    <h3>Keys</h3>
    <dl className="jp-keys">
      <dt>Arrows, Enter</dt><dd>Move round the board, open a tile</dd>
      <dt>Space</dt><dd>Open a tile, show the answer, back to the board</dd>
      <dt>1 to 6</dt><dd>That team is right</dd>
      <dt>Shift with 1 to 6</dt><dd>That team is wrong</dd>
      <dt>Backspace</dt><dd>Back to the board</dd>
      <dt>Page Down, Page Up</dt><dd>A presentation clicker: forward and back</dd>
      <dt>Z</dt><dd>Undo</dd>
      <dt>F</dt><dd>Full screen</dd>
    </dl>
  </>;
}

export function HowToPlay({ settings, onClose, onPrint }: Props) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="jp-overlay" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialog} className="jp-dialog" role="dialog" aria-modal="true" aria-label="How to play" tabIndex={-1}>
      <button type="button" className="jp-icon jp-dialog-close" onClick={onClose} aria-label="Close"><X size={20} aria-hidden /></button>
      <Rules settings={settings} />
      <div className="jp-dialog-actions">
        <button type="button" className="jp-quiet" onClick={onPrint}>Print the rules</button>
        <button type="button" className="jp-primary" onClick={onClose}>Got it</button>
      </div>
    </div>
  </div>;
}
