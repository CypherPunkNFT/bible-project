import { useMemo } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { RefObject } from 'react';
import type { Person } from '@/data/teachers/pages-types';
import LibraryWorkPage from '../../LibraryWorkPage';
import type { ReadingRecord } from '../../shared/acquired';
import type { ProfileWork } from './ProfileWorks';

export function DocumentPanel({ work, person, open, onClose, closeRef }: { work: ProfileWork | null; person: Person | null; open: boolean; onClose: () => void; closeRef: RefObject<HTMLButtonElement> }) {
  const fallback = useMemo<ReadingRecord|undefined>(()=>work?.workId?{
    id:work.id,title:work.title,authors:person?[person.name]:[],contributors:person?[person.id]:[],language:'und',source:'Canonical library catalogue',sourceId:null,sourceUrl:work.sourceUrl??null,licence:'Public display permission not established',credit:null,sha256:null,pages:0,reviewWarning:null,workId:work.workId,editionId:null,availability:'not-published',genre:work.genre??'work',
  }:undefined,[work,person]);
  return <aside className="drw-document" aria-hidden={!open} aria-label="Work document">
    <header className="drw-document-bar">
      <button type="button" className="drw-document-back" onClick={onClose}><ArrowRight size={16} aria-hidden />Back to profile</button>
      <button type="button" ref={closeRef} className="drw-document-close" onClick={onClose} aria-label="Close document"><X size={18} aria-hidden /></button>
    </header>
    <div className="drw-document-body slim-scroll">
      {work&&<LibraryWorkPage key={work.id} workId={work.id} embedded fallbackRecord={fallback} />}
    </div>
  </aside>;
}
