import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { MotionConfig, motion, useMotionValue, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** App-styled window that frames each product demo. Tool register: no world styling inside. */
export function ProductWindow({
  path,
  children,
  className,
}: {
  path: string[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
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
        </div>
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
    </>
  );
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Creative: one post, rendered at any network's native shape ──────────────
// Used by Organic+ (editor + previews) and Performance+ (swap thumbnails), so the same post
// travels across demos. Type is sized in cqmin, so it fits portrait and landscape frames alike.
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
  onMove,
  className,
}: {
  photo: Photo;
  headline: string;
  brand: string;
  format: Format;
  pos: Pos;
  onMove?: (pos: Pos) => void;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLParagraphElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const editable = Boolean(onMove);

  const clamp = (p: Pos): Pos => ({
    x: Math.min(Math.max(p.x, 0), 60),
    y: Math.min(Math.max(p.y, 0), 84),
  });

  const commitDrag = () => {
    const frame = frameRef.current?.getBoundingClientRect();
    const chip = chipRef.current?.getBoundingClientRect();
    if (!frame || !chip || !onMove) return;
    onMove(
      clamp({
        x: ((chip.left - frame.left) / frame.width) * 100,
        y: ((chip.top - frame.top) / frame.height) * 100,
      }),
    );
    x.set(0);
    y.set(0);
  };

  const nudge = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 8 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d || !onMove) return;
    e.preventDefault();
    onMove(clamp({ x: pos.x + d[0], y: pos.y + d[1] }));
  };

  return (
    <div
      ref={frameRef}
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
      <motion.p
        ref={chipRef}
        drag={editable}
        dragConstraints={frameRef}
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={commitDrag}
        tabIndex={editable ? 0 : undefined}
        role={editable ? "button" : undefined}
        aria-label={editable ? `Headline layer: ${headline}. Use arrow keys to move.` : undefined}
        onKeyDown={editable ? nudge : undefined}
        style={{ x, y, left: `${pos.x}%`, top: `${pos.y}%`, background: brand }}
        className={cn(
          "absolute max-w-[78%] rounded-[0.6cqmin] px-[3cqmin] py-[2cqmin] text-[7.5cqmin] font-semibold leading-[1.05] text-white",
          editable &&
            "cursor-grab outline-2 outline-offset-2 outline-dashed outline-white/80 focus-visible:outline-solid focus-visible:outline-primary active:cursor-grabbing",
        )}
      >
        {headline || "Your headline"}
      </motion.p>
    </div>
  );
}
