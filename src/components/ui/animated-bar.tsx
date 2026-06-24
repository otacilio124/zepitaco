"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export function AnimatedBar({
  percentage,
  color,
  delay = 0,
  className,
}: {
  percentage: number;
  color: string;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref} className={`h-full overflow-hidden ${className}`}>
      <motion.div
        className={`h-full ${color}`}
        initial={{ width: 0 }}
        animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}
