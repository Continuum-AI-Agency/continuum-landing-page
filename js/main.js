// Year in footer
const yearEl = document.getElementById("ch-year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Header scroll + scroll top
const header = document.querySelector(".ch-header");
const scrollTopBtn = document.querySelector(".ch-scroll-top");

window.addEventListener("scroll", () => {
  const y = window.scrollY || window.pageYOffset;
  if (header) header.classList.toggle("ch-header--scrolled", y > 12);
  if (scrollTopBtn) scrollTopBtn.classList.toggle("is-visible", y > 320);
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Smooth scroll
document.querySelectorAll("a.js-scroll").forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;
    const target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();
    const rect = target.getBoundingClientRect();
    const offset = rect.top + window.scrollY - 64;
    window.scrollTo({ top: offset, behavior: "smooth" });
  });
});

// Reveal on scroll + counters
let statsAnimated = false;
let analyzeAnimated = false;
let impactAnimated = false;

const statsPanel = document.querySelector("[data-stats-panel]");
const analyzeCard = document.getElementById("how-analyze-card");
const impactGrid = document.getElementById("impact-metrics");

function animateCountersWithin(panel) {
  const counters = panel.querySelectorAll("[data-counter]");
  counters.forEach((el) => {
    const from = parseFloat(el.dataset.from ?? "0");
    const to = parseFloat(el.dataset.to ?? "0");
    const prefix = el.dataset.prefix ?? "";
    const suffix = el.dataset.suffix ?? "";
    const useGrouping = el.dataset.useGrouping === "true";
    const duration = 900;
    const startTime = performance.now();

    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      const rounded = Math.round(value);
      const numberText = useGrouping
        ? rounded.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : String(rounded);

      el.textContent = prefix + numberText + suffix;

      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}


if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");

        if (statsPanel && entry.target === statsPanel && !statsAnimated) {
          statsAnimated = true;
          animateCountersWithin(statsPanel);
        }

        if (analyzeCard && entry.target === analyzeCard && !analyzeAnimated) {
          analyzeAnimated = true;
          animateCountersWithin(analyzeCard);
        }

        if (impactGrid && entry.target === impactGrid && !impactAnimated) {
          impactAnimated = true;
          animateCountersWithin(impactGrid);
        }

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}



// Dropdowns
document.querySelectorAll(".ch-nav-trigger").forEach((btn) => {
  const group = btn.closest(".ch-nav-group");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = group?.classList.contains("is-open");
    document
      .querySelectorAll(".ch-nav-group.is-open")
      .forEach((g) => g.classList.remove("is-open"));
    if (!isOpen && group) group.classList.add("is-open");
  });
});

document.addEventListener("click", () => {
  document
    .querySelectorAll(".ch-nav-group.is-open")
    .forEach((g) => g.classList.remove("is-open"));
});

// Mobile menu
const headerInner = document.querySelector(".ch-header-inner");
const menuToggle = document.querySelector(".ch-header-menu-toggle");

if (menuToggle && headerInner) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    headerInner.classList.toggle("is-open");
  });
}

document.querySelectorAll(".ch-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    if (headerInner) headerInner.classList.remove("is-open");
  });
});

// Hero parallax
const heroOrbit = document.querySelector(".ch-hero-orbit");
if (heroOrbit) {
  heroOrbit.addEventListener("pointermove", (e) => {
    const rect = heroOrbit.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroOrbit.style.transform = `translate3d(${x * 10}px, ${y * 8}px, 0)`;
  });
  heroOrbit.addEventListener("pointerleave", () => {
    heroOrbit.style.transform = "translate3d(0,0,0)";
  });
}

// Fake demo form success
function wireDemoForm(id) {
  const form = document.getElementById(id);
  const note = document.getElementById("demo-success");
  if (!form || !note) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.querySelector("input[type='email']")?.value || "";
    note.textContent = `Thanks${email ? `, ${email}` : ""}! We will contact you about your Continuum demo.`;
    form.reset();
  });
}
wireDemoForm("hero-demo-form");
wireDemoForm("footer-demo-form");

// Modules tabs (STUDIO+ / SOCIAL+ / PERFORMANCE+)
const moduleTabs = document.querySelectorAll(".ch-module-tab");
const moduleShots = document.querySelectorAll("[data-module-shot]");
const modulesCtaText = document.getElementById("modules-cta-text");
const modulesCtaBtn = document.getElementById("modules-cta-btn");

if (moduleTabs.length && moduleShots.length) {
  moduleTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.module;

      // marcar tab activa
      moduleTabs.forEach((t) => {
        t.classList.toggle("is-active", t === tab);
      });

      // cambiar screenshot
      moduleShots.forEach((shot) => {
        const isTarget = shot.dataset.moduleShot === target;
        shot.classList.toggle("is-active", isTarget);
      });

      // actualizar copy del CTA
      if (modulesCtaText && tab.dataset.cta) {
        modulesCtaText.textContent = tab.dataset.cta;
      }
      if (modulesCtaBtn && tab.dataset.ctaBtn) {
        modulesCtaBtn.textContent = tab.dataset.ctaBtn;
      }
    });
  });
}

