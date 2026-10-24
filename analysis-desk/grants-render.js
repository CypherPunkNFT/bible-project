// Grant research page: markdown blocks -> DOM. Built only with createElement/textContent — never as HTML text —
// so nothing in a research file can run script here. Only http, https and mailto links become real links; a link
// to another research file opens it on this page; anything else is shown as plain text.
'use strict';

const GR = (() => {
  const SAFE = new Set(['http:', 'https:', 'mailto:']);
  const BASE = 'http://relative.invalid/';
  const INLINE = /(`+)([\s\S]*?)\1|\[((?:[^[\]]|\[[^\]]*\])*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)|\*\*([\s\S]+?)\*\*|__([\s\S]+?)__|~~([\s\S]+?)~~|\*(?=\S)([^*]+?)\*|(?<![A-Za-z0-9])_(?=\S)([^_]+?)_(?![A-Za-z0-9])|\\([\\`*_{}[\]()#+\-.!|~<>])|<((?:https?:\/\/|mailto:)[^>\s]+)>/g;

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      if (value === undefined || value === null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat(Infinity)) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  /** A safe outward link, or null. */
  function safeUrl(href) {
    try { const url = new URL(href); return SAFE.has(url.protocol) ? url.href : null; } catch { return null; }
  }

  /** A link written in research file `from` (its relative path) -> {doc, anchor} of a document on this page. */
  function resolveDoc(href, from, docs) {
    const [pathPart, anchor = ''] = href.split('#');
    let target = '';
    try { target = decodeURIComponent(pathPart).replace(/\\/g, '/'); } catch { return null; }
    if (/^Jarvis\/Projects\//i.test(target)) target = target.slice('Jarvis/Projects/'.length);
    else if (target) target = decodeURIComponent(new URL(target, BASE + from).pathname).replace(/^\//, '');
    else target = from;
    const doc = docs.find((d) => d.relative.toLowerCase() === target.toLowerCase());
    return doc ? { doc: doc.id, anchor } : null;
  }

  function link(href, kids, ctx) {
    const external = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//') ? safeUrl(href) : null;
    if (external) return el('a', { href: external, target: '_blank', rel: 'noopener noreferrer', class: 'gr-out' }, kids);
    if (!/^[a-z][a-z0-9+.-]*:/i.test(href) && !href.startsWith('//') && ctx.docs && ctx.openDoc) {
      const target = resolveDoc(href, ctx.relative || '', ctx.docs);
      if (target) return el('a', { href: '#', class: 'gr-doclink', onclick: (event) => { event.preventDefault(); ctx.openDoc(target.doc, target.anchor); } }, kids);
    }
    return el('span', { class: 'gr-deadlink', title: href }, kids);
  }

  function inline(text, ctx = {}) {
    const frag = document.createDocumentFragment();
    const source = String(text ?? '');
    const pattern = new RegExp(INLINE.source, 'g');
    let last = 0, m;
    while ((m = pattern.exec(source)) !== null) {
      if (m.index > last) frag.append(source.slice(last, m.index));
      last = pattern.lastIndex;
      if (m[1]) frag.append(el('code', { text: m[2] }));
      else if (m[4] !== undefined && m[0].startsWith('[')) frag.append(link(m[4], inline(m[3], ctx), ctx));
      else if (m[5] !== undefined || m[6] !== undefined) frag.append(el('strong', {}, inline(m[5] ?? m[6], ctx)));
      else if (m[7] !== undefined) frag.append(el('del', {}, inline(m[7], ctx)));
      else if (m[8] !== undefined || m[9] !== undefined) frag.append(el('em', {}, inline(m[8] ?? m[9], ctx)));
      else if (m[10] !== undefined) frag.append(m[10]);
      else if (m[11] !== undefined) frag.append(link(m[11], m[11], ctx));
      if (m[0].length === 0) pattern.lastIndex++;
    }
    if (last < source.length) frag.append(source.slice(last));
    return frag;
  }

  function plain(text) {
    return String(text ?? '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/(\*\*|__|~~|`)/g, '').replace(/\\\|/g, '|').trim();
  }

  function table(block, ctx) {
    const width = Math.max(block.header.length, ...block.rows.map((row) => row.cells.length));
    const head = el('tr', {}, block.header.map((cell) => el('th', {}, inline(cell, ctx))));
    const rows = block.rows.map((row) => el('tr', { 'data-line': row.line },
      Array.from({ length: width }, (_, col) => el('td', {}, inline(row.cells[col] ?? '', ctx)))));
    return el('div', { class: 'gr-tablewrap' }, el('table', { class: 'gr-md' }, el('thead', {}, head), el('tbody', {}, rows)));
  }

  function list(block, ctx) {
    const root = el('ul', { class: 'gr-list' });
    const stack = [{ indent: -1, node: root }];
    for (const item of block.items) {
      while (stack.length > 1 && item.indent <= stack[stack.length - 1].indent) stack.pop();
      const parent = stack[stack.length - 1];
      const host = parent.node.tagName === 'LI' ? (parent.node.querySelector(':scope > ul') || parent.node.appendChild(el('ul', { class: 'gr-list' }))) : parent.node;
      const box = item.checked === null || item.checked === undefined ? null : el('span', { class: 'gr-box' + (item.checked ? ' done' : ''), 'aria-label': item.checked ? 'done' : 'not done' }, item.checked ? '✓' : '');
      const li = el('li', { class: box ? 'task' : '' }, box, inline(item.text, ctx));
      host.append(li);
      stack.push({ indent: item.indent, node: li });
    }
    return root;
  }

  /** One block -> node. `ctx`: {docs, relative, openDoc}. Headings carry their anchor in data-anchor only. */
  function block(b, ctx) {
    switch (b.type) {
      case 'heading': return el('h' + Math.min(6, b.level + 1), { class: 'gr-h', 'data-anchor': b.anchor, 'data-line': b.line }, inline(b.text, ctx));
      case 'paragraph': return el('p', { 'data-line': b.line }, inline(b.text.replace(/\s*\n\s*/g, ' '), ctx));
      case 'quote': return el('blockquote', { 'data-line': b.line }, inline(b.text.replace(/^\s*>\s?/gm, '').replace(/\s*\n\s*/g, ' '), ctx));
      case 'code': return el('pre', { 'data-line': b.line }, el('code', { text: b.text }));
      case 'list': { const node = list(b, ctx); node.dataset.line = b.line; return node; }
      case 'table': { const node = table(b, ctx); node.dataset.line = b.line; return node; }
      case 'rule': return el('hr');
      default: return el('p', { class: 'quiet', text: `(${b.type})` });
    }
  }

  function blocks(list, ctx) { return list.map((b) => block(b, ctx)); }

  return { el, inline, plain, blocks, block, table, safeUrl, resolveDoc };
})();
