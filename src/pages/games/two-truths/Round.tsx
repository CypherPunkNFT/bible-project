// A round: the trail of ten squares and the spotted count (the audit's item 3), the person, three statement cards, one
// filled "That's the lie" button to lock in (item 2), and at the reveal the cards turn over in place while the feedback
// band rises with the verdict and Next on the first screen (item 1). Group rounds show team chips and award toggles
// that tick the moment they are tapped (item 6). Every state changes at once; the motion only decorates it.
import { useEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from '@/lib/site-format';
import { FeedbackBand, ProgressTrail, TeamChips, trailMarks } from '../kit';
import { StatementCard } from './Cards';
import { award, correct, current, next, reveal, select, teamScores } from './game';
import { useRoundKeys } from './keys';
import { VerseFold } from './Reveal';
import { TEAM_TONES, tallyText, teamRows, teamTone } from './teams';
import type { Deck, Recent, Round, Run } from './types';

type Update=(r: Run)=>void;

export function RoundScreen({deck,run,recent,update}: {deck: Deck; run: Run; recent: Recent; update: Update}) {
  const round=current(run), person=deck.people.find(p=>p.id===round.who)!, solo=run.mode==='solo';
  const first=useRef<HTMLButtonElement>(null), opened=useRef(round.revealed ? round.who : null);
  const isLast=solo ? run.rounds.length===10 : run.rounds.length===deck.people.length;
  const right=correct(deck,round);
  const verdict=solo ? right ? 'You spotted it' : 'Not quite' : 'The answer';
  useEffect(()=>{ if (!round.revealed) first.current?.focus({preventScroll:true}); },[round.revealed,round.who]);
  useRoundKeys(deck,run,recent,update);
  const pickAgain=()=>{ update({...run,rounds:[...run.rounds.slice(0,-1),{...round,pick:null}]}); first.current?.focus({preventScroll:true}); };
  return <section className={`tt-round${solo?'':' tt-group'}`}>
    <RoundHead deck={deck} run={run}/>
    <h1 className="tt-person">{person.label}</h1>
    <p className="tt-ask" aria-hidden={round.revealed||undefined}>{round.revealed ? verdict : 'Which statement was made up?'}</p>
    <div className="tt-cards">{round.ids.map((id,i)=>{
      const s=deck.statements.find(s=>s.id===id)!, picked=round.pick===id;
      return <div key={id} className="tt-row">
        <StatementCard ref={i===0?first:undefined} index={i} text={s.text} kind={s.kind} revealed={round.revealed} picked={picked} onPick={solo?()=>update(select(run,id)):undefined}/>
        {picked && <span className="tt-pick">Your pick</span>}
        {round.revealed && <div className="tt-under">
          {s.kind==='lie' && <p className="tt-truth"><strong>The truth:</strong> {s.truth}</p>}
          <VerseFold statement={s} defaultOpen={s.kind==='lie'}/>
        </div>}
      </div>;
    })}</div>
    {solo && !round.revealed && round.pick && <div className="tt-lockin" role="group" aria-label="Confirm your choice">
      <button type="button" className="tt-primary" autoFocus onClick={()=>update(reveal(run))}>That's the lie</button>
      <button type="button" className="tt-plain" onClick={pickAgain}>Pick again</button></div>}
    {!solo && !round.revealed && <div className="tt-lockin"><button type="button" className="tt-primary" ref={first} onClick={()=>update(reveal(run))}>Show the answer</button></div>}
    <FeedbackBand open={round.revealed} tone={solo ? right ? 'right' : 'wrong' : null} focusAction={opened.current!==round.who} pinned="always" className="tt-band"
      verdict={<span className="tt-verdict">{verdict}</span>}
      action={<button type="button" className="tt-primary" onClick={()=>update(next(deck,run,recent))}>{isLast ? solo?'See your score':'Finish' : 'Next'}</button>}>
      {!solo && <Awards run={run} round={round} update={update}/>}
      <p className="tt-about"><span className="tt-muted">{person.tag}</span> <Link to={person.href}>{`More about ${person.label}`}</Link></p>
      {!solo && isLast && <p className="tt-muted">That's every person in the deck.</p>}
    </FeedbackBand>
    {!solo && !isLast && <button type="button" className="tt-plain tt-finish" onClick={()=>update({...run,over:true})}>Finish</button>}
  </section>;
}

/** The top of a round: the ten squares and the spotted count in solo play; the round number and the team chips in a group. */
function RoundHead({deck,run}: {deck: Deck; run: Run}) {
  if (run.mode==='solo') {
    const points=run.rounds.filter(r=>correct(deck,r)).length;
    return <header className="tt-head">
      <ProgressTrail marks={trailMarks(run.rounds.filter(r=>r.revealed).map(r=>correct(deck,r)?'right':'wrong'),10)} label={`Round ${run.rounds.length} of 10`} size=".85rem"/>
      <span className="tt-spotted" key={points}><strong>{formatNumber(points)}</strong><span>Spotted</span></span>
    </header>;
  }
  return <header className="tt-head tt-head--group">
    <p className="tt-round-no">{`Round ${run.rounds.length}`}</p>
    {run.teams.length>0 && <><TeamChips teams={teamRows(run)} tones={TEAM_TONES} label="Teams"/><p className="tt-sr" role="status">{tallyText(run)}</p></>}
  </header>;
}

/** The award toggles: a chip in the team's colour that fills and ticks the moment it is tapped (the step's special rule). */
function Awards({run,round,update}: {run: Run; round: Round; update: Update}) {
  const scores=teamScores(run);
  return <div className="tt-awards">{run.teams.map((t,i)=>
    <button type="button" key={i} className={`tt-award${round.awards[i]?' is-on':''}`} style={{'--_team':teamTone(i)} as CSSProperties}
      aria-pressed={round.awards[i]} onClick={()=>update(award(run,i))}>
      <span className="tt-award__mark" aria-hidden="true">{round.awards[i]?'✓':''}</span>{`${t} got it right`}
      <span className="tt-award__score" aria-hidden="true">{formatNumber(scores[i])}</span>
    </button>)}</div>;
}
