// The motion clock and its ticker. Each direction plays its main animation through Clock.run({ label, duration,
// frame(p), moving(p) }); the ticker (bottom left) slows it down, pauses it, steps it tick by tick (20 ticks) and scrubs it.
(() => {
  const TICKS = 20;
  const SPEEDS = [1, 0.25, 0.1];
  const s = { open: false, speed: 1, job: null, elapsed: 0, paused: false, held: false };
  let raf = 0, last = 0, panel = null;
  const progress = () => (s.job ? Math.min(1, s.elapsed / s.job.duration) : 0);

  function draw() {
    if (!s.job) return;
    const p = progress();
    try { s.job.frame(p); } catch (error) { console.error(`clock: frame failed for "${s.job.label}" at p=${p.toFixed(3)}`, error); s.job = null; }
    render();
  }
  function loop(now) {
    raf = 0;
    if (!s.job || s.paused) return;
    s.elapsed += (now - last) * s.speed;
    last = now;
    if (s.elapsed >= s.job.duration) { s.elapsed = s.job.duration; s.held = true; draw(); s.job.done?.(); return; }
    draw();
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && s.job && !s.paused && !s.held) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  const Clock = {
    TICKS,
    // Starts (or replaces) the main animation. Reduced motion jumps to the last frame.
    run(job) {
      s.job = job; s.elapsed = 0; s.held = false;
      s.paused = s.open && s.wasPausedOnOpen === true;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches && !s.open) { s.elapsed = job.duration; s.held = true; draw(); job.done?.(); return; }
      draw(); kick();
    },
    stop() { s.job = null; render(); },
    get active() { return !!s.job; },
    play() { if (!s.job) return; if (s.held) { s.elapsed = 0; s.held = false; } s.paused = false; kick(); render(); },
    pause() { s.paused = true; render(); },
    seekTick(i) { if (!s.job) return; s.paused = true; s.held = i >= TICKS; s.elapsed = (i / TICKS) * s.job.duration; draw(); },
    step(d) { const now = Math.round(progress() * TICKS); Clock.seekTick(Math.max(0, Math.min(TICKS, now + d))); },
    restart() { if (!s.job) return; s.elapsed = 0; s.held = false; s.paused = false; draw(); kick(); },
    finish() { if (!s.job) return; s.elapsed = s.job.duration; s.held = true; s.paused = true; draw(); s.job.done?.(); },
    setSpeed(v) { s.speed = v; render(); },
    setOpen(v) { s.open = v; s.speed = v ? 0.1 : 1; if (!v) { s.paused = false; kick(); } render(); },
  };
  window.Clock = Clock;

  const speedLabel = (v) => (v === 1 ? "Normal" : `${Math.round(1 / v)}× slower`);
  // The panel is built once when it opens; each frame only updates its readouts, so a button is never replaced
  // between a press and its release (which would swallow the click).
  let built = "";
  function render() {
    if (!panel) return;
    if (!s.open) { if (built !== "closed") { built = "closed"; panel.className = "ticker is-closed"; panel.innerHTML = `<button type="button" class="ticker-unfold" data-tk="open" title="Slow motion and tick-by-tick playback of this page's main animation">${icon("gauge", 15)}Ticker</button>`; } return; }
    if (built !== "open") {
      built = "open";
      panel.className = "ticker";
      panel.innerHTML = `
        <div class="tk-head"><strong>Ticker</strong><span data-r="label"></span><button type="button" data-tk="close" aria-label="Close the ticker (normal speed)">${icon("x", 14)}</button></div>
        <div class="tk-speed">${SPEEDS.map((v) => `<button type="button" data-tk="speed" data-v="${v}">${speedLabel(v)}</button>`).join("")}</div>
        <div class="tk-read"><b>Tick <span data-r="tick"></span><small>/${TICKS}</small></b><span data-r="ms"></span><em data-r="status"></em></div>
        <div class="tk-track"><i data-r="bar"></i>${Array.from({ length: TICKS + 1 }, (_, i) => `<button type="button" data-tk="seek" data-i="${i}" style="left:${(i / TICKS) * 100}%" aria-label="Go to tick ${i}"><span>${i}</span></button>`).join("")}</div>
        <p class="tk-moving" data-r="moving"></p>
        <div class="tk-ctl"><button type="button" data-tk="back" aria-label="Back one tick">${icon("skipBack", 14)}</button>
          <button type="button" class="is-primary" data-tk="play" data-r="play"></button>
          <button type="button" data-tk="fwd" aria-label="Forward one tick">${icon("skipForward", 14)}</button>
          <button type="button" data-tk="restart">${icon("replay", 14)}Restart</button><button type="button" data-tk="finish">Finish</button></div>`;
    }
    const p = progress(), tick = Math.floor(p * TICKS + 1e-6), running = s.job && !s.paused && !s.held;
    const status = !s.job ? "Waiting for an animation" : s.held ? "Held on the last frame" : s.paused ? "Paused" : "Playing";
    const moving = s.job?.moving ? s.job.moving(p) : [];
    const r = (k) => panel.querySelector(`[data-r="${k}"]`);
    r("label").textContent = s.job ? s.job.label : "";
    r("tick").textContent = String(tick);
    r("ms").textContent = s.job ? `${Math.round(s.elapsed)} of ${Math.round(s.job.duration)} ms` : "";
    r("status").textContent = status;
    r("bar").style.width = `${p * 100}%`;
    r("moving").textContent = s.job ? (moving.length ? `Moving now: ${moving.join(" · ")}` : "Nothing moving at this tick") : "Scroll, click or choose something to start one";
    panel.querySelectorAll('[data-tk="speed"]').forEach((b) => b.setAttribute("aria-pressed", String(s.speed === Number(b.dataset.v))));
    panel.querySelectorAll('[data-tk="seek"]').forEach((b) => b.classList.toggle("is-past", !!s.job && Number(b.dataset.i) <= tick));
    const play = r("play"), want = running ? "pause" : "play";
    const html = `${icon(running ? "pause" : "play", 14)}${running ? "Pause" : s.held ? "Replay" : "Play"}`;
    if (play.dataset.tk !== want || play.dataset.html !== html) { play.dataset.tk = want; play.dataset.html = html; play.innerHTML = html; }
  }
  Clock.mount = () => {
    panel = document.createElement("section");
    panel.setAttribute("aria-label", "Animation ticker");
    document.body.append(panel);
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tk]");
      if (!b) return;
      const a = b.dataset.tk;
      if (a === "open") Clock.setOpen(true); else if (a === "close") Clock.setOpen(false);
      else if (a === "speed") Clock.setSpeed(Number(b.dataset.v)); else if (a === "seek") Clock.seekTick(Number(b.dataset.i));
      else if (a === "back") Clock.step(-1); else if (a === "fwd") Clock.step(1);
      else if (a === "play") Clock.play(); else if (a === "pause") Clock.pause();
      else if (a === "restart") Clock.restart(); else if (a === "finish") Clock.finish();
    });
    render();
  };
})();
