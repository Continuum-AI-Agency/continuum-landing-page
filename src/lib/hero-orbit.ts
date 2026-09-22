/**
 * Continuum hero orbit: abstract shader orb + ordered stipple rings.
 * Particles live on exact tracks. Pointer displaces them radially;
 * they ease back onto the same orbit. Theta is never sprung.
 */
import * as THREE from "three";

const VOID = 0x0b0b0e;

const SILVER: [number, number, number] = [232, 228, 220];
const MIST: [number, number, number] = [186, 176, 210];
const PALE: [number, number, number] = [242, 239, 232];

function hash01(n: number): number {
  const t = 43758.5453 * Math.sin(12.9898 * n);
  return t - Math.floor(t);
}

function mixRgb(
  c: [number, number, number],
  heat: number,
  home: number,
): [number, number, number] {
  return [
    Math.round(12 + (c[0] - 12) * home + (255 - c[0]) * heat * 0.7),
    Math.round(12 + (c[1] - 12) * home + (250 - c[1]) * heat * 0.7),
    Math.round(16 + (c[2] - 16) * home + (245 - c[2]) * heat * 0.7),
  ];
}

function makeDotTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (!g) throw new Error("2d canvas unavailable");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 28);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.85)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.beginPath();
  g.arc(32, 32, 28, 0, Math.PI * 2);
  g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const RING_COUNT = 5400;
const DUST_COUNT = 1600;
const STAR_COUNT = 3200;
const COAST_DAMP = 2.8;
const VEL_DAMP = 10;
const HOME_RATE = 1.45;
const SETTLE_K = 15;
const SETTLE_C = 6.1;
const SETTLE_RADIUS = 0.24;
const MAX_DR = 1.85;

