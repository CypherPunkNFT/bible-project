import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OpeningArt } from './OpeningArt';
import { AnatomyFlatPage } from './PageAnatomyArt';
import { EDITIONS, flatPage } from './page-anatomy';
import expected from './opening-art.expected.json';
// Parsing expected markup is an offline comparison only; application rendering uses native SVG elements.
const parse=(markup:string)=>new DOMParser().parseFromString(markup,'text/html');
const shapes=(doc:Document)=>[...doc.querySelectorAll('svg path,svg rect,svg text,svg circle,svg stop')].map(el=>({tag:el.localName,attrs:Object.fromEntries([...el.attributes].map(a=>[a.name,a.value]).sort()),text:el.textContent}));
describe('native printed-page artwork',()=>{
 it('preserves every approved opening path, label and geometric attribute',()=>{
   const doc = parse(renderToStaticMarkup(<OpeningArt/>));
   expect(shapes(doc)).toEqual(expected);
   // The existing stylesheet selects attribute presence, including the old serialized undefined values.
   expect([...doc.querySelectorAll('.hx-sheet')].map(el=>el.getAttribute('data-front'))).toEqual(['undefined','undefined','undefined','undefined','true']);
 });
 it('preserves the six editions and their full layer geometry',()=>{
   for(const edition of EDITIONS)expect(shapes(parse(renderToStaticMarkup(<AnatomyFlatPage edition={edition}/>))),edition.id).toEqual(shapes(parse(flatPage(edition))));
 });
 it('keeps hidden layers in place, marking only the requested layer off',()=>{
   const doc=parse(renderToStaticMarkup(<AnatomyFlatPage edition={EDITIONS[0]} visible={[true,false,true]}/>));
   expect([...doc.querySelectorAll('.pa-layer')].map(el=>el.getAttribute('data-off'))).toEqual([null,'true',null]);
   expect(doc.querySelectorAll('.pa-layer')).toHaveLength(3);
 });
});
