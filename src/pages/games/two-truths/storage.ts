import { combinations } from './deal';
import type { Deck, Recent, Run } from './types';
export interface Device extends Recent { best: number; games: number; total: number; teams: string[]; completed: string[] }
export type Store = Pick<Storage,'getItem'|'setItem'|'removeItem'> | null;
export const DEVICE_KEY='bp-two-truths', RUN_KEY='bp-two-truths-run';
export function browserStore(kind: 'localStorage'|'sessionStorage'): Store {
  try { return window[kind]; } catch { return null; }
}
const fresh = (): Device => ({best:0,games:0,total:0,people:[],statements:[],teams:[],completed:[]});
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(s=>typeof s==='string');
export function readDevice(store: Store): Device {
  try {
    const d=JSON.parse(store?.getItem(DEVICE_KEY)??'null');
    if (!d || !Number.isInteger(d.best) || d.best<0 || d.best>10 || !Number.isInteger(d.games) || d.games<0 || !Number.isInteger(d.total) || d.total<0 || d.total>d.games*10 || !strings(d.people) || !strings(d.statements) || !strings(d.teams)) return fresh();
    return {...d,people:d.people.slice(-40),statements:d.statements.slice(-300),teams:d.teams.slice(0,4).map((s:string)=>s.slice(0,40)),completed:strings(d.completed)?d.completed.slice(-100):[]};
  } catch { return fresh(); }
}
export function writeDevice(store: Store, d: Device): void { try { store?.setItem(DEVICE_KEY,JSON.stringify(d)); } catch { /* memory play still works */ } }
export function remember(d: Device, run: Run): Device {
  const r=run.rounds[run.rounds.length-1];
  return {...d,teams:run.teams,people:[...d.people.filter(id=>id!==r.who),r.who].slice(-40),statements:[...d.statements.filter(id=>!r.ids.includes(id)),...r.ids].slice(-300)};
}
export function saveRun(store: Store, run: Run | null): void {
  try { if (run) store?.setItem(RUN_KEY,JSON.stringify(run)); else store?.removeItem(RUN_KEY); } catch { /* optional persistence */ }
}
export function readRun(store: Store, deck: Deck): Run | null {
  try {
    const r=JSON.parse(store?.getItem(RUN_KEY)??'null') as Run;
    if (!r || r.stamp!==deck.stamp || !['solo','group'].includes(r.mode) || !strings(r.teams) || r.teams.length>4 || r.teams.length===1 || !Array.isArray(r.rounds) || !r.rounds.length || r.rounds.length>deck.people.length || (r.mode==='solo' && (r.rounds.length>10 || r.teams.length)) || typeof r.over!=='boolean' || typeof r.recorded!=='boolean') return null;
    if (typeof r.id!=='string' || r.id.length>100 || !r.id || r.teams.some(t=>t.length>40 || !t.trim()) || (r.recorded && (!r.over || r.mode!=='solo'))) return null;
    if (r.mode==='solo' && ((r.over && r.rounds.length!==10) || (!r.over && r.recorded))) return null;
    const used=new Set<string>();
    for (const [index,round] of r.rounds.entries()) {
      if (used.has(round.who) || !deck.people.some(p=>p.id===round.who) || !strings(round.ids) || round.ids.length!==3 || new Set(round.ids).size!==3) return null;
      used.add(round.who);
      if (!combinations(deck.statements.filter(s=>s.who===round.who)).some(c=>c.every(s=>round.ids.includes(s.id)))) return null;
      if (typeof round.revealed!=='boolean' || (round.pick!==null && !round.ids.includes(round.pick)) || (r.mode==='solo' && round.revealed && !round.pick) || !Array.isArray(round.awards) || round.awards.length!==r.teams.length || round.awards.some(v=>typeof v!=='boolean') || (index<r.rounds.length-1 && !round.revealed)) return null;
      if ((r.mode==='group' && round.pick!==null) || (!round.revealed && round.awards.some(Boolean)) || (r.mode==='solo' && r.over && !round.revealed)) return null;
    }
    return r;
  } catch { return null; }
}
