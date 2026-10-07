// Paul's three sections and their four parts each, for layouts 2 and 3: every chart is drawn from paul-data.js.
// Clicking keeps an item and shows its details; ✕ lets it go.
const keep = { life: null, companion: null, step: null, part: null, word: null, person: null, question: 0, witness: null };
ACTIONS.keep = (arg) => { const [what, value] = arg.split(":"); keep[what] = value === "" ? null : isNaN(value) ? value : Number(value); };
const keepX = (what) => `<button type="button" class="keep-x" data-act="keep" data-arg="${what}:" aria-label="Let go">✕</button>`;
const refsLine = (list, limit = 8) => list?.length ? `<span class="refs">${list.slice(0, limit).map((r) => `<a href="/read">${r}</a>`).join("")}${list.length > limit ? `<span>+${list.length - limit} more</span>` : ""}</span>` : "";

// ── Paul's life and letters: his life above the years, his letters below ─────────────────
const LIFE_TONES = { life: "ink", journey: "prophets", prison: "revelation", letter: "epistles" };
function lifeBody() {
  const ev = P.life.events, lo = 30, hi = 68, W = 1000, PAD = 30, ROW = 21;
  const x = (y) => PAD + ((y - lo) / (hi - lo)) * (W - 2 * PAD);
  const pack = (list) => { const ends = []; return list.map((e) => { const x0 = x(e.from), x1 = Math.max(x(e.to ?? e.from), x0 + 8); let r = ends.findIndex((end) => end + 4 < x0); if (r < 0) { r = ends.length; ends.push(x1); } else ends[r] = x1; return r; }); };
  const life = ev.filter((e) => e.kind !== "letter"), letters = ev.filter((e) => e.kind === "letter");
  const lifeRows = pack(life), letterRows = pack(letters), lifeH = (Math.max(...lifeRows) + 1) * ROW, top = 40, mid = top + lifeH + 26;
  const height = mid + 22 + (Math.max(...letterRows) + 1) * ROW + 10;
  const bar = (e, y) => { const i = ev.indexOf(e), x0 = x(e.from), x1 = Math.max(x(e.to ?? e.from), x0 + 8), on = keep.life === i;
    return `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="13" rx="6.5" fill="var(--${LIFE_TONES[e.kind]})" opacity="${keep.life === null ? (e.kind === "life" ? .45 : .8) : on ? 1 : .2}"
      style="cursor:pointer" data-act="keep" data-arg="life:${i}"><title>${e.label}</title></rect>`; };
  const ticks = []; for (let t = lo; t <= hi; t += 5) ticks.push(t);
  const k = keep.life !== null ? ev[keep.life] : null;
  return `<div class="panel">
    <div class="legend">${[["life", "His life"], ["journey", "Journeys"], ["prison", "Imprisonments"], ["letter", "Letters"]].map(([kind, name]) => `<span><i style="background: var(--${LIFE_TONES[kind]})"></i>${name}</span>`).join("")}</div>
    <svg class="chart" viewBox="0 0 ${W} ${height}" role="img" aria-label="Paul's life and letters, AD 30 to 68">
      ${ticks.map((t) => `<path d="M${x(t)} 24V${height - 6}" stroke="var(--line)" stroke-dasharray="2 4"/><text x="${x(t)}" y="16" text-anchor="middle" style="font: 11px var(--sans); fill: var(--muted)">AD ${t}</text>`).join("")}
      ${life.map((e, i) => bar(e, top + lifeRows[i] * ROW)).join("")}
      <text x="${PAD}" y="${mid - 6}" style="font: 600 11px var(--sans); letter-spacing: .14em; fill: var(--epistles)">HIS LETTERS</text>
      ${letters.map((e, i) => { const y = mid + 4 + letterRows[i] * ROW; return `${bar(e, y)}<text x="${Math.max(x(e.to ?? e.from), x(e.from) + 8) + 6}" y="${y + 10.5}" style="font: 600 11px var(--sans); fill: var(--ink)">${e.label}</text>`; }).join("")}
    </svg>
    <p class="tip">${k ? `<b style="color:var(--ink)">${k.label}</b>${keepX("life")} · AD ${k.from}${k.to && k.to !== k.from ? `–${k.to}` : ""}${refsLine(k.refs)}` : "Each bar spans the years the sources give. Click a bar to see its verses."}</p>
    <p class="caption">${P.life.claim}</p></div>`;
}

