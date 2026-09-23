// Pricing solids: each plan's glyph is a Platonic solid seen straight down one vertex. On hover it
// grows into the shaded solid and turns. More faces per tier: tetrahedron, octahedron, icosahedron.
// Canvas2D on purpose: at most 20 triangles a frame.

export type Vec = [number, number, number];
export type Solid = { verts: Vec[]; edges: [number, number][]; faces: [number, number, number][] };
export type SolidName = "tetrahedron" | "octahedron" | "icosahedron";

// n points on a circle of radius r at height z. Unit circumradius throughout, so sizes match.
const ring = (n: number, z: number, r: number, phase: number): Vec[] =>
  Array.from({ length: n }, (_, k) => {
    const a = phase + (k * 2 * Math.PI) / n;
    return [r * Math.cos(a), r * Math.sin(a), z];
  });

// Vertex 0 sits on +z (toward the viewer), so the rest pose reads as a flat glyph:
// a triangle with a Y, a diamond with an X, a pentagon star.
const I = 1 / Math.sqrt(5);
const VERTS: Record<SolidName, Vec[]> = {
  tetrahedron: [[0, 0, 1], ...ring(3, -1 / 3, Math.sqrt(8) / 3, Math.PI / 2)],
  octahedron: [[0, 0, 1], [0, 0, -1], ...ring(4, 0, 1, Math.PI / 2)],
  icosahedron: [[0, 0, 1], [0, 0, -1], ...ring(5, I, 2 * I, -Math.PI / 2), ...ring(5, -I, 2 * I, -Math.PI / 2 + Math.PI / 5)],
};

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// All three solids are made of equilateral triangles, so edges are the shortest vertex pairs and
// faces are the triples that are pairwise edges. Faces are wound so their normals point outward.
function build(verts: Vec[]): Solid {
  const n = verts.length;
  const dist = (i: number, j: number) => Math.hypot(...sub(verts[i], verts[j]));
  let len = Infinity;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) len = Math.min(len, dist(i, j));
  const adj = (i: number, j: number) => Math.abs(dist(i, j) - len) < 1e-6;

  const edges: [number, number][] = [];
  const faces: [number, number, number][] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (!adj(i, j)) continue;
      edges.push([i, j]);
      for (let k = j + 1; k < n; k++) {
        if (!adj(i, k) || !adj(j, k)) continue;
        const [a, b, c] = [verts[i], verts[j], verts[k]];
        const outward = dot(cross(sub(b, a), sub(c, a)), [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]) > 0;
        faces.push(outward ? [i, j, k] : [i, k, j]);
      }
    }
  return { verts, edges, faces };
}

export const SOLIDS: Record<SolidName, Solid> = {
  tetrahedron: build(VERTS.tetrahedron),
  octahedron: build(VERTS.octahedron),
  icosahedron: build(VERTS.icosahedron),
};

export type Pose = {
  t: number; // 0 = flat glyph, 1 = full solid
  pitch: number; // rotation about the screen x axis
  yaw: number; // rotation about the screen y axis
  cx: number;
  cy: number;
  r: number; // circumradius in CSS px
};

const VIOLET = [90, 72, 249]; // app primary #5a48f9
const ZINC = [113, 113, 122]; // muted-foreground on the day zone
const LIGHT: Vec = (() => {
  const l: Vec = [-0.45, -0.6, 0.66];
  const m = Math.hypot(...l);
  return [l[0] / m, l[1] / m, l[2] / m];
})();
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(",");

export function drawSolid(ctx: CanvasRenderingContext2D, solid: Solid, p: Pose) {
  const { t, cx, cy, r } = p;
  const [sp, cp, sy, cy_] = [Math.sin(p.pitch), Math.cos(p.pitch), Math.sin(p.yaw), Math.cos(p.yaw)];
  // Rotate (yaw, then pitch). Screen y points down; +z points at the viewer.
  const rot = (v: Vec): Vec => {
    const x = v[0] * cy_ + v[2] * sy;
    const z = -v[0] * sy + v[2] * cy_;
    return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
  };
  const world = solid.verts.map(rot);
  const screen = world.map(([x, y, z]) => {
    const s = r / (1 - z * 0.18); // light perspective: nearer is a touch larger
    return [cx + x * s, cy + y * s] as const;
  });

  // Soft shadow below-right (away from the upper-left light), only once the solid has body.
  if (t > 0.01) {
    ctx.save();
    ctx.translate(cx + r * 0.25, cy + r * 1.05);
    ctx.scale(1, 0.3);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, `rgba(30,22,80,${0.28 * t})`);
    g.addColorStop(1, "rgba(30,22,80,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Faces back to front, lit from the upper left.
  if (t > 0.01) {
    const order = solid.faces
      .map((f) => {
        const [a, b, c] = f.map((i) => world[i]);
        const nrm = cross(sub(b, a), sub(c, a));
        const m = Math.hypot(...nrm);
        return { f, z: a[2] + b[2] + c[2], facing: nrm[2] > 0, lit: Math.max(0, dot(nrm, LIGHT) / m) };
      })
      .sort((x, y) => x.z - y.z);
    for (const { f, facing, lit } of order) {
      ctx.beginPath();
      f.forEach((i, n) => (n ? ctx.lineTo(...screen[i]) : ctx.moveTo(...screen[i])));
      ctx.closePath();
      ctx.fillStyle = `rgba(${mix(VIOLET, [255, 255, 255], facing ? lit * 0.35 : 0)},${t * (facing ? 0.5 + lit * 0.3 : 0.2)})`;
      ctx.fill();
    }
  }

  // Edges: muted glyph lines at rest, bright wire once solid. Back edges stay fainter.
  ctx.lineWidth = 1.25 - 0.25 * t;
  ctx.lineJoin = "round";
  for (const [i, j] of solid.edges) {
    const back = world[i][2] + world[j][2] < -0.05;
    ctx.strokeStyle = `rgba(${mix(ZINC, [255, 255, 255], t)},${(back ? 0.45 : 0.95) - t * (back ? 0.15 : 0.1)})`;
    ctx.beginPath();
    ctx.moveTo(...screen[i]);
    ctx.lineTo(...screen[j]);
    ctx.stroke();
  }

  // Corner dots fade in with the body.
  if (t > 0.01) {
    for (let i = 0; i < world.length; i++) {
      const a = t * (world[i][2] < -0.05 ? 0.35 : 1);
      ctx.beginPath();
      ctx.arc(...screen[i], 2.1, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${VIOLET.join(",")},${a})`;
      ctx.stroke();
    }
  }
}
