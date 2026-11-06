// The circles explorer draws inside a shadow root, which the page translator enters only when it is handed one.
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import { watchShadowRoot } from '@/lib/page-translator';
import CirclesPage from './CirclesPage';

vi.mock('./runtime.mjs', () => ({ mountCircles: vi.fn(() => new Promise(() => {})) }));
vi.mock('@/lib/page-translator', () => ({ watchShadowRoot: vi.fn() }));
afterEach(cleanup);

it('hands its filled shadow root to the page translator and is not marked English', () => {
  const { container } = render(<MemoryRouter><CirclesPage /></MemoryRouter>);
  const host = container.querySelector('[data-circles-experience]')!;
  expect(host.shadowRoot?.querySelector('.circles-app')).not.toBeNull();
  expect(watchShadowRoot).toHaveBeenCalledWith(host.shadowRoot);
  expect(host.hasAttribute('lang')).toBe(false); // its text is translated; the drawing still reads left to right
  expect(host.getAttribute('dir')).toBe('ltr');
});
