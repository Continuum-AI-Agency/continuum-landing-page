"use client";

import React, { forwardRef, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { AnimatedBeam } from "./AnimatedBeam";
import GoogleDriveIcon from "../../assets/Icons/icons8-google-drive.svg";
import GoogleAdsIcon from "../../assets/Icons/icons8-google-ads.svg";
import TikTokIcon from "../../assets/Icons/tiktok.svg";
import YouTubeIcon from "../../assets/Icons/icons8-youtube.svg";
import MetaIcon from "../../assets/Icons/icons8-meta-96.png";
import OneDriveIcon from "../../assets/Icons/icons8-microsoft-onedrive-2025-96.png";
import RedditIcon from "../../assets/Icons/icons8-reddit-96.png";
import ContinuumLogo from "../../assets/Icons/Continuum-icon-2.jpg";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-14 items-center justify-center rounded-full border border-border/40 bg-background p-3 shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

const FolderIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <motion.path
      d="M22 19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H9L11 5H20C21.1046 5 22 5.89543 22 7V19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ fill: isOpen ? "rgba(13, 174, 162, 0.2)" : "rgba(13, 174, 162, 0)" }}
    />
    <motion.path
      d="M2 10H22"
      stroke="currentColor"
      strokeWidth="2"
      animate={{ 
        rotateX: isOpen ? -45 : 0,
        y: isOpen ? 2 : 0
      }}
      style={{ transformOrigin: "bottom" }}
    />
  </svg>
);

export function AnimatedBento({ results }: { results: any[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);
  const div8Ref = useRef<HTMLDivElement>(null);
  const div9Ref = useRef<HTMLDivElement>(null);
  const div10Ref = useRef<HTMLDivElement>(null);
  const div11Ref = useRef<HTMLDivElement>(null);
  const div12Ref = useRef<HTMLDivElement>(null);
  const div13Ref = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen((prev) => !prev);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative flex h-[850px] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-card p-10 md:p-20"
      ref={containerRef}
    >
      {/* Top Headers */}
      <div className="mb-16 flex w-full max-w-5xl flex-row justify-between px-2 font-sans">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-wide text-primary/50">Stage 01</span>
          <span className="text-sm font-bold tracking-wide text-muted-foreground">Listen</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-wide text-brand-violet/50">Stage 02</span>
          <span className="text-sm font-bold tracking-wide text-muted-foreground">Analyze</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-wide text-success/50">Stage 03</span>
          <span className="text-sm font-bold tracking-wide text-muted-foreground">Create</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold tracking-wide text-primary/50">Stage 04</span>
          <span className="text-sm font-bold tracking-wide text-muted-foreground">Implement</span>
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-row items-stretch justify-between gap-12 md:gap-24">
        {/* Left Side: Inputs */}
        <div className="flex flex-col justify-center gap-4">
          <Circle ref={div1Ref}>
            <img src={GoogleDriveIcon.src} alt="Google Drive" className="w-7 h-7" />
          </Circle>
          <Circle ref={div2Ref}>
            <img src={GoogleAdsIcon.src} alt="Google Ads" className="w-7 h-7" />
          </Circle>
          <Circle ref={div3Ref}>
            <img src={TikTokIcon.src} alt="TikTok" className="w-7 h-7" />
          </Circle>
          <Circle ref={div4Ref}>
            <img src={YouTubeIcon.src} alt="YouTube" className="w-7 h-7" />
          </Circle>
          <Circle ref={div5Ref}>
            <img src={MetaIcon.src} alt="Meta" className="w-7 h-7" />
          </Circle>
          <Circle ref={div6Ref}>
            <img src={OneDriveIcon.src} alt="OneDrive" className="w-7 h-7" />
          </Circle>
          <Circle ref={div7Ref}>
            <img src={RedditIcon.src} alt="Reddit" className="w-7 h-7" />
          </Circle>
        </div>

        <div className="flex flex-col justify-center">
          <Circle ref={div8Ref} className="size-40 border-primary/30 bg-background overflow-hidden p-0 shadow-sm">
            <img src={ContinuumLogo.src} alt="Continuum" className="h-full w-full object-cover" />
          </Circle>
        </div>

        {/* Right Side: Output */}
        <div className="flex flex-col justify-center relative md:-ml-20">
          <Circle ref={div9Ref} className="size-32 border-success/30">
            <FolderIcon isOpen={isOpen} />
          </Circle>

          {/* Popping Images */}
          <AnimatePresence>
            {isOpen && results && results.length > 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                {results.map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      x: (i - 1) * 140 - 60, // Shifted left and reduced spread
                      y: 100 + (Math.abs(i - 1) * 20), // Brought closer vertically
                      rotate: (i - 1) * 8
                    }}
                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 260, 
                      damping: 20,
                      delay: i * 0.1 
                    }}
                    className="absolute z-40 w-40 h-60 overflow-hidden rounded-xl border border-border/40 shadow-sm"
                  >
                    <img src={img.src} alt={`Result ${i + 1}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Final Destinations */}
        <div className="flex flex-col justify-center gap-8">
          <Circle ref={div10Ref}>
            <img src={GoogleAdsIcon.src} alt="Google Ads" className="w-8 h-8" />
          </Circle>
          <Circle ref={div11Ref}>
            <img src={MetaIcon.src} alt="Meta" className="w-8 h-8" />
          </Circle>
          <Circle ref={div12Ref}>
            <img src={TikTokIcon.src} alt="TikTok" className="w-8 h-8" />
          </Circle>
          <Circle ref={div13Ref}>
            <img src={YouTubeIcon.src} alt="YouTube" className="w-8 h-8" />
          </Circle>
        </div>
      </div>

      {/* Beams */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div8Ref}
        curvature={-45}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div8Ref}
        curvature={-30}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div8Ref}
        curvature={-15}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div4Ref}
        toRef={div8Ref}
        curvature={0}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div8Ref}
        curvature={15}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div6Ref}
        toRef={div8Ref}
        curvature={30}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div7Ref}
        toRef={div8Ref}
        curvature={45}
        gradientStartColor="#0DAEA2"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div8Ref}
        toRef={div9Ref}
        gradientStartColor="#853bf4"
        gradientStopColor="#53A88A"
        duration={1.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div10Ref}
        curvature={-30}
        gradientStartColor="#53A88A"
        gradientStopColor="#0DAEA2"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div11Ref}
        curvature={-10}
        gradientStartColor="#53A88A"
        gradientStopColor="#853bf4"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div12Ref}
        curvature={10}
        gradientStartColor="#53A88A"
        gradientStopColor="#E056FD"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div9Ref}
        toRef={div13Ref}
        curvature={30}
        gradientStartColor="#53A88A"
        gradientStopColor="#0DAEA2"
      />
    </div>
  );
}

const Icons = {
  openai: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="fill-white">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  ),
};
