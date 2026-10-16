import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RunView } from '@/components/reader/RunView';
import { isScholarsOnlySource } from './editorial-sources';

afterEach(cleanup);
describe('Scholars-only sources in the reader', () => {
  const options={redLetters:true,footnotes:true};
  it('omits the entire historical footnote rather than changing its attribution', () => {
    render(<RunView run={{f:'A few late Hebrew manuscripts and Josephus; most Hebrew manuscripts 70 men and 50,000 men'}} options={options}/>);
    expect(screen.queryByRole('button',{name:'Footnote'})).toBeNull();
  });
  it('preserves unrelated notes and Scripture names', () => {
    render(<><RunView run="Zambis, Josephus." options={options}/><RunView run={{f:'Hebrew manuscripts differ'}} options={options}/></>);
    expect(screen.getByText('Zambis, Josephus.')).toBeTruthy();
    expect(screen.getByRole('button',{name:'Footnote'})).toBeTruthy();
  });
  it('recognizes the source even when listed only by its work link',()=>{
    expect(isScholarsOnlySource('https://www.gutenberg.org/ebooks/2848')).toBe(true);
    expect(isScholarsOnlySource('Joseph, son of Jacob')).toBe(false);
  });
});
