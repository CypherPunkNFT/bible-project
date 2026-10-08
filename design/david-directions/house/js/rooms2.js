// The rooms of the house, part two: places, the world stage and outside records, dating, open questions, what
// Scripture does not say, his story, every passage, and the sources.
(() => {
  // Places as a chain in the order the reign names them, each with its distance and direction from Jerusalem worked
  // out from the Atlas positions (towns only; regions and rivers have no single point). No map, no borders.
  function fromJerusalem(p) {
    const J = H.places.find((x) => x.placeId === H.person.capital.placeId);
    if (p.placeId === J.placeId || p.type === "region" || p.type === "river") return null;
    const R = 6371, rad = Math.PI / 180, dLat = (p.lat - J.lat) * rad, dLon = (p.lon - J.lon) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(J.lat * rad) * Math.cos(p.lat * rad) * Math.sin(dLon / 2) ** 2;
    const km = 2 * R * Math.asin(Math.sqrt(a));
    if (km < 1.5) return { km: 0, dir: "" };
    const y = Math.sin(dLon) * Math.cos(p.lat * rad), x = Math.cos(J.lat * rad) * Math.sin(p.lat * rad) - Math.sin(J.lat * rad) * Math.cos(p.lat * rad) * Math.cos(dLon);
    const deg = (Math.atan2(y, x) / rad + 360) % 360;
    return { km: Math.round(km), dir: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8], deg };
  }
  function places() {
    const capital = H.person.capital.placeId;
    const seals = H.places.map((p, i) => {
      const d = fromJerusalem(p), evs = H.events.filter((e) => e.placeId === p.placeId).length;
      const badge = p.placeId === capital ? "the capital" : !d ? esc(p.type) : d.km === 0 ? "same Atlas point as Jerusalem" : `${d.km} km ${d.dir}`;
      return `<li><button type="button" class="seal${p.placeId === capital ? " is-capital" : ""}" data-pl="${i}"><span class="seal-n">${String(i + 1).padStart(2, "0")}</span>
        ${d && d.km ? `<i class="seal-dir" style="--deg:${d.deg.toFixed(0)}deg" aria-hidden="true">${icon("arrowUp", 14)}</i>` : ""}
        <b>${esc(p.name)}</b><small>${esc(p.note)}</small><em>${badge}${evs ? ` · ${evs} event${evs > 1 ? "s" : ""}` : ""}</em></button></li>`;
    }).join("");
    const intro = H.groupIntro.slice(0, 3).map((c) => claim(c)).join("");
    return room("places", 8, "pin", "The kingdom and its places", "The twenty-five places the reign names, in the order it names them, from Bethlehem to Gihon. Each town shows how far it lies from Jerusalem and which way, worked out from the Atlas positions. No borders are drawn: Scripture names places, not lines.",
      `<div class="places-grid"><ol class="seals">${seals}</ol>
        <div class="pl-side"><div class="pl-detail glass" id="pl-detail"></div><div class="pl-intro">${intro}</div></div></div>`);
  }
  function placeDetail(i) {
    const p = H.places[i], evs = H.events.filter((e) => e.placeId === p.placeId), d = fromJerusalem(p);
    document.querySelectorAll(".seal").forEach((g) => g.classList.toggle("is-on", +g.dataset.pl === i));
    document.getElementById("pl-detail").innerHTML = `<div class="ev-in"><p class="kicker">${icon("pin", 14)} ${esc(p.type ?? "place")}${d && d.km ? ` · ${d.km} km ${d.dir} of Jerusalem` : ""}</p><h3>${esc(p.name)}</h3><p>${esc(p.note)} · ${refList(p.refs)}</p>
      ${evs.length ? `<ul class="pl-evs">${evs.map((e) => `<li><b>${esc(e.label)}</b>${onTree(e.step)}</li>`).join("")}</ul>` : ""}
      <a class="ref" href="/study/atlas">Open in the Atlas</a></div>`;
  }

  function world() {
    const houses = H.worldStage.map((w) => `<article class="nb glass"><div class="nb-roof">${icon("house", 26, 1.4)}</div><h3>${esc(w.power)}</h3>
      ${w.rulers.length ? `<p class="nb-rulers">${w.rulers.map((r) => `<a href="/people/${esc(r.personId)}" title="${esc(r.note ?? "")}">${esc(r.name)}</a>`).join("")}</p>` : '<p class="nb-rulers"><em>No ruler named</em></p>'}${claim(w.claim)}</article>`).join("");
    const outside = H.outside.map((o) => `<article class="out"><p class="kicker">${icon("scroll", 14)} ${esc(o.date)}</p><h3>${esc(o.name)}</h3>${claim(o.claim)}</article>`).join("");
    return room("world", 9, "globe", "On the world stage", "The neighbouring houses David fought, served, married into or received gifts from. Below them, the records from outside the Bible, kept visibly apart.",
      `<div class="nbs">${houses}</div><h3 class="sub-h">${icon("scroll", 18)} Outside the Bible</h3><div class="outs">${outside}</div>`);
  }

  function dating() {
    const lo = 1070, hi = 955, X = (bc) => ((lo - bc) / (lo - hi)) * 100;
    const ticks = [1060, 1040, 1020, 1000, 980, 960].map((y) => `<span style="left:${X(y)}%">${y} BC</span>`).join("");
    const rows = H.dates.map((d) => {
      const bar = d.from && d.to ? `<i class="dt-bar" style="left:${X(d.from)}%;width:${X(d.to) - X(d.from)}%"><b>${d.from}–${d.to}</b></i>`
        : d.to ? `<i class="dt-bar is-open" style="left:${X(d.to + 40)}%;width:${X(d.to) - X(d.to + 40)}%"><b>… to ${d.to}</b></i>` : `<i class="dt-none">Scripture gives lengths, not BC years</i>`;
      return `<div class="dt-row"><div class="dt-label"><b>${esc(d.label)}</b>${d.cites ? `<span>${cites(d.cites)}</span>` : ""}</div><div class="dt-track">${bar}</div><p class="dt-note">${esc(d.note)}</p></div>`;
    }).join("");
    return room("dating", 10, "calendar", "When did he reign?", "Scripture counts years of reign, not years BC. Each dating scheme is shown with who holds it; the page does not choose between them.",
      `<div class="dt glass"><div class="dt-axis">${ticks}</div>${rows}</div><div class="dt-intro">${claim(H.groupIntro[3])}${claim({ text: H.person.reign.text, layer: "scripture", refs: H.person.reign.refs })}</div>`);
  }

  function questions() {
    const cards = H.questions.map((q) => `<article class="qn glass"><h3>${icon("help", 20)}${esc(q.question)}</h3><div class="qn-views">${q.views.map((v) =>
      `<div class="qn-view"><b>${esc(v.label)}</b><p class="qn-who">Held by ${esc(v.holders)}</p>${expander(claim(v.argument), { closed: "The argument", opened: "Hide the argument" })}</div>`).join("")}</div></article>`).join("");
    return room("questions", 11, "help", "Open questions", "Where readers disagree, each view is given with the people who hold it. None is chosen for you.", `<div class="qns">${cards}</div>`);
  }

  function notSaid() {
    const ids = H.person.identifications.map((c) => claim(c)).join("");
    return room("not-said", 12, "ban", "What Scripture does not say", "Silences matter as much as statements; the tree leaves these gaps open rather than guessing.",
      `<ul class="silences">${H.notSaid.map((s) => `<li>${icon("ban", 18)}<span>${esc(s)}</span></li>`).join("")}</ul><div class="ident glass"><p class="kicker">${icon("users", 14)} A note on the family data</p>${ids}</div>`);
  }

  function story() {
    const map = ["anointed", "covenant", "abigail", "jerusalem-sons", "bathsheba", "succession"];
    const para = (p, i) => `<div class="st-p"><span class="st-n">${i + 1}</span>${claim({ text: p.text, refs: p.refs })}${onTree(H.stepById[map[i]].index)}</div>`;
    const ps = H.story.paragraphs;
    return room("story", 13, "open", "His story, told plainly", esc(H.story.short),
      `<div class="st glass">${ps.slice(0, 2).map(para).join("")}${expander(ps.slice(2).map((p, k) => para(p, k + 2)).join(""), { closed: `Read paragraphs 3–${ps.length}`, opened: "Show less" })}</div>`);
  }

  function passages() {
    const chapterChips = (code, num, a, b) => Array.from({ length: b - a + 1 }, (_, k) => `<a href="/read/kjv/${code}/${a + k}">${a + k}</a>`).join("");
    const books = [["1 Samuel", "1SA", 9, 16, 31], ["2 Samuel", "2SA", 10, 1, 24], ["1 Kings", "1KI", 11, 1, 2], ["1 Chronicles", "1CH", 13, 11, 29]];
    const chron = H.person.records.find((r) => r.book === "chronicles");
    return room("passages", 14, "book", "Every passage", "The four passages that tell the reign, chapter by chapter, and the books Chronicles itself names as its sources.",
      `<div class="ps glass"><div class="ps-spans">${H.passages.map((s) => `<a class="ps-span" href="${refHref(s)}">${icon("open", 18)}${esc(refText(s))}</a>`).join("")}</div>
        ${books.map(([name, code, num, a, b]) => `<div class="ps-book"><b>${name}</b><div class="ps-ch">${chapterChips(code, num, a, b)}</div></div>`).join("")}
        <div class="ps-src"><p class="kicker">${icon("library", 14)} Chronicles names its sources</p><blockquote class="cap-kjv"><p>“${esc(chron.sourcesCited.text)}”</p><footer>${chip("kjv")}${refLink(chron.sourcesCited.span)}</footer></blockquote></div></div>`);
  }

  function sources() {
    return room("sources", 15, "library", "Sources", "Every outside work this page cites, with where in it the fact comes from.",
      `<ol class="srcs">${H.citations.map((c) => `<li><b>${esc(c.author)}</b>, <a href="${esc(c.url)}" target="_blank" rel="noreferrer">${esc(c.title)}</a> (${esc(c.year)}). <span>${esc(c.where)}</span></li>`).join("")}</ol>
       <p class="credit">Family, story and places: the site's people files and Atlas data. Verse text: King James Version. Every branch on the tree joins a person to a parent their own person file records; wives join David by marriage, and the two group nodes quote the KJV.</p>`);
  }

  const html = () => `${places()}${world()}${dating()}${questions()}${notSaid()}${story()}${passages()}${sources()}`;
  function after() {
    placeDetail(H.places.findIndex((p) => p.placeId === H.person.capital.placeId));
    document.querySelector(".seals").addEventListener("click", (e) => { const g = e.target.closest(".seal"); if (g) placeDetail(+g.dataset.pl); });
  }
  window.Rooms2 = { html, after };
})();
