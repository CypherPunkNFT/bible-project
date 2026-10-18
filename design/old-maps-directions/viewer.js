// The map viewer: a panel that slides in from the right beside the page (the approved "map as a slide-in panel") and
// slides away again on close. The map zooms with the wheel or a pinch and pans by dragging; double-click fits it.
// Below the map: title, mapmaker, year, holding library, licence and credit, and the link to the source record.
window.Viewer = (() => {
  const { esc, mapById, subjectByKey } = OM;
  let panel, stage, img, meta, current = null, opener = null;
  let view = { s: 1, x: 0, y: 0 };
  const pointers = new Map();
  let pinch = null;

  function build() {
    panel = document.createElement("aside");
    panel.className = "om-viewer";
    panel.setAttribute("aria-label", "Map viewer");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    panel.innerHTML = `<div class="om-v-top"><p class="kicker om-v-kicker"></p><button type="button" class="om-v-close" aria-label="Close the map">${icon("x", 18)}</button></div>
      <h3 class="om-v-title"></h3>
      <div class="om-v-stage"><img alt="" draggable="false"></div>
      <p class="om-v-hint">Scroll or pinch to zoom · drag to move · double-click to fit</p>
      <div class="om-v-meta"></div>`;
    document.body.append(panel);
    stage = panel.querySelector(".om-v-stage");
    img = stage.querySelector("img");
    meta = panel.querySelector(".om-v-meta");
    panel.querySelector(".om-v-close").addEventListener("click", close);
    addEventListener("keydown", (event) => { if (event.key === "Escape" && current) close(); });
    stage.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.addEventListener("dblclick", fit);
    const header = document.querySelector(".site-header");
    const setTop = () => panel.style.setProperty("--om-top", `${header ? header.getBoundingClientRect().height : 0}px`);
    setTop();
    addEventListener("resize", setTop);
  }

  const apply = () => { img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`; stage.classList.toggle("is-zoomed", view.s > 1.01); };
  function clampView() {
    const { width, height } = stage.getBoundingClientRect();
    view.s = Math.min(10, Math.max(1, view.s));
    view.x = Math.min(0, Math.max(width - width * view.s, view.x));
    view.y = Math.min(0, Math.max(height - height * view.s, view.y));
  }
  function zoomAt(px, py, nextScale) {
    const scale = Math.min(10, Math.max(1, nextScale));
    view.x = px - (px - view.x) * (scale / view.s);
    view.y = py - (py - view.y) * (scale / view.s);
    view.s = scale;
    clampView();
    apply();
  }
  function fit() { view = { s: 1, x: 0, y: 0 }; apply(); }
  function onWheel(event) {
    event.preventDefault();
    const box = stage.getBoundingClientRect();
    zoomAt(event.clientX - box.left, event.clientY - box.top, view.s * Math.exp(-event.deltaY * 0.0016));
  }
  function onDown(event) {
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s };
    }
  }
  function onMove(event) {
    const last = pointers.get(event.pointerId);
    if (!last) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, now);
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const box = stage.getBoundingClientRect();
      zoomAt((a.x + b.x) / 2 - box.left, (a.y + b.y) / 2 - box.top, pinch.s * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d);
    } else if (pointers.size === 1) {
      view.x += now.x - last.x;
      view.y += now.y - last.y;
      clampView();
      apply();
    }
  }
  function onUp(event) { pointers.delete(event.pointerId); if (pointers.size < 2) pinch = null; }

  function describe(m) {
    const subjects = m.s.map((k) => subjectByKey.get(k)?.label).filter(Boolean).join(" · ");
    const confidence = m.yc && m.yc !== "exact" ? ` <small>(${esc(m.yc)})</small>` : "";
    const preview = m.full ? "" : `<p class="om-v-note">This mock-up carries a ${m.tw}×${m.thh} preview; the built page opens the library's full scan (${esc(m.res)}).</p>`;
    return `<dl class="om-v-facts">
        <div><dt>Mapmaker</dt><dd>${esc(m.m ?? "Not recorded")}</dd></div>
        <div><dt>Year</dt><dd>${m.y ?? "Undated"}${confidence}</dd></div>
        <div><dt>Held by</dt><dd>${esc(m.lib)}</dd></div>
        <div><dt>Subjects</dt><dd>${esc(subjects)}</dd></div>
      </dl>
      ${m.d ? `<p class="om-v-about">${esc(m.d)} <span>— the holding library's description</span></p>` : ""}
      ${m.tf !== m.t ? `<p class="om-v-full"><span>Full title</span>${esc(m.tf)}</p>` : ""}
      ${preview}
      <dl class="om-v-credit"><dt>Credit</dt><dd>${esc(m.credit)}</dd><dt>Licence</dt><dd>${esc(m.lic)}${m.sa ? " · share-alike" : ""}${m.nc ? " · non-commercial use only" : ""}</dd></dl>
      <a class="om-v-source" href="${esc(m.url)}" target="_blank" rel="noopener">See the record at the source ${icon("arrowUp", 14)}</a>`;
  }

  function open(id, from) {
    if (!panel) build();
    const m = mapById.get(id);
    if (!m) { console.error(`viewer: no map with id "${id}" in data.js`); return; }
    current = m;
    opener = from ?? null;
    panel.style.setProperty("--tone", OM.tone(m.s[0]));
    panel.querySelector(".om-v-kicker").textContent = subjectByKey.get(m.s[0])?.label ?? "Old map";
    panel.querySelector(".om-v-title").textContent = m.t;
    img.src = m.full ?? m.th;
    img.classList.toggle("is-preview", !m.full); // a small preview is shown at its own size, never blown up
    img.alt = `${m.t}${m.y ? `, ${m.y}` : ""}`;
    fit();
    meta.innerHTML = describe(m);
    panel.inert = false;
    panel.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => panel.classList.add("is-open"));
    document.body.classList.add("om-viewing");
    panel.querySelector(".om-v-close").focus({ preventScroll: true });
  }

  function close() {
    if (!panel || !current) return;
    current = null;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    panel.inert = true;
    document.body.classList.remove("om-viewing");
    opener?.focus?.({ preventScroll: true });
  }

  return { open, close };
})();
