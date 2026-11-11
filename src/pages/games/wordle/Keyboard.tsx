// The on-screen keyboard (design §9.1): QWERTY in three rows, Enter at the left of the bottom row and Backspace at the
// right. Keys take their colour only once the board row has finished turning (Play hands over the marks then), and a
// key that has just taken a colour gives one small pulse, so the keyboard colours in as the board does. A clicked key
// gives up focus, so a physical Enter afterwards submits the row instead of pressing that key again.
import { Delete } from "lucide-react";
import { memo, useRef, type MouseEvent } from "react";
import { markLabel } from "./text";
import type { Mark } from "./evaluate";

export type KeyName = string | "enter" | "back";

const ROWS: readonly (readonly KeyName[])[] = [
  [..."qwertyuiop"],
  [..."asdfghjkl"],
  ["enter", ..."zxcvbnm", "back"],
];

/** How long a key that has just taken a colour keeps its pulse class. */
const LIT_MS = 700;

interface KeyboardProps { marks: ReadonlyMap<string, Mark>; onKey: (key: KeyName) => void }

export const Keyboard = memo(function Keyboard({ marks, onKey }: KeyboardProps) {
  // The marks the keys showed last time: a key whose mark has just changed pulses once (never on the first render).
  // The pulse is remembered for a moment, so a redraw in between (the clock ticks every second) does not cut it short.
  const shown = useRef<ReadonlyMap<string, Mark> | null>(null);
  const litUntil = useRef(new Map<string, number>());
  const now = Date.now();
  if (shown.current !== marks) {
    for (const [key, mark] of marks) if (shown.current !== null && shown.current.get(key) !== mark) litUntil.current.set(key, now + LIT_MS);
    shown.current = marks;
  }
  const press = (key: KeyName) => (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    onKey(key);
  };
  return <div className="bw-keyboard" role="group" aria-label="Keyboard">
    {ROWS.map((row, r) => <div key={r} className="bw-keys">
      {row.map((key) => {
        if (key === "enter") return <button key={key} type="button" className="bw-key bw-key-wide" onClick={press(key)}>Enter</button>;
        if (key === "back") return <button key={key} type="button" className="bw-key bw-key-wide" onClick={press(key)} aria-label="Backspace"><Delete size={20} aria-hidden="true" /></button>;
        const mark = marks.get(key);
        const fresh = (litUntil.current.get(key) ?? 0) > now;
        return <button key={key} type="button" className={`bw-key${mark ? ` bw-${mark}` : ""}${fresh ? " bw-key-lit" : ""}`} onClick={press(key)}
          aria-label={mark ? markLabel(key, mark) : key.toUpperCase()}>{key.toUpperCase()}</button>;
      })}
    </div>)}
  </div>;
});
