// How to play, Statistics and Settings (design §9.2, §9.4, §9.5), each a native <dialog>: Escape closes it, focus moves
// into it and goes back to the button that opened it.
import { X } from "lucide-react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { formatDate, formatNumber } from "@/lib/site-format";
import { siteLanguage } from "@/lib/language";
import { SOURCE_LANGUAGE } from "@/lib/site-languages";
import { markLabel } from "./text";
import { MAX_TRIES, type Mark } from "./evaluate";
import { currentStreak, type RecentDay, type WordleRecord } from "./storage";

export type PanelName = "help" | "stats" | "settings";

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (element && typeof element.showModal === "function") element.showModal();
    else element?.setAttribute("open", ""); // browsers (and test pages) without showModal
    return () => { opener?.focus(); };
  }, []);
  return <dialog ref={dialog} className="bw-panel" aria-label={title} onClose={onClose} onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <div className="bw-panel-body">
      <header>
        <h2>{title}</h2>
        <button type="button" className="bw-icon" onClick={onClose} aria-label="Close"><X size={18} aria-hidden="true" /></button>
      </header>
      {children}
    </div>
  </dialog>;
}

function ExampleRow({ word, at, mark }: { word: string; at: number; mark: Mark }) {
  return <div className="bw-row bw-example" role="img" aria-label={markLabel(word[at], mark)}>
    {[...word].map((letter, i) => <span key={i} className={`bw-tile${i === at ? ` bw-${mark}` : " bw-filled"}`} aria-hidden="true">{letter.toUpperCase()}</span>)}
  </div>;
}

export function HelpPanel({ onClose }: { onClose: () => void }) {
  return <Panel title="How to play" onClose={onClose}>
    <p>Guess the Bible word in six tries. Each guess must be a real five-letter word, and a word the game does not know doesn't use up a try.</p>
    <ExampleRow word="faith" at={0} mark="correct" />
    <p>F is in the word and in the right spot.</p>
    <ExampleRow word="grace" at={2} mark="present" />
    <p>A is in the word but in another spot.</p>
    <ExampleRow word="bread" at={4} mark="absent" />
    <p>D is not in the word at all.</p>
    <p>Every answer is a word or name from the Bible. When you finish, you'll see a verse where it appears.</p>
    <p>A new puzzle every day at midnight.</p>
    {siteLanguage() !== SOURCE_LANGUAGE.code && <p>The words in this puzzle are English.</p>}
  </Panel>;
}

interface StatsProps { record: WordleRecord; available: boolean; todayN: number; wonTries: number | null; dateOf?: (n: number) => Date; onClose: () => void }

/** The last seven days as squares: green for a win, grey for a loss, empty for a day with no record. */
function RecentDays({ recent, todayN, dateOf }: { recent: readonly RecentDay[]; todayN: number; dateOf?: (n: number) => Date }) {
  const byN = new Map(recent.map((day) => [day.n, day.won]));
  const days = Array.from({ length: 7 }, (_, i) => todayN - 6 + i).filter((n) => n >= 1);
  return <ol className="bw-days" aria-label="Last seven days">
    {days.map((n) => {
      const won = byN.get(n);
      return <li key={n} className={`bw-day${won === undefined ? "" : won ? " bw-correct" : " bw-absent"}`}>
        {dateOf && <span aria-hidden="true">{formatDate(dateOf(n), { weekday: "narrow" })}</span>}
        <span className="sr-only">{won === undefined ? "Not played" : won ? "Solved" : "Missed"}</span>
      </li>;
    })}
  </ol>;
}

export function StatsPanel({ record, available, todayN, wonTries, dateOf, onClose }: StatsProps) {
  const percent = record.played ? Math.round((record.won / record.played) * 100) : 0;
  const most = Math.max(1, ...record.dist);
  return <Panel title="Statistics" onClose={onClose}>
    <StatFigures record={record} percent={percent} streak={currentStreak(record, todayN)} />
    <h3 className="bw-subhead">Last seven days</h3>
    <RecentDays recent={record.recent} todayN={todayN} dateOf={dateOf} />
    <h3 className="bw-subhead">Guess distribution</h3>
    <ol className="bw-dist">
      {record.dist.slice(0, MAX_TRIES).map((wins, i) => <li key={i} className={wonTries === i + 1 ? "bw-today" : undefined}>
        <span>{formatNumber(i + 1)}</span>
        <span className="bw-bar" style={{ width: `${Math.max(10, (wins / most) * 100)}%`, "--kit-i": i } as CSSProperties}><span>{formatNumber(wins)}</span></span>
      </li>)}
    </ol>
    {!available && <p className="bw-note">Your stats can't be saved in this browser.</p>}
  </Panel>;
}

export function StatFigures({ record, percent, streak }: { record: WordleRecord; percent: number; streak: number }) {
  return <dl className="bw-figures">
    <div><dt>Played</dt><dd>{formatNumber(record.played)}</dd></div>
    <div><dt>Win %</dt><dd>{formatNumber(percent)}</dd></div>
    <div><dt>Current streak</dt><dd>{formatNumber(streak)}</dd></div>
    <div><dt>Best streak</dt><dd>{formatNumber(record.bestStreak)}</dd></div>
  </dl>;
}

interface SettingsProps { hard: boolean; hardLocked: boolean; contrast: boolean; onHard: (on: boolean) => void; onContrast: (on: boolean) => void; onClose: () => void }

export function SettingsPanel({ hard, hardLocked, contrast, onHard, onContrast, onClose }: SettingsProps) {
  return <Panel title="Settings" onClose={onClose}>
    <label className="bw-switch">
      <span><strong>Hard mode</strong><small>Letters you have found must be used in every later guess.</small>
        {hardLocked && <small>Hard mode can only be changed before today's first guess.</small>}</span>
      <input type="checkbox" role="switch" checked={hard} disabled={hardLocked} onChange={(event) => onHard(event.target.checked)} />
    </label>
    <label className="bw-switch">
      <span><strong>High-contrast colours</strong><small>Orange for the right spot and blue for the wrong spot, for colour-blind players.</small></span>
      <input type="checkbox" role="switch" checked={contrast} onChange={(event) => onContrast(event.target.checked)} />
    </label>
  </Panel>;
}
