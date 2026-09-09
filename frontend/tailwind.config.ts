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
        background: "var(--background)",
        foreground: "var(--foreground)",
        severity: {
          low: {
            bg: "#ecfdf5",
            text: "#065f46",
            border: "#a7f3d0",
          },
          medium: {
            bg: "#eff6ff",
            text: "#1e40af",
            border: "#bfdbfe",
          },
          high: {
            bg: "#fffbeb",
            text: "#92400e",
            border: "#fde68a",
          },
          critical: {
            bg: "#fef2f2",
            text: "#991b1b",
            border: "#fecaca",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
