import type { ScholarsData } from "@/data/teachers/pages-types";
import { LegacyConstellation } from "./LegacyConstellation";
import { IdeaLineage } from "./IdeaLineage";
import {FocusTimeline} from './FocusTimeline';
import {useSearchParams} from 'react-router-dom';
interface SkyProps { data: ScholarsData; matches: ReadonlySet<string>; searching: boolean; onOpen: (id: string, origin: Element | null) => void }
export function Constellation(props: SkyProps) {
  const [params,setParams]=useSearchParams(),version=params.get('scholars-view');
  const switchView=(view:string)=>{const next=new URLSearchParams(params);next.set('scholars-view',view);setParams(next,{preventScrollReset:true});};
  return version === "spirals" ? <LegacyConstellation {...props}/> : version==='lineage'?<IdeaLineage {...props} initialView="lineage" onTimeline={()=>switchView('timeline')}/>:<FocusTimeline {...props} onConnections={()=>switchView('lineage')}/>;
}
