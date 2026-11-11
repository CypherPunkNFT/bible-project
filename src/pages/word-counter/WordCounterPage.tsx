// /word-counter: how many times a word or phrase occurs in the Berean Standard Bible, book by book, with every verse
// linked to the reader. Counted in the browser from the site's own Bible files (load.ts), no AI and no server: what is
// typed stays in the address bar (?q=, so a count can be shared) and is never stored or sent. How it counts: count.ts.
// README.md beside this file.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { useCatalog } from "@/lib/catalog";
import { isNewTestament } from "@/lib/sections";
import { formatList, plural } from "@/lib/site-format";
import { BookBreakdown } from "./BookBreakdown";
import { buildMatcher, countBible, MAX_QUERY, type CountOptions } from "./count";
import { bibleBooks, loadBible, type LoadedBible } from "./load";
import { VerseList } from "./VerseList";
import "@/components/stations/stations.css";
import "./word-counter.css";

export const WORD_COUNTER_PATH = "/word-counter";
const EXAMPLES = ["love", "do not be afraid", "grace", "LORD", "faith", "Son of Man", "amen", "rejoice"];

type BibleState = { status: "idle" } | { status: "loading"; loaded: number } | { status: "ready"; bible: LoadedBible };
interface Search { query: string; options: CountOptions }

/** The search an address asks for: ?q= (cut to MAX_QUERY), &starts=1, &case=1. */

const readSearch = (params: URLSearchParams): Search => ({
  query: (params.get("q") ?? "").slice(0, MAX_QUERY),
  options: { wordStarts: params.get("starts") === "1", matchCase: params.get("case") === "1" },
});

