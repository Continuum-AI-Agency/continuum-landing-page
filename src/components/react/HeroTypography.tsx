import React from "react";
import { motion } from "motion/react";
import { FlipWords } from "@/components/ui/flip-words";

const PHRASES = [
    "AI Marketing Agency",
    "AI Community Management",
    "AI Native Personalization",
    "AI Native DCO",
    "AI Content Creation",
];

export function HeroTypography() {
    const leadIn = ["is", "your"];

    const getDelay = (index: number) => 0.6 + index * 0.12;

    return (
        <h1 className="font-medium font-display text-center relative z-30 tracking-tight leading-none flex flex-col items-center gap-2 md:gap-4 select-none">
            {/* Lead-in — small, muted, staggered entrance */}
            <div className="flex flex-wrap justify-center gap-x-2 md:gap-x-3 overflow-hidden py-2 text-xl sm:text-2xl md:text-3xl text-muted-foreground/80 font-medium tracking-normal">
                {leadIn.map((word, index) => (
                    <motion.span
                        key={`lead-${index}`}
                        className="inline-block"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            damping: 14,
                            stiffness: 100,
                            delay: getDelay(index),
                        }}
                    >
                        {word}
                    </motion.span>
                ))}
            </div>

            {/* Flip line — its own line, reserved height so length variance re-centers */}
            <motion.div
                className="flex justify-center items-center text-center min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem] lg:min-h-[5.5rem]"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 16, stiffness: 100, delay: 1.0 }}
            >
                <FlipWords
                    words={PHRASES}
                    duration={2800}
                    className="shimmer-text font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.15] pb-[0.2em]"
                />
            </motion.div>
        </h1>
    );
}
