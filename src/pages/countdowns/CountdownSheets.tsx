// The printed sheets of the church panel (design 7.6): the one-page reading plan, two bulletin inserts per page with a cut
// line, and the Advent candle readings in large type. Drawn into the life-event print portal and printed with its module.
import type { ReactNode } from "react";
import type { LifeEventPassage } from "@/data/life-events";
import { QrCode } from "@/pages/life-events/QrCode";
import type { Paper } from "@/pages/life-events/print-sheet";
import { longDate, shortDate, shortWeekday } from "./format";
import { dayName, type Run } from "./season";

export type SheetKind = "plan" | "bulletin" | "candles";

export interface SheetData {
  run: Run;
  paper: Paper;
  address: string;
  qr: { size: number; path: string } | null;
  reference: (passage: LifeEventPassage) => string;
  candles: { heading: string; line: string; text: string; reference: string }[];
}

function Foot({ data }: { data: SheetData }) {
  return (
    <footer className="cds-foot">
      {data.qr && <QrCode modules={data.qr} label={`QR code for ${data.address}`} />}
      <div><strong>{data.address}</strong><span>Open the link each day for the full reading. Scripture: Berean Standard Bible.</span></div>
    </footer>
  );
}

const span = (run: Run) => `${longDate(run.entries[0].date)} to ${longDate(run.target)}`;

function PlanRows({ run, reference, compact }: { run: Run; reference: SheetData["reference"]; compact?: boolean }) {
  return (
    <ol className={compact ? "cds-rows cds-rows-compact" : "cds-rows"}>
      {run.entries.map(({ day, date }) => (
        <li key={day.key}>
          {!compact && <span className="cds-box" aria-hidden="true" />}
          <span className="cds-date">{shortWeekday(date)} {shortDate(date)}</span>
          <span className="cds-name">{day.label ?? (compact ? "" : dayName(run.occasion, day))}</span>
          <span className="cds-ref">{day.readings.map(reference).join("; ")}</span>
        </li>
      ))}
    </ol>
  );
}

function Sheet({ data, kind, children }: { data: SheetData; kind: SheetKind; children: ReactNode }) {
  return <div className={`cds-sheet cds-${kind} cds-paper-${data.paper}`}>{children}</div>;
}

export function CountdownSheet({ kind, data }: { kind: SheetKind; data: SheetData }) {
  const { run } = data;
  if (kind === "plan") {
    return (
      <Sheet data={data} kind={kind}>
        <h1>{run.occasion.heading}</h1>
        <p className="cds-span">{`One reading a day, ${span(run)}`}</p>
        <PlanRows run={run} reference={data.reference} />
        <Foot data={data} />
      </Sheet>
    );
  }
  if (kind === "bulletin") {
    const half = (
      <section className="cds-half">
        <h2>{`Read along with us this ${run.occasion.name}`}</h2>
        <p className="cds-span">{span(run)}</p>
        <PlanRows run={run} reference={data.reference} compact />
        <Foot data={data} />
      </section>
    );
    return <Sheet data={data} kind={kind}>{half}<hr className="cds-cut" aria-label="Cut here" />{half}</Sheet>;
  }
  return (
    <Sheet data={data} kind={kind}>
      <h1>{`${run.occasion.name}: candle readings`}</h1>
      {data.candles.map((candle) => (
        <section key={candle.heading} className="cds-candle">
          <h2>{candle.heading}</h2>
          <blockquote className="scripture" lang="en">“{candle.text}” <cite>{candle.reference}</cite></blockquote>
          <p>{candle.line}</p>
        </section>
      ))}
    </Sheet>
  );
}
