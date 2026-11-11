// /testimony-builder: the Testimony builder (docs/features/testimony-builder/design.md). A guided form that helps a
// person write their Christian testimony, one question at a time, and turns the answers into a printable sheet. Built in
// the tools hub's design (the games' hero and numbered shelves, games.css), like /scripture-memory: write (01), your
// testimony (02), keep your draft (03) and writing it well (04). The draft lives in this browser's storage only.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "@/lib/catalog";
import { GameArtImage } from "@/pages/games/art/parts";
import { useVerseText, verseHref, verseReference } from "@/pages/converter/verse";
import { Guide } from "./Guide";
import { KeepPanel } from "./KeepPanel";
import { QuestionForm } from "./QuestionForm";
import { progressLine } from "./lines";
import { QuestionList } from "./QuestionList";
import { QUESTIONS, questionIndex } from "./questions";
import { SheetPanel } from "./SheetPanel";
import { answeredCount, readOpen, writeOpen } from "./storage";
import { TESTIMONY_ART } from "./testimony-art";
import { NEWER, NO_STORE, useDraft } from "./useDraft";
import "@/pages/games/games.css";
import "./testimony-builder.css";

/** Mark 5:19: Jesus sends the healed man home to tell what the Lord has done for him. */
const MARK_5_19 = 41005019;

function Shelf({ id, index, title, text, children }: { id: string; index: string; title: string; text: string; children: ReactNode }) {
  return <section className="gm-shelf tb-shelf" id={id} aria-labelledby={`${id}-title`}>
    <div className="gm-shelf-head">
      <span className="gm-shelf-num" aria-hidden="true">{index}</span>
      <div><h2 id={`${id}-title`}>{title}</h2><p>{text}</p></div>
    </div>
    {children}
  </section>;
}

function HeroVerse() {
  const catalog = useCatalog();
  const { state, retry } = useVerseText(MARK_5_19);
  const reference = verseReference(catalog, MARK_5_19);
  return <div className="tb-verse">
    {state.status === "loading" && <p className="tb-quiet" role="status">Loading the verse…</p>}
    {state.status === "error" && <p className="tb-bad" role="alert">The verse did not load. <button type="button" className="tb-link" onClick={retry}>Retry</button></p>}
    {state.status === "ready" && state.value && <blockquote className="scripture" lang="en">{state.value}</blockquote>}
    <p className="tb-verse-ref"><Link to={verseHref(catalog, MARK_5_19)}>{`Read ${reference} in context`}</Link></p>
  </div>;
}

export default function TestimonyBuilderPage() {
  const draft = useDraft();
  const [openId, setOpenId] = useState<string>(() => readOpen() ?? QUESTIONS[0].id);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const index = Math.max(0, questionIndex(openId));
  const question = QUESTIONS[index];
  const answered = answeredCount(draft.answers);

  // A question opened by a button takes focus at its heading; the first one on load does not.
  useEffect(() => {
    if (!moved.current || !heading.current) return;
    moved.current = false;
    heading.current.scrollIntoView?.({ block: "start" });
    heading.current.focus({ preventScroll: true });
  }, [openId]);

  const move = (id: string) => {
    if (id === openId) return;
    draft.flush();
    writeOpen(id);
    moved.current = true;
    setOpenId(id);
  };

  const finish = () => {
    draft.flush();
    const target = document.getElementById("sheet-title");
    target?.scrollIntoView?.({ block: "start" });
    target?.setAttribute("tabindex", "-1");
    target?.focus({ preventScroll: true });
  };

  const start = () => {
    draft.clear();
    writeOpen(QUESTIONS[0].id);
    moved.current = true;
    setOpenId(QUESTIONS[0].id);
  };

  const notices = [draft.newer ? NEWER : null, !draft.saving ? NO_STORE : null, draft.notice].filter((line): line is string => Boolean(line));

  return <div className="st-page gm-page tb-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="gm-hero">
      <div className="gm-hero-text">
        <p className="st-kick"><Link to="/tools">Tools</Link></p>
        <h1>Testimony builder:<br /><span>tell how much the Lord has done for you.</span></h1>
        <p className="gm-lede">Eighteen questions, one at a time, with guidance and an example for each, help you write your own story of coming to Christ. Your answers become a clean testimony sheet you can print, copy or download. Everything stays in your browser: no account, nothing sent.</p>
        <HeroVerse />
        <nav className="gm-jump" aria-label="On this page">
          <a href="#write">Write</a>
          <a href="#sheet">Your testimony</a>
          <a href="#keep">Keep your draft</a>
          <a href="#guide">Writing it well</a>
        </nav>
      </div>
      <div className="gm-hero-figure"><GameArtImage art={TESTIMONY_ART} className="gm-hero-art" /></div>
    </header>

    {notices.length > 0 && <ul className="tb-banner" role="status">{notices.map((line) => <li key={line} className={line === draft.notice ? "tb-quiet" : "tb-bad"}>{line}</li>)}</ul>}

    <Shelf id="write" index="01" title="Write" text="Take the questions in order or jump to any one. Answer in your own words. Skip what does not fit: the sheet shows only what you answer.">
      <div className="tb-layout">
        <QuestionForm ref={heading} key={question.id} question={question} index={index} value={draft.answers[question.id] ?? ""} readOnly={draft.newer}
          onChange={(text) => draft.setAnswer(question.id, text)} onMove={move} onFinish={finish} />
        <aside className="tb-side">
          <p className="tb-progress">{progressLine(answered)}</p>
          <details>
            <summary>All the questions</summary>
            <QuestionList answers={draft.answers} openId={openId} onOpen={move} />
          </details>
          <p className="tb-quiet">Your draft is saved in this browser as you type. To keep it safe, save a draft file now and then, under Keep your draft below.</p>
        </aside>
      </div>
    </Shelf>

    <Shelf id="sheet" index="02" title="Your testimony" text="Each answer under its own heading, as a sheet to print, copy or download. Pick up a pen and sign it if you like.">
      <SheetPanel answers={draft.answers} />
    </Shelf>

    <Shelf id="keep" index="03" title="Keep your draft" text="Save your draft as a file, open one on another device, or start over, and what this page does with your words.">
      <KeepPanel answers={draft.answers} answered={answered} saving={draft.saving} onReplace={draft.replace} onClear={start} />
    </Shelf>

    <Shelf id="guide" index="04" title="Writing it well" text="What makes a testimony worth reading, what to do with yours, and where it can go next.">
      <Guide />
    </Shelf>
  </div>;
}
