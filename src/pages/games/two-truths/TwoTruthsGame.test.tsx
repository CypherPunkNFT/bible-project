import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import raw from '@/data/two-truths/two-truths.json';
import { Game } from './TwoTruthsGame';
import { current, newRun, next, reveal, select } from './game';
import { RUN_KEY, readDevice, saveRun, writeDevice } from './storage';
import { GAMES } from '../registry';
import type { Deck, Run } from './types';
vi.mock('@/components/Verse',()=>({Verse:({bible}:{bible:string})=> <span data-bible={bible}>Resolved BSB passage</span>}));
vi.mock('@/lib/catalog',()=>({useCatalog:()=>({})}));
vi.mock('@/lib/verses',()=>({useVerses:()=>({status:'ready'}),verseReference:(_:unknown,a:number)=>`Verse ${a}`}));
vi.mock('@/lib/refs',()=>({bookByNum:()=>({code:'GEN'})}));
const deck=raw as unknown as Deck;
const saved=()=>JSON.parse(sessionStorage.getItem(RUN_KEY)!) as Run;
const show=()=>render(<MemoryRouter><Game deck={deck}/></MemoryRouter>);
beforeEach(()=>{localStorage.clear();sessionStorage.clear();});
afterEach(cleanup);
it('plays all ten rounds with click and keyboard confirmation, then records the result once',()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Play ten rounds'}));
  for(let i=0;i<10;i++) {
    const r=current(saved()), lie=deck.statements.find(s=>r.ids.includes(s.id)&&s.kind==='lie')!;
    const index=r.ids.indexOf(lie.id);
    if(i%2) fireEvent.keyDown(window,{key:String(index+1)});
    else fireEvent.click(screen.getByRole('button',{name:`${String.fromCharCode(65+index)}. ${lie.text}`}));
    expect(screen.getByText('Is this the made-up one?')).toBeInTheDocument();
    expect(current(saved()).revealed).toBe(false);
    fireEvent.click(screen.getByRole('button',{name:"Yes, that's the lie"}));
    expect(screen.getByRole('heading',{name:'You spotted it'})).toHaveFocus();
    expect(screen.getByText('The truth:')).toBeInTheDocument();
    expect(screen.getByText(lie.text).tagName).toBe('S');
    const lieCard=screen.getByText(lie.text).closest('article')!;
    expect(lieCard).toHaveClass('tt-lie');expect(lieCard.querySelector('h3')).toHaveTextContent('Made up');
    const truths=document.querySelectorAll('article.tt-true');expect(truths).toHaveLength(2);
    for(const card of truths) expect(card.querySelector('h3')!.textContent).toMatch(/· True/);
    expect(screen.getAllByRole('link',{name:'Read in context'}).length).toBeGreaterThanOrEqual(3);
    for(const link of screen.getAllByRole('link',{name:'Read in context'})) expect(link.getAttribute('href')).toMatch(/^\/read\/bsb\//);
    fireEvent.keyDown(window,{key:'Enter'});
  }
  expect(screen.getByRole('heading',{name:'10/10 · Perfect'})).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('bp-two-truths')!).games).toBe(1);
  cleanup();show();expect(JSON.parse(localStorage.getItem('bp-two-truths')!).games).toBe(1);
});
it('lets a player change their mind and reload without redealing',()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Play ten rounds'}));
  const before=current(saved());fireEvent.keyDown(window,{key:'a'});fireEvent.click(screen.getByRole('button',{name:'Pick again'}));
  expect(current(saved()).pick).toBeNull();cleanup();show();expect(current(saved())).toEqual(before);
});
it('leads a group with named teams, keyboard awards and a corrected recap',()=>{
  show();fireEvent.change(screen.getByLabelText('Number of teams'),{target:{value:'2'}});
  fireEvent.change(screen.getByLabelText('Team 1 name'),{target:{value:'Olives'}});
  fireEvent.click(screen.getByRole('button',{name:'Lead a group'}));
  expect(document.querySelectorAll('.tt-statement button')).toHaveLength(0);
  fireEvent.keyDown(window,{key:' '});expect(screen.getByRole('heading',{name:'The answer'})).toHaveFocus();
  fireEvent.keyDown(window,{key:'1'});expect(screen.getByText('Olives: 1 · Team 2: 0')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Finish'}));expect(screen.getByRole('heading',{name:'Group finished'})).toBeInTheDocument();
  expect(screen.getByText('The truth:')).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Share'})).toBeNull();
});
it('registers the live game and loads its page',async()=>{
  const entry=GAMES.find(g=>g.slug==='two-truths')!;expect(entry.status).toBe('live');
  if(entry.status==='live') expect((await entry.load()).default).toBeTypeOf('function');
});
it('omits the current unanswered group round from the recap',()=>{
  show();fireEvent.click(screen.getByRole('button',{name:'Lead a group'}));
  const r=current(saved()),lie=deck.statements.find(s=>r.ids.includes(s.id)&&s.kind==='lie')!;
  fireEvent.click(screen.getByRole('button',{name:'Finish'}));
  expect(screen.queryByText(lie.text)).toBeNull();
  expect(screen.queryByText('The truth:')).toBeNull();
});
it('hides answer-bearing biography and person links until the reveal',()=>{
  const tagged={...deck,people:[{...deck.people[0],tag:'ANSWER-BEARING BIOGRAPHY'}]};
  render(<MemoryRouter><Game deck={tagged}/></MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:'Lead a group'}));
  expect(screen.queryByText('ANSWER-BEARING BIOGRAPHY')).toBeNull();
  expect(screen.queryByRole('link',{name:/More about/})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Show the answer'}));
  expect(screen.getByText('ANSWER-BEARING BIOGRAPHY')).toBeInTheDocument();
});
it('disables unavailable modes without throwing on an empty or short deck',()=>{
  const {unmount}=render(<MemoryRouter><Game deck={{...deck,people:[]}}/></MemoryRouter>);
  expect(screen.getByRole('button',{name:'Play ten rounds'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Lead a group'})).toBeDisabled();unmount();
  render(<MemoryRouter><Game deck={{...deck,people:deck.people.slice(0,2)}}/></MemoryRouter>);
  expect(screen.getByRole('button',{name:'Play ten rounds'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'Lead a group'})).toBeEnabled();
});
it('preserves team toggles on reload and reverses an award without changing other teams',()=>{
  show();fireEvent.change(screen.getByLabelText('Number of teams'),{target:{value:'2'}});
  fireEvent.click(screen.getByRole('button',{name:'Lead a group'}));fireEvent.click(screen.getByRole('button',{name:'Show the answer'}));
  fireEvent.click(screen.getByRole('button',{name:'Team 1 got it right'}));cleanup();show();
  expect(screen.getByRole('button',{name:'Team 1 got it right'})).toHaveAttribute('aria-pressed','true');
  expect(screen.getByText('Team 1: 1 · Team 2: 0')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Team 1 got it right'}));
  expect(screen.getByText('Team 1: 0 · Team 2: 0')).toBeInTheDocument();
});
it('does not record completion twice when device statistics saved before the session marker',()=>{
  const recent={people:[],statements:[]};let run=newRun(deck,'solo',recent);
  for(let i=0;i<10;i++) {
    const lie=deck.statements.find(s=>current(run).ids.includes(s.id)&&s.kind==='lie')!;
    run=next(deck,reveal(select(run,lie.id)),recent);
  }
  writeDevice(localStorage,{...readDevice(null),games:1,total:10,best:10,completed:[run.id]});
  saveRun(sessionStorage,{...run,over:false,recorded:false});show();
  fireEvent.click(screen.getByRole('button',{name:'See your score'}));
  expect(screen.getByRole('heading',{name:'10/10 · Perfect'})).toBeInTheDocument();
  expect(readDevice(localStorage).games).toBe(1);expect(readDevice(localStorage).total).toBe(10);
});
