"use client";

import { motion, useMotionValue, useAnimationFrame } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface InfiniteSliderProps {
  children: React.ReactNode;
  gap?: number;
  reverse?: boolean;
  speed?: number;
  speedOnHover?: number;
  className?: string;
}

export function InfiniteSlider({
  children,
  gap = 40,
  reverse = false,
  speed = 50,
  speedOnHover,
  className,
}: InfiniteSliderProps) {
  const [contentWidth, setContentWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);

  // Robust width measurement using ResizeObserver
  useEffect(() => {
    if (!contentRef.current) return;

    const updateWidth = () => {
      if (contentRef.current) {
        setContentWidth(contentRef.current.offsetWidth);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateWidth();
    });

    resizeObserver.observe(contentRef.current);
    
    // Initial measurement
    updateWidth();

    // Secondary check for slow-loading images
    const timeout = setTimeout(updateWidth, 1000);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timeout);
    };
  }, [children]);

  useAnimationFrame((_, delta) => {
    if (!contentWidth) return;

    const currentSpeed = isHovered && speedOnHover !== undefined ? speedOnHover : speed;
    const moveAmount = (delta / 1000) * currentSpeed;
    
    let nextX = x.get() + (reverse ? moveAmount : -moveAmount);

    // Seamless reset logic
    if (reverse) {
      if (nextX >= 0) nextX = -contentWidth;
    } else {
      if (nextX <= -contentWidth) nextX = 0;
    }

    x.set(nextX);
  });

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div 
        className="inline-flex" 
        style={{ x, gap: `${gap}px` }}
      >
        <div ref={contentRef} className="inline-flex" style={{ gap: `${gap}px` }}>
          {children}
        </div>
        {/* Triple duplication ensures no gaps even on huge screens or with few logos */}
        <div className="inline-flex" style={{ gap: `${gap}px` }} aria-hidden="true">
          {children}
        </div>
        <div className="inline-flex" style={{ gap: `${gap}px` }} aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
