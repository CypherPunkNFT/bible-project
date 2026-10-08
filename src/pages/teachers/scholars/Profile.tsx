// The shared scholar profile. Any section opens it with openProfile(id, originElement): it grows out of the clicked
// card or mark and shrinks back into it on close (without an origin it rises from the centre). Previous / next follow
// the catalogue's on-screen order (`shownIds`) at the moment it opened; Esc, the scrim or the close button close it,
// arrow keys step. While it is open the page does not scroll. Content: profile/Content.tsx. Approved mock-up:
// design/scholars-directions/scholars/profile.js.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useScholars } from "./context";
import { byBirth } from "./marks/facts";
import { reducedMotion } from "./marks/dom";
import { ProfileContent } from "./profile/Content";
import { grow, liftCard, lockPage, shrink } from "./profile/motion";
import "./Profile.css";

type Phase = "closed" | "open" | "closing";
interface View { list: string[]; index: number }

export function Profile() {
  const { data, profile, closeProfile, shownIds } = useScholars();
  const [phase, setPhase] = useState<Phase>("closed");
  const [view, setView] = useState<View | null>(null);
  const shell = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), body = useRef<HTMLDivElement>(null);
  const origin = useRef<Element | null>(null), stepped = useRef(0), cancelShrink = useRef<(() => void) | null>(null);
  const phaseNow = useRef(phase), shown = useRef(shownIds), viewNow = useRef(view);
  phaseNow.current = phase;
  shown.current = shownIds;
  viewNow.current = view;

  // Follow the page's request: open (or show someone else), or close.
  useLayoutEffect(() => {
    if (profile) {
      if (!data.scholars.some((s) => s.id === profile.id)) {
        console.error(`Scholars profile: no scholar with id "${profile.id}" (expected one of ${data.scholars.length} ids in the scholars data)`);
        closeProfile();
        return;
      }
      const list = shown.current.includes(profile.id) ? [...shown.current] : byBirth(data.scholars).map((s) => s.id);
      setView({ list, index: list.indexOf(profile.id) });
      if (phaseNow.current === "open") return;
      cancelShrink.current?.(); // opened again while closing: stop shrinking and grow from the new origin
      cancelShrink.current = null;
      liftCard(origin.current, false);
      origin.current = profile.origin;
      setPhase("open");
      return;
    }
    if (phaseNow.current !== "open") return;
    const done = () => {
      cancelShrink.current = null;
      shell.current?.classList.remove("prf-open", "prf-closing");
      setPhase("closed");
      liftCard(origin.current, false);
      // Focus goes back where it came from: a card's button, a chip, or the constellation mark the origin sits in.
      const focusable = origin.current?.querySelector(".cat-card-hit") ?? origin.current?.closest("button, a, [tabindex]");
      if (focusable instanceof HTMLElement || focusable instanceof SVGElement) focusable.focus({ preventScroll: true });
      origin.current = null;
    };
    if (reducedMotion() || !panel.current || !body.current) { done(); return; }
    setPhase("closing");
    cancelShrink.current = shrink(panel.current, body.current, origin.current, done);
  }, [profile, data, closeProfile]);

  // Grow out of the origin once the panel is shown.
  useLayoutEffect(() => {
    if (phase !== "open" || !panel.current || !body.current) return;
    shell.current?.querySelector<HTMLElement>(".prf-close")?.focus({ preventScroll: true });
    if (!reducedMotion()) grow(panel.current, body.current, origin.current);
  }, [phase]);

  useEffect(() => (phase === "closed" ? undefined : lockPage()), [phase]);

  const step = useCallback((delta: number) => {
    const v = viewNow.current;
    if (!v || v.list.length < 2) return;
    const index = (v.index + delta + v.list.length) % v.list.length;
    const card = origin.current?.classList.contains("cat-card");
    liftCard(origin.current, false);
    // A card origin moves to the new scholar's card; any other origin is dropped, so the panel does not shrink into it.
    origin.current = card ? document.querySelector(`.tp-scholars .cat-card[data-id="${CSS.escape(v.list[index])}"]`) : null;
    liftCard(origin.current, true);
    stepped.current = delta;
    setView({ ...v, index });
  }, []);

  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeProfile();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phase, closeProfile, step]);

  // A new scholar starts at the top; a step slides in from the side it came from.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    el.scrollTop = 0;
    const delta = stepped.current;
    stepped.current = 0;
    if (delta && !reducedMotion()) el.animate([{ opacity: 0, transform: `translateX(${delta * 14}px)` }, { opacity: 1, transform: "none" }], { duration: 300, easing: "cubic-bezier(.16, 1, .3, 1)" });
  }, [view]);

  const s = view ? data.scholars.find((x) => x.id === view.list[view.index]) : undefined;
  return <div ref={shell} className={`prf${phase !== "closed" ? " prf-open" : ""}${phase === "closing" ? " prf-closing" : ""}`}>
    <div className="prf-scrim" onClick={closeProfile} />
    <div ref={panel} className="prf-panel" role="dialog" aria-modal="true" aria-labelledby="sc-prf-name" aria-hidden={phase === "closed"}>
      <div className="prf-bar">
        <button type="button" className="prf-btn" aria-label="Previous scholar" onClick={() => step(-1)}><ArrowLeft size={16} aria-hidden="true" /></button>
        <button type="button" className="prf-btn" aria-label="Next scholar" onClick={() => step(1)}><ArrowRight size={16} aria-hidden="true" /></button>
        <span className="prf-count">{view ? `${view.index + 1} of ${view.list.length}` : ""}</span>
        <button type="button" className="prf-btn prf-close" aria-label="Close" onClick={closeProfile}><X size={16} aria-hidden="true" /></button>
      </div>
      <div ref={body} className="prf-body">{s && <ProfileContent data={data} s={s} />}</div>
    </div>
  </div>;
}
