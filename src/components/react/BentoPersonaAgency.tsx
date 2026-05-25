"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { TrendUp, ArrowsClockwise, Pulse, TerminalWindow } from "@phosphor-icons/react";

export function BentoPersonaAgency() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex flex-col md:flex-row-reverse w-full rounded-xl bg-card border border-border/40 shadow-[0_1px_3px_oklch(0%_0_0_/_40%),_inset_0_1px_0_oklch(100%_0_0_/_8%)] hover:border-primary/30 transition-all duration-500 overflow-hidden cursor-pointer mt-6"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Right Col: Text (50%) - Reversed in DOM but placed on right visually */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                        <TrendUp size={20} className="text-success" />
                    </div>
                    <h4 className="text-xl md:text-2xl font-bold text-foreground font-display uppercase tracking-tight">Performance Agencies</h4>
                </div>
                <p className="text-muted-foreground text-sm md:text-base mb-8 font-sans leading-relaxed max-w-md relative z-10">
                    Keep creative testing in lockstep with media optimization. Ship more concepts, test faster, and let the data find the winners.
                </p>
                <ul className="space-y-4 relative z-10 font-sans">
                    <li className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <div className="p-1 rounded-full bg-success/20 text-success"><ArrowsClockwise size={14} /></div>
                        Real-time performance-to-brief automation
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <div className="p-1 rounded-full bg-success/20 text-success"><TrendUp size={14} /></div>
                        Wait-free ROAS-driven concept generation
                    </li>
                </ul>
            </div>

            {/* Left Col: Visual Interactive (50%) */}
            <div className="md:w-1/2 relative min-h-[300px] border-t md:border-t-0 md:border-r border-border/40 bg-background/50 flex items-center justify-center overflow-hidden">

                {/* DEFAULT STATE: Surface UI (Fade out on hover) */}
                <motion.div
                    animate={{ opacity: isHovered ? 0 : 1, filter: isHovered ? "blur(8px)" : "blur(0px)" }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                    <div className="w-64 bg-background border border-border/40 rounded-xl shadow-sm flex flex-col overflow-hidden relative top-4">
                        <div className="bg-muted/80 p-3 flex justify-between items-center border-b border-border/20">
                            <span className="text-[10px] font-bold text-muted-foreground font-sans">Campaign Overview</span>
                            <span className="text-[9px] px-2 py-0.5 bg-success/20 text-success rounded-full border border-success/30 font-mono">Active</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-end border-b border-border/20 pb-2">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider mb-1 font-sans">Total Spend</span>
                                    <span className="text-lg font-mono font-bold text-foreground">$12.4k</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-muted-foreground/60 uppercase tracking-wider mb-1 font-sans">CPA</span>
                                    <span className="text-lg font-mono font-bold text-success">$34.10</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-success w-3/4 h-full rounded-full"></div>
                                </div>
                                <span className="text-[9px] text-muted-foreground font-mono">75%</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* X-RAY STATE: Blueprint Node Graph (Fade in on hover) */}
                <motion.div
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.95 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 z-10 p-6 flex flex-col items-center justify-center"
                >
                    {/* Blueprint Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(68%_0.11_150_/_0.08)_1px,transparent_1px),linear-gradient(to_bottom,oklch(68%_0.11_150_/_0.08)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

                    {/* Server/Data Ticker Display */}
                    <div className="relative w-[90%] h-[70%] border border-success/30 bg-background/80 rounded shadow-sm flex flex-col p-4 pt-10 font-mono text-[10px] text-success overflow-hidden">

                        {/* Fake Console Header */}
                        <div className="absolute top-0 left-0 right-0 h-6 border-b border-success/30 bg-success/10 flex items-center px-3 gap-2">
                            <TerminalWindow size={10} className="text-success" />
                            <span className="text-success/80">roas_opt_engine_v3.bin</span>
                        </div>
                        
                        {/* Animated Code Streams */}
                        <div className="flex flex-col gap-2 mt-2">
                            <motion.div
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: isHovered ? [0, 1, 0.8] : 0, x: isHovered ? 0 : -10 }} transition={{ duration: 0.3, delay: 0.1 }}
                            >
                                {">"} Connecting to Meta API... [SUCCESS]
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: isHovered ? [0, 1, 0.8] : 0, x: isHovered ? 0 : -10 }} transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                {">"} Parsing Concept B metrics... CTR +4.2%
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: isHovered ? [0, 1, 0.8] : 0, x: isHovered ? 0 : -10 }} transition={{ duration: 0.3, delay: 0.5 }}
                                className="text-foreground"
                            >
                                {">"} ALLOCATING BUDGET -{">"} ASSET_ID_992
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isHovered ? [0, 1, 0] : 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                                className="mt-4 flex items-center gap-2"
                            >
                                <span className="w-2 h-4 bg-success inline-block"></span>
                            </motion.div>
                        </div>

                        {/* Big flashing green status */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                            transition={{ type: "spring", delay: 0.6 }}
                            className="absolute bottom-4 right-4 border border-success bg-success/20 px-3 py-1 text-success uppercase tracking-widest font-bold shadow-sm flex items-center gap-2 font-mono"
                        >
                            <Pulse size={12} className="animate-pulse" />
                            Optimizing
                        </motion.div>

                    </div>
                </motion.div>

            </div>
        </div>
    );
}
