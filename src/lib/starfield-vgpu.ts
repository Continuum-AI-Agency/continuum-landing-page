// Hero starfield on WebGPU (vgpu): the same pull-toward-the-O field as the
// Canvas2D version, but as zero-buffer instanced particles, plus sporadic
// shooting stars confined to the right side of the hero.
//
// One draw call renders up to MAX_STARS lensed stars; a second draw renders a
// handful of meteors. Both use additive blending over a transparent clear, so
// the night section background shows through. Throws on any WebGPU failure so
// the caller can fall back to the Canvas2D starfield.

import type { Draw, Frame, Gpu, Surface } from "vgpu";

type VgpuApi = typeof import("vgpu");

export const MAX_STARS = 2700; // trimmed ~20% from 3380: reads as space dust, not snowfall
const METEORS = 6;

const STAR_WGSL = `
struct Params {
  time: f32,
  res: vec2f,
  center: vec2f,
  einstein: f32,
  dpr: f32,
  count: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

struct StarOut {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) alpha: f32,
  @location(2) local: vec2f,
}

fn hash1(n: f32) -> f32 { return fract(sin(n * 12.9898) * 43758.5453); }

fn rot(v: vec2f, a: f32) -> vec2f {
  let c = cos(a);
  let s = sin(a);
  return vec2f(c * v.x - s * v.y, s * v.x + c * v.y);
}

@vertex fn vs_main(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> StarOut {
  var corners = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var out: StarOut;
  let fi = f32(i);
  if (fi >= params.count) {
    out.position = vec4f(2.0, 2.0, 0.0, 1.0);
    out.color = vec3f(0.0);
    out.alpha = 0.0;
    out.local = vec2f(0.0);
    return out;
  }
  let E = max(params.einstein, 1.0);
  // Uniform home position across the whole hero rect (device px).
  var home = vec2f(hash1(fi * 3.17 + 1.3) * params.res.x, hash1(fi * 5.23 + 7.9) * params.res.y);
  var rel = home - params.center;
  var baseR = max(length(rel), 0.001);
  var dir = rel / baseR;
  if (baseR < E * 0.7) {
    // Homes inside the shadow remap into a soft annulus instead of popping on the ring.
    baseR = E * (0.7 + hash1(fi * 9.11 + 3.3) * 1.1);
    home = params.center + dir * baseR;
  }
  // Infall life: slow far away, accelerating inward, then respawned home.
  let period = mix(7.0, 20.0, hash1(fi * 1.37 + 4.2));
  let phase = hash1(fi * 2.71 + 9.4);
  let life = fract(params.time / period + phase);
  let r = mix(baseR, E * 0.55, pow(life, 1.7));
  let dirR = rot(dir, life * (0.5 + hash1(fi * 4.47 + 2.2) * 1.2));
  // Outer image of a point lens: always outside E, brighter near the ring.
  let t = (r + sqrt(r * r + 4.0 * E * E)) * 0.5;
  let t4 = t * t * t * t;
  let mu = min(4.0, t4 / max(t4 - E * E * E * E, 0.001));
  let pos = params.center + dirR * t;
  let big = step(0.88, hash1(fi * 6.13 + 5.5));
  let m = mix(0.8 + hash1(fi * 7.77 + 8.8) * 0.5, 1.6 + hash1(fi * 8.31 + 1.1) * 0.6, big);
  // Smooth absorption: dissolve (and slightly compress) over the last stretch
  // toward the horizon instead of winking out at the respawn radius.
  let absorb = smoothstep(E * 0.5, E * 1.15, r);
  let sizePx = m * params.dpr * 1.5 * mix(0.55, 1.0, absorb);
  let tw = 0.72 + 0.28 * sin(params.time * (1.0 + hash1(fi * 3.71 + 6.6) * 3.0) + phase * 6.2831);
  let px = pos + corners[v] * sizePx;
  out.position = vec4f(px.x / params.res.x * 2.0 - 1.0, 1.0 - px.y / params.res.y * 2.0, 0.0, 1.0);
  let pick = hash1(fi * 9.77 + 0.7);
  var tint = vec3f(0.953, 0.937, 0.902);
  if (pick >= 0.62 && pick < 0.82) {
    tint = vec3f(0.749, 0.918, 0.949);
  } else if (pick >= 0.82) {
    tint = vec3f(0.839, 0.796, 1.0);
  }
  out.color = tint;
  out.alpha = min(1.0, 0.42 * m * mu) * tw * absorb;
  out.local = corners[v];
  return out;
}

@fragment fn fs_main(@location(0) color: vec3f, @location(1) alpha: f32, @location(2) local: vec2f) -> @location(0) vec4f {
  let d = length(local);
  let mask = 1.0 - smoothstep(0.25, 1.0, d);
  let a = alpha * mask;
  return vec4f(color * a, a);
}
`;

