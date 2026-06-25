import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  className?: string;
  /** Pull strength 0..1 (fraction of cursor offset applied). */
  strength?: number;
  /** Activation radius in px. */
  radius?: number;
  target?: string;
  rel?: string;
}

/**
 * MagneticButton — an anchor that is gently "pulled" toward the cursor when the
 * pointer is within `radius`, then springs back on leave. Fine-pointer only;
 * under reduced-motion it renders a plain anchor with no movement.
 */
export default function MagneticButton({
  children,
  href = "#",
  className = "",
  strength = 0.3,
  radius = 130,
  target,
  rel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const reduced = useReducedMotion();

  function handleMove(e: React.PointerEvent) {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const bx = rect.left + rect.width / 2;
    const by = rect.top + rect.height / 2;
    const dx = e.clientX - bx;
    const dy = e.clientY - by;
    const dist = Math.hypot(dx, dy);
    if (dist < radius) {
      el.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
    } else {
      el.style.transform = "";
    }
  }

  function handleLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <a
      ref={ref}
      href={href}
      target={target}
      rel={rel}
      data-cursor
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`magnetic ${className}`}
    >
      {children}
    </a>
  );
}
