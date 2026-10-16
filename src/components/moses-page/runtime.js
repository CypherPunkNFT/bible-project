import { mountWordTopics } from './word-topics.js';
import { mountChapterTopics } from './chapter-topics.js';
import { egyptContext } from './egypt-context.js';
// Adapted from the approved Moses merged design. Each mount owns its state,
// observers and animations; no globals or mockup scripts are installed on the site.
export function mountMoses(root, options) {
  let disposed = false;
  const observers = new Set(), frames = new Set(), timers = new Set();
  const controller = new AbortController();
  const requestAnimationFrame = (fn) => {
    const id = window.requestAnimationFrame((time) => { frames.delete(id); if (!disposed) fn(time); });
    frames.add(id); return id;
  };
  const cancelAnimationFrame = (id) => { frames.delete(id); window.cancelAnimationFrame(id); };
  const setTimeout = (fn, delay) => { const id = window.setTimeout(() => { timers.delete(id); if (!disposed) fn(); }, delay); timers.add(id); return id; };
  const clearTimeout = (id) => { timers.delete(id); window.clearTimeout(id); };
  const addEventListener = (name, fn, settings = {}) => window.addEventListener(name, fn, { ...settings, signal: controller.signal });
  const removeEventListener = (name, fn) => window.removeEventListener(name, fn);
  const ResizeObserver = class extends window.ResizeObserver { constructor(fn) { super(fn); observers.add(this); } };
  const MutationObserver = class extends window.MutationObserver { constructor(fn) { super(fn); observers.add(this); } };
  const IntersectionObserver = class extends window.IntersectionObserver { constructor(fn, settings) { super(fn, settings); observers.add(this); } };
  const DIRECTIONS = {};
  let animation = 0;
  const Clock = {
    run(job) {
      cancelAnimationFrame(animation);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { job.frame(1); job.done?.(); return; }
      const start = performance.now();
      const tick = (time) => { const progress = Math.min(1, (time - start) / job.duration); job.frame(progress); if (progress < 1) animation = requestAnimationFrame(tick); else job.done?.(); };
      animation = requestAnimationFrame(tick);
    },
    stop() { cancelAnimationFrame(animation); }
  };
  const topline = () => `<div class="topline"><a href="${esc(options.back.path)}">${icon('arrowLeft',15)}Back to ${esc(options.back.label)}</a><span><a href="${options.personPath('moses-exo-2-10', 'rule')}">As leader</a> · <a href="${options.personPath('moses-exo-2-10', 'word')}">As prophet</a></span></div>`;
  let ACT_TONE, ART_NAMES, Constellation, ICON, M, MergedAsk, MergedLand, MergedLedger, MergedRail, MergedSections, MosesMap, PLAGUE, SCENE_ICON, actOf, art, callSteps, chip, citeShort, cites, claim, clamp01, datesBlock, easeInOut, easeOut, esc, expander, fortiesCards, fulfilPairs, glyph, icon, kjv, loadMoses, notSaid, peopleList, peopleNet, personDetail, placeTag, plagueDots, plagueLine, plaguesGrid, questionList, quoteSpan, refHref, refLink, refList, refText, saysList, sceneLines, sceneMore, signTiles, sourcesBlock, span, starField, stopIndexFor, twoAccounts, wordMore, worldStage;

// --- icons ---
// Lucide-style interface icons (the site uses lucide-react), plus line glyphs for the ten plagues and the people groups.
ICON = {
  book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  graduation: '<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"/><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  tags: '<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.59 5.59A2 2 0 0 0 8.17 5H3a1 1 0 0 0-1 1v5.17a2 2 0 0 0 .59 1.42l5.7 5.7a2.43 2.43 0 0 0 3.42 0l3.58-3.58a2.43 2.43 0 0 0 0-3.42z"/>',
  map: '<path d="M14.1 6.3 9.9 4.2a2 2 0 0 0-1.8 0L3.6 6.4A1 1 0 0 0 3 7.3v12.2a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.2a1 1 0 0 0 .6-.9V5.3a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0ZM15 5.8v15M9 3.2v15"/>',
  branch: '<path d="M6 3v12"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  church: '<path d="M10 9h4M12 7v5M14 22v-4a2 2 0 0 0-4 0v4"/><path d="M18 22V5.62a1 1 0 0 0-.55-.9l-4.56-2.27a2 2 0 0 0-1.78 0L6.55 4.72a1 1 0 0 0-.55.9V22"/><path d="m18 7 3.45 1.72a1 1 0 0 1 .55.9V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.62a1 1 0 0 1 .55-.9L6 7"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  arrowLeft: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  arrowUp: '<path d="M7 17 17 7M7 7h10v10"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  warning: '<path d="m12 3 10 18H2Z M12 9v5"/><circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  play: '<path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5z"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  replay: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  skipBack: '<path d="M19 20 9 12l10-8v16zM5 19V5"/>',
  skipForward: '<path d="m5 4 10 8-10 8V4zM19 5v14"/>',
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  open: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2ZM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  tent: '<path d="M3.5 21 14 3M20.5 21 10 3M15.5 21 12 15l-3.5 6M2 21h20"/>',
  scroll: '<path d="M19 17V5a2 2 0 0 0-2-2H4M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  sparkle: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/>',
  quote: '<path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>',
  crown: '<path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.29l4.27-3.66a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.28 3.66a1 1 0 0 0 1.51-.29z"/><path d="M5 21h14"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  library: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
  swords: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2"/>',
  feather: '<path d="M12.67 19a2 2 0 0 0 1.42-.59l6.15-6.17a6 6 0 0 0-8.49-8.49L5.59 9.91A2 2 0 0 0 5 11.33V18a1 1 0 0 0 1 1z"/><path d="M16 8 2 22M17.5 15H9"/>',
  eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  tablets: '<path d="M3 21V8a4 4 0 0 1 8 0v13zM13 21V8a4 4 0 0 1 8 0v13z"/><path d="M5.5 11h3M5.5 14h3M5.5 17h3M15.5 11h3M15.5 14h3M15.5 17h3"/>',
  staff: '<path d="M7 22 15.5 3"/><path d="M15.5 3c2 0 3.5 1.5 3 3.5"/>',
  drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-1.8 5.4a2 2 0 0 1-1.28 1.28l-5.4 1.8 1.8-5.4a2 2 0 0 1 1.28-1.28z"/>',
  basket: '<path d="M3 12h18l-2 7a2 2 0 0 1-2 1.5H7A2 2 0 0 1 5 19z"/><path d="M5 12c1-4 13-4 14 0M6.5 15.5h11M2 21.5c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/>',
  well: '<path d="M4 11h16M5 11v9h14v-9M7 11V4M17 11V4M5 4h14M12 4v4"/><rect x="10.5" y="8" width="3" height="2.5" rx=".5"/>',
};
// The ten plagues, each drawn from the word its verse uses.
PLAGUE = {
  blood: '<path d="M12 2c-2.2 3-4.5 5.4-4.5 8a4.5 4.5 0 0 0 9 0c0-2.6-2.3-5-4.5-8z"/><path d="M2.5 19.5c1.6 0 1.6-1 3.2-1s1.6 1 3.2 1 1.6-1 3.2-1 1.6 1 3.2 1 1.6-1 3.2-1 1.6 1 3.2 1"/>',
  frogs: '<circle cx="8" cy="7" r="2.4"/><circle cx="16" cy="7" r="2.4"/><path d="M5.6 8.5C3.6 10 3.2 12.6 4.2 14.6c1.5 3 4.8 4 7.8 4s6.3-1 7.8-4c1-2 .6-4.6-1.4-6.1"/><path d="M8.5 13.5c2 1.3 5 1.3 7 0M4.2 14.6 2 18M19.8 14.6 22 18"/>',
  lice: '<ellipse cx="12" cy="13.5" rx="3.4" ry="5"/><circle cx="12" cy="6.6" r="1.9"/><path d="M8.6 11.5 5 9.6M8.6 14.2H4.8M8.9 16.8 6 19.2M15.4 11.5 19 9.6M15.4 14.2h3.8M15.1 16.8l2.9 2.4"/>',
  flies: '<ellipse cx="12" cy="14.5" rx="2.4" ry="5"/><circle cx="12" cy="7.6" r="1.9"/><path d="M10.2 11.4C7 8.4 3.4 8.8 3.4 11.2s3.6 3 6.8 1.6M13.8 11.4c3.2-3 6.8-2.6 6.8-.2s-3.6 3-6.8 1.6"/>',
  murrain: '<path d="M4 4.5c0 3 2 5 4 5M20 4.5c0 3-2 5-4 5"/><path d="M8 9.5h8l-.8 6.6A3 3 0 0 1 12.3 19h-.6a3 3 0 0 1-2.9-2.9z"/><path d="M10.4 16.6h3.2M10 12.5v.01M14 12.5v.01"/>',
  boils: '<circle cx="12" cy="12" r="9"/><circle cx="8.8" cy="9.6" r="1.6"/><circle cx="15" cy="8.8" r="1"/><circle cx="14.4" cy="14.6" r="2"/><circle cx="8.6" cy="15.4" r="1.1"/>',
  hail: '<path d="M17.5 12a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.3 2.5A3.5 3.5 0 0 0 6.5 12z"/><circle cx="7.5" cy="16.5" r="1.2"/><circle cx="11.5" cy="20" r="1.2"/><circle cx="17" cy="17" r="1.2"/><path d="m14 12-1.8 3h2.8l-1.8 3"/>',
  locusts: '<path d="M3 14.5c3-2.2 8-3.2 13.5-2.6 2.2.2 4 1 4 2.1s-1.6 1.9-3.8 1.9H8"/><path d="m8 14.5-2.2 5M12.2 15.9l3.2-6.4 3 6.5M20.5 13c.4-2.2-.2-4.4-1.8-6.3"/>',
  darkness: '<circle cx="12" cy="12" r="5.5" fill="currentColor" fill-opacity=".9"/><path d="M12 1.5v2.5M12 20v2.5M1.5 12H4M20 12h2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
  firstborn: '<path d="M6 21.5V5h12v16.5M2.5 21.5h19"/><path d="M5 5h14" stroke-width="3"/><path d="M6 5v9M18 5v9" stroke-width="2.6"/><path d="M10 21.5v-8h4v8"/>',
};
icon = (name, size = 18, stroke = 1.6) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name] ?? PLAGUE[name] ?? ""}</svg>`;
glyph = (name, size = 40, stroke = 1.4) => `<svg class="ico glyph" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(PLAGUE[name] ?? ICON[name] ?? "").replace(/<(path|circle|ellipse|rect)/g, '<$1 pathLength="1"')}</svg>`;


// --- art ---
// The scene drawings: simple line art drawn here by hand (no stock images). Every stroke has pathLength=1 so a scene
// can draw itself: the CSS reads --draw (0..1) on the svg and each stroke's own delay --d (0..1).
(() => {
  let uid = 0;
  const P = (d, cls = "a-line", delay = 0) => `<path pathLength="1" class="${cls}" style="--d:${delay}" d="${d}"/>`;
  const C = (cx, cy, r, cls = "a-line", delay = 0) => `<circle pathLength="1" class="${cls}" style="--d:${delay}" cx="${cx}" cy="${cy}" r="${r}"/>`;
  const E = (cx, cy, rx, ry, cls = "a-line", delay = 0) => `<ellipse pathLength="1" class="${cls}" style="--d:${delay}" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const stars = (pts, delay = .5) => pts.map(([x, y, r = 1.4], i) => C(x, y, r, "a-star", delay + (i % 5) * .06)).join("");
  const reeds = (x0, n, dir = 1) => Array.from({ length: n }, (_, i) => {
    const x = x0 + i * 9 * dir, h = 70 + ((i * 37) % 30), lean = (i % 2 ? 6 : -4) * dir;
    return P(`M${x} 182 C${x + lean / 2} ${170 - h / 2} ${x + lean} ${182 - h * .8} ${x + lean * 1.4} ${182 - h}`, "a-line", .25 + i * .04)
      + E(x + lean * 1.4, 182 - h - 5, 2.2, 7, "a-tone", .55 + i * .04);
  }).join("");
  const sheep = (x, y, delay) => P(`M${x} ${y}c0-9 24-9 24 0c5 0 5 9 0 9h-24c-5 0-5-9 0-9z`, "a-line", delay) + P(`M${x + 24} ${y + 1}c4-1 7 1 7 4`, "a-line", delay + .05)
    + P(`M${x + 3} ${y + 9}v6M${x + 19} ${y + 9}v6`, "a-line", delay + .1);
  const ART = {
    river: () => [
      C(298, 74, 30, "a-sun", 0), P("M36 150 95 88l58 62M118 150l32-32 32 32", "a-faint", .1),
      P("M0 150h400", "a-faint", .05),
      P("M0 170c60-6 120 4 200-1s140-6 200 3", "a-water", .2), P("M18 192c70-5 132 5 212 0s120-5 162 2", "a-water", .3), P("M60 214c60-4 120 4 190 0s90-3 130 1", "a-water", .4),
      reeds(244, 6), reeds(120, 4, -1),
      P("M172 171c6 15 58 15 66 0z", "a-tone a-fillish", .45), P("M178 171c8-13 46-13 54 0", "a-glow", .55), P("M181 176h48M186 181h38", "a-tone", .65),
      P("M70 52c5-5 9-5 13 0 4-5 8-5 13 0M104 38c4-4 7-4 10 0 3-4 6-4 10 0", "a-faint", .7),
    ].join(""),
    palace: () => [
      P("M16 206h368", "a-faint", 0),
      P("M58 206 78 76h88l20 130z", "a-line", .05), P("M214 206l20-130h88l20 130z", "a-line", .1),
      P("M186 206v-96h28v96", "a-tone", .2), P("M172 104h56", "a-tone", .25),
      C(200, 90, 8, "a-glow", .35), P("M150 90c18-9 33-7 42-1M250 90c-18-9-33-7-42-1", "a-glow", .4),
      P("M92 108h60M90 128h64M88 148h68M248 108h60M246 128h64M244 148h68", "a-faint", .5),
      P("M356 206l6-112 6-10 6 10 6 112", "a-line", .55), P("M34 206V120M34 120c-8-4-10-14 0-18 10 4 8 14 0 18", "a-tone", .65),
    ].join(""),
    well: () => [
      P("M0 204c80-20 160-10 240-6s120-12 160-8", "a-faint", 0),
      P("M36 200l30-38 30 38M86 200l22-26 22 26", "a-line", .1),
      E(200, 150, 40, 10, "a-tone", .2), P("M160 150v36c10 12 70 12 80 0v-36", "a-line", .25), P("M168 166h64M164 178h72", "a-faint", .35),
      P("M172 150V96M228 150V96M164 96h72", "a-line", .4), P("M200 96v30", "a-glow", .5), P("M194 126h12v10h-12z", "a-tone", .55),
      P("M322 200c2-36-2-66 4-98", "a-line", .45), P("M326 102c-14-10-30-8-40 4M326 102c12-14 30-14 40-4M326 102c-6-16-2-28 8-34M326 102c-18 0-26 8-30 20M326 102c16 0 26 10 28 22", "a-tone", .6),
      sheep(252, 186, .65), sheep(118, 196, .7),
      P("M330 40a16 16 0 1 0 14 24 13 13 0 0 1-14-24z", "a-glow", .75), stars([[60, 40], [110, 28], [250, 30], [380, 60]], .8),
    ].join(""),
    bush: () => [
      P("M40 212 150 92l58 50 52-40 110 110", "a-faint", 0),
      P("M14 214c110-14 260-14 372 0", "a-line", .05),
      P("M200 212c-2-18-10-28-24-42M200 212c4-20 14-30 28-44M200 208c0-20 1-36-1-58M188 196c-10-4-18-2-26 6M212 196c10-4 18-2 26 6M176 170c-6-6-14-6-20-2M228 168c6-6 14-6 20-2", "a-line", .15),
      P("M199 152c-15-20-4-38 1-60 4 22 16 40-1 60z", "a-glow", .35), P("M176 172c-12-16-6-32-2-46 8 16 14 30 2 46z", "a-glow", .45),
      P("M228 170c12-16 6-32 2-46-8 16-14 30-2 46z", "a-glow", .5), P("M158 202c-9-10-6-22-2-30 6 10 10 20 2 30zM244 202c9-10 6-22 2-30-6 10-10 20-2 30z", "a-glow", .55),
      P("M200 132c-5-8-2-16 0-24 3 8 5 16 0 24z", "a-sunline", .6),
      P("M200 70v-26M150 88l-16-16M250 88l16-16M128 128h-22M272 128h22M140 58l-8-12M260 58l8-12", "a-ray", .7),
    ].join(""),
    staff: () => [
      P("M20 220h360", "a-faint", 0),
      P("M146 226 176 30", "a-tone", .1), P("M176 30c12-2 20 6 16 18", "a-tone", .2),
      P("M214 226c50-16-30-34 22-58s-28-42 18-66", "a-glow", .3), P("M254 102c8-6 16-4 20 2-4 6-12 8-20 4M274 104l8-3M274 104l8 3", "a-glow", .55),
      P("M90 120c-8-14-2-30 14-34 10-2 16 6 14 14l-4 22h-20z", "a-line", .5), P("M100 142c-2 10-2 20 2 30", "a-faint", .6),
      P("M300 210c0-26 14-42 26-48 12 6 26 22 26 48z", "a-line", .6), P("M314 180c6 6 18 6 24 0M326 162v-14", "a-water", .7),
      stars([[60, 50], [110, 36], [240, 40], [340, 54], [370, 100]], .8),
    ].join(""),
    plagues: () => [
      P("M0 206h400", "a-faint", 0), P("M30 206 96 132l66 74M140 206l40-44 40 44", "a-line", .05),
      C(286, 86, 34, "a-dark", .15), C(286, 86, 44, "a-ring", .25),
      P("M286 30v-12M286 154v12M230 86h-12M342 86h12M246 46l-9-9M326 126l9 9M246 126l-9 9M326 46l9-9", "a-ray", .35),
      P("M40 30l-14 22M80 18l-14 22M120 34l-14 22M160 22l-14 22M196 40l-14 22", "a-water", .45),
      P("M228 176c20-6 44-6 64 0M240 188c16-4 32-4 46 0", "a-tone", .6), P("M300 206v-40h44v40M300 166h44", "a-line", .6), P("M296 166h52", "a-glow", .75),
    ].join(""),
    sea: () => [
      P("M40 236c18-64 10-120 40-178 10-18 28-26 42-18-10 2-14 12-10 22", "a-water", .05), P("M74 236c14-56 10-106 30-150M100 236c10-48 10-90 22-120", "a-water", .15),
      P("M360 236c-18-64-10-120-40-178-10-18-28-26-42-18 10 2 14 12 10 22", "a-water", .1), P("M326 236c-14-56-10-106-30-150M300 236c-10-48-10-90-22-120", "a-water", .2),
      P("M150 250c18-50 30-110 50-190 20 80 32 140 50 190", "a-glow", .35), P("M178 250c8-40 14-88 22-150M222 250c-8-40-14-88-22-150", "a-faint", .45),
      P("M20 30c80-12 160 10 240-2s110-8 140 0M10 58c70-8 140 6 210-2", "a-ray", .55),
      stars([[150, 20], [200, 14], [250, 26]], .7),
    ].join(""),
    rock: () => [
      P("M0 214h400", "a-faint", 0), P("M108 214c-12-50 14-96 70-104 50-8 96 30 90 104", "a-line", .1), P("M170 124l14 30-10 20", "a-faint", .25),
      P("M184 154c6 22-8 34 6 60", "a-water", .35), E(194, 216, 36, 6, "a-water", .45),
      P("M290 214c18-42 64-42 90 0", "a-line", .4), P("M335 180v-16M335 168l-9-16M335 168l9-16", "a-glow", .55),
      P("M320 186v-10M350 186v-10M321 178l6-8M349 178l-6-8", "a-tone", .6), C(335, 159, 3, "a-glow", .6),
      P("M335 152v-24", "a-ray", .75),
    ].join(""),
    sinai: () => [
      P("M20 236 136 110l40 30 44-84 40 66 34-30 86 144", "a-line", .05), P("M136 110l20 36M220 56l-8 50M294 92l-6 40", "a-faint", .2),
      P("M162 70c-22 0-22-26 0-26 6-22 38-22 44-6 12-16 44-10 42 10 22 0 22 26 0 26z", "a-glow", .3),
      P("M252 52l-12 22h14l-12 24", "a-sunline", .5), P("M178 34l-6 14h8l-6 12", "a-sunline", .55),
      P("M120 40c-10 6-14 14-12 24M330 40c10 6 14 14 12 24M104 28c-16 10-22 24-18 40M346 28c16 10 22 24 18 40", "a-ray", .6),
      P("M184 236v-34a10 10 0 0 1 20 0v34zM210 236v-34a10 10 0 0 1 20 0v34z", "a-tone", .7), P("M189 214h10M189 222h10M215 214h10M215 222h10", "a-faint", .8),
    ].join(""),
    tent: () => [
      P("M50 214 340 214 300 168H96z", "a-line", .05), P("M96 168v46M140 168v46M184 168v46M228 168v46M272 168v46M300 168v46", "a-faint", .15),
      P("M174 190v-62h76v62", "a-tone", .25), P("M168 128l44-22 44 22", "a-tone", .3), P("M206 190v-30h12v30", "a-faint", .4),
      P("M110 200h22v-12h-22z", "a-line", .4),
      P("M212 100c-16-12 16-22 0-34s16-22 0-34", "a-glow", .5), P("M196 92c-14-4-14-18 0-20M228 92c14-4 14-18 0-20M200 58c-12-4-12-16 0-18M224 58c12-4 12-16 0-18", "a-glow", .65),
      P("M212 100c-30 0-60 10-90 30M212 100c30 0 60 10 90 30", "a-ray", .8),
    ].join(""),
    stars: () => [
      P("M0 214h400", "a-faint", 0),
      ...[[40, 214], [80, 214], [120, 214], [250, 214], [290, 214], [330, 214], [64, 196], [104, 196], [272, 196], [312, 196]].map(([x, y], i) => P(`M${x - 14} ${y}l14-16 14 16`, "a-line", .1 + i * .03)),
      P("M200 214c-10-24 8-40 0-64s8-40 0-64", "a-glow", .4), P("M200 86c-6-10 0-20 0-30 4 10 6 20 0 30z", "a-sunline", .55),
      P("M330 52a18 18 0 1 0 16 26 15 15 0 0 1-16-26z", "a-tone", .6),
      stars([[30, 40], [70, 70], [96, 28], [130, 56], [160, 20], [250, 30], [270, 70], [300, 24], [370, 40], [380, 100], [40, 120], [120, 110], [280, 120], [350, 140], [230, 90]], .5),
    ].join(""),
    nebo: () => [
      C(300, 112, 26, "a-sun", 0), P("M160 112c40-10 90-14 140-10s70 2 100-2", "a-faint", .1), P("M180 132c40-6 120-10 220-4", "a-faint", .15),
      P("M262 200c10-14-6-26 6-40s-4-24 8-36", "a-water", .3), E(250, 214, 18, 6, "a-water", .4),
      P("M0 236c40-30 80-56 120-70 20-6 34-2 50 10 30 22 90 30 230 30", "a-line", .2), P("M30 236c30-20 60-36 90-44", "a-faint", .3),
      P("M118 164v-18M118 150l-6 10M118 150l6 10M118 146v-2", "a-glow", .55), C(118, 140, 3.5, "a-glow", .55),
      P("M300 70V58M300 166v-8M260 84l-8-8M340 84l8-8M246 112h-12M354 112h12", "a-ray", .7),
      P("M140 150c40-30 100-44 160-40", "a-glowdash", .8),
    ].join(""),
  };
  // A soft backdrop glow behind each drawing, in the scene's tone.
  art = (name, cls = "", fit = "xMidYMid meet") => {
    const id = `ag${++uid}`;
    return `<svg class="art ${cls}" viewBox="0 0 400 260" preserveAspectRatio="${fit}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs><radialGradient id="${id}" cx="50%" cy="45%" r="60%"><stop offset="0" class="art-bg1"/><stop offset="1" class="art-bg2"/></radialGradient></defs>
      <rect class="art-bg" width="400" height="260" fill="url(#${id})"/>${(ART[name] ?? ART.nebo)()}</svg>`;
  };
  ART_NAMES = Object.keys(ART);
})();


