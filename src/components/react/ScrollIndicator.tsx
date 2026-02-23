import React from 'react';
import { motion } from 'framer-motion';

export function ScrollIndicator() {
    const scrollToNext = () => {
        document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 cursor-pointer group p-4"
            onClick={scrollToNext}
        >
            <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors flex items-center justify-center"
            >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-white/70 group-hover:text-white transition-colors">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </motion.div>
        </div>
    );
}
