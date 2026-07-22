import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-bm)", "system-ui", "sans-serif"],
      },
      colors: {
        booze: {
          bg: "#0a0a0f",
          card: "#15151f",
          accent: "#ff4d4d",
          neon: "#00e0ff",
          gold: "#ffd166",
        },
      },
      keyframes: {
        "pour-fill": {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
