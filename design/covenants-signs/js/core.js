// Shared by the page's parts: the study data, small builders, and the page's one state kept in the address.
// All study text goes in as text nodes. The only markup strings are the fixed drawings in signs.js.
window.Cov = (() => {
  const data = window.CP;
  if (!data) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = "This mock-up has no study data: ../covenants-and-promises-directions/data.js did not load.";
    document.body.prepend(notice);
    throw new Error("Covenants: window.CP is missing, data.js did not load or did not parse");
  }
  const SVG_NS = "http://www.w3.org/2000/svg";
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
  function s(tag, attributes = {}, text) {
    const element = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function art(markup, className) {
    const holder = document.createElement("span");
    if (className) holder.className = className;
    holder.innerHTML = markup; // fixed drawings only
    return holder;
  }
  const miniSign = (slug, size = 40) => art(`<svg viewBox="-24 -24 48 48" width="${size}" height="${size}" aria-hidden="true">${CovSigns.mini[slug]}</svg>`, "cv-mini");
  const refLink = (id, text) => h("a", { class: "cv-ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  const QUESTIONS = [["speaks", "Who speaks"], ["whom", "To whom"], ["promised", "What is promised"], ["asked", "What is asked"], ["sign", "What sign"]];
  const readings = new Map(data.study.readings.map((r) => [r.slug, r]));
  const lineIds = new Map(data.lines.map((l) => [l.id, l]));
  const worldName = (slug) => data.covenants[slug] ?? "Heirs";

  // ── The address holds every choice, so a shared link opens the same view ──
  const DEFAULTS = { world: data.study.readings[0].slug, q: "sign", reading: null, sheet: null, stone: null, later: "disc", map: "0", drawing: "a" };
  const allowed = {
    world: (v) => readings.has(v),
    q: (v) => QUESTIONS.some(([key]) => key === v),
    reading: (v) => readings.has(v),
    sheet: (v) => v in data.passages || lineIds.has(v),
    stone: (v) => v in data.covenants,
    later: (v) => v === "disc" || v === "list",
    map: (v) => /^[0-3]$/.test(v),
    drawing: (v) => /^[1-4a-i]$/.test(v),
  };
  function readAddress() {
    const params = new URLSearchParams(location.search);
    const next = { ...DEFAULTS };
    for (const key of Object.keys(DEFAULTS)) {
      const value = (params.get(key) ?? "").replaceAll("–", "-");
      if (value && allowed[key](value)) next[key] = value;
    }
    return next;
  }
  function addressFor(state) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(state)) if (value !== null && value !== DEFAULTS[key]) params.set(key, value);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }
  const listeners = [];
  const api = {
    ...data, h, s, art, miniSign, refLink, runs, plain, QUESTIONS, readings, lineIds, worldName,
    state: readAddress(),
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)"),
    onChange(listener) { listeners.push(listener); },
    set(change, { push = false } = {}) {
      const before = api.state;
      api.state = { ...before, ...change };
      history[push ? "pushState" : "replaceState"](null, "", addressFor(api.state));
      for (const listener of listeners) listener(api.state, before);
    },
    fromAddress() {
      const before = api.state;
      api.state = readAddress();
      for (const listener of listeners) listener(api.state, before);
    },
    // One tab stop for a row of controls; the arrow keys move inside it.
    roving(container, selector, activate) {
      container.addEventListener("keydown", (event) => {
        const items = [...container.querySelectorAll(selector)];
        const at = items.indexOf(document.activeElement);
        if (at < 0) return;
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        const target = step ? (at + step + items.length) % items.length : { Home: 0, End: items.length - 1 }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        items[target].focus();
        activate?.(items[target]);
      });
    },
  };
  addEventListener("popstate", () => api.fromAddress());
  return api;
})();
