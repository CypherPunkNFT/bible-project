// The grant research desk: overview, funder explorer (filters, sort, grouping, detail), timeline, universities,
// donor listings, to-dos and readiness, and every research document — all from /data_grants/api/research.json.
'use strict';
const { el, inline, plain, blocks, block, safeUrl } = GR;
const $ = (id) => document.getElementById(id);
try { document.body.classList.toggle('dark', localStorage.getItem('acquisition-theme') === 'dark'); } catch { /* private mode */ }
$('theme').onclick = () => { document.body.classList.toggle('dark'); try { localStorage.setItem('acquisition-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); } catch { /* private mode */ } };

const VIEWS = [['overview', 'Overview'], ['funders', 'Funders'], ['timeline', 'Timeline'], ['universities', 'Universities'], ['listings', 'Donor listings'], ['todo', 'To-do & readiness'], ['documents', 'Documents']];
const FIELDS = [['about', 'What it is'], ['amount', 'Amount'], ['deadline', 'Dates'], ['eligibility', 'Eligibility'], ['fit', 'Fit'], ['funder_open', 'Open?'], ['open_to_us', 'Open to us?'], ['status', 'Status and notes'], ['verified', 'Checked']];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const TODAY = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const S = { data: null, docs: [], docById: {}, orgs: {}, view: 'overview', search: '', picked: {}, sort: 'date', group: 'org', doc: null, showPast: false };

const docLabel = (id) => S.docById[id]?.label ?? id;
const datesOf = (lead) => lead.dates.filter((d) => d.kind !== 'ignored');
const nextDate = (lead) => datesOf(lead).filter((d) => d.date >= TODAY).sort((a, b) => a.date.localeCompare(b.date))[0];
const kindWord = (d) => (d.kind === 'deadline' ? 'deadline' : d.kind === 'opens' ? 'opens' : 'date mentioned');
const dateWords = (d) => `${kindWord(d)}: ${d.approx ? 'about ' : ''}${d.text}`;
const isoWords = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`; };
const orgName = (lead) => S.orgs[lead.org]?.name ?? lead.name;
const ctxFor = (fileId) => ({ docs: S.docs, relative: S.docById[fileId]?.relative ?? '', openDoc });
const stateClass = (value) => ({ Open: 'shown', Closed: 'hidden', Later: 'fix', Yes: 'fix', No: 'shown' }[value] ?? '');
const tag = (text, cls = '') => el('span', { class: `qtag ${cls}` }, text);

const FACETS = [
  ['program', 'Program', (l) => (l.programs.length ? l.programs : ['Not stated'])],
  ['track', 'Pathways track', (l) => (l.tracks.length ? l.tracks : ['None named'])],
  ['open_to_us', 'Open to us (tagged)', (l) => [l.open_to_us]],
  ['funder_open', 'Funder open (tagged)', (l) => [l.funder_open]],
  ['letter', 'Needs the IRS letter (tagged)', (l) => [l.letter]],
  ['when', 'Dates', (l) => [nextDate(l) ? 'A date ahead' : datesOf(l).length ? 'Only past dates' : 'No date']],
  ['kind', 'Kind', (l) => [l.kind]],
  ['file', 'Source document', (l) => [docLabel(l.file)]],
];
const GROUPS = { org: ['Organisation', (l) => [orgName(l)]], program: ['Program', FACETS[0][2]], open_to_us: ['Open to us', FACETS[2][2]], kind: ['Kind', FACETS[6][2]], file: ['Source document', FACETS[7][2]], none: ['No grouping', () => ['All mentions']] };
const SORTS = { date: ['Next date first', (a, b) => (nextDate(a)?.date ?? '9999').localeCompare(nextDate(b)?.date ?? '9999')], name: ['Name A–Z', (a, b) => a.name.localeCompare(b.name)], mentions: ['Most-mentioned organisation', (a, b) => countOrg(b.org) - countOrg(a.org) || a.name.localeCompare(b.name)], file: ['Source document', (a, b) => docLabel(a.file).localeCompare(docLabel(b.file)) || a.line - b.line] };
const countOrg = (org) => S.data.leads.filter((l) => l.org === org).length;

function searchText(lead) {
  lead._text ??= [lead.name, orgName(lead), lead.section, ...Object.values(lead.cells)].map(plain).join(' ').toLowerCase();
  return lead._text;
}
function matches(lead, skip) {
  if (S.search && !S.search.split(/\s+/).every((word) => searchText(lead).includes(word))) return false;
  return FACETS.every(([key, , values]) => key === skip || !S.picked[key]?.size || values(lead).some((v) => S.picked[key].has(v)));
}

// ---- shell ---------------------------------------------------------------
function setView(view) {
  S.view = VIEWS.some(([key]) => key === view) ? view : 'overview';
  if (location.hash.slice(1) !== S.view) history.replaceState(null, '', '#' + S.view);
  $('tabs').replaceChildren(...VIEWS.map(([key, label]) => el('button', { type: 'button', class: 'gr-tab', 'aria-current': key === S.view ? 'page' : null, onclick: () => setView(key) }, label)));
  const render = { overview, funders, timeline, universities, listings, todo, documents }[S.view];
  $('view').replaceChildren(...[render()].flat(Infinity).filter(Boolean));
  window.scrollTo({ top: 0 });
}
const section = (title, ...kids) => el('section', { class: 'gr-card' }, el('p', { class: 'eyebrow', text: title }), kids);

// ---- overview ------------------------------------------------------------
function overview() {
  const d = S.data, leads = d.leads;
  const readiness = d.formation.readiness.reduce((sum, t) => [sum[0] + t.have, sum[1] + t.rows], [0, 0]);
  const openTodos = d.todo.sections.flatMap((s) => s.items).filter((i) => !i.checked).length;
  const tiles = [[leads.length, 'funder mentions', 'funders'], [Object.keys(d.organisations).length, 'organisations', 'funders'], [d.universities.length, 'ranked university partners', 'universities'], [d.listings.length, 'donor-listing tables', 'listings'], [openTodos, 'open to-dos', 'todo'], [`${readiness[0]} / ${readiness[1]}`, 'readiness items in hand', 'todo'], [S.docs.length, 'research documents', 'documents']];
  const bars = (title, key) => {
    const counts = {};
    for (const l of leads) for (const v of FACETS.find((f) => f[0] === key)[2](l)) counts[v] = (counts[v] ?? 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]), max = top[0]?.[1] ?? 1;
    return el('div', { class: 'gr-bars' }, el('p', { class: 'eyebrow', text: title }), top.map(([value, n]) => el('button', { type: 'button', class: 'gr-bar', onclick: () => { S.picked = { [key]: new Set([value]) }; setView('funders'); } },
      el('span', { class: 'gr-bar-label', text: value }), el('span', { class: 'gr-bar-track' }, el('i', { style: `width:${Math.max(3, (100 * n) / max)}%` })), el('b', { text: n }))));
  };
  const readme = S.docById[d.ids.readme];
  return [
    el('div', { class: 'gr-tiles' }, tiles.map(([n, label, view]) => el('button', { type: 'button', class: 'gr-tile', onclick: () => setView(view) }, el('strong', { text: n }), el('span', { text: label })))),
    section('Coming up — dated to-dos and funder dates from today', upcoming(8), el('button', { type: 'button', class: 'inline-link', onclick: () => setView('timeline') }, 'The whole timeline →')),
    el('div', { class: 'gr-bargrid' }, bars('By program', 'program'), bars('Open to us, as tagged', 'open_to_us'), bars('Needs the IRS letter, as tagged', 'letter'), bars('By source document', 'file')),
    el('p', { class: 'quiet', text: `The counts cover the ${leads.length} rows of the funder tables the Grants Dashboard reads. ${d.unclassified.length} other tables, and every paragraph, are in Documents — nothing is left out there. One organisation can appear in several rows, once per document and programme.` }),
    readme && !readme.error ? section('Where things stand — from the Grants README', el('div', { class: 'gr-doc' }, blocks(readme.blocks.slice(1), ctxFor(readme.id)))) : null,
  ];
}

function datedItems() {
  const items = [];
  for (const s of S.data.todo.sections) for (const item of s.items) {
    for (const [field, word] of [['due', 'due'], ['scheduled', 'around']]) if (item[field]) items.push({ date: item[field], when: `${word} ${isoWords(item[field])}`, label: item.text, todo: item, kind: 'To-do' });
  }
  for (const lead of S.data.leads) for (const d of datesOf(lead)) items.push({ date: d.date, when: dateWords(d), label: lead.name, lead, kind: `${docLabel(lead.file)}` });
  return items.sort((a, b) => a.date.localeCompare(b.date));
}
function datedRow(item) {
  const done = item.todo?.checked;
  return el('li', { class: 'gr-dated' + (done ? ' done' : '') + (item.date < TODAY ? ' past' : '') },
    el('span', { class: 'gr-when', text: item.when }),
    item.lead ? el('button', { type: 'button', class: 'gr-what', onclick: () => openLead(item.lead) }, item.label, item.lead.open_to_us !== 'Unknown' ? [' ', tag(`open to us: ${item.lead.open_to_us}`, stateClass(item.lead.open_to_us))] : null)
      : el('span', { class: 'gr-what' }, inline(item.label.replace(/\s*[📅⏳✅]\s*\d{4}-\d\d-\d\d/gu, ''), ctxFor(S.data.ids.todo))),
    el('span', { class: 'qtag', text: item.kind }));
}
function upcoming(limit) { return el('ul', { class: 'gr-datedlist' }, datedItems().filter((i) => i.date >= TODAY && !i.todo?.checked).slice(0, limit).map(datedRow)); }

// ---- funders -------------------------------------------------------------
function funders() {
  const rail = el('div', { id: 'facets' });
  const list = el('div', { class: 'gr-results' });
  const count = el('strong', { text: 0 });
  const refresh = () => { renderFacets(rail, refresh); renderResults(list, count); };
  const select = (options, value, onchange, label) => el('label', { class: 'gr-select' }, el('span', { text: label }), el('select', { onchange: (e) => { onchange(e.target.value); refresh(); } }, Object.entries(options).map(([key, [text]]) => el('option', { value: key, selected: key === value }, text))));
  const search = el('input', { type: 'search', placeholder: 'Search names, amounts, eligibility, notes…', autocomplete: 'off', spellcheck: 'false', value: S.search, oninput: (e) => { S.search = e.target.value.trim().toLowerCase(); refresh(); } });
  const railBox = el('aside', { class: 'qx-rail', 'aria-label': 'Filters' }, el('button', { type: 'button', class: 'qx-rail-toggle', onclick: (e) => e.currentTarget.parentElement.classList.toggle('open') }, 'Filters'), el('div', { class: 'qx-rail-body' }, rail));
  const view = el('div', { class: 'qx gr-explorer' }, railBox, el('section', { class: 'qx-work' },
    el('div', { class: 'qx-toolbar' }, el('label', { class: 'qx-search' }, el('span', { class: 'sr', text: 'Search the funder rows' }), search),
      el('p', { class: 'qx-count', 'aria-live': 'polite' }, count, ` of ${S.data.leads.length} rows`),
      select(SORTS, S.sort, (v) => { S.sort = v; }, 'Sort'), select(GROUPS, S.group, (v) => { S.group = v; }, 'Group'),
      el('button', { type: 'button', class: 'qx-ghost', onclick: () => { S.picked = {}; S.search = ''; search.value = ''; refresh(); } }, 'Clear')),
    list));
  refresh();
  return view;
}
function renderFacets(rail, refresh) {
  rail.replaceChildren(...FACETS.map(([key, title, values]) => {
    const counts = {};
    for (const l of S.data.leads) if (matches(l, key)) for (const v of values(l)) counts[v] = (counts[v] ?? 0) + 1;
    const all = new Set(S.data.leads.flatMap(values));
    const picked = S.picked[key] ?? new Set();
    const chips = [...all].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || a.localeCompare(b)).map((v) => el('button', {
      type: 'button', class: 'chip' + (counts[v] ? '' : ' zero'), 'aria-pressed': picked.has(v) ? 'true' : 'false',
      onclick: () => { const set = S.picked[key] ?? new Set(); set.has(v) ? set.delete(v) : set.add(v); S.picked[key] = set; refresh(); },
    }, el('span', { text: v }), el('b', { text: counts[v] ?? 0 })));
    return el('div', { class: 'facet' }, el('div', { class: 'facet-head' }, el('p', { class: 'eyebrow', text: title }), picked.size ? el('button', { type: 'button', onclick: () => { delete S.picked[key]; refresh(); } }, 'clear') : null),
      el('div', { class: 'chips' + (chips.length > 8 ? ' long' : '') }, chips));
  }));
}
function renderResults(list, count) {
  const rows = S.data.leads.filter((l) => matches(l)).sort(SORTS[S.sort][1]);
  count.textContent = rows.length;
  const groups = new Map();
  for (const l of rows) for (const g of GROUPS[S.group][1](l)) { if (!groups.has(g)) groups.set(g, []); groups.get(g).push(l); }
  const ordered = [...groups.entries()];
  if (S.group !== 'none' && S.sort === 'name') ordered.sort((a, b) => a[0].localeCompare(b[0]));
  list.replaceChildren(...(rows.length ? ordered.map(([name, leads]) => el('section', { class: 'gr-group' },
    S.group === 'none' ? null : el('h3', { class: 'gr-group-head' }, el('span', { text: name }), el('b', { text: leads.length })), leads.map(leadRow))) : [el('p', { class: 'qx-empty', text: 'No row matches these filters.' })]));
}
function leadRow(l) {
  const next = nextDate(l);
  return el('button', { type: 'button', class: 'gr-row', onclick: () => openLead(l) },
    el('span', { class: 'gr-row-main' }, el('strong', { text: l.name }), el('small', { text: `${docLabel(l.file)}${l.section ? ' · ' + plain(l.section) : ''}` }),
      el('span', { class: 'd-tags' }, tag(l.kind), l.programs.map((p) => tag(p, 'repeat')), l.open_to_us !== 'Unknown' ? tag(`open to us: ${l.open_to_us}`, stateClass(l.open_to_us)) : null, l.letter !== 'Unknown' ? tag(`IRS letter: ${l.letter}`, l.letter === 'No' ? 'shown' : '') : null)),
    el('span', { class: 'gr-row-amount', text: plain(l.cells.amount ?? '') }),
    el('span', { class: 'gr-row-date', text: next ? dateWords(next) : datesOf(l).length ? 'only past dates' : 'no date' }));
}

// ---- detail drawer -------------------------------------------------------
function openLead(l) {
  const ctx = ctxFor(l.file);
  const siblings = S.data.leads.filter((o) => o.org === l.org);
  const disagree = ['open_to_us', 'funder_open', 'letter'].filter((f) => new Set(siblings.map((o) => o[f]).filter((v) => v !== 'Unknown')).size > 1);
  const tracked = S.data.tracker.filter((t) => t.key === l.key);
  const link = safeUrl(l.link ?? '');
  $('detail-eyebrow').textContent = `${docLabel(l.file)}${l.section ? ' · ' + plain(l.section) : ''}`;
  $('detail-title').textContent = l.name;
  $('detail-body').replaceChildren(...[
    el('div', { class: 'd-tags' }, tag(l.kind), l.programs.map((p) => tag(p, 'repeat')), l.tracks.map((t) => tag(`track: ${t}`, 'repeat')), tag(`open to us: ${l.open_to_us}`, stateClass(l.open_to_us)), tag(`funder open: ${l.funder_open}`, stateClass(l.funder_open)), tag(`IRS letter: ${l.letter}`)),
    el('div', { class: 'd-section' }, el('p', { class: 'eyebrow', text: 'In the research’s own words' }),
      el('dl', { class: 'gr-fields' }, FIELDS.filter(([f]) => l.cells[f]).map(([f, label]) => [el('dt', { text: label }), el('dd', {}, inline(l.cells[f], ctx))]))),
    datesOf(l).length ? el('div', { class: 'd-section' }, el('p', { class: 'eyebrow', text: 'Dates read from that wording' }), el('ul', { class: 'gr-plain' }, datesOf(l).map((d) => el('li', { class: d.date < TODAY ? 'past' : '' }, dateWords(d), d.date < TODAY ? ' (passed)' : '')))) : null,
    tracked.length ? el('div', { class: 'd-section' }, el('p', { class: 'eyebrow', text: 'Your lead tracker (TODO.md)' }), tracked.map((t) => el('p', {}, el('strong', { text: t.status || 'no status' }), t.notes ? ' — ' : '', inline(t.notes, ctx), t.updated ? ` (${t.updated})` : ''))) : null,
    el('div', { class: 'd-actions' }, link ? el('a', { class: 'd-link', href: link, target: '_blank', rel: 'noopener noreferrer' }, 'Funder’s page ↗') : null,
      el('button', { type: 'button', class: 'inline-link', onclick: () => { closeLead(); openDoc(l.file, '', l.line); } }, `Read it in ${docLabel(l.file)} (line ${l.line + 1}) →`)),
    siblings.length > 1 ? el('div', { class: 'd-section' }, el('p', { class: 'eyebrow', text: `Every row about ${orgName(l)} (${siblings.length})` }),
      disagree.length ? el('p', { class: 'gr-warn' }, `The rows disagree on ${disagree.map((f) => f.replace(/_/g, ' ')).join(' and ')} — read each one; the newest research is usually right.`) : null,
      el('ul', { class: 'gr-plain' }, siblings.map((o) => el('li', {}, o === l ? el('strong', { text: o.name }) : el('button', { type: 'button', class: 'inline-link', onclick: () => openLead(o) }, o.name), ` — ${docLabel(o.file)}; open to us: ${o.open_to_us}; funder open: ${o.funder_open}`)))) : null].filter(Boolean));
  $('detail').hidden = false;
  $('detail-close').focus();
}
function closeLead() { $('detail').hidden = true; }
$('detail-close').onclick = closeLead;
$('detail').addEventListener('click', (e) => { if (e.target === $('detail')) closeLead(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('detail').hidden) closeLead(); });

// ---- timeline ------------------------------------------------------------
function timeline() {
  const months = new Map();
  for (const item of datedItems()) {
    if (!S.showPast && item.date.slice(0, 7) < TODAY.slice(0, 7)) continue;
    const key = item.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key).push(item);
  }
  return [
    el('div', { class: 'gr-note' }, el('p', { class: 'quiet', text: 'Dated to-dos from TODO.md beside every date the funder rows mention. A funder date sits in the month its wording points to — “spring 2027” sits in March — so read the words, not the month.' }),
      el('label', { class: 'gr-check' }, el('input', { type: 'checkbox', checked: S.showPast, onchange: (e) => { S.showPast = e.target.checked; setView('timeline'); } }), ' Show months already past')),
    [...months.entries()].map(([key, items]) => el('section', { class: 'gr-month' }, el('h3', { text: `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}` }), el('ul', { class: 'gr-datedlist' }, items.map(datedRow)))),
  ];
}

// ---- universities, listings ----------------------------------------------
function universities() {
  const doc = S.docById[S.data.ids.universities];
  if (!doc || doc.error) return el('p', { class: 'gr-warn', text: doc?.error ?? 'University partners file not found.' });
  return [el('p', { class: 'quiet' }, 'The ten colleges, universities and seminaries ranked as partners who could apply for grants with the Bible Project, from ', el('button', { type: 'button', class: 'inline-link', onclick: () => openDoc(doc.id) }, doc.name), '.'),
    S.data.universities.map((u) => el('details', { class: 'gr-uni', open: u.rank === 1 }, el('summary', {}, el('span', { class: 'gr-rank', text: u.rank ?? '–' }), el('span', {}, el('strong', { text: u.title }), el('small', { text: u.place }))),
      el('div', { class: 'gr-doc' }, blocks(doc.blocks.slice(u.first_block, u.last_block), ctxFor(doc.id)))))];
}
function listings() {
  const doc = S.docById[S.data.ids.listings];
  if (!doc || doc.error) return el('p', { class: 'gr-warn', text: doc?.error ?? 'Donor listings file not found.' });
  const host = el('div');
  const filter = (q) => host.querySelectorAll('tbody tr').forEach((tr) => { tr.hidden = !!q && !tr.textContent.toLowerCase().includes(q); });
  host.append(...S.data.listings.map((t) => el('section', { class: 'gr-card' }, el('p', { class: 'eyebrow', text: plain(t.group) }), t.subgroup ? el('h3', { class: 'gr-sub', text: plain(t.subgroup) }) : null, block(doc.blocks[t.block], ctxFor(doc.id)))));
  return [el('div', { class: 'qx-toolbar' }, el('label', { class: 'qx-search' }, el('span', { class: 'sr', text: 'Search the listings' }), el('input', { type: 'search', placeholder: 'Search the listings…', oninput: (e) => filter(e.target.value.trim().toLowerCase()) })),
    el('button', { type: 'button', class: 'qx-ghost', onclick: () => openDoc(doc.id) }, `Read ${doc.name} →`)), host];
}

// ---- to-do and readiness -------------------------------------------------
function todo() {
  const d = S.data, ctx = ctxFor(d.ids.todo);
  const soon = (iso) => (iso < TODAY ? 'hidden' : (new Date(iso) - new Date(TODAY)) / 864e5 <= 14 ? 'fix' : '');
  const readiness = S.docById[d.ids.readiness];
  return [
    d.todo.sections.map((s) => section(plain(s.heading) || 'To-do', el('ul', { class: 'gr-list' }, s.items.map((i) => el('li', { class: 'task' + (i.checked ? ' done' : '') },
      el('span', { class: 'gr-box' + (i.checked ? ' done' : ''), text: i.checked ? '✓' : '' }), inline(i.text.replace(/\s*[📅⏳✅]\s*\d{4}-\d\d-\d\d/gu, ''), ctx),
      i.due ? tag(`due ${isoWords(i.due)}`, i.checked ? '' : soon(i.due)) : null, i.scheduled ? tag(`around ${isoWords(i.scheduled)}`) : null))))),
    section('Formation filing steps (FILING_CHECKLIST.md)', d.formation.steps.map((s) => el('button', { type: 'button', class: 'gr-step', onclick: () => openDoc(d.ids.filing, '', s.line) },
      el('span', { text: plain(s.heading) }), el('span', { class: 'gr-bar-track' }, el('i', { style: `width:${(100 * s.done) / s.total}%` })), el('b', { text: `${s.done} / ${s.total}` })))),
    readiness && !readiness.error ? section('Readiness checklist — what funders ask for, and whether it is in hand', d.formation.readiness.map((t) => [el('p', { class: 'quiet', text: `${t.have} of ${t.rows} in hand` }), block(readiness.blocks[t.block], ctxFor(readiness.id))])) : null,
    section('Your lead tracker (TODO.md)', d.tracker.length ? el('ul', { class: 'gr-plain' }, d.tracker.map((t) => el('li', {}, el('strong', { text: t.name }), ` — ${t.status || 'no status'}`, t.notes ? ' — ' : '', inline(t.notes, ctx)))) : el('p', { class: 'quiet', text: 'No status or note has been recorded yet. The Grants Dashboard on this PC writes them into TODO.md, and they will show here and on each funder.' })),
  ];
}

// ---- documents -----------------------------------------------------------
function openDoc(id, anchor = '', line = null) {
  S.doc = id;
  if (S.view !== 'documents') setView('documents'); else $('view').replaceChildren(documents());
  requestAnimationFrame(() => {
    const body = document.querySelector('.gr-docbody');
    if (!body) return;
    let target = anchor ? body.querySelector(`[data-anchor="${CSS.escape(anchor.toLowerCase())}"]`) ?? [...body.querySelectorAll('[data-anchor]')].find((n) => n.dataset.anchor.replace(/[^0-9a-z]/g, '') === anchor.toLowerCase().replace(/[^0-9a-z]/g, '')) : null;
    if (!target && line !== null) target = [...body.querySelectorAll('[data-line]')].filter((n) => Number(n.dataset.line) <= line).pop();
    if (target) { target.scrollIntoView({ block: 'center' }); target.classList.add('gr-hit'); setTimeout(() => target.classList.remove('gr-hit'), 2600); }
  });
}
function documents() {
  const doc = S.docById[S.doc] ?? S.docs[0];
  const groups = [...new Set(S.docs.map((d) => d.group))];
  const nav = el('nav', { class: 'gr-docnav', 'aria-label': 'Research documents' }, groups.map((g) => [el('p', { class: 'eyebrow', text: g }), S.docs.filter((d) => d.group === g).map((d) => el('button', { type: 'button', class: 'gr-docbtn', 'aria-current': d === doc ? 'page' : null, onclick: () => openDoc(d.id) }, el('span', { text: d.label }), el('small', { text: d.error ? '⚠ ' + d.error : d.name })))]),
    el('details', { class: 'gr-other' }, el('summary', {}, `Tables not in the funder list (${S.data.unclassified.length})`), S.data.unclassified.map((t) => el('button', { type: 'button', class: 'gr-docbtn', onclick: () => openDoc(t.file, '', t.line) }, el('span', { text: plain(t.section) || '(top of file)' }), el('small', { text: docLabel(t.file) })))));
  const toc = doc.blocks.filter((b) => b.type === 'heading' && b.level >= 2 && b.level <= 3).map((b) => el('button', { type: 'button', class: 'gr-toc' + (b.level === 3 ? ' sub' : ''), onclick: () => openDoc(doc.id, b.anchor) }, plain(b.text)));
  return el('div', { class: 'gr-docs' }, nav, el('article', { class: 'gr-card gr-docbody' },
    el('p', { class: 'eyebrow', text: `${doc.group} · ${doc.relative}${doc.modified ? ' · file saved ' + doc.modified.slice(0, 10) : ''}` }),
    doc.error ? el('p', { class: 'gr-warn', text: doc.error }) : null, toc.length > 2 ? el('details', { class: 'gr-tocbox' }, el('summary', {}, 'Contents'), toc) : null,
    el('div', { class: 'gr-doc' }, blocks(doc.blocks, ctxFor(doc.id)))));
}

// ---- load ----------------------------------------------------------------
async function load() {
  try {
    const response = await fetch('/data_grants/api/research.json', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw Error(body.error ?? `HTTP ${response.status}`);
    S.data = body.research;
    S.docs = S.data.documents;
    S.docById = Object.fromEntries(S.docs.map((d) => [d.id, d]));
    S.orgs = S.data.organisations;
    if (body.stale) { $('stale').hidden = false; $('stale').textContent = body.error ? `This is the last good reading of the research; a file has changed since and could not be read again: ${body.error} Reload in a minute.` : 'A research file changed while this was being read; reload to see the newest.'; }
    $('built').textContent = `Read ${S.data.generated.replace('T', ' ').slice(0, 16)} UTC.`;
    $('load-state').hidden = true;
    $('app').hidden = false;
    setView(location.hash.slice(1));
  } catch (error) {
    $('load-state').textContent = `The grant research could not be read: ${error.message}`;
  }
}
window.addEventListener('hashchange', () => { if (S.data && location.hash.slice(1) !== S.view) setView(location.hash.slice(1)); });
load();