// --- core ---
// Shared helpers: the data (data/moses.json), verse references, evidence labels, claims, quotes and expand-in-place.
(() => {
  esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  M = null;
  loadMoses = async () => {
    const res = { ok: true, json: async () => structuredClone((await import("./data/moses.json")).default) };
    if (!res.ok) throw new Error(`moses.json: expected 200, got ${res.status}`);
    M = await res.json();
    M.story = options.person.story.paragraphs; M.person.short = options.person.story.short;
    M.person.verseCount = options.person.refs.length;
    M.sceneById = Object.fromEntries(M.scenes.map((s) => [s.id, s]));
    return M;
  };

  // 2003001 -> { book: 2, ch: 3, v: 1 }
  const parts = (id) => ({ book: Math.floor(id / 1e6), ch: Math.floor((id % 1e6) / 1e3), v: id % 1e3 });
  refText = ([a, b = a]) => {
    const x = parts(a), y = parts(b), name = M.books[x.book]?.name ?? "?";
    if (a === b) return `${name} ${x.ch}:${x.v}`;
    if (x.book !== y.book) return `${name} ${x.ch}:${x.v} – ${M.books[y.book]?.name} ${y.ch}:${y.v}`;
    return x.ch === y.ch ? `${name} ${x.ch}:${x.v}–${y.v}` : `${name} ${x.ch}:${x.v}–${y.ch}:${y.v}`;
  };
  refHref = (span) => options.refHref(span);
  refLink = (r) => `<a class="ref" href="${refHref(r)}">${esc(refText(r))}</a>`;
  refList = (refs = []) => refs.map(refLink).join('<span class="ref-sep">·</span>');

  const LAYER = { scripture: "Scripture", text: "From the text", "ancient-record": "Outside the Bible", "early-church": "Early church", tradition: "Later tradition", scholars: "Scholars' view" };
  chip = (layer) => `<span class="layer" data-layer="${esc(layer)}">${esc(LAYER[layer] ?? layer)}</span>`;
  citeShort = (id) => { const c = M.citations.find((x) => x.id === id); return c ? `${c.author.split(",")[0].split(" and ")[0]} (${c.year})` : id; };
  cites = (ids = []) => ids.map((id) => { const c = M.citations.find((x) => x.id === id); return `<a class="cite" href="${esc(c?.url ?? "#sources")}" target="_blank" rel="noreferrer">${esc(citeShort(id))}</a>`; }).join('<span class="ref-sep">·</span>');

  // A claim: its words, then its evidence label and verses (or citations). Plain story paragraphs have no layer.
  claim = (c, cls = "") => {
    if (!c) return "";
    const theme = c.theme ? `<b class="claim-theme">${esc(c.theme)}</b>` : "";
    const qs = (c.quotes ?? []).map((q) => quoteSpan(q, "q-inline")).join("");
    const who = c.who ? `<span class="claim-who">${esc(c.who)}${c.when ? `, ${esc(c.when)}` : ""}</span>` : "";
    return `<div class="claim ${cls}" data-layer="${esc(c.layer ?? "story")}">${theme}<p>${esc(c.text)}</p>${qs}
      <footer>${c.layer ? chip(c.layer) : '<span class="layer" data-layer="story">Written by this site from Scripture</span>'}${who}<span class="refs">${refList(c.refs)}${c.cites ? cites(c.cites) : ""}</span></footer></div>`;
  };
  // A quotation stored with its span ({ text, span }).
  quoteSpan = (q, cls = "") => q ? `<blockquote class="q ${cls}"><p>${esc(q.text)}</p><footer>${refLink(q.span)} · KJV</footer></blockquote>` : "";
  // A KJV verse pulled from the text files ({ ref, text }), with "read the passage".
  kjv = (v, cls = "") => v ? `<blockquote class="kjv ${cls}"><p>${esc(v.text)}</p><footer><span>${esc(refText(v.ref))} · KJV</span><a class="read" href="${refHref(v.ref)}">${icon("open", 14)}Read the passage</a></footer></blockquote>` : "";

  // Expand in place: any [data-xp] button toggles its nearest .xp (a CSS grid-row transition, no fade of the page).
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-xp]");
    if (!b) return;
    const box = b.closest(".xp");
    if (!box) return;
    const open = !box.classList.contains("is-open");
    box.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", String(open));
    const label = b.querySelector(".xp-label");
    if (label && b.dataset.open && b.dataset.closed) label.textContent = open ? b.dataset.open : b.dataset.closed;
  });
  expander = (head, body, { open = false, cls = "", closed = "Show the detail", opened = "Show less" } = {}) =>
    `<div class="xp ${cls} ${open ? "is-open" : ""}">${head ?? `<button type="button" class="xp-more" data-xp aria-expanded="${open}" data-open="${opened}" data-closed="${closed}"><span class="xp-label">${open ? opened : closed}</span>${icon("chevronDown", 15)}</button>`}
      <div class="xp-body"><div class="xp-inner">${body}</div></div></div>`;

  actOf = (n) => M.forties[n - 1];
  ACT_TONE = { 1: "var(--egypt)", 2: "var(--midian)", 3: "var(--wild)" };
  easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  easeOut = (t) => 1 - Math.pow(1 - t, 3);
  clamp01 = (t) => Math.max(0, Math.min(1, t));
  span = (p, a, b) => clamp01((p - a) / (b - a)); // where p sits between a and b, 0..1
})();


// --- blocks ---
// Shared content blocks every direction uses (each direction lays them out and styles them its own way).
(() => {
  SCENE_ICON = { river: "basket", palace: "landmark", well: "well", bush: "flame", staff: "staff", plagues: "darkness", sea: "waves", rock: "drop", sinai: "mountain", tent: "tent", stars: "sparkle", nebo: "eye" };
  ICON.landmark = '<path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18"/><path d="M11.12 2.2a2 2 0 0 1 1.76 0l7.87 3.85c.47.23.31.95-.22.95H3.47c-.53 0-.69-.72-.22-.95z"/>';

  // The three forties and the end of the life (Acts 7:23, 7:30, 7:36; Deuteronomy 34:7).
  fortiesCards = (cls = "") => M.forties.map((f) => `<article class="forty ${cls}" style="--tone:${ACT_TONE[f.act]}" data-act="${f.act}">
      <div class="forty-top"><span class="forty-n">${f.act === 1 ? "I" : f.act === 2 ? "II" : "III"}</span><span class="forty-years">${f.from}–${f.to}</span></div>
      <h3>${esc(f.name)}</h3><p>${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV</footer></article>`).join("");

  // The ten plagues: a grid of glyphs; a tile opens in place to its verse.
  plaguesGrid = (cls = "") => `<div class="plagues ${cls}">${M.plagues.map((p) => `<div class="plague xp" data-n="${p.n}">
      <button type="button" class="plague-btn" data-xp aria-expanded="false"><span class="plague-n">${p.n}</span>${glyph(p.word, 40)}<b>${esc(p.word)}</b></button>
      <div class="xp-body"><div class="xp-inner">${kjv(p.verse, "kjv-sm")}</div></div></div>`).join("")}</div>`;

  // The people around him, from the family list (TIPNR), his companions and those who withstood him.
  peopleList = () => {
    const comp = Object.fromEntries(M.companions.map((c) => [c.id, c]));
    const prophetsWith = Object.fromEntries(M.prophetsWith.map((p) => [p.person.personId, p.claim]));
    const fam = M.family.map((f) => ({ ...f, claim: comp[f.id]?.claim, also: prophetsWith[f.id] }));
    const rest = M.companions.filter((c) => !fam.some((f) => f.id === c.id)).map((c) => ({ ...c, group: /korah|jannes/.test(c.id) ? "against" : "with", role: /korah|jannes/.test(c.id) ? "withstood him" : "beside him", also: prophetsWith[c.id] }));
    const against = M.opponents.map((o) => ({ ...o, group: "against", role: o.power ? `${o.power}` : "king of Egypt" }));
    return [...fam, ...rest, ...against];
  };
  personDetail = (p) => `<div class="person-detail" style="--tone:${p.group === "family" ? "var(--egypt)" : p.group === "with" ? "var(--wild)" : "var(--midian)"}">
      <div class="pd-head"><span class="pd-mono">${esc(p.name[0])}</span><div><h4>${esc(p.name)}</h4><small>${esc(p.role)}${p.note ? ` · ${esc(p.note)}` : ""}</small></div></div>
      ${p.claim ? claim(p.claim) : `<p class="pd-plain">Named as his ${esc(p.role)} in the family list (TIPNR, STEP Bible).</p>`}${p.also ? claim(p.also) : ""}${p.quote ? quoteSpan(p.quote) : ""}</div>`;
  // A small network: Moses in the middle, family to the left, companions above right, those against him below right.
  peopleNet = (cls = "") => {
    const people = peopleList(), W = 640, H = 420, cx = W / 2, cy = H / 2;
    const groups = { family: [150, 250], with: [-60, 20], against: [30, 120] };
    const pos = {};
    for (const [g, [a0, a1]] of Object.entries(groups)) {
      const list = people.filter((p) => p.group === g);
      list.forEach((p, i) => {
        const a = ((a0 + ((a1 - a0) * (i + .5)) / list.length) * Math.PI) / 180, r = g === "family" ? 165 : 175 + (i % 2) * 22;
        pos[p.id] = [cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * .92];
      });
    }
    const tone = (g) => (g === "family" ? "var(--egypt)" : g === "with" ? "var(--wild)" : "var(--midian)");
    return `<div class="net ${cls}" data-net><svg viewBox="0 0 ${W} ${H}" class="net-svg" role="group" aria-label="The people around Moses">
      ${people.map((p) => `<line class="net-edge" data-for="${p.id}" style="--tone:${tone(p.group)}" x1="${cx}" y1="${cy}" x2="${pos[p.id][0]}" y2="${pos[p.id][1]}"/>`).join("")}
      <g class="net-me"><circle cx="${cx}" cy="${cy}" r="40" class="net-me-halo"/><circle cx="${cx}" cy="${cy}" r="30"/><text x="${cx}" y="${cy + 6}">Moses</text></g>
      ${people.map((p, i) => `<g class="net-node" data-person="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}" style="--tone:${tone(p.group)};--i:${i}">
        <circle cx="${pos[p.id][0]}" cy="${pos[p.id][1]}" r="17"/><text class="net-ini" x="${pos[p.id][0]}" y="${pos[p.id][1] + 5}">${esc(p.name[0])}</text>
        <text class="net-name" x="${pos[p.id][0]}" y="${pos[p.id][1] + 34}">${esc(p.name.replace(/, one of five kings of Midian/, " (Midian)").replace(/ of the Exodus/, ""))}</text></g>`).join("")}
      </svg><ul class="net-key"><li style="--tone:var(--egypt)">Family</li><li style="--tone:var(--wild)">Beside him</li><li style="--tone:var(--midian)">Against him</li></ul>
      <div class="net-detail">${personDetail(people.find((p) => p.id === "aaron-exo-4-14"))}</div></div>`;
  };
  const choosePerson = (node) => {
    const net = node.closest("[data-net]"), id = node.dataset.person, p = peopleList().find((x) => x.id === id);
    net.querySelectorAll(".net-node").forEach((n) => n.classList.toggle("is-on", n === node));
    net.querySelectorAll(".net-edge").forEach((l) => l.classList.toggle("is-on", l.dataset.for === id));
    net.querySelector(".net-detail").innerHTML = personDetail(p);
  };
  root.addEventListener("click", (e) => { const n = e.target.closest("[data-person]"); if (n) choosePerson(n); });
  root.addEventListener("keydown", (e) => { const n = e.target.closest?.("[data-person]"); if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); choosePerson(n); } });

  // The word: the call, the signs and what came of the word, with the rest one click away.
  callSteps = () => M.word.call.map((c, i) => `<article class="call-step"><span class="call-n">${i + 1}</span><div><h4>${esc(c.label)}</h4>${quoteSpan(c.quote)}${claim(c.claim)}</div></article>`).join("");
  const SIGN_ICON = ["staff", "sparkle", "waves", "drop", "sun", "staff"];
  signTiles = () => M.word.signs.map((s, i) => `<div class="sign xp"><button type="button" class="sign-btn" data-xp aria-expanded="false">${glyph(SIGN_ICON[i], 34)}<b>${esc(s.label)}</b>${icon("plus", 15)}</button>
      <div class="xp-body"><div class="xp-inner">${claim(s.claim)}</div></div></div>`).join("");
  fulfilPairs = () => M.word.fulfilment.map((f) => `<div class="fulfil"><div class="fulfil-word"><small>The word</small>${claim(f.word)}</div><div class="fulfil-link" aria-hidden="true"><i></i>${icon("arrowRight", 16)}</div><div class="fulfil-came"><small>What Scripture reports</small>${claim(f.reported)}</div></div>`).join("");
  wordMore = () => [
    ["How the word came", M.word.how.map((c) => claim(c)).join("")],
    ["The message", M.word.message.map((m) => claim({ theme: m.theme, ...m.claim, quotes: m.quotes })).join("")],
    ["Words to people", M.word.words.map((w) => `<div class="word-to"><b>To ${esc(w.to)}</b>${quoteSpan(w.quote)}${w.claim ? claim(w.claim) : ""}</div>`).join("")],
  ].map(([t, body]) => expander(`<button type="button" class="xp-head" data-xp aria-expanded="false"><span>${esc(t)}</span>${icon("chevronDown", 16)}</button>`, body, { cls: "xp-row" })).join("");

  // Questions people ask, the two accounts, the dates, and what Scripture does not say.
  questionList = () => M.questions.map((q) => expander(`<button type="button" class="xp-head q-head" data-xp aria-expanded="false">${icon("help", 18)}<span>${esc(q.question)}</span><em>${q.views.length} views</em>${icon("chevronDown", 16)}</button>`,
    `<div class="views">${q.views.map((v) => `<article class="view"><h5>${esc(v.label)}</h5><small>${esc(v.holders)}</small>${claim(v.argument)}</article>`).join("")}</div>`, { cls: "xp-row xp-q" })).join("");
  twoAccounts = () => M.leader.twoAccounts.map((t) => `<div class="two"><h4>${esc(t.topic)}</h4><div class="two-cols">${claim(t.first)}${claim(t.second)}</div></div>`).join("");
  datesBlock = () => `<div class="dates">${M.leader.dates.map((d) => `<div class="date" data-system="${d.system}"><b>${d.from ? `${d.approx ? "c. " : ""}${d.from}${d.to ? `–${d.to}` : ""} BC` : "No year BC"}</b><span>${esc(d.label)}</span><p>${esc(d.note)}</p>${d.cites ? `<footer>${chip("scholars")}<span class="refs">${cites(d.cites)}</span></footer>` : ""}</div>`).join("")}</div>`;
  notSaid = () => `<ul class="not-said">${M.notSaid.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`;
  saysList = () => M.leader.scriptureSays.map((c) => claim(c, "says")).join("");
  worldStage = () => M.leader.worldStage.map((w) => `<div class="stage"><b>${esc(w.power)}</b>${w.rulers.length ? `<small>${esc(w.rulers.map((r) => r.name).join(", "))}</small>` : ""}${claim(w.claim)}</div>`).join("");

  sourcesBlock = () => `<div class="sources">
      <div><h4>${icon("library", 16)}Scholars and writers cited</h4><ol class="cites">${M.citations.map((c) => `<li><b>${esc(c.author)}</b>, <i>${esc(c.title)}</i> (${esc(c.year)})${c.where ? `, ${esc(c.where)}` : ""} <a href="${esc(c.url)}" target="_blank" rel="noreferrer">${icon("arrowUp", 12)}</a></li>`).join("")}</ol></div>
      <div><h4>${icon("book", 16)}Passages read for these pages</h4><p class="passages">${[...M.passages.leader, ...M.passages.prophet].filter((r, i, all) => all.findIndex((x) => x[0] === r[0] && x[1] === r[1]) === i).map(refLink).join(" ")}</p>
        <h4>${icon("scroll", 16)}Outside the Bible</h4>${M.leader.outside.map((o) => `<div class="outside"><b>${esc(o.name)}</b><small>${esc(o.date)}</small>${claim(o.claim)}</div>`).join("")}
        <p class="credit">${esc(M.credit)} Verse text: King James Version.</p></div></div>`;

  // A scene's own content: the key verse, the few lines, and the full sourced detail one click away.
  sceneMore = (s) => {
    const extra = [...s.more.map((c) => claim(c)), s.burial ? `<blockquote class="q"><p>${esc(s.burial.text)}</p><footer>${refLink(s.burial.span)} · KJV</footer></blockquote>` : "",
      ...(s.tradition ?? []).map((c) => claim(c))].join("");
    return extra ? expander(null, extra, { closed: `The full detail · ${s.more.length + (s.tradition?.length ?? 0) + (s.burial ? 1 : 0)} sourced notes`, opened: "Show less" }) : "";
  };
  sceneLines = (s) => `${s.quote ? quoteSpan(s.quote, "q-call") : ""}${s.lines.map((c) => claim(c)).join("")}`;
  placeTag = (s) => `<span class="place-tag">${icon("map", 13)}${esc(s.placeName)}</span>`;
})();


