// The ticker: slow motion and tick-by-tick control (20 ticks) of the page's main animation. Every moving part here is a
// CSS or Web Animation, so the ticker drives them through document.getAnimations(): speed = playbackRate, a tick = a
// twentieth of each animation's own cycle. A direction names its main animation with Ticker.watch(root, label).
(() => {
  const TICKS = 20, SPEEDS = [1, 0.25, 0.1];
  const NAMES = { sway: "the sprout", swing: "the name tag", needle: "the compass needle", flame: "the lamp flame", glow: "the light", steps: "the path",
    page: "the turning page", smoke: "the smoke", graze: "the sheep", drift: "the dust", ring: "the ring", flip: "the page turning", draw: "the line drawing", rise: "the shelf" };
  const s = { open: false, speed: 1, paused: false, tick: 0, root: null, label: "" };
  let panel = null;

  const anims = () => document.getAnimations().filter((a) => {
    const el = a.effect?.target;
    return el && (!s.root || s.root.contains(el)) && el.isConnected;
  });
  const cycle = (a) => { const t = a.effect.getComputedTiming(); return Number(t.duration) || 1; };
  const nameOf = (a) => NAMES[a.animationName] ?? NAMES[a.id] ?? a.animationName ?? a.id ?? "a part";
  function apply() {
    for (const a of anims()) {
      a.playbackRate = s.speed;
      if (s.paused) { a.pause(); a.currentTime = (s.tick / TICKS) * cycle(a); } else if (a.playState === "paused" && s.open) a.play();
    }
    render();
  }
  const Ticker = {
    watch(root, label) { s.root = root; s.label = label; s.tick = 0; if (s.open) apply(); else render(); },
    seek(i) { s.paused = true; s.tick = Math.max(0, Math.min(TICKS, i)); apply(); },
    play() { s.paused = false; for (const a of anims()) a.play(); apply(); },
    pause() { const a = anims()[0]; s.tick = a ? Math.round(((a.currentTime ?? 0) % cycle(a)) / cycle(a) * TICKS) : 0; s.paused = true; apply(); },
    setSpeed(v) { s.speed = v; apply(); },
    setOpen(v) { s.open = v; s.speed = v ? 0.1 : 1; s.paused = false; for (const a of anims()) { a.playbackRate = s.speed; if (a.playState === "paused") a.play(); } render(); },
    refresh() { if (s.open) apply(); },
  };
  window.Ticker = Ticker;

  const label = (v) => (v === 1 ? "Normal" : `${Math.round(1 / v)}× slower`);
  function render() {
    if (!panel) return;
    const { icon, esc } = Frame;
    if (!s.open) { panel.className = "ticker is-closed"; panel.innerHTML = `<button type="button" class="ticker-unfold" data-tk="open" title="Slow motion and tick-by-tick playback of this page's main animation">${icon("gauge", 15)}<span>Ticker</span></button>`; return; }
    const list = anims(), moving = [...new Set(list.map(nameOf))];
    panel.className = "ticker";
    panel.innerHTML = `
      <div class="tk-head"><strong>Ticker</strong><span>${esc(s.label)}</span><button type="button" data-tk="close" aria-label="Close the ticker">${icon("x", 14)}</button></div>
      <div class="tk-speed">${SPEEDS.map((v) => `<button type="button" data-tk="speed" data-v="${v}" aria-pressed="${s.speed === v}">${label(v)}</button>`).join("")}</div>
      <div class="tk-read"><b>Tick ${s.paused ? s.tick : "–"}<small>/${TICKS}</small></b><span>${list.length} moving part${list.length === 1 ? "" : "s"}</span><em>${s.paused ? "Paused" : "Playing"}</em></div>
      <div class="tk-track"><i style="width:${s.paused ? (s.tick / TICKS) * 100 : 0}%"></i>${Array.from({ length: TICKS + 1 }, (_, i) => `<button type="button" data-tk="seek" data-i="${i}" class="${s.paused && i <= s.tick ? "is-past" : ""}" style="left:${(i / TICKS) * 100}%" aria-label="Go to tick ${i}"></button>`).join("")}</div>
      <p class="tk-moving">${moving.length ? `Moving: ${esc(moving.join(" · "))}` : "Nothing moving here"}</p>
      <div class="tk-ctl"><button type="button" data-tk="back">◀ Tick</button><button type="button" class="is-primary" data-tk="${s.paused ? "play" : "pause"}">${s.paused ? "Play" : "Pause"}</button><button type="button" data-tk="fwd">Tick ▶</button><button type="button" data-tk="zero">Tick 0</button></div>`;
  }
  Ticker.mount = () => {
    panel = document.createElement("section");
    panel.setAttribute("aria-label", "Animation ticker");
    document.body.append(panel);
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tk]");
      if (!b) return;
      const a = b.dataset.tk;
      if (a === "open") Ticker.setOpen(true); else if (a === "close") Ticker.setOpen(false);
      else if (a === "speed") Ticker.setSpeed(Number(b.dataset.v)); else if (a === "seek") Ticker.seek(Number(b.dataset.i));
      else if (a === "back") Ticker.seek(s.tick - 1); else if (a === "fwd") Ticker.seek(s.tick + 1); else if (a === "zero") Ticker.seek(0);
      else if (a === "play") Ticker.play(); else if (a === "pause") Ticker.pause();
    });
    render();
  };
})();
