// /puzzle-maker: printable Bible word searches and crosswords from a passage or a theme, with an answer key
// (docs/features/puzzle-maker/design.md). The grids come from the site's one puzzle generator (src/lib/puzzles), the
// one the crossword game uses. No AI and no server: the choices live only in the address, so a sheet can be made again
// or sent to a co-teacher, and nothing is stored or sent anywhere. README.md beside this file.
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { plural } from "@/lib/site-format";
import { THEMES } from "@/pages/games/crossword/themes";
import { canPrint, defaultPaper, usePrintSheet, type Paper } from "@/pages/life-events/print-sheet";
import { PrintPortal } from "@/pages/life-events/PrintPortal";
import type { Note } from "./make";
import { PuzzleSheet } from "./PuzzleSheet";
import { cleanTitle, freshSeed, MAX_REF, MAX_TITLE, readSettings, settingsParams, type Level, type Settings, type Size } from "./settings";
import { useSheet } from "./useSheet";
import "@/components/stations/stations.css";
import "./puzzle-maker.css";

export const PUZZLE_MAKER_PATH = "/puzzle-maker";
const EXAMPLES = ["Psalm 23", "Genesis 1", "Exodus 20:1-17", "Ruth 1", "Luke 2:1-20", "John 3", "1 Corinthians 13"];

const SEARCH_SIZES: readonly [Size, string][] = [
  ["small", "Small: 10 by 10 squares, 8 words"],
  ["medium", "Medium: 13 by 13 squares, 12 words"],
  ["large", "Large: 15 by 15 squares, 18 words"],
];
const CROSS_SIZES: readonly [Size, string][] = [
  ["small", "Small: about 7 words"],
  ["medium", "Medium: about 12 words"],
  ["large", "Large: about 18 words"],
];
const SEARCH_LEVELS: readonly [Level, string][] = [
  ["easy", "Easy: words run across and down"],
  ["medium", "Medium: diagonal words too"],
  ["hard", "Hard: every direction, backwards too"],
];
const CROSS_LEVELS: readonly [Level, string][] = [
  ["easy", "Easy: with a word bank"],
  ["medium", "Medium: no word bank"],
  ["hard", "Hard: no word bank or verse references"],
];

/** What the page says about a sheet it made. */
function NoteText({ note }: { note: Note }) {
  if (note.kind === "skipped") return <>{plural(note.count, "One word did not fit in the grid, so it is left off the list.", "{n} words did not fit in the grid, so they are left off the list.")}</>;
  if (note.kind === "topped-up") return <>This theme has too few words at that level, so some less familiar ones were added.</>;
  return <>This theme has too few clues for that choice, so this crossword uses the nearest one that works: <b>{CROSS_SIZES.find(([size]) => size === note.size)?.[1]}</b>, <b>{CROSS_LEVELS.find(([level]) => level === note.level)?.[1]}</b>.</>;
}

