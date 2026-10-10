import {useRef,useState} from 'react';
import {Maximize2,X} from 'lucide-react';

export const islamObjects=[
 {number:45,id:'prayerbeads',name:'Prayer beads / misbaha',description:'A strand of individual beads with a spacer and tassel, used to count devotional recitation.',source:'https://www.metmuseum.org/art/collection/search/453025'},
 {number:46,id:'prayerrug',name:'Prayer rug',description:'A fringed textile with a prayer-niche pattern inside a woven border.',source:'https://islamicart.museumwnf.org/database_item.php?id=object%3BISL%3Bse%3BMus01_A%3B44%3Ben'},
 {number:47,id:'glasslamp',name:'Glass mosque lamp',description:'A suspended glass vessel with a flared mouth, rounded body and small foot.',source:'https://www.metmuseum.org/art/collection/search/444714'},
 {number:48,id:'quranstand',name:'Qur’an & folding stand',description:'An open text resting on a carved wooden reading support.',source:'https://collections.lacma.org/object/6486'},
 {number:49,id:'penink',name:'Reed pen & inkwell',description:'A cut reed pen beside a small lidded ink vessel, for manuscript work and calligraphy.',source:'https://www.metmuseum.org/art/collection/search/443174'},
 {number:50,id:'ewer',name:'Metal ewer',description:'A pouring vessel with a narrow neck, curved spout and arched handle.',source:'https://www.metmuseum.org/art/collection/search/448450'},
 {number:51,id:'burner',name:'Spherical incense burner',description:'A pierced metal globe suspended from a chain, with a seam dividing its two halves.',source:'https://www.metmuseum.org/art/collection/search/447019'},
 {number:52,id:'binding',name:'Qur’an binding',description:'A closed volume with a decorated cover, visible page edges and an envelope flap.',source:'https://collections.agakhanmuseum.org/collection/artifact/upper-cover-and-front-doublure-of-a-qur-an-binding-akm386'},
 {number:53,id:'compass',name:'Qibla compass',description:'A portable direction-finding instrument represented by a hinged case and compass needle.',source:'https://islamicworld.britishmuseum.org/collection/RRM17193'},
 {number:54,id:'penbox',name:'Calligrapher’s pen box',description:'An elongated case for reed pens and other writing tools, with a compartment for ink.',source:'https://www.metmuseum.org/art/collection/search/446989'},
];

