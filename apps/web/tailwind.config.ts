import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        navy: {
          950: "#070D1F",
          900: "#0B132B",
          850: "#141E3C",
          800: "#1C2541",
          700: "#273456",
          600: "#3A4D78",
        },
        brand: {
          cyan: "#06B6D4",
          blue: "#0284C7",
          sky: "#0EA5E9",
          glow: "#38BDF8",
        },
        severity: {
          low: "#10B981",
          moderate: "#F59E0B",
          high: "#F97316",
          critical: "#F43F5E",
        },
        card: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        command: "0 4px 20px -2px rgba(11, 19, 43, 0.08), 0 2px 6px -1px rgba(11, 19, 43, 0.04)",
        "command-lg": "0 10px 30px -4px rgba(11, 19, 43, 0.12), 0 4px 10px -2px rgba(11, 19, 43, 0.06)",
        glow: "0 0 15px rgba(6, 182, 212, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;

