import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { discoveryStudies } from './related-studies';
import './historical-landings.css';

export function RelatedDiscoveryStudy({id}:{id:string}) {
  const study=discoveryStudies.find(s=>s.id===id);
  if(!study)return null;
  return <aside className="dr-related-study"><span>Historical study · illustrated landing</span><Link to={study.route}>{study.title}<ArrowRight size={16} aria-hidden="true"/></Link></aside>;
}
