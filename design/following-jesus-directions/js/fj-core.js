// Following Jesus: the shared helpers for this page. Behaviour only; the look is in css/fj.css.
// All study text goes in as text nodes. The only markup strings are the fixed drawings in art.js. Values from the
// address (?ref=, ?line=) are looked up with Object.hasOwn in data.js's own maps, so an unknown value is ignored.
window.FJKit = (() => {
  const SVG = "http://www.w3.org/2000/svg";
  function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (key === "class") element.className = value;
      else if (key.startsWith("on")) element.addEventListener(key.slice(2), value);
      else element.setAttribute(key, value === true ? "" : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  // An SVG element. Every attribute value must be a number or a fixed string from this page's own code.
  function s(tag, props = {}, ...children) {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null || value === false) continue;
      if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`Following Jesus: bad number for ${key}`);
      element.setAttribute(key, typeof value === "number" ? String(Math.round(value * 100) / 100) : value);
    }
    element.append(...children.flat().filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }
  const own = (map, key) => typeof key === "string" && key.length <= 40 && Object.hasOwn(map, key);
  const SITE = /^\/(?![/\\])[\w\-./?#=&%]*$/;
  const refLink = (id, text) => h("a", { class: "fj-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text);
  const label = (text) => h("span", { class: "fj-label" }, text);

  function runs(list) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return SITE.test(run.a) ? h("a", { class: "fj-link", href: run.a }, run.t) : run.t;
      if (run.b) return h("strong", {}, run.b);
      if (run.i) return h("em", {}, run.i);
      if (run.c) return h("span", { class: "fj-tocheck", title: `Still to check before publishing: ${run.c}`, "aria-label": `still to check: ${run.c}` }, "check");
      if ("s" in run) return run.s && SITE.test(run.s) ? h("a", { class: "fj-link", href: run.s, title: "Mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "fj-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t || run.b || run.i || "")).join("");

  // The address keeps the current view: change only this page's own key, keep the others and the hash.
  function setParam(key, value) {
    const params = new URLSearchParams(location.search);
    if (value === null) params.delete(key); else params.set(key, value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }
  const getParam = (key) => new URLSearchParams(location.search).get(key);

  const sectionHead = (number, title, turn, ...lead) => h("header", { class: "t-head fj-head" },
    h("span", { class: "t-num", "aria-hidden": "true" }, number),
    h("div", {}, h("h2", {}, title, turn ? " " : "", turn ? h("em", {}, turn) : null), lead.length ? h("p", {}, ...lead) : null));

  return { h, s, art, own, refLink, label, runs, plain, setParam, getParam, sectionHead };
})();

// The verse sheet: every reference opens its verses here, in the Berean. Escape closes it and focus goes back.
window.FJSheet = (passages) => {
  const { h, art, own, setParam, getParam } = FJKit;
  const sheet = h("dialog", { class: "fj-sheet", "aria-labelledby": "fj-sheet-title" });
  document.body.append(sheet);
  let opener = null;
  function open(id) {
    if (!own(passages, id)) return;
    const item = passages[id];
    sheet.replaceChildren(
      h("div", { class: "fj-sheet-head" }, h("h2", { id: "fj-sheet-title" }, item.label), h("button", { type: "button", class: "fj-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
      h("p", { class: "fj-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
      h("p", { class: "fj-sheet-src" }, "Berean Standard Bible"));
    if (!sheet.open) sheet.showModal();
    setParam("ref", id);
  }
  sheet.addEventListener("close", () => {
    setParam("ref", null);
    (opener && opener.isConnected ? opener : document.querySelector("h1"))?.focus({ preventScroll: Boolean(!opener) });
    opener = null;
  });
  sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
  document.addEventListener("click", (event) => {
    const link = event.target.closest(".fj-ref");
    if (!link) return;
    event.preventDefault();
    opener = link;
    open(link.dataset.ref || link.getAttribute("data-ref"));
  });
  const asked = getParam("ref");
  if (own(passages, asked)) open(asked);
  return { open: (id, from) => { opener = from || null; open(id); } };
};
