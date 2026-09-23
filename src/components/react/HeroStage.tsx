import { useEffect, useRef, useState } from "react";
import { FlipWords } from "@/components/ui/flip-words";
import { cn } from "@/lib/utils";

const LETTERS = ["C", "", "N", "T", "I", "N", "U", "U", "M"] as const;
const AUDIENCES = ["performance marketers", "designers", "agencies"];

export function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !canvas ||
      !("gpu" in navigator) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    let cancelled = false;
    let dispose = () => {};
    const fail = (error: unknown) => {
      console.warn("[hero] black hole unavailable, showing poster", error);
      if (!cancelled) setLive(false);
    };

    import("@/lib/black-hole/renderer").then(({ createRenderer }) => {
      if (cancelled) return;
      const renderer = createRenderer({ canvas, onError: fail });
      dispose = renderer.dispose;
      renderer.ready.then(() => {
        if (!cancelled) setLive(true);
      }, fail);
    }, fail);

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return (
    <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-[2.4vw] pb-36 pt-20">
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
            <span key="o-slot" className="relative mx-auto block size-[0.8em]">
              <img
                src="/assets/hero/black-hole.webp"
                alt=""
                width={412}
                height={412}
                className={cn(
                  "absolute left-[-20%] top-[-20%] size-[140%] max-w-none transition-opacity duration-700",
                  live && "opacity-0",
                )}
              />
              <canvas
                ref={canvasRef}
                className={cn(
                  "absolute left-[-20%] top-[-20%] size-[140%] opacity-0 transition-opacity duration-700 [mask-image:radial-gradient(closest-side,#000_70%,transparent)]",
                  live && "opacity-100",
                )}
              />
            </span>
          ) : (
            <span key={`${letter}-${i}`} className="flex items-center justify-center">
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
        <p className="mt-1 min-h-[1.2em] text-[oklch(78%_0.12_285)]">
          <FlipWords words={AUDIENCES} duration={2600} cycles={2} />
        </p>
      </div>

      <a
        href="#demo"
        className="mt-10 inline-flex h-12 items-center rounded-md bg-[#f3efe6] px-6 text-base font-medium text-[#0b0b0e] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-px"
      >
        Book a demo
      </a>
    </div>
  );
}
