// Fear, anxiety and despair: the shared pieces of the page (element builder, text runs, the site frame, the verse
// sheet). All text goes in as text nodes; the only markup strings are the fixed drawings in art.js. A value in the
// address (?ref=, ?row=) is looked up in data.js with Object.hasOwn or a fixed list, so an unknown value is ignored.
window.FADCore = (() => {
  const NAME = "Fear, anxiety and despair";
  function stop(message, detail) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = message;
    document.body.prepend(notice);
    console.error(`${NAME}: ${detail}`);
    return null;
  }
  if (!window.FAD) return stop("This mock-up has no study data: data.js did not load. Run build-data.py, then reload.", "window.FAD is missing");
  if (typeof Frame === "undefined" || typeof icon === "undefined" || !window.FADArt) return stop("This mock-up could not load its shared frame or drawings. Reload the page.", "Frame, icon or FADArt is missing");
  const { passages } = window.FAD;

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
    holder.innerHTML = markup; // fixed drawings from art.js and the frame's icons only
    return holder;
  }
  const refLink = (id, text) => h("a", { class: "fad-ref", href: `?ref=${id}`, "data-ref": id }, text ?? passages[id].label);
  const label = (text, extra = "") => h("span", { class: `fad-label ${extra}` }, text);
  const verseText = (id) => passages[id].verses.map((v) => v[1]).join(" ");
  // A quotation the study gives in words that are not the Berean's: marked, with the Berean's words beside it.
  const wording = (w) => h("span", { class: "fad-wording", tabindex: "0", title: `Not the Berean's wording. The Berean reads: “${w.bsb}” (${passages[w.r].label}). For the owner to decide.` }, "†");
  function runs(list, quiet = false) {
    return list.map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return refLink(run.r, run.t);
      if (run.a) return h("a", { class: "fad-link", href: run.a }, run.t);
      if (run.b) return h("strong", {}, runs(run.b, quiet));
      if (run.i) return h("em", {}, run.i);
      if (run.w) return wording(run.w);
      if (run.chk) return h("span", { class: "fad-chk", tabindex: "0", title: `To confirm before publishing: ${run.chk}` }, quiet && run.chk === "check before publishing" ? "†" : "to confirm");
      if ("s" in run) return run.s ? h("a", { class: "fad-link", href: run.s, title: "Mock-up on this PC" }, run.t) : h("em", { class: "fad-study", title: "Not yet a page" }, run.t);
      return "";
    });
  }

  // The site's header and footer, with this site's name and Study lit.
  function mount() {
    const header = Frame.header, footer = Frame.footer;
    const nav = [["/bible", "Bible", "book"], ["/study", "Study", "graduation"], ["/apologetics", "Apologetics", "shield"], ["/teachers", "Teachers", "feather"], ["/resources", "Resources", "library"]];
    Frame.header = () => header()
      .replace(/<nav class="nav"[\s\S]*?<span class="sep"/, `<nav class="nav" aria-label="Main">${nav.map(([to, text, i]) => `<a href="${to}" class="${text === "Study" ? "active" : ""}">${icon(i, 16)}<span>${text}</span></a>`).join("")}<span class="sep"`)
      .replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
    Frame.footer = () => footer().replaceAll("Bible Project", "Bible Guide").replaceAll("../../letters-shared/", "../letters-shared/");
    return Frame.mount();
  }

  // The verse sheet, from the right. Escape closes it (the dialog's own behaviour) and focus returns to the link.
  function sheet() {
    const dialog = h("dialog", { class: "fad-sheet", "aria-labelledby": "fad-sheet-title" });
    document.body.append(dialog);
    let opener = null;
    function open(id, push = true) {
      if (!Object.hasOwn(passages, id)) return;
      const item = passages[id];
      dialog.replaceChildren(
        h("div", { class: "fad-sheet-head" }, h("h2", { id: "fad-sheet-title" }, item.label), h("button", { type: "button", class: "fad-sheet-x", "aria-label": "Close", onclick: () => dialog.close() }, art(icon("x", 18)))),
        h("p", { class: "fad-sheet-text" }, item.verses.map(([cv, text]) => h("span", {}, h("sup", {}, cv), " ", text, " "))),
        h("p", { class: "fad-sheet-src" }, "Berean Standard Bible"));
      if (!dialog.open) dialog.showModal();
      if (push) setParam("ref", id);
    }
    dialog.addEventListener("close", () => {
      setParam("ref", null);
      opener?.focus();
      opener = null;
    });
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a.fad-ref");
      if (!link) return;
      event.preventDefault();
      opener = link;
      open(link.dataset.ref);
    });
    const asked = new URLSearchParams(location.search).get("ref");
    if (asked) open(asked, false);
  }
  function setParam(key, value) {
    const params = new URLSearchParams(location.search);
    if (value === null) params.delete(key); else params.set(key, value);
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  return { NAME, h, art, refLink, label, verseText, runs, mount, sheet, setParam };
})();
