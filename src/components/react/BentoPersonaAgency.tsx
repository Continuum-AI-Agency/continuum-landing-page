"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, RefreshCw, Activity, Terminal } from "lucide-react";

export function BentoPersonaAgency() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex flex-col md:flex-row-reverse w-full rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-green-500/30 hover:shadow-[0_0_40px_-10px_rgba(57,211,83,0.15)] transition-all duration-500 overflow-hidden cursor-pointer mt-6"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Right Col: Text (50%) - Reversed in DOM but placed on right visually */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                        </svg>
                    </div>
                    <h4 className="text-xl md:text-2xl font-bold text-white font-futura uppercase tracking-tight">Performance Agencies</h4>
                </div>
                <p className="text-slate-400 text-sm md:text-base mb-8 font-raleway leading-relaxed max-w-md relative z-10">
                    Keep creative testing in lockstep with media optimization. Ship more concepts, test faster, and let the data find the winners.
                </p>
                <ul className="space-y-4 relative z-10">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <div className="p-1 rounded-full bg-green-500/20 text-green-400"><RefreshCw size={14} /></div>
                        Real-time performance-to-brief automation
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <div className="p-1 rounded-full bg-green-500/20 text-green-400"><TrendingUp size={14} /></div>
                        Wait-free ROAS-driven concept generation
                    </li>
                </ul>
            </div>

            {/* Left Col: Visual Interactive (50%) */}
            <div className="md:w-1/2 relative min-h-[300px] border-t md:border-t-0 md:border-r border-white/5 bg-slate-900/50 flex items-center justify-center overflow-hidden">

                {/* DEFAULT STATE: Surface UI (Fade out on hover) */}
                <motion.div
                    animate={{ opacity: isHovered ? 0 : 1, filter: isHovered ? "blur(8px)" : "blur(0px)" }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                    <div className="w-64 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden relative top-4">
                        <div className="bg-slate-800/80 p-3 flex justify-between items-center border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-300">Campaign Overview</span>
                            <span className="text-[9px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">Active</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                            <div className="flex justify-between items-end border-b border-slate-700/50 pb-2">
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">Total Spend</span>
                                    <span className="text-lg font-mono font-bold text-white">$12.4k</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">CPA</span>
                                    <span className="text-lg font-mono font-bold text-green-400">$34.10</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-green-500 w-3/4 h-full rounded-full"></div>
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono">75%</span>
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
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#3fb95015_1px,transparent_1px),linear-gradient(to_bottom,#3fb95015_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>

                    {/* Server/Data Ticker Display */}
                    <div className="relative w-[90%] h-[70%] border border-green-500/30 bg-[#0d1117]/80 rounded shadow-[inset_0_0_20px_rgba(57,211,83,0.1)] flex flex-col p-4 pt-10 font-mono text-[10px] text-green-500 overflow-hidden">

                        {/* Fake Console Header */}
                        <div className="absolute top-0 left-0 right-0 h-6 border-b border-green-500/30 bg-green-500/10 flex items-center px-3 gap-2">
                            <Terminal size={10} className="text-green-400" />
                            <span className="text-green-400/80">roas_opt_engine_v3.bin</span>
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
                                className="text-white"
                            >
                                {">"} ALLOCATING BUDGET -{">"} ASSET_ID_992
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isHovered ? [0, 1, 0] : 0 }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                                className="mt-4 flex items-center gap-2"
                            >
                                <span className="w-2 h-4 bg-green-500 inline-block"></span>
                            </motion.div>
                        </div>

                        {/* Big flashing green status */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
                            transition={{ type: "spring", delay: 0.6 }}
                            className="absolute bottom-4 right-4 border border-green-500 bg-green-500/20 px-3 py-1 text-green-400 uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(57,211,83,0.5)] flex items-center gap-2"
                        >
                            <Activity size={12} className="animate-pulse" />
                            Optimizing
                        </motion.div>

                    </div>
                </motion.div>

            </div>
        </div>
    );
}
