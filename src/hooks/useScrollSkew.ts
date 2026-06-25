import { useEffect } from "react";
import {
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useMotionValueEvent,
  type MotionValue,
} from "framer-motion";

/**
 * useScrollSkew — derives a small, clamped skew (deg) from scroll velocity.
 * Used to give cards a subtle "drag" when the page is flung, then settle. The
 * value is spring-smoothed so it eases back to 0 naturally.
 *
 * Returns a MotionValue<number> (degrees). Components can bind it to skewY.
 * Reduced-motion: callers should simply not apply it (the value still exists
 * but stays near 0 because we damp hard).
 */
export function useScrollSkew(max = 4): MotionValue<number> {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Map raw px/s velocity to a small degree range.
  const skewRaw = useTransform(velocity, [-2500, 0, 2500], [-max, 0, max], {
    clamp: true,
  });
  const skew = useSpring(skewRaw, { stiffness: 220, damping: 32, mass: 0.4 });
  return skew;
}

/**
 * useScrollVelocityVar — writes the spring skew to a CSS custom property on
 * <documentElement> so plain CSS / many elements can read it without each
 * subscribing. Optional convenience; not required by useScrollSkew users.
 */
export function useScrollVelocityVar(name = "--scroll-skew", max = 4) {
  const skew = useScrollSkew(max);
  useMotionValueEvent(skew, "change", (v) => {
    document.documentElement.style.setProperty(name, `${v.toFixed(2)}deg`);
  });
  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty(name);
    };
  }, [name]);
}
