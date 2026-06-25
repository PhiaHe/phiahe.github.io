/* =============================================================================
 * BrandLogo — renders the official Phia Games PNG brand assets.
 * -----------------------------------------------------------------------------
 * These PNGs in /public/brand/ are the provided brand assets — used as-is.
 * This component only maps (variant, tone) → the correct file. It does NOT
 * redraw, vectorize, recrop, or restyle the artwork.
 *
 * Sizing is done with height + width:auto (object-contain) so the original
 * aspect ratio is never distorted.
 * ============================================================================= */

type Variant = "lockup" | "mark" | "wordmark" | "display";
type Tone = "light" | "dark";

interface BrandLogoProps {
  variant?: Variant;
  tone?: Tone;
  className?: string;
  /** Accessible name; defaults to "Phia Games". Decorative uses pass "". */
  alt?: string;
  /** Hint the browser to prioritize (navbar/hero) or lazy-load (footer). */
  priority?: boolean;
}

// (variant, tone) → file under /public/brand/. Only assets that exist are mapped.
const SRC: Record<Variant, Record<Tone, string>> = {
  lockup: {
    light: "/brand/logo-lockup-horizontal-white.png",
    dark: "/brand/logo-lockup-horizontal-black.png",
  },
  mark: {
    light: "/brand/logo-mark-white.png",
    dark: "/brand/logo-mark-black.png",
  },
  wordmark: {
    // Only the white wordmark PNG was provided; fall back to it for both tones.
    light: "/brand/wordmark-one-line-white.png",
    dark: "/brand/wordmark-one-line-white.png",
  },
  display: {
    light: "/brand/display-wordmark-white.png",
    dark: "/brand/display-wordmark-black.png",
  },
};

export default function BrandLogo({
  variant = "lockup",
  tone = "light",
  className = "",
  alt = "Phia Games",
  priority = false,
}: BrandLogoProps) {
  return (
    <img
      src={SRC[variant][tone]}
      alt={alt}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      draggable={false}
      className={`max-w-none select-none object-contain ${className}`}
    />
  );
}
