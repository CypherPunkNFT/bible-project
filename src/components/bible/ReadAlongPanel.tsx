import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChapterText } from '@/components/reader/ChapterText';
import { useReaderSettings } from '@/components/reader/settings';
import { useCatalog } from '@/lib/catalog';
import { loadChapter } from '@/lib/data';
import { useAsync } from '@/lib/useAsync';

interface Props {
  bookCode: string;
  bookTitle: string;
  /** The first chapter of the part that is playing: the panel moves here whenever a new part starts. */
  partChapter: number;
  playing: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

/** The ASV text beside the audio player, so the recording keeps playing while you read. */
export function ReadAlongPanel({ bookCode, bookTitle, partChapter, playing, onTogglePlay, onClose }: Props) {
  const translation = useCatalog().translations.find(item => item.slug === 'asv');
  const labels = translation?.books[bookCode] ?? [];
  const [chapter, setChapter] = useState(String(partChapter));
  useEffect(() => setChapter(String(partChapter)), [bookCode, partChapter]);
  const text = useAsync(() => loadChapter('asv', bookCode, labels, chapter), `${bookCode}:${chapter}`);
  const body = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [bookCode, chapter]);
  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const position = labels.indexOf(chapter);
  const previous = position > 0 ? labels[position - 1] : null;
  const next = position >= 0 && position < labels.length - 1 ? labels[position + 1] : null;
  const [settings] = useReaderSettings();
  const options = { redLetters: settings.redLetters, footnotes: settings.footnotes, versePerLine: settings.versePerLine };

  return <div className="asv-readalong" role="dialog" aria-modal="true" aria-labelledby="asv-readalong-title">
    <button type="button" className="asv-readalong-scrim" aria-label="Close the text" tabIndex={-1} onClick={onClose}/>
    <aside className="asv-readalong-panel">
      <header>
        <button type="button" className="asv-readalong-play" aria-label={playing ? 'Pause' : 'Play'} onClick={onTogglePlay}>{playing ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor"/>}</button>
        <div><p className="asv-eyebrow">Reading along · ASV</p><h2 id="asv-readalong-title">{bookTitle} {chapter}</h2></div>
        <button ref={closeButton} type="button" className="asv-readalong-close" aria-label="Close the text" onClick={onClose}><X size={20}/></button>
      </header>
      <div ref={body} className="asv-readalong-body">
        {text.status === 'loading' && <div className="space-y-3">{[...Array(8)].map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-surface-2"/>)}</div>}
        {text.status === 'error' && <p className="text-muted">This chapter could not be loaded. <Link className="text-accent" to={`/read/asv/${bookCode}/${chapter}`}>Open it in the reader</Link>.</p>}
        {text.status === 'ready' && translation && <ChapterText chapter={text.value} options={options} selected={null} onSelect={() => {}} lang={translation.lang} dir={translation.dir}/>}
      </div>
      <footer>
        <button type="button" disabled={!previous} onClick={() => previous && setChapter(previous)}><ChevronLeft size={16}/>{previous ? `Chapter ${previous}` : 'Start'}</button>
        <Link to={`/read/asv/${bookCode}/${chapter}`}>Full reader<ArrowUpRight size={14}/></Link>
        <button type="button" disabled={!next} onClick={() => next && setChapter(next)}>{next ? `Chapter ${next}` : 'End'}<ChevronRight size={16}/></button>
      </footer>
    </aside>
  </div>;
}
