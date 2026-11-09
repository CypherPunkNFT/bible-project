import raw from '@/data/two-truths/two-truths.json';
import { award, band, current, newRun, next, reveal, score, select, teamScores } from './game';
import { readDevice, readRun, remember, RUN_KEY, saveRun, writeDevice } from './storage';
import { shareText } from './share';
import type { Deck } from './types';
const deck=raw as unknown as Deck,recent={people:[],statements:[]};
beforeEach(()=>{localStorage.clear();sessionStorage.clear();});
it('requires confirmation, locks the answer and finishes exactly ten rounds',()=>{
  let run=newRun(deck,'solo',recent);
  for(let i=0;i<10;i++) {
    expect(next(deck,run,recent)).toBe(run);
    expect(reveal(run)).toBe(run);
    const lie=deck.statements.find(s=>current(run).ids.includes(s.id)&&s.kind==='lie')!;
    run=select(run,lie.id);expect(current(run).revealed).toBe(false);
    run=reveal(run);expect(select(run,current(run).ids[0])).toBe(run);
    run=next(deck,run,recent);
  }
  expect(run.over).toBe(true);expect(run.rounds).toHaveLength(10);expect(score(deck,run)).toBe(10);
  const text=shareText(deck,run);expect(text).toContain('10/10');expect(text).toContain('🟩'.repeat(10));
  for(const s of deck.statements) expect(text).not.toContain(s.text);
});
it('rejects corrupt phases, premature scores, oversized names, unrevealed awards and group picks',()=>{
  const group=newRun(deck,'group',recent,['One','Two']);
  const corrupt=[{...group,recorded:true},{...group,teams:['x'.repeat(41),'Two']},
    {...group,rounds:[{...current(group),awards:[true,false]}]},
    {...group,rounds:[{...current(group),pick:current(group).ids[0]}]}];
  for(const run of corrupt) {saveRun(sessionStorage,run);expect(readRun(sessionStorage,deck)).toBeNull();}
  const solo=newRun(deck,'solo',recent);saveRun(sessionStorage,{...solo,over:true});
  expect(readRun(sessionStorage,deck)).toBeNull();
  localStorage.setItem('bp-two-truths',JSON.stringify({best:10,games:1,total:11,people:[],statements:[],teams:[]}));
  expect(readDevice(localStorage).games).toBe(0);
});
it('toggles team awards at most once per team per round, and accepts no solo picks',()=>{
  let run=newRun(deck,'group',recent,['One','Two']);
  expect(award(run,0)).toBe(run);expect(select(run,current(run).ids[0])).toBe(run);
  run=award(reveal(run),0);expect(teamScores(run)).toEqual([1,0]);run=award(run,0);expect(teamScores(run)).toEqual([0,0]);
});
it('restores the dealt order and pick, drops stale or malformed saves, and tolerates blocked storage',()=>{
  let run=newRun(deck,'solo',recent);run=select(run,current(run).ids[0]);saveRun(sessionStorage,run);
  expect(readRun(sessionStorage,deck)).toEqual(run);expect(readRun(sessionStorage,{...deck,stamp:'new'})).toBeNull();
  sessionStorage.setItem(RUN_KEY,JSON.stringify({...run,rounds:[{...current(run),ids:['bad','bad','bad']}]}));
  expect(readRun(sessionStorage,deck)).toBeNull();
  const blocked={getItem:()=>{throw Error();},setItem:()=>{throw Error();},removeItem:()=>{throw Error();}};
  expect(readRun(blocked,deck)).toBeNull();expect(()=>saveRun(blocked,run)).not.toThrow();expect(()=>writeDevice(blocked,readDevice(blocked))).not.toThrow();
});
it('bounds device histories and preserves a valid device record',()=>{
  let d=readDevice(null);
  for(let i=0;i<150;i++) d=remember(d,newRun(deck,'solo',recent));
  expect(d.people.length).toBeLessThanOrEqual(40);expect(d.statements.length).toBeLessThanOrEqual(300);
  writeDevice(localStorage,d);expect(readDevice(localStorage)).toEqual(d);
});
it('names the score bands at their edges',()=>{
  expect([0,4,5,7,8,9,10].map(band)).toEqual(['Good start','Good start','Well read','Well read','Sharp eye','Sharp eye','Perfect']);
});
