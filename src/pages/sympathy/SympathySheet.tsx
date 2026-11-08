// The printed sympathy sheets, at true size, for one card description (design 6.3, 6.4, 6.5): the folded card, four
// memorial cards, the display print and the readers' sheet. It draws only what the description says and never reads the
// page's state, so the shared verse-card generator can later take the same description (design 7.5). Its own layout,
// with the life-event sheet's measurements (sympathy-sheet.css names the source); fixed light colours throughout.
import type { CSSProperties } from "react";
import { CARD_FULL } from "@/pages/life-events/passage";
import { PAPER_SIZE, type Paper } from "@/pages/life-events/print-sheet";
import { QrCode } from "@/pages/life-events/QrCode";
import type { CardStyle } from "./message";
import { Ornament } from "./Ornament";

export type SympathyFormat = "folded" | "memorial" | "display" | "readers";

export const SHEET_ACCENT = "#4f6378";

export interface CardVerse { text: string; reference: string }

/** Everything a card sheet shows. Names, dates and messages are the visitor's own words, drawn under translate="no". */
export interface SympathyCard {
  key: string;
  verse: CardVerse;
  second: CardVerse | null;
  style: CardStyle;
  heading: string;
  /** The person or family the card is for (folded card). */
  recipient: string;
  message: string;
  sender: string;
  /** The page's own inside line, used when the visitor writes no message. */
  inside: string;
  /** The person who died (memorial cards, display print). */
  name: string;
  dates: string;
  /** The address printed on the back: bibleguide.io/sympathy. */
  address: string;
  /** The passage's public card link, drawn as a QR code only when the visitor ticks the box. */
  qr: { size: number; path: string } | null;
}

export interface ReaderEntry extends CardVerse { key: string; part: string }

const BSB = "Scripture: Berean Standard Bible";

function Personal({ text, className }: { text: string; className: string }) {
  return text ? <p className={className} translate="no" dir="auto">{text}</p> : null;
}

function VerseBlock({ verse, size }: { verse: CardVerse; size: "card" | "display" }) {
  const length = verse.text.length;
  const step = size === "card" ? (length <= CARD_FULL ? "full" : "small") : length <= CARD_FULL ? "full" : length <= 450 ? "medium" : "small";
  return (
    <blockquote className={`sys-verse sys-verse-${size} sys-${step}`}>
      <p className="scripture" lang="en">{verse.text}</p>
      <footer className="sys-ref">{verse.reference}</footer>
    </blockquote>
  );
}

const longName = (text: string) => (text.length > 28 ? " sys-long" : "");

function Folded({ card }: { card: SympathyCard }) {
  return <>
    <div className="sys-quarter sys-turned" data-quarter="top-left">
      <div className="sys-panel sys-inside">
        <Personal text={card.recipient} className={`sys-names${longName(card.recipient)}`} />
        <Personal text={card.message || card.inside} className="sys-message" />
        <Personal text={card.sender} className="sys-sender" />
        <div className="sys-write" aria-hidden="true" />
      </div>
    </div>
    <div className="sys-quarter sys-turned" data-quarter="top-right">
      <div className="sys-panel">{card.second && <VerseBlock verse={card.second} size="card" />}</div>
    </div>
    <div className="sys-quarter" data-quarter="bottom-left">
      <div className="sys-panel sys-back">
        {card.qr && <QrCode modules={card.qr} label={`QR code for the card link of ${card.verse.reference}`} />}
        <p className="sys-address">{card.address}</p>
        <p className="sys-small">{BSB}</p>
      </div>
    </div>
    <div className="sys-quarter" data-quarter="bottom-right">
      <div className="sys-panel sys-front">
        <Ornament style={card.style} colour={SHEET_ACCENT} width="1.1in" />
        <Personal text={card.heading} className="sys-heading" />
        <VerseBlock verse={card.verse} size="card" />
      </div>
    </div>
  </>;
}

function MemorialCard({ card }: { card: SympathyCard }) {
  return (
    <div className="sys-panel sys-memorial-card">
      <Personal text={card.heading} className="sys-heading" />
      <Personal text={card.name} className={`sys-names sys-names-small${longName(card.name)}`} />
      <Personal text={card.dates} className="sys-dates" />
      <VerseBlock verse={card.verse} size="card" />
      <Ornament style="plain" colour={SHEET_ACCENT} width="0.9in" />
    </div>
  );
}

function Display({ card }: { card: SympathyCard }) {
  return (
    <div className="sys-display-area">
      <Ornament style={card.style} colour={SHEET_ACCENT} width="1.8in" />
      <VerseBlock verse={card.verse} size="display" />
      <Personal text={card.name} className={`sys-names sys-names-display${longName(card.name)}`} />
      <Personal text={card.dates} className="sys-dates" />
    </div>
  );
}

function Readers({ title, entries, address, newPage }: { title: string; entries: ReaderEntry[]; address: string; newPage: boolean }) {
  return (
    <div className={`sys-readers${newPage ? " sys-new-page" : ""}`}>
      <h1>{title}</h1>
      {entries.map((entry) => (
        <section key={entry.key} className="sys-reading">
          <h2>{entry.part}</h2>
          <h3>{entry.reference}</h3>
          <p className="scripture" lang="en">{entry.text}</p>
        </section>
      ))}
      <p className="sys-small sys-readers-foot">{`Scripture quotations are from the Berean Standard Bible (public domain). ${address}`}</p>
    </div>
  );
}

interface SheetProps { paper: Paper; guides: boolean }

/** A card sheet: `paper` sets its true size; every card format is drawn a hair shorter than the paper. */
export function SympathySheet({ card, format, paper, guides }: SheetProps & { card: SympathyCard; format: Exclude<SympathyFormat, "readers"> }) {
  const size = PAPER_SIZE[paper];
  const style = { "--sheet-width": size.width, "--sheet-height": size.height } as CSSProperties;
  return (
    <div className={`sys-sheet sys-${format} sys-paper-${paper}${guides ? " sys-guides" : ""}`} style={style} data-format={format}>
      {format === "folded" && <Folded card={card} />}
      {format === "memorial" && [0, 1, 2, 3].map((index) => <div key={index} className="sys-quarter" data-quarter={String(index)}><MemorialCard card={card} /></div>)}
      {format === "display" && <Display card={card} />}
    </div>
  );
}

/** The readers' sheet of the funeral readings page: normal page flow over as many pages as it needs. */
export function ReadersSheet({ paper, title, entries, address, newPage }: { paper: Paper; title: string; entries: ReaderEntry[]; address: string; newPage: boolean }) {
  const size = PAPER_SIZE[paper];
  const style = { "--sheet-width": size.width, "--sheet-height": size.height } as CSSProperties;
  return (
    <div className={`sys-sheet sys-readers-sheet sys-paper-${paper}`} style={style} data-format="readers">
      <Readers title={title} entries={entries} address={address} newPage={newPage} />
    </div>
  );
}
