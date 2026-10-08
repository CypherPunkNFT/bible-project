// Builds the helix scene: strands, crystals, rungs, the crown, star dust, lights, and the labels that float over it.
import { H, R, TOP, CAP_Y, strandPoint, crystalPoint, chroniclesRuns } from "./helix-geometry.js";
import { esc, KIND, clamp01 } from "./util.js";

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const isDark = () => document.documentElement.dataset.theme === "dark";

export function buildScene(THREE, renderer, data, labelsEl) {
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x0b0d13, 20, 80);
  scene.fog = fog;
  scene.environment = studioEnvironment(THREE, renderer);

  class HelixCurve extends THREE.Curve {
    constructor(y0, y1, strand) { super(); this.y0 = y0; this.y1 = y1; this.strand = strand; }
    getPoint(t, target = new THREE.Vector3()) { const [x, y, z] = strandPoint(this.y0 + t * (this.y1 - this.y0), this.strand); return target.set(x, y, z); }
  }
  const halo = haloTexture(THREE);
  const labels = [];
  const addLabel = (l, html, tag = "div", attrs = "") => {
    const el = document.createElement(tag);
    el.className = `lbl lbl-${l.type}`;
    el.hidden = true;
    el.innerHTML = html;
    if (tag === "button") el.type = "button";
    for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
    labelsEl.append(el);
    labels.push({ ...l, el, x: null, y: null, pos: l.pos ?? new THREE.Vector3() });
  };

  // ── Materials (colours filled by applyTheme) ──
  const M = {
    gold: new THREE.MeshStandardMaterial({ metalness: 0.85, roughness: 0.26 }),
    goldBead: new THREE.MeshStandardMaterial({ metalness: 0.7, roughness: 0.3, transparent: true, opacity: 0.6 }),
    yearBead: new THREE.MeshStandardMaterial({ metalness: 0.8, roughness: 0.25 }),
    silver: new THREE.MeshStandardMaterial({ metalness: 0.9, roughness: 0.2 }),
    silverGhost: new THREE.MeshStandardMaterial({ metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.35 }),
    axis: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 }),
    ring: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35 }),
    ringKey: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.8 }),
    stem: new THREE.LineBasicMaterial({ transparent: true, opacity: 0.5 }),
    stemDash: new THREE.LineDashedMaterial({ transparent: true, opacity: 0.55, dashSize: 0.16, gapSize: 0.13 }),
    rung: new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.4, transparent: true, opacity: 0.75 }),
    sel: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 }),
    pick: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
  };

  // ── The gold strand: 1 Samuel 16 – 1 Kings 2 ──
  const reignTube = new THREE.Mesh(new THREE.TubeGeometry(new HelixCurve(30, 70, "sk"), 1200, 0.2, 10, false), M.gold);
  const preHair = new THREE.Mesh(new THREE.TubeGeometry(new HelixCurve(0, 30, "sk"), 600, 0.04, 6, false), M.goldBead);
  const sphere = new THREE.SphereGeometry(1, 12, 8);
  const preBeads = new THREE.InstancedMesh(sphere, M.goldBead, 121);
  const yearBeads = new THREE.InstancedMesh(sphere, M.yearBead, 41);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < 121; i++) { const [x, y, z] = strandPoint(i * 0.25); m4.makeScale(0.1, 0.1, 0.1).setPosition(x, y, z); preBeads.setMatrixAt(i, m4); }
  for (let i = 0; i <= 40; i++) { const [x, y, z] = strandPoint(30 + i); const s = i % 10 === 0 ? 0.36 : 0.26; m4.makeScale(s, s, s).setPosition(x, y, z); yearBeads.setMatrixAt(i, m4); }
  scene.add(reignTube, preHair, preBeads, yearBeads);

  // ── The silver strand: 1 Chronicles 11–29, with its silences ──
  const runs = chroniclesRuns(data.chronicles).map(([a, b]) => ({ a, b, mesh: new THREE.Mesh(new THREE.TubeGeometry(new HelixCurve(a, b, "chr"), Math.max(8, Math.round((b - a) * 30)), 0.17, 10, false), M.silver) }));
  runs.forEach((r) => scene.add(r.mesh));
  const ghostYears = [];
  for (let y = 30; y < data.chronicles.start - 0.1; y += 0.3) ghostYears.push(y);
  for (const g of data.chronicles.gaps) for (let y = g.from + 0.25; y < g.to - 0.1; y += 0.42) ghostYears.push(y);
  const ghosts = new THREE.InstancedMesh(sphere, M.silverGhost, ghostYears.length);
  ghostYears.forEach((y, i) => { const [x, yy, z] = strandPoint(y, "chr"); m4.makeScale(0.09, 0.09, 0.09).setPosition(x, yy, z); ghosts.setMatrixAt(i, m4); });
  scene.add(ghosts);

  // ── Axis and year rings ──
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), M.axis);
  scene.add(axis);
  const ringMarks = [[0, "Year 0", false], [10, "10", false], [20, "20", false], [30, "30 · king at Hebron", true], [37.5, "37½ · king over all Israel", true], [50, "50", false], [60, "60", false], [70, "70 · death", true]];
  const rings = ringMarks.map(([y, text, key]) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(key ? 2.2 : 1.4, key ? 0.05 : 0.03, 6, 64), key ? M.ringKey : M.ring);
    m.rotation.x = Math.PI / 2; m.position.y = y * H; scene.add(m);
    addLabel({ type: "year", year: y, major: key, pos: new THREE.Vector3(0, y * H, 0) }, `<span>${esc(text)}</span>`);
    return { y, m };
  });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false, opacity: 0.35 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.2; scene.add(ground);

  // ── Crystals ──
  const pickables = [];
  const geoms = {};
  const crystals = data.crystals.map((c, i) => {
    const geom = geoms[c.kind] ?? (geoms[c.kind] = crystalGeometry(THREE, c.kind));
    const group = new THREE.Group();
    group.position.set(...crystalPoint(c));
    const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.16, metalness: 0.08, clearcoat: 1, clearcoatRoughness: 0.08, flatShading: true, transparent: true, envMapIntensity: 1.25 });
    const mesh = new THREE.Mesh(geom, mat);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geom, 18), new THREE.LineBasicMaterial({ transparent: true }));
    mesh.add(edges);
    mesh.rotation.set(Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.3);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false }));
    glow.scale.setScalar(c.dated ? 4.6 : 3.4);
    const picker = new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 6), M.pick);
    picker.userData = { type: "crystal", id: c.id };
    group.add(glow, mesh, picker);
    pickables.push(picker);
    let beam = null;
    if (c.anointing) {
      const g = new THREE.CylinderGeometry(0.01, 0.13, 6, 12, 1, true); g.translate(0, 3, 0);
      beam = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      group.add(beam);
    }
    // The stem joins the crystal to its strand: solid where Scripture dates the moment, dashed where it does not.
    const a = new THREE.Vector3(...strandPoint(c.year, c.strand)), b = group.position.clone();
    const stem = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), c.dated ? M.stem : M.stemDash);
    if (!c.dated) stem.computeLineDistances();
    scene.add(group, stem);
    addLabel({ type: "crystal", id: c.id, data: c, pos: group.position }, `<i>${window.icon(KIND[c.kind].icon, 13, 1.8)}</i><span>${esc(c.label)}</span>${c.dated ? `<em>${c.dated.reignYear === 1 ? "Year 1" : c.dated.reignYear === 40 ? "Year 40" : `Year ${c.dated.reignYear}`}</em>` : ""}`, "button", { "data-pick": "crystal", "data-id": c.id, style: `--c: var(--k-${c.kind})`, tabindex: "-1" });
    return { data: c, group, mesh, edges, halo: glow, stem, beam, scale: 1, phase: i * 1.7 };
  });

  // ── Rungs: where the two accounts differ ──
  const barGeom = new THREE.CylinderGeometry(0.075, 0.075, 1, 8);
  const rungs = data.rungs.map((r) => {
    const a = new THREE.Vector3(...strandPoint(r.year, "sk")), b = new THREE.Vector3(...strandPoint(r.year, "chr"));
    const bar = new THREE.Mesh(barGeom, M.rung);
    bar.position.copy(a).add(b).multiplyScalar(0.5);
    bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    const len = a.distanceTo(b);
    const holder = new THREE.Group(); holder.position.copy(bar.position); holder.quaternion.copy(bar.quaternion);
    bar.position.set(0, 0, 0); bar.quaternion.identity(); bar.geometry = barGeom; holder.scale.set(1, len, 1);
    holder.add(bar);
    const beadPos = a.clone().lerp(b, 0.3);
    const bead = new THREE.Mesh(new THREE.OctahedronGeometry(0.42), new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.3, transparent: true }));
    bead.position.copy(beadPos);
    const picker = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), M.pick);
    picker.userData = { type: "rung", id: r.id };
    bead.add(picker);
    pickables.push(picker);
    scene.add(holder, bead);
    addLabel({ type: "rung", id: r.id, data: r, pos: beadPos }, `<i>≠</i><span>${esc(r.topic)}</span>`, "button", { "data-pick": "rung", "data-id": r.id, tabindex: "-1" });
    return { data: r, bar: holder, barMesh: bar, bead, len };
  });
  for (const g of data.chronicles.gaps) {
    const mid = (g.from + g.to) / 2;
    addLabel({ type: "gap", year: mid, pos: new THREE.Vector3(...strandPoint(mid, "chr")) }, `<span>Chronicles is silent here</span>`);
  }

  // ── The crown at the summit: the verdict ──
  const cap = { group: new THREE.Group() };
  cap.group.position.set(0, CAP_Y, 0);
  const crownMat = new THREE.MeshPhysicalMaterial({ metalness: 0.9, roughness: 0.18, clearcoat: 1 });
  const crownRing = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.14, 12, 96), crownMat);
  crownRing.rotation.x = Math.PI / 2;
  cap.group.add(crownRing);
  const spike = new THREE.OctahedronGeometry(0.42); spike.scale(0.8, 2.1, 0.8);
  for (let i = 0; i < 10; i++) { const s = new THREE.Mesh(spike, crownMat); const a = (i / 10) * Math.PI * 2; s.position.set(2.7 * Math.cos(a), 0.75, 2.7 * Math.sin(a)); cap.group.add(s); }
  const capCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0), new THREE.MeshPhysicalMaterial({ roughness: 0.1, clearcoat: 1, flatShading: true, emissiveIntensity: 0.6 }));
  const capGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, transparent: true, depthWrite: false })); capGlow.scale.setScalar(11);
  const capPick = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), M.pick); capPick.userData = { type: "cap", id: "cap" };
  cap.group.add(capCore, capGlow, capPick);
  pickables.push(capPick);
  scene.add(cap.group);
  addLabel({ type: "cap", id: "cap", pos: new THREE.Vector3(0, CAP_Y + 2.4, 0) }, `<i>${window.icon("crown", 14, 1.8)}</i><span>The verdict · 1 Kings 15:5</span>`, "button", { "data-pick": "cap", "data-id": "cap", tabindex: "-1" });

  // Strand names ride along beside the current year.
  addLabel({ type: "strand", when: () => true, dyn: (y) => strandPoint(Math.min(70, y + 1.7), "sk", R + 0.4) }, `<span>Gold strand · 1 Samuel – 1 Kings</span>`);
  addLabel({ type: "strand", when: (y) => y > 33 && y < 68.5, dyn: (y) => strandPoint(Math.min(70, Math.max(37.5, y + 5.7)), "chr", R + 0.4) }, `<span>Silver strand · 1 Chronicles</span>`);
  labels.filter((l) => l.type === "strand").forEach((l) => l.el.classList.add(l.el.textContent.startsWith("Gold") ? "is-sk" : "is-chr"));

  // ── Selection ring, star dust, lights ──
  const selRing = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.035, 8, 80), M.sel);
  scene.add(selRing);
  const starGeom = new THREE.BufferGeometry(), starPos = [];
  for (let i = 0; i < 900; i++) { const a = Math.random() * Math.PI * 2, r = 11 + Math.random() * 46; starPos.push(r * Math.cos(a), -12 + Math.random() * (TOP + 34), r * Math.sin(a)); }
  starGeom.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeom, new THREE.PointsMaterial({ size: 0.32, map: halo, transparent: true, depthWrite: false, sizeAttenuation: true }));
  scene.add(stars);
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(30, 60, 20);
  const focusLight = new THREE.PointLight(0xffe2a8, 40, 40, 1.6);
  scene.add(ambient, key, focusLight);

  // ── Growth (the ticker's main animation) ──
  const tubeCount = (geom) => geom.index.count;
  const reignCount = tubeCount(reignTube.geometry), preCount = tubeCount(preHair.geometry);
  const grow = {
    setStrands(sk, chr) {
      const y = sk * 70;
      preBeads.count = Math.round(121 * clamp01(y / 30));
      preHair.geometry.setDrawRange(0, Math.floor((preCount / 6) * clamp01(y / 30)) * 6);
      reignTube.geometry.setDrawRange(0, Math.floor((reignCount / 6) * clamp01((y - 30) / 40)) * 6);
      yearBeads.count = Math.max(0, Math.min(41, Math.floor(y - 30) + 1));
      axis.scale.y = Math.max(0.0001, TOP * sk); axis.position.y = (TOP * sk) / 2;
      for (const r of rings) r.m.visible = y >= r.y - 0.01;
      const cy = 30 + chr * 40;
      for (const r of runs) { const c = tubeCount(r.mesh.geometry); r.mesh.geometry.setDrawRange(0, Math.floor((c / 6) * clamp01((cy - r.a) / (r.b - r.a))) * 6); }
      ghosts.count = ghostYears.filter((g) => g <= cy).length;
    },
  };

  // ── Theme: every colour comes from the page's CSS tokens ──
  function applyTheme() {
    const dark = isDark();
    const col = (n) => new THREE.Color(css(n) || "#888");
    const gold = col("--strand-sk"), silver = col("--strand-chr"), rose = col("--rung"), white = new THREE.Color(1, 1, 1), black = new THREE.Color(0, 0, 0);
    fog.color.set(dark ? 0x0a0c12 : 0xf2eadb);
    M.gold.color.copy(gold); M.gold.emissive.copy(gold); M.gold.emissiveIntensity = dark ? 0.28 : 0.06; M.gold.metalness = dark ? 0.85 : 0.6;
    M.goldBead.color.copy(gold); M.goldBead.emissive.copy(gold); M.goldBead.emissiveIntensity = dark ? 0.35 : 0.05;
    M.yearBead.color.copy(gold).lerp(white, dark ? 0.2 : 0); M.yearBead.emissive.copy(gold); M.yearBead.emissiveIntensity = dark ? 0.5 : 0.08;
    M.silver.color.copy(silver); M.silver.emissive.copy(silver); M.silver.emissiveIntensity = dark ? 0.22 : 0.05; M.silver.metalness = dark ? 0.9 : 0.6;
    M.silverGhost.color.copy(silver); M.silverGhost.emissive.copy(silver); M.silverGhost.emissiveIntensity = dark ? 0.3 : 0.05;
    const ink = dark ? new THREE.Color(0.85, 0.88, 0.95) : new THREE.Color(0.25, 0.21, 0.16);
    M.axis.color.copy(ink); M.ring.color.copy(ink); M.ringKey.color.copy(gold);
    M.stem.color.copy(ink); M.stemDash.color.copy(ink); M.sel.color.copy(dark ? white : new THREE.Color(0.12, 0.1, 0.08));
    M.rung.color.copy(rose); M.rung.emissive.copy(rose); M.rung.emissiveIntensity = dark ? 0.6 : 0.15;
    const blend = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (const c of crystals) {
      const k = col(`--k-${c.data.kind}`);
      const sin = c.data.kind === "sin";
      c.mesh.material.color.copy(k).lerp(black, sin ? (dark ? 0.78 : 0.2) : 0);
      c.mesh.material.emissive.copy(k);
      c.mesh.material.emissiveIntensity = dark ? (sin ? 0.32 : 0.5) : 0.07;
      c.edges.material.color.copy(k).lerp(dark ? white : black, sin ? (dark ? 0.05 : 0.15) : dark ? 0.35 : 0.3);
      c.halo.material.color.copy(k); c.halo.material.blending = blend; c.halo.material.needsUpdate = true;
      if (c.beam) { c.beam.material.color.copy(k); c.beam.material.blending = blend; c.beam.material.needsUpdate = true; }
      c.mesh.material.needsUpdate = true;
    }
    for (const r of rungs) { r.bead.material.color.copy(rose); r.bead.material.emissive.copy(rose); r.bead.material.emissiveIntensity = dark ? 0.7 : 0.15; }
    crownMat.color.copy(gold); crownMat.emissive.copy(gold); crownMat.emissiveIntensity = dark ? 0.35 : 0.06;
    capCore.material.color.copy(gold).lerp(white, 0.5); capCore.material.emissive.copy(gold); capCore.material.emissiveIntensity = dark ? 0.9 : 0.2;
    capGlow.material.color.copy(gold); capGlow.material.blending = blend; capGlow.material.opacity = dark ? 0.9 : 0.45; capGlow.material.needsUpdate = true;
    stars.material.color.set(dark ? 0xc9d4ff : 0xa8823a); stars.material.opacity = dark ? 0.75 : 0.4; stars.material.blending = blend; stars.material.needsUpdate = true;
    ground.material.color.copy(gold); ground.material.opacity = dark ? 0.22 : 0.3; ground.material.blending = blend; ground.material.needsUpdate = true;
    ambient.intensity = dark ? 0.35 : 1.1; key.intensity = dark ? 1.4 : 1.9; focusLight.intensity = dark ? 60 : 25;
    scene.environmentIntensity = dark ? 0.7 : 1;
  }
  applyTheme();

  return { scene, crystals, rungs, cap, pickables, labels, grow, applyTheme, selRing, fog, focusLight };
}

