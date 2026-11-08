// The card maker on each pack page (design 6): choose a format, paper and verse, add names, a date and a message, see a
// preview, and print with the browser's dialog. What the visitor types stays in this component's memory: never in the
// address, never saved, never sent.
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { familyOf, lifeEventPath, type LifeEvent } from "@/data/life-events";
import { SITE_ORIGIN } from "@/lib/page-head";
import { CardSheet, type CardDescription, type ReadingEntry } from "./CardSheet";
import { pickerPassages, type SheetFormat, type ShownPassage } from "./passage";
import { canPrint, defaultPaper, PAPER_SIZE, useFontsReady, usePrintSheet, type Paper } from "./print-sheet";
import { PrintPortal } from "./PrintPortal";
import { qrModules } from "./qr";

export const LIMITS = { name: 40, date: 40, heading: 50, message: 160 } as const;
const SHEET_FACES = ['400 1em "Literata Variable"', 'italic 400 1em "Literata Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"'];
export const ROLE_TITLES = { reading: "Readings for the ceremony", card: "Verses for a card", blessing: "A blessing to speak" } as const;

const FORMATS: { id: SheetFormat; label: string; what: string }[] = [
  { id: "folded", label: "Folded card", what: "One sheet, folded twice into a greeting card with a front, an inside and a back." },
  { id: "small", label: "Small cards", what: "Four small cards on one sheet, to cut along the guides: place cards, lunchbox notes, gift tags." },
  { id: "display", label: "Display print", what: "One verse, large, to frame or stand on a table." },
  { id: "readings", label: "Readings sheet", what: "Every passage of this page, with its reference and note, for whoever is planning the service." },
];

/** What the print dialog should be set to, for each format (design 6.2, 6.5, 8). */
const INSTRUCTIONS: Record<SheetFormat, string> = {
  folded: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. Fold the sheet in half top to bottom with the print outside, then in half again, left to right.",
  small: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. Cut along the dashed guides.",
  display: "In the print dialog choose your paper size, Scale 100% (or Default) and Margins None or Default. On Letter paper, trim along the guides to fit an 8 × 10 frame.",
  readings: "In the print dialog choose your paper size and switch off Headers and footers. The sheet runs over as many pages as it needs.",
};

function Field({ label, value, limit, onChange }: { label: string; value: string; limit: number; onChange: (value: string) => void }) {
  const full = value.length >= limit;
  const id = useId();
  return (
    <div className="le-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} maxLength={limit} translate="no" dir="auto" aria-describedby={`${id}-limit`}
        onChange={(event) => onChange(event.target.value.slice(0, limit))} />
      <small id={`${id}-limit`} className={full ? "le-field-full" : undefined} aria-live="polite">
        {full ? `That is the most this field takes: ${limit} characters.` : `Up to ${limit} characters.`}
      </small>
    </div>
  );
}

function usePreviewScale(paper: Paper) {
  const box = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth || 360);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const sheetWidth = paper === "letter" ? 816 : 793.7;
  return { box, scale: Math.min(1, width / sheetWidth), height: (paper === "letter" ? 1056 : 1122.5) * Math.min(1, width / sheetWidth) };
}

interface CardMakerProps {
  event: LifeEvent;
  passages: ShownPassage[] | null;
  /** The passage a "Use on card" button chose, with a counter so choosing the same one twice still applies. */
  chosen: { key: string; count: number } | null;
}

