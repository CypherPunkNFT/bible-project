import { useEffect, useRef } from 'react';
import { award, current, next, reveal, select, teamScores } from './game';
import { Reveal } from './Reveal';
import type { Deck, Recent, Run } from './types';
export function RoundScreen({deck,run,recent,update}: {deck: Deck; run: Run; recent: Recent; update: (r:Run)=>void}) {
  const round=current(run), person=deck.people.find(p=>p.id===round.who)!;
  const result=useRef<HTMLHeadingElement>(null), first=useRef<HTMLButtonElement>(null);
  const isLast=run.mode==='solo' ? run.rounds.length===10 : run.rounds.length===deck.people.length;
  useEffect(()=>{ if (round.revealed) result.current?.focus(); else first.current?.focus(); },[round.revealed,round.who]);
  useEffect(()=>{
    function key(e: KeyboardEvent) {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.closest('input,textarea,select,a')))) return;
      const index='abc'.indexOf(e.key.toLowerCase()), n=Number(e.key)-1;
      if (run.mode==='solo' && !round.revealed && (index>=0 || (n>=0 && n<3))) {
        e.preventDefault(); update(select(run,round.ids[index>=0?index:n]));
      } else if (run.mode==='group' && round.revealed && n>=0 && n<run.teams.length) {
        e.preventDefault(); update(award(run,n));
      } else if (e.key==='Enter' || e.key===' ') {
        // Let focused buttons retain native keyboard behavior, avoiding two actions from one key.
        if (e.target instanceof HTMLButtonElement) return;
        if (round.revealed) { e.preventDefault(); update(next(deck,run,recent)); }
        else if (run.mode==='group' || (e.key==='Enter' && round.pick)) { e.preventDefault(); update(reveal(run)); }
      }
    }
    window.addEventListener('keydown',key); return ()=>window.removeEventListener('keydown',key);
  },[deck,run,recent,round,update]);
  return <section className={run.mode==='group'?'tt-group':''}>
    <p>{run.mode==='solo'?`Round ${run.rounds.length} of 10`:`Round ${run.rounds.length}`}</p>
    {run.teams.length>0 && <p role="status">{run.teams.map((t,i)=>`${t}: ${teamScores(run)[i]}`).join(' · ')}</p>}
    <h1>{person.label}</h1>
    {!round.revealed ? <>
      <p>Which statement was made up?</p>
      <div className="tt-statements">{round.ids.map((id,i)=>{
        const s=deck.statements.find(s=>s.id===id)!;
        return run.mode==='solo' ? <button key={id} ref={i===0?first:undefined} className="tt-statement" aria-pressed={round.pick===id} onClick={()=>update(select(run,id))}>{String.fromCharCode(65+i)}. {s.text}</button>
          : <p className="tt-statement" key={id}>{String.fromCharCode(65+i)}. {s.text}</p>;
      })}</div>
      {run.mode==='solo' && round.pick && <div role="group" aria-label="Confirm your choice"><p>Is this the made-up one?</p>
        <button autoFocus onClick={()=>update(reveal(run))}>Yes, that's the lie</button>
        <button onClick={()=>{ update({...run,rounds:[...run.rounds.slice(0,-1),{...round,pick:null}]}); first.current?.focus(); }}>Pick again</button></div>}
      {run.mode==='group' && <button ref={first} onClick={()=>update(reveal(run))}>Show the answer</button>}
    </> : <><Reveal deck={deck} round={round} ref={result}/>
      {run.teams.map((t,i)=><button key={i} aria-pressed={round.awards[i]} onClick={()=>update(award(run,i))}>{`${t} got it right`}</button>)}
      {run.mode==='group' && isLast && <p>That's every person in the deck.</p>}
      <button onClick={()=>update(next(deck,run,recent))}>{isLast ? run.mode==='solo'?'See your score':'Finish' : 'Next'}</button>
    </>}
    {run.mode==='group' && !isLast && <button onClick={()=>update({...run,over:true})}>Finish</button>}
  </section>;
}
