import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import './pill-scroll.css';

export default function PillScroll({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const id = useId(), viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, height: 0, total: 0 });
  const drag = useRef<{ y: number; top: number }>();
  useLayoutEffect(() => {
    const node = viewport.current!;
    const measure = () => setPosition(previous => {
      const next = { top: node.scrollTop, height: node.clientHeight, total: node.scrollHeight };
      return next.top === previous.top && next.height === previous.height && next.total === previous.total ? previous : next;
    });
    const resize = new ResizeObserver(measure);
    resize.observe(node); if (node.firstElementChild) resize.observe(node.firstElementChild);
    node.addEventListener('scroll', measure, { passive: true }); measure();
    return () => { resize.disconnect(); node.removeEventListener('scroll', measure); };
  }, [children]);
  const max = Math.max(0, position.total - position.height);
  const thumb = Math.min(position.height, Math.max(24, position.height * position.height / Math.max(1, position.total)));
  const travel = Math.max(1, position.height - thumb), top = max ? position.top / max * travel : 0;
  return <div className="mw-pill-scroll">
    <div id={id} ref={viewport} className={className} role="region" aria-label={label} tabIndex={0}>{children}</div>
    {max > 1 && <div className="mw-scroll-pill" role="scrollbar" aria-label={`Scroll ${label}`} aria-controls={id} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position.top / max * 100)} tabIndex={0}
      style={{ height: thumb, transform: `translateY(${top}px)` }}
      onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { y: event.clientY, top: viewport.current!.scrollTop }; }}
      onPointerMove={event => { if (drag.current) viewport.current!.scrollTop = drag.current.top + (event.clientY - drag.current.y) / travel * max; }}
      onPointerUp={() => { drag.current = undefined; }} onLostPointerCapture={() => { drag.current = undefined; }}
      onKeyDown={event => {
        if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const node = viewport.current!;
        node.scrollTop = event.key === 'Home' ? 0 : event.key === 'End' ? max : node.scrollTop + (event.key === 'ArrowDown' ? 40 : event.key === 'ArrowUp' ? -40 : event.key === 'PageDown' ? position.height : -position.height);
      }}><span /></div>}
  </div>;
}
