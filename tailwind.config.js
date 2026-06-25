/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep sci-fi lab palette — black / blue-black with low-saturation accents.
        void: {
          900: "#04060a",
          800: "#070b12",
          700: "#0b1220",
          600: "#101a2e",
        },
        ink: {
          // Liquid-energy ink, kept desaturated and cool.
          500: "#1b2436",
          400: "#27344c",
        },
        accent: {
          cyan: "#5fd7d2",
          violet: "#8a7cf0",
          silver: "#c7d2e0",
          gold: "#d8b367",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        ultra: "0.34em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(95,215,210,0.18), 0 0 32px -8px rgba(95,215,210,0.35)",
        panel: "0 24px 70px -30px rgba(0,0,0,0.85)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(120,150,190,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(120,150,190,0.045) 1px, transparent 1px)",
        "radial-aurora":
          "radial-gradient(60% 60% at 50% 0%, rgba(95,215,210,0.12), transparent 70%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.9" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 6s linear infinite",
        "pulse-soft": "pulse-soft 5s ease-in-out infinite",
        scan: "scan 7s linear infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