// --- map ---
// The journey map: the Atlas's own land outline (world-atlas 1:10m, projected by the extractor), the places from
// data/places.json, and a route that lights stop by stop. One renderer for all four directions.
(() => {
  let uid = 0;
  const R = Math.PI / 180;
  const project = (lon, lat) => [M.map.translate[0] + M.map.scale * lon * R, M.map.translate[1] - M.map.scale * Math.log(Math.tan(Math.PI / 4 + (lat * R) / 2))];
  // Route geometry: one quadratic curve per leg, bowed a little so out-and-back legs do not overlap.
  function legs() {
    const st = M.map.route, out = [];
    for (let i = 0; i < st.length - 1; i++) {
      const [x0, y0] = st[i].xy, [x1, y1] = st[i + 1].xy, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
      const bow = len < 1 ? 0 : (i % 2 ? 1 : -1) * Math.min(.18 * len, 46);
      const c = [(x0 + x1) / 2 - (dy / (len || 1)) * bow, (y0 + y1) / 2 + (dx / (len || 1)) * bow];
      const at = (t) => [(1 - t) ** 2 * x0 + 2 * (1 - t) * t * c[0] + t * t * x1, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * c[1] + t * t * y1];
      let L = 0, prev = [x0, y0]; const table = [0];
      for (let k = 1; k <= 24; k++) { const p = at(k / 24); L += Math.hypot(p[0] - prev[0], p[1] - prev[1]); table.push(L); prev = p; }
      out.push({ i, act: st[i + 1].act, d: `Q${c[0].toFixed(1)},${c[1].toFixed(1)} ${x1},${y1}`, from: [x0, y0], len: L, table, at });
    }
    return out;
  }
  // The point a fraction f along a leg, by arc length.
  const along = (leg, f) => {
    const target = f * leg.len, k = leg.table.findIndex((v) => v >= target);
    if (k <= 0) return leg.at(0);
    const a = leg.table[k - 1], b = leg.table[k], t = (k - 1 + (target - a) / (b - a || 1)) / 24;
    return leg.at(t);
  };

  // Which side of its dot a stop's label sits, so neighbours do not collide.
  const SIDE = { Egypt: "l", Rameses: "l", Rephidim: "l", Horeb: "b", Succoth: "l", Etham: "b", Elim: "b", "Plains of Moab": "l" };
  MosesMap = (host, { mini = false, act = 0, labels = true } = {}) => {
    const id = `mm${++uid}`, map = M.map, L = legs();
    const acts = [2, 3].map((a) => {
      const mine = L.filter((l) => l.act === a), start = mine[0].i;
      const d = `M${mine[0].from.join(",")}` + mine.map((l) => l.d).join("");
      return { act: a, first: start, last: start + mine.length, d, len: mine.reduce((s, l) => s + l.len, 0) };
    });
    // One dot per location; stops that share a point share a dot and a label.
    const spots = [];
    map.route.forEach((s, i) => {
      const hit = spots.find((p) => Math.hypot(p.xy[0] - s.xy[0], p.xy[1] - s.xy[1]) < 2);
      if (hit) { hit.idx.push(i); if (!hit.names.includes(s.name)) hit.names.push(s.name); } else spots.push({ xy: s.xy, idx: [i], names: [s.name], act: s.act, minor: !["Egypt", "Midian", "Horeb", "Rameses", "Marah", "Rephidim", "Kadesh-barnea", "Mount Nebo"].includes(s.name) });
    });
    const grat = [];
    for (let lon = 24; lon <= 41; lon++) { const [x] = project(lon, 30); grat.push(`M${x.toFixed(1)},-900V${map.h + 900}`); }
    for (let lat = 24; lat <= 36; lat += 1) { const [, y] = project(32, lat); grat.push(`M-1200,${y.toFixed(1)}H${map.w + 1200}`); }
    host.classList.add("mm-host");
    host.innerHTML = `<svg class="mm ${mini ? "mm-mini" : ""}" viewBox="0 0 ${map.w} ${map.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of Moses' journeys: Egypt, Midian, Sinai and Moab">
      <defs>
        <linearGradient id="${id}-land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="mm-l1"/><stop offset=".55" class="mm-l2"/><stop offset="1" class="mm-l3"/></linearGradient>
        <radialGradient id="${id}-sea" cx="45%" cy="40%" r="75%"><stop offset="0" class="mm-s1"/><stop offset="1" class="mm-s2"/></radialGradient>
        <pattern id="${id}-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".75" class="mm-dotfill"/></pattern>
        <filter id="${id}-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
        <filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        ${acts.map((a) => `<mask id="${id}-m${a.act}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="5000" height="5000"><path class="mm-mask" data-act="${a.act}" d="${a.d}" pathLength="${a.len.toFixed(1)}" stroke-dasharray="${a.len.toFixed(1)} ${a.len.toFixed(1)}" stroke-dashoffset="${a.len.toFixed(1)}"/></mask>`).join("")}
      </defs>
      <rect x="-1200" y="-900" width="${map.w + 2400}" height="${map.h + 1800}" fill="url(#${id}-sea)"/>
      <path class="mm-grat" d="${grat.join("")}" vector-effect="non-scaling-stroke"/>
      <path class="mm-coast" d="${map.land}" filter="url(#${id}-soft)"/>
      <path class="mm-land" d="${map.land}" fill="url(#${id}-land)" vector-effect="non-scaling-stroke"/>
      <path class="mm-dots" d="${map.land}" fill="url(#${id}-dots)"/>
      ${map.lakes.map((d) => `<path class="mm-lake" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${map.rivers.map((d) => `<path class="mm-river" d="${d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${labels ? map.labels.map((l) => `<text class="mm-region ${l.kind === "sea" ? "is-sea" : ""}" x="${l.xy[0]}" y="${l.xy[1]}">${esc(l.name)}</text>`).join("") : ""}
      ${acts.map((a) => `<path class="mm-ghost" data-act="${a.act}" d="${a.d}" vector-effect="non-scaling-stroke"/>`).join("")}
      ${acts.map((a) => `<path class="mm-lit" data-act="${a.act}" d="${a.d}" mask="url(#${id}-m${a.act})" filter="url(#${id}-glow)" vector-effect="non-scaling-stroke"/>`).join("")}
      ${map.markers.map((m) => `<g class="mm-marker is-${m.kind}" data-place="${m.placeId}" transform="translate(${m.xy[0]} ${m.xy[1]})"><circle class="mm-mk"/>${m.kind === "water" && labels ? `<text class="mm-mk-label" y="-14">${esc(m.name)}</text>` : ""}</g>`).join("")}
      ${spots.map((s, k) => `<g class="mm-stop ${s.minor ? "is-minor" : ""}" data-side="${SIDE[s.names[0]] ?? "r"}" data-spot="${k}" data-idx="${s.idx.join(" ")}" data-act="${s.act}" data-place="${map.route[s.idx[0]].placeId}" transform="translate(${s.xy[0]} ${s.xy[1]})">
        <circle class="mm-halo"/><circle class="mm-dot"/>${labels ? `<text class="mm-label" x="0" y="0">${esc(s.names.join(" · "))}</text>` : ""}</g>`).join("")}
      <g class="mm-walker" transform="translate(${map.route[0].xy.join(" ")})"><circle class="mm-walker-halo"/><circle class="mm-walker-dot"/></g>
    </svg>`;
    const svg = host.querySelector("svg"), walker = svg.querySelector(".mm-walker");
    const masks = acts.map((a) => svg.querySelector(`.mm-mask[data-act="${a.act}"]`));
    const stopsEl = [...svg.querySelectorAll(".mm-stop")];
    let view = [0, 0, map.w, map.h];
    const fit = () => {
      const r = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const scale = Math.max(r.width / view[2], r.height / view[3]);
      host.style.setProperty("--mm-k", (1 / scale).toFixed(4));
    };
    const ro = new ResizeObserver(fit); ro.observe(host);

    const api = {
      svg, stops: map.route,
      // t: position along the road in stop units (0 = first stop, n-1 = Nebo).
      setProgress(t) {
        const n = map.route.length - 1; t = Math.max(0, Math.min(n, t));
        acts.forEach((a, k) => {
          let lit = 0;
          for (const l of L.filter((x) => x.act === a.act)) lit += l.len * clamp01(t - l.i);
          masks[k].style.strokeLinecap = "";
          masks[k].setAttribute("stroke-dasharray", `${a.len.toFixed(1)} ${a.len.toFixed(1)}`);
          masks[k].setAttribute("stroke-dashoffset", (a.len - lit).toFixed(2));
        });
        const i = Math.min(n - 1, Math.floor(t)), f = t - i, pt = along(L[i], f);
        walker.setAttribute("transform", `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
        const cur = Math.round(t);
        stopsEl.forEach((el) => {
          const idx = el.dataset.idx.split(" ").map(Number);
          el.classList.toggle("is-reached", idx.some((x) => x <= t + .02));
          el.classList.toggle("is-current", idx.includes(cur) && Math.abs(t - cur) < .35);
        });
        svg.dataset.act = String(map.route[cur].act);
      },
      // Lights only the stretch of road from t0 to t1 (stop units); the walker stands at t1.
      setRange(t0, t1) {
        const n = map.route.length - 1; t0 = Math.max(0, Math.min(n, t0)); t1 = Math.max(t0, Math.min(n, t1));
        acts.forEach((a, k) => {
          const litAt = (t) => L.filter((x) => x.act === a.act).reduce((s, l) => s + l.len * clamp01(t - l.i), 0);
          const s0 = litAt(t0), s1 = litAt(t1);
          // One dash from s0 to s1; square ends, so an empty stretch leaves no round dot behind.
          masks[k].style.strokeLinecap = "butt";
          masks[k].setAttribute("stroke-dasharray", `${Math.max(0, s1 - s0).toFixed(2)} ${(a.len * 2).toFixed(1)}`);
          masks[k].setAttribute("stroke-dashoffset", (-s0).toFixed(2));
        });
        const i = Math.min(n - 1, Math.floor(t1)), pt = along(L[i], t1 - i);
        walker.setAttribute("transform", `translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)})`);
        const cur = Math.round(t1);
        stopsEl.forEach((el) => {
          const idx = el.dataset.idx.split(" ").map(Number);
          el.classList.toggle("is-reached", idx.some((x) => x >= t0 - .02 && x <= t1 + .02));
          el.classList.toggle("is-current", idx.includes(cur) && Math.abs(t1 - cur) < .35);
        });
        svg.dataset.act = String(map.route[cur].act);
      },
      setView(box) { view = box; svg.setAttribute("viewBox", box.map((v) => v.toFixed(1)).join(" ")); fit(); },
      // The box around one act's stops (0 = everything), with room around it.
      viewFor(a) {
        let x0, y0, w, h;
        if (map.views[a]) [x0, y0, w, h] = map.views[a];
        else {
          const xs = map.route.map((s) => s.xy[0]), ys = map.route.map((s) => s.xy[1]), pad = 80;
          x0 = Math.min(...xs) - pad; y0 = Math.min(...ys) - pad; w = Math.max(...xs) + pad - x0; h = Math.max(...ys) + pad - y0;
        }
        const ratio = map.w / map.h, W = Math.max(w, h * ratio), H = W / ratio;
        return [x0 + w / 2 - W / 2, y0 + h / 2 - H / 2, W, H];
      },
      // A viewBox (with the host's own proportions) that shows box inside region {x, y, w, h} of the host, in pixels.
      fit(box, region) {
        const r = host.getBoundingClientRect(), s = Math.min(region.w / box[2], region.h / box[3]);
        const cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2;
        return [cx - (region.x + region.w / 2) / s, cy - (region.y + region.h / 2) / s, r.width / s, r.height / s];
      },
      size: () => host.getBoundingClientRect(),
      lerpView: (a, b, t) => a.map((v, i) => v + (b[i] - v) * t),
      get view() { return view; },
      pulse(placeId) { svg.querySelectorAll("[data-place]").forEach((g) => g.classList.toggle("is-pulse", g.dataset.place === placeId)); },
      destroy() { ro.disconnect(); },
    };
    api.setProgress(0);
    requestAnimationFrame(fit);
    return api;
  };
  // The stop index where each scene's place first appears (for scroll-driven drawing).
  stopIndexFor = (placeId, after = 0) => {
    const i = M.map.route.findIndex((s, k) => k >= after && s.placeId === placeId);
    return i;
  };
})();


// --- dir-forties ---
// B · Three forties. A command-deck hero: a 120-year ring split into the three forties of Acts 7. Choose an act and its
// bento tiles (scenes, people, words, places) fill the screen and open in place.
(() => {
  const C = 260, R = 196;
  const pt = (y, r = R) => { const a = ((-90 + y * 3) * Math.PI) / 180; return [C + Math.cos(a) * r, C + Math.sin(a) * r]; };
  const arc = (y0, y1, r = R) => { const [x0, y0p] = pt(y0, r), [x1, y1p] = pt(y1, r); return `M${x0.toFixed(1)},${y0p.toFixed(1)}A${r},${r} 0 ${y1 - y0 > 60 ? 1 : 0} 1 ${x1.toFixed(1)},${y1p.toFixed(1)}`; };
  // Ages Scripture itself gives (Acts 7:23, Exodus 7:7, Deuteronomy 34:7), and the years of the forty it numbers.
  const STATED = [[40, "40 · Acts 7:23", "end"], [80, "80 · Exodus 7:7", "start"], [120, "120 · Deut 34:7", "end"]];
  const ACT = {
    1: { people: ["amram-exo-6-18", "jochebed-exo-6-20", "miriam-exo-15-20", "aaron-exo-4-14"], stops: [0, 0] },
    2: { people: ["zipporah-exo-2-21", "jethro-exo-2-18", "gershom-exo-2-22", "aaron-exo-4-14"], stops: [0, 3] },
    3: { people: ["pharaoh-exo-3-10", "aaron-exo-4-14", "miriam-exo-15-20", "joshua-exo-17-9", "korah-exo-6-21", "eldad-num-11-26", "jannes-2ti-3-8", "balak-num-22-2", "sihon-num-21-21", "og-num-21-33", "hur-num-31-8", "eliezer-exo-18-4"], stops: [3, 15] },
  };
  // Where each act's name sits: beside its arc, never across it or its dots.
  const LABEL_AT = { 1: () => { const [x, y] = pt(20, R + 52); return [x - 26, y]; }, 2: () => pt(60, R + 52), 3: () => { const [x, y] = pt(108.5, R + 40); return [x + 22, y - 2]; } };
  const LABEL_ANCHOR = { 1: "start", 2: "middle", 3: "end" };
  const ring = () => {
    const ticks = Array.from({ length: 25 }, (_, i) => i * 5).map((y) => { const [a, b] = [pt(y, R + 18), pt(y, R + (y % 10 ? 24 : 30))]; return `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" class="${y % 40 ? "" : "is-major"}"/>`; }).join("");
    const dots = M.forties.map((f) => { const list = M.scenes.filter((s) => s.act === f.act); return list.map((s, i) => { const [x, y] = pt(f.from + ((i + 1) * 40) / (list.length + 1)); return `<g class="tf-dot" data-scene="${s.id}" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}" tabindex="0" role="button" aria-label="${esc(s.title)}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><title>${esc(s.title)}</title></g>`; }).join(""); }).join("");
    const stated = STATED.map(([y, label, anchor]) => { const [x, yy] = y === 120 ? [250, 132] : pt(y, R - 44); return `<text class="tf-stated" text-anchor="${anchor}" x="${x.toFixed(1)}" y="${yy.toFixed(1)}">${label}</text>`; }).join("");
    return `<svg class="tf-ring" viewBox="-74 -6 668 532" role="group" aria-label="Moses' 120 years in three forties">
      <defs><filter id="tf-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle class="tf-orbit" cx="${C}" cy="${C}" r="${R + 50}"/><circle class="tf-orbit" cx="${C}" cy="${C}" r="${R - 58}"/>
      <g class="tf-ticks">${ticks}</g><circle class="tf-track" cx="${C}" cy="${C}" r="${R}"/>
      ${M.forties.map((f) => `<path class="tf-arc" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}" d="${arc(f.from + .8, f.to - .8)}" pathLength="1" filter="url(#tf-glow)"/>
        <path class="tf-hit" data-act="${f.act}" d="${arc(f.from + .8, f.to - .8)}"><title>${esc(f.name)}, years ${f.from}–${f.to}</title></path>`).join("")}
      ${M.forties.map((f) => { const [x, y] = LABEL_AT[f.act](); return `<text class="tf-actlabel" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]};text-anchor:${LABEL_ANCHOR[f.act]}" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${["I", "II", "III"][f.act - 1]} · ${esc(f.name)}</text>`; }).join("")}
      ${dots}${stated}
      <g class="tf-hand"><line x1="${C}" y1="${C - R + 62}" x2="${C}" y2="${C - R + 10}"/><circle cx="${C}" cy="${C - R}" r="5"/></g>
      <text class="tf-big" x="${C}" y="${C + 16}">120</text><text class="tf-sub" x="${C}" y="${C + 44}">years</text>
    </svg>`;
  };
  const sceneTile = (s, i) => `<article class="tf-tile tf-scene glass xp ${i === 0 ? "t-wide" : "t-mid"}" id="tf-${s.id}" style="--tone:${ACT_TONE[s.act]};--k:${i}">
      <div class="tf-art">${art(s.art)}</div>
      <div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon(SCENE_ICON[s.art] ?? "sparkle", 28, 1.4)}</span><div><span class="kicker">${esc(s.placeName)}</span><h3>${esc(s.title)}</h3></div></div>
        ${kjv(s.verse, "kjv-sm")}
        <button type="button" class="tf-open" data-xp aria-expanded="false" data-open="Close" data-closed="Open the scene"><span class="xp-label">Open the scene</span>${icon("expand", 14)}</button></div>
      <div class="xp-body"><div class="xp-inner tf-deep">${s.verse2 ? kjv(s.verse2, "kjv-sm") : ""}${sceneLines(s)}${[...s.more.map((c) => claim(c)), s.burial ? `<blockquote class="q"><p>${esc(s.burial.text)}</p><footer>${refLink(s.burial.span)} · KJV</footer></blockquote>` : "", ...(s.tradition ?? []).map((c) => claim(c))].join("")}</div></div></article>`;
  const peopleTile = (a) => {
    const all = peopleList(), list = ACT[a].people.map((id) => all.find((p) => p.id === id)).filter(Boolean);
    return `<article class="tf-tile tf-people glass t-mid" style="--tone:${ACT_TONE[a]};--k:8"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("users", 28, 1.4)}</span><div><span class="kicker">People in this act</span><h3>${list.length} people</h3></div></div>
      <div class="tf-chips">${list.map((p) => `<button type="button" class="tf-chip" data-pick="${p.id}"><span>${esc(p.name[0])}</span>${esc(p.name.replace(/, one of five kings of Midian/, "").replace(/ of the Exodus/, ""))}</button>`).join("")}</div>
      <div class="tf-pick">${personDetail(list[0])}</div></div></article>`;
  };
  const placesTile = (a) => {
    const [s0, s1] = ACT[a].stops, stops = M.map.route.slice(s0, s1 + 1).filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i);
    return `<article class="tf-tile tf-places glass t-sm t-tall" style="--tone:${ACT_TONE[a]};--k:9"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("map", 28, 1.4)}</span><div><span class="kicker">Places</span><h3>${stops.length === 1 ? stops[0].name : `${stops[0].name} to ${stops[stops.length - 1].name}`}</h3></div></div>
      <ol class="tf-stops">${stops.map((s) => `<li><b>${esc(s.name)}</b><span>${refLink(s.verse.ref)}</span><small>${Math.round(s.confidence * 100)}%</small></li>`).join("")}</ol><p class="tf-note">Percent: how sure the Atlas is of the spot.</p></div>
      <div class="tf-minimap" data-act="${a}"></div></article>`;
  };
  const wordsTile = (a) => {
    const body = a === 1 ? M.leader.accession.slice(0, 1).map((c) => claim(c)).join("") : a === 2 ? callSteps().split("</article>").slice(0, 2).join("</article>") + "</article>" : M.word.words.map((w) => `<div class="word-to"><b>To ${esc(w.to)}</b>${quoteSpan(w.quote)}</div>`).join("");
    return `<article class="tf-tile tf-words glass ${a === 3 ? "t-mid" : "t-mid"}" style="--tone:${ACT_TONE[a]};--k:10"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon(a === 2 ? "flame" : "message", 28, 1.4)}</span><div><span class="kicker">${a === 2 ? "The call" : a === 1 ? "Refused" : "His words"}</span><h3>${a === 2 ? "Sent from the bush" : a === 1 ? "\"Who made thee a prince?\"" : "Words to people"}</h3></div></div>${body}</div></article>`;
  };
  const verseTile = (f) => `<article class="tf-tile tf-verse glass t-wide" style="--tone:${ACT_TONE[f.act]};--k:0"><div class="tf-tile-body"><span class="tf-roman">${["I", "II", "III"][f.act - 1]}</span>
      <div><span class="kicker">Act ${f.act} · years ${f.from}–${f.to} · ${esc(f.name)}</span><p class="tf-acts">${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV · Stephen's telling of the life</footer></div></div></article>`;
  const bento = (a) => {
    const f = actOf(a), scenes = M.scenes.filter((s) => s.act === a);
    const extra = a === 3 ? `<article class="tf-tile tf-plagues glass t-full" style="--tone:var(--midian);--k:2"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("darkness", 28, 1.4)}</span><div><span class="kicker">Exodus 7–12</span><h3>The ten plagues</h3></div></div>${plaguesGrid()}</div></article>` : "";
    const [first, ...rest] = scenes;
    return verseTile(f) + placesTile(a) + sceneTile(first, 0) + extra + rest.map((s, i) => sceneTile(s, i + 1)).join("") + peopleTile(a) + (a === 1 ? "" : wordsTile(a));
  };

  // B's landing: the ring beside the three act cards and the Deuteronomy 34:7 line. H (the merged page) mounts it as is.
  const landing = () => { const p = M.person; return `
        <section class="tf-deck"><div class="wrap">${topline()}
          <div class="tf-hero">
            <div class="tf-copy"><span class="kicker">${esc(p.prophetTitle)}</span><h1>Moses</h1><p class="tf-lede">One life of 120 years, told by Stephen as three forties.</p>
              <div class="tf-acts-btns">${M.forties.map((f) => `<button type="button" class="tf-act-btn" data-act="${f.act}" style="--tone:${ACT_TONE[f.act]}"><span class="tf-n">${["I", "II", "III"][f.act - 1]}</span><span><b>${esc(f.name)}</b><small>Years ${f.from}–${f.to} · ${esc(refText(f.verse.ref))}</small></span>${icon("arrowRight", 16)}</button>`).join("")}</div>
              <p class="tf-end"><b>120</b> ${esc(M.end.text)} ${refLink(M.end.ref)}</p></div>
            <div class="tf-ring-wrap">${ring()}</div>
          </div></div></section>`; };
  // One frame of the ring: on the first sweep (full) the hand runs 0 to 120 and lights each forty, then rests on act
  // "to"; otherwise it turns to act "to". q is 0..1 over the ring's part of the motion.
  const ringFrame = (svg, q, { full, to }) => {
    const hand = svg.querySelector(".tf-hand"), big = svg.querySelector(".tf-big"), sub = svg.querySelector(".tf-sub"), f = actOf(to);
    const y = full ? 120 * easeInOut(q) : f.from + 40 * easeInOut(q);
    svg.querySelectorAll(".tf-arc").forEach((a) => a.style.setProperty("--p", full ? clamp01((y - (Number(a.dataset.act) - 1) * 40) / 40).toFixed(3) : "1"));
    svg.querySelectorAll(".tf-dot").forEach((d) => d.classList.toggle("is-lit", full ? (Number(d.dataset.act) - 1) * 40 + 20 <= y + 6 : true));
    hand.style.transform = `rotate(${(full ? y : f.from + 20 * easeInOut(q)) * 3}deg)`;
    big.textContent = full && q < 1 ? String(Math.round(y)) : `${f.from}–${f.to}`;
    sub.textContent = full && q < 1 ? "years" : f.name;
  };

  DIRECTIONS.forties = {
    name: "Three forties", swatch: "#22599f",
    ring, landing, ringFrame, // reused by H (the merged page)
    mount(main) {
      main.innerHTML = `${landing()}
        <section class="wrap tf-board"><div class="tf-board-head"><span class="kicker tf-board-k">Act I · Egypt</span><h2 class="tf-board-h">The scenes of this forty</h2><span class="tf-hint">Open any tile; it grows in place.</span></div>
          <div class="tf-bento"></div></section>
        <section class="wrap tf-board tf-across"><div class="tf-board-head"><span class="kicker" style="--tone:var(--accent)">Across all 120 years</span><h2>The man, the word, the questions</h2></div>
          <div class="tf-bento is-static">
            <article class="tf-tile glass t-full" style="--tone:var(--midian)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("users", 28, 1.4)}</span><div><span class="kicker">The people around him</span><h3>Family, companions and those against him</h3></div></div>${peopleNet()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("quote", 28, 1.4)}</span><div><span class="kicker">How Scripture remembers him</span><h3>${M.leader.scriptureSays.length} sayings</h3></div></div><div class="tf-scroll">${saysList()}</div></div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("flame", 28, 1.4)}</span><div><span class="kicker">The word</span><h3>The call</h3></div></div><div class="tf-scroll">${callSteps()}</div></div></article>
            <article class="tf-tile glass t-full" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("sparkle", 28, 1.4)}</span><div><span class="kicker">Signs</span><h3>Six signs</h3></div></div><div class="signs">${signTiles()}</div></div></article>
            <article class="tf-tile glass t-full" style="--tone:var(--wild)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("arrowRight", 28, 1.4)}</span><div><span class="kicker">What came of the word</span><h3>Said, then reported</h3></div></div>${fulfilPairs()}<div class="tf-more">${wordMore()}</div></div></article>
            <article class="tf-tile glass t-wide" style="--tone:var(--prophets)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("help", 28, 1.4)}</span><div><span class="kicker">Open questions</span><h3>${M.questions.length} questions readers ask</h3></div></div>${questionList()}</div></article>
            <article class="tf-tile glass t-sm" style="--tone:var(--prophets)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("hourglass", 28, 1.4)}</span><div><span class="kicker">When?</span><h3>Dates</h3></div></div>${datesBlock()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("layers", 28, 1.4)}</span><div><span class="kicker">Two accounts</span><h3>Exodus beside Deuteronomy</h3></div></div>${twoAccounts()}</div></article>
            <article class="tf-tile glass t-mid" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("eye", 28, 1.4)}</span><div><span class="kicker">Not said</span><h3>What Scripture does not say</h3></div></div>${notSaid()}</div></article>
            <article class="tf-tile glass t-full" id="sources" style="--tone:var(--accent)"><div class="tf-tile-body"><div class="tf-tile-top"><span class="badge">${icon("library", 28, 1.4)}</span><div><span class="kicker">Sources</span><h3>Where every line comes from</h3></div></div>${sourcesBlock()}</div></article>
          </div></section>`;
      const svg = main.querySelector(".tf-ring"), board = main.querySelector(".tf-bento");
      let act = 0, mini = null;
      // The sweep: the hand runs 0→120 and lights each forty; on choosing an act, its tiles rise in turn.
      const sweep = (to) => {
        const tiles = [...board.querySelectorAll(".tf-tile")];
        tiles.forEach((t) => t.style.setProperty("--in", "0"));
        const full = act === 0;
        Clock.run({ label: full ? "The 120-year ring sweeps, then Act I's tiles rise" : `Act ${to}: the ring turns, tiles rise`, duration: full ? 3200 : 1700,
          frame: (q) => {
            ringFrame(svg, full ? span(q, 0, .62) : span(q, 0, .4), { full, to });
            const tq = full ? span(q, .55, 1) : span(q, .2, 1);
            tiles.forEach((t, i) => t.style.setProperty("--in", easeOut(span(tq * (tiles.length + 3), i * .7, i * .7 + 2.4)).toFixed(3)));
            mini?.setProgress(ACT[to].stops[0] + (ACT[to].stops[1] - ACT[to].stops[0]) * easeInOut(span(q, .4, 1)));
          },
          moving: (q) => [full && q < .62 && "ring hand and arcs", full && q < .62 && "year count", (!full || q > .55) && q < 1 && "tiles rising", q > .4 && q < 1 && "minimap route"].filter(Boolean) });
      };
      const choose = (a) => {
        if (a === act) return;
        const first = act === 0;
        main.querySelectorAll(".tf-act-btn").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.act) === a)));
        svg.dataset.act = String(a);
        const f = actOf(a);
        main.querySelector(".tf-board-k").textContent = `Act ${["I", "II", "III"][a - 1]} · ${f.name} · years ${f.from}–${f.to}`;
        main.querySelector(".tf-board").style.setProperty("--tone", ACT_TONE[a]);
        board.innerHTML = bento(a);
        mini?.destroy();
        const host = board.querySelector(".tf-minimap");
        mini = MosesMap(host, { mini: true });
        requestAnimationFrame(() => { const r = mini.size(); mini.setView(mini.fit(mini.viewFor(a), { x: 14, y: 14, w: r.width - 28, h: r.height - 28 })); });
        act = first ? 0 : a;
        sweep(a);
        act = a;
      };
      const onClick = (e) => {
        const b = e.target.closest("[data-act]");
        if (b && (b.classList.contains("tf-act-btn") || b.classList.contains("tf-hit") || b.classList.contains("tf-actlabel"))) { choose(Number(b.dataset.act)); if (b.classList.contains("tf-act-btn") && innerWidth < 900) main.querySelector(".tf-board").scrollIntoView({ behavior: "smooth" }); return; }
        const d = e.target.closest(".tf-dot");
        if (d) { choose(Number(d.dataset.act)); const tile = main.querySelector(`#tf-${d.dataset.scene}`); if (tile) { tile.classList.add("is-open"); tile.querySelector("[data-xp]")?.setAttribute("aria-expanded", "true"); setTimeout(() => tile.scrollIntoView({ behavior: "smooth", block: "center" }), 300); } return; }
        const pick = e.target.closest("[data-pick]");
        if (pick) { const tile = pick.closest(".tf-people"); tile.querySelectorAll("[data-pick]").forEach((x) => x.setAttribute("aria-pressed", String(x === pick))); tile.querySelector(".tf-pick").innerHTML = personDetail(peopleList().find((p) => p.id === pick.dataset.pick)); }
      };
      main.addEventListener("click", onClick);
      choose(1);
      return () => mini?.destroy();
    },
  };
})();


