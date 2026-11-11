// Native SVG geometry for the printed-page inspector; text is rendered as React text nodes.
import type { CSSProperties, ReactNode } from 'react';
import { TONES, type AnatomyEdition, type AnatomyLayer } from './page-anatomy';
function wordLine(x: number, y: number, width: number, seed: number) {
  let d = '', at = 0, s = seed;
  while (at < width - 4) {
    s = (s * 9301 + 49297) % 233280;
    const word = Math.min(4 + (s / 233280) * 18, width - at);
    d += `M${(x + at).toFixed(1)} ${y}h${word.toFixed(1)}`;
    at += word + 3.2;
  }
  return d;
}

function Block({ block }: { block: NonNullable<AnatomyLayer['blocks']>[number] }) {
  const [x, y, w, n, gap, heavy] = block;
  const h = (n - 1) * gap, pad = w < 20 ? 3 : 6;
  const lines = Array.from({length:n}, (_,i)=>wordLine(x, +(y+i*gap).toFixed(1), i%5===4?w*.72:w, Math.round(x*7+y*3+i*31))).join('');
  return <><rect className="pa-region" x={x-pad} y={y-pad-2} width={w+pad*2} height={h+pad*2+4} rx="4"/>
    <path className={'pa-words'+(heavy?' pa-heavy':'')} d={lines}/></>;
}
export function AnatomyLayerArt({ layer, index, off = false }: { layer: AnatomyLayer; index: number; off?: boolean }) {
  return <g className="pa-layer" data-layer={index} data-off={off||undefined} style={{'--tone':TONES[index]} as CSSProperties}>
    {(layer.blocks??[]).map((block,i)=><Block key={i} block={block}/>)}
    {(layer.rules??[]).map((d,i)=><path key={i} className={'pa-rule'+(layer.dashedRules?' pa-dashed':'')} d={d}/>)}
    {(layer.glyphs??[]).map(([c,x,y,size],i)=><text key={i} className="pa-glyph" x={x} y={y} fontSize={size}>{c}</text>)}
    {(layer.labels??[]).map(([text,x,y],i)=><text key={i} className="pa-label" x={x} y={y}>{text}</text>)}
  </g>;
}
export function AnatomySheet({ children, back = true }: { children?: ReactNode; back?: boolean }) {
  return <svg className="pa-sheet" viewBox="0 0 360 450" aria-hidden="true">
    {back&&<path className="pa-back" d="M33 25l318 -8v420l-318 8z"/>}
    <rect className="pa-leaf" x="23" y="13" width="314" height="420" rx="3"/>
    <path className="pa-guide" d="M15 35H345M15 410H345M43 5V441M317 5V441"/>
    <path className="pa-cross" d="M8 13h10M13 8v10M342 428h10M347 423v10"/>{children}
  </svg>;
}
export function AnatomyFlatPage({ edition, visible = [true,true,true] }: { edition: AnatomyEdition; visible?: boolean[] }) {
  return <AnatomySheet>{edition.layers.map((layer,i)=><AnatomyLayerArt key={i} layer={layer} index={i} off={!visible[i]}/>)}</AnatomySheet>;
}
