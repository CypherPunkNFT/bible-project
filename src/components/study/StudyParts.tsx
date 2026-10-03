import { ArrowLeft, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { loadPlain } from "@/lib/data";
import { bookByNum, formatRange, plainLookup, splitId } from "@/lib/refs";
import { studyRefLink, type Span } from "@/lib/study";
import { useAsync } from "@/lib/useAsync";

export function StudyHeader({ eyebrow, title, lead, children, titleId }: { eyebrow: string; title: string; lead: ReactNode; children?: ReactNode; titleId?: string }) {
  return (
    <header className="pb-6 pt-8">
      <Link to="/study" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Study
      </Link>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      <h1 id={titleId} className="mt-1 max-w-3xl font-serif text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
      <div className="mt-3 max-w-2xl text-muted">{lead}</div>
      {children}
    </header>
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
        {count === total ? `${total.toLocaleString("en-US")} in all` : `${count.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`}
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

/** The KJV words of a passage, verse by verse (capped), for opened rows. */
export function PassageText({ span, max = 40 }: { span: Span; max?: number }) {
  const catalog = useCatalog();
  const a = splitId(span[0]);
  const b = splitId(span[1]);
  const code = bookByNum(catalog, a.num)?.code ?? "GEN";
  const plain = useAsync(() => loadPlain("kjv", code), `plain:kjv:${code}`);
  if (plain.status === "loading") return <p className="animate-pulse text-sm text-muted">Loading…</p>;
  if (plain.status === "error") return <p className="text-sm text-muted">The text could not be loaded.</p>;
  const lines: { label: string; text: string }[] = [];
  let truncated = false;
  for (let chapter = a.chapter; chapter <= b.chapter && !truncated; chapter++) {
    const from = chapter === a.chapter ? a.verse : 1;
    const to = chapter === b.chapter ? b.verse : 200;
    for (let verse = from; verse <= to; verse++) {
      if (lines.length >= max) {
        truncated = true;
        break;
      }
      const text = plainLookup(plain.value, chapter, verse);
      if (text === undefined) {
        if (chapter !== b.chapter) break;
        continue;
      }
      lines.push({ label: chapter === a.chapter && a.chapter === b.chapter ? String(verse) : `${chapter}:${verse}`, text: text.replace(/^¶\s*/, "") });
    }
  }
  return (
    <div className="font-serif text-[0.95rem] leading-relaxed">
      {lines.map((line) => (
        <span key={line.label}>
          <sup className="me-0.5 font-sans text-[0.65em] font-semibold text-muted">{line.label}</sup>
          {line.text}{" "}
        </span>
      ))}
      {truncated && (
        <span className="font-sans text-xs text-muted">
          … <RefLink span={span} label="read on" />
        </span>
      )}
    </div>
  );
}
