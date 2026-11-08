// "Our readings" on the funeral readings page (design 5.6, item 3): what the family ticked, in their order, with up and
// down buttons, and three actions: print a large-type readers' sheet, send the list to the pastor as a link, and copy
// everything as text for a funeral program. The list link holds only reading keys.
import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";
import { FUNERAL_HEADING } from "@/data/sympathy";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { PRINT_ADDRESS, SHEET_FACES } from "./print-setup";
import { listAsText, listUrl, partTitle } from "./reading-text";
import { ReadersSheet, type ReaderEntry } from "./SympathySheet";
import type { ShownSympathy } from "./useSympathyPassages";

interface ReadingsPanelProps {
  items: ShownSympathy[];
  move: (key: string, step: -1 | 1) => void;
  remove: (key: string) => void;
  failed: boolean;
}

export function ReadingsPanel({ items, move, remove, failed }: ReadingsPanelProps) {
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [newPage, setNewPage] = useState(true);
  const [done, setDone] = useState("");
  const [manual, setManual] = useState("");
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, paper === "letter" ? "0.75in" : "19mm");
  const printable = useMemo(() => canPrint(), []);
  const entries: ReaderEntry[] = items.map((item) => ({ key: item.key, part: partTitle(item), reference: item.reference, text: item.text }));
  const keys = items.map((item) => item.key);

  const copy = (text: string, success: string) => {
    const writing = navigator.clipboard?.writeText(text);
    if (!writing) { setManual(text); return; }
    writing.then(() => { setManual(""); setDone(success); window.setTimeout(() => setDone(""), 2400); }).catch((error: unknown) => {
      console.warn("sympathy: copying to the clipboard failed; showing the text to copy by hand", error);
      setManual(text);
    });
  };
  const sendList = () => {
    const url = listUrl(keys);
    if (typeof navigator.share === "function") {
      navigator.share({ title: FUNERAL_HEADING, url }).catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        console.warn("sympathy: the share sheet failed; copying the list link instead", error);
        copy(url, "The link to your list is copied. Paste it into a message to your pastor.");
      });
      return;
    }
    copy(url, "The link to your list is copied. Paste it into a message to your pastor.");
  };
  const waiting = failed ? "The readings could not be loaded." : !fontsReady ? "Waiting for the fonts…" : null;

  return (
    <aside className="sy-our-readings" aria-labelledby="sy-our-title">
      <h2 id="sy-our-title">Our readings</h2>
      {items.length === 0 ? <p className="sy-small-print">Tick “Add to our list” beside a reading to add it here.</p> : (
        <ol className="sy-our-list">
          {items.map((item, index) => (
            <li key={item.key}>
              <span className="sy-our-ref"><strong>{item.reference}</strong><small>{partTitle(item)}</small></span>
              <span className="sy-our-actions">
                <button type="button" className="sy-icon-button" onClick={() => move(item.key, -1)} disabled={index === 0} aria-label={`Move ${item.reference} up`}><ArrowUp size={14} aria-hidden="true" /></button>
                <button type="button" className="sy-icon-button" onClick={() => move(item.key, 1)} disabled={index === items.length - 1} aria-label={`Move ${item.reference} down`}><ArrowDown size={14} aria-hidden="true" /></button>
                <button type="button" className="sy-small-button" onClick={() => remove(item.key)} aria-label={`Remove ${item.reference} from our list`}><span>Remove</span></button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {items.length > 0 && <>
        <fieldset className="sy-choice sy-choice-row">
          <legend>Paper</legend>
          {(["letter", "a4"] as const).map((item) => (
            <label key={item} className={paper === item ? "sy-chosen" : undefined}>
              <input type="radio" name="sy-readers-paper" value={item} checked={paper === item} onChange={() => setPaper(item)} />
              {item === "letter" ? <span>US Letter</span> : <span>A4</span>}
            </label>
          ))}
        </fieldset>
        <label className="sy-check"><input type="checkbox" checked={newPage} onChange={(changed) => setNewPage(changed.target.checked)} /> Start each reading on a new page</label>
        <p className="sy-instructions">In the print dialog choose your paper size and switch off Headers and footers. The sheet runs over as many pages as it needs.</p>
        <div className="sy-send-row">
          {printable ? (
            <button type="button" className="sy-print" disabled={Boolean(waiting)} onClick={print}>{waiting ?? "Print readers' sheet"}</button>
          ) : <p className="sy-notice" role="status">{`Open this page in your browser to print: ${listUrl(keys)}`}</p>}
          <button type="button" className="sy-button" onClick={sendList}>Send the list to our pastor</button>
          <button type="button" className="sy-button" onClick={() => copy(listAsText(items), "The readings are copied as text.")}>Copy as text</button>
        </div>
        {done && <p className="sy-notice" role="status">{done}</p>}
        {manual && (
          <label className="sy-field">
            <span className="sy-field-label">Press and hold to copy, or select the text and copy it.</span>
            <textarea readOnly value={manual} rows={5} onFocus={(event) => event.currentTarget.select()} />
          </label>
        )}
        <PrintPortal label="sympathy-readers"><ReadersSheet paper={paper} title={FUNERAL_HEADING} entries={entries} address={PRINT_ADDRESS} newPage={newPage} /></PrintPortal>
      </>}
    </aside>
  );
}
