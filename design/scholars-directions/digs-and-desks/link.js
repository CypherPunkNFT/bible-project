// 03 · From the dig to your screen: the discoveries whose scholars' work this site uses, traced step by step. Built only
// from the data: a finder's own site note, or the next scholar in the chain of the text whose work the site uses.
(() => {
  const { S, byId, esc, tone } = DD;
  const chain = S.chain.steps;

  function routes() {
    const rows = [], idle = new Set();
    for (const f of [...S.finds].sort((a, b) => a.year - b.year)) for (const id of f.by) {
      const s = byId[id], work = s.works[0], first = [{ kind: "find", f }, { kind: "person", s, what: `${work[0]}, ${work[1]}` }];
      if (s.site) { rows.push([...first, { kind: "site", s }]); continue; }
      const at = chain.findIndex(([cid]) => cid === id), later = at >= 0 ? chain.slice(at + 1).find(([cid]) => byId[cid].site) : null;
      if (later) { first[1].what = chain[at][1]; rows.push([...first, { kind: "person", s: byId[later[0]], what: later[1], next: true }, { kind: "site", s: byId[later[0]] }]); continue; }
      idle.add(s);
    }
    return { rows, idle: [...idle].filter((s) => !rows.some((r) => r.some((n) => n.s === s))) };
  }

  function node(n) {
    if (n.kind === "find") return `<div class="dd-node dd-node-find"><p class="kicker" style="--tone:var(--history)">Discovery · ${n.f.year}</p>
      <button type="button" class="dd-node-title" data-find="${n.f.id}">${esc(n.f.name)}</button><small>${esc(n.f.where[0])}</small></div>`;
    if (n.kind === "person") return `<div class="dd-node" style="--tone:${tone(n.s)}"><p class="kicker">${n.next ? "Next in the chain" : esc(DD.field(n.s))}</p>
      <button type="button" class="dd-node-title" data-sid="${n.s.id}">${esc(n.s.name)}</button><small>${esc(n.what)} · <span>${esc(DD.faith(n.s))}</span></small></div>`;
    const area = Object.keys(DD.AREA_ROUTE).find((a) => n.s.site.note.includes(a));
    return `<div class="dd-node dd-node-site"><p class="kicker" style="--tone:var(--poetry)">${n.s.site.status === "in-use" ? "Used on this site" : "In the library, planned"}</p>
      ${area ? `<a class="dd-node-title" href="${DD.AREA_ROUTE[area]}">${esc(area)}${icon("arrowUp", 14)}</a>` : ""}<small>${esc(n.s.site.note)}</small></div>`;
  }

  DD.mountLink = (host) => {
    const { rows, idle } = routes();
    const list = (people) => people.map((s) => s.short).join(people.length > 2 ? ", " : " and ").replace(/, ([^,]*)$/, " and $1");
    host.insertAdjacentHTML("beforeend", `<section class="dd-sec dd-link" id="to-your-screen">
      <div class="dd-head"><p class="kicker" style="--tone:var(--poetry)">03 · From the dig to your screen</p><h2>From the dig <em style="--tone:var(--poetry)">to your screen.</em></h2>
        <p>${rows.length === 2 ? "Two" : rows.length} of the discoveries lead, through the scholars' own work, to a page of this site.</p></div>
      <div class="dd-routes">${rows.map((r) => `<div class="dd-route">${r.map(node).join(`<span class="dd-arrow" aria-hidden="true">${icon("arrowRight", 15)}</span>`)}</div>`).join("")}</div>
      <div class="dd-chain"><p><span class="kicker">${esc(S.chain.about.replace(/\.$/, ""))}</span></p>
        <ol>${chain.map(([id, what]) => `<li><button type="button" data-sid="${id}" style="--tone:${tone(byId[id])}" title="${esc(what)}">${esc(byId[id].short)}</button></li>`).join("")}</ol></div>
      ${idle.length ? `<p class="dd-idle">The other discoveries' scholars, ${esc(list(idle))}, are not used on this site yet.</p>` : ""}
    </section>`);
    const sec = host.lastElementChild;
    sec.addEventListener("click", (e) => {
      const who = e.target.closest("[data-sid]"), find = e.target.closest("[data-find]");
      if (who) DD.openProfile(who.dataset.sid);
      else if (find) DD.showFind(find.dataset.find);
    });
  };
})();
