import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { startStarfield, HERO_O_CATCH_MS } from "@/lib/starfield";
import { cn } from "@/lib/utils";

const LETTERS = ["C", "", "N", "T", "I", "N", "U", "U", "M"] as const;
const AUDIENCES = ["performance marketers", "designers", "agencies"];

type Renderer = {
  dispose: () => void;
  canTilt: () => boolean;
  setPitch: (pitch: number | null) => void;
  restPitch: number;
};

export function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [live, setLive] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const mountT = performance.now(); // ignition curtain: everything below keys off mount
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = starsRef.current;
    const slot = slotRef.current;
    let stopStars = () => {};
    let cancelled = false;
    let ignitionTimer = 0;
    if (stars && slot) {
      if (!reduced && "gpu" in navigator) {
        // WebGPU starfield first (instanced stars + right-side meteors);
        // anything failing drops back to the Canvas2D field on the same canvas.
        import("@/lib/starfield-vgpu").then(
          ({ startVgpuStarfield }) => {
            if (cancelled) return;
            startVgpuStarfield(stars, slot).then(
              (stop) => {
                if (cancelled) stop();
                else stopStars = stop;
              },
              () => {
                if (!cancelled) stopStars = startStarfield(stars, slot, reduced);
              },
            );
          },
          () => {
            if (!cancelled) stopStars = startStarfield(stars, slot, reduced);
          },
        );
      } else {
        // Reduced motion draws one still, lensed frame; no-WebGPU animates in Canvas2D.
        stopStars = startStarfield(stars, slot, reduced);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator) || reduced) {
      return () => {
        cancelled = true;
        stopStars();
      };
    }

    const fail = (error: unknown) => {
      console.warn("[hero] black hole unavailable, showing poster", error);
      if (!cancelled) setLive(false);
    };

    import("@/lib/black-hole/renderer").then(({ createRenderer }) => {
      if (cancelled) return;
      const renderer = createRenderer({ canvas, onError: fail });
      rendererRef.current = renderer;
      renderer.ready.then(() => {
        if (cancelled) return;
        // The O catches once the first stars arrive — not whenever WebGPU
        // happens to be ready — so the hole feels caused by the swirl.
        const wait = Math.max(0, HERO_O_CATCH_MS - (performance.now() - mountT));
        ignitionTimer = window.setTimeout(() => {
          if (!cancelled) setLive(true);
        }, wait);
      }, fail);
    }, fail);

    return () => {
      cancelled = true;
      window.clearTimeout(ignitionTimer);
      rendererRef.current?.dispose();
      rendererRef.current = null;
      stopStars();
    };
  }, []);

  // Drag the O: vertical tilts the disk (a real re-bake), horizontal rolls it (CSS, free).
  const setRoll = (deg: number) => slotRef.current?.style.setProperty("--roll", `${deg}deg`);
  const onPointerDown = (e: PointerEvent<HTMLSpanElement>) => {
    if (!live) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLSpanElement>) => {
    const start = dragRef.current;
    const renderer = rendererRef.current;
    if (!start || !renderer) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (renderer.canTilt()) renderer.setPitch(renderer.restPitch - dy * 0.006);
    setRoll(Math.max(-25, Math.min(25, dx * 0.15)));
  };
  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    rendererRef.current?.setPitch(null);
    setRoll(0);
  };

  const layer = cn(
    "hero-o-ambient absolute left-[-20%] top-[-20%] size-[140%] max-w-none [mask-image:radial-gradient(closest-side,#000_70%,transparent)]",
    !dragging && "transition-[rotate,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
  );

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-[2.4vw] pb-36 pt-20">
      <canvas ref={starsRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full" />

      <h1 className="sr-only">
        Continuum, the intelligent creative factory for performance marketers,
        designers, and agencies.
      </h1>

      <p
        aria-hidden="true"
        className="hero-wordmark grid w-full grid-cols-9 items-center text-[#f3efe6]"
      >
        {LETTERS.map((letter, i) =>
          letter === "" ? (
            <span
              key="o-slot"
              ref={slotRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className={cn(
                "hero-o-slot relative mx-auto block size-[0.8em]",
                live && "cursor-grab touch-none active:cursor-grabbing",
              )}
            >
              <img
                src="/assets/hero/black-hole.webp"
                alt=""
                width={412}
                height={412}
                draggable={false}
                className={cn(layer, live && "opacity-0")}
              />
              <canvas ref={canvasRef} className={cn(layer, "opacity-0", live && "opacity-100")} />
            </span>
          ) : (
            <span
              key={`${letter}-${i}`}
              className="hero-letter flex items-center justify-center"
              style={{ "--i": i } as CSSProperties}
            >
              {letter}
            </span>
          ),
        )}
      </p>

      <div
        aria-hidden="true"
        className="hero-copy-in mt-10 text-center font-display text-display font-light md:mt-14"
        style={{ animationDelay: "1.5s" }}
      >
        <p className="text-balance text-white">The intelligent creative factory for</p>
        <p className="mt-1 min-h-[1.2em] pb-1">
          <FlipWords words={AUDIENCES} duration={2600} cycles={2} className="shimmer font-semibold" />
        </p>
      </div>

      <div className="hero-copy-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6" style={{ animationDelay: "1.7s" }}>
      <a href="#demo" data-live className="btn-aura h-14 rounded-xl px-9 text-lg">
        Book a demo
        <ArrowRight className="size-5" aria-hidden="true" />
      </a>
      <a href="#product" className="text-base font-medium text-white/75 underline-offset-4 transition-colors hover:text-white hover:underline">
        See it work <span aria-hidden="true">↓</span>
      </a>
      </div>
    </div>
  );
}
