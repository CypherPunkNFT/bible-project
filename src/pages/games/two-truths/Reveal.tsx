// The evidence behind a statement: each verse range as a quotation with its reference and a Read in context link.
// Reload evidence appears only inside the failed-load alert (the audit's item 5), and only remounts that passage.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Verse } from '@/components/Verse';
import { useCatalog } from '@/lib/catalog';
import { bookByNum } from '@/lib/refs';
import { useVerses, verseReference } from '@/lib/verses';
import type { Statement } from './types';

function Passage({a,b,onRetry}: {a:number;b:number;onRetry:()=>void}) {
  const catalog=useCatalog(), state=useVerses({from:a,to:b},{bible:'bsb'});
  const code=bookByNum(catalog,Math.floor(a/1000000))?.code;
  return <blockquote className="tt-passage">
    {state.status==='error'
      ? <div role="alert" className="tt-alert"><p>The evidence could not be loaded.</p><button type="button" className="tt-plain" onClick={onRetry}>Reload evidence</button></div>
      : <p><Verse bible="bsb" from={a} to={b} /></p>}
    <footer>{verseReference(catalog,a,b)} · <span translate="no">BSB</span> · <Link to={`/read/bsb/${code}/${Math.floor(a/1000)%1000}?hl=${a%1000}${b>a?`-${b%1000}`:''}`}>Read in context</Link></footer>
  </blockquote>;
}
export function Evidence({statement}: {statement: Statement}) {
  const [attempt,retry]=useState(0);
  return <div className="tt-evidence">{statement.refs.map(([a,b])=><Passage key={`${a}:${attempt}`} a={a} b={b} onRetry={()=>retry(n=>n+1)}/>)}</div>;
}
/** The verse behind one statement, folded; the passages are fetched only once the fold is open. */
export function VerseFold({statement,defaultOpen=false}: {statement: Statement; defaultOpen?: boolean}) {
  const [open,setOpen]=useState(defaultOpen);
  return <details className="tt-fold" open={open}>
    <summary onClick={e=>{e.preventDefault();setOpen(o=>!o);}}>Show the verse</summary>
    {open && <Evidence statement={statement}/>}
  </details>;
}
