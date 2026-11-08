// Personal countdowns (design 5.5, 6.3): the date form and the controls of a countdown whose date the visitor chooses.
// The date goes into the address as ?date= and nothing else; the optional name stays in this browser only.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Occasion } from "@/data/countdowns";
import { dateKey, parseDateKey } from "./calendar";
import { countdownPath } from "./message";
import { checkChosenDate, type Run } from "./season";
import { newMineId, putMine, removeMine } from "./storage";
import type { RunView } from "./useRun";

export function DateForm({ occasion, view, onDone }: { occasion: Occasion; view: RunView; onDone?: () => void }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(view.date ?? "");
  const [name, setName] = useState(view.mine?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const check = checkChosenDate(parseDateKey(date), view.todayN);
    if (!check.ok) { setError(check.reason); return; }
    const chosen = dateKey(check.target);
    view.progress.update((record) => putMine(record, { id: view.mine?.id ?? newMineId(), occasion: occasion.slug, date: chosen, name: name.trim() }));
    navigate(countdownPath(occasion.slug, undefined, chosen));
    onDone?.();
  };
  const reason = error ?? view.dateError;
  return (
    <form className="cd-date-form" onSubmit={submit} aria-label="Choose your date">
      <label><span>The date</span><input type="date" value={date} onChange={(changed) => setDate(changed.target.value)} required /></label>
      <label><span>A name for it (optional, kept only on this device)</span><input type="text" value={name} maxLength={60} onChange={(changed) => setName(changed.target.value)} /></label>
      {reason && <p className="cd-failed" role="alert">{reason}</p>}
      <button type="submit" className="cd-button cd-button-main">{view.mine ? "Save the new date" : "Start my countdown"}</button>
    </form>
  );
}

export function PersonalControls({ occasion, view, run }: { occasion: Occasion; view: RunView; run: Run }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [ended, setEnded] = useState(false);
  const stop = () => {
    if (view.mine) { const id = view.mine.id; view.progress.update((record) => removeMine(record, id)); }
    navigate(countdownPath(occasion.slug), { replace: true });
  };
  const late = run.entries.length > 0 && view.todayN > run.entries[0].n && view.state === "counting";
  return (
    <div className="cd-personal">
      {view.mine?.name && <p className="cd-kicker">{view.mine.name}</p>}
      {late && <p className="cd-quiet">You started partway through. The earlier days are here if you'd like them.</p>}
      {ended ? (
        <div className="cd-ended">
          {occasion.elsewhere?.map((item) => <p key={item.href}><Link to={item.href}>{item.title}</Link></p>)}
          <button type="button" className="cd-button" onClick={stop}>Remove this countdown</button>
        </div>
      ) : (
        <div className="cd-actions">
          <button type="button" className="cd-button" onClick={() => setEditing((value) => !value)}>Change the date</button>
          {occasion.finishLabel && <button type="button" className="cd-button" onClick={() => setEnded(true)}>{occasion.finishLabel}</button>}
          <button type="button" className="cd-button" onClick={stop}>Stop this countdown</button>
        </div>
      )}
      {editing && <DateForm occasion={occasion} view={view} onDone={() => setEditing(false)} />}
    </div>
  );
}
