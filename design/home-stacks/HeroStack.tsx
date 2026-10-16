import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { CollectionArtwork, OpenBible } from '@/components/home/HomeArtwork';
import { HOME_PATHS } from '@/components/home/collection-data';
import './hero-stack.css';

const descriptions = ['', 'Put the accounts beside one another. Trace a connection. Let the details deepen your reading.', 'Faith invites careful thought. Explore the reasons for Christian hope.', 'From the nature of God to the things of daily life. A subject leads to passages; the passages invite you to read.', 'Look beyond a name on the page. Explore the land, the cities, and the settings of the biblical story.'];
export function HeroStack() {
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const lastWheel = useRef(0);
  const touch = useRef<{x:number;y:number}|null>(null);
  const swiped = useRef(false);
  const move = (direction:number) => setActive(value => (value + direction + HOME_PATHS.length) % HOME_PATHS.length);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const wheel = (event:WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) + Math.abs(event.deltaY) < 8) return;
      event.preventDefault();
      if (Date.now() - lastWheel.current < 550) return;
      lastWheel.current = Date.now();
      move((Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) > 0 ? 1 : -1);
    };
    el.addEventListener('wheel', wheel, {passive:false});
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  return <div className="hero-stack">
    <div className="hero-card-deck" ref={frame} tabIndex={0} role="region" aria-roledescription="carousel" aria-label="Explore the collections. Scroll or use the arrow keys."
      onKeyDown={event => { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) { event.preventDefault(); move(['ArrowRight','ArrowDown'].includes(event.key)?1:-1); } }}
      onTouchStart={event => { touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY}; swiped.current=false; }}
      onTouchEnd={event => { if (!touch.current) return; const x=touch.current.x-event.changedTouches[0].clientX; const y=touch.current.y-event.changedTouches[0].clientY; if(Math.abs(x)>35&&Math.abs(x)>Math.abs(y)){move(x>0?1:-1);swiped.current=true;} touch.current=null; }}
      onClickCapture={event=>{if(swiped.current){event.preventDefault();event.stopPropagation();swiped.current=false;}}}>
      {HOME_PATHS.map((item,index) => {
        const depth=(index-active+HOME_PATHS.length)%HOME_PATHS.length;
        return <a href={item.to} key={item.title} className="hero-stack-card" aria-label={`Explore ${item.title}`} aria-hidden={depth!==0} tabIndex={depth===0?0:-1} data-depth={depth} style={{'--depth':depth,'--card-color':`var(--${item.color})`,zIndex:10-depth} as CSSProperties}>
          {index===0?<OpenBible />:<div className="hero-collection-card"><div className="hero-collection-art"><CollectionArtwork kind={item.title}/></div><div className="hero-collection-copy"><span>{item.subtitle}</span><h2>{item.title}</h2><p>{descriptions[index]}</p><strong>Explore {item.title}<ArrowUpRight size={16}/></strong></div></div>}
        </a>;
      })}
    </div>
    <div className="hero-stack-controls"><button onClick={()=>move(-1)} aria-label="Previous hero card"><ArrowLeft size={15}/></button><span aria-live="polite">{HOME_PATHS[active].title}<small>{active+1} / 5</small></span><button onClick={()=>move(1)} aria-label="Next hero card"><ArrowRight size={15}/></button></div>
    <p className="hero-stack-hint">Scroll to explore</p>
  </div>;
}
