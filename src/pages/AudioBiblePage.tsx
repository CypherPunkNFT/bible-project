import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, ChevronDown, Headphones, ListMusic, Pause, Play, Repeat, Repeat1, RotateCcw, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import recording from '@/data/listen/asv.json';
import { AUDIO_CATEGORIES, audioPartSource, audioSources, formatAudioTime, groupAudioBooks, locateBookTime, shuffleQueue, type AudioPart, type RepeatMode } from '@/lib/audio-playlist';
import { AudioBibleCover } from '@/components/bible/AudioBibleCover';
import { AllDownloads, PlayerActions } from '@/components/bible/AudioDownloads';
import { ReadAlongPanel } from '@/components/bible/ReadAlongPanel';
import { AUDIO_ICONS } from '@/components/bible/audio-category-icons';
import './audio-bible.css';

const BOOKS = groupAudioBooks(recording.tracks);
const SAVE_KEY = 'bp-asv-audio-position';
const LOAD_TIMEOUT_MS = 12000;
/** Set once both archive.org addresses have failed: the rest of this visit plays our own copies, without waiting again. */
let archiveDown = false;
/** The first source for a part: the local file on a preview, otherwise archive.org, or our copy once archive.org is down. */
const startSource = (part: AudioPart) => audioPartSource(part, location.hostname) === part.src ? part.src : audioSources(part)[archiveDown ? 2 : 0];
function readPosition() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
    let index = BOOKS.findIndex(book => book.code === saved?.book);
    let time = saved?.time;
    // Preserve positions saved before the files were grouped into books.
    if (index < 0 && saved?.id !== undefined) {
      index = BOOKS.findIndex(book => book.parts.some(part => part.id === saved.id));
      if (index >= 0) {
        const part = BOOKS[index].parts.findIndex(part => part.id === saved.id);
        time = BOOKS[index].offsets[part] + (Number.isFinite(saved.time) ? Math.max(0, Math.min(saved.time, BOOKS[index].parts[part].duration)) : 0);
      }
    }
    return { index: Math.max(0, index), time: index >= 0 && Number.isFinite(time) ? Math.max(0, Math.min(time, BOOKS[index].duration - 1)) : 0 };
  } catch { return { index: 0, time: 0 }; }
}