// --- constellation-field ---
// The constellation field: one person at the centre and rings of points around him, drawn only from the data it is
// given, so the same component serves any person page (D draws Moses' people, places, moments and words with it; H draws
// the kinds of people around him). Data:
//   { center: "Moses", rings: [{ key, label, r? }], groups: [{ key, label, tone }],
//     nodes: [{ id, ring, group, label, mark?: "initial"|"diamond"|"numeral"|"dot"|"solid", numeral?, links: [ids] }] }
// Each ring runs in group order clockwise from the top. Choosing a point draws its links and fills the panel.
(() => {
  const C = 500;
  const short = (s, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
  const toneOf = (data, n) => { const g = data.groups.find((x) => x.key === n.group); return g ? (g.tone.startsWith("var(") ? g.tone : `var(--${g.tone})`) : "var(--accent)"; };

  // Positions: radius per ring (given, or spread from 165 to 465), points in group order with a gap at the top for the ring's name.
  function layout(data) {
    const rings = data.rings.map((r, k) => ({ ...r, r: r.r ?? (data.rings.length === 1 ? 300 : 165 + (300 * k) / (data.rings.length - 1)) }));
    const order = data.groups.map((g) => g.key), byId = {};
    rings.forEach((ring, k) => {
      const list = data.nodes.filter((n) => n.ring === ring.key).sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
      // stagger (0..1): each ring starts a little further round, so a label on one ring does not land on a point of the next.
      const base = data.stagger ? .2 + ((k * data.stagger) % 1) * .6 : .5;
      list.forEach((n, i) => { const a = (-90 + 9 + (342 * (i + base)) / list.length) * Math.PI / 180; n.x = C + Math.cos(a) * ring.r; n.y = C + Math.sin(a) * ring.r; n.angle = a; n.tone = toneOf(data, n); });
    });
    const bottomAnchor = data.nodes.find(n => n.id === 'aaron-exo-4-14');
    if (bottomAnchor) {
      const rotation = Math.PI / 2 - bottomAnchor.angle;
      rings.forEach(ring => { ring.labelX = C + Math.sin(rotation) * ring.r; ring.labelY = C - Math.cos(rotation) * ring.r + 4; });
      data.nodes.forEach(n => {
        const radius = Math.hypot(n.x - C, n.y - C);
        n.angle += rotation;
        n.x = C + Math.cos(n.angle) * radius;
        n.y = C + Math.sin(n.angle) * radius;
      });
    }
    data.nodes.filter(n => n.id === 'who:god' || n.label === 'God').forEach(n => {
      n.mark = 'omega'; n.x = C; n.y = C - (rings.find(r => r.key === 'family')?.r ?? 165) * .65; n.angle = -Math.PI / 2;
    });
    data.nodes.forEach((n) => { byId[n.id] = n; });
    data.nodes.forEach((n) => { n.linked = (n.links ?? []).map((id) => byId[id]).filter(Boolean); });
    return { rings, byId };
  }

  const mark = (n) => {
    const m = n.mark ?? "dot";
    if (m === "omega") return '<circle class="cs-dot cs-god-dot" r="18"/><text class="cs-god-omega" y="8">&#937;</text>';
    if (m === "diamond") return `<rect class="cs-dot" x="-6" y="-6" width="12" height="12" rx="2" transform="rotate(45)"/>`;
    const r = m === "numeral" ? 11 : m === "initial" ? 9 : 6;
    const text = m === "numeral" ? `<text class="cs-ico" y="5">${esc(n.numeral ?? "")}</text>` : m === "initial" ? `<text class="cs-ico" y="4">${esc(n.label[0])}</text>` : "";
    return `<circle class="cs-dot" r="${r}"/>${text}`;
  };

  Constellation = {
    // The field's svg (a square, 1000 units) and its legend.
    field(data, { label = `${data.center} and everyone around him`, cls = "" } = {}) {
      const { rings } = layout(data);
      return `<svg class="cs-svg ${cls}" viewBox="0 0 1000 1000" role="group" aria-label="${esc(label)}">
        <defs><radialGradient id="cs-core-${cls || "x"}"><stop offset="0" class="cs-core1"/><stop offset="1" class="cs-core2"/></radialGradient></defs>
        <circle cx="${C}" cy="${C}" r="490" fill="url(#cs-core-${cls || "x"})"/>
        ${rings.map((r) => `<circle class="cs-ring" data-ring="${r.key}" cx="${C}" cy="${C}" r="${r.r}" pathLength="1"/><text class="cs-ringlabel" x="${r.labelX ?? C}" y="${r.labelY ?? (C - r.r + 4)}">${esc(r.label)}</text>`).join("")}
        <g class="cs-spokes">${data.nodes.map((n) => `<line data-for="${n.id}" x1="${C}" y1="${C}" x2="${n.x.toFixed(1)}" y2="${n.y.toFixed(1)}"/>`).join("")}</g>
        <g class="cs-links"></g>
        <g class="cs-nodes">${data.nodes.map((n) => `<g class="cs-node is-${n.ring} m-${n.mark ?? "dot"} ${n.mark === "numeral" ? "is-big" : ""}" data-node="${esc(n.id)}" data-type="${n.ring}" data-group="${n.group}" style="--tone:${n.tone}" transform="translate(${n.x.toFixed(1)} ${n.y.toFixed(1)})" tabindex="0" role="button" aria-label="${esc(n.label)}">
          <circle class="cs-halo" r="${(n.mark === "omega" ? 30 : n.mark === "numeral" ? 22 : 14) * (n.markerScale ?? 1)}"/><g class="cs-marker" transform="scale(${n.markerScale ?? 1})">${mark(n)}</g>
          <text class="cs-label" text-anchor="${n.mark === "omega" ? "start" : Math.cos(n.angle) < -.2 ? "end" : Math.cos(n.angle) > .2 ? "start" : "middle"}" x="${n.mark === "omega" ? 24 * (n.markerScale ?? 1) : (Math.cos(n.angle) * (n.mark === "numeral" ? 18 : 14) * (n.markerScale ?? 1)).toFixed(1)}" y="${n.mark === "omega" ? 4 : (Math.sin(n.angle) * (n.mark === "numeral" ? 22 : 16) * (n.markerScale ?? 1) + 4).toFixed(1)}">${esc(short(n.short ?? n.label))}</text></g>`).join("")}</g>
        <g class="cs-core" data-node="core"><circle r="62" class="cs-core-halo" cx="${C}" cy="${C}"/><circle r="46" cx="${C}" cy="${C}"/><text x="${C}" y="${C + 8}">${esc(data.center)}</text></g>
      </svg>`;
    },
    legend(data, { marks = {} } = {}) {
      return `<ul class="cs-legend">${data.rings.map((r) => `<li class="is-${r.key} m-${marks[r.key] ?? "dot"}"><i></i>${esc(r.label)}</li>`).join("")}<li class="cs-legend-acts">${data.groups.filter((g) => data.nodes.some((n) => n.group === g.key)).map((g) => `<span style="--tone:${toneOf(data, { group: g.key })}"><i aria-hidden="true"></i>${esc(g.label)}</span>`).join("")}</li></ul>`;
    },
    // Wires a drawn field: choosing, links, the bloom, filters by ring and by group, and labels kept inside the field.
    wire(svg, data, { panel, panelHtml, coreHtml, afterSelect, onSelect, scrollPanel = () => innerWidth < 960 } = {}) {
      const { rings, byId } = layout(data);
      const linksG = svg.querySelector(".cs-links"), ringEls = [...svg.querySelectorAll(".cs-ring")];
      const nodeEls = Object.fromEntries([...svg.querySelectorAll(".cs-node")].map((g) => [g.dataset.node, g]));
      let cleanup = null, selected = null;
      const select = (id, scroll = false) => {
        cleanup?.(); cleanup = null;
        selected = id === "core" ? null : byId[id] ?? null;
        const near = new Set(selected?.linked.map((m) => m.id) ?? []);
        svg.querySelectorAll(".cs-node").forEach((g) => { g.classList.toggle("is-on", g.dataset.node === id); g.classList.toggle("is-linked", near.has(g.dataset.node)); });
        svg.classList.toggle("has-sel", !!selected);
        linksG.innerHTML = selected ? selected.linked.map((m) => `<path pathLength="1" style="--tone:${m.tone}" d="M${selected.x.toFixed(1)},${selected.y.toFixed(1)}Q${C + (selected.x + m.x - 2 * C) * .18},${C + (selected.y + m.y - 2 * C) * .18} ${m.x.toFixed(1)},${m.y.toFixed(1)}"/>`).join("") : "";
        if (panel) {
          panel.style.setProperty("--tone", selected ? selected.tone : "var(--accent)");
          panel.innerHTML = selected ? panelHtml(selected) : coreHtml();
          panel.classList.remove("is-in"); void panel.offsetWidth; panel.classList.add("is-in");
          cleanup = afterSelect?.(selected, panel) ?? null;
          if (scroll && scrollPanel()) panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        onSelect?.(selected);
        requestAnimationFrame(fitLabels);
      };
      // The bloom: rings draw, then the points fly out from the centre ring by ring (q is 0..1, for the clock).
      const bloomFrame = (q) => {
        ringEls.forEach((r, k) => r.style.setProperty("--p", easeInOut(span(q, k * .08, k * .08 + .4)).toFixed(3)));
        data.nodes.forEach((n) => { const k = rings.findIndex((r) => r.key === n.ring), t = easeOut(span(q, .15 + k * .15, .6 + k * .13));
          nodeEls[n.id].setAttribute("transform", `translate(${(C + (n.x - C) * t).toFixed(1)} ${(C + (n.y - C) * t).toFixed(1)}) scale(${(.3 + .7 * t).toFixed(3)})`); });
      };
      const bloomMoving = (q) => [q < .48 && "rings drawing", ...rings.map((r, k) => q > .15 + k * .15 && q < .6 + k * .13 && `${r.label.toLowerCase()} flying out`)].filter(Boolean);
      const setRing = (key) => { svg.dataset.only = key; data.nodes.forEach((n) => nodeEls[n.id].classList.toggle("is-out", key !== "all" && n.ring !== key)); };
      const setGroup = (key) => { const now = svg.dataset.group === key ? "" : key; svg.dataset.group = now; data.nodes.forEach((n) => nodeEls[n.id].classList.toggle("is-faded", !!now && n.group !== now)); return now; };
      // Labels that would run off the field turn inward (matters at phone sizes, where labels are larger).
      const fitLabels = () => data.nodes.forEach((n) => {
        const t = nodeEls[n.id].querySelector(".cs-label"), base = t.dataset.anchor ?? (t.dataset.anchor = t.getAttribute("text-anchor")), bx = t.dataset.x ?? (t.dataset.x = t.getAttribute("x"));
        t.setAttribute("text-anchor", base); t.setAttribute("x", bx);
        const box = t.getBBox();
        if (box.width && n.x + box.x + box.width > 996) { t.setAttribute("text-anchor", "end"); t.setAttribute("x", String(-Math.abs(Number(bx)))); }
        else if (box.width && n.x + box.x < 4) { t.setAttribute("text-anchor", "start"); t.setAttribute("x", String(Math.abs(Number(bx)))); }
      });
      const onClick = (e) => { const g = e.target.closest(".cs-node, .cs-core"); if (g && svg.contains(g)) select(g.dataset.node); };
      const onKey = (e) => { const g = e.target.closest?.(".cs-node"); if (g && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); select(g.dataset.node); } };
      svg.addEventListener("click", onClick); svg.addEventListener("keydown", onKey); addEventListener("resize", fitLabels);
      return { byId, select, bloomFrame, bloomMoving, setRing, setGroup, fitLabels, get selected() { return selected; },
        related: (n) => n.linked, destroy() { cleanup?.(); svg.removeEventListener("click", onClick); svg.removeEventListener("keydown", onKey); removeEventListener("resize", fitLabels); } };
    },
  };
})();


// --- dir-memory ---
// G · The long memory. Every verse that names Moses (STEP Bible's TIPNR list, data/memory.json) as light across the whole
// Bible: the 66 books in order, sized by chapters; each verse a point. Tags and speakers only where the verse's own words
// (or a named speaker nearby) support them.
(() => {
  let G = null;
  const load = async () => { if (G) return G; const res = { ok: true, json: async () => structuredClone((await import("./data/memory.json")).default) }; if (!res.ok) throw new Error(`memory.json: expected 200, got ${res.status}`); G = await res.json(); prep(); return G; };
  const TAG_TONE = { law: "var(--prophets)", servant: "var(--poetry)", prophet: "var(--gospels)", pleads: "var(--revelation)", led: "var(--history)", spoke: "var(--gm-gold)" };
  const WHO_TONE = { jesus: "var(--revelation)", narrator: "var(--gm-dim)", god: "var(--gm-gold)", people: "var(--history)", joshua: "var(--history)", caleb: "var(--history)", samuel: "var(--history)",
    kings: "var(--epistles)", psalmist: "var(--poetry)", moses: "var(--gm-gold)", prophets: "var(--prophets)", peter: "var(--poetry)", opponents: "var(--gm-dim2)", stephen: "var(--acts)",
    apostles: "var(--acts)", paul: "var(--gospels)", hebrews: "var(--prophets)", writers: "var(--gm-ink2)" };
  const SECTION_TONE = { history: "var(--strip-history)", poetry: "var(--strip-poetry)", prophets: "var(--strip-prophets)", gospels: "var(--strip-gospels)", epistles: "var(--strip-epistles)", revelation: "var(--strip-revelation)" };
  let OFF = {}, BOOK_UNITS = {}, TOTAL = 0, NUMS = [];
  function prep() {
    G.byBook = {}; for (const p of G.points) G.byBook[p.b] = (G.byBook[p.b] ?? 0) + 1;
    NUMS = Object.keys(G.books).map(Number).filter((n) => G.byBook[n]).sort((a, b) => a - b);
    let g = 0; for (const n of NUMS) { OFF[n] = g; BOOK_UNITS[n] = Math.max(20, G.books[n].chapters); g += BOOK_UNITS[n]; } TOTAL = g;
    G.points.forEach((p, i) => { p.i = i; p.g = OFF[p.b] + (p.c - .5) * BOOK_UNITS[p.b] / G.books[p.b].chapters; p.f = (p.v - 1) / Math.max(1, p.n - 1); });
  }
  const ref = (p) => `${G.books[p.b].name} ${p.c}:${p.v}`;
  const shortRef = (p) => `${G.books[p.b].code.replace(/^(\d?)([A-Z])([A-Z]+)$/, (m, d, a, b) => d + a + b.toLowerCase())} ${p.c}:${p.v}`;
  const whoLabel = (id) => G.who.find((w) => w.id === id)?.label ?? id;
  const tagLabel = (id) => G.tags.find((t) => t.id === id)?.label ?? id;

  // Layout for a given width: rows of chapters (same scale on every row), each verse at its height within its chapter.
  function layout(W) {
    const rows = W >= 1050 ? 3 : W >= 700 ? 5 : 8;
    const rowH = W >= 700 ? 118 : 84, labH = 26, band = rowH + labH;
    let groups;
    if (rows === 3) groups = [NUMS.filter(n => n <= 14), NUMS.filter(n => n > 14 && n <= 27), NUMS.filter(n => n > 27)];
    else {
      groups = []; let remaining = [...NUMS];
      while (groups.length < rows && remaining.length) {
        const left = rows - groups.length;
        if (left === 1) { groups.push(remaining); break; }
        const target = remaining.reduce((sum,n) => sum + BOOK_UNITS[n], 0) / left;
        let count = 1, units = BOOK_UNITS[remaining[0]];
        while (count < remaining.length - left + 1 && Math.abs(units + BOOK_UNITS[remaining[count]] - target) < Math.abs(units - target)) units += BOOK_UNITS[remaining[count++]];
        groups.push(remaining.splice(0,count));
      }
    }
    const books = {};
    groups.forEach((group,r) => {
      const weight = n => rows === 3 && n === 24 ? 36 : BOOK_UNITS[n];
      const total = group.reduce((sum,n) => sum + weight(n),0); let x = 0;
      group.forEach(n => { const width = W * weight(n) / total; books[n] = { r, x, top:r * band, width }; x += width; });
    });
    const at = g => {
      const n = NUMS.find(n => g >= OFF[n] && g < OFF[n] + BOOK_UNITS[n]) ?? NUMS.at(-1);
      const book = books[n];
      return { r:book.r, top:book.top, x:book.x + (g - OFF[n]) * book.width / BOOK_UNITS[n] };
    };
    return { W, rows:groups.length, rowH, labH, band, H:groups.length * band, books, at };
  }
  function field(W) {
    const L = layout(W), { rowH, labH } = L;
    const blocks = [], labels = [];
    NUMS.forEach((n,k) => {
      const b = G.books[n], a = L.books[n], w = a.width;
      blocks.push(`<rect class="gm-book ${k % 2 ? "is-odd" : ""}" data-book="${n}" x="${a.x.toFixed(2)}" y="${a.top}" width="${w.toFixed(2)}" height="${rowH}" style="--sec:${SECTION_TONE[b.section]}"><title>${esc(b.name)} &middot; ${b.chapters} chapters &middot; ${G.byBook[n]} verses name Moses</title></rect>`);
      blocks.push(`<rect class="gm-sec" x="${a.x.toFixed(2)}" y="${a.top + rowH}" width="${Math.max(w - 1,.5).toFixed(2)}" height="${labH}" style="--sec:${SECTION_TONE[b.section]}"/>`);
      labels.push(`<text class="gm-blabel has" data-book="${n}" x="${(a.x + w / 2).toFixed(1)}" y="${a.top + rowH + 17}" text-anchor="middle">${esc(b.name.length * 6.1 + 12 < w ? b.name : b.code.replace(/^(\d?)([A-Z])([A-Z]+)$/, (m,d,x,y) => d + x + y.toLowerCase()))}</text>`);
    });
    const pts = G.points.map((p) => { const a = L.at(p.g); p.x = a.x; p.y = a.top + 8 + p.f * (rowH - 16); return `<circle class="gm-pt ${p.tags.map((t) => `t-${t[0]}`).join(" ")} ${p.who ? `w-${p.who}` : "w-none"}" data-i="${p.i}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${W >= 700 ? 2.6 : 2.1}"/>`; }).join("");
    return { L, svg: `<svg class="gm-svg" viewBox="0 0 ${W.toFixed(0)} ${L.H}" width="${W.toFixed(0)}" height="${L.H}" role="img" aria-label="Every verse that names Moses, across the ${NUMS.length} books that mention him">
      <defs><filter id="gm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
      <g class="gm-blocks">${blocks.join("")}</g><g class="gm-labels">${labels.join("")}</g>
      <rect class="gm-beam" x="0" y="0" width="3" height="${rowH}"/>
      <g class="gm-glow" filter="url(#gm-glow)">${pts}</g><g class="gm-pts">${pts}</g>
      <circle class="gm-ring" r="8" cx="-20" cy="-20"/><circle class="gm-sel" r="10" cx="-20" cy="-20"/></svg>` };
  }

  const reading = (p) => {
    const echo = G.echoes.find((e) => e.id === p.id);
    return `<span class="gm-k">${esc(G.books[p.b].name)} · verse ${G.points.filter((x) => x.b === p.b && x.i <= p.i).length} of ${G.byBook[p.b]} naming him in this book</span>
      <h3>${esc(ref(p))}</h3><p class="gm-verse">${esc(p.text)}</p>
      ${echo?.src ? `<p class="gm-also">“${esc(echo.phrase)}” · ${esc(echo.src)}.</p>` : ""}
      <footer><a class="read" href="${refHref([p.id,p.id])}">${icon("open", 14)}Read the passage</a><span class="gm-steps"><button type="button" data-stepv="-1" aria-label="Previous verse">${icon("chevronLeft", 16)}</button><button type="button" data-stepv="1" aria-label="Next verse">${icon("chevronRight", 16)}</button></span></footer>`;
  };

  DIRECTIONS.memory = {
    name: "The long memory", swatch: "#e0b25c",
    mount(main, onReady) {
      main.innerHTML = `<div class="wrap gm-wait"><p>Gathering every verse…</p></div>`;
      let alive = true, ro = null, timer = 0;
      const off = [];
      load().then(() => { if (alive) draw(); }).catch((error) => { console.error("memory: could not load data/memory.json", error); main.innerHTML = `<p class="wrap">Could not load the verses: ${esc(error.message)}</p>`; });
      function draw() {
        const books = NUMS.filter((n) => G.byBook[n]), max = Math.max(...Object.values(G.byBook));
        const pent = G.points.filter((p) => p.b >= 2 && p.b <= 5).length;
        main.innerHTML = `
          <section class="wrap gm-main">
            <div class="gm-field-wrap"><div class="gm-field" data-field></div></div>
            <div class="gm-under">
              <article class="gm-read" data-read></article>
              <div class="gm-counts"><h3>Count per book <small>${books.length} books</small></h3><ol>${books.map((n) => `<li><button type="button" data-book="${n}"><span>${esc(G.books[n].name)}</span><i style="--w:${((G.byBook[n] / max) * 100).toFixed(1)}%;--sec:${SECTION_TONE[G.books[n].section]}"></i><b>${G.byBook[n]}</b></button></li>`).join("")}</ol></div>
            </div>
          </section>`;
        wire();
        options.onMemoryReady?.();
        onReady?.();
      }
      function wire() {
        const host = main.querySelector("[data-field]"), readEl = main.querySelector("[data-read]");
        const litEl = root.querySelector(".memory-banner-counter [data-lit]"), passEl = root.querySelector(".memory-banner-counter [data-passing]");
        let book = null, sel = G.points.find((p) => p.id === 66015003), F = null, lit = 0, circles = [], glows = [];
        const visible = (p) => !book || p.b === book;
        const render = () => {
          const W = Math.max(280, host.clientWidth);
          F = field(W); host.innerHTML = F.svg;
          circles = [...host.querySelectorAll(".gm-pts .gm-pt")]; glows = [...host.querySelectorAll(".gm-glow .gm-pt")];
          host.querySelector(".gm-svg").addEventListener("pointermove", onMove); host.querySelector(".gm-svg").addEventListener("pointerleave", () => moveRing(null)); host.querySelector(".gm-svg").addEventListener("click", onPick);
          applyLit(lit); apply(); select(sel, false);
        };
        const apply = () => {
          const svg = host.querySelector(".gm-svg");
          G.points.forEach((p, i) => { const v = visible(p); circles[i].classList.toggle("is-dim", !v); glows[i].classList.toggle("is-dim", !v); });
          svg.querySelectorAll(".gm-book").forEach((r) => r.classList.toggle("is-on", Number(r.dataset.book) === book));
          main.querySelectorAll(".gm-counts [data-book]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.book) === book)));
        };
        const moveRing = (p) => { const r = host.querySelector(".gm-ring"); if (!r) return; r.style.display = p ? "inline" : "none"; r.setAttribute("cx", p ? p.x : -20); r.setAttribute("cy", p ? p.y : -20); host.querySelector(".gm-svg").style.cursor = p ? "pointer" : "default"; };
        const nearest = (e) => {
          const svg = host.querySelector(".gm-svg"), box = svg.getBoundingClientRect(), x = (e.clientX - box.left) * (F.L.H / box.height), y = (e.clientY - box.top) * (F.L.H / box.height);
          let best = null, bd = 14 * 14;
          for (const p of G.points) { if (!visible(p)) continue; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
          return best;
        };
        const onMove = (e) => moveRing(nearest(e));
        const onPick = (e) => { const p = nearest(e); if (p) select(p, true); };
        const select = (p, scroll) => {
          if (!p) return; sel = p;
          const s = host.querySelector(".gm-sel"); s.style.display = "inline"; s.setAttribute("cx", p.x); s.setAttribute("cy", p.y);
          readEl.innerHTML = reading(p); readEl.style.setProperty("--tone", "var(--gm-gold)");
          if (scroll && innerWidth < 900) readEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };
        // Light travels through the canon: a beam sweeps the books in order and each verse lights as it passes.
        const applyLit = (g) => {
          lit = g;
          G.points.forEach((p, i) => { const on = p.g < g; circles[i]?.classList.toggle("is-lit", on); glows[i]?.classList.toggle("is-lit", on); });
        };
        const sweep = () => Clock.run({ label: "Light travels through the canon, Genesis to Revelation", duration: 6400,
          frame: (q) => {
            const g = q * TOTAL, n = G.points.filter((p) => p.g < g).length;
            applyLit(g); litEl.textContent = String(n);
            const beam = host.querySelector(".gm-beam");
            if (beam) { const gg = Math.min(g, TOTAL - .001), a = F.L.at(gg); beam.setAttribute("x", a.x.toFixed(1)); beam.setAttribute("y", a.top); beam.style.opacity = q > 0 && q < 1 ? "1" : "0"; }
            const bn = NUMS.find((b) => OFF[b] <= g && g < OFF[b] + BOOK_UNITS[b]) ?? 66;
            passEl.textContent = q >= 1 ? "From STEP Bible's names data" : `Now passing: ${G.books[bn].name}`;
          },
          moving: (q) => (q < 1 ? ["light beam", "verses lighting", "counter"] : []) });
        const onClick = (e) => {
          const b = e.target.closest(".gm-counts [data-book]");
          if (b) { book = book === Number(b.dataset.book) ? null : Number(b.dataset.book); apply(); const first = G.points.find(visible); if (first && book) select(first); host.scrollIntoView({ behavior: "smooth", block: "nearest" }); return; }
          const st = e.target.closest("[data-stepv]");
          if (st) { const list = G.points.filter(visible); const k = list.indexOf(sel); const next = list[(Math.max(0, k) + Number(st.dataset.stepv) + list.length) % list.length]; select(next); }
        };
        main.addEventListener("click", onClick);
        ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => { if (F && Math.abs(host.clientWidth - F.L.W) > 2) render(); }, 150); });
        ro.observe(host);
        off.push(() => { main.removeEventListener("click", onClick); });
        render(); sweep();
      }
      return () => { alive = false; ro?.disconnect(); clearTimeout(timer); off.forEach((f) => f()); };
    },
  };
})();


