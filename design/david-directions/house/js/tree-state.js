// The house's state at any step of the telling: who is on the tree, who has died, who wears which crown.
// States are rebuilt by replaying the steps' ops from the start, so scrubbing backwards is exact.
(() => {
  const blank = () => ({ visible: new Set(), ghost: new Set(), dead: new Set(), wed: new Set(), unwed: new Set(),
    crown: { israel: null, judah: null }, lastHolder: { israel: null, judah: null }, rival: null, oil: 0,
    links: new Map(), moves: {}, sag: { saul: 0 }, promise: false, focus: [] });
  const key = (a, b) => [a, b].sort().join("|");

  function apply(st, ops = {}) {
    for (const id of ops.add ?? []) st.visible.add(id);
    for (const id of ops.ghost ?? []) st.ghost.add(id);
    for (const id of ops.unghost ?? []) { st.ghost.delete(id); st.visible.add(id); }
    for (const id of ops.wed ?? []) { st.visible.add(id); st.wed.add(id); st.unwed.delete(id); }
    for (const id of ops.unwed ?? []) { st.wed.delete(id); st.unwed.add(id); }
    for (const id of ops.die ?? []) st.dead.add(id);
    if (ops.crown) for (const realm of ["israel", "judah"]) if (realm in ops.crown) {
      if (st.crown[realm]) st.lastHolder[realm] = st.crown[realm];
      st.crown[realm] = ops.crown[realm];
    }
    if ("rival" in ops) st.rival = ops.rival;
    if (ops.oil) st.oil = ops.oil;
    for (const [a, b, kind] of ops.link ?? []) st.links.set(key(a, b), { a, b, kind });
    for (const [a, b] of ops.unlink ?? []) st.links.delete(key(a, b));
    for (const [id, spec] of Object.entries(ops.move ?? {})) { if (spec) st.moves[id] = spec; else delete st.moves[id]; }
    if (ops.sag) Object.assign(st.sag, ops.sag);
    if (ops.promise) st.promise = true;
    return st;
  }

  const cache = new Map();
  // The state once step i has happened (i = -1 is the empty stage).
  function at(i) {
    if (cache.has(i)) return cache.get(i);
    const st = blank();
    for (let k = 0; k <= i; k++) apply(st, H.steps[k].ops);
    st.focus = H.steps[i]?.focus ?? [];
    cache.set(i, st);
    return st;
  }
  // The succession drama: the state before its step, then beats 0..b of 1 Kings 1.
  function drama(b) {
    const base = H.steps.findIndex((s) => s.drama);
    const st = blank();
    for (let k = 0; k < base; k++) apply(st, H.steps[k].ops);
    for (let k = 0; k <= b; k++) apply(st, H.drama[k].ops);
    st.focus = H.drama[b]?.focus ?? [];
    return st;
  }
  // Every step whose focus names this person: the "in this telling" chips on their panel.
  const stepsFor = (id) => H.steps.filter((s) => s.focus?.includes(id) || s.ops.add?.includes(id) || s.ops.die?.includes(id)).map((s) => s.index);
  const deathStep = (id) => H.steps.find((s) => s.ops.die?.includes(id));

  window.HouseState = { at, drama, stepsFor, deathStep };
})();
