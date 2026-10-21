// Library mock-up: loads the site's chapter counts (/data/stats.json) and the local draft summaries,
// then wires the river (river.js), the chosen-chapter panel, the six parts, the timeline and the chart.
const READ_KEY = 'bp-mock-library-read';
const format = (n) => Math.round(n).toLocaleString('en-US');
const el = (id) => document.getElementById(id);
const icon = (id, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[id]}</svg>`;
const sectionOf = (id) => SECTIONS.find((s) => s.id === id);
const minutes = (words) => Math.max(1, Math.round(words / 200));

const app = { bars: [], books: [], summaries: {}, selected: -1, part: 'history', mode: 'choose', read: loadRead(), river: null };

function loadRead() { try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || '[]')); } catch { return new Set(); } }
function saveRead() { try { localStorage.setItem(READ_KEY, JSON.stringify([...app.read])); } catch { /* marks stay for this visit only */ } }
const keyOf = (bar) => `${bar.code}:${bar.chapter}`;

async function start() {
  wireTheme();
  const stats = await fetch('/data/stats.json').then((r) => { if (!r.ok) throw new Error(`stats.json: HTTP ${r.status}`); return r.json(); });
  app.summaries = await fetch('./summaries.local.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  for (const book of stats.books.filter((b) => b.section !== 'apocrypha')) {
    app.books.push({ index: app.books.length, code: book.code, name: book.name, section: book.section, start: app.bars.length, count: book.chapters.length, words: book.words, verses: book.verses, red: book.red });
    book.chapters.forEach(([verses, words, red], i) => app.bars.push({ code: book.code, name: book.name, section: book.section, chapter: i + 1, verses, words, red, book: app.books.length - 1, index: app.bars.length }));
  }
  renderStats();
  app.river = createRiver({ bars: app.bars, books: app.books, onSelect: selectChapter, onHover: showReadout });
  wireRiverControls();
  renderChips();
  selectPart(app.part);
  selectChapter(app.bars.findIndex((b) => b.code === 'JHN' && b.chapter === 1), { reveal: false });
  wireKeys();
}

function renderStats() {
  const sum = (key) => app.bars.reduce((total, bar) => total + bar[key], 0);
  const items = [['66', 'books'], [format(app.bars.length), 'chapters'], [format(sum('verses')), 'verses (KJV)'], [format(sum('words')), 'words'], ['37', 'versions']];
  el('stats').innerHTML = items.map(([value, label]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
}

function showReadout(bar) {
  el('readout').innerHTML = bar
    ? `<b style="color:var(--${bar.section})">${bar.name} ${bar.chapter}</b> · ${bar.verses} verses · ${format(bar.words)} words${bar.red ? ` · ${format(bar.red)} words of Jesus` : ''}${app.summaries[keyOf(bar)] ? ` · <i>${app.summaries[keyOf(bar)].title}</i>` : ''}`
    : '&nbsp;';
}

function wireRiverControls() {
  document.querySelectorAll('[data-metric]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-metric]').forEach((b) => b.setAttribute('aria-checked', String(b === button)));
    app.river.setMetric(button.dataset.metric);
  }));
  el('reset-view').addEventListener('click', () => app.river.reset());
}

function wireKeys() {
  document.addEventListener('keydown', (event) => {
    if (event.target.closest?.('input, textarea, select') || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = app.selected + (event.key === 'ArrowRight' ? 1 : -1);
      if (next >= 0 && next < app.bars.length) selectChapter(next);
    }
  });
}

function selectChapter(index, { reveal = true, from } = {}) {
  if (index < 0) return;
  app.selected = index;
  app.river.select(index, { reveal });
  renderChapter();
  const bar = app.bars[index];
  if (bar.section !== app.part) selectPart(bar.section); else renderChart();
  if (from === 'chart') centerChapter();
}

/** Bring the chosen chapter to the middle of the screen (its top near the top if it is taller than the screen). */
function centerChapter() {
  const box = el('chapter').getBoundingClientRect();
  const offset = Math.max(24, (innerHeight - box.height) / 2);
  scrollTo({ top: scrollY + box.top - offset, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}

function renderChapter() {
  const bar = app.bars[app.selected], book = app.books[bar.book], section = sectionOf(bar.section);
  const summary = app.summaries[keyOf(bar)], prev = app.bars[app.selected - 1], next = app.bars[app.selected + 1];
  const maxInBook = Math.max(...app.bars.slice(book.start, book.start + book.count).map((b) => b.verses));
  const strip = app.bars.slice(book.start, book.start + book.count).map((b) =>
    `<button type="button" class="strip-bar${b.index === bar.index ? ' on' : ''}" data-chapter="${b.index}" title="${b.name} ${b.chapter} · ${b.verses} verses" style="--h:${Math.max(8, (b.verses / maxInBook) * 100)}%"></button>`).join('');
  const outline = summary?.outline?.length
    ? summary.outline.map(([from, to, heading, text]) => `<details><summary><span class="verses">${from === to ? from : `${from}–${to}`}</span>${heading}</summary><p>${text}</p></details>`).join('')
    : '<p class="muted">No outline yet.</p>';
  el('chapter').style.setProperty('--tone', `var(--${bar.section})`);
  el('chapter').innerHTML = `
    <div class="chapter-head">
      <div>
        <p class="eyebrow tone">${icon(bar.section, 16)} ${section.name} <span>· ${section.testament} · chapter ${bar.chapter} of ${book.count} · ${format(bar.index + 1)} of ${format(app.bars.length)} in the Bible</span></p>
        <h2>${bar.name} ${bar.chapter}</h2>
        ${summary ? `<p class="chapter-title">${summary.title}</p>` : ''}
      </div>
      <div class="step">
        <button type="button" data-chapter="${prev?.index ?? ''}" ${prev ? '' : 'disabled'}>← ${prev ? `${prev.name} ${prev.chapter}` : 'Start'}</button>
        <button type="button" data-chapter="${next?.index ?? ''}" ${next ? '' : 'disabled'}>${next ? `${next.name} ${next.chapter}` : 'End'} →</button>
      </div>
    </div>
    <div class="chapter-grid">
      <div class="chapter-facts">
        <dl>
          <div><dt>Verses</dt><dd>${bar.verses}</dd></div>
          <div><dt>Words</dt><dd>${format(bar.words)}</dd></div>
          ${bar.red ? `<div><dt>Words of Jesus</dt><dd>${format(bar.red)}</dd></div>` : ''}
          <div><dt>Reading time</dt><dd>${minutes(bar.words)} min</dd></div>
        </dl>
        <div class="strip-block">
          <p class="small-caps">${bar.name}, chapter by chapter</p>
          <div class="strip" style="--tone:var(--${bar.section});--gap:${book.count > 80 ? 0 : book.count > 40 ? 1 : 2}px">${strip}</div>
        </div>
      </div>
      <div class="chapter-summary">
        ${summary ? `<p>${summary.summary}</p>${summary.invitation ? `<p class="notice"><span class="small-caps">Notice</span>${summary.invitation}</p>` : ''}` : '<p class="muted">No summary for this chapter yet.</p>'}
        <div class="chapter-actions"><a class="read" href="/read/kjv/${bar.code}/${bar.chapter}">Read ${bar.name} ${bar.chapter} →</a><span class="draft">Draft summary · awaiting approval</span></div>
      </div>
      <div class="chapter-outline"><p class="small-caps">Outline</p>${outline}</div>
    </div>`;
  el('chapter').querySelectorAll('[data-chapter]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.chapter !== '') selectChapter(Number(button.dataset.chapter));
  }));
}

function partStats(id) {
  const bars = app.bars.filter((b) => b.section === id), books = app.books.filter((b) => b.section === id);
  const sum = (key, list = bars) => list.reduce((t, b) => t + b[key], 0);
  const allWords = app.bars.reduce((t, b) => t + b.words, 0);
  const longest = bars.reduce((a, b) => (b.verses > a.verses ? b : a)), shortest = bars.reduce((a, b) => (b.verses < a.verses ? b : a));
  const bigBook = books.reduce((a, b) => (b.words > a.words ? b : a));
  return { bars, books, chapters: bars.length, verses: sum('verses'), words: sum('words'), red: sum('red'), share: (sum('words') / allWords) * 100, longest, shortest, bigBook };
}

function renderChips() {
  el('part-chips').innerHTML = SECTIONS.map((s) => {
    const stats = partStats(s.id), done = stats.bars.filter((b) => app.read.has(keyOf(b))).length;
    return `<button type="button" role="tab" class="part-chip" data-part="${s.id}" style="--tone:var(--${s.id})" aria-selected="${s.id === app.part}">
      <span class="chip-icon">${icon(s.id)}</span><span class="chip-name">${s.name}</span><span class="chip-range">${s.range}</span>
      <span class="chip-count">${stats.books.length} ${stats.books.length === 1 ? 'book' : 'books'} · ${stats.chapters} chapters${done ? ` · <b>${done} read</b>` : ''}</span>
      <span class="chip-share" style="--share:${stats.share.toFixed(1)}%"></span></button>`;
  }).join('');
  el('part-chips').querySelectorAll('[data-part]').forEach((chip) => chip.addEventListener('click', () => selectPart(chip.dataset.part)));
}

function selectPart(id) {
  app.part = id;
  el('part-chips').querySelectorAll('[data-part]').forEach((chip) => chip.setAttribute('aria-selected', String(chip.dataset.part === id)));
  const s = sectionOf(id), stats = partStats(id);
  const numbers = [
    ['Books', `${stats.books.length}`], ['Chapters', format(stats.chapters)], ['Verses', format(stats.verses)], ['Words', format(stats.words)],
    ['Of the Bible', `${stats.share.toFixed(1)}%`], ['To read', `${Math.max(1, Math.round(stats.words / 200 / 60))} h`],
  ];
  if (stats.red) numbers.push(['Words of Jesus', format(stats.red)]);
  const chapterLink = (bar, unit) => `<button type="button" class="inline-link" data-chapter="${bar.index}">${bar.name} ${bar.chapter}</button> · ${bar.verses} ${bar.verses === 1 ? unit : `${unit}s`}`;
  const facts = [
    ['Tells of', s.coversText], ['Written', s.writtenText], ...s.facts,
    ['Longest chapter', chapterLink(stats.longest, 'verse')], ['Shortest chapter', chapterLink(stats.shortest, 'verse')],
  ];
  if (stats.books.length > 1) facts.push(['Longest book', `${stats.bigBook.name} · ${format(stats.bigBook.words)} words`]);
  el('part').style.setProperty('--tone', `var(--${id})`);
  el('part').innerHTML = `
    <div class="part-head">
      <div>
        <p class="eyebrow tone">${icon(id, 16)} ${s.testament} · ${s.range}</p>
        <h3>${s.long}</h3>
      </div>
      <dl class="numbers">${numbers.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </div>
    <div class="part-body">
      <div class="part-copy">
        <p class="about">${s.about}</p>
        <div class="moments">${s.moments.map((m) => `<span>${m}</span>`).join('')}</div>
        <button type="button" class="link-button" id="fly-part">Show ${s.name} in the river ↑</button>
      </div>
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
    </div>`;
  el('part').querySelectorAll('[data-chapter]').forEach((b) => b.addEventListener('click', () => selectChapter(Number(b.dataset.chapter), { from: 'chart' })));
  el('fly-part').addEventListener('click', () => { app.river.flyToSection(id); el('river').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  drawTimeline();
  renderChart();
}

function renderChart() {
  const stats = partStats(app.part), max = Math.max(...stats.bars.map((b) => b.verses));
  el('chart-title').innerHTML = `Every chapter of <em style="color:var(--${app.part})">${sectionOf(app.part).long.replace(/^The /, 'the ')}</em>`;
  el('chart').style.setProperty('--tone', `var(--${app.part})`);
  el('chart').innerHTML = stats.books.map((book) => `<div class="chart-row"><button type="button" class="chart-book" data-book="${book.index}">${book.name}</button><div class="cells">${
    app.bars.slice(book.start, book.start + book.count).map((b) => `<button type="button" class="cell${app.read.has(keyOf(b)) ? ' read' : ''}${b.index === app.selected ? ' on' : ''}" data-chapter="${b.index}" style="--depth:${Math.round(14 + (b.verses / max) * 56)}%" title="${b.name} ${b.chapter} · ${b.verses} verses">${b.chapter}</button>`).join('')}</div></div>`).join('');
  el('chart').querySelectorAll('.cell').forEach((cell) => cell.addEventListener('click', () => {
    const bar = app.bars[Number(cell.dataset.chapter)];
    if (app.mode === 'mark') { app.read.has(keyOf(bar)) ? app.read.delete(keyOf(bar)) : app.read.add(keyOf(bar)); saveRead(); cell.classList.toggle('read'); renderChips(); selectPartChipState(); return; }
    selectChapter(bar.index, { from: 'chart' });
  }));
  el('chart').querySelectorAll('.chart-book').forEach((button) => button.addEventListener('click', () => {
    const book = app.books[Number(button.dataset.book)];
    app.river.flyToBook(book.index);
    selectChapter(book.start, { reveal: false, from: 'chart' });
  }));
}

function selectPartChipState() { el('part-chips').querySelectorAll('[data-part]').forEach((chip) => chip.setAttribute('aria-selected', String(chip.dataset.part === app.part))); }

document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  app.mode = button.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-checked', String(b === button)));
  el('chart').classList.toggle('marking', app.mode === 'mark');
}));

function wireTheme() {
  const theme = document.querySelector('.theme-toggle');
  const reflect = () => theme.setAttribute('aria-checked', String(document.documentElement.dataset.theme === 'dark'));
  theme.addEventListener('click', () => {
    const value = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = value;
    try { localStorage.setItem('bp-theme', value); } catch { /* theme lasts for this visit */ }
    reflect();
  });
  reflect();
}

start().catch((error) => {
  console.error('library mock-up failed to load', error);
  el('readout').textContent = `Could not load the chapter data (${error.message}). Is the local preview running?`;
});
