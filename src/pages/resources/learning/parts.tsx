// Small pieces every part of the Learning division shares: the status mark, a title's cover (the real one when ready,
// an outline marked Planned when not), the two downloads, a title's facts, its full record, and the tone of its reader.
import { ArrowDownToLine } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Division, OpenFile, OpenWork, Title } from "@/data/resources/learning-catalogue";
import { TrackGlyph } from "./Art";
import { makerOf, splitTitle, toneOf } from "./model";




/** A numbered section head: "01", a serif title with one italic accent, a short plain lead. */
export function SecHead({ num, id, title, lead }: { num: string; id?: string; title: ReactNode; lead?: ReactNode }) {
  return <div className="lm-sec-head"><span className="lm-sec-num">{num}</span><div><h2 id={id}>{title}</h2>{lead && <p>{lead}</p>}</div></div>;
}

export function Status({ title }: { title: Title }) {
  return <span className={`lm-tag ${title.status}`}>{title.status === "ready" ? "Ready" : "Planned"}</span>;
}


export function Cover({ title, division }: { title: Title; division: Division }) {
  if (title.record) return <img className="lm-cover-img" src={title.record.cover} alt={`Cover of ${title.title}`} width={794} height={1123} />;
  const [name, rest] = splitTitle(title.title);
  const maker = title.open ? makerOf(title.open) : "";
  return <div className={`lm-sketch${title.open ? " open" : ""}`} style={toneOf(division.audience[title.audience])} role="img" aria-label={title.open ? `${title.title}, by ${maker}` : `Planned: ${title.title}`}>
    <span className="k">{division.kind[title.kind].name}</span>
    <span><span className="n">{name}</span>{rest && <span className="s">{rest}</span>}</span>
    <span className="ico"><TrackGlyph track={title.track} size={30} strokeWidth={1.1} /></span>
    <span className="p">{title.open ? maker : "Planned"}</span>
  </div>;
}

const size = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`);

/** An open workbook's files: one or two buttons, or a numbered list when it comes as many (66 story booklets). */
function OpenDownloads({ work }: { work: OpenWork }) {
  const button = (f: OpenFile, solid: boolean) => <a key={f.href} className={`lm-btn${solid ? " solid" : ""}`} href={f.href} target="_blank" rel="noreferrer" {...(f.external ? {} : { download: "" })}>
    <ArrowDownToLine size={16} aria-hidden="true" />Download {f.kind.toUpperCase()}{f.external ? " from the maker" : ""} <small>{size(f.bytes)}</small></a>;
  if (work.files.length <= 2) return <div className="lm-dl-row">{work.files.map((f, i) => button(f, i === 0))}</div>;
  return <details className="lm-dl-many"><summary>{work.files.length} files to download</summary>
    <ol>{work.files.map((f) => <li key={f.href}><a className="lm-textlink" href={f.href} target="_blank" rel="noreferrer" download="">{f.label}</a> <small className="muted">{size(f.bytes)}</small></li>)}</ol>
  </details>;
}

export function Downloads({ title }: { title: Title }) {
  if (title.open) return <OpenDownloads work={title.open} />;
  const r = title.record;
  if (!r) return null;
  return <div className="lm-dl-row">
    <a className="lm-btn solid" href={r.pdf.a4} target="_blank" rel="noreferrer" download={`${r.id}-a4.pdf`}><ArrowDownToLine size={16} aria-hidden="true" />Download <small>A4</small></a>
    <a className="lm-btn" href={r.pdf.letter} target="_blank" rel="noreferrer" download={`${r.id}-letter.pdf`}><ArrowDownToLine size={16} aria-hidden="true" />Download <small>US Letter</small></a>
  </div>;
}

/** A link to one of the site pages a title is written from; the way back from that page is this one. */
export function SourceLink({ path, title, back, className = "lm-textlink" }: { path: string; title: string; back: { path: string; label: string }; className?: string }) {
  return <Link className={className} to={path} state={{ from: back }} title={path}>{title}</Link>;
}

/** "For" … "Status": every fact of one title (LEARNING.md 6.6). */
export function Record({ title, division, back }: { title: Title; division: Division; back: { path: string; label: string } }) {
  const a = division.audience[title.audience], ready = title.status === "ready";
  const series = title.series.map((s) => <span key={s.id} className="lm-record-line">{division.seriesById[s.id].name} <span className="muted">({s.step} of {division.inSeries(s.id).length})</span></span>);
  const sessions = title.sessions ? `${title.sessions}${title.minutes ? ` · about ${title.minutes} minutes each` : ""}${ready ? "" : " (planned)"}` : "To be set when written";
  const rows: [string, ReactNode][] = [
    ["For", `${a.name}${a.setting ? "" : ` · ${a.age}`}`], ["Kind", division.kind[title.kind].name], ["Subject", division.track[title.track].name],
    ["Series", series.length ? series : "—"], ["Sessions", sessions],
    ["Leader guide", title.guide ? "Yes" : ready ? "Not yet; the “How to use” page covers groups" : "No"],
    ["Paper", ready ? "A4 and US Letter, same page numbers" : "A4 and US Letter, when written"],
    ["Built from", title.builtFrom.map((b, i) => <span key={b.path}>{i > 0 && ", "}<SourceLink path={b.path} title={b.title} back={back} /></span>)],
    ["Status", <><Status title={title} /> <span className="muted">{ready ? title.review : "Not written. Nothing to download yet."}</span></>],
  ];
  return <dl className="lm-record">{rows.map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}</dl>;
}

const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };

/** An open workbook's facts, its maker first and its credit last: the rows of its record and of the panel beside a stack. */
function openFacts(division: Division, title: Title, w: OpenWork): [string, ReactNode][] {
  const doors = w.doors.map((d) => division.audience[d]).filter(Boolean).map((a) => a.setting ? a.name : `${a.name} (${a.age})`).join(" · ");
  const rows: [string, ReactNode][] = [
    ["Made by", [w.author, w.publisher].filter((s, i, all) => s && all.indexOf(s) === i).join(" · ")],
    ["For", <>{doors}{w.ages ? <span className="muted"> · ages {w.ages}</span> : null}</>],
    ["Kind", division.kind[title.kind].name], ["Subject", division.track[title.track].name],
  ];
  if (w.pages) rows.push(["Pages", String(w.pages)]);
  rows.push(["Licence", w.rights.licenceUrl ? <a className="lm-textlink" href={w.rights.licenceUrl} target="_blank" rel="noreferrer">{w.rights.licence}</a> : w.rights.licence]);
  if (w.rights.creditLine) rows.push(["Credit", w.rights.creditLine]);
  rows.push(["From", <a className="lm-textlink" href={w.sourcePage} target="_blank" rel="noreferrer">{host(w.sourcePage)}</a>]);
  return rows;
}

/** Those facts as a list: "lm-record" on a title's page, "lm-pn-facts" in the panel beside a stack. */
export function OpenFacts({ title, division, className }: { title: Title; division: Division; className: string }) {
  if (!title.open) return null;
  return <dl className={className}>{openFacts(division, title, title.open).map(([dt, dd]) => <div key={dt}><dt>{dt}</dt><dd>{dd}</dd></div>)}</dl>;
}
