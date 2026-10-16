import type { LibraryPerson } from '../catalogue/library';
import type { Milestone } from './idea-chains';

/** Editorial links only. Composite credits and namesakes stay unjoined. */
const links:Record<string,string>={
  'Julius Africanus':'field-e2f1ff4f92f6eb9c79bc',Eusebius:'eusebius',Jerome:'jerome',
  'Desiderius Erasmus':'erasmus','William Tyndale':'tyndale','Miles Coverdale':'field-cc1b266d20d653098521',
  'John Garstang':'john-garstang','Kathleen Kenyon':'kenyon','Edward Robinson':'robinson','Anselm of Canterbury':'anselm',
};
export function lineageEntry(node:Milestone,people:LibraryPerson[]) {
  return people.find(p=>p.id===links[node.name]);
}
