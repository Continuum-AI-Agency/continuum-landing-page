"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Image as ImageIcon } from "@phosphor-icons/react";

export function BentoStudioCanvas() {
    const [isGenerated, setIsGenerated] = useState(false);

    const variants = [
        { id: "1x1", label: "Instagram Square (1:1)", w: 80, h: 80, x: -90, y: -40 },
        { id: "9x16", label: "TikTok (9:16)", w: 70, h: 120, x: 0, y: -60 },
        { id: "16x9", label: "YouTube (16:9)", w: 110, h: 62, x: 90, y: -30 },
    ];

    return (
        <motion.div
            className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-background/20 rounded-b-3xl cursor-pointer"
            onViewportEnter={() => setIsGenerated(true)}
            onViewportLeave={() => setIsGenerated(false)}
            viewport={{ once: false, amount: 0.5 }}
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(65%_0.13_180_/_0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(65%_0.13_180_/_0.06)_1px,transparent_1px)] bg-[size:14px_14px]"></div>

            {/* Main Asset Area */}
            <div className="relative z-10 flex h-3/4 items-center justify-center w-full">
                {/* Central Source Asset */}
                <motion.div
                    layout
                    initial={{ scale: 1, y: 0 }}
                    animate={{
                        scale: isGenerated ? 0.6 : 1,
                        y: isGenerated ? 40 : 0,
                        opacity: isGenerated ? 0.5 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute z-20 flex flex-col items-center justify-center w-32 h-32 bg-muted border border-border/40 rounded-xl shadow-sm"
                >
                    <ImageIcon className="text-muted-foreground/60 mb-2" size={24} />
                    <span className="text-[10px] font-medium text-muted-foreground font-sans">Master Asset</span>
                </motion.div>

                {/* Generated Variants */}
                <AnimatePresence>
                    {isGenerated &&
                        variants.map((variant, i) => (
                            <motion.div
                                key={variant.id}
                                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    x: variant.x,
                                    y: variant.y,
                                }}
                                exit={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25,
                                    delay: i * 0.15,
                                }}
                                style={{ width: variant.w, height: variant.h }}
                                className="absolute z-30 flex items-center justify-center bg-primary/10 border border-primary/20 rounded-lg shadow-sm backdrop-blur-sm"
                            >
                                <div className="flex flex-col items-center justify-center space-y-1">
                                    <Play className="text-primary w-4 h-4" />
                                    <span className="text-[8px] text-primary/80 font-mono tracking-tighter">
                                        {variant.id}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
