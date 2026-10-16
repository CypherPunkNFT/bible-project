import { useState } from 'react';
import { Link } from 'react-router-dom';
import { grainMeasurements, investigations, research } from './cities-research';
import './cities-evidence-lab.css';

function Reference({ id }: { id: string }) {
  const s = research.find(r => r.id === id)!;
  return <a className="cl-reference" href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗<span className="sr-only"> (opens in a new tab)</span></a>;
}

const steps = [
  { title: 'Lay a floor', text: 'A floor seals an earlier deposit. What lies beneath is earlier than the floor’s construction, provided the relationship is undisturbed. Thickness does not measure elapsed time.', finding: 'We have a relative order, not a calendar date.' },
  { title: 'A room burns', text: 'Charcoal and damaged material accumulate above the floor. First establish whether they burned here or were brought in as rubble. An ash-rich deposit is not automatically a named military campaign.', finding: 'An observed deposit and its cause are separate claims.' },
  { title: 'Dig a later pit', text: 'The pit cuts through the burn deposit and floor. Its bottom is physically low but chronologically late. The cut is an event; the material later filling it is another.', finding: 'Lower does not always mean older.' },
  { title: 'Fill and rebuild', text: 'Older sherds can be moved into the pit’s fill. Archaeologists call these residual finds. A younger object can also enter an older deposit through a later disturbance; that is intrusion.', finding: 'The age of an object is not automatically the age of its deposit.' },
];

export function FormationLab() {
  const [step, setStep] = useState(2);
  return <section className="cl-lab" id="formation" aria-labelledby="cl-formation-title">
    <div className="cl-heading"><p className="ha-kicker">02 / Learn to read a section</p><h2 id="cl-formation-title">The ground is a sequence<br/><em>of actions.</em></h2><p>Before asking who lived here, ask how this deposit came to be. Build a small, imaginary excavation and watch a later event reach into older ground.</p></div>
    <div className="cl-lab-body"><div className="cl-controls" role="group" aria-label="Stages of deposit formation">{steps.map((s,i) => <button key={s.title} type="button" aria-pressed={step===i} onClick={() => setStep(i)}><span>0{i+1}</span>{s.title}</button>)}</div>
      <svg className="cl-trench" viewBox="0 0 640 270" role="img" aria-label={`Illustrative section: ${steps[step].title}. ${steps[step].finding}`}>
        <path d="M24 115H616V246H24Z" fill="currentColor" opacity=".08"/><path d="M24 246H616" stroke="currentColor" opacity=".35"/>
        <path d="M24 172H616" stroke="currentColor" strokeWidth="8" opacity=".65"/>
        {step>=1 && <path d="M24 135l35 -8 29 9 43 -11 41 9 46 -6 39 5 57 -8 33 10 51 -8 34 6 43 -8 40 9 54 -5 51 7v31H24Z" fill="currentColor" opacity=".25"/>}
        {step>=2 && <><path d="M380 100L403 216Q448 246 495 216L520 100" fill="var(--surface)" stroke="currentColor" strokeWidth="2" strokeDasharray={step===2?'5 4':undefined}/>{step===3 && <><path d="M382 110L405 216Q448 242 493 216L518 110Z" fill="currentColor" opacity=".18"/><path d="m436 208 14 -7 9 9 -16 5Z" fill="currentColor"/><path d="M24 102H616" stroke="currentColor" strokeWidth="7"/></>}</>}
        <text x="32" y="225">Earlier deposit</text><text x="32" y="193">Floor</text>{step>=1 && <text x="32" y="151">Burn deposit</text>}{step>=2 && <text x="393" y="76">Later pit ↓</text>}{step===3 && <text x="32" y="88">Rebuilt surface</text>}
      </svg>
      <p className="cl-caption">Teaching model · invented geometry · no depth or time scale</p>
      <div className="cl-lab-explanation" aria-live="polite"><strong>{steps[step].finding}</strong><p>{steps[step].text}</p></div>
      <div className="cl-sequence" aria-label="Relative sequence, oldest to youngest"><span>Earlier deposit</span><b>→</b><span>Floor</span>{step>=1 && <><b>→</b><span>Burn deposit</span></>}{step>=2 && <><b>→</b><span>Pit cut</span></>}{step===3 && <><b>→</b><span>Pit fill</span><b>→</b><span>Rebuilding</span></>}</div>
      <p className="cl-caption">A simplified relationship chain, read left to right; real Harris matrices can branch. <Reference id="harris"/></p>
    </div>
  </section>;
}

