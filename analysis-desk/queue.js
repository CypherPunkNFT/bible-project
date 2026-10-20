/* Owner decisions and bounded source discovery. Historical AI judgments are never approvals. */
let queueState,queueView='pending',queuePage=0,queueBusy=false,baseShortlist;
const QUEUE_VIEWS=[['pending','To review'],['approved','Approved'],['integrated','Integrated'],['discovered','Discoveries'],['work','Needs work'],['rejected','Passed'],['all','All']];
function queueMessage(text,bad=false){const e=$('review-message');e.className=bad?'review-message error-panel':'review-message';e.textContent=text;}
async function refreshQueue(sync=true){
 queueState=await reviewApi('get');if(sync&&(queueState.needsSync||queueState.needsExport)){await reviewApi('sync');queueState=await reviewApi('get');}
 shortlist={...baseShortlist,candidates:queueState.items.map(i=>({...i.data,_review:i}))};
 $('shortlist-scope').textContent=`${queueState.counts.pending} awaiting your review · ${queueState.counts.approved} approved for integration · ${queueState.counts.integrated} integrations recorded · ${queueState.counts.discovered} discovery drafts`;
 renderQueueTabs();
 const existing=$('candidate-family').value;$('candidate-family').replaceChildren(node('option','All uses'));$('candidate-family').firstChild.value='';
 for(const f of [...new Set(shortlist.candidates.map(c=>c.family))]){const o=node('option',f);o.value=f;$('candidate-family').append(o);}$('candidate-family').value=existing;
}
function renderQueueTabs(){const host=$('review-tabs');host.replaceChildren();for(const [key,title]of QUEUE_VIEWS){const count=key==='all'?queueState.items.length:key==='work'?queueState.counts.needs_work+queueState.counts.stale:queueState.counts[key];const b=node('button',title+' · '+count);b.dataset.view=key;b.setAttribute('aria-pressed',String(queueView===key));b.onclick=()=>{queueView=key;queuePage=0;renderQueueTabs();filterCandidates();};host.append(b);}}
function matchesView(c){return queueView==='all'||(queueView==='work'?['needs_work','stale'].includes(c._review.status):c._review.status===queueView);}
function filterCandidates(){
 const q=$('candidate-search').value.trim().toLocaleLowerCase(),family=$('candidate-family').value,priority=$('candidate-priority').value;
 visibleCandidates=shortlist.candidates.filter(c=>matchesView(c)&&(!family||c.family===family)&&(!priority||c.priority===priority)&&(!q||[c.title,c.finding,c.benefit,c.placement,c.family,...c.sources.map(p=>p.author+' '+p.title)].join(' ').toLocaleLowerCase().includes(q))).sort((a,b)=>(a.priority==='Start here'?0:1)-(b.priority==='Start here'?0:1)||a._review.ordinal-b._review.ordinal);
 const size=queueState.pendingBatchSize??6,pages=Math.max(1,Math.ceil(visibleCandidates.length/size));queuePage=Math.min(queuePage,pages-1);const batch=visibleCandidates.slice(queuePage*size,(queuePage+1)*size);
 $('candidate-count').textContent=`${batch.length} in this batch / ${visibleCandidates.length} matching · page ${queuePage+1} of ${pages}`;
 $('queue-prev').disabled=queuePage===0;$('queue-next').disabled=queuePage+1>=pages;
 $('candidate-list').replaceChildren();for(const c of batch){const b=node('button',null,'candidate-row'+(c.id===chosen?' active':''));b.dataset.id=c.id;b.setAttribute('aria-pressed',String(c.id===chosen));b.append(node('span',c.family,'candidate-row-family'),node('strong',c.title),pill(REVIEW_LABELS[c._review.status],c._review.status==='approved'||c._review.status==='integrated'?'good':c._review.status==='stale'?'bad':'warn'));b.onclick=()=>selectCandidate(c.id,true);$('candidate-list').append(b);}
 if(!batch.length){$('candidate-list').append(node('p',queueView==='pending'?'No prepared candidates match. Choose another view or prepare new source discoveries.':'No matching items in this view.','empty-state'));$('candidate-detail').replaceChildren(node('p','No candidate selected.','empty-state'));chosen='';}
 else if(!batch.some(c=>c.id===chosen))selectCandidate(batch[0].id);
}
function focusCandidate(id){
 const c=shortlist.candidates.find(c=>c.id===id);if(!c){queueMessage('This candidate is not in the current catalogue.',true);return;}
 queueView=['needs_work','stale'].includes(c._review.status)?'work':c._review.status;queuePage=0;$('candidate-search').value='';$('candidate-family').value='';$('candidate-priority').value='';
 renderQueueTabs();filterCandidates();const at=visibleCandidates.findIndex(x=>x.id===id);queuePage=Math.floor(at/(queueState.pendingBatchSize??6));filterCandidates();selectCandidate(id,true);
}
async function saveOwnerAction(c,status){
 if(queueBusy)return;queueBusy=true;setReviewBusy(true);const note=$('owner-note')?.value??c._review.note;const destination=$('owner-destination')?.value??c._review.destination;
 try{const r=await reviewApi('decide',{id:c.id,expectedRevision:c._review.revision,fingerprint:c._review.fingerprint,status,note,destination,integrationEvidence:$('integration-evidence')?.value??''});publishReviewChange();await refreshQueue();queueMessage(status==='approved'?'Approved. Its sources are marked, an integration work order is saved, and the next prepared candidate fills this batch.':r.message??'Decision saved.');chosen='';filterCandidates();
  const returnLink=node('button','Open the item just reviewed');returnLink.onclick=()=>focusCandidate(c.id);$('review-message').append(document.createTextNode(' '),returnLink);
 }catch(e){queueMessage(e.message,true);if(e.status===409){await refreshQueue();filterCandidates();}}
 finally{queueBusy=false;setReviewBusy(false);}
}
function setReviewBusy(busy){for(const b of document.querySelectorAll('.owner-review-controls button,.proposal-editor button,.discovery-tool button'))b.disabled=busy;}
function reviewControls(c){
 const r=c._review,box=node('section',null,'owner-review-controls');box.append(node('p','YOUR DECISION','eyebrow'),pill(REVIEW_LABELS[r.status],['approved','integrated'].includes(r.status)?'good':r.status==='stale'?'bad':'warn'));
 if(r.status==='stale')box.append(node('p','The proposal or evidence changed. Prior approvals remain in history and do not cover this revision.','review-stale'));
 const notes=node('label','Your note (optional)'),n=node('textarea');n.id='owner-note';n.rows=2;n.value=r.note??'';notes.append(n);
 const destination=node('label','Intended website placement'),d=node('input');d.id='owner-destination';d.value=r.destination||c.placement||'';destination.append(d);box.append(notes,destination);
 const actions=node('div',null,'review-actions');
 function button(text,status){const b=node('button',text);b.dataset.decision=status;b.onclick=()=>saveOwnerAction(c,status);actions.append(b);}
 if(r.status!=='discovered'&&r.status!=='approved'&&r.status!=='integrated')button('Approve for integration','approved');
 if(!['needs_work','integrated'].includes(r.status))button('Needs work','needs_work');if(r.status!=='rejected'&&r.status!=='integrated')button('Pass','rejected');
 if(r.status!=='pending'&&r.status!=='discovered')button('Return to review','pending');
 if(r.status==='approved'){
  const detailsBox=node('details',null,'record-integration'),content=node('div');detailsBox.append(node('summary','Record a completed integration'),content);
  content.append(node('p','This records work that has actually been completed. Supply its site path above and changed files or a verification receipt below. It does not publish the site.','quiet'));
  const label=node('label','Integration evidence'),e=node('textarea');e.id='integration-evidence';e.rows=3;e.placeholder='Changed files, local route check or verification receipt';label.append(e);const b=node('button','Mark integration recorded');b.dataset.decision='integrated';b.onclick=()=>saveOwnerAction(c,'integrated');content.append(label,b);box.append(detailsBox);
 }
 if(r.status==='integrated')box.append(node('p','Integration evidence: '+r.integration_evidence,'quiet'));
 box.append(actions,node('p',r.status==='discovered'?'Prepare this source draft below before it can enter your approval queue.':'Approval selects this exact proposal for integration. Remaining source/content checks still travel with its work order.','quiet'));
 return box;
}
function proposalEditor(c){
 const d=node('details',null,'proposal-editor');d.open=c._review.status==='discovered';d.append(node('summary',c._review.status==='discovered'?'Prepare this discovery for review':'Edit the proposal · a change returns it to review'));
 const form=node('form'),fields={};for(const [key,title,rows]of [['title','Title',1],['finding','What should the visitor learn? Use the source evidence.',4],['benefit','Why is this useful to a visitor?',3],['placement','Where should it go on the website?',2],['limits','Limits and unresolved source checks',3],['next','Remaining integration work',2]]){const l=node('label',title),i=node('textarea');i.rows=rows;i.value=c[key]??'';i.required=['title','finding','benefit','placement'].includes(key);fields[key]=i;l.append(i);form.append(l);}
 const submit=node('button','Save proposal for owner review');submit.type='submit';form.append(submit);d.append(form);
 form.onsubmit=async e=>{e.preventDefault();if(queueBusy)return;queueBusy=true;setReviewBusy(true);try{await reviewApi('prepare',{id:c.id,expectedRevision:c._review.revision,fingerprint:c._review.fingerprint,proposal:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value])),note:$('owner-note')?.value??''});publishReviewChange();await refreshQueue();queueMessage('Proposal prepared. It is awaiting owner review; no approval was inferred.');focusCandidate(c.id);}catch(e){queueMessage(e.message,true);}finally{queueBusy=false;setReviewBusy(false);}};return d;
}
function reviewHistory(c){const d=node('details',null,'review-history');d.append(node('summary','Decision history and source revision'));const body=node('div');d.append(body);d.addEventListener('toggle',async()=>{if(!d.open||body.childElementCount)return;try{const data=await reviewApi('get',{view:'history',id:c.id});for(const e of data.events){const row=node('p',`${e.at} · ${e.actor} · ${e.action}: ${e.from_status||'new'} → ${e.to_status} · revision ${e.revision}`);body.append(row);if(e.note)body.append(node('p',e.note,'quiet'));}body.append(node('p','Proposal fingerprint: '+c._review.fingerprint,'quiet'));}catch(e){body.append(node('p',e.message,'error-panel'));}});return d;}
function setupDiscovery(){
 const form=$('discovery-form');form.onsubmit=async e=>{e.preventDefault();if(queueBusy)return;queueBusy=true;setReviewBusy(true);queueMessage('Searching a bounded portion of the selected source index…');try{const data=Object.fromEntries(new FormData(form));const r=await reviewApi('discover',data);publishReviewChange();await refreshQueue();queueView='discovered';queuePage=0;renderQueueTabs();chosen='';filterCandidates();queueMessage(`${r.changed} new source drafts added; ${r.visited??0} matches examined. ${r.exhausted?'This search is exhausted.':'The next request continues from its saved cursor.'} Drafts need preparation before owner review.`);}catch(e){queueMessage(e.message,true);}finally{queueBusy=false;setReviewBusy(false);}};
}
(async()=>{try{
 baseShortlist=await api('website-candidates.json');await refreshQueue();
 $('candidate-search').oninput=()=>{queuePage=0;filterCandidates();};$('candidate-family').onchange=()=>{queuePage=0;filterCandidates();};$('candidate-priority').onchange=()=>{queuePage=0;filterCandidates();};$('candidate-reset').onclick=()=>{$('candidate-search').value='';$('candidate-family').value='';$('candidate-priority').value='';queuePage=0;filterCandidates();};
 $('queue-prev').onclick=()=>{queuePage--;filterCandidates();};$('queue-next').onclick=()=>{queuePage++;filterCandidates();};
 $('export-shortlist').onclick=()=>download({catalogue:baseShortlist,curation:queueState},'website-curation-state.json');$('open-first').onclick=()=>focusCandidate('ephesians-guide');for(const b of document.querySelectorAll('[data-start]'))b.onclick=()=>focusCandidate(b.dataset.start);
 $('held-summary').textContent=`${baseShortlist.audit.heldCases} research leads held outside the prepared queue`;
 for(const r of baseShortlist.held){const d=node('details'),s=node('summary',r.title);d.append(s,node('p',r.reason),safeLink(r.href,'Inspect the saved evidence →'));$('held-list').append(d);}
 $('candidate-method').append(node('p',baseShortlist.scope),node('p',baseShortlist.reviewer),node('p','Your decisions are a separate durable curation layer. They bind to the exact proposal and evidence fingerprint. Changed proposals return to review; original analytical evaluations retain their historical meaning.'),safeLink('/data_analysis/api/source-review.md','Read source-review annotations →'),node('p',' '),safeLink('/data_analysis/api/integration-queue.json','Export approved integration work orders →'));
 setupDiscovery();const initial=new URLSearchParams(location.search).get('candidate');filterCandidates();if(initial&&shortlist.candidates.some(c=>c.id===initial))focusCandidate(initial);
}catch(e){queueMessage(e.message,true);$('candidate-detail').replaceChildren(node('p','The durable review queue is unavailable. Refresh before deciding.','error-panel'));}})();
