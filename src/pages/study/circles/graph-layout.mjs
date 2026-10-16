export function layoutWorks({all,items,dated,year,featured,selected,expanded}){
 const ranks=new Map(all.map((w,i)=>[w.id,i+1]));
 const years=all.map(year).filter(y=>y!==null),start=Math.min(...years),span=Math.max(...years)-start;
 const level=w=>dated?(year(w)===null?3:span?Math.min(2,Math.floor((year(w)-start)/(span+1)*3)):0):(ranks.get(w.id)<=8?0:ranks.get(w.id)<=24?1:2);
 let shown=items;
 if(!expanded){
  if(dated){
   const pool=items.filter(w=>year(w)!==null);
   const sample=(ws,n)=>{if(ws.length<=n)return ws;const chosen=new Set([...ws.filter(w=>!w.catalogueEntry),...ws.filter(w=>featured.has(w.id))]);chosen.add(ws[0]);chosen.add(ws.at(-1));for(let i=0;chosen.size<n&&i<ws.length;i++)chosen.add(ws[Math.round(i*(ws.length-1)/(n-1))]||ws[i]);return [...chosen].slice(0,n).sort((a,b)=>ranks.get(a.id)-ranks.get(b.id));};
   shown=[0,1,2].flatMap(l=>sample(pool.filter(w=>level(w)===l),[8,16,24][l]));
   if(shown.length<Math.min(48,pool.length))shown.push(...pool.filter(w=>!shown.includes(w)).slice(0,48-shown.length));
  }else shown=items.slice(0,48);
  const active=items.find(w=>w.id===selected);
  if(active&&(!dated||year(active)!==null)&&!shown.includes(active)){
   if(shown.length===48){const index=shown.findLastIndex(w=>level(w)===level(active));shown.splice(index>=0?index:shown.length-1,1);}shown.push(active);
  }
 }
 const levels=dated?['First works','Later works','Final works','Undated / later editions']:['Level I','Level II','Level III'];
 const groups=[0,1,2,3].map(l=>shown.filter(w=>level(w)===l)),nodes=[],rings=[];
 const label=(l,ws)=>{const ys=ws.map(year).filter(y=>y!==null),first=Math.min(...ys),last=Math.max(...ys);return levels[l]+(dated&&ys.length?' · '+first+(last!==first?'–'+last:''):'');};
 if(expanded){
  let radius=240;
  groups.forEach((ws,l)=>{let offset=0;while(offset<ws.length){
   const batch=ws.slice(offset,offset+Math.max(8,Math.floor(2*Math.PI*radius/180))),ringIndex=rings.length;
   rings.push({radius,label:label(l,batch),level:l});
   batch.forEach((work,i)=>{const a=-Math.PI/2+(i+.5)*2*Math.PI/batch.length;nodes.push({work,level:l,ringIndex,x:500+Math.cos(a)*radius,y:500+Math.sin(a)*radius,rank:ranks.get(work.id)});});
   offset+=batch.length;radius+=240;
  }});
 }else{
  groups.forEach((ws,l)=>{const radius=[170,290,410][l];if(!ws.length)return;rings.push({radius,label:label(l,ws),level:l});ws.forEach((work,i)=>{const a=-Math.PI/2+(i+.5)*2*Math.PI/ws.length;nodes.push({work,level:l,x:500+Math.cos(a)*radius,y:500+Math.sin(a)*radius,rank:ranks.get(work.id)});});});
 }
 return {nodes,rings,shown,levels:levels.slice(0,groups[3].length?4:3)};
}

export function previewMarkup(layout,{label,centre,dated,year,escape,wrap,selected}){
 const core=wrap(centre,16,3),start=495-(core.length-1)*13,tones=['--accent','--level2','--level3'];
 return `<svg viewBox="0 55 1000 920" data-render-mode="preview" data-dot-count="${layout.nodes.length}" role="group" aria-label="${escape(label)}: ${layout.nodes.length} prominent works">${layout.rings.map(r=>`<circle class="orbit" cx="500" cy="500" r="${r.radius}"/>`).join('')}<circle cx="500" cy="500" r="84" fill="var(--bg)" stroke="var(--line)"/><circle cx="500" cy="500" r="74" fill="none" stroke="var(--accent)" stroke-opacity=".4"/><text class="core-title" text-anchor="middle">${core.map((line,i)=>`<tspan x="500" y="${start+i*26}">${escape(line)}</tspan>`).join('')}</text><text class="core-sub" x="500" y="${start+core.length*26+4}" text-anchor="middle">${dated?'THROUGH TIME':layout.nodes.length+' WORKS'}</text>${layout.nodes.map(n=>`<g class="work-node" tabindex="0" role="button" aria-label="${escape(n.work.title)} by ${escape(n.work.author)}" aria-pressed="${selected===n.work.id}" data-work="${n.work.id}" style="--tone:var(${tones[n.level]})" opacity="${selected&&selected!==n.work.id?'.52':'1'}"><title>${escape(n.work.title)} · ${escape(n.work.author)}</title><circle cx="${n.x}" cy="${n.y}" r="25" fill="transparent"/><circle class="node-halo" cx="${n.x}" cy="${n.y}" r="14"/><text class="node-rank" x="${n.x}" y="${n.y+3.5}" text-anchor="middle">${dated?(year(n.work)??'—'):String(n.rank).padStart(2,'0')}</text><text class="node-label" text-anchor="middle">${wrap(n.work.title,[21,17,15][n.level]).map((line,i)=>`<tspan x="${n.x}" y="${n.y+32+i*15}">${escape(line)}</tspan>`).join('')}</text></g>`).join('')}</svg>`;
}
