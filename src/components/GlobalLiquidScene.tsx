import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { createFullscreenProgram, type GLProgram } from "../lib/gl";
import { GLOBAL_LIQUID_FRAG } from "../lib/liquidShader";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useIsMobile } from "../hooks/useIsMobile";

/**
 * GlobalLiquidScene
 * -----------------------------------------------------------------------------
 * A single fixed, full-viewport WebGL liquid layer that the whole narrative zone
 * (Hero → Featured Work → Visual Lab → Dev Log) flows over. A native raymarched
 * fragment shader (no Three.js) renders one continuous liquid sculpture; a
 * page-level scroll progress (u_scroll) morphs it through stages and fades it
 * out as the narrative ends — so it never hard-cuts.
 *
 * PERFORMANCE (this revision is tuned to stay cool on a laptop):
 *  - renderScale: 0.6 desktop / 0.5 mobile (internal res; CSS upscales).
 *  - maxDpr: 1.25.
 *  - targetFps: 30, throttled via a frame-time accumulator; the loop further
 *    downgrades fps + raymarch quality as the liquid recedes with scroll:
 *      hero (s<0.33): 30fps, high quality
 *      work (s<0.66): 24fps, high quality
 *      lab  (s<0.85): 18fps, low quality (background)
 *      past (s>0.85): 12fps, low quality (faint residual)
 *  - Pauses entirely when the tab is hidden OR the layer is fully scrolled past
 *    (about/contact), and resumes on return.
 *  - reduced-motion → one static frame, no loop.
 *  - mobile / WebGL-missing → low quality or Canvas2D plasma fallback.
 *  - Dev-only debug overlay (import.meta.env.DEV) shows renderer/scale/dpr/fps/etc.
 */

interface GlobalLiquidSceneProps {
  progress: MotionValue<number>;
}

interface DebugInfo {
  mode: string;
  renderScale: number;
  dpr: number;
  targetFps: number;
  fps: number;
  scroll: number;
  quality: string;
  paused: boolean;
}

const MAX_DPR = 1.25;

