"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function BentoSocialCalendar() {
    const [isFilled, setIsFilled] = useState(false);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const postDays = [0, 2, 4]; // Mon, Wed, Fri

    return (
        <motion.div
            className="relative w-full h-full flex flex-col justify-center px-4 bg-background/20 rounded-b-3xl overflow-hidden cursor-pointer pb-6 pt-6"
            onViewportEnter={() => setIsFilled(true)}
            onViewportLeave={() => setIsFilled(false)}
            viewport={{ once: false, amount: 0.5 }}
        >
            {/* Background Calendar Grid */}
            <div className="flex justify-between w-full mb-2 px-2">
                {days.map((day, i) => (
                    <div key={day} className="flex flex-col items-center gap-2 w-1/5">
                        <span className="text-[10px] text-muted-foreground/60 font-semibold font-sans">{day}</span>
                        <div className="relative w-full h-32 bg-muted/50 border border-border/30 rounded-md">
                            <AnimatePresence>
                                {isFilled && postDays.includes(i) && (
                                    <motion.div
                                        initial={{ y: -50, opacity: 0, scale: 0.8 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        exit={{ y: 10, opacity: 0, scale: 0.8 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 20,
                                            delay: i * 0.15,
                                        }}
                                        className="absolute inset-x-1 top-2 bottom-2 bg-brand-violet/10 border border-brand-violet/35 rounded shadow-sm flex flex-col p-1.5"
                                    >
                                        <div className="w-full h-1/2 bg-brand-violet/20 rounded-sm mb-1" />
                                        <div className="w-3/4 h-1 bg-brand-violet/50 rounded-full mb-1" />
                                        <div className="w-1/2 h-1 bg-brand-violet/30 rounded-full" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
