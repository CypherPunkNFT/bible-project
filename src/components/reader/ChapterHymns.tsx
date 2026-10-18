import { Music } from "lucide-react";
import { Link } from "react-router-dom";
import { loadHymnsByChapter } from "@/lib/data";
import type { ChapterHymn, HymnsByChapter } from "@/lib/hymn-pages";
import { useAsync } from "@/lib/useAsync";

const SHOWN = 8;

function HymnLink({ hymn }: { hymn: ChapterHymn }) {
  return <li>
    <Link to={`/study/hymns/${hymn.id}`} className="group block rounded-lg px-2 py-1.5 hover:bg-surface-2">
      <span className="font-serif text-[1.02rem] leading-snug group-hover:text-accent">{hymn.t.replace(/[,;:]$/, "")}</span>
      <span className="block text-xs text-muted">{hymn.a} · {hymn.y} · {hymn.r}</span>
    </Link>
  </li>;
}

/** The hymns we hold that are written on this chapter (the verse printed above them), then those with a line that echoes
 *  a verse in it (data/hymns/by-book/, from scripts/build-hymn-pages.py); each a link to the hymn's page. */
export function ChapterHymns({ bookCode, bookNum, chapter }: { bookCode: string; bookNum: number; chapter: number }) {
  const inCanon = bookNum <= 66;
  const data = useAsync(() => (inCanon ? loadHymnsByChapter(bookCode).catch(() => ({}) as HymnsByChapter) : Promise.resolve<HymnsByChapter>({})), `chapter-hymns:${bookCode}`);
  if (!inCanon || data.status !== "ready" || !Number.isFinite(chapter)) return null;
  const here = data.value[String(chapter)];
  if (!here || !(here.on.length + here.echo.length)) return null;
  const on = here.on.slice(0, SHOWN), echo = here.echo.slice(0, Math.max(0, SHOWN - on.length));
  const more = here.on.length + here.echo.length - on.length - echo.length;
  return (
    <section aria-label="Sung on this chapter" className="mt-6 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Music className="h-3.5 w-3.5" aria-hidden /> Sung on this chapter · {here.on.length + here.echo.length}
      </h2>
      {on.length > 0 && <ul className="grid gap-0.5 sm:grid-cols-2">{on.map((h) => <HymnLink key={h.id} hymn={h} />)}</ul>}
      {echo.length > 0 && <>
        <p className="mb-1 mt-3 px-2 text-xs text-muted">{on.length ? "And hymns with a line that echoes a verse here" : "Hymns with a line that echoes a verse here"}</p>
        <ul className="grid gap-0.5 sm:grid-cols-2">{echo.map((h) => <HymnLink key={h.id} hymn={h} />)}</ul>
      </>}
      {more > 0 && <p className="mt-2 px-2 text-sm"><Link to="/study/hymns" className="text-muted hover:text-ink">+{more} more in the hymns collection</Link></p>}
    </section>
  );
}