// --- merged-questions ---
// H · "What readers still ask": the open questions as words floating on the page, joined by fine lines to the heading
// and to their neighbours (no boxes). Choosing one opens its views in place underneath, quietly.
(() => {
  MergedAsk = {
    html(titles) {
      return `<section class="mg-ask" style="--tone:var(--prophets)" aria-label="What readers still ask">
        <div class="mg-ask-field" data-askfield>
          <svg class="mg-ask-lines" aria-hidden="true"></svg>
          <div class="mg-ask-hub" data-hub><span class="mg-kick">Open questions · ${M.questions.length}</span><h2>What readers still ask</h2><small>Choose one. Each view names who holds it.</small></div>
          ${M.questions.map((q, i) => `<button type="button" class="mg-word" data-q="${q.id}" style="--i:${i}" aria-expanded="false"><b>${esc(titles[q.id])}</b><small>${q.views.length} views</small></button>`).join("")}
        </div>
        <div class="mg-views" data-views><div class="mg-views-in"></div></div>
      </section>`;
    },
    wire(root) {
      const field = root.querySelector("[data-askfield]"), svg = field.querySelector(".mg-ask-lines"), hub = field.querySelector("[data-hub]");
      const words = [...field.querySelectorAll(".mg-word")], views = root.querySelector("[data-views]"), inner = views.querySelector(".mg-views-in");
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let pos = [], hubAt = [0, 0], W = 0, H = 0, raf = 0, chosen = null;
      // Places: an open ring around the heading on wide screens; a zigzag under it on a phone.
      const place = () => {
        W = field.clientWidth;
        const narrow = W < 640, n = words.length;
        if (narrow) {
          hubAt = [W / 2, 54];
          pos = words.map((_, i) => [i % 2 ? W * .66 : W * .34, 140 + i * 58]);
          H = 140 + (n - 1) * 58 + 46;
        } else {
          H = Math.min(470, Math.max(400, W * .36)); hubAt = [W / 2, H / 2];
          pos = words.map((_, i) => { const a = -Math.PI / 2 + (i + .5) * (Math.PI * 2 / n) + (i % 2 ? .1 : -.08), rx = W * .37, ry = H * .4 + (i % 2 ? 6 : -10);
            return [W / 2 + Math.cos(a) * rx, H / 2 + Math.sin(a) * ry]; });
        }
        field.style.height = `${H}px`; field.classList.toggle("is-narrow", narrow);
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        svg.innerHTML = words.map((w, i) => `<line class="mg-spoke" data-l="${w.dataset.q}"/><line class="mg-chain" data-c="${i}"/>`).join("");
        hub.style.transform = `translate(${hubAt[0]}px, ${hubAt[1]}px) translate(-50%, -50%)`;
        tick(performance.now());
      };
      // The words drift a few pixels on slow, separate rhythms; the lines follow them.
      const tick = (now) => {
        const t = still ? 0 : now / 1000, at = pos.map(([x, y], i) => [x + Math.sin(t * .35 + i * 1.7) * 3.5, y + Math.cos(t * .29 + i * 2.3) * 3]);
        words.forEach((w, i) => { w.style.transform = `translate(${at[i][0].toFixed(1)}px, ${at[i][1].toFixed(1)}px) translate(-50%, -50%)`; });
        const spokes = svg.querySelectorAll(".mg-spoke"), chain = svg.querySelectorAll(".mg-chain"), narrow = field.classList.contains("is-narrow");
        // Each spoke starts just outside the heading (an ellipse round it) and stops just short of its word.
        spokes.forEach((l, i) => { const [x, y] = at[i], [hx, hy] = hubAt, dx = x - hx, dy = y - hy, len = Math.hypot(dx, dy) || 1;
          const rx = narrow ? 0 : 170, ry = narrow ? 52 : 66, k = 1 / Math.hypot(dx / len / (rx || 1e-6), dy / len / ry), start = narrow ? 52 : Math.min(k, len * .6);
          l.style.display = narrow && i > 0 ? "none" : ""; l.setAttribute("x1", (hx + dx / len * start).toFixed(1)); l.setAttribute("y1", (hy + dy / len * start).toFixed(1)); l.setAttribute("x2", (x - dx / len * 26).toFixed(1)); l.setAttribute("y2", (y - dy / len * 22).toFixed(1)); });
        chain.forEach((l, i) => { const a = at[i], b = at[(i + 1) % at.length]; const last = i === at.length - 1;
          l.style.display = last ? "none" : ""; l.setAttribute("x1", a[0].toFixed(1)); l.setAttribute("y1", a[1].toFixed(1)); l.setAttribute("x2", b[0].toFixed(1)); l.setAttribute("y2", b[1].toFixed(1)); });
      };
      const loop = (now) => { tick(now); raf = requestAnimationFrame(loop); };
      const choose = (id) => {
        chosen = chosen === id ? null : id;
        field.classList.toggle("has-pick", !!chosen);
        words.forEach((w) => { w.classList.toggle("is-on", w.dataset.q === chosen); w.setAttribute("aria-expanded", String(w.dataset.q === chosen)); });
        svg.querySelectorAll(".mg-spoke").forEach((l) => l.classList.toggle("is-on", l.dataset.l === chosen));
        const q = M.questions.find((x) => x.id === chosen);
        if (q) inner.innerHTML = `<p class="mg-views-q">${esc(q.question)}</p><div class="mg-views-row">${q.views.map((v) => `<article class="mg-view"><h4>${esc(v.label)}</h4><small>${esc(v.holders)}</small>${claim(v.argument)}</article>`).join("")}</div>`;
        views.classList.toggle("is-open", !!q);
      };
      const onClick = (e) => { const w = e.target.closest(".mg-word"); if (w) choose(w.dataset.q); };
      root.addEventListener("click", onClick);
      const ro = new ResizeObserver(() => { if (Math.abs(field.clientWidth - W) > 1) place(); });
      ro.observe(field);
      place();
      if (!still) raf = requestAnimationFrame(loop);
      return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener("click", onClick); };
    },
  };
})();


