// /scripture-memory: the Scripture memory helper (docs/features/scripture-memory/design.md). Pick a verse; each day it is
// said aloud, a few more of its words fade, until it is known by heart. Built in the tools hub's design (the games' hero
// and numbered shelves, games.css), like /tithe-calculator: choose a verse (01), practise (02), my verses (03) and
// keeping the list (04). The list lives in this browser's storage only; export and import move it by file.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { verseReference } from "@/lib/verses";
import { buildNameIndex } from "@/pages/citation-generator/parse";
import { GameArtImage } from "@/pages/games/art/parts";
import { importLines } from "./files";
import { KeepPanel } from "./KeepPanel";
import { MEMORY_ART } from "./memory-art";
import { Practise } from "./Practise";
import { newVerse, practise, startOver, stepBack, today, doneToday, verseKey, type MemoryVerse } from "./progress";
import { STARTERS } from "./starters";
import { MAX_LIST, STORAGE_KEY, browserStore, clearStored, mergeVerses, readStored, writeStored, type Stored } from "./storage";
import { choosePassage, loadPassage, passageAllowed } from "./verse";
import { VerseList } from "./VerseList";
import "@/pages/games/games.css";
import "./scripture-memory.css";
import { ToolsBackLink } from "@/components/tools-back/ToolsBackLink";

function Shelf({ id, index, title, text, children }: { id: string; index: string; title: string; text: string; children: ReactNode }) {
  return <section className="gm-shelf sm-shelf" id={id} aria-labelledby={`${id}-title`}>
    <div className="gm-shelf-head">
      <span className="gm-shelf-num" aria-hidden="true">{index}</span>
      <div><h2 id={`${id}-title`}>{title}</h2><p>{text}</p></div>
    </div>
    {children}
  </section>;
}

const NOT_SAVED = "This change could not be saved in this browser, perhaps because its storage is full. Export your verses to keep them.";
const NEWER = "Your list was saved by a newer version of Bible Guide, so this page will not change it. Reload the page to keep working with it.";
const GONE = "That verse is no longer in your list. It may have been removed in another tab.";

type Pending = { from: number; to: number } | null;

