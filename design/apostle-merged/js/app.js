// The page shell: ?who=<person id> (or the short key) picks the apostle. Switching redraws in place with no reload:
// every apostle's data is cached after the first load, and the reader keeps their place (the same section, at the
// same offset). Order: landing; 01 the record ring; 02 the chapter grid; the chapters I–IV; 03 who was with him;
// 04 one moment, several accounts; 05 where he was; 06 what readers still ask; the sources.
(() => {
  const main = Frame.mount();
  let cleanups = [], current = null, token = 0;

  const sources = (d) => `<details class="sources"><summary>Sources · ${plural(d.citations.length, "work")} cited on this page</summary>
    <ul>${d.citations.map((c) => `<li><a href="${esc(c.url ?? "#")}">${esc(c.author)}</a>, <i>${esc(c.title)}</i>${c.year ? ` (${esc(c.year)})` : ""}${c.where ? `, ${esc(c.where)}` : ""}</li>`).join("")}</ul>
    <p class="plain-line">Scripture is quoted from the King James Version as held on this site. Places from OpenBible.info (CC BY); the land outline is the Atlas's own (Natural Earth).</p></details>`;

  function render(d) {
    const t0 = performance.now();
    cleanups.forEach((f) => { try { f?.(); } catch (error) { console.error("apostle page: cleanup failed", error); } });
    cleanups = []; Tip.hide(); Sheet.close();
    main.innerHTML = "";
    window.D = d; current = d.id;
    document.title = `${d.name} · Apostles · Bible Project`;
    const run = (name, fn) => { try { const c = fn(); if (typeof c === "function") cleanups.push(c); } catch (error) { console.error(`apostle page: ${name} failed to draw for ${d.id}`, error); } };
    run("landing", () => Landing.mount(main, d));
    const top = document.createElement("div"); top.className = "wrap"; main.append(top);
    run("ring", () => Record.ring(top, d));
    run("grid", () => Record.grid(top, d));
    run("chapters", () => Cinema.mount(main, d));
    const rest = document.createElement("div"); rest.className = "wrap"; main.append(rest);
    run("with", () => With.mount(rest, d));
    run("accounts", () => Accounts.mount(rest, d));
    run("places", () => Places.mount(rest, d));
    run("questions", () => Questions.mount(rest, d));
    rest.insertAdjacentHTML("beforeend", sources(d));
    window.__lastRenderMs = Math.round(performance.now() - t0);
  }

  // Where the reader is: the section at the top of the window and how far into it.
  const place = () => {
    const secs = [...main.querySelectorAll("[data-sec]")];
    const s = secs.filter((x) => x.getBoundingClientRect().top <= 80).pop();
    return s ? { sec: s.dataset.sec, off: 80 - s.getBoundingClientRect().top } : null;
  };
  async function go(id, keep = true) {
    const mine = ++token, t0 = performance.now(), where = keep ? place() : null;
    let d;
    try { d = await loadApostle(id); } catch (error) { console.error(`apostle page: could not load ${id}`, error); main.innerHTML = `<div class="wrap"><p class="plain-line">This page could not load its data (${esc(error.message)}).</p></div>`; return; }
    if (mine !== token) return;
    render(d);
    if (where) { const s = main.querySelector(`[data-sec="${where.sec}"]`); if (s) scrollTo(0, s.getBoundingClientRect().top + scrollY - 80 + Math.min(where.off, s.offsetHeight - 40)); }
    window.__lastSwitchMs = Math.round(performance.now() - t0);
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-who]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (a.dataset.who === current) return;
    history.replaceState(null, "", `?who=${a.dataset.who}`);
    go(a.dataset.who);
  });

  (async () => {
    let idx;
    try { idx = await loadIndex(); } catch (error) { console.error("apostle page: could not load the index", error); main.innerHTML = `<div class="wrap"><p class="plain-line">This page could not load (${esc(error.message)}).</p></div>`; return; }
    const want = new URLSearchParams(location.search).get("who");
    const w = idx.find((x) => x.id === want || x.key === want) ?? idx[0];
    await go(w.id, false);
    setTimeout(() => idx.filter((x) => x.id !== w.id).forEach((x) => loadApostle(x.id).catch((error) => console.error(`apostle page: preload ${x.id}`, error))), 500);
  })();
})();
