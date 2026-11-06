// /study/the-good-news: for someone who is not a Christian, or is not sure. One habit: read the gospel as news before advice.
// A ledger of verses (what God has done, then what it calls for), six parts down one thread, six questions, the passage
// again. Built from the study's content.md through the checked data in model.ts; first tried as the mock-up in
// design/the-good-news-directions/. A verse opens in the sheet from the right, as on every study, and lives in the address.
import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { StudyBackLink } from "@/components/study/StudyBackLink";
import { SlidePanel } from "@/pages/study/manuscripts/Sheet";
import { D, hasPassage, passageText } from "./model";
import { CloseArt, HeroArt, PartArt } from "./art";
import { OpenVerse } from "./open-verse";
import { Blocks, Label, Ledger, Ref, Runs } from "./parts";
import "@/components/study/study-trail.css";
import "./good-news.css";

const BRANCH = { path: "/study/theology", label: "Scripture & Theology" };
const HUB = { path: "/study/theology?area=doctrine", label: "God & Christian Faith" };

function Opening() {
  const { study, numbers } = D;
  const opening = study.opening[0];
  const figures: [string, number, string][] = [
    ["Parts", numbers.parts, "God, the problem, Jesus, the response, in that order"],
    ["Luke 15, whole", numbers.luke15, "verses: three lost things, read as one answer"],
    ["Printed in full", numbers.versesShown, "verses on this page, each word for word the Berean"],
    ["Questions", numbers.questions, "readers often ask, answered after the six parts"],
  ];
  return <section id="top" className="gn-sec">
    <div className="gn-intro">
      <div>
        <nav className="study-trail" aria-label="Study navigation">
          <StudyBackLink fallback={BRANCH} /><Link to={HUB.path}>{HUB.label}</Link>
        </nav>
        <p className="gn-concepts">{study.concepts.join(" · ")}</p>
        <h1>The good <em>news</em></h1>
        <p className="gn-subtitle">How a person is made right with God</p>
        <p className="gn-lede"><Runs runs={study.lead} /></p>
        <figure className="gn-opening"><blockquote>{passageText(opening.r)}</blockquote><figcaption><Ref id={opening.r}>{opening.label}</Ref> · Berean Standard Bible</figcaption></figure>
      </div>
      <figure className="gn-hero-art">
        <HeroArt />
        <figcaption>{study.motto.map((line) => <span key={line}>{line}</span>)}<small>Illustrative · no figure of God, of Christ or of the father</small></figcaption>
      </figure>
    </div>
    <dl className="gn-figures">{figures.map(([name, value, note]) => <div key={name}><dt>{name}</dt><dd>{value}</dd><small>{note}</small></div>)}</dl>
    <nav className="gn-toc" aria-label="On this page">
      <a href="#news"><b>00</b>News, then response</a>
      {study.parts.map((part) => <a key={part.n} href={`#part-${part.n}`}><b>{part.n}</b>{part.title}</a>)}
      <a href="#questions"><b>?</b>Questions</a><a href="#close"><b>→</b>Close</a>
    </nav>
  </section>;
}

const Head = ({ num, title, turn, lead }: { num: string; title: string; turn: string; lead?: string }) =>
  <header className="gn-head"><span className="gn-num" aria-hidden="true">{num}</span><div><h2>{title} <em>{turn}</em></h2>{lead && <p>{lead}</p>}</div></header>;

function News() {
  return <section id="news" className="gn-sec">
    <Head num="00" title="News first." turn="Then the response." lead="Read the gospel as news before you read it as advice." />
    <p className="gn-frame"><Runs runs={D.study.frame} /></p>
    <Ledger />
    <p className="gn-note">These seven rows were chosen to show the order, and each phrase is in its verse. They are not a count of every verse that has it. <Runs runs={D.study.selection} /></p>
  </section>;
}

function Road() {
  return <section className="gn-sec gn-road" aria-label="The six parts">
    {D.study.parts.map((part) => <article key={part.n} id={`part-${part.n}`} className="gn-part" aria-labelledby={`part-${part.n}-title`}>
      <aside className="gn-rail">
        <span className="gn-dot" aria-hidden="true" />
        <span className="gn-n">{part.n}</span>
        <span className="gn-mini-wrap" aria-hidden="true"><PartArt n={part.n} /></span>
        <h2 id={`part-${part.n}-title`}>{part.title}</h2>
        <p className="gn-readings"><Label>Main readings</Label>{part.readings.map((id, i) => <span key={id}>{i ? " · " : ""}<Ref id={id} /></span>)}</p>
      </aside>
      <div className="gn-body">
        <Blocks blocks={part.blocks} partNumber={part.n} />
        <dl className="gn-ask">
          <div><dt>Consider</dt><dd><Runs runs={part.consider} /></dd></div>
          <div><dt>Reflect</dt><dd><Runs runs={part.reflect} /></dd></div>
        </dl>
      </div>
    </article>)}
  </section>;
}

