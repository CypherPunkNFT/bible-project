import { forwardRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Verse } from '@/components/Verse';
import { useCatalog } from '@/lib/catalog';
import { bookByNum } from '@/lib/refs';
import { useVerses, verseReference } from '@/lib/verses';
import { correct } from './game';
import type { Deck, Round, Statement } from './types';

function Passage({a,b}: {a:number;b:number}) {
  const catalog=useCatalog(), state=useVerses({from:a,to:b},{bible:'bsb'});
  const code=bookByNum(catalog,Math.floor(a/1000000))?.code;
  return <blockquote>
    {state.status==='error' ? <p role="alert">The evidence could not be loaded.</p> : <p><Verse bible="bsb" from={a} to={b} /></p>}
    <footer>{verseReference(catalog,a,b)} · <span translate="no">BSB</span> · <Link to={`/read/bsb/${code}/${Math.floor(a/1000)%1000}?hl=${a%1000}${b>a?`-${b%1000}`:''}`}>Read in context</Link></footer>
  </blockquote>;
}
export function Evidence({statement}: {statement: Statement}) {
  const [attempt,retry]=useState(0);
  return <div>{statement.refs.map(([a,b])=><Passage key={`${a}:${attempt}`} a={a} b={b}/>)}
    <button onClick={()=>retry(n=>n+1)}>Reload evidence</button>
  </div>;
}
export const Reveal=forwardRef<HTMLHeadingElement,{deck: Deck; round: Round}>(function Reveal({deck,round},ref) {
  const person=deck.people.find(p=>p.id===round.who)!;
  const result=round.pick ? correct(deck,round) ? 'You spotted it' : 'Not quite: that one is true.' : 'The answer';
  return <section aria-label="Answer"><h2 ref={ref} tabIndex={-1} aria-live="polite">{result}</h2>
    {round.ids.map((id,i)=>{
      const s=deck.statements.find(s=>s.id===id)!;
      return <article key={id} className={`tt-evidence ${s.kind==='truth'?'tt-true':'tt-lie'}${round.pick===id?' tt-picked':''}`}>
        <h3>{String.fromCharCode(65+i)} · {s.kind==='truth'?'True':'Made up'}{round.pick===id?' · Your pick':''}</h3>
        {s.kind==='lie' ? <><p><s>{s.text}</s></p><p><strong>The truth:</strong> {s.truth}</p></> : <p>{s.text}</p>}
        <Evidence statement={s}/>
      </article>;
    })}<p className="tt-muted">{person.tag}</p><Link to={person.href}>{`More about ${person.label}`}</Link>
  </section>;
});
