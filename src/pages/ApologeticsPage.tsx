import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Compass, HeartHandshake, MessageCircle, Play, ShieldCheck } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { PassageText, RefLink } from "@/components/study/StudyParts";
import { APOLOGETICS_ANCHOR, CONVERSATION_STEPS, FOUNDATIONS, ISLAM_STUDY_QUESTIONS } from "@/data/apologetics";
import "./apologetics.css";

const DESTINATIONS = [
  { id: "foundations", title: "Foundations", lens: "Belief & Scripture", icon: BookOpen, color: "accent" },
  { id: "conversation", title: "Conversations", lens: "Witness & practice", icon: HeartHandshake, color: "poetry" },
  { id: "across-beliefs", title: "Across beliefs", lens: "Religions & worldviews", icon: Compass, color: "prophets" },
  { id: "debates", title: "Debate library", lens: "Arguments & sources", icon: Play, color: "gospels" },
] as const;

function NavigationSketch({ kind }: { kind: string }) {
  return <svg className="ap-nav-sketch" viewBox="0 0 180 44" fill="none" aria-hidden="true" focusable="false">
    {kind === "foundations" && <><path d="M20 8q30-10 60 3v29q-30-13-60-3Zm60 3q30-13 60-3v29q-30-10-60 3Z" fill="currentColor" fillOpacity=".07" stroke="currentColor" /><path d="M31 15q20-5 38 3m-38 4q20-5 38 3m-38 4q20-5 38 3m22-14q19-8 38-3m-38 10q19-8 38-3m-38 10q19-8 38-3" stroke="currentColor" opacity=".45" /></>}
    {kind === "conversation" && <><path d="M19 5h75a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H45L30 39V29H19a5 5 0 0 1-5-5V10a5 5 0 0 1 5-5Z" fill="currentColor" fillOpacity=".07" stroke="currentColor" /><path d="M106 14h32a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5h-2v7l-12-7H68" stroke="currentColor" opacity=".45" />{[38, 56, 74].map((x) => <circle key={x} cx={x} cy="17" r="2" fill="currentColor" opacity=".6" />)}</>}
    {kind === "across-beliefs" && <><circle cx="80" cy="22" r="18" stroke="currentColor" /><ellipse cx="80" cy="22" rx="8" ry="18" stroke="currentColor" opacity=".45" /><path d="M62 22h36m-33-10h30m-30 20h30M19 22h34m54 0h34" stroke="currentColor" opacity=".45" /><circle cx="15" cy="22" r="3" fill="currentColor" /><circle cx="145" cy="22" r="3" fill="currentColor" /><path d="M32 9q14-8 27 0m42 26q14 8 27 0" stroke="currentColor" strokeDasharray="2 3" /></>}
    {kind === "debates" && <><path d="M17 37h128" stroke="currentColor" opacity=".3" />{[11, 18, 29, 20, 13, 25, 32, 16].map((height, i) => <rect key={i} x={21 + i * 16} y={35 - height} width="7" height={height} rx="2" fill="currentColor" opacity={i % 2 ? .3 : .65} />)}</>}
  </svg>;
}

/** Decorative open doorway: a conversation begins with an invitation. */
function Doorway() {
  return <svg viewBox="0 0 400 290" className="ap-doorway" aria-hidden="true" focusable="false">
    <defs><linearGradient id="ap-light" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity=".2" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
    <path d="M130 244V112a70 70 0 0 1 140 0v132Z" fill="url(#ap-light)" />
    {[0, 1, 2, 3, 4].map((n) => <path key={n} d={`M${130 - n * 19} 244V112a${70 + n * 19} ${70 + n * 19} 0 0 1 ${140 + n * 38} 0v132`} fill="none" stroke="var(--accent)" strokeWidth="1" opacity={.7 - n * .12} />)}
    <path d="M200 98v104m-29-72h58" fill="none" stroke="var(--accent)" strokeWidth="2" />
    <path d="M37 244h326M130 244l-50 40m190-40 50 40M165 244l-20 40m90-40 20 40" fill="none" stroke="var(--accent)" strokeWidth=".75" opacity=".35" />
    <circle cx="200" cy="150" r="4" fill="var(--accent)" />
  </svg>;
}

