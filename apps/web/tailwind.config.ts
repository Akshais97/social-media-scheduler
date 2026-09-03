import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050507",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "rgba(18, 18, 23, 0.7)",
          foreground: "#f4f4f5",
        },
        border: "rgba(255, 255, 255, 0.08)",
        primary: {
          DEFAULT: "#6366f1",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [],
};

export default config;
