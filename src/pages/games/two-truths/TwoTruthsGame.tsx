import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteLanguage } from '@/lib/language';
import { useScrollTopOn } from '../kit';
import { eligiblePeople } from './deal';
import { newRun, score } from './game';
import { browserStore, readDevice, readRun, remember, saveRun, writeDevice } from './storage';
import { RoundScreen } from './Round';
import { Start, Summary } from './Screens';
import type { Deck, Run } from './types';
import '../games.css';
import './two-truths.css';

export default function TwoTruthsGame() {
  const language=useSiteLanguage(),[attempt,retry]=useState(0);
  const [loaded,setLoaded]=useState<{deck:Deck;english:boolean}|null>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{
    let active=true;setFailed(false);setLoaded(null);
    void import('@/data/two-truths/two-truths.json').then(module=>{
      // Static output validated by build-two-truths and its reproducibility/evidence tests.
      const english=module.default as unknown as Deck;
      if (active) setLoaded({deck:english,english:language!=='en'});
    }).catch(()=>{if(active)setFailed(true);});
    return ()=>{active=false;};
  },[language,attempt]);
  return <main className="tt-game"><Link className="gm-back" to="/games">All games</Link>
    {failed?<><p>The statements could not be loaded.</p><button type="button" className="tt-primary" onClick={()=>retry(n=>n+1)}>Try again</button></>
      :loaded?<Game key={`${language}:${loaded.deck.stamp}`} deck={loaded.deck} english={loaded.english}/>:<p role="status">Loading the statements…</p>}
  </main>;
}
export function Game({deck,english=false}: {deck:Deck;english?:boolean}) {
  const local=useMemo(()=>browserStore('localStorage'),[]),session=useMemo(()=>browserStore('sessionStorage'),[]);
  const [device,setDevice]=useState(()=>readDevice(local)),[run,setRun]=useState(()=>readRun(session,deck));
  // Page-only state, never saved: whether the result was reached on this page (so the count-up and the celebration play
  // once, not on a reload) and the best before this run was recorded (for the New best ribbon).
  const [fresh,setFresh]=useState(false),[bestBefore,setBestBefore]=useState(device.best);
  // A new screen (start, each round, the result) opens at the top; a saved game's return is left where it was.
  useScrollTopOn(run ? run.over ? `${run.id}:over` : `${run.id}:${run.rounds.length}` : 'start');
  function update(value: Run) {
    let d=device;
    if (value.rounds.length!==(run?.rounds.length??0)) d=remember(d,value);
    if (value.over && !run?.over) setFresh(true);
    if (value.over && value.mode==='solo' && !value.recorded) {
      if (!d.completed.includes(value.id)) {
        const points=score(deck,value);setBestBefore(d.best);
        d={...d,best:Math.max(d.best,points),games:d.games+1,total:d.total+points,completed:[...d.completed,value.id].slice(-100)};
      }
      value={...value,recorded:true};
    }
    writeDevice(local,d);setDevice(d);saveRun(session,value);setRun(value);
  }
  if (!run) return <Start device={device} english={english} available={eligiblePeople(deck).length} onPlay={(mode,teams)=>update(newRun(deck,mode,device,teams))}/>;
  if (run.over) return <Summary deck={deck} run={run} fresh={fresh} bestBefore={bestBefore} onAgain={()=>{saveRun(session,null);setRun(null);setFresh(false);}}/>;
  return <RoundScreen deck={deck} run={run} recent={device} update={update}/>;
}
