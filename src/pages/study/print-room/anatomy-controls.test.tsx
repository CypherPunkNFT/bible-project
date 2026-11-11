import { render, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PageAnatomy } from './PageAnatomy';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
describe('printed-page layer controls',()=>{
 it('hides and restores one layer in both views without discarding its SVG',()=>{
  vi.stubGlobal('matchMedia',()=>({matches:true}));
  const screen=render(<PageAnatomy editionId="gutenberg" choose={()=>{}}/>);
  fireEvent.click(screen.getByRole('button',{name:'One sheet'}));
  const drawing=screen.container.querySelector('.pa-flat')!;
  const original=drawing.querySelector('[data-layer="1"]');
  fireEvent.click(screen.getByRole('button',{name:'Show Hand finishing'}));
  expect(drawing.querySelector('[data-layer="1"]')).toBe(original);
  expect(original).toHaveAttribute('data-off','true');
  fireEvent.click(screen.getByRole('button',{name:'Lifted apart'}));
  expect(screen.container.querySelector('.pa-panel .pa-plate[data-layer="1"]')).toHaveAttribute('data-off','true');
  fireEvent.click(screen.getByRole('button',{name:'Show Hand finishing'}));
  expect(screen.container.querySelector('.pa-panel .pa-plate[data-layer="1"]')).not.toHaveAttribute('data-off');
 });
});
