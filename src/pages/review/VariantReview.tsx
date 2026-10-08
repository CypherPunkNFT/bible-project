import { ArrowUpRight, Check, PenLine, X } from "lucide-react";
import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { ShotViewer, type Opened } from "./ShotViewer";
import {
  postDecision, STATUS_WORDS, variantStatus, viewHashes, VIEWS,
  type CheckResult, type Decision, type ShotManifest, type Template, type Variant, type ViewKey,
} from "./review-data";

type Width = "all" | "desktop" | "phone";
type Theme = "all" | "light" | "dark";
const WIDTHS: { id: Width; label: string }[] = [{ id: "all", label: "Both widths" }, { id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }];
const THEMES: { id: Theme; label: string }[] = [{ id: "all", label: "Both themes" }, { id: "light", label: "Light" }, { id: "dark", label: "Dark" }];

const viewsFor = (width: Width, theme: Theme): ViewKey[] => VIEWS.filter((v) => (width === "all" || v.width === width) && (theme === "all" || v.theme === theme)).map((v) => v.key);
const scopeWords = (d: Pick<Decision, "viewport" | "theme">) =>
  d.viewport === "all" && d.theme === "all" ? "all views" : [d.viewport === "all" ? "" : d.viewport, d.theme === "all" ? "" : d.theme].filter(Boolean).join(", ");
