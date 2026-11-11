import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApprovedResourceArt } from './ApprovedResourceArt';
import { resourceArtwork } from './resource-artwork.data';
const parse=(s:string)=>new DOMParser().parseFromString(s,'text/html');
function tree(el:Element):unknown {return {tag:el.localName,attrs:[...el.attributes].map(a=>[a.name,a.value]).sort(),children:[...el.children].map(tree),text:el.children.length?'':el.textContent};}
describe('approved resource artwork as SVG elements',()=>{
 for(const kind of Object.keys(resourceArtwork) as (keyof typeof resourceArtwork)[])it('preserves '+kind+' geometry and animation properties',()=>{
  const actual=parse(renderToStaticMarkup(<ApprovedResourceArt kind={kind}/>)).querySelector('svg')!;
  const original=parse('<svg>'+resourceArtwork[kind]+'</svg>').querySelector('svg')!;
  expect([...actual.children].map(tree)).toEqual([...original.children].map(tree));
 });
});
