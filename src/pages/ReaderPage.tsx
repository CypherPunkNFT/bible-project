import { ArrowLeft, ArrowRight, CheckSquare, ChevronLeft, ChevronRight, Link2, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CreditLine } from "@/components/CreditLine";
import { BookPicker } from "@/components/reader/BookPicker";
import { ChapterPlaces } from "@/components/reader/ChapterPlaces";
import { ChapterText } from "@/components/reader/ChapterText";
import { ParallelText, type Column } from "@/components/reader/ParallelText";
import { ReaderToolbar, type ChapterLink } from "@/components/reader/ReaderToolbar";
import { useReaderSettings } from "@/components/reader/settings";
import { VersePanel } from "@/components/reader/VersePanel";
import { ChapterCrossRefs } from "@/components/reader/ChapterCrossRefs";
import { useChapterCrossRefs } from "@/components/reader/useChapterCrossRefs";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useCatalog } from "@/lib/catalog";
import { loadChapter } from "@/lib/data";
import { rememberRead, lastReadPath } from "@/lib/last-read";
import { useProgress } from "@/lib/progress";
import { bookByCode, parseHighlight } from "@/lib/refs";
import { SECTION_BY_ID, sectionColor } from "@/lib/sections";
import type { Catalog, Translation } from "@/lib/types";
import { useAsync } from "@/lib/useAsync";
import { cn, formatNumber, isTyping } from "@/lib/utils";

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
  const highlight = parseHighlight(search.get("hl"));
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
  // Only the chapter shown, per column. A column whose version lacks this chapter (or whose file fails) is empty on
  // its own; it never blanks the other columns.
  const texts = useAsync(
    () =>
      Promise.all(
        [translation, ...parallel].map((t) =>
          t.books[code]?.includes(chapter) ? loadChapter(t.slug, code, t.books[code], chapter).catch(() => null) : Promise.resolve(null),
        ),
      ),
    `${slugs.join(",")}:${code}:${chapter}`,
  );
  const { prev, next } = neighbours(catalog, translation, code, chapter);
  const query = parallel.length ? `?with=${parallel.map((p) => p.slug).join(",")}` : "";
  const goTo = useCallback((target: readonly [string, string] | null) => target && navigate(`/read/${translation.slug}/${target[0]}/${target[1]}${query}`), [navigate, translation.slug, query]);
  const linkTo = (target: readonly [string, string] | null): ChapterLink | null =>
    target && { label: `${bookByCode(catalog, target[0])?.name ?? target[0]} ${target[1]}`, go: () => goTo(target) };
  const prevLink = linkTo(prev);
  const nextLink = linkTo(next);
  // The cross-reference panel: open with every chapter on wide screens (unless the reader closed it, or
  // versions are side by side), or whenever a verse is chosen or the bubble is clicked.
  const wide = useMediaQuery("(min-width: 1024px)");
  const [bubbleOpened, setBubbleOpened] = useState(false);
  useEffect(() => setBubbleOpened(false), [parallel.length]);
  const showPanel = !!selected || bubbleOpened || (settings.crossRefs && wide && !parallel.length);
  const chapterRefs = useChapterCrossRefs(translation, code, chapter);
  const showReferenceCard = !showPanel && chapterRefs.usable && chapterRefs.total > 0;

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
    const target = selected ?? (highlight ? String(highlight[0]) : null);
    if (texts.status !== "ready" || !target) return;
    // After the layout's own scroll-to-top for a new page has run. Only scroll when the verse is off screen,
    // so clicking a visible verse never jumps the page, but a link to a verse in this same chapter still lands.
    const timer = window.setTimeout(() => {
      const element = document.getElementById(`v${target}`);
      const box = element?.getBoundingClientRect();
      if (element && box && (box.top < 140 || box.bottom > window.innerHeight)) element.scrollIntoView({ block: "center" });
    }, 60);
    return () => window.clearTimeout(timer);
    // A highlight only matters on arrival; selection changes are covered by `selected`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texts.status, code, chapter, selected]);

  const select = (label: string | null) => {
    const nextSearch = new URLSearchParams(search);
    if (label && label !== selected) nextSearch.set("v", label);
    else nextSearch.delete("v");
    setSearch(nextSearch, { replace: true });
  };
  const closePicker = useCallback(() => setPicking(false), []);
  const closePanel = useCallback(() => {
    const nextSearch = new URLSearchParams(search);
    nextSearch.delete("v");
    setSearch(nextSearch, { replace: true });
    if (selected) document.getElementById(`v${selected}`)?.focus();
  }, [search, setSearch, selected]);

  const chapters = texts.status === "ready" ? texts.value : [];
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
        onOpenBooks={() => setPicking(true)}
        prev={prevLink}
        next={nextLink}
        onParallel={(list) => navigate(`/read/${translation.slug}/${code}/${chapter}${list.length ? `?with=${list.join(",")}` : ""}`)}
        onSettings={setSettings}
      />
      <div className={cn("relative grid grid-cols-[minmax(0,1fr)] gap-8 py-8", showPanel && "lg:grid-cols-[minmax(0,1fr)_23rem]")}>
        <article className={cn("relative mx-auto w-full", parallel.length ? "max-w-none" : "max-w-[44rem]")} style={{ fontSize: `${settings.scale}rem` }}>
          {!parallel.length && <SideArrows prev={prevLink} next={nextLink} nextInside={showPanel} />}
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3 font-sans" style={{ fontSize: "1rem" }}>
            <div>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: sectionColor(book.section) }}>
              <span>
                {SECTION_BY_ID[book.section].name} · {translation.name}
              </span>
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              {book.name} <span className="text-muted">{chapter}</span>
            </h1>
            </div>
            {showReferenceCard && (
              <button
                type="button"
                onClick={() => {
                  setBubbleOpened(true);
                  if (!settings.crossRefs) setSettings({ ...settings, crossRefs: true });
                }}
                aria-label={`Show this chapter's ${chapterRefs.total} cross-references`}
                className="flex shrink-0 items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 text-left transition hover:border-accent/60 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent/10 text-accent">
                  <Link2 className="h-4 w-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-xs font-semibold">Cross-references</span>
                  <span className="block text-sm font-semibold text-accent">{formatNumber(chapterRefs.total)}</span>
                </span>
              </button>
            )}
          </header>
          {texts.status === "loading" && <div className="space-y-3">{[...Array(8)].map((_, i) => <div key={i} className="h-5 animate-pulse rounded bg-surface-2" />)}</div>}
          {texts.status === "error" && <p className="text-muted">This chapter could not be loaded. Try another version.</p>}
          {texts.status === "ready" &&
            (parallel.length ? (
              <ParallelText columns={columns} options={options} selected={selected} highlight={highlight} onSelect={select} />
            ) : columns[0].chapter ? (
              <ChapterText chapter={columns[0].chapter} options={options} selected={selected} highlight={highlight} onSelect={select} lang={translation.lang} dir={translation.dir} />
            ) : (
              <p className="text-muted">This chapter is not in this version.</p>
            ))}
          {columns
            .filter((column) => column.translation.credit)
            .map((column) => (
              <p key={column.translation.slug} className="mt-8 font-sans text-muted" style={{ fontSize: "0.75rem" }} data-testid="text-credit">
                <CreditLine credit={column.translation.credit!} />
              </p>
            ))}
          <nav aria-label="Chapters" className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 font-sans" style={{ fontSize: "1rem" }}>
            {prev ? (
              <button type="button" onClick={() => goTo(prev)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-2">
                <ArrowLeft className="h-4 w-4" /> {bookByCode(catalog, prev[0])?.name} {prev[1]}
              </button>
            ) : <span />}
            {translation.numbering === "english" && <MarkRead code={code} chapter={chapter} />}
            {next && (
              <button type="button" onClick={() => goTo(next)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-surface-2">
                {bookByCode(catalog, next[0])?.name} {next[1]} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </nav>
          <div style={{ fontSize: "1rem" }}>
            {translation.numbering === "english" && <ChapterPlaces bookCode={code} bookNum={book.num} chapter={Number(chapter)} />}
          </div>
        </article>
        {selected ? (
          <VersePanel translation={translation} bookCode={code} chapter={chapter} label={selected} onClose={closePanel} />
        ) : (
          showPanel && (
            <ChapterCrossRefs
              translation={translation}
              bookCode={code}
              chapter={chapter}
              onPick={(verse) => select(verse)}
              onClose={() => {
                setBubbleOpened(false);
                setSettings({ ...settings, crossRefs: false });
              }}
            />
          )
        )}
        {showPanel && !parallel.length && <OuterNextArrow link={nextLink} />}
      </div>
      {picking && (
        <BookPicker
          translation={translation}
          current={{ code, chapter }}
          onClose={closePicker}
          onPick={(pick, pickChapter) => {
            setPicking(false);
            navigate(`/read/${translation.slug}/${pick}/${pickChapter}${query}`);
          }}
        />
      )}
    </div>
  );
}

/** Tick this chapter on the reading chart (KJV chapter numbering only, so it can never mark the wrong one). */
function MarkRead({ code, chapter }: { code: string; chapter: string }) {
  const progress = useProgress();
  const read = progress.isRead(code, chapter);
  return (
    <button
      type="button"
      aria-pressed={read}
      onClick={() => progress.toggle(code, chapter)}
      className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition", read ? "border-transparent bg-ink text-page" : "border-line hover:bg-surface-2")}
    >
      {read ? <CheckSquare className="h-4 w-4" aria-hidden /> : <Square className="h-4 w-4" aria-hidden />}
      {read ? "Read" : "Mark read"}
    </button>
  );
}

/** Big round arrows either side of the text, riding at mid-screen as you scroll (wide screens only). */
function SideArrows({ prev, next, nextInside = false }: { prev: ChapterLink | null; next: ChapterLink | null; nextInside?: boolean }) {
  // With the cross-reference panel open, the next arrow sits to the right of the panel (OuterNextArrow) where
  // there is room for it (1440px+); on narrower wide screens it stays here, between the text and the panel.
  const arrow = (link: ChapterLink | null, side: "left" | "right") => (
    <div className={cn("pointer-events-none absolute inset-y-0 hidden xl:block", side === "left" ? "-left-24" : "-right-24", side === "right" && nextInside && "min-[1440px]:hidden")}>
      {link && (
        <button
          type="button"
          onClick={link.go}
          aria-label={`${side === "left" ? "Previous" : "Next"} chapter: ${link.label}`}
          title={link.label}
          className="pointer-events-auto sticky top-[calc(50vh-1.75rem)] grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm transition hover:scale-105 hover:text-ink hover:shadow-md"
        >
          {side === "left" ? <ChevronLeft className="h-7 w-7" /> : <ChevronRight className="h-7 w-7" />}
        </button>
      )}
    </div>
  );
  return (
    <>
      {arrow(prev, "left")}
      {arrow(next, "right")}
    </>
  );
}

/** The next-chapter arrow to the right of the open cross-reference panel (screens 1440px and wider). */
function OuterNextArrow({ link }: { link: ChapterLink | null }) {
  if (!link) return null;
  return (
    <div className="pointer-events-none absolute inset-y-0 -right-[5.5rem] hidden min-[1440px]:block">
      <button
        type="button"
        onClick={link.go}
        aria-label={`Next chapter: ${link.label}`}
        title={link.label}
        className="pointer-events-auto sticky top-[calc(50vh-1.75rem)] grid h-14 w-14 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm transition hover:scale-105 hover:text-ink hover:shadow-md"
      >
        <ChevronRight className="h-7 w-7" />
      </button>
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
          <Link className="underline" to="/library">
            Back to the library
          </Link>
        </p>
      )}
    </div>
  );
}
