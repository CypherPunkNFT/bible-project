import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { SlideLink } from "@/components/people-pages/SlideLink";
import { useCarried } from "@/components/people-pages/use-carried";
import { personPath } from "@/lib/people-pages-index";
import { readingPlace, WHO } from "./data";
import { rememberPlace } from "./place";
import { Icon } from "./ui";

/**
 * Which apostle this is: "5 / 12" in the serif of his name, with the previous and next apostle either side; a click
 * opens the list of the Twelve (Matthew 10's order), then Matthias and Paul below a divider (they read as their names,
 * not as a thirteenth and fourteenth). It floats just below the site's header the whole length of the page, so the
 * reader can switch apostle from anywhere; the switch is the people pages' wipe (SlideLink, usePeoplePageSlide), and the
 * new page opens at the same section the reader was in.
 */
export function Counter({ id }: { id: string }) {
  const carried = useCarried();
  const [open, setOpen] = useState(false);
  const menuId = useId(), button = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const at = WHO.findIndex((w) => w.id === id), here = WHO[at];
  const prev = WHO[(at + WHO.length - 1) % WHO.length], next = WHO[(at + 1) % WHO.length];

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!(e.target instanceof Node) || !menu.current?.parentElement?.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  /** Keep the reader's place for the page about to open (an ordinary click only: a new tab keeps nothing). */
  const keep = (event: MouseEvent) => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) rememberPlace(readingPlace()); };
  const link = (w: (typeof WHO)[number], label: string, extra: Record<string, string> = {}) =>
    <SlideLink to={personPath(w.id, "mission")} state={carried} onClick={keep} {...extra}>{label}</SlideLink>;

  // Opened from the keyboard, the list takes the focus on this apostle's name once it is drawn open.
  const focusOnOpen = useRef(false);
  const openMenu = (focusCurrent: boolean) => { focusOnOpen.current = focusCurrent; setOpen(true); };
  useEffect(() => {
    if (!open || !focusOnOpen.current) return;
    focusOnOpen.current = false;
    menu.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]')?.focus();
  }, [open]);
  const onMenuKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(menu.current?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); button.current?.focus(); return; }
    const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 0;
    if (step) { event.preventDefault(); items[(Math.max(0, i) + step + items.length) % items.length]?.focus(); }
    if (event.key === "Home" || event.key === "End") { event.preventDefault(); items[event.key === "Home" ? 0 : items.length - 1]?.focus(); }
  };
  if (!here) return null;
  const twelve = at < 12;
  return <div className="ap-float">
    <div className="ap-float-in">
      <nav className={`ap-count${open ? " open" : ""}`} aria-label="The apostles">
        <SlideLink className="ap-count-step" to={personPath(prev.id, "mission")} state={carried} onClick={keep} rel="prev" aria-label={`Previous: ${prev.name}`}><Icon name="chevronLeft" size={18} /></SlideLink>
        <button ref={button} type="button" className="ap-count-btn" aria-haspopup="true" aria-expanded={open} aria-controls={menuId}
          aria-label={`${here.name}${twelve ? `, ${at + 1} of the Twelve` : ""}. Choose an apostle`}
          onClick={(e) => (open ? setOpen(false) : openMenu(e.detail === 0))}
          onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); openMenu(true); } }}>
          {twelve ? <><span className="ap-count-n">{at + 1}</span><span className="ap-count-of"> / 12</span></>
            : <><span className="ap-count-k">After the Twelve</span><span className="ap-count-name">{here.short}</span></>}
        </button>
        <SlideLink className="ap-count-step" to={personPath(next.id, "mission")} state={carried} onClick={keep} rel="next" aria-label={`Next: ${next.name}`}><Icon name="chevronRight" size={18} /></SlideLink>
        <div ref={menu} id={menuId} className={`ap-count-menu${open ? " open" : ""}`} onKeyDown={onMenuKey}>
          <p className="ap-count-h">The Twelve · Matthew 10:2–4</p>
          <ol>{WHO.slice(0, 12).map((w, k) => <li key={w.id}>{link(w, w.name, { "data-n": String(k + 1), ...(w.id === id ? { "aria-current": "page" } : {}) })}</li>)}</ol>
          <p className="ap-count-h ap-count-div">After the Twelve</p>
          <ol>{WHO.slice(12).map((w) => <li key={w.id}>{link(w, w.name, { "data-n": w.key === "matthias" ? "Acts 1" : "Acts 9", ...(w.id === id ? { "aria-current": "page" } : {}) })}</li>)}</ol>
        </div>
      </nav>
    </div>
  </div>;
}
