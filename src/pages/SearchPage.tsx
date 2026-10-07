import { Search } from "lucide-react";
import { SearchLanding } from "@/components/search/SearchLanding";
import { WordDistribution } from "@/components/search/WordDistribution";
import { Marked, WordTabs } from "@/components/search/WordTabs";
import { markExact, queryWords, verseCounts, versesWithWords } from "@/lib/search-words";
import { MeaningBadge, PlacesSection, StudiesSection, TopicsSection, VersesSection } from "@/components/search/SearchSections";
import { useMeaningResults } from "@/lib/meaning/useMeaningResults";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadPlain } from "@/lib/data";
import { lastReadPath } from "@/lib/last-read";
import { highlightParts, makeMatcher, searchBooks, type Hit } from "@/lib/search";
import { sectionColor } from "@/lib/sections";
import { formatNumber } from "@/lib/utils";

const PAGE = 100;
type Plains = { code: string; plain: Record<string, string> }[];

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
  const [state, setState] = useState<{ status: "idle" | "loading" | "done"; loaded: number; hits: Hit[]; plains: Plains; query: string; slug: string; wholeWords: boolean }>({
    status: "idle",
    loaded: 0,
    hits: [],
    plains: [],
    query: "",
    slug,
    wholeWords,
  });
  const latestRun = useRef(0);
  const [submitted, setSubmitted] = useState(params.get("q") ?? "");
  const meaning = useMeaningResults(submitted);
  const [shown, setShown] = useState(PAGE);
  // A book picked on the chart narrows the verse list to it.
  const [bookFilter, setBookFilter] = useState("");
  // One word of the search picked in "Your words" (?w=); empty = all the words.
  const [focus, setFocus] = useState(params.get("w") ?? "");
  const books = catalog.books.filter((b) => translation.books[b.code]);

  // `asked` is a query from an example button; otherwise the box.
  const run = async (event?: FormEvent, asked?: string, keepFocus = false) => {
    event?.preventDefault();
    const query = asked ?? draft;
    if (asked) setDraft(asked);
    const matcher = makeMatcher(query, wholeWords);
    if (!matcher) return;
    const kept = keepFocus ? focus : "";
    setFocus(kept);
    setParams({ q: query, in: translation.slug, whole: wholeWords ? "1" : "0", ...(kept ? { w: kept } : {}) }, { replace: true });
    setSubmitted(query.trim());
    const runId = ++latestRun.current;
    const searched = { query, slug: translation.slug, wholeWords };
    setState({ status: "loading", loaded: 0, hits: [], plains: [], ...searched });
    setShown(PAGE);
    setBookFilter("");
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
    setState({ status: "done", loaded, hits: searchBooks(plains, matcher), plains, ...searched });
  };

  // A shared search link (?q=…) runs on arrival.
  useEffect(() => {
    if (params.get("q")) void run(undefined, undefined, true);
    // Arrival only; later searches run from the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const matcher = useMemo(() => makeMatcher(state.query, state.wholeWords), [state.query, state.wholeWords]);
  const resultTranslation = catalog.translations.find((t) => t.slug === state.slug) ?? translation;
  const resultBooks = catalog.books.filter((b) => resultTranslation.books[b.code]);
  const { words, skipped } = useMemo(() => queryWords(submitted), [submitted]);
  const focusWord = words.includes(focus) ? focus : "";
  const counts = useMemo(() => (state.status === "done" && words.length > 1 ? verseCounts(state.plains, words, state.wholeWords) : null), [state, words]);
  // Exact words: one picked word; else the phrase as typed; else, when no verse has the phrase, verses with the most of the words.
  const exact = useMemo((): { hits: Hit[]; mode: "phrase" | "word" | "words"; most: number } => {
    if (state.status !== "done") return { hits: state.hits, mode: "phrase", most: 0 };
    if (focusWord) { const m = makeMatcher(focusWord, state.wholeWords); return { hits: m ? searchBooks(state.plains, m) : [], mode: "word", most: 1 }; }
    if (state.hits.length || words.length < 2) return { hits: state.hits, mode: "phrase", most: 0 };
    return { ...versesWithWords(state.plains, words, state.wholeWords), mode: "words" };
  }, [state, focusWord, words]);
  const listed = useMemo(() => (bookFilter ? exact.hits.filter((hit) => hit.code === bookFilter) : exact.hits), [exact, bookFilter]);
  const sectionWords = focusWord ? [focusWord] : words;
  // Studies by words use only the words that count; a single word or a phrase of little words stays as typed.
  const sectionQuery = focusWord || (words.length > 1 ? words.join(" ") : submitted);
  const pickWord = (word: string) => {
    setFocus(word);
    setBookFilter("");
    setShown(PAGE);
    setParams((current) => { const next = new URLSearchParams(current); if (word) next.set("w", word); else next.delete("w"); return next; }, { replace: true });
  };

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
      {submitted && words.length > 1 && <WordTabs words={words} skipped={skipped} counts={counts} focus={focusWord} onFocus={pickWord} />}
      {submitted && (
        <>
          <TopicsSection words={sectionWords} />
          <StudiesSection query={sectionQuery} meaning={meaning} words={words} />
          {!focusWord && <VersesSection query={submitted} meaning={meaning} />}
          <PlacesSection words={sectionWords} />
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
            {exact.mode === "words" ? (
              <>No verse has the exact words “{state.query}”. <strong>{formatNumber(exact.hits.length)}</strong> {exact.hits.length === 1 ? "verse holds" : "verses hold"} {exact.most === words.length ? `all ${words.length} of your words` : `${exact.most} of your ${words.length} words`}, in the {resultTranslation.name}.</>
            ) : (
              <><strong>{formatNumber(exact.hits.length)}</strong> {exact.hits.length === 1 ? "verse contains" : "verses contain"} “{exact.mode === "word" ? focusWord : state.query}” in the {resultTranslation.name}.</>
            )}
          </p>
          {exact.hits.length > 0 && <WordDistribution books={resultBooks} hits={exact.hits} selected={bookFilter} onSelect={(code) => { setBookFilter(code); setShown(PAGE); }} slug={resultTranslation.slug} />}
          <ol className="mt-6 divide-y divide-line">
            {listed.slice(0, shown).map((hit) => {
              const book = catalog.books.find((b) => b.code === hit.code)!;
              return (
                <li key={`${hit.code}${hit.chapter}:${hit.verse}`} className="py-3">
                  <Link to={`/read/${resultTranslation.slug}/${hit.code}/${hit.chapter}?v=${hit.verse}`} className="group block">
                    <span className="flex items-center gap-2 text-sm font-semibold group-hover:text-accent">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: sectionColor(book.section) }} aria-hidden />
                      {book.name} {hit.chapter}:{hit.verse}
                    </span>
                    <span className="mt-1 block font-serif" lang={resultTranslation.lang} dir={resultTranslation.dir}>
                      {exact.mode !== "phrase" ? <Marked parts={markExact(hit.text, words, state.wholeWords)} /> : matcher ? highlightParts(hit.text, matcher).map((part, i) => (part.match ? <mark key={i} className="rounded bg-accent/25 px-0.5 text-ink">{part.text}</mark> : <span key={i}>{part.text}</span>)) : hit.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
          {listed.length > shown && (
            <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-4 w-full rounded-xl bg-surface-2 py-2.5 text-sm">
              Show more ({formatNumber(listed.length - shown)} left)
            </button>
          )}
        </section>
      )}
    </div>
  );
}
