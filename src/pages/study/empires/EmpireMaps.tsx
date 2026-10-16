import { useId } from 'react';
import geography from './geography.json';
import type { Period } from './evidence';

const labels: Record<string,string> = { delta:'Egypt · Nile Delta',megiddo:'Megiddo',samaria:'Samaria',jerusalem:'Jerusalem',lachish:'Lachish',ekron:'Ekron',mizpah:'Mizpah*',dibon:'Dibon · Moab',damascus:'Damascus',qarqar:'Qarqar',carchemish:'Carchemish',kalhu:'Kalhu · Assyria',nineveh:'Nineveh · Assyria',babylon:'Babylon',gozan:'Gozan region' };
const offsets: Record<string,[number,number]>={kalhu:[12,20],nineveh:[12,-12],qarqar:[-10,-12],carchemish:[0,-13],samaria:[12,5],jerusalem:[12,16],lachish:[-12,19],ekron:[-12,-10],mizpah:[12,-13],dibon:[12,5],megiddo:[12,-12],delta:[0,23]};

function MapPanel({period,local,showMovement}:{period:Period;local?:boolean;showMovement:boolean}) {
  const uid=useId().replace(/:/g,'');
  const map=local?geography.local:geography.regional;
  const points=map.points as Record<string,number[]>;
  const edges=period.edges.filter(e=>showMovement||e.kind!=='movement');
  const ids=local?period.places: [...new Set(['jerusalem', ...edges.flatMap(e=>[e.from,e.to]), ...(period.id==='communities'?['babylon']:[])])];
  const visibleIds=ids.filter(id=>points[id][0]>15&&points[id][0]<map.width-15&&points[id][1]>15&&points[id][1]<map.height-15);
  const description = local?period.localNote:edges.map(e=>e.label).join('. ') || 'Judean communities remain in Babylonia alongside the community in Yehud.';
  return <figure className={`ie-map ${local?'ie-map-local':''}`}>
    <figcaption><span>{local?'02 / Close to home':'01 / The wider world'}</span><span>{local?'Southern Levant':'Egypt · Levant · Mesopotamia'}</span></figcaption>
    <div className="ie-map-viewport" tabIndex={0} role="region" aria-label={`${local?'Local':'Regional'} map. On narrow screens, scroll horizontally to inspect the whole map.`}><svg viewBox={`0 0 ${map.width} ${map.height}`} role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>{local?'Local':'Regional'} map · {period.date}</title><desc id={`${uid}-desc`}>{description} Physical coastlines are generalized; no political borders are drawn. Arrows are schematic relationships, not travel routes.</desc>
      <defs>{['force','tribute','movement','alliance'].map(kind=><marker key={kind} id={`${uid}-${kind}`} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" className={`ie-line-${kind}`}/></marker>)}</defs>
      <rect width={map.width} height={map.height} className="ie-water"/>
      <path d={map.land.replace(`M0,0L${map.width},0L${map.width},${map.height}L0,${map.height}Z`,'')} fillRule="evenodd" className="ie-land"/><path d={map.grid} className="ie-grid"/>
      {!local&&<><text x="128" y="133" className="ie-water-label" transform="rotate(-25 128 133)">Mediterranean Sea</text><text x="467" y="295" className="ie-region-label">ARABIAN DESERT</text><rect x={points.jerusalem[0]-28} y={points.megiddo[1]-15} width="70" height="95" rx="3" className="ie-inset"/></>}
      {local&&<text x="29" y="220" className="ie-water-label" transform="rotate(-90 29 220)">Mediterranean Sea</text>}
      {!local&&edges.map((edge,i)=>{
        const [x,y]=points[edge.from], [xx,yy]=points[edge.to];
        const dx=xx-x,dy=yy-y,length=Math.hypot(dx,dy), bend=Math.min(length*.2,80);
        const path=`M${x} ${y} Q${(x+xx)/2-dy/length*bend} ${(y+yy)/2+dx/length*bend} ${xx} ${yy}`;
        return <path key={`${period.id}-${i}`} d={path} className={`ie-relation ie-line-${edge.kind}`} markerEnd={`url(#${uid}-${edge.kind})`}/>;
      })}
      {visibleIds.map(id=>{
        const [x,y]=points[id]; const [ox,oy]=offsets[id]??[12,-10];
        const selected=period.places.includes(id);
        return <g key={id} className={selected?'ie-place ie-place-active':'ie-place'}>
          {selected&&<circle cx={x} cy={y} r={local?13:10} className="ie-place-halo"/>}
          <circle cx={x} cy={y} r={local?4:3.5}/>
          <text x={x+ox} y={y+oy} textAnchor={ox<0?'end':ox===0?'middle':'start'}>{labels[id]}</text>
        </g>;
      })}
      <g className="ie-north" transform={`translate(${map.width-24} 22)`}><path d="M0 19V0m-4 7L0 0l4 7"/><text y="33" textAnchor="middle">N</text></g>
    </svg></div>
    {!local&&<span className="ie-pan-hint">Scroll the map sideways to see the full region →</span>}
    <p>{local?period.localNote:'Arrows connect participants or destinations; their curves are not reconstructed routes.'}{local&&period.id==='exile'&&' *Mizpah is conventionally identified with Tell en-Nasbeh.'}</p>
  </figure>;
}

export default function EmpireMaps({period,showMovement}:{period:Period;showMovement:boolean}) {
 return <div className="ie-maps"><MapPanel period={period} showMovement={showMovement}/><MapPanel period={period} local showMovement={showMovement}/></div>;
}
