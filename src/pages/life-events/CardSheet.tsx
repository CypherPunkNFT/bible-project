// The printed sheet, at true size (inches or millimetres), for one card description (design 6.1–6.6, 7.4). It draws only
// what the description says and never reads the page's state, so chain C's shared verse-card generator can later take the
// same description. Fixed light colours throughout (life-events-sheet.css), so dark mode never reaches the paper.
import type { CSSProperties } from "react";
import { CARD_FULL, type SheetFormat } from "./passage";
import { Ornament } from "./Ornament";
import { QrCode } from "./QrCode";
import { PAPER_SIZE, type Paper } from "./print-sheet";

export interface CardVerse { text: string; reference: string }

export interface ReadingEntry extends CardVerse { key: string; note: string; context?: string; group?: string; roleTitle: string }

/** Everything a sheet shows. Names, date and message are the visitor's own words, drawn under translate="no". */
export interface CardDescription {
  packSlug: string;
  packHeading: string;
  heading: string;
  verse: CardVerse;
  second: CardVerse | null;
  names: string[];
  date: string;
  message: string;
  /** The pack's inside line, used when the visitor writes no message. */
  inside: string;
  ornament: string;
  colour: string;
  /** The public page address, e.g. https://bibleguide.io/life-events/wedding. */
  pageUrl: string;
  qr: { size: number; path: string } | null;
  readings: ReadingEntry[];
}

const BSB = "Scripture: Berean Standard Bible";
const addressOf = (url: string) => url.replace(/^https?:\/\//, "");

function Personal({ text, className }: { text: string; className: string }) {
  return text ? <p className={className} translate="no" dir="auto">{text}</p> : null;
}

function namesLine(names: string[]): string {
  return names.filter(Boolean).join(" & ");
}

function VerseBlock({ verse, size }: { verse: CardVerse; size: "card" | "display" }) {
  const length = verse.text.length;
  const step = size === "card" ? (length <= CARD_FULL ? "full" : "small") : length <= CARD_FULL ? "full" : length <= 450 ? "medium" : "small";
  return (
    <blockquote className={`les-verse les-verse-${size} les-${step}`}>
      <p className="scripture" lang="en">{verse.text}</p>
      <footer className="les-ref">{verse.reference}</footer>
    </blockquote>
  );
}

function Front({ card }: { card: CardDescription }) {
  return (
    <div className="les-panel les-front">
      <Ornament name={card.ornament} colour={card.colour} size="0.5in" />
      {card.heading && <p className="les-heading" translate="no" dir="auto">{card.heading}</p>}
      <VerseBlock verse={card.verse} size="card" />
    </div>
  );
}

function Back({ card }: { card: CardDescription }) {
  return (
    <div className="les-panel les-back">
      {card.qr && <QrCode modules={card.qr} label={`QR code for ${addressOf(card.pageUrl)}`} />}
      <p className="les-address">{addressOf(card.pageUrl)}</p>
      <p className="les-small">{BSB}</p>
    </div>
  );
}

function InsideRight({ card }: { card: CardDescription }) {
  const names = namesLine(card.names);
  return (
    <div className="les-panel les-inside">
      <Personal text={names} className={`les-names${names.length > 28 ? " les-names-long" : ""}`} />
      <Personal text={card.date} className="les-date" />
      <Personal text={card.message || card.inside} className="les-message" />
      <div className="les-write" aria-hidden="true" />
    </div>
  );
}

function InsideLeft({ card }: { card: CardDescription }) {
  return <div className="les-panel les-inside-left">{card.second && <VerseBlock verse={card.second} size="card" />}</div>;
}

function SmallCard({ card }: { card: CardDescription }) {
  const names = namesLine(card.names);
  return (
    <div className="les-panel les-small-card">
      <Ornament name={card.ornament} colour={card.colour} size="0.4in" />
      {card.heading && <p className="les-heading" translate="no" dir="auto">{card.heading}</p>}
      <VerseBlock verse={card.verse} size="card" />
      <Personal text={names} className={`les-names les-names-small${names.length > 28 ? " les-names-long" : ""}`} />
    </div>
  );
}

function Display({ card }: { card: CardDescription }) {
  const names = namesLine(card.names);
  return (
    <div className="les-display-area">
      <Ornament name={card.ornament} colour={card.colour} size="0.8in" />
      {card.heading && <p className="les-heading les-heading-display" translate="no" dir="auto">{card.heading}</p>}
      <VerseBlock verse={card.verse} size="display" />
      <Personal text={names} className={`les-names les-names-display${names.length > 28 ? " les-names-long" : ""}`} />
      <Personal text={card.date} className="les-date" />
    </div>
  );
}

function Readings({ card }: { card: CardDescription }) {
  let lastGroup = "";
  return (
    <div className="les-readings">
      <h1>{card.packHeading}</h1>
      {card.readings.map((entry) => {
        const heading = `${entry.roleTitle}${entry.group ? `: ${entry.group}` : ""}`;
        const showHeading = heading !== lastGroup;
        lastGroup = heading;
        return (
          <section key={entry.key} className="les-reading">
            {showHeading && <h2>{heading}</h2>}
            <h3>{entry.reference}</h3>
            <p className="scripture" lang="en">{entry.text}</p>
            <p className="les-note">{entry.note}</p>
            {entry.context && <p className="les-note les-context">{entry.context}</p>}
          </section>
        );
      })}
      <p className="les-small les-readings-foot">{`Scripture quotations are from the Berean Standard Bible (public domain). ${addressOf(card.pageUrl)}`}</p>
    </div>
  );
}

/** The whole sheet: `paper` sets its true size; a single-sheet format is drawn a hair shorter than the paper. */
export function CardSheet({ card, format, paper, guides }: { card: CardDescription; format: SheetFormat; paper: Paper; guides: boolean }) {
  const size = PAPER_SIZE[paper];
  const style = { "--sheet-width": size.width, "--sheet-height": size.height, "--family": card.colour } as CSSProperties;
  const className = `les-sheet les-${format} les-paper-${paper}${guides ? " les-guides" : ""}`;
  if (format === "readings") return <div className={className} style={style} data-format={format}><Readings card={card} /></div>;
  return (
    <div className={className} style={style} data-format={format}>
      {format === "folded" && <>
        <div className="les-quarter les-turned" data-quarter="top-left"><InsideRight card={card} /></div>
        <div className="les-quarter les-turned" data-quarter="top-right"><InsideLeft card={card} /></div>
        <div className="les-quarter" data-quarter="bottom-left"><Back card={card} /></div>
        <div className="les-quarter" data-quarter="bottom-right"><Front card={card} /></div>
      </>}
      {format === "small" && [0, 1, 2, 3].map((index) => <div key={index} className="les-quarter" data-quarter={String(index)}><SmallCard card={card} /></div>)}
      {format === "display" && <Display card={card} />}
    </div>
  );
}
