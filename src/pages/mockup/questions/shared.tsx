// Small pieces shared by the questions page's sections.
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { BankQuestion } from "@/lib/data";

export function SectionHead({ n, id, title, lead }: { n: string; id: string; title: ReactNode; lead: string }) {
  return <div className="qp-section-head">
    <span className="qp-section-n" aria-hidden>{n}</span>
    <div><h2 id={id}>{title}</h2><p>{lead}</p></div>
  </div>;
}

/** The question's first reference, opened in the reader (Berean Standard Bible). */
export function ReadLink({ q, bookNames }: { q: BankQuestion; bookNames: Record<string, string> }) {
  if (!q.link) return null;
  const { book, chapter, verse } = q.link;
  return <Link className="qp-read" to={`/read/bsb/${book}/${chapter}${verse ? `?v=${verse}` : ""}`}>
    {bookNames[book]} {chapter}{verse ? `:${verse}` : ""}<ArrowUpRight size={13} strokeWidth={1.6} aria-hidden />
  </Link>;
}

/** The text with every search term marked. */
export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const pattern = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return <>{text.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}
