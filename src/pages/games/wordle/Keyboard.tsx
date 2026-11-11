// The on-screen keyboard (design §9.1): QWERTY in three rows, Enter at the left of the bottom row and Backspace at the
// right. Keys colour as letters are learnt and say their state to screen readers. A clicked key gives up focus, so a
// physical Enter afterwards submits the row instead of pressing that key again.
import { Delete } from "lucide-react";
import type { MouseEvent } from "react";
import { markLabel } from "./text";
import type { Mark } from "./evaluate";

export type KeyName = string | "enter" | "back";

const ROWS: readonly (readonly KeyName[])[] = [
  [..."qwertyuiop"],
  [..."asdfghjkl"],
  ["enter", ..."zxcvbnm", "back"],
];

interface KeyboardProps { marks: ReadonlyMap<string, Mark>; onKey: (key: KeyName) => void }

export function Keyboard({ marks, onKey }: KeyboardProps) {
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
        return <button key={key} type="button" className={`bw-key${mark ? ` bw-${mark}` : ""}`} onClick={press(key)}
          aria-label={mark ? markLabel(key, mark) : key.toUpperCase()}>{key.toUpperCase()}</button>;
      })}
    </div>)}
  </div>;
}
