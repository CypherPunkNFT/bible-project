// The panel beside the helix: what a crystal, a rung, a stretch of years, or the crown at the top tells.
import { esc, KIND, kindVar, claim, kjv, refLink } from "./util.js";

const icon = (...a) => window.icon(...a);
const DATA_KIND = { personal: "personal", battle: "battle", alliance: "alliance", worship: "worship", prophecy: "prophecy", building: "building", other: "other" };

const nav = (index, total) => `<div class="pn-nav"><button type="button" data-go="prev" aria-label="Previous crystal">${icon("chevronLeft", 18)}</button>
  <span>${index >= 0 ? `${index + 1} <small>of ${total}</small>` : `${total} <small>crystals</small>`}</span>
  <button type="button" data-go="next" aria-label="Next crystal">${icon("chevronRight", 18)}</button></div>`;

function whenLine(c, data) {
  if (c.dated) {
    const y = c.dated.reignYear;
    if (y === 1) return { solid: true, text: `Dated: the first year of the reign. He was thirty (2 Samuel 5:4).` };
    if (y === 40) return { solid: true, text: `Dated: the end of forty years of reign, which puts him at seventy (2 Samuel 5:4).` };
    return { solid: true, text: `Dated: after seven years and six months in Hebron, so in the eighth year of the reign (2 Samuel 5:5).` };
  }
  if (c.segment === "before") return { solid: false, text: `${data.notSaid[1]} This crystal keeps the order the text tells it; its height is not an age.` };
  return { solid: false, text: `${data.notSaid[2]} This crystal keeps the order the text tells it, evenly spaced between the dated moments.` };
}

function chroniclesLine(c) {
  return {
    told: [`${icon("check", 15)}Chronicles tells this too`, "is-told"],
    "left-out": [`${icon("eyeOff", 15)}Chronicles leaves this out`, "is-out"],
    only: [`${icon("columns", 15)}Told only in Chronicles: it sits on the silver strand`, "is-only"],
    none: [`${icon("columns", 15)}Before Chronicles begins (it opens at the anointing over all Israel)`, "is-none"],
  }[c.chronicles] ?? null;
}

