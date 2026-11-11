import { BOOK_SECTIONS, ListChoice, listFacets } from "./ListRail.shared";
// questions_mockup 03's side rail (owner, 2026-10-23: the whole list should reflect the themes): two categories that
// open like drawers. "By the book": Law, History, Poetry & wisdom, Prophets, Gospels & Acts, Epistles and Revelation,
// each opening to its books. "By theme": the test page's four shelves (Lives, Stories, Teaching, Know your Bible), each
// opening to its groups and themes. One book and one theme can be chosen together; every count is what choosing it
// would give with the other choices kept. "By difficulty" (Easy, Medium, Hard) joins them the same way (owner,
// 2026-10-24). The multiple-choice switch stays; the collection list went (owner, 2026-10-23). The topic list and
// the Testament switch of FilterRail.tsx are not used here (the book drawers cover both Testaments).
import PillScroll from "@/components/apologetics/PillScroll";
import type { BankBook, QuestionBank } from "@/lib/data";
import { formatNumber } from "@/lib/site-format";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { RailGroup, Switch } from "./FilterRail";
import { DIFFICULTIES, type Filters } from "./model";
import { MIN_THEME, SHELVES } from "./test/themes";

type Facets = ReturnType<typeof listFacets>;

interface Props {
  bank: QuestionBank;
  facets: Facets;
  filters: Filters;
  choice: ListChoice;
  members: Map<string, Set<number>>;
  update: (patch: Partial<Filters>) => void;
  choose: (patch: Partial<ListChoice>) => void;
}