export default function WordCounterPage() {
  const catalog = useCatalog();
  const books = useMemo(() => bibleBooks(catalog), [catalog]);
  const [params, setParams] = useSearchParams();
  // The address holds the search, so a shared link, the back button and the form all count the same way.
  const search = useMemo(() => readSearch(params), [params]);
  const [draft, setDraft] = useState(search.query);
  const [options, setOptions] = useState<CountOptions>(search.options);
  const [bible, setBible] = useState<BibleState>({ status: "idle" });
  const [book, setBook] = useState("");
  const loading = useRef(false);

  const readBible = useCallback(() => {
    if (loading.current) return;
    loading.current = true;
    setBible({ status: "loading", loaded: 0 });
    void loadBible(books, (loaded) => setBible({ status: "loading", loaded })).then((loaded) => {
      loading.current = false;
      setBible({ status: "ready", bible: loaded });
    });
  }, [books]);

  // A new search (typed, an example, or a link to this page with ?q=): show it in the form, every book again, and read
  // the Bible the first time one is asked for.
  useEffect(() => {
    setDraft(search.query);
    setOptions(search.options);
    setBook("");
    if (search.query.trim() && bible.status === "idle") readBible();
    // Only a new search does this, not the Bible arriving.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const run = (event?: FormEvent, example?: string) => {
    event?.preventDefault();
    const query = (example ?? draft).slice(0, MAX_QUERY);
    if (!buildMatcher(query, options)) return;
    setParams({ q: query, ...(options.wordStarts ? { starts: "1" } : {}), ...(options.matchCase ? { case: "1" } : {}) }, { replace: true });
    if (bible.status === "ready" && bible.bible.missing.length) readBible();
  };

  const matcher = useMemo(() => buildMatcher(search.query, search.options), [search]);
  // With no book read at all there is nothing to count: the warning below says so, rather than "not found".
  const result = useMemo(() => (bible.status === "ready" && bible.bible.books.length && matcher ? countBible(bible.bible.books, matcher) : null), [bible, matcher]);
  const newTestament = useMemo(() => new Set(books.filter((b) => isNewTestament(b.section)).map((b) => b.code)), [books]);
  const sum = (byBook: Map<string, number>, nt: boolean) => [...byBook].reduce((n, [code, times]) => n + (newTestament.has(code) === nt ? times : 0), 0);
  const missing = bible.status === "ready" ? bible.bible.missing : [];
  const missingNames = books.filter((b) => missing.includes(b.code)).map((b) => b.name);

  return (
    <div className="st-page wc-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <Link to="/tools" className="st-kick">Tools</Link>
        <h1>Bible word counter</h1>
        <p className="wc-lede">How many times does a word or phrase appear in the Bible? Type one, and see the count for the whole Bible and for every book, with each verse it is in, quoted from the Berean Standard Bible and linked to the reader.</p>
      </header>

      <form className="wc-form" role="search" aria-label="Count a word or phrase" onSubmit={run}>
        <label className="wc-field">
          <span>Word or phrase</span>
          <input type="search" value={draft} maxLength={MAX_QUERY} autoComplete="off" spellCheck={false} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit" className="wc-go">Count</button>
        <div className="wc-options">
          <label><input type="checkbox" checked={options.wordStarts} onChange={(event) => setOptions({ ...options, wordStarts: event.target.checked })} />Also count longer words that begin with it (love: loved, loves, lovely)</label>
          <label><input type="checkbox" checked={options.matchCase} onChange={(event) => setOptions({ ...options, matchCase: event.target.checked })} />Match capital letters (LORD apart from Lord)</label>
        </div>
        <div className="wc-examples" role="group" aria-label="Try one">
          {EXAMPLES.map((example) => <button key={example} type="button" className="wc-chip" translate="no" onClick={() => run(undefined, example)}>{example}</button>)}
        </div>
      </form>

      <div className="wc-status" role="status" aria-live="polite">
        {bible.status === "loading" && <>
          <span>Reading the Berean Standard Bible…</span>
          <progress max={books.length} value={bible.loaded} aria-label="Books read" />
        </>}
        {missing.length > 0 && <p className="wc-warning">
          Some books could not be loaded, so these counts leave them out: <span>{formatList(missingNames)}</span>
          {" "}<button type="button" className="wc-link" onClick={readBible}>Try again</button>
        </p>}
        {books.length === 0 && <p className="wc-warning">The Berean Standard Bible is not available here, so nothing can be counted.</p>}
        {result && <span className="sr-only">{plural(result.total, "Found once.", "Found {n} times.")}</span>}
      </div>

      {result && <section className="wc-result" aria-labelledby="wc-result-title">
        <p className="wc-label">Your search</p>
        <h2 id="wc-result-title" className="wc-query"><q translate="no">{search.query}</q></h2>
        <StationStats items={[["Times", result.total], ["Verses", result.verses.length], ["Old Testament", sum(result.byBook, false)], ["New Testament", sum(result.byBook, true)]]} />
        {result.total === 0
          ? <p className="wc-none">Not found in the Berean Standard Bible. Check the spelling, try a shorter phrase, or tick “Also count longer words that begin with it”. The Berean Standard Bible is in modern English, so older wording such as “fear not” is written “do not be afraid”.</p>
          : <>
            <BookBreakdown books={books} result={result} selected={book} onSelect={setBook} />
            <VerseList books={books} verses={result.verses} matcher={matcher!} book={book} onShowAll={() => setBook("")} />
          </>}
      </section>}

      <aside className="wc-notes">
        <h2>How it counts</h2>
        <ul>
          <li>Whole words only: “love” does not count “beloved” or “glove”. Tick the first box to count “loved” and “loves” too.</li>
          <li>Capitals are ignored unless you tick the second box, so “Lord” also counts “LORD”, the Berean Standard Bible's way of writing God's name.</li>
          <li>A word with “’s” after it counts too: “God” counts “God’s”, but “don” does not count “don’t”.</li>
          <li>The words are the Berean Standard Bible's modern English: “fear not” is not there, but “do not be afraid” is.</li>
          <li>The words of a phrase must come in order, with nothing between them but spaces, commas, dashes or quotation marks.</li>
          <li>A verse that has it twice counts twice in Times, once in Verses.</li>
          <li>The first count downloads the whole Berean Standard Bible once, a few megabytes; after that every count is instant.</li>
          <li>Counted in your own browser from the site's copy of the Berean Standard Bible. Nothing you type is stored or sent anywhere.</li>
        </ul>
      </aside>
    </div>
  );
}
