import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "header";
}

/**
 * Reveal — gentle fade/slide-in on scroll. Framer Motion automatically respects
 * prefers-reduced-motion via the global MotionConfig set in App, so animations
 * collapse to instant when the user opts out.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 22,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
