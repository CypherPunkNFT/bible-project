import {ObjectArt} from './artifacts';
import type {World} from './centerpieces';
import {CardCenterpiece} from './centerpieces';
import {CardArtifactGlyph,CardIslamObject} from './artifacts';

type ObjectPlacement={number:number;id?:string;x:number;y:number;scale:number};
const objects:Record<World,ObjectPlacement[][]>={
 hinduism:[[
  {number:21,id:'trident',x:133,y:148,scale:1.47},
  {number:26,id:'firealtar',x:278,y:152,scale:1.20},
  {number:25,id:'garland',x:625,y:145,scale:1.10},
  {number:3,id:'bell',x:772,y:151,scale:2.00},
 ]],
 buddhism:[[
  {number:10,id:'bowl',x:246,y:108,scale:1.35},
  {number:14,id:'lotus',x:246,y:226,scale:1.00},
  {number:30,id:'banner',x:654,y:99,scale:1.06},
  {number:33,id:'vajra',x:654,y:226,scale:1.25},
 ]],
 islam:[[
  {number:45,x:131,y:146,scale:1.23},
  {number:46,x:260,y:151,scale:1.26},
  {number:47,x:630,y:154,scale:1.16},
  {number:51,x:777,y:158,scale:1.12},
 ]],
};

export function FineDetails({world}:{world:string}){return <g className="wc-card-details">
 <g opacity=".34">
 <path d="M71 115v10m-5-5h10M823 210v10m-5-5h10M370 28v8m-4-4h8M800 64l4 6-4 6-4-6ZM97 244l4 6-4 6-4-6Z"/>
 <circle cx="318" cy="54" r="2"/><circle cx="583" cy="264" r="2"/><circle cx="830" cy="161" r="2"/>
 <path d="M167 252q21 9 39 0M713 41q20-8 36 3" strokeDasharray="1 7"/>
 {world==='buddhism'&&<>
  <path d="M137 76l4 7-4 7-4-7ZM766 225l4 7-4 7-4-7ZM106 206l3 4-3 4-3-4ZM794 102l3 4-3 4-3-4Z"/>
 </>}
 {world==='hinduism'&&<path d="M215 73l4 6-4 6-4-6ZM697 224l4 6-4 6-4-6ZM202 226v8m-4-4h8M718 80v8m-4-4h8"/>}
 {world==='islam'&&<path d="M192 58l5 5-5 5-5-5ZM711 246l5 5-5 5-5-5ZM92 201l3 3-3 3-3-3Z"/>}
 </g>
 {world==='buddhism'&&<g opacity=".7"><ObjectArt item="leaf" x={122} y={143} scale={.48}/><ObjectArt item="beads" x={782} y={152} scale={.53}/></g>}
 </g>;}

/** A 3:1 drawing field; every main and object uses uniform scaling. */
export function WideArtwork({world}:{world:World}){
 const scale=world==='hinduism'?.82:world==='islam'?1:1.10;
 return <svg className={'wv-art wc-wide-art wc-wide-'+world} viewBox="0 0 900 300" fill="none" aria-hidden="true" focusable="false" data-world={world}>
  <circle className="wc-card-orbit" cx="450" cy="150" r={world==='buddhism'?136:124} strokeDasharray="1 8" opacity=".69"/>
  <circle className="wc-card-halo" cx="450" cy="150" r={world==='buddhism'?124:112} opacity=".12"/>
  <g className="wc-card-centerpiece" transform={`translate(450 ${world==='buddhism'?150:146}) scale(${scale}) translate(-270 -182)`}><CardCenterpiece world={world}/></g>
  {objects[world][0].map(item=><g className="wc-card-object" data-artifact={item.number} key={item.number} transform={`translate(${item.x} ${item.y}) scale(${item.scale})`}>
   {world==='islam'?<CardIslamObject number={item.number}/>:<CardArtifactGlyph id={item.id!}/>}
  </g>)}
  <FineDetails world={world}/>
 </svg>;
}
