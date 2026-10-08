import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { PassageText } from "@/components/study/StudyParts";
import { studyRefLink } from "@/lib/study";
import type { Span } from "@/data/letters/types";
import { useSpanLabel } from "./letter-hooks";

/** Two passages linked by a ribbon, side by side in a pop-up over the page (King James text), each with a way to read
 *  it in full in the reader. Closes on ×, Escape or a click outside. */
export function PassagePair({ left, right, note, onClose }: { left: Span; right: Span; note?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const label = useSpanLabel();
  const catalog = useCatalog();
  useEffect(() => { dialog.current?.showModal(); }, []);
  const side = (span: Span) => <section>
    <h4 className="lg-pair-ref">{label(span)}</h4>
    <PassageText span={span} max={60} />
    <Link className="lg-pair-read" to={studyRefLink(catalog, span)}>Read it in the Bible →</Link>
  </section>;
  return <dialog ref={dialog} className="lg-dialog lg-pair-dialog" onClose={onClose} onClick={(e) => { if (e.target === dialog.current) dialog.current?.close(); }} aria-labelledby="lg-pair-title">
    <div className="lg-dialog-body">
      <header><p className="lg-kicker">Side by side</p><h3 id="lg-pair-title" className="lg-title">{label(left)} and {label(right)}</h3>
        <button type="button" className="lg-dialog-close" onClick={() => dialog.current?.close()} aria-label="Close">×</button></header>
      <div className="lg-pair">{side(left)}{side(right)}</div>
      {note && <p className="lg-muted lg-pair-note">{note}</p>}
    </div>
  </dialog>;
}
