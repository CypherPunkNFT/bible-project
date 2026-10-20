import {useScholars} from './context';
import {IdeaLineage} from './landing/IdeaLineage';

const NO_MATCHES=new Set<string>();
export function Connections(){
 const {data,openProfile}=useScholars();
 return <div id="connections" className="scholar-connections">
  <header className="scholar-subhead"><h3>Knowledge, <em>handed on.</em></h3>
   <p>No work stands alone. Historians draw on earlier accounts; translators compare manuscripts and languages; archaeologists bring new inscriptions, places and material evidence into the discussion. Dictionaries and commentaries gather those findings, while theology and philosophy test their implications. Across these fields, later works preserve, revise and challenge earlier ones—sometimes strengthening an interpretation, sometimes reopening the question.</p></header>
  <IdeaLineage data={data} matches={NO_MATCHES} searching={false} onOpen={openProfile} initialView="lineage" sectionMode/>
 </div>;
}
