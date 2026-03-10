"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "fade" | "scale";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  once?: boolean;
}

function getVariants(direction: Direction, distance = 40): Variants {
  const offsets: Record<Direction, { x?: number; y?: number; scale?: number }> = {
    up:    { y: distance },
    down:  { y: -distance },
    left:  { x: distance },
    right: { x: -distance },
    fade:  {},
    scale: { scale: 0.88 },
  };

  const offset = offsets[direction];

  return {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
    },
  };
}

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  threshold = 0.15,
  className,
  once = true,
}: ScrollRevealProps) {
  const variants = getVariants(direction);

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={variants}
      transition={{
        delay,
        duration,
        ease: [0.22, 1, 0.36, 1], // custom ease — snappy then smooth
      }}
    >
      {children}
    </motion.div>
  );
}
