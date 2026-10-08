/** The apostle pages' tooltip: one element for the page, moved on pointer moves (no re-render per move). */
let tip: HTMLDivElement | undefined;
let tipKey = "";
export const Tip = {
  show(content: { title: string; lines: string[] }, x: number, y: number) {
    if (!tip) { tip = document.createElement("div"); tip.className = "ap ap-tip"; tip.setAttribute("role", "status"); }
    if (!tip.isConnected) document.body.append(tip);
    const key = JSON.stringify(content);
    if (key !== tipKey) {
      tipKey = key;
      const b = document.createElement("b"); b.textContent = content.title;
      tip.replaceChildren(b, ...content.lines.filter(Boolean).map((l) => { const s = document.createElement("small"); s.textContent = l; return s; }));
    }
    const w = tip.offsetWidth, h = tip.offsetHeight, left = x + 16 + w > innerWidth - 8 ? x - 16 - w : x + 16, top = Math.min(innerHeight - h - 8, Math.max(8, y + 14));
    tip.style.transform = `translate(${Math.max(8, left)}px, ${top}px)`;
    tip.classList.add("show");
  },
  hide() { tip?.classList.remove("show"); },
  remove() { tip?.remove(); tipKey = ""; },
};

