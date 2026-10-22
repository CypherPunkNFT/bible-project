// 01 Choose a theme (owner, 2026-10-22: "categorical cards that expand… the way we have with atlas"): the four shelves
// (lives, stories, teaching, knowing the Bible) as one hairline grid in the style of the homepage's "How the library is
// organised"; opening one shows its tests as compact cards, each with its number of questions and the reader's best
// score so far, and a way back to all four. The shelf with the chosen test opens on its own.
import { ArrowLeft, ArrowRight, Check, Library, ScrollText, Sparkles, Users, type LucideIcon } from "lucide-react";
import { useState, type CSSProperties } from "react";
import type { TestRecord } from "./record";
import { MIN_THEME, SHELVES, type Shelf } from "./themes";

interface Props { counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }

const ICONS: Record<string, LucideIcon> = { lives: Users, stories: ScrollText, teaching: Sparkles, know: Library };
const toneOf = (tone: string) => ({ "--tone": `var(--${tone})` }) as CSSProperties;

export function ThemeShelves({ counts, selected, onChoose, record }: Props) {
  const shelves = SHELVES.map((shelf) => ({ shelf, themes: shelf.themes.map((theme) => ({ theme, n: counts.get(theme.id) ?? 0 })).filter(({ n }) => n >= MIN_THEME) }))
    .filter(({ themes }) => themes.length);
  const [open, setOpen] = useState(() => SHELVES.find((s) => s.themes.some((t) => t.id === selected))?.id ?? "");
  const shown = shelves.find(({ shelf }) => shelf.id === open);
  if (!shown) return <ul className="th-shelves">{shelves.map(({ shelf, themes }, i) => {
    const Icon = ICONS[shelf.id] ?? Library;
    const questions = themes.reduce((sum, { n }) => sum + n, 0), taken = themes.filter(({ theme }) => record[theme.id]).length;
    const chosen = themes.find(({ theme }) => theme.id === selected)?.theme.title;
    return <li key={shelf.id} style={toneOf(shelf.tone)}>
      <button type="button" onClick={() => setOpen(shelf.id)}>
        <span className="th-shelf-top"><span className="th-shelf-icon"><Icon size={26} strokeWidth={1.4} aria-hidden /></span><span>{String(i + 1).padStart(2, "0")}</span></span>
        <strong>{shelf.title}</strong>
        <span className="th-shelf-line">{shelf.line}</span>
        <span className="th-shelf-meta">{themes.length} tests · {questions.toLocaleString()} questions{taken ? ` · ${taken} taken` : ""}</span>
        {chosen && <span className="th-shelf-chosen"><Check size={13} strokeWidth={2} aria-hidden />{chosen}</span>}
        <span className="th-shelf-open">Open the shelf <ArrowRight size={14} aria-hidden /></span>
      </button>
    </li>;
  })}</ul>;
  return <OpenShelf shelf={shown.shelf} themes={shown.themes} selected={selected} onChoose={onChoose} record={record} onBack={() => setOpen("")} />;
}

interface OpenProps { shelf: Shelf; themes: { theme: Shelf["themes"][number]; n: number }[]; selected: string; onChoose: (id: string) => void; record: TestRecord; onBack: () => void }

/** One shelf opened: a way back, its title, and its tests as compact cards. */
function OpenShelf({ shelf, themes, selected, onChoose, record, onBack }: OpenProps) {
  const Icon = ICONS[shelf.id] ?? Library;
  return <div className="th-open" style={toneOf(shelf.tone)}>
    <nav className="th-open-trail" aria-label="Shelves"><button type="button" onClick={onBack}><ArrowLeft size={15} strokeWidth={1.7} aria-hidden />All shelves</button>
      <span aria-hidden>/</span><span>{shelf.title}</span></nav>
    <div className="th-open-head"><Icon size={34} strokeWidth={1.3} aria-hidden />
      <div><h3>{shelf.title}</h3><p>{shelf.line} · {themes.length} tests</p></div></div>
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
