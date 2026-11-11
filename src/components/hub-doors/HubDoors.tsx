// A hub's category doors: one door per category in a row under the hero, like the study hub's subject doors
// (src/pages/study/hub/StudyBranch.tsx), so a reader sees every kind of thing the hub holds before scrolling. A door is a
// link that sets a search parameter (?category=<key> on the tools hub, ?shelf=<key> on the games hub); the hub shows
// that category's tiles under the row. Each door is its drawing and its title with the count beside it; no numbers and
// no arrows (owner, 2026-11-11). Choosing a door scrolls the page down so the row of doors sits just under the menu with
// the chosen category's tiles below it (owner: "when we click, there must be a shift down to the actual games, or
// tools", then "the auto scroll should show the categories"); opening the page with ?category= already set does not.
// Arrow keys, Home and End move between doors. Used by the tools and games hubs.
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./hub-doors.css";

export interface HubDoor { key: string; title: string; tone: string; count: number; art: ReactNode }

interface Props { doors: HubDoor[]; selected: string; param: string; label: string; controls: string }

export function HubDoors({ doors, selected, param, label, controls }: Props) {
  const [params, setParams] = useSearchParams();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const row = useRef<HTMLElement | null>(null);
  const scrollOnChange = useRef(false);
  const scrollToDoors = () => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.current?.scrollIntoView?.({ behavior: still ? "auto" : "smooth", block: "start" });
  };
  useEffect(() => {
    if (!scrollOnChange.current) return;
    scrollOnChange.current = false;
    scrollToDoors();
  });
  return <nav ref={row} className="hub-doors" aria-label={label} style={{ "--doors": doors.length } as CSSProperties}>
    {doors.map((door, i) => <Link key={door.key} ref={(el) => { refs.current[i] = el; }} to={`?${param}=${door.key}`}
      className={`hub-door${door.key === selected ? " selected" : ""}`} id={`door-${door.key}`}
      style={{ "--tone": `var(--${door.tone})` } as CSSProperties}
      aria-current={door.key === selected ? "true" : undefined} aria-controls={controls}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (door.key === selected) { scrollToDoors(); return; }
        scrollOnChange.current = true;
        const next = new URLSearchParams(params);
        next.set(param, door.key);
        setParams(next);
      }}
      onKeyDown={(event) => {
        const last = doors.length - 1;
        const next = event.key === "ArrowRight" ? (i + 1) % doors.length : event.key === "ArrowLeft" ? (i + last) % doors.length
          : event.key === "Home" ? 0 : event.key === "End" ? last : null;
        if (next !== null) { event.preventDefault(); refs.current[next]?.focus(); }
      }}>
      {door.art}
      <strong>{door.title}<span className="hub-door-count">{door.count}</span></strong>
    </Link>)}
  </nav>;
}
