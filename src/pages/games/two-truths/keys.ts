// Keyboard play, unchanged from the first build: A, B, C or 1 to 3 pick, Enter confirms, Enter or Space continues, and
// a group leader awards teams with 1 to 4 after the reveal. Keys typed into a field, a link, a fold's summary or a
// focused button are left to the element itself, so one key never does two things.
import { useEffect } from 'react';
import { award, current, next, reveal, select } from './game';
import type { Deck, Recent, Run } from './types';

export function useRoundKeys(deck: Deck, run: Run, recent: Recent, update: (r: Run) => void): void {
  useEffect(()=>{
    const round=current(run), solo=run.mode==='solo';
    function key(e: KeyboardEvent) {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && (e.target.isContentEditable || e.target.closest('input,textarea,select,a,summary,details')))) return;
      const index='abc'.indexOf(e.key.toLowerCase()), n=Number(e.key)-1;
      if (solo && !round.revealed && (index>=0 || (n>=0 && n<3))) {
        e.preventDefault(); update(select(run,round.ids[index>=0?index:n]));
      } else if (!solo && round.revealed && n>=0 && n<run.teams.length) {
        e.preventDefault(); update(award(run,n));
      } else if (e.key==='Enter' || e.key===' ') {
        // Let focused buttons retain native keyboard behavior, avoiding two actions from one key.
        if (e.target instanceof HTMLButtonElement) return;
        if (round.revealed) { e.preventDefault(); update(next(deck,run,recent)); }
        else if (!solo || (e.key==='Enter' && round.pick)) { e.preventDefault(); update(reveal(run)); }
      }
    }
    window.addEventListener('keydown',key); return ()=>window.removeEventListener('keydown',key);
  },[deck,run,recent,update]);
}