// Solutions personas (performance / studio / agency)
const solutionCards = document.querySelectorAll(".ch-solution-card");
const solutionsStripLabel = document.getElementById("solutions-strip-label");
const solutionsStripText = document.getElementById("solutions-strip-text");
const solutionsStrip = document.querySelector(".ch-solutions-strip");

if (solutionCards.length && solutionsStripLabel && solutionsStripText && solutionsStrip) {
  // aseguramos que arranque “encendido” con la primera card activa
  solutionsStrip.classList.add("is-emphasis");
  const activeCard = document.querySelector(".ch-solution-card.is-active");
  if (activeCard && activeCard.dataset.persona) {
    solutionsStrip.dataset.persona = activeCard.dataset.persona;
  }

  solutionCards.forEach((card) => {
    card.addEventListener("click", () => {
      solutionCards.forEach((c) => c.classList.remove("is-active"));
      card.classList.add("is-active");

      const label = card.dataset.label || "";
      const strip = card.dataset.strip || "";
      const persona = card.dataset.persona || "";

      solutionsStripLabel.textContent = label;
      solutionsStripText.textContent = strip;

      // resaltar más el texto y cambiar color según persona
      solutionsStrip.classList.add("is-emphasis");
      if (persona) {
        solutionsStrip.dataset.persona = persona;
      }
    });
  });
}

// Video cards (gallery) – play on hover / tap
// Video cards – autoplay silencioso
const videoCards = document.querySelectorAll("[data-video-card]");

if (videoCards.length) {
  videoCards.forEach((card) => {
    const video = card.querySelector("video");
    if (!video) return;

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    const start = () => {
      try {
        const p = video.play();
        if (p && typeof p.catch === "function") {
          p.catch(() => {});
        }
      } catch (_) {}
    };

    // intentar arrancar cuando carga
    video.addEventListener("canplay", start, { once: true });
    // fallback por si no dispara canplay
    setTimeout(start, 500);
  });
}

// Carrusel automático para cada fila de la galería
const galleryRows = document.querySelectorAll("[data-gallery-row]");

if (galleryRows.length) {
  galleryRows.forEach((row) => {
    let scrollAmount = 0;
    const step = 1; // píxeles por tick
    const maxScroll = () => row.scrollWidth - row.clientWidth;

    let direction = 1; // 1 -> derecha, -1 -> izquierda

    const tick = () => {
      if (!document.body.contains(row)) return;
      const limit = maxScroll();
      if (limit <= 0) return;

      scrollAmount += step * direction;
      if (scrollAmount >= limit || scrollAmount <= 0) {
        direction *= -1;
      }
      row.scrollLeft = scrollAmount;
    };

    let intervalId = setInterval(tick, 30);

    // Pausar cuando el usuario pasa el mouse por la fila
    row.addEventListener("mouseenter", () => {
      clearInterval(intervalId);
    });

    row.addEventListener("mouseleave", () => {
      scrollAmount = row.scrollLeft;
      intervalId = setInterval(tick, 30);
    });
  });
}

// Team cards – seleccionar y agrandar levemente
const teamCards = document.querySelectorAll(".ch-team-card");

if (teamCards.length) {
  teamCards.forEach((card) => {
    card.addEventListener("click", () => {
      const isActive = card.classList.contains("is-active");
      // limpiamos todas primero
      teamCards.forEach((c) => c.classList.remove("is-active"));
      // si ya estaba activa, queda todo cerrado; si no, se activa esta
      if (!isActive) {
        card.classList.add("is-active");
      }
    });
  });
}


// Slides → Surface: stepper interactivo
const surfaceTabs = document.querySelectorAll("[data-surface-step]");
const surfaceTitle = document.getElementById("surface-step-title");
const surfaceText = document.getElementById("surface-step-text");
const surfaceMeterFill = document.getElementById("surface-meter-fill");
const surfaceMeterLeft = document.getElementById("surface-meter-left");
const surfaceMeterRight = document.getElementById("surface-meter-right");
const surfaceFootnote = document.getElementById("surface-footnote");