// --- merged-parts ---
// H · smaller parts of the merged page: the quiet star field (the sky) at the top of each chapter, and the ten plagues as
// a grid of glyphs with small animated dots.
(() => {
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  // Two layers of faint points that drift very slowly in opposite directions (dust by day, stars by night).
  starField = (seed) => {
    const r = rng(seed), layer = (n, cls, big) => `<g class="${cls}">${Array.from({ length: n }, () => `<circle cx="${(r() * 1600).toFixed(0)}" cy="${(r() * 900).toFixed(0)}" r="${(big ? .9 + r() * 1.3 : .5 + r() * .8).toFixed(2)}" ${r() > .8 ? `class="tw" style="--tw:${(4 + r() * 6).toFixed(1)}s;--td:${(-r() * 8).toFixed(1)}s"` : ""}/>`).join("")}</g>`;
    return `<svg class="mg-sky" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${layer(90, "mg-sky-a", false)}${layer(34, "mg-sky-b", true)}</svg>`;
  };

  // How the dots of each plague move (css/merged.css has one animation per kind).
  const KIND = { blood: "fall", frogs: "hop", lice: "jitter", flies: "orbit", murrain: "sink", boils: "pulse", hail: "hail", locusts: "swarm", darkness: "dark", firstborn: "last" };
  const dots = (word, n) => {
    const r = rng(word.length * 97 + n), kind = KIND[word] ?? "pulse";
    return `<svg class="pd pd-${kind}" viewBox="0 0 64 64" aria-hidden="true">${Array.from({ length: 9 }, (_, i) => {
      const a = (i / 9) * Math.PI * 2 + r() * .4, rad = 20 + r() * 8;
      const x = kind === "orbit" ? 32 : (32 + Math.cos(a) * rad), y = kind === "orbit" ? 32 : (32 + Math.sin(a) * rad * .9);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.3 + r() * .9).toFixed(2)}" style="--i:${i};--a:${(a * 57.3).toFixed(0)}deg;--r:${rad.toFixed(1)}px"/>`;
    }).join("")}</svg>`;
  };
  plagueDots = () => `<div class="mg-plagues" role="group" aria-label="The ten plagues: choose one to read its verse">
      ${M.plagues.map((p) => `<button type="button" class="mg-pl" data-plague="${p.n}" aria-pressed="false" style="--k:${p.n - 1}"><span class="mg-pl-art">${dots(p.word, p.n)}${glyph(p.word, 30, 1.3)}</span><span class="mg-pl-n">${p.n}</span><b>${esc(p.word)}</b></button>`).join("")}
    </div><p class="mg-pl-line" data-plline aria-live="polite"><span class="mg-pl-hint">Exodus 7–12 · choose a plague to read its verse</span></p>`;
  plagueLine = (n) => { const p = M.plagues[n - 1]; return `<span class="mg-pl-ref">${p.n} of 10 · <b>${esc(p.word)}</b> · ${refLink(p.verse.ref)} · KJV</span><span class="mg-pl-text">“${esc(p.verse.text)}”</span>`; };
})();


// --- merged-land ---
// H · the ground of each chapter: a quiet line-art landscape along its bottom edge, drawn by hand here (no images).
// Egypt: the river, reeds and brick-kilns. Midian: hills, tents and the flock. The wilderness: Sinai, the camp around the
// tabernacle, and Nebo looking over the Jordan. Low contrast; only the water and the smoke move, very slowly.
(() => {
  const P = (d, cls = "ml-line") => `<path class="${cls}" d="${d}"/>`;
  const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const reeds = (x0, n, r, base = 200) => Array.from({ length: n }, (_, i) => {
    const x = x0 + i * (7 + r() * 6), h = 34 + r() * 30, lean = (r() - .5) * 12, tx = x + lean, ty = base - h;
    return P(`M${x.toFixed(1)} ${base}C${(x + lean * .3).toFixed(1)} ${(base - h * .5).toFixed(1)} ${(tx - lean * .2).toFixed(1)} ${(ty + 8).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`)
      + (i % 2 ? P(`M${tx.toFixed(1)} ${ty.toFixed(1)}l-6-7M${tx.toFixed(1)} ${ty.toFixed(1)}l6-7M${tx.toFixed(1)} ${ty.toFixed(1)}l-1-9M${tx.toFixed(1)} ${ty.toFixed(1)}l4-9`, "ml-tone") : "");
  }).join("");
  const water = (y0, rows, amp = 3) => Array.from({ length: rows }, (_, i) => {
    const y = y0 + i * 11, off = (i % 2) * 40;
    let d = `M${-80 + off} ${y}`; for (let x = -80 + off; x < 1680; x += 80) d += `q20 -${amp} 40 0t40 0`;
    return P(d, `ml-water ${i % 2 ? "is-b" : ""}`);
  }).join("");
  const kiln = (x, s = 1) => [
    P(`M${x - 34 * s} 196C${x - 36 * s} ${196 - 44 * s} ${x + 36 * s} ${196 - 44 * s} ${x + 34 * s} 196`),
    P(`M${x - 9 * s} 196v-${12 * s}a${9 * s} ${9 * s} 0 0 1 ${18 * s} 0v${12 * s}`), P(`M${x - 6 * s} ${196 - 40 * s}h${12 * s}v-${6 * s}h-${12 * s}z`),
    P(`M${x} ${190 - 48 * s}c-7-9 6-15 0-24s7-15 0-24`, "ml-smoke"),
  ].join("");
  const bricks = (x, y, cols, rows) => { let d = ""; for (let r = 0; r < rows; r++) { const off = r % 2 ? 7 : 0; d += `M${x + off} ${y - r * 7}h${cols * 14}`; for (let c = 0; c <= cols; c++) d += `M${x + off + c * 14} ${y - r * 7}v-7`; } return P(d + `M${x} ${y - rows * 7}h${cols * 14 + 7}`, "ml-faint"); };
  const palm = (x, h) => P(`M${x} 198c2-${h * .4} -4-${h * .7} 3-${h}`) + P(`M${x + 3} ${198 - h}c-14-2-24 4-30 12M${x + 3} ${198 - h}c14-3 24 2 30 10M${x + 3} ${198 - h}c-8-10-20-12-28-10M${x + 3} ${198 - h}c8-10 20-12 28-8M${x + 3} ${198 - h}c-2-8 2-14 6-16`, "ml-tone");
  // A sheep in its own small frame (facing right, or left when dir is -1): a woolly body, a head with an ear, four legs.
  const sheep = (x, y, k = 1, dir = 1) => `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(k * dir).toFixed(2)} ${k.toFixed(2)})">${
    P("M0 0c-1-4 3-6 6-5c2-3 7-3 9 0c3-1 6 2 5 5c1 3-2 5-5 4h-10c-3 1-6-2-5-4z")}${P("M20-3c3-1 6 1 5 4c-1 2-4 2-5 1M21-3l-2-2")}${P("M4 4v5M7 4.5v5M14 4.5v5M17 4v5", "ml-faint")}</g>`;
  const tent = (x, w = 110) => [P(`M${x} 196L${x + w * .08} 178Q${x + w * .2} 170 ${x + w * .32} 175Q${x + w * .46} 168 ${x + w * .6} 174Q${x + w * .74} 168 ${x + w * .88} 176L${x + w} 196`),
    P(`M${x + w * .2} 172v26M${x + w * .46} 170v28M${x + w * .74} 170v28M${x + w * .2} 172l-${w * .22} 26M${x + w * .74} 170l${w * .3} 28`, "ml-faint")].join("");
  const smallTent = (x, y, s = 1) => P(`M${x - 8 * s} ${y}l${8 * s}-${11 * s}l${8 * s} ${11 * s}M${x} ${y - 11 * s}v${11 * s}`, "ml-faint");

  const LAND = {
    egypt() {
      const r = rng(17);
      return [
        P("M0 152C220 144 420 150 640 141S1040 147 1240 139S1500 144 1600 138", "ml-far"),
        P("M0 198C300 194 600 199 900 195S1400 199 1600 196", "ml-line"),
        kiln(330), kiln(430, .8), bricks(470, 196, 5, 3), kiln(1170, .9), bricks(1060, 196, 4, 2), bricks(1214, 196, 3, 2),
        palm(250, 64), palm(1300, 78), palm(1336, 56), palm(760, 48),
        reeds(60, 12, r), reeds(600, 9, r), reeds(900, 7, r), reeds(1400, 14, r),
        water(210, 3, 3),
      ].join("");
    },
    midian() {
      const r = rng(29);
      const flock = Array.from({ length: 13 }, (_, i) => sheep(870 + i * 36 + r() * 16, 180 + (i % 3) * 6 + r() * 4, .9 + r() * .3, i % 4 ? 1 : -1)).join("");
      return [
        P("M0 130C160 96 300 92 440 120S700 150 860 112S1180 70 1360 104S1540 128 1600 118", "ml-far"),
        P("M0 170C200 146 380 150 560 166S880 176 1060 156S1400 140 1600 162", "ml-mid"),
        P("M0 198C260 194 520 200 800 196S1300 200 1600 197", "ml-line"),
        tent(150), tent(300, 90), tent(1380, 120),
        P("M640 198c0-14 52-14 52 0M636 198h60M650 184v-22M678 184v-22M644 162h40M664 162v12", "ml-line"),
        P("M560 198c2-24-2-40 4-58M564 140c-16-6-30-2-38 8M564 140c14-10 32-8 40 2M564 140c-8-10-6-20 2-24", "ml-tone"),
        flock,
      ].join("");
    },
    wilderness() {
      const camp = [];
      for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) { const x = 660 + i * 26 + (row % 2) * 13; if (x > 780 && x < 900 && row < 2) continue; camp.push(smallTent(x, 186 + row * 7, .8 + row * .1)); }
      return [
        P("M0 196L120 166L190 178L300 112L340 128L408 58L452 98L478 88L560 156L640 196", "ml-line"),
        P("M300 112l14 28M408 58l-10 40M452 98l-6 24M408 58l18 30", "ml-faint"),
        P("M380 54c-16 0-16-16 0-16 4-12 27-12 31-2 9-9 31-5 29 7 14 0 14 16 0 16z", "ml-faint"),
        P("M0 198C300 194 640 199 1000 196S1400 198 1600 196", "ml-line"),
        camp.join(""),
        P("M792 198v-22h96v22M800 176l40-10 40 10M828 198v-14h24v14", "ml-tone"),
        P("M840 160c-6-10 6-16 0-26s6-16 0-26", "ml-smoke"),
        P("M1080 198C1160 170 1240 120 1330 96C1360 90 1380 96 1400 108C1450 140 1500 170 1600 182", "ml-line"),
        P("M1330 96c-2-6 4-10 6-4M1333 92v-8M1333 86l-4 4M1333 86l4 4", "ml-tone"),
        P("M1338 90C1420 70 1500 72 1590 84", "ml-dash"),
        P("M1440 136C1500 112 1550 104 1600 106", "ml-far"),
        P("M1490 198c10-10 4-18 16-26s8-16 20-22 6-10 18-14", "ml-water"),
        P("M1556 160c0-8 2-14 4-18M1560 142c-6-2-10 0-12 4M1560 142c5-3 9-2 11 2M1572 152c0-6 1-10 3-13M1575 139c-4-2-7 0-9 3M1575 139c4-2 7-1 8 2", "ml-faint"),
      ].join("");
    },
  };
  MergedLand = {
    svg: (kind) => `<svg class="ml ml-${kind}" viewBox="0 0 1600 240" preserveAspectRatio="xMidYMax slice" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(LAND[kind] ?? LAND.wilderness)()}</svg>`,
  };
})();


// --- merged-ledger ---
// H · the dense part of each Roman-numeral chapter, under its sideways scenes: every event of the period in order, each
// with its verse, then the people, signs, words, what came of the word, the world stage, outside records and the dates,
// as typographic columns (no boxes). What goes in each chapter is listed in data/merged.json (chapters[]), as keys into
// data/moses.json; the verse texts come from the KJV files through merged.json (kjv).
(() => {
  const SIGN_GLYPH = ["staff", "darkness", "waves", "drop", "sun", "staff"];
  const vtext = (X, ref) => X.kjv[ref[0] === ref[1] ? String(ref[0]) : `${ref[0]}-${ref[1]}`] ?? "";
  const src = (ref, extra = "") => `<span class="lg-src">${refLink(ref)}<span class="lg-kjv">KJV</span>${extra}</span>`;
  const head = (title, g, note = "") => `<h4 class="lg-h">${g ? glyph(g, 22, 1.2) : ""}<span>${esc(title)}</span>${note ? `<small>${esc(note)}</small>` : ""}</h4>`;
  const block = (title, g, body, cls = "") => body ? `<section class="lg-b ${cls}">${head(title, g)}${body}</section>` : "";

  // One line of the timeline: a verse (title by this site, words from the KJV), an event of the leader page (its claim,
  // label and verses), a stop on the road (its verse and how sure the Atlas is of the place), the plagues, or a jump.
  function entry(e, X) {
    const age = e.age ? `<span class="lg-age"><b>${e.age}</b>years old</span>` : "";
    if (e.k === "gap") return `<li class="lg-gap"><a href="#mg-${e.go}" data-goch="${e.go}"><span>${esc(e.title)}</span><small>told in the next chapter</small>${icon("arrowRight", 14)}</a></li>`;
    if (e.k === "plagues") return `<li class="lg-ev"><b>${esc(e.title)}</b><span class="lg-plg">${M.plagues.map((p) => `<i title="${p.n}. ${esc(p.word)}">${glyph(p.word, 20, 1.3)}<small>${esc(p.word)}</small></i>`).join("")}</span>${src(e.ref, '<span class="lg-note">each verse on the plagues scene above</span>')}</li>`;
    if (e.k === "v") return `<li class="lg-ev ${e.age ? "has-age" : ""}">${age}<b>${esc(e.title)}</b><q>${esc(vtext(X, e.ref))}</q>${src(e.ref)}</li>`;
    if (e.k === "s") {
      const s = M.map.route[e.i];
      return `<li class="lg-ev is-stop">${age}<b>${icon("map", 13)}${esc(e.title)}</b><q>${esc(s.verse.text)}</q>${src(s.verse.ref, `<span class="lg-note">${esc(s.name)}: the Atlas is ${Math.round(s.confidence * 100)}% sure of the spot</span>`)}</li>`;
    }
    const ev = M.leader.events.find((x) => x.label === e.key), year = e.year ?? ev.year;
    return `<li class="lg-ev is-claim ${e.age ? "has-age" : ""}">${age}<b>${esc(ev.label)}${year && !e.age ? `<small>Year ${year} of the forty</small>` : ""}</b><p>${esc(ev.claim.text)}</p><span class="lg-src">${chip(ev.claim.layer)}${refList(ev.claim.refs)}</span></li>`;
  }

  // The people of the chapter, hanging off one fine line: name, how they stand to him, and what Scripture says.
  function people(c, X) {
    const all = peopleList();
    return `<ul class="lg-people">${c.people.map((id) => {
      const p = all.find((x) => x.id === id); if (!p) return "";
      const verses = (X.family[id] ?? []).slice(0, 1).map((r) => `<q>${esc(vtext(X, r))}</q>${src(r)}`).join("");
      const body = p.claim ? `<p>${esc(p.claim.text)}</p><span class="lg-src">${chip(p.claim.layer)}${refList(p.claim.refs)}</span>` : verses || `<p class="lg-muted">Named as his ${esc(p.role)} in the family list (TIPNR, STEP Bible).</p>`;
      const role = p.group === "family" ? (p.role === "brother or sister" ? (/miriam/.test(id) ? "sister" : "brother") : p.role) : p.role;
      return `<li style="--tone:${p.group === "family" ? "var(--egypt)" : p.group === "with" ? "var(--wild)" : "var(--midian)"}"><b>${esc(p.name.replace(/, one of five kings of Midian/, " (Midian)"))}</b><small>${esc(role)}</small>${body}</li>`;
    }).join("")}</ul>`;
  }
  const signs = (c) => (c.signs ?? []).map((l) => { const i = M.word.signs.findIndex((s) => s.label === l), s = M.word.signs[i];
    return `<div class="lg-sign">${glyph(SIGN_GLYPH[i] ?? "sparkle", 30, 1.2)}<div><b>${esc(s.label)}</b>${claim(s.claim)}</div></div>`; }).join("");
  const words = (c) => (c.words ?? []).map((t) => { const w = M.word.words.find((x) => x.to === t);
    return `<div class="lg-word"><small>To ${esc(w.to)}</small><blockquote>“${esc(w.quote.text)}”</blockquote>${src(w.quote.span)}${w.claim ? claim(w.claim) : ""}</div>`; }).join("");
  const message = (c) => (c.message ?? []).map((t) => { const m = M.word.message.find((x) => x.theme === t);
    return `<div class="lg-msg"><b>${esc(m.theme)}</b>${m.quotes.map((q) => `<blockquote>“${esc(q.text)}”</blockquote>${src(q.span)}`).join("")}${claim(m.claim)}</div>`; }).join("");
  const fulfil = (c) => (c.fulfil ?? []).map((i) => { const f = M.word.fulfilment[i];
    return `<div class="lg-ful"><div><small>The word</small>${claim(f.word)}</div><i aria-hidden="true">${icon("arrowRight", 14)}</i><div><small>What Scripture reports</small>${claim(f.reported)}</div></div>`; }).join("");
  const world = (c) => (c.world ?? []).map((t) => { const w = M.leader.worldStage.find((x) => x.power === t);
    return `<div class="lg-power"><b>${esc(w.power)}</b>${w.rulers.length ? `<small>${esc(w.rulers.map((r) => r.name).join(", "))}</small>` : ""}${claim(w.claim)}</div>${c.id === 'egypt' && t === 'Egypt' ? egyptContext(refLink) : ''}`; }).join("");
  const call = (c) => (c.call ?? []).map((i, k) => { const s = M.word.call[i];
    return `<div class="lg-call"><span>${k + 1}</span><div><b>${esc(s.label)}</b><blockquote>“${esc(s.quote.text)}”</blockquote>${src(s.quote.span)}${claim(s.claim)}</div></div>`; }).join("");
  // The dates as views: Scripture's own numbers, then the two reconstructions on one axis of years BC.
  function dates() {
    const D = M.leader.dates, lo = 1500, hi = 1150, x = (y) => ((lo - y) / (lo - hi)) * 100;
    const marks = D.filter((d) => d.from).map((d, i) => `<span class="lg-dmark ${d.to ? "is-span" : ""} ${x(d.from) > 55 ? "is-flip" : ""}" style="--x:${x(d.from).toFixed(1)}%;--w:${d.to ? (x(d.to) - x(d.from)).toFixed(1) : 0}%;--row:${i}"><i></i><b>${d.approx ? "c. " : ""}${d.from}${d.to ? `–${d.to}` : ""} BC</b></span>`).join("");
    const ticks = [1500, 1400, 1300, 1200].map((y) => `<span style="--x:${x(y)}%">${y}</span>`).join("");
    return `<div class="lg-dates"><p class="lg-muted">${esc(D[0].note)}</p><div class="lg-axis">${marks}<div class="lg-ticks">${ticks}</div></div>
      ${D.filter((d) => d.from).map((d) => `<div class="lg-dview"><b>${esc(d.label)}</b><p>${esc(d.note)}</p><span class="lg-src">${chip("scholars")}${cites(d.cites)}</span></div>`).join("")}</div>`;
  }
  const nation = () => Object.entries({ worship: "Worship", building: "Building", alliances: "Alliances", people: "The people" })
    .map(([k, t]) => `<div class="lg-nat"><small>${t}</small>${M.leader.nation[k].map((c) => claim(c)).join("")}</div>`).join("");
  const two = () => M.leader.twoAccounts.map((t) => `<div class="lg-two"><b>${esc(t.topic)}</b><div>${claim(t.first)}${claim(t.second)}</div></div>`).join("");
  const ending = () => `${M.ending.scripture.map((c) => claim(c)).join("")}${quoteSpan({ text: M.leader.record.burial.text, span: M.leader.record.burial.span })}<div class="lg-trad">${M.ending.tradition.map((c) => claim(c)).join("")}</div>`;


  // The events band scrolls sideways inside itself, so the page scrolls straight past it. A slim pill under it shows
  // where you are: drag it, click the track, or use the arrows; trackpads and shift + wheel scroll it too.
  function wireScroller(box) {
    if (box.dataset.wired) return;
    box.dataset.wired = "1";
    const list = box.querySelector(".lg-time"), track = box.querySelector(".lg-track"), pill = box.querySelector(".lg-pill");
    const pos = box.querySelector(".lg-pos"), items = [...list.querySelectorAll(".lg-ev")];
    const update = () => {
      const max = list.scrollWidth - list.clientWidth, ratio = list.clientWidth / Math.max(list.scrollWidth, 1);
      box.classList.toggle("is-static", max < 4);
      const w = Math.max(ratio * 100, 8), at = max > 0 ? list.scrollLeft / max : 0;
      pill.style.width = `${w}%`; pill.style.left = `${at * (100 - w)}%`;
      box.style.setProperty("--fade-l", list.scrollLeft > 4 ? "3.5rem" : "0rem");
      box.style.setProperty("--fade-r", list.scrollLeft < max - 4 ? "3.5rem" : "0rem");
      const view = list.getBoundingClientRect();
      const shown = items.map((li, i) => [li.getBoundingClientRect(), i]).filter(([r]) => (r.left + r.right) / 2 > view.left && (r.left + r.right) / 2 < view.right).map(([, i]) => i + 1);
      pos.textContent = shown.length ? `${shown[0]}–${shown[shown.length - 1]} of ${items.length}` : "";
    };
    list.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(list);
    box.querySelectorAll(".lg-step").forEach((b) => b.addEventListener("click", () => list.scrollBy({ left: Number(b.dataset.step) * list.clientWidth * 0.85, behavior: "smooth" })));
    const seek = (clientX) => {
      const r = track.getBoundingClientRect(), w = pill.getBoundingClientRect().width;
      const at = Math.min(Math.max((clientX - r.left - w / 2) / Math.max(r.width - w, 1), 0), 1);
      list.scrollLeft = at * (list.scrollWidth - list.clientWidth);
    };
    track.addEventListener("pointerdown", (e) => {
      e.preventDefault(); track.setPointerCapture(e.pointerId); box.classList.add("is-dragging"); seek(e.clientX);
      const move = (ev) => seek(ev.clientX);
      const up = () => { box.classList.remove("is-dragging"); track.removeEventListener("pointermove", move); track.removeEventListener("pointerup", up); track.removeEventListener("pointercancel", up); };
      track.addEventListener("pointermove", move); track.addEventListener("pointerup", up); track.addEventListener("pointercancel", up);
    });
    list.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); e.stopPropagation(); list.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * list.clientWidth * 0.85, behavior: "smooth" }); }
    });
    update();
  }
  const wireAll = (root) => root.querySelectorAll?.(".lg-scroll").forEach(wireScroller);
  new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach((n) => { if (n.nodeType === 1) { if (n.matches?.(".lg-scroll")) wireScroller(n); wireAll(n); } })))
    .observe(root, { childList: true, subtree: true });
  root.addEventListener("DOMContentLoaded", () => wireAll(document));

  MergedLedger = {
    html(c, X) {
      const blocks = [
        block("People of this chapter", "users", people(c, X), "lg-span"),
        c.call ? block("The call", "flame", call(c)) : "",
        block("Signs and wonders", "sparkle", signs(c)),
        block("Words he spoke", "message", words(c)),
        block("The message", "scroll", message(c)),
        c.accession ? block("Refused, then sent", "crown", c.accession.map((i) => claim(M.leader.accession[i])).join("")) : "",
        block("What came of the word", "arrowRight", fulfil(c)),
        c.nation ? block("The nation under him", "tent", nation()) : "",
        c.twoAccounts ? block("Two accounts, side by side", "layers", two()) : "",
        block("The world stage", "crown", world(c)),
        c.outside ? block("Outside the Bible", "scroll", M.leader.outside.map((o) => `<div class="lg-power"><b>${esc(o.name)}</b><small>${esc(o.date)}</small>${claim(o.claim)}</div>`).join("")) : "",
        c.dates ? block("When? The dates, as views", "hourglass", dates()) : "",
        c.verdict ? block("Where it went ill", "drop", M.leader.verdictNotes.map((v) => claim(v)).join("")) : "",
        c.ending ? block("His end", "eye", ending(), "lg-span") : "",
        c.notSaid ? block("What Scripture does not say", "help", `<ul class="lg-not">${c.notSaid.map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul>`) : "",
      ].join("");
      const n = c.timeline.filter((e) => e.k !== "gap").length;
      return `<div class="lg">
        <div class="lg-tl">${head("The events, in order", "route", `${n} · each with its verse`)}<div class="lg-scroll"><ol class="lg-time" tabindex="0" aria-label="The events, in order: scrolls sideways">${c.timeline.map((e) => entry(e, X)).join("")}</ol><div class="lg-bar"><button type="button" class="lg-step" data-step="-1" aria-label="Earlier events">${icon("arrowRight", 14)}</button><span class="lg-track"><span class="lg-pill"></span></span><span class="lg-pos"></span><button type="button" class="lg-step" data-step="1" aria-label="Later events">${icon("arrowRight", 14)}</button></div></div></div>
        <div class="lg-blocks">${blocks}</div></div>`;
    },
  };
})();


// --- merged-sections ---
// H · the sections around the chapters: the Atlas (the whole road on one quiet map, with a way into the Atlas), the
// man (his life and his family as a small tree of words), the word (the call, how the word came, the message, "mouth to
// mouth", the prophet "like unto me" and its use in Acts), and the people around him (the shared constellation field).
(() => {
  const vtext = (X, ref) => X.kjv[ref[0] === ref[1] ? String(ref[0]) : `${ref[0]}-${ref[1]}`] ?? "";
  const kv = (X, ref, cls = "") => `<blockquote class="mx-v ${cls}"><p>${esc(vtext(X, ref))}</p><footer>${refLink(ref)} · KJV</footer></blockquote>`;
  const secHead = (n, kick, title, lead) => `<header class="mx-head"><div class="mx-section-label"><span class="mx-n">${n}</span><span class="mg-kick">${esc(kick)}</span></div><h2>${title}</h2>${lead ? `<p>${esc(lead)}</p>` : ""}</header>`;

  // ── The Atlas ──
  function atlas(X) {
    const A = X.atlas;
    return `<section class="mx mx-atlas" id="mg-atlas" data-sec="atlas" aria-label="Moses in the Atlas">
      <div class="wrap">${secHead("01", "In the Atlas", "The whole road, <em>Egypt to Nebo</em>", `${M.map.route.length} stops from the Atlas, with how sure it is of each place. The way between stops is reconstructed.`)}</div>
      <div class="mx-mapband"><div class="mx-map"></div><svg class="mx-leads" aria-hidden="true"></svg>
        ${A.stretches.map((s) => `<div class="mx-stretch" data-act="${s.act}" style="--tone:${ACT_TONE[s.act]}"><b>${esc(s.label)}</b><small>${esc(s.years)}</small><span>${esc(s.line)}</span></div>`).join("")}</div>
      <div class="wrap mx-atlas-foot"><a class="mx-go" href="${esc(A.href)}">${icon("route", 18)}<span><b>Follow Moses in the Atlas</b><small>Moses' journey in the Atlas is coming: so far only Paul's journey is built. The link opens the Atlas journeys page, where Moses already has a card.</small></span>${icon("arrowRight", 16)}</a>
        <p class="mx-key">${esc(M.map.key)}</p></div></section>`;
  }
  // The map fills the band; each stretch's name floats beside its part of the road, joined to it by a fine line.
  function wireAtlas(root, X) {
    const host = root.querySelector(".mx-map"), band = root.querySelector(".mx-mapband"), leads = root.querySelector(".mx-leads");
    const m = MosesMap(host, { mini: false });
    const place = () => {
      const r = band.getBoundingClientRect(); if (!r.width) return;
      const narrow = r.width < 760;
      const mh = host.getBoundingClientRect().height;
      m.setView(m.fit(m.viewFor(0), narrow ? { x: 14, y: 30, w: r.width - 96, h: mh - 60 } : { x: r.width * .2, y: 30, w: r.width * .6, h: r.height - 60 }));
      m.setProgress(15);
      const ctm = m.svg.getScreenCTM(), pt = m.svg.createSVGPoint();
      const toBand = ([x, y]) => { pt.x = x; pt.y = y; const p = pt.matrixTransform(ctm); return [p.x - r.left, p.y - r.top]; };
      const lines = [];
      root.querySelectorAll(".mx-stretch").forEach((el, k) => {
        const s = X.atlas.stretches[k], stops = s.stops.length > 1 && s.act === 3 ? [Math.round((s.stops[0] + s.stops[1]) / 2) + 3] : [s.stops[Math.floor(s.stops.length / 2)]];
        const [ax, ay] = toBand(M.map.route[stops[0]].xy);
        // Labels sit in the free margins: Egypt and Midian to the left and below, the wilderness to the right.
        const spots = narrow ? [[12, r.height - 128], [r.width / 2 + 6, r.height - 128], [12, r.height - 64]] : [[r.width * .04, r.height * .2], [r.width * .06, r.height * .7], [r.width * .8, r.height * .3]];
        const [lx, ly] = spots[k];
        if (narrow) return; // on a phone the names sit under the map (css)
        el.style.transform = `translate(${lx.toFixed(0)}px, ${ly.toFixed(0)}px)`;
        if (!narrow) { const w = el.offsetWidth, h = el.offsetHeight, ex = lx < ax ? lx + w + 8 : lx - 8, ey = ly + h / 2;
          lines.push(`<path style="--tone:${ACT_TONE[s.act]}" d="M${ex.toFixed(0)} ${ey.toFixed(0)}L${ax.toFixed(0)} ${ay.toFixed(0)}"/><circle style="--tone:${ACT_TONE[s.act]}" cx="${ax.toFixed(0)}" cy="${ay.toFixed(0)}" r="4"/>`); }
      });
      leads.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`); leads.innerHTML = lines.join("");
    };
    const ro = new ResizeObserver(() => requestAnimationFrame(place)); ro.observe(band);
    return () => { ro.disconnect(); m.destroy(); };
  }

  // ── The man ──
  const ROLE = { parent: "parents", "brother or sister": "siblings", wife: "spouse", husband: "spouse", son: "children", daughter: "children" };
  // The family as words joined by fine lines: parents over the children, the spouse beside him, their children below.
  function familyTree(X) {
    const fam = M.family, by = (r) => fam.filter((f) => ROLE[f.role] === r), W = 640, H = 330;
    const parents = by("parents"), sibs = by("siblings"), spouse = by("spouse"), kids = by("children");
    const row = [...sibs, { id: "me", name: M.person.name, role: "" }], pos = {};
    const rowX = (n, i, x0, x1) => (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1));
    parents.forEach((p, i) => { pos[p.id] = [rowX(parents.length, i, 200, 400), 46]; });
    row.forEach((p, i) => { pos[p.id] = [rowX(row.length, i, 90, 380), 168]; });
    spouse.forEach((p, i) => { pos[p.id] = [540, 168 + i * 50]; });
    kids.forEach((p, i) => { pos[p.id] = [rowX(kids.length, i, 400, 580), 290]; });
    const me = pos.me, lines = [];
    if (parents.length) { const [a, b] = [pos[parents[0].id], pos[parents[parents.length - 1].id]], mx = (a[0] + b[0]) / 2;
      lines.push(`M${a[0] + 46} ${a[1]}H${b[0] - 52}`, `M${mx} ${a[1]}V112`, `M${pos[row[0].id][0]} 112H${me[0]}`, ...row.map((p) => `M${pos[p.id][0]} 112V${pos[p.id][1] - 26}`)); }
    if (spouse.length) { const s = pos[spouse[0].id], mx = (me[0] + s[0]) / 2 + 10;
      lines.push(`M${me[0] + 44} ${me[1] - 6}H${s[0] - 54}`);
      if (kids.length) lines.push(`M${mx} ${me[1] - 6}V236`, `M${pos[kids[0].id][0]} 236H${pos[kids[kids.length - 1].id][0]}`, ...kids.map((k) => `M${pos[k.id][0]} 236V${pos[k.id][1] - 24}`)); }
    const roleWord = (f) => (f.role === "brother or sister" ? (/miriam/.test(f.id) ? "sister" : "brother") : f.role);
    return `<svg class="mx-tree" viewBox="0 0 ${W} ${H}" role="group" aria-label="His family"><path class="mx-tree-l" d="${lines.join("")}"/>
      ${[...parents, ...row, ...spouse, ...kids].map((f) => { const [x, y] = pos[f.id];
        return f.id === "me" ? `<g class="mx-tw is-me"><text x="${x}" y="${y + 6}">${esc(f.name)}</text></g>`
          : `<g class="mx-tw" data-fam="${f.id}" tabindex="0" role="button" aria-label="${esc(f.name)}, his ${esc(roleWord(f))}"><rect x="${x - 56}" y="${y - 24}" width="112" height="44" rx="6"/><text x="${x}" y="${y}">${esc(f.name)}</text><text class="mx-tw-r" x="${x}" y="${y + 15}">${esc(roleWord(f))}</text></g>`; }).join("")}</svg>`;
  }
  const famDetail = (X, id) => {
    const f = M.family.find((x) => x.id === id), c = [...M.companions].find((x) => x.id === id), w = M.prophetsWith.find((x) => x.person.personId === id);
    return `<b class="mx-fd-n">${esc(f.name)}</b><a class="mg-link" href="${options.personPath(f.id)}">Read ${esc(f.name)}’s story ${icon("arrowRight",14)}</a>${(X.family[id] ?? []).map((r) => kv(X, r, "is-sm")).join("")}${c ? claim(c.claim) : ""}${w ? claim(w.claim) : ""}${!c && !w ? `<p class="lg-muted">Named as his ${esc(f.role)} in the family list (TIPNR, STEP Bible); Scripture says no more of ${esc(f.name)} beside him than the verse above.</p>` : ""}`;
  };
  function man(X) {
    const ages = [[0, "Born under the decree", [2001022, 2002002]], [40, "Visits his brethren; flees", [44007023, 44007023]], [80, "Before Pharaoh", [2007007, 2007007]], [120, "Dies on Nebo", [5034007, 5034007]]];
    return `<section class="mx mx-man wrap" id="mg-man" data-sec="man" aria-label="The man">
      ${secHead("02", "The man", "His life, <em>and his house</em>", M.person.short)}
      <ol class="mx-ages">${ages.map(([a, t, r]) => `<li><b>${a}</b><span>${esc(t)}</span>${refLink(r)}</li>`).join("")}</ol>
      <div class="mx-man-grid">
        <div class="mx-life"><h4 class="lg-h">${glyph("book", 22, 1.2)}<span>His life, told from Scripture</span></h4><div class="mx-cols">${M.story.map((c) => claim(c)).join("")}</div></div>
        <div class="mx-fam"><h4 class="lg-h">${glyph("users", 22, 1.2)}<span>His family</span><small>Choose a name</small></h4>${familyTree(X)}<div class="mx-fd" aria-live="polite">${famDetail(X, "aaron-exo-4-14")}</div>
          ${kv(X, X.man.sons, "is-sm")}</div>
      </div>
      <section class="mx-says" id="mg-remembrance" aria-labelledby="mg-remembrance-title"><div class="mx-remembrance-top"><header class="mx-remembrance-head"><span class="kicker">A life remembered</span><h3 id="mg-remembrance-title">How Scripture remembers <span class="mx-remembrance-last">him <span class="mx-remembrance-mark" aria-hidden="true">${icon("quote", 25, 1.2)}</span></span></h3><p>A servant faithful in God’s house. A prophet known face to face. A man who stood in the breach for his people.</p></header><aside class="mx-remembrance-law" aria-label="The law given by Moses"><svg class="mx-law-icon" viewBox="0 0 64 64" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 53V20a12 12 0 0 1 24 0v33Zm26 0V20a12 12 0 0 1 24 0v33Z M13 27h12M13 35h12M13 43h12M39 27h12M39 35h12M39 43h12"/></svg>${claim(M.leader.scriptureSays[M.leader.scriptureSays.length-1])}</aside></div>
        <div class="mx-says-row">${M.leader.scriptureSays.slice(0,-1).map((c) => claim(c)).join("")}</div><section class="mx-remembrance-faith" aria-labelledby="mg-remembrance-faith"><h4 class="lg-h" id="mg-remembrance-faith">${glyph("sparkle", 22, 1.2)}<span>By faith</span><small>Hebrews 11</small></h4>${kv(X, X.man.faith)}</section></section>
      <div class="mx-man-foot"><div><h4 class="lg-h scripture-silence-heading">${icon("warning", 23, 1.5)}<span>What Scripture does not say of the man</span></h4><ul class="lg-not">${[1, 2].map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul></div></div>
    </section>`;
  }

  // ── The word ──
  function word(X) {
    const W = X.word, fl = M.word.fulfilment[4];
    return `<section class="mx mx-word" id="mg-word" data-sec="word" aria-label="The word">
      <div class="wrap">${secHead("04", "The word", "A prophet spoken with <em>mouth to mouth</em>", M.person.prophetTagline)}
        <figure class="mx-mouth"><blockquote><p>“${esc(vtext(X, W.mouth))}”</p></blockquote><figcaption>${refLink(W.mouth)} · KJV · the LORD, to Aaron and Miriam</figcaption></figure>
        <div class="mx-word-cols">
          <div><h4 class="lg-h">${glyph("flame", 22, 1.2)}<span>The call</span><small>${M.word.call.length} tellings</small></h4>${M.word.call.map((s, k) => `<div class="lg-call"><span>${k + 1}</span><div><b>${esc(s.label)}</b><blockquote>“${esc(s.quote.text)}”</blockquote><span class="lg-src">${refLink(s.quote.span)}<span class="lg-kjv">KJV</span></span>${claim(s.claim)}</div></div>`).join("")}</div>
          <div><h4 class="lg-h">${glyph("message", 22, 1.2)}<span>How the word came</span></h4>${M.word.how.map((c) => claim(c)).join("")}</div>
          <div><h4 class="lg-h">${glyph("scroll", 22, 1.2)}<span>The message</span><small>${M.word.message.length} themes</small></h4>${M.word.message.map((m) => claim({ theme: m.theme, ...m.claim, quotes: m.quotes })).join("")}</div>
          <div class="word-speaking-source">${M.word.speaking.map((item) => claim(item)).join("")}</div>
        </div>
        <div class="mx-like"><h4 class="lg-h">${glyph("arrowRight", 22, 1.2)}<span>“A Prophet … like unto me”</span><small>Deuteronomy 18:15, and how Acts uses it</small></h4>
          <ol class="mx-chain">
            <li><span class="mx-dot"></span><small>Moses says</small>${kv(X, W.like)}</li>
            <li><span class="mx-dot"></span><small>Peter, in the temple</small>${kv(X, W.nt[0])}</li>
            <li><span class="mx-dot"></span><small>Stephen, before the council</small>${kv(X, W.nt[1])}</li>
          </ol>
          <div class="mx-like-foot">${claim(fl.reported)}<a class="mg-link" href="#mg-ask" data-askq="moses-prophet-like-me">${icon("help", 15)}Who is the prophet? Three views, with who holds them</a></div></div>
        <div class="mx-close"><figure class="mx-mouth is-end"><blockquote><p>“${esc(vtext(X, W.none))}”</p></blockquote><figcaption>${refLink(W.none)} · KJV</figcaption></figure>
          <ul class="lg-not">${[4, 6].map((i) => `<li>${esc(M.notSaid[i])}</li>`).join("")}</ul></div>
      </div></section>`;
  }

  // ── The people around him (the shared constellation field, rings by kind of person) ──
  const peopleData = (X) => ({ ...X.people, stagger: .47 /* chosen so no label meets another label or point, at desktop and phone sizes */, nodes: X.people.nodes.map((n) => ({ ...n, markerScale: n.id === "who:god" ? 1.34 : 2, mark: n.ring === "speak" ? "solid" : "initial", short: n.label.replace(/ king of Moab| of Heshbon| of Bashan/, "") })) });
  function people(X, data) {
    const counts = data.rings.map((r) => `${data.nodes.filter((n) => n.ring === r.key).length} ${r.label.toLowerCase()}`).join(" · ");
    return `<section class="mx mx-people" id="mg-people" data-sec="people" aria-label="The people around him">
      <div class="wrap">${secHead("03", "The people around him", "Everyone <em>around Moses</em>", `Rings by kind of person: ${counts}. Colour tells when each first stands beside him. Choose anyone; lines show who their own words name.`)}
        <div class="mx-pfilters" role="group" aria-label="Show">${[{ key: "all", label: "Everyone" }, ...data.rings].map((r) => `<button type="button" data-ring="${r.key}" aria-pressed="${r.key === "all"}">${esc(r.label)}</button>`).join("")}</div>
        <div class="mx-pstage"><div class="mx-pfield">${Constellation.field(data, { cls: "cs-people" })}${Constellation.legend(data, { marks: { family: "initial", with: "initial", against: "initial", speak: "solid" } })}</div>
          <aside class="mx-ppanel" aria-live="polite"></aside></div></div></section>`;
  }
  const personPanel = (n, field) => {
    const verses = n.verses.map((v) => (Array.isArray(v) ? { ref: v, text: null } : v));
    const ringName = n.ring === "speak" ? "Who speaks of him" : n.ring === "family" ? "Family" : n.ring === "with" ? "Beside him" : "Against him";
    return `<span class="mg-kick">${esc(ringName)}${n.role.toLowerCase() === ringName.toLowerCase() ? "" : ` · ${esc(n.role)}`}</span><h3>${esc(n.label)}</h3>
      ${n.claims.map((c) => claim(c)).join("")}${n.quote ? quoteSpan(n.quote) : ""}
      ${verses.map((v) => `<blockquote class="mx-v is-sm"><p>${esc(v.text ?? vtextCache(v.ref))}</p><footer>${refLink(v.ref)} · KJV${v.basis ? ` · <span class="lg-muted">${esc(v.basis)}</span>` : ""}</footer></blockquote>`).join("")}
      ${n.ring === "speak" ? `<p class="lg-muted">${n.count} verse${n.count === 1 ? "" : "s"} in all; the long memory lists every one.</p>` : ""}
      ${n.linked.length ? `<p class="mx-rel"><small>Their words name</small>${n.linked.map((m) => `<button type="button" data-pnode="${esc(m.id)}" style="--tone:${m.tone}">${esc(m.label)}</button>`).join("")}</p>` : ""}`;
  };
  let vtextCache = () => "";

  MergedSections = {
    atlas, wireAtlas, man, word, people, peopleData,
    famDetail,
    // The people field: choose, links, filters; the bloom plays on the page's clock when the section comes into view.
    wirePeople(root, X, data) {
      vtextCache = (ref) => vtext(X, ref);
      const panel = root.querySelector(".mx-ppanel"), svg = root.querySelector(".cs-svg");
      const core = () => `<span class="mg-kick">The centre</span><h3>Moses</h3><p class="mx-plain">${esc(M.person.leaderTagline)} ${esc(M.person.prophetTagline)}</p>
        ${data.rings.map((r) => `<p class="mx-rel"><small>${esc(r.label)} · ${data.nodes.filter((n) => n.ring === r.key).length}</small>${data.nodes.filter((n) => n.ring === r.key).map((n) => `<button type="button" data-pnode="${esc(n.id)}" style="--tone:${n.tone}">${esc(n.label)}</button>`).join("")}</p>`).join("")}`;
      const field = Constellation.wire(svg, data, { panel, panelHtml: (n) => personPanel(n, field), coreHtml: core, scrollPanel: () => innerWidth < 960 });
      const onClick = (e) => {
        const b = e.target.closest("[data-pnode]"); if (b) { field.select(b.dataset.pnode, true); return; }
        const r = e.target.closest("[data-ring]"); if (r && !r.closest(".cs-svg")) { root.querySelectorAll(".mx-pfilters [data-ring]").forEach((x) => x.setAttribute("aria-pressed", String(x === r))); field.setRing(r.dataset.ring); }
      };
      root.addEventListener("click", onClick);
      field.select("core"); field.fitLabels();
      return { field, destroy() { field.destroy(); root.removeEventListener("click", onClick); } };
    },
  };
})();


