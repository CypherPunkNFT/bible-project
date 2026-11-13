// /games/verse-completion: see the start of a verse and pick or type the rest; keep verses to learn by heart
// (docs/features/verse-completion/design.md). The pool of about 600 passages is built ahead of time
// (scripts/build-verse-completion.ts) and holds ids only; the words load from the site's own BSB files.
// Everything is one page: start, round, summary and My verses are states of it. Progress stays in this browser.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import type { Catalog } from "@/lib/types";
import { calendarDay, shownStreak } from "./boxes";
import { dealReview, dealRound, dueQueue } from "./deal";
import { Help } from "./Help";
import { loadPool, preload } from "./load";
import type { Pool, Settings } from "./model";
import { MyVerses } from "./MyVerses";
import { addPassage, leaveRound, removePassage, startRound, takeOver } from "./progress";
import { RoundView } from "./RoundView";
import { Start } from "./Start";
import { STORAGE_KEY, browserStore, clearRecord, freshRecord, readRecord, tabId, writeRecord, type VerseRecord } from "./storage";
import "../games.css";
import "./verse-completion.css";

export default function VerseCompletionGame() {
  useEffect(() => { document.title = "Verse completion · Games · Bible Guide"; return () => { document.title = "Bible Guide"; }; }, []);
  const catalog = useCatalog();
  const [pool, setPool] = useState<Pool | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadPool().then((value) => { if (live) setPool(value); }).catch((error) => {
      console.warn("Verse completion: the game data did not load:", error);
      if (live) setFailed(true);
    });
    return () => { live = false; };
  }, [attempt]);
  return <div className="vc-page mx-auto max-w-3xl px-4 sm:px-6">
    <Link className="gm-back" to="/games"><ArrowLeft size={14} aria-hidden="true" />All games</Link>
    {failed ? <div className="vc-start">
      <p className="vc-note" role="alert">The game couldn't load. Check your connection and try again.</p>
      <button type="button" className="vc-primary" onClick={() => setAttempt((n) => n + 1)}>Try again</button>
    </div> : pool ? <Game pool={pool} catalog={catalog} /> : <p className="vc-loading">Loading the verses…</p>}
  </div>;
}

type Screen = "start" | "round" | "verses";
type Change = (record: VerseRecord) => VerseRecord;

/** The stored record and the one way to change it: re-read what is stored, change it, write it back (§9). */
function useRecord(pool: Pool, known: ReadonlySet<string>) {
  const store = useMemo(() => browserStore(), []);
  const read = useCallback(() => readRecord(store, known, pool.stamp), [store, known, pool.stamp]);
  const [record, setRecord] = useState(read);
  const latest = useRef(record);
  const apply = useCallback(<T,>(change: (base: VerseRecord) => { record: VerseRecord; value: T }): T => {
    const base = store ? read() : latest.current;
    const { record: next, value } = change(base);
    if (next !== base) writeRecord(store, next);
    latest.current = next;
    setRecord(next);
    return value;
  }, [store, read]);
  const save = useCallback((change: Change) => apply((base) => ({ record: change(base), value: undefined })), [apply]);
  useEffect(() => { // another tab saved: refresh counts, the start screen and the round's owner
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      latest.current = read();
      setRecord(latest.current);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [read]);
  const clear = useCallback(() => { clearRecord(store); latest.current = { ...freshRecord(), seenHelp: true }; setRecord(latest.current); }, [store]);
  return { record, apply, save, clear, saving: store !== null };
}

function Game({ pool, catalog }: { pool: Pool; catalog: Catalog }) {
  const byId = useMemo(() => new Map(pool.passages.map((passage) => [passage.id, passage])), [pool]);
  const known = useMemo(() => new Set(byId.keys()), [byId]);
  const tab = useMemo(() => tabId(), []);
  const { record, apply, save, clear, saving } = useRecord(pool, known);
  const today = calendarDay(new Date());
  const round = record.round;
  const [screen, setScreen] = useState<Screen>(() => (round && round.owner === tab ? "round" : "start"));
  const [help, setHelp] = useState(false); // only from the How to play link (owner, 2026-11-13: never by itself)
  const [notice, setNotice] = useState("");

  const go = (next: Screen) => { setScreen(next); window.scrollTo?.({ top: 0 }); };
  const begin = (ids: string[], review: boolean, settings: Settings, seed: number) => {
    if (ids.length === 0) {
      setNotice(review ? "Nothing is due for review." : "No verses fit those choices. Try another difficulty or the whole Bible, or review your due verses.");
      return;
    }
    setNotice("");
    save((base) => startRound(base, { id: `round-${Date.now().toString(36)}-${seed.toString(36)}`, seed, review, settings, ids, stamp: pool.stamp, owner: tab }));
    preload(catalog, byId, ids);
    go("round");
  };
  const newSeed = () => Math.floor(Math.random() * 0xffffffff);
  const play = (settings: Settings) => { const seed = newSeed(); begin(dealRound(pool.passages, settings, record.passages, record.recent, today, seed), false, settings, seed); };
  const review = () => begin(dealReview(pool.passages, record.passages, today), true, record.settings, newSeed());
  const toggle = (id: string) => save((base) => ((base.passages[id]?.box ?? 0) > 0 ? removePassage(base, id) : addPassage(base, id, today)));
  const mine = Object.values(record.passages).filter((progress) => progress.box > 0);
  const counts = { verses: mine.length, due: dueQueue(pool.passages, record.passages, today).length, memorised: mine.filter((progress) => progress.memorised).length };
  const streak = shownStreak(record.days, today);
  const closeHelp = useCallback(() => { setHelp(false); save((base) => (base.seenHelp ? base : { ...base, seenHelp: true })); }, [save]);

  let body;
  if (screen === "round" && round) {
    body = <RoundView catalog={catalog} pool={byId} round={round} record={record} tab={tab} today={today} saving={saving} apply={apply} streak={streak}
      onTakeOver={() => save((base) => takeOver(base, tab))} onLeave={() => { save(leaveRound); go("start"); }} onHome={() => go("start")}
      onToggleAdd={toggle} onAddAll={(ids) => save((base) => ids.reduce((next, id) => addPassage(next, id, today), base))}
      onAgain={() => (round.review ? review() : play(round.settings))} onReviewMore={review} moreDue={counts.due} />;
  } else if (screen === "verses" && saving) {
    body = <MyVerses catalog={catalog} pool={byId} passages={record.passages} today={today} onReview={review}
      onPractise={(id) => begin([id], true, record.settings, newSeed())} onRemove={(id) => save((base) => removePassage(base, id))}
      onClear={() => { clear(); go("start"); }} onBack={() => go("start")} />;
  } else {
    const resume = round && !round.finished ? { at: round.done.length + 1, total: round.ids.length } : null;
    body = <Start settings={record.settings} saving={saving} streak={streak} counts={counts} resume={resume} notice={notice}
      onSettings={(settings) => save((base) => ({ ...base, settings }))} onPlay={() => play(record.settings)} onReview={review}
      onResume={() => { save((base) => takeOver(base, tab)); go("round"); }} onMyVerses={() => go("verses")} onHelp={() => setHelp(true)} />;
  }
  return <>{body}{help && <Help onClose={closeHelp} />}</>;
}

