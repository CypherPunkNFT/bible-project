// "For your church" (design 7.6): one link for everyone, a QR code, the printed plan, bulletin insert and candle sheet,
// a calendar file, and an announcement to copy. Nothing here collects anything, and the site never learns who shared what.
import { useEffect, useMemo, useState } from "react";
import type { LifeEventPassage } from "@/data/life-events";
import { canPrint, defaultPaper, useFontsReady, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import { QrCode } from "@/pages/life-events/QrCode";
import { qrModules } from "@/pages/life-events/qr";
import { CountdownSheet, type SheetData, type SheetKind } from "./CountdownSheets";
import { shortDate, weekdayDate } from "./format";
import { buildCalendar } from "./ics";
import { countdownUrl } from "./message";
import { panelDay, type Run } from "./season";
import { CopyButton } from "./SharePanel";
import { useCountdownPassages, useReference } from "./usePassages";

const SHEET_FACES = ['400 1em "Literata Variable"', '400 1em "Archivo Variable"', '600 1em "Archivo Variable"'];

/** Saves text as a file through a Blob download. */
function download(name: string, type: string, text: string) {
  if (typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "This Advent, read along with us: one short Bible reading a day from Sunday, November 29 to Christmas Day, …". */
function announcement(run: Run, address: string): string {
  const targetDay = run.entries.find((entry) => entry.n === run.targetN)?.day.label ?? weekdayDate(run.target);
  return `This ${run.occasion.name}, read along with us: one short Bible reading a day from ${weekdayDate(run.entries[0].date)} to ${targetDay}, free at ${address}. Open the link each day and it shows the right reading.`;
}

function calendarFile(run: Run, reference: (passage: LifeEventPassage) => string, owner: string, now: Date): string {
  const year = run.target.year;
  return buildCalendar(`${run.occasion.name} ${year} · Bible Guide`, run.entries.map(({ day, date }) => ({
    // Built from the owner (Lent for Holy Week), so a church importing both files gets each day once.
    uid: `${owner}-${year}-${day.key}@bibleguide.io`,
    date,
    summary: `${run.occasion.name} · ${shortDate(date)}: ${day.readings.map(reference).join("; ")}`,
    url: countdownUrl(owner, day.key),
  })), now);
}

export function ChurchPanel({ run, owner }: { run: Run; owner: string }) {
  const occasion = run.occasion;
  const url = countdownUrl(occasion.slug);
  const address = url.replace(/^https:\/\//, "");
  const reference = useReference();
  const [paper, setPaper] = useState<Paper>(() => defaultPaper());
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  const [pending, setPending] = useState(false);
  const [text, setText] = useState(() => announcement(run, address));
  const qr = useMemo(() => qrModules(url), [url]);
  const printable = useMemo(() => canPrint(), []);
  const fontsReady = useFontsReady(SHEET_FACES);
  const { print } = usePrintSheet(paper, "0.45in");
  const panels = (occasion.panels ?? []).slice().sort((a, b) => panelDay(run, a) - panelDay(run, b));
  const { state } = useCountdownPassages(`${occasion.slug}:candles`, panels.map((panel) => panel.passage));
  const candles = state.status === "ready" ? panels.map((panel, index) => ({ heading: panel.heading, line: panel.line, text: state.value[index].text, reference: state.value[index].reference })) : [];

  useEffect(() => {
    if (!pending || !sheet) return;
    setPending(false);
    print();
  }, [pending, sheet, print]);

  const data: SheetData = { run, paper, address, qr, reference, candles };
  const choose = (kind: SheetKind) => { setSheet(kind); setPending(true); };
  const waiting = !printable ? "Open this page in your browser to print or save." : !fontsReady ? "Waiting for the fonts…" : null;
  const qrSvg = qr ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${qr.size + 4} ${qr.size + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${qr.size + 4}" height="${qr.size + 4}" fill="#fff"/><path d="${qr.path}" fill="#1f1b16"/></svg>` : "";

  return (
    <section className="cd-church" id="for-your-church" aria-labelledby="cd-church-title">
      <h2 id="cd-church-title">For your church</h2>
      <div className="cd-church-grid">
        <div>
          <h3>One link for everyone</h3>
          <p>Everyone who opens it sees the right day for their own date, every day of the season, so you share it once.</p>
          <p className="cd-link-row"><code>{url}</code> <CopyButton text={url} label="Copy link" /></p>
          {qr && <div className="cd-qr"><QrCode modules={qr} label={`QR code for ${address}`} />
            <button type="button" className="cd-button" disabled={!printable} onClick={() => download(`bible-guide-${occasion.slug}-qr.svg`, "image/svg+xml", qrSvg)}>Download QR code</button></div>}
        </div>
        <div>
          <h3>Print</h3>
          <fieldset className="cd-paper">
            <legend>Paper</legend>
            {(["letter", "a4"] as const).map((item) => (
              <label key={item}><input type="radio" name={`cd-paper-${occasion.slug}`} checked={paper === item} onChange={() => setPaper(item)} />{item === "letter" ? "US Letter" : "A4"}</label>
            ))}
          </fieldset>
          <div className="cd-actions">
            <button type="button" className="cd-button" disabled={Boolean(waiting)} onClick={() => choose("plan")}>Print the reading plan</button>
            <button type="button" className="cd-button" disabled={Boolean(waiting)} onClick={() => choose("bulletin")}>Print bulletin inserts</button>
            {panels.length > 0 && <button type="button" className="cd-button" disabled={Boolean(waiting) || candles.length === 0} onClick={() => choose("candles")}>Print the candle readings</button>}
          </div>
          {waiting && <p className="cd-quiet">{waiting}</p>}
          <h3>Add to calendar</h3>
          <p>One all-day entry a day, each with its reading and link. No alarms.</p>
          <button type="button" className="cd-button" disabled={!printable}
            onClick={() => download(`bible-guide-${occasion.slug}-${run.target.year}.ics`, "text/calendar", calendarFile(run, reference, owner, new Date()))}>Download calendar file</button>
        </div>
      </div>
      <h3>Announcement to copy</h3>
      <label className="cd-announce">
        <span className="sr-only">Announcement text</span>
        <textarea value={text} onChange={(changed) => setText(changed.target.value)} rows={4} />
      </label>
      <CopyButton text={text} label="Copy announcement" />
      <p className="cd-quiet">Every day page can be opened early, to prepare a sermon or a small-group plan.</p>
      {/* Always mounted, so its container already exists when a sheet is chosen and the print sees the sheet drawn. */}
      <PrintPortal label="countdown-sheet">{sheet && <CountdownSheet kind={sheet} data={data} />}</PrintPortal>
    </section>
  );
}
