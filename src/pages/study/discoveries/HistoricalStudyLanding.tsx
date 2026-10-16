import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { discoveryStudies, type DiscoveryStudyId } from './related-studies';
import { HistoricalLandingArt } from './HistoricalLandingArt';
import './historical-landings.css';

export default function HistoricalStudyLanding({study}:{study:DiscoveryStudyId}) {
  const item=discoveryStudies.find(s=>s.id===study)!;
  useEffect(()=>{const old=document.title;document.title=item.title+' · Bible Project';return()=>{document.title=old;};},[item.title]);
  return <main className={'dh-landing dh-'+study}><nav className="dh-breadcrumb" aria-label="Study navigation"><Link to="/study/from-discovery-to-history"><ArrowLeft size={15} aria-hidden="true"/>From discovery to history</Link><Link to="/study/academic?area=history">History & archaeology</Link></nav><header className="dh-opening"><div><p className="dh-eyebrow">History & archaeology</p><h1>{item.first}<br/><em>{item.emphasis}</em></h1></div><HistoricalLandingArt kind={study}/></header></main>;
}
