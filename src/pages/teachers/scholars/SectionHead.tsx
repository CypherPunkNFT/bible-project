import type { ComponentProps } from 'react';
import { SectionHead } from '../shared/Frame';
import { sectionNumber, type ScholarSectionId } from './sections';

export function ScholarSectionHead({ section, ...props }: Omit<ComponentProps<typeof SectionHead>, 'num'> & { section: ScholarSectionId }) {
  return <SectionHead {...props} num={sectionNumber(section)} />;
}
