// The start screen (the audit's item 7): the game shown as a sample trio whose made-up card slowly turns over and
// back, Best / Played / Average as labelled numbers, a filled Play button, and the group setup behind one fold.
// The result card (item 4): the score counting up, the band line, the ten squares, New best, Share with a status line,
// Play again on the first screen, and the ten stories as fold-outs below. The group finish names the winner (item 6).
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatList, formatNumber } from '@/lib/site-format';
import { Confetti, MoreOptions, NewBestRibbon, ProgressTrail, ResultPanel, ScoreCountUp, ShareButton, TeamChips, WinnerLine, trailMarks } from '../kit';
import { band, correct, score } from './game';
import { Evidence } from './Reveal';
import { shareText } from './share';
import { TEAM_TONES, tallyText, teamRows } from './teams';
import type { Deck, Round, Run } from './types';
import type { Device } from './storage';

export function Start({device,onPlay,english,available}: {device: Device; onPlay: (mode:Run['mode'],teams:string[])=>void; english:boolean; available: number}) {
  const [count,setCount]=useState(0),[names,setNames]=useState(device.teams);
  const average=device.games ? formatNumber(device.total/device.games,{maximumFractionDigits:1}) : '—';
  return <section className="tt-start"><h1>Two truths and a lie</h1><p className="tt-lede">Three statements about a Bible character. Spot the one that was made up.</p>
    <Sample/>
    <dl className="tt-stats"><div><dt>Best</dt><dd>{formatNumber(device.best)}<span className="tt-of">/ 10</span></dd></div><div><dt>Played</dt><dd>{formatNumber(device.games)}</dd></div><div><dt>Average</dt><dd>{average}</dd></div></dl>
    <button type="button" className="tt-primary tt-play" disabled={available<10} onClick={()=>onPlay('solo',[])}>Play ten rounds</button>
    {available<10 && <p>Ten different people are needed for solo play. <Link to="/games">Back to games</Link></p>}
    {available===0 && <><p>No reviewed rounds are available.</p><button type="button" onClick={()=>window.location.reload()}>Try again</button></>}
    <MoreOptions summary="Set up a group" className="tt-setup">
      <fieldset><legend>Group teams (optional)</legend><label>Number of teams <select value={count} onChange={e=>setCount(Number(e.target.value))}>
        <option value={0}>No teams</option>{[2,3,4].map(n=><option key={n} value={n}>{n}</option>)}</select></label>
        {Array.from({length:count},(_,i)=><label key={i}>{`Team ${i+1} name`} <input maxLength={40} value={names[i]??`Team ${i+1}`} onChange={e=>setNames(Array.from({length:4},(_,j)=>j===i?e.target.value:names[j]??`Team ${j+1}`))}/></label>)}
      </fieldset><button type="button" className="tt-primary" disabled={available===0} onClick={()=>onPlay('group',Array.from({length:count},(_,i)=>names[i]??`Team ${i+1}`))}>Lead a group</button>
    </MoreOptions>
    <h2>How it works</h2><p>Every true statement is taken from a Bible verse, and every made-up one is shown against the verse that corrects it.</p>
    <p>Take your time. In a group, vote together before the leader shows the answer. Use A, B or C to choose, Enter to confirm, and Enter or Space to continue. Group leaders can use 1–4 to award teams after the reveal.</p>
    {english && <p>The statements and game controls are in English. Evidence is shown in the Berean Standard Bible (BSB).</p>}
  </section>;
}

/** A hand-written sample trio (never dealt from the deck, so no real lie is given away); the third card turns over on a slow loop. */
function Sample() {
  return <figure className="tt-sample" aria-hidden="true">
    <div className="tt-sample-card"><span className="tt-slot"><span className="tt-letter">A</span></span><span className="tt-text">Noah planted a vineyard</span></div>
    <div className="tt-sample-card"><span className="tt-slot"><span className="tt-letter">B</span></span><span className="tt-text">The ark came to rest on the mountains of Ararat</span></div>
    <div className="tt-sample-turn"><div className="tt-sample-inner">
      <div className="tt-sample-card tt-sample-front"><span className="tt-slot"><span className="tt-letter">C</span></span><span className="tt-text">Noah had four sons</span></div>
      <div className="tt-sample-card tt-sample-back"><span className="tt-slot"><span className="tt-mark">✗</span><span className="tt-kind">Made up</span></span><span className="tt-text"><s>Noah had four sons</s></span></div>
    </div></div>
  </figure>;
}

