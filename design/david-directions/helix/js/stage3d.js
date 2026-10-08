// The Life helix as a real WebGL sculpture (three.js 0.185.1, vendored). Two strands (the two accounts), crystals
// for the events, rungs where the accounts differ, a crown of light at the top for the verdict. The page drives it:
// setView (scroll travel), setSelected, setFilter, setBuild (the ticker's growth animation), applyTheme.
import * as THREE from "../vendor/three/three.module.min.js";
import { H, R, CAP_Y, theta } from "./helix-geometry.js";
import { buildScene } from "./stage3d-scene.js";
import { span, easeOutBack, smooth } from "./util.js";

const isDark = () => document.documentElement.dataset.theme === "dark";
const lerp = (a, b, t) => a + (b - a) * t;

export function createStage3D({ host, labelsEl, data, onPick, onHover }) {
  const canvas = document.createElement("canvas");
  canvas.className = "helix-canvas";
  canvas.setAttribute("aria-label", "David's life as a turning helix of crystals. Use the crystal list and the panel to read every event.");
  canvas.setAttribute("role", "img");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  if (!renderer.getContext()) throw new Error("WebGL context not available");
  host.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.debug.checkShaderErrors = false; // the shaders are three's own; skip the driver's info-log chatter

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
  const parts = buildScene(THREE, renderer, data, labelsEl);
  const { scene, crystals, rungs, cap, pickables, labels, grow, applyTheme: themeScene, selRing, fog, focusLight } = parts;

  const view = { year: 0, overview: 1, summit: 0 };
  const cur = { year: 0, overview: 1, summit: 0, az: 0, tilt: 0 };
  const drag = { az: 0, tilt: 0, vel: 0, down: null, moved: false };
  const ui = { selected: null, filter: null, highlight: null, hover: null, offset: { x: 0, y: 0 }, w: 1, h: 1, narrow: false, safeRight: Infinity, safeLeft: -Infinity };
  let build = 1, raf = 0, last = performance.now(), running = false, time = 0;

  // ── Size and composition ──
  function resize() {
    const r = host.getBoundingClientRect();
    ui.w = Math.max(1, Math.round(r.width)); ui.h = Math.max(1, Math.round(r.height));
    ui.narrow = ui.w < 900;
    renderer.setSize(ui.w, ui.h, false);
    camera.aspect = ui.w / ui.h;
    camera.fov = ui.narrow ? 54 : 38;
    camera.setViewOffset(ui.w, ui.h, -ui.offset.x, -ui.offset.y, ui.w, ui.h);
    camera.updateProjectionMatrix();
    kick();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  // ── Pointer: drag to turn, click to choose ──
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function hit(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const found = ray.intersectObjects(pickables.filter((o) => o.visible && o.userData.live !== false), false)[0];
    return found?.object.userData ?? null;
  }
  canvas.addEventListener("pointerdown", (e) => { drag.down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType }; drag.moved = false; drag.vel = 0; });
  addEventListener("pointermove", (e) => {
    if (drag.down && (e.buttons || e.pointerType !== "mouse")) {
      const dx = e.clientX - drag.down.x, dy = e.clientY - drag.down.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
      drag.az += dx * 0.0068; drag.vel = dx * 0.0068;
      if (drag.down.type === "mouse") drag.tilt = Math.max(-1, Math.min(1, drag.tilt + dy * 0.004));
      drag.down.x = e.clientX; drag.down.y = e.clientY;
      kick();
      return;
    }
    if (e.target !== canvas) return;
    const h = hit(e);
    const id = h ? h.id : null;
    if (id !== ui.hover) { ui.hover = id; canvas.style.cursor = id ? "pointer" : "grab"; onHover?.(h); kick(); }
  });
  addEventListener("pointerup", (e) => {
    const was = drag.down; drag.down = null;
    if (!was || drag.moved || e.target !== canvas) return;
    const h = hit(e);
    if (h) onPick?.(h);
  });
  canvas.addEventListener("pointercancel", () => { drag.down = null; });

  // ── Camera ──
  const camPos = new THREE.Vector3(), look = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), worldUp = new THREE.Vector3(0, 1, 0);
  function placeCamera(dt) {
    const k = 1 - Math.exp(-dt * 5.5);
    cur.year = lerp(cur.year, view.year, k); cur.overview = lerp(cur.overview, view.overview, k); cur.summit = lerp(cur.summit, view.summit, k);
    if (!drag.down) { drag.az += drag.vel; drag.vel *= Math.pow(0.9, dt * 60); drag.tilt *= Math.pow(0.97, dt * 60); }
    const D = ui.narrow ? 58 : 34;
    // Riding the years: the camera faces the gold strand at the current year.
    const az = theta(cur.year) + drag.az - 0.1;
    const fy = cur.year * H;
    camPos.set(D * Math.cos(az), fy + 4.5 + drag.tilt * 14, D * Math.sin(az));
    look.set(0, fy + 0.6, 0);
    // The whole sculpture.
    // The whole sculpture, leaning on a diagonal so it fills the open space.
    const span = CAP_Y + 6, tanH = Math.tan((camera.fov * Math.PI) / 360);
    const roll = ui.narrow ? 0 : 0.42;
    const fitH = (span * Math.cos(roll) + 2 * R * Math.sin(roll)) * 1.04 / (2 * tanH);
    const fitW = (span * Math.sin(roll) + (2 * R + 8) * Math.cos(roll)) * 1.1 / (2 * tanH * camera.aspect * (ui.narrow ? 1 : 0.62));
    const dist = Math.max(fitH, fitW) * (ui.narrow ? 1.85 : 1.12);
    const oaz = time * 0.07 + drag.az + 0.6;
    tmp.set(dist * Math.cos(oaz), span / 2 + 6 + drag.tilt * 20, dist * Math.sin(oaz));
    tmp2.set(0, span / 2 - 1.5, 0);
    const o = smooth(Math.min(1, cur.overview));
    camPos.lerp(tmp, o); look.lerp(tmp2, o);
    // The summit: the crown of the verdict.
    const sAz = theta(70) + drag.az - 0.1 + cur.summit * 0.9;
    tmp.set((D + 4) * Math.cos(sAz), CAP_Y + 10 + drag.tilt * 9, (D + 4) * Math.sin(sAz));
    tmp2.set(0, CAP_Y - 6, 0);
    const s = smooth(Math.min(1, cur.summit));
    camPos.lerp(tmp, s); look.lerp(tmp2, s);
    camera.position.copy(camPos);
    // Roll the camera about its line of sight in the overview (the sculpture leans), level when riding the years.
    fwd.copy(look).sub(camPos).normalize();
    right.crossVectors(fwd, worldUp).normalize();
    const r = roll * o * (1 - s);
    camera.up.copy(worldUp).multiplyScalar(Math.cos(r)).addScaledVector(right, Math.sin(r));
    camera.lookAt(look);
    fog.near = lerp(D * 0.95, dist * 0.8, o); fog.far = lerp(D * 3.2, dist * 2.2, o);
    focusLight.position.set(camPos.x * 0.5, look.y + 3, camPos.z * 0.5);
  }

  // ── What is shown: growth, selection, filter ──
  const isLive = (c) => (!ui.filter || ui.filter.has(c.kind)) && (!ui.highlight || ui.highlight.has(c.id));
  function updateObjects(dt) {
    const g = grow;
    const sk = span(build, 0, 0.55), chr = span(build, 0.3, 0.7);
    g.setStrands(sk, chr);
    for (const c of crystals) {
      const appear = easeOutBack(span(build, 0.04 + 0.55 * (c.data.year / 70), 0.11 + 0.55 * (c.data.year / 70)));
      const live = isLive(c.data), sel = ui.selected === c.data.id, hov = ui.hover === c.data.id;
      const far = 1 + Math.min(1, cur.overview + cur.summit * 0.4) * 0.9;
      const target = (sel ? 1.6 : hov ? 1.3 : 1) * (c.data.dated ? 1.22 : 1) * (live ? 1 : 0.5) * far;
      c.scale = lerp(c.scale, target, 1 - Math.exp(-dt * 10));
      c.group.scale.setScalar(Math.max(0.0001, c.scale * appear));
      c.group.visible = appear > 0.001;
      c.mesh.rotation.y += dt * (sel ? 1.4 : 0.45);
      c.mesh.position.y = Math.sin(time * 1.3 + c.phase) * 0.12;
      c.mesh.material.opacity = live ? 0.96 : 0.22;
      c.edges.material.opacity = live ? 0.9 : 0.15;
      c.halo.material.opacity = (live ? (sel ? 1 : hov ? 0.85 : 0.6) : 0) * (isDark() ? 1 : 0.55);
      c.mesh.userData.live = live;
      if (c.stem) c.stem.visible = appear > 0.5;
      if (c.beam) { c.beam.scale.y = appear; c.beam.material.opacity = (live ? 0.28 : 0.05) * (isDark() ? 1 : 0.7); }
    }
    rungs.forEach((r, i) => {
      const t = smooth(span(build, 0.6 + i * 0.016, 0.7 + i * 0.016));
      const sel = ui.selected === r.data.id, hov = ui.hover === r.data.id;
      r.bar.scale.set(1, Math.max(0.0001, t) * r.len, 1);
      r.bead.scale.setScalar(Math.max(0.0001, t * (sel ? 1.7 : hov ? 1.35 : 1)));
      const dim = ui.highlight && !ui.highlight.has(r.data.id) ? 0.2 : 1;
      r.barMesh.material.opacity = 0.75 * dim; r.bead.material.opacity = dim;
      r.bead.userData.live = t > 0.5;
    });
    const capT = easeOutBack(span(build, 0.86, 1));
    cap.group.scale.setScalar(Math.max(0.0001, capT * (ui.selected === "cap" ? 1.15 : ui.hover === "cap" ? 1.08 : 1)));
    cap.group.rotation.y += dt * 0.25;
    // The selection ring follows the chosen crystal or rung bead.
    const selObj = crystals.find((c) => c.data.id === ui.selected)?.group ?? rungs.find((r) => r.data.id === ui.selected)?.bead ?? null;
    selRing.visible = !!selObj && build > 0.6;
    if (selObj) { selObj.getWorldPosition(selRing.position); selRing.rotation.x = Math.PI / 2 + Math.sin(time) * 0.3; selRing.rotation.z += dt * 0.8; }
  }

  // ── Labels over the canvas ──
  const v = new THREE.Vector3();
  function updateLabels() {
    const near = cur.overview < 0.5 && cur.summit < 0.5;
    for (const l of labels) {
      if (l.dyn) l.pos.set(...l.dyn(cur.year));
      v.copy(l.pos);
      const front = (v.x * camera.position.x + v.z * camera.position.z) > -6;
      let show = false;
      if (l.type === "crystal") {
        const c = l.data, d = Math.abs(c.year - cur.year);
        const live = isLive(c);
        show = build > 0.75 && front && live && (ui.selected === c.id || ui.hover === c.id || (!ui.narrow && (near ? d < 4.2 : !!c.dated && cur.summit < 0.5)));
      } else if (l.type === "rung") show = !ui.narrow && build > 0.8 && near && front && (ui.selected === l.id || ui.hover === l.id || Math.abs(l.data.year - cur.year) < 0.6) && !ui.highlight;
      else if (l.type === "year") show = build > 0.5 && (near ? Math.abs(l.year - cur.year) < 9 : l.major);
      else if (l.type === "strand") show = !ui.narrow && build > 0.6 && near && l.when(cur.year);
      else if (l.type === "gap") show = build > 0.8 && near && Math.abs(l.year - cur.year) < 4;
      else if (l.type === "cap") show = build > 0.95 && (cur.summit > 0.2 || (!ui.narrow && (cur.overview > 0.5 || cur.year > 64)));
      if (show) {
        v.project(camera);
        if (v.z > 1 || v.x < -1.15 || v.x > 1.15 || v.y < -1.2 || v.y > 1.2) show = false;
        else {
          const x = Math.round(((v.x + 1) / 2) * ui.w), y = Math.round(((1 - v.y) / 2) * ui.h);
          if (l.x !== x || l.y !== y) { l.el.style.transform = `translate3d(${x}px, ${y}px, 0)`; l.x = x; l.y = y; }
          // Labels that would run under the panel flip to the left of their crystal.
          // Labels that would run under the panel go to the left of their crystal, or below it if neither side is free.
          if (l.type === "crystal" || l.type === "rung") {
            if (l.el.hidden) l.el.hidden = false;
            const wid = l.wid || (l.wid = l.el.offsetWidth);
            const side = x + 30 + wid <= ui.safeRight ? "" : x - 30 - wid >= ui.safeLeft ? "is-flip" : "is-below";
            if (side !== l.side) { l.el.classList.remove("is-flip", "is-below"); if (side) l.el.classList.add(side); l.side = side; }
          }
          if (l.type !== "year" && l.type !== "cap" && x > ui.safeRight + 30 && ui.selected !== l.id) show = false;
        }
      }
      if (l.el.hidden === show) l.el.hidden = !show;
      l.el.classList.toggle("is-on", ui.selected === l.id);
    }
  }

  // ── The loop: runs while the stage is on screen ──
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    placeCamera(dt);
    updateObjects(dt);
    renderer.render(scene, camera);
    updateLabels();
    if (running) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  const io = new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) kick(); }, { threshold: 0 });
  io.observe(host);

  return {
    kind: "3d",
    canvas,
    setView(t) { Object.assign(view, t); kick(); },
    jumpView(t) { Object.assign(view, t); Object.assign(cur, t); kick(); },
    setSelected(id) { ui.selected = id; kick(); },
    setFilter(set) { ui.filter = set; kick(); },
    setHighlight(set) { ui.highlight = set; kick(); },
    setBuild(p) { build = p; kick(); },
    setOffset(x, y) { ui.offset = { x, y }; resize(); },
    setSafeArea(left, right) { ui.safeLeft = left; ui.safeRight = right; kick(); },
    applyTheme() { themeScene(); kick(); },
    // Screen position of a crystal (for the panel's connector line).
    screenOf(id) {
      const c = crystals.find((x) => x.data.id === id);
      if (!c) return null;
      c.group.getWorldPosition(v); v.project(camera);
      return { x: ((v.x + 1) / 2) * ui.w, y: ((1 - v.y) / 2) * ui.h, z: v.z };
    },
    nudge(dx) { drag.vel += dx; kick(); },
    resize,
  };
}
