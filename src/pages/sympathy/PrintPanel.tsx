// The three printed formats of the card maker (design 6.3): the folded card, memorial cards and the display print. The
// fields, paper and guides for the chosen format, a scaled preview, and Print through the life-event print module, used
// unchanged. What is typed stays in this component's memory: never in the address, never saved, never sent.
import { useMemo, useState } from "react";
import { SITE_ORIGIN } from "@/lib/page-head";
import { canPrint, defaultPaper, PAPER_SIZE, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { qrModules } from "@/pages/life-events/qr";
import { Field } from "./Field";
import { cardUrl, type CardStyle } from "./message";
import { PRINT_ADDRESS, SHEET_FACES, usePreviewScale } from "./print-setup";
import { SympathySheet, type CardVerse, type SympathyCard, type SympathyFormat } from "./SympathySheet";

const LIMITS = { recipient: 60, heading: 50, message: 300, sender: 60, name: 60, dates: 40 } as const;
const HEADINGS = ["With deepest sympathy", "Thinking of you", "With love and sympathy", "Holding you in prayer", "In loving memory of [name]"];

const INSTRUCTIONS: Record<Exclude<SympathyFormat, "readers">, string> = {
  folded: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. Fold the sheet in half top to bottom with the print outside, then in half again, left to right.",
  memorial: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. Cut along the dashed guides to make four cards.",
  display: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. On Letter paper, trim along the guides to fit an 8 × 10 frame.",
};

interface PrintPanelProps {
  format: Exclude<SympathyFormat, "readers">;
  verse: (CardVerse & { key: string }) | null;
  /** Card verses the folded card offers for its inside left panel. */
  seconds: (CardVerse & { key: string })[];
  style: CardStyle;
  defaults: { heading: string; inside: string };
  label: string;
  disabledReason: string | null;
}

export function PrintPanel({ format, verse, seconds, style, defaults, label, disabledReason }: PrintPanelProps) {
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [guides, setGuides] = useState(true);
  const [withQr, setWithQr] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [heading, setHeading] = useState(defaults.heading);
  const [memorialHeading, setMemorialHeading] = useState("In loving memory");
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [name, setName] = useState("");
  const [dates, setDates] = useState("");
  const [secondKey, setSecondKey] = useState("");
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, "0");
  const printable = useMemo(() => canPrint(), []);
  const preview = usePreviewScale(paper);
  const qr = useMemo(() => (withQr && verse ? qrModules(cardUrl(verse.key, style)) : null), [withQr, verse, style]);
  const second = seconds.find((item) => item.key === secondKey) ?? null;

  const card: SympathyCard | null = verse ? {
    key: verse.key, verse: { text: verse.text, reference: verse.reference }, second: format === "folded" && second ? second : null, style,
    heading: format === "memorial" ? memorialHeading : format === "folded" ? heading : "",
    recipient, message, sender, inside: defaults.inside, name, dates, address: PRINT_ADDRESS, qr: format === "folded" ? qr : null,
  } : null;
  const waiting = disabledReason ?? (!fontsReady ? "Waiting for the fonts…" : null);

  return (
    <div className="sy-tab-body sy-print-grid">
      <div className="sy-print-controls">
        <fieldset className="sy-choice sy-choice-row">
          <legend>Paper</legend>
          {(["letter", "a4"] as const).map((item) => (
            <label key={item} className={paper === item ? "sy-chosen" : undefined}>
              <input type="radio" name={`sy-paper-${label}`} value={item} checked={paper === item} onChange={() => setPaper(item)} />
              {item === "letter" ? <span>US Letter</span> : <span>A4</span>}
            </label>
          ))}
        </fieldset>
        {format === "folded" && <>
          <datalist id={`sy-headings-${label}`}>{HEADINGS.map((item) => <option key={item} value={item} />)}</datalist>
          <Field label="Heading on the front" value={heading} limit={LIMITS.heading} onChange={setHeading} list={`sy-headings-${label}`} />
          <Field label="Their name or names" value={recipient} limit={LIMITS.recipient} onChange={setRecipient} />
          <Field label="Your message" value={message} limit={LIMITS.message} onChange={setMessage} multiline />
          <Field label="Your name" value={sender} limit={LIMITS.sender} onChange={setSender} />
          <label className="sy-field">
            <span className="sy-field-label">Second verse, inside left (optional)</span>
            <select value={secondKey} onChange={(changed) => setSecondKey(changed.target.value)}>
              <option value="">None: leave it for handwriting</option>
              {seconds.map((item) => <option key={item.key} value={item.key}>{item.reference}</option>)}
            </select>
          </label>
          <label className="sy-check"><input type="checkbox" checked={withQr} onChange={(changed) => setWithQr(changed.target.checked)} /> Add a QR code for the verse on the back</label>
        </>}
        {format === "memorial" && <Field label="Heading" value={memorialHeading} limit={LIMITS.heading} onChange={setMemorialHeading} />}
        {format !== "folded" && <>
          <Field label="Name of the person who died" value={name} limit={LIMITS.name} onChange={setName} />
          <Field label="Dates" value={dates} limit={LIMITS.dates} onChange={setDates} />
        </>}
        {(format !== "display" || paper === "letter") && (
          <label className="sy-check"><input type="checkbox" checked={guides} onChange={(changed) => setGuides(changed.target.checked)} /> Print fold and cut guides</label>
        )}
        <p className="sy-instructions">{INSTRUCTIONS[format]}</p>
        {printable ? (
          <button type="button" className="sy-print" disabled={Boolean(waiting) || !card} onClick={print}>{waiting ?? "Print"}</button>
        ) : (
          <p className="sy-notice" role="status">{`Open this page in your browser to print: ${SITE_ORIGIN}/sympathy`}</p>
        )}
        <p className="sy-small-print">Nothing you type here is saved or sent anywhere. It stays on this page until you leave it.</p>
      </div>
      <div className="sy-preview" ref={preview.box} style={{ height: preview.height }} aria-label="Preview of the printed sheet" role="img">
        {card && (
          <div className="sy-preview-sheet" style={{ transform: `scale(${preview.scale})`, width: PAPER_SIZE[paper].width }}>
            <SympathySheet card={card} format={format} paper={paper} guides={guides} />
          </div>
        )}
      </div>
      {card && <PrintPortal label={`sympathy-${label}`}><SympathySheet card={card} format={format} paper={paper} guides={guides} /></PrintPortal>}
    </div>
  );
}
