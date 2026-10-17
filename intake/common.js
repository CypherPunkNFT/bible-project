// Shared by the cards page and the intake page: sizes, type colours, the type bar, the theme switch.
const $ = (id) => document.getElementById(id);
const TYPE_ORDER = ['Output', 'Text', 'PDF', 'Image', 'Audio', 'Data', 'Archive', 'Code', 'Other'];
const typeColour = (t) => `var(--t-${t.toLowerCase()})`;
function size(n) {
  if (n == null) return '—';
  if (n < 1e3) return `${n} B`;
  if (n < 1e6) return `${(n / 1e3).toFixed(0)} KB`;
  if (n < 1e9) return `${(n / 1e6).toFixed(n < 1e7 ? 1 : 0)} MB`;
  return `${(n / 1e9).toFixed(n < 1e10 ? 2 : 1)} GB`;
}
const count = (n) => n.toLocaleString();
function node(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
/** A bar split by bytes per file type, with an optional legend. by_type: {Type: [files, bytes]} */
function typeBar(byType, withLegend) {
  const total = Object.values(byType).reduce((s, [, b]) => s + b, 0) || 1;
  const bar = node('div', null, 'typebar');
  const legend = node('div', null, 'legend');
  for (const t of TYPE_ORDER) {
    if (!byType[t]) continue;
    const [files, bytes] = byType[t];
    const seg = node('i');
    seg.style.width = `${(bytes / total) * 100}%`;
    seg.style.background = typeColour(t);
    seg.title = `${t}: ${count(files)} files · ${size(bytes)}`;
    bar.append(seg);
    const item = node('span');
    const dot = node('b');
    dot.style.background = typeColour(t);
    item.append(dot, `${t} ${count(files)}`);
    legend.append(item);
  }
  const wrap = node('div');
  wrap.append(bar);
  if (withLegend) { legend.style.marginTop = '8px'; wrap.append(legend); }
  return wrap;
}
function stat(value, label) {
  const s = node('div', null, 'stat');
  s.append(node('strong', value), node('small', label));
  return s;
}
try { document.body.classList.toggle('dark', localStorage.getItem('acquisition-theme') === 'dark'); } catch {}
$('theme').onclick = () => {
  document.body.classList.toggle('dark');
  try { localStorage.setItem('acquisition-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); } catch {}
};
