// Timeline sort's card list (design §9, §7.1): an ordered list, earliest at the top, each card a button. Drag by the
// grip (or long-press / mouse-drag the card), tap a card then where it goes, or pick it up with Enter or Space and move
// it with the arrow keys. After a Daily Check, right-place ticks and "belong together" links show between tries.
import { Check, ChevronDown, ChevronUp, GripVertical, Link2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { shiftOf, useSortable } from "./useSortable";

export interface Marks { ticks: boolean[]; joins: boolean[] }

interface Props {
  order: readonly string[];
  labelOf: (id: string) => string;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  marks?: Marks | null;
}

export function SortList({ order, labelOf, onMove, disabled = false, marks }: Props) {
  const [announcement, setAnnouncement] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const focusAt = useRef<number | null>(null);
  const n = order.length;

  const move = useCallback((from: number, to: number) => {
    const id = order[from];
    onMove(from, to);
    focusAt.current = to;
    setAnnouncement(`${labelOf(id)}, now position ${to + 1} of ${n}`);
  }, [labelOf, n, onMove, order]);

  const sortable = useSortable({ count: n, disabled, onMove: move });
  const { lifted, drag } = sortable;

  // Focus stays on the moved card (§9.4).
  useEffect(() => {
    if (focusAt.current === null) return;
    buttons.current[focusAt.current]?.focus({ preventScroll: true });
    focusAt.current = null;
  }, [order]);
  // Keyed on the card, not its slot, so moving a lifted card does not drown its "now position" with "Selected" again.
  const liftedId = lifted === null ? null : order[lifted];
  useEffect(() => {
    if (liftedId !== null && lifted !== null) setAnnouncement(`Selected ${labelOf(liftedId)}, position ${lifted + 1} of ${n}. Move it with the arrow keys, or tap where it goes.`);
  }, [liftedId]); // eslint-disable-line react-hooks/exhaustive-deps -- announce only when the lifted card changes

  return <div className="tl-sort">
    <p className="tl-end" aria-hidden="true">Earliest</p>
    <ol ref={sortable.list} className={`tl-list${drag ? " is-dragging" : ""}`} aria-label="Events, earliest first">
      {order.map((id, i) => {
        const label = labelOf(id);
        const tick = marks?.ticks[i] ?? false;
        const shift = shiftOf(drag, i);
        const classes = ["tl-item", lifted === i && "is-lifted", drag?.from === i && "is-held", tick && "is-right"].filter(Boolean).join(" ");
        return <li key={id} ref={(element) => { sortable.items.current[i] = element; }} className={classes}
          style={shift ? { transform: `translateY(${shift}px)` } : undefined}>
          <div className="tl-row">
            <button type="button" ref={(element) => { buttons.current[i] = element; }} className="tl-card" disabled={disabled}
              aria-pressed={lifted === i} aria-label={`${label}, position ${i + 1} of ${n}${tick ? ", right place" : ""}`}
              onClick={() => sortable.tap(i)} onKeyDown={(event) => sortable.keyDown(event, i)}
              onPointerDown={(event) => sortable.start(event, i, false)} onContextMenu={(event) => event.preventDefault()}>
              {tick && <span className="tl-tick"><Check size={15} aria-hidden="true" /><span className="tl-tick-word">Right place</span></span>}
              <span className="tl-label">{label}</span>
            </button>
            {lifted === i && !disabled && <span className="tl-nudge">
              <button type="button" aria-label={`Move ${label} up`} disabled={i === 0} onClick={() => sortable.nudge(-1)}><ChevronUp size={18} aria-hidden="true" /></button>
              <button type="button" aria-label={`Move ${label} down`} disabled={i === n - 1} onClick={() => sortable.nudge(1)}><ChevronDown size={18} aria-hidden="true" /></button>
            </span>}
            {!disabled && <span className="tl-grip" aria-hidden="true" onPointerDown={(event) => sortable.start(event, i, true)}
              onContextMenu={(event) => event.preventDefault()}><GripVertical size={20} /></span>}
          </div>
          {marks?.joins[i] && <span className="tl-join"><Link2 size={14} aria-hidden="true" /><span className="tl-join-word">these two belong together</span></span>}
        </li>;
      })}
    </ol>
    <p className="tl-end" aria-hidden="true">Latest</p>
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </div>;
}
