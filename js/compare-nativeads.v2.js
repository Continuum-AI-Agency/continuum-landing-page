// NativeAds-style comparison JS
(() => {
  // Prompt demo interactions
  const promptEl = document.getElementById("naPrompt");
  const runBtn = document.getElementById("naPromptRun");
  const fillBtn = document.getElementById("naPromptFill");
  const outEl = document.getElementById("naPromptOutput");

  const sample =
`Generate 6 native-style ad creatives for a meal-delivery app.
- Editorial, realistic, premium
- Subtle product UI mock
- 3 hook angles: speed, price, taste
- 1:1, 4:5, 9:16 versions`;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  if (fillBtn && promptEl) {
    fillBtn.addEventListener("click", () => {
      promptEl.value = sample;
      promptEl.focus();
    });
  }

  if (runBtn && outEl && promptEl) {
    runBtn.addEventListener("click", () => {
      // This is a UI-only “preview” (no backend). You can wire your real generator later.
      const t = promptEl.value.trim();
      if (!t) {
        outEl.textContent = "Write a prompt to preview.";
        return;
      }

      outEl.innerHTML =
        `<div style="opacity:.9;margin-bottom:6px;">Preview (mock):</div>` +
        `<div style="white-space:pre-wrap;color:rgba(255,255,255,.78);">` +
        escapeHtml(t) +
        `</div>`;
    });
  }

  // Before/After slider
  const range = document.getElementById("naCompareRange");
  const overlay = document.querySelector("[data-compare-overlay]");
  const handle = document.querySelector("[data-compare-handle]");

  function setCompare(pct) {
    if (!overlay || !handle) return;
    overlay.style.width = pct + "%";
    handle.style.left = pct + "%";
  }

  if (range) {
    range.addEventListener("input", () => setCompare(Number(range.value)));
    setCompare(Number(range.value));
  }

  // CTA fake form success (mirrors your existing pattern)
  const demoForm = document.getElementById("naDemoForm");
  const demoNote = document.getElementById("naDemoNote");
  if (demoForm && demoNote) {
    demoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = demoForm.querySelector("input[type='email']")?.value || "";
      demoNote.textContent = `Thanks${email ? `, ${email}` : ""}! We'll reach out to schedule the demo.`;
      demoForm.reset();
    });
  }
})();

/* =========================
  AI Ads additions
========================= */

// Small helper: create a clean “ad-like” SVG placeholder (no text inside image)
function naSvgAd({ w = 900, h = 1100, seed = 1, accent = "#7C3AED" } = {}) {
  const a = accent.replace("#", "");
  const bg1 = `#0b0b12`;
  const bg2 = `#121226`;
  const rnd = (n) => (Math.abs(Math.sin(seed * 999 + n)) * 10000) % 1;

  const x1 = Math.floor(rnd(1) * w);
  const y1 = Math.floor(rnd(2) * h);
  const x2 = Math.floor(rnd(3) * w);
  const y2 = Math.floor(rnd(4) * h);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <defs>
        <radialGradient id="g" cx="${x1}" cy="${y1}" r="${Math.max(w, h)}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#${a}" stop-opacity="0.38"/>
          <stop offset="0.55" stop-color="${bg2}" stop-opacity="0.55"/>
          <stop offset="1" stop-color="${bg1}" stop-opacity="1"/>
        </radialGradient>
        <linearGradient id="s" x1="0" y1="0" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="white" stop-opacity="0.10"/>
          <stop offset="1" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect x="${Math.floor(rnd(5)*40)}" y="${Math.floor(rnd(6)*40)}" rx="36" ry="36"
            width="${w - Math.floor(rnd(7)*60)}" height="${h - Math.floor(rnd(8)*60)}"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)"/>

      <!-- product-ish block -->
      <rect x="${Math.floor(w*0.12)}" y="${Math.floor(h*0.18)}" rx="44" ry="44"
            width="${Math.floor(w*0.76)}" height="${Math.floor(h*0.42)}"
            fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)"/>

      <!-- UI-ish shimmer -->
      <rect x="${Math.floor(w*0.18)}" y="${Math.floor(h*0.67)}" rx="18" ry="18"
            width="${Math.floor(w*0.64)}" height="${Math.floor(h*0.08)}"
            fill="url(#s)"/>

      <rect x="${Math.floor(w*0.18)}" y="${Math.floor(h*0.78)}" rx="16" ry="16"
            width="${Math.floor(w*0.52)}" height="${Math.floor(h*0.05)}"
            fill="rgba(255,255,255,0.06)"/>

      <circle cx="${Math.floor(w*0.82)}" cy="${Math.floor(h*0.80)}" r="${Math.floor(w*0.05)}"
              fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.14)"/>
    </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function naMountGrid(el, count, opts = {}) {
  if (!el) return;
  el.innerHTML = "";
  const accents = opts.accents || ["#7C3AED", "#22D3EE", "#14B8A6", "#A78BFA", "#F472B6"];
  for (let i = 0; i < count; i++) {
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = opts.alt || "AI-generated ad preview";
    img.src = naSvgAd({
      w: opts.w || 900,
      h: opts.h || 1100,
      seed: (opts.seedBase || 10) + i * 7,
      accent: accents[i % accents.length]
    });

    const wrap = document.createElement("div");
    wrap.className = opts.wrapClass || "na-thumb";
    wrap.appendChild(img);
    el.appendChild(wrap);
  }
}

