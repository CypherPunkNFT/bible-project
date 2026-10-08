// Shared content blocks every direction uses: section heads, the passages' surrounding verses, context, the
// questions with their views, the tradition, what the text does not say, and the sources.
(() => {
  window.secHead = (ic, kicker, title, sub = "", cls = "") => `<header class="sec-head ${cls}"><span class="badge">${icon(ic, 30, 1.5)}</span>
    <div><span class="kicker">${esc(kicker)}</span><h2>${esc(title)}</h2>${sub ? `<p>${sub}</p>` : ""}</div></header>`;

  window.topline = () => `<div class="topline"><a href="/study/people">${icon("arrowLeft", 15)}Back to People &amp; genealogies</a><span class="addr">${esc(M.person.address)} · the unseen</span></div>`;

  // The passage's own verses (key verses marked), then the verses around it, opening in place.
  window.passageBody = (p) => `${passageText(p.key)}
    ${expander(null, `<div class="around">${passageText(p.around, "")}</div><a class="read" href="${refHref(p.key[0].ref)}">${icon("open", 14)}Read ${esc(chapterName(p.key[0].ref))}</a>`, { closed: "The verses around it", opened: "Hide the verses around it" })}`;
  window.chapterName = ([b, c]) => (M.bookBy[b].ch === 1 ? M.bookBy[b].name : `${M.bookBy[b].name} ${c}`);
  window.passageSays = (p) => p.says.map((c) => claim(c)).join("");

  // Context: the setting the five passages need.
  window.contextCards = (cls = "") => M.context.map((c) => `<article class="ctx ${cls}" data-id="${c.id}">
      <header><span class="badge badge-sm">${icon(c.icon, 26, 1.5)}</span><div><h3>${esc(c.title)}</h3><p>${esc(c.lead)}</p></div></header>
      <div class="ctx-claims">${c.claims.map((x) => claim(x)).join("")}</div>
      ${expander(null, c.verses.map((v) => kjv(v, "kjv-sm")).join(""), { closed: "The verses", opened: "Hide the verses" })}</article>`).join("");

  // One holder of a view: who, when, their words, and where to read it.
  window.holder = (h) => `<figure class="holder"><blockquote>${esc(h.quote)}</blockquote>
    <figcaption><b>${esc(h.who)}</b><span>${esc(h.when)}</span>${citeLink(h.cite, M.citeBy[h.cite].title.split(",")[0].split(" (")[0])}</figcaption>${h.note ? `<small>${esc(h.note)}</small>` : ""}</figure>`;
  window.viewsGrid = (q) => `<div class="views">${q.views.map((v, i) => `<section class="view" data-side="${i}"><h4><i>${"AB"[i]}</i>${esc(v.view)}</h4>${v.holders.map(holder).join("")}</section>`).join("")}</div>`;
  window.questionBody = (q) => `<div class="q-text"><span class="layer" data-layer="scripture">What the text says</span><p>${esc(q.text)}</p></div>
    ${viewsGrid(q)}<p class="q-order">${icon("help", 14)}${esc(q.order)} A view is shown with the people who hold it; the site does not decide between them.</p>`;
  window.questionRows = (ids, cls = "") => (ids ? ids.map((id) => M.questions.find((q) => q.id === id)) : M.questions).map((q, i) =>
    expander(`<button type="button" class="xp-head" data-xp aria-expanded="${i === 0}">${icon("help", 20)}<span>${esc(q.q)}</span><em>${q.views.length} views</em>${icon("chevronDown", 18)}</button>`, questionBody(q), { cls: `xp-row ${cls}`, open: i === 0 })).join("");

  // Tradition: each item with its date, its kind and its source.
  const STRATUM = { jewish: "Jewish writing outside the Bible", church: "Early church writer", later: "Later tradition" };
  window.STRATUM = STRATUM;
  window.tradCard = (t, cls = "") => `<article class="trad ${cls}" data-stratum="${t.stratum}">
      <header><span class="trad-when">${esc(t.when)}</span>${chip(t.layer, STRATUM[t.stratum])}</header>
      <h4>${esc(t.title)}</h4><p>${esc(t.text)}</p>${t.quote ? `<blockquote>${esc(t.quote)}</blockquote>` : ""}
      <footer>${t.refs ? `<span class="refs">${refList(t.refs)}</span>` : ""}${cites(t.cites)}</footer></article>`;
  window.tradRule = () => `<p class="rule">${icon("shield", 16)}Jewish writings outside the Bible and later traditions are shown with their dates and sources. They are never used as evidence for what Scripture says.</p>`;

  window.notSaidList = () => `<ul class="notsaid">${M.notSaid.map((n) => `<li>${icon("x", 15)}<span>${esc(n.text)}${n.refs.length ? ` <span class="refs">${refList(n.refs)}</span>` : ""}</span></li>`).join("")}</ul>`;
  window.fromTextList = () => M.fromText.map((c) => claim(c)).join("");

  // The sources, grouped by kind, with what each was used for.
  const GROUPS = [
    ["Lexicons and dictionaries", ["bdb", "strong", "thayer", "easton", "fausset", "hitchcock"]],
    ["Commentators", ["calvin-jude", "calvin-dan", "hengstenberg", "keil-dan"]],
    ["Jewish writings outside the Bible (editions)", ["charles-enoch", "charles-asm"]],
    ["Early church writers", ["clement", "origen"]],
    ["Later tradition (reference works)", ["dionysius", "holweck", "je"]],
  ];
  window.sourcesBlock = (cls = "") => `<div class="sources ${cls}">
    <div class="src-group"><h4>${icon("book", 15)}Scripture</h4><p class="src-note">Every quotation is the King James Version as the site holds it (<span class="mono">data/text/kjv</span>), word for word.</p></div>
    ${GROUPS.map(([title, ids]) => `<div class="src-group"><h4>${icon("library", 15)}${esc(title)}</h4><ul>${ids.map((id) => { const c = M.citeBy[id]; return `<li><a href="${esc(c.url)}" target="_blank" rel="noreferrer"><b>${esc(c.author)}</b>, <i>${esc(c.title)}</i> (${esc(c.year)})</a><small>${esc(c.where)}</small></li>`; }).join("")}</ul></div>`).join("")}
    <div class="src-group"><h4>${icon("shield", 15)}Not used</h4><p class="src-note">The person record's AI-written description, Wikipedia, and any work after 1930 except for plain facts. Milton and Dante are never sources.</p></div>
  </div>`;

  window.heroFacts = () => `<dl class="facts">
    <div><dt>Named in</dt><dd><b>5</b> verses</dd></div><div><dt>Books</dt><dd>Daniel · Jude · Revelation</dd></div>
    <div><dt>Titles</dt><dd>chief prince · your prince · the archangel</dd></div><div><dt>Name</dt><dd>“Who is like God?” <small>Brown, Driver, Briggs 1906</small></dd></div></dl>`;
})();
