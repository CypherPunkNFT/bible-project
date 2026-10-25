(() => {
// The answer pictures mock-up: twelve example drawings, the standard every children's answer picture follows
// (owner, 2026-10-25: like the Resources card drawings, "but bigger and better"). Drawings: scenes.js, parts: kit.js.
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const card=(e,i)=>`<article class="card" id="example-${i+1}"><div class="number"><span>${String(i+1).padStart(2,'0')} / 12</span><span>${esc(e.kind)}</span></div>
<div class="drawing"><svg class="ap-art" viewBox="0 0 280 210" role="img" aria-label="${esc(e.idea)}">${e.art()}</svg></div>
<p class="question">${esc(e.q)}</p><h2>${esc(e.a)}</h2>
<blockquote class="verse">&ldquo;${esc(e.verse)}&rdquo;</blockquote><span class="ref">${e.ref} · BSB</span>
<div class="idea"><span class="label">The picture idea</span><p>${esc(e.idea)}</p><p><code>${e.name}</code> · shows: <code>${e.shows}</code></p></div></article>`;
const main=Frame.mount();
main.innerHTML=`<a class="back" href="/mockups/">← All mockups</a><header class="intro"><div><p class="eyebrow">Children's questions / answer pictures</p><h1>The right answer,<br><em>drawn.</em></h1></div><p>Twelve examples of the standard every answer picture follows: a full scene like the Resources drawings, larger, with slow movement that keeps going. Each one is a real children's question and shows a different kind of answer the drawing sessions will meet.</p></header><div class="cards">${window.AP_EXAMPLES.map(card).join('')}</div>`;
if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
})();
