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
        navy: {
          950: "#071324",
          900: "#0c1b33", // Primary brand navy
          850: "#0f2240",
          800: "#162b4e",
          700: "#1f3a67",
        },
        gold: {
          100: "#fbf6ec",
          200: "#f5e8d1",
          300: "#ebd4ac",
          400: "#deb97b",
          500: "#c5a059", // Primary brand gold
          600: "#b08c45",
          700: "#8e6e30",
        },
        ivory: {
          50: "#fcfbf9",
          100: "#faf9f6",
          200: "#f4f1ea",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        script: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 10px 30px -10px rgba(12, 27, 51, 0.08)",
        "luxury-lg": "0 20px 40px -15px rgba(12, 27, 51, 0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