export default function AudioBiblePage() {
  const [initial] = useState(readPosition);
  const [index, setIndex] = useState(initial.index);
  const [playing, setPlaying] = useState(false);
  const [reading, setReading] = useState(false);
  const closeReading = useCallback(() => setReading(false), []);
  const [time, setTime] = useState(initial.time);
  const [category, setCategory] = useState('all');
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const trackList = useRef<HTMLDivElement>(null);
  const currentIndex = useRef(initial.index);
  const currentPart = useRef(locateBookTime(BOOKS[initial.index], initial.time).index);
  const pendingSeek = useRef<number | null>(locateBookTime(BOOKS[initial.index], initial.time).time);
  const lastSaved = useRef(0);
  const loadTimer = useRef<number | undefined>(undefined);
  const bindAudio = useCallback((element: HTMLAudioElement | null) => {
    audio.current = element;
    // Set the initial source during commit, before an immediate Play/resume interaction.
    if (element) element.src = startSource(BOOKS[initial.index].parts[currentPart.current]);
  }, [initial]);
  const [queue, setQueue] = useState<number[]>(() => BOOKS.map((_, index) => index));
  const book = BOOKS[index];
  const duration = book.duration;
  const tone = { '--audio-tone': `var(--${book.category})` } as CSSProperties;
  const categoryInfo = AUDIO_CATEGORIES.find(item => item.id === book.category)!;
  const visible = useMemo(() => BOOKS.map((book, index) => ({ ...book, index })).filter(book => category === 'all' || book.category === category), [category]);
  const indices = useMemo(() => visible.map(book => book.index), [visible]);

  useEffect(() => {
    setQueue(shuffle ? shuffleQueue(indices, currentIndex.current) : indices);
  }, [indices, shuffle]);

  useEffect(() => {
    const list = trackList.current;
    const active = list?.querySelector<HTMLButtonElement>('[aria-current="true"]');
    if (!list || !active) return;
    const container = list.getBoundingClientRect(), row = active.getBoundingClientRect();
    if (row.top < container.top || row.bottom > container.bottom) list.scrollTop += row.top - container.top - list.clientHeight / 2 + row.height / 2;
  }, [index, visible]);

  function bookPosition() {
    return BOOKS[currentIndex.current].offsets[currentPart.current] + (pendingSeek.current ?? audio.current?.currentTime ?? 0);
  }

  function savePosition() {
    if (!audio.current) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ book: BOOKS[currentIndex.current].code, time: bookPosition() })); } catch { /* Playback also works without storage. */ }
  }

  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const save = () => {
      const book = BOOKS[currentIndex.current];
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ book: book.code, time: book.offsets[currentPart.current] + (pendingSeek.current ?? element.currentTime) })); } catch { /* Storage may be unavailable. */ }
    };
    window.addEventListener('pagehide', save);
    return () => { save(); element.pause(); window.clearTimeout(loadTimer.current); window.removeEventListener('pagehide', save); };
  }, [initial]);

  function playAudio() {
    const element = audio.current;
    if (!element) return;
    setError('');
    const requested = element.src;
    const part = BOOKS[currentIndex.current].parts[currentPart.current];
    if (audioPartSource(part, location.hostname) !== part.src) watchLoad();
    if (element.error) element.load();
    void element.play().catch((reason: Error) => {
      if (reason.name !== 'AbortError' && requested === element.src) {
        if (element.error) recoverAudio();
        else { setError('This audio couldn’t start. Try playing it again.'); setPlaying(false); }
      }
    });
  }

  function recoverAudio() {
    const element = audio.current;
    if (element?.error) nextSource(element.src);
  }

  /** archive.org can also hang without an error, so a source that has not started within the time limit counts as failed. */
  function watchLoad() {
    const element = audio.current;
    window.clearTimeout(loadTimer.current);
    if (!element) return;
    const requested = element.src;
    loadTimer.current = window.setTimeout(() => {
      if (element.src === requested && element.readyState < HTMLMediaElement.HAVE_METADATA && !element.paused) nextSource(requested);
    }, LOAD_TIMEOUT_MS);
  }

  /** Moves to the next source after `failed`; a late or repeated failure of a source already replaced is ignored. */
  function nextSource(failed: string) {
    const element = audio.current;
    if (!element || element.src !== failed) return;
    const sources = audioSources(BOOKS[currentIndex.current].parts[currentPart.current]);
    const step = sources.findIndex(source => new URL(source, location.href).href === failed);
    if (step >= 0 && step < sources.length - 1) {
      if (step + 1 === sources.length - 1) archiveDown = true;
      pendingSeek.current = pendingSeek.current ?? element.currentTime;
      element.src = sources[step + 1];
      element.load();
      element.playbackRate = speed;
      playAudio();
      return;
    }
    window.clearTimeout(loadTimer.current);
    setPlaying(false);
    setError('This audio is unavailable right now. Try again or choose another book.');
  }

  function loadPart(nextBook: number, nextPart: number, localTime: number, autoplay: boolean) {
    const element = audio.current;
    if (!element || !BOOKS[nextBook]?.parts[nextPart]) return;
    currentIndex.current = nextBook; currentPart.current = nextPart; pendingSeek.current = localTime;
    setIndex(nextBook); setTime(BOOKS[nextBook].offsets[nextPart] + localTime); setError('');
    element.src = startSource(BOOKS[nextBook].parts[nextPart]);
    element.playbackRate = speed;
    if (autoplay) playAudio(); else element.load();
  }

  function selectBook(next: number, autoplay = true) { loadPart(next, 0, 0, autoplay); }
  // Starting playback opens the text beside it; moving on to the next recording by itself does not reopen a closed panel.
  function togglePlay() {
    if (!audio.current) return;
    if (audio.current.paused) { setReading(true); playAudio(); } else audio.current.pause();
  }

  function advance(direction: 1 | -1, ended = false) {
    const element = audio.current;
    if (!element) return;
    if (direction === -1 && bookPosition() > 3) { selectBook(currentIndex.current, !element.paused); return; }
    let order = queue;
    if (!order.length) { if (ended) setPlaying(false); return; }
    const position = order.indexOf(currentIndex.current);
    let nextPosition = position < 0 ? (direction === 1 ? 0 : order.length - 1) : position + direction;
    if (nextPosition < 0 || nextPosition >= order.length) {
      if (repeat !== 'all') { if (ended) { setPlaying(false); savePosition(); } return; }
      if (shuffle && direction === 1) { order = shuffleQueue(indices); setQueue(order); }
      nextPosition = direction === 1 ? 0 : order.length - 1;
    }
    selectBook(order[nextPosition], ended || !element.paused);
  }

  function finishPart() {
    const active = BOOKS[currentIndex.current];
    if (currentPart.current < active.parts.length - 1) loadPart(currentIndex.current, currentPart.current + 1, 0, true);
    else if (repeat === 'one') selectBook(currentIndex.current, true);
    else advance(1, true);
  }

  function seek(value: number) {
    const element = audio.current;
    if (!element) return;
    const target = locateBookTime(BOOKS[currentIndex.current], value);
    if (target.index !== currentPart.current) loadPart(currentIndex.current, target.index, target.time, !element.paused);
    else {
      setTime(value);
      if (element.readyState >= 1) { element.currentTime = target.time; pendingSeek.current = null; }
      else pendingSeek.current = target.time;
    }
    savePosition();
  }

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({ title: book.title, artist: 'Ron Altman · LibriVox', album: 'American Standard Version · The complete Bible' });
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, [book.title, playing]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', playAudio], ['pause', () => audio.current?.pause()],
      ['previoustrack', () => advance(-1)], ['nexttrack', () => advance(1)],
      ['seekbackward', details => seek(Math.max(0, bookPosition() - (details.seekOffset ?? 10)))],
      ['seekforward', details => seek(Math.min(duration, bookPosition() + (details.seekOffset ?? 10)))],
      ['seekto', details => { if (details.seekTime !== undefined) seek(details.seekTime); }],
    ];
    for (const [action, handler] of handlers) { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* Some browsers support fewer actions. */ } }
    return () => { for (const [action] of handlers) { try { navigator.mediaSession.setActionHandler(action, null); } catch { /* Unsupported action. */ } } };
  });

  const position = queue.indexOf(index);
  const previousDisabled = indices.length === 0 || (repeat !== 'all' && position === 0 && time <= 3);
  const nextDisabled = indices.length === 0 || (repeat !== 'all' && position === indices.length - 1);
  const RepeatIcon = repeat === 'one' ? Repeat1 : Repeat;
  const repeatLabel = repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat playlist' : 'Repeat book';
  const CategoryIcon = AUDIO_ICONS[book.category];

  return <div className="asv-page mx-auto max-w-7xl px-4 sm:px-6" style={tone}>
    <audio ref={bindAudio} preload="none" onPlay={() => setPlaying(true)} onPause={() => { setPlaying(false); savePosition(); }} onEnded={finishPart}
      onError={recoverAudio}
      onLoadedMetadata={() => { window.clearTimeout(loadTimer.current); const element = audio.current!; element.playbackRate = speed; if (pendingSeek.current !== null) { element.currentTime = Math.min(pendingSeek.current, Math.max(0, element.duration - .01)); pendingSeek.current = null; } }}
      onTimeUpdate={() => { setTime(bookPosition()); if (Date.now() - lastSaved.current > 5000) { savePosition(); lastSaved.current = Date.now(); } }}/>
    <nav className="asv-breadcrumb" aria-label="Breadcrumb"><Link to="/listen"><ArrowLeft size={14}/>Listen</Link><span>/</span><span>ASV audio Bible</span></nav>
    <header className="asv-heading"><div><p className="asv-eyebrow">The complete audio Bible</p><h1>The whole Bible.<br/><em>One quiet voice.</em></h1><p>American Standard Version · Read by Ron Altman</p></div><div className="asv-collection-meta"><span><BookOpen size={16}/>66 books</span><span><ListMusic size={16}/>One complete playlist</span><span><Headphones size={16}/>104 hours of Scripture</span></div></header>
    <div className="asv-layout">
      <section className="asv-player" aria-label="ASV audio player">
        <AudioBibleCover category={book.category}/>
        <div className="asv-player-body"><p className="asv-eyebrow"><CategoryIcon size={14}/>{categoryInfo.fullLabel}</p><h2 aria-live="polite">{book.title}</h2><p className="asv-voice">Ron Altman <span>·</span> ASV 1901</p>
          <div className="asv-progress"><label className="sr-only" htmlFor="asv-progress">Book progress</label><input id="asv-progress" type="range" min="0" max={duration} step="1" value={Math.min(time,duration)} onChange={event => seek(Number(event.target.value))} aria-valuetext={`${formatAudioTime(time)} of ${formatAudioTime(duration)}`}/><div><span>{formatAudioTime(time)}</span><span>{formatAudioTime(duration)}</span></div></div>
          <div className="asv-controls"><button type="button" className={shuffle ? 'is-active' : ''} aria-label="Shuffle" aria-pressed={shuffle} title="Shuffle books" onClick={() => setShuffle(!shuffle)}><Shuffle size={18}/></button><button type="button" aria-label="Previous book" disabled={previousDisabled} onClick={() => advance(-1)}><SkipBack size={22} fill="currentColor"/></button><button type="button" className="asv-play" aria-label={playing ? 'Pause book' : 'Play book'} onClick={togglePlay}>{playing ? <Pause size={25} fill="currentColor"/> : <Play size={25} fill="currentColor"/>}</button><button type="button" aria-label="Next book" disabled={nextDisabled} onClick={() => advance(1)}><SkipForward size={22} fill="currentColor"/></button><button type="button" className={repeat !== 'off' ? 'is-active' : ''} aria-label={repeatLabel} aria-pressed={repeat !== 'off'} title={`${repeatLabel} · click to change`} onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}><RepeatIcon size={19}/></button></div>
          <div className="asv-secondary"><label className="asv-volume"><Volume2 size={16}/><span className="sr-only">Volume</span><input type="range" min="0" max="1" step=".05" value={volume} onChange={event => { const value = Number(event.target.value); setVolume(value); if (audio.current) audio.current.volume = value; }}/></label><label className="asv-speed"><span className="sr-only">Playback speed</span><select value={speed} onChange={event => { const value = Number(event.target.value); setSpeed(value); if (audio.current) audio.current.playbackRate = value; }}>{[.75,1,1.25,1.5,2].map(value => <option value={value} key={value}>{value}× speed</option>)}</select><ChevronDown size={12}/></label></div>
          {error && <div className="asv-error" role="alert"><p>{error}</p><button type="button" onClick={playAudio}><RotateCcw size={14}/>Try again</button></div>}
          <PlayerActions book={book} reading={reading} onRead={() => { setReading(true); if (audio.current?.paused) playAudio(); }}/>
        </div>
      </section>
      <section className="asv-playlist" aria-labelledby="asv-playlist-title"><div className="asv-playlist-content"><header className="asv-playlist-heading"><div><p className="asv-eyebrow">Your listening queue</p><h2 id="asv-playlist-title">From Genesis to Revelation</h2></div><span>{visible.length} {visible.length === 1 ? 'book' : 'books'}</span></header>
        <div className="asv-categories" role="group" aria-label="Bible category"><button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All books</button>{AUDIO_CATEGORIES.map(item => <button type="button" key={item.id} style={{'--category-tone':`var(--${item.id})`} as CSSProperties} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}><i/>{item.label}</button>)}</div>
        <div ref={trackList} className="asv-track-list" role="list" aria-label="Bible books">{visible.map(item => {
          const Icon = AUDIO_ICONS[item.category];
          const active = item.index === index;
          return <div role="listitem" key={item.code}><button type="button" className={`asv-track${active ? ' is-current' : ''}`} style={{'--track-tone':`var(--${item.category})`} as CSSProperties} aria-label={`Play ${item.title}`} aria-current={active ? 'true' : undefined} onClick={() => { if (active) togglePlay(); else { setReading(true); selectBook(item.index); } }}><span className="asv-track-number">{String(item.index + 1).padStart(2,'0')}</span><span className="asv-track-art"><Icon size={21} strokeWidth={1.3}/></span><span className="asv-track-copy"><strong>{item.title}</strong><small>{AUDIO_CATEGORIES.find(category => category.id === item.category)?.fullLabel}</small></span><span className="asv-track-duration">{formatAudioTime(item.duration)}</span><span className="asv-track-action">{active && playing ? <Pause size={15} fill="currentColor"/> : <Play size={15}/>}</span></button></div>;
        })}</div>
      </div></section>
    </div>
    <AllDownloads books={BOOKS}/>
    {reading && <ReadAlongPanel book={book} time={time} playing={playing} onTogglePlay={togglePlay} onPlayFrom={seconds => { seek(seconds); if (audio.current?.paused) playAudio(); }} onClose={closeReading}/>}
    <footer className="asv-credits"><div><p className="asv-eyebrow">Freely given. Freely heard.</p><h2>With gratitude to LibriVox<br/>and Ron Altman.</h2></div><div><p>The American Standard Version (1901), read in full by Ron Altman. The text and this LibriVox recording are in the public domain.</p><a href={recording.sourceUrl} target="_blank" rel="noopener noreferrer">Original LibriVox recording<ArrowUpRight size={14}/></a><a href={recording.archiveUrl} target="_blank" rel="noopener noreferrer">Internet Archive collection<ArrowUpRight size={14}/></a></div></footer>
    <div className="asv-mobile-player" aria-label="Quick playback controls"><span className="asv-mobile-art"><CategoryIcon size={21}/></span><div><strong>{book.title}</strong><span>{playing ? 'Now playing' : 'Ready to listen'} · Ron Altman</span></div><button type="button" aria-label={playing ? 'Pause audio' : 'Play audio'} onClick={togglePlay}>{playing ? <Pause size={22} fill="currentColor"/> : <Play size={22} fill="currentColor"/>}</button><button type="button" disabled={nextDisabled} aria-label="Next audio" onClick={() => advance(1)}><SkipForward size={20}/></button><i style={{width:`${Math.min(100,time/duration*100)}%`}}/></div>
  </div>;
}
