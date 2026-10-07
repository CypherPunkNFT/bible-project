export interface FamilyPerson {
  id: string; n: string; o: string[]; b: string; c: number; s: string; e: string; f: number;
  pa: string[]; ch: string[]; sp: string[]; si: string[];
}
export type FamilyRelation = "parent" | "spouse" | "sibling";
export interface FamilyEdge { from: string; to: string; kind: FamilyRelation }
export interface FamilyPosition { person: FamilyPerson; generation: number; x: number; y: number }
export interface FamilyCluster { id: string; generation: number; members: string[]; parents: string[]; x: number; y: number; width: number; height: number }
export interface GenerationBand { generation: number; y: number; height: number; label: string; numeral: string; compact?: boolean; labelX?: number }
export function generationLabel(generation: number) {
  if (!generation) return "Selected person's generation";
  const labels = generation < 0 ? ["Parents", "Grandparents", "Great-grandparents"] : ["Children", "Grandchildren", "Great-grandchildren"];
  return labels[Math.abs(generation) - 1] ?? `${generation < 0 ? "Ancestors" : "Descendants"} ${Math.abs(generation)} generations away`;
}

/** Recorded parent/child facts become one directed parent -> child edge; other pairs stay undirected. */
export function familyEdges(people: FamilyPerson[]): FamilyEdge[] {
  const known = new Set(people.map(p => p.id));
  const edges = new Map<string, FamilyEdge>();
  const add = (from: string, to: string, kind: FamilyRelation) => {
    if (from === to || !known.has(from) || !known.has(to)) return;
    if (kind !== "parent" && from > to) [from, to] = [to, from];
    edges.set(`${kind}:${from}:${to}`, { from, to, kind });
  };
  for (const p of people) {
    p.pa.forEach(parent => add(parent, p.id, "parent"));
    p.ch.forEach(child => add(p.id, child, "parent"));
    p.sp.forEach(spouse => add(p.id, spouse, "spouse"));
    p.si.forEach(sibling => add(p.id, sibling, "sibling"));
  }
  return [...edges.values()];
}

