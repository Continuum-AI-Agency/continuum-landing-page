import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { FlipWords } from "@/components/ui/flip-words";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { startStarfield } from "@/lib/starfield";
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
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = starsRef.current;
    const slot = slotRef.current;
    // Stars run everywhere (Canvas2D); under reduced motion they draw one still, lensed frame.
    const stopStars = stars && slot ? startStarfield(stars, slot, reduced) : () => {};

    const canvas = canvasRef.current;
    if (!canvas || !("gpu" in navigator) || reduced) return stopStars;

    let cancelled = false;
    const fail = (error: unknown) => {
      console.warn("[hero] black hole unavailable, showing poster", error);
      if (!cancelled) setLive(false);
    };

    import("@/lib/black-hole/renderer").then(({ createRenderer }) => {
      if (cancelled) return;
      const renderer = createRenderer({ canvas, onError: fail });
      rendererRef.current = renderer;
      renderer.ready.then(() => {
        if (!cancelled) setLive(true);
      }, fail);
    }, fail);

    return () => {
      cancelled = true;
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
    "absolute left-[-20%] top-[-20%] size-[140%] max-w-none [mask-image:radial-gradient(closest-side,#000_70%,transparent)] [rotate:var(--roll,0deg)]",
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
                "relative mx-auto block size-[0.8em]",
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
        className="mt-10 text-center font-display text-2xl font-medium leading-[1.2] sm:text-3xl md:mt-14 lg:text-5xl"
      >
        <p className="text-balance text-white">The intelligent creative factory for</p>
        <p className="mt-1 min-h-[1.2em] pb-1">
          <FlipWords words={AUDIENCES} duration={2600} cycles={2} className="shimmer" />
        </p>
      </div>

      <ShimmerButton
        href="#demo"
        shimmerColor="oklch(94% 0.08 195)"
        borderRadius="12px"
        background="linear-gradient(135deg, oklch(52% 0.13 205), oklch(42% 0.2 285))"
        className="btn-fill mt-10 h-14 px-9 text-lg font-semibold [--btn-fill:oklch(40%_0.19_272)] shadow-[0_0_48px_-8px_oklch(80%_0.14_195/0.55)] hover:shadow-[0_0_72px_-4px_oklch(80%_0.14_195/0.8)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        Book a demo
        <ArrowRight className="ml-2 size-5 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      </ShimmerButton>
    </div>
  );
}