/** The sample's reason without its rule name, which the label already says ("longest name: …" → "…"). */
const shortWhy = (why: string) => why.replace(/^[^:"]{1,60}:\s*/, "");
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** The machine checks for one design, in words: "Checked on 112 of 112 pages: no problems" or the problems found. */
function CheckLine({ result, names }: { result?: CheckResult; names: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!result || !result.checked) return <p className="review-checks" data-state="none">Machine checks: not run on these pages yet.</p>;
  const failing = names.filter((n) => result.failed[n.id]);
  const coverage = result.checked >= result.instances ? `all ${formatNumber(result.instances)}` : `${formatNumber(result.checked)} of ${formatNumber(result.instances)}`;
  if (!failing.length) return <p className="review-checks" data-state="pass"><Check size={14} aria-hidden />Checked on {coverage} pages{result.coverage ? ` (${result.coverage})` : ""}: {names.map((n) => n.name.toLowerCase()).join(", ")}: no problems.</p>;
  return (
    <div className="review-checks" data-state="fail">
      <p><X size={14} aria-hidden />Checked on {coverage} pages{result.coverage ? ` (${result.coverage})` : ""}. Problems: {failing.map((n) => `${n.name.toLowerCase()} on ${formatNumber(result.failed[n.id])} ${result.failed[n.id] === 1 ? "page" : "pages"}`).join("; ")}.</p>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide the list" : `Show which pages (${result.failures.length}${result.failures.length >= 50 ? "+" : ""})`}</button>
      {open && <ul>{result.failures.map((f, i) => <li key={i}><a href={f.url} target="_blank" rel="noreferrer">{f.url}</a> <span>{f.width < 600 ? "phone" : "desktop"} · {names.find((n) => n.id === f.check)?.name ?? f.check}: {f.detail}</span></li>)}</ul>}
    </div>
  );
}

function Segments<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return <div className="review-segments" role="radiogroup" aria-label={label}>{options.map((o) => <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>)}</div>;
}

interface Props {
  template: Template;
  variant: Variant;
  shots: ShotManifest | null;
  result?: CheckResult;
  checkNames: { id: string; name: string }[];
  decisions: Decision[];
  onChanged: () => Promise<void>;
}

/** One design (a variant of a page type): its screenshots, machine checks, decision controls and decision history. */
export function VariantReview({ template, variant, shots, result, checkNames, decisions, onChanged }: Props) {
  const { status, views } = variantStatus(decisions, shots, template, variant);
  const [width, setWidth] = useState<Width>("all");
  const [theme, setTheme] = useState<Theme>("all");
  const [writing, setWriting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [opened, setOpened] = useState<Opened | null>(null);
  const history = decisions.filter((d) => d.template === template.id && d.variant === variant.id).sort((a, b) => b.at.localeCompare(a.at));
  const why = Object.values(views).find((v) => v.why)?.why;

  const record = async (decision: "accepted" | "needs-changes") => {
    setBusy(true);
    setMessage("");
    const answer = await postDecision("decision", {
      template: template.id, variant: variant.id, viewport: width, theme, status: decision, note: decision === "needs-changes" ? note : note.trim(),
      sourceHash: template.sourceHash, shotHashes: viewHashes(shots, template, variant, viewsFor(width, theme)), label: `${template.name} · ${variant.name}`,
    });
    setBusy(false);
    if (answer.error) { setMessage(answer.error); return; }
    setMessage(answer.warning ? `Saved. ${answer.warning}` : decision === "accepted" ? "Accepted and saved." : "Saved: this design needs changes.");
    setWriting(false);
    setNote("");
    await onChanged();
  };
  const remove = async (id: string) => {
    setBusy(true);
    const answer = await postDecision("undo", { id });
    setBusy(false);
    setRemoving(null);
    setMessage(answer.error ?? (answer.warning ? `Removed. ${answer.warning}` : "Decision removed."));
    await onChanged();
  };

  return (
    <section className="review-variant" data-status={status} aria-label={`${template.name}: ${variant.name}`}>
      <header>
        <h4>{variant.name}</h4>
        <span className="review-status" data-status={status}>{STATUS_WORDS[status]}</span>
        <span className="review-variant-count">{formatNumber(variant.instances)} {variant.instances === 1 ? "page" : "pages"}</span>
        <p>{variant.what}{why ? <em> Needs another look: {why}.</em> : null}</p>
        <ul className="review-view-states" aria-label="Each view">
          {VIEWS.map((v) => <li key={v.key} data-status={views[v.key].status}>{v.label}: {STATUS_WORDS[views[v.key].status]}</li>)}
        </ul>
      </header>

      <div className="review-samples">
        {variant.samples.map((sample) => {
          const images = shots?.images[`${template.id}/${variant.id}/${sample.id}`];
          return (
            <figure key={sample.id} className="review-sample">
              <figcaption><strong>{sample.label}</strong><span>{shortWhy(sample.why)}</span><a href={sample.url} target="_blank" rel="noreferrer">Open the real page<ArrowUpRight size={13} aria-hidden /></a></figcaption>
              <div className="review-thumbs">
                {VIEWS.map((v) => {
                  const shot = images?.[v.key];
                  return shot
                    ? <button key={v.key} type="button" className="review-thumb" data-width={v.width} onClick={() => setOpened({ template, variant, sample, view: v.key })} aria-label={`Enlarge ${sample.label}, ${v.label}`}>
                        <img src={`/review-data/shots/${shot.thumb}`} alt="" loading="lazy" decoding="async" /><span>{v.label}</span>
                      </button>
                    : <div key={v.key} className="review-thumb review-thumb-missing" data-width={v.width}><span>{v.label}: no screenshot yet</span></div>;
                })}
              </div>
            </figure>
          );
        })}
      </div>

      <CheckLine result={result} names={checkNames} />

      <div className="review-decide">
        <div className="review-decide-scope">
          <span>Applies to</span>
          <Segments value={width} options={WIDTHS} onChange={setWidth} label="Which widths" />
          <Segments value={theme} options={THEMES} onChange={setTheme} label="Which themes" />
        </div>
        <div className="review-decide-actions">
          <button type="button" className="review-accept" disabled={busy} onClick={() => void record("accepted")}><Check size={15} aria-hidden />Accept</button>
          <button type="button" className="review-change" disabled={busy} aria-expanded={writing} onClick={() => setWriting(!writing)}><PenLine size={15} aria-hidden />Needs changes</button>
        </div>
        {writing && (
          <div className="review-note">
            <label htmlFor={`note-${template.id}-${variant.id}`}>What is wrong, in your words</label>
            <textarea id={`note-${template.id}-${variant.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="For example: the name runs into the dates on a phone" />
            <button type="button" disabled={busy || !note.trim()} onClick={() => void record("needs-changes")}>Save the note</button>
          </div>
        )}
        {message && <p className="review-message" role="status">{message}</p>}
      </div>

      {history.length > 0 && (
        <details className="review-history">
          <summary>Decision history ({history.length})</summary>
          <ol>
            {history.map((d) => (
              <li key={d.id} data-status={d.status}>
                <span>{when(d.at)} · {d.status === "accepted" ? "Accepted" : "Needs changes"} · {scopeWords(d)}{d.commit ? ` · code ${d.commit}` : ""}</span>
                {d.note && <q>{d.note}</q>}
                {removing === d.id
                  ? <span className="review-confirm">Remove this decision? <button type="button" disabled={busy} onClick={() => void remove(d.id)}>Yes, remove</button><button type="button" onClick={() => setRemoving(null)}>Keep it</button></span>
                  : <button type="button" className="review-remove" onClick={() => setRemoving(d.id)}>Remove</button>}
              </li>
            ))}
          </ol>
        </details>
      )}
      {opened && <ShotViewer opened={opened} shots={shots} onClose={() => setOpened(null)} onMove={setOpened} />}
    </section>
  );
}
