// Shelf 02, the finished testimony (design §3.2, §5 and §9): the actions (Print with a paper choice, Copy, Download as
// text, Download as a web page), a status line that says what happened, the box to copy by hand when the browser blocks
// the clipboard or has no downloads, the sheet on screen, and the same sheet in the print portal on <body>. Printing
// is gated as the other sheets gate it: hidden in in-app browsers, held until the sheet's fonts have loaded.
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { siteLanguage } from "@/lib/language";
import { phrase } from "@/lib/phrase-memory";
import { formatDate } from "@/lib/site-format";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { SHEET_FACES } from "@/pages/sympathy/print-setup";
import { copyText, download } from "./files";
import { SheetView } from "./SheetView";
import { hasStory, pageFileName, sheetHtml, sheetPage, sheetSections, sheetText, textFileName, type Say } from "./sheet";
import type { Answers } from "./storage";

const PAGE_MARGIN = "18mm";
const TAB_TITLE = "My testimony";

const COPIED = "Copied. Paste it into a message, a document or an email.";
const BLOCKED_COPY = "Your browser blocked copying. Select the text below and copy it yourself.";
const NO_DOWNLOAD = "Your browser cannot save files from this page. Select the text below and copy it, or open this page in your browser.";
const DOWNLOADED_TEXT = "Saved as a text file in your downloads.";
const DOWNLOADED_PAGE = "Saved as a web page in your downloads. It opens in any browser and prints from there.";

interface SheetPanelProps {
  answers: Answers;
}

/** The site's words for a fixed sentence, or the English when the language has none. */
const translator = (): Say => {
  const language = siteLanguage();
  return (text) => phrase(text, language) ?? text;
};

export function SheetPanel({ answers }: SheetPanelProps) {
  const settled = useDeferredValue(answers);
  const ready = hasStory(settled);
  const dated = formatDate(Date.now(), { dateStyle: "long" });
  const sheet = useMemo(() => sheetSections(settled, translator(), dated), [settled, dated]);
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const printable = useMemo(() => canPrint(), []);
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, PAGE_MARGIN);
  const [status, setStatus] = useState<string | null>(null);
  const [byHand, setByHand] = useState(false);

  // A new testimony is a new thing to copy: an old "Copied" would mislead.
  useEffect(() => { setStatus(null); setByHand(false); }, [settled]);

  const copy = async () => {
    const plain = sheetText(sheet);
    const html = sheetHtml(sheet);
    const done = await copyText(plain, html);
    setStatus(done ? COPIED : BLOCKED_COPY);
    setByHand(!done);
  };

  const saveText = () => {
    const done = download(textFileName(new Date()), sheetText(sheet), "text/plain;charset=utf-8");
    setStatus(done ? DOWNLOADED_TEXT : NO_DOWNLOAD);
    setByHand(!done);
  };

  const savePage = () => {
    const done = download(pageFileName(new Date()), sheetPage(sheet, siteLanguage(), TAB_TITLE), "text/html;charset=utf-8");
    setStatus(done ? DOWNLOADED_PAGE : NO_DOWNLOAD);
    setByHand(!done);
  };

  return <div className="tb-sheet-panel">
    <div className="tb-actions">
      {printable
        ? <>
          <button type="button" className="tb-primary" disabled={!ready || !fontsReady} onClick={print}>{fontsReady ? "Print" : "Waiting for the fonts…"}</button>
          <label className="tb-paper">
            <span>Paper</span>
            <select value={paper} onChange={(event) => setPaper(event.target.value as Paper)}>
              <option value="letter">Letter</option>
              <option value="a4">A4</option>
            </select>
          </label>
        </>
        : <p className="tb-quiet">Open this page in your browser to print it. Here you can copy the text.</p>}
      <button type="button" className="tb-secondary" disabled={!ready} onClick={() => void copy()}>Copy</button>
      <button type="button" className="tb-secondary" disabled={!ready} onClick={saveText}>Download as text</button>
      <button type="button" className="tb-secondary" disabled={!ready} onClick={savePage}>Download as a web page</button>
    </div>
    <p className="tb-status" role="status">{status ?? ""}</p>
    {byHand && <textarea className="tb-by-hand" readOnly aria-label="Your testimony as text" value={sheetText(sheet)} rows={12} ref={(box) => box?.select()} />}
    <section className="tb-preview" aria-label="Your testimony sheet">
      {ready
        ? <SheetView sheet={sheet} level={3} />
        : <p className="tb-quiet">Your testimony appears here as you answer the questions above. Each answer becomes a section under its own heading.</p>}
    </section>
    <PrintPortal label="testimony">
      <div className="tb-print" data-paper={paper}>
        {ready && <SheetView sheet={sheet} level={1} />}
      </div>
    </PrintPortal>
  </div>;
}
