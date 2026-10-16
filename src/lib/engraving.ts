// Engraved scenes in pen-and-ink: aurora curtains over stacked alpine ranges. "night" is cream
// scratchboard under the footer; "dawn" is a backlit ink range on the dawn band. Pure (no DOM), so
// `bun src/lib/engraving.check.ts` can import it; Engraving.astro owns the canvas. Every primitive
// carries a reveal time T in [0, 1], so the ink spreads out from the summits with a ragged edge and
// then the aurora rises. A fixed seed keeps the scene identical on every load and every page.
//
// Scene units: u = (x − W/2) / H across, v = y / H down. A wider screen shows more of the same
// panorama (cover crop), and spacings stay in CSS px so line density never changes with size.

export type Scene = "night" | "dawn";

/** One draw call: primitives sharing a style, sorted by T. Stride 5: lines [T, x0, y0, x1, y1],
 *  dots [T, cx, cy, w, h]. `layer` is the range index (back to front), −1 for the aurora. */
export type Bucket = { color: string; alpha: number; width: number; dot: boolean; layer: number; prims: Float32Array };

export type Built = {
  w: number;
  h: number;
  buckets: Bucket[];
  /** Topmost ridge per CSS px column. Night fills under it so the stars behind are hidden. */
  sky: Float32Array;
  /** Per range (back to front): the ridge of the ranges in front of it per column, Infinity if none. */
  occ: Float32Array[];
  fill: boolean;
};

// ── Tune here ─────────────────────────────────────────────────────────────────────────────────
// Ranges, back to front. base/summit are v of the range floor and of its tallest possible peak;
// gap is the hatch spacing (px), wmax the widest line (px). Peak spacing and flank widths are in
// heights (u). crest = [wavelength u, depth]: ridged noise carves each tent into a jagged massif.
// mist = depth below the ridge (in range heights) over which hatching fades out.
type Range = {
  base: number; summit: number; gap: number; wmax: number; alpha: number; dot: number;
  space: [number, number]; flank: [number, number]; crest: [number, number]; mist: [number, number];
  contour: number; anchor?: number; clear?: number; ledges?: boolean;
};
const RANGES: Record<Scene, Range[]> = {
  night: [
    { base: 0.8, summit: 0.45, gap: 3.6, wmax: 0.6, alpha: 0.4, dot: 0.7, space: [0.45, 0.85], flank: [0.4, 0.9], crest: [0.3, 0.45], mist: [0.15, 0.55], contour: 0.6 },
    { base: 0.92, summit: 0.54, gap: 2.9, wmax: 0.9, alpha: 0.62, dot: 0.85, space: [0.6, 1.1], flank: [0.5, 1.1], crest: [0.25, 0.5], mist: [0.2, 0.65], contour: 0.9 },
    // The tallest near summit sits at u = −0.3, so a 390 px phone still sees it.
    { base: 1.08, summit: 0.63, gap: 2.3, wmax: 1.25, alpha: 0.92, dot: 1, space: [0.7, 1.2], flank: [0.6, 1.3], crest: [0.22, 0.55], mist: [0.45, 1.1], contour: 1.3, anchor: -0.3, ledges: true },
  ],
  dawn: [
    { base: 0.88, summit: 0.36, gap: 3.0, wmax: 0.7, alpha: 0.5, dot: 0.75, space: [0.3, 0.6], flank: [0.4, 0.9], crest: [0.3, 0.45], mist: [0.3, 0.9], contour: 0.7 },
    // A clear col in the middle (|u| < 0.5) where the sun glow rises.
    { base: 0.98, summit: 0.36, gap: 2.4, wmax: 1.1, alpha: 0.85, dot: 0.9, space: [0.4, 0.8], flank: [0.55, 1.2], crest: [0.24, 0.5], mist: [0.5, 1.2], contour: 1.1, clear: 0.5, ledges: true },
  ],
};
// Aurora (night only): ribbons with a base curve of two sines; rays of stipple rise from a sharp hem.
// ray = curtain height (H); step = column spacing, pitch = dot spacing up the ray (px).
const RIBBONS = [
  { v0: 0.5, a1: 0.11, l1: 1.5, a2: 0.035, l2: 0.42, span: [-1.8, 1.4], ray: 0.5, step: 1.8, pitch: 1.4, alpha: 0.8, dot: 0.8 },
  { v0: 0.42, a1: 0.08, l1: 1.9, a2: 0.03, l2: 0.55, span: [-0.6, 2.4], ray: 0.4, step: 2.2, pitch: 1.7, alpha: 0.55, dot: 0.8 },
  { v0: 0.34, a1: 0.06, l1: 2.4, a2: 0.02, l2: 0.7, span: [-2.6, 0.2], ray: 0.3, step: 2.8, pitch: 2.0, alpha: 0.35, dot: 0.75 },
];
const INK: Record<Scene, string> = { night: "rgb(243,239,230)", dawn: "rgb(30,31,52)" }; // wordmark cream; dusk indigo
const SPREAD = 0.8; // heights: how far ink runs from a summit by T = 0.75
const SPAN = 8; // peaks are laid out to ±SPAN heights, wider than any screen
const SEED = 1931;

