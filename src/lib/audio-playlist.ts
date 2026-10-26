export const AUDIO_CATEGORIES = [
  { id: 'history', label: 'Historical', fullLabel: 'Historical books' },
  { id: 'poetry', label: 'Poetical', fullLabel: 'Poetical books' },
  { id: 'prophets', label: 'Prophetical', fullLabel: 'Prophetical books' },
  { id: 'gospels', label: 'Gospels & Acts', fullLabel: 'Gospels & Acts' },
  { id: 'epistles', label: 'Epistles', fullLabel: 'Epistles' },
  { id: 'revelation', label: 'Revelation', fullLabel: 'Revelation' },
] as const;
export type AudioCategory = typeof AUDIO_CATEGORIES[number]['id'];
export type RepeatMode = 'off' | 'all' | 'one';

export interface AudioPart {
  id: number;
  title: string;
  book: string;
  code: string;
  category: string;
  firstChapter: number;
  lastChapter: number;
  duration: number;
  src: string;
  publicSrc: string;
  fallbackSrc: string;
  /** The small 32 kbps AAC copy on the download site. */
  download: { url: string; bytes: number };
}

export interface AudioBook {
  code: string;
  title: string;
  category: AudioCategory;
  duration: number;
  parts: AudioPart[];
  offsets: number[];
}

/** Local previews use the verified downloads; published pages use the original public MP3s. */
export function audioPartSource(part: AudioPart, hostname: string): string {
  return ['127.0.0.1', 'localhost', '[::1]'].includes(hostname) ? part.src : part.publicSrc;
}

/** One visible book, backed by its original audio files in order. */
export function groupAudioBooks(parts: AudioPart[]): AudioBook[] {
  const books = new Map<string, AudioBook>();
  for (const part of parts) {
    if (!AUDIO_CATEGORIES.some(category => category.id === part.category)) throw new Error(`Unknown audio category: ${part.category}`);
    let book = books.get(part.code);
    if (!book) {
      book = { code: part.code, title: part.book, category: part.category as AudioCategory, duration: 0, parts: [], offsets: [] };
      books.set(part.code, book);
    }
    book.offsets.push(book.duration);
    book.parts.push(part);
    book.duration += part.duration;
  }
  return [...books.values()];
}

/** Resolve a whole-book progress position into its underlying file and offset. */
export function locateBookTime(book: AudioBook, seconds: number): { index: number; time: number } {
  const position = Math.max(0, Math.min(Number.isFinite(seconds) ? seconds : 0, book.duration - .01));
  let index = book.offsets.length - 1;
  while (index > 0 && book.offsets[index] > position) index--;
  return { index, time: position - book.offsets[index] };
}

export function formatAudioTime(seconds: number): string {
  const value = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(value / 3600), m = Math.floor(value % 3600 / 60), s = value % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/** Shuffle a complete pass, so every recording plays once before any repeats. */
export function shuffleQueue(indices: number[], first?: number): number[] {
  const queue = indices.filter(index => index !== first);
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return first !== undefined && indices.includes(first) ? [first, ...queue] : queue;
}
