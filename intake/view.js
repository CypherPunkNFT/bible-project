// One intake: sources → files → the chosen file, read in place from the intake's folder.
const slug = location.pathname.split('/').filter(Boolean)[1];
const SHOWN = 400; // rows drawn at first; more on request
const TEXT_PEEK = 262144; // bytes of a text file shown in the preview
const TEXT_EXT = /\.(txt|md|json|jsonl|ndjson|csv|tsv|xml|tei|html?|log|out|py|mjs|js|ts|sha256|yaml|yml|usfm|usx|osis|svg)$/i;
let catalogue, files = [], source = 0, typeFilter = null, limit = SHOWN, chosen = null, peek = 0;

const fileUrl = (path) => `/data_intake/files/${slug}/${path.split('/').map(encodeURIComponent).join('/')}`;
const baseName = (path) => path.slice(path.lastIndexOf('/') + 1);
const folderOf = (path) => path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';

function fact(label, value, href) {
  const d = node('div');
  d.append(node('small', label));
  if (href) { const a = node('a', value); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; d.append(a); }
  else d.append(node('span', value || '—'));
  return d;
}

function renderSources() {
  const list = $('sources');
  const max = Math.max(...catalogue.sources.map((s) => s.bytes), 1);
  const fragment = document.createDocumentFragment();
  // Ready-to-use text & data first, then PDF scans, then what the job made from them.
  const GROUPS = { text: 'Text & data', scan: 'PDF scans', made: 'Made by the job' };
  const groupBytes = {};
  for (const s of catalogue.sources) groupBytes[s.kind] = (groupBytes[s.kind] || 0) + s.bytes;
  let current = null;
  catalogue.sources.forEach((s, i) => {
    if (s.kind !== current) {
      current = s.kind;
      const label = node('div', null, 'group-label');
      label.append(node('span', GROUPS[s.kind] ?? s.kind), node('span', size(groupBytes[s.kind])));
      fragment.append(label);
    }
    const tone = s.licence_flag === true ? ' flag' : s.licence_flag === false ? ' ok' : '';
    const b = node('button', null, `row src${tone}${i === source ? ' active' : ''}`);
    const sub = node('div', null, 'sub');
    sub.append(node('span', s.host || ''), node('span', `${count(s.files)} · ${size(s.bytes)}`));
    const bar = node('div', null, 'bar');
    bar.style.width = `${Math.max(2, (s.bytes / max) * 100)}%`;
    const title = node('h3', s.title);
    if (s.licence_flag) { title.append(node('span', 'Licence', 'lic')); b.title = s.licence_reason; }
    b.append(title, sub, bar);
    b.onclick = () => { source = i; typeFilter = null; limit = SHOWN; chosen = null; renderSources(); renderFiles(); renderReader(); };
    fragment.append(b);
  });
  list.replaceChildren(fragment);
  $('source-count').textContent = catalogue.totals.sources;
}

function sourceFiles() { return files.filter((f) => f[0] === source); }

function renderChips(rows) {
  const types = {};
  for (const f of rows) types[f[3]] = (types[f[3]] || 0) + 1;
  const chips = $('chips');
  chips.replaceChildren();
  const all = node('button', `All ${count(rows.length)}`);
  all.setAttribute('aria-pressed', String(typeFilter === null));
  all.onclick = () => { typeFilter = null; limit = SHOWN; renderFiles(); };
  chips.append(all);
  for (const t of TYPE_ORDER) {
    if (!types[t]) continue;
    const b = node('button', `${t} ${count(types[t])}`);
    b.style.color = typeFilter === t ? '' : typeColour(t);
    b.setAttribute('aria-pressed', String(typeFilter === t));
    b.onclick = () => { typeFilter = typeFilter === t ? null : t; limit = SHOWN; renderFiles(); };
    chips.append(b);
  }
}

