import { StudyTrail } from "@/components/study/StudyTrail";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Compass } from 'lucide-react';
import { cities } from './evidence';
import { SourceDirectory } from './HistoryShared';
import './archaeological-journeys.css';
import './history-layout.css';
import { FormationLab, GrainPlot, ResearchTrail } from './CitiesEvidenceLab';

import { CitiesDesk } from './CitiesDesk';
import './cities-desk.css';

function SourceNote() { return <a className="cl-reference" href="https://doi.org/10.1017/S0033822200030666" target="_blank" rel="noopener noreferrer">Bruins & van der Plicht (1995), pp. 213–220 ↗<span className="sr-only"> (opens in a new tab)</span></a>; }
export default function CitiesThroughLayersPage() {
  const [answer,setAnswer] = useState<string | null>(null);
  useEffect(() => { const old = document.title; document.title = 'Cities through their layers · Bible Guide'; return () => { document.title = old; }; }, []);
  return <div className="ha-study ha-cities study-frame">
    <header className="ct-opening"><div><StudyTrail area="history"/><p className="ha-kicker">Buildings change. Evidence remains.</p><h1>Cities through<br/><em>their layers.</em></h1></div><div className="ct-invitation"><p className="ct-lead">A city is more than<br/>the moment it fell.</p><p>Explore a place through its rebuilding, ordinary life and surviving traces. Begin with what was found. Then ask what it can tell us.</p><a href="#section-explorer">Read a city from the ground up <ArrowDown size={17}/></a></div></header>
    <CitiesDesk/>
    <nav className="cl-reading-nav" aria-label="Study sections"><a href="#section-explorer">Investigate four cities</a><a href="#formation">Read the ground</a><a href="#dating">Evaluate dates</a><a href="#research-trail">Follow the scholarship</a></nav>
    <FormationLab/>
    <section className="ha-context" id="dating"><div><p className="ha-kicker">03 / From sequence to date</p><h2>Dates are arguments<br/><em>made from evidence.</em></h2><p>A deposit’s position, its contents and its formation history work together. No one method answers every question.</p></div><div className="ha-methods">{[
      ['Stratigraphy','A sealed floor predates what was laid on top of it. A later pit cuts older layers. Rebuilding, erosion and redeposition can disrupt a simple stack.'],
      ['Pottery and coins','Ceramic forms are compared with dated assemblages. A coin gives an earliest possible deposition date; it can circulate for decades or be moved into later fill.'],
      ['Radiocarbon','Dates the death of sampled organic material, then requires calibration to calendar ranges. Short-lived grain can be closer to an event than old timber; neither names an attacker.'],
      ['Inscriptions','Letterforms, language, named rulers and find context contribute to dating. A reused inscription has an original production date and a later deposition history.'],
    ].map(([title,text]) => <details key={title}><summary>{title}</summary><p>{text}</p></details>)}</div></section>
    <section className="ct-dating-lab" aria-labelledby="ct-grain-title"><div><p className="ha-kicker">Evidence close up / Jericho</p><h2 id="ct-grain-title">A laboratory date<br/><em>is not a calendar year.</em></h2><p>These six published cereal measurements let us inspect the evidence behind the destruction-date discussion. Each dot is a measurement; its whisker shows the reported laboratory uncertainty, not the duration of a historical event.</p><p>The 1995 paper’s calibration and a modern recalibration are different analyses. No new calendar probability curve is implied here.</p><SourceNote/></div><GrainPlot/></section>
    <section className="ha-question"><div><p className="ha-kicker">Apply the method / Test an interpretation</p><h2>You uncover a burned room.<br/><em>What can you say first?</em></h2></div><div><div className="ha-answer-options">{[['conquest','It must be the conquest named in the Bible.'],['fire','The deposit contains evidence of burning.'],['year','The newest coin gives the exact year of the fire.']].map(([id,text]) => <button key={id} type="button" aria-pressed={answer===id} onClick={() => setAnswer(id)}>{text}</button>)}</div>{answer && <p className="ha-answer" role="status">{answer==='fire' ? 'Yes. Start with the observed condition. Then test when the deposit formed, whether burning happened there, and what independent evidence bears on its cause.' : answer==='year' ? 'A coin gives an earliest possible date for a secure deposit, not an exact fire date. Check circulation, intrusion and context.' : 'A named conquest requires independent chronological and contextual support. Burning can result from attack, accident or other causes.'}</p>}</div></section>
    <ResearchTrail/>
    <SourceDirectory ids={cities.flatMap(c => c.layers.flatMap(l => [...l.sources,...l.finds.flatMap(f => f.sources)]))}/>
    <footer className="ha-next"><div><p className="ha-kicker">Continue in History & archaeology</p><h2>Put people back in the places.</h2></div><Link to="/study/world-of-jesus-and-apostles"><Compass size={20}/> The world of Jesus & the apostles <ArrowRight size={18}/></Link></footer>
  </div>;
}
