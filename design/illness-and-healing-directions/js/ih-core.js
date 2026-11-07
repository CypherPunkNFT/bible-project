// What Scripture promises the sick: the shared pieces of the page (element builder, text runs, frame, verse sheet).
// All text goes in as text nodes. The only markup strings are the fixed drawings in art.js and the frame's icons.
// A reference in the address (?ref=) is looked up in data.js with Object.hasOwn, so an unknown value is ignored.
window.IHCore = (() => {
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`What Scripture promises the sick: ${detail}`);
    return null;
  }
  if (!window.IH) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.IH is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.IHArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or IHArt is missing");
  const { passages, toConfirm } = window.IH;

  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js and frame.js only
    return holder;
  }
  const label = (text, extra = "") => h("span", { class: `ih-label ${extra}`.trim() }, text);
  const refLink = (id, text) => (Object.hasOwn(passages, id) ? h("a", { class: "ih-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text || passages[id].label) : text);
  const confirmMark = (index) => h("a", { class: "ih-confirm", href: "#to-confirm", "data-note": String(index), title: "Not yet compared with the published text",
    "aria-label": "Wording not yet confirmed; see the sources" }, "†");
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if ("c" in run) return confirmMark(run.c);
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "ih-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return run.s ? h("a", { class: "ih-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "ih-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  // A phrase drawn on the page, in the verse's own words, with the reference that holds it.
  const phrase = (pin, cls = "") => (pin ? h("span", { class: `ih-phrase ${cls}`.trim() }, h("q", {}, pin.t), " ", refLink(pin.r, pin.label)) : null);
  const sectionHead = (number, title, turn, lead) => h("header", { class: "t-head ih-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, " ", h("em", {}, turn)), lead ? h("p", {}, lead) : null));

  // ── Frame: the site's header and footer, with this site's name and Study lit ──
  function mountFrame() {
    const header = Frame.header, footer = Frame.footer;
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
    Frame.header = () => header()
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
    Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
    return Frame.mount();
  }

  // ── The verse sheet: opens from the right, the same way for every reference ──
  function mountSheet() {
    const sheet = h("dialog", { class: "ih-sheet", "aria-labelledby": "ih-sheet-title" });
    document.body.append(sheet);
    let opener = null;
    function open(id, push = true) {
      if (!Object.hasOwn(passages, id)) return;
      const item = passages[id];
      sheet.replaceChildren(
        h("div", { class: "ih-sheet-head" }, h("h2", { id: "ih-sheet-title" }, item.label),
          h("button", { type: "button", class: "ih-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
        h("div", { class: "ih-sheet-text" }, item.verses.map(([cv, text]) => h("p", {}, h("sup", {}, cv), " ", text))),
        h("p", { class: "ih-sheet-src" }, "Berean Standard Bible"));
      if (!sheet.open) sheet.showModal();
      sheet.scrollTop = 0;
      if (push) history.replaceState(null, "", `${addressWith("ref", id)}${location.hash}`);
    }
    sheet.addEventListener("close", () => {
      history.replaceState(null, "", `${addressWith("ref", null)}${location.hash}`);
      opener?.focus({ preventScroll: true });
      opener = null;
    });
    sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.ih-ref");
      if (!link) return;
      event.preventDefault();
      opener = link;
      open(link.dataset.ref);
    });
    const asked = new URLSearchParams(location.search).get("ref");
    if (asked) open(asked, false);
  }
  function addressWith(key, value) {
    const params = new URLSearchParams(location.search);
    if (value) params.set(key, value); else params.delete(key);
    const query = params.toString();
    return location.pathname + (query ? `?${query}` : "");
  }

  return { h, art, label, refLink, runs, phrase, sectionHead, mountFrame, mountSheet, addressWith };
})();