export default function ApologeticsPage() {
  const [foundation, setFoundation] = useState(0);
  const [step, setStep] = useState(0);
  const active = FOUNDATIONS[foundation];
  const conversation = CONVERSATION_STEPS[step];
  return <div className="ap-page mx-auto max-w-7xl px-4 sm:px-6">
    <header className="ap-intro"><p className="ap-eyebrow"><span /> Apologetics & ministry</p><h1>A reason for <em>the hope.</em></h1><p>Know the faith. Examine the questions. Share Christ with clarity, courage and love.</p></header>
    <section className="ap-commission" aria-labelledby="ap-commission-title">
      <div className="ap-commission-copy"><p className="ap-eyebrow">Conviction & compassion</p><h2 id="ap-commission-title">Be ready to answer.<br /><em>Be faithful in love.</em></h2><p>Apologetics gives reasons for Christian belief and responds to objections. Ministry brings those reasons into real relationships—with attention to the person, the question and the call of Christ.</p><a className="ap-primary-link" href="#foundations">Begin with the foundations <ArrowDown size={15} aria-hidden="true" /></a></div>
      <div className="ap-commission-art"><Doorway /><div className="ap-anchor"><RefLink span={APOLOGETICS_ANCHOR} label="Our starting point · 1 Peter 3:15–16" /><p>Readiness to give an answer belongs with gentleness, reverence and a good conscience.</p></div></div>
    </section>
    <nav className="ap-jump" aria-label="On this page">{DESTINATIONS.map((destination) => <a key={destination.id} href={"#" + destination.id} className="ap-nav-card" style={{ "--nav-color": "var(--" + destination.color + ")" } as CSSProperties}>
      <span className="ap-nav-title"><destination.icon size={18} strokeWidth={1.4} aria-hidden="true" /><strong>{destination.title}</strong></span>
      <span className="ap-nav-lens">{destination.lens}</span>
      <span className="ap-nav-bottom"><NavigationSketch kind={destination.id} /><ArrowDown size={15} strokeWidth={1.5} aria-hidden="true" /></span>
    </a>)}</nav>

    <section id="foundations" className="ap-section" aria-labelledby="ap-foundations-title">
      <div className="ap-section-heading"><div><p className="ap-eyebrow">Understand the claim</p><h2 id="ap-foundations-title">Start with what Christians believe.</h2></div><p>Choose a foundation. Consider the question. Open the passages and follow the reasoning.</p></div>
      <div className="ap-foundation-tabs" role="tablist" aria-label="Christian foundations">{FOUNDATIONS.map((item, i) => <button key={item.id} id={"ap-tab-" + item.id} type="button" role="tab" aria-selected={foundation === i} aria-controls="ap-foundation-panel" tabIndex={foundation === i ? 0 : -1} onClick={() => setFoundation(i)} onKeyDown={(event) => {
        const next = event.key === "ArrowRight" ? (i + 1) % FOUNDATIONS.length : event.key === "ArrowLeft" ? (i + FOUNDATIONS.length - 1) % FOUNDATIONS.length : event.key === "Home" ? 0 : event.key === "End" ? FOUNDATIONS.length - 1 : -1;
        if (next < 0) return;
        event.preventDefault(); setFoundation(next); document.getElementById("ap-tab-" + FOUNDATIONS[next].id)?.focus();
      }}>{item.label}</button>)}</div>
      <div id="ap-foundation-panel" role="tabpanel" aria-labelledby={"ap-tab-" + active.id} tabIndex={0} className="ap-foundation-panel">
        <div className="ap-claim"><ShieldCheck size={25} strokeWidth={1.3} aria-hidden="true" /><h3>{active.title}</h3><p>{active.claim}</p><div className="ap-question"><span>A question to examine</span><h4>{active.question}</h4><p>{active.response}</p></div></div>
        <div className="ap-passages"><p className="ap-eyebrow"><BookOpen size={15} aria-hidden="true" /> Open the Scriptures</p><ol>{active.refs.map(({ span, note }) => <li key={span[0]}><RefLink span={span} /><span>{note}</span></li>)}</ol><details key={active.id} className="ap-read-preview"><summary>Read the first passage here</summary><div><PassageText span={active.refs[0].span} max={4} /></div></details><div className="ap-ask"><MessageCircle size={17} aria-hidden="true" /><div><span>Begin a conversation</span><p>{active.ask}</p></div></div></div>
      </div>
      <p className="ap-source-note">These are Christian starting points for study. For a historic summary of the faith, read the <a href="https://www.churchofengland.org/faith-life/what-we-believe/nicene-creed" target="_blank" rel="noreferrer">Nicene Creed <ArrowUpRight size={12} aria-hidden="true" /></a>. Biblical passages open in the reader; each objection deserves examination in its own context.</p>
    </section>

    <section id="conversation" className="ap-section" aria-labelledby="ap-conversation-title">
      <div className="ap-section-heading"><div><p className="ap-eyebrow">Put conviction into practice</p><h2 id="ap-conversation-title">A person. A question. A next step.</h2></div><p>Make the Christian case clearly, understand the other person's strongest objection, and keep the door open.</p></div>
      <div className="ap-conversation"><div className="ap-steps" role="group" aria-label="Conversation steps">{CONVERSATION_STEPS.map((item, i) => <button key={item.title} type="button" aria-pressed={step === i} onClick={() => setStep(i)}><span>0{i + 1}</span><strong>{item.title}</strong><ArrowRight size={15} aria-hidden="true" /></button>)}</div><div className="ap-step-detail" aria-live="polite"><HeartHandshake size={28} strokeWidth={1.2} aria-hidden="true" /><h3>{conversation.line}</h3><p>{conversation.detail}</p><blockquote>{conversation.prompt}</blockquote><RefLink span={conversation.span} /></div></div>
    </section>

    <section id="across-beliefs" className="ap-section" aria-labelledby="ap-beliefs-title">
      <div className="ap-section-heading"><div><p className="ap-eyebrow">Across beliefs</p><h2 id="ap-beliefs-title">Understand deeply. Witness clearly.</h2></div><p>Study a tradition's own sources, recognise differences within it, and ask what the person in front of you actually believes.</p></div>
      <div className="ap-islam-feature"><div className="ap-islam-intro"><span className="ap-status">Next study collection</span><h3>Christianity<br /><em>& Islam.</em></h3><p>Preparing for thoughtful conversations with Muslim neighbours: the Christian claims, the questions between the faiths, and the sources behind each argument.</p><a href="#debates">How we will study the debates <ArrowRight size={15} aria-hidden="true" /></a></div><div className="ap-islam-questions"><p className="ap-eyebrow">Questions that will guide the study</p><ol>{ISLAM_STUDY_QUESTIONS.map((question, i) => <li key={question}><span>0{i + 1}</span>{question}</li>)}</ol><p>The focused Islam studies and debate collection are the next stage. Begin now with the Christian foundations above.</p></div></div>
      <p className="ap-future-paths"><span>A wider ministry horizon</span>Judaism <i /> Hindu traditions <i /> Buddhist traditions <i /> Secular worldviews</p>
    </section>

    <section id="debates" className="ap-section" aria-labelledby="ap-debates-title">
      <div className="ap-section-heading"><div><p className="ap-eyebrow">The debate library</p><h2 id="ap-debates-title">Follow the argument to its source.</h2></div><p>A useful debate study makes the claim, evidence, objection and reply easy to examine together.</p></div>
      <div className="ap-debate-library"><div className="ap-debate-empty"><span className="ap-film-mark" aria-hidden="true"><Play size={26} strokeWidth={1} /></span><div><span className="ap-status">Collection in preparation</span><h3>Christian–Muslim debates</h3><p>No debates have been added yet. The next stage will assemble full recordings and source-led study notes.</p></div></div><div className="ap-debate-method"><h3>What each study will contain</h3><ol><li><span>01</span><div><strong>The full exchange</strong><p>Speakers, date, setting and the original recording, with timestamps.</p></div></li><li><span>02</span><div><strong>The claim and its grounds</strong><p>The argument, cited Scripture or religious text, and the context needed to assess it.</p></div></li><li><span>03</span><div><strong>The strongest objection and reply</strong><p>Represent each speaker accurately and distinguish an answered question from an unresolved one.</p></div></li><li><span>04</span><div><strong>From debate to ministry</strong><p>What the exchange teaches, where an argument needs care, and a useful question for a real conversation.</p></div></li></ol></div></div>
    </section>
    <footer className="ap-closing"><BookOpen size={24} strokeWidth={1.3} aria-hidden="true" /><div><h2>Keep an open Bible at the centre.</h2><p>Read the life, words, death and resurrection of Jesus in the Gospel accounts.</p></div><Link to="/study/harmony">Explore the Gospel harmony <ArrowRight size={16} aria-hidden="true" /></Link></footer>
  </div>;
}
