// The theme menu's version C in the themes mock-up (owner, 2026-10-23: "let's try another way to do a triple collapsing
// and expanding menu system"; earlier: "clicking a shelf makes it drift to the side and smaller versions pop out to its
// right"). Closed, it is the same row of four shelves. Choosing a shelf folds the shelves into a slim column on the left
// and opens its groups to their right; choosing a group folds the groups into a second column and opens its tests.
// Choosing the open shelf or group again folds back out. Styles: themes-mockup.css.
import type { CSSProperties } from "react";
import { useState } from "react";
import type { TestRecord } from "./record";
import { chosenIn, homeOf, iconOf, plural, shelfMeta, shownShelves, toneOf } from "./shelf-model";
import { Cell, TestRow } from "./ThemeShelves";

interface Props { counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }
interface RailItem { id: string; title: string; meta: string; style?: CSSProperties }

export function ThemeColumns({ counts, selected, onChoose, record }: Props) {
  const shelves = shownShelves(counts);
  const [open, setOpen] = useState(() => homeOf(selected));
  const openShelf = shelves.find(({ shelf }) => shelf.id === open.shelf);
  const openGroup = openShelf?.groups.find(({ group }) => group.id === open.group);
  const pickShelf = (id: string) => setOpen({ shelf: id === open.shelf ? "" : id, group: "" });
  if (!openShelf) return <div className="th tc">
    <ul className="th-shelves">{shelves.map(({ shelf, groups }, i) =>
      <Cell key={shelf.id} id={shelf.id} n={i} title={shelf.title} line={shelf.line} on={false} open="Open the shelf" style={toneOf(shelf.tone)}
        meta={shelfMeta(groups)} chosen={chosenIn(groups, selected)} onClick={() => pickShelf(shelf.id)} />)}</ul>
  </div>;
  const groups = openShelf.groups;
  return <div className={`th tc is-deep${openGroup ? " is-deeper" : ""}`} style={toneOf(openShelf.shelf.tone)}>
    <Rail label="Shelves" open={open.shelf} onPick={pickShelf}
      items={shelves.map(({ shelf, groups }) => ({ id: shelf.id, title: shelf.title, meta: shelfMeta(groups), style: toneOf(shelf.tone) }))} />
    {openGroup ? <>
      <Rail key={openShelf.shelf.id} label={`${openShelf.shelf.title}: groups`} open={open.group} onPick={(id) => setOpen({ ...open, group: id === open.group ? "" : id })}
        items={groups.map(({ group, themes }) => ({ id: group.id, title: group.title, meta: plural(themes.length, "test") }))} />
      <TestRow key={openGroup.group.id} icon={openGroup.group.id} themes={openGroup.themes} selected={selected} onChoose={onChoose} record={record} />
    </> : <ul key={openShelf.shelf.id} className="th-shelves is-small th-groups">{groups.map(({ group, themes }, i) =>
      <Cell key={group.id} id={group.id} n={i} title={group.title} line={group.line} on={false} open="Open the group" meta={plural(themes.length, "test")}
        chosen={chosenIn([{ themes }], selected)} onClick={() => setOpen({ ...open, group: group.id })} />)}</ul>}
  </div>;
}

/** A folded level: its items as a slim column, the open one marked; choosing it again folds the menu back out. */
function Rail({ label, items, open, onPick }: { label: string; items: RailItem[]; open: string; onPick: (id: string) => void }) {
  return <nav className="tc-rail" aria-label={label}>{items.map(({ id, title, meta, style }) => {
    const Icon = iconOf(id), on = id === open;
    return <button key={id} type="button" className={on ? "is-open" : undefined} aria-expanded={on} style={style} onClick={() => onPick(id)}>
      <span className="tc-rail-icon"><Icon size={17} strokeWidth={1.5} aria-hidden /></span>
      <span><strong>{title}</strong><small>{meta}</small></span>
    </button>;
  })}</nav>;
}