export function IslamObjectGlyph({number}:{number:number}){
 return <g className="wc-islam-object" data-object={number}>
  {number===45?<><path d="M0-32C-35-30-35 29 0 33C35 29 35-30 0-32" opacity=".4"/>{Array.from({length:33},(_,i)=>{const a=-Math.PI/2+i*2*Math.PI/33;return <circle key={i} cx={Math.cos(a)*27} cy={Math.sin(a)*32} r="2.25"/>;})}<path d="M0 35v7M-4 42h8v7h-8ZM-3 49l-4 13m5-13v13m3-13v13m2-13 4 13"/></>:
   number===46?<g transform="rotate(-8)"><path d="M-29-43h58v86h-58ZM-24-37h48v74h-48ZM-18 29V-5q0-13 18-24 18 11 18 24v34M-12 26V-4q0-8 12-16 12 8 12 16v30M-18 29h36M-22-28l4-4 4 4-4 4ZM14-28l4-4 4 4-4 4Z"/>{[-24,-16,-8,0,8,16,24].map(x=><path key={x} d={`M${x}-43v-8M${x} 43v8`}/>)}</g>:
   number===47?<><path d="M0-65v22M0-43-22-18m22-25 22 25M-27-26q27-8 54 0-27 8-54 0ZM-24-24l10 19q-20 10-17 28 3 21 31 21t31-21q3-18-17-28l10-19M-31 17q31 11 62 0M-28 27q28 9 56 0M-13 44v6h26v-6M-17 50h34M-7 6q7-6 14 0v7H-7Z"/><circle cy="-43" r="3"/></>:
   number===48?<><path d="M-45-20q23-14 45-2 22-12 45 2v34Q22 1 0 14q-23-13-45 0ZM0-22v36M-50-14v35q25-13 50 0 25-13 50 0v-35M-37-6q14-5 27 0m-27 9q14-5 27 0m20-9q13-5 27 0m-27 9q13-5 27 0M-39 22l74 23m-70-23L39 45M-29 26l-12 26m70-26 12 26M-41 52h14m14-26-9 19m49 7h14M13 26l9 19"/></>:
   number===49?<><path d="M-44 32 3-46l8 5-48 78ZM-44 32l-7 13 14-8M-42 36l7-9M-12-19l7 4m-28 26 7 4M14 8q17-7 34 0v29q-17 7-34 0ZM14 8q17 7 34 0M18 8v-7q13-9 26 0v7M18 1q13-4 26 0M28-6v-6h6v6M18 37v5h26v-5M23 18h16m-16 8h16"/></>:
   number===50?<><path d="M-12-26h24v-9h-24ZM-12-26v15q-22 7-23 28-1 28 35 28t35-28q-1-21-23-28v-15M-16-36q16-15 32 0M0-44v-7M17-10q38-12 32 13-3 15-16 22m-9-29q21-7 19 8-2 8-9 12M-27 3q-15-9-18-29h-9q1 33 21 44M-54-26h9M-30 20q30 12 60 0M-14 45v6h28v-6M-18 51h36M-9 9q9-8 18 0v8H-9Z"/></>:
   number===51?<><path d="M0-64v21M-5-38v-5h10v5M0-37a37 37 0 1 0 0 74 37 37 0 1 0 0-74ZM-37 0h74M-35 7h70M-12-35q-12 35 0 70m24-70q12 35 0 70"/>{[-18,0,18].map(x=>[-18,19].map(y=><path key={`${x}:${y}`} d={`M${x} ${y-4}l4 4-4 4-4-4Z`}/>))}<circle cy="-38" r="3"/></>:
   number===52?<g transform="rotate(-8)"><path d="M-31-45h62v90h-62ZM-25-39h50v78h-50ZM31-45l9-6v90l-9 6M-31 45l9 6h62v-12M31-26l21 26-21 26M-31-45v90M-4-22 4-13 14-17 11-7 21 0 11 7 14 17 4 13-4 22-12 13-22 17-19 7-29 0-19-7-22-17-12-13Z" transform="translate(4 0)"/><path d="M-9-8l8-8 8 8-8 8ZM-18-30h30m-30 60h30"/></g>:
   number===53?<><circle cx="-23" cy="-34" r="21"/><circle cx="-23" cy="-34" r="16"/><path d="M-8-20 2-11M-11-15l5-5M2-11l5-5"/><circle cy="19" r="30"/><circle cy="19" r="24"/><path d="M0-2l5 16 16 5-16 5-5 16-5-16-16-5 16-5ZM0-2v42M-21 19h42M-5 19l5-17 5 17-5 17Z"/><path d="M0-11v6m0 50v4M-30 19h5m50 0h5"/></>:
   number===54?<><path d="M-52-7h104v25h-104ZM-52-7l13-13h104L52-7M52-7l13-13v25L52 18M-52 18l13 8h104V5M-39 26V18M-43 0h65v11h-65ZM30-2h15v15H30ZM-35 3h44m-44 5h44M-6-17h42M-19-12h-25m97-6h7"/></>:null}
 </g>;
}

export function IslamObjectGrid(){
 const dialog=useRef<HTMLDialogElement>(null),[object,setObject]=useState(islamObjects[0]);
 function enlarge(number:number){setObject(islamObjects.find(o=>o.number===number)!);dialog.current?.showModal();}
 return <section className="wc-object-section" id="islam-objects"><header><p className="wa-kicker">Islam / Ten object directions</p><h3>Objects for prayer, reading and daily life.</h3><p>Physical objects to compare around the mosque. Each drawing has a name and a museum reference.</p></header><div className="wa-artifact-grid">{islamObjects.map(item=><article className="wa-artifact-card wc-object-card" key={item.number}><div className="wa-artifact-heading"><span className="wa-kicker">{item.number}</span><button aria-label={`Enlarge Islamic object ${item.number}`} onClick={()=>enlarge(item.number)}><Maximize2 size={13}/></button></div><svg viewBox="-75 -75 150 150" fill="none" aria-hidden="true"><IslamObjectGlyph number={item.number}/></svg><h4>{item.name}</h4><p>{item.description}</p><a href={item.source} target="_blank" rel="noreferrer">Museum reference ↗</a></article>)}</div><dialog className="wa-dialog wc-object-dialog" ref={dialog}><header><div><p className="wa-kicker">Islam / Object {object.number}</p><h2>{object.name}</h2></div><button aria-label="Close Islamic object" onClick={()=>dialog.current?.close()}><X size={20}/></button></header><svg viewBox="-75 -75 150 150" fill="none" aria-hidden="true"><IslamObjectGlyph number={object.number}/></svg><p>{object.description}</p><a href={object.source} target="_blank" rel="noreferrer">Museum reference ↗</a></dialog></section>;
}
