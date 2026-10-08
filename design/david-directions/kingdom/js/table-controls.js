// How a hand moves the land table. Mouse: the wheel zooms (only while the pointer is over the table; elsewhere the page
// scrolls), left-drag moves, right-drag turns (yaw freely; pitch only between a near-top view and a moderate tilt),
// double-click recentres. Touch: one finger moves, two fingers pinch to zoom and twist to turn. The browser's context
// menu is kept off the table. A click that did not move picks the crystal under the pointer.
(() => {
  const R = Math.PI / 180;
  window.TableControls = (t) => {
    const cv = t.canvas;
    const pts = new Map();
    let drag = null, moved = false, glide = 0;
    const local = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const user = () => { cancelAnimationFrame(glide); t.onUserMove?.(); };

    function zoomAt(sx, sy, factor) {
      const before = t.unproject(sx, sy);
      t.cam.zoom = Math.max(0.3, Math.min(16, t.cam.zoom * factor));
      const after = t.unproject(sx, sy);
      t.cam.x += before[0] - after[0]; t.cam.y += before[1] - after[1];
      t.clampCam(); t.invalidate();
    }
    function panTo(start, cam0, sx, sy) {
      Object.assign(t.cam, { x: cam0.x, y: cam0.y });
      const now = t.unproject(sx, sy);
      t.cam.x = cam0.x + (start[0] - now[0]); t.cam.y = cam0.y + (start[1] - now[1]);
      t.clampCam(); t.invalidate();
    }

    const onWheel = (e) => {
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const [sx, sy] = local(e);
      zoomAt(sx, sy, Math.exp(-e.deltaY * unit * 0.0016));
      user();
    };
    const onDown = (e) => {
      if (e.pointerType === "touch") {
        pts.set(e.pointerId, local(e));
        cv.setPointerCapture(e.pointerId);
        startTouch();
        return;
      }
      if (e.button !== 0 && e.button !== 2) return;
      const [sx, sy] = local(e);
      drag = { mode: e.button === 2 ? "turn" : "move", sx, sy, start: t.unproject(sx, sy), cam0: { ...t.cam } };
      moved = false;
      cv.setPointerCapture(e.pointerId);
      t.host.classList.add(drag.mode === "turn" ? "is-turning" : "is-dragging");
    };
    const onMove = (e) => {
      if (e.pointerType === "touch") { if (pts.has(e.pointerId)) { pts.set(e.pointerId, local(e)); moveTouch(); } return; }
      const [sx, sy] = local(e);
      if (!drag) { const k = t.hitCrystal(sx, sy); cv.style.cursor = k ? "pointer" : ""; t.onHover?.(k, sx, sy); return; }
      const dx = sx - drag.sx, dy = sy - drag.sy;
      if (Math.hypot(dx, dy) > 4) moved = true;
      if (!moved) return;
      if (drag.mode === "move") panTo(drag.start, drag.cam0, sx, sy);
      else {
        t.cam.yaw = drag.cam0.yaw + dx * 0.006;
        t.cam.pitch = Math.max(t.PITCH[0], Math.min(t.PITCH[1], drag.cam0.pitch - dy * 0.0045));
        t.invalidate();
      }
      user();
    };
    const onUp = (e) => {
      if (e.pointerType === "touch") { endTouch(e); return; }
      if (!drag) return;
      const wasClick = !moved && drag.mode === "move";
      t.host.classList.remove("is-dragging", "is-turning");
      drag = null;
      if (wasClick) { const [sx, sy] = local(e); const k = t.hitCrystal(sx, sy); if (k) t.onCrystal?.(k); }
    };

    // ── Touch: one finger moves; two fingers pinch (zoom), twist (turn) and move together ──
    let touch = null;
    function startTouch() {
      const p = [...pts.values()];
      if (p.length === 1) touch = { n: 1, start: t.unproject(...p[0]), cam0: { ...t.cam }, at: p[0], moved: false };
      else if (p.length >= 2) { const [a, b] = p; touch = { n: 2, d: Math.hypot(b[0] - a[0], b[1] - a[1]), ang: Math.atan2(b[1] - a[1], b[0] - a[0]), mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], moved: true }; }
    }
    function moveTouch() {
      const p = [...pts.values()];
      if (!touch) return;
      if (touch.n === 1 && p.length === 1) {
        if (Math.hypot(p[0][0] - touch.at[0], p[0][1] - touch.at[1]) > 5) touch.moved = true;
        if (touch.moved) { panTo(touch.start, touch.cam0, ...p[0]); user(); }
      } else if (touch.n === 2 && p.length >= 2) {
        const [a, b] = p, d = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[1] - a[1], b[0] - a[0]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const before = t.unproject(...touch.mid), now = t.unproject(...mid);
        t.cam.x += before[0] - now[0]; t.cam.y += before[1] - now[1];
        let da = ang - touch.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        t.cam.yaw -= da;
        zoomAt(mid[0], mid[1], d / Math.max(1, touch.d));
        touch.d = d; touch.ang = ang; touch.mid = mid;
        user();
      }
    }
    function endTouch(e) {
      const wasTap = touch && touch.n === 1 && !touch.moved;
      const at = pts.get(e.pointerId);
      pts.delete(e.pointerId);
      if (wasTap && at) { const k = t.hitCrystal(...at); if (k) t.onCrystal?.(k); }
      startTouch();
      if (!pts.size) touch = null;
    }

    const onDbl = (e) => { e.preventDefault(); t.onRecentre?.(); };
    const onMenu = (e) => e.preventDefault();
    const onLeave = () => { if (!drag) { cv.style.cursor = ""; t.onHover?.(null); } };
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("dblclick", onDbl);
    cv.addEventListener("contextmenu", onMenu);
    t.host.addEventListener("contextmenu", onMenu);

    // An eased camera move (used by recentre and by the places that fly the land).
    function glideTo(to, ms = 650) {
      cancelAnimationFrame(glide);
      const from = { ...t.cam }, t0 = performance.now(), dur = reduced() ? 1 : ms;
      const step = (now) => { const k = easeInOut(clamp01((now - t0) / dur)); t.setCam(t.lerpCam(from, to, k)); if (k < 1) glide = requestAnimationFrame(step); };
      glide = requestAnimationFrame(step);
    }
    return {
      glideTo,
      destroy() { cancelAnimationFrame(glide); cv.removeEventListener("wheel", onWheel); t.host.removeEventListener("contextmenu", onMenu); },
      PITCH_DEG: [t.PITCH[0] / R, t.PITCH[1] / R],
    };
  };
})();
