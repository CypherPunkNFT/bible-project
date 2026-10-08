// The frame every Resources section page shares: crumbs to the station and its sister sections, then the plain-type
// hero (kicker, title with the section's own line drawing, a lead and four small stats), as on the Teachers lists.
import { ArrowLeft } from "lucide-react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { StationStats } from "@/components/stations/Station";
import { StationArt } from "@/components/stations/StationArt";
import { RESOURCE_SECTIONS, sectionBySlug, sectionReady, type ResourceSection } from "./sections";
import "@/pages/teachers/teachers.css";
import "./resources.css";

interface ShellProps { slug: ResourceSection["slug"]; lead: ReactNode; stats?: [string, string | number][]; note?: ReactNode; top?: ReactNode; children: ReactNode }

export function ResourceShell({ slug, lead, stats, note, top, children }: ShellProps) {
  const info = sectionBySlug(slug);
  useEffect(() => { document.title = `${info.title} · Resources · Bible Project`; return () => { document.title = "Bible Project"; }; }, [info.title]);
  return <div className="tl-page rs-page mx-auto max-w-7xl px-4 sm:px-6" style={{ "--door": `var(--${info.color})` } as CSSProperties}>
    {top}
    <ResourceCrumbs slug={slug} />
    <header className="st-hero tl-hero">
      <div><p className="st-kick">Resources · {String(RESOURCE_SECTIONS.indexOf(info) + 1).padStart(2, "0")}</p><div className="tl-title-row"><h1>{info.title}</h1><span className="tl-hero-art"><StationArt kind={info.art} /></span></div></div>
      <div className="st-side"><p>{lead}</p>{stats && <StationStats items={stats} />}{note && <p className="tl-rule">{note}</p>}</div>
    </header>
    {children}
  </div>;
}

/** The way back to the station and across to the sister sections (also used alone by the Learning division's doors). */
export function ResourceCrumbs({ slug }: { slug: ResourceSection["slug"] }) {
  return <nav className="tl-crumbs" aria-label="Resources sections">
    <Link to="/resources"><ArrowLeft size={14} aria-hidden="true" />Resources</Link>
    {RESOURCE_SECTIONS.filter((s) => sectionReady(s.slug)).map((s) => <Link key={s.slug} to={`/resources/${s.slug}`} aria-current={s.slug === slug ? "page" : undefined}>{s.title}</Link>)}
  </nav>;
}

/** "Checked 2026-10-08 on example.org", linking to the page that was read. */
export function Checked({ date, source }: { date: string; source: string }) {
  return <p className="rs-checked">Checked {date} on <a href={source} target="_blank" rel="noreferrer">{hostOf(source)}</a></p>;
}

function hostOf(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

export function Loading() {
  return <div className="tl-page mx-auto max-w-7xl px-4 sm:px-6"><p className="tl-status" role="status">Loading…</p></div>;
}
