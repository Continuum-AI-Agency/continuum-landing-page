"use client";

import React, { useState } from "react";
import { motion } from "motion/react";

export function BentoPerformanceChart() {
    const [isOptimized, setIsOptimized] = useState(false);

    // Chart data: paired lines [Before, After (Continuum)]
    const datasets = [
        { label: "W1", before: 30, after: 30 },
        { label: "W2", before: 45, after: 55 },
        { label: "W3", before: 35, after: 80 },
        { label: "W4", before: 40, after: 95 },
    ];

    const generateSmoothPath = (data: typeof datasets, key: 'before' | 'after') => {
        let path = `M 0 ${100 - data[0][key]}`;
        for (let i = 0; i < data.length - 1; i++) {
            const x0 = (i / 3) * 200;
            const y0 = 100 - data[i][key];
            const x1 = ((i + 1) / 3) * 200;
            const y1 = 100 - data[i + 1][key];
            const cpX = (x0 + x1) / 2;
            path += ` C ${cpX} ${y0}, ${cpX} ${y1}, ${x1} ${y1}`;
        }
        return path;
    };

    const pathBefore = generateSmoothPath(datasets, "before");
    const pathAfter = generateSmoothPath(datasets, "after");
    const fillAfter = `${pathAfter} L 200 100 L 0 100 Z`;

    return (
        <motion.div
            className="relative w-full h-full flex flex-col p-6 bg-slate-900/50 rounded-b-3xl overflow-hidden justify-center gap-6 cursor-pointer"
            onViewportEnter={() => setIsOptimized(true)}
            onViewportLeave={() => setIsOptimized(false)}
            viewport={{ once: false, amount: 0.5 }}
        >
            {/* Chart Header */}
            <div className="flex items-end justify-between w-full mb-4 z-20">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground tracking-normal font-semibold">Advantage+ Outcomes</span>
                    <motion.div
                        layout
                        className={`text-2xl font-bold font-mono transition-colors duration-500 ${isOptimized ? 'text-success' : 'text-muted-foreground'}`}
                    >
                        {isOptimized ? "2x" : "1x"}
                    </motion.div>
                </div>

                <div className="flex items-center gap-3 text-[9px] font-medium tracking-normal text-muted-foreground">
                    <div className="flex items-center gap-1 font-sans">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40"></div>
                        Before
                    </div>
                    <div className={`flex items-center gap-1 transition-opacity duration-500 font-sans ${isOptimized ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="w-2 h-2 rounded-full bg-success"></div>
                        Continuum
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="relative w-full h-32 border-b border-l border-border pb-1 pl-1 z-10 flex flex-col justify-end">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="w-full border-t border-border/20"></div>
                    <div className="w-full border-t border-border/20"></div>
                    <div className="w-full border-t border-border/20"></div>
                    <div className="w-full"></div>
                </div>

                {/* SVG Lines */}
                <svg viewBox="0 -10 200 120" className="absolute inset-x-0 bottom-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--cs-success)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--cs-success)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Before Line */}
                    <path
                        d={pathBefore}
                        fill="none"
                        stroke="var(--cs-muted-fg)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Continuum Fill */}
                    <motion.path
                        d={fillAfter}
                        fill="url(#greenGradient)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isOptimized ? 1 : 0 }}
                        transition={{ duration: 1.2, delay: 0.3 }}
                    />

                    {/* Continuum Line */}
                    <motion.path
                        d={pathAfter}
                        fill="none"
                        stroke="var(--cs-success)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: isOptimized ? 1 : 0, opacity: isOptimized ? 1 : 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />

                    {/* Points for Continuum */}
                    {datasets.map((d, i) => (
                        <motion.circle
                            key={`point-${i}`}
                            cx={(i / 3) * 200}
                            cy={100 - d.after}
                            r="3.5"
                            fill="var(--background)"
                            stroke="var(--cs-success)"
                            strokeWidth="2"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: isOptimized ? 1 : 0, scale: isOptimized ? 1 : 0 }}
                            transition={{ duration: 0.6, delay: 0.3 + (i * 0.3) }}
                        />
                    ))}
                </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between w-full mt-2 pl-1 z-20 relative font-mono">
                {datasets.map(d => <span key={d.label} className="text-[9px] text-muted-foreground/60 text-center">{d.label}</span>)}
            </div>
        </motion.div>
    );
}