export function ListRail({ bank, facets, filters, choice, members, update, choose }: Props) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOpen((now) => { const next = new Set(now); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const span = (from: string, to: string) => bank.books.slice(bank.books.findIndex((b) => b.code === from), bank.books.findIndex((b) => b.code === to) + 1);
  // A book or theme chosen elsewhere on the page (01, 02 or the address) opens its own drawer, so the choice shows.
  useEffect(() => {
    const section = BOOK_SECTIONS.find((s) => span(s.from, s.to).some((b) => b.code === choice.book));
    const shelf = SHELVES.find((sh) => sh.groups.some((g) => g.themes.some((t) => t.id === choice.theme)));
    const ids = [section && `b-${section.label}`, shelf && `t-${shelf.id}`].filter((id): id is string => Boolean(id));
    if (ids.length) setOpen((now) => new Set([...now, ...ids]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `span` only reads the bank's books
  }, [choice.book, choice.theme]);
  // The rail scrolls with the same gold pill outside its edge as the list beside it (owner, 2026-10-23: no box, no arrows).
  return <aside className="qx-rail-wrap"><PillScroll className="qp-rail qx-rail" label="Filters">
    <RailGroup title="By the book">{BOOK_SECTIONS.map((s) => {
      const books = span(s.from, s.to), codes = new Set(books.map((b) => b.code));
      const n = facets.anyBook.reduce((sum, i) => sum + (bank.questions[i].books.some((c) => codes.has(c)) ? 1 : 0), 0);
      const hasChoice = codes.has(choice.book);
      // A section of one book (Revelation) is chosen straight from its row, not opened (owner, 2026-10-23).
      if (books.length === 1) return <div key={s.label} className={`qx-drawer is-single${hasChoice ? " has-choice" : ""}`} style={{ "--tone": `var(--${books[0].section})` } as CSSProperties}>
        <button type="button" className="qx-drawer-head" aria-pressed={hasChoice} aria-label={hasChoice ? `${s.label}, chosen: remove` : undefined} onClick={() => choose({ book: hasChoice ? "" : books[0].code })}>
          <span className="qx-drawer-dot" aria-hidden /><span>{s.label}</span><small>{formatNumber(n)}</small>
          <span className="qx-drawer-chev" aria-hidden>{hasChoice && <X size={15} strokeWidth={1.9} />}</span>
        </button>
      </div>;
      return <Drawer key={s.label} id={`b-${s.label}`} title={s.label} tone={`var(--${books[0]?.section})`} count={n} open={open.has(`b-${s.label}`)} chosen={hasChoice} toggle={toggle}>
        <ChoiceList items={books.map((b: BankBook) => ({ id: b.code, title: b.name, n: facets.bookCount.get(b.code) ?? 0 }))} selected={choice.book} onChoose={(book) => choose({ book })} />
      </Drawer>;
    })}</RailGroup>
    <RailGroup title="By theme">{SHELVES.map((shelf) => {
      const ids = shelf.groups.flatMap((g) => g.themes.map((t) => t.id)).filter((id) => (members.get(id)?.size ?? 0) >= MIN_THEME);
      const n = facets.anyTheme.reduce((sum, i) => sum + (ids.some((id) => members.get(id)?.has(i)) ? 1 : 0), 0);
      const hasChoice = ids.includes(choice.theme);
      return <Drawer key={shelf.id} id={`t-${shelf.id}`} title={shelf.title} tone={`var(--${shelf.tone})`} count={n} open={open.has(`t-${shelf.id}`)} chosen={hasChoice} toggle={toggle}>
        {shelf.groups.map((g) => {
          const items = g.themes.filter((t) => ids.includes(t.id)).map((t) => ({ id: t.id, title: t.title, n: facets.themeCount.get(t.id) ?? 0 }));
          return items.length ? <div key={g.id} className="qx-drawer-group"><p>{g.title}</p><ChoiceList items={items} selected={choice.theme} onChoose={(theme) => choose({ theme })} /></div> : null;
        })}
      </Drawer>;
    })}</RailGroup>
    {/* How hard, chosen with a book and a theme like the rest (owner, 2026-10-24); the Study page's bar links here. */}
    <RailGroup title="By difficulty">
      <ChoiceList items={DIFFICULTIES.map(([id, title]) => ({ id, title, n: facets.difficultyCount.get(id) ?? 0 }))} selected={filters.difficulty} onChoose={(difficulty) => update({ difficulty })} />
    </RailGroup>
    <RailGroup title="Show">
      <Switch on={filters.choices} onChange={(choices) => update({ choices })}>Multiple choice only</Switch>
    </RailGroup>
  </PillScroll></aside>;
}

interface DrawerProps { id: string; title: string; tone: string; count: number; open: boolean; chosen: boolean; toggle: (id: string) => void; children: ReactNode }

function Drawer({ id, title, tone, count, open, chosen, toggle, children }: DrawerProps) {
  return <div className={`qx-drawer${open ? " is-open" : ""}${chosen ? " has-choice" : ""}`} style={{ "--tone": tone } as CSSProperties}>
    <button type="button" className="qx-drawer-head" aria-expanded={open} onClick={() => toggle(id)}>
      <span className="qx-drawer-dot" aria-hidden /><span>{title}</span><small>{formatNumber(count)}</small>
      <ChevronDown className="qx-drawer-chev" size={15} strokeWidth={1.7} aria-hidden />
    </button>
    {open && <div className="qx-drawer-body">{children}</div>}
  </div>;
}

function ChoiceList({ items, selected, onChoose }: { items: { id: string; title: string; n: number }[]; selected: string; onChoose: (id: string) => void }) {
  return <ul className="qp-topics qx-choices">{items.filter((t) => t.n || t.id === selected).map((t) => {
    const on = t.id === selected;
    return <li key={t.id}><button type="button" aria-pressed={on} aria-label={on ? `${t.title}, chosen: remove` : undefined} onClick={() => onChoose(on ? "" : t.id)}>
      <span>{t.title}</span><small>{formatNumber(t.n)}</small>
      {on && <span className="qp-topic-x" aria-hidden><X size={11} strokeWidth={2.6} /></span>}
    </button></li>;
  })}</ul>;
}
