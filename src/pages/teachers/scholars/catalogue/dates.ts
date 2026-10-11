import type { LibraryPerson } from './library';

const year = (n: number) => n < 0 ? `${Math.abs(n)} BC` : String(n);
export function dateLabel(p: LibraryPerson): string {
  const d = p.facts?.dates;
  if (!d || d.status === 'missing') return 'Dates not recorded';
  if (d.status === 'conflicting') return 'Conflicting dates · review needed';
  if (d.status === 'needs-review') return 'Date label needs review';
  if (d.born !== undefined) return `${d.approximate ? 'c. ' : ''}${year(d.born)}${d.died != null ? `–${year(d.died)}` : ' · born'}`;
  if (d.floruit !== undefined) return `Active ${year(d.floruit)}`;
  if (d.died != null) return `Died ${year(d.died)} · era unknown`;
  return 'Era unknown';
}

