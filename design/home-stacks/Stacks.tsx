import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { CollectionArtwork, HomeArtwork } from '@/components/home/HomeArtwork';
import { HOME_PATHS, HOME_STUDIES, HOME_TOPICS } from '@/components/home/collection-data';
import './stacks.css';

const contents = [
  [{ title: 'Begin with John 1', to: '/read/kjv/JHN/1', text: 'In the beginning was the Word.', art: 'scripture' }, { title: 'Bible library', to: '/library', text: 'Find your version. Find your place.', art: 'structure' }],
  HOME_STUDIES,
  [{ title: 'Learning paths', to: '/apologetics/paths', text: 'Explore the reasons for Christian hope.', art: 'connections' }, { title: 'Historic texts', to: '/apologetics/texts', text: 'Read the voices behind the questions.', art: 'scripture' }, { title: 'Practice & conversation', to: '/apologetics/practice', text: 'Speak with conviction and gentleness.', art: 'church' }],
  HOME_TOPICS,
  [{ title: 'Explore the map', to: '/study/atlas/map', text: 'Every place opens a passage.', art: 'atlas' }, { title: 'Ancient Cities', to: '/study/atlas/cities', text: 'Enter a city. Understand its setting.', art: 'cities' }, { title: 'Journeys', to: '/study/atlas/journeys', text: 'Called to follow.', art: 'journeys' }],
];

function Stack({ index }: { index: number }) {
  const collection = HOME_PATHS[index];
  const cards = [{ ...collection, text: collection.subtitle, art: '' }, ...contents[index]];
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const move = (direction: number) => setActive(current => (current + direction + cards.length) % cards.length);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) + Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      if (Date.now() - lastWheel.current < 500) return;
      lastWheel.current = Date.now();
      move((Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) > 0 ? 1 : -1);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [cards.length]);
  return <section className="collection-stack" style={{ '--home-color': `var(--${collection.color})` } as CSSProperties} aria-label={`${collection.title} card stack`}>
    <div className="stack-heading"><a href={collection.to}>{collection.title}<ArrowUpRight size={12} /></a><span>{String(index + 1).padStart(2, '0')}</span></div>
    <div ref={frame} className="stack-deck" tabIndex={0} aria-label={`${collection.title}: use arrow keys to browse`}
      onKeyDown={event => { if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); move(['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1); } }}
      onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; suppressClick.current = false; }}
      onTouchEnd={event => { if (!touch.current) return; const dx = touch.current.x - event.changedTouches[0].clientX; const dy = touch.current.y - event.changedTouches[0].clientY; if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) { move(dx > 0 ? 1 : -1); suppressClick.current = true; } touch.current = null; }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      {cards.map((card, cardIndex) => {
        const depth = (cardIndex - active + cards.length) % cards.length;
        return <a key={card.to} href={card.to} className="stack-card" data-depth={depth} tabIndex={depth === 0 ? 0 : -1} aria-hidden={depth !== 0} style={{ '--depth': depth, zIndex: cards.length - depth } as CSSProperties}>
          <div className="stack-art">{card.art ? <HomeArtwork kind={card.art} /> : <CollectionArtwork kind={collection.title} />}</div>
          <div className="stack-card-copy"><h2>{card.title}</h2><p>{card.text}</p><ArrowUpRight size={17} aria-hidden /></div>
        </a>;
      })}
    </div>
    <div className="stack-controls"><button onClick={() => move(-1)} aria-label={`Previous ${collection.title} card`}><ArrowLeft size={14} /></button><span aria-live="polite" aria-atomic="true">{active + 1} <i>/</i> {cards.length}<span className="sr-only">: {cards[active].title}</span></span><button onClick={() => move(1)} aria-label={`Next ${collection.title} card`}><ArrowRight size={14} /></button></div>
  </section>;
}

export function Stacks() {
  return <div className="home-wrap stacks-opening"><div className="stacks-caption"><span>Five collections. Many ways in.</span><span>Scroll a stack to explore <span aria-hidden>↓</span></span></div><div className="collection-stacks">{HOME_PATHS.map((item, index) => <Stack key={item.title} index={index} />)}</div></div>;
}
