/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F8F7",
        surface: "#FFFFFF",
        ink: "#0E2422",
        muted: "#5C7570",
        line: "#E1EAE7",
        brand: {
          DEFAULT: "#0F5C56",
          dark: "#0A403C",
          light: "#E4F1EF",
        },
        signal: {
          DEFAULT: "#E14F3D",
          light: "#FCE8E5",
        },
        status: {
          low: "#1E8E5A",
          moderate: "#C58A11",
          high: "#E07A2F",
          critical: "#D6402F",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,36,34,0.06), 0 4px 16px rgba(14,36,34,0.05)",
      },
    },
  },
  plugins: [],
};
