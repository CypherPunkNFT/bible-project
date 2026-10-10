import {names, themes, type World} from '../worldview-art/art';
import {ArtifactGlyph} from './glyphs';
import {Centerpiece} from './centerpieces';
import {IslamObjectGlyph,islamObjects} from './islam-objects';

type Placement={number:number;x:number;y:number;scale:number};
export const artifactSets:Record<World,{number:number;id:string;name:string}[]>={
 hinduism:[{number:1,id:'lamp',name:'Oil lamp'},{number:3,id:'bell',name:'Temple bell'},{number:21,id:'trident',name:'Trident'},{number:25,id:'garland',name:'Flower garland'},{number:26,id:'firealtar',name:'Fire altar'}],
 buddhism:[{number:10,id:'bowl',name:'Bowl & flame'},{number:14,id:'lotus',name:'Lotus'},{number:30,id:'banner',name:'Victory banner'},{number:33,id:'vajra',name:'Vajra'}],
 islam:islamObjects,
};
export const variants=[{name:'Balanced frame',detail:'Artifacts surround the centerpiece in a clear, open arrangement.'},{name:'Gathered below',detail:'Side accents lead into a lower cluster, keeping the upper silhouette open.'},{name:'Offset orbit',detail:'Alternating shapes and heights give the frame a more flowing rhythm.'}];
export function variantFor(world:World,version:number){return world==='islam'?[
 {name:'Prayer & light',detail:'Prayer beads, a fringed prayer rug and a suspended glass lamp.'},
 {name:'Reading & craft',detail:'An open Qur’an on its stand, reed pen and ink, a metal ewer and a pen box.'},
 {name:'Books & instruments',detail:'A spherical incense burner, Qur’an binding and a portable qibla compass.'},
][version]:variants[version];}
export const selectedMain={hinduism:'B · Temple',buddhism:'A · Eightfold Path',islam:'B · Mosque'};
const p=(number:number,x:number,y:number,scale:number):Placement=>({number,x,y,scale});
const arrangements:Record<World,Placement[][]>={
 hinduism:[
  [p(3,99,126,.77),p(25,365,130,.62),p(26,103,280,.80),p(21,400,263,.77)],
  [p(3,95,183,.77),p(21,445,181,.77),p(1,152,329,.73),p(25,390,317,.64),p(26,270,354,.77)],
  [p(3,100,125,.74),p(1,441,131,.80),p(25,100,273,.67),p(21,441,269,.77),p(26,270,354,.77)],
 ],
 buddhism:[
  [p(10,104,123,1.06),p(30,437,126,.77),p(14,105,284,.78),p(33,436,281,.76)],
  [p(30,108,177,.77),p(10,432,177,1.06),p(14,190,329,.78),p(33,359,328,.76)],
  [p(14,108,124,.77),p(30,436,133,.77),p(10,106,290,1.04),p(33,433,287,.77)],
 ],
 islam:[
  [p(45,102,137,.88),p(46,441,145,.77),p(47,270,354,.70)],
  [p(48,103,141,.72),p(49,440,142,.76),p(50,103,280,.77),p(54,270,352,.74)],
  [p(51,105,146,.76),p(52,439,132,.74),p(53,106,283,.77)],
 ],
};
export function Composition({world,version,numbers=false}:{world:World;version:number;numbers?:boolean}){
 const mainScale=world==='hinduism'?.90:world==='islam'?.98:1;
 return <svg className={'wa-svg wc-svg wa-svg-'+world} viewBox="20 10 500 405" fill="none" aria-label={`${names[world]}: ${variantFor(world,version).name}`} role="img">
  <circle className="wa-ring" cx="270" cy="177" r={version===1?145:151} strokeDasharray={version===2?'1 12':'1 8'} opacity=".43"/>
  {version===0?<circle cx="270" cy="177" r="132" opacity=".16"/>:version===1?<path d="M142 240V162q0-92 128-130 128 38 128 130v78" opacity=".16"/>:<g opacity=".20"><path d="M169 68a148 148 0 0 1 202 0M417 197a148 148 0 0 1-59 101M182 298a148 148 0 0 1-59-101"/><path d="m266 22 4-7 4 7-4 7ZM482 194l5 6-5 6-5-6ZM61 194l5 6-5 6-5-6Z"/></g>}
  <g className="wc-centerpiece" data-main={selectedMain[world]} transform={`translate(270 ${world==='buddhism'?172:158}) scale(${mainScale}) translate(-270 -182)`}><Centerpiece world={world}/></g>
  {arrangements[world][version].map(place=>{const artifact=artifactSets[world].find(a=>a.number===place.number)!;return <g key={place.number} data-artifact={place.number} className="wc-placed-artifact" transform={`translate(${place.x} ${place.y}) scale(${place.scale})`}>{world==='islam'?<IslamObjectGlyph number={place.number}/>:<ArtifactGlyph id={artifact.id}/>}<>{numbers&&<text className="wc-number" x="0" y={world==='islam'||artifact.id==='firealtar'?78:65} textAnchor="middle" stroke="none" fill="currentColor">{place.number}</text>}</></g>;})}
  <g opacity=".38"><circle cx="171" cy="76" r="2"/><circle cx="373" cy="76" r="2"/><path d="M84 220v10m-5-5h10M451 220v10m-5-5h10"/></g>
 </svg>;
}
export function Legend({world,version=0}:{world:World;version?:number}){return <div className="wc-legend">{artifactSets[world].filter(a=>arrangements[world][version].some(p=>p.number===a.number)).map(a=><span key={a.number}><b>{a.number}</b> {a.name}</span>)}</div>;}
export {names,themes};
