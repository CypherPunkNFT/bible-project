// "Why a computer does not simply count the copies", expanded for direction D: the method in five short steps beside an
// illustrative textual flow diagram. The diagram is drawn for this study: the sigla are examples and every link is
// invented. It is not INTF's diagram, not INTF's data and not a calculation. Choosing a witness lights its path to A.
(() => {
  const { cite } = PMX;
  const STEPS = [
    ["No original, no early complete copy", "No autograph of any New Testament writing survives. The earliest papyrus fragments date from the second century, the first complete copies (Sinaiticus and Vaticanus) from the fourth, and most of the roughly 5,700 manuscripts from the second millennium. The text at the start of the tradition, the <em>initial text</em>, has to be reconstructed."],
    ["Texts, not books", "Gerd Mink’s Coherence-Based Genealogical Method (CBGM), developed at the INTF for the Editio Critica Maior, compares the states of text that manuscripts carry, not the books themselves. A late manuscript can preserve an early text; scribes can combine sources."],
    ["One variant at a time", "At each place where witnesses differ, editors judge which reading most likely gave rise to the others: a <em>local stemma</em>. The method then combines thousands of these local judgments into a picture of how whole texts relate."],
    ["Potential ancestors and coherence", "Where text X more often has the earlier reading than text Y, X is a <em>potential ancestor</em> of Y. <em>Coherence</em> is how closely two texts agree, together with which way the flow mostly runs between them. A textual flow diagram joins each witness to its closest potential ancestor."],
    ["Hypotheses, not a family tree", "The method does not draw stemmata automatically or make textual decisions by itself. Coincidental agreement, mixed ancestry and lost witnesses complicate reconstruction, so the results are hypotheses about texts: inspectable, not infallible. No CBGM calculation is performed by this study."],
  ];

  // Invented flow: id → [x, y, closest potential ancestor, second ancestor (mixture)].
  const NODES = {
    A: [230, 32], P74: [110, 104, "A"], "03": [230, 104, "A"], "01": [350, 104, "A"],
    "02": [56, 180, "P74"], P45: [146, 180, "03"], 1175: [236, 180, "03"], 33: [322, 180, "01"], "05": [410, 180, "01"],
    1739: [56, 256, "02"], 81: [236, 256, "1175"], 614: [410, 256, "05"],
    307: [26, 332, "1739"], 453: [100, 332, "1739"], 1891: [320, 332, "614", "1739"], 2818: [430, 332, "614"],
  };
  const VARIANT = new Set(["05", "614", "2818", "1891"]);
  const pathTo = (id) => { const out = [id]; while (NODES[out[out.length - 1]][2]) out.push(NODES[out[out.length - 1]][2]); return out; };
  const edge = (from, to, cls = "") => { const [x1, y1] = NODES[from], [x2, y2] = NODES[to]; return `<path class="cb-edge ${cls}" data-edge="${from}>${to}" d="M${x1} ${y1 + 15}C${x1} ${(y1 + y2) / 2} ${x2} ${(y1 + y2) / 2} ${x2} ${y2 - 15}"/>`; };

  function say(id) {
    if (!id) return "Each line joins a witness to its closest <b>potential ancestor</b>: the text that, where the two differ, more often has the reading judged earlier. The stronger the <b>coherence</b> (agreement, plus which way the flow runs), the closer the link. Choose a witness to light its path to A.";
    if (id === "A") return "<b>A · the initial text.</b> Reconstructed by editors, not a surviving manuscript. Every line in the diagram ultimately leads back here.";
    const chain = pathTo(id).join(" → "), [, , parent, second] = NODES[id];
    let line = `<b>${id}</b> · closest potential ancestor here: <b>${parent}</b>. Path to the initial text: ${chain}.`;
    if (id === "05") line += " In this schematic a different reading arises at this point and is passed on to its descendants.";
    else if (second) line += ` Mixed ancestry: it also draws on ${second}, so one line cannot describe it.`;
    else if (VARIANT.has(id)) line += " It inherits the reading that arose at 05.";
    return line;
  }

  function mount(el) {
    const edges = Object.entries(NODES).filter(([, n]) => n[2]).map(([id, n]) => edge(n[2], id, VARIANT.has(id) && n[2] !== "1739" ? "is-var" : "")).join("") + edge("1739", "1891", "is-mix");
    const nodes = Object.entries(NODES).map(([id, [x, y]]) => `<g class="cb-node${id === "A" ? " is-a" : ""}${VARIANT.has(id) ? " is-var" : ""}${NODES[id][3] ? " is-mixed" : ""}" data-node="${id}" tabindex="0" role="button" aria-label="Witness ${id}"><circle cx="${x}" cy="${y}" r="${id === "A" ? 19 : 15}"/><text x="${x}" y="${y + 4}">${id}</text></g>`).join("");
    const [vx, vy] = [380, 142];
    el.classList.add("cb");
    el.innerHTML = `<div class="cb-text"><p class="kicker">Why a computer does not simply count the copies</p>
        <ol class="cb-steps">${STEPS.map(([t, p], i) => `<li><span>0${i + 1}</span><b>${esc(t)}</b><p>${p}</p></li>`).join("")}</ol>${cite(["genealogy", "mink"])}</div>
      <figure class="cb-fig"><svg class="cb-svg" viewBox="0 0 460 362" aria-label="Illustrative textual flow diagram">${edges}
          <g class="cb-arise"><circle cx="${vx}" cy="${vy}" r="4"/><text x="${vx + 10}" y="${vy + 3}">new reading</text></g>${nodes}</svg>
        <figcaption><b>Illustrative schematic of a textual flow diagram · not a real calculation.</b> Drawn for this study after the kind of diagram the INTF publishes; the sigla are examples and every link is invented.</figcaption>
        <p class="cb-say" role="status">${say(null)}</p>
        <p class="cb-key"><span><i class="k-flow"></i>Closest potential ancestor</span><span><i class="k-var"></i>Carries the new reading</span><span><i class="k-mix"></i>Second source (mixture)</span></p></figure>`;
    const svg = el.querySelector(".cb-svg"), out = el.querySelector(".cb-say");
    let pinned = null;
    const light = (id) => {
      const chain = id ? pathTo(id) : [], on = new Set(chain);
      svg.classList.toggle("is-lit", !!id);
      svg.querySelectorAll("[data-node]").forEach((g) => g.classList.toggle("is-on", on.has(g.dataset.node)));
      svg.querySelectorAll("[data-edge]").forEach((p) => { const [f, t] = p.dataset.edge.split(">"); p.classList.toggle("is-on", on.has(t) && NODES[t][2] === f && on.has(f)); p.classList.toggle("is-on-mix", t === id && NODES[t][3] === f); });
      out.innerHTML = say(id);
    };
    svg.addEventListener("pointerover", (e) => { const g = e.target.closest("[data-node]"); if (g) light(g.dataset.node); });
    svg.addEventListener("pointerleave", () => light(pinned));
    svg.addEventListener("click", (e) => { const g = e.target.closest("[data-node]"); pinned = g && g.dataset.node !== pinned ? g.dataset.node : null; light(pinned); });
    svg.addEventListener("keydown", (e) => { const g = e.target.closest("[data-node]"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pinned = g.dataset.node; light(pinned); } });
  }
  window.CBGM = { mount };
})();