export interface SummaryProps {
  deck: Deck; run: Run; onAgain: () => void;
  /** True when the run has just ended on this page, so the count-up and the celebration play once and not on a reload. */
  fresh: boolean;
  /** The best before this run was recorded, for the New best ribbon. */
  bestBefore: number;
}

export function Summary({deck,run,onAgain,fresh,bestBefore}: SummaryProps) {
  const heading=useRef<HTMLHeadingElement>(null), solo=run.mode==='solo', points=score(deck,run);
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[]);
  const marks=trailMarks(run.rounds.filter(r=>r.revealed).map(r=>correct(deck,r)?'right':'wrong'),10,true);
  const rows=teamRows(run), top=Math.max(0,...rows.map(r=>r.score)), winners=rows.filter(r=>top>0 && r.score===top);
  return <ResultPanel className={`tt-result${fresh?' is-fresh':''}`}
    trail={solo && <ProgressTrail marks={marks} label={`${points} out of 10`} size="1.15rem" className={fresh && points>=8 ? 'kit-hop' : ''}/>}
    actions={<>{solo && <ShareButton text={shareText(deck,run)} game="Two truths" preview={false}/>}
      <button type="button" className="tt-primary" onClick={onAgain}>Play again</button><Link className="tt-plain" to="/games">Back to games</Link></>}
    reading={<Stories deck={deck} run={run}/>}>
    {solo ? <>
      <div className="tt-score-wrap"><ScoreCountUp value={points} of={10} ms={fresh?900:0} label={`${points} out of 10`}/><Confetti when={fresh && points===10} count={30}/></div>
      <h1 ref={heading} tabIndex={-1} className="tt-band-line">{band(points)}</h1>
      <NewBestRibbon when={fresh && points>bestBefore}/>
    </> : <>
      <h1 ref={heading} tabIndex={-1}>Group finished</h1>
      {winners.length>0 && <WinnerLine name={formatList(winners.map(w=>w.name))}/>}
      {rows.length>0 ? <><TeamChips teams={rows} tones={TEAM_TONES} label="Teams"/><p className="tt-sr" role="status">{tallyText(run)}</p></> : <p>Thanks for playing together.</p>}
    </>}
  </ResultPanel>;
}

function Stories({deck,run}: {deck: Deck; run: Run}) {
  const rounds=run.rounds.filter(r=>r.revealed);
  if (!rounds.length) return null;
  return <section className="tt-stories"><h2>The stories behind the answers</h2>
    <ol className="tt-recap">{rounds.map(r=><Story key={r.who} deck={deck} round={r} solo={run.mode==='solo'}/>)}</ol></section>;
}

/** One person's story as a fold-out; the verse is fetched only when it is opened. */
function Story({deck,round,solo}: {deck: Deck; round: Round; solo: boolean}) {
  const [open,setOpen]=useState(false);
  const person=deck.people.find(p=>p.id===round.who)!, lie=deck.statements.find(s=>round.ids.includes(s.id)&&s.kind==='lie')!;
  return <li><details className="tt-fold tt-story" open={open}>
    <summary onClick={e=>{e.preventDefault();setOpen(o=>!o);}}>
      {solo && <span className={`tt-dot ${correct(deck,round)?'is-right':'is-wrong'}`} aria-hidden="true"/>}<span className="tt-story-name">{person.label}</span></summary>
    {open && <div className="tt-story-body"><p><s>{lie.text}</s></p><p><strong>The truth:</strong> {lie.truth}</p><Evidence statement={lie}/>
      <Link to={person.href}>{`More about ${person.label}`}</Link></div>}
  </details></li>;
}
