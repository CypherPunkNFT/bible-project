import { Search } from "lucide-react";
import { SearchLanding } from "@/components/search/SearchLanding";
import { MeaningBadge, PlacesSection, StudiesSection, TopicsSection, VersesSection } from "@/components/search/SearchSections";
import { useMeaningResults } from "@/lib/meaning/useMeaningResults";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadPlain } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { highlightParts, makeMatcher, searchBooks, type Hit } from "@/lib/search";
import { SECTIONS, sectionColor } from "@/lib/sections";
import type { BookInfo } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";

const PAGE = 100;

/**
 * The site's search: one box, then studies (by meaning or words), verses by meaning (World English Bible, when meaning search is
 * on), atlas places, and the exact-words search in any version. Meaning search runs on the visitor's device (MEANING_SEARCH.md).
 */
export default function SearchPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const slug = catalog.translations.some((t) => t.slug === params.get("in")) ? params.get("in")! : lastReadPath()?.split("/")[2] ?? "kjv";
  const translation = catalog.translations.find((t) => t.slug === slug) ?? catalog.translations[0];
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const [wholeWords, setWholeWords] = useState(params.get("whole") !== "0");
  // Results carry the version and settings they were made with, so changing the form never relabels them.
  const [state, setState] = useState<{ status: "idle" | "loading" | "done"; loaded: number; hits: Hit[]; query: string; slug: string; wholeWords: boolean }>({
    status: "idle",
    loaded: 0,
    hits: [],
    query: "",
    slug,
    wholeWords,
  });
  const latestRun = useRef(0);
  const [submitted, setSubmitted] = useState(params.get("q") ?? "");
  const meaning = useMeaningResults(submitted);
  const [shown, setShown] = useState(PAGE);
  const books = catalog.books.filter((b) => translation.books[b.code]);

  // `asked` is a query from an example button; otherwise the box.
  const run = async (event?: FormEvent, asked?: string) => {
    event?.preventDefault();
    const query = asked ?? draft;
    if (asked) setDraft(asked);
    const matcher = makeMatcher(query, wholeWords);
    if (!matcher) return;
    setParams({ q: query, in: translation.slug, whole: wholeWords ? "1" : "0" }, { replace: true });
    setSubmitted(query.trim());
    const runId = ++latestRun.current;
    const searched = { query, slug: translation.slug, wholeWords };
    setState({ status: "loading", loaded: 0, hits: [], ...searched });
    setShown(PAGE);
    let loaded = 0;
    const plains = await Promise.all(
      books.map((b) =>
        loadPlain(translation.slug, b.code)
          .then((plain) => {
            loaded += 1;
            if (runId === latestRun.current) setState((s) => ({ ...s, loaded }));
            return { code: b.code, plain };
          })
          .catch((error: unknown) => {
            console.warn(`search: ${translation.slug}/${b.code} unavailable`, error);
            return { code: b.code, plain: {} };
          }),
      ),
    );
    if (runId !== latestRun.current) return; // a newer search started while this one was loading
    setState({ status: "done", loaded, hits: searchBooks(plains, matcher), ...searched });
  };

  // A shared search link (?q=…) runs on arrival.
  useEffect(() => {
    if (params.get("q")) void run();
    // Arrival only; later searches run from the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matcher = useMemo(() => makeMatcher(state.query, state.wholeWords), [state.query, state.wholeWords]);
  const resultTranslation = catalog.translations.find((t) => t.slug === state.slug) ?? translation;
  const resultBooks = catalog.books.filter((b) => resultTranslation.books[b.code]);
  const perBook = useMemo(() => {
    const counts = new Map<string, number>();
    for (const hit of state.hits) counts.set(hit.code, (counts.get(hit.code) ?? 0) + 1);
    return counts;
  }, [state.hits]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <header className="pb-6 pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Search</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Ask a question. Find a word.</h1>
        <p className="mt-3 max-w-2xl text-muted">Studies, verses and places, by the words you remember or by what you mean. Exact words work in every version.</p>
      </header>
      <form onSubmit={run} className="flex flex-wrap items-center gap-2" role="search">
        <label className="relative min-w-[14rem] flex-1">
          <span className="sr-only">Words to find</span>
          <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted" aria-hidden />
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a question, or type words: why does God allow suffering? · the stone which the builders" className="h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-base" />
        </label>
        <label className="sr-only" htmlFor="search-version">
          Version
        </label>
        <select id="search-version" value={translation.slug} onChange={(e) => setParams({ q: draft, in: e.target.value }, { replace: true })} className="h-11 rounded-xl border border-line bg-surface px-2 text-sm">
          {catalog.translations.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.abbr} — {t.name}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-page hover:opacity-90">
          Search
        </button>
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={wholeWords} onChange={(e) => setWholeWords(e.target.checked)} className="accent-[var(--accent)]" /> Whole words only (exact-words search)
          </label>
          <MeaningBadge />
        </div>
      </form>

      {!submitted && <SearchLanding onAsk={(asked) => void run(undefined, asked)} />}
      {submitted && (
        <>
          <TopicsSection query={submitted} />
          <StudiesSection query={submitted} meaning={meaning} />
          <VersesSection query={submitted} meaning={meaning} />
          <PlacesSection query={submitted} />
        </>
      )}
      {(state.status === "loading" || state.status === "done") && <h2 className="mt-10 font-serif text-2xl font-semibold">Exact words <span className="align-middle text-xs font-normal text-muted">in {resultTranslation.abbr}; change the version above</span></h2>}

      {state.status === "loading" && (
        <p className="mt-3 text-sm text-muted" role="status">
          Reading {translation.abbr}… {state.loaded} of {books.length} books
        </p>
      )}
      {state.status === "done" && (
        <section aria-live="polite" className="mt-3">
          <p className="text-lg">
            <strong>{formatNumber(state.hits.length)}</strong> {state.hits.length === 1 ? "verse contains" : "verses contain"} “{state.query}” in the {resultTranslation.name}.
          </p>
          {state.hits.length > 0 && <Distribution books={resultBooks} counts={perBook} />}
          <ol className="mt-6 divide-y divide-line">
            {state.hits.slice(0, shown).map((hit) => {
              const book = catalog.books.find((b) => b.code === hit.code)!;
              return (
                <li key={`${hit.code}${hit.chapter}:${hit.verse}`} className="py-3">
                  <Link to={`/read/${resultTranslation.slug}/${hit.code}/${hit.chapter}?v=${hit.verse}`} className="group block">
                    <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-accent">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(book.section) }} aria-hidden />
                      {book.name} {hit.chapter}:{hit.verse}
                    </span>
                    <span className="mt-1 block font-serif" lang={resultTranslation.lang} dir={resultTranslation.dir}>
                      {matcher ? highlightParts(hit.text, matcher).map((part, i) => (part.match ? <mark key={i} className="rounded bg-accent/25 px-0.5 text-ink">{part.text}</mark> : <span key={i}>{part.text}</span>)) : hit.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {state.hits.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-4 w-full rounded-xl bg-surface-2 py-2.5 text-sm">
              Show more ({formatNumber(state.hits.length - shown)} left)
            </button>
          )}
        </section>
      )}
    </div>
  );
}

/** Where in the Bible the matches fall: one bar per book, in order, coloured by section. */
function Distribution({ books, counts }: { books: BookInfo[]; counts: Map<string, number> }) {
  const max = Math.max(...counts.values());
  const [hover, setHover] = useState("");
  return (
    <figure className="mt-4 rounded-2xl border border-line bg-surface p-4">
      <div className="flex h-24 items-end gap-px" role="img" aria-label="Matches per book, Genesis to Revelation">
        {books.map((b) => {
          const n = counts.get(b.code) ?? 0;
          return (
            <span
              key={b.code}
              onMouseEnter={() => setHover(`${b.name}: ${n}`)}
              className={cn("flex-1 rounded-t-sm", n === 0 && "opacity-20")}
              style={{ height: `${n ? Math.max(4, (n / max) * 100) : 2}%`, background: sectionColor(b.section) }}
            />
          );
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted">
        <span>{hover || "Where the matches fall, Genesis to Revelation. Point at a bar."}</span>
        <span className="flex flex-wrap gap-3">
          {SECTIONS.filter((s) => books.some((b) => b.section === s.id)).map((s) => (
            <span key={s.id} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ background: sectionColor(s.id) }} /> {s.name}
            </span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
