// Geometry check for the pricing solids: `bun src/lib/polyhedra.check.ts`
import assert from "node:assert/strict";
import { SOLIDS } from "./polyhedra";

const expected = { tetrahedron: [4, 6, 4], octahedron: [6, 12, 8], icosahedron: [12, 30, 20] };

for (const [name, [v, e, f]] of Object.entries(expected)) {
  const s = SOLIDS[name as keyof typeof SOLIDS];
  assert.deepEqual([s.verts.length, s.edges.length, s.faces.length], [v, e, f], name);
  for (const [i, j, k] of s.faces) {
    const [a, b, c] = [s.verts[i], s.verts[j], s.verts[k]];
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const w = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const out = n[0] * (a[0] + b[0] + c[0]) + n[1] * (a[1] + b[1] + c[1]) + n[2] * (a[2] + b[2] + c[2]);
    assert.ok(out > 0, `${name} face ${i},${j},${k} points inward`);
  }
}
console.log("polyhedra ok");
