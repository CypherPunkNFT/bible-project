import { useLayoutEffect, useRef, useState } from 'react';
import { Church, CircleHelp, CircleSlash, UsersRound, X } from 'lucide-react';
import snapshot from '../../../content/missions/muslim-world.json';
import './mission-definitions.css';

export default function MissionDefinitions() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    const root = document.documentElement;
    const previousGutter = root.style.scrollbarGutter;
    root.style.scrollbarGutter = 'stable';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      root.style.scrollbarGutter = previousGutter;
    };
  }, [open]);
  function show() { dialog.current?.showModal(); setOpen(true); }
  return <div className="mw-definitions">
    <button type="button" className="mw-definition-trigger" aria-haspopup="dialog" onClick={show}><CircleHelp size={15} aria-hidden="true" />What do “unreached” and “engaged” mean?</button>
    <dialog ref={dialog} className="mw-definition-dialog" aria-labelledby="mw-definition-title" onClose={() => setOpen(false)} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
    }}>
      <header className="mw-definition-heading"><div><p className="ap-eyebrow">Reading the atlas</p><h2 id="mw-definition-title">People. Churches. Presence.</h2></div><button type="button" className="mw-definition-close" aria-label="Close explanation" onClick={() => dialog.current?.close()}><X size={18} aria-hidden="true" /></button></header>
      <section className="mw-definition-row"><UsersRound aria-hidden="true" /><div><h3>Unreached</h3><p>Less than 2% evangelical Christians within a people group.</p></div></section>
      <section className="mw-definition-row"><Church aria-hidden="true" /><div><h3>Engaged</h3><p>Sustained work to establish evangelical churches that can support themselves.</p></div></section>
      <section className="mw-definition-row"><span className="mw-definition-absence" aria-hidden="true"><Church /><CircleSlash /></span><div><h3>Unengaged</h3><p>No known effort toward that goal. The table uses reported church-planting activity over the past two years.</p></div></section>
      <p className="mw-definition-takeaway">Engaged can still mean unreached.</p>
      <footer className="mw-definition-footer"><p>“No longer unreached” means 2% or more.<br />It does not mean everyone is Christian. These labels describe people groups, rather than whole countries.</p><a href="https://peoplegroups.org/definitions/" target="_blank" rel="noreferrer">IMB definitions ↗</a></footer>
      <div className="mw-definition-credit"><span>Country aggregates by Bible Project · <a href={snapshot.sources.imb.url} target="_blank" rel="noreferrer">IMB Global Research</a> · {snapshot.snapshotDate} · <a href={snapshot.sources.imb.licenseUrl} target="_blank" rel="noreferrer">CC BY-NC 4.0</a></span><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Boundaries: Natural Earth ↗</a></div>
    </dialog>
  </div>;
}
