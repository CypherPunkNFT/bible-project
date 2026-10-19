// A: the eighteen records on one time line, in four lanes by what kind of witness each is. Each record spans only as
// much time as its own date says: a solid bar for a year or short span, a soft bar for a century, a dashed outline where
// the date is debated. The long quiet stretch between 650 and 1500 is cut to a marked break. Any record opens its sheet.
(() => {
  const { byId, name, tone } = CNX;
  // Year to a share of the plot's width: 350 BC to AD 650 takes 84%, a break, then 1500 to 1700.
  const SEGMENTS = [[-350, 650, 0, 0.84], [1500, 1700, 0.88, 1]];
  const at = (year) => { for (const [a, b, x0, x1] of SEGMENTS) if (year <= b || x1 === 1) return x0 + ((Math.min(Math.max(year, a), b) - a) / (b - a)) * (x1 - x0); };
  const TICKS = [-300, -200, -100, 1, 100, 200, 300, 400, 500, 600, 1500, 1600, 1700];
  const tickText = (y) => (y < 0 ? `${-y} BC` : y === 1 ? "AD 1" : String(y));
  const ROW = 30;

  function layout(tracks) {
    const width = tracks[0].clientWidth;
    for (const lane of tracks) {
      const ends = [];
      for (const item of lane.querySelectorAll(".tl-item")) {
        const span = CN.spans[item.dataset.open];
        const left = at(span.from) * width, barWidth = Math.max((at(span.to) - at(span.from)) * width, 9);
        const labelWidth = item.querySelector("b").textContent.length * 7 + 16;
        const flip = left + barWidth + labelWidth > width;
        const [start, end] = flip ? [left - labelWidth, left + barWidth] : [left, left + barWidth + labelWidth];
        let row = ends.findIndex((e) => e < start);
        if (row === -1) { row = ends.length; ends.push(end); } else ends[row] = end;
        Object.assign(item.style, { left: `${left}px`, top: `${row * ROW + 8}px` });
        item.style.setProperty("--bar", `${barWidth}px`);
        item.classList.toggle("tl-flip", flip);
      }
      lane.style.height = `${Math.max(ends.length, 1) * ROW + 14}px`;
    }
  }

  function mount(section, { num }) {
    section.innerHTML = `${head(num, "Enter the timeline", "Put each witness back in <em>its own time</em>", "Explore eighteen records. Dates refer to the text, object or decision described; later copies and compilations are identified where relevant.")}
      <div class="tl-scroll"><div class="tl">
        <div class="tl-axis"><span></span><div class="tl-ticks">${TICKS.map((y) => `<i style="left:${(at(y) * 100).toFixed(2)}%">${tickText(y)}</i>`).join("")}<b class="tl-break" style="left:84%;width:4%" title="650–1500 left out: no record falls here">≈</b></div></div>
        ${CN.lanes.map((lane) => `<div class="tl-lane"><div class="tl-head"><b>${esc(lane.label)}</b><small>${esc(lane.line)}</small></div>
          <div class="tl-track">${lane.ids.map((id) => {
            const r = byId.get(id), span = CN.spans[id];
            return `<button type="button" class="tl-item tl-${span.how}" data-open="${id}" style="--tone:${tone(id)}" aria-label="${esc(`${name(id)}, ${r.date}. ${r.title}`)}"><i></i><b>${esc(name(id))}</b></button>`;
          }).join("")}<span class="tl-gap" style="left:84%;width:4%"></span></div></div>`).join("")}
      </div></div>
      <p class="tl-key"><span><i class="tl-k tl-firm"></i>A year or short span</span><span><i class="tl-k tl-century"></i>A century or broad period</span><span><i class="tl-k tl-debated"></i>Date debated</span><span class="tl-key-note">Nothing is pinned more precisely than its record. The lanes are this page's grouping; each record's own kind is shown when it is opened.</span></p>
      <p class="ms-say" aria-live="polite">Point at a record to read it here; click to open it.</p>
      ${CNX.bridge()}`;
    const plot = section.querySelector(".tl");
    const say = section.querySelector(".ms-say"), base = say.innerHTML;
    const show = (item) => {
      if (!item) { say.innerHTML = base; return; }
      const r = byId.get(item.dataset.open);
      say.innerHTML = `<b>${esc(name(r.id))}</b> · ${esc(r.date)} · ${esc(r.place)}. ${esc(r.title)} <span class="ms-say-go">${esc(r.kind)} · open</span>`;
    };
    plot.addEventListener("pointerover", (e) => show(e.target.closest(".tl-item")));
    plot.addEventListener("focusin", (e) => show(e.target.closest(".tl-item")));
    plot.addEventListener("pointerleave", () => show(null));
    const tracks = [...section.querySelectorAll(".tl-track")];
    const run = () => layout(tracks);
    new ResizeObserver(run).observe(tracks[0]);
    run();
  }
  Sections.timeline = { mount };
})();
