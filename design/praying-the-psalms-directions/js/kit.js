// The book of Psalms: small helpers shared by the page's three scripts. All text goes in as text nodes; the only
// markup strings are the fixed drawings in art.js and the frame's icons. Ids from data.js or the address are looked
// up with Object.hasOwn or a strict pattern, so an unknown value is ignored rather than trusted.
window.PSKit = (() => {
  const data = window.PS;
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
  // A reference id is a passage key in data.js, a psalm (PS.n) or a run of psalms (PSR.a-b).
  function known(id) {
    if (typeof id !== "string") return false;
    if (data && Object.hasOwn(data.passages, id)) return true;
    const one = /^PS\.(\d{1,3})$/.exec(id);
    if (one) return +one[1] >= 1 && +one[1] <= 150;
    const run = /^PSR\.(\d{1,3})-(\d{1,3})$/.exec(id);
    return !!run && +run[1] >= 1 && +run[1] < +run[2] && +run[2] <= 150;
  }
  const refLink = (id, text) => h("a", { class: "ps-ref", href: `?ref=${encodeURIComponent(id)}`, "data-ref": id }, text);
  const safeHref = (url) => (typeof url === "string" && /^\/(?!\/)[^\s\\<>"']*$/.test(url) ? url : null);
  function runs(list) {
    return (list || []).map((run) => {
      if (typeof run === "string") return run;
      if (run.r) return known(run.r) ? refLink(run.r, run.t) : run.t;
      if (run.a) return safeHref(run.a) ? h("a", { class: "ps-link", href: safeHref(run.a) }, run.t) : run.t;
      if (run.b) return h("strong", {}, runs(run.b));
      if (run.i) return h("em", {}, run.i);
      if ("s" in run) return safeHref(run.s) ? h("a", { class: "ps-link", href: safeHref(run.s) }, h("em", {}, run.t)) : h("em", {}, run.t);
      return "";
    });
  }
  const label = (text) => h("span", { class: "ps-label" }, text);
  const psalm = (n) => data.psalms[n - 1];
  const bookName = (n) => `Book ${["I", "II", "III", "IV", "V"][n - 1]}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  return { data, h, art, known, refLink, runs, label, psalm, bookName, plural, reduced };
})();
