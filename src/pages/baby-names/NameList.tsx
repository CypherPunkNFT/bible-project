// The three list pages (/baby-names, /baby-names/boys, /baby-names/girls; design 5.1-5.2): each its own heading and
// opening paragraph, the same list beneath. Rows, not cards; a long list is drawn a window at a time, 50 rows above
// and below the screen, more appearing as the reader scrolls, with no "load more" button (src/lib/useRowWindow.ts).
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { namePath, type NameRow, type NamesIndex } from "@/data/baby-names";
import { formatNumber, plural } from "@/lib/site-format";
import { useRowWindow } from "@/lib/useRowWindow";
import { applyFilters, hasPopularity, lettersWithNames, readFilters, writeFilters, type Filters, type ListVariant } from "./name-filter";
import { useNamesIndex } from "./useBabyNames";

const ROW_ESTIMATE = 64;
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

const HEADINGS: Record<ListVariant, { title: string; intro: (count: string) => string }> = {
  all: {
    title: "Biblical Baby Names",
    intro: (count) => `${count} names borne by people in the Bible, each with what the name means, where that meaning comes from, the story of everyone who bore it and the verses that name them, quoted from the Berean Standard Bible.`,
  },
  boy: {
    title: "Biblical Boy Names",
    intro: (count) => `${count} boys' names from the Bible: names borne by men in Scripture, with each name's meaning, the stories of the men who bore it and the verses that name them.`,
  },
  girl: {
    title: "Biblical Girl Names",
    intro: (count) => `${count} girls' names from the Bible: names borne by women in Scripture, with each name's meaning, the stories of the women who bore it and the verses that name them.`,
  },
};

const GENDER_TEXT: Record<NameRow["g"], string> = { boy: "Boy", girl: "Girl", both: "Boy & girl", unknown: "Not stated" };
const TESTAMENT_TEXT: Record<NameRow["t"], string> = { ot: "OT", nt: "NT", both: "OT & NT" };

export function NameList({ variant }: { variant: ListVariant }) {
  const { state, retry } = useNamesIndex();
  const heading = HEADINGS[variant];
  if (state.status === "loading") return <ListFrame title={heading.title}><p role="status">Loading names…</p></ListFrame>;
  if (state.status === "error") {
    return <ListFrame title={heading.title}><p role="alert">The names could not be loaded. <button type="button" className="underline" onClick={retry}>Try again</button></p></ListFrame>;
  }
  return <LoadedList variant={variant} index={state.value} />;
}

function ListFrame({ title, children }: { title: string; children: ReactNode }) {
  return <div className="bn-page mx-auto max-w-5xl px-4 sm:px-6"><h1>{title}</h1>{children}</div>;
}

