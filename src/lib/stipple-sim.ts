/**
 * Locked Reach stipple engine — copy into src/lib/stipple-sim.ts.
 * Defaults, draw, and physics must stay as-is unless the user asks to retune.
 * Point cloud: { w, h, pts: [nx, ny, size, side][] }  side 0 = leftColor, 1 = rightColor.
 */
export type Point = [nx: number, ny: number, size: number, side: number];

export type StipplePayload = {
  w: number;
  h: number;
  pts: Point[];
};

export type StippleParams = {
  brushRadius: number;
  impulse: number;
  radialBoost: number;
  falloff: number;
  springMul: number;
  homeDamp: number;
  scatterDamp: number;
  heatOnHit: number;
  heatDecay: number;
  dotScale: number;
  leftColor: string;
  rightColor: string;
};

export const DEFAULT_PARAMS: StippleParams = {
  brushRadius: 0.018,
  impulse: 0.12,
  radialBoost: 0.3,
  falloff: 1.2,
  springMul: 1,
  homeDamp: 0.988,
  scatterDamp: 0.9,
  heatOnHit: 0.7,
  heatDecay: 0.06,
  dotScale: 1,
  leftColor: "#fe750e",
  rightColor: "#e8e8eb",
};

export type StippleStats = {
  active: number;
  points: number;
};

function hash01(n: number): number {
  const t = 43758.5453 * Math.sin(12.9898 * n);
  return t - Math.floor(t);
}

/** 1 = on the true silhouette (touches the outside), 0 = interior. */
function computeOutline(pts: Point[], _aspect: number): Float32Array {
  const n = pts.length;
  const cell = 0.012;
  const gxCount = Math.ceil(1 / cell) + 6;
  const gyCount = Math.ceil(1 / cell) + 6;
  const stride = gxCount;
  const at = (gx: number, gy: number) => gy * stride + gx;
  const toCell = (x: number, y: number) => [
    Math.floor(x / cell) + 3,
    Math.floor(y / cell) + 3,
  ] as const;

  const occ0 = new Uint8Array(gxCount * gyCount);
  const occ1 = new Uint8Array(gxCount * gyCount);
  for (let i = 0; i < n; i++) {
    const [gx, gy] = toCell(pts[i][0], pts[i][1]);
    if (gx < 0 || gy < 0 || gx >= gxCount || gy >= gyCount) continue;
    if (pts[i][3] === 0) occ0[at(gx, gy)] = 1;
    else occ1[at(gx, gy)] = 1;
  }

  const floodOutside = (occ: Uint8Array) => {
    const outside = new Uint8Array(occ.length);
    const q = new Int32Array(occ.length);
    let head = 0;
    let tail = 0;
    const push = (i: number) => {
      if (outside[i] || occ[i]) return;
      outside[i] = 1;
      q[tail++] = i;
    };
    for (let x = 0; x < gxCount; x++) {
      push(at(x, 0));
      push(at(x, gyCount - 1));
    }
    for (let y = 0; y < gyCount; y++) {
      push(at(0, y));
      push(at(gxCount - 1, y));
    }
    while (head < tail) {
      const i = q[head++];
      const x = i % stride;
      const y = (i / stride) | 0;
      if (x > 0) push(i - 1);
      if (x + 1 < gxCount) push(i + 1);
      if (y > 0) push(i - stride);
      if (y + 1 < gyCount) push(i + stride);
    }
    return outside;
  };

  const out0 = floodOutside(occ0);
  const out1 = floodOutside(occ1);
  const edge = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [gx, gy] = toCell(pts[i][0], pts[i][1]);
    const outside = pts[i][3] === 0 ? out0 : out1;
    let nOut = 0;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        if (ox === 0 && oy === 0) continue;
        const x = gx + ox;
        const y = gy + oy;
        if (x < 0 || y < 0 || x >= gxCount || y >= gyCount) {
          nOut += 1;
          continue;
        }
        if (outside[at(x, y)]) nOut += 1;
      }
    }
    edge[i] = nOut / 8;
  }
  return edge;
}

export function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.padEnd(6, "0").slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [254, 117, 14];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

type Pointer = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  on: boolean;
};

export class StippleSim {
  readonly pts: Point[];
  readonly count: number;
  aspect: number;
  params: StippleParams;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  reducedMotion: boolean;

  private width = 0;
  private height = 0;
  private brushPx = 0;
  private ox: Float32Array;
  private oy: Float32Array;
  private vx: Float32Array;
  private vy: Float32Array;
  private scatter: Float32Array;
  private heat: Float32Array;
  private mass: Float32Array;
  private spring: Float32Array;
  private introDelay: Float32Array;
  private edge: Float32Array;
  private pointer: Pointer = {
    x: -9999,
    y: -9999,
    px: -9999,
    py: -9999,
    vx: 0,
    vy: 0,
    on: false,
  };
  private trail: number[] = [];
  private raf = 0;
  private intro = true;
  private introStart = 0;
  private running = false;
  private leftRgb: [number, number, number] = [254, 117, 14];
  private rightRgb: [number, number, number] = [232, 232, 235];
  private onStats: ((stats: StippleStats) => void) | null = null;
  active = 0;

