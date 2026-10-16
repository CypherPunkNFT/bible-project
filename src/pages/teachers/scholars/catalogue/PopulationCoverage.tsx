import { useEffect, useState } from 'react';
import { useScholars } from '../context';
import { POPULATION_BASE, downloadPopulationExport, getUnattributedPage, type PopulationRecord } from '../population';
import { PopulationRecordRow } from './PopulationWorks';

function Unattributed({total}:{total:number}) {
  const [page,setPage]=useState(0),[rows,setRows]=useState<PopulationRecord[]|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    const abort=new AbortController();setRows(null);setError('');
    getUnattributedPage(page,abort.signal).then(setRows).catch(e=>{if(!abort.signal.aborted)setError(e.message);});
    return()=>abort.abort();
  },[page]);
  const last=Math.max(0,Math.ceil(total/100)-1);
  return <div className="pop-unattributed"><p>{total.toLocaleString()} records have no linked contributor credit. These records are kept outside the people population. The complete list is also in the export.</p><div className="pop-links"><button type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><label>Page <input aria-label="Unattributed records page" type="number" min={1} max={last+1} value={page+1} onChange={e=>setPage(Math.max(0,Math.min(last,Number(e.target.value)-1)))}/> of {last+1}</label><button type="button" disabled={page>=last} onClick={()=>setPage(p=>p+1)}>Next</button></div>{!rows&&!error&&<p role="status">Loading records…</p>}{error&&<p role="alert">{error}</p>}<ul className="pop-unattributed-list slim-scroll">{rows?.map(r=><PopulationRecordRow key={r.id} record={r}/>)}</ul></div>;
}
export function PopulationCoverage() {
  const {population}=useScholars();const [unknown,setUnknown]=useState(false);
  const [downloading,setDownloading]=useState(false),[downloadError,setDownloadError]=useState('');
  const download=async()=>{setDownloading(true);setDownloadError('');try{await downloadPopulationExport();}catch(error){setDownloadError(error instanceof Error?error.message:'The complete export could not be loaded.');}finally{setDownloading(false);}};
  if(!population)return null;
  const {summary:s,reconciliation:r}=population;
  return <div className="pop-coverage">
    <div className="pop-export"><span>Reconciled {new Date(population.builtAt).toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'})} ET</span><button type="button" disabled={downloading} onClick={download}>{downloading?"Preparing complete export…":"Download complete table & works (ZIP / CSV)"}</button>{downloadError&&<span role="alert">{downloadError}</span>}<a href={`${POPULATION_BASE}/reconciliation.json`} download>Reconciliation JSON</a></div>
    <details><summary>Population, source coverage and count reconciliation</summary>
      <p>{s.contributors.toLocaleString()} entries = {s.baselineMergedEntries.toLocaleString()} existing merged entries + {s.registryAdditions} registry entries + {s.intakeCreditAdditions} additional intake credits + {s.featureCreditAdditions} source-use credits. Its baseline uses {r.baselineMerge.fieldEntries.toLocaleString()} field entries plus {r.baselineMerge.fallbackEntries.toLocaleString()} fallback entries. {r.baselineMerge.entriesWithoutSourceIds} field entries have no source contributor ID; {r.baselineMerge.groupsWithMultipleSourceIds} groups contain multiple explicitly reconciled IDs. The existing merge represents all {s.sourceContributors.toLocaleString()} packaged contributor IDs, including {s.sourceAuthorEntries.toLocaleString()} with an author role. {s.documentedProfiles} entries have curated Scholars profiles; {s.documentedTeacherProfiles} have existing teacher profiles.</p>
      <p>{s.canonicalWorks.toLocaleString()} canonical work IDs · {s.canonicalEditions.toLocaleString()} canonical edition IDs · {s.publicRecords.toLocaleString()} packaged records · {s.localReadingCopies.toLocaleString()} local reader copies · {s.intakeMetadataRecords.toLocaleString()} additional intake metadata records · {s.siteSourceRecords.toLocaleString()} feature source records. These units overlap and do not represent distinct books. The {s.publicRecords.toLocaleString()} packaged records comprise {s.publicHeldRecords.toLocaleString()} held representations and {s.catalogueOnlyPublicRecords.toLocaleString()} catalogue-only records; {s.publicReadingRecords.toLocaleString()} have public reading text.</p>
      <p>{s.recordContributorAssociations.toLocaleString()} record-to-contributor associations · {s.workContributorAssociations.toLocaleString()} canonical work-to-contributor associations · {s.unclassified.toLocaleString()} entries without an assigned field. Fields describe subjects of works; only documented profiles establish expertise.</p>
      <p>{s.datedBirths.toLocaleString()} supported birth years ({s.approximateBirths.toLocaleString()} approximate) · {s.floruitOnly} floruit-only entries. {Object.entries(s.dateStatus).map(([k,v])=>`${v.toLocaleString()} ${k}`).join(' · ')}. Floruit is never plotted as birth. {s.documentedSourceConflicts} documented profiles retain conflicting source labels for review; their documented profile dates take precedence.</p>
      <p>{s.identityReviewEntries.toLocaleString()} entries carry an identity review flag. {r.shelfMembershipDrift.length} contributor shelves disagree with record contributor metadata; all memberships are retained and labeled. The catalogue and contributor shards report {r.sourceCreditMemberships.contributorShards.toLocaleString()} credit memberships; record metadata identifies {r.sourceCreditMemberships.recordContributorIds.toLocaleString()}. The {r.sourceCreditMemberships.missingFromShards.toLocaleString()} additional record memberships are included. {r.unresolvedWorkIds.length} referenced work IDs and {r.unresolvedEditionIds.length} edition IDs lack a canonical file.</p>
      <p>The packaged catalogue is dated {r.packagedUpdatedAt.slice(0,10)}. The older facts file had {r.oldFactsSummary.catalogueEntries.toLocaleString()} rows; {s.baselineMergedEntries-r.oldFactsSummary.catalogueEntries} newer packaged identities lacked facts. Every current entry now receives documented facts or explicit unknowns in this shared snapshot. Reader snapshot: {r.localReaderAudit?.builtAt.slice(0,19)??'unavailable'}. Intake body hashes absent from the public package: {r.intake.bodyHashesAbsentFromPublic.toLocaleString()}.</p>
      <p>{s.publicWithoutAuthorLabels.toLocaleString()} packaged records lack an author label; {s.publicUnattributedRecords.toLocaleString()} remain without any linked contributor after reconciliation. Editor credits, supplemental credits and canonical authorship are different evidence.</p>
      <p>{r.counting}</p><p>Local reader gaps: {Object.entries(r.localReaderAudit?.issues??{}).map(([k,v])=>`${v.toLocaleString()} ${k.replace(/_/g,' ')}`).join(' · ')}.</p>
    </details>
    <details onToggle={e=>setUnknown(e.currentTarget.open)}><summary>Unattributed holdings · {s.unattributedRecords.toLocaleString()} records</summary>{unknown&&<Unattributed total={s.unattributedRecords}/>}</details>
  </div>;
}
