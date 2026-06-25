import { useRef, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

export type Accent = "cyan" | "violet" | "gold" | "silver";

const ACCENT_RGB: Record<Accent, string> = {
  cyan: "95,215,210",
  violet: "138,124,240",
  gold: "216,179,103",
  silver: "199,210,224",
};

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  accent?: Accent;
  /** Max tilt in degrees. 0 disables parallax tilt (used for large/long cards). */
  tilt?: number;
  /** Spotlight radius in px. */
  radius?: number;
  as?: "div" | "article" | "a";
  href?: string;
  ariaLabel?: string;
}

/**
 * SpotlightCard — the unified premium card interaction for the whole site.
 *
 * Layers, all driven by the cursor position (--mx/--my CSS vars):
 *   1. Border-light  — a conic/radial highlight tracing the edge near the cursor.
 *   2. Spotlight     — a soft radial glow that follows the pointer.
 *   3. Inner glow    — a faint local reflection inside the surface.
 *   4. Parallax tilt — subtle 3D rotation toward the cursor (perspective).
 *
 * Everything degrades gracefully: under prefers-reduced-motion the tilt is
 * disabled and glows become static-on-hover only.
 */
export default function SpotlightCard({
  children,
  className = "",
  accent = "cyan",
  tilt = 6,
  radius = 460,
  as = "div",
  href,
  ariaLabel,
}: SpotlightCardProps) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const rgb = ACCENT_RGB[accent];

  function handleMove(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    if (!reduced && tilt > 0) {
      const rx = (py - 0.5) * -2 * tilt;
      const ry = (px - 0.5) * 2 * tilt;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
    }
  }

  function handleLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  const style = {
    "--rgb": rgb,
    "--spot-r": `${radius}px`,
  } as CSSProperties;

  const commonProps = {
    ref: ref as React.Ref<HTMLElement>,
    "aria-label": ariaLabel,
    onPointerMove: handleMove,
    onPointerLeave: handleLeave,
    className: `spotlight-card ${className}`,
    style,
  };

  const inner = (
    <div className="spotlight-card__inner">
      {/* fine energy-texture lines that surface on hover */}
      <span aria-hidden className="spotlight-card__texture" />
      {/* border light */}
      <span aria-hidden className="spotlight-card__border" />
      {/* moving spotlight */}
      <span aria-hidden className="spotlight-card__glow" />
      {children}
    </div>
  );

  if (as === "a") {
    return (
      <a {...(commonProps as React.HTMLAttributes<HTMLAnchorElement> & { ref: React.Ref<HTMLAnchorElement> })} href={href}>
        {inner}
      </a>
    );
  }
  if (as === "article") {
    return <article {...(commonProps as React.HTMLAttributes<HTMLElement>)}>{inner}</article>;
  }
  return <div {...(commonProps as React.HTMLAttributes<HTMLDivElement>)}>{inner}</div>;
}
