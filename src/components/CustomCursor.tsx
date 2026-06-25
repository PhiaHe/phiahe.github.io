import { useEffect, useRef } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * CustomCursor — a refined trailing ring + dot for fine-pointer devices.
 *
 * Design choice: unlike the reference site, we do NOT hide the native system
 * cursor. Hiding it hurts usability/accessibility on a portfolio. Instead the
 * ring augments the real cursor: it trails with easing, grows over interactive
 * elements, and tints to the brand cyan. Disabled on touch and reduced-motion.
 *
 * Interactive targets are detected via `a, button, [data-cursor]`.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (!fine) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let rx = cx;
    let ry = cy;
    let raf = 0;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
      dot.style.transform = `translate3d(${cx - 3}px,${cy - 3}px,0)`;
    };

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element)?.closest?.("a,button,[data-cursor]");
      ring.classList.toggle("cursor-ring--hover", !!target);
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const loop = () => {
      rx += (cx - rx) * 0.16;
      ry += (cy - ry) * 0.16;
      const r = ring.offsetWidth / 2;
      ring.style.transform = `translate3d(${rx - r}px,${ry - r}px,0)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerout", (e) => {
      if (!e.relatedTarget) onLeave();
    });
    window.addEventListener("blur", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("blur", onLeave);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
