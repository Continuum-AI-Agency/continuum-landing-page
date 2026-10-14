// Engraving check: `bun src/lib/engraving.check.ts`
import assert from "node:assert/strict";
import { build, type Built, type Scene } from "./engraving";

const count = (b: Built) => b.buckets.reduce((n, k) => n + k.prims.length / 5, 0);
const col = (b: Built, x: number) => Math.max(0, Math.min(b.w, Math.round(x)));

for (const [scene, w, h] of [["night", 1440, 544], ["night", 390, 320], ["dawn", 1440, 306], ["dawn", 390, 176]] as [Scene, number, number][]) {
  const a = build(scene, w, h);
  const name = `${scene} ${w}×${h}`;
  assert.deepEqual(a, build(scene, w, h), `${name}: not deterministic`);
  assert.ok(count(a) > 300, `${name}: only ${count(a)} primitives`);

  for (const k of a.buckets) {
    const P = k.prims;
    for (let i = 0; i < P.length; i += 5) {
      const [T, x0, y0, x1, y1] = P.subarray(i, i + 5);
      assert.ok(T >= 0 && T <= 1, `${name}: T ${T} out of [0, 1]`);
      if (i) assert.ok(T >= P[i - 5], `${name}: bucket not sorted by T`);
      const pts = k.dot ? [[x0, y0]] : [[x0, y0], [x1, y1]];
      for (const [x, y] of pts) {
        assert.ok(x >= -3 && x <= a.w + 3 && y >= -6 && y <= a.h + 6, `${name}: (${x}, ${y}) out of bounds`);
        // The bug you'd ship: aurora showing through a range, or a far range over a near one.
        const limit = k.layer < 0 ? a.sky[col(a, x)] : a.occ[k.layer][col(a, x)];
        assert.ok(y <= limit + 3, `${name}: layer ${k.layer} at (${x.toFixed(1)}, ${y.toFixed(1)}) below the ridge in front (${limit.toFixed(1)})`);
      }
    }
  }
}

// Density is per CSS px: half the width, about half the ink.
const ratio = count(build("night", 720, 544)) / count(build("night", 1440, 544));
assert.ok(ratio > 0.375 && ratio < 0.625, `half width gave ${ratio.toFixed(2)}× the primitives`);
console.log("engraving ok");
