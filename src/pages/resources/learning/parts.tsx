// Small pieces every part of the Learning division shares: the status mark, a title's cover (the real one when ready,
// an outline marked Planned when not), the two downloads, a title's facts, its full record, and the tone of its reader.
import { ArrowDownToLine } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Division, Title } from "@/data/resources/learning-catalogue";
import { TrackGlyph } from "./Art";
import { splitTitle, toneOf } from "./model";




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
  return <div className="lm-sketch" style={toneOf(division.audience[title.audience])} role="img" aria-label={`Planned: ${title.title}`}>
    <span className="k">{division.kind[title.kind].name}</span>
    <span><span className="n">{name}</span>{rest && <span className="s">{rest}</span>}</span>
    <span className="ico"><TrackGlyph track={title.track} size={30} strokeWidth={1.1} /></span>
    <span className="p">Planned</span>
  </div>;
}

export function Downloads({ title }: { title: Title }) {
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
