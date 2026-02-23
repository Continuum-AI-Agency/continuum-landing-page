"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Image as ImageIcon, Layers, Zap, Workflow } from "lucide-react";

export function BentoPersonaCreative() {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="flex flex-col md:flex-row w-full rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-blue-500/30 hover:shadow-[0_0_40px_-10px_rgba(47,129,247,0.15)] transition-all duration-500 overflow-hidden cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Left Col: Text (50%) */}
            <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                    </div>
                    <h4 className="text-xl md:text-2xl font-bold text-white font-futura uppercase tracking-tight">In-house & Creative Teams</h4>
                </div>
                <p className="text-slate-400 text-sm md:text-base mb-8 font-raleway leading-relaxed max-w-md relative z-10">
                    Build one creative system for all your channels. Maintain control without slowing down, giving your team their time back.
                </p>
                <ul className="space-y-4 relative z-10">
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <div className="p-1 rounded-full bg-blue-500/20 text-blue-400"><Layers size={14} /></div>
                        Centralized creative library
                    </li>
                    <li className="flex items-center gap-3 text-sm font-medium text-slate-300">
                        <div className="p-1 rounded-full bg-blue-500/20 text-blue-400"><Zap size={14} /></div>
                        Template-driven automated production
                    </li>
                </ul>
            </div>

            {/* Right Col: Visual Interactive (50%) */}
            <div className="md:w-1/2 relative min-h-[300px] border-t md:border-t-0 md:border-l border-white/5 bg-slate-900/50 flex items-center justify-center overflow-hidden">

                {/* DEFAULT STATE: Surface UI (Fade out on hover) */}
                <motion.div
                    animate={{ opacity: isHovered ? 0 : 1, filter: isHovered ? "blur(8px)" : "blur(0px)" }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                    <div className="w-64 h-40 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl flex flex-col p-4 relative top-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace</div>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-400/50"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400/50"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400/50"></div>
                            </div>
                        </div>
                        <div className="flex gap-3 h-full pb-2">
                            <div className="w-1/3 bg-slate-800/50 rounded flex items-center justify-center"><ImageIcon size={16} className="text-slate-500" /></div>
                            <div className="w-2/3 flex flex-col gap-2">
                                <div className="h-4 bg-slate-800/80 rounded w-full"></div>
                                <div className="h-4 bg-slate-800/50 rounded w-3/4"></div>
                                <div className="h-4 bg-blue-500/20 rounded w-1/2 mt-auto border border-blue-500/30"></div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* X-RAY STATE: Blueprint Node Graph (Fade in on hover) */}
                <motion.div
                    animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.95 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute inset-0 z-10 p-6 flex items-center justify-center"
                >
                    {/* Blueprint Background Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#2f81f715_1px,transparent_1px),linear-gradient(to_bottom,#2f81f715_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                    {/* Nodes Container */}
                    <div className="relative w-[320px] h-[300px] flex items-center justify-center">
                        {/* Source Node */}
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center">
                            <div className="w-10 h-10 border border-blue-400/50 bg-blue-900/20 rounded-lg shadow-[0_0_15px_rgba(47,129,247,0.3)] flex items-center justify-center text-blue-400 relative z-20">
                                <Workflow size={16} />
                            </div>
                            <span className="text-[8px] uppercase tracking-widest text-blue-400 mt-2 font-mono">Input</span>
                        </div>

                        {/* Animated Connecting Lines and Boxes (visible only on hover) */}
                        <svg className="absolute inset-0 w-full h-full z-10" style={{ pointerEvents: 'none' }}>
                            {/* Connection Lines */}
                            {[
                                "M 56 150 C 118 150, 118 86, 180 86",
                                "M 56 150 L 180 150",
                                "M 56 150 C 118 150, 118 214, 180 214"
                            ].map((path, i) => (
                                <motion.path
                                    key={`path-${i}`}
                                    d={path}
                                    fill="none"
                                    stroke="#2f81f7"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: isHovered ? 1 : 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 + (i * 0.15) }}
                                />
                            ))}

                            {/* Output Box Outlines */}
                            {[70, 134, 198].map((y, i) => (
                                <motion.rect
                                    key={`rect-${i}`}
                                    x="180"
                                    y={y}
                                    width="32"
                                    height="32"
                                    rx="6"
                                    fill="#0f172a"
                                    stroke="#2f81f7"
                                    strokeWidth="1.5"
                                    initial={{ pathLength: 0, fillOpacity: 0 }}
                                    animate={{
                                        pathLength: isHovered ? 1 : 0,
                                        fillOpacity: isHovered ? 0.8 : 0
                                    }}
                                    transition={{ duration: 0.4, delay: 0.5 + (i * 0.15) }}
                                />
                            ))}
                        </svg>

                        {/* Rendering Nodes (Right side HTML content) */}
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-8">
                            {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: isHovered ? 1 : 0 }}
                                    transition={{ duration: 0.4, delay: 0.7 + (i * 0.15) }}
                                    className="flex items-center gap-3 relative z-20 pointer-events-none"
                                >
                                    <div className="w-8 h-8 flex items-center justify-center text-blue-400">
                                        <ImageIcon size={14} className="opacity-80 drop-shadow-md" />
                                    </div>
                                    <div className="flex flex-col gap-1.5 pt-0.5">
                                        <div className="w-16 h-1 bg-blue-500/40 rounded-full"></div>
                                        <div className="w-10 h-1 bg-slate-600/60 rounded-full"></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}