// --- merged-rail ---
// H · the vertical navigation from C (cinema), brought back: one dot per section at the right edge, and a pill that
// moves to the section you are in. Choosing a dot jumps there. On a phone it folds into a small pill of dots.
(() => {
  MergedRail = {
    html: (items) => `<nav class="mg-rail" aria-label="Sections of this page"><i class="mg-rail-pill" aria-hidden="true"></i>
      ${items.map((s, i) => `<a href="#${s.target}" data-rail="${s.target}" style="--i:${i}"><i></i><span>${esc(s.label)}</span></a>`).join("")}</nav>`,
    // The section that holds the middle of the screen is the current one; the pill slides to its dot.
    wire(main, items) {
      const rail = main.querySelector(".mg-rail"), links = [...rail.querySelectorAll("[data-rail]")], pill = rail.querySelector(".mg-rail-pill");
      const sections = items.map((s) => main.querySelector(`#${s.target}`));
      let current = -1;
      const setCurrent = (i) => {
        if (i === current || i < 0) return; current = i;
        links.forEach((a, k) => a.toggleAttribute("aria-current", k === i));
        const a = links[i];
        pill.style.transform = `translateY(${(a.offsetTop + a.offsetHeight / 2).toFixed(1)}px) translateY(-50%)`;
      };
      const update = () => {
        const mid = innerHeight * .45;
        let best = 0;
        sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= mid) best = i; });
        setCurrent(best);
      };
      let raf = 0;
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; update(); }); };
      const onClick = (e) => { const a = e.target.closest("[data-rail]"); if (!a) return; e.preventDefault(); main.querySelector(`#${a.dataset.rail}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
      addEventListener("scroll", onScroll, { passive: true }); addEventListener("resize", onScroll); rail.addEventListener("click", onClick);
      update();
      return () => { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); };
    },
  };
})();


// --- dir-merged ---
// H · The merged page. B's three-forties landing, as it is; the whole road in the Atlas; three dense Roman-numeral
// chapters (Egypt, Midian, the wilderness), each with a sky of faint dots, a giant numeral, scenes that slide sideways,
// every event of the period with its verse, and a line-art landscape for ground, with "See the map" sliding the journey
// map in beside the chapter; then the man, the word, the people around him (the constellation), the questions, a link
// to the long memory, and the sources. C's dot navigation runs down the right edge.
(() => {
  const ROMAN = ["", "I", "II", "III"];
  let X = null; // data/merged.json
  const loadX = async () => { if (X) return X; const res = { ok: true, json: async () => structuredClone((await import("./data/merged.json")).default) }; if (!res.ok) throw new Error(`merged.json: expected 200, got ${res.status}`); X = await res.json(); return X; };
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const toneVar = (t) => `var(--${t})`;
  const drawerFor = {};

  const detail = (s) => `<span class="mg-kick">${esc(s.placeName)} · ${esc(refText(s.verse.ref))}</span><h3>${esc(s.title)}</h3>${s.verse2 ? kjv(s.verse2) : ""}${sceneLines(s)}${s.more.map((c) => claim(c)).join("")}${s.burial ? quoteSpan({ text: s.burial.text, span: s.burial.span }) : ""}${(s.tradition ?? []).map((c) => claim(c)).join("")}`;
  const sceneSlide = (s, c) => {
    drawerFor[s.id] = detail(s);
    const notes = s.more.length + s.lines.length + (s.tradition?.length ?? 0);
    return `<div class="mg-slide ${s.plagues ? "has-plagues" : ""}" data-id="${s.id}" style="--tone:${toneVar(c.tone)}">
      <div class="mg-text"><span class="mg-kick">${icon("map", 13)}${esc(s.placeName)}</span><h3 class="mg-title">${esc(s.title)}</h3>
        <blockquote class="mg-verse"><p>${esc(s.verse.text)}</p><footer>${refLink(s.verse.ref)} · KJV</footer></blockquote>
        <div class="mg-line">${claim(s.lines[0])}</div>
        <div class="mg-actions"><button type="button" class="mg-link" data-drawer="${s.id}">${icon("layers", 15)}The full detail <small>${notes} sourced notes</small></button>
          <button type="button" class="mg-link" data-map="${c.id}">${icon("map", 15)}See the map</button></div></div>
      ${s.plagues ? `<div class="mg-art mg-art-plagues">${plagueDots()}</div>` : `<div class="mg-art">${art(s.art)}</div>`}</div>`;
  };
  const chapterIntro = (c) => {
    const introductions = {
      1: { paragraphs: ["Moses was saved from the river and raised as Pharaoh's daughter's son. When he defended a Hebrew and killed an Egyptian, he had to flee. Years later, God sent him back with Aaron to demand Israel's release. The struggle with Pharaoh ended with Israel leaving Egypt and crossing the sea on dry ground."], refs: [[2002001,2002015],[2003010,2003010],[2005001,2005001],[2014021,2014031]] },
      2: { paragraphs: ["Midian became Moses' home in exile after he fled Pharaoh. Here he married Zipporah, became a father, and tended the flock of his father-in-law Jethro. The man raised in Egypt's royal household was now living as a stranger and a shepherd.","Acts places forty years between his flight and the burning bush. At Horeb, God called him to return to Egypt and bring Israel out of bondage, a new commission near the end of this long season away."], refs: [[2002015,2002022],[2003001,2003010],[44007029,44007030]] },
      3: { paragraphs: ["Beyond the sea, Moses led Israel through forty years in the wilderness. At Sinai the people received the law; at the tabernacle Moses heard the LORD's voice. The journey ended in Moab, where he saw the promised land from the mountain but did not enter it. He died there at a hundred and twenty, and Israel mourned him for thirty days."], refs: [[44007036,44007036],[2020001,2020021],[4007089,4007089],[5034001,5034008]] },
    };
    const info = introductions[c.act];
    return '<div class="mg-chapter-context">'+info.paragraphs.map(text=>'<p>'+esc(text)+'</p>').join('')+'<footer>'+info.refs.map(refLink).join(' &middot; ')+'</footer></div>';
  };
  const titleSlide = (c) => {
    const f = actOf(c.act), list = c.scenes.map((id) => M.sceneById[id]);
    return `<div class="mg-slide mg-slide-title" data-id="${c.id}" style="--tone:${toneVar(c.tone)}">
      <div class="mg-text"><span class="mg-kick">Chapter ${ROMAN[c.n]} · ${esc(c.years)}</span><h2 class="mg-title mg-title-xl">${esc(c.title)}</h2>
        <blockquote class="mg-verse"><p>${esc(f.verse.text)}</p><footer>${refLink(f.verse.ref)} · KJV · Stephen's telling</footer></blockquote>
        ${chapterIntro(c)}
      </div>
      <ol class="mg-index">${list.map((s, i) => `<li><button type="button" data-go="${i + 1}"><span>${String(i + 1).padStart(2, "0")}</span><b>${esc(s.title)}</b><small>${esc(refText(s.verse.ref))}</small><i class="mg-index-arrow" aria-hidden="true">${icon("arrowRight", 18)}</i></button></li>`).join("")}</ol></div>`;
  };
  const stopsLine = (c) => c.stops.map((i) => M.map.route[i]).filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i)
    .map((s) => `<li><b>${esc(s.name)}</b>${refLink(s.verse.ref)}<small>${Math.round(s.confidence * 100)}%</small></li>`).join("");
  const chapter = (c) => {
    const slides = [titleSlide(c), ...c.scenes.map((id) => sceneSlide(M.sceneById[id], c))];
    return `<section class="mg-ch" id="mg-${c.id}" data-ch="${c.id}" style="--tone:${toneVar(c.tone)}" aria-label="Chapter ${ROMAN[c.n]}: ${esc(c.title)}">
      ${starField(c.n * 131)}<div class="mg-num" aria-hidden="true">${ROMAN[c.n]}</div>
      <div class="mg-stage">
        <div class="mg-viewport"><div class="mg-track" style="--x:0">${slides.join("")}</div></div>
        <div class="mg-nav"><button type="button" class="mg-arrow" data-step="-1" aria-label="Previous scene">${icon("arrowLeft", 17)}</button>
          <div class="mg-dots">${slides.map((_, i) => `<button type="button" data-go="${i}" aria-label="Scene ${i + 1}" ${i === 0 ? 'aria-current="true"' : ""}></button>`).join("")}</div>
          <span class="mg-count"><b>1</b> / ${slides.length}</span><button type="button" class="mg-arrow" data-step="1" aria-label="Next scene">${icon("arrowRight", 17)}</button>
          <button type="button" class="mg-maptoggle" data-map="${c.id}" aria-expanded="false">${icon("map", 15)}<span>See the map</span></button></div>
        <div class="mg-ledger" id="mg-${c.id}-events">${MergedLedger.html(c, X)}</div>
        <div class="mg-ground">${MergedLand.svg(c.land)}</div>
      </div>
      <aside class="mg-map" aria-hidden="true" aria-label="The road: ${esc(c.road)}"><div class="mg-map-in">
        <header><span class="mg-kick">The road · ${esc(c.road)}</span><button type="button" class="mg-mapclose" data-mapclose aria-label="Hide the map">${icon("x", 17)}</button>
          <ol class="mg-stops">${stopsLine(c)}</ol><p>Places from the Atlas, with how sure it is of each spot (%). The way between stops is reconstructed.</p></header>
        <div class="mg-maphost"></div></div></aside></section>`;
  };

  DIRECTIONS.merged = {
    name: "The merged page", swatch: "#c9842f",
    mount(main) {
      main.innerHTML = `<div class="wrap mg-wait">${topline()}<p>Opening the page…</p></div>`;
      let alive = true, teardown = () => {};
      loadX().then(() => {
        if (!alive) return;
        try { teardown = draw(main); } catch (error) { console.error("merged: the page failed to draw", error); main.innerHTML = `<p class="wrap">The merged page failed to draw: ${esc(error.message)}</p>`; }
      }).catch((error) => { console.error("merged: could not load data/merged.json", error); main.innerHTML = `<p class="wrap">Could not load data/merged.json: ${esc(error.message)}</p>`; });
      return () => { alive = false; teardown(); };
    },
  };

  function draw(main) {
    const CH = X.chapters, people = MergedSections.peopleData(X);
    const RAIL = [{ target: "mg-top", label: "Moses" }, { target: "mg-atlas", label: "In the Atlas" }, ...CH.map((c) => ({ target: `mg-${c.id}`, label: `${ROMAN[c.n]} · ${c.title}` })),
      { target: "mg-man", label: "The man" }, { target: "mg-people", label: "The people around him" }, { target: "mg-word", label: "The word" }, { target: "mg-ask", label: "What readers ask" }, { target: "sources", label: "Sources" }];
    main.innerHTML = `
      <div id="mg-top" class="mg-top">${DIRECTIONS.forties.landing()}</div>
      ${MergedSections.atlas(X)}
      ${CH.map(chapter).join("")}
      ${MergedSections.man(X)}
      ${MergedSections.people(X, people)}
      ${MergedSections.word(X)}
      <div id="mg-ask">${MergedAsk.html(X.questionTitles)}</div>
      <div class="wrap mg-end-links memory-banner-shell"><a class="mg-memory" href="#memory" aria-label="Explore the long memory of Moses" aria-expanded="false" aria-controls="memory" role="button">
        <div class="memory-banner-copy"><span class="memory-banner-kicker">Across Scripture</span><h2>The long memory</h2>
          <p>Follow every verse that names Moses across Scripture. Explore the points of light and read each passage in its place.</p>
          <span class="memory-banner-cta">Explore every verse</span></div>
        <div class="memory-banner-visual"><div class="memory-banner-counter"><b data-lit>${options.person.refs.length}</b><strong>verses name Moses</strong><span>${new Set(options.person.refs.map(id => Math.floor(id / 1000000))).size} books &middot; ${options.person.refs.filter(id => Math.floor(id / 1000000) >= 2 && Math.floor(id / 1000000) <= 5).length} in Exodus&ndash;Deuteronomy, ${options.person.refs.filter(id => Math.floor(id / 1000000) > 5).length} after</span><small data-passing hidden></small></div><svg class="memory-banner-art" viewBox="0 0 480 240" aria-hidden="true"><defs><radialGradient id="memory-banner-glow"><stop stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><ellipse cx="240" cy="130" rx="240" ry="115" fill="url(#memory-banner-glow)"/>
          ${[44,104,164,224].map(y => '<path d="M18 '+y+'H462"/>').join('')}
          ${Array.from({length:11},(_,i) => '<path d="M'+(28+i*42)+' 42V225"/>').join('')}
          ${Array.from({length:90},(_,i) => '<circle cx="'+(24+(i*37)%430)+'" cy="'+(54+Math.floor(i/30)*60+(i*11)%38)+'" r="'+(i%7===0?3.6:2.1)+'" opacity="'+(.25+(i%5)*.15)+'"/>').join('')}</svg></div>
      </a><div class="memory-study-footer"><a class="memory-study-link" href="/study/long-memory?person=moses">Explore the Long Memory study ${icon("arrowRight",18)}</a></div><button type="button" class="memory-close" aria-label="Close the long memory" hidden>${icon("x",24)}</button></div>
      <div class="wrap"><div class="mg-sources">${sourcesBlock()}</div></div>
      <div class="cn-drawer mg-drawer" aria-hidden="true"><div class="cn-scrim" data-close></div><div class="cn-sheet"><button type="button" class="cn-close" data-close aria-label="Close">${icon("x", 18)}</button><div class="cn-sheet-body"></div></div></div>
      ${MergedRail.html(RAIL)}`;
    const remembrance = main.querySelector('#mg-remembrance');
    const remembranceWrap = document.createElement('div');
    remembranceWrap.className = 'wrap mx-remembrance-wrap';
    main.querySelector('#mg-word').after(remembranceWrap);
    remembranceWrap.append(remembrance);
    remembranceWrap.after(main.querySelector(".mg-end-links"));
    const scriptureLimits = main.querySelector('.mx-man-foot');
    scriptureLimits.className = 'wrap mx-scripture-limits';
    main.querySelector('#mg-ask').after(scriptureLimits);
    mountChapterTopics(main, X.chapters, peopleList(), controller.signal);
    mountWordTopics(main, controller.signal);
    main.querySelector("#sources")?.removeAttribute("id");
    main.querySelector(".mg-sources").id = "sources";

    // The clock holds one animation at a time. Starting a new one first finishes the one still playing, so nothing is
    // ever left half-drawn or half-slid.
    let cur = null;
    const play = (job) => {
      if (cur && !cur.ended) { cur.ended = true; try { cur.frame(1); } catch (error) { console.error(`merged: could not finish "${cur.label}"`, error); } cur.done?.(); }
      const frame = job.frame, done = job.done;
      job.frame = (q) => { if (q < 1) job.ended = false; frame(q); };
      job.done = () => { if (job.finished) return; job.finished = true; job.ended = true; done?.(); };
      cur = job; Clock.run(job);
    };

    // The landing: B's ring sweeps 0 to 120 once, then rests on Act I with its card chosen (as in B).
    const ring = main.querySelector(".tf-ring"), cards = [...main.querySelectorAll(".tf-act-btn")];
    const chooseAct = (a) => { cards.forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.act) === a))); ring.dataset.act = String(a); };
    chooseAct(1);
    play({ label: "The 120-year ring sweeps, then rests on Act I", duration: 2400, frame: (q) => DIRECTIONS.forties.ringFrame(ring, q, { full: true, to: 1 }),
      moving: (q) => (q < 1 ? ["ring hand and arcs", "year count"] : []) });
    const turnTo = (a) => { chooseAct(a); play({ label: `Act ${ROMAN[a]}: the ring turns`, duration: 900, frame: (q) => DIRECTIONS.forties.ringFrame(ring, q, { full: false, to: a }), moving: (q) => (q < 1 ? ["ring hand"] : []) }); };

    // The Atlas band, the people field and the dot navigation.
    const offAtlas = MergedSections.wireAtlas(main.querySelector(".mx-atlas"), X);
    const peopleUi = MergedSections.wirePeople(main.querySelector(".mx-people"), X, people);
    const offRail = MergedRail.wire(main, RAIL);
    const offAsk = MergedAsk.wire(main.querySelector(".mg-ask"));

    // Chapters: scenes slide sideways; each scene's drawing draws itself on arrival and on every return, then idles.
    const state = new Map(), maps = new Map();
    const chOf = (id) => main.querySelector(`#mg-${id}`), dataOf = (ch) => CH.find((c) => c.id === ch.dataset.ch);
    const slideTo = (ch, to) => {
      const track = ch.querySelector(".mg-track"), slides = [...track.children], from = state.get(ch) ?? 0;
      to = Math.max(0, Math.min(slides.length - 1, to)); state.set(ch, to);
      ch.querySelectorAll(".mg-dots button").forEach((b, i) => b.toggleAttribute("aria-current", i === to));
      ch.querySelector(".mg-count b").textContent = String(to + 1);
      slides.forEach((s, i) => { s.inert = i !== to; s.setAttribute("aria-hidden", String(i !== to)); });
      const slide = slides[to], target = slide.querySelector(".art"), cells = [...slide.querySelectorAll(".mg-pl")];
      target?.classList.remove("is-idle"); target?.style.setProperty("--draw", "0");
      play({ label: `Slide to "${slide.querySelector(".mg-title")?.textContent ?? ""}"`, duration: from === to ? 1700 : 2300,
        frame: (q) => {
          track.style.setProperty("--x", (from + (to - from) * easeInOut(span(q, 0, .45))).toFixed(4));
          target?.style.setProperty("--draw", span(q, .3, 1).toFixed(3));
          cells.forEach((c, i) => c.style.setProperty("--draw", easeOut(span(q, .3 + i * .05, .62 + i * .05)).toFixed(3)));
          target?.classList.toggle("is-idle", q >= 1);
        },
        moving: (q) => [from !== to && q < .45 && "scenes sliding sideways", (target || cells.length) && q > .3 && q < 1 && "line drawing drawing itself"].filter(Boolean) });
    };

    // The map slides in beside the chapter (the chapter narrows to the left) and lights the chapter's stretch of road;
    // "Hide the map" plays the same motion backwards: the map slides out and the chapter widens. Both run on the clock,
    // so the ticker can step either one. On a phone the map is a sheet that slides up from the bottom.
    const boxFor = (stops) => { const xs = stops.map((i) => M.map.route[i].xy[0]), ys = stops.map((i) => M.map.route[i].xy[1]), pad = 46;
      return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) - Math.min(...xs) + pad * 2, Math.max(...ys) - Math.min(...ys) + pad * 2]; };
    // is-map: the map is on screen (also while it slides out); mapdir: which way it is going, for the buttons.
    const setMapUi = (ch, shown) => { if (ch.classList.contains("is-map") === shown) return; ch.classList.toggle("is-map", shown); ch.querySelector(".mg-map").setAttribute("aria-hidden", String(!shown)); ch.querySelector(".mg-map").inert = !shown; };
    const setDir = (ch, dir) => {
      ch.dataset.mapdir = dir;
      ch.querySelectorAll(".mg-maptoggle").forEach((b) => { b.setAttribute("aria-expanded", String(dir === "in")); b.querySelector("span").textContent = dir === "in" ? "Hide the map" : "See the map"; });
    };
    const setM = (ch, v) => { ch.style.setProperty("--m", v.toFixed(4)); ch.dataset.mapping = v > 0 && v < 1 ? "1" : ""; };
    const openMap = (ch) => {
      const c = dataOf(ch);
      setMapUi(ch, true); setDir(ch, "in"); ch.classList.add("is-narrow");
      if (!maps.has(ch)) maps.set(ch, MosesMap(ch.querySelector(".mg-maphost")));
      const m = maps.get(ch);
      requestAnimationFrame(() => { const r = m.size(), top = ch.querySelector(".mg-map header").offsetHeight - 10; m.setView(m.fit(boxFor(c.stops), { x: 24, y: top, w: r.width - 48, h: r.height - top - 36 })); });
      m.setRange(c.range[0], c.range[0]);
      // Bring the chapter's top into view first when its end is on screen, so the map's heading and close are in view.
      const box = ch.getBoundingClientRect();
      if (innerWidth > 760 && box.top > 0 && box.top > innerHeight * .4) ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
      const start = Number(ch.style.getPropertyValue("--m") || 0);
      play({ label: `The map slides in beside ${c.title}`, duration: 1600,
        frame: (q) => { setMapUi(ch, true); setM(ch, start + (1 - start) * easeInOut(span(q, 0, .55))); m.setRange(c.range[0], c.range[0] + (c.range[1] - c.range[0]) * easeInOut(span(q, .35, 1))); },
        moving: (q) => [q < .55 && "map sliding in, chapter narrowing", q > .35 && q < 1 && "route drawing"].filter(Boolean) });
    };
    const closeMap = (ch, animate = true) => {
      if (!ch.classList.contains("is-map")) return;
      setDir(ch, "out"); ch.classList.remove("is-narrow");
      if (!animate) { setM(ch, 0); setMapUi(ch, false); return; } // it has left the screen already
      const start = Number(ch.style.getPropertyValue("--m") || 1);
      play({ label: `The map slides back out from ${dataOf(ch).title}`, duration: 1200,
        frame: (q) => { setMapUi(ch, true); setM(ch, start * (1 - easeInOut(q))); if (q >= 1) setMapUi(ch, false); },
        moving: (q) => (q < 1 ? ["map sliding out, chapter widening"] : []) });
    };
    // A chapter's scene draws when its scenes come into view; a chapter that leaves the screen puts its map away.
    const seen = new WeakSet();
    const vpIo = new IntersectionObserver((entries) => entries.forEach((e) => {
      const ch = e.target.closest(".mg-ch");
      if (e.isIntersecting && !seen.has(ch)) { seen.add(ch); slideTo(ch, state.get(ch) ?? 0); }
      else if (!e.isIntersecting) seen.delete(ch);
    }), { threshold: .45 });
    const chIo = new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) closeMap(e.target, false); }), { threshold: 0 });
    main.querySelectorAll(".mg-ch").forEach((ch) => { ch.querySelectorAll(".art").forEach((a) => a.style.setProperty("--draw", "0")); vpIo.observe(ch.querySelector(".mg-viewport")); chIo.observe(ch); });
    // The people field blooms when it comes into view.
    let bloomed = false;
    const pIo = new IntersectionObserver(([e]) => { if (e.isIntersecting && !bloomed) { bloomed = true; play({ label: "The people around him bloom out from Moses", duration: 2600, frame: peopleUi.field.bloomFrame, moving: peopleUi.field.bloomMoving }); } }, { threshold: .3 });
    pIo.observe(main.querySelector(".mx-pfield"));

    const drawer = main.querySelector(".mg-drawer"), sheet = drawer.querySelector(".cn-sheet-body");
    const openDrawer = (html, tone) => { sheet.innerHTML = html; drawer.style.setProperty("--tone", tone); drawer.classList.add("is-open"); drawer.setAttribute("aria-hidden", "false"); sheet.scrollTop = 0; };
    const closeDrawer = () => { drawer.classList.remove("is-open"); drawer.setAttribute("aria-hidden", "true"); };
    const goChapter = (id, scene) => {
      const ch = chOf(id);
      if (scene !== undefined) { if (seen.has(ch)) slideTo(ch, scene); else state.set(ch, scene); }
      ch.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    };
    const onClick = (e) => {
      const ch = e.target.closest(".mg-ch");
      const step = e.target.closest(".mg-nav [data-step]"); if (step && ch) { slideTo(ch, (state.get(ch) ?? 0) + Number(step.dataset.step)); return; }
      const go = e.target.closest("[data-go]"); if (go && ch) { slideTo(ch, Number(go.dataset.go)); return; }
      const mp = e.target.closest("[data-map]"); if (mp && ch) { if (ch.dataset.mapdir === "in") closeMap(ch); else openMap(ch); return; }
      if (e.target.closest("[data-mapclose]") && ch) { closeMap(ch); return; }
      const ev = e.target.closest("[data-events]"); if (ev) { e.preventDefault(); main.querySelector(`#mg-${ev.dataset.events}-events`).scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); return; }
      const pl = e.target.closest("[data-plague]");
      if (pl) { const box = pl.closest(".mg-art-plagues"); box.querySelectorAll("[data-plague]").forEach((b) => b.setAttribute("aria-pressed", String(b === pl))); box.querySelector("[data-plline]").innerHTML = plagueLine(Number(pl.dataset.plague)); return; }
      const d = e.target.closest("[data-drawer]"); if (d) { openDrawer(drawerFor[d.dataset.drawer], getComputedStyle(d.closest(".mg-slide")).getPropertyValue("--tone")); return; }
      if (e.target.closest("[data-close]")) { closeDrawer(); return; }
      const fam = e.target.closest("[data-fam]"); if (fam) { main.querySelectorAll("[data-fam]").forEach((g) => g.classList.toggle("is-on", g === fam)); main.querySelector(".mx-fd").innerHTML = MergedSections.famDetail(X, fam.dataset.fam); return; }
      const ask = e.target.closest("[data-askq]"); if (ask) { e.preventDefault(); const w = main.querySelector(`.mg-word[data-q="${ask.dataset.askq}"]`); main.querySelector("#mg-ask").scrollIntoView({ behavior: reduced() ? "auto" : "smooth" }); if (w && w.getAttribute("aria-expanded") !== "true") w.click(); return; }
      const gc = e.target.closest("[data-goch]"); if (gc) { e.preventDefault(); goChapter(gc.dataset.goch); return; }
      const card = e.target.closest(".tf-act-btn"); if (card) { const a = Number(card.dataset.act); turnTo(a); goChapter(CH.find((c) => c.act === a)?.id ?? CH[CH.length - 1].id); return; }
      const hit = e.target.closest(".tf-hit, .tf-actlabel"); if (hit) { const a = Number(hit.dataset.act); turnTo(a); goChapter(CH.find((c) => c.act === a).id); return; }
      const dot = e.target.closest(".tf-dot"); if (dot) { const c = CH.find((x) => x.scenes.includes(dot.dataset.scene)); goChapter(c.id, c.scenes.indexOf(dot.dataset.scene) + 1); }
    };
    const onKey = (e) => {
      if (e.key === "Escape") { closeDrawer(); main.querySelectorAll(".mg-ch.is-map").forEach((ch) => closeMap(ch)); return; }
      if (e.defaultPrevented || !root.contains(e.composedPath()[0]) || e.composedPath()[0]?.closest?.("input, select, textarea, .lg-scroll")) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const ch = [...main.querySelectorAll(".mg-ch")].find((c) => { const r = c.querySelector(".mg-viewport").getBoundingClientRect(); return r.top < innerHeight / 2 && r.bottom > innerHeight / 2; });
      if (ch) slideTo(ch, (state.get(ch) ?? 0) + (e.key === "ArrowRight" ? 1 : -1));
    };
    let sx = null;
    const onDown = (e) => { if (e.target.closest(".mg-viewport")) sx = [e.clientX, e.clientY, e.target.closest(".mg-ch")]; };
    const onUp = (e) => { if (!sx) return; const dx = e.clientX - sx[0], dy = e.clientY - sx[1]; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) slideTo(sx[2], (state.get(sx[2]) ?? 0) + (dx < 0 ? 1 : -1)); sx = null; };
    main.querySelectorAll(".mg-track").forEach((track) => [...track.children].forEach((s,i) => { s.inert = i !== 0; s.setAttribute("aria-hidden", String(i !== 0)); }));
    main.addEventListener("click", onClick); addEventListener("keydown", onKey); main.addEventListener("pointerdown", onDown); addEventListener("pointerup", onUp);
    readyPage();
    return () => { vpIo.disconnect(); chIo.disconnect(); pIo.disconnect(); maps.forEach((m) => m.destroy()); offAtlas(); peopleUi.destroy(); offRail(); offAsk(); removeEventListener("keydown", onKey); removeEventListener("pointerup", onUp); };
  }
})();


  let offMerged, offMemory;
  const memory = document.createElement('section');
  memory.id = 'memory'; memory.className = 'dir-memory'; memory.hidden = true;
  function readyPage() {
    if (disposed) return;
    root.querySelectorAll('.mg-map').forEach((map) => { map.inert = true; });
    const drawer = root.querySelector('.mg-drawer');
    const panel = drawer.querySelector('.cn-sheet');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Scene details');
    drawer.inert = true;
    let returnFocus = null;
    const drawerState = new MutationObserver(() => {
      const open = drawer.classList.contains('is-open');
      if (open === !drawer.inert) return;
      drawer.inert = !open;
      [...root.children].filter((child) => child !== drawer).forEach((child) => { child.inert = open; });
      if (open) { returnFocus = root.getRootNode().activeElement; panel.querySelector('button').focus(); }
      else returnFocus?.focus();
    });
    drawerState.observe(drawer, { attributes: true, attributeFilter: ['class'] });
    drawer.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const items = [...panel.querySelectorAll('a[href], button, [tabindex="0"]')];
      const first = items[0], last = items[items.length - 1], active = root.getRootNode().activeElement;
      if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
    });
    root.querySelector('.memory-study-footer').before(memory);
    root.querySelector('.mg-sources').insertAdjacentHTML('beforeend', `<p class="moses-credit">People, families, eras and references: <cite>TIPNR — Translators Individualised Proper Names with all References</cite>, <a href="https://www.stepbible.org">STEP Bible</a> (based on work at Tyndale House Cambridge), <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. STEP notes that its short summaries and articles were adapted from AI output (2024). The biography above was written by this site from Scripture.</p>`);
    options.onReady();
    const hash = location.hash;
    if (hash === '#memory') openMemory(true);
    else if (hash) root.querySelector('[id="' + CSS.escape(hash.slice(1)) + '"]')?.scrollIntoView();
  }
  let memoryLoaded = false, memoryWanted = false, memoryAnimations = [];
  const memoryUpIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V4m-7 7 7-7 7 7"/></svg>';
  controller.signal.addEventListener('abort', () => memoryAnimations.forEach(animation => animation.cancel()), { once: true });
  function returnToMemoryBanner() {
    const trigger = root.querySelector('.mg-memory');
    trigger.focus({ preventScroll: true });
    trigger.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }
  function animateMemory(scroll = false) {
    if (disposed || !memoryLoaded) return;
    const visual = memory.firstElementChild;
    const from = memory.hidden ? 0 : memory.getBoundingClientRect().height;
    const opacity = memory.hidden ? 0 : Number(getComputedStyle(visual).opacity);
    memoryAnimations.forEach(animation => animation.cancel());
    memoryAnimations = [];
    memory.hidden = false;
    memory.style.height = from + 'px';
    memory.classList.add('memory-opening');
    const finish = () => {
      memory.style.height = '';
      memory.classList.remove('memory-opening');
      memory.hidden = !memoryWanted;
      if (!memoryWanted) returnToMemoryBanner();
      if (scroll && memoryWanted) memory.scrollIntoView({ behavior: 'auto', block: 'start' });
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    const expansion = memory.animate([{ height: from + 'px' }, { height: (memoryWanted ? memory.scrollHeight : 0) + 'px' }], {
      duration: memoryWanted ? 720 : 480, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'forwards'
    });
    const reveal = visual.animate([{ opacity }, { opacity: memoryWanted ? 1 : 0 }], {
      duration: memoryWanted ? 600 : 260, delay: memoryWanted && from === 0 ? 150 : 0, easing: 'ease-out', fill: 'both'
    });
    memoryAnimations = [expansion, reveal];
    Promise.all(memoryAnimations.map(animation => animation.finished)).then(() => {
      if (disposed || memoryAnimations[0] !== expansion) return;
      finish(); memoryAnimations.forEach(animation => animation.cancel()); memoryAnimations = [];
    }).catch(() => {});
  }
  function setMemoryOpen(open, scroll = false) {
    memoryWanted = open;
    const trigger = root.querySelector('.mg-memory');
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Close the long memory of Moses' : 'Explore the long memory of Moses');
    root.querySelector('.memory-close').hidden = !open;
    trigger.querySelector('.memory-banner-cta').textContent = open ? 'Close the graph' : 'Explore every verse';
    if (!memory.firstElementChild && open) {
      memory.hidden = false; memory.style.height = '0px'; memory.classList.add('memory-opening');
      const visual = document.createElement('div'); memory.append(visual);
      offMemory = DIRECTIONS.memory.mount(visual, () => {
        visual.insertAdjacentHTML('beforeend', `<button type="button" class="memory-bottom-toggle" aria-label="Collapse the long memory">${memoryUpIcon}</button>`);
        memoryLoaded = true;
        if (!memoryWanted) { memory.hidden = true; memory.style.height = ''; memory.classList.remove('memory-opening'); returnToMemoryBanner(); }
        else animateMemory(scroll);
      });
    } else if (memoryLoaded) animateMemory(scroll);
  }
  function openMemory(scroll = false) { setMemoryOpen(true, scroll); }
  root.addEventListener('keydown', (event) => {
    const target = event.target.closest?.('[role="button"]');
    if (target && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  root.addEventListener('click', (event) => {
    if (event.target.closest?.('.memory-close, .memory-bottom-toggle')) { event.preventDefault(); setMemoryOpen(false); return; }
    const a = event.target.closest?.('a[href]');
    if (!a || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.target === '_blank') return;
    const href = a.getAttribute('href');
    if (href === '#memory') { event.preventDefault(); setMemoryOpen(!memoryWanted); return; }
    if (href.startsWith('#')) { event.preventDefault(); root.querySelector('[id="' + CSS.escape(href.slice(1)) + '"]')?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (href.startsWith('/')) { event.preventDefault(); options.navigate(href); }
  });
  loadMoses().then(() => { if (!disposed) offMerged = DIRECTIONS.merged.mount(root); }).catch((error) => { if (!disposed) options.onError(error); });
  return () => {
    disposed = true; offMerged?.(); offMemory?.(); Clock.stop(); controller.abort();
    observers.forEach((observer) => observer.disconnect());
    frames.forEach((id) => window.cancelAnimationFrame(id)); timers.forEach((id) => window.clearTimeout(id));
    root.replaceChildren();
  };
}
