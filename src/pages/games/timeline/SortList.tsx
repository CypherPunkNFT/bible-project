// Timeline sort's board (design §9, §7.1; redesigned from docs/visual-audits/timeline.md): a rail down the left with a
// dot at every slot, "Creation" at the top and "The early church" at the bottom, and the events hung off it as playing
// cards of one height. Drag by the grip (or long-press / mouse-drag the card), tap a card then where it goes, or pick it
// up with Enter or Space and move it with the arrow keys; while a card is dragged a dashed outline marks the slot it
// will land in. After a Daily Check a card in its right place turns over to show its date (one after another, top to
// bottom), a wrong one shakes, and two neighbours that belong together get a bridge with the word on it. The card stays
// one button through the turn (the kit's FlipCard is two faces around a div, and a card here must stay tappable and
// focusable as one thing), so the turn is written here with the kit's rule: the state changes at once, the motion decorates.
import { Check, ChevronDown, ChevronUp, GripVertical, Link2, Lock } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { MotifIcon } from "./MotifIcon";
import type { CardFace } from "./text";
import { shiftOf, useSortable } from "./useSortable";

export interface Marks { ticks: boolean[]; joins: boolean[] }

interface Props {
  order: readonly string[];
  cardOf: (id: string) => CardFace;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  marks?: Marks | null;
  /** Counts up with every Check, so the wrong cards shake again on each try. */
  tryKey?: number;
}

const WHEN_WORD = { about: "About", by: "By", from: "From", early: "Early Genesis" } as const;

export function SortList({ order, cardOf, onMove, disabled = false, marks, tryKey = 0 }: Props) {
  const [announcement, setAnnouncement] = useState("");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const focusAt = useRef<number | null>(null);
  const n = order.length;

  const move = useCallback((from: number, to: number) => {
    const id = order[from];
    onMove(from, to);
    focusAt.current = to;
    setAnnouncement(`${cardOf(id).label}, now position ${to + 1} of ${n}`);
  }, [cardOf, n, onMove, order]);

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
    if (liftedId !== null && lifted !== null) setAnnouncement(`Selected ${cardOf(liftedId).label}, position ${lifted + 1} of ${n}. Move it with the arrow keys, or tap where it goes.`);
  }, [liftedId]); // eslint-disable-line react-hooks/exhaustive-deps -- announce only when the lifted card changes

  // The dashed outline where the dragged card will land: the slot of the card now at the target (transforms do not
  // move offsetTop, so the slot's place is the same whichever way the others have slid).
  const slot = drag ? sortable.items.current[drag.target] : null;
  const held = drag ? sortable.items.current[drag.from] : null;
  const ghost = slot && held ? { top: slot.offsetTop, height: held.offsetHeight } : null;

  return <div className={`tl-sort${marks ? " is-marked" : ""}`} data-try={tryKey}>
    <p className="tl-end tl-end--top" aria-hidden="true"><span>Creation</span></p>
    <ol ref={sortable.list} className={`tl-list${drag ? " is-dragging" : ""}`} aria-label="Events, earliest first">
      {ghost && <li className="tl-ghost" aria-hidden="true" style={{ top: ghost.top, height: ghost.height }} />}
      {order.map((id, i) => {
        const card = cardOf(id);
        const tick = marks?.ticks[i] ?? false;
        const wrong = marks ? !tick : false;
        const shift = shiftOf(drag, i);
        const classes = ["tl-item", lifted === i && "is-lifted", drag?.from === i && "is-held", tick && "is-right", wrong && "is-wrong"].filter(Boolean).join(" ");
        const style = { ...(shift ? { transform: `translateY(${shift}px)` } : {}), "--kit-i": i } as CSSProperties;
        return <li key={id} ref={(element) => { sortable.items.current[i] = element; }} className={classes} style={style}>
          <div className="tl-row">
            <button type="button" ref={(element) => { buttons.current[i] = element; }} className="tl-card" disabled={disabled}
              aria-pressed={lifted === i} aria-label={`${card.label}, position ${i + 1} of ${n}${tick ? ", right place" : ""}`}
              onClick={() => sortable.tap(i)} onKeyDown={(event) => sortable.keyDown(event, i)}
              onPointerDown={(event) => sortable.start(event, i, false)} onContextMenu={(event) => event.preventDefault()}>
              <span className="tl-faces" aria-hidden="true">
                <span className="tl-face tl-face--front">
                  <MotifIcon motif={card.motif} className="tl-motif" />
                  <span className="tl-label">{card.label}</span>
                </span>
                <span className="tl-face tl-face--back">
                  {tick && <>
                    <span className="tl-placed"><Lock size={12} aria-hidden="true" /><span>Right place</span></span>
                    <span className="tl-label">{card.label}</span>
                    <span className="tl-when"><span>{WHEN_WORD[card.when.kind]}</span>{card.when.years && <span className="tl-years">{card.when.years}</span>}</span>
                  </>}
                </span>
              </span>
              {tick && <Check size={14} aria-hidden="true" className="tl-tick" />}
            </button>
            {lifted === i && !disabled && <span className="tl-nudge">
              <button type="button" aria-label={`Move ${card.label} up`} disabled={i === 0} onClick={() => sortable.nudge(-1)}><ChevronUp size={18} aria-hidden="true" /></button>
              <button type="button" aria-label={`Move ${card.label} down`} disabled={i === n - 1} onClick={() => sortable.nudge(1)}><ChevronDown size={18} aria-hidden="true" /></button>
            </span>}
            {!disabled && <span className="tl-grip" aria-hidden="true" onPointerDown={(event) => sortable.start(event, i, true)}
              onContextMenu={(event) => event.preventDefault()}><GripVertical size={20} /></span>}
          </div>
          {marks?.joins[i] && <span className="tl-join"><Link2 size={13} aria-hidden="true" /><span className="tl-join-word">together</span></span>}
        </li>;
      })}
    </ol>
    <p className="tl-end tl-end--bottom" aria-hidden="true"><span>The early church</span></p>
    <p className="sr-only" aria-live="polite">{announcement}</p>
  </div>;
}
