const NS='http://www.w3.org/2000/svg';
const tones=['--accent','--level2','--level3','--muted'];
const clamp=n=>Math.max(0,Math.min(1,n));
function element(tag,attrs={}){const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;}

// Static batched dots underneath a bounded, spatially indexed detail layer.
export class DenseWorkMap {
 constructor(nodes,{label,year,wrap,escape,positions,rings=[],centre=[],subtitle='',viewBox='0 0 1000 1000',dated=true}){
  nodes=nodes.map(n=>({...n,originalX:n.x,originalY:n.y,x:n.x+(positions.get(n.work.id)?.x||0),y:n.y+(positions.get(n.work.id)?.y||0)}));
  this.nodes=nodes;this.byId=new Map(nodes.map(n=>[n.work.id,n]));this.year=year;this.dated=dated;this.wrap=wrap;this.cells=new Map();this.parts=new Map();this.key='';
  const paths=tones.map(()=>[]);
  for(const node of nodes){
   const cell=`${Math.floor(node.x/480)},${Math.floor(node.y/480)}`;
   if(!this.cells.has(cell))this.cells.set(cell,[]);this.cells.get(cell).push(node);
   paths[node.level].push(`M${(node.x-20).toFixed(2)} ${node.y.toFixed(2)}a20 20 0 1 0 40 0a20 20 0 1 0 -40 0Z`);
  }
  const coreStart=495-(centre.length-1)*13;
  this.markup=`<svg viewBox="${viewBox}" data-render-mode="dots" data-dot-count="${nodes.length}" role="group" aria-label="${escape(label)}: ${nodes.length.toLocaleString()} works">${rings.map(({radius,label})=>`<circle class="orbit" cx="500" cy="500" r="${radius}"/>`).join('')}<circle cx="500" cy="500" r="84" fill="var(--bg)" stroke="var(--line)"/><circle cx="500" cy="500" r="74" fill="none" stroke="var(--accent)" stroke-opacity=".4"/><text class="core-title" text-anchor="middle">${centre.map((line,i)=>`<tspan x="500" y="${coreStart+i*26}">${escape(line)}</tspan>`).join('')}</text><text class="core-sub" x="500" y="${coreStart+centre.length*26+4}" text-anchor="middle">${escape(subtitle)}</text>${paths.map((path,i)=>path.length?`<path class="dense-dot-batch" fill="var(${tones[i]})" data-dot-count="${path.length}" d="${path.join('')}"/>`:'').join('')}</svg>`;
 }
 hit(x,y,tolerance=20){
  let nearest=null,best=tolerance;
  for(let cx=Math.floor((x-tolerance)/480);cx<=Math.floor((x+tolerance)/480);cx++)for(let cy=Math.floor((y-tolerance)/480);cy<=Math.floor((y+tolerance)/480);cy++)for(const node of this.cells.get(`${cx},${cy}`)||[]){
   const distance=Math.hypot(node.x-x,node.y-y);if(distance<=best){nearest=node;best=distance;}
  }
  return nearest;
 }
 move(id,offset){
  const node=this.byId.get(id);if(!node)return;
  const oldCell=`${Math.floor(node.x/480)},${Math.floor(node.y/480)}`,bucket=this.cells.get(oldCell);
  bucket.splice(bucket.indexOf(node),1);if(!bucket.length)this.cells.delete(oldCell);
  node.x=node.originalX+offset.x;node.y=node.originalY+offset.y;
  const cell=`${Math.floor(node.x/480)},${Math.floor(node.y/480)}`;
  if(!this.cells.has(cell))this.cells.set(cell,[]);this.cells.get(cell).push(node);this.key='';
 }
 render(svg,{scale,x,y,width,height,selected,hovered}){
  const reveal=clamp((scale-.28)/.12),names=clamp((scale-.65)/.2);
  if(!reveal){svg.style.setProperty('--dot-opacity',1);this.layer?.remove();this.layer=null;this.parts.clear();this.key='';return;}
  if(!this.layer){this.layer=element('g',{class:'dense-details'});svg.append(this.layer);}
  const radius=Math.min(32,30/scale),font=Math.min(18,28/scale),yearFont=radius*.65;
  this.layer.style.setProperty('--detail-opacity',reveal);
  this.layer.style.setProperty('--name-opacity',names);
  this.layer.style.setProperty('--badge-radius',radius+'px');
  this.layer.style.setProperty('--year-font',yearFont+'px');
  this.layer.style.setProperty('--title-font',font+'px');
  const left=(-x)/scale-260,right=(width-x)/scale+260,top=(-y)/scale-260,bottom=(height-y)/scale+260;
  const visible=[];
  for(let cx=Math.floor(left/480);cx<=Math.floor(right/480);cx++)for(let cy=Math.floor(top/480);cy<=Math.floor(bottom/480);cy++){
   for(const node of this.cells.get(`${cx},${cy}`)||[])if(node.x>=left&&node.x<=right&&node.y>=top&&node.y<=bottom)visible.push(node);
  }
  // Bound detail even on exceptionally large displays. The dots always stay complete.
  svg.style.setProperty('--dot-opacity',visible.length>320?1:1-reveal);
  if(visible.length>320)visible.sort((a,b)=>Math.hypot(a.x-(width/2-x)/scale,a.y-(height/2-y)/scale)-Math.hypot(b.x-(width/2-x)/scale,b.y-(height/2-y)/scale));
  visible.length=Math.min(visible.length,320);
  visible.sort((a,b)=>Number(b.work.id===selected||b.work.id===hovered)-Number(a.work.id===selected||a.work.id===hovered)||a.rank-b.rank);
  const tier=scale<.65?0:scale<1.2?1:2;
  const key=visible.map(n=>n.work.id).join('|')+`:${tier}:${Math.floor(scale*10)}:${selected}:${hovered}`;
  if(key===this.key)return;this.key=key;
  const ids=new Set(visible.map(n=>n.work.id));
  for(const [id,part] of this.parts)if(!ids.has(id)){part.group.remove();this.parts.delete(id);}
  const occupied=visible.map(n=>({x:n.x-radius-4,y:n.y-radius-4,w:radius*2+8,h:radius*2+8}));
  const overlaps=r=>occupied.some(o=>r.x<o.x+o.w&&r.x+r.w>o.x&&r.y<o.y+o.h&&r.y+r.h>o.y);
  let titles=0;
  for(const node of visible){
   const id=node.work.id,important=id===selected||id===hovered;
   let part=this.parts.get(id);
   if(!part){
    const group=element('g',{class:'dense-work',transform:`translate(${node.x} ${node.y})`,'data-work':id,tabindex:'0',role:'button','aria-label':node.work.title,style:`--tone:var(${tones[node.level]})`});
    const circle=element('circle',{class:'dense-badge',r:'32'}),date=element('text',{class:'dense-year','text-anchor':'middle','dominant-baseline':'central'}),title=element('text',{class:'dense-title','text-anchor':'middle'});
    date.textContent=this.dated?(this.year(node.work)??'—'):node.rank;group.append(circle,date,title);this.layer.append(group);part={group,title};this.parts.set(id,part);
   }
   part.group.setAttribute('aria-pressed',String(id===selected));
   part.group.setAttribute('transform',`translate(${node.x} ${node.y})`);
   part.group.classList.toggle('dense-important',important);
   part.title.replaceChildren();
   if((!tier&&!important)||titles>=96)continue;
   const lines=this.wrap(node.work.title,tier===2?30:21,tier===2?3:2),w=Math.max(...lines.map(l=>l.length))*font*.58,h=lines.length*font*1.25;
   const candidates=[{x:node.x-w/2,y:node.y+radius+12},{x:node.x-w/2,y:node.y-radius-12-h}];
   const rect=candidates.find(r=>!overlaps({...r,w,h}));
   if(!rect&&!important)continue;
   const pos=rect||candidates[0];occupied.push({...pos,w,h});titles++;
   lines.forEach((line,i)=>{const span=element('tspan',{x:0,y:pos.y-node.y+font+i*font*1.25});span.textContent=line;part.title.append(span);});
  }
 }
}
