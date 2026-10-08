// Boot: the data, the site frame, the helix (WebGL, or the flat fallback), and the facets.
import { loadData, esc } from "./util.js";
import { header, footer, dirBar, savedTheme, wireTheme } from "./site.js";
import { mountJourney } from "./journey.js";
import { mountFacets } from "./facets.js";

const icon = (...a) => window.icon(...a);

function webglAvailable() {
  if (new URLSearchParams(location.search).has("flat")) return false;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (error) { console.warn("helix: WebGL probe failed", error); return false; }
}

async function makeStageFactory() {
  if (webglAvailable()) {
    try {
      const { createStage3D } = await import("./stage3d.js");
      return (opts) => { try { return createStage3D(opts); } catch (error) { console.warn("helix: WebGL stage failed, drawing the flat helix instead", error); return null; } };
    } catch (error) { console.warn("helix: could not load three.js, drawing the flat helix instead", error); }
  }
  return null;
}

async function start() {
  document.documentElement.dataset.theme = savedTheme();
  let data;
  try { data = await loadData(); } catch (error) { console.error("helix: could not load data/david.json", error); document.body.textContent = `Could not load data/david.json: ${error.message}`; return; }
  document.body.innerHTML = `${header()}
    <main id="main">
      <div class="wrap topline-wrap"><div class="topline"><a href="/study/people">${icon("arrowLeft", 15)}Back to People &amp; genealogies</a><span>People / ${esc(data.person.name)} / The reign</span></div></div>
      <section class="journey" id="journey" aria-label="David's life as a helix"></section>
      <section class="facets" id="facets" aria-label="Facets of the reign"></section>
    </main>${footer()}${dirBar("helix")}`;
  const hdr = document.getElementById("site-header");
  const setHdr = () => document.documentElement.style.setProperty("--hdr", `${hdr.offsetHeight}px`);
  setHdr(); new ResizeObserver(setHdr).observe(hdr);
  window.Clock.mount();

  const factory = await makeStageFactory();
  const { createFlat } = await import("./flat.js");
  const makeStage = (opts) => (factory && factory(opts)) || createFlat(opts);
  const journey = mountJourney(document.getElementById("journey"), data, makeStage);
  mountFacets(document.getElementById("facets"), data, journey);
  window.__helix = journey; // for checking from the console
  wireTheme(() => journey.applyTheme());
}
start();
