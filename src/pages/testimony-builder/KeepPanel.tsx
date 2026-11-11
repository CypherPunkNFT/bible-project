// Shelf 03, keeping the draft (design §3.3 and §9): save it as a file, open a file back (replacing the draft, after a
// confirm when it is not empty), start over, and what the page does with the draft, including the plain truth about
// browser storage. Files are read in the browser only.
import { useRef, useState } from "react";
import { download, readFileText } from "./files";
import { MAX_FILE_BYTES, draftFileName, draftFileText, readDraftFile, type Answers } from "./storage";

const REFUSED: Record<"too-big" | "not-draft" | "newer" | "unreadable" | "no-download", string> = {
  "too-big": "That file is too big to be a draft from this page, so nothing was changed.",
  "not-draft": "That file is not a draft from this page, so nothing was changed.",
  newer: "That draft comes from a newer version of Bible Guide. Reload this page and try again. Nothing was changed.",
  unreadable: "That file could not be read, so nothing was changed.",
  "no-download": "Your browser cannot save files from this page. Copy your testimony from the sheet above instead.",
};

const OPENED = "Your draft was opened from the file. It now shows in the questions above.";
const SAVED_FILE = "Your draft was saved as a file in your downloads. Open it here on any device to keep writing.";
const CLEARED = "Your draft is cleared.";

interface KeepPanelProps {
  answers: Answers;
  answered: number;
  saving: boolean;
  onReplace: (answers: Answers) => void;
  onClear: () => void;
}

export function KeepPanel({ answers, answered, saving, onReplace, onClear }: KeepPanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [line, setLine] = useState<string | null>(null);

  const save = () => {
    const done = download(draftFileName(new Date()), draftFileText(answers, new Date()), "application/json");
    setLine(done ? SAVED_FILE : REFUSED["no-download"]);
  };

  const choose = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) { setLine(REFUSED["too-big"]); return; }
    let text: string;
    try {
      text = await readFileText(file);
    } catch (error) {
      console.warn("Testimony builder: the chosen file could not be read:", error);
      setLine(REFUSED.unreadable);
      return;
    }
    const read = readDraftFile(text);
    if (!read.ok) { setLine(REFUSED[read.reason]); return; }
    if (answered > 0 && !window.confirm("Replace the draft on this page with the one in the file?")) return;
    onReplace(read.answers);
    setLine(OPENED);
    if (input.current) input.current.value = "";
  };

  return <div className="tb-keep">
    <div className="tb-actions">
      <button type="button" className="tb-secondary" disabled={answered === 0} onClick={save}>Save a draft file</button>
      <button type="button" className="tb-secondary" onClick={() => input.current?.click()}>Open a draft file</button>
      <input ref={input} type="file" accept=".json,application/json" className="tb-file" aria-label="Choose a draft file" onChange={(event) => void choose(event.target.files?.[0])} />
      <button type="button" className="tb-link" disabled={answered === 0} onClick={() => {
        if (window.confirm("Remove every answer from this page and from this browser?")) { onClear(); setLine(CLEARED); }
      }}>Start over</button>
    </div>
    <p className="tb-status" role="status">{line ?? ""}</p>
    <div className="tb-prose">
      <p>Your draft is kept only in this browser, on this device, and is saved as you type. There is no account and no tracking, and nothing you write is sent anywhere. The only thing this page asks the site for is the Gospel of Mark in the Berean Standard Bible, for the verse at the top, the same file the Bible reader uses.</p>
      <p>A browser can clear what it keeps: Safari removes a page's storage after about a week without a visit, and a private window forgets everything when it closes. So for anything you would be sorry to lose, save a draft file now and then. It holds your answers and nothing else, and Open a draft file brings it back here, on this device or another.</p>
      {!saving && <p className="tb-bad">This browser is not letting the page save, so your draft lasts only while this page is open. Save a draft file to keep it.</p>}
      <p className="tb-quiet">Scripture quotations are from the Berean Standard Bible (public domain).</p>
    </div>
  </div>;
}
