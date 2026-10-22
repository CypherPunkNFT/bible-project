// The test page's background dust: slow floating motes over the dusk field (the owner's favourite background, from the
// David helix mock-up). The light is CSS (test-stage.css); this canvas draws only the dust. It stays
// still when the reader asks for less motion, and stops drawing while the page is hidden.
import { useEffect, useRef } from "react";

interface Mote { x: number; y: number; r: number; alpha: number; dx: number; dy: number; phase: number }

const makeMotes = (count: number): Mote[] => Array.from({ length: count }, () => ({
  x: Math.random(), y: Math.random(), r: 0.5 + Math.random() * 1.8, alpha: 0.12 + Math.random() * 0.4,
  dx: (Math.random() - 0.5) * 0.00006, dy: -0.00002 - Math.random() * 0.00006, phase: Math.random() * Math.PI * 2,
}));

export function DustField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motes = makeMotes(140);
    let frame = 0, width = 0, height = 0;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = width * ratio; canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      for (const m of motes) {
        if (!still) { m.x = (m.x + m.dx + 1) % 1; m.y = (m.y + m.dy + 1) % 1; }
        const twinkle = still ? 1 : 0.65 + 0.35 * Math.sin(time / 1400 + m.phase);
        // Warm motes toward the sunrise at the bottom right, cool ones toward the blue at the top left.
        const warmth = (m.x + m.y) / 2;
        context.fillStyle = `rgba(${Math.round(150 + 95 * warmth)}, ${Math.round(170 + 30 * warmth)}, ${Math.round(240 - 100 * warmth)}, ${m.alpha * twinkle})`;
        context.beginPath(); context.arc(m.x * width, m.y * height, m.r, 0, Math.PI * 2); context.fill();
      }
      if (!still && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); if (!document.hidden) frame = requestAnimationFrame(draw); };
    const observer = new ResizeObserver(() => { resize(); if (still) draw(0); });
    observer.observe(canvas);
    resize();
    frame = requestAnimationFrame(draw);
    document.addEventListener("visibilitychange", restart);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", restart); };
  }, []);
  return <canvas ref={canvasRef} className="tp-dust" aria-hidden />;
}