/* Data module: generated previews */
const naGenGrid = document.getElementById("naGenGrid");
const naGenShuffle = document.getElementById("naGenShuffle");
function naRenderGenSet() {
  naMountGrid(naGenGrid, 12, { w: 900, h: 1100, seedBase: Math.floor(Math.random() * 1000) });
}
naRenderGenSet();
if (naGenShuffle) naGenShuffle.addEventListener("click", naRenderGenSet);

/* Mosaic: MANY images */
const naMosaic = document.getElementById("naMosaic");
function naRenderMosaic() {
  if (!naMosaic) return;
  naMosaic.innerHTML = "";

  const layout = [
    ["w5","h4"], ["w4","h3"], ["w3","h3"],
    ["w4","h2"], ["w4","h2"], ["w4","h2"],
    ["w3","h3"], ["w5","h3"], ["w4","h4"],
    ["w4","h2"], ["w3","h2"], ["w5","h2"],
  ];

  const accents = ["#7C3AED", "#22D3EE", "#14B8A6", "#F472B6", "#A78BFA", "#38BDF8"];
  layout.forEach((cls, idx) => {
    const cell = document.createElement("div");
    cell.className = `na-m ${cls[0]} ${cls[1]}`;
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = "Ad creative example";
    img.src = naSvgAd({
      w: 1200,
      h: 1500,
      seed: 200 + idx * 11,
      accent: accents[idx % accents.length]
    });
    cell.appendChild(img);
    naMosaic.appendChild(cell);
  });
}
naRenderMosaic();

/* Templates (Coca-Cola style idea, but generic) */
const naTemplateGrid = document.getElementById("naTemplateGrid");
const naTabs = Array.from(document.querySelectorAll(".na-tab"));

const TEMPLATE_SETS = {
  cpg: [
    { name: "Native Promo", meta: "Hook + offer + product hero", chips: ["Offer-led", "Native", "High CTR"] },
    { name: "Flavor Drop", meta: "Launch moment", chips: ["Launch", "Lifestyle", "Premium"] },
    { name: "Retail Shelf", meta: "SKU variation-ready", chips: ["SKU-driven", "Feed", "Fast variants"] },
  ],
  retail: [
    { name: "Price Slash", meta: "Price-first layout", chips: ["Promo", "Catalog", "Retargeting"] },
    { name: "New Arrivals", meta: "Editorial grid", chips: ["Collection", "Multi-product", "Always-on"] },
    { name: "Stock Alert", meta: "Scarcity variant", chips: ["Inventory", "Urgency", "DPA-like"] },
  ],
  apps: [
    { name: "Feature Spotlight", meta: "UI-led", chips: ["UI", "Benefits", "Acquisition"] },
    { name: "Social Proof", meta: "Testimonial vibe", chips: ["Trust", "Native", "Conversion"] },
    { name: "Upgrade Moment", meta: "Plan comparison", chips: ["Pricing", "Upsell", "Retention"] },
  ],
  sports: [
    { name: "Match Moment", meta: "Real-time trigger", chips: ["Live", "Fast", "Sponsored"] },
    { name: "Player Drop", meta: "Star focus", chips: ["Talent", "Merch", "Engagement"] },
    { name: "Result Recap", meta: "Post-match", chips: ["Recap", "Highlights", "Shareable"] },
  ],
};