export default function PuzzleMakerPage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const settings = useMemo(() => readSettings(params), [params]);
  const [seedOnArrival] = useState(freshSeed);
  const seed = settings.seed ?? seedOnArrival;
  const [refDraft, setRefDraft] = useState(settings.ref);
  const [titleDraft, setTitleDraft] = useState(settings.title);
  const [retry, setRetry] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [withKey, setWithKey] = useState(true);
  const [paper, setPaper] = useState<Paper>(defaultPaper);
  const { print } = usePrintSheet(paper, "0.5in");
  const printable = useMemo(() => canPrint(), []);

  const change = (next: Partial<Settings>) => setParams(settingsParams({ ...settings, seed, ...next }), { replace: true });
  // A first visit (or a link without a seed) gets one now, written into the address once, so the sheet can be made again.
  useEffect(() => {
    if (settings.seed === null) setParams(settingsParams({ ...settings, seed }), { replace: true });
  }, [settings, seed, setParams]);
  // A new address (a link, Back) shows its own passage and title in the form.
  useEffect(() => { setRefDraft(settings.ref); }, [settings.ref]);
  useEffect(() => { setTitleDraft(settings.title); }, [settings.title]);

  const state = useSheet({ ...settings, seed }, catalog, retry);
  const theme = THEMES.find((t) => t.id === settings.theme);
  const title = settings.title || (settings.from === "passage" ? settings.ref : theme?.title ?? "");
  // While a new sheet is read or made, the last one stays on screen (dimmed), so the page does not jump.
  const shown = state.status === "done" ? state.made : state.status === "reading" || state.status === "making" ? state.last : null;
  const made = shown?.ok ? shown : null;
  const stale = state.status !== "done";

  const apply = (event?: FormEvent, example?: string) => {
    event?.preventDefault();
    const ref = (example ?? refDraft).slice(0, MAX_REF).trim();
    change({ ref: ref || settings.ref, title: cleanTitle(titleDraft) });
    if (example) setRefDraft(example);
  };
  const applyTitle = () => { if (cleanTitle(titleDraft) !== settings.title) change({ title: cleanTitle(titleDraft) }); };
  const sizes = settings.kind === "search" ? SEARCH_SIZES : CROSS_SIZES;
  const levels = settings.kind === "search" ? SEARCH_LEVELS : CROSS_LEVELS;

  return (
    <div className="st-page pm-page mx-auto max-w-5xl px-4 sm:px-6">
      <header>
        <Link to="/tools" className="st-kick">Tools</Link>
        <h1>Puzzle maker</h1>
        <p className="pm-lede">Make a word search or a crossword from any Bible passage or theme, ready to print for a class, a family evening or a long car ride, with its answer key. The words and clues come from the Berean Standard Bible.</p>
      </header>

      <form className="pm-form" aria-label="Make a puzzle" onSubmit={apply}>
        <fieldset className="pm-choice">
          <legend>Puzzle</legend>
          <label><input type="radio" name="pm-kind" checked={settings.kind === "search"} onChange={() => change({ kind: "search" })} />Word search</label>
          <label><input type="radio" name="pm-kind" checked={settings.kind === "cross"} onChange={() => change({ kind: "cross" })} />Crossword</label>
        </fieldset>
        <fieldset className="pm-choice">
          <legend>Words from</legend>
          <label><input type="radio" name="pm-from" checked={settings.from === "passage"} onChange={() => change({ from: "passage", title: "" })} />A passage</label>
          <label><input type="radio" name="pm-from" checked={settings.from === "theme"} onChange={() => change({ from: "theme", title: "" })} />A theme</label>
        </fieldset>

        {settings.from === "passage" ? <div className="pm-passage">
          <label className="pm-field">
            <span>Passage</span>
            <input type="text" value={refDraft} maxLength={MAX_REF} autoComplete="off" spellCheck={false} placeholder="Psalm 23" onChange={(event) => setRefDraft(event.target.value)} />
          </label>
          <div className="pm-examples" role="group" aria-label="Try one">
            {EXAMPLES.map((example) => <button key={example} type="button" className="pm-chip" translate="no" onClick={() => apply(undefined, example)}>{example}</button>)}
          </div>
        </div> : <label className="pm-field">
          <span>Theme</span>
          <select value={settings.theme} onChange={(event) => change({ theme: event.target.value, title: "" })}>
            {THEMES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </label>}

        <div className="pm-row">
          <label className="pm-field">
            <span>Size</span>
            <select value={settings.size} onChange={(event) => change({ size: event.target.value as Size })}>
              {sizes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="pm-field">
            <span>Difficulty</span>
            <select value={settings.level} onChange={(event) => change({ level: event.target.value as Level })}>
              {levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        {settings.from === "theme" && <p className="pm-hint">For a theme, the difficulty also chooses how well known the words are.</p>}
        <label className="pm-field">
          <span>Title on the sheet (optional)</span>
          <input type="text" value={titleDraft} maxLength={MAX_TITLE} autoComplete="off" placeholder={settings.from === "passage" ? settings.ref : theme?.title} onChange={(event) => setTitleDraft(event.target.value)} onBlur={applyTitle} />
        </label>
        <button type="submit" className="pm-go">Make puzzle</button>
      </form>

      <div className="pm-status" role="status" aria-live="polite">
        {state.status === "reading" && <p>{settings.from === "passage" ? "Reading the passage…" : "Loading the clues…"}</p>}
        {state.status === "making" && <p>Making your puzzle…</p>}
        {state.status === "refused" && <p className="pm-warning">{state.message}</p>}
        {state.status === "failed" && <p className="pm-warning">
          {state.what === "passage" ? "The passage could not be loaded. Check your connection and try again." : "The clues could not be loaded. Check your connection and try again."}
          {" "}<button type="button" className="pm-link" onClick={() => setRetry((n) => n + 1)}>Try again</button>
          {state.what === "clues" && state.tries > 1 && <> If it still fails, reload the page.</>}
        </p>}
        {state.status === "done" && !state.made.ok && <p className="pm-warning">
          {state.made.problem === "too-few"
            ? "There are not enough words here for a puzzle. Try a longer passage, a smaller size, or the other kind of puzzle."
            : "No puzzle could be laid out with these words. Press New puzzle to try again, or choose a smaller size."}
        </p>}
        {!stale && made?.notes.map((note) => <p key={note.kind} className="pm-note"><NoteText note={note} /></p>)}
      </div>

      {made && <section className={`pm-result${stale ? " pm-stale" : ""}`} aria-label="Your puzzle" aria-busy={stale}>
        <div className="pm-tools">
          <button type="button" onClick={() => change({ seed: freshSeed() })}>New puzzle</button>
          <label><input type="checkbox" checked={showAnswers} onChange={(event) => setShowAnswers(event.target.checked)} />Show answers</label>
          <span className="pm-print">
            <label><input type="checkbox" checked={withKey} onChange={(event) => setWithKey(event.target.checked)} />Add the answer key on a second page</label>
            <label>
              <span>Paper</span>
              <select value={paper} onChange={(event) => setPaper(event.target.value === "a4" ? "a4" : "letter")}>
                <option value="letter">US Letter</option>
                <option value="a4">A4</option>
              </select>
            </label>
            {printable
              ? <button type="button" className="pm-go" onClick={print} disabled={stale}>Print</button>
              : <span className="pm-hint">To print, open this page in your phone's own browser.</span>}
          </span>
        </div>
        <div className="pm-preview">
          <PuzzleSheet sheet={made.sheet} title={title} size={settings.size} answers={showAnswers} links />
        </div>
      </section>}

      <aside className="pm-notes">
        <h2>How it works</h2>
        <ul>
          <li>From a passage, the puzzle uses the passage's own words, the ones it uses most first, leaving out small common words. A crossword's clues are the passage's verses with the answer left blank.</li>
          <li>From a theme, the words and clues are the Bible crossword game's: people, places, words from verses and quiz questions. <Link to="/games/crossword">Play a crossword on screen</Link>.</li>
          <li>New puzzle keeps your choices and lays the words out again. The address holds your choices, so you can bookmark a puzzle or send the link to someone and they will get the same sheet.</li>
          <li>Made in your own browser from the site's copy of the Berean Standard Bible. Nothing you type is stored or sent anywhere.</li>
        </ul>
      </aside>

      <PrintPortal label="puzzle-maker-sheet">
        {made && <>
          <PuzzleSheet sheet={made.sheet} title={title} size={settings.size} answers={false} links={false} />
          {withKey && <PuzzleSheet sheet={made.sheet} title={title} size={settings.size} answers links={false} className="pm-key-page" />}
        </>}
      </PrintPortal>
    </div>
  );
}