export default function GlobalLiquidScene({ progress }: GlobalLiquidSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();
  const isMobile = useIsMobile(820);
  const isDev = import.meta.env.DEV;
  const [debug, setDebug] = useState<DebugInfo | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pointer = { tx: 0, ty: 0, x: 0, y: 0 };
    let scroll = 0;
    let W = 0;
    let H = 0;
    // renderScale is ADAPTIVE: starts at a sensible default, and the loop nudges
    // it down (not the framerate) if measured fps stays low, then back up if it
    // recovers. This keeps motion at high fps and spends the perf budget on
    // resolution instead of dropping to a choppy framerate.
    const BASE_SCALE = isMobile ? 0.5 : 0.62;
    const MIN_SCALE = isMobile ? 0.4 : 0.46;
    let renderScale = BASE_SCALE;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const prog: GLProgram | null = createFullscreenProgram(canvas, GLOBAL_LIQUID_FRAG);
    const mode = prog ? "webgl" : "canvas2d";

    let raf = 0;
    let running = true;
    let start = 0;
    let lastDraw = 0;

    // fps measurement + adaptive-quality state
    let frames = 0;
    let fpsT = 0;
    let measuredFps = 0;
    let lowStreak = 0;
    let highStreak = 0;

    // Per-scroll-stage settings. Desktop targets 60fps across the VISIBLE page
    // so motion stays genuinely smooth; perf is managed via renderScale + DPR +
    // raymarch step count (quality flag), NOT by dropping the visible framerate.
    // Only the far tail (liquid nearly gone) eases to a low refresh before pause.
    function stageFor(s: number): { fps: number; quality: number; label: string } {
      const hi = isMobile ? 30 : 60;
      if (s < 0.3) return { fps: hi, quality: 1, label: "hero/high" };
      if (s < 0.58) return { fps: hi, quality: 1, label: "work/high" };
      if (s < 0.8) return { fps: hi, quality: 0, label: "lab/med" };
      return { fps: isMobile ? 20 : 30, quality: 0, label: "tail/low" };
    }

    // Pause the loop only when scrolled essentially to the very end (the liquid
    // is at its 0.12 floor; pausing here saves power without a visible pop).
    const PAST_END = 0.995;

    function pushDebug(targetFps: number, quality: string, paused: boolean) {
      if (!isDev) return;
      setDebug({
        mode,
        renderScale,
        dpr: +dpr.toFixed(2),
        targetFps,
        fps: Math.round(measuredFps),
        scroll: +scroll.toFixed(2),
        quality,
        paused,
      });
    }

    /* ----------------------------- WebGL path ----------------------------- */
    if (prog) {
      const { gl } = prog;

      const resize = () => {
        W = window.innerWidth;
        H = window.innerHeight;
        const rw = Math.max(2, Math.floor(W * renderScale * dpr));
        const rh = Math.max(2, Math.floor(H * renderScale * dpr));
        canvas.width = rw;
        canvas.height = rh;
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        gl.viewport(0, 0, rw, rh);
      };
      resize();

      const uRes = prog.uniform("u_res");
      const uTime = prog.uniform("u_time");
      const uPointer = prog.uniform("u_pointer");
      const uScroll = prog.uniform("u_scroll");
      const uQuality = prog.uniform("u_quality");

      const render = (tMs: number, quality: number) => {
        if (!start) start = tMs;
        const t = (tMs - start) / 1000;
        pointer.x += (pointer.tx - pointer.x) * 0.06;
        pointer.y += (pointer.ty - pointer.y) * 0.06;
        scroll = progress.get();

        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, reduced ? 8.0 : t);
        gl.uniform2f(uPointer, pointer.x, -pointer.y);
        gl.uniform1f(uScroll, scroll);
        gl.uniform1f(uQuality, isMobile ? 0.0 : quality);
        prog.draw();
      };

      const loop = (tMs: number) => {
        if (!running) return;
        raf = requestAnimationFrame(loop);

        scroll = progress.get();
        const paused = scroll >= PAST_END;
        const stage = stageFor(scroll);
        const targetFps = stage.fps;

        if (paused) {
          pushDebug(targetFps, stage.label, true);
          return;
        }

        const interval = 1000 / targetFps;
        if (tMs - lastDraw < interval) return; // throttle
        lastDraw = tMs;

        render(tMs, stage.quality);

        // fps meter + ADAPTIVE renderScale: if we keep missing the target, drop
        // resolution a step (cheaper) instead of the framerate; recover when fps
        // is comfortably high again. Resolution changes reallocate the canvas.
        frames++;
        if (tMs - fpsT >= 500) {
          measuredFps = (frames * 1000) / (tMs - fpsT);
          frames = 0;
          fpsT = tMs;

          if (!isMobile && !reduced) {
            const want = targetFps * 0.75; // e.g. 45 when target is 60
            if (measuredFps < want) {
              lowStreak++;
              highStreak = 0;
              if (lowStreak >= 2 && renderScale > MIN_SCALE) {
                renderScale = Math.max(MIN_SCALE, renderScale - 0.08);
                lowStreak = 0;
                resize();
              }
            } else if (measuredFps > targetFps * 0.92) {
              highStreak++;
              lowStreak = 0;
              if (highStreak >= 6 && renderScale < BASE_SCALE) {
                renderScale = Math.min(BASE_SCALE, renderScale + 0.06);
                highStreak = 0;
                resize();
              }
            } else {
              lowStreak = 0;
              highStreak = 0;
            }
          }

          pushDebug(targetFps, stage.label, false);
        }
      };

      if (reduced) {
        scroll = progress.get();
        render(0, 1);
        pushDebug(0, "reduced/static", true);
      } else {
        raf = requestAnimationFrame(loop);
      }

      const onResize = () => resize();
      window.addEventListener("resize", onResize, { passive: true });

      const onPointerMove = (e: PointerEvent) => {
        pointer.tx = (e.clientX / (W || window.innerWidth) - 0.5) * 2;
        pointer.ty = (e.clientY / (H || window.innerHeight) - 0.5) * 2;
      };
      const onPointerLeave = () => {
        pointer.tx = 0;
        pointer.ty = 0;
      };
      if (!reduced && !isMobile) {
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.addEventListener("pointerleave", onPointerLeave);
      }

      // Re-render a frame on scroll under reduced-motion (no loop running).
      const unsub = progress.on("change", () => {
        if (reduced) {
          scroll = progress.get();
          render(0, 1);
        }
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
        window.removeEventListener("pointermove", onPointerMove);
        document.removeEventListener("pointerleave", onPointerLeave);
        document.removeEventListener("visibilitychange", onVis);
        unsub();
        prog.dispose();
      };
    }

    /* --------------------------- Canvas2D fallback ------------------------- */
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize2d = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize2d();

    const frame2d = (tMs: number) => {
      if (!start) start = tMs;
      const t = (tMs - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      scroll = progress.get();

      const cxN = isMobile ? 0.5 : 0.5 + (0.22 - 0.42 * Math.min(1, scroll));
      const cx = cxN * W + pointer.x * 36;
      const cy = (0.5 - 0.06 * Math.min(1, scroll)) * H + pointer.y * 26;
      const R = Math.min(W, H) * 0.42 * (1 - scroll * 0.18);
      const recede = 1 - Math.min(1, Math.max(0, (scroll - 0.78) / 0.22));

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      const blobs = [
        ["95,215,210", 0.0],
        ["138,124,240", 1.6],
        ["199,210,224", 3.1],
      ] as const;
      for (const [rgb, ph] of blobs) {
        const bx = cx + Math.sin(t * 0.45 + ph) * R * 0.3;
        const by = cy + Math.cos(t * 0.36 + ph) * R * 0.28;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, R);
        g.addColorStop(0, `rgba(${rgb},${0.5 * recede})`);
        g.addColorStop(0.5, `rgba(${rgb},${0.14 * recede})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, R, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop2d = (tMs: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop2d);
      scroll = progress.get();
      if (scroll >= PAST_END) {
        pushDebug(15, "residual/2d", true);
        return;
      }
      // Canvas2D is cheap; cap at 24fps (mobile 18).
      const targetFps = isMobile ? 18 : 24;
      if (tMs - lastDraw < 1000 / targetFps) return;
      lastDraw = tMs;
      frame2d(tMs);
      frames++;
      if (tMs - fpsT >= 500) {
        measuredFps = (frames * 1000) / (tMs - fpsT);
        frames = 0;
        fpsT = tMs;
        pushDebug(targetFps, "2d", false);
      }
    };

    if (reduced) frame2d(0);
    else raf = requestAnimationFrame(loop2d);

    const onResize2 = () => resize2d();
    window.addEventListener("resize", onResize2, { passive: true });
    const onMove2 = (e: PointerEvent) => {
      pointer.tx = (e.clientX / (W || window.innerWidth) - 0.5) * 2;
      pointer.ty = (e.clientY / (H || window.innerHeight) - 0.5) * 2;
    };
    if (!reduced && !isMobile)
      window.addEventListener("pointermove", onMove2, { passive: true });
    const unsub2 = progress.on("change", () => {
      if (reduced) frame2d(0);
    });
    const onVis2 = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        lastDraw = 0;
        raf = requestAnimationFrame(loop2d);
      }
    };
    document.addEventListener("visibilitychange", onVis2);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize2);
      window.removeEventListener("pointermove", onMove2);
      document.removeEventListener("visibilitychange", onVis2);
      unsub2();
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
      {/* ONE global, fixed readability veil for the whole site — a gentle
          left-weighted + bottom vignette that fades to transparent. Because it
          is fixed (travels with the viewport) and never fully opaque, it lifts
          text contrast everywhere WITHOUT creating per-section panels or any
          horizontal seam at section boundaries. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(120% 100% at 12% 45%, rgba(4,6,10,0.5), rgba(4,6,10,0.16) 42%, transparent 70%)",
        }}
      />
      {isDev && debug && (
        <div className="pointer-events-none fixed bottom-3 left-3 z-[80] rounded-md border border-white/10 bg-black/70 px-3 py-2 font-mono text-[10px] leading-relaxed text-accent-cyan/90 backdrop-blur">
          <div>renderer: {debug.mode}</div>
          <div>renderScale: {debug.renderScale} · maxDpr: {MAX_DPR} · dpr: {debug.dpr}</div>
          <div>
            targetFps: {debug.targetFps} · fps≈{debug.fps}
            {debug.paused ? " · PAUSED" : ""}
          </div>
          <div>
            scroll: {debug.scroll} · {debug.quality}
          </div>
        </div>
      )}
    </>
  );
}
