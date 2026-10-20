// The Old maps collection page (merged design, owner-approved 2026-10-19): ported from design/old-maps-directions (?d=d).
// The sections are plain-DOM modules from the mock-up; this file mounts them into the React page and tears them down.
import "./icons.js";
import "./data.js";
import "./art.js";
import "./common.js";
import "./viewer.js";
import "./dir-a.js";
import "./dir-b.js";
import "./dir-c.js";

const ORDER = ["a_landing", "b_chest", "a_lanes", "c_sequence", "c_grid", "a_libraries"];

/** Draws every section into `root`; internal links go through `navigate`. Returns the function that removes it all. */
export function mountOldMaps(root, navigate) {
  for (const name of ORDER) {
    const section = document.createElement("section");
    section.id = name;
    section.className = `om-sec om-sec-${name}`;
    root.append(section);
    try {
      window.Sections[name].mount(section);
    } catch (error) {
      console.error(`Old maps: the "${name}" section failed to draw`, error);
      section.innerHTML = '<p class="om-failed">This section could not be drawn.</p>';
    }
  }
  // Sections borrowed from several directions keep their own numbers; number them again in the order they stand here.
  root.querySelectorAll(".om-head .om-num").forEach((num, i) => { num.textContent = String(i + 1).padStart(2, "0"); });

  const onLink = (event) => {
    const link = event.target.closest("a[href^='/']");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || link.target) return;
    event.preventDefault();
    navigate(link.getAttribute("href"));
  };
  root.addEventListener("click", onLink);
  return () => {
    root.removeEventListener("click", onLink);
    window.Viewer.destroy();
    root.replaceChildren();
  };
}
