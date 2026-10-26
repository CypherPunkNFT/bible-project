import { ArrowUpRight, ChevronLeft, ChevronRight, LocateFixed, Pause, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChapterText } from '@/components/reader/ChapterText';
import { useReaderSettings } from '@/components/reader/settings';
import { locateBookTime, type AudioBook } from '@/lib/audio-playlist';
import { useCatalog } from '@/lib/catalog';
import { loadChapter } from '@/lib/data';
import { useAsync } from '@/lib/useAsync';

/** recording id -> [chapter, verse, seconds from the start of that recording], made by Research/Audio/tools/export_verse_timing.py */
type BookTiming = Record<string, [number, string, number][]>;
const TIMING_FILES = import.meta.glob<BookTiming>('../../data/listen/asv-timing/*.json', { import: 'default' });

interface Props {
  book: AudioBook;
  /** Where the player is, in seconds from the start of the book. */
  time: number;
  playing: boolean;
  onTogglePlay: () => void;
  /** Move the player to this point of the book and play. */
  onPlayFrom: (bookSeconds: number) => void;
  onClose: () => void;
}

/** The ASV text beside the audio player: the verse being read is highlighted and kept in view, and chapters turn with the voice. */
export function ReadAlongPanel({ book, time, playing, onTogglePlay, onPlayFrom, onClose }: Props) {
  const translation = useCatalog().translations.find(item => item.slug === 'asv');
  const labels = translation?.books[book.code] ?? [];
  const timingFile = TIMING_FILES[`../../data/listen/asv-timing/${book.code}.json`];
  const timing = useAsync(() => timingFile ? timingFile() : Promise.resolve(null), `timing:${book.code}`);
  const verses = timing.status === 'ready' ? timing.value : null;

  const where = locateBookTime(book, time);
  const part = book.parts[where.index];
  const partVerses = verses?.[String(part.id)];
  const spoken = partVerses ? lastStarted(partVerses, where.time) : null;
  const voiceChapter = String(spoken?.[0] ?? part.firstChapter);

  const [following, setFollowing] = useState(true);
  const [ownChapter, setOwnChapter] = useState(voiceChapter);
  const chapter = following ? voiceChapter : ownChapter;
  const highlighted = spoken && String(spoken[0]) === chapter ? spoken[1] : null;
  useEffect(() => setFollowing(true), [book.code]);
  // Without verse times the panel can only follow whole recordings: a new recording brings it back to the voice.
  useEffect(() => { if (!verses) setFollowing(true); }, [part.id, verses]);

  const text = useAsync(() => loadChapter('asv', book.code, labels, chapter), `${book.code}:${chapter}`);
  const body = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [book.code, chapter]);
  useEffect(() => {
    if (!following || !highlighted || text.status !== 'ready' || !body.current) return;
    const verse = body.current.querySelector<HTMLElement>(`[data-verse="${CSS.escape(highlighted)}"]`);
    if (verse) body.current.scrollTo({ top: Math.max(0, verse.offsetTop - body.current.clientHeight * 0.3), behavior: 'smooth' });
  }, [following, highlighted, chapter, text.status]);
  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const position = labels.indexOf(chapter);
  const previous = position > 0 ? labels[position - 1] : null;
  const next = position >= 0 && position < labels.length - 1 ? labels[position + 1] : null;
  const browse = (target: string) => { setOwnChapter(target); setFollowing(false); };
  const stopFollowing = () => { if (following) { setOwnChapter(chapter); setFollowing(false); } };
  const playVerse = (verse: string) => {
    const found = verses && findVerse(book, verses, Number(chapter), verse);
    if (!found) return;
    setFollowing(true);
    onPlayFrom(found);
  };
  const [settings] = useReaderSettings();
  const options = { redLetters: settings.redLetters, footnotes: settings.footnotes, versePerLine: settings.versePerLine };

  return <div className="asv-readalong" role="dialog" aria-modal="true" aria-labelledby="asv-readalong-title">
    <button type="button" className="asv-readalong-scrim" aria-label="Close the text" tabIndex={-1} onClick={onClose}/>
    <aside className="asv-readalong-panel">
      <header>
        <button type="button" className="asv-readalong-play" aria-label={playing ? 'Pause' : 'Play'} onClick={onTogglePlay}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button>
        <div><p className="asv-eyebrow">{verses ? 'Reading along · tap a verse to hear it' : 'Reading along · ASV'}</p><h2 id="asv-readalong-title">{book.title} {chapter}</h2></div>
        <button ref={closeButton} type="button" className="asv-readalong-close" aria-label="Close the text" onClick={onClose}><X size={20}/></button>
      </header>
      <div ref={body} className={`asv-readalong-body${verses ? ' is-timed' : ''}`} onWheel={stopFollowing} onTouchMove={stopFollowing}>
        {text.status === 'loading' && <div className="space-y-3">{[...Array(8)].map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-surface-2"/>)}</div>}
        {text.status === 'error' && <p className="text-muted">This chapter could not be loaded. <Link className="text-accent" to={`/read/asv/${book.code}/${chapter}`}>Open it in the reader</Link>.</p>}
        {text.status === 'ready' && translation && <ChapterText chapter={text.value} options={options} selected={highlighted} onSelect={playVerse} lang={translation.lang} dir={translation.dir}/>}
      </div>
      {verses && !following && <button type="button" className="asv-readalong-return" onClick={() => setFollowing(true)}><LocateFixed size={16}/>Back to the voice</button>}
      <footer>
        <button type="button" disabled={!previous} onClick={() => previous && browse(previous)}><ChevronLeft size={16}/>{previous ? `Chapter ${previous}` : 'Start'}</button>
        <Link to={`/read/asv/${book.code}/${chapter}`}>Full reader<ArrowUpRight size={14}/></Link>
        <button type="button" disabled={!next} onClick={() => next && browse(next)}>{next ? `Chapter ${next}` : 'End'}<ChevronRight size={16}/></button>
      </footer>
    </aside>
  </div>;
}

/** The verse whose start has passed (verses are in time order); null during the LibriVox opening. */
function lastStarted(verses: [number, string, number][], seconds: number): [number, string, number] | null {
  let found: [number, string, number] | null = null;
  for (const verse of verses) {
    if (verse[2] > seconds + 0.15) break;
    found = verse;
  }
  return found;
}

/** Where a verse starts, in seconds from the start of the book. */
function findVerse(book: AudioBook, timing: BookTiming, chapter: number, verse: string): number | null {
  for (const [index, part] of book.parts.entries()) {
    const hit = timing[String(part.id)]?.find(item => item[0] === chapter && item[1] === verse);
    if (hit) return book.offsets[index] + hit[2];
  }
  return null;
}
