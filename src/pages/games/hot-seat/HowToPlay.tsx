// Hot seat: the five-line how-to card (design §6.8), opened from the setup and from the menu.
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); onClose(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="hs-sheet-back" onClick={onClose}>
    <div className="hs-sheet" role="dialog" aria-modal="true" aria-labelledby="hs-how-title" onClick={(event) => event.stopPropagation()}>
      <div className="hs-sheet-head">
        <h2 id="hs-how-title">How to play</h2>
        <button ref={close} type="button" className="hs-icon" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
      </div>
      <ol className="hs-how">
        <li>Pick who is in the hot seat. Someone else holds the phone and reads each question out loud.</li>
        <li>The phone shows the answer too: tap Right, Wrong or Pass.</li>
        <li>Sixty seconds per turn; a question started before the buzzer can still be answered.</li>
        <li>Near enough counts. Lamp is lamp, and Jonah's "whale" is his great fish.</li>
        <li>Most points after the last round wins.</li>
      </ol>
    </div>
  </div>;
}
