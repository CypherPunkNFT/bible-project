/* Shared local owner-review client. No approval is inferred from a saved AI judgment. */
let sourceReviewMarks=[];
const REVIEW_LABELS={pending:'In owner review',approved:'Approved for integration',integrated:'Integration recorded',needs_work:'Needs work',rejected:'Passed over',stale:'Changed — review again',discovered:'Discovery draft'};
async function reviewApi(action,body={}){
 const get=action==='get';const url='/data_analysis/api/review'+(get?'?'+new URLSearchParams(body):'');
 const r=await fetch(url,get?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,requestId:crypto.randomUUID(),...body})});
 const data=await r.json();if(!r.ok||data.error){const e=Error(data.error||'Review action failed.');e.status=r.status;throw e;}return data;
}
async function loadSourceReview(){try{sourceReviewMarks=(await reviewApi('get',{view:'marks'})).marks??[];}catch{sourceReviewMarks=[];}}
const REVIEW_RUNS={kr110:'kr110-54f0bfca9b30da6cc49b2347',kr120:'kr120-66a741ba22a7025744d3b98d',kr140:'kr140-3092a59f7c3f691bb7cdf4f9'};
function mappedCandidates(track,kind,key,run=REVIEW_RUNS[track]){return sourceReviewMarks.filter(m=>m.track===track&&m.run===run&&m.kind===kind&&m.key===String(key));}
function sourceReviewPanel(track,kind,key,run=REVIEW_RUNS[track]){
 const box=node('div',null,'source-review-panel'),marks=mappedCandidates(track,kind,key,run);box.append(node('p','OWNER CURATION · SELECTED EVIDENCE','eyebrow'));
 Object.assign(box.dataset,{track,kind,key:String(key),run});
 for(const m of marks){const row=node('div',null,'source-review-link');row.append(pill(REVIEW_LABELS[m.status]||m.status,m.status==='approved'||m.status==='integrated'?'good':m.status==='stale'?'bad':'warn'),safeLink('/data_analysis/candidates/?candidate='+encodeURIComponent(m.candidateId),m.title));box.append(row);}
 if(!marks.length)box.append(node('p','No candidate is mapped to this exact source record yet.','quiet'));
 const b=node('button',marks.length?'Open mapped candidate':'Add to discovery');b.type='button';
 b.onclick=async()=>{if(marks.length){location.href='/data_analysis/candidates/?candidate='+encodeURIComponent(marks[0].candidateId);return;}b.disabled=true;b.textContent='Mapping source…';try{const d=await reviewApi('nominate',{track,kind,key:String(key)});publishReviewChange();location.href='/data_analysis/candidates/?candidate='+encodeURIComponent(d.id);}catch(e){box.append(node('p',e.message,'error-panel'));b.disabled=false;b.textContent='Add to discovery';}};
 box.append(b,node('p','A mark concerns this selection and proposal. It does not approve the whole work or change the saved analytical judgment.','quiet'));return box;
}
function publishReviewChange(){try{localStorage.setItem('library-curation-change',String(Date.now()));}catch{}}
window.addEventListener('storage',async event=>{
 if(event.key!=='library-curation-change')return;
 if(document.body.dataset.page==='candidates'){
  const message=document.getElementById('review-message');if(message){message.textContent='Review changed in another tab. Refresh before making another decision. ';const b=document.createElement('button');b.textContent='Refresh review';b.onclick=async()=>{await refreshQueue();filterCandidates();message.textContent='Review refreshed.';};message.append(b);}return;
 }
 await loadSourceReview();for(const panel of document.querySelectorAll('.source-review-panel')){const d=panel.dataset;panel.replaceWith(sourceReviewPanel(d.track,d.kind,d.key,d.run));}
 for(const row of document.querySelectorAll('.population-grid [data-population-id]')){const d=row.closest('.population-grid').dataset;row.querySelector('.row-curation')?.remove();const marks=mappedCandidates(d.track,d.kind,row.dataset.populationId,d.run);if(marks.length)row.append(node('span',marks.map(m=>REVIEW_LABELS[m.status]).join(' · '),'row-curation'));}
 if(document.querySelector('#record-list')?.children.length&&typeof window.renderList==='function')window.renderList();
});