function naTemplateCard(tpl, seedBase = 50) {
  const card = document.createElement("article");
  card.className = "na-tcard";

  const head = document.createElement("div");
  head.className = "na-thead";
  head.innerHTML = `
    <div>
      <div class="na-tmeta">${tpl.meta}</div>
      <div class="na-tname">${tpl.name}</div>
    </div>
    <div class="na-tmeta">Templates</div>
  `;

  const grid = document.createElement("div");
  grid.className = "na-tgrid";

  // 3 previews like the reference page’s “multiple templates”
  const accents = ["#DC2626", "#7C3AED", "#22D3EE"]; // red/violet/cyan vibe (coke-like but generic)
  accents.forEach((accent, i) => {
    const thumb = document.createElement("div");
    thumb.className = "na-thumb";
    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = `${tpl.name} preview`;
    img.src = naSvgAd({ w: 900, h: 1100, seed: seedBase + i * 9, accent });
    thumb.appendChild(img);
    grid.appendChild(thumb);
  });

  const chips = document.createElement("div");
  chips.className = "na-tchiprow";
  chips.innerHTML = tpl.chips.map(c => `<span class="na-tchip">${c}</span>`).join("");

  card.appendChild(head);
  card.appendChild(grid);
  card.appendChild(chips);
  return card;
}

function naRenderTemplates(key) {
  if (!naTemplateGrid) return;
  naTemplateGrid.innerHTML = "";
  const list = TEMPLATE_SETS[key] || [];
  list.forEach((tpl, idx) => naTemplateGrid.appendChild(naTemplateCard(tpl, 500 + idx * 33)));
}

naTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    naTabs.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    naTabs.forEach(b => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
    naRenderTemplates(btn.dataset.tab);
  });
});

naRenderTemplates("cpg");


/* =========================
  HERO Template Stack (for na-hero2)
========================= */
(() => {
  const grid = document.getElementById("naHeroStack");
  const tabs = Array.from(document.querySelectorAll(".na-stack-tab"));

  if (!grid || !tabs.length) return;

  const stacks = {
    promo: { accents: ["#22D3EE", "#A855F7", "#38BDF8"], seedBase: 900 },
    launch:{ accents: ["#F472B6", "#A78BFA", "#22D3EE"], seedBase: 950 },
    retail:{ accents: ["#14B8A6", "#22D3EE", "#A855F7"], seedBase: 990 },
  };

  function render(key){
    const s = stacks[key] || stacks.promo;
    naMountGrid(grid, 3, { w: 900, h: 1100, seedBase: s.seedBase + Math.floor(Math.random()*50), accents: s.accents, wrapClass: "na-thumb" });
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("is-active"));
      t.classList.add("is-active");
      render(t.dataset.stack);
    });
  });

  render("promo");
})();

// Hero rotating previews
(() => {
  const track = document.getElementById("naShowcaseTrack");
  if (!track) return;

  // reutiliza tu generador SVG placeholder si existe
  const accents = ["#7C3AED", "#22D3EE", "#14B8A6", "#F472B6", "#A78BFA", "#38BDF8"];
  const make = (seed, accent) => {
    if (typeof naSvgAd === "function") return naSvgAd({ w: 900, h: 1100, seed, accent });
    return "";
  };

  const cards = [];
  for (let i = 0; i < 8; i++) {
    const src = make(900 + i * 11, accents[i % accents.length]);
    const div = document.createElement("div");
    div.className = "na-showcase-card";
    div.innerHTML = `<img loading="lazy" alt="Ad creative preview" src="${src}">`;
    cards.push(div);
  }

  // duplicar para loop suave del marquee
  track.innerHTML = "";
  cards.concat(cards).forEach(c => track.appendChild(c));
})();
