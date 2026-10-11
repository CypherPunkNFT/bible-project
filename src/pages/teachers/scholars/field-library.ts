import type { Field } from '@/data/teachers/pages-types';
import type { AcquiredWork } from '../shared/acquired';
export type FieldWork = Pick<AcquiredWork, 'id' | 'title' | 'source' | 'availability'>;

export interface FieldEntry {
  id: string;
  name: string;
  profileId: string | null;
  aliases: string[];
  contributorIds: string[];
  roles: string[];
  traditions: string[];
  collections: string[];
  records: number;
  readable: number;
  supplements: (FieldWork & { basis: string })[];
  fields: Partial<Record<Field, { count: number; basis: string; example: FieldWork | null }>>;
}
export interface FieldLibrary {
  schemaVersion: number;
  coverage: { scannedRecords: number; sourceContributors: number; includedNames: number; withoutSubjectMatch: number; fieldCounts: Record<Field, number>; collections: Record<string, number> };
  entries: FieldEntry[];
}
export const FIELD_COLLECTIONS = [
  ['ccel', 'CCEL'], ['latin-fathers', 'Latin Fathers · CSEL'],
  ['greek-patristic', 'Greek & patristic texts'], ['early-print', 'Early printed works · TCP'],
] as const;
