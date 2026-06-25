import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
} from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface SplitTextProps {
  text: string;
  className?: string;
  as?: ElementType;
  /** Start the reveal immediately on mount (hero) instead of waiting for scroll. */
  immediate?: boolean;
  /** Max random delay spread, ms. */
  spread?: number;
  delayBase?: number;
  /** Apply the holographic gradient per-character (avoids the parent
   *  background-clip:text + transformed-children WebKit repaint bug). */
  gradient?: boolean;
}

/**
 * SplitText — splits a string into per-character spans that rise into place in
 * a RANDOM order (a non-linear, liquid-like cascade rather than left-to-right).
 *
 * Robustness (important):
 *  - Characters are VISIBLE BY DEFAULT. The hidden start state is applied in a
 *    useLayoutEffect (before paint, so there is no flash) and only when motion
 *    is allowed — so if JS fails or is disabled, the full text simply shows.
 *  - The resting state is `transform:none; opacity:1`, and the gradient is
 *    applied PER CHARACTER (not on a clipped parent), which avoids the WebKit
 *    bug where gradient-clipped text wouldn't repaint over transformed glyphs
 *    (the cause of "Phia" being invisible until selected).
 *  - prefers-reduced-motion → text shown instantly, no animation.
 */
export default function SplitText({
  text,
  className = "",
  as,
  immediate = false,
  spread = 520,
  delayBase = 0,
  gradient = false,
}: SplitTextProps) {
  const Tag = (as ?? "span") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  // phase: "idle" = visible (safe default) · "prep" = hidden start · "go" = animate in
  const [phase, setPhase] = useState<"idle" | "prep" | "go">("idle");

  const chars = Array.from(text);
  const delays = useRef<number[]>([]);
  if (delays.current.length !== chars.length) {
    const order = [...chars.keys()];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const step = chars.length > 1 ? spread / chars.length : 0;
    delays.current = order.map((o) => delayBase + o * step);
  }

  // Snap to the hidden start state BEFORE the browser paints (no flash). Only
  // when motion is allowed; otherwise we stay "idle" = fully visible.
  useLayoutEffect(() => {
    if (reduced) {
      setPhase("idle");
      return;
    }
    setPhase("prep");
  }, [reduced, text]);

  useEffect(() => {
    if (reduced || phase !== "prep") return;

    if (immediate) {
      const r1 = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("go"))
      );
      return () => cancelAnimationFrame(r1);
    }

    const el = ref.current;
    if (!el) {
      setPhase("go");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setPhase("go");
            io.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    // Safety: if the observer never fires for any reason, reveal after a beat.
    const fallback = window.setTimeout(() => setPhase("go"), 1600);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [phase, immediate, reduced]);

  const stateClass =
    phase === "prep" ? "split-prep" : phase === "go" ? "split-go" : "";

  const gradientStyle: CSSProperties = gradient
    ? {
        backgroundImage:
          "linear-gradient(100deg,#eaf2ff 0%,#5fd7d2 42%,#c7d2e0 64%,#8a7cf0 100%)",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }
    : {};

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`split-line ${stateClass} ${className}`}
      aria-label={text}
    >
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="split-char"
          style={{ ["--d" as string]: `${delays.current[i]}ms`, ...gradientStyle }}
        >
          {c === " " ? " " : c}
        </span>
      ))}
    </Tag>
  );
}
