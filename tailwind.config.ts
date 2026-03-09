import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          // Pastel green–focused, baby-style palette
          mint: "#c8e6c9",       // soft mint green
          sage: "#a5d6a7",       // sage green
          leaf: "#81c784",       // light leaf green
          seafoam: "#b2dfdb",    // seafoam / teal tint
          cream: "#f1f8e9",      // very light green cream
          butter: "#dcedc8",     // butter lime
          blossom: "#f8bbd9",    // soft baby pink accent
          sky: "#b3e5fc",        // baby blue accent
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
