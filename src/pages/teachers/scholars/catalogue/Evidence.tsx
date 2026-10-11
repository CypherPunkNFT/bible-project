import { Link } from 'react-router-dom';
import { workUrl } from '../../shared/acquired';
import type { LibraryPerson } from './library';

import { dateLabel } from './dates';

export function Evidence({ person: p }: { person: LibraryPerson }) {
  const fact = p.facts;
  return <details className="cat-evidence"><summary>Dates and attribution evidence</summary>
    <p>{dateLabel(p)}. {fact?.dates.status === 'source-supported' ? 'Interpreted from source metadata; not an independently verified biography.' : ''}</p>
    {fact?.identityReview && <p>This name is flagged for identity review. Similar credits have not been merged.</p>}
    {fact?.kind === 'organization-candidate' && <p>The name suggests an organisation or collective; classification awaits review.</p>}
    {!!fact?.dates.evidence.length && <ul>{fact.dates.evidence.map((e, i) => <li key={`${e.workId}-${i}`}><q>{e.label}</q> — <Link to={workUrl(e.workId)}>Source work</Link></li>)}</ul>}
    {!!p.supplements.length && <ul>{p.supplements.map(w => <li key={w.id}><Link to={workUrl(w.id)}>{w.title}</Link><p>{w.basis}</p></li>)}</ul>}
    <p>Work subjects: {Object.values(p.fields).map(f => f?.basis).filter(Boolean).join('; ') || 'Unassigned'}. A work’s subject does not establish its contributor’s expertise.</p>
  </details>;
}
