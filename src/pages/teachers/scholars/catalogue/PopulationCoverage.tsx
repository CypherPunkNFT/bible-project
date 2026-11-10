import { useEffect, useState } from 'react';
import { useScholars } from '../context';
import { POPULATION_BASE, getUnattributedPage, type PopulationRecord } from '../population';
import { downloadCompleteCatalogue } from './export-download';
import { useDownloadBusy } from '@/components/download/download';
import { PopulationRecordRow } from './PopulationWorks';
import { formatDateTime, formatNumber } from "@/lib/site-format";

// Clauses after a ";" in the reconciliation notes. Each clause is its own text node, because the collector never registers
// a text holding ";" (content/translation/page_rules.py), so a whole sentence with one would stay English.
const FIELD_SUBJECTS = "Fields describe subjects of works";
const PROFILE_EXPERTISE = "only documented profiles establish expertise.";
const PROFILE_DATES = "their documented profile dates take precedence.";
const MEMBERSHIPS_KEPT = "all memberships are retained and labeled.";

function Unattributed({total}:{total:number}) {
  const [page,setPage]=useState(0),[rows,setRows]=useState<PopulationRecord[]|null>(null),[error,setError]=useState('');
  useEffect(()=>{
    const abort=new AbortController();setRows(null);setError('');
    getUnattributedPage(page,abort.signal).then(setRows).catch(e=>{if(!abort.signal.aborted)setError(e.message);});
    return()=>abort.abort();
  },[page]);
  const last=Math.max(0,Math.ceil(total/100)-1);
  return <div className="pop-unattributed"><p>{`${formatNumber(total)} records have no linked contributor credit. These records are kept outside the people population. The complete list is also in the export.`}</p><div className="pop-links"><button type="button" disabled={!page} onClick={()=>setPage(p=>p-1)}>Previous</button><label>Page <input aria-label="Unattributed records page" type="number" min={1} max={last+1} value={page+1} onChange={e=>setPage(Math.max(0,Math.min(last,Number(e.target.value)-1)))}/>{` of ${formatNumber(last+1)}`}</label><button type="button" disabled={page>=last} onClick={()=>setPage(p=>p+1)}>Next</button></div>{!rows&&!error&&<p role="status">Loading records…</p>}{error&&<p role="alert">{error}</p>}<ul className="pop-unattributed-list slim-scroll">{rows?.map(r=><PopulationRecordRow key={r.id} record={r}/>)}</ul></div>;
}
export function PopulationCoverage() {
  const {population}=useScholars();const [unknown,setUnknown]=useState(false);
  const [downloading,setDownloading]=useState(false),[downloadError,setDownloadError]=useState('');const busy=useDownloadBusy();
  const download=async()=>{setDownloading(true);setDownloadError('');try{setDownloadError(await downloadCompleteCatalogue());}finally{setDownloading(false);}};
  if(!population)return null;
  const {summary:s,reconciliation:r}=population;
  const reconciledAt=formatDateTime(new Date(population.builtAt), {timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'});
  const dateStatuses=Object.entries(s.dateStatus).map(([k,v])=>`${formatNumber(v)} ${k}`).join(' · ');
  const readerGaps=Object.entries(r.localReaderAudit?.issues??{}).map(([k,v])=>`${formatNumber(v)} ${k.replace(/_/g,' ')}`).join(' · ');
  return <div className="pop-coverage">
    <div className="pop-export"><span>{`Reconciled ${reconciledAt} ET`}</span><button type="button" disabled={downloading||busy} onClick={download}>{downloading?"Preparing complete export…":"Download complete table & works (ZIP / CSV)"}</button>{downloadError&&<span role="alert">{downloadError}</span>}<a href={`${POPULATION_BASE}/reconciliation.json`} download>Reconciliation JSON</a></div>
    <details><summary>Population, source coverage and count reconciliation</summary>
      <p>{`${formatNumber(s.contributors)} entries`}{" = "}{`${formatNumber(s.baselineMergedEntries)} existing merged entries`}{" + "}{`${formatNumber(s.registryAdditions)} registry entries`}{" + "}{`${formatNumber(s.intakeCreditAdditions)} additional intake credits`}{" + "}
        {`${formatNumber(s.featureCreditAdditions)} source-use credits. Its baseline uses ${formatNumber(r.baselineMerge.fieldEntries)} field entries plus ${formatNumber(r.baselineMerge.fallbackEntries)} fallback entries.`}{" "}
        {`${formatNumber(r.baselineMerge.entriesWithoutSourceIds)} field entries have no source contributor ID`}{"; "}{`${formatNumber(r.baselineMerge.groupsWithMultipleSourceIds)} groups contain multiple explicitly reconciled IDs.`}{" "}
        {`The existing merge represents all ${formatNumber(s.sourceContributors)} packaged contributor IDs, including ${formatNumber(s.sourceAuthorEntries)} with an author role.`}{" "}
        {`${formatNumber(s.documentedProfiles)} entries have curated Scholars profiles`}{"; "}{`${formatNumber(s.documentedTeacherProfiles)} have existing teacher profiles.`}</p>
      <p>{`${formatNumber(s.canonicalWorks)} canonical work IDs · ${formatNumber(s.canonicalEditions)} canonical edition IDs · ${formatNumber(s.publicRecords)} packaged records · ${formatNumber(s.localReadingCopies)} local reader copies · ${formatNumber(s.intakeMetadataRecords)} additional intake metadata records · ${formatNumber(s.siteSourceRecords)} feature source records. These units overlap and do not represent distinct books.`}{" "}
        {`The ${formatNumber(s.publicRecords)} packaged records comprise ${formatNumber(s.publicHeldRecords)} held representations and ${formatNumber(s.catalogueOnlyPublicRecords)} catalogue-only records`}{"; "}{`${formatNumber(s.publicReadingRecords)} have public reading text.`}</p>
      <p>{`${formatNumber(s.recordContributorAssociations)} record-to-contributor associations · ${formatNumber(s.workContributorAssociations)} canonical work-to-contributor associations · ${formatNumber(s.unclassified)} entries without an assigned field.`}{" "}{FIELD_SUBJECTS}{"; "}{PROFILE_EXPERTISE}</p>
      <p>{`${formatNumber(s.datedBirths)} supported birth years (${formatNumber(s.approximateBirths)} approximate) · ${formatNumber(s.floruitOnly)} floruit-only entries.`}{" "}{`${dateStatuses}.`}{" "}
        {`Floruit is never plotted as birth. ${formatNumber(s.documentedSourceConflicts)} documented profiles retain conflicting source labels for review`}{"; "}{PROFILE_DATES}</p>
      <p>{`${formatNumber(s.identityReviewEntries)} entries carry an identity review flag.`}{" "}{`${formatNumber(r.shelfMembershipDrift.length)} contributor shelves disagree with record contributor metadata`}{"; "}{MEMBERSHIPS_KEPT}{" "}
        {`The catalogue and contributor shards report ${formatNumber(r.sourceCreditMemberships.contributorShards)} credit memberships`}{"; "}{`record metadata identifies ${formatNumber(r.sourceCreditMemberships.recordContributorIds)}.`}{" "}
        {`The ${formatNumber(r.sourceCreditMemberships.missingFromShards)} additional record memberships are included.`}{" "}{`${formatNumber(r.unresolvedWorkIds.length)} referenced work IDs and ${formatNumber(r.unresolvedEditionIds.length)} edition IDs lack a canonical file.`}</p>
      <p>{`The packaged catalogue is dated ${r.packagedUpdatedAt.slice(0,10)}.`}{" "}{`The older facts file had ${formatNumber(r.oldFactsSummary.catalogueEntries)} rows`}{"; "}{`${formatNumber(s.baselineMergedEntries-r.oldFactsSummary.catalogueEntries)} newer packaged identities lacked facts.`}{" "}
        {`Every current entry now receives documented facts or explicit unknowns in this shared snapshot. Reader snapshot: ${r.localReaderAudit?.builtAt.slice(0,19)??'unavailable'}. Intake body hashes absent from the public package: ${formatNumber(r.intake.bodyHashesAbsentFromPublic)}.`}</p>
      <p>{`${formatNumber(s.publicWithoutAuthorLabels)} packaged records lack an author label`}{"; "}{`${formatNumber(s.publicUnattributedRecords)} remain without any linked contributor after reconciliation. Editor credits, supplemental credits and canonical authorship are different evidence.`}</p>
      <p>{r.counting}</p><p>{`Local reader gaps: ${readerGaps}.`}</p>
    </details>
    <details onToggle={e=>setUnknown(e.currentTarget.open)}><summary>{`Unattributed holdings · ${formatNumber(s.unattributedRecords)} records`}</summary>{unknown&&<Unattributed total={s.unattributedRecords}/>}</details>
  </div>;
}
