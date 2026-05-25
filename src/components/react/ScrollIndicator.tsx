import React from 'react';
import { motion } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react';

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
                className="p-2.5 rounded-full bg-transparent border border-white/5 group-hover:border-white/25 group-hover:bg-white/5 transition-all duration-300 flex items-center justify-center"
            >
                <CaretDown 
                    size={16} 
                    className="text-white/30 group-hover:text-white/80 transition-colors" 
                    weight="light"
                />
            </motion.div>
        </div>
    );
}
