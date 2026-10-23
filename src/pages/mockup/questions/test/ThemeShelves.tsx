// 01 Choose a theme, in three levels (owner, 2026-10-22: "when we click it, below it, a secondary number of rows, not
// that it gets replaced… subcategories and subcategories"). The four shelves keep the homepage's "How the library is
// organised" grid, a little smaller, with a square glow when pointed at; choosing one adds a row of its groups below in
// the same cells, smaller (owner: "the secondary options… in the same format as the super category"), and choosing a
// group a row of its tests in the same cells again (owner, 2026-10-23: "the third categories also the same… square with
// hover glow… just the same as the other two"), each with its number of questions and the reader's best score so far.
// The shelf and group of the chosen test open on their own. The three rows sit in one bordered box, sharing their
// borders (owner, 2026-10-23, version B of /themes_mockup; theme-box.css). Only the tests, the endpoints, are numbered
// (owner: numbers on the shelves and groups made them look like units).
import { ArrowRight, Check } from "lucide-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import type { TestRecord } from "./record";
import { chosenIn, homeOf, iconOf, plural, shelfMeta, shownShelves, toneOf, type Counted } from "./shelf-model";
// Its styles sit with the test page's (th- rules); imported here so the questions page, which shows it too, has them.
import "../../test-options.css";
import "./theme-box.css";

interface Props { counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }

export function ThemeShelves({ counts, selected, onChoose, record }: Props) {
  const shelves = shownShelves(counts);
  const [open, setOpen] = useState(() => homeOf(selected));
  const openShelf = shelves.find(({ shelf }) => shelf.id === open.shelf);
  const openGroup = openShelf?.groups.find(({ group }) => group.id === open.group);
  return <div className="th th-box">
    <ul className="th-shelves">{shelves.map(({ shelf, groups }) => {
      const on = shelf.id === open.shelf;
      return <Cell key={shelf.id} id={shelf.id} title={shelf.title} line={shelf.line} on={on} open="Open the shelf" style={toneOf(shelf.tone)}
        meta={shelfMeta(groups)} chosen={chosenIn(groups, selected)}
        onClick={() => setOpen({ shelf: on ? "" : shelf.id, group: "" })} />;
    })}</ul>
    {openShelf && <div className="th-rows" key={openShelf.shelf.id} style={toneOf(openShelf.shelf.tone)}>
      <ul className="th-shelves is-small th-groups" style={{ "--cols": openShelf.groups.length } as CSSProperties}>{openShelf.groups.map(({ group, themes }) => {
        const on = group.id === open.group;
        return <Cell key={group.id} id={group.id} title={group.title} line={group.line} on={on} open="Open the group" meta={plural(themes.length, "test")}
          chosen={chosenIn([{ themes }], selected)} onClick={() => setOpen({ ...open, group: on ? "" : group.id })} />;
      })}</ul>
      {openGroup && <TestRow key={openGroup.group.id} icon={openGroup.group.id} themes={openGroup.themes} selected={selected} onChoose={onChoose} record={record} />}
    </div>}
  </div>;
}

interface CellProps { id: string; n?: number; title: string; line: string; meta: ReactNode; chosen?: string; open: string; on: boolean; onClick: () => void; style?: CSSProperties; press?: boolean }

/** One cell of the library grid, for a shelf and, smaller, for a group or a test (`press`: it is chosen, not opened). */
function Cell({ id, n, title, line, meta, chosen, open, on, onClick, style, press }: CellProps) {
  const Icon = iconOf(id);
  return <li style={style}>
    <button type="button" className={on ? "is-open" : undefined} aria-expanded={press ? undefined : on} aria-pressed={press ? on : undefined} onClick={onClick}>
      {press ? <><span className="th-shelf-top"><span className="th-shelf-icon"><Icon size={24} strokeWidth={1.4} aria-hidden /></span>{n !== undefined && <span>{String(n + 1).padStart(2, "0")}</span>}</span>
        <strong>{title}</strong></>
        : <span className="th-shelf-top is-side"><span className="th-shelf-icon"><Icon size={24} strokeWidth={1.4} aria-hidden /></span><strong>{title}</strong></span>}
      <span className="th-shelf-line">{line}</span>
      <span className="th-shelf-meta">{meta}</span>
      {chosen && <span className="th-shelf-chosen"><Check size={13} strokeWidth={2} aria-hidden />{chosen}</span>}
      <span className="th-shelf-open">{open} <ArrowRight size={14} aria-hidden /></span>
    </button>
  </li>;
}

interface TestRowProps { icon: string; themes: Counted[]; selected: string; onChoose: (id: string) => void; record: TestRecord }

/** The third row: an open group's tests, in the group's cells, each with its group's icon; set a little apart from the
 * groups under a small "Tests" heading (owner, 2026-10-23: "separate… a little bit of a margin… tests as mini title"). */
function TestRow({ icon, themes, selected, onChoose, record }: TestRowProps) {
  return <div className="th-tests-block"><p className="th-tests-name">Tests</p>
    <ul className="th-shelves is-small th-tests" style={{ "--cols": themes.length } as CSSProperties}>{themes.map(({ theme, n }, i) => {
    const on = theme.id === selected, mark = record[theme.id];
    return <Cell key={theme.id} id={icon} n={i} title={theme.title} line={theme.line} on={on} press open={on ? "Chosen" : "Choose the test"}
      meta={<>{n.toLocaleString()} questions · <span className={mark ? "th-best" : undefined}>{mark ? `Best ${mark.best} of ${mark.of}` : "Not taken yet"}</span></>}
      onClick={() => onChoose(on ? "" : theme.id)} />;
  })}</ul></div>;
}
