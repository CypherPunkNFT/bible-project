// Where each person on the tree wants to be for a given state. The tree grows upward: roots at the bottom (Kish;
// Boaz, Ruth, Obed, Jesse), the kings above, wives on an arc, and the sons as the canopy. Saul's house stands to the
// left (on a phone, above). Springs in tree.js pull every node toward these targets.
(() => {
  const D = "david-rut-4-17", SAUL = "saul-1sa-9-2", PALTI = "palti-1sa-25-44", BATH = "bathsheba-2sa-11-3";
  const WIDE = {
    kish: [.15, .955], saul: [.15, .77], kin: [.05, .86], spouse: [.255, .86], saulKids: [.045, .285, .56], grand: .385, seven: [.175, .385],
    palti: [.3, .37], michalAway: [.262, .44], sag: .03,
    cx: .635, roots: { "boaz-rut-2-1": -.205, "ruth-rut-1-4": -.15, "obed-rut-4-17": -.095, "jesse-rut-4-17": 0 }, rootY: .955, david: .7,
    sibs: [-.275, -.06, .865], sisters: [.075, .14, .865], nephewY: .765, nephewGap: .036,
    wives: [.345, .975, .52, .045], tiers: [.3, .2, .115], tierCount: 2,
    court: { "samuel-1sa-1-20": [-.1, .63], "nathan-2sa-7-2": [.105, .625], "gad-1sa-22-5": [-.155, .69], "zadok-2sa-8-17": [.185, .625], "benaiah-2sa-8-18": [.235, .665], "abiathar-1sa-22-20": [.285, .625] },
    uriah: [.035, .085], ghostRow: [.84, .97, .1],
  };
  const NARROW = {
    kish: [.18, .292], saul: [.3, .218], kin: [.1, .24], spouse: [.52, .24], saulKids: [.09, .66, .132], grand: .052, seven: [.42, .052],
    palti: [.87, .085], michalAway: [.82, .15], sag: .012,
    cx: .5, roots: { "boaz-rut-2-1": -.37, "ruth-rut-1-4": -.24, "obed-rut-4-17": -.12, "jesse-rut-4-17": 0 }, rootY: .975, david: .84,
    sibs: [-.43, -.13, .915], sisters: [.2, .36, .915], nephewY: .865, nephewGap: .085,
    wives: [.06, .94, .665, .018], tiers: [.565, .52, .475, .43], tierCount: 4,
    court: { "samuel-1sa-1-20": [-.22, .76], "nathan-2sa-7-2": [.24, .75], "gad-1sa-22-5": [-.34, .79], "zadok-2sa-8-17": [.34, .715], "benaiah-2sa-8-18": [.44, .7], "abiathar-1sa-22-20": [.26, .7] },
    uriah: [.06, .05], ghostRow: [.62, .94, .39],
  };

  // Is this node on the tree under the current list (2 Samuel or 1 Chronicles)?
  const shown = (st, id, mode) => (st.visible.has(id) || st.ghost.has(id)) && (mode === "chronicles" || !H.chronicles.chroniclesOnly.includes(id));
  const spread = (n, a, b) => Array.from({ length: n }, (_, i) => (n === 1 ? (a + b) / 2 : a + ((b - a) * i) / (n - 1)));

  function targets(st, W, Ht, mode) {
    const L = W >= 820 ? WIDE : NARROW, T = new Map();
    const put = (id, fx, fy) => T.set(id, { x: fx * W, y: fy * Ht });
    const tree = H.tree.filter((n) => shown(st, n.id, mode));
    const of = (pred) => tree.filter(pred);

    // Saul's house
    put("kish-1sa-9-1", ...L.kish); put(SAUL, ...L.saul);
    of((n) => n.role === "kin").forEach((n) => put(n.id, ...L.kin));
    of((n) => n.house === "saul" && n.role === "spouse").forEach((n) => put(n.id, ...L.spouse));
    const saulKids = of((n) => n.house === "saul" && n.role === "child" && !st.wed.has(n.id) && !st.unwed.has(n.id));
    spread(saulKids.length, L.saulKids[0], L.saulKids[1]).forEach((x, i) => put(saulKids[i].id, x, L.saulKids[2] + (L.tierCount > 2 && i % 2 ? .03 : 0)));
    for (const n of of((n) => n.role === "grandchild")) {
      const p = T.get(n.parent);
      if (n.parent === SAUL) put(n.id, ...L.seven); else T.set(n.id, { x: p ? p.x : L.saulKids[0] * W, y: L.grand * Ht });
    }
    put(PALTI, ...L.palti);
    for (const id of st.unwed) if (shown(st, id, mode)) put(id, ...L.michalAway);
    if (st.sag.saul) for (const n of tree) if (n.house === "saul" && n.role !== "root" && T.has(n.id)) T.get(n.id).y += L.sag * Ht * st.sag.saul;

    // David's roots, his brothers and sisters, their sons
    for (const [id, dx] of Object.entries(L.roots)) put(id, L.cx + dx, L.rootY);
    put(D, L.cx, L.david);
    const sibs = of((n) => n.role === "sibling");
    spread(sibs.length, L.cx + L.sibs[0], L.cx + L.sibs[1]).forEach((x, i) => put(sibs[i].id, x, L.sibs[2]));
    const sisters = of((n) => n.role === "sister");
    sisters.forEach((n, i) => put(n.id, L.cx + (i ? L.sisters[1] : L.sisters[0]), L.sisters[2]));
    const byParent = {};
    for (const n of of((n) => n.role === "nephew")) (byParent[n.parent] ??= []).push(n);
    for (const [pid, kids] of Object.entries(byParent)) {
      const p = T.get(pid); if (!p) continue;
      const half = ((kids.length - 1) * L.nephewGap) / 2;
      kids.forEach((n, i) => T.set(n.id, { x: p.x + (i * L.nephewGap - half) * W + (pid === "zeruiah-1sa-26-6" ? -.012 * W : .02 * W), y: L.nephewY * Ht }));
    }

    // Wives on an arc, each with a share of the canopy for her sons
    const wives = of((n) => n.wife !== undefined && st.wed.has(n.id)).sort((a, b) => a.wife - b.wife);
    const kidsOf = (wid) => of((n) => n.role === "son" && n.mother === wid);
    const weights = wives.map((w) => Math.max(1.35, kidsOf(w.id).length * .8));
    const total = weights.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const [x0, x1, wy, lift] = L.wives;
    wives.forEach((w, i) => {
      const u0 = acc / total, u1 = (acc + weights[i]) / total, u = (u0 + u1) / 2; acc += weights[i];
      const x = x0 + (x1 - x0) * u;
      put(w.id, x, wy - lift * Math.sin(Math.PI * u));
      const kids = kidsOf(w.id), a = x0 + (x1 - x0) * u0, b = x0 + (x1 - x0) * u1, pad = (b - a) * .12;
      spread(kids.length, kids.length > 1 ? a + pad : x, kids.length > 1 ? b - pad : x).forEach((kx, k) => put(kids[k].id, kx, L.tiers[k % L.tierCount]));
    });
    // On a phone the canopy is narrow: sons take turns across four heights, left to right, so names do not collide
    if (L.tierCount > 2) {
      const sons = of((n) => n.role === "son" && T.has(n.id)).sort((p, q) => T.get(p.id).x - T.get(q.id).x);
      sons.forEach((n, i) => { T.get(n.id).y = L.tiers[i % L.tierCount] * Ht; });
      wives.forEach((w, i) => { if (i % 2) T.get(w.id).low = true; });
    }
    // Sons named before their mother enters the story float, unattached, at the canopy's edge
    const loose = of((n) => n.role === "son" && !T.has(n.id));
    spread(loose.length, L.ghostRow[0], L.ghostRow[1]).forEach((x, i) => put(loose[i].id, x, L.ghostRow[2] + (i % 2) * .04));

    // The court: prophets, priests, Benaiah; Uriah stands beside Bath-sheba
    for (const [id, [dx, fy]] of Object.entries(L.court)) if (shown(st, id, mode)) put(id, L.cx + dx, fy);
    const bath = T.get(BATH);
    if (shown(st, "uriah-2sa-11-3", mode)) T.set("uriah-2sa-11-3", bath ? { x: bath.x + L.uriah[0] * W, y: bath.y + L.uriah[1] * Ht } : { x: .9 * W, y: .45 * Ht });

    // Moves: a step can send someone toward another person, away to the edge, or up and down
    const s = Math.max(.6, Math.min(1.2, W / 1400));
    const base = new Map([...T].map(([k, v]) => [k, { ...v }]));
    for (const [id, m] of Object.entries(st.moves)) {
      const t = T.get(id); if (!t) continue;
      if (m.toward && base.get(m.toward)) { const o = base.get(m.toward); t.x += (o.x - t.x) * m.f; t.y += (o.y - t.y) * m.f + 14; }
      if (m.away) { t.x = W - 30 * s; t.y = Math.min(t.y, Ht * .42); }
      if (m.dx) t.x += m.dx * s; if (m.dy) t.y += m.dy * s;
      if (m.shrink) t.shrink = true;
    }
    for (const t of T.values()) t.y = Math.max(t.y, (W >= 820 ? .08 : .045) * Ht);
    return T;
  }

  window.HouseLayout = { targets, shown, isWide: (W) => W >= 820 };
})();