function renderFiles() {
  const rows = sourceFiles();
  renderChips(rows);
  const term = $('filter').value.trim().toLowerCase();
  const shown = rows.filter((f) => (!typeFilter || f[3] === typeFilter) && (!term || f[1].toLowerCase().includes(term)))
    .sort((a, b) => (b[3] === 'Output') - (a[3] === 'Output') || b[2] - a[2]);
  $('file-count').textContent = shown.length === rows.length ? count(rows.length) : `${count(shown.length)} of ${count(rows.length)}`;
  const fragment = document.createDocumentFragment();
  for (const f of shown.slice(0, limit)) {
    const b = node('button', null, `row file${chosen === f ? ' active' : ''}`);
    const tag = node('span', f[3], 'tag');
    tag.style.color = typeColour(f[3]);
    const name = node('strong');
    name.append(tag, baseName(f[1]));
    name.title = f[1];
    b.append(name, node('span', size(f[2]), 'sz'), node('small', folderOf(f[1])));
    b.onclick = () => { chosen = f; peek = 0; renderFiles(); renderReader(); };
    fragment.append(b);
  }
  if (shown.length > limit) {
    const more = node('button', `Show ${count(Math.min(SHOWN, shown.length - limit))} more of ${count(shown.length - limit)}`, 'more');
    more.onclick = () => { limit += SHOWN; renderFiles(); };
    fragment.append(more);
  }
  if (!shown.length) fragment.append(node('p', 'No files match.', 'empty'));
  $('files').replaceChildren(fragment);
}

