// Hero starfield: stars fall toward the black-hole O and are drawn through a point lens,
// so they bunch into a bright ring around it and never show inside the shadow.
// Canvas2D on purpose: it runs without WebGPU, and ~1k stars cost well under 1ms a frame.

type Star = { x: number; y: number; vx: number; vy: number; m: number; c: string; lx?: number; ly?: number };

// Wordmark cream most of the time, with a few cyan and violet stars from the brand pair.
const TINTS = ["243,239,230", "243,239,230", "243,239,230", "243,239,230", "191,234,242", "214,203,255"];
const G = 2.6e5; // pull strength in CSS px³/s²
const SOFTEN = 400; // keeps the pull finite near the centre
const DRAG = 0.035; // slow orbital decay, so stars spiral in instead of orbiting forever

export function startStarfield(canvas: HTMLCanvasElement, well: HTMLElement, reduced: boolean): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const stars: Star[] = [];
  let w = 0, h = 0, cx = 0, cy = 0, E = 0;
  let raf = 0, last = 0, running = false, visible = true;

  const measure = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = canvas.getBoundingClientRect();
    const o = well.getBoundingClientRect();
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = o.left + o.width / 2 - box.left;
    cy = o.top + o.height / 2 - box.top;
    E = o.width * 0.62; // Einstein radius just outside the visible shadow
    const target = Math.round((w * h) / 1200);
    while (stars.length < target) stars.push(spawn({} as Star, false));
    stars.length = target;
  };

  function spawn(s: Star, edge: boolean): Star {
    const reach = Math.hypot(w, h) * 0.6;
    const r = edge ? reach * (0.8 + Math.random() * 0.4) : E + Math.random() * reach;
    const a = Math.random() * Math.PI * 2;
    s.x = cx + Math.cos(a) * r;
    s.y = cy + Math.sin(a) * r;
    // Mostly tangential (one shared direction, like a disk) and a bit short of orbital speed.
    const v = Math.sqrt(G / r) * (0.55 + Math.random() * 0.35);
    s.vx = -Math.sin(a) * v;
    s.vy = Math.cos(a) * v;
    s.m = Math.random() < 0.12 ? 1.6 : 0.8 + Math.random() * 0.5;
    s.c = TINTS[(Math.random() * TINTS.length) | 0];
    s.lx = s.ly = undefined;
    return s;
  }

  const draw = (dt: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      let dx = s.x - cx, dy = s.y - cy, r = Math.hypot(dx, dy) || 1;
      if (dt) {
        const a = G / (r * r + SOFTEN);
        s.vx = (s.vx - (dx / r) * a * dt) * (1 - DRAG * dt);
        s.vy = (s.vy - (dy / r) * a * dt) * (1 - DRAG * dt);
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        dx = s.x - cx;
        dy = s.y - cy;
        r = Math.hypot(dx, dy) || 1;
        if (r < E * 0.5) {
          spawn(s, true);
          continue;
        }
      }
      // Outer image of a point lens: always outside E, brighter the closer it sits to the ring.
      const t = (r + Math.sqrt(r * r + 4 * E * E)) / 2;
      const mu = Math.min(4, t ** 4 / (t ** 4 - E ** 4));
      const px = cx + (dx / r) * t;
      const py = cy + (dy / r) * t;
      const alpha = Math.min(1, 0.4 * s.m * mu);
      ctx.fillStyle = ctx.strokeStyle = `rgba(${s.c},${alpha})`;
      if (dt && s.lx !== undefined && Math.hypot(px - s.lx, py - s.ly!) < 40) {
        ctx.lineWidth = s.m;
        ctx.beginPath();
        ctx.moveTo(s.lx, s.ly!);
        ctx.lineTo(px, py);
        ctx.stroke();
      } else {
        ctx.fillRect(px, py, s.m, s.m);
      }
      s.lx = px;
      s.ly = py;
    }
  };

  const tick = (now: number) => {
    draw(last ? Math.min((now - last) / 1000, 0.05) : 0);
    last = now;
    raf = requestAnimationFrame(tick);
  };
  const reconcile = () => {
    const shouldRun = !reduced && visible && !document.hidden;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else cancelAnimationFrame(raf);
  };

  const remeasure = () => {
    measure();
    if (!running) draw(0);
  };
  const ro = new ResizeObserver(remeasure);
  ro.observe(canvas);
  ro.observe(well);
  document.fonts?.ready.then(remeasure); // the Futura swap moves the O
  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    reconcile();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", reconcile);

  measure();
  draw(0);
  reconcile();

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", reconcile);
  };
}
