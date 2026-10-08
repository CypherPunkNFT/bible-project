import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils";
import { VariantReview } from "./VariantReview";
import {
  loadReviewFile, variantStatus,
  type CheckFile, type CheckResult, type DecisionFile, type Inventory, type ShotManifest, type Status, type Template,
} from "./review-data";
import "./review.css";

const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

type Filter = "all" | Status;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Everything" },
  { id: "not-reviewed", label: "Waiting" },
  { id: "needs-changes", label: "Needs changes" },
  { id: "changed", label: "Changed" },
  { id: "accepted", label: "Accepted" },
];

interface Board { inventory: Inventory; shots: ShotManifest | null; checks: CheckFile | null; decisions: DecisionFile }

/** Keep the board out of search engines (it is never deployed with data, but the address exists in the app). */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const title = document.title;
    document.title = "Design review · Bible Project";
    return () => { meta.remove(); document.title = title; };
  }, []);
}

const when = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "not yet");

/** The design review board (/review): every page type on the site, its variants, screenshots, machine checks and the
 *  owner's decisions. Local preview only — on the live site there is no data, so the address shows "not found". */
export default function DesignReviewPage() {
  useNoIndex();
  const [board, setBoard] = useState<Board | null | "missing">(null);
  const [filter, setFilter] = useState<Filter>("all");

  const reload = useCallback(async () => {
    try {
      const [inventory, shots, checks, decisions] = await Promise.all([
        loadReviewFile<Inventory>("templates.json"), loadReviewFile<ShotManifest>("shots.json"),
        loadReviewFile<CheckFile>("checks.json"), loadReviewFile<DecisionFile>("decisions.json"),
      ]);
      setBoard(inventory ? { inventory, shots, checks, decisions: decisions ?? { schema: 1, note: "", decisions: [] } } : "missing");
    } catch (error) {
      console.error("design review: could not load the board's data", error);
      setBoard("missing");
    }
  }, []);
  useEffect(() => { void reload(); }, [reload]);

  const statuses = useMemo(() => {
    if (!board || board === "missing") return new Map<string, Status>();
    const map = new Map<string, Status>();
    for (const t of board.inventory.templates) for (const v of t.variants) map.set(`${t.id}/${v.id}`, variantStatus(board.decisions.decisions, board.shots, t, v).status);
    return map;
  }, [board]);

  if (board === "missing") return <Suspense fallback={null}><NotFoundPage /></Suspense>;
  if (!board) return <div className="review mx-auto max-w-7xl px-4 sm:px-6"><div className="review-loading" role="status">Loading the review board…</div></div>;

  const { inventory, shots, checks, decisions } = board;
  const counts = { "not-reviewed": 0, accepted: 0, "needs-changes": 0, changed: 0 } as Record<Status, number>;
  for (const status of statuses.values()) counts[status]++;
  const resultOf = (t: Template, variant: string) => checks?.results.find((r) => r.template === t.id && r.variant === variant);
  const checkedPages = checks?.results.reduce((n, r) => n + r.checked, 0) ?? 0;
  const failingPages = checks ? new Set(checks.results.flatMap((r) => r.failures.map((f) => f.url))).size : 0;
  const shown = (t: Template) => t.variants.filter((v) => filter === "all" || statuses.get(`${t.id}/${v.id}`) === filter);

  return (
    <div className="review mx-auto max-w-7xl px-4 sm:px-6">
      <header className="review-intro">
        <p className="review-kicker">Design review · local preview only</p>
        <h1>Every kind of page, once.</h1>
        <p className="review-lead">
          {inventory.templates.length} page types, {statuses.size} designs to look at. Each one shows the same page on a computer and a
          phone, light and dark, for a typical record and the records most likely to break it. Accept it, or say what should change.
        </p>
        <dl className="review-summary">
          <div data-status="accepted"><dt>Accepted</dt><dd>{counts.accepted}</dd></div>
          <div data-status="not-reviewed"><dt>Waiting for you</dt><dd>{counts["not-reviewed"]}</dd></div>
          <div data-status="needs-changes"><dt>Needs changes</dt><dd>{counts["needs-changes"]}</dd></div>
          <div data-status="changed"><dt>Changed since accepted</dt><dd>{counts.changed}</dd></div>
        </dl>
        <p className="review-meta">
          Screenshots taken {when(shots?.takenAt)}{shots ? ` (code version ${shots.commit})` : ""} · Machine checks {checks ? `${checks.finishedAt ? "finished" : "running, started"} ${when(checks.finishedAt ?? checks.startedAt)}: ${formatNumber(checkedPages)} pages checked, ${formatNumber(failingPages)} with a problem` : "not run yet"}
        </p>
      </header>

      <nav className="review-bar" aria-label="Show">
        <div className="review-filters" role="tablist">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}{f.id !== "all" && <span>{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <div className="review-areas">
          {inventory.areas.filter((a) => inventory.templates.some((t) => t.area === a.id && shown(t).length)).map((a) => <a key={a.id} href={`#area-${a.id}`}>{a.title}</a>)}
        </div>
      </nav>

      {inventory.areas.map((area) => {
        const templates = inventory.templates.filter((t) => t.area === area.id && shown(t).length);
        if (!templates.length) return null;
        return (
          <section key={area.id} id={`area-${area.id}`} className="review-area" aria-labelledby={`area-title-${area.id}`}>
            <h2 id={`area-title-${area.id}`}>{area.title}<small>{templates.length} page {templates.length === 1 ? "type" : "types"}</small></h2>
            {templates.map((t) => (
              <article key={t.id} id={`t-${t.id}`} className="review-template">
                <header>
                  <h3>{t.name}</h3>
                  <p className="review-template-count">{formatNumber(t.instances)} {t.instances === 1 ? "page" : "pages"} · {t.variants.length} {t.variants.length === 1 ? "design" : "designs"}</p>
                  <p className="review-template-what">{t.what}</p>
                  <p className="review-template-address">Address: <code>{t.address}</code></p>
                </header>
                {shown(t).map((v) => (
                  <VariantReview key={v.id} template={t} variant={v} shots={shots} result={resultOf(t, v.id) as CheckResult | undefined}
                    checkNames={checks?.checks ?? []} decisions={decisions.decisions} onChanged={reload} />
                ))}
              </article>
            ))}
          </section>
        );
      })}
      <p className="review-foot">Made from the site's own route table and data on {when(inventory.generatedAt)} (code version {inventory.commit}). Decisions are saved to the project and every chat reads them before changing a page type.</p>
    </div>
  );
}
