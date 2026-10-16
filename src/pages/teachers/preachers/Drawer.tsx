// The shared profile drawer of the Preachers & authors page (ported from design/authors-directions/teachers/drawer.js).
// Any section opens it with openProfile(id, originElement); it slides in from the right over a scrim, above the site
// header and everything else on the page. Previous / next (buttons or the arrow keys) walk the teachers in order, "Who
// they knew" opens another profile in place, Esc / the scrim / the close button close it, and focus goes back to the
// element that first opened it.
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePreachers } from "./context";
import { prefersReducedMotion } from "./drawer/helpers";
import { ProfileBody } from "./drawer/ProfileBody";
import { DocumentPanel } from "./drawer/DocumentPanel";
import type { ProfileWork } from "./drawer/ProfileWorks";
import "./drawer.css";

const EASE_OUT = "cubic-bezier(.16,1,.3,1)";

function focusBack(element: Element | null) {
  if ((element instanceof HTMLElement || element instanceof SVGElement) && element.isConnected) element.focus({ preventScroll: true });
}

export function Drawer() {
  const { data, profile, openProfile, closeProfile } = usePreachers();
  const people = data.people;
  const open = profile !== null;
  const wantedId = profile?.id ?? null;
  // The person on show lags the wanted one while the old profile fades out, and stays while the panel slides away.
  const [shownId, setShownId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const origin = useRef<Element | null>(null);
  const fadeIn = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const documentCloseRef = useRef<HTMLButtonElement>(null);
  const workOrigin = useRef<HTMLElement | null>(null);
  const hadWork = useRef(false);
  const [work, setWork] = useState<ProfileWork | null>(null);
  const [shownWork, setShownWork] = useState<ProfileWork | null>(null);
  const openWork = useCallback((next: ProfileWork, element?: HTMLElement) => {
    workOrigin.current = element ?? null;
    setShownWork(next); setWork(next);
  }, []);
  const closeWork = useCallback(() => { setWork(null); }, []);
  const closeAll = useCallback(() => { setWork(null); closeProfile(); }, [closeProfile]);
  useEffect(() => { setWork(null); setShownWork(null); }, [wantedId]);
  useLayoutEffect(() => {
    if(work) documentCloseRef.current?.focus({preventScroll:true});
    else if(hadWork.current) { if(workOrigin.current?.isConnected) workOrigin.current.focus({preventScroll:true}); else closeRef.current?.focus({preventScroll:true}); }
    hadWork.current=Boolean(work);
  }, [work]);
  useEffect(() => {
    if(!open)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=previous;};
  },[open]);

  // Swap the profile: straight away when the drawer is opening, with a short fade when it is already open.
  // (A layout effect, so a freshly opened drawer never paints the previous person; it runs before the open/close
  // effect below, so wasOpen still says whether the drawer was open before this change.)
  useLayoutEffect(() => {
    if (!wantedId || wantedId === shownId) return;
    if (!people.some((p) => p.id === wantedId)) {
      console.error(`Teachers drawer: no teacher with id "${wantedId}" in the data`);
      return;
    }
    const body = bodyRef.current;
    if (!wasOpen.current || !shownId || !body || prefersReducedMotion()) {
      setShownId(wantedId);
      return;
    }
    const fadeOut = body.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
    fadeOut.onfinish = () => { fadeIn.current = true; setShownId(wantedId); };
    return () => { fadeOut.onfinish = null; fadeOut.cancel(); };
  }, [wantedId, shownId, people]);

  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body || !shownId) return;
    body.scrollTop = 0;
    if (!fadeIn.current) return;
    fadeIn.current = false;
    body.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: EASE_OUT });
  }, [shownId]);

  // Opening moves focus to the close button; closing returns it to whatever opened the drawer.
  useEffect(() => {
    if (open && !wasOpen.current) {
      origin.current = profile.origin ?? document.activeElement;
      closeRef.current?.focus({ preventScroll: true });
    } else if (!open && wasOpen.current) {
      focusBack(origin.current);
      origin.current = null;
    }
    wasOpen.current = open;
  }, [open, profile]);

  const step = useCallback((delta: number) => {
    const index = people.findIndex((p) => p.id === wantedId);
    if (index < 0) return;
    openProfile(people[(index + delta + people.length) % people.length].id, origin.current);
  }, [people, wantedId, openProfile]);
  const openOther = useCallback((id: string) => openProfile(id, origin.current), [openProfile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "Escape") { event.preventDefault(); if(work) closeWork(); else closeAll(); }
      else if(event.key==='Tab') {
        const nodes=Array.from(rootRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,summary,[tabindex="0"]')??[]).filter(e=>!e.closest('[aria-hidden="true"]')&&getComputedStyle(e).visibility!=='hidden'&&e.getClientRects().length);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey&&(document.activeElement===first||!rootRef.current?.contains(document.activeElement))){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&(document.activeElement===last||!rootRef.current?.contains(document.activeElement))){event.preventDefault();first?.focus();}
      }
      else if (!work && !['INPUT','TEXTAREA','SELECT'].includes((event.target as HTMLElement)?.tagName) && (event.key === "ArrowRight" || event.key === "ArrowLeft")) step(event.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, work, closeWork, closeAll, step]);

  const person = people.find((p) => p.id === shownId) ?? null;
  const index = person ? people.indexOf(person) : -1;
  return <div ref={rootRef} className={`drw${open ? " drw-open" : ""}${work ? " drw-work-open" : ""}`} aria-hidden={!open} role="dialog" aria-modal="true" aria-label="Teacher profile">
    <div className="drw-scrim" onClick={closeAll} />
    <DocumentPanel work={shownWork} person={person} open={Boolean(work)&&open} onClose={closeWork} closeRef={documentCloseRef} />
    <aside className="drw-panel">
      <div className="drw-bar">
        <button type="button" onClick={() => step(-1)} aria-label="Previous teacher"><ArrowLeft size={16} strokeWidth={1.5} aria-hidden /></button>
        <span className="drw-count">{index >= 0 ? `${index + 1} of ${people.length}` : ""}</span>
        <button type="button" onClick={() => step(1)} aria-label="Next teacher"><ArrowRight size={16} strokeWidth={1.5} aria-hidden /></button>
        <button type="button" ref={closeRef} className="drw-close" onClick={closeAll} aria-label="Close profile"><X size={18} strokeWidth={1.5} aria-hidden /></button>
      </div>
      <div className="drw-body slim-scroll" ref={bodyRef}>
        {person && <ProfileBody key={person.id} data={data} person={person} onOpen={openOther} onOpenWork={openWork} />}
      </div>
    </aside>
  </div>;
}
