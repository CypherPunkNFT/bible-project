import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import data from "@/data/teachers/scholars.json";
import type { ScholarsData } from "@/data/teachers/pages-types";
import { buildSky } from "@/pages/teachers/scholars/landing/layout";
import { fieldShape, initials, FIELD_TONE, type ShapeGeometry } from "@/pages/teachers/scholars/marks/shapes";
import { WRITERS } from "./writers";
import { WriterArt } from "./Artwork";
import { Icon, StudyLink } from "./shared";
const catalogue = data as unknown as ScholarsData;
const sky = buildSky(catalogue, "wide");
const fields = [
    { id: 'history', label: 'History', names: 'Josephus · Tacitus · Eusebius' },
    { id: 'texts', label: 'Languages', names: 'Westcott · Lightfoot · A. T. Robertson' },
    { id: 'places', label: 'Archaeology', names: 'Ramsay · Robinson · Albright' },
    { id: 'reference', label: 'Reference', names: 'Strong · Easton · Torrey' },
    { id: 'theology', label: 'Theology', names: 'Augustine · Anselm · Aquinas' },
] as const;
function Shape({ geometry: g }: {
    geometry: ShapeGeometry;
}) { return g.kind === 'circle' ? <circle cx={g.cx} cy={g.cy} r={g.r}/> : g.kind === 'rect' ? <rect x={g.x} y={g.y} width={g.width} height={g.height} rx={g.rx}/> : <path d={g.d}/>; }
function ScholarArt({ selected }: {
    selected: string;
}) {
    const ref = useRef<SVGSVGElement>(null);
    useLayoutEffect(() => {
        let active = true;
        function fit() {
            if (!active)
                return;
            ref.current?.querySelectorAll<SVGGElement>('.scholar-group-label').forEach((label, i) => {
                const f = sky.fields[i], text = label.querySelector('text')!, width = text.getComputedTextLength() + 46;
                const rect = label.querySelector('rect')!;
                rect.setAttribute('x', String(-width / 2));
                rect.setAttribute('width', String(width));
                label.querySelector('.scholar-label-icon')!.setAttribute('transform', `translate(${-width / 2 + 8} -6) scale(.25)`);
                label.setAttribute('transform', `translate(${Math.max(width / 2 + 3, Math.min(sky.w - width / 2 - 3, f.mx))} ${Math.min(sky.h - 12, f.bottom + sky.size / 2 + 18)})`);
            });
        }
        fit();
        void document.fonts.ready.then(fit);
        return () => { active = false; };
    }, []);
    return <svg ref={ref} viewBox={`0 0 ${sky.w} ${sky.h}`} aria-hidden><defs>{sky.fields.map(f => <radialGradient key={f.field} id={`hub-glow-${f.field}`}><stop stopColor={`var(${FIELD_TONE[f.field]})`} stopOpacity=".13"/><stop offset="1" stopColor={`var(${FIELD_TONE[f.field]})`} stopOpacity="0"/></radialGradient>)}</defs>{sky.fields.map(f => <g key={f.field} className={`scholar-group ${selected !== 'all' && selected !== f.field ? 'dim' : ''}`} style={{ color: `var(${FIELD_TONE[f.field]})` }}>
 <circle cx={f.mx} cy={f.my} r={f.r * 1.15} fill={`url(#hub-glow-${f.field})`}/><polyline className="scholar-thread" points={f.own.map(n => `${n.x},${n.y}`).join(' ')}/>
 {f.own.map(n => <g key={n.s.id} className="scholar-mark" transform={`translate(${n.x} ${n.y})`}><g transform={`translate(${-sky.size / 2} ${-sky.size / 2}) scale(${sky.size / 48})`}><g className="scholar-mark-outer"><Shape geometry={fieldShape(f.field, 1)}/></g><g className="scholar-mark-inner"><Shape geometry={fieldShape(f.field, .82)}/></g><text className="scholar-initials" x="24" y="25" textAnchor="middle" dominantBaseline="central" style={{ fontSize: initials(n.s).length > 1 ? 15.5 : 21 }}>{initials(n.s)}</text></g>{n.s.site?.status === 'in-use' && <circle className="scholar-used" cx={sky.size / 2 - 5} cy={-sky.size / 2 + 5} r="4.5"/>}</g>)}
 <g className="scholar-group-label"><rect y="-12" height="23" rx="11"/><g className="scholar-label-icon"><Shape geometry={fieldShape(f.field, 1)}/></g><text x="9" y="3" textAnchor="middle">{catalogue.fields[f.field].toUpperCase()} <tspan className="scholar-count">{f.own.length}</tspan></text></g></g>)}</svg>;
}
export function PeopleCards() {
    const [writer, setWriter] = useState(0), [field, setField] = useState('all');
    return <section className="hub-section" id="voices" aria-labelledby="voices-title"><div className="section-heading"><div><p className="eyebrow">01 / The people behind the pages</p><h2 id="voices-title">Meet the writers.<br /><em>Follow their work.</em></h2></div><p>Enter through a life, then follow the books, ideas and questions that make their work worth exploring.</p></div><div className="people-pair">
 <article className="people-feature writers"><div className="feature-kicker"><span>Writers of Scripture</span><span>Lives → Books → Studies</span></div><h3>Scripture &amp; Theology</h3><p>Prophets, poets, Gospel writers and apostles. Meet the people associated with the biblical books, and follow their words into Scripture.</p><div className="writers-art" id="writers-art"><WriterArt index={writer}/></div><div className="people-footer"><div className="writer-tabs" role="group" aria-label="Choose a writer">{WRITERS.map((w, i) => <button key={w.id} data-writer={i} aria-pressed={writer === i} onClick={() => setWriter(i)}>{w.name}</button>)}</div><StudyLink className="feature-link" to="/study/theology?area=people#writer-preview"><span className="feature-action-label">Explore the writers<br />of Scripture</span><span className="door-arrow"><Icon name="arrow"/></span></StudyLink></div></article>
 <article className="people-feature scholars"><div className="feature-kicker"><span>Scholars</span><span>Lives → Works → Studies</span></div><h3>Academic Studies</h3><p>Historians, translators, archaeologists and theologians. Meet the people whose questions and careful work help us understand the Bible.</p><div className="scholar-art" id="scholar-art"><ScholarArt selected={field}/></div><div className="people-footer"><div className="scholar-fields" id="scholar-fields" role="group" aria-label="Explore scholars by field"><button data-field="all" style={{ '--field-tone': 'var(--history)' } as CSSProperties} aria-pressed={field === 'all'} onClick={() => setField('all')}>All fields</button>{fields.map(f => <button key={f.id} data-field={f.id} style={{ '--field-tone': `var(${FIELD_TONE[f.id]})` } as CSSProperties} aria-pressed={field === f.id} onClick={() => setField(f.id)}>{f.label}</button>)}</div><StudyLink className="feature-link" to="/teachers/scholars"><span className="feature-action-label">Explore Scholars</span><span className="door-arrow"><Icon name="arrow"/></span></StudyLink></div></article>
 </div></section>;
}
