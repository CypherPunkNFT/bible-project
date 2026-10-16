import type { FieldEntry } from './field-library';
import { useScholars } from './context';
import { PopulationWorks } from './catalogue/PopulationWorks';
/** All cards, fields and table rows use the same reconciled work associations. */
export function FieldWorks({entry}:{entry:FieldEntry}) {
  const {library}=useScholars();
  const person=library?.find(p=>p.id===entry.id);
  return person?<PopulationWorks person={person}/>:<p role="status">Loading reconciled works…</p>;
}
