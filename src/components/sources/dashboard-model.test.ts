import { describe, expect, it } from 'vitest';
import { matchesCatalogue, facetValues, toggleFacet, missingIdentity, needsReview, titleMatchRank, sourceView } from './dashboard-model';
import type { SourceEntry } from './types';
const record: SourceEntry = {id:'edition-1',title:'Historical text',author:'Unknown (editor recorded)',categories:['theology'],kind:'edition',status:'Acquired file verified',held:true,role:'reference',links:[{url:'https://example.org/original',sourceId:'provider'}]};
describe('source review queues',()=>{
 it('puts the named work before chapter records matched through a source URL',()=>{expect(titleMatchRank({...record,title:'Outlines of Theology'},'outlines of theology')).toBeGreaterThan(titleMatchRank({...record,title:'Adoption'},'outlines of theology'));expect(titleMatchRank(record,' ')).toBe(0);});
 it('does not classify an anonymous author or historical spelling as broken attribution',()=>{ expect(missingIdentity(record)).toBe(false); expect(needsReview({...record,title:'A treatise of charitie'},'identity')).toBe(false); });
 it('finds explicitly absent attribution without treating acquired as quality-approved',()=>{expect(needsReview({...record,author:'Author not recorded'},'identity')).toBe(true);expect(needsReview({...record,title:'Title not recorded'},'identity')).toBe(true);expect(needsReview({...record,title:' '},'identity')).toBe(true);});
 it('distinguishes a source destination from a missing or non-web link',()=>{expect(needsReview(record,'source')).toBe(false);expect(needsReview({...record,links:[]},'source')).toBe(true);expect(needsReview({...record,links:[{url:'',sourceId:'provider'}]},'source')).toBe(true);});
 it('keeps collection placement independent of attribution and acquisition',()=>{const e={...record,categories:['research']};expect(needsReview(e,'unassigned')).toBe(true);expect(needsReview(e,'identity')).toBe(false);expect(needsReview(record,'unassigned')).toBe(false);});
 it('retains old section destinations and safely handles unknown anchors',()=>{expect(sourceView('#research')).toBe('quality');expect(sourceView('#reference-library')).toBe('foundations');expect(sourceView('#scriptures')).toBe('scriptures');expect(sourceView('#no-such-section')).toBe('overview');});
});

describe('combined catalogue facets',()=>{
 const filters = {category:'theology',holdings:'held',review:'identity' as const,query:'historical'};
 it('intersects search, collection, holdings and review instead of broadening the result',()=>{
   expect(matchesCatalogue(record, filters)).toBe(false);
   expect(matchesCatalogue({...record,author:'Author not recorded'}, filters)).toBe(true);
   expect(matchesCatalogue({...record,author:'Author not recorded',held:false}, filters)).toBe(false);
   expect(matchesCatalogue({...record,author:'Author not recorded',categories:['history']}, filters)).toBe(false);
 });
 it('facet counts omit only their own selected dimension',()=>{
   expect(matchesCatalogue(record, filters, 'review')).toBe(true);
   expect(matchesCatalogue(record, filters, 'holdings')).toBe(false);
   expect(matchesCatalogue({...record,author:'Author not recorded',categories:['history']}, filters, 'category')).toBe(true);
   expect(matchesCatalogue({...record,author:'Author not recorded',title:'Unrelated text'}, filters, 'category')).toBe(false);
 });
});

describe('tradition, era and source facets',()=>{
 const base={category:'all',holdings:'all',review:'all' as const,query:''};
 const enriched:SourceEntry={...record,metadata:{authors:[],traditions:['baptist','reformed'],eras:['modern'],basis:'exact IDs'}};
 it('includes either choice within a group and intersects separate groups',()=>{
  expect(matchesCatalogue(enriched,{...base,facets:{tradition:['catholic','baptist'],era:['modern']}})).toBe(true);
  expect(matchesCatalogue(enriched,{...base,facets:{tradition:['baptist'],era:['medieval']}})).toBe(false);
  expect(matchesCatalogue(enriched,{...base,facets:{tradition:['baptist'],era:['medieval']}},'era')).toBe(true);
 });
 it('keeps unlinked records visible as unresolved and never infers a tradition from a provider',()=>{
  expect(facetValues(record,'tradition')).toEqual(['unrecorded']);
  expect(matchesCatalogue(record,{...base,facets:{tradition:['unrecorded']}})).toBe(true);
  expect(matchesCatalogue(record,{...base,facets:{tradition:['reformed']}})).toBe(false);
 });
 it('normalizes text formats, deduplicates host counts and distinguishes site citation from holdings',()=>{
  const e={...record,links:[{url:'https://www.example.org/a',sourceId:'',format:'txt'},{url:'https://example.org/b',sourceId:'',format:'text'}]};
  expect(facetValues(e,'format')).toEqual(['text']);expect(facetValues(e,'provider')).toEqual(['example.org']);
  expect(facetValues(e,'use')).toEqual(['not-cited']);
  expect(facetValues({...e,citedOn:[{feature:'Study',page:'Page',address:'/study'}]},'use')).toEqual(['cited']);
 });
 it('removes one selected value without clearing the other filters',()=>{
  const selected={...base,facets:{tradition:['baptist','catholic'],era:['modern']}};
  expect(toggleFacet(selected,'tradition','baptist').facets).toEqual({tradition:['catholic'],era:['modern']});
  expect(toggleFacet(selected,'tradition','all').facets).toEqual({tradition:[],era:['modern']});
 });
});
