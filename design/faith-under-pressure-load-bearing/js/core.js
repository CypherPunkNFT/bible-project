// Faith under pressure, the load-bearing wall. Shared helpers and the address. All wording comes from the old mock-up's
// data.js, read in place and never edited; text goes in as text nodes, and address values are looked up in maps from data.js.
window.LB = (() => {
  if (!window.FP) {
    const notice = document.createElement("p");
    notice.setAttribute("role", "alert");
    notice.textContent = "This mock-up has no study data: ../faith-under-pressure-directions/data.js did not load.";
    document.body.prepend(notice);
    console.error("Faith under pressure: window.FP is missing, data.js did not load or did not parse");
    return null;
  }
  const { study, passages, pairs, sources } = window.FP;

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs ?? {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
      else el.setAttribute(key, value === true ? "" : value);
    }
    el.append(...kids.flat(Infinity).filter((kid) => kid !== null && kid !== undefined && kid !== false));
    return el;
  }
  const refLink = (id, text) => h("a", { class: "ref", href: `?sheet=${id}`, "data-sheet": id }, text);
  const runs = (list) => list.map((run) => (typeof run === "string" ? run : refLink(run.r, run.t)));
  const plain = (list) => list.map((run) => (typeof run === "string" ? run : run.t)).join("");

  const readings = new Map(study.readings.map((r) => [r.slug, r]));
  const pairIds = new Map(pairs.map((p) => [p.id, p]));
  const sourceIds = new Map(sources.map((s) => [s.id, s]));
  const hasPassage = (id) => Object.hasOwn(passages, id);

  function readAddress() {
    const params = new URLSearchParams(location.search);
    const reading = params.get("reading");
    const sheet = (params.get("sheet") ?? "").replaceAll("–", "-");
    const oneOf = (name, allowed) => (allowed.includes(params.get(name)) ? params.get(name) : allowed[0]);
    const step = Number.parseInt(params.get("step"), 10);
    return {
      reading: readings.has(reading) ? reading : null,
      sheet: hasPassage(sheet) || pairIds.has(sheet) ? sheet : null,
      lens: oneOf("lens", ["whole", "step", "scripture"]),
      step: Number.isInteger(step) && step > 0 ? step : 0,
      view: oneOf("view", ["verses", "calls"]),
      only: oneOf("only", ["all", "P", "C", "G"]),
      older: oneOf("older", ["threads", "list"]),
    };
  }
  function addressFor(s) {
    const params = new URLSearchParams();
    if (s.reading) params.set("reading", s.reading);
    if (s.sheet) params.set("sheet", s.sheet);
    if (s.lens !== "whole") params.set("lens", s.lens);
    if (s.lens === "step" && s.step) params.set("step", s.step);
    if (s.view !== "verses") params.set("view", s.view);
    if (s.only !== "all") params.set("only", s.only);
    if (s.older !== "threads") params.set("older", s.older);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ""}`;
  }

  const app = {
    h, refLink, runs, plain, readings, pairIds, sourceIds, hasPassage, readAddress, addressFor,
    state: readAddress(),
    reduced: matchMedia("(prefers-reduced-motion: reduce)"),
    narrow: matchMedia("(max-width: 720px)"),
    KIND: { P: "Names the pressure", C: "Gives the call", G: "States the ground" },
    // Replaces the address without a history entry; the sheet alone pushes one, so Back closes it.
    remember(change) { app.state = { ...app.state, ...change }; history.replaceState(null, "", addressFor(app.state)); },
    scrollBehavior() { return app.reduced.matches ? "auto" : "smooth"; },
  };
  return app;
})();
