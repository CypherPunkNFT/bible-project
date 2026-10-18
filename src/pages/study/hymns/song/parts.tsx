// The small shared pieces of a hymn's study page: the passage panel that slides in beside the page, the reader links,
// and the collapsed sources line (approved mock-up: design/hymn-directions/shared/page.js).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, X } from "lucide-react";
import type { HymnSong, SongPassage, SongPlacedRef } from "@/lib/hymns";

/** A stanza numeral's size: numerals longer than three letters (VIII, XXVIII) shrink to fit the numeral column. */
export const numeralStyle = (label: string) => (label.length > 3 ? { fontSize: `${(4.4 / (0.47 * label.length)).toFixed(2)}rem`, top: ".2rem" } : undefined);

export const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII",
  "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVI", "XXVII", "XXVIII", "XXIX", "XXX"];

export interface PanelContent { passage: SongPassage; line?: string; kicker?: string }
export type OpenPassage = (content: PanelContent) => void;

/** A passage in the reader, its verses highlighted. */
export const readerUrl = (p: SongPassage) =>
  `/read/kjv/${p.code}/${p.chapter}?hl=${p.verses[0].n}${p.verses.length > 1 ? `-${p.verses[p.verses.length - 1].n}` : ""}`;
/** A passage hymnal editors tie the hymn to, in the reader: the chapter, its verses highlighted unless it is all of it. */
export const placedUrl = (r: SongPlacedRef) => `/read/kjv/${r.code}/${r.chapter}${r.whole ? "" : `?hl=${r.ref.split(":")[1].replace("–", "-")}`}`;

export function PassagePanel({ content, onClose }: { content: PanelContent | null; onClose: () => void }) {
  useEffect(() => {
    if (!content) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, onClose]);
  // Out of the tab order while it is away.
  const panel = useRef<HTMLElement>(null);
  useEffect(() => { if (panel.current) panel.current.inert = !content; }, [content]);
  // The last passage stays drawn while the panel slides away.
  const [shown, setShown] = useState(content);
  if (content && content !== shown) setShown(content);
  const p = shown?.passage;
  return <aside ref={panel} className={`hy-panel${content ? " open" : ""}`} aria-hidden={!content}>
    <button type="button" className="hy-panel-close" aria-label="Close" onClick={onClose}><X size={18} strokeWidth={1.5} aria-hidden /></button>
    {shown && p && <div className="hy-panel-body">
      <p className="hy-panel-kicker">{shown.kicker ?? "The passage"}</p>
      <h3>{p.ref}</h3>
      {shown.line && <blockquote className="hy-panel-line">{shown.line}</blockquote>}
      <div className="hy-panel-verses">{p.verses.map((v) => <p key={v.n}><sup>{v.n}</sup>{v.text}</p>)}</div>
      <p className="hy-panel-tr">Berean Standard Bible.</p>
      <Link className="hy-panel-go" to={readerUrl(p)}>Read {p.ref.split(":")[0]} in the reader <ArrowRight size={15} strokeWidth={1.5} aria-hidden /></Link>
    </div>}
  </aside>;
}

export function Sources({ song }: { song: HymnSong }) {
  return <details className="hy-sources"><summary>Sources · 3</summary><ul>
    <li><b>The hymn.</b> {song.source.title}, John Newton and William Cowper, London 1779, from the Christian Classics Ethereal Library
      (<a href={song.source.url} target="_blank" rel="noreferrer">{song.source.url.replace("https://", "")}</a>). {song.source.licence}.</li>
    <li><b>Where hymnals place it.</b> Hymnary.org's catalogue (<a href={song.source.hymnary} target="_blank" rel="noreferrer">hymnary.org</a>): the passages hymnal
      editors attach to it, and the number of hymnals that print it. No words were taken from Hymnary.</li>
    <li><b>The verses.</b> Shown in the Berean Standard Bible, from this site's own Bible text. The echoes were found in the King
      James wording Newton read; each verse set beside a line is one the hymnal editors attach to the hymn, and placing it beside
      the line it echoes is ours.</li></ul></details>;
}