const PLANET_VERT = /* glsl */ `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const PLANET_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorld;

  vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m *= m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  float fbm(vec3 p) {
    float s = 0.0;
    float a = 0.5;
    mat3 rot = mat3(
      0.00,  0.80,  0.60,
     -0.80,  0.36, -0.48,
     -0.60, -0.48,  0.64
    );
    for (int i = 0; i < 6; i++) {
      s += a * snoise(p);
      p = rot * p * 2.07;
      a *= 0.5;
    }
    return s * 0.5 + 0.5;
  }

  void main() {
    vec3 n = normalize(vNormal);
    vec3 view = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - abs(dot(n, view)), 2.8);

    vec3 p = n * 1.85;
    p += vec3(uTime * 0.012, uTime * 0.007, -uTime * 0.005);
    float warp = fbm(p * 0.85);
    float veil = fbm(p + warp * 0.55);
    float fine = fbm(p * 2.4 + 17.0);

    vec3 deep = vec3(0.07, 0.065, 0.11);
    vec3 violet = vec3(0.46, 0.34, 0.76);
    vec3 teal = vec3(0.30, 0.54, 0.56);
    vec3 ember = vec3(0.80, 0.44, 0.30);

    vec3 col = mix(deep, violet, smoothstep(0.28, 0.78, veil));
    col = mix(col, teal, smoothstep(0.42, 0.88, warp) * 0.28);
    col += violet * pow(fine, 4.0) * 0.16;
    col += ember * fres * 0.58;

    float light = smoothstep(-0.25, 0.55, n.x * 0.5 + n.z * 0.45);
    col *= 0.58 + 0.48 * light;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class HeroOrbitSim {
  private canvas: HTMLCanvasElement;
  private slot: HTMLElement;
  private reduced: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private planetGroup = new THREE.Group();
  private ringGroup = new THREE.Group();
  private planetMat: THREE.ShaderMaterial;
  private ringGeo: THREE.BufferGeometry;
  private dustGeo: THREE.BufferGeometry;
  private starGroup = new THREE.Group();
  private raf = 0;
  private running = false;
  private visible = true;
  private last = 0;
  private time = 0;
  private ro: ResizeObserver | null = null;
  private io: IntersectionObserver | null = null;

  private ringCount: number;
  private homeR: Float32Array;
  private theta0: Float32Array;
  private homeY: Float32Array;
  private omega: Float32Array;
  private mass: Float32Array;
  private side: Uint8Array;
  private dr: Float32Array;
  private dtheta: Float32Array;
  private dy: Float32Array;
  private vr: Float32Array;
  private vtheta: Float32Array;
  private vy: Float32Array;
  private scatter: Float32Array;
  private heat: Float32Array;

  private pointer = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, on: false };
  private trail: number[] = [];
  private raycaster = new THREE.Raycaster();
  private ndc = new THREE.Vector2();
  private hit = new THREE.Vector3();
  private plane = new THREE.Plane();
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();

  constructor(opts: { canvas: HTMLCanvasElement; slot: HTMLElement; reduced: boolean }) {
    this.canvas = opts.canvas;
    this.slot = opts.slot;
    this.reduced = opts.reduced;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(VOID, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(VOID);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
    this.camera.position.set(0, 0.12, 9);
    this.camera.lookAt(0, 0, 0);

    this.planetMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
      precision: "highp",
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), this.planetMat);
    this.planetGroup.add(planet);
    this.planetGroup.add(this.makeAtmosphere());
    this.ringGroup.rotation.x = 1.12;
    this.ringGroup.rotation.z = -0.16;
    this.planetGroup.add(this.ringGroup);
    this.scene.add(this.planetGroup);

    this.ringCount = RING_COUNT;
    this.homeR = new Float32Array(this.ringCount);
    this.theta0 = new Float32Array(this.ringCount);
    this.homeY = new Float32Array(this.ringCount);
    this.omega = new Float32Array(this.ringCount);
    this.mass = new Float32Array(this.ringCount);
    this.side = new Uint8Array(this.ringCount);
    this.dr = new Float32Array(this.ringCount);
    this.dtheta = new Float32Array(this.ringCount);
    this.dy = new Float32Array(this.ringCount);
    this.vr = new Float32Array(this.ringCount);
    this.vtheta = new Float32Array(this.ringCount);
    this.vy = new Float32Array(this.ringCount);
    this.scatter = new Float32Array(this.ringCount);
    this.heat = new Float32Array(this.ringCount);

    this.seedRings();
    this.ringGeo = this.makeBuffer(this.ringCount);
    const ringMat = new THREE.PointsMaterial({
      size: 0.048,
      map: makeDotTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      sizeAttenuation: true,
    });
    const rings = new THREE.Points(this.ringGeo, ringMat);
    rings.frustumCulled = false;
    this.ringGroup.add(rings);

    this.dustGeo = this.makeBuffer(DUST_COUNT);
    this.seedDust();
    const dustMat = new THREE.PointsMaterial({
      size: 0.022,
      map: makeDotTexture(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(this.dustGeo, dustMat);
    dust.renderOrder = -1;
    dust.frustumCulled = false;
    this.scene.add(dust);

    this.makeStars();
    this.scene.add(this.starGroup);

    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerLeave = this.onPointerLeave.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    this.resize();
    this.last = performance.now();

    this.canvas.addEventListener("pointerdown", this.onPointerMove);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("pointercancel", this.onPointerLeave);
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVis);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);
    this.ro.observe(this.slot);

    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        if (this.visible) this.ensureLoop();
      },
      { threshold: 0.05 },
    );
    this.io.observe(this.canvas);

    this.draw();
    this.ensureLoop();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.canvas.removeEventListener("pointerdown", this.onPointerMove);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("pointercancel", this.onPointerLeave);
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVis);
    this.ro?.disconnect();
    this.io?.disconnect();
    this.renderer.dispose();
  }

  private onResize = () => this.resize();
  private onVis = () => {
    if (document.visibilityState === "visible") this.ensureLoop();
  };

  private ensureLoop() {
    if (this.running || this.reduced) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop(now: number) {
    this.raf = 0;
    if (!this.running) return;
    if (!this.visible || document.visibilityState === "hidden") {
      this.running = false;
      return;
    }
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;

    this.fitPlanetToSlot();
    const trail = this.trail.slice();
    this.trail.length = 0;
    this.stepRings(dt, trail);
    this.planetMat.uniforms.uTime.value = this.time;
    this.starGroup.rotation.y += dt * 0.003;
    this.draw();

    this.raf = requestAnimationFrame(this.loop);
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.seedDust();
    this.fitPlanetToSlot();
    if (this.reduced) this.draw();
  }

  private fitPlanetToSlot() {
    const slot = this.slot.getBoundingClientRect();
    const canvas = this.canvas.getBoundingClientRect();
    if (slot.width < 4 || canvas.width < 4) return;

    const ndcX = ((slot.left + slot.width / 2 - canvas.left) / canvas.width) * 2 - 1;
    const ndcY = -((slot.top + slot.height / 2 - canvas.top) / canvas.height) * 2 + 1;
    this.tmp.set(ndcX, ndcY, 0.5).unproject(this.camera);
    this.tmp2.copy(this.tmp).sub(this.camera.position).normalize();
    const t = (0 - this.camera.position.z) / this.tmp2.z;
    this.planetGroup.position.copy(this.camera.position).add(this.tmp2.multiplyScalar(t));

    const vFov = (this.camera.fov * Math.PI) / 180;
    const worldH = 2 * Math.tan(vFov / 2) * Math.abs(this.camera.position.z);
    const slotWorld = (Math.min(slot.width, slot.height) / canvas.height) * worldH;
    this.planetGroup.scale.setScalar(Math.max(0.05, slotWorld * 0.55));
  }

  private makeAtmosphere(): THREE.Mesh {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      vertexShader: PLANET_VERT,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vWorld;
        void main() {
          vec3 n = normalize(vNormal);
          vec3 view = normalize(cameraPosition - vWorld);
          float f = pow(1.0 - abs(dot(n, view)), 3.0);
          gl_FragColor = vec4(0.72, 0.48, 0.82, f * 0.42);
        }
      `,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.06, 96, 96), mat);
    mesh.renderOrder = 2;
    return mesh;
  }

  private makeStars() {
    const pos = new Float32Array(STAR_COUNT * 3);
    const col = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const u = hash01(i * 1.7);
      const v = hash01(i * 4.3);
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 28 + 18 * hash01(i * 8.1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      const b = 0.55 + 0.45 * hash01(i * 6.2);
      col[i * 3] = 0.86 * b;
      col[i * 3 + 1] = 0.86 * b;
      col[i * 3 + 2] = 0.9 * b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    );
    pts.frustumCulled = false;
    this.starGroup.add(pts);
  }

  private seedRings() {
    const golden = 2.399963229728653;
    for (let i = 0; i < this.ringCount; i++) {
      const radial = Math.pow(hash01(i * 3.1), 0.52);
      this.homeR[i] = 1.24 + radial * 1.48;
      this.theta0[i] = i * golden + (hash01(i * 5.7) - 0.5) * 0.04;
      const edge = Math.abs(radial - 0.5) * 2;
      this.homeY[i] = (hash01(i * 9.3) - 0.5) * 0.07 * (1 - edge * 0.55);
      this.omega[i] = 0.105 / Math.pow(this.homeR[i], 1.32);
      this.mass[i] = 0.7 + 0.55 * hash01(i * 2.2);
      this.side[i] = hash01(i * 7.4) < 0.28 ? 1 : 0;
    }
  }

  private makeBuffer(count: number) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }

  private seedDust() {
    const vFov = (this.camera.fov * Math.PI) / 180;
    const worldH = 2 * Math.tan(vFov / 2) * 8.2;
    const worldW = worldH * Math.max(this.camera.aspect, 0.5);
    const pos = this.dustGeo.getAttribute("position") as THREE.BufferAttribute;
    const col = this.dustGeo.getAttribute("color") as THREE.BufferAttribute;
    for (let i = 0; i < DUST_COUNT; i++) {
      pos.setXYZ(
        i,
        (hash01(i * 1.13) - 0.5) * worldW * 1.1,
        (hash01(i * 2.27) - 0.5) * worldH * 0.7,
        -2.8 - hash01(i * 4.1) * 4.0,
      );
      const c = hash01(i * 7.4) < 0.5 ? PALE : MIST;
      const dim = 0.22 + 0.18 * hash01(i * 3.3);
      col.setXYZ(i, (c[0] / 255) * dim, (c[1] / 255) * dim, (c[2] / 255) * dim);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private onPointerMove(ev: PointerEvent) {
    if (this.reduced) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const ptr = this.pointer;
    if (ptr.px > -9000) {
      const dx = x - ptr.px;
      const dy = y - ptr.py;
      const steps = Math.min(16, Math.ceil(Math.hypot(dx, dy) / 12));
      for (let i = 1; i <= steps; i++) {
        this.trail.push(ptr.px + (dx * i) / steps, ptr.py + (dy * i) / steps);
      }
      ptr.vx = Math.max(-28, Math.min(28, dx));
      ptr.vy = Math.max(-28, Math.min(28, dy));
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

  private onPointerLeave() {
    this.pointer.on = false;
    this.pointer.px = -9999;
    this.pointer.py = -9999;
  }

  private pointerWorld(cx: number, cy: number, target: THREE.Vector3): boolean {
    const rect = this.canvas.getBoundingClientRect();
    this.ndc.set((cx / rect.width) * 2 - 1, -(cy / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.ringGroup.updateWorldMatrix(true, false);
    this.tmp.set(0, 0, 1).transformDirection(this.ringGroup.matrixWorld);
    this.plane.setFromNormalAndCoplanarPoint(this.tmp, this.planetGroup.position);
    return this.raycaster.ray.intersectPlane(this.plane, target) !== null;
  }

  private stepRings(dt: number, trail: number[]) {
    const samples: THREE.Vector3[] = [];
    const pts = trail.length > 0 ? trail : this.pointer.on ? [this.pointer.x, this.pointer.y] : [];
    const speed = Math.hypot(this.pointer.vx, this.pointer.vy);
    this.pointer.vx *= 0.45;
    this.pointer.vy *= 0.45;

    if (speed > 0.35) {
      for (let s = 0; s < pts.length; s += 2) {
        if (this.pointerWorld(pts[s], pts[s + 1], this.hit)) samples.push(this.hit.clone());
      }
    }

    const scale = this.planetGroup.scale.x || 1;
    const brush = 0.78 * scale;
    const brush2 = brush * brush;
    const pos = this.ringGeo.getAttribute("position") as THREE.BufferAttribute;
    const col = this.ringGeo.getAttribute("color") as THREE.BufferAttribute;
    const coastFade = Math.exp(-COAST_DAMP * dt);
    const velFade = Math.exp(-VEL_DAMP * dt);
    const homeFade = Math.exp(-HOME_RATE * dt);

    this.ringGroup.updateWorldMatrix(true, false);

    for (let i = 0; i < this.ringCount; i++) {
      if (samples.length && speed > 0.35) {
        const rNow = this.homeR[i] + this.dr[i];
        const th = this.theta0[i] + this.time * this.omega[i] + this.dtheta[i];
        this.tmp.set(rNow * Math.cos(th), rNow * Math.sin(th), this.homeY[i] + this.dy[i]);
        this.ringGroup.localToWorld(this.tmp);
        for (const sample of samples) {
          const dx = this.tmp.x - sample.x;
          const dyw = this.tmp.y - sample.y;
          const dz = this.tmp.z - sample.z;
          const d2 = dx * dx + dyw * dyw + dz * dz;
          if (d2 >= brush2) continue;
          const dist = Math.sqrt(d2) || 0.001;
          const fall = Math.pow(1 - dist / brush, 1.1);
          const k = (1.15 * fall * (speed / 10)) / this.mass[i];
          this.vr[i] += k * (0.55 + 0.9 * hash01(i * 4.4));
          this.vtheta[i] += (this.pointer.vx / 90 + (hash01(i * 2.1) - 0.5) * 0.8) * k;
          this.vy[i] += (this.pointer.vy / 50) * k * 0.35;
          this.scatter[i] = Math.max(this.scatter[i], 0.28 + 0.22 * hash01(i * 9.3));
          this.heat[i] = Math.min(0.85, this.heat[i] + 0.5 * fall);
        }
      }

      if (this.scatter[i] > 0) {
        this.scatter[i] -= dt;
        this.vr[i] *= coastFade;
        this.vtheta[i] *= coastFade;
        this.vy[i] *= coastFade;
        this.dr[i] += this.vr[i] * dt;
        this.dtheta[i] += this.vtheta[i] * dt;
        this.dy[i] += this.vy[i] * dt;
      } else {
        const far =
          Math.abs(this.dr[i]) > SETTLE_RADIUS ||
          Math.abs(this.dtheta[i]) > SETTLE_RADIUS ||
          Math.abs(this.dy[i]) > SETTLE_RADIUS * 0.5;
        if (far) {
          this.vr[i] *= velFade;
          this.vtheta[i] *= velFade;
          this.vy[i] *= velFade;
          this.dr[i] = (this.dr[i] + this.vr[i] * dt) * homeFade;
          this.dtheta[i] = (this.dtheta[i] + this.vtheta[i] * dt) * homeFade;
          this.dy[i] = (this.dy[i] + this.vy[i] * dt) * homeFade;
        } else {
          this.vr[i] += (-SETTLE_K * this.dr[i] - SETTLE_C * this.vr[i]) * dt;
          this.vtheta[i] += (-SETTLE_K * this.dtheta[i] - SETTLE_C * this.vtheta[i]) * dt;
          this.vy[i] += (-SETTLE_K * this.dy[i] - SETTLE_C * this.vy[i]) * dt;
          this.dr[i] += this.vr[i] * dt;
          this.dtheta[i] += this.vtheta[i] * dt;
          this.dy[i] += this.vy[i] * dt;
        }
      }
      if (this.dr[i] > MAX_DR) this.dr[i] = MAX_DR;
      if (this.dr[i] < -MAX_DR) this.dr[i] = -MAX_DR;
      if (Math.abs(this.dr[i]) < 0.0008 && Math.abs(this.vr[i]) < 0.01) {
        this.dr[i] = 0;
        this.vr[i] = 0;
      }
      if (Math.abs(this.dtheta[i]) < 0.0008 && Math.abs(this.vtheta[i]) < 0.01) {
        this.dtheta[i] = 0;
        this.vtheta[i] = 0;
      }
      if (Math.abs(this.dy[i]) < 0.0008 && Math.abs(this.vy[i]) < 0.01) {
        this.dy[i] = 0;
        this.vy[i] = 0;
      }
      if (this.heat[i] > 0) this.heat[i] = Math.max(0, this.heat[i] - dt * 1.8);

      const r = this.homeR[i] + this.dr[i];
      const th = this.theta0[i] + this.time * this.omega[i] + this.dtheta[i];
      pos.setXYZ(i, r * Math.cos(th), r * Math.sin(th), this.homeY[i] + this.dy[i]);

      const home = Math.max(0, 1 - Math.abs(this.dr[i]) / MAX_DR);
      const palette = this.side[i] === 1 ? MIST : SILVER;
      const rgb = mixRgb(palette, this.heat[i], 0.8 + 0.2 * home);
      col.setXYZ(i, rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  }

  private draw() {
    this.renderer.render(this.scene, this.camera);
  }
}
