// Shared data, hooks and helpers; React components stay in their own refresh boundary.
export const PAGE_LINES = 12, ONE_PAGE = 14;

export interface StanzaPage { first: number; last: number }

export function stanzaPages(stanzas: string[][]): StanzaPage[] {
  const total = stanzas.reduce((n, s) => n + s.length, 0);
  if (total <= ONE_PAGE) return [{ first: 0, last: stanzas.length - 1 }];
  const target = total / Math.ceil(total / PAGE_LINES);
  const pages: StanzaPage[] = [];
  let first = 0, done = 0;
  stanzas.forEach((stanza, s) => {
    // Start a new page when this stanza would sit mostly past the current page's share of the lines.
    if (s > first && done + stanza.length / 2 > target * (pages.length + 1)) { pages.push({ first, last: s - 1 }); first = s; }
    done += stanza.length;
  });
  pages.push({ first, last: stanzas.length - 1 });
  return pages;
}
