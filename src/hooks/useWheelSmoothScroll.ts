import { useEffect } from "react";
import {
  advanceSmoothScroll,
  clampScrollTarget,
  resolveWheelScrollDelta,
} from "../lib/smoothScrollMath";

interface WheelSmoothScrollOptions {
  enabled: boolean;
  ease?: number;
  multiplier?: number;
  snapThreshold?: number;
}

function wheelPixels(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 40;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function maxScrollY() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight
  );
}

export function useWheelSmoothScroll({
  enabled,
  ease = 0.12,
  multiplier = 1,
  snapThreshold = 0.35,
}: WheelSmoothScrollOptions) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.matchMedia) return;
    const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    if (!finePointer) return;

    let current = window.scrollY;
    let target = current;
    let raf = 0;

    const tick = () => {
      current = advanceSmoothScroll(current, target, ease, snapThreshold);
      window.scrollTo({ top: current, behavior: "auto" });
      raf = current === target ? 0 : window.requestAnimationFrame(tick);
    };

    const start = () => {
      if (!raf) raf = window.requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();

      current = window.scrollY;
      target = clampScrollTarget(
        target +
          resolveWheelScrollDelta(
            wheelPixels(event) * multiplier,
            window.innerHeight,
            current
          ),
        maxScrollY()
      );
      start();
    };

    const syncToNativeScroll = () => {
      if (raf) return;
      current = window.scrollY;
      target = current;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", syncToNativeScroll, { passive: true });
    window.addEventListener("resize", syncToNativeScroll, { passive: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", syncToNativeScroll);
      window.removeEventListener("resize", syncToNativeScroll);
    };
  }, [enabled, ease, multiplier, snapThreshold]);
}
