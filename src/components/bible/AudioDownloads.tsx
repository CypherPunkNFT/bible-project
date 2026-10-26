import { BookOpen, Download } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { AudioBook } from '@/lib/audio-playlist';

/** "18 MB", "4.2 MB", "1.4 GB" — sizes as a download dialog shows them. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  const megabytes = bytes / 1e6;
  return `${megabytes < 10 ? megabytes.toFixed(1) : Math.round(megabytes)} MB`;
}

const bookBytes = (book: AudioBook) => book.parts.reduce((sum, part) => sum + part.download.bytes, 0);

function PartLinks({ book }: { book: AudioBook }) {
  return <ul className="asv-download-parts">{book.parts.map(part => <li key={part.id}>
    <a href={part.download.url} download aria-label={`Download ${part.title}, ${formatBytes(part.download.bytes)}`}><Download size={13} aria-hidden/>{part.title}<span>{formatBytes(part.download.bytes)}</span></a>
  </li>)}</ul>;
}

function ActionLabel({ title, detail }: { title: string; detail: string }) {
  return <span className="asv-action-copy"><strong>{title}</strong><small>{detail}</small></span>;
}

/** Under the player, side by side: open the text beside the player, and download the book (a book with several parts opens its file list below the row). */
export function PlayerActions({ book, reading, onRead }: { book: AudioBook; reading: boolean; onRead: () => void }) {
  const [partsOpen, setPartsOpen] = useState(false);
  useEffect(() => setPartsOpen(false), [book.code]);
  const single = book.parts.length === 1;
  const detail = `${book.title} · ${formatBytes(bookBytes(book))}`;
  const icon = <span className="asv-action-icon" aria-hidden><Download size={24}/></span>;
  return <div className="asv-actions">
    <button type="button" className="asv-action" aria-haspopup="dialog" aria-expanded={reading} onClick={onRead}><span className="asv-action-icon" aria-hidden><BookOpen size={24}/></span><ActionLabel title="Read alongside" detail="Follow the text here"/></button>
    {single
      ? <a className="asv-action" href={book.parts[0].download.url} download>{icon}<ActionLabel title="Download" detail={detail}/></a>
      : <button type="button" className="asv-action" aria-expanded={partsOpen} aria-controls="asv-book-parts" onClick={() => setPartsOpen(!partsOpen)}>{icon}<ActionLabel title="Download" detail={detail}/></button>}
    {!single && partsOpen && <div id="asv-book-parts" className="asv-action-parts"><PartLinks book={book}/></div>}
  </div>;
}

/** Above the credits: every book, so the whole Bible can be taken offline. */
export function AllDownloads({ books }: { books: AudioBook[] }) {
  const total = books.reduce((sum, book) => sum + bookBytes(book), 0);
  return <section className="asv-downloads" aria-labelledby="asv-downloads-title">
    <header><p className="asv-eyebrow">Take it with you</p><h2 id="asv-downloads-title">Download the audio Bible</h2>
      <p>Every book as small audio files that play on any phone or computer, with no internet needed. {formatBytes(total)} for the whole Bible. Free to keep and share.</p></header>
    <div className="asv-download-grid">{books.map(book => <details key={book.code} style={{ '--track-tone': `var(--${book.category})` } as CSSProperties}>
      <summary><i aria-hidden/>{book.title}<span>{formatBytes(bookBytes(book))}</span></summary>
      <PartLinks book={book}/>
    </details>)}</div>
  </section>;
}
