import { describe, expect, it } from 'vitest';
import template from './template.html?raw';
import { createCirclesTemplate } from './create-template';
function tree(node:Node):unknown {if(node.nodeType===Node.TEXT_NODE)return node.textContent?.trim()||null;if(!(node instanceof Element)&&!(node instanceof DocumentFragment))return null;return {tag:node instanceof Element?node.localName:'fragment',attrs:node instanceof Element?[...node.attributes].map(a=>[a.name,a.value]).sort():[],children:[...node.childNodes].map(tree).filter(Boolean)};}
describe('the circles DOM skeleton',()=>{
 it('preserves the approved template, IDs, names, attributes and SVG namespaces',()=>{
  const expected=new DOMParser().parseFromString(template,'text/html');
  const fragment=document.createDocumentFragment();fragment.append(...expected.body.childNodes);
  const built=createCirclesTemplate(document);
  expect(tree(built)).toEqual(tree(fragment));
  expect(built.querySelector('svg')?.namespaceURI).toBe('http://www.w3.org/2000/svg');
 });
});
