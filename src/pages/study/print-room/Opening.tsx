import { StudyTrail } from "@/components/study/StudyTrail";
// The face of the study, laid out like the Manuscripts page's: breadcrumb, the big title with one italic line and a short
// lede beside the opening drawing, then one end-to-end row of figures. Every figure is counted from the study's dossier
// and its timeline. Below the timeline, the six chapters as a row of ways in.
import type { CSSProperties, JSX } from 'react';
import { ArrowUpRight } from 'lucide-react';
import dossier from '../../../../content/academic-research/05-from-manuscript-to-printed-bible.json';
import { PrintHeroArt } from './PrintHeroArt';
import { CHAPTERS, ITEMS } from './print-timeline';

const printed = ITEMS.filter(i => i.from >= 1450);
const latest = Math.max(...printed.map(i => i.from));
const checked = new Date(`${dossier.checked}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const FIGURES = [
  ['First printed Bible', 'c. 1455', 'the Gutenberg Bible, Mainz'],
  ['On the timeline', `${printed.length}`, `editions and translations to ${latest}`],
  ['Pages to take apart', `${dossier.editions.length}`, 'layer by layer'],
  ['Family trees', `${dossier.networks.length}`, 'Hebrew, early and modern Greek'],
  ['Translations', `${dossier.translations.length}`, 'Luther to King James'],
  ['Close looks', `${dossier.caseStudies.length}`, 'investigations behind the chapters'],
  ['Sources', `${dossier.sources.length}`, `checked ${checked}`],
] as const;

export function Opening() {
  return <>
    <div className="pr-intro">
      <div>
        <StudyTrail area="texts" n="05"/>
        <p className="pr-eyebrow">Printed editions · Page layers · Printers and editors</p>
        <h1>From manuscript<em>to printed Bible</em></h1>
        <p className="pr-lede">The press made a page repeatable, but people still chose what went on it. Start with one surviving sheet of 1516,
          then follow the editors, printers and translators behind five centuries of printed Bibles.</p>
      </div>
      <PrintHeroArt />
    </div>
    <dl className="pr-figures">
      {FIGURES.map(([label, value, note]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><small>{note}</small></div>)}
    </dl>
  </>;
}

const lines = (x: number, y: number, w: number, n: number, gap = 7) =>
  Array.from({ length: n }, (_, i) => `M${x} ${y + i * gap}h${i % 3 === 2 ? w * .7 : w}`).join('');

/** One small line drawing per chapter, in that chapter's colour, as on the studies' cards. */
const CHAPTER_ART: Record<string, JSX.Element> = {
  '01': <><path className="wa-line" d="M84 14h66v82H84z" /><path className="wa-fine" d={lines(90, 24, 24, 9) + lines(122, 24, 22, 9)} />
    <g className="wa-float"><circle className="wa-line" cx="144" cy="52" r="17" /><path className="wa-line" d="M156 64l14 14" /></g></>,
  '02': <>{[0, 1, 2].map(k => <g key={k} transform={`translate(${62 + k * 42} 18)`}><path className="wa-line" d="M0 0h34v74H0z" />
    <path className="wa-fine" d={lines(5, 9, 24, 8)} /><path className={k === 2 ? 'wa-mark wa-blink' : 'wa-gap'} d="M5 37h24" /></g>)}</>,
  '03': <><path className="wa-line" d="M64 84h112l-6 10H70z" />{['T', 'И', 'I', 'Я', 'P'].map((c, k) =>
    <g key={c} className="wa-sort" style={{ animationDelay: `${k * .3}s` }}><rect className="wa-line" x={74 + k * 19} y="52" width="16" height="30" rx="1.5" />
      <text x={82 + k * 19} y="72">{c}</text></g>)}<path className="wa-fine" d="M70 30h100M70 38h70" /></>,
  '04': <>{[0, 1, 2].map(k => <path key={k} className={k === 1 ? 'wa-line wa-float' : 'wa-line'} d={`M${70 + k * 12} ${62 - k * 18}l50-14 50 14-50 14z`} />)}
    <path className="wa-fine" d="M95 66l50-14M108 52l24-7" /></>,
  '05': <><path className="wa-line" d="M54 30q16-6 32 0v52q-16-6-32 0zM86 30q16-6 32 0v52q-16-6-32 0z" /><path className="wa-fine" d={lines(60, 40, 20, 5) + lines(92, 40, 20, 5)} />
    <path className="wa-mark wa-flow" d="M124 56h18m-6-6 6 6-6 6" /><path className="wa-line" d="M148 30q16-6 32 0v52q-16-6-32 0z" /><path className="wa-fine" d={lines(154, 40, 20, 5)} /></>,
  '06': <><path className="wa-line" d="M82 12h76v86H82z" /><path className="wa-fine" d={lines(90, 22, 60, 6)} /><path className="wa-mark" d="M90 66h60" />
    <path className="wa-fine wa-blink" d={lines(90, 74, 46, 3, 6)} /><text x="152" y="80" className="wa-small">𝔐</text></>,
};

export function ChapterRow() {
  return <nav className="pr-ways" aria-label="In this study">
    <p className="pr-kicker">Six ways in</p>
    <ol>{CHAPTERS.map(c => <li key={c.n} style={{ '--tone': c.tone } as CSSProperties}><a href={`#${c.anchor}`}>
      <span className="pr-ways-kind">{c.n} · {c.kind}</span>
      <svg className="pr-ways-art" viewBox="0 0 240 110" aria-hidden="true"><ellipse className="wa-base" cx="120" cy="102" rx="78" ry="6" />{CHAPTER_ART[c.n]}</svg>
      <strong>{c.title}</strong><small>{c.text}</small>
      <span className="pr-ways-foot"><em>{c.foot}</em><i aria-hidden="true"><ArrowUpRight size={15} /></i></span>
    </a></li>)}</ol>
  </nav>;
}
