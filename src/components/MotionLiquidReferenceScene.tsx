import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { createFullscreenProgram, type GLProgram } from "../lib/gl";
import { MOTION_LIQUID_FRAG } from "../lib/motionLiquidShader";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsMobile } from "../hooks/useIsMobile";

/**
 * MotionLiquidReferenceScene (EXPERIMENT)
 * -----------------------------------------------------------------------------
 * A lighter, reference-inspired liquid layer used to compare against our
 * production GlobalLiquidScene. It runs MOTION_LIQUID_FRAG (single displaced
 * blob + scroll-driven camera), which is cheaper than the 4-metaball body, so
 * it should sit closer to the reference page's smooth performance.
 *
 * Same integration contract as GlobalLiquidScene: a fixed, full-viewport canvas
 * (pointer-events:none) driven by a page-level scroll progress. Keeps our perf
 * discipline: renderScale, maxDpr 1.25, fps stages, visibility pause,
 * reduced-motion static frame, mobile low-quality. WebGL only (no Canvas2D
 * fallback in this experiment scene — it logs and renders nothing if WebGL is
 * unavailable, which is fine for a local comparison).
 */

interface Props {
  progress: MotionValue<number>;
}

const MAX_DPR = 1.25;

export default function MotionLiquidReferenceScene({ progress }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile(820);
  const isDev = import.meta.env.DEV;
  const [fpsLabel, setFpsLabel] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prog: GLProgram | null = createFullscreenProgram(canvas, MOTION_LIQUID_FRAG);
    if (!prog) {
      console.warn("[MotionLiquidReferenceScene] WebGL unavailable; rendering nothing.");
      return;
    }
    const { gl } = prog;

    const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
    let scroll = 0;
    let W = 0;
    let H = 0;
    const renderScale = isMobile ? 0.5 : 0.62;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.max(2, Math.floor(W * renderScale * dpr));
      canvas.height = Math.max(2, Math.floor(H * renderScale * dpr));
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const uRes = prog.uniform("u_res");
    const uTime = prog.uniform("u_time");
    const uMouse = prog.uniform("u_mouse");
    const uScroll = prog.uniform("u_scroll");
    const uQuality = prog.uniform("u_quality");

    let raf = 0;
    let running = true;
    let start = 0;
    let lastDraw = 0;
    let frames = 0;
    let fpsT = 0;

    const render = (tMs: number) => {
      if (!start) start = tMs;
      const t = (tMs - start) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;
      scroll = progress.get();

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reduced ? 6.0 : t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uScroll, scroll);
      gl.uniform1f(uQuality, isMobile ? 0.0 : scroll < 0.6 ? 1.0 : 0.0);
      prog.draw();
    };

    // Desktop targets 60fps in the visible zone; eases off only deep in scroll.
    const targetFpsFor = (s: number) => {
      if (isMobile) return 30;
      return s < 0.85 ? 60 : 30;
    };
    const PAST_END = 0.995;

    const loop = (tMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      scroll = progress.get();
      if (scroll >= PAST_END) return; // pause at the very end
      const interval = 1000 / targetFpsFor(scroll);
      if (tMs - lastDraw < interval) return;
      lastDraw = tMs;
      render(tMs);

      if (isDev) {
        frames++;
        if (tMs - fpsT >= 500) {
          const fps = Math.round((frames * 1000) / (tMs - fpsT));
          frames = 0;
          fpsT = tMs;
          setFpsLabel(
            `motionliquid · scale ${renderScale} · dpr ${dpr.toFixed(2)} · fps≈${fps} · s ${scroll.toFixed(2)}`
          );
        }
      }
    };

    if (reduced) render(0);
    else raf = requestAnimationFrame(loop);

    const onResize = () => resize();
    window.addEventListener("resize", onResize, { passive: true });

    const onMove = (e: PointerEvent) => {
      mouse.tx = (e.clientX / (W || window.innerWidth)) * 2 - 1;
      mouse.ty = -((e.clientY / (H || window.innerHeight)) * 2 - 1);
    };
    if (!reduced && !isMobile)
      window.addEventListener("pointermove", onMove, { passive: true });

    const unsub = progress.on("change", () => {
      if (reduced) render(0);
    });

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        lastDraw = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVis);
      unsub();
      prog.dispose();
    };
  }, [reduced, isMobile, progress, isDev]);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-0 h-screen w-screen"
        style={{ pointerEvents: "none" }}
      />
      {/* Global readability veil (same idea as production scene). */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 100% at 12% 45%, rgba(4,6,10,0.5), rgba(4,6,10,0.16) 42%, transparent 70%)",
        }}
      />
      {isDev && fpsLabel && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-[80] rounded-md border border-white/10 bg-black/70 px-3 py-2 font-mono text-[10px] text-accent-cyan/90 backdrop-blur">
          {fpsLabel}
        </div>
      )}
    </>
  );
}