  constructor(opts: {
    canvas: HTMLCanvasElement;
    pts: Point[];
    aspect: number;
    params: StippleParams;
    reducedMotion: boolean;
    onStats?: (stats: StippleStats) => void;
  }) {
    this.canvas = opts.canvas;
    const ctx = opts.canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("2d canvas unavailable");
    this.ctx = ctx;
    this.pts = opts.pts;
    this.count = opts.pts.length;
    this.aspect = opts.aspect;
    this.params = opts.params;
    this.reducedMotion = opts.reducedMotion;
    this.onStats = opts.onStats ?? null;

    const n = this.count;
    this.ox = new Float32Array(n);
    this.oy = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.scatter = new Float32Array(n);
    this.heat = new Float32Array(n);
    this.mass = new Float32Array(n);
    this.spring = new Float32Array(n);
    this.introDelay = new Float32Array(n);
    this.edge = computeOutline(this.pts, this.aspect);

    for (let i = 0; i < n; i++) {
      this.mass[i] = 0.45 + 1.5 * hash01(3.1 * i);
      this.spring[i] = 0.0016 + 0.0016 * hash01(5.7 * i);
      const logit = Math.min(0.9999, Math.max(1e-4, hash01(6.1 * i)));
      const centered = Math.max(
        0,
        1 -
          Math.hypot(this.pts[i][0] - 0.5, (this.pts[i][1] - 0.5) * this.aspect) /
            0.42,
      );
      this.introDelay[i] = Math.max(
        0,
        460 + 150 * Math.log(logit / (1 - logit)) - centered * centered * 320,
      );
    }

    this.syncColors();
  }

  setParams(params: StippleParams) {
    this.params = params;
    this.syncColors();
    this.brushPx = this.params.brushRadius * this.width;
    if (!this.running) this.draw();
  }

  private syncColors() {
    this.leftRgb = hexToRgb(this.params.leftColor);
    this.rightRgb = hexToRgb(this.params.rightColor);
  }

