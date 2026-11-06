import { Verse } from "@/components/Verse";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { StudyContents } from "./StudyContents";
import { StudyBackLink } from "./StudyBackLink";
import { useCatalog } from "@/lib/catalog";
import { formatRange, splitId } from "@/lib/refs";
import { useVerses } from "@/lib/verses";
import { studyRefLink, type Span } from "@/lib/study";
import { formatNumber } from "@/lib/site-format";

/** `compact` (People & genealogies): a tighter header. */
export function StudyHeader({ eyebrow, title, lead, children, titleId, contents, compact = false }: { eyebrow: string; title: string; lead: ReactNode; children?: ReactNode; titleId?: string; contents?: ReactNode; compact?: boolean }) {
  return (
    <><header className={compact ? "pb-4 pt-5" : "pb-6 pt-8"}>
      <StudyBackLink />
      <p className={`${compact ? "mt-3" : "mt-4"} text-xs font-semibold uppercase tracking-[0.2em] text-accent`}>{eyebrow}</p>
      <h1 id={titleId} className="mt-1 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <div className="mt-3 max-w-2xl text-muted">{lead}</div>
      {children}
    </header>{contents ?? <StudyContents />}</>
  );
}

/** One search box for every study page; the count is announced to screen readers. */
export function StudySearch({ value, onChange, label, count, total }: { value: string; onChange: (value: string) => void; label: string; count: number; total: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="relative min-w-[14rem] flex-1 sm:max-w-md">
        <span className="sr-only">{label}</span>
        <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-muted" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={label}
          className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-3"
        />
      </label>
      <p className="text-sm text-muted" aria-live="polite">
        {count === total ? `${formatNumber(total)} in all` : `${formatNumber(count)} of ${formatNumber(total)}`}
      </p>
    </div>
  );
}

export function StudyCredits({ children }: { children: ReactNode }) {
  return <footer className="mt-12 border-t border-line pt-4 text-xs leading-relaxed text-muted">{children}</footer>;
}

/** A reference as a link into the reader (full book name). */
export function RefLink({ span, label, className }: { span: Span; label?: string; className?: string }) {
  const catalog = useCatalog();
  return (
    <Link to={studyRefLink(catalog, span)} aria-label={label ? `${label} (${formatRange(catalog, span[0], span[1])})` : undefined} className={className ?? "underline decoration-line underline-offset-2 hover:text-accent hover:decoration-current"}>
      {label ?? formatRange(catalog, span[0], span[1])}
    </Link>
  );
}

/** The words of a passage in the reader's Bible, verse by verse (capped), for opened rows. */
export function PassageText({ span, max = 40 }: { span: Span; max?: number }) {
  const state = useVerses({ from: span[0], to: span[1] }, { max });
  if (state.status === "loading") return <p className="animate-pulse text-sm text-muted">Loading…</p>;
  if (state.status === "error") return <p className="text-sm text-muted">The text could not be loaded.</p>;
  const { truncated } = state.value;
  const crossesChapters = splitId(span[0]).chapter !== splitId(span[1]).chapter;
  return (
    <div className="font-serif text-[0.95rem] leading-relaxed">
      <Verse from={span[0]} to={span[1]} max={max} numbered={crossesChapters ? "chapter" : true} />
      {truncated && (
        <span className="font-sans text-xs text-muted">
          {" "}<RefLink span={span} label="read on" />
        </span>
      )}
    </div>
  );
}
