import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        pork: {
          red: "rgb(var(--tenant-red) / <alpha-value>)",
          "red-dark": "rgb(var(--tenant-red-dark) / <alpha-value>)",
          peach: "rgb(var(--tenant-peach) / <alpha-value>)",
          cream: "rgb(var(--tenant-cream) / <alpha-value>)",
          ink: "rgb(var(--tenant-ink) / <alpha-value>)",
          brick: "rgb(var(--tenant-brick) / <alpha-value>)",
          mustard: "rgb(var(--tenant-mustard) / <alpha-value>)",
          "mustard-soft": "rgb(var(--tenant-mustard-soft) / <alpha-value>)",
          green: "rgb(var(--tenant-green) / <alpha-value>)",
          pink: "rgb(var(--tenant-pink) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        impact: ["var(--font-impact)", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brick-texture":
          "radial-gradient(ellipse at top, rgba(58,35,32,0.55), transparent 60%), radial-gradient(ellipse at bottom, rgba(20,16,16,0.9), transparent 70%)",
        "paper-rip":
          "linear-gradient(180deg, transparent 0%, transparent 88%, #fff4e6 88%, #fff4e6 100%)",
      },
      keyframes: {
        "slow-zoom": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        "modal-overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "modal-overlay-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(40px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(40px)" },
        },
        "page-fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "slow-zoom": "slow-zoom 14s ease-in-out infinite alternate",
        wiggle: "wiggle 2.5s ease-in-out infinite",
        "modal-overlay-in": "modal-overlay-in 0.22s ease-out both",
        "modal-overlay-out": "modal-overlay-out 0.2s ease-in both",
        "modal-in": "modal-in 0.32s cubic-bezier(0.32,0.72,0,1) both",
        "modal-out": "modal-out 0.22s ease-in both",
        "page-fade-up": "page-fade-up 0.32s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
