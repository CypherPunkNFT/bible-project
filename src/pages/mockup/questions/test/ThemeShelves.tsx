// 01 Choose a theme, in three levels (owner, 2026-10-22: "when we click it, below it, a secondary number of rows, not
// that it gets replaced… subcategories and subcategories"). The four shelves keep the homepage's "How the library is
// organised" grid, a little smaller, with a square glow when pointed at; choosing one adds a row of its groups below in
// the same cells, smaller (owner: "the secondary options… in the same format as the super category"), and choosing a
// group a row of its tests, each with its number of questions and the reader's best score so far. The shelf and group of the chosen test open on their own.
import {
  ArrowRight, BookMarked, Castle, Check, Crown, Cross, Fish, Flame, Flower2, Footprints, HandHeart, Hash, Hourglass, Landmark,
  Library, MessageCircle, Music, Scale, ScrollText, Shield, Ship, Sparkles, Sprout, Sun, Tent, Users, Waves, type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { TestRecord } from "./record";
import { MIN_THEME, SHELVES, type Theme } from "./themes";

interface Props { counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }
type Counted = { theme: Theme; n: number };

const ICONS: Record<string, LucideIcon> = {
  lives: Users, stories: ScrollText, teaching: Sparkles, know: Library,
  patriarchs: Tent, leaders: Shield, rulers: Crown, prophets: Flame, women: Flower2, apostles: Fish,
  beginnings: Sprout, exodus: Waves, kingdom: Landmark, exile: Castle, jesus: Footprints, church: Ship,
  god: Sun, law: Scale, salvation: Cross, life: HandHeart, words: MessageCircle, last: Hourglass,
  books: BookMarked, wisdom: Music, facts: Hash,
};
const iconOf = (id: string) => ICONS[id] ?? Library;
const toneOf = (tone: string) => ({ "--tone": `var(--${tone})` }) as CSSProperties;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The shelves with only the groups and tests that have enough questions to show. */
function shownShelves(counts: Map<string, number>) {
  return SHELVES.map((shelf) => ({
    shelf,
    groups: shelf.groups.map((group) => ({ group, themes: group.themes.map((theme) => ({ theme, n: counts.get(theme.id) ?? 0 })).filter(({ n }) => n >= MIN_THEME) }))
      .filter(({ themes }) => themes.length),
  })).filter(({ groups }) => groups.length);
}

export function ThemeShelves({ counts, selected, onChoose, record }: Props) {
  const shelves = shownShelves(counts);
  const home = SHELVES.flatMap((s) => s.groups.map((g) => ({ s, g }))).find(({ g }) => g.themes.some((t) => t.id === selected));
  const [open, setOpen] = useState({ shelf: home?.s.id ?? "", group: home?.g.id ?? "" });
  const openShelf = shelves.find(({ shelf }) => shelf.id === open.shelf);
  const openGroup = openShelf?.groups.find(({ group }) => group.id === open.group);
  const chosenIn = (groups: { themes: Counted[] }[]) => groups.flatMap(({ themes }) => themes).find(({ theme }) => theme.id === selected)?.theme.title;
  return <div className="th">
    <ul className="th-shelves">{shelves.map(({ shelf, groups }, i) => {
      const on = shelf.id === open.shelf;
      return <Cell key={shelf.id} id={shelf.id} n={i} title={shelf.title} line={shelf.line} on={on} open="Open the shelf" style={toneOf(shelf.tone)}
        meta={`${plural(groups.length, "group")} · ${plural(groups.reduce((sum, { themes }) => sum + themes.length, 0), "test")}`} chosen={chosenIn(groups)}
        onClick={() => setOpen({ shelf: on ? "" : shelf.id, group: "" })} />;
    })}</ul>
    {openShelf && <div className="th-rows" key={openShelf.shelf.id} style={toneOf(openShelf.shelf.tone)}>
      <ul className="th-shelves is-small th-groups" style={{ "--cols": openShelf.groups.length } as CSSProperties}>{openShelf.groups.map(({ group, themes }, i) => {
        const on = group.id === open.group;
        return <Cell key={group.id} id={group.id} n={i} title={group.title} line={group.line} on={on} open="Open the group" meta={plural(themes.length, "test")}
          chosen={chosenIn([{ themes }])} onClick={() => setOpen({ ...open, group: on ? "" : group.id })} />;
      })}</ul>
      {openGroup && <TestRow key={openGroup.group.id} themes={openGroup.themes} selected={selected} onChoose={onChoose} record={record} />}
    </div>}
  </div>;
}

interface CellProps { id: string; n: number; title: string; line: string; meta: string; chosen?: string; open: string; on: boolean; onClick: () => void; style?: CSSProperties }

/** One cell of the library grid, for a shelf and, smaller, for a group. */
function Cell({ id, n, title, line, meta, chosen, open, on, onClick, style }: CellProps) {
  const Icon = iconOf(id);
  return <li style={style}>
    <button type="button" className={on ? "is-open" : undefined} aria-expanded={on} onClick={onClick}>
      <span className="th-shelf-top"><span className="th-shelf-icon"><Icon size={24} strokeWidth={1.4} aria-hidden /></span><span>{String(n + 1).padStart(2, "0")}</span></span>
      <strong>{title}</strong>
      <span className="th-shelf-line">{line}</span>
      <span className="th-shelf-meta">{meta}</span>
      {chosen && <span className="th-shelf-chosen"><Check size={13} strokeWidth={2} aria-hidden />{chosen}</span>}
      <span className="th-shelf-open">{open} <ArrowRight size={14} aria-hidden /></span>
    </button>
  </li>;
}

interface TestRowProps { themes: Counted[]; selected: string; onChoose: (id: string) => void; record: TestRecord }

/** The third row: an open group's tests. */
function TestRow({ themes, selected, onChoose, record }: TestRowProps) {
  return <div className="th-cards th-tests">{themes.map(({ theme, n }) => {
    const on = theme.id === selected, mark = record[theme.id];
    return <button key={theme.id} type="button" className={`th-card${on ? " is-on" : ""}`} aria-pressed={on}
      style={{ "--best": mark ? `${Math.round((100 * mark.best) / mark.of)}%` : "0%" } as CSSProperties}
      onClick={() => onChoose(on ? "" : theme.id)}>
      <span className="th-card-text"><strong className="th-title">{theme.title}</strong><span className="th-line">{theme.line}</span>
        <span className="th-card-meta">{n.toLocaleString()} questions · <span className={mark ? "th-best" : "th-new"}>{mark ? `Best ${mark.best} of ${mark.of}` : "Not taken yet"}</span></span></span>
      {on ? <Check className="th-card-mark" size={16} strokeWidth={2} aria-hidden /> : <ArrowRight className="th-card-mark" size={15} strokeWidth={1.7} aria-hidden />}
      <span className="th-meter" aria-hidden><span /></span>
    </button>;
  })}</div>;
}
