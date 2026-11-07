// Genesis 1–11: the small helpers every part of the page uses. All study text goes in as text nodes; the only markup
// strings are the fixed drawings in art.js. Values from the address (?q=, ?ref=) are looked up with Object.hasOwn, so an
// unknown or hostile value is simply ignored.
window.GBCore = (() => {
  const SVG = "http://www.w3.org/2000/svg";
  const has = (object, key) => typeof key === "string" && Object.hasOwn(object, key);

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
  function s(tag, attrs = {}, ...children) {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attrs)) if (value !== undefined && value !== null) element.setAttribute(key, value);
    element.append(...children.flat(Infinity).filter((c) => c !== null && c !== undefined));
    return element;
  }
  function art(markup, className) {
    const holder = h("span", { class: className });
    holder.innerHTML = markup; // fixed drawings from art.js only
    return holder;
  }

  function make(data) {
    const { passages } = data;
    const refLink = (id, text) => h("a", { class: "gb-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text ?? passages[id].label);
    const label = (text, extra = "") => h("span", { class: `gb-label ${extra}`.trim() }, text);
    function runs(list) {
      return list.map((run) => {
        if (typeof run === "string") return run;
        if (run.r) return refLink(run.r, run.t);
        if (run.a) return h("a", { class: "gb-link", href: run.a }, run.t);
        if (run.b) return h("strong", {}, run.b);
        if (run.i) return h("em", {}, run.i);
        if ("s" in run) return run.s ? h("a", { class: "gb-link", href: run.s, title: "Study mock-up on this PC" }, h("em", {}, run.t)) : h("em", { class: "gb-study", title: "Not yet a page" }, run.t);
        console.error("Genesis 1–11: unknown run", run);
        return "";
      });
    }
    const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t || run.b || run.i || "")).join("");
    const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");

    // ── The verse sheet: one dialog, opened from any verse link, the reference kept in the address beside ?q= ──
    const sheet = h("dialog", { class: "gb-sheet", "aria-labelledby": "gb-sheet-title" });
    document.body.append(sheet);
    let opener = null;
    function setParam(key, value) {
      const params = new URLSearchParams(location.search);
      if (value) params.set(key, value); else params.delete(key);
      const query = params.toString();
      history.replaceState(history.state, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
    }
    function openSheet(id, remember = true) {
      if (!has(passages, id)) return;
      const item = passages[id];
      sheet.replaceChildren(
        h("div", { class: "gb-sheet-head" }, h("h2", { id: "gb-sheet-title" }, item.label),
          h("button", { type: "button", class: "gb-sheet-x", "aria-label": "Close", onclick: () => sheet.close() }, art(icon("x", 18)))),
        h("p", { class: "gb-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
        h("p", { class: "gb-sheet-src" }, "Berean Standard Bible"));
      if (!sheet.open) sheet.showModal();
      if (remember) setParam("ref", id);
    }
    sheet.addEventListener("close", () => {
      setParam("ref", null);
      opener?.focus();
      opener = null;
    });
    sheet.addEventListener("click", (event) => { if (event.target === sheet) sheet.close(); });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.gb-ref");
      if (!link) return;
      event.preventDefault();
      opener = link;
      openSheet(link.dataset.ref);
    });
    return { refLink, label, runs, plain, verseText, openSheet, setParam };
  }

  return { h, s, art, has, make };
})();