function renderSourceDetails() {
  const s = catalogue.sources[source];
  const reader = $('reader');
  const facts = node('div', null, 'facts');
  const verdict = s.licence_flag === true ? node('div', `Licence questionable · ${s.licence_reason}`, 'licence-note')
    : s.licence_flag === false ? node('div', 'Licence clear', 'licence-note ok') : null;
  if (s.output_rows !== undefined) facts.append(fact('Output', s.output_rows ? `${count(s.output_rows)} questions` : s.output_note));
  facts.append(fact('Files', count(s.files)), fact('Size', size(s.bytes)), fact('From', s.host || '—'),
    fact('Publisher', s.publisher), fact('Licence', s.licence));
  if (s.url) facts.append(fact('Address', s.url.replace(/^https?:\/\//, ''), s.url));
  const byType = {};
  for (const f of sourceFiles()) { const e = byType[f[3]] || (byType[f[3]] = [0, 0]); e[0] += 1; e[1] += f[2]; }
  // A source's files may sit in raw/<name>/ and images/<name>/; show where they really are.
  const folders = [...new Set(sourceFiles().map((f) => f[1].split('/').slice(0, 2).join('/')))].slice(0, 3);
  reader.replaceChildren(node('h2', s.title), node('div', folders.map((f) => `${catalogue.folder}/${f}`).join(' · '), 'path'), facts, typeBar(byType, true));
  if (verdict) facts.before(verdict);
}

async function renderReader() {
  if (!chosen) return renderSourceDetails();
  const f = chosen;
  const url = fileUrl(f[1]);
  const reader = $('reader');
  const open = node('a', 'Open file ↗', 'open');
  open.href = url; open.target = '_blank'; open.rel = 'noopener';
  const facts = node('div', null, 'facts');
  facts.append(fact('Type', f[3]), fact('Size', size(f[2])), fact('Source', catalogue.sources[f[0]].title));
  const preview = node('div', null, 'preview');
  reader.replaceChildren(node('h2', baseName(f[1])), node('div', `${catalogue.folder}/${f[1]}`, 'path'), facts, open, preview);
  const ext = (f[1].match(/\.[^./]+$/) || [''])[0].toLowerCase();
  if (f[3] === 'Image' && !['.tif', '.tiff', '.jp2'].includes(ext)) {
    const img = node('img'); img.src = url; img.alt = baseName(f[1]); img.loading = 'lazy'; preview.append(img);
  } else if (ext === '.pdf') {
    const frame = node('iframe'); frame.src = url; frame.title = baseName(f[1]); preview.append(frame);
  } else if (f[3] === 'Audio') {
    const audio = node('audio'); audio.controls = true; audio.preload = 'metadata'; audio.src = url; preview.append(audio);
  } else if (f[3] === 'Output') {
    await showTable(f, url, preview);
  } else if (TEXT_EXT.test(f[1]) && f[2] > 0) {
    await showText(f, url, preview);
  } else {
    preview.append(node('p', f[2] === 0 ? 'Empty file.' : 'No preview for this type.', 'note'));
  }
}

/** Parse CSV text (quoted fields, doubled quotes, newlines inside quotes). Returns complete rows only. */
function parseCsv(text, complete) {
  const rows = [];
  let row = [], field = '', quoted = false, i = 0;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (complete && (field || row.length)) { row.push(field); rows.push(row); }
  return rows;
}

/** An Output file: index, question, answer, reference as a table, read in pieces. */
async function showTable(f, url, preview) {
  const end = Math.min(f[2], peek + 1048576) - 1;
  preview.append(node('p', 'Loading…', 'note'));
  try {
    const response = await fetch(url, { headers: { Range: `bytes=0-${end}` } });
    if (!response.ok) throw new Error(`answered ${response.status}`);
    const text = await response.text();
    if (chosen !== f) return;
    const [head, ...rows] = parseCsv(text, end + 1 === f[2]);
    const table = node('table', null, 'qa');
    const thead = node('tr');
    for (const h of head) thead.append(node('th', h));
    table.append(thead);
    const fragment = document.createDocumentFragment();
    for (const r of rows) {
      const tr = node('tr');
      for (const cell of r) tr.append(node('td', cell));
      fragment.append(tr);
    }
    table.append(fragment);
    preview.replaceChildren(table);
    if (end + 1 < f[2]) {
      const more = node('button', `Showing ${count(rows.length)} questions · ${size(end + 1)} of ${size(f[2])} · show more`, 'more');
      more.onclick = () => { peek = end + 1; renderReader(); };
      preview.append(more);
    }
  } catch (error) {
    if (chosen === f) preview.replaceChildren(node('p', `The file could not be read: ${error.message}`, 'note'));
  }
}

async function showText(f, url, preview) {
  const end = Math.min(f[2], peek + TEXT_PEEK) - 1;
  preview.append(node('p', 'Loading…', 'note'));
  try {
    const response = await fetch(url, { headers: { Range: `bytes=0-${end}` } });
    if (!response.ok) throw new Error(`answered ${response.status}`);
    let text = await response.text();
    if (chosen !== f) return; // another file was chosen meanwhile
    if (end + 1 === f[2] && /\.json$/i.test(f[1])) { try { text = JSON.stringify(JSON.parse(text), null, 2); } catch {} }
    const pre = node('pre', text);
    preview.replaceChildren(pre);
    if (end + 1 < f[2]) {
      const more = node('button', `Showing ${size(end + 1)} of ${size(f[2])} · show more`, 'more');
      more.onclick = () => { peek = end + 1; renderReader(); };
      preview.append(more);
    }
  } catch (error) {
    if (chosen === f) preview.replaceChildren(node('p', `The file could not be read: ${error.message}`, 'note'));
  }
}

(async () => {
  try {
    const response = await fetch(`/data_intake/${slug}/catalogue.json`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`answered ${response.status}`);
    catalogue = await response.json();
  } catch (error) {
    $('title').textContent = 'Not found';
    $('reader').replaceChildren(node('p', `This intake could not be read: ${error.message}`, 'empty'));
    return;
  }
  files = catalogue.files;
  document.title = `${catalogue.title} · Data intake`;
  $('title').textContent = catalogue.title;
  $('crumb').textContent = catalogue.title.toUpperCase();
  const t = catalogue.totals;
  $('stats').replaceChildren(stat(count(t.sources), 'Sources'), stat(count(t.download_files), 'Files downloaded'),
    stat(size(t.text_bytes), 'Text & data'),
    ...(t.scan_sources ? [stat(size(t.scan_bytes), `PDF scans · ${t.scan_sources}`)] : []),
    stat(`Job ${catalogue.jobs.join(' · ')}`, 'Orchestrator'));
  $('filter').oninput = () => { limit = SHOWN; renderFiles(); };
  renderSources(); renderFiles(); renderReader();
})();
