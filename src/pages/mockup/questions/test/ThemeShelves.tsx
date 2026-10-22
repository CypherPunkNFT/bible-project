// 01 Choose a theme: the themed tests on four shelves (lives, stories, teaching, knowing the Bible), each card with
// its number of questions and the reader's best score so far.
import type { CSSProperties } from "react";
import type { TestRecord } from "./record";
import { MIN_THEME, SHELVES } from "./themes";

interface Props { counts: Map<string, number>; selected: string; onChoose: (id: string) => void; record: TestRecord }

export function ThemeShelves({ counts, selected, onChoose, record }: Props) {
  return <div className="th">
    {SHELVES.map((shelf) => {
      const themes = shelf.themes.map((theme) => ({ theme, n: counts.get(theme.id) ?? 0 })).filter(({ n }) => n >= MIN_THEME);
      if (!themes.length) return null;
      return <div className="th-shelf" key={shelf.id}>
        <div className="th-shelf-head"><h3>{shelf.title}</h3><p>{shelf.line}</p><span>{themes.length} tests</span></div>
        <div className="th-cards">{themes.map(({ theme, n }) => {
          const on = theme.id === selected, mark = record[theme.id];
          return <button key={theme.id} type="button" className={`th-card${on ? " is-on" : ""}`} aria-pressed={on}
            style={{ "--tone": `var(--${theme.tone})`, "--best": mark ? `${Math.round((100 * mark.best) / mark.of)}%` : "0%" } as CSSProperties}
            onClick={() => onChoose(on ? "" : theme.id)}>
            <span className="th-card-top"><span>{n.toLocaleString()} questions</span>
              <span className={mark ? "th-best" : "th-new"}>{mark ? `Best ${mark.best} of ${mark.of}` : "Not taken yet"}</span></span>
            <strong className="th-title">{theme.title}</strong>
            <span className="th-line">{theme.line}</span>
            <span className="th-meter" aria-hidden><span /></span>
          </button>;
        })}</div>
      </div>;
    })}
  </div>;
}
