// Bible twenty questions: finding a person by name (design §10.1, §9.3). The game's own people first, tier 1 before
// tier 2, by every name they go by. With `wider`, "Not in my list?" also searches all the site's people (tribes and
// peoples left out), and "Someone not on this list" ends politely. Only the fixed lists are searched: nothing typed
// is ever sent anywhere.
import { useEffect, useId, useMemo, useState } from "react";
import { loadEnglishPeople, type PersonRow } from "@/lib/study";
import type { Engine } from "./engine";
import { fold, searchPool } from "./shared";

export type Pick = { kind: "pool"; person: number } | { kind: "other"; id: string; label: string } | { kind: "none" };

const SHOWN = 8;
function searchOthers(rows: readonly PersonRow[], skip: ReadonlySet<string>, query: string): PersonRow[] {
  const q = fold(query);
  if (!q) return [];
  return rows.filter((r) => !r.g && !skip.has(r.id) && [r.n, ...r.o].some((n) => fold(n).startsWith(q))).slice(0, SHOWN);
}

interface Props { engine: Engine; label: string; wider?: boolean; onPick: (pick: Pick) => void; onCancel?: () => void }

export function PersonSearch({ engine, label, wider = false, onPick, onCancel }: Props) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [others, setOthers] = useState<PersonRow[] | "loading" | "failed" | null>(null);
  const found = useMemo(() => searchPool(engine, query), [engine, query]);
  const skip = useMemo(() => new Set(engine.data.people.map((p) => p.id)), [engine]);
  const more = Array.isArray(others) ? searchOthers(others, skip, query) : [];

  useEffect(() => {
    if (others !== "loading") return;
    let live = true;
    loadEnglishPeople().then((rows) => { if (live) setOthers(rows); }).catch((error: unknown) => {
      console.warn("Twenty questions: the full people list did not load:", error);
      if (live) setOthers("failed");
    });
    return () => { live = false; };
  }, [others]);

  return <div className="tq-search">
    <label htmlFor={inputId}>{label}</label>
    <input id={inputId} type="search" autoComplete="off" value={query} placeholder="Type a name" autoFocus onChange={(e) => setQuery(e.target.value)} />
    {query.trim() && <ul className="tq-results" aria-label="People in the game">
      {found.map((p) => <li key={p}><button type="button" onClick={() => onPick({ kind: "pool", person: p })}>
        <span className="tq-result-name">{engine.data.people[p].label}</span>
        <span className="tq-result-brief">{engine.data.people[p].b}</span>
      </button></li>)}
      {!found.length && <li className="tq-empty">{wider ? "Nobody in the game by that name yet. Check the spelling, or look further down." : "Nobody in the game by that name."}</li>}
    </ul>}
    {wider && <div className="tq-wider">
      {others === null && <button type="button" className="tq-quiet" onClick={() => setOthers("loading")}>Not in my list?</button>}
      {others === "loading" && <p className="tq-empty">Loading everyone in the Bible…</p>}
      {others === "failed" && <p className="tq-empty" role="alert">The full list of people couldn't load.</p>}
      {Array.isArray(others) && query.trim() && <ul className="tq-results" aria-label="Everyone else in the Bible">
        {more.map((r) => <li key={r.id}><button type="button" onClick={() => onPick({ kind: "other", id: r.id, label: r.n })}>
          <span className="tq-result-name">{r.n}</span><span className="tq-result-brief">{r.b}</span>
        </button></li>)}
        {!more.length && <li className="tq-empty">Not among everyone else in the Bible either.</li>}
      </ul>}
      <button type="button" className="tq-quiet" onClick={() => onPick({ kind: "none" })}>Someone not on this list</button>
    </div>}
    {onCancel && <button type="button" className="tq-quiet" onClick={onCancel}>Cancel</button>}
  </div>;
}
