const drawings = {
  'craig-hitchens': { title: 'Cosmos & balance', note: 'Weighing the case for God and the objections to belief.', lines: '<circle cx="60" cy="35" r="24" stroke-dasharray="2 6"/><circle cx="60" cy="35" r="14"/><path d="M60 16v6m0 26v6M41 35h6m26 0h6M60 56v46M46 104h28M26 70h68M32 70 18 92h28Zm56 0L74 92h28ZM18 92q14 16 28 0m28 0q14 16 28 0"/>' },
  'craig-ally-resurrection': { title: 'Tomb & testimony', note: 'The empty tomb and competing readings of the historical record.', lines: '<path d="M15 88V58a35 35 0 0 1 70 0v30M28 88V58a22 22 0 0 1 44 0v30M10 89h83M50 15V6m-17 13-5-8m39 8 5-8"/><circle cx="88" cy="75" r="21"/><path d="M76 66q12-9 22 3M78 79q8 10 18 0M30 98h36v16H30Zm8 6h20m-20 5h12"/>' },
  'craig-ally-god': { title: 'Three & one', note: 'Interlocking circles beside a single circle: Trinity and divine oneness.', lines: '<circle cx="44" cy="40" r="22"/><circle cx="30" cy="64" r="22"/><circle cx="58" cy="64" r="22"/><path d="M74 27v65" stroke-dasharray="2 5"/><circle cx="98" cy="56" r="15"/><path d="M18 103h42m26 0h24M38 96v14m62-14v14"/>' },
  'lennox-dawkins': { title: 'Atom & open book', note: 'Scientific explanation in conversation with Christian belief.', lines: '<ellipse cx="60" cy="43" rx="39" ry="14"/><ellipse cx="60" cy="43" rx="39" ry="14" transform="rotate(60 60 43)"/><ellipse cx="60" cy="43" rx="39" ry="14" transform="rotate(120 60 43)"/><circle cx="60" cy="43" r="4"/><path d="M17 84q22-9 43 2 21-11 43-2v27q-22-9-43 2-21-11-43-2Zm43 2v27M25 94q12-4 25 1m20 0q12-5 25-1"/>' },
  'bahnsen-stein': { title: 'The foundations of reason', note: 'Logic and the assumptions on which an argument rests.', lines: '<path d="m60 13 42 23H18ZM25 43h16v45H25Zm54 0h16v45H79ZM19 94h82M12 104h96"/><circle cx="53" cy="65" r="11"/><circle cx="67" cy="65" r="11"/><path d="M60 30v-8m-4 4h8M8 113h104"/>' },
  'craig-ehrman': { title: 'History under examination', note: 'A manuscript and magnifying glass for historical evidence and method.', lines: '<path d="M22 17h65v88H22ZM32 32h43M32 43h43M32 54h21M32 85h20M32 95h31"/><circle cx="78" cy="71" r="24"/><path d="m95 89 18 21M64 80V68a14 14 0 0 1 28 0v12M60 81h35M72 79V69a6 6 0 0 1 12 0v10"/>' },
  'craig-krauss': { title: 'An expanding cosmos', note: 'Origins, cosmology and the reach of an explanation.', lines: '<circle cx="60" cy="60" r="9"/><circle cx="60" cy="60" r="26" stroke-dasharray="3 6"/><circle cx="60" cy="60" r="44"/><path d="M60 5v29m0 52v29M5 60h29m52 0h29M21 21l20 20m38 38 20 20M21 99l20-20m38-38 20-20M55 11l5-6 5 6m44 44 6 5-6 5M55 109l5 6 5-6M11 55l-6 5 6 5"/>' },
  'craig-grayling': { title: 'Waves & a distant light', note: 'Natural suffering and the question of divine goodness.', lines: '<circle cx="60" cy="36" r="16"/><path d="M60 7v7M31 17l6 6m46 0 6-6M25 36h8m54 0h8M13 72q12-23 25 0t25 0 25 0 25 0M13 87q12-23 25 0t25 0 25 0 25 0M13 102q12-23 25 0t25 0 25 0 25 0"/>' },
  'lennox-shermer': { title: 'Thorns & a living branch', note: 'Evil, suffering and the search for a moral explanation.', lines: '<path d="M60 109V53q-25-7-29-31 28-3 29 31 1-34 29-31-4 24-29 31ZM30 90q-23-14-9-38m69 38q23-14 9-38M22 77l-12 4m14-17-12-5m24 35-4 14m66-31 12 4m-14-17 12-5M84 94l4 14M44 80l16 9 16-9"/>' },
};
const variants = [
  { id: 'a', name: 'Illustrated rail', detail: 'An evolution of the current list: a meaningful drawing at left, followed by a clear title, explanation and speaker pairing.' },
  { id: 'b', name: 'Facing panels', detail: 'The subject introduces the exchange; two balanced speaker panels make the opposition immediately legible.' },
  { id: 'c', name: 'Debate poster', detail: 'A centered composition with a subject emblem above and the speakers facing across a gold VS.' },
  { id: 'd', name: 'Split programme', detail: 'A reading-first layout with the title and explanation at left and a dedicated matchup column at right.' },
  { id: 'e', name: 'Illustrated window', detail: 'A larger drawing gives each debate its own visual identity, with an understated programme beside it.' },
  { id: 'f', name: 'Compact exchange', detail: 'A denser library row: a small subject mark, immediate explanation and a crisp matchup on a single line.' },
];
const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const icon = id => `<svg class="subject-icon" viewBox="0 0 120 120" fill="none" aria-hidden="true">${drawings[id].lines}</svg>`;
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 19 19 5M6 5h13v13"/></svg>';
const initials = name => { const parts = name.split(' '); return parts[0][0] + parts.at(-1)[0]; };
function card(debate, version) {
  const names = debate.speakers.split(' · ');
  return `<a class="debate-card version-${version}" href="/apologetics/debates/${debate.id}"><div class="art"><span class="ordinal">${String(debate.order + 1).padStart(2, '0')}</span>${icon(debate.id)}<span class="art-caption">${esc(drawings[debate.id].title)}</span></div><div class="copy"><p class="eyebrow">${esc(debate.lens)}</p><h3>${esc(debate.title)}</h3><p class="description">${esc(debate.description)}</p></div><div class="matchup"><span class="speaker speaker-one"><span class="initials" aria-hidden="true">${initials(names[0])}</span><span class="speaker-name">${esc(names[0])}</span></span><span class="versus" aria-label="versus">VS</span><span class="speaker speaker-two"><span class="initials" aria-hidden="true">${initials(names[1])}</span><span class="speaker-name">${esc(names[1])}</span></span></div><div class="metadata"><span>${esc(debate.setting)}</span><div class="resources"><span>Transcript</span><span>YouTube · ${esc(debate.recording.duration)}</span><span>Study guide</span></div></div><span class="open">${arrow}<span>Open debate</span></span></a>`;
}
const params = new URLSearchParams(location.search);
let selected = variants.some(v => v.id === params.get('v')) ? params.get('v') : 'all';
let sample = ['pair', 'all', ...DEBATE_SAMPLES.map(d => d.id)].includes(params.get('sample')) ? params.get('sample') : 'pair';
let theme = params.get('theme') === 'light' ? 'light' : 'dark';
const designs = document.querySelector('#designs');
const sampleSelect = document.querySelector('#sample');
sampleSelect.insertAdjacentHTML('beforeend', DEBATE_SAMPLES.map(d => `<option value="${d.id}">${esc(d.title)}</option>`).join(''));
function render() {
  document.documentElement.dataset.theme = theme;
  document.querySelector('#theme').textContent = theme === 'dark' ? 'Light theme' : 'Dark theme';
  document.querySelector('#versions').innerHTML = [{ id: 'all', name: 'Compare all' }, ...variants].map(v => `<button type="button" data-version="${v.id}" aria-pressed="${selected === v.id}">${v.id === 'all' ? '' : v.id.toUpperCase() + ' · '}${v.name}</button>`).join('');
  sampleSelect.value = sample;
  const examples = sample === 'all' ? DEBATE_SAMPLES : sample === 'pair' ? DEBATE_SAMPLES.slice(0, 2) : DEBATE_SAMPLES.filter(d => d.id === sample);
  designs.innerHTML = variants.filter(v => selected === 'all' || selected === v.id).map(v => `<section class="direction" id="version-${v.id}" aria-labelledby="heading-${v.id}"><header class="direction-header"><span class="letter">${v.id.toUpperCase()}</span><div><p class="eyebrow">Card direction ${v.id.toUpperCase()}</p><h2 id="heading-${v.id}">${v.name}</h2><p>${v.detail}</p></div><a class="isolate" href="?v=${v.id}&sample=all&theme=${theme}">View all nine in ${v.id.toUpperCase()} ↗</a></header><div class="examples">${examples.map(d => card(d, v.id)).join('')}</div></section>`).join('');
  document.querySelector('#icon-library').innerHTML = DEBATE_SAMPLES.map(d => `<a class="icon-choice" href="?v=${selected}&sample=${d.id}&theme=${theme}">${icon(d.id)}<span class="eyebrow">${drawings[d.id].title}</span><h3>${esc(d.title)}</h3><p>${drawings[d.id].note}</p><span class="icon-cta">Preview this debate ↗</span></a>`).join('');
  const url = new URL(location); url.searchParams.set('v', selected); url.searchParams.set('sample', sample); url.searchParams.set('theme', theme); history.replaceState(null, '', url);
}
document.querySelector('#versions').addEventListener('click', event => { const button = event.target.closest('[data-version]'); if (button) { selected = button.dataset.version; render(); document.querySelector(`[data-version="${selected}"]`).focus(); } });
sampleSelect.addEventListener('change', () => { sample = sampleSelect.value; render(); });
document.querySelector('#theme').addEventListener('click', () => { theme = theme === 'dark' ? 'light' : 'dark'; render(); });
render();