// ── A network around one person (companions, Romans 16) ──────────────────────────────────
const GROUP_TONES = { author: "epistles", companion: "poetry", greeted: "prophets", sender: "acts", church: "history", household: "gospels", bridge: "revelation" };
function networkBody(net, what, centre = "paul") {
  const W = 1000, H = net.nodes.length > 20 ? 560 : 440, cx = W / 2, cy = H / 2;
  const others = net.nodes.filter((n) => n.id !== centre), two = others.length > 20;
  const at = new Map([[centre, [cx, cy]]]);
  others.forEach((n, i) => { const ring = two ? i % 2 : 0, a = (i / others.length) * Math.PI * 2 - Math.PI / 2, r = two ? [165, 245][ring] : 170;
    at.set(n.id, [cx + Math.cos(a) * r * 1.75, cy + Math.sin(a) * r]); });
  const kept = keep[what], linked = new Set(kept ? net.edges.flatMap((e) => (e.from === kept || e.to === kept ? [e.from, e.to] : [])) : []);
  const node = kept ? net.nodes.find((n) => n.id === kept) : null, edges = kept ? net.edges.filter((e) => e.from === kept || e.to === kept) : [];
  const groups = [...new Set(net.nodes.map((n) => n.group))];
  return `<div class="panel">
    <div class="legend">${groups.map((g) => `<span><i style="background: var(--${GROUP_TONES[g] ?? "muted"})"></i>${{ author: "Paul", companion: "Companions", greeted: "Greeted", sender: "Sending greetings", church: "Churches", household: "Households", bridge: "Carrier of the letter" }[g] ?? g}</span>`).join("")}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${net.title}">
      ${net.edges.map((e) => { const a = at.get(e.from), b = at.get(e.to); if (!a || !b) return ""; const on = !kept || e.from === kept || e.to === kept;
        return `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="var(--epistles)" stroke-width="${on && kept ? 1.6 : 1}" opacity="${on ? (kept ? .8 : .3) : .05}"/>`; }).join("")}
      ${net.nodes.map((n) => { const [x, y] = at.get(n.id), isC = n.id === centre, dim = kept && kept !== n.id && !linked.has(n.id), left = x < cx - 40;
        return `<g opacity="${dim ? .25 : 1}" style="cursor:pointer" data-act="keep" data-arg="${what}:${n.id}">
          <circle cx="${x}" cy="${y}" r="${isC ? 15 : 6.5}" fill="var(--${GROUP_TONES[n.group] ?? "muted"})" stroke="var(--surface)" stroke-width="1.5"/>
          <text x="${isC ? x : left ? x - 11 : x + 11}" y="${isC ? y + 32 : y + 4}" text-anchor="${isC ? "middle" : left ? "end" : "start"}" style="font: ${isC || kept === n.id ? "600 13px" : "12px"} var(--sans); fill: ${kept === n.id || isC ? "var(--ink)" : "var(--muted)"}">${n.label}</text></g>`; }).join("")}
    </svg>
    <p class="tip">${node ? `<b style="color:var(--ink)">${node.label}</b>${keepX(what)}${node.note ? ` · ${node.note}` : ""}${edges.filter((e) => e.label).slice(0, 3).map((e) => ` · “${e.label}”`).join("")}${refsLine(node.refs)}`
      : "Click a name to see who they were, how the letter links them, and where Scripture names them."}</p>
    <p class="caption">${net.claim}</p></div>`;
}

