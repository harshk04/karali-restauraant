import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#fff8f5",
        primary: "#8f4a00",
        background: "#fff8f5",
        "on-surface": "#231a13",
        "on-surface-variant": "#554336",
        "surface-container": "#fdeadf",
        "surface-container-low": "#fff1e9",
        "surface-container-high": "#f7e5d9",
        "outline-variant": "#dcc2b1",
      },
      borderRadius: {
        "karali-card": "32px",
      },
      boxShadow: {
        karali: "0 10px 30px -5px rgba(30,41,59,0.08)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        heading: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
