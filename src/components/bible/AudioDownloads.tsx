import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';
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

/** Under the player: the book that is playing, one link per recorded part. */
export function BookDownload({ book }: { book: AudioBook }) {
  if (book.parts.length === 1) {
    const part = book.parts[0];
    return <a className="asv-download-book" href={part.download.url} download><Download size={15} aria-hidden/>Download {book.title}<span>{formatBytes(part.download.bytes)}</span></a>;
  }
  return <details className="asv-download-book">
    <summary><Download size={15} aria-hidden/>Download {book.title}<span>{book.parts.length} files · {formatBytes(bookBytes(book))}</span></summary>
    <PartLinks book={book}/>
  </details>;
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
