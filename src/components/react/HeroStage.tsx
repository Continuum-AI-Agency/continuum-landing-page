import { useEffect, useRef } from "react";
import { FlipWords } from "@/components/ui/flip-words";
import { HeroOrbitSim } from "@/lib/hero-orbit";

const LETTERS = ["C", "", "N", "T", "I", "N", "U", "U", "M"] as const;

const ICP = [
  "Marketing Teams",
  "Creative Teams",
  "Agencies",
  "Community Teams",
  "Content Teams",
];

export function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const simRef = useRef<HeroOrbitSim | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const slot = slotRef.current;
    if (!canvas || !slot) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sim = new HeroOrbitSim({ canvas, slot, reduced });
    simRef.current = sim;
    sim.start();
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, []);

  return (
    <div className="absolute inset-0 z-10">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none select-none"
        aria-hidden="true"
      />

      <div className="pointer-events-none relative z-10 flex h-full min-h-[100dvh] flex-col px-[2.4vw] pb-28 pt-20 md:pb-32">
        <div className="flex flex-1 flex-col items-stretch justify-center">
          <h1 className="sr-only">
            Continuum. Is your Creative Factory for marketing teams, creative
            teams, agencies, community teams, or content teams?
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
                  className="hero-o-slot mx-auto block size-[1.55em] shrink-0 md:size-[1.22em]"
                />
              ) : (
                <span key={`${letter}-${i}`} className="flex items-center justify-center">
                  {letter}
                </span>
              ),
            )}
          </p>

          <div className="mt-8 flex flex-col items-center text-center md:mt-12">
            <p className="font-display text-2xl font-medium leading-[1.15] text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Is your Creative Factory for
            </p>
            <p className="mt-2 flex min-h-[2.6rem] items-center justify-center sm:min-h-[3.4rem] md:min-h-[4.4rem] lg:min-h-[5.4rem]">
              <FlipWords
                words={ICP}
                duration={2800}
                className="hero-icp-shimmer font-display text-3xl font-medium leading-[1.15] sm:text-4xl md:text-5xl lg:text-6xl"
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