const METEOR_WGSL = `
struct Params {
  time: f32,
  res: vec2f,
  center: vec2f,
  einstein: f32,
  dpr: f32,
  count: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

struct MetOut {
  @builtin(position) position: vec4f,
  @location(0) color: vec3f,
  @location(1) alpha: f32,
  @location(2) axis: f32,
  @location(3) lat: f32,
}

fn hash1(n: f32) -> f32 { return fract(sin(n * 12.9898) * 43758.5453); }

@vertex fn vs_main(@builtin(vertex_index) v: u32, @builtin(instance_index) i: u32) -> MetOut {
  var out: MetOut;
  let fi = f32(i);
  let period = mix(4.0, 9.0, hash1(fi * 1.93 + 0.4));
  let off = hash1(fi * 7.17 + 3.1);
  let tick = params.time / period + off;
  let cycle = floor(tick);
  // Most cycles stay dark: sporadic by design.
  let gate = step(hash1(cycle * 7.13 + fi * 3.7), 0.62);
  let local = fract(tick);
  let win = 0.22;
  let vis = gate * step(local, win);
  let prog = clamp(local / win, 0.0, 1.0);
  // Spawn band: right side only, upper-middle heights.
  let spawn = vec2f(
    mix(0.55, 1.0, hash1(fi * 3.31 + cycle * 0.37 + 5.5)) * params.res.x,
    mix(0.05, 0.5, hash1(fi * 5.93 + cycle * 0.53 + 1.9)) * params.res.y,
  );
  let dir = normalize(vec2f(-0.75 - 0.2 * hash1(fi * 2.17 + 4.4), 0.55 + 0.25 * hash1(fi * 8.53 + 2.8)));
  let travel = params.res.x * (0.28 + 0.15 * hash1(fi * 4.19 + 7.2));
  let head = spawn + dir * travel * prog;
  let streak = (90.0 + 90.0 * hash1(fi * 6.77 + 9.9)) * params.dpr;
  let width = (1.4 + 1.2 * hash1(fi * 9.31 + 3.3)) * params.dpr;
  let perp = vec2f(-dir.y, dir.x);
  var p = head;
  var axis = 0.0;
  var lat = 0.0;
  if (v == 1u) {
    p = head - dir * streak + perp * width;
    axis = 1.0;
    lat = -1.0;
  } else if (v == 2u) {
    p = head - dir * streak - perp * width;
    axis = 1.0;
    lat = 1.0;
  }
  var ndc = vec2f(p.x / params.res.x * 2.0 - 1.0, 1.0 - p.y / params.res.y * 2.0);
  // Park invisible instances outside clip space; visible ones rely on alpha too.
  ndc = ndc + vec2f((1.0 - vis) * 4.0, 0.0);
  out.position = vec4f(ndc, 0.0, 1.0);
  out.color = vec3f(0.85, 0.94, 1.0);
  out.alpha = 0.9 * sin(3.14159 * prog) * vis;
  out.axis = axis;
  out.lat = lat;
  return out;
}

@fragment fn fs_main(
  @location(0) color: vec3f,
  @location(1) alpha: f32,
  @location(2) axis: f32,
  @location(3) lat: f32,
) -> @location(0) vec4f {
  let a = alpha * pow(1.0 - axis, 1.6) * max(1.0 - abs(lat), 0.0);
  return vec4f(color * a, a);
}
`;

