import { useEffect, useMemo, useState } from 'react';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { getAcquired } from '../../shared/acquired';
import { hydratePopulation, POPULATION_BASE, type PopulationSnapshot } from '../population';

let cached:PopulationSnapshot|null=null,pending:Promise<PopulationSnapshot>|null=null;
export function preloadScholarLibrary():Promise<PopulationSnapshot> {
  return pending??(pending=getAcquired<PopulationSnapshot>(`${POPULATION_BASE}/index.json`).then(value=>cached=value).catch(error=>{pending=null;throw error;}));
}
export function useLibrary(data: ScholarsData) {
  const [population,setSource]=useState<PopulationSnapshot|null>(()=>cached);
  const [libraryError,setError]=useState('');
  useEffect(()=>{
    let live=true;
    preloadScholarLibrary().then(value=>{if(live)setSource(value);}).catch(error=>{if(live)setError(error.message);});
    return()=>{live=false;};
  },[]);
  const library=useMemo(()=>population?hydratePopulation(population,data):null,[population,data]);
  const libraryFacts=useMemo(()=>population?{schemaVersion:1 as const,inputs:{},summary:population.factSummary,entries:Object.fromEntries(population.entries.map(p=>[p.id,p.facts]))}:null,[population]);
  return {library,libraryError,libraryFacts,population};
}
