// A hub's category doors: one numbered door per category in a row under the hero, like the study hub's subject doors
// (src/pages/study/hub/StudyBranch.tsx), so a reader sees every kind of thing the hub holds before scrolling. A door is a
// link that sets a search parameter (?category=<key> on the tools hub, ?shelf=<key> on the games hub); the hub shows
// that category's tiles under the row. Arrow keys, Home and End move between doors. Used by the tools and games hubs.
import { useRef, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./hub-doors.css";

export interface HubDoor { key: string; title: string; tone: string; count: number; art: ReactNode }

interface Props { doors: HubDoor[]; selected: string; param: string; label: string; controls: string }

export function HubDoors({ doors, selected, param, label, controls }: Props) {
  const [params, setParams] = useSearchParams();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  return <nav className="hub-doors" aria-label={label} style={{ "--doors": doors.length } as CSSProperties}>
    {doors.map((door, i) => <Link key={door.key} ref={(el) => { refs.current[i] = el; }} to={`?${param}=${door.key}`}
      className={`hub-door${door.key === selected ? " selected" : ""}`} id={`door-${door.key}`}
      style={{ "--tone": `var(--${door.tone})` } as CSSProperties}
      aria-current={door.key === selected ? "true" : undefined} aria-controls={controls}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
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
      <span className="hub-door-num" aria-hidden="true">0{i + 1}</span>
      {door.art}
      <strong>{door.title}</strong>
      <span className="hub-door-count">{door.count}</span>
      <span className="hub-door-arrow" aria-hidden="true">↓</span>
    </Link>)}
  </nav>;
}
