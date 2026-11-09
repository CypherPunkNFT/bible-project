// How to play (design §10.6): opened by itself on the first visit, afterwards from the start screen. Escape closes it.
import { useEffect, useRef } from "react";
import { HELP_LINES } from "./text";

export function Help({ onClose }: { onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="vc-help-backdrop">
    <section className="vc-help" role="dialog" aria-modal="true" aria-labelledby="vc-help-title">
      <h2 id="vc-help-title">How to play</h2>
      <ul>{HELP_LINES.map((line) => <li key={line.label}>{line.label}</li>)}</ul>
      <p className="vc-note">On a phone, First letters stops the keyboard's word suggestions from giving the next word away.</p>
      <button ref={close} type="button" className="vc-primary" onClick={onClose}>Got it</button>
    </section>
  </div>;
}