export function CardMaker({ event, passages, chosen }: CardMakerProps) {
  const family = familyOf(event);
  const [format, setFormat] = useState<SheetFormat>("folded");
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [guides, setGuides] = useState(true);
  const [names, setNames] = useState<string[]>(() => Array.from({ length: event.card.names }, () => ""));
  const [date, setDate] = useState("");
  const [heading, setHeading] = useState(event.card.heading);
  const [message, setMessage] = useState("");
  const [verseKey, setVerseKey] = useState<string | null>(null);
  const [secondKey, setSecondKey] = useState("");
  const [notice, setNotice] = useState("");
  const offered = useMemo(() => (passages ? pickerPassages(passages, format) : []), [passages, format]);
  const cardVerses = useMemo(() => (passages ? passages.filter((item) => item.passage.role === "card") : []), [passages]);
  const fontsReady = useFontsReady(SHEET_FACES);
  const pageUrl = `${SITE_ORIGIN}${lifeEventPath(event)}`;
  const qr = useMemo(() => qrModules(pageUrl), [pageUrl]);
  const { print } = usePrintSheet(paper, format === "readings" ? (paper === "letter" ? "0.75in" : "19mm") : "0");
  const printable = useMemo(() => canPrint(), []);
  const preview = usePreviewScale(paper);

  // A verse the current format cannot take falls back to the pack's first card verse, and says so (design 6.4).
  const selected = offered.find((item) => item.key === verseKey) ?? null;
  useEffect(() => {
    if (!passages || format === "readings" || selected) return;
    const fallback = offered.find((item) => item.key === cardVerses[0]?.key) ?? offered[0];
    if (!fallback) return;
    if (verseKey) setNotice(`That verse is too long for this format, so the card now uses ${fallback.reference}.`);
    setVerseKey(fallback.key);
  }, [passages, format, selected, offered, cardVerses, verseKey]);

  useEffect(() => {
    if (!chosen) return;
    setVerseKey(chosen.key);
    setNotice("");
    setFormat((current) => (current === "readings" ? "folded" : current));
  }, [chosen]);

  const verse = selected ?? offered[0] ?? null;
  const second = format === "folded" ? offered.find((item) => item.key === secondKey) ?? null : null;
  const readings: ReadingEntry[] = useMemo(() => (passages ?? []).map((item) => ({
    key: item.key, text: item.text, reference: item.reference, note: item.passage.note, context: item.passage.context,
    group: item.passage.group, roleTitle: ROLE_TITLES[item.passage.role],
  })), [passages]);
  const card: CardDescription | null = passages && (verse || format === "readings") ? {
    packSlug: event.slug, packHeading: event.heading, heading, names, date, message, inside: event.card.inside,
    verse: verse ? { text: verse.text, reference: verse.reference } : { text: "", reference: "" },
    second: second ? { text: second.text, reference: second.reference } : null,
    ornament: event.card.ornament, colour: family.colour, pageUrl, qr, readings,
  } : null;

  const waiting = !passages ? "Waiting for the verses…" : !fontsReady ? "Waiting for the fonts…" : null;
  const chooseFormat = (next: SheetFormat) => { setNotice(""); setFormat(next); };

  return (
    <section className="le-maker" id="card-maker" aria-labelledby="card-maker-title">
      <h2 id="card-maker-title">Make a printable card</h2>
      <div className="le-maker-grid">
        <div className="le-maker-controls">
          <fieldset className="le-choice">
            <legend>Format</legend>
            {FORMATS.map((item) => (
              <label key={item.id} className={format === item.id ? "le-chosen" : undefined}>
                <input type="radio" name="le-format" value={item.id} checked={format === item.id} onChange={() => chooseFormat(item.id)} />
                <span><strong>{item.label}</strong><small>{item.what}</small></span>
              </label>
            ))}
          </fieldset>
          <fieldset className="le-choice le-choice-row">
            <legend>Paper</legend>
            {(["letter", "a4"] as const).map((item) => (
              <label key={item} className={paper === item ? "le-chosen" : undefined}>
                <input type="radio" name="le-paper" value={item} checked={paper === item} onChange={() => setPaper(item)} />
                <span>{item === "letter" ? "US Letter" : "A4"}</span>
              </label>
            ))}
          </fieldset>
          {format !== "readings" && <>
            <label className="le-field">
              <span>Verse</span>
              <select value={verse?.key ?? ""} onChange={(changed) => { setNotice(""); setVerseKey(changed.target.value); }} disabled={!offered.length}>
                {offered.map((item) => <option key={item.key} value={item.key}>{item.reference}</option>)}
              </select>
            </label>
            {notice && <p className="le-notice" role="status">{notice}</p>}
            {format === "folded" && (
              <label className="le-field">
                <span>Second verse, inside left (optional)</span>
                <select value={secondKey} onChange={(changed) => setSecondKey(changed.target.value)}>
                  <option value="">None: leave it for handwriting</option>
                  {offered.map((item) => <option key={item.key} value={item.key}>{item.reference}</option>)}
                </select>
              </label>
            )}
            <Field label="Heading" value={heading} limit={LIMITS.heading} onChange={setHeading} />
            {names.map((name, index) => (
              <Field key={index} label={names.length === 2 ? `Name ${index + 1}` : "Name"} value={name} limit={LIMITS.name}
                onChange={(value) => setNames((current) => current.map((item, at) => (at === index ? value : item)))} />
            ))}
            {event.card.date && <Field label="Date" value={date} limit={LIMITS.date} onChange={setDate} />}
            {format !== "display" && <Field label="Message" value={message} limit={LIMITS.message} onChange={setMessage} />}
            {format !== "display" || paper === "letter" ? (
              <label className="le-check"><input type="checkbox" checked={guides} onChange={(changed) => setGuides(changed.target.checked)} /> Print fold and cut guides</label>
            ) : null}
          </>}
          <p className="le-instructions">{INSTRUCTIONS[format]}</p>
          {printable ? (
            <button type="button" className="le-print" disabled={Boolean(waiting) || !card} onClick={print}>{waiting ?? "Print"}</button>
          ) : (
            <p className="le-notice" role="status">{`Open this page in your browser to print: ${pageUrl}`}</p>
          )}
          <p className="le-small-print">Nothing you type here is saved or sent anywhere. It stays on this page until you leave it.</p>
        </div>
        <div className="le-preview" ref={preview.box} style={{ height: preview.height }} aria-label="Preview of the printed sheet" role="img">
          {card && (
            <div className="le-preview-sheet" style={{ transform: `scale(${preview.scale})`, width: PAPER_SIZE[paper].width }}>
              <CardSheet card={card} format={format} paper={paper} guides={guides} />
            </div>
          )}
        </div>
      </div>
      {card && <PrintPortal label={event.slug}><CardSheet card={card} format={format} paper={paper} guides={guides} /></PrintPortal>}
    </section>
  );
}
