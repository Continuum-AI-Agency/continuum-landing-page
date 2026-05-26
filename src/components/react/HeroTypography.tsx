import React from "react";
import { motion } from "motion/react";

export function HeroTypography() {
    const line1 = ["Build", "Continuity."];
    const line2 = ["Scale", "Personalization."];

    const getDelay = (isLine2: boolean, index: number) => {
        const startDelay = isLine2 ? 2.0 : 1.0;
        return startDelay + index * 0.15;
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
                        {word === "Continuity." ? (
                            <span className="text-foreground font-bold">{word}</span>
                        ) : (
                            <span className="text-muted-foreground/80">{word}</span>
                        )}
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
                        {word === "Personalization." ? (
                            <span className="text-brand-violet font-bold">{word}</span>
                        ) : (
                            <span className="text-muted-foreground/80">{word}</span>
                        )}
                    </motion.span>
                ))}
            </div>
        </h1>
    );
}
