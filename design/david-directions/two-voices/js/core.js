// Shared helpers: the data (data/david.json), verse references, evidence labels, claims, KJV quotes and echo words.
(() => {
  window.esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  window.D = null;
  window.loadDavid = async () => {
    const res = await fetch("data/david.json");
    if (!res.ok) throw new Error(`david.json: expected 200, got ${res.status}`);
    D = await res.json();
    D.momentById = Object.fromEntries(D.movements.flatMap((m) => m.moments.map((x) => [x.id, { ...x, movement: m.id }])));
    return D;
  };

  // 10015014 -> { book: 10, ch: 15, v: 14 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  window.refParts = parts;
  const short = { "1 Samuel": "1 Sam", "2 Samuel": "2 Sam", "1 Kings": "1 Kgs", "2 Kings": "2 Kgs", "1 Chronicles": "1 Chr", "2 Chronicles": "2 Chr", Psalms: "Ps", Ruth: "Ruth", Acts: "Acts" };
  const bookName = (n, abbr) => { const name = D.books[n]?.name ?? "?"; return abbr ? (short[name] ?? name) : name === "Psalms" ? "Psalm" : name; };
  window.refText = ([a, b = a], abbr = false) => {
    const x = parts(a), y = parts(b), name = bookName(x.book, abbr);
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${bookName(y.book, abbr)} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  window.refHref = ([a]) => { const x = parts(a); return `/read/kjv/${D.books[x.book]?.code}/${x.ch}?v=${x.v}`; };
  window.refLink = (r, abbr = false) => `<a class="ref" href="${refHref(r)}">${esc(refText(r, abbr))}</a>`;
  window.refList = (refs = [], abbr = false) => refs.map((r) => refLink(r, abbr)).join('<span class="ref-sep">·</span>');
  // The books a claim's verses come from, as short tags: "2 SAMUEL", "1 CHRONICLES".
  window.bookTags = (refs = []) => [...new Set(refs.map((r) => parts(r[0]).book))].map((b) => `<span class="btag" data-book="${b}">${esc(bookName(b))}</span>`).join("");

  const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", scholars: "Scholars' view", title: "From the psalm's title", story: "Written by this site from Scripture" };
  window.chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  const citation = (id) => D.citations.find((x) => x.id === id);
  window.citeShort = (id) => { const c = citation(id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  window.cites = (ids = []) => ids.map((id) => `<a class="cite" href="${esc(citation(id)?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`).join('<span class="ref-sep">·</span>');

  // A claim: its words, then its evidence label and verses (or citations). A claim with no layer is the site's own story.
  window.claim = (c, cls = "") => {
    if (!c) return "";
    return `<div class="claim ${cls}"><p>${esc(c.text)}</p>
      <footer>${chip(c.layer ?? "story")}<span class="refs">${refList(c.refs ?? [], true)}${c.refs?.length && c.cites ? '<span class="ref-sep">·</span>' : ""}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A KJV verse ({ ref, text }), optionally with echo words lit.
  window.kjvLine = (v, echo, cls = "") => v ? `<blockquote class="kjv ${cls}"><p>${echoMark(v.text, echo)}</p><footer><a class="ref" href="${refHref(v.ref)}">${esc(refText(v.ref))}</a> · KJV</footer></blockquote>` : "";

  // Echo words: any word whose first five letters are in the set is wrapped so it can glow when the string sounds.
  window.echoMark = (text, echo) => {
    const safe = esc(text);
    if (!echo || !echo.size) return safe;
    return safe.replace(/[A-Za-z][A-Za-z’'-]*/g, (w) => {
      const stem = w.toLowerCase().replace(/[’']s$/, "").replace(/[^a-z]/g, "").slice(0, 5);
      return stem.length > 2 && echo.has(stem) ? `<mark class="echo">${w}</mark>` : w;
    });
  };

  window.KIND = {
    anointing: ["horn", "Anointing"], personal: ["person", "His life"], battle: ["swords", "Battle"], alliance: ["handshake", "Alliance or tribute"],
    worship: ["lyre", "Worship"], prophecy: ["message", "A prophet's word"], building: ["temple", "Building"], other: ["dots", "Other"],
  };
  window.clamp01 = (t) => Math.max(0, Math.min(1, t));
  window.span = (p, a, b) => clamp01((p - a) / (b - a));
  window.easeOut = (t) => 1 - Math.pow(1 - t, 3);
  window.easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
})();
