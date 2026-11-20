import { useEffect, useMemo, useState } from 'react';
import type { ScholarsData } from '@/data/teachers/pages-types';
import { getAcquired } from '../../shared/acquired';
import { getPopulationDetails, getPopulationSearch, hydratePopulation, POPULATION_BASE, withDetails, type PopulationDetails, type PopulationEntry, type PopulationSnapshot } from '../population';
import { loadSplitDetails, loadSplitOpening, loadSplitPopulation, loadSplitSearch, type SplitPopulation } from '../population-split';
import type { LibraryPerson } from './library';

// The list comes from the split files (population-split.ts): the opening first, the whole list once the page wants it
// (a section below the opening is near the screen, a search, a profile) or at once where the opening could not be read.
// Where the split files are missing it falls back to index.json, read whole.
let cached:PopulationSnapshot|null=null,pending:Promise<PopulationSnapshot>|null=null,split:SplitPopulation|null=null;
let opening:SplitPopulation|null=null,openingRun:Promise<SplitPopulation|null>|null=null;
export function preloadScholarLibrary():Promise<PopulationSnapshot> {
  return pending??(pending=loadSplitPopulation(opening).then(value=>{split=value;return value.snapshot;},error=>{
    console.warn('Scholars: the split list could not be read; reading index.json whole.',error);
    return getAcquired<PopulationSnapshot>(`${POPULATION_BASE}/index.json`);
  }).then(value=>{
    // The whole list replaces the opening: let the opening's rows go (the split keeps the manifest a record's details need).
    cached=value;opening=null;openingRun=Promise.resolve(null);
    return value;
  }).catch(error=>{pending=null;throw error;}));
}
/** The opening's rows (every supported birth year) and the head's figures: small, so the landing draws at once. Null
 *  once the whole list has loaded, or where the split files could not be read. */
export function preloadScholarOpening():Promise<SplitPopulation|null> {
  if(cached)return Promise.resolve(null);
  return openingRun??(openingRun=loadSplitOpening().then(value=>opening=value).catch(error=>{console.warn('Scholars: the opening could not be read from the split files.',error);return null;}));
}
/** The scholars list. `opening` is the timeline's rows until the whole `library` has loaded, which happens once `wanted`
 *  is true; `entryCount` is known from the opening. Its search text (titles of every work, 6 MB) is fetched only once
 *  `needSearch` is true. */
export function useLibrary(data: ScholarsData, needSearch = false, wanted = true) {
  const [snapshot,setSource]=useState<PopulationSnapshot|null>(()=>cached);
  const [first,setFirst]=useState<SplitPopulation|null>(()=>cached?null:opening);
  const [openingFailed,setOpeningFailed]=useState(false);
  const [searchText,setSearchText]=useState<Record<string,string>|null>(null);
  const [libraryError,setError]=useState('');
  useEffect(()=>{
    if(cached)return;
    let live=true;
    preloadScholarOpening().then(value=>{if(!live)return;if(value)setFirst(value);else if(!cached)setOpeningFailed(true);});
    return()=>{live=false;};
  },[]);
  useEffect(()=>{
    if(snapshot||!(wanted||openingFailed))return;
    let live=true;
    preloadScholarLibrary().then(value=>{if(live){setSource(value);setFirst(null);}}).catch(error=>{if(live)setError(error.message);});
    return()=>{live=false;};
  },[snapshot,wanted,openingFailed]);
  useEffect(()=>{
    if(!needSearch||searchText)return;
    let live=true;
    // Until it arrives, search still matches names, aliases, roles and fields.
    preloadScholarLibrary().then(()=>split?(split.manifest.layers.search?loadSplitSearch(split):null):cached?.split?getPopulationSearch(cached.split):null)
      .then(value=>{if(live&&value)setSearchText(value);}).catch(error=>console.error('Scholars search text could not be loaded; searching names only.',error));
    return()=>{live=false;};
  },[needSearch,searchText]);
  const population=useMemo(()=>snapshot&&searchText?{...snapshot,entries:snapshot.entries.map(e=>({...e,searchText:searchText[e.id]??''}))}:snapshot,[snapshot,searchText]);
  const library=useMemo(()=>population?hydratePopulation(population,data):null,[population,data]);
  const openingLibrary=useMemo(()=>!population&&first?hydratePopulation(first.snapshot,data):null,[population,first,data]);
  const facts=population??first?.snapshot??null;
  const libraryFacts=useMemo(()=>facts?{schemaVersion:1 as const,inputs:{},summary:facts.factSummary,entries:Object.fromEntries(facts.entries.map(p=>[p.id,p.facts]))}:null,[facts]);
  const entryCount=library?.length??first?.manifest.rows??null;
  return {library,opening:openingLibrary,entryCount,libraryError,libraryFacts,population};
}
/** A record view's person with the sources and review evidence the split list leaves out, once they have loaded. */
export function usePersonDetails(person: LibraryPerson): LibraryPerson {
  const [details,setDetails]=useState<{id:string;value:PopulationDetails|PopulationEntry}|null>(null);
  const oldSplit=cached?.split, entry=person.population, source=split??opening;
  useEffect(()=>{
    if(!entry||(!source&&!oldSplit))return;
    let live=true;
    // The split's manifest (from the whole list or, before it has loaded, the opening) names the record's details part.
    const run:Promise<PopulationDetails|PopulationEntry|null>=source?loadSplitDetails(source,entry):getPopulationDetails(oldSplit!,entry.id);
    run.then(value=>{if(live&&value)setDetails({id:entry.id,value});}).catch(error=>console.error(`Details for scholar record ${entry.id} could not be loaded.`,error));
    return()=>{live=false;};
  },[source,oldSplit,entry]);
  return useMemo(()=>{
    if(!entry||details?.id!==entry.id)return person;
    const full=source?details.value as PopulationEntry:withDetails(entry,details.value as PopulationDetails);
    return {...person,facts:full.facts,fields:full.fields,population:full};
  },[person,entry,details,source]);
}