function Questions() {
  return <section id="questions" className="gn-sec">
    <Head num="?" title="Questions" turn="readers ask." lead="Six honest questions, answered from the same passages." />
    <div className="gn-qs">{D.study.questions.map((q, i) => <details key={q.title} className="gn-q" open={i === 0}>
      <summary><span className="gn-q-n">{String(i + 1).padStart(2, "0")}</span><span className="gn-q-t">{q.title}</span><span className="gn-q-plus" aria-hidden="true" /></summary>
      <div className="gn-q-body"><Blocks blocks={q.blocks} /></div>
    </details>)}</div>
  </section>;
}

function Close() {
  const close = D.study.close;
  const passage = D.passages[close.passage];
  return <section id="close" className="gn-sec">
    <Head num="→" title={`${close.title.replace(/\.$/, "")}.`} turn="Then go in." />
    <div className="gn-close-grid">
      <div>
        <p className="gn-way"><Runs runs={close.way} /></p>
        <p className="gn-invite"><Runs runs={close.invite} /></p>
        <p className="gn-question"><Runs runs={close.question} /></p>
        <p className="gn-again"><Runs runs={close.again} /></p>
      </div>
      <figure className="gn-passage">
        <figcaption><Label>The passage again</Label> <Ref id={close.passage} /> · BSB</figcaption>
        <div className="gn-passage-text">{passage.verses.map(([cv, text]) => <span key={cv}><sup>{cv.split(":")[1]}</sup>{text} </span>)}</div>
      </figure>
    </div>
    <span className="gn-close-art" aria-hidden="true"><CloseArt /></span>
    <div className="gn-sources"><h3>Sources</h3><ul>{D.sources.map(([name, use]) => <li key={name}><b>{name}</b> {use}</li>)}</ul></div>
    <Link className="gn-back" to={HUB.path}><ArrowLeft size={16} aria-hidden="true" />Back to {HUB.label}</Link>
  </section>;
}

function VerseSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, onClose]);
  const passage = id ? D.passages[id] : null;
  return <SlidePanel open={Boolean(passage)} onClose={onClose} label={passage?.label ?? "Verse"} closeLabel="Close this passage">
    {passage && <>
      <p className="gn-label">Berean Standard Bible</p>
      <h2>{passage.label}</h2>
      <p className="gn-sheet-text">{passage.verses.map(([cv, text]) => <span key={cv}><sup>{passage.verses.length > 1 ? cv.split(":")[1] : cv}</sup> {text} </span>)}</p>
    </>}
  </SlidePanel>;
}

export default function GoodNewsPage() {
  useEffect(() => {
    document.title = "The good news · Bible Guide";
    return () => { document.title = "Bible Guide"; };
  }, []);
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const asked = params.get("ref");
  const opened = hasPassage(asked) ? asked : null;
  const opener = useRef<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    try { document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(); }
    catch (error) { console.error(`The good news page: could not read the address's section "${hash}"`, error); }
    // Only on arrival: the scroll is the reader's after that.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = useCallback((id: string) => {
    opener.current = id;
    setParams((p) => { const q = new URLSearchParams(p); q.set("ref", id); return q; }, { replace: true, preventScrollReset: true });
  }, [setParams]);
  const close = useCallback(() => {
    setParams((p) => { const q = new URLSearchParams(p); q.delete("ref"); return q; }, { replace: true, preventScrollReset: true });
    const back = opener.current ? document.querySelector<HTMLElement>(`.gn-root [data-opener="${CSS.escape(opener.current)}"]`) : null;
    back?.focus({ preventScroll: true });
  }, [setParams]);

  useEffect(() => {
    if (opened) document.querySelector<HTMLElement>(".gn-root .ms-sheet.open .ms-sheet-close")?.focus({ preventScroll: true });
  }, [opened]);

  return <OpenVerse.Provider value={open}>
    <div className="gn-root"><div className="gn-wrap">
      <Opening /><News /><Road /><Questions /><Close />
    </div><VerseSheet id={opened} onClose={close} /></div>
  </OpenVerse.Provider>;
}