  resize() {
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 2), 2);
    const cssW = Math.max(1, this.canvas.clientWidth);
    const cssH = Math.round(cssW * this.aspect);
    this.width = cssW;
    this.height = cssH;
    this.brushPx = this.params.brushRadius * cssW;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.draw();
  }

  start() {
    this.introStart = performance.now();
    this.intro = !this.reducedMotion;
    this.resize();
    this.draw();
    if (this.intro) this.ensureLoop();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  pointerMove(x: number, y: number) {
    if (this.reducedMotion) return;
    const ptr = this.pointer;
    const brush = this.brushPx || this.params.brushRadius * this.width;
    if (ptr.px > -9000) {
      const dx = x - ptr.px;
      const dy = y - ptr.py;
      const steps = Math.min(
        24,
        Math.ceil(Math.hypot(dx, dy) / Math.max(4, 0.5 * brush)),
      );
      for (let i = 1; i <= steps; i++) {
        this.trail.push(ptr.px + (dx * i) / steps, ptr.py + (dy * i) / steps);
      }
      ptr.vx = Math.max(-45, Math.min(45, dx));
      ptr.vy = Math.max(-45, Math.min(45, dy));
    } else {
      this.trail.push(x, y);
    }
    ptr.px = x;
    ptr.py = y;
    ptr.x = x;
    ptr.y = y;
    ptr.on = true;
    this.ensureLoop();
  }

  pointerLeave() {
    this.pointer.on = false;
    this.pointer.px = -9999;
    this.pointer.py = -9999;
    this.ensureLoop();
  }

  explode() {
    if (this.reducedMotion) return;
    const w = this.width || 800;
    for (let i = 0; i < this.count; i++) {
      const ang = hash01(i * 1.7 + 0.3) * Math.PI * 2;
      const spd = (6 + 16 * hash01(i * 4.1)) * (w / 800);
      this.vx[i] = Math.cos(ang) * spd;
      this.vy[i] = Math.sin(ang) * spd;
      this.scatter[i] = 8 + 10 * hash01(i * 9.3);
      this.heat[i] = this.params.heatOnHit;
    }
    this.ensureLoop();
  }

  reform() {
    this.ox.fill(0);
    this.oy.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.scatter.fill(0);
    this.heat.fill(0);
    this.trail.length = 0;
    this.active = 0;
    this.draw();
    this.onStats?.({ active: 0, points: this.count });
  }

  replayIntro() {
    this.reform();
    this.introStart = performance.now();
    this.intro = !this.reducedMotion;
    this.draw();
    if (this.intro) this.ensureLoop();
  }

  private ensureLoop() {
    if (this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = () => {
    this.raf = 0;
    const now = performance.now();
    if (this.intro && now - this.introStart >= 2000) this.intro = false;

    const moving = this.step();
    this.draw();
    this.onStats?.({ active: this.active, points: this.count });

    if (this.intro || moving) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.running = false;
      this.ox.fill(0);
      this.oy.fill(0);
      this.vx.fill(0);
      this.vy.fill(0);
      this.draw();
      this.onStats?.({ active: 0, points: this.count });
    }
  };

  private step(): boolean {
    const { width: w, height: h, count, params, pts } = this;
    const brushR = Math.max(1, params.brushRadius * w);
    const brushR2 = brushR * brushR;
    const samples =
      this.trail.length > 0
        ? this.trail.slice()
        : this.pointer.on
          ? [this.pointer.x, this.pointer.y]
          : [];
    this.trail.length = 0;

    const rest2 = (0.12 * w) ** 2;
    const pvx = this.pointer.vx;
    const pvy = this.pointer.vy;
    this.pointer.vx *= 0.5;
    this.pointer.vy *= 0.5;
    const speed = Math.hypot(pvx, pvy);

    let active = 0;
    for (let i = 0; i < count; i++) {
      if (speed > 0.4) {
        const px = pts[i][0] * w + this.ox[i];
        const py = pts[i][1] * h + this.oy[i];
        for (let s = 0; s < samples.length; s += 2) {
          const dx = px - samples[s];
          const dy = py - samples[s + 1];
          const d2 = dx * dx + dy * dy;
          if (d2 >= brushR2) continue;
          const dist = Math.sqrt(d2) || 0.001;
          const impulse =
            (params.impulse * Math.pow(1 - dist / brushR, params.falloff)) /
            this.mass[i];
          this.vx[i] += pvx * impulse + (dx / dist) * speed * impulse * params.radialBoost;
          this.vy[i] += pvy * impulse + (dy / dist) * speed * impulse * params.radialBoost;
          this.scatter[i] = 3 + 7 * hash01(9.3 * i);
          this.heat[i] = params.heatOnHit;
        }
      }

      if (this.scatter[i] > 0) {
        this.scatter[i] -= 1;
        this.vx[i] *= params.scatterDamp;
        this.vy[i] *= params.scatterDamp;
      } else {
        const pull =
          (this.spring[i] *
            params.springMul *
            (1 + Math.min((this.ox[i] * this.ox[i] + this.oy[i] * this.oy[i]) / rest2, 7))) /
          this.mass[i];
        this.vx[i] = (this.vx[i] - this.ox[i] * pull) * params.homeDamp;
        this.vy[i] = (this.vy[i] - this.oy[i] * pull) * params.homeDamp;
      }

      const prevX = this.ox[i];
      const prevY = this.oy[i];
      this.ox[i] += this.vx[i];
      this.oy[i] += this.vy[i];

      if (this.scatter[i] <= 0) {
        if (prevX * this.ox[i] < 0) {
          this.ox[i] = 0;
          this.vx[i] = 0;
        }
        if (prevY * this.oy[i] < 0) {
          this.oy[i] = 0;
          this.vy[i] = 0;
        }
      }

      if (this.heat[i] > 0) {
        this.heat[i] = Math.max(0, this.heat[i] - params.heatDecay);
      }

      if (
        this.scatter[i] > 0 ||
        this.heat[i] > 0 ||
        Math.abs(this.ox[i]) + Math.abs(this.oy[i]) > 0.35
      ) {
        active += 1;
      }
    }

    this.active = active;
    return active > 0 || speed > 0.4;
  }

  draw() {
    const { ctx, width: w, height: h, count, pts, params, intro } = this;
    ctx.fillStyle = "#0b0b0e";
    ctx.fillRect(0, 0, w, h);

    const fadeDist = 0.22 * w;
    const elapsed = intro ? performance.now() - this.introStart : Number.POSITIVE_INFINITY;
    const left = this.leftRgb;
    const right = this.rightRgb;
    const scale = params.dotScale;

    for (let i = 0; i < count; i++) {
      const appear = intro ? Math.min(1, (elapsed - this.introDelay[i]) / 190) : 1;
      if (appear <= 0) continue;

      const outline = this.edge[i];
      const heat = this.heat[i];
      const home = Math.max(0, 1 - Math.hypot(this.ox[i], this.oy[i]) / fadeDist);
      const atRest = home > 0.86 && heat < 0.06;

      const nx = pts[i][0];
      const ny = pts[i][1];
      const size = pts[i][2];
      const side = pts[i][3];
      const x = nx * w + this.ox[i];
      const y = ny * h + this.oy[i];
      const col = side === 0 ? left : right;

      const r = Math.round(8 + (col[0] - 8) * home + (255 - col[0]) * heat * 0.92);
      const g = Math.round(8 + (col[1] - 8) * home + (250 - col[1]) * heat * 0.92);
      const b = Math.round(10 + (col[2] - 10) * home + (245 - col[2]) * heat * 0.92);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.globalAlpha = appear * (atRest ? 1 : Math.min(1, 0.4 + 0.6 * home + 0.45 * heat));
      const edgeBoost = 0.62 + 0.55 * Math.max(outline, 0.15);
      const radius = Math.max(
        0.62,
        size * w * 1.15 * scale * edgeBoost * (1 - 0.2 * heat),
      );
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }
}
