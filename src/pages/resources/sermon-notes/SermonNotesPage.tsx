// /resources/sermon-notes: a printable sheet for following a sermon, for adults or for children (README.md beside this
// file). The visitor may add the sermon's title and passage; everything else is written by hand. Printing goes through
// the life-event print module unchanged, and the browser's own dialog saves it as a PDF. What is typed stays in this
// component's memory: never in the address, never saved, never sent. No form element, so Enter submits nothing.
import { useMemo, useState } from "react";
import { SITE_ORIGIN } from "@/lib/page-head";
import { canPrint, defaultPaper, PAPER_SIZE, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { SHEET_FACES, usePreviewScale } from "@/pages/sympathy/print-setup";
import { ResourceCrumbs } from "../Shell";
import { cleanField, MAX_FIELD } from "./fields";
import { SermonSheet, type Version } from "./SermonSheet";
import "@/components/stations/stations.css";
import "@/pages/teachers/teachers.css";
import "./sermon-notes.css";

export const SERMON_NOTES_PATH = "/resources/sermon-notes";

export default function SermonNotesPage() {
  const [version, setVersion] = useState<Version>("adult");
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, "0");
  const printable = useMemo(() => canPrint(), []);
  const preview = usePreviewScale(paper);
  const sheet = { version, paper, title: cleanField(title), passage: cleanField(passage) };

  return (
    <div className="tl-page sn-page mx-auto max-w-7xl px-4 sm:px-6">
      <ResourceCrumbs />
      <header className="st-hero tl-hero">
        <div><p className="st-kick">Resources · Printables</p><h1>Sermon notes</h1></div>
        <div className="st-side">
          <p>A page to fill in while you listen to a sermon: one for adults, and one for children with simpler questions and room to draw. Add the title and the passage if you know them, then print it or save it as a PDF.</p>
        </div>
      </header>

      <div className="sn-grid">
        <div className="sn-controls">
          <fieldset className="sn-choice">
            <legend>Sheet</legend>
            <label><input type="radio" name="sn-version" checked={version === "adult"} onChange={() => setVersion("adult")} />For adults</label>
            <label><input type="radio" name="sn-version" checked={version === "kids"} onChange={() => setVersion("kids")} />For children</label>
          </fieldset>
          <fieldset className="sn-choice">
            <legend>Paper</legend>
            <label><input type="radio" name="sn-paper" checked={paper === "letter"} onChange={() => setPaper("letter")} />US Letter</label>
            <label><input type="radio" name="sn-paper" checked={paper === "a4"} onChange={() => setPaper("a4")} />A4</label>
          </fieldset>
          <label className="sn-field">
            <span>Sermon title (optional)</span>
            <input type="text" value={title} maxLength={MAX_FIELD} autoComplete="off" onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="sn-field">
            <span>Bible passage (optional)</span>
            <input type="text" value={passage} maxLength={MAX_FIELD} autoComplete="off" onChange={(event) => setPassage(event.target.value)} />
          </label>
          <p className="sn-hint">Leave them empty to write them in by hand.</p>
          <p className="sn-hint">In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. To keep a PDF, choose Save as PDF as the printer.</p>
          {printable
            ? <button type="button" className="sn-print" disabled={!fontsReady} onClick={print}>{fontsReady ? "Print" : "Waiting for the fonts…"}</button>
            : <p className="sn-notice" role="status">{`Open this page in your browser to print: ${SITE_ORIGIN}${SERMON_NOTES_PATH}`}</p>}
          <p className="sn-small">Nothing you type here is saved or sent anywhere. It stays on this page until you leave it.</p>
        </div>
        <div className="sn-preview" ref={preview.box} style={{ height: preview.height }} aria-label="Preview of the printed sheet" role="img">
          <div className="sn-preview-sheet" style={{ transform: `scale(${preview.scale})`, width: PAPER_SIZE[paper].width }}>
            <SermonSheet {...sheet} />
          </div>
        </div>
      </div>
      <PrintPortal label="sermon-notes"><SermonSheet {...sheet} /></PrintPortal>
    </div>
  );
}
