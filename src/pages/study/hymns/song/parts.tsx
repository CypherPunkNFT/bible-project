import { readerUrl } from "./parts.shared";
// The small shared pieces of a hymn's study page: the passage panel that slides in beside the page, the reader links,
// and the collapsed sources line (approved mock-up: design/hymn-directions/shared/page.js).
import { BibleName, Verse, VerseMissing } from "@/components/Verse";
import { useCatalog } from "@/lib/catalog";
import type { HymnSong, SongEcho, SongPassage } from "@/lib/hymns";
import { firstWords, useVerses, verseIdOf } from "@/lib/verses";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

/** A passage's verses in the reader's Bible. The files hold book, chapter and verse numbers only. */
export function PassageVerses({ p, numbered, render }: { p: Pick<SongPassage, "code" | "chapter" | "verses">; numbered?: boolean; render?: (text: string) => ReactNode }) {
  const catalog = useCatalog();
  const ids = useMemo(() => p.verses.map((v) => verseIdOf(catalog, p.code, p.chapter, v.n)), [catalog, p.code, p.chapter, p.verses]);
  return <Verse ids={ids} numbered={numbered} render={render} />;
}

/** The short quotation beside a line: the words marked in the Berean Standard Bible; in another Bible, the verse's opening. */
export function EchoWords({ echo }: { echo: SongEcho }) {
  const catalog = useCatalog();
  const ids = useMemo(() => echo.verses.map((v) => verseIdOf(catalog, echo.code, echo.chapter, v.n)), [catalog, echo.code, echo.chapter, echo.verses]);
  const state = useVerses({ ids });
  if (state.status === "loading") return null;
  if (state.status === "error") return <VerseMissing id={ids[0]} reason="could not be loaded" />;
  const text = state.value.verses.flatMap((v) => (v.text === null ? [] : [v.text])).join(" ");
  if (!text) return <VerseMissing id={ids[0]} />;
  const { bible } = state.value;
  if (bible.slug !== "bsb" || !echo.cut?.length) return <span lang={bible.lang} dir={bible.dir} translate="no">{firstWords(text, /^(zh|ja|ko)/.test(bible.lang) ? 18 : 44)}</span>;
  const tokens = text.split(" ");
  const cut = echo.cut.map(([first, count]) => tokens.slice(first, first + count).join(" ").replace(/^[“”‘’"' ]+|[“”‘’"' ,;:.!?—]+$/g, "")).join(" … ");
  return <span lang={bible.lang} dir={bible.dir} translate="no">{cut}{echo.cutMore ? " …" : ""}</span>;
}

export interface PanelContent { passage: SongPassage; line?: string; kicker?: string }
export type OpenPassage = (content: PanelContent) => void;

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
      <div className="hy-panel-verses">{p.verses.map((v) => <p key={v.n}><PassageVerses p={{ code: p.code, chapter: p.chapter, verses: [v] }} numbered /></p>)}</div>
      <p className="hy-panel-tr"><BibleName />.</p>
      <Link className="hy-panel-go" to={readerUrl(p)}>{`Read ${p.ref.split(":")[0]} in the reader`} <ArrowRight size={15} strokeWidth={1.5} aria-hidden /></Link>
    </div>}
  </aside>;
}

export function Sources({ song }: { song: HymnSong }) {
  return <details className="hy-sources"><summary>Sources · 3</summary><ul>
    <li><b>The hymn.</b> {`${song.source.title}, John Newton and William Cowper, London 1779, from the Christian Classics Ethereal Library `}
      (<a href={song.source.url} target="_blank" rel="noreferrer">{song.source.url.replace("https://", "")}</a>). {song.source.licence}.</li>
    <li><b>Where hymnals place it.</b> Hymnary.org's catalogue (<a href={song.source.hymnary} target="_blank" rel="noreferrer">hymnary.org</a>): the passages hymnal
      editors attach to it, and the number of hymnals that print it. No words were taken from Hymnary.</li>
    <li><b>The verses.</b> Shown in the <BibleName />, from this site's own Bible text. The echoes were found in the King
      James wording Newton read; each verse set beside a line is one the hymnal editors attach to the hymn, and placing it beside
      the line it echoes is ours.</li></ul></details>;
}