export default function ScriptureMemoryPage() {
  const catalog = useCatalog();
  const index = useMemo(() => buildNameIndex(catalog.books), [catalog]);
  const check = useCallback((from: unknown, to: unknown) => passageAllowed(catalog, from, to), [catalog]);
  const store = useMemo(() => browserStore(), []);
  const [stored, setStored] = useState<Stored>(() => readStored(store, check, today()));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string[]>([]);
  const [typed, setTyped] = useState("");
  const [choiceError, setChoiceError] = useState("");
  const [failed, setFailed] = useState<Pending>(null);
  const [adding, setAdding] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusPractise = useRef(false);
  const day = today();

  // Another open tab changed the list: follow it.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) setStored(readStored(store, check, today()));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [store, check]);

  useEffect(() => {
    if (!focusPractise.current || !heading.current) return;
    focusPractise.current = false;
    heading.current.scrollIntoView?.({ block: "start" });
    heading.current.focus({ preventScroll: true });
  }, [openKey]);

  /** Applies a change to the list as stored right now (never to a stale copy), saves it, and shows `lines`. */
  const commit = (change: (verses: MemoryVerse[]) => MemoryVerse[] | null, lines: () => string[]): boolean => {
    const fresh = store ? readStored(store, check, today()) : stored;
    if (fresh.newer) { setStored(fresh); setNotice([NEWER]); return false; }
    const next = change(fresh.verses);
    if (!next) { setStored(fresh); return false; }
    const saved = !store || writeStored(store, next);
    setStored({ verses: next, newer: false });
    setNotice(saved ? lines() : [...lines(), NOT_SAVED]);
    return true;
  };

  const open = (key: string) => { focusPractise.current = true; setOpenKey(key); };

  const add = async (from: number, to: number) => {
    setChoiceError("");
    setFailed(null);
    const key = verseKey({ from, to });
    if (stored.verses.some((verse) => verseKey(verse) === key)) { open(key); setNotice(["That verse is already in your list, so it is open below."]); return; }
    if (stored.verses.length >= MAX_LIST) { setChoiceError("Your list is full at 500 verses. Remove one to add another."); return; }
    setAdding(true);
    try {
      const loaded = await loadPassage(catalog, from, to);
      if (!loaded.ok) { setChoiceError(loaded.error); return; }
      const added = commit((verses) => verses.some((verse) => verseKey(verse) === key) ? verses : [newVerse(from, to, today()), ...verses],
        () => ["Added. Start with step 1: read it aloud a few times."]);
      if (added) { setTyped(""); open(key); }
    } catch (error) {
      console.warn("Scripture memory: the verse could not load:", error);
      setFailed({ from, to });
    } finally {
      setAdding(false);
    }
  };

  const submit = () => {
    const chosen = choosePassage(catalog, typed, index);
    if (!chosen.ok) { setChoiceError(chosen.error); setFailed(null); return; }
    void add(chosen.from, chosen.to);
  };

  /** Changes the open verse in the stored list; does nothing if another tab removed it. */
  const changeOpen = (update: (verse: MemoryVerse) => MemoryVerse, lines: () => string[]) =>
    commit((verses) => {
      const i = verses.findIndex((verse) => verseKey(verse) === openKey);
      if (i < 0) { setNotice([GONE]); return null; }
      return verses.map((verse, k) => (k === i ? update(verse) : verse));
    }, lines);

  const said = () => {
    let message = "";
    changeOpen((verse) => {
      const result = practise(verse, today());
      message = {
        stepped: "Today's step is done. Come back tomorrow for the next one.",
        known: "Known by heart! Say it now and then to keep it fresh.",
        kept: "Said again today. It stays known by heart.",
        already: "Done for today. One step per calendar day: come back tomorrow for the next one.",
      }[result.outcome];
      return result.verse;
    }, () => [message]);
  };

  const back = () => changeOpen(stepBack, () => [openVerse && doneToday(openVerse, today())
    ? "Back one step. Today's step is already done, so the next one is tomorrow."
    : "Back one step. Say it aloud, then take today's step when you are ready."]);

  const over = () => {
    if (window.confirm("Start this verse over from step 1?")) changeOpen(startOver, () => ["Started over from step 1."]);
  };

  const remove = () => {
    if (!window.confirm("Remove this verse and its progress from your list?")) return;
    const key = openKey;
    if (commit((verses) => verses.filter((verse) => verseKey(verse) !== key), () => ["Removed from your list."])) setOpenKey(null);
  };

  const importVerses = (read: { verses: MemoryVerse[]; skipped: number }): string[] => {
    let lines: string[] = [];
    const done = commit((verses) => {
      const merged = mergeVerses(verses, read.verses);
      lines = importLines(merged.added, merged.updated, merged.same, read.skipped, merged.full);
      return merged.verses;
    }, () => []);
    return done ? lines : [NEWER];
  };

  const clear = () => {
    const cleared = clearStored(store);
    setStored({ verses: [], newer: false });
    setOpenKey(null);
    setNotice(cleared ? ["Your list is cleared."] : [NOT_SAVED]);
  };

  const openVerse = stored.verses.find((verse) => verseKey(verse) === openKey) ?? null;

  return <div className="st-page gm-page sm-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <ToolsBackLink />
        <h1>Scripture memory helper:<br /><span>a few words fewer each day.</span></h1>
        <p className="gm-lede">Choose a verse and say it aloud once a day. Each day a few more of its words fade from the page, until you can say the whole verse by heart. Your verses are kept only in this browser: no account and no tracking.</p>
        <nav className="gm-jump" aria-label="On this page">
          <a href="#choose">Choose a verse</a>
          <a href="#practise">Practise</a>
          <a href="#my-verses">My verses</a>
          <a href="#keep">Keep your verses</a>
        </nav>
      </div>
      <div className="gm-hero-figure"><GameArtImage art={MEMORY_ART} className="gm-hero-art" /></div>
    </header>

    {stored.newer && <p className="sm-bad sm-banner" role="alert">{NEWER}</p>}

    <Shelf id="choose" index="01" title="Choose a verse" text="Type a reference, one verse or up to eight in one chapter, or start with a well-loved verse.">
      <form className="sm-choose" onSubmit={(event) => { event.preventDefault(); submit(); }}>
        <div className="sm-field">
          <label htmlFor="sm-reference">Reference</label>
          <input id="sm-reference" value={typed} autoComplete="off" spellCheck={false} placeholder="John 3:16" maxLength={120}
            aria-invalid={choiceError ? true : undefined} aria-describedby="sm-reference-hint" onChange={(event) => { setTyped(event.target.value); setChoiceError(""); }} />
          <p id="sm-reference-hint" className={choiceError ? "sm-bad" : "sm-hint"} aria-live="polite">{choiceError || "Such as Psalm 23:1, Proverbs 3:5-6 or 1 Cor 13:4-7."}</p>
        </div>
        <button type="submit" className="sm-primary" disabled={adding || !typed.trim()}>Add and practise</button>
      </form>
      {failed && <p className="sm-bad">This verse couldn't load. Check your connection.
        <button type="button" className="sm-link" onClick={() => void add(failed.from, failed.to)}>Try again</button></p>}
      <p className="sm-label">Or start with</p>
      <ul className="sm-starters" role="list">
        {STARTERS.map((starter) => <li key={verseKey(starter)}>
          <button type="button" disabled={adding} onClick={() => void add(starter.from, starter.to)}>{verseReference(catalog, starter.from, starter.to)}</button>
        </li>)}
      </ul>
    </Shelf>

    <Shelf id="practise" index="02" title="Practise" text="Say the verse aloud once a day. Each day you do, a few more words fade, one step per calendar day.">
      {notice.length > 0 && <ul className="sm-result" role="status">{notice.map((line) => <li key={line}>{line}</li>)}</ul>}
      {openVerse
        ? <Practise ref={heading} key={openKey!} verse={openVerse} day={day} onSaid={said} onBack={back} onStartOver={over} onRemove={remove} />
        : <p className="sm-quiet">Choose a verse above, or open one from your list below.</p>}
      <p className="sm-quiet">Want to test yourself by typing it? Play <Link to="/games/verse-completion">Verse completion</Link> on the Games page.</p>
    </Shelf>

    <Shelf id="my-verses" index="03" title="My verses" text="Every verse you are learning, newest first. Open one to practise it.">
      <VerseList verses={stored.verses} openKey={openKey} day={day} onOpen={open} />
    </Shelf>

    <Shelf id="keep" index="04" title="Keep your verses" text="Move your list to another browser or device with a file, and what this page does with your verses.">
      <KeepPanel verses={stored.verses} check={check} saving={store !== null} onImport={importVerses} onClear={clear} />
    </Shelf>
  </div>;
}