function crystalCard(c, data, nv) {
  const k = KIND[c.kind];
  const when = whenLine(c, data), chr = chroniclesLine(c);
  const rungs = data.rungs.filter((r) => r.crystalId === c.id);
  const place = c.place ? `<li>${icon("pin", 16)}<span><b>${esc(c.place.name)}</b>${c.place.note ? ` · ${esc(c.place.note)}` : ""}</span></li>` : "";
  return `<div class="pn" style="--c:${kindVar(c.kind)}">
    <header class="pn-head"><span class="pn-gem">${icon(k.icon, 30, 1.6)}</span>
      <div><p class="pn-kicker">${esc(k.label)}${c.anointing ? ` · anointing ${c.anointing} of 3` : ""}</p><h2>${esc(c.label)}</h2></div></header>
    ${claim(c.claim, "pn-claim")}
    ${kjv(c.verse, "kjv-sm")}
    <ul class="pn-meta">
      <li class="${when.solid ? "is-dated" : "is-undated"}">${icon(when.solid ? "calendar" : "helix", 16)}<span>${esc(when.text)}</span></li>
      ${place}
      ${chr ? `<li class="${chr[1]}"><span>${chr[0]}</span></li>` : ""}
    </ul>
    ${rungs.length ? `<div class="pn-rungs"><p>Where the two accounts differ here</p>${rungs.map((r) => `<button type="button" data-go="rung:${r.id}">${icon("rung", 15)}${esc(r.topic)}${icon("arrowRight", 14)}</button>`).join("")}</div>` : ""}
    <p class="pn-note">Grouped here as “${esc(k.label.toLowerCase())}”${c.dataKind ? `; the page's data calls it “${esc(DATA_KIND[c.dataKind] ?? c.dataKind)}”` : ""}. Shape: ${esc(k.shape.toLowerCase())}.</p>
    ${nv}</div>`;
}

function rungCard(r, data, nv) {
  const holder = data.crystalById[r.crystalId];
  return `<div class="pn pn-rung" style="--c:var(--rung)">
    <header class="pn-head"><span class="pn-gem">${icon("rung", 30, 1.6)}</span><div><p class="pn-kicker">A rung · the two accounts differ</p><h2>${esc(r.topic)}</h2></div></header>
    <div class="pn-two">
      <section class="is-sk"><h3>${icon("book", 15)}Samuel and Kings</h3>${claim(r.first)}</section>
      <section class="is-chr"><h3>${icon("book", 15)}Chronicles</h3>${claim(r.second)}</section>
    </div>
    <p class="pn-note">Shown side by side and never merged. The rung joins the gold strand at “${esc(holder?.label ?? "")}”.</p>
    <div class="pn-rungs"><button type="button" data-go="crystal:${r.crystalId}">${icon("gem", 15)}Go to that crystal${icon("arrowRight", 14)}</button>
      <button type="button" data-go="facet:two">${icon("columns", 15)}All the differences${icon("arrowRight", 14)}</button></div>
    ${nv}</div>`;
}

function overviewCard(data, nv) {
  const dated = data.crystals.filter((c) => c.dated).length;
  return `<div class="pn pn-guide" style="--c:var(--strand-sk)">
    <header class="pn-head"><span class="pn-gem">${icon("helix", 30, 1.6)}</span><div><p class="pn-kicker">How to read the helix</p><h2>Seventy years, rising</h2></div></header>
    <p class="pn-how">${icon("hand", 16)}Drag to turn<span></span>${icon("mouse", 16)}Scroll to travel<span></span>${icon("gem", 16)}Choose a crystal</p>
    <ul class="pn-key">
      <li><i class="key-h"></i><span><b>Height is his years.</b> Thirty before the throne, forty on it (2 Samuel 5:4). One turn is eight years.</span></li>
      <li><i class="key-sk"></i><span><b>The gold strand</b> is 1 Samuel 16 to 1 Kings 2. Beaded where no ages are given.</span></li>
      <li><i class="key-chr"></i><span><b>The silver strand</b> is 1 Chronicles 11–29. It begins at the anointing over all Israel, and breaks where Chronicles is silent.</span></li>
      <li><i class="key-rung"></i><span><b>${data.rungs.length} rungs</b> join the strands where the two accounts differ.</span></li>
      <li><i class="key-gem"></i><span><b>${data.crystals.length} crystals</b> for his moments; colour and shape show the kind.</span></li>
      <li><i class="key-stem"></i><span><b>Solid stem:</b> Scripture dates it (${dated} moments). <b>Dashed:</b> undated, kept in the order the text tells it.</span></li>
    </ul>
    <div class="pn-rungs"><button type="button" data-go="start">${icon("arrowUp", 15)}Start at the beginning${icon("arrowRight", 14)}</button><button type="button" data-go="cap">${icon("crown", 15)}Go to the verdict${icon("arrowRight", 14)}</button></div>
    ${nv}</div>`;
}

function segmentCard(seg, data, nv) {
  const s = {
    before: { k: "Years 0–30", t: "Before the throne", c: "var(--strand-sk)", body: `<p class="pn-p">${esc(data.person.short)}</p><p class="pn-p is-muted">${esc(data.notSaid[1])}</p>` },
    hebron: { k: "Years 30–37½", t: "King of Judah at Hebron", c: "var(--strand-sk)", body: kjv(data.hero.hebron, "kjv-sm") + `<p class="pn-p is-muted">1 Kings 2:11 and 1 Chronicles 29:27 give the Hebron years as seven.</p>` },
    jerusalem: { k: "Years 37½–70", t: "King of all Israel in Jerusalem", c: "var(--strand-sk)", body: kjv(data.hero.hebron, "kjv-sm") + `<p class="pn-p is-muted">${esc(data.notSaid[2])}</p>` },
  }[seg];
  return `<div class="pn" style="--c:${s.c}"><header class="pn-head"><span class="pn-gem">${icon("helix", 30, 1.6)}</span><div><p class="pn-kicker">${s.k}</p><h2>${s.t}</h2></div></header>${s.body}
    <p class="pn-note">Keep scrolling: the next crystal opens here as you reach it.</p>${nv}</div>`;
}

function capCard(data, nv) {
  const kings = data.records.find((r) => r.book === "kings");
  return `<div class="pn pn-cap" style="--c:var(--k-anointing)">
    <header class="pn-head"><span class="pn-gem">${icon("crown", 30, 1.6)}</span><div><p class="pn-kicker">The crown · the verdict</p><h2>“Right in the eyes of the LORD”</h2></div></header>
    ${kjv(data.verdictVerse)}
    <ul class="pn-meta"><li class="is-dated">${icon("check", 16)}<span>Kings judges the reign right, and names its one exception: Uriah the Hittite.</span></li></ul>
    ${data.verdictNotes.slice(1, 3).map((n) => claim(n)).join("")}
    ${kings?.burial ? `<p class="pn-p is-muted">He ${esc(kings.burial.text)} (${refLink(kings.burial.span)}).</p>` : ""}
    <div class="pn-rungs"><button type="button" data-go="facet:verdict">${icon("scale", 15)}The full verdict and the records${icon("arrowRight", 14)}</button></div>
    ${nv}</div>`;
}

export function panelHtml(type, id, data, { index, total }) {
  const nv = nav(index, total);
  if (type === "crystal") return crystalCard(data.crystalById[id], data, nv);
  if (type === "rung") return rungCard(data.rungById[id], data, nv);
  if (type === "cap") return capCard(data, nv);
  if (type === "overview") return overviewCard(data, nv);
  return segmentCard(type, data, nv);
}
