import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { loadPlain } from '@/lib/data';
import { currentBibleSlug } from '@/lib/verses';
import type { Catalog } from '@/lib/types';
import raw from '@/data/two-truths/two-truths.json';
import { Game } from './TwoTruthsGame';
import { newRun, current, reveal, select } from './game';
import { RUN_KEY, saveRun } from './storage';
import type { Deck } from './types';

vi.mock('@/lib/data',()=>({loadPlain:vi.fn()}));
vi.mock('@/lib/catalog',()=>({useCatalog:()=>catalog}));
vi.mock('@/lib/language',async original=>({...await original<typeof import('@/lib/language')>(),useSiteLanguage:()=> 'es'}));
const translation={abbr:'BSB',name:'Berean Standard Bible',lang:'en',dir:'ltr',numbering:'english',books:{GEN:['6','8','9']}};
const catalog={translations:[{...translation,slug:'bsb'},{...translation,slug:currentBibleSlug('es'),lang:'es'}],books:[{num:1,code:'GEN',name:'Genesis'}]} as unknown as Catalog;
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('uses BSB on another site language, retains the revealed score on load failure, and retries through the real verse helpers',async()=>{
  localStorage.clear();sessionStorage.clear();
  const deck={...raw,people:raw.people.slice(0,1)} as unknown as Deck;
  let run=newRun(deck,'solo',{people:[],statements:[]});
  const lie=deck.statements.find(s=>current(run).ids.includes(s.id)&&s.kind==='lie')!;
  run=reveal(select(run,lie.id));saveRun(sessionStorage,run);
  let failed=true;
  vi.mocked(loadPlain).mockImplementation(async()=>{
    if(failed) throw Error('Fixture offline');
    return Object.fromEntries(Array.from({length:12},(_,ch)=>Array.from({length:40},(_,v)=>[`${ch+1}:${v+1}`,'Loaded BSB evidence.'])).flat());
  });
  vi.spyOn(console,'warn').mockImplementation(()=>{});
  render(<MemoryRouter><Game deck={deck}/></MemoryRouter>);
  // The made-up statement's verse is open at first; the two true ones fold out, and each failed passage carries its own Reload.
  await waitFor(()=>expect(screen.getAllByRole('alert')).toHaveLength(1));
  for(const fold of document.querySelectorAll('.tt-fold:not([open]) > summary')) fireEvent.click(fold);
  await waitFor(()=>expect(screen.getAllByRole('alert')).toHaveLength(3));
  expect(screen.getAllByRole('button',{name:'Reload evidence'})).toHaveLength(3);
  expect(document.querySelector('.kit-band__verdict')!.textContent).toContain('You spotted it');
  const before=sessionStorage.getItem(RUN_KEY);
  failed=false;
  for(const button of screen.getAllByRole('button',{name:'Reload evidence'})) fireEvent.click(button);
  await waitFor(()=>expect(screen.queryAllByRole('alert')).toHaveLength(0));
  expect(screen.queryAllByRole('button',{name:'Reload evidence'})).toHaveLength(0);
  await waitFor(()=>expect(screen.getAllByText(/Loaded BSB evidence/).length).toBeGreaterThan(0));
  expect(sessionStorage.getItem(RUN_KEY)).toBe(before);
  for(const [slug] of vi.mocked(loadPlain).mock.calls) expect(slug).toBe('bsb');
  for(const link of screen.getAllByRole('link',{name:'Read in context'})) expect(link.getAttribute('href')).toMatch(/^\/read\/bsb\//);
});
