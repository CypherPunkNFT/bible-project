import { useEffect, useMemo, useState } from 'react';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { ACQUIRED_BASE, getAcquired, type AcquiredCatalogue } from '../../shared/acquired';
import type { FieldLibrary } from '../field-library';
import indexUrl from '../../../../../content/teachers/field-shelves.json?url';
import factsUrl from '../../../../../content/teachers/contributor-facts.json?url';
import type { ContributorFacts } from '../facts';
import { mergeLibrary } from './library';

export function useLibrary(data: ScholarsData) {
  const [source, setSource] = useState<[FieldLibrary, AcquiredCatalogue, ContributorFacts] | null>(null);
  const [libraryError, setError] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    Promise.all([getAcquired<FieldLibrary>(indexUrl, abort.signal), getAcquired<AcquiredCatalogue>(`${ACQUIRED_BASE}/catalogue.json`, abort.signal), getAcquired<ContributorFacts>(factsUrl, abort.signal)])
      .then(setSource).catch(e => { if (!abort.signal.aborted) setError(e.message); });
    return () => abort.abort();
  }, []);
  const library = useMemo(() => source ? mergeLibrary(source[0], source[1], data, source[2]) : null, [source, data]);
  return { library, libraryError, libraryFacts: source?.[2] ?? null };
}
