import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * FlipWords — rotates through a list of phrases, animating each phrase in and
 * out as a single unit (not per-letter). Animating the whole phrase keeps a
 * gradient (bg-clip-text) continuous across the words instead of restarting it
 * on every letter, and `mode="wait"` avoids overlap width-jump while centered.
 */
export const FlipWords = ({
  words,
  duration = 2800,
  cycles = Infinity,
  className,
}: {
  words: string[];
  duration?: number;
  /** Full passes through `words` before settling back on the first one. */
  cycles?: number;
  className?: string;
}) => {
  const [index, setIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flips, setFlips] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const startAnimation = useCallback(() => {
    setIndex((prev) => (prev + 1) % words.length);
    setFlips((n) => n + 1);
    setIsAnimating(true);
  }, [words.length]);

  useEffect(() => {
    if (reduceMotion) return; // hold on the first phrase when reduced motion is requested
    if (flips >= words.length * cycles) return; // settled after the last pass
    if (!isAnimating) {
      const t = setTimeout(startAnimation, duration);
      return () => clearTimeout(t);
    }
  }, [isAnimating, duration, startAnimation, reduceMotion, flips, words.length, cycles]);

  return (
    <AnimatePresence mode="wait" initial={false} onExitComplete={() => setIsAnimating(false)}>
      <motion.span
        key={words[index]}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
        className={cn("inline-block", className)}
      >
        {words[index]}
      </motion.span>
    </AnimatePresence>
  );
};
