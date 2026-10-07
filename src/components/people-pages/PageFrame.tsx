import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import type { CameFrom } from "@/lib/came-from";
import { personPath } from "@/lib/people-pages-index";

/** "Back to …" on the left; "PEOPLE / DAVID / THE REIGN" on the right. */
export function PageTop({ id, name, page, fallback }: { id: string; name: string; page: string; fallback: CameFrom }) {
  return <div className="pp-top">
    <BackLink fallback={fallback} />
    <nav className="pp-crumbs" aria-label="Where you are"><Link to="/study/people">People</Link> / <Link to={personPath(id)}>{name}</Link> / <span aria-current="page">{page}</span></nav>
  </div>;
}

/** Section jump chips under the hero, so a phone reader can skip the long middle. */
export function JumpChips({ items }: { items: { id: string; title: string }[] }) {
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  return <nav className="pp-jump" aria-label="On this page">{items.map((item) => <a key={item.id} href={`#${item.id}`} onClick={(event) => { event.preventDefault(); go(item.id); }}>{item.title}</a>)}</nav>;
}

export interface PageSection { id: string; title: string; node: ReactNode }

/** The page's sections in order, each a glass panel, with the jump chips above them. */
export function Sections({ sections }: { sections: PageSection[] }) {
  const shown = sections.filter((s) => s.node);
  return <>
    <JumpChips items={shown.map(({ id, title }) => ({ id, title }))} />
    {shown.map((s) => <div key={s.id}>{s.node}</div>)}
  </>;
}
