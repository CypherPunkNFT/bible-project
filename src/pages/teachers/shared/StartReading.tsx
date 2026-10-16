import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { localLibraryEnabled, workUrl } from "./acquired";
import { READING_PICKS } from "./reading-picks";
import "./start-reading.css";

export function StartReading({ side, onOpen, toneFor }: {
  side: "preachers" | "scholars";
  onOpen: (id: string, origin: Element) => void;
  toneFor: (id: string) => string;
}) {
  const [paused, setPaused] = useState(false);
  const section = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const root = section.current;
    if (!root) return;
    const measure = () => {
      root.style.setProperty('--reading-viewport', `${document.documentElement.clientWidth}px`);
      root.style.setProperty('--reading-offset', `${-root.getBoundingClientRect().left}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(document.documentElement);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <section ref={section} className="teacher-start-reading" aria-label="Start reading">
    <div className="teacher-reading-head"><p className="kicker">Start reading</p><p>Twenty enduring works. Find your next read.</p><button className="teacher-reading-pause" type="button" aria-label={paused ? 'Resume reading cards' : 'Pause reading cards'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}<span>{paused ? 'Resume' : 'Pause'}</span></button></div>
    <div className="teacher-reading-window" onTouchStart={() => setPaused(true)}>
    <div className="teacher-reading-track" data-paused={paused}>
    {[false, true].map(copy => <div className="teacher-reading-group" key={String(copy)} aria-hidden={copy || undefined}>
      {READING_PICKS[side].map(pick => {
        const href = pick.localRecord && localLibraryEnabled() ? workUrl(pick.localRecord) : pick.href;
        return <article className="teacher-reading-card" key={pick.href} style={{'--tone': toneFor(pick.profileId)} as CSSProperties}>
          <span className="teacher-reading-era">{pick.label}</span>
          <h3><a href={href} target="_blank" rel="noreferrer" tabIndex={copy ? -1 : undefined}>{pick.title}</a></h3>
          <p>{pick.reason}</p>
          <button type="button" tabIndex={copy ? -1 : undefined} onClick={event => onOpen(pick.profileId, event.currentTarget)}>{pick.author}</button>
        </article>;
      })}
    </div>)}
    </div></div>
  </section>;
}
