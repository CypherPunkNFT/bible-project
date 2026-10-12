import { useEffect, useMemo, useState } from 'react';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { ACQUIRED_BASE, getAcquired, type AcquiredCatalogue } from '../../shared/acquired';
import type { FieldLibrary } from '../field-library';
import indexUrl from '../../../../../content/teachers/field-shelves.json?url';
import factsUrl from '../../../../../content/teachers/contributor-facts.json?url';
import type { ContributorFacts } from '../facts';
import { mergeLibrary } from './library';

type Sources=[FieldLibrary,AcquiredCatalogue,ContributorFacts];
let cached:Sources|null=null,pending:Promise<Sources>|null=null;
const merged=new WeakMap<ScholarsData,ReturnType<typeof mergeLibrary>>();
export function preloadScholarLibrary():Promise<Sources> {
  return pending??(pending=Promise.all([getAcquired<FieldLibrary>(indexUrl),getAcquired<AcquiredCatalogue>(`${ACQUIRED_BASE}/catalogue.json`),getAcquired<ContributorFacts>(factsUrl)])
    .then(value=>cached=value).catch(error=>{pending=null;throw error;}));
}

export function useLibrary(data: ScholarsData) {
  const [source, setSource] = useState<Sources | null>(()=>cached);
  const [libraryError, setError] = useState('');
  useEffect(() => {
    let live=true;
    preloadScholarLibrary().then(value=>{if(live)setSource(value);}).catch(e=>{if(live)setError(e.message);});
    return () => {live=false;};
  }, []);
  const library = useMemo(() => {
    if(!source)return null;
    let result=merged.get(data);
    if(!result){result=mergeLibrary(source[0],source[1],data,source[2]);merged.set(data,result);}
    return result;
  }, [source, data]);
  return { library, libraryError, libraryFacts: source?.[2] ?? null };
}
