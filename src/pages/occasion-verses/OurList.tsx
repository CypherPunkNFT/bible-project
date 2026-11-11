// "Our list" (design 8): the passages ticked on any occasion, in the visitor's order, with up, down and remove, and two
// actions: copy everything as text for a program, and print the funeral page's large-type readers' sheet. After a move
// the focus stays on the moved row's button and a polite line says where it went. Copy and Print wait for the words.
import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Paper } from "@/pages/life-events/print-sheet";
import { plural } from "@/lib/site-format";
import { CopyBox } from "./copy";
import { listAsText, useCopy, type ListEntry } from "./text";

interface OurListProps {
  entries: ListEntry[];
  move: (key: string, step: -1 | 1) => void;
  remove: (key: string) => void;
  paper: Paper;
  onPaper: (paper: Paper) => void;
  newPage: boolean;
  onNewPage: (value: boolean) => void;
  /** Null where this browser cannot print (in-app browsers). */
  onPrint: (() => void) | null;
  waiting: string | null;
}

export function OurList({ entries, move, remove, paper, onPaper, newPage, onNewPage, onPrint, waiting }: OurListProps) {
  const [moved, setMoved] = useState<{ key: string; step: -1 | 1; message: string } | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const { copy, done, manual } = useCopy();
  const ready = entries.every((entry) => entry.text !== undefined);

  useEffect(() => {
    if (moved) buttons.current.get(`${moved.key}:${moved.step}`)?.focus();
  }, [moved]);

  const onMove = (key: string, step: -1 | 1) => {
    const index = entries.findIndex((entry) => entry.key === key);
    const target = index + step;
    move(key, step);
    setMoved({ key, step, message: plural(target + 1, "Moved to place {n}", "Moved to place {n}") });
  };

  return (
    <aside id="our-list" className="ov-list" aria-labelledby="ov-list-title">
      <h2 id="ov-list-title">Our list</h2>
      {entries.length === 0 ? <p className="ov-small">Tick “Add to our list” beside a passage to add it here. The list can take passages from more than one occasion.</p> : (
        <ol className="ov-list-items">
          {entries.map((entry, index) => (
            <li key={entry.key}>
              <span className="ov-list-ref"><strong>{entry.reference}</strong>{entry.part && <small>{entry.part}</small>}</span>
              <span className="ov-list-actions">
                <button type="button" ref={(element) => { buttons.current.set(`${entry.key}:-1`, element); }} onClick={() => onMove(entry.key, -1)} disabled={index === 0} aria-label={`Move ${entry.reference} up`}><ArrowUp size={14} aria-hidden="true" /></button>
                <button type="button" ref={(element) => { buttons.current.set(`${entry.key}:1`, element); }} onClick={() => onMove(entry.key, 1)} disabled={index === entries.length - 1} aria-label={`Move ${entry.reference} down`}><ArrowDown size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => remove(entry.key)} aria-label={`Remove ${entry.reference} from our list`}>Remove</button>
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="ov-sr" role="status" aria-live="polite">{moved?.message ?? ""}</p>
      {entries.length > 0 && <>
        <fieldset className="ov-choice">
          <legend>Paper</legend>
          {(["letter", "a4"] as const).map((item) => (
            <label key={item}>
              <input type="radio" name="ov-list-paper" value={item} checked={paper === item} onChange={() => onPaper(item)} />
              {item === "letter" ? <span>US Letter</span> : <span>A4</span>}
            </label>
          ))}
        </fieldset>
        <label className="ov-check"><input type="checkbox" checked={newPage} onChange={(changed) => onNewPage(changed.target.checked)} /> Start each reading on a new page</label>
        <div className="ov-actions">
          {onPrint ? <button type="button" className="ov-primary" disabled={!ready || Boolean(waiting)} onClick={onPrint}>{!ready ? "Waiting for the words…" : waiting ?? "Print readers' sheet"}</button>
            : <p className="ov-small">To print, open this page in your browser.</p>}
          <button type="button" disabled={!ready} onClick={() => copy(listAsText(entries), "The list is copied as text.")}>Copy as text</button>
        </div>
        {done && <p className="ov-small" role="status">{done}</p>}
        <CopyBox text={manual} />
      </>}
    </aside>
  );
}