// ── Noise ─────────────────────────────────────────────────────────────────────────────────────
const hash = (i: number, j: number, s: number) => {
  let h = Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul(j | 0, 0x165667b1) ^ Math.imul((s + SEED) | 0, 0x2545f491);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const fade = (f: number) => f * f * (3 - 2 * f);
const noise1 = (t: number, s: number) => {
  const i = Math.floor(t);
  const a = hash(i, 0, s);
  return a + (hash(i + 1, 0, s) - a) * fade(t - i);
};
const noise2 = (x: number, y: number, s: number) => {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = fade(x - i), fy = fade(y - j);
  const a = hash(i, j, s), b = hash(i + 1, j, s), c = hash(i, j + 1, s), d = hash(i + 1, j + 1, s);
  return a + (b - a) * fx + (c - a + (a - b + d - c) * fx) * fy;
};
const ridged = (t: number, s: number, octaves = 4) => {
  let acc = 0, norm = 0;
  for (let o = 0, amp = 1, f = 1; o < octaves; o++, amp /= 2, f *= 2) {
    acc += amp * (1 - Math.abs(2 * noise1(t * f, s + o) - 1));
    norm += amp;
  }
  return acc / norm;
};
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (a: number, b: number, x: number) => fade(clamp01((x - a) / (b - a)));

type Peak = { u: number; h: number; wl: number; wr: number; main: boolean };

// Main peaks walk out both ways from the anchor; tall ones get a shoulder or two (false summits).
function layoutPeaks(R: Range, li: number): Peak[] {
  const out: Peak[] = [];
  const at = (u: number, k: number) => {
    if (R.clear && Math.abs(u) < R.clear) return;
    const lerp = ([a, b]: [number, number], r: number) => a + (b - a) * r;
    const h = R.anchor !== undefined && k === 0 ? 1 : 0.35 + 0.6 * hash(k, li, 1) ** 1.5; // a few tall, many small
    const p = { u, h, wl: lerp(R.flank, hash(k, li, 2)), wr: lerp(R.flank, hash(k, li, 3)), main: true };
    out.push(p);
    if (h < 0.6) return;
    for (let s = 0, n = hash(k, li, 4) < 0.5 ? 1 : 2; s < n; s++) {
      const side = hash(k, li, 5 + s) < 0.5 ? -1 : 1;
      const w = side < 0 ? p.wl : p.wr;
      out.push({
        u: u + side * (0.45 + 0.25 * hash(k, li, 7 + s)) * w,
        h: (0.3 + 0.2 * hash(k, li, 9 + s)) * h,
        wl: 0.5 * w, wr: 0.5 * w, main: false,
      });
    }
  };
  const step = (k: number) => R.space[0] + (R.space[1] - R.space[0]) * hash(k, li, 0);
  const anchor = R.anchor ?? 0;
  at(anchor, 0);
  for (let u = anchor, k = 1; u < SPAN; k++) at((u += step(k)), k);
  for (let u = anchor, k = -1; u > -SPAN; k--) at((u -= step(k)), k);
  return out;
}

export function build(scene: Scene, w: number, h: number): Built {
  const W = Math.max(1, Math.round(w)), H = Math.max(1, Math.round(h));
  const ranges = RANGES[scene];
  const night = scene === "night";
  const ink = INK[scene];
  // ponytail: one density knob for big canvases (a 2560 footer stays ≈40k primitives, like 1440);
  // per-scene budgets if a bigger panel ever needs finer lines.
  const dens = W * H > 0.8e6 ? Math.sqrt((W * H) / 0.8e6) : 1;
  const col = (x: number) => (x < 0 ? 0 : x > W ? W : Math.round(x));
  let seq = 0;
  const rnd = () => hash(seq++, 911, 5);

  // Ridges, slopes, occluders.
  const peaks = ranges.map(layoutPeaks);
  const ridges = ranges.map((R, li) => {
    const r = new Float32Array(W + 1);
    const HL = R.base - R.summit;
    for (let x = 0; x <= W; x++) {
      const u = (x - W / 2) / H;
      let tent = 0;
      for (const p of peaks[li]) {
        const a = Math.abs(u - p.u) / (u < p.u ? p.wl : p.wr);
        if (a < 1) tent = Math.max(tent, p.h * (1 - a) ** 1.25);
      }
      r[x] = (R.base - HL * tent * (1 - R.crest[1] * (1 - ridged(u / R.crest[0], 20 + li, 5) ** 1.5))) * H;
      if (R.ledges) r[x] += 1.2 * (noise1((x - W / 2) / 5, 30 + li) - 0.5) * 2;
    }
    return r;
  });
  const slope = (r: Float32Array, k: number) => {
    const s = new Float32Array(W + 1);
    for (let x = 0; x <= W; x++) s[x] = (r[col(x + k)] - r[col(x - k)]) / (col(x + k) - col(x - k) || 1);
    return s;
  };
  const occ = ranges.map((_, li) => {
    const o = new Float32Array(W + 1).fill(Infinity);
    for (let j = li + 1; j < ranges.length; j++) for (let x = 0; x <= W; x++) o[x] = Math.min(o[x], ridges[j][x]);
    return o;
  });
  const sky = new Float32Array(W + 1).fill(Infinity);
  for (const r of ridges) for (let x = 0; x <= W; x++) sky[x] = Math.min(sky[x], r[x]);

  // Summits: visible ridge points that are the highest within ±0.18 H and stand clear of the floor.
  const tops = ranges.map((R, li) => {
    const r = ridges[li], win = Math.round(0.18 * H), out: number[] = [];
    for (let x = 0; x <= W; x++) {
      if (r[x] > (R.base - 0.3 * (R.base - R.summit)) * H || r[x] >= occ[li][x]) continue;
      let top = true;
      for (let k = Math.max(0, x - win); k <= Math.min(W, x + win) && top; k++) top = r[k] > r[x] || (r[k] === r[x] && k >= x);
      if (top) out.push(x);
    }
    return out;
  });
  // Reveal seeds: the summits of the two front ranges; the front one inks first.
  const seeds: [number, number, number][] = [];
  for (let li = ranges.length - 2; li < ranges.length; li++) {
    for (const x of tops[li]) seeds.push([x, ridges[li][x], li === ranges.length - 1 ? 0 : 0.04]);
  }
  const jitter = (x: number, y: number) => 0.14 * (noise2(x / 22, y / 22, 40) - 0.5) + 0.04 * (rnd() - 0.5);
  const inkT = (x: number, y: number) => {
    let best = Infinity;
    for (const [sx, sy, d] of seeds) best = Math.min(best, d + Math.hypot(x - sx, 0.8 * (y - sy)) / (SPREAD * H));
    return clamp01(0.75 * Math.min(1, best) + jitter(x, y));
  };

  const groups = new Map<string, { b: Omit<Bucket, "prims">; arr: number[] }>();
  const put = (key: string, b: Omit<Bucket, "prims">, T: number, a: number, c: number, d: number, e: number) => {
    let g = groups.get(key);
    if (!g) groups.set(key, (g = { b, arr: [] }));
    g.arr.push(T, a, c, d, e);
  };

  ranges.forEach((R, li) => {
    const r = ridges[li], o = occ[li];
    const HL = (R.base - R.summit) * H;
    const sl4 = slope(r, 4), sl10 = slope(r, 10);
    const line = (bi: number, T: number, x0: number, y0: number, x1: number, y1: number) =>
      put(`h${li}.${bi}`, { color: ink, alpha: R.alpha, width: R.wmax * [0, 0.35, 0.6, 0.85, 1][bi], dot: false, layer: li }, T, x0, y0, x1, y1);
    const dawnFade = (y: number) => (night ? 1 : 1 - smooth(0.7 * H, 0.98 * H, y));
    const mist = (d: number) => 1 - smooth(R.mist[0] * HL, R.mist[1] * HL, d);
    const snowY = (q: number) => R.summit * H + 0.28 * HL + 6 * (noise1((q - W / 2) / 60, 50 + li) - 0.5) * 2;
    // Brightness with light from the upper left: the flank's slope, then spurs and gullies running
    // down the face (a vertically stretched noise surface; its rise to the right faces the light).
    const lightAt = (q: number) => 0.5 - 0.5 * Math.tanh(2.2 * sl4[col(q)]);
    const spur = (x: number, y: number) => {
      const a = (x - W / 2) / 24, b = y / 80;
      return 2.1 * (noise2(a + 1 / 12, b, 95 + li) - noise2(a - 1 / 12, b, 95 + li));
    };
    // Ink coverage: night is scratchboard (cream on lit faces and snow); dawn is backlit (dense ink).
    const tone = (B: number, snow: boolean) =>
      night ? (snow ? 0.55 + 0.45 * B : 0.06 + 0.94 * B ** 1.4) : snow ? 0.25 + 0.35 * (1 - B) : 0.55 + 0.4 * (1 - B);
    const bucketOf = (k: number) => (k < 0.14 ? 0 : k < 0.32 ? 1 : k < 0.55 ? 2 : k < 0.78 ? 3 : 4);

    // Hatching: one line every gap px, from the ridge down the fall line, 4 px segments.
    const gap = R.gap * dens;
    for (let i = Math.ceil(-W / 2 / gap) - 1; i <= W / 2 / gap + 1; i++) {
      const q = W / 2 + gap * (i + 0.3 * (hash(i, li, 70) - 0.5));
      if (q < 0 || q > W) continue;
      const top = r[col(q)] + 0.5;
      if (top >= Math.min(H, o[col(q)])) continue;
      const tau = (((i * 0.618) % 1) + 1) % 1; // anti-banding: lines don't all change width at one depth
      // Down the fall line, but never steeper than the flank itself or the line would leave the rock.
      const s10 = sl10[col(q)];
      const lean0 = Math.sign(s10) * Math.min(0.4 * Math.tanh(1.2 * Math.abs(s10)), 0.8 / (Math.abs(s10) + 1e-3));
      const B0 = lightAt(q);
      const sy = snowY(q);
      const seg: number[] = [];
      for (let x = q, y = top; ; ) {
        const d = y - top;
        if (d > R.mist[1] * HL) break;
        // Lines drift downhill across the face, so they gather into gullies and part around spurs.
        let nx = x + (lean0 - 0.5 * spur(x, y + 2) + 0.2 * (noise2((q - W / 2) / 28, d / 36, 80 + li) - 0.5)) * 4;
        const ny = y + 4;
        if (ny < r[col(nx)] + 0.5) nx = x;
        if (ny > H + 2 || nx < 0 || nx > W || ny > o[col(nx)]) break;
        const mx = (x + nx) / 2, my = (y + ny) / 2;
        // Rock facets: broad light and dark patches plus finer strata that break the lines.
        let B = B0 + 0.5 * Math.tanh(2.5 * spur(mx, my)) + 0.3 * (noise2((mx - W / 2) / 26, my / 14, 85 + li) - 0.5) + 0.2 * (noise2((mx - W / 2) / 9, my / 5, 87 + li) - 0.5);
        if (R.ledges && noise2((q - W / 2) / 50, (my - top) / 7, 90 + li) > 0.78) B -= 0.35;
        const k = tone(clamp01(B), my < sy) * mist(my - top) * dawnFade(my) + (tau - 0.5) * 0.1;
        seg.push(x, y, nx, ny, k);
        x = nx;
        y = ny;
      }
      const n = seg.length / 5;
      for (let j = 0; j < n; j++) {
        const x0 = seg[j * 5], y0 = seg[j * 5 + 1], x1 = seg[j * 5 + 2], y1 = seg[j * 5 + 3], k = seg[j * 5 + 4];
        const bi = bucketOf(k) - (j >= 0.8 * n ? 1 : 0); // burin exit: the tail thins
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        if (bi > 0) line(bi, inkT(mx, my), x0, y0, x1, y1);
        else if (k > 0.04 && k < 0.14 && j % 2 && rnd() < (k - 0.04) * 4) {
          // Lines dissolve into stipple at the lightest tones.
          put(`s${li}`, { color: ink, alpha: R.alpha, width: 0, dot: true, layer: li }, inkT(mx, my), mx, my, R.dot, R.dot);
        }
      }
    }

    // Crosshatch (dawn only): a second family 35° down-right where the ink is darkest.
    if (!night) {
      const tan = Math.tan((35 * Math.PI) / 180), cos = Math.cos((35 * Math.PI) / 180);
      const yTop = R.summit * H, yBot = Math.min(H, R.base * H + 4);
      const dx = 4 * cos, dy = 4 * Math.sin((35 * Math.PI) / 180);
      for (let c = yTop - W * tan; c < yBot; c += (3 * dens) / cos) {
        for (let x = Math.max(0, (yTop - c) / tan); x + dx <= W && c + x * tan < yBot; x += dx) {
          const y = c + x * tan, mx = x + dx / 2, my = y + dy / 2;
          const rx = r[col(mx)];
          if (my <= rx + 1 || y + dy >= o[col(x + dx)] || y >= o[col(x)]) continue;
          const k = tone(clamp01(lightAt(mx) + 0.5 * Math.tanh(2.5 * spur(mx, my))), my < snowY(mx)) * mist(my - rx) * dawnFade(my);
          if (k > 0.72) put(`x${li}`, { color: ink, alpha: R.alpha, width: 0.45 * R.wmax, dot: false, layer: li }, inkT(mx, my), x, y, x + dx, y + dy);
        }
      }
    }

    // Contour: a crisp line along the visible ridge (the far range drops a fifth of it).
    for (let x = 0; x < W; x += 3) {
      const x2 = Math.min(W, x + 3);
      if (r[x] > Math.min(H, o[x] - 0.5) || r[x2] > Math.min(H, o[x2] - 0.5) || dawnFade(r[x]) < 0.3 || (li === 0 && ranges.length > 2 && rnd() < 0.2)) continue;
      put(`c${li}`, { color: ink, alpha: Math.min(1, R.alpha + 0.05), width: R.contour, dot: false, layer: li }, inkT(x, r[x]), x, r[x], x2, r[x2]);
    }

    // Arêtes: a tapered edge down from each summit, toward its gentler flank. This is what turns a
    // 1D ridge into rock with a lit side and a shadow side.
    for (const sx of tops[li]) {
      const dl = r[col(sx - 0.12 * H)] - r[sx], dr = r[col(sx + 0.12 * H)] - r[sx];
      const lean = (0.6 * (dl - dr)) / (dl + dr || 1);
      const len = Math.min(0.5 * HL, Math.max(0.2 * HL, 0.5 * (dl + dr)));
      for (let x = sx, y = r[sx], d = 0; d < len; d += 4) {
        const nx = x + (lean + 0.5 * (noise1(y / 18, 100 + li) - 0.5)) * 4, ny = y + 4;
        if (nx < 0 || nx > W || ny > o[col(nx)] || y > o[col(x)]) break;
        const f = d / len;
        const width = R.contour * (f < 0.4 ? 0.75 : f < 0.7 ? 0.5 : 0.3);
        put(`a${li}.${width}`, { color: ink, alpha: R.alpha, width, dot: false, layer: li }, inkT(nx, ny), x, y, nx, ny);
        x = nx;
        y = ny;
      }
    }
  });

  // Aurora: vertical stipple curtains behind every range.
  if (night) {
    RIBBONS.forEach((A, ri) => {
      const step = A.step * dens;
      const phi1 = 6.283 * hash(ri, 0, 110), phi2 = 6.283 * hash(ri, 1, 110);
      const [u0, u1] = A.span, umid = (u0 + u1) / 2, half = (u1 - u0) / 2;
      for (let i = Math.ceil(-W / 2 / step); i <= W / 2 / step; i++) {
        const xc = W / 2 + i * step, u = (xc - W / 2) / H, xr = xc - W / 2;
        if (u < u0 || u > u1) continue;
        const t = (u - u0) / (u1 - u0);
        const a1 = (6.283 * u) / A.l1 + phi1, a2 = (6.283 * u) / A.l2 + phi2;
        const yb = (A.v0 + A.a1 * Math.sin(a1) + A.a2 * Math.sin(a2) + 0.03 * (noise1(xr / 30, 170 + ri) - 0.5)) * H;
        const fold = Math.abs((6.283 * A.a1 * Math.cos(a1)) / A.l1 + (6.283 * A.a2 * Math.cos(a2)) / A.l2);
        const I = smooth(0, 0.12, t) * smooth(0, 0.12, 1 - t)
          * (0.3 + 0.7 * noise1(xr / 45, 120 + ri)) // bands
          * (0.1 + 0.9 * noise1(xr / 5, 130 + ri) ** 2.2) // rays, two or three columns wide
          * (1 + 0.7 * Math.min(1, 3 * fold)); // folds seen edge-on glow brighter
        const L = A.ray * H * (0.25 + 0.75 * noise1(xr / 16, 140 + ri)) * (0.75 + 0.25 * hash(i, ri, 150));
        for (let s = -8 + A.pitch * hash(i, ri, 160); s < L; s += A.pitch) {
          const y = yb - s;
          if (y < 0) break;
          const x = xc + 0.6 * (rnd() - 0.5);
          if (y > sky[col(x)] - 1.5) continue;
          if (rnd() >= Math.min(1, 1.4 * I) * (s < 0 ? Math.exp(s / 2.5) : (1 - s / L) ** 1.4)) continue;
          const hem = s >= 0 && s < 6; // the sharp lower hem, in short vertical dashes
          const T = clamp01(0.35 + 0.65 * clamp01((0.25 * Math.abs(u - umid)) / half + (0.75 * Math.max(0, s)) / L) + jitter(x, y));
          put(`r${ri}`, { color: ink, alpha: A.alpha, width: 0, dot: true, layer: -1 }, T, x, y, hem ? 0.9 : A.dot, hem ? 3 + 2 * rnd() : A.dot);
        }
      }
    });
  }

  const buckets: Bucket[] = [];
  for (const { b, arr } of groups.values()) {
    const n = arr.length / 5;
    const order = Array.from({ length: n }, (_, i) => i).sort((a, c) => arr[a * 5] - arr[c * 5]);
    const prims = new Float32Array(arr.length);
    order.forEach((src, dst) => {
      for (let k = 0; k < 5; k++) prims[dst * 5 + k] = arr[src * 5 + k];
    });
    buckets.push({ ...b, prims });
  }
  return { w: W, h: H, buckets, sky, occ, fill: night };
}

/** Draws every primitive with from < T ≤ to: one path per bucket, about 20 calls a frame. */
export function draw(ctx: CanvasRenderingContext2D, built: Built, from: number, to: number): void {
  for (const k of built.buckets) {
    const P = k.prims, n = P.length / 5;
    let lo = 0, hi = n; // first primitive with T > from
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (P[mid * 5] > from) hi = mid;
      else lo = mid + 1;
    }
    if (lo >= n || P[lo * 5] > to) continue;
    ctx.globalAlpha = k.alpha;
    ctx.beginPath();
    for (let i = lo; i < n && P[i * 5] <= to; i++) {
      const o = i * 5;
      if (k.dot) ctx.rect(P[o + 1] - P[o + 3] / 2, P[o + 2] - P[o + 4] / 2, P[o + 3], P[o + 4]);
      else {
        ctx.moveTo(P[o + 1], P[o + 2]);
        ctx.lineTo(P[o + 3], P[o + 4]);
      }
    }
    if (k.dot) {
      ctx.fillStyle = k.color;
      ctx.fill();
    } else {
      ctx.strokeStyle = k.color;
      ctx.lineWidth = k.width;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