// ── The story of Onesimus, step by step ─────────────────────────────────────────────────
function onesimusBody() {
  const steps = P.onesimus.events, k = keep.step !== null ? steps[keep.step] : null;
  return `<div class="panel"><ol class="steps">${steps.map((e, i) => `<li><button type="button" data-act="keep" data-arg="step:${i}" aria-pressed="${keep.step === i}"><span>${i + 1}</span>${e.label}</button></li>`).join("")}</ol>
    <p class="tip">${k ? `<b style="color:var(--ink)">Step ${keep.step + 1}</b>${keepX("step")}${refsLine(k.refs)}` : "Click a step to read its verses."}</p>
    <p class="caption">${P.onesimus.claim}</p></div>`;
}

// ── Inside the chosen letter: its shape, its words, its Old Testament ────────────────────
const KIND_TONES = { teaching: "prophets", practice: "poetry", personal: "acts", praise: "epistles", defence: "history", appeal: "acts", "church order": "gospels", charge: "revelation",
  answer: "prophets", worship: "epistles", encouragement: "poetry", correction: "history", warning: "revelation", prayer: "gospels" };
function outlineBody() {
  const l = chosenLetter(), parts = l.outline, kinds = [...new Set(parts.map((p) => p.kind).filter(Boolean))], k = keep.part !== null ? parts[keep.part] : null;
  return `<div class="panel">
    ${kinds.length ? `<div class="legend">${kinds.map((kind) => `<span><i style="background: var(--${KIND_TONES[kind] ?? "epistles"})"></i>${kind}</span>`).join("")}</div>` : ""}
    <div class="outline">${parts.map((p, i) => `<button type="button" style="flex-grow:${p.verses}; --tone: var(--${KIND_TONES[p.kind] ?? "epistles"})" data-act="keep" data-arg="part:${i}" aria-pressed="${keep.part === i}"><span>${p.title}</span></button>`).join("")}</div>
    <p class="tip">${k ? `<b style="color:var(--ink)">${k.title}</b>${keepX("part")} · ${k.ref} · ${k.verses} verses${k.kind ? ` · ${k.kind}` : ""}` : `${l.name} in ${parts.length} parts, each as long as it is, in our own words. Click a part to see where it runs.`}</p></div>`;
}
function wordsBody() {
  const l = chosenLetter(), most = Math.max(...l.words.map((w) => w.count)), k = keep.word !== null ? l.words[keep.word] : null;
  return `<div class="panel"><div class="word-grid">${l.words.map((w, i) => { const r = 4 + 14 * Math.sqrt(w.count / most);
    return `<button type="button" data-act="keep" data-arg="word:${i}" aria-pressed="${keep.word === i}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="${r + 4}" fill="var(--gospels)" opacity=".15"/><circle cx="20" cy="20" r="${r}" fill="var(--gospels)"/></svg>
      <span><b>${w.gloss}</b><small>${w.greek} ${w.translit} · ${w.strongs}</small></span><em>${w.count}</em></button>`; }).join("")}</div>
    <p class="tip">${k ? `<b style="color:var(--ink)">${k.gloss}</b> <span>(${k.greek}, ${k.translit})</span>${keepX("word")} · ${k.note}` : "A bigger star means more uses. Click a word to see where it gathers."}</p></div>`;
}
function otBody() {
  const l = chosenLetter();
  if (!l.otQuotes.length) return `<div class="panel"><p class="fact">${l.name} quotes no Old Testament passage.</p></div>`;
  return `<div class="panel"><ul class="ot-list">${l.otQuotes.map((q) => `<li><a href="/read">${q.at}</a> <span>quotes</span> <a href="/read">${q.from}</a>${q.note ? `<small>${q.note}</small>` : ""}</li>`).join("")}</ul></div>`;
}

