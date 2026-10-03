import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookPicker } from "@/components/reader/BookPicker";
import { ChapterPlaces } from "@/components/reader/ChapterPlaces";
import { ChapterText } from "@/components/reader/ChapterText";
import { ParallelText, type Column } from "@/components/reader/ParallelText";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { useReaderSettings } from "@/components/reader/settings";
import { VersePanel } from "@/components/reader/VersePanel";
import { useCatalog } from "@/lib/catalog";
import { loadBook } from "@/lib/data";
import { rememberRead, lastReadPath } from "@/lib/last-read";
import { bookByCode } from "@/lib/refs";
import { SECTION_BY_ID, sectionColor } from "@/lib/sections";
import type { BookText, Catalog, Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { cn, isTyping } from "@/lib/utils";

/** Previous/next chapter across books, in canonical order, within the books this version has. */
function neighbours(catalog: Catalog, translation: Translation, code: string, chapter: string) {
  const order = catalog.books.filter((b) => translation.books[b.code]).flatMap((b) => translation.books[b.code].map((c) => [b.code, c] as const));
  const index = order.findIndex(([b, c]) => b === code && c === chapter);
  return { prev: index > 0 ? order[index - 1] : null, next: index >= 0 && index < order.length - 1 ? order[index + 1] : null };
}

export default function ReaderPage() {
  const params = useParams();
  if (!params.slug || !params.book || !params.chapter) return <Navigate to={lastReadPath() ?? "/read/kjv/GEN/1"} replace />;
  return <Reader slug={params.slug} code={params.book} chapter={params.chapter} />;
}

function Reader({ slug, code, chapter }: { slug: string; code: string; chapter: string }) {
  const catalog = useCatalog();
  const translation = catalog.translations.find((t) => t.slug === slug);
  const book = bookByCode(catalog, code);
  if (!translation || !book) return <Missing title="That version or book does not exist" />;
  if (!translation.books[code]) return <NotInVersion translation={translation} code={code} />;
  if (!translation.books[code].includes(chapter)) return <Navigate to={`/read/${slug}/${code}/${translation.books[code][0]}`} replace />;
  return <ReaderBody translation={translation} code={code} chapter={chapter} />;
}

function ReaderBody({ translation, code, chapter }: { translation: Translation; code: string; chapter: string }) {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const [settings, setSettings] = useReaderSettings();
  const [picking, setPicking] = useState(false);
  const book = bookByCode(catalog, code)!;
  const selected = search.get("v");
  const parallel = useMemo(
    () =>
      (search.get("with") ?? "")
        .split(",")
        .map((s) => catalog.translations.find((t) => t.slug === s))
        .filter((t): t is Translation => !!t && t.slug !== translation.slug)
        .slice(0, 2),
    [search, catalog, translation.slug],
  );
  const slugs = [translation, ...parallel].map((t) => t.slug);
  const texts = useAsync(
    () => Promise.all([translation, ...parallel].map((t) => (t.books[code] ? loadBook(t.slug, code) : Promise.resolve(null)))),
    `${slugs.join(",")}:${code}`,
  );
  const { prev, next } = neighbours(catalog, translation, code, chapter);
  const query = parallel.length ? `?with=${parallel.map((p) => p.slug).join(",")}` : "";
  const goTo = useCallback((target: readonly [string, string] | null) => target && navigate(`/read/${translation.slug}/${target[0]}/${target[1]}${query}`), [navigate, translation.slug, query]);

  useEffect(() => rememberRead(`/read/${translation.slug}/${code}/${chapter}`), [translation.slug, code, chapter]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey || picking) return;
      if (event.key === "ArrowLeft") goTo(prev);
      if (event.key === "ArrowRight") goTo(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, prev, next, picking]);

  useEffect(() => {
    if (texts.status !== "ready" || !selected) return;
    // After the layout's own scroll-to-top for a new page has run.
    const timer = window.setTimeout(() => document.getElementById(`v${selected}`)?.scrollIntoView({ block: "center" }), 60);
    return () => window.clearTimeout(timer);
    // Scroll only when a chapter finishes loading, not on every selection click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts.status, code, chapter]);

  const select = (label: string | null) => {
    const nextSearch = new URLSearchParams(search);
    if (label && label !== selected) nextSearch.set("v", label);
    else nextSearch.delete("v");
    setSearch(nextSearch, { replace: true });
  };
  const closePanel = useCallback(() => {
    const nextSearch = new URLSearchParams(search);
    nextSearch.delete("v");
    setSearch(nextSearch, { replace: true });
    if (selected) document.getElementById(`v${selected}`)?.focus();
  }, [search, setSearch, selected]);

  const chapters = texts.status === "ready" ? texts.value.map((b: BookText | null) => b?.chapters.find((c) => c.c === chapter) ?? null) : [];
  const columns: Column[] = [translation, ...parallel].map((t, i) => ({ translation: t, chapter: chapters[i] ?? null }));
  const options = { redLetters: settings.redLetters, footnotes: settings.footnotes, versePerLine: settings.versePerLine };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <ReaderToolbar
        translation={translation}
        book={book}
        chapter={chapter}
        parallel={parallel}
        settings={settings}
        onTranslation={(slug) => {
          const rest = parallel.filter((p) => p.slug !== slug).map((p) => p.slug);
          navigate(`/read/${slug}/${code}/${chapter}${rest.length ? `?with=${rest.join(",")}` : ""}`);
        }}
        onChapter={(label) => navigate(`/read/${translation.slug}/${code}/${label}${query}`)}
        onOpenBooks={() => setPicking(true)}
        onPrev={prev ? () => goTo(prev) : null}
        onNext={next ? () => goTo(next) : null}
        onParallel={(list) => navigate(`/read/${translation.slug}/${code}/${chapter}${list.length ? `?with=${list.join(",")}` : ""}`)}
        onSettings={setSettings}
      />
      <div className={cn("grid gap-8 py-8", selected && "lg:grid-cols-[minmax(0,1fr)_23rem]")}>
        <article className={cn("mx-auto w-full", parallel.length ? "max-w-none" : "max-w-[44rem]")} style={{ fontSize: `${settings.scale}rem` }}>
          <header className="mb-6 font-sans" style={{ fontSize: "1rem" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: sectionColor(book.section) }}>
              {SECTION_BY_ID[book.section].name} · {translation.name}
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {book.name} <span className="text-muted">{chapter}</span>
            </h1>
          </header>
          {texts.status === "loading" && <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-surface-2" />)}</div>}
          {texts.status === "error" && <p className="text-muted">This chapter could not be loaded. Try another version.</p>}
          {texts.status === "ready" &&
            (parallel.length ? (
              <ParallelText columns={columns} options={options} selected={selected} onSelect={select} />
            ) : columns[0].chapter ? (
              <ChapterText chapter={columns[0].chapter} options={options} selected={selected} onSelect={select} lang={translation.lang} dir={translation.dir} />
            ) : (
              <p className="text-muted">This chapter is not in this version.</p>
            ))}
          <nav aria-label="Chapters" className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-6 font-sans" style={{ fontSize: "1rem" }}>
            {prev ? (
              <button type="button" onClick={() => goTo(prev)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-2">
                <ArrowLeft className="h-4 w-4" /> {bookByCode(catalog, prev[0])?.name} {prev[1]}
              </button>
            ) : <span />}
            {next && (
              <button type="button" onClick={() => goTo(next)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-2">
                {bookByCode(catalog, next[0])?.name} {next[1]} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </nav>
          <div style={{ fontSize: "1rem" }}>
            <ChapterPlaces bookNum={book.num} chapter={Number(chapter)} />
          </div>
        </article>
        {selected && <VersePanel translation={translation} bookCode={code} chapter={chapter} label={selected} onClose={closePanel} />}
      </div>
      {picking && (
        <BookPicker
          translation={translation}
          current={code}
          onClose={() => setPicking(false)}
          onPick={(pick) => {
            setPicking(false);
            navigate(`/read/${translation.slug}/${pick}/${translation.books[pick][0]}${query}`);
          }}
        />
      )}
    </div>
  );
}

function NotInVersion({ translation, code }: { translation: Translation; code: string }) {
  const catalog = useCatalog();
  const book = bookByCode(catalog, code);
  const having = catalog.translations.filter((t) => t.books[code]);
  const twin = catalog.equivalent[code];
  return (
    <Missing title={`${book?.name ?? code} is not in the ${translation.name}`}>
      {twin && translation.books[twin] && (
        <p className="mt-4">
          This version has it as{" "}
          <Link className="font-semibold underline" to={`/read/${translation.slug}/${twin}/${translation.books[twin][0]}`}>
            {bookByCode(catalog, twin)?.name}
          </Link>
          .
        </p>
      )}
      <p className="mt-4 text-muted">Read it in:</p>
      <ul className="mt-2 flex flex-wrap justify-center gap-2">
        {having.map((t) => (
          <li key={t.slug}>
            <Link className="inline-block rounded-full border border-line px-3 py-1 text-sm hover:bg-surface-2" to={`/read/${t.slug}/${code}/${t.books[code][0]}`}>
              {t.abbr}
            </Link>
          </li>
        ))}
      </ul>
    </Missing>
  );
}

function Missing({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      {children ?? (
        <p className="mt-4">
          <Link className="underline" to="/">
            Back to the library
          </Link>
        </p>
      )}
    </div>
  );
}
