// Bible crossword: the tools around the grid (docs/visual-audits/crossword-redesign.md, audit items 1 and 6): Check and
// Reveal as two small menus instead of nine pills, a ⋯ menu for the rest on a phone, and the sheet that holds the
// Across and Down lists on a phone. Every menu and the sheet tell the play screen they are open, so the grid's keys
// stay quiet behind them, and each hands focus back to the button that opened it.
import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export interface MenuItem { label: ReactNode; onPick: () => void; danger?: boolean }

interface MenuProps {
  /** The button's words and the menu's spoken name, e.g. "Check". */
  name: ReactNode;
  icon?: ReactNode;
  items: readonly MenuItem[];
  /** Says when the menu opens or closes, so the grid's keys can stay quiet. */
  onOpenChange: (open: boolean) => void;
  className?: string;
}

/** A small menu under a button: opens on tap, closes on a pick, Escape or a tap elsewhere, and gives focus back. */
export function ToolMenu({ name, icon, items, onOpenChange, className = "" }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const toggle = (next: boolean) => { setOpen(next); onOpenChange(next); };
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>(".cw-menu-item")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); toggle(false); trigger.current?.focus({ preventScroll: true }); } };
    const onDown = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) toggle(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("pointerdown", onDown); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toggle is stable enough: it only sets state and reports
  }, [open]);
  const pick = (item: MenuItem) => { toggle(false); trigger.current?.focus({ preventScroll: true }); item.onPick(); };
  return <div ref={root} className={`cw-menu${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
    <button ref={trigger} type="button" className="cw-tool" aria-expanded={open} aria-controls={id} onClick={() => toggle(!open)}>
      {icon}{name}<ChevronDown size={14} aria-hidden="true" className="cw-tool-caret" />
    </button>
    {open && <div id={id} className="cw-menu-list" role="group" aria-label={typeof name === "string" ? name : undefined}>
      {items.map((item, i) => <button key={i} type="button" className={`cw-menu-item${item.danger ? " is-danger" : ""}`} onClick={() => pick(item)}>{item.label}</button>)}
    </div>}
  </div>;
}

interface SheetProps { open: boolean; title: ReactNode; onClose: () => void; children: ReactNode }

/** The phone's clue sheet: a native dialog sliding up from the bottom with the Across and Down lists inside. */
export function ClueSheet({ open, title, onClose, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof element.showModal === "function") { if (!element.open) element.showModal(); }
    else element.setAttribute("open", "");
    element.querySelector<HTMLButtonElement>(".cw-sheet-close")?.focus({ preventScroll: true });
    return () => {
      if (typeof element.close === "function" && element.open) element.close();
      else element.removeAttribute("open");
      opener?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return <dialog ref={dialog} className="cw-sheet" aria-labelledby="cw-sheet-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <div className="cw-sheet-body">
      <div className="cw-sheet-head">
        <h2 id="cw-sheet-title">{title}</h2>
        <button type="button" className="cw-sheet-close" onClick={onClose}>Close</button>
      </div>
      {children}
    </div>
  </dialog>;
}
