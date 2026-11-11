import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchShadowRoot } from '@/lib/page-translator';
import joinedScripts from '@/joined-scripts.css?inline';
import styles from './circles.css?inline';
import { mountCircles } from './runtime.mjs';
import CirclesPage from './CirclesPage';
// Vitest disables stylesheet imports; use the exact source bytes to exercise this DOM mounting boundary.
vi.mock('@/joined-scripts.css?inline',async()=>({default:(await import('node:fs')).readFileSync('src/joined-scripts.css','utf8')}));
vi.mock('./circles.css?inline',async()=>({default:(await import('node:fs')).readFileSync('src/pages/study/circles/circles.css','utf8')}));
vi.mock('@/lib/page-translator',()=>({watchShadowRoot:vi.fn()}));
vi.mock('./runtime.mjs',()=>({mountCircles:vi.fn(async()=>()=>{})}));
afterEach(cleanup);
describe('Circles joined-script typography',()=>{
 it('mounts both complete stylesheets inside the shadow boundary before the explorer starts',()=>{
  const screen=render(<MemoryRouter><CirclesPage/></MemoryRouter>);
  const host=screen.container.querySelector('[data-circles-experience]')!;
  const root=host.shadowRoot!;
  expect(root.querySelector('style')?.textContent).toBe(styles+joinedScripts);
  expect(root.querySelector('style')?.textContent).toMatch(/letter-spacing:\s*normal\s*!important/);
  expect(root.querySelector('.circles-app')).not.toBeNull();
  expect(watchShadowRoot).toHaveBeenCalledWith(root);
  expect(mountCircles).toHaveBeenCalledWith(root,expect.objectContaining({signal:expect.any(AbortSignal)}));
 });
});
