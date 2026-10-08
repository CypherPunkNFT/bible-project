// /resources/learning: the workbook shelf. Each workbook from learning.json (written by scripts/build-learning.mjs) is a
// row: its cover, what it holds, the two PDFs (A4 and US Letter, same page numbers) and the site pages it was built from.
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { LearningData, Workbook } from "@/data/resources";
import { isAspect, specialPagesOf } from "@/lib/people-pages-index";
import { aspectLabel } from "@/components/people-pages/kinds";
import { ResourceShell } from "./Shell";

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** "Moses · The person", "Moses · As leader", "Moses · The word" for a /people/<id>[/<aspect>] address. */
function builtFromLabel(address: string) {
  const [, kind, id, asked] = address.split("/");
  if (kind !== "people" || !id) return address;
  const pages = specialPagesOf(id);
  const name = pages[0]?.summary.name ?? id.split("-")[0].replace(/^./, (c) => c.toUpperCase());
  if (!asked) return `${name} · The person`;
  const page = isAspect(asked) ? pages.find((p) => p.aspect === asked) : undefined;
  if (!page) return name;
  return `${name} · ${page.aspect === "rule" ? aspectLabel(page.summary) : page.aspect === "mission" ? "The mission" : "The word"}`;
}

export default function LearningPage({ data }: { data: LearningData }) {
  const items = data.items;
  const sessions = items.reduce((n, w) => n + w.sessions, 0), pages = items.reduce((n, w) => n + w.pages, 0);
  return <ResourceShell slug="learning"
    lead="Workbooks we write from the site’s own reviewed pages, to print for a group or keep beside your Bible. Each comes in A4 and US Letter with the same page numbers, so a group on either paper can say “page 14” together."
    stats={[["Workbooks", items.length], ["Sessions", sessions], ["Pages", pages], ["Paper sizes", 2]]}
    note="How these are made: before a PDF is built, every verse reference and every quotation in it is checked word for word against the site’s King James text.">
    <section className="rs-shelf" aria-label="Workbooks">
      <p className="tl-status">{plural(items.length, "workbook")} on the shelf</p>
      <ol>{items.map((w, i) => <WorkbookRow key={w.id} workbook={w} index={i + 1} />)}</ol>
    </section>
  </ResourceShell>;
}

function WorkbookRow({ workbook: w, index }: { workbook: Workbook; index: number }) {
  const file = (size: string) => `${w.id}-${size}.pdf`;
  return <li className="rs-book" aria-labelledby={`wb-${w.id}`}>
    <a className="rs-cover" href={w.pdf.letter} target="_blank" rel="noreferrer" aria-label={`Open ${w.title} (US Letter PDF)`}>
      <img src={w.cover} alt={`Cover of ${w.title}`} width={794} height={1123} loading="lazy" />
    </a>
    <div className="rs-book-text">
      <p className="rs-book-kick"><span>{String(index).padStart(2, "0")}</span>{w.kind} · {plural(w.sessions, "session")} · {plural(w.pages, "page")}</p>
      <h2 id={`wb-${w.id}`}>{w.title}</h2>
      <p className="rs-book-sum">{w.summary}</p>
      <div className="rs-downloads">
        <a href={w.pdf.a4} target="_blank" rel="noreferrer" download={file("a4")}><ArrowDownToLine size={16} aria-hidden="true" /><span>Download <small>(A4)</small></span></a>
        <a href={w.pdf.letter} target="_blank" rel="noreferrer" download={file("letter")}><ArrowDownToLine size={16} aria-hidden="true" /><span>Download <small>(US Letter)</small></span></a>
      </div>
      <div className="rs-built">
        <h3>Built from</h3>
        <ul>{w.builtFrom.map((address) => <li key={address}><Link to={address}>{builtFromLabel(address)}<ArrowUpRight size={12} aria-hidden="true" /></Link></li>)}</ul>
      </div>
      <p className="rs-checked">Checked {w.checked} against the King James text</p>
    </div>
  </li>;
}

