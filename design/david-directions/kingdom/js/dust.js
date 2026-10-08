// The dust field behind the hero and the land (the helix's background, which the owner preferred to any grid): a
// near-black ground with a faint warm glow that turns blue halfway across, and slow floating circular dust, warm on
// the left and cool on the right. It loops for as long as it is on screen; with reduced motion it stands still.
(() => {
  window.Dust = {};
  Dust.mount = (canvas) => {
    const ctx = canvas.getContext("2d");
    const host = canvas.parentElement;
    let W = 0, H = 0, dpr = 1, parts = [], raf = 0, last = 0, visible = true, light = false;
    let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    function build() {
      const n = Math.round(Math.min(340, (W * H) / 7800));
      parts = Array.from({ length: n }, () => {
        const soft = rnd() < 0.16;
        return { x: rnd() * W, y: rnd() * H, r: soft ? 2.5 + rnd() * 6.5 : 0.45 + rnd() * 1.1, soft, a: soft ? 0.05 + rnd() * 0.08 : 0.18 + rnd() * 0.5,
          vy: -(2 + rnd() * 7), vx: (rnd() - 0.5) * 3, ph: rnd() * 6.28, tw: 0.4 + rnd() * 1.2 };
      });
    }
    function resize() {
      const r = host.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      light = document.documentElement.dataset.theme !== "dark";
      build(); frame(performance.now(), true);
    }
    // warm (left) to cool (right), turning about halfway
    const tone = (x) => {
      const k = Math.max(0, Math.min(1, (x / W - 0.38) / 0.3)), s = k * k * (3 - 2 * k);
      return light ? [150 - 60 * s, 118 - 22 * s, 70 + 50 * s] : [255 - 115 * s, 214 - 34 * s, 140 + 115 * s];
    };
    function frame(now, still = false) {
      const dt = still || !last ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const t = now / 1000;
      for (const p of parts) {
        p.y += p.vy * dt; p.x += (p.vx + Math.sin(t * 0.3 + p.ph) * 2) * dt;
        if (p.y < -12) { p.y = H + 10; p.x = rnd() * W; }
        if (p.x < -12) p.x = W + 10; else if (p.x > W + 12) p.x = -10;
        const [r, g, b] = tone(p.x), tw = 0.75 + 0.25 * Math.sin(t * p.tw + p.ph), a = p.a * tw * (light ? 0.75 : 1);
        if (p.soft) {
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          gr.addColorStop(0, `rgba(${r | 0},${g | 0},${b | 0},${a})`); gr.addColorStop(1, `rgba(${r | 0},${g | 0},${b | 0},0)`);
          ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        } else { ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    function loop(now) {
      raf = 0;
      if (!visible || document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) { last = 0; return; }
      frame(now);
      raf = requestAnimationFrame(loop);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    new ResizeObserver(resize).observe(host);
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(host);
    new MutationObserver(() => { light = document.documentElement.dataset.theme !== "dark"; frame(performance.now(), true); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", kick);
    resize(); kick();
  };
})();
