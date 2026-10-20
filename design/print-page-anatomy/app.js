// Mock-up behaviour: the landing's lifted page cycles through the six editions; the inspector shows one edition either
// as one glass sheet (A) or with its three layers lifted apart (B). Clicking a layer row
// opens its explanation; its Shown/Hidden switch takes it off the page.
import { EDITIONS, TONES, flatPage, layerSvg, sheetSvg } from './pages.js';

const $ = sel => document.querySelector(sel);
const state = { edition: 'gutenberg', visible: [true, true, true], reading: 0, view: new URLSearchParams(location.search).get('view') === 'a' ? 'a' : 'b' };

/** Three plates, one per layer, stacked in 3D; the top plate is the main text. */
function stack(edition, visible) {
  return `<div class="pa-stack">${edition.layers.map((layer, i) =>
    `<div class="pa-plate" data-layer="${i}" data-off="${!visible[i] || undefined}" style="--i:${2 - i};--tone:${TONES[i]}">
      ${sheetSvg(layerSvg(layer, i), false)}</div>`).reverse().join('')}</div>
    <ol class="pa-legend">${edition.layers.map((layer, i) =>
      `<li style="--tone:${TONES[i]}" data-off="${!visible[i] || undefined}"><b>0${i + 1}</b>${layer.label}</li>`).join('')}</ol>`;
}

// ── Landing: a lifted page that changes edition every few seconds ──
let heroAt = 0;
function drawHero() {
  const edition = EDITIONS[heroAt % EDITIONS.length];
  $('#pa-hero-stack').innerHTML = stack(edition, [true, true, true]);
  $('#pa-hero-caption').innerHTML = `<b>${edition.name}</b><span>${edition.date} · ${edition.place}</span>`;
  heroAt++;
}
drawHero();
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(drawHero, 6500);

// ── Three ways a page is built ──
document.querySelectorAll('[data-thumb]').forEach(el => {
  el.innerHTML = flatPage(EDITIONS.find(e => e.id === el.dataset.thumb));
});

// ── Inspector ──
function drawInspector() {
  const edition = EDITIONS.find(e => e.id === state.edition);
  $('#pa-pills').innerHTML = EDITIONS.map(e =>
    `<button type="button" role="radio" aria-checked="${e.id === state.edition}" data-edition="${e.id}">${e.pill}</button>`).join('');
  $('#pa-art').dataset.view = state.view;
  $('#pa-art').innerHTML = (state.view === 'a' ? `<div class="pa-flat">${flatPage(edition)}</div>` : stack(edition, state.visible))
    + `<p class="pa-art-meta"><span>${edition.place}</span><span>${edition.langs}</span></p>`;
  if (state.view === 'a') document.querySelectorAll('#pa-art .pa-layer').forEach(g => { g.dataset.off = !state.visible[g.dataset.layer] || undefined; });
  const layer = edition.layers[state.reading];
  $('#pa-read').innerHTML = `
    <p class="pa-kicker">${edition.date} / ${edition.place}</p>
    <h3>${edition.name}</h3><p class="pa-people">${edition.people}</p>
    <div class="pa-rows">${edition.layers.map((l, i) =>
      `<div class="pa-row" style="--tone:${TONES[i]}" data-reading="${state.reading === i || undefined}" data-off="${!state.visible[i] || undefined}">
        <button type="button" class="pa-row-read" data-layer="${i}"><i>0${i + 1}</i><span><b>${l.label}</b><small>${l.title}</small></span></button>
        <button type="button" class="pa-row-eye" data-layer="${i}" aria-pressed="${state.visible[i]}" aria-label="Show ${l.label}">${state.visible[i] ? 'Shown' : 'Hidden'}</button></div>`).join('')}</div>
    <div class="pa-explain" style="--tone:${TONES[state.reading]}"><p class="pa-kicker">Layer ${state.reading + 1} · ${state.visible[state.reading] ? 'visible' : 'hidden'}</p>
      <h4>${layer.title}</h4><p>${layer.text}</p></div>`;
  document.querySelectorAll('.pa-view button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === state.view));
}

document.addEventListener('click', event => {
  const pill = event.target.closest('[data-edition]');
  if (pill) { state.edition = pill.dataset.edition; state.visible = [true, true, true]; state.reading = 0; drawInspector(); return; }
  const read = event.target.closest('.pa-row-read');
  if (read) { state.reading = +read.dataset.layer; drawInspector(); return; }
  const eye = event.target.closest('.pa-row-eye');
  if (eye) { const i = +eye.dataset.layer; state.visible[i] = !state.visible[i]; state.reading = i; drawInspector(); return; }
  const view = event.target.closest('.pa-view button');
  if (view) { state.view = view.dataset.view; drawInspector(); }
});

// Pointing at a lifted plate lights its row and dims the others.
$('#pa-art').addEventListener('pointerover', event => {
  const plate = event.target.closest('.pa-plate');
  $('#pa-art').dataset.focus = plate ? plate.dataset.layer : '';
});
$('#pa-art').addEventListener('pointerleave', () => { $('#pa-art').dataset.focus = ''; });

// The copied header's theme switch: moon when dark, sun when light, as on the live site.
const ICONS = {
  dark: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  light: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
};
function showTheme(dark) {
  $('#pa-theme').setAttribute('aria-checked', dark);
  $('#pa-theme > span').innerHTML = `<svg class="lucide h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[dark ? 'dark' : 'light']}</svg>`;
}
showTheme(matchMedia('(prefers-color-scheme: dark)').matches);
$('#pa-theme').addEventListener('click', () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  showTheme(!dark);
});

drawInspector();
