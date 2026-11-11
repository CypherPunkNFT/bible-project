// /random-verse: one tap for a verse of the Berean Standard Bible, from the whole Bible, a Testament or one book, on any
// subject or one of the themes in themes.ts, with Copy and Share. Picked in the browser, no AI and no server: the verse
// and the choices live only in the address (?v=JHN.3.16&from=nt&theme=hope), so a verse can be shared as a link, and
// nothing is stored or sent. How it picks: pick.ts. README.md beside this file.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { plural } from "@/lib/site-format";
import { useAsync } from "@/lib/useAsync";
import { Filters } from "./Filters";
import { readVerse, settleDraw } from "./load";
import { booksFrom, draw, makePool, parseFrom, parseVerseKey, poolSize, sameVerse, themeById, verseKey, type From, type VerseRef } from "./pick";
import type { Theme } from "./themes";
import { VERSE_COUNTS } from "./verse-counts";
import { VerseCard, type VerseState } from "./VerseCard";
import "@/components/stations/stations.css";
import "./random-verse.css";

interface Choice { from: From; theme: Theme | undefined }

const filterParams = ({ from, theme }: Choice): Record<string, string> => ({ ...(from ? { from } : {}), ...(theme ? { theme: theme.id } : {}) });

export default function RandomVersePage() {
  const catalog = useCatalog();
  const books = useMemo(() => catalog.books.filter((book) => Object.prototype.hasOwnProperty.call(VERSE_COUNTS, book.code)), [catalog]);
  const [params, setParams] = useSearchParams();
  const choice: Choice = useMemo(() => ({ from: parseFrom(params.get("from")), theme: themeById(params.get("theme")) }), [params]);
  const verse = useMemo(() => parseVerseKey(params.get("v")), [params]);
  const inScope = useMemo(() => booksFrom(choice.from, books), [choice.from, books]);
  const size = poolSize(makePool(inScope, choice.theme));
  const [drawing, setDrawing] = useState(false);
  const [drawFailed, setDrawFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // A new verse from the choice, never the one on screen when there is another. `push`: a tap, which the Back button
  // undoes; arriving or changing the choice replaces the address instead.
  const next = useCallback(async (wanted: Choice, push: boolean) => {
    const pool = makePool(booksFrom(wanted.from, books), wanted.theme);
    if (!poolSize(pool)) {
      setParams({ ...(verse ? { v: verseKey(verse) } : {}), ...filterParams(wanted) }, { replace: true });
      return;
    }
    setDrawing(true);
    setDrawFailed(false);
    try {
      let picked: VerseRef | null = null;
      for (let tries = 0; tries < 5 && (!picked || (sameVerse(picked, verse) && poolSize(pool) > 1)); tries++) {
        const drawn = draw(pool);
        if (!drawn) break;
        picked = "nth" in drawn ? await settleDraw(catalog, drawn) : drawn;
      }
      if (picked) setParams({ v: verseKey(picked), ...filterParams(wanted) }, { replace: !push });
    } catch (error) {
      console.error("random verse: a verse could not be drawn", error);
      setDrawFailed(true);
    } finally {
      setDrawing(false);
    }
  }, [books, catalog, setParams, verse]);

  // Arriving without a verse (or with one the BSB has no book or chapter for): draw one straight away, once.
  const arrived = useRef(false);
  useEffect(() => {
    if (verse || arrived.current) return;
    arrived.current = true;
    void next(choice, false);
  }, [verse, choice, next]);

  const words = useAsync(() => (verse ? readVerse(catalog, verse) : Promise.resolve(undefined)), `random-verse:${params.get("v")}:${attempt}`);
  const state: VerseState = words.status === "loading" ? { status: "loading" } : words.status === "error" ? { status: "error" }
    : words.value === undefined ? { status: "missing" } : { status: "ready", text: words.value };
  // "Psalm 23:1", as the life-event cards write one psalm, though the catalogue names the book "Psalms".
  const bookName = verse ? (books.find((book) => book.code === verse.code)?.name ?? verse.code).replace(/^Psalms$/, "Psalm") : "";
  const reference = verse ? `${bookName} ${verse.chapter}:${verse.verse}` : "";

  return (
    <div className="st-page rv-page mx-auto max-w-4xl px-4 sm:px-6">
      <header>
        <Link to="/tools" className="st-kick">Tools</Link>
        <h1>Random Bible verse</h1>
        <p className="rv-lede">One tap for a verse from the Berean Standard Bible. Draw from the whole Bible, one Testament or one book, or choose a theme such as hope, peace or courage. Copy it, share it, or open it in the reader to see where it sits.</p>
      </header>

      <Filters books={books} inScope={inScope} from={choice.from} theme={choice.theme}
        onFrom={(from) => void next({ ...choice, from }, false)} onTheme={(theme) => void next({ ...choice, theme }, false)} />

      <p className="rv-pool" role="status">
        {size > 0 ? plural(size, "{n} verse to draw from", "{n} verses to draw from")
          : "None of this theme's verses are in the books you chose. Choose another theme, or more of the Bible."}
      </p>

      {verse && <VerseCard verse={verse} reference={reference} state={state} onRetry={() => setAttempt((n) => n + 1)} />}

      <div className="rv-draw">
        <button type="button" className="rv-go" disabled={drawing || size === 0} onClick={() => void next(choice, true)}>Another verse</button>
        {drawFailed && <p className="rv-problem">A verse could not be loaded. Check your connection and try again.</p>}
      </div>

      <aside className="rv-notes">
        <h2>How it picks</h2>
        <ul>
          <li>With no theme, every verse in the books you chose is equally likely, from the shortest chapter to Psalm 119.</li>
          <li>Each theme is a short list of well-known verses on it, chosen by hand. A theme's verses come only from the books you chose.</li>
          <li>The Back button brings back the verse before. The address holds the verse, so you can bookmark it or send the link.</li>
          <li>Picked in your own browser from the site's copy of the Berean Standard Bible, downloading only the small file that holds the verse's chapter. Nothing is stored or sent anywhere.</li>
        </ul>
      </aside>
    </div>
  );
}
