const record = window.debateTranscript;
const text = record.text.replace(/\r\n?/g, '\n');
const labels = [...text.matchAll(/^(Larry Taunton|Bill Pryor|Richard Dawkins|John Lennox|Dr\. Lennox): /gm)];
const turns = labels.map((label, i) => ({
  number: i + 1, label: label[1],
  speaker: label[1].includes('Lennox') ? 'lennox' : label[1] === 'Richard Dawkins' ? 'dawkins' : label[1] === 'Bill Pryor' ? 'pryor' : 'taunton',
  paragraphs: text.slice(label.index + label[0].length, labels[i + 1]?.index ?? text.length).trim().split(/\n\s*\n/),
}));
const questions = window.debateSimulation.questions;
const questionsUnderneath = ['How is the exchange framed?', 'Where does Dawkins begin?', 'Where does Lennox begin?', 'Are they using “faith” in the same sense?', 'What connects the evidence to the worldview?', 'What would make an explanation sufficient?', 'Which belief, action and causal claim are being compared?', 'Is the question about conduct or justification?', 'Which historical claim needs examination?', 'What grounds Lennox’s conclusion?', 'What grounds Dawkins’s conclusion?', 'What would you examine next?'];
const chapters = record.sections.map((section, i) => ({
  id: `section-${section.turn}`, title: section.title, kind: i === 0 || i === 11 ? 'Event' : i < 3 ? 'Opening' : i < 9 ? `Thesis ${i - 2}` : 'Conclusion',
  question: questionsUnderneath[i],
  turns: turns.slice(section.turn - 1, record.sections[i + 1] ? record.sections[i + 1].turn - 1 : turns.length),
}));
chapters.push({ id: 'qa', title: 'Simulated Q&A', kind: 'Separate exercise', question: 'Try a question-and-answer exercise.', simulated: true, turns: [] });
const speakers = { dawkins: { initials: 'RD', color: 'a' }, lennox: { initials: 'JL', color: 'b' }, pryor: { initials: 'BP', color: 'host' }, taunton: { initials: 'LT', color: 'host' } };
let active = 0, question = 0, query = '';
const requestedDesign = new URLSearchParams(location.search).get('design');
let design = ['desk', 'room'].includes(requestedDesign) ? requestedDesign : 'combined';
const roomTop = document.querySelector('.room-layout');
const transcriptDesk = document.querySelector('.desk-layout');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const panels = ['desk-content', 'room-content'].map(id => document.getElementById(id));
// Mirror the site's OutsideScroll: gutter-free text, native pill beyond the border.
const outsideScrollbars = panels.map(panel => {
  let root = panel.closest('.reading');
  if (!root) {
    root = document.createElement('div'); root.className = 'outside-scroll-root';
    panel.before(root); root.append(panel);
  }
  const bar = document.createElement('div'); bar.className = 'outside-scrollbar';
  bar.setAttribute('aria-hidden', 'true'); bar.tabIndex = -1;
  const extent = document.createElement('div'); extent.style.width = '1px';
  bar.append(extent); root.append(bar);
  const ratio = () => {
    const range = panel.scrollHeight - panel.clientHeight;
    return range > 0 ? (bar.scrollHeight - bar.clientHeight) / range : 1;
  };
  const measure = () => {
    if (!panel.clientHeight) return;
    bar.style.top = `${panel.getBoundingClientRect().top - root.getBoundingClientRect().top}px`;
    bar.style.height = `${panel.clientHeight}px`;
    extent.style.height = `${Math.min(panel.scrollHeight, panel.clientHeight * 12)}px`;
    bar.hidden = panel.scrollHeight <= panel.clientHeight;
    bar.scrollTop = panel.scrollTop * ratio();
  };
  panel.addEventListener('scroll', () => { const target = panel.scrollTop * ratio(); if (Math.abs(bar.scrollTop - target) > 1) bar.scrollTop = target; });
  bar.addEventListener('scroll', () => { const scale = ratio(); if (scale > 0) { const target = bar.scrollTop / scale; if (Math.abs(panel.scrollTop - target) > 1) panel.scrollTop = target; } });
  new ResizeObserver(measure).observe(panel);
  new MutationObserver(() => requestAnimationFrame(measure)).observe(panel, { childList: true, subtree: true });
  return { measure };
});
const inputs = [...document.querySelectorAll('[data-search]')];
const download = URL.createObjectURL(new Blob([record.text], { type: 'text/plain;charset=utf-8' }));
document.querySelectorAll('.transcript-download').forEach(link => { link.href = download; });
function questionPicker() {
  return `<div class="simulation-label">Invented Q&A · Not part of the transcript or recorded debate</div><div class="question-picker" role="group" aria-label="Simulated audience questions">${questions.map((q, i) => `<button data-question="${i}" aria-pressed="${question === i}">Q${i + 1} · ${escape(q.short)}</button>`).join('')}</div><p class="audience-question">${escape(questions[question].q)}</p>`;
}
function selectStage(index) {
  active = index; query = ''; inputs.forEach(input => { input.value = ''; }); render();
  panels.forEach(panel => { panel.scrollTop = 0; });
}
function render() {
  const c = chapters[active], searching = Boolean(query.trim());
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const items = searching ? turns.filter(t => words.every(word => `${t.label} ${t.paragraphs.join(' ')}`.toLocaleLowerCase().includes(word))) : c.simulated ? questions[question].answers.map((answer, i) => ({ number: i + 1, speaker: answer[0], label: answer[2], paragraphs: [answer[1]] })) : c.turns;
  const exercise = c.simulated && !searching;
  document.querySelector('.chapters').innerHTML = chapters.map((ch, i) => `<button data-stage="${ch.id}" data-index="${i}" aria-current="${!searching && active === i}"><span>${String(i + 1).padStart(2, '0')}</span>${escape(ch.title)}<small>${ch.kind}${ch.simulated ? '' : ` · ${ch.turns.length} ${ch.turns.length === 1 ? 'turn' : 'turns'}`}</small></button>`).join('');
  document.querySelectorAll('[data-stage]').forEach(button => button.addEventListener('click', () => selectStage(Number(button.dataset.index))));
  const title = searching ? 'Search results' : c.title;
  const label = exercise ? questionPicker() : `<p class="paraphrase-label">Supplied transcript · Original speaking order${searching ? ' · Matching turns shown in full' : ''}</p>`;
  const empty = items.length ? '' : '<p>No matching passages. Clear the search to return to the full transcript.</p>';
  const paragraphs = t => t.paragraphs.map(p => `<p class="transcript-paragraph">${escape(p)}</p>`).join('');
  document.getElementById('desk-content').innerHTML = `<p class="eyebrow">${searching ? 'All twelve transcript sections' : c.kind}</p><h2 class="section-title">${escape(title)}</h2>${label}${empty}${items.map(t => { const s = speakers[t.speaker]; return `<section class="turn" ${exercise ? '' : `data-turn="${t.number}"`}><header class="turn-head"><b class="avatar ${s.color}">${s.initials}</b><span class="speaker-label ${s.color}">${escape(t.label)}</span><span class="turn-number">${exercise ? 'Example' : 'Turn'} ${t.number}</span></header>${paragraphs(t)}</section>`; }).join('')}`;
  document.getElementById('room-section').textContent = searching ? 'All twelve transcript sections' : `${String(active + 1).padStart(2, '0')} / ${c.kind}`;
  document.getElementById('room-heading').textContent = title;
  document.getElementById('room-content').innerHTML = `${label}${empty}<div class="paired">${items.map(t => { const s = speakers[t.speaker]; return `<article class="position ${s.color}" ${exercise ? '' : `data-turn="${t.number}"`}><header><span class="speaker-label">${escape(t.label)}</span><span>${exercise ? 'Example' : 'Turn'} ${t.number}</span></header><div class="position-text">${paragraphs(t)}</div></article>`; }).join('')}</div>`;
  document.getElementById('desk-progress').textContent = searching ? `${items.length} matching turns` : `Section ${active + 1} of ${chapters.length}`;
  document.getElementById('desk-next').textContent = searching ? 'Clear search →' : active === chapters.length - 1 ? 'Back to welcome ↺' : 'Next section →';
  document.getElementById('room-progress').textContent = searching ? `${items.length} matches` : `${active + 1} / ${chapters.length}`;
  document.getElementById('room-prev').disabled = searching || active === 0;
  document.getElementById('room-next').disabled = searching || active === chapters.length - 1;
  document.querySelectorAll('.transcript-status').forEach(el => {
    el.textContent = searching ? `${items.length} of ${turns.length} speaker turns match. ` : exercise ? 'Separate invented exercise; not included in the saved transcript.' : `${record.words.toLocaleString()} words · ${turns.length} turns across the complete transcript.`;
    if (searching) { const button = document.createElement('button'); button.textContent = 'Clear search'; button.addEventListener('click', () => selectStage(active)); el.append(button); }
  });
  document.querySelectorAll('.context-question').forEach(el => { el.textContent = searching ? 'Which passage answers your question?' : c.question; });
  document.querySelectorAll('.source-locator').forEach(el => { el.textContent = exercise ? 'Original viewer exercise. These questions and replies are not historical dialogue.' : `Supplied on ${record.received}. ${searching ? 'Searching the entire transcript.' : `${c.title}: turns ${c.turns[0].number}–${c.turns.at(-1).number}.`}`; });
  document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => { question = Number(button.dataset.question); render(); }));
}
function showDesign() {
  // Reuse the working panels so chapter state, search and reading notes carry across views.
  if (design === 'combined') document.getElementById('combined').append(roomTop, transcriptDesk);
  else {
    document.getElementById('room').prepend(roomTop);
    document.getElementById('desk').append(transcriptDesk);
  }
  document.querySelectorAll('[data-full-debate]').forEach(frame => { const visible = frame.closest('section').id === design; if (visible && !frame.hasAttribute('src')) frame.src = 'https://www.youtube-nocookie.com/embed/zF5bPI92-5o?rel=0&playsinline=1'; else if (!visible) frame.removeAttribute('src'); });
  document.getElementById('desk').hidden = design !== 'desk'; document.getElementById('room').hidden = design !== 'room';
  document.getElementById('combined').hidden = design !== 'combined';
  requestAnimationFrame(() => outsideScrollbars.forEach(scroll => scroll.measure()));
  document.querySelectorAll('[data-design]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.design === design)));
  const url = new URL(location.href); url.searchParams.set('design', design); history.replaceState(null, '', url);
}
document.querySelectorAll('[data-design]').forEach(button => button.addEventListener('click', () => { design = button.dataset.design; showDesign(); }));
inputs.forEach(input => input.addEventListener('input', () => { query = input.value; inputs.forEach(other => { if (other !== input) other.value = query; }); render(); panels.forEach(panel => { panel.scrollTop = 0; }); }));
document.getElementById('desk-next').addEventListener('click', () => selectStage(query.trim() ? active : (active + 1) % chapters.length));
document.getElementById('room-next').addEventListener('click', () => selectStage(Math.min(chapters.length - 1, active + 1)));
document.getElementById('room-prev').addEventListener('click', () => selectStage(Math.max(0, active - 1)));
document.getElementById('theme').addEventListener('click', () => { const light = document.documentElement.dataset.theme !== 'light'; document.documentElement.dataset.theme = light ? 'light' : 'dark'; document.getElementById('theme').textContent = light ? 'Dark theme' : 'Light theme'; });
const note = document.getElementById('desk-note');
try { note.value = sessionStorage.getItem('god-delusion-viewer-note') || ''; } catch { /* Preview notes are optional. */ }
note.addEventListener('input', () => { try { sessionStorage.setItem('god-delusion-viewer-note', note.value); document.querySelector('.note-status').textContent = 'Saved in this preview.'; } catch { document.querySelector('.note-status').textContent = 'Browser storage is unavailable. Copy your note before leaving.'; } });
render(); showDesign();
document.fonts.ready.then(() => outsideScrollbars.forEach(scroll => scroll.measure()));
