import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import template from './template.html?raw';
import styles from './circles.css?inline';
import { mountCircles } from './runtime.mjs';

/** The approved explorer owns its SVG/reader DOM; the shadow boundary isolates its styles. */
export default function CirclesPage() {
  const { leaderId } = useParams();
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const root = element.shadowRoot ?? element.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${styles}</style>${template}`;
    const controller = new AbortController();
    const oldOverflow = document.body.style.overflow;
    const oldGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = 'stable';
    const app = root.querySelector('.circles-app')!;
    const syncTheme = () => app.classList.toggle('light', document.documentElement.dataset.theme === 'light');
    syncTheme();
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const observer = new MutationObserver(() => {
      document.body.style.overflow = app.classList.contains('map-open') || app.classList.contains('reader-open') ? 'hidden' : oldOverflow;
    });
    observer.observe(app, { attributes: true, attributeFilter: ['class'] });
    let dispose: (() => void) | undefined;
    setError('');
    mountCircles(root, { leaderId, signal: controller.signal }).then(cleanup => {
      if (controller.signal.aborted) cleanup(); else dispose = cleanup;
    }).catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => {
      controller.abort(); dispose?.(); observer.disconnect(); themeObserver.disconnect();
      document.body.style.overflow = oldOverflow;
      document.documentElement.style.scrollbarGutter = oldGutter;
      root.replaceChildren(); document.title = 'Bible Project';
    };
  }, [leaderId]);
  return <>{error && <p role="alert" className="mx-auto max-w-7xl p-6">{error}</p>}<div ref={host} data-circles-experience="approved" /></>;
}