if (
  surfaceTabs.length &&
  surfaceTitle &&
  surfaceText &&
  surfaceMeterFill &&
  surfaceMeterLeft &&
  surfaceMeterRight &&
  surfaceFootnote
) {
  const surfaceStates = {
    before: {
      title: "Decks, chats and chaos everywhere.",
      text:
        "Slides, spreadsheets and email threads spread across teams. No one knows which version is the latest, and every campaign starts from scratch.",
      fill: 18,
      left: "Fragmented work",
      right: "Single source of truth",
      footnote: "More time lost aligning decks than actually running tests."
    },
    with: {
      title: "One live surface for briefs, assets and performance.",
      text:
        "Continuum connects creative, media and data into a single workspace. Every campaign, template and signal lives in one place.",
      fill: 55,
      left: "Manual handoffs",
      right: "Shared live surface",
      footnote:
        "Tests ship faster, teams see the same numbers, and creative learns from performance."
    },
    after: {
      title: "Faster decisions, more tests, a creative engine that never sleeps.",
      text:
        "Your team runs more experiments with less coordination overhead. The surface becomes your creative OS, not just another dashboard.",
      fill: 92,
      left: "Static decks",
      right: "Continuous creative OS",
      footnote:
        "Campaigns compound learning over time instead of starting from zero every quarter."
    }
  };

  surfaceTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const step = tab.dataset.surfaceStep;
      const state = surfaceStates[step];

      if (!state) return;

      surfaceTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");

      surfaceTitle.textContent = state.title;
      surfaceText.textContent = state.text;
      surfaceMeterFill.style.width = state.fill + "%";
      surfaceMeterLeft.textContent = state.left;
      surfaceMeterRight.textContent = state.right;
      surfaceFootnote.textContent = state.footnote;
    });
  });
}

// Auto-rotación de templates en la sección "Create"
// Rotate Create videos stack
const createStack = document.querySelector(".js-create-stack");

if (createStack) {
  const tiles = Array.from(createStack.querySelectorAll(".ch-template-tile"));
  const positions = [
    "ch-template-tile--bottom",
    "ch-template-tile--middle",
    "ch-template-tile--top",
  ];
  let step = 0;

  function applyCreateStackState() {
    tiles.forEach((tile, index) => {
      // limpiar clases de posición
      positions.forEach((pos) => tile.classList.remove(pos));

      // calcular qué posición le toca a cada tile
      const roleIndex = (index - step + tiles.length) % tiles.length;
      const positionClass = positions[roleIndex];
      tile.classList.add(positionClass);

            const media = tile.querySelector(".ch-template-video");
      if (!media) return;

      // Si es video, solo reproduce el de arriba. Si es imagen, no hacemos nada extra.
      const isVideo = media.tagName === "VIDEO";

      if (isVideo) {
        if (positionClass === "ch-template-tile--top") {
          try { media.currentTime = 5; } catch (e) {}
          media.play().catch(() => {});
        } else {
          media.pause();
          try { media.currentTime = 5; } catch (e) {}
        }
      }
    });
  }

  // estado inicial
  applyCreateStackState();

  // rotar cada 3 segundos
  setInterval(() => {
    step = (step + 1) % tiles.length;
    applyCreateStackState();
  }, 3000);
}
// FAQ accordion
const faqItems = document.querySelectorAll(".ch-faq-item");

if (faqItems.length) {
  faqItems.forEach((item) => {
    const trigger = item.querySelector(".ch-faq-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // cerramos todas
      faqItems.forEach((it) => it.classList.remove("is-open"));

      // si la que clickeamos no estaba abierta, la abrimos
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });
}

// Ralentizar el video de fondo del hero (si existe)
const heroVideo = document.getElementById("hero-video");
if (heroVideo) {
  heroVideo.playbackRate = 0.5; // 0.5 = la mitad de velocidad
}

// Highlight current page in nav
(() => {
  const path = (location.pathname || "").toLowerCase();
  document.querySelectorAll(".nav-pill").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (!href) return;
    if (path.endsWith(href)) a.classList.add("is-active");
  });
})();

const phone = document.querySelector(".ch-hero-phone");
const track = document.querySelector(".ch-stories-track");

if (phone && track) {
  phone.addEventListener("mouseenter", () => (track.style.animationPlayState = "paused"));
  phone.addEventListener("mouseleave", () => (track.style.animationPlayState = "running"));
}

const masonry = document.querySelector(".ch-media-masonry");
const fillers = document.querySelectorAll(".ch-media-tile.filler");

if (masonry && fillers.length) {
  const clone = fillers[0].cloneNode(true);
  masonry.appendChild(clone);
}

// HOW v2: stagger reveal

(() => {
  const cards = document.querySelectorAll("#how .ch-how-card.reveal");
  if (!cards.length) return;
  cards.forEach((c, i) => {
    c.style.transitionDelay = `${i * 80}ms`;
  });
})();

document.querySelectorAll(".ch-modules-visual").forEach((container) => {
  const getActiveImg = () =>
    container.querySelector(".ch-module-shot.is-active .ch-modules-gallery img");

  container.addEventListener("mouseenter", () => {
    container.classList.add("is-zooming");
  });

  container.addEventListener("mouseleave", () => {
    container.classList.remove("is-zooming");
    const img = getActiveImg();
    if (img) img.style.transformOrigin = "50% 50%";
  });

  container.addEventListener("mousemove", (e) => {
    const img = getActiveImg();
    if (!img) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    img.style.transformOrigin = `${x}% ${y}%`;
  });
});
