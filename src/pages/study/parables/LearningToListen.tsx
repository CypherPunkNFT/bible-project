import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const practices = [
  ['Start with who is listening', 'Read the question, complaint or encounter before the story. Luke 15:1–2 makes the celebration of the lost intelligible; Luke 18:9 names the self-trust that the two prayers expose.'],
  ['Notice the surprise before solving the symbols', 'Ask what changes: who acts, who receives mercy, who protests, and where the ending turns. When Jesus gives an explanation, as with the sower and the weeds, begin there.'],
  ['Let each Gospel keep its own voice', 'The sheep in Matthew 18 and Luke 15 share an image but appear in different conversations. The comparison tabs preserve those settings. A parallel passage is not proof of a single reconstructed occasion.'],
  ['Bring the question back to your own life', 'Distinguish what the text says, your interpretation and your application. Read the closing words as carefully as the opening scene. Some stories leave the hearer to answer.'],
];

function ListeningArt() {
  return <svg className="pb-listening-art" viewBox="0 0 520 260" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="260" cy="123" r="88" opacity=".13"/>
      <circle cx="260" cy="123" r="109" strokeDasharray="1 8" opacity=".24"/>
      <path d="M260 103Q214 80 155 96V198Q211 182 260 204Q309 182 365 198V96Q306 80 260 103Z" fill="currentColor" fillOpacity=".035"/>
      <path d="M260 103V204M155 104L142 111V211Q205 194 260 217Q315 194 378 211V111L365 104M260 217V227"/>
      {[0,1,2,3].map(i=><g key={i} opacity={.5-i*.08}><path d={`M174 ${119+i*18}Q211 ${111+i*18} 241 ${124+i*18}M279 ${124+i*18}Q309 ${111+i*18} 346 ${119+i*18}`}/></g>)}
      <path d="M260 84V57M238 79L221 61M282 79L299 61" opacity=".6"/>
      <path d="M246 39Q260 20 274 39Q260 60 246 39Z"/>
      <circle cx="260" cy="39" r="3" fill="currentColor"/>
      <path d="M111 98Q82 134 111 170M96 86Q54 134 96 182M409 98Q438 134 409 170M424 86Q466 134 424 182" opacity=".4"/>
      <path d="M65 225Q158 210 210 231M310 231Q371 211 455 225" opacity=".2"/>
      {[ [115,57],[405,57],[88,209],[432,209] ].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="3" fill="currentColor" fillOpacity=".3"/><circle cx={x} cy={y} r="8" opacity=".25"/></g>)}
    </g>
  </svg>;
}

export function LearningToListen() {
  return <section className="pb-method" aria-labelledby="pb-method-title">
    <div className="pb-section-heading"><span className="pb-number">III</span><h2 id="pb-method-title">Learning to listen</h2><span>Keep the story in its setting</span></div>
    <div className="pb-method-grid">
      <div><span className="pb-kicker">Why stories?</span><h3>A parable can reveal.<br/>It can also confront.</h3><p>When the disciples ask why Jesus speaks in parables, his answer includes both understanding and failure to perceive. These are invitations to attentive listening, and searching challenges to the listener.</p><Link to="/read/kjv/MAT/13?hl=10-17">Read Matthew 13:10–17 <ArrowUpRight size={14} aria-hidden="true"/></Link></div>
      <div className="pb-listening-scene"><ListeningArt/><span>Hear the story · Hold the question</span></div>
    </div>
    <div className="pb-practice-grid">{practices.map(([title,text],i)=><article className="pb-practice" key={title}><span className="pb-practice-number">0{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
  </section>;
}
