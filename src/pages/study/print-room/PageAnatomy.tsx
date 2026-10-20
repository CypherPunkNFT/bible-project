// Chapter 04's "Pages" view: an intro whose lifted page cycles through the six editions, three ways a page is built, and
// the inspector, which shows one edition either as one sheet or with its three layers lifted apart. Clicking a layer
// row opens its explanation; its Shown/Hidden switch takes it off the page. Drawings: page-anatomy.ts; styles: page-anatomy.css.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { EDITIONS, TONES, flatPage, layerSvg, sheetSvg, type AnatomyEdition } from './page-anatomy';
import './page-anatomy.css';

const ALL = [true, true, true];
const tone = (i: number) => ({ '--tone': TONES[i] }) as CSSProperties;
const svg = (markup: string) => ({ __html: markup });

/** Three plates, one per layer, stacked in 3D; the top plate is the main text. */
function Stack({ edition, visible }: { edition: AnatomyEdition; visible: boolean[] }) {
  return <>
    <div className="pa-stack">{edition.layers.map((layer, i) =>
      <div key={i} className="pa-plate" data-layer={i} data-off={!visible[i] || undefined} style={{ '--i': 2 - i, '--tone': TONES[i] } as CSSProperties}
        dangerouslySetInnerHTML={svg(sheetSvg(layerSvg(layer, i), false))}/>).reverse()}</div>
    <ol className="pa-legend">{edition.layers.map((layer, i) =>
      <li key={i} style={tone(i)} data-off={!visible[i] || undefined}><b>0{i + 1}</b>{layer.label}</li>)}</ol>
  </>;
}

/** The intro's lifted page: a new edition every few seconds, still under reduced motion. */
function HeroStack() {
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setAt(n => n + 1), 6500);
    return () => clearInterval(timer);
  }, []);
  const edition = EDITIONS[at % EDITIONS.length];
  return <>
    <div id="pa-hero-stack"><Stack key={at} edition={edition} visible={ALL}/></div>
    <figcaption><span className="pa-hero-top">One page · three layers</span>
      <span id="pa-hero-caption"><b>{edition.name}</b><span>{edition.date} · {edition.place}</span></span></figcaption>
  </>;
}

const WAYS = [
  ['bomberg', 'var(--poetry)', 'Venice · 1524', 'Text with a reading tradition', 'Masorah, targum and commentary surround the Hebrew text.'],
  ['complutensian', 'var(--prophets)', 'Alcalá · 1514', 'Languages alongside languages', 'A polyglot makes comparison visible; its columns do different jobs.'],
  ['bhq', 'var(--accent)', 'Stuttgart · 2004', 'Evidence beneath the text', 'An apparatus records alternatives without changing the main text.'],
] as const;

function Inspector({ editionId, choose }: { editionId: string; choose: (id: string) => void }) {
  const edition = EDITIONS.find(e => e.id === editionId) ?? EDITIONS[0];
  const [view, setView] = useState<'a' | 'b'>('b');
  const [visible, setVisible] = useState(ALL);
  const [reading, setReading] = useState(0);
  const [focus, setFocus] = useState('');
  useEffect(() => { setVisible(ALL); setReading(0); }, [edition.id]);
  const toggle = (i: number) => { setVisible(v => v.map((on, j) => j === i ? !on : on)); setReading(i); };
  // In the one-sheet view a hidden layer stays in the markup, marked off, so it fades rather than vanishing.
  const flat = flatPage(edition).replace(/data-layer="(\d)"/g, (match, i: string) => visible[+i] ? match : `${match} data-off="true"`);
  const layer = edition.layers[reading];
  return <section className="pa-inspect" id="pa-inspect" aria-labelledby="pa-inspect-title">
    <div className="pa-inspect-head">
      <div><p className="pa-kicker">Inspect a printed edition</p><h2 id="pa-inspect-title">Lift the layers, <em>one at a time</em></h2></div>
      <div className="pa-view" role="group" aria-label="How to draw the page">
        {([['b', 'Lifted apart'], ['a', 'One sheet']] as const).map(([key, name]) =>
          <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)}>{name}</button>)}
      </div>
    </div>
    <div className="pa-pills" role="radiogroup" aria-label="Edition">{EDITIONS.map(e =>
      <button key={e.id} type="button" role="radio" aria-checked={e.id === edition.id} onClick={() => choose(e.id)}>{e.pill}</button>)}</div>
    <div className="pa-panel">
      <div className="pa-art" data-view={view} data-focus={focus} onPointerLeave={() => setFocus('')}
        onPointerOver={event => setFocus((event.target as Element).closest<HTMLElement>('.pa-plate')?.dataset.layer ?? '')}>
        {view === 'a' ? <div className="pa-flat" dangerouslySetInnerHTML={svg(flat)}/> : <Stack edition={edition} visible={visible}/>}
        <p className="pa-art-meta"><span>{edition.place}</span><span>{edition.langs}</span></p>
      </div>
      <div className="pa-read" aria-live="polite">
        <p className="pa-kicker">{edition.date} / {edition.place}</p>
        <h3>{edition.name}</h3><p className="pa-people">{edition.people}</p>
        <div className="pa-rows">{edition.layers.map((l, i) =>
          <div key={i} className="pa-row" style={tone(i)} data-reading={reading === i || undefined} data-off={!visible[i] || undefined}>
            <button type="button" className="pa-row-read" onClick={() => setReading(i)}><i>0{i + 1}</i><span><b>{l.label}</b><small>{l.title}</small></span></button>
            <button type="button" className="pa-row-eye" aria-pressed={visible[i]} aria-label={`Show ${l.label}`} onClick={() => toggle(i)}>{visible[i] ? 'Shown' : 'Hidden'}</button>
          </div>)}</div>
        <div className="pa-explain" style={tone(reading)}><p className="pa-kicker">Layer {reading + 1} · {visible[reading] ? 'visible' : 'hidden'}</p>
          <h4>{layer.title}</h4><p>{layer.text}</p></div>
      </div>
    </div>
    <p className="pa-note">Functional diagrams in line art. Lines mark blocks of text; no letters, readings or source images are reproduced.</p>
  </section>;
}