export function familyBranch(people: FamilyPerson[], edges: FamilyEdge[], root: string, depth: number,
  direction: "both" | "ancestors" | "descendants", spouses: boolean, siblings: boolean, limit = 120, orderedGenerations = false) {
  const byId = new Map(people.map(p => [p.id, p]));
  const levels = new Map<string, number>();
  const parents = new Map<string, string[]>(), children = new Map<string, string[]>();
  for (const e of edges) if (e.kind === "parent") {
    parents.set(e.to, [...(parents.get(e.to) ?? []), e.from]);
    children.set(e.from, [...(children.get(e.from) ?? []), e.to]);
  }
  let omitted = false;
  const add = (id: string, level: number) => {
    if (levels.has(id) || !byId.has(id)) return false;
    if (levels.size >= limit) { omitted = true; return false; }
    levels.set(id, level); return true;
  };
  if (byId.has(root)) add(root, 0);
  const queue = [...levels.keys()];
  for (let index = 0; index < queue.length; index++) {
    const id = queue[index], level = levels.get(id)!;
    if (level <= 0 && level > -depth && direction !== "descendants")
      for (const target of parents.get(id) ?? []) if (add(target, level - 1)) queue.push(target);
    if (level >= 0 && level < depth && direction !== "ancestors")
      for (const target of children.get(id) ?? []) if (add(target, level + 1)) queue.push(target);
  }
  // Longest ancestry paths preserve parent-before-child ordering when related
  // parents provide paths of different lengths. Depth is then a layer boundary.
  if (orderedGenerations && direction !== "both") {
    const outward = new Map<string,string[]>([...levels.keys()].map(id=>[id,[]]));
    const incoming = new Map<string,number>([...levels.keys()].map(id=>[id,0]));
    const ranks = new Map<string,number>([...levels.keys()].map(id=>[id,0]));
    for(const edge of edges) if(edge.kind==="parent" && levels.has(edge.from) && levels.has(edge.to)) {
      const [from,to]=direction==="descendants" ? [edge.from,edge.to] : [edge.to,edge.from];
      outward.get(from)!.push(to); incoming.set(to,incoming.get(to)!+1);
    }
    const pending=[...incoming].filter(([,count])=>count===0).map(([id])=>id);
    for(let i=0;i<pending.length;i++) for(const to of outward.get(pending[i])!) {
      ranks.set(to,Math.max(ranks.get(to)!,ranks.get(pending[i])!+1));
      incoming.set(to,incoming.get(to)!-1); if(incoming.get(to)===0) pending.push(to);
    }
    if(pending.length!==levels.size) throw new Error("The selected genealogy contains a parent-child cycle.");
    for(const [id,rank] of ranks) {
      if(rank>depth) levels.delete(id);
      else levels.set(id,direction==="ancestors" ? -rank : rank);
    }
  }
  // Partners/siblings add context, but do not recursively pull their entire families into this branch.
  const lineage = new Set(levels.keys());
  for (const e of edges) if ((e.kind === "spouse" && spouses) || (e.kind === "sibling" && siblings)) {
    if (lineage.has(e.from)) add(e.to, levels.get(e.from)!);
    else if (lineage.has(e.to)) add(e.from, levels.get(e.to)!);
  }
  const truncated = [...lineage].some(id => (direction!=="descendants" && (parents.get(id) ?? []).some(parent=>byId.has(parent) && !lineage.has(parent))) || (direction!=="ancestors" && (children.get(id) ?? []).some(child=>byId.has(child) && !lineage.has(child))));
  const generations = [...new Set(levels.values())].sort((a, b) => a - b);
  const rows = generations.map(level => [...levels].filter(([, l]) => l === level)
    .map(([id]) => byId.get(id)!).sort((a, b) => Number(b.id === root) - Number(a.id === root) || a.n.localeCompare(b.n)));
  // Order each layer by its relatives in the adjacent layer, rather than by name.
  // Alternating sweeps untangle independent lines without changing any relationship.
  for (let pass = 0; pass < 8; pass++) {
    const downward = pass % 2 === 0;
    for (let step = 0; step < rows.length; step++) {
      const index = downward ? step : rows.length - 1 - step;
      const adjacent = rows[index + (downward ? -1 : 1)];
      if (!adjacent) continue;
      const order = new Map(adjacent.map((p, i) => [p.id, (i + .5) / adjacent.length]));
      const score = (p: FamilyPerson, fallback: number) => {
        const relatives = (downward ? parents : children).get(p.id) ?? [];
        const ranks = relatives.filter(id => order.has(id)).map(id => order.get(id)!);
        return ranks.length ? ranks.reduce((a, b) => a + b, 0) / ranks.length : fallback;
      };
      const ranked = rows[index].map((p, i) => ({ p, rank: score(p, (i + .5) / rows[index].length) }));
      ranked.sort((a, b) => a.rank - b.rank);
      rows[index] = ranked.map(item => item.p);
    }
  }
  // Solve horizontal placement in both directions. Project each row onto its
  // non-overlap constraints with pooled adjacent violators (isotonic regression).
  // Unlike a one-sided shove, this shares displacement across the whole family.
  const pitch = 144;
  const positions: FamilyPosition[] = rows.flatMap((row, index) => row.map((person, i) => ({
    person, generation: generations[index], x: (i - (row.length - 1) / 2) * pitch, y: index * 465 + 25,
  })));
  const placed = new Map(positions.map(p => [p.person.id, p]));
  const visibleEdges = edges.filter(e => placed.has(e.from) && placed.has(e.to) &&
    (e.kind === "parent" || (e.kind === "spouse" && spouses) || (e.kind === "sibling" && siblings)));
  const relatives = (id: string, links: Map<string, string[]>) => (links.get(id) ?? [])
    .map(other => placed.get(other)).filter((p): p is FamilyPosition => !!p);
  for (let pass = 0; pass < 120; pass++) {
    let movement = 0;
    for (let step = 0; step < rows.length; step++) {
      const row = rows[pass % 2 ? rows.length - 1 - step : step];
      const blocks: { start: number; end: number; sum: number; weight: number }[] = [];
      row.forEach((person, i) => {
        const node = placed.get(person.id)!;
        const above = relatives(person.id, parents).filter(p => p.generation < node.generation);
        const below = relatives(person.id, children).filter(p => p.generation > node.generation);
        // Each side has equal influence: a large family must not pull the entire
        // ancestry sideways merely because it has more individual edges.
        const targets: number[] = [];
        if (above.length) targets.push(above.reduce((sum, p) => sum + p.x, 0) / above.length);
        if (below.length) targets.push((Math.min(...below.map(p => p.x)) + Math.max(...below.map(p => p.x))) / 2);
        const target = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : node.x;
        const weight = targets.length || .1;
        blocks.push({ start: i, end: i, sum: (target - i * pitch) * weight, weight });
        while (blocks.length > 1) {
          const right = blocks[blocks.length - 1], left = blocks[blocks.length - 2];
          if (left.sum / left.weight <= right.sum / right.weight) break;
          blocks.splice(-2, 2, { start: left.start, end: right.end, sum: left.sum + right.sum, weight: left.weight + right.weight });
        }
      });
      for (const block of blocks) for (let i = block.start; i <= block.end; i++) {
        const node = placed.get(row[i].id)!;
        const next = block.sum / block.weight + i * pitch;
        movement = Math.max(movement, Math.abs(next - node.x));
        node.x = next;
      }
    }
    if (movement < .01) break;
  }
  // Stagger whole descendant families within a generation, never siblings.
  // Group by the complete recorded parent set, including parents outside this view,
  // so half-sibling families and unknown parentage are never merged by accident.
  const clusters: FamilyCluster[] = [];
  const bands: GenerationBand[] = [];
  let bandTop = 24;
  for (const generation of generations) {
    const row = positions.filter(p => p.generation === generation).sort((a, b) => a.x - b.x);
    const crowded = row.length > 14;
    const groups = new Map<string, FamilyPosition[]>();
    for (const node of row) {
      const parentIds = [...new Set(parents.get(node.person.id) ?? [])].sort();
      const key = parentIds.length ? parentIds.join("|") : `person:${node.person.id}`;
      groups.set(key, [...(groups.get(key) ?? []), node]);
    }
    const entries = [...groups];
    const parentSets = entries.map(([, nodes]) => new Set(parents.get(nodes[0].person.id) ?? []));
    const components = entries.map((_, i) => i);
    const find = (i: number): number => components[i] === i ? i : (components[i] = find(components[i]));
    // Sharing even one recorded parent means siblings: keep their entire row level.
    for (let i = 0; i < entries.length; i++) for (let j = 0; j < i; j++) {
      if ([...parentSets[i]].some(id => parentSets[j].has(id))) components[find(i)] = find(j);
    }
    const lanes = new Map<number, number>();
    entries.forEach((_, i) => { const component = find(i); if (!lanes.has(component)) lanes.set(component, lanes.size % 2); });
    const staggerFamilies = crowded && lanes.size > 1;
    const generationClusters = entries.map(([id, nodes], index) => {
      const width = nodes.length * pitch - 16;
      const center = nodes.reduce((sum, p) => sum + p.x + 76, 0) / nodes.length;
      const x = center * (staggerFamilies ? .6 : 1) - width / 2;
      const stagger = staggerFamilies ? lanes.get(find(index))! * 420 : 0;
      const cluster: FamilyCluster = { id: `${generation}:${id}`, generation, members: nodes.map(n => n.person.id),
        parents: [...parentSets[index]].sort(), x, y: bandTop + 130 + stagger, width, height: 136 };
      nodes.forEach((node, i) => { node.x = x - 12 + i * pitch; node.y = bandTop + 146 + stagger; });
      return cluster;
    });
    // Keep family backdrops apart while allowing the row to recenter as a whole.
    for (let i = 1; i < generationClusters.length; i++) {
      const previous = generationClusters[i - 1], cluster = generationClusters[i];
      const shift = Math.max(0, previous.x + previous.width + (previous.members.length === 1 && cluster.members.length === 1 ? 16 : 40) - cluster.x);
      cluster.x += shift;
      cluster.members.forEach(id => { placed.get(id)!.x += shift; });
    }
    clusters.push(...generationClusters);
    const height = staggerFamilies ? 800 : 380;
    bands.push({ generation, y: bandTop, height, label: generationLabel(generation), numeral: generation ? ["", "I", "II", "III", "IV", "V"][Math.abs(generation)] ?? String(Math.abs(generation)) : "Self" });
    bandTop += height + 420;
  }
  // Allocate an exclusive horizontal corridor to every descendant branch.
  // Width grows with the descendants, so cousins cannot drift into each other's
  // family boxes. Secondary parent relationships are still retained as edges.
  const owned = new Map<string, FamilyCluster[]>();
  const roots: FamilyCluster[] = [];
  for (const cluster of clusters) {
    const candidates = cluster.parents.map(id => placed.get(id)).filter((n): n is FamilyPosition => !!n && n.generation < cluster.generation)
      .sort((a, b) => b.generation - a.generation || Number(b.person.s === "M") - Number(a.person.s === "M") || a.x - b.x);
    const owner = candidates[0];
    if (owner) owned.set(owner.person.id, [...(owned.get(owner.person.id) ?? []), cluster]); else roots.push(cluster);
  }
  const memberWidths = new Map<string, number>();
  const familyGap = 160;
  const measure = (cluster: FamilyCluster): number => {
    const widths = cluster.members.map(id => {
      const branches = owned.get(id) ?? [];
      const width = Math.max(144, branches.reduce((sum, child) => sum + measure(child), 0) + Math.max(0, branches.length - 1) * familyGap);
      memberWidths.set(id, width); return width;
    });
    cluster.width = widths.reduce((a, b) => a + b, 0) + 24;
    return cluster.width;
  };
  roots.forEach(measure);
  // Put the widest descendant subtree in the middle, balancing smaller
  // branches on either side without interleaving their exclusive corridors.
  const centered = <T,>(items: T[], size: (item: T) => number): T[] => {
    if (items.length < 3 || items.every(item => size(item) === size(items[0]))) return items;
    const ranked = [...items].sort((a, b) => size(b) - size(a));
    const middle = ranked.shift()!, left: T[] = [], right: T[] = [];
    let leftWidth = 0, rightWidth = 0;
    for (const item of ranked) {
      if (leftWidth <= rightWidth) { left.unshift(item); leftWidth += size(item); }
      else { right.push(item); rightWidth += size(item); }
    }
    return [...left, middle, ...right];
  };
  // Pack actual per-generation contours instead of full-height rectangles.
  // A short branch can occupy space beside the narrow upper part of a deep one.
  type Shape = { nodes: FamilyPosition[]; boxes: FamilyCluster[] };
  const contour = (shape: Shape) => {
    const result = new Map<number, [number, number]>();
    const include = (generation: number, left: number, right: number) => {
      const old = result.get(generation);
      result.set(generation, old ? [Math.min(old[0], left), Math.max(old[1], right)] : [left, right]);
    };
    shape.nodes.forEach(n => include(n.generation, n.x + 4, n.x + 148));
    shape.boxes.forEach(c => include(c.generation, c.x, c.x + c.width));
    return result;
  };
  const move = (shape: Shape, offset: number) => {
    shape.nodes.forEach(n => { n.x += offset; });
    shape.boxes.forEach(c => { c.x += offset; });
  };
  const pack = (shapes: Shape[], gap: number): Shape => {
    const combined: Shape = { nodes: [], boxes: [] };
    for (const shape of shapes) {
      const existing = contour(combined), incoming = contour(shape);
      let offset = -Infinity;
      for (const [generation, bounds] of incoming) {
        const occupied = existing.get(generation);
        if (occupied) offset = Math.max(offset, occupied[1] + gap - bounds[0]);
      }
      move(shape, Number.isFinite(offset) ? offset : 0);
      combined.nodes.push(...shape.nodes); combined.boxes.push(...shape.boxes);
    }
    return combined;
  };
  const arrange = (cluster: FamilyCluster): Shape => {
    cluster.members = centered(cluster.members, id => memberWidths.get(id)!);
    const shape = pack(cluster.members.map(id => {
      const node = placed.get(id)!;
      const branches = centered(owned.get(id) ?? [], child => child.width);
      const descendants = pack(branches.map(arrange), 64);
      const childCenters = branches.map(c => c.x + c.width / 2);
      node.x = childCenters.length ? (Math.min(...childCenters) + Math.max(...childCenters)) / 2 - 76 : -76;
      return { nodes: [node, ...descendants.nodes], boxes: descendants.boxes };
    }), 16);
    const members = cluster.members.map(id => placed.get(id)!);
    cluster.x = Math.min(...members.map(n => n.x)) + 8;
    cluster.width = Math.max(...members.map(n => n.x + 144)) - cluster.x;
    shape.boxes.push(cluster);
    return shape;
  };
  pack(centered(roots.sort((a, b) => a.x - b.x), c => c.width).map(arrange), 64);
  // Decide tiers AFTER horizontal allocation: a high headcount alone does not
  // make a sparse generation crowded. Alternate families in their visible order.
  bandTop = 24;
  for (const band of bands) {
    const row = clusters.filter(c => c.generation === band.generation).sort((a, b) => a.x - b.x);
    const components = row.map((_, i) => i);
    const find = (i: number): number => components[i] === i ? i : (components[i] = find(components[i]));
    for (let i = 0; i < row.length; i++) for (let j = 0; j < i; j++)
      if (row[i].parents.some(id => row[j].parents.includes(id))) components[find(i)] = find(j);
    const families = [...new Set(row.map((_, i) => find(i)))].map(component => {
      const boxes = row.filter((_, i) => find(i) === component);
      return { component, left: Math.min(...boxes.map(c => c.x)), right: Math.max(...boxes.map(c => c.x + c.width)), count: boxes.reduce((sum, c) => sum + c.members.length, 0) };
    }).sort((a, b) => a.left - b.left);
    const crowded = new Set<number>();
    for (let i = 1; i < families.length; i++) {
      const a = families[i - 1], b = families[i], count = a.count + b.count;
      if (count > 14 && b.left - a.right < pitch * 2 && count * pitch / (b.right - a.left) > .55) {
        crowded.add(a.component); crowded.add(b.component);
      }
    }
    const stagger = crowded.size > 1;
    const members = row.flatMap(c => c.members.map(id => placed.get(id)!));
    const span = Math.max(...members.map(n => n.x)) - Math.min(...members.map(n => n.x)) + 104;
    const compact = members.length <= 3 && span <= 500;
    band.compact = compact;
    band.labelX = compact ? Math.min(...members.map(n => n.x)) - 220 : 30;
    const lanes = new Map<number, number>();
    row.forEach((cluster, i) => {
      const component = find(i);
      if (!lanes.has(component) && crowded.has(component)) lanes.set(component, lanes.size % 2);
      cluster.y = bandTop + (compact ? 20 : 130) + (stagger ? (lanes.get(component) ?? 0) * 420 : 0);
      cluster.members.forEach(id => { placed.get(id)!.y = cluster.y + 16; });
    });
    band.y = bandTop; band.height = compact ? 180 : stagger ? 800 : 380;
    bandTop += band.height + (compact ? 100 : 420);
  }
  const left = Math.min(0, ...clusters.map(c => c.x));
  const shift = 250 - left;
  positions.forEach(p => { p.x += shift; });
  clusters.forEach(c => { c.x += shift; });
  bands.forEach(b => { if (b.compact) b.labelX! += shift; });
  const width = Math.max(500, ...clusters.map(c => c.x + c.width + 24));
  const height = bands.length ? bands[bands.length - 1].y + bands[bands.length - 1].height + 24 : 180;
  return { positions, width, height, omitted, truncated, edges: visibleEdges, clusters, bands };
}
