'use client';

import { motion } from 'motion/react';

/** Rises into place once, the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ type: 'spring', stiffness: 80, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}
