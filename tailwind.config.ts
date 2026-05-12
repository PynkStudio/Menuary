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
      },
      animation: {
        "slow-zoom": "slow-zoom 14s ease-in-out infinite alternate",
        wiggle: "wiggle 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