export function CityProfile({ city, index, overlay }: { city:string; index:number; overlay:boolean }) {
  return <figure className="cl-profile"><svg viewBox="0 0 500 230" role="img" aria-label={`${city}: selected context ${index+1}. Schematic teaching illustration, not an excavated plan or measured section.`}>
    <path d="M25 190H475M25 205H475" stroke="currentColor" opacity=".25"/>
    {city==='jericho' ? <><path d={index===2?'M185 185V110Q240 80 295 110V185Z':'M65 185L160 130H320L420 185Z'} fill="currentColor" fillOpacity=".13" stroke="currentColor" strokeWidth="2"/>{index===2?<path d="M218 180v-13h12v-13h12v-13h12v-13" fill="none" stroke="currentColor"/>:<><path d="M160 130V90h24v40M296 130V90h24v40" stroke="currentColor" strokeWidth="3"/>{index===0 && <path d="m194 156 16 -12 11 14 16 -9 20 12 20 -11 17 8" fill="none" stroke="currentColor" strokeWidth="5"/>}</>}</>:
    city==='lachish'?<><path d="M50 185l100 -55h210l85 55M165 130V85h28v45M305 130V85h28v45" fill="none" stroke="currentColor" strokeWidth="3"/>{index===1 && <path d="M35 185l125 -75v20Z" fill="currentColor" opacity=".3"/>}{index===2 && <><path d="M205 160h92" stroke="currentColor" strokeWidth="4"/><circle cx="250" cy="151" r="4" fill="currentColor"/></>}</>:
    city==='jerusalem'?<><path d="M65 185V130h115v55M80 150h85M285 185V105h110v80" fill="none" stroke="currentColor" strokeWidth="3"/>{index===1?<path d="M315 185v-12h17v-12h17v-12h17" fill="none" stroke="currentColor" strokeWidth="2"/>:<path d="M310 185v-30h60v30M312 166h56" stroke="currentColor" fill="currentColor" fillOpacity=".1"/>}<path d="M231 80l-10 25 20 25 -20 25 20 25" stroke="currentColor" strokeDasharray="3 4" fill="none"/></>:
    <><path d="M65 185V85h20v100M120 185V85h20v100M60 85h85M235 185v-18h170v18M250 167v-18h140v18" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity=".08"/>{index===0 && <path d="M270 149v-35l50 -28 50 28v35" fill="none" stroke="currentColor" strokeWidth="2"/>}</>}
    {overlay && <path d="M50 185V65L245 25 445 65V185M50 65H445" fill="none" stroke="currentColor" strokeDasharray="6 6" opacity=".5"/>}
  </svg><figcaption>{city==='jerusalem'?'Separated locations, not vertically superimposed buildings. ':''}Original schematic forms; geometry and spacing are invented. {overlay?'Dashed envelope is hypothetical.':''}</figcaption></figure>;
}

export function GrainPlot() {
  const [selected,setSelected]=useState(0);
  const sample=grainMeasurements[selected];
  const x=(n:number)=>145+(n-3200)/220*425;
  return <div className="cl-grains"><h4>Six measurements. One context question.</h4><p>Published cereal measurements; whiskers show ±1σ laboratory uncertainty. BP means radiocarbon years before 1950, not calendar BCE.</p><div className="cl-plot-scroll"><svg viewBox="0 0 620 300" role="img" aria-label="Six cereal measurements ranging from 3240 to 3375 radiocarbon years BP, with laboratory errors of 14 to 25 years. Exact values are available in the sample buttons below.">
    {[3200,3250,3300,3350,3400].map(n=><g key={n}><path d={`M${x(n)} 20V244`} stroke="currentColor" opacity=".12"/><text x={x(n)} y="266" textAnchor="middle">{n}</text></g>)}
    {grainMeasurements.map((m,i)=><g key={m.id} className={selected===i?'cl-selected-mark':''} opacity={selected===i?1:.5}><text x="8" y={43+i*34}>{m.id}</text><path d={`M${x(m.bp-m.error)} ${38+i*34}H${x(m.bp+m.error)}M${x(m.bp-m.error)} ${33+i*34}v10M${x(m.bp+m.error)} ${33+i*34}v10`} stroke="currentColor" strokeWidth="2"/><circle cx={x(m.bp)} cy={38+i*34} r="5" fill="currentColor"/></g>)}<text x="350" y="292" textAnchor="middle">Radiocarbon years BP · older →</text>
    </svg></div><div className="cl-mobile-plot" aria-hidden="true"><div className="cl-mobile-axis"><span>Sample</span><span>3200 ← BP → 3420</span></div>{grainMeasurements.map((m,i)=><div className={selected===i?"is-active":""} key={m.id}><span>{m.id}</span><div className="cl-mobile-track"><i style={{left:((m.bp-m.error-3200)/220*100)+"%",width:(m.error*2/220*100)+"%"}}/><b style={{left:((m.bp-3200)/220*100)+"%"}}/></div></div>)}</div><div className="cl-sample-buttons" role="group" aria-label="Inspect a grain measurement">{grainMeasurements.map((m,i)=><button type="button" key={m.id} aria-pressed={selected===i} onClick={()=>setSelected(i)}>{m.id}<small>{m.bp} ± {m.error} BP</small></button>)}</div><p className="cl-sample-detail" aria-live="polite"><strong>{sample.material} · {sample.id}</strong> — {sample.bp} ± {sample.error} BP. This is a measurement of organic material, not a dated inscription naming a conquest.</p></div>;
}