interface StarfieldSize {
  res: readonly [number, number];
  center: readonly [number, number];
  einstein: number;
  dpr: number;
  count: number;
}

/** Animated vgpu starfield. Resolves to a dispose function; rejects on any failure. */
export async function startVgpuStarfield(
  canvas: HTMLCanvasElement,
  well: HTMLElement,
): Promise<() => void> {
  const vgpu: VgpuApi = await import("vgpu");
  const gpu: Gpu = await vgpu.init();
  let disposed = false;
  let raf = 0;
  let running = false;
  let visible = true;

  const surface: Surface = vgpu.surface(gpu, canvas, { dpr: [1, 2] });
  const stars: Draw = vgpu.draw(gpu, { shader: STAR_WGSL, instances: MAX_STARS, blend: "additive", depth: false });
  const meteors: Draw = vgpu.draw(gpu, { shader: METEOR_WGSL, instances: METEORS, blend: "additive", depth: false });

  let size: StarfieldSize = { res: [1, 1], center: [0, 0], einstein: 1, dpr: 1, count: MAX_STARS };

  const measure = () => {
    const box = canvas.getBoundingClientRect();
    const o = well.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, box.width);
    const h = Math.max(1, box.height);
    size = {
      res: [w * dpr, h * dpr],
      center: [(o.left + o.width / 2 - box.left) * dpr, (o.top + o.height / 2 - box.top) * dpr],
      einstein: Math.max(1, o.width * 0.62 * dpr),
      dpr,
      // Trimmed ~20%: space dust, not snowfall. Floored/capped for phones and huge monitors.
      count: Math.round(Math.min(MAX_STARS, Math.max(730, (w * h) / 529))),
    };
    pushParams(performance.now() / 1000);
  };

  const pushParams = (time: number) => {
    const params = {
      time,
      res: size.res,
      center: size.center,
      einstein: size.einstein,
      dpr: size.dpr,
      count: size.count,
    };
    stars.set({ params });
    meteors.set({ params });
  };

  const t0 = performance.now() / 1000;
  const clockTime = () => performance.now() / 1000 - t0;

  const renderFrame = (frame: Frame): void => {
    if (disposed) return;
    pushParams(clockTime());
    frame.pass({ target: surface, clear: [0, 0, 0, 0] }, (pass) => {
      pass.draw(stars);
      pass.draw(meteors);
    });
  };

  const tick = () => {
    if (disposed) return;
    try {
      vgpu.frame(gpu, renderFrame);
    } catch {
      // A lost device mid-loop must not take the page down; the hero keeps
      // its last presented frame and the section background behind it.
      stop();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (running || disposed) return;
    running = true;
    measure();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };
  const reconcile = () => {
    if (!disposed && visible && !document.hidden) start();
    else stop();
  };

  const ro = new ResizeObserver(() => {
    if (!disposed) measure();
  });
  ro.observe(canvas);
  ro.observe(well);
  void document.fonts?.ready.then(() => {
    if (!disposed) measure();
  });
  const io = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
    reconcile();
  });
  io.observe(canvas);
  const onVis = () => reconcile();
  document.addEventListener("visibilitychange", onVis);

  await stars.compile(surface);
  await meteors.compile(surface);
  if (disposed) {
    cleanup();
    return () => {};
  }
  // One synchronous frame so the first paint already carries stars.
  vgpu.frame(gpu, renderFrame);
  reconcile();

  function cleanup() {
    stop();
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    surface.dispose();
    gpu.dispose();
  }

  return () => {
    disposed = true;
    cleanup();
  };
}