function LoadedList({ variant, index }: { variant: ListVariant; index: NamesIndex }) {
  const [params, setParams] = useSearchParams();
  const popular = hasPopularity(index.names);
  const themeIds = useMemo(() => index.themes.map((theme) => theme.id), [index.themes]);
  const filters = readFilters(params, variant, popular, themeIds);
  const rows = useMemo(() => applyFilters(index.names, filters), [index.names, params.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const letters = useMemo(() => lettersWithNames(index.names, filters), [index.names, params.toString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = useMemo(() => index.names.filter((row) => variant === "all" || row.g === variant || row.g === "both").length, [index.names, variant]);
  const change = (next: Partial<Filters>) => setParams(writeFilters({ ...filters, ...next }, variant, popular), { replace: next.query !== undefined });
  const heading = HEADINGS[variant];

  return (
    <ListFrame title={heading.title}>
      <p className="bn-intro">{heading.intro(formatNumber(total))}</p>
      <FilterBar index={index} filters={filters} letters={letters} popular={popular} variant={variant} change={change} />
      <p className="bn-count" role="status">{plural(rows.length, "{n} name", "{n} names")}</p>
      {rows.length ? <NameRows rows={rows} version={params.toString()} /> : <EmptyState filters={filters} variant={variant} change={change} />}
      <p className="bn-sources">Meanings adapted from Strong's Concordance (<a href="https://github.com/openscriptures/HebrewLexicon" className="underline">Open Scriptures Hebrew Bible Project</a>, <a href="https://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a> edition; Greek XML by Ulrik Petersen, public domain) and the Berean Standard Bible's notes. People data: <a href="https://www.STEPBible.org" className="underline">STEP Bible</a>, Tyndale House (<a href="https://creativecommons.org/licenses/by/4.0/" className="underline">CC BY 4.0</a>); grouped and abridged for these pages.{index.ssaYear ? <span>{` US popularity: Social Security Administration, ${index.ssaYear}.`}</span> : null}</p>
    </ListFrame>
  );
}

interface FilterProps { index: NamesIndex; filters: Filters; letters: Set<string>; popular: boolean; variant: ListVariant; change: (next: Partial<Filters>) => void }

function Choice<T extends string | boolean>({ label, value, current, onPick, disabled }: { label: string; value: T; current: T; onPick: (value: T) => void; disabled?: boolean }) {
  return <button type="button" className="bn-chip" aria-pressed={current === value} disabled={disabled} onClick={() => onPick(value)}>{label}</button>;
}

function FilterBar({ index, filters, letters, popular, change }: FilterProps) {
  return (
    <div className="bn-filters">
      <label className="bn-search">
        <span>Search names</span>
        <input type="search" value={filters.query} placeholder="Type a name, e.g. Eli" autoComplete="off"
          onChange={(event) => change({ query: event.target.value })} />
      </label>
      <div role="group" aria-label="Gender in the Bible">
        <span className="bn-filter-label">Gender in the Bible</span>
        <Choice label="Boy" value="boy" current={filters.gender} onPick={(gender) => change({ gender })} />
        <Choice label="Girl" value="girl" current={filters.gender} onPick={(gender) => change({ gender })} />
        <Choice label="Both" value="both" current={filters.gender} onPick={(gender) => change({ gender })} />
        <Choice label="All" value="all" current={filters.gender} onPick={(gender) => change({ gender })} />
      </div>
      <div role="group" aria-label="Testament">
        <span className="bn-filter-label">Testament</span>
        <Choice label="Old Testament" value="ot" current={filters.testament} onPick={(testament) => change({ testament })} />
        <Choice label="New Testament" value="nt" current={filters.testament} onPick={(testament) => change({ testament })} />
        <Choice label="All" value="all" current={filters.testament} onPick={(testament) => change({ testament })} />
      </div>
      <div role="group" aria-label="First letter" className="bn-letters">
        <span className="bn-filter-label">Letter</span>
        <Choice label="All" value="" current={filters.letter} onPick={(letter) => change({ letter })} />
        {LETTERS.map((letter) => (
          <Choice key={letter} label={letter.toUpperCase()} value={letter} current={filters.letter} disabled={!letters.has(letter)} onPick={(value) => change({ letter: value })} />
        ))}
      </div>
      <div role="group" aria-label="Meaning">
        <span className="bn-filter-label">Meaning</span>
        <Choice label="Any" value="" current={filters.theme} onPick={(theme) => change({ theme })} />
        {index.themes.map((theme) => <Choice key={theme.id} label={theme.label} value={theme.id} current={filters.theme} onPick={(value) => change({ theme: value })} />)}
      </div>
      <div role="group" aria-label="Show">
        <span className="bn-filter-label">Show</span>
        <Choice label="Well-known names" value={false} current={filters.showAll} onPick={(showAll) => change({ showAll })} />
        <Choice label="All names" value={true} current={filters.showAll} onPick={(showAll) => change({ showAll })} />
      </div>
      <label className="bn-sort">
        <span className="bn-filter-label">Sort</span>
        <select value={filters.sort} onChange={(event) => change({ sort: event.target.value as Filters["sort"] })}>
          {popular && <option value="popular">Popular today</option>}
          <option value="az">A to Z</option>
          <option value="mentions">Most mentioned in the Bible</option>
        </select>
      </label>
    </div>
  );
}

function EmptyState({ filters, variant, change }: { filters: Filters; variant: ListVariant; change: (next: Partial<Filters>) => void }) {
  const clear: { label: string; next: Partial<Filters> }[] = [];
  if (filters.query.trim()) clear.push({ label: `Search "${filters.query.trim()}"`, next: { query: "" } });
  if (filters.gender !== (variant === "all" ? "all" : variant)) clear.push({ label: "Gender", next: { gender: variant === "all" ? "all" : variant } });
  if (filters.testament !== "all") clear.push({ label: "Testament", next: { testament: "all" } });
  if (filters.letter) clear.push({ label: `Letter ${filters.letter.toUpperCase()}`, next: { letter: "" } });
  if (filters.theme) clear.push({ label: "Meaning", next: { theme: "" } });
  if (!filters.showAll) clear.push({ label: "Well-known only", next: { showAll: true } });
  return (
    <div className="bn-empty">
      <p>No names match all of these. Remove a filter:</p>
      <div>{clear.map((item) => <button key={item.label} type="button" className="bn-chip" onClick={() => change(item.next)}>{item.label} ×</button>)}</div>
    </div>
  );
}

function NameRows({ rows, version }: { rows: NameRow[]; version: string }) {
  const [container, setContainer] = useState<HTMLUListElement | null>(null);
  const rowOf = useMemo(() => new Map(rows.map((row, i) => [row.s, i])), [rows]);
  const rowKey = useCallback((i: number) => rows[i].s, [rows]);
  const rowOfAnchor = useCallback((slug: string) => rowOf.get(slug), [rowOf]);
  const { start, end, before, after } = useRowWindow({ rowCount: rows.length, rowKey, anchorKey: rowKey, rowOfAnchor, estimate: ROW_ESTIMATE, gap: 0, scroller: "window", container, dataVersion: version });
  const drawn = Array.from({ length: Math.max(0, end - start + 1) }, (_, k) => start + k);
  return (
    <ul ref={setContainer} className="bn-rows" role="list" style={{ paddingTop: before, paddingBottom: after }}>
      {drawn.map((i) => {
        const row = rows[i];
        return (
          <li key={row.s} data-row={i} className="bn-row" aria-posinset={i + 1} aria-setsize={rows.length}>
            <Link to={namePath(row.s)} className="bn-row-name" translate="no">{row.n}</Link>
            <span className={`bn-gender bn-gender-${row.g}`}>{GENDER_TEXT[row.g]}</span>
            <span className="bn-row-meaning">
              {row.m}{row.x ? " (and others)" : ""}
              {row.l === "uncertain" && row.m !== "Meaning uncertain" && <span className="bn-badge">Uncertain</span>}
            </span>
            <span className="bn-row-who">{row.w}</span>
            <span className="bn-row-testament">{TESTAMENT_TEXT[row.t]}</span>
          </li>
        );
      })}
    </ul>
  );
}
