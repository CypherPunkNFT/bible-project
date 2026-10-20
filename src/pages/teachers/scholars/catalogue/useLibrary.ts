import { useEffect, useMemo, useState } from 'react';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { getAcquired } from '../../shared/acquired';
import { getPopulationDetails, getPopulationSearch, hydratePopulation, POPULATION_BASE, withDetails, type PopulationDetails, type PopulationSnapshot } from '../population';
import type { LibraryPerson } from './library';

let cached:PopulationSnapshot|null=null,pending:Promise<PopulationSnapshot>|null=null;
export function preloadScholarLibrary():Promise<PopulationSnapshot> {
  return pending??(pending=getAcquired<PopulationSnapshot>(`${POPULATION_BASE}/index.json`).then(value=>cached=value).catch(error=>{pending=null;throw error;}));
}
/** The scholars list. Its search text (titles of every work, 6 MB) is fetched only once `needSearch` is true. */
export function useLibrary(data: ScholarsData, needSearch = false) {
  const [snapshot,setSource]=useState<PopulationSnapshot|null>(()=>cached);
  const [searchText,setSearchText]=useState<Record<string,string>|null>(null);
  const [libraryError,setError]=useState('');
  useEffect(()=>{
    let live=true;
    preloadScholarLibrary().then(value=>{if(live)setSource(value);}).catch(error=>{if(live)setError(error.message);});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    const split=snapshot?.split;
    if(!needSearch||!split||searchText)return;
    let live=true;
    // Until it arrives, search still matches names, aliases, roles and fields.
    getPopulationSearch(split).then(value=>{if(live)setSearchText(value);}).catch(error=>console.error('Scholars search text could not be loaded; searching names only.',error));
    return()=>{live=false;};
  },[needSearch,snapshot,searchText]);
  const population=useMemo(()=>snapshot&&searchText?{...snapshot,entries:snapshot.entries.map(e=>({...e,searchText:searchText[e.id]??''}))}:snapshot,[snapshot,searchText]);
  const library=useMemo(()=>population?hydratePopulation(population,data):null,[population,data]);
  const libraryFacts=useMemo(()=>population?{schemaVersion:1 as const,inputs:{},summary:population.factSummary,entries:Object.fromEntries(population.entries.map(p=>[p.id,p.facts]))}:null,[population]);
  return {library,libraryError,libraryFacts,population};
}
/** A record view's person with the sources and review evidence the split index leaves out, once they have loaded. */
export function usePersonDetails(person: LibraryPerson): LibraryPerson {
  const [details,setDetails]=useState<{id:string;value:PopulationDetails}|null>(null);
  const split=cached?.split, entry=person.population;
  useEffect(()=>{
    if(!split||!entry)return;
    let live=true;
    getPopulationDetails(split,entry.id).then(value=>{if(live&&value)setDetails({id:entry.id,value});}).catch(error=>console.error(`Details for scholar record ${entry.id} could not be loaded.`,error));
    return()=>{live=false;};
  },[split,entry]);
  return useMemo(()=>{
    if(!entry||details?.id!==entry.id)return person;
    const full=withDetails(entry,details.value);
    return {...person,facts:full.facts,fields:full.fields,population:full};
  },[person,entry,details]);
}
