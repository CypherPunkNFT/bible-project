// Scripture memory: keeping the list (design §5 and §9, shelf 04): export to a file, import a file back (merged, the
// further-along copy kept), clear everything, and what the page does with it all. Files are read in the browser only.
import { useRef, useState } from "react";
import { readFileText } from "./files";
import { MAX_FILE_BYTES, exportName, exportText, readImport, type ImportRead, type PassageCheck } from "./storage";
import { today, type MemoryVerse } from "./progress";

/** Saves text as a file through a Blob download, then lets the browser free it. */
function download(name: string, text: string) {
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const REFUSED: Record<"too-big" | "not-export" | "newer" | "unreadable", string> = {
  "too-big": "That file is too big to be an export from this page, so nothing was changed.",
  "not-export": "That file is not an export from this page, so nothing was changed.",
  newer: "That file comes from a newer version of Bible Guide. Reload this page and try again. Nothing was changed.",
  unreadable: "That file could not be read, so nothing was changed.",
};

interface KeepPanelProps {
  verses: readonly MemoryVerse[];
  check: PassageCheck;
  saving: boolean;
  /** Merges what was read into the list; returns the result lines to show. */
  onImport: (read: Extract<ImportRead, { ok: true }>) => string[];
  onClear: () => void;
}

export function KeepPanel({ verses, check, saving, onImport, onClear }: KeepPanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [lines, setLines] = useState<string[]>([]);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setLines([REFUSED["too-big"]]); return; }
    let text: string;
    try {
      text = await readFileText(file);
    } catch (error) {
      console.warn("Scripture memory: the chosen file could not be read:", error);
      setLines([REFUSED.unreadable]);
      return;
    }
    const read = readImport(text, check, today());
    setLines(read.ok ? onImport(read) : [REFUSED[read.reason]]);
    if (input.current) input.current.value = "";
  };

  return <div className="sm-keep">
    <div className="sm-actions">
      <button type="button" className="sm-secondary" disabled={verses.length === 0} onClick={() => download(exportName(new Date()), exportText(verses, new Date()))}>Export my verses</button>
      <button type="button" className="sm-secondary" onClick={() => input.current?.click()}>Import a file</button>
      <input ref={input} type="file" accept=".json,application/json" className="sm-file" aria-label="Choose an export file" onChange={(event) => void choose(event.target.files?.[0])} />
      <button type="button" className="sm-link" disabled={verses.length === 0} onClick={() => {
        if (window.confirm("Remove every verse and all your progress from this browser?")) { onClear(); setLines([]); }
      }}>Clear all</button>
    </div>
    {lines.length > 0 && <ul className="sm-result" role="status">{lines.map((line) => <li key={line}>{line}</li>)}</ul>}
    <div className="sm-prose">
      <p>Your verses and your progress are kept only in this browser, on this device. There is no account and no tracking, and nothing is sent anywhere. The only thing this page asks the site for is the book of the Berean Standard Bible a verse is in, the same file the Bible reader uses.</p>
      <p>Export saves your list as a small file you keep: each verse's reference, its step, and the days you added it and last practised it. No verse text and no name. Import adds a file's verses to this list. A verse in both keeps whichever copy is further along, so importing an older file can bring back progress after Start over.</p>
      {!saving && <p className="sm-bad">This browser is not letting the page save, so your verses last only while this page is open. Export them to keep them.</p>}
      <p className="sm-quiet">Scripture quotations are from the Berean Standard Bible (public domain).</p>
    </div>
  </div>;
}
