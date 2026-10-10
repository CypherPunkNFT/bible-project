import {useEffect,useState} from 'react';

const options=[
 {name:'Low dome',path:'M5 32h30M9 31V21h22v10M10 20c0-7 7-8 10-12 3 4 10 5 10 12H10ZM17 31v-6a3 3 0 0 1 6 0v6M20 9V6'},
 {name:'One minaret',path:'M4 33h32M12 32V22h22v10M13 21c0-6 7-7 10-11 3 4 10 5 10 11H13ZM23 10V7M20 32v-6a3 3 0 0 1 6 0v6M5 32V13h5v19M4 13h7L7.5 7 4 13ZM7.5 7V4'},
 {name:'Twin minarets',path:'M3 33h34M11 32V23h18v9M12 22c0-5 5-7 8-10 3 3 8 5 8 10H12ZM17 32v-5a3 3 0 0 1 6 0v5M4 32V15h4v17M32 32V15h4v17M3 15h6L6 9l-3 6ZM31 15h6l-3-6-3 6ZM6 9V6M34 9V6'},
 {name:'Round dome',path:'M5 32h30M9 31V20h22v11M10 19a10 10 0 0 1 20 0H10ZM17 31v-6a3 3 0 0 1 6 0v6M20 9V6M22 3a3 3 0 1 0 2 5 3 3 0 0 1-2-5'},
 {name:'Single silhouette',path:'M5 33h30M8 32V20c0-6 9-8 12-13 3 5 12 7 12 13v12M17 32v-6c0-3 2-4 3-5 1 1 3 2 3 5v6M20 7V4'},
 {name:'Dome & tower',path:'M4 33h32M5 32V15h5v17M4 15h7L7.5 8 4 15ZM7.5 8V5M14 32V23h20v9M15 22c0-7 5-9 9-12 4 3 9 5 9 12H15ZM21 32v-5a3 3 0 0 1 6 0v5M24 10V7'},
 {name:'Three domes',path:'M4 33h32M6 32V23h28v9M6 22c0-3 3-4 5-6 2 2 5 3 5 6M16 22c0-5 1-8 4-11 3 3 4 6 4 11M24 22c0-3 3-4 5-6 2 2 5 3 5 6M6 23h28M17 32v-5a3 3 0 0 1 6 0v5M20 11V8'},
 {name:'Minimal mosque',path:'M5 32h30M10 31V22h20v9M11 21c0-6 6-7 9-11 3 4 9 5 9 11M20 26v5M5 31V11M3 12l2-5 2 5M35 31V11M33 12l2-5 2 5'},
];
function read(){const n=Number(new URLSearchParams(window.location.search).get('m'));return n>=1&&n<=8?n:2;}
export function useMosque(){const [n,setN]=useState(read);useEffect(()=>{const update=()=>setN(read());window.addEventListener('mosquechange',update);window.addEventListener('popstate',update);return()=>{window.removeEventListener('mosquechange',update);window.removeEventListener('popstate',update);};},[]);return n;}
export function MosqueIcon({variant=2,className='sm-glyph'}:{variant?:number;className?:string}){return <svg className={className} data-mosque={variant} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={variant===4?options[3].path.replace('M22 3a3 3 0 1 0 2 5 3 3 0 0 1-2-5',''):options[variant-1].path}/>{variant===4&&<circle cx="20" cy="4" r="2.4" fill="currentColor" stroke="none"/>}</svg>;}
export function MosqueGallery(){
 const selected=useMosque();
 if(new URLSearchParams(window.location.search).get('icons')!=='mosques')return null;
 function select(n:number){const u=new URL(window.location.href);u.searchParams.set('m',String(n));window.history.replaceState(window.history.state,'',u);window.dispatchEvent(new Event('mosquechange'));}
 return <section className="mi-gallery" aria-labelledby="mi-title"><header><div><span className="ap-eyebrow">Islam / Line art</span><h1 id="mi-title">A smaller mosque.</h1><p>Choose an icon to see it in the navigation above.</p></div></header><div className="mi-grid">{options.map((o,i)=><button key={o.name} onClick={()=>select(i+1)} aria-pressed={selected===i+1} aria-label={(i+1)+'. '+o.name}><span className="mi-number">{String(i+1).padStart(2,'0')}</span><MosqueIcon variant={i+1} className="mi-large"/><strong>{o.name}</strong><div className="mi-sizes"><MosqueIcon variant={i+1} className="mi-actual"/><MosqueIcon variant={i+1} className="mi-small"/></div></button>)}</div></section>;
}
