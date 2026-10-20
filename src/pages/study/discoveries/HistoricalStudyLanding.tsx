import { StudyTrail } from "@/components/study/StudyTrail";
import { useEffect } from 'react';
import { discoveryStudies, type DiscoveryStudyId } from './related-studies';
import { HistoricalLandingArt } from './HistoricalLandingArt';
import './historical-landings.css';

// The words above each title: what the study is about.
const EYEBROW: Record<DiscoveryStudyId, string> = {
  mesha: 'Moab · The Mesha Stele · Ninth century BCE',
  lachish: 'Judah · Sennacherib’s campaign · 701 BCE',
  cyrus: 'Persia · The Cyrus Cylinder · Return to Judah',
};

export default function HistoricalStudyLanding({study}:{study:DiscoveryStudyId}) {
  const item=discoveryStudies.find(s=>s.id===study)!;
  useEffect(()=>{const old=document.title;document.title=item.title+' · Bible Project';return()=>{document.title=old;};},[item.title]);
  return <main className={'dh-landing study-frame dh-'+study}><header className="dh-opening"><div><StudyTrail area="history" parent={{to:"/study/from-discovery-to-history",label:"From discovery to history"}}/><p className="dh-eyebrow">{EYEBROW[study]}</p><h1>{item.first}<br/><em>{item.emphasis}</em></h1></div><HistoricalLandingArt kind={study}/></header></main>;
}
