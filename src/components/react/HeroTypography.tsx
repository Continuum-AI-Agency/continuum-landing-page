import React from "react";
import { motion } from "motion/react";

type Word = { text: string; muted?: boolean; accent?: boolean };

export function HeroTypography() {
    const line1: Word[] = [
        { text: "Right", muted: true },
        { text: "message,", muted: false },
        { text: "right", muted: true },
        { text: "audience,", muted: false },
        { text: "right", muted: true },
        { text: "moment.", muted: false },
    ];
    const line2: Word[] = [
        { text: "Better", muted: false },
        { text: "conversion.", accent: true },
    ];

    const getDelay = (isLine2: boolean, index: number) => {
        const startDelay = isLine2 ? 1.4 : 0.6;
        return startDelay + index * 0.12;
    };

    const colorFor = (word: Word) => {
        if (word.accent) return "text-brand-violet font-bold";
        if (word.muted) return "text-muted-foreground/80";
        return "text-foreground font-bold";
    };

    return (
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display text-center relative z-30 tracking-tight leading-none uppercase flex flex-col gap-2 md:gap-4 select-none">
            {/* Line 1 */}
            <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-4 overflow-hidden py-1">
                {line1.map((word, index) => (
                    <motion.span
                        key={`l1-${index}`}
                        className="inline-block"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            damping: 14,
                            stiffness: 100,
                            delay: getDelay(false, index)
                        }}
                    >
                        <span className={colorFor(word)}>{word.text}</span>
                    </motion.span>
                ))}
            </div>

            {/* Line 2 */}
            <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-4 overflow-hidden py-1">
                {line2.map((word, index) => (
                    <motion.span
                        key={`l2-${index}`}
                        className="inline-block"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            damping: 14,
                            stiffness: 100,
                            delay: getDelay(true, index)
                        }}
                    >
                        <span className={colorFor(word)}>{word.text}</span>
                    </motion.span>
                ))}
            </div>
        </h1>
    );
}
