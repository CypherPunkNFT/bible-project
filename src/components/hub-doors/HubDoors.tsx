// A hub's category doors: one door per category in a row under the hero, like the study hub's subject doors
// (src/pages/study/hub/StudyBranch.tsx), so a reader sees every kind of thing the hub holds before scrolling. A door is a
// link that sets a search parameter (?category=<key> on the tools hub, ?shelf=<key> on the games hub); the hub then shows
// that category's tiles alone under the row. With no door chosen (how the page opens) the hub lists every category, and
// clicking the chosen door again unchooses it, so the row works as a filter you can switch off; nothing scrolls (owner,
// 2026-11-11: "it should be unclicked to begin with … we don't need the clicking to scroll down anymore … clicking and
// unclicking instead"). Each door is its drawing and its title with the count beside it; no numbers and no arrows.
// Arrow keys, Home and End move between doors. Used by the tools and games hubs; the mock-up pages that record the
// versions the owner chose from pass toggle={false}, so there a click on the chosen door changes nothing.
import type { CSSProperties, ReactNode } from "react";
import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./hub-doors.css";

export interface HubDoor { key: string; title: string; tone: string; count: number; art: ReactNode }

interface Props { doors: HubDoor[]; selected: string | null; param: string; label: string; controls: string; toggle?: boolean }

export function HubDoors({ doors, selected, param, label, controls, toggle = true }: Props) {
  const [params, setParams] = useSearchParams();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  /** The page's search with this door chosen, or (the chosen door, clicked again) with no door chosen. */
  const searchFor = (key: string) => {
    const next = new URLSearchParams(params);
    if (key === selected) next.delete(param); else next.set(param, key);
    const search = next.toString();
    return search ? `?${search}` : "?";
  };
  return <nav className="hub-doors" aria-label={label} style={{ "--doors": doors.length } as CSSProperties}>
    {doors.map((door, i) => <Link key={door.key} ref={(el) => { refs.current[i] = el; }} to={searchFor(door.key)}
      className={`hub-door${door.key === selected ? " selected" : ""}`} id={`door-${door.key}`}
      style={{ "--tone": `var(--${door.tone})` } as CSSProperties}
      aria-current={door.key === selected ? "true" : undefined} aria-controls={controls}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        if (door.key === selected && !toggle) return;
        setParams(new URLSearchParams(searchFor(door.key)));
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