// One shape per kind, so colour is never the only signal.
function crystalGeometry(THREE, kind) {
  switch (kind) {
    case "anointing": { const g = new THREE.OctahedronGeometry(0.62); g.scale(0.78, 1.6, 0.78); return g; }
    case "battle": { const g = new THREE.TetrahedronGeometry(0.92); g.rotateX(Math.atan(Math.SQRT2)); g.rotateZ(Math.PI / 4); return g; }
    case "building": return new THREE.BoxGeometry(0.88, 0.88, 0.88);
    case "worship": return new THREE.IcosahedronGeometry(0.74);
    case "family": return new THREE.DodecahedronGeometry(0.74);
    case "sin": { const g = new THREE.OctahedronGeometry(0.62); g.scale(0.5, 1.95, 0.72); g.rotateZ(0.22); return g; }
    case "word": {
      const s = new THREE.Shape();
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.34 : 0.82; const x = r * Math.cos(a), y = r * Math.sin(a); if (i) s.lineTo(x, y); else s.moveTo(x, y); }
      const g = new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.06, bevelSegments: 1 });
      g.center(); return g;
    }
    case "court": return new THREE.CylinderGeometry(0.56, 0.56, 0.95, 6);
    default: throw new Error(`crystalGeometry: unknown kind "${kind}"`);
  }
}

function haloTexture(THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)"); grad.addColorStop(0.18, "rgba(255,255,255,.55)"); grad.addColorStop(0.5, "rgba(255,255,255,.12)"); grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A soft studio for reflections: a graded dome and three light panels, pre-filtered once.
function studioEnvironment(THREE, renderer) {
  const env = new THREE.Scene();
  const dome = new THREE.SphereGeometry(50, 32, 16), colors = [], p = dome.attributes.position;
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) / 50 + 1) / 2; colors.push(0.05 + 0.5 * t, 0.05 + 0.46 * t, 0.06 + 0.4 * t); }
  dome.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  env.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (w, h, x, y, z, v) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v * 0.96, v * 0.88), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
  panel(34, 12, 0, 36, 18, 5); panel(10, 32, -40, 6, 4, 2.6); panel(10, 28, 38, -2, -14, 2);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(env, 0.04).texture;
  pmrem.dispose();
  return tex;
}