// ── How they were read: open questions, and acceptance witness by witness ───────────────
function questionsBody() {
  const q = P.questions[keep.question];
  return `<div class="panel q-layout">
    <ol class="q-list">${P.questions.map((x, i) => `<li><button type="button" data-act="keep" data-arg="question:${i}" aria-pressed="${keep.question === i}">${x.question}</button></li>`).join("")}</ol>
    <div><p class="panel-label">${q.views.length} views · this page does not choose between them</p>
      <div class="views">${q.views.map((v) => `<article><h4>${v.label}</h4><p>${v.argument}</p><small>${v.holders}</small></article>`).join("")}</div></div></div>`;
}
const STATUS = { accepted: ["Accepted", "1"], used: ["Quoted or used", ".55"], doubted: ["Doubted", "0"], omitted: ["Left out", ".15"] };
function canonBody() {
  const ws = P.canon, k = keep.witness !== null ? ws[keep.witness] : null;
  const codes = P.letters.map((l) => [l.code, l.name]);
  return `<div class="panel"><div class="canon-wrap"><table class="canon">
    <thead><tr><th></th>${ws.map((w, i) => `<th><button type="button" data-act="keep" data-arg="witness:${i}" aria-pressed="${keep.witness === i}"><b>${w.year}</b>${w.label}</button></th>`).join("")}</tr></thead>
    <tbody>${codes.map(([code, name]) => `<tr><th>${name}</th>${ws.map((w, i) => { const s = w.status[code];
      return `<td class="${keep.witness === i ? "on" : ""}">${s ? `<i title="${STATUS[s][0]}" style="opacity:${STATUS[s][1] === "0" ? 1 : STATUS[s][1]}; ${s === "doubted" ? "background:none; border:2px solid var(--revelation)" : ""}"></i>` : ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>
    <div class="legend" style="margin-top:.8rem">${Object.entries(STATUS).map(([s, [name, o]]) => `<span><i style="background: var(--revelation); opacity:${o === "0" ? 1 : o}; ${s === "doubted" ? "background:none; border:2px solid var(--revelation)" : ""}"></i>${name}</span>`).join("")}</div>
    <p class="tip">${k ? `<b style="color:var(--ink)">${k.label}</b>${keepX("witness")} · about AD ${k.year} · ${k.who}<br><span class="fact">${k.claim}</span>` : "Click a witness to read what they say."}</p></div>`;
}

// A new letter starts with nothing kept.
const chooseLetter = ACTIONS.letter;
ACTIONS.letter = (name) => { chooseLetter(name); keep.part = null; keep.word = null; };

// ── The three sections and their parts ────────────────────────────────────────────────
const SECTION_PARTS = {
  story: [
    { id: "map", eyebrow: "On the map", title: "Journeys and destinations", lead: "Choose a journey to follow it; the rings mark where his letters went.", body: () => journeysBody() },
    { id: "time", eyebrow: "In time", title: "Paul's life and letters", lead: "His life on one line of years, and each letter where it was written.", body: () => lifeBody() },
    { id: "companions", eyebrow: "Companions", title: "His companions over time", lead: "The people who travelled and worked with him.", body: () => networkBody(P.companions, "companion") },
    { id: "onesimus", eyebrow: "A story in letters", title: "The story of Onesimus", lead: "A runaway sent home with a letter, from Paul's prison to Philemon's house.", body: () => onesimusBody() },
  ],
  inside: [
    { id: "glance", eyebrow: "At a glance", title: () => `${paulState.letter} at a glance`, lead: "Who wrote it, to whom, from where, when and why; its key verses and its themes.", body: () => glanceBody() },
    { id: "shape", eyebrow: "Its shape", title: "How it is built", lead: "The letter cut into its parts, in our own words, coloured by what each part does.", body: () => outlineBody() },
    { id: "words", eyebrow: "Greek words", title: "The words it leans on", lead: "Its key Greek words, counted in the Greek text.", body: () => wordsBody() },
    { id: "ot", eyebrow: "Old Testament", title: () => `The Old Testament behind ${paulState.letter}`, lead: "Each quotation, linked to the passage it comes from.", body: () => otBody() },
  ],
  side: [
    { id: "ephcol", eyebrow: "Twin letters", title: "Ephesians and Colossians", lead: "Thirty-one passages that run in parallel. Choose a ribbon to read both side by side.", body: () => ephcolBody() },
    { id: "romans16", eyebrow: "Romans 16", title: "The people of Paul's greetings", lead: "Every name in Romans 16, and how the chapter links them.", body: () => networkBody(P.romans16, "person") },
    { id: "questions", eyebrow: "Open questions", title: "Where readers have differed", lead: "Eight questions about these letters, each answer with the people who held it.", body: () => questionsBody() },
    { id: "canon", eyebrow: "The canon", title: "How they were received", lead: "Witness by witness, when each letter was quoted, used and accepted.", body: () => canonBody() },
  ],
};
const SECTION_HREF = { story: "#/paul/story", inside: "#/paul/inside", side: "#/paul/side" };
const titleOf = (part) => (typeof part.title === "function" ? part.title() : part.title);


/** A section's four parts, one under another, with a jump list to each. */
function partsHtml(g) {
  const parts = SECTION_PARTS[g.id];
  return `<nav class="jump" aria-label="In this section">${parts.map((p, i) => `<a href="#part-${p.id}" onclick="document.getElementById('part-${p.id}').scrollIntoView({behavior:'smooth'});return false"><span>${pad2(i + 1)}</span>${titleOf(p)}</a>`).join("")}</nav>
    ${parts.map((p, i) => `
      <section class="part" id="part-${p.id}" style="--tone: var(--${g.cards[i].tone})">
        <div class="part-head"><span class="part-num">${pad2(i + 1)}</span><div><p class="kicker">${icon(g.cards[i].icon, 14)} ${p.eyebrow}</p><h2>${titleOf(p)}</h2><p>${p.lead}</p></div>${art(g.cards[i].art, "part-art")}</div>
        ${p.body()}
      </section>`).join("")}`;
}
// Older addresses for single cards land on their section, at the right part.
const OLD_CARD_ADDRESSES = { journeys: ["story", "map"], romans: ["inside", "glance"], "ephesians-colossians": ["side", "ephcol"] };
const scrollToPart = (part) => setTimeout(() => document.getElementById(`part-${part}`)?.scrollIntoView(), 50);

/** A section's own page: where it sits, its title, its four parts, and the way to the other two sections. */
function sectionPage(sectionId) {
  const groups = PAUL_GROUPS_OF_CARDS(), g = groups.find((x) => x.id === sectionId) ?? groups[0], n = groups.indexOf(g) + 1, parts = SECTION_PARTS[g.id];
  const others = groups.filter((x) => x !== g);
  const pager = (x, dir) => `<a href="${SECTION_HREF[x.id]}" style="--tone: var(--${x.tone})">${art(x.art, "mini")}<span><small>${dir}</small><b>${x.title}</b></span></a>`;
  return `
    ${crumbs([`<a href="#/paul">Paul's letters</a>`, g.title], `SECTION ${pad2(n)} OF 03`)}
    <header class="chapter-head" style="--tone: var(--${g.tone})"><div><p class="kicker">Paul's letters · ${parts.map((p) => p.eyebrow).join(" · ")}</p><h1>${g.title}</h1><p>${g.id === "inside" ? "Choose any of the thirteen; all four parts below follow it." : g.lead}</p></div>${art(g.art)}</header>
    ${g.id === "inside" ? (window.LETTER_PICKER ?? letterPicker)() : ""}
    ${partsHtml(g)}
    <nav class="pager" aria-label="Other sections">${pager(others[0], "Section")}${pager(others[1], "Section")}</nav>`;
}
