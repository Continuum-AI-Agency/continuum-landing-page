import React from "react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";

interface HeroTypographyProps {
    text: string;
}

export function HeroTypography({ text }: HeroTypographyProps) {
    const words = text.split(" ");

    const getDelay = (index: number) => {
        // "Build" (0), "Continuity." (1) -> 1 second delay base
        // "Scale" (2), "Personalization." (3) -> 2 second delay base
        const startDelay = index < 2 ? 1.0 : 2.0;
        return startDelay + (index % 2) * 0.15; // staggering within the phrase
    };

    return (
        <motion.h2
            className="text-2xl md:text-5xl font-medium font-raleway text-center relative z-30 flex flex-wrap justify-center gap-x-2 md:gap-x-4 overflow-hidden"
            initial="hidden"
            animate="visible"
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    className="inline-block"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: "spring",
                        damping: 12,
                        stiffness: 100,
                        delay: getDelay(index)
                    }}
                >
                    {word === "Continuity." ? (
                        <span className="text-white font-bold">{word}</span>
                    ) : word === "Personalization." ? (
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold">{word}</span>
                    ) : (
                        <span className="text-gray-300">{word}</span>
                    )}
                </motion.span>
            ))}
        </motion.h2>
    );
}
