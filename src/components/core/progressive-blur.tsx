'use client';

import { motion, type Transition, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';

interface ProgressiveBlurProps {
  className?: string;
  blurIntensity?: number;
  animate?: string;
  variants?: Variants;
  transition?: Transition;
}

export function ProgressiveBlur({
  className,
  blurIntensity = 0.5,
  animate,
  variants,
  transition = { duration: 0.3, ease: 'easeOut' },
}: ProgressiveBlurProps) {
  return (
    <motion.div
      className={cn(
        'pointer-events-none bg-gradient-to-t from-slate-900/60 via-slate-900/30 to-transparent backdrop-blur-[2px]',
        className
      )}
      style={{
        maskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,${blurIntensity}) 50%, rgba(0,0,0,0) 100%)`,
        WebkitMaskImage: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,${blurIntensity}) 50%, rgba(0,0,0,0) 100%)`,
      }}
      initial="hidden"
      animate={animate}
      variants={variants}
      transition={transition}
    />
  );
}
