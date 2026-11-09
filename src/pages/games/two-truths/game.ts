import { deal } from './deal';
import type { Deck, Recent, Round, Run } from './types';
export const current = (run: Run) => run.rounds[run.rounds.length - 1];
export const correct = (deck: Deck, round: Round) => round.revealed && deck.statements.some(s => s.id === round.pick && s.kind === 'lie');
export const score = (deck: Deck, run: Run) => run.rounds.filter(r => correct(deck,r)).length;
export function newRun(deck: Deck, mode: Run['mode'], recent: Recent, teams: string[] = [], rng = Math.random): Run {
  const round=deal(deck,recent,[],rng);
  if (!round) throw Error('No playable rounds');
  const names=mode==='group' ? teams.slice(0,4).map((s,i)=>s.trim().slice(0,40)||`Team ${i+1}`) : [];
  return {id:crypto.randomUUID(),stamp:deck.stamp,mode,teams:names,rounds:[{...round,awards:names.map(()=>false)}],over:false,recorded:false};
}
export function select(run: Run, id: string): Run {
  const r=current(run);
  if (run.over || r.revealed || run.mode!=='solo' || !r.ids.includes(id)) return run;
  return {...run,rounds:[...run.rounds.slice(0,-1),{...r,pick:id}]};
}
export function reveal(run: Run): Run {
  const r=current(run);
  if (run.over || r.revealed || (run.mode==='solo' && !r.pick)) return run;
  return {...run,rounds:[...run.rounds.slice(0,-1),{...r,revealed:true}]};
}
export function award(run: Run, team: number): Run {
  const r=current(run);
  if (run.over || run.mode!=='group' || !r.revealed || team<0 || team>=run.teams.length) return run;
  return {...run,rounds:[...run.rounds.slice(0,-1),{...r,awards:r.awards.map((v,i)=>i===team ? !v:v)}]};
}
export function next(deck: Deck, run: Run, recent: Recent, rng = Math.random): Run {
  if (run.over || !current(run).revealed) return run;
  if (run.mode==='solo' && run.rounds.length>=10) return {...run,over:true};
  const round=deal(deck,recent,run.rounds.map(r=>r.who),rng);
  return round ? {...run,rounds:[...run.rounds,{...round,awards:run.teams.map(()=>false)}]} : {...run,over:true};
}
export const teamScores = (run: Run) => run.teams.map((_,i)=>run.rounds.filter(r=>r.revealed && r.awards[i]).length);
export const band = (n: number) => n===10 ? 'Perfect' : n>=8 ? 'Sharp eye' : n>=5 ? 'Well read' : 'Good start';
