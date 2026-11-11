import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(()=>{document.body.replaceChildren();vi.unstubAllGlobals();vi.resetModules();});
describe('the connections design with native DOM rendering',()=>{
 it('keeps topic selection, evidence, close/back controls and keyboard field navigation working',async()=>{
  const frame=document.createElement('iframe');frame.id='preview';document.body.append(frame);
  const doc=frame.contentDocument!,win=frame.contentWindow!;
  Object.defineProperty(win,'matchMedia',{value:()=>({matches:true}),configurable:true});
  Object.defineProperty(doc,'fonts',{value:{ready:Promise.resolve()},configurable:true});
  vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
  vi.stubGlobal('requestAnimationFrame',()=>1);
  const connections=doc.createElement('section');connections.id='connections';connections.scrollIntoView=vi.fn();
  const original=doc.createElement('div');original.className='idea-lineage';connections.append(original);doc.body.append(connections);
  await import('../../design/scholar-connections/app');
  frame.dispatchEvent(new Event('load'));
  const graph=doc.querySelector<HTMLElement>('.connections-mock')!;
  expect(original.hidden).toBe(true);
  const topic=graph.querySelector<HTMLButtonElement>('[data-topic]')!;expect(topic).not.toBeNull();topic.click();
  expect(graph.querySelectorAll('[data-node]').length).toBeGreaterThan(1);
  const relation=graph.querySelector<HTMLButtonElement>('[data-connection]')!;relation.click();
  const detail=graph.querySelector<HTMLElement>('.detail')!;
  expect(detail.hidden).toBe(false);expect(detail.querySelectorAll('.evidence a').length).toBeGreaterThan(0);
  detail.querySelector<HTMLButtonElement>('button')!.click();expect(detail.hidden).toBe(true);
  graph.querySelector<HTMLButtonElement>('[data-back]')!.click();expect(graph.querySelector('[data-topic]')).not.toBeNull();
  const tab=graph.querySelector<HTMLButtonElement>('[aria-selected="true"]')!;
  tab.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  expect(graph.querySelector('[aria-selected="true"]')?.getAttribute('data-field')).not.toBe(tab.getAttribute('data-field'));
 });
});
