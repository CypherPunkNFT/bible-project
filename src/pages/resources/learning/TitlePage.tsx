// /resources/learning/<title>: one title's page (mock-up A's item page, as E links to it). A ready workbook shows its
// cover with two real pages fanned behind it, both downloads, its record, real pages that open the page viewer, and its
// sessions (choose one for its summary, a key verse, its questions and the page it opens on). A planned title shows
// only what it will be written from and its series: no download, no page count, no sample pages. The way back names
// where the visitor came from (the door they opened, by default).
import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { BackLink } from "@/components/BackLink";
import type { LearningData, WorkbookSession } from "@/data/resources";
import { CATALOGUE, buildDivision, type Title } from "@/data/resources/learning-catalogue";
import { ResourceCrumbs } from "../Shell";
import { SessionArt } from "./Art";
import { PageViewer } from "./PageViewer";
import { SeriesBlock } from "./SeriesBlocks";
import { doorUrl, splitTitle, titleUrl, toneOf } from "./model";
import { Cover, Downloads, Record, SecHead, SourceLink } from "./parts";
import "./learning.css";

const WORDS = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];

export default function LearningTitlePage({ data }: { data: LearningData }) {
  const { titleId = "" } = useParams();
  const division = useMemo(() => buildDivision(CATALOGUE, data.items), [data]);
  const t: Title | undefined = division.title[titleId];
  const [viewer, setViewer] = useState<number | null>(null);
  useEffect(() => {
    if (t) document.title = `${t.title} · Learning materials · Bible Project`;
    return () => { document.title = "Bible Project"; };
  }, [t]);
  if (!t) return <Navigate replace to="/resources/learning" />;

  const a = division.audience[t.audience], r = t.record, [name, rest] = splitTitle(t.title);
  const back = { path: titleUrl(t.id), label: t.title };
  const images = r?.pageImages ?? [];
  let n = 0;
  const next = () => String(++n).padStart(2, "0");
  return <div className="lm lm-title-page tl-page mx-auto max-w-7xl px-4 sm:px-6" style={toneOf(a)}>
    <ResourceCrumbs slug="learning" />
    <div className="lm-back"><BackLink fallback={{ path: doorUrl(a.id), label: `the ${a.name.toLowerCase()} door` }} /></div>
    <section className="lm-item" aria-labelledby="lm-title">
      <div className="lm-stand">
        {r?.outline && images.length > 0 && <>
          <div className="fan f1"><img src={images[r.outline.pages.intro - 1]} alt="" width={1000} height={1414} /></div>
          <div className="fan f2"><img src={images[r.outline.sessions[0].page - 1]} alt="" width={1000} height={1414} /></div>
        </>}
        <div className="front"><Cover title={t} division={division} /></div>
      </div>
      <div>
        <p className="lm-kicker rule">{division.kind[t.kind].name} · {a.name}</p>
        <h1 id="lm-title">{name}{rest && <em>{rest}</em>}</h1>
        <p className="sum">{r ? r.summary : `${t.sub}. This title is planned: it has a place on the shelf and the pages it will be written from, but nothing has been written yet.`}</p>
        {r ? <Downloads title={t} /> : <div className="lm-gap" />}
        <Record title={t} division={division} back={back} />
      </div>
    </section>

    {r?.outline ? <>
      <section className="lm-sec" aria-labelledby="lm-inside">
        <SecHead num={next()} id="lm-inside" title={<>Inside <em>the workbook</em></>} lead={`Real pages from the A4 edition. Open one to turn through all ${r.pages}.`} />
        <div className="lm-pages">{([[r.outline.pages.contents, "Contents"], [r.outline.pages.use, "How to use it"], [r.outline.pages.intro, r.outline.intro],
          [r.outline.sessions[0].page, "Session 1 opens"], [r.outline.sessions[0].questionsPage, "Questions to write in"], [r.outline.pages.sources, "Sources"]] as [number, string][])
          .map(([page, caption]) => <button key={page} type="button" onClick={() => setViewer(page)}>
            <img src={images[page - 1]} alt={`Page ${page}: ${caption}`} loading="lazy" width={1000} height={1414} /><small><b>p. {page}</b> · {caption}</small>
          </button>)}</div>
      </section>
      <Sessions sessions={r.outline.sessions} outline={r.outline} num={next()} rest={rest || name} images={images} onPage={setViewer} />
    </> : <section className="lm-sec" aria-labelledby="lm-from">
      <SecHead num={next()} id="lm-from" title={<>What it will be <em>written from</em></>}
        lead="Every planned title names its sources before a word is written, so the shelf shows only what the site can stand behind." />
      <ul className="lm-steps lm-from-list">{t.builtFrom.map((b, i) => <li key={b.path}><span>0{i + 1}</span><b><SourceLink path={b.path} title={b.title} back={back} /></b><p>{b.path}</p></li>)}</ul>
    </section>}

    {t.series.length > 0 && <section className="lm-sec" aria-labelledby="lm-in-series">
      <SecHead num={next()} id="lm-in-series" title={<>In <em>{t.series.length > 1 ? `${WORDS[t.series.length].toLowerCase()} series` : "a series"}</em></>} />
      <div className="lm-series">{t.series.map((s) => <SeriesBlock key={s.id} division={division} id={s.id} here={t.id} back={back} />)}</div>
    </section>}

    {viewer !== null && images.length > 0 && <PageViewer title={t.title} images={images} start={viewer} onClose={() => setViewer(null)} />}
  </div>;
}

interface SessionsProps { sessions: WorkbookSession[]; outline: NonNullable<NonNullable<Title["record"]>["outline"]>; num: string; rest: string; images: string[]; onPage: (page: number) => void }

function Sessions({ sessions, outline, num, rest, images, onPage }: SessionsProps) {
  const [open, setOpen] = useState<number | null>(null);
  const s = open ? sessions.find((x) => x.n === open) : undefined;
  const part = (x: WorkbookSession) => outline.parts.find((p) => p.part === x.part);
  return <section className="lm-sec" aria-labelledby="lm-sessions">
    <SecHead num={num} id="lm-sessions" title={<>{WORDS[sessions.length] ?? sessions.length} sessions, <em>{rest}</em></>}
      lead="Each session opens with its own line drawing. Choose one to read its summary, a key verse and its questions." />
    <div className="lm-sess-grid">{sessions.map((x) => <button key={x.n} type="button" className="lm-sess" aria-pressed={x.n === open} onClick={() => setOpen(x.n === open ? null : x.n)}>
      <SessionArt shapes={outline.art[x.art] ?? []} />
      <span className="meta"><span className="no">Session {x.n} · {part(x)?.place}</span><h3>{x.title}</h3><p>{x.read} · p. {x.page}</p></span>
    </button>)}</div>
    {s && <div className="lm-sess-open">
      <div>
        <span className="lm-kicker">Session {s.n} · {part(s)?.label} · {part(s)?.place}</span>
        <h3>{s.title}</h3>
        <p className="brief">{s.brief} <span className="refs">({s.briefRefs})</span></p>
        <blockquote>{s.key.text}<small>{s.key.ref} · KJV</small></blockquote>
        <p className="qk"><span><b>{s.questions.observe}</b>observe</span><span><b>{s.questions.interpret}</b>interpret</span><span><b>{s.questions.reflect}</b>reflect</span><span><b>{s.keyVerses}</b>key verses</span></p>
      </div>
      <button type="button" onClick={() => onPage(s.page)}><img src={images[s.page - 1]} alt={`The page where session ${s.n} opens`} width={1000} height={1414} /><small>Pages {s.page}–{s.end}</small></button>
    </div>}
  </section>;
}