export function CityInvestigation({city}:{city:string}) {
  const item=investigations[city];
  const [revealed,setRevealed]=useState(false);
  return <section className="cl-investigation" aria-labelledby="cl-case-title"><p className="ha-kicker">Close investigation / {city}</p><h3 id="cl-case-title">{item.question}</h3><div className="cl-case-columns"><div><h4>Inspect the evidence</h4><p>{item.observation}</p><div className="cl-object-life" aria-label="Conceptual sequence, not a proportional timeline">{item.stages.map((s,i)=><div key={s}><span>{i+1}</span>{s}</div>)}</div><p className="cl-caption">Sequence of events or processes · spacing does not encode duration</p></div><div><button className="cl-reveal" type="button" aria-expanded={revealed} aria-controls="cl-reasoning" onClick={()=>setRevealed(!revealed)}>{revealed?'Close the argument':'Follow the argument'} <span>{revealed?'−':'+'}</span></button><div id="cl-reasoning" hidden={!revealed}><h4>From observation to inference</h4><p>{item.reasoning}</p></div><h4>What remains uncertain</h4><p>{item.limit}</p><p className="cl-takeaway">{item.implication}</p></div></div>{city==='jericho' && <GrainPlot/>}<Reference id={item.source}/></section>;
}

export function ResearchTrail() {
  return <section className="cl-research" id="research-trail"><div className="cl-heading"><p className="ha-kicker">04 / How understanding changes</p><h2>A field built through<br/><em>revision.</em></h2><p>Excavation destroys the deposits it records. Plans, notebooks, sample labels and published assemblages let later scholars ask questions the original excavators could not.</p></div>
    <div className="cl-history"><article><span>Recording</span><h3>From a monument to its relationships</h3><p>Harris’s work makes the sequence itself an object of analysis. A floor, a cut and a fill need separate records. A visually convincing reconstruction cannot substitute for those relationships.</p><Reference id="harris"/></article><article><span>Re-examination</span><h3>Old archives, new questions</h3><p>Kenyon’s preserved Jericho material made later laboratory work possible. Renewed Italian–Palestinian work also brings older trenches into dialogue with new excavation and conservation. The site’s history includes homes, water and collective labor, not only the question of conquest.</p><Reference id="nigro"/></article><article><span>Context and scale</span><h3>From a sample to a city</h3><p>Recent dating projects can sharpen a sequence. They cannot eliminate the need to explain whether the dated material belongs to a construction, a period of use, or later fill. Evidence from one trench also needs justification before it is extended across a city.</p><Reference id="jerusalem2024"/></article></div>
    <div className="cl-perspectives"><h3>Whose city survives in the record?</h3><p>Palaces and fortifications make rulers visible. Storage jars, cooking vessels, drains and repairs ask about provision, labor and repeated use. A wealthy house is evidence for one part of society; it is not an average household. Excavated space is a sample shaped by access, preservation, earlier digging and modern settlement.</p><p>Hebrew and Aramaic inscriptions, Greek and Latin civic records, and Assyrian royal representations have different audiences and purposes. A text’s named place can anchor an identification while its rhetoric still needs interpretation. Jewish and Christian readings may ask theological questions of a biblical passage; an archaeological date does not by itself decide those questions.</p><p>British, Palestinian, Italian, Israeli, Greek and international research traditions appear in the sources here. Their publications should be compared through methods and contexts, rather than treated as interchangeable national positions.</p></div>
    <h3 className="cl-reading-title">Works to read, and what they contribute</h3><div className="cl-bibliography">{research.map(s=><article key={s.id}><div><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗<span className="sr-only"> (opens in a new tab)</span></a><small>{s.date}</small></div><div><p>{s.contribution}</p><p className="cl-access">Access record: {s.access}</p></div></article>)}</div>
    <div className="cl-open-questions"><h3>The next questions</h3><p>How securely are samples tied to their deposits? Which buildings share a phase? What survives outside the excavated area? Could a proposed historical identification explain the evidence better than other causes?</p><p>Research gaps: the Jerusalem supplementary models, Romano’s full object catalogue, Kenyon’s complete final reports and modern recalibration of the Jericho samples have not been independently reviewed for this expansion. No new calendar probability curve or measured city plan is claimed.</p><Link to="/study/discoveries-biblical-record">Continue with objects and inscriptions in Discoveries & the biblical record →</Link></div>
  </section>;
}
