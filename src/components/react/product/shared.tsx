import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { MotionConfig, animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// The app's entrance curve (PortfolioHero's EASE), shared by every product-window motion.
export const EASE = [0.16, 1, 0.3, 1] as const;

/** How the app marks a Preview feature. Shown wherever the sales register says "Pilot only". */
export const Pilot = ({ className }: { className?: string }) => (
  <Badge variant="muted" className={className}>
    Pilot
  </Badge>
);

/** The end of every scripted run: hand the visitor to a demo instead of a dead-end reset.
 *  `pending` is the version shown while the run waits at its approval gate. */
export const RunItCta = ({ pending, className }: { pending?: boolean; className?: string }) => (
  <p className={cn("text-xs text-muted-foreground", className)}>
    {pending ? "Your call. Approve it here, or" : "That's the run."}{" "}
    <a href="/#demo" className="font-medium text-primary underline-offset-4 hover:underline">
      {pending ? "run it on your account" : "Run it on your account"} → Book a demo
    </a>
  </p>
);

/** App-styled window that frames each product demo. Tool register: no world styling inside.
 *  `badge` sits after the path (e.g. <Pilot />); `actions` sit at the right of the title bar (tabs). */
export function ProductWindow({
  path,
  badge,
  actions,
  children,
  className,
  ref,
}: {
  path: string[];
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "app-theme overflow-hidden rounded-xl border border-border shadow-[0_12px_40px_-12px_oklch(30%_0.05_260/0.18)]",
        className,
      )}
    >
      <div className="flex h-10 items-center gap-3 border-b border-border bg-card px-4 text-xs">
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          {path.map((part, i) => (
            <span key={part} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <span aria-hidden="true">/</span>}
              <span className={cn("truncate", i === path.length - 1 && "font-medium text-foreground")}>
                {part}
              </span>
            </span>
          ))}
          {badge}
        </div>
        {actions && <div className="ml-auto flex shrink-0 items-center">{actions}</div>}
      </div>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </div>
  );
}

/** Streams `text` in like a model reply; instant under reduced motion. Screen readers get the full text once. */
export function Typed({ text, onDone }: { text: string; onDone?: () => void }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);

  useEffect(() => {
    if (n >= text.length) {
      onDone?.();
      return;
    }
    const t = setTimeout(() => setN((v) => Math.min(text.length, v + 3)), 16);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}</span>
      {n < text.length && (
        // The streaming caret, like a Jaina reply mid-stream.
        <span aria-hidden="true" className="ml-px inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse rounded-full bg-primary/70" />
      )}
    </>
  );
}

/**
 * A number that moves to its new value instead of jumping (0.9 s, like the app's PortfolioHero
 * CountUp). With `from`, it counts up from that value once `play` turns true. Instant under
 * reduced motion.
 */
export function Tween({
  value,
  format,
  from,
  play = true,
}: {
  value: number;
  format: (n: number) => string;
  from?: number;
  play?: boolean;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const [shown, setShown] = useState(value);
  useMotionValueEvent(mv, "change", setShown);
  useEffect(() => {
    if (reduce || !play) {
      mv.jump(value);
      setShown(value);
      return;
    }
    if (from !== undefined) mv.jump(from);
    const controls = animate(mv, value, { duration: 0.9, ease: EASE });
    return () => controls.stop();
    // `from` only seeds the first count-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, play, reduce, mv]);
  return <>{format(shown)}</>;
}

/**
 * Plays a demo's script once, the first time its window's top passes 60% of the viewport, so the
 * payoff never waits on a click. (Not "N% in view": on a phone the Organic window is taller than
 * the screen, so a share-of-element threshold never fires.) The first pointer or key press inside
 * the window hands control to the visitor and stops the script. Nothing autoplays under reduced
 * motion.
 */
export function useAutoplay(ref: RefObject<HTMLElement | null>, script: (alive: () => boolean) => Promise<void>) {
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -40% 0px" });
  const touched = useRef(false);
  const latest = useRef(script);
  latest.current = script;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const take = () => {
      touched.current = true;
    };
    el.addEventListener("pointerdown", take);
    el.addEventListener("keydown", take);
    return () => {
      el.removeEventListener("pointerdown", take);
      el.removeEventListener("keydown", take);
    };
  }, [ref]);

  useEffect(() => {
    if (!inView || reduce) return;
    let cancelled = false;
    void latest.current(() => !cancelled && !touched.current);
    return () => {
      cancelled = true;
    };
  }, [inView, reduce]);

  return inView;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Creative: one post, rendered at any network's native shape ──────────────
// Read-only. Type is sized in cqmin, so it fits portrait and landscape frames alike.
export type Format = "1:1" | "4:5" | "9:16" | "1.91:1";
export type Photo = { key?: string; src: string; alt: string; label?: string };
export type Pos = { x: number; y: number };
export const RATIO: Record<Format, number> = { "1:1": 1, "4:5": 4 / 5, "9:16": 9 / 16, "1.91:1": 1.91 };

export function Creative({
  photo,
  headline,
  brand,
  format,
  pos,
  className,
}: {
  photo: Photo;
  headline: string;
  brand: string;
  format: Format;
  pos: Pos;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden bg-muted [container-type:size]", className)}
      style={{ aspectRatio: RATIO[format] }}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        width={640}
        height={640}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 size-full select-none object-cover"
      />
      <p
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, background: brand }}
        className="absolute max-w-[78%] rounded-[0.6cqmin] px-[3cqmin] py-[2cqmin] text-[7.5cqmin] font-semibold leading-[1.05] text-white"
      >
        {headline}
      </p>
    </div>
  );
}
