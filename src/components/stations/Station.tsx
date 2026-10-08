// The parts the three-doorway stations share: a doorway (a link, or a quiet "In preparation" when its section has no
// data yet) and the row of small stats beside the hero.
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { StationArt, type StationArtKind } from "./StationArt";
import "./stations.css";

export interface DoorProps { index: number; art: StationArtKind; title: string; text: string; to?: string; note: string; action: string; color: string }

export function StationDoor({ index, art, title, text, to, note, action, color }: DoorProps) {
  const id = `door-${art}`;
  const body = <>
    <div className="st-door-head"><span>{String(index).padStart(2, "0")}</span>{to && <ArrowUpRight size={18} aria-hidden="true" />}</div>
    <div className="st-door-art"><StationArt kind={art} /></div>
    <h2 id={id}>{title}</h2>
    <p>{text}</p>
    <div className="st-door-foot"><span>{note}</span><strong>{action}{to && <ArrowUpRight size={14} aria-hidden="true" />}</strong></div>
  </>;
  const style = { "--door": `var(--${color})` } as CSSProperties;
  return to
    ? <Link to={to} className="st-door" style={style} aria-labelledby={id}>{body}</Link>
    : <div className="st-door" style={style} aria-disabled="true" aria-labelledby={id} role="group">{body}</div>;
}

export function StationStats({ items }: { items: [string, string | number][] }) {
  return <dl className="st-stats">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{typeof value === "number" ? value.toLocaleString("en-US") : value}</dd></div>)}</dl>;
}
