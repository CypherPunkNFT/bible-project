// 01 Choose a theme, in three levels (owner, 2026-10-22: "when we click it, below it, a secondary number of rows, not
// that it gets replaced… subcategories and subcategories"). The four shelves sit in one row of cards that glow when
// pointed at; choosing one opens a tray under it with that shelf's groups (patriarchs, rulers, prophets, women of
// faith…), and choosing a group adds a row of its tests, each with its number of questions and the reader's best score
// so far. The shelf and group of the chosen test open on their own.
import {
  ArrowRight, BookMarked, Castle, Check, Crown, Cross, Fish, Flame, Flower2, Footprints, HandHeart, Hash, Hourglass, Landmark,
  Library, MessageCircle, Music, Scale, ScrollText, Shield, Ship, Sparkles, Sprout, Sun, Tent, Users, Waves, type LucideIcon,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { TestRecord } from "./record";
import { MIN_THEME, SHELVES, type Group, type Shelf, type Theme } from "./themes";

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
  return <div className="th" style={{ "--open": shelves.findIndex(({ shelf }) => shelf.id === open.shelf) } as CSSProperties}>
    <div className="th-supers">
      {shelves.map(({ shelf, groups }, i) => {
        const Icon = iconOf(shelf.id), on = shelf.id === open.shelf;
        const tests = groups.reduce((sum, { themes }) => sum + themes.length, 0);
        const chosen = groups.some(({ themes }) => themes.some(({ theme }) => theme.id === selected));
        return <button key={shelf.id} type="button" className={`th-super${on ? " is-open" : ""}`} aria-expanded={on} style={toneOf(shelf.tone)}
          onClick={() => setOpen({ shelf: on ? "" : shelf.id, group: "" })}>
          <span className="th-super-top"><span className="th-super-icon"><Icon size={22} strokeWidth={1.5} aria-hidden /></span>
            <span>{chosen && <Check size={12} strokeWidth={2.2} aria-label="Your chosen test is here" />}{String(i + 1).padStart(2, "0")}</span></span>
          <strong>{shelf.title}</strong>
          <span className="th-super-line">{shelf.line}</span>
          <span className="th-super-meta">{plural(groups.length, "group")} · {plural(tests, "test")}</span>
        </button>;
      })}
    </div>
    {openShelf && <div className="th-tray" key={openShelf.shelf.id} style={toneOf(openShelf.shelf.tone)}>
      <GroupRow groups={openShelf.groups} open={open.group} selected={selected} onOpen={(group) => setOpen({ ...open, group: group === open.group ? "" : group })} />
      {openGroup && <TestRow key={openGroup.group.id} shelf={openShelf.shelf} group={openGroup.group} themes={openGroup.themes} selected={selected} onChoose={onChoose} record={record} />}
    </div>}
  </div>;
}

/** The second row: an open shelf's groups. */
function GroupRow({ groups, open, selected, onOpen }: { groups: { group: Group; themes: Counted[] }[]; open: string; selected: string; onOpen: (id: string) => void }) {
  return <div className="th-groups">{groups.map(({ group, themes }) => {
    const Icon = iconOf(group.id), on = group.id === open, chosen = themes.some(({ theme }) => theme.id === selected);
    return <button key={group.id} type="button" className={`th-group${on ? " is-open" : ""}`} aria-expanded={on} onClick={() => onOpen(group.id)}>
      <Icon size={18} strokeWidth={1.6} aria-hidden />
      <span><strong>{group.title}</strong><small>{chosen ? "Your test is here" : plural(themes.length, "test")}</small></span>
    </button>;
  })}</div>;
}

interface TestRowProps { shelf: Shelf; group: Group; themes: Counted[]; selected: string; onChoose: (id: string) => void; record: TestRecord }

/** The third row: an open group's tests. */
function TestRow({ shelf, group, themes, selected, onChoose, record }: TestRowProps) {
  return <div className="th-tests">
    <p className="th-tests-head"><span>{shelf.title}</span><span aria-hidden>/</span><strong>{group.title}</strong><span>{group.line}</span></p>
    <div className="th-cards">{themes.map(({ theme, n }) => {
      const on = theme.id === selected, mark = record[theme.id];
      return <button key={theme.id} type="button" className={`th-card${on ? " is-on" : ""}`} aria-pressed={on}
        style={{ "--best": mark ? `${Math.round((100 * mark.best) / mark.of)}%` : "0%" } as CSSProperties}
        onClick={() => onChoose(on ? "" : theme.id)}>
        <span className="th-card-text"><strong className="th-title">{theme.title}</strong><span className="th-line">{theme.line}</span>
          <span className="th-card-meta">{n.toLocaleString()} questions · <span className={mark ? "th-best" : "th-new"}>{mark ? `Best ${mark.best} of ${mark.of}` : "Not taken yet"}</span></span></span>
        {on ? <Check className="th-card-mark" size={16} strokeWidth={2} aria-hidden /> : <ArrowRight className="th-card-mark" size={15} strokeWidth={1.7} aria-hidden />}
        <span className="th-meter" aria-hidden><span /></span>
      </button>;
    })}</div>
  </div>;
}
