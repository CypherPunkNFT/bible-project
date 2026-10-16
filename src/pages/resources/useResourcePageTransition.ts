import { useEffect, useRef, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

type Transition = { finished: Promise<void>; skipTransition(): void };
type TransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => Transition };
type Destination = 'learning' | 'fellowships' | 'life';
const clear = () => {
  delete document.documentElement.dataset.resourceSlide;
  document.documentElement.style.removeProperty('--resource-old-shift');
};

export function useResourcePageTransition(preload: (name: Destination) => Promise<unknown>) {
  const location = useLocation(), navigate = useNavigate();
  const generation = useRef(0);
  const active = useRef<{ pathname: string; transition?: Transition } | null>(null);
  useEffect(() => {
    if (active.current && active.current.pathname !== location.pathname && (active.current.transition || location.pathname !== '/resources')) {
      generation.current++; active.current.transition?.skipTransition(); active.current = null; clear();
    }
  }, [location.pathname]);
  useEffect(() => () => { generation.current++; active.current?.transition?.skipTransition(); clear(); }, []);

  return async (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || location.pathname !== '/resources') return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a.st-door[href]') : null;
    if (!link || link.target || link.hasAttribute('download')) return;
    const to = new URL(link.href), match = /^\/resources\/(learning|fellowships|life)$/.exec(to.pathname);
    const doc = document as TransitionDocument;
    if (to.origin !== window.location.origin || !match || !doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    const run = ++generation.current, name = match[1] as Destination;
    active.current?.transition?.skipTransition();
    active.current = { pathname: to.pathname };
    try { await preload(name); } catch { if (run === generation.current) { active.current = null; navigate(to.pathname); } return; }
    if (run !== generation.current) return;
    const oldTop = document.querySelector('.rs-route-content')?.getBoundingClientRect().top;
    document.documentElement.dataset.resourceSlide = 'rise';
    const transition = doc.startViewTransition(async () => {
      if (run !== generation.current) return;
      flushSync(() => navigate(to.pathname));
      // Timer polling also works while the browser suspends painting for its snapshot.
      const started = performance.now();
      while (run === generation.current && !document.querySelector(`[data-resource-ready="${name}"]`) && performance.now() - started < 1500) {
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      if (run !== generation.current) return;
      window.scrollTo({ top: 0, behavior: 'instant' });
      const newTop = document.querySelector('.rs-route-content')?.getBoundingClientRect().top;
      if (oldTop !== undefined && newTop !== undefined) document.documentElement.style.setProperty('--resource-old-shift', `${oldTop - newTop}px`);
    });
    active.current = { pathname: to.pathname, transition };
    void transition.finished.catch(() => undefined).then(() => {
      if (run !== generation.current) return;
      active.current = null; clear();
    });
  };
}
