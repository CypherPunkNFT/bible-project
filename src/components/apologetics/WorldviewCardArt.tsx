import {WideArtwork} from './worldview-card-art/art';
import {ScienceArtwork} from './worldview-card-art/science';

/** Approved collection artwork; the full card remains a single navigation link. */
export function WorldviewCardArt({id}:{id:string}){
 return <div className="wc-art-stage">
  {id==='secular'?<ScienceArtwork/>:
   id==='islam'||id==='buddhism'||id==='hinduism'?<WideArtwork world={id}/>:null}
 </div>;
}
