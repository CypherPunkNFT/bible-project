import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { band, score, teamScores } from './game';
import { Evidence } from './Reveal';
import { shareResult, shareText } from './share';
import type { Deck, Run } from './types';
import type { Device } from './storage';
export function Start({device,onPlay,english,available}: {device: Device; onPlay: (mode:Run['mode'],teams:string[])=>void; english:boolean; available: number}) {
  const [count,setCount]=useState(0),[names,setNames]=useState(device.teams);
  return <section><h1>Two truths and a lie</h1><p>Three statements about a Bible character. Spot the one that was made up.</p>
    <p>{`Best: ${device.best} out of 10 · Games played: ${device.games} · Average: ${device.games?(device.total/device.games).toFixed(1):'—'}`}</p>
    <button disabled={available<10} onClick={()=>onPlay('solo',[])}>Play ten rounds</button>
    {available<10 && <p>Ten different people are needed for solo play. <Link to="/games">Back to games</Link></p>}
    {available===0 && <><p>No reviewed rounds are available.</p><button onClick={()=>window.location.reload()}>Try again</button></>}
    <fieldset><legend>Group teams (optional)</legend><label>Number of teams <select value={count} onChange={e=>setCount(Number(e.target.value))}>
      <option value={0}>No teams</option>{[2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
      {Array.from({length:count},(_,i)=><label key={i}>{`Team ${i+1} name`} <input maxLength={40} value={names[i]??`Team ${i+1}`} onChange={e=>setNames(Array.from({length:4},(_,j)=>j===i?e.target.value:names[j]??`Team ${j+1}`))}/></label>)}
    </fieldset><button disabled={available===0} onClick={()=>onPlay('group',Array.from({length:count},(_,i)=>names[i]??`Team ${i+1}`))}>Lead a group</button>
    <h2>How it works</h2><p>Every true statement is taken from a Bible verse, and every made-up one is shown against the verse that corrects it.</p>
    <p>Take your time. In a group, vote together before the leader shows the answer. Use A, B or C to choose, Enter to confirm, and Enter or Space to continue. Group leaders can use 1–4 to award teams after the reveal.</p>
    {english && <p>The statements and game controls are in English. Evidence is shown in the Berean Standard Bible (BSB).</p>}
  </section>;
}
export function Summary({deck,run,onAgain}: {deck:Deck;run:Run;onAgain:()=>void}) {
  const heading=useRef<HTMLHeadingElement>(null),[message,setMessage]=useState(''),[manual,setManual]=useState(false);
  const text=shareText(deck,run);
  useEffect(()=>{heading.current?.focus();},[]);
  return <section><h1 ref={heading} tabIndex={-1}>{run.mode==='solo'?`${score(deck,run)}/10 · ${band(score(deck,run))}`:'Group finished'}</h1>
    {run.mode==='group' && <p>{run.teams.map((t,i)=>`${t}: ${teamScores(run)[i]}`).join(' · ')||'Thanks for playing together.'}</p>}
    {run.mode==='solo' && <button onClick={()=>{void shareResult(text).then(result=>{setManual(result==='manual');setMessage(result==='copied'?'Copied':result==='shared'?'Shared':'');});}}>Share</button>}
    <p role="status">{message}</p>{manual && <textarea readOnly aria-label="Score to copy" value={text}/>}
    <h2>The stories behind the answers</h2>
    <ol className="tt-recap">{run.rounds.filter(r=>r.revealed).map(r=>{
      const person=deck.people.find(p=>p.id===r.who)!;
      const lie=deck.statements.find(s=>r.ids.includes(s.id)&&s.kind==='lie')!;
      return <li key={r.who}><h3><Link to={person.href}>{person.label}</Link></h3><p><s>{lie.text}</s></p><p><strong>The truth:</strong> {lie.truth}</p><Evidence statement={lie}/></li>;
    })}</ol><button onClick={onAgain}>Play again</button><Link to="/games">Back to games</Link>
  </section>;
}