export function PageAnatomy({ editionId, choose, switcher }: { editionId: string; choose: (id: string) => void; switcher: ReactNode }) {
  return <div className="pa">
    <section className="pa-landing" aria-labelledby="pa-title">
      <div className="pa-landing-copy">
        <p className="pa-kicker">04 · Read the architecture</p>
        <h2 className="pa-title" id="pa-title">A page is more than <em>its main text</em></h2>
        <p className="pa-lede">Open a printed Bible and the eye goes straight to the large type in the middle. But most pages carry
          several kinds of writing at once: headings, a translation beside the original, scribal notes, cross-references and, in
          modern editions, a band of evidence at the foot.</p>
        <p>Each layer was put there by someone, for a reason: a rubricator’s red initial, a Masorete’s note, a Latin column for
          comparison, an editor’s list of manuscripts that read differently.</p>
        <div className="pa-why"><p className="pa-kicker">Why it matters</p>
          <p>Mistake one layer for another and the argument goes wrong. A Latin column is not a second ancient witness; a
            cross-reference is not a variant. Telling the layers apart is the first skill in reading any edition.</p></div>
        <a className="pa-go" href="#pa-inspect">Take a page apart <i aria-hidden="true">↓</i></a>
        <div className="pa-switch">{switcher}</div>
      </div>
      <figure className="pa-hero" aria-label="A printed page with its three layers lifted apart">
        <svg className="pa-orbits" viewBox="0 0 600 600" aria-hidden="true"><ellipse cx="300" cy="320" rx="270" ry="210"/>
          <ellipse className="pa-orbit-2" cx="300" cy="320" rx="215" ry="250"/>
          <path className="pa-plus" d="M70 120h14M77 113v14M520 470h14M527 463v14M540 140h10M545 135v10"/></svg>
        <HeroStack/>
      </figure>
    </section>
    <dl className="pa-figures">
      <div><dt>Editions to take apart</dt><dd>{EDITIONS.length}</dd><small>from Mainz to Stuttgart</small></div>
      <div><dt>Span</dt><dd>1455–2012</dd><small>Gutenberg to NA28</small></div>
      <div><dt>Layers in each</dt><dd>3</dd><small>switch each off and on</small></div>
      <div><dt>Languages on one page</dt><dd>4</dd><small>the Complutensian Polyglot</small></div>
      <div><dt>Kinds of job</dt><dd>Text · aid · evidence</dd><small>what each layer is for</small></div>
    </dl>
    <section className="pa-ways" aria-labelledby="pa-ways-title">
      <p className="pa-kicker">Three ways a page is built</p>
      <h2 id="pa-ways-title">Same book, <em>different architecture</em></h2>
      <ol>{WAYS.map(([id, color, kind, title, text]) => <li key={id} style={{ '--tone': color } as CSSProperties}>
        <span className="pa-card-kind">{kind}</span><div className="pa-thumb" dangerouslySetInnerHTML={svg(flatPage(EDITIONS.find(e => e.id === id)!))}/>
        <strong>{title}</strong><small>{text}</small></li>)}</ol>
    </section>
    <Inspector editionId={editionId} choose={choose}/>
  </div>;
}
