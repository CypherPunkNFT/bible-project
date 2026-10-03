import { BookOpen, CheckSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReadingChart, type ChartBook } from "@/components/ReadingChart";
import { useCatalog } from "@/lib/catalog";
import { useProgress } from "@/lib/progress";
import { SECTIONS, tone, toneOf } from "@/lib/sections";
import { cn, formatNumber } from "@/lib/utils";

/**
 * The home page's reading chart. Chapters follow the KJV (the numbering the progress is kept in); clicking
 * opens the chapter in the reader's version when that version numbers chapters the same way, else in the KJV.
 */
export function LibraryChart({ slug }: { slug: string }) {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const progress = useProgress();
  const [mode, setMode] = useState<"open" | "track">("open");
  const [apocrypha, setApocrypha] = useState(false);
  const kjv = catalog.translations.find((t) => t.slug === "kjv");
  const reader = catalog.translations.find((t) => t.slug === slug);
  const openIn = reader?.numbering === "english" ? reader : kjv;

  const books = useMemo<ChartBook[]>(
    () =>
      catalog.books
        .filter((b) => kjv?.books[b.code] && (apocrypha || b.section !== "apocrypha"))
        .map((b) => {
          const target = openIn?.books[b.code] ? openIn.slug : "kjv";
          return { code: b.code, name: b.name, section: b.section, chapters: kjv!.books[b.code], href: `/read/${target}/${b.code}/1` };
        }),
    [catalog.books, kjv, openIn, apocrypha],
  );
  const total = books.reduce((sum, b) => sum + b.chapters.length, 0);
  const done = books.reduce((sum, b) => sum + b.chapters.filter((c) => progress.isRead(b.code, c)).length, 0);

  const onChapter = (code: string, chapter: string) => {
    if (mode === "track") return progress.toggle(code, chapter);
    const target = openIn?.books[code]?.includes(chapter) ? openIn.slug : "kjv";
    navigate(`/read/${target}/${code}/${chapter}`);
  };

  return (
    <section aria-labelledby="chart-title" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="chart-title" className="font-serif text-2xl font-semibold sm:text-3xl">
            The reading chart
          </h2>
          <p className="mt-1 text-sm text-muted">Every chapter of the Bible. {mode === "open" ? "Click a number to read it." : "Click a number to mark it read; click again to clear."}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div role="radiogroup" aria-label="What a click does" className="inline-flex rounded-full bg-surface-2 p-0.5">
            {(
              [
                ["open", "Open chapters", BookOpen],
                ["track", "Mark as read", CheckSquare],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5", mode === value ? "bg-ink text-page" : "text-muted hover:text-ink")}
              >
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-muted">
            <input type="checkbox" checked={apocrypha} onChange={(e) => setApocrypha(e.target.checked)} className="h-4 w-4 accent-[var(--apocrypha)]" />
            Apocrypha
          </label>
        </div>
      </div>

      <ProgressBar books={books} isRead={progress.isRead} done={done} total={total} />
      {!progress.saving && (
        <p role="alert" className="mb-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
          This browser isn't letting the page save, so marks will be lost when you leave.
        </p>
      )}

      <div className="[--box:2rem] sm:[--box:1.45rem] xl:[--box:0.94rem]">
        <ReadingChart books={books} splitBefore="HOS" isRead={progress.isRead} onChapter={onChapter} mode={mode} />
      </div>
      <p className="mt-4 text-xs text-muted">
        Chapters as numbered in the King James Version. Your marks stay in this browser only; clearing the browser's site data clears them.
      </p>
    </section>
  );
}

function ProgressBar({ books, isRead, done, total }: { books: ChartBook[]; isRead: (code: string, chapter: string) => boolean; done: number; total: number }) {
  const sections = SECTIONS.map((s) => {
    const members = books.filter((b) => b.section === s.id);
    return {
      id: s.id,
      name: s.name,
      size: members.reduce((n, b) => n + b.chapters.length, 0),
      read: members.reduce((n, b) => n + b.chapters.filter((c) => isRead(b.code, c)).length, 0),
      color: tone(toneOf("", s.id)),
    };
  }).filter((s) => s.size > 0);
  return (
    <div className="mb-5">
      <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`${done} of ${total} chapters read`}>
        {sections.map((s) => (
          <div key={s.id} className="relative h-full" style={{ width: `${(s.size / total) * 100}%`, background: s.color.box }} title={`${s.name}: ${s.read} of ${s.size} read`}>
            <div className="h-full" style={{ width: `${(s.read / s.size) * 100}%`, background: s.color.tab }} />
          </div>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {done ? `${formatNumber(done)} of ${formatNumber(total)} chapters read (${((done / total) * 100).toFixed(1)}%)` : `${formatNumber(total)} chapters. Switch to "Mark as read" to track your reading.`}
      </p>
    </div>
  );
}
