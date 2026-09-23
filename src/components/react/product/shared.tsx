import { useEffect, useState, type ReactNode } from "react";
import { MotionConfig, useReducedMotion } from "motion/react";
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
        "app-theme overflow-hidden rounded-xl border border-border shadow-[0_2px_8px_-2px_rgb(22_22_42/0.12)]",
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border bg-card px-4 text-xs">
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
        <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-2xs text-muted-foreground">
          Sample data
        </span>
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
